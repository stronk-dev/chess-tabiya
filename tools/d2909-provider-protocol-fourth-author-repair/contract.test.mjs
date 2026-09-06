import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import {
  issueReceipt,
  issueResource,
  obligationDigest,
  parseReceipt,
  projectAcceptedAuthority,
  validateProductLanding,
} from "./contract.mjs";

const operationA = {
  operation: "stockfish.legal_root_table@1",
  provider: "stockfish",
  endpoint: { kind: "uci_supervisor", engineId: "stockfish-analysis" },
  parserId: "parse.stockfish_legal_root_table@1",
  sourceProjection: "stockfish.legal_root_table@1",
  sourceFactoryId: "makeLiveStockfishLegalRootTableEvidence",
  cliName: "stockfish-legal-roots",
};
const operationB = {
  operation: "maia.policy_page@1",
  provider: "maia",
  endpoint: { kind: "uci_supervisor", engineId: "maia-5m" },
  parserId: "parse.maia_policy_page@1",
  sourceProjection: "maia.policy_page@1",
  sourceFactoryId: "makeHumanMaiaPolicyPageEvidence",
  cliName: "maia-policy-page",
};
const domainA = { domain: "engine.binary.v1", constructorId: "digestEngineBinary" };
const domainB = { domain: "provider.request.v1", constructorId: "digestProviderRequest" };

test("D2909 first-parent acceptance authority rejects a later self-consistent replacement", () => {
  const accepted = issueReceipt([operationA], [domainA]);
  const replaced = issueReceipt([operationB], [domainB]);
  const authority = projectAcceptedAuthority([
    { commit: "a", status: "draft", receipt: null },
    { commit: "b", status: "accepted", receipt: accepted },
    { commit: "c", status: "accepted", receipt: replaced },
  ]);

  assert.equal(authority.acceptedCommit, "b");
  assert.throws(() => validateProductLanding(authority, replaced, issueResource([operationB], [domainB])), /ACCEPTED_RECEIPT_REPLACED/u);
  assert.equal(validateProductLanding(authority, accepted, issueResource([operationA], [domainA])), true);
});

test("D2921 a shallow accepted suffix cannot invent its missing draft predecessor", () => {
  const receipt = issueReceipt([operationA], [domainA]);
  assert.throws(() => projectAcceptedAuthority([
    { commit: "b", status: "accepted", receipt },
  ]), /ACCEPTANCE_TRANSITION_UNOBSERVED/u);
  assert.throws(() => projectAcceptedAuthority([
    { commit: "a", status: "absent", receipt: null },
    { commit: "b", status: "accepted", receipt },
  ]), /ACCEPTANCE_TRANSITION_UNOBSERVED/u);
});

test("D2910 receipt and resource arrays have one strict canonical byte order", () => {
  const receipt = issueReceipt([operationA, operationB], [domainA, domainB]);
  const authority = projectAcceptedAuthority([
    { commit: "a", status: "draft", receipt: null },
    { commit: "b", status: "accepted", receipt },
  ]);
  const canonicalResource = issueResource([operationA, operationB], [domainA, domainB]);
  const permutedBody = {
    id: canonicalResource.id,
    version: canonicalResource.version,
    payload: {
      operations: [...canonicalResource.payload.operations].reverse(),
      digestDomains: [...canonicalResource.payload.digestDomains].reverse(),
    },
  };
  const permuted = {
    ...permutedBody,
    digest: `sha256:${createHash("sha256").update(jcs(permutedBody), "utf8").digest("hex")}`,
  };

  assert.equal(validateProductLanding(authority, receipt, canonicalResource), true);
  assert.throws(() => validateProductLanding(authority, receipt, permuted), /RESOURCE_ORDER/u);
  assert.throws(() => parseReceipt({ ...receipt, operations: [...receipt.operations].reverse() }), /RECEIPT_ORDER/u);
});

test("D2911 receipt schema and domain-separated digest bytes have one wire image", () => {
  const receipt = issueReceipt([operationA], [domainA]);
  assert.equal(receipt.schema, "tabiya.provider-obligations.v1");
  assert.match(receipt.obligationsDigest, /^sha256:[0-9a-f]{64}$/u);
  assert.equal(receipt.obligationsDigest, "sha256:03638e63d9cf4ed48aca0a25b481e1259c60bc45d4f4b31f9e7e248f4e984993");
  assert.equal(receipt.obligationsDigest, obligationDigest({ operations: receipt.operations, digestDomains: receipt.digestDomains }));
  assert.throws(() => parseReceipt({ ...receipt, schema: 1 }), /RECEIPT_SCHEMA/u);
  assert.throws(() => parseReceipt({ ...receipt, obligationsDigest: receipt.obligationsDigest.slice(7) }), /RECEIPT_DIGEST_GRAMMAR/u);
  assert.throws(() => parseReceipt({ ...receipt, extra: true }), /RECEIPT_SHAPE/u);
});

function jcs(value) {
  if (value === null || typeof value === "boolean" || typeof value === "number" || typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(jcs).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${jcs(value[key])}`).join(",")}}`;
}
