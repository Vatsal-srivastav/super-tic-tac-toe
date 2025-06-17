function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}

function softmax(xs) {
  const maxX = Math.max(...xs);
  const exps = xs.map(x => Math.exp(x - maxX));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => e / sum);
}

class BotNN {
  constructor(weights) {
    this.W1 = weights.W1;
    this.b1 = weights.b1;
    this.W2 = weights.W2;
    this.b2 = weights.b2;
  }

  forward(x) {
    let z1 = this.W1.map((row, i) =>
      row.reduce((sum, w, j) => sum + w * x[j], 0) + this.b1[i]
    );
    let a1 = z1.map(sigmoid);
    let z2 = this.W2.map((row, i) =>
      row.reduce((sum, w, j) => sum + w * a1[j], 0) + this.b2[i]
    );
    let a2 = softmax(z2);
    return a2;
  }

  predict(board, validMoves) {
    const probs = this.forward(board);
    let best = -1, bestVal = -Infinity;
    for (let idx of validMoves) {
      if (probs[idx] > bestVal) {
        bestVal = probs[idx];
        best = idx;
      }
    }
    return best;
  }
}