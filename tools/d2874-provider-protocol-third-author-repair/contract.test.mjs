import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import ts from "typescript";

const read = (path) => readFileSync(path, "utf8");
const rfc = read("rfc/provider-protocol-register.md");
const product = read("rfc/provider-exchange-and-execution.md");
const historicalReview = read("tools/d2874-provider-protocol-third-fresh-review/review.test.mjs");
const prose = rfc.replace(/\s+/gu, " ");
const normative = prose.slice(prose.indexOf("## Summary"), prose.indexOf("## Second fresh independent return"));
const criteria = normative.slice(normative.indexOf("## Acceptance criteria"));
const repair = prose.slice(prose.indexOf("## Third author repair"), prose.indexOf("## Open questions"));

test("D2874 one-selector malformed roots use the reachable invalid state", () => {
  assert.match(historicalReview, /`3597176a:\$\{path\}`/u);
  assert.match(normative, /malformed `PROVIDER_PROTOCOL_RESOURCE` is `invalid` and fails/u);
  assert.match(normative, /version-only\/payload-only\/digest-only malformed resource, each `invalid`/u);
  assert.doesNotMatch(normative, /malformed\/partial|partial resource|is partial/u);
});

test("D2875 a committed canonical acceptance receipt is the explicit product-validator preimage", () => {
  assert.match(normative, /planning\/provider-protocol-register\/accepted-obligations\.v1\.json/u);
  assert.match(normative, /\{schema, sourceRfc, obligationsDigest, operations, digestDomains\}/u);
  assert.match(normative, /Acceptance and implementation are separate commits/u);
  assert.match(normative, /refuses any staged modification to it while provider product bytes change/u);
  assert.match(normative, /validator reads neither Git nor RFC prose/u);
  assert.match(normative, /neither copied into a release image nor imported by runtime code/u);
});

test("D2876 process closeout leaves the two product-only defects open through D4", () => {
  assert.match(criteria, /\[\[D2189\]\], \[\[D2455\]\], \[\[D2458\]\] and \[\[D2459\]\] close only after executable process criteria pass/u);
  assert.match(criteria, /Product-only \[\[D2456\]\] and \[\[D2457\]\] remain open through D4/u);
  assert.match(repair, /product-only \[\[D2456\]\]\/\[\[D2457\]\] remain open through D4/u);
});

test("D2877 operation rows use the exact structured UCI-or-HTTPS endpoint value", () => {
  const endpointStart = rfc.indexOf("type ProviderProtocolEndpointIdentity =");
  const operationStart = rfc.indexOf("interface ProviderProtocolOperationIdentity", endpointStart);
  const operationEnd = rfc.indexOf("\n}\n```", operationStart);
  assert.notEqual(endpointStart, -1);
  assert.notEqual(operationStart, -1);
  assert.notEqual(operationEnd, -1);
  const endpoint = rfc.slice(endpointStart, operationStart).trim();
  const operation = rfc.slice(operationStart, operationEnd + 2).trim();
  const compiled = ts.transpileModule(`${endpoint}\n${operation}`, {
    compilerOptions: { strict: true, target: ts.ScriptTarget.ES2022 },
    reportDiagnostics: true,
  });
  assert.deepEqual((compiled.diagnostics ?? []).map((item) => item.code), []);
  for (const literal of [
    'kind: "uci_supervisor"',
    'engineId: "stockfish-analysis" | "maia-5m"',
    'kind: "https"',
    'origin: "https://tablebase.lichess.org" | "https://explorer.lichess.ovh"',
    'path: "/standard" | "/lichess"',
  ]) assert.match(endpoint, new RegExp(literal.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"), "u"));
  assert.match(operation, /readonly endpoint: ProviderProtocolEndpointIdentity;/u);
  assert.match(product, /type ProviderEndpointMap = \{/u);
  assert.match(repair, /canonical JSON row equality is lossless/u);
});
