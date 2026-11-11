/** Internal verification shortcut; membership is never evidence authority. */
export class FrozenDataMemo {
  #current = new WeakSet<object>();
  #previous = new WeakSet<object>();
  #writes = 0;

  constructor(private readonly capacity: number) {
    if (!Number.isSafeInteger(capacity) || capacity < 1) throw new RangeError("Frozen-data memo capacity must be a positive safe integer");
  }

  has(value: object): boolean {
    return this.#current.has(value) || this.#previous.has(value);
  }

  add(value: object): void {
    if (this.#writes === this.capacity) {
      this.#previous = this.#current;
      this.#current = new WeakSet<object>();
      this.#writes = 0;
    }
    this.#current.add(value);
    this.#writes++;
  }
}
