export class Heap<T = number> {
  private data: Array<T>;
  private cmp: (lhs: T, rhs: T) => boolean;
  public size: number = 0;

  constructor(cmp?: (lhs: T, rhs: T) => boolean) {
    this.cmp = cmp || ((lhs, rhs) => lhs < rhs);
    this.data = new Array(1);
  }

  clear() {
    this.data = new Array(1);
    this.size = 0;
  }

  empty() {
    return this.size === 0;
  }

  push(x: T): T {
    this.size += 1;
    this.data.push(x);
    let k = this.size,
      data = this.data;
    while (k > 1 && this.cmp(data[k], data[Math.floor(k / 2)])) {
      const son = Math.floor(k / 2);
      [data[k], data[son]] = [data[son], data[k]];
      k = son;
    }
    return x;
  }

  top(): T {
    if (!this.size) throw 'No element in Heap';
    return this.data[1];
  }

  pop(): T {
    if (!this.size) throw 'No element in Heap';
    const r = this.data[1];
    this.data[1] = this.data[this.size];
    this.data.pop();
    this.size -= 1;
    this.heapify(1);
    return r;
  }

  private heapify(root: number) {
    let x = root,
      data = this.data;
    if (2 * root <= this.size && this.cmp(data[2 * root], data[root])) {
      x = 2 * root;
    }
    if (2 * root + 1 <= this.size && this.cmp(data[2 * root + 1], data[x])) {
      x = 2 * root + 1;
    }
    if (x != root) {
      [data[x], data[root]] = [data[root], data[x]];
      this.heapify(x);
    }
  }
}
