import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import { attachEvidence, branchPath, commitMove, compileAssistanceRequest, createRun, fork, moduleDecisionStamp, revealFeedback, rewind,
  reviewText, serverAvailabilityFromProviders } from "@chess-tabiya/runtime";
import type { CampaignDocument } from "@chess-tabiya/runtime";
import * as runtime from "@chess-tabiya/runtime";
import * as routes from "../../../packages/runtime/src/internal/evidence-value-routes.js";
import * as sources from "../../../packages/runtime/src/recorded-analyze-line.js";
import * as providers from "../../../packages/runtime/src/provider-exchange.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";
import { CampaignRegistry } from "./campaign-registry.js";
import { CampaignService } from "./campaign-service.js";
import { PackRegistry } from "./pack-registry.js";
import { withDerivedRequires } from "./capability/pack-capabilities.js";
import { orchestratePackMove } from "./pack-orchestrator.js";
import { historicalInspectorIntent, historicalInspectorTarget, parseInspectorAssistanceResponse } from "../../web/src/lib/historical-inspector.js";

const at = "2026-11-03T02:00:00.000Z", owner = { learnerId: "confirm-owner", handle: "confirm-owner" }, reader = { learnerId: "confirm-reader", handle: "confirm-reader" };
const availability = serverAvailabilityFromProviders({ opponent: "none", judge: "none", llm: "none", corpus: "none", tts: "none", tablebase: "none" });
const requested = compileAssistanceRequest({ contextHint: "position", preference: { kind: "explicit", preset: "analysis", overrides: {}, moduleOverrides: { include: [], exclude: [] } } });
const stores: SQLiteRunStorage[] = [];
afterEach(() => { vi.restoreAllMocks(); for (const storage of stores.splice(0)) storage.close(); });
function fixture(side: "white" | "black" = "white", disclosed = true) {
  const fen = `rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR ${side === "white" ? "w" : "b"} KQkq - 0 1`;
  let run = createRun({ id: `analyze-confirm-${side}`, session: { kind: "position", start: { fen, side }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } },
    sessionDigest: `sha256:${"a".repeat(64)}`, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1, createdAt: at });
  for (const uci of side === "white" ? ["e2e4", "e7e5", "g1f3"] : ["e7e5", "e2e4", "g8f6"]) run = commitMove(run, uci, { at }).run;
  if (disclosed) run = revealFeedback(run, at).run;
  const path = branchPath(run, run.activeCursor.branchId), storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} }); stores.push(storage);
  for (const principal of [owner, reader]) storage.createLearner({ id: principal.learnerId, handle: principal.handle, passwordHash: "!", createdAt: at });
  const lease = { learnerId: owner.learnerId, writerId: "confirmation-writer" }; storage.create(run, lease); storage.grantRole(run.id, reader.learnerId, "host", lease, at);
  const service = new RunService(storage), controller = new AbortController();
  const body = { assistance: requested, review: { branchId: run.activeCursor.branchId, nodeId: path[1]!.id, entryNodeId: path[0]!.id, decisionDigest: moduleDecisionStamp(run).digest } };
  const confirm = (input: unknown = body, principal = owner) => service.confirmRecordedAnalyzeAssistance(run.id, principal, input, availability, controller.signal);
  return { run, path, storage, lease, service, controller, body, confirm };
}
function sourceSpies() {
  return { dispatch: vi.spyOn(routes, "invokeEvidenceValueRoute"), collect: vi.spyOn(sources, "collectRecordedAnalyzeLine"),
    select: vi.spyOn(sources, "selectRecordedAnalyzeMetadata"), parse: vi.spyOn(providers, "parsePersistedProviderDelivery") };
}
function expectNoSource(spies: ReturnType<typeof sourceSpies>) { for (const spy of Object.values(spies)) expect(spy).not.toHaveBeenCalled(); }

async function importedRecordedFixture() {
  const f = fixture(), lease = { writerId: "preserved-analyze-writer", learnerId: owner.learnerId };
  const imported = await f.service.importGame({ id: "preserved-recorded-analyze", side: "white", opponentPolicy: { mode: "human_common" },
    policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 3,
    source: { kind: "pgn", pgn: "[Result \"1-0\"]\n\n1. e4 e5 2. Nf3 Nc6 1-0" }, createdAt: at }, lease);
  const path = branchPath(imported.run, imported.run.branches[0]!.id), branchId = imported.run.branches[0]!.id;
  let run = attachEvidence(imported.run, path[0]!.id, ["recorded:preserved-pv"], { kind: "bestline", source: "engine_validated",
    values: { engineId: "stockfish-test", requestedDepth: 18, movesUci: ["e2e4", "e7e5", "g1f3"] } }, at).run;
  run = attachEvidence(run, path[1]!.id, ["recorded:preserved-other-entry"], { kind: "bestline", source: "engine_validated",
    values: { engineId: "stockfish-test", requestedMovetimeMs: 100, movesUci: ["c7c5"] } }, at).run;
  run = revealFeedback(run, at).run; f.storage.save(run, lease);
  const intent = compileAssistanceRequest({ contextHint: "imported", preference: { kind: "explicit", preset: "analysis", overrides: {}, moduleOverrides: { include: [], exclude: [] } } });
  return { storage: f.storage, service: f.service, controller: f.controller, lease, run, path, branchId, intent };
}

describe("independent source-free recorded Analyze confirmation", () => {
  it.each(["white", "black"] as const)("confirms actual disclosed unfinished %s target without source/factory/provider work or writes", side => {
    const f = fixture(side), before = JSON.stringify(f.storage.read(f.run.id)), spies = sourceSpies();
    const result = f.confirm();
    expect(result.review).toEqual({ runId: f.run.id, branchId: f.body.review.branchId, nodeId: f.path[1]!.id,
      entryNodeId: f.path[0]!.id, fen: f.path[1]!.fen, decision: moduleDecisionStamp(f.run) });
    expect(result.assistance.context).toBe("position"); expect(result.assistance.requestedDigest).toBe(requested.requestDigest);
    expect(result.assistance.modules).toContain("full_inspector"); expectNoSource(spies);
    expect(f.run.events.some(event => event.type === "outcome.reached")).toBe(false);
    expect(JSON.stringify(f.storage.read(f.run.id))).toBe(before);
  });

  it.each(["parent", "node", "branch", "stamp", "root"] as const)("refuses a wrong %s without source work", fault => {
    const f = fixture(), spies = sourceSpies(), body = structuredClone(f.body);
    if (fault === "parent") body.review.entryNodeId = f.path[2]!.id;
    if (fault === "node") body.review.nodeId = "foreign-node";
    if (fault === "branch") body.review.branchId = "foreign-branch";
    if (fault === "stamp") body.review.decisionDigest = `sha256:${"0".repeat(64)}`;
    if (fault === "root") { body.review.nodeId = f.path[0]!.id; body.review.entryNodeId = f.path[0]!.id; }
    expect(() => f.confirm(body)).toThrow(); expectNoSource(spies);
  });

  it("does not authorize undisclosed unfinished Play or accept a context hint as access", () => {
    const f = fixture("white", false), spies = sourceSpies();
    expect(() => f.confirm()).toThrow();
    const imported = compileAssistanceRequest({ contextHint: "imported", preference: { kind: "explicit", preset: "analysis", overrides: {}, moduleOverrides: { include: [], exclude: [] } } });
    expect(() => f.confirm({ ...f.body, assistance: imported })).toThrow(); expectNoSource(spies);
  });

  it.each(["revoke", "spectator"] as const)("refuses actual %s before a context or source can be used", fault => {
    const f = fixture(), spies = sourceSpies();
    if (fault === "revoke") f.storage.revokeGrant(f.run.id, reader.learnerId, f.lease);
    else f.storage.grantRole(f.run.id, reader.learnerId, "spectator", f.lease, at);
    expect(() => f.confirm(f.body, reader)).toThrow(); expectNoSource(spies);
  });

  it("confirms a genuine historical imported branch while active Play is closed, without borrowing its active target", async () => {
    const f = fixture(), lease = { writerId: "confirm-import-writer", learnerId: owner.learnerId };
    const imported = await f.service.importGame({ id: "confirm-imported-history", side: "white", opponentPolicy: { mode: "human_common" },
      policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 3,
      source: { kind: "pgn", pgn: "[Result \"1-0\"]\n\n1. e4 e5 2. Nf3 Nc6 1-0" }, createdAt: at }, lease);
    const mainline = revealFeedback(imported.run, at).run, branchId = mainline.branches[0]!.id, path = branchPath(mainline, branchId);
    let current = fork(rewind(mainline, path[2]!.id, at, undefined, branchId).run, path[2]!.id, { at }).run;
    current = commitMove(current, "f1c4", { at }).run; f.storage.save(current, lease);
    expect(f.service.assistanceAuthority(current.id, owner).access.deliveryOpen).toBe(false);
    const intent = compileAssistanceRequest({ contextHint: "imported", preference: { kind: "explicit", preset: "analysis", overrides: {}, moduleOverrides: { include: [], exclude: [] } } });
    const body = { assistance: intent, review: { branchId, nodeId: path[2]!.id, entryNodeId: path[1]!.id, decisionDigest: moduleDecisionStamp(current).digest } };
    const spies = sourceSpies(), before = JSON.stringify(f.storage.read(current.id));
    const confirmed = f.service.confirmRecordedAnalyzeAssistance(current.id, owner, body, availability, f.controller.signal);
    expect(confirmed.review).toMatchObject({ runId: current.id, branchId, nodeId: path[2]!.id, entryNodeId: path[1]!.id, fen: path[2]!.fen });
    expect(confirmed.assistance.context).toBe("imported"); expect(confirmed.assistance.modules).toContain("full_inspector");
    const active = branchPath(current, current.activeCursor.branchId), activeTarget = { ...body, review: { ...body.review,
      branchId: current.activeCursor.branchId, nodeId: active.at(-1)!.id, entryNodeId: active.at(-2)!.id } };
    expect(() => f.service.confirmRecordedAnalyzeAssistance(current.id, owner, activeTarget, availability, f.controller.signal)).toThrow();
    expectNoSource(spies); expect(JSON.stringify(f.storage.read(current.id))).toBe(before);
  });

  it.each(["revoke", "role", "storage", "cancel"] as const)("refuses actual %s after the genuine context has been captured", fault => {
    const f = fixture(), spies = sourceSpies(), resolve = f.service.resolveInspectorRecordedContext.bind(f.service);
    vi.spyOn(f.service, "resolveInspectorRecordedContext").mockImplementationOnce((...args) => {
      const context = resolve(...args);
      if (fault === "revoke") f.storage.revokeGrant(f.run.id, reader.learnerId, f.lease);
      if (fault === "role") f.storage.grantRole(f.run.id, reader.learnerId, "spectator", f.lease, at);
      if (fault === "storage") f.storage.save(attachEvidence(f.run, f.path[0]!.id, ["recorded:later"], { kind: "eval", source: "engine_validated", values: { centipawns: 1 } }, at).run, f.lease);
      if (fault === "cancel") f.controller.abort();
      return context;
    });
    expect(() => f.confirm(f.body, reader)).toThrow(); expectNoSource(spies);
  });

  it("refuses already cancelled requests before reading a real grant", () => {
    const f = fixture(), resolve = vi.spyOn(f.service, "resolveInspectorRecordedContext"), spies = sourceSpies();
    f.controller.abort(); expect(() => f.confirm()).toThrow(); expect(resolve).not.toHaveBeenCalled(); expectNoSource(spies);
  });

  it("withholds just the actual retry parent while permitting a different historical entry", () => {
    const f = fixture(), branchId = f.run.activeCursor.branchId;
    let run = fork(rewind(f.run, f.path[1]!.id, at, undefined, branchId).run, f.path[1]!.id, { at, label: "story-reentry" }).run;
    run = commitMove(run, "c7c5", { at }).run; run = revealFeedback(run, at).run; f.storage.save(run, f.lease);
    const body = { assistance: requested, review: { branchId, nodeId: f.path[2]!.id, entryNodeId: f.path[1]!.id, decisionDigest: moduleDecisionStamp(run).digest } }, spies = sourceSpies();
    expect(() => f.confirm(body)).toThrow("open retry entry");
    expect(f.confirm({ assistance: requested, review: { ...body.review, nodeId: f.path[1]!.id, entryNodeId: f.path[0]!.id } }).review.nodeId).toBe(f.path[1]!.id);
    expectNoSource(spies);
  });

  it.each(["extra", "hidden", "symbol", "inherited", "getter"] as const)("refuses non-data envelope %s before reading it", fault => {
    const f = fixture(), body = structuredClone(f.body), get = vi.fn(() => body.review), spies = sourceSpies();
    let input: unknown = body;
    if (fault === "extra") Object.assign(body, { extra: true });
    if (fault === "hidden") Object.defineProperty(body, "hidden", { value: true });
    if (fault === "symbol") Object.defineProperty(body, Symbol("hidden"), { value: true });
    if (fault === "inherited") input = Object.create(body);
    if (fault === "getter") Object.defineProperty(body, "review", { enumerable: true, get });
    expect(() => f.confirm(input)).toThrow(); expect(get).not.toHaveBeenCalled(); expectNoSource(spies);
  });

  // D4012 was ledgered before these falsifiers; the same existing Inspector snapshot grammar
  // must protect nested intent, not merely its outer recorded-target envelope.
  it.each(["getter", "hidden", "symbol", "prototype"] as const)("refuses nested requested intent %s without executing accessors", fault => {
    const f = fixture(), body = structuredClone(f.body), stage = body.assistance.stage, get = vi.fn(() => stage), spies = sourceSpies();
    if (fault === "getter") Object.defineProperty(body.assistance, "stage", { enumerable: true, get });
    if (fault === "hidden") Object.defineProperty(body.assistance, "hidden", { value: true });
    if (fault === "symbol") Object.defineProperty(body.assistance, Symbol("hidden"), { value: true });
    if (fault === "prototype") Object.setPrototypeOf(body.assistance, { foreign: true });
    expect(() => f.confirm(body)).toThrow(); expect(get).not.toHaveBeenCalled(); expectNoSource(spies);
  });

  it("ordinary Review adds only actual decision/context metadata, never an Analyze line", async () => {
    const f = fixture(), before = JSON.stringify(f.storage.read(f.run.id)), collect = vi.spyOn(sources, "collectRecordedAnalyzeLine"), select = vi.spyOn(sources, "selectRecordedAnalyzeMetadata");
    const review = await f.service.review(f.run.id, owner, f.run.activeCursor.branchId, f.controller.signal);
    expect(review.decision).toEqual(moduleDecisionStamp(f.run)); expect(review.workflowContext).toBe("position");
    expect(review.rows[0]).toMatchObject({ nodeId: f.path[1]!.id, entryNodeId: f.path[0]!.id, fen: f.path[1]!.fen });
    expect(JSON.stringify(review)).not.toMatch(/"(?:movesUci|bestMoveUci|providerLineDelivery|analysis_typed_pv)"/u);
    expect(collect).not.toHaveBeenCalled(); expect(select).not.toHaveBeenCalled(); expect(JSON.stringify(f.storage.read(f.run.id))).toBe(before);
  });

  // D4014 was ledgered before these actual late authority/storage publication controls.
  it.each(["storage", "revoke"] as const)("rechecks the actual map owner after %s changes during final workflow authority read", async fault => {
    const f = fixture(), authority = f.service.assistanceAuthority.bind(f.service), principal = reader, projection = runtime.reviewMapProjection;
    let projectionReturned = false, lateReads = 0, changed = false;
    vi.spyOn(runtime, "reviewMapProjection").mockImplementationOnce(input => { const result = projection(input); projectionReturned = true; return result; });
    vi.spyOn(f.service, "assistanceAuthority").mockImplementation((...args) => {
      const actual = authority(...args);
      // The first authority read after actual projection return belongs to the existing
      // final grade-owner read; the next is the new workflow metadata acquisition itself.
      if (projectionReturned && ++lateReads === 2) {
        if (fault === "storage") f.storage.save(attachEvidence(f.run, f.path[0]!.id, ["recorded:late-workflow-head"], { kind: "eval", source: "engine_validated", values: { centipawns: 2 } }, at).run, f.lease);
        else f.storage.revokeGrant(f.run.id, principal.learnerId, f.lease);
        changed = true;
      }
      return actual;
    });
    let refused: unknown;
    try { await f.service.review(f.run.id, principal, f.run.activeCursor.branchId, f.controller.signal); }
    catch (error) { refused = error; }
    expect(projectionReturned).toBe(true); expect(lateReads).toBeGreaterThanOrEqual(2); expect(changed).toBe(true);
    if (fault === "storage") expect(moduleDecisionStamp(f.storage.read(f.run.id)!.run)).not.toEqual(moduleDecisionStamp(f.run));
    else expect(() => authority(f.run.id, principal)).toThrow();
    expect(refused).toBeDefined();
  });

  it("fixed empty/deferred/unavailable wording does not invent an engine judgment or disclose a line", () => {
    expect(reviewText("analysis.empty")).toBe("The selected saved engine report records no moves.");
    expect(reviewText("analysis.deferred")).toBe("The recorded engine line exceeds this view's display limit. It has not been shortened.");
    expect(reviewText("analysis.unavailable")).toBe("This recorded line is unavailable for the current review.");
  });

  // Transferred from the retired runtime reviewAnalysis's synthetic viewer arguments. These
  // now exercise actual saved grants/workflows; no legacy-shaped result/admission shim exists.
  it.each(["spectator", "participant"] as const)("preserves imported Analyze %s refusal through actual current grants without source leakage", async role => {
    const f = await importedRecordedFixture(); f.storage.grantRole(f.run.id, reader.learnerId, role, f.lease, at);
    const body = { assistance: f.intent, review: { branchId: f.branchId, nodeId: f.path[1]!.id, entryNodeId: f.path[0]!.id, decisionDigest: moduleDecisionStamp(f.run).digest } }, spies = sourceSpies();
    let refused: unknown;
    try { f.service.confirmRecordedAnalyzeAssistance(f.run.id, reader, body, availability, f.controller.signal); }
    catch (error) { refused = error; }
    expect(refused).toMatchObject({ code: "ASSISTANCE_WITHHELD" });
    expect(JSON.stringify(refused)).not.toMatch(/stockfish-test|2\. Nf3|"moves"/u); expectNoSource(spies);
    expect(() => f.service.resolveInspectorRecordedContext(f.run.id, reader, f.intent, availability,
      { branchId: f.branchId, nodeId: f.path[1]!.id, decisionDigest: moduleDecisionStamp(f.run).digest, context: { kind: "incoming_edge" } }, f.controller.signal)).toThrow();
    expectNoSource(spies);
  });

  it("preserves the actual imported host positive through confirmation and the exact current source", async () => {
    const f = await importedRecordedFixture();
    f.storage.grantRole(f.run.id, reader.learnerId, "host", f.lease, at);
    expect(f.service.assistanceAuthority(f.run.id, reader).access.role).toBe("host");
    const before = JSON.stringify(f.storage.read(f.run.id));
    const target = { branchId: f.branchId, nodeId: f.path[1]!.id, entryNodeId: f.path[0]!.id, decisionDigest: moduleDecisionStamp(f.run).digest };
    expect(f.service.confirmRecordedAnalyzeAssistance(f.run.id, reader, { assistance: f.intent, review: target }, availability, f.controller.signal).assistance.modules).toContain("full_inspector");
    const context = f.service.resolveInspectorRecordedContext(f.run.id, reader, f.intent, availability,
      { branchId: f.branchId, nodeId: target.nodeId, decisionDigest: target.decisionDigest, context: { kind: "incoming_edge" } }, f.controller.signal);
    expect(f.service.readInspectorRecordedContext(context).role).toBe("host");
    const image = f.service.readInspectorAnalyzeSource(f.service.acquireInspectorAnalyzeSource(context, "derived.review.analysis_recorded_pv@1", f.controller.signal));
    expect(image.outcome).toEqual({ kind: "available", collected: 1 }); expect(image.values[0]!.payload.operands).toMatchObject({ kind: "line", engine: { id: "stockfish-test" }, bound: { kind: "depth", requestedDepth: 18 } });
    expect(JSON.stringify(f.storage.read(f.run.id))).toBe(before);
  });

  it("preserves the academy ceiling through an actual live-session origin, not an arbitrary runtime session string", () => {
    const f = fixture(); f.storage.createLiveSession({ id: "preserved-academy", runId: f.run.id, kind: "academy", title: "Actual academy context",
      boardControl: "free_claim", createdBy: owner.learnerId, at });
    const intent = compileAssistanceRequest({ contextHint: "academy", preference: { kind: "explicit", preset: "guided", overrides: {}, moduleOverrides: { include: ["full_inspector"], exclude: [] } } }), spies = sourceSpies();
    expect(f.service.assistanceAuthority(f.run.id, owner).origin).toMatchObject({ liveKind: "academy" });
    expect(() => f.confirm({ ...f.body, assistance: intent })).toThrow(expect.objectContaining({ code: "ASSISTANCE_WITHHELD" })); expectNoSource(spies);
    expect(() => f.service.resolveInspectorRecordedContext(f.run.id, owner, intent, availability,
      { branchId: f.body.review.branchId, nodeId: f.body.review.nodeId, decisionDigest: f.body.review.decisionDigest, context: { kind: "incoming_edge" } }, f.controller.signal)).toThrow(expect.objectContaining({ reason: "withheld" }));
    expectNoSource(spies);
  });

  it("preserves actual imported retry withholding while still playing, other-entry access, and recovery after leaving", async () => {
    const f = await importedRecordedFixture();
    const opened = fork(rewind(f.run, f.path[0]!.id, at, undefined, f.branchId).run, f.path[0]!.id, { at, label: "story-reentry" }).run;
    const playing = commitMove(opened, "d2d4", { at }).run;
    const left = rewind(playing, f.path.at(-1)!.id, at, undefined, f.branchId).run;
    for (const [current, blocked] of [[opened, true], [playing, true], [left, false]] as const) {
      f.storage.save(current, f.lease);
      const body = { assistance: f.intent, review: { branchId: f.branchId, nodeId: f.path[1]!.id, entryNodeId: f.path[0]!.id, decisionDigest: moduleDecisionStamp(current).digest } };
      const spies = sourceSpies();
      if (blocked) {
        expect(() => f.service.confirmRecordedAnalyzeAssistance(current.id, owner, body, availability, f.controller.signal)).toThrow("open retry entry");
        const context = f.service.resolveInspectorRecordedContext(current.id, owner, f.intent, availability,
          { branchId: f.branchId, nodeId: f.path[1]!.id, decisionDigest: body.review.decisionDigest, context: { kind: "incoming_edge" } }, f.controller.signal);
        expect(() => f.service.acquireInspectorAnalyzeSource(context, "derived.review.analysis_recorded_pv@1", f.controller.signal)).toThrow(); expectNoSource(spies);
      } else {
        expect(f.service.confirmRecordedAnalyzeAssistance(current.id, owner, body, availability, f.controller.signal).review.nodeId).toBe(f.path[1]!.id);
        const context = f.service.resolveInspectorRecordedContext(current.id, owner, f.intent, availability,
          { branchId: f.branchId, nodeId: f.path[1]!.id, decisionDigest: body.review.decisionDigest, context: { kind: "incoming_edge" } }, f.controller.signal);
        expect(f.service.readInspectorAnalyzeSource(f.service.acquireInspectorAnalyzeSource(context, "derived.review.analysis_recorded_pv@1", f.controller.signal)).outcome.kind).toBe("available");
      }
      const other = f.service.resolveInspectorRecordedContext(current.id, owner, f.intent, availability,
        { branchId: f.branchId, nodeId: f.path[2]!.id, decisionDigest: body.review.decisionDigest, context: { kind: "incoming_edge" } }, f.controller.signal);
      expect(f.service.readInspectorAnalyzeSource(f.service.acquireInspectorAnalyzeSource(other, "derived.review.analysis_recorded_pv@1", f.controller.signal)).outcome.kind).toBe("available");
      vi.restoreAllMocks();
    }
  });

  it.each([false, true])("actual durable campaign issuance supplies campaign metadata and its earned ceiling (Inspector kit %s), never raw pack context or a copied receipt", async hasInspector => {
    // Mechanical existing campaign-document grammar + a legal two-ply transport pack; not a
    // strategic lesson or a hand-issued receipt. CampaignService issues from its actual SQLite cut.
    const document: DrillPackDefinition = {
      id: "analyze-confirmation-campaign-pack", version: "0.1.0", title: "Confirmation transport fixture", requires: [], mode: "outcome", phase: "middlegame",
      start: { fen: "4k3/8/8/8/8/8/7P/6K1 w - - 0 1", side: "white" },
      objective: { type: "play_until_checkpoint", summary: "Reach the mechanical fixture boundary.", successConditions: [{ kind: "reach_checkpoint", checkpointId: "finish" }] },
      spine: [{ id: "h3", moveUci: "h2h3", moveSan: "h3", children: [{ id: "reply", moveUci: "e8f8", moveSan: "Kf8", children: [] }] }],
      checkpoints: [{ id: "start", label: "Fixture segment start", trigger: { atStart: true }, actions: [] },
        { id: "finish", label: "Fixture boundary", trigger: { atSpineNode: "reply" }, actions: [] }],
      feedbackPolicy: "segment_end", opponentPolicy: { mode: "theory_strict" },
      provenance: { sources: ["Mechanical confirmation fixture, no strategic claim."], licence: "CC0-1.0", reviewStatus: "draft" },
    };
    const packs = await PackRegistry.fromDocuments([{ source: "analyze-confirmation-campaign", value: withDerivedRequires(document) }]);
    const originalCampaign = JSON.parse(readFileSync(new URL("../../../tests/browser/fixtures/campaign.browser.json", import.meta.url), "utf8")) as CampaignDocument;
    const campaign: CampaignDocument = hasInspector ? { ...originalCampaign, startingModules: ["full_inspector"] } : originalCampaign;
    for (const act of campaign.acts) for (const layer of act.layers) for (const node of layer.choices) Object.assign(node, { encounter: { kind: "pack", packId: document.id } });
    const registry = await CampaignRegistry.fromDocuments([{ source: "confirmation-campaign", value: campaign }], { get: id => packs.get(id)?.document });
    const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} }); stores.push(storage);
    storage.createLearner({ id: owner.learnerId, handle: owner.handle, passwordHash: "!", createdAt: at });
    const service = new RunService(storage, { packRegistry: packs });
    const campaigns = new CampaignService({ storage, packs, registry, runs: service,
      policyConfig: async () => ({ seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }), now: () => at });
    const id = campaigns.create(owner, campaign.id, { campaignVersion: campaign.version, commandId: "create-confirmation" }).campaign.campaignRun.id;
    await campaigns.start(owner, id, "f1-a", { expectedRevision: 1, commandId: "start-confirmation" }, "campaign-confirm-writer");
    const runId = storage.campaigns.run(id)!.activeEncounterRunId!, lease = { learnerId: owner.learnerId, writerId: "campaign-confirm-writer" };
    const original = storage.read(runId)!.run;
    expect(original.sessionKind).toBe("pack");
    let run = original;
    for (const uci of ["h2h3", "e8f8"]) run = orchestratePackMove(packs.get(document.id)!.document, run, commitMove(run, uci, { at })).run;
    storage.save(run, lease);
    const receipt = campaigns.assistanceReceipt(runId, owner.learnerId)!;
    expect(receipt.subject.playRunId).toBe(runId); expect(receipt.modules.effective.includes("full_inspector")).toBe(hasInspector);
    const review = await service.review(runId, owner, run.activeCursor.branchId);
    expect(review.workflowContext).toBe("campaign"); expect(review.decision).toEqual(moduleDecisionStamp(run));
    const path = branchPath(run, run.activeCursor.branchId), intent = compileAssistanceRequest({ contextHint: "campaign", preference: { kind: "explicit", preset: "analysis", overrides: {}, moduleOverrides: { include: [], exclude: [] } } });
    const body = { assistance: intent, review: { branchId: run.activeCursor.branchId, nodeId: path[1]!.id, entryNodeId: path[0]!.id, decisionDigest: review.decision.digest } };
    const spies = sourceSpies(), before = JSON.stringify(storage.read(runId));
    const historical = { assistance: intent, inspector: { branchId: run.activeCursor.branchId, nodeId: path[0]!.id, decisionDigest: review.decision.digest } };
    if (hasInspector) {
      expect(service.confirmRecordedAnalyzeAssistance(runId, owner, body, availability, new AbortController().signal).assistance.context).toBe("campaign");
      const target = historicalInspectorTarget(run, run.activeCursor.branchId, path[0]!.id, "campaign"), requested = historicalInspectorIntent(target);
      const confirmed = service.confirmRecordedInspectorAssistance(runId, owner, { ...historical, assistance: requested }, availability, new AbortController().signal);
      const wire = JSON.parse(JSON.stringify(confirmed));
      expect(parseInspectorAssistanceResponse(wire, target, requested).campaignReceipt).toEqual({ receiptDigest: receipt.receiptDigest, inventoryEventSeq: receipt.subject.inventoryEventSeq, phase: receipt.phase });
      delete wire.assistance.campaignReceipt;
      const { finalDigest: _old, ...summary } = wire.assistance; wire.assistance.finalDigest = runtime.assistanceDigest(summary);
      expect(() => parseInspectorAssistanceResponse(wire, target, requested)).toThrow();
    } else {
      expect(() => service.confirmRecordedAnalyzeAssistance(runId, owner, body, availability, new AbortController().signal)).toThrow();
      expect(() => service.confirmRecordedInspectorAssistance(runId, owner, historical, availability, new AbortController().signal)).toThrow();
    }
    expectNoSource(spies); expect(JSON.stringify(storage.read(runId))).toBe(before);
    const actual = campaigns.assistanceReceipt.bind(campaigns);
    vi.spyOn(campaigns, "assistanceReceipt").mockImplementation((...args) => { const issued = actual(...args); return issued === undefined ? undefined : { ...issued }; });
    await expect(service.review(runId, owner, run.activeCursor.branchId)).rejects.toThrow("CAMPAIGN_RECEIPT_FORGED");
    for (const spy of Object.values(spies)) spy.mockClear();
    expect(() => service.confirmRecordedAnalyzeAssistance(runId, owner, body, availability, new AbortController().signal)).toThrow(expect.objectContaining({ code: "INVALID_REQUEST" }));
    expect(() => service.confirmRecordedInspectorAssistance(runId, owner, historical, availability, new AbortController().signal)).toThrow(expect.objectContaining({ code: "INVALID_REQUEST" }));
    expectNoSource(spies);
  });
});
