// rfc/review-map.md — server acceptance through `createApplication` (the production boundary).

import { mkdtempSync, rmSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

import { afterEach, describe, expect, it } from "vitest";

import { createApplication, type ChessTabiyaApplication } from "./application.js";
import { longitudinalThreadEntryForTests } from "./longitudinal-test-support.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";
import { EvidenceJobQueue, type EvidenceExecutor } from "./evidence-queue.js";
import { MockProviderEngineClient } from "./mock-provider-engine.js";
import { composeProviderTraversalApplication } from "./provider-traversal.js";
import { ReviewAttemptOutcomeStore, ReviewEvidenceCoordinator } from "./review-evidence.js";

// A pasted broadcast-style PGN: third-party SAN glyphs outside comments, a NAG, and a third-party
// eval comment. None of it may reach the review surface (§8).
const GLYPHED_PGN = `[Event "Broadcast"]
[Site "?"]
[White "Alice"]
[Black "Bob"]
[Result "1-0"]

1. e4 e5 2. Nf3?! Nc6 3. Bb5 a6?? 4. Ba4 Nf6! 5. O-O Be7 $2 6. Re1 b5 {[%eval 5.2] Stockfish says this loses} 7. Bb3 d6? 8. c3 O-O 9. h3 Nb8!? 10. d4 Nbd7 11. Nbd2 Bb7 12. Bc2 Re8 13. Nf1 Bf8 14. Ng3 g6 15. a4 c5 16. d5 c4 17. Bg5 h6 18. Be3 Nc5 19. Qd2 h5 20. Bg5 Be7 1-0`;
const PLIES = 40;
const policyConfig = { seedMode: "fixed" as const, locus: { executedAt: "server" as const, engineIds: [], modelIds: [] } };

interface ReviewPayload {
  readonly branchId: string;
  readonly ready: boolean;
  readonly viewer: { readonly mayWrite: boolean };
  readonly semanticPath: { readonly kind: string };
  readonly rows: readonly { readonly nodeId: string; readonly entryNodeId: string; readonly san: string; readonly ply: number; readonly grade?: { readonly sentence: string }; readonly facts: readonly string[] }[];
  readonly moments: readonly { readonly nodeId: string; readonly entryNodeId: string }[];
  readonly accuracy: { readonly white: { readonly kind: string; readonly sentence: string; readonly value?: number }; readonly black: { readonly kind: string } };
  readonly footer: { readonly sentence: string };
}

function tableSnapshot(path: string): Readonly<Record<string, number>> {
  const database = new DatabaseSync(path, { readOnly: true });
  try {
    const tables = (database.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all() as { name: string }[]).map((row) => row.name);
    return Object.fromEntries(tables.map((name) => [name, (database.prepare(`SELECT count(*) AS count FROM "${name.replaceAll("\"", "\"\"")}"`).get() as { count: number }).count]));
  } finally {
    database.close();
  }
}

function eventKinds(path: string, runId: string): readonly string[] {
  const database = new DatabaseSync(path, { readOnly: true });
  try {
    const row = database.prepare("SELECT snapshot_json FROM drill_runs WHERE id=?").get(runId) as { snapshot_json: string };
    return (JSON.parse(row.snapshot_json) as { events: { type: string }[] }).events.map((event) => event.type);
  } finally {
    database.close();
  }
}

describe("review map through createApplication", { timeout: 30_000 }, () => {
  let application: ChessTabiyaApplication | undefined;
  let directory: string | undefined;
  // Detach this test's application and directory before awaiting close(): a teardown that outlives
  // its hook must never close or delete the next test's live database (D3300). close() is bounded by
  // the longitudinal drain grace, so the default hook budget holds.
  afterEach(async () => {
    const closing = application;
    const removing = directory;
    application = undefined;
    directory = undefined;
    try {
      await closing?.close();
    } finally {
      if (removing !== undefined) rmSync(removing, { recursive: true, force: true });
    }
  });

  async function start(): Promise<{ origin: string; databasePath: string }> {
    directory = mkdtempSync(join(tmpdir(), "tabiya-review-map-"));
    const databasePath = join(directory, "review.sqlite");
    application = await createApplication({ development: true, engineMode: "mock", cookieSecure: false, databasePath, longitudinalWorkerEntry: longitudinalThreadEntryForTests() });
    await new Promise<void>((resolve, reject) => { application!.server.once("error", reject); application!.server.listen(0, "127.0.0.1", resolve); });
    return { origin: `http://127.0.0.1:${(application.server.address() as AddressInfo).port}`, databasePath };
  }

  async function register(origin: string, handle: string): Promise<string> {
    const response = await fetch(`${origin}/auth/register`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ handle, password: `${handle}-password-long` }) });
    expect(response.status).toBe(201);
    return response.headers.get("set-cookie")!.split(";", 1)[0]!;
  }

  async function importReviewedGame(origin: string, cookie: string, writer: string): Promise<string> {
    const post = (path: string, body: unknown) => fetch(`${origin}${path}`, { method: "POST", headers: { "content-type": "application/json", cookie, "x-writer-id": writer }, body: JSON.stringify(body) });
    const imported = await post("/runs/import", { id: "review-import", side: "white", opponentPolicy: { mode: "human_common" }, policyConfig, seed: 7, source: { kind: "pgn", pgn: GLYPHED_PGN } });
    expect(imported.status, await imported.clone().text()).toBe(201);
    const runId = "review-import";
    expect((await post(`/runs/${runId}/reveal`, {})).status).toBe(200);
    // rfc/review-evidence-compiler.md §4.1: the import-completion pass runs through the Review
    // coordinator over the one provider exchange (the labelled mock engine in this deployment) and
    // attaches every delivery durably; the story read keeps the bounded window moving.
    let ready = false;
    for (let attempt = 0; attempt < 200 && !ready; attempt += 1) {
      const story = await (await fetch(`${origin}/runs/${runId}/story`, { headers: { cookie } })).json() as { progress: { kind: string } };
      ready = story.progress.kind === "settled";
      if (!ready) await new Promise((resolve) => setTimeout(resolve, 20));
    }
    expect(ready).toBe(true);
    return runId;
  }

  it("serves every ply, glyph-free, with coverage-gated accuracy; writes nothing; one projection feeds share; retry forks before opening", async () => {
    const { origin, databasePath } = await start();
    const cookie = await register(origin, "review_owner");
    const runId = await importReviewedGame(origin, cookie, "writer-review");
    const read = async (): Promise<ReviewPayload> => {
      const response = await fetch(`${origin}/runs/${runId}/review`, { headers: { cookie } });
      expect(response.status, await response.clone().text()).toBe(200);
      return await response.json() as ReviewPayload;
    };

    // [criterion 14] nothing persisted: every table and the run's event log are unchanged by review reads.
    const before = tableSnapshot(databasePath);
    const eventsBefore = eventKinds(databasePath, runId);
    const review = await read();
    await read();
    expect(tableSnapshot(databasePath)).toEqual(before);
    expect(eventKinds(databasePath, runId)).toEqual(eventsBefore);

    // [criterion 1] every ply; [§8] third-party glyphs, NAGs and eval comments never reach the payload.
    expect(review.rows).toHaveLength(PLIES);
    expect(review.rows.map((row) => row.ply)).toEqual(Array.from({ length: PLIES }, (_, index) => index + 1));
    const serialized = JSON.stringify({ rows: review.rows, moments: review.moments, accuracy: review.accuracy, footer: review.footer });
    for (const glyph of ["?!", "??", "!?", "$2", "%eval", "5.2", "Stockfish says", "loses"]) expect(serialized).not.toContain(glyph);
    expect(review.rows.map((row) => row.san).slice(0, 6)).toEqual(["e4", "e5", "Nf3", "Nc6", "Bb5", "a6"]);
    expect(review.rows.every((row) => !/[?!]/u.test(row.san))).toBe(true);

    // [criterion 6] imported game: full recorded coverage, so accuracy renders with its denominator.
    expect(review.ready).toBe(true);
    expect(review.accuracy.white).toMatchObject({ kind: "rendered", value: 100 });
    expect(review.accuracy.white.sentence).toContain("across all 20 of White's evaluated decisions");
    expect(review.rows.filter((row) => row.grade !== undefined)).toEqual([]);
    expect(review.semanticPath.kind).toBe("available");
    expect(review.viewer.mayWrite).toBe(true);
    expect(review.footer.sentence).toMatch(/^Sources on this review: Recorded game · Recorded engine analysis/u);

    // [criterion 8] the public share reads the same moment ids in the same order.
    const shared = await fetch(`${origin}/runs/${runId}/share`, { method: "POST", headers: { "content-type": "application/json", cookie }, body: JSON.stringify({ branchId: review.branchId }) });
    expect(shared.status).toBe(201);
    const token = (await shared.json() as { token: string }).token;
    const publicStory = await (await fetch(`${origin}/api/shared/${token}/story`)).json() as { moments: { nodeId: string }[] };
    expect(publicStory.moments.map((moment) => moment.nodeId)).toEqual(review.moments.map((moment) => moment.nodeId));
    const card = await (await fetch(`${origin}/shared/${token}`)).text();
    expect(card).not.toContain(["rendered from recorded", "engine evidence"].join(" "));
    expect(card).toContain("Sources on this review:");

    // [criterion 4] Retry from here forks a story-reentry branch before opening; the original line survives.
    const post = (path: string, body: unknown) => fetch(`${origin}${path}`, { method: "POST", headers: { "content-type": "application/json", cookie, "x-writer-id": "writer-other-device" }, body: JSON.stringify(body) });
    const graphBefore = (await (await fetch(`${origin}/runs/${runId}/graph`, { headers: { cookie } })).json() as { graph: { branches: { id: string }[]; nodes: { id: string; branchId: string }[] } }).graph;
    const mainline = graphBefore.nodes.filter((node) => node.branchId === review.branchId).map((node) => node.id);
    const targets = [review.rows[10]!.entryNodeId, review.rows.at(-1)!.entryNodeId, ...review.moments.map((moment) => moment.entryNodeId)];
    for (const [index, entry] of targets.entries()) {
      // A second device: it has no stored writer id; the lease is claimed with its own.
      expect((await post(`/runs/${runId}/lease`, {})).status).toBe(200);
      expect((await post(`/runs/${runId}/rewind`, { nodeId: entry })).status).toBe(200);
      const fork = await post(`/runs/${runId}/fork`, { nodeId: entry, label: "story-reentry", intent: `Retry ${index}` });
      expect(fork.status, await fork.clone().text()).toBe(200);
    }
    const graphAfter = (await (await fetch(`${origin}/runs/${runId}/graph`, { headers: { cookie } })).json() as { graph: { branches: { id: string; label: string }[]; nodes: { id: string; branchId: string }[] } }).graph;
    expect(graphAfter.branches.filter((branch) => branch.label === "story-reentry")).toHaveLength(targets.length);
    expect(graphAfter.branches.map((branch) => branch.id)).toContain(review.branchId);
    expect(graphAfter.nodes.filter((node) => node.branchId === review.branchId).map((node) => node.id)).toEqual(mainline);
    expect((await read()).rows).toHaveLength(PLIES);
  });

  it("[module-registration §4.5] serves Post-commit Nudge through module.postcommit_nudge@1 without writing", async () => {
    const { origin, databasePath } = await start();
    const cookie = await register(origin, "nudge_owner");
    const runId = await importReviewedGame(origin, cookie, "writer-nudge");
    const review = await (await fetch(`${origin}/runs/${runId}/review`, { headers: { cookie } })).json() as ReviewPayload;
    const nudge = (nodeId: string) => fetch(`${origin}/runs/${runId}/nudge?nodeId=${encodeURIComponent(nodeId)}`, { headers: { cookie } });
    const before = tableSnapshot(databasePath);
    const white = review.rows[4]!;
    const response = await nudge(white.nodeId);
    expect(response.status, await response.clone().text()).toBe(200);
    const packet = await response.json() as { kind: string; nodeId: string; facts: { projection: string; sentence: string }[]; receipt: { admitted: number } };
    expect(packet).toMatchObject({ kind: "packet", nodeId: white.nodeId });
    expect(packet.facts.length).toBeLessThanOrEqual(2);
    expect(packet.facts.every((fact) => /@\d+$/u.test(fact.projection))).toBe(true);
    // The opponent's move is not the learner's commit: a typed refusal, not a packet.
    expect(await (await nudge(review.rows[5]!.nodeId)).json()).toMatchObject({ kind: "refused", reason: "not_a_learner_move" });
    expect((await nudge("missing-node")).status).toBe(400);
    expect(tableSnapshot(databasePath)).toEqual(before);
  });

  it("serves the eval graph, the explicit Analyze reveal and the Compare handoff — read-only, withheld during a retry", async () => {
    const { origin, databasePath } = await start();
    const cookie = await register(origin, "review_remainder");
    const runId = await importReviewedGame(origin, cookie, "writer-remainder");
    interface Remainder {
      readonly branchId: string;
      readonly rows: readonly { readonly nodeId: string; readonly entryNodeId: string; readonly label: string }[];
      readonly evalGraph: { readonly kind: string; readonly side: string; readonly evaluated: number; readonly points: readonly { readonly kind: string; readonly percent?: number }[] };
      readonly compareDoors: readonly { readonly entryNodeId: string; readonly branchIds: readonly string[]; readonly omitted: number }[];
      readonly openRetryEntryNodeId: string | null;
    }
    const read = async (): Promise<Remainder> => await (await fetch(`${origin}/runs/${runId}/review`, { headers: { cookie } })).json() as Remainder;
    const analyze = (nodeId: string) => fetch(`${origin}/runs/${runId}/review-analysis?node=${encodeURIComponent(nodeId)}`, { headers: { cookie } });

    const review = await read();
    // §6: one drawn point per ply at full recorded coverage; the mock records 0 cp → 50 win-points.
    expect(review.evalGraph).toMatchObject({ kind: "complete", side: "white", evaluated: PLIES });
    expect(review.evalGraph.points.every((point) => point.kind === "evaluated" && point.percent === 50)).toBe(true);
    expect(review.compareDoors).toEqual([]);
    expect(review.openRetryEntryNodeId).toBeNull();
    // Criterion 12: the mock evaluation records its search's first move; the ordinary map never carries it.
    expect(JSON.stringify(review)).not.toMatch(/bestMove|movesUci|principal/u);

    // §7 / O7.3: the explicit reveal, attributed to engine and search bound, and it writes nothing.
    const tables = tableSnapshot(databasePath);
    const events = eventKinds(databasePath, runId);
    const target = review.rows[10]!;
    const revealed = await analyze(target.nodeId);
    expect(revealed.status, await revealed.clone().text()).toBe(200);
    // rfc/review-evidence-compiler.md refusal 7: the typed position-evaluation delivery admits no best
    // move or PV, so the Review pass records no engine line; the explicit reveal says so honestly.
    const line = await revealed.json() as { kind: string; sentence: string; entryNodeId: string };
    expect(line).toMatchObject({ kind: "none", entryNodeId: target.entryNodeId });
    expect(line.sentence).toBe(`No engine line is recorded for the position before ${target.label}.`);
    expect(tableSnapshot(databasePath)).toEqual(tables);
    expect(eventKinds(databasePath, runId)).toEqual(events);
    expect((await analyze(review.rows[0]!.entryNodeId)).status).toBe(400);
    expect((await fetch(`${origin}/runs/${runId}/review-analysis`, { headers: { cookie } })).status).toBe(400);

    // Retry from that position (as the Review Map does): the reveal is withheld while the retry is open.
    const post = (path: string, body: unknown) => fetch(`${origin}${path}`, { method: "POST", headers: { "content-type": "application/json", cookie, "x-writer-id": "writer-remainder" }, body: JSON.stringify(body) });
    expect((await post(`/runs/${runId}/lease`, {})).status).toBe(200);
    expect((await post(`/runs/${runId}/rewind`, { nodeId: target.entryNodeId })).status).toBe(200);
    expect((await post(`/runs/${runId}/fork`, { nodeId: target.entryNodeId, label: "story-reentry", intent: "Retry" })).status).toBe(200);
    const opened = await read();
    expect(opened.openRetryEntryNodeId).toBe(target.entryNodeId);
    // §4: an empty retry is not a second line yet.
    expect(opened.compareDoors).toEqual([]);
    const withheld = await (await analyze(target.nodeId)).json() as { kind: string; sentence: string };
    expect(withheld).toMatchObject({ kind: "withheld" });
    expect(JSON.stringify(withheld)).not.toMatch(/"moves"|mock-evidence/u);
    expect((await (await analyze(review.rows[12]!.nodeId)).json() as { kind: string }).kind).toBe("none");

    // Play one move on the retry: the compare door appears, and the shipped compare accepts it verbatim.
    const moved = await post(`/runs/${runId}/moves`, { uci: "a2a3" });
    expect(moved.status, await moved.clone().text()).toBe(200);
    const doors = (await read()).compareDoors;
    expect(doors).toHaveLength(1);
    expect(doors[0]!.entryNodeId).toBe(target.entryNodeId);
    expect(doors[0]!.branchIds[0]).toBe(review.branchId);
    const compared = await post(`/runs/${runId}/compare`, { branchIds: doors[0]!.branchIds });
    expect(compared.status, await compared.clone().text()).toBe(200);
    const comparison = (await compared.json() as { comparison: { columns: { branchId: string }[]; forkNodeId: string } }).comparison;
    expect(comparison.columns.map((column) => column.branchId)).toEqual(doors[0]!.branchIds);
    expect(comparison.forkNodeId).toBe(target.entryNodeId);
  });
});

describe("review map service boundary", () => {
  const stores: SQLiteRunStorage[] = [];
  afterEach(() => { for (const store of stores.splice(0)) store.close(); });

  it("[criterion 5] tells a read-only viewer that retry is unavailable instead of offering a dead control", async () => {
    const at = "2026-09-24T12:00:00.000Z";
    const executor: EvidenceExecutor = { async execute(job) { return { kind: "eval", source: "engine_validated", values: { centipawns: 0, perspective: "white", engineId: "mock", requestedMovetimeMs: job.movetime } }; } };
    const queue = new EvidenceJobQueue(executor, { maxConcurrency: 1 });
    const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {}, now: () => at });
    stores.push(storage);
    storage.createLearner({ id: "owner", handle: "owner", passwordHash: "!", createdAt: at });
    storage.createLearner({ id: "reader", handle: "reader", passwordHash: "!", createdAt: at });
    const service = new RunService(storage, { evidenceQueue: queue });
    const owner = { learnerId: "owner", handle: "owner" } as const;
    const imported = await service.importGame({ id: "shared-review", side: "black", opponentPolicy: { mode: "human_common" }, policyConfig, seed: 3, source: { kind: "pgn", pgn: GLYPHED_PGN } }, { writerId: "owner-writer", learnerId: "owner" });
    await queue.whenIdle();
    service.reveal(imported.run.id, owner, "owner-writer");
    for (const result of queue.page(imported.run.id).results) service.applyEvidence(imported.run.id, owner, "owner-writer", result.seq);
    storage.grantRole(imported.run.id, "reader", "spectator", { writerId: "owner-writer", learnerId: "owner" }, at);
    const asOwner = await service.review(imported.run.id, owner);
    const asReader = await service.review(imported.run.id, { learnerId: "reader", handle: "reader" });
    expect(asOwner.viewer.mayWrite).toBe(true);
    expect(asReader.viewer.mayWrite).toBe(false);
    expect(asReader.rows.map((row) => row.nodeId)).toEqual(asOwner.rows.map((row) => row.nodeId));
    expect(() => service.claimLease(imported.run.id, { learnerId: "reader", handle: "reader" }, "reader-writer")).toThrowError(expect.objectContaining({ code: "FORBIDDEN" }));
    await expect(service.review(imported.run.id, { learnerId: "stranger", handle: "stranger" })).rejects.toMatchObject({ code: "RUN_NOT_FOUND" });
  });

  it("[§6] draws the eval graph for the imported side: White-perspective +1.50 reads above level for White, below for Black", async () => {
    const at = "2026-09-24T12:00:00.000Z";
    // White +1.50 at every position: the raw side-to-move score is +150 for White to move, −150 for Black.
    const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {}, now: () => at });
    stores.push(storage);
    const { service, coordinator } = reviewService(storage, (fen) => ({ score: fen.split(" ")[1] === "w" ? "cp 150" : "cp -150", wdl: [600, 300, 100] as const }));
    const principal = { learnerId: "__legacy", handle: "__legacy" } as const;
    const graphs: Record<string, { side: string; points: readonly { kind: string; percent?: number }[] }> = {};
    for (const side of ["white", "black"] as const) {
      const imported = await service.importGame({ id: `graph-${side}`, side, opponentPolicy: { mode: "human_common" }, policyConfig, seed: 3, source: { kind: "pgn", pgn: GLYPHED_PGN } }, "writer");
      service.reveal(imported.run.id, "writer");
      for (let pass = 0; pass < 40 && service.story(imported.run.id, principal).progress.kind !== "settled"; pass += 1) await coordinator.whenIdle();
      graphs[side] = (await service.review(imported.run.id, principal)).evalGraph;
    }
    expect(graphs.white!.side).toBe("white");
    expect(graphs.black!.side).toBe("black");
    expect(graphs.white!.points.every((point) => point.kind === "evaluated" && point.percent! > 60)).toBe(true);
    expect(graphs.black!.points.every((point) => point.kind === "evaluated" && point.percent! < 40)).toBe(true);
    graphs.white!.points.forEach((point, index) => expect(point.percent! + graphs.black!.points[index]!.percent!).toBeCloseTo(100, 0));
  });

  it("[criterion 6] a line whose evaluation pass could not complete abstains and states the fraction; the read enqueues nothing", async () => {
    const at = "2026-09-24T12:00:00.000Z";
    const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {}, now: () => at });
    stores.push(storage);
    // The provider answers only the first eight positions (fullmove 1–4); later positions fail and exhaust.
    const { service, coordinator, calls } = reviewService(storage, () => ({ score: "cp 0", wdl: [300, 400, 300] as const }), (fen) => Number(fen.split(" ")[5]) > 4);
    const principal = { learnerId: "__legacy", handle: "__legacy" } as const;
    const imported = await service.importGame({ id: "pending-review", side: "white", opponentPolicy: { mode: "human_common" }, policyConfig, seed: 3, source: { kind: "pgn", pgn: GLYPHED_PGN } }, "writer");
    await coordinator.whenIdle();
    service.reveal(imported.run.id, "writer");
    const before = calls();
    const review = await service.review(imported.run.id, principal);
    await coordinator.whenIdle();
    // The Review Map read observes the coordinator; it requests nothing.
    expect(calls()).toBe(before);
    // The pass settled (every requested position reached a terminal state) but degraded: the later
    // positions exhausted their attempts, so accuracy abstains and coverage states the fraction.
    expect(review.ready).toBe(true);
    expect(review.accuracy.white.kind).toBe("abstained");
    expect(review.accuracy.white.sentence).toMatch(/^White: no accuracy figure\. \d+ of 20 of White's decisions have paired recorded evaluations/u);
    expect(review.coverage.sentence).toBe(`Evaluation coverage: 8 of ${PLIES + 1} positions on this line carry a recorded engine evaluation.`);
  });
});

/** A RunService with the Review coordinator over the one real provider exchange (labelled mock engine). */
function reviewService(storage: SQLiteRunStorage, score: (fen: string) => { readonly score: string; readonly wdl: readonly [number, number, number] }, fail: (fen: string) => boolean = () => false) {
  const { scheduler } = composeProviderTraversalApplication({ engines: new MockProviderEngineClient({ score, fail }), tablebaseFetch: null, explorerFetch: null, explorerToken: null });
  let gets = 0;
  const counting = { get: ((...args: Parameters<typeof scheduler.get>) => { gets += 1; return scheduler.get(...args); }) as typeof scheduler.get, normalizedRequestDigest: scheduler.normalizedRequestDigest.bind(scheduler) };
  const coordinator = new ReviewEvidenceCoordinator({ scheduler: counting as never, requestedEngine: async () => ({ id: "stockfish-analysis", version: "mock-1" }), storage, attempts: new ReviewAttemptOutcomeStore({ maxTerminalAttemptOutcomes: 256, maxAttemptsPerRequest: 1 }), windowNodes: 8, maxOutstandingPerRun: 4, maxTrackedRuns: 4, maxAttemptsPerRequest: 1, movetimeMs: 50, timeoutMs: 2_000 });
  return { coordinator, calls: () => gets, service: new RunService(storage, { reviewEvidence: coordinator }) };
}
