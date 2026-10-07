import { projectRun, resolveBotProfileReference, type DrillRun, type RunOpponentPolicy } from "@chess-tabiya/runtime";

interface DuplicateSubject {
  readonly id: string;
  readonly seed: number;
  readonly source?: DrillRun | undefined;
}

function opponentIdentity(policy: RunOpponentPolicy): string {
  const profile = policy.profile === undefined ? null : resolveBotProfileReference(policy.profile).reference;
  return JSON.stringify([policy.mode, policy.targetElo, policy.temperature, policy.topP, profile]);
}

/** A new attempt starts at its root; never attach another game or a substituted opponent. */
export function assertDuplicateRunResponse(run: DrillRun, subject: DuplicateSubject): void {
  const recorded = projectRun(run.events);
  const root = run.nodes[0];
  const branch = run.branches[0];
  if (run.id !== subject.id || recorded.id !== subject.id
    || run.nodes.length !== 1 || run.branches.length !== 1
    || recorded.nodes.length !== 1 || recorded.branches.length !== 1
    || root?.parentId !== null || root.moveUci !== null || root.ply !== 0
    || root.fen !== run.start.fen || branch?.seed !== subject.seed
    || recorded.branches[0]?.seed !== subject.seed
    || run.activeCursor.nodeId !== root.id || run.activeCursor.branchId !== branch.id
    || recorded.activeCursor.nodeId !== root.id || recorded.activeCursor.branchId !== branch.id
    || recorded.start.fen !== run.start.fen || recorded.start.side !== run.start.side
    || opponentIdentity(recorded.opponentPolicy) !== opponentIdentity(run.opponentPolicy)) {
    throw new TypeError("New-game response does not match the requested attempt");
  }
  const source = subject.source;
  if (source === undefined) return;
  const configIdentity = (value: DrillRun) => JSON.stringify([
    value.policyConfig.seedMode, value.policyConfig.locus.executedAt,
    value.policyConfig.locus.engineIds.map((entry) => [entry.id, entry.version]),
    value.policyConfig.locus.modelIds.map((entry) => [entry.id, entry.version]),
  ]);
  if (run.id === source.id || run.start.fen !== source.start.fen || run.start.side !== source.start.side
    || run.sessionKind !== (source.sessionKind === "pack" ? "pack" : "position")
    || run.packId !== (source.sessionKind === "pack" ? source.packId : null)
    || run.packDigest !== (source.sessionKind === "pack" ? source.packDigest : null)
    || run.feedbackPolicy !== (source.sessionKind === "pack" ? source.feedbackPolicy : "attempt_end")
    || configIdentity(run) !== configIdentity(source)
    || opponentIdentity(run.opponentPolicy) !== opponentIdentity(source.opponentPolicy)) {
    throw new TypeError("New-game response does not preserve the source game");
  }
}
