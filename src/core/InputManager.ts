export interface InputState {
  mouseX: number;
  mouseY: number;
  mouseWorldX: number;
  mouseWorldY: number;
  isMouseDown: boolean;
  isDragging: boolean;
  dragStartX: number;
  dragStartY: number;
  keys: Set<string>;
}

const DRAG_THRESHOLD = 5;

export class InputManager {
  private state: InputState = {
    mouseX: 0,
    mouseY: 0,
    mouseWorldX: 0,
    mouseWorldY: 0,
    isMouseDown: false,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    keys: new Set(),
  };

  private canvas: HTMLCanvasElement | null = null;

  // Bound handlers for cleanup
  private handleMouseDown = this._onMouseDown.bind(this);
  private handleMouseMove = this._onMouseMove.bind(this);
  private handleMouseUp = this._onMouseUp.bind(this);
  private handleWheel = this._onWheel.bind(this);
  private handleKeyDown = this._onKeyDown.bind(this);
  private handleKeyUp = this._onKeyUp.bind(this);
  private handleTouchStart = this._onTouchStart.bind(this);
  private handleTouchMove = this._onTouchMove.bind(this);
  private handleTouchEnd = this._onTouchEnd.bind(this);
  private handleContextMenu = (e: Event) => e.preventDefault();

  private lastTouchDist: number = 0;
  private lastTouchX: number = 0;
  private lastTouchY: number = 0;

  onTileClick: ((tileX: number, tileY: number) => void) | null = null;
  onPan: ((dx: number, dy: number) => void) | null = null;
  onZoom: ((delta: number, x: number, y: number) => void) | null = null;

  init(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;

    canvas.addEventListener('mousedown', this.handleMouseDown);
    canvas.addEventListener('mousemove', this.handleMouseMove);
    canvas.addEventListener('mouseup', this.handleMouseUp);
    canvas.addEventListener('wheel', this.handleWheel, { passive: false });
    canvas.addEventListener('contextmenu', this.handleContextMenu);

    canvas.addEventListener('touchstart', this.handleTouchStart, {
      passive: false,
    });
    canvas.addEventListener('touchmove', this.handleTouchMove, {
      passive: false,
    });
    canvas.addEventListener('touchend', this.handleTouchEnd);

    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  getState(): Readonly<InputState> {
    return this.state;
  }

  isKeyDown(key: string): boolean {
    return this.state.keys.has(key);
  }

  destroy(): void {
    if (this.canvas) {
      this.canvas.removeEventListener('mousedown', this.handleMouseDown);
      this.canvas.removeEventListener('mousemove', this.handleMouseMove);
      this.canvas.removeEventListener('mouseup', this.handleMouseUp);
      this.canvas.removeEventListener('wheel', this.handleWheel);
      this.canvas.removeEventListener('contextmenu', this.handleContextMenu);
      this.canvas.removeEventListener('touchstart', this.handleTouchStart);
      this.canvas.removeEventListener('touchmove', this.handleTouchMove);
      this.canvas.removeEventListener('touchend', this.handleTouchEnd);
    }

    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);

    this.canvas = null;
  }

  private _onMouseDown(e: MouseEvent): void {
    this.state.isMouseDown = true;
    this.state.isDragging = false;
    this.state.dragStartX = e.clientX;
    this.state.dragStartY = e.clientY;
    this.updateMousePosition(e);
  }

  private _onMouseMove(e: MouseEvent): void {
    this.updateMousePosition(e);

    if (this.state.isMouseDown) {
      const dx = e.clientX - this.state.dragStartX;
      const dy = e.clientY - this.state.dragStartY;

      if (
        !this.state.isDragging &&
        Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD
      ) {
        this.state.isDragging = true;
      }

      if (this.state.isDragging && this.onPan) {
        this.onPan(e.movementX, e.movementY);
      }
    }
  }

  private _onMouseUp(e: MouseEvent): void {
    if (!this.state.isDragging && this.onTileClick) {
      this.onTileClick(this.state.mouseWorldX, this.state.mouseWorldY);
    }

    this.state.isMouseDown = false;
    this.state.isDragging = false;
    this.updateMousePosition(e);
  }

  private _onWheel(e: WheelEvent): void {
    e.preventDefault();
    if (this.onZoom) {
      const delta = e.deltaY > 0 ? -1 : 1;
      this.onZoom(delta, e.clientX, e.clientY);
    }
  }

  private _onKeyDown(e: KeyboardEvent): void {
    this.state.keys.add(e.key);
    this.handleKeyboardPan();
  }

  private _onKeyUp(e: KeyboardEvent): void {
    this.state.keys.delete(e.key);
  }

  private _onTouchStart(e: TouchEvent): void {
    e.preventDefault();

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      this.state.isMouseDown = true;
      this.state.isDragging = false;
      this.state.dragStartX = touch.clientX;
      this.state.dragStartY = touch.clientY;
      this.lastTouchX = touch.clientX;
      this.lastTouchY = touch.clientY;
      this.updateTouchPosition(touch);
    } else if (e.touches.length === 2) {
      this.state.isDragging = true;
      this.lastTouchDist = this.getTouchDistance(e.touches);
      const mid = this.getTouchMidpoint(e.touches);
      this.lastTouchX = mid.x;
      this.lastTouchY = mid.y;
    }
  }

  private _onTouchMove(e: TouchEvent): void {
    e.preventDefault();

    if (e.touches.length === 1 && this.state.isMouseDown) {
      const touch = e.touches[0];
      const dx = touch.clientX - this.state.dragStartX;
      const dy = touch.clientY - this.state.dragStartY;

      if (
        !this.state.isDragging &&
        Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD
      ) {
        this.state.isDragging = true;
      }

      if (this.state.isDragging && this.onPan) {
        this.onPan(
          touch.clientX - this.lastTouchX,
          touch.clientY - this.lastTouchY
        );
      }

      this.lastTouchX = touch.clientX;
      this.lastTouchY = touch.clientY;
      this.updateTouchPosition(touch);
    } else if (e.touches.length === 2) {
      // Pinch to zoom
      const dist = this.getTouchDistance(e.touches);
      const mid = this.getTouchMidpoint(e.touches);

      if (this.lastTouchDist > 0 && this.onZoom) {
        const delta = dist > this.lastTouchDist ? 1 : -1;
        this.onZoom(delta, mid.x, mid.y);
      }

      // Two-finger pan
      if (this.onPan) {
        this.onPan(mid.x - this.lastTouchX, mid.y - this.lastTouchY);
      }

      this.lastTouchDist = dist;
      this.lastTouchX = mid.x;
      this.lastTouchY = mid.y;
    }
  }

  private _onTouchEnd(e: TouchEvent): void {
    if (e.touches.length === 0) {
      if (!this.state.isDragging && this.onTileClick) {
        this.onTileClick(this.state.mouseWorldX, this.state.mouseWorldY);
      }
      this.state.isMouseDown = false;
      this.state.isDragging = false;
      this.lastTouchDist = 0;
    }
  }

  private updateMousePosition(e: MouseEvent): void {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    this.state.mouseX = e.clientX - rect.left;
    this.state.mouseY = e.clientY - rect.top;
    // World coordinates default to screen coords; camera/viewport system should transform these
    this.state.mouseWorldX = this.state.mouseX;
    this.state.mouseWorldY = this.state.mouseY;
  }

  private updateTouchPosition(touch: Touch): void {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    this.state.mouseX = touch.clientX - rect.left;
    this.state.mouseY = touch.clientY - rect.top;
    // World coordinates default to screen coords; camera/viewport system should transform these
    this.state.mouseWorldX = this.state.mouseX;
    this.state.mouseWorldY = this.state.mouseY;
  }

  private getTouchDistance(touches: TouchList): number {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private getTouchMidpoint(touches: TouchList): { x: number; y: number } {
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    };
  }

  private handleKeyboardPan(): void {
    if (!this.onPan) return;

    const panSpeed = 10;
    let dx = 0;
    let dy = 0;

    if (this.state.keys.has('ArrowLeft') || this.state.keys.has('a')) dx += panSpeed;
    if (this.state.keys.has('ArrowRight') || this.state.keys.has('d')) dx -= panSpeed;
    if (this.state.keys.has('ArrowUp') || this.state.keys.has('w')) dy += panSpeed;
    if (this.state.keys.has('ArrowDown') || this.state.keys.has('s')) dy -= panSpeed;

    if (dx !== 0 || dy !== 0) {
      this.onPan(dx, dy);
    }
  }
}
