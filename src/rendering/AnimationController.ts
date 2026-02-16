export interface AnimationDef {
  name: string;
  frames: number[];
  frameRate: number;
  loop: boolean;
}

export class AnimationController {
  private animations: Map<string, AnimationDef>;
  private currentAnimation: string;
  private currentFrame: number;
  private frameTimer: number;

  constructor() {
    this.animations = new Map();
    this.currentAnimation = '';
    this.currentFrame = 0;
    this.frameTimer = 0;
  }

  addAnimation(def: AnimationDef): void {
    this.animations.set(def.name, def);
  }

  play(name: string): void {
    if (this.currentAnimation === name) return;
    const anim = this.animations.get(name);
    if (!anim) return;
    this.currentAnimation = name;
    this.currentFrame = 0;
    this.frameTimer = 0;
  }

  update(deltaTime: number): void {
    const anim = this.animations.get(this.currentAnimation);
    if (!anim || anim.frames.length === 0) return;

    this.frameTimer += deltaTime;
    const frameDuration = 1 / anim.frameRate;

    while (this.frameTimer >= frameDuration) {
      this.frameTimer -= frameDuration;
      this.currentFrame++;
      if (this.currentFrame >= anim.frames.length) {
        if (anim.loop) {
          this.currentFrame = 0;
        } else {
          this.currentFrame = anim.frames.length - 1;
          this.frameTimer = 0;
          break;
        }
      }
    }
  }

  getCurrentFrame(): number {
    const anim = this.animations.get(this.currentAnimation);
    if (!anim || anim.frames.length === 0) return 0;
    return anim.frames[this.currentFrame];
  }

  get isPlaying(): boolean {
    const anim = this.animations.get(this.currentAnimation);
    if (!anim) return false;
    if (anim.loop) return true;
    return this.currentFrame < anim.frames.length - 1;
  }
}
