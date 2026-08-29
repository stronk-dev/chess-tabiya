// DISPOSABLE author-repair contract for D2037/D2038. Not production code.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (path: string): string => readFileSync(path, "utf8");
const rfc = read("rfc/assistance-config-register.md");

const v5Authority = Object.freeze([
  "apps/web/src/lib/assistance-preference.ts#loadAssistance",
  "packages/runtime/src/assistance-codec.ts#parseAssistanceConfig",
  "packages/runtime/src/assistance.ts#AssistanceConfig.hintDistance",
  "packages/runtime/src/assistance.ts#AssistanceConfig.version",
]);

function transitionMatches(
  claim: readonly string[],
  derivedAuthorityChanges: readonly string[],
): boolean {
  return JSON.stringify([...claim].sort()) ===
    JSON.stringify([...derivedAuthorityChanges].sort());
}

test("D2037: governance owns an exact two-commit fail-closed parent contract", () => {
  assert.match(rfc, /fetch-depth: 2/u);
  assert.match(rfc, /git rev-parse --verify/u);
  assert.match(rfc, /HEAD\^1/u);
  assert.match(rfc, /named hard\s+failure/u);
  assert.doesNotMatch(rfc, /silently skip(?:s|ped)? the committed arm/u);
});

test("D2037: the exact workflow repair is inside the implementation boundary", () => {
  const boundary = rfc.match(/### 6\. Files and boundaries[\s\S]*?## Deviations from design/u)?.[0] ?? "";
  assert.match(boundary, /\.github\/workflows\/verify\.yml/u);
  assert.match(boundary, /fetch-depth: 2/u);
});

test("D2038: the v5 claim names all four sorted authority roots", () => {
  for (const token of v5Authority) {
    const escaped = token.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
    assert.match(rfc, new RegExp(escaped, "u"));
  }
  assert.deepEqual([...v5Authority], [...v5Authority].sort());
});

test("D2038: the census is closed over runtime codec and browser persistence authority", () => {
  assert.match(rfc, /transitive TypeScript declaration closure of the sole runtime codec/u);
  assert.match(rfc, /transitive import\/declaration closure of\s+`apps\/web\/src\/lib\/assistance-preference\.ts#loadAssistance`/u);
  assert.match(rfc, /sole production reader of the\s+`tabiya\.assistance\.` namespace/u);
  assert.match(rfc, /production `\.ts`\/`\.svelte`/u);
});

test("D2038: parallel validators, migrations and namespace readers fail even if omitted", () => {
  assert.match(rfc, /local\/direct\/indirect `validV5`/u);
  assert.match(rfc, /another assistance-namespace reader/u);
  assert.match(rfc, /parallel migration authority fails/u);

  const omittedParallelCodec = [...v5Authority, "apps/web/src/lib/validV5.ts#validV5"];
  assert.equal(transitionMatches(v5Authority, omittedParallelCodec), false);
});

test("D2038: census derivation ignores unrelated dead helpers without accepting authority drift", () => {
  const unrelatedDeadHelperLeavesCensusUnchanged = [...v5Authority];
  assert.equal(transitionMatches(v5Authority, unrelatedDeadHelperLeavesCensusUnchanged), true);
  assert.match(rfc, /unimported dead helper/u);
  assert.match(rfc, /symbol set is derived from the closed authority census/u);
});
