// rfc/player-style.md + rfc/skills.md — the learner profile: the first consumer of the longitudinal
// store (rfc/longitudinal-store.md). Every number here is read-time arithmetic over the learner's
// own store-attributed decisions at the store's exact completed cuts; nothing is persisted, and no
// path reads another learner's rows. Cards abstain until their own floor clears; blocked metrics
// abstain with their named blocker. There is no confidence badge, archetype, player comparison,
// weakness ranking or advice anywhere in this module.
import {
  castledWing,
  deriveConceptMarks,
  EMPTY_CATEGORY_REASONS,
  gameBootstrapInterval,
  gameEligibilityCount,
  gameUnitRate,
  insufficientTier,
  readBackReplay,
  sealHabitCard,
  shannonEntropyBits,
  SKILL_CATEGORIES,
  SKILL_CATEGORY_LABELS,
  SKILL_CONCEPT_LEAF_MIN_PACKS,
  SKILL_LEAF_BLOCKER_TEXT,
  STANDARD_START_FEN,
  STYLE_METRICS,
  STYLE_TIME_CONTROL_SCOPE,
  STYLE_TIME_CONTROL_SCOPE_TEXT,
  abstentionSentence,
  assertTierReadingGrounded,
  styleCardTextCheck,
  styleMetric,
  tierFor,
  transposeKey,
  validateValenceRegister,
  EARLY_QUEEN_PLY_BOUND,
  PRIMARY_EVIDENCE_MANIFEST,
  type AdmittedSkillLeaf,
  type CompiledConceptRegistry,
  type DeclaredEvidence,
  type PackConceptReferencePayload,
  type ConceptMark,
  type DrillRun,
  type EvidenceGrounding,
  type HabitCard,
  type MeasuredHabitCard,
  type Node,
  type RunSessionKind,
  type SkillCategory,
  type SkillLeaf,
  type StyleAbstention,
  type StyleContributorRef,
  type StyleContributors,
  type StyleMetric,
  type ValenceRegister,
} from "@chess-tabiya/runtime";

import type { Principal } from "./authorization.js";
import { ServerError } from "./errors.js";
import {
  LongitudinalReadIntegrityError,
  parseLongitudinalReadQuery,
  type LongitudinalCompleteCut,
  type LongitudinalCutOutcome,
  type LongitudinalPhase,
  type LongitudinalReadResult,
  type ParsedLongitudinalReadQuery,
} from "./longitudinal-contract.js";
import { profileGameFactReferenceIndex, assertProfileGameFactReferenceIndex } from "./profile-game-fact-references.js";
import { parseLongitudinalGameFactRow, type GameFactReadOutcome } from "./profile-game-facts-contract.js";
import { profileChoiceFactReferenceIndex, assertProfileChoiceFactReferenceIndex } from "./profile-choice-fact-references.js";
import { parseLongitudinalChoiceFactRow, type ChoiceFactReadOutcome } from "./profile-choice-facts-contract.js";
import { normativeDecisions } from "./longitudinal-decisions.js";
import { LONGITUDINAL_TABLES } from "./longitudinal-store.js";
import { OBSERVATION_DERIVATION_REV } from "./longitudinal-registry.js";
import type { LongitudinalSourceImageV4 } from "./longitudinal-source.js";
import { deepestOpeningReached, recordedOpeningPosition, type OpeningCatalogueAvailability } from "./opening-catalogue.js";

// ---------------------------------------------------------------------------------------------
// Dependencies

export interface LearnerProfileStorage {
  readLongitudinalSnapshot(actorLearnerId: string, query: ParsedLongitudinalReadQuery): LongitudinalReadResult;
  longitudinalSourceImageV4(runId: string, requestedSeq: number): LongitudinalSourceImageV4;
  longitudinalSourceDigestV4(image: LongitudinalSourceImageV4): `sha256:${string}`;
  applicationTableNames(): readonly string[];
}

export interface LearnerProfilePack { readonly id: string; readonly title: string; readonly startFen: string }
export interface LearnerProfileShape { readonly id: string; readonly name: string }

export interface LearnerProfileDependencies {
  readonly storage: LearnerProfileStorage;
  readonly longitudinalStatus: () => string;
  readonly openingCatalogue: OpeningCatalogueAvailability;
  readonly packs?: () => readonly LearnerProfilePack[];
  readonly shapes?: () => readonly LearnerProfileShape[];
  /**
   * rfc/concept-registry.md §3: the installed packs' identity-only
   * `pack.authored.concept_reference@1` population and the compiled registry that labels it. Skills
   * never parses pack JSON for concepts.
   */
  readonly conceptReferences?: () => {
    readonly registry: CompiledConceptRegistry;
    readonly references: readonly DeclaredEvidence<PackConceptReferencePayload>[];
    /** Packs whose reference population could not be minted; they contribute no leaf. */
    readonly abstainedPacks?: readonly string[];
  };
  readonly valenceRegister?: ValenceRegister;
  /** Learner-relative results of rated games (rated_games), which also cover resignation and abandonment. */
  readonly ratedResults?: (learnerId: string) => ReadonlyMap<string, "win" | "loss" | "draw">;
}

/**
 * rfc/player-style.md criterion 14 — the store precondition is asserted, not assumed. The profile
 * refuses to compose over a database without the migration-26 observation ledger.
 */
export function assertLongitudinalStorePresent(tableNames: readonly string[]): void {
  // The profile never reads these tables itself: it names them only to refuse composition without
  // them, and reads through the storage-owned snapshot boundary.
  for (const table of LONGITUDINAL_TABLES) {
    if (!tableNames.includes(table)) {
      throw new TypeError(`LEARNER_PROFILE_STORE_ABSENT: ${table} is missing — the profile consumes the longitudinal store (migration 26; acceptance history D973/D1011) and cannot run without it`);
    }
  }
}

// ---------------------------------------------------------------------------------------------
// Per-run facts, derived once per exact completed cut

interface DecisionFact {
  readonly ref: StyleContributorRef;
  readonly phase: LongitudinalPhase;
  readonly beforeFen: string;
  readonly moveUci: string;
  readonly traits: { readonly pawn: boolean; readonly centerPawn: boolean; readonly queen: boolean } | undefined;
  readonly share: { readonly pawn: number; readonly centerPawn: number; readonly queen: number } | undefined;
  readonly beforePly: number;
  readonly legalMoves: readonly string[] | undefined;
}

interface OpeningFact { readonly eco: string; readonly name: string; readonly nodeId: string; readonly ply: number }

interface GameFact {
  readonly primaryBranchId: string;
  readonly learnerColor: "white" | "black";
  readonly decisions: readonly DecisionFact[];
  readonly castlingEligible: boolean | undefined;
  readonly castled: { readonly wing: "kingside" | "queenside"; readonly ref: StyleContributorRef } | null;
  readonly fianchetto: StyleContributorRef | null | undefined;
  readonly knightScreen: StyleContributorRef | null | undefined;
  readonly opening: OpeningFact | null;
  readonly outcome: "win" | "loss" | "draw" | null;
  readonly lastPly: number;
}

interface RunFact {
  readonly runId: string;
  readonly completedSeq: number;
  readonly observedAt: string;
  readonly sessionKind: RunSessionKind;
  readonly packId: string | null;
  readonly standardStart: boolean;
  readonly playedDecisions: number;
  readonly nodes: ReadonlyMap<string, { readonly ply: number; readonly moveSan: string | null }>;
  readonly game: GameFact | null;
  readonly gameReferenceIndex: ReturnType<typeof profileGameFactReferenceIndex>;
  readonly choiceReferenceIndex: ReturnType<typeof profileChoiceFactReferenceIndex>;
}

const STANDARD_START_KEY = transposeKey(STANDARD_START_FEN);

function primaryLine(run: DrillRun): readonly Node[] {
  const primary = run.branches[0]?.id;
  if (primary === undefined) return Object.freeze([]);
  return Object.freeze(run.nodes.filter((node) => node.branchId === primary).sort((left, right) => left.ply - right.ply));
}

function contributor(runId: string, node: Node, observedAt: string): StyleContributorRef {
  return Object.freeze({ runId, nodeId: node.id, ply: node.ply, moveSan: node.moveSan, observedAt });
}

function deriveRunFact(image: LongitudinalSourceImageV4, catalogue: OpeningCatalogueAvailability): RunFact {
  const run = readBackReplay(image.runPrefix.events).run;
  const started = image.runPrefix.events.find((event) => event.type === "run.started");
  const observedAt = new Date(Date.parse(started?.at ?? "1970-01-01T00:00:00.000Z")).toISOString();
  const decisions = normativeDecisions(image, run).filter((decision) => decision.decisionClass === "played");
  const nodes = new Map(run.nodes.map((node) => [node.id, Object.freeze({ ply: node.ply, moveSan: node.moveSan })] as const));
  const nodeById = new Map(run.nodes.map((node) => [node.id, node] as const));
  const standardStart = transposeKey(run.start.fen) === STANDARD_START_KEY;
  const line = primaryLine(run);
  const rootedIndex = new Map(line.map((node, index) => [node.id, index] as const));
  const primaryId = run.branches[0]?.id ?? "";
  const onLine = new Set(line.map((node) => node.id));
  const lineDecisions = decisions.filter((decision) => onLine.has(decision.ref.nodeId));
  let game: GameFact | null = null;
  if (standardStart && lineDecisions.length > 0) {
    const color = run.start.side;
    const facts: DecisionFact[] = [];
    let castled: GameFact["castled"] = null;
    for (const decision of lineDecisions) {
      const node = nodeById.get(decision.ref.nodeId)!;
      const parent = node.parentId === null ? undefined : nodeById.get(node.parentId);
      const ref = contributor(run.id, node, observedAt);
      if (castled === null) {
        const wing = castledWing(decision.beforeFen, decision.moveUci);
        if (wing !== null) castled = Object.freeze({ wing, ref });
      }
      const beforePly = parent === undefined ? undefined : rootedIndex.get(parent.id);
      if (beforePly === undefined) throw new TypeError("Profile choice metadata has no original primary BEFORE");
      facts.push(Object.freeze({
        ref,
        phase: decision.phase,
        beforeFen: decision.beforeFen,
        moveUci: decision.moveUci,
        traits: undefined,
        share: undefined,
        beforePly,
        legalMoves: undefined,
      }));
    }
    let opening: OpeningFact | null = null;
    if (catalogue.kind === "available") {
      const deepest = deepestOpeningReached(catalogue, line.map((node) => recordedOpeningPosition(node.id, node.ply, node.fen)));
      if (deepest.kind === "matched") {
        const visit = deepest.visits.find((candidate) => candidate.endpoint === deepest.deepest) ?? deepest.visits[deepest.visits.length - 1]!;
        opening = Object.freeze({ eco: deepest.deepest.eco, name: deepest.deepest.name, nodeId: visit.nodeId, ply: deepest.deepest.observedPly });
      }
    }
    let outcome: GameFact["outcome"] = null;
    for (const event of image.runPrefix.events) {
      if (event.type === "outcome.reached" && onLine.has(event.data.nodeId)) outcome = event.data.outcome;
    }
    game = Object.freeze({
      primaryBranchId: primaryId,
      learnerColor: color,
      decisions: Object.freeze(facts),
      castlingEligible: undefined,
      castled,
      fianchetto: undefined,
      knightScreen: undefined,
      opening,
      outcome,
      lastPly: line[line.length - 1]?.ply ?? 0,
    });
  }
  return Object.freeze({
    runId: run.id,
    completedSeq: image.runPrefix.requestedSeq,
    observedAt,
    sessionKind: run.sessionKind,
    packId: run.packId,
    standardStart,
    playedDecisions: decisions.length,
    nodes,
    game,
    gameReferenceIndex: profileGameFactReferenceIndex(image, run),
    choiceReferenceIndex: profileChoiceFactReferenceIndex(image, run),
  });
}

// ---------------------------------------------------------------------------------------------
// The public view (JSON). Every count carries its denominator and every number its drill-down.

export type ProfileRunStatus =
  | "counted_game"
  | "not_from_start_position"
  | "no_decisions_of_yours"
  | "store_mismatch";

export interface ProfileHistoryRow {
  readonly runId: string;
  readonly observedAt: string | null;
  readonly sessionKind: RunSessionKind | null;
  readonly packId: string | null;
  readonly state: "counted" | "pending" | "failed" | "unavailable";
  readonly status: ProfileRunStatus | null;
  readonly playedDecisions: number | null;
  readonly opening: { readonly eco: string; readonly name: string } | null;
  readonly outcome: "win" | "loss" | "draw" | null;
  readonly detail: string | null;
}

export interface ProfilePage<T> {
  readonly total: number;
  readonly offset: number;
  readonly items: readonly T[];
  readonly hiddenCount: number;
}

export interface OpeningPerformanceRow {
  readonly key: string;
  readonly eco: string;
  readonly name: string;
  readonly games: number;
  readonly results: { readonly win: number; readonly draw: number; readonly loss: number; readonly noResult: number };
  readonly firstPlayedAt: string;
  readonly lastPlayedAt: string;
  readonly contributors: StyleContributors;
  readonly relatedPacks: readonly { readonly id: string; readonly title: string }[];
}

export interface ObservationLedgerRow {
  readonly key: string;
  readonly projectionId: string;
  readonly projectionVersion: number;
  readonly semanticSign: string;
  readonly sourceSign: string;
  readonly label: string;
  readonly occurred: number;
  readonly opportunities: number;
  readonly runs: number;
  readonly decisions: number;
  readonly byPhase: readonly { readonly phase: LongitudinalPhase; readonly occurred: number; readonly opportunities: number }[];
  readonly derivedRev: number;
}

export interface SkillCategoryView {
  readonly category: SkillCategory;
  readonly label: string;
  readonly emptyReason: string | null;
  readonly marks: readonly ConceptMark[];
}

export interface SkillsView {
  readonly categories: readonly SkillCategoryView[];
  readonly candidateLeaves: readonly (SkillLeaf & { readonly blockerText: readonly string[] })[];
  readonly valence: { readonly declarations: number; readonly issues: number; readonly statement: string };
  readonly conceptIdentity: string;
  readonly marksStatement: string;
}

export interface LearnerProfileView {
  readonly derivationRev: number;
  readonly store: {
    readonly status: string;
    readonly runs: number;
    readonly counted: number;
    readonly pending: number;
    readonly failed: number;
    readonly unavailable: number;
    readonly statement: string;
  };
  readonly population: {
    readonly measuredGames: number;
    readonly playedDecisions: number;
    readonly otherRuns: number;
    readonly definition: string;
    readonly window: { readonly from: string; readonly to: string } | null;
  };
  readonly style: { readonly cards: readonly HabitCard[]; readonly disclosures: readonly string[] };
  readonly openings: {
    readonly available: boolean;
    readonly unavailableReason: string | null;
    readonly rows: readonly OpeningPerformanceRow[];
    readonly unresolvedGames: number;
    readonly rateStatement: string;
    readonly source: string | null;
  };
  readonly observationStatus: { readonly kind: "unavailable"; readonly reason: "subject_metrics_not_adopted" };
  readonly observations: readonly never[];
  readonly skills: SkillsView;
  readonly history: ProfilePage<ProfileHistoryRow>;
  readonly privacy: {
    readonly visibility: "private";
    readonly statements: readonly string[];
  };
}

export const PROFILE_PREVIEW_CONTRIBUTORS = 5;
export const PROFILE_HISTORY_PREVIEW = 20;
export const PROFILE_PAGE_LIMIT_MAX = 100;

const STYLE_DISCLOSURES = Object.freeze([
  "Each card counts only your own moves in games you started from the standard starting position; for a rewound game, only its first line counts.",
  "Each floor was measured on 36 accounts' short-session blitz games. Whether it holds for your time controls and over longer periods has not been measured yet (rfc/player-style.md D6).",
  "A card describes what you did. It is not a rating, a comparison with other players, or advice.",
] as const);

const OPENING_RATE_STATEMENT = "Results are shown as counts. No win rate is shown: no measured floor says how many games in one opening a rate needs before it means anything.";


// ---------------------------------------------------------------------------------------------

function formatFraction(value: number): string {
  return value.toFixed(2);
}

function formatSigned(value: number): string {
  const text = value.toFixed(3);
  return value > 0 ? `+${text}` : text === "-0.000" ? "0.000" : text;
}

function intervalText(lower: number, upper: number, signed: boolean): string {
  const render = signed ? formatSigned : formatFraction;
  return `95% interval ${render(lower)} to ${render(upper)}`;
}

function contributors(refs: readonly StyleContributorRef[], limit = PROFILE_PREVIEW_CONTRIBUTORS, offset = 0): StyleContributors {
  const ordered = [...refs].sort((left, right) => left.observedAt.localeCompare(right.observedAt) || left.runId.localeCompare(right.runId) || left.ply - right.ply);
  const shown = ordered.slice(offset, offset + limit);
  // hiddenCount is what remains after this page: a truncated list always says how much it withheld.
  return Object.freeze({ total: ordered.length, shown: Object.freeze(shown), hiddenCount: Math.max(0, ordered.length - offset - shown.length) });
}

function windowOf(runs: readonly RunFact[]): { readonly from: string; readonly to: string } | null {
  if (runs.length === 0) return null;
  const times = runs.map((run) => run.observedAt).sort();
  return Object.freeze({ from: times[0]!, to: times[times.length - 1]! });
}

interface CardInput {
  readonly metric: StyleMetric;
  readonly games: number;
  readonly decisions: number;
  readonly refs: readonly StyleContributorRef[];
}

function abstainedCard(input: CardInput, abstention: StyleAbstention): HabitCard {
  const { metric } = input;
  return sealHabitCard({
    kind: "habit_card", state: "abstained", metricId: metric.metricId, featureId: metric.featureId, version: metric.version, unit: metric.unit,
    title: metric.title, floor: metric.floor, games: input.games, decisions: input.decisions, phaseScope: metric.phaseScope,
    timeControlScope: STYLE_TIME_CONTROL_SCOPE, reference: null, valueDefinition: metric.valueDefinition,
    denominatorDefinition: metric.denominatorDefinition, sentence: abstentionSentence(abstention),
    contributors: contributors(input.refs), abstention, tier: insufficientTier(metric.floor, input.games, metric.phaseScope, metric.version),
  });
}

/** Only the current parsed GAME lane supplies these operands, including on a warm RunFact. */
function withGameFacts(fact: RunFact, outcome: GameFactReadOutcome | undefined): RunFact {
  if (fact.game === null || outcome?.kind !== "available") return fact;
  try {
    const row = parseLongitudinalGameFactRow(outcome.row);
    if (row.derivedRev !== OBSERVATION_DERIVATION_REV) return fact;
    assertProfileGameFactReferenceIndex(row, fact.gameReferenceIndex);
    if (row.game.kind !== "eligible") return fact;
    const ref = (field: typeof row.game.fianchetto): StyleContributorRef | null | undefined => {
      if (field.kind !== "observed") return undefined;
      if (field.first === null) return null;
      const node = fact.nodes.get(field.first.nodeId)!;
      return Object.freeze({ runId: fact.runId, nodeId: field.first.nodeId, ply: node.ply, moveSan: node.moveSan, observedAt: fact.observedAt });
    };
    return Object.freeze({ ...fact, game: Object.freeze({ ...fact.game,
      fianchetto: ref(row.game.fianchetto), knightScreen: ref(row.game.knightScreen),
      castlingEligible: row.game.castling.kind === "observed" ? row.game.castling.kingside || row.game.castling.queenside : undefined }) });
  } catch { return fact; } // Invalid received data affects these cards, not independently counted history.
}
/** Always join the current parsed choice lane; the cached raw fact never stores its operands. */
function withChoiceFacts(fact: RunFact, outcome: ChoiceFactReadOutcome | undefined): RunFact {
  if (fact.game === null || outcome?.kind !== "available") return fact;
  try {
    const row = parseLongitudinalChoiceFactRow(outcome.row);
    if (row.derivedRev !== OBSERVATION_DERIVATION_REV) return fact;
    assertProfileChoiceFactReferenceIndex(row, fact.choiceReferenceIndex);
    if (row.cohort.kind !== "eligible") return fact;
    const byNode = new Map(row.cohort.decisions.map(decision => [decision.ref.nodeId, decision] as const));
    const decisions = fact.game.decisions.map(base => {
      const source = byNode.get(base.ref.nodeId);
      if (source === undefined || source.result.kind !== "available") return base;
      const n = source.result.legalUcis.length, counts = source.result.counts;
      return Object.freeze({ ...base, beforePly: source.ref.sourcePly,
        traits: source.result.chosen, share: Object.freeze({ pawn: counts.pawn / n, centerPawn: counts.centerPawn / n, queen: counts.queen / n }),
        legalMoves: source.result.legalUcis });
    });
    return Object.freeze({ ...fact, game: Object.freeze({ ...fact.game, decisions: Object.freeze(decisions) }) });
  } catch { return fact; } // Received invalid data affects choice cards, not known history/other cards.
}

function incompleteGameCard(metric: StyleMetric, games: Games, fields: readonly ("fianchetto" | "knightScreen" | "castlingEligible")[]): HabitCard | undefined {
  const missing = fields.filter(field => games.some(run => run.game[field] === undefined));
  if (missing.length === 0) return undefined;
  const known = games.filter(run => fields.every(field => run.game[field] !== undefined)
    && (!fields.includes("castlingEligible") || run.game.castlingEligible === true));
  return abstainedCard({ metric, games: games.length, decisions: games.reduce((sum, run) => sum + run.game.decisions.length, 0), refs: known.flatMap(gameRef) }, { code: "incomplete_card", missing: missing.map(field => ({
    fianchetto: "fianchetto information from one or more games",
    knightScreen: "bishop and knight setup information from one or more games",
    castlingEligible: "castling information from before your first move in one or more games",
  })[field]) });
}

function measuredCard(input: CardInput & {
  readonly value: number;
  readonly valueText: string;
  readonly numerator: number | null;
  readonly eligibleGames: number | null;
  readonly interval: MeasuredHabitCard["interval"];
  readonly window: { readonly from: string; readonly to: string };
  readonly sentence: string;
}): HabitCard {
  const { metric } = input;
  if (input.games < metric.floor) {
    return abstainedCard({ ...input, refs: [] }, { code: "below_floor", floor: metric.floor, measuredGames: input.games });
  }
  const tier = tierFor({
    floor: metric.floor, games: input.games, decisions: input.decisions, phaseScope: metric.phaseScope, version: metric.version,
    rate: input.value, interval: [input.interval.lower, input.interval.upper], reference: null,
  });
  assertTierReadingGrounded(tier);
  const card = sealHabitCard({
    kind: "habit_card", state: "measured", metricId: metric.metricId, featureId: metric.featureId, version: metric.version, unit: metric.unit,
    title: metric.title, floor: metric.floor, games: input.games, decisions: input.decisions, phaseScope: metric.phaseScope,
    timeControlScope: STYLE_TIME_CONTROL_SCOPE, reference: null, valueDefinition: metric.valueDefinition,
    denominatorDefinition: metric.denominatorDefinition, sentence: input.sentence, contributors: contributors(input.refs), tier,
    value: input.value, valueText: input.valueText, numerator: input.numerator, eligibleGames: input.eligibleGames,
    interval: input.interval, window: input.window, baseline: null,
  });
  const check = styleCardTextCheck(card, card.sentence);
  if (!check.valid) throw new TypeError(`LEARNER_PROFILE_CARD_VOICE: ${metric.metricId} ${check.violations.join(", ")}`);
  return card;
}

type Games = readonly (RunFact & { readonly game: GameFact })[];
type KnownChoiceDecision = DecisionFact & { readonly traits: NonNullable<DecisionFact["traits"]>;
  readonly share: NonNullable<DecisionFact["share"]>; readonly legalMoves: readonly string[] };
const knownChoiceDecision = (fact: DecisionFact): fact is KnownChoiceDecision => fact.traits !== undefined && fact.share !== undefined && fact.legalMoves !== undefined;
function knownChoiceGames(games: Games, select: (fact: DecisionFact) => boolean): Games {
  return games.filter(run => { const selected = run.game.decisions.filter(select); return selected.length > 0 && selected.every(knownChoiceDecision); });
}

/**
 * An abstaining card's drill-down lists the games measured so far (its denominator), never the
 * occurrences: listing occurrences would disclose the numerator the floor withholds (criterion 15).
 */
function gameRef(run: RunFact & { readonly game: GameFact }): readonly StyleContributorRef[] {
  const first = run.game.decisions[0]?.ref;
  return first === undefined ? [] : [first];
}

function gameRateCard(metric: StyleMetric<"game">, eligible: Games, occurred: (game: GameFact) => StyleContributorRef | null | undefined, phrase: (k: number, n: number, interval: string) => string): HabitCard {
  const decisions = eligible.reduce((sum, run) => sum + run.game.decisions.length, 0);
  const hits = eligible.map((run) => occurred(run.game));
  const refs = hits.filter((ref): ref is StyleContributorRef => ref !== null);
  const eligibleCount = gameEligibilityCount(eligible);
  if (eligible.length === 0 || eligible.length < metric.floor) {
    return abstainedCard({ metric, games: eligible.length, decisions, refs: eligible.flatMap(gameRef) }, { code: "below_floor", floor: metric.floor, measuredGames: eligible.length });
  }
  const value = gameUnitRate(metric, refs.length, eligibleCount);
  const indicators = hits.map((hit) => (hit === null ? 0 : 1));
  const interval = gameBootstrapInterval(indicators, (sample) => sample.reduce((sum: number, item) => sum + item, 0) / sample.length, `${metric.metricId}@${metric.version}`);
  return measuredCard({
    metric, games: eligible.length, decisions, refs, value, valueText: `${refs.length} of ${eligible.length} games`, numerator: refs.length,
    eligibleGames: eligible.length, interval, window: windowOf(eligible)!,
    sentence: `${phrase(refs.length, eligible.length, intervalText(interval.lower, interval.upper, false))} This card's floor is ${metric.floor} games.`,
  });
}

function residualCard(metric: StyleMetric<"decision">, games: Games, select: (fact: DecisionFact) => boolean, trait: "pawn" | "centerPawn" | "queen", label: string): HabitCard {
  const selected = games.map(run => ({ run, decisions: run.game.decisions.filter(select) })).filter(entry => entry.decisions.length > 0);
  if (selected.some(entry => entry.decisions.some(fact => !knownChoiceDecision(fact)))) {
    return abstainedCard({ metric, games: selected.length, decisions: selected.reduce((sum, entry) => sum + entry.decisions.length, 0),
      refs: knownChoiceGames(games, select).flatMap(gameRef) }, { code: "incomplete_card", missing: ["legal choice and playing-role information for one or more recorded moves"] });
  }
  const perGame = games.map((run) => {
    const decisions = run.game.decisions.filter(select);
    return { run, decisions, sum: decisions.reduce((sum, fact) => {
      if (!knownChoiceDecision(fact)) throw new TypeError("Choice residual cannot consume unknown data");
      return sum + (fact.traits[trait] ? 1 : 0) - fact.share[trait];
    }, 0) };
  }).filter((entry) => entry.decisions.length > 0);
  const decisions = perGame.reduce((sum, entry) => sum + entry.decisions.length, 0);
  const refs = perGame.flatMap((entry) => entry.decisions.filter((fact) => fact.traits![trait]).map((fact) => fact.ref));
  if (perGame.length < metric.floor) {
    return abstainedCard({ metric, games: perGame.length, decisions, refs: perGame.flatMap((entry) => gameRef(entry.run)) }, { code: "below_floor", floor: metric.floor, measuredGames: perGame.length });
  }
  const ratio = (sample: readonly (typeof perGame)[number][]): number => {
    const count = sample.reduce((sum, entry) => sum + entry.decisions.length, 0);
    return count === 0 ? Number.NaN : sample.reduce((sum, entry) => sum + entry.sum, 0) / count;
  };
  const value = ratio(perGame);
  const interval = gameBootstrapInterval(perGame, ratio, `${metric.metricId}@${metric.version}`);
  return measuredCard({
    metric, games: perGame.length, decisions, refs, value, valueText: `${formatSigned(value)} per decision`, numerator: null, eligibleGames: null,
    interval, window: windowOf(perGame.map((entry) => entry.run))!,
    sentence: `Relative to the legal choices you received, your ${label} residual was ${formatSigned(value)} across ${decisions} decisions in ${perGame.length} measured games (${intervalText(interval.lower, interval.upper, true)}). This card's floor is ${metric.floor} games.`,
  });
}

function entropyCard(metric: StyleMetric<"game">, games: Games, catalogue: OpeningCatalogueAvailability): HabitCard {
  const resolved = games.filter((run) => run.game.opening !== null);
  const decisions = resolved.reduce((sum, run) => sum + run.game.decisions.length, 0);
  const refs = resolved.map((run) => {
    const opening = run.game.opening!;
    const node = run.nodes.get(opening.nodeId);
    return Object.freeze({ runId: run.runId, nodeId: opening.nodeId, ply: opening.ply, moveSan: node?.moveSan ?? null, observedAt: run.observedAt });
  });
  if (catalogue.kind === "unavailable") {
    return abstainedCard({ metric, games: 0, decisions: 0, refs: [] }, { code: "blocked", blockerClass: metric.blockerClass, blocked: "reference_population_unpinned", detail: `The installed opening catalogue is unavailable (${catalogue.reason}).`, home: "rfc/runtime-opening-identity.md" });
  }
  if (resolved.length < metric.floor) {
    return abstainedCard({ metric, games: resolved.length, decisions, refs }, { code: "below_floor", floor: metric.floor, measuredGames: resolved.length });
  }
  const labels = resolved.map((run) => run.game.opening!.eco);
  const value = shannonEntropyBits(labels);
  const families = new Set(labels).size;
  const interval = gameBootstrapInterval(labels, shannonEntropyBits, `${metric.metricId}@${metric.version}`);
  return measuredCard({
    metric, games: resolved.length, decisions, refs, value, valueText: `${value.toFixed(2)} bits over ${families} ECO codes`, numerator: null, eligibleGames: null,
    interval, window: windowOf(resolved)!,
    sentence: `Across ${resolved.length} measured games, your openings reached ${families} ECO codes with ${value.toFixed(2)} bits of ECO-code entropy (95% interval ${interval.lower.toFixed(2)} to ${interval.upper.toFixed(2)} bits). This card's floor is ${metric.floor} games.`,
  });
}

function blockedCard(metric: StyleMetric, games: number, decisions: number): HabitCard {
  if (metric.production.kind !== "blocked") throw new TypeError(`${metric.metricId} is not blocked`);
  return abstainedCard({ metric, games, decisions, refs: [] }, {
    code: "blocked", blockerClass: metric.blockerClass, blocked: metric.production.code, detail: metric.production.reason, home: metric.production.home,
  });
}

function styleCards(games: Games, catalogue: OpeningCatalogueAvailability): readonly HabitCard[] {
  const decisions = games.reduce((sum, run) => sum + run.game.decisions.length, 0);
  return Object.freeze(STYLE_METRICS.map((metric): HabitCard => {
    if (metric.production.kind === "blocked") return blockedCard(metric, games.length, decisions);
    const fields = metric.metricId === "fianchetto_setup_rate" ? ["fianchetto" as const]
      : metric.metricId === "fianchetto_knight_screen_rate" ? ["knightScreen" as const]
        : metric.metricId === "castle_kingside_rate" || metric.metricId === "castle_queenside_rate" ? ["castlingEligible" as const] : [];
    const incomplete = incompleteGameCard(metric, games, fields);
    if (incomplete !== undefined) return incomplete;
    switch (metric.metricId) {
      case "opening_family_entropy": return entropyCard(metric as StyleMetric<"game">, games, catalogue);
      case "fianchetto_setup_rate": return gameRateCard(metric as StyleMetric<"game">, games, (game) => game.fianchetto,
        (k, n, interval) => `You reached the declared fianchetto setup in ${k} of ${n} measured games (${interval}).`);
      case "fianchetto_knight_screen_rate": return gameRateCard(metric as StyleMetric<"game">, games, (game) => game.knightScreen,
        (k, n, interval) => `You reached the declared fianchetto-with-knight-screen setup in ${k} of ${n} measured games (${interval}).`);
      case "castle_kingside_rate": return gameRateCard(metric as StyleMetric<"game">, games.filter((run) => run.game.castlingEligible === true), (game) => game.castled?.wing === "kingside" ? game.castled.ref : null,
        (k, n, interval) => `You castled kingside in ${k} of ${n} measured games that began with a castling right (${interval}).`);
      case "castle_queenside_rate": return gameRateCard(metric as StyleMetric<"game">, games.filter((run) => run.game.castlingEligible === true), (game) => game.castled?.wing === "queenside" ? game.castled.ref : null,
        (k, n, interval) => `You castled queenside in ${k} of ${n} measured games that began with a castling right (${interval}).`);
      case "pawn_choice_residual": return residualCard(metric as StyleMetric<"decision">, games, () => true, "pawn", "pawn-choice");
      case "center_pawn_choice_residual": return residualCard(metric as StyleMetric<"decision">, games, () => true, "centerPawn", "extended-center pawn");
      case "early_queen_choice_residual": return residualCard(metric as StyleMetric<"decision">, games, (fact) => fact.beforePly < EARLY_QUEEN_PLY_BOUND, "queen", "early-queen");
      default: throw new TypeError(`LEARNER_PROFILE_METRIC_UNWIRED: ${metric.metricId}`);
    }
  }));
}

function sessionKindPlain(value: RunSessionKind): string {
  return value === "pack" ? "pack rehearsal" : value === "imported" ? "imported game" : "position";
}

function evidenceGroundingOf(id: string, version: number): EvidenceGrounding | undefined {
  return PRIMARY_EVIDENCE_MANIFEST.projections.find((projection) => projection.id === id && projection.version === version)?.grounding;
}

// ---------------------------------------------------------------------------------------------

interface Snapshot {
  readonly coverage: import("./profile-subject-facts-contract.js").LongitudinalReadCoverage | null;
  readonly cuts: readonly LongitudinalCutOutcome[];
  readonly runs: readonly RunFact[];
  readonly rejected: ReadonlyMap<string, ProfileRunStatus>;
  readonly playedDecisionsInStore: number;
  /** The recorded result per run: a rated game's sealed result, else the run's own terminal outcome. */
  readonly results: ReadonlyMap<string, "win" | "loss" | "draw">;
}

export class LearnerProfileService {
  readonly #deps: LearnerProfileDependencies;
  readonly #cache = new Map<string, RunFact>();
  static readonly CACHE_LIMIT = 4096;

  constructor(dependencies: LearnerProfileDependencies) {
    assertLongitudinalStorePresent(dependencies.storage.applicationTableNames());
    this.#deps = dependencies;
  }

  #query(learnerId: string, through: ParsedLongitudinalReadQuery["through"]): ParsedLongitudinalReadQuery {
    return parseLongitudinalReadQuery({ learnerId, derivationRev: OBSERVATION_DERIVATION_REV, through, includeGameFacts: true, includeChoiceFacts: true, filter: { decisionClasses: ["played"] } });
  }

  #fact(learnerId: string, cut: LongitudinalCompleteCut): RunFact | undefined {
    const { runId, completedSeq, sourceDigest } = cut;
    const key = JSON.stringify([learnerId, runId, completedSeq, OBSERVATION_DERIVATION_REV, sourceDigest]);
    const cached = this.#cache.get(key);
    if (cached !== undefined) return cached;
    const image = this.#deps.storage.longitudinalSourceImageV4(runId, completedSeq);
    if (image.ownerLearnerId !== learnerId || this.#deps.storage.longitudinalSourceDigestV4(image) !== sourceDigest) return undefined;
    const fact = deriveRunFact(image, this.#deps.openingCatalogue);
    if (this.#cache.size >= LearnerProfileService.CACHE_LIMIT) this.#cache.delete(this.#cache.keys().next().value!);
    this.#cache.set(key, fact);
    return fact;
  }

  #snapshot(principal: Principal): Snapshot {
    const learnerId = principal.learnerId;
    const storage = this.#deps.storage;
    const rejected = new Map<string, ProfileRunStatus>();
    const read = (through: ParsedLongitudinalReadQuery["through"]): LongitudinalReadResult => {
      try {
        return storage.readLongitudinalSnapshot(learnerId, this.#query(learnerId, through));
      } catch (error) {
        if (!(error instanceof LongitudinalReadIntegrityError)) throw error;
        for (const runId of error.invalidRunIds) rejected.set(runId, "store_mismatch");
        return { kind: "incomplete", cuts: error.cuts };
      }
    };
    const first = read({ kind: "all_complete" });
    let cuts = first.cuts;
    let complete = first.kind === "complete" ? first : undefined;
    if (first.kind === "incomplete") {
      const isReady = (cut: LongitudinalCutOutcome): cut is LongitudinalCompleteCut =>
        cut.kind === "complete" && !rejected.has(cut.runId);
      let ready = first.cuts.filter(isReady);
      while (ready.length > 0) {
        const priorRejections = rejected.size;
        const next = read({ kind: "runs", cuts: ready.map(({ runId, requestedSeq }) => ({ runId, requestedSeq })) });
        const byRun = new Map(next.cuts.map(cut => [cut.runId, cut]));
        const current = ready.map<LongitudinalCutOutcome>(cut => {
          const returned = byRun.get(cut.runId);
          if (returned !== undefined) {
            if (returned.kind !== "complete") return returned;
            if (returned.sourceDigest === cut.sourceDigest && returned.completedSeq === cut.completedSeq
              && returned.requestedSeq === cut.requestedSeq && returned.derivedRev === cut.derivedRev) return cut;
          }
          return { kind: "unavailable", reason: "cut_superseded", runId: cut.runId, requestedSeq: cut.requestedSeq };
        });
        const surviving = current.filter(isReady);
        if (next.kind === "complete" && surviving.length === ready.length) {
          complete = next;
          break;
        }
        const currentByRun = new Map(current.map(cut => [cut.runId, cut]));
        cuts = cuts.map(cut => currentByRun.get(cut.runId) ?? cut);
        // A failed read supplies no rows. Retry only after removing invalid or replaced cuts.
        if (next.kind === "incomplete" && rejected.size === priorRejections) break;
        ready = surviving;
      }
    }
    const runs: RunFact[] = [];
    let playedDecisionsInStore = 0;
    if (complete !== undefined && complete.kind === "complete") {
      const played = new Map<string, number>();
      for (const row of complete.denominators) {
        if (row.decisionClass !== "played") continue;
        played.set(row.runId, (played.get(row.runId) ?? 0) + row.decisions);
        playedDecisionsInStore += row.decisions;
      }
      const gameRows = new Map(complete.gameFacts.map(outcome => [outcome.kind === "available" ? outcome.row.runId : outcome.runId, outcome] as const));
      const choiceRows = new Map(complete.choiceFacts.map(outcome => [outcome.kind === "available" ? outcome.row.runId : outcome.runId, outcome] as const));
      for (const cut of complete.cuts) {
        const raw = this.#fact(learnerId, cut);
        if (raw === undefined) { rejected.set(cut.runId, "store_mismatch"); continue; }
        const fact = withChoiceFacts(withGameFacts(raw, gameRows.get(cut.runId)), choiceRows.get(cut.runId));
        if ((played.get(cut.runId) ?? 0) !== fact.playedDecisions) { rejected.set(cut.runId, "store_mismatch"); continue; }
        runs.push(fact);
      }
    }
    const rated = this.#deps.ratedResults?.(learnerId) ?? new Map<string, "win" | "loss" | "draw">();
    const results = new Map<string, "win" | "loss" | "draw">();
    for (const run of runs) {
      const result = rated.get(run.runId) ?? run.game?.outcome ?? null;
      if (result !== null) results.set(run.runId, result);
    }
    return { cuts, runs, rejected, playedDecisionsInStore, results, coverage: complete?.kind === "complete" ? complete.coverage : null };
  }

  #games(snapshot: Snapshot): Games {
    return snapshot.runs.filter((run): run is RunFact & { readonly game: GameFact } => run.game !== null);
  }

  #runStatus(run: RunFact): Exclude<ProfileRunStatus, "store_mismatch"> {
    if (run.game !== null) return "counted_game";
    if (run.playedDecisions === 0) return "no_decisions_of_yours";
    return "not_from_start_position";
  }

  #history(snapshot: Snapshot, offset: number, limit: number): ProfilePage<ProfileHistoryRow> {
    const facts = new Map(snapshot.runs.map((run) => [run.runId, run] as const));
    const rows = snapshot.cuts.map((cut): ProfileHistoryRow => {
      const fact = facts.get(cut.runId);
      if (cut.kind === "complete" && fact !== undefined && !snapshot.rejected.has(cut.runId)) {
        const status = this.#runStatus(fact);
        return Object.freeze({
          runId: cut.runId, observedAt: fact.observedAt, sessionKind: fact.sessionKind, packId: fact.packId, state: "counted", status,
          playedDecisions: fact.playedDecisions,
          opening: fact.game === null || fact.game.opening === null ? null : Object.freeze({ eco: fact.game.opening.eco, name: fact.game.opening.name }),
          outcome: snapshot.results.get(cut.runId) ?? null,
          detail: status === "counted_game" ? null : status === "not_from_start_position" ? `A ${sessionKindPlain(fact.sessionKind)} that did not begin from the standard starting position: it is listed in your history and does not count toward game-based cards.` : "No move in this run is attributed to you (imported games' moves belong to the players who made them).",
        });
      }
      if (cut.kind === "complete") {
        const status = snapshot.rejected.get(cut.runId) ?? null;
        return Object.freeze({ runId: cut.runId, observedAt: null, sessionKind: null, packId: null, state: "unavailable", status, playedDecisions: null, opening: null, outcome: null,
          detail: status === "store_mismatch"
            ? "Recorded counts do not match the saved moves. This run is left out of your profile until its counts are rebuilt. The saved game is unchanged."
            : "We couldn't load this run's counts for this profile. Refresh the profile to check again." });
      }
      if (cut.kind === "pending") return Object.freeze({ runId: cut.runId, observedAt: null, sessionKind: null, packId: null, state: "pending", status: null, playedDecisions: null, opening: null, outcome: null, detail: cut.retryAt === undefined ? "Being processed; it will count once processing finishes." : `Processing will be retried after ${cut.retryAt}.` });
      if (cut.kind === "failed") return Object.freeze({ runId: cut.runId, observedAt: null, sessionKind: null, packId: null, state: "failed", status: null, playedDecisions: null, opening: null, outcome: null, detail: `Processing stopped after ${cut.attempts} attempts (${cut.failureCode}); this run is not counted.` });
      return Object.freeze({ runId: cut.runId, observedAt: null, sessionKind: null, packId: null, state: "unavailable", status: null, playedDecisions: null, opening: null, outcome: null, detail: `Not counted (${cut.reason.replace(/_/gu, " ")}).` });
    }).sort((left, right) => (right.observedAt ?? "").localeCompare(left.observedAt ?? "") || left.runId.localeCompare(right.runId));
    const items = rows.slice(offset, offset + limit);
    return Object.freeze({ total: rows.length, offset, items: Object.freeze(items), hiddenCount: rows.length - offset - items.length });
  }

  #openings(games: Games, recorded: ReadonlyMap<string, "win" | "loss" | "draw">, preview = PROFILE_PREVIEW_CONTRIBUTORS): LearnerProfileView["openings"] {
    const catalogue = this.#deps.openingCatalogue;
    if (catalogue.kind === "unavailable") {
      return Object.freeze({ available: false, unavailableReason: `The installed opening catalogue is unavailable (${catalogue.reason}).`, rows: Object.freeze([]), unresolvedGames: games.length, rateStatement: OPENING_RATE_STATEMENT, source: null });
    }
    const groups = new Map<string, (RunFact & { readonly game: GameFact })[]>();
    let unresolved = 0;
    for (const run of games) {
      const opening = run.game.opening;
      if (opening === null) { unresolved += 1; continue; }
      const key = `${opening.eco} ${opening.name}`;
      groups.set(key, [...(groups.get(key) ?? []), run]);
    }
    const packsByEco = new Map<string, { readonly id: string; readonly title: string }[]>();
    for (const pack of this.#deps.packs?.() ?? []) {
      let endpoint;
      try { endpoint = catalogue.catalogue.currentEndpoint(pack.startFen, 0); } catch { continue; }
      if (endpoint.kind !== "matched") continue;
      packsByEco.set(endpoint.eco, [...(packsByEco.get(endpoint.eco) ?? []), Object.freeze({ id: pack.id, title: pack.title })]);
    }
    const rows = [...groups.entries()].map(([key, members]): OpeningPerformanceRow => {
      const opening = members[0]!.game.opening!;
      const results = { win: 0, draw: 0, loss: 0, noResult: 0 };
      for (const run of members) {
        const result = recorded.get(run.runId);
        if (result === undefined) results.noResult += 1;
        else results[result] += 1;
      }
      const refs = members.map((run) => Object.freeze({ runId: run.runId, nodeId: run.game.opening!.nodeId, ply: run.game.opening!.ply, moveSan: run.nodes.get(run.game.opening!.nodeId)?.moveSan ?? null, observedAt: run.observedAt }));
      const window = windowOf(members)!;
      return Object.freeze({
        key, eco: opening.eco, name: opening.name, games: members.length, results: Object.freeze(results),
        firstPlayedAt: window.from, lastPlayedAt: window.to, contributors: contributors(refs, preview),
        relatedPacks: Object.freeze([...(packsByEco.get(opening.eco) ?? [])].sort((left, right) => left.title.localeCompare(right.title))),
      });
    }).sort((left, right) => left.eco.localeCompare(right.eco) || left.name.localeCompare(right.name));
    return Object.freeze({
      available: true, unavailableReason: null, rows: Object.freeze(rows), unresolvedGames: unresolved, rateStatement: OPENING_RATE_STATEMENT,
      source: `Lichess chess-openings ${catalogue.catalogue.ref.commit.slice(0, 7)} (CC0), matched by exact position.`,
    });
  }

  #skills(snapshot: Snapshot): SkillsView {
    const register = this.#deps.valenceRegister ?? { formatVersion: "tabiya.valence-register.v1", declarations: [] };
    const issues = validateValenceRegister(register, evidenceGroundingOf);
    const blockers = ["category_unassigned", "valence_unruled", "opportunity_definition_missing"] as const;
    const blocked = { category: null, blockers: Object.freeze([...blockers]), blockerText: Object.freeze(blockers.map((blocker) => SKILL_LEAF_BLOCKER_TEXT[blocker])) };
    const shapeLeaves = (this.#deps.shapes?.() ?? []).map((shape) => Object.freeze({
      leafId: `shape:${shape.id}`, label: shape.name, source: "registered_shape" as const, ...blocked,
    }));
    // rfc/skills.md criteria 4–5: concept leaves come only from the registry's global identity, via
    // the identity-only reference projection. One id across many packs is one leaf.
    const concepts = this.#deps.conceptReferences?.();
    const packsByConcept = new Map<string, Set<string>>();
    for (const reference of concepts?.references ?? []) {
      const id = reference.payload.concept.id as string;
      packsByConcept.set(id, (packsByConcept.get(id) ?? new Set()).add(reference.payload.packId));
    }
    const conceptLeaves = [...packsByConcept].filter(([, packs]) => packs.size >= SKILL_CONCEPT_LEAF_MIN_PACKS).flatMap(([id]) => {
      const entry = concepts?.registry.get(id);
      return entry === undefined || entry.status !== "active" ? [] : [Object.freeze({ leafId: `concept:${id}`, label: entry.label, source: "pack_concept" as const, ...blocked })];
    });
    const leaves = [...shapeLeaves, ...conceptLeaves].sort((left, right) => left.label.localeCompare(right.label) || left.leafId.localeCompare(right.leafId));
    // No leaf is admitted: none has an owner-assigned category, an admitted valence declaration and a
    // written opportunity rule. The derivation still runs, over the learner's own decisions, so the
    // mechanism is exercised on every read rather than dormant.
    const admitted: readonly AdmittedSkillLeaf[] = Object.freeze([]);
    const games = this.#games(snapshot);
    const missingChoices = games.some(run => run.game.decisions.some(fact => !knownChoiceDecision(fact)));
    const decisions = games.flatMap((run) => run.game.decisions.filter(knownChoiceDecision).map((fact) => Object.freeze({
      runId: run.runId, branchId: run.game.primaryBranchId, nodeId: fact.ref.nodeId, beforeFen: fact.beforeFen, moveUci: fact.moveUci,
      legalMoves: fact.legalMoves, occurredAt: run.observedAt,
    })));
    const marks = deriveConceptMarks(decisions, admitted);
    const categories = SKILL_CATEGORIES.map((category): SkillCategoryView => Object.freeze({
      category, label: SKILL_CATEGORY_LABELS[category], emptyReason: EMPTY_CATEGORY_REASONS[category] ?? null,
      marks: Object.freeze(marks.filter((mark) => mark.category === category)),
    }));
    return Object.freeze({
      categories: Object.freeze(categories),
      candidateLeaves: Object.freeze(leaves),
      valence: Object.freeze({
        declarations: register.declarations.length,
        issues: issues.length,
        statement: register.declarations.length === 0
          ? "No valence declaration has been admitted, so no skill can be credited yet. Whether any may be declared is an open owner ruling (rfc/skills.md Open question 1)."
          : "Valence declarations are recorded in content/valence/register.json.",
      }),
      conceptIdentity: concepts === undefined
        ? "The concept registry is unavailable, so no pack concept is listed."
        : `Concepts come from the concept registry, one identity across every pack. An idea is listed here only when at least ${SKILL_CONCEPT_LEAF_MIN_PACKS} packs name it.${(concepts.abstainedPacks?.length ?? 0) === 0 ? "" : ` Some packs are left out because their concept references could not be verified: ${concepts.abstainedPacks!.join(", ")}.`}`,
      marksStatement: "A mark records the first time you played a creditable idea when you had a real alternative. It is earned once, never taken away, and links to the move." + (missingChoices ? " Some recorded moves lack verified choice or playing-role information, so they cannot earn marks." : ""),
    });
  }

  profile(principal: Principal): LearnerProfileView {
    const snapshot = this.#snapshot(principal);
    const games = this.#games(snapshot);
    const admittedRuns = new Set(snapshot.runs.filter(run => !snapshot.rejected.has(run.runId)).map(run => run.runId));
    const counts = { counted: 0, pending: 0, failed: 0, unavailable: 0 };
    for (const cut of snapshot.cuts) {
      if (cut.kind === "complete" && admittedRuns.has(cut.runId)) counts.counted += 1;
      else if (cut.kind === "pending") counts.pending += 1;
      else if (cut.kind === "failed") counts.failed += 1;
      else counts.unavailable += 1;
    }
    const status = this.#deps.longitudinalStatus();
    const verb = (n: number, one: string, many: string): string => `${n} ${n === 1 ? one : many}`;
    const storeStatement = snapshot.cuts.length === 0
      ? "You have no saved runs yet."
      : counts.pending + counts.failed + counts.unavailable === 0
        ? snapshot.cuts.length === 1 ? "Your 1 saved run is counted." : `All ${counts.counted} of your saved runs are counted.`
        : `${counts.counted} of your ${snapshot.cuts.length} saved runs ${counts.counted === 1 ? "is" : "are"} counted; ${[
          counts.pending > 0 ? `${verb(counts.pending, "is", "are")} still being processed` : "",
          counts.failed > 0 ? `${verb(counts.failed, "could", "could")} not be processed` : "",
          counts.unavailable > 0 ? `${verb(counts.unavailable, "is", "are")} not counted` : "",
        ].filter((part) => part !== "").join(" and ")}.`;
    return Object.freeze({
      derivationRev: OBSERVATION_DERIVATION_REV,
      store: Object.freeze({ status, runs: snapshot.cuts.length, ...counts, statement: storeStatement }),
      population: Object.freeze({
        measuredGames: games.length,
        playedDecisions: games.reduce((sum, run) => sum + run.game.decisions.length, 0),
        otherRuns: snapshot.runs.length - games.length,
        definition: "A measured game is a run that began from the standard starting position with at least one move attributed to you. Only its first line counts.",
        window: windowOf(games),
      }),
      style: Object.freeze({ cards: styleCards(games, this.#deps.openingCatalogue), disclosures: STYLE_DISCLOSURES }),
      openings: this.#openings(games, snapshot.results),
      observationStatus: Object.freeze({ kind: "unavailable", reason: "subject_metrics_not_adopted" }),
      observations: Object.freeze([]),
      skills: this.#skills(snapshot),
      history: this.#history(snapshot, 0, PROFILE_HISTORY_PREVIEW),
      privacy: Object.freeze({
        visibility: "private",
        statements: Object.freeze([
          "This profile is private. Only you can read it; no teacher, classroom or other learner has a read path to it.",
          "Nothing on this page is stored as a profile: every number is recomputed from your saved runs each time you open it.",
          "Your account download includes the underlying observation rows, and deleting a run or your account removes them.",
          "A card is shared only when you prepare it yourself; a shared card carries its measured numbers, never a label about you.",
        ]),
      }),
    });
  }

  styleCard(principal: Principal, metricId: string, offset: number, limit: number): { readonly card: HabitCard; readonly contributors: StyleContributors } {
    if (styleMetric(metricId) === undefined) throw new ServerError("INVALID_REQUEST", `Unknown style metric: ${metricId}`);
    const snapshot = this.#snapshot(principal);
    const card = styleCards(this.#games(snapshot), this.#deps.openingCatalogue).find((candidate) => candidate.metricId === metricId)!;
    const all = card.state === "measured" ? this.#allContributors(snapshot, metricId) : this.#measuredGames(snapshot, metricId);
    return Object.freeze({ card, contributors: contributors(all, limit, offset) });
  }

  /** The games in an abstaining card's population so far: the denominator, never the occurrences. */
  #measuredGames(snapshot: Snapshot, metricId: string): readonly StyleContributorRef[] {
    const metric = styleMetric(metricId)!;
    if (metric.production.kind === "blocked") return [];
    const games = this.#games(snapshot);
    const population = metricId === "castle_kingside_rate" || metricId === "castle_queenside_rate" ? games.filter((run) => run.game.castlingEligible === true)
      : metricId === "opening_family_entropy" ? games.filter((run) => run.game.opening !== null)
        : metricId === "early_queen_choice_residual" ? knownChoiceGames(games, fact => fact.beforePly < EARLY_QUEEN_PLY_BOUND)
          : metric.unit === "decision" ? knownChoiceGames(games, () => true)
            : metricId === "fianchetto_setup_rate" ? games.filter(run => run.game.fianchetto !== undefined)
              : metricId === "fianchetto_knight_screen_rate" ? games.filter(run => run.game.knightScreen !== undefined) : games;
    return population.flatMap(gameRef);
  }

  #allContributors(snapshot: Snapshot, metricId: string): readonly StyleContributorRef[] {
    const games = this.#games(snapshot);
    switch (metricId) {
      case "opening_family_entropy": return games.filter((run) => run.game.opening !== null).map((run) => Object.freeze({ runId: run.runId, nodeId: run.game.opening!.nodeId, ply: run.game.opening!.ply, moveSan: run.nodes.get(run.game.opening!.nodeId)?.moveSan ?? null, observedAt: run.observedAt }));
      case "fianchetto_setup_rate": return games.flatMap((run) => run.game.fianchetto == null ? [] : [run.game.fianchetto]);
      case "fianchetto_knight_screen_rate": return games.flatMap((run) => run.game.knightScreen == null ? [] : [run.game.knightScreen]);
      case "castle_kingside_rate": return games.flatMap((run) => run.game.castlingEligible && run.game.castled?.wing === "kingside" ? [run.game.castled.ref] : []);
      case "castle_queenside_rate": return games.flatMap((run) => run.game.castlingEligible && run.game.castled?.wing === "queenside" ? [run.game.castled.ref] : []);
      case "pawn_choice_residual": return games.flatMap((run) => run.game.decisions.filter((fact) => fact.traits?.pawn === true).map((fact) => fact.ref));
      case "center_pawn_choice_residual": return games.flatMap((run) => run.game.decisions.filter((fact) => fact.traits?.centerPawn === true).map((fact) => fact.ref));
      case "early_queen_choice_residual": return games.flatMap((run) => run.game.decisions.filter((fact) => fact.traits?.queen === true && fact.beforePly < EARLY_QUEEN_PLY_BOUND).map((fact) => fact.ref));
      default: return [];
    }
  }

  opening(principal: Principal, key: string, offset: number, limit: number): { readonly row: OpeningPerformanceRow; readonly games: ProfilePage<ProfileHistoryRow> } {
    const snapshot = this.#snapshot(principal);
    const openings = this.#openings(this.#games(snapshot), snapshot.results, Number.MAX_SAFE_INTEGER);
    const row = openings.rows.find((candidate) => candidate.key === key);
    if (row === undefined) throw new ServerError("INVALID_REQUEST", "No counted game reached that opening");
    const runIds = new Set(row.contributors.shown.map((ref) => ref.runId));
    const history = this.#history({ ...snapshot, cuts: snapshot.cuts.filter((cut) => runIds.has(cut.runId)) }, offset, limit);
    const preview = contributors(row.contributors.shown, PROFILE_PREVIEW_CONTRIBUTORS);
    return Object.freeze({ row: Object.freeze({ ...row, contributors: preview }), games: history });
  }

  observation(_principal: Principal, _key: string, _offset: number, _limit: number): never {
    throw new ServerError("PROFILE_OBSERVATIONS_NOT_ADOPTED", "Detailed structure statistics are unavailable.");
  }

  historyPage(principal: Principal, offset: number, limit: number): ProfilePage<ProfileHistoryRow> {
    return this.#history(this.#snapshot(principal), offset, limit);
  }

  /**
   * rfc/player-style.md §8 / criterion 11 — sharing is explicit and per card. Nothing is stored or
   * published: the learner receives measured rows to paste wherever they choose. Without recorded
   * consent in the request the action fails; an abstaining card has nothing to share.
   */
  shareCard(principal: Principal, metricId: string, consent: unknown): { readonly share: SharedHabitCard } {
    if (consent !== true) throw new ServerError("INVALID_REQUEST", "Sharing a card requires explicit consent", { details: { reason: "consent_required" } });
    const { card } = this.styleCard(principal, metricId, 0, 0);
    if (card.state !== "measured") throw new ServerError("INVALID_REQUEST", "Only a measured card can be shared", { details: { reason: "card_abstained" } });
    return Object.freeze({ share: sharedCard(card) });
  }
}

export interface SharedHabitCard {
  readonly metric: string;
  readonly title: string;
  readonly sentence: string;
  readonly games: number;
  readonly decisions: number;
  readonly floor: number;
  readonly interval: { readonly lower: number; readonly upper: number; readonly level: 0.95 };
  readonly window: { readonly from: string; readonly to: string };
  readonly scope: string;
  readonly text: string;
}

/** A share carries measured rows only: no type, axis, composite, run id or position. */
export function sharedCard(card: MeasuredHabitCard): SharedHabitCard {
  const text = `${card.title}: ${card.sentence} Scope: ${STYLE_TIME_CONTROL_SCOPE_TEXT}; ${card.window.from.slice(0, 10)} to ${card.window.to.slice(0, 10)}. Metric ${card.metricId}@${card.version}, measured by Tabiya.`;
  return Object.freeze({
    metric: `${card.metricId}@${card.version}`, title: card.title, sentence: card.sentence, games: card.games, decisions: card.decisions,
    floor: card.floor, interval: Object.freeze({ lower: card.interval.lower, upper: card.interval.upper, level: card.interval.level }),
    window: card.window, scope: STYLE_TIME_CONTROL_SCOPE_TEXT, text,
  });
}
