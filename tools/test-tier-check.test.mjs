import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";

import { validateFocusedTestCommands, validateTestTiers } from "./test-tier-check.mjs";

test("focused commands cannot name tests excluded by their selected tier", () => {
  const content = "apps/server/src/guidance.test.ts";
  const performance = "apps/server/src/opening-catalogue-performance.test.ts";
  const software = "apps/web/src/lib/human-evidence-response.test.ts";
  for (const [config, omitted] of [
    ["software", content], ["software", performance],
    ["content", software], ["performance", software], ["performance", content],
  ]) {
    const errors = validateFocusedTestCommands(`focused-check:\n\t./node_modules/.bin/vitest run --config vitest.${config}.config.ts ${omitted}\n`);
    assert.equal(errors.length, 1);
    assert.match(errors[0], /Makefile:2.*excludes/u);
    assert.ok(errors[0].includes(omitted));
  }
});

test("focused commands retain correct tier assignments, quoted paths and line continuations", () => {
  assert.deepEqual(validateFocusedTestCommands([
    "focused-check:",
    '\t./node_modules/.bin/vitest run --config=vitest.content.config.ts "apps/server/src/guidance.test.ts"',
    "\t./node_modules/.bin/vitest run --config vitest.software.config.ts \\",
    "\t  apps/web/src/lib/human-evidence-response.test.ts",
    "\t./node_modules/.bin/vitest run --config vitest.performance.config.ts apps/server/src/opening-catalogue-performance.test.ts",
    "\t./node_modules/.bin/vitest run --config tools/disposable/vitest.config.ts tools/disposable/probe.test.ts",
  ].join("\n")), []);
  assert.equal(validateFocusedTestCommands("\tvitest run --config vitest.software.config.ts \\\n\t apps/server/src/guidance.test.ts").length, 1);
  const followingContinuation = "focused-check:\n\tvitest run --config vitest.software.config.ts \\\n\t apps/web/src/lib/human-evidence-response.test.ts\n\tvitest run --config vitest.software.config.ts apps/server/src/guidance.test.ts\n";
  assert.match(validateFocusedTestCommands(followingContinuation)[0], /^Makefile:4:/u);
});

test("repository tier validation includes the literal focused Makefile commands", (t) => {
  const root = mkdtempSync(join(tmpdir(), "tabiya-test-tier-"));
  t.after(() => rmSync(root, { recursive: true }));
  mkdirSync(join(root, "apps/example"), { recursive: true });
  mkdirSync(join(root, "packages/example"), { recursive: true });
  writeFileSync(join(root, "Makefile"), "focused-check:\n\tvitest run --config vitest.software.config.ts apps/server/src/guidance.test.ts\n");
  assert.equal(validateTestTiers(root).filter(error => error.startsWith("Makefile:")).length, 1);
});

test("a test that reads the real corpus cannot silently enter the software tier", (t) => {
  const root = mkdtempSync(join(tmpdir(), "tabiya-test-tier-"));
  t.after(() => rmSync(root, { recursive: true }));
  mkdirSync(join(root, "apps/example"), { recursive: true });
  mkdirSync(join(root, "packages/example"), { recursive: true });
  writeFileSync(join(root, "apps/example/leak.test.ts"), 'readFileSync("content/drafts/a.json")\n');
  assert.deepEqual(validateTestTiers(root).filter((error) => error.includes("leak.test.ts")), [
    "real-content test is not assigned to the content tier: apps/example/leak.test.ts",
  ]);
});

test("a named performance test cannot silently enter the generic software pool", (t) => {
  const root = mkdtempSync(join(tmpdir(), "tabiya-test-tier-"));
  t.after(() => rmSync(root, { recursive: true }));
  mkdirSync(join(root, "apps/example"), { recursive: true });
  mkdirSync(join(root, "packages/example"), { recursive: true });
  writeFileSync(join(root, "apps/example/lookup-performance.test.ts"), "performance.now()\n");
  assert.deepEqual(validateTestTiers(root).filter((error) => error.includes("lookup-performance")), [
    "performance test is not assigned to the performance tier: apps/example/lookup-performance.test.ts",
  ]);
});

test("a whole-corpus census cannot silently enter the software tier", (t) => {
  const root = mkdtempSync(join(tmpdir(), "tabiya-test-tier-"));
  t.after(() => rmSync(root, { recursive: true }));
  mkdirSync(join(root, "apps/example"), { recursive: true });
  mkdirSync(join(root, "packages/example"), { recursive: true });
  writeFileSync(join(root, "apps/example/reach.test.ts"), "await constructReachReport()\n");
  assert.deepEqual(validateTestTiers(root).filter((error) => error.includes("reach.test.ts")), [
    "real-content test is not assigned to the content tier: apps/example/reach.test.ts",
  ]);
});
