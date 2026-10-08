import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

import { checkoutFetchDepth, missingMakeDependencies, missingRequiredText, workflowJob } from "./verify-scaffold.mjs";

const required = ["verify-software", "verify-governance", "verify-content"];

test("raw research storage guards run on commit and in CI without hydrating recordings", () => {
  const makefile = readFileSync(new URL("../Makefile", import.meta.url), "utf8");
  const hook = readFileSync(new URL("../lefthook.yml", import.meta.url), "utf8");
  assert.deepEqual(missingMakeDependencies(makefile, "verify-governance",
    ["git-size-check", "research-artifacts-manifest-check", "research-artifacts-test"]), { ruleFound: true, missing: [] });
  assert.match(hook, /run: node tools\/git-size-check\.mjs --staged/u);
  const governance = /^verify-governance:\s*(.+)$/mu.exec(makefile)?.[1] ?? "";
  assert.doesNotMatch(governance, /research-artifacts-(restore|check|import)(?:\s|$)/u);
});

test("native release proof runs streaming through the pinned proxy on both architectures", () => {
  const release = readFileSync(new URL("../.github/workflows/release.yml", import.meta.url), "utf8");
  const native = workflowJob(release, "native-proof") ?? "";
  assert.match(native, /make http-streaming-proxy-check/u);
  assert.match(native, /make verify-deployment/u);
  assert.match(native, /make maia-identity-check/u);
  assert.match(native, /platform: linux\/amd64/u);
  assert.match(native, /platform: linux\/arm64/u);
  assert.deepEqual(missingRequiredText(native.replace("make http-streaming-proxy-check", ""), ["make http-streaming-proxy-check"]), ["make http-streaming-proxy-check"]);
  assert.deepEqual(missingRequiredText(native.replace("make verify-deployment", ""), ["make verify-deployment"]), ["make verify-deployment"]);
  assert.deepEqual(missingRequiredText(native.replace("make maia-identity-check", ""), ["make maia-identity-check"]), ["make maia-identity-check"]);
});

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
      "make test-browser-production",
    ]),
    ["make test-browser-content", "make test-browser-matrix", "make test-browser-production"],
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

test("each history-consuming verification job fetches its own parent", async () => {
  const { readFile } = await import("node:fs/promises");
  for (const [path, jobs] of [["../.github/workflows/verify.yml", ["software-contracts", "repository-governance", "real-content-contracts"]], ["../.github/workflows/release.yml", ["verify"]]]) {
    const text = await readFile(new URL(path, import.meta.url), "utf8");
    for (const name of jobs) {
      const depth = checkoutFetchDepth(workflowJob(text, name) ?? "");
      assert.ok(depth === 0 || (typeof depth === "number" && depth >= 2), `${path} ${name} cannot validate history on a missing parent`);
    }
  }
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

test("verify-awake cannot omit the actual staged process-contract runner", () => {
  assert.deepEqual(
    missingMakeDependencies("verify-awake: staged-process-contracts\n", "verify-awake", ["staged-process-contracts"]),
    { ruleFound: true, missing: [] },
  );
  assert.deepEqual(
    missingMakeDependencies("verify-awake:\n", "verify-awake", ["staged-process-contracts"]),
    { ruleFound: false, missing: ["staged-process-contracts"] },
  );
});
