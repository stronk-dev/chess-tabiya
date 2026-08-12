import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import {
  resistanceOnPath,
  type DrillRun,
  type ObjectiveState,
  type SelectionEngineIdentity,
} from "@chess-tabiya/runtime";

type ProjectedAssessment =
  | { readonly kind: "authored"; readonly note: string }
  | {
      readonly kind: "syzygy";
      readonly category: "win" | "loss" | "draw";
      readonly pieceCount: number;
      readonly sourceId: "syzygy";
      readonly retrievedAt: string;
    };

export interface ProjectedGrading {
  readonly assessedBy: ProjectedAssessment;
  readonly resolveAt:
    | { readonly kind: "checkpoint"; readonly checkpointId: string }
    | { readonly kind: "terminal" };
  readonly grounding: "ledger_verified" | "unverified";
}

export function projectedGrading(
  pack: DrillPackDefinition,
): ProjectedGrading | undefined {
  const grading = pack.objective.grading as
    | (DrillPackDefinition["objective"]["grading"] & {
        readonly grounding?: "ledger_verified" | "unverified";
      })
    | undefined;
  if (grading === undefined) return undefined;
  return {
    ...grading,
    grounding: grading.grounding ?? "unverified",
  } as ProjectedGrading;
}

export function assessmentSentence(grading: ProjectedGrading): string {
  if (
    grading.assessedBy.kind === "syzygy" &&
    grading.grounding === "ledger_verified"
  ) {
    return `Root assessment: ${grading.assessedBy.category} — Syzygy tablebase, ${grading.assessedBy.pieceCount} pieces, retrieved ${grading.assessedBy.retrievedAt}. Exact.`;
  }
  if (grading.assessedBy.kind === "authored") {
    return `Root assessment (authored, unproved): ${grading.assessedBy.note}`;
  }
  return "Root assessment (authored, unproved): A tablebase result is declared but no matching evidence record backs it, so it is shown as a claim.";
}

function engineName(identity: SelectionEngineIdentity): string {
  const model = identity.modelId === undefined ? "" : `, model ${identity.modelId}`;
  return `${identity.name} (${identity.id} v${identity.version}${model})`;
}

export function resistanceSentences(run: DrillRun, nodeId: string): readonly string[] {
  const resistance = resistanceOnPath(run, nodeId);
  const requested = resistance.requested;
  const target = requested.targetElo === undefined ? "" : `, target Elo ${requested.targetElo}`;
  const lines = [`Requested resistance: ${requested.mode}${target} — the pack's request.`];
  if (resistance.engines.length === 0) {
    return [...lines, "No opponent move has been played yet.", "Not perfect play."];
  }
  if (resistance.engines.length === 1) {
    lines.push(`Moves played by ${engineName(resistance.engines[0]!.engine)}.`);
  } else {
    for (const entry of resistance.engines) {
      lines.push(`${engineName(entry.engine)}: ${entry.plyCount} plies.`);
    }
    lines.push("This path faced more than one engine.");
  }
  lines.push(
    "The run records which engine played, not which policy it applied, so this names the engine, not proof that the requested policy produced these moves.",
    "Not perfect play.",
  );
  return lines;
}

export function objectiveGradeSentence(
  objectiveType: string,
  state: ObjectiveState,
): string {
  return state === "active"
    ? `Objective: ${objectiveType} — unresolved`
    : `Objective: ${objectiveType} — ${state}`;
}

export function checkpointResolutionSentence(
  checkpointLabel: string,
  state: ObjectiveState,
): string {
  if (state === "preserved") {
    return `You reached ${checkpointLabel} without conceding the result. That is the end of this drill, not a proof of the position.`;
  }
  if (state === "degraded") {
    return `You reached ${checkpointLabel}, but the objective had already been degraded on this path. That is a grade of this attempt, not a verdict on the position.`;
  }
  return objectiveGradeSentence("outcome", state);
}
