// DISPOSABLE RFC authoring harness — D1962-D1968. Not production code.
import { describe, expect, it } from "vitest";

type CandidateLine = readonly [candidateUci: string];
type RefutationLine = readonly [candidateUci: string, preparationUci: string, replyUci: string];
type ReintroductionLine = readonly [candidateUci: string, preparationUci: string, replyUci: string, captureUci: string];

type BoundedReturnOutcome =
  | Readonly<{ readonly kind: "not_reintroduced"; readonly firstRefutation: RefutationLine | null }>
  | Readonly<{ readonly kind: "reintroduced"; readonly witness: ReintroductionLine; readonly firstRefutation: RefutationLine | null }>
  | Readonly<{ readonly kind: "survives_every_defence"; readonly witness: ReintroductionLine }>;

type BatchResult =
  | Readonly<{ readonly kind: "completed"; readonly visitedPositions: number; readonly outcome: BoundedReturnOutcome }>
  | Readonly<{
      readonly kind: "abstained";
      readonly reason: "multiplication_limit" | "queue_full" | "cancelled" | "budget_exhausted";
      readonly visitedPositions: number;
    }>;

function exactLine<const Length extends 1 | 3 | 4>(value: readonly string[], length: Length):
  Length extends 1 ? CandidateLine : Length extends 3 ? RefutationLine : ReintroductionLine {
  if (value.length !== length || value.some((move) => !/^[a-h][1-8][a-h][1-8][qrbn]?$/u.test(move))) {
    throw new TypeError(`expected ${length} canonical move identities`);
  }
  return Object.freeze([...value]) as Length extends 1 ? CandidateLine : Length extends 3 ? RefutationLine : ReintroductionLine;
}

interface BatchRequest {
  readonly targetCount: number;
  readonly candidateCount: number;
  readonly nodeCount: number;
}

const MAX_PAIRS = 512;
const NODES_PER_YIELD = 64;

async function runCooperativeBatch(
  request: BatchRequest,
  signal: AbortSignal,
  yieldControl: () => Promise<void>,
): Promise<BatchResult> {
  if (request.targetCount * request.candidateCount > MAX_PAIRS) {
    return Object.freeze({ kind: "abstained", reason: "multiplication_limit", visitedPositions: 0 });
  }
  let visitedPositions = 0;
  while (visitedPositions < request.nodeCount) {
    if (signal.aborted) return Object.freeze({ kind: "abstained", reason: "cancelled", visitedPositions });
    visitedPositions += 1;
    if (visitedPositions % NODES_PER_YIELD === 0) {
      await yieldControl();
      if (signal.aborted) return Object.freeze({ kind: "abstained", reason: "cancelled", visitedPositions });
    }
  }
  return Object.freeze({
    kind: "completed",
    visitedPositions,
    outcome: Object.freeze({ kind: "not_reintroduced", firstRefutation: null }),
  });
}

class BoundedAdmissionQueue {
  readonly #maxActive: number;
  readonly #maxQueued: number;
  active = 0;
  queued = 0;

  constructor(maxActive: number, maxQueued: number) {
    this.#maxActive = maxActive;
    this.#maxQueued = maxQueued;
  }

  admit(): "active" | "queued" | "queue_full" {
    if (this.active < this.#maxActive) {
      this.active += 1;
      return "active";
    }
    if (this.queued < this.#maxQueued) {
      this.queued += 1;
      return "queued";
    }
    return "queue_full";
  }
}

describe("bounded-target second repeat author repair", () => {
  it("enforces the 512 ceiling at the one request that owns both complete sets", async () => {
    const signal = new AbortController().signal;
    await expect(runCooperativeBatch({ targetCount: 16, candidateCount: 32, nodeCount: 1 }, signal, async () => {}))
      .resolves.toMatchObject({ kind: "completed" });
    await expect(runCooperativeBatch({ targetCount: 17, candidateCount: 31, nodeCount: 1 }, signal, async () => {}))
      .resolves.toEqual({ kind: "abstained", reason: "multiplication_limit", visitedPositions: 0 });
  });

  it("yields during work and observes cancellation within one 64-node chunk", async () => {
    const controller = new AbortController();
    const result = await runCooperativeBatch(
      { targetCount: 1, candidateCount: 1, nodeCount: 1_000 },
      controller.signal,
      async () => controller.abort(),
    );
    expect(result).toEqual({ kind: "abstained", reason: "cancelled", visitedPositions: 64 });
  });

  it("bounds active and queued work instead of treating background as metadata", () => {
    const queue = new BoundedAdmissionQueue(1, 2);
    expect([queue.admit(), queue.admit(), queue.admit(), queue.admit()]).toEqual([
      "active",
      "queued",
      "queued",
      "queue_full",
    ]);
  });

  it("constructs only fixed-length canonical witness and refutation tuples", () => {
    expect(exactLine(["e2e4"], 1)).toEqual(["e2e4"]);
    expect(exactLine(["e2e4", "e7e5", "g1f3"], 3)).toHaveLength(3);
    expect(exactLine(["e2e4", "e7e5", "g1f3", "b8c6"], 4)).toHaveLength(4);
    expect(() => exactLine(["not-a-move"], 1)).toThrow(/canonical move identities/u);
    expect(() => exactLine(["e2e4", "e7e5"], 3)).toThrow(/canonical move identities/u);
  });
});
