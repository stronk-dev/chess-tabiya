import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const rfc = readFileSync("rfc/campaign-core.md", "utf8");
const design = readFileSync("design/06-campaign.md", "utf8");
const service = readFileSync("apps/server/src/service.ts", "utf8");
const normative = rfc.split("\n## Changelog\n", 1)[0];
const runsTable = normative.match(/CREATE TABLE campaign_runs \([\s\S]*?\n\) STRICT;/u)?.[0] ?? "";
const origin = normative.match(/type RunOrigin = \{[\s\S]*?\};/u)?.[0] ?? "";
const documentShape = normative.match(/CampaignDocument \{[\s\S]*?\n\}/u)?.[0] ?? "";

test("D2244 unfinished open submission receives progression", () => {
  assert.match(normative, /submitting an unfinished line is legal/u);
  assert.match(normative, /reward \*\*whatever the verdict\*\*/u);
  assert.match(normative, /non-absorbing fallback/u);
  assert.doesNotMatch(normative, /minimum (?:committed )?learner move/u);
});

test("D2245 create replay has no pre-run command authority", () => {
  assert.match(normative, /POST \/campaigns\/:campaignId\/runs/u);
  assert.match(normative, /ON campaign_events\(campaign_run_id, command_id\)/u);
  assert.doesNotMatch(runsTable, /command_id/u);
  assert.doesNotMatch(normative, /UNIQUE[^\n]*learner_id[^\n]*campaign_id[^\n]*command_id/u);
});

test("D2246 node start does not bind both aggregates atomically", () => {
  assert.match(normative, /nodes\/:nodeId\/start/u);
  assert.match(normative, /one play run with server-authored `RunOrigin`, or stored replay/u);
  assert.doesNotMatch(normative, /play-run creation[^.]{0,300}node_entered[^.]{0,300}same (?:database )?transaction/u);
});

test("D2247 the existing play-run deletion path has no campaign rule", () => {
  assert.match(service, /deleteRun\(/u);
  assert.match(normative, /active_encounter_run_id TEXT/u);
  assert.match(normative, /no FK by choice/u);
  assert.doesNotMatch(normative, /CAMPAIGN_ACTIVE_ENCOUNTER_DELETE/u);
});

test("D2248 run origin identifies but does not deliver earned modules", () => {
  assert.match(origin, /campaignRunId/u);
  assert.match(origin, /nodeId/u);
  assert.doesNotMatch(origin, /owned|equipped|suppressed|effective/u);
  assert.doesNotMatch(normative, /campaignModule(?:Query|Receipt|Delivery)|queryCampaignModules/u);
});

test("D2249 the complete boss is narrowed to an ordinary pack", () => {
  assert.match(normative, /every node is a \*\*shape-1 authored\s+encounter\*\* \(a drill pack\)/u);
  assert.match(normative, /Not a rated game/u);
  assert.match(design, /campaign boss is a full game, not a pack/u);
});

test("D2250 ruled catalogue progression remains only a discharge", () => {
  assert.match(design, /progression is\s+denominated in THE CATALOGUE/u);
  assert.match(normative, /D6 \| \*\*The \[\[D1151\]\] catalogue-progression surface/u);
  const criterion24 = normative.match(/24\. \*\*Official content[\s\S]*?\n25\./u)?.[0] ?? "";
  assert.doesNotMatch(criterion24, /shapes met|structures played|what's-missing/u);
});

test("D2251 durable rewards cannot alter a future run", () => {
  assert.match(normative, /completion_mark/u);
  assert.match(normative, /prestige_mark/u);
  assert.match(normative, /Durable rewards never\s+gate ordinary packs, theory, the standard campaign path or default starting tools/u);
  assert.match(normative, /Richer cross-run variety rewards[\s\S]*require a typed meta-reward registry/u);
});

test("D2252 official authoring requirements have no document fields", () => {
  assert.match(normative, /dependency availability matrix/u);
  assert.doesNotMatch(documentShape, /targetLearner|expectedEnvelope|coverage|provenance|availabilityMatrix/u);
});
