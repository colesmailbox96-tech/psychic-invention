import { System, Entity, ComponentType } from '../../core/ECS';
import { EmotionsComponent } from '../components/Emotions';
import { NeedsComponent } from '../components/Needs';

const LERP_SPEED = 0.1;

export class EmotionSystem extends System {
  readonly requiredComponents: ComponentType[] = ['emotions', 'needs'];

  update(entities: Entity[], deltaTime: number): void {
    for (const entity of entities) {
      const emotions = entity.getComponent<EmotionsComponent>('emotions')!;
      const needs = entity.getComponent<NeedsComponent>('needs')!;

      const avgSatisfaction =
        (needs.hunger + needs.thirst + needs.energy + needs.warmth + needs.safety + needs.social) / 6;

      // Target valence: 0 when needs empty, 1 when full
      const targetValence = avgSatisfaction;

      // Target arousal: high when needs are critical (low satisfaction), low when comfortable
      const minNeed = Math.min(needs.hunger, needs.thirst, needs.energy, needs.warmth, needs.safety);
      const targetArousal = 1 - minNeed;

      const lerpFactor = LERP_SPEED * deltaTime;
      emotions.valence += (targetValence - emotions.valence) * lerpFactor;
      emotions.arousal += (targetArousal - emotions.arousal) * lerpFactor;

      emotions.valence = Math.max(0, Math.min(1, emotions.valence));
      emotions.arousal = Math.max(0, Math.min(1, emotions.arousal));
    }
  }
}
