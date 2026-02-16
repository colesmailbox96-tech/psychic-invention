import { World, Entity } from '../../core/ECS';
import { PositionComponent } from '../components/Position';
import { RenderableComponent } from '../components/Renderable';
import { PhysicsBodyComponent } from '../components/PhysicsBody';
import { InventoryComponent } from '../components/Inventory';
import { NeedsComponent } from '../components/Needs';
import { EmotionsComponent } from '../components/Emotions';
import { MemoryComponent } from '../components/Memory';
import { RelationshipsComponent } from '../components/Relationships';
import { SkillsComponent } from '../components/Skills';
import { GeneticsComponent } from '../components/Genetics';
import { BrainComponent } from '../components/Brain';

const VILLAGER_TINTS = [
  '#e06060', '#60a0e0', '#60e080', '#e0c040', '#c060e0',
  '#e09040', '#40c0c0', '#e06090', '#80b040', '#a070d0',
];

export function createVillager(world: World, x: number, y: number, generation?: number): Entity {
  const entity = world.createEntity();

  entity.addComponent(new PositionComponent(x, y));

  const renderable = new RenderableComponent('villager');
  renderable.tint = VILLAGER_TINTS[Math.floor(Math.random() * VILLAGER_TINTS.length)];
  renderable.zIndex = 10;
  entity.addComponent(renderable);

  entity.addComponent(new PhysicsBodyComponent(1.5, true));
  entity.addComponent(new InventoryComponent(10));
  entity.addComponent(new NeedsComponent());
  entity.addComponent(new EmotionsComponent());
  entity.addComponent(new MemoryComponent());
  entity.addComponent(new RelationshipsComponent());
  entity.addComponent(new SkillsComponent());
  entity.addComponent(new GeneticsComponent(generation ?? 0));
  entity.addComponent(new BrainComponent());

  return entity;
}
