import { describe, it, expect } from 'vitest';
import { BrainComponent, ACTION_NAMES } from '../../src/entities/components/Brain';
import { NeuralNetwork } from '../../src/ai/BrainArchitecture';
import { CONFIG } from '../../src/config';

describe('BrainComponent', () => {
  it('should initialize with correct defaults', () => {
    const brain = new BrainComponent();
    expect(brain.type).toBe('brain');
    expect(brain.hiddenState).toBeInstanceOf(Float32Array);
    expect(brain.hiddenState.length).toBe(CONFIG.BRAIN_HIDDEN_SIZE);
    expect(brain.replayBuffer).toEqual([]);
    expect(brain.recentActions).toEqual([]);
    expect(brain.currentAction).toBe(0);
    expect(brain.actionName).toBe('IDLE');
    expect(brain.totalReward).toBe(0);
  });

  it('should add experience to replay buffer', () => {
    const brain = new BrainComponent();
    brain.addExperience([1, 2], 0, 1.0, [3, 4]);
    expect(brain.replayBuffer).toHaveLength(1);
    expect(brain.replayBuffer[0]).toEqual({
      state: [1, 2],
      action: 0,
      reward: 1.0,
      nextState: [3, 4],
    });
  });

  it('should limit replay buffer to configured capacity', () => {
    const brain = new BrainComponent();
    for (let i = 0; i < CONFIG.REPLAY_BUFFER_SIZE + 50; i++) {
      brain.addExperience([i], i % 14, 0.1, [i + 1]);
    }
    expect(brain.replayBuffer.length).toBe(CONFIG.REPLAY_BUFFER_SIZE);
  });

  it('should track recent actions up to 10', () => {
    const brain = new BrainComponent();
    for (let i = 0; i < 15; i++) {
      brain.addExperience([i], i % 14, 0.1, [i + 1]);
    }
    expect(brain.recentActions.length).toBe(10);
  });

  it('should compute recent action distribution', () => {
    const brain = new BrainComponent();
    // Add 4 IDLE actions and 6 WANDER actions
    for (let i = 0; i < 4; i++) {
      brain.addExperience([i], 0, 0.1, [i + 1]); // IDLE
    }
    for (let i = 0; i < 6; i++) {
      brain.addExperience([i], 1, 0.1, [i + 1]); // WANDER
    }
    const dist = brain.getRecentActionDistribution();
    expect(dist.length).toBe(ACTION_NAMES.length);
    expect(dist[0]).toBeCloseTo(0.4);
    expect(dist[1]).toBeCloseTo(0.6);
    expect(dist.slice(2).every((v) => v === 0)).toBe(true);
  });
});

describe('ACTION_NAMES', () => {
  it('should have 14 entries', () => {
    expect(ACTION_NAMES.length).toBe(14);
  });
});

describe('NeuralNetwork', () => {
  const inputSize = 20;
  const hiddenSize = 32;
  const outputSize = 14;

  it('should produce valid action probabilities that sum to ~1.0', () => {
    const nn = new NeuralNetwork(inputSize, hiddenSize, outputSize);
    const input = new Array(inputSize).fill(0.5);
    const hidden = new Float32Array(hiddenSize);
    const result = nn.forward(input, hidden);

    expect(result.actionProbs.length).toBe(outputSize);
    const sum = result.actionProbs.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 4);
    expect(result.actionProbs.every((p) => p >= 0 && p <= 1)).toBe(true);
  });

  it('should produce a new hidden state', () => {
    const nn = new NeuralNetwork(inputSize, hiddenSize, outputSize);
    const input = new Array(inputSize).fill(0.5);
    const hidden = new Float32Array(hiddenSize);
    const result = nn.forward(input, hidden);

    expect(result.newHiddenState).toBeInstanceOf(Float32Array);
    expect(result.newHiddenState.length).toBe(hiddenSize);
  });

  it('should roundtrip weights via getWeights/setWeights', () => {
    const nn = new NeuralNetwork(inputSize, hiddenSize, outputSize);
    const weights = nn.getWeights();
    const nn2 = new NeuralNetwork(inputSize, hiddenSize, outputSize);
    nn2.setWeights(weights);

    const input = new Array(inputSize).fill(0.3);
    const hidden = new Float32Array(hiddenSize);

    const r1 = nn.forward(input, hidden);
    const r2 = nn2.forward(input, hidden);

    for (let i = 0; i < outputSize; i++) {
      expect(r1.actionProbs[i]).toBeCloseTo(r2.actionProbs[i], 5);
    }
    expect(r1.value).toBeCloseTo(r2.value, 5);
  });

  it('should average weights correctly', () => {
    const a = new Float32Array([1.0, 2.0, 3.0]);
    const b = new Float32Array([3.0, 4.0, 5.0]);
    const avg = NeuralNetwork.averageWeights(a, b, 0);
    expect(avg[0]).toBeCloseTo(2.0);
    expect(avg[1]).toBeCloseTo(3.0);
    expect(avg[2]).toBeCloseTo(4.0);
  });

  it('should produce a numeric value from critic head', () => {
    const nn = new NeuralNetwork(inputSize, hiddenSize, outputSize);
    const input = new Array(inputSize).fill(0.5);
    const hidden = new Float32Array(hiddenSize);
    const result = nn.forward(input, hidden);
    expect(typeof result.value).toBe('number');
    expect(Number.isFinite(result.value)).toBe(true);
  });
});
