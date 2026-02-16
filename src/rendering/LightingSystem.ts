import { Camera } from './Camera';

interface PointLight {
  x: number;
  y: number;
  radius: number;
  color: string;
  intensity: number;
}

export class LightingSystem {
  private ambientColor: string;
  private ambientAlpha: number;
  private pointLights: PointLight[];

  constructor() {
    this.ambientColor = '#000022';
    this.ambientAlpha = 0;
    this.pointLights = [];
  }

  updateAmbient(daylightFactor: number): void {
    // 0 = midnight (dark), 1 = noon (bright)
    this.ambientAlpha = 1 - daylightFactor;
    // Shift color from deep blue at night to transparent at day
    const r = Math.round(0 + daylightFactor * 0);
    const g = Math.round(0 + daylightFactor * 0);
    const b = Math.round(34 + daylightFactor * (0 - 34));
    this.ambientColor = `rgb(${r},${g},${b})`;
  }

  addPointLight(x: number, y: number, radius: number, color: string = '#ffcc66', intensity: number = 1): number {
    this.pointLights.push({ x, y, radius, color, intensity });
    return this.pointLights.length - 1;
  }

  removePointLight(index: number): void {
    if (index >= 0 && index < this.pointLights.length) {
      this.pointLights.splice(index, 1);
    }
  }

  clearPointLights(): void {
    this.pointLights = [];
  }

  render(ctx: CanvasRenderingContext2D, camera: Camera): void {
    const w = camera.viewportWidth;
    const h = camera.viewportHeight;

    if (this.ambientAlpha <= 0.01) return;

    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = this.ambientColor;
    ctx.globalAlpha = this.ambientAlpha * 0.7;
    ctx.fillRect(0, 0, w, h);

    // Punch holes for point lights
    if (this.pointLights.length > 0) {
      ctx.globalCompositeOperation = 'destination-out';
      for (const light of this.pointLights) {
        const screen = camera.worldToScreen(light.x, light.y);
        const screenRadius = light.radius * camera.tileScreenSize;

        const gradient = ctx.createRadialGradient(
          screen.x, screen.y, 0,
          screen.x, screen.y, screenRadius,
        );
        gradient.addColorStop(0, `rgba(0,0,0,${light.intensity})`);
        gradient.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(
          screen.x - screenRadius,
          screen.y - screenRadius,
          screenRadius * 2,
          screenRadius * 2,
        );
      }
    }

    ctx.restore();
  }

  getAmbientAlpha(): number {
    return this.ambientAlpha;
  }

  getAmbientColor(): string {
    return this.ambientColor;
  }
}
