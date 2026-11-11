import { describe, expect, it } from "vitest";
import { CANDIDATE_WIDE_SCOPE, compileCandidatePopulation, compileCandidateFoundation, type CandidatePopulationReceipt, type CandidateWideScope } from "./candidate-population.js";
import { invokeEvidenceValueRoute, readSubjectOutcomePopulation } from "./internal/evidence-value-routes.js";
import { SUBJECT_OUTCOME_FAMILIES, type SubjectOutcomeFamily } from "./semantic-subject-types.js";

const owners = new Map<string, CandidatePopulationReceipt<CandidateWideScope>>();
function owner(fen: string) {
  const saved = owners.get(fen); if (saved !== undefined) return saved;
  const result = compileCandidatePopulation({ beforeFen: fen, ruleset: "standard", scope: CANDIDATE_WIDE_SCOPE });
  if (result.kind !== "ready") throw Error(JSON.stringify(result.error)); owners.set(fen, result.receipt); return result.receipt;
}
const counts: Record<SubjectOutcomeFamily, number> = {
  backward_pawn: 0, passed_pawn: 0, loose_piece: 0,
  doubled_pawn: 16, isolated_pawn: 16, half_open_file: 16, open_file: 8,
  piece_count: 12, direct_attack_count: 128, king_opposition: 6, king_zone: 4, line_blockers: 24, pawn_islands: 2,
};
function mutablePaths(value: unknown, path = "table"): string[] {
  if (value === null || typeof value !== "object") return [];
  return [...(!Object.isFrozen(value) ? [path] : []), ...Object.entries(value).flatMap(([key, child]) => mutablePaths(child, `${path}.${key}`))];
}

describe("internal source-owned complete subject population", () => {
  it.each(SUBJECT_OUTCOME_FAMILIES.flatMap(family => (["foundation", "wide"] as const).map(scope => ({ family, scope }))))("$scope $family retains the complete domain when the public event population is empty", ({ family, scope }) => {
    const fen = "8/8/8/8/8/1r6/2k5/K7 w - - 0 1";
    const core = scope === "foundation" ? compileCandidateFoundation({ beforeFen: fen, ruleset: "standard" }) : undefined;
    if (core !== undefined && core.kind !== "ready") throw Error(JSON.stringify(core));
    const receipt = core?.receipt ?? owner(fen);
    const result = invokeEvidenceValueRoute(`derived.semantic_avoidance.${family}@2`, { receipt, moveUci: "a1a2" });
    expect(result).toEqual({ kind: "available", values: [] });
    expect(Object.keys(result)).toEqual(["kind", "values"]); // Public result ABI stays closed.
    const read = readSubjectOutcomePopulation(family, result);
    expect(read.kind).toBe("available"); if (read.kind !== "available") throw Error(read.reason);
    expect(read.population).toMatchObject({ family, beforeFen: receipt.legalMovesInput.payload.fen, moveUci: "a1a2", actor: "white" });
    expect(read.population.subjects).toHaveLength(counts[family]);
    expect(read.population.subjects.every(subject => subject.alternatives.length === 0)).toBe(true);
    expect(mutablePaths(read)).toEqual([]);
    expect(readSubjectOutcomePopulation(family, result)).toBe(read);
    expect(() => readSubjectOutcomePopulation(family, { ...result })).toThrow(/original/);
  });

  it("retains played-matching and uniform counts without manufacturing a corresponding event", () => {
    const receipt = owner("7k/8/8/3p4/2P5/8/3P4/7K w - - 0 1");
    const result = invokeEvidenceValueRoute("derived.semantic_avoidance.piece_count@2", { receipt, moveUci: "h1g1" });
    const table = readSubjectOutcomePopulation("piece_count", result);
    if (result.kind !== "available" || table.kind !== "available") throw Error("Required literal source unavailable");
    const pawn = table.population.subjects.find(row => row.subject.color === "black" && row.subject.role === "pawn")!;
    expect(pawn).toMatchObject({ root: { kind: "present", value: 1 }, played: { kind: "present", value: 1 }, playedRelation: "equal" });
    expect(pawn.alternatives).toHaveLength(receipt.packet.candidates.length - 1);
    expect(pawn.alternatives.filter(row => row.relation === "decrease").map(row => row.moveUci)).toEqual(["c4d5"]);
    expect(result.values.filter(value => value.payload.subject.color === "black" && value.payload.subject.role === "pawn").map(value => value.payload.alternativeRelation)).toEqual(["decrease"]);
    const zero = table.population.subjects.find(row => row.subject.color === "white" && row.subject.role === "bishop")!;
    expect(zero).toMatchObject({ root: { kind: "present", value: 0 }, played: { kind: "present", value: 0 }, playedRelation: "equal" });
    expect(zero.alternatives.every(row => row.state.kind === "present" && row.state.value === 0 && row.relation === "equal")).toBe(true);
    expect(result.values.some(value => value.payload.subject.color === "white" && value.payload.subject.role === "bishop")).toBe(false);
    expect(() => readSubjectOutcomePopulation("open_file", result)).toThrow(/family/);
  });

  it("keeps captured and promoted pawn subjects, including noncomparable played states", () => {
    const captured = invokeEvidenceValueRoute("derived.semantic_avoidance.passed_pawn@2", { receipt: owner("7k/8/8/3p4/2P5/8/3P4/7K w - - 0 1"), moveUci: "c4d5" });
    const captureTable = readSubjectOutcomePopulation("passed_pawn", captured);
    if (captureTable.kind !== "available") throw Error(captureTable.reason);
    expect(captureTable.population.subjects.find(row => row.subject.color === "black" && row.subject.rootSquare === "d5"))
      .toMatchObject({ played: { kind: "removed", at: "d5" }, playedRelation: "not_comparable" });
    const receipt = owner("8/P7/7k/8/8/8/8/7K w - - 0 1");
    const promoted = invokeEvidenceValueRoute("derived.semantic_avoidance.passed_pawn@2", { receipt, moveUci: "a7a8q" });
    const promotionTable = readSubjectOutcomePopulation("passed_pawn", promoted);
    if (promotionTable.kind !== "available") throw Error(promotionTable.reason);
    const pawn = promotionTable.population.subjects.find(row => row.subject.rootSquare === "a7")!;
    expect(pawn).toMatchObject({ played: { kind: "promoted", current: { color: "white", role: "queen", square: "a8" } }, playedRelation: "not_comparable" });
    expect(pawn.alternatives.filter(row => row.moveUci.startsWith("a7a8")).map(row => row.relation)).toEqual(["not_comparable", "not_comparable", "not_comparable"]);
    expect(pawn.alternatives).toHaveLength(receipt.packet.candidates.length - 1);
  });

  it("retains role-inapplicable root rays and promotion-created zero-blocker rays without false comparability", () => {
    const result = invokeEvidenceValueRoute("derived.semantic_avoidance.line_blockers@2", { receipt: owner("8/P7/7k/8/8/8/8/7K w - - 0 1"), moveUci: "a7a8q" });
    const table = readSubjectOutcomePopulation("line_blockers", result);
    if (table.kind !== "available") throw Error(table.reason);
    const ray = table.population.subjects.find(row => row.subject.root.square === "a7" && row.subject.direction.df === 1 && row.subject.direction.dr === 0)!;
    expect(ray).toMatchObject({ root: { kind: "inapplicable", reason: "role" }, played: { kind: "present", value: 0, ray: { slider: { role: "queen", square: "a8" } } }, playedRelation: "not_comparable" });
    expect(mutablePaths(table)).toEqual([]);
  });

  it.each(SUBJECT_OUTCOME_FAMILIES)("%s authenticates source-local availability without claiming unknown means empty", family => {
    const result = invokeEvidenceValueRoute(`derived.semantic_avoidance.${family}@2`, { receipt: owner("4k3/8/8/8/8/8/4r3/4K3 w - - 0 1"), moveUci: "e1e2" });
    const table = readSubjectOutcomePopulation(family, result);
    if (family === "loose_piece") expect(table).toEqual({ kind: "unavailable", family, reason: "counterfactual_population_incomplete" });
    else {
      expect(table.kind).toBe("available");
      if (table.kind !== "available") throw Error(family);
      expect(table.population.family).toBe(family);
      for (const row of table.population.subjects) expect(row.alternatives.length).toBeGreaterThan(0);
    }
    expect(() => readSubjectOutcomePopulation(family, { ...result })).toThrow(/original/);
  });
});
