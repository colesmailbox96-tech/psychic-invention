import { NeuralNetwork } from './BrainArchitecture';
import { CONFIG } from '../config';

export class TrainingManager {
  static trainBatch(
    network: NeuralNetwork,
    experiences: Array<{ state: number[]; action: number; reward: number; nextState: number[] }>,
    learningRate = CONFIG.LEARNING_RATE,
  ): number {
    if (experiences.length === 0) return 0;

    const gamma = CONFIG.DISCOUNT_FACTOR;
    const { hidden } = network.sizes;
    let totalLoss = 0;

    const originalWeights = network.getWeights();
    const gradAccum = new Float32Array(originalWeights.length);

    for (const exp of experiences) {
      const hiddenState = new Float32Array(hidden);
      const { actionProbs, value } = network.forward(exp.state, hiddenState);

      // Estimate next state value
      const nextHidden = new Float32Array(hidden);
      const nextResult = network.forward(exp.nextState, nextHidden);
      const nextValue = nextResult.value;

      // Advantage: A = r + γ*V(s') - V(s)
      const advantage = exp.reward + gamma * nextValue - value;

      // Compute gradient via finite differences for the policy gradient
      const grad = TrainingManager.computeGradient(network, exp.state, exp.action, advantage);

      for (let i = 0; i < gradAccum.length; i++) {
        gradAccum[i] += grad[i];
      }

      // Loss = -advantage * log(π(a|s)) + 0.5 * advantage²
      const actionProb = Math.max(actionProbs[exp.action], 1e-10);
      totalLoss += -advantage * Math.log(actionProb) + 0.5 * advantage * advantage;
    }

    // Apply averaged gradient with SGD
    const batchSize = experiences.length;
    const weights = network.getWeights();
    for (let i = 0; i < weights.length; i++) {
      weights[i] += (learningRate / batchSize) * gradAccum[i];
    }
    network.setWeights(weights);

    return totalLoss / batchSize;
  }

  private static computeGradient(
    network: NeuralNetwork,
    state: number[],
    action: number,
    advantage: number,
  ): Float32Array {
    const weights = network.getWeights();
    const grad = new Float32Array(weights.length);
    const epsilon = 1e-4;
    const { hidden } = network.sizes;
    const hiddenState = new Float32Array(hidden);

    // Baseline log-probability
    const baseResult = network.forward(state, hiddenState);
    const baseLogProb = Math.log(Math.max(baseResult.actionProbs[action], 1e-10));

    // Numerical gradient with respect to policy log-probability
    // Sample a subset of weights to keep cost manageable
    const stride = Math.max(1, Math.floor(weights.length / 200));
    for (let i = 0; i < weights.length; i += stride) {
      weights[i] += epsilon;
      network.setWeights(weights);
      const pertResult = network.forward(state, new Float32Array(hidden));
      const pertLogProb = Math.log(Math.max(pertResult.actionProbs[action], 1e-10));

      // Policy gradient: ∂logπ/∂θ * advantage
      const dLogProb = (pertLogProb - baseLogProb) / epsilon;
      grad[i] = dLogProb * advantage;

      // Critic gradient: push value toward reward + γV(s')
      grad[i] -= 0.5 * (pertResult.value - baseResult.value) / epsilon * advantage;

      weights[i] -= epsilon;
    }

    // Restore original weights
    network.setWeights(weights);
    return grad;
  }
}
