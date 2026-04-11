import fs from 'fs/promises';
import path from 'path';
import { Request } from '../Http/Request';
import { Response } from '../Http/Response';
import { Storage } from '../Storage/Storage';

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
  context?: Record<string, any>;
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

  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  warning(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARNING, message, context);
  }

  error(message: string, context?: Record<string, any>, stack?: string): void {
    this.log(LogLevel.ERROR, message, context, stack);
  }

  critical(message: string, context?: Record<string, any>, stack?: string): void {
    this.log(LogLevel.CRITICAL, message, context, stack);
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>, stack?: string): void {
    // Check if level should be logged
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      stack
    };

    // Console output
    this.logToConsole(entry);

    // File output
    this.logToFile(entry);
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARNING, LogLevel.ERROR, LogLevel.CRITICAL];
    const currentIndex = levels.indexOf(this.logLevel);
    const levelIndex = levels.indexOf(level);
    return levelIndex >= currentIndex;
  }

  private logToConsole(entry: LogEntry): void {
    const colors: Record<LogLevel, string> = {
      [LogLevel.DEBUG]: '\x1b[36m', // cyan
      [LogLevel.INFO]: '\x1b[32m', // green
      [LogLevel.WARNING]: '\x1b[33m', // yellow
      [LogLevel.ERROR]: '\x1b[31m', // red
      [LogLevel.CRITICAL]: '\x1b[35m' // magenta
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
    } catch (error) {
      console.error('Failed to write log file:', error);
    }
  }
}

export class ExceptionHandler {
  private logger: Logger;

  constructor(logger?: Logger) {
    this.logger = logger || new Logger();
  }

  handle(error: any, request: Request, response: Response): void {
    // Log the error
    this.logger.error(
      error.message || 'An error occurred',
      {
        url: request.url(),
        method: request.method,
        ip: request.ip(),
        userAgent: request.header('user-agent')
      },
      error.stack
    );

    // Determine status code
    const statusCode = error.status || error.statusCode || 500;
    const isClientError = statusCode >= 400 && statusCode < 500;
    const isServerError = statusCode >= 500;

    // Build response
    const responseData: Record<string, any> = {
      message: error.message || 'An error occurred',
      status: statusCode
    };

    // Add errors if validation failed
    if (error.errors) {
      responseData.errors = error.errors;
    }

    // Add debug info in development
    if (process.env.NODE_ENV === 'development') {
      responseData.debug = {
        file: error.file,
        line: error.line,
        stack: error.stack?.split('\n')
      };
    }

    response.status(statusCode).json(responseData);
  }

  // Render error page for browser requests
  renderError(error: any, request: Request, response: Response): void {
    const statusCode = error.status || error.statusCode || 500;
    const isDevelopment = process.env.NODE_ENV === 'development';

    if (this.wantJson(request)) {
      return this.handle(error, request, response);
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>${statusCode} Error</title>
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
            <h1>${statusCode}</h1>
            <div class="message">${error.message}</div>
            ${isDevelopment ? `
              <div class="debug">
                <div class="debug-title">Debug Information:</div>
                <pre>${error.stack}</pre>
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

// Global error handler
export const logger = new Logger();
export const exceptionHandler = new ExceptionHandler(logger);
