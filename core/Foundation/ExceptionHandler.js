"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exceptionHandler = exports.logger = exports.ExceptionHandler = exports.Logger = exports.LogLevel = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const Storage_1 = require("../Storage/Storage");
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
        // Check if level should be logged
        if (!this.shouldLog(level))
            return;
        const entry = {
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
    shouldLog(level) {
        const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARNING, LogLevel.ERROR, LogLevel.CRITICAL];
        const currentIndex = levels.indexOf(this.logLevel);
        const levelIndex = levels.indexOf(level);
        return levelIndex >= currentIndex;
    }
    logToConsole(entry) {
        const colors = {
            [LogLevel.DEBUG]: '\x1b[36m', // cyan
            [LogLevel.INFO]: '\x1b[32m', // green
            [LogLevel.WARNING]: '\x1b[33m', // yellow
            [LogLevel.ERROR]: '\x1b[31m', // red
            [LogLevel.CRITICAL]: '\x1b[35m' // magenta
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
        catch (error) {
            console.error('Failed to write log file:', error);
        }
    }
}
exports.Logger = Logger;
class ExceptionHandler {
    constructor(logger) {
        this.logger = logger || new Logger();
    }
    handle(error, request, response) {
        // Log the error
        this.logger.error(error.message || 'An error occurred', {
            url: request.url(),
            method: request.method,
            ip: request.ip(),
            userAgent: request.header('user-agent')
        }, error.stack);
        // Determine status code
        const statusCode = error.status || error.statusCode || 500;
        const isClientError = statusCode >= 400 && statusCode < 500;
        const isServerError = statusCode >= 500;
        // Build response
        const responseData = {
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
    renderError(error, request, response) {
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
    wantJson(request) {
        const accept = request.header('accept') || '';
        return accept.includes('application/json') || request.header('x-requested-with') === 'xmlhttprequest';
    }
}
exports.ExceptionHandler = ExceptionHandler;
// Global error handler
exports.logger = new Logger();
exports.exceptionHandler = new ExceptionHandler(exports.logger);
//# sourceMappingURL=ExceptionHandler.js.map