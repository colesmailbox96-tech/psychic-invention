export interface PathNode {
  x: number;
  y: number;
}

interface AStarNode {
  x: number;
  y: number;
  g: number;
  h: number;
  f: number;
  parent: AStarNode | null;
  heapIndex: number;
}

const DIRECTIONS: [number, number][] = [
  [0, -1], [1, 0], [0, 1], [-1, 0],
];

function heuristic(x1: number, y1: number, x2: number, y2: number): number {
  return Math.abs(x2 - x1) + Math.abs(y2 - y1);
}

/** Binary min-heap for A* open list, keyed on f-cost. */
class MinHeap {
  private data: AStarNode[] = [];

  get length(): number {
    return this.data.length;
  }

  push(node: AStarNode): void {
    node.heapIndex = this.data.length;
    this.data.push(node);
    this.bubbleUp(this.data.length - 1);
  }

  pop(): AStarNode | undefined {
    if (this.data.length === 0) return undefined;
    const top = this.data[0];
    const last = this.data.pop()!;
    if (this.data.length > 0) {
      this.data[0] = last;
      last.heapIndex = 0;
      this.sinkDown(0);
    }
    return top;
  }

  /** Re-heapify a node whose f-cost decreased. */
  decrease(node: AStarNode): void {
    this.bubbleUp(node.heapIndex);
  }

  private bubbleUp(idx: number): void {
    const node = this.data[idx];
    while (idx > 0) {
      const parentIdx = (idx - 1) >> 1;
      const parent = this.data[parentIdx];
      if (node.f >= parent.f) break;
      this.data[idx] = parent;
      parent.heapIndex = idx;
      idx = parentIdx;
    }
    this.data[idx] = node;
    node.heapIndex = idx;
  }

  private sinkDown(idx: number): void {
    const length = this.data.length;
    const node = this.data[idx];
    while (true) {
      const left = 2 * idx + 1;
      const right = 2 * idx + 2;
      let smallest = idx;

      if (left < length && this.data[left].f < this.data[smallest].f) {
        smallest = left;
      }
      if (right < length && this.data[right].f < this.data[smallest].f) {
        smallest = right;
      }
      if (smallest === idx) break;

      const swap = this.data[smallest];
      this.data[idx] = swap;
      swap.heapIndex = idx;
      this.data[smallest] = node;
      node.heapIndex = smallest;
      idx = smallest;
    }
  }
}

export function findPath(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  isWalkable: (x: number, y: number) => boolean,
  getCost?: (x: number, y: number) => number,
  maxSearch = 1000,
): PathNode[] {
  if (!isWalkable(endX, endY)) return [];

  const costFn = getCost ?? (() => 1);

  const startNode: AStarNode = {
    x: startX, y: startY,
    g: 0,
    h: heuristic(startX, startY, endX, endY),
    f: heuristic(startX, startY, endX, endY),
    parent: null,
    heapIndex: 0,
  };

  const open = new MinHeap();
  open.push(startNode);
  const openMap = new Map<string, AStarNode>();
  const closed = new Set<string>();
  const key = (x: number, y: number) => `${x},${y}`;

  openMap.set(key(startX, startY), startNode);
  let searched = 0;

  while (open.length > 0 && searched < maxSearch) {
    const current = open.pop()!;

    const currentKey = key(current.x, current.y);
    openMap.delete(currentKey);

    if (current.x === endX && current.y === endY) {
      const path: PathNode[] = [];
      let node: AStarNode | null = current;
      while (node) {
        path.push({ x: node.x, y: node.y });
        node = node.parent;
      }
      return path.reverse();
    }

    if (closed.has(currentKey)) continue;
    closed.add(currentKey);
    searched++;

    for (const [dx, dy] of DIRECTIONS) {
      const nx = current.x + dx;
      const ny = current.y + dy;
      const nKey = key(nx, ny);

      if (closed.has(nKey) || !isWalkable(nx, ny)) continue;

      const g = current.g + costFn(nx, ny);
      const h = heuristic(nx, ny, endX, endY);
      const f = g + h;

      const existing = openMap.get(nKey);
      if (existing) {
        if (g < existing.g) {
          existing.g = g;
          existing.f = f;
          existing.parent = current;
          open.decrease(existing);
        }
      } else {
        const node: AStarNode = { x: nx, y: ny, g, h, f, parent: current, heapIndex: 0 };
        open.push(node);
        openMap.set(nKey, node);
      }
    }
  }

  return [];
}
