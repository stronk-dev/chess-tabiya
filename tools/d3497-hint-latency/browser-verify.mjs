// Saved browser receipt replay, not a machine-specific CI timing gate.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { checkBrowserReceipt } from "./browser-receipt.mjs";
import { checkSourceOffControl } from "./source-off-check.mjs";
const path = process.argv[2];
assert(path, "usage: browser-verify.mjs receipt.json");
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const receipt = JSON.parse(readFileSync(path, "utf8"));
const plan = JSON.parse(readFileSync("tools/d3497-hint-latency/browser-plan.json", "utf8"));
const base = JSON.parse(readFileSync(plan.basePlan, "utf8"));
assert.equal(receipt.sampleMode, "receipt", "smoke is not full population evidence");
for (const [source, expected] of Object.entries(receipt.sourceDigests)) assert.equal(hash(readFileSync(source)), expected, `source drift: ${source}; receipt is historical`);
const checked = checkBrowserReceipt(receipt, plan, base);
for (const row of receipt.rows.filter(row => row.arm === "source_off")) checkSourceOffControl(row);
const measured = receipt.summary.filter(cell => cell.clickToHonestMs !== null);
const rendered = measured.filter(cell => Object.keys(cell.states).length === 1 && cell.states.available === receipt.samples);
const unavailable = receipt.rows.filter(row => row.boundary !== "browser");
console.log(JSON.stringify({ path, sha256: hash(readFileSync(path)), ...checked,
  measuredRows: receipt.rows.length - unavailable.length,
  nonBrowserRows: unavailable.length,
  pendingBudgetSatisfied: measured.every(cell => cell.clickToHonestMs.p95 <= plan.bounds.honestPendingP95Ms),
  renderedBudgetSatisfied: rendered.every(cell => cell.dependenciesToFrameUpperMs.p95 <= plan.bounds.dependenciesToRenderedRungP95Ms),
  renderedFailures: rendered.filter(cell => cell.dependenciesToFrameLowerMs.p95 > plan.bounds.dependenciesToRenderedRungP95Ms).map(cell => ({ cell: cell.cell, p95LowerMs: cell.dependenciesToFrameLowerMs.p95, p95UpperMs: cell.dependenciesToFrameUpperMs.p95 })),
  measurement: receipt.measurement, d7Discharged: false,
  note: "Structure acceptance is not a budget pass, all-five-rung answer or owner-device validation. Saved build hashes identify capture artifacts; they are not recompiled on replay.",
}, null, 2));
