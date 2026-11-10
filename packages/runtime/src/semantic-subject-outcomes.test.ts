import { describe, expect, it } from "vitest";
import { CANDIDATE_WIDE_SCOPE, compileCandidatePopulation, type CandidatePopulationReceipt, type CandidateWideScope } from "./candidate-population.js";
import { computeSubjectOutcomes } from "./semantic-subject-outcomes.js";
import { SUBJECT_OUTCOME_FAMILIES, type SubjectOutcomeFamily } from "./semantic-subject-types.js";

const capture = "7k/8/8/3p4/2P5/8/3P4/7K w - - 0 1";
function receipt(fen: string): CandidatePopulationReceipt<CandidateWideScope> {
  const result = compileCandidatePopulation({ beforeFen: fen, ruleset: "standard", scope: CANDIDATE_WIDE_SCOPE });
  if (result.kind !== "ready") throw Error(JSON.stringify(result.error)); return result.receipt;
}
const positive: { readonly [F in SubjectOutcomeFamily]: readonly [string, string] } = {
  backward_pawn: ["7k/4p3/4p3/8/3P4/8/8/7K w - - 0 1", "d4d5"],
  doubled_pawn: [capture, "h1g1"], half_open_file: [capture, "h1g1"], isolated_pawn: [capture, "h1g1"],
  king_opposition: ["4k3/8/4K3/8/8/8/P7/8 w - - 0 1", "a2a3"],
  king_zone: [capture, "h1g1"], line_blockers: ["7k/8/8/8/8/8/B7/R3K3 w - - 0 1", "e1d1"],
  open_file: [capture, "h1g1"], passed_pawn: [capture, "h1g1"], piece_count: [capture, "h1g1"],
  direct_attack_count: [capture, "h1g1"], loose_piece: [capture, "c4d5"], pawn_islands: [capture, "h1g1"],
};

describe("thirteen exact root subject outcome calculations", () => {
  const literal = [
    { family: "backward_pawn", subject: { kind: "backward_pawn", color: "black", rootSquare: "e6" }, parameters: {}, root: true, played: false, alternative: "h1g1", outcome: true, relation: "true_to_true" },
    { family: "doubled_pawn", subject: { kind: "doubled_pawn", color: "white", file: "d" }, parameters: {}, root: false, played: false, alternative: "c4d5", outcome: true, relation: "false_to_true" },
    { family: "half_open_file", subject: { kind: "half_open_file", color: "black", file: "c" }, parameters: {}, root: true, played: true, alternative: "c4d5", outcome: false, relation: "true_to_false" },
    { family: "isolated_pawn", subject: { kind: "isolated_pawn", color: "white", file: "d" }, parameters: {}, root: false, played: false, alternative: "c4d5", outcome: true, relation: "false_to_true" },
    { family: "king_opposition", subject: { kind: "king_opposition", whiteRootSquare: "e6", blackRootSquare: "e8" }, parameters: { holder: "white", form: "direct" }, root: false, played: true, alternative: "e6d5", outcome: false, relation: "false_to_false" },
    { family: "king_zone", subject: { kind: "king_zone", color: "white", rootSquare: "h1" }, parameters: { zone: "edge" }, root: true, played: true, alternative: "h1g2", outcome: false, relation: "true_to_false" },
    { family: "line_blockers", subject: { kind: "line_blockers", root: { color: "white", role: "rook", square: "a1" }, direction: { df: 0, dr: 1 } }, parameters: {}, root: 1, played: 1, alternative: "a2b3", outcome: 0, relation: "decrease" },
    { family: "open_file", subject: { kind: "open_file", file: "c" }, parameters: {}, root: false, played: false, alternative: "c4d5", outcome: true, relation: "false_to_true" },
    { family: "passed_pawn", subject: { kind: "passed_pawn", color: "white", rootSquare: "c4" }, parameters: {}, root: false, played: false, alternative: "c4d5", outcome: true, relation: "false_to_true" },
    { family: "piece_count", subject: { kind: "piece_count", color: "black", role: "pawn" }, parameters: {}, root: 1, played: 1, alternative: "c4d5", outcome: 0, relation: "decrease" },
    { family: "direct_attack_count", subject: { kind: "direct_attack_count", color: "white", square: "d5" }, parameters: {}, root: 1, played: 1, alternative: "c4d5", outcome: 0, relation: "decrease" },
    { family: "loose_piece", subject: { kind: "loose_piece", root: { color: "white", role: "pawn", square: "c4" } }, parameters: {}, root: true, played: false, alternative: "h1g1", outcome: true, relation: "true_to_true" },
    { family: "pawn_islands", subject: { kind: "pawn_islands", color: "black" }, parameters: {}, root: 1, played: 1, alternative: "c4d5", outcome: 0, relation: "decrease" },
  ] as const;
  it.each(literal)("$family retains a literal subject/parameter and root/played/alternative outcome", expected => {
    const [fen, move] = positive[expected.family], result = computeSubjectOutcomes(expected.family, receipt(fen), move);
    if (result.kind !== "available") throw Error(result.reason);
    const fact = result.payloads.find(row => JSON.stringify(row.subject) === JSON.stringify(expected.subject)
      && JSON.stringify(row.parameters) === JSON.stringify(expected.parameters) && row.alternativeRelation === expected.relation);
    expect(fact).toBeDefined();
    expect(fact!.root).toMatchObject({ kind: "present", value: expected.root });
    expect(fact!.played).toMatchObject({ kind: "present", value: expected.played });
    expect(fact!.alternatives.find(row => row.moveUci === expected.alternative)).toMatchObject({
      moveUci: expected.alternative, state: { kind: "present", value: expected.outcome }, relation: expected.relation,
    });
    expect(fact!.supportingMoves).toContain(expected.alternative);
  });

  it.each(SUBJECT_OUTCOME_FAMILIES)("%s has an actual complete positive with exact original vectors", family => {
    const [fen, move] = positive[family], owner = receipt(fen), result = computeSubjectOutcomes(family, owner, move);
    expect(result.kind).toBe("available"); if (result.kind !== "available") throw Error(`${family}: ${result.reason}`);
    expect(result.payloads.length).toBeGreaterThan(0);
    expect(result.inputs[0]).toBe(owner.legalMovesInput);
    owner.packet.candidates.forEach((row, index) => expect(result.inputs[index + 1]).toBe(row.readings.find(value => value.projection.id === "rules.mobility.reading.legal_moves")));
    for (const fact of result.payloads) {
      expect(fact.family).toBe(family); expect(fact.subject.kind).toBe(family); expect(fact.moveUci).toBe(move);
      expect(fact.legalAlternatives).toBe(owner.packet.legalMoves.length - 1);
      expect(fact.alternatives.map(row => row.moveUci)).toEqual(owner.packet.candidates.filter(row => row.moveUci !== move).map(row => row.moveUci));
      expect(fact.alternativesWithOutcome).toBe(fact.supportingMoves.length);
      expect(new Set(fact.supportingMoves).size).toBe(fact.supportingMoves.length);
      expect(fact.supportingMoves).toEqual(fact.alternatives.filter(row => row.relation === fact.alternativeRelation).map(row => row.moveUci));
      expect(fact.root.kind).toBe("present"); expect(fact.played.kind).toBe("present");
      expect(Object.isFrozen(fact.root)).toBe(true); expect(Object.isFrozen(fact.subject)).toBe(true);
    }
  });

  it("one alternative retains both changed original pawns, while captured pawns remain noncomparable", () => {
    const owner = receipt(capture), result = computeSubjectOutcomes("passed_pawn", owner, "h1g1");
    if (result.kind !== "available") throw Error(result.reason);
    const changed = result.payloads.filter(row => row.alternativeRelation === "false_to_true" && row.supportingMoves.includes("c4d5"));
    expect(changed.map(row => row.subject)).toEqual([
      { kind: "passed_pawn", color: "white", rootSquare: "d2" },
      { kind: "passed_pawn", color: "white", rootSquare: "c4" },
    ]);
    for (const fact of changed) {
      expect(fact.root).toEqual({ kind: "present", value: false }); expect(fact.played).toEqual({ kind: "present", value: false });
      expect(fact.alternatives.find(row => row.moveUci === "c4d5")).toEqual({ moveUci: "c4d5", state: { kind: "present", value: true }, relation: "false_to_true" });
    }
    const single = computeSubjectOutcomes("passed_pawn", receipt("7k/8/8/3p4/2P5/8/8/7K w - - 0 1"), "h1g1");
    if (single.kind !== "available") throw Error(single.reason);
    const victim = single.payloads.find(row => row.subject.color === "black" && row.subject.rootSquare === "d5");
    expect(victim).toBeDefined();
    expect(victim!.alternatives.find(row => row.moveUci === "c4d5")).toEqual({ moveUci: "c4d5", state: { kind: "removed", at: "d5" }, relation: "not_comparable" });
    expect(victim!.supportingMoves).not.toContain("c4d5");
  });

  it.each(["backward_pawn", "passed_pawn"] as const)("%s never offers absence after the played original pawn promotes", family => {
    const owner = receipt("8/P7/7k/8/8/8/8/7K w - - 0 1"), result = computeSubjectOutcomes(family, owner, "a7a8n");
    expect(result.kind).toBe("available"); if (result.kind !== "available") throw Error(result.reason);
    expect(result.payloads.some(row => row.subject.rootSquare === "a7")).toBe(false);
  });

  it.each(SUBJECT_OUTCOME_FAMILIES)("%s authenticates a real one-legal-move source and returns a genuine empty", family => {
    const owner = receipt("8/8/8/8/8/1r6/2k5/K7 w - - 0 1");
    expect(owner.packet.legalMoves.map(move => move.uci)).toEqual(["a1a2"]);
    const result = computeSubjectOutcomes(family, owner, "a1a2");
    expect(result.kind).toBe("available"); if (result.kind !== "available") throw Error(result.reason);
    expect(result.payloads).toEqual([]); expect(result.inputs[0]).toBe(owner.legalMovesInput);
    expect(result.inputs[1]).toBe(owner.packet.candidates[0]!.readings.find(value => value.projection.id === "rules.mobility.reading.legal_moves"));
    if (family === "passed_pawn") expect(result.inputs).toHaveLength(2); // Genuine empty pawn domain; no fabricated leaf.
    else expect(result.inputs.length).toBeGreaterThan(2);
  });
});
