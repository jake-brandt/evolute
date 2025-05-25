class DIContainer {
    constructor() {
        this.dependencies = {};
        this.factories = {};
    }

    /**
     * Registers a dependency.
     * @param {string} name - The name of the dependency.
     * @param {any} dependency - The dependency to register.
     */
    register(name, dependency) {
        this.dependencies[name] = dependency;
    }

    /**
     * Registers a factory for creating a dependency.
     * Factories are useful for dependencies that need to be created on demand
     * or have their own dependencies.
     * @param {string} name - The name of the dependency.
     * @param {Function} factory - A function that returns the dependency.
     */
    registerFactory(name, factory) {
        this.factories[name] = factory;
    }

    /**
     * Resolves a dependency.
     * If a factory is registered for the name, it will be used to create the dependency.
     * Otherwise, it will return a previously registered dependency.
     * @param {string} name - The name of the dependency to resolve.
     * @returns {any} The resolved dependency.
     * @throws {Error} If the dependency is not found.
     */
    resolve(name) {
        if (this.factories[name]) {
            // If a factory exists, invoke it and store the result for future calls (singleton behavior for factories)
            if (!this.dependencies[name]) {
                this.dependencies[name] = this.factories[name](this); // Pass container for dependency resolution within factory
            }
            return this.dependencies[name];
        }
        if (this.dependencies[name] !== undefined) {
            return this.dependencies[name];
        }
        throw new Error(`Dependency not found: ${name}`);
    }
}

export default DIContainer;
