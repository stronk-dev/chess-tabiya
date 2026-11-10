import { describe, expect, it } from "vitest";
import { STRUCTURAL_CONVENTION_REFS } from "@chess-tabiya/schema/drill-pack";
import { declareEvidence, evidenceValueReceipt } from "./evidence-contract.js";
import { evaluateStructuralExpressionWithWitness, matchesStructuralExpression, mirrorExpression, type StructuralExpression } from "./structure.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";

const fen = "7k/8/8/8/8/8/8/K7 w - - 0 1";
const selected: StructuralExpression = { kind: "feature", feature: { kind: "outpost", color: "white", square: "e5", conventionRef: STRUCTURAL_CONVENTION_REFS.outpost } };
const ordinary: StructuralExpression = { kind: "pieceOnSquare", square: "a1", piece: { color: "white", role: "king" } };

describe("historical predicates cannot mint a successor convention", () => {
  it("refuses explicit refs even in unvisited old all/any branches before computing a result", () => {
    for (const expression of [selected, { kind: "any", of: [ordinary, selected] }, { kind: "all", of: [{ kind: "not", of: ordinary }, selected] }, { kind: "mirrored", axis: "both", of: selected }] as StructuralExpression[]) {
      expect(() => matchesStructuralExpression(fen, expression)).toThrow(/current sealed/);
      expect(() => evaluateStructuralExpressionWithWitness(fen, expression)).toThrow(/current sealed/);
      expect(() => invokeEvidenceValueRoute("authored.structural_condition.input@1", { source: "shape", documentId: "legacy-refusal", pointer: "/trigger", expression: expression as never })).toThrow(/current sealed/);
    }
  });

  it("refuses a wrong-kind ref on the witness named-structure fast path", () => {
    const expression = { kind: "feature", feature: { kind: "named_structure", id: "iqp-white", conventionRef: STRUCTURAL_CONVENTION_REFS.outpost } } as unknown as StructuralExpression;
    expect(() => evaluateStructuralExpressionWithWitness(fen, expression)).toThrow(/current sealed/);
  });

  it("rejects a new ref through a generic-seal forged old condition at the result1 boundary", () => {
    const original = invokeEvidenceValueRoute("authored.structural_condition.input@1", { source: "shape", documentId: "legacy-refusal", pointer: "/trigger", expression: ordinary as never });
    const r = evidenceValueReceipt(original);
    const forged = declareEvidence(original.producer, original.projection, { ...original.payload, expression: selected }, { factory: r.factory, inputDigest: r.inputDigest, sourceDigests: r.sourceDigests, ...(r.convention === undefined ? {} : { convention: r.convention }) });
    expect(() => invokeEvidenceValueRoute("derived.structural.predicate_result@1", { condition: forged as never, fen })).toThrow(/current sealed/);
    expect(invokeEvidenceValueRoute("derived.structural.predicate_result@1", { condition: original as never, fen }).payload.matched).toBe(true);
  });

  it("preserves refs while mirroring/quantifying rather than dropping into old arithmetic", () => {
    const quantified: StructuralExpression = { kind: "quantified", quantifier: "some", over: { files: { from: "a", to: "c" } }, feature: { kind: "backward_pawn", color: "white", conventionRef: STRUCTURAL_CONVENTION_REFS.backward_pawn } };
    const mirrored = mirrorExpression(quantified, "both");
    expect(mirrored).toMatchObject({ kind: "quantified", feature: { kind: "backward_pawn", color: "black", conventionRef: STRUCTURAL_CONVENTION_REFS.backward_pawn } });
    expect(() => matchesStructuralExpression(fen, mirrored)).toThrow(/current sealed/);
  });
});
