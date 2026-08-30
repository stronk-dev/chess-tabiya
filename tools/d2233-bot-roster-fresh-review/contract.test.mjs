// DISPOSABLE fresh independent review harness — D2233-D2237. Not production code.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const roster = read("rfc/bot-roster.md");
const policy = read("rfc/bot-policy.md");

test("D2233: roster consumes a returned bot-policy contract", () => {
  assert.match(roster, /Depends on:[\s\S]*`rfc\/bot-policy\.md`/u);
  assert.match(policy.slice(0, 700), /RETURNED by second fresh independent review/u);
  assert.match(roster.slice(0, 700), /policy dependency is returned/u);
});

test("D2234: cosmetic presentation participates in the calibration digest", () => {
  assert.match(roster, /display identity[\s\S]*excluded from policy equality/u);
  assert.match(roster, /changing any policy or identity asset invalidates the receipt/u);
  assert.doesNotMatch(roster, /policyDigest[\s\S]*presentationDigest|behavior digest[\s\S]*profile digest/u);
});

test("D2235: listed calibration arms total 17 and 13200 games", () => {
  const arms = [
    ["C1", 800], ["C2", 400], ["N", 800],
    ...[1, 2, 3, 4].map((n) => [`A${n}`, 800]),
    ...[1, 2, 3, 4].map((n) => [`B${n}`, 800]),
    ...[1, 2, 3, 4].map((n) => [`P${n}`, 800]),
    ["G1", 800], ["G2", 800],
  ];
  assert.equal(arms.length, 17);
  assert.equal(arms.reduce((sum, [, games]) => sum + games, 0), 13_200);
  assert.match(roster, /Total 12,400 games across 16 arms/u);
});

test("D2236: distribution gates name no executable bounds", () => {
  assert.match(roster, /shape agreement, bounds fixed before reading/u);
  assert.match(roster, /bands 1000 and 1400 have no published envelope/u);
  assert.match(roster, /\[\[D1184\]\] requires a new preregistered statistic and population/u);
  assert.doesNotMatch(roster, /type BotCalibrationVerdict|interface BotCalibrationGateManifest|maximumDistance|multipleComparison/u);
});

test("D2237: proposed traits have no route into the exact roster", () => {
  assert.match(roster, /ROSTER\s+= FAMILIES × BANDS/u);
  for (const trait of ["minor_piece_preference", "central_destination_preference", "long_move_preference", "piece_repeat_avoidance"]) {
    assert.equal(roster.match(new RegExp(`trait\\.${trait}@1`, "gu"))?.length, 1);
  }
  assert.match(roster, /`features` rides the record and never enters the composition/u);
});
