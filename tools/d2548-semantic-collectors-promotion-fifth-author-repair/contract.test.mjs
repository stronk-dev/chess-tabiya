// DISPOSABLE fifth author-repair contract for D2548-D2551. Not production code.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const collectors = readFileSync("rfc/semantic-collectors.md", "utf8");
const provider = readFileSync("rfc/provider-exchange-and-execution.md", "utf8");
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

test("D2548 has one operation-keyed request digest and an exact result join", () => {
  assert.match(provider, /interface ProviderRequestDigestImage<K extends ProviderOperationId/u);
  assert.match(provider, /readonly operation: K;\s*readonly provider: ProviderOperationProviderMap\[K\];\s*readonly requestedIdentity: ProviderRequestedIdentityMap\[K\]/u);
  assert.match(provider, /normalizedRequestDigest<K extends ProviderOperationId>\(\s*request: TypedProviderRequest<K>/u);
  assert.match(provider, /Callers cannot provide a provider, requested identity or\s+digest image/u);
  assert.match(promotion, /PromotionRaceProviderInvocationReceipt/u);
  assert.match(promotion, /requestDigest = dependencies\.scheduler\.normalizedRequestDigest\(typedRequest\)/u);
  assert.match(promotion, /Every returned\s+arm must carry that exact digest/u);
  assert.match(promotion, /inequality throws `EvidenceInvariantError`/u);
});

test("D2549 publishes a literal exact output ABI", () => {
  const value = between(promotion, "interface PromotionRaceTablebaseValue", "type PromotionRaceTablebaseEvidence");
  assert.match(value, /readonly fen: CanonicalFullFen/u);
  assert.match(value, /readonly geometry: PromotionRaceGeometry/u);
  assert.match(value, /readonly source: PromotionRaceTablebaseSource/u);
  assert.match(value, /readonly immediatePromotion: readonly ExactLegalMove\[\]/u);
  assert.match(value, /readonly promotionFirst: readonly PawnIdentity\[\]/u);
  assert.doesNotMatch(value, /CanonicalUci|"white" \| "black" \| "same_ply"/u);
  assert.match(promotion, /sourcePosition\.preciseDtz \?\? null/u);
  assert.match(promotion, /one dropped underpromotion/u);
});

test("D2550 seals the public geometry and source operands, not only a private receipt", () => {
  const value = between(promotion, "interface PromotionRaceTablebaseValue", "type PromotionRaceTablebaseEvidence");
  const receipt = between(promotion, "interface PromotionRaceTablebaseDerivationReceipt", "type PromotionRaceTablebaseResult");
  for (const field of ["geometry", "source"]) {
    assert.match(value, new RegExp(`readonly ${field}:`, "u"));
    assert.match(receipt, new RegExp(`readonly ${field}:`, "u"));
  }
  assert.match(promotion, /output\.payload\.geometry === geometry\.payload/u);
  assert.match(promotion, /output\.payload\.source === source/u);
  assert.match(promotion, /payload\/receipt splice fail/u);
});

test("D2551 correctly declares a position reading and refuses a fabricated occurrence", () => {
  assert.match(promotion, /promotion_race_tablebase@1` — \*derived reading\*/u);
  assert.match(promotion, /deliberately \*\*not\*\* a semantic\s+event/u);
  assert.match(promotion, /absent from `SEMANTIC_EVENT_DECLARATIONS` and\s+`research\.semantic_selection@1`/u);
  assert.match(promotion, /future before\/after race transition must be a separately\s+declared derived event over two exact readings and a real run edge/u);
  assert.doesNotMatch(between(promotion, "interface PromotionRaceTablebaseRequest", "interface PromotionRaceTablebaseDependencies"), /beforeFen|moveUci|afterFen|anchor|nodeId/u);
  assert.match(collectors, /\| 14 \| `derived\.pawn\.promotion_race_tablebase@1` \| 3\.7 \| `derived\.pawn` \(2d\) \| reading \|/u);
});
