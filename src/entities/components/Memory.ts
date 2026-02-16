import { Component } from '../../core/ECS';
import { CONFIG } from '../../config';

export type MemoryType = 'social' | 'discovery' | 'danger' | 'achievement' | 'loss';

export interface EpisodicMemory {
  tick: number;
  type: MemoryType;
  location: [number, number];
  entities: number[];
  emotionalValence: number;
  importance: number;
  details: Record<string, unknown>;
}

export class MemoryComponent implements Component {
  type = 'memory';
  episodic: EpisodicMemory[];
  maxMemories: number;
  summarizedVector: number[];

  constructor(maxMemories = CONFIG.MAX_MEMORIES_PER_NPC) {
    this.episodic = [];
    this.maxMemories = maxMemories;
    this.summarizedVector = new Array(8).fill(0);
  }

  addMemory(memory: EpisodicMemory): void {
    this.episodic.push(memory);
    if (this.episodic.length > this.maxMemories) {
      this.consolidate();
    }
  }

  consolidate(): void {
    // Decay importance over time
    for (const mem of this.episodic) {
      mem.importance *= 0.95;
    }
    // Sort by importance and keep the most important
    this.episodic.sort((a, b) => b.importance - a.importance);
    this.episodic = this.episodic.slice(0, this.maxMemories);
    // Update summary vector
    this.summarizedVector = this.getSummaryVector();
  }

  getSummaryVector(): number[] {
    const vec = new Array(8).fill(0);
    if (this.episodic.length === 0) return vec;

    const typeIndices: Record<MemoryType, number> = {
      social: 0,
      discovery: 1,
      danger: 2,
      achievement: 3,
      loss: 4,
    };

    for (const mem of this.episodic) {
      const idx = typeIndices[mem.type];
      vec[idx] += mem.importance;
      vec[5] += mem.emotionalValence * mem.importance;
    }
    vec[6] = this.episodic.length / this.maxMemories;
    vec[7] = this.episodic.length > 0
      ? this.episodic.reduce((sum, m) => sum + m.importance, 0) / this.episodic.length
      : 0;

    // Normalize
    const max = Math.max(...vec.map(Math.abs), 1);
    return vec.map(v => v / max);
  }
}
