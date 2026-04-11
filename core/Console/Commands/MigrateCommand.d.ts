import { Command } from '../Command';
import { Application } from '../../Foundation/Application';
export declare class MigrateCommand extends Command {
    signature: string;
    description: string;
    protected app: Application;
    constructor(app: Application);
    handle(args: string[]): Promise<void>;
}
//# sourceMappingURL=MigrateCommand.d.ts.map