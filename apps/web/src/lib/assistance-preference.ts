import { SILENT_ASSISTANCE, type AssistanceConfig, type RunFeedbackPolicy, type RunSessionKind } from "@chess-tabiya/runtime";
import type { SessionKind } from "./api.js";

export const ASSISTANCE_PROFILES = Object.freeze(["pack", "position", "imported", "match", "stream", "onramp"] as const);
export type AssistanceProfile = (typeof ASSISTANCE_PROFILES)[number];

export function assistanceProfile(input: { readonly sessionKind: RunSessionKind; readonly feedbackPolicy: RunFeedbackPolicy; readonly liveKind?: SessionKind | undefined }): AssistanceProfile {
  if (input.feedbackPolicy === "immediate_guard") return "onramp";
  if (input.liveKind === "stream") return "stream";
  if (input.liveKind === "match") return "match";
  return input.sessionKind;
}

export interface PreferenceStorage { getItem(key: string): string | null; setItem(key: string, value: string): void; }
export function assistanceKey(kind: AssistanceProfile): string { return `tabiya.assistance.v1.${kind}`; }
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
  if (storage === undefined) return SILENT_ASSISTANCE;
  try { const raw = storage.getItem(assistanceKey(kind)); if (raw === null) return SILENT_ASSISTANCE; return migrate(JSON.parse(raw)) ?? SILENT_ASSISTANCE; } catch { return SILENT_ASSISTANCE; }
}
export function saveAssistance(kind: AssistanceProfile, value: AssistanceConfig, storage?: PreferenceStorage): void { storage?.setItem(assistanceKey(kind), JSON.stringify(value)); }
