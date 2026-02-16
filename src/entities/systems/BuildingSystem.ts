import { System, Entity, ComponentType } from '../../core/ECS';
import { InventoryComponent } from '../components/Inventory';
import { PositionComponent } from '../components/Position';
import { SkillsComponent } from '../components/Skills';
import { TileMap } from '../../world/TileMap';
import { eventBus } from '../../core/EventBus';

interface BuildingBlueprint {
  name: string;
  materials: { resource: string; quantity: number }[];
}

const BLUEPRINTS: BuildingBlueprint[] = [
  {
    name: 'shelter',
    materials: [{ resource: 'wood', quantity: 5 }],
  },
  {
    name: 'stone_house',
    materials: [{ resource: 'stone', quantity: 4 }, { resource: 'wood', quantity: 3 }],
  },
  {
    name: 'brick_house',
    materials: [{ resource: 'bricks', quantity: 3 }, { resource: 'planks', quantity: 2 }],
  },
];

export class BuildingSystem extends System {
  readonly requiredComponents: ComponentType[] = ['inventory', 'position'];
  private tileMap: TileMap;

  constructor(tileMap: TileMap) {
    super();
    this.tileMap = tileMap;
  }

  update(entities: Entity[], _deltaTime: number): void {
    // Building is triggered via events or ActionExecutionSystem
    // This system processes pending build requests
  }

  tryBuild(entity: Entity, blueprintName?: string): boolean {
    const pos = entity.getComponent<PositionComponent>('position')!;
    const inventory = entity.getComponent<InventoryComponent>('inventory')!;

    const tile = this.tileMap.getTile(pos.tileX, pos.tileY);
    if (!tile || tile.hasStructure || !tile.walkable) return false;

    // Find the best blueprint the entity can afford
    const blueprint = blueprintName
      ? BLUEPRINTS.find(b => b.name === blueprintName)
      : this.findAffordableBlueprint(inventory);

    if (!blueprint) return false;

    // Check materials
    for (const mat of blueprint.materials) {
      if (!inventory.hasItem(mat.resource, mat.quantity)) return false;
    }

    // Consume materials and place structure
    for (const mat of blueprint.materials) {
      inventory.removeItem(mat.resource, mat.quantity);
    }

    this.tileMap.setTile(pos.tileX, pos.tileY, { hasStructure: true });

    // Improve building skill if entity has it
    const skills = entity.getComponent<SkillsComponent>('skills');
    if (skills) {
      skills.improve('building', 0.02);
    }

    eventBus.emit('building:placed', {
      entityId: entity.id,
      blueprint: blueprint.name,
      x: pos.tileX,
      y: pos.tileY,
    });

    return true;
  }

  private findAffordableBlueprint(inventory: InventoryComponent): BuildingBlueprint | null {
    // Try blueprints from most complex to simplest
    for (let i = BLUEPRINTS.length - 1; i >= 0; i--) {
      const bp = BLUEPRINTS[i];
      const canAfford = bp.materials.every(m => inventory.hasItem(m.resource, m.quantity));
      if (canAfford) return bp;
    }
    return null;
  }
}
