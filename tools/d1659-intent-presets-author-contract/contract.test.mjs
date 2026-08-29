import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const rfc = readFileSync(new URL("../../rfc/intent-presets.md", import.meta.url), "utf8");
const preference = readFileSync(new URL("../../apps/web/src/lib/assistance-preference.ts", import.meta.url), "utf8");
const presets = readFileSync(new URL("../../packages/runtime/src/presets.ts", import.meta.url), "utf8");

test("the author repair names the production ambiguity it must remove", () => {
  assert.match(preference, /function loadAssistance[\s\S]*: AssistanceConfig/);
  assert.match(preference, /PROFILE_DEFAULTS/);
  for (const kind of ["unset", "explicit", "migrated_snapshot", "invalid_fallback"]) {
    assert.match(rfc, new RegExp(`kind: "${kind}"`));
  }
});

test("legacy snapshots have a total truthful migration", () => {
  assert.match(rfc, /sourceVersion: 1 \| 2 \| 3 \| 4/);
  for (const version of [1, 2, 3, 4]) assert.match(preference, new RegExp(`item\\.version === ${version}|validV${version}`));
  assert.match(rfc, /migrated_snapshot` always displays Custom/);
  assert.match(rfc, /malformed data → `invalid_fallback`/);
});

test("the owner rule keeps named presets literal and every primitive configurable", () => {
  assert.match(rfc, /A named preset is literal/);
  assert.match(rfc, /Any higher raw value is still configurable/);
  assert.match(rfc, /displayMode: "custom"/);
  assert.match(rfc, /Advanced editor reaches every member of all nine field domains/);
});

test("all nine legacy fields bind to exact effects", () => {
  const effectTable = rfc.slice(rfc.indexOf("| field | exact governed effect |"), rfc.indexOf("#### §5.3"));
  for (const field of ["markers", "guided", "humanSplit", "corpus", "voice", "spoken", "boardLighting", "arrows", "ambient"]) {
    assert.ok(effectTable.includes(`| \`${field}\` |`), `${field} must have one exact effect row`);
  }
  assert.match(rfc, /a module absent[\s\S]*produces zero effects/);
});

test("availability is closed over server and browser facts", () => {
  for (const source of ["opponent", "judge", "llm", "corpus", "tts", "tablebase", "stockfish", "maia", "explorer", "browser_speech"]) {
    assert.match(rfc, new RegExp(`"${source}"`));
  }
  for (const state of ["pending", "available", "unavailable"]) assert.match(rfc, new RegExp(`state: "${state}"`));
  assert.match(rfc, /Pending never changes the\s+selected preference/);
});

test("campaign is unreachable at HEAD and repaired with an authoritative origin", () => {
  assert.doesNotMatch(presets, /campaign_encounter/);
  assert.match(rfc, /kind: "campaign_encounter"/);
  assert.match(rfc, /CampaignEncounterReceipt/);
  assert.match(rfc, /server independently joins the active campaign pointer/);
  assert.match(rfc, /plain pack run[\s\S]*can never select this arm/i);
});

test("checkpoint A cannot counterfeit checkpoint B", () => {
  assert.match(rfc, /Criterion 9 must fail at[\s\S]*zero deliveries/);
  assert.match(rfc, /Checkpoint A[\s\S]*leaves this RFC implementing/);
  assert.match(rfc, /Only Checkpoint B's non-vacuous real delivery commit/);
  assert.match(rfc, /pre\/at-commit Support receipts are ephemeral/);
});
