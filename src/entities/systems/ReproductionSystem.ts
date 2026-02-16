import { System, Entity, World, ComponentType } from '../../core/ECS';
import { GeneticsComponent } from '../components/Genetics';
import { NeedsComponent } from '../components/Needs';
import { RelationshipsComponent } from '../components/Relationships';
import { PositionComponent } from '../components/Position';
import { PhysicsBodyComponent } from '../components/PhysicsBody';
import { BrainComponent } from '../components/Brain';
import { EmotionsComponent } from '../components/Emotions';
import { MemoryComponent } from '../components/Memory';
import { InventoryComponent } from '../components/Inventory';
import { SkillsComponent } from '../components/Skills';
import { eventBus } from '../../core/EventBus';

const AFFECTION_THRESHOLD = 0.6;
const NEED_THRESHOLD = 0.4;
const REPRODUCTION_COOLDOWN = 2000; // ticks

export class ReproductionSystem extends System {
  readonly requiredComponents: ComponentType[] = ['genetics', 'needs', 'relationships'];
  private world: World;
  private cooldowns: Map<number, number> = new Map();
  private tickCounter = 0;

  constructor(world: World) {
    super();
    this.world = world;
  }

  update(entities: Entity[], _deltaTime: number): void {
    this.tickCounter++;

    for (let i = 0; i < entities.length; i++) {
      const a = entities[i];

      if (this.isOnCooldown(a.id)) continue;

      const posA = a.getComponent<PositionComponent>('position');
      const relA = a.getComponent<RelationshipsComponent>('relationships')!;
      const needsA = a.getComponent<NeedsComponent>('needs')!;

      if (!posA || !this.basicNeedsSatisfied(needsA)) continue;

      for (let j = i + 1; j < entities.length; j++) {
        const b = entities[j];

        if (this.isOnCooldown(b.id)) continue;

        const posB = b.getComponent<PositionComponent>('position');
        const relB = b.getComponent<RelationshipsComponent>('relationships')!;
        const needsB = b.getComponent<NeedsComponent>('needs')!;

        if (!posB || !this.basicNeedsSatisfied(needsB)) continue;

        // Must be adjacent
        const dx = Math.abs(posA.tileX - posB.tileX);
        const dy = Math.abs(posA.tileY - posB.tileY);
        if (dx > 1 || dy > 1) continue;

        // Check mutual affection
        const relAtoB = relA.getRelationship(b.id);
        const relBtoA = relB.getRelationship(a.id);
        if (!relAtoB || !relBtoA) continue;
        if (relAtoB.affection < AFFECTION_THRESHOLD || relBtoA.affection < AFFECTION_THRESHOLD) continue;

        this.reproduce(a, b);
        break; // Only one reproduction per parent per tick
      }
    }
  }

  private reproduce(parent1: Entity, parent2: Entity): void {
    const gen1 = parent1.getComponent<GeneticsComponent>('genetics')!;
    const gen2 = parent2.getComponent<GeneticsComponent>('genetics')!;
    const pos1 = parent1.getComponent<PositionComponent>('position')!;

    const childGeneration = Math.max(gen1.generation, gen2.generation) + 1;
    const childGenetics = GeneticsComponent.crossover(gen1, gen2, childGeneration);
    childGenetics.parentIds = [parent1.id, parent2.id];

    const child = this.world.createEntity();
    child.addComponent(new PositionComponent(pos1.x, pos1.y));
    child.addComponent(new NeedsComponent());
    child.addComponent(childGenetics);
    child.addComponent(new PhysicsBodyComponent());
    child.addComponent(new BrainComponent());
    child.addComponent(new EmotionsComponent());
    child.addComponent(new MemoryComponent());
    child.addComponent(new InventoryComponent());
    child.addComponent(new SkillsComponent());
    child.addComponent(new RelationshipsComponent());

    // Set cooldowns
    this.cooldowns.set(parent1.id, this.tickCounter + REPRODUCTION_COOLDOWN);
    this.cooldowns.set(parent2.id, this.tickCounter + REPRODUCTION_COOLDOWN);

    eventBus.emit('npc:birth', {
      childId: child.id,
      parent1Id: parent1.id,
      parent2Id: parent2.id,
      generation: childGeneration,
    });
  }

  private basicNeedsSatisfied(needs: NeedsComponent): boolean {
    return (
      needs.hunger > NEED_THRESHOLD &&
      needs.thirst > NEED_THRESHOLD &&
      needs.energy > NEED_THRESHOLD
    );
  }

  private isOnCooldown(entityId: number): boolean {
    const cooldownEnd = this.cooldowns.get(entityId);
    if (cooldownEnd === undefined) return false;
    if (this.tickCounter >= cooldownEnd) {
      this.cooldowns.delete(entityId);
      return false;
    }
    return true;
  }
}
