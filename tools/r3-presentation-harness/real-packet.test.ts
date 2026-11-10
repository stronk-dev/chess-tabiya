// DISPOSABLE research boundary controls. They never regenerate the historical JSON.
import { describe, expect, it } from "vitest";
import { selectSemanticEvidence, PRIMARY_EVIDENCE_MANIFEST, compileCandidatePopulation, CANDIDATE_WIDE_SCOPE } from "@chess-tabiya/runtime";
import { adaptSelectedEvidence } from "./real-packet.js";

const POLICY = { id: "research.r2_candidate", version: 3 } as const;
describe("historical R3 packet bridge", () => {
  it.each([
    ["rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", "e2e4", 0],
    ["k7/8/8/8/8/1p6/PP6/R6K w - - 0 1", "a2b3", 1],
  ] as const)("refuses genuine current selections instead of dropping their coverage: %s", (beforeFen, moveUci, unknown) => {
    const compiled = compileCandidatePopulation({ beforeFen, ruleset: "standard", scope: CANDIDATE_WIDE_SCOPE });
    if (compiled.kind !== "ready") throw Error("Actual research boundary fixture required");
    const selected = selectSemanticEvidence(PRIMARY_EVIDENCE_MANIFEST, POLICY, { receipt: compiled.receipt, moveUci });
    expect(selected.coverage.sources).toHaveLength(54);
    expect(selected.coverage.unavailable).toHaveLength(unknown);
    expect(() => adaptSelectedEvidence("current", selected)).toThrow(/R3_HISTORICAL_ADAPTER_RETIRED/);
  });

  it("still rejects an object that merely resembles a selection result", () => {
    expect(() => adaptSelectedEvidence("forged", {
      policy: POLICY, consumer: { id: "research.semantic_selection", version: 3 },
      population: { legalAlternatives: 1 }, coverage: { sources: [], unavailable: [] }, selected: [], rejected: [],
    } as never)).toThrowError(expect.objectContaining({ code: "EVIDENCE_GENERIC_BYPASS" }));
  });
});
