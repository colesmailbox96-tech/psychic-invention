import { System, Entity, ComponentType } from '../../core/ECS';
import { InventoryComponent } from '../components/Inventory';
import { SkillsComponent } from '../components/Skills';

export interface CraftingRecipe {
  name: string;
  inputs: { resource: string; quantity: number }[];
  output: { resource: string; quantity: number };
  skillRequired: string;
  skillMinimum: number;
}

const RECIPES: CraftingRecipe[] = [
  {
    name: 'Axe',
    inputs: [{ resource: 'wood', quantity: 2 }, { resource: 'stone', quantity: 1 }],
    output: { resource: 'axe', quantity: 1 },
    skillRequired: 'crafting',
    skillMinimum: 0,
  },
  {
    name: 'Fishing Rod',
    inputs: [{ resource: 'wood', quantity: 4 }, { resource: 'rope', quantity: 2 }],
    output: { resource: 'fishing_rod', quantity: 1 },
    skillRequired: 'crafting',
    skillMinimum: 0.1,
  },
  {
    name: 'Stew',
    inputs: [{ resource: 'game_meat', quantity: 1 }, { resource: 'herbs', quantity: 1 }],
    output: { resource: 'stew', quantity: 1 },
    skillRequired: 'crafting',
    skillMinimum: 0,
  },
  {
    name: 'Leather',
    inputs: [{ resource: 'hide', quantity: 2 }, { resource: 'needle', quantity: 1 }],
    output: { resource: 'leather', quantity: 1 },
    skillRequired: 'crafting',
    skillMinimum: 0.2,
  },
  {
    name: 'Bricks',
    inputs: [{ resource: 'clay', quantity: 4 }, { resource: 'wood', quantity: 1 }],
    output: { resource: 'bricks', quantity: 1 },
    skillRequired: 'crafting',
    skillMinimum: 0.1,
  },
  {
    name: 'Rope',
    inputs: [{ resource: 'fiber', quantity: 2 }],
    output: { resource: 'rope', quantity: 1 },
    skillRequired: 'crafting',
    skillMinimum: 0,
  },
  {
    name: 'Planks',
    inputs: [{ resource: 'wood', quantity: 3 }],
    output: { resource: 'planks', quantity: 1 },
    skillRequired: 'crafting',
    skillMinimum: 0,
  },
];

export class CraftingSystem extends System {
  readonly requiredComponents: ComponentType[] = ['inventory', 'skills'];

  static getRecipes(): CraftingRecipe[] {
    return RECIPES;
  }

  update(entities: Entity[], _deltaTime: number): void {
    // Crafting is triggered by ActionExecutionSystem; this system checks and executes
    for (const entity of entities) {
      this.tryCraftBest(entity);
    }
  }

  tryCraftBest(entity: Entity): boolean {
    const inventory = entity.getComponent<InventoryComponent>('inventory')!;
    const skills = entity.getComponent<SkillsComponent>('skills')!;

    for (const recipe of RECIPES) {
      if (this.canCraft(entity, recipe)) {
        this.craft(entity, recipe);
        skills.improve('crafting', 0.01);
        return true;
      }
    }
    return false;
  }

  canCraft(entity: Entity, recipe: CraftingRecipe): boolean {
    const inventory = entity.getComponent<InventoryComponent>('inventory')!;
    const skills = entity.getComponent<SkillsComponent>('skills')!;

    if (skills.getLevel(recipe.skillRequired) < recipe.skillMinimum) return false;

    for (const input of recipe.inputs) {
      if (!inventory.hasItem(input.resource, input.quantity)) return false;
    }
    return true;
  }

  private craft(entity: Entity, recipe: CraftingRecipe): void {
    const inventory = entity.getComponent<InventoryComponent>('inventory')!;

    for (const input of recipe.inputs) {
      inventory.removeItem(input.resource, input.quantity);
    }
    inventory.addItem(recipe.output.resource, recipe.output.quantity);
  }
}
