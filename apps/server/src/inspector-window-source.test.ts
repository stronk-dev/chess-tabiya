import { afterEach, describe, expect, it, vi } from "vitest";
import { branchPath, commitMove, compileAssistanceRequest, fork, moduleDecisionStamp, revealFeedback, rewind, serverAvailabilityFromProviders } from "@chess-tabiya/runtime";
import * as windows from "../../../packages/runtime/src/recorded-semantic-window.js";
import * as routes from "../../../packages/runtime/src/internal/evidence-value-routes.js";
import { EvidenceValueRouteLookupError } from "../../../packages/runtime/src/internal/evidence-value-routes.js";
import { RECORDED_SEQUENCE_HORIZONS, type RecordedSequenceRoute } from "../../../packages/runtime/src/recorded-sequence-window.js";
import { recordedSequenceWindowFixture } from "../../../packages/runtime/src/testing/recorded-sequence-window-fixture.js";
import { RECORDED_SEQUENCE_POSITIVES, RECORDED_SEQUENCE_HARD_NEGATIVES, RECORDED_ATTRACTION_FIVE, RECORDED_DEFLECTION_CHECK, RECORDED_CASTLING_CLEARANCE, RECORDED_CASTLING_DEFENDER } from "../../../packages/runtime/src/testing/recorded-sequence-fixtures.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "../../../packages/runtime/src/evidence-catalog.js";
import { assertSemanticEvidenceEvent } from "../../../packages/runtime/src/semantic-evidence.js";
import { evidenceValueReceipt } from "../../../packages/runtime/src/evidence-contract.js";
import type { InspectorRecordedContext } from "./inspector-recorded-context.js";
import type { InspectorWindowSource } from "./inspector-window-source.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";

const at = "2026-11-02T17:00:00.000Z", owner = { learnerId: "window-owner", handle: "window-owner" };
const availability = serverAvailabilityFromProviders({ opponent: "none", judge: "none", llm: "none", corpus: "none", tts: "none", tablebase: "none" });
const requested = compileAssistanceRequest({ contextHint: "position", preference: { kind: "explicit", preset: "analysis", overrides: {}, moduleOverrides: { include: [], exclude: [] } } });
const stores: SQLiteRunStorage[] = [];
afterEach(() => { vi.restoreAllMocks(); for (const store of stores.splice(0)) store.close(); });
const ALL = Object.keys(RECORDED_SEQUENCE_HORIZONS) as RecordedSequenceRoute[];
const REF = (route: RecordedSequenceRoute) => ({ id: route.split("@")[0]!, version: 3 });
const positiveFor = (route: RecordedSequenceRoute) => RECORDED_SEQUENCE_POSITIVES.find(item => `${item.projection}@3` === route)!;
function fixture(setup: Readonly<{ fen: string; moves: readonly string[] }> = positiveFor(ALL[0]!), black = false, inherited = false) {
  let run = recordedSequenceWindowFixture(setup, black), path = branchPath(run, run.activeCursor.branchId);
  const originalBranch = run.activeCursor.branchId;
  if (inherited) run = fork(rewind(run, path.at(-1)!.id, at, undefined, originalBranch).run, path.at(-1)!.id, { at }).run;
  run = revealFeedback(run, at).run;
  const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} }); stores.push(storage);
  storage.createLearner({ id: owner.learnerId, handle: owner.handle, passwordHash: "!", createdAt: at });
  const lease = { writerId: "window-writer", learnerId: owner.learnerId }; storage.create(run, lease);
  const service = new RunService(storage), controller = new AbortController();
  const context = (nodeId = path.at(-1)!.id, kind: "recorded_window" | "branch" | "incoming_edge" = "recorded_window") => service.resolveInspectorRecordedContext(run.id, owner, requested, availability,
    { branchId: run.activeCursor.branchId, nodeId, decisionDigest: moduleDecisionStamp(run).digest,
      context: kind === "branch" ? { kind, throughNodeId: nodeId } : { kind } }, controller.signal);
  const acquire = (projection: RecordedSequenceRoute, token = context()) => service.readInspectorWindowSource(service.acquireInspectorWindowSource(token, projection, controller.signal));
  return { run, path, originalBranch, storage, service, controller, context, acquire, lease };
}

describe("recorded-window Inspector supplier through actual current SQLite/RunService grants", () => {
  it.each(ALL.flatMap(route => [false, true].map(black => ({ route, black }))))("retains exact complete $route rows/operands, black=$black", ({ route, black }) => {
    const f = fixture(positiveFor(route), black);
    const original = JSON.stringify(f.storage.read(f.run.id)), source = vi.spyOn(windows, "recordedSemanticWindowSource");
    const dispatch = vi.spyOn(routes, "invokeEvidenceValueRoute");
    const image = f.acquire(route);
    expect(source).toHaveBeenCalledTimes(1);
    expect(image.result).toBe(source.mock.results[0]!.value);
    expect(image.outcome.kind).toBe("available");
    if (image.result.kind !== "window_available") throw new Error("Expected genuine complete source");
    expect(image.result.windows.map(row => row.horizon)).toEqual(RECORDED_SEQUENCE_HORIZONS[route].filter(horizon => horizon <= f.path.length - 1));
    expect(dispatch.mock.calls.filter(call => (ALL as readonly string[]).includes(call[0])).every(call => call[0] === route)).toBe(true);
    const edges = dispatch.mock.calls.filter(call => call[0] === "run.record.edge@1");
    expect(edges.length).toBeGreaterThan(0); expect(edges.length).toBeLessThanOrEqual(5);
    expect(image.result.scope).toEqual({ runId: f.run.id, branchId: f.run.activeCursor.branchId, throughNodeId: f.path.at(-1)!.id, projection: REF(route) });
    for (const event of image.result.events) {
      assertSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, event);
      expect(event.derivationInputs.map(value => evidenceValueReceipt(value).payloadDigest)).toEqual(evidenceValueReceipt(event.evidence).sourceDigests);
    }
    expect(image.result.events.length).toBeGreaterThan(0);
    expect(f.acquire(route).sourceKey).toBe(image.sourceKey);
    expect(JSON.stringify(f.storage.read(f.run.id))).toBe(original);
  });

  it.each(ALL.flatMap(route => [false, true].map(black => ({ route, black }))))("preserves complete empty $route, black=$black", ({ route, black }) => {
    const setup = RECORDED_SEQUENCE_HARD_NEGATIVES.find(item => `${item.projection}@3` === route)!, f = fixture(setup, black);
    const image = f.acquire(route);
    expect(image.outcome).toEqual({ kind: "no_witness" }); expect(image.sourceKey).not.toBeNull();
    if (image.result.kind !== "window_available") throw new Error("Hard negative must have a genuine complete window");
    expect(image.result.events).toEqual([]); expect(image.result.windows.length).toBeGreaterThan(0);
    expect(image.result.windows.every(row => row.status === "no_witness" && row.eventIds.length === 0)).toBe(true);
  });

  it.each(ALL)("uses only complete trailing %s rows at each earlier selected endpoint", route => {
    const f = fixture(positiveFor(route)), dispatch = vi.spyOn(routes, "invokeEvidenceValueRoute");
    const saved = JSON.stringify(f.storage.read(f.run.id));
    for (const [index, node] of f.path.entries()) {
      dispatch.mockClear();
      const image = f.acquire(route, f.context(node.id)), complete = RECORDED_SEQUENCE_HORIZONS[route].filter(horizon => horizon <= index);
      if (complete.length === 0) {
        expect(image.outcome).toEqual({ kind: "missing_context", reason: "no_recorded_window" }); expect(image.sourceKey).toBeNull();
        expect(image.result).toMatchObject({ kind: "window_missing", availablePrefixEdges: index, requiredHorizons: RECORDED_SEQUENCE_HORIZONS[route] });
        expect(dispatch).not.toHaveBeenCalled();
      } else {
        if (image.result.kind !== "window_available") throw new Error("Expected complete source rows");
        expect(image.result.windows.map(row => row.horizon)).toEqual(complete);
        expect(image.result.omittedHorizons).toEqual(RECORDED_SEQUENCE_HORIZONS[route].filter(horizon => horizon > index));
        expect(image.result.windows.every(row => row.endNodeId === node.id)).toBe(true);
        expect(image.result.events.every(event => event.anchor.nodeId === node.id)).toBe(true);
        const edgeCalls = dispatch.mock.calls.filter(call => call[0] === "run.record.edge@1");
        expect(edgeCalls).toHaveLength(Math.max(...complete));
        for (const [, input] of edgeCalls) {
          const child = (input as { child: { id: string } }).child;
          expect(f.path.slice(index - Math.max(...complete) + 1, index + 1).some(item => item.id === child.id)).toBe(true);
        }
      }
    }
    expect(JSON.stringify(f.storage.read(f.run.id))).toBe(saved);
  });

  it("retains inherited creating-branch anchors separately from the granted branch", () => {
    const route = "derived.pawn.sequence.harassment_pressure@3", f = fixture(positiveFor(route), false, true), image = f.acquire(route);
    if (image.result.kind !== "window_available") throw new Error("Expected inherited source");
    expect(image.result.scope.branchId).toBe(f.run.activeCursor.branchId);
    expect(image.result.scope.branchId).not.toBe(f.originalBranch);
    expect(image.result.events.length).toBeGreaterThan(0);
    expect(image.result.events.every(event => event.anchor.branchId === f.originalBranch)).toBe(true);
    const current = f.service.readInspectorRecordedContext(image.context);
    expect(current.run.nodes.length).toBe(f.run.nodes.length); expect(current.run).toEqual(f.run);
  });

  it.each([
    { route: "derived.tactic.attraction_observed@3" as const, setup: RECORDED_ATTRACTION_FIVE },
    { route: "derived.tactic.deflection_observed@3" as const, setup: RECORDED_DEFLECTION_CHECK },
    ...RECORDED_CASTLING_CLEARANCE.filter(item => item.emits).map(setup => ({ route: "derived.tactic.square_clearance_observed@3" as const, setup })),
    ...RECORDED_CASTLING_DEFENDER.filter(item => item.emits).map(setup => ({ route: "derived.tactic.sequence.defender_consequence@3" as const, setup })),
  ])("retains the complete special-move/long-horizon $route source at $setup.fen", ({ route, setup }) => {
    const f = fixture(setup), image = f.acquire(route);
    expect(image.outcome.kind).toBe("available");
    if (image.result.kind !== "window_available") throw new Error("Expected source");
    expect(image.result.events.length).toBeGreaterThan(0);
    if (setup === RECORDED_ATTRACTION_FIVE) expect(image.result.windows.map(row => row.horizon)).toEqual([3, 5]);
    for (const event of image.result.events) assertSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, event);
  });

  it("refuses unsupported/old refs, same-path wrong scopes, copies and cancellation before source work", () => {
    const f = fixture(), context = f.context(), source = vi.spyOn(windows, "recordedSemanticWindowSource"), dispatch = vi.spyOn(routes, "invokeEvidenceValueRoute");
    const coerce = vi.fn(() => ALL[0]);
    for (const projection of ["constructor", "__proto__", "derived.pawn.sequence.contact_timing@2", "derived.exchange.trade_completed@2", { [Symbol.toPrimitive]: coerce }]) expect(() => f.acquire(projection as never, context)).toThrow();
    expect(coerce).not.toHaveBeenCalled();
    for (const token of [f.context(undefined, "branch"), f.context(undefined, "incoming_edge"), { ...context } as InspectorRecordedContext]) expect(() => f.acquire(ALL[0]!, token)).toThrow();
    expect(() => new RunService(f.storage).acquireInspectorWindowSource(context, ALL[0]!, f.controller.signal)).toThrow();
    f.controller.abort(); expect(() => f.acquire(ALL[0]!, context)).toThrow();
    expect(source).not.toHaveBeenCalled(); expect(dispatch).not.toHaveBeenCalled();
  });

  it.each(["lookup", "contract"] as const)("retains genuine %s source refusal rather than producing empty success", fault => {
    const route = "derived.tactic.deflection_observed@3", f = fixture(positiveFor(route)), context = f.context();
    const original = routes.invokeEvidenceValueRoute, dispatch = vi.spyOn(routes, "invokeEvidenceValueRoute");
    expect(f.acquire(route, context).outcome.kind).toBe("available"); expect(dispatch.mock.calls.some(call => call[0] === route)).toBe(true);
    dispatch.mockClear();
    dispatch.mockImplementation(((ref: string, input: unknown) => {
      if (ref === route) { if (fault === "lookup") throw new EvidenceValueRouteLookupError(ref); throw new Error("PRIVATE DIAGNOSTIC FEN RUN OWNER"); }
      return original(ref as never, input as never);
    }) as typeof routes.invokeEvidenceValueRoute);
    const image = f.acquire(route, context), reason = fault === "lookup" ? "source_lookup_failed" : "source_contract_invalid";
    expect(image.result).toEqual({ kind: "window_refused", reason }); expect(image.outcome).toEqual({ kind: "failed", reason });
    expect(image.sourceKey).toBeNull(); expect(dispatch.mock.calls.some(call => call[0] === route)).toBe(true);
    expect(JSON.stringify(image.outcome)).not.toContain("PRIVATE");
  });

  it.each(["advance", "cancel"] as const)("rechecks the current run after %s during actual scoped acquisition", kind => {
    const f = fixture(), context = f.context(), original = windows.recordedSemanticWindowSource;
    const source = vi.spyOn(windows, "recordedSemanticWindowSource").mockImplementationOnce(input => {
      const result = original(input);
      if (kind === "cancel") f.controller.abort();
      else f.storage.save(revealFeedback(rewind(f.run, f.path[0]!.id, at).run, at).run, f.lease);
      return result;
    });
    const act = () => f.acquire(ALL[0]!, context);
    if (kind === "advance") expect(act).toThrow(expect.objectContaining({ reason: "stale" })); else expect(act).toThrow();
    expect(source).toHaveBeenCalledTimes(1);
  });

  it("refuses owned result copies/foreign readers and rechecks actual disclosure before readback", () => {
    const route = "derived.pawn.sequence.harassment_pressure@3", f = fixture(positiveFor(route));
    const token = f.service.acquireInspectorWindowSource(f.context(), route, f.controller.signal), image = f.service.readInspectorWindowSource(token);
    for (const forged of [{ ...token }, JSON.parse(JSON.stringify(token)), Object.create(token), image]) expect(() => f.service.readInspectorWindowSource(forged as InspectorWindowSource)).toThrow();
    expect(() => new RunService(f.storage).readInspectorWindowSource(token)).toThrow();
    f.storage.save(commitMove(f.run, "f1e2", { at }).run, f.lease);
    expect(() => f.service.readInspectorWindowSource(token)).toThrow(expect.objectContaining({ code: "ASSISTANCE_WITHHELD" }));
  });

  it.each(["endpoint", "projection"] as const)("rejoins a genuinely returned foreign %s scope before publishing a result", kind => {
    const f = fixture(), route = ALL[0]!, context = f.context(), current = f.service.readInspectorRecordedContext(context);
    const foreign = windows.recordedSemanticWindowSource({ run: current.run, branchId: current.selection.branchId,
      throughNodeId: kind === "endpoint" ? f.path[1]!.id : current.selected.id,
      projection: REF(kind === "projection" ? ALL[1]! : route) });
    expect(foreign.kind).not.toBe("window_refused");
    const source = vi.spyOn(windows, "recordedSemanticWindowSource").mockReturnValueOnce(foreign);
    expect(() => f.acquire(route, context)).toThrow(expect.objectContaining({ reason: "source_contract_invalid" }));
    expect(source).toHaveBeenCalledTimes(1);
  });

  it("validates original later graph corruption before a root-window request can prepare sources", () => {
    const f = fixture(), stored = f.storage.read(f.run.id)!, broken = structuredClone(f.run);
    const last = broken.nodes.find(node => node.id === f.path.at(-1)!.id)!;
    Object.assign(last, { fen: f.path[0]!.fen });
    const source = vi.spyOn(windows, "recordedSemanticWindowSource"), dispatch = vi.spyOn(routes, "invokeEvidenceValueRoute");
    vi.spyOn(f.storage, "read").mockReturnValue({ ...stored, run: broken });
    expect(() => f.context(f.path[0]!.id)).toThrow();
    expect(source).not.toHaveBeenCalled(); expect(dispatch).not.toHaveBeenCalled();
  });
});
