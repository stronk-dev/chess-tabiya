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

    const first = WriterSession.claimFor("run-a", storage, factory);
    const refreshed = WriterSession.claimFor("run-a", storage, factory);
    const otherRun = WriterSession.claimFor("run-b", storage, factory);

    expect(first.writerId).toBe("writer-1");
    expect(refreshed.writerId).toBe(first.writerId);
    expect(otherRun.writerId).toBe("writer-2");
    expect(storage.values.get(writerStorageKey("run-a"))).toBe("writer-1");
  });

  it("switches the in-memory session to read-only without poisoning refresh", () => {
    const storage = new MemoryStorage();
    const first = WriterSession.claimFor("run-a", storage, () => "writer-a");
    first.markReadOnly();

    expect(first.readOnly).toBe(true);
    expect(WriterSession.claimFor("run-a", storage, () => "unused").readOnly).toBe(false);
  });

  it("peeks at a foreign run without minting or touching localStorage", () => {
    const storage = new MemoryStorage();

    expect(WriterSession.peek("foreign-run", storage)).toBeUndefined();
    expect(storage.values.size).toBe(0);

    const observer = WriterSession.observe("foreign-run", "foreign-writer");
    expect(observer.readOnly).toBe(true);
    expect(storage.values.size).toBe(0);
  });
});
