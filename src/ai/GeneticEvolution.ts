import { NeuralNetwork } from './BrainArchitecture';
import { CONFIG } from '../config';

function gaussianRandom(): number {
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2.0 * Math.log(u1 || 1e-10)) * Math.cos(2.0 * Math.PI * u2);
}

export class GeneticEvolution {
  static crossoverNetworks(
    parent1: NeuralNetwork,
    parent2: NeuralNetwork,
    mutationRate = CONFIG.MUTATION_RATE,
  ): NeuralNetwork {
    const { input, hidden, output } = parent1.sizes;
    const child = new NeuralNetwork(input, hidden, output);

    const childWeights = NeuralNetwork.averageWeights(
      parent1.getWeights(),
      parent2.getWeights(),
      mutationRate * 0.1,
    );

    child.setWeights(childWeights);

    // Apply additional point mutations
    GeneticEvolution.mutate(child, mutationRate);

    return child;
  }

  static mutate(network: NeuralNetwork, rate = CONFIG.MUTATION_RATE): void {
    const weights = network.getWeights();
    for (let i = 0; i < weights.length; i++) {
      if (Math.random() < rate) {
        weights[i] += gaussianRandom() * 0.1;
      }
    }
    network.setWeights(weights);
  }
}
