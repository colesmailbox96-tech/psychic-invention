import { System, Entity, World, ComponentType } from '../../core/ECS';
import { NeedsComponent } from '../components/Needs';
import { eventBus } from '../../core/EventBus';

const HEALTH_DRAIN_RATE = 0.01;
const STARVATION_THRESHOLD = 0;
const DEHYDRATION_THRESHOLD = 0;

export class DeathSystem extends System {
  readonly requiredComponents: ComponentType[] = ['needs'];
  private world: World;
  private healthPool: Map<number, number> = new Map();

  constructor(world: World) {
    super();
    this.world = world;
  }

  update(entities: Entity[], deltaTime: number): void {
    for (const entity of entities) {
      const needs = entity.getComponent<NeedsComponent>('needs')!;

      let health = this.healthPool.get(entity.id) ?? 1.0;
      let cause: string | null = null;

      if (needs.hunger <= STARVATION_THRESHOLD) {
        health -= HEALTH_DRAIN_RATE * deltaTime;
        cause = 'starvation';
      }

      if (needs.thirst <= DEHYDRATION_THRESHOLD) {
        health -= HEALTH_DRAIN_RATE * deltaTime * 1.5;
        cause = cause ? 'starvation_and_dehydration' : 'dehydration';
      }

      // Recover health slowly if needs are satisfied
      if (needs.hunger > 0.3 && needs.thirst > 0.3) {
        health = Math.min(1, health + HEALTH_DRAIN_RATE * deltaTime * 0.5);
      }

      this.healthPool.set(entity.id, health);

      if (health <= 0) {
        eventBus.emit('npc:death', {
          entityId: entity.id,
          cause: cause ?? 'unknown',
          hunger: needs.hunger,
          thirst: needs.thirst,
        });
        this.world.removeEntity(entity.id);
        this.healthPool.delete(entity.id);
      }
    }
  }

  getHealth(entityId: number): number {
    return this.healthPool.get(entityId) ?? 1.0;
  }
}
