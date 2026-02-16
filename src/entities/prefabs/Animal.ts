import { World, Entity } from '../../core/ECS';
import { PositionComponent } from '../components/Position';
import { RenderableComponent } from '../components/Renderable';
import { PhysicsBodyComponent } from '../components/PhysicsBody';
import { NeedsComponent } from '../components/Needs';

const ANIMAL_TINTS: Record<string, string> = {
  deer: '#c4a060',
  rabbit: '#b0a090',
  wolf: '#707070',
  bird: '#50a0d0',
  fish: '#60b0c0',
};

export function createAnimal(world: World, x: number, y: number, type?: string): Entity {
  const entity = world.createEntity();
  const animalType = type ?? 'deer';

  entity.addComponent(new PositionComponent(x, y));

  const renderable = new RenderableComponent('animal');
  renderable.tint = ANIMAL_TINTS[animalType] ?? '#c4a060';
  renderable.zIndex = 5;
  entity.addComponent(renderable);

  const speed = animalType === 'rabbit' ? 2.0 : animalType === 'wolf' ? 1.8 : 1.2;
  entity.addComponent(new PhysicsBodyComponent(speed, true));

  const needs = new NeedsComponent();
  needs.warmth = 1.0;
  needs.safety = 1.0;
  needs.social = 1.0;
  entity.addComponent(needs);

  return entity;
}
