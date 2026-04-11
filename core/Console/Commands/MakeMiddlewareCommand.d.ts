import { Command } from '../Command';
import { Application } from '../../Foundation/Application';
export declare class MakeMiddlewareCommand extends Command {
    signature: string;
    description: string;
    protected app: Application;
    constructor(app: Application);
    handle(args: string[]): Promise<void>;
}
//# sourceMappingURL=MakeMiddlewareCommand.d.ts.map