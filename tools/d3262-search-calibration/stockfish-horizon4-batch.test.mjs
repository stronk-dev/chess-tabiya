import assert from "node:assert/strict";
import test from "node:test";

import { chunkPlan } from "./stockfish-horizon4-batch.mjs";

test("the full next-layer frame has disjoint gap-free resumable intervals", () => {
  const plan = chunkPlan(2185);
  assert.equal(plan.length, 88);
  assert.deepEqual(plan[0], { index: 0, start: 0, count: 25, file: "chunk-0000-0024.json" });
  assert.deepEqual(plan.at(-1), { index: 87, start: 2175, count: 10, file: "chunk-2175-2184.json" });
  assert.equal(plan.reduce((sum, chunk) => sum + chunk.count, 0), 2185);
  for (let index = 1; index < plan.length; index += 1) assert.equal(plan[index].start, plan[index - 1].start + plan[index - 1].count);
});

test("invalid chunk requests cannot produce a plausible partial frame", () => {
  assert.throws(() => chunkPlan(0), /Invalid capture chunk plan/u);
  assert.throws(() => chunkPlan(10, 0), /Invalid capture chunk plan/u);
});
