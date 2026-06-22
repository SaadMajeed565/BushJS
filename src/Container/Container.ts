type Factory<T = unknown> = (container: Container) => T;

type Binding<T = unknown> = {
  concrete: T | Factory<T>;
  singleton: boolean;
};

export class Container {
  private bindings = new Map<string, Binding>();
  private instances = new Map<string, unknown>();

  bind<T>(key: string, concrete: T | Factory<T>): void {
    this.bindings.set(key, { concrete, singleton: false });
  }

  singleton<T>(key: string, concrete: T | Factory<T>): void {
    this.bindings.set(key, { concrete, singleton: true });
  }

  instance<T>(key: string, value: T): void {
    this.instances.set(key, value);
  }

  make<T>(key: string): T {
    if (this.instances.has(key)) {
      return this.instances.get(key) as T;
    }

    const binding = this.bindings.get(key);
    if (!binding) {
      throw new Error(`Container entry [${key}] not found.`);
    }

    const concrete = binding.concrete;
    const result = typeof concrete === 'function'
      ? (concrete as Factory<T>)(this)
      : concrete;

    if (binding.singleton) {
      this.instances.set(key, result);
    }

    return result as T;
  }

  has(key: string): boolean {
    return this.bindings.has(key) || this.instances.has(key);
  }

  forget(key: string): void {
    this.bindings.delete(key);
    this.instances.delete(key);
  }

  flush(): void {
    this.bindings.clear();
    this.instances.clear();
  }
}
