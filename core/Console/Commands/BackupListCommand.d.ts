import { Command } from '../Command';
import { Application } from '../../Foundation/Application';
export declare class BackupListCommand extends Command {
    signature: string;
    description: string;
    protected app: Application;
    constructor(app: Application);
    handle(): Promise<void>;
}
//# sourceMappingURL=BackupListCommand.d.ts.map