import assert from "node:assert/strict";
import test from "node:test";
import {
  CAMPAIGN_API_OPERATIONS,
  admitConsumerAuthority,
  applyPresetPresentation,
  authorityCensus,
  changeLoadout,
  compileCampaignConsumers,
  createCampaignRun,
  digest,
  fixtureCampaign,
  foldCampaign,
  makeCampaignRunOrigin,
  prestigeEligible,
  projectModuleInventory,
  projectTheoryInventory,
  registerCampaignDocument,
  restoreCampaignRun,
  rewardUseDiagnostics,
  submitNode,
} from "./model.mjs";

const registered = (document = fixtureCampaign()) => registerCampaignDocument(new Map(), document);
const run = (document = fixtureCampaign()) => createCampaignRun(registered(document));
const submit = (campaignRun, overrides = {}, options = {}) => submitNode(campaignRun, {
  commandId: `cmd-submit-${campaignRun.events.length.toString().padStart(6, "0")}`,
  expectedRevision: campaignRun.events.length,
  nodeId: `n${campaignRun.events.length}`,
  playRunId: "play-1",
  branchId: "main",
  verdict: "achieved",
  act: "act1",
  actIncome: 1,
  ...overrides,
}, options);
const advanceToFinal = (campaignRun) => {
  while (foldCampaign(campaignRun).seals.length < 8) submit(campaignRun);
  return campaignRun;
};

test("censuses real reward authorities instead of inventing ids", () => {
  const census = authorityCensus();
  assert.equal(census.campaignSchemaVersion, 1);
  assert.deepEqual(census.currentNodeRewardKinds, ["module_unlock"]);
  assert.equal(census.moduleIds.length, 11);
  assert.equal(census.serverRuntimeTheoryAuthority, false);
  assert.deepEqual(Object.fromEntries(Object.entries(census.browserAppearanceIds).map(([key, values]) => [key, values.length])), { appTheme: 3, boardTheme: 2, pieceSet: 2 });
  assert.equal(census.sharedServerAppearanceAuthority, false);
});

test("D2079 pins canonical document bytes and refuses same-version mutation", () => {
  const registry = new Map();
  const first = registerCampaignDocument(registry, fixtureCampaign());
  const campaignRun = createCampaignRun(first);
  registry.clear(); // a newer release removed the offered definition
  assert.equal(restoreCampaignRun(campaignRun).document.id, "fixture-only");
  assert.throws(() => registerCampaignDocument(new Map([["fixture-only@1", first]]), { ...fixtureCampaign(), title: "changed" }), /VERSION_MUTATED/);
  assert.throws(() => restoreCampaignRun({ ...campaignRun, campaignDocumentDigest: digest("wrong") }), /DIGEST_MISMATCH/);
});

test("D2082 projects module, theory and resource families without unlike intersections", () => {
  const modules = projectModuleInventory({ owned: ["ready", "resting", "boss", "provider", "shelf", "unsafe"],
    equipped: ["ready", "resting", "boss", "provider", "unsafe"], resting: ["resting"], suppressed: ["boss"],
    ceiling: ["ready", "resting", "boss", "provider", "shelf"], available: ["ready", "resting", "boss", "shelf", "unsafe"] });
  assert.deepEqual(modules.map((row) => row.unavailableReason), [null, "resting_until_act", "boss_suppressed", "source_unavailable", "not_equipped", "honesty_ceiling"]);
  const theory = projectTheoryInventory({ owned: ["ready", "unrelated", "inactive", "direct", "missing"],
    applicable: ["ready", "inactive", "direct", "missing"], authorized: ["ready", "direct", "missing"],
    disclosable: ["ready", "missing"], available: ["ready"] });
  assert.deepEqual(theory.map((row) => row.unavailableReason), [null, "not_applicable", "authorizing_module_inactive", "disclosure_ceiling", "source_unavailable"]);
  const state = { modules: { owned: ["a"], equipped: ["a"] }, theory: { owned: ["p"] }, charges: { balance: 2 } };
  assert.deepEqual(applyPresetPresentation(state, "quiet"), state);
});

test("D2081 consumes only sealed predecessor views", () => {
  const pack = admitConsumerAuthority("pack_capabilities", { modules: ["guided_hint"] });
  const theory = admitConsumerAuthority("theory_applicability", { passages: ["bundle/p1"] });
  assert.deepEqual(compileCampaignConsumers(pack, theory, true), ["module:guided_hint", "resource:campaign_rewind_charge", "theory:bundle/p1"]);
  assert.throws(() => compileCampaignConsumers({ ...pack }, theory, true), /AUTHORITY_UNAVAILABLE/);
});

test("reward opportunity remains path-wide and boss-wide", () => {
  const [valid] = rewardUseDiagnostics(fixtureCampaign());
  assert.equal(valid.everyPathUses, true);
  assert.equal(valid.everyPathHasBossUse, true);
  const [suppressed] = rewardUseDiagnostics(fixtureCampaign({ bossesSuppress: true }));
  assert.equal(suppressed.everyPathHasBossUse, false);
  const [late] = rewardUseDiagnostics(fixtureCampaign({ lateReward: true }));
  assert.equal(late.anyLaterUse, false);
});

test("prestige requires a completed exact denominator", () => {
  assert.equal(prestigeEligible({ status: "active", selectedLayerCount: 9, seals: [{ verdict: "achieved" }] }), false);
  assert.equal(prestigeEligible({ status: "completed", selectedLayerCount: 9, seals: Array.from({ length: 9 }, () => ({ verdict: "achieved" })) }), true);
  assert.equal(prestigeEligible({ status: "completed", selectedLayerCount: 9, seals: [...Array.from({ length: 8 }, () => ({ verdict: "achieved" })), { verdict: "failed" }] }), false);
});

test("D2077 final node is one atomic terminal event with awards", () => {
  const campaignRun = advanceToFinal(run());
  const result = submit(campaignRun, { durableRewards: [
    { when: "completed", reward: { kind: "completion_mark", campaignId: "fixture-only", campaignVersion: 1 } },
    { when: "prestige", reward: { kind: "prestige_mark", campaignId: "fixture-only", campaignVersion: 1 } },
  ] });
  assert.equal(result.event.kind, "node_committed");
  assert.equal(foldCampaign(campaignRun).status, "completed");
  assert.equal(campaignRun.awards.length, 2);
  assert.throws(() => submit(campaignRun), /RUN_TERMINAL/);
});

test("D2077/D2085 injected failure leaves neither terminal event nor awards", () => {
  for (const failAt of ["event", "fold", "award"]) {
    const campaignRun = advanceToFinal(run());
    assert.throws(() => submit(campaignRun, { durableRewards: [{ when: "completed", reward: { kind: "completion_mark" } }] }, { failAt }), /INJECTED/);
    assert.equal(campaignRun.events.length, 9);
    assert.equal(campaignRun.awards.length, 0);
    assert.equal(foldCampaign(campaignRun).status, "active");
  }
});

test("D2080 resource reward has a distinct exactly-once ledger effect", () => {
  const campaignRun = run();
  submit(campaignRun, { reward: { kind: "resource_grant", resourceId: "campaign_rewind_charge", rewardIdentity: "r1", amount: 2 } });
  submit(campaignRun, { reward: { kind: "resource_grant", resourceId: "campaign_rewind_charge", rewardIdentity: "r2", amount: 5 } });
  const state = foldCampaign(campaignRun);
  assert.equal(state.charges.startingIncome, 2);
  assert.equal(state.charges.actIncome, 2);
  assert.equal(state.charges.rewardIncome, 7);
  assert.equal(state.charges.balance, 11);
});

test("D2078 loadout equip/unequip is durable and family-typed", () => {
  const campaignRun = run({ ...fixtureCampaign(), startingModules: ["guided_hint", "theory_card"] });
  changeLoadout(campaignRun, { commandId: "cmd-loadout-123456", expectedRevision: 1, equippedModuleIds: ["guided_hint"] });
  assert.deepEqual(foldCampaign(campaignRun).modules.equipped, ["guided_hint"]);
  const rebuilt = restoreCampaignRun(JSON.parse(JSON.stringify(campaignRun)));
  assert.deepEqual(foldCampaign(rebuilt).modules.equipped, ["guided_hint"]);
  assert.throws(() => changeLoadout(campaignRun, { commandId: "cmd-loadout-654321", expectedRevision: 2, equippedModuleIds: ["theory:bundle/p1"] }), /FAMILY_INVALID/);
});

test("D2084 command replay, stale revision and changed operands are explicit", () => {
  const campaignRun = run();
  const input = { commandId: "cmd-submit-replay1", expectedRevision: 1, nodeId: "n1", playRunId: "p1", branchId: "main", verdict: "achieved", act: "act1", actIncome: 1 };
  assert.equal(submitNode(campaignRun, input).kind, "committed");
  assert.equal(submitNode(campaignRun, input).kind, "replayed");
  assert.throws(() => submitNode(campaignRun, { ...input, branchId: "fork" }), /COMMAND_REUSED/);
  assert.throws(() => submitNode(campaignRun, { ...input, commandId: "cmd-submit-stale11", expectedRevision: 1 }), /REVISION_STALE/);
  assert.equal(CAMPAIGN_API_OPERATIONS.length, 11);
});

test("D2083 campaign run origin survives independently of campaign history", () => {
  const campaignRun = run();
  const origin = makeCampaignRunOrigin(campaignRun, "n1");
  campaignRun.events.length = 0;
  assert.deepEqual(origin, { kind: "campaign_encounter", campaignRunId: campaignRun.id, nodeId: "n1", campaignDocumentDigest: campaignRun.campaignDocumentDigest });
  assert.equal({}.origin, undefined);
});
