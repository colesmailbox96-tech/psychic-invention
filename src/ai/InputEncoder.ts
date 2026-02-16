import { Entity } from '../core/ECS';
import { TileMap } from '../world/TileMap';
import { TimeManager } from '../world/TimeManager';
import { NeedsComponent } from '../entities/components/Needs';
import { EmotionsComponent } from '../entities/components/Emotions';
import { InventoryComponent } from '../entities/components/Inventory';
import { PositionComponent } from '../entities/components/Position';
import { MemoryComponent } from '../entities/components/Memory';
import { RelationshipsComponent } from '../entities/components/Relationships';
import { BrainComponent, ACTION_NAMES } from '../entities/components/Brain';


export class InputEncoder {
  static encode(
    entity: Entity,
    tileMap: TileMap,
    timeManager: TimeManager,
    allEntities: Entity[],
  ): number[] {
    return [
      ...InputEncoder.encodeSelfState(entity, timeManager),
      ...InputEncoder.encodeLocalEnvironment(entity, tileMap),
      ...InputEncoder.encodeSocialContext(entity, allEntities),
      ...InputEncoder.encodeMemory(entity),
    ];
  }

  // 16 dims
  private static encodeSelfState(entity: Entity, timeManager: TimeManager): number[] {
    const needs = entity.getComponent<NeedsComponent>('needs');
    const emotions = entity.getComponent<EmotionsComponent>('emotions');
    const inventory = entity.getComponent<InventoryComponent>('inventory');
    const brain = entity.getComponent<BrainComponent>('brain');
    const hunger = needs?.hunger ?? 0.5;
    const thirst = needs?.thirst ?? 0.5;
    const energy = needs?.energy ?? 0.5;
    const warmth = needs?.warmth ?? 0.5;
    const safety = needs?.safety ?? 0.5;
    const healthProxy = needs
      ? (needs.hunger + needs.thirst + needs.energy + needs.warmth + needs.safety) / 5
      : 0.5;
    const social = needs?.social ?? 0.5;

    const valence = emotions?.valence ?? 0.5;
    const arousal = emotions?.arousal ?? 0.3;

    const invFullness = inventory ? inventory.usedSlots / inventory.maxSlots : 0;

    const hour = timeManager.hour;
    const timeSin = Math.sin((2 * Math.PI * hour) / 24);
    const timeCos = Math.cos((2 * Math.PI * hour) / 24);

    const seasonIdx = timeManager.seasonIndex;
    const seasonSin = Math.sin((2 * Math.PI * seasonIdx) / 4);
    const seasonCos = Math.cos((2 * Math.PI * seasonIdx) / 4);

    const actionIdx = brain?.currentAction ?? 0;
    const actionSin = Math.sin((2 * Math.PI * actionIdx) / ACTION_NAMES.length);
    const actionCos = Math.cos((2 * Math.PI * actionIdx) / ACTION_NAMES.length);

    // Genetics traits are captured indirectly through healthProxy and other need values

    return [
      hunger, thirst, energy, warmth, safety,
      healthProxy, social,
      valence, arousal,
      invFullness,
      timeSin, timeCos,
      seasonSin, seasonCos,
      actionSin, actionCos,
    ];
  }

  // 32 dims: 25 (5×5 grid) + 5 nearest resource distances + 2 threat/weather
  private static encodeLocalEnvironment(entity: Entity, tileMap: TileMap): number[] {
    const pos = entity.getComponent<PositionComponent>('position');
    const cx = pos?.tileX ?? 0;
    const cy = pos?.tileY ?? 0;

    // 5×5 grid around NPC (25 values)
    const grid: number[] = [];
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const tile = tileMap.getTile(cx + dx, cy + dy);
        grid.push(tile ? tile.type / 9 : 0); // TileType max is FARMLAND=9
      }
    }

    // 5 nearest resource distances (normalized by search range)
    const maxRange = 20;
    const resourceDistances: number[] = [];
    const foundResources: { dist: number }[] = [];

    for (let r = 0; r <= maxRange && foundResources.length < 5; r++) {
      for (let dx = -r; dx <= r; dx++) {
        for (let dy = -r; dy <= r; dy++) {
          if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
          const tile = tileMap.getTile(cx + dx, cy + dy);
          if (tile && tile.resource !== null && tile.resourceAmount > 0) {
            const dist = Math.sqrt(dx * dx + dy * dy);
            foundResources.push({ dist });
          }
          if (foundResources.length >= 5) break;
        }
        if (foundResources.length >= 5) break;
      }
    }

    foundResources.sort((a, b) => a.dist - b.dist);
    for (let i = 0; i < 5; i++) {
      resourceDistances.push(
        i < foundResources.length ? 1 - foundResources[i].dist / maxRange : 0,
      );
    }

    // 2 values: threat/weather proxies
    const centerTile = tileMap.getTile(cx, cy);
    const temperatureProxy = centerTile?.temperature ?? 0.5;
    const elevationProxy = centerTile?.elevation ?? 0;

    return [...grid, ...resourceDistances, temperatureProxy, elevationProxy];
  }

  // 24 dims
  private static encodeSocialContext(entity: Entity, allEntities: Entity[]): number[] {
    const pos = entity.getComponent<PositionComponent>('position');
    const rel = entity.getComponent<RelationshipsComponent>('relationships');
    const myX = pos?.tileX ?? 0;
    const myY = pos?.tileY ?? 0;

    // Find nearest 3 NPCs with their info
    const others: { distSq: number; entity: Entity }[] = [];
    for (const other of allEntities) {
      if (other.id === entity.id) continue;
      const oPos = other.getComponent<PositionComponent>('position');
      if (!oPos) continue;
      const dx = oPos.tileX - myX;
      const dy = oPos.tileY - myY;
      const distSq = dx * dx + dy * dy;
      others.push({ distSq, entity: other });
    }
    others.sort((a, b) => a.distSq - b.distSq);

    const nearest3: number[] = [];
    for (let i = 0; i < 3; i++) {
      if (i < others.length) {
        const other = others[i];
        const relationship = rel?.getRelationship(other.entity.id);
        const dist = Math.sqrt(other.distSq);
        const distNorm = Math.min(dist / 50, 1);
        const trust = relationship?.trust ?? 0;
        const affection = relationship?.affection ?? 0;
        const familiarity = relationship?.familiarity ?? 0;
        const otherEmotions = other.entity.getComponent<EmotionsComponent>('emotions');
        const otherValence = otherEmotions?.valence ?? 0.5;
        nearest3.push(distNorm, trust, affection, familiarity, otherValence);
      } else {
        nearest3.push(0, 0, 0, 0, 0);
      }
    }

    // Population density: count entities within radius 10 (use squared distance)
    const nearbyCount = others.filter(o => o.distSq <= 100).length;
    const populationDensity = Math.min(nearbyCount / 10, 1);

    // Recent interaction outcomes (4 zeros placeholder — filled when interaction system exists)
    const interactionOutcomes = [0, 0, 0, 0];

    // Group info (4 zeros placeholder)
    const groupInfo = [0, 0, 0, 0];

    return [...nearest3, populationDensity, ...interactionOutcomes, ...groupInfo];
  }

  // 8 dims
  private static encodeMemory(entity: Entity): number[] {
    const memory = entity.getComponent<MemoryComponent>('memory');
    if (memory) {
      const vec = memory.summarizedVector;
      // Ensure exactly 8 dims
      const result: number[] = [];
      for (let i = 0; i < 8; i++) {
        result.push(vec[i] ?? 0);
      }
      return result;
    }
    return [0, 0, 0, 0, 0, 0, 0, 0];
  }
}
