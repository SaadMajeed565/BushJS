import { Command } from '../Command';
import { Application } from '../../Foundation/Application';
export declare class MonitorHealthCommand extends Command {
    signature: string;
    description: string;
    protected app: Application;
    constructor(app: Application);
    handle(): Promise<void>;
}
//# sourceMappingURL=MonitorHealthCommand.d.ts.map