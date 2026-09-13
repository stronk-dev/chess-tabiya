import { CORPUS_GUARD } from "@chess-tabiya/runtime";

import type {
  ProgressAttempt,
  ProgressMilestone,
  ProgressRecommendation,
  ProgressRecommendationPage,
  ProgressSchedule,
  RelatedProgressAttempt,
} from "./api.js";

type RecordValue = Readonly<Record<string, unknown>>;

const ATTEMPT_KEYS = Object.freeze(["runId", "branchId", "packId", "branchLabel", "attemptNo", "countable", "graded", "verdict", "result", "userPlyCount", "origin", "endedAt"] as const);
const SCHEDULE_KEYS = Object.freeze(["id", "sessionKind", "packId", "kind", "variant", "dueAt", "sourceRunId"] as const);
const MILESTONE_KEYS = Object.freeze(["kind", "occurredAt", "link"] as const);
const RELATED_KEYS = Object.freeze(["relation", "runId", "branchId", "attemptCount"] as const);
const REPERTOIRE_RECOMMENDATION_KEYS = Object.freeze(["kind", "repertoireId", "repertoireName", "gapKey", "replySan", "line", "gamesUntilSeen"] as const);
const SHAPE_RECOMMENDATION_KEYS = Object.freeze(["kind", "shapeId", "shapeName", "runCount", "runIds", "packIds"] as const);

const MILESTONE_KINDS = Object.freeze(["first_attempt", "first_stable", "first_objective_achieved", "first_win", "first_scheduled_return", "ten_attempts_one_root", "first_flip_sides"] as const);
const MILESTONE_SENTENCES: Readonly<Record<ProgressMilestone["kind"], string>> = Object.freeze({
  first_attempt: "First preserved attempt.",
  first_stable: "First stable graded attempt.",
  first_objective_achieved: "First achieved objective.",
  first_win: "First recorded win.",
  first_scheduled_return: "First return when due.",
  ten_attempts_one_root: "Ten attempts on one root.",
  first_flip_sides: "First opposite-side replay.",
});

function record(value: unknown, label: string): RecordValue {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`);
  return value as RecordValue;
}

function exact(value: RecordValue, keys: readonly string[], label: string): void {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) throw new TypeError(`${label} has an invalid shape`);
}

function string(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) throw new TypeError(`${label} must be a non-empty string`);
  return value;
}

function nullableString(value: unknown, label: string): string | null {
  return value === null ? null : string(value, label);
}

function integer(value: unknown, label: string, minimum = 0): number {
  if (!Number.isSafeInteger(value) || Number(value) < minimum) throw new TypeError(`${label} must be a safe integer >= ${minimum}`);
  return Number(value);
}

function timestamp(value: unknown, label: string): string {
  const parsed = string(value, label);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(parsed) || new Date(parsed).toISOString() !== parsed) throw new TypeError(`${label} must be a canonical UTC timestamp`);
  return parsed;
}

function stringArray(value: unknown, label: string): readonly string[] {
  if (!Array.isArray(value)) throw new TypeError(`${label} must be an array`);
  const output = value.map((item, index) => string(item, `${label}/${index}`));
  if (new Set(output).size !== output.length) throw new TypeError(`${label} contains duplicate identities`);
  return Object.freeze(output);
}

function oneOf<T extends string>(value: unknown, values: readonly T[], label: string): T {
  if (typeof value !== "string" || !values.includes(value as T)) throw new TypeError(`${label} is outside the closed vocabulary`);
  return value as T;
}

export function parseProgressAttempts(value: unknown): readonly ProgressAttempt[] {
  const envelope = record(value, "progress response"); exact(envelope, ["attempts"], "progress response");
  if (!Array.isArray(envelope.attempts)) throw new TypeError("progress attempts must be an array");
  const identities = new Set<string>();
  let priorEndedAt: string | undefined;
  const attempts = envelope.attempts.map((raw, index) => {
    const item = record(raw, `attempts/${index}`); exact(item, ATTEMPT_KEYS, `attempts/${index}`);
    const runId = string(item.runId, `attempts/${index}/runId`), branchId = string(item.branchId, `attempts/${index}/branchId`);
    const identity = `${runId}\0${branchId}`;
    if (identities.has(identity)) throw new TypeError("progress attempts contain a duplicate run/branch");
    identities.add(identity);
    const endedAt = timestamp(item.endedAt, `attempts/${index}/endedAt`);
    if (priorEndedAt !== undefined && priorEndedAt < endedAt) throw new TypeError("progress attempts are not newest-first");
    priorEndedAt = endedAt;
    const countable = item.countable;
    if (typeof countable !== "boolean") throw new TypeError(`attempts/${index}/countable must be boolean`);
    const graded = item.graded;
    if (typeof graded !== "boolean") throw new TypeError(`attempts/${index}/graded must be boolean`);
    const userPlyCount = integer(item.userPlyCount, `attempts/${index}/userPlyCount`);
    if (countable !== (userPlyCount > 0)) throw new TypeError(`attempts/${index} has inconsistent countability`);
    const verdict = oneOf(item.verdict, ["stable", "unstable", "open"] as const, `attempts/${index}/verdict`);
    if (!graded && verdict !== "open") throw new TypeError(`attempts/${index} grades an ungraded attempt`);
    const result = item.result === null ? null : oneOf(item.result, ["win", "loss", "draw"] as const, `attempts/${index}/result`);
    const attemptNo = integer(item.attemptNo, `attempts/${index}/attemptNo`);
    if ((countable && attemptNo < 1) || (!countable && attemptNo !== 0)) throw new TypeError(`attempts/${index} has an inconsistent attempt number`);
    return Object.freeze({
      runId, branchId,
      packId: nullableString(item.packId, `attempts/${index}/packId`),
      branchLabel: string(item.branchLabel, `attempts/${index}/branchLabel`),
      attemptNo,
      countable, graded, verdict, result, userPlyCount,
      origin: oneOf(item.origin, ["fresh", "duplicate", "scheduled", "in_run_retry"] as const, `attempts/${index}/origin`),
      endedAt,
    });
  });
  return Object.freeze(attempts);
}

export function parseProgressSchedules(value: unknown): readonly ProgressSchedule[] {
  const envelope = record(value, "due response"); exact(envelope, ["schedules"], "due response");
  if (!Array.isArray(envelope.schedules)) throw new TypeError("due schedules must be an array");
  const ids = new Set<string>();
  return Object.freeze(envelope.schedules.map((raw, index) => {
    const item = record(raw, `schedules/${index}`); exact(item, SCHEDULE_KEYS, `schedules/${index}`);
    const id = string(item.id, `schedules/${index}/id`);
    if (ids.has(id)) throw new TypeError("due schedules contain a duplicate id"); ids.add(id);
    const sessionKind = oneOf(item.sessionKind, ["pack", "position"] as const, `schedules/${index}/sessionKind`);
    const packId = nullableString(item.packId, `schedules/${index}/packId`);
    if ((sessionKind === "pack") !== (packId !== null)) throw new TypeError(`schedules/${index} has an inconsistent pack identity`);
    return Object.freeze({
      id, sessionKind, packId,
      kind: oneOf(item.kind, ["blocked", "varied"] as const, `schedules/${index}/kind`),
      variant: nullableString(item.variant, `schedules/${index}/variant`),
      dueAt: timestamp(item.dueAt, `schedules/${index}/dueAt`),
      sourceRunId: nullableString(item.sourceRunId, `schedules/${index}/sourceRunId`),
    });
  }));
}

export function progressMilestoneSentence(kind: ProgressMilestone["kind"]): string { return MILESTONE_SENTENCES[kind]; }

export function parseProgressMilestones(value: unknown): readonly ProgressMilestone[] {
  const envelope = record(value, "milestones response"); exact(envelope, ["milestones"], "milestones response");
  if (!Array.isArray(envelope.milestones) || envelope.milestones.length > MILESTONE_KINDS.length) throw new TypeError("milestones must be a bounded array");
  const kinds = new Set<string>(); let prior: string | undefined;
  return Object.freeze(envelope.milestones.map((raw, index) => {
    const item = record(raw, `milestones/${index}`); exact(item, MILESTONE_KEYS, `milestones/${index}`);
    const kind = oneOf(item.kind, MILESTONE_KINDS, `milestones/${index}/kind`);
    if (kinds.has(kind)) throw new TypeError("milestones contain a duplicate kind"); kinds.add(kind);
    const occurredAt = timestamp(item.occurredAt, `milestones/${index}/occurredAt`);
    if (prior !== undefined && prior < occurredAt) throw new TypeError("milestones are not newest-first"); prior = occurredAt;
    const link = record(item.link, `milestones/${index}/link`); exact(link, ["runId", "branchId"], `milestones/${index}/link`);
    return Object.freeze({ kind, occurredAt, sentence: progressMilestoneSentence(kind), link: Object.freeze({ runId: string(link.runId, `milestones/${index}/link/runId`), branchId: string(link.branchId, `milestones/${index}/link/branchId`) }) });
  }));
}

export function parseRelatedProgress(value: unknown, sourceRunId: string): readonly RelatedProgressAttempt[] {
  const envelope = record(value, "related response"); exact(envelope, ["related"], "related response");
  if (!Array.isArray(envelope.related) || envelope.related.length > 3) throw new TypeError("related attempts must contain at most three rows");
  const identities = new Set<string>(); let priorOrder = -1;
  return Object.freeze(envelope.related.map((raw, index) => {
    const item = record(raw, `related/${index}`); exact(item, RELATED_KEYS, `related/${index}`);
    const relation = oneOf(item.relation, ["same_position", "same_pack", "same_concept_in_pack"] as const, `related/${index}/relation`);
    const order = ["same_position", "same_pack", "same_concept_in_pack"].indexOf(relation);
    if (order < priorOrder) throw new TypeError("related attempts are not in relation priority order"); priorOrder = order;
    const runId = string(item.runId, `related/${index}/runId`), branchId = string(item.branchId, `related/${index}/branchId`);
    if (runId === sourceRunId) throw new TypeError("related attempts contain the source run");
    const identity = `${runId}\0${branchId}`; if (identities.has(identity)) throw new TypeError("related attempts contain a duplicate run/branch"); identities.add(identity);
    return Object.freeze({ relation, runId, branchId, attemptCount: integer(item.attemptCount, `related/${index}/attemptCount`, 1) });
  }));
}

export function progressRecommendationSentence(item: ProgressRecommendation): string {
  return item.kind === "shape_encounter"
    ? `You met ${item.shapeName} in ${item.runCount} of your preserved runs and have no countable attempt recorded in a rehearsal that names it.`
    : `Your repertoire ${item.repertoireName} has no answer to ${item.replySan} after ${item.line.join(" ")}; this population reached it about once every ${item.gamesUntilSeen} games. ${CORPUS_GUARD}`;
}

export function parseProgressRecommendations(value: unknown): ProgressRecommendationPage {
  const envelope = record(value, "recommendations response"); exact(envelope, ["recommendations", "selection"], "recommendations response");
  if (!Array.isArray(envelope.recommendations) || envelope.recommendations.length > 20) throw new TypeError("recommendations must be a bounded array");
  const identities = new Set<string>();
  const recommendations = envelope.recommendations.map((raw, index): ProgressRecommendation => {
    const item = record(raw, `recommendations/${index}`), kind = oneOf(item.kind, ["repertoire_gap", "shape_encounter"] as const, `recommendations/${index}/kind`);
    exact(item, kind === "repertoire_gap" ? REPERTOIRE_RECOMMENDATION_KEYS : SHAPE_RECOMMENDATION_KEYS, `recommendations/${index}`);
    if (kind === "repertoire_gap") {
      const repertoireId = string(item.repertoireId, `recommendations/${index}/repertoireId`), gapKey = string(item.gapKey, `recommendations/${index}/gapKey`), identity = `${kind}\0${repertoireId}\0${gapKey}`;
      if (identities.has(identity)) throw new TypeError("recommendations contain a duplicate identity"); identities.add(identity);
      return Object.freeze({ kind, repertoireId, repertoireName: string(item.repertoireName, `recommendations/${index}/repertoireName`), gapKey, replySan: string(item.replySan, `recommendations/${index}/replySan`), line: stringArray(item.line, `recommendations/${index}/line`), gamesUntilSeen: integer(item.gamesUntilSeen, `recommendations/${index}/gamesUntilSeen`, 1) });
    }
    const shapeId = string(item.shapeId, `recommendations/${index}/shapeId`), identity = `${kind}\0${shapeId}`;
    if (identities.has(identity)) throw new TypeError("recommendations contain a duplicate identity"); identities.add(identity);
    const runIds = stringArray(item.runIds, `recommendations/${index}/runIds`), runCount = integer(item.runCount, `recommendations/${index}/runCount`, 1);
    if (runIds.length !== runCount) throw new TypeError(`recommendations/${index} has inconsistent runCount`);
    return Object.freeze({ kind, shapeId, shapeName: string(item.shapeName, `recommendations/${index}/shapeName`), runCount, runIds, packIds: stringArray(item.packIds, `recommendations/${index}/packIds`) });
  });
  const selection = record(envelope.selection, "recommendations selection"); exact(selection, ["shown", "total"], "recommendations selection");
  const shown = integer(selection.shown, "recommendations selection/shown"), total = integer(selection.total, "recommendations selection/total");
  if (shown !== recommendations.length || total < shown) throw new TypeError("recommendation selection arithmetic is inconsistent");
  return Object.freeze({ recommendations: Object.freeze(recommendations), selection: Object.freeze({ shown, total }) });
}
