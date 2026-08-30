// DISPOSABLE fresh independent review harness — D2120-D2126. Not production code.
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const rfc = read("rfc/module-registration.md");
const assemblyHarness = read("tools/d1865-evidence-assembly-harness/evidence-assembly.test.ts");
const evidenceContract = read("packages/runtime/src/evidence-contract.ts");
const moduleContract = read("packages/runtime/src/module-contract.ts");
const reducers = read("packages/runtime/src/module-reducers.ts");
const assistance = read("packages/runtime/src/assistance.ts");

function section(text, start, end) {
  const from = text.indexOf(start);
  const to = text.indexOf(end, from + start.length);
  assert.notEqual(from, -1, `missing section ${start}`);
  assert.notEqual(to, -1, `missing section ${end}`);
  return text.slice(from, to);
}

test("D2120: the 117-projection execution plan has no callable population", () => {
  assert.equal(existsSync("apps/server/src/module-evidence-assembler.ts"), false);
  assert.match(rfc, /MODULE_EVIDENCE_EXECUTION_PLAN/u);
  assert.match(rfc, /operationSymbol, operation/u);
  assert.match(assemblyHarness, /const ASSEMBLY_STAGE_BY_PRODUCER/u);
  assert.doesNotMatch(assemblyHarness, /operationSymbol|operation:\s*[A-Za-z_$]|typeof operation|operation\.name/u);
});

test("D2121: acceptance pairs leave mandatory F1 binding fields underived", () => {
  const binding = section(evidenceContract, "export interface EvidenceBinding", "export interface SemanticEventDeclaration");
  for (const field of ["timing", "roles", "sessions", "forms", "answerContent", "latency", "budget"]) {
    assert.match(binding, new RegExp(`readonly ${field}:`, "u"));
  }
  const join = section(rfc, "#### 2.2 Step 2", "#### 2.3 The four contract repairs");
  assert.match(join, /acceptance pair/u);
  assert.doesNotMatch(join, /latency\s*[:=]|budget\s*[:=]|forms\s*[:=]|intersection.*forms/iu);
});

test("D2122: maxWords and maxMarks have declarations but no enforcement criterion", () => {
  assert.match(moduleContract, /readonly maxWords: number/u);
  assert.match(moduleContract, /readonly maxMarks: number \| null/u);
  assert.match(reducers, /facts\.slice\(0, module\.budgets\.maxFacts\)/u);
  assert.doesNotMatch(reducers, /budgets\.maxWords|budgets\.maxMarks/u);
  const criterion = section(rfc, "9. **A9", "10. **A10");
  assert.match(criterion, /maxFacts/u);
  assert.doesNotMatch(criterion, /maxWords|maxMarks/u);
});

test("D2123: review scans the run without a bounded or paged request algebra", () => {
  assert.match(rfc, /review \| immutable run prefix plus selected node\/edge \| each distinct node\/edge once/u);
  const request = section(rfc, "type ModuleQueryRequest", ");\n```");
  assert.match(request, /timing: "review"; nodeId\?: string/u);
  assert.doesNotMatch(request, /cursor|limit|maxNodes|budget/u);
  const page = rfc.match(/ModuleQueryPage` carrying `\{[^`]+`/u)?.[0] ?? "";
  assert.notEqual(page, "");
  assert.doesNotMatch(page, /nextCursor|continuation|remaining/u);
});

test("D2124: runtime and evidence roles have no total translation", () => {
  assert.match(assistance, /readonly role: "solo" \| "host" \| "participant" \| "spectator"/u);
  assert.match(evidenceContract, /EvidenceRole = "learner" \| "host" \| "participant" \| "spectator" \| "author" \| "operator"/u);
  assert.doesNotMatch(rfc, /solo\s*(?:=>|→|maps? to)\s*(?:"|`)?learner/iu);
});

test("D2125: one aggregate empty sentence cannot express per-family inspector absence", () => {
  const empty = section(moduleContract, "export type ModuleEmptyBehavior", "/** The fourteen-field");
  assert.match(empty, /stated_absence"; readonly sentence: string/u);
  assert.match(rfc, /`full_inspector` a per-family absence line/u);
  assert.doesNotMatch(empty, /family|sourceResults|sentences/u);
});

test("D2126: derived-after-inputs is a stage label, not an input graph", () => {
  assert.match(assemblyHarness, /derived_after_inputs: 64/u);
  assert.doesNotMatch(assemblyHarness, /derivationInputs|inputProjections|dependsOn|derivationAnyOf/u);
  const assembler = section(rfc, "`apps/server/src/module-evidence-assembler.ts`", "#### 2.6 Steps 5–6");
  assert.match(assembler, /Derived projections run only after their literal inputs exist/u);
  assert.doesNotMatch(assembler, /derivationInputs\s*[:=]|inputProjections\s*[:=]|dependsOn\s*[:=]|derivationAnyOf\s*[:=]/u);
});
