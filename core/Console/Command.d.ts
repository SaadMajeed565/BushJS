import { CommandContract } from '../Contracts/Console/Command';
export declare abstract class Command implements CommandContract {
    abstract signature: string;
    abstract description: string;
    abstract handle(args: string[]): Promise<void> | void;
}
//# sourceMappingURL=Command.d.ts.map