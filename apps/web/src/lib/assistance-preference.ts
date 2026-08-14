import { SILENT_ASSISTANCE, type AssistanceConfig, type RunSessionKind } from "@chess-tabiya/runtime";

export interface PreferenceStorage { getItem(key: string): string | null; setItem(key: string, value: string): void; }
export function assistanceKey(kind: RunSessionKind): string { return `tabiya.assistance.v1.${kind}`; }
function valid(value: unknown): value is AssistanceConfig {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  return item.version === 1 && ["off", "live"].includes(item.markers as string) && ["off", "live"].includes(item.guided as string) && ["off", "on_request"].includes(item.humanSplit as string) && ["authored", "persona"].includes(item.voice as string);
}
export function loadAssistance(kind: RunSessionKind, storage?: PreferenceStorage): AssistanceConfig {
  if (storage === undefined) return SILENT_ASSISTANCE;
  try { const raw = storage.getItem(assistanceKey(kind)); if (raw === null) return SILENT_ASSISTANCE; const parsed: unknown = JSON.parse(raw); return valid(parsed) ? Object.freeze({ ...parsed }) : SILENT_ASSISTANCE; } catch { return SILENT_ASSISTANCE; }
}
export function saveAssistance(kind: RunSessionKind, value: AssistanceConfig, storage?: PreferenceStorage): void { storage?.setItem(assistanceKey(kind), JSON.stringify(value)); }
