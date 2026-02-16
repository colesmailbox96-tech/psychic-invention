import { describe, it, expect, vi } from 'vitest';
import { Entity, World, System, Component, ComponentType } from '../../src/core/ECS';

describe('Entity', () => {
  it('should create an entity with an id', () => {
    const entity = new Entity(1);
    expect(entity.id).toBe(1);
  });

  it('should add and get a component', () => {
    const entity = new Entity(1);
    const component: Component = { type: 'position' };
    entity.addComponent(component);
    expect(entity.getComponent('position')).toBe(component);
  });

  it('should return undefined for missing component', () => {
    const entity = new Entity(1);
    expect(entity.getComponent('missing')).toBeUndefined();
  });

  it('should remove a component', () => {
    const entity = new Entity(1);
    entity.addComponent({ type: 'position' });
    entity.removeComponent('position');
    expect(entity.getComponent('position')).toBeUndefined();
  });

  it('should report hasComponent correctly', () => {
    const entity = new Entity(1);
    expect(entity.hasComponent('position')).toBe(false);
    entity.addComponent({ type: 'position' });
    expect(entity.hasComponent('position')).toBe(true);
  });

  it('should return all components via getComponents', () => {
    const entity = new Entity(1);
    entity.addComponent({ type: 'a' });
    entity.addComponent({ type: 'b' });
    expect(entity.getComponents()).toHaveLength(2);
  });
});

describe('World', () => {
  it('should create entities with incrementing ids', () => {
    const world = new World();
    const e1 = world.createEntity();
    const e2 = world.createEntity();
    expect(e1.id).toBe(1);
    expect(e2.id).toBe(2);
  });

  it('should retrieve an entity by id', () => {
    const world = new World();
    const entity = world.createEntity();
    expect(world.getEntity(entity.id)).toBe(entity);
  });

  it('should return undefined for non-existent entity', () => {
    const world = new World();
    expect(world.getEntity(999)).toBeUndefined();
  });

  it('should remove an entity', () => {
    const world = new World();
    const entity = world.createEntity();
    world.removeEntity(entity.id);
    expect(world.getEntity(entity.id)).toBeUndefined();
  });

  it('should track entity count', () => {
    const world = new World();
    expect(world.entityCount).toBe(0);
    world.createEntity();
    world.createEntity();
    expect(world.entityCount).toBe(2);
    world.removeEntity(1);
    expect(world.entityCount).toBe(1);
  });

  it('should filter entities with getEntitiesWithComponents', () => {
    const world = new World();
    const e1 = world.createEntity();
    e1.addComponent({ type: 'position' });
    e1.addComponent({ type: 'velocity' });

    const e2 = world.createEntity();
    e2.addComponent({ type: 'position' });

    const e3 = world.createEntity();
    e3.addComponent({ type: 'health' });

    const withPosition = world.getEntitiesWithComponents('position');
    expect(withPosition).toHaveLength(2);

    const withBoth = world.getEntitiesWithComponents('position', 'velocity');
    expect(withBoth).toHaveLength(1);
    expect(withBoth[0].id).toBe(e1.id);
  });

  it('should call system update for matching entities', () => {
    const world = new World();
    const e1 = world.createEntity();
    e1.addComponent({ type: 'position' });

    const e2 = world.createEntity();
    e2.addComponent({ type: 'health' });

    const updateFn = vi.fn();

    class TestSystem extends System {
      readonly requiredComponents: ComponentType[] = ['position'];
      update(entities: Entity[], deltaTime: number): void {
        updateFn(entities, deltaTime);
      }
    }

    world.addSystem(new TestSystem());
    world.update(0.016);

    expect(updateFn).toHaveBeenCalledOnce();
    const [entities, dt] = updateFn.mock.calls[0];
    expect(entities).toHaveLength(1);
    expect(entities[0].id).toBe(e1.id);
    expect(dt).toBeCloseTo(0.016);
  });
});
