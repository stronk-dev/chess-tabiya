import { INITIAL_FEN } from "chessops/fen";
import { describe, expect, it, vi } from "vitest";
import { branchPath } from "./branch-path.js";
import { recordedPieceRoutes } from "./compare-strip-values.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { evidenceValueReceipt } from "./evidence-contract.js";
import { attachEvidence } from "./evidence.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import { createRecordedComparisonSource, recordedComparisonData, type RecordedComparisonSource } from "./recorded-comparison.js";
import { readBackReplay } from "./replay.js";
import { canonicalRunStart } from "./session.js";
import { commitMove, createRun, fork, rewind, reachCheckpoint } from "./runtime.js";
import { mirrorSemanticFen, mirrorSemanticUci } from "./semantic-validation.js";
import * as structure from "./structure.js";
import { recordedComparisonFixture, RECORDED_COMPARISON_AT as at } from "./testing/recorded-comparison-fixture.js";

const PATH = "run.record.comparison_path@1", ROUTE = "derived.compare.piece_route@2";
const pathFor = (comparison: RecordedComparisonSource, branchId: string) => invokeEvidenceValueRoute(PATH, { comparison, branchId });
function routes(comparison: RecordedComparisonSource, branchId: string) {
  const path = pathFor(comparison, branchId);
  return invokeEvidenceValueRoute(ROUTE, { comparison, branchId, path });
}
function sourceForMoves(fen: string, moves: readonly string[]) {
  let run = createRun({ id: "route-special", session: { kind: "position", start: canonicalRunStart({ fen, side: fen.split(" ")[1] === "w" ? "white" : "black" }), feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } },
    sessionDigest: `sha256:${"b".repeat(64)}`, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1, createdAt: at });
  const main = run.activeCursor.branchId, root = run.activeCursor.nodeId;
  for (const move of moves) run = commitMove(run, move, { at }).run;
  const tip = run.activeCursor.nodeId;
  run = fork(rewind(run, root, at).run, root, { at }).run;
  const peer = run.activeCursor.branchId;
  return { main, run, comparison: createRecordedComparisonSource({ run, columns: [{ branchId: main, throughNodeId: tip }, { branchId: peer, throughNodeId: root }] }) };
}

describe("owned recorded comparison scope and complete piece-route lineage", () => {
  it.each([false, true])("retains original node/event ordinals and full-tip route populations, black=%s", black => {
    const value = recordedComparisonFixture(black), saved = JSON.stringify(value.run);
    for (const branchId of [value.main, value.peer]) {
      const source = pathFor(value.comparison, branchId), original = branchPath(value.run, branchId), forkIndex = original.findIndex(node => node.id === value.shared.id);
      expect(source.payload).toMatchObject({ runId: value.run.id, headSeq: value.run.events.length, branchId, forkNodeId: value.shared.id, throughNodeId: original.at(-1)!.id });
      expect(source.payload.nodes.map(entry => entry.node)).toEqual(original.slice(forkIndex));
      for (const entry of source.payload.nodes) {
        expect(entry.creationEvent).toEqual(value.run.events[entry.creationEventOrdinal]);
        expect(entry.creationEvent.seq).toBe(entry.creationEventOrdinal + 1);
        expect(entry.creationEvent.type === "run.started" ? entry.creationEvent.data.rootNode.id : entry.creationEvent.data.node.id).toBe(entry.node.id);
      }
      const result = routes(value.comparison, branchId);
      expect(result.map(item => item.payload)).toEqual(recordedPieceRoutes(original.slice(forkIndex)));
      expect(result.length).toBeGreaterThan(0);
      for (const item of result) {
        expect(evidenceValueReceipt(item).sourceDigests).toEqual([evidenceValueReceipt(source).payloadDigest]);
      }
      expect(Object.isFrozen(source.payload.nodes[0]!.creationEvent)).toBe(true);
    }
    expect(JSON.stringify(value.run)).toBe(saved);
  });

  it.each([false, true])("uses both exact prefixes, unequal paths, reversed columns and fork-only scope, black=%s", black => {
    const value = recordedComparisonFixture(black);
    let cases = 0, nonempty = 0;
    for (let left = 2; left < value.mainPath.length; left++) for (let right = 2; right < value.peerPath.length; right++) {
      const columns = [{ branchId: value.main, throughNodeId: value.mainPath[left]!.id }, { branchId: value.peer, throughNodeId: value.peerPath[right]!.id }] as const;
      const comparison = createRecordedComparisonSource({ run: value.run, columns });
      for (const [branchId, original, endpoint] of [[value.main, value.mainPath, left], [value.peer, value.peerPath, right]] as const) {
        const path = pathFor(comparison, branchId), result = routes(comparison, branchId), expected = original.slice(2, endpoint + 1);
        expect(path.payload.nodes.map(entry => entry.node.id)).toEqual(expected.map(node => node.id));
        expect(result.map(item => item.payload)).toEqual(recordedPieceRoutes(expected));
        nonempty += result.length;
        const reversed = createRecordedComparisonSource({ run: value.run, columns: [columns[1], columns[0]] }), reversePath = pathFor(reversed, branchId);
        expect(reversePath.payload).toEqual(path.payload);
        expect(evidenceValueReceipt(reversePath).inputDigest).not.toBe(evidenceValueReceipt(path).inputDigest);
        expect(() => invokeEvidenceValueRoute(ROUTE, { comparison: reversed, branchId, path })).toThrow();
        cases++;
      }
    }
    expect(cases).toBe(30); expect(nonempty).toBeGreaterThan(0);
  });

  it("keeps actual shared-node origins and permits a successful root/fork singleton", () => {
    const value = sourceForMoves(INITIAL_FEN, ["e2e4"]), peer = value.run.activeCursor.branchId;
    const source = pathFor(value.comparison, peer);
    expect(source.payload.nodes).toHaveLength(1);
    expect(source.payload.nodes[0]!.creationEvent.type).toBe("run.started");
    expect(source.payload.nodes[0]!.node.branchId).toBe(value.main);
    expect(routes(value.comparison, peer)).toEqual([]);
    const fixture = recordedComparisonFixture(), inherited = pathFor(fixture.comparison, fixture.peer).payload.nodes[0]!;
    expect(inherited.node.id).toBe(fixture.shared.id);
    expect(inherited.node.branchId).toBe(fixture.main);
  });

  it("same payload at different endpoints/heads still has distinct scope authority", () => {
    const value = recordedComparisonFixture(), earlier = createRecordedComparisonSource({ run: value.run, columns: [value.columns[0], { branchId: value.peer, throughNodeId: value.shared.id }] });
    const left = pathFor(value.comparison, value.main), right = pathFor(earlier, value.main);
    expect(left.payload).toEqual(right.payload);
    expect(evidenceValueReceipt(left).inputDigest).not.toBe(evidenceValueReceipt(right).inputDigest);
    const earlierRoute = routes(earlier, value.main), fullRoute = routes(value.comparison, value.main);
    expect(fullRoute.map(item => item.payload)).toEqual(earlierRoute.map(item => item.payload));
    expect(evidenceValueReceipt(fullRoute[0]!).inputDigest).not.toBe(evidenceValueReceipt(earlierRoute[0]!).inputDigest);
    expect(() => invokeEvidenceValueRoute(ROUTE, { comparison: earlier, branchId: value.main, path: left })).toThrow();
    const later = attachEvidence(value.run, value.shared.id, ["synthetic:later-report"], { kind: "eval", source: "engine_validated", values: { centipawns: 10 } }, at).run;
    const updated = createRecordedComparisonSource({ run: later, columns: value.columns });
    expect(() => invokeEvidenceValueRoute(ROUTE, { comparison: updated, branchId: value.main, path: left })).toThrow();
  });

  it("retains independent snapshots without freezing mutable caller nodes/events/columns", () => {
    const fixture = recordedComparisonFixture(), run = structuredClone(fixture.run), columns = structuredClone(fixture.columns);
    const comparison = createRecordedComparisonSource({ run, columns }), before = pathFor(comparison, fixture.main), digest = evidenceValueReceipt(before).inputDigest;
    expect(Object.isFrozen(run)).toBe(false); expect(Object.isFrozen(run.nodes[0])).toBe(false); expect(Object.isFrozen(run.events[0])).toBe(false); expect(Object.isFrozen(columns[0])).toBe(false);
    (run.nodes[2]! as { fen: string }).fen = "corrupt";
    (run.events[0]! as { at: string }).at = "changed";
    (columns[0] as { throughNodeId: string }).throughNodeId = "changed";
    expect(pathFor(comparison, fixture.main)).toEqual(before);
    expect(evidenceValueReceipt(pathFor(comparison, fixture.main)).inputDigest).toBe(digest);
    expect(routes(comparison, fixture.main).length).toBeGreaterThan(0);
  });

  it("D3872 distinguishes same-seq event heads with different noncreation reports", () => {
    const value = recordedComparisonFixture();
    const report = (centipawns: number) => attachEvidence(value.run, value.shared.id, ["synthetic:same-ref"], { kind: "eval", source: "engine_validated", values: { centipawns } }, at).run;
    const leftRun = report(10), rightRun = report(11);
    expect(leftRun.events.length).toBe(rightRun.events.length);
    expect(leftRun.nodes).toEqual(rightRun.nodes);
    const left = createRecordedComparisonSource({ run: leftRun, columns: value.columns }), right = createRecordedComparisonSource({ run: rightRun, columns: value.columns });
    const leftPath = pathFor(left, value.main), rightPath = pathFor(right, value.main);
    expect(leftPath.payload).toEqual(rightPath.payload);
    expect(evidenceValueReceipt(leftPath).inputDigest).not.toBe(evidenceValueReceipt(rightPath).inputDigest);
    expect(() => invokeEvidenceValueRoute(ROUTE, { comparison: right, branchId: value.main, path: leftPath })).toThrow();
    expect(routes(left, value.main).map(item => item.payload)).toEqual(routes(right, value.main).map(item => item.payload));
    expect(evidenceValueReceipt(routes(left, value.main)[0]!).inputDigest).not.toBe(evidenceValueReceipt(routes(right, value.main)[0]!).inputDigest);
  });

  it("D3873 refuses legal noncanonical root FENs even when both grants have zero edges", () => {
    const value = sourceForMoves(INITIAL_FEN, []), peer = value.run.activeCursor.branchId, root = value.run.nodes[0]!.id;
    const events = value.run.events.map(event => event.type === "run.started" ? { ...event, data: { ...event.data,
      start: { ...event.data.start, fen: INITIAL_FEN.replace("KQkq", "HAha") }, rootNode: { ...event.data.rootNode, fen: INITIAL_FEN.replace("KQkq", "HAha") } } } : event);
    // Actual replay admits the alternate castling-right notation; the source must not repair it.
    const run = readBackReplay(events).run;
    const columns = [{ branchId: value.main, throughNodeId: root }, { branchId: peer, throughNodeId: root }] as const;
    expect(branchPath(run, value.main)).toHaveLength(1); expect(branchPath(run, peer)).toHaveLength(1);
    expect(() => createRecordedComparisonSource({ run, columns })).toThrow(/not canonical/u);
  });

  it("keeps later node annotations distinct from original birth-event images", () => {
    const fixture = recordedComparisonFixture();
    let run = attachEvidence(fixture.run, fixture.shared.id, ["synthetic:annotation"], { kind: "eval", source: "engine_validated", values: { centipawns: 10 } }, at).run;
    run = reachCheckpoint(run, "synthetic:checkpoint", at).run;
    const comparison = createRecordedComparisonSource({ run, columns: fixture.columns }), path = pathFor(comparison, fixture.peer), entry = path.payload.nodes[0]!;
    expect(entry.node.evidenceRefs).toContain("synthetic:annotation");
    expect(entry.creationEvent.type).toBe("move.committed");
    if (entry.creationEvent.type !== "move.committed") throw new Error("fixture requires committed fork");
    expect(entry.creationEvent.data.node.evidenceRefs).not.toContain("synthetic:annotation");
    expect(routes(comparison, fixture.peer).length).toBeGreaterThan(0);
  });

  it.each(["main", "peer"] as const)("rejects original later illegal/malformed FENs before narrowing or structural work: %s", which => {
    const fixture = recordedComparisonFixture(), later = (which === "main" ? fixture.mainPath : fixture.peerPath).at(-1)!.id;
    const columns = [{ branchId: fixture.main, throughNodeId: fixture.shared.id }, { branchId: fixture.peer, throughNodeId: fixture.shared.id }] as const;
    // Real event replay admits these ordinary committed node strings; the source must refuse.
    for (const fen of ["not-a-fen", "8/8/8/8/8/8/8/8 w - - 0 1", INITIAL_FEN]) {
      const events = fixture.run.events.map(event => event.type === "move.committed" && event.data.node.id === later ? { ...event, data: { ...event.data, node: { ...event.data.node, fen } } } : event);
      const run = readBackReplay(events).run;
      expect(branchPath(run, which === "main" ? fixture.main : fixture.peer).length).toBeGreaterThan(2);
      const read = vi.spyOn(structure, "structuralReading");
      expect(() => createRecordedComparisonSource({ run, columns })).toThrow();
      expect(read).not.toHaveBeenCalled(); read.mockRestore();
    }
  });

  it.each(["id", "parentId", "fen", "transposeKey", "moveUci", "moveSan", "ply", "actor", "branchId", "createdAt"] as const)("refuses snapshot/birth mismatch in %s", key => {
    const fixture = recordedComparisonFixture(), run = structuredClone(fixture.run), target = run.nodes.find(node => node.id === fixture.mainPath[3]!.id)!;
    (target as unknown as Record<string, unknown>)[key] = key === "ply" ? 99 : "crossed";
    expect(() => createRecordedComparisonSource({ run, columns: fixture.columns })).toThrow();
  });

  it("refuses missing/reordered/duplicate creation events, extra graph nodes and illegal recorded SAN", () => {
    const fixture = recordedComparisonFixture(), index = fixture.run.events.findIndex(event => event.type === "move.committed");
    const events = structuredClone(fixture.run.events);
    const corruptions = [events.filter((_, offset) => offset !== index), [events[1]!, events[0]!, ...events.slice(2)], [...events, events[index]!]];
    for (const changed of corruptions) expect(() => createRecordedComparisonSource({ run: { ...fixture.run, events: changed }, columns: fixture.columns })).toThrow();
    const extra = { ...fixture.run.nodes.at(-1)!, id: "extra-node" };
    expect(() => createRecordedComparisonSource({ run: { ...fixture.run, nodes: [...fixture.run.nodes, extra] }, columns: fixture.columns })).toThrow();
    const changed = fixture.run.events.map(event => event.type === "move.committed" && event.data.node.id === fixture.mainPath.at(-1)!.id ? { ...event, data: { ...event.data, node: { ...event.data.node, moveSan: "made up" } } } : event);
    const run = readBackReplay(changed).run;
    expect(() => createRecordedComparisonSource({ run, columns: fixture.columns })).toThrow(/SAN/u);
  });

  it("refuses nonclosed construction, unknown/equal/off-path branches and pre-attempt endpoints", () => {
    const fixture = recordedComparisonFixture();
    const args = { run: fixture.run, columns: fixture.columns };
    expect(() => createRecordedComparisonSource({ ...args, paths: [] } as never)).toThrow();
    for (const columns of [[], [fixture.columns[0]], [...fixture.columns, fixture.columns[0]], [fixture.columns[0], fixture.columns[0]],
      [fixture.columns[0], { branchId: "unknown", throughNodeId: fixture.shared.id }],
      [fixture.columns[0], { branchId: fixture.peer, throughNodeId: fixture.mainPath.at(-1)!.id }],
      [fixture.columns[0], { branchId: fixture.peer, throughNodeId: fixture.run.nodes[0]!.id }],
      [fixture.columns[0], { ...fixture.columns[1], fen: INITIAL_FEN }],
      [fixture.columns[0], { branchId: "", throughNodeId: fixture.shared.id }]]) expect(() => createRecordedComparisonSource({ run: fixture.run, columns } as never)).toThrow();
    const read = vi.spyOn(structure, "structuralReading");
    createRecordedComparisonSource(args); expect(read).not.toHaveBeenCalled(); read.mockRestore();
  });

  it("refuses copied/raw/serialized/foreign handles and genuine crossed path inputs before empty shortcuts", () => {
    const fixture = recordedComparisonFixture(), path = pathFor(fixture.comparison, fixture.main), foreign = recordedComparisonFixture(false, "foreign");
    for (const comparison of [{ ...fixture.comparison }, JSON.parse(JSON.stringify(fixture.comparison)), fixture.run]) {
      expect(() => invokeEvidenceValueRoute(PATH, { comparison, branchId: fixture.main } as never)).toThrow();
      expect(() => invokeEvidenceValueRoute(ROUTE, { comparison, branchId: fixture.main, path } as never)).toThrow();
    }
    expect(() => pathFor(fixture.comparison, "unknown")).toThrow();
    for (const wrong of [{ ...path }, JSON.parse(JSON.stringify(path)), path.payload, pathFor(fixture.comparison, fixture.peer), pathFor(foreign.comparison, foreign.main)]) expect(() => invokeEvidenceValueRoute(ROUTE, { comparison: fixture.comparison, branchId: fixture.main, path: wrong } as never)).toThrow();
    expect(() => invokeEvidenceValueRoute(PATH, { comparison: fixture.comparison, branchId: fixture.main, nodes: [] } as never)).toThrow();
    expect(() => invokeEvidenceValueRoute(ROUTE, { comparison: fixture.comparison, branchId: fixture.main, path, run: fixture.run } as never)).toThrow();
    const zero = sourceForMoves(INITIAL_FEN, []), peer = zero.run.activeCursor.branchId;
    expect(routes(zero.comparison, peer)).toEqual([]);
    expect(() => invokeEvidenceValueRoute(ROUTE, { comparison: zero.comparison, branchId: peer, path })).toThrow();
  });

  it.each([false, true])("preserves captures, en passant, promotion and repeated physical-piece paths, black=%s", black => {
    const cases = [
      { fen: "7k/8/8/3pP3/8/8/8/K7 w - d6 0 1", moves: ["e5d6", "h8g8", "d6d7", "g8h8", "d7d8q"], label: "White pawn from e5", squares: ["e5", "d6", "d7", "d8"] },
      { fen: "7k/8/8/8/8/8/r7/R6K w - - 0 1", moves: ["a1a2", "h8g8", "a2b2", "g8h8", "b2a2"], label: "White rook from a1", squares: ["a1", "a2", "b2", "a2"] },
    ];
    for (const item of cases) {
      const fen = black ? mirrorSemanticFen(item.fen, "color_and_vertical") : item.fen;
      const moves = item.moves.map(move => black ? mirrorSemanticUci(move, "color_and_vertical") : move);
      const fixture = sourceForMoves(fen, moves), result = routes(fixture.comparison, fixture.main).map(value => value.payload);
      const label = black ? item.label.replace("White", "Black").replace(/([a-h])([1-8])$/u, (_, file: string, rank: string) => `${file}${9 - Number(rank)}`) : item.label;
      const squares = black ? item.squares.map(square => `${square[0]}${9 - Number(square[1])}`) : item.squares;
      expect(result.find(value => value.pieceId === label)?.squares).toEqual(squares);
      expect(result).toEqual(recordedPieceRoutes(pathFor(fixture.comparison, fixture.main).payload.nodes.map(entry => entry.node)));
    }
  });

  it.each([false, true])("preserves simultaneous orthodox/960 castling including stationary pieces, black=%s", black => {
    for (const [home, rights, move, kingFrom, rookFrom, kingTo, rookTo] of [
      ["4K2R", "H", "e1h1", "e1", "h1", "g1", "f1"], ["6KR", "H", "g1h1", "g1", "h1", "g1", "f1"],
      ["4KR2", "F", "e1f1", "e1", "f1", "g1", "f1"], ["5KR1", "G", "f1g1", "f1", "g1", "g1", "f1"],
      ["R1K5", "A", "c1a1", "c1", "a1", "c1", "d1"],
    ] as const) {
      const raw = `${home.startsWith("R") ? "7k" : "k7"}/8/8/8/8/8/8/${home} w ${rights} - 0 1`, fen = black ? mirrorSemanticFen(raw, "color_and_vertical") : raw;
      const fixture = sourceForMoves(fen, [black ? mirrorSemanticUci(move, "color_and_vertical") : move]), result = routes(fixture.comparison, fixture.main).map(value => value.payload);
      const square = (value: string) => black ? `${value[0]}8` : value;
      for (const [role, from, to] of [["king", kingFrom, kingTo], ["rook", rookFrom, rookTo]]) {
        const route = result.find(value => value.pieceId === `${black ? "Black" : "White"} ${role} from ${square(from!)}`);
        expect(route?.squares).toEqual(from === to ? undefined : [square(from!), square(to!)]);
      }
    }
  });

  it("keeps the new path/routes internal, correctly grounded and unbound until complete consumer migration", () => {
    const path = PRIMARY_EVIDENCE_MANIFEST.projections.find(value => value.id === "run.record.comparison_path")!;
    const route = PRIMARY_EVIDENCE_MANIFEST.projections.find(value => value.id === "derived.compare.piece_route" && value.version === 2)!;
    expect(path).toMatchObject({ role: "source_record", forms: ["machine_condition"], grounding: "recorded_run", exactness: "exact", confidence: "not_applicable" });
    expect(route.derivation).toEqual({ inputs: [{ id: path.id, version: 1 }] });
    for (const projection of [path, route]) expect(PRIMARY_EVIDENCE_MANIFEST.bindings.filter(value => value.projection.id === projection.id && value.projection.version === projection.version)).toEqual([]);
    expect(recordedComparisonData(recordedComparisonFixture().comparison).authority.operation).toBe("recorded-comparison-source@1");
  });
});
