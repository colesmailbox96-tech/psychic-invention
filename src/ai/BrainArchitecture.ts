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
function matVecMul(W: Float32Array, x: Float32Array | number[], rows: number, cols: number): Float32Array {
  const result = new Float32Array(rows);
  for (let i = 0; i < rows; i++) {
    let sum = 0;
    const offset = i * cols;
    for (let j = 0; j < cols; j++) {
      sum += W[offset + j] * (x as number[])[j];
    }
    result[i] = sum;
  }
  return result;
}

function addVec(a: Float32Array, b: Float32Array): Float32Array {
  const result = new Float32Array(a.length);
  for (let i = 0; i < a.length; i++) {
    result[i] = a[i] + b[i];
  }
  return result;
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

    // Concatenate [h, x]
    const hx = new Float32Array(concatSize);
    hx.set(h, 0);
    for (let i = 0; i < this.inputSize; i++) {
      hx[hs + i] = x[i] ?? 0;
    }

    // GRU cell
    // z = sigmoid(Wz * [h, x] + bz)
    const zRaw = addVec(matVecMul(this.Wz, hx, hs, concatSize), this.bz);
    const z = new Float32Array(hs);
    for (let i = 0; i < hs; i++) z[i] = sigmoid(zRaw[i]);

    // r = sigmoid(Wr * [h, x] + br)
    const rRaw = addVec(matVecMul(this.Wr, hx, hs, concatSize), this.br);
    const r = new Float32Array(hs);
    for (let i = 0; i < hs; i++) r[i] = sigmoid(rRaw[i]);

    // h_hat = tanh(Wh * [r*h, x] + bh)
    const rhx = new Float32Array(concatSize);
    for (let i = 0; i < hs; i++) rhx[i] = r[i] * h[i];
    for (let i = 0; i < this.inputSize; i++) rhx[hs + i] = x[i] ?? 0;
    const hHatRaw = addVec(matVecMul(this.Wh, rhx, hs, concatSize), this.bh);
    const hHat = new Float32Array(hs);
    for (let i = 0; i < hs; i++) hHat[i] = tanhActivation(hHatRaw[i]);

    // h_new = (1 - z) * h + z * h_hat
    const hNew = new Float32Array(hs);
    for (let i = 0; i < hs; i++) hNew[i] = (1 - z[i]) * h[i] + z[i] * hHat[i];

    // Dense layer 1 with ReLU
    const d1Raw = addVec(matVecMul(this.W1, hNew, hs, hs), this.b1);
    const d1 = new Float32Array(hs);
    for (let i = 0; i < hs; i++) d1[i] = relu(d1Raw[i]);

    // Dense layer 2 with ReLU
    const d2Raw = addVec(matVecMul(this.W2, d1, hs, hs), this.b2);
    const d2 = new Float32Array(hs);
    for (let i = 0; i < hs; i++) d2[i] = relu(d2Raw[i]);

    // Actor head — softmax
    const actorRaw = addVec(matVecMul(this.Wactor, d2, this.outputSize, hs), this.bactor);
    const actionProbs = softmax(Array.from(actorRaw));

    // Critic head — linear
    const criticRaw = addVec(matVecMul(this.Wcritic, d2, 1, hs), this.bcritic);
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
