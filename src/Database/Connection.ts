import mongoose from 'mongoose';
import { config } from '../Config/Config';
import { logger } from '../Foundation/ExceptionHandler';

export type QueryCondition = {
  column: string;
  operator: string;
  value: unknown;
};

const DEFAULT_RECONNECT_INTERVAL = 5000;
const DEFAULT_RECONNECT_RETRIES = 10;

let defaultConnection: Connection | null = null;

export function setDefaultConnection(conn: Connection): void {
  defaultConnection = conn;
}

export function getDefaultConnection(): Connection {
  if (!defaultConnection) {
    throw new Error(
      'No default database connection. Create an Application first or call setDefaultConnection().'
    );
  }
  return defaultConnection;
}

export class Connection {
  private connectionString: string;
  private connected = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private reconnectMaxRetries: number;
  private reconnectIntervalMs: number;
  private disconnectRequested = false;
  private onDisconnected: (() => void) | null = null;
  private onError: ((err: any) => void) | null = null;

  constructor(
    connectionString = 'mongodb://localhost:27017/bushjs',
    options?: { reconnectRetries?: number; reconnectInterval?: number }
  ) {
    this.connectionString = connectionString;
    this.reconnectMaxRetries = options?.reconnectRetries ?? DEFAULT_RECONNECT_RETRIES;
    this.reconnectIntervalMs = options?.reconnectInterval ?? DEFAULT_RECONNECT_INTERVAL;
  }

  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    this.disconnectRequested = false;

    try {
      const poolOptions = config.database?.pool ?? { max: 10, min: 2 };
      await mongoose.connect(this.connectionString, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        maxPoolSize: poolOptions.max,
        minPoolSize: poolOptions.min,
      });
      this.connected = true;
      this.reconnectAttempts = 0;
      logger.info('Connected to MongoDB');

      this.onDisconnected = () => {
        this.connected = false;
        if (!this.disconnectRequested) {
          this.scheduleReconnect();
        }
      };
      mongoose.connection.on('disconnected', this.onDisconnected);

      this.onError = (err) => {
        logger.error('MongoDB connection error', { error: (err as Error).message });
        this.connected = false;
      };
      mongoose.connection.on('error', this.onError);
    } catch (error) {
      this.connected = false;
      logger.error('MongoDB connection error', { error: (error as Error).message });
      this.scheduleReconnect();
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this.disconnectRequested = true;
    this.clearReconnect();

    this.cleanupListeners();

    if (this.connected) {
      this.connected = false;
      await mongoose.disconnect();
    }
  }

  private cleanupListeners(): void {
    if (this.onDisconnected) {
      mongoose.connection.off('disconnected', this.onDisconnected);
      this.onDisconnected = null;
    }
    if (this.onError) {
      mongoose.connection.off('error', this.onError);
      this.onError = null;
    }
  }

  getConnection(): typeof mongoose {
    return mongoose;
  }

  isConnected(): boolean {
    return this.connected && mongoose.connection.readyState === 1;
  }

  private scheduleReconnect(): void {
    if (this.disconnectRequested) {
      return;
    }

    if (this.reconnectAttempts >= this.reconnectMaxRetries) {
      logger.error(`MongoDB: Max reconnection attempts (${this.reconnectMaxRetries}) reached. Giving up.`);
      return;
    }

    this.clearReconnect();

    this.reconnectAttempts++;
    const delay = Math.min(
      this.reconnectIntervalMs * Math.pow(2, this.reconnectAttempts - 1),
      30000
    );

    logger.info(`MongoDB: Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.reconnectMaxRetries})...`);

    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.connect();
      } catch {
        // connect() already logs and schedules next retry
      }
    }, delay);
  }

  private clearReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}
