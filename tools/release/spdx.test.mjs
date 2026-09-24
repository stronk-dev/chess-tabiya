// rfc/verifiable-runtime-distribution.md §6 fixtures: accepted leaves, AND, selected/unselected OR,
// all four WITH pairs plus a wrong pair, nested expressions, custom LicenseRef, missing/mismatched
// text, exact/stale override, scanner conflict and the unresolved Maia weight.
import assert from "node:assert/strict";
import { cpSync, mkdtempSync, writeFileSync, appendFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { REPO_ROOT, canonicalJson, sha256Digest } from "./lib/common.mjs";
import { evaluateComponent, evaluateExpression, loadFossPolicy, parseSpdxExpression, renderSpdx } from "./lib/spdx.mjs";

const policy = loadFossPolicy();
const commit = "a".repeat(40);

function withOverrides(document) {
  const root = mkdtempSync(join(tmpdir(), "tabiya-foss-"));
  cpSync(join(REPO_ROOT, "release"), join(root, "release"), { recursive: true });
  const overrides = canonicalJson({ format: "tabiya-foss-overrides", formatVersion: 1, orSelections: [], overrides: [], ...document });
  writeFileSync(join(root, "release/foss-overrides.v1.json"), overrides);
  const current = JSON.parse(canonicalJson(policy.overrides));
  const next = { ...JSON.parse(JSON.stringify(Object.fromEntries(Object.entries(policy).filter(([key]) => !["digest", "texts", "overrideRecords"].includes(key))))) };
  next.overrides = { ...current, digest: sha256Digest(Buffer.from(overrides)) };
  writeFileSync(join(root, "release/foss-policy.v1.json"), canonicalJson(next));
  return loadFossPolicy({ root });
}

test("§6 policy: accepted leaves pass with pinned texts; unknown, NOASSERTION, NONE and refused ids fail", () => {
  for (const id of policy.acceptedLicenseIds) assert.equal(evaluateExpression(id, policy).pass, true, id);
  for (const id of ["NOASSERTION", "NONE", "LicenseRef-MAIA3-WEIGHTS-UNRESOLVED", "SSPL-1.0", "LicenseRef-NVIDIA-Proprietary", "CC-BY-NC-4.0"]) {
    assert.equal(evaluateExpression(id, policy).pass, false, id);
  }
});

test("§6 policy: canonical case is required and the legacy + shorthand is refused", () => {
  assert.equal(evaluateExpression("MIT and Apache-2.0", policy).pass, false);
  assert.equal(evaluateExpression("mit", policy).pass, false);
  assert.equal(evaluateExpression("GPL-2.0+", policy).pass, false);
  assert.equal(evaluateExpression("GPL-2.0-or-later", policy).pass, true);
});

test("§6 policy: AND is conjunctive and ships every branch text", () => {
  const result = evaluateExpression("MIT AND BSD-3-Clause AND Zlib", policy);
  assert.equal(result.pass, true);
  assert.deepEqual(result.texts, ["BSD-3-Clause", "MIT", "Zlib"]);
  assert.equal(evaluateExpression("MIT AND LicenseRef-public-domain", policy).pass, false);
});

test("§6 policy: WITH precedence and all four accepted pairs; an exception never floats", () => {
  for (const expression of [
    "GPL-2.0-only WITH Classpath-exception-2.0",
    "GPL-2.0-or-later WITH Classpath-exception-2.0",
    "Apache-2.0 WITH LLVM-exception",
    "GPL-3.0-or-later WITH GCC-exception-3.1",
  ]) {
    const result = evaluateExpression(expression, policy);
    assert.equal(result.pass, true, expression);
  }
  assert.equal(evaluateExpression("GPL-3.0-only WITH GCC-exception-3.1", policy).pass, false);
  assert.equal(evaluateExpression("MIT WITH LLVM-exception", policy).pass, false);
  const ast = parseSpdxExpression("MIT AND Apache-2.0 WITH LLVM-exception OR ISC");
  assert.equal(ast.type, "or");
  assert.equal(ast.left.type, "and");
  assert.equal(ast.left.right.type, "with");
});

test("§6 policy: OR requires a curated selection of one literal branch bound to the exact component", () => {
  assert.equal(evaluateExpression("MIT OR Apache-2.0", policy).pass, false, "pick-whichever-passes is forbidden");
  const component = { purl: "pkg:npm/example@1.0.0", version: "1.0.0", artifactDigest: `sha256:${"b".repeat(64)}`, observedExpression: "MIT OR SSPL-1.0", scanner: { id: "syft", version: "1.33.0" } };
  const selection = { purl: component.purl, version: component.version, artifactDigest: component.artifactDigest, expression: "MIT OR SSPL-1.0", path: [], branch: "left", rationale: "select MIT", approver: "owner", approvalCommit: commit };
  const selected = withOverrides({ orSelections: [selection] });
  assert.equal(evaluateComponent(component, selected).pass, true);
  const wrongBranch = withOverrides({ orSelections: [{ ...selection, branch: "right" }] });
  assert.equal(evaluateComponent(component, wrongBranch).pass, false);
  const staleDigest = withOverrides({ orSelections: [{ ...selection, artifactDigest: `sha256:${"c".repeat(64)}` }] });
  assert.equal(evaluateComponent(component, staleDigest).pass, false);
  const unapproved = withOverrides({ orSelections: [{ ...selection, approvalCommit: "" }] });
  assert.equal(evaluateComponent(component, unapproved).pass, false);
});

test("§6 policy: nested expressions bind an exact AST path without distributive rewriting", () => {
  const expression = "(MIT OR SSPL-1.0) AND (BSD-3-Clause OR LicenseRef-x)";
  const ast = parseSpdxExpression(expression);
  assert.equal(renderSpdx(ast), expression);
  assert.deepEqual(parseSpdxExpression(renderSpdx(ast)), ast);
  const component = { purl: "pkg:npm/nested@1.0.0", version: "1.0.0", artifactDigest: `sha256:${"d".repeat(64)}`, observedExpression: expression, scanner: { id: "syft", version: "1.33.0" } };
  const base = { purl: component.purl, version: component.version, artifactDigest: component.artifactDigest, expression, rationale: "r", approver: "owner", approvalCommit: commit };
  const onlyOne = withOverrides({ orSelections: [{ ...base, path: ["left"], branch: "left" }] });
  assert.equal(evaluateComponent(component, onlyOne).pass, false);
  const both = withOverrides({ orSelections: [{ ...base, path: ["left"], branch: "left" }, { ...base, path: ["right"], branch: "left" }] });
  assert.equal(evaluateComponent(component, both).pass, true);
  const right = parseSpdxExpression("MIT AND (ISC AND Zlib)");
  assert.deepEqual(parseSpdxExpression(renderSpdx(right)), right, "right-nested same-operator trees keep their shape");
});

test("§6 policy: an exact approved override corrects the scanner; a stale, unapproved or LicenseRef override does not", () => {
  const component = { purl: "pkg:deb/debian/libgcc-s1@12.2.0-14%2Bdeb12u1", version: "12.2.0-14+deb12u1", artifactDigest: `sha256:${"e".repeat(64)}`, observedExpression: "LicenseRef-GPL AND GPL-3.0-only", scanner: { id: "syft", version: "1.33.0" } };
  const record = {
    purl: component.purl, version: component.version, artifactDigest: component.artifactDigest,
    scanner: component.scanner, observedExpression: component.observedExpression,
    replacementExpression: "GPL-3.0-or-later WITH GCC-exception-3.1",
    upstream: { url: "https://gcc.gnu.org/", revision: "releases/gcc-12.2.0", licenseTextSha256: `sha256:${"f".repeat(64)}` },
    rationale: "GCC runtime library exception", approver: "owner", approvalCommit: commit,
  };
  assert.equal(evaluateComponent(component, policy).pass, false);
  assert.equal(evaluateComponent(component, withOverrides({ overrides: [record] })).pass, true);
  assert.equal(evaluateComponent(component, withOverrides({ overrides: [{ ...record, version: "12.2.0-14" }] })).pass, false, "stale version");
  assert.equal(evaluateComponent(component, withOverrides({ overrides: [{ ...record, scanner: { id: "syft", version: "1.0.0" } }] })).pass, false, "stale scanner");
  assert.equal(evaluateComponent(component, withOverrides({ overrides: [{ ...record, approver: "" }] })).pass, false, "unapproved");
  assert.equal(evaluateComponent(component, withOverrides({ overrides: [{ ...record, replacementExpression: "LicenseRef-public-domain" }] })).pass, false, "custom text");
  const conflicting = withOverrides({ overrides: [record, { ...record, replacementExpression: "MIT" }] });
  assert.equal(evaluateComponent(component, conflicting).pass, false, "conflicting authority fails closed");
});

test("§6 policy: a concrete scanner result conflicting with a declared expression fails closed", () => {
  const component = { purl: "pkg:generic/stockfish@18", version: "18", artifactDigest: `sha256:${"1".repeat(64)}`, declaredExpression: "GPL-3.0-or-later", observedExpression: "MIT", scanner: { id: "syft", version: "1.33.0" } };
  assert.equal(evaluateComponent(component, policy).pass, false);
  assert.equal(evaluateComponent({ ...component, observedExpression: "NOASSERTION" }, policy).pass, true);
});

test("§6 policy: the unresolved Maia weight cannot pass and cannot be blessed by override (D1)", () => {
  const weight = { purl: "pkg:huggingface/UofTCSSLab/Maia3-5M@b6559de2398d7140b985f28fd2c19fb5e47ddabe", version: "b6559de2398d7140b985f28fd2c19fb5e47ddabe", artifactDigest: `sha256:${"2".repeat(64)}`, observedExpression: "LicenseRef-MAIA3-WEIGHTS-UNRESOLVED", scanner: { id: "tabiya-materials", version: "1" } };
  assert.equal(evaluateComponent(weight, policy).pass, false);
  const blessed = withOverrides({ overrides: [{ purl: weight.purl, version: weight.version, artifactDigest: weight.artifactDigest, scanner: weight.scanner, observedExpression: weight.observedExpression, replacementExpression: "AGPL-3.0-only", upstream: { url: "https://huggingface.co/UofTCSSLab/Maia3-5M", revision: weight.version, licenseTextSha256: `sha256:${"3".repeat(64)}` }, rationale: "scanner guess", approver: "owner", approvalCommit: commit }] });
  const result = evaluateComponent(weight, blessed);
  assert.equal(result.pass, false, "the override file cannot manufacture D1 evidence");
  assert.equal(result.overrideApplied, undefined);
});

test("§6 policy: a missing or mismatched licence text fails policy loading", () => {
  const root = mkdtempSync(join(tmpdir(), "tabiya-foss-text-"));
  cpSync(join(REPO_ROOT, "release"), join(root, "release"), { recursive: true });
  appendFileSync(join(root, policy.licenseTextRoot, "MIT.txt"), "tampered\n");
  assert.throws(() => loadFossPolicy({ root }), /does not match its policy digest/u);
});
