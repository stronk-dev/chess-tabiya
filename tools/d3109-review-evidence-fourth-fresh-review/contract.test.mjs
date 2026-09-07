// DISPOSABLE fourth fresh independent review harness — D3109-D3115.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const model = readFileSync("tools/d2685-review-evidence-third-author-repair/contract.test.mjs", "utf8");

function section(start, end) {
  const from = model.indexOf(start);
  const to = model.indexOf(end, from);
  assert.notEqual(from, -1, `missing start: ${start}`);
  assert.notEqual(to, -1, `missing end: ${end}`);
  return model.slice(from, to);
}

test("D3109 prefix authority accepts caller testimony instead of deriving the recorded path", () => {
  const prefix = section("function authorizeReviewRecordedPrefix", "function assertReviewRecordedPrefixReceipt");

  assert.match(prefix, /\.\.\.input/u);
  assert.doesNotMatch(prefix, /recordedSemanticPath|DrillRun|ImportedGameRecord/u);
  assert.doesNotMatch(model, /function recordedSemanticPath|from .*recorded-semantic-path/u);
});

test("D3110 the source plan is nine generic family placeholders, not the exact adapter registry", () => {
  const adapters = section("const REVIEW_SOURCE_ADAPTERS", "function canonical");

  assert.match(adapters, /REVIEW_SOURCE_FAMILIES\.map/u);
  assert.match(adapters, /id: `review\.\$\{family\}@1`/u);
  assert.doesNotMatch(model, /REVIEW_PACKET_SOURCE_PROJECTION_IDS/u);
  assert.doesNotMatch(adapters, /projection|operation|parser|input/u);
});

test("D3111 available source evidence is an arbitrary digest and compilation discards it", () => {
  const sourceResult = section("function createReviewSourceResult", "function foldReviewFamilyState");
  const compiler = section("function compileReviewEvidence", "class ReviewAttemptOutcomeStore");

  assert.match(sourceResult, /typeof state\.evidenceDigest === "string" && state\.evidenceDigest\.length > 0/u);
  assert.doesNotMatch(sourceResult, /DeclaredEvidence|assertDeclaredEvidence|payload|projection/u);
  assert.doesNotMatch(compiler, /evidenceDigest/u);
  assert.match(compiler, /state\.kind === "available"\s*\? \{ kind: "available", itemCount: 1 \}/u);
});

test("D3112 compiled nodes omit the evidence-bearing ReviewNodePacket fields", () => {
  const compiler = section("function compileReviewEvidence", "class ReviewAttemptOutcomeStore");

  assert.match(compiler, /copyAndFreeze\(\{ nodeId, families \}\)/u);
  for (const field of ["ply", "positionKey", "incomingMove", "items", "links"]) {
    assert.doesNotMatch(compiler, new RegExp(`\\b${field}\\b`, "u"));
  }
});

test("D3113 completion is discarded and the story receipt omits its normative fields", () => {
  const compiler = section("function compileReviewEvidence", "class ReviewAttemptOutcomeStore");
  const renderer = section("function renderReviewStoryReceipt", "function parseReviewStoryReceipt");

  assert.match(compiler, /\n  foldReviewCompletion\(families\);/u);
  assert.doesNotMatch(compiler, /= foldReviewCompletion\(families\)/u);
  for (const field of ["subject", "manifestDigest", "progress", "degradation", "families", "title", "rank"]) {
    assert.doesNotMatch(renderer, new RegExp(`\\b${field}:`, "u"));
  }
  assert.match(renderer, /subjectDigest: packet\.subject\.subjectDigest/u);
});

test("D3114 packet identity uses a private serializer that admits invalid canonical values", () => {
  const canonicalSource = section("function canonical", "const digest");
  const canonical = Function(`"use strict"; ${canonicalSource}; return canonical;`)();

  assert.equal(canonical({ value: Number.NaN }), "{\"value\":null}");
  assert.equal(canonical({ value: Number.NaN }), canonical({ value: null }));
  assert.equal(typeof canonical({ value: "\ud800" }), "string");
  assert.doesNotMatch(model, /canonicalizeJson|digestCanonicalJson/u);
});

test("D3115 the attempt store settles arbitrary outcomes and implements no retry lifecycle", () => {
  const store = section("class ReviewAttemptOutcomeStore", "const presentedAuthority");

  assert.match(store, /const settle = \(outcome\) =>/u);
  assert.doesNotMatch(store, /assertExactKeys\(outcome|retryable_failure|non_retryable_failure|succeeded_delivery_digest/u);
  assert.doesNotMatch(store, /maxAttemptsPerRequest|startedAttempts|release|cancel/u);
});
