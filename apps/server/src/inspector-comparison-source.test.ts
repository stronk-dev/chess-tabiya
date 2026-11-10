import { afterEach, describe, expect, it, vi } from "vitest";
import { attachEvidence, commitMove, compileAssistanceRequest, moduleDecisionStamp, revealFeedback, serverAvailabilityFromProviders } from "@chess-tabiya/runtime";
import * as routes from "../../../packages/runtime/src/internal/evidence-value-routes.js";
import * as supplier from "../../../packages/runtime/src/inspector-comparison-source.js";
import * as comparisons from "../../../packages/runtime/src/recorded-comparison.js";
import { compareBranches } from "../../../packages/runtime/src/compare.js";
import { COMPARISON_STRUCTURAL_ROUTES } from "../../../packages/runtime/src/internal/comparison-structural-families.js";
import { evidenceValueReceipt } from "../../../packages/runtime/src/evidence-contract.js";
import { readComparisonStructuralPopulation } from "../../../packages/runtime/src/comparison-structural-population.js";
import { recordedComparisonEvalFixture } from "../../../packages/runtime/src/testing/recorded-comparison-eval-fixture.js";
import type { InspectorRecordedContext } from "./inspector-recorded-context.js";
import type { InspectorComparisonSource } from "./inspector-comparison-source.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";

const at = "2026-11-02T20:00:00.000Z", owner = { learnerId: "comparison-owner", handle: "comparison-owner" }, reader = { learnerId: "comparison-reader", handle: "comparison-reader" };
const availability = serverAvailabilityFromProviders({ opponent: "none", judge: "none", llm: "none", corpus: "none", tts: "none", tablebase: "none" });
const requested = compileAssistanceRequest({ contextHint: "position", preference: { kind: "explicit", preset: "analysis", overrides: {}, moduleOverrides: { include: [], exclude: [] } } });
const STRUCTURE = "derived.compare.structure_delta@2", EVAL = "derived.compare.eval_delta@2", PROJECTIONS = [STRUCTURE, EVAL] as const;
type Projection = typeof PROJECTIONS[number];
const stores: SQLiteRunStorage[] = [];
afterEach(() => { vi.restoreAllMocks(); for (const store of stores.splice(0)) store.close(); });
function fixture(reports?: Parameters<typeof recordedComparisonEvalFixture>[0], black = false) {
  const base = recordedComparisonEvalFixture(reports, black, "inspector-comparison");
  const run = revealFeedback(base.run, at).run, storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} }); stores.push(storage);
  for (const principal of [owner, reader]) storage.createLearner({ id: principal.learnerId, handle: principal.handle, passwordHash: "!", createdAt: at });
  const lease = { learnerId: owner.learnerId, writerId: "comparison-writer" }; storage.create(run, lease); storage.grantRole(run.id, reader.learnerId, "host", lease, at);
  const service = new RunService(storage), controller = new AbortController();
  const context = (columns = base.columns, principal = owner) => service.resolveInspectorRecordedContext(run.id, principal, requested, availability,
    { branchId: columns[0].branchId, nodeId: columns[0].throughNodeId, decisionDigest: moduleDecisionStamp(run).digest,
      context: { kind: "comparison", otherBranchId: columns[1].branchId, otherNodeId: columns[1].throughNodeId } }, controller.signal);
  const acquire = (projection: Projection, token = context()) => service.readInspectorComparisonSource(service.acquireInspectorComparisonSource(token, projection, controller.signal));
  return { ...base, run, storage, lease, service, controller, context, acquire };
}

describe("Inspector Compare sources under actual saved-run grants", () => {
  it.each([false, true])("retains the complete structural reduction with original columns and occurrences, black=%s", black => {
    const f = fixture(undefined, black), saved = JSON.stringify(f.storage.read(f.run.id)), dispatch = vi.spyOn(routes, "invokeEvidenceValueRoute");
    const image = f.acquire(STRUCTURE), collection = image.collection;
    if (collection.projection !== STRUCTURE) throw new Error("Wrong source");
    expect(collection.result).toBe(dispatch.mock.results.at(-1)!.value);
    expect(collection.result.length).toBeGreaterThan(0);
    const data = readComparisonStructuralPopulation(collection.population);
    expect(data.columns.map(row => ({ branchId: row.branchId, throughNodeId: row.throughNodeId }))).toEqual(f.columns);
    expect(new Set(dispatch.mock.calls.map(call => call[0]))).toEqual(new Set(["run.record.position@1", ...COMPARISON_STRUCTURAL_ROUTES, STRUCTURE]));
    expect(image.outcome).toEqual({ kind: "available", collected: collection.result.length });
    const old = routes.invokeEvidenceValueRoute("derived.compare.structure_delta@1", { run: f.run, comparison: compareBranches(f.run, [f.main, f.peer]), branchId: f.main });
    expect(collection.result.map(row => ({ observation: row.evidence.payload.observation, nodeId: row.nodeId, plyOffset: row.plyOffset })))
      .toEqual(old.map(row => ({ observation: (row.evidence.payload as { observation: unknown }).observation, nodeId: row.nodeId, plyOffset: row.plyOffset })));
    expect(JSON.stringify(f.storage.read(f.run.id))).toBe(saved);
  });

  it.each([false, true])("uses only original evaluation packet/pair routes, black=%s", black => {
    const f = fixture(undefined, black), dispatch = vi.spyOn(routes, "invokeEvidenceValueRoute"), image = f.acquire(EVAL), collection = image.collection;
    if (collection.projection !== EVAL) throw new Error("Wrong source");
    expect(dispatch.mock.calls.map(row => row[0])).toEqual(["recorded.inspector.eval_packet@1", "recorded.inspector.eval_packet@1", EVAL]);
    expect(collection.invocations[0]!.result).toBe(dispatch.mock.results.at(-1)!.value);
    expect(collection.result[0]!.evidence).toBe(collection.invocations[0]!.result[0]);
    expect(collection.result[0]).toMatchObject({ nodeId: f.mainPath[3]!.id, plyOffset: 1,
      evidence: { payload: { before: 0, after: 150, delta: 150, frame: "recorded_cp_numbers", comparability: "provider_not_established" } } });
    expect(evidenceValueReceipt(collection.result[0]!.evidence).sourceDigests).toHaveLength(2);
  });

  it.each(PROJECTIONS)("%s respects explicit reversed/unequal/fork-only endpoints, not the newest sibling", projection => {
    const f = fixture();
    const selections = [f.columns, [{ branchId: f.peer, throughNodeId: f.peerPath[3]!.id }, { branchId: f.main, throughNodeId: f.mainPath[4]!.id }],
      [{ branchId: f.main, throughNodeId: f.shared.id }, { branchId: f.peer, throughNodeId: f.shared.id }]] as const;
    const keys = selections.map(columns => {
      const image = f.acquire(projection, f.context(columns)), data = supplier.readInspectorComparisonCollection(image.collection);
      expect(data.authority.columns).toEqual(columns); expect(image.collection.branchId).toBe(columns[0].branchId);
      expect(data.authority.paths.map(path => path.at(-1)!.node.id)).toEqual(columns.map(column => column.throughNodeId));
      for (const row of image.collection.result) expect(data.authority.paths[0].some(entry => entry.node.id === row.nodeId)).toBe(true);
      return image.sourceKey;
    });
    expect(new Set(keys).size).toBe(3);
  });

  it.each([-151, -150, -149, 0, 149, 150, 151])("preserves the signed recorded cp threshold %s without grading", delta => {
    const f = fixture([{ nodeIndex: 2, values: { centipawns: 17 } }, { nodeIndex: 3, values: { centipawns: 17 + delta } }]);
    const image = f.acquire(EVAL), c = image.collection;
    if (c.projection !== EVAL) throw new Error("Wrong source");
    expect(c.result.map(row => row.evidence.payload.delta)).toEqual(Math.abs(delta) >= 150 ? [delta] : []);
    expect(c.invocations).toHaveLength(1); expect(c.invocations[0]!.proof.before).toBe(c.packets[0]);
    expect(image.outcome.kind).toBe(Math.abs(delta) >= 150 ? "available" : "no_witness");
  });

  it("retains ply/sequence ordering, duplicate reports, exclusions, and mate barriers", () => {
    const f = fixture([{ nodeIndex: 5, values: { centipawns: 900 } }, { nodeIndex: 2, values: { centipawns: 0 } },
      { nodeIndex: 3, values: { centipawns: 200 } }, { nodeIndex: 3, values: { centipawns: 0 } },
      { nodeIndex: 4, values: { mateIn: 0 } }, { nodeIndex: 3, values: { centipawns: 200 }, source: "tablebase_exact" },
      { nodeIndex: 3, values: { centipawns: "wrong" } }, { nodeIndex: 3, column: "peer", values: { centipawns: 500 } }]);
    const c = f.acquire(EVAL).collection;
    if (c.projection !== EVAL) throw new Error("Wrong source");
    expect(c.trail.map(row => row.event.seq)).toEqual([f.events[1]!.seq, f.events[2]!.seq, f.events[3]!.seq, f.events[4]!.seq, f.events[0]!.seq]);
    expect(c.invocations).toHaveLength(4); expect(c.invocations.slice(2).map(row => row.result)).toEqual([[], []]);
    expect(c.result.map(row => row.evidence.payload.delta)).toEqual([200, -200]);
    expect(c.result.map(row => row.nodeId)).toEqual([f.mainPath[3]!.id, f.mainPath[3]!.id]);
  });

  it("abstains on unsafe subtraction and retains cp-first decoding", () => {
    const overflow = fixture([{ nodeIndex: 2, values: { centipawns: -Number.MAX_SAFE_INTEGER } }, { nodeIndex: 3, values: { centipawns: Number.MAX_SAFE_INTEGER } }]);
    expect(overflow.acquire(EVAL).outcome).toEqual({ kind: "no_witness" });
    const dual = fixture([{ nodeIndex: 2, values: { centipawns: 0, mateIn: 1 } }, { nodeIndex: 3, values: { centipawns: 200, mateIn: -1 } }]);
    const c = dual.acquire(EVAL).collection;
    if (c.projection !== EVAL) throw new Error("Wrong source");
    expect(c.result[0]!.evidence.payload.delta).toBe(200);
  });

  it("keeps empty structural and zero/one-report eval inputs as original scoped results", () => {
    const zero = fixture([]), one = fixture([{ nodeIndex: 2, values: { centipawns: 0 } }]), two = fixture([{ nodeIndex: 2, values: { centipawns: 0 } }, { nodeIndex: 2, values: { centipawns: 0 } }]);
    const images = [zero, one, two].map(f => f.acquire(EVAL));
    expect(images.map(image => image.outcome)).toEqual(Array(3).fill({ kind: "no_witness" }));
    expect(new Set(images.map(image => image.sourceKey)).size).toBe(3);
    for (const [index, image] of images.entries()) {
      if (image.collection.projection !== EVAL) throw new Error("Wrong source");
      expect(image.collection.trail).toHaveLength(index); expect(image.collection.packets).toHaveLength(index);
    }
    const c = zero.acquire(STRUCTURE, zero.context([{ branchId: zero.main, throughNodeId: zero.shared.id }, { branchId: zero.peer, throughNodeId: zero.shared.id }])).collection;
    if (c.projection !== STRUCTURE) throw new Error("Wrong source");
    expect(c.outcome).toEqual({ kind: "no_witness" }); expect(c.result).toEqual([]);
    expect(c.proof).toBeDefined(); expect(readComparisonStructuralPopulation(c.population).columns.every(column => column.nodes.length === 1)).toBe(true);
  });

  it.each(PROJECTIONS)("rejects invalid %s requests before collection", projection => {
    const f = fixture(), collect = vi.spyOn(supplier, "collectInspectorComparisonSource");
    expect(() => f.acquire(projection, {} as InspectorRecordedContext)).toThrow();
    const position = f.service.resolveInspectorRecordedContext(f.run.id, owner, requested, availability,
      { branchId: f.main, nodeId: f.shared.id, decisionDigest: moduleDecisionStamp(f.run).digest, context: { kind: "position" } }, f.controller.signal);
    expect(() => f.acquire(projection, position)).toThrow();
    const context = f.context(); f.controller.abort(); expect(() => f.acquire(projection, context)).toThrow();
    expect(collect).not.toHaveBeenCalled();
  });

  it.each(["copy", "filter", "reverse", "foreign"] as const)("refuses %s structural result before publication", fault => {
    const f = fixture(), original = routes.invokeEvidenceValueRoute;
    const foreign = supplier.collectInspectorComparisonSource(f.run, f.columns, STRUCTURE, f.controller.signal);
    vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation(((ref: string, input: never) => {
      const value = original(ref as never, input);
      if (ref !== STRUCTURE) return value;
      const array = value as readonly unknown[];
      return fault === "foreign" ? foreign.result : fault === "filter" ? array.slice(0, -1) : fault === "reverse" ? [...array].reverse() : [...array];
    }) as typeof routes.invokeEvidenceValueRoute);
    expect(() => f.acquire(STRUCTURE)).toThrow();
  });

  it.each([false, true])("refuses copied/foreign original eval arrays, empty=%s", empty => {
    const f = fixture(empty ? [] : undefined), actual = fixture(empty ? [{ nodeIndex: 2, values: { centipawns: 0 } }, { nodeIndex: 3, values: { centipawns: 0 } }] : undefined);
    const original = routes.invokeEvidenceValueRoute, foreign = supplier.collectInspectorComparisonSource(actual.run, actual.columns, EVAL, actual.controller.signal);
    if (foreign.projection !== EVAL) throw new Error("Wrong source");
    expect(foreign.invocations).toHaveLength(1);
    for (const copy of [false, true]) {
      const mock = vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation(((ref: string, input: never) => {
        const value = original(ref as never, input);
        return ref === EVAL ? copy ? [...value as readonly unknown[]] : foreign.invocations[0]!.result : value;
      }) as typeof routes.invokeEvidenceValueRoute);
      expect(() => actual.acquire(EVAL)).toThrow(); mock.mockRestore();
    }
    expect(f.acquire(EVAL).outcome.kind).toBe(empty ? "no_witness" : "available");
  });

  it.each(PROJECTIONS.flatMap(projection => (["copy", "endpoint", "head", "projection", "order"] as const).map(fault => ({ projection, fault }))))("rejects a crossed $projection / $fault collection", ({ projection, fault }) => {
    const f = fixture(), context = f.context();
    const run = fault === "head" ? commitMove(f.run, "d2d3", { at }).run : f.run;
    const columns = fault === "endpoint" ? [{ branchId: f.main, throughNodeId: f.shared.id }, f.columns[1]] as const
      : fault === "order" ? [f.columns[1], f.columns[0]] as const : f.columns;
    const foreign = supplier.collectInspectorComparisonSource(run, columns, fault === "projection" ? projection === EVAL ? STRUCTURE : EVAL : projection, f.controller.signal);
    vi.spyOn(supplier, "collectInspectorComparisonSource").mockReturnValueOnce(fault === "copy" ? { ...foreign } : foreign);
    expect(() => f.acquire(projection, context)).toThrow();
  });

  it.each(PROJECTIONS)("checks %s cancellation after the original constructor before target work", projection => {
    const f = fixture(), context = f.context(), construct = comparisons.createRecordedComparisonSource;
    vi.spyOn(comparisons, "createRecordedComparisonSource").mockImplementationOnce(input => { const result = construct(input); f.controller.abort(); return result; });
    const dispatch = vi.spyOn(routes, "invokeEvidenceValueRoute");
    expect(() => f.acquire(projection, context)).toThrow(); expect(dispatch).not.toHaveBeenCalled();
  });

  it("checks cancellation after packet acquisition before invoking a pair", () => {
    const f = fixture(), context = f.context(), original = routes.invokeEvidenceValueRoute;
    const dispatch = vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation((...args) => {
      const result = original(...args);
      if (args[0] === "recorded.inspector.eval_packet@1") f.controller.abort();
      return result;
    });
    expect(() => f.acquire(EVAL, context)).toThrow();
    expect(dispatch.mock.calls.map(row => row[0])).toEqual(["recorded.inspector.eval_packet@1"]);
  });

  it.each(PROJECTIONS)("keeps %s original endpoint selection immutable after context acquisition", projection => {
    const f = fixture(), input = { branchId: f.main, nodeId: f.shared.id, decisionDigest: moduleDecisionStamp(f.run).digest,
      context: { kind: "comparison" as const, otherBranchId: f.peer, otherNodeId: f.shared.id } };
    const context = f.service.resolveInspectorRecordedContext(f.run.id, owner, requested, availability, input, f.controller.signal);
    input.nodeId = f.mainPath.at(-1)!.id; input.context.otherNodeId = f.peerPath.at(-1)!.id;
    const data = supplier.readInspectorComparisonCollection(f.acquire(projection, context).collection);
    expect(data.authority.columns.map(column => column.throughNodeId)).toEqual([f.shared.id, f.shared.id]);
  });

  it.each(PROJECTIONS.flatMap(projection => (["main", "peer"] as const).map(column => ({ projection, column }))))("rejects late original $column corruption before $projection collection at an earlier endpoint", ({ projection, column }) => {
    const f = fixture(), path = column === "main" ? f.mainPath : f.peerPath;
    const changed = { ...structuredClone(f.run), nodes: f.run.nodes.map(node => node.id === path.at(-1)!.id ? { ...node, fen: "invalid" } : node) };
    f.storage.save(changed, f.lease);
    const collect = vi.spyOn(supplier, "collectInspectorComparisonSource"), dispatch = vi.spyOn(routes, "invokeEvidenceValueRoute");
    expect(() => f.acquire(projection, f.context([{ branchId: f.main, throughNodeId: f.shared.id }, { branchId: f.peer, throughNodeId: f.shared.id }]))).toThrow();
    expect(collect).not.toHaveBeenCalled(); expect(dispatch).not.toHaveBeenCalled();
  });

  it.each(PROJECTIONS.flatMap(projection => (["revoke", "role", "storage", "disclosure", "cancel"] as const).map(fault => ({ projection, fault }))))("rechecks $projection / $fault during work and retained reads", ({ projection, fault }) => {
    for (const during of [false, true]) {
      const f = fixture(), context = f.context(f.columns, reader), original = supplier.collectInspectorComparisonSource;
      const change = () => {
        if (fault === "revoke") f.storage.revokeGrant(f.run.id, reader.learnerId, f.lease);
        if (fault === "role") f.storage.grantRole(f.run.id, reader.learnerId, "spectator", f.lease, at);
        if (fault === "storage") f.storage.save(attachEvidence(f.run, f.shared.id, ["synthetic:later-report"],
          { kind: "eval", source: "engine_validated", values: { centipawns: 12 } }, at).run, f.lease);
        if (fault === "disclosure") f.storage.save(commitMove(f.run, "d2d3", { at }).run, f.lease);
        if (fault === "cancel") f.controller.abort();
      };
      if (during) {
        const mock = vi.spyOn(supplier, "collectInspectorComparisonSource").mockImplementationOnce((...args) => { const value = original(...args); change(); return value; });
        expect(() => f.acquire(projection, context)).toThrow(); mock.mockRestore();
      } else {
        const handle = f.service.acquireInspectorComparisonSource(context, projection, f.controller.signal); change();
        expect(() => f.service.readInspectorComparisonSource(handle)).toThrow();
      }
    }
  });

  it("refuses copies/foreign service handles, unknown projections and missing signals", () => {
    const f = fixture(), context = f.context(), handle = f.service.acquireInspectorComparisonSource(context, EVAL, f.controller.signal);
    for (const copy of [{ ...handle }, Object.create(handle), f.service.readInspectorComparisonSource(handle)]) expect(() => f.service.readInspectorComparisonSource(copy as InspectorComparisonSource)).toThrow();
    expect(() => new RunService(f.storage).readInspectorComparisonSource(handle)).toThrow();
    const collect = vi.spyOn(supplier, "collectInspectorComparisonSource");
    expect(() => f.acquire("derived.compare.structure_delta@1" as Projection, context)).toThrow();
    expect(() => f.service.acquireInspectorComparisonSource(context, EVAL, undefined as unknown as AbortSignal)).toThrow();
    expect(collect).not.toHaveBeenCalled();
  });
});
