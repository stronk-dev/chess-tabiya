// Read-only replay: the saved HTTP population is not a default-on latency verdict.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { checkReceipt } from "./receipt.mjs";

const path = process.argv[2];
assert(path, "usage: node tools/d3497-hint-latency/verify.mjs <receipt.json>");
const planPath = "tools/d3497-hint-latency/plan.json";
const receipt = JSON.parse(readFileSync(path, "utf8"));
const plan = JSON.parse(readFileSync(planPath, "utf8"));
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
assert.equal(receipt.sampleMode, "receipt", "a smoke run cannot stand in for the full population");
for (const [source, expected] of Object.entries(receipt.sourceDigests)) {
  assert.equal(hash(readFileSync(source)), expected, `measured source changed: ${source}; this is a historical receipt, not current latency`);
}
assert.equal(receipt.sourceDigests[planPath], hash(readFileSync(planPath)));
const checked = checkReceipt(receipt, plan);
const voice = receipt.summary.find(row => row.cell === "mate/voice_timeout/pattern");
const maximumPostP95 = Math.max(...receipt.summary.map(row => row.postMs.p95));
console.log(JSON.stringify({
  path, sha256: hash(readFileSync(path)), ...checked,
  maximumPostP95Ms: maximumPostP95,
  voiceTimeoutDependenciesToHttpP95Ms: voice.mandatoryDependenciesToHttpMs.p95,
  pendingHttpBudgetSatisfied: maximumPostP95 <= plan.bounds.honestPendingP95Ms,
  deterministicHttpBudgetSatisfied: receipt.summary.every(row => row.mandatoryDependenciesToHttpMs.p95 <= plan.bounds.dependenciesToRenderedRungP95Ms),
  browserPaint: "not_measured", d7Discharged: false,
  note: "checker acceptance validates population/identity structure, not the latency budget or full RFC",
}, null, 2));
