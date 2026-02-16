import { Component } from '../../core/ECS';

export class PhysicsBodyComponent implements Component {
  type = 'physics';
  velocityX: number;
  velocityY: number;
  speed: number;
  solid: boolean;
  width: number;
  height: number;

  constructor(speed = 1.5, solid = true) {
    this.velocityX = 0;
    this.velocityY = 0;
    this.speed = speed;
    this.solid = solid;
    this.width = 1;
    this.height = 1;
  }
}
