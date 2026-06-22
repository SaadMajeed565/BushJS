import mongoose from 'mongoose';
export type QueryCondition = {
    column: string;
    operator: string;
    value: unknown;
};
export declare function setDefaultConnection(conn: Connection): void;
export declare function getDefaultConnection(): Connection;
export declare class Connection {
    private connectionString;
    private connected;
    private reconnectTimer;
    private reconnectAttempts;
    private reconnectMaxRetries;
    private reconnectIntervalMs;
    private disconnectRequested;
    private onDisconnected;
    private onError;
    constructor(connectionString?: string, options?: {
        reconnectRetries?: number;
        reconnectInterval?: number;
    });
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    private cleanupListeners;
    getConnection(): typeof mongoose;
    isConnected(): boolean;
    private scheduleReconnect;
    private clearReconnect;
}
//# sourceMappingURL=Connection.d.ts.map