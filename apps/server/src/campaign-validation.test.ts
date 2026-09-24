import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { validateCampaignDocument, type CampaignPackLookup } from "./campaign-validation.js";

// rfc/campaign-core.md criteria 1, 5, 15, 17, 18 and rfc/campaign-boss-games.md criteria 1–3.

const BOSS_FEN = "rnb3k1/pppp1ppp/8/n6N/n1B5/B2Q4/PPP2PPP/4R2K w - - 0 1";
const packs: CampaignPackLookup = Object.freeze({
  get: (id: string) => id === "pack-one" ? { start: { fen: "8/8/8/8/8/8/8/K6k w - - 0 1", side: "white" } }
    : id === "boss-brief" ? { start: { fen: BOSS_FEN, side: "white" } } : undefined,
});

const fixture = (): any => JSON.parse(readFileSync(new URL("../../../tests/browser/fixtures/campaign.browser.json", import.meta.url), "utf8"));

function document(): any {
  const value = fixture();
  for (const act of value.acts) for (const layer of act.layers) for (const node of layer.choices) {
    if (node.encounter.kind === "pack") node.encounter.packId = "pack-one";
    else node.encounter.briefingRef.packId = "boss-brief";
  }
  return value;
}

function codes(value: unknown): readonly string[] {
  return validateCampaignDocument(value, packs).issues.filter((item) => item.severity === "error").map((item) => item.code);
}

describe("campaign document validation (schema lanes 2 and 3)", () => {
  it("accepts the mechanical fixture and warns only on non-boss single-choice layers", () => {
    const result = validateCampaignDocument(document(), packs);
    expect(result.valid, JSON.stringify(result.issues)).toBe(true);
    expect(result.issues.filter((item) => item.code === "CAMPAIGN_PATH_WIDTH")).toEqual([]);
    const linear = document();
    linear.acts[0].layers[0].choices = [linear.acts[0].layers[0].choices[0]];
    linear.acts[0].layers[1].choices = [linear.acts[0].layers[1].choices[0]];
    const warned = validateCampaignDocument(linear, packs);
    expect(warned.valid).toBe(true);
    expect(warned.issues.filter((item) => item.code === "CAMPAIGN_PATH_WIDTH").map((item) => item.path)).toEqual(["/acts/0/layers/0/choices", "/acts/0/layers/1/choices"]);
  });

  it("flip-a-constant: unknown pack, misplaced boss, rising economy each fail with their exact id", () => {
    const unknown = document(); unknown.acts[0].layers[0].choices[0].encounter.packId = "missing";
    expect(codes(unknown)).toContain("CAMPAIGN_ENCOUNTER_PACK_UNKNOWN");
    const boss = document(); boss.acts[0].layers[2].choices.push({ id: "second-boss", encounter: { kind: "pack", packId: "pack-one" } });
    expect(codes(boss)).toContain("CAMPAIGN_BOSS_PLACEMENT");
    const economy = document(); economy.economy.actGrants = { act1: 1, act2: 2, act3: 1 };
    expect(codes(economy)).toContain("CAMPAIGN_ECONOMY_MONOTONE");
  });

  it("closes the run-reward union at the schema boundary (criterion 5)", () => {
    const floor = document(); floor.acts[0].layers[0].choices[0].reward = { kind: "module_unlock", moduleId: "rules_floor" };
    expect(codes(floor)[0]).toMatch(/^SCHEMA_/u);
    const tool = document(); tool.acts[0].layers[0].choices[0].reward = { kind: "tool_unlock", id: "x" };
    expect(codes(tool)[0]).toMatch(/^SCHEMA_/u);
    const resource = document(); resource.acts[0].layers[0].choices[0].reward = { kind: "resource_grant", resourceId: "gold", amount: 1 };
    expect(codes(resource)[0]).toMatch(/^SCHEMA_/u);
    const negative = document(); negative.acts[0].layers[0].choices[0].reward = { kind: "resource_grant", resourceId: "campaign_rewind_charge", amount: 0 };
    expect(codes(negative)[0]).toMatch(/^SCHEMA_/u);
    const theory = document(); theory.acts[0].layers[0].choices[0].reward = { kind: "theory_unlock", bundleId: "b", passageId: "p" };
    expect(codes(theory)).toContain("CAMPAIGN_SOURCE_UNAVAILABLE");
    const outside = document(); outside.acts[0].layers[0].choices[0].reward = { kind: "module_unlock", moduleId: "blunder_prevention" };
    expect(codes(outside)).toContain("CAMPAIGN_UNLOCK_OUTSIDE_CEILING");
  });

  it("requires later and later-boss opportunity for every reward (criterion 18)", () => {
    const final = document(); final.acts[2].layers[2].choices[0].reward = { kind: "module_unlock", moduleId: "guided_hint" };
    expect(codes(final)).toContain("CAMPAIGN_REWARD_NO_LATER_USE");
    const suppressed = document();
    suppressed.acts[2].layers[0].choices[0].reward = { kind: "module_unlock", moduleId: "threat_radar" };
    suppressed.acts[2].layers[2].choices[0].suppress = ["threat_radar"];
    expect(codes(suppressed)).toContain("CAMPAIGN_REWARD_NO_BOSS_USE");
    const dead = document();
    dead.acts[2].layers[1].choices[0].reward = { kind: "module_unlock", moduleId: "threat_radar" };
    dead.acts[2].layers[2].choices[0].suppress = ["threat_radar"];
    expect(codes(dead)).toContain("CAMPAIGN_REWARD_NO_LATER_USE");
  });

  it("consumer declarations are not authority: copied or missing consumers fail (criterion 17)", () => {
    const extra = document(); extra.acts[0].layers[1].choices[0].consumes = [{ kind: "module_unlock", moduleId: "full_inspector" }];
    expect(codes(extra)).toContain("CAMPAIGN_CONSUMER_DECLARATION_MISMATCH");
    const exact = document();
    exact.acts[0].layers[1].choices[0].consumes = [{ kind: "module_unlock", moduleId: "postcommit_nudge" }, { kind: "resource_grant", resourceId: "campaign_rewind_charge" }];
    expect(codes(exact)).not.toContain("CAMPAIGN_CONSUMER_DECLARATION_MISMATCH");
    const missing = document(); missing.acts[0].layers[1].choices[0].consumes = [];
    expect(codes(missing)).toContain("CAMPAIGN_CONSUMER_DECLARATION_MISMATCH");
  });

  it("durable grants: exactly one completion and one prestige mark for this document; cosmetics need the catalog", () => {
    const none = document(); none.durableRewards = none.durableRewards.slice(0, 1).concat([{ when: "completed", reward: { kind: "prestige_mark", campaignId: none.id, campaignVersion: 1 } }]);
    expect(codes(none)).toContain("CAMPAIGN_DURABLE_REWARD_GATE");
    const foreign = document(); foreign.durableRewards[0].reward.campaignId = "other";
    expect(codes(foreign)).toContain("CAMPAIGN_DURABLE_REWARD_FOREIGN");
    const repeated = document(); repeated.durableRewards.push(structuredClone(repeated.durableRewards[0]));
    expect(codes(repeated)).toContain("CAMPAIGN_DURABLE_REWARD_DUPLICATE");
    const twin = document(); twin.acts[0].layers[0].choices[1].id = twin.acts[0].layers[0].choices[0].id;
    expect(codes(twin)).toContain("CAMPAIGN_NODE_ID_DUPLICATE");
    const cosmetic = document(); cosmetic.durableRewards.push({ when: "prestige", reward: { kind: "cosmetic_unlock", target: { kind: "board_theme", id: "walnut" } } });
    expect(codes(cosmetic)).toContain("CAMPAIGN_SOURCE_UNAVAILABLE");
  });

  it("refuses the official badge without the owner review store and registries ([[D2991]]/[[D2992]])", () => {
    const official = document();
    official.publication = { channel: "official", curriculum: {
      targetLearner: { bracketId: "b", prerequisites: [] }, expectedEnvelope: { minimumMinutes: 30, maximumMinutes: 50 },
      phaseCoverage: { opening: [], middlegame: [], endgame: [] }, formCoverage: [], theoryProvenance: [], dependencyAvailability: [],
      reviewReceipt: { authority: "owner_human_chess_review", documentDigest: `sha256:${"0".repeat(64)}`, reviewedAt: "2026-09-24T00:00:00.000Z" },
    } };
    expect(codes(official)).toContain("CAMPAIGN_OFFICIAL_AUTHORITY_UNAVAILABLE");
  });

  it("boss_game: Act-II layer-3 only, legal non-terminal side-to-move start with ≥21 pieces, exact profile, briefing join", () => {
    const actOne = document();
    actOne.acts[0].layers[2].choices[0] = { ...actOne.acts[1].layers[2].choices[0], id: "early-boss" };
    expect(codes(actOne)).toContain("CAMPAIGN_BOSS_GAME_PLACEMENT");
    const thin = document(); thin.acts[1].layers[2].choices[0].encounter.start.fen = "8/8/8/8/8/8/8/K6k w - - 0 1";
    expect(codes(thin)).toContain("CAMPAIGN_BOSS_GAME_PLACEMENT");
    const turn = document(); turn.acts[1].layers[2].choices[0].encounter.start.learnerSide = "black";
    expect(codes(turn)).toContain("CAMPAIGN_BOSS_GAME_PLACEMENT");
    const profile = document(); profile.acts[1].layers[2].choices[0].encounter.opponent.profile.digest = `sha256:${"1".repeat(64)}`;
    expect(codes(profile)).toContain("CAMPAIGN_BOSS_PROFILE_UNKNOWN");
    const rated = document(); rated.acts[1].layers[2].choices[0].encounter.rating = "rated_when_clean";
    expect(codes(rated)).toContain("CAMPAIGN_BOSS_CALIBRATION_UNAVAILABLE");
    const brief = document(); brief.acts[1].layers[2].choices[0].encounter.briefingRef.packId = "pack-one";
    expect(codes(brief)).toContain("CAMPAIGN_BOSS_BRIEFING_MISMATCH");
    const packShaped = document(); packShaped.acts[1].layers[2].choices[0].encounter.objective = { type: "win" };
    expect(codes(packShaped)[0]).toMatch(/^SCHEMA_/u);
    const targetElo = document(); targetElo.acts[1].layers[2].choices[0].encounter.opponent.targetElo = 1500;
    expect(codes(targetElo)[0]).toMatch(/^SCHEMA_/u);
  });
});
