import mongoose from 'mongoose';
export type QueryCondition = {
    column: string;
    operator: string;
    value: any;
};
export declare class Connection {
    private connectionString;
    private connected;
    constructor(connectionString?: string);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    getConnection(): typeof mongoose;
    isConnected(): boolean;
}
export declare const connection: Connection;
//# sourceMappingURL=Connection.d.ts.map