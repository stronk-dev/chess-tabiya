// DISPOSABLE regression of the fourth fresh independent return. After author repair these arms
// prove the seven historical gaps stay fenced; they are not the required fifth fresh review.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "vitest";
import {
  NAMED_STRUCTURE_WITNESS_AUTHORITY,
  POST_P_PRESENTATION_ADAPTER_ROWS,
  PRESENTATION_SOURCE_REASON_DISPOSITIONS,
  PRESENTATION_SOURCE_REASON_LABELS,
  SOURCE_ATTRIBUTION_REGISTRY,
  SOURCE_ATTRIBUTION_REGISTRY_RESOURCE,
  constructExplorerCountOperands,
  parseCitationOperand,
  registeredPresentationQuestion,
} from "../d1862-presentation-adapter-plan/plan.js";

test("D2348 regression: post-P is the exact transformed authority", () => {
  assert.equal(POST_P_PRESENTATION_ADAPTER_ROWS.length, 112);
  assert.equal(new Set(POST_P_PRESENTATION_ADAPTER_ROWS.map((row) => row.key)).size, 112);
  assert.ok(POST_P_PRESENTATION_ADAPTER_ROWS.every((row) => row.disposition === "adapt"));
});

test("D2349 regression: flat and crossed citation operands are refused", () => {
  const valid = { content: { kind: "fact", text: "Measured.", binding: "ref" }, source: { source: "Stockfish", title: "Reading", locator: "artifact", licence: "GPL-3.0-only" } };
  assert.deepEqual(parseCitationOperand(valid), valid);
  assert.throws(() => parseCitationOperand({ content: "Measured.", binding: "ref", source: "Stockfish" }));
  assert.throws(() => parseCitationOperand({ content: valid.source, source: valid.content }));
});

test("D2350 regression: attribution resource version and digest bind literal rows", () => {
  assert.equal(SOURCE_ATTRIBUTION_REGISTRY_RESOURCE.version, 1);
  assert.equal(SOURCE_ATTRIBUTION_REGISTRY_RESOURCE.digest, `sha256:${createHash("sha256").update(JSON.stringify(SOURCE_ATTRIBUTION_REGISTRY)).digest("hex")}`);
  assert.ok(SOURCE_ATTRIBUTION_REGISTRY_RESOURCE.resolver.symbol.length > 0);
});

test("D2351 regression: source-reason mapping is total and has no generic no-witness collapse", () => {
  assert.deepEqual(Object.keys(PRESENTATION_SOURCE_REASON_DISPOSITIONS).sort(), Object.keys(PRESENTATION_SOURCE_REASON_LABELS).sort());
  assert.equal(PRESENTATION_SOURCE_REASON_DISPOSITIONS.digest_mismatch.learnerReason, "source_digest_mismatch");
  assert.equal(PRESENTATION_SOURCE_REASON_DISPOSITIONS.mate_score_inconsistent.absence, "failed");
});

test("D2352 regression: question identities are registered per adapter", () => {
  const key = "inspector.corpus@1\0human.explorer.population@1";
  assert.equal(registeredPresentationQuestion(key, "question.explorer_population").adapterKey, key);
  assert.throws(() => registeredPresentationQuestion(key, "question.story_title"));
});

test("D2353 regression: Explorer denominator operands are constructed and validated", () => {
  const base = { nodeId: "n", committedMoveSan: null, result: { kind: "stats" as const, total: 10, moves: [{ san: "e4", uci: "e2e4", playedCount: 4, white: 2, draws: 1, black: 1 }] } };
  assert.equal(constructExplorerCountOperands(base)[0]?.denominator, 10);
  assert.throws(() => constructExplorerCountOperands({ ...base, result: { ...base.result, total: 0 } }));
});

test("D2354 regression: every registered structure has nonempty atomic witness geometry", () => {
  assert.equal(NAMED_STRUCTURE_WITNESS_AUTHORITY.rows.length, 4);
  assert.ok(NAMED_STRUCTURE_WITNESS_AUTHORITY.rows.every((row) => row.witnessLeafIds.length > 0 && row.squares.length > 0));
  assert.match(NAMED_STRUCTURE_WITNESS_AUTHORITY.implementationRule, /same registered expression/u);
});
