import { describe, expect, it } from "vitest";
import { normalizeMove } from "chessops/chess";
import { parseUci } from "chessops/util";
import { canonicalFen, positionFromFen } from "./position-cache.js";
import { assertDeclaredEvidence, declareEvidence, evidenceValueReceipt, type DeclaredEvidence } from "./evidence-contract.js";
import { openFileOccupancyOperands } from "./semantic-evidence.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import { directProjectionConventions } from "./evidence-convention-closure.js";

function available<T>(result: { kind: "available"; value: T } | { kind: "unavailable"; reason: string }): T {
  expect(result.kind).toBe("available");
  if (result.kind !== "available") throw Error(result.reason);
  return result.value;
}
const source = (fen: string) => invokeEvidenceValueRoute("rules.structural.reading.pawn_connectivity@1", { fen });
const groups = (root: ReturnType<typeof source>) => available(invokeEvidenceValueRoute("derived.structural.reading.pawn_file_group@1", { source: root }));
const files = (root: ReturnType<typeof source>) => available(invokeEvidenceValueRoute("derived.activity.reading.file_state@1", { source: root }));
function edge(fen: string, moveUci: string) {
  const position = positionFromFen(fen), beforeFen = canonicalFen(position), move = normalizeMove(position, parseUci(moveUci)!);
  expect(position.isLegal(move)).toBe(true); position.play(move);
  const afterFen = canonicalFen(position);
  return { before: source(beforeFen), after: source(afterFen), moveUci, edge: { beforeFen, moveUci, afterFen } };
}
const groupChanges = (pair: ReturnType<typeof edge>) => available(invokeEvidenceValueRoute("derived.structural.event.pawn_file_group@1", { before: groups(pair.before), moveUci: pair.moveUci, after: groups(pair.after) }));
const fileChanges = (pair: ReturnType<typeof edge>) => available(invokeEvidenceValueRoute("derived.activity.event.file_state@1", { before: files(pair.before), moveUci: pair.moveUci, after: files(pair.after) }));
const islands = (pair: ReturnType<typeof edge>) => available(invokeEvidenceValueRoute("rules.structural.event.pawn_islands@2", { before: pair.before, moveUci: pair.moveUci, after: pair.after }));
const access = (change: ReturnType<typeof fileChanges>[number]) => available(invokeEvidenceValueRoute("derived.activity.event.file_access_revealed@1", { change }));

function reseal<T>(original: DeclaredEvidence<T>, payload = original.payload): DeclaredEvidence<T> {
  const receipt = evidenceValueReceipt(original);
  return declareEvidence(original.producer, original.projection, payload, { factory: receipt.factory, inputDigest: receipt.inputDigest,
    sourceDigests: receipt.sourceDigests, ...(receipt.convention === undefined ? {} : { convention: receipt.convention }) });
}

describe("complete pawn-file and file-state source authority", () => {
  it("retains three-pawn groups, exact islands and opposite color-relative orders", () => {
    const root = source("4k3/8/P6p/8/P6p/2P5/P6p/4K3 w - - 0 1"), value = groups(root);
    expect(value.payload.groups).toEqual([
      { color: "white", file: "a", pawns: ["a6", "a4", "a2"], adjacentOccupiedFiles: [], islandFiles: ["a"], isolated: true, doubled: true },
      { color: "white", file: "c", pawns: ["c3"], adjacentOccupiedFiles: [], islandFiles: ["c"], isolated: true, doubled: false },
      { color: "black", file: "h", pawns: ["h2", "h4", "h6"], adjacentOccupiedFiles: [], islandFiles: ["h"], isolated: true, doubled: true },
    ]);
    expect(evidenceValueReceipt(value).sourceDigests).toEqual([evidenceValueReceipt(root).payloadDigest]);
    expect(Object.isFrozen(value.payload.groups[0]!.pawns)).toBe(true);
  });

  it("retains adjacent occupied files and complete multi-file island identities", () => {
    const value = groups(source("7k/8/8/8/8/8/PP1P4/7K w - - 0 1"));
    expect(value.payload.groups.find(row => row.file === "a")).toMatchObject({ adjacentOccupiedFiles: ["b"], islandFiles: ["a", "b"], isolated: false });
    expect(value.payload.groups.find(row => row.file === "b")).toMatchObject({ adjacentOccupiedFiles: ["a"], islandFiles: ["a", "b"] });
    expect(value.payload.groups.find(row => row.file === "d")).toMatchObject({ adjacentOccupiedFiles: [], islandFiles: ["d"], isolated: true });
  });

  it("owns all eight file states, keeping open distinct from both half-open states", () => {
    const value = files(source("7k/pp6/8/8/8/8/P1P5/7K w - - 0 1"));
    expect(value.payload.files).toHaveLength(8);
    expect(value.payload.files.slice(0, 4)).toEqual([
      { file: "a", whitePawns: ["a2"], blackPawns: ["a7"], state: "closed" },
      { file: "b", whitePawns: [], blackPawns: ["b7"], state: "half_open_white" },
      { file: "c", whitePawns: ["c2"], blackPawns: [], state: "half_open_black" },
      { file: "d", whitePawns: [], blackPawns: [], state: "open" },
    ]);
  });

  it("retains sealed available empty groups and eight explicit open files with no pawns", () => {
    const root = source("4k3/8/8/8/8/8/8/4K3 w - - 0 1"), g = groups(root), f = files(root);
    assertDeclaredEvidence(g); assertDeclaredEvidence(f);
    expect(g.payload.groups).toEqual([]);
    expect(f.payload.files).toHaveLength(8);
    expect(f.payload.files.every(row => row.state === "open" && row.whitePawns.length === 0 && row.blackPawns.length === 0)).toBe(true);
  });

  it.each(["derived.structural.reading.pawn_file_group@1", "derived.activity.reading.file_state@1"] as const)("%s refuses copied or re-sealed root authority and caller-written domains", route => {
    const root = source("4k3/8/8/8/8/8/8/4K3 w - - 0 1");
    for (const input of [{ source: { ...root } }, { source: reseal(root) }, { source: root, groups: [] }, { source: root, files: [] }, { source: root, fen: root.payload.fen }]) {
      expect(() => invokeEvidenceValueRoute(route, input as never)).toThrow();
    }
  });
});

describe("membership, file classes and legal causes", () => {
  it("keeps lost and gained file groups distinct, including removal of the last pawn", () => {
    const moved = groupChanges(edge("7k/8/8/8/8/2n5/1P6/7K w - - 0 1", "b2c3"));
    expect(moved.map(value => value.payload)).toEqual([
      expect.objectContaining({ subject: { color: "white", file: "b" }, sign: "lost", before: expect.objectContaining({ pawns: ["b2"] }), after: null }),
      expect.objectContaining({ subject: { color: "white", file: "c" }, sign: "gained", before: null, after: expect.objectContaining({ pawns: ["c3"] }) }),
    ]);
    const removed = edge("7k/8/8/1p6/2B5/8/8/7K w - - 0 1", "c4b5");
    expect(groups(removed.after).payload.groups).toEqual([]);
    expect(groupChanges(removed).map(value => value.payload)).toEqual([expect.objectContaining({ subject: { color: "black", file: "b" }, sign: "lost", before: expect.objectContaining({ pawns: ["b5"] }), after: null })]);
    expect(islands(removed).map(value => value.payload)).toEqual([expect.objectContaining({ color: "black", sign: "count_lost", beforeCount: 1, afterCount: 0, after: [] })]);
  });

  it("reports a rank-only group change without manufacturing a file-class or topology event", () => {
    const pair = edge("7k/8/8/8/8/8/PP1P4/7K w - - 0 1", "a2a3");
    expect(groupChanges(pair).map(value => value.payload)).toEqual([
      expect.objectContaining({ subject: { color: "white", file: "a" }, sign: "membership_changed", before: expect.objectContaining({ pawns: ["a2"] }), after: expect.objectContaining({ pawns: ["a3"] }) }),
    ]);
    expect(fileChanges(pair)).toEqual([]);
    expect(islands(pair)).toEqual([]);
  });

  it("retains both affected file classes and the exact capture cause", () => {
    const pair = edge("7k/8/8/8/8/2n5/1P6/7K w - - 0 1", "b2c3"), values = fileChanges(pair);
    expect(values.map(value => [value.payload.file, value.payload.before.state, value.payload.after.state])).toEqual([
      ["b", "half_open_black", "open"], ["c", "open", "half_open_black"],
    ]);
    for (const value of values) expect(value.payload.cause).toEqual({ mover: { color: "white", role: "pawn", from: "b2", to: "c3", promotion: null }, captured: { color: "black", role: "knight", square: "c3" } });
  });

  it("retains en passant's removed square, not its empty landing square", () => {
    const values = fileChanges(edge("7k/8/8/3pP3/8/8/8/7K w - d6 0 1", "e5d6"));
    expect(values.map(value => value.payload.file)).toEqual(["d", "e"]);
    expect(values.every(value => value.payload.cause.captured?.square === "d5")).toBe(true);
  });

  it("retains a promotion that removes the last pawn from a file", () => {
    const values = fileChanges(edge("7k/P7/8/8/8/8/8/R6K w - - 0 1", "a7a8q"));
    expect(values).toHaveLength(1);
    expect(values[0]!.payload).toMatchObject({ file: "a", before: { state: "half_open_black" }, after: { state: "open" }, cause: { mover: { role: "pawn", from: "a7", to: "a8", promotion: "queen" } } });
    expect(access(values[0]!).map(value => value.payload.piece)).toEqual([{ color: "white", role: "rook", square: "a1" }]);
  });

  it("omits equal groups and file states after a real quiet king move", () => {
    const pair = edge("7k/8/8/8/8/8/1P6/7K w - - 0 1", "h1g1");
    expect(groupChanges(pair)).toEqual([]); expect(fileChanges(pair)).toEqual([]); expect(islands(pair)).toEqual([]);
  });
});

describe("stationary file access has per-piece cause scope", () => {
  it("retains stationary siblings and own-half-open to open, while excluding the moving heavy piece", () => {
    const pair = edge("1r4k1/8/8/8/Rp6/8/PQ6/7K w - - 0 1", "a4b4");
    const moved = openFileOccupancyOperands(pair.edge.beforeFen, pair.moveUci, pair.edge.afterFen);
    expect(moved).toBeDefined();
    const change = fileChanges(pair).find(value => value.payload.file === "b")!;
    expect(change.payload.before.state).toBe("half_open_white");
    const values = access(change);
    expect(values.map(value => value.payload.piece)).toEqual([
      { color: "white", role: "queen", square: "b2" }, { color: "black", role: "rook", square: "b8" },
    ]);
    expect(values.some(value => value.payload.piece.square === "b4")).toBe(false);
    for (const value of values) {
      expect(value.payload.fileChange).toEqual(change.payload);
      expect(evidenceValueReceipt(value).sourceDigests).toEqual([evidenceValueReceipt(change).payloadDigest]);
    }
  });

  it("does not relabel open to own-half-open as newly revealed access", () => {
    const pair = edge("2r4k/8/8/8/8/2n5/1P6/7K w - - 0 1", "b2c3");
    const change = fileChanges(pair).find(value => value.payload.file === "c")!;
    expect(change.payload.before.state).toBe("open");
    expect(change.payload.after.state).toBe("half_open_black");
    expect(access(change)).toEqual([]);
  });
});

describe("island topology is a file partition with exact members", () => {
  it.each([
    ["7k/8/8/8/8/2n5/PP1P4/7K w - - 0 1", "b2c3", "white"],
    ["7k/pp1p4/2N5/8/8/8/8/7K b - - 0 1", "b7c6", "black"],
  ] as const)("detects equal-count partition replacement: %s %s", (fen, move, color) => {
    const values = islands(edge(fen, move));
    expect(values).toHaveLength(1);
    expect(values[0]!.payload).toMatchObject({ color, sign: "topology_changed", beforeCount: 2, afterCount: 2 });
    expect(values[0]!.payload.before.map(row => row.files)).toEqual([["a", "b"], ["d"]]);
    expect(values[0]!.payload.after.map(row => row.files)).toEqual([["a"], ["c", "d"]]);
    expect(values[0]!.payload.after.flatMap(row => row.pawns)).toContain(move.slice(2, 4));
  });

  it("reports count gain when a capture splits one occupied-file run", () => {
    const values = islands(edge("7k/8/8/8/8/n7/PPP5/7K w - - 0 1", "b2a3"));
    expect(values).toHaveLength(1);
    expect(values[0]!.payload).toMatchObject({ color: "white", sign: "count_gained", beforeCount: 1, afterCount: 2 });
  });

  it("reports only the captured side when its last pawn on an island is removed", () => {
    const values = islands(edge("7k/1p1p4/8/8/8/8/8/1R5K w - - 0 1", "b1b7"));
    expect(values).toHaveLength(1);
    expect(values[0]!.payload).toMatchObject({ color: "black", sign: "count_lost", beforeCount: 2, afterCount: 1 });
    expect(values[0]!.payload.before).toEqual([{ files: ["b"], pawns: ["b7"] }, { files: ["d"], pawns: ["d7"] }]);
  });

  it("does not call a capture from a still-populated file a topology change", () => {
    const pair = edge("7k/1p6/8/1p6/2B5/8/8/7K w - - 0 1", "c4b5");
    expect(islands(pair)).toEqual([]); expect(fileChanges(pair)).toEqual([]);
    expect(groupChanges(pair).map(value => value.payload)).toEqual([expect.objectContaining({ subject: { color: "black", file: "b" }, sign: "membership_changed", before: expect.objectContaining({ doubled: true }), after: expect.objectContaining({ doubled: false }) })]);
  });
});

describe("complete source frame falsifiers and receipt multiplicity", () => {
  it("keeps exact direct conventions and only the actual ordered inputs for all six outputs", () => {
    const pair = edge("7k/8/8/8/8/2n5/PP1P4/7K w - - 0 1", "b2c3");
    const gBefore = groups(pair.before), gAfter = groups(pair.after), fBefore = files(pair.before), fAfter = files(pair.after);
    const groupEvents = available(invokeEvidenceValueRoute("derived.structural.event.pawn_file_group@1", { before: gBefore, moveUci: pair.moveUci, after: gAfter }));
    const fileEvents = available(invokeEvidenceValueRoute("derived.activity.event.file_state@1", { before: fBefore, moveUci: pair.moveUci, after: fAfter }));
    const cause = fileChanges(edge("1r4k1/8/8/8/Rp6/8/PQ6/7K w - - 0 1", "a4b4"))[0]!;
    const cases: readonly { route: string; values: readonly DeclaredEvidence<unknown>[]; inputs: readonly DeclaredEvidence<unknown>[] }[] = [
      { route: "derived.structural.reading.pawn_file_group@1", values: [gBefore], inputs: [pair.before] },
      { route: "derived.activity.reading.file_state@1", values: [fBefore], inputs: [pair.before] },
      { route: "derived.structural.event.pawn_file_group@1", values: groupEvents, inputs: [gBefore, gAfter] },
      { route: "derived.activity.event.file_state@1", values: fileEvents, inputs: [fBefore, fAfter] },
      { route: "derived.activity.event.file_access_revealed@1", values: access(cause), inputs: [cause] },
      { route: "rules.structural.event.pawn_islands@2", values: islands(pair), inputs: [pair.before, pair.after] },
    ];
    for (const item of cases) {
      expect(item.values.length, item.route).toBeGreaterThan(0);
      const direct = item.route === "rules.structural.event.pawn_islands@2" ? [{ id: "pawn-island-topology", version: 1 }] : [];
      expect(directProjectionConventions(item.route)).toEqual(direct);
      const expected = [...new Map([...direct, ...item.inputs.flatMap(input => evidenceValueReceipt(input).convention?.refs ?? [])].map(ref => [`${ref.id}@${ref.version}`, ref])).values()].sort((a, b) => a.id.localeCompare(b.id) || a.version - b.version);
      for (const value of item.values) {
        const receipt = evidenceValueReceipt(value);
        expect(receipt.convention?.refs ?? []).toEqual(expected);
        expect(receipt.sourceDigests).toEqual(item.inputs.map(input => evidenceValueReceipt(input).payloadDigest));
      }
    }
  });

  it("refuses re-sealed snapshots even on a genuine no-pawn/no-event edge", () => {
    const pair = edge("4k3/8/8/8/8/8/8/4K3 w - - 0 1", "e1d1"), before = groups(pair.before), after = groups(pair.after);
    expect(groupChanges(pair)).toEqual([]);
    for (const data of [{ before: reseal(before), moveUci: pair.moveUci, after }, { before, moveUci: pair.moveUci, after: reseal(after) }, { before, moveUci: pair.moveUci, after: before }, { before: after, moveUci: pair.moveUci, after: before }, { before, moveUci: pair.moveUci, after, fen: pair.edge.beforeFen }]) {
      expect(() => invokeEvidenceValueRoute("derived.structural.event.pawn_file_group@1", data as never)).toThrow();
    }
    expect(() => invokeEvidenceValueRoute("derived.activity.event.file_state@1", { before: reseal(files(pair.before)), moveUci: pair.moveUci, after: files(pair.after) })).toThrow();
    expect(() => invokeEvidenceValueRoute("rules.structural.event.pawn_islands@2", { before: reseal(pair.before), moveUci: pair.moveUci, after: pair.after })).toThrow();
  });

  it("keeps both original snapshot receipts, rather than deduplicating same-projection inputs", () => {
    const pair = edge("7k/8/8/8/8/2n5/1P6/7K w - - 0 1", "b2c3"), before = files(pair.before), after = files(pair.after);
    const values = available(invokeEvidenceValueRoute("derived.activity.event.file_state@1", { before, moveUci: pair.moveUci, after }));
    expect(values.length).toBeGreaterThan(0);
    for (const value of values) expect(evidenceValueReceipt(value).sourceDigests).toEqual([evidenceValueReceipt(before).payloadDigest, evidenceValueReceipt(after).payloadDigest]);
    expect(() => access(reseal(values[0]!))).toThrow();
  });
});
