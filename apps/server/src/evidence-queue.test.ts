import {
  compareBranches,
  type EvidencePayload,
  type ObjectiveEvidenceUpgrader,
} from "@chess-tabiya/runtime";
import { afterEach, describe, expect, it } from "vitest";

import {
  EvidenceJobQueue,
  StockfishEvidenceExecutor,
  type EvidenceExecutor,
  type EvidenceJob,
} from "./evidence-queue.js";
import { createRestHandler } from "./rest.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";

const INITIAL_FEN =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const at = "2026-08-12T18:00:00.000Z";

function createInput(id: string) {
  return {
    id,
    session: {
      kind: "position" as const,
      start: { fen: INITIAL_FEN, side: "white" as const },
      feedbackPolicy: "attempt_end" as const,
      opponentPolicy: { mode: "human_common" as const },
    },
    policyConfig: {
      seedMode: "fixed" as const,
      locus: { executedAt: "server" as const, engineIds: [], modelIds: [] },
    },
    seed: 73,
    createdAt: at,
  };
}

function payload(
  kind: EvidencePayload["kind"],
  source: EvidencePayload["source"] = "engine_validated",
): EvidencePayload {
  return { kind, source, values: { score: kind === "eval" ? 32 : 0.61 } };
}

function deferred<T>(): {
  readonly promise: Promise<T>;
  readonly resolve: (value: T) => void;
} {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function job(runId: string, nodeId: string, kind: "eval" | "wdl" = "eval") {
  return {
    runId,
    nodeId,
    fen: INITIAL_FEN,
    kind,
    depth: 12,
  } as const;
}

async function request(
  handler: ReturnType<typeof createRestHandler>,
  method: string,
  path: string,
  body?: unknown,
  writerId = "writer-a",
): Promise<Response> {
  return handler(
    new Request(`http://server.test${path}`, {
      method,
      headers: {
        ...(writerId === "" ? {} : { "x-writer-id": writerId }),
        ...(body === undefined ? {} : { "content-type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    }),
  );
}

describe("evidence job queue", () => {
  it("extracts typed eval, WDL, and best-line evidence from analysis Stockfish", async () => {
    const requests: { engineId: string; commands: readonly string[]; signal?: AbortSignal }[] = [];
    const executor = new StockfishEvidenceExecutor({
      async execute(engineId, request) {
        requests.push({
          engineId,
          commands: request.commands,
          ...(request.signal === undefined ? {} : { signal: request.signal }),
        });
        if (request.commands.includes("setoption name UCI_ShowWDL value true")) {
          return ["info depth 17 score cp 21 wdl 412 537 51 pv e2e4", "bestmove e2e4"];
        }
        if (request.commands.at(-1) === "go depth 19") {
          return ["info depth 19 score cp 34 pv e2e4 e7e5 g1f3", "bestmove e2e4"];
        }
        return ["info depth 15 score mate 3 pv e2e4 e7e5", "bestmove e2e4"];
      },
    });
    const signal = new AbortController().signal;
    const base = {
      id: "job",
      runId: "run",
      nodeId: "node",
      fen: INITIAL_FEN,
    } as const;

    await expect(
      executor.execute({ ...base, kind: "eval", movetime: 40 }, signal),
    ).resolves.toEqual({
      kind: "eval",
      source: "engine_validated",
      values: {
        engineId: "stockfish-analysis",
        requestedMovetimeMs: 40,
        mateIn: 3,
        depth: 15,
      },
    });
    await expect(
      executor.execute({ ...base, fen: "4k3/8/8/8/8/8/8/4K3 b - - 0 1", kind: "eval", movetime: 40 }, signal),
    ).resolves.toMatchObject({
      kind: "eval",
      values: { mateIn: -3 },
    });
    await expect(
      executor.execute({ ...base, kind: "wdl", depth: 17 }, signal),
    ).resolves.toEqual({
      kind: "wdl",
      source: "engine_validated",
      values: {
        engineId: "stockfish-analysis",
        requestedDepth: 17,
        win: 412,
        draw: 537,
        loss: 51,
        depth: 17,
      },
    });
    await expect(
      executor.execute({ ...base, kind: "bestline", depth: 19 }, signal),
    ).resolves.toEqual({
      kind: "bestline",
      source: "engine_validated",
      values: {
        engineId: "stockfish-analysis",
        requestedDepth: 19,
        movesUci: ["e2e4", "e7e5", "g1f3"],
        depth: 19,
      },
    });
    expect(requests).toHaveLength(4);
    expect(requests.every((request) => request.engineId === "stockfish-analysis")).toBe(true);
    expect(requests.every((request) => request.signal === signal)).toBe(true);
  });

  it("starts jobs FIFO while respecting bounded concurrency", async () => {
    const gates = [deferred<EvidencePayload>(), deferred<EvidencePayload>(), deferred<EvidencePayload>()];
    const starts: string[] = [];
    let active = 0;
    let maximumActive = 0;
    const executor: EvidenceExecutor = {
      async execute(current) {
        const index = Number(current.nodeId.slice(-1)) - 1;
        starts.push(current.nodeId);
        active += 1;
        maximumActive = Math.max(maximumActive, active);
        const result = await gates[index]!.promise;
        active -= 1;
        return result;
      },
    };
    const queue = new EvidenceJobQueue(executor, { maxConcurrency: 2 });

    queue.enqueue(job("run-a", "node-1"));
    queue.enqueue(job("run-a", "node-2"));
    queue.enqueue(job("run-a", "node-3"));
    await Promise.resolve();
    expect(starts).toEqual(["node-1", "node-2"]);
    expect(maximumActive).toBe(2);

    gates[1]!.resolve(payload("eval"));
    await Promise.resolve();
    await Promise.resolve();
    expect(starts).toEqual(["node-1", "node-2", "node-3"]);
    gates[0]!.resolve(payload("eval"));
    gates[2]!.resolve(payload("eval"));
    await queue.whenIdle();

    expect(maximumActive).toBe(2);
    expect(queue.page("run-a").results).toHaveLength(3);
  });

  it("cancels queued and running off-path jobs on rewind and discards a late result", async () => {
    const late = deferred<EvidencePayload>();
    const observed: { jobs: EvidenceJob[]; signals: AbortSignal[] } = {
      jobs: [],
      signals: [],
    };
    const executor: EvidenceExecutor = {
      execute(current, signal) {
        observed.jobs.push(current);
        observed.signals.push(signal);
        return late.promise; // deliberately ignores cancellation
      },
    };
    const queue = new EvidenceJobQueue(executor, { maxConcurrency: 1 });
    const storage = new SQLiteRunStorage();
    const service = new RunService(storage, { evidenceQueue: queue });
    try {
      const created = await service.create(createInput("rewind-run"), "writer-a");
      const rootId = created.activeCursor.nodeId;
      const moved = service.move("rewind-run", "writer-a", "e2e4", { at });
      const nodeId = moved.run.activeCursor.nodeId;
      service.enqueueEvidence("rewind-run", { nodeId, kind: "eval", depth: 14 });
      service.enqueueEvidence("rewind-run", { nodeId, kind: "wdl", depth: 14 });
      await Promise.resolve();

      service.rewind("rewind-run", "writer-a", { nodeId: rootId }, at);
      expect(observed.signals[0]!.aborted).toBe(true);
      late.resolve(payload("eval"));
      await queue.whenIdle();

      expect(observed.jobs).toHaveLength(1);
      expect(queue.page("rewind-run").results).toEqual([]);
      expect(queue.failures("rewind-run")).toEqual([]);
    } finally {
      storage.close();
    }
  });
});

describe("evidence staging and writer application", () => {
  const stores: SQLiteRunStorage[] = [];

  afterEach(() => {
    for (const storage of stores.splice(0)) storage.close();
  });

  it("stages over GET, enforces the writer lease, then appends position evidence without inventing an objective", async () => {
    const executor: EvidenceExecutor = {
      async execute(current) {
        return payload(current.kind);
      },
    };
    const upgrader: ObjectiveEvidenceUpgrader = {
      async evaluate(objectiveRequest) {
        const evidenceRef = objectiveRequest.evidenceRefs.at(-1)!;
        return {
          nodeId: objectiveRequest.nodeId,
          from: objectiveRequest.objectiveState,
          to: "preserved",
          evidenceRefs: [evidenceRef],
        };
      },
    };
    const queue = new EvidenceJobQueue(executor, { objectiveUpgrader: upgrader });
    const storage = new SQLiteRunStorage();
    stores.push(storage);
    const service = new RunService(storage, { evidenceQueue: queue });
    const handler = createRestHandler(service);
    const run = await service.create(createInput("apply-run"), "writer-a");
    service.enqueueEvidence("apply-run", {
      nodeId: run.activeCursor.nodeId,
      kind: "eval",
      depth: 16,
    });
    await queue.whenIdle();
    service.reveal("apply-run", "writer-a", at);

    const stagedResponse = await request(
      handler,
      "GET",
      "/runs/apply-run/evidence?sinceSeq=0",
      undefined,
      "",
    );
    expect(stagedResponse.status).toBe(200);
    const staged = (await stagedResponse.json()) as {
      results: { seq: number; payload: EvidencePayload }[];
      nextSeq: number;
    };
    expect(staged).toMatchObject({ nextSeq: 1 });
    expect(staged.results[0]).toMatchObject({
      seq: 1,
      payload: { kind: "eval", source: "engine_validated" },
    });
    const caughtUp = await request(
      handler,
      "GET",
      "/runs/apply-run/evidence?sinceSeq=1",
      undefined,
      "",
    );
    expect(await caughtUp.json()).toEqual({ results: [], nextSeq: 1 });

    const forbidden = await request(
      handler,
      "POST",
      "/runs/apply-run/evidence",
      { resultSeq: 1, at },
      "not-the-writer",
    );
    expect(forbidden.status).toBe(409);
    expect(await forbidden.json()).toMatchObject({
      error: { code: "NOT_ACTIVE_WRITER" },
    });

    const applied = await request(handler, "POST", "/runs/apply-run/evidence", {
      resultSeq: 1,
      at,
    });
    expect(applied.status).toBe(200);
    const saved = storage.read("apply-run")!.run;
    expect(saved.events.at(-1)?.type).toBe("evidence.attached");
    expect(saved.nodes[0]).toMatchObject({ objectiveState: "active" });
    expect(saved.nodes[0]!.evidenceRefs).toEqual(["engine:evidence-job-1"]);
    expect(queue.page("apply-run").results).toEqual([]);
  });

  it("keeps engine-validated and human-model-predicted evidence as separate typed events", async () => {
    const executor: EvidenceExecutor = {
      async execute(current) {
        return current.kind === "eval"
          ? payload("eval", "engine_validated")
          : payload("wdl", "human_model_predicted");
      },
    };
    const queue = new EvidenceJobQueue(executor, { maxConcurrency: 1 });
    const storage = new SQLiteRunStorage();
    stores.push(storage);
    const service = new RunService(storage, { evidenceQueue: queue });
    const run = await service.create(createInput("typed-run"), "writer-a");
    const nodeId = run.activeCursor.nodeId;
    service.enqueueEvidence("typed-run", { nodeId, kind: "eval", depth: 12 });
    service.enqueueEvidence("typed-run", { nodeId, kind: "wdl", depth: 12 });
    await queue.whenIdle();
    service.reveal("typed-run", "writer-a", at);
    const page = service.evidence("typed-run");
    expect(page.results.map((result) => result.payload.source)).toEqual([
      "engine_validated",
      "human_model_predicted",
    ]);
    expect(service.evidence("typed-run", 1).results.map((result) => result.seq)).toEqual([
      2,
    ]);

    for (const result of page.results) {
      service.applyEvidence("typed-run", "writer-a", result.seq, at);
    }
    const attached = storage
      .read("typed-run")!
      .run.events.filter((event) => event.type === "evidence.attached");
    expect(attached).toHaveLength(2);
    expect(attached.map((event) => event.data.payload.source)).toEqual([
      "engine_validated",
      "human_model_predicted",
    ]);
    expect(attached.map((event) => event.data.payload.kind)).toEqual(["eval", "wdl"]);
  });

  it("derives comparison evidence from durable events after staged results are consumed", async () => {
    const executor: EvidenceExecutor = {
      async execute(current) {
        return {
          kind: "eval",
          source: "engine_validated",
          values:
            current.id === "evidence-job-1"
              ? { centipawns: 27 }
              : { mateIn: -2 },
        };
      },
    };
    const queue = new EvidenceJobQueue(executor, { maxConcurrency: 1 });
    const storage = new SQLiteRunStorage();
    stores.push(storage);
    const service = new RunService(storage, { evidenceQueue: queue });
    const created = await service.create(createInput("durable-compare-run"), "writer-a");
    const rootNodeId = created.activeCursor.nodeId;

    const main = service.move("durable-compare-run", "writer-a", "e2e4", { at });
    await queue.whenIdle();
    service.reveal("durable-compare-run", "writer-a", at);
    const mainResultSeq = queue.page("durable-compare-run").results[0]!.seq;
    service.applyEvidence("durable-compare-run", "writer-a", mainResultSeq, at);

    service.rewind(
      "durable-compare-run",
      "writer-a",
      { nodeId: rootNodeId },
      at,
    );
    const alternative = service.move(
      "durable-compare-run",
      "writer-a",
      "d2d4",
      { at },
    );
    await queue.whenIdle();
    service.reveal("durable-compare-run", "writer-a", at);
    const alternativeResultSeq = queue.page("durable-compare-run").results[0]!.seq;
    service.applyEvidence(
      "durable-compare-run",
      "writer-a",
      alternativeResultSeq,
      at,
    );

    expect(queue.page("durable-compare-run").results).toEqual([]);
    const saved = storage.read("durable-compare-run")!.run;
    const result = compareBranches(saved, [saved.branches[0]!.id, saved.branches[1]!.id]);
    expect(result.evidence[saved.branches[0]!.id]).toEqual([
      expect.objectContaining({
        nodeId: main.run.activeCursor.nodeId,
        plyOffset: 1,
        score: { kind: "cp", value: 27 },
      }),
    ]);
    expect(result.evidence[saved.branches[1]!.id]).toEqual([
      expect.objectContaining({
        nodeId: alternative.run.activeCursor.nodeId,
        plyOffset: 1,
        score: { kind: "mate", movesTo: -2 },
      }),
    ]);
  });
});
