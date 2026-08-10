import { INITIAL_FEN } from "chessops/fen";
import { describe, expect, it } from "vitest";

import {
  appendEvents,
  commitMove,
  createRun,
  projectRun,
  rewind,
  type DrillRun,
  type EventDraft,
} from "./index.js";

const at = "2026-08-12T12:00:00.000Z";
const cycle = ["g1f3", "g8f6", "f3g1", "f6g8"] as const;

interface Samples {
  readonly medianMs: number;
  readonly p95Ms: number;
  readonly maxMs: number;
}

interface SizeReport {
  readonly eventCount: number;
  readonly projection: Samples;
  readonly rewind: Samples;
  readonly implicitForkCommit: Samples;
}

function freshRun(id: string): DrillRun {
  return createRun({
    id,
    packId: "latency-pack",
    packDigest: `sha256:${"2".repeat(64)}`,
    policyConfig: {
      seedMode: "per_branch",
      locus: { executedAt: "server", engineIds: [], modelIds: [] },
    },
    startFen: INITIAL_FEN,
    seed: 23,
    createdAt: at,
  });
}

function runWithEventCount(eventCount: number): DrillRun {
  let run = freshRun(`latency-${eventCount}`);
  let moveIndex = 0;
  while (true) {
    const actor = moveIndex % 2 === 0 ? "user" : "opponent";
    const addedEvents = actor === "opponent" ? 2 : 1;
    if (run.events.length + addedEvents > eventCount) break;
    run = commitMove(run, cycle[moveIndex % cycle.length]!, { actor, at }).run;
    moveIndex += 1;
  }

  const remaining = eventCount - run.events.length;
  if (remaining > 0) {
    const fillers: EventDraft[] = Array.from({ length: remaining }, () => ({
      type: "feedback.generated",
      at,
      data: {
        nodeId: run.activeCursor.nodeId,
        evidenceRefs: ["latency:filler"],
      },
    }));
    run = appendEvents(run, fillers);
  }
  return run;
}

function sample(operation: () => unknown): Samples {
  for (let index = 0; index < 3; index += 1) operation();
  const durations: number[] = [];
  for (let index = 0; index < 20; index += 1) {
    const started = performance.now();
    operation();
    durations.push(performance.now() - started);
  }
  durations.sort((left, right) => left - right);
  const rounded = (value: number): number => Math.round(value * 1_000) / 1_000;
  return {
    medianMs: rounded(durations[Math.floor(durations.length / 2)]!),
    p95Ms: rounded(durations[Math.ceil(durations.length * 0.95) - 1]!),
    maxMs: rounded(durations.at(-1)!),
  };
}

function measure(eventCount: number): SizeReport {
  const line = runWithEventCount(eventCount);
  const branchBase = runWithEventCount(eventCount - 1);
  const branchReady = rewind(
    branchBase,
    branchBase.nodes[0]!.id,
    at,
  ).run;
  expect(line.events).toHaveLength(eventCount);
  expect(branchReady.events).toHaveLength(eventCount);

  return {
    eventCount,
    projection: sample(() => projectRun(line.events)),
    rewind: sample(() => rewind(line, line.nodes[0]!.id, at)),
    implicitForkCommit: sample(() => commitMove(branchReady, "e2e4", { at })),
  };
}

describe("branch-runtime latency instrumentation", () => {
  it(
    "measures full projection, rewind, and implicit fork+commit at realistic log sizes",
    { timeout: 30_000 },
    () => {
      const report = [measure(200), measure(1_000)];
      console.info(`BRANCH_RUNTIME_LATENCY ${JSON.stringify(report)}`);

      for (const result of report) {
        expect(result.projection.medianMs).toBeGreaterThanOrEqual(0);
        expect(result.rewind.medianMs).toBeGreaterThanOrEqual(0);
        expect(result.implicitForkCommit.medianMs).toBeGreaterThanOrEqual(0);
      }
    },
  );
});
