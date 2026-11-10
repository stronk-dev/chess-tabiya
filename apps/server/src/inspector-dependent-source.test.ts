import { afterEach, describe, expect, it, vi } from "vitest";
import { branchPath, commitMove, compileAssistanceRequest, createRun, fork, moduleDecisionStamp, revealFeedback, rewind, serverAvailabilityFromProviders } from "@chess-tabiya/runtime";
import { INSPECTOR_DEPENDENT_PROJECTIONS, type InspectorDependentRequest } from "../../../packages/runtime/src/inspector-dependent-source.js";
import * as dependent from "../../../packages/runtime/src/inspector-dependent-source.js";
import * as routes from "../../../packages/runtime/src/internal/evidence-value-routes.js";
import { assertDeclaredEvidence, evidenceValueReceipt } from "../../../packages/runtime/src/evidence-contract.js";
import { mirrorSemanticFen, mirrorSemanticUci } from "../../../packages/runtime/src/semantic-validation.js";
import type { InspectorRecordedContext } from "./inspector-recorded-context.js";
import type { InspectorDependentSource } from "./inspector-dependent-source.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";

const at = "2026-11-02T16:00:00.000Z", initial = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const owner = { learnerId: "dependent-owner", handle: "dependent-owner" };
const availability = serverAvailabilityFromProviders({ opponent: "none", judge: "none", llm: "none", corpus: "none", tts: "none", tablebase: "none" });
const requested = compileAssistanceRequest({ contextHint: "position", preference: { kind: "explicit", preset: "analysis", overrides: {}, moduleOverrides: { include: [], exclude: [] } } });
const stores: SQLiteRunStorage[] = [];
afterEach(() => { vi.restoreAllMocks(); for (const store of stores.splice(0)) store.close(); });

function fixture(fen = initial, moves: readonly string[] = ["e2e4", "e7e5", "g1f3"], inherited = false) {
  let run = createRun({ id: "inspector-dependent", session: { kind: "position", start: { fen, side: fen.includes(" w ") ? "white" : "black" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } },
    sessionDigest: `sha256:${"a".repeat(64)}`, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1, createdAt: at });
  for (const move of moves) run = commitMove(run, move, { at }).run;
  const originalBranch = run.activeCursor.branchId, path = branchPath(run, originalBranch), selected = path[1] ?? path[0]!;
  if (inherited) run = fork(rewind(run, selected.id, at, undefined, originalBranch).run, selected.id, { at }).run;
  run = revealFeedback(run, at).run;
  const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} }); stores.push(storage);
  storage.createLearner({ id: owner.learnerId, handle: owner.handle, passwordHash: "!", createdAt: at });
  const lease = { writerId: "dependent-writer", learnerId: owner.learnerId }; storage.create(run, lease);
  const service = new RunService(storage), controller = new AbortController();
  const context = (nodeId = selected.id, kind: "incoming_edge" | "position" = "incoming_edge") => service.resolveInspectorRecordedContext(run.id, owner, requested, availability,
    { branchId: run.activeCursor.branchId, nodeId, decisionDigest: moduleDecisionStamp(run).digest, context: { kind } }, controller.signal);
  const acquire = (request: InspectorDependentRequest, token = context()) => service.readInspectorDependentSource(service.acquireInspectorDependentSource(token, request, controller.signal));
  return { run, originalBranch, path, selected, storage, lease, service, controller, context, acquire };
}
const positive = [
  ["derived.material.event.role_asymmetry@2", "4k3/8/8/8/8/8/n7/R3K3 w - - 7 1", "a1a2"],
  ["derived.tactic.discovered_executed@1", "7k/8/8/8/4r3/5N2/6B1/7K w - - 0 1", "f3h4"],
  ["derived.tactic.nonterminal_fork_survival@1", "4k3/8/8/8/1n6/8/8/R3K3 b - - 0 1", "b4c2"],
  ["rules.tactic.predicate.overload_conflict@1", "1B5k/r2pq3/2n5/8/8/8/8/4R1K1 w - - 0 1", "b8a7"],
  ["rules.tactic.consequence.forced_mate_after_move@1", "7k/5Q2/6K1/8/8/8/8/8 w - - 0 1", "f7g7"],
  ["rules.tactic.consequence.forced_mate_after_move@2", "7k/5Q2/6K1/8/8/8/8/8 w - - 0 1", "f7g7"],
] as const;
const requestFor = (projection: typeof INSPECTOR_DEPENDENT_PROJECTIONS[number], horizon: 1 | 2 | 3 | 4 = 1): InspectorDependentRequest =>
  projection === "rules.tactic.consequence.forced_mate_after_move@1" || projection === "rules.tactic.consequence.forced_mate_after_move@2"
    ? { projection, parameters: { kind: "forced_mate", maxAttackerMoves: horizon } } : { projection };

describe("dependent Inspector sources through actual current SQLite/RunService grants", () => {
  it.each((["white", "black"] as const).flatMap(side => (["q", "r", "b", "n"] as const).map(role => ({ side, role }))))("retains the original $side $role promotion result and its complete causes", ({ side, role }) => {
    const fen = side === "white" ? "7k/P7/8/8/8/8/8/7K w - - 7 1" : "7k/8/8/8/8/8/p7/7K b - - 7 1";
    const move = side === "white" ? `a7a8${role}` : `a2a1${role}`;
    const f = fixture(fen, [move]), dispatch = vi.spyOn(routes, "invokeEvidenceValueRoute");
    const image = f.acquire({ projection: "derived.material.event.role_asymmetry@2" });
    expect(dispatch.mock.calls.map(call => call[0])).toEqual(["run.record.edge@1", "derived.material.event.role_asymmetry@2"]);
    const result = dispatch.mock.results[1]!.value as routes.EvidenceValueRouteResults["derived.material.event.role_asymmetry@2"];
    expect(image.outcome).toEqual({ kind: "available", collected: 1 });
    expect(image.collection!.result).toBe(result);
    expect(image.collection!.values[0]).toBe(result[0]!.evidence);
    expect(evidenceValueReceipt(image.collection!.values[0]!).sourceDigests).toHaveLength(3);
    expect(f.storage.read(f.run.id)!.run).toEqual(f.run);
  });

  it("retains a complete empty material result, not an invented root result", () => {
    const f = fixture("4k3/7p/8/8/8/8/P7/4K3 w - - 0 1", ["e1e2"]), dispatch = vi.spyOn(routes, "invokeEvidenceValueRoute");
    const root = f.acquire({ projection: "derived.material.event.role_asymmetry@2" }, f.context(f.path[0]!.id));
    expect(root).toMatchObject({ sourceKey: null, collection: null, outcome: { kind: "missing_context", reason: "no_incoming_edge" } });
    expect(dispatch).not.toHaveBeenCalled();
    const image = f.acquire({ projection: "derived.material.event.role_asymmetry@2" });
    expect(image).toMatchObject({ collection: { values: [], result: [] }, outcome: { kind: "no_witness" } });
    expect(image.collection!.result).toBe(dispatch.mock.results[1]!.value);
    expect(image.sourceKey).not.toBeNull();
  });

  it.each(positive.flatMap(row => [false, true].map(mirrored => ({ row, mirrored }))))("retains the genuine complete $row.0 path, mirrored=$mirrored", ({ row: [projection, fen, move], mirrored }) => {
    const f = fixture(mirrored ? mirrorSemanticFen(fen, "color_and_vertical") : fen, [mirrored ? mirrorSemanticUci(move, "color_and_vertical") : move]);
    const saved = JSON.stringify(f.storage.read(f.run.id)), dispatch = vi.spyOn(routes, "invokeEvidenceValueRoute");
    const source = f.acquire(requestFor(projection)), collection = source.collection!;
    expect(source.outcome.kind).toBe("available"); expect(collection.values.length).toBeGreaterThan(0);
    expect(collection.edge.payload).toMatchObject({ runId: f.run.id, edgeBranchId: f.originalBranch, beforeNodeId: f.path[0]!.id, afterNodeId: f.selected.id,
      beforeFen: f.path[0]!.fen, moveUci: f.selected.moveUci, afterFen: f.selected.fen });
    expect(dispatch.mock.calls[0]![0]).toBe("run.record.edge@1");
    expect(dispatch.mock.calls.at(-1)![0]).toBe(projection);
    const expected = projection === "derived.tactic.discovered_executed@1" ? ["run.record.edge@1", "rules.tactic.reading.discovered_latency@1", "rules.transition.event.slider_ray@1", projection]
      : projection === "derived.tactic.nonterminal_fork_survival@1" ? ["run.record.edge@1", "rules.tactic.event.double_attack@1", "rules.tactic.consequence.reply_breadth@1", projection]
        : projection === "rules.tactic.predicate.overload_conflict@1" || projection === "derived.material.event.role_asymmetry@2" ? ["run.record.edge@1", projection]
          : ["run.record.edge@1", "rules.tactic.consequence.reply_breadth@1", projection];
    expect(dispatch.mock.calls.map(call => call[0])).toEqual(expected);
    for (const item of [collection.edge, ...collection.dependencies, ...collection.values]) assertDeclaredEvidence(item);
    const result = dispatch.mock.results.at(-1)!.value;
    expect(collection.result).toBe(result);
    const raw = Array.isArray(result) ? result.map(item => item.evidence) : "kind" in result ? (Array.isArray(result.value) ? result.value : [result.value]) : [result];
    expect(collection.values).toEqual(raw); collection.values.forEach((value, index) => expect(value).toBe(raw[index]));
    expect(Object.isFrozen(collection.dependencies)).toBe(true); expect(Object.isFrozen(collection.values)).toBe(true);
    expect(f.acquire(requestFor(projection)).sourceKey).toBe(source.sourceKey);
    expect(JSON.stringify(f.storage.read(f.run.id))).toBe(saved);
  });

  it.each([1, 2, 3, 4] as const)("binds the explicit %i-attacker-move horizon and exact v1/v2 operands", horizon => {
    const f = fixture("7k/5Q2/6K1/8/8/8/8/8 w - - 0 1", ["f7g7"]);
    const v1 = f.acquire(requestFor("rules.tactic.consequence.forced_mate_after_move@1", horizon));
    const v2 = f.acquire(requestFor("rules.tactic.consequence.forced_mate_after_move@2", horizon));
    expect(v1.sourceKey).not.toBe(v2.sourceKey);
    for (const source of [v1, v2]) expect(source.collection!.values[0]!.payload).toMatchObject({ maxAttackerMoves: horizon, proofStatus: "proved", beforeFen: f.path[0]!.fen, afterFen: f.selected.fen, candidate: "f7g7" });
    expect(Object.keys(v2.collection!.values[0]!.payload as object).sort()).toEqual(["beforeFen", "candidate", "afterFen", "attacker", "maxAttackerMoves", "proofStatus", "proofDigest", "rootReplies", "nodes"].sort());
    if (horizon !== 1) expect(v2.sourceKey).not.toBe(f.acquire(requestFor("rules.tactic.consequence.forced_mate_after_move@2", 1)).sourceKey);
  });

  it("keeps empty, projection-local unavailability, and refuted proof distinct", () => {
    const f = fixture();
    for (const projection of INSPECTOR_DEPENDENT_PROJECTIONS.slice(0, 3)) {
      const source = f.acquire(requestFor(projection));
      expect(source.outcome).toEqual({ kind: "no_witness" }); expect(source.collection!.values).toEqual([]); expect(source.sourceKey).not.toBeNull();
    }
    const refuted = f.acquire(requestFor("rules.tactic.consequence.forced_mate_after_move@2"));
    expect(refuted.outcome).toEqual({ kind: "available", collected: 1 });
    expect(refuted.collection!.values[0]!.payload).toMatchObject({ proofStatus: "refuted" });
    const pinned = fixture("1Bk5/r2pq3/2n5/8/8/8/8/2R1R1K1 w - - 0 1", ["b8a7"]);
    const unavailable = pinned.acquire({ projection: "rules.tactic.predicate.overload_conflict@1" });
    expect(unavailable.outcome).toEqual({ kind: "unavailable", reason: "no_legal_recapture" });
    expect(unavailable.collection!.values).toEqual([]); expect(unavailable.sourceKey).not.toBeNull();
  });

  it("retains actual empty and unavailable factory-result objects instead of reconstructed outcomes", () => {
    const f = fixture(), dispatch = vi.spyOn(routes, "invokeEvidenceValueRoute");
    const empty = f.acquire({ projection: "rules.tactic.predicate.overload_conflict@1" });
    expect(empty.collection!.result).toBe(dispatch.mock.results.at(-1)!.value);
    expect(empty.collection!.result).toEqual({ kind: "available", value: [] });
    dispatch.mockClear();
    const pinned = fixture("1Bk5/r2pq3/2n5/8/8/8/8/2R1R1K1 w - - 0 1", ["b8a7"]);
    const unavailable = pinned.acquire({ projection: "rules.tactic.predicate.overload_conflict@1" });
    expect(unavailable.collection!.result).toBe(dispatch.mock.results.at(-1)!.value);
    expect(unavailable.collection!.result).toEqual({ kind: "unavailable", reason: "no_legal_recapture" });
    dispatch.mockClear();
    const noFork = f.acquire({ projection: "derived.tactic.nonterminal_fork_survival@1" });
    expect(noFork.collection!.result).toBeNull(); // conditional target factory genuinely not invoked
    expect(dispatch.mock.calls.map(call => call[0])).toEqual(["run.record.edge@1", "rules.tactic.event.double_attack@1"]);
  });

  it("performs zero factory work at the root, without a missing horizon becoming an implicit default", () => {
    const f = fixture(), context = f.context(f.path[0]!.id), dispatch = vi.spyOn(routes, "invokeEvidenceValueRoute");
    for (const projection of INSPECTOR_DEPENDENT_PROJECTIONS) {
      const image = f.acquire(requestFor(projection), context);
      expect(image.outcome).toEqual({ kind: "missing_context", reason: "no_incoming_edge" });
      expect(image.sourceKey).toBeNull(); expect(image.collection).toBeNull();
    }
    expect(() => f.acquire({ projection: "rules.tactic.consequence.forced_mate_after_move@2" } as never, context)).toThrow();
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("uses inherited creating-branch edges and the selected prefix, not later play", () => {
    const f = fixture(initial, ["e2e4", "e7e5", "g1f3"], true), source = f.acquire({ projection: "derived.tactic.discovered_executed@1" });
    const image = f.service.readInspectorRecordedContext(source.context);
    expect(image.selection.branchId).not.toBe(f.originalBranch);
    expect(source.collection!.edge.payload.edgeBranchId).toBe(f.originalBranch);
    expect(source.collection!.edge.payload.afterNodeId).toBe(f.selected.id);
    expect(image.run.nodes.length).toBeGreaterThan(image.paths[0]!.nodes.length);
    expect(source.collection!.dependencies[0]!.payload).toMatchObject({ fen: f.path[0]!.fen });
  });

  it.each([
    ["R5rk/5Q2/6K1/8/8/8/8/8 w - - 0 1", "f7g7", true],
    ["5K1k/6pp/7R/6Q1/3B4/8/8/8 w - - 0 1", "g5g6", false],
  ] as const)("does not turn terminal double-attacks into vacuous fork survival: %s", (fen, move, check) => {
    const source = fixture(fen, [move]).acquire({ projection: "derived.tactic.nonterminal_fork_survival@1" });
    expect(source.outcome).toEqual({ kind: "available", collected: 1 });
    expect(source.collection!.values[0]!.payload).toMatchObject({ matched: false, replyBreadth: { terminal: true, check, count: 0, replies: [] } });
  });

  it("retains the actual en-passant captured target, not the landing square", () => {
    const source = fixture("k2r2r1/8/8/3pP3/8/8/8/1K4R1 w - d6 0 2", ["e5d6"]).acquire({ projection: "rules.tactic.predicate.overload_conflict@1" });
    expect(source.collection!.values[0]!.payload).toMatchObject({ capturedTarget: { square: "d5" }, candidate: "e5d6" });
  });

  it("refuses closed-request corruptions and foreign/current scope before dependency work", () => {
    const f = fixture(), context = f.context(), dispatch = vi.spyOn(routes, "invokeEvidenceValueRoute"), get = vi.fn(() => "derived.tactic.discovered_executed@1");
    const getter = {}; Object.defineProperty(getter, "projection", { enumerable: true, get });
    for (const input of [getter, { projection: "constructor" }, { projection: "derived.tactic.fork_survives_reply@1" },
      { projection: "derived.tactic.discovered_executed@1", parameters: { kind: "forced_mate", maxAttackerMoves: 1 } },
      { projection: "rules.tactic.consequence.forced_mate_after_move@2" },
      ...[0, 5, 1.5, "1", NaN].map(maxAttackerMoves => ({ projection: "rules.tactic.consequence.forced_mate_after_move@2", parameters: { kind: "forced_mate", maxAttackerMoves } })),
      { projection: "rules.tactic.consequence.forced_mate_after_move@2", parameters: { kind: "forced_mate", maxAttackerMoves: 1, nodeCap: 1 } },
      { projection: "derived.tactic.discovered_executed@1", beforeFen: initial },
      Object.create({ projection: "derived.tactic.discovered_executed@1" })]) expect(() => f.acquire(input as never, context)).toThrow();
    expect(get).not.toHaveBeenCalled();
    expect(() => f.acquire({ projection: "derived.tactic.discovered_executed@1" }, f.context(f.selected.id, "position"))).toThrow();
    expect(() => f.acquire({ projection: "derived.tactic.discovered_executed@1" }, { ...context } as InspectorRecordedContext)).toThrow();
    expect(() => new RunService(f.storage).acquireInspectorDependentSource(context, { projection: "derived.tactic.discovered_executed@1" }, f.controller.signal)).toThrow();
    f.controller.abort(); expect(() => f.acquire({ projection: "derived.tactic.discovered_executed@1" }, context)).toThrow();
    expect(dispatch).not.toHaveBeenCalled();
  });

  it.each(["advance", "cancel"] as const)("rechecks currentness after %s during actual dependency work", kind => {
    const f = fixture(), context = f.context(), original = dependent.collectInspectorDependentEdge;
    const collect = vi.spyOn(dependent, "collectInspectorDependentEdge").mockImplementationOnce((...args) => {
      const result = original(...args);
      if (kind === "cancel") f.controller.abort();
      else f.storage.save(revealFeedback(commitMove(f.run, "b8c6", { at }).run, at).run, f.lease);
      return result;
    });
    const act = () => f.acquire({ projection: "derived.tactic.discovered_executed@1" }, context);
    if (kind === "advance") expect(act).toThrow(expect.objectContaining({ reason: "stale" })); else expect(act).toThrow();
    expect(collect).toHaveBeenCalledTimes(1);
  });

  it("owned retained reads reject copies/foreign owners and actual disclosure reclosure", () => {
    const f = fixture(), token = f.service.acquireInspectorDependentSource(f.context(), { projection: "derived.tactic.discovered_executed@1" }, f.controller.signal);
    const image = f.service.readInspectorDependentSource(token);
    for (const forged of [{ ...token }, JSON.parse(JSON.stringify(token)), Object.create(token), image]) expect(() => f.service.readInspectorDependentSource(forged as InspectorDependentSource)).toThrow();
    expect(() => new RunService(f.storage).readInspectorDependentSource(token)).toThrow();
    expect(evidenceValueReceipt(image.collection!.edge).factory).toBe("createRunRecordEdgeV1Evidence");
    f.storage.save(commitMove(f.run, "b8c6", { at }).run, f.lease);
    expect(() => f.service.readInspectorDependentSource(token)).toThrow(expect.objectContaining({ code: "ASSISTANCE_WITHHELD" }));
  });

  it("retains a detached closed request and refuses nested accessor/extra parameter inputs without work", () => {
    const f = fixture("7k/5Q2/6K1/8/8/8/8/8 w - - 0 1", ["f7g7"]);
    const request = { projection: "rules.tactic.consequence.forced_mate_after_move@2" as const, parameters: { kind: "forced_mate" as const, maxAttackerMoves: 1 as 1 | 2 | 3 | 4 } };
    const token = f.service.acquireInspectorDependentSource(f.context(), request, f.controller.signal);
    const source = f.service.readInspectorDependentSource(token);
    request.parameters.maxAttackerMoves = 4;
    expect(source.request).toEqual(requestFor(request.projection, 1));
    expect(Object.isFrozen(source.request)).toBe(true); expect(Object.isFrozen("parameters" in source.request && source.request.parameters)).toBe(true);
    expect(f.service.readInspectorDependentSource(token).sourceKey).toBe(source.sourceKey);
    const dispatch = vi.spyOn(routes, "invokeEvidenceValueRoute"), get = vi.fn(() => 1);
    const parameters = { kind: "forced_mate" }; Object.defineProperty(parameters, "maxAttackerMoves", { enumerable: true, get });
    const hidden = requestFor(request.projection); Object.defineProperty(hidden, "extra", { value: true });
    const symbol = requestFor(request.projection); Object.defineProperty(symbol, Symbol("extra"), { value: true });
    for (const input of [{ projection: request.projection, parameters }, hidden, symbol,
      { projection: request.projection, parameters: Object.create({ kind: "forced_mate", maxAttackerMoves: 1 }) }]) expect(() => f.acquire(input as never)).toThrow();
    expect(get).not.toHaveBeenCalled(); expect(dispatch).not.toHaveBeenCalled();
  });
});
