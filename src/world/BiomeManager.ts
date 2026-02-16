import { BiomeType } from './TileMap';

export interface BiomeDefinition {
  type: BiomeType;
  name: string;
  baseMovementCost: number;
  resources: string[];
  resourceDensity: number;
  dangerLevel: number;
  temperatureRange: [number, number];
}

const BIOME_DEFINITIONS: BiomeDefinition[] = [
  {
    type: BiomeType.MEADOW,
    name: 'Meadow',
    baseMovementCost: 1.0,
    resources: ['berries', 'herbs', 'flowers'],
    resourceDensity: 0.3,
    dangerLevel: 0.1,
    temperatureRange: [0.3, 0.7],
  },
  {
    type: BiomeType.FOREST,
    name: 'Forest',
    baseMovementCost: 1.4,
    resources: ['wood', 'berries', 'mushrooms', 'herbs'],
    resourceDensity: 0.6,
    dangerLevel: 0.3,
    temperatureRange: [0.2, 0.7],
  },
  {
    type: BiomeType.MOUNTAIN,
    name: 'Mountain',
    baseMovementCost: 2.0,
    resources: ['stone', 'ore', 'gems'],
    resourceDensity: 0.4,
    dangerLevel: 0.5,
    temperatureRange: [0.0, 0.4],
  },
  {
    type: BiomeType.WETLAND,
    name: 'Wetland',
    baseMovementCost: 1.6,
    resources: ['reeds', 'fish', 'clay'],
    resourceDensity: 0.5,
    dangerLevel: 0.2,
    temperatureRange: [0.3, 0.8],
  },
  {
    type: BiomeType.DESERT,
    name: 'Desert',
    baseMovementCost: 1.5,
    resources: ['cactus', 'sand', 'flint'],
    resourceDensity: 0.1,
    dangerLevel: 0.4,
    temperatureRange: [0.6, 1.0],
  },
  {
    type: BiomeType.TUNDRA,
    name: 'Tundra',
    baseMovementCost: 1.3,
    resources: ['ice', 'moss', 'fur'],
    resourceDensity: 0.15,
    dangerLevel: 0.3,
    temperatureRange: [0.0, 0.25],
  },
  {
    type: BiomeType.COAST,
    name: 'Coast',
    baseMovementCost: 1.2,
    resources: ['fish', 'shells', 'driftwood'],
    resourceDensity: 0.35,
    dangerLevel: 0.15,
    temperatureRange: [0.2, 0.8],
  },
];

export class BiomeManager {
  private biomes: Map<BiomeType, BiomeDefinition>;

  constructor() {
    this.biomes = new Map();
    for (const def of BIOME_DEFINITIONS) {
      this.biomes.set(def.type, def);
    }
  }

  getBiome(type: BiomeType): BiomeDefinition {
    return this.biomes.get(type)!;
  }

  determineBiome(
    elevation: number,
    moisture: number,
    temperature: number,
  ): BiomeType {
    // Whittaker-diagram style logic
    if (elevation > 0.75) {
      return temperature < 0.25 ? BiomeType.TUNDRA : BiomeType.MOUNTAIN;
    }
    if (elevation < 0.2 && moisture > 0.6) {
      return elevation < 0.1 ? BiomeType.COAST : BiomeType.WETLAND;
    }
    if (moisture > 0.7 && temperature > 0.3) {
      return BiomeType.FOREST;
    }
    if (moisture < 0.3 && temperature > 0.6) {
      return BiomeType.DESERT;
    }
    if (temperature < 0.25) {
      return BiomeType.TUNDRA;
    }
    if (moisture > 0.5) {
      return BiomeType.WETLAND;
    }
    return BiomeType.MEADOW;
  }

  getResourcesForBiome(biome: BiomeType): string[] {
    const def = this.biomes.get(biome);
    return def ? def.resources : [];
  }
}
