import { afterEach, describe, expect, it, vi } from "vitest";
import { appendOpponentPly, branchPath, commitMove, compileAssistanceRequest, fork, moduleDecisionStamp, revealFeedback, rewind, serverAvailabilityFromProviders, type DrillRun, type OpponentSelection } from "@chess-tabiya/runtime";
import * as pivotal from "../../../packages/runtime/src/pivotal.js";
import * as supplier from "../../../packages/runtime/src/inspector-pivotal-source.js";
import * as routes from "../../../packages/runtime/src/internal/evidence-value-routes.js";
import { PIVOTAL_RULE_KINDS, recordedPivotalFixture, RECORDED_PIVOTAL_AT as at } from "../../../packages/runtime/src/testing/recorded-pivotal-fixture.js";
import { humanObservationRun, recordHumanObservation, splitCandidates } from "../../../packages/runtime/src/testing/recorded-human-divergence-fixture.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";
import type { InspectorRecordedContext } from "./inspector-recorded-context.js";
import type { InspectorPivotalSource } from "./inspector-pivotal-source.js";

const owner = { learnerId: "pivotal-owner", handle: "pivotal-owner" };
const availability = serverAvailabilityFromProviders({ opponent: "none", judge: "none", llm: "none", corpus: "none", tts: "none", tablebase: "none" });
const requested = compileAssistanceRequest({ contextHint: "position", preference: { kind: "explicit", preset: "analysis", overrides: {}, moduleOverrides: { include: [], exclude: [] } } });
const stores: SQLiteRunStorage[] = [];
afterEach(() => { vi.restoreAllMocks(); for (const store of stores.splice(0)) store.close(); });
const ruleRef = (kind: typeof PIVOTAL_RULE_KINDS[number]) => kind === "irreversibility" ? "derived.pivotal.irreversibility@1" as const
  : kind === "phase_change" ? "derived.pivotal.phase_change@2" as const : "derived.pivotal.option_collapse@2" as const;
type Projection = ReturnType<typeof ruleRef> | "derived.pivotal.human_divergence@2";
function playedObservation(run: DrillRun, candidates: OpponentSelection["candidates"]) {
  const event = recordHumanObservation(run, candidates).events.at(-1)!;
  if (event.type !== "opponent.move_selected") throw new Error("Expected synthetic recorded observation");
  return appendOpponentPly(run, event.data.selection, { at }).run;
}
function fixture(input: DrillRun) {
  const run = revealFeedback(input, at).run, path = branchPath(run, run.activeCursor.branchId);
  const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} }); stores.push(storage);
  storage.createLearner({ id: owner.learnerId, handle: owner.handle, passwordHash: "!", createdAt: at });
  const lease = { writerId: "pivotal-writer", learnerId: owner.learnerId }; storage.create(run, lease);
  const service = new RunService(storage), controller = new AbortController();
  const context = (throughNodeId = path.at(-1)!.id, nodeId = throughNodeId, kind: "branch" | "position" = "branch") => service.resolveInspectorRecordedContext(run.id, owner, requested, availability,
    { branchId: run.activeCursor.branchId, nodeId, decisionDigest: moduleDecisionStamp(run).digest,
      context: kind === "branch" ? { kind, throughNodeId } : { kind } }, controller.signal);
  const acquire = (projection: Projection, token = context()) => service.readInspectorPivotalSource(service.acquireInspectorPivotalSource(token, projection, controller.signal));
  return { run, path, storage, lease, service, controller, context, acquire };
}

describe("recorded pivotal Inspector sources over actual current branch grants", () => {
  it.each(PIVOTAL_RULE_KINDS.flatMap(kind => [false, true].map(black => ({ kind, black }))))("retains original $kind source/result on both turns, black=$black", ({ kind, black }) => {
    const f = fixture(recordedPivotalFixture(kind, black)), before = JSON.stringify(f.storage.read(f.run.id));
    const source = vi.spyOn(pivotal, "createRecordedPivotalSource"), dispatch = vi.spyOn(routes, "invokeEvidenceValueRoute");
    const image = f.acquire(ruleRef(kind));
    expect(source).toHaveBeenCalledExactlyOnceWith({ run: expect.anything(), branchId: f.run.activeCursor.branchId, throughNodeId: f.path.at(-1)!.id, kind });
    expect(source.mock.calls[0]![0].run).toEqual(f.run);
    expect(image.source).toBe(source.mock.results[0]!.value);
    expect(dispatch.mock.calls.map(call => call[0])).toEqual([ruleRef(kind)]);
    expect(image.result).toBe(dispatch.mock.results[0]!.value);
    expect(image.result.length).toBeGreaterThan(0);
    expect(image.outcome).toEqual({ kind: "available", collected: image.result.length });
    expect(image.sourceKey).toMatch(/^sha256:[a-f0-9]{64}$/u);
    expect(f.service.readInspectorPivotalSource(f.service.acquireInspectorPivotalSource(f.context(), ruleRef(kind), f.controller.signal)).sourceKey).toBe(image.sourceKey);
    expect(JSON.stringify(f.storage.read(f.run.id))).toBe(before);
  });

  it.each([false, true])("retains complete original historical human observations, black=%s", black => {
    const f = fixture(playedObservation(humanObservationRun(black, 1450), splitCandidates(black)));
    const dispatch = vi.spyOn(routes, "invokeEvidenceValueRoute"), image = f.acquire("derived.pivotal.human_divergence@2");
    expect(image.outcome).toEqual({ kind: "available", collected: 1 });
    expect(image.result).toBe(dispatch.mock.results[0]!.value);
    expect(image.proof).toBe(routes.readRecordedHumanDivergenceInvocation(dispatch.mock.results[0]!.value, image.source));
    expect(image.proof).toMatchObject({ observations: [{ disposition: "matched", event: { data: { branchId: f.run.activeCursor.branchId } } }] });
  });

  it.each(PIVOTAL_RULE_KINDS.flatMap(kind => [false, true].map(black => ({ kind, black }))))("recomputes each exact granted $kind prefix without borrowing later witnesses, black=$black", ({ kind, black }) => {
    const f = fixture(recordedPivotalFixture(kind, black)), source = vi.spyOn(pivotal, "createRecordedPivotalSource");
    for (const [index, end] of f.path.entries()) {
      const image = f.acquire(ruleRef(kind), f.context(end.id, f.path[0]!.id));
      expect(source.mock.calls.at(-1)![0].throughNodeId).toBe(end.id);
      const data = pivotal.recordedPivotalData(image.source);
      expect(data.run).toEqual(f.run); expect(data.authority.path).toEqual(f.path.slice(0, index + 1));
      expect(image.proof).toBe(routes.readRecordedRulePivotalInvocation(image.result, image.source));
      expect(image.result.every(item => f.path.slice(0, index + 1).some(node => node.id === item.evidence.payload.nodeId))).toBe(true);
      if (kind === "option_collapse") {
        if (index < 4) expect(image.outcome).toEqual({ kind: "no_witness" });
        else {
          expect(image.result).toHaveLength(1);
          expect(image.result[0]!.evidence.payload.nodeId).toBe(f.path[2]!.id);
          expect(image.result[0]!.inputs.filter(input => input.projection.id === "run.record.position").map(input => (input.payload as { nodeId: string }).nodeId)).toEqual([f.path[0]!.id, f.path[2]!.id, f.path[4]!.id]);
        }
      }
      if (index === 0) expect(image.outcome).toEqual({ kind: "no_witness" });
    }
  });

  it.each([false, true])("keeps absent reports separate from present-empty/nonmatching human telemetry, black=%s", black => {
    const absent = fixture(playedObservation(humanObservationRun(black), undefined)).acquire("derived.pivotal.human_divergence@2");
    expect(absent.outcome).toEqual({ kind: "unavailable", reason: "source_absent" });
    expect(absent.result).toEqual([]); expect(absent.proof).toMatchObject({ observations: [{ disposition: "source_absent" }] });
    const missing = fixture(humanObservationRun(black)).acquire("derived.pivotal.human_divergence@2");
    expect(missing.outcome).toEqual({ kind: "unavailable", reason: "source_absent" });
    for (const candidates of [[], splitCandidates(black).map((row, index) => ({ ...row, mass: index === 0 ? 0.9 : 0.05 }))]) {
      const image = fixture(playedObservation(humanObservationRun(black), candidates)).acquire("derived.pivotal.human_divergence@2");
      expect(image.outcome).toEqual({ kind: "no_witness" });
      expect(image.result).toEqual([]); expect(image.proof).toMatchObject({ observations: [{ disposition: "nonmatch" }] });
    }
  });

  it.each([false, true])("retains shared-anchor observations and mixed availability on their actual origin branches, black=%s", black => {
    let run = playedObservation(humanObservationRun(black, 1450), splitCandidates(black));
    const originalBranch = run.activeCursor.branchId, root = run.nodes[0]!.id;
    run = fork(rewind(run, root, at, undefined, originalBranch).run, root, { at }).run;
    run = playedObservation(run, undefined);
    const f = fixture(run), image = f.acquire("derived.pivotal.human_divergence@2");
    expect(image.outcome).toEqual({ kind: "unavailable", reason: "source_absent" });
    expect(image.result).toHaveLength(1); // Internal evidence is retained, not authorized as a complete available topic.
    if (!("observations" in image.proof)) throw new Error("Expected human proof");
    expect(image.proof.observations.map(row => row.disposition)).toEqual(["matched", "source_absent"]);
    expect(image.proof.observations.map(row => row.resolved.subject)).toEqual([
      expect.objectContaining({ branchId: originalBranch, nodeId: root }),
      expect.objectContaining({ branchId: run.activeCursor.branchId, nodeId: root }),
    ]);
    expect(pivotal.recordedPivotalData(image.source).authority.branchId).toBe(run.activeCursor.branchId);
  });

  it("refuses wrong scopes/refs/copied or foreign grants and cancellation before source work", () => {
    const f = fixture(recordedPivotalFixture("phase_change")), context = f.context();
    const source = vi.spyOn(pivotal, "createRecordedPivotalSource"), dispatch = vi.spyOn(routes, "invokeEvidenceValueRoute");
    const coerce = vi.fn(() => "derived.pivotal.phase_change@2");
    for (const ref of ["constructor", "__proto__", "derived.pivotal.phase_change@1", "derived.pivotal.human_divergence@1", { [Symbol.toPrimitive]: coerce }]) expect(() => f.acquire(ref as never, context)).toThrow();
    expect(coerce).not.toHaveBeenCalled();
    for (const token of [f.context(undefined, undefined, "position"), { ...context } as InspectorRecordedContext]) expect(() => f.acquire("derived.pivotal.phase_change@2", token)).toThrow();
    expect(() => new RunService(f.storage).acquireInspectorPivotalSource(context, "derived.pivotal.phase_change@2", f.controller.signal)).toThrow();
    f.controller.abort(); expect(() => f.acquire("derived.pivotal.phase_change@2", context)).toThrow();
    expect(source).not.toHaveBeenCalled(); expect(dispatch).not.toHaveBeenCalled();
  });

  it.each(["prefix", "head", "kind"] as const)("rejects a genuine crossed %s source before target factory work", crossed => {
    const f = fixture(recordedPivotalFixture("phase_change")), context = f.context();
    const foreignRun = crossed === "head" ? commitMove(f.run, "d2d3", { at }).run : f.run;
    const foreign = pivotal.createRecordedPivotalSource({ run: foreignRun, branchId: f.run.activeCursor.branchId,
      throughNodeId: crossed === "prefix" ? f.path[0]!.id : f.path.at(-1)!.id, kind: crossed === "kind" ? "irreversibility" : "phase_change" });
    vi.spyOn(pivotal, "createRecordedPivotalSource").mockReturnValueOnce(foreign);
    const dispatch = vi.spyOn(routes, "invokeEvidenceValueRoute");
    expect(() => f.acquire("derived.pivotal.phase_change@2", context)).toThrow(); expect(dispatch).not.toHaveBeenCalled();
  });

  it.each(["cancel", "advance"] as const)("rechecks current grant after %s during actual source execution", change => {
    const f = fixture(recordedPivotalFixture("phase_change")), context = f.context(), original = routes.invokeEvidenceValueRoute;
    vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementationOnce(((ref: Projection, input: never) => {
      const result = original(ref, input);
      if (change === "cancel") f.controller.abort();
      else f.storage.save(revealFeedback(commitMove(f.run, "d2d3", { at }).run, at).run, f.lease);
      return result;
    }) as typeof routes.invokeEvidenceValueRoute);
    expect(() => f.acquire("derived.pivotal.phase_change@2", context)).toThrow();
  });

  it("performs zero target work when the same request is cancelled during source construction", () => {
    const f = fixture(recordedPivotalFixture("phase_change")), context = f.context(), original = pivotal.createRecordedPivotalSource;
    vi.spyOn(pivotal, "createRecordedPivotalSource").mockImplementationOnce(input => {
      const source = original(input); f.controller.abort(); return source;
    });
    const dispatch = vi.spyOn(routes, "invokeEvidenceValueRoute");
    expect(() => f.acquire("derived.pivotal.phase_change@2", context)).toThrow();
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("retained reads reject copies, foreign owner and actual disclosure reclosure", () => {
    const f = fixture(recordedPivotalFixture("phase_change")), source = f.service.acquireInspectorPivotalSource(f.context(), "derived.pivotal.phase_change@2", f.controller.signal);
    for (const copied of [{ ...source }, JSON.parse(JSON.stringify(source)), Object.create(source), f.service.readInspectorPivotalSource(source)]) expect(() => f.service.readInspectorPivotalSource(copied as InspectorPivotalSource)).toThrow();
    expect(() => new RunService(f.storage).readInspectorPivotalSource(source)).toThrow();
    f.storage.save(commitMove(f.run, "d2d3", { at }).run, f.lease);
    expect(() => f.service.readInspectorPivotalSource(source)).toThrow(expect.objectContaining({ code: "ASSISTANCE_WITHHELD" }));
  });

  it.each(["copy", "foreign", "throw"] as const)("does not turn a %s target result into complete empty success", fault => {
    const f = fixture(recordedPivotalFixture("phase_change")), context = f.context(), original = routes.invokeEvidenceValueRoute;
    const elsewhere = pivotal.createRecordedPivotalSource({ run: f.run, branchId: f.run.activeCursor.branchId, throughNodeId: f.path[0]!.id, kind: "phase_change" });
    const foreign = original("derived.pivotal.phase_change@2", { recordedPivotal: elsewhere });
    vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementationOnce(((ref: Projection, input: never) => {
      if (fault === "throw") throw new Error("source operation failed");
      const items = original(ref, input);
      return fault === "copy" ? [...items] : foreign;
    }) as typeof routes.invokeEvidenceValueRoute);
    expect(() => f.acquire("derived.pivotal.phase_change@2", context)).toThrow();
  });

  it("rejects original later graph corruption before even a root-prefix source is prepared", () => {
    const f = fixture(recordedPivotalFixture("phase_change")), broken = structuredClone(f.run);
    (broken.nodes.at(-1)! as { fen: string }).fen = broken.nodes[0]!.fen;
    f.storage.save(broken, f.lease);
    const source = vi.spyOn(pivotal, "createRecordedPivotalSource"), dispatch = vi.spyOn(routes, "invokeEvidenceValueRoute");
    expect(() => f.acquire("derived.pivotal.phase_change@2", f.context(f.path[0]!.id))).toThrow();
    expect(source).not.toHaveBeenCalled(); expect(dispatch).not.toHaveBeenCalled();
  });

  it("retains immutable original absent observations, not writable source state", () => {
    const f = fixture(playedObservation(humanObservationRun(), undefined)), image = f.acquire("derived.pivotal.human_divergence@2");
    if (!("observations" in image.proof)) throw new Error("Expected human proof");
    expect(Object.isFrozen(image.proof.observations[0]!.event)).toBe(true);
    expect(Object.isFrozen(image.proof.observations[0]!.event.data)).toBe(true);
    expect(Object.isFrozen(pivotal.recordedPivotalData(image.source).authority.path[0])).toBe(true);
  });

  it.each(["copy", "prefix", "head", "projection"] as const)("refuses a copied/crossed runtime %s collection before server publication", crossed => {
    const f = fixture(recordedPivotalFixture("phase_change")), context = f.context();
    const run = crossed === "head" ? commitMove(f.run, "d2d3", { at }).run : f.run;
    const original = supplier.collectInspectorPivotalPrefix(run, f.run.activeCursor.branchId,
      crossed === "prefix" ? f.path[0]!.id : f.path.at(-1)!.id,
      crossed === "projection" ? "derived.pivotal.irreversibility@1" : "derived.pivotal.phase_change@2", f.controller.signal);
    vi.spyOn(supplier, "collectInspectorPivotalPrefix").mockReturnValueOnce(crossed === "copy" ? { ...original } : original);
    expect(() => f.acquire("derived.pivotal.phase_change@2", context)).toThrow();
  });
});
