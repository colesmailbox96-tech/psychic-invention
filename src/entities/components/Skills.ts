import { Component } from '../../core/ECS';

export class SkillsComponent implements Component {
  type = 'skills';
  foraging: number;
  crafting: number;
  building: number;
  fishing: number;
  combat: number;
  social: number;

  constructor() {
    this.foraging = 0;
    this.crafting = 0;
    this.building = 0;
    this.fishing = 0;
    this.combat = 0;
    this.social = 0;
  }

  improve(skill: string, amount = 0.01): void {
    const self = this as unknown as Record<string, unknown>;
    if (skill in this && typeof self[skill] === 'number') {
      self[skill] = Math.min(1, (self[skill] as number) + amount);
    }
  }

  getLevel(skill: string): number {
    const self = this as unknown as Record<string, unknown>;
    if (skill in this && typeof self[skill] === 'number') {
      return self[skill] as number;
    }
    return 0;
  }

  toArray(): number[] {
    return [this.foraging, this.crafting, this.building, this.fishing, this.combat, this.social];
  }
}
