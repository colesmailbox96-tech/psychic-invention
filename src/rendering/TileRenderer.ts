import { TileMap, TileType } from '../world/TileMap';
import { Camera } from './Camera';
import { ChunkManager } from '../world/Chunk';

export class TileRenderer {
  private chunkManager: ChunkManager;
  private tileColors: Map<TileType, string>;

  constructor() {
    this.chunkManager = new ChunkManager();
    this.tileColors = new Map<TileType, string>([
      [TileType.GRASS, '#6aaa3a'],
      [TileType.DIRT, '#b8860b'],
      [TileType.STONE, '#8a8a8a'],
      [TileType.SAND, '#d2a85e'],
      [TileType.WATER, '#4a9ec4'],
      [TileType.SNOW, '#e8e8f0'],
      [TileType.MARSH, '#5a7a4a'],
      [TileType.DEEP_WATER, '#2e6b8a'],
      [TileType.PATH, '#c4a882'],
      [TileType.FARMLAND, '#8b6914'],
    ]);
  }

  render(ctx: CanvasRenderingContext2D, tileMap: TileMap, camera: Camera): void {
    const bounds = camera.getVisibleBounds();
    const chunkSize = this.chunkManager['chunkSize'];

    const startCX = Math.floor(bounds.left / chunkSize);
    const startCY = Math.floor(bounds.top / chunkSize);
    const endCX = Math.floor(bounds.right / chunkSize);
    const endCY = Math.floor(bounds.bottom / chunkSize);

    for (let cy = startCY; cy <= endCY; cy++) {
      for (let cx = startCX; cx <= endCX; cx++) {
        this.renderChunk(ctx, tileMap, camera, cx, cy);
      }
    }
  }

  private renderChunk(
    ctx: CanvasRenderingContext2D,
    tileMap: TileMap,
    camera: Camera,
    chunkX: number,
    chunkY: number,
  ): void {
    const chunk = this.chunkManager.getChunk(chunkX, chunkY);
    const tileSize = camera.tileScreenSize;
    const startX = chunk.worldX;
    const startY = chunk.worldY;

    for (let ly = 0; ly < chunk.size; ly++) {
      for (let lx = 0; lx < chunk.size; lx++) {
        const worldTX = startX + lx;
        const worldTY = startY + ly;
        const tile = tileMap.getTile(worldTX, worldTY);
        if (!tile) continue;

        const screen = camera.worldToScreen(worldTX, worldTY);
        ctx.fillStyle = this.getTileColor(tile.type);
        ctx.fillRect(screen.x, screen.y, Math.ceil(tileSize), Math.ceil(tileSize));
      }
    }
  }

  private getTileColor(type: TileType): string {
    return this.tileColors.get(type) ?? '#000000';
  }
}
