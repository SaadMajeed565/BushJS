export interface CommandContract {
  signature: string;
  description: string;
  handle(args: string[]): Promise<void> | void;
}
