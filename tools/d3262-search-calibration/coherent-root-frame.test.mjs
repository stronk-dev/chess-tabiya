import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { compileCoherentRootFrame } from "./coherent-root-frame.mjs";

const directory = "planning/semantic-consequence-search/";
const source = (name) => JSON.parse(readFileSync(`${directory}${name}.json`));
const engine = source("d3262-stockfish-root-coherent-all");
const maia = source("d3262-maia-capture");
const baseline = source("d3262-root-frame");

test("corrected root frame preserves controls and freezes 193 source-selected candidates", () => {
  const result = compileCoherentRootFrame(engine, maia, baseline, {});
  assert.deepEqual(result.comparison, { oldCandidates: 196, candidates: 193, rootsChanged: 7, added: 3, dropped: 6 });
  assert.equal(result.roots.length, 66);
  assert.equal(result.profile, "d3262-coherent-root-v1");
});

test("crossed root source and shifted candidate population fail closed", () => {
  const crossed = structuredClone(engine); crossed.rows[0].rootId = "other";
  assert.throws(() => compileCoherentRootFrame(crossed, maia, baseline, {}), /Crossed coherent root/);
  const widened = structuredClone(engine);
  const probe = widened.rows[0].probes[0];
  probe.entries[0].rank = 2;
  probe.entries[1].rank = 1;
  assert.throws(() => compileCoherentRootFrame(widened, maia, baseline, {}), /Corrected candidate population drifted/);
});
