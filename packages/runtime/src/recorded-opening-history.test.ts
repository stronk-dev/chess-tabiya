import { readFile } from "node:fs/promises";
import { afterEach, describe, expect, it, vi } from "vitest";
import { branchPath } from "./branch-path.js";
import { admitInstalledOpeningCatalogue } from "./opening-catalogue.js";
import { importedRun, play } from "./testing/review-evidence-fixture.js";
import { collectRecordedOpeningHistory, readRecordedOpeningHistory } from "./recorded-opening-history.js";
import * as routes from "./internal/evidence-value-routes.js";
import { fork } from "./runtime.js";

const artifact = JSON.parse(await readFile(new URL("../../../apps/server/artifacts/runtime-opening-catalogue.json", import.meta.url), "utf8"));
const installation = admitInstalledOpeningCatalogue(artifact);
if (installation.kind !== "available") throw new TypeError(installation.reason);
const source = installation.source;
function fixture(moves = ["e2e4", "e7e5", "g1f3", "b8c6"]) {
  const run = structuredClone(play(importedRun("recorded-opening-history"), moves));
  const branchId = run.activeCursor.branchId, path = branchPath(run, branchId);
  return { run, branchId, path, throughNodeId: path.at(-1)!.id, source };
}
afterEach(() => vi.restoreAllMocks());
function collect({ source, run, branchId, throughNodeId }: Parameters<typeof collectRecordedOpeningHistory>[0]) {
  return collectRecordedOpeningHistory({ source, run, branchId, throughNodeId });
}

describe("complete recorded opening history source", () => {
  it("captures every original root-inclusive occurrence, paired lookup and original point array", () => {
    const f = fixture(), history = collect(f), data = readRecordedOpeningHistory(history);
    expect(data.rows).toHaveLength(f.path.length);
    expect(data.authority).toMatchObject({ runId: f.run.id, branchId: f.branchId, throughNodeId: f.throughNodeId, catalogue: source.ref });
    expect(data.run).not.toBe(f.run);
    for (const [index, row] of data.rows.entries()) {
      expect(row.pathIndex).toBe(index);
      expect(row.node).toEqual(f.path[index]);
      expect(row.position.payload).toEqual({ nodeId: row.node.id, ply: row.node.ply, fen: row.node.fen });
      const input = { source, position: row.position };
      const a = routes.readRecordedOpeningPointResult(row.endpoints, input, "theory.opening.current_endpoint@1");
      const b = routes.readRecordedOpeningPointResult(row.memberships, input, "theory.opening.catalogue_membership@1");
      expect(a.invocation).toBe(row.invocation);
      expect(b.invocation).toBe(row.invocation);
      expect(row.lookup).toBe(a.lookup);
      expect(Object.isFrozen(row)).toBe(true);
    }
    expect(Object.isFrozen(data.run.events)).toBe(true);
    Object.assign(f.run.nodes[1]!, { fen: f.run.nodes[0]!.fen });
    expect(readRecordedOpeningHistory(history)).toBe(data);
    expect(data.rows[1]!.node.fen).not.toBe(f.run.nodes[1]!.fen);
  });

  it("retains genuine negatives and repeated equal keys without reusing occurrence identity", () => {
    const f = fixture(["g1f3", "g8f6", "f3g1", "f6g8", "e2e4", "a7a6", "a2a3"]);
    const data = readRecordedOpeningHistory(collect(f));
    expect(data.rows).toHaveLength(8);
    expect(data.rows[0]!.position).not.toBe(data.rows[4]!.position);
    expect(data.rows[0]!.invocation).not.toBe(data.rows[4]!.invocation);
    expect(data.rows[5]!.endpoints[0]!.payload).toMatchObject({ kind: "matched", observedPly: 5, sourcePly: 1, eco: "B00" });
    expect(data.rows.at(-1)!.lookup.result.currentEndpoint).toMatchObject({ kind: "absent", reason: "no_named_endpoint" });
    expect(data.rows.at(-1)!.endpoints).toEqual([]);
    expect(() => routes.readRecordedOpeningPointResult([], { source, position: data.rows.at(-1)!.position }, "theory.opening.current_endpoint@1")).toThrow();
  });

  it("validates the entire original suffix before narrowing or any lookup", () => {
    const f = fixture(), bad = structuredClone(f.run);
    Object.assign(bad.nodes.at(-1)!, { moveUci: "a1a8" });
    // Keep event and snapshot equally corrupt: equality alone is insufficient.
    const event = bad.events.find(value => value.type === "move.committed" && value.data.node.id === bad.nodes.at(-1)!.id)!;
    if (event.type !== "move.committed") throw new Error("fixture");
    Object.assign(event.data.node, { moveUci: "a1a8" });
    const dispatcher = vi.spyOn(routes, "invokeEvidenceValueRoute");
    expect(() => collectRecordedOpeningHistory({ source, run: bad, branchId: f.branchId, throughNodeId: f.path[0]!.id })).toThrow();
    expect(dispatcher).not.toHaveBeenCalled();
  });

  it("refuses corrupt unrelated branches, unknown/off-path endpoints and copied installations", () => {
    const f = fixture();
    const branched = fork(f.run, f.path[1]!.id, { at: "2026-10-31T00:00:00.000Z" }).run;
    const other = play(branched, ["c7c5"]), otherPath = branchPath(other, other.activeCursor.branchId);
    expect(readRecordedOpeningHistory(collectRecordedOpeningHistory({ source, run: other, branchId: other.activeCursor.branchId, throughNodeId: otherPath.at(-1)!.id })).rows.map(row => row.node.id)).toEqual(otherPath.map(node => node.id));
    expect(() => collectRecordedOpeningHistory({ source, run: other, branchId: f.branchId, throughNodeId: otherPath.at(-1)!.id })).toThrow();
    const bad = structuredClone(other);
    const brokenNode = bad.nodes.find(node => node.id === otherPath.at(-1)!.id)!;
    Object.assign(brokenNode, { moveUci: "a1a8" });
    const event = bad.events.find(value => value.type === "move.committed" && value.data.node.id === brokenNode.id)!;
    if (event.type !== "move.committed") throw new Error("fixture");
    Object.assign(event.data.node, { moveUci: "a1a8" });
    const dispatcher = vi.spyOn(routes, "invokeEvidenceValueRoute");
    expect(() => collectRecordedOpeningHistory({ source, run: bad, branchId: f.branchId, throughNodeId: f.path[0]!.id })).toThrow();
    expect(dispatcher).not.toHaveBeenCalled();
    for (const input of [{ ...f, source: { ...source } }, { ...f, branchId: "unknown" }, { ...f, throughNodeId: "unknown" }]) expect(() => collect(input)).toThrow();
  });

  it("refuses copied or foreign point results before treating them as successful absence", () => {
    const f = fixture([]), actual = routes.invokeEvidenceValueRoute;
    const another = actual("run.record.position@1", { run: f.run, nodeId: f.path[0]!.id });
    const foreign = actual("theory.opening.current_endpoint@1", { source, position: another });
    for (const mode of ["copied", "foreign"] as const) {
      const spy = vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation(((route: string, input: never) => {
        const result = actual(route as never, input) as unknown;
        if (route !== "theory.opening.current_endpoint@1") return result;
        if (mode === "foreign") return foreign;
        return { kind: "available", value: [...(result as { value: unknown[] }).value] };
      }) as typeof actual);
      expect(() => collect(f)).toThrow(/original source\/position/);
      spy.mockRestore();
    }
  });

  it("root-only is real history and copied sources are never recognized", () => {
    const f = fixture([]), history = collect(f);
    expect(readRecordedOpeningHistory(history).rows).toHaveLength(1);
    for (const copy of [{ ...history }, structuredClone(history), { source, run: f.run }]) expect(() => readRecordedOpeningHistory(copy as never)).toThrow();
    for (const extra of [{ ...f }, { source, run: f.run, branchId: f.branchId, throughNodeId: f.throughNodeId, visits: [] }]) expect(() => collectRecordedOpeningHistory(extra)).toThrow(/exactly/);
  });
});
