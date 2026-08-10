import { describe, expect, it } from "vitest";

import {
  WriterSession,
  writerStorageKey,
  type KeyValueStorage,
} from "./writer-session.js";

class MemoryStorage implements KeyValueStorage {
  readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe("WriterSession", () => {
  it("persists one writer id per run and resumes it after refresh", () => {
    const storage = new MemoryStorage();
    let generated = 0;
    const factory = () => `writer-${++generated}`;

    const first = new WriterSession("run-a", storage, factory);
    const refreshed = new WriterSession("run-a", storage, factory);
    const otherRun = new WriterSession("run-b", storage, factory);

    expect(first.writerId).toBe("writer-1");
    expect(refreshed.writerId).toBe(first.writerId);
    expect(otherRun.writerId).toBe("writer-2");
    expect(storage.values.get(writerStorageKey("run-a"))).toBe("writer-1");
  });

  it("switches the in-memory session to read-only without poisoning refresh", () => {
    const storage = new MemoryStorage();
    const first = new WriterSession("run-a", storage, () => "writer-a");
    first.markReadOnly();

    expect(first.readOnly).toBe(true);
    expect(new WriterSession("run-a", storage, () => "unused").readOnly).toBe(false);
  });
});
