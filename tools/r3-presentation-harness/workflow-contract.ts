// DISPOSABLE research harness — platform-alignment R3. Not production code.
import type { GuidanceModuleId } from "./module-contract.js";

export type WorkflowId =
  | "just_play"
  | "guided_rehearsal"
  | "learn_position"
  | "review_retry"
  | "analyze_freely"
  | "campaign";

export type PresetId = "quiet" | "guided" | "theory_only" | "support" | "analysis";

export interface WorkflowPreset {
  readonly id: PresetId;
  readonly label: string;
  readonly promise: string;
  readonly modules: readonly GuidanceModuleId[];
}

export interface WorkflowContract {
  readonly id: WorkflowId;
  readonly label: string;
  readonly defaultPreset: PresetId;
  readonly allowedPresets: readonly PresetId[];
  readonly ceiling: readonly GuidanceModuleId[];
}

export const PRESETS: readonly WorkflowPreset[] = Object.freeze([
  {
    id: "quiet",
    label: "Quiet",
    promise: "Legal interaction stays visible; no chess guidance appears unless requested later.",
    modules: ["rules_floor"],
  },
  {
    id: "guided",
    label: "Guide me",
    promise: "After commitment, show a small consequence nudge and let the learner request progressive help.",
    modules: ["rules_floor", "sight_on_request", "postcommit_nudge", "guided_hint", "compare_coach", "theory_breadcrumb"],
  },
  {
    id: "theory_only",
    label: "Theory only",
    promise: "Show cited applicable theory without evaluation, candidate moves or a principal variation.",
    modules: ["rules_floor", "theory_breadcrumb"],
  },
  {
    id: "support",
    label: "Support",
    promise: "Explicitly enable staged-move risk warnings; never promise or reveal the best move.",
    modules: ["rules_floor", "sight_on_request", "blunder_prevention", "postcommit_nudge", "guided_hint", "theory_breadcrumb"],
  },
  {
    id: "analysis",
    label: "Analyze",
    promise: "Expose attributed raw evidence, evaluations, candidates and lines in an explicit inspector.",
    modules: ["rules_floor", "review_map", "compare_coach", "theory_breadcrumb", "full_inspector"],
  },
]);

const EVERY_MODULE: readonly GuidanceModuleId[] = [
  "rules_floor",
  "sight_on_request",
  "blunder_prevention",
  "postcommit_nudge",
  "guided_hint",
  "compare_coach",
  "theory_breadcrumb",
  "review_map",
  "full_inspector",
];

export const WORKFLOWS: readonly WorkflowContract[] = Object.freeze([
  { id: "just_play", label: "Just Play", defaultPreset: "quiet", allowedPresets: ["quiet", "guided", "theory_only", "support"], ceiling: EVERY_MODULE },
  { id: "guided_rehearsal", label: "Guided Rehearsal", defaultPreset: "guided", allowedPresets: ["quiet", "guided", "theory_only"], ceiling: EVERY_MODULE.filter((id) => id !== "blunder_prevention" && id !== "full_inspector") },
  { id: "learn_position", label: "Learn This Position", defaultPreset: "theory_only", allowedPresets: ["quiet", "guided", "theory_only"], ceiling: EVERY_MODULE.filter((id) => id !== "blunder_prevention") },
  { id: "review_retry", label: "Review & Retry", defaultPreset: "guided", allowedPresets: ["quiet", "guided", "theory_only", "analysis"], ceiling: EVERY_MODULE.filter((id) => id !== "blunder_prevention") },
  { id: "analyze_freely", label: "Analyze Freely", defaultPreset: "analysis", allowedPresets: ["analysis", "theory_only"], ceiling: EVERY_MODULE },
  { id: "campaign", label: "Campaign", defaultPreset: "guided", allowedPresets: ["quiet", "guided", "theory_only"], ceiling: EVERY_MODULE.filter((id) => id !== "blunder_prevention" && id !== "full_inspector" && id !== "review_map") },
]);

export interface CompiledWorkflow {
  readonly workflowId: WorkflowId;
  readonly presetId: PresetId;
  readonly modules: readonly GuidanceModuleId[];
  readonly suppressedByCeiling: readonly GuidanceModuleId[];
}

export function compileWorkflow(workflow: WorkflowContract, preset: WorkflowPreset): CompiledWorkflow {
  if (!workflow.allowedPresets.includes(preset.id)) throw new Error(`${preset.id} is not allowed in ${workflow.id}`);
  const ceiling = new Set(workflow.ceiling);
  const modules = preset.modules.filter((id) => ceiling.has(id));
  const suppressedByCeiling = preset.modules.filter((id) => !ceiling.has(id));
  return Object.freeze({ workflowId: workflow.id, presetId: preset.id, modules: Object.freeze(modules), suppressedByCeiling: Object.freeze(suppressedByCeiling) });
}

export function moduleDisposition(moduleId: GuidanceModuleId): "normal" | "advanced" | "inspector" | "operator" {
  if (moduleId === "rules_floor" || moduleId === "postcommit_nudge" || moduleId === "theory_breadcrumb") return "normal";
  if (moduleId === "sight_on_request" || moduleId === "blunder_prevention" || moduleId === "guided_hint" || moduleId === "compare_coach") return "advanced";
  if (moduleId === "review_map" || moduleId === "full_inspector") return "inspector";
  return "operator";
}
