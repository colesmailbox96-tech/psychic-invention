import { Component } from '../../core/ECS';
import { CONFIG } from '../../config';

export class GeneticsComponent implements Component {
  type = 'genetics';
  metabolismRate: number;
  learningRate: number;
  socialAffinity: number;
  explorationDrive: number;
  physicalStrength: number;
  resilience: number;
  generation: number;
  parentIds: number[];

  constructor(generation = 0) {
    this.metabolismRate = Math.random();
    this.learningRate = Math.random();
    this.socialAffinity = Math.random();
    this.explorationDrive = Math.random();
    this.physicalStrength = Math.random();
    this.resilience = Math.random();
    this.generation = generation;
    this.parentIds = [];
  }

  static crossover(parent1: GeneticsComponent, parent2: GeneticsComponent, childGeneration: number): GeneticsComponent {
    const child = new GeneticsComponent(childGeneration);
    child.parentIds = [
      ...(parent1.parentIds.length ? [parent1.parentIds[0]] : []),
      ...(parent2.parentIds.length ? [parent2.parentIds[0]] : []),
    ];

    const traits: (keyof GeneticsComponent)[] = [
      'metabolismRate', 'learningRate', 'socialAffinity',
      'explorationDrive', 'physicalStrength', 'resilience',
    ];

    for (const trait of traits) {
      const value = Math.random() < 0.5
        ? parent1[trait] as number
        : parent2[trait] as number;

      // Apply mutation with gaussian noise
      const self = child as unknown as Record<string, unknown>;
      if (Math.random() < CONFIG.MUTATION_RATE) {
        const noise = gaussianRandom() * 0.1;
        self[trait] = Math.max(0, Math.min(1, value + noise));
      } else {
        self[trait] = value;
      }
    }

    return child;
  }

  toArray(): number[] {
    return [
      this.metabolismRate, this.learningRate, this.socialAffinity,
      this.explorationDrive, this.physicalStrength, this.resilience,
    ];
  }
}

function gaussianRandom(): number {
  // Box-Muller transform
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
}
