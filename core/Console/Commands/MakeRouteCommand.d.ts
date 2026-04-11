import { Command } from '../Command';
import { Application } from '../../Foundation/Application';
export declare class MakeRouteCommand extends Command {
    signature: string;
    description: string;
    protected app: Application;
    constructor(app: Application);
    handle(args: string[]): Promise<void>;
}
//# sourceMappingURL=MakeRouteCommand.d.ts.map