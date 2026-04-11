"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Container = void 0;
class Container {
    constructor() {
        this.bindings = new Map();
        this.instances = new Map();
    }
    bind(key, concrete) {
        this.bindings.set(key, { concrete, singleton: false });
    }
    singleton(key, concrete) {
        this.bindings.set(key, { concrete, singleton: true });
    }
    instance(key, value) {
        this.instances.set(key, value);
    }
    make(key) {
        if (this.instances.has(key)) {
            return this.instances.get(key);
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
        return result;
    }
}
exports.Container = Container;
//# sourceMappingURL=Container.js.map