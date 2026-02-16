import { ACTION_NAMES } from '../entities/components/Brain';

export class OutputDecoder {
  static selectAction(actionProbs: number[], temperature = 1.0): number {
    // Apply temperature scaling
    let probs: number[];
    if (temperature !== 1.0) {
      const logits = actionProbs.map(p => Math.log(Math.max(p, 1e-10)));
      const scaled = logits.map(l => l / temperature);
      const max = Math.max(...scaled);
      const exps = scaled.map(s => Math.exp(s - max));
      const sum = exps.reduce((a, b) => a + b, 0);
      probs = exps.map(e => e / sum);
    } else {
      probs = actionProbs;
    }

    // Sample from distribution
    const rand = Math.random();
    let cumulative = 0;
    for (let i = 0; i < probs.length; i++) {
      cumulative += probs[i];
      if (rand < cumulative) return i;
    }
    return probs.length - 1;
  }

  static getActionName(actionIndex: number): string {
    if (actionIndex >= 0 && actionIndex < ACTION_NAMES.length) {
      return ACTION_NAMES[actionIndex];
    }
    return ACTION_NAMES[0];
  }

  static maskActions(probs: number[], validActions: boolean[]): number[] {
    const masked = probs.map((p, i) => (validActions[i] ? p : 0));
    const sum = masked.reduce((a, b) => a + b, 0);
    if (sum <= 0) {
      // If all masked out, allow IDLE (index 0)
      const fallback = new Array(probs.length).fill(0);
      fallback[0] = 1;
      return fallback;
    }
    return masked.map(p => p / sum);
  }
}
