import { Component } from '../../core/ECS';

const CRITICAL_THRESHOLD = 0.2;

export class NeedsComponent implements Component {
  type = 'needs';
  hunger: number;
  thirst: number;
  energy: number;
  warmth: number;
  safety: number;
  social: number;

  constructor() {
    this.hunger = 1.0;
    this.thirst = 1.0;
    this.energy = 1.0;
    this.warmth = 1.0;
    this.safety = 1.0;
    this.social = 1.0;
  }

  get isCritical(): boolean {
    return (
      this.hunger < CRITICAL_THRESHOLD ||
      this.thirst < CRITICAL_THRESHOLD ||
      this.energy < CRITICAL_THRESHOLD ||
      this.warmth < CRITICAL_THRESHOLD ||
      this.safety < CRITICAL_THRESHOLD ||
      this.social < CRITICAL_THRESHOLD
    );
  }

  getLowestNeed(): string {
    const needs: [string, number][] = [
      ['hunger', this.hunger],
      ['thirst', this.thirst],
      ['energy', this.energy],
      ['warmth', this.warmth],
      ['safety', this.safety],
      ['social', this.social],
    ];
    needs.sort((a, b) => a[1] - b[1]);
    return needs[0][0];
  }

  toArray(): number[] {
    return [this.hunger, this.thirst, this.energy, this.warmth, this.safety, this.social];
  }
}
