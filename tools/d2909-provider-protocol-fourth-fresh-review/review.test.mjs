import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";

import { validateCatalogue } from "../d2488-shared-resource-bootstrap-third-author-repair/model.mjs";

const read = (path) => readFileSync(path, "utf8");
const rfc = read("rfc/provider-protocol-register.md");
const normative = rfc.slice(rfc.indexOf("## Summary"), rfc.indexOf("## Second fresh independent return"));
const catalogue = JSON.parse(read("planning/provider-protocol-register/catalogue-additions.v1.json"));

function canonical(value) {
  if (value === null || typeof value === "boolean" || typeof value === "number" || typeof value === "string") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
}

function digest(value, prefix = true) {
  const hex = createHash("sha256").update(canonical(value)).digest("hex");
  return prefix ? `sha256:${hex}` : hex;
}

function receipt(operations, digestDomains, { schema = 1, prefix = true } = {}) {
  return {
    schema,
    sourceRfc: "provider-exchange-and-execution.md",
    obligationsDigest: digest({ operations, digestDomains }, prefix),
    operations,
    digestDomains,
  };
}

function rowKey(value) {
  return canonical(value);
}

function setEqual(left, right) {
  const a = new Set(left.map(rowKey));
  const b = new Set(right.map(rowKey));
  return a.size === b.size && [...a].every((key) => b.has(key));
}

function validatesAsSpecified(receiptImage, candidate, stagedReceiptChanged = false) {
  assert.equal(stagedReceiptChanged, false);
  const rawDigest = receiptImage.obligationsDigest.replace(/^sha256:/u, "");
  assert.equal(rawDigest, digest({
    operations: receiptImage.operations,
    digestDomains: receiptImage.digestDomains,
  }, false));
  assert.equal(setEqual(receiptImage.operations, candidate.operations), true);
  assert.equal(setEqual(receiptImage.digestDomains, candidate.digestDomains), true);
  return true;
}

const operationA = Object.freeze({
  operation: "stockfish.legal_root_table@1",
  provider: "stockfish",
  endpoint: { kind: "uci_supervisor", engineId: "stockfish-analysis" },
  parserId: "parse.stockfish_legal_root_table@1",
  sourceProjection: "stockfish.legal_root_table@1",
  sourceFactoryId: "makeLiveStockfishLegalRootTableEvidence",
  cliName: "stockfish-legal-roots",
});
const operationB = Object.freeze({
  operation: "maia.policy_page@1",
  provider: "maia",
  endpoint: { kind: "uci_supervisor", engineId: "maia-5m" },
  parserId: "parse.maia_policy_page@1",
  sourceProjection: "maia.policy_page@1",
  sourceFactoryId: "makeHumanMaiaPolicyPageEvidence",
  cliName: "maia-policy-page",
});
const domainA = Object.freeze({ domain: "engine.binary.v1", constructorId: "digestEngineBinary" });
const domainB = Object.freeze({ domain: "provider.request.v1", constructorId: "digestProviderRequest" });

test("the provider descriptor remains a valid generic absent canonical-resource population", () => {
  const [descriptor] = validateCatalogue(catalogue).resources;
  assert.equal(descriptor.id, "provider-protocol");
  assert.equal(descriptor.introduction, "absent");
  assert.equal(descriptor.projection.adapter, "canonical_resource@1");
  assert.equal(descriptor.projection.rootSelector, "packages/runtime/src/provider-protocol.ts#export:PROVIDER_PROTOCOL_RESOURCE");
});

test("D2909 a prior receipt replacement passes the later staged-diff and self-digest checks", () => {
  const accepted = receipt([operationA], [domainA]);
  const replacedInEarlierCommit = receipt([operationB], [domainB]);
  assert.notEqual(accepted.obligationsDigest, replacedInEarlierCommit.obligationsDigest);
  assert.equal(validatesAsSpecified(replacedInEarlierCommit, {
    operations: [operationB],
    digestDomains: [domainB],
  }), true);
  assert.match(normative, /receipt to exist in committed HEAD and refuses any staged modification to it/u);
  assert.match(normative, /sourceRfc` is the literal\s+`provider-exchange-and-execution\.md`/u);
  assert.doesNotMatch(normative, /accepted(?:Receipt|Obligations)(?:Digest|Commit)|receiptRevision|acceptanceCommit/u);
});

test("D2910 set equality admits a permutation that changes canonical resource bytes", () => {
  const accepted = receipt([operationA, operationB], [domainA, domainB]);
  const permuted = {
    operations: [operationB, operationA],
    digestDomains: [domainB, domainA],
  };
  assert.equal(validatesAsSpecified(accepted, permuted), true);
  assert.notEqual(
    digest({ id: "provider-protocol", version: 1, payload: {
      operations: accepted.operations,
      digestDomains: accepted.digestDomains,
    } }),
    digest({ id: "provider-protocol", version: 1, payload: permuted }),
  );
  assert.match(normative, /set-equal by complete row identity/u);
  assert.doesNotMatch(normative, /operations.*ASCII-sort|digestDomains.*ASCII-sort|ordered equality/us);
});

test("D2911 two incompatible receipt wire images satisfy the underspecified digest sentence", () => {
  const numericPrefixed = receipt([operationA], [domainA], { schema: 1, prefix: true });
  const namedBare = receipt([operationA], [domainA], {
    schema: "tabiya.provider-obligations.v1",
    prefix: false,
  });
  assert.match(numericPrefixed.obligationsDigest, /^sha256:[0-9a-f]{64}$/u);
  assert.match(namedBare.obligationsDigest, /^[0-9a-f]{64}$/u);
  assert.notDeepEqual(numericPrefixed, namedBare);
  assert.match(normative, /\{schema, sourceRfc, obligationsDigest, operations, digestDomains\}/u);
  assert.doesNotMatch(normative, /schema` (?:is|equals|must be)|`schema`:/u);
  assert.doesNotMatch(normative, /obligationsDigest.*(?:prefix|lower-case hexadecimal|64|domain separator)/us);
});
