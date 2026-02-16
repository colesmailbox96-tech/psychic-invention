import { Entity } from '../core/ECS';
import { BrainComponent } from '../entities/components/Brain';
import { NeedsComponent } from '../entities/components/Needs';

export interface ActionResult {
  success: boolean;
  discoveredNewTile?: boolean;
  newCraftRecipe?: boolean;
  resourceGained?: number;
  socialInteraction?: boolean;
}

export class RewardSignal {
  static calculate(
    entity: Entity,
    action: number,
    result: ActionResult,
    prevNeeds: number[],
    currentNeeds: number[],
  ): number {
    let reward = 0;

    // Survival rewards: need improvements × weights
    const needWeights = [1.0, 1.0, 0.8, 0.7, 0.9, 0.6]; // hunger, thirst, energy, warmth, safety, social
    for (let i = 0; i < Math.min(prevNeeds.length, currentNeeds.length, needWeights.length); i++) {
      const improvement = currentNeeds[i] - prevNeeds[i];
      reward += improvement * needWeights[i];
    }

    // Death penalty: any need at zero
    const needs = entity.getComponent<NeedsComponent>('needs');
    if (needs) {
      const needValues = needs.toArray();
      for (const val of needValues) {
        if (val <= 0) {
          reward -= 5.0;
          break;
        }
      }
      // Critical needs penalty
      if (needs.isCritical) {
        reward -= 0.5;
      }
    }

    // Social reward
    if (result.socialInteraction) {
      reward += 0.3;
    }

    // Exploration / novelty bonus
    if (result.discoveredNewTile) {
      reward += 0.2;
    }
    if (result.newCraftRecipe) {
      reward += 0.5;
    }

    // Resource gain bonus
    if (result.resourceGained && result.resourceGained > 0) {
      reward += 0.1 * result.resourceGained;
    }

    // Efficiency bonus: success
    if (result.success) {
      reward += 0.05;
    } else {
      reward -= 0.02;
    }

    // Diversity bonus: penalize repeating the same action
    const brain = entity.getComponent<BrainComponent>('brain');
    if (brain) {
      const dist = brain.getRecentActionDistribution();
      if (action >= 0 && action < dist.length && dist[action] > 0.5) {
        reward -= 0.1 * dist[action];
      }
    }

    return reward;
  }
}
