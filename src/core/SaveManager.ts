import { World, Entity, Component } from './ECS';

interface SerializedComponent {
  type: string;
  data: Record<string, unknown>;
}

interface SerializedEntity {
  id: number;
  components: SerializedComponent[];
}

interface SerializedWorld {
  entities: SerializedEntity[];
}

export class SaveManager {
  static serialize(world: World): string {
    const entities = world.getAllEntities();
    const serialized: SerializedWorld = {
      entities: entities.map((entity) => ({
        id: entity.id,
        components: entity.getComponents().map((comp) => ({
          type: comp.type,
          data: SaveManager.serializeComponent(comp),
        })),
      })),
    };
    return JSON.stringify(serialized);
  }

  static deserialize(data: string, world: World): void {
    const parsed: SerializedWorld = JSON.parse(data);

    // Remove all existing entities
    for (const entity of world.getAllEntities()) {
      world.removeEntity(entity.id);
    }

    // Recreate entities with their components
    for (const serializedEntity of parsed.entities) {
      const entity = world.createEntity();
      for (const serializedComp of serializedEntity.components) {
        const component = SaveManager.deserializeComponent(serializedComp);
        entity.addComponent(component);
      }
    }
  }

  static saveToLocalStorage(key: string, world: World): void {
    const data = SaveManager.serialize(world);
    localStorage.setItem(key, data);
  }

  static loadFromLocalStorage(key: string, world: World): boolean {
    const data = localStorage.getItem(key);
    if (!data) return false;
    SaveManager.deserialize(data, world);
    return true;
  }

  static exportToFile(world: World, filename: string = 'world-save.json'): void {
    const data = SaveManager.serialize(world);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private static serializeComponent(comp: Component): Record<string, unknown> {
    const data: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(comp)) {
      if (key === 'type') continue;
      data[key] = value;
    }
    return data;
  }

  private static deserializeComponent(
    serialized: SerializedComponent
  ): Component {
    const component: Record<string, unknown> = { type: serialized.type };
    for (const [key, value] of Object.entries(serialized.data)) {
      component[key] = value;
    }
    return component as unknown as Component;
  }
}
