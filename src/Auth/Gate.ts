import { ForbiddenException } from '../Exceptions/HttpExceptions';

export interface Policy {
  viewAny?(user: any): boolean | Promise<boolean>;
  view?(user: any, model: any): boolean | Promise<boolean>;
  create?(user: any): boolean | Promise<boolean>;
  update?(user: any, model: any): boolean | Promise<boolean>;
  delete?(user: any, model: any): boolean | Promise<boolean>;
}

export class Gate {
  private policies: Map<string, Policy> = new Map();

  define(model: string, policy: Policy): void {
    this.policies.set(model, policy);
  }

  async allows(user: any, ability: string, model?: any, ...args: any[]): Promise<boolean> {
    const policy = this.policies.get(model?.constructor?.name || model);
    if (!policy) {
      return false;
    }

    const method = policy[ability as keyof Policy];
    if (typeof method === 'function') {
      if (ability === 'viewAny' || ability === 'create') {
        const r = await (method as any).call(policy, user);
        return !!r;
      }
      const r = await (method as any).call(policy, user, model);
      return !!r;
    }

    return false;
  }

  async denies(user: any, ability: string, model?: any, ...args: any[]): Promise<boolean> {
    return !(await this.allows(user, ability, model, ...args));
  }

  async authorize(user: any, ability: string, model?: any, ...args: any[]): Promise<void> {
    if (!(await this.allows(user, ability, model, ...args))) {
      throw new ForbiddenException('This action is unauthorized.');
    }
  }
}

export const gate = new Gate();