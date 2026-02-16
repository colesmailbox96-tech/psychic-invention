import { Component } from '../../core/ECS';

const NEUTRAL_THRESHOLD = 0.1;

export class EmotionsComponent implements Component {
  type = 'emotions';
  valence: number;
  arousal: number;

  constructor(valence = 0.5, arousal = 0.3) {
    this.valence = valence;
    this.arousal = arousal;
  }

  get mood(): string {
    if (Math.abs(this.valence) < NEUTRAL_THRESHOLD) return 'neutral';
    if (this.valence > 0) {
      return this.arousal > 0.5 ? 'excited' : 'content';
    }
    if (this.arousal > 0.8) return 'afraid';
    if (this.arousal > 0.5) return 'angry';
    return 'sad';
  }

  toArray(): number[] {
    return [this.valence, this.arousal];
  }
}
