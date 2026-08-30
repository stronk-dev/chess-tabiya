// DISPOSABLE positive author contract for D2190-D2193. This validates the repaired RFC, not C9.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const rfc = read("rfc/assistance-config-register.md");
const settings = read("apps/web/src/lib/AssistanceSettings.svelte");
const drill = read("apps/web/src/lib/DrillScreen.svelte");
const workspace = read("pnpm-workspace.yaml");
const serverCensus = read("apps/server/src/declaration-census.ts");

function section(start, end) {
  const from = rfc.indexOf(start);
  const to = rfc.indexOf(end, from + start.length);
  assert.notEqual(from, -1, `missing section ${start}`);
  assert.notEqual(to, -1, `missing section ${end}`);
  return rfc.slice(from, to);
}

test("D2190: current computed writes have one closed proof and crossed refusal set", () => {
  for (const source of [settings, drill]) {
    assert.match(source, /<Key extends keyof Omit<AssistanceConfig, "version">>/u);
    assert.match(source, /key: Key, value: AssistanceConfig\[Key\]/u);
    assert.match(source, /\[key\]: value/u);
  }
  assert.match(rfc, /key type is set-equal to `keyof Omit<AssistanceConfig,"version">`/u);
  assert.match(rfc, /value type is exactly `AssistanceConfig\[Key\]`/u);
  for (const refused of ["`string`-widened key", "`version`", "an unknown literal", "unregistered indirect call"]) {
    assert.ok(rfc.includes(refused), refused);
  }
});

test("D2191: the v5 claim is exact and contains gameplay plus both exhaustive columns", () => {
  const claim = section("On this RFC's implementation, `hint-distance.md` changes its block atomically to:", "Deleted legacy operations");
  const line = claim.split("\n").find((candidate) => candidate.startsWith("assistance-config | lane 5 |"));
  assert.ok(line);
  const tokens = line.split(" | ")[2].split("; ");
  assert.equal(tokens.length, 15);
  assert.deepEqual(tokens, [...tokens].sort());
  for (const token of [
    "apps/web/src/lib/DrillScreen.svelte#DrillScreen.hintDistance",
    "apps/web/src/lib/GuidedHintSeat.svelte#GuidedHintSeat.requestHint",
    "apps/web/src/lib/run-state.ts#RunStateStore.requestHint",
    "packages/runtime/src/presets.ts#PRESET_DECLARATIONS.config.hintDistance",
    "packages/runtime/src/presets.ts#WORKFLOW_CONTEXT_POLICIES.configClamp.hintDistance",
  ]) assert.ok(tokens.includes(token), token);
  assert.match(rfc, /Removing the\s+seat\/store edge or either exhaustive column fails C9\.6/u);
  assert.match(rfc, /\[\[D1639\]\] must be owner-ruled/u);
});

test("D2192: traversal vocabulary represents the current barrel, helpers, aliases and cycles", () => {
  for (const kind of ["callable", "import_alias", "reexport_alias", "component", "template_operation", "typed_field_write"]) {
    assert.match(rfc, new RegExp(`"${kind}"`, "u"));
  }
  assert.match(rfc, /packages\/runtime\/src\/index\.ts#AssistanceConfig/u);
  assert.match(rfc, /Two aliases may converge on the one storage writer/u);
  assert.match(rfc, /sorted strongly connected component and terminates/u);
  assert.match(rfc, /no transparent-edge contraction or hand-built shortcut exists/u);
});

test("D2193: production discovery comes from the workspace and classifies the real server observer", () => {
  assert.match(workspace, /apps\/\*/u);
  assert.match(workspace, /packages\/\*/u);
  assert.match(serverCensus, /AssistanceConfig/u);
  assert.match(rfc, /derives the production workspace from `pnpm-workspace\.yaml`/u);
  assert.match(rfc, /does not hard-code\s+web, runtime, server or a current package count/u);
  assert.match(rfc, /"authority" \| "product_consumer" \| "observer"/u);
  assert.match(rfc, /declaration-census\.ts#assistanceEntries/u);
  assert.match(rfc, /new workspace package is inside discovery/u);
  assert.doesNotMatch(rfc, /scans every non-test production[^\n]*under\s+`apps\/web\/src` and `packages\/runtime\/src`/u);
});

test("D2178: config, preference, exchange and permission remain four registered identities", () => {
  const extension = section("### 1a. Three adjacent resources", "### 2. Tree derivation");
  for (const resource of ["assistance-config", "workflow-preference", "assistance-exchange", "assistance-permission"]) {
    assert.ok(extension.includes(resource), resource);
  }
  assert.match(extension, /workflow-preference \| lane 2/u);
  assert.match(extension, /assistance-exchange \| first lane 1/u);
  assert.match(extension, /assistance-permission \| members legal/u);
  assert.match(rfc, /Removing, merging or renaming one fails/u);
});

test("D2328: a new wire has a derived absent state and one first-lane transition", () => {
  const extension = section("### 1a. Three adjacent resources", "### 2. Tree derivation");
  assert.match(extension, /kind: "absent"; readonly contractDigest: "absent"/u);
  assert.match(extension, /kind: "landed"; readonly head: number/u);
  assert.match(extension, /Exactly one active first\s+claim is allowed/u);
  assert.match(extension, /never `head 0`/u);
  assert.match(rfc, /two claimants, numeric\/member claims, fictional head 0/u);
  assert.match(rfc, /landed head 1 with a lingering first\s+claim fail/u);
});
