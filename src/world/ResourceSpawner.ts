import { TileMap } from './TileMap';
import { BiomeManager } from './BiomeManager';
import { TimeManager } from './TimeManager';
import { RNG } from '../utils/RNG';

export class ResourceSpawner {
  private rng: RNG;
  private spawnInterval: number;
  private tickCounter: number;
  private biomeManager: BiomeManager;

  constructor(rng: RNG) {
    this.rng = rng;
    this.spawnInterval = 500;
    this.tickCounter = 0;
    this.biomeManager = new BiomeManager();
  }

  update(tileMap: TileMap, timeManager: TimeManager): void {
    this.tickCounter++;
    if (this.tickCounter >= this.spawnInterval) {
      this.tickCounter = 0;
      this.respawnResources(tileMap, timeManager);
    }
  }

  private respawnResources(tileMap: TileMap, timeManager: TimeManager): void {
    const seasonMod = timeManager.getResourceModifier();
    const maxPerCycle = Math.floor(
      tileMap.width * tileMap.height * 0.001 * seasonMod,
    );

    let spawned = 0;
    for (let attempt = 0; attempt < maxPerCycle * 3 && spawned < maxPerCycle; attempt++) {
      const x = this.rng.nextInt(0, tileMap.width - 1);
      const y = this.rng.nextInt(0, tileMap.height - 1);
      const tile = tileMap.getTile(x, y);
      if (!tile || !tile.walkable || tile.hasStructure) continue;

      if (tile.resource !== null && tile.resourceAmount > 0) {
        // Replenish existing resource
        if (tile.resourceAmount < 5 && this.rng.next() < 0.5 * seasonMod) {
          tileMap.setTile(x, y, { resourceAmount: tile.resourceAmount + 1 });
          spawned++;
        }
      } else {
        // Spawn new resource
        const biomeDef = this.biomeManager.getBiome(tile.biome);
        if (
          biomeDef.resources.length > 0 &&
          this.rng.next() < biomeDef.resourceDensity * 0.1 * seasonMod
        ) {
          tileMap.setTile(x, y, {
            resource: this.rng.pick(biomeDef.resources),
            resourceAmount: this.rng.nextInt(1, 3),
          });
          spawned++;
        }
      }
    }
  }
}
