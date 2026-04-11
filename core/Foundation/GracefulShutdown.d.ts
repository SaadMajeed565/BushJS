export declare class GracefulShutdown {
    private shutdownTimeout;
    private shutdownInProgress;
    handle(signal: string): Promise<void>;
    private closeDatabaseConnection;
    private closeOtherConnections;
}
export declare function setupGracefulShutdown(): void;
//# sourceMappingURL=GracefulShutdown.d.ts.map