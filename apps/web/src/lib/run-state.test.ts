import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import {
  attachEvidence,
  commitMove,
  createRun,
  reachCheckpoint,
  rewind,
  type DrillRun,
  type MutationResult,
  type OpponentSelection,
} from "@chess-tabiya/runtime";
import { describe, expect, it, vi } from "vitest";

import {
  ApiError,
  type CreateRunRequest,
  type EventsPage,
  type EvidencePage,
  type ForkRequest,
  type MoveOptions,
  type PlayerMoveRequest,
  type RewindRequest,
  type RunApi,
} from "./api.js";
import { RunStateStore, type PollScheduler } from "./run-state.js";
import { WriterSession, type KeyValueStorage } from "./writer-session.js";

const at = "2026-08-12T20:00:00.000Z";
const pack = {
  id: "pack-a",
  version: "0.2",
  title: "Pack A",
  mode: "opening",
  feedbackPolicy: "delayed_checkpoint",
  start: { fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" },
  objective: { type: "play_until_checkpoint" },
  checkpoints: [{ id: "reveal", trigger: { atPly: 1 } }],
  provenance: { reviewStatus: "schema_example" },
} as unknown as DrillPackDefinition;

function initialRun(): DrillRun {
  return createRun({
    id: "run-a",
    packId: pack.id,
    packDigest: `sha256:${"a".repeat(64)}`,
    policyConfig: {
      seedMode: "fixed",
      locus: { executedAt: "server", engineIds: [], modelIds: [] },
    },
    startFen: pack.start.fen,
    seed: 7,
    createdAt: at,
  });
}

class MemoryStorage implements KeyValueStorage {
  readonly values = new Map<string, string>();
  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

class FakeScheduler implements PollScheduler {
  readonly timers = new Map<number, { readonly interval: number; readonly task: () => void | Promise<void> }>();
  #next = 0;

  setInterval(task: () => void | Promise<void>, interval: number): number {
    const id = ++this.#next;
    this.timers.set(id, { interval, task });
    return id;
  }

  clearInterval(handle: unknown): void {
    this.timers.delete(handle as number);
  }

  async run(interval: number): Promise<void> {
    const tasks = [...this.timers.values()].filter(
      (timer) => timer.interval === interval,
    );
    for (const timer of tasks) await timer.task();
  }
}

class FakeApi implements RunApi {
  serverRun = initialRun();
  conflict = false;
  evidenceCalls = 0;
  eventCalls: number[] = [];

  async createRun(_input: CreateRunRequest, _writerId: string): Promise<DrillRun> {
    return this.serverRun;
  }

  async move(
    _runId: string,
    input: PlayerMoveRequest,
    _writerId: string,
  ): Promise<MutationResult> {
    if (this.conflict) {
      throw new ApiError(409, "NOT_ACTIVE_WRITER", "Another writer owns this run");
    }
    const beforeEventCount = this.serverRun.events.length;
    const committed = commitMove(this.serverRun, input.uci, { at });
    const reached = reachCheckpoint(committed.run, "reveal", at);
    this.serverRun = reached.run;
    return {
      run: reached.run,
      emitted: reached.run.events.slice(beforeEventCount),
    };
  }

  async appendOpponentPly(
    _runId: string,
    _selection: OpponentSelection,
    _writerId: string,
    _options?: MoveOptions,
  ): Promise<MutationResult> {
    throw new Error("not used");
  }

  async prediction(): Promise<never> {
    throw new Error("not used");
  }

  async recordReasoning(): Promise<never> {
    throw new Error("not used");
  }

  async createGroup(): Promise<never> { throw new Error("not used"); }
  async groupReply(): Promise<never> { throw new Error("not used"); }
  async analysis(): Promise<{ readonly jobs: readonly { readonly id: string }[] }> { throw new Error("not used"); }

  async rewind(
    _runId: string,
    _input: RewindRequest,
    _writerId: string,
  ): Promise<MutationResult> {
    throw new Error("not used");
  }

  async fork(
    _runId: string,
    _input: ForkRequest,
    _writerId: string,
  ): Promise<MutationResult> {
    throw new Error("not used");
  }

  async events(_runId: string, sinceSeq = 0): Promise<EventsPage> {
    this.eventCalls.push(sinceSeq);
    return {
      events: this.serverRun.events.filter((event) => event.seq > sinceSeq),
      nextSeq: this.serverRun.events.at(-1)?.seq ?? 0,
    };
  }

  async evidence(_runId: string, _sinceSeq = 0): Promise<EvidencePage> {
    this.evidenceCalls += 1;
    return {
      results: [
        {
          seq: 1,
          jobId: "evidence-job-1",
          runId: this.serverRun.id,
          nodeId: this.serverRun.activeCursor.nodeId,
          evidenceRefs: ["engine:evidence-job-1"],
          payload: {
            kind: "eval",
            source: "engine_validated",
            values: { centipawns: 12 },
          },
        },
      ],
      nextSeq: 1,
    };
  }

  async reveal(
    _runId: string,
    _writerId: string,
    _at?: string,
  ): Promise<MutationResult> {
    throw new Error("not used");
  }

  async applyEvidence(
    _runId: string,
    _resultSeq: number,
    _writerId: string,
  ): Promise<MutationResult> {
    const result = attachEvidence(
      this.serverRun,
      this.serverRun.activeCursor.nodeId,
      ["engine:evidence-job-1"],
      {
        kind: "eval",
        source: "engine_validated",
        values: { centipawns: 12 },
      },
      at,
    );
    this.serverRun = result.run;
    return result;
  }
}

function session(storage = new MemoryStorage()): WriterSession {
  return WriterSession.claimFor("run-a", storage, () => "writer-a");
}

describe("RunStateStore", () => {
  it("projects mutation-returned events and polls revealed pending evidence at 1s", async () => {
    const api = new FakeApi();
    const scheduler = new FakeScheduler();
    const store = new RunStateStore(api, session(), api.serverRun, scheduler);
    store.start();

    await store.move({ uci: "e2e4" });
    expect(store.snapshot.run.activeCursor.nodeId).toBe("run-a:node:1");
    expect(store.snapshot.run.events.map((event) => event.type)).toEqual([
      "run.started",
      "move.committed",
      "checkpoint.reached",
    ]);
    expect(store.snapshot.pendingEvidence).toBe(1);
    expect([...scheduler.timers.values()].map((timer) => timer.interval)).toEqual([
      1_000,
    ]);

    await scheduler.run(1_000);
    expect(api.evidenceCalls).toBe(1);
    expect(store.snapshot.pendingEvidence).toBe(0);
    expect(store.snapshot.run.nodes.at(-1)!.evidenceRefs).toEqual([
      "engine:evidence-job-1",
    ]);
    expect(scheduler.timers.size).toBe(0);
  });

  it("coalesces overlapping evidence timer ticks", async () => {
    const api = new FakeApi();
    const scheduler = new FakeScheduler();
    const store = new RunStateStore(api, session(), api.serverRun, scheduler);
    store.start();
    await store.move({ uci: "e2e4" });

    await Promise.all([store.pollEvidence(), store.pollEvidence()]);

    expect(api.evidenceCalls).toBe(1);
    expect(store.snapshot.pendingEvidence).toBe(0);
    expect(store.snapshot.run.nodes.at(-1)!.evidenceRefs).toEqual([
      "engine:evidence-job-1",
    ]);
  });

  it("serializes an explicit analysis request behind an in-flight evidence page", async () => {
    const api = new FakeApi();
    const scheduler = new FakeScheduler();
    const store = new RunStateStore(api, session(), api.serverRun, scheduler);
    store.start();
    await store.move({ uci: "e2e4" });

    let releaseApply!: () => void;
    let markApplyStarted!: () => void;
    const applyGate = new Promise<void>((resolve) => { releaseApply = resolve; });
    const applyStarted = new Promise<void>((resolve) => { markApplyStarted = resolve; });
    const applyEvidence = api.applyEvidence.bind(api);
    vi.spyOn(api, "applyEvidence").mockImplementation(async (runId, resultSeq, writerId) => {
      markApplyStarted();
      await applyGate;
      return applyEvidence(runId, resultSeq, writerId);
    });
    const analysis = vi.spyOn(api, "analysis").mockResolvedValue({ jobs: [{ id: "manual-job" }] });

    const poll = store.pollEvidence();
    await applyStarted;
    const requested = store.analysis([store.snapshot.run.activeCursor.nodeId]);
    await Promise.resolve();
    expect(analysis).not.toHaveBeenCalled();

    releaseApply();
    await poll;
    await requested;
    expect(analysis).toHaveBeenCalledTimes(1);
    expect(store.snapshot.pendingEvidence).toBe(1);
    expect([...scheduler.timers.values()].map((timer) => timer.interval)).toEqual([1_000]);
  });

  it("does not evidence-poll before the pack reveal condition", async () => {
    const api = new FakeApi();
    const scheduler = new FakeScheduler();
    const unrevealed = commitMove(api.serverRun, "e2e4", { at });
    api.serverRun = unrevealed.run;
    const store = new RunStateStore(api, session(), api.serverRun, scheduler);
    store.start();

    expect(store.snapshot.pendingEvidence).toBe(1);
    expect(scheduler.timers.size).toBe(0);
  });

  it("does not keep polling jobs that the server cancels on rewind", () => {
    const api = new FakeApi();
    const first = commitMove(api.serverRun, "e2e4", { at });
    const second = commitMove(first.run, "e7e5", { at });
    const rewound = rewind(second.run, api.serverRun.activeCursor.nodeId, at);
    api.serverRun = rewound.run;
    const scheduler = new FakeScheduler();
    const store = new RunStateStore(api, session(), api.serverRun, scheduler);
    store.start();

    expect(store.snapshot.pendingEvidence).toBe(0);
    expect(scheduler.timers.size).toBe(0);
  });

  it("turns a rejected writer into a 2s event-polling follower", async () => {
    const api = new FakeApi();
    const scheduler = new FakeScheduler();
    const store = new RunStateStore(api, session(), api.serverRun, scheduler);
    store.start();
    api.conflict = true;

    await expect(store.move({ uci: "e2e4" })).rejects.toMatchObject({
      code: "NOT_ACTIVE_WRITER",
    });
    expect(store.snapshot.access).toBe("read_only");
    expect([...scheduler.timers.values()].map((timer) => timer.interval)).toEqual([
      2_000,
    ]);

    await scheduler.run(2_000);
    expect(api.eventCalls).toEqual([1]);
  });

  it("resumes state by projecting the full event stream", async () => {
    const api = new FakeApi();
    const committed = commitMove(api.serverRun, "e2e4", { at });
    api.serverRun = committed.run;

    const store = await RunStateStore.resume(api, session());
    expect(api.eventCalls).toEqual([0]);
    expect(store.snapshot.run.activeCursor.nodeId).toBe("run-a:node:1");
  });
});
