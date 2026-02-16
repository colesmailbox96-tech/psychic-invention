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
    // Use partial selection to keep top-N by importance instead of full sort
    if (this.episodic.length > this.maxMemories) {
      this.partialSelect(this.maxMemories);
      this.episodic.length = this.maxMemories;
    }
    // Update summary vector
    this.summarizedVector = this.getSummaryVector();
  }

  /** Partition in-place so the top-k highest importance memories are at the front. */
  private partialSelect(k: number): void {
    const arr = this.episodic;
    let lo = 0;
    let hi = arr.length - 1;
    while (lo < hi) {
      const pivotIdx = lo + ((hi - lo) >> 1);
      const pivot = arr[pivotIdx].importance;
      // Move pivot to end
      [arr[pivotIdx], arr[hi]] = [arr[hi], arr[pivotIdx]];
      let storeIdx = lo;
      for (let i = lo; i < hi; i++) {
        if (arr[i].importance > pivot) {
          [arr[i], arr[storeIdx]] = [arr[storeIdx], arr[i]];
          storeIdx++;
        }
      }
      [arr[storeIdx], arr[hi]] = [arr[hi], arr[storeIdx]];
      if (storeIdx === k) break;
      if (storeIdx < k) lo = storeIdx + 1;
      else hi = storeIdx - 1;
    }
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

    let importanceSum = 0;
    for (const mem of this.episodic) {
      const idx = typeIndices[mem.type];
      vec[idx] += mem.importance;
      vec[5] += mem.emotionalValence * mem.importance;
      importanceSum += mem.importance;
    }
    vec[6] = this.episodic.length / this.maxMemories;
    vec[7] = this.episodic.length > 0
      ? importanceSum / this.episodic.length
      : 0;

    // Normalize: find max absolute value in a single pass
    let max = 1;
    for (let i = 0; i < vec.length; i++) {
      const abs = vec[i] < 0 ? -vec[i] : vec[i];
      if (abs > max) max = abs;
    }
    for (let i = 0; i < vec.length; i++) {
      vec[i] /= max;
    }
    return vec;
  }
}
