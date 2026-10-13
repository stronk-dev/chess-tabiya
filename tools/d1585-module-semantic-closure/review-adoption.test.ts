// Disposable D3758 research: production collector/admission/presentation feasibility, not a
// production adapter, UI implementation, qualification test or ordinary CI gate. No captures.
import { readFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import { makeFen } from "chessops/fen";
import { parsePgn, startingPosition } from "chessops/pgn";
import { parseSan } from "chessops/san";
import { makeUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import { branchPath } from "../../packages/runtime/src/branch-path.js";
import { canonicalFen, positionFromFen } from "../../packages/runtime/src/chess.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "../../packages/runtime/src/evidence-catalog.js";
import { evidenceForConsumer } from "../../packages/runtime/src/evidence-contract.js";
import { compileModulePacket } from "../../packages/runtime/src/module-packets.js";
import { MODULE_CONSUMER_ACCEPTS, MODULE_PAIR_EXECUTION, ONE_EDGE_EVENT_REFS } from "../../packages/runtime/src/module-registry.js";
import { parsePresentationReceipt, presentEvidenceItems, presentationAdapter } from "../../packages/runtime/src/presentation-contract.js";
import { recordedSemanticPath } from "../../packages/runtime/src/recorded-semantic-path.js";
import { reviewPacketForRun } from "../../packages/runtime/src/review-evidence.js";
import { reviewMapProjection } from "../../packages/runtime/src/review-map.js";
import { localSemanticEventClosure, type SemanticEvidenceEvent } from "../../packages/runtime/src/semantic-evidence.js";
import { CASTLING_OPEN_FILE_CASES, CASTLING_OPEN_FILE_NEGATIVES } from "../../packages/runtime/src/testing/castling-open-file-fixtures.js";
import { importRecord, importedRun, play } from "../../packages/runtime/src/testing/review-evidence-fixture.js";
import type { DrillRun } from "../../packages/runtime/src/types.js";

const consumer = { id: "module.review_map", version: 1 } as const;
const key = (ref: { id: string; version: number }): string => `${ref.id}@${ref.version}`;
const eligible = new Set(MODULE_CONSUMER_ACCEPTS.review_map.map(key));
const oneEdge = ONE_EDGE_EVENT_REFS.filter(ref => eligible.has(key(ref)));
const oneEdgeKeys = new Set(oneEdge.map(key));

// Disposable D3758 selection experiment, NOT a registered selector or usefulness authority.
// This literal matrix must cover the measured source class, not silently adopt future sources.
const witnessMatrix: Readonly<Record<string, string>> = Object.freeze({
  ...Object.fromEntries(["backward_pawn", "doubled_pawn", "half_open_file", "isolated_pawn", "king_opposition", "king_zone", "open_file", "passed_pawn", "pawn_islands"].map(id => [`rules.structural.event.${id}@1`, "before_after"])),
  ...Object.fromEntries(["occupied_attack", "occupied_defence", "slider_ray", "piece_escape", "defended_duty"].map(id => [`rules.transition.event.${id}@1`, "target_delta"])),
  ...Object.fromEntries(["castled", "last_of_role", "pawn_contact", "checkmate", "promotion", "capture", "developed"].map(id => [`rules.transition.event.${id}@1`, "edge_occurrence"])),
  "rules.tactic.event.double_attack@1": "edge_occurrence",
  "rules.tactic.event.check@1": "edge_occurrence",
  "rules.tactic.event.loose_piece@1": "edge_occurrence",
  "rules.castling.event.rights_lost@1": "edge_occurrence",
  "derived.exchange.capture_class@1": "edge_occurrence",
  "rules.pawn.event.dynamics@1": "edge_occurrence",
  "derived.pawn.event.transitions@1": "edge_occurrence",
  "derived.material.event.role_asymmetry@1": "before_after",
  "rules.king.event.zone_state@1": "king_delta",
  "derived.king.captured_zone_defender@1": "edge_occurrence",
  "derived.activity.event.open_file_occupancy@1": "edge_occurrence",
});

function hasChangeWitness(event: SemanticEvidenceEvent): boolean {
  const payload = event.operands as Record<string, unknown>;
  switch (witnessMatrix[key(event.projection)]) {
    case "before_after":
      if (!("before" in payload) || !("after" in payload)) throw new Error("missing paired state operands");
      return JSON.stringify(payload.before) !== JSON.stringify(payload.after);
    case "target_delta": {
      const before = payload.targets_before as readonly string[];
      const after = payload.targets_after as readonly string[];
      return before.some(square => !after.includes(square)) || after.some(square => !before.includes(square));
    }
    case "king_delta": {
      const king = payload.king as { relocated: boolean };
      const relations = [payload.attackers, payload.defenders, payload.shelter, payload.escapes] as readonly { gained: readonly unknown[]; lost: readonly unknown[] }[];
      return king.relocated || relations.some(relation => relation.gained.length > 0 || relation.lost.length > 0);
    }
    case "edge_occurrence": return true;
    default: throw new Error(`unclassified selection source ${key(event.projection)}`);
  }
}

function inspect(run: DrillRun) {
  const branchId = run.activeCursor.branchId;
  const original = JSON.stringify(run);
  const packet = reviewPacketForRun(run, branchId, { importRecord: importRecord(run, "*"), engine: new Map() });
  const map = reviewMapProjection({ run, branchId, packet, semanticPath: recordedSemanticPath(run, branchId),
    story: { moments: [], rank: [] }, context: "imported_analysis", viewer: { role: "learner", session: "imported" } });
  const path = branchPath(run, branchId);
  const rows = path.slice(1).map((node, index) => {
    const parent = path[index]!;
    const events = localSemanticEventClosure(parent.fen, node.moveUci!, node.fen).events;
    const admitted = compileModulePacket({ module: "review_map", timing: "review", role: "learner", session: "imported",
      evidence: events.map(event => event.evidence), mode: "admit" });
    if (admitted.kind !== "packet") throw new Error(`unexpected admission refusal: ${admitted.reason}`);
    const values = admitted.facts.map(fact => fact.evidence);
    // This is a disposable rendering probe, not the production packet's adapter/sealing path.
    const rendered = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, consumer, values));
    for (const event of events) expect(event.anchor).toMatchObject({ beforeFen: parent.fen, moveUci: node.moveUci, afterFen: node.fen });
    return { nodeId: node.id, events, values, rendered,
      actual: parsePresentationReceipt(map.rows.find(row => row.nodeId === node.id)!.packet) };
  });
  expect(JSON.stringify(run)).toBe(original);
  return { rows, map, packet };
}

describe("D3758 disposable Review one-edge adoption probe", () => {
  it.each([
    { side: "white" as const, fen: "4k3/8/8/8/8/8/8/2R2K2 w C - 0 1", move: "f1c1", target: "c1" },
    { side: "black" as const, fen: "2r2k2/8/8/8/8/8/8/4K3 b c - 0 1", move: "f8c8", target: "c8" },
  ])("D3762 $side castling never labels the replaced rook as the retained defended target", fixture => {
    const run = play(importedRun(`d3762-${fixture.side}`, fixture.side, canonicalFen(positionFromFen(fixture.fen))), [fixture.move]);
    const row = inspect(run).rows[0]!;
    const events = row.events.filter(event => key(event.projection) === "rules.transition.event.occupied_defence@1");
    expect(events.some(event => (event.operands as { subject: { target: string } }).subject.target === fixture.target)).toBe(false);
  });

  it("derives every exact declared pair and distinguishes acquisition from presentation", () => {
    expect(oneEdge.length).toBeGreaterThan(12);
    expect(Object.keys(witnessMatrix).sort()).toEqual([...oneEdgeKeys].sort());
    const census = oneEdge.map(ref => {
      const execution = MODULE_PAIR_EXECUTION.find(pair => pair.module === "review_map" && key(pair.projection) === key(ref));
      expect(execution).toBeDefined();
      return { projection: key(ref), acquisition: execution!.status,
        renderer: presentationAdapter(consumer, ref) !== undefined };
    });
    process.stdout.write(`D3758 exact pair census ${JSON.stringify(census)}\n`);
    expect(census.some(row => row.projection === "derived.activity.event.open_file_occupancy@1" && row.acquisition === "blocked_dependencies" && row.renderer)).toBe(true);
  });

  it.each(CASTLING_OPEN_FILE_CASES)("retains $name operands through real admission/rendering but not actual Review", fixture => {
    const result = inspect(play(importedRun(`d3758-${fixture.name}`, fixture.side, canonicalFen(positionFromFen(fixture.fen))), [fixture.uci]));
    const row = result.rows[0]!;
    const occupancy = row.values.filter(value => key(value.projection) === "derived.activity.event.open_file_occupancy@1");
    expect(occupancy).toHaveLength(1);
    expect(occupancy[0]!.payload).toMatchObject({ piece: { before: { square: fixture.from, piece: { color: fixture.side, role: "rook" } },
      after: { square: fixture.to, piece: { color: fixture.side, role: "rook" } } }, fileClass: fixture.fileClass });
    expect(row.rendered.some(item => key(item.adapter.projection) === key(occupancy[0]!.projection))).toBe(true);
    expect(row.actual.some(item => key(item.adapter.projection) === key(occupancy[0]!.projection))).toBe(false);
    expect(result.map.moments).toHaveLength(0);
  });

  it.each(CASTLING_OPEN_FILE_NEGATIVES)("preserves the legal near-miss: $name", fixture => {
    const result = inspect(play(importedRun(`d3758-${fixture.name}`, fixture.fen.includes(" b ") ? "black" : "white", canonicalFen(positionFromFen(fixture.fen))), [fixture.uci]));
    expect(result.rows[0]!.values.some(value => key(value.projection) === "derived.activity.event.open_file_occupancy@1")).toBe(false);
  });

  it("keeps role, authenticity and run/branch boundaries; does not render arbitrary payloads", () => {
    const fixture = CASTLING_OPEN_FILE_CASES[0]!;
    const run = play(importedRun("d3758-boundary", fixture.side, fixture.fen), [fixture.uci]);
    const { rows, packet } = inspect(run);
    const evidence = rows[0]!.values;
    expect(compileModulePacket({ module: "review_map", timing: "review", role: "author", session: "imported", evidence, mode: "admit" })).toMatchObject({ kind: "refused", reason: "role_outside_ceiling" });
    expect(() => evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, consumer, JSON.parse(JSON.stringify(evidence)))).toThrow();
    expect(() => reviewMapProjection({ run: play(importedRun("different-run", fixture.side, fixture.fen), [fixture.uci]), branchId: run.activeCursor.branchId,
      packet, story: { moments: [], rank: [] }, context: "imported_analysis", viewer: { role: "learner", session: "imported" } })).toThrow("another run or branch");
    const evasion = play(importedRun("d3758-native-absence", "white", "4k3/8/8/8/8/8/4r3/4K3 w - - 0 1"), ["e1e2"]);
    const [before, after] = branchPath(evasion, evasion.activeCursor.branchId);
    const closure = localSemanticEventClosure(before!.fen, after!.moveUci!, after!.fen);
    expect(closure.abstentions).toContainEqual({ projection: "rules.tactic.event.loose_piece@1", reason: "invalid_turn_clone" });
    expect(closure.events.some(event => key(event.projection) === "rules.tactic.event.loose_piece@1")).toBe(false);
    // The complete count source retains valid zero states: it must not be edited for quiet UX.
    expect(closure.events.filter(event => key(event.projection) === "rules.structural.event.pawn_islands@1")).toHaveLength(2);
  });

  it("measures all edges of eight existing imported games, including unchanged state volume", () => {
    const games = parsePgn(readFileSync(new URL("../r2-selection-harness/imported-sample.pgn", import.meta.url), "utf8"));
    const counts = new Map<string, { offered: number; renderedComponents: number; actualComponents: number }>();
    let gamesUsed = 0;
    let edges = 0;
    let maxOffered = 0;
    let totalOffered = 0;
    const selectionCounts = new Map<string, { offered: number; signOnly: number; witnessed: number; witnessedState: number }>();
    const density: number[] = [];
    let preservedSignChangedKingZones = 0;
    const started = performance.now();
    for (const [index, game] of games.entries()) {
      if (gamesUsed === 8) break;
      const setup = startingPosition(game.headers);
      if (setup.isErr) continue;
      const position = setup.value;
      const fen = makeFen(position.toSetup());
      const moves: string[] = [];
      for (const move of game.moves.mainline()) {
        const parsed = parseSan(position, move.san);
        if (parsed === undefined) throw new Error(`sample ${index} contains an illegal move`);
        moves.push(makeUci(parsed));
        position.play(parsed);
      }
      if (moves.length === 0) continue;
      const result = inspect(play(importedRun(`d3758-sample-${index}`, fen.includes(" b ") ? "black" : "white", fen), moves));
      gamesUsed += 1;
      for (const row of result.rows) {
        edges += 1;
        const offered = row.values.filter(value => oneEdgeKeys.has(key(value.projection)));
        totalOffered += offered.length;
        maxOffered = Math.max(maxOffered, offered.length);
        let witnessedOnRow = 0;
        for (const event of row.events.filter(event => oneEdgeKeys.has(key(event.projection)))) {
          const id = key(event.projection);
          const count = selectionCounts.get(id) ?? { offered: 0, signOnly: 0, witnessed: 0, witnessedState: 0 };
          count.offered += 1;
          if (event.sign === "gained" || event.sign === "lost") count.signOnly += 1;
          if (hasChangeWitness(event)) {
            count.witnessed += 1;
            witnessedOnRow += 1;
            if (event.sign === "state" || event.sign === "preserved") count.witnessedState += 1;
            if (id === "rules.structural.event.king_zone@1" && event.sign === "preserved") preservedSignChangedKingZones += 1;
          }
          selectionCounts.set(id, count);
        }
        density.push(witnessedOnRow);
        for (const ref of oneEdge) {
          const id = key(ref);
          const count = counts.get(id) ?? { offered: 0, renderedComponents: 0, actualComponents: 0 };
          count.offered += offered.filter(value => key(value.projection) === id).length;
          count.renderedComponents += row.rendered.filter(item => key(item.adapter.projection) === id).length;
          count.actualComponents += row.actual.filter(item => key(item.adapter.projection) === id).length;
          counts.set(id, count);
        }
      }
    }
    expect(gamesUsed).toBe(8);
    expect(edges).toBeGreaterThan(100);
    expect(totalOffered).toBeGreaterThan(edges);
    expect([...counts.values()].every(count => count.actualComponents === 0)).toBe(true);
    expect(selectionCounts.size).toBe(32);
    expect(selectionCounts.get("rules.structural.event.pawn_islands@1")!.witnessed).toBeLessThan(selectionCounts.get("rules.structural.event.pawn_islands@1")!.offered);
    expect(selectionCounts.get("rules.tactic.event.check@1")!.witnessedState).toBeGreaterThan(0);
    expect(preservedSignChangedKingZones).toBeGreaterThan(0);
    density.sort((a, b) => a - b);
    process.stdout.write(`D3758 exact witness experiment ${JSON.stringify({ edges, preservedSignChangedKingZones,
      quietRows: density.filter(value => value === 0).length, min: density[0], median: density[Math.floor(density.length / 2)],
      p95: density[Math.ceil(density.length * 0.95) - 1], max: density.at(-1), counts: Object.fromEntries(selectionCounts) })}\n`);
    process.stdout.write(`D3758 fixed imported population ${JSON.stringify({ games: gamesUsed, edges, totalOffered, maxOffered,
      observedRefs: [...counts.values()].filter(count => count.offered > 0).length,
      elapsedMs: Math.round(performance.now() - started), counts: Object.fromEntries(counts) })}\n`);
  }, 120_000);
});
