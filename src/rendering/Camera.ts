import { CONFIG } from '../config';

export class Camera {
  x: number;
  y: number;
  zoom: number;
  viewportWidth: number;
  viewportHeight: number;

  constructor(viewportWidth: number, viewportHeight: number) {
    this.x = 0;
    this.y = 0;
    this.zoom = 2;
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
  }

  pan(dx: number, dy: number): void {
    this.x += dx;
    this.y += dy;
  }

  setZoom(zoom: number, pivotX?: number, pivotY?: number): void {
    const newZoom = Math.max(CONFIG.CAMERA_ZOOM_MIN, Math.min(CONFIG.CAMERA_ZOOM_MAX, zoom));
    if (pivotX !== undefined && pivotY !== undefined) {
      const worldBefore = this.screenToWorld(pivotX, pivotY);
      this.zoom = newZoom;
      const worldAfter = this.screenToWorld(pivotX, pivotY);
      this.x += worldBefore.x - worldAfter.x;
      this.y += worldBefore.y - worldAfter.y;
    } else {
      this.zoom = newZoom;
    }
  }

  screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    const tileSize = this.tileScreenSize;
    return {
      x: this.x + screenX / tileSize,
      y: this.y + screenY / tileSize,
    };
  }

  worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    const tileSize = this.tileScreenSize;
    return {
      x: (worldX - this.x) * tileSize,
      y: (worldY - this.y) * tileSize,
    };
  }

  getVisibleBounds(): { left: number; top: number; right: number; bottom: number } {
    const tileSize = this.tileScreenSize;
    const tilesW = this.viewportWidth / tileSize;
    const tilesH = this.viewportHeight / tileSize;
    return {
      left: Math.floor(this.x),
      top: Math.floor(this.y),
      right: Math.ceil(this.x + tilesW),
      bottom: Math.ceil(this.y + tilesH),
    };
  }

  get tileScreenSize(): number {
    return CONFIG.TILE_SIZE * this.zoom;
  }

  centerOn(worldX: number, worldY: number): void {
    const tileSize = this.tileScreenSize;
    this.x = worldX - this.viewportWidth / (2 * tileSize);
    this.y = worldY - this.viewportHeight / (2 * tileSize);
  }

  resize(width: number, height: number): void {
    this.viewportWidth = width;
    this.viewportHeight = height;
  }
}
