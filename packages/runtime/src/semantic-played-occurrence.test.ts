import { describe, expect, it } from "vitest";
import { localSemanticEvents, selectSemanticEvidence, type SemanticEvidenceEvent } from "./semantic-evidence.js";
import { semanticPlayedOccurrenceKey, semanticPlayedSubjectOrdinal } from "./semantic-played-occurrence.js";
import { SEMANTIC_PLAYED_RANKING_MODES } from "./semantic-played-types.js";
import { canonicalSemanticEdge } from "./semantic-validation-operations.js";
import { CANDIDATE_WIDE_SCOPE, compileCandidatePopulation, LOCAL_CANDIDATE_EVENT_PROJECTION_KEYS } from "./candidate-population.js";
import { EVIDENCE_CONTRACT_DECLARATIONS, PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { compileEvidenceManifest, type EvidenceSelectionPolicyDeclaration } from "./evidence-contract.js";
import type { BackwardPawnChange } from "./foundation-position-sources.js";

function events(fen: string, move: string) {
  const edge = canonicalSemanticEdge({ kind: "edge", beforeFen: fen, moveUci: move, afterFen: "" });
  return localSemanticEvents(edge.beforeFen, edge.moveUci, edge.afterFen);
}
const fixtures = [
  ["rules.structural.event.king_opposition@2", "4k3/8/4K3/8/8/8/8/8 w - - 0 1", "e6d6"],
  ["rules.structural.event.backward_pawn@2", "7k/4p3/4p3/8/3P4/8/8/7K w - - 0 1", "d4d5"],
  ["derived.structural.event.pawn_file_group@1", "7k/8/8/3p4/2P5/8/3P4/7K w - - 0 1", "c4d5"],
  ["rules.transition.event.slider_ray@2", "7k/8/8/8/8/8/B7/R3K3 w - - 0 1", "a2b3"],
  ["derived.activity.event.file_state@1", "7k/8/8/3p4/2P5/8/3P4/7K w - - 0 1", "c4d5"],
  ["derived.activity.event.file_access_revealed@1", "7k/8/8/8/8/2n5/1P6/1R5K w - - 0 1", "b2c3"],
  ["rules.structural.event.pawn_islands@2", "7k/8/8/3p4/2P5/8/3P4/7K w - - 0 1", "c4d5"],
] as const;
const key = (event: SemanticEvidenceEvent) => `${event.projection.id}@${event.projection.version}`;

describe("exact played-ranking modes and source-owned native identity", () => {
  it("declares exactly the42 current event refs, seven native modes and35 prevalence modes", () => {
    expect(Object.keys(SEMANTIC_PLAYED_RANKING_MODES).sort()).toEqual([...LOCAL_CANDIDATE_EVENT_PROJECTION_KEYS].sort());
    expect(Object.entries(SEMANTIC_PLAYED_RANKING_MODES).filter(([, mode]) => mode === "native_outcome").map(([ref]) => ref).sort()).toEqual(fixtures.map(row => row[0]).sort());
    expect(Object.values(SEMANTIC_PLAYED_RANKING_MODES).filter(mode => mode === "projection_sign_prevalence")).toHaveLength(35);
  });
  it.each(fixtures)("%s compares complete native operands without enclosing FEN/counters", (ref, fen, move) => {
    const original = events(fen, move).filter(event => key(event) === ref);
    const other = events(fen.replace("0 1", "0 2"), move).filter(event => key(event) === ref);
    expect(original.length).toBeGreaterThan(0); expect(other).toHaveLength(original.length);
    expect(original.map(semanticPlayedOccurrenceKey)).toEqual(other.map(semanticPlayedOccurrenceKey));
    expect(original.map(semanticPlayedSubjectOrdinal)).toEqual(other.map(semanticPlayedSubjectOrdinal));
    original.forEach(event => expect(() => semanticPlayedOccurrenceKey({ ...event })).toThrow());
  });
  it("orders stationary revealed-file pieces by original square rather than rook-before-queen factory order", () => {
    const native = events("7k/1R6/8/8/8/2n5/1P6/1Q5K w - - 0 1", "b2c3")
      .filter(event => key(event) === "derived.activity.event.file_access_revealed@1");
    const piece = (event: SemanticEvidenceEvent) => (event.operands as { piece: { role: string; square: string } }).piece;
    expect(native.map(piece)).toMatchObject([{ role: "rook", square: "b7" }, { role: "queen", square: "b1" }]);
    expect([...native].sort((a, b) => semanticPlayedSubjectOrdinal(a)! - semanticPlayedSubjectOrdinal(b)!).map(piece))
      .toMatchObject([{ role: "queen", square: "b1" }, { role: "rook", square: "b7" }]);
    expect(native.map(piece)).toMatchObject([{ role: "rook", square: "b7" }, { role: "queen", square: "b1" }]);
  });
  it("preserves multiple native subjects from one move and orders selected ties by original square", () => {
    const fen = "7k/2p5/2p5/1P6/3P4/8/8/7K w - - 0 1";
    const compiled = compileCandidatePopulation({ beforeFen: fen, ruleset: "standard", scope: CANDIDATE_WIDE_SCOPE });
    if (compiled.kind !== "ready") throw Error("Original source root failed");
    const native = compiled.receipt.packet.candidates.find(row => row.moveUci === "d4d5")!.events.filter(event => key(event) === "rules.structural.event.backward_pawn@2");
    expect(native.map(event => (event.operands as BackwardPawnChange).subject.beforePawn)).toEqual(["c7", "d4", "c6"]);
    expect(new Set(native.map(semanticPlayedOccurrenceKey)).size).toBe(3);
    const policy: EvidenceSelectionPolicyDeclaration = { id: "test.root_subject_order", version: 1, consumer: { id: "research.semantic_selection", version: 3 }, disposition: "experimental", minimumAlternatives: 0, maximumSameFamilyShare: 1, minimumAlternativeOnlyShare: null, maxFacts: 1,
      criticalEvents: [{ id: "rules.structural.event.backward_pawn", version: 2 }] };
    const manifest = compileEvidenceManifest({ ...EVIDENCE_CONTRACT_DECLARATIONS, selectionPolicies: [...EVIDENCE_CONTRACT_DECLARATIONS.selectionPolicies!, policy] });
    const result = selectSemanticEvidence(manifest, policy, { receipt: compiled.receipt, moveUci: "d4d5" });
    expect(result.selected.map(fact => key(fact.event))).toEqual(["rules.structural.event.backward_pawn@2"]);
    expect(result.selected.map(fact => (fact.event.operands as BackwardPawnChange).subject.beforePawn)).toEqual(["d4"]);
    expect(result.selected.map(fact => fact.kind === "played_event" ? fact.sameFamilyShare : null)).toEqual([0]);
    // Ranking must not reorder the underlying canonical source population.
    expect(native.map(event => (event.operands as BackwardPawnChange).subject.beforePawn)).toEqual(["c7", "d4", "c6"]);
    expect(PRIMARY_EVIDENCE_MANIFEST.selectionPolicies.some(value => value.id === policy.id)).toBe(false);
  });
});
