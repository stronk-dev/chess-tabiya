// DISPOSABLE research harness — D1164/D1693. Not production code.
import { describe, expect, it } from "vitest";

import {
  AVOIDANCE_EVENT_PROJECTION_IDS,
  PRIMARY_EVIDENCE_MANIFEST,
  STRUCTURAL_EVENT_PROJECTION_IDS,
  TRANSITION_EVENT_PROJECTION_IDS,
  TRANSITION_GEOMETRY_EVENT_FAMILIES,
} from "../../packages/runtime/src/evidence-catalog.js";
import { canonicalizeJson } from "../../packages/schema/src/drill-pack/digest.js";

const structural = STRUCTURAL_EVENT_PROJECTION_IDS.filter((id) => ![
  "rules.structural.event.piece_count",
  "rules.structural.event.direct_attack_count",
  "rules.structural.event.line_blockers",
].includes(id));
const transitionGeometry = TRANSITION_GEOMETRY_EVENT_FAMILIES.map((family) => `rules.transition.event.${family}`);
const transitionRules = TRANSITION_EVENT_PROJECTION_IDS.filter((id) => !transitionGeometry.includes(id) && id !== "rules.transition.event.clock_reset");
const avoidance = [
  ...AVOIDANCE_EVENT_PROJECTION_IDS.filter((id) => ![
    "derived.semantic_avoidance.piece_count",
    "derived.semantic_avoidance.direct_attack_count",
    "derived.semantic_avoidance.line_blockers",
  ].includes(id)),
  "derived.semantic_avoidance.loose_piece",
  "derived.semantic_avoidance.pawn_islands",
];

const POSTCOMMIT = Object.freeze([
  ...structural,
  ...transitionGeometry,
  ...transitionRules,
  "rules.castling.event.rights_lost",
  "rules.tactic.event.double_attack",
  "rules.tactic.event.check",
  "rules.tactic.event.loose_piece",
  "derived.exchange.capture_class",
  "derived.exchange.trade_completed",
  "rules.structural.event.pawn_islands",
  ...avoidance,
  "rules.pawn.event.dynamics",
  "derived.pawn.event.transitions",
  "rules.king.event.zone_state",
  "derived.king.captured_zone_defender",
  "derived.activity.event.open_file_occupancy",
  "derived.grade.move_quality",
]);

const STRUCTURE = Object.freeze([
  "theory.shapes.firing",
  "rules.structural.reading.named_structure",
  "rules.structural.reading.space",
  "rules.structural.reading.pawn_connectivity",
  "rules.phase.reading",
  "rules.endgame.reading",
]);

const THEORY = Object.freeze([
  "pack.authored.claim",
  "theory.shapes.firing",
  "derived.explorer.population_summary",
  "theory.opening_identity.record",
]);

export const PROACTIVE_NOVELTY_PROJECTION_IDS = Object.freeze([...new Set([...POSTCOMMIT, ...STRUCTURE, ...THEORY])]);

type NoveltyIdentityDeclaration =
  | { readonly projection: string; readonly kind: "stable"; readonly comparedFields: readonly string[] }
  | { readonly projection: string; readonly kind: "exempt"; readonly reason: string };

const stable = (projection: string, comparedFields: readonly string[]): NoveltyIdentityDeclaration =>
  Object.freeze({ projection, kind: "stable", comparedFields: Object.freeze([...comparedFields]) });

const structuralIdentity = structural.map((projection) => stable(projection, ["family", "before", "after"]));
const geometryIdentity = transitionGeometry.map((projection) => stable(projection, ["subject", "targets_before", "targets_after"]));
const transitionIdentity = transitionRules.map((projection) => projection === "rules.transition.event.capture"
  ? stable(projection, ["mover", "captured", "enPassant"])
  : stable(projection, ["mover", "detail"]));
const avoidanceIdentity = avoidance.map((projection) => stable(projection, ["relation", "family"]));

export const NOVELTY_IDENTITY_DECLARATIONS: readonly NoveltyIdentityDeclaration[] = Object.freeze([
  ...structuralIdentity,
  ...geometryIdentity,
  ...transitionIdentity,
  stable("rules.castling.event.rights_lost", ["color", "wing"]),
  stable("rules.tactic.event.double_attack", ["mover", "targets"]),
  stable("rules.tactic.event.check", ["checkingPieces", "checkedKing", "attackSquares", "rays"]),
  stable("rules.tactic.event.loose_piece", ["mover", "before", "after"]),
  stable("derived.exchange.capture_class", ["capture", "exchange", "class"]),
  stable("derived.exchange.trade_completed", ["landingSquare", "first", "second"]),
  stable("rules.structural.event.pawn_islands", ["family", "color", "before", "after"]),
  ...avoidanceIdentity,
  stable("rules.pawn.event.dynamics", ["kind", "subjects"]),
  stable("derived.pawn.event.transitions", ["kind", "pawn"]),
  stable("rules.king.event.zone_state", ["color", "king", "attackers", "defenders", "shelter", "escapes"]),
  stable("derived.king.captured_zone_defender", ["capture", "capturedSquare", "kingColor", "defender"]),
  stable("derived.activity.event.open_file_occupancy", ["piece", "fileClass", "sourceReading"]),
  Object.freeze({ projection: "derived.grade.move_quality", kind: "exempt", reason: "A grade is scoped to the just-committed edge; the same class on a later move is a new recorded fact." }),
  stable("theory.shapes.firing", ["entryId", "openEnded"]),
  stable("rules.structural.reading.named_structure", ["provenanceNote"]),
  stable("rules.structural.reading.space", ["conventionId", "colors", "differentials"]),
  stable("rules.structural.reading.pawn_connectivity", ["colors"]),
  stable("rules.phase.reading", ["phase"]),
  stable("rules.endgame.reading", ["type", "techniques"]),
  stable("pack.authored.claim", ["id"]),
  stable("derived.explorer.population_summary", ["kind", "total", "white", "draws", "black", "recency", "population", "reason", "detail"]),
  stable("theory.opening_identity.record", ["kind", "sourceId", "values"]),
]);

function pathValue(payload: Readonly<Record<string, unknown>>, path: string): unknown {
  let value: unknown = payload;
  for (const segment of path.split(".")) {
    if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined;
    value = (value as Readonly<Record<string, unknown>>)[segment];
  }
  return value;
}

function stableNoveltyIdentity(projection: string, payload: Readonly<Record<string, unknown>>): string | null {
  const declaration = NOVELTY_IDENTITY_DECLARATIONS.find((item) => item.projection === projection);
  if (declaration === undefined) throw new TypeError(`NOVELTY_IDENTITY_UNDECLARED: ${projection}`);
  if (declaration.kind === "exempt") return null;
  const fields = declaration.comparedFields
    .map((field) => [field, pathValue(payload, field)] as const)
    .filter((entry) => entry[1] !== undefined);
  return `${projection}:${canonicalizeJson(Object.fromEntries(fields))}`;
}

describe("D1164 proactive novelty closure", () => {
  it("derives the union from exact accepts instead of the contradictory hand count", () => {
    expect(POSTCOMMIT).toHaveLength(43);
    expect(STRUCTURE).toHaveLength(6);
    expect(THEORY).toHaveLength(4);
    expect(PROACTIVE_NOVELTY_PROJECTION_IDS).toHaveLength(52);
    expect(PROACTIVE_NOVELTY_PROJECTION_IDS).toHaveLength(new Set(PROACTIVE_NOVELTY_PROJECTION_IDS).size);
  });

  it("classifies every possible member as stable or explicitly exempt", () => {
    expect(NOVELTY_IDENTITY_DECLARATIONS.map((row) => row.projection).sort()).toEqual([...PROACTIVE_NOVELTY_PROJECTION_IDS].sort());
    expect(new Set(NOVELTY_IDENTITY_DECLARATIONS.map((row) => row.projection)).size).toBe(52);
    expect(NOVELTY_IDENTITY_DECLARATIONS.filter((row) => row.kind === "exempt").map((row) => row.projection)).toEqual([
      "derived.grade.move_quality",
    ]);
  });

  it("uses only declared projection operands and excludes every run-location anchor", () => {
    const awaiting = new Map([["derived.explorer.population_summary", ["nodeId", "kind", "total", "white", "draws", "black", "recency", "population", "reason", "detail"]]]);
    const volatile = new Set(["nodeId", "eventId", "before_fen", "beforeFen", "startFen", "fen", "move_uci", "moveUci", "firstMoveUci", "secondMoveUci", "triggeringMove", "after_fen", "afterFen", "boundaryFen", "endFen", "firstNodeId", "lastNodeId", "retrievedAt"]);
    for (const declaration of NOVELTY_IDENTITY_DECLARATIONS) {
      if (declaration.kind === "exempt") continue;
      const projection = PRIMARY_EVIDENCE_MANIFEST.projections.find((item) => item.id === declaration.projection);
      const operands = projection?.operands ?? awaiting.get(declaration.projection) ?? [];
      expect(declaration.comparedFields.every((field) => operands.includes(field))).toBe(true);
      expect(declaration.comparedFields.some((field) => volatile.has(field))).toBe(false);
    }
  });

  it("matches a stable fact across distinct nodes and move anchors", () => {
    const first = stableNoveltyIdentity("rules.structural.event.isolated_pawn", {
      before_fen: "before-one", move_uci: "a2a4", after_fen: "after-one",
      family: "isolated_pawn", before: { white: ["a2"] }, after: { white: ["a4"] },
    });
    const ancestor = stableNoveltyIdentity("rules.structural.event.isolated_pawn", {
      before_fen: "before-two", move_uci: "h2h4", after_fen: "after-two",
      family: "isolated_pawn", before: { white: ["a2"] }, after: { white: ["a4"] },
    });
    expect(first).toBe(ancestor);
  });

  it("retains subject bytes and keeps positive and avoidance polarity distinct", () => {
    const left = stableNoveltyIdentity("rules.transition.event.occupied_defence", {
      before_fen: "a", move_uci: "a2a3", after_fen: "b",
      subject: { color: "white", role: "knight", square: "f3" }, targets_before: ["e5"], targets_after: ["e5", "h4"],
    });
    const changedSubject = stableNoveltyIdentity("rules.transition.event.occupied_defence", {
      before_fen: "c", move_uci: "b2b3", after_fen: "d",
      subject: { color: "white", role: "bishop", square: "f3" }, targets_before: ["e5"], targets_after: ["e5", "h4"],
    });
    const positive = stableNoveltyIdentity("rules.structural.event.isolated_pawn", { family: "isolated_pawn", before: 0, after: 1 });
    const avoided = stableNoveltyIdentity("derived.semantic_avoidance.isolated_pawn", { relation: "avoided", family: "isolated_pawn" });
    expect(left).not.toBe(changedSubject);
    expect(positive).not.toBe(avoided);
  });

  it("preserves edge-scoped grades rather than claiming a repeated class is old", () => {
    expect(stableNoveltyIdentity("derived.grade.move_quality", { klass: "inaccuracy", arm: "loss" })).toBeNull();
  });

  it("keeps the two population-summary variants canonical and distinct", () => {
    const stats = stableNoveltyIdentity("derived.explorer.population_summary", { kind: "stats", total: 120, white: 50, draws: 20, black: 50, population: { ratings: [1600] } });
    const abstention = stableNoveltyIdentity("derived.explorer.population_summary", { kind: "abstention", reason: "source_unavailable", detail: "HTTP 429", population: { ratings: [1600] } });
    expect(stats).not.toBe(abstention);
    expect(stats).not.toContain("undefined");
    expect(abstention).not.toContain("undefined");
  });

  it("derives the active closure from the author's theory timing decision", () => {
    const withoutTheorySuppression = [...new Set([...POSTCOMMIT, ...STRUCTURE])];
    const withTheorySuppression = [...new Set([...POSTCOMMIT, ...STRUCTURE, ...THEORY])];
    expect(withoutTheorySuppression).toHaveLength(49);
    expect(withTheorySuppression).toHaveLength(52);
    expect(withTheorySuppression.filter((id) => !withoutTheorySuppression.includes(id))).toEqual([
      "pack.authored.claim", "derived.explorer.population_summary", "theory.opening_identity.record",
    ]);
  });
});
