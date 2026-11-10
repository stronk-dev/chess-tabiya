import { afterEach, describe, expect, it, vi } from "vitest";
import { STRUCTURAL_CONVENTION_REFS as REFS, type StructuralExpression } from "@chess-tabiya/schema/drill-pack";
import type { ShapeEntryDefinition } from "@chess-tabiya/schema/shape-entry";
import { declareEvidence, evidenceValueReceipt } from "../../../packages/runtime/src/evidence-contract.js";
import { captureAuthoredPredicatePopulation, readAuthoredPredicatePopulation } from "../../../packages/runtime/src/authored-predicate-population.js";
import { authoredStructuralDocument, selectAuthoredStructuralCondition } from "../../../packages/runtime/src/internal/authored-structural-source.js";
import { invokeEvidenceValueRoute } from "../../../packages/runtime/src/internal/evidence-value-routes.js";
import { readAuthoredPredicateReductionValue } from "../../../packages/runtime/src/internal/authored-predicate-reduction-authority.js";
import { assertEvidenceReductionConsumerManifest } from "../../../packages/runtime/src/internal/evidence-reduction-seal.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "../../../packages/runtime/src/evidence-catalog.js";
import * as valueRoutes from "../../../packages/runtime/src/internal/evidence-value-routes.js";
import { validateShapeEntry } from "./shape-validation.js";
import { createRun, evaluateObjectivePredicate } from "@chess-tabiya/runtime";
import { readAuthoredStructuralConditionSource } from "../../../packages/runtime/src/internal/authored-structural-source.js";
import { AuthoredStructuralSourceError } from "../../../packages/runtime/src/structural-evidence.js";

const fen = "8/8/8/8/8/4k3/8/4K3 b - - 0 1";
afterEach(() => vi.restoreAllMocks());
const opposition: StructuralExpression = { kind: "feature", feature: { kind: "king_opposition", color: "white", form: "direct", conventionRef: REFS.king_opposition } };
const piece = (square: "e1" | "e3"): StructuralExpression => ({ kind: "pieceOnSquare", square, piece: { color: square === "e1" ? "white" : "black", role: "king" } });
function source(expression: StructuralExpression) {
  const document: ShapeEntryDefinition = { id: "owned-visitor-fixture", version: "1.0.0", name: "Mechanical visitor fixture", phases: ["endgame"], trigger: expression,
    plans: (["white", "black"] as const).map(side => ({ id: side, side, label: "Mechanical", description: "No chess judgement", success: { note: "No chess judgement", signature: null } })),
    watch: ["Mechanical"], typicalMistakes: ["Mechanical"], provenance: { licence: "CC0-1.0", sources: ["Mechanical software fixture"], attribution: [{ title: "Mechanical", author: "Tests", licence: "CC0-1.0" }] } };
  const checked = validateShapeEntry(document);
  if (checked.document === undefined) throw new Error(JSON.stringify(checked.issues));
  return selectAuthoredStructuralCondition(authoredStructuralDocument(checked.document), "/trigger");
}
function evaluate(expression: StructuralExpression, policy: "predicate" | "witness" = "predicate", root = fen) {
  const condition = source(expression), position = invokeEvidenceValueRoute("rules.mobility.reading.legal_moves@1", { fen: root });
  const population = captureAuthoredPredicatePopulation(condition, position, policy);
  if (population.kind !== "available") throw new Error(population.reason);
  const value = invokeEvidenceValueRoute("derived.structural.predicate_result@2", { population: population.value });
  return { population: population.value, position, condition, value, observation: value.payload.observation, proof: readAuthoredPredicateReductionValue(value, population.value) };
}

describe("current source-owned authored predicate visitor and reduction", () => {
  it("actual objective evaluation consumes its captured source and refuses an alternative expression", () => {
    const condition = source(opposition), feature = readAuthoredStructuralConditionSource(condition).effectiveExpression;
    const run = createRun({ id: "authored-objective-source", session: { kind: "position", start: { fen: "8/8/8/8/8/4k3/P7/4K3 b - - 0 1", side: "white" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } }, sessionDigest: `sha256:${"1".repeat(64)}`, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1, createdAt: "2026-11-04T12:00:00.000Z" });
    expect(evaluateObjectivePredicate(run, { type: "fenPredicate", predicate: { type: "structuralFeature", feature, authoredSource: condition } })).toBe(true);
    expect(() => evaluateObjectivePredicate(run, { type: "fenPredicate", predicate: { type: "structuralFeature", feature: { kind: "not", of: feature }, authoredSource: condition } })).toThrow(AuthoredStructuralSourceError);
  });
  it("actually selects the new exact leaf and records only its genuine convention closure", () => {
    const result = evaluate(opposition);
    expect(result.observation.matched).toBe(true);
    expect(result.observation.trace.map(row => row.leaf?.projection).filter(Boolean)).toEqual([{ id: "rules.structural.predicate.king_opposition", version: 2 }]);
    expect(result.proof.reduction.operation).toEqual({ id: "authoring.structural_predicate", version: 1 });
    expect(result.proof.reduction.occurrences).toHaveLength(3);
    expect(result.proof.convention.refs).toContainEqual(REFS.king_opposition);
    expect(result.proof.convention.refs.some(ref => ref.id === "king-opposition-blocker-blind")).toBe(false);
  });
  it("authenticates a genuine noncanonical FEN invocation without confusing input and canonical payload bytes", () => {
    expect(evaluate(opposition, "predicate", fen.replace(" 0 1", "")).observation.fen).toBe(fen);
  });
  it("distinguishes explicit successor meaning from unchanged absent-ref meaning", () => {
    const blocked = "8/8/8/8/8/4k3/4P3/4K3 b - - 0 1";
    const legacy: StructuralExpression = { kind: "feature", feature: { kind: "king_opposition", color: "white", form: "direct" } };
    expect(evaluate(legacy, "predicate", blocked).observation.matched).toBe(true);
    expect(evaluate(opposition, "predicate", blocked).observation.matched).toBe(false);
  });
  it("retains authored and root inputs for no-feature expressions and acquires no skipped leaf", () => {
    const only = evaluate(piece("e1"));
    expect(only.observation.matched).toBe(true); expect(only.proof.reduction.occurrences).toHaveLength(2);
    const skipped = evaluate({ kind: "any", of: [piece("e1"), opposition] });
    expect(skipped.observation.trace.map(row => row.path)).toEqual(["/trigger/of/0", "/trigger"]);
    expect(skipped.proof.reduction.occurrences).toHaveLength(2);
    expect(skipped.proof.convention.refs).not.toContainEqual(REFS.king_opposition);
    const stopped = evaluate({ kind: "all", of: [{ kind: "not", of: piece("e1") }, opposition] });
    expect(stopped.observation.matched).toBe(false);
    expect(stopped.proof.reduction.occurrences).toHaveLength(2);
  });
  it("retains repeated visited occurrences at their separate paths", () => {
    const result = evaluate({ kind: "all", of: [opposition, opposition] });
    const data = readAuthoredPredicatePopulation(result.population);
    expect(result.observation.matched).toBe(true);
    expect(data.leaves.map(row => row.path)).toEqual(["/trigger/of/0", "/trigger/of/1"]);
    expect(result.proof.reduction.occurrences.map(row => row.item)).toEqual([0, 1, 2, 3]);
    expect(data.leaves[0]!.value).not.toBe(data.leaves[1]!.value);
  });
  it("preserves all-matching-any witness squares while predicate policy short-circuits", () => {
    const expression: StructuralExpression = { kind: "any", of: [piece("e1"), piece("e3")] };
    const predicate = evaluate(expression), witness = evaluate(expression, "witness");
    expect(predicate.observation.squares).toEqual(["e1"]);
    expect(witness.observation.squares).toEqual(["e1", "e3"]);
    expect(predicate.observation.trace).toHaveLength(2); expect(witness.observation.trace).toHaveLength(3);
    expect(witness.observation.policy).toBe("witness");
  });
  it("retains selected refs in mirror and ordered quantifier expansion without invented witnesses", () => {
    const quantified: StructuralExpression = { kind: "mirrored", axis: "both", of: { kind: "quantified", quantifier: "every", over: { files: { from: "a", to: "c" } }, feature: { kind: "backward_pawn", color: "white", conventionRef: REFS.backward_pawn } } };
    const predicate = evaluate(quantified), witness = evaluate(quantified, "witness");
    expect(readAuthoredPredicatePopulation(predicate.population).leaves).toHaveLength(1);
    const leaves = readAuthoredPredicatePopulation(witness.population).leaves;
    expect(leaves.map(row => row.value.payload.feature)).toEqual(["f", "g", "h"].map(file => ({ kind: "backward_pawn", color: "black", file, conventionRef: REFS.backward_pawn })));
    expect(leaves.every(row => row.value.projection.version === 2)).toBe(true);
    expect(witness.observation.squares).toEqual([]);
  });
  it("does not acquire a skipped failing dependency; a visited source fault produces unavailable, never false", () => {
    // Inject a detector failure at the real route boundary; no production evaluator hook is added.
    const skipped = source({ kind: "any", of: [piece("e1"), opposition] }), visited = source(opposition);
    const position = invokeEvidenceValueRoute("rules.mobility.reading.legal_moves@1", { fen });
    const invoke = valueRoutes.invokeEvidenceValueRoute;
    const calls = vi.spyOn(valueRoutes, "invokeEvidenceValueRoute").mockImplementation(((route: string, input: never) => route === "rules.structural.reading.king_opposition@3"
      ? { kind: "unavailable", reason: "source_dependency_unavailable" } : invoke(route as never, input)) as typeof invoke);
    const first = captureAuthoredPredicatePopulation(skipped, position);
    expect(first.kind).toBe("available");
    expect(calls.mock.calls.some(row => row[0] === "rules.structural.reading.king_opposition@3")).toBe(false);
    expect(captureAuthoredPredicatePopulation(visited, position)).toEqual({ kind: "unavailable", reason: "source_dependency_unavailable" });
    expect(calls.mock.calls.some(row => row[0] === "rules.structural.predicate.king_opposition@2")).toBe(false);
  });
  it("retains the exact named definition and positive-square witness with expanded actual leaf ancestry", () => {
    const expression: StructuralExpression = { kind: "feature", feature: { kind: "named_structure", id: "iqp-white" } };
    const result = evaluate(expression, "witness", "7k/8/8/8/3P4/8/8/7K w - - 0 1");
    expect(result.observation.matched).toBe(true); expect(result.observation.squares).toEqual(["d4"]);
    expect(readAuthoredPredicatePopulation(result.population).leaves.map(row => row.value.projection.id)).toEqual([
      "rules.structural.predicate.named_structure", "rules.structural.predicate.isolated_pawn", "rules.structural.predicate.half_open_file",
    ]);
    expect(result.observation.trace.some(row => row.path === "/trigger/named/iqp-white/of/0" && row.expression.kind === "pieceOnSquare")).toBe(true);
  });
  it("refuses wrong, removed, extra and reordered eligible elements at actual consumer admission", () => {
    const result = evaluate(opposition), declaration = PRIMARY_EVIDENCE_MANIFEST.projections.find(row => row.id === "derived.structural.predicate_result" && row.version === 2)!;
    const original = declaration.derivation!.reduction!;
    for (const reduction of [
      { ...original, operation: { id: "story.rank", version: 1 } },
      { ...original, elements: original.elements.slice(1) },
      { ...original, elements: [...original.elements, original.elements[0]!] },
      { ...original, elements: [...original.elements].reverse() },
    ]) {
      const manifest = { ...PRIMARY_EVIDENCE_MANIFEST, projections: PRIMARY_EVIDENCE_MANIFEST.projections.map(row => row === declaration ? { ...row, derivation: { reduction } } : row) };
      expect(() => assertEvidenceReductionConsumerManifest(result.value, manifest)).toThrow();
    }
  });
  it("rejects copied owners, re-sealed root values, cross-source results and caller verdicts", () => {
    const result = evaluate(opposition), other = evaluate(opposition), receipt = evidenceValueReceipt(result.position);
    const copied = declareEvidence(result.position.producer, result.position.projection, result.position.payload, { factory: receipt.factory, inputDigest: receipt.inputDigest, sourceDigests: receipt.sourceDigests, ...(receipt.convention === undefined ? {} : { convention: receipt.convention }) });
    expect(() => captureAuthoredPredicatePopulation(result.condition, copied)).toThrow(/original/);
    expect(() => invokeEvidenceValueRoute("derived.structural.predicate_result@2", { population: {} as never })).toThrow(/authority/);
    expect(() => invokeEvidenceValueRoute("derived.structural.predicate_result@2", { population: result.population, matched: false } as never)).toThrow(/authority/);
    expect(() => readAuthoredPredicateReductionValue(result.value, other.population)).toThrow(/original/);
    expect(() => declareEvidence(result.value.producer, result.value.projection, result.value.payload, { factory: evidenceValueReceipt(result.value).factory, inputDigest: "0".repeat(64), sourceDigests: [] })).toThrow(/construction authority/);
  });
});
