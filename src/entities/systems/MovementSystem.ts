import { System, Entity, ComponentType } from '../../core/ECS';
import { PositionComponent } from '../components/Position';
import { PhysicsBodyComponent } from '../components/PhysicsBody';
import { TileMap } from '../../world/TileMap';
import { findPath, PathNode } from '../../utils/Pathfinding';

export class MovementSystem extends System {
  readonly requiredComponents: ComponentType[] = ['position', 'physics'];
  private tileMap: TileMap;
  private paths: Map<number, PathNode[]> = new Map();

  constructor(tileMap: TileMap) {
    super();
    this.tileMap = tileMap;
  }

  setTarget(entityId: number, targetX: number, targetY: number): void {
    const path = findPath(
      Math.floor(targetX), Math.floor(targetY),
      Math.floor(targetX), Math.floor(targetY),
      (x, y) => this.tileMap.isWalkable(x, y),
      (x, y) => this.tileMap.getMovementCost(x, y),
    );
    this.paths.set(entityId, path);
  }

  setPath(entityId: number, path: PathNode[]): void {
    this.paths.set(entityId, path);
  }

  update(entities: Entity[], deltaTime: number): void {
    for (const entity of entities) {
      const pos = entity.getComponent<PositionComponent>('position')!;
      const physics = entity.getComponent<PhysicsBodyComponent>('physics')!;

      pos.prevX = pos.x;
      pos.prevY = pos.y;

      const path = this.paths.get(entity.id);
      if (!path || path.length === 0) {
        physics.velocityX = 0;
        physics.velocityY = 0;
        continue;
      }

      const target = path[0];
      const dx = target.x - pos.x;
      const dy = target.y - pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 0.1) {
        pos.x = target.x;
        pos.y = target.y;
        path.shift();
        if (path.length === 0) {
          this.paths.delete(entity.id);
        }
        physics.velocityX = 0;
        physics.velocityY = 0;
      } else {
        const moveCost = this.tileMap.getMovementCost(Math.floor(target.x), Math.floor(target.y));
        const effectiveSpeed = physics.speed / moveCost;
        const step = Math.min(effectiveSpeed * deltaTime, dist);
        const nx = dx / dist;
        const ny = dy / dist;

        const newX = pos.x + nx * step;
        const newY = pos.y + ny * step;

        if (this.tileMap.isWalkable(Math.floor(newX), Math.floor(newY))) {
          pos.x = newX;
          pos.y = newY;
          physics.velocityX = nx * effectiveSpeed;
          physics.velocityY = ny * effectiveSpeed;

          if (Math.abs(nx) > Math.abs(ny)) {
            pos.direction = nx > 0 ? 'right' : 'left';
          } else {
            pos.direction = ny > 0 ? 'down' : 'up';
          }
        } else {
          path.length = 0;
          this.paths.delete(entity.id);
          physics.velocityX = 0;
          physics.velocityY = 0;
        }
      }

      pos.updateTile();
    }
  }
}
