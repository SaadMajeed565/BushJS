import { CommandContract } from '../Contracts/Console/Command';

export abstract class Command implements CommandContract {
  abstract signature: string;
  abstract description: string;
  abstract handle(args: string[]): Promise<void> | void;
}
