import { Component } from '../../core/ECS';
import { CONFIG } from '../../config';

export const ACTION_NAMES = [
  'IDLE', 'WANDER', 'FORAGE', 'DRINK', 'HARVEST', 'CRAFT', 'BUILD',
  'EAT', 'SLEEP', 'SOCIALIZE', 'TRADE', 'FLEE', 'EXPLORE', 'REPRODUCE',
] as const;

export class BrainComponent implements Component {
  type = 'brain';
  hiddenState: Float32Array;
  replayBuffer: Array<{ state: number[]; action: number; reward: number; nextState: number[] }>;
  recentActions: number[];
  currentAction: number;
  actionName: string;
  ticksSinceLastTraining: number;
  totalReward: number;

  constructor() {
    this.hiddenState = new Float32Array(CONFIG.BRAIN_HIDDEN_SIZE);
    this.replayBuffer = [];
    this.recentActions = [];
    this.currentAction = 0;
    this.actionName = ACTION_NAMES[0];
    this.ticksSinceLastTraining = 0;
    this.totalReward = 0;
  }

  addExperience(state: number[], action: number, reward: number, nextState: number[]): void {
    this.replayBuffer.push({ state, action, reward, nextState });
    if (this.replayBuffer.length > CONFIG.REPLAY_BUFFER_SIZE) {
      this.replayBuffer.shift();
    }
    this.recentActions.push(action);
    if (this.recentActions.length > 10) {
      this.recentActions.shift();
    }
    this.totalReward += reward;
  }

  getRecentActionDistribution(): number[] {
    const dist = new Array(ACTION_NAMES.length).fill(0);
    for (const action of this.recentActions) {
      if (action >= 0 && action < dist.length) {
        dist[action]++;
      }
    }
    const total = this.recentActions.length || 1;
    return dist.map(count => count / total);
  }
}
