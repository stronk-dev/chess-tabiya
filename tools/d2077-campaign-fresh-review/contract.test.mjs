// DISPOSABLE fresh independent review harness — D2077-D2086. Not production code.
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const rfc = read("rfc/campaign-core.md");
const presets = read("packages/runtime/src/presets.ts");
const registry = read("apps/server/src/campaign-registry.ts");
const packCapability = read("rfc/pack-capability-contract.md");
const theoryJoins = read("rfc/theory-drill-current-joins.md");

function section(start, end) {
  const from = rfc.indexOf(start);
  const to = rfc.indexOf(end, from + start.length);
  assert.notEqual(from, -1, `missing section ${start}`);
  assert.notEqual(to, -1, `missing section ${end}`);
  return rfc.slice(from, to);
}

test("D2077: the final seal becomes terminal before its required trailing events", () => {
  const submit = section("**4.1 Declaring done.**", "**RULED 2026-08-23");
  assert.ok(submit.indexOf("`node_sealed") < submit.indexOf("`charge_earned`"));
  assert.ok(submit.indexOf("`charge_earned`") < submit.indexOf("`run_reward_acquired"));
  assert.match(rfc, /`completed`\s+means exactly one seal for every selected layer/u);
  assert.match(rfc, /No event may follow completion or abandonment/u);
});

test("D2078: equipped state and the visible Equip action have no durable mutation", () => {
  assert.match(rfc, /explicit campaign\s+loadout projection/u);
  assert.match(rfc, /one `Equip`\s+action/u);
  assert.match(rfc, /`not_equipped`/u);
  const ddl = section("CREATE TABLE campaign_events", "CREATE TABLE campaign_reward_awards");
  assert.doesNotMatch(ddl, /equipped|unequipped|loadout/u);
  assert.match(rfc, /equipped: CampaignRunRewardRef\[\]/u);
});

test("D2079: persisted runs omit the document digest later commands require", () => {
  const runs = section("CREATE TABLE campaign_runs", "CREATE TABLE campaign_events");
  assert.doesNotMatch(runs, /campaign_digest|document_digest|definition_digest/u);
  assert.match(rfc, /pinned campaign document digest/u);
  assert.match(registry, /function key\(id: string, version: number\)/u);
  assert.doesNotMatch(registry, /same-version|VERSION_DIGEST|DOCUMENT_MUTATED/u);
});

test("D2080: resource reward amounts never enter the charge algebra", () => {
  assert.match(rfc, /kind: "resource_grant"; resourceId: "campaign_rewind_charge"; amount: PositiveInteger/u);
  assert.match(rfc, /balance = starting \+ earned − spent/u);
  const ddl = section("CREATE TABLE campaign_events", "CREATE TABLE campaign_reward_awards");
  assert.doesNotMatch(ddl, /resource_granted|reward_charge_earned/u);
  const rollup = section("**4.2 The run-level roll-up**", "**4.3 Path-scoped seals stand.**");
  assert.doesNotMatch(rollup, /resource_grant|reward.*amount|amount.*reward/u);
});

test("D2081: consumer compilation relies on returned foundations absent from Depends on", () => {
  const dependencies = section("- **Depends on:**", "- **Parent / amends:**");
  assert.doesNotMatch(dependencies, /pack-capability-contract/u);
  assert.doesNotMatch(dependencies, /theory-drill-current-joins/u);
  const consumers = section("**3.4 Reward-to-consumer closure.**", "**3.5 What a boss is not in v1.**");
  assert.match(consumers, /node's pack capabilities/u);
  assert.match(consumers, /published bundle\/passage reachable from that node's pack/u);
  assert.match(packCapability, /Status:\*\* draft — returned/u);
  assert.match(theoryJoins, /Status:\*\* draft — returned/u);
});

test("D2082: a ModuleId ceiling is applied to theory identities without a typed bridge", () => {
  assert.match(presets, /readonly moduleCeiling: readonly ModuleId\[\]/u);
  assert.match(rfc, /For each owned module or theory item/u);
  assert.match(rfc, /effective\s+= honesty ceiling ∩ owned ∩ equipped/u);
  assert.doesNotMatch(rfc, /TheoryInventoryProjection|TheoryRewardProjection|theory.*module.*authori[sz]es.*passage/iu);
});

test("D2083: required Review and export consumers trigger the declined origin seam", () => {
  assert.match(rfc, /if any\s+consumer outside the campaign tables needs per-run campaign identity \(a Review surface, an\s+export, the longitudinal store\), the marker becomes a run-schema claim/u);
  assert.match(rfc, /Review this encounter/u);
  assert.match(rfc, /Export includes campaign run\/event history/u);
  const claims = section("```tabiya-claims", "```");
  assert.doesNotMatch(claims, /run-schema/u);
});

test("D2084: four route mentions cannot serve the required campaign journey", () => {
  const endpoints = [...rfc.matchAll(/(?:GET|POST|PUT|PATCH|DELETE) \/campaigns?[^\s`]*/gu)].map((match) => match[0]);
  assert.equal(endpoints.length, 4);
  assert.equal(endpoints.some((value) => /\/campaigns\/:campaignId\/runs/u.test(value)), false);
  assert.equal(endpoints.some((value) => /loadout|equip/u.test(value)), false);
  const submit = section("**4.1 Declaring done.**", "**RULED 2026-08-23");
  assert.doesNotMatch(submit, /idempotency|expected event head/u);
});

test("D2085: the durable award command has no production caller", () => {
  const submit = section("**4.1 Declaring done.**", "**RULED 2026-08-23");
  assert.doesNotMatch(submit, /DurableRewardGrant|campaign_reward_awards|award command/u);
  const award = section("**6.1 Durable award command.**", "**6.2 Account and appliance lifecycle.**");
  assert.match(award, /server-owned command/u);
  assert.doesNotMatch(award, /route|worker|outbox|startup|reconcil|final-seal hook/iu);
  assert.match(rfc, /complete the run, receive idempotent durable awards/u);
});

test("D2086: the contract fixture is the only campaign assigned to Codex", () => {
  assert.equal(existsSync("content/campaigns"), false);
  assert.match(rfc, /seed `content\/campaigns\/seed-endgames\.json`/u);
  assert.match(rfc, /content authoring of real campaigns beyond the seed fixture/u);
  assert.match(rfc, /D5 \| v1 implementation per this specification, criteria 1–25 \| codex/u);
  assert.doesNotMatch(rfc, /official authored campaign[\s\S]{0,160}(?:OWNER|human author|content authority)/iu);
});
