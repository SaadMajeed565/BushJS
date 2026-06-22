"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exceptionHandler = exports.logger = exports.ExceptionHandler = exports.Logger = exports.LogLevel = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const Storage_1 = require("../Storage/Storage");
const HttpExceptions_1 = require("../Exceptions/HttpExceptions");
const HttpExceptions_2 = require("../Exceptions/HttpExceptions");
function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
var LogLevel;
(function (LogLevel) {
    LogLevel["DEBUG"] = "debug";
    LogLevel["INFO"] = "info";
    LogLevel["WARNING"] = "warning";
    LogLevel["ERROR"] = "error";
    LogLevel["CRITICAL"] = "critical";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
class Logger {
    constructor(explicitLogDir) {
        this.explicitLogDir = explicitLogDir;
        this.logLevel = LogLevel.DEBUG;
    }
    effectiveLogDir() {
        return this.explicitLogDir ?? Storage_1.Storage.resolvedPath('logs');
    }
    setLevel(level) {
        this.logLevel = level;
    }
    debug(message, context) {
        this.log(LogLevel.DEBUG, message, context);
    }
    info(message, context) {
        this.log(LogLevel.INFO, message, context);
    }
    warning(message, context) {
        this.log(LogLevel.WARNING, message, context);
    }
    error(message, context, stack) {
        this.log(LogLevel.ERROR, message, context, stack);
    }
    critical(message, context, stack) {
        this.log(LogLevel.CRITICAL, message, context, stack);
    }
    log(level, message, context, stack) {
        if (!this.shouldLog(level))
            return;
        const entry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            context,
            stack
        };
        this.logToConsole(entry);
        this.logToFile(entry).catch((err) => process.stderr.write(`LOG WRITE FAILED: ${err}\n`));
    }
    shouldLog(level) {
        const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARNING, LogLevel.ERROR, LogLevel.CRITICAL];
        const currentIndex = levels.indexOf(this.logLevel);
        const levelIndex = levels.indexOf(level);
        return levelIndex >= currentIndex;
    }
    logToConsole(entry) {
        const colors = {
            [LogLevel.DEBUG]: '\x1b[36m',
            [LogLevel.INFO]: '\x1b[32m',
            [LogLevel.WARNING]: '\x1b[33m',
            [LogLevel.ERROR]: '\x1b[31m',
            [LogLevel.CRITICAL]: '\x1b[35m'
        };
        const reset = '\x1b[0m';
        const color = colors[entry.level];
        console.log(`${color}[${entry.timestamp}] ${entry.level.toUpperCase()}${reset}`, entry.message, entry.context ? entry.context : '');
        if (entry.stack) {
            console.error(entry.stack);
        }
    }
    async logToFile(entry) {
        try {
            const logDir = this.effectiveLogDir();
            await promises_1.default.mkdir(logDir, { recursive: true });
            const date = new Date(entry.timestamp).toISOString().split('T')[0];
            const filename = `${entry.level}-${date}.log`;
            const filepath = path_1.default.join(logDir, filename);
            const logLine = JSON.stringify(entry) + '\n';
            await promises_1.default.appendFile(filepath, logLine);
        }
        catch {
            // Silently fail — logging should never crash the app
        }
    }
}
exports.Logger = Logger;
const STATUS_CODES = {
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
function getStatusText(code) {
    return STATUS_CODES[code] ?? 'Error';
}
class ExceptionHandler {
    constructor(logger) {
        this.logger = logger || new Logger();
    }
    handle(error, request, response) {
        const statusCode = error instanceof HttpExceptions_1.HttpException
            ? error.statusCode
            : error?.statusCode ?? 500;
        const message = error instanceof Error
            ? error.message
            : 'An error occurred';
        const errorName = error instanceof Error
            ? error.name
            : 'UnknownError';
        const errors = error instanceof HttpExceptions_2.ValidationException
            ? error.errors
            : error?.errors;
        this.logger.error(`${errorName}: ${message}`, {
            statusCode,
            url: request.url(),
            method: request.method,
            ip: request.ip(),
            userAgent: request.header('user-agent')
        }, error instanceof Error ? error.stack : undefined);
        const responsePayload = {
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
    renderError(error, request, response) {
        const statusCode = error instanceof HttpExceptions_1.HttpException
            ? error.statusCode
            : error?.statusCode ?? 500;
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
    wantJson(request) {
        const accept = request.header('accept') || '';
        return accept.includes('application/json') || request.header('x-requested-with') === 'xmlhttprequest';
    }
}
exports.ExceptionHandler = ExceptionHandler;
exports.logger = new Logger();
exports.exceptionHandler = new ExceptionHandler(exports.logger);
//# sourceMappingURL=ExceptionHandler.js.map