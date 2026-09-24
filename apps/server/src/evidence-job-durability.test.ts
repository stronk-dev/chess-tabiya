// rfc/evidence-job-durability.md — the acceptance population: criteria 22–30 and every inherited
// defect named in the RFC's Status line gets an executable control here (the §1 census, criteria
// 20–21, lives in capability-operations.test.ts).
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Worker } from "node:worker_threads";

import {
  appendOpponentPly,
  attachEvidence,
  commitMove,
  createRun,
  rewind,
  type DrillRun,
  type EvidencePayload,
  type OpponentSelection,
} from "@chess-tabiya/runtime";
import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import { buildSync } from "esbuild";
import { afterEach, describe, expect, it } from "vitest";

import { EvidenceJobStore, type EvidenceJobLease } from "./evidence-job-store.js";
import {
  EVIDENCE_JOB_COLUMNS,
  EvidenceJobCorrupt,
  evidenceBatchRequestDigest,
  evidenceJobRequestDigest,
  parseEvidenceBatchRequest,
  parseEvidenceJobRequest,
  parseEvidenceJobRow,
  parseSettlement,
} from "./evidence-jobs.js";
import { EvidenceJobQueue, type EvidenceExecutor } from "./evidence-queue.js";
import { applyRecordedEngineGuard } from "./guard.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage, type LeaseHolder } from "./storage.js";

const START = "2026-09-24T10:00:00.000Z";
const INITIAL_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const LEASE: LeaseHolder = Object.freeze({ writerId: "writer-a", learnerId: "learner-a" });
const PRINCIPAL = Object.freeze({ learnerId: "learner-a", handle: "learner_a" });
const INSTANCE = "stockfish-test";
const POLICY = { maxAttempts: 2, retryDelayMs: 1_000 } as const;
const policyConfig = { seedMode: "fixed" as const, locus: { executedAt: "server" as const, engineIds: [], modelIds: [] } };

const directories: string[] = [];
const opened: { close(): void }[] = [];
afterEach(() => {
  for (const handle of opened.splice(0).reverse()) {
    try { handle.close(); } catch { /* already closed */ }
  }
  for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

class Clock {
  #millis = Date.parse(START);
  readonly now = (): string => new Date(this.#millis).toISOString();
  advance(ms: number): void { this.#millis += ms; }
}

function databasePath(): string {
  const directory = mkdtempSync(join(tmpdir(), "tabiya-evidence-jobs-"));
  directories.push(directory);
  return join(directory, "app.sqlite");
}

function openStorage(path: string, clock?: Clock): SQLiteRunStorage {
  const storage = new SQLiteRunStorage(path, { onMigration: () => {}, ...(clock === undefined ? {} : { evidenceNow: clock.now }) });
  opened.push(storage);
  return storage;
}

function raw(path: string): DatabaseSync {
  const database = new DatabaseSync(path);
  database.exec("PRAGMA busy_timeout = 5000");
  opened.push(database);
  return database;
}

/** A position run with one learner move (root → child), stored under the legacy writer lease. */
function seedRun(storage: SQLiteRunStorage, id = "durable-run"): { readonly run: DrillRun; readonly rootId: string; readonly childId: string } {
  const created = createRun({
    id,
    session: { kind: "position", start: { fen: INITIAL_FEN, side: "white" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } },
    sessionDigest: `sha256:${"c".repeat(64)}`,
    policyConfig,
    seed: 7,
    createdAt: START,
  });
  if (storage.learnerById("learner-a") === undefined) storage.createLearner({ id: "learner-a", handle: "learner_a", passwordHash: "!", createdAt: START });
  storage.create(created, LEASE);
  const moved = commitMove(created, "e2e4", { at: START }).run;
  storage.save(moved, LEASE);
  return { run: moved, rootId: created.activeCursor.nodeId, childId: moved.activeCursor.nodeId };
}

function node(run: DrillRun, nodeId: string) {
  return run.nodes.find((candidate) => candidate.id === nodeId)!;
}

function jobRequest(run: DrillRun, nodeId: string, kind: "eval" | "wdl" | "bestline" | "tablebase" = "eval", depth: number | null = 12) {
  return {
    schema: "evidence_job_request@1",
    runId: run.id,
    nodeId,
    fen: node(run, nodeId).fen,
    kind,
    depth: kind === "tablebase" ? null : depth,
    movetime: null,
    multiPv: null,
    timeoutMs: null,
    objectiveRequest: null,
  };
}

function batchRequest(run: DrillRun, origin: "explicit_analysis" | "story_completion" | "run_enrichment", jobs: readonly unknown[]) {
  return { schema: "evidence_batch_request@1", runId: run.id, origin, jobs };
}

function evalPayload(centipawns = 20, depth = 12): EvidencePayload {
  return { kind: "eval", source: "engine_validated", values: { engineId: INSTANCE, requestedDepth: depth, centipawns } };
}

/** Claim the next row and settle it successfully through the store's provider interval. */
function claimAndSucceed(store: EvidenceJobStore, payload: EvidencePayload = evalPayload()): { readonly lease: EvidenceJobLease; readonly seq: number | undefined } {
  const lease = store.claimNext("worker", 60_000)!;
  const request = store.beginProviderRequest(lease)!;
  const delivery = store.completeProviderRequest(request, payload, INSTANCE);
  return { lease, seq: store.settleSuccess(delivery, null) };
}

function jobColumns(database: DatabaseSync, runId: string): readonly Record<string, unknown>[] {
  return database.prepare(`SELECT ${EVIDENCE_JOB_COLUMNS.join(",")} FROM evidence_jobs WHERE run_id=? ORDER BY rowid`).all(runId) as Record<string, unknown>[];
}

function count(database: DatabaseSync, table: string): number {
  return Number((database.prepare(`SELECT count(*) AS n FROM ${table}`).get() as { n: number }).n);
}

const noGuard = (run: DrillRun) => ({ run, emitted: [] as never[] });

// -----------------------------------------------------------------------------------------------
describe("criterion 22 — admission survives asynchronous settlement and restart ([[D2520]], [[D2527]])", () => {
  it("commits one batch plus every admitted job before replying and replays the stored ids", () => {
    const path = databasePath();
    const storage = openStorage(path);
    const { run, rootId, childId } = seedRun(storage);
    const request = batchRequest(run, "explicit_analysis", [jobRequest(run, rootId), jobRequest(run, childId, "wdl")]);
    const first = storage.admitEvidenceBatch({ idempotencyKey: "0f5b1d2e-7c1a-4d3b-9e8f-1a2b3c4d5e6f", request });
    expect(first).toMatchObject({ replayed: false, constructions: 3, jobs: [{ state: "admitted" }, { state: "admitted" }] });
    const database = raw(path);
    expect(count(database, "evidence_job_batches")).toBe(1);
    expect(jobColumns(database, run.id).map((row) => [row.batch_ordinal, row.state, row.consumer_id])).toEqual([[0, "admitted", "runtime.analysis"], [1, "admitted", "runtime.analysis"]]);
    // Response loss: the equal key/digest returns the stored batch without constructing anything.
    const replay = storage.admitEvidenceBatch({ idempotencyKey: "0f5b1d2e-7c1a-4d3b-9e8f-1a2b3c4d5e6f", request });
    expect(replay).toMatchObject({ batchId: first.batchId, replayed: true, constructions: 0 });
    expect(replay.jobs.map((job) => job.id)).toEqual(first.jobs.map((job) => job.id));
    // A crossed digest under the same key refuses and writes nothing.
    expect(() => storage.admitEvidenceBatch({ idempotencyKey: "0f5b1d2e-7c1a-4d3b-9e8f-1a2b3c4d5e6f", request: batchRequest(run, "explicit_analysis", [jobRequest(run, rootId, "bestline")]) }))
      .toThrow(expect.objectContaining({ code: "IDEMPOTENCY_CONFLICT" }));
    expect(count(database, "evidence_jobs")).toBe(2);
  });

  it("leaves zero rows when admission faults at any ordinal", () => {
    const path = databasePath();
    const storage = openStorage(path);
    const { run, rootId, childId } = seedRun(storage);
    const database = raw(path);
    for (let ordinal = 0; ordinal < 3; ordinal += 1) {
      database.exec(`CREATE TRIGGER fault_${ordinal} BEFORE INSERT ON evidence_jobs WHEN NEW.batch_ordinal = ${ordinal} BEGIN SELECT RAISE(ABORT, 'injected'); END`);
      expect(() => storage.admitEvidenceBatch({ idempotencyKey: `fault-${ordinal}`, request: batchRequest(run, "explicit_analysis", [jobRequest(run, rootId), jobRequest(run, childId), jobRequest(run, rootId, "wdl")]) })).toThrow();
      database.exec(`DROP TRIGGER fault_${ordinal}`);
      expect([count(database, "evidence_job_batches"), count(database, "evidence_jobs")]).toEqual([0, 0]);
    }
    // A validation refusal at the last ordinal (unknown node) also leaves nothing.
    expect(() => storage.admitEvidenceBatch({ idempotencyKey: "unknown-node", request: batchRequest(run, "explicit_analysis", [jobRequest(run, rootId), { ...jobRequest(run, rootId), nodeId: "missing" }]) }))
      .toThrow(expect.objectContaining({ code: "INVALID_REQUEST" }));
    expect(count(database, "evidence_job_batches")).toBe(0);
  });

  it("refuses before admission without a configured provider and settles unavailable after 202, durably across reopen", async () => {
    const path = databasePath();
    const storage = openStorage(path);
    const { run, rootId } = seedRun(storage);
    const unconfigured = new RunService(storage);
    expect(() => unconfigured.enqueueEvidence(run.id, PRINCIPAL, { nodeId: rootId, kind: "eval", depth: 12 })).toThrow(expect.objectContaining({ code: "EVIDENCE_UNAVAILABLE" }));
    expect(count(raw(path), "evidence_jobs")).toBe(0);

    let calls = 0;
    const dead: EvidenceExecutor = { instanceId: INSTANCE, async execute() { calls += 1; throw new Error("engine process exited"); } };
    const queue = new EvidenceJobQueue(dead, { retry: { maxAttempts: 2, retryDelayMs: 1 } });
    const service = new RunService(storage, { evidenceQueue: queue });
    const batch = service.enqueueEvidence(run.id, PRINCIPAL, { nodeId: rootId, kind: "eval", depth: 12 });
    await queue.whenIdle();
    await queue.close();
    storage.close();
    const reopened = openStorage(path);
    const row = reopened.evidenceJobs.job(batch.jobs[0]!.id)!;
    expect(calls).toBe(2);
    expect(row.state).toBe("settled_unavailable");
    if (row.state !== "settled_unavailable") throw new Error("unreachable");
    expect(row.settlement).toMatchObject({ kind: "unavailable", availability: { state: "unavailable", operation: "evidence.stockfish_analysis", instances: [INSTANCE] }, failure: { kind: "source_failure", reason: "provider_unavailable", providerDetail: "engine process exited" } });
  });
});

// -----------------------------------------------------------------------------------------------
describe("criterion 23 — the durable settled value is complete ([[D2524]], [[D2525]])", () => {
  it("persists payload, acquisition and an explicit null or real objective proposal; reopen applies them with zero upgrader calls", async () => {
    const path = databasePath();
    const storage = openStorage(path);
    const { run, childId } = seedRun(storage);
    const child = node(run, childId);
    let upgraderCalls = 0;
    const queue = new EvidenceJobQueue({ instanceId: INSTANCE, async execute(job) { return evalPayload(40, job.depth ?? 12); } }, {
      objectiveUpgrader: { async evaluate(request) { upgraderCalls += 1; return { nodeId: request.nodeId, from: request.objectiveState, to: "preserved", evidenceRefs: [request.evidenceRefs.at(-1)!] }; } },
    });
    const service = new RunService(storage, { evidenceQueue: queue });
    const objectiveRequest = { runId: run.id, packId: "fixture-pack", packDigest: `sha256:${"d".repeat(64)}`, nodeId: childId, fen: child.fen, objectiveState: child.objectiveState, evidenceRefs: [], policyConfig };
    storage.admitInternalEvidence(run.id, [{ origin: "run_enrichment", idempotencyKey: `run_enrichment@1:${childId}`, request: batchRequest(run, "run_enrichment", [{ ...jobRequest(run, childId), objectiveRequest }, jobRequest(run, childId, "wdl")]) }]);
    await queue.whenIdle();
    await queue.close();
    expect(upgraderCalls).toBe(1);
    void service;
    storage.close();

    const reopened = openStorage(path);
    const rows = reopened.evidenceJobs.jobsForRun(run.id);
    // The executor answered the wdl job with an eval payload: refused, retried, then Story/enrichment's
    // honest-empty terminal effect — never evidence.
    expect(rows.map((row) => row.state)).toEqual(["settled_success", "settled_empty"]);
    const [withProposal, wdl] = rows;
    if (withProposal?.state !== "settled_success") throw new Error("expected a staged success");
    expect(withProposal.settlement.objectiveProposal).toMatchObject({ nodeId: childId, from: "active", to: "preserved" });
    expect(withProposal.settlement.acquisition).toMatchObject({ schema: "evidence_acquisition@1", instance: INSTANCE, leaseGeneration: 1 });
    expect(wdl?.state === "settled_empty" && wdl.settlement).toMatchObject({ kind: "empty", reason: "provider_unavailable", failure: { reason: "invalid_response" } });
    const applied = reopened.applyEvidenceAndConsumeJob(run.id, LEASE, { resultSeq: withProposal.resultSeq, at: START, guard: noGuard });
    expect(applied.emitted.map((event) => event.type)).toEqual(["evidence.attached", "objective.state_changed"]);
    expect(upgraderCalls).toBe(1);
  });

  it("carries a lawful failure-free unavailability through retry and terminal settlement without a synthetic failure", () => {
    const path = databasePath();
    const clock = new Clock();
    const storage = openStorage(path, clock);
    const { run, rootId } = seedRun(storage);
    storage.admitEvidenceBatch({ idempotencyKey: "no-failure", request: batchRequest(run, "explicit_analysis", [jobRequest(run, rootId)]) });
    const store = storage.evidenceJobs;
    const first = store.claimNext("worker", 60_000)!;
    expect(store.settleProviderUnavailable(first, undefined, POLICY, INSTANCE)).toBe("retry_wait");
    const waiting = store.job(first.jobId)!;
    expect(waiting.state === "retry_wait" && waiting.retryBasis).toEqual({ kind: "provider_unavailable", availability: { state: "unavailable", operation: "evidence.stockfish_analysis", instances: [INSTANCE], observedAt: START } });
    clock.advance(1_000);
    const second = store.claimNext("worker", 60_000)!;
    expect(store.settleProviderUnavailable(second, undefined, POLICY, INSTANCE)).toBe("settled_unavailable");
    const settled = store.job(first.jobId)!;
    expect(settled.state === "settled_unavailable" && "failure" in settled.settlement).toBe(false);
  });

  it("refuses crossed result kinds, missing proposal absence, invented failures and unavailable without availability", () => {
    const request = parseEvidenceJobRequest({ schema: "evidence_job_request@1", runId: "r", nodeId: "n", fen: INITIAL_FEN, kind: "eval", depth: 12, movetime: null, multiPv: null, timeoutMs: null, objectiveRequest: null });
    const subject = { jobId: "j", operation: "evidence.stockfish_analysis" as const, jobRequestDigest: evidenceJobRequestDigest(request) };
    const availability = { state: "unavailable", operation: "evidence.stockfish_analysis", instances: [INSTANCE], observedAt: START };
    const acquisition = { schema: "evidence_acquisition@1", operation: "evidence.stockfish_analysis", instance: INSTANCE, jobId: "j", leaseGeneration: 1, jobRequestDigest: subject.jobRequestDigest, requestedAt: START, retrievedAt: START, responseDigest: "0".repeat(64) };
    const cases: readonly [string, unknown, Parameters<typeof parseSettlement>[1]][] = [
      ["empty arm under settled_success", { kind: "empty", reason: "not_applicable" }, "settled_success"],
      ["missing objectiveProposal", { kind: "success", payload: evalPayload(), acquisition }, "settled_success"],
      ["legacy provider field instead of acquisition ([[D3002]])", { kind: "success", payload: evalPayload(), objectiveProposal: null, provider: acquisition }, "settled_success"],
      ["unavailable without availability", { kind: "unavailable" }, "settled_unavailable"],
      ["invented reason on the unavailable arm ([[D2805]])", { kind: "unavailable", reason: "provider_unavailable", availability }, "settled_unavailable"],
      ["failure for another request ([[D3003]])", { kind: "unavailable", availability, failure: { kind: "source_failure", operation: "evidence.stockfish_analysis", jobRequestDigest: "other", failedAt: START, reason: "provider_unavailable" } }, "settled_unavailable"],
    ];
    for (const [label, value, state] of cases) {
      expect(() => parseSettlement(value, state, "explicit_analysis", request, subject), label).toThrow(EvidenceJobCorrupt);
    }
  });
});

// -----------------------------------------------------------------------------------------------
function raceWorkerUrl(): URL {
  const directory = mkdtempSync(join(tmpdir(), "tabiya-evidence-race-"));
  directories.push(directory);
  const outfile = join(directory, "race.mjs");
  const source = resolve(dirname(fileURLToPath(import.meta.url)), "evidence-admission-race.test-support.ts");
  buildSync({ entryPoints: [source], bundle: true, platform: "node", format: "esm", external: ["typescript"], outfile, logLevel: "silent" });
  return pathToFileURL(outfile);
}

function race(url: URL, path: string, input: { readonly idempotencyKey: string; readonly request: unknown }): Promise<readonly Record<string, unknown>[]> {
  const barrier = new SharedArrayBuffer(8);
  const flag = new Int32Array(barrier);
  const results = [0, 1].map(() => new Promise<Record<string, unknown>>((done, fail) => {
    const worker = new Worker(url, { workerData: { path, barrier, input } });
    worker.once("message", (message: Record<string, unknown>) => { done(message); void worker.terminate(); });
    worker.once("error", fail);
  }));
  const release = (): void => {
    if (Atomics.load(flag, 1) < 2) { setTimeout(release, 5); return; }
    Atomics.store(flag, 0, 1);
    Atomics.notify(flag, 0);
  };
  release();
  return Promise.all(results);
}

describe("criterion 24 — one restart-stable replay identity per origin ([[D2528]], [[D2545]], [[D2569]], [[D2591]])", () => {
  it("releases two connections from one barrier: one winner, one stored population, origin-derived consumers", async () => {
    const path = databasePath();
    const setup = openStorage(path);
    const { run, rootId, childId } = seedRun(setup);
    setup.close();
    const url = raceWorkerUrl();
    const expected = { explicit_analysis: "runtime.analysis", story_completion: "review.story_evidence", run_enrichment: "runtime.background_evidence" } as const;
    for (const origin of ["explicit_analysis", "story_completion", "run_enrichment"] as const) {
      const input = { idempotencyKey: `race-${origin}`, request: batchRequest(run, origin, [jobRequest(run, rootId), jobRequest(run, childId)]) };
      const [left, right] = await race(url, path, input);
      expect(left).toMatchObject({ ok: true });
      expect(right).toMatchObject({ ok: true });
      expect(left!.batchId).toBe(right!.batchId);
      expect(left!.jobIds).toEqual(right!.jobIds);
      expect([left!.constructions, right!.constructions].sort()).toEqual([0, 3]);
      const database = raw(path);
      const rows = database.prepare("SELECT consumer_id FROM evidence_jobs WHERE batch_id=?").all(left!.batchId as string) as { consumer_id: string }[];
      expect(rows.map((row) => row.consumer_id)).toEqual([expected[origin], expected[origin]]);
      expect(Number((database.prepare("SELECT count(*) AS n FROM evidence_job_batches WHERE origin=?").get(origin) as { n: number }).n)).toBe(1);
    }
  }, 30_000);

  it("uses separate canonical digest domains, persisted UUIDs and refuses an internal plan bumped under the same key", () => {
    const path = databasePath();
    const storage = openStorage(path);
    const { run, rootId } = seedRun(storage);
    const job = parseEvidenceJobRequest(jobRequest(run, rootId));
    const batch = parseEvidenceBatchRequest(batchRequest(run, "story_completion", [jobRequest(run, rootId)]));
    expect(evidenceJobRequestDigest(job)).toMatch(/^[0-9a-f]{64}$/u);
    expect(evidenceJobRequestDigest(job)).not.toBe(evidenceBatchRequestDigest(batch));
    // Hashing an arbitrary JSON-shaped object is not an overload ([[D2565]]).
    expect(() => evidenceJobRequestDigest({ ...job } as typeof job)).toThrow(/exact v1 parser/u);
    const admitted = storage.admitEvidenceBatch({ idempotencyKey: "story-key", request: batchRequest(run, "story_completion", [jobRequest(run, rootId)]) });
    expect(admitted.batchId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u);
    expect(() => storage.admitEvidenceBatch({ idempotencyKey: "story-key", request: batchRequest(run, "story_completion", [jobRequest(run, rootId, "eval", 14)]) }))
      .toThrow(expect.objectContaining({ code: "IDEMPOTENCY_CONFLICT" }));
  });

  it("parses the exact request images: extra keys, wrong literals, crossed objective identity and 17 jobs fail ([[D2565]], [[D2588]])", () => {
    const base = { schema: "evidence_job_request@1", runId: "r", nodeId: "n", fen: INITIAL_FEN, kind: "eval", depth: 12, movetime: null, multiPv: null, timeoutMs: null, objectiveRequest: null };
    const objective = { runId: "r", packId: "p", packDigest: "d", nodeId: "n", fen: INITIAL_FEN, objectiveState: "active", evidenceRefs: [], policyConfig };
    for (const bad of [
      { ...base, extra: 1 },
      { ...base, schema: "evidence_job_request@2" },
      { ...base, depth: null },
      { ...base, kind: "tablebase" },
      { ...base, objectiveRequest: { ...objective, nodeId: "other" } },
      { ...base, objectiveRequest: { ...objective, extra: true } },
      { ...base, objectiveRequest: { ...objective, objectiveState: "won" } },
    ]) expect(() => parseEvidenceJobRequest(bad)).toThrow(EvidenceJobCorrupt);
    expect(() => parseEvidenceBatchRequest({ schema: "evidence_batch_request@1", runId: "r", origin: "explicit_analysis", jobs: Array.from({ length: 17 }, () => base) })).toThrow(EvidenceJobCorrupt);
    const nested = { ...base, objectiveRequest: { ...objective, evidenceRefs: ["engine:prior"] } };
    const parsed = parseEvidenceJobRequest(nested);
    const before = evidenceJobRequestDigest(parsed);
    nested.objectiveRequest.evidenceRefs.push("engine:mutated");
    expect(evidenceJobRequestDigest(parsed)).toBe(before);
    expect(Object.isFrozen(parsed.objectiveRequest!.evidenceRefs)).toBe(true);
  });
});

// -----------------------------------------------------------------------------------------------
describe("criterion 25 — run mutation and automatic enrichment are one commit ([[D2526]])", () => {
  it("a fault on either side leaves the old run and zero jobs; a commit exposes both after reopen", async () => {
    const path = databasePath();
    const storage = openStorage(path);
    const queue = new EvidenceJobQueue({ instanceId: INSTANCE, async execute() { return evalPayload(); } });
    const service = new RunService(storage, { evidenceQueue: queue });
    const { run } = seedRun(storage, "enrichment-run");
    const database = raw(path);
    database.exec("CREATE TRIGGER enrichment_fault BEFORE INSERT ON evidence_jobs BEGIN SELECT RAISE(ABORT, 'injected'); END");
    expect(() => service.move(run.id, PRINCIPAL, "writer-a", "e7e5", { at: START })).toThrow();
    expect(storage.read(run.id)!.run.events).toHaveLength(run.events.length);
    expect(JSON.parse((database.prepare("SELECT snapshot_json FROM drill_runs WHERE id=?").get(run.id) as { snapshot_json: string }).snapshot_json).events).toHaveLength(run.events.length);
    expect(count(database, "evidence_jobs")).toBe(0);
    database.exec("DROP TRIGGER enrichment_fault");
    const moved = service.move(run.id, PRINCIPAL, "writer-a", "e7e5", { at: START });
    await queue.whenIdle();
    await queue.close();
    storage.close();
    const reopened = openStorage(path);
    expect(reopened.read(run.id)!.run.events).toHaveLength(moved.run.events.length);
    expect(reopened.evidenceJobs.jobsForRun(run.id).map((row) => [row.origin, row.nodeId])).toEqual([["run_enrichment", moved.run.activeCursor.nodeId]]);
  });
});

// -----------------------------------------------------------------------------------------------
describe("criterion 26 — rewind and cancellation are one commit ([[D2529]], [[D2546]], [[D2567]], [[D2592]])", () => {
  function eightStates(path: string) {
    const clock = new Clock();
    const storage = openStorage(path, clock);
    const { run, rootId, childId } = seedRun(storage);
    const store = storage.evidenceJobs;
    // One explicit batch of eight jobs on the pruned child, driven through all eight states.
    const kinds = ["eval", "wdl", "bestline", "eval", "wdl", "bestline", "eval", "wdl"] as const;
    storage.admitEvidenceBatch({ idempotencyKey: "eight", request: batchRequest(run, "explicit_analysis", kinds.map((kind, index) => jobRequest(run, childId, kind, 10 + index))) });
    const ids = store.jobsForRun(run.id).map((row) => row.id);
    const payloadFor = (index: number): EvidencePayload => {
      const values = { engineId: INSTANCE, requestedDepth: 10 + index };
      return kinds[index] === "wdl" ? { kind: "wdl", source: "engine_validated", values: { ...values, win: 1, draw: 2, loss: 3 } }
        : kinds[index] === "bestline" ? { kind: "bestline", source: "engine_validated", values: { ...values, movesUci: ["e7e5"] } }
          : { kind: "eval", source: "engine_validated", values: { ...values, centipawns: 5 } };
    };
    const claim = () => store.claimNext("worker", 600_000)!;
    // 0 running, 1 retry_wait, 2 settled_success, 3 settled_empty, 4 settled_unavailable, 5 cancelled, 6 consumed, 7 admitted
    const running = claim();
    store.settleProviderUnavailable(claim(), undefined, { maxAttempts: 5, retryDelayMs: 3_600_000 }, INSTANCE);
    const success = claim();
    store.settleSuccess(store.completeProviderRequest(store.beginProviderRequest(success)!, payloadFor(2), INSTANCE), null);
    store.settleEmpty(claim(), "not_applicable");
    store.settleProviderUnavailable(claim(), undefined, { maxAttempts: 1, retryDelayMs: 0 }, INSTANCE);
    expect(store.cancel(ids[5]!)).toBe(true);
    const consumed = claim();
    expect(consumed.jobId).toBe(ids[6]);
    const seq = store.settleSuccess(store.completeProviderRequest(store.beginProviderRequest(consumed)!, payloadFor(6), INSTANCE), null)!;
    storage.applyEvidenceAndConsumeJob(run.id, LEASE, { resultSeq: seq, at: START, guard: noGuard });
    expect(store.jobsForRun(run.id).map((row) => row.state)).toEqual(["running", "retry_wait", "settled_success", "settled_empty", "settled_unavailable", "cancelled", "consumed", "admitted"]);
    return { storage, store, clock, run: storage.read(run.id)!.run, rootId, childId, ids, running, success, payloadFor };
  }

  it("cancels admitted/running/retry-wait/staged rows exactly and retains every terminal audit row byte-identically", () => {
    const path = databasePath();
    const { storage, run, rootId, childId } = eightStates(path);
    const database = raw(path);
    const before = jobColumns(database, run.id);
    const rewound = rewind(run, rootId, START).run;
    storage.commitRewindWithEvidenceCancellation(rewound, LEASE, [childId]);
    const after = jobColumns(database, run.id);
    const cancelledSettlement = JSON.stringify({ kind: "cancelled", reason: "superseded" });
    for (const [index, row] of before.entries()) {
      const next = after[index]!;
      if (["admitted", "running", "retry_wait", "settled_success"].includes(String(row.state))) {
        expect(next).toEqual({
          ...row,
          state: "cancelled",
          lease_owner: null,
          lease_expires_at: null,
          lease_generation: Number(row.lease_generation) + (row.state === "running" ? 1 : 0),
          next_attempt_at: null,
          retry_basis_json: null,
          settled_at: START,
          result_seq: null,
          settlement_json: cancelledSettlement,
          consumed_at: null,
          application_receipt_json: null,
        });
      } else {
        expect(next).toEqual(row);
      }
    }
    expect(storage.read(run.id)!.run.events.at(-1)?.type).toBe("run.rewound");
  });

  it("leaves the old run and every old job unchanged on a lease conflict or storage fault; a late result cannot settle", () => {
    const path = databasePath();
    const { storage, store, run, rootId, childId, running, success, payloadFor } = eightStates(path);
    const database = raw(path);
    const before = jobColumns(database, run.id);
    const rewound = rewind(run, rootId, START).run;
    expect(() => storage.commitRewindWithEvidenceCancellation(rewound, { writerId: "intruder", learnerId: "learner-a" }, [childId])).toThrow(/does not hold the run lease/u);
    expect(jobColumns(database, run.id)).toEqual(before);
    database.exec("CREATE TRIGGER cancel_fault BEFORE UPDATE ON evidence_jobs WHEN NEW.state='cancelled' BEGIN SELECT RAISE(ABORT, 'injected'); END");
    expect(() => storage.commitRewindWithEvidenceCancellation(rewound, LEASE, [childId])).toThrow();
    expect(jobColumns(database, run.id)).toEqual(before);
    expect(storage.read(run.id)!.run.events).toHaveLength(run.events.length);
    database.exec("DROP TRIGGER cancel_fault");
    const late = store.beginProviderRequest(running)!;
    storage.commitRewindWithEvidenceCancellation(rewound, LEASE, [childId]);
    expect(store.settleSuccess(store.completeProviderRequest(late, payloadFor(0), INSTANCE), null)).toBeUndefined();
    expect(store.job(running.jobId)!.state).toBe("cancelled");
    expect(store.returnForShutdown(success)).toBe(false);
  });

  it("never reuses a result sequence across settle → rewind → reopen → settle", () => {
    const path = databasePath();
    const storage = openStorage(path);
    const { run, rootId, childId } = seedRun(storage);
    storage.admitEvidenceBatch({ idempotencyKey: "seq-1", request: batchRequest(run, "explicit_analysis", [jobRequest(run, childId)]) });
    expect(claimAndSucceed(storage.evidenceJobs).seq).toBe(1);
    storage.commitRewindWithEvidenceCancellation(rewind(run, rootId, START).run, LEASE, [childId]);
    storage.close();
    const reopened = openStorage(path);
    reopened.admitEvidenceBatch({ idempotencyKey: "seq-2", request: batchRequest(run, "explicit_analysis", [jobRequest(run, rootId)]) });
    expect(claimAndSucceed(reopened.evidenceJobs).seq).toBe(2);
    expect(reopened.evidenceJobs.page(run.id).nextSeq).toBe(2);
  });
});

// -----------------------------------------------------------------------------------------------
describe("criterion 27 — settlement and consumption remain exact ([[D2543]], [[D2587]], [[D2589]], [[D2673]]–[[D2676]])", () => {
  it("recovers expired leases on restart, returns shutdown work to retry_wait and fences stale receipts", async () => {
    const path = databasePath();
    const clock = new Clock();
    const storage = openStorage(path, clock);
    const { run, rootId, childId } = seedRun(storage);
    storage.admitEvidenceBatch({ idempotencyKey: "leases", request: batchRequest(run, "explicit_analysis", [jobRequest(run, rootId), jobRequest(run, childId)]) });
    const store = storage.evidenceJobs;
    const stale = store.claimNext("worker-1", 1_000)!;
    clock.advance(2_000);
    expect(store.recoverExpiredLeases()).toBe(1);
    const recovered = store.job(stale.jobId)!;
    expect(recovered.state === "retry_wait" && recovered.retryBasis).toEqual({ kind: "expired_lease" });
    const fresh = store.claimNext("worker-1", 60_000)!;
    expect(fresh.jobId).toBe(stale.jobId);
    expect(fresh.leaseGeneration).toBe(2);
    // The same owner string with the old generation can neither retry, settle nor cancel.
    expect(store.beginProviderRequest(stale)).toBeUndefined();
    expect(store.settleProviderUnavailable(stale, undefined, POLICY, INSTANCE)).toBeUndefined();
    expect(store.settleEmpty(stale, "not_applicable")).toBe(false);
    expect(store.returnForShutdown(stale)).toBe(false);
    expect(store.job(stale.jobId)!.state).toBe("running");

    // Shutdown of an in-flight worker is a retry, never a terminal cancellation.
    let release!: () => void;
    const hanging = new Promise<EvidencePayload>((resolveHang) => { release = () => resolveHang(evalPayload()); });
    const queue = new EvidenceJobQueue({ instanceId: INSTANCE, execute: () => hanging });
    new RunService(storage, { evidenceQueue: queue });
    await Promise.resolve();
    const inFlight = store.jobsForRun(run.id).find((row) => row.state === "running" && row.id !== stale.jobId)!;
    const closing = queue.close();
    release();
    await closing;
    const returned = store.job(inFlight.id)!;
    expect(returned.state === "retry_wait" && returned.retryBasis).toEqual({ kind: "shutdown" });
  });

  it("derives the complete guarded suffix inside the transaction and replays the stored receipt ([[D2587]])", () => {
    const path = databasePath();
    const storage = openStorage(path);
    const pack = { guard: {}, feedbackPolicy: "immediate_guard" } as unknown as DrillPackDefinition;
    const selection = (moveUci: string): OpponentSelection => ({ moveUci, policyModeApplied: "human_common", engine: { id: "mock", name: "Mock", version: "1", seedHonored: true } });
    let played = createRun({
      id: "guarded", session: { kind: "pack", packId: "guard-pack", packDigest: `sha256:${"a".repeat(64)}`, start: { fen: "4k3/8/8/8/8/8/7P/4K3 b - - 0 1", side: "white" }, feedbackPolicy: "immediate_guard", opponentPolicy: { mode: "human_common" } },
      sessionDigest: `sha256:${"b".repeat(64)}`, policyConfig, seed: 1, createdAt: START,
    });
    storage.createLearner({ id: "learner-a", handle: "learner_a", passwordHash: "!", createdAt: START });
    storage.create(played, LEASE);
    played = appendOpponentPly(played, selection("e8f7"), { at: START }).run;
    const previousId = played.activeCursor.nodeId;
    played = commitMove(played, "h2h3", { at: START }).run;
    played = appendOpponentPly(played, selection("f7g6"), { at: START }).run;
    const consequenceId = played.activeCursor.nodeId;
    played = attachEvidence(played, previousId, ["engine:before"], { kind: "eval", source: "engine_validated", values: { centipawns: 100 } }, START).run;
    storage.save(played, LEASE);
    storage.admitEvidenceBatch({ idempotencyKey: "guarded", request: batchRequest(played, "explicit_analysis", [jobRequest(played, consequenceId)]) });
    const { seq } = claimAndSucceed(storage.evidenceJobs, evalPayload(-150));
    let guardCalls = 0;
    const guard = (run: DrillRun, nodeId: string, refs: readonly string[], at: string) => { guardCalls += 1; return applyRecordedEngineGuard(pack, run, nodeId, refs, at); };
    const applied = storage.applyEvidenceAndConsumeJob(played.id, LEASE, { resultSeq: seq!, at: START, guard });
    expect(guardCalls).toBe(1);
    expect(applied.emitted.map((event) => event.type)).toEqual(["evidence.attached", "feedback.generated"]);
    expect(applied.receipt).toMatchObject({ fromRevision: 0, toRevision: 1, firstEventSeq: played.events.length + 1, lastEventSeq: played.events.length + 2 });
    storage.close();
    const reopened = openStorage(path);
    const replay = reopened.applyEvidenceAndConsumeJob(played.id, LEASE, { resultSeq: seq!, at: START, guard });
    expect(replay.replayed).toBe(true);
    expect(replay.receipt).toEqual(applied.receipt);
    expect(replay.emitted).toEqual(applied.emitted);
    expect(guardCalls).toBe(1);
    expect(reopened.read(played.id)!.run.events).toHaveLength(played.events.length + 2);
  });

  it("refuses an application whose stored node no longer matches the CAS-owned run ([[D2674]])", () => {
    const path = databasePath();
    const storage = openStorage(path);
    const { run, childId } = seedRun(storage);
    storage.admitEvidenceBatch({ idempotencyKey: "crossed-node", request: batchRequest(run, "explicit_analysis", [jobRequest(run, childId)]) });
    const { seq } = claimAndSucceed(storage.evidenceJobs);
    const database = raw(path);
    const snapshot = JSON.parse((database.prepare("SELECT snapshot_json FROM drill_runs WHERE id=?").get(run.id) as { snapshot_json: string }).snapshot_json) as DrillRun;
    const tampered = { ...snapshot, events: snapshot.events.slice(0, 1) };
    database.prepare("UPDATE drill_runs SET snapshot_json=? WHERE id=?").run(JSON.stringify(tampered), run.id);
    expect(() => storage.applyEvidenceAndConsumeJob(run.id, LEASE, { resultSeq: seq!, at: START, guard: noGuard })).toThrow(expect.objectContaining({ code: "EVIDENCE_JOB_CORRUPT" }));
    expect(storage.evidenceJobs.job(storage.evidenceJobs.jobsForRun(run.id)[0]!.id)!.state).toBe("settled_success");
  });
});

// -----------------------------------------------------------------------------------------------
describe("criteria 28–30 — one storage/provider/replay authority ([[D2742]]–[[D2747]], [[D2771]]–[[D2778]], [[D2802]]–[[D2808]], [[D3002]]–[[D3007]])", () => {
  function consumed(path: string) {
    const storage = openStorage(path);
    const { run, childId } = seedRun(storage);
    storage.admitEvidenceBatch({ idempotencyKey: "consumed", request: batchRequest(run, "explicit_analysis", [jobRequest(run, childId)]) });
    const { lease, seq } = claimAndSucceed(storage.evidenceJobs);
    const applied = storage.applyEvidenceAndConsumeJob(run.id, LEASE, { resultSeq: seq!, at: START, guard: noGuard });
    return { storage, run, jobId: lease.jobId, seq: seq!, applied };
  }

  it("binds leases, requests and deliveries to the issuing database even when ids and digests are equal ([[D2742]], [[D2778]])", () => {
    const left = openStorage(databasePath());
    const right = openStorage(databasePath());
    for (const storage of [left, right]) {
      const { run, rootId } = seedRun(storage);
      storage.admitEvidenceBatch({ idempotencyKey: "same", request: batchRequest(run, "explicit_analysis", [jobRequest(run, rootId)]) });
    }
    const leftLease = left.evidenceJobs.claimNext("worker", 60_000)!;
    right.evidenceJobs.claimNext("worker", 60_000);
    expect(() => right.evidenceJobs.beginProviderRequest(leftLease)).toThrow(/not issued by this evidence store/u);
    const delivery = left.evidenceJobs.completeProviderRequest(left.evidenceJobs.beginProviderRequest(leftLease)!, evalPayload(), INSTANCE);
    expect(() => right.evidenceJobs.settleSuccess(delivery, null)).toThrow(/not sealed by this evidence store/u);
    // A caller-shaped failure is not a sealed provider failure ([[D3003]]).
    const forged = { lease: leftLease, failure: { kind: "source_failure", operation: "evidence.stockfish_analysis", jobRequestDigest: leftLease.jobRequestDigest, failedAt: START, reason: "provider_unavailable" } } as never;
    expect(() => left.evidenceJobs.settleProviderUnavailable(leftLease, forged, POLICY, INSTANCE)).toThrow(/sealed/u);
  });

  it("joins every payload operand to the stored request and compiled provider before evidence exists ([[D2743]], [[D2773]], [[D2802]])", () => {
    const storage = openStorage(databasePath());
    const { run, rootId } = seedRun(storage);
    storage.admitEvidenceBatch({ idempotencyKey: "operands", request: batchRequest(run, "explicit_analysis", [jobRequest(run, rootId)]) });
    const store = storage.evidenceJobs;
    const lease = store.claimNext("worker", 60_000)!;
    const request = store.beginProviderRequest(lease)!;
    const tablebase = { kind: "tablebase", source: "tablebase_exact", values: { fen: INITIAL_FEN, pieceCount: 32, category: "draw", dtz: 0, preciseDtz: 0, sourceId: INSTANCE } };
    for (const [label, payload] of [
      ["crossed kind", tablebase],
      ["another engine", { ...evalPayload(), values: { ...evalPayload().values, engineId: "other-engine" } }],
      ["another depth", { ...evalPayload(), values: { ...evalPayload().values, requestedDepth: 30 } }],
      ["movetime arm", { ...evalPayload(), values: { engineId: INSTANCE, requestedMovetimeMs: 100, centipawns: 1 } }],
      ["invented values", { ...evalPayload(), values: { engineId: INSTANCE, requestedDepth: 12, centipawns: 1, verdict: "winning" } }],
      ["missing source", { kind: "eval", values: evalPayload().values }],
    ] as const) {
      expect(() => store.completeProviderRequest(request, payload, INSTANCE), label).toThrow(EvidenceJobCorrupt);
    }
    expect(store.job(lease.jobId)!.state).toBe("running");
  });

  it("refuses expired leases, provider intervals outside the lease and a changed expiry ([[D2772]], [[D2807]], [[D3006]], [[D3007]])", () => {
    const path = databasePath();
    const clock = new Clock();
    const storage = openStorage(path, clock);
    const { run, rootId, childId } = seedRun(storage);
    storage.admitEvidenceBatch({ idempotencyKey: "expiry", request: batchRequest(run, "explicit_analysis", [jobRequest(run, rootId), jobRequest(run, childId), jobRequest(run, rootId, "wdl")]) });
    const store = storage.evidenceJobs;
    const lease = store.claimNext("worker", 1_000)!;
    const request = store.beginProviderRequest(lease)!;
    clock.advance(1_500);
    expect(() => store.completeProviderRequest(request, evalPayload(), INSTANCE)).toThrow(/after the job lease expired/u);
    expect(store.beginProviderRequest(lease)).toBeUndefined();
    const second = store.claimNext("worker", 10_000)!;
    const secondRequest = store.beginProviderRequest(second)!;
    const delivery = store.completeProviderRequest(secondRequest, evalPayload(), INSTANCE);
    clock.advance(20_000);
    expect(store.settleSuccess(delivery, null)).toBeUndefined();
    // Moving the durable expiry into the past after load stops new provider work.
    const third = store.claimNext("worker", 60_000)!;
    raw(path).prepare("UPDATE evidence_jobs SET lease_expires_at=? WHERE id=?").run("2000-01-01T00:00:00.000Z", third.jobId);
    expect(store.beginProviderRequest(third)).toBeUndefined();
  });

  it("refuses crossed objective transitions and unauthorized evidence ([[D2774]])", () => {
    const storage = openStorage(databasePath());
    const { run, childId } = seedRun(storage);
    const child = node(run, childId);
    const objectiveRequest = { runId: run.id, packId: "p", packDigest: "d", nodeId: childId, fen: child.fen, objectiveState: "active", evidenceRefs: ["engine:prior"], policyConfig };
    storage.admitEvidenceBatch({ idempotencyKey: "objective", request: batchRequest(run, "explicit_analysis", [{ ...jobRequest(run, childId), objectiveRequest }]) });
    const store = storage.evidenceJobs;
    const lease = store.claimNext("worker", 60_000)!;
    const delivery = store.completeProviderRequest(store.beginProviderRequest(lease)!, evalPayload(), INSTANCE);
    const jobRef = `engine:${lease.jobId}`;
    for (const proposal of [
      { nodeId: childId, from: "failed", to: "achieved", evidenceRefs: [jobRef] },
      { nodeId: childId, from: "active", to: "preserved", evidenceRefs: [jobRef, "engine:attacker"] },
      { nodeId: childId, from: "active", to: "preserved", evidenceRefs: ["engine:prior"] },
      { nodeId: "other", from: "active", to: "preserved", evidenceRefs: [jobRef] },
    ] as const) {
      expect(() => store.settleSuccess(delivery, proposal as never)).toThrow(expect.objectContaining({ code: "EVIDENCE_JOB_CORRUPT" }));
    }
    expect(store.settleSuccess(delivery, { nodeId: childId, from: "active", to: "preserved", evidenceRefs: ["engine:prior", jobRef] })).toBe(1);
  });

  it("parses one exhaustive state union on every read: forbidden and missing columns, literal clocks and crossed routing fail ([[D2771]], [[D2775]], [[D2777]], [[D2806]], [[D3004]])", () => {
    const path = databasePath();
    const { storage, jobId } = consumed(path);
    const database = raw(path);
    const row = database.prepare(`SELECT ${EVIDENCE_JOB_COLUMNS.join(",")} FROM evidence_jobs WHERE id=?`).get(jobId) as Record<string, unknown>;
    expect(parseEvidenceJobRow(row).state).toBe("consumed");
    const settlement = JSON.parse(String(row.settlement_json)) as Record<string, unknown>;
    const availability = { state: "unavailable", operation: "evidence.stockfish_analysis", instances: [INSTANCE], observedAt: START };
    for (const [label, patch] of [
      ["resurrected lease", { lease_owner: "worker", lease_expires_at: START }],
      ["erased result_seq", { result_seq: null }],
      ["erased settled_at", { settled_at: null }],
      ["literal clock", { consumed_at: "now" }],
      ["crossed consumer", { consumer_id: "review.story_evidence" }],
      ["crossed operation", { provider_operation_id: "evidence.tablebase_probe" }],
      ["retry basis on a settled row", { retry_basis_json: JSON.stringify({ kind: "shutdown" }) }],
      ["attacker retry basis", { state: "retry_wait", next_attempt_at: START, retry_basis_json: JSON.stringify({ attacker: true }), settled_at: null, result_seq: null, settlement_json: null, consumed_at: null, application_receipt_json: null }],
      ["non-canonical settlement bytes", { settlement_json: JSON.stringify({ payload: settlement.payload, kind: "success", objectiveProposal: null, acquisition: settlement.acquisition }) }],
      ["story unavailable arm", { origin: "story_completion", consumer_id: "review.story_evidence", state: "settled_unavailable", result_seq: null, consumed_at: null, application_receipt_json: null, settlement_json: JSON.stringify({ kind: "unavailable", availability }) }],
      ["explicit empty/provider_unavailable arm", { state: "settled_empty", result_seq: null, consumed_at: null, application_receipt_json: null, settlement_json: JSON.stringify({ availability, kind: "empty", reason: "provider_unavailable" }) }],
      ["extra column", { attacker: 1 }],
    ] as const) {
      expect(() => parseEvidenceJobRow({ ...row, ...patch }), label).toThrow(EvidenceJobCorrupt);
    }
    // The retry basis round-trips byte-identically ([[D3005]]).
    const basis = { availability, kind: "provider_unavailable" };
    const retry = parseEvidenceJobRow({ ...row, state: "retry_wait", next_attempt_at: START, retry_basis_json: JSON.stringify({ availability: { instances: [INSTANCE], observedAt: START, operation: "evidence.stockfish_analysis", state: "unavailable" }, kind: "provider_unavailable" }), settled_at: null, result_seq: null, settlement_json: null, consumed_at: null, application_receipt_json: null });
    expect(retry.state === "retry_wait" && retry.retryBasis).toEqual(basis);
    void storage;
  });

  it("reparses and rejoins the whole consumed subject on replay; history is append-only ([[D2745]]–[[D2747]], [[D2776]], [[D2808]])", () => {
    const path = databasePath();
    const { storage, run, jobId, seq, applied } = consumed(path);
    const database = raw(path);
    const replay = () => storage.applyEvidenceAndConsumeJob(run.id, LEASE, { resultSeq: seq, at: START, guard: noGuard });
    expect(replay().receipt).toEqual(applied.receipt);
    const row = database.prepare("SELECT request_json, settlement_json, application_receipt_json FROM evidence_jobs WHERE id=?").get(jobId) as Record<string, string>;
    const restore = () => database.prepare("UPDATE evidence_jobs SET request_json=?, settlement_json=?, application_receipt_json=? WHERE id=?").run(row.request_json!, row.settlement_json!, row.application_receipt_json!, jobId);
    const receipt = JSON.parse(row.application_receipt_json!) as Record<string, unknown>;
    for (const [label, column, value] of [
      ["erased request", "request_json", "{}"],
      ["erased settlement", "settlement_json", "{}"],
      ["floating receipt revisions", "application_receipt_json", JSON.stringify({ ...receipt, fromRevision: 899, toRevision: 900 })],
      ["crossed event range", "application_receipt_json", JSON.stringify({ ...receipt, firstEventSeq: 1, lastEventSeq: 1 })],
      ["digest mismatch", "application_receipt_json", JSON.stringify({ ...receipt, eventDigest: `sha256:${"0".repeat(64)}` })],
    ] as const) {
      database.prepare(`UPDATE evidence_jobs SET ${column}=? WHERE id=?`).run(value, jobId);
      expect(replay, label).toThrow(expect.objectContaining({ code: "EVIDENCE_JOB_CORRUPT" }));
      restore();
    }
    expect(() => database.prepare("UPDATE evidence_run_transitions SET to_revision=to_revision WHERE job_id=?").run(jobId)).toThrow(/EVIDENCE_TRANSITION_IMMUTABLE/u);
    expect(() => database.prepare("DELETE FROM evidence_run_transitions WHERE job_id=?").run(jobId)).toThrow(/EVIDENCE_TRANSITION_IMMUTABLE/u);
    database.exec("DROP TRIGGER evidence_run_transitions_no_update");
    expect(replay).toThrow(expect.objectContaining({ code: "EVIDENCE_JOB_CORRUPT" }));
    // Whole-owner cascade deletion remains legal.
    database.prepare("DELETE FROM drill_runs WHERE id=?").run(run.id);
    expect(count(database, "evidence_run_transitions")).toBe(0);
    expect(count(database, "evidence_jobs")).toBe(0);
  });

  it("validates the whole persisted batch against its children and the durable run before any replay ([[D2590]], [[D2677]], [[D2747]])", () => {
    const path = databasePath();
    const storage = openStorage(path);
    const { run, rootId, childId } = seedRun(storage);
    const input = { idempotencyKey: "batch-replay", request: batchRequest(run, "explicit_analysis", [jobRequest(run, rootId), jobRequest(run, childId)]) };
    const admitted = storage.admitEvidenceBatch(input);
    expect(storage.evidenceJobs.batch(admitted.batchId)).toMatchObject({ batchId: admitted.batchId, replayed: true });
    const database = raw(path);
    const forged = parseEvidenceJobRequest(jobRequest(run, rootId, "eval", 20));
    const original = database.prepare("SELECT request_json, job_request_digest FROM evidence_jobs WHERE id=?").get(admitted.jobs[0]!.id) as Record<string, string>;
    database.prepare("UPDATE evidence_jobs SET request_json=?, job_request_digest=? WHERE id=?").run(JSON.stringify(forged), evidenceJobRequestDigest(forged), admitted.jobs[0]!.id);
    expect(() => storage.admitEvidenceBatch(input)).toThrow(expect.objectContaining({ code: "EVIDENCE_JOB_CORRUPT" }));
    database.prepare("UPDATE evidence_jobs SET request_json=?, job_request_digest=? WHERE id=?").run(original.request_json!, original.job_request_digest!, admitted.jobs[0]!.id);
    // An equal node id with a different stored FEN is not the admitted node.
    const snapshot = JSON.parse((database.prepare("SELECT snapshot_json FROM drill_runs WHERE id=?").get(run.id) as { snapshot_json: string }).snapshot_json) as DrillRun;
    const moved = { ...snapshot, nodes: snapshot.nodes.map((candidate) => candidate.id === childId ? { ...candidate, fen: INITIAL_FEN } : candidate) };
    database.prepare("UPDATE drill_runs SET snapshot_json=? WHERE id=?").run(JSON.stringify(moved), run.id);
    expect(() => storage.evidenceJobs.batch(admitted.batchId)).toThrow(expect.objectContaining({ code: "EVIDENCE_JOB_CORRUPT" }));
  });

  it("rejoins a leased job to its complete parent batch before provider work and at settlement ([[D3008]])", () => {
    const path = databasePath();
    const storage = openStorage(path);
    const { run, rootId, childId } = seedRun(storage);
    const admitted = storage.admitEvidenceBatch({ idempotencyKey: "parent", request: batchRequest(run, "explicit_analysis", [jobRequest(run, rootId), jobRequest(run, childId)]) });
    const store = storage.evidenceJobs;
    const database = raw(path);
    const original = database.prepare("SELECT request_json, request_digest, job_count FROM evidence_job_batches WHERE id=?").get(admitted.batchId) as Record<string, string | number>;
    const unrelated = parseEvidenceBatchRequest(batchRequest(run, "explicit_analysis", [jobRequest(run, childId, "wdl")]));
    const rewrite = () => database.prepare("UPDATE evidence_job_batches SET request_json=?, request_digest=?, job_count=1 WHERE id=?").run(JSON.stringify(unrelated), evidenceBatchRequestDigest(unrelated), admitted.batchId);
    const restore = () => database.prepare("UPDATE evidence_job_batches SET request_json=?, request_digest=?, job_count=? WHERE id=?").run(original.request_json!, original.request_digest!, original.job_count!, admitted.batchId);
    const lease = store.claimNext("worker", 60_000)!;
    rewrite();
    expect(() => store.beginProviderRequest(lease)).toThrow(expect.objectContaining({ code: "EVIDENCE_JOB_CORRUPT" }));
    restore();
    const delivery = store.completeProviderRequest(store.beginProviderRequest(lease)!, evalPayload(), INSTANCE);
    rewrite();
    expect(() => store.settleSuccess(delivery, null)).toThrow(expect.objectContaining({ code: "EVIDENCE_JOB_CORRUPT" }));
    expect(store.job(lease.jobId)!.state).toBe("running");
    restore();
    expect(store.settleSuccess(delivery, null)).toBe(1);
  });
});
