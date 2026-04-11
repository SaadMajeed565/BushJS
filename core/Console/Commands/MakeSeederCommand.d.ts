import { Command } from '../Command';
import { Application } from '../../Foundation/Application';
export declare class MakeSeederCommand extends Command {
    signature: string;
    description: string;
    protected app: Application;
    constructor(app: Application);
    handle(args: string[]): Promise<void>;
}
//# sourceMappingURL=MakeSeederCommand.d.ts.map