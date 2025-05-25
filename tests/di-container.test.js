// tests/di-container.test.js
import DIContainer from '../src/di-container.js';

describe('DIContainer', () => {
    let container;

    beforeEach(() => {
        container = new DIContainer();
    });

    test('should register and resolve a direct dependency', () => {
        const myService = { name: 'MyService' };
        container.register('serviceA', myService);
        expect(container.resolve('serviceA')).toBe(myService);
    });

    test('should register and resolve a dependency using a factory', () => {
        const factory = jest.fn(() => ({ name: 'MyFactoryService' }));
        container.registerFactory('serviceB', factory);
        
        const instance1 = container.resolve('serviceB');
        expect(factory).toHaveBeenCalledTimes(1);
        expect(instance1.name).toBe('MyFactoryService');

        // Should return the same instance (singleton behavior for factories)
        const instance2 = container.resolve('serviceB');
        expect(factory).toHaveBeenCalledTimes(1); // Factory not called again
        expect(instance2).toBe(instance1);
    });

    test('should pass the container to the factory function', () => {
        container.register('config', { setting: 'testValue' });
        const factory = jest.fn((c) => ({
            name: 'ServiceWithDeps',
            configSetting: c.resolve('config').setting
        }));
        container.registerFactory('serviceC', factory);

        const instance = container.resolve('serviceC');
        expect(factory).toHaveBeenCalledWith(container);
        expect(instance.name).toBe('ServiceWithDeps');
        expect(instance.configSetting).toBe('testValue');
    });

    test('should throw an error if dependency is not found', () => {
        expect(() => container.resolve('nonExistent')).toThrow('Dependency not found: nonExistent');
    });
});
