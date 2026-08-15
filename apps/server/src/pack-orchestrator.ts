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
  legIndexAt,
  reachCheckpoint,
  transitionObjective,
  transposeKey,
  structuralFeatureKinds,
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
  if ("atStart" in trigger) return node.parentId === null;
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

function successPredicate(condition: SuccessCondition): ObjectivePredicate {
  if (condition.kind === "reach_checkpoint") {
    return { type: "checkpointReached", checkpointId: condition.checkpointId };
  }
  if (condition.kind === "outcome") {
    return {
      type: "outcomeReached",
      result: condition.result,
    };
  }
  if (condition.kind === "material_balance") {
    return {
      type: "materialBalance",
      perspective: condition.perspective,
      comparison: condition.comparison,
      value: condition.value,
    };
  }
  if (condition.kind === "rules_fact") {
    return {
      type: "rulesFact",
      fact: condition.fact,
      ...(condition.winner === undefined
        ? {}
        : { winner: condition.winner as "white" | "black" }),
    };
  }
  if (condition.kind === "structural_feature") {
    return { type: "fenPredicate", predicate: { type: "structuralFeature", feature: condition.feature } };
  }
  const exhaustive: never = condition;
  throw new TypeError(`Unhandled success condition: ${JSON.stringify(exhaustive)}`);
}

function conditionEvidenceRefs(condition: SuccessCondition): readonly [string, ...string[]] {
  if (condition.kind === "reach_checkpoint") {
    return [packEvidenceRef(condition.checkpointId)];
  }
  if (condition.kind === "outcome") {
    return [rulesEvidenceRef(`result-${condition.result}`)];
  }
  if (condition.kind === "material_balance") return [rulesEvidenceRef("material")];
  if (condition.kind === "rules_fact") return [rulesEvidenceRef(condition.fact)];
  const references = structuralFeatureKinds(condition.feature).map((kind) =>
    rulesEvidenceRef(`structure-${kind.replaceAll("_", "-")}` as Parameters<typeof rulesEvidenceRef>[0]),
  );
  if (references.length === 0) throw new TypeError("Structural success condition has no feature leaf");
  return references as [string, ...string[]];
}

function conditionRules(
  condition: SuccessCondition,
  index: number,
  outcomeObjective: boolean,
): readonly ObjectiveTransitionRule[] {
  const predicate = successPredicate(condition);
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
    evidenceRefs: conditionEvidenceRefs(condition),
  }));
}

export function objectiveRules(
  pack: DrillPackDefinition,
  objective: DrillPackDefinition["objective"] = pack.objective,
): readonly ObjectiveTransitionRule[] {
  const raw = objective.successConditions;
  if (objective.type === "run_trajectory") return [];
  if (objective.type === "follow_theory") {
    const anchors = deviationAnchors(pack);
    const degraded = (pack.deviations ?? []).flatMap((deviation, index) => {
      if (!deviation.offObjective) return [];
      const fromTransposeKey =
        "spineNodeId" in deviation.at
          ? anchors.get(deviation.at.spineNodeId)
          : "atStart" in deviation.at
            ? transposeKey(pack.start.fen)
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
  const outcomeObjective = ["win", "hold", "save", "resist"].includes(
    objective.type,
  );
  if (!outcomeObjective) {
    if (!Array.isArray(raw)) return [];
    return raw.flatMap((condition, index) =>
      conditionRules(condition, index, false),
    );
  }

  const conditions = Array.isArray(raw) ? raw : [];

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
  outcomeRule("draw", objective.type === "win" ? "failed" : "achieved");
  if (objective.type === "resist") {
    const resolveAt = objective.grading?.resolveAt;
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

  const degraded = conditions.flatMap((condition, index) =>
    condition.to === "degraded" ? conditionRules(condition, index, true) : [],
  );
  const resolution: ObjectiveTransitionRule[] = [];
  const resolveAt = objective.grading?.resolveAt;
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
  const remaining = conditions.flatMap((condition, index) =>
    condition.to !== "degraded" ? conditionRules(condition, index, true) : [],
  );
  return [...automatic, ...degraded, ...resolution, ...remaining];
}

export function orchestratePackStart(
  pack: DrillPackDefinition,
  initial: DrillRun,
): MutationResult {
  let run = initial;
  const root = run.nodes.find((node) => node.id === run.activeCursor.nodeId)!;
  for (const checkpoint of pack.checkpoints) {
    if (
      !("windowOpens" in checkpoint.trigger) &&
      "atStart" in checkpoint.trigger &&
      checkpointMatches(pack, run, checkpoint)
    ) {
      run = reachCheckpoint(run, checkpoint.id, root.createdAt).run;
    }
  }
  return Object.freeze({
    run,
    emitted: Object.freeze(run.events.slice(initial.events.length)),
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
  if (pack.legs === undefined) {
    run = evaluateObjective(run, objectiveRules(pack), active.createdAt).run;
  } else {
    const parentId = active.parentId;
    if (parentId == null) throw new TypeError("Committed trajectory node has no parent");
    const outgoing = legIndexAt(pack, before, parentId);
    run = evaluateObjective(run, objectiveRules(pack, pack.legs[outgoing]!.objective), active.createdAt).run;
    const incoming = legIndexAt(pack, run, active.id);
    if (incoming > outgoing) {
      const state = run.nodes.find((node) => node.id === active.id)!.objectiveState;
      if (state === "preserved" || state === "degraded") {
        run = transitionObjective(
          run,
          "active",
          [packEvidenceRef(pack.legs[incoming]!.entryCheckpointId!)],
          active.createdAt,
        ).run;
      }
    }
  }
  return Object.freeze({
    run,
    emitted: Object.freeze(run.events.slice(before.events.length)),
  });
}
