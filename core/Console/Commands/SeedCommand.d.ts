import { Command } from '../Command';
import { Application } from '../../Foundation/Application';
export declare class SeedCommand extends Command {
    signature: string;
    description: string;
    protected app: Application;
    constructor(app: Application);
    handle(args: string[]): Promise<void>;
}
//# sourceMappingURL=SeedCommand.d.ts.map