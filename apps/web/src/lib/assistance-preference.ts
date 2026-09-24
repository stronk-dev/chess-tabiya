import {
  ASSISTANCE_PREFERENCE_FIELDS,
  EMPTY_MODULE_OVERRIDES,
  PRESET_IDS,
  WORKFLOW_CONTEXTS,
  deriveWorkflowContext,
  parseWorkflowPreferenceV2,
  presetDeclaration,
  requestedAssistanceFields,
  requestedPreset,
  serializeWorkflowPreferenceV2,
  workflowContextPolicy,
  type AssistanceConfig,
  type AssistancePreferenceFields,
  type PresetId,
  type WorkflowContextId,
  type WorkflowPreferenceReceipt,
  type WorkflowPreferenceV2,
} from "@chess-tabiya/runtime";

// rfc/intent-presets.md §5.3/§6 — the one browser-local preference authority. New writes go only to
// `tabiya.workflow.v2.${context}`; the v1 workflow and assistance keys are read-only migration inputs.

export const ASSISTANCE_PROFILES = WORKFLOW_CONTEXTS;
export type AssistanceProfile = WorkflowContextId;
export const assistanceProfile = deriveWorkflowContext;

export interface PreferenceStorage { getItem(key: string): string | null; setItem(key: string, value: string): void; }

export function workflowPreferenceKey(context: WorkflowContextId): string { return `tabiya.workflow.v2.${context}`; }
const legacyAssistanceKey = (context: WorkflowContextId): string => `tabiya.assistance.v1.${context}`;
const legacyWorkflowKey = (context: WorkflowContextId): string => `tabiya.workflow.v1.${context}`;

type Legacy = { readonly kind: "absent" } | { readonly kind: "malformed" } | { readonly kind: "value"; readonly value: unknown };
function readLegacy(storage: PreferenceStorage, key: string): Legacy {
  const raw = storage.getItem(key);
  if (raw === null) return { kind: "absent" };
  try { return { kind: "value", value: JSON.parse(raw) as unknown }; } catch { return { kind: "malformed" }; }
}

const plain = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value);
const oneOf = (value: unknown, domain: readonly string[]): boolean => typeof value === "string" && domain.includes(value);

/** Private migration helper: the shipped v1–v4 value migration, preserved byte-for-byte. */
function migrateLegacyAssistance(value: unknown): { readonly config: AssistanceConfig; readonly sourceVersion: 1 | 2 | 3 | 4 } | undefined {
  if (!plain(value)) return undefined;
  const item = value;
  const base = oneOf(item.markers, ["off", "live"]) && oneOf(item.guided, ["off", "live"]) && oneOf(item.humanSplit, ["off", "on_request"]) && oneOf(item.voice, ["authored", "persona"]);
  if (!base) return undefined;
  const pick = (fields: Record<string, unknown>) => Object.freeze(Object.fromEntries([["version", 4], ...ASSISTANCE_PREFERENCE_FIELDS.map((field) => [field, fields[field]])])) as unknown as AssistanceConfig;
  if (item.version === 4 && oneOf(item.corpus, ["off", "on_request"]) && oneOf(item.spoken, ["off", "browser", "provider"]) && oneOf(item.boardLighting, ["off", "legal", "sight", "evidence"]) && oneOf(item.arrows, ["off", "sight", "evidence"]) && oneOf(item.ambient, ["off", "on"])) return { config: pick(item), sourceVersion: 4 };
  if (item.version === 3 && oneOf(item.corpus, ["off", "on_request"]) && oneOf(item.spoken, ["off", "on"])) return { config: pick({ ...item, spoken: item.spoken === "on" ? "browser" : "off", boardLighting: "legal", arrows: "off", ambient: "off" }), sourceVersion: 3 };
  if (item.version === 2 && oneOf(item.corpus, ["off", "on_request"])) return { config: pick({ ...item, spoken: "off", boardLighting: "legal", arrows: "off", ambient: "off" }), sourceVersion: 2 };
  if (item.version === 1) return { config: pick({ ...item, corpus: "off", spoken: "off", boardLighting: "legal", arrows: "off", ambient: "off" }), sourceVersion: 1 };
  return undefined;
}

function migrateLegacy(context: WorkflowContextId, storage: PreferenceStorage): WorkflowPreferenceV2["intent"] {
  const workflow = readLegacy(storage, legacyWorkflowKey(context));
  const assistance = readLegacy(storage, legacyAssistanceKey(context));
  if (workflow.kind === "absent" && assistance.kind === "absent") return { kind: "unset" };
  let preset: PresetId | undefined;
  if (workflow.kind === "malformed") return { kind: "invalid_fallback", reason: "malformed" };
  if (workflow.kind === "value") {
    const item = workflow.value;
    if (!plain(item) || item.version !== 1 || !oneOf(item.preset, PRESET_IDS) || !workflowContextPolicy(context).allowedPresets.includes(item.preset as PresetId)) return { kind: "invalid_fallback", reason: "malformed" };
    preset = item.preset as PresetId;
  }
  if (assistance.kind === "malformed") return { kind: "invalid_fallback", reason: "malformed" };
  if (assistance.kind === "value") {
    const migrated = migrateLegacyAssistance(assistance.value);
    if (migrated === undefined) return { kind: "invalid_fallback", reason: "malformed" };
    return { kind: "migrated_snapshot", preset: preset ?? workflowContextPolicy(context).defaultPreset, config: migrated.config, sourceVersion: migrated.sourceVersion, moduleOverrides: EMPTY_MODULE_OVERRIDES };
  }
  return { kind: "explicit", preset: preset!, overrides: {}, moduleOverrides: EMPTY_MODULE_OVERRIDES };
}

/**
 * Loads the typed receipt. A valid v2 value always wins; an invalid v2 value is a visible recovery and
 * never resurrects legacy bytes; with no v2 value, the total one-way migration runs and the first
 * successful load seals the canonical v2 value with the SAME intent arm (an `unset` with no legacy
 * input is already exact and is not written).
 */
export function loadWorkflowPreference(context: WorkflowContextId, storage?: PreferenceStorage): WorkflowPreferenceReceipt {
  if (storage === undefined) return Object.freeze({ kind: "unset" });
  try {
    const raw = storage.getItem(workflowPreferenceKey(context));
    if (raw !== null) {
      try { return parseWorkflowPreferenceV2(JSON.parse(raw)).intent; } catch { return Object.freeze({ kind: "invalid_fallback", reason: "malformed" }); }
    }
    const intent = migrateLegacy(context, storage);
    const sealed = parseWorkflowPreferenceV2({ version: 2, assistanceHead: 4, intent });
    // Nothing to migrate: `unset` is already exact and a read-only visit writes no local bytes.
    if (intent.kind === "unset") return sealed.intent;
    try { storage.setItem(workflowPreferenceKey(context), serializeWorkflowPreferenceV2(sealed)); } catch { /* the receipt is still exact; the next load retries the seal */ }
    return sealed.intent;
  } catch {
    return Object.freeze({ kind: "invalid_fallback", reason: "storage_unavailable" });
  }
}

/** The only writer. Returns false (never a false success) when the browser refuses the write. */
export function saveWorkflowPreference(context: WorkflowContextId, value: WorkflowPreferenceV2, storage?: PreferenceStorage): boolean {
  const serialized = serializeWorkflowPreferenceV2(value);
  if (storage === undefined) return false;
  try { storage.setItem(workflowPreferenceKey(context), serialized); return true; } catch { return false; }
}

/** The requested (pre-server) nine fields, for Advanced editors and non-run surfaces. */
export function requestedAssistanceConfig(context: WorkflowContextId, receipt: WorkflowPreferenceReceipt): AssistanceConfig {
  const preset = requestedPreset(receipt, context) ?? workflowContextPolicy(context).defaultPreset;
  const fields: AssistancePreferenceFields = requestedAssistanceFields(receipt, preset);
  return Object.freeze({ version: 4, ...fields });
}

/** The pill's pre-server identity: the learner's own requested preset label, never a wider promise. */
export function requestedPresetLabel(context: WorkflowContextId, receipt: WorkflowPreferenceReceipt): string {
  return presetDeclaration(requestedPreset(receipt, context) ?? workflowContextPolicy(context).defaultPreset).label;
}
