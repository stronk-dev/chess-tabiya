// DISPOSABLE positive author contract for D2179-D2183. RFC shape only; not production evidence.
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

test("D2179: geometry requires the exact pawn-contact factory receipt", () => {
  assert.match(promotion, /createRulesPawnReadingContactsV1Evidence\(fen\)/u);
  assert.match(promotion, /assertPawnContactsEvidence\(value\)/u);
  assert.match(promotion, /exact factory symbol, canonical FEN input digest and payload digest/u);
  assert.match(promotion, /generic declared-evidence\s+WeakSet is necessary but never sufficient/u);
  assert.match(promotion, /generic `declareEvidence`\s+wrapper carrying correct ids and false contacts/u);
});

test("D2180: recorded tablebase truth retains a validated same-record source authority", () => {
  assert.match(promotion, /createRecordedTablebaseResultV1Evidence\(recordEvidence\)/u);
  assert.match(promotion, /createSourcingLedgerTablebaseResultV1Evidence/u);
  assert.match(promotion, /assertRecordedTablebaseEvidence/u);
  assert.match(promotion, /Same-FEN changes to category, DTZ, precise DTZ or piece count/u);
  assert.match(promotion, /reading minted from no\/different ledger record fail/u);
});

test("D2181: an available outcome has one sealed receipt retaining every exact input", () => {
  const types = section("interface PromotionRaceTablebaseValue", "Recorded normalization");
  for (const field of ["geometry", "legalMoves", "source", "output"]) {
    assert.match(types, new RegExp(`readonly ${field}:`, "u"));
  }
  assert.match(types, /WeakSet<PromotionRaceTablebaseDerivationReceipt>/u);
  assert.match(types, /kind: "evidence";[\s\S]*item: PromotionRaceTablebaseEvidence;[\s\S]*derivation: PromotionRaceTablebaseDerivationReceipt/u);
  assert.match(promotion, /derivation\.output === item/u);
  assert.match(promotion, /Replacing the legal map or source after construction[\s\S]{0,100}fails/u);
});

test("D2182: no-race is a typed no-output state, never input failure", () => {
  const geometry = section("type PromotionRaceGeometryResult", "The evidence arm retains");
  assert.match(geometry, /reason: "no_opposing_passed_clear_paths";[\s\S]*input: PawnContactsEvidence/u);
  assert.match(geometry, /reason: "input_abstained";[\s\S]*missing: readonly \["contacts"\]/u);
  const outcome = section("type PromotionRaceTablebaseResult", "Recorded normalization");
  assert.match(outcome, /reason: "no_opposing_passed_clear_paths";[\s\S]*input: PawnContactsEvidence/u);
  assert.match(promotion, /valid position with no opposing passed clear-path/iu);
  assert.match(promotion, /mints no geometry\s+value/iu);
});

test("D2183: check remains one separately composed exact authority", () => {
  const value = section("interface PromotionRaceTablebaseValue", "type PromotionRaceTablebaseEvidence");
  assert.doesNotMatch(value, /promotionWithCheck/u);
  assert.match(promotion, /`promotionWithCheck` is deliberately absent/u);
  assert.match(promotion, /`rules\.tactic\.event\.check@1` exact factory remains the sole check authority/u);
  assert.match(promotion, /joins its exact before-FEN\/triggering-move identity to an immediate\s+promotion UCI/u);
});
