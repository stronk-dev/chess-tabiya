// rfc/verifiable-runtime-distribution.md §3 and acceptance criteria 2–3.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { workflowFindings } from "./action-policy.mjs";
import { repoPath } from "./lib/common.mjs";
import { actionReferenceFindings, outlineWorkflow, permissionFindings } from "./lib/workflow-policy.mjs";

const SHA = "3d3c42e5aac5ba805825da76410c181273ba90b1";

test("criterion 2: the repository's workflows pass the action and permission policy", () => {
  assert.deepEqual(workflowFindings(), []);
});

test("criterion 2: @v7, a branch, a short SHA or a SHA without a reviewed version comment fails", () => {
  for (const line of [
    "      - uses: actions/checkout@v7",
    "      - uses: actions/checkout@main",
    "      - uses: actions/checkout@3d3c42e",
    `      - uses: actions/checkout@${SHA}`,
    `      - uses: actions/checkout@${SHA} # latest`,
    "      - uses: docker://alpine:3",
  ]) {
    assert.equal(actionReferenceFindings(line).length, 1, line);
  }
  assert.deepEqual(actionReferenceFindings(`      - uses: actions/checkout@${SHA} # v7.0.1`), []);
  assert.deepEqual(actionReferenceFindings("      - uses: ./.github/actions/local"), []);
  assert.deepEqual(actionReferenceFindings(`        uses: docker://alpine@sha256:${"a".repeat(64)}`), []);
});

const pullRequestWorkflow = (jobPermissions) => `name: ci
on:
  push:
  pull_request:
permissions:
  contents: read
jobs:
  test:
    runs-on: ubuntu-24.04
    permissions:
${jobPermissions}
    steps:
      - run: make verify
`;

test("criterion 3: a pull-request workflow cannot acquire package, release, OIDC or attestation write", () => {
  for (const scope of ["packages", "contents", "id-token", "attestations"]) {
    const findings = permissionFindings(pullRequestWorkflow(`      ${scope}: write`), "ci.yml");
    assert.equal(findings.length, 1, scope);
  }
  assert.deepEqual(permissionFindings(pullRequestWorkflow("      contents: read"), "ci.yml"), []);
  const topLevel = "name: x\non:\n  pull_request:\npermissions: write-all\njobs:\n  a:\n    runs-on: x\n";
  assert.match(permissionFindings(topLevel, "x.yml").join("\n"), /workflow-level permissions grant write/u);
  const target = "name: x\non:\n  pull_request_target:\npermissions: {}\njobs:\n  a:\n    runs-on: x\n";
  assert.match(permissionFindings(target, "x.yml").join("\n"), /privileged trigger/u);
});

test("criterion 3: privileged release jobs exist only after verification in the tag-only workflow", () => {
  const release = readFileSync(repoPath(".github/workflows/release.yml"), "utf8");
  const outline = outlineWorkflow(release);
  assert.equal(outline.tagOnlyPush, true);
  assert.deepEqual(outline.permissions, {});
  const privileged = Object.entries(outline.jobs).filter(([, job]) => Object.values(job.permissions ?? {}).includes("write")).map(([name]) => name).sort();
  assert.deepEqual(privileged, ["github-release", "publish", "sign-attest"]);
  const build = outline.jobs.build.permissions;
  assert.deepEqual(build, { contents: "read" }, "image build before publish has no package write");
  const skipped = release.replace("    needs: [eligibility, verify, build]\n", "    needs: [eligibility, build]\n").replace("  build:\n    needs: [eligibility, pre-image]", "  build:\n    needs: [eligibility]");
  assert.match(permissionFindings(skipped, "release.yml").join("\n"), /publish does not run after verify/u);
  const branchPush = release.replace('    tags: ["v*"]', '    branches: [main]');
  assert.notEqual(permissionFindings(branchPush, "release.yml").length, 0);
});
