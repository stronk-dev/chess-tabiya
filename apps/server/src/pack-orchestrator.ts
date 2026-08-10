import type {
  CheckpointDefinition,
  DrillPackDefinition,
  SimpleTrigger,
} from "@chess-tabiya/schema/drill-pack";
import {
  evaluateObjective,
  evaluateObjectivePredicate,
  historyFrom,
  packEvidenceRef,
  reachCheckpoint,
  type DrillRun,
  type FenPredicate,
  type MaterialBalancePredicate,
  type MutationResult,
  type ObjectivePredicate,
  type ObjectiveState,
  type ObjectiveTransitionRule,
} from "@chess-tabiya/runtime";

function activeSpineNodeId(
  pack: DrillPackDefinition,
  run: DrillRun,
): string | undefined {
  const moves = historyFrom(run, run.activeCursor.nodeId)
    .slice(1)
    .map((node) => node.moveUci);
  let candidates = pack.spine ?? [];
  let current: string | undefined;
  for (const move of moves) {
    const node = candidates.find((candidate) => candidate.moveUci === move);
    if (node === undefined) return undefined;
    current = node.id;
    candidates = node.children;
  }
  return current;
}

function simpleTriggerMatches(
  pack: DrillPackDefinition,
  run: DrillRun,
  trigger: SimpleTrigger,
): boolean {
  const node = run.nodes.find((candidate) => candidate.id === run.activeCursor.nodeId)!;
  if ("atPly" in trigger) return node.ply === trigger.atPly;
  if ("atSpineNode" in trigger) {
    return activeSpineNodeId(pack, run) === trigger.atSpineNode;
  }
  if ("fenPredicate" in trigger) {
    return evaluateObjectivePredicate(run, {
      type: "fenPredicate",
      predicate: trigger.fenPredicate as FenPredicate,
    });
  }
  return evaluateObjectivePredicate(run, {
    type: "materialBalance",
    ...(trigger.materialBalance as Omit<MaterialBalancePredicate, "type">),
  });
}

function checkpointMatches(
  pack: DrillPackDefinition,
  run: DrillRun,
  checkpoint: CheckpointDefinition,
): boolean {
  const trigger = checkpoint.trigger;
  if ("windowOpens" in trigger) {
    return simpleTriggerMatches(pack, run, trigger.windowCloses);
  }
  return simpleTriggerMatches(pack, run, trigger);
}

function reachedOnActivePath(
  run: DrillRun,
  checkpointId: string,
): boolean {
  const path = new Set(
    historyFrom(run, run.activeCursor.nodeId).map((node) => node.id),
  );
  return run.events.some(
    (event) =>
      event.type === "checkpoint.reached" &&
      event.data.checkpointId === checkpointId &&
      path.has(event.data.nodeId),
  );
}

function successPredicate(value: unknown): ObjectivePredicate | undefined {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }
  const condition = value as Record<string, unknown>;
  if (
    condition.kind === "reach_checkpoint" &&
    typeof condition.checkpointId === "string"
  ) {
    return { type: "checkpointReached", checkpointId: condition.checkpointId };
  }
  return undefined;
}

function objectiveRules(pack: DrillPackDefinition): readonly ObjectiveTransitionRule[] {
  const raw = pack.objective.successConditions;
  if (!Array.isArray(raw)) return [];
  const fromStates: readonly ObjectiveState[] = ["active", "preserved", "degraded"];
  return raw.flatMap((condition, conditionIndex) => {
    const predicate = successPredicate(condition);
    if (predicate === undefined || predicate.type !== "checkpointReached") return [];
    return fromStates.map((from) => ({
      id: `pack-success-${conditionIndex}-${from}`,
      from,
      to: "achieved" as const,
      when: predicate,
      evidenceRefs: [packEvidenceRef(predicate.checkpointId)],
    }));
  });
}

export function orchestratePackMove(
  pack: DrillPackDefinition,
  before: DrillRun,
  committed: MutationResult,
): MutationResult {
  let run = committed.run;
  const active = run.nodes.find((node) => node.id === run.activeCursor.nodeId)!;
  for (const checkpoint of pack.checkpoints) {
    if (
      !reachedOnActivePath(run, checkpoint.id) &&
      checkpointMatches(pack, run, checkpoint)
    ) {
      run = reachCheckpoint(run, checkpoint.id, active.createdAt).run;
    }
  }
  run = evaluateObjective(run, objectiveRules(pack), active.createdAt).run;
  return Object.freeze({
    run,
    emitted: Object.freeze(run.events.slice(before.events.length)),
  });
}
