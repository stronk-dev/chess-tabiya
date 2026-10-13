import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { createVitest } from "vitest/node";

import { CONTENT_CONTRACT_TESTS, PERFORMANCE_CONTRACT_TESTS, SERIAL_SOFTWARE_CONTRACT_TESTS } from "./test-tiers.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const excluded = new Set([...CONTENT_CONTRACT_TESTS, ...PERFORMANCE_CONTRACT_TESTS]);
const native = new Set(SERIAL_SOFTWARE_CONTRACT_TESTS);

test("the canonical software rule retains scheduling and all existing execution", () => {
  const make = readFileSync(resolve(root, "Makefile"), "utf8");
  const prerequisites = /^verify-software:(.*)$/mu.exec(make)?.[1].trim().split(/\s+/u);
  assert.ok(prerequisites?.includes("software-scheduling-check"));
  for (const target of ["test-software", "test-performance", "capability-check", "play-composition-matrix-contract"]) assert.ok(prerequisites.includes(target), target);
});

function assertScheduling(rows, expected) {
  assert.deepEqual(rows.map(row => row.path).sort(), [...expected].sort(), "complete software population, exactly once");
  for (const row of rows) {
    const serial = native.has(row.path);
    assert.equal(row.project, serial ? "native-startup" : "software");
    assert.equal(row.order, serial ? 1 : 0, "native ownership runs after the main pool");
    assert.equal(row.workers, serial ? 1 : 2);
    assert.equal(row.timeout, 5000, "no global timeout inflation");
  }
}

test("actual Vitest discovery preserves every software file and orders native ownership separately", async () => {
  const contexts = [];
  try {
    const all = await createVitest("test", { root, config: resolve(root, "vitest.config.ts"), watch: false });
    contexts.push(all);
    const expected = (await all.globTestSpecifications()).map(spec => relative(root, spec.moduleId)).filter(path => !excluded.has(path));
    const software = await createVitest("test", { root, config: resolve(root, "vitest.software.config.ts"), watch: false });
    contexts.push(software);
    const rows = (await software.globTestSpecifications()).map(spec => ({
      path: relative(root, spec.moduleId), project: spec.project.name,
      order: spec.project.config.sequence.groupOrder, workers: spec.project.config.maxWorkers,
      timeout: spec.project.config.testTimeout,
    }));
    assertScheduling(rows, expected);
    assert.ok(SERIAL_SOFTWARE_CONTRACT_TESTS.every(path => rows.some(row => row.path === path)));
    console.log(`software scheduling: ${rows.length} files, ${rows.filter(row => native.has(row.path)).length} serial native file; no omitted or duplicated cases`);
    const index = rows.findIndex(row => native.has(row.path));
    for (const mutation of ["missing", "duplicate", "overlap", "workers", "timeout"]) {
      const changed = rows.map(row => ({ ...row }));
      if (mutation === "missing") changed.splice(index, 1);
      if (mutation === "duplicate") changed.push({ ...changed[index] });
      if (mutation === "overlap") changed[index].order = 0;
      if (mutation === "workers") changed[index].workers = 2;
      if (mutation === "timeout") changed[index].timeout = 15000;
      assert.throws(() => assertScheduling(changed, expected), undefined, mutation);
    }
  } finally {
    await Promise.all(contexts.map(context => context.close()));
  }
});
