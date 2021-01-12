export function random(min: number, max: number) {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export function make2D<T>(n: number, m: number, value: T): T[][] {
  return Array(n)
    .fill(null)
    .map(() =>
      Array(m)
        .fill(null)
        .map(() => value)
    );
}

export function make2DFn<T>(
  n: number,
  m: number,
  value: (i: number, j: number) => T
): T[][] {
  return Array(n)
    .fill(null)
    .map((item, i) =>
      Array(m)
        .fill(null)
        .map((item, j) => value(i, j))
    );
}

export function easeLinear(t, b, c, d) {
  return b + (t / d) * c;
}
