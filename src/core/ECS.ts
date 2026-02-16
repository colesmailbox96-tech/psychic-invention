export type EntityId = number;
export type ComponentType = string;

export interface Component {
  type: ComponentType;
}

type ComponentChangeListener = (entityId: EntityId, componentType: ComponentType) => void;

export class Entity {
  readonly id: EntityId;
  private components: Map<ComponentType, Component> = new Map();
  /** @internal Used by World to track component changes for query caching. */
  _onComponentChange: ComponentChangeListener | null = null;

  constructor(id: EntityId) {
    this.id = id;
  }

  addComponent<T extends Component>(component: T): void {
    this.components.set(component.type, component);
    this._onComponentChange?.(this.id, component.type);
  }

  getComponent<T extends Component>(type: ComponentType): T | undefined {
    return this.components.get(type) as T | undefined;
  }

  hasComponent(type: ComponentType): boolean {
    return this.components.has(type);
  }

  removeComponent(type: ComponentType): void {
    this.components.delete(type);
    this._onComponentChange?.(this.id, type);
  }

  getComponents(): Component[] {
    return Array.from(this.components.values());
  }
}

export abstract class System {
  abstract readonly requiredComponents: ComponentType[];
  abstract update(entities: Entity[], deltaTime: number): void;
}

export class World {
  private entities: Map<EntityId, Entity> = new Map();
  private systems: System[] = [];
  private nextId: number = 1;
  // Component index: maps component type → set of entity IDs that have it
  private componentIndex: Map<ComponentType, Set<EntityId>> = new Map();
  // Cache for multi-component queries: "type1,type2,..." → entity list
  private queryCache: Map<string, Entity[]> = new Map();

  createEntity(): Entity {
    const entity = new Entity(this.nextId++);
    entity._onComponentChange = () => this.invalidateQueryCache();
    this.entities.set(entity.id, entity);
    return entity;
  }

  removeEntity(id: EntityId): void {
    const entity = this.entities.get(id);
    if (entity) {
      // Remove from component index
      for (const comp of entity.getComponents()) {
        this.componentIndex.get(comp.type)?.delete(id);
      }
      entity._onComponentChange = null;
      this.entities.delete(id);
      this.invalidateQueryCache();
    }
  }

  getEntity(id: EntityId): Entity | undefined {
    return this.entities.get(id);
  }

  private invalidateQueryCache(): void {
    if (this.queryCache.size > 0) {
      this.queryCache.clear();
    }
  }

  getEntitiesWithComponents(...types: ComponentType[]): Entity[] {
    const cacheKey = types.join(',');
    const cached = this.queryCache.get(cacheKey);
    if (cached) return cached;

    const result: Entity[] = [];
    for (const entity of this.entities.values()) {
      if (types.every((type) => entity.hasComponent(type))) {
        result.push(entity);
      }
    }
    this.queryCache.set(cacheKey, result);
    return result;
  }

  getAllEntities(): Entity[] {
    return Array.from(this.entities.values());
  }

  addSystem(system: System): void {
    this.systems.push(system);
  }

  update(deltaTime: number): void {
    for (const system of this.systems) {
      const entities = this.getEntitiesWithComponents(
        ...system.requiredComponents
      );
      system.update(entities, deltaTime);
    }
  }

  get entityCount(): number {
    return this.entities.size;
  }
}
