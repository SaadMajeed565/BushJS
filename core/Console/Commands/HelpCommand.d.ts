import { Command } from '../Command';
export declare class HelpCommand extends Command {
    private readonly showHelp;
    signature: string;
    description: string;
    constructor(showHelp: () => void);
    handle(): Promise<void>;
}
//# sourceMappingURL=HelpCommand.d.ts.map