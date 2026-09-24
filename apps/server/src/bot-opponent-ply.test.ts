// rfc/bot-policy.md §4.1/§4.3/§10 and rfc/bot-roster.md criterion 10: the server-owned
// `POST /runs/:runId/opponent-ply` operation over the ONE shared provider exchange, run lane 0.18
// and migration 29. Every arm is exercised through the REST handler over a real SQLite store, the
// real scheduler, parsers and receipts, and the labelled mock provider engine.
import { mkdtempSync, rmSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { DatabaseSync } from "node:sqlite";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  BOT_OPPONENT_PLY_RESULTS,
  catalogEntryFor,
  createRun,
  digestSessionSource,
  projectRun,
  runEventHeadDigest,
  type BotProfileReference,
  type DrillRun,
  type DrillRunEvent,
  type EvidencePayload,
  type OpponentMoveSelectedEvent,
} from "@chess-tabiya/runtime";
import { afterEach, describe, expect, it } from "vitest";

import { APPLICATION_PROVIDER_BOUNDS } from "./application.js";
import { BotOpponentProviders, parseStoredBotEnvelope, type BotAcquisition, type BotOpponentAcquirer } from "./bot-opponent-operation.js";
import { BotProviderAvailability } from "./bot-opponent-source.js";
import { ProviderRegistry } from "./provider-health.js";

/** Bot availability over a fresh provider-health registry: local fixtures, no outcome yet. */
function botTestAvailability(): BotProviderAvailability {
  return new BotProviderAvailability(new ProviderRegistry({ configured: [
    { instanceId: "maia-inference", implementation: "local_fixture", endpoint: "mock-maia", identity: "mock maia" },
    { instanceId: "stockfish-analysis", implementation: "local_fixture", endpoint: "mock-stockfish", identity: "mock stockfish" },
  ] }));
}
import { EvidenceJobQueue, type EvidenceExecutor, type EvidenceJob } from "./evidence-queue.js";
import type { EngineExchangeCapture, EngineExchangeRequest } from "./engine-supervisor.js";
import { MockProviderEngineClient, type MockProviderEngineOptions } from "./mock-provider-engine.js";
import { createInMemoryTestApplication } from "./in-memory-test-application.js";
import { composeProviderTraversalApplication } from "./provider-traversal.js";
import { createRestHandler } from "./rest.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage, type StorageMigrationLog } from "./storage.js";

const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const WRITER = "writer-bot";
const profile = (id: string): BotProfileReference => structuredClone(catalogEntryFor(id)!.reference) as BotProfileReference;
const requestId = (tag: string): string => `botreq_${tag.padEnd(16, "x")}`;

class CountingEngine extends MockProviderEngineClient {
  readonly exchanges: string[] = [];
  override async exchange(engineId: string, request: EngineExchangeRequest): Promise<EngineExchangeCapture> {
    this.exchanges.push(engineId);
    return super.exchange(engineId, request);
  }
}

class NoEvidence implements EvidenceExecutor {
  readonly instanceId = "bot-test-evidence";
  async execute(job: EvidenceJob): Promise<EvidencePayload> {
    return { kind: job.kind, source: "engine_validated", values: { engineId: this.instanceId, requestedMovetimeMs: 1, centipawns: 0, perspective: "white" } };
  }
}

const cleanups: (() => void | Promise<void>)[] = [];
afterEach(async () => {
  for (const cleanup of cleanups.splice(0).reverse()) await cleanup();
});

function providersFor(engine: MockProviderEngineClient, availability = botTestAvailability()): BotOpponentProviders {
  const { scheduler } = composeProviderTraversalApplication({ engines: engine, tablebaseFetch: null, explorerFetch: null, explorerToken: null, bounds: APPLICATION_PROVIDER_BOUNDS });
  return new BotOpponentProviders({
    scheduler,
    stockfishEngine: async () => {
      const identity = await engine.start("stockfish-analysis");
      return { id: identity.id, version: identity.version };
    },
    availability,
  });
}

function setup(options: { readonly engine?: MockProviderEngineClient; readonly engineOptions?: MockProviderEngineOptions; readonly filename?: string; readonly acquirer?: BotOpponentAcquirer; readonly availability?: BotProviderAvailability } = {}) {
  const storage = new SQLiteRunStorage(options.filename);
  const engine = options.engine ?? new CountingEngine(options.engineOptions);
  const availability = options.availability ?? botTestAvailability();
  const providers = providersFor(engine, availability);
  const queue = new EvidenceJobQueue(new NoEvidence(), { maxConcurrency: 1 });
  const service = new RunService(storage, {
    evidenceQueue: queue,
    botOpponent: options.acquirer ?? providers,
    botAvailability: () => availability.snapshot(),
  });
  const handler = createRestHandler(service);
  cleanups.push(async () => { await queue.close(); storage.close(); });
  return { storage, engine, availability, providers, service, handler };
}

async function call(handler: ReturnType<typeof createRestHandler>, method: string, path: string, value?: unknown, writer = WRITER): Promise<Response> {
  return handler(new Request(`http://server.test${path}`, {
    method,
    headers: { "x-writer-id": writer, ...(value === undefined ? {} : { "content-type": "application/json" }) },
    ...(value === undefined ? {} : { body: JSON.stringify(value) }),
  }));
}

function createBody(id: string, opponentPolicy: Record<string, unknown>, side: "white" | "black" = "black", fen = START) {
  return {
    id,
    session: { kind: "position", start: { fen, side }, feedbackPolicy: "attempt_end", opponentPolicy },
    policyConfig: { seedMode: "per_branch", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
    seed: 7,
  };
}

async function createBotRun(handler: ReturnType<typeof createRestHandler>, id: string, reference: unknown = profile("human-baseline.1400@1"), side: "white" | "black" = "black", fen = START): Promise<DrillRun> {
  const response = await call(handler, "POST", "/runs", createBody(id, { mode: "human_common", profile: reference }, side, fen));
  expect(response.status, await response.clone().text()).toBe(201);
  return ((await response.json()) as { run: DrillRun }).run;
}

function plyBody(run: DrillRun, id: string, overrides: Record<string, unknown> = {}) {
  return { requestId: id, expectedNodeId: run.activeCursor.nodeId, expectedBranchId: run.activeCursor.branchId, expectedEventHeadDigest: runEventHeadDigest(run), ...overrides };
}

async function events(handler: ReturnType<typeof createRestHandler>, runId: string): Promise<readonly DrillRunEvent[]> {
  return ((await (await call(handler, "GET", `/runs/${runId}/events`)).json()) as { events: DrillRunEvent[] }).events;
}

function storedSelections(storage: SQLiteRunStorage, runId: string): readonly OpponentMoveSelectedEvent[] {
  return storage.read(runId)!.run.events.filter((event): event is OpponentMoveSelectedEvent => event.type === "opponent.move_selected");
}

describe("run lane 0.18: create, resume and rematch carry the exact profile (A1)", () => {
  it("stores the whole catalogue reference in run.started and resumes it byte-for-byte", async () => {
    const { handler, storage } = setup();
    const reference = profile("guarded-human.1800@1");
    const run = await createBotRun(handler, "bot-create", reference);
    expect(run.schemaVersion).toBe("0.18");
    expect(run.opponentPolicy).toEqual({ mode: "human_common", profile: reference });
    const started = (await events(handler, "bot-create"))[0]!;
    expect(started.type === "run.started" && started.data.opponentPolicy.profile).toEqual(reference);
    expect(storage.read("bot-create")!.run.opponentPolicy.profile).toEqual(reference);
  });

  it.each([
    ["a substituted band on a genuine id", { ...profile("human-baseline.1400@1"), band: 1800 }],
    ["a substituted layer list", { ...profile("pawn-forward.1400@1"), orderedLayers: ["sampler.maia_reconstruction@1"] }],
    ["an unregistered id", { ...profile("human-baseline.1400@1"), id: "human-baseline.1500@1" }],
    ["a bare id string", "human-baseline.1400@1"],
  ])("refuses %s at create", async (_label, reference) => {
    const { handler } = setup();
    const response = await call(handler, "POST", "/runs", createBody("bot-bad", { mode: "human_common", profile: reference }));
    expect(response.status).toBe(400);
  });

  it.each([
    ["targetElo", { mode: "human_common", targetElo: 1400 }],
    ["temperature", { mode: "human_common", temperature: 0.8 }],
    ["strong_engine", { mode: "strong_engine" }],
  ])("refuses a profile combined with %s", async (_label, policy) => {
    const { handler } = setup();
    const response = await call(handler, "POST", "/runs", createBody("bot-mixed", { ...policy, profile: profile("human-baseline.1400@1") }));
    expect(response.status).toBe(400);
  });

  it("rematch copies the exact reference with a new seed; same-family different band is a different identity", async () => {
    const { handler } = setup();
    const source = await createBotRun(handler, "bot-source", profile("pawn-forward.1000@1"));
    const response = await call(handler, "POST", `/runs/${source.id}/duplicate`, { id: "bot-rematch", seed: 99 });
    expect(response.status, await response.clone().text()).toBe(201);
    const rematch = ((await response.json()) as { run: DrillRun }).run;
    expect(rematch.opponentPolicy.profile).toEqual(source.opponentPolicy.profile);
    expect(rematch.branches[0]!.seed).not.toBe(source.branches[0]!.seed);
    expect(profile("pawn-forward.1800@1").digest).not.toBe(source.opponentPolicy.profile!.digest);
  });

  it("historical runs infer no profile, and a projection refuses an envelope on a non-profile run", async () => {
    const plain = createRun({
      id: "plain",
      session: { kind: "position", start: { fen: START, side: "black" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common", targetElo: 1400 } },
      sessionDigest: await digestSessionSource({ kind: "position", start: { fen: START, side: "black" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common", targetElo: 1400 } }),
      policyConfig: { seedMode: "per_branch", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
      seed: 1,
    });
    expect(plain.opponentPolicy.profile).toBeUndefined();
    const forged: DrillRunEvent[] = [...plain.events, { seq: 2, type: "opponent.move_selected", at: plain.events[0]!.at, data: { nodeId: plain.activeCursor.nodeId, branchId: plain.activeCursor.branchId, moveUci: "e2e4", selection: { moveUci: "e2e4", policyModeApplied: "human_common", engine: { id: "maia-5m", name: "Maia3", version: "1", seedHonored: true }, policy: { decision: {}, operation: {}, deliveries: { maia: {} } } } } } as DrillRunEvent];
    expect(() => projectRun(forged)).toThrow(/without a bot profile/);
  });
});

describe("POST /runs/:runId/opponent-ply (A2, A6, A8; D3027/D3028)", () => {
  it("commits one move + decision + operation + deliveries atomically, seeded by the server", async () => {
    const { handler, storage } = setup();
    const run = await createBotRun(handler, "bot-ply");
    const response = await call(handler, "POST", "/runs/bot-ply/opponent-ply", plyBody(run, requestId("first")));
    expect(response.status, await response.clone().text()).toBe(200);
    const body = await response.json() as { result: unknown; emitted: DrillRunEvent[]; operation: { requestId: string; layers: unknown[] } };
    expect(body.result).toEqual(BOT_OPPONENT_PLY_RESULTS.committed);
    expect(body.operation.requestId).toBe(requestId("first"));
    const selected = storedSelections(storage, "bot-ply");
    expect(selected).toHaveLength(1);
    const selection = selected[0]!.data.selection;
    expect(selection.engine.seedHonored).toBe(true);
    expect(selection.policyModeApplied).toBe("human_common");
    expect(selection.policy).toBeDefined();
    // The public wire never exposes the server-owned envelope (engine evidence, provider bytes).
    const emittedSelection = body.emitted.find((event) => event.type === "opponent.move_selected");
    expect(emittedSelection?.type === "opponent.move_selected" && emittedSelection.data.selection.policy).toBeUndefined();
    // The durable parser reconstructs it from independently loaded authorities.
    const envelope = parseStoredBotEnvelope(storage.read("bot-ply")!.run, selected[0]!);
    expect(envelope.decision.chosenMoveUci).toBe(selected[0]!.data.moveUci);
    expect(envelope.operation.committedEventSequence).toBe(selected[0]!.seq);
    expect(envelope.decision.layers).toEqual([{ id: "sampler.maia_reconstruction@1", action: "applied" }]);
  });

  it.each([
    ["an extra FEN", { fen: START }],
    ["an extra profile", { profile: profile("human-baseline.1400@1") }],
    ["a seed", { seed: 1 }],
    ["a non-canonical head digest", { expectedEventHeadDigest: "sha256:ABC" }],
    ["an empty node id", { expectedNodeId: "" }],
    ["a bare request id", { requestId: "req-1" }],
  ])("refuses %s before any provider call", async (_label, overrides) => {
    const { handler, engine } = setup();
    const run = await createBotRun(handler, "bot-grammar");
    const before = (engine as CountingEngine).exchanges.length;
    const response = await call(handler, "POST", "/runs/bot-grammar/opponent-ply", plyBody(run, requestId("grammar"), overrides));
    expect(response.status).toBe(400);
    expect((engine as CountingEngine).exchanges.length).toBe(before);
  });

  it("replays an identical retry byte-for-byte without provider calls; a reused id with another root refuses", async () => {
    const { handler, engine, storage } = setup();
    const run = await createBotRun(handler, "bot-retry");
    const body = plyBody(run, requestId("retry"));
    const first = await (await call(handler, "POST", "/runs/bot-retry/opponent-ply", body)).json() as { operation: unknown };
    const exchanges = (engine as CountingEngine).exchanges.length;
    const eventsAfter = storage.read("bot-retry")!.run.events.length;
    const retry = await call(handler, "POST", "/runs/bot-retry/opponent-ply", body);
    expect(retry.status).toBe(200);
    const replayed = await retry.json() as { result: unknown; emitted: unknown[]; operation: unknown };
    expect(replayed.result).toEqual(BOT_OPPONENT_PLY_RESULTS.replayed_idempotent);
    expect(replayed.emitted).toEqual([]);
    expect(replayed.operation).toEqual(first.operation);
    expect((engine as CountingEngine).exchanges.length).toBe(exchanges);
    expect(storage.read("bot-retry")!.run.events).toHaveLength(eventsAfter);
    const reused = await call(handler, "POST", "/runs/bot-retry/opponent-ply", { ...body, expectedNodeId: storage.read("bot-retry")!.run.activeCursor.nodeId });
    expect(reused.status).toBe(409);
    expect((await reused.json() as { error: { code: string; result: unknown } }).error).toMatchObject({ code: "OPPONENT_REQUEST_REUSED", result: BOT_OPPONENT_PLY_RESULTS.request_reused_with_different_operands });
    // Another writer reusing the id is refused by the lease before anything else.
    expect((await call(handler, "POST", "/runs/bot-retry/opponent-ply", body, "writer-other")).status).toBe(409);
  });

  it.each([
    ["stale node", (run: DrillRun) => ({ expectedNodeId: `${run.id}:node:9` })],
    ["stale branch", () => ({ expectedBranchId: "branch-elsewhere" })],
    ["stale event head", () => ({ expectedEventHeadDigest: `sha256:${"0".repeat(64)}` })],
  ])("returns stale_root for a %s and writes nothing", async (_label, override) => {
    const { handler, storage, engine } = setup();
    const run = await createBotRun(handler, "bot-stale");
    const response = await call(handler, "POST", "/runs/bot-stale/opponent-ply", plyBody(run, requestId("stale"), override(run)));
    expect(response.status).toBe(409);
    expect((await response.json() as { error: { code: string } }).error.code).toBe("OPPONENT_STALE_ROOT");
    expect(storage.read("bot-stale")!.run.events).toHaveLength(run.events.length);
    expect((engine as CountingEngine).exchanges.filter((id) => id === "maia-5m")).toHaveLength(0);
  });

  it("refuses caller selection bytes for a profile run and the opponent-ply route for a non-profile run", async () => {
    const { handler } = setup();
    const run = await createBotRun(handler, "bot-bytes");
    const bytes = await call(handler, "POST", "/runs/bot-bytes/moves", { selection: { moveUci: "e2e4", policyModeApplied: "human_common", engine: { id: "maia-5m", name: "Maia3", version: "1", seedHonored: true } } });
    expect(bytes.status).toBe(400);
    expect(run.events).toHaveLength(1);
  });

  it("Maia unavailable is a retryable typed no-move: no event, unavailable roster, create refused", async () => {
    const { handler, storage, availability } = setup({ engineOptions: { maiaFail: () => true } });
    const run = await createBotRun(handler, "bot-down");
    const response = await call(handler, "POST", "/runs/bot-down/opponent-ply", plyBody(run, requestId("down")));
    expect(response.status).toBe(503);
    expect((await response.json() as { error: { result: unknown } }).error.result).toEqual(BOT_OPPONENT_PLY_RESULTS.base_provider_unavailable);
    expect(storage.read("bot-down")!.run.events).toHaveLength(1);
    expect(availability.snapshot().maia).toBe("unavailable");
    const refused = await call(handler, "POST", "/runs", createBody("bot-down-2", { mode: "human_common", profile: profile("human-baseline.1400@1") }));
    expect(refused.status).toBe(503);
  });

  it("a band the live Maia no longer advertises is a typed provider_failed, never an internal error or a fallback move", async () => {
    class NarrowMaia extends CountingEngine {
      override health(engineId: string) {
        const health = super.health(engineId);
        return engineId === "maia-5m" ? { ...health, bandRange: { min: 1500, max: 2400 } } : health;
      }
    }
    const { handler, storage } = setup({ engine: new NarrowMaia() });
    const run = await createBotRun(handler, "bot-narrow", profile("human-baseline.1400@1"));
    const response = await call(handler, "POST", "/runs/bot-narrow/opponent-ply", plyBody(run, requestId("narrow")));
    expect(response.status).toBe(502);
    expect((await response.json() as { error: { result: unknown } }).error.result).toEqual(BOT_OPPONENT_PLY_RESULTS.provider_failed);
    expect(storage.read("bot-narrow")!.run.events).toHaveLength(1);
  });

  it("a guarded profile whose Stockfish fails keeps the delivered Maia distribution and records the abstention", async () => {
    const { handler, storage } = setup({ engineOptions: { fail: () => true } });
    const baseline = await createBotRun(handler, "bot-baseline", profile("human-baseline.1400@1"));
    expect((await call(handler, "POST", "/runs/bot-baseline/opponent-ply", plyBody(baseline, requestId("baseline")))).status).toBe(200);
    const baselineDecision = parseStoredBotEnvelope(storage.read("bot-baseline")!.run, storedSelections(storage, "bot-baseline")[0]!).decision;
    const run = await createBotRun(handler, "bot-guard-off", profile("pawn-forward.1400@1"));
    const response = await call(handler, "POST", "/runs/bot-guard-off/opponent-ply", plyBody(run, requestId("guardoff")));
    expect(response.status, await response.clone().text()).toBe(200);
    const envelope = parseStoredBotEnvelope(storage.read("bot-guard-off")!.run, storedSelections(storage, "bot-guard-off")[0]!);
    expect(envelope.decision.layers).toEqual([
      { id: "sampler.maia_reconstruction@1", action: "applied" },
      { id: "guard.severe_error@1", action: "abstained", reason: "guard_unavailable" },
      { id: "trait.pawn_preference@1", action: "abstained", reason: "guard_dependency_abstained" },
    ]);
    // Byte-identical to the baseline sampler's distribution for the same page (A10).
    expect(envelope.decision.considered.map((row) => [row.moveUci, row.finalMass])).toEqual(baselineDecision.considered.map((row) => [row.moveUci, row.finalMass]));
  });

  it("a guarded profile masks every Maia candidate losing 250 cp against the best legal move", async () => {
    // Knight moves lose 400 cp against the best legal move; everything else is level.
    const rootScore = (_fen: string, move: string) => (move === "b1c3" || move === "b1a3" || move === "g1f3" || move === "g1h3" ? "cp -400" : "cp 0");
    const { handler, storage } = setup({ engineOptions: { rootScore } });
    const run = await createBotRun(handler, "bot-guard-on", profile("guarded-human.1400@1"));
    expect((await call(handler, "POST", "/runs/bot-guard-on/opponent-ply", plyBody(run, requestId("guardon")))).status).toBe(200);
    const envelope = parseStoredBotEnvelope(storage.read("bot-guard-on")!.run, storedSelections(storage, "bot-guard-on")[0]!);
    expect(envelope.decision.layers[1]).toEqual({ id: "guard.severe_error@1", action: "applied" });
    for (const row of envelope.decision.considered) {
      if (["b1c3", "b1a3", "g1f3", "g1h3"].includes(row.moveUci)) expect(row.finalMass).toBe(0);
    }
    expect(["b1c3", "b1a3", "g1f3", "g1h3"]).not.toContain(envelope.decision.chosenMoveUci);
  });

  it("two identical first flights: one commits, the other replays the winner byte-for-byte", async () => {
    const { handler, storage } = setup();
    const run = await createBotRun(handler, "bot-race");
    const body = plyBody(run, requestId("race"));
    const [left, right] = await Promise.all([
      call(handler, "POST", "/runs/bot-race/opponent-ply", body),
      call(handler, "POST", "/runs/bot-race/opponent-ply", body),
    ]);
    const kinds = [(await left.json() as { result: { kind: string } }).result.kind, (await right.json() as { result: { kind: string } }).result.kind].sort();
    expect(kinds).toEqual(["committed", "replayed_concurrent_winner"]);
    expect(storedSelections(storage, "bot-race")).toHaveLength(1);
  });

  it("two first flights with different delivered bytes: the loser gets a typed conflict and writes nothing", async () => {
    const heavy = (move: string) => (_fen: string, legal: readonly string[]) => [[move, 0.9], ...legal.filter((candidate) => candidate !== move).slice(0, 3).map((candidate) => [candidate, 0.02] as const)] as const;
    const first = providersFor(new MockProviderEngineClient({ maiaPolicy: heavy("e2e4") }));
    const second = providersFor(new MockProviderEngineClient({ maiaPolicy: heavy("d2d4") }));
    let turn = 0;
    const alternating: BotOpponentAcquirer = { acquire: (input) => (turn++ % 2 === 0 ? first : second).acquire(input) as Promise<BotAcquisition> };
    const { handler, storage } = setup({ acquirer: alternating });
    const run = await createBotRun(handler, "bot-conflict");
    const body = plyBody(run, requestId("conflict"));
    const responses = await Promise.all([call(handler, "POST", "/runs/bot-conflict/opponent-ply", body), call(handler, "POST", "/runs/bot-conflict/opponent-ply", body)]);
    const statuses = responses.map((response) => response.status).sort();
    expect(statuses).toEqual([200, 409]);
    const loser = responses.find((response) => response.status === 409)!;
    expect((await loser.json() as { error: { result: unknown } }).error.result).toEqual(BOT_OPPONENT_PLY_RESULTS.concurrent_commit_conflict);
    expect(storedSelections(storage, "bot-conflict")).toHaveLength(1);
  });
});

describe("durable replay: save → reload → retry through the shared delivery parser (D3027, D3030)", () => {
  function file(): string {
    const directory = mkdtempSync(join(tmpdir(), "tabiya-bot-ply-"));
    cleanups.push(() => rmSync(directory, { recursive: true, force: true }));
    return join(directory, "bot.sqlite");
  }

  it("returns the stored envelope after a restart with zero provider calls", async () => {
    const filename = file();
    const first = setup({ filename });
    const run = await createBotRun(first.handler, "bot-durable");
    const body = plyBody(run, requestId("durable"));
    const committed = await (await call(first.handler, "POST", "/runs/bot-durable/opponent-ply", body)).json() as { operation: unknown };
    await cleanups.pop()!();
    const engine = new CountingEngine();
    const second = setup({ filename, engine });
    const retry = await call(second.handler, "POST", "/runs/bot-durable/opponent-ply", body);
    expect(retry.status).toBe(200);
    expect((await retry.json() as { operation: unknown }).operation).toEqual(committed.operation);
    expect(engine.exchanges).toEqual([]);
  });

  it.each([
    ["a coordinated rewrite of the decision's masses", (policy: Record<string, any>) => { policy.decision.considered[0].rawMass += 0.01; }],
    ["a rewritten chosen move in the operation record", (policy: Record<string, any>) => { policy.operation.chosenMoveUci = policy.operation.chosenMoveUci === "e2e4" ? "d2d4" : "e2e4"; }],
    ["mutated Maia response bytes", (policy: Record<string, any>) => { policy.deliveries.maia.response.bodyBase64 = Buffer.from("tampered").toString("base64"); }],
    ["a copied delivery relabelled as another operation", (policy: Record<string, any>) => { policy.deliveries.maia.operation = "stockfish.legal_root_table@1"; }],
  ])("refuses %s on the retry path", async (_label, mutate) => {
    const filename = file();
    const first = setup({ filename });
    const run = await createBotRun(first.handler, "bot-tamper");
    const body = plyBody(run, requestId("tamper"));
    expect((await call(first.handler, "POST", "/runs/bot-tamper/opponent-ply", body)).status).toBe(200);
    await cleanups.pop()!();
    const database = new DatabaseSync(filename);
    const row = database.prepare("SELECT snapshot_json FROM drill_runs WHERE id = 'bot-tamper'").get() as { snapshot_json: string };
    const snapshot = JSON.parse(row.snapshot_json) as { events: Record<string, any>[] };
    const selected = snapshot.events.find((event) => event.type === "opponent.move_selected")!;
    mutate(selected.data.selection.policy);
    database.prepare("UPDATE drill_runs SET snapshot_json = ? WHERE id = 'bot-tamper'").run(JSON.stringify(snapshot));
    database.close();
    const second = setup({ filename });
    const retry = await call(second.handler, "POST", "/runs/bot-tamper/opponent-ply", body);
    expect(retry.status).toBe(500);
    expect((await retry.json() as { error: { code: string } }).error.code).toBe("STORAGE_FAILURE");
  });
});

describe("migration 29: the stamp-only 0.17 → 0.18 upgrade", () => {
  it("stamps a prior-release 0.17 run once, rewrites no event and infers no profile", async () => {
    const directory = mkdtempSync(join(tmpdir(), "tabiya-bot-migration-"));
    cleanups.push(() => rmSync(directory, { recursive: true, force: true }));
    const filename = join(directory, "prior.sqlite");
    const session = { kind: "position" as const, start: { fen: START, side: "white" as const }, feedbackPolicy: "attempt_end" as const, opponentPolicy: { mode: "human_common" as const, targetElo: 1400 } };
    const run = createRun({ id: "prior-run", session, sessionDigest: await digestSessionSource(session), policyConfig: { seedMode: "per_branch", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 3 });
    const initial = new SQLiteRunStorage(filename, { onMigration: () => {} });
    initial.create(run, "writer", "Prior release");
    initial.close();
    const fixture = new DatabaseSync(filename);
    const stored = fixture.prepare("SELECT snapshot_json FROM drill_runs WHERE id = 'prior-run'").get() as { snapshot_json: string };
    fixture.prepare("UPDATE drill_runs SET snapshot_json = ?, schema_version = '0.17' WHERE id = 'prior-run'").run(JSON.stringify({ ...JSON.parse(stored.snapshot_json), schemaVersion: "0.17" }));
    fixture.exec("PRAGMA user_version = 28");
    fixture.close();

    const log: StorageMigrationLog[] = [];
    const upgraded = new SQLiteRunStorage(filename, { onMigration: (entry) => log.push(entry) });
    expect(log).toEqual([{ version: 29, name: "bot profile run schema" }, { version: 30, name: "campaign runs, creations, events, charged commands and durable awards" }]);
    const after = upgraded.read("prior-run")!.run;
    expect(after.schemaVersion).toBe("0.18");
    expect(after.events).toEqual(run.events);
    expect(after.opponentPolicy.profile).toBeUndefined();
    upgraded.close();

    const repeated: StorageMigrationLog[] = [];
    const reopened = new SQLiteRunStorage(filename, { onMigration: (entry) => repeated.push(entry) });
    expect(repeated).toEqual([]);
    expect(reopened.read("prior-run")!.run.schemaVersion).toBe("0.18");
    reopened.close();
  });
});

describe("the event-head CAS token", () => {
  it("moves on every append and ignores payload redaction", async () => {
    const { handler } = setup();
    const run = await createBotRun(handler, "bot-head");
    const before = runEventHeadDigest(run);
    const redacted = { ...run, events: run.events.map((event) => ({ ...event, data: {} })) } as unknown as DrillRun;
    expect(runEventHeadDigest(redacted)).toBe(before);
    await call(handler, "POST", "/runs/bot-head/opponent-ply", plyBody(run, requestId("head")));
    const after = await events(handler, "bot-head");
    expect(runEventHeadDigest({ id: run.id, events: after })).not.toBe(before);
  });
});

describe("through createApplication: choose → play → resume → rematch (A12/A13 route census)", () => {
  it("the composed application observes Maia through the exchange, starts a bot run and plays it", async () => {
    const application = await createInMemoryTestApplication({ engineMode: "mock", cookieSecure: false });
    cleanups.push(() => application.close());
    await new Promise<void>((resolve, reject) => { application.server.once("error", reject); application.server.listen(0, "127.0.0.1", resolve); });
    const origin = `http://127.0.0.1:${(application.server.address() as AddressInfo).port}`;
    const registered = await fetch(`${origin}/auth/register`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ handle: "bot_player", password: "bot-player-password" }) });
    const cookie = registered.headers.get("set-cookie")!.split(";", 1)[0]!;
    const post = (path: string, value: unknown) => fetch(`${origin}${path}`, { method: "POST", headers: { "content-type": "application/json", cookie, "x-writer-id": WRITER }, body: JSON.stringify(value) });

    // Availability is observed, not configured: the startup probe's Maia delivery flips baseline.
    type Row = { readonly reference: BotProfileReference; readonly startable: { readonly kind: string } };
    let roster: readonly Row[] = [];
    for (let attempt = 0; attempt < 100; attempt += 1) {
      roster = ((await (await fetch(`${origin}/capabilities`, { headers: { cookie } })).json()) as { policyProfiles: { human_common: { profiles: readonly Row[] } } }).policyProfiles.human_common.profiles;
      if (roster.find((row) => row.reference.id === "human-baseline.1400@1")?.startable.kind === "available") break;
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    expect(roster.find((row) => row.reference.id === "human-baseline.1400@1")?.startable).toEqual({ kind: "available" });
    expect(roster.find((row) => row.reference.id === "guarded-human.1400@1")?.startable).toEqual({ kind: "conditional", conditions: ["guard_release_receipt_absent"] });

    const reference = roster.find((row) => row.reference.id === "human-baseline.1800@1")!.reference;
    const created = await post("/runs", createBody("app-bot", { mode: "human_common", profile: reference }));
    expect(created.status, await created.clone().text()).toBe(201);
    const run = ((await created.json()) as { run: DrillRun }).run;
    const played = await post("/runs/app-bot/opponent-ply", plyBody(run, requestId("app")));
    expect(played.status, await played.clone().text()).toBe(200);
    const resumed = ((await (await fetch(`${origin}/runs/app-bot/events`, { headers: { cookie } })).json()) as { events: DrillRunEvent[] }).events;
    const replay = projectRun(resumed);
    expect(replay.opponentPolicy.profile).toEqual(reference);
    expect(replay.nodes.filter((node) => node.actor === "opponent")).toHaveLength(1);
    const rematch = await post("/runs/app-bot/duplicate", { id: "app-bot-again", seed: 12 });
    expect(rematch.status, await rematch.clone().text()).toBe(201);
    expect(((await rematch.json()) as { run: DrillRun }).run.opponentPolicy.profile).toEqual(reference);
  }, 60_000);
});
