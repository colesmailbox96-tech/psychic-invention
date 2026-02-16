import { CONFIG } from '../config';
import { TileMap, TileType } from './TileMap';
import { BiomeManager } from './BiomeManager';
import { NoiseGenerator } from '../utils/NoiseGenerator';
import { RNG } from '../utils/RNG';

export class WorldGenerator {
  private noise: NoiseGenerator;
  private rng: RNG;
  private biomeManager: BiomeManager;

  constructor(seed: number = Date.now()) {
    this.noise = new NoiseGenerator(seed);
    this.rng = new RNG(seed);
    this.biomeManager = new BiomeManager();
  }

  generate(
    width: number = CONFIG.WORLD_WIDTH,
    height: number = CONFIG.WORLD_HEIGHT,
  ): TileMap {
    const elevation = this.generateElevation(width, height);
    const moisture = this.generateMoisture(width, height);
    const temperature = this.generateTemperature(width, height);

    const tileMap = new TileMap(width, height);

    this.assignBiomes(tileMap, elevation, moisture, temperature);
    this.placeWater(tileMap, elevation, moisture);
    this.placeResources(tileMap);

    return tileMap;
  }

  private generateElevation(width: number, height: number): Float32Array {
    return this.noise.noiseMap(width, height, 80, 3, 0.5, 2.0, 0, 0);
  }

  private generateMoisture(width: number, height: number): Float32Array {
    return this.noise.noiseMap(width, height, 60, 2, 0.5, 2.0, 1000, 1000);
  }

  private generateTemperature(width: number, height: number): Float32Array {
    const noiseMap = this.noise.noiseMap(
      width,
      height,
      100,
      2,
      0.5,
      2.0,
      2000,
      2000,
    );
    // Apply latitude gradient: warmer at center, colder at top/bottom
    for (let y = 0; y < height; y++) {
      const latitudeFactor = 1.0 - Math.abs(y / height - 0.5) * 2.0;
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        noiseMap[idx] = noiseMap[idx] * 0.4 + latitudeFactor * 0.6;
      }
    }
    return noiseMap;
  }

  private assignBiomes(
    tileMap: TileMap,
    elevation: Float32Array,
    moisture: Float32Array,
    temperature: Float32Array,
  ): void {
    for (let y = 0; y < tileMap.height; y++) {
      for (let x = 0; x < tileMap.width; x++) {
        const idx = y * tileMap.width + x;
        const elev = elevation[idx];
        const moist = moisture[idx];
        const temp = temperature[idx];

        const biome = this.biomeManager.determineBiome(elev, moist, temp);
        const biomeDef = this.biomeManager.getBiome(biome);

        let tileType: TileType;
        if (elev > 0.75) {
          tileType = temp < 0.25 ? TileType.SNOW : TileType.STONE;
        } else if (elev > 0.6) {
          tileType = TileType.STONE;
        } else if (moist < 0.3 && temp > 0.6) {
          tileType = TileType.SAND;
        } else if (moist > 0.7) {
          tileType = TileType.MARSH;
        } else if (elev < 0.15) {
          tileType = TileType.SAND;
        } else {
          tileType = TileType.GRASS;
        }

        tileMap.setTile(x, y, {
          type: tileType,
          biome,
          elevation: elev,
          moisture: moist,
          temperature: temp,
          walkable: true,
          movementCost: biomeDef.baseMovementCost,
        });
      }
    }
  }

  private placeResources(tileMap: TileMap): void {
    for (let y = 0; y < tileMap.height; y++) {
      for (let x = 0; x < tileMap.width; x++) {
        const tile = tileMap.getTile(x, y)!;
        if (!tile.walkable) continue;

        const biomeDef = this.biomeManager.getBiome(tile.biome);
        if (
          this.rng.next() < biomeDef.resourceDensity &&
          biomeDef.resources.length > 0
        ) {
          tileMap.setTile(x, y, {
            resource: this.rng.pick(biomeDef.resources),
            resourceAmount: this.rng.nextInt(1, 5),
          });
        }
      }
    }
  }

  private placeWater(
    tileMap: TileMap,
    elevation: Float32Array,
    moisture: Float32Array,
  ): void {
    for (let y = 0; y < tileMap.height; y++) {
      for (let x = 0; x < tileMap.width; x++) {
        const idx = y * tileMap.width + x;
        const elev = elevation[idx];
        const moist = moisture[idx];

        if (elev < 0.1 && moist > 0.5) {
          tileMap.setTile(x, y, {
            type: TileType.DEEP_WATER,
            walkable: false,
            movementCost: Infinity,
            resource: null,
            resourceAmount: 0,
          });
        } else if (elev < 0.18 && moist > 0.6) {
          tileMap.setTile(x, y, {
            type: TileType.WATER,
            walkable: false,
            movementCost: Infinity,
            resource: null,
            resourceAmount: 0,
          });
        }
      }
    }
  }
}
