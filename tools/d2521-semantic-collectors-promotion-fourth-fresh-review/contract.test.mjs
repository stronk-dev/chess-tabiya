// DISPOSABLE fourth fresh review instrument for D2521-D2523. Not production code.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const collectors = read("rfc/semantic-collectors.md");
const provider = read("rfc/provider-exchange-and-execution.md");
const valueAuthority = read("rfc/evidence-value-authority.md");
const recordedPath = read("rfc/recorded-semantic-path.md");
const promotion = collectors.slice(collectors.indexOf("#### 3.7 Promotion races"), collectors.indexOf("### §4 — Adjudication"));

test("D2521 request ABI uses two types absent from its declared authorities", () => {
  assert.match(promotion, /fen: CanonicalFullFen/u);
  assert.match(promotion, /recordedLookup: RecordedTablebaseEvidenceLookup/u);
  const authorities = [collectors, provider, valueAuthority, recordedPath];
  for (const symbol of ["CanonicalFullFen", "RecordedTablebaseEvidenceLookup"]) {
    const definition = new RegExp(`(?:type|interface|class)\\s+${symbol}\\b`, "u");
    assert.equal(authorities.some((text) => definition.test(text)), false, `${symbol} unexpectedly has a definition`);
  }
});

test("D2522 injected Syzygy callable matches neither provider operation and fixes no request bytes", () => {
  assert.match(promotion, /readonly syzygyPosition:\s*\(\s*request: SyzygyPositionRequest,\s*scope: ProviderRequestScope,\s*signal: AbortSignal/u);
  assert.match(provider, /interface ProviderExchangeScheduler \{[\s\S]*?get<K extends ProviderOperationId>\(\s*request: TypedProviderRequest<K>,\s*scope: ProviderRequestScope,\s*signal: AbortSignal/u);
  assert.match(provider, /function providerTraversalSyzygyPosition\([\s\S]*?capability: ProviderOperatorCapability,[\s\S]*?request: SyzygyPositionRequest/u);
  assert.doesNotMatch(promotion, /ProviderExchangeScheduler\.get|ProviderSourceFactories\[|providerTraversalSyzygyPosition/u);
  assert.doesNotMatch(promotion, /timeoutMs\s*[:=]|rules:\s*"chess"|variant:\s*"standard"/u);
  assert.match(promotion, /requires its branded digest to equal the local-domain envelope/u);
});

test("D2523 unsealed completed geometry can take the zero-call trusted fast path", () => {
  assert.match(promotion, /type PromotionRaceGeometryResult\s*=/u);
  assert.doesNotMatch(promotion, /assertPromotionRaceGeometryResult/u);
  assert.doesNotMatch(promotion, /WeakSet<PromotionRaceGeometryResult>|PromotionRaceGeometryDerivationReceipt/u);
  assert.match(promotion, /completed `no_opposing_passed_clear_paths` returns the exact completed\/no-output arm and\s+calls neither/u);
  assert.match(promotion, /malformed or forged completed geometry fails its specialized\s+assertion/u);
});
