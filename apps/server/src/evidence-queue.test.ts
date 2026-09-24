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
import { FixtureTablebaseSource } from "./tablebase.js";

const INITIAL_FEN =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const at = "2026-08-12T18:00:00.000Z";
const JOB_REF = /^engine:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/u;

function createInput(id: string, fen = INITIAL_FEN) {
  return {
    id,
    session: {
      kind: "position" as const,
      start: { fen, side: "white" as const },
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

/** A kind-exact engine payload (the durable settlement parser is kind-specific). */
function payload(
  kind: EvidencePayload["kind"],
  source: EvidencePayload["source"] = "engine_validated",
): EvidencePayload {
  const values = kind === "wdl" ? { win: 610, draw: 300, loss: 90 }
    : kind === "bestline" ? { movesUci: ["e2e4"] }
      : { centipawns: 32 };
  return { kind, source, values };
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

async function request(
  handler: ReturnType<typeof createRestHandler>,
  method: string,
  path: string,
  body?: unknown,
  writerId = "writer-a",
  headers: Readonly<Record<string, string>> = {},
): Promise<Response> {
  return handler(
    new Request(`http://server.test${path}`, {
      method,
      headers: {
        ...(writerId === "" ? {} : { "x-writer-id": writerId }),
        ...(body === undefined ? {} : { "content-type": "application/json" }),
        ...headers,
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    }),
  );
}

describe("evidence job queue", () => {
  const stores: SQLiteRunStorage[] = [];
  afterEach(() => {
    for (const storage of stores.splice(0)) storage.close();
  });
  function storage(): SQLiteRunStorage {
    const created = new SQLiteRunStorage(":memory:", { onMigration: () => {} });
    stores.push(created);
    return created;
  }

  it("extracts typed eval, WDL, and best-line evidence from analysis Stockfish", async () => {
    const requests: { engineId: string; commands: readonly string[]; resetSearchState?: boolean; signal?: AbortSignal }[] = [];
    const executor = new StockfishEvidenceExecutor({
      async execute(engineId, request) {
        requests.push({
          engineId,
          commands: request.commands,
          ...(request.resetSearchState === undefined ? {} : { resetSearchState: request.resetSearchState }),
          ...(request.signal === undefined ? {} : { signal: request.signal }),
        });
        if (request.commands.some((command) => command.includes("4k3/8/8/8/8/8/8/4K3 b"))) {
          return ["info depth 15 score mate 3 pv e8e7", "bestmove e8e7"];
        }
        if (request.commands.includes("setoption name UCI_ShowWDL value true")) {
          return ["info depth 17 score cp 21 wdl 412 537 51 pv e2e4", "bestmove e2e4"];
        }
        if (request.commands.at(-1) === "go depth 19") {
          return ["info depth 19 score cp 34 pv e2e4 e7e5 g1f3", "bestmove e2e4"];
        }
        return ["info depth 15 score mate 3 pv e2e4 e7e5", "bestmove e2e4"];
      },
    }, "stockfish-analysis", 1);
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
        bestMoveUci: "e2e4",
        requestedMovetimeMs: 40,
        mateIn: 3,
        perspective: "white",
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
    expect(requests.every((request) => request.resetSearchState === true)).toBe(true);
    expect(requests.every((request) => request.commands.includes("setoption name MultiPV value 1"))).toBe(true);
    expect(requests.map((request) => request.commands.find((command) => command.startsWith("setoption name UCI_ShowWDL")))).toEqual([
      "setoption name UCI_ShowWDL value false",
      "setoption name UCI_ShowWDL value false",
      "setoption name UCI_ShowWDL value true",
      "setoption name UCI_ShowWDL value false",
    ]);
  });

  it("stages exact tablebase evidence without serving move verdicts", async () => {
    const fen = "4k3/8/8/8/8/8/7P/4K3 w - - 0 1";
    const tablebase = new FixtureTablebaseSource({
      [fen]: {
        category: "draw",
        dtz: 0,
        preciseDtz: 0,
        moves: [{ uci: "h2h3", san: "h3", category: "draw", dtz: 0, preciseDtz: 0 }],
      },
    });
    const queue = new EvidenceJobQueue({
      async execute() {
        throw new Error("engine executor must not run for tablebase evidence");
      },
    }, { tablebaseSource: tablebase });
    const store = storage();
    const service = new RunService(store, { evidenceQueue: queue });
    const run = await service.create(createInput("tablebase-run", fen), "writer-a");
    const root = run.nodes[0]!;
    store.admitInternalEvidence(run.id, [{
      origin: "run_enrichment",
      idempotencyKey: `run_enrichment@1:${root.id}`,
      request: { schema: "evidence_batch_request@1", runId: run.id, origin: "run_enrichment", jobs: [{ schema: "evidence_job_request@1", runId: run.id, nodeId: root.id, fen, kind: "tablebase", depth: null, movetime: null, multiPv: null, timeoutMs: null, objectiveRequest: null }] },
    }]);
    await queue.whenIdle();
    const [result] = queue.page("tablebase-run").results;
    expect(result?.evidenceRefs).toEqual([`tablebase:${result!.jobId}`]);
    expect(result?.payload).toEqual({
      kind: "tablebase",
      source: "tablebase_exact",
      values: {
        fen,
        pieceCount: 3,
        category: "draw",
        dtz: 0,
        preciseDtz: 0,
        sourceId: "tablebase-fixture",
      },
    });
    expect(Object.keys(result!.payload.values).sort()).toEqual([
      "category", "dtz", "fen", "pieceCount", "preciseDtz", "sourceId",
    ]);
  });

  it("adds tablebase evidence beside engine evidence without touching opponent selection", async () => {
    const startFen = "4k3/8/8/8/8/8/7P/4K3 w - - 0 1";
    const childFen = "4k3/8/8/8/8/7P/8/4K3 b - - 0 1";
    const tablebase = new FixtureTablebaseSource({
      [childFen]: { category: "draw", dtz: 0, preciseDtz: 0, moves: [] },
    });
    const queue = new EvidenceJobQueue({
      async execute() {
        return { kind: "eval", source: "engine_validated", values: { centipawns: 0 } };
      },
    }, { tablebaseSource: tablebase });
    const service = new RunService(storage(), { evidenceQueue: queue, tablebaseSource: tablebase });
    await service.create(createInput("tablebase-producer", startFen), "writer-a");
    service.move("tablebase-producer", "writer-a", "h2h3", { at });
    await queue.whenIdle();
    expect(queue.outstanding("tablebase-producer").map((entry) => entry.kind).sort())
      .toEqual(["eval", "tablebase"]);
  });

  it("admits one enrichment batch per node key: a replayed key re-derives and re-admits nothing", async () => {
    let executed = 0;
    const queue = new EvidenceJobQueue({ async execute() { executed += 1; return payload("eval"); } });
    const store = storage();
    const service = new RunService(store, { evidenceQueue: queue });
    await service.create(createInput("revisit-run"), "writer-a");
    const moved = service.move("revisit-run", "writer-a", "e2e4", { at }).run;
    await queue.whenIdle();
    const node = moved.nodes.find((candidate) => candidate.id === moved.activeCursor.nodeId)!;
    let derived = 0;
    const replayed = store.evidenceJobs.admitInternalIfAbsent({
      runId: moved.id,
      origin: "run_enrichment",
      idempotencyKey: `run_enrichment@1:${node.id}`,
      plan: () => { derived += 1; return undefined; },
    });
    expect(derived).toBe(0);
    expect(replayed).toMatchObject({ replayed: true, constructions: 0, jobs: [{ nodeId: node.id, kind: "eval", state: "settled_success" }] });
    await queue.whenIdle();
    expect(executed).toBe(1);
    expect(store.evidenceJobs.jobsForRun("revisit-run")).toHaveLength(1);
  });

  it("claims in admission order while respecting bounded concurrency", async () => {
    const gates = { eval: deferred<EvidencePayload>(), wdl: deferred<EvidencePayload>(), bestline: deferred<EvidencePayload>() };
    const starts: string[] = [];
    let active = 0;
    let maximumActive = 0;
    const executor: EvidenceExecutor = {
      async execute(current) {
        starts.push(current.kind);
        active += 1;
        maximumActive = Math.max(maximumActive, active);
        const result = await gates[current.kind as keyof typeof gates].promise;
        active -= 1;
        return result;
      },
    };
    const queue = new EvidenceJobQueue(executor, { maxConcurrency: 2 });
    const service = new RunService(storage(), { evidenceQueue: queue });
    const run = await service.create(createInput("run-a"), "writer-a");
    const nodeId = run.activeCursor.nodeId;
    service.enqueueEvidence("run-a", { nodeId, kind: "eval", depth: 12 });
    service.enqueueEvidence("run-a", { nodeId, kind: "wdl", depth: 12 });
    service.enqueueEvidence("run-a", { nodeId, kind: "bestline", depth: 12 });
    await Promise.resolve();
    expect(starts).toEqual(["eval", "wdl"]);
    expect(maximumActive).toBe(2);

    gates.wdl.resolve(payload("wdl"));
    for (let tick = 0; tick < 5; tick += 1) await Promise.resolve();
    expect(starts).toEqual(["eval", "wdl", "bestline"]);
    gates.eval.resolve(payload("eval"));
    gates.bestline.resolve(payload("bestline"));
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
    const store = storage();
    const service = new RunService(store, { evidenceQueue: queue });
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
    expect(store.evidenceJobs.jobsForRun("rewind-run").map((row) => row.state)).toEqual(["cancelled", "cancelled", "cancelled"]);
  });
});

describe("evidence staging and writer application", () => {
  const stores: SQLiteRunStorage[] = [];

  afterEach(() => {
    for (const storage of stores.splice(0)) storage.close();
  });

  it("accepts explicit eval and WDL analysis requests through REST under an idempotency key", async () => {
    const queue = new EvidenceJobQueue({
      async execute(current) {
        return payload(current.kind);
      },
    });
    const storage = new SQLiteRunStorage();
    stores.push(storage);
    const service = new RunService(storage, { evidenceQueue: queue });
    const handler = createRestHandler(service);
    const run = await service.create(createInput("analysis-kinds"), "writer-a");
    const keyless = await request(handler, "POST", "/runs/analysis-kinds/analysis", { nodeIds: [run.activeCursor.nodeId], kind: "eval", depth: 12 });
    expect(keyless.status).toBe(400);
    for (const [kind, key] of [["eval", "3f0b6a4e-2c1d-4e8f-9a7b-1c2d3e4f5a6b"], ["wdl", "4a1c7b5f-3d2e-4f9a-8b6c-2d3e4f5a6b7c"]] as const) {
      const response = await request(handler, "POST", "/runs/analysis-kinds/analysis", {
        nodeIds: [run.activeCursor.nodeId],
        kind,
        depth: 12,
      }, "writer-a", { "idempotency-key": key });
      expect(response.status).toBe(202);
      expect(await response.json()).toMatchObject({ batchId: expect.any(String), jobs: [{ nodeId: run.activeCursor.nodeId, kind }] });
    }
    await queue.whenIdle();
    expect(queue.page("analysis-kinds").results.map((result) => result.payload.kind)).toEqual(["eval", "wdl"]);
  });

  it("stages over GET, enforces the writer lease, then appends position evidence without inventing an objective", async () => {
    let upgraderCalls = 0;
    const executor: EvidenceExecutor = {
      async execute(current) {
        return payload(current.kind);
      },
    };
    const upgrader: ObjectiveEvidenceUpgrader = {
      async evaluate(objectiveRequest) {
        upgraderCalls += 1;
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
    const staged = (await stagedResponse.json()) as { results: { seq: number }[]; nextSeq: number };
    expect(staged).toMatchObject({ nextSeq: 1 });
    expect(staged.results[0]).toEqual({ seq: 1 });
    const caughtUp = await request(
      handler,
      "GET",
      "/runs/apply-run/evidence?sinceSeq=1",
      undefined,
      "",
    );
    expect(await caughtUp.json()).toEqual({ results: [], nextSeq: 1 });

    const ahead = await request(handler, "GET", "/runs/apply-run/evidence?sinceSeq=9", undefined, "");
    expect(await ahead.json()).toEqual({ results: [], nextSeq: 9 });

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
    expect(saved.nodes[0]!.evidenceRefs).toHaveLength(1);
    expect(saved.nodes[0]!.evidenceRefs[0]).toMatch(JOB_REF);
    expect(queue.page("apply-run").results).toEqual([]);
    // A position session has no objective request, so the upgrader is never consulted.
    expect(upgraderCalls).toBe(0);

    // Response-loss replay of the same result returns the stored application without appending.
    const replay = await request(handler, "POST", "/runs/apply-run/evidence", { resultSeq: 1, at });
    expect(replay.status).toBe(200);
    expect(storage.read("apply-run")!.run.events).toHaveLength(saved.events.length);
  });

  it("refuses a Stockfish-gateway payload that claims another evidence source", async () => {
    const executor: EvidenceExecutor = {
      async execute(current) {
        return current.kind === "eval"
          ? payload("eval", "engine_validated")
          : payload("wdl", "human_model_predicted");
      },
    };
    const queue = new EvidenceJobQueue(executor, { maxConcurrency: 1, retry: { maxAttempts: 1, retryDelayMs: 0 } });
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
    expect(page.results.map((result) => result.payload.source)).toEqual(["engine_validated"]);
    expect(queue.failures("typed-run")).toEqual([expect.objectContaining({ kind: "wdl", message: expect.stringContaining("engine_validated") })]);
    const rows = storage.evidenceJobs.jobsForRun("typed-run");
    expect(rows.map((row) => row.state)).toEqual(["settled_success", "settled_unavailable"]);

    for (const result of page.results) {
      service.applyEvidence("typed-run", "writer-a", result.seq, at);
    }
    const attached = storage
      .read("typed-run")!
      .run.events.filter((event) => event.type === "evidence.attached");
    expect(attached.map((event) => [event.data.payload.kind, event.data.payload.source])).toEqual([["eval", "engine_validated"]]);
  });

  it("derives comparison evidence from durable events after staged results are consumed", async () => {
    let executed = 0;
    const executor: EvidenceExecutor = {
      async execute() {
        executed += 1;
        return {
          kind: "eval",
          source: "engine_validated",
          values: executed === 1 ? { centipawns: 27 } : { mateIn: -2 },
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
