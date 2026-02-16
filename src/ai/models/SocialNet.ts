import { NeuralNetwork } from '../BrainArchitecture';

export function createSocialNet(): NeuralNetwork {
  return new NeuralNetwork(80, 48, 14);
}
