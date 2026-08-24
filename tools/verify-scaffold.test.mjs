import assert from "node:assert/strict";
import test from "node:test";

import { missingMakeDependencies, missingRequiredText } from "./verify-scaffold.mjs";

const required = ["typecheck", "test", "schema-check"];

test("verify dependency guard permits additional checks", () => {
  assert.deepEqual(
    missingMakeDependencies(
      "verify: typecheck test work-index schema-check account-data-lifecycle-check\n",
      "verify",
      required,
    ),
    { ruleFound: true, missing: [] },
  );
});

test("verify dependency guard reports a missing required check", () => {
  assert.deepEqual(
    missingMakeDependencies("verify: typecheck schema-check\n", "verify", required),
    { ruleFound: true, missing: ["test"] },
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
