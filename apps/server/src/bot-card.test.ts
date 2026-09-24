import {
  BOT_CARD_SOURCE_IDS,
  BOT_CARD_STATEMENT_IDS,
  BOT_PROFILE_CATALOG,
  type BotProfileCatalogEntry,
  type BotProfileId,
} from "@chess-tabiya/runtime";
import { describe, expect, it } from "vitest";

import { BotCardError, compileBotCard, type BotCalibrationReceipt } from "./bot-card.js";
import { validateRoster } from "../../web/src/lib/capability-response.js";
import { projectBotRoster } from "./bot-roster.js";

const profile = (id: BotProfileId): BotProfileCatalogEntry => BOT_PROFILE_CATALOG.find((entry) => entry.reference.id === id)!;
const ids = (id: BotProfileId): readonly string[] => compileBotCard(profile(id)).statements.map((statement) => statement.id);
const text = (id: BotProfileId): string => compileBotCard(profile(id)).statements.map((statement) => statement.text).join("\n");

function receipt(entry: BotProfileCatalogEntry, overrides: Partial<BotCalibrationReceipt> = {}): BotCalibrationReceipt {
  return {
    behaviorDigest: entry.behaviorDigest,
    strength: { verdict: "calibrated_relative", relativeElo: -12.5, ci95: [-40.1, 15.2], reference: "raw Maia band 1400" },
    distribution: "controlled_divergence",
    bandIdentity: "supported",
    harness: "tools/d333-band-outcome-harness",
    measuredAt: "2026-10-01",
    games: 800,
    timeControl: "untimed engine-vs-engine",
    humanReferenceScope: "24,000 CC0 Lichess blitz decisions",
    ...overrides,
  };
}

describe("grounded bot cards (bot-policy §7 / A9; bot-roster §7 / criterion 4)", () => {
  it("compiles one card per catalog member from registered sources only", () => {
    for (const entry of BOT_PROFILE_CATALOG) {
      const card = compileBotCard(entry);
      expect(card.profileDigest).toBe(entry.reference.digest);
      expect(card.behaviorDigest).toBe(entry.behaviorDigest);
      expect(card.decorative).toBeNull();
      for (const statement of card.statements) {
        expect(BOT_CARD_STATEMENT_IDS).toContain(statement.id);
        expect(statement.sources.length).toBeGreaterThan(0);
        for (const source of statement.sources) expect(BOT_CARD_SOURCE_IDS).toContain(source);
      }
    }
  });

  it("states each family's mechanisms and nothing it does not do", () => {
    const common = ["card.model_band", "card.sampler", "card.band_ladder", "card.no_book", "card.no_memory", "card.no_timing", "card.endgame_scope", "card.calibration"];
    expect(ids("human-baseline.1400@1")).toEqual(common.slice(0, 3).concat(common.slice(3)));
    expect(ids("guarded-human.1400@1")).toEqual([...common.slice(0, 3), "card.guard", "card.guard_measurement", "card.guard_abstention", ...common.slice(3)]);
    expect(ids("pawn-forward.1400@1")).toEqual([...common.slice(0, 3), "card.guard", "card.guard_measurement", "card.guard_abstention", "card.pawn_trait", "card.pawn_dependency", ...common.slice(3)]);
    expect(compileBotCard(profile("pawn-forward.1000@1")).controlledTraits).toEqual(["pawn_move@1"]);
    expect(compileBotCard(profile("guarded-human.1000@1")).controlledTraits).toEqual([]);
  });

  it("renders the depth-8 measurements and never the depth-12 triple (bot-roster criterion 8)", () => {
    const pawn = text("pawn-forward.2200@1");
    expect(pawn).toContain("depth 8");
    expect(pawn).toContain("lowered expected loss by 1.36 cp");
    expect(pawn).toContain("from 33.5% to 45.8% (+12.3 points)");
    for (const depth12 of ["1.27 cp", "11.97", "100.2%", "depth 12"]) expect(pawn).not.toContain(depth12);
  });

  it("discloses the engine advantage, the whole-move abstention and the guard dependency", () => {
    const pawn = text("pawn-forward.1800@1");
    expect(pawn).toMatch(/engine information advantage/u);
    expect(pawn).toMatch(/stands aside for the whole move/u);
    expect(pawn).toMatch(/runs only when the Stockfish check ran/u);
    expect(text("human-baseline.1800@1")).not.toMatch(/Stockfish/u);
  });

  it("shows no strength number and no human-like label on an uncalibrated profile", () => {
    for (const entry of BOT_PROFILE_CATALOG) {
      const card = compileBotCard(entry);
      expect(card.strength).toEqual({ kind: "uncalibrated" });
      const body = card.statements.map((statement) => statement.text).join("\n");
      expect(body).not.toMatch(/\bElo\b/u);
      expect(body).not.toMatch(/human-like|plays like|aggressive|solid|tactical|positional|tricky|adaptive/iu);
      expect(body).not.toMatch(/hanging|plurality|always/iu);
      expect(body).toMatch(/not a FIDE, Lichess or Chess.com rating/u);
    }
  });

  it("renders a calibration only for the exact behaviour digest, with all three verdicts", () => {
    const entry = profile("guarded-human.1400@1");
    const card = compileBotCard(entry, receipt(entry));
    expect(card.strength).toMatchObject({ kind: "calibrated", relativeElo: -12.5, ci95: [-40.1, 15.2], humanLikeLabelAllowed: false });
    expect(card.statements.at(-1)!.text).toContain("-12.5 Elo against raw Maia band 1400 (95% CI -40.1 to 15.2)");
    expect(card.statements.at(-1)!.sources).toEqual(["calibration.receipt"]);
    const favourable = compileBotCard(entry, receipt(entry, { distribution: "human_reference_equivalent" }));
    expect(favourable.strength).toMatchObject({ humanLikeLabelAllowed: true });
    expect(() => compileBotCard(entry, receipt(profile("guarded-human.1800@1")))).toThrow(BotCardError);
    expect(() => compileBotCard(entry, receipt(entry, { strength: { verdict: "calibrated_relative", reference: "x" } }))).toThrow(BotCardError);
    expect(() => compileBotCard(entry, receipt(entry, { games: 0 }))).toThrow(BotCardError);
    expect(() => compileBotCard(entry, { ...receipt(entry), distribution: "pretty human" })).toThrow(BotCardError);
  });

  it("refuses a copied or malformed profile and accepts no caller sentence", () => {
    const entry = profile("human-baseline.1000@1");
    expect(() => compileBotCard({ ...entry })).toThrow(BotCardError);
    expect(() => compileBotCard({ ...entry, reference: { ...entry.reference, family: "pawn-forward" } })).toThrow(BotCardError);
    expect(compileBotCard.length).toBe(2);
  });
});

describe("roster projection (bot-policy §8; bot-roster §6.1)", () => {
  it("advertises exactly the catalog, uncalibrated, and conditional before any provider outcome is observed", () => {
    const roster = projectBotRoster();
    expect(roster.catalog).toEqual({ id: "bot-profile-catalog", version: 1 });
    expect(roster.profiles.map((row) => row.reference)).toEqual(BOT_PROFILE_CATALOG.map((entry) => entry.reference));
    for (const row of roster.profiles) {
      const guarded = row.reference.family !== "human-baseline";
      expect(row.startable).toEqual({ kind: "conditional", conditions: guarded ? ["maia_unverified", "stockfish_unverified", "guard_release_receipt_absent"] : ["maia_unverified"] });
      expect(row.card.strength.kind).toBe("uncalibrated");
    }
  });

  // A10 / opponent-experience criterion 5: the provider matrix. Baseline ignores Stockfish; guarded
  // families need both operations and stay conditional without a provider-health release receipt.
  it.each([
    ["Maia on, guard on", "available", "available", { kind: "available" }, { kind: "conditional", conditions: ["guard_release_receipt_absent"] }],
    ["Maia on, guard off", "available", "unavailable", { kind: "available" }, { kind: "unavailable", blockedBy: ["stockfish_unavailable"] }],
    ["Maia off, guard on", "unavailable", "available", { kind: "unavailable", blockedBy: ["maia_unavailable"] }, { kind: "unavailable", blockedBy: ["maia_unavailable"] }],
    ["both off", "unavailable", "unavailable", { kind: "unavailable", blockedBy: ["maia_unavailable"] }, { kind: "unavailable", blockedBy: ["maia_unavailable", "stockfish_unavailable"] }],
  ] as const)("%s projects the exact startability per family", (_label, maia, stockfish, baseline, guarded) => {
    const roster = projectBotRoster({ revision: 1, maia, stockfish });
    for (const row of roster.profiles) expect(row.startable).toEqual(row.reference.family === "human-baseline" ? baseline : guarded);
    expect(() => validateRoster(JSON.parse(JSON.stringify(roster.profiles)))).not.toThrow();
  });

  it("crosses the web capability parser unchanged", () => {
    expect(() => validateRoster(JSON.parse(JSON.stringify(projectBotRoster().profiles)))).not.toThrow();
  });

  it("attaches a receipt only to the matching behaviour digest", () => {
    const entry = profile("pawn-forward.1400@1");
    const roster = projectBotRoster(undefined, { [entry.behaviorDigest]: receipt(entry) });
    expect(roster.profiles.filter((row) => row.card.strength.kind === "calibrated").map((row) => row.reference.id)).toEqual(["pawn-forward.1400@1"]);
  });
});
