import assert from "node:assert/strict";
import test from "node:test";

import { missingMakeDependencies, missingRequiredText } from "./verify-scaffold.mjs";

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
