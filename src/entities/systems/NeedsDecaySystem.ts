import { System, Entity, ComponentType } from '../../core/ECS';
import { NeedsComponent } from '../components/Needs';
import { CONFIG } from '../../config';
import { eventBus } from '../../core/EventBus';

const CRITICAL_THRESHOLD = 0.2;

export class NeedsDecaySystem extends System {
  readonly requiredComponents: ComponentType[] = ['needs'];

  update(entities: Entity[], deltaTime: number): void {
    for (const entity of entities) {
      const needs = entity.getComponent<NeedsComponent>('needs')!;

      needs.hunger = Math.max(0, Math.min(1, needs.hunger - CONFIG.HUNGER_DECAY * deltaTime));
      needs.thirst = Math.max(0, Math.min(1, needs.thirst - CONFIG.THIRST_DECAY * deltaTime));
      needs.energy = Math.max(0, Math.min(1, needs.energy - CONFIG.ENERGY_DECAY * deltaTime));
      needs.warmth = Math.max(0, Math.min(1, needs.warmth - CONFIG.WARMTH_DECAY * deltaTime));
      needs.social = Math.max(0, Math.min(1, needs.social - CONFIG.SOCIAL_DECAY * deltaTime));

      if (needs.hunger < CRITICAL_THRESHOLD) {
        eventBus.emit('needs:critical', { entityId: entity.id, need: 'hunger', value: needs.hunger });
      }
      if (needs.thirst < CRITICAL_THRESHOLD) {
        eventBus.emit('needs:critical', { entityId: entity.id, need: 'thirst', value: needs.thirst });
      }
      if (needs.energy < CRITICAL_THRESHOLD) {
        eventBus.emit('needs:critical', { entityId: entity.id, need: 'energy', value: needs.energy });
      }
      if (needs.warmth < CRITICAL_THRESHOLD) {
        eventBus.emit('needs:critical', { entityId: entity.id, need: 'warmth', value: needs.warmth });
      }
      if (needs.social < CRITICAL_THRESHOLD) {
        eventBus.emit('needs:critical', { entityId: entity.id, need: 'social', value: needs.social });
      }
    }
  }
}
