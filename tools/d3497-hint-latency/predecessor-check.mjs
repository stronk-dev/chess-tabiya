// Preserve the rejected experiment; never make it green by relabelling its outcome.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { checkReceipt } from "../../planning/provider-exchange-and-execution/hint-latency-predecessor-2026-10-06/receipt.mjs";

const prefix = "planning/provider-exchange-and-execution/";
const raw = readFileSync(`${prefix}hint-latency-http-pre-module-control-repair-2026-10-06.json`);
assert.equal(createHash("sha256").update(raw).digest("hex"), "60bab607cb170bb7378e8d57136bdecafdca47da9a007aefe2f0c0b9255ff0e3");
const receipt = JSON.parse(raw);
const plan = JSON.parse(readFileSync(`${prefix}hint-latency-predecessor-2026-10-06/plan.json`));
assert.equal(plan.version, 1);
for (const name of ["plan.json", "capture.ts", "receipt.mjs"]) {
  const bytes = readFileSync(`${prefix}hint-latency-predecessor-2026-10-06/${name}`);
  assert.equal(createHash("sha256").update(bytes).digest("hex"), receipt.sourceDigests[`tools/d3497-hint-latency/${name}`]);
}
assert.equal(receipt.rows.length, 880); assert.equal(receipt.baselines.length, 60);
assert.throws(() => checkReceipt(receipt, plan), /independent modules were suppressed rather than delivered/u);
const off = receipt.rows.filter(row => row.arm === "source_off");
assert.equal(off.length, 20);
for (const row of off) {
  assert.equal(row.state, "source_unavailable");
  assert.deepEqual(row.modules.body.page.packets.map(packet => packet.module), ["theory_breadcrumb"]);
  assert(row.modules.body.page.suppressions.some(item => item.module === "structure_nudge" && item.reason === "not_effective"));
}
console.log("D3497 predecessor: unchanged 880 rows/60 baselines; all twenty module-control failures remain rejected, with matching frozen instrument images");
