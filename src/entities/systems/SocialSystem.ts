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

    // Spatial grid: bucket entities by tile for O(n) adjacency checks
    const grid = new Map<string, Entity[]>();
    for (const entity of entities) {
      const pos = entity.getComponent<PositionComponent>('position')!;
      const key = `${pos.tileX},${pos.tileY}`;
      const bucket = grid.get(key);
      if (bucket) {
        bucket.push(entity);
      } else {
        grid.set(key, [entity]);
      }
    }

    // Track processed pairs to avoid duplicate interactions
    const processed = new Set<string>();

    for (const entity of entities) {
      const pos = entity.getComponent<PositionComponent>('position')!;
      // Check the 3×3 neighborhood
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const key = `${pos.tileX + dx},${pos.tileY + dy}`;
          const bucket = grid.get(key);
          if (!bucket) continue;
          for (const other of bucket) {
            if (other.id <= entity.id) continue; // each pair once
            const pairKey = `${entity.id},${other.id}`;
            if (processed.has(pairKey)) continue;
            processed.add(pairKey);
            this.interact(entity, other);
          }
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
