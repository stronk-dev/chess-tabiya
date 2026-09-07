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
}

export function automaticScheduleDecision(
  history: readonly { readonly graded: boolean; readonly verdict: AttemptVerdict }[],
): AutoScheduleDecision | undefined {
  if (history.length === 0) return undefined;
  let trailingStable = 0;
  for (let index = history.length - 1; index >= 0 && history[index]!.verdict === "stable"; index -= 1) {
    trailingStable += 1;
  }
  const latest = history.at(-1)!;
  const previous = history.at(-2);
  const ladderIndex = latest.graded === false
    ? Math.min(Math.max(history.length - 1, 0), VARIED_LADDER_DAYS.length - 1)
    : latest.verdict === "stable" && previous?.verdict === "stable"
      ? Math.min(Math.max(trailingStable - 2, 0), VARIED_LADDER_DAYS.length - 1)
      : null;
  return ladderIndex === null
    ? Object.freeze({ kind: "blocked", days: 0, ladderIndex, trailingStable })
    : Object.freeze({ kind: "varied", days: VARIED_LADDER_DAYS[ladderIndex]!, ladderIndex, trailingStable });
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
