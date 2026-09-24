// The client's view of the private learner profile (rfc/player-style.md, rfc/skills.md). Every
// response crosses one strict parser: a malformed or widened payload is refused, never rendered.
import type { HabitCard, StyleContributorRef, StyleContributors } from "@chess-tabiya/runtime";

export type { HabitCard, StyleContributorRef, StyleContributors };

export interface ProfileHistoryRow {
  readonly runId: string;
  readonly observedAt: string | null;
  readonly sessionKind: "pack" | "position" | "imported" | null;
  readonly packId: string | null;
  readonly state: "counted" | "pending" | "failed" | "unavailable";
  readonly status: "counted_game" | "not_from_start_position" | "no_decisions_of_yours" | "store_mismatch" | null;
  readonly playedDecisions: number | null;
  readonly opening: { readonly eco: string; readonly name: string } | null;
  readonly outcome: "win" | "loss" | "draw" | null;
  readonly detail: string | null;
}

export interface ProfilePage<T> { readonly total: number; readonly offset: number; readonly items: readonly T[]; readonly hiddenCount: number }

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
  readonly byPhase: readonly { readonly phase: string; readonly occurred: number; readonly opportunities: number }[];
  readonly derivedRev: number;
}

export interface SkillCategoryView {
  readonly category: string;
  readonly label: string;
  readonly emptyReason: string | null;
  readonly marks: readonly { readonly kind: string; readonly leafId: string; readonly occurredAt: string; readonly sentence: string; readonly link: { readonly runId: string; readonly branchId: string; readonly nodeId: string } }[];
}

export interface SkillsView {
  readonly categories: readonly SkillCategoryView[];
  readonly candidateLeaves: readonly { readonly leafId: string; readonly label: string; readonly source: string; readonly category: string | null; readonly blockers: readonly string[]; readonly blockerText: readonly string[] }[];
  readonly valence: { readonly declarations: number; readonly issues: number; readonly statement: string };
  readonly conceptIdentity: string;
  readonly marksStatement: string;
}

export interface LearnerProfileView {
  readonly derivationRev: number;
  readonly store: { readonly status: string; readonly runs: number; readonly counted: number; readonly pending: number; readonly failed: number; readonly unavailable: number; readonly statement: string };
  readonly population: { readonly measuredGames: number; readonly playedDecisions: number; readonly otherRuns: number; readonly definition: string; readonly window: { readonly from: string; readonly to: string } | null };
  readonly style: { readonly cards: readonly HabitCard[]; readonly disclosures: readonly string[] };
  readonly openings: { readonly available: boolean; readonly unavailableReason: string | null; readonly rows: readonly OpeningPerformanceRow[]; readonly unresolvedGames: number; readonly rateStatement: string; readonly source: string | null };
  readonly observations: { readonly rows: readonly ObservationLedgerRow[]; readonly playedDecisions: number; readonly statement: string };
  readonly skills: SkillsView;
  readonly history: ProfilePage<ProfileHistoryRow>;
  readonly privacy: { readonly visibility: "private"; readonly statements: readonly string[] };
}

export interface StyleCardPage { readonly card: HabitCard; readonly contributors: StyleContributors }
export interface OpeningDetail { readonly row: OpeningPerformanceRow; readonly games: ProfilePage<ProfileHistoryRow> }
export interface ObservationDetail { readonly row: ObservationLedgerRow; readonly occurred: ProfilePage<StyleContributorRef>; readonly opportunities: number }
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

class ProfileResponseError extends TypeError {
  constructor(path: string) {
    super(`Learner profile response is malformed at ${path}`);
    this.name = "ProfileResponseError";
  }
}

type Json = Readonly<Record<string, unknown>>;

function object(value: unknown, path: string): Json {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new ProfileResponseError(path);
  return value as Json;
}
function array(value: unknown, path: string): readonly unknown[] {
  if (!Array.isArray(value)) throw new ProfileResponseError(path);
  return value;
}
function text(value: unknown, path: string): string {
  if (typeof value !== "string") throw new ProfileResponseError(path);
  return value;
}
function count(value: unknown, path: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) throw new ProfileResponseError(path);
  return value as number;
}
function finite(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new ProfileResponseError(path);
  return value;
}
function nullable<T>(value: unknown, path: string, parse: (item: unknown, at: string) => T): T | null {
  return value === null ? null : parse(value, path);
}
function oneOf<T extends string>(value: unknown, values: readonly T[], path: string): T {
  if (typeof value !== "string" || !(values as readonly string[]).includes(value)) throw new ProfileResponseError(path);
  return value as T;
}

function contributorRef(value: unknown, path: string): StyleContributorRef {
  const item = object(value, path);
  return { runId: text(item.runId, `${path}.runId`), nodeId: text(item.nodeId, `${path}.nodeId`), ply: count(item.ply, `${path}.ply`), moveSan: nullable(item.moveSan, `${path}.moveSan`, text), observedAt: text(item.observedAt, `${path}.observedAt`) };
}

function contributorsOf(value: unknown, path: string): StyleContributors {
  const item = object(value, path);
  const shown = array(item.shown, `${path}.shown`).map((entry, index) => contributorRef(entry, `${path}.shown[${index}]`));
  const total = count(item.total, `${path}.total`);
  const hiddenCount = count(item.hiddenCount, `${path}.hiddenCount`);
  if (shown.length + hiddenCount > total) throw new ProfileResponseError(`${path}.hiddenCount`);
  return { total, shown, hiddenCount };
}

function habitCard(value: unknown, path: string): HabitCard {
  const item = object(value, path);
  if (item.kind !== "habit_card") throw new ProfileResponseError(`${path}.kind`);
  const state = oneOf(item.state, ["measured", "abstained"] as const, `${path}.state`);
  text(item.metricId, `${path}.metricId`);
  text(item.featureId, `${path}.featureId`);
  text(item.title, `${path}.title`);
  text(item.sentence, `${path}.sentence`);
  count(item.floor, `${path}.floor`);
  count(item.games, `${path}.games`);
  count(item.decisions, `${path}.decisions`);
  text(item.phaseScope, `${path}.phaseScope`);
  text(item.timeControlScope, `${path}.timeControlScope`);
  text(item.valueDefinition, `${path}.valueDefinition`);
  text(item.denominatorDefinition, `${path}.denominatorDefinition`);
  contributorsOf(item.contributors, `${path}.contributors`);
  const tier = object(item.tier, `${path}.tier`);
  if (tier.rule !== "reference_quantile_lower_bound@1") throw new ProfileResponseError(`${path}.tier.rule`);
  if (state === "measured") {
    finite(item.value, `${path}.value`);
    text(item.valueText, `${path}.valueText`);
    const interval = object(item.interval, `${path}.interval`);
    finite(interval.lower, `${path}.interval.lower`);
    finite(interval.upper, `${path}.interval.upper`);
    const window = object(item.window, `${path}.window`);
    text(window.from, `${path}.window.from`);
    text(window.to, `${path}.window.to`);
    // A measured card below its own floor is a server defect; the client refuses to render it.
    if ((item.games as number) < (item.floor as number)) throw new ProfileResponseError(`${path}.games`);
  } else {
    const abstention = object(item.abstention, `${path}.abstention`);
    oneOf(abstention.code, ["below_floor", "blocked", "incomplete_card"] as const, `${path}.abstention.code`);
  }
  return item as unknown as HabitCard;
}

function historyRow(value: unknown, path: string): ProfileHistoryRow {
  const item = object(value, path);
  text(item.runId, `${path}.runId`);
  oneOf(item.state, ["counted", "pending", "failed", "unavailable"] as const, `${path}.state`);
  if (item.opening !== null) { const opening = object(item.opening, `${path}.opening`); text(opening.eco, `${path}.opening.eco`); text(opening.name, `${path}.opening.name`); }
  if (item.outcome !== null) oneOf(item.outcome, ["win", "loss", "draw"] as const, `${path}.outcome`);
  return item as unknown as ProfileHistoryRow;
}

function page<T>(value: unknown, path: string, parse: (item: unknown, at: string) => T): ProfilePage<T> {
  const item = object(value, path);
  return { total: count(item.total, `${path}.total`), offset: count(item.offset, `${path}.offset`), items: array(item.items, `${path}.items`).map((entry, index) => parse(entry, `${path}.items[${index}]`)), hiddenCount: count(item.hiddenCount, `${path}.hiddenCount`) };
}

function openingRow(value: unknown, path: string): OpeningPerformanceRow {
  const item = object(value, path);
  text(item.key, `${path}.key`); text(item.eco, `${path}.eco`); text(item.name, `${path}.name`);
  const games = count(item.games, `${path}.games`);
  const results = object(item.results, `${path}.results`);
  const total = ["win", "draw", "loss", "noResult"].reduce((sum, key) => sum + count(results[key], `${path}.results.${key}`), 0);
  if (total !== games) throw new ProfileResponseError(`${path}.results`);
  contributorsOf(item.contributors, `${path}.contributors`);
  array(item.relatedPacks, `${path}.relatedPacks`).forEach((pack, index) => { const entry = object(pack, `${path}.relatedPacks[${index}]`); text(entry.id, `${path}.relatedPacks[${index}].id`); text(entry.title, `${path}.relatedPacks[${index}].title`); });
  return item as unknown as OpeningPerformanceRow;
}

function observationRow(value: unknown, path: string): ObservationLedgerRow {
  const item = object(value, path);
  text(item.key, `${path}.key`); text(item.label, `${path}.label`); text(item.projectionId, `${path}.projectionId`);
  const occurred = count(item.occurred, `${path}.occurred`);
  const opportunities = count(item.opportunities, `${path}.opportunities`);
  const decisions = count(item.decisions, `${path}.decisions`);
  if (occurred > opportunities || opportunities > decisions) throw new ProfileResponseError(`${path}.opportunities`);
  count(item.runs, `${path}.runs`);
  array(item.byPhase, `${path}.byPhase`);
  return item as unknown as ObservationLedgerRow;
}

export function parseLearnerProfile(value: unknown): LearnerProfileView {
  const root = object(object(value, "$").profile, "$.profile");
  const store = object(root.store, "$.profile.store");
  text(store.statement, "$.profile.store.statement");
  count(store.runs, "$.profile.store.runs");
  const population = object(root.population, "$.profile.population");
  count(population.measuredGames, "$.profile.population.measuredGames");
  text(population.definition, "$.profile.population.definition");
  const style = object(root.style, "$.profile.style");
  array(style.cards, "$.profile.style.cards").forEach((card, index) => habitCard(card, `$.profile.style.cards[${index}]`));
  array(style.disclosures, "$.profile.style.disclosures").forEach((line, index) => text(line, `$.profile.style.disclosures[${index}]`));
  const openings = object(root.openings, "$.profile.openings");
  array(openings.rows, "$.profile.openings.rows").forEach((row, index) => openingRow(row, `$.profile.openings.rows[${index}]`));
  text(openings.rateStatement, "$.profile.openings.rateStatement");
  const observations = object(root.observations, "$.profile.observations");
  array(observations.rows, "$.profile.observations.rows").forEach((row, index) => observationRow(row, `$.profile.observations.rows[${index}]`));
  const skills = object(root.skills, "$.profile.skills");
  array(skills.categories, "$.profile.skills.categories").forEach((category, index) => { const item = object(category, `$.profile.skills.categories[${index}]`); text(item.label, `$.profile.skills.categories[${index}].label`); array(item.marks, `$.profile.skills.categories[${index}].marks`); });
  array(skills.candidateLeaves, "$.profile.skills.candidateLeaves");
  page(root.history, "$.profile.history", historyRow);
  const privacy = object(root.privacy, "$.profile.privacy");
  if (privacy.visibility !== "private") throw new ProfileResponseError("$.profile.privacy.visibility");
  return root as unknown as LearnerProfileView;
}

export function parseStyleCardPage(value: unknown): StyleCardPage {
  const root = object(value, "$");
  return { card: habitCard(root.card, "$.card"), contributors: contributorsOf(root.contributors, "$.contributors") };
}

export function parseOpeningDetail(value: unknown): OpeningDetail {
  const root = object(value, "$");
  return { row: openingRow(root.row, "$.row"), games: page(root.games, "$.games", historyRow) };
}

export function parseObservationDetail(value: unknown): ObservationDetail {
  const root = object(value, "$");
  return { row: observationRow(root.row, "$.row"), occurred: page(root.occurred, "$.occurred", contributorRef), opportunities: count(root.opportunities, "$.opportunities") };
}

export function parseProfileHistory(value: unknown): ProfilePage<ProfileHistoryRow> {
  return page(object(value, "$").history, "$.history", historyRow);
}

export function parseSharedCard(value: unknown): SharedHabitCard {
  const share = object(object(value, "$").share, "$.share");
  for (const key of ["metric", "title", "sentence", "scope", "text"]) text(share[key], `$.share.${key}`);
  for (const key of ["runId", "nodeId", "contributors"]) if (key in share) throw new ProfileResponseError(`$.share.${key}`);
  return share as unknown as SharedHabitCard;
}
