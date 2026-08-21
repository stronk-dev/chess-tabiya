import { normalizeMove } from "chessops/chess";
import { INITIAL_FEN } from "chessops/fen";
import { parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import { canonicalFen, positionFromFen } from "./chess.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { declareEvidence } from "./evidence-contract.js";
import {
  assertEvidenceSelectionResult,
  assertSemanticEvidenceEvent,
  canonicalMoveUci,
  compileSemanticEvidenceEvent,
  legalAlternativeEdges,
  selectSemanticEvidence,
  selectLocalSemanticEvidence,
  structuralSemanticEvents,
  transitionSemanticEvents,
  type SemanticEvidenceEvent,
} from "./semantic-evidence.js";

const ref = (id: string) => ({ id, version: 1 } as const);

function after(fen: string, uci: string): string {
  const position = positionFromFen(fen);
  const parsed = parseUci(uci)!;
  const move = normalizeMove(position, parsed);
  expect(position.isLegal(move)).toBe(true);
  position.play(move);
  return canonicalFen(position);
}

function event(fen: string, uci: string, projection = "rules.structural.event.open_file", sign: "gained" | "lost" | "preserved" = "gained"): SemanticEvidenceEvent {
  const afterFen = after(fen, uci);
  const payload = Object.freeze({ before_fen: canonicalFen(positionFromFen(fen)), move_uci: canonicalMoveUci(fen, uci), after_fen: afterFen, family: projection.split(".").at(-1), before: [], after: ["fixture"] });
  const declared = declareEvidence(ref("rules.structural"), ref(projection), payload);
  return compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { evidence: declared, anchor: { beforeFen: fen, moveUci: uci, afterFen, side: positionFromFen(fen).turn }, sign, operands: payload });
}

function ruleEvent(fen: string, uci: string, family: "castled" | "promotion" | "checkmate" | "last_of_role"): SemanticEvidenceEvent {
  const afterFen = after(fen, uci);
  const canonical = canonicalMoveUci(fen, uci);
  const payload = Object.freeze({ before_fen: canonicalFen(positionFromFen(fen)), move_uci: canonical, after_fen: afterFen, mover: "fixture", from: canonical.slice(0, 2), to: canonical.slice(2, 4), detail: family });
  const declared = declareEvidence(ref("rules.transition"), ref(`rules.transition.event.${family}`), payload);
  return compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { evidence: declared, anchor: { beforeFen: fen, moveUci: uci, afterFen, side: positionFromFen(fen).turn }, sign: "state", operands: payload });
}

describe("semantic evidence runtime", () => {
  it("seals event bytes and rejects structural forgeries", () => {
    const value = event(INITIAL_FEN, "e2e4");
    expect(() => assertSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, value)).not.toThrow();
    expect(() => assertSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { ...value })).toThrowError(expect.objectContaining({ code: "EVIDENCE_GENERIC_BYPASS" }));
  });

  it("canonicalizes both castling encodings to one resulting-king-square event identity", () => {
    const fen = "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1";
    expect(canonicalMoveUci(fen, "e1h1")).toBe("e1g1");
    const standard = ruleEvent(fen, "e1g1", "castled");
    const imported = ruleEvent(fen, "e1h1", "castled");
    expect(imported.id).toBe(standard.id);
  });

  it("enumerates ordinary, en-passant, castling and all four promotion roles as replayable exact children", () => {
    const fixtures = [
      { fen: INITIAL_FEN, move: "e2e4", contains: "d2d4" },
      { fen: "4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1", move: "e5d6", contains: "e5e6" },
      { fen: "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1", move: "e1g1", contains: "e1c1" },
      { fen: "4k3/P7/8/8/8/8/8/4K3 w - - 0 1", move: "a7a8q", contains: "a7a8n" },
    ];
    for (const fixture of fixtures) {
      const alternatives = legalAlternativeEdges(fixture.fen, fixture.move);
      expect(alternatives.some((edge) => edge.moveUci === fixture.contains)).toBe(true);
      for (const edge of alternatives) expect(after(edge.beforeFen, edge.moveUci)).toBe(edge.afterFen);
    }
    expect(legalAlternativeEdges(fixtures[3]!.fen, "e1e2").filter((edge) => edge.moveUci.startsWith("a7a8")).map((edge) => edge.moveUci)).toEqual(["a7a8b", "a7a8n", "a7a8q", "a7a8r"]);
  });

  it("selects a critical exact event without granting valence and seals the result", () => {
    const fen = "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1";
    const played = ruleEvent(fen, "e1g1", "castled");
    const result = selectSemanticEvidence(PRIMARY_EVIDENCE_MANIFEST, ref("research.r2_candidate"), { beforeFen: fen, moveUci: "e1g1", afterFen: after(fen, "e1g1"), playedEvents: [played], evaluateAlternative: () => [] });
    expect(result.selected).toHaveLength(1);
    expect(result.selected[0]?.kind).toBe("played_event");
    expect(result.selected[0]?.event.valence).toBeUndefined();
    expect(() => assertEvidenceSelectionResult(PRIMARY_EVIDENCE_MANIFEST, result)).not.toThrow();
    expect(() => assertEvidenceSelectionResult(PRIMARY_EVIDENCE_MANIFEST, { ...result })).toThrowError(expect.objectContaining({ code: "EVIDENCE_GENERIC_BYPASS" }));
  });

  it("emits identity-preserving structural relations while leaving raw readings independent", () => {
    const afterFen = after(INITIAL_FEN, "e2e4");
    const values = structuralSemanticEvents(INITIAL_FEN, "e2e4", afterFen);
    expect(values.length).toBeGreaterThan(0);
    expect(values.every((value) => value.anchor.moveUci === "e2e4" && value.operands.before_fen === value.anchor.beforeFen && value.operands.after_fen === value.anchor.afterFen)).toBe(true);
    expect(values.filter((value) => value.operands.family === "piece_count")).toHaveLength(12);
    expect(values.some((value) => value.sign !== "preserved")).toBe(true);
  });

  it("emits independent transition properties without priority suppression", () => {
    const fen = "4k3/8/5p2/4q3/3P4/8/8/4K3 w - - 0 1";
    const values = transitionSemanticEvents(fen, "d4e5", after(fen, "d4e5"));
    const families = new Set(values.map((value) => value.operands.family));
    expect(families.has("clock_reset")).toBe(true);
    expect(families.has("last_of_role")).toBe(true);
    expect(families.has("pawn_contact")).toBe(true);
    expect(values.every((value) => value.projection.id === `rules.transition.event.${value.operands.family}`)).toBe(true);
  });

  it("emits castling, promotion and checkmate exact positives", () => {
    const cases = [
      { fen: "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1", move: "e1g1", family: "castled" },
      { fen: "4k3/P7/8/8/8/8/8/4K3 w - - 0 1", move: "a7a8q", family: "promotion" },
      { fen: "7k/8/5KQ1/8/8/8/8/8 w - - 0 1", move: "g6g7", family: "checkmate" },
    ] as const;
    for (const fixture of cases) expect(transitionSemanticEvents(fixture.fen, fixture.move, after(fixture.fen, fixture.move)).some((value) => value.operands.family === fixture.family)).toBe(true);
  });

  it("runs the compiled research policy over the complete local legal population", () => {
    const afterFen = after(INITIAL_FEN, "e2e4");
    const result = selectLocalSemanticEvidence(ref("research.r2_candidate"), { beforeFen: INITIAL_FEN, moveUci: "e2e4", afterFen });
    expect(result.population.evaluatedAlternatives).toBe(result.population.legalAlternatives);
    expect(result.population.legalAlternatives).toBe(19);
    expect(result.selected.length).toBeLessThanOrEqual(2);
    expect(() => assertEvidenceSelectionResult(PRIMARY_EVIDENCE_MANIFEST, result)).not.toThrow();
  });
});
