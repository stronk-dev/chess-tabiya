// DISPOSABLE author-repair contract for D2037/D2038. Not production code.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (path: string): string => readFileSync(path, "utf8");
const rfc = read("rfc/assistance-config-register.md");

const v5Authority = Object.freeze([
  "apps/web/src/lib/AssistanceSettings.svelte#AssistanceSettings.hintDistance",
  "apps/web/src/lib/assistance-preference.ts#loadAssistance",
  "apps/web/src/lib/assistance-preference.ts#migrate",
  "apps/web/src/lib/assistance-preference.ts#saveAssistance",
  "apps/web/src/lib/assistance-preference.ts#validV4",
  "packages/runtime/src/assistance-codec.ts#parseAssistanceConfig",
  "packages/runtime/src/assistance.ts#AssistanceConfig.hintDistance",
  "packages/runtime/src/assistance.ts#AssistanceConfig.version",
  "packages/runtime/src/assistance.ts#SILENT_ASSISTANCE",
  "packages/runtime/src/assistance.ts#permittedAssistance",
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

test("D2038/D2116: the v5 claim names all ten sorted authority changes", () => {
  for (const token of v5Authority) {
    const escaped = token.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
    assert.match(rfc, new RegExp(escaped, "u"));
  }
  assert.deepEqual([...v5Authority], [...v5Authority].sort());
});

test("D2038/D2117: the census is a closed TS/Svelte authority graph", () => {
  assert.match(rfc, /interface AssistanceAuthorityNode/u);
  assert.match(rfc, /type AssistanceAuthorityEdgeKind/u);
  assert.match(rfc, /every non-test production `\.ts` and `\.svelte` module/u);
  assert.match(rfc, /exactly one storage-key constructor,\s+one production reader and one writer/u);
});

test("D2038/D2113: parallel validators, migrations and namespace operations fail even if omitted", () => {
  assert.match(rfc, /second namespace reader\/writer, validator, migrator, serializer/u);
  assert.match(rfc, /v5 landing retaining either local operation/u);

  const omittedParallelCodec = [...v5Authority, "apps/web/src/lib/validV5.ts#validV5"];
  assert.equal(transitionMatches(v5Authority, omittedParallelCodec), false);
});

test("D2038: census derivation ignores unrelated dead helpers without accepting authority drift", () => {
  const unrelatedDeadHelperLeavesCensusUnchanged = [...v5Authority];
  assert.equal(transitionMatches(v5Authority, unrelatedDeadHelperLeavesCensusUnchanged), true);
  assert.match(rfc, /unimported file with no assistance field or namespace reach is outside the graph/u);
  assert.match(rfc, /changed-symbol token is derived from the symmetric difference/u);
});
