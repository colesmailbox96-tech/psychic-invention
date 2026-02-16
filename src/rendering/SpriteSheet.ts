export class SpriteSheet {
  private image: HTMLImageElement | null;
  private loaded: boolean;
  readonly frameWidth: number;
  readonly frameHeight: number;

  constructor(frameWidth: number = 16, frameHeight: number = 16) {
    this.image = null;
    this.loaded = false;
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;
  }

  load(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof Image === 'undefined') {
        this.loaded = false;
        resolve();
        return;
      }
      const img = new Image();
      img.onload = () => {
        this.image = img;
        this.loaded = true;
        resolve();
      };
      img.onerror = () => {
        this.loaded = false;
        reject(new Error(`Failed to load sprite sheet: ${src}`));
      };
      img.src = src;
    });
  }

  getFrame(frameX: number, frameY: number): {
    image: HTMLImageElement | null;
    sx: number;
    sy: number;
    sw: number;
    sh: number;
  } {
    return {
      image: this.image,
      sx: frameX * this.frameWidth,
      sy: frameY * this.frameHeight,
      sw: this.frameWidth,
      sh: this.frameHeight,
    };
  }

  get isLoaded(): boolean {
    return this.loaded;
  }
}
