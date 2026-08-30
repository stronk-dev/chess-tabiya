// DISPOSABLE fifth fresh independent buildability review. This reproduces process-contract
// blockers; it does not implement the register or any assistance product behavior.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "vitest";
import { loadWorkflowPreset } from "../../apps/web/src/lib/assistance-preference.js";

const read = (path: string): string => readFileSync(path, "utf8");
const rfc = read("rfc/assistance-config-register.md");
const preference = read("apps/web/src/lib/assistance-preference.ts");
const intent = read("rfc/intent-presets.md");
const author = read("tools/d2190-assistance-register-third-author-repair/contract.test.mjs");

function section(text: string, start: string, end: string): string {
  const from = text.indexOf(start);
  const to = text.indexOf(end, from + start.length);
  assert.notEqual(from, -1, `missing section ${start}`);
  assert.notEqual(to, -1, `missing section ${end}`);
  return text.slice(from, to);
}

test("D2355: workflow-preference v1 is not the strict two-key grammar claimed by bootstrap", () => {
  const storage = {
    getItem: () => JSON.stringify({ version: 1, preset: "support", undeclared: "accepted" }),
    setItem: () => undefined,
  };
  assert.equal(loadWorkflowPreset("position", storage), "support");
  assert.match(rfc, /strict `\{version:1,preset\}` storage grammar/u);
  assert.doesNotMatch(preference, /Object\.keys\(item\)|exact.*keys|undeclared/u);
});

test("D2356: workflow-preference has no exact tree, root, dependency graph or digest model", () => {
  const extension = section(rfc, "### 1a. Three adjacent resources", "### 2. Tree derivation");
  assert.match(extension, /workflow-preference.*head 1/us);
  assert.match(rfc, /parser\/serializer,\s+member, return-site or package-export changes move them/u);
  assert.doesNotMatch(rfc, /interface WorkflowPreferenceTree|WORKFLOW_PREFERENCE_ROOTS|WorkflowPreferenceAuthorityNode/u);
  assert.match(preference, /workflowContextPolicy\(kind\)\.allowedPresets/u);
});

test("D2357: absent assistance-exchange has no registered root whose absence can be derived", () => {
  const extension = section(rfc, "### 1a. Three adjacent resources", "### 2. Tree derivation");
  assert.match(extension, /registered production root must not resolve/u);
  assert.match(extension, /<checker-derived four-stage type\/parser\/compiler symbols>/u);
  assert.doesNotMatch(extension, /assistanceExchangeRoot|contractRoot:\s*`[^`]+#[^`]+`|rootSymbol:/u);
  assert.doesNotMatch(preference, /RequestedAssistanceV1|AuthoritativeAssistanceV1|FinalizedAssistanceV1/u);
});

test("D2358: the absent-state lifecycle does not refuse landed-to-absent regression", () => {
  const extension = section(rfc, "### 1a. Three adjacent resources", "### 2. Tree derivation");
  assert.match(extension, /absent.*first lane 1.*landed/us);
  assert.doesNotMatch(extension, /landed(?:[^\n]|\n(?!###)){0,300}(?:must not|cannot|refus)[^\n]*absent/iu);
  const fixtures = section(rfc, "### 5. Able-to-fail fixtures", "### 6. Files and boundaries");
  assert.doesNotMatch(fixtures, /landed(?:[^\n]|\n(?!###)){0,160}(?:back|regress|delete|remove)[^\n]*absent/iu);
});

test("D2359: permission member claim omits the semantic operations that adding legal changes", () => {
  const extension = section(rfc, "### 1a. Three adjacent resources", "### 2. Tree derivation");
  const claim = extension.split("\n").find((line) => line.startsWith("assistance-permission | members legal |"));
  assert.equal(claim, "assistance-permission | members legal | packages/runtime/src/assistance.ts#AssistancePermission");
  for (const operation of ["contextClamp", "accessPermission", "permittedAssistance", "compileAuthoritativeAssistance"]) {
    assert.match(intent, new RegExp(operation, "u"));
    assert.doesNotMatch(claim, new RegExp(operation, "u"));
  }
  assert.match(rfc, /return-site or package-export changes move them/u);
});

test("D2360: the extension's positive author contract executes no proposed resource semantics", () => {
  assert.doesNotMatch(author, /from ["'][^"']*register-check|parseClaimBlock\(|NumericResourceTreeState\s*[={]|derive.*AssistanceExchange\(/u);
  const extensionTests = author.slice(author.indexOf('test("D2178:'));
  assert.match(extensionTests, /assert\.match|assert\.ok/u);
  assert.doesNotMatch(extensionTests, /assert\.throws|assert\.rejects/u);
});
