import { System, Entity, ComponentType } from '../../core/ECS';
import { RelationshipsComponent } from '../components/Relationships';
import { PositionComponent } from '../components/Position';
import { EmotionsComponent } from '../components/Emotions';
import { MemoryComponent, MemoryType } from '../components/Memory';
import { eventBus } from '../../core/EventBus';

export class SocialSystem extends System {
  readonly requiredComponents: ComponentType[] = ['relationships', 'position'];
  private tickCounter = 0;

  update(entities: Entity[], _deltaTime: number): void {
    this.tickCounter++;

    // Check pairs for adjacency
    for (let i = 0; i < entities.length; i++) {
      const a = entities[i];
      const posA = a.getComponent<PositionComponent>('position')!;

      for (let j = i + 1; j < entities.length; j++) {
        const b = entities[j];
        const posB = b.getComponent<PositionComponent>('position')!;

        const dx = Math.abs(posA.tileX - posB.tileX);
        const dy = Math.abs(posA.tileY - posB.tileY);

        if (dx <= 1 && dy <= 1) {
          this.interact(a, b);
        }
      }
    }
  }

  private interact(a: Entity, b: Entity): void {
    const relA = a.getComponent<RelationshipsComponent>('relationships')!;
    const relB = b.getComponent<RelationshipsComponent>('relationships')!;
    const emotionsA = a.getComponent<EmotionsComponent>('emotions');
    const emotionsB = b.getComponent<EmotionsComponent>('emotions');

    // Increase familiarity
    const familiarityGain = 0.02;

    // Trust/affection adjustment based on emotional states
    const valA = emotionsA?.valence ?? 0.5;
    const valB = emotionsB?.valence ?? 0.5;
    const avgValence = (valA + valB) / 2;
    const trustDelta = (avgValence - 0.5) * 0.05;
    const affectionDelta = (avgValence - 0.3) * 0.03;

    relA.addOrUpdateRelationship(b.id, {
      familiarity: Math.min(1, (relA.getRelationship(b.id)?.familiarity ?? 0) + familiarityGain),
      trust: Math.max(-1, Math.min(1, (relA.getRelationship(b.id)?.trust ?? 0) + trustDelta)),
      affection: Math.max(-1, Math.min(1, (relA.getRelationship(b.id)?.affection ?? 0) + affectionDelta)),
      lastInteraction: this.tickCounter,
    });

    relB.addOrUpdateRelationship(a.id, {
      familiarity: Math.min(1, (relB.getRelationship(a.id)?.familiarity ?? 0) + familiarityGain),
      trust: Math.max(-1, Math.min(1, (relB.getRelationship(a.id)?.trust ?? 0) + trustDelta)),
      affection: Math.max(-1, Math.min(1, (relB.getRelationship(a.id)?.affection ?? 0) + affectionDelta)),
      lastInteraction: this.tickCounter,
    });

    // Update relationship roles based on familiarity
    this.updateRole(relA, b.id);
    this.updateRole(relB, a.id);

    // Create shared memories
    const posA = a.getComponent<PositionComponent>('position')!;
    const memA = a.getComponent<MemoryComponent>('memory');
    const memB = b.getComponent<MemoryComponent>('memory');

    const memoryType: MemoryType = 'social';
    const sharedMemory = {
      tick: this.tickCounter,
      type: memoryType,
      location: [posA.tileX, posA.tileY] as [number, number],
      entities: [a.id, b.id],
      emotionalValence: avgValence,
      importance: 0.3 + Math.abs(avgValence - 0.5) * 0.4,
      details: { interaction: 'social' },
    };

    if (memA) memA.addMemory({ ...sharedMemory });
    if (memB) memB.addMemory({ ...sharedMemory });

    eventBus.emit('social:interaction', { entityA: a.id, entityB: b.id });
  }

  private updateRole(rel: RelationshipsComponent, targetId: number): void {
    const r = rel.getRelationship(targetId);
    if (!r) return;

    if (r.affection > 0.7 && r.trust > 0.5) {
      r.role = 'partner';
    } else if (r.familiarity > 0.5 && r.trust > 0.3) {
      r.role = 'friend';
    } else if (r.familiarity > 0.2) {
      r.role = 'acquaintance';
    } else if (r.trust < -0.3) {
      r.role = r.affection < -0.3 ? 'enemy' : 'rival';
    } else {
      r.role = 'stranger';
    }
  }
}
