import { CONFIG } from '../config';

export type UpdateCallback = (deltaTime: number) => void;
export type RenderCallback = (interpolation: number) => void;

export class GameLoop {
  private running: boolean = false;
  private speed: number = 1;
  private tickRate: number;
  private accumulator: number = 0;
  private lastTime: number = 0;
  private onUpdate: UpdateCallback;
  private onRender: RenderCallback;
  private animFrameId: number = 0;
  private tickCount: number = 0;

  constructor(onUpdate: UpdateCallback, onRender: RenderCallback) {
    this.onUpdate = onUpdate;
    this.onRender = onRender;
    this.tickRate = 1000 / CONFIG.TICKS_PER_SECOND;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.animFrameId = requestAnimationFrame((t) => this.loop(t));
  }

  stop(): void {
    this.running = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = 0;
    }
  }

  setSpeed(multiplier: number): void {
    this.speed = multiplier;
  }

  get currentTick(): number {
    return this.tickCount;
  }

  get isRunning(): boolean {
    return this.running;
  }

  get currentSpeed(): number {
    return this.speed;
  }

  private loop(timestamp: number): void {
    if (!this.running) return;

    const elapsed = timestamp - this.lastTime;
    this.lastTime = timestamp;

    // Cap elapsed time to prevent spiral of death (~15 frames at 60fps)
    const MAX_FRAME_TIME = 250;
    const cappedElapsed = Math.min(elapsed, MAX_FRAME_TIME);
    this.accumulator += cappedElapsed * this.speed;

    const fixedDt = 1 / CONFIG.TICKS_PER_SECOND;

    while (this.accumulator >= this.tickRate) {
      this.onUpdate(fixedDt);
      this.tickCount++;
      this.accumulator -= this.tickRate;
    }

    const interpolation = this.accumulator / this.tickRate;
    this.onRender(interpolation);

    this.animFrameId = requestAnimationFrame((t) => this.loop(t));
  }
}
