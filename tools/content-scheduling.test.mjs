import assert from "node:assert/strict";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { createVitest } from "vitest/node";
import { FIVE_SECOND_CONTENT_TESTS } from "./test-tiers.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

function assertMovedContentCases(rows) {
  assert.equal(rows.length, 64, "all authored cases remain collected");
  assert.deepEqual([...new Set(rows.map(row => row.path))].sort(), [...FIVE_SECOND_CONTENT_TESTS].sort());
  for (const row of rows) {
    assert.equal(row.timeout, 5000, `${row.path}: ${row.name} retains its original deadline`);
    assert.equal(row.mode, "run", `${row.path}: ${row.name} is not skipped or focused`);
  }
}

test("D3938 actual moved content cases retain their full population and five-second deadlines", async () => {
  const content = await createVitest("test", { root, config: resolve(root, "vitest.content.config.ts"), watch: false });
  try {
    const paths = new Set(FIVE_SECOND_CONTENT_TESTS);
    const specifications = (await content.globTestSpecifications()).filter(spec => paths.has(relative(root, spec.moduleId)));
    const result = await content.collectTests(specifications);
    assert.deepEqual(result.unhandledErrors, []);
    assert.equal(result.testModules.length, paths.size);
    const rows = result.testModules.flatMap(module => {
      assert.ok(module.ok(), module.moduleId);
      return [...module.children.allTests()].map(item => ({ path: relative(root, module.moduleId),
        name: item.fullName, timeout: item.options.timeout, mode: item.options.mode }));
    });
    assertMovedContentCases(rows);
    const extended = rows.map(row => ({ ...row }));
    extended[0].timeout = 30000;
    assert.throws(() => assertMovedContentCases(extended));
    assert.throws(() => assertMovedContentCases(rows.slice(1)));
    assert.throws(() => assertMovedContentCases(rows.map((row, index) => index === 0 ? { ...row, mode: "skip" } : row)));
    console.log(`moved content: ${rows.length} cases/${paths.size} files, unchanged 5000ms deadlines, no omitted or skipped cases`);
  } finally { await content.close(); }
});
