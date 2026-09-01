// DISPOSABLE positive author contract for D2469-D2472. RFC shape only; not production evidence.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const rfc = readFileSync("rfc/semantic-collectors.md", "utf8");
const promotion = rfc.slice(rfc.indexOf("#### 3.7 Promotion races"), rfc.indexOf("### §4 — Adjudication"));

function section(start, end) {
  const from = promotion.indexOf(start);
  const to = promotion.indexOf(end, from + start.length);
  assert.notEqual(from, -1, `missing ${start}`);
  assert.notEqual(to, -1, `missing ${end}`);
  return promotion.slice(from, to);
}

test("D2469: domain and provider resolution precede success-only legal moves", () => {
  const request = section("interface PromotionRaceTablebaseRequest", "type PromotionRaceTablebaseSource");
  assert.doesNotMatch(request, /readonly legalMoves:/u);
  assert.match(request, /readonly resolveLegalMoves:/u);
  assert.match(promotion, /scheduler preflight occurs\s+before the success-only legal-map resolver/u);
  assert.match(promotion, /Neither outside-domain nor provider-failure resolution calls\s+`resolveLegalMoves`/u);
});

test("D2470: one closed request and sealed recorded-first resolution own source selection", () => {
  assert.match(promotion, /interface PromotionRaceTablebaseRequest/u);
  assert.match(promotion, /interface PromotionRaceTablebaseDependencies/u);
  assert.match(promotion, /declare function collectPromotionRaceTablebase\([\s\S]*request: PromotionRaceTablebaseRequest,[\s\S]*dependencies: PromotionRaceTablebaseDependencies/u);
  assert.match(promotion, /PROMOTION_RACE_RECORDED_RESOLUTIONS: WeakSet/u);
  assert.match(promotion, /resolvePromotionRaceRecordedSource/u);
  assert.match(promotion, /callers cannot select recorded versus live/u);
  assert.match(promotion, /Only sealed `absent` permits[\s\S]*shared provider dependency/u);
});

test("D2471: invalid authority fails and cannot become abstention or fallback", () => {
  assert.match(promotion, /assertion[\s\S]{0,120}throws `EvidenceInvariantError`/u);
  assert.match(promotion, /wrong-FEN or value-mutated recorded resolution throws and \*\*never falls back live\*\*/u);
  assert.match(promotion, /typed unavailable arm returns `input_abstained`[\s\S]*invalid evidence throws/u);
  assert.doesNotMatch(promotion, /missing\/invalid\/unavailable upstream evidence/u);
});

test("D2472: completed no-witness bypasses source and legal-map operations", () => {
  const geometry = section("type PromotionRaceGeometryResult", "The evidence arm retains");
  assert.match(geometry, /kind: "completed";[\s\S]*kind: "no_evidence";[\s\S]*reason: "no_opposing_passed_clear_paths"/u);
  assert.doesNotMatch(geometry, /kind: "unavailable";[\s\S]{0,100}reason: "no_opposing_passed_clear_paths"/u);
  const result = section("type PromotionRaceTablebaseResult", "Recorded normalization");
  assert.match(result, /kind: "completed";[\s\S]*kind: "no_evidence";[\s\S]*reason: "no_opposing_passed_clear_paths"/u);
  assert.match(promotion, /calls neither `recordedLookup`, `resolveLegalMoves` nor `syzygyPosition`/u);
});
