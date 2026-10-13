import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

function bodies(text) {
  const file = ts.createSourceFile("arrival.ts", text, ts.ScriptTarget.Latest, true);
  return Object.fromEntries(file.statements.filter(node => ts.isFunctionDeclaration(node) && node.name && ["observeWarmArrival", "waitForPlayableBoard"].includes(node.name.text)).map(node => [node.name.text, node.body.getText(file)]));
}

test("shared arrival helpers preserve both committed readiness/geometry function bodies exactly", () => {
  const previous = execFileSync("git", ["show", "375a0704:tests/browser/arrival-latency.spec.ts"], { encoding: "utf8" });
  const support = readFileSync("tests/browser/arrival-test-support.ts", "utf8");
  assert.deepEqual(bodies(support), bodies(previous));
  assert.equal(Object.keys(bodies(support)).length, 2);
  const ordinary = readFileSync("tests/browser/arrival-latency.spec.ts", "utf8");
  assert.match(ordinary, /await open\.click\(\);\s+await waitForMeasuredPlayableBoard\(warmPage\);/u);
  assert.match(ordinary, /const SAMPLES = 5;/u);
  assert.match(ordinary, /const WARM_BUDGET_MS = 250;/u);
});
