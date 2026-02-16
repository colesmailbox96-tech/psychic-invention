import { Component } from '../../core/ECS';

export class PositionComponent implements Component {
  type = 'position';
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  tileX: number;
  tileY: number;
  direction: 'up' | 'down' | 'left' | 'right';

  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
    this.prevX = x;
    this.prevY = y;
    this.tileX = Math.floor(x);
    this.tileY = Math.floor(y);
    this.direction = 'down';
  }

  updateTile(): void {
    this.tileX = Math.floor(this.x);
    this.tileY = Math.floor(this.y);
  }
}
