import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  campaignAssistanceAuthority,
  campaignReviewProjection,
  campaignStore,
  createCampaignRunExactlyOnce,
  deleteOwnedRunCampaignAware,
  deriveCampaignParticipationWitness,
  officialDocument,
  startCampaignEncounterExactlyOnce,
  validateOfficialCampaign,
} from "./model.mjs";

const rfc = readFileSync("rfc/campaign-core.md", "utf8");
const closure = readFileSync("planning/campaign/1.0-closure-map.md", "utf8");
const normative = rfc.split("\n## Changelog\n", 1)[0];
const errorCode = (operation) => { try { operation(); } catch (error) { return error.message; } return null; };
const createInput = (overrides = {}) => ({ learnerId: "l1", campaignId: "c1", campaignVersion: 2,
  commandId: "create-000001", generatedRunId: "cr1", documentDigest: "sha256:doc", ...overrides });
const startedStore = () => {
  const store = campaignStore();
  createCampaignRunExactlyOnce(store, createInput());
  startCampaignEncounterExactlyOnce(store, { learnerId: "l1", campaignRunId: "cr1", nodeId: "n1",
    expectedRevision: 1, commandId: "start-000001", generatedPlayRunId: "pr1" });
  return store;
};

test("D2244 requires learner play plus a consequence completion witness without grading it", () => {
  const played = [{ seq: 1, nodeId: "root", type: "run.started" },
    { seq: 2, nodeId: "e4", type: "move.committed", actor: "user" },
    { seq: 3, nodeId: "e5", type: "move.committed", actor: "system" }];
  assert.deepEqual(deriveCampaignParticipationWitness({ path: played, tipState: "failed", atAuthoredBoundary: false }),
    { learnerMoveEventSeq: 2, consequenceTipNodeId: "e5", completion: "objective_absorbing" });
  assert.deepEqual(deriveCampaignParticipationWitness({ path: played, tipState: "degraded", atAuthoredBoundary: true }),
    { learnerMoveEventSeq: 2, consequenceTipNodeId: "e5", completion: "authored_boundary" });
  assert.equal(errorCode(() => deriveCampaignParticipationWitness({ path: played.slice(0, 1), tipState: "active", atAuthoredBoundary: false })), "CAMPAIGN_PARTICIPATION_REQUIRED");
  assert.equal(errorCode(() => deriveCampaignParticipationWitness({ path: played.slice(0, 2), tipState: "active", atAuthoredBoundary: false })), "CAMPAIGN_PARTICIPATION_REQUIRED");
});

test("D2245 creation replay is durable before the generated run id exists", () => {
  const store = campaignStore();
  const created = createCampaignRunExactlyOnce(store, createInput());
  const replayed = createCampaignRunExactlyOnce(store, createInput({ generatedRunId: "ignored" }));
  assert.equal(created.kind, "created");
  assert.equal(replayed.kind, "replayed");
  assert.deepEqual(replayed.run, created.run);
  assert.deepEqual([store.campaignRuns.length, store.campaignEvents.length, store.createReceipts.length], [1, 1, 1]);
  assert.equal(errorCode(() => createCampaignRunExactlyOnce(store, createInput({ campaignVersion: 3 }))), "CAMPAIGN_COMMAND_REUSED");
  assert.equal(createCampaignRunExactlyOnce(store, createInput({ learnerId: "l2", generatedRunId: "cr2" })).kind, "created");
});

test("D2245 creation rollback is complete at every write boundary", () => {
  for (const failAt of ["run", "event", "receipt"]) {
    const store = campaignStore();
    assert.match(errorCode(() => createCampaignRunExactlyOnce(store, createInput(), { failAt })), /^INJECTED_/u);
    assert.deepEqual([store.campaignRuns.length, store.campaignEvents.length, store.createReceipts.length], [0, 0, 0]);
  }
});

test("D2246 encounter start commits the play and campaign aggregates together", () => {
  for (const failAt of ["play_run", "run_started", "node_entered", "revision", "pointer"]) {
    const store = campaignStore();
    createCampaignRunExactlyOnce(store, createInput());
    assert.match(errorCode(() => startCampaignEncounterExactlyOnce(store, { learnerId: "l1",
      campaignRunId: "cr1", nodeId: "n1", expectedRevision: 1, commandId: "start-000001",
      generatedPlayRunId: "pr1" }, { failAt })), /^INJECTED_/u);
    assert.equal(store.playRuns.length, 0);
    assert.equal(store.campaignEvents.length, 1);
    assert.equal(store.campaignRuns[0].activeEncounterRunId, null);
    assert.equal(store.campaignRuns[0].revision, 1);
  }
});

test("D2246 start response-loss replay returns the one committed play run", () => {
  const store = campaignStore();
  createCampaignRunExactlyOnce(store, createInput());
  const input = { learnerId: "l1", campaignRunId: "cr1", nodeId: "n1", expectedRevision: 1,
    commandId: "start-000001", generatedPlayRunId: "pr1" };
  const first = startCampaignEncounterExactlyOnce(store, input);
  const replay = startCampaignEncounterExactlyOnce(store, { ...input, generatedPlayRunId: "ignored" });
  assert.equal(first.kind, "started");
  assert.equal(replay.kind, "replayed");
  assert.equal(store.playRuns.length, 1);
  assert.equal(store.campaignEvents.length, 2);
  assert.equal(errorCode(() => startCampaignEncounterExactlyOnce(store, { ...input, commandId: "start-000002" })), "CAMPAIGN_REVISION_STALE");
});

test("D2247 active deletion refuses and sealed deletion degrades Review honestly", () => {
  const store = startedStore();
  assert.equal(errorCode(() => deleteOwnedRunCampaignAware(store, { learnerId: "l1", playRunId: "pr1" })), "CAMPAIGN_ACTIVE_ENCOUNTER_DELETE");
  store.campaignRuns[0].activeEncounterRunId = null;
  store.campaignEvents.push({ campaignRunId: "cr1", seq: 3, kind: "node_committed",
    payload: { nodeId: "n1", runId: "pr1", campaignDocumentDigest: "sha256:doc" } });
  deleteOwnedRunCampaignAware(store, { learnerId: "l1", playRunId: "pr1" });
  assert.deepEqual(campaignReviewProjection(store, { campaignRunId: "cr1", nodeId: "n1" }), {
    kind: "unavailable", reason: "campaign_encounter_run_deleted", runId: "pr1", nodeId: "n1",
    campaignDocumentDigest: "sha256:doc" });
  assert.equal(store.campaignEvents.at(-1).kind, "node_committed");
});

test("D2248 current campaign state narrows the real module/theory delivery", () => {
  const playRun = { id: "pr1", origin: { kind: "campaign_encounter", campaignRunId: "cr1",
    nodeId: "boss", campaignDocumentDigest: "sha256:doc" } };
  const campaignRun = { id: "cr1", learnerId: "l1", revision: 9, documentDigest: "sha256:doc",
    modules: { owned: ["guided_hint", "review_map"], equipped: ["guided_hint", "review_map"] },
    theory: { owned: [{ id: "p1", authorizingModuleId: "guided_hint", sourceId: "theory-source" }] } };
  const input = { learnerId: "l1", expectedPlayRunId: "pr1", playRun, campaignRun,
    node: { id: "boss", suppress: ["review_map"] }, sourceAvailable: ["guided_hint", "review_map", "theory-source"],
    presetModules: ["guided_hint", "review_map"], contextCeiling: ["guided_hint", "review_map"] };
  const receipt = campaignAssistanceAuthority(input);
  assert.deepEqual(receipt.effectiveModules, ["guided_hint"]);
  assert.deepEqual(receipt.authorizedTheory.map((row) => row.id), ["p1"]);
  assert.deepEqual(campaignAssistanceAuthority({ ...input, presetModules: [] }).effectiveModules, []);
  assert.equal(errorCode(() => campaignAssistanceAuthority({ ...input, expectedPlayRunId: "wrong" })), "CAMPAIGN_ACTIVE_ENCOUNTER_MISMATCH");
});

test("D2252 official curriculum metadata joins exact authorities and digest", () => {
  const authorities = { brackets: new Set(["club"]), passages: new Set(["bundle/p1"]),
    evidence: new Set(["ev1"]), requirements: new Set(["module.guided_hint"]),
    operations: new Set(["module.guided_hint@1"]) };
  const valid = officialDocument();
  assert.deepEqual(validateOfficialCampaign(valid, authorities), []);
  const missingPhase = structuredClone(valid);
  missingPhase.publication.curriculum.phaseCoverage.middlegame = [];
  assert.ok(validateOfficialCampaign(missingPhase, authorities).includes("CAMPAIGN_PHASE_COVERAGE_MIDDLEGAME"));
  const wrongDependency = structuredClone(valid);
  wrongDependency.publication.curriculum.dependencyAvailability[0].requirement = "copied.unknown";
  assert.ok(validateOfficialCampaign(wrongDependency, authorities).includes("CAMPAIGN_DEPENDENCY_UNKNOWN"));
  const wrongDigest = structuredClone(valid);
  wrongDigest.publication.curriculum.reviewReceipt.documentDigest = "sha256:wrong";
  assert.ok(validateOfficialCampaign(wrongDigest, authorities).includes("CAMPAIGN_REVIEW_DIGEST_MISMATCH"));
  assert.deepEqual(validateOfficialCampaign({ publication: { channel: "community" } }, authorities), []);
});

test("the RFC names exact production seams and does not call the foundation complete Campaign", () => {
  for (const token of ["deriveCampaignParticipationWitness", "createCampaignRunExactlyOnce",
    "startCampaignEncounterExactlyOnce", "CAMPAIGN_ACTIVE_ENCOUNTER_DELETE",
    "campaignAssistanceAuthority", "RunService.queryModules", "validateOfficialCampaign"]) {
    assert.match(normative, new RegExp(token.replaceAll(".", "\\."), "u"));
  }
  assert.match(normative, /explicitly the Campaign foundation, not the whole 1\.0/u);
  assert.match(closure, /campaign-boss-games/u);
  assert.match(closure, /campaign-catalogue-progression/u);
  assert.match(closure, /campaign-durable-variety/u);
  assert.match(closure, /incomplete until all four milestones/u);
});
