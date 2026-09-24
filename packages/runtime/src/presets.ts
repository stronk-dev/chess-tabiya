import type { AssistanceConfig, AssistancePermission } from "./assistance.js";
import { MODULE_IDS, type ModuleId } from "./module-contract.js";
import type { LiveSessionKind, RunFeedbackPolicy, RunSessionKind } from "./types.js";

// rfc/intent-presets.md — the workflow-context × preset vocabulary, the two literal tables
// (§4a projection, §3.2 clamp), the ∩ algebra over them, and the v2 preference receipt.
// This module imports only *types* from assistance.ts so the value graph stays acyclic
// (assistance.ts reads `contextClamp` from here).

export const WORKFLOW_CONTEXTS = Object.freeze([
  "pack", "position", "imported", "match", "stream", "academy", "onramp", "campaign",
] as const);
export type WorkflowContextId = (typeof WORKFLOW_CONTEXTS)[number];
/** §3.1 controlling repair: Campaign is declared-awaiting until campaign-core exports its receipt. */
export type OrdinaryWorkflowContextId = Exclude<WorkflowContextId, "campaign">;

export const PRESET_IDS = Object.freeze([
  "quiet", "guided", "theory_only", "support", "analysis",
] as const);
export type PresetId = (typeof PRESET_IDS)[number];

// ---------------------------------------------------------------------------------------------
// §5.3 — the nine-field registry and its per-field domain orders (§3.2's first table).

export const ASSISTANCE_PREFERENCE_FIELDS = Object.freeze([
  "markers", "guided", "humanSplit", "corpus", "voice", "spoken",
  "boardLighting", "arrows", "ambient",
] as const satisfies readonly (keyof Omit<AssistanceConfig, "version">)[]);
export type AssistancePreferenceField = (typeof ASSISTANCE_PREFERENCE_FIELDS)[number];
export type AssistancePreferenceFields = Readonly<Pick<Omit<AssistanceConfig, "version">, AssistancePreferenceField>>;

type FieldDomains = { readonly [K in AssistancePreferenceField]: readonly AssistanceConfig[K][] };
/** Lowest → highest. Every member of every domain stays reachable from Advanced (criterion 18). */
export const ASSISTANCE_FIELD_DOMAINS: FieldDomains = Object.freeze({
  markers: Object.freeze(["off", "live"] as const),
  guided: Object.freeze(["off", "live"] as const),
  humanSplit: Object.freeze(["off", "on_request"] as const),
  corpus: Object.freeze(["off", "on_request"] as const),
  voice: Object.freeze(["authored", "persona"] as const),
  spoken: Object.freeze(["off", "browser", "provider"] as const),
  boardLighting: Object.freeze(["off", "legal", "sight", "evidence"] as const),
  arrows: Object.freeze(["off", "sight", "evidence"] as const),
  ambient: Object.freeze(["off", "on"] as const),
});

/** §3.2: the clamp is TOTAL over the nine fields and `version` is not clampable. */
export type ConfigClamp = Readonly<Record<AssistancePreferenceField, AssistancePermission>>;

/** §3.2 admissible clamp tokens per field. */
export const CLAMP_TOKENS: Readonly<Record<AssistancePreferenceField, readonly AssistancePermission[]>> = Object.freeze({
  markers: ["free", "locked_off"], guided: ["free", "locked_off"], humanSplit: ["free", "locked_off"],
  corpus: ["free", "locked_off"], voice: ["free", "locked_off"], spoken: ["free", "locked_off"],
  boardLighting: ["legal", "sight", "evidence"], arrows: ["locked_off", "sight", "evidence"], ambient: ["free", "locked_off"],
});

export type FieldValue<F extends AssistancePreferenceField> = AssistanceConfig[F];

export function fieldRank<F extends AssistancePreferenceField>(field: F, value: FieldValue<F>): number {
  const rank = (ASSISTANCE_FIELD_DOMAINS[field] as readonly string[]).indexOf(value as string);
  if (rank < 0) throw new TypeError(`ASSISTANCE_VALUE_INVALID: ${String(value)} is not a ${field} value`);
  return rank;
}

function domainFloor<F extends AssistancePreferenceField>(field: F): FieldValue<F> {
  return ASSISTANCE_FIELD_DOMAINS[field][0] as FieldValue<F>;
}

function domainTop<F extends AssistancePreferenceField>(field: F): FieldValue<F> {
  const domain = ASSISTANCE_FIELD_DOMAINS[field];
  return domain[domain.length - 1] as FieldValue<F>;
}

/** The highest admissible value a clamp token names on one field (§3.2 "what the token means"). */
export function permissionCeiling<F extends AssistancePreferenceField>(field: F, token: AssistancePermission): FieldValue<F> {
  if (!CLAMP_TOKENS[field].includes(token)) throw new TypeError(`CLAMP_TOKEN_INADMISSIBLE: ${token} on ${field}`);
  if (token === "free") return domainTop(field);
  if (token === "locked_off") return domainFloor(field);
  return token as FieldValue<F>;
}

/** Inverse of `permissionCeiling`: the token that names a ceiling value on one field. */
export function permissionToken<F extends AssistancePreferenceField>(field: F, ceiling: FieldValue<F>): AssistancePermission {
  if (field === "boardLighting") {
    if (ceiling === "off") throw new TypeError("CLAMP_TOKEN_INADMISSIBLE: boardLighting cannot be clamped below the rules floor");
    return ceiling as AssistancePermission;
  }
  if (field === "arrows") return ceiling === "off" ? "locked_off" : ceiling as AssistancePermission;
  return ceiling === domainFloor(field) ? "locked_off" : "free";
}

/** A requested value narrowed by a clamp; `boardLighting` never compiles below `"legal"` (§3, criterion 3). */
export function clampFieldValue<F extends AssistancePreferenceField>(field: F, value: FieldValue<F>, token: AssistancePermission): FieldValue<F> {
  const ceiling = permissionCeiling(field, token);
  const clamped = fieldRank(field, value) <= fieldRank(field, ceiling) ? value : ceiling;
  if (field === "boardLighting" && clamped === "off") return "legal" as FieldValue<F>;
  return clamped;
}

/** §3.2: per-field minimum under the domain order; the legal floor is re-applied by the token set. */
export function pointwiseMin(left: ConfigClamp, right: ConfigClamp): ConfigClamp {
  const out = {} as Record<AssistancePreferenceField, AssistancePermission>;
  for (const field of ASSISTANCE_PREFERENCE_FIELDS) {
    const a = permissionCeiling(field, left[field]);
    const b = permissionCeiling(field, right[field]);
    out[field] = permissionToken(field, fieldRank(field, a) <= fieldRank(field, b) ? a : b);
  }
  return Object.freeze(out);
}

// ---------------------------------------------------------------------------------------------
// §3.2/§4a derivation inputs: the per-module presentation facts the derivation rule reads. They mirror
// the production registry (`module-policy.ts` MODULE_POLICIES, landed by module-registration
// 2026-09-24). presets.ts cannot import that file (module-policy imports this one), so
// `assistance-exchange.ts` re-derives these facts from MODULE_POLICIES at import and throws on any drift.

export interface ModulePresentationFacts {
  /** `maxMarks` > 0 (a null "—" budget reads as zero). */
  readonly maxMarks: number;
  readonly maxArrows: number;
  /** Renders without a learner request after the commit (proactive post_commit or automatic review). */
  readonly automaticAfterCommit: boolean;
  /** Has an on_request arm — the ambient opener has something to open. */
  readonly onRequest: boolean;
  /** Named-pattern (shape) delivery — the `guided` field's governed effect. */
  readonly namedPattern: boolean;
  /** Raw evidence inspector (D619) — the only module behind `humanSplit`/`corpus`/`evidence`. */
  readonly rawInspector: boolean;
  /** Carries learner-facing content (everything except the rules floor). */
  readonly contentBearing: boolean;
}

export const MODULE_PRESENTATION_SOURCE = Object.freeze({
  kind: "registry_mirror" as const,
  from: "packages/runtime/src/module-policy.ts MODULE_POLICIES",
  assertedBy: "packages/runtime/src/assistance-exchange.ts (import time)",
});

const facts = (maxMarks: number, maxArrows: number, flags: Partial<Omit<ModulePresentationFacts, "maxMarks" | "maxArrows">> = {}): ModulePresentationFacts => Object.freeze({
  maxMarks, maxArrows, automaticAfterCommit: false, onRequest: false, namedPattern: false, rawInspector: false, contentBearing: true, ...flags,
});

export const MODULE_PRESENTATION_FACTS: Readonly<Record<ModuleId, ModulePresentationFacts>> = Object.freeze({
  rules_floor: facts(0, 0, { contentBearing: false }),
  sight_on_request: facts(6, 1, { onRequest: true }),
  blunder_prevention: facts(1, 1),
  threat_radar: facts(4, 2, { onRequest: true }),
  postcommit_nudge: facts(2, 1, { automaticAfterCommit: true }),
  structure_nudge: facts(4, 0, { automaticAfterCommit: true, namedPattern: true }),
  theory_breadcrumb: facts(0, 0, { onRequest: true }),
  guided_hint: facts(2, 1, { onRequest: true }),
  compare_coach: facts(2, 2, { onRequest: true }),
  review_map: facts(3, 2, { automaticAfterCommit: true }),
  full_inspector: facts(20, 8, { rawInspector: true }),
});

/** The one derivation rule (§3.2 / §4a): the highest value some module in the set drives. */
export function deriveModuleFieldCeiling(modules: readonly ModuleId[]): AssistancePreferenceFields {
  const present = modules.map((id) => MODULE_PRESENTATION_FACTS[id]);
  const any = (predicate: (value: ModulePresentationFacts) => boolean) => present.some(predicate);
  return Object.freeze({
    markers: any((value) => value.automaticAfterCommit) ? "live" : "off",
    guided: any((value) => value.namedPattern) ? "live" : "off",
    humanSplit: any((value) => value.rawInspector) ? "on_request" : "off",
    corpus: any((value) => value.rawInspector) ? "on_request" : "off",
    voice: "authored",
    spoken: "off",
    boardLighting: any((value) => value.rawInspector) ? "evidence" : any((value) => value.maxMarks > 0) ? "sight" : "legal",
    arrows: any((value) => value.rawInspector) ? "evidence" : any((value) => value.maxArrows > 0) ? "sight" : "off",
    ambient: any((value) => value.onRequest) ? "on" : "off",
  });
}

/** §4a: a preset's projection. Provider channels sit at their floor by D619. */
export function derivePresetProjection(modules: readonly ModuleId[]): AssistancePreferenceFields {
  return deriveModuleFieldCeiling(modules);
}

/** §3.2: a context's clamp. Provider channels are free wherever any content-bearing module is admitted. */
export function deriveContextClamp(moduleCeiling: readonly ModuleId[]): ConfigClamp {
  const ceiling = deriveModuleFieldCeiling(moduleCeiling);
  const content = moduleCeiling.some((id) => MODULE_PRESENTATION_FACTS[id].contentBearing);
  const out = {} as Record<AssistancePreferenceField, AssistancePermission>;
  for (const field of ASSISTANCE_PREFERENCE_FIELDS) {
    out[field] = field === "voice" || field === "spoken"
      ? (content ? "free" : "locked_off")
      : permissionToken(field, ceiling[field]);
  }
  return Object.freeze(out);
}

// ---------------------------------------------------------------------------------------------
// §4 / §4a — the five candidate presets with their literal nine-field projection.

export interface PresetDeclaration {
  readonly id: PresetId;
  readonly label: string;
  readonly promise: string;
  readonly modules: readonly ModuleId[];
  readonly config: AssistancePreferenceFields;
  readonly validation: "candidate";
}

const projection = (markers: AssistanceConfig["markers"], guided: AssistanceConfig["guided"], humanSplit: AssistanceConfig["humanSplit"], corpus: AssistanceConfig["corpus"], boardLighting: AssistanceConfig["boardLighting"], arrows: AssistanceConfig["arrows"], ambient: AssistanceConfig["ambient"]): AssistancePreferenceFields =>
  Object.freeze({ markers, guided, humanSplit, corpus, voice: "authored", spoken: "off", boardLighting, arrows, ambient });

export const PRESET_DECLARATIONS: readonly PresetDeclaration[] = Object.freeze([
  { id: "quiet", label: "Quiet", promise: "Legal interaction stays visible; no chess guidance appears unless you ask.", modules: ["rules_floor"], config: projection("off", "off", "off", "off", "legal", "off", "off"), validation: "candidate" },
  { id: "guided", label: "Guide me", promise: "After you commit, a small consequence nudge; ask for more when you want it.", modules: ["rules_floor", "sight_on_request", "postcommit_nudge", "structure_nudge", "guided_hint", "compare_coach", "theory_breadcrumb"], config: projection("live", "live", "off", "off", "sight", "sight", "on"), validation: "candidate" },
  { id: "theory_only", label: "Theory only", promise: "Cited applicable theory; no evaluation, no candidates, no line.", modules: ["rules_floor", "theory_breadcrumb"], config: projection("off", "off", "off", "off", "legal", "off", "on"), validation: "candidate" },
  { id: "support", label: "Support", promise: "Staged-move risk warnings, on request, before you commit. Never the best move.", modules: ["rules_floor", "sight_on_request", "threat_radar", "blunder_prevention", "postcommit_nudge", "guided_hint", "theory_breadcrumb"], config: projection("live", "off", "off", "off", "sight", "sight", "on"), validation: "candidate" },
  { id: "analysis", label: "Analyze", promise: "Attributed raw evidence, evaluations and lines, in an explicit inspector.", modules: ["rules_floor", "review_map", "compare_coach", "theory_breadcrumb", "full_inspector"], config: projection("live", "off", "on_request", "on_request", "evidence", "evidence", "on"), validation: "candidate" },
]);

// ---------------------------------------------------------------------------------------------
// §3 / §3.2 — the eight context contracts with their literal clamp.

export interface WorkflowContextPolicy {
  readonly id: WorkflowContextId;
  readonly defaultPreset: PresetId;
  readonly allowedPresets: readonly PresetId[];
  readonly moduleCeiling: readonly ModuleId[];
  readonly configClamp: ConfigClamp;
  readonly validation: "candidate";
}
/** §3's name for the same record. */
export type ContextContract = WorkflowContextPolicy;

const except = (...excluded: readonly ModuleId[]): readonly ModuleId[] => Object.freeze(MODULE_IDS.filter((id) => !excluded.includes(id)));
const clamp = (markers: AssistancePermission, guided: AssistancePermission, humanSplit: AssistancePermission, corpus: AssistancePermission, voice: AssistancePermission, spoken: AssistancePermission, boardLighting: AssistancePermission, arrows: AssistancePermission, ambient: AssistancePermission): ConfigClamp =>
  Object.freeze({ markers, guided, humanSplit, corpus, voice, spoken, boardLighting, arrows, ambient });
const FULL = clamp("free", "free", "free", "free", "free", "free", "evidence", "evidence", "free");

export const WORKFLOW_CONTEXT_POLICIES: readonly WorkflowContextPolicy[] = Object.freeze([
  { id: "position", defaultPreset: "quiet", allowedPresets: PRESET_IDS, moduleCeiling: MODULE_IDS, configClamp: FULL, validation: "candidate" },
  { id: "pack", defaultPreset: "quiet", allowedPresets: ["quiet", "guided", "theory_only", "analysis"], moduleCeiling: except("blunder_prevention"), configClamp: FULL, validation: "candidate" },
  { id: "imported", defaultPreset: "quiet", allowedPresets: ["quiet", "guided", "theory_only", "analysis"], moduleCeiling: except("blunder_prevention"), configClamp: FULL, validation: "candidate" },
  { id: "match", defaultPreset: "quiet", allowedPresets: ["quiet"], moduleCeiling: ["rules_floor"], configClamp: clamp("locked_off", "locked_off", "locked_off", "locked_off", "locked_off", "locked_off", "legal", "locked_off", "locked_off"), validation: "candidate" },
  { id: "stream", defaultPreset: "quiet", allowedPresets: ["quiet", "guided", "theory_only", "analysis"], moduleCeiling: except("blunder_prevention"), configClamp: FULL, validation: "candidate" },
  // 2026-09-24 implementation correction: `corpus` is `locked_off` here and in `onramp` — §4a and
  // §5's adapter both bind the raw-corpus switch to `full_inspector` alone, which these contexts exclude.
  { id: "academy", defaultPreset: "guided", allowedPresets: ["quiet", "guided", "theory_only"], moduleCeiling: except("blunder_prevention", "full_inspector"), configClamp: clamp("free", "free", "locked_off", "locked_off", "free", "free", "sight", "sight", "free"), validation: "candidate" },
  { id: "onramp", defaultPreset: "guided", allowedPresets: ["quiet", "guided", "theory_only"], moduleCeiling: except("blunder_prevention", "full_inspector", "review_map"), configClamp: clamp("free", "free", "locked_off", "locked_off", "free", "free", "sight", "sight", "free"), validation: "candidate" },
  { id: "campaign", defaultPreset: "guided", allowedPresets: ["quiet", "guided", "theory_only", "analysis"], moduleCeiling: except("blunder_prevention"), configClamp: FULL, validation: "candidate" },
]);

// ---------------------------------------------------------------------------------------------
// D1639 hint-distance ceiling — PROPOSED, NOT RULED. Transcribed from rfc/hint-distance.md §5's
// proposed owner table so the per-context hint ceiling is computable. It is not a v4 config field
// (§9a refuses the tenth field); it rides beside the compiled config and carries its status.

export const HINT_RUNGS = Object.freeze(["off", "pattern", "square", "piece", "distance", "move"] as const);
export type HintRung = (typeof HINT_RUNGS)[number];

export const HINT_CEILING_TABLE = Object.freeze({
  validation: "proposed" as const,
  ruling: "D1639" as const,
  source: "rfc/hint-distance.md §5",
  presets: Object.freeze({ quiet: "off", guided: "distance", theory_only: "off", support: "distance", analysis: "off" } satisfies Record<PresetId, HintRung>),
  contexts: Object.freeze({ position: "move", pack: "distance", imported: "move", match: "off", stream: "distance", academy: "distance", onramp: "move", campaign: "distance" } satisfies Record<WorkflowContextId, HintRung>),
});

const minRung = (...rungs: readonly HintRung[]): HintRung => rungs.reduce((low, next) => HINT_RUNGS.indexOf(next) < HINT_RUNGS.indexOf(low) ? next : low, "move" as HintRung);

/** Effective hint ceiling: preset ∩ context ∩ access, and `off` unless `guided_hint` survived compilation. */
export function hintCeiling(input: {
  readonly preset: PresetId;
  readonly context: WorkflowContextId;
  readonly role: "solo" | "host" | "participant" | "spectator";
  readonly seatedInContest: boolean;
  readonly modules: readonly ModuleId[];
}): HintRung {
  if (!input.modules.includes("guided_hint")) return "off";
  const access: HintRung = input.role === "spectator" || input.seatedInContest ? "off" : "move";
  return minRung(HINT_CEILING_TABLE.presets[input.preset], HINT_CEILING_TABLE.contexts[input.context], access);
}

// ---------------------------------------------------------------------------------------------
// The import-time foundation assertion (criterion 12's transcription + re-derivation arms).

export const PRESET_CONTRACT_ERROR_CODES = Object.freeze([
  "PRESET_REGISTRY_INCOMPLETE", "CONTEXT_REGISTRY_INCOMPLETE", "PRESET_MODULE_GHOST",
  "PRESET_MODULE_UNREACHABLE", "CONTEXT_PRESET_INVALID", "CONTEXT_MODULE_CEILING_INVALID",
  "PRESET_PROJECTION_UNDERIVED", "CONTEXT_CLAMP_UNDERIVED",
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
const sameFields = (left: Readonly<Record<string, unknown>>, right: Readonly<Record<string, unknown>>): boolean =>
  setEqual(Object.keys(left), [...ASSISTANCE_PREFERENCE_FIELDS]) && ASSISTANCE_PREFERENCE_FIELDS.every((field) => left[field] === right[field]);

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
  for (const preset of presets) {
    if (!sameFields(preset.config, derivePresetProjection(preset.modules))) {
      throw new PresetContractError("PRESET_PROJECTION_UNDERIVED", `${preset.id}'s config projection is not derived from its modules`);
    }
  }
  for (const context of contexts) {
    if (!unique(context.allowedPresets) || !context.allowedPresets.includes(context.defaultPreset) || context.allowedPresets.some((id) => !PRESET_IDS.includes(id))) {
      throw new PresetContractError("CONTEXT_PRESET_INVALID", `${context.id} has an invalid preset set or default`);
    }
    if (!unique(context.moduleCeiling) || !context.moduleCeiling.includes("rules_floor") || context.moduleCeiling.some((id) => !MODULE_IDS.includes(id))) {
      throw new PresetContractError("CONTEXT_MODULE_CEILING_INVALID", `${context.id} has an invalid module ceiling`);
    }
    for (const field of ASSISTANCE_PREFERENCE_FIELDS) {
      if (!CLAMP_TOKENS[field].includes(context.configClamp[field])) {
        throw new PresetContractError("CONTEXT_CLAMP_UNDERIVED", `${context.id} carries an inadmissible ${field} clamp token`);
      }
    }
    if (!sameFields(context.configClamp, deriveContextClamp(context.moduleCeiling))) {
      throw new PresetContractError("CONTEXT_CLAMP_UNDERIVED", `${context.id}'s config clamp is not derived from its module ceiling`);
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

/** §3.2: the literal clamp, read by `permittedAssistance` and the authoritative compiler. */
export function contextClamp(id: WorkflowContextId): ConfigClamp {
  return workflowContextPolicy(id).configClamp;
}

/** §3.1 controlling repair: the ordinary seven-context run origin. */
export type OrdinaryWorkflowContextOrigin = {
  readonly kind?: "run";
  readonly sessionKind: RunSessionKind;
  readonly feedbackPolicy: RunFeedbackPolicy;
  readonly liveKind?: LiveSessionKind | undefined;
};

export function deriveWorkflowContext(input: OrdinaryWorkflowContextOrigin): OrdinaryWorkflowContextId {
  if (input.feedbackPolicy === "immediate_guard") return "onramp";
  if (input.liveKind === "stream") return "stream";
  if (input.liveKind === "match") return "match";
  if (input.liveKind === "academy") return "academy";
  return input.sessionKind;
}

// ---------------------------------------------------------------------------------------------
// §5.3 — the lossless v2 preference receipt, its strict parser and canonical serializer.

export type ConfigurableModuleId = Exclude<ModuleId, "rules_floor">;
export const CONFIGURABLE_MODULE_IDS: readonly ConfigurableModuleId[] = Object.freeze(MODULE_IDS.filter((id): id is ConfigurableModuleId => id !== "rules_floor"));

export interface CustomModuleOverrides {
  readonly include: readonly ConfigurableModuleId[];
  readonly exclude: readonly ConfigurableModuleId[];
}

export type WorkflowPreferenceReceipt =
  | { readonly kind: "unset" }
  | { readonly kind: "explicit"; readonly preset: PresetId;
      readonly overrides: Readonly<Partial<AssistancePreferenceFields>>;
      readonly moduleOverrides: CustomModuleOverrides }
  | { readonly kind: "migrated_snapshot"; readonly preset: PresetId;
      readonly config: AssistanceConfig; readonly sourceVersion: 1 | 2 | 3 | 4;
      readonly moduleOverrides: CustomModuleOverrides }
  | { readonly kind: "invalid_fallback"; readonly reason: "malformed" | "storage_unavailable" };

export interface WorkflowPreferenceV2 {
  readonly version: 2;
  readonly assistanceHead: 4;
  readonly intent:
    | { readonly kind: "unset" }
    | { readonly kind: "explicit"; readonly preset: PresetId;
        readonly overrides: Readonly<Partial<AssistancePreferenceFields>>;
        readonly moduleOverrides: CustomModuleOverrides }
    | { readonly kind: "migrated_snapshot"; readonly preset: PresetId;
        readonly config: AssistanceConfig; readonly sourceVersion: 1 | 2 | 3 | 4;
        readonly moduleOverrides: CustomModuleOverrides }
    | { readonly kind: "invalid_fallback"; readonly reason: "malformed" };
}

export const EMPTY_MODULE_OVERRIDES: CustomModuleOverrides = Object.freeze({ include: Object.freeze([]), exclude: Object.freeze([]) });

export class PreferenceParseError extends TypeError {
  readonly code: string;
  constructor(code: string, message: string) {
    super(`${code}: ${message}`);
    this.name = "PreferenceParseError";
    this.code = code;
  }
}

const plain = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
const exactKeys = (value: Record<string, unknown>, keys: readonly string[]): boolean =>
  Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
const moduleOrder = new Map<ModuleId, number>(MODULE_IDS.map((id, index) => [id, index]));
const sortModules = (ids: readonly ConfigurableModuleId[]): readonly ConfigurableModuleId[] =>
  Object.freeze([...ids].sort((left, right) => moduleOrder.get(left)! - moduleOrder.get(right)!));

function parseModuleOverrides(value: unknown): CustomModuleOverrides {
  if (!plain(value) || !exactKeys(value, ["include", "exclude"]) || !Array.isArray(value.include) || !Array.isArray(value.exclude)) {
    throw new PreferenceParseError("PREFERENCE_MODULE_SHAPE", "moduleOverrides must be exactly {include, exclude}");
  }
  const both: unknown[] = [...value.include, ...value.exclude];
  if (both.some((id) => typeof id !== "string" || !(CONFIGURABLE_MODULE_IDS as readonly string[]).includes(id))) {
    throw new PreferenceParseError("PREFERENCE_MODULE_AUTHORITY", "module overrides name only configurable module ids (never rules_floor)");
  }
  if (new Set(both).size !== both.length) throw new PreferenceParseError("PREFERENCE_MODULE_AUTHORITY", "include/exclude must be disjoint and duplicate-free");
  return Object.freeze({ include: sortModules(value.include as ConfigurableModuleId[]), exclude: sortModules(value.exclude as ConfigurableModuleId[]) });
}

function parseFields(value: unknown, complete: boolean): Readonly<Partial<AssistancePreferenceFields>> {
  if (!plain(value)) throw new PreferenceParseError("PREFERENCE_FIELDS", "field overrides must be a plain object");
  const keys = Object.keys(value);
  if (keys.some((key) => !(ASSISTANCE_PREFERENCE_FIELDS as readonly string[]).includes(key))) throw new PreferenceParseError("PREFERENCE_FIELDS", "unknown assistance field");
  if (complete && keys.length !== ASSISTANCE_PREFERENCE_FIELDS.length) throw new PreferenceParseError("PREFERENCE_FIELDS", "a snapshot carries all nine fields");
  const out: Record<string, string> = {};
  for (const field of ASSISTANCE_PREFERENCE_FIELDS) {
    if (!Object.hasOwn(value, field)) continue;
    const selected = value[field];
    if (typeof selected !== "string" || !(ASSISTANCE_FIELD_DOMAINS[field] as readonly string[]).includes(selected)) {
      throw new PreferenceParseError("PREFERENCE_VALUE", `${field} carries an invalid value`);
    }
    out[field] = selected;
  }
  return Object.freeze(out) as Readonly<Partial<AssistancePreferenceFields>>;
}

function parsePreset(value: unknown): PresetId {
  if (typeof value !== "string" || !(PRESET_IDS as readonly string[]).includes(value)) throw new PreferenceParseError("PREFERENCE_PRESET", "unknown preset");
  return value as PresetId;
}

/** Strict: exact three envelope keys, exact discriminated intent arm, closed ids and domains. */
export function parseWorkflowPreferenceV2(value: unknown): WorkflowPreferenceV2 {
  if (!plain(value) || !exactKeys(value, ["version", "assistanceHead", "intent"])) throw new PreferenceParseError("PREFERENCE_SHAPE", "expected exactly {version, assistanceHead, intent}");
  if (value.version !== 2 || value.assistanceHead !== 4) throw new PreferenceParseError("PREFERENCE_VERSION", "expected version 2 over assistance head 4");
  const raw = value.intent;
  if (!plain(raw) || typeof raw.kind !== "string") throw new PreferenceParseError("PREFERENCE_INTENT", "intent must be a discriminated object");
  let intent: WorkflowPreferenceV2["intent"];
  if (raw.kind === "unset" && exactKeys(raw, ["kind"])) {
    intent = Object.freeze({ kind: "unset" });
  } else if (raw.kind === "explicit" && exactKeys(raw, ["kind", "preset", "overrides", "moduleOverrides"])) {
    intent = Object.freeze({ kind: "explicit", preset: parsePreset(raw.preset), overrides: parseFields(raw.overrides, false), moduleOverrides: parseModuleOverrides(raw.moduleOverrides) });
  } else if (raw.kind === "migrated_snapshot" && exactKeys(raw, ["kind", "preset", "config", "sourceVersion", "moduleOverrides"])) {
    if (raw.sourceVersion !== 1 && raw.sourceVersion !== 2 && raw.sourceVersion !== 3 && raw.sourceVersion !== 4) throw new PreferenceParseError("PREFERENCE_INTENT", "sourceVersion must be 1-4");
    if (!plain(raw.config) || raw.config.version !== 4) throw new PreferenceParseError("PREFERENCE_FIELDS", "a snapshot is a complete v4 config");
    const { version: _version, ...fields } = raw.config;
    const parsed = parseFields(fields, true) as AssistancePreferenceFields;
    intent = Object.freeze({ kind: "migrated_snapshot", preset: parsePreset(raw.preset), config: Object.freeze({ version: 4, ...parsed }), sourceVersion: raw.sourceVersion, moduleOverrides: parseModuleOverrides(raw.moduleOverrides) });
  } else if (raw.kind === "invalid_fallback" && exactKeys(raw, ["kind", "reason"]) && raw.reason === "malformed") {
    intent = Object.freeze({ kind: "invalid_fallback", reason: "malformed" });
  } else {
    throw new PreferenceParseError("PREFERENCE_INTENT", "unknown or malformed intent arm");
  }
  return Object.freeze({ version: 2, assistanceHead: 4, intent });
}

function canonicalFields(value: Readonly<Partial<AssistancePreferenceFields>>): Readonly<Partial<AssistancePreferenceFields>> {
  return Object.freeze(Object.fromEntries(ASSISTANCE_PREFERENCE_FIELDS.flatMap((field) => field in value ? [[field, value[field]]] : []))) as Readonly<Partial<AssistancePreferenceFields>>;
}

/** Canonical field order; the strict parser round-trips it byte-for-byte. */
export function serializeWorkflowPreferenceV2(value: WorkflowPreferenceV2): string {
  const parsed = parseWorkflowPreferenceV2(JSON.parse(JSON.stringify(value)));
  const intent = parsed.intent;
  const canonicalIntent = intent.kind === "explicit"
    ? { kind: "explicit", preset: intent.preset, overrides: canonicalFields(intent.overrides), moduleOverrides: { include: intent.moduleOverrides.include, exclude: intent.moduleOverrides.exclude } }
    : intent.kind === "migrated_snapshot"
      ? { kind: "migrated_snapshot", preset: intent.preset, config: { version: 4, ...canonicalFields(intent.config) }, sourceVersion: intent.sourceVersion, moduleOverrides: { include: intent.moduleOverrides.include, exclude: intent.moduleOverrides.exclude } }
      : intent;
  return JSON.stringify({ version: 2, assistanceHead: 4, intent: canonicalIntent });
}

export function preferenceReceipt(value: WorkflowPreferenceV2): WorkflowPreferenceReceipt {
  return value.intent;
}

/** Rule 0: the requested preset is derived once, from the receipt. `undefined` = forbidden here. */
export function requestedPreset(receipt: WorkflowPreferenceReceipt, context: WorkflowContextId): PresetId | undefined {
  const policy = workflowContextPolicy(context);
  if (receipt.kind === "unset" || receipt.kind === "invalid_fallback") return policy.defaultPreset;
  return policy.allowedPresets.includes(receipt.preset) ? receipt.preset : undefined;
}

/** The requested (pre-ceiling) nine fields: projection overridden by explicit sparse values. */
export function requestedAssistanceFields(receipt: WorkflowPreferenceReceipt, preset: PresetId): AssistancePreferenceFields {
  const base = presetDeclaration(preset).config;
  if (receipt.kind === "explicit") return Object.freeze({ ...base, ...receipt.overrides });
  if (receipt.kind === "migrated_snapshot") {
    const { version: _version, ...fields } = receipt.config;
    return Object.freeze(fields);
  }
  return base;
}

/** Requested modules: preset ∪ explicit include − explicit exclude; the floor is always reinserted. */
export function requestedModules(receipt: WorkflowPreferenceReceipt, preset: PresetId): readonly ModuleId[] {
  const overrides = receipt.kind === "explicit" || receipt.kind === "migrated_snapshot" ? receipt.moduleOverrides : EMPTY_MODULE_OVERRIDES;
  const set = new Set<ModuleId>([...presetDeclaration(preset).modules, ...overrides.include]);
  for (const id of overrides.exclude) set.delete(id);
  set.add("rules_floor");
  return Object.freeze(MODULE_IDS.filter((id) => set.has(id)));
}

/** Rule 4's display mode: a higher field, any module delta, or a migrated snapshot is Custom. */
export function preferenceDisplayMode(receipt: WorkflowPreferenceReceipt, preset: PresetId): "named" | "custom" {
  if (receipt.kind === "migrated_snapshot") return "custom";
  if (receipt.kind !== "explicit") return "named";
  if (receipt.moduleOverrides.include.length > 0 || receipt.moduleOverrides.exclude.length > 0) return "custom";
  const base = presetDeclaration(preset).config;
  return ASSISTANCE_PREFERENCE_FIELDS.some((field) => {
    const value = receipt.overrides[field];
    return value !== undefined && fieldRank(field, value) > fieldRank(field, base[field]);
  }) ? "custom" : "named";
}

function lowerOverrides(fields: Readonly<Partial<AssistancePreferenceFields>>, preset: PresetId, keepEqual: boolean): Readonly<Partial<AssistancePreferenceFields>> {
  const base = presetDeclaration(preset).config;
  return canonicalFields(Object.fromEntries(ASSISTANCE_PREFERENCE_FIELDS.flatMap((field) => {
    const value = fields[field];
    if (value === undefined) return [];
    const delta = fieldRank(field, value) - fieldRank(field, base[field]);
    return delta < 0 || (keepEqual && delta === 0) ? [[field, value]] : [];
  })) as Partial<AssistancePreferenceFields>);
}

export class PresetRefusalError extends TypeError {
  readonly code = "PRESET_NOT_ALLOWED" as const;
  constructor(readonly context: WorkflowContextId, readonly preset: PresetId) {
    super(`PRESET_NOT_ALLOWED: ${preset} is not offered in ${context}`);
    this.name = "PresetRefusalError";
  }
}

/**
 * Selecting a named preset is literal (§5.2, D2174): both module-delta arrays clear and only explicit
 * field overrides no higher than the chosen projection survive, so an explicit off stays off. A migrated
 * snapshot carries no per-field intent, so only its values strictly below the projection survive.
 */
export function selectNamedPreset(context: WorkflowContextId, receipt: WorkflowPreferenceReceipt, preset: PresetId): WorkflowPreferenceV2 {
  if (!workflowContextPolicy(context).allowedPresets.includes(preset)) throw new PresetRefusalError(context, preset);
  const prior = receipt.kind === "explicit" ? receipt.overrides : receipt.kind === "migrated_snapshot" ? requestedAssistanceFields(receipt, receipt.preset) : {};
  return Object.freeze({ version: 2, assistanceHead: 4, intent: Object.freeze({ kind: "explicit", preset, overrides: lowerOverrides(prior, preset, receipt.kind === "explicit"), moduleOverrides: EMPTY_MODULE_OVERRIDES }) });
}

function explicitBase(context: WorkflowContextId, receipt: WorkflowPreferenceReceipt): { preset: PresetId; overrides: Partial<AssistancePreferenceFields>; moduleOverrides: CustomModuleOverrides } {
  const preset = requestedPreset(receipt, context) ?? workflowContextPolicy(context).defaultPreset;
  const base = presetDeclaration(preset).config;
  if (receipt.kind === "explicit") return { preset, overrides: { ...receipt.overrides }, moduleOverrides: receipt.moduleOverrides };
  if (receipt.kind === "migrated_snapshot") {
    const fields = requestedAssistanceFields(receipt, receipt.preset);
    const overrides = Object.fromEntries(ASSISTANCE_PREFERENCE_FIELDS.flatMap((field) => fields[field] === base[field] ? [] : [[field, fields[field]]])) as Partial<AssistancePreferenceFields>;
    return { preset, overrides, moduleOverrides: receipt.moduleOverrides };
  }
  return { preset, overrides: {}, moduleOverrides: EMPTY_MODULE_OVERRIDES };
}

/** Advanced: one raw field, recorded as an explicit choice even when it equals the projection (criterion 4 fixture A). */
export function setPreferenceField<F extends AssistancePreferenceField>(context: WorkflowContextId, receipt: WorkflowPreferenceReceipt, field: F, value: FieldValue<F>): WorkflowPreferenceV2 {
  fieldRank(field, value);
  const next = explicitBase(context, receipt);
  (next.overrides as Record<string, unknown>)[field] = value;
  return Object.freeze({ version: 2, assistanceHead: 4, intent: Object.freeze({ kind: "explicit", preset: next.preset, overrides: canonicalFields(next.overrides), moduleOverrides: next.moduleOverrides }) });
}

/** Advanced: include/exclude one configurable module relative to the preset (the Custom escape hatch). */
export function setPreferenceModule(context: WorkflowContextId, receipt: WorkflowPreferenceReceipt, moduleId: ConfigurableModuleId, enabled: boolean): WorkflowPreferenceV2 {
  if (!CONFIGURABLE_MODULE_IDS.includes(moduleId)) throw new PreferenceParseError("PREFERENCE_MODULE_AUTHORITY", "the rules floor is not configurable");
  const next = explicitBase(context, receipt);
  const inPreset = presetDeclaration(next.preset).modules.includes(moduleId);
  const include = next.moduleOverrides.include.filter((id) => id !== moduleId);
  const exclude = next.moduleOverrides.exclude.filter((id) => id !== moduleId);
  if (enabled && !inPreset) include.push(moduleId);
  if (!enabled && inPreset) exclude.push(moduleId);
  return Object.freeze({ version: 2, assistanceHead: 4, intent: Object.freeze({ kind: "explicit", preset: next.preset, overrides: canonicalFields(next.overrides), moduleOverrides: Object.freeze({ include: sortModules(include), exclude: sortModules(exclude) }) }) });
}
