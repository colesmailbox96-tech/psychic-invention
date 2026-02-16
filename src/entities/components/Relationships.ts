import { Component } from '../../core/ECS';

export type RelationshipRole = 'stranger' | 'acquaintance' | 'friend' | 'partner' | 'rival' | 'enemy';

export interface Relationship {
  target: number;
  trust: number;
  affection: number;
  familiarity: number;
  lastInteraction: number;
  role: RelationshipRole;
  sharedMemories: number[];
}

export class RelationshipsComponent implements Component {
  type = 'relationships';
  relationships: Map<number, Relationship>;

  constructor() {
    this.relationships = new Map();
  }

  getRelationship(targetId: number): Relationship | undefined {
    return this.relationships.get(targetId);
  }

  addOrUpdateRelationship(targetId: number, changes: Partial<Omit<Relationship, 'target'>>): void {
    const existing = this.relationships.get(targetId);
    if (existing) {
      Object.assign(existing, changes);
    } else {
      this.relationships.set(targetId, {
        target: targetId,
        trust: 0,
        affection: 0,
        familiarity: 0,
        lastInteraction: 0,
        role: 'stranger',
        sharedMemories: [],
        ...changes,
      });
    }
  }

  getClosestRelationships(count = 5): Relationship[] {
    const all = Array.from(this.relationships.values());
    all.sort((a, b) => (b.trust + b.affection + b.familiarity) - (a.trust + a.affection + a.familiarity));
    return all.slice(0, count);
  }

  decayAll(amount = 0.01): void {
    for (const rel of this.relationships.values()) {
      rel.familiarity = Math.max(0, rel.familiarity - amount);
      rel.trust = Math.max(-1, Math.min(1, rel.trust * (1 - amount)));
      rel.affection = Math.max(-1, Math.min(1, rel.affection * (1 - amount)));
    }
  }
}
