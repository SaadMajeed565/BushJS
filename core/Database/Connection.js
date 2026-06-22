"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Connection = void 0;
exports.setDefaultConnection = setDefaultConnection;
exports.getDefaultConnection = getDefaultConnection;
const mongoose_1 = __importDefault(require("mongoose"));
const Config_1 = require("../Config/Config");
const ExceptionHandler_1 = require("../Foundation/ExceptionHandler");
const DEFAULT_RECONNECT_INTERVAL = 5000;
const DEFAULT_RECONNECT_RETRIES = 10;
let defaultConnection = null;
function setDefaultConnection(conn) {
    defaultConnection = conn;
}
function getDefaultConnection() {
    if (!defaultConnection) {
        throw new Error('No default database connection. Create an Application first or call setDefaultConnection().');
    }
    return defaultConnection;
}
class Connection {
    constructor(connectionString = 'mongodb://localhost:27017/bushjs', options) {
        this.connected = false;
        this.reconnectTimer = null;
        this.reconnectAttempts = 0;
        this.disconnectRequested = false;
        this.onDisconnected = null;
        this.onError = null;
        this.connectionString = connectionString;
        this.reconnectMaxRetries = options?.reconnectRetries ?? DEFAULT_RECONNECT_RETRIES;
        this.reconnectIntervalMs = options?.reconnectInterval ?? DEFAULT_RECONNECT_INTERVAL;
    }
    async connect() {
        if (this.connected) {
            return;
        }
        this.disconnectRequested = false;
        try {
            const poolOptions = Config_1.config.database?.pool ?? { max: 10, min: 2 };
            await mongoose_1.default.connect(this.connectionString, {
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
                maxPoolSize: poolOptions.max,
                minPoolSize: poolOptions.min,
            });
            this.connected = true;
            this.reconnectAttempts = 0;
            ExceptionHandler_1.logger.info('Connected to MongoDB');
            this.onDisconnected = () => {
                this.connected = false;
                if (!this.disconnectRequested) {
                    this.scheduleReconnect();
                }
            };
            mongoose_1.default.connection.on('disconnected', this.onDisconnected);
            this.onError = (err) => {
                ExceptionHandler_1.logger.error('MongoDB connection error', { error: err.message });
                this.connected = false;
            };
            mongoose_1.default.connection.on('error', this.onError);
        }
        catch (error) {
            this.connected = false;
            ExceptionHandler_1.logger.error('MongoDB connection error', { error: error.message });
            this.scheduleReconnect();
            throw error;
        }
    }
    async disconnect() {
        this.disconnectRequested = true;
        this.clearReconnect();
        this.cleanupListeners();
        if (this.connected) {
            this.connected = false;
            await mongoose_1.default.disconnect();
        }
    }
    cleanupListeners() {
        if (this.onDisconnected) {
            mongoose_1.default.connection.off('disconnected', this.onDisconnected);
            this.onDisconnected = null;
        }
        if (this.onError) {
            mongoose_1.default.connection.off('error', this.onError);
            this.onError = null;
        }
    }
    getConnection() {
        return mongoose_1.default;
    }
    isConnected() {
        return this.connected && mongoose_1.default.connection.readyState === 1;
    }
    scheduleReconnect() {
        if (this.disconnectRequested) {
            return;
        }
        if (this.reconnectAttempts >= this.reconnectMaxRetries) {
            ExceptionHandler_1.logger.error(`MongoDB: Max reconnection attempts (${this.reconnectMaxRetries}) reached. Giving up.`);
            return;
        }
        this.clearReconnect();
        this.reconnectAttempts++;
        const delay = Math.min(this.reconnectIntervalMs * Math.pow(2, this.reconnectAttempts - 1), 30000);
        ExceptionHandler_1.logger.info(`MongoDB: Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.reconnectMaxRetries})...`);
        this.reconnectTimer = setTimeout(async () => {
            try {
                await this.connect();
            }
            catch {
                // connect() already logs and schedules next retry
            }
        }, delay);
    }
    clearReconnect() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }
}
exports.Connection = Connection;
//# sourceMappingURL=Connection.js.map