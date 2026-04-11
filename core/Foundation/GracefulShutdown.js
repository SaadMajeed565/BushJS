"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GracefulShutdown = void 0;
exports.setupGracefulShutdown = setupGracefulShutdown;
const mongoose_1 = __importDefault(require("mongoose"));
const ExceptionHandler_1 = require("./ExceptionHandler");
class GracefulShutdown {
    constructor() {
        this.shutdownTimeout = null;
        this.shutdownInProgress = false;
    }
    async handle(signal) {
        if (this.shutdownInProgress) {
            ExceptionHandler_1.logger.warning(`Shutdown already in progress, forcing exit`);
            process.exit(1);
        }
        this.shutdownInProgress = true;
        ExceptionHandler_1.logger.info(`${signal} received, starting graceful shutdown...`);
        // Set a timeout for forced shutdown after 30 seconds
        this.shutdownTimeout = setTimeout(() => {
            ExceptionHandler_1.logger.critical('Graceful shutdown timeout, forcing exit');
            process.exit(1);
        }, 30000);
        try {
            // Close database connections
            await this.closeDatabaseConnection();
            // Close other connections if needed
            await this.closeOtherConnections();
            ExceptionHandler_1.logger.info('Graceful shutdown completed successfully');
            process.exit(0);
        }
        catch (error) {
            ExceptionHandler_1.logger.error('Error during graceful shutdown', {}, error.stack);
            process.exit(1);
        }
    }
    async closeDatabaseConnection() {
        try {
            if (mongoose_1.default.connection.readyState === 1) {
                ExceptionHandler_1.logger.info('Closing database connections...');
                await mongoose_1.default.connection.close();
                ExceptionHandler_1.logger.info('Database connections closed');
            }
        }
        catch (error) {
            ExceptionHandler_1.logger.error('Error closing database connection', {}, error.stack);
            throw error;
        }
    }
    async closeOtherConnections() {
        // Add other connection closures here as needed
        // For example: Redis, message queues, etc.
        ExceptionHandler_1.logger.info('Closing other connections...');
    }
}
exports.GracefulShutdown = GracefulShutdown;
function setupGracefulShutdown() {
    const shutdown = new GracefulShutdown();
    // Handle different shutdown signals
    const signals = ['SIGTERM', 'SIGINT'];
    signals.forEach(signal => {
        process.on(signal, () => shutdown.handle(signal));
    });
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
        ExceptionHandler_1.logger.critical('Uncaught Exception', {}, error.stack);
        shutdown.handle('uncaughtException');
    });
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason) => {
        ExceptionHandler_1.logger.critical('Unhandled Rejection', { reason: String(reason) });
        shutdown.handle('unhandledRejection');
    });
}
//# sourceMappingURL=GracefulShutdown.js.map