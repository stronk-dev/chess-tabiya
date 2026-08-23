import { describe, expect, it } from "vitest";

import { clearAccountLocalData, clearRunLocalData } from "./account-local-data.js";

class MemoryStorage implements Storage {
  readonly #values = new Map<string, string>();
  get length(): number { return this.#values.size; }
  clear(): void { this.#values.clear(); }
  getItem(key: string): string | null { return this.#values.get(key) ?? null; }
  key(index: number): string | null { return [...this.#values.keys()][index] ?? null; }
  removeItem(key: string): void { this.#values.delete(key); }
  setItem(key: string, value: string): void { this.#values.set(key, value); }
}

describe("account-local data", () => {
  it("clears all three registered grammars and leaves unrelated application data alone", () => {
    const storage = new MemoryStorage();
    for (const key of ["tabiya:marks:r1", "tabiya.assistance.v1.pack", "tabiya.workflow.v1.just-play", "chess-tabiya:run:r1:writer-id", "another-app:key"]) storage.setItem(key, "value");
    expect(clearAccountLocalData(storage)).toEqual(["chess-tabiya:run:r1:writer-id", "tabiya.assistance.v1.pack", "tabiya.workflow.v1.just-play", "tabiya:marks:r1"]);
    expect(storage.getItem("another-app:key")).toBe("value");
  });


  it("clears only one run's addressable writer and view keys", () => {
    const storage = new MemoryStorage();
    for (const key of ["chess-tabiya:run:r1:writer-id", "tabiya:mark-scope:r1", "tabiya:branch-fold:v1:r1", "chess-tabiya:run:r2:writer-id"]) storage.setItem(key, "value");
    expect(clearRunLocalData(storage, "r1")).toEqual(["chess-tabiya:run:r1:writer-id", "tabiya:branch-fold:v1:r1", "tabiya:mark-scope:r1"]);
    expect(storage.getItem("chess-tabiya:run:r2:writer-id")).toBe("value");
  });
});
