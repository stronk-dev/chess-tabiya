// DISPOSABLE second fresh independent review harness — D2171-D2178. This reproduces the
// buildability return; it is not a production preset implementation.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const rfc = read("rfc/intent-presets.md");
const modules = read("rfc/module-registration.md");
const register = read("rfc/README.md");
const execution = JSON.parse(read("rfc/contracts/module-execution-plan-v1.json"));
const bindings = JSON.parse(read("rfc/contracts/module-binding-plan-v1.json"));

function section(text, start, end) {
  const from = text.indexOf(start);
  const to = text.indexOf(end, from + start.length);
  assert.notEqual(from, -1, `missing section ${start}`);
  assert.notEqual(to, -1, `missing section ${end}`);
  return text.slice(from, to);
}

test("D2171: source dependencies rest on a returned and demonstrably incomplete authority", () => {
  assert.match(modules, /Status:\*\* draft — \*\*returned by second fresh independent buildability review/u);
  assert.equal(bindings.rows.some((row) => row.consumer.id === "module.guided_hint"), false);
  assert.equal("sourceInputs" in execution, false);
  const dependencies = section(rfc, "`effectSourceDependencies` is derived", "The compiled `config`");
  assert.match(dependencies, /205 binding rows plus the 117-row\s+execution\/derivation DAG/u);
});

test("D2172: the repair leaves two incompatible compiler authorities", () => {
  const compiler = section(rfc, "export function compileAssistance", "#### §5.3");
  assert.match(compiler, /readonly context: WorkflowContextId/u);
  assert.match(compiler, /readonly access: AssistanceContext/u);
  assert.match(compiler, /readonly serverAvailability:/u);
  assert.match(compiler, /readonly moduleAuthority:/u);
  assert.match(rfc, /`compileAssistanceRequest`[\s\S]*`compileAuthoritativeAssistance`[\s\S]*`finalizeAssistanceEffects`[\s\S]*`narrowBrowserChannels`/u);
  assert.doesNotMatch(rfc, /export (?:interface|type) RequestedAssistanceV1/u);
  assert.doesNotMatch(rfc, /export function compileAuthoritativeAssistance\s*\(/u);
});

test("D2173: the v2 bytes erase unset and migrated intent after the first reload", () => {
  const persisted = section(rfc, "export interface WorkflowPreferenceV2", "```\n\nNew writes");
  assert.doesNotMatch(persisted, /readonly kind:/u);
  assert.doesNotMatch(persisted, /sourceVersion|migrated/u);
  assert.match(rfc, /including `unset` as the\s+context default with empty overrides/u);
  assert.match(rfc, /`migrated_snapshot` always displays Custom/u);
  assert.match(rfc, /unset receipt remaining distinguishable from an explicit\s+Quiet request/u);
});

test("D2174: selecting a named preset retains Custom module deltas", () => {
  assert.match(rfc, /Choosing a preset calls\s+`saveWorkflowPreference\(context, \{version: 2, preset: next, overrides:\s*retainedLowerOverrides, moduleOverrides\}\)`/u);
  assert.match(rfc, /any module delta changes\s+the visible mode to Custom/u);
  assert.doesNotMatch(rfc, /selecting a named preset (?:deletes|clears|resets)[^\n]*moduleOverrides/iu);
});

test("D2175: browser availability is supplied both before and after server compilation", () => {
  assert.match(rfc, /RequestedAssistanceV1 \{schemaVersion, contextHint, preference, browserChannels,/u);
  assert.match(rfc, /it never sends effective modules,\s+permissions or provider availability/u);
  assert.match(rfc, /narrowBrowserChannels\(serverModuleQuery\(requested\), browserChannels\)/u);
  assert.match(rfc, /The browser may report only output-channel readiness/u);
});

test("D2176: Custom can exclude the mandatory rules floor", () => {
  assert.match(rfc, /readonly exclude: readonly ModuleId\[\]/u);
  assert.match(rfc, /excludes always narrow/u);
  assert.match(rfc, /every compiled\s+output has[\s\S]{0,180}modules ∋ rules_floor/u);
  assert.doesNotMatch(rfc, /rules_floor[^\n]{0,100}(?:cannot|must not|refus)[^\n]{0,100}exclude/iu);
});

test("D2177: malformed whole-preference recovery has no representable suppression", () => {
  const suppressions = section(rfc, "export type SuppressionRecord", "export type SuppressionReason");
  assert.match(suppressions, /kind: "module"/u);
  assert.match(suppressions, /kind: "field"/u);
  assert.match(suppressions, /kind: "effect"/u);
  assert.doesNotMatch(suppressions, /kind: "preference"|kind: "recovery"/u);
  assert.match(rfc, /invalid_fallback[\s\S]{0,120}malformed/u);
  assert.match(rfc, /visible suppression\/recovery\s+reason/u);
});

test("D2178: two new wire versions and a closed vocabulary claim no shared resource", () => {
  assert.match(rfc, /export interface WorkflowPreferenceV2/u);
  assert.match(rfc, /RequestedAssistanceV1 \{schemaVersion/u);
  assert.match(rfc, /AssistancePermission[\s\S]{0,200}gains one member/u);
  assert.match(rfc, /```tabiya-claims\s+none\s+```/u);
  assert.doesNotMatch(register, /WorkflowPreference|RequestedAssistance|AssistancePermission/u);
});
