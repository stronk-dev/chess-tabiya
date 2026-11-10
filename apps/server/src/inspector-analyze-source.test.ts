import { afterEach, describe, expect, it, vi } from "vitest";
import { attachEvidence, branchPath, commitMove, compileAssistanceRequest, createRun, fork, moduleDecisionStamp, revealFeedback, rewind, serverAvailabilityFromProviders } from "@chess-tabiya/runtime";
import * as sources from "../../../packages/runtime/src/recorded-analyze-line.js";
import * as routes from "../../../packages/runtime/src/internal/evidence-value-routes.js";
import * as providers from "../../../packages/runtime/src/provider-exchange.js";
import { attachDelivery, evaluationDelivery, lineDelivery } from "../../../packages/runtime/src/testing/review-evidence-fixture.js";
import { evidenceValueReceipt } from "../../../packages/runtime/src/evidence-contract.js";
import type { DrillRun, EvidencePayload } from "../../../packages/runtime/src/types.js";
import type { InspectorRecordedContext } from "./inspector-recorded-context.js";
import type { InspectorAnalyzeSource } from "./inspector-analyze-source.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";

const at = "2026-11-03T01:55:00.000Z", owner = { learnerId: "analyze-owner", handle: "analyze-owner" }, reader = { learnerId: "analyze-reader", handle: "analyze-reader" };
const availability = serverAvailabilityFromProviders({ opponent: "none", judge: "none", llm: "none", corpus: "none", tts: "none", tablebase: "none" });
const requested = compileAssistanceRequest({ contextHint: "position", preference: { kind: "explicit", preset: "analysis", overrides: {}, moduleOverrides: { include: [], exclude: [] } } });
const TYPED = "derived.review.analysis_typed_pv@1", PV = "derived.review.analysis_recorded_pv@1", FIRST = "derived.review.analysis_recorded_first@1";
const projections = [TYPED, PV, FIRST] as const;
const stores: SQLiteRunStorage[] = [];
afterEach(() => { vi.restoreAllMocks(); for (const storage of stores.splice(0)) storage.close(); });
function report(run: DrillRun, nodeId: string, kind: "bestline" | "eval", values: Readonly<Record<string, unknown>>) {
  return attachEvidence(run, nodeId, ["recorded:analyze-service-test"], { kind, source: "engine_validated", values } as EvidencePayload, at).run;
}
function fixture(side: "white" | "black" = "white", kind: "typed" | "pv" | "first" | "none" = "pv", custom?: Readonly<Record<string, unknown>>) {
  const initial = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  let run = createRun({ id: `inspector-analyze-${side}`, session: { kind: "position", start: { fen: side === "white" ? initial : initial.replace(" w ", " b "), side }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } },
    sessionDigest: `sha256:${"a".repeat(64)}`, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1, createdAt: at });
  for (const move of side === "white" ? ["e2e4", "e7e5", "g1f3"] : ["e7e5", "e2e4", "g8f6"]) run = commitMove(run, move, { at }).run;
  const path = branchPath(run, run.activeCursor.branchId), parent = path[0]!, child = path[1]!;
  const moves = side === "white" ? ["d2d4", "d7d5", "c2c4"] : ["c7c5", "g1f3", "d7d6"];
  if (kind === "typed") run = attachDelivery(run, parent.id, evaluationDelivery(parent.fen, "cp 20"), lineDelivery(parent.fen, moves, { maxPlies: 2 }));
  if (kind === "pv") run = report(run, parent.id, "bestline", custom ?? { movesUci: moves, engineId: "saved-engine", requestedDepth: 12 });
  if (kind === "first") run = report(run, parent.id, "eval", custom ?? { bestMoveUci: moves[0], engineId: "saved-engine", requestedNodes: 100 });
  run = revealFeedback(run, at).run;
  const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} }); stores.push(storage);
  for (const principal of [owner, reader]) storage.createLearner({ id: principal.learnerId, handle: principal.handle, passwordHash: "!", createdAt: at });
  const lease = { writerId: "analyze-writer", learnerId: owner.learnerId }; storage.create(run, lease); storage.grantRole(run.id, reader.learnerId, "host", lease, at);
  const service = new RunService(storage), controller = new AbortController();
  const context = (nodeId = child.id, principal = owner, scope: "incoming_edge" | "position" = "incoming_edge") => service.resolveInspectorRecordedContext(run.id, principal, requested, availability,
    { branchId: run.activeCursor.branchId, nodeId, decisionDigest: moduleDecisionStamp(run).digest, context: { kind: scope } }, controller.signal);
  const acquire = (projection: typeof projections[number], token = context()) => service.readInspectorAnalyzeSource(service.acquireInspectorAnalyzeSource(token, projection, controller.signal));
  return { run, path, parent, child, moves, storage, lease, service, controller, context, acquire };
}

describe("accepted recorded Analyze sources through actual SQLite/current Inspector grants", () => {
  it.each((["white", "black"] as const).flatMap(side => (["typed", "pv", "first"] as const).map(kind => ({ side, kind }))))("retains genuine $kind original source and one exact target factory: $side", ({ side, kind }) => {
    const f = fixture(side, kind), before = JSON.stringify(f.storage.read(f.run.id)), dispatch = vi.spyOn(routes, "invokeEvidenceValueRoute");
    const projection = kind === "typed" ? TYPED : kind === "pv" ? PV : FIRST, image = f.acquire(projection);
    expect(image.outcome).toEqual({ kind: "available", collected: 1 }); expect(image.values).toHaveLength(1);
    expect(image.sourceKey).toMatch(/^sha256:[a-f0-9]{64}$/u);
    expect(image.source).not.toBeNull();
    const original = sources.readRecordedAnalyzeLineSource(image.source!);
    expect(original.parent.id).toBe(f.parent.id); expect(original.reviewed.id).toBe(f.child.id);
    expect(original.event).toBe(original.run.events[original.ordinal!]);
    expect(dispatch.mock.calls.map(call => call[0])).toEqual(kind === "typed"
      ? ["run.record.edge@1", "recorded.inspector.eval_packet@1", "live.stockfish.principal_variation@1", TYPED]
      : ["run.record.edge@1", kind === "pv" ? "recorded.inspector.pv_packet@1" : "recorded.inspector.eval_packet@1", projection]);
    const target = dispatch.mock.results.at(-1)!.value;
    expect(target.kind).toBe("available"); expect(image.result).toBe(target); expect(image.values[0]).toBe(target.value);
    expect(routes.readRecordedAnalyzeLineInvocation(target).source).toBe(image.source);
    expect(evidenceValueReceipt(image.values[0]!).factory).toMatch(/^createDerivedReviewAnalysis/u);
    expect(f.service.readInspectorAnalyzeSource(f.service.acquireInspectorAnalyzeSource(f.context(), projection, f.controller.signal)).sourceKey).toBe(image.sourceKey);
    expect(JSON.stringify(f.storage.read(f.run.id))).toBe(before);
  });

  it.each(["none", "typed", "pv", "first"] as const)("never collects/parses/mints a nonselected variant: %s", kind => {
    const f = fixture("white", kind), collect = vi.spyOn(sources, "collectRecordedAnalyzeLine"), dispatch = vi.spyOn(routes, "invokeEvidenceValueRoute"), parse = vi.spyOn(providers, "parsePersistedProviderDelivery");
    const actual = kind === "typed" ? TYPED : kind === "pv" ? PV : kind === "first" ? FIRST : null;
    for (const projection of projections.filter(value => value !== actual)) {
      const image = f.acquire(projection), expected = kind === "none" || projections.indexOf(projection) < projections.indexOf(actual!) ? "source_absent" : "analyze_variant_not_selected";
      expect(image.outcome).toEqual({ kind: "unavailable", reason: expected });
      expect(image.source).toBeNull(); expect(image.result).toBeNull(); expect(image.values).toEqual([]);
      expect(image.sourceKey).toMatch(/^sha256:[a-f0-9]{64}$/u);
    }
    expect(collect).not.toHaveBeenCalled(); expect(dispatch).not.toHaveBeenCalled(); expect(parse).not.toHaveBeenCalled();
  });

  it("distinguishes root missing-context, completed-empty, corrupt stronger and attribution incomplete", () => {
    const absent = fixture("white", "none"), dispatch = vi.spyOn(routes, "invokeEvidenceValueRoute");
    expect(absent.acquire(PV, absent.context(absent.parent.id))).toMatchObject({ source: null, result: null, values: [], outcome: { kind: "missing_context", reason: "no_incoming_edge" } });
    expect(dispatch).not.toHaveBeenCalled();
    const empty = fixture("white", "pv", { movesUci: [] }), emptyImage = empty.acquire(PV);
    expect(emptyImage.outcome).toEqual({ kind: "no_witness" }); expect(emptyImage.result).toMatchObject({ kind: "unavailable", reason: "no_witness" }); expect(emptyImage.source).not.toBeNull();
    const unattributed = fixture("white", "pv", { movesUci: ["d2d4"] }), image = unattributed.acquire(PV);
    expect(image.outcome.kind).toBe("available"); expect(image.values[0]!.payload).toMatchObject({ operands: { kind: "unattributed", reason: "engine_and_bound_unusable" } });
    const corrupt = fixture(), changed = report(corrupt.run, corrupt.parent.id, "eval", { providerLineDelivery: null });
    corrupt.storage.save(changed, corrupt.lease);
    const context = corrupt.service.resolveInspectorRecordedContext(changed.id, owner, requested, availability, { branchId: changed.activeCursor.branchId, nodeId: corrupt.child.id, decisionDigest: moduleDecisionStamp(changed).digest, context: { kind: "incoming_edge" } }, corrupt.controller.signal);
    const failed = corrupt.acquire(TYPED, context);
    expect(failed.outcome).toEqual({ kind: "failed", reason: "source_contract_invalid" }); expect(failed.source).not.toBeNull(); expect(failed.values).toEqual([]);
    expect(corrupt.acquire(PV, context).outcome).toEqual({ kind: "unavailable", reason: "analyze_variant_not_selected" });
  });

  it("refuses wrong projections/scope and copied/foreign ownership before collection", () => {
    const f = fixture(), collect = vi.spyOn(sources, "collectRecordedAnalyzeLine"), context = f.context();
    for (const projection of ["constructor", "derived.review.analysis_line@1", "derived.review.analysis_recorded_pv@2"]) expect(() => f.acquire(projection as never, context)).toThrow();
    for (const fake of [{ ...context }, Object.create(context), {}]) expect(() => f.acquire(PV, fake as InspectorRecordedContext)).toThrow();
    expect(() => f.acquire(PV, f.context(f.child.id, owner, "position"))).toThrow();
    const other = fixture(); expect(() => f.acquire(PV, other.context())).toThrow();
    expect(collect).not.toHaveBeenCalled();
    const source = f.service.acquireInspectorAnalyzeSource(context, PV, f.controller.signal);
    for (const fake of [{ ...source }, Object.create(source), JSON.parse(JSON.stringify(source))]) expect(() => f.service.readInspectorAnalyzeSource(fake as InspectorAnalyzeSource)).toThrow();
    expect(() => other.service.readInspectorAnalyzeSource(source)).toThrow();
  });

  it.each(["revoke", "role", "storage", "disclosure", "cancel"] as const)("rechecks actual %s after collection BEFORE target derivation and on retained read", fault => {
    const f = fixture(), context = f.context(f.child.id, reader), collect = sources.collectRecordedAnalyzeLine;
    const change = () => {
      if (fault === "revoke") f.storage.revokeGrant(f.run.id, reader.learnerId, f.lease);
      if (fault === "role") f.storage.grantRole(f.run.id, reader.learnerId, "spectator", f.lease, at);
      if (fault === "storage") f.storage.save(report(f.run, f.parent.id, "eval", { centipawns: 12 }), f.lease);
      if (fault === "disclosure") f.storage.save(commitMove(f.run, "b8c6", { at }).run, f.lease);
      if (fault === "cancel") f.controller.abort();
    };
    const target = vi.spyOn(routes, "invokeEvidenceValueRoute");
    const spy = vi.spyOn(sources, "collectRecordedAnalyzeLine").mockImplementationOnce((...args) => { const result = collect(...args); change(); return result; });
    expect(() => f.acquire(PV, context)).toThrow(); expect(target.mock.calls.filter(call => call[0] === PV)).toHaveLength(0); spy.mockRestore();
    const second = fixture(), retained = second.service.acquireInspectorAnalyzeSource(second.context(second.child.id, reader), PV, second.controller.signal);
    if (fault === "revoke") second.storage.revokeGrant(second.run.id, reader.learnerId, second.lease);
    if (fault === "role") second.storage.grantRole(second.run.id, reader.learnerId, "spectator", second.lease, at);
    if (fault === "storage") second.storage.save(report(second.run, second.parent.id, "eval", { centipawns: 12 }), second.lease);
    if (fault === "disclosure") second.storage.save(commitMove(second.run, "b8c6", { at }).run, second.lease);
    if (fault === "cancel") second.controller.abort();
    expect(() => second.service.readInspectorAnalyzeSource(retained)).toThrow();
  });

  it("cancellation in metadata selection refuses before original collection or any factory", () => {
    const f = fixture(), context = f.context(), select = sources.selectRecordedAnalyzeMetadata;
    vi.spyOn(sources, "selectRecordedAnalyzeMetadata").mockImplementationOnce((...args) => { const result = select(...args); f.controller.abort(); return result; });
    const collect = vi.spyOn(sources, "collectRecordedAnalyzeLine"), dispatch = vi.spyOn(routes, "invokeEvidenceValueRoute");
    expect(() => f.acquire(PV, context)).toThrow(); expect(collect).not.toHaveBeenCalled(); expect(dispatch).not.toHaveBeenCalled();
  });

  it.each(["copy", "head", "node"] as const)("refuses a %s original collection before target derivation", fault => {
    const f = fixture(), context = f.context();
    const run = fault === "head" ? report(f.run, f.parent.id, "eval", { centipawns: 12 }) : f.run;
    const original = sources.collectRecordedAnalyzeLine(run, run.activeCursor.branchId, fault === "node" ? f.path[2]!.id : f.child.id, f.controller.signal);
    vi.spyOn(sources, "collectRecordedAnalyzeLine").mockReturnValueOnce(fault === "copy" ? { ...original } as never : original);
    const dispatch = vi.spyOn(routes, "invokeEvidenceValueRoute");
    expect(() => f.acquire(PV, context)).toThrow(); expect(dispatch.mock.calls.filter(call => call[0] === PV)).toHaveLength(0);
  });

  it.each([false, true])("retains only the exact original target invocation, unavailable=%s", empty => {
    const f = fixture("white", "pv", empty ? { movesUci: [] } : undefined), context = f.context();
    const source = sources.collectRecordedAnalyzeLine(f.run, f.run.activeCursor.branchId, f.child.id, f.controller.signal);
    const genuineForeignInvocation = sources.deriveRecordedAnalyzeLineSource(source, PV, f.controller.signal);
    vi.spyOn(sources, "deriveRecordedAnalyzeLineSource").mockReturnValueOnce(genuineForeignInvocation);
    expect(() => f.acquire(PV, context)).toThrow("original source invocation");
  });

  it("withholds only the actual active retry entry before parsing while retaining other historical moves", () => {
    const f = fixture();
    let run = fork(rewind(f.run, f.child.id, at, undefined, f.run.activeCursor.branchId).run, f.child.id, { at, label: "story-reentry" }).run;
    run = commitMove(run, "c7c5", { at }).run; run = revealFeedback(run, at).run; f.storage.save(run, f.lease);
    const selection = (nodeId: string) => f.service.resolveInspectorRecordedContext(run.id, owner, requested, availability,
      { branchId: f.run.activeCursor.branchId, nodeId, decisionDigest: moduleDecisionStamp(run).digest, context: { kind: "incoming_edge" } }, f.controller.signal);
    const collect = vi.spyOn(sources, "collectRecordedAnalyzeLine"), dispatch = vi.spyOn(routes, "invokeEvidenceValueRoute");
    expect(() => f.acquire(PV, selection(f.path[2]!.id))).toThrow(); expect(collect).not.toHaveBeenCalled(); expect(dispatch).not.toHaveBeenCalled();
    expect(f.acquire(PV, selection(f.child.id)).outcome.kind).toBe("available");
  });

  it("source keys preserve original report occurrence and full later head without changing equal operands", () => {
    const f = fixture(), before = f.acquire(PV);
    const repeated = report(f.run, f.parent.id, "bestline", { movesUci: f.moves, engineId: "saved-engine", requestedDepth: 12 });
    f.storage.save(repeated, f.lease);
    const context = f.service.resolveInspectorRecordedContext(repeated.id, owner, requested, availability,
      { branchId: repeated.activeCursor.branchId, nodeId: f.child.id, decisionDigest: moduleDecisionStamp(repeated).digest, context: { kind: "incoming_edge" } }, f.controller.signal);
    const after = f.acquire(PV, context);
    expect(after.metadata!.ordinal).not.toBe(before.metadata!.ordinal); expect(after.values[0]!.payload).toEqual(before.values[0]!.payload);
    expect(after.sourceKey).not.toBe(before.sourceKey);
    expect(() => f.service.readInspectorAnalyzeSource(f.service.acquireInspectorAnalyzeSource(context, PV, f.controller.signal))).not.toThrow();
  });

  it("actual internal source dispatch retains the global original ordinal and closed nonselected status", async () => {
    const f = fixture("white", "typed"), context = f.context();
    const selected = await f.service.acquireInspectorQuerySource(context, { kind: "source", context: { kind: "incoming_edge" }, projection: TYPED, start: 0, collectionKey: null }, f.controller.signal);
    const image = selected.read();
    expect(image.outcome).toEqual({ kind: "available", collected: 1 }); expect(image.occurrences).toHaveLength(1);
    const originalOrdinal = f.run.events.reduce((last, event, ordinal) => event.type === "evidence.attached" ? ordinal : last, -1);
    expect(originalOrdinal).toBeGreaterThan(0); expect(image.occurrences[0]!.sourceOrdinal).toBe(originalOrdinal);
    expect(image.occurrences[0]!.evidence.projection.id).toBe("derived.review.analysis_typed_pv");
    const nonselected = await f.service.acquireInspectorQuerySource(context, { kind: "source", context: { kind: "incoming_edge" }, projection: PV, start: 0, collectionKey: null }, f.controller.signal);
    expect(nonselected.read()).toMatchObject({ occurrences: [], outcome: { kind: "unavailable", reason: "analyze_variant_not_selected" } });
  });

  it.each(["absent", "empty", "nonselected"] as const)("never treats the retained %s outcome as permission after actual grant revocation or cancellation", kind => {
    for (const fault of ["revoke", "cancel"] as const) {
      const f = kind === "absent" ? fixture("white", "none") : kind === "empty" ? fixture("white", "pv", { movesUci: [] }) : fixture("white", "typed");
      const context = f.context(f.child.id, reader), projection = kind === "absent" ? TYPED : PV;
      const source = f.service.acquireInspectorAnalyzeSource(context, projection, f.controller.signal);
      expect(f.service.readInspectorAnalyzeSource(source).outcome).toEqual(kind === "empty" ? { kind: "no_witness" }
        : { kind: "unavailable", reason: kind === "absent" ? "source_absent" : "analyze_variant_not_selected" });
      if (fault === "revoke") f.storage.revokeGrant(f.run.id, reader.learnerId, f.lease);
      else f.controller.abort(new Error("retired source request"));
      expect(() => f.service.readInspectorAnalyzeSource(source)).toThrow();
    }
  });

  it.each([TYPED, PV, FIRST] as const)("rechecks revocation during pure metadata selection before publishing %s or doing source work", projection => {
    const f = fixture(), context = f.context(f.child.id, reader), select = sources.selectRecordedAnalyzeMetadata;
    vi.spyOn(sources, "selectRecordedAnalyzeMetadata").mockImplementationOnce((...args) => {
      const result = select(...args);
      f.storage.revokeGrant(f.run.id, reader.learnerId, f.lease);
      return result;
    });
    const collect = vi.spyOn(sources, "collectRecordedAnalyzeLine"), dispatch = vi.spyOn(routes, "invokeEvidenceValueRoute");
    expect(() => f.acquire(projection, context)).toThrow();
    expect(collect).not.toHaveBeenCalled(); expect(dispatch).not.toHaveBeenCalled();
  });

  it("does not turn a newly recorded stronger source into a lower-probe fallback across current heads", () => {
    const f = fixture(), oldContext = f.context();
    expect(f.acquire(TYPED, oldContext).outcome).toEqual({ kind: "unavailable", reason: "source_absent" });
    const changed = attachDelivery(f.run, f.parent.id, evaluationDelivery(f.parent.fen, "cp 20"), lineDelivery(f.parent.fen, f.moves));
    f.storage.save(changed, f.lease);
    const collect = vi.spyOn(sources, "collectRecordedAnalyzeLine"), dispatch = vi.spyOn(routes, "invokeEvidenceValueRoute"), parse = vi.spyOn(providers, "parsePersistedProviderDelivery");
    expect(() => f.acquire(PV, oldContext)).toThrow();
    expect(() => f.context()).toThrow(); // The old public decision cannot confirm the new head.
    const context = f.service.resolveInspectorRecordedContext(changed.id, owner, requested, availability,
      { branchId: changed.activeCursor.branchId, nodeId: f.child.id, decisionDigest: moduleDecisionStamp(changed).digest, context: { kind: "incoming_edge" } }, f.controller.signal);
    expect(f.acquire(PV, context).outcome).toEqual({ kind: "unavailable", reason: "analyze_variant_not_selected" });
    expect(collect).not.toHaveBeenCalled(); expect(dispatch).not.toHaveBeenCalled(); expect(parse).not.toHaveBeenCalled();
  });
});
