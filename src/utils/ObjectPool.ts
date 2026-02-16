export class ObjectPool<T> {
  private pool: T[] = [];
  private active = 0;
  private readonly factory: () => T;
  private readonly resetFn: (obj: T) => void;

  constructor(factory: () => T, reset: (obj: T) => void, initialSize = 0) {
    this.factory = factory;
    this.resetFn = reset;

    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.factory());
    }
  }

  acquire(): T {
    this.active++;
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.factory();
  }

  release(obj: T): void {
    if (this.active <= 0) return;
    this.resetFn(obj);
    this.active--;
    this.pool.push(obj);
  }

  get activeCount(): number {
    return this.active;
  }

  get poolSize(): number {
    return this.pool.length;
  }
}
