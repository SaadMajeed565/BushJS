export declare class Container {
    private bindings;
    private instances;
    bind(key: string, concrete: any): void;
    singleton(key: string, concrete: any): void;
    instance(key: string, value: unknown): void;
    make<T>(key: string): T;
}
//# sourceMappingURL=Container.d.ts.map