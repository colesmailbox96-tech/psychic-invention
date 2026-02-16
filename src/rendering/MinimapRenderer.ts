import { TileMap, TileType } from '../world/TileMap';
import { Camera } from './Camera';

export class MinimapRenderer {
  private canvas: HTMLCanvasElement | null;
  private ctx: CanvasRenderingContext2D | null;
  private size: number;
  private dirty: boolean;

  constructor(size: number = 128) {
    this.size = size;
    this.dirty = true;
    if (typeof document !== 'undefined') {
      this.canvas = document.createElement('canvas');
      this.canvas.width = size;
      this.canvas.height = size;
      this.ctx = this.canvas.getContext('2d');
    } else {
      this.canvas = null;
      this.ctx = null;
    }
  }

  render(
    tileMap: TileMap,
    camera: Camera,
    entityPositions?: Array<{ x: number; y: number }>,
  ): HTMLCanvasElement | null {
    if (!this.canvas || !this.ctx) return null;

    const ctx = this.ctx;
    const scaleX = this.size / tileMap.width;
    const scaleY = this.size / tileMap.height;

    if (this.dirty) {
      ctx.clearRect(0, 0, this.size, this.size);

      // Draw tiles
      for (let ty = 0; ty < tileMap.height; ty++) {
        for (let tx = 0; tx < tileMap.width; tx++) {
          const tile = tileMap.getTile(tx, ty);
          if (!tile) continue;
          ctx.fillStyle = this.getTileColor(tile.type);
          ctx.fillRect(
            Math.floor(tx * scaleX),
            Math.floor(ty * scaleY),
            Math.ceil(scaleX),
            Math.ceil(scaleY),
          );
        }
      }
      this.dirty = false;
    }

    // Redraw viewport rect and entities on top each frame
    // Re-draw terrain cache first
    const imageData = ctx.getImageData(0, 0, this.size, this.size);
    ctx.putImageData(imageData, 0, 0);

    // Draw entity positions as white dots
    if (entityPositions) {
      ctx.fillStyle = '#ffffff';
      for (const pos of entityPositions) {
        const px = pos.x * scaleX;
        const py = pos.y * scaleY;
        ctx.fillRect(Math.floor(px) - 1, Math.floor(py) - 1, 2, 2);
      }
    }

    // Draw camera viewport rectangle
    const bounds = camera.getVisibleBounds();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(
      bounds.left * scaleX,
      bounds.top * scaleY,
      (bounds.right - bounds.left) * scaleX,
      (bounds.bottom - bounds.top) * scaleY,
    );

    return this.canvas;
  }

  markDirty(): void {
    this.dirty = true;
  }

  private getTileColor(type: TileType): string {
    switch (type) {
      case TileType.GRASS: return '#6aaa3a';
      case TileType.DIRT: return '#b8860b';
      case TileType.STONE: return '#8a8a8a';
      case TileType.SAND: return '#d2a85e';
      case TileType.WATER: return '#4a9ec4';
      case TileType.SNOW: return '#e8e8f0';
      case TileType.MARSH: return '#5a7a4a';
      case TileType.DEEP_WATER: return '#2e6b8a';
      case TileType.PATH: return '#c4a882';
      case TileType.FARMLAND: return '#8b6914';
      default: return '#000000';
    }
  }
}
