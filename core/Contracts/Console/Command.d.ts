export interface CommandContract {
    signature: string;
    description: string;
    handle(args: string[]): Promise<void> | void;
}
//# sourceMappingURL=Command.d.ts.map