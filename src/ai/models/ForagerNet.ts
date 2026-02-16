import { NeuralNetwork } from '../BrainArchitecture';

export function createForagerNet(): NeuralNetwork {
  return new NeuralNetwork(80, 48, 14);
}
