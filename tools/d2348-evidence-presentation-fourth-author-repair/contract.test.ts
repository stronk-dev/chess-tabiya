// DISPOSABLE positive author contract for D2348-D2354. It specifies the RFC repair, not UI code.
import assert from "node:assert/strict";
import { test } from "vitest";
import {
  NAMED_STRUCTURE_WITNESS_AUTHORITY,
  POST_P_PRESENTATION_ADAPTER_ROWS,
  PRESENTATION_SOURCE_REASON_DISPOSITIONS,
  PRESENTATION_SOURCE_REASON_LABELS,
  SOURCE_ATTRIBUTION_REGISTRY,
  SOURCE_ATTRIBUTION_REGISTRY_RESOURCE,
  SOURCE_ATTRIBUTION_REGISTRY_SEMANTIC_IMAGE,
  SOURCE_BOUND_CITATION_DERIVATION,
  assertRegisteredPresentationQuestion,
  constructExplorerCountOperands,
  issueRegisteredPresentationQuestion,
  parseCitationOperand,
  presentationWorkflowQuestionAuthorityFixture,
  sourceAttributionRegistryDigest,
} from "../d1862-presentation-adapter-plan/plan.js";

test("D2348: checkpoint P publishes one transformed 112-row adaptable authority", () => {
  assert.equal(POST_P_PRESENTATION_ADAPTER_ROWS.length, 112);
  assert.equal(new Set(POST_P_PRESENTATION_ADAPTER_ROWS.map((row) => row.key)).size, 112);
  assert.ok(POST_P_PRESENTATION_ADAPTER_ROWS.every((row) => row.disposition === "adapt"));
  assert.equal(POST_P_PRESENTATION_ADAPTER_ROWS.filter((row) => row.familyId === "story_rank_internal").length, 0);
  assert.equal(POST_P_PRESENTATION_ADAPTER_ROWS.filter((row) => row.projection === "derived.citation.attribution@1").length, 1);
});

test("D2349: citation operation, parser and adapter share one nested operand", () => {
  const value = {
    content: { kind: "authored_summary", text: "Measured.", binding: { projection: { id: "run.record.evidence_ref_resolution", version: 1 }, field: "text", evidenceDigest: `sha256:${"0".repeat(64)}` } },
    source: { source: { id: "live.stockfish.eval", version: 1 }, title: "Stockfish engine reading", locator: "deployment-artifact:stockfish", licence: { authority: "source-attribution-registry@1", value: "GPL-3.0-only" }, url: "https://stockfishchess.org/", revision: { authority: "deployment-receipt@1", value: `sha256:${"1".repeat(64)}` } },
  };
  assert.deepEqual(parseCitationOperand(value), value);
  assert.deepEqual(SOURCE_BOUND_CITATION_DERIVATION.outputFields, ["content", "source"]);
  const adapter = POST_P_PRESENTATION_ADAPTER_ROWS.find((row) => row.projection === SOURCE_BOUND_CITATION_DERIVATION.projection);
  assert.deepEqual(adapter?.retained, ["content", "source"]);
  assert.throws(() => parseCitationOperand({ content: "Measured.", binding: "ref-1", source: "Stockfish" }));
  assert.throws(() => parseCitationOperand({ content: value.source, source: value.content }));
});

test("D2350: source attribution is a digest-sealed resource with a literal resolver contract", () => {
  assert.equal(SOURCE_ATTRIBUTION_REGISTRY_RESOURCE.id, "source-attribution-registry");
  assert.equal(SOURCE_ATTRIBUTION_REGISTRY_RESOURCE.version, 1);
  const digest = sourceAttributionRegistryDigest(SOURCE_ATTRIBUTION_REGISTRY_SEMANTIC_IMAGE);
  assert.equal(SOURCE_ATTRIBUTION_REGISTRY_RESOURCE.digest, digest);
  assert.equal(SOURCE_BOUND_CITATION_DERIVATION.attributionRegistry.digest, digest);
  assert.ok(SOURCE_ATTRIBUTION_REGISTRY.every((row) => row.attribution.source.length > 0 && row.attribution.title.length > 0 && row.attribution.locator.length > 0));
  assert.ok(SOURCE_ATTRIBUTION_REGISTRY.every((row) => row.attribution.licence.kind === "literal" || row.attribution.licence.field === "spdx"));
});

test("D2351: every source reason has one explicit learner disposition", () => {
  assert.deepEqual(Object.keys(PRESENTATION_SOURCE_REASON_DISPOSITIONS).sort(), Object.keys(PRESENTATION_SOURCE_REASON_LABELS).sort());
  for (const reason of ["artifact_invalid", "artifact_missing", "budget_exhausted", "digest_mismatch", "mate_score_inconsistent", "missing_eval", "unequal_instrument"] as const) {
    assert.notEqual(PRESENTATION_SOURCE_REASON_DISPOSITIONS[reason].learnerReason, "no_witness");
  }
});

test("D2352: lifecycle question identity is registered and adapter-local", () => {
  const key = "inspector.corpus@1\0human.explorer.population@1";
  const decision = { eventHeadSeq: 1, cursor: { branchId: "b1", nodeId: "n1" }, disclosureBoundarySeq: null, digest: "d1" } as const;
  const authority = presentationWorkflowQuestionAuthorityFixture({ requestId: "r1", adapterKey: key, questionId: "question.explorer_population" }, decision);
  const question = issueRegisteredPresentationQuestion(authority);
  assert.equal(question.label, "Was a human-game population available here?");
  assert.equal(question.registry, "presentation-questions@1");
  assert.doesNotThrow(() => assertRegisteredPresentationQuestion(question, key, "question.explorer_population", "r1", decision));
  assert.throws(() => assertRegisteredPresentationQuestion({ ...question }, key, "question.explorer_population", "r1", decision));
  assert.throws(() => issueRegisteredPresentationQuestion({ request: { requestId: "r1", adapterKey: key, questionId: "question.story_title" }, decision }));
  assert.throws(() => issueRegisteredPresentationQuestion({ request: { requestId: "r1", adapterKey: "invented\0adapter", questionId: "question.explorer_population" }, decision }));
});

test("D2353: Explorer candidates construct exact nonzero denominator operands", () => {
  const input = { nodeId: "n1", committedMoveUci: "e2e4", result: { kind: "stats" as const, total: 100, moves: [{ san: "e4", uci: "e2e4", playedCount: 60, white: 30, draws: 10, black: 20 }] } };
  assert.deepEqual(constructExplorerCountOperands(input), [{ candidate: { grain: "candidate_move@1", san: "e4", uci: "e2e4" }, numerator: 60, denominator: 100, denominatorMeaning: "lichess_position_population@1", nodeId: "n1", committedMove: true }]);
  assert.throws(() => constructExplorerCountOperands({ ...input, result: { ...input.result, total: 0 } }));
  assert.throws(() => constructExplorerCountOperands({ ...input, result: { ...input.result, moves: [{ ...input.result.moves[0]!, playedCount: 61 }] } }));
});

test("D2354/D2440: one exported expression feeds atomic predicate-derived witness geometry", () => {
  assert.equal(NAMED_STRUCTURE_WITNESS_AUTHORITY.registry, "STRUCTURE_PREDICATES@1");
  assert.equal(NAMED_STRUCTURE_WITNESS_AUTHORITY.expression.symbol, "STRUCTURE_PREDICATES");
  assert.equal(NAMED_STRUCTURE_WITNESS_AUTHORITY.operation.symbol, "evaluateNamedStructureWithWitness");
  assert.equal("rows" in NAMED_STRUCTURE_WITNESS_AUTHORITY, false);
  assert.match(NAMED_STRUCTURE_WITNESS_AUTHORITY.implementationRule, /same registered expression in one call/u);
});
