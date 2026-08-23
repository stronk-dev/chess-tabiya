import type { RunFeedbackPolicy } from "./types.js";
import { MODULE_IDS, type ModuleId } from "./module-contract.js";
import type { LiveSessionKind, RunSessionKind } from "./types.js";

export const WORKFLOW_CONTEXTS = Object.freeze([
  "pack", "position", "imported", "match", "stream", "academy", "onramp", "campaign",
] as const);
export type WorkflowContextId = (typeof WORKFLOW_CONTEXTS)[number];

export const PRESET_IDS = Object.freeze([
  "quiet", "guided", "theory_only", "support", "analysis",
] as const);
export type PresetId = (typeof PRESET_IDS)[number];

export interface PresetDeclaration {
  readonly id: PresetId;
  readonly label: string;
  readonly promise: string;
  readonly modules: readonly ModuleId[];
  readonly validation: "candidate";
}

export interface WorkflowContextPolicy {
  readonly id: WorkflowContextId;
  readonly defaultPreset: PresetId;
  readonly allowedPresets: readonly PresetId[];
  readonly moduleCeiling: readonly ModuleId[];
  readonly validation: "candidate";
}

export const PRESET_DECLARATIONS: readonly PresetDeclaration[] = Object.freeze([
  { id: "quiet", label: "Quiet", promise: "Legal interaction stays visible; no chess guidance appears unless you ask.", modules: ["rules_floor"], validation: "candidate" },
  { id: "guided", label: "Guide me", promise: "After you commit, a small consequence nudge; ask for more when you want it.", modules: ["rules_floor", "sight_on_request", "postcommit_nudge", "structure_nudge", "guided_hint", "compare_coach", "theory_breadcrumb"], validation: "candidate" },
  { id: "theory_only", label: "Theory only", promise: "Cited applicable theory; no evaluation, no candidates, no line.", modules: ["rules_floor", "theory_breadcrumb"], validation: "candidate" },
  { id: "support", label: "Support", promise: "Staged-move risk warnings, on request, before you commit. Never the best move.", modules: ["rules_floor", "sight_on_request", "threat_radar", "blunder_prevention", "postcommit_nudge", "guided_hint", "theory_breadcrumb"], validation: "candidate" },
  { id: "analysis", label: "Analyze", promise: "Attributed raw evidence, evaluations and lines, in an explicit inspector.", modules: ["rules_floor", "review_map", "compare_coach", "theory_breadcrumb", "full_inspector"], validation: "candidate" },
]);

const except = (...excluded: readonly ModuleId[]): readonly ModuleId[] => Object.freeze(MODULE_IDS.filter((id) => !excluded.includes(id)));

export const WORKFLOW_CONTEXT_POLICIES: readonly WorkflowContextPolicy[] = Object.freeze([
  { id: "position", defaultPreset: "quiet", allowedPresets: PRESET_IDS, moduleCeiling: MODULE_IDS, validation: "candidate" },
  { id: "pack", defaultPreset: "quiet", allowedPresets: ["quiet", "guided", "theory_only", "analysis"], moduleCeiling: except("blunder_prevention"), validation: "candidate" },
  { id: "imported", defaultPreset: "quiet", allowedPresets: ["quiet", "guided", "theory_only", "analysis"], moduleCeiling: except("blunder_prevention"), validation: "candidate" },
  { id: "match", defaultPreset: "quiet", allowedPresets: ["quiet"], moduleCeiling: ["rules_floor"], validation: "candidate" },
  { id: "stream", defaultPreset: "quiet", allowedPresets: ["quiet", "guided", "theory_only", "analysis"], moduleCeiling: except("blunder_prevention"), validation: "candidate" },
  { id: "academy", defaultPreset: "guided", allowedPresets: ["quiet", "guided", "theory_only"], moduleCeiling: except("blunder_prevention", "full_inspector"), validation: "candidate" },
  { id: "onramp", defaultPreset: "guided", allowedPresets: ["quiet", "guided", "theory_only"], moduleCeiling: except("blunder_prevention", "full_inspector", "review_map"), validation: "candidate" },
  { id: "campaign", defaultPreset: "guided", allowedPresets: ["quiet", "guided", "theory_only", "analysis"], moduleCeiling: except("blunder_prevention"), validation: "candidate" },
]);

export const PRESET_CONTRACT_ERROR_CODES = Object.freeze([
  "PRESET_REGISTRY_INCOMPLETE", "CONTEXT_REGISTRY_INCOMPLETE", "PRESET_MODULE_GHOST",
  "PRESET_MODULE_UNREACHABLE", "CONTEXT_PRESET_INVALID", "CONTEXT_MODULE_CEILING_INVALID",
] as const);
export type PresetContractErrorCode = (typeof PRESET_CONTRACT_ERROR_CODES)[number];

export class PresetContractError extends TypeError {
  readonly code: PresetContractErrorCode;
  constructor(code: PresetContractErrorCode, message: string) {
    super(`${code}: ${message}`);
    this.name = "PresetContractError";
    this.code = code;
  }
}

const setEqual = <T>(left: readonly T[], right: readonly T[]): boolean => left.length === right.length && left.every((value) => right.includes(value));
const unique = <T>(values: readonly T[]): boolean => new Set(values).size === values.length;

export function assertPresetFoundation(
  presets: readonly PresetDeclaration[] = PRESET_DECLARATIONS,
  contexts: readonly WorkflowContextPolicy[] = WORKFLOW_CONTEXT_POLICIES,
): void {
  if (!setEqual(presets.map((value) => value.id), PRESET_IDS) || !unique(presets.map((value) => value.id))) {
    throw new PresetContractError("PRESET_REGISTRY_INCOMPLETE", "preset declarations must be set-equal to PRESET_IDS");
  }
  if (!setEqual(contexts.map((value) => value.id), WORKFLOW_CONTEXTS) || !unique(contexts.map((value) => value.id))) {
    throw new PresetContractError("CONTEXT_REGISTRY_INCOMPLETE", "context policies must be set-equal to WORKFLOW_CONTEXTS");
  }
  const namedModules = presets.flatMap((preset) => preset.modules);
  if (namedModules.some((id) => !MODULE_IDS.includes(id))) throw new PresetContractError("PRESET_MODULE_GHOST", "a preset names an unknown module");
  if (!setEqual([...new Set(namedModules)], MODULE_IDS)) throw new PresetContractError("PRESET_MODULE_UNREACHABLE", "the preset union must reach every module exactly as a set");
  for (const context of contexts) {
    if (!unique(context.allowedPresets) || !context.allowedPresets.includes(context.defaultPreset) || context.allowedPresets.some((id) => !PRESET_IDS.includes(id))) {
      throw new PresetContractError("CONTEXT_PRESET_INVALID", `${context.id} has an invalid preset set or default`);
    }
    if (!unique(context.moduleCeiling) || !context.moduleCeiling.includes("rules_floor") || context.moduleCeiling.some((id) => !MODULE_IDS.includes(id))) {
      throw new PresetContractError("CONTEXT_MODULE_CEILING_INVALID", `${context.id} has an invalid module ceiling`);
    }
  }
  const admitted = contexts.reduce((sum, context) => sum + context.allowedPresets.length, 0);
  if (admitted !== 28 || PRESET_IDS.length * WORKFLOW_CONTEXTS.length - admitted !== 12) {
    throw new PresetContractError("CONTEXT_PRESET_INVALID", `expected 28 admitted and 12 refused pairs; received ${admitted} and ${PRESET_IDS.length * WORKFLOW_CONTEXTS.length - admitted}`);
  }
}

assertPresetFoundation();

export function workflowContextPolicy(id: WorkflowContextId): WorkflowContextPolicy {
  return WORKFLOW_CONTEXT_POLICIES.find((entry) => entry.id === id)!;
}

export function presetDeclaration(id: PresetId): PresetDeclaration {
  return PRESET_DECLARATIONS.find((entry) => entry.id === id)!;
}

export function deriveWorkflowContext(input: {
  readonly sessionKind: RunSessionKind;
  readonly feedbackPolicy: RunFeedbackPolicy;
  readonly liveKind?: LiveSessionKind | undefined;
}): WorkflowContextId {
  if (input.feedbackPolicy === "immediate_guard") return "onramp";
  if (input.liveKind === "stream") return "stream";
  if (input.liveKind === "match") return "match";
  if (input.liveKind === "academy") return "academy";
  return input.sessionKind;
}
