// DISPOSABLE fifth fresh review instrument for the two held promotion projections.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const collectors = read("rfc/semantic-collectors.md");
const provider = read("rfc/provider-exchange-and-execution.md");
const mobility = read("rfc/exact-legal-mobility.md");
const semanticRuntime = read("packages/runtime/src/semantic-evidence.ts");
const pawnRuntime = read("packages/runtime/src/pawn-dynamics.ts");
const tablebaseRuntime = read("apps/server/src/tablebase.ts");
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

test("D2548: the outside-domain same-request comparison has no digest-producing authority", () => {
  const constructor = between(promotion, "declare function makePromotionRaceSyzygyRequest", "type PromotionRaceTablebaseSource");
  assert.match(constructor, /TypedProviderRequest<"syzygy\.position@1">/u);
  assert.doesNotMatch(constructor, /ProviderRequestDigest/u);
  assert.match(promotion, /requires its branded digest to equal the local-domain envelope/u);
  assert.match(provider, /function digestProviderRequest\(image: ProviderRequestDigestImage\): ProviderRequestDigest/u);
  assert.doesNotMatch(provider, /(?:type|interface|class) ProviderRequestDigestImage\b/u);
});

test("D2549: the published output ABI cannot preserve its claimed exact move and pawn values", () => {
  const value = between(promotion, "interface PromotionRaceTablebaseValue", "type PromotionRaceTablebaseEvidence");
  assert.match(value, /immediatePromotion: readonly CanonicalUci\[\]/u);
  assert.doesNotMatch([collectors, provider, mobility].join("\n"), /(?:type|interface|class) CanonicalUci\b/u);
  assert.match(value, /promotionFirst: "white" \| "black" \| "same_ply"/u);
  assert.match(pawnRuntime, /readonly promotionFirst: readonly PawnIdentity\[\]/u);
  assert.match(tablebaseRuntime, /readonly preciseDtz\?\s*:\s*number\s*\|\s*null/u);
  assert.match(value, /readonly preciseDtz: number \| null/u);
  assert.doesNotMatch(promotion, /preciseDtz\s*:\s*[^\n]*\?\?\s*null/u);
});

test("D2550: the sealed event payload omits geometry and source required by operand fidelity", () => {
  const value = between(promotion, "interface PromotionRaceTablebaseValue", "type PromotionRaceTablebaseEvidence");
  assert.doesNotMatch(value, /readonly geometry:/u);
  assert.doesNotMatch(value, /readonly source:/u);
  assert.match(collectors, /Operands are retained, not summarized/u);
  assert.match(semanticRuntime, /input\.evidence\.payload !== input\.operands/u);
  assert.match(semanticRuntime, /declaration\.requiredOperands\.every\(\(operand\) => keys\.includes\(operand\)\)/u);
  assert.match(promotion, /receipt retains `geometry`, the exact legal map and the selected whole source/u);
});

test("D2551: the position-only collector cannot construct the required semantic-event occurrence", () => {
  const request = between(promotion, "interface PromotionRaceTablebaseRequest", "interface PromotionRaceTablebaseDependencies");
  assert.doesNotMatch(request, /beforeFen|moveUci|afterFen|anchor|nodeId/u);
  assert.match(semanticRuntime, /export interface SemanticEventAnchor[\s\S]*?readonly beforeFen: string;[\s\S]*?readonly moveUci: string;[\s\S]*?readonly afterFen: string;/u);
  assert.match(semanticRuntime, /export function compileSemanticEvidenceEvent/u);
  assert.doesNotMatch(promotion, /promotionRaceTablebaseSemanticEvent|compileSemanticEvidenceEvent/u);
  assert.match(collectors, /events eligible\s+only for `research\.semantic_selection@1`/u);
});
