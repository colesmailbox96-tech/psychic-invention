import { Component } from '../../core/ECS';

export class RenderableComponent implements Component {
  type = 'renderable';
  spriteSheet: string;
  frameX: number;
  frameY: number;
  frameWidth: number;
  frameHeight: number;
  animationFrame: number;
  animationSpeed: number;
  visible: boolean;
  zIndex: number;
  tint: string | null;

  constructor(spriteSheet = 'default', frameWidth = 16, frameHeight = 16) {
    this.spriteSheet = spriteSheet;
    this.frameX = 0;
    this.frameY = 0;
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;
    this.animationFrame = 0;
    this.animationSpeed = 8;
    this.visible = true;
    this.zIndex = 0;
    this.tint = null;
  }
}
