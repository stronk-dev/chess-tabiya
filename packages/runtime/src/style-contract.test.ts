// rfc/player-style.md acceptance criteria 4–10, 12, 13 and 15 over the production contract.
import { describe, expect, it } from "vitest";

import { castledWing, decisionTraitPopulation, hasFianchettoConfiguration, holdsCastlingRight, STANDARD_START_FEN } from "./style-atoms.js";
import {
  abstentionSentence,
  admitStyleParaphrase,
  assertReferenceIdentity,
  assertRenderableHabitCard,
  assertTierReadingGrounded,
  assertTierRuleGrounded,
  gameBootstrapInterval,
  gameEligibilityCount,
  gameUnitRate,
  insufficientTier,
  isSealedHabitCard,
  refusedTermsIn,
  sealHabitCard,
  shannonEntropyBits,
  STYLE_METRICS,
  STYLE_TIER_RULES,
  STYLE_TIME_CONTROL_SCOPE,
  styleCardTextCheck,
  styleMetric,
  styleParaphraseOutputCheck,
  tierFor,
  TIER_RULE_ID,
  type AbstainedHabitCard,
  type CatalogueCell,
  type HabitCard,
  type MeasuredHabitCard,
  type StyleMetric,
} from "./style-contract.js";

function measured(overrides: Partial<MeasuredHabitCard> = {}): MeasuredHabitCard {
  const metric = styleMetric("fianchetto_setup_rate")!;
  return {
    kind: "habit_card", state: "measured", metricId: metric.metricId, featureId: metric.featureId, version: 1, unit: "game",
    title: metric.title, floor: metric.floor, games: 63, decisions: 1800, phaseScope: "all", timeControlScope: STYLE_TIME_CONTROL_SCOPE,
    reference: null, valueDefinition: metric.valueDefinition, denominatorDefinition: metric.denominatorDefinition,
    sentence: "Across 63 measured games, you reached the declared fianchetto setup in 18 of 63 games (95% interval 0.18–0.40). This card's floor is 25 games.",
    contributors: { total: 18, shown: [], hiddenCount: 18 },
    tier: tierFor({ floor: 25, games: 63, decisions: 1800, phaseScope: "all", version: 1, rate: 18 / 63, interval: [0.18, 0.4], reference: null }),
    value: 18 / 63, valueText: "18 of 63 games", numerator: 18, eligibleGames: 63,
    interval: { level: 0.95, method: "game_bootstrap", resamples: 1000, seed: "s", lower: 0.18, upper: 0.4 },
    window: { from: "2026-01-01T00:00:00.000Z", to: "2026-03-01T00:00:00.000Z" }, baseline: null,
    ...overrides,
  };
}

function abstained(floor: 25 | 50 | 100 | 200, games: number): AbstainedHabitCard {
  const abstention = { code: "below_floor" as const, floor, measuredGames: games };
  return {
    kind: "habit_card", state: "abstained", metricId: "m", featureId: "f@1", version: 1, unit: "game", title: "t", floor, games, decisions: 0,
    phaseScope: "all", timeControlScope: STYLE_TIME_CONTROL_SCOPE, reference: null, valueDefinition: "v", denominatorDefinition: "d",
    sentence: abstentionSentence(abstention), contributors: { total: 0, shown: [], hiddenCount: 0 }, abstention,
    tier: insufficientTier(floor, games, "all", 1),
  };
}

describe("criterion 4 — no global confidence label is representable", () => {
  it("requires a per-row floor with no default, and two floors render different floor text", () => {
    // @ts-expect-error a registry row without its own floor does not type-check
    const missingFloor: StyleMetric<"game"> = {
      metricId: "x", featureId: "x@1", version: 1, unit: "game", blockerClass: "collector_store", referenceId: null, phaseScope: "all",
      title: "t", valueDefinition: "v", denominatorDefinition: "d", production: { kind: "read_time_projection", source: "s" },
    };
    expect(missingFloor).toBeDefined();
    expect(STYLE_METRICS.every((row) => [25, 50, 100, 200].includes(row.floor))).toBe(true);
    expect(abstained(25, 3).sentence).toBe("This card's floor is 25 games; 3 measured.");
    expect(abstained(200, 3).sentence).toBe("This card's floor is 200 games; 3 measured.");
    expect(new Set(STYLE_METRICS.map((row) => row.floor)).size).toBeGreaterThan(1);
  });
});

describe("criterion 5 — a game-unit row cannot read a decision-scoped opportunity count", () => {
  it("refuses a plain per-decision count at compile time and mints only from the eligibility projection", () => {
    const castling = styleMetric("castle_kingside_rate")! as StyleMetric<"game">;
    const storeOpportunities = 40; // e.g. LongitudinalObservationRow.opportunities
    // @ts-expect-error the store's per-decision opportunity count is not a game eligibility count
    expect(() => gameUnitRate(castling, 3, storeOpportunities)).not.toThrow();
    expect(gameUnitRate(castling, 3, gameEligibilityCount([1, 2, 3, 4]))).toBe(0.75);
    expect(() => gameUnitRate(styleMetric("pawn_choice_residual") as never, 1, gameEligibilityCount([1]))).toThrow(/STYLE_UNIT_MISMATCH/u);
  });
});

describe("criterion 6 — castling classification uses chessops.castlingSide", () => {
  it("classifies the D1062 Chess960 b1→a1 fixture, which a two-file king-step heuristic cannot", () => {
    const fen = "1k6/8/8/8/8/8/PPPP4/RK6 w Q - 0 1";
    expect(castledWing(fen, "b1a1")).toBe("queenside");
    const twoFileHeuristic = (uci: string): boolean => uci.startsWith("e1") && Math.abs(uci.charCodeAt(2) - uci.charCodeAt(0)) === 2;
    expect(twoFileHeuristic("b1a1")).toBe(false);
    expect(castledWing("4k3/8/8/8/8/8/8/R3K2R w KQ - 0 1", "e1g1")).toBe("kingside");
    expect(castledWing("4k3/8/8/8/8/8/8/R3K2R w KQ - 0 1", "e1h1")).toBe("kingside");
    expect(castledWing("4k3/8/8/8/8/8/8/R3K2R w KQ - 0 1", "e1c1")).toBe("queenside");
    expect(castledWing("4k3/8/8/8/8/8/8/R3K2R w KQ - 0 1", "e1f1")).toBeNull();
    expect(holdsCastlingRight(STANDARD_START_FEN, "white")).toBe(true);
    expect(holdsCastlingRight("4k3/8/8/8/8/8/8/R3K2R w - - 0 1", "white")).toBe(false);
  });

  it("reads the fianchetto configurations and the decision population exactly", () => {
    expect(hasFianchettoConfiguration("4k3/8/8/8/8/5NP1/6B1/4K2R w K - 0 1", "white", false)).toBe(true);
    expect(hasFianchettoConfiguration("4k3/8/8/8/8/5NP1/6B1/4K2R w K - 0 1", "white", true)).toBe(true);
    expect(hasFianchettoConfiguration("4k3/8/8/8/8/6P1/6B1/4K2R w K - 0 1", "white", true)).toBe(false);
    expect(hasFianchettoConfiguration(STANDARD_START_FEN, "white", false)).toBe(false);
    const start = decisionTraitPopulation(STANDARD_START_FEN, "e2e4")!;
    expect(start.legalMoves).toBe(20);
    expect(start.played).toEqual({ pawn: true, centerPawn: true, queen: false });
    expect(start.share).toEqual({ pawn: 16 / 20, centerPawn: 4 / 20, queen: 0 });
    expect(decisionTraitPopulation(STANDARD_START_FEN, "e2e5")).toBeUndefined();
  });
});

describe("criterion 7 — abstention renders the reason and the distance", () => {
  it("renders both numbers, never an empty state", () => {
    expect(abstained(25, 11).sentence).toBe("This card's floor is 25 games; 11 measured.");
    expect(abstentionSentence({ code: "blocked", blockerClass: "collector_store", blocked: "clock_readings_unrecorded", detail: "No clocks.", home: "x" })).toMatch(/cannot be measured yet\. No clocks\./u);
  });
});

describe("criterion 8 — STYLE_REFUSED_TERMS requires a baseline operand", () => {
  it("fails 'too simple' without a baseline and passes the identical card with one", () => {
    const text = "Across 63 measured games your middlegame pawn choices were too simple.";
    expect(styleCardTextCheck(measured(), text)).toEqual({ valid: false, violations: ["refused:simple", "refused:too"] });
    const withBaseline = measured({ baseline: { populationId: "fixture-band", version: 1, value: 0.2 } });
    expect(styleCardTextCheck(withBaseline, text)).toEqual({ valid: true, violations: [] });
    expect(refusedTermsIn("a positional player")).toEqual(["positional"]);
    expect(refusedTermsIn("a tooth is not a norm")).toEqual([]);
  });
});

describe("criterion 9 — assertTierRuleGrounded is a rule check, not a text check", () => {
  it("fails a rule other than the admissible one, fails a state reachable without its operands, passes the admissible rule", () => {
    expect(() => assertTierRuleGrounded()).not.toThrow();
    expect(() => assertTierRuleGrounded([{ ...STYLE_TIER_RULES[0]!, id: "rate_above_half@1" }])).toThrow(/TIER_RULE_UNGROUNDED/u);
    const bareWord = [{ id: TIER_RULE_ID, states: STYLE_TIER_RULES[0]!.states.map((state) => state.state === "distinctive" ? { state: state.state, requiredOperands: [] } : state) }];
    expect(() => assertTierRuleGrounded(bareWord)).toThrow(/distinctive is reachable without/u);
    const reading = tierFor({ floor: 25, games: 30, decisions: 900, phaseScope: "all", version: 1, rate: 0.3, interval: [0.2, 0.4], reference: null });
    expect(reading.state).toBe("established");
    expect(() => assertTierReadingGrounded(reading)).not.toThrow();
    expect(() => assertTierReadingGrounded({ ...reading, operands: { ...reading.operands, interval: undefined } as never })).toThrow(/TIER_READING_UNGROUNDED/u);
    expect(tierFor({ floor: 25, games: 24, decisions: 900, phaseScope: "all", version: 1, rate: 0.3, interval: [0.2, 0.4], reference: null }).state).toBe("insufficient_evidence");
    const reference = { id: "fixture", version: 1, median: 0.1, upperDecile: 0.3 };
    expect(tierFor({ floor: 25, games: 30, decisions: 9, phaseScope: "all", version: 1, rate: 0.5, interval: [0.35, 0.6], reference }).state).toBe("distinctive");
    expect(tierFor({ floor: 25, games: 30, decisions: 9, phaseScope: "all", version: 1, rate: 0.3, interval: [0.2, 0.4], reference }).state).toBe("above_reference");
  });
});

describe("criterion 10 — the reference is identity, and rating never renders", () => {
  it("exposes the versioned reference id and refuses a substituted reference as the same metric", () => {
    const surprisal = styleMetric("opening_surprisal")!;
    expect(surprisal.referenceId).toMatch(/@1$/u);
    expect(() => assertReferenceIdentity(surprisal, surprisal.referenceId)).not.toThrow();
    expect(() => assertReferenceIdentity(surprisal, "all-learners-fixed@1")).toThrow(/STYLE_REFERENCE_SUBSTITUTION/u);
  });
});

describe("criterion 12 — the catalogue and a habit card are distinguishable by type", () => {
  it("refuses a catalogue cell, and an unsealed look-alike, at the habit-card renderer", () => {
    const cell: CatalogueCell = { kind: "catalogue_cell", label: "Carlsbad structures", contentCount: 4 };
    expect(() => assertRenderableHabitCard(cell)).toThrow(/STYLE_CATALOGUE_CELL_REFUSED/u);
    expect(() => assertRenderableHabitCard(measured())).toThrow(/STYLE_CARD_UNSEALED/u);
    const sealed = sealHabitCard(measured());
    expect(() => assertRenderableHabitCard(sealed)).not.toThrow();
    expect(isSealedHabitCard({ ...sealed })).toBe(false);
  });

  it("converts a measured card missing a §3 field into an abstention rather than rendering it", () => {
    const sealed = sealHabitCard(measured({ interval: undefined as never }));
    expect(sealed.state).toBe("abstained");
    expect((sealed as AbstainedHabitCard).abstention).toMatchObject({ code: "incomplete_card" });
    expect(sealed.sentence).toMatch(/withheld: it is missing interval/u);
  });
});

describe("criterion 13 — the LLM paraphrases one sealed card or nothing", () => {
  it("refuses two cards, a model-chosen card, an undeclared population and an unsealed card; admits one sealed card", () => {
    const one = sealHabitCard(measured());
    const two = sealHabitCard(measured({ metricId: "castle_kingside_rate" }));
    expect(admitStyleParaphrase({ cards: [one, two], chosenBy: "learner" })).toEqual({ kind: "refused", code: "STYLE_PARAPHRASE_ONE_CARD" });
    expect(admitStyleParaphrase({ cards: [one], chosenBy: "model" })).toEqual({ kind: "refused", code: "STYLE_PARAPHRASE_MODEL_CHOSE" });
    expect(admitStyleParaphrase({ cards: [one], chosenBy: "learner", comparisonPopulationId: "all-players@1" })).toEqual({ kind: "refused", code: "STYLE_PARAPHRASE_UNDECLARED_POPULATION" });
    expect(admitStyleParaphrase({ cards: [measured()], chosenBy: "learner" })).toEqual({ kind: "refused", code: "STYLE_PARAPHRASE_UNSEALED" });
    expect(admitStyleParaphrase({ cards: [sealHabitCard(abstained(25, 3))], chosenBy: "learner" })).toEqual({ kind: "refused", code: "STYLE_PARAPHRASE_NOT_MEASURED" });
    const admitted = admitStyleParaphrase({ cards: [one], chosenBy: "learner" });
    expect(admitted.kind).toBe("admitted");
    const card = (admitted as { card: MeasuredHabitCard }).card;
    expect(styleParaphraseOutputCheck(card, "In 18 of your 63 measured games you reached the fianchetto setup.").valid).toBe(true);
    expect(styleParaphraseOutputCheck(card, "You fianchetto more than most players.").violations).toContain("undeclared_population:than most");
    expect(styleParaphraseOutputCheck(card, "You should fianchetto less; you are a solid player.").violations).toEqual(expect.arrayContaining(["prescription:should", "refused:solid"]));
  });
});

describe("criterion 15 — no card renders below its own floor", () => {
  it("abstains at floor − 1 and measures at floor, for every registry row", () => {
    for (const row of STYLE_METRICS) {
      const below = tierFor({ floor: row.floor, games: row.floor - 1, decisions: 0, phaseScope: row.phaseScope, version: 1, rate: 0.5, interval: [0.4, 0.6], reference: null });
      const at = tierFor({ floor: row.floor, games: row.floor, decisions: 0, phaseScope: row.phaseScope, version: 1, rate: 0.5, interval: [0.4, 0.6], reference: null });
      expect(below.state, row.metricId).toBe("insufficient_evidence");
      expect(at.state, row.metricId).toBe("established");
      expect(below.operands.rate, row.metricId).toBeUndefined();
    }
  });
});

describe("§3 — the deterministic game bootstrap", () => {
  it("is reproducible for a seed and brackets the point estimate", () => {
    const games = Array.from({ length: 60 }, (_, index) => (index % 3 === 0 ? 1 : 0));
    const mean = (sample: readonly number[]): number => sample.reduce((sum, value) => sum + value, 0) / sample.length;
    const first = gameBootstrapInterval(games, mean, "seed");
    expect(gameBootstrapInterval(games, mean, "seed")).toEqual(first);
    expect(first.lower).toBeLessThanOrEqual(mean(games));
    expect(first.upper).toBeGreaterThanOrEqual(mean(games));
    expect(first.upper - first.lower).toBeGreaterThan(0);
    expect(shannonEntropyBits(["B00", "B00", "C20", "C20"])).toBe(1);
    expect(shannonEntropyBits(["B00"])).toBe(0);
  });
});

describe("registry sentences stay inside the card-scoped vocabulary", () => {
  it("renders no refused term in any title or definition", () => {
    for (const row of STYLE_METRICS) {
      for (const text of [row.title, row.valueDefinition, row.denominatorDefinition]) {
        expect(refusedTermsIn(text), `${row.metricId}: ${text}`).toEqual([]);
      }
    }
  });

  it("types HabitCard as the only renderable union", () => {
    const card: HabitCard = sealHabitCard(abstained(50, 1));
    expect(card.kind).toBe("habit_card");
  });
});
