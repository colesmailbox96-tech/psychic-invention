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
}

const DIRECTIONS: [number, number][] = [
  [0, -1], [1, 0], [0, 1], [-1, 0],
];

function heuristic(x1: number, y1: number, x2: number, y2: number): number {
  return Math.abs(x2 - x1) + Math.abs(y2 - y1);
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
  };

  const open: AStarNode[] = [startNode];
  const openMap = new Map<string, AStarNode>();
  const closed = new Set<string>();
  const key = (x: number, y: number) => `${x},${y}`;

  openMap.set(key(startX, startY), startNode);
  let searched = 0;

  while (open.length > 0 && searched < maxSearch) {
    // Find node with lowest f
    let lowestIdx = 0;
    for (let i = 1; i < open.length; i++) {
      if (open[i].f < open[lowestIdx].f) {
        lowestIdx = i;
      }
    }

    const current = open[lowestIdx];
    open.splice(lowestIdx, 1);

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
        }
      } else {
        const node: AStarNode = { x: nx, y: ny, g, h, f, parent: current };
        open.push(node);
        openMap.set(nKey, node);
      }
    }
  }

  return [];
}
