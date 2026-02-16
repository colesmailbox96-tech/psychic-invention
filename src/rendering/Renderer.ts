import { CONFIG } from '../config';
import { World } from '../core/ECS';
import { PositionComponent } from '../entities/components/Position';
import { RenderableComponent } from '../entities/components/Renderable';
import { Camera } from './Camera';
import { TileRenderer } from './TileRenderer';
import { LightingSystem } from './LightingSystem';
import { ParticleSystem } from './ParticleSystem';
import { MinimapRenderer } from './MinimapRenderer';
import { TileMap } from '../world/TileMap';
import { TimeManager } from '../world/TimeManager';

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  camera: Camera;
  private tileRenderer: TileRenderer;
  private lighting: LightingSystem;
  private particles: ParticleSystem;
  private minimap: MinimapRenderer;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2D rendering context');
    this.ctx = ctx;
    this.camera = new Camera(canvas.width, canvas.height);
    this.tileRenderer = new TileRenderer();
    this.lighting = new LightingSystem();
    this.particles = new ParticleSystem();
    this.minimap = new MinimapRenderer();
  }

  render(world: World, tileMap: TileMap, timeManager: TimeManager, interpolation: number): void {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // 1. Clear canvas
    ctx.clearRect(0, 0, w, h);

    // 2. Render tiles
    this.tileRenderer.render(ctx, tileMap, this.camera);

    // 3. Render entities (Y-sorted)
    this.renderEntities(world, interpolation);

    // 4. Render particles
    this.renderParticles();

    // 5. Render lighting overlay
    this.lighting.updateAmbient(timeManager.daylightFactor);
    this.lighting.render(ctx, this.camera);

    // 6. Render UI (minimap, etc.)
    this.renderUI(world, tileMap, timeManager);
  }

  resize(): void {
    if (typeof window !== 'undefined') {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }
    this.camera.resize(this.canvas.width, this.canvas.height);
  }

  getCamera(): Camera {
    return this.camera;
  }

  getParticleSystem(): ParticleSystem {
    return this.particles;
  }

  private renderEntities(world: World, interpolation: number): void {
    const ctx = this.ctx;
    const entities = world.getEntitiesWithComponents('position', 'renderable');

    // Y-sort for draw order
    const sorted = entities
      .map((e) => {
        const pos = e.getComponent<PositionComponent>('position')!;
        const rend = e.getComponent<RenderableComponent>('renderable')!;
        return { pos, rend, entity: e };
      })
      .filter((e) => e.rend.visible)
      .sort((a, b) => {
        if (a.rend.zIndex !== b.rend.zIndex) return a.rend.zIndex - b.rend.zIndex;
        return a.pos.y - b.pos.y;
      });

    const bounds = this.camera.getVisibleBounds();

    for (const { pos, rend } of sorted) {
      // Interpolate position
      const drawX = pos.prevX + (pos.x - pos.prevX) * interpolation;
      const drawY = pos.prevY + (pos.y - pos.prevY) * interpolation;

      // Cull off-screen entities
      if (drawX < bounds.left - 1 || drawX > bounds.right + 1 ||
          drawY < bounds.top - 1 || drawY > bounds.bottom + 1) {
        continue;
      }

      const screen = this.camera.worldToScreen(drawX, drawY);
      const tileSize = this.camera.tileScreenSize;
      const halfTile = tileSize / 2;

      // Draw as colored circle (no actual sprites)
      ctx.save();
      ctx.fillStyle = rend.tint ?? '#e06060';
      ctx.beginPath();
      ctx.arc(screen.x + halfTile, screen.y + halfTile, halfTile * 0.6, 0, Math.PI * 2);
      ctx.fill();

      // Draw direction indicator
      ctx.fillStyle = '#ffffff';
      const dirSize = halfTile * 0.2;
      let indicatorX = screen.x + halfTile;
      let indicatorY = screen.y + halfTile;
      switch (pos.direction) {
        case 'up': indicatorY -= halfTile * 0.4; break;
        case 'down': indicatorY += halfTile * 0.4; break;
        case 'left': indicatorX -= halfTile * 0.4; break;
        case 'right': indicatorX += halfTile * 0.4; break;
      }
      ctx.beginPath();
      ctx.arc(indicatorX, indicatorY, dirSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private renderParticles(): void {
    const ctx = this.ctx;
    const particles = this.particles.getParticles();

    for (const p of particles) {
      const screen = this.camera.worldToScreen(p.x, p.y);
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(screen.x - p.size / 2, screen.y - p.size / 2, p.size, p.size);
      ctx.restore();
    }
  }

  private renderUI(world: World, tileMap: TileMap, timeManager: TimeManager): void {
    const ctx = this.ctx;

    // Gather entity positions for minimap
    const posEntities = world.getEntitiesWithComponents('position');
    const entityPositions = posEntities.map((e) => {
      const pos = e.getComponent<PositionComponent>('position')!;
      return { x: pos.x, y: pos.y };
    });

    // Render minimap in bottom-right corner
    const minimapCanvas = this.minimap.render(tileMap, this.camera, entityPositions);
    if (minimapCanvas) {
      const padding = 10;
      const x = this.canvas.width - minimapCanvas.width - padding;
      const y = this.canvas.height - minimapCanvas.height - padding;

      ctx.save();
      ctx.globalAlpha = 0.8;
      ctx.drawImage(minimapCanvas, x, y);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#444444';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, minimapCanvas.width, minimapCanvas.height);
      ctx.restore();
    }

    // Render time display
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px monospace';
    ctx.textBaseline = 'top';
    const timeStr = `Day ${timeManager.day + 1} | ${String(timeManager.hour).padStart(2, '0')}:00 | ${timeManager.season} Y${timeManager.year + 1}`;
    ctx.fillText(timeStr, 10, 10);

    // Entity count
    ctx.fillText(`Entities: ${world.entityCount}`, 10, 28);
    ctx.restore();
  }
}
