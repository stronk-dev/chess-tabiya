import { readFile } from "node:fs/promises";
import { afterEach, describe, expect, it, vi } from "vitest";
import { admitInstalledOpeningCatalogue, branchPath, commitMove, compileAssistanceRequest, createRun, fork, moduleDecisionStamp, revealFeedback, rewind, serverAvailabilityFromProviders, type OpeningCatalogueAvailability } from "@chess-tabiya/runtime";
import * as routes from "../../../packages/runtime/src/internal/evidence-value-routes.js";
import * as supplier from "../../../packages/runtime/src/inspector-opening-source.js";
import * as histories from "../../../packages/runtime/src/recorded-opening-history.js";
import * as subjects from "../../../packages/runtime/src/run-subject.js";
import { readRecordedOpeningHistory } from "../../../packages/runtime/src/recorded-opening-history.js";
import type { InspectorRecordedContext } from "./inspector-recorded-context.js";
import type { InspectorOpeningSource } from "./inspector-opening-source.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";

const artifact = JSON.parse(await readFile(new URL("../artifacts/runtime-opening-catalogue.json", import.meta.url), "utf8"));
const installed = admitInstalledOpeningCatalogue(artifact);
if (installed.kind !== "available") throw new Error(installed.reason);
const at = "2026-11-02T18:00:00.000Z", owner = { learnerId: "inspector-opening-owner", handle: "inspector-opening-owner" };
const availability = serverAvailabilityFromProviders({ opponent: "none", judge: "none", llm: "none", corpus: "none", tts: "none", tablebase: "none" });
const requested = compileAssistanceRequest({ contextHint: "position", preference: { kind: "explicit", preset: "analysis", overrides: {}, moduleOverrides: { include: [], exclude: [] } } });
const stores: SQLiteRunStorage[] = [];
afterEach(() => { vi.restoreAllMocks(); for (const store of stores.splice(0)) store.close(); });
const MEMBER = "theory.opening.catalogue_membership@1", DEEPEST = "derived.opening.deepest_reached@2";
const PROJECTIONS = [MEMBER, DEEPEST] as const;
function fixture(side: "white" | "black" = "white", moves: readonly string[] = ["e2e4", "e7e5", "g1f3", "b8c6"], opening: OpeningCatalogueAvailability | undefined = installed, fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1") {
  let run = createRun({ id: `inspector-opening-${side}`, session: { kind: "position", start: { fen, side }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } },
    sessionDigest: `sha256:${"a".repeat(64)}`, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1, createdAt: at });
  for (const move of moves) run = commitMove(run, move, { at }).run;
  run = revealFeedback(run, at).run;
  const path = branchPath(run, run.activeCursor.branchId), storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} }); stores.push(storage);
  storage.createLearner({ id: owner.learnerId, handle: owner.handle, passwordHash: "!", createdAt: at });
  const lease = { writerId: "inspector-opening-writer", learnerId: owner.learnerId }; storage.create(run, lease);
  const service = new RunService(storage, { openingCatalogue: opening }), controller = new AbortController();
  const context = (kind: "position" | "branch" = "position", end = path.at(-1)!.id, selected = end) => service.resolveInspectorRecordedContext(run.id, owner, requested, availability,
    { branchId: run.activeCursor.branchId, nodeId: selected, decisionDigest: moduleDecisionStamp(run).digest, context: kind === "position" ? { kind } : { kind, throughNodeId: end } }, controller.signal);
  const acquire = (projection: typeof MEMBER | typeof DEEPEST, token = context(projection === MEMBER ? "position" : "branch")) => service.readInspectorOpeningSource(service.acquireInspectorOpeningSource(token, projection, controller.signal));
  return { run, path, storage, lease, service, controller, context, acquire };
}

describe("installed opening Inspector sources through actual current service grants", () => {
  it.each(["white", "black"] as const)("retains exact membership lookup at the requested node for %s", side => {
    const f = fixture(side), original = JSON.stringify(f.storage.read(f.run.id)), dispatch = vi.spyOn(routes, "invokeEvidenceValueRoute");
    const image = f.acquire(MEMBER);
    expect(image.outcome).toEqual({ kind: "available", collected: 1 });
    expect(image.collection!.projection).toBe(MEMBER);
    expect(dispatch.mock.calls.map(call => call[0])).toEqual(["run.record.position@1", MEMBER]);
    expect(image.collection!.result).toBe(dispatch.mock.results[1]!.value);
    expect(image.collection!.values).toHaveLength(1);
    expect(image.sourceKey).toMatch(/^sha256:[a-f0-9]{64}$/u);
    expect(JSON.stringify(f.storage.read(f.run.id))).toBe(original);
  });

  it.each(["white", "black"] as const)("retains root-inclusive history and exact original reduction for %s", side => {
    const f = fixture(side), dispatch = vi.spyOn(routes, "invokeEvidenceValueRoute");
    const image = f.acquire(DEEPEST, f.context("branch", f.path.at(-1)!.id, f.path[0]!.id));
    expect(image.outcome.kind).toBe("available");
    const collection = image.collection!;
    if (collection.projection !== DEEPEST) throw new Error("Expected original opening history");
    const history = readRecordedOpeningHistory(collection.history);
    expect(history.run).toEqual(f.run);
    expect(history.rows.map(row => row.node.id)).toEqual(f.path.map(node => node.id));
    expect(history.rows[0]!.endpoints).toEqual([]);
    expect(collection.result).toBe(dispatch.mock.results.at(-1)!.value);
    expect(dispatch.mock.calls.at(-1)![0]).toBe(DEEPEST);
    collection.result.forEach((item, index) => expect(collection.values[index]).toBe(item.evidence));
  });

  it.each(PROJECTIONS)("%s keeps actual different empty inputs distinct even with identical IDs/decision/cursor", projection => {
    const a = fixture("white", [], installed, "4k3/7p/8/8/8/8/P7/4K3 w - - 0 1");
    const b = fixture("white", [], installed, "3k4/7p/8/8/8/8/P7/4K3 w - - 0 1");
    expect(a.run.id).toBe(b.run.id); expect(moduleDecisionStamp(a.run)).toEqual(moduleDecisionStamp(b.run));
    expect(a.run.activeCursor).toEqual(b.run.activeCursor);
    const first = a.acquire(projection), second = b.acquire(projection);
    expect(first.outcome).toEqual({ kind: "no_witness" }); expect(second.outcome).toEqual({ kind: "no_witness" });
    expect(first.collection!.values).toEqual([]); expect(second.collection!.values).toEqual([]);
    expect(first.sourceKey).not.toBe(second.sourceKey);
  });

  it.each(PROJECTIONS.flatMap(projection => (["artifact_missing", "artifact_invalid", "digest_mismatch"] as const).map(reason => ({ projection, reason }))))("retains exact $projection / $reason installation state without source work", ({ projection, reason }) => {
    const f = fixture("white", [], { kind: "unavailable", reason }), collect = vi.spyOn(supplier, "collectInspectorOpeningSource"), dispatch = vi.spyOn(routes, "invokeEvidenceValueRoute");
    const image = f.acquire(projection);
    expect(image.outcome).toEqual({ kind: reason === "artifact_missing" ? "unavailable" : "failed", reason });
    expect(image.installation).toEqual({ kind: "unavailable", reason });
    expect(image.collection).toBeNull(); expect(image.sourceKey).toBeNull();
    expect(collect).not.toHaveBeenCalled(); expect(dispatch).not.toHaveBeenCalled();
  });

  it.each(["white", "black"] as const)("collects every requested %s prefix including a real empty root, not the whole tip", side => {
    const f = fixture(side), collect = vi.spyOn(histories, "collectRecordedOpeningHistory");
    for (const [index, node] of f.path.entries()) {
      const image = f.acquire(DEEPEST, f.context("branch", node.id, f.path[0]!.id)), collection = image.collection!;
      if (collection.projection !== DEEPEST) throw new Error("Expected history");
      const data = readRecordedOpeningHistory(collection.history);
      expect(data.authority.throughNodeId).toBe(node.id); expect(data.rows.map(row => row.node.id)).toEqual(f.path.slice(0, index + 1).map(row => row.id));
      expect(collect.mock.calls.at(-1)![0].run).toEqual(f.run);
      if (index === 0) { expect(collection.result).toEqual([]); expect(image.outcome).toEqual({ kind: "no_witness" }); expect(image.sourceKey).not.toBeNull(); }
    }
  });

  it("retains every repeated/negative visit with its original position and paired lookup", () => {
    const f = fixture("white", ["g1f3", "g8f6", "f3g1", "f6g8", "e2e4"]), collection = f.acquire(DEEPEST).collection!;
    if (collection.projection !== DEEPEST) throw new Error("Expected history");
    const data = readRecordedOpeningHistory(collection.history);
    expect(data.rows).toHaveLength(6); expect(data.rows.map(row => row.pathIndex)).toEqual([0, 1, 2, 3, 4, 5]);
    const first = data.rows[0]!.lookup.result.currentEndpoint, repeated = data.rows[4]!.lookup.result.currentEndpoint;
    if (first.kind === "abstained" || repeated.kind === "abstained") throw new Error("Installed lookup unexpectedly abstained");
    expect(first.positionKey).toBe(repeated.positionKey);
    expect(data.rows[0]!.position).not.toBe(data.rows[4]!.position);
    expect(data.rows[0]!.invocation).not.toBe(data.rows[4]!.invocation);
    expect(data.rows[0]!.endpoints).toEqual([]);
    expect(data.rows.map(row => row.position.payload.nodeId)).toEqual(f.path.map(node => node.id));
  });

  it.each(PROJECTIONS)("retains %s inherited nodes separately from its granted branch", projection => {
    const f = fixture(), originalBranch = f.run.activeCursor.branchId, end = f.path.at(-1)!.id;
    const run = revealFeedback(fork(rewind(f.run, end, at, undefined, originalBranch).run, end, { at }).run, at).run;
    f.storage.save(run, f.lease);
    const context = f.service.resolveInspectorRecordedContext(run.id, owner, requested, availability, { branchId: run.activeCursor.branchId,
      nodeId: end, decisionDigest: moduleDecisionStamp(run).digest, context: projection === MEMBER ? { kind: "position" } : { kind: "branch", throughNodeId: end } }, f.controller.signal);
    const image = f.acquire(projection, context), data = supplier.readInspectorOpeningCollection(image.collection!);
    expect(data.branchId).toBe(run.activeCursor.branchId); expect(data.branchId).not.toBe(originalBranch);
    expect(data.run.nodes.at(-1)!.branchId).toBe(originalBranch); expect(image.outcome.kind).toBe("available");
  });

  it("refuses wrong refs/scopes/copied or foreign contexts and cancelled requests before source work", () => {
    const f = fixture(), point = f.context(), branch = f.context("branch"), collect = vi.spyOn(supplier, "collectInspectorOpeningSource");
    const coerce = vi.fn(() => MEMBER);
    for (const ref of ["constructor", "__proto__", "derived.opening.deepest_reached@1", "theory.opening.current_endpoint@1", { [Symbol.toPrimitive]: coerce }]) expect(() => f.acquire(ref as never, point)).toThrow();
    expect(coerce).not.toHaveBeenCalled();
    expect(() => f.acquire(MEMBER, branch)).toThrow(); expect(() => f.acquire(DEEPEST, point)).toThrow();
    expect(() => f.acquire(MEMBER, { ...point } as InspectorRecordedContext)).toThrow();
    expect(() => new RunService(f.storage, { openingCatalogue: installed }).acquireInspectorOpeningSource(point, MEMBER, f.controller.signal)).toThrow();
    f.controller.abort(); expect(() => f.acquire(MEMBER, point)).toThrow(); expect(collect).not.toHaveBeenCalled();
  });

  it("rejects a genuine same-ID foreign resolution before position or membership work", () => {
    const f = fixture("white", []), context = f.context();
    const other = fixture("white", [], installed, "4k3/7p/8/8/8/8/P7/4K3 w - - 0 1");
    expect(other.run.id).toBe(f.run.id); expect(other.run.activeCursor).toEqual(f.run.activeCursor);
    const foreign = subjects.resolveRunSubject(other.run, { kind: "run_node", runId: other.run.id,
      branchId: other.run.activeCursor.branchId, nodeId: other.path[0]!.id,
      eventHeadDigest: subjects.digestRunEventHead({ runId: other.run.id, headSeq: other.run.events.length, events: other.run.events }) });
    vi.spyOn(subjects, "resolveRunSubject").mockReturnValueOnce(foreign);
    const dispatch = vi.spyOn(routes, "invokeEvidenceValueRoute");
    expect(() => f.acquire(MEMBER, context)).toThrow();
    expect(dispatch).not.toHaveBeenCalled();
  });

  it.each(["copy", "position", "membership"] as const)("rejects %s point authority before any successful source is issued", fault => {
    const f = fixture(), context = f.context(), other = fixture("black"), original = routes.invokeEvidenceValueRoute;
    const foreignPosition = original("run.record.position@1", { run: other.run, nodeId: other.path.at(-1)!.id });
    const negativePosition = original("run.record.position@1", { run: other.run, nodeId: other.path[0]!.id });
    const foreignResult = original(MEMBER, { source: installed.source, position: negativePosition });
    expect(foreignResult).toEqual({ kind: "available", value: [] });
    const dispatch = vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation(((ref: string, input: never) => {
      if (fault === "position" && ref === "run.record.position@1") return foreignPosition;
      if (ref === MEMBER) return fault === "membership" ? foreignResult : { kind: "available", value: [...(original(MEMBER, input) as { kind: "available"; value: readonly unknown[] }).value] };
      return original(ref as never, input);
    }) as typeof routes.invokeEvidenceValueRoute);
    expect(() => f.acquire(MEMBER, context)).toThrow();
    if (fault === "position") expect(dispatch.mock.calls.some(call => call[0] === MEMBER)).toBe(false);
  });

  it.each(["copy", "endpoint", "head", "projection"] as const)("rejects a genuine/copy crossed %s collection before publication", fault => {
    const f = fixture(), context = f.context("branch");
    const run = fault === "head" ? commitMove(f.run, "f1c4", { at }).run : f.run;
    const original = supplier.collectInspectorOpeningSource(run, run.activeCursor.branchId,
      fault === "endpoint" ? f.path[0]!.id : f.path.at(-1)!.id, installed.source, fault === "projection" ? MEMBER : DEEPEST, f.controller.signal);
    vi.spyOn(supplier, "collectInspectorOpeningSource").mockReturnValueOnce(fault === "copy" ? { ...original } : original);
    expect(() => f.acquire(DEEPEST, context)).toThrow();
  });

  it.each(["prefix", "head"] as const)("rejects a genuine foreign %s history before reducing its output", fault => {
    const f = fixture(), context = f.context("branch"), run = fault === "head" ? commitMove(f.run, "f1c4", { at }).run : f.run;
    const foreign = histories.collectRecordedOpeningHistory({ source: installed.source, run, branchId: run.activeCursor.branchId,
      throughNodeId: fault === "prefix" ? f.path[0]!.id : f.path.at(-1)!.id });
    vi.spyOn(histories, "collectRecordedOpeningHistory").mockReturnValueOnce(foreign);
    const dispatch = vi.spyOn(routes, "invokeEvidenceValueRoute");
    expect(() => f.acquire(DEEPEST, context)).toThrow();
    expect(dispatch.mock.calls.some(call => call[0] === DEEPEST)).toBe(false);
  });

  it("rejects a copied installed source before acquiring any point or history", () => {
    const f = fixture("white", undefined, { ...installed, source: { ...installed.source } });
    const collect = vi.spyOn(supplier, "collectInspectorOpeningSource"), dispatch = vi.spyOn(routes, "invokeEvidenceValueRoute");
    expect(() => f.acquire(MEMBER)).toThrow(); expect(() => f.acquire(DEEPEST)).toThrow();
    expect(collect).not.toHaveBeenCalled(); expect(dispatch).not.toHaveBeenCalled();
  });

  it.each(PROJECTIONS)("checks cancellation between %s source preparation and target work", projection => {
    const f = fixture(), context = f.context(projection === MEMBER ? "position" : "branch"), original = routes.invokeEvidenceValueRoute;
    if (projection === DEEPEST) {
      const collect = histories.collectRecordedOpeningHistory;
      vi.spyOn(histories, "collectRecordedOpeningHistory").mockImplementationOnce(input => { const history = collect(input); f.controller.abort(); return history; });
    }
    const dispatch = vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation((...args) => {
      const value = original(...args);
      if (projection === MEMBER && args[0] === "run.record.position@1") f.controller.abort();
      return value;
    });
    expect(() => f.acquire(projection, context)).toThrow();
    expect(dispatch.mock.calls.some(call => call[0] === projection)).toBe(false);
  });

  it.each(["retain", "during"] as const)("detects %s replacement by another genuine same-byte installed source", when => {
    const mutable = { ...installed }, replacement = admitInstalledOpeningCatalogue(artifact);
    if (replacement.kind !== "available") throw new Error(replacement.reason);
    const f = fixture("white", undefined, mutable), context = f.context();
    const replace = () => { mutable.source = replacement.source; mutable.catalogue = replacement.catalogue; };
    expect(mutable.source.ref).toEqual(replacement.source.ref); expect(mutable.source).not.toBe(replacement.source);
    if (when === "retain") {
      const source = f.service.acquireInspectorOpeningSource(context, MEMBER, f.controller.signal); replace();
      expect(() => f.service.readInspectorOpeningSource(source)).toThrow(expect.objectContaining({ reason: "stale" }));
    } else {
      const collect = supplier.collectInspectorOpeningSource;
      vi.spyOn(supplier, "collectInspectorOpeningSource").mockImplementationOnce((...args) => { const value = collect(...args); replace(); return value; });
      expect(() => f.acquire(MEMBER, context)).toThrow(expect.objectContaining({ reason: "stale" }));
    }
  });

  it("owned reads reject copies/foreign owners and actual feedback reclosure", () => {
    const f = fixture(), source = f.service.acquireInspectorOpeningSource(f.context(), MEMBER, f.controller.signal);
    for (const copy of [{ ...source }, JSON.parse(JSON.stringify(source)), Object.create(source), f.service.readInspectorOpeningSource(source)]) expect(() => f.service.readInspectorOpeningSource(copy as InspectorOpeningSource)).toThrow();
    expect(() => new RunService(f.storage, { openingCatalogue: installed }).readInspectorOpeningSource(source)).toThrow();
    f.storage.save(commitMove(f.run, "f1c4", { at }).run, f.lease);
    expect(() => f.service.readInspectorOpeningSource(source)).toThrow(expect.objectContaining({ code: "ASSISTANCE_WITHHELD" }));
  });
});
