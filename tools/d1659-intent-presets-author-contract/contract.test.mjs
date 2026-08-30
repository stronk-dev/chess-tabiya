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
  assert.match(rfc, /A module absent[\s\S]*explicit Custom module include/);
});

test("availability is closed and split over server evidence and browser channels", () => {
  for (const source of ["llm", "tts", "stockfish", "syzygy", "maia", "explorer", "browser_speech"]) {
    assert.match(rfc, new RegExp(`"${source}"`));
  }
  for (const state of ["pending", "available", "unavailable", "failed"]) assert.match(rfc, new RegExp(`state: "${state}"`));
  assert.match(rfc, /Pending never changes the\s+selected preference/u);
  assert.match(rfc, /browser may report only output-channel readiness/u);
});

test("campaign is unreachable at HEAD and phased behind its authoritative owner", () => {
  assert.doesNotMatch(presets, /campaign_encounter/);
  assert.match(rfc, /Campaign is declared-awaiting/u);
  assert.match(rfc, /will import that type; it will not copy or forecast its bytes/u);
  assert.match(rfc, /CONTEXT_DECLARED_AWAITING/u);
  assert.match(rfc, /ordinary-pack\s+refusal/u);
});

test("checkpoint A cannot counterfeit checkpoint B", () => {
  assert.match(rfc, /Criterion 9 must fail at[\s\S]*zero deliveries/);
  assert.match(rfc, /Checkpoint A[\s\S]*leaves this RFC implementing/);
  assert.match(rfc, /Only Checkpoint B's non-vacuous real delivery commit/);
  assert.match(rfc, /pre\/at-commit Support receipts are ephemeral/);
});
