import mongoose from 'mongoose';
import { logger } from './ExceptionHandler';

export class GracefulShutdown {
  private shutdownTimeout: NodeJS.Timeout | null = null;
  private shutdownInProgress = false;

  async handle(signal: string): Promise<void> {
    if (this.shutdownInProgress) {
      logger.warning(`Shutdown already in progress, forcing exit`);
      process.exit(1);
    }

    this.shutdownInProgress = true;
    logger.info(`${signal} received, starting graceful shutdown...`);

    // Set a timeout for forced shutdown after 30 seconds
    this.shutdownTimeout = setTimeout(() => {
      logger.critical('Graceful shutdown timeout, forcing exit');
      process.exit(1);
    }, 30000);

    try {
      // Close database connections
      await this.closeDatabaseConnection();

      // Close other connections if needed
      await this.closeOtherConnections();

      logger.info('Graceful shutdown completed successfully');
      process.exit(0);
    } catch (error: any) {
      logger.error('Error during graceful shutdown', {}, error.stack);
      process.exit(1);
    }
  }

  private async closeDatabaseConnection(): Promise<void> {
    try {
      if (mongoose.connection.readyState === 1) {
        logger.info('Closing database connections...');
        await mongoose.connection.close();
        logger.info('Database connections closed');
      }
    } catch (error: any) {
      logger.error('Error closing database connection', {}, error.stack);
      throw error;
    }
  }

  private async closeOtherConnections(): Promise<void> {
    // Add other connection closures here as needed
    // For example: Redis, message queues, etc.
    logger.info('Closing other connections...');
  }
}

export function setupGracefulShutdown(): void {
  const shutdown = new GracefulShutdown();

  // Handle different shutdown signals
  const signals = ['SIGTERM', 'SIGINT'];

  signals.forEach(signal => {
    process.on(signal, () => shutdown.handle(signal));
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.critical('Uncaught Exception', {}, error.stack);
    shutdown.handle('uncaughtException');
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason) => {
    logger.critical('Unhandled Rejection', { reason: String(reason) });
    shutdown.handle('unhandledRejection');
  });
}
