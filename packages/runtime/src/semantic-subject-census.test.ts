import { describe, expect, it } from "vitest";
import { runSubjectCensuses, assertSubjectCensusFamilies } from "../../../tools/semantic-validation-build.js";
import type { SemanticValidationPopulation } from "../../../tools/semantic-validation-population.js";
import { canonicalSemanticEdge, SEMANTIC_VALIDATION_OPERATIONS } from "./semantic-validation-operations.js";
import { SUBJECT_OUTCOME_FAMILIES } from "./semantic-subject-types.js";
import { evidenceDigest } from "./evidence-contract.js";
import { semanticLegalSetDigest, type SemanticSubjectOutcomesInput } from "./semantic-validation.js";
import { CANDIDATE_WIDE_SCOPE, compileCandidatePopulation } from "./candidate-population.js";

const setups = [
  ["7k/8/8/3p4/2P5/8/3P4/7K w - - 0 1", "h1g1"],
  ["8/8/8/8/8/1r6/2k5/K7 w - - 0 1", "a1a2"],
  ["4k3/8/8/8/8/8/4r3/4K3 w - - 0 1", "e1e2"],
] as const;
const sampledEdges = setups.map(([beforeFen, moveUci], i) => ({ site: `literal-census-${i}`, ply: 1,
  edge: canonicalSemanticEdge({ kind: "edge", beforeFen, moveUci, afterFen: "" }) }));
const population: SemanticValidationPopulation = { id: "literal-source-census", version: 1, pgnSha256: "0".repeat(64), manifestSha256: "1".repeat(64), games: 0, recordedPaths: [], sampledEdges,
  projectionDigests: { sampled_edges: evidenceDigest(sampledEdges), recorded_paths: evidenceDigest([]), bounded_target_sources: evidenceDigest(setups) } };

describe("family-aware source census executes actual complete operations", () => {
  it("retains every family, full denominator, evaluated zero and unavailable; compares complete uncapped multisets", async () => {
    const runs = runSubjectCensuses(population);
    expect([...runs.keys()]).toEqual(SUBJECT_OUTCOME_FAMILIES);
    for (const family of SUBJECT_OUTCOME_FAMILIES) {
      const run = runs.get(family)!;
      expect(run.invocations).toBe(3);
      expect(run.projection).toBe(`subject_outcomes:${family}`);
      expect(run.unavailable).toEqual(["literal-census-2#1:complete_alternative_population_unavailable"]);
      const expected: string[] = [];
      for (const [index, row] of sampledEdges.entries()) {
        const compiled = compileCandidatePopulation({ beforeFen: row.edge.beforeFen, ruleset: "standard", scope: CANDIDATE_WIDE_SCOPE });
        if (compiled.kind !== "ready") throw Error("Required literal original root missing");
        const alternatives = compiled.receipt.packet.candidates.map(candidate => ({ kind: "edge" as const, beforeFen: row.edge.beforeFen, moveUci: candidate.moveUci, afterFen: candidate.afterFen }));
        const input: SemanticSubjectOutcomesInput = { kind: "subject_outcomes", family, population: { kind: "complete_alternatives", rootFen: row.edge.beforeFen, played: row.edge, alternatives,
          legalSetDigest: semanticLegalSetDigest(row.edge.beforeFen, alternatives.map(edge => edge.moveUci)) } };
        const result = await SEMANTIC_VALIDATION_OPERATIONS["runtime.semantic.subject_outcomes"].invoke(input);
        if (index === 1) expect(result).toEqual({ kind: "completed", observations: [], abstentions: [] });
        if (result.kind === "completed") for (const observation of result.observations) {
          if (observation.kind !== "event") throw Error("Wrong source observation grain");
          expected.push(`${row.site}#${row.ply}:${observation.item.id}`);
        }
      }
      expect([...(run.observations.get(`event:derived.semantic_avoidance.${family}@2`) ?? [])].sort()).toEqual(expected.sort());
      if (family === "direct_attack_count") expect(expected.length).toBeGreaterThan(2);
    }
    expect(new Set([...runs.values()].map(run => run.inputSha)).size).toBe(13);
    const missing = new Map(runs); missing.delete("pawn_islands"); expect(() => assertSubjectCensusFamilies(missing, population)).toThrow();
    const reused = new Map(runs); reused.set("pawn_islands", runs.get("piece_count")!); expect(() => assertSubjectCensusFamilies(reused, population)).toThrow();
    const relabelled = new Map(runs); relabelled.set("pawn_islands", { ...runs.get("piece_count")!, projection: "subject_outcomes:pawn_islands", observations: new Map() });
    expect(() => assertSubjectCensusFamilies(relabelled, population)).toThrow();
    const short = new Map(runs); short.set("pawn_islands", { ...runs.get("pawn_islands")!, invocations: 2 }); expect(() => assertSubjectCensusFamilies(short, population)).toThrow();
  });
});
