import { PRESET_IDS, SILENT_ASSISTANCE, WORKFLOW_CONTEXTS, deriveWorkflowContext, workflowContextPolicy, type AssistanceConfig, type PresetId, type WorkflowContextId } from "@chess-tabiya/runtime";

export const ASSISTANCE_PROFILES = WORKFLOW_CONTEXTS;
export type AssistanceProfile = WorkflowContextId;
export const assistanceProfile = deriveWorkflowContext;
export const PROFILE_DEFAULTS: Readonly<Record<AssistanceProfile, AssistanceConfig>> = Object.freeze({
  pack: SILENT_ASSISTANCE,
  position: SILENT_ASSISTANCE,
  imported: SILENT_ASSISTANCE,
  match: SILENT_ASSISTANCE,
  stream: SILENT_ASSISTANCE,
  academy: SILENT_ASSISTANCE,
  onramp: Object.freeze({ ...SILENT_ASSISTANCE, guided: "live" }),
  campaign: SILENT_ASSISTANCE,
});

export interface PreferenceStorage { getItem(key: string): string | null; setItem(key: string, value: string): void; }
export function assistanceKey(kind: AssistanceProfile): string { return `tabiya.assistance.v1.${kind}`; }
export function workflowKey(kind: AssistanceProfile): string { return `tabiya.workflow.v1.${kind}`; }
export function loadWorkflowPreset(kind: AssistanceProfile, storage?: PreferenceStorage): PresetId {
  const fallback = workflowContextPolicy(kind).defaultPreset;
  if (storage === undefined) return fallback;
  try {
    const raw = storage.getItem(workflowKey(kind));
    if (raw === null) return fallback;
    const value = JSON.parse(raw) as unknown;
    if (value === null || typeof value !== "object" || Array.isArray(value)) return fallback;
    const item = value as Record<string, unknown>;
    return item.version === 1 && PRESET_IDS.includes(item.preset as PresetId) && workflowContextPolicy(kind).allowedPresets.includes(item.preset as PresetId)
      ? item.preset as PresetId
      : fallback;
  } catch {
    return fallback;
  }
}
export function saveWorkflowPreset(kind: AssistanceProfile, preset: PresetId, storage?: PreferenceStorage): void {
  if (!workflowContextPolicy(kind).allowedPresets.includes(preset)) throw new TypeError(`Preset ${preset} is unavailable in ${kind}`);
  storage?.setItem(workflowKey(kind), JSON.stringify({ version: 1, preset }));
}
function validV4(value: unknown): value is AssistanceConfig {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  return item.version === 4 && ["off", "live"].includes(item.markers as string) && ["off", "live"].includes(item.guided as string) && ["off", "on_request"].includes(item.humanSplit as string) && ["off", "on_request"].includes(item.corpus as string) && ["authored", "persona"].includes(item.voice as string) && ["off", "browser", "provider"].includes(item.spoken as string) && ["off", "legal", "sight", "evidence"].includes(item.boardLighting as string) && ["off", "sight", "evidence"].includes(item.arrows as string) && ["off", "on"].includes(item.ambient as string);
}
function migrate(value: unknown): AssistanceConfig | undefined {
  if (validV4(value)) return Object.freeze({ ...value });
  if (value === null || typeof value !== "object" || Array.isArray(value)) return undefined;
  const item = value as Record<string, unknown>;
  if (item.version === 3 && ["off", "live"].includes(item.markers as string) && ["off", "live"].includes(item.guided as string) && ["off", "on_request"].includes(item.humanSplit as string) && ["off", "on_request"].includes(item.corpus as string) && ["authored", "persona"].includes(item.voice as string) && ["off", "on"].includes(item.spoken as string)) return Object.freeze({ ...item, version: 4, spoken: item.spoken === "on" ? "browser" : "off", boardLighting: "legal", arrows: "off", ambient: "off" }) as AssistanceConfig;
  if (item.version === 2 && ["off", "live"].includes(item.markers as string) && ["off", "live"].includes(item.guided as string) && ["off", "on_request"].includes(item.humanSplit as string) && ["off", "on_request"].includes(item.corpus as string) && ["authored", "persona"].includes(item.voice as string)) return Object.freeze({ ...item, version: 4, spoken: "off", boardLighting: "legal", arrows: "off", ambient: "off" }) as AssistanceConfig;
  if (item.version === 1 && ["off", "live"].includes(item.markers as string) && ["off", "live"].includes(item.guided as string) && ["off", "on_request"].includes(item.humanSplit as string) && ["authored", "persona"].includes(item.voice as string)) return Object.freeze({ ...item, version: 4, corpus: "off", spoken: "off", boardLighting: "legal", arrows: "off", ambient: "off" }) as AssistanceConfig;
  return undefined;
}
export function loadAssistance(kind: AssistanceProfile, storage?: PreferenceStorage): AssistanceConfig {
  const fallback = PROFILE_DEFAULTS[kind];
  if (storage === undefined) return fallback;
  try { const raw = storage.getItem(assistanceKey(kind)); if (raw === null) return fallback; return migrate(JSON.parse(raw)) ?? fallback; } catch { return fallback; }
}
export function saveAssistance(kind: AssistanceProfile, value: AssistanceConfig, storage?: PreferenceStorage): void { storage?.setItem(assistanceKey(kind), JSON.stringify(value)); }
