import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const rfc = readFileSync("rfc/provider-health-degradation.md", "utf8");
const successor = readFileSync("rfc/opponent-recovery-journey.md", "utf8");
const register = readFileSync("rfc/README.md", "utf8");
const makefile = readFileSync("Makefile", "utf8");

function section(source, start, end) {
  const from = source.indexOf(start);
  const to = source.indexOf(end, from + start.length);
  assert.notEqual(from, -1, `missing ${start}`);
  assert.notEqual(to, -1, `missing ${end}`);
  return source.slice(from, to);
}

test("the cut retains one claim-free live-health contract", () => {
  const claims = section(rfc, "```tabiya-claims", "```");
  assert.match(claims, /\bnone\b/u);
  assert.doesNotMatch(claims, /run-schema|lane\s+0\.26/u);

  for (const declaration of [
    "type ProviderFamilyId",
    "type ProviderInstanceId",
    "type ApplicationProviderOperationId",
    "`ProviderHealthSnapshot` is a **state-specific discriminated union**",
    "interface ProviderCacheInventory",
  ]) assert.equal(rfc.includes(declaration), true, `missing ${declaration}`);
});

test("all twenty-two implementation criteria remain row-backed", () => {
  const criteria = section(rfc, "## Acceptance criteria", "## Falsifiers and negative fixtures");
  const rows = [...criteria.matchAll(/^\| (\d+) \| ([^\n]+?) \| ([^\n]+?) \|$/gmu)];
  assert.deepEqual(rows.map((match) => Number(match[1])), Array.from({ length: 22 }, (_, index) => index + 1));
  for (const [, number, criterion, ledgerRows] of rows) {
    assert.ok(criterion.trim().length >= 40, `criterion ${number} is not an implementation obligation`);
    assert.match(ledgerRows, /D\d+/u, `criterion ${number} has no ledger owner`);
  }
});

test("durable opponent recovery owns the removed run-schema lane", () => {
  assert.match(successor, /```tabiya-claims\s+run-schema \| lane 0\.26 \|/su);
  assert.match(register, /\| `provider-health-degradation\.md` \|[^\n]+claims none/u);
  assert.match(register, /\| `opponent-recovery-journey\.md` \|[^\n]+run-schema lane 0\.26/u);
});

test("canonical governance runs the cut contract, not a retired author chain", () => {
  const governance = makefile.split("\n").filter((line) => line.startsWith("verify-governance:")).join("\n");
  assert.match(governance, /\bprovider-health-cut-contract\b/u);

  const dependencies = new Map();
  for (const line of makefile.split("\n")) {
    const match = /^([a-zA-Z0-9_.-]+):(?:\s+([^#]+?))?\s*$/u.exec(line);
    if (match === null || match[1].startsWith(".")) continue;
    const current = dependencies.get(match[1]) ?? [];
    current.push(...(match[2]?.trim().split(/\s+/u).filter(Boolean) ?? []));
    dependencies.set(match[1], current);
  }
  const reachable = new Set();
  const pending = ["verify-governance"];
  while (pending.length > 0) {
    const targetName = pending.pop();
    if (reachable.has(targetName)) continue;
    reachable.add(targetName);
    pending.push(...(dependencies.get(targetName) ?? []));
  }
  const historical = [...reachable].filter((name) =>
    /^provider-health-(?:author-repair|[a-z]+-(?:fresh-review|author-repair))$/u.test(name),
  );
  assert.deepEqual(historical, []);

  const target = section(makefile, ".PHONY: provider-health-cut-contract", "\n\n");
  assert.match(target, /node --test tools\/d3059-provider-health-cut-contract\/contract\.test\.mjs/u);
  assert.doesNotMatch(target, /provider-health-(?:fresh-review|author-repair)/u);
});
