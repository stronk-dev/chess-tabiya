import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const rfc = readFileSync("rfc/campaign-core.md", "utf8");
const register = readFileSync("rfc/README.md", "utf8");
const normative = rfc.split("\n## Changelog\n", 1)[0];

function includesAll(text, fragments) {
  for (const fragment of fragments) assert.match(text, fragment);
}

test("author status preserves the return boundary", () => {
  includesAll(rfc, [
    /Status:\*\* draft — \*\*two-horizon author repair complete 2026-08-30/,
    /fresh independent\s+buildability review required/,
    /No campaign migration, production route, seed campaign or surface may\s+resume before fresh review/,
  ]);
});

test("campaign schema lane 2 and migration ownership are declared once", () => {
  assert.equal((rfc.match(/campaign-schema \| lane 2 \|/g) ?? []).length, 1);
  assert.match(rfc, /migration \| position behind bot-policy \| campaign_runs; campaign_events; campaign_reward_awards/);
  assert.match(register, /\| lane 2 \| `campaign-core\.md` \|/);
});

test("run rewards are a closed semantic union rather than generic tool ids", () => {
  includesAll(normative, [
    /kind: "module_unlock"; moduleId: UnlockableModuleId/,
    /kind: "theory_unlock"; bundleId: TheoryBundleId; passageId: TheoryPassageId/,
    /kind: "resource_grant"; resourceId: "campaign_rewind_charge"; amount: PositiveInteger/,
    /generic `tool_unlock`, free-form reward id/,
    /acquisition asserts\s+availability only/i,
  ]);
});

test("presets cannot erase owned or equipped campaign state", () => {
  includesAll(normative, [
    /owned\s+= acquired in this CampaignRun/,
    /equipped\s+= explicitly selected in the campaign loadout/,
    /Preset changes mutate neither `owned` nor `equipped`/,
    /honesty_ceiling.*resting_until_act.*boss_suppressed.*source_unavailable.*not_equipped/s,
    /zero or multiple reasons/,
  ]);
  assert.doesNotMatch(normative, /^effective[^\n]*presetRequest/m);
});

test("authored consumers are checked against runtime and every continuation", () => {
  includesAll(normative, [
    /declarations are not authority/,
    /authored `consumes` set must equal the compiled set/,
    /every\s+reachable continuation after acquisition/,
    /later consumer and \(b\) a later boss\s+consumer on every continuation/,
    /proves opportunity only, never usefulness or learning effect/,
  ]);
});

test("prestige and durable rewards are exact and non-gating", () => {
  includesAll(normative, [
    /status === "completed"/,
    /seals\.length === selectedLayerCount/,
    /kind: "completion_mark"/,
    /kind: "prestige_mark"/,
    /kind: "cosmetic_unlock"/,
    /shared server-readable appearance\s+catalog/,
    /never\s+gate ordinary packs, theory, the standard campaign path or default starting tools/,
  ]);
});

test("abandonment is event-owned with discriminated terminal cursors", () => {
  includesAll(normative, [
    /\{ kind: "completed" \}/,
    /\{ kind: "abandoned" \}/,
    /`campaign_abandoned` is the sole abandonment\s+authority/,
    /No event may follow completion or abandonment/,
    /materialized `campaign_runs\.status` is detected as projection drift/,
  ]);
});

test("durable award storage has one idempotency identity and full lifecycle", () => {
  includesAll(normative, [
    /CREATE TABLE campaign_reward_awards/,
    /learnerId, campaignId, campaignVersion,\s+campaignRunId, durableRewardId/,
    /duplicate command returns the existing row byte-for-byte/,
    /Export includes campaign run\/event history, award history and the\s+derived owned reward set/,
    /Hard deletion cascades all three/,
    /Restore imports canonical rows/,
    /Account merge\s+cannot silently choose/,
    /Backup\/restore and\s+upgrade verification/,
  ]);
});

test("the 1.0 surface is a complete journey and cannot destabilize the board", () => {
  includesAll(normative, [
    /Campaign home and resume/,
    /Map.*\/campaign\/:campaignRunId/s,
    /Encounter preparation/,
    /In-run context/,
    /Node result/,
    /Run result/,
    /without inserting content\s+between the board and controls or reducing the board/,
    /no horizontal page overflow, no\s+post-hint\/reward square-size change, no covered tappable square and no primitive settings wall/,
  ]);
});

test("the still-open failure policy remains outside the amendment", () => {
  includesAll(normative, [
    /\[\[D1600\]\]'s no-exhaustible-tool failure stage/,
    /does not decide when an item enters that state/,
  ]);
});
