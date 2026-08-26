import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";

import { validateTestTiers } from "./test-tier-check.mjs";

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
