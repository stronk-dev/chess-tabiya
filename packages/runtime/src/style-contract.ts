// rfc/player-style.md — the production habit-card contract: the metric registry (§2), the card
// grammar (§3), the card-scoped refusal set (§4.1), the one admissible tier rule (§6), the
// reference-population wall (§7), the catalogue/habit-card type split (§1) and the LLM's
// one-sealed-card licence (§10.1). Pure data and pure functions: no chess library, no storage, so
// the web client imports the same refusal set it renders under.

// ---------------------------------------------------------------------------------------------
// §2 — the registry

export type StyleMetricUnit = "decision" | "game";
/** §11 blocker classes; the literal mirror of R21's three `productionGap` values. */
export type StyleBlockerClass = "opening_reference" | "denominator" | "collector_store";
/** R12's measured floors, in games. A registry row must name one; there is no default (§2.1). */
export type StyleFloorGames = 25 | 50 | 100 | 200;
export type StylePhaseScope = "opening" | "middlegame" | "endgame" | "all";

/**
 * How this landing produces the metric. `read_time_projection` rows are computed at read time from
 * the learner's own store-attributed played decisions (nothing is persisted); `blocked` rows abstain
 * on every read with the named reason until their blocker lands.
 */
export type StyleMetricProduction =
  | { readonly kind: "read_time_projection"; readonly source: string }
  | { readonly kind: "blocked"; readonly code: StyleBlockedCode; readonly reason: string; readonly home: string };

export type StyleBlockedCode = "reference_population_unpinned" | "clock_readings_unrecorded";

interface StyleMetricFields<U extends StyleMetricUnit> {
  /** R21's metric id: the registry key. Feature ids repeat across rows (castling, clocks). */
  readonly metricId: string;
  /** The literal versioned atom (§2 table). */
  readonly featureId: string;
  readonly version: 1;
  readonly unit: U;
  readonly floor: StyleFloorGames;
  readonly blockerClass: StyleBlockerClass;
  /** The versioned reference population, where the metric reads one (§7). */
  readonly referenceId: string | null;
  readonly phaseScope: StylePhaseScope;
  readonly title: string;
  readonly valueDefinition: string;
  readonly denominatorDefinition: string;
  readonly production: StyleMetricProduction;
}
export type StyleMetric<U extends StyleMetricUnit = StyleMetricUnit> = U extends StyleMetricUnit ? StyleMetricFields<U> : never;

/**
 * The time-control scope is carried as a field on every card, and at this landing it is always the
 * whole record: no run stores a time control (rfc/recorded-clocks.md is a returned draft).
 */
export const STYLE_TIME_CONTROL_SCOPE = "all_recorded_games" as const;
export const STYLE_TIME_CONTROL_SCOPE_TEXT = "all of your recorded games (time controls are not recorded yet)";

const CLOCK_BLOCK = Object.freeze({
  kind: "blocked",
  code: "clock_readings_unrecorded",
  reason: "No run records typed clock readings yet, so thinking time cannot be measured.",
  home: "rfc/recorded-clocks.md Discharge D4",
} as const);

function clockMetric(phase: "opening" | "middlegame" | "endgame", floor: StyleFloorGames): StyleMetric<"decision"> {
  return Object.freeze({
    metricId: `clock_spend_share:${phase}`,
    featureId: "time.spend_share@1",
    version: 1,
    unit: "decision",
    floor,
    blockerClass: "collector_store",
    referenceId: null,
    phaseScope: phase,
    title: `Time used per ${phase} move`,
    valueDefinition: "mean share of the time available for each move that the move used",
    denominatorDefinition: `decisions with valid adjacent clock readings in the ${phase}`,
    production: CLOCK_BLOCK,
  });
}

/**
 * The production registry. `tools/style-registry-check` holds it set-equal, by metric id, feature id
 * and floor, to R21's instrument rows whose R12 `persistentFloors` value is non-null — never to a
 * copied list. The count (twelve at landing) is a drift tripwire only.
 */
export const STYLE_METRICS: readonly StyleMetric[] = Object.freeze([
  Object.freeze({
    metricId: "opening_surprisal",
    featureId: "opening.move_population_share@1",
    version: 1,
    unit: "decision",
    floor: 25,
    blockerClass: "opening_reference",
    referenceId: "lichess-rated-blitz-2026-07-band@1",
    phaseScope: "opening",
    title: "How common your first eight plies are",
    valueDefinition: "mean surprisal of your moves against a pinned reference population of games",
    denominatorDefinition: "your decisions through ply 8 whose exact position has at least 50 reference games",
    production: Object.freeze({
      kind: "blocked",
      code: "reference_population_unpinned",
      reason: "No versioned opening reference population is installed in production; the one this metric was measured against is research data.",
      home: "rfc/player-style.md §11.2 (opening reference)",
    }),
  } satisfies StyleMetric<"decision">),
  Object.freeze({
    metricId: "opening_family_entropy",
    featureId: "opening.family@1",
    version: 1,
    unit: "game",
    floor: 100,
    blockerClass: "opening_reference",
    referenceId: null,
    phaseScope: "opening",
    title: "How many opening families your games cover",
    valueDefinition: "Shannon entropy, in bits, over the ECO codes your games reached",
    denominatorDefinition: "games whose line reached a named opening in the installed catalogue",
    production: Object.freeze({ kind: "read_time_projection", source: "runtime opening identity: deepest named endpoint on each game's first line" }),
  } satisfies StyleMetric<"game">),
  Object.freeze({
    metricId: "fianchetto_setup_rate",
    featureId: "structure.fianchetto_setup@1",
    version: 1,
    unit: "game",
    floor: 25,
    blockerClass: "collector_store",
    referenceId: null,
    phaseScope: "all",
    title: "Fianchetto setup reached",
    valueDefinition: "games in which your bishop stood on b2/g2 (b7/g7) in front of your pawn on b3/g3 (b6/g6)",
    denominatorDefinition: "measured games",
    production: Object.freeze({ kind: "read_time_projection", source: "piece-square configuration over each game's first line" }),
  } satisfies StyleMetric<"game">),
  Object.freeze({
    metricId: "fianchetto_knight_screen_rate",
    featureId: "structure.fianchetto_knight_screen@1",
    version: 1,
    unit: "game",
    floor: 200,
    blockerClass: "collector_store",
    referenceId: null,
    phaseScope: "all",
    title: "Fianchetto setup with the knight in front",
    valueDefinition: "games reaching the fianchetto setup with your same-side knight on c3/f3 (c6/f6)",
    denominatorDefinition: "measured games",
    production: Object.freeze({ kind: "read_time_projection", source: "piece-square configuration over each game's first line" }),
  } satisfies StyleMetric<"game">),
  Object.freeze({
    metricId: "castle_kingside_rate",
    featureId: "move.castle_side@1",
    version: 1,
    unit: "game",
    floor: 50,
    blockerClass: "denominator",
    referenceId: null,
    phaseScope: "all",
    title: "Castled kingside",
    valueDefinition: "games in which you castled kingside",
    denominatorDefinition: "games in which you still had a castling right at your first move",
    production: Object.freeze({ kind: "read_time_projection", source: "chessops castlingSide over your moves plus your castling rights at your first move" }),
  } satisfies StyleMetric<"game">),
  Object.freeze({
    metricId: "castle_queenside_rate",
    featureId: "move.castle_side@1",
    version: 1,
    unit: "game",
    floor: 50,
    blockerClass: "denominator",
    referenceId: null,
    phaseScope: "all",
    title: "Castled queenside",
    valueDefinition: "games in which you castled queenside",
    denominatorDefinition: "games in which you still had a castling right at your first move",
    production: Object.freeze({ kind: "read_time_projection", source: "chessops castlingSide over your moves plus your castling rights at your first move" }),
  } satisfies StyleMetric<"game">),
  clockMetric("opening", 100),
  clockMetric("middlegame", 50),
  clockMetric("endgame", 25),
  Object.freeze({
    metricId: "pawn_choice_residual",
    featureId: "move.role.pawn@1",
    version: 1,
    unit: "decision",
    floor: 100,
    blockerClass: "collector_store",
    referenceId: null,
    phaseScope: "all",
    title: "Pawn moves compared with the legal choices you had",
    valueDefinition: "mean of (1 if you moved a pawn, else 0) minus the share of your legal moves that were pawn moves",
    denominatorDefinition: "your decisions, each with its complete set of legal moves",
    production: Object.freeze({ kind: "read_time_projection", source: "move role over the complete legal-move set of each decision" }),
  } satisfies StyleMetric<"decision">),
  Object.freeze({
    metricId: "center_pawn_choice_residual",
    featureId: "move.pawn_to_extended_center@1",
    version: 1,
    unit: "decision",
    floor: 200,
    blockerClass: "collector_store",
    referenceId: null,
    phaseScope: "all",
    title: "Pawn moves to c4–f5 compared with the legal choices you had",
    valueDefinition: "mean of (1 if you moved a pawn to c4, d4, e4, f4, c5, d5, e5 or f5, else 0) minus that move type's share of your legal moves",
    denominatorDefinition: "your decisions, each with its complete set of legal moves",
    production: Object.freeze({ kind: "read_time_projection", source: "move role and destination over the complete legal-move set of each decision" }),
  } satisfies StyleMetric<"decision">),
  Object.freeze({
    metricId: "early_queen_choice_residual",
    featureId: "move.early_queen@1",
    version: 1,
    unit: "decision",
    floor: 100,
    blockerClass: "collector_store",
    referenceId: null,
    phaseScope: "opening",
    title: "Queen moves before ply 16 compared with the legal choices you had",
    valueDefinition: "mean of (1 if you moved your queen, else 0) minus the share of your legal moves that were queen moves, before ply 16",
    denominatorDefinition: "your decisions before ply 16, each with its complete set of legal moves",
    production: Object.freeze({ kind: "read_time_projection", source: "move role and ply over the complete legal-move set of each decision" }),
  } satisfies StyleMetric<"decision">),
]);

/** The drift tripwire recorded at landing; the check asserts set-equality, never this number. */
export const STYLE_METRIC_COUNT_AT_LANDING = 12;

export function styleMetric(metricId: string): StyleMetric | undefined {
  return STYLE_METRICS.find((row) => row.metricId === metricId);
}

// ---------------------------------------------------------------------------------------------
// §2.2 — the two denominators are different populations, and the types keep them apart

declare const gameEligibilityBrand: unique symbol;
declare const decisionPopulationBrand: unique symbol;
/** A count of games eligible for a game-unit metric; only a game-eligibility projection mints one. */
export type GameEligibilityCount = number & { readonly [gameEligibilityBrand]: "game" };
/** A count of decisions with a complete legal-move population; only the decision projection mints one. */
export type DecisionPopulationCount = number & { readonly [decisionPopulationBrand]: "decision" };

function countOf(value: number, code: string): number {
  if (!Number.isSafeInteger(value) || value < 0) throw new StyleContractError(code, "count must be a non-negative safe integer");
  return value;
}

/** Minted from the per-game eligibility projection (for castling: a right held at the first move). */
export function gameEligibilityCount(eligibleGames: readonly unknown[]): GameEligibilityCount {
  return countOf(eligibleGames.length, "STYLE_GAME_ELIGIBILITY_INVALID") as GameEligibilityCount;
}

/** Minted from decisions whose complete legal-move population was enumerated. */
export function decisionPopulationCount(decisions: readonly unknown[]): DecisionPopulationCount {
  return countOf(decisions.length, "STYLE_DECISION_POPULATION_INVALID") as DecisionPopulationCount;
}

/**
 * A game-unit rate. Its denominator parameter admits only a `GameEligibilityCount`; a plain number —
 * such as the longitudinal store's per-decision `opportunities` — does not compile (criterion 5).
 */
export function gameUnitRate(metric: StyleMetric<"game">, occurredGames: number, eligible: GameEligibilityCount): number {
  if (metric.unit !== "game") throw new StyleContractError("STYLE_UNIT_MISMATCH", `${metric.metricId} is not a game-unit metric`);
  countOf(occurredGames, "STYLE_RATE_INVALID");
  if (occurredGames > eligible) throw new StyleContractError("STYLE_RATE_INVALID", "occurred games exceed eligible games");
  return eligible === 0 ? 0 : occurredGames / eligible;
}

export class StyleContractError extends TypeError {
  constructor(readonly code: string, message = code) {
    super(message.startsWith(code) ? message : `${code}: ${message}`);
    this.name = "StyleContractError";
  }
}

// ---------------------------------------------------------------------------------------------
// §3 — the card grammar

export interface StyleContributorRef {
  readonly runId: string;
  readonly nodeId: string;
  readonly ply: number;
  readonly moveSan: string | null;
  readonly observedAt: string;
}

/** The drill-down: never silently truncated (§8). */
export interface StyleContributors {
  readonly total: number;
  readonly shown: readonly StyleContributorRef[];
  readonly hiddenCount: number;
}

export interface StyleInterval {
  readonly level: 0.95;
  readonly method: "game_bootstrap";
  readonly resamples: number;
  readonly seed: string;
  readonly lower: number;
  readonly upper: number;
}

export interface StyleWindow {
  readonly from: string;
  readonly to: string;
}

/** A population comparison operand. None exists in production; §5 makes it the only licence for a norm word. */
export interface StyleBaselineOperand {
  readonly populationId: string;
  readonly version: number;
  readonly value: number;
}

export type StyleAbstention =
  | { readonly code: "below_floor"; readonly floor: StyleFloorGames; readonly measuredGames: number }
  | { readonly code: "blocked"; readonly blockerClass: StyleBlockerClass; readonly blocked: StyleBlockedCode; readonly detail: string; readonly home: string }
  | { readonly code: "incomplete_card"; readonly missing: readonly string[] };

export const TIER_RULE_ID = "reference_quantile_lower_bound@1" as const;
export type TierState = "insufficient_evidence" | "established" | "above_reference" | "distinctive";
export type TierOperand = "rate" | "interval" | "population" | "phase" | "timeControl" | "version" | "floor" | "games" | "reference";

export interface TierReading {
  readonly rule: typeof TIER_RULE_ID;
  readonly state: TierState;
  readonly operands: Readonly<Partial<Record<TierOperand, string | number | readonly [number, number]>>>;
}

interface HabitCardBase {
  readonly kind: "habit_card";
  readonly metricId: string;
  readonly featureId: string;
  readonly version: number;
  readonly unit: StyleMetricUnit;
  readonly title: string;
  readonly floor: StyleFloorGames;
  readonly games: number;
  readonly decisions: number;
  readonly phaseScope: StylePhaseScope;
  readonly timeControlScope: typeof STYLE_TIME_CONTROL_SCOPE;
  readonly reference: { readonly id: string; readonly version: number } | null;
  readonly valueDefinition: string;
  readonly denominatorDefinition: string;
  readonly sentence: string;
  readonly contributors: StyleContributors;
  readonly tier: TierReading;
}

export interface MeasuredHabitCard extends HabitCardBase {
  readonly state: "measured";
  readonly value: number;
  readonly valueText: string;
  /** Game-unit rates carry their numerator; decision residuals and entropy carry null. */
  readonly numerator: number | null;
  /** The game-unit denominator (eligible games), or null for decision-unit metrics. */
  readonly eligibleGames: number | null;
  readonly interval: StyleInterval;
  readonly window: StyleWindow;
  readonly baseline: StyleBaselineOperand | null;
}

export interface AbstainedHabitCard extends HabitCardBase {
  readonly state: "abstained";
  readonly abstention: StyleAbstention;
}

export type HabitCard = MeasuredHabitCard | AbstainedHabitCard;

/** A catalogue cell: the content catalogue's count. It is a different object and never a habit card (§1). */
export interface CatalogueCell {
  readonly kind: "catalogue_cell";
  readonly label: string;
  readonly contentCount: number;
}

/** §3's non-negotiable fields of a measured card. A missing one makes the card abstain, never render. */
export const MEASURED_CARD_REQUIRED_FIELDS = Object.freeze([
  "metricId", "featureId", "version", "value", "interval", "games", "decisions", "floor", "window",
  "phaseScope", "timeControlScope", "contributors", "tier",
] as const);

export function missingMeasuredFields(card: Readonly<Record<string, unknown>>): readonly string[] {
  const missing: string[] = [];
  for (const field of MEASURED_CARD_REQUIRED_FIELDS) {
    const value = card[field];
    if (value === undefined || value === null || (typeof value === "number" && !Number.isFinite(value))) missing.push(field);
  }
  const interval = card.interval as StyleInterval | undefined;
  if (interval !== undefined && interval !== null && (!Number.isFinite(interval.lower) || !Number.isFinite(interval.upper))) missing.push("interval.bounds");
  const reference = card.reference as HabitCardBase["reference"] | undefined;
  if (reference === undefined) missing.push("reference");
  return Object.freeze(missing);
}

/** §3.1 — the literal abstention render: reason and distance, never an empty state. */
export function abstentionSentence(abstention: StyleAbstention): string {
  if (abstention.code === "below_floor") {
    return `This card's floor is ${abstention.floor} games; ${abstention.measuredGames} measured.`;
  }
  if (abstention.code === "blocked") return `This card cannot be measured yet. ${abstention.detail}`;
  return `This card is withheld: it is missing ${abstention.missing.join(", ")}.`;
}

/** Brands the only renderable card objects; a spread or hand-built object is not sealed. */
const SEALED_CARDS = new WeakSet<object>();

/**
 * Seals a card for rendering and paraphrase. A measured card missing any §3 field is converted to
 * an `incomplete_card` abstention rather than rendered (§3).
 */
export function sealHabitCard(card: HabitCard): HabitCard {
  if (card.kind !== "habit_card") throw new StyleContractError("STYLE_CARD_NOT_HABIT", "only a habit card can be sealed");
  let sealed: HabitCard = card;
  if (card.state === "measured") {
    const missing = missingMeasuredFields(card as unknown as Readonly<Record<string, unknown>>);
    if (missing.length > 0) {
      const abstention: StyleAbstention = { code: "incomplete_card", missing };
      sealed = {
        kind: "habit_card", state: "abstained", metricId: card.metricId, featureId: card.featureId, version: card.version,
        unit: card.unit, title: card.title, floor: card.floor, games: card.games, decisions: card.decisions,
        phaseScope: card.phaseScope, timeControlScope: card.timeControlScope, reference: card.reference ?? null,
        valueDefinition: card.valueDefinition, denominatorDefinition: card.denominatorDefinition,
        sentence: abstentionSentence(abstention), contributors: card.contributors, abstention,
        tier: insufficientTier(card.floor, card.games, card.phaseScope, card.version),
      };
    }
  }
  const frozen = deepFreeze(structuredClone(sealed));
  SEALED_CARDS.add(frozen);
  return frozen;
}

export function isSealedHabitCard(value: unknown): value is HabitCard {
  return value !== null && typeof value === "object" && SEALED_CARDS.has(value);
}

/**
 * The habit-card renderer's admission (criterion 12): a catalogue cell, or any unsealed object, is
 * refused even if it carries a count and a label.
 */
export function assertRenderableHabitCard(value: HabitCard | CatalogueCell | unknown): asserts value is HabitCard {
  const kind = value !== null && typeof value === "object" ? (value as { kind?: unknown }).kind : undefined;
  if (kind === "catalogue_cell") throw new StyleContractError("STYLE_CATALOGUE_CELL_REFUSED", "a catalogue count is not a habit card");
  if (!isSealedHabitCard(value)) throw new StyleContractError("STYLE_CARD_UNSEALED", "only a sealed habit card renders");
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  }
  return value;
}

// ---------------------------------------------------------------------------------------------
// §6 — the one admissible tier rule, checked as a rule and not as text

export interface TierRuleDeclaration {
  readonly id: string;
  readonly states: readonly { readonly state: TierState; readonly requiredOperands: readonly TierOperand[] }[];
}

const ARITHMETIC: readonly TierOperand[] = Object.freeze(["rate", "interval", "population", "phase", "timeControl", "version"]);

export const STYLE_TIER_RULES: readonly TierRuleDeclaration[] = Object.freeze([Object.freeze({
  id: TIER_RULE_ID,
  states: Object.freeze([
    Object.freeze({ state: "insufficient_evidence" as const, requiredOperands: Object.freeze(["floor", "games", "population", "phase", "timeControl", "version"] as TierOperand[]) }),
    Object.freeze({ state: "established" as const, requiredOperands: ARITHMETIC }),
    Object.freeze({ state: "above_reference" as const, requiredOperands: Object.freeze([...ARITHMETIC, "reference"] as TierOperand[]) }),
    Object.freeze({ state: "distinctive" as const, requiredOperands: Object.freeze([...ARITHMETIC, "reference"] as TierOperand[]) }),
  ]),
})]);

const TIER_STATES: readonly TierState[] = Object.freeze(["insufficient_evidence", "established", "above_reference", "distinctive"]);

/**
 * §6 criterion 9: fails if any registered rule is not `reference_quantile_lower_bound@1`, if the
 * four states are not exactly declared, or if a state is reachable without its arithmetic operands.
 */
export function assertTierRuleGrounded(rules: readonly TierRuleDeclaration[] = STYLE_TIER_RULES): void {
  if (rules.length === 0) throw new StyleContractError("TIER_RULE_UNGROUNDED", "no tier rule is registered");
  for (const rule of rules) {
    if (rule.id !== TIER_RULE_ID) throw new StyleContractError("TIER_RULE_UNGROUNDED", `tier rule ${rule.id} is not ${TIER_RULE_ID}`);
    const states = rule.states.map((entry) => entry.state);
    if (states.length !== TIER_STATES.length || TIER_STATES.some((state) => !states.includes(state))) {
      throw new StyleContractError("TIER_RULE_UNGROUNDED", "the rule must declare exactly the four states");
    }
    for (const entry of rule.states) {
      const required = entry.state === "insufficient_evidence" ? ["floor", "games", "population", "phase", "timeControl", "version"] : entry.state === "established" ? ARITHMETIC : [...ARITHMETIC, "reference"];
      const missing = required.filter((operand) => !entry.requiredOperands.includes(operand as TierOperand));
      if (missing.length > 0) throw new StyleContractError("TIER_RULE_UNGROUNDED", `state ${entry.state} is reachable without ${missing.join(", ")}`);
    }
  }
}

/** A tier reading must carry every operand its state requires, in the same card. */
export function assertTierReadingGrounded(reading: TierReading, rules: readonly TierRuleDeclaration[] = STYLE_TIER_RULES): void {
  assertTierRuleGrounded(rules);
  const declaration = rules.find((rule) => rule.id === reading.rule)?.states.find((entry) => entry.state === reading.state);
  if (declaration === undefined) throw new StyleContractError("TIER_RULE_UNGROUNDED", `state ${reading.state} is not declared`);
  const missing = declaration.requiredOperands.filter((operand) => reading.operands[operand] === undefined || reading.operands[operand] === null);
  if (missing.length > 0) throw new StyleContractError("TIER_READING_UNGROUNDED", `state ${reading.state} rendered without ${missing.join(", ")}`);
}

export function populationText(games: number, decisions: number): string {
  return `${games} measured game${games === 1 ? "" : "s"}, ${decisions} decision${decisions === 1 ? "" : "s"}`;
}

export function insufficientTier(floor: StyleFloorGames, games: number, phaseScope: StylePhaseScope, version: number): TierReading {
  return Object.freeze({
    rule: TIER_RULE_ID,
    state: "insufficient_evidence",
    operands: Object.freeze({ floor, games, population: "your recorded games", phase: phaseScope, timeControl: STYLE_TIME_CONTROL_SCOPE, version }),
  });
}

/**
 * The rule itself. Without a pinned reference population (none exists in production) a card that
 * clears its floor is `established`; the reference states are reachable only through a versioned
 * reference with quantiles, and only on the interval's lower bound.
 */
export function tierFor(input: {
  readonly floor: StyleFloorGames;
  readonly games: number;
  readonly decisions: number;
  readonly phaseScope: StylePhaseScope;
  readonly version: number;
  readonly rate: number;
  readonly interval: readonly [number, number];
  readonly reference: { readonly id: string; readonly version: number; readonly median: number; readonly upperDecile: number } | null;
}): TierReading {
  if (input.games < input.floor) return insufficientTier(input.floor, input.games, input.phaseScope, input.version);
  const operands = {
    rate: input.rate, interval: input.interval, population: populationText(input.games, input.decisions),
    phase: input.phaseScope, timeControl: STYLE_TIME_CONTROL_SCOPE, version: input.version,
  };
  if (input.reference === null) return Object.freeze({ rule: TIER_RULE_ID, state: "established", operands: Object.freeze(operands) });
  const withReference = Object.freeze({ ...operands, reference: `${input.reference.id}@${input.reference.version}` });
  if (input.interval[0] > input.reference.upperDecile) return Object.freeze({ rule: TIER_RULE_ID, state: "distinctive", operands: withReference });
  if (input.interval[0] > input.reference.median) return Object.freeze({ rule: TIER_RULE_ID, state: "above_reference", operands: withReference });
  return Object.freeze({ rule: TIER_RULE_ID, state: "established", operands: withReference });
}

// ---------------------------------------------------------------------------------------------
// §7 — the reference population may select, never speak

/**
 * A reference is part of the metric's identity: exchanging it (for example for a fixed all-learner
 * reference) is a new metric version requiring re-measurement, never a substitution.
 */
export function assertReferenceIdentity(metric: StyleMetric, referenceId: string | null): void {
  if (metric.referenceId !== referenceId) {
    throw new StyleContractError("STYLE_REFERENCE_SUBSTITUTION", `${metric.metricId}@${metric.version} is defined over ${metric.referenceId ?? "no reference"}; ${referenceId ?? "no reference"} is a new metric version`);
  }
}

// ---------------------------------------------------------------------------------------------
// §4.1 — the card-scoped refusal set

/** Norm, type and valence words. Each renders only beside a baseline operand in the same sealed card. */
export const STYLE_REFUSED_TERMS = Object.freeze([
  "too", "enough", "simple", "positional", "tactical", "aggressive", "solid", "creative", "patient",
  "strength", "strengths", "weakness", "weaknesses", "needs work", "plays like", "grandmaster twin", "gm twin",
  "archetype", "personality", "style type",
] as const);

/** Words that compare against a population the card did not declare (§10.1). */
export const STYLE_UNDECLARED_COMPARISON_TERMS = Object.freeze([
  "most players", "other players", "average player", "typical player", "compared with others", "than others",
  "than most", "your peers", "players like you", "percentile",
] as const);

function termPattern(term: string): RegExp {
  return new RegExp(`(^|[^a-z])${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|[^a-z])`, "i");
}

export function refusedTermsIn(text: string, terms: readonly string[] = STYLE_REFUSED_TERMS): readonly string[] {
  return Object.freeze(terms.filter((term) => termPattern(term).test(text)).sort());
}

export interface StyleTextCheck { readonly valid: boolean; readonly violations: readonly string[] }

/**
 * Criterion 8: a refused term in text about a card is legal only when that card carries a baseline
 * operand. Undeclared comparisons are refused unconditionally.
 */
export function styleCardTextCheck(card: HabitCard, text: string): StyleTextCheck {
  const violations: string[] = [];
  const hasBaseline = card.state === "measured" && card.baseline !== null;
  if (!hasBaseline) for (const term of refusedTermsIn(text)) violations.push(`refused:${term}`);
  for (const term of refusedTermsIn(text, STYLE_UNDECLARED_COMPARISON_TERMS)) violations.push(`undeclared_population:${term}`);
  return Object.freeze({ valid: violations.length === 0, violations: Object.freeze(violations) });
}

// ---------------------------------------------------------------------------------------------
// §10.1 — the LLM's entire licence: paraphrase one sealed, admitted card

export interface StyleParaphraseRequest {
  readonly cards: readonly unknown[];
  /** Who chose the card: the learner (by opening it) or anything else. */
  readonly chosenBy: "learner" | "model";
  /** A comparison population the paraphrase may mention; only the card's own reference is declared. */
  readonly comparisonPopulationId?: string;
}

export type StyleParaphraseAdmission =
  | { readonly kind: "admitted"; readonly card: MeasuredHabitCard }
  | { readonly kind: "refused"; readonly code: "STYLE_PARAPHRASE_ONE_CARD" | "STYLE_PARAPHRASE_MODEL_CHOSE" | "STYLE_PARAPHRASE_UNSEALED" | "STYLE_PARAPHRASE_NOT_MEASURED" | "STYLE_PARAPHRASE_UNDECLARED_POPULATION" };

export function admitStyleParaphrase(request: StyleParaphraseRequest): StyleParaphraseAdmission {
  if (request.cards.length !== 1) return { kind: "refused", code: "STYLE_PARAPHRASE_ONE_CARD" };
  if (request.chosenBy !== "learner") return { kind: "refused", code: "STYLE_PARAPHRASE_MODEL_CHOSE" };
  const card = request.cards[0];
  if (!isSealedHabitCard(card)) return { kind: "refused", code: "STYLE_PARAPHRASE_UNSEALED" };
  if (card.state !== "measured") return { kind: "refused", code: "STYLE_PARAPHRASE_NOT_MEASURED" };
  if (request.comparisonPopulationId !== undefined) {
    const declared = card.reference === null ? undefined : `${card.reference.id}@${card.reference.version}`;
    if (request.comparisonPopulationId !== declared) return { kind: "refused", code: "STYLE_PARAPHRASE_UNDECLARED_POPULATION" };
  }
  return { kind: "admitted", card };
}

/** Prescriptions a paraphrase may never add (the coaching contract owns advice). */
export const STYLE_PRESCRIPTION_TERMS = Object.freeze([
  "should", "must", "try to", "you need", "work on", "improve", "practise", "practice", "focus on", "play more", "play less", "avoid",
] as const);

/** Output check for an admitted paraphrase: no refused term, no undeclared comparison, no advice. */
export function styleParaphraseOutputCheck(card: MeasuredHabitCard, output: string): StyleTextCheck {
  const base = styleCardTextCheck(card, output);
  const violations = [...base.violations];
  for (const term of refusedTermsIn(output, STYLE_PRESCRIPTION_TERMS)) {
    if (refusedTermsIn(card.sentence, [term]).length === 0) violations.push(`prescription:${term}`);
  }
  return Object.freeze({ valid: violations.length === 0, violations: Object.freeze(violations) });
}

// ---------------------------------------------------------------------------------------------
// §3 — the 95% game-bootstrap interval, deterministic by seed

function seedState(seed: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
}

function mulberry32(state: number): () => number {
  let value = state >>> 0;
  return () => {
    value = (value + 0x6d2b79f5) >>> 0;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const STYLE_BOOTSTRAP_RESAMPLES = 1000;

/**
 * Percentile bootstrap over games: each resample draws games with replacement and recomputes the
 * statistic over the drawn games (a game's decisions travel together). Deterministic for a seed.
 */
export function gameBootstrapInterval<T>(
  games: readonly T[],
  statistic: (sample: readonly T[]) => number,
  seed: string,
  resamples = STYLE_BOOTSTRAP_RESAMPLES,
): StyleInterval {
  if (games.length === 0) throw new StyleContractError("STYLE_BOOTSTRAP_EMPTY", "a bootstrap needs at least one game");
  const random = mulberry32(seedState(seed));
  const values: number[] = [];
  const sample: T[] = new Array<T>(games.length);
  for (let draw = 0; draw < resamples; draw += 1) {
    for (let index = 0; index < games.length; index += 1) sample[index] = games[Math.floor(random() * games.length)]!;
    const value = statistic(sample);
    if (Number.isFinite(value)) values.push(value);
  }
  values.sort((left, right) => left - right);
  const at = (quantile: number): number => values[Math.min(values.length - 1, Math.max(0, Math.round(quantile * (values.length - 1))))]!;
  return Object.freeze({ level: 0.95, method: "game_bootstrap", resamples, seed, lower: at(0.025), upper: at(0.975) });
}

/** Shannon entropy, in bits, over a multiset of labels. */
export function shannonEntropyBits(labels: readonly string[]): number {
  if (labels.length === 0) return 0;
  const counts = new Map<string, number>();
  for (const label of labels) counts.set(label, (counts.get(label) ?? 0) + 1);
  let entropy = 0;
  for (const count of counts.values()) {
    const p = count / labels.length;
    entropy -= p * Math.log2(p);
  }
  return entropy === 0 ? 0 : entropy;
}
