import { afterEach, describe, expect, it, vi } from "vitest";
import { branchPath, commitMove, compileAssistanceRequest, createRun, moduleDecisionStamp, revealFeedback, serverAvailabilityFromProviders } from "@chess-tabiya/runtime";
import { INSPECTOR_LOCAL_PROJECTIONS } from "../../../packages/runtime/src/inspector-local-source.js";
import * as local from "../../../packages/runtime/src/inspector-local-source.js";
import * as routes from "../../../packages/runtime/src/internal/evidence-value-routes.js";
import { assertDeclaredEvidence, evidenceValueReceipt } from "../../../packages/runtime/src/evidence-contract.js";
import type { InspectorRecordedContext } from "./inspector-recorded-context.js";
import type { InspectorLocalSource } from "./inspector-local-source.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";

const at = "2026-11-02T12:00:00.000Z";
const initial = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const owner = { learnerId: "local-source-owner", handle: "local-source-owner" };
const availability = serverAvailabilityFromProviders({ opponent: "none", judge: "none", llm: "none", corpus: "none", tts: "none", tablebase: "none" });
const requested = compileAssistanceRequest({ contextHint: "position", preference: { kind: "explicit", preset: "analysis", overrides: {}, moduleOverrides: { include: [], exclude: [] } } });
const stores: SQLiteRunStorage[] = [];
afterEach(() => { vi.restoreAllMocks(); for (const store of stores.splice(0)) store.close(); });

function fixture(side: "white" | "black" = "white", custom?: { readonly fen: string; readonly moves: readonly string[] }) {
  let run = createRun({ id: `inspector-local-${side}`, session: { kind: "position", start: { fen: custom?.fen ?? (side === "white" ? initial : initial.replace(" w ", " b ")), side }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } },
    sessionDigest: `sha256:${"a".repeat(64)}`, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1, createdAt: at });
  for (const move of custom?.moves ?? (side === "white" ? ["e2e4", "e7e5", "g1f3"] : ["e7e5", "e2e4", "g8f6"])) run = commitMove(run, move, { at }).run;
  run = revealFeedback(run, at).run;
  const path = branchPath(run, run.activeCursor.branchId), selected = path[Math.min(2, path.length - 1)]!;
  const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} }); stores.push(storage);
  storage.createLearner({ id: owner.learnerId, handle: owner.handle, passwordHash: "!", createdAt: at });
  const lease = { writerId: "local-source-writer", learnerId: owner.learnerId }; storage.create(run, lease);
  const service = new RunService(storage), controller = new AbortController();
  const context = (kind: "position" | "incoming_edge" | "recorded_window" = "position", nodeId = selected.id) => service.resolveInspectorRecordedContext(run.id, owner, requested, availability,
    { branchId: run.activeCursor.branchId, nodeId, decisionDigest: moduleDecisionStamp(run).digest, context: { kind } }, controller.signal);
  return { run, path, selected, storage, lease, service, controller, context };
}

describe("demand-local Inspector sources through actual current service/storage grants", () => {
  it.each(["white", "black"] as const)("supplies every closed local source for %s without changing or shortening the stored run", side => {
    const f = fixture(side), original = JSON.stringify(f.storage.read(f.run.id));
    expect(INSPECTOR_LOCAL_PROJECTIONS).toHaveLength(48);
    const calls = vi.spyOn(local, "collectInspectorLocalPosition"), edges = vi.spyOn(local, "collectInspectorLocalEdge"), dispatch = vi.spyOn(routes, "invokeEvidenceValueRoute");
    for (const projection of INSPECTOR_LOCAL_PROJECTIONS) {
      const scope = local.inspectorLocalScope(projection), context = f.context(scope);
      calls.mockClear(); edges.mockClear(); dispatch.mockClear();
      const source = f.service.acquireInspectorLocalSource(context, { projection, signal: f.controller.signal });
      const image = f.service.readInspectorLocalSource(source);
      expect(image.projection).toBe(projection);
      expect(image.sourceKey).toMatch(/^sha256:[a-f0-9]{64}$/u);
      expect(image.outcome.kind).toBe(image.values.length === 0 ? "no_witness" : "available");
      const targetResults = dispatch.mock.calls.flatMap((call, index) => call[0] === projection ? [dispatch.mock.results[index]!.value] : []);
      expect(targetResults.length).toBeGreaterThanOrEqual(projection === "derived.activity.event.file_access_revealed@1" ? 0 : 1);
      const originals = targetResults.flatMap(output => Array.isArray(output) ? output : output.kind === "available" ? output.value : [output]);
      expect(image.values).toEqual(originals);
      image.values.forEach((value, index) => expect(value).toBe(originals[index]));
      expect(calls).toHaveBeenCalledTimes(scope === "position" ? 1 : 0);
      expect(edges).toHaveBeenCalledTimes(scope === "incoming_edge" ? 1 : 0);
      if (scope === "position") expect(calls).toHaveBeenCalledWith(projection, f.selected.fen);
      else expect(edges).toHaveBeenCalledWith(projection, { beforeFen: f.path[1]!.fen, moveUci: f.selected.moveUci, afterFen: f.selected.fen });
      expect(image.input).toEqual(scope === "position" ? { fen: f.selected.fen } : { beforeFen: f.path[1]!.fen, moveUci: f.selected.moveUci, afterFen: f.selected.fen });
      expect(Object.isFrozen(image.input)).toBe(true);
      for (const value of image.values) {
        assertDeclaredEvidence(value); expect(`${value.projection.id}@${value.projection.version}`).toBe(projection);
        expect(evidenceValueReceipt(value).factory).toMatch(/^create/);
      }
      expect(f.service.readInspectorLocalSource(source)).toBe(image);
      expect(f.service.readInspectorLocalSource(f.service.acquireInspectorLocalSource(context, { projection, signal: f.controller.signal })).sourceKey).toBe(image.sourceKey);
      expect(JSON.stringify(f.storage.read(f.run.id))).toBe(original);
    }
  });

  it("keeps a root's missing incoming edge distinct from complete empty edge execution", () => {
    const f = fixture(), collect = vi.spyOn(local, "collectInspectorLocalEdge");
    const source = f.service.acquireInspectorLocalSource(f.context("incoming_edge", f.path[0]!.id), { projection: "rules.square.event.control@1", signal: f.controller.signal });
    expect(f.service.readInspectorLocalSource(source)).toMatchObject({ sourceKey: null, input: null, values: [], outcome: { kind: "missing_context", reason: "no_incoming_edge" } });
    expect(collect).not.toHaveBeenCalled();
  });

  it.each([
    ["rules.tactic.event.defender_removed@1", "white", "r3k3/8/1n6/2B5/8/8/8/R3K3 w - - 0 1", "c5b6"],
    ["rules.tactic.event.defender_duty_relocated@1", "black", "r3k3/8/1n6/2P5/8/8/8/R3K3 b - - 0 1", "b6d7"],
  ] as const)("retains the complete original positive %s over its actual stored incoming edge", (projection, side, fen, move) => {
    const f = fixture(side, { fen, moves: [move] }), dispatch = vi.spyOn(routes, "invokeEvidenceValueRoute");
    const image = f.service.readInspectorLocalSource(f.service.acquireInspectorLocalSource(f.context("incoming_edge"), { projection, signal: f.controller.signal }));
    expect(dispatch.mock.calls.map(call => call[0])).toEqual([projection]);
    expect(dispatch.mock.calls[0]![1]).toEqual({ beforeFen: f.path[0]!.fen, moveUci: move, afterFen: f.selected.fen });
    const original = dispatch.mock.results[0]!.value as readonly unknown[];
    expect(original.length).toBeGreaterThan(0);
    expect(image.outcome).toEqual({ kind: "available", collected: original.length });
    expect(image.values).toEqual(original);
    image.values.forEach((value, ordinal) => expect(value).toBe(original[ordinal]));
    expect(image.sourceKey).toMatch(/^sha256:[a-f0-9]{64}$/u);
    expect(f.storage.read(f.run.id)!.run).toEqual(f.run);
  });

  it.each(["rules.tactic.event.defender_removed@1", "rules.tactic.event.defender_duty_relocated@1"] as const)("%s distinguishes root absence from a completed quiet negative", projection => {
    const f = fixture("white", { fen: "4k3/7p/8/8/8/8/P7/4K3 w - - 0 1", moves: ["e1e2"] });
    const dispatch = vi.spyOn(routes, "invokeEvidenceValueRoute");
    const root = f.service.readInspectorLocalSource(f.service.acquireInspectorLocalSource(f.context("incoming_edge", f.path[0]!.id), { projection, signal: f.controller.signal }));
    expect(root).toMatchObject({ sourceKey: null, values: [], outcome: { kind: "missing_context", reason: "no_incoming_edge" } });
    expect(dispatch).not.toHaveBeenCalled();
    const quiet = f.service.readInspectorLocalSource(f.service.acquireInspectorLocalSource(f.context("incoming_edge"), { projection, signal: f.controller.signal }));
    expect(quiet).toMatchObject({ values: [], outcome: { kind: "no_witness" } });
    expect(quiet.sourceKey).not.toBeNull();
    expect(dispatch.mock.calls.map(call => call[0])).toEqual([projection]);
  });

  it.each(["position", "incoming_edge"] as const)("keeps genuine empty %s populations distinct when grants share IDs/head/cursor but not inputs", scope => {
    const first = fixture("white", { fen: "4k3/7p/8/8/8/8/P7/4K3 w - - 0 1", moves: ["e1e2"] });
    const second = fixture("white", { fen: "3k4/7p/8/8/8/8/P7/4K3 w - - 0 1", moves: ["e1e2"] });
    expect(first.run.id).toBe(second.run.id);
    expect(moduleDecisionStamp(first.run)).toEqual(moduleDecisionStamp(second.run));
    expect(first.selected.id).toBe(second.selected.id);
    expect(first.selected.fen).not.toBe(second.selected.fen);
    const projection = scope === "position" ? "rules.castling.reading.legality@1" : "rules.mobility.event.piece_destinations@1";
    const images = [first, second].map(f => f.service.readInspectorLocalSource(f.service.acquireInspectorLocalSource(f.context(scope), { projection, signal: f.controller.signal })));
    for (const image of images) { expect(image.values).toEqual([]); expect(image.outcome).toEqual({ kind: "no_witness" }); expect(image.sourceKey).not.toBeNull(); }
    expect(images[0]!.sourceKey).not.toBe(images[1]!.sourceKey);
  });

  it("refuses unsupported refs, wrong scopes, copied/foreign contexts and cancelled work before collectors", () => {
    const f = fixture(), context = f.context(), calls = vi.spyOn(local, "collectInspectorLocalPosition");
    const get = vi.fn(() => "rules.king.reading.zone_state@1"), coerce = vi.fn(() => "rules.king.reading.zone_state@1");
    const getter = { signal: f.controller.signal };
    Object.defineProperty(getter, "projection", { enumerable: true, get });
    expect(() => f.service.acquireInspectorLocalSource(context, getter as never)).toThrow();
    expect(() => f.service.acquireInspectorLocalSource(context, { projection: { [Symbol.toPrimitive]: coerce } as never, signal: f.controller.signal })).toThrow();
    expect(() => f.service.acquireInspectorLocalSource(context, { projection: "rules.king.reading.zone_state@1", signal: f.controller.signal, fen: initial } as never)).toThrow();
    expect(get).not.toHaveBeenCalled(); expect(coerce).not.toHaveBeenCalled();
    for (const projection of ["constructor", "__proto__", "live.stockfish.eval@1", "derived.inspector.detail.rays@1", "derived.material.reading.role_signature@1"]) {
      expect(() => f.service.acquireInspectorLocalSource(context, { projection: projection as never, signal: f.controller.signal })).toThrow();
    }
    expect(() => f.service.acquireInspectorLocalSource(f.context("recorded_window"), { projection: "rules.king.reading.zone_state@1", signal: f.controller.signal })).toThrow();
    expect(() => f.service.acquireInspectorLocalSource(f.context("incoming_edge"), { projection: "rules.king.reading.zone_state@1", signal: f.controller.signal })).toThrow();
    expect(() => f.service.acquireInspectorLocalSource({ ...context } as InspectorRecordedContext, { projection: "rules.king.reading.zone_state@1", signal: f.controller.signal })).toThrow();
    const other = new RunService(f.storage);
    expect(() => other.acquireInspectorLocalSource(context, { projection: "rules.king.reading.zone_state@1", signal: f.controller.signal })).toThrow();
    f.controller.abort();
    expect(() => f.service.acquireInspectorLocalSource(context, { projection: "rules.king.reading.zone_state@1", signal: f.controller.signal })).toThrow();
    expect(calls).not.toHaveBeenCalled();
  });

  it("retained source reads require this owner, current access/configuration/decision and a live request", () => {
    const f = fixture(), context = f.context(), source = f.service.acquireInspectorLocalSource(context, { projection: "rules.king.reading.zone_state@1", signal: f.controller.signal });
    for (const forged of [{ ...source }, JSON.parse(JSON.stringify(source)), Object.create(source), f.service.readInspectorLocalSource(source)]) expect(() => f.service.readInspectorLocalSource(forged as InspectorLocalSource)).toThrow();
    expect(() => new RunService(f.storage).readInspectorLocalSource(source)).toThrow();
    const stored = f.storage.read(f.run.id)!;
    f.storage.save(commitMove(stored.run, "b8c6", { at }).run, f.lease);
    expect(() => f.service.readInspectorLocalSource(source)).toThrow(expect.objectContaining({ code: "ASSISTANCE_WITHHELD" }));
    f.controller.abort(); expect(() => f.service.readInspectorLocalSource(source)).toThrow();
  });

  it.each(["advance", "cancel"] as const)("rechecks current source ownership after %s during collection", kind => {
    const f = fixture(), context = f.context(), original = local.collectInspectorLocalPosition;
    const collect = vi.spyOn(local, "collectInspectorLocalPosition").mockImplementationOnce((projection, fen) => {
      const result = original(projection, fen);
      if (kind === "cancel") f.controller.abort();
      else f.storage.save(revealFeedback(commitMove(f.run, "b8c6", { at }).run, at).run, f.lease);
      return result;
    });
    const act = () => f.service.acquireInspectorLocalSource(context, { projection: "rules.king.reading.zone_state@1", signal: f.controller.signal });
    if (kind === "advance") expect(act).toThrow(expect.objectContaining({ reason: "stale" }));
    else expect(act).toThrow();
    expect(collect).toHaveBeenCalledTimes(1);
  });
});
