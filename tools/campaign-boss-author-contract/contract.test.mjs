import { readFileSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const rfc = readFileSync(new URL("../../rfc/campaign-boss-games.md", import.meta.url), "utf8");
const readme = readFileSync(new URL("../../rfc/README.md", import.meta.url), "utf8");
const backlog = readFileSync(new URL("../../design/BACKLOG.md", import.meta.url), "utf8");

const requires = (...needles) => {
  for (const needle of needles) assert.ok(rfc.includes(needle), `missing normative phrase: ${needle}`);
};

test("boss is a distinct Act-II rules-terminal encounter", () => {
  requires('kind: "boss_game"', "only `act2`, layer 3", "validated `outcome.reached`", "Act I and Act III bosses remain pack");
});

test("authored and adjudicated verdict routes are structurally refused", () => {
  requires("admits no `packId`", "No authored or engine verdict", "No pack-shaped boss", "Tablebase and engine evidence");
});

test("profile identity and rating calibration have one authority", () => {
  requires("BotProfileReference", "BotProfileCalibrationReference", "No dual opponent authority", "profile+`targetElo`");
});

test("start and finish are atomic idempotent multi-projection operations", () => {
  requires("One `BEGIN IMMEDIATE` transaction", "Any failure rolls all seven effects back", "One storage transaction", "Concurrent finish and response-loss retry");
});

test("game truth is separate from rating disposition", () => {
  requires("CampaignBossRatingDisposition", "change the eventual rules result", "The game result is immutable truth", "rated when the attempt remains clean");
});

test("support is an explicit void-before-activation transition", () => {
  requires("visible in the briefing as available", "POST /campaign-runs/:campaignRunId/nodes/:nodeId/use-support", "campaign_assistance_chosen", "Only after that transaction commits", "clean direct assistance request remains refused");
  assert.match(backlog, /D2367/);
});

test("campaign progression and prestige preserve the owner ruling", () => {
  requires("A loss or draw still unlocks the core", "only prestige distinguishes the win", "Loss and draw progress the core path");
});

test("full browser and lifecycle journeys are required", () => {
  requires("briefing → start → play", "Save/reload and process restart", "Export/delete/restore", "no board shrink, overlap or overflow");
});

test("schema lane and process defects are registered", () => {
  assert.match(rfc, /campaign-schema \| lane 3/);
  assert.match(readme, /lane 3[^\n]*`campaign-boss-games\.md`/);
  assert.match(backlog, /D2365/);
  assert.match(backlog, /D2366/);
});

test("owner choice remains explicit and cannot masquerade as accepted", () => {
  requires("Proposed owner choice", "Owner ruling required before acceptance", "Accept or veto the proposed calibrated-profile official boss");
  assert.doesNotMatch(rfc, /Status:\*\* accepted/);
});
