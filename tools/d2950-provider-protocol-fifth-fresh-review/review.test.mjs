import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  issueReceipt,
  issueResource,
  parseReceipt,
  projectAcceptedAuthority,
  validateProductLanding,
} from "../d2909-provider-protocol-fourth-author-repair/contract.mjs";

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

function fakeAuthority(receipt) {
  return projectAcceptedAuthority([
    { commit: "not-a-git-object", status: "draft", receipt: null },
    { commit: "also-not-a-git-object", status: "accepted", receipt },
  ]);
}

test("D2950 caller-authored labels and rows mint first-parent acceptance authority", () => {
  const receipt = issueReceipt([operationA], [domainA]);
  const authority = fakeAuthority(receipt);

  assert.equal(authority.acceptedCommit, "also-not-a-git-object");
  assert.equal(validateProductLanding(authority, receipt, issueResource([operationA], [domainA])), true);
});

test("D2951 semantically equal but byte-distinct receipt files share acceptance authority", () => {
  const receipt = issueReceipt([operationA], [domainA]);
  const acceptedBytes = JSON.stringify(receipt);
  const reorderedBytes = `${JSON.stringify({
    operations: receipt.operations,
    digestDomains: receipt.digestDomains,
    sourceRfc: receipt.sourceRfc,
    obligationsDigest: receipt.obligationsDigest,
    schema: receipt.schema,
  }, null, 2)}\n`;
  assert.notEqual(acceptedBytes, reorderedBytes);

  const authority = fakeAuthority(JSON.parse(acceptedBytes));
  assert.equal(
    validateProductLanding(authority, JSON.parse(reorderedBytes), issueResource([operationA], [domainA])),
    true,
  );
});

test("D2952 product landing observes a supplied object but no HEAD, index or worktree receipt", () => {
  const accepted = issueReceipt([operationA], [domainA]);
  const replacement = issueReceipt([operationB], [domainB]);
  const authority = fakeAuthority(accepted);
  const modeledCheckout = { head: replacement, index: replacement, worktree: replacement };
  assert.notDeepEqual(modeledCheckout.head, accepted);

  assert.equal(validateProductLanding(authority, accepted, issueResource([operationA], [domainA])), true);
  assert.equal(validateProductLanding.length, 3);
  const source = readFileSync(new URL("../d2909-provider-protocol-fourth-author-repair/contract.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(source, /readFile|HEAD|worktree|staged|index receipt/u);
});

test("D2953 duplicate receipt keys collapse before the object parser can refuse them", () => {
  const receipt = issueReceipt([operationA], [domainA]);
  const validBytes = JSON.stringify(receipt);
  const duplicateBytes = validBytes.replace(
    /^\{"schema":/u,
    "{\"schema\":\"invalid-but-erased\",\"schema\":",
  );
  assert.match(duplicateBytes, /"schema"[^]*"schema"/u);

  const collapsed = JSON.parse(duplicateBytes);
  assert.equal(parseReceipt(collapsed).schema, "tabiya.provider-obligations.v1");
});

test("D2954 lone-surrogate identifiers receive valid-looking RFC-8785 digests", () => {
  const invalidUnicodeOperation = { ...operationA, operation: "bad\ud800" };
  const receipt = issueReceipt([invalidUnicodeOperation], [domainA]);
  const authority = fakeAuthority(receipt);

  assert.match(receipt.obligationsDigest, /^sha256:[0-9a-f]{64}$/u);
  assert.equal(
    validateProductLanding(authority, receipt, issueResource([invalidUnicodeOperation], [domainA])),
    true,
  );
});

test("D2955 an accepted receipt can mutate in history while authority for its old value survives", () => {
  const accepted = issueReceipt([operationA], [domainA]);
  const mutated = issueReceipt([operationB], [domainB]);
  const authority = projectAcceptedAuthority([
    { commit: "draft", status: "draft", receipt: null },
    { commit: "accepted-a", status: "accepted", receipt: accepted },
    { commit: "mutated-b", status: "accepted", receipt: mutated },
  ]);

  assert.equal(validateProductLanding(authority, accepted, issueResource([operationA], [domainA])), true);
});
