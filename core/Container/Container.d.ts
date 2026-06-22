type Factory<T = unknown> = (container: Container) => T;
export declare class Container {
    private bindings;
    private instances;
    bind<T>(key: string, concrete: T | Factory<T>): void;
    singleton<T>(key: string, concrete: T | Factory<T>): void;
    instance<T>(key: string, value: T): void;
    make<T>(key: string): T;
    has(key: string): boolean;
    forget(key: string): void;
    flush(): void;
}
export {};
//# sourceMappingURL=Container.d.ts.map