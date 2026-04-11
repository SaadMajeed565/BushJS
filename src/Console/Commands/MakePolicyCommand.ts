import fs from 'fs/promises';
import path from 'path';
import { Command } from '../Command';
import { Application } from '../../Foundation/Application';

export class MakePolicyCommand extends Command {
  signature = 'make:policy';
  description = 'Create a new policy class.';
  protected app: Application;

  constructor(app: Application) {
    super();
    this.app = app;
  }

  async handle(args: string[]): Promise<void> {
    const name = args[0];
    if (!name) {
      console.log('Please provide a policy name.');
      return;
    }

    const policyPath = path.resolve(this.app.basePath, 'app', 'Policies', `${name}Policy.ts`);
    await fs.mkdir(path.dirname(policyPath), { recursive: true });

    const stubsPath = path.resolve(__dirname, '../stubs');
    let policyStub = await fs.readFile(path.join(stubsPath, 'policy.stub'), 'utf-8');
    policyStub = policyStub.replace(/{{class}}/g, name);

    await fs.writeFile(policyPath, policyStub);
    console.log(`Policy created at ${policyPath}`);
  }
}
