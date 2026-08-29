// DISPOSABLE authoring model — D1993/D1994/D1998/D1999. Not production code.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { MessageChannel } from "node:worker_threads";
import { test } from "node:test";

function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonical(record[key])}`).join(",")}}`;
}

function digest(value: unknown): string {
  return createHash("sha256").update(canonical(value)).digest("hex");
}

interface InputImage {
  readonly producer: { readonly id: string; readonly version: 1 };
  readonly projection: { readonly id: string; readonly version: 1 };
  readonly payload: unknown;
}

function inputDigest(value: InputImage): string {
  return digest({ domain: "tabiya:bounded-target-input@1", ...value });
}

function requestDigest(threat: InputImage, exchanges: readonly InputImage[], sourcePosition: InputImage): string {
  return digest({
    domain: "tabiya:bounded-target-request@1",
    kind: "source_position_batch",
    threat: inputDigest(threat),
    exchanges: exchanges.map(inputDigest).toSorted(),
    sourcePosition: inputDigest(sourcePosition),
  });
}

function item(id: string, payload: unknown): InputImage {
  return Object.freeze({
    producer: Object.freeze({ id: `producer.${id}`, version: 1 }),
    projection: Object.freeze({ id, version: 1 }),
    payload,
  });
}

function messageChannelMacrotaskYield(): Promise<void> {
  return new Promise((resolve, reject) => {
    const { port1, port2 } = new MessageChannel();
    const close = (): void => { port1.close(); port2.close(); };
    port1.once("message", () => { close(); resolve(); });
    port1.once("messageerror", (error) => { close(); reject(error); });
    try { port2.postMessage(null); } catch (error) { close(); reject(error); }
  });
}

async function visit(count: number, signal: AbortSignal): Promise<{ readonly kind: "completed" | "cancelled"; readonly visited: number; readonly yields: number }> {
  let visited = 1;
  let yields = 0;
  while (visited < count) {
    if (signal.aborted) return { kind: "cancelled", visited, yields };
    visited += 1;
    if (visited % 64 === 0) {
      yields += 1;
      await messageChannelMacrotaskYield();
      if (signal.aborted) return { kind: "cancelled", visited, yields };
    }
  }
  return { kind: "completed", visited, yields };
}

interface TraversalEdge { readonly terminal?: boolean; readonly identityLost?: boolean; readonly key: string }
function countTraversal(edges: readonly TraversalEdge[], cap: number): { readonly kind: "completed" | "budget_exhausted"; readonly visited: number } {
  let visited = 1;
  for (const edge of edges) {
    if (visited === cap) return { kind: "budget_exhausted", visited };
    visited += 1;
    // Terminal, identity-lost and repeated keys are inspected occurrences, not exclusions.
    void edge.terminal;
    void edge.identityLost;
    void edge.key;
  }
  return { kind: "completed", visited };
}

class SharedJobModel {
  readonly jobs = new Map<string, { readonly waiters: Set<string>; state: "queued" | "running"; underlyingAborted: boolean }>();
  readonly maxUnique: number;
  constructor(maxUnique: number) { this.maxUnique = maxUnique; }

  attach(key: string, waiter: string): "attached" | "queue_full" {
    const existing = this.jobs.get(key);
    if (existing !== undefined) {
      existing.waiters.add(waiter);
      return "attached";
    }
    if (this.jobs.size === this.maxUnique) return "queue_full";
    this.jobs.set(key, { waiters: new Set([waiter]), state: "queued", underlyingAborted: false });
    return "attached";
  }

  abort(key: string, waiter: string): "waiter_cancelled" | "job_removed" | "job_aborted" {
    const job = this.jobs.get(key);
    if (job === undefined || !job.waiters.delete(waiter)) throw new TypeError("unknown waiter");
    if (job.waiters.size > 0) return "waiter_cancelled";
    this.jobs.delete(key);
    if (job.state === "queued") return "job_removed";
    job.underlyingAborted = true;
    return "job_aborted";
  }

  start(key: string): void {
    const job = this.jobs.get(key);
    if (job === undefined) throw new TypeError("unknown job");
    job.state = "running";
  }

  settle(key: string): void { this.jobs.delete(key); }
}

test("D1994 canonical identity ignores exchange order but changes with exact input bytes", () => {
  const threat = item("threat", { b: 2, a: 1 });
  const first = item("exchange", { capture: "c3d4" });
  const second = item("exchange", { capture: "f6e4" });
  const source = item("legal_moves", { fen: "example" });
  const expected = requestDigest(threat, [first, second], source);
  assert.equal(requestDigest(threat, [second, first], source), expected);
  assert.equal(requestDigest(item("threat", { a: 1, b: 2 }), [first, second], source), expected);
  assert.notEqual(requestDigest(item("threat", { a: 1, b: 3 }), [first, second], source), expected);
  assert.notEqual(requestDigest(threat, [first, second], item("legal_moves", { fen: "changed" })), expected);
});

test("D1993 dedup precedes capacity and cancellation belongs to each waiter", () => {
  const model = new SharedJobModel(1);
  assert.equal(model.attach("same", "first"), "attached");
  assert.equal(model.attach("same", "second"), "attached");
  assert.equal(model.attach("different", "third"), "queue_full");
  assert.equal(model.abort("same", "first"), "waiter_cancelled");
  assert.equal(model.jobs.get("same")?.waiters.has("second"), true);
  model.start("same");
  assert.equal(model.abort("same", "second"), "job_aborted");
  assert.equal(model.jobs.size, 0);
  assert.equal(model.attach("same", "late"), "attached");
  model.settle("same");
  assert.equal(model.attach("same", "post-settlement"), "attached");
  assert.equal(model.abort("same", "post-settlement"), "job_removed");
  assert.equal(model.jobs.size, 0);
});

test("D1998 real timer abort crosses the MessageChannel boundary at node 64", async () => {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), 0);
  assert.deepEqual(await visit(1_000, controller.signal), { kind: "cancelled", visited: 64, yields: 1 });
});

test("D1999 root/terminal/identity/repetition and cap boundaries count occurrences", () => {
  assert.deepEqual(countTraversal([], 4), { kind: "completed", visited: 1 });
  assert.deepEqual(countTraversal([{ key: "terminal", terminal: true }], 4), { kind: "completed", visited: 2 });
  assert.deepEqual(countTraversal([{ key: "lost", identityLost: true }], 4), { kind: "completed", visited: 2 });
  assert.deepEqual(countTraversal([{ key: "same" }, { key: "same" }], 4), { kind: "completed", visited: 3 });
  assert.deepEqual(countTraversal([{ key: "a" }, { key: "b" }], 3), { kind: "completed", visited: 3 });
  assert.deepEqual(countTraversal([{ key: "a" }, { key: "b" }, { key: "c" }], 3), { kind: "budget_exhausted", visited: 3 });
});

test("D1999 yield boundaries are 63/64/65", async () => {
  const signal = new AbortController().signal;
  assert.deepEqual(await visit(63, signal), { kind: "completed", visited: 63, yields: 0 });
  assert.deepEqual(await visit(64, signal), { kind: "completed", visited: 64, yields: 1 });
  assert.deepEqual(await visit(65, signal), { kind: "completed", visited: 65, yields: 1 });
});
