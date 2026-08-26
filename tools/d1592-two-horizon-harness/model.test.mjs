import assert from "node:assert/strict";
import test from "node:test";
import {
  applyAward,
  applyPresetPresentation,
  authorityCensus,
  fixtureCampaign,
  lifecycle,
  prestigeEligible,
  projectInventory,
  rewardUseDiagnostics,
} from "./model.mjs";

test("censuses the real reward authorities instead of inventing ids", () => {
  const census = authorityCensus();
  assert.equal(census.campaignSchemaVersion, 1);
  assert.deepEqual(census.currentNodeRewardKinds, ["module_unlock"]);
  assert.equal(census.moduleIds.length, 11);
  assert.equal(census.serverRuntimeTheoryAuthority, false);
  assert.deepEqual(Object.fromEntries(Object.entries(census.browserAppearanceIds).map(([key, values]) => [key, values.length])), { appTheme: 3, boardTheme: 2, pieceSet: 2 });
  assert.equal(census.sharedServerAppearanceAuthority, false);
});

test("a preset change cannot mutate run ownership or explicit equipment", () => {
  const state = { owned: ["guided_hint", "theory:passage-1"], equipped: ["guided_hint"] };
  assert.deepEqual(applyPresetPresentation(state, "quiet"), state);
});

test("inventory projection returns one exact reason for every unavailable owned item", () => {
  const rows = projectInventory({
    owned: ["ready", "resting", "boss", "provider", "shelf", "unsafe"],
    equipped: ["ready", "resting", "boss", "provider", "unsafe"],
    resting: ["resting"],
    suppressed: [{ id: "boss", reason: "boss_suppressed" }],
    ceiling: ["ready", "resting", "boss", "provider", "shelf"],
    available: ["ready", "resting", "boss", "shelf", "unsafe"],
  });
  assert.deepEqual(rows.map((row) => [row.id, row.effective, row.unavailableReason]), [
    ["ready", true, null], ["resting", false, "resting_until_act"],
    ["boss", false, "boss_suppressed"], ["provider", false, "source_unavailable"],
    ["shelf", false, "not_equipped"], ["unsafe", false, "honesty_ceiling"],
  ]);
});

test("valid reward has later and boss opportunity on every reachable continuation", () => {
  const [result] = rewardUseDiagnostics(fixtureCampaign());
  assert.equal(result.anyLaterUse, true);
  assert.equal(result.everyPathUses, true);
  assert.equal(result.anyBossUse, true);
  assert.equal(result.everyPathHasBossUse, true);
});

test("one intermediate dead branch still passes when every continuation reaches a consuming boss", () => {
  const [result] = rewardUseDiagnostics(fixtureCampaign({ deadBranch: true }));
  assert.equal(result.anyLaterUse, true);
  assert.equal(result.everyPathUses, true);
  // Later bosses still consume the reward, so a dead intermediate choice does not make the
  // collectible permanently dead. The boss arm is the stronger campaign requirement.
  assert.equal(result.everyPathHasBossUse, true);
});

test("boss suppression and a final-node reward fail the corresponding opportunity arms", () => {
  const [suppressed] = rewardUseDiagnostics(fixtureCampaign({ bossesSuppress: true }));
  assert.equal(suppressed.anyLaterUse, true);
  assert.equal(suppressed.anyBossUse, false);
  assert.equal(suppressed.everyPathHasBossUse, false);
  const [late] = rewardUseDiagnostics(fixtureCampaign({ lateReward: true }));
  assert.equal(late.anyLaterUse, false);
  assert.equal(late.everyPathUses, false);
  assert.equal(late.anyBossUse, false);
});

test("prestige requires a completed exact denominator, not a perfect prefix", () => {
  assert.equal(prestigeEligible({ status: "active", selectedLayerCount: 9, seals: [{ verdict: "achieved" }] }), false);
  assert.equal(prestigeEligible({ status: "completed", selectedLayerCount: 9, seals: Array.from({ length: 9 }, () => ({ verdict: "achieved" })) }), true);
  assert.equal(prestigeEligible({ status: "completed", selectedLayerCount: 9, seals: Array.from({ length: 8 }, () => ({ verdict: "achieved" })) }), false);
  assert.equal(prestigeEligible({ status: "completed", selectedLayerCount: 9, seals: [...Array.from({ length: 8 }, () => ({ verdict: "achieved" })), { verdict: "failed" }] }), false);
});

test("abandonment and completion are event-owned terminal cursors", () => {
  assert.deepEqual(lifecycle([{ kind: "campaign_abandoned" }], 9), { status: "abandoned", cursor: { kind: "abandoned" } });
  assert.deepEqual(lifecycle(Array.from({ length: 9 }, () => ({ kind: "node_sealed" })), 9), { status: "completed", cursor: { kind: "completed" } });
  assert.throws(() => lifecycle([{ kind: "campaign_abandoned" }, { kind: "node_sealed" }], 9), /CAMPAIGN_LIFECYCLE_CONFLICT/);
});

test("durable award application is idempotent on learner plus pinned run identity", () => {
  const store = new Map();
  const command = { learnerId: "l1", campaignId: "first-steps", campaignVersion: 3, runId: "r1", rewardId: "cosmetic:board:olive", runStatus: "completed" };
  assert.equal(applyAward(store, command).inserted, true);
  assert.equal(applyAward(store, command).inserted, false);
  assert.equal(store.size, 1);
  assert.throws(() => applyAward(store, { ...command, runId: "r2", runStatus: "active" }), /CAMPAIGN_AWARD_RUN_INCOMPLETE/);
});
