import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const adapters = read("packages/runtime/src/evidence-source-adapters.ts");
const rfc = read("rfc/semantic-collectors.md");
const provider = read("rfc/provider-exchange-and-execution.md");
const harness = read("tools/d1699-promotion-race-contract-harness/promotion-contract.test.ts");

test("D2141: the shared pawn-contact adapter is exact, while the promotion constructor remains unsealed", () => {
  const adapter = adapters.slice(adapters.indexOf("export function declarePawnContactsEvidence"), adapters.indexOf("export const declareCandidateMajorityEvidence"));
  assert.match(adapter, /pawnContactsReading\(payload\.fen\)/u);
  assert.match(adapter, /canonicalPayload\(payload\)\s*!==\s*canonicalPayload\(expected\)/u);
  assert.match(adapter, /must contain only/u);
  const repairedHelper = harness.slice(harness.indexOf("function repairedGeometry"), harness.indexOf("function repairedTablebaseJoin"));
  assert.doesNotMatch(repairedHelper, /assertDeclaredEvidence/u);
});

test("D2142: source is retained normatively but no discriminated output source type or mapping exists", () => {
  assert.match(rfc, /retains `geometry`, `category`, `dtz`, `preciseDtz`, `source`/u);
  assert.match(provider, /ProviderEvidenceDelivery<LiveSyzygyPosition, "syzygy\.position@1">/u);
  assert.match(adapters, /recorded\.tablebase\.result[\s\S]*?\["kind", "fen", "sourceId", "retrievedAt", "values"\]/u);
  assert.doesNotMatch(rfc, /(?:interface|type)\s+PromotionRaceTablebaseSource\b/u);
  assert.doesNotMatch(rfc, /(?:recorded|live)[\s_]*(?:source|receipt)[\s\S]{0,120}(?:=>|maps? to|normalize)/iu);
});

test("D2143: outside-domain is promised but its declared fact is absent from every outcome derivation member", () => {
  assert.match(rfc, /separate local\s+`rules\.endgame\.tablebase_domain@1`\s+outside-domain fact/u);
  assert.match(rfc, /abstention is `\["outside_tablebase_domain", "provider_unavailable", "input_abstained"\]`/u);
  const outcome = rfc.slice(rfc.indexOf("`derived.pawn.promotion_race_tablebase@1`"), rfc.indexOf("The geometry declaration may land"));
  const literalMembers = outcome.slice(outcome.indexOf("1. geometry"), outcome.indexOf("Geometry, the legal map"));
  assert.doesNotMatch(literalMembers, /`rules\.endgame\.tablebase_domain@1`/u);
  assert.equal((literalMembers.match(/geometry \+ `rules\.mobility\.reading\.legal_moves@1`/gu) ?? []).length, 2);
});
