export enum TileType {
  GRASS = 0, DIRT = 1, STONE = 2, SAND = 3, WATER = 4,
  SNOW = 5, MARSH = 6, DEEP_WATER = 7, PATH = 8, FARMLAND = 9
}

export enum BiomeType {
  MEADOW = 'meadow', FOREST = 'forest', MOUNTAIN = 'mountain',
  WETLAND = 'wetland', DESERT = 'desert', TUNDRA = 'tundra', COAST = 'coast'
}

export interface Tile {
  type: TileType;
  biome: BiomeType;
  elevation: number;
  moisture: number;
  temperature: number;
  walkable: boolean;
  movementCost: number;
  resource: string | null;
  resourceAmount: number;
  hasStructure: boolean;
  explored: boolean;
}

function createDefaultTile(): Tile {
  return {
    type: TileType.GRASS,
    biome: BiomeType.MEADOW,
    elevation: 0,
    moisture: 0,
    temperature: 0.5,
    walkable: true,
    movementCost: 1.0,
    resource: null,
    resourceAmount: 0,
    hasStructure: false,
    explored: false,
  };
}

export class TileMap {
  readonly width: number;
  readonly height: number;
  private tiles: Tile[];

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.tiles = new Array(width * height);
    for (let i = 0; i < this.tiles.length; i++) {
      this.tiles[i] = createDefaultTile();
    }
  }

  getTile(x: number, y: number): Tile | null {
    if (!this.isInBounds(x, y)) return null;
    return this.tiles[y * this.width + x];
  }

  setTile(x: number, y: number, tile: Partial<Tile>): void {
    if (!this.isInBounds(x, y)) return;
    const existing = this.tiles[y * this.width + x];
    Object.assign(existing, tile);
  }

  isInBounds(x: number, y: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  isWalkable(x: number, y: number): boolean {
    const tile = this.getTile(x, y);
    return tile !== null && tile.walkable;
  }

  getMovementCost(x: number, y: number): number {
    const tile = this.getTile(x, y);
    return tile ? tile.movementCost : Infinity;
  }

  getNeighbors(x: number, y: number): Tile[] {
    const neighbors: Tile[] = [];
    const offsets = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [dx, dy] of offsets) {
      const tile = this.getTile(x + dx, y + dy);
      if (tile) neighbors.push(tile);
    }
    return neighbors;
  }

  findNearestTile(
    fromX: number,
    fromY: number,
    predicate: (tile: Tile) => boolean,
    maxRange = 50,
  ): { x: number; y: number } | null {
    for (let r = 0; r <= maxRange; r++) {
      for (let dx = -r; dx <= r; dx++) {
        for (let dy = -r; dy <= r; dy++) {
          if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
          const tx = fromX + dx;
          const ty = fromY + dy;
          const tile = this.getTile(tx, ty);
          if (tile && predicate(tile)) {
            return { x: tx, y: ty };
          }
        }
      }
    }
    return null;
  }
}
