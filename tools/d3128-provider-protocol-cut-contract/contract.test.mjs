import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../../", import.meta.url);

async function read(path) {
  return readFile(new URL(path, root), "utf8");
}

test("the active provider-protocol contract is the bounded eight-criterion cut", async () => {
  const rfc = await read("rfc/provider-protocol-register.md");
  const active = rfc.match(
    /## Active cut contract and acceptance criteria\n(?<body>[\s\S]*?)\n## 1\. Exact descriptor/,
  )?.groups?.body;

  assert.ok(active, "active cut section must have an explicit end boundary");
  assert.equal(
    [...active.matchAll(/^\d+\./gm)].length,
    8,
    "the cut has exactly eight active criteria",
  );
  for (const retired of [
    "openRepositoryAcceptance",
    "issueResource",
    "AcceptedProviderObligationsAuthority",
    "accepted-obligations",
  ]) {
    assert.doesNotMatch(active, new RegExp(retired), `${retired} is historical, not active`);
  }
  assert.match(rfc, /Historical product-image design \(non-normative; transferred\)/);
  assert.match(rfc, /Superseded pre-cut acceptance criteria \(non-normative\)/);
});

test("the descriptor source contains exactly the one absent generic catalogue member", async () => {
  const source = JSON.parse(
    await read("planning/provider-protocol-register/catalogue-additions.v1.json"),
  );

  assert.deepEqual(source, {
    schemaVersion: 1,
    resources: [
      {
        id: "provider-protocol",
        lifecycle: "sequential",
        projection: {
          adapter: "canonical_resource@1",
          rootSelector:
            "packages/runtime/src/provider-protocol.ts#export:PROVIDER_PROTOCOL_RESOURCE",
        },
        claimMode: "whole_projection",
        introducedBy: "provider-protocol-register.md",
        introduction: "absent",
      },
    ],
  });
});

test("durable product parsing is handed to provider exchange, including bot D3030", async () => {
  const processRfc = await read("rfc/provider-protocol-register.md");
  const productRfc = await read("rfc/provider-exchange-and-execution.md");

  assert.match(processRfc, /durable operation-specific provider\s+parsers/);
  assert.match(processRfc, /bot-policy \[\[D3030\]\]/);
  assert.match(productRfc, /function parsePersistedProviderDelivery/);
  assert.match(productRfc, /shared remedy for \[\[D3030\]\]/);
  assert.match(productRfc, /sole save\/reload boundary/);
});

test("the cut fixture is opt-in RFC evidence, never stable governance", async () => {
  const makefile = await read("Makefile");
  const governance = makefile.match(/^verify-governance:[^\n]*$/m)?.[0] ?? "";
  const evidence = makefile.match(/^verify-rfc-evidence:[^\n]*$/m)?.[0] ?? "";

  assert.doesNotMatch(governance, /provider-protocol-cut-contract/);
  assert.match(evidence, /provider-protocol-cut-contract/);
});
