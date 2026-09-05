import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  resolveSelectorPopulation,
  selectorsFor,
  validateCatalogue,
} from "../d2488-shared-resource-bootstrap-third-author-repair/model.mjs";

const read = (path) => readFileSync(path, "utf8");
const rfc = read("rfc/provider-protocol-register.md");
const prose = rfc.replace(/\s+/gu, " ");
const bootstrap = read("rfc/shared-resource-register-bootstrap.md").replace(/\s+/gu, " ");
const product = read("rfc/provider-exchange-and-execution.md");
const descriptor = validateCatalogue(JSON.parse(
  read("planning/provider-protocol-register/catalogue-additions.v1.json"),
)).resources[0];

test("D2874 the one-selector resource cannot produce the promised partial state", () => {
  const selectors = selectorsFor(descriptor.projection);
  assert.deepEqual(selectors, [
    "packages/runtime/src/provider-protocol.ts#export:PROVIDER_PROTOCOL_RESOURCE",
  ]);
  const malformed = resolveSelectorPopulation(
    descriptor,
    selectors,
    { ok: false, diagnostics: ["partial canonical resource"] },
  );
  assert.equal(malformed.state, "invalid");
  assert.match(prose, /malformed\/partial `PROVIDER_PROTOCOL_RESOURCE` is partial and fails/u);
  assert.match(prose, /version-only\/payload-only\/digest-only partial resource/u);
});

test("D2875 the accepted obligation preimage has no lawful reader", () => {
  assert.match(prose, /parse the exact accepted preimage block from the prior product RFC/u);
  assert.match(prose, /may not read or alter Git state/u);
  assert.match(prose, /No provider-specific branch or validation-hook protocol exists/u);
  assert.doesNotMatch(bootstrap, /tabiya-provider-obligations/u);
  assert.doesNotMatch(JSON.stringify(descriptor), /obligation|hook|preimage/u);
});

test("D2876 process closeout claims two product-only repairs before their authority exists", () => {
  const criteria = prose.slice(prose.indexOf("## Acceptance criteria"), prose.indexOf("## Second fresh independent return"));
  assert.match(criteria, /\[\[D2189\]\] and \[\[D2455\]\]–\[\[D2459\]\] close only after executable process criteria pass/u);
  assert.match(prose, /The future product RFC will create a single atomic/u);
  assert.match(prose, /The product RFC supplies the exact mapped declaration/u);
  assert.match(prose, /D4 \| Product RFC publishes accepted obligations/u);
});

test("D2877 the canonical endpoint field has no mapping from the structured endpoint authority", () => {
  const normative = prose.slice(prose.indexOf("## Summary"), prose.indexOf("## Discharges"));
  assert.match(rfc, /readonly endpoint: string;/u);
  assert.match(product, /type ProviderEndpointMap = \{[\s\S]*?kind: "uci_supervisor"; engineId:/u);
  assert.match(product, /kind: "https"; origin: "https:\/\/tablebase\.lichess\.org"; path: "\/standard"/u);
  assert.doesNotMatch(product, /ProviderEndpointId|providerEndpointId|endpointId:/u);
  assert.doesNotMatch(normative, /endpoint (?:encoding|identifier|canonicalization)/u);
});
