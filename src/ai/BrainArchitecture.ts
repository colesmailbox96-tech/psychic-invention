// Pure TypeScript neural network (feed-forward + GRU) — no TensorFlow dependency

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x))));
}

function tanhActivation(x: number): number {
  const clamped = Math.max(-500, Math.min(500, x));
  const e2x = Math.exp(2 * clamped);
  return (e2x - 1) / (e2x + 1);
}

function relu(x: number): number {
  return x > 0 ? x : 0;
}

function softmax(values: number[]): number[] {
  const max = Math.max(...values);
  const exps = values.map(v => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => e / sum);
}

function gaussianRandom(): number {
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2.0 * Math.log(u1 || 1e-10)) * Math.cos(2.0 * Math.PI * u2);
}

// Matrix-vector multiply: W is (rows x cols) stored row-major, x is (cols)
// Writes result into pre-allocated `out` array to avoid allocation.
function matVecMul(W: Float32Array, x: Float32Array | number[], rows: number, cols: number, out: Float32Array): void {
  for (let i = 0; i < rows; i++) {
    let sum = 0;
    const offset = i * cols;
    for (let j = 0; j < cols; j++) {
      sum += W[offset + j] * (x as number[])[j];
    }
    out[i] = sum;
  }
}

function addVecInPlace(a: Float32Array, b: Float32Array): void {
  for (let i = 0; i < a.length; i++) {
    a[i] += b[i];
  }
}

export class NeuralNetwork {
  private inputSize: number;
  private hiddenSize: number;
  private outputSize: number;

  // GRU parameters — weights for [h, x] concatenated input (hiddenSize + inputSize)
  private Wz: Float32Array; // update gate: hiddenSize × (hiddenSize + inputSize)
  private Wr: Float32Array; // reset gate
  private Wh: Float32Array; // candidate hidden
  private bz: Float32Array;
  private br: Float32Array;
  private bh: Float32Array;

  // Dense layers
  private W1: Float32Array; // hiddenSize × hiddenSize
  private b1: Float32Array;
  private W2: Float32Array; // hiddenSize × hiddenSize
  private b2: Float32Array;

  // Actor head
  private Wactor: Float32Array; // outputSize × hiddenSize
  private bactor: Float32Array;

  // Critic head
  private Wcritic: Float32Array; // 1 × hiddenSize
  private bcritic: Float32Array;

  // Pre-allocated scratch buffers for forward() to avoid per-call allocations
  private _hx: Float32Array;
  private _rhx: Float32Array;
  private _scratch: Float32Array; // reusable hidden-sized buffer
  private _scratch2: Float32Array;
  private _criticScratch: Float32Array;

  constructor(inputSize: number, hiddenSize: number, outputSize: number) {
    this.inputSize = inputSize;
    this.hiddenSize = hiddenSize;
    this.outputSize = outputSize;

    const concatSize = hiddenSize + inputSize;

    // GRU weights
    this.Wz = this.initWeights(hiddenSize * concatSize, concatSize);
    this.Wr = this.initWeights(hiddenSize * concatSize, concatSize);
    this.Wh = this.initWeights(hiddenSize * concatSize, concatSize);
    this.bz = new Float32Array(hiddenSize);
    this.br = new Float32Array(hiddenSize);
    this.bh = new Float32Array(hiddenSize);

    // Dense layers
    this.W1 = this.initWeights(hiddenSize * hiddenSize, hiddenSize);
    this.b1 = new Float32Array(hiddenSize);
    this.W2 = this.initWeights(hiddenSize * hiddenSize, hiddenSize);
    this.b2 = new Float32Array(hiddenSize);

    // Actor head
    this.Wactor = this.initWeights(outputSize * hiddenSize, hiddenSize);
    this.bactor = new Float32Array(outputSize);

    // Critic head
    this.Wcritic = this.initWeights(1 * hiddenSize, hiddenSize);
    this.bcritic = new Float32Array(1);

    // Pre-allocate scratch buffers
    this._hx = new Float32Array(concatSize);
    this._rhx = new Float32Array(concatSize);
    this._scratch = new Float32Array(hiddenSize);
    this._scratch2 = new Float32Array(hiddenSize);
    this._criticScratch = new Float32Array(1);
  }

  private initWeights(size: number, fanIn: number): Float32Array {
    // Xavier initialization
    const std = Math.sqrt(2.0 / fanIn);
    const weights = new Float32Array(size);
    for (let i = 0; i < size; i++) {
      weights[i] = gaussianRandom() * std;
    }
    return weights;
  }

  forward(input: number[], hiddenState: Float32Array): {
    actionProbs: number[];
    value: number;
    newHiddenState: Float32Array;
  } {
    const h = hiddenState;
    const x = input;
    const hs = this.hiddenSize;
    const concatSize = hs + this.inputSize;

    // Concatenate [h, x] into pre-allocated buffer
    const hx = this._hx;
    hx.set(h, 0);
    for (let i = 0; i < this.inputSize; i++) {
      hx[hs + i] = x[i] ?? 0;
    }

    // GRU cell — reuse _scratch for intermediate results
    // z = sigmoid(Wz * [h, x] + bz)
    const z = this._scratch;
    matVecMul(this.Wz, hx, hs, concatSize, z);
    addVecInPlace(z, this.bz);
    for (let i = 0; i < hs; i++) z[i] = sigmoid(z[i]);

    // r = sigmoid(Wr * [h, x] + br)
    const r = this._scratch2;
    matVecMul(this.Wr, hx, hs, concatSize, r);
    addVecInPlace(r, this.br);
    for (let i = 0; i < hs; i++) r[i] = sigmoid(r[i]);

    // h_hat = tanh(Wh * [r*h, x] + bh)
    const rhx = this._rhx;
    for (let i = 0; i < hs; i++) rhx[i] = r[i] * h[i];
    for (let i = 0; i < this.inputSize; i++) rhx[hs + i] = x[i] ?? 0;
    // Reuse _scratch2 for hHat (r is no longer needed after rhx is built)
    const hHat = this._scratch2;
    matVecMul(this.Wh, rhx, hs, concatSize, hHat);
    addVecInPlace(hHat, this.bh);
    for (let i = 0; i < hs; i++) hHat[i] = tanhActivation(hHat[i]);

    // h_new = (1 - z) * h + z * h_hat — must allocate since it's returned
    const hNew = new Float32Array(hs);
    for (let i = 0; i < hs; i++) hNew[i] = (1 - z[i]) * h[i] + z[i] * hHat[i];

    // Dense layer 1 with ReLU — reuse _scratch
    const d1 = this._scratch;
    matVecMul(this.W1, hNew, hs, hs, d1);
    addVecInPlace(d1, this.b1);
    for (let i = 0; i < hs; i++) d1[i] = relu(d1[i]);

    // Dense layer 2 with ReLU — reuse _scratch2
    const d2 = this._scratch2;
    matVecMul(this.W2, d1, hs, hs, d2);
    addVecInPlace(d2, this.b2);
    for (let i = 0; i < hs; i++) d2[i] = relu(d2[i]);

    // Actor head — softmax (need new array for output size)
    const actorRaw = new Float32Array(this.outputSize);
    matVecMul(this.Wactor, d2, this.outputSize, hs, actorRaw);
    addVecInPlace(actorRaw, this.bactor);
    const actionProbs = softmax(Array.from(actorRaw));

    // Critic head — linear
    const criticRaw = this._criticScratch;
    matVecMul(this.Wcritic, d2, 1, hs, criticRaw);
    criticRaw[0] += this.bcritic[0];
    const value = criticRaw[0];

    return { actionProbs, value, newHiddenState: hNew };
  }

  getWeights(): Float32Array {
    const allWeights: Float32Array[] = [
      this.Wz, this.Wr, this.Wh, this.bz, this.br, this.bh,
      this.W1, this.b1, this.W2, this.b2,
      this.Wactor, this.bactor, this.Wcritic, this.bcritic,
    ];
    const totalLength = allWeights.reduce((s, a) => s + a.length, 0);
    const result = new Float32Array(totalLength);
    let offset = 0;
    for (const w of allWeights) {
      result.set(w, offset);
      offset += w.length;
    }
    return result;
  }

  setWeights(weights: Float32Array): void {
    const targets: Float32Array[] = [
      this.Wz, this.Wr, this.Wh, this.bz, this.br, this.bh,
      this.W1, this.b1, this.W2, this.b2,
      this.Wactor, this.bactor, this.Wcritic, this.bcritic,
    ];
    let offset = 0;
    for (const t of targets) {
      for (let i = 0; i < t.length; i++) {
        t[i] = weights[offset + i];
      }
      offset += t.length;
    }
  }

  static averageWeights(a: Float32Array, b: Float32Array, noise = 0): Float32Array {
    const result = new Float32Array(a.length);
    for (let i = 0; i < a.length; i++) {
      result[i] = (a[i] + b[i]) / 2;
      if (noise > 0) {
        result[i] += gaussianRandom() * noise;
      }
    }
    return result;
  }

  get weightCount(): number {
    return this.getWeights().length;
  }

  get sizes(): { input: number; hidden: number; output: number } {
    return { input: this.inputSize, hidden: this.hiddenSize, output: this.outputSize };
  }
}
