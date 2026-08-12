import { randomUUID } from "node:crypto";
import { mkdir, open, readFile, unlink, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { SourcingError } from "./types.js";

interface LockDocument {
  readonly owner: string;
  readonly acquiredAt: string;
  readonly heartbeatAt: string;
}

export class SourceLock {
  readonly owner = `${process.pid}-${randomUUID()}`;
  readonly path: string;
  #timer: NodeJS.Timeout | undefined;

  constructor(sourceRoot = resolve("content/sources")) {
    this.path = resolve(sourceRoot, ".fetch.lock");
  }

  async acquire(now = new Date()): Promise<void> {
    await mkdir(resolve(this.path, ".."), { recursive: true });
    let handle;
    try {
      handle = await open(this.path, "wx");
    } catch (error) {
      if (objectCode(error) === "EEXIST") throw new SourcingError("STALE_LOCK_HELD", `source lock exists at ${this.path}; remove it manually after confirming no fetch is active`);
      throw error;
    }
    const timestamp = now.toISOString();
    await handle.writeFile(JSON.stringify({ owner: this.owner, acquiredAt: timestamp, heartbeatAt: timestamp } satisfies LockDocument));
    await handle.close();
    this.#timer = setInterval(() => void this.#heartbeat(), 30_000);
    this.#timer.unref();
  }

  async #document(): Promise<LockDocument> {
    return JSON.parse(await readFile(this.path, "utf8")) as LockDocument;
  }

  async verify(): Promise<void> {
    let document: LockDocument;
    try { document = await this.#document(); }
    catch { throw new SourcingError("LOCK_LOST", `source lock disappeared: ${this.path}`); }
    if (document.owner !== this.owner) throw new SourcingError("LOCK_LOST", `source lock owner changed at ${this.path}`);
  }

  async #heartbeat(): Promise<void> {
    try {
      await this.verify();
      const document = await this.#document();
      await writeFile(this.path, JSON.stringify({ ...document, heartbeatAt: new Date().toISOString() } satisfies LockDocument));
    } catch {
      if (this.#timer) clearInterval(this.#timer);
    }
  }

  async release(): Promise<void> {
    if (this.#timer) clearInterval(this.#timer);
    try {
      const document = await this.#document();
      if (document.owner === this.owner) await unlink(this.path);
    } catch {
      // A missing or replaced lock is deliberately never deleted here.
    }
  }
}

function objectCode(error: unknown): string | undefined {
  return typeof error === "object" && error !== null && "code" in error ? String(error.code) : undefined;
}

export async function withSourceLock<T>(sourceRoot: string, work: (lock: SourceLock) => Promise<T>): Promise<T> {
  const lock = new SourceLock(sourceRoot);
  await lock.acquire();
  try { return await work(lock); }
  finally { await lock.release(); }
}
