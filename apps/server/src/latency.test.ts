import { once } from "node:events";
import type { AddressInfo } from "node:net";

import {
  appendEvents,
  appendOpponentPly,
  commitMove,
  createRun,
  rewind,
  type DrillRun,
  type EventDraft,
} from "@chess-tabiya/runtime";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createHttpServer, createRestHandler } from "./rest.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";

const INITIAL_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const at = "2026-08-12T14:30:00.000Z";
const writer = "latency-writer";
const cycle = ["g1f3", "g8f6", "f3g1", "f6g8"] as const;

interface Samples {
  readonly medianMs: number;
  readonly p95Ms: number;
  readonly maxMs: number;
}

interface TransportReport {
  readonly eventCount: number;
  readonly coldProjection: Samples;
  readonly rewind: Samples;
  readonly implicitForkCommit: Samples;
}

function freshRun(id: string): DrillRun {
  return createRun({
    id,
    packId: "server-latency-pack",
    packDigest: `sha256:${"7".repeat(64)}`,
    policyConfig: {
      seedMode: "per_branch",
      locus: { executedAt: "server", engineIds: [], modelIds: [] },
    },
    startFen: INITIAL_FEN,
    seed: 29,
    createdAt: at,
  });
}

function runWithEventCount(id: string, eventCount: number): DrillRun {
  let run = freshRun(id);
  let moveIndex = 0;
  while (true) {
    const actor = moveIndex % 2 === 0 ? "user" : "opponent";
    const addedEvents = actor === "opponent" ? 2 : 1;
    if (run.events.length + addedEvents > eventCount) break;
    const move = cycle[moveIndex % cycle.length]!;
    run =
      actor === "opponent"
        ? appendOpponentPly(
            run,
            {
              moveUci: move,
              engine: {
                id: "latency-mock",
                name: "Latency mock",
                version: "1",
                seedHonored: true,
              },
            },
            { at },
          ).run
        : commitMove(run, move, { at }).run;
    moveIndex += 1;
  }

  const remaining = eventCount - run.events.length;
  if (remaining > 0) {
    const fillers: EventDraft[] = Array.from({ length: remaining }, () => ({
      type: "feedback.generated",
      at,
      data: { nodeId: run.activeCursor.nodeId, evidenceRefs: ["latency:filler"] },
    }));
    run = appendEvents(run, fillers);
  }
  return run;
}

async function sample(
  prepare: () => void,
  operation: () => Promise<void>,
): Promise<Samples> {
  for (let index = 0; index < 3; index += 1) {
    prepare();
    await operation();
  }
  const durations: number[] = [];
  for (let index = 0; index < 20; index += 1) {
    prepare();
    const started = performance.now();
    await operation();
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

describe("server-bound branch-runtime latency", () => {
  const storage = new SQLiteRunStorage();
  const server = createHttpServer(createRestHandler(new RunService(storage)));
  let baseUrl = "";

  beforeAll(async () => {
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    server.close();
    await once(server, "close");
    storage.close();
  });

  async function consume(path: string, init?: RequestInit): Promise<void> {
    const response = await fetch(`${baseUrl}${path}`, init);
    await response.arrayBuffer();
    expect(response.status).toBe(200);
  }

  async function measure(eventCount: number): Promise<TransportReport> {
    const line = runWithEventCount(`transport-line-${eventCount}`, eventCount);
    const branchBase = runWithEventCount(`transport-branch-${eventCount}`, eventCount - 1);
    const branchReady = rewind(branchBase, branchBase.nodes[0]!.id, at).run;
    expect(line.events).toHaveLength(eventCount);
    expect(branchReady.events).toHaveLength(eventCount);
    storage.create(line, writer);
    storage.create(branchReady, writer);

    const coldProjection = await sample(
      () => storage.clearSnapshotCache(),
      () => consume(`/runs/${line.id}/graph`),
    );
    const rewindSamples = await sample(
      () => storage.save(line, writer),
      () => consume(`/runs/${line.id}/rewind`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-writer-id": writer },
        body: JSON.stringify({ nodeId: line.nodes[0]!.id, at }),
      }),
    );
    const implicitForkCommit = await sample(
      () => storage.save(branchReady, writer),
      () => consume(`/runs/${branchReady.id}/moves`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-writer-id": writer },
        body: JSON.stringify({ uci: "e2e4", at }),
      }),
    );

    return {
      eventCount,
      coldProjection,
      rewind: rewindSamples,
      implicitForkCommit,
    };
  }

  it(
    "measures cold projection, rewind, and implicit fork+commit through SQLite and HTTP",
    { timeout: 120_000 },
    async () => {
      const report = [await measure(200), await measure(1_000)];
      console.info(`BRANCH_SERVER_LATENCY ${JSON.stringify(report)}`);

      for (const result of report) {
        expect(result.coldProjection.medianMs).toBeGreaterThanOrEqual(0);
        expect(result.rewind.medianMs).toBeGreaterThanOrEqual(0);
        expect(result.implicitForkCommit.medianMs).toBeGreaterThanOrEqual(0);
      }
    },
  );
});
