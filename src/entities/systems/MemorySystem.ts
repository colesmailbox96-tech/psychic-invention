import { System, Entity, ComponentType } from '../../core/ECS';
import { MemoryComponent } from '../components/Memory';
import { CONFIG } from '../../config';

export class MemorySystem extends System {
  readonly requiredComponents: ComponentType[] = ['memory'];
  private tickCounter = 0;

  update(entities: Entity[], _deltaTime: number): void {
    this.tickCounter++;

    if (this.tickCounter % CONFIG.MEMORY_CONSOLIDATION_INTERVAL !== 0) {
      return;
    }

    for (const entity of entities) {
      const memory = entity.getComponent<MemoryComponent>('memory')!;
      memory.consolidate();
    }
  }
}
