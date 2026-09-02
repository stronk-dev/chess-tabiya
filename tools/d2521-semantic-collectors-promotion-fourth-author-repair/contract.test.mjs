// DISPOSABLE fourth author-repair contract for D2521-D2523. Not production code.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const rfc = readFileSync("rfc/semantic-collectors.md", "utf8");
const provider = readFileSync("rfc/provider-exchange-and-execution.md", "utf8");
const promotion = rfc.slice(rfc.indexOf("#### 3.7 Promotion races"), rfc.indexOf("### §4 — Adjudication"));

test("D2521 publishes the canonical-FEN constructor and total recorded lookup algebra", () => {
  assert.match(promotion, /type CanonicalFullFen = string & \{ readonly \[canonicalFullFenBrand\]: true \}/u);
  assert.match(promotion, /declare function parseCanonicalFullFen\(value: string\): CanonicalFullFen/u);
  assert.match(promotion, /type RecordedTablebaseEvidenceLookupResult =\s*\| Readonly<\{ kind: "found"; evidence: RecordedTablebaseEvidence \}>\s*\| Readonly<\{ kind: "absent" \}>\s*\| Readonly<\{ kind: "failed"; reason: "storage_unavailable" \| "invalid_record" \}>/u);
  assert.match(promotion, /interface RecordedTablebaseEvidenceLookup \{\s*get\(fen: CanonicalFullFen\): RecordedTablebaseEvidenceLookupResult/u);
  assert.match(promotion, /calls the shipped `positionFromFen`, re-renders through `canonicalFen`, and\s+requires byte equality with the complete six-field input/u);
});

test("D2522 uses the exact scheduler and operation-keyed source factory with fixed request bytes", () => {
  assert.match(promotion, /readonly scheduler: ProviderExchangeScheduler/u);
  assert.match(promotion, /readonly sourceFactories: ProviderSourceFactories/u);
  assert.doesNotMatch(promotion, /readonly syzygyPosition:/u);
  assert.match(promotion, /declare const PROMOTION_RACE_SYZYGY_TIMEOUT_CAP_MS: 500/u);
  assert.match(promotion, /operation:"syzygy\.position@1",request:\{rules:"chess",\s*variant:"standard",fen,timeoutMs:Math\.min\(scope\.budgetMs,500\)\}/u);
  assert.match(promotion, /dependencies\.scheduler\.get\(typedRequest, request\.providerScope, request\.signal\)/u);
  assert.match(promotion, /assertProviderDelivery\("syzygy\.position@1", result\.delivery\)/u);
  assert.match(promotion, /dependencies\.sourceFactories\["syzygy\.position@1"\]\.make\(result\.delivery\)/u);
  assert.match(provider, /interface ProviderExchangeScheduler[\s\S]*?get<K extends ProviderOperationId>/u);
  assert.match(provider, /interface ProviderSourceFactory<[\s\S]*?make\(delivery:/u);
});

test("D2523 seals and asserts both completed geometry arms before the fast path", () => {
  assert.match(promotion, /interface PromotionRaceGeometryDerivationReceipt/u);
  assert.match(promotion, /WeakSet<PromotionRaceGeometryDerivationReceipt>/u);
  assert.match(promotion, /PROMOTION_RACE_GEOMETRY_COMPLETIONS: WeakSet</u);
  assert.match(promotion, /assertPromotionRaceGeometryCompletion/u);
  assert.match(promotion, /Every completed arm then crosses\s+`assertPromotionRaceGeometryCompletion` \*\*before\*\* inspecting its output discriminator/u);
  assert.match(promotion, /plain,\s+spread, cast, JSON-round-tripped or input\/output-spliced completion fails/u);

  const receipts = new WeakSet();
  const completions = new WeakSet();
  const input = Object.freeze({ fen: "canonical" });
  const output = Object.freeze({ kind: "no_evidence", reason: "no_opposing_passed_clear_paths", input });
  const receipt = Object.freeze({ input, output: Object.freeze({ kind: "no_evidence", reason: output.reason }) });
  receipts.add(receipt);
  const completed = Object.freeze({ kind: "completed", output, derivation: receipt });
  completions.add(completed);
  const assertCompletion = (value) => {
    if (!completions.has(value) || !receipts.has(value.derivation) || value.derivation.input !== value.output.input || value.derivation.output.kind !== value.output.kind) {
      throw new TypeError("invalid geometry completion");
    }
  };
  assert.doesNotThrow(() => assertCompletion(completed));
  assert.throws(() => assertCompletion({ ...completed }));
  assert.throws(() => assertCompletion({ ...completed, output: { ...output, input: Object.freeze({ fen: "other" }) } }));
});
