import { describe, expect, it } from "vitest";

import {
  bandAxis,
  BOT_CARD_SOURCES,
  compileBotCard,
  familyAxis,
  parseCardCompileInput,
  profileDigest,
  type BotProfileContract,
} from "./bot-card-contract.js";

function profile(
  family: BotProfileContract["family"],
  band: BotProfileContract["band"],
  name = `${family}-${band}`,
): BotProfileContract {
  const guard = family === "human-baseline" ? {} : {
    guard: { id: "guard.severe_error@1" as const, requestProfile: "stockfish-guard@1" as const, thresholdCp: 250 as const },
  };
  const trait = family !== "pawn-forward" ? {} : {
    trait: { id: "trait.pawn_preference@1" as const, classifier: "pawn_move@1" as const, multiplier: 4 as const, dependsOn: "guard.severe_error@1" as const },
  };
  return Object.freeze({
    id: `${family}-${band}`,
    version: 1,
    family,
    band,
    model: { id: `model.maia3.band-${band}@1`, engineId: "maia-5m", modelId: "maia3-5m@pinned" },
    sampler: { id: "sampler.maia_reconstruction@1", temperature: 0.8, topP: 0.92 },
    ...guard,
    ...trait,
    presentation: { name, avatarAsset: `/bots/${name}.svg`, decorativeTagline: "Keeps a notebook of favorite cafés." },
  });
}

describe("independently declared bot axes", () => {
  it("keeps one family policy equal across bands while presentation and band differ", () => {
    const low = profile("pawn-forward", 1000, "Pip");
    const high = profile("pawn-forward", 2200, "Kestrel");
    expect(familyAxis(low)).toEqual(familyAxis(high));
    expect(bandAxis(low)).not.toEqual(bandAxis(high));
    expect(low.presentation).not.toEqual(high.presentation);
  });

  it("distinguishes family mechanisms without comparing cp to Elo", () => {
    expect(familyAxis(profile("human-baseline", 1400))).not.toEqual(familyAxis(profile("guarded-human", 1400)));
    expect(familyAxis(profile("guarded-human", 1400))).not.toEqual(familyAxis(profile("pawn-forward", 1400)));
    const source = `${bandAxis} ${familyAxis}`;
    expect(source).not.toMatch(/orders? of magnitude|orthogonal|convert.*(?:cp|elo)/iu);
  });
});

describe("compiled grounded bot card", () => {
  it("renders baseline machinery and all explicit absences/scopes", () => {
    const card = compileBotCard({ profile: profile("human-baseline", 1000) });
    expect(card.calibration).toBe("uncalibrated");
    expect(card.statements.map((row) => row.id)).toEqual([
      "human_policy", "sampler", "no_guard", "no_book", "no_memory", "endgame_scope", "clock_scope", "calibration",
    ]);
    expect(card.statements.every((row) => row.sourceIds.length > 0 && row.sourceIds.every((id) => id in BOT_CARD_SOURCES))).toBe(true);
    expect(card.statements.map((row) => row.text).join(" ")).toContain("no human-scale strength number is claimed");
  });

  it("states guard mechanism and every abstention scope without calling 250 cp a hanging piece", () => {
    const card = compileBotCard({ profile: profile("guarded-human", 1400) });
    const text = card.statements.map((row) => row.text).join(" ");
    expect(text).toContain("fixed depth 8");
    expect(text).toContain("250 centipawns");
    expect(text).toContain("mixed cp/mate");
    expect(text).not.toMatch(/hanging piece|always|human-like/iu);
  });

  it("states the guarded pawn measurement and its dependency exactly", () => {
    const card = compileBotCard({ profile: profile("pawn-forward", 1800) });
    const pawn = card.statements.find((row) => row.id === "pawn_trait")!;
    expect(pawn.text).toContain("After the guard applies");
    expect(pawn.text).toContain("12.28 percentage points");
    expect(pawn.sourceIds).toEqual(["measurement.r11-pawn-x4@1", "measurement.d969-depth8-guard@1"]);
  });

  it("binds calibration to the exact digest and remains band-relative", () => {
    const declared = profile("human-baseline", 2200);
    const digest = profileDigest(declared);
    const card = compileBotCard({
      profile: declared,
      calibration: {
        profileDigest: digest,
        status: "band_relative",
        measuredLabel: "+205.2 versus the internal 1400 reference",
        timeControl: "untimed engine ladder",
        sourceId: "measurement.bot-exact-digest-calibration@1",
      },
    });
    expect(card.calibration).toBe("band_relative");
    expect(card.statements.at(-1)?.text).toContain("internal 1400 reference");
    expect(() => compileBotCard({
      profile: declared,
      calibration: {
        profileDigest: `sha256:${"0".repeat(64)}`,
        status: "band_relative",
        measuredLabel: "wrong profile",
        timeControl: "unknown",
        sourceId: "measurement.bot-exact-digest-calibration@1",
      },
    })).toThrow(/another profile digest/u);
  });

  it("keeps decorative prose out of behavior statements and rejects caller card sentences", () => {
    const declared = profile("human-baseline", 1400, "Ora");
    const card = compileBotCard({ profile: declared });
    expect(card.display.decorativeTagline).toContain("cafés");
    expect(card.statements.map((row) => row.text).join(" ")).not.toContain("cafés");
    expect(() => parseCardCompileInput({ profile: declared, sentence: "It controls the center." })).toThrow(/caller-owned/u);
  });

  it("rejects malformed family compositions before rendering", () => {
    const invalid = { ...profile("pawn-forward", 1000), guard: undefined } as unknown as BotProfileContract;
    expect(() => compileBotCard({ profile: invalid })).toThrow(/guard-dependent/u);
    const wrongBand = { ...profile("human-baseline", 1000), band: 2400 } as unknown as BotProfileContract;
    expect(() => compileBotCard({ profile: wrongBand })).toThrow(/unregistered band/u);
  });
});
