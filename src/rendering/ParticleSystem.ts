import { CONFIG } from '../config';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  alpha: number;
}

export class ParticleSystem {
  private particles: Particle[];
  private maxParticles: number;

  constructor(maxParticles: number = CONFIG.MAX_PARTICLES) {
    this.particles = [];
    this.maxParticles = maxParticles;
  }

  emit(
    x: number,
    y: number,
    count: number,
    config?: Partial<{
      speed: number;
      spread: number;
      life: number;
      size: number;
      color: string;
      gravity: number;
    }>,
  ): void {
    const speed = config?.speed ?? 50;
    const spread = config?.spread ?? Math.PI * 2;
    const life = config?.life ?? 1;
    const size = config?.size ?? 3;
    const color = config?.color ?? '#ffffff';

    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const angle = Math.random() * spread - spread / 2;
      const spd = speed * (0.5 + Math.random() * 0.5);
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life,
        maxLife: life,
        size,
        color,
        alpha: 1,
      });
    }
  }

  update(deltaTime: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;
      p.life -= deltaTime;
      p.alpha = Math.max(0, p.life / p.maxLife);

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  getParticles(): readonly Particle[] {
    return this.particles;
  }

  get activeCount(): number {
    return this.particles.length;
  }
}
