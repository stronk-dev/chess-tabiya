import type {
  CheckpointDefinition,
  DrillPackDefinition,
  SimpleTrigger,
  SuccessCondition,
  TimingWindowDefinition,
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
  tempoEvidenceRef,
  tempoMovesFromRun,
  windowStates,
  legIndexAt,
  reachCheckpoint,
  transitionObjective,
  transposeKey,
  structuralFeatureKinds,
  transitionFeatureKinds,
  type DrillRun,
  type FenPredicate,
  type MaterialBalancePredicate,
  type MutationResult,
  type ObjectivePredicate,
  type ObjectiveState,
  type ObjectiveTransitionRule,
  type StructuralExpression,
} from "@chess-tabiya/runtime";

export type PlanSignatureResolver = (planClassId: string) => StructuralExpression | null | undefined;

export interface PlanShapeLookup {
  get(id: string): { readonly document: { readonly plans: readonly { readonly id: string; readonly success: { readonly note: string; readonly signature: StructuralExpression | null } }[] } } | undefined;
}

export function planSignatureResolver(pack: DrillPackDefinition, shapes?: PlanShapeLookup): PlanSignatureResolver {
  return (planClassId) => {
    const planClass = pack.planClasses?.find((candidate) => candidate.id === planClassId);
    if (planClass?.shapePlan === undefined) return undefined;
    return shapes?.get(planClass.shapePlan.shape)?.document.plans.find((plan) => plan.id === planClass.shapePlan!.plan)?.success.signature;
  };
}

export class PackCompileError extends Error {
  readonly code: string;
  readonly pointer: string;

  constructor(code: string, pointer: string, message: string) {
    super(message);
    this.name = "PackCompileError";
    this.code = code;
    this.pointer = pointer;
  }
}

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

function runAtNode(run: DrillRun, nodeId: string): DrillRun {
  const node = run.nodes.find((candidate) => candidate.id === nodeId);
  if (node === undefined) return run;
  return { ...run, activeCursor: { nodeId, branchId: node.branchId } };
}

function timingState(
  pack: DrillPackDefinition,
  run: DrillRun,
  window: TimingWindowDefinition,
) {
  const path = tempoMovesFromRun(run);
  return windowStates(
    [window],
    path,
    pack.start.side,
    (trigger, index) => {
      const nodeId = path[index]?.nodeId;
      return nodeId !== undefined && simpleTriggerMatches(pack, runAtNode(run, nodeId), trigger);
    },
  )[0]!;
}

export function checkpointMatches(
  pack: DrillPackDefinition,
  run: DrillRun,
  checkpoint: CheckpointDefinition,
): boolean {
  const trigger = checkpoint.trigger;
  if ("atWindow" in trigger) {
    const window = pack.timingWindows?.find(
      (candidate) => candidate.id === trigger.atWindow.windowId,
    );
    if (window === undefined) return false;
    const state = timingState(pack, run, window);
    return "verdict" in trigger.atWindow
      ? state.verdict === trigger.atWindow.verdict
      : state.spend >= trigger.atWindow.spendAtLeast;
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

function compiledOpeningTrigger(
  pack: DrillPackDefinition,
  window: TimingWindowDefinition,
): ObjectivePredicate | undefined {
  if (!("onTrigger" in window.opens)) return undefined;
  const trigger = window.opens.onTrigger;
  if ("atStart" in trigger) return { type: "nodePly", ply: 0 };
  if ("atPly" in trigger) return { type: "nodePly", ply: trigger.atPly };
  if ("atSpineNode" in trigger) {
    const key = deviationAnchors(pack).get(trigger.atSpineNode);
    if (key === undefined) {
      throw new PackCompileError(
        "TIMING_WINDOW_UNKNOWN_REFERENCE",
        "/timingWindows",
        `unknown opening spine node ${trigger.atSpineNode}`,
      );
    }
    return { type: "fenPredicate", predicate: { type: "transposeKey", value: key } };
  }
  if ("atAuthoredBoundary" in trigger) {
    const anchors = deviationAnchors(pack);
    return {
      type: "outsideAuthoredBoundary",
      ...(pack.authoredBoundary?.plyHorizon === undefined
        ? {}
        : { plyHorizon: pack.authoredBoundary.plyHorizon }),
      spineTransposeKeys: (pack.authoredBoundary?.spineNodeIds ?? []).flatMap(
        (id) => anchors.get(id) ?? [],
      ),
      fenPredicates: (pack.authoredBoundary?.fenPredicates ?? []) as FenPredicate[],
    };
  }
  if ("fenPredicate" in trigger) {
    return { type: "fenPredicate", predicate: trigger.fenPredicate as FenPredicate };
  }
  return {
    type: "materialBalance",
    ...(trigger.materialBalance as Omit<MaterialBalancePredicate, "type">),
  };
}

function timingPredicate(
  pack: DrillPackDefinition,
  window: TimingWindowDefinition,
  verdict: import("@chess-tabiya/runtime").TempoVerdict,
): ObjectivePredicate {
  const openingTrigger = compiledOpeningTrigger(pack, window);
  return {
    type: "timingWindow",
    window,
    learner: pack.start.side,
    verdict,
    ...(openingTrigger === undefined ? {} : { openingTrigger }),
  };
}

function successPredicate(
  pack: DrillPackDefinition,
  condition: SuccessCondition,
  pointer: string,
  resolvePlanSignature?: PlanSignatureResolver,
): ObjectivePredicate {
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
  if (condition.kind === "timing_window") {
    const window = pack.timingWindows?.find((candidate) => candidate.id === condition.windowId);
    if (window === undefined) {
      throw new PackCompileError(
        "TIMING_WINDOW_UNKNOWN_REFERENCE",
        `${pointer}/windowId`,
        `unknown timing window ${condition.windowId}`,
      );
    }
    return timingPredicate(pack, window, condition.verdict);
  }
  if (condition.kind === "plan_consequence") {
    const signature = resolvePlanSignature?.(condition.planClassId);
    if (signature == null) throw new PackCompileError("PLAN_CONSEQUENCE_UNRESOLVED", `${pointer}/planClassId`, `plan consequence ${condition.planClassId} has no resolved structural signature`);
    return { type: "fenPredicate", predicate: { type: "structuralFeature", feature: signature } };
  }
  if (condition.kind === "transition_feature") {
    return { type: "transitionFeature", transition: condition.transition };
  }
  const exhaustive: never = condition;
  throw new PackCompileError(
    "SUCCESS_CONDITION_KIND_UNRECOGNISED",
    `${pointer}/kind`,
    `unhandled success condition: ${JSON.stringify(exhaustive)}`,
  );
}

function conditionEvidenceRefs(
  condition: SuccessCondition,
  pointer: string,
  resolvePlanSignature?: PlanSignatureResolver,
): readonly [string, ...string[]] {
  if (condition.kind === "reach_checkpoint") {
    return [packEvidenceRef(condition.checkpointId)];
  }
  if (condition.kind === "outcome") {
    return [rulesEvidenceRef(`result-${condition.result}`)];
  }
  if (condition.kind === "material_balance") return [rulesEvidenceRef("material")];
  if (condition.kind === "rules_fact") {
    try {
      return [rulesEvidenceRef(condition.fact)];
    } catch (error) {
      throw new PackCompileError(
        "EVIDENCE_FACT_UNSUPPORTED",
        `${pointer}/fact`,
        error instanceof Error ? error.message : String(error),
      );
    }
  }
  if (condition.kind === "timing_window") {
    return [tempoEvidenceRef(condition.windowId, condition.verdict)];
  }
  if (condition.kind === "plan_consequence") {
    const signature = resolvePlanSignature?.(condition.planClassId);
    if (signature == null) throw new PackCompileError("PLAN_CONSEQUENCE_UNRESOLVED", `${pointer}/planClassId`, `plan consequence ${condition.planClassId} has no resolved structural signature`);
    return [`planClass#${condition.planClassId}`, ...structuralFeatureKinds(signature).map((kind) => rulesEvidenceRef(`structure-${kind.replaceAll("_", "-")}` as Parameters<typeof rulesEvidenceRef>[0]))];
  }
  if (condition.kind === "transition_feature") {
    const references = transitionFeatureKinds(condition.transition).map((kind) =>
      kind.startsWith("structure:")
        ? rulesEvidenceRef(`structure-${kind.slice("structure:".length).replaceAll("_", "-")}` as Parameters<typeof rulesEvidenceRef>[0])
        : rulesEvidenceRef(`transition-${kind.replaceAll("_", "-")}` as Parameters<typeof rulesEvidenceRef>[0]),
    );
    if (references.length === 0) {
      throw new PackCompileError("TRANSITION_CONDITION_HAS_NO_FEATURE", `${pointer}/transition`, "transition success condition has no feature leaf");
    }
    return references as [string, ...string[]];
  }
  const references = structuralFeatureKinds(condition.feature).map((kind) =>
    rulesEvidenceRef(`structure-${kind.replaceAll("_", "-")}` as Parameters<typeof rulesEvidenceRef>[0]),
  );
  if (references.length === 0) {
    throw new PackCompileError(
      "STRUCTURAL_CONDITION_HAS_NO_FEATURE",
      `${pointer}/feature`,
      "structural success condition has no feature leaf: an expression built only from pieceOnSquare or quantified-over-piece nodes derives no rules evidence reference",
    );
  }
  return references as [string, ...string[]];
}

function conditionRules(
  pack: DrillPackDefinition,
  condition: SuccessCondition,
  index: number,
  outcomeObjective: boolean,
  pointerPrefix: string,
  resolvePlanSignature?: PlanSignatureResolver,
): readonly ObjectiveTransitionRule[] {
  const pointer = `${pointerPrefix}/successConditions/${index}`;
  const predicate = successPredicate(pack, condition, pointer, resolvePlanSignature);
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
    evidenceRefs: conditionEvidenceRefs(condition, pointer, resolvePlanSignature),
  }));
}

export function objectiveRules(
  pack: DrillPackDefinition,
  objective: DrillPackDefinition["objective"] = pack.objective,
  pointerPrefix = "/objective",
  resolvePlanSignature?: PlanSignatureResolver,
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
        !("atWindow" in checkpoint.trigger) &&
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
      ? raw.flatMap((condition, index) => conditionRules(pack, condition, index, false, pointerPrefix, resolvePlanSignature))
      : [];
    return [...degraded, ...resolution, ...authored];
  }
  if (objective.type === "preserve_plan_window") {
    const defaults = (pack.timingWindows ?? []).flatMap((window, index) => {
      const rules: ObjectiveTransitionRule[] = [];
      for (const verdict of ["too_slow", "premature", "over_budget"] as const) {
        for (const from of ["active", "preserved"] as const) {
          rules.push({
            id: `tempo-${index}-${verdict}-${from}`,
            from,
            to: "degraded",
            when: timingPredicate(pack, window, verdict),
            evidenceRefs: [tempoEvidenceRef(window.id, verdict)],
          });
        }
      }
      if (window.gradeOutpaced === true) {
        for (const from of ["active", "preserved"] as const) {
          rules.push({
            id: `tempo-${index}-outpaced-${from}`,
            from,
            to: "degraded",
            when: timingPredicate(pack, window, "outpaced"),
            evidenceRefs: [tempoEvidenceRef(window.id, "outpaced")],
          });
        }
      }
      for (const from of ["active", "degraded"] as const) {
        rules.push({
          id: `tempo-${index}-in-time-${from}`,
          from,
          to: "preserved",
          when: timingPredicate(pack, window, "in_time"),
          evidenceRefs: [tempoEvidenceRef(window.id, "in_time")],
        });
      }
      return rules;
    });
    const authored = Array.isArray(raw)
      ? raw.flatMap((condition, index) =>
          conditionRules(pack, condition, index, false, pointerPrefix, resolvePlanSignature))
      : [];
    return [...defaults, ...authored];
  }
  const outcomeObjective = ["win", "hold", "save", "resist"].includes(
    objective.type,
  );
  if (!outcomeObjective) {
    if (!Array.isArray(raw)) return [];
    return raw.flatMap((condition, index) =>
      conditionRules(pack, condition, index, false, pointerPrefix, resolvePlanSignature),
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
    condition.to === "degraded" ? conditionRules(pack, condition, index, true, pointerPrefix, resolvePlanSignature) : [],
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
    condition.to !== "degraded" ? conditionRules(pack, condition, index, true, pointerPrefix, resolvePlanSignature) : [],
  );
  return [...automatic, ...degraded, ...resolution, ...remaining];
}

export function orchestratePackStart(
  pack: DrillPackDefinition,
  initial: DrillRun,
  _resolvePlanSignature?: PlanSignatureResolver,
): MutationResult {
  let run = initial;
  const root = run.nodes.find((node) => node.id === run.activeCursor.nodeId)!;
  for (const checkpoint of pack.checkpoints) {
    if (
      !("atWindow" in checkpoint.trigger) &&
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
  resolvePlanSignature?: PlanSignatureResolver,
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
    run = evaluateObjective(run, objectiveRules(pack, pack.objective, "/objective", resolvePlanSignature), active.createdAt).run;
  } else {
    const parentId = active.parentId;
    if (parentId == null) throw new TypeError("Committed trajectory node has no parent");
    const outgoing = legIndexAt(pack, before, parentId);
    run = evaluateObjective(run, objectiveRules(pack, pack.legs[outgoing]!.objective, `/legs/${outgoing}/objective`, resolvePlanSignature), active.createdAt).run;
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
