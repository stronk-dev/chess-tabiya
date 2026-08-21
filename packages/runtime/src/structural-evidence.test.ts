import { describe, expect, it } from "vitest";

import { EVIDENCE_CONTRACT_DECLARATIONS } from "./evidence-catalog.js";
import { compileEvidenceManifest, evidenceForConsumer } from "./evidence-contract.js";
import {
  declareStructuralPredicateEvidence,
  structuralEvidenceForAuthoring,
  type StructuralPredicateEvidencePayload,
} from "./structural-evidence.js";
import type { StructuralExpression } from "./structure.js";

const fen = "4k3/8/8/8/8/8/8/4K3 w - - 0 1";
const condition: StructuralExpression = {
  kind: "all",
  of: [
    { kind: "feature", feature: { kind: "open_file", file: "a" } },
    { kind: "feature", feature: { kind: "piece_count", color: "white", role: "rook", basis: "count", comparison: "equal", count: 0 } },
    { kind: "pieceOnSquare", square: "e1", piece: { color: "white", role: "king" } },
    { kind: "quantified", quantifier: "every", over: { squares: { files: { from: "a", to: "a" }, ranks: { from: 1, to: 1 } } }, feature: { kind: "piece", piece: null } },
    { kind: "not", of: { kind: "pieceOnSquare", square: "a1", piece: { color: "white", role: "rook" } } },
  ],
};

describe("declared structural predicate evidence", () => {
  it("keeps a composite authored AST distinct from its total and direct feature results", () => {
    const evidence = declareStructuralPredicateEvidence(fen, condition);
    expect(evidence.condition.projection.id).toBe("pack.authored.structural_condition");
    expect(evidence.result.projection.id).toBe("rules.structural.predicate.result");
    expect(evidence.result.payload).toMatchObject({ fen, condition, matched: true });
    expect(evidence.featureResults.map((item) => item.projection.id)).toEqual([
      "rules.structural.predicate.open_file",
      "rules.structural.predicate.piece_count",
    ]);
    expect(evidence.result.payload.trace.map((node) => [node.path, node.expression.kind, node.matched])).toEqual([
      ["$.of.0", "feature", true],
      ["$.of.1", "feature", true],
      ["$.of.2", "pieceOnSquare", true],
      ["$.of.3", "quantified", true],
      ["$.of.4.of", "pieceOnSquare", false],
      ["$.of.4", "not", true],
      ["$", "all", true],
    ]);
  });

  it("delivers the authored condition and computed result through the authoring consumer", () => {
    const evidence = declareStructuralPredicateEvidence(fen, condition);
    const manifest = compileEvidenceManifest(EVIDENCE_CONTRACT_DECLARATIONS);
    const view = evidenceForConsumer<StructuralPredicateEvidencePayload>(manifest, { id: "authoring.predicate", version: 1 }, [
      evidence.condition,
      evidence.result,
      ...evidence.featureResults,
    ]);
    expect(structuralEvidenceForAuthoring(view)).toHaveLength(4);
    if (false) {
      // @ts-expect-error A bare pre-F1 condition is not an admitted consumer view.
      structuralEvidenceForAuthoring(condition);
    }
  });

  it("retains the existing refusal to evaluate an unexpanded plan signature", () => {
    expect(() => declareStructuralPredicateEvidence(fen, { kind: "plan_signature", planClassId: "minority-attack" })).toThrow("must be expanded");
  });
});
