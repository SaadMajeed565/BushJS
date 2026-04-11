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

  allows(user: any, ability: string, model?: any, ...args: any[]): Promise<boolean> {
    const policy = this.policies.get(model?.constructor?.name || model);
    if (!policy) {
      return Promise.resolve(false);
    }

    const method = policy[ability as keyof Policy];
    if (typeof method === 'function') {
      if (ability === 'viewAny' || ability === 'create') {
        return Promise.resolve((method as any).call(policy, user));
      } else {
        return Promise.resolve((method as any).call(policy, user, model));
      }
    }

    return Promise.resolve(false);
  }

  denies(user: any, ability: string, model?: any, ...args: any[]): Promise<boolean> {
    return this.allows(user, ability, model, ...args).then(allowed => !allowed);
  }

  authorize(user: any, ability: string, model?: any, ...args: any[]): void {
    if (!this.allows(user, ability, model, ...args)) {
      throw new Error('Unauthorized');
    }
  }
}

export const gate = new Gate();