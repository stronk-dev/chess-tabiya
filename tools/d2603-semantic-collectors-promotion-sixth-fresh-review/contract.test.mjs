// DISPOSABLE sixth fresh-review falsifier — D2603-D2607. Not production code.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const makefile = readFileSync("Makefile", "utf8");
const collectors = readFileSync("rfc/semantic-collectors.md", "utf8");
const valueAuthority = readFileSync("rfc/evidence-value-authority.md", "utf8");
const authorRuntime = readFileSync("tools/d2548-semantic-collectors-promotion-fifth-author-repair/contract.test.mjs", "utf8");
const authorTypes = readFileSync("tools/d2548-semantic-collectors-promotion-fifth-author-repair/protocol.typecheck.ts", "utf8");
const promotion = collectors.slice(
  collectors.indexOf("#### 3.7 Promotion races"),
  collectors.indexOf("### §4 — Adjudication"),
);

function between(text, start, end) {
  const from = text.indexOf(start);
  const to = text.indexOf(end, from + start.length);
  assert.notEqual(from, -1, `missing ${start}`);
  assert.notEqual(to, -1, `missing ${end}`);
  return text.slice(from, to);
}

test("D2603 maintained fifth target does not execute any retained author generation", () => {
  const recipe = makefile.match(/semantic-collectors-promotion-fifth-author-repair:\n((?:\t.*\n)+)/u)?.[1];
  assert.ok(recipe, "fifth author target recipe exists");
  assert.match(recipe, /d2548-semantic-collectors-promotion-fifth-author-repair/u);
  for (const retained of ["promotion-author-repair", "promotion-second-author-repair", "promotion-third-author-repair", "promotion-fourth-author-repair"]) {
    assert.doesNotMatch(recipe, new RegExp(retained, "u"));
  }
});

test("D2604 two differently named sole factories own one output", () => {
  assert.match(promotion, /`declarePromotionRaceTablebaseEvidence\(value\)` is the sole adapter/u);
  assert.match(promotion, /only by\s+`createDerivedPawnPromotionRaceTablebaseV1Evidence/u);
  assert.doesNotMatch(promotion, /declare function declarePromotionRaceTablebaseEvidence/u);
  assert.match(valueAuthority, /`createDerivedPawnPromotionRaceTablebaseV1Evidence`/u);
  assert.doesNotMatch(valueAuthority, /declarePromotionRaceTablebaseEvidence/u);
});

test("D2605 public operation result has no seal or assertion", () => {
  const result = between(promotion, "type PromotionRaceTablebaseResult", "declare function collectPromotionRaceTablebase");
  assert.match(result, /kind: "reading"/u);
  assert.match(result, /kind: "unavailable"/u);
  assert.doesNotMatch(promotion, /WeakSet<PromotionRaceTablebaseResult>/u);
  assert.doesNotMatch(promotion, /assertPromotionRaceTablebaseResult/u);
  assert.match(promotion, /The result assertion requires/u);
});

test("D2606 strict type model omits category and DTZ source authority", () => {
  const value = between(authorTypes, "interface ReadingValue", "async function correlate");
  const mapper = between(authorTypes, "function mapReading", "declare const scheduler");
  assert.doesNotMatch(value, /category|\bdtz\b/u);
  assert.doesNotMatch(mapper, /category|\bdtz\b/u);
  assert.match(between(promotion, "interface PromotionRaceTablebaseValue", "type PromotionRaceTablebaseEvidence"), /readonly category:[\s\S]*readonly dtz:/u);
  assert.doesNotMatch(authorRuntime, /readonly category:|readonly dtz:|source\.category|source\.dtz/u);
});

test("D2607 exact legal-map and participant joins are prose-only", () => {
  const mapper = between(authorTypes, "function mapReading", "declare const scheduler");
  assert.match(mapper, /legalMoves: readonly Move\[\]/u);
  assert.doesNotMatch(authorTypes, /ExactLegalMoveMap|assertExactLegalMovesEvidence|assertPromotionRaceGeometryEvidence/u);
  assert.doesNotMatch(mapper, /legalMoves\.fen|sort\(|Object\.freeze|canonical/u);
  assert.match(authorRuntime, /one dropped underpromotion/u);
  assert.doesNotMatch(authorRuntime, /mapReading\(|ExactLegalMoveMap|promotionFirst.*(?:drop|splice|rebuild)/u);
});
