export type EntityId = number;
export type ComponentType = string;

export interface Component {
  type: ComponentType;
}

export class Entity {
  readonly id: EntityId;
  private components: Map<ComponentType, Component> = new Map();

  constructor(id: EntityId) {
    this.id = id;
  }

  addComponent<T extends Component>(component: T): void {
    this.components.set(component.type, component);
  }

  getComponent<T extends Component>(type: ComponentType): T | undefined {
    return this.components.get(type) as T | undefined;
  }

  hasComponent(type: ComponentType): boolean {
    return this.components.has(type);
  }

  removeComponent(type: ComponentType): void {
    this.components.delete(type);
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

  createEntity(): Entity {
    const entity = new Entity(this.nextId++);
    this.entities.set(entity.id, entity);
    return entity;
  }

  removeEntity(id: EntityId): void {
    this.entities.delete(id);
  }

  getEntity(id: EntityId): Entity | undefined {
    return this.entities.get(id);
  }

  getEntitiesWithComponents(...types: ComponentType[]): Entity[] {
    const result: Entity[] = [];
    for (const entity of this.entities.values()) {
      if (types.every((type) => entity.hasComponent(type))) {
        result.push(entity);
      }
    }
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
