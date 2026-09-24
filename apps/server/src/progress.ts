import { branchPath, type DrillRun, type ObjectiveState } from "@chess-tabiya/runtime";
import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";

import { objectiveRules, type PlanSignatureResolver } from "./pack-orchestrator.js";

export type AttemptVerdict = "stable" | "unstable" | "open";
export type AttemptOrigin = "fresh" | "duplicate" | "scheduled" | "in_run_retry";

export const VARIED_LADDER_DAYS = Object.freeze([1, 3, 7, 16, 35] as const);

export interface AutoScheduleDecision {
  readonly kind: "blocked" | "varied";
  readonly days: number;
  readonly ladderIndex: number | null;
  readonly trailingStable: number;
  /** Retained step-down floor (rfc/return-scheduling.md §2.3); 0 when the root never lapsed after climbing. */
  readonly floor: number;
}

export interface LadderAttempt {
  readonly graded: boolean;
  readonly verdict: AttemptVerdict;
  /** Absent means an on-schedule attempt, so the pure ladder can be driven by verdicts alone. */
  readonly origin?: AttemptOrigin;
  readonly rootDueAtStart?: string | null;
  readonly startedAt?: string;
}

/**
 * Overstudy (rfc/return-scheduling.md §5): an attempt the learner timed themselves may demote the
 * ladder position but never advance it. `scheduled` attempts are on schedule by construction. An
 * in-run retry is a rewind in the same sitting and is always off schedule. Any other origin is off
 * schedule only when the root already had a pending return that was not yet due when it started —
 * reviewing early. A first-time attempt, or one started after the root came due, is on schedule, so
 * a learner who returns through the pack shelf is not locked out of the ladder.
 */
export function isOffScheduleAttempt(attempt: LadderAttempt): boolean {
  if (attempt.origin === undefined || attempt.origin === "scheduled") return false;
  if (attempt.origin === "in_run_retry") return true;
  return attempt.rootDueAtStart !== undefined && attempt.rootDueAtStart !== null &&
    attempt.startedAt !== undefined && attempt.startedAt < attempt.rootDueAtStart;
}

const LAST_RUNG = VARIED_LADDER_DAYS.length - 1;
const clampRung = (value: number): number => Math.min(Math.max(value, 0), LAST_RUNG);

/**
 * The varied/blocked return decision (rfc/archive/return-and-progression.md §7 as amended by
 * rfc/return-scheduling.md §§2 and 5). The ungraded arm counts attempts; the graded arm counts the
 * trailing stable streak, never both. The countable history is replayed in order so the retained
 * floor (`peak - 1` after a lapse) and the overstudy cap derive from `attempts` alone.
 */
export function automaticScheduleDecision(
  history: readonly LadderAttempt[],
): AutoScheduleDecision | undefined {
  if (history.length === 0) return undefined;
  let trailingStable = 0;
  let served: number | null | undefined;
  let peak = -1;
  let lapsedSincePeak = false;
  let floor = 0;
  for (const [index, attempt] of history.entries()) {
    trailingStable = attempt.verdict === "stable" ? trailingStable + 1 : 0;
    if (attempt.graded && attempt.verdict !== "stable") lapsedSincePeak = true;
    floor = peak >= 0 && lapsedSincePeak ? clampRung(peak - 1) : 0;
    const previous = index === 0 ? undefined : history[index - 1];
    let rung: number | null = attempt.graded === false
      ? clampRung(index)
      : attempt.verdict === "stable" && previous?.verdict === "stable"
        ? clampRung(Math.max(trailingStable - 2, floor))
        : null;
    if (served !== undefined && isOffScheduleAttempt(attempt) && (rung ?? -1) > (served ?? -1)) rung = served;
    served = rung;
    if (rung !== null && rung >= peak) {
      peak = rung;
      lapsedSincePeak = false;
    }
  }
  const ladderIndex = served ?? null;
  return ladderIndex === null
    ? Object.freeze({ kind: "blocked", days: 0, ladderIndex, trailingStable, floor })
    : Object.freeze({ kind: "varied", days: VARIED_LADDER_DAYS[ladderIndex]!, ladderIndex, trailingStable, floor });
}

/**
 * The coarse return standing (rfc/return-scheduling.md Discharge D2, owner ruling 2026-09-24): a
 * closed three-word vocabulary derived only from the return-ladder rung the replay above serves.
 * It describes spaced-recall standing — how far apart the returns have been held — and is never a
 * mastery claim, a verdict or a number. This is the one place the rung maps to a word; the rung
 * itself never leaves the server.
 */
export const RETURN_STANDINGS = Object.freeze(["new", "learning", "established"] as const);
export type ReturnStanding = (typeof RETURN_STANDINGS)[number];

/**
 * Explicit rung thresholds over `VARIED_LADDER_DAYS` indices. No rung (a blocked repeat, or a root
 * with no countable history) and rung 0 (1 day) are `new`; rungs 1-2 (3 and 7 days) are `learning`;
 * rungs 3-4 (16 and 35 days) are `established`.
 */
export const RETURN_STANDING_MIN_RUNG = Object.freeze({ learning: 1, established: 3 } as const);

export function returnStanding(ladderIndex: number | null | undefined): ReturnStanding {
  if (ladderIndex === null || ladderIndex === undefined) return "new";
  if (!Number.isSafeInteger(ladderIndex) || ladderIndex < 0 || ladderIndex > LAST_RUNG) {
    throw new RangeError(`Return-ladder rung out of range: ${ladderIndex}`);
  }
  if (ladderIndex >= RETURN_STANDING_MIN_RUNG.established) return "established";
  if (ladderIndex >= RETURN_STANDING_MIN_RUNG.learning) return "learning";
  return "new";
}

/**
 * The retry variant a varied return names (rfc/return-scheduling.md §7): a rotation through the
 * pack's declared `retryVariants` kinds by ladder index. Blocked returns repeat the same attempt and
 * name none; a pack declaring none names none, and the surface says the variation is a fresh seed.
 * Naming is all it does — `retryVariants` does not become a run modifier.
 */
export function rotatedRetryVariant(
  decision: Pick<AutoScheduleDecision, "kind" | "ladderIndex">,
  kinds: readonly string[] | undefined,
): string | null {
  if (decision.kind !== "varied" || decision.ladderIndex === null || kinds === undefined || kinds.length === 0) return null;
  return kinds[decision.ladderIndex % kinds.length]!;
}

/** Published difficult-roots rule (rfc/return-scheduling.md §3): stated on the surface, never hidden. */
export const DIFFICULT_ROOT_UNSTABLE_THRESHOLD = 3;
/** Display budgets for the difficult-roots projection; the eligible total is always returned. */
export const DIFFICULT_ROOT_DISPLAY_LIMIT = 10;
export const DIFFICULT_ROOT_RUN_LIMIT = 5;

/**
 * Vacation-safe intake (rfc/return-scheduling.md §6): at most this many due returns are served at
 * once; the rest stay pending in their order and are counted as waiting. Nothing is rescheduled or
 * dropped and the learner chooses no interval. The value is an unevidenced, legible parameter,
 * revisable on the same stated-evidence trigger as the ladder constants.
 */
export const DUE_INTAKE_LIMIT = 20;

/**
 * Corpus-frequency tie-break (rfc/return-scheduling.md §4). Frequency orders only within one group
 * of the existing order — the same kind and the same UTC due date — so a return due on an earlier
 * day always stays ahead. Unknown frequency sorts after known; ties keep the prior order.
 * Frequency orders, it never grades.
 */
export function orderDueByFrequency<T extends { readonly kind: "blocked" | "varied"; readonly dueAt: string }>(
  schedules: readonly T[],
  games: (schedule: T) => number | undefined,
): readonly T[] {
  const indexed = schedules.map((schedule, index) => ({
    schedule,
    index,
    games: games(schedule),
    group: `${schedule.kind === "blocked" ? 0 : 1}|${schedule.dueAt.slice(0, 10)}`,
  }));
  const groupOrder = new Map<string, number>();
  for (const item of indexed) if (!groupOrder.has(item.group)) groupOrder.set(item.group, groupOrder.size);
  return Object.freeze([...indexed].sort((left, right) =>
    groupOrder.get(left.group)! - groupOrder.get(right.group)! ||
    (right.games ?? -1) - (left.games ?? -1) ||
    left.index - right.index,
  ).map((item) => item.schedule));
}

export interface AttemptRow {
  readonly runId: string;
  readonly branchId: string;
  readonly learnerId: string;
  readonly sessionKind: "pack" | "position";
  readonly packId: string | null;
  readonly packDigest: string | null;
  readonly rootKey: string;
  readonly rootNodeId: string;
  readonly rootTransposeKey: string;
  readonly branchLabel: string;
  readonly branchIntent: string | null;
  readonly branchSeed: number;
  readonly countable: boolean;
  readonly graded: boolean;
  readonly objectiveState: ObjectiveState;
  readonly verdict: AttemptVerdict;
  readonly result: "win" | "loss" | "draw" | null;
  readonly userPlyCount: number;
  readonly checkpointIds: readonly string[];
  readonly origin: AttemptOrigin;
  readonly scheduleId: string | null;
  readonly rootDueAtStart: string | null;
  readonly derivedFromRunId: string | null;
  readonly startedAt: string;
  readonly endedAt: string;
}

export interface ConceptTagRow {
  readonly runId: string;
  readonly branchId: string;
  readonly packId: string;
  readonly conceptKey: string;
  readonly label: string;
}

export interface AttemptOriginInput {
  readonly origin: AttemptOrigin;
  readonly scheduleId?: string;
  readonly rootDueAtStart?: string;
  readonly derivedFromRunId?: string;
}

export interface ConceptResolver {
  resolve(packId: string, raw: string): { readonly key: string; readonly label: string };
}

export class PackScopedConceptResolver implements ConceptResolver {
  resolve(packId: string, raw: string) {
    return Object.freeze({ key: `pack:${packId}#${raw}`, label: raw });
  }
}

function verdict(state: ObjectiveState): AttemptVerdict {
  if (state === "active") return "open";
  return state === "degraded" || state === "failed" ? "unstable" : "stable";
}

export function rootKey(
  sessionKind: DrillRun["sessionKind"],
  packId: string | null,
  transposeKey: string,
): string {
  return `${sessionKind}|${packId ?? ""}|${transposeKey}`;
}

export function projectAttempts(input: {
  readonly run: DrillRun;
  readonly pack?: DrillPackDefinition;
  readonly learnerId: string;
  readonly origins?: Readonly<Record<string, AttemptOriginInput>>;
  readonly concepts?: ConceptResolver;
  readonly resolvePlanSignature?: PlanSignatureResolver;
}): { readonly attempts: readonly AttemptRow[]; readonly conceptTags: readonly ConceptTagRow[] } {
  const { run, pack, learnerId } = input;
  if (run.sessionKind === "imported") {
    return Object.freeze({ attempts: Object.freeze([]), conceptTags: Object.freeze([]) });
  }
  const resolver = input.concepts ?? new PackScopedConceptResolver();
  const attempts: AttemptRow[] = [];
  const conceptTags: ConceptTagRow[] = [];
  const graded = pack !== undefined && objectiveRules(pack, pack.objective, "/objective", input.resolvePlanSignature).length > 0;
  for (const [branchIndex, branch] of run.branches.entries()) {
    const path = branchPath(run, branch.id);
    const root = run.nodes.find((node) => node.id === branch.forkNodeId);
    if (root === undefined) throw new TypeError(`Branch ${branch.id} has no root node`);
    const rootIndex = path.findIndex((node) => node.id === root.id);
    const attemptPath = path.slice(Math.max(0, rootIndex));
    const tip = attemptPath.at(-1) ?? root;
    const userPlyCount = attemptPath.filter((node) => node.actor === "user").length;
    const pathIds = new Set(attemptPath.map((node) => node.id));
    const checkpoints = run.events.flatMap((event) =>
      event.type === "checkpoint.reached" && pathIds.has(event.data.nodeId)
        ? [event.data.checkpointId]
        : [],
    );
    const outcome = [...run.events].reverse().find(
      (event) => event.type === "outcome.reached" && pathIds.has(event.data.nodeId),
    );
    const origin = input.origins?.[branch.id] ?? {
      origin: branchIndex === 0 ? "fresh" as const : "in_run_retry" as const,
    };
    attempts.push(Object.freeze({
      runId: run.id,
      branchId: branch.id,
      learnerId,
      sessionKind: run.sessionKind,
      packId: run.packId ?? null,
      packDigest: run.packDigest ?? null,
      rootKey: rootKey(run.sessionKind, run.packId ?? null, root.transposeKey),
      rootNodeId: root.id,
      rootTransposeKey: root.transposeKey,
      branchLabel: branch.label,
      branchIntent: branch.intent ?? null,
      branchSeed: branch.seed,
      countable: userPlyCount > 0,
      graded,
      objectiveState: tip.objectiveState,
      verdict: graded ? verdict(tip.objectiveState) : "open",
      result: outcome?.type === "outcome.reached" ? outcome.data.outcome : null,
      userPlyCount,
      checkpointIds: Object.freeze(checkpoints),
      origin: origin.origin,
      scheduleId: origin.scheduleId ?? null,
      rootDueAtStart: origin.rootDueAtStart ?? null,
      derivedFromRunId: origin.derivedFromRunId ?? null,
      startedAt: root.createdAt,
      endedAt: tip.createdAt,
    }));
    if (pack !== undefined) {
      for (const raw of pack.concepts ?? []) {
        const concept = resolver.resolve(pack.id, raw);
        conceptTags.push(Object.freeze({
          runId: run.id,
          branchId: branch.id,
          packId: pack.id,
          conceptKey: concept.key,
          label: concept.label,
        }));
      }
    }
  }
  return Object.freeze({ attempts: Object.freeze(attempts), conceptTags: Object.freeze(conceptTags) });
}
