import { describe, expect, it } from "vitest";
import { CANDIDATE_EVENTS_SCOPE, CANDIDATE_WIDE_SCOPE, candidateOutcomeFoundationId, compileCandidateFoundation, readCandidateOutcomeSources, compileCandidatePopulation, readCandidateFoundationSources,
  type CandidatePopulationReceipt, type CandidateWideScope } from "./candidate-population.js";
import { evidenceDigest, evidenceValueReceipt, type DeclaredEvidence } from "./evidence-contract.js";
import { invokeEvidenceValueRoute, readSubjectOutcomeInvocation } from "./internal/evidence-value-routes.js";
import { SUBJECT_OUTCOME_FAMILIES, type SubjectOutcomeFamily } from "./semantic-subject-types.js";

const capture = "7k/8/8/3p4/2P5/8/3P4/7K w - - 0 1";
const fixtures: { readonly [F in SubjectOutcomeFamily]: readonly [string, string] } = {
  backward_pawn: ["7k/4p3/4p3/8/3P4/8/8/7K w - - 0 1", "d4d5"],
  doubled_pawn: [capture, "h1g1"], half_open_file: [capture, "h1g1"], isolated_pawn: [capture, "h1g1"],
  king_opposition: ["4k3/8/4K3/8/8/8/P7/8 w - - 0 1", "a2a3"],
  king_zone: [capture, "h1g1"], line_blockers: ["7k/8/8/8/8/8/B7/R3K3 w - - 0 1", "e1d1"],
  open_file: [capture, "h1g1"], passed_pawn: [capture, "h1g1"], piece_count: [capture, "h1g1"],
  direct_attack_count: [capture, "h1g1"], loose_piece: [capture, "c4d5"], pawn_islands: [capture, "h1g1"],
};
const owners = new Map<string, CandidatePopulationReceipt<CandidateWideScope>>();
function owner(fen: string) {
  const saved = owners.get(fen); if (saved !== undefined) return saved;
  const result = compileCandidatePopulation({ beforeFen: fen, ruleset: "standard", scope: CANDIDATE_WIDE_SCOPE });
  if (result.kind !== "ready") throw Error(JSON.stringify(result.error));
  owners.set(fen, result.receipt); return result.receipt;
}

describe("source-owned subject outcome factory boundary", () => {
  it.each(SUBJECT_OUTCOME_FAMILIES.flatMap(family => (["foundation", "wide"] as const).map(scope => ({ family, scope }))))("$scope $family seals the complete original legal and family vector", ({ family, scope }) => {
    const [fen, moveUci] = fixtures[family];
    const core = scope === "foundation" ? compileCandidateFoundation({ beforeFen: fen, ruleset: "standard" }) : undefined;
    if (core !== undefined && core.kind !== "ready") throw Error(JSON.stringify(core));
    const receipt = core?.receipt ?? owner(fen), frame = readCandidateOutcomeSources(receipt);
    const result = invokeEvidenceValueRoute(`derived.semantic_avoidance.${family}@2`, { receipt, moveUci });
    expect(result.kind).toBe("available"); if (result.kind !== "available") throw Error(result.reason);
    expect(Object.keys(result)).toEqual(["kind", "values"]); expect(result.values.length).toBeGreaterThan(0);
    const positions = [frame.root, ...frame.candidates.map(row => row.position)];
    // Literal per-family contract independent of the calculation's private vector builder.
    const familyVector = positions.flatMap<DeclaredEvidence<unknown>>(position => {
      switch (family) {
        case "backward_pawn": return [position.common[3]];
        case "doubled_pawn": case "isolated_pawn": return [position.common[4]];
        case "half_open_file": case "open_file": return [position.common[5]];
        case "king_opposition": return [position.common[2]];
        case "king_zone": return [...position.totals.kingZones];
        case "line_blockers": return [position.rays];
        case "passed_pawn": return position.totals.pawns.flatMap(pawn => pawn.kind === "present" ? [pawn.source] : []);
        case "piece_count": return [...position.totals.counts];
        case "direct_attack_count": return [position.totals.control];
        case "loose_piece": if (position.risk.kind !== "available") throw Error("Fixture risk unavailable"); return [position.risk.value];
        case "pawn_islands": return [position.common[1]];
      }
    });
    const expected = [...positions.map(position => position.common[0]), ...familyVector];
    const invocation = readSubjectOutcomeInvocation(result);
    expect(invocation.receipt).toBe(receipt); expect(invocation.result).toBe(result);
    expect(invocation.inputs).toHaveLength(expected.length);
    invocation.inputs.forEach((value, index) => expect(value).toBe(expected[index]));
    for (const value of result.values) {
      expect(readSubjectOutcomeInvocation(value)).toBe(invocation);
      expect(value.projection).toEqual({ id: `derived.semantic_avoidance.${family}`, version: 2 });
      expect(evidenceValueReceipt(value).sourceDigests).toEqual(expected.map(source => evidenceValueReceipt(source).payloadDigest));
      expect(evidenceValueReceipt(value).inputDigest).toBe(evidenceDigest({ foundationId: candidateOutcomeFoundationId(receipt), compilerVersion: 8, moveUci, family }));
      expect(() => readSubjectOutcomeInvocation({ ...value })).toThrow(/original/);
    }
    expect(() => readSubjectOutcomeInvocation({ ...result })).toThrow(/original/);
  });

  it.each(SUBJECT_OUTCOME_FAMILIES)("%s retains original complete-empty and source-local result membership", family => {
    const receipt = owner("8/8/8/8/8/1r6/2k5/K7 w - - 0 1");
    const empty = invokeEvidenceValueRoute(`derived.semantic_avoidance.${family}@2`, { receipt, moveUci: "a1a2" });
    expect(empty).toEqual({ kind: "available", values: [] });
    expect(readSubjectOutcomeInvocation(empty).receipt).toBe(receipt);
    expect(readSubjectOutcomeInvocation(empty).inputs[0]).toBe(receipt.legalMovesInput);
    // Only loose_piece depends on the missing root risk; the other total vectors are intact.
    const checked = owner("7k/8/8/8/8/8/8/r6K w - - 0 1");
    const unavailable = invokeEvidenceValueRoute(`derived.semantic_avoidance.${family}@2`, { receipt: checked, moveUci: checked.packet.candidates[0]!.moveUci });
    if (family === "loose_piece") expect(unavailable).toEqual({ kind: "unavailable", reason: "counterfactual_population_incomplete" });
    else expect(unavailable.kind).toBe("available");
    expect(readSubjectOutcomeInvocation(unavailable).receipt).toBe(checked);
    expect(() => readSubjectOutcomeInvocation({ ...unavailable })).toThrow(/original/);
  });

  it("refuses copied/narrow receipts, invented members and caller output fields before producing evidence", () => {
    const receipt = owner(capture), route = "derived.semantic_avoidance.passed_pawn@2";
    expect(() => invokeEvidenceValueRoute(route, { receipt: { ...receipt }, moveUci: "h1g1" })).toThrow();
    const narrow = compileCandidatePopulation({ beforeFen: capture, ruleset: "standard", scope: CANDIDATE_EVENTS_SCOPE });
    if (narrow.kind !== "ready") throw Error("Narrow fixture failed");
    // @ts-expect-error An events-only packet cannot grant subject-state authority.
    expect(() => invokeEvidenceValueRoute(route, { receipt: narrow.receipt, moveUci: "h1g1" })).toThrow();
    expect(() => invokeEvidenceValueRoute(route, { receipt, moveUci: "a1a8" })).toThrow();
    // @ts-expect-error The factory owns support and the entire output payload.
    expect(() => invokeEvidenceValueRoute(route, { receipt, moveUci: "h1g1", supportingMoves: ["c4d5"] })).toThrow();
    let reads = 0;
    const captured = invokeEvidenceValueRoute(route, { get receipt() { reads++; return receipt; }, moveUci: "h1g1" });
    expect(reads).toBe(1); expect(readSubjectOutcomeInvocation(captured).receipt).toBe(receipt);
  });
});
