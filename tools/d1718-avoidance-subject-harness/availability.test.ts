// DISPOSABLE D4200 research: measures an accepted conservative policy; not a successor
// implementation, source qualification, ordinary assistance binding or release/CI gate.
import { describe, expect, it } from "vitest";
import { CANDIDATE_WIDE_SCOPE, compileCandidatePopulation, readCandidateFoundationSources } from "../../packages/runtime/src/candidate-population.js";
import { assertDeclaredEvidence } from "../../packages/runtime/src/evidence-contract.js";
import { invokeEvidenceValueRoute } from "../../packages/runtime/src/internal/evidence-value-routes.js";

describe("D4200 source-local availability versus global canonical abstentions", () => {
  it("retains a genuine missing required risk source separately from complete arithmetic and empty own pieces", () => {
    const beforeFen = "7k/8/8/8/8/8/8/r6K w - - 0 1";
    const compiled = compileCandidatePopulation({ beforeFen, ruleset: "standard", scope: CANDIDATE_WIDE_SCOPE });
    if (compiled.kind !== "ready") throw Error(JSON.stringify(compiled.error));
    const receipt = compiled.receipt, frame = readCandidateFoundationSources(receipt);
    expect(receipt.packet.candidates.map(row => row.moveUci).sort()).toEqual(["h1g2", "h1h2"]);
    expect(frame.root.risk).toEqual({ kind: "unavailable", reason: "invalid_turn_clone" });
    for (const position of [frame.root, ...frame.candidates.map(row => row.position)]) {
      for (const source of [...position.common, ...position.totals.counts]) assertDeclaredEvidence(source);
      expect(position.totals.counts).toHaveLength(12);
    }
    for (const child of frame.candidates) {
      expect(child.position.risk.kind).toBe("available");
      if (child.position.risk.kind !== "available") throw Error("Actual available child risk required");
      expect(child.position.risk.value.payload.pieces).toEqual([]);
    }
    const result = invokeEvidenceValueRoute("derived.semantic_avoidance.loose_piece@2", {
      receipt, moveUci: "h1h2",
    });
    expect(result).toEqual({ kind: "unavailable", reason: "counterfactual_population_incomplete" });
    console.log(JSON.stringify({ question: "D4200", beforeFen, legalMembers: 2, completeArithmeticPositions: 3,
      rootRisk: frame.root.risk.kind, childRisks: frame.candidates.map(row => row.position.risk.kind),
      scope: "Real required root-risk failure stays unknown despite an empty own-piece domain; available child empties do not repair the missing root." }));
  });

  it("measures complete original arithmetic vectors on a legal discovered-check pawn capture", () => {
    const beforeFen = "k7/8/8/8/8/1p6/PP6/R6K w - - 0 1", moveUci = "a2b3";
    const compiled = compileCandidatePopulation({ beforeFen, ruleset: "standard", scope: CANDIDATE_WIDE_SCOPE });
    if (compiled.kind !== "ready") throw Error(JSON.stringify(compiled.error));
    const receipt = compiled.receipt, frame = readCandidateFoundationSources(receipt);
    const positions = [frame.root, ...frame.candidates.map(row => row.position)];
    expect(receipt.packet.candidates).toHaveLength(12);
    const played = receipt.packet.candidates.find(row => row.moveUci === moveUci)!;
    expect(played.afterFen).toBe("k7/8/8/8/8/1P6/1P6/R6K b - - 0 1");
    expect(played.abstentions.length).toBeGreaterThan(0);
    for (const position of positions) {
      for (const source of [position.common[0], position.common[1], position.common[4], position.common[5], ...position.totals.counts]) assertDeclaredEvidence(source);
      expect(position.common[1].payload.colors).toHaveLength(2);
      expect(position.common[5].payload.files).toHaveLength(8);
      expect(position.totals.counts).toHaveLength(12);
    }
    const familyResults = ["doubled_pawn", "isolated_pawn", "open_file", "half_open_file", "pawn_islands", "piece_count", "loose_piece"] as const;
    const results = familyResults.map(family => ({ family,
      result: invokeEvidenceValueRoute(`derived.semantic_avoidance.${family}@2`, { receipt, moveUci }) }));
    // This documents the current policy. Any change needs its own reviewed source/selection
    // contract; this exploratory expectation is never treated as proof the policy is desirable.
    for (const { result } of results) expect(result).toEqual({ kind: "unavailable", reason: "counterfactual_population_incomplete" });
    console.log(JSON.stringify({ question: "D4200", beforeFen, moveUci, legalMembers: receipt.packet.candidates.length,
      completePositions: positions.length, completeSourcesPerPosition: { legal: 1, connectivity: 1, group: 1, fileState: 1, counts: 12 },
      canonicalAbstentions: receipt.packet.candidates.flatMap(row => row.abstentions.map(value => ({ move: row.moveUci, ...value }))),
      riskUnavailablePositions: positions.filter(position => position.risk.kind === "unavailable").length,
      outcomes: results.map(({ family, result }) => ({ family, kind: result.kind })),
      scope: "Original legal/member/source vectors are present; current global policy suppresses every family. No source/selector policy change or invented risk value." }));
  });
});
