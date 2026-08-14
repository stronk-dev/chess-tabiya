import { SILENT_ASSISTANCE, type AssistanceConfig, type RunSessionKind } from "@chess-tabiya/runtime";

export interface PreferenceStorage { getItem(key: string): string | null; setItem(key: string, value: string): void; }
export function assistanceKey(kind: RunSessionKind): string { return `tabiya.assistance.v1.${kind}`; }
function validV2(value: unknown): value is AssistanceConfig {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  return item.version === 2 && ["off", "live"].includes(item.markers as string) && ["off", "live"].includes(item.guided as string) && ["off", "on_request"].includes(item.humanSplit as string) && ["off", "on_request"].includes(item.corpus as string) && ["authored", "persona"].includes(item.voice as string);
}
export function loadAssistance(kind: RunSessionKind, storage?: PreferenceStorage): AssistanceConfig {
  if (storage === undefined) return SILENT_ASSISTANCE;
  try { const raw = storage.getItem(assistanceKey(kind)); if (raw === null) return SILENT_ASSISTANCE; const parsed: unknown = JSON.parse(raw); if (validV2(parsed)) return Object.freeze({ ...parsed }); if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) { const item = parsed as Record<string, unknown>; if (item.version === 1 && ["off", "live"].includes(item.markers as string) && ["off", "live"].includes(item.guided as string) && ["off", "on_request"].includes(item.humanSplit as string) && ["authored", "persona"].includes(item.voice as string)) return Object.freeze({ ...item, version: 2, corpus: "off" }) as AssistanceConfig; } return SILENT_ASSISTANCE; } catch { return SILENT_ASSISTANCE; }
}
export function saveAssistance(kind: RunSessionKind, value: AssistanceConfig, storage?: PreferenceStorage): void { storage?.setItem(assistanceKey(kind), JSON.stringify(value)); }
