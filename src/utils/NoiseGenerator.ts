// 2D Simplex noise implementation

const F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;

const GRAD3: [number, number][] = [
  [1, 1], [-1, 1], [1, -1], [-1, -1],
  [1, 0], [-1, 0], [0, 1], [0, -1],
];

export class NoiseGenerator {
  private perm: Uint8Array;

  constructor(seed: number) {
    this.perm = new Uint8Array(512);
    const p = new Uint8Array(256);

    for (let i = 0; i < 256; i++) {
      p[i] = i;
    }

    // Seed-based shuffle
    let s = seed | 0;
    for (let i = 255; i > 0; i--) {
      s = (s * 1664525 + 1013904223) | 0;
      const j = ((s >>> 0) % (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }

    for (let i = 0; i < 512; i++) {
      this.perm[i] = p[i & 255];
    }
  }

  noise2D(x: number, y: number): number {
    const s = (x + y) * F2;
    const i = Math.floor(x + s);
    const j = Math.floor(y + s);

    const t = (i + j) * G2;
    const X0 = i - t;
    const Y0 = j - t;
    const x0 = x - X0;
    const y0 = y - Y0;

    let i1: number, j1: number;
    if (x0 > y0) {
      i1 = 1; j1 = 0;
    } else {
      i1 = 0; j1 = 1;
    }

    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1.0 + 2.0 * G2;
    const y2 = y0 - 1.0 + 2.0 * G2;

    const ii = i & 255;
    const jj = j & 255;

    let n0 = 0, n1 = 0, n2 = 0;

    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 >= 0) {
      const gi0 = this.perm[ii + this.perm[jj]] % 8;
      t0 *= t0;
      n0 = t0 * t0 * (GRAD3[gi0][0] * x0 + GRAD3[gi0][1] * y0);
    }

    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 >= 0) {
      const gi1 = this.perm[ii + i1 + this.perm[jj + j1]] % 8;
      t1 *= t1;
      n1 = t1 * t1 * (GRAD3[gi1][0] * x1 + GRAD3[gi1][1] * y1);
    }

    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 >= 0) {
      const gi2 = this.perm[ii + 1 + this.perm[jj + 1]] % 8;
      t2 *= t2;
      n2 = t2 * t2 * (GRAD3[gi2][0] * x2 + GRAD3[gi2][1] * y2);
    }

    return 70.0 * (n0 + n1 + n2);
  }

  octaveNoise(
    x: number,
    y: number,
    octaves: number,
    persistence: number,
    lacunarity: number,
  ): number {
    let total = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      total += this.noise2D(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    return total / maxValue;
  }

  noiseMap(
    width: number,
    height: number,
    scale: number,
    octaves: number,
    persistence: number,
    lacunarity: number,
    offsetX: number,
    offsetY: number,
  ): Float32Array {
    const map = new Float32Array(width * height);
    const effectiveScale = Math.max(scale, 0.0001);

    let minVal = Infinity;
    let maxVal = -Infinity;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const nx = (x + offsetX) / effectiveScale;
        const ny = (y + offsetY) / effectiveScale;
        const value = this.octaveNoise(nx, ny, octaves, persistence, lacunarity);
        map[y * width + x] = value;
        if (value < minVal) minVal = value;
        if (value > maxVal) maxVal = value;
      }
    }

    // Normalize to 0-1
    const range = maxVal - minVal;
    if (range > 0) {
      for (let i = 0; i < map.length; i++) {
        map[i] = (map[i] - minVal) / range;
      }
    }

    return map;
  }
}
