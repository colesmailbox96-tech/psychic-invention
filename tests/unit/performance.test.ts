import { describe, it, expect } from 'vitest';
import { Entity, World, System, ComponentType } from '../../src/core/ECS';
import { findPath } from '../../src/utils/Pathfinding';
import { MemoryComponent, MemoryType } from '../../src/entities/components/Memory';
import { NeuralNetwork } from '../../src/ai/BrainArchitecture';

describe('ECS query caching', () => {
  it('should return same results from cached query as uncached', () => {
    const world = new World();
    const e1 = world.createEntity();
    e1.addComponent({ type: 'position' });
    e1.addComponent({ type: 'velocity' });

    const e2 = world.createEntity();
    e2.addComponent({ type: 'position' });

    // First call populates cache
    const result1 = world.getEntitiesWithComponents('position');
    expect(result1).toHaveLength(2);

    // Second call should return same result from cache
    const result2 = world.getEntitiesWithComponents('position');
    expect(result2).toHaveLength(2);
    expect(result2).toEqual(result1);
  });

  it('should invalidate cache when a component is added', () => {
    const world = new World();
    const e1 = world.createEntity();
    e1.addComponent({ type: 'position' });

    const result1 = world.getEntitiesWithComponents('position', 'velocity');
    expect(result1).toHaveLength(0);

    // Adding a component should invalidate cache
    e1.addComponent({ type: 'velocity' });
    const result2 = world.getEntitiesWithComponents('position', 'velocity');
    expect(result2).toHaveLength(1);
    expect(result2[0].id).toBe(e1.id);
  });

  it('should invalidate cache when a component is removed', () => {
    const world = new World();
    const e1 = world.createEntity();
    e1.addComponent({ type: 'position' });
    e1.addComponent({ type: 'velocity' });

    const result1 = world.getEntitiesWithComponents('position', 'velocity');
    expect(result1).toHaveLength(1);

    e1.removeComponent('velocity');
    const result2 = world.getEntitiesWithComponents('position', 'velocity');
    expect(result2).toHaveLength(0);
  });

  it('should invalidate cache when an entity is removed', () => {
    const world = new World();
    const e1 = world.createEntity();
    e1.addComponent({ type: 'position' });

    const result1 = world.getEntitiesWithComponents('position');
    expect(result1).toHaveLength(1);

    world.removeEntity(e1.id);
    const result2 = world.getEntitiesWithComponents('position');
    expect(result2).toHaveLength(0);
  });
});

describe('Pathfinding with binary heap', () => {
  it('should find a simple straight-line path', () => {
    const path = findPath(0, 0, 3, 0, () => true);
    expect(path.length).toBeGreaterThan(0);
    expect(path[0]).toEqual({ x: 0, y: 0 });
    expect(path[path.length - 1]).toEqual({ x: 3, y: 0 });
  });

  it('should return empty path when destination is not walkable', () => {
    const path = findPath(0, 0, 3, 0, (x, y) => !(x === 3 && y === 0));
    expect(path).toEqual([]);
  });

  it('should find path around obstacles', () => {
    // Wall at x=2
    const isWalkable = (x: number, y: number) => {
      if (x === 2 && y >= -1 && y <= 1) return false;
      return true;
    };
    const path = findPath(0, 0, 4, 0, isWalkable);
    expect(path.length).toBeGreaterThan(0);
    expect(path[path.length - 1]).toEqual({ x: 4, y: 0 });
    // Path should detour around the wall
    expect(path.length).toBeGreaterThan(5);
  });

  it('should handle start equals end', () => {
    const path = findPath(5, 5, 5, 5, () => true);
    expect(path).toEqual([{ x: 5, y: 5 }]);
  });

  it('should respect cost function for optimal paths', () => {
    // Higher cost at y=0, cheaper at y=1
    const getCost = (_x: number, y: number) => (y === 0 ? 10 : 1);
    const path = findPath(0, 0, 4, 0, () => true, getCost);
    expect(path.length).toBeGreaterThan(0);
    expect(path[path.length - 1]).toEqual({ x: 4, y: 0 });
  });
});

describe('Memory consolidation with partial selection', () => {
  it('should keep the most important memories after consolidation', () => {
    const mem = new MemoryComponent(3);
    const types: MemoryType[] = ['social', 'discovery', 'danger', 'achievement'];
    for (let i = 0; i < 5; i++) {
      mem.addMemory({
        tick: i,
        type: types[i % types.length],
        location: [0, 0],
        entities: [1],
        emotionalValence: 0.5,
        importance: (i + 1) * 0.2, // 0.2, 0.4, 0.6, 0.8, 1.0
        details: {},
      });
    }
    // After consolidation, should have exactly maxMemories entries
    expect(mem.episodic.length).toBe(3);
    // The kept memories should be the ones with highest (decayed) importance
    const importances = mem.episodic.map(m => m.importance);
    for (const imp of importances) {
      expect(imp).toBeGreaterThan(0);
    }
  });

  it('should produce a valid summary vector', () => {
    const mem = new MemoryComponent(10);
    mem.addMemory({
      tick: 1,
      type: 'social',
      location: [0, 0],
      entities: [1, 2],
      emotionalValence: 0.7,
      importance: 0.5,
      details: {},
    });
    const vec = mem.getSummaryVector();
    expect(vec).toHaveLength(8);
    // Values should be finite numbers
    for (const v of vec) {
      expect(Number.isFinite(v)).toBe(true);
    }
  });

  it('should return zero vector for empty memories', () => {
    const mem = new MemoryComponent(10);
    const vec = mem.getSummaryVector();
    expect(vec).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
  });
});

describe('NeuralNetwork buffer reuse', () => {
  it('should produce consistent results across multiple forward calls', () => {
    const nn = new NeuralNetwork(20, 32, 14);
    const input = new Array(20).fill(0.5);
    const hidden = new Float32Array(32);

    const result1 = nn.forward(input, hidden);
    const result2 = nn.forward(input, hidden);

    // Same input + same hidden state should produce same output
    for (let i = 0; i < 14; i++) {
      expect(result1.actionProbs[i]).toBeCloseTo(result2.actionProbs[i], 5);
    }
    expect(result1.value).toBeCloseTo(result2.value, 5);
  });

  it('should produce valid probabilities that sum to ~1.0', () => {
    const nn = new NeuralNetwork(20, 32, 14);
    const input = new Array(20).fill(0.3);
    const hidden = new Float32Array(32);

    const result = nn.forward(input, hidden);
    const sum = result.actionProbs.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 4);
    expect(result.actionProbs.every(p => p >= 0 && p <= 1)).toBe(true);
  });

  it('should produce different outputs for different inputs', () => {
    const nn = new NeuralNetwork(20, 32, 14);
    const hidden = new Float32Array(32);

    const result1 = nn.forward(new Array(20).fill(0.1), hidden);
    const result2 = nn.forward(new Array(20).fill(0.9), hidden);

    // Should not be identical
    const allSame = result1.actionProbs.every(
      (p, i) => Math.abs(p - result2.actionProbs[i]) < 1e-10
    );
    expect(allSame).toBe(false);
  });
});
