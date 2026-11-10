import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { createVitest } from "vitest/node";

import { CONTENT_CONTRACT_TESTS, PERFORMANCE_CONTRACT_TESTS, SERIAL_SOFTWARE_CONTRACT_TESTS } from "./test-tiers.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const excluded = new Set([...CONTENT_CONTRACT_TESTS, ...PERFORMANCE_CONTRACT_TESTS]);
const native = new Set(SERIAL_SOFTWARE_CONTRACT_TESTS);
const requiredGates = `software-scheduling-check typecheck test-software test-performance schema-check release-policy-check label-sweep component-theme-sweep component-coverage evidence-manifest-check evidence-value-authority semantic-validation-check semantic-evidence-check candidate-packet-projections-check opening-catalogue-check account-data-lifecycle-check learner-rating-bracket-check learner-rating-isolation-check style-registry-check capability-applicability-check capability-check capability-census capability-site-check capability-lifecycle-check migration-plan-check play-composition-matrix-contract guided-hint-latency-check make-toolchain-check`.split(" ");

test("D4187 the actual semantic software smoke runs from an empty directory without authored content", t => {
  const directory = mkdtempSync(join(tmpdir(), "tabiya-semantic-source-smoke-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const outfile = join(directory, "smoke.mjs");
  execFileSync(resolve(root, "node_modules/.bin/esbuild"), ["apps/server/src/semantic-evidence-check.ts", "--bundle", "--platform=node", "--format=esm", `--outfile=${outfile}`, "--log-level=warning"], { cwd: root });
  const result = JSON.parse(execFileSync(process.execPath, [outfile], { cwd: directory, encoding: "utf8" }));
  assert.equal(result.policy, "research.r2_candidate@3");
  assert.equal(result.researchSelection.legalAlternatives, 19);
  assert.equal(Object.hasOwn(result.researchSelection, "evaluatedAlternatives"), false);
  assert.equal(result.coverage.sources.length, 55);
  assert.deepEqual(result.coverage.unavailable, []);
  assert.equal(Object.hasOwn(result, "dependency"), false);
  assert.equal(CONTENT_CONTRACT_TESTS.includes("apps/server/src/semantic-content-dependencies.test.ts"), true);
});

test("focused software files use the normal Make toolchain without narrowing the full gate", () => {
  const files = "apps/server/src/drill-client-server.test.ts apps/server/src/pack-registry-validation.test.ts";
  const plan = execFileSync("make", ["--no-print-directory", "--dry-run", "test-software-files", `TEST_FILES=${files}`],
    { cwd: root, encoding: "utf8" });
  assert.ok(plan.includes(`tools/test-tier-check.mjs --software-files ${files}`));
  assert.ok(plan.includes(`pnpm test:software ${files}`));
  for (const target of ["test-software", "verify-software", "verify"]) {
    const full = execFileSync("make", ["--no-print-directory", "--dry-run", target, `TEST_FILES=${files}`],
      { cwd: root, encoding: "utf8" });
    assert.deepEqual(full.split("\n").filter(line => line.startsWith("pnpm test:software")),
      ["pnpm test:software"], `${target} remains the complete pool even with TEST_FILES set`);
  }
});

test("invalid focused Make selections fail before invoking the runner", () => {
  for (const files of ["", "--passWithNoTests", "apps/server/src/guidance.test.ts"]) {
    const result = spawnSync("make", ["--no-print-directory", "test-software-files", `TEST_FILES=${files}`],
      { cwd: root, encoding: "utf8" });
    assert.ifError(result.error);
    assert.equal(result.status, 2);
    assert.match(result.stderr, /test-tier-check failed/u);
    assert.ok(!result.stdout.includes("pnpm test:software"), "runner is not launched on a refused selection");
  }
});

function assertGateOrder(prerequisites) {
  assert.deepEqual([...prerequisites].sort(), [...requiredGates].sort(), "every existing gate exactly once");
  assert.equal(prerequisites[0], "make-toolchain-check", "toolchain refusal precedes verification work");
  assert.deepEqual(prerequisites.slice(-2), ["test-software", "test-performance"],
    "all deterministic contract checks precede the expensive, separately owned pools");
}

test("D3869 fast contracts precede expensive pools in the actual canonical Make plan", () => {
  const make = readFileSync(resolve(root, "Makefile"), "utf8");
  const prerequisites = [...make.matchAll(/^verify-software:(.*)$/gmu)].flatMap(match => match[1].trim().split(/\s+/u));
  assertGateOrder(prerequisites);
  for (const mutation of [
    prerequisites.filter(target => target !== "semantic-validation-check"),
    [...prerequisites, "capability-check"],
    ["test-software", ...prerequisites.filter(target => target !== "test-software")],
    [...prerequisites.filter(target => target !== "semantic-validation-check"), "semantic-validation-check"],
  ]) assert.throws(() => assertGateOrder(mutation));
  // Inspect Make's real expanded dependency/recipe plan, not a hand-built copy of that plan.
  const plan = execFileSync("make", ["--no-print-directory", "--dry-run", "verify-software"], { cwd: root, encoding: "utf8" });
  const software = plan.indexOf("pnpm test:software"), performance = plan.indexOf("pnpm test:performance");
  assert.ok(software >= 0 && performance > software, "both complete pools remain, in isolated order");
  for (const command of ["tools/make-toolchain.test.mjs", "pnpm typecheck", "tools/structural-convention-schemas.mjs", "pnpm schema:check",
    "tools/semantic-validation/dist/semantic-validation-build.mjs --check",
    "tools/generate-candidate-packet-projections.mjs --check", "apps/server/dist/capability-contract.js check"]) {
    const before = plan.indexOf(command);
    assert.ok(before >= 0 && before < software, `${command} precedes the actual software invocation`);
  }
});

test("the canonical software rule retains scheduling and all existing execution", () => {
  const make = readFileSync(resolve(root, "Makefile"), "utf8");
  const prerequisites = /^verify-software:(.*)$/mu.exec(make)?.[1].trim().split(/\s+/u);
  assert.ok(prerequisites?.includes("software-scheduling-check"));
  for (const target of ["test-software", "test-performance", "capability-check", "play-composition-matrix-contract"]) assert.ok(prerequisites.includes(target), target);
});

test("D3869 an actual failing contract prevents both pools; the old ordering cannot", () => {
  const source = readFileSync(resolve(root, "Makefile"), "utf8");
  const prerequisites = [...source.matchAll(/^verify-software:(.*)$/gmu)].flatMap(match => match[1].trim().split(/\s+/u));
  const directory = mkdtempSync(join(tmpdir(), "tabiya-software-order-"));
  try {
    const base = join(directory, "Makefile"), overrides = join(directory, "recipes.mk");
    // Keep the real Make dependency graph. Replace only its recipe work with visible markers
    // and one deterministic refusal; never run the expensive pools to prove they were skipped.
    writeFileSync(overrides, prerequisites.map(target => `${target}:\n\t@echo ${target}\n\t@${target === "semantic-validation-check" ? "exit 17" : ":"}\n`).join("\n")
      // Keep schema-check's real dependency edge while replacing its new nested recipe too.
      + "\nstructural-convention-schemas-check:\n\t@:\n");
    const run = text => {
      writeFileSync(base, text);
      const result = spawnSync("make", ["--no-print-directory", "-s", "-f", base, "-f", overrides, "verify-software"],
        { cwd: root, encoding: "utf8", env: { ...process.env, MAKEFLAGS: "" } });
      assert.ifError(result.error);
      assert.equal(result.status, 2, "Make must propagate the contract's failing status");
      assert.match(result.stderr, /semantic-validation-check.*17/u);
      return result.stdout.trim().split("\n");
    };
    const observed = run(source);
    assert.deepEqual(observed, prerequisites.slice(0, prerequisites.indexOf("semantic-validation-check") + 1));
    assert.ok(!observed.includes("test-software") && !observed.includes("test-performance"));
    const costlyFirst = source.replace(/^verify-software:.*$/mu,
      `verify-software: test-software ${prerequisites.filter(target => target !== "test-software").join(" ")}`);
    assert.ok(run(costlyFirst).includes("test-software"), "the predecessor-order mutation really executes the costly pool marker");
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

function assertScheduling(rows, expected) {
  const expectedNative = new Set([
    "apps/server/src/application-startup-cleanup.test.ts",
    "apps/server/src/review-map.test.ts",
    "apps/server/src/longitudinal-worker.test.ts",
    "apps/server/src/longitudinal-predecessor-upgrade.test.ts",
    "apps/server/src/longitudinal-successor-upgrade.test.ts",
    "apps/server/src/longitudinal-worker-start.test.ts",
    "apps/server/src/learner-profile-application.test.ts",
  ]);
  assert.deepEqual([...native].sort(), [...expectedNative].sort(), "only the seven primary native-worker owners run serially");
  assert.deepEqual(rows.map(row => row.path).sort(), [...expected].sort(), "complete software population, exactly once");
  for (const row of rows) {
    const serial = expectedNative.has(row.path);
    assert.equal(row.project, serial ? "native-startup" : "software");
    assert.equal(row.order, serial ? 1 : 0, "native ownership runs after the main pool");
    assert.equal(row.workers, serial ? 1 : 2);
    assert.equal(row.timeout, 5000, "no global timeout inflation");
  }
}

test("content case collection belongs only to the actual content Make gate", () => {
  const content = execFileSync("make", ["--no-print-directory", "--dry-run", "test-content"], { cwd: root, encoding: "utf8" });
  const collector = content.indexOf("tools/content-scheduling.test.mjs");
  assert.ok(collector >= 0 && collector < content.indexOf("pnpm test:content"));
  const software = execFileSync("make", ["--no-print-directory", "--dry-run", "verify-software"], { cwd: root, encoding: "utf8" });
  assert.ok(!software.includes("tools/content-scheduling.test.mjs"), "software verification does not execute authored case collection");
});

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
    console.log(`software scheduling: ${rows.length} files, ${rows.filter(row => native.has(row.path)).length} serial native files; no omitted or duplicated cases`);
    const index = rows.findIndex(row => row.path === "apps/server/src/review-map.test.ts");
    for (const mutation of ["missing", "duplicate", "overlap", "workers", "timeout", "membership"]) {
      const changed = rows.map(row => ({ ...row }));
      if (mutation === "missing") changed.splice(index, 1);
      if (mutation === "duplicate") changed.push({ ...changed[index] });
      if (mutation === "overlap") changed[index].order = 0;
      if (mutation === "workers") changed[index].workers = 2;
      if (mutation === "timeout") changed[index].timeout = 15000;
      if (mutation === "membership") Object.assign(changed[index], { project: "software", order: 0, workers: 2 });
      assert.throws(() => assertScheduling(changed, expected), undefined, mutation);
    }
  } finally {
    await Promise.all(contexts.map(context => context.close()));
  }
});
