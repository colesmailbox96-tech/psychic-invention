import { World, Entity } from '../../core/ECS';
import { PositionComponent } from '../components/Position';
import { RenderableComponent } from '../components/Renderable';

const PLANT_TINTS: Record<string, string> = {
  berries: '#c04080',
  mushroom: '#a08060',
  tree: '#408040',
  herbs: '#60b060',
  flowers: '#d070a0',
  cactus: '#40a040',
};

export function createPlant(world: World, x: number, y: number, type?: string): Entity {
  const entity = world.createEntity();
  const plantType = type ?? 'tree';

  entity.addComponent(new PositionComponent(x, y));

  const renderable = new RenderableComponent('plant');
  renderable.tint = PLANT_TINTS[plantType] ?? '#408040';
  renderable.zIndex = 2;
  entity.addComponent(renderable);

  return entity;
}
