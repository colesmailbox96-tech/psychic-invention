import { World } from '../core/ECS';
import { NeedsComponent } from '../entities/components/Needs';
import { EmotionsComponent } from '../entities/components/Emotions';

export interface SimulationMetrics {
  tick: number;
  population: number;
  births: number;
  deaths: number;
  averageHunger: number;
  averageThirst: number;
  averageEnergy: number;
  averageHappiness: number;
}

const MAX_METRICS = 5000;

export class MetricsCollector {
  private metrics: SimulationMetrics[];
  private birthCount: number;
  private deathCount: number;

  constructor() {
    this.metrics = [];
    this.birthCount = 0;
    this.deathCount = 0;
  }

  collect(world: World, tick: number): SimulationMetrics {
    const entities = world.getEntitiesWithComponents('needs');
    const population = entities.length;

    let totalHunger = 0;
    let totalThirst = 0;
    let totalEnergy = 0;
    let totalHappiness = 0;

    for (const entity of entities) {
      const needs = entity.getComponent<NeedsComponent>('needs')!;
      totalHunger += needs.hunger;
      totalThirst += needs.thirst;
      totalEnergy += needs.energy;

      const emotions = entity.getComponent<EmotionsComponent>('emotions');
      totalHappiness += emotions ? emotions.valence : 0.5;
    }

    const count = Math.max(population, 1);
    const metric: SimulationMetrics = {
      tick,
      population,
      births: this.birthCount,
      deaths: this.deathCount,
      averageHunger: totalHunger / count,
      averageThirst: totalThirst / count,
      averageEnergy: totalEnergy / count,
      averageHappiness: totalHappiness / count,
    };

    this.metrics.push(metric);
    if (this.metrics.length > MAX_METRICS) {
      this.metrics = this.metrics.slice(-MAX_METRICS);
    }

    return metric;
  }

  recordBirth(): void {
    this.birthCount++;
  }

  recordDeath(): void {
    this.deathCount++;
  }

  resetPeriodic(): void {
    this.birthCount = 0;
    this.deathCount = 0;
  }

  getMetrics(): readonly SimulationMetrics[] {
    return this.metrics;
  }

  getLatest(): SimulationMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }
}
