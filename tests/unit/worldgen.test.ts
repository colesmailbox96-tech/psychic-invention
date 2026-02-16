import { describe, it, expect } from 'vitest';
import { WorldGenerator } from '../../src/world/WorldGenerator';
import { TileMap, BiomeType } from '../../src/world/TileMap';
import { RNG } from '../../src/utils/RNG';
import { NoiseGenerator } from '../../src/utils/NoiseGenerator';

describe('WorldGenerator', () => {
  const width = 32;
  const height = 32;

  it('should create a TileMap with correct dimensions', () => {
    const gen = new WorldGenerator(42);
    const map = gen.generate(width, height);
    expect(map.width).toBe(width);
    expect(map.height).toBe(height);
  });

  it('should assign valid biomes to all tiles', () => {
    const gen = new WorldGenerator(42);
    const map = gen.generate(width, height);
    const validBiomes = Object.values(BiomeType);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const tile = map.getTile(x, y)!;
        expect(validBiomes).toContain(tile.biome);
      }
    }
  });

  it('should have elevation, moisture, temperature in [0,1] for all tiles', () => {
    const gen = new WorldGenerator(42);
    const map = gen.generate(width, height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const tile = map.getTile(x, y)!;
        expect(tile.elevation).toBeGreaterThanOrEqual(-1e-6);
        expect(tile.elevation).toBeLessThanOrEqual(1 + 1e-6);
        expect(tile.moisture).toBeGreaterThanOrEqual(-1e-6);
        expect(tile.moisture).toBeLessThanOrEqual(1 + 1e-6);
        expect(tile.temperature).toBeGreaterThanOrEqual(-1e-6);
        expect(tile.temperature).toBeLessThanOrEqual(1 + 1e-6);
      }
    }
  });

  it('should mark water tiles as not walkable', () => {
    const gen = new WorldGenerator(42);
    const map = gen.generate(64, 64);
    for (let y = 0; y < 64; y++) {
      for (let x = 0; x < 64; x++) {
        const tile = map.getTile(x, y)!;
        if (tile.type === 4 /* WATER */ || tile.type === 7 /* DEEP_WATER */) {
          expect(tile.walkable).toBe(false);
        }
      }
    }
  });

  it('should generate diverse biomes (not all the same)', () => {
    const gen = new WorldGenerator(42);
    const map = gen.generate(64, 64);
    const biomes = new Set<string>();
    for (let y = 0; y < 64; y++) {
      for (let x = 0; x < 64; x++) {
        biomes.add(map.getTile(x, y)!.biome);
      }
    }
    expect(biomes.size).toBeGreaterThan(1);
  });
});

describe('TileMap', () => {
  it('should report isInBounds correctly', () => {
    const map = new TileMap(10, 10);
    expect(map.isInBounds(0, 0)).toBe(true);
    expect(map.isInBounds(9, 9)).toBe(true);
    expect(map.isInBounds(-1, 0)).toBe(false);
    expect(map.isInBounds(0, -1)).toBe(false);
    expect(map.isInBounds(10, 0)).toBe(false);
    expect(map.isInBounds(0, 10)).toBe(false);
  });

  it('should return null for out of bounds getTile', () => {
    const map = new TileMap(10, 10);
    expect(map.getTile(-1, 0)).toBeNull();
    expect(map.getTile(10, 5)).toBeNull();
    expect(map.getTile(5, 10)).toBeNull();
  });

  it('should return a tile for in-bounds coordinates', () => {
    const map = new TileMap(10, 10);
    const tile = map.getTile(5, 5);
    expect(tile).not.toBeNull();
  });
});

describe('RNG', () => {
  it('should produce same results with same seed', () => {
    const rng1 = new RNG(12345);
    const rng2 = new RNG(12345);
    for (let i = 0; i < 100; i++) {
      expect(rng1.next()).toBe(rng2.next());
    }
  });

  it('should produce different results with different seeds', () => {
    const rng1 = new RNG(111);
    const rng2 = new RNG(222);
    const results1: number[] = [];
    const results2: number[] = [];
    for (let i = 0; i < 10; i++) {
      results1.push(rng1.next());
      results2.push(rng2.next());
    }
    expect(results1).not.toEqual(results2);
  });

  it('should produce values in [0, 1)', () => {
    const rng = new RNG(42);
    for (let i = 0; i < 1000; i++) {
      const val = rng.next();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });
});

describe('NoiseGenerator', () => {
  it('should produce values in expected range with noiseMap', () => {
    const noise = new NoiseGenerator(42);
    const map = noise.noiseMap(16, 16, 10, 2, 0.5, 2.0, 0, 0);
    for (let i = 0; i < map.length; i++) {
      expect(map[i]).toBeGreaterThanOrEqual(-1e-6);
      expect(map[i]).toBeLessThanOrEqual(1 + 1e-6);
    }
  });

  it('should produce deterministic output for the same seed', () => {
    const n1 = new NoiseGenerator(42);
    const n2 = new NoiseGenerator(42);
    const m1 = n1.noiseMap(8, 8, 10, 2, 0.5, 2.0, 0, 0);
    const m2 = n2.noiseMap(8, 8, 10, 2, 0.5, 2.0, 0, 0);
    for (let i = 0; i < m1.length; i++) {
      expect(m1[i]).toBe(m2[i]);
    }
  });
});
