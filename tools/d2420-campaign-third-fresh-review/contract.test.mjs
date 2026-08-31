import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  campaignAssistanceAuthority,
  campaignReviewProjection,
  campaignStore,
  createCampaignRunExactlyOnce,
  deleteOwnedRunCampaignAware,
  officialDocument,
  startCampaignEncounterExactlyOnce,
  validateOfficialCampaign,
} from "../d2244-campaign-author-repair/model.mjs";

const rfc = readFileSync("rfc/campaign-core.md", "utf8");
const accountRfc = readFileSync("rfc/archive/portable-account-data.md", "utf8");
const normative = rfc.split("\n## Changelog\n", 1)[0];
const eventsDdl = normative.match(/CREATE TABLE campaign_events \([\s\S]*?\n\) STRICT;/u)?.[0] ?? "";
const errorCode = (operation) => {
  try { operation(); } catch (error) { return error.message; }
  return null;
};

function startedStore() {
  const store = campaignStore();
  createCampaignRunExactlyOnce(store, {
    learnerId: "learner", campaignId: "campaign", campaignVersion: 1,
    commandId: "create-000001", generatedRunId: "campaign-run", documentDigest: "sha256:doc",
  });
  startCampaignEncounterExactlyOnce(store, {
    learnerId: "learner", campaignRunId: "campaign-run", nodeId: "act1-node",
    expectedRevision: 1, commandId: "start-000001", generatedPlayRunId: "play-run",
  });
  return store;
}

test("D2420 promised active-run uniqueness is absent from the normative DDL", () => {
  assert.match(normative, /partial unique index in the migration/u);
  assert.match(normative, /CREATE INDEX idx_campaign_runs_learner\s+ON campaign_runs\(learner_id, status\)/u);
  assert.doesNotMatch(normative, /CREATE UNIQUE INDEX[\s\S]{0,180}campaign_runs[\s\S]{0,180}WHERE\s+status\s*=\s*['"]active['"]/u);
});

test("D2421 campaign events emitted by the author model cannot satisfy expected_revision NOT NULL", () => {
  assert.match(eventsDdl, /expected_revision INTEGER NOT NULL/u);
  const store = startedStore();
  const created = store.campaignEvents.find((event) => event.kind === "campaign_created");
  const entered = store.campaignEvents.find((event) => event.kind === "node_entered");
  assert.equal(created?.expectedRevision, undefined);
  assert.equal(entered?.expectedRevision, undefined);
  assert.match(normative, /after creation, an expected integer event\s+revision/u);
});

test("D2422 replay depends on author-only fields absent from campaign_events storage", () => {
  assert.doesNotMatch(eventsDdl, /operands_digest|result_payload/u);
  const store = startedStore();
  const enteredIndex = store.campaignEvents.findIndex((event) => event.kind === "node_entered");
  const entered = store.campaignEvents[enteredIndex];
  store.campaignEvents[enteredIndex] = {
    campaignRunId: entered.campaignRunId,
    seq: entered.seq,
    kind: entered.kind,
    commandId: entered.commandId,
    expectedRevision: 1,
    payload: structuredClone(entered.payload),
  };
  assert.equal(errorCode(() => startCampaignEncounterExactlyOnce(store, {
    learnerId: "learner", campaignRunId: "campaign-run", nodeId: "act1-node",
    expectedRevision: 1, commandId: "start-000001", generatedPlayRunId: "ignored",
  })), "CAMPAIGN_COMMAND_REUSED");
});

function assistanceInput(overrides = {}) {
  return {
    learnerId: "learner",
    expectedPlayRunId: "play-run",
    playRun: { id: "play-run", origin: { kind: "campaign_encounter", campaignRunId: "campaign-run",
      nodeId: "act1-node", campaignDocumentDigest: "sha256:doc" } },
    campaignRun: { id: "campaign-run", learnerId: "learner", revision: 9, documentDigest: "sha256:doc",
      modules: { owned: ["guided_hint"], equipped: ["guided_hint"] },
      theory: { owned: [{ id: "passage", authorizingModuleId: "guided_hint", sourceId: "theory-source",
        applicable: false, directness: "move" }] } },
    node: { id: "act1-node", suppress: [] },
    sourceAvailable: ["guided_hint", "theory-source"],
    presetModules: ["guided_hint"],
    contextCeiling: ["guided_hint"],
    ...overrides,
  };
}

test("D2423 owned theory is authorized without applicability or disclosure inputs", () => {
  const receipt = campaignAssistanceAuthority(assistanceInput());
  assert.deepEqual(receipt.authorizedTheory.map((passage) => passage.id), ["passage"]);
  assert.doesNotMatch(campaignAssistanceAuthority.toString(), /applicab|disclos|directness/u);
  assert.match(normative, /applicable\s+= compileApplicabilityResult/u);
  assert.match(normative, /disclosable\s+= passage directness/u);
});

test("D2424 a sealed early encounter is widened by the campaign's current revision", () => {
  const receipt = campaignAssistanceAuthority(assistanceInput());
  assert.equal(receipt.revision, 9);
  assert.deepEqual(receipt.effectiveModules, ["guided_hint"]);
  assert.equal("eventSeq" in receipt, false);
  assert.equal("inventoryRevisionAtEncounter" in receipt, false);
  assert.match(normative, /active or\s+sealed node\/run identity/u);
});

test("D2425 official metadata accepts self-labelled phases and ghost node joins", () => {
  const document = officialDocument();
  document.publication.curriculum.phaseCoverage = {
    opening: ["o1"], middlegame: ["o1"], endgame: ["o1"],
  };
  document.publication.curriculum.theoryProvenance[0].nodeId = "ghost-node";
  document.publication.curriculum.dependencyAvailability[0].requiredAt = ["ghost-node"];
  const issues = validateOfficialCampaign(document, {
    brackets: new Set(["club"]), passages: new Set(["bundle/p1"]), evidence: new Set(["ev1"]),
    requirements: new Set(["module.guided_hint"]), operations: new Set(["module.guided_hint@1"]),
  });
  assert.deepEqual(issues, ["CAMPAIGN_REVIEW_DIGEST_MISMATCH"]);
});

test("D2426 campaign requires account restore and merge that the accepted parent refuses", () => {
  assert.match(accountRfc, /No account-import route, parser or UI is added/u);
  assert.match(normative, /Export→delete→restore round trip|export→delete→restore round trip/iu);
  assert.match(normative, /Account merge\s+cannot silently choose/u);
});

test("D2427 abandon-then-delete leaves no typed history projection", () => {
  const store = startedStore();
  store.campaignRuns[0].status = "abandoned";
  store.campaignRuns[0].activeEncounterRunId = null;
  store.campaignEvents.push({ campaignRunId: "campaign-run", seq: 3, kind: "campaign_abandoned",
    commandId: "abandon-000001", payload: {} });
  deleteOwnedRunCampaignAware(store, { learnerId: "learner", playRunId: "play-run" });
  assert.equal(errorCode(() => campaignReviewProjection(store, {
    campaignRunId: "campaign-run", nodeId: "act1-node",
  })), "CAMPAIGN_NODE_UNAVAILABLE");
  assert.match(normative, /may submit\/leave the encounter or abandon the\s+CampaignRun first/u);
});
