import assert from "node:assert/strict";
import test from "node:test";

import { selectCoherentTopEntries } from "./stockfish-coherent-table.mjs";

const entry = (depth, rank, moveUci) => ({ depth, rank, moveUci });

test("an unfinished deeper iteration cannot splice new moves into a shallower complete rank table", () => {
  const reported = [
    entry(8, 1, "a2a3"), entry(8, 2, "b2b3"), entry(8, 3, "c2c3"),
    entry(9, 1, "b2b3"), entry(9, 2, "a2a3"),
  ];
  const result = selectCoherentTopEntries(reported, 3);
  assert.deepEqual(result.entries.map((value) => [value.rank, value.moveUci]), [[1, "a2a3"], [2, "b2b3"], [3, "c2c3"]]);
  assert.equal(result.coherentDepth, 8);
  assert.equal(result.trailingPartialDepth, 9);
});

test("the latest complete depth wins; duplicate move/rank and missing rank fail closed", () => {
  const reported = [
    entry(8, 1, "a2a3"), entry(8, 2, "b2b3"),
    entry(9, 1, "b2b3"), entry(9, 2, "a2a3"),
  ];
  assert.equal(selectCoherentTopEntries(reported, 2).coherentDepth, 9);
  assert.throws(() => selectCoherentTopEntries([entry(8, 1, "a2a3"), entry(8, 2, "a2a3")], 2), /no complete coherent/u);
  assert.throws(() => selectCoherentTopEntries([entry(8, 1, "a2a3")], 2), /no complete coherent/u);
});
