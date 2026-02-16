import { System, Entity, World, ComponentType } from '../../core/ECS';
import { BrainComponent } from '../components/Brain';
import { PositionComponent } from '../components/Position';
import { NeedsComponent } from '../components/Needs';
import { InventoryComponent } from '../components/Inventory';
import { RelationshipsComponent } from '../components/Relationships';
import { TileMap, TileType } from '../../world/TileMap';
import { findPath } from '../../utils/Pathfinding';
import { ActionResult } from '../../ai/RewardSignal';
import { eventBus } from '../../core/EventBus';

export class ActionExecutionSystem extends System {
  readonly requiredComponents: ComponentType[] = ['brain', 'position', 'needs', 'inventory'];
  private tileMap: TileMap;
  private world: World;
  private actionResults: Map<number, ActionResult> = new Map();

  constructor(tileMap: TileMap, world: World) {
    super();
    this.tileMap = tileMap;
    this.world = world;
  }

  getActionResult(entityId: number): ActionResult | undefined {
    return this.actionResults.get(entityId);
  }

  update(entities: Entity[], _deltaTime: number): void {
    this.actionResults.clear();

    for (const entity of entities) {
      const brain = entity.getComponent<BrainComponent>('brain')!;
      const result = this.executeAction(entity, brain.currentAction);
      this.actionResults.set(entity.id, result);
    }
  }

  private executeAction(entity: Entity, action: number): ActionResult {
    switch (action) {
      case 0: return this.doIdle(entity);
      case 1: return this.doWander(entity);
      case 2: return this.doForage(entity);
      case 3: return this.doDrink(entity);
      case 4: return this.doHarvest(entity);
      case 5: return this.doCraft(entity);
      case 6: return this.doBuild(entity);
      case 7: return this.doEat(entity);
      case 8: return this.doSleep(entity);
      case 9: return this.doSocialize(entity);
      case 10: return this.doTrade(entity);
      case 11: return this.doFlee(entity);
      case 12: return this.doExplore(entity);
      case 13: return this.doReproduce(entity);
      default: return { success: false };
    }
  }

  private doIdle(entity: Entity): ActionResult {
    const needs = entity.getComponent<NeedsComponent>('needs')!;
    needs.energy = Math.min(1, needs.energy + 0.002);
    return { success: true };
  }

  private doWander(entity: Entity): ActionResult {
    const pos = entity.getComponent<PositionComponent>('position')!;
    const dx = Math.floor(Math.random() * 5) - 2;
    const dy = Math.floor(Math.random() * 5) - 2;
    const tx = pos.tileX + dx;
    const ty = pos.tileY + dy;

    if (this.tileMap.isWalkable(tx, ty)) {
      this.moveEntityToward(entity, tx, ty);
      return { success: true };
    }
    return { success: false };
  }

  private doForage(entity: Entity): ActionResult {
    const pos = entity.getComponent<PositionComponent>('position')!;
    const inventory = entity.getComponent<InventoryComponent>('inventory')!;

    const target = this.tileMap.findNearestTile(
      pos.tileX, pos.tileY,
      (tile) => tile.resource === 'food' && tile.resourceAmount > 0,
      15,
    );

    if (!target) return { success: false };

    if (target.x === pos.tileX && target.y === pos.tileY) {
      const tile = this.tileMap.getTile(target.x, target.y)!;
      tile.resourceAmount = Math.max(0, tile.resourceAmount - 1);
      inventory.addItem('food', 1);
      return { success: true, resourceGained: 1 };
    }

    this.moveEntityToward(entity, target.x, target.y);
    return { success: true };
  }

  private doDrink(entity: Entity): ActionResult {
    const pos = entity.getComponent<PositionComponent>('position')!;
    const needs = entity.getComponent<NeedsComponent>('needs')!;

    const target = this.tileMap.findNearestTile(
      pos.tileX, pos.tileY,
      (tile) => tile.type === TileType.WATER,
      15,
    );

    if (!target) return { success: false };

    const dx = Math.abs(target.x - pos.tileX);
    const dy = Math.abs(target.y - pos.tileY);
    if (dx <= 1 && dy <= 1) {
      needs.thirst = Math.min(1, needs.thirst + 0.3);
      return { success: true };
    }

    // Move adjacent to water (not onto it since water may not be walkable)
    const adjacent = this.findWalkableAdjacent(target.x, target.y);
    if (adjacent) {
      this.moveEntityToward(entity, adjacent.x, adjacent.y);
      return { success: true };
    }
    return { success: false };
  }

  private doHarvest(entity: Entity): ActionResult {
    const pos = entity.getComponent<PositionComponent>('position')!;
    const inventory = entity.getComponent<InventoryComponent>('inventory')!;

    const target = this.tileMap.findNearestTile(
      pos.tileX, pos.tileY,
      (tile) => (tile.resource === 'wood' || tile.resource === 'stone') && tile.resourceAmount > 0,
      15,
    );

    if (!target) return { success: false };

    if (target.x === pos.tileX && target.y === pos.tileY) {
      const tile = this.tileMap.getTile(target.x, target.y)!;
      const resourceType = tile.resource!;
      tile.resourceAmount = Math.max(0, tile.resourceAmount - 1);
      inventory.addItem(resourceType, 1);
      return { success: true, resourceGained: 1 };
    }

    this.moveEntityToward(entity, target.x, target.y);
    return { success: true };
  }

  private doCraft(entity: Entity): ActionResult {
    // Delegate to CraftingSystem; here just signal intent
    eventBus.emit('action:craft', { entityId: entity.id });
    return { success: true };
  }

  private doBuild(entity: Entity): ActionResult {
    const pos = entity.getComponent<PositionComponent>('position')!;
    const inventory = entity.getComponent<InventoryComponent>('inventory')!;

    if (!inventory.hasItem('wood', 5)) return { success: false };

    const tile = this.tileMap.getTile(pos.tileX, pos.tileY);
    if (!tile || tile.hasStructure) return { success: false };

    inventory.removeItem('wood', 5);
    this.tileMap.setTile(pos.tileX, pos.tileY, { hasStructure: true });
    eventBus.emit('action:build', { entityId: entity.id, x: pos.tileX, y: pos.tileY });
    return { success: true };
  }

  private doEat(entity: Entity): ActionResult {
    const needs = entity.getComponent<NeedsComponent>('needs')!;
    const inventory = entity.getComponent<InventoryComponent>('inventory')!;

    if (inventory.hasItem('stew', 1)) {
      inventory.removeItem('stew', 1);
      needs.hunger = Math.min(1, needs.hunger + 0.5);
      return { success: true };
    }

    if (inventory.hasItem('food', 1)) {
      inventory.removeItem('food', 1);
      needs.hunger = Math.min(1, needs.hunger + 0.3);
      return { success: true };
    }

    return { success: false };
  }

  private doSleep(entity: Entity): ActionResult {
    const pos = entity.getComponent<PositionComponent>('position')!;
    const needs = entity.getComponent<NeedsComponent>('needs')!;

    const tile = this.tileMap.getTile(pos.tileX, pos.tileY);
    const hasShelter = tile?.hasStructure ?? false;

    const restoreRate = hasShelter ? 0.05 : 0.02;
    needs.energy = Math.min(1, needs.energy + restoreRate);
    return { success: true };
  }

  private doSocialize(entity: Entity): ActionResult {
    const pos = entity.getComponent<PositionComponent>('position')!;
    const allEntities = this.world.getEntitiesWithComponents('position', 'needs');

    let nearest: Entity | null = null;
    let nearestDist = Infinity;

    for (const other of allEntities) {
      if (other.id === entity.id) continue;
      const oPos = other.getComponent<PositionComponent>('position')!;
      const dx = oPos.tileX - pos.tileX;
      const dy = oPos.tileY - pos.tileY;
      const dist = Math.abs(dx) + Math.abs(dy);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = other;
      }
    }

    if (!nearest) return { success: false };

    if (nearestDist <= 2) {
      const needs = entity.getComponent<NeedsComponent>('needs')!;
      needs.social = Math.min(1, needs.social + 0.1);
      return { success: true, socialInteraction: true };
    }

    const oPos = nearest.getComponent<PositionComponent>('position')!;
    this.moveEntityToward(entity, oPos.tileX, oPos.tileY);
    return { success: true };
  }

  private doTrade(entity: Entity): ActionResult {
    const pos = entity.getComponent<PositionComponent>('position')!;
    const inventory = entity.getComponent<InventoryComponent>('inventory')!;
    const allEntities = this.world.getEntitiesWithComponents('position', 'inventory');

    for (const other of allEntities) {
      if (other.id === entity.id) continue;
      const oPos = other.getComponent<PositionComponent>('position')!;
      const dist = Math.abs(oPos.tileX - pos.tileX) + Math.abs(oPos.tileY - pos.tileY);
      if (dist > 2) continue;

      const otherInv = other.getComponent<InventoryComponent>('inventory')!;
      // Simple trade: exchange first available item
      if (inventory.items.length > 0 && otherInv.items.length > 0) {
        const myItem = inventory.items[0];
        const theirItem = otherInv.items[0];
        if (myItem.resourceType !== theirItem.resourceType) {
          inventory.removeItem(myItem.resourceType, 1);
          otherInv.removeItem(theirItem.resourceType, 1);
          inventory.addItem(theirItem.resourceType, 1);
          otherInv.addItem(myItem.resourceType, 1);
          return { success: true, socialInteraction: true };
        }
      }
    }
    return { success: false };
  }

  private doFlee(entity: Entity): ActionResult {
    const pos = entity.getComponent<PositionComponent>('position')!;
    const allEntities = this.world.getEntitiesWithComponents('position');

    // Find nearest entity and move away
    let nearestDx = 0;
    let nearestDy = 0;
    let nearestDist = Infinity;

    for (const other of allEntities) {
      if (other.id === entity.id) continue;
      const oPos = other.getComponent<PositionComponent>('position')!;
      const dx = oPos.tileX - pos.tileX;
      const dy = oPos.tileY - pos.tileY;
      const dist = Math.abs(dx) + Math.abs(dy);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestDx = dx;
        nearestDy = dy;
      }
    }

    if (nearestDist === Infinity) return { success: false };

    // Move in opposite direction
    const fleeX = pos.tileX - Math.sign(nearestDx) * 3;
    const fleeY = pos.tileY - Math.sign(nearestDy) * 3;
    const clampedX = Math.max(0, Math.min(this.tileMap.width - 1, fleeX));
    const clampedY = Math.max(0, Math.min(this.tileMap.height - 1, fleeY));

    if (this.tileMap.isWalkable(clampedX, clampedY)) {
      this.moveEntityToward(entity, clampedX, clampedY);
      return { success: true };
    }
    return { success: false };
  }

  private doExplore(entity: Entity): ActionResult {
    const pos = entity.getComponent<PositionComponent>('position')!;

    const target = this.tileMap.findNearestTile(
      pos.tileX, pos.tileY,
      (tile) => !tile.explored && tile.walkable,
      20,
    );

    if (!target) return { success: false };

    this.moveEntityToward(entity, target.x, target.y);

    const tile = this.tileMap.getTile(pos.tileX, pos.tileY);
    if (tile && !tile.explored) {
      tile.explored = true;
      return { success: true, discoveredNewTile: true };
    }
    return { success: true };
  }

  private doReproduce(_entity: Entity): ActionResult {
    // Delegate to ReproductionSystem
    eventBus.emit('action:reproduce', { entityId: _entity.id });
    return { success: true };
  }

  private moveEntityToward(entity: Entity, targetX: number, targetY: number): void {
    const pos = entity.getComponent<PositionComponent>('position')!;

    const path = findPath(
      pos.tileX, pos.tileY,
      targetX, targetY,
      (x, y) => this.tileMap.isWalkable(x, y),
      (x, y) => this.tileMap.getMovementCost(x, y),
      200,
    );

    if (path.length > 1) {
      const next = path[1];
      pos.prevX = pos.x;
      pos.prevY = pos.y;
      pos.x = next.x;
      pos.y = next.y;
      pos.updateTile();

      const dx = next.x - pos.prevX;
      const dy = next.y - pos.prevY;
      if (Math.abs(dx) > Math.abs(dy)) {
        pos.direction = dx > 0 ? 'right' : 'left';
      } else {
        pos.direction = dy > 0 ? 'down' : 'up';
      }
    }
  }

  private findWalkableAdjacent(x: number, y: number): { x: number; y: number } | null {
    const offsets = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [dx, dy] of offsets) {
      if (this.tileMap.isWalkable(x + dx, y + dy)) {
        return { x: x + dx, y: y + dy };
      }
    }
    return null;
  }
}
