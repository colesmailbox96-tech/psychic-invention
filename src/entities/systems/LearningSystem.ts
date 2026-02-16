import { System, Entity, ComponentType } from '../../core/ECS';
import { BrainComponent } from '../components/Brain';
import { NeuralNetwork } from '../../ai/BrainArchitecture';
import { TrainingManager } from '../../ai/TrainingManager';
import { CONFIG } from '../../config';

export class LearningSystem extends System {
  readonly requiredComponents: ComponentType[] = ['brain'];
  private network: NeuralNetwork;

  constructor(network: NeuralNetwork) {
    super();
    this.network = network;
  }

  update(entities: Entity[], _deltaTime: number): void {
    for (const entity of entities) {
      const brain = entity.getComponent<BrainComponent>('brain')!;

      brain.ticksSinceLastTraining++;

      if (brain.ticksSinceLastTraining < CONFIG.TRAINING_INTERVAL_TICKS) continue;
      if (brain.replayBuffer.length < CONFIG.TRAINING_BATCH_SIZE) continue;

      // Sample mini-batch
      const batch = this.sampleBatch(brain.replayBuffer, CONFIG.TRAINING_BATCH_SIZE);

      TrainingManager.trainBatch(this.network, batch, CONFIG.LEARNING_RATE);

      brain.ticksSinceLastTraining = 0;

      // Keep only recent experiences
      if (brain.replayBuffer.length > CONFIG.REPLAY_BUFFER_SIZE) {
        brain.replayBuffer = brain.replayBuffer.slice(-CONFIG.REPLAY_BUFFER_SIZE);
      }
    }
  }

  private sampleBatch(
    buffer: Array<{ state: number[]; action: number; reward: number; nextState: number[] }>,
    batchSize: number,
  ): Array<{ state: number[]; action: number; reward: number; nextState: number[] }> {
    const batch: Array<{ state: number[]; action: number; reward: number; nextState: number[] }> = [];
    for (let i = 0; i < batchSize; i++) {
      const idx = Math.floor(Math.random() * buffer.length);
      batch.push(buffer[idx]);
    }
    return batch;
  }
}
