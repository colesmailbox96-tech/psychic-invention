import { System, Entity, World, ComponentType } from '../../core/ECS';
import { GeneticsComponent } from '../components/Genetics';
import { CONFIG } from '../../config';
import { eventBus } from '../../core/EventBus';

// 5 game years in ticks
const TICKS_PER_YEAR = CONFIG.TICKS_PER_HOUR * CONFIG.HOURS_PER_DAY * CONFIG.DAYS_PER_SEASON * CONFIG.SEASONS_PER_YEAR;
const DEFAULT_MAX_AGE_YEARS = 5;
const DEFAULT_MAX_AGE_TICKS = DEFAULT_MAX_AGE_YEARS * TICKS_PER_YEAR;

export class AgingSystem extends System {
  readonly requiredComponents: ComponentType[] = ['genetics'];
  private ages: Map<number, number> = new Map();
  private world: World;

  constructor(world: World) {
    super();
    this.world = world;
  }

  update(entities: Entity[], _deltaTime: number): void {
    for (const entity of entities) {
      const age = (this.ages.get(entity.id) ?? 0) + 1;
      this.ages.set(entity.id, age);

      const genetics = entity.getComponent<GeneticsComponent>('genetics')!;
      // Resilience extends lifespan
      const maxAge = Math.floor(DEFAULT_MAX_AGE_TICKS * (0.8 + genetics.resilience * 0.4));

      if (age >= maxAge) {
        eventBus.emit('npc:death', {
          entityId: entity.id,
          cause: 'old_age',
          age,
          generation: genetics.generation,
        });
        this.world.removeEntity(entity.id);
        this.ages.delete(entity.id);
      }
    }
  }

  getAge(entityId: number): number {
    return this.ages.get(entityId) ?? 0;
  }
}
