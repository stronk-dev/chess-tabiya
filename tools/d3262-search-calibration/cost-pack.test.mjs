import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { verifyPackedCostValue } from "./cost-pack.mjs";
const read = () => JSON.parse(gunzipSync(readFileSync("planning/semantic-consequence-search/d3262-cost-live-pv-initial-2026-10-06.json.gz")));
test("retained six-row live package passes receipt checks without claiming full population", () => {
  const result = verifyPackedCostValue(read()); assert.equal(result.admittedRows, 6); assert.equal(result.complete, false);
});
for (const [name, mutate] of [
  ["source snapshot", p => p.sourceSnapshot["cost-batch.mjs"] = "AA=="],
  ["missing source", p => delete p.sourceSnapshot["cost-batch.mjs"]],
  ["compressed bytes", p => p.groups[0].base64 = "AA=="],
  ["group digest", p => p.groups[0].digest = "sha256:wrong"],
  ["filtered group", p => p.groups.pop()],
  ["duplicate group", p => p.groups.push(p.groups[0])],
  ["case order", p => p.metadata.cases.reverse()],
  ["input pin", p => p.metadata.inputs["d3262-coherent-root-frame.json"] = "sha256:wrong"],
  ["complete claim", p => p.summary.complete = true],
  ["declared range", p => p.metadata.limit = 3],
]) test(`refuses changed ${name}`, () => { const value = read(); mutate(value); assert.throws(() => verifyPackedCostValue(value)); });
