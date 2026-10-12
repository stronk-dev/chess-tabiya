import { PRESET_IDS, presetDeclaration, workflowContextPolicy, type PresetId, type WorkflowContextId } from "@chess-tabiya/runtime/client";

// Presentation only: ARR-a21 orders ordinary choices by disclosure, not registry id.
// Campaign kit is the workflow-specific default, not another rung on that ladder.
const DISPLAY_RANK: Readonly<Record<PresetId, number>> = { campaign_kit: 0, quiet: 1, theory_only: 2, guided: 3, support: 4, analysis: 5 };

export function offeredPresetChoices(context: WorkflowContextId): readonly ReturnType<typeof presetDeclaration>[] {
  const allowed = workflowContextPolicy(context).allowedPresets;
  return [...allowed].sort((left, right) => DISPLAY_RANK[left] - DISPLAY_RANK[right]).map(presetDeclaration);
}

/** Context policy, not a fabricated suppression of a choice the learner never requested. */
export function helpStyleBoundary(context: WorkflowContextId): string | undefined {
  return context === "match"
    ? "Only Quiet is available in a match. Legal moves stay visible; chess guidance is not available during match play."
    : undefined;
}

/** Explain omitted ordinary choices once, without confusing policy with source health. */
export function unavailablePresetNotice(context: WorkflowContextId): string | undefined {
  const boundary = helpStyleBoundary(context);
  if (boundary !== undefined) return boundary;
  const allowed = workflowContextPolicy(context).allowedPresets;
  // Campaign kit belongs only to Campaign and is not a universally selectable style.
  const omitted = PRESET_IDS.filter(id => id !== "campaign_kit" && !allowed.includes(id))
    .sort((left, right) => DISPLAY_RANK[left] - DISPLAY_RANK[right]);
  return omitted.length === 0 ? undefined
    : `Not offered in this activity: ${omitted.map(id => presetDeclaration(id).label).join(", ")}. These activity limits also apply to Advanced support controls.`;
}
