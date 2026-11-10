// Foundation §3.8e: real retained profile-opponent decisions, never predicted bot choices.
import { afterEach, describe, expect, it, vi } from "vitest";
import { catalogEntryFor, runEventHeadDigest, projectRun, readBackReplay, commitMove, branchPath, type DeclaredEvidence, type EvidencePayload,
  type DrillRunEvent, type OpponentMoveSelectedEvent, type OpponentSelectionPolicy } from "@chess-tabiya/runtime";
import { mirrorSemanticFen, mirrorSemanticUci } from "../../../packages/runtime/src/semantic-validation.js";
import { invokeEvidenceValueRoute } from "../../../packages/runtime/src/internal/evidence-value-routes.js";
import { readRecordedStyleOccurrence, readContextualFoundationOccurrence } from "../../../packages/runtime/src/recorded-foundation-occurrence.js";
import { evidenceDigest, evidenceValueReceipt } from "../../../packages/runtime/src/evidence-contract.js";
import { RECORDED_FOUNDATION_SOURCE_AUTHORITY } from "../../../packages/runtime/src/recorded-foundation-source-authority.js";
import { APPLICATION_PROVIDER_BOUNDS } from "./application.js";
import { BotOpponentProviders, parseStoredBotEnvelope } from "./bot-opponent-operation.js";
import { BotProviderAvailability } from "./bot-opponent-source.js";
import { MockProviderEngineClient } from "./mock-provider-engine.js";
import { ProviderRegistry } from "./provider-health.js";
import { composeProviderTraversalApplication } from "./provider-traversal.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";
import { EvidenceJobQueue, type EvidenceExecutor, type EvidenceJob } from "./evidence-queue.js";

const at = "2026-11-05T00:00:00.000Z";
const principal = { learnerId: "recorded-bot-owner", handle: "recorded-bot-owner" };
const lease = { learnerId: principal.learnerId, writerId: "recorded-bot-writer" };
const FEN = "r3k2r/pb3pbp/1pn2np1/8/8/1PN2NP1/PBQ1PPBP/R3K2R w KQkq - 0 1";
const stores: SQLiteRunStorage[] = [];
const queues: EvidenceJobQueue[] = [];
afterEach(async () => { vi.restoreAllMocks(); for (const queue of queues.splice(0)) await queue.close(); for (const storage of stores.splice(0)) storage.close(); });
class FixtureEvidence implements EvidenceExecutor {
  readonly instanceId = "recorded-bot-test-evidence";
  async execute(job: EvidenceJob): Promise<EvidencePayload> {
    return { kind: job.kind, source: "engine_validated", values: { engineId: this.instanceId,
      requestedMovetimeMs: 1, centipawns: 0, perspective: "white" } };
  }
}
function available<T>(result: { kind: "available"; value: T } | { kind: "unavailable"; reason: string }): T {
  if (result.kind !== "available") throw Error(result.reason); return result.value;
}

async function fixture(black = false, fen = FEN, id = "recorded-bot", profiled = true) {
  const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {}, now: () => at }); stores.push(storage);
  storage.createLearner({ id: principal.learnerId, handle: principal.handle, passwordHash: "!", createdAt: at });
  const engine = new MockProviderEngineClient(), exchange = vi.spyOn(engine, "exchange");
  const availability = new BotProviderAvailability(new ProviderRegistry({ configured: [
    { instanceId: "maia-inference", implementation: "local_fixture", endpoint: "mock-maia", identity: "mock maia" },
    { instanceId: "stockfish-analysis", implementation: "local_fixture", endpoint: "mock-stockfish", identity: "mock stockfish" },
  ] }));
  const { scheduler } = composeProviderTraversalApplication({ engines: engine, tablebaseFetch: null,
    explorerFetch: null, explorerToken: null, bounds: APPLICATION_PROVIDER_BOUNDS });
  const providers = new BotOpponentProviders({ scheduler, availability, stockfishEngine: async () => {
    const identity = await engine.start("stockfish-analysis"); return { id: identity.id, version: identity.version };
  } });
  const queue = new EvidenceJobQueue(new FixtureEvidence(), { maxConcurrency: 1 }); queues.push(queue);
  const service = new RunService(storage, { evidenceQueue: queue, botOpponent: providers, botAvailability: () => availability.snapshot() });
  const startFen = black ? mirrorSemanticFen(fen, "color_and_vertical") : fen;
  const initial = await service.create({ id, session: { kind: "position",
    start: { fen: startFen, side: black ? "white" : "black" }, feedbackPolicy: "attempt_end",
    opponentPolicy: { mode: "human_common", ...(profiled ? { profile: catalogEntryFor("human-baseline.1400@1")!.reference } : {}) } },
    policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 7, createdAt: at }, lease);
  if (profiled) {
    const outcome = await service.botOpponentPly(initial.id, principal, lease.writerId, {
      requestId: "botreq_recorded_style_000001", expectedNodeId: initial.activeCursor.nodeId,
      expectedBranchId: initial.activeCursor.branchId, expectedEventHeadDigest: runEventHeadDigest(initial),
    }, at);
    expect(outcome.kind).toBe("committed");
  } else {
    const legal = invokeEvidenceValueRoute("rules.mobility.reading.legal_moves@1", { fen: initial.start.fen });
    const identity = await engine.start("maia-5m");
    service.opponentPly(initial.id, principal, lease.writerId, { moveUci: legal.payload.pieces.flatMap(piece => piece.moves)[0]!.uci,
      policyModeApplied: "human_common", engine: { id: identity.id, name: identity.name, version: identity.version, seedHonored: true } }, { at });
  }
  const run = storage.read(initial.id)!.run, abort = new AbortController();
  const prefix = service.resolveFoundationRecordedPrefix(run.id, principal,
    { branchId: run.activeCursor.branchId, throughNodeId: run.activeCursor.nodeId }, abort.signal);
  const decision = service.resolveFoundationRecordedDecision(prefix, initial.nodes[0]!.id);
  const position = invokeEvidenceValueRoute("rules.mobility.reading.legal_moves@1", { fen: initial.start.fen });
  const role = (moveUci: string) => available(invokeEvidenceValueRoute("rules.mobility.reading.candidate_role@1", { position, moveUci }));
  const child = run.nodes.find(node => node.id === run.activeCursor.nodeId)!;
  const selected = run.events.find(event => event.type === "opponent.move_selected")!;
  expect(selected.type).toBe("opponent.move_selected");
  if (selected.type !== "opponent.move_selected") throw Error("No original bot selection");
  if (profiled) parseStoredBotEnvelope(run, selected);
  return { storage, service, engine, exchange, initial, run, abort, prefix, decision, position, role, child, selected };
}

type Fixture = Awaited<ReturnType<typeof fixture>>;
function selectionWith(f: Fixture, policy: OpponentSelectionPolicy | undefined): OpponentMoveSelectedEvent {
  const { policy: _oldPolicy, ...selection } = f.selected.data.selection;
  return { ...f.selected, data: { ...f.selected.data, selection: { ...selection, ...(policy === undefined ? {} : { policy }) } } };
}
function rewrite(f: Fixture, update: (event: DrillRunEvent) => DrillRunEvent) {
  // Actual SQLite corruption/replacement, with a complete event-derived snapshot. No mocked source.
  const run = projectRun(f.run.events.map(update)); f.storage.save(run, lease); return run;
}
function capture(f: Fixture) {
  const run = f.storage.read(f.run.id)!.run;
  const prefix = f.service.resolveFoundationRecordedPrefix(run.id, principal,
    { branchId: run.activeCursor.branchId, throughNodeId: run.activeCursor.nodeId }, f.abort.signal);
  const decision = f.service.resolveFoundationRecordedDecision(prefix, f.initial.nodes[0]!.id);
  return f.service.contextualizeFoundationRecordedValue(f.role(f.child.moveUci!), { kind: "candidate", decision });
}

describe("actual retained profile-bot style context", () => {
  it.each(["explicit", "automatic"] as const)("retains an actual bot move on an %s fork with an inherited BEFORE node", async mode => {
    const f = await fixture();
    if (mode === "explicit") f.service.fork(f.run.id, principal, lease.writerId, f.initial.nodes[0]!.id, { at });
    else f.service.rewind(f.run.id, principal, lease.writerId, { nodeId: f.initial.nodes[0]!.id, branchId: f.initial.activeCursor.branchId }, at);
    const before = f.storage.read(f.run.id)!.run;
    const outcome = await f.service.botOpponentPly(before.id, principal, lease.writerId, {
      requestId: "botreq_recorded_style_000003", expectedNodeId: before.activeCursor.nodeId,
      expectedBranchId: before.activeCursor.branchId, expectedEventHeadDigest: runEventHeadDigest(before),
    }, at);
    expect(outcome.kind).toBe("committed");
    const run = f.storage.read(f.run.id)!.run, child = run.nodes.find(node => node.id === run.activeCursor.nodeId)!;
    const parent = branchPath(run, child.branchId).find(node => node.id === child.parentId)!;
    expect(parent.branchId).not.toBe(child.branchId);
    const selected = run.events.filter((event): event is OpponentMoveSelectedEvent => event.type === "opponent.move_selected").at(-1)!;
    expect(selected.type).toBe("opponent.move_selected"); if (selected.type !== "opponent.move_selected") throw Error("No actual selection");
    expect(selected.data.branchId).toBe(child.branchId); parseStoredBotEnvelope(run, selected);
    const prefix = f.service.resolveFoundationRecordedPrefix(run.id, principal,
      { branchId: child.branchId, throughNodeId: child.id }, f.abort.signal);
    const decision = f.service.resolveFoundationRecordedDecision(prefix, parent.id);
    const result = f.service.contextualizeFoundationRecordedValue(f.role(child.moveUci!), { kind: "candidate", decision });
    expect(result.kind).toBe("available"); if (result.kind !== "available") throw Error(result.reason);
    expect(readRecordedStyleOccurrence(result.occurrence).image).toMatchObject({ actorClass: "opponent",
      decisionNodeId: parent.id, eventSeq: selected.seq + 1, subject: { chosenUci: child.moveUci, disposition: "chosen" } });
  });
  it("refuses the learner-side baseline and own-side context at the private issuer", async () => {
    const f = await fixture();
    expect(() => RECORDED_FOUNDATION_SOURCE_AUTHORITY.issueOccurrenceContext(f.decision, { kind: "baseline" }, "opponent", () => {})).toThrow(/baseline/u);
    const run = rewrite(f, event => event.type === "run.started" ? { ...event, data: { ...event.data,
      start: { ...event.data.start, side: "white" } } } : event);
    const prefix = f.service.resolveFoundationRecordedPrefix(run.id, principal,
      { branchId: run.activeCursor.branchId, throughNodeId: run.activeCursor.nodeId }, f.abort.signal);
    const decision = f.service.resolveFoundationRecordedDecision(prefix, run.nodes[0]!.id);
    expect(() => RECORDED_FOUNDATION_SOURCE_AUTHORITY.issueOccurrenceContext(decision, { kind: "candidate" }, "opponent", () => {})).toThrow(/learner side/u);
  });
  it("does not turn a hypothetical alternative child into the actual reached position", async () => {
    const f = await fixture();
    const alternative = f.position.payload.pieces.flatMap(piece => piece.moves).find(move => move.uci !== f.child.moveUci)!;
    const hypothetical = commitMove(f.initial, alternative.uci, { at }).run.nodes.at(-1)!;
    expect(hypothetical.fen).not.toBe(f.child.fen);
    const value = invokeEvidenceValueRoute("rules.structural.reading.fianchetto_setup@1", { fen: hypothetical.fen });
    expect(() => f.service.contextualizeFoundationRecordedValue(value, { kind: "position", decision: f.decision, positionPhase: "after" })).toThrow(/position/u);
  });
  it("rejects a different real bot decision from the same run after complete replay", async () => {
    const f = await fixture();
    const reply = invokeEvidenceValueRoute("rules.mobility.reading.legal_moves@1", { fen: f.child.fen }).payload.pieces.flatMap(piece => piece.moves)[0]!.uci;
    f.service.move(f.run.id, principal, lease.writerId, reply, { at });
    const before = f.storage.read(f.run.id)!.run, beforeNode = before.activeCursor.nodeId;
    const outcome = await f.service.botOpponentPly(before.id, principal, lease.writerId, {
      requestId: "botreq_recorded_style_000002", expectedNodeId: beforeNode, expectedBranchId: before.activeCursor.branchId,
      expectedEventHeadDigest: runEventHeadDigest(before),
    }, at);
    expect(outcome.kind).toBe("committed");
    const original = f.storage.read(f.run.id)!.run;
    const selected = original.events.filter((event): event is OpponentMoveSelectedEvent => event.type === "opponent.move_selected").at(-1)!;
    expect(selected.seq).not.toBe(f.selected.seq);
    const replaced = projectRun(original.events.map(event => event.seq === selected.seq && event.type === "opponent.move_selected"
      ? { ...event, data: { ...event.data, selection: { ...event.data.selection, policy: f.selected.data.selection.policy! } } } : event));
    expect(readBackReplay(replaced.events).run).toEqual(replaced); f.storage.save(replaced, lease);
    const prefix = f.service.resolveFoundationRecordedPrefix(replaced.id, principal,
      { branchId: replaced.activeCursor.branchId, throughNodeId: replaced.activeCursor.nodeId }, f.abort.signal);
    const decision = f.service.resolveFoundationRecordedDecision(prefix, beforeNode);
    const position = invokeEvidenceValueRoute("rules.mobility.reading.legal_moves@1", { fen: before.nodes.find(node => node.id === beforeNode)!.fen });
    const value = available(invokeEvidenceValueRoute("rules.mobility.reading.candidate_role@1", { position,
      moveUci: replaced.nodes.find(node => node.id === replaced.activeCursor.nodeId)!.moveUci! }));
    expect(() => f.service.contextualizeFoundationRecordedValue(value, { kind: "candidate", decision })).toThrow(/root.*event.*position/u);
  });
  for (const black of [false, true]) it(`retains empty ${black ? "black" : "white"} snapshots as real absence`, async () => {
    const f = await fixture(black, "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
    const setup = invokeEvidenceValueRoute("rules.structural.reading.fianchetto_setup@1", { fen: f.initial.start.fen });
    const screen = available(invokeEvidenceValueRoute("rules.structural.reading.fianchetto_knight_screen@1", { source: setup }));
    expect(setup.payload.setups).toEqual([]); expect(screen.payload.screens).toEqual([]);
    for (const value of [setup, screen] as readonly DeclaredEvidence<unknown>[]) {
      const result = f.service.contextualizeFoundationRecordedValue(value, { kind: "position", decision: f.decision, positionPhase: "before" });
      expect(result.kind).toBe("available"); if (result.kind !== "available") throw Error(result.reason);
      expect(readRecordedStyleOccurrence(result.occurrence).value).toBe(value);
    }
    expect(available(invokeEvidenceValueRoute("rules.mobility.reading.early_queen_move@1", {
      decision: f.decision, candidate: f.role(f.child.moveUci!) }))).toEqual([]);
  });
  it("keeps an actual unprofiled legacy opponent explicitly unsupported", async () => {
    const f = await fixture(false, FEN, "recorded-legacy-opponent", false);
    expect(f.run.opponentPolicy.profile).toBeUndefined(); expect(f.selected.data.selection.policy).toBeUndefined();
    expect(capture(f)).toEqual({ kind: "unavailable", reason: "unsupported_actor_context" });
  });
  it("refuses a profile selection with its policy removed instead of treating it as legacy", async () => {
    const f = await fixture();
    const run = rewrite(f, event => event.seq === f.selected.seq ? selectionWith(f, undefined) : event);
    expect(readBackReplay(run.events).run).toEqual(run);
    expect(() => capture(f)).toThrow(/profile.*policy/u);
  });
  it("refuses a stored profile substitution after successful event replay", async () => {
    const f = await fixture();
    const run = rewrite(f, event => event.type === "run.started" ? { ...event, data: { ...event.data,
      opponentPolicy: { ...event.data.opponentPolicy, profile: catalogEntryFor("human-baseline.1800@1")!.reference } } } : event);
    expect(readBackReplay(run.events).run).toEqual(run);
    expect(() => capture(f)).toThrow(/profile|catalog|decision|replay|digest/iu);
  });
  it("refuses a genuine foreign run's envelope even on an identical legal position", async () => {
    const f = await fixture(), other = await fixture(false, FEN, "recorded-other-bot");
    expect(f.initial.start.fen).toBe(other.initial.start.fen);
    const run = rewrite(f, event => event.seq === f.selected.seq ? selectionWith(f, other.selected.data.selection.policy) : event);
    expect(readBackReplay(run.events).run).toEqual(run);
    expect(() => capture(f)).toThrow(/root.*event.*position/u);
  });
  it.each(["decision", "operation", "delivery"] as const)("refuses replayable stored %s corruption without requesting providers", async field => {
    const f = await fixture(), policy = f.selected.data.selection.policy!;
    const changed: OpponentSelectionPolicy = field === "decision" ? { ...policy, decision: { ...policy.decision, chosenMoveUci: "a1a8" } }
      : field === "operation" ? { ...policy, operation: { ...policy.operation, committedEventSequence: f.selected.seq + 1 } }
        : { ...policy, deliveries: { ...policy.deliveries, maia: { ...policy.deliveries.maia, operation: "stockfish.legal_root_table@1" } } };
    const run = rewrite(f, event => event.seq === f.selected.seq ? selectionWith(f, changed) : event);
    expect(readBackReplay(run.events).run).toEqual(run);
    const calls = f.exchange.mock.calls.length;
    expect(() => capture(f)).toThrow(); expect(f.exchange.mock.calls.length).toBe(calls);
  });
  it("retires observed bot proof failure even after the exact original stored image is restored", async () => {
    const f = await fixture(), result = capture(f);
    expect(result.kind).toBe("available"); if (result.kind !== "available") throw Error(result.reason);
    const policy = f.selected.data.selection.policy!;
    rewrite(f, event => event.seq === f.selected.seq ? selectionWith(f, { ...policy, operation: { ...policy.operation, committedEventSequence: 999 } }) : event);
    expect(() => readRecordedStyleOccurrence(result.occurrence)).toThrow();
    f.storage.save(f.run, lease);
    expect(() => readRecordedStyleOccurrence(result.occurrence)).toThrow(/retired/u);
    const fresh = capture(f); expect(fresh.kind).toBe("available");
    if (fresh.kind !== "available") throw Error(fresh.reason);
    expect(readRecordedStyleOccurrence(fresh.occurrence).image.actorClass).toBe("opponent");
  });
  it.each(["parent", "branch", "uci", "actor"] as const)("refuses a crossed original %s selection pair in the existing replay guard", async field => {
    const f = await fixture();
    if (field === "parent") {
      // The event projector rejects a selection referring to its not-yet-created child first.
      expect(() => rewrite(f, event => event.seq === f.selected.seq && event.type === "opponent.move_selected"
        ? { ...event, data: { ...event.data, nodeId: f.child.id } } : event)).toThrow(/Unknown node/u);
      return;
    }
    rewrite(f, event => event.seq === f.selected.seq && event.type === "opponent.move_selected"
      ? { ...event, data: { ...event.data,
        ...(field === "branch" ? { branchId: "foreign-branch" } : {}),
        ...(field === "uci" ? { moveUci: "a1a8", selection: { ...event.data.selection, moveUci: "a1a8" } } : {}) } }
      : field === "actor" && event.type === "move.committed" ? { ...event, data: { node: { ...event.data.node, actor: "user" } } } : event);
    expect(() => capture(f)).toThrow(/selection|opponent/iu);
  });
  it("refuses an own-side opponent even when the original selection pair replays", async () => {
    const f = await fixture();
    const run = rewrite(f, event => event.type === "run.started" ? { ...event, data: { ...event.data,
      start: { ...event.data.start, side: "white" } } } : event);
    expect(readBackReplay(run.events).run).toEqual(run);
    expect(() => capture(f)).toThrow(/opponent side/u);
  });
  it.each(["abort", "grant", "head", "account"] as const)("retires bot occurrence after actual %s authority change", async change => {
    const f = await fixture();
    const result = capture(f); expect(result.kind).toBe("available"); if (result.kind !== "available") throw Error(result.reason);
    if (change === "abort") f.abort.abort();
    if (change === "head") {
      const before = f.storage.read(f.run.id)!.run;
      const legal = invokeEvidenceValueRoute("rules.mobility.reading.legal_moves@1", { fen: f.child.fen });
      f.service.move(before.id, principal, lease.writerId, legal.payload.pieces.flatMap(piece => piece.moves)[0]!.uci, { at });
    }
    if (change === "grant") {
      f.storage.createLearner({ id: "new-bot-viewer", handle: "new-bot-viewer", passwordHash: "!", createdAt: at });
      // A separate real spectator context; owner grant management is not itself revocation.
      f.storage.grantRole(f.run.id, "new-bot-viewer", "spectator", lease, at);
      const abort = new AbortController(), prefix = f.service.resolveFoundationRecordedPrefix(f.run.id,
        { learnerId: "new-bot-viewer", handle: "new-bot-viewer" }, { branchId: f.run.activeCursor.branchId, throughNodeId: f.run.activeCursor.nodeId }, abort.signal);
      const decision = f.service.resolveFoundationRecordedDecision(prefix, f.initial.nodes[0]!.id);
      const other = f.service.contextualizeFoundationRecordedValue(f.role(f.child.moveUci!), { kind: "candidate", decision });
      expect(other.kind).toBe("available"); if (other.kind !== "available") throw Error(other.reason);
      f.storage.revokeGrant(f.run.id, "new-bot-viewer", lease);
      expect(() => readRecordedStyleOccurrence(other.occurrence)).toThrow();
      f.storage.grantRole(f.run.id, "new-bot-viewer", "spectator", lease, at);
      expect(() => readRecordedStyleOccurrence(other.occurrence)).toThrow(/retired/u);
      expect(readRecordedStyleOccurrence(result.occurrence).image.actorClass).toBe("opponent"); return;
    }
    if (change === "account") {
      f.storage.deleteLearner(principal.learnerId, at);
      expect(f.storage.learnerById(principal.learnerId)).toBeUndefined();
    }
    expect(() => readRecordedStyleOccurrence(result.occurrence)).toThrow();
  });
  for (const black of [false, true]) it(`binds all five nonbaseline refs to the actual ${black ? "black" : "white"} bot decision without reacquisition`, async () => {
    const f = await fixture(black), chosen = f.role(f.child.moveUci!);
    const alternativeUci = f.position.payload.pieces.flatMap(piece => piece.moves).find(move => move.uci !== f.child.moveUci)!.uci;
    const queen = f.role(black ? mirrorSemanticUci("c2c1", "color_and_vertical") : "c2c1");
    const pawn = f.role(black ? mirrorSemanticUci("e2e4", "color_and_vertical") : "e2e4");
    const centre = available(invokeEvidenceValueRoute("rules.mobility.reading.pawn_extended_center_destination@1", { source: pawn }))[0]!;
    const early = available(invokeEvidenceValueRoute("rules.mobility.reading.early_queen_move@1", { decision: f.decision, candidate: queen }))[0]!;
    const sources: readonly DeclaredEvidence<unknown>[] = [chosen, f.role(alternativeUci), centre, early];
    const bytes = JSON.stringify(f.storage.read(f.run.id)), calls = f.exchange.mock.calls.length;
    f.exchange.mockRejectedValue(new Error("Provider unavailable after the original commit"));
    for (const value of sources) {
      const result = f.service.contextualizeFoundationRecordedValue(value, { kind: "candidate", decision: f.decision });
      expect(result.kind).toBe("available"); if (result.kind !== "available") throw Error(result.reason);
      const retained = readRecordedStyleOccurrence(result.occurrence);
      expect(retained.value).toBe(value);
      expect(retained.image).toMatchObject({ actorClass: "opponent", actorSide: black ? "black" : "white",
        decisionClass: "played", eventSeq: f.selected.seq + 1, decisionNodeId: f.initial.nodes[0]!.id,
        sourceReceiptDigest: evidenceDigest(evidenceValueReceipt(value)),
        subject: { kind: "legal_candidate", chosenUci: f.child.moveUci } });
      expect(retained.image.subject).toMatchObject({ candidateUci: (value.payload as { moveUci: string }).moveUci,
        disposition: (value.payload as { moveUci: string }).moveUci === f.child.moveUci ? "chosen" : "alternative" });
      expect(() => readContextualFoundationOccurrence(result.occurrence)).toThrow(/clock/u);
    }
    for (const positionPhase of ["before", "after"] as const) {
      const member = positionPhase === "before" ? f.initial.nodes[0]! : f.child;
      const setup = invokeEvidenceValueRoute("rules.structural.reading.fianchetto_setup@1", { fen: member.fen });
      const screen = available(invokeEvidenceValueRoute("rules.structural.reading.fianchetto_knight_screen@1", { source: setup }));
      if (positionPhase === "before") { expect(setup.payload.setups).toHaveLength(4); expect(screen.payload.screens).toHaveLength(4); }
      for (const value of [setup, screen] as readonly DeclaredEvidence<unknown>[]) {
        const result = f.service.contextualizeFoundationRecordedValue(value, { kind: "position", decision: f.decision, positionPhase });
        expect(result.kind).toBe("available"); if (result.kind !== "available") throw Error(result.reason);
        expect(readRecordedStyleOccurrence(result.occurrence)).toMatchObject({ value, image: { actorClass: "opponent",
          actorSide: black ? "black" : "white", subject: { kind: "actual_position", positionPhase, positionNodeId: member.id } } });
      }
    }
    expect(f.exchange.mock.calls.length).toBe(calls); expect(JSON.stringify(f.storage.read(f.run.id))).toBe(bytes);
  });
});
