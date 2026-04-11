type Binding = {
  concrete: any;
  singleton: boolean;
};

export class Container {
  private bindings = new Map<string, Binding>();
  private instances = new Map<string, unknown>();

  bind(key: string, concrete: any): void {
    this.bindings.set(key, { concrete, singleton: false });
  }

  singleton(key: string, concrete: any): void {
    this.bindings.set(key, { concrete, singleton: true });
  }

  instance(key: string, value: unknown): void {
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
    const result = typeof concrete === 'function' ? concrete(this) : concrete;

    if (binding.singleton) {
      this.instances.set(key, result);
    }

    return result as T;
  }
}
