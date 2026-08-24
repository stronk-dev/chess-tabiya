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
    }
  | {
      readonly kind: "engine";
      readonly score:
        | { readonly kind: "cp"; readonly centipawns: number }
        | { readonly kind: "mate"; readonly movesToMate: number };
      readonly perspective: "white";
      readonly depth: number;
      readonly engineId: string;
      readonly engineVersion: string;
      readonly sourceId: string;
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
  if (grading.assessedBy.kind === "engine") {
    if (grading.grounding !== "ledger_verified") return "Root assessment (declared, unproved): an engine evaluation is declared but no matching evidence record backs it, so it is shown as a claim.";
    const score = grading.assessedBy.score.kind === "cp"
      ? `${grading.assessedBy.score.centipawns >= 0 ? "+" : ""}${(grading.assessedBy.score.centipawns / 100).toFixed(2)}`
      : `mate ${grading.assessedBy.score.movesToMate}`;
    return `Root assessment: ${score} for White — ${grading.assessedBy.engineId} ${grading.assessedBy.engineVersion} at depth ${grading.assessedBy.depth}, retrieved ${grading.assessedBy.retrievedAt}. An engine evaluation at a fixed depth, not a proof.`;
  }
  return "Root assessment (authored, unproved): A tablebase result is declared but no matching evidence record backs it, so it is shown as a claim.";
}

function engineName(identity: SelectionEngineIdentity): string {
  const model = identity.modelId === undefined ? "" : `, model ${identity.modelId}`;
  const band = identity.eloHonored !== true
    ? ""
    : identity.eloApplied === undefined
      ? ", band not recorded"
      : `, band ${identity.eloApplied}`;
  return `${identity.name} (${identity.id} v${identity.version}${model}${band})`;
}

function engineIdentityKey(identity: SelectionEngineIdentity): string {
  return JSON.stringify([
    identity.id,
    identity.name,
    identity.version,
    identity.modelId ?? null,
    identity.containerDigest ?? null,
    identity.seedHonored,
  ]);
}

export function humanModelBandSentence(page: { readonly engine: SelectionEngineIdentity; readonly targetElo: number | null }): string {
  const { engine, targetElo } = page;
  if (targetElo !== null) {
    return engine.eloHonored === true && engine.eloApplied === targetElo
      ? `${engine.name} recorded the requested Elo ${targetElo} band as applied.`
      : `${engine.name}: Target Elo ${targetElo} was requested but is not recorded as applied.`;
  }
  return engine.eloApplied === undefined
    ? `${engine.name}: no rating band was requested or recorded.`
    : `${engine.name}: no rating band was requested; the engine recorded Elo ${engine.eloApplied} as applied.`;
}

const RESISTANCE_MODE_LABELS = Object.freeze({
  human_common: "Human-model replies",
  theory_strict: "Authored theory replies",
  strong_engine: "Strong engine",
  perfect_tablebase: "Perfect tablebase",
  practical_resistance: "Practical tablebase resistance",
  enumerated: "Enumerated group reply",
} as const);

export function resistanceModeLabel(mode: keyof typeof RESISTANCE_MODE_LABELS): string {
  return RESISTANCE_MODE_LABELS[mode];
}

export function resistanceSentences(run: DrillRun, nodeId: string, pack?: DrillPackDefinition): readonly string[] {
  const resistance = resistanceOnPath(run, nodeId, pack);
  const requested = resistance.requested;
  const target = requested.targetElo === undefined ? "" : `, target Elo ${requested.targetElo}`;
  const lines = [`Requested resistance: ${resistanceModeLabel(requested.mode)}${target} — the pack's request.`];
  for (const leg of resistance.requestedByLeg ?? []) {
    const legTarget = leg.policy.targetElo === undefined ? "" : `, target Elo ${leg.policy.targetElo}`;
    lines.push(`Leg ${leg.legId}: requested ${resistanceModeLabel(leg.policy.mode)}${legTarget}; ${leg.plyCount} opponent plies recorded.`);
  }
  if (resistance.engines.length === 0) {
    return [
      ...lines,
      "No opponent move has been played yet.",
      ...(requested.mode === "theory_strict"
        ? ["Authored theory replies exist only inside this pack's spine. The authored horizon and the available replies can end at different moves."]
        : []),
      "Not perfect play.",
    ];
  }
  if (resistance.applied.length > 0) {
    const total = resistance.applied.reduce((sum, entry) => sum + entry.plyCount, 0);
    lines.push(
      resistance.applied.length === 1
        ? `Applied resistance: ${resistanceModeLabel(resistance.applied[0]!.mode)} — recorded per move by the selector.`
        : `Applied resistance: ${resistance.applied.map((entry) => `${resistanceModeLabel(entry.mode)} for ${entry.plyCount} plies`).join(", ")} — recorded per move by the selector.`,
    );
    void total;
  }
  if (resistance.unknownPlyCount > 0) {
    lines.push(`${resistance.unknownPlyCount} of these plies predate policy recording.`);
  }
  if (resistance.engines.length === 1) {
    lines.push(`Moves played by ${engineName(resistance.engines[0]!.engine)}.`);
  } else {
    for (const entry of resistance.engines) {
      lines.push(`${engineName(entry.engine)}: ${entry.plyCount} plies.`);
    }
    const identities = new Set(resistance.engines.map((entry) => engineIdentityKey(entry.engine)));
    lines.push(identities.size === 1
      ? "This path faced more than one engine configuration."
      : "This path faced more than one engine.");
  }
  if (requested.targetElo !== undefined) {
    const applied = resistance.engines.some((entry) => entry.engine.eloApplied === requested.targetElo);
    lines.push(applied
      ? `The engine advertised its rating-band option and recorded target Elo ${requested.targetElo} as applied.`
      : `Target Elo ${requested.targetElo} was requested but is not recorded as applied.`);
  } else {
    const appliedBands = [...new Set(resistance.engines.flatMap((entry) =>
      entry.engine.eloApplied === undefined ? [] : [entry.engine.eloApplied],
    ))];
    if (appliedBands.length > 0) {
      lines.push(`The session did not choose a rating band; the engine recorded ${appliedBands.map((band) => `Elo ${band}`).join(", ")} as applied.`);
    }
  }
  if (resistance.unknownPlyCount > 0) {
    lines.push("The run records which engine played, not which policy it applied, so this names the engine, not proof that the requested policy produced these moves.");
  }
  if (requested.mode === "theory_strict") {
    lines.push("Authored theory replies exist only inside this pack's spine. The authored horizon and the available replies can end at different moves.");
  }
  lines.push("Not perfect play.");
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
