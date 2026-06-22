import fs from 'fs/promises';
import path from 'path';
import { Request } from '../Http/Request';
import { Response } from '../Http/Response';
import { Storage } from '../Storage/Storage';
import { HttpException } from '../Exceptions/HttpExceptions';
import { ValidationException } from '../Exceptions/HttpExceptions';

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  stack?: string;
}

export class Logger {
  private logLevel: LogLevel = LogLevel.DEBUG;

  constructor(private readonly explicitLogDir?: string) {}

  private effectiveLogDir(): string {
    return this.explicitLogDir ?? Storage.resolvedPath('logs');
  }

  setLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, context);
  }

  warning(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.WARNING, message, context);
  }

  error(message: string, context?: Record<string, unknown>, stack?: string): void {
    this.log(LogLevel.ERROR, message, context, stack);
  }

  critical(message: string, context?: Record<string, unknown>, stack?: string): void {
    this.log(LogLevel.CRITICAL, message, context, stack);
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>, stack?: string): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      stack
    };

    this.logToConsole(entry);
    this.logToFile(entry).catch((err) => process.stderr.write(`LOG WRITE FAILED: ${err}\n`));
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARNING, LogLevel.ERROR, LogLevel.CRITICAL];
    const currentIndex = levels.indexOf(this.logLevel);
    const levelIndex = levels.indexOf(level);
    return levelIndex >= currentIndex;
  }

  private logToConsole(entry: LogEntry): void {
    const colors: Record<LogLevel, string> = {
      [LogLevel.DEBUG]: '\x1b[36m',
      [LogLevel.INFO]: '\x1b[32m',
      [LogLevel.WARNING]: '\x1b[33m',
      [LogLevel.ERROR]: '\x1b[31m',
      [LogLevel.CRITICAL]: '\x1b[35m'
    };

    const reset = '\x1b[0m';
    const color = colors[entry.level];

    console.log(
      `${color}[${entry.timestamp}] ${entry.level.toUpperCase()}${reset}`,
      entry.message,
      entry.context ? entry.context : ''
    );

    if (entry.stack) {
      console.error(entry.stack);
    }
  }

  private async logToFile(entry: LogEntry): Promise<void> {
    try {
      const logDir = this.effectiveLogDir();
      await fs.mkdir(logDir, { recursive: true });

      const date = new Date(entry.timestamp).toISOString().split('T')[0];
      const filename = `${entry.level}-${date}.log`;
      const filepath = path.join(logDir, filename);

      const logLine = JSON.stringify(entry) + '\n';
      await fs.appendFile(filepath, logLine);
    } catch {
      // Silently fail — logging should never crash the app
    }
  }
}

const STATUS_CODES: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthenticated',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  409: 'Conflict',
  422: 'Validation Failed',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
  503: 'Service Unavailable',
};

function getStatusText(code: number): string {
  return STATUS_CODES[code] ?? 'Error';
}

export class ExceptionHandler {
  private logger: Logger;

  constructor(logger?: Logger) {
    this.logger = logger || new Logger();
  }

  handle(error: unknown, request: Request, response: Response): void {
    const statusCode = error instanceof HttpException
      ? error.statusCode
      : (error as Record<string, unknown>)?.statusCode as number ?? 500;

    const message = error instanceof Error
      ? error.message
      : 'An error occurred';

    const errorName = error instanceof Error
      ? error.name
      : 'UnknownError';

    const errors = error instanceof ValidationException
      ? error.errors
      : (error as Record<string, unknown>)?.errors as Record<string, string[]> | undefined;

    this.logger.error(
      `${errorName}: ${message}`,
      {
        statusCode,
        url: request.url(),
        method: request.method,
        ip: request.ip(),
        userAgent: request.header('user-agent')
      },
      error instanceof Error ? error.stack : undefined
    );

    const responsePayload: Record<string, unknown> = {
      message: statusCode >= 500 && process.env.NODE_ENV === 'production'
        ? getStatusText(statusCode)
        : message,
      status: statusCode,
    };

    if (errors && Object.keys(errors).length > 0) {
      responsePayload.errors = errors;
    }

    if (process.env.NODE_ENV !== 'production' && error instanceof Error) {
      responsePayload.debug = {
        type: error.name,
        stack: error.stack?.split('\n').map(l => l.trim()),
      };
    }

    response.status(statusCode).json(responsePayload);
  }

  renderError(error: unknown, request: Request, response: Response): void {
    const statusCode = error instanceof HttpException
      ? error.statusCode
      : (error as Record<string, unknown>)?.statusCode as number ?? 500;

    const isDevelopment = process.env.NODE_ENV !== 'production';

    if (this.wantJson(request)) {
      return this.handle(error, request, response);
    }

    const message = error instanceof Error ? error.message : 'An error occurred';
    const stack = error instanceof Error ? error.stack : undefined;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>${statusCode} - ${getStatusText(statusCode)}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: #333;
              margin: 0;
              padding: 0;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .container {
              background: white;
              border-radius: 8px;
              box-shadow: 0 10px 40px rgba(0,0,0,0.1);
              padding: 40px;
              max-width: 600px;
              text-align: center;
            }
            h1 {
              font-size: 48px;
              margin: 0 0 10px 0;
              color: #667eea;
            }
            .status-text {
              font-size: 14px;
              color: #999;
              text-transform: uppercase;
              letter-spacing: 2px;
              margin-bottom: 5px;
            }
            .message {
              font-size: 18px;
              color: #666;
              margin: 20px 0;
            }
            .debug {
              background: #f5f5f5;
              border-left: 4px solid #ff6b6b;
              padding: 15px;
              margin-top: 20px;
              text-align: left;
              border-radius: 4px;
              font-family: monospace;
              font-size: 12px;
              color: #333;
              max-height: 400px;
              overflow-y: auto;
            }
            .debug-title {
              font-weight: bold;
              margin-bottom: 10px;
              color: #ff6b6b;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="status-text">${getStatusText(statusCode)}</div>
            <h1>${statusCode}</h1>
            <div class="message">${isDevelopment ? escapeHtml(message) : getStatusText(statusCode)}</div>
            ${isDevelopment && stack ? `
              <div class="debug">
                <div class="debug-title">Debug Information:</div>
                <pre>${escapeHtml(stack)}</pre>
              </div>
            ` : ''}
          </div>
        </body>
      </html>
    `;

    response.status(statusCode).html(html);
  }

  private wantJson(request: Request): boolean {
    const accept = request.header('accept') || '';
    return accept.includes('application/json') || request.header('x-requested-with') === 'xmlhttprequest';
  }
}

export const logger = new Logger();
export const exceptionHandler = new ExceptionHandler(logger);
