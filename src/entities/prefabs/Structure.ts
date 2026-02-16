import { World, Entity } from '../../core/ECS';
import { PositionComponent } from '../components/Position';
import { RenderableComponent } from '../components/Renderable';
import { PhysicsBodyComponent } from '../components/PhysicsBody';

const STRUCTURE_TINTS: Record<string, string> = {
  shelter: '#a08050',
  stone_house: '#808080',
  brick_house: '#b06040',
  wall: '#909090',
  campfire: '#e08020',
};

export function createStructure(world: World, x: number, y: number, type?: string): Entity {
  const entity = world.createEntity();
  const structureType = type ?? 'shelter';

  entity.addComponent(new PositionComponent(x, y));

  const renderable = new RenderableComponent('structure');
  renderable.tint = STRUCTURE_TINTS[structureType] ?? '#a08050';
  renderable.zIndex = 3;
  entity.addComponent(renderable);

  const physics = new PhysicsBodyComponent(0, true);
  physics.solid = true;
  entity.addComponent(physics);

  return entity;
}
