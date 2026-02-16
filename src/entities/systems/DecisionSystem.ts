import { System, Entity, ComponentType } from '../../core/ECS';
import { BrainComponent, ACTION_NAMES } from '../components/Brain';
import { NeuralNetwork } from '../../ai/BrainArchitecture';
import { InputEncoder } from '../../ai/InputEncoder';
import { OutputDecoder } from '../../ai/OutputDecoder';
import { TileMap } from '../../world/TileMap';
import { TimeManager } from '../../world/TimeManager';

const NPCS_PER_TICK = 10;

export class DecisionSystem extends System {
  readonly requiredComponents: ComponentType[] = ['brain', 'position', 'needs'];
  private tileMap: TileMap;
  private timeManager: TimeManager;
  private network: NeuralNetwork;
  private tickCounter = 0;

  constructor(tileMap: TileMap, timeManager: TimeManager, network: NeuralNetwork) {
    super();
    this.tileMap = tileMap;
    this.timeManager = timeManager;
    this.network = network;
  }

  update(entities: Entity[], _deltaTime: number): void {
    this.tickCounter++;

    if (entities.length === 0) return;

    // Round-robin: process NPCS_PER_TICK entities per tick
    const startIdx = ((this.tickCounter - 1) * NPCS_PER_TICK) % entities.length;

    for (let i = 0; i < Math.min(NPCS_PER_TICK, entities.length); i++) {
      const idx = (startIdx + i) % entities.length;
      const entity = entities[idx];

      const brain = entity.getComponent<BrainComponent>('brain')!;

      const input = InputEncoder.encode(entity, this.tileMap, this.timeManager, entities);
      const { actionProbs, newHiddenState } = this.network.forward(input, brain.hiddenState);

      brain.hiddenState = newHiddenState;

      const action = OutputDecoder.selectAction(actionProbs);
      brain.currentAction = action;
      brain.actionName = action >= 0 && action < ACTION_NAMES.length
        ? ACTION_NAMES[action]
        : ACTION_NAMES[0];
    }
  }
}
