import type {
  CheckpointDefinition,
  DrillPackDefinition,
  SimpleTrigger,
  SuccessCondition,
} from "@chess-tabiya/schema/drill-pack";
import {
  evaluateObjective,
  evaluateObjectivePredicate,
  historyFrom,
  insideAuthoredBoundary,
  packEvidenceRef,
  rulesEvidenceRef,
  spineNodeIdFor,
  spinePositionIndex,
  deviationAnchors,
  theoryEvidenceRef,
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
  const node = run.nodes.find((candidate) => candidate.id === run.activeCursor.nodeId)!;
  return spineNodeIdFor(spinePositionIndex(pack), node);
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
  if ("atAuthoredBoundary" in trigger) {
    return !insideAuthoredBoundary(pack, run, node);
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

export function checkpointMatches(
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
  if (condition.kind === "outcome" && typeof condition.result === "string") {
    return {
      type: "outcomeReached",
      result: condition.result as "win" | "loss" | "draw",
    };
  }
  if (
    condition.kind === "material_balance" &&
    typeof condition.perspective === "string" &&
    typeof condition.comparison === "string" &&
    typeof condition.value === "number"
  ) {
    return {
      type: "materialBalance",
      perspective: condition.perspective as "white" | "black",
      comparison: condition.comparison as "atLeast" | "atMost" | "equal",
      value: condition.value,
    };
  }
  if (condition.kind === "rules_fact" && typeof condition.fact === "string") {
    return {
      type: "rulesFact",
      fact: condition.fact as "checkmate" | "stalemate",
      ...(condition.winner === undefined
        ? {}
        : { winner: condition.winner as "white" | "black" }),
    };
  }
  return undefined;
}

function conditionEvidence(condition: SuccessCondition): string {
  if (condition.kind === "reach_checkpoint") {
    return packEvidenceRef(condition.checkpointId);
  }
  if (condition.kind === "outcome") {
    return rulesEvidenceRef(`result-${condition.result}`);
  }
  if (condition.kind === "material_balance") return rulesEvidenceRef("material");
  return rulesEvidenceRef(condition.fact);
}

function conditionRules(
  condition: SuccessCondition,
  index: number,
  outcomeObjective: boolean,
): readonly ObjectiveTransitionRule[] {
  const predicate = successPredicate(condition);
  if (predicate === undefined) return [];
  const to = condition.to ?? "achieved";
  const defaults: readonly ObjectiveState[] =
    to === "preserved"
      ? outcomeObjective
        ? ["active"]
        : ["active", "degraded"]
      : to === "degraded"
        ? ["active", "preserved"]
        : ["active", "preserved", "degraded"];
  const fromStates = condition.from ?? defaults;
  return fromStates.map((from) => ({
    id: `pack-success-${index}-${from}`,
    from,
    to,
    when: predicate,
    evidenceRefs: [conditionEvidence(condition)],
  }));
}

export function objectiveRules(
  pack: DrillPackDefinition,
): readonly ObjectiveTransitionRule[] {
  const raw = pack.objective.successConditions;
  if (pack.objective.type === "follow_theory") {
    const anchors = deviationAnchors(pack);
    const degraded = (pack.deviations ?? []).flatMap((deviation, index) => {
      if (!deviation.offObjective) return [];
      const fromTransposeKey =
        "spineNodeId" in deviation.at
          ? anchors.get(deviation.at.spineNodeId)
          : undefined;
      if (fromTransposeKey === undefined) return [];
      return (["active", "preserved"] as const).map((from) => ({
        id: `theory-deviation-${index}-${from}`,
        from,
        to: "degraded" as const,
        when: {
          type: "deviationPlayed" as const,
          fromTransposeKey,
          moveUci: deviation.moveUci,
        },
        evidenceRefs: [theoryEvidenceRef("off-objective-deviation")] as const,
      }));
    });
    const boundary = pack.checkpoints.find(
      (checkpoint) =>
        !("windowOpens" in checkpoint.trigger) &&
        "atAuthoredBoundary" in checkpoint.trigger,
    );
    const resolution: readonly ObjectiveTransitionRule[] =
      boundary === undefined
        ? []
        : [{
            id: `theory-boundary-${boundary.id}`,
            from: "active",
            to: "preserved",
            when: { type: "checkpointReachedHere", checkpointId: boundary.id },
            evidenceRefs: [packEvidenceRef(boundary.id)],
          }];
    const authored = Array.isArray(raw)
      ? raw.flatMap((condition, index) => conditionRules(condition, index, false))
      : [];
    return [...degraded, ...resolution, ...authored];
  }
  if (!Array.isArray(raw)) return [];
  const outcomeObjective = ["win", "hold", "save", "resist"].includes(
    pack.objective.type,
  );
  if (!outcomeObjective) {
    return raw.flatMap((condition, index) =>
      conditionRules(condition, index, false),
    );
  }

  const allStates: readonly ObjectiveState[] = ["active", "preserved", "degraded"];
  const automatic: ObjectiveTransitionRule[] = [];
  const outcomeRule = (
    result: "win" | "loss" | "draw",
    to: "achieved" | "failed",
    predicate: ObjectivePredicate = { type: "outcomeReached", result },
  ): void => {
    for (const from of allStates) {
      automatic.push({
        id: `outcome-${result}-${from}`,
        from,
        to,
        when: predicate,
        evidenceRefs: [rulesEvidenceRef(`result-${result}`)],
      });
    }
  };
  outcomeRule("win", "achieved");
  outcomeRule("draw", pack.objective.type === "win" ? "failed" : "achieved");
  if (pack.objective.type === "resist") {
    const resolveAt = pack.objective.grading?.resolveAt;
    if (resolveAt?.kind === "checkpoint") {
      outcomeRule("loss", "achieved", {
        type: "all",
        predicates: [
          { type: "outcomeReached", result: "loss" },
          { type: "checkpointReached", checkpointId: resolveAt.checkpointId },
        ],
      });
    }
  }
  outcomeRule("loss", "failed");

  const degraded = raw.flatMap((condition, index) =>
    condition.to === "degraded" ? conditionRules(condition, index, true) : [],
  );
  const resolution: ObjectiveTransitionRule[] = [];
  const resolveAt = pack.objective.grading?.resolveAt;
  if (resolveAt?.kind === "checkpoint") {
    resolution.push({
      id: `outcome-resolution-${resolveAt.checkpointId}`,
      from: "active",
      to: "preserved",
      when: {
        type: "checkpointReachedHere",
        checkpointId: resolveAt.checkpointId,
      },
      evidenceRefs: [packEvidenceRef(resolveAt.checkpointId)],
    });
  }
  const remaining = raw.flatMap((condition, index) =>
    condition.to !== "degraded" ? conditionRules(condition, index, true) : [],
  );
  return [...automatic, ...degraded, ...resolution, ...remaining];
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
