// DISPOSABLE second fresh independent review — D2179-D2183. It reproduces the held promotion
// amendment return and is not a production collector.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const rfc = read("rfc/semantic-collectors.md");
const contract = read("packages/runtime/src/evidence-contract.ts");
const adapters = read("packages/runtime/src/evidence-source-adapters.ts");
const legalMoves = read("packages/runtime/src/legal-moves.ts");
const promotion = rfc.slice(rfc.indexOf("#### 3.7 Promotion races"), rfc.indexOf("### §4 — Adjudication"));

function section(text, start, end) {
  const from = text.indexOf(start);
  const to = text.indexOf(end, from + start.length);
  assert.notEqual(from, -1, `missing section ${start}`);
  assert.notEqual(to, -1, `missing section ${end}`);
  return text.slice(from, to);
}

test("D2179: the declared-evidence seal does not prove which exact adapter ran", () => {
  const declaration = section(contract, "export function declareEvidence", "export function assertDeclaredEvidence");
  const assertion = section(contract, "export function assertDeclaredEvidence", "export function evidenceForConsumer");
  assert.match(declaration, /DECLARED_VALUES\.add\(value\)/u);
  assert.match(assertion, /DECLARED_VALUES\.has\(value\)/u);
  assert.doesNotMatch(assertion, /adapterId|ADAPTER_VALUES|exactAdapter/u);
  assert.match(promotion, /assertDeclaredEvidence\(contacts\)/u);
  assert.match(rfc, /does not call `pawnContactsReading`/u);
});

test("D2180: recorded tablebase values still pass through a generic key-only adapter", () => {
  assert.match(adapters, /declareRecordedTablebaseEvidence = <T extends object>\(payload: T\) => exactObject\("recorded\.tablebase", "recorded\.tablebase\.result", payload, \["kind", "fen", "sourceId", "retrievedAt", "values"\]\)/u);
  const exactObject = section(adapters, "function exactObject", "function canonicalPayload");
  assert.doesNotMatch(exactObject, /tablebase|category|dtz|pieceCount|positionFromFen/u);
  assert.match(promotion, /projects category\/DTZ only\s+from `evidence\.payload\.values`/u);
});

test("D2181: the available result drops the legal-map evidence that grounds emitted operands", () => {
  const available = section(promotion, "kind: \"available\";", "reason: \"outside_tablebase_domain\"");
  assert.match(available, /geometry: DeclaredEvidence<PromotionRaceGeometry>/u);
  assert.match(available, /source: PromotionRaceTablebaseSource/u);
  assert.match(available, /immediatePromotion:/u);
  assert.match(available, /promotionWithCheck:/u);
  assert.doesNotMatch(available, /legalMoves|legal_moves|ExactLegalMoveMap/u);
});

test("D2182: valid no-race geometry is mislabeled as input abstention", () => {
  assert.match(promotion, /no_opposing_passed_clear_paths/u);
  assert.match(promotion, /Missing\/unavailable geometry or an\s+absent exact legal map returns `input_abstained`/u);
  const result = section(promotion, "type PromotionRaceTablebaseResult", "```\n\nRecorded normalization");
  assert.doesNotMatch(result, /no_opposing_passed_clear_paths|no_race/u);
});

test("D2183: promotionWithCheck has no declared check authority", () => {
  const alternatives = section(promotion, "1. geometry +", "Geometry, the legal map");
  assert.doesNotMatch(alternatives, /rules\.tactic\.event\.check/u);
  const moveShape = section(legalMoves, "export interface ExactLegalMove", "export interface ExactLegalMoveMap");
  assert.doesNotMatch(moveShape, /check/u);
  assert.match(promotion, /`promotionWithCheck` cannot be sourced from\s+geometry or tablebase category/u);
});
