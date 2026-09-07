import assert from "node:assert/strict";
import test from "node:test";

import { checkoutFetchDepth, missingMakeDependencies, missingRequiredText, workflowJob } from "./verify-scaffold.mjs";

const required = ["verify-software", "verify-governance", "verify-content"];

test("verify dependency guard permits additional checks", () => {
  assert.deepEqual(
    missingMakeDependencies(
      "verify: verify-software verify-governance verify-content extra-check\n",
      "verify",
      required,
    ),
    { ruleFound: true, missing: [] },
  );
});

test("verify dependency guard reports a missing required check", () => {
  assert.deepEqual(
    missingMakeDependencies("verify: verify-software verify-governance\n", "verify", required),
    { ruleFound: true, missing: ["verify-content"] },
  );
});

test("verify dependency guard reports a missing target", () => {
  assert.deepEqual(
    missingMakeDependencies("build: typecheck\n", "verify", required),
    { ruleFound: false, missing: required },
  );
});

test("workflow command guard reports every missing tier", () => {
  assert.deepEqual(
    missingRequiredText("run: make test-browser-smoke\n", [
      "make test-browser-smoke",
      "make test-browser-content",
      "make test-browser-matrix",
    ]),
    ["make test-browser-content", "make test-browser-matrix"],
  );
});

test("hook command guard distinguishes the staged process-contract runner", () => {
  assert.deepEqual(
    missingRequiredText("run: make register-check\n", [
      "run: node tools/staged-process-contracts.mjs",
    ]),
    ["run: node tools/staged-process-contracts.mjs"],
  );
});

test("workflow job extraction does not borrow checkout policy from another job", () => {
  const workflow = `jobs:
  software:
    steps:
      - uses: actions/checkout@v7
        with:
          fetch-depth: 0
  repository-governance:
    steps:
      - uses: actions/checkout@v7
  content:
    steps: []
`;
  assert.match(workflowJob(workflow, "software") ?? "", /fetch-depth:\s*0/u);
  assert.doesNotMatch(workflowJob(workflow, "repository-governance") ?? "", /fetch-depth/u);
  assert.equal(workflowJob(workflow, "missing"), undefined);
  assert.equal(checkoutFetchDepth(workflowJob(workflow, "software") ?? ""), 0);
  assert.equal(checkoutFetchDepth(workflowJob(workflow, "repository-governance") ?? ""), undefined);
});

test("governance and draft-RFC evidence remain separate Make targets", () => {
  const makefile = `verify-governance: register-check status-parity work-index\nverify-rfc-evidence: example-fresh-review example-author-repair\n`;
  assert.deepEqual(
    missingMakeDependencies(makefile, "verify-governance", ["register-check", "work-index"]),
    { ruleFound: true, missing: [] },
  );
  assert.deepEqual(
    missingMakeDependencies(makefile, "verify-rfc-evidence", ["example-fresh-review", "example-author-repair"]),
    { ruleFound: true, missing: [] },
  );
});
