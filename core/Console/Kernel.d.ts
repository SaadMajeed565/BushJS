import { Application } from '../Foundation/Application';
import { Command } from './Command';
export declare class ConsoleKernel {
    protected app: Application;
    protected commands: Map<string, Command>;
    constructor(app: Application);
    register(command: Command): void;
    protected registerDefaultCommands(): void;
    handle(argv?: string[]): Promise<void>;
    showHelp(): void;
}
//# sourceMappingURL=Kernel.d.ts.map