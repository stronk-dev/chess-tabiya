// DISPOSABLE D1716/D1718 research. These pin existing source limitations, not a successor API.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  structuralReading, structuralSemanticEvents, pawnIslandSemanticEvents,
  loosePieceSemanticEvents, matchesStructuralFeature,
  type StructuralFeature,
  PRIMARY_EVIDENCE_MANIFEST, assertDeclaredEvidence,
} from "@chess-tabiya/runtime";
import { playedFen } from "../research-chess/populations.js";
import { evidenceValueRouteRegistry, invokeEvidenceValueRoute } from "../../packages/runtime/src/internal/evidence-value-routes.js";

describe("current avoidance source domains and values", () => {
  const files = "6k1/8/8/4pp2/2P1P3/P2P4/P7/6K1 w - - 0 1";
  it.each([
    ["backward_pawn", "d", "a"], ["doubled_pawn", "a", "d"],
    ["isolated_pawn", "a", "d"], ["half_open_file", "f", "b"],
    ["open_file", "b", "a"],
  ] as const)("%s has an explicit file-domain predicate, while its reading is positive-only", (kind, positive, negative) => {
    const features = structuralReading(files).features.filter(item => item.kind === kind && (kind === "open_file" || item.color === "white"));
    expect(features.some(item => item.file === positive)).toBe(true);
    expect(features.some(item => item.file === negative)).toBe(false);
    const query = (file: typeof positive | typeof negative): StructuralFeature => kind === "open_file"
      ? { kind, file } : { kind, color: "white", file };
    expect(matchesStructuralFeature(files, query(positive))).toBe(true);
    expect(matchesStructuralFeature(files, query(negative))).toBe(false);
  });

  it("keeps twelve material rows including zero and two island rows including zero/equality", () => {
    const before = "7k/8/8/8/8/8/P7/7K w - - 0 1";
    const counts = structuralReading(before).features.filter(item => item.kind === "piece_count");
    expect(counts).toHaveLength(12);
    expect(counts.find(item => item.color === "black" && item.role === "pawn")?.count).toBe(0);
    const after = playedFen(before, "a2a3");
    expect(pawnIslandSemanticEvents(before, "a2a3", after).map(item => ({ sign: item.sign, ...item.operands }))).toEqual([
      { sign: "preserved", before_fen: before, move_uci: "a2a3", after_fen: after, family: "pawn_islands", color: "white", before: 1, after: 1 },
      { sign: "preserved", before_fen: before, move_uci: "a2a3", after_fen: after, family: "pawn_islands", color: "black", before: 0, after: 0 },
    ]);
  });

  it("distinguishes omitted attack observations from actual zero and empty/pawn target values", () => {
    const fen = "7k/8/8/n7/8/P7/8/R5K1 w - - 0 1";
    const rows = structuralReading(fen).features.filter(item => item.kind === "direct_attack_count" && item.color === "white");
    expect(rows.find(item => item.squares[0] === "g1")?.count).toBe(1);
    for (const square of ["a2", "a3", "h8"] as const) expect(rows.some(item => item.squares[0] === square)).toBe(false);
    // The existing feature predicate can evaluate these even though the sparse reading omits them.
    for (const square of ["a2", "a3"] as const) expect(matchesStructuralFeature(fen, { kind: "direct_attack_count", color: "white", square, comparison: "equal", count: 1 })).toBe(true);
    expect(matchesStructuralFeature(fen, { kind: "direct_attack_count", color: "white", square: "h8", comparison: "equal", count: 0 })).toBe(true);
  });

  it("keeps ray endpoint scope explicit and shows that a moved slider changes the old event subject", () => {
    const before = "7k/8/8/8/8/8/8/R2N3K w - - 0 1";
    const rows = structuralReading(before).features.filter(item => item.kind === "line_blockers");
    expect(rows.find(item => item.squares[0] === "a1" && item.squares[1] === "h1")?.count).toBe(1); // d1 counts; h1 endpoint does not.
    const after = playedFen(before, "a1a2");
    const events = structuralSemanticEvents(before, "a1a2", after).filter(item => item.operands.family === "line_blockers");
    expect(events.some(item => item.sign === "lost" && item.operands.before?.squares[0] === "a1")).toBe(true);
    expect(events.some(item => item.sign === "gained" && item.operands.after?.squares[0] === "a2")).toBe(true);
    expect(events.some(item => item.operands.before?.squares[0] === "a1" && item.operands.after?.squares[0] === "a2")).toBe(false);
  });

  it("shows a passed-pawn advance needs physical identity rather than lost/gained square keys", () => {
    const before = "7k/8/8/8/8/8/P7/7K w - - 0 1";
    const events = structuralSemanticEvents(before, "a2a3", playedFen(before, "a2a3")).filter(item => item.operands.family === "passed_pawn");
    expect(events.map(item => ({ sign: item.sign, before: item.operands.before?.squares ?? null, after: item.operands.after?.squares ?? null }))).toEqual(expect.arrayContaining([
      { sign: "lost", before: ["a2"], after: null }, { sign: "gained", before: null, after: ["a3"] },
    ]));
    expect(events).toHaveLength(2);
  });

  it("joins a moving king zone by color/zone while the historical opposition still ignores blockers", () => {
    const before = "7k/8/8/8/8/8/8/K7 w - - 0 1";
    const zones = structuralSemanticEvents(before, "a1a2", playedFen(before, "a1a2")).filter(item => item.operands.family === "king_zone" && item.operands.before?.color === "white");
    expect(zones.some(item => item.sign === "preserved" && item.operands.before?.zone === "edge" && item.operands.before.squares[0] === "a1" && item.operands.after?.squares[0] === "a2")).toBe(true);
    expect(zones.some(item => item.sign === "lost" && item.operands.before?.zone === "corner")).toBe(true);
    const blocked = "8/8/8/8/8/4k3/4P3/4K3 b - - 0 1";
    expect(structuralReading(blocked).features).toContainEqual({ kind: "king_opposition", color: "white", form: "direct", squares: ["e1", "e3"] });
  });

  it("keeps loose-piece invalid-turn evidence unavailable rather than treating it as false", () => {
    const before = "4r1k1/8/8/8/8/8/8/4K2R w - - 0 1";
    expect(loosePieceSemanticEvents(before, "e1d1", playedFen(before, "e1d1"))).toBeUndefined();
  });

  it("pins available loose-piece operands to mover-color non-kings and distinguishes both-false omission", () => {
    const before = "r6k/8/8/8/8/8/8/R6K w - - 0 1";
    const after = playedFen(before, "a1a2");
    const events = loosePieceSemanticEvents(before, "a1a2", after);
    expect(events).toHaveLength(1);
    expect(events![0]).toMatchObject({
      projection: { id: "rules.tactic.event.loose_piece", version: 1 }, sign: "preserved",
      operands: {
        beforeFen: before, moveUci: "a1a2", afterFen: after, sign: "preserved",
        mover: { color: "white", before: { square: "a1", role: "rook" }, after: { square: "a2", role: "rook" } },
        before: { enPrise: true }, after: { enPrise: true },
      },
    });
    // An available empty result says no emitted en-prise transition, not a dense all-piece vector.
    const quiet = "7k/8/8/8/8/8/8/R6K w - - 0 1";
    expect(loosePieceSemanticEvents(quiet, "a1a2", playedFen(quiet, "a1a2"))).toEqual([]);
  });
});

describe("D4067 current predecessor identity audit", () => {
  it("retains the two already mintable detailed readings with their actual original semantics", () => {
    const opposition = invokeEvidenceValueRoute("rules.structural.reading.king_opposition@2", { fen: "8/8/8/8/8/4k3/4P3/4K3 b - - 0 1" });
    expect(opposition).toHaveLength(1); assertDeclaredEvidence(opposition[0]);
    expect(opposition[0]!.payload).toEqual({ kind: "king_opposition", color: "white", form: "direct", squares: ["e1", "e3"] });
    const backward = invokeEvidenceValueRoute("rules.structural.reading.backward_pawn@2", { fen: "6k1/8/8/4pp2/2P1P3/P2P4/P7/6K1 w - - 0 1" });
    expect(backward).toHaveLength(1); assertDeclaredEvidence(backward[0]);
    expect(backward[0]!.payload).toEqual({ kind: "backward_pawn", color: "white", file: "d", squares: [] });
  });

  it("tracks the exact implemented foundation identities while guarding the remaining reservations", () => {
    const plan = JSON.parse(readFileSync(new URL("../../planning/foundation-source-identity/projection-plan.json", import.meta.url), "utf8")) as { rows: readonly { projection: string }[]; authoredPredicateRoutes: readonly { projection: string }[] };
    expect(plan.rows).toHaveLength(23);
    expect(plan.authoredPredicateRoutes).toHaveLength(5);
    const declared = new Set(PRIMARY_EVIDENCE_MANIFEST.projections.map(item => `${item.id}@${item.version}`));
    const routed = new Set<string>(evidenceValueRouteRegistry().map(item => item.route));
    const occupied = [...plan.rows, ...plan.authoredPredicateRoutes].flatMap(item => declared.has(item.projection) || routed.has(item.projection) ? [{ projection: item.projection, declared: declared.has(item.projection), routed: routed.has(item.projection) }] : []);
    expect(occupied).toEqual([
      { projection: "rules.structural.reading.king_opposition@3", declared: true, routed: true },
      { projection: "rules.structural.event.king_opposition@2", declared: true, routed: true },
      { projection: "rules.structural.reading.backward_pawn@3", declared: true, routed: true },
      { projection: "rules.structural.event.backward_pawn@2", declared: true, routed: true },
      { projection: "derived.structural.reading.pawn_file_group@1", declared: true, routed: true },
      { projection: "derived.structural.event.pawn_file_group@1", declared: true, routed: true },
      { projection: "derived.activity.reading.file_state@1", declared: true, routed: true },
      { projection: "derived.activity.event.file_state@1", declared: true, routed: true },
      { projection: "derived.activity.event.file_access_revealed@1", declared: true, routed: true },
      { projection: "rules.structural.event.pawn_islands@2", declared: true, routed: true },
    ]);
  });

  it("exposes why schema-only convention refs must not be sent to the current predicate factory", () => {
    const feature = { kind: "king_opposition", color: "white", form: "direct", conventionRef: { id: "king-opposition-unobstructed", version: 1 } } as const;
    const value = invokeEvidenceValueRoute("rules.structural.predicate.king_opposition@1", { fen: "8/8/8/8/8/4k3/4P3/4K3 b - - 0 1", feature });
    assertDeclaredEvidence(value);
    // Current internal factory accepts the extra field but still runs blocker-blind legacy truth.
    // No production schema/learner route is widened by this disposable counterexample.
    expect(value.payload.matched).toBe(true);
    expect(value.payload.feature).toEqual(feature);
  });
});
