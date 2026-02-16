import { NeuralNetwork } from '../BrainArchitecture';

export function createGeneralistNet(): NeuralNetwork {
  return new NeuralNetwork(80, 64, 14);
}
