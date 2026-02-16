import { CONFIG } from '../config';

export class Chunk {
  readonly chunkX: number;
  readonly chunkY: number;
  readonly size: number;
  dirty: boolean;
  private offscreenCanvas: OffscreenCanvas | HTMLCanvasElement | null;

  constructor(chunkX: number, chunkY: number, size: number = CONFIG.CHUNK_SIZE) {
    this.chunkX = chunkX;
    this.chunkY = chunkY;
    this.size = size;
    this.dirty = true;
    this.offscreenCanvas = null;
  }

  get worldX(): number {
    return this.chunkX * this.size;
  }

  get worldY(): number {
    return this.chunkY * this.size;
  }

  contains(worldTileX: number, worldTileY: number): boolean {
    return (
      worldTileX >= this.worldX &&
      worldTileX < this.worldX + this.size &&
      worldTileY >= this.worldY &&
      worldTileY < this.worldY + this.size
    );
  }

  markDirty(): void {
    this.dirty = true;
  }

  getCanvas(): OffscreenCanvas | HTMLCanvasElement {
    if (!this.offscreenCanvas) {
      const pixelSize = this.size * CONFIG.TILE_SIZE;
      if (typeof OffscreenCanvas !== 'undefined') {
        this.offscreenCanvas = new OffscreenCanvas(pixelSize, pixelSize);
      } else {
        const canvas = document.createElement('canvas');
        canvas.width = pixelSize;
        canvas.height = pixelSize;
        this.offscreenCanvas = canvas;
      }
    }
    return this.offscreenCanvas;
  }

  clearCanvas(): void {
    if (this.offscreenCanvas) {
      const ctx = this.offscreenCanvas.getContext('2d') as
        | OffscreenCanvasRenderingContext2D
        | CanvasRenderingContext2D
        | null;
      if (ctx) {
        ctx.clearRect(
          0,
          0,
          this.size * CONFIG.TILE_SIZE,
          this.size * CONFIG.TILE_SIZE,
        );
      }
    }
  }
}

export class ChunkManager {
  private chunks: Map<string, Chunk>;
  private chunkSize: number;

  constructor(chunkSize: number = CONFIG.CHUNK_SIZE) {
    this.chunks = new Map();
    this.chunkSize = chunkSize;
  }

  getChunk(chunkX: number, chunkY: number): Chunk {
    const key = ChunkManager.chunkKey(chunkX, chunkY);
    let chunk = this.chunks.get(key);
    if (!chunk) {
      chunk = new Chunk(chunkX, chunkY, this.chunkSize);
      this.chunks.set(key, chunk);
    }
    return chunk;
  }

  getChunkAt(worldTileX: number, worldTileY: number): Chunk {
    const cx = Math.floor(worldTileX / this.chunkSize);
    const cy = Math.floor(worldTileY / this.chunkSize);
    return this.getChunk(cx, cy);
  }

  getVisibleChunks(
    cameraX: number,
    cameraY: number,
    viewWidth: number,
    viewHeight: number,
    tileSize: number,
  ): Chunk[] {
    const chunkPixelSize = this.chunkSize * tileSize;
    const startCX = Math.floor(cameraX / chunkPixelSize);
    const startCY = Math.floor(cameraY / chunkPixelSize);
    const endCX = Math.floor((cameraX + viewWidth) / chunkPixelSize);
    const endCY = Math.floor((cameraY + viewHeight) / chunkPixelSize);

    const visible: Chunk[] = [];
    for (let cy = startCY; cy <= endCY; cy++) {
      for (let cx = startCX; cx <= endCX; cx++) {
        visible.push(this.getChunk(cx, cy));
      }
    }
    return visible;
  }

  markDirty(worldTileX: number, worldTileY: number): void {
    const cx = Math.floor(worldTileX / this.chunkSize);
    const cy = Math.floor(worldTileY / this.chunkSize);
    const key = ChunkManager.chunkKey(cx, cy);
    const chunk = this.chunks.get(key);
    if (chunk) {
      chunk.markDirty();
    }
  }

  static chunkKey(cx: number, cy: number): string {
    return `${cx},${cy}`;
  }
}
