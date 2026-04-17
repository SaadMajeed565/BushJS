export interface Policy {
    viewAny?(user: any): boolean | Promise<boolean>;
    view?(user: any, model: any): boolean | Promise<boolean>;
    create?(user: any): boolean | Promise<boolean>;
    update?(user: any, model: any): boolean | Promise<boolean>;
    delete?(user: any, model: any): boolean | Promise<boolean>;
}
export declare class Gate {
    private policies;
    define(model: string, policy: Policy): void;
    allows(user: any, ability: string, model?: any, ...args: any[]): Promise<boolean>;
    denies(user: any, ability: string, model?: any, ...args: any[]): Promise<boolean>;
    authorize(user: any, ability: string, model?: any, ...args: any[]): Promise<void>;
}
export declare const gate: Gate;
//# sourceMappingURL=Gate.d.ts.map