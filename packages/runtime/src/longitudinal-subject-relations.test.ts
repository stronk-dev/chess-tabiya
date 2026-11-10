import { describe, expect, it } from "vitest";
import { CANDIDATE_WIDE_SCOPE, compileCandidatePopulation } from "./candidate-population.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import { subjectRelationIncidences } from "./internal/longitudinal-subject-relations.js";
import { SUBJECT_OUTCOME_FAMILIES } from "./semantic-subject-types.js";

function owner(fen: string) {
  const value = compileCandidatePopulation({ beforeFen: fen, ruleset: "standard", scope: CANDIDATE_WIDE_SCOPE });
  if (value.kind !== "ready") throw Error(JSON.stringify(value.error)); return value.receipt;
}
const capture = "7k/8/8/3p4/2P5/8/3P4/7K w - - 0 1";

describe("complete original subject-relation opportunity algebra", () => {
  it("retains true and false opportunities for the same subject and full distinct legal denominator", () => {
    const receipt = owner(capture), result = invokeEvidenceValueRoute("derived.semantic_avoidance.piece_count@2", { receipt, moveUci: "h1g1" });
    const read = subjectRelationIncidences("piece_count", result);
    if (read.kind !== "available") throw Error(read.reason);
    expect(read.actor).toBe("white"); expect(read.edge.moveUci).toBe("h1g1");
    const pawn = read.rows.filter(row => row.subject.color === "black" && row.subject.role === "pawn");
    expect(pawn).toEqual([
      { family: "piece_count", subject: { kind: "piece_count", color: "black", role: "pawn" }, parameters: {}, relation: "decrease", occurred: false,
        legalAlternatives: receipt.packet.candidates.length - 1, matchingAlternatives: 1, comparableAlternatives: receipt.packet.candidates.length - 1 },
      { family: "piece_count", subject: { kind: "piece_count", color: "black", role: "pawn" }, parameters: {}, relation: "equal", occurred: true,
        legalAlternatives: receipt.packet.candidates.length - 1, matchingAlternatives: receipt.packet.candidates.length - 2, comparableAlternatives: receipt.packet.candidates.length - 1 },
    ]);
    expect(read.rows.some(row => row.subject.role === "bishop")).toBe(false); // Uniform zero counts are not opportunities.
    expect(() => subjectRelationIncidences("piece_count", { ...result })).toThrow(/original/);
  });

  it("counts played-matching and opposite relations explicitly for the same pawn file", () => {
    const receipt = owner(capture), result = invokeEvidenceValueRoute("derived.semantic_avoidance.doubled_pawn@2", { receipt, moveUci: "c4d5" });
    const read = subjectRelationIncidences("doubled_pawn", result);
    if (read.kind !== "available") throw Error(read.reason);
    const d = read.rows.filter(row => row.subject.color === "white" && row.subject.file === "d");
    expect(d.map(row => [row.relation, row.occurred, row.matchingAlternatives])).toEqual([["false_to_true", true, 0], ["false_to_false", false, receipt.packet.candidates.length - 1]]);
    expect(read.rows.every(row => row.legalAlternatives === receipt.packet.candidates.length - 1)).toBe(true);
    expect(read.rows.some(row => row.subject.color === "white" && row.subject.file === "c")).toBe(false); // Its doubled flag stays false.
  });

  it("keeps two same-sign original file subjects from one capture instead of pooling a family", () => {
    const receipt = owner("7k/8/8/8/2n5/1P1P4/1P1P4/7K w - - 0 1");
    expect(receipt.packet.legalMoves.map(move => move.uci).sort()).toEqual(["b3b4", "b3c4", "d3c4", "d3d4", "h1g1", "h1g2", "h1h2"]);
    const source = invokeEvidenceValueRoute("derived.semantic_avoidance.isolated_pawn@2", { receipt, moveUci: "b3c4" });
    const read = subjectRelationIncidences("isolated_pawn", source);
    if (read.kind !== "available") throw Error(read.reason);
    const rows = read.rows.filter(row => row.subject.color === "white");
    expect(rows.map(row => [row.subject.file, row.relation, row.occurred, row.matchingAlternatives, row.legalAlternatives])).toEqual([
      ["b", "true_to_false", true, 1, 6], ["b", "true_to_true", false, 5, 6],
      ["d", "true_to_false", true, 1, 6], ["d", "true_to_true", false, 5, 6],
    ]);
  });

  it("counts a real comparable choice while a removed alternative stays in the full numeric denominator", () => {
    const receipt = owner("8/8/7k/3r4/2P3B1/8/8/7K w - - 0 1");
    expect(receipt.packet.legalMoves).toHaveLength(14);
    const source = invokeEvidenceValueRoute("derived.semantic_avoidance.line_blockers@2", { receipt, moveUci: "h1g1" });
    const read = subjectRelationIncidences("line_blockers", source);
    if (read.kind !== "available") throw Error(read.reason);
    const rows = read.rows.filter(row => row.subject.root.square === "d5" && row.subject.direction.df === 1 && row.subject.direction.dr === 0);
    // Bf5 adds one blocker; cxd5 removes the original rook (incomparable); the other eleven
    // alternatives preserve zero blockers. Neither removal nor the reduced comparable count
    // may shrink the original thirteen-alternative share denominator.
    expect(rows.map(row => [row.relation, row.occurred, row.matchingAlternatives, row.comparableAlternatives, row.legalAlternatives])).toEqual([
      ["increase", false, 1, 12, 13], ["equal", true, 11, 12, 13],
    ]);
  });

  it("keeps noncomparable promotion alternatives in the full share denominator", () => {
    const receipt = owner("8/P7/7k/8/8/8/8/7K w - - 0 1");
    const source = invokeEvidenceValueRoute("derived.semantic_avoidance.passed_pawn@2", { receipt, moveUci: "h1g1" });
    const read = subjectRelationIncidences("passed_pawn", source);
    if (read.kind !== "available") throw Error(read.reason);
    // The pawn stays passed for the played king move; other king moves match it, while every
    // promotion is incomparable. Incomparability alone cannot establish a declined alternative.
    expect(read.rows.filter(row => row.subject.rootSquare === "a7")).toEqual([]);
    const promoted = invokeEvidenceValueRoute("derived.semantic_avoidance.passed_pawn@2", { receipt, moveUci: "a7a8q" });
    const promotedRows = subjectRelationIncidences("passed_pawn", promoted);
    if (promotedRows.kind !== "available") throw Error(promotedRows.reason);
    expect(promotedRows.rows.filter(row => row.subject.rootSquare === "a7")).toEqual([]);
  });

  it.each(SUBJECT_OUTCOME_FAMILIES)("%s preserves forced evaluated-zero and genuine unavailable instead of fabricating opportunities", family => {
    const forced = invokeEvidenceValueRoute(`derived.semantic_avoidance.${family}@2`, { receipt: owner("8/8/8/8/8/1r6/2k5/K7 w - - 0 1"), moveUci: "a1a2" });
    expect(subjectRelationIncidences(family, forced)).toMatchObject({ kind: "available", actor: "white", rows: [] });
    const unavailable = invokeEvidenceValueRoute(`derived.semantic_avoidance.${family}@2`, { receipt: owner("4k3/8/8/8/8/8/4r3/4K3 w - - 0 1"), moveUci: "e1e2" });
    expect(subjectRelationIncidences(family, unavailable)).toEqual({ kind: "unavailable", family, reason: "counterfactual_population_incomplete" });
  });
});
