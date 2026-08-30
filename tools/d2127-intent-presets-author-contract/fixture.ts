// DISPOSABLE executable author fixture — D2171-D2178. Not production code.
import { createHash } from "node:crypto";
import { MODULE_IDS, type ModuleId } from "../../packages/runtime/src/module-contract.js";

export const FIELDS = Object.freeze(["markers", "guided", "humanSplit", "corpus", "voice", "spoken", "boardLighting", "arrows", "ambient"] as const);
export type Field = (typeof FIELDS)[number];
export const PRESETS = Object.freeze(["quiet", "guided", "theory_only", "support", "analysis"] as const);
export type Preset = (typeof PRESETS)[number];
export const DOMAINS = Object.freeze({
  markers: ["off", "live"], guided: ["off", "live"], humanSplit: ["off", "on_request"],
  corpus: ["off", "on_request"], voice: ["authored", "persona"], spoken: ["off", "browser", "provider"],
  boardLighting: ["legal", "sight", "evidence"], arrows: ["off", "sight", "evidence"], ambient: ["off", "on"],
} as const satisfies Readonly<Record<Field, readonly string[]>>);

export type ConfigurableModuleId = Exclude<ModuleId, "rules_floor">;
export interface CustomModuleOverrides { readonly include: readonly ConfigurableModuleId[]; readonly exclude: readonly ConfigurableModuleId[] }
export type StoredIntent =
  | { readonly kind: "unset" }
  | { readonly kind: "explicit"; readonly preset: Preset; readonly overrides: Readonly<Partial<Record<Field, string>>>; readonly moduleOverrides: CustomModuleOverrides }
  | { readonly kind: "migrated_snapshot"; readonly preset: Preset; readonly config: Readonly<Record<Field, string>>; readonly sourceVersion: 1 | 2 | 3 | 4; readonly moduleOverrides: CustomModuleOverrides }
  | { readonly kind: "invalid_fallback"; readonly reason: "malformed" };
export interface PreferenceV2 { readonly version: 2; readonly assistanceHead: 4; readonly intent: StoredIntent }

const plain = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value);
const exactKeys = (value: Record<string, unknown>, keys: readonly string[]) => Object.keys(value).sort().join("\0") === [...keys].sort().join("\0");
const configurableIds = new Set<string>(MODULE_IDS.filter((id) => id !== "rules_floor"));
const parseModules = (value: unknown): CustomModuleOverrides => {
  if (!plain(value) || !exactKeys(value, ["include", "exclude"]) || !Array.isArray(value.include) || !Array.isArray(value.exclude)) throw new TypeError("PREFERENCE_MODULE_SHAPE");
  const both = [...value.include, ...value.exclude];
  if (both.some((id) => typeof id !== "string" || !configurableIds.has(id)) || new Set(both).size !== both.length) throw new TypeError("PREFERENCE_MODULE_AUTHORITY");
  return Object.freeze({ include: Object.freeze(value.include as ConfigurableModuleId[]), exclude: Object.freeze(value.exclude as ConfigurableModuleId[]) });
};
const parseOverrides = (value: unknown, complete = false): Readonly<Partial<Record<Field, string>>> => {
  if (!plain(value) || Object.keys(value).some((field) => !FIELDS.includes(field as Field)) || (complete && !exactKeys(value, FIELDS))) throw new TypeError("PREFERENCE_FIELDS");
  for (const [field, selected] of Object.entries(value)) if (!(DOMAINS[field as Field] as readonly unknown[]).includes(selected)) throw new TypeError("PREFERENCE_VALUE");
  return Object.freeze(Object.fromEntries(FIELDS.flatMap((field) => field in value ? [[field, value[field]]] : [])));
};

export function parsePreferenceV2(value: unknown): PreferenceV2 {
  if (!plain(value) || !exactKeys(value, ["version", "assistanceHead", "intent"]) || value.version !== 2 || value.assistanceHead !== 4 || !plain(value.intent) || typeof value.intent.kind !== "string") throw new TypeError("PREFERENCE_SHAPE");
  const raw = value.intent;
  let intent: StoredIntent;
  if (raw.kind === "unset" && exactKeys(raw, ["kind"])) intent = Object.freeze({ kind: "unset" });
  else if (raw.kind === "explicit" && exactKeys(raw, ["kind", "preset", "overrides", "moduleOverrides"]) && PRESETS.includes(raw.preset as Preset)) intent = Object.freeze({ kind: "explicit", preset: raw.preset as Preset, overrides: parseOverrides(raw.overrides), moduleOverrides: parseModules(raw.moduleOverrides) });
  else if (raw.kind === "migrated_snapshot" && exactKeys(raw, ["kind", "preset", "config", "sourceVersion", "moduleOverrides"]) && PRESETS.includes(raw.preset as Preset) && [1,2,3,4].includes(raw.sourceVersion as number)) intent = Object.freeze({ kind: "migrated_snapshot", preset: raw.preset as Preset, config: parseOverrides(raw.config, true) as Readonly<Record<Field,string>>, sourceVersion: raw.sourceVersion as 1|2|3|4, moduleOverrides: parseModules(raw.moduleOverrides) });
  else if (raw.kind === "invalid_fallback" && exactKeys(raw, ["kind", "reason"]) && raw.reason === "malformed") intent = Object.freeze({ kind: "invalid_fallback", reason: "malformed" });
  else throw new TypeError("PREFERENCE_INTENT");
  return Object.freeze({ version: 2, assistanceHead: 4, intent });
}

const order = new Map(MODULE_IDS.map((id, index) => [id, index]));
const sortModules = (ids: readonly ConfigurableModuleId[]) => [...ids].sort((left, right) => order.get(left)! - order.get(right)!);
const canonicalIntent = (intent: StoredIntent): StoredIntent => intent.kind === "explicit"
  ? { ...intent, overrides: Object.fromEntries(FIELDS.flatMap((field) => field in intent.overrides ? [[field, intent.overrides[field]]] : [])), moduleOverrides: { include: sortModules(intent.moduleOverrides.include), exclude: sortModules(intent.moduleOverrides.exclude) } }
  : intent.kind === "migrated_snapshot"
    ? { ...intent, config: Object.fromEntries(FIELDS.map((field) => [field, intent.config[field]])) as Readonly<Record<Field,string>>, moduleOverrides: { include: sortModules(intent.moduleOverrides.include), exclude: sortModules(intent.moduleOverrides.exclude) } }
    : intent;
export function serializePreferenceV2(value: PreferenceV2): string { const parsed = parsePreferenceV2(value); return JSON.stringify({ version: 2, assistanceHead: 4, intent: canonicalIntent(parsed.intent) }); }

const canonical = (value: unknown) => JSON.stringify(value);
export const digest = (value: unknown) => `sha256:${createHash("sha256").update(canonical(value)).digest("hex")}`;
export interface RequestedAssistanceV1 { readonly stage: "requested"; readonly schemaVersion: 1; readonly contextHint: string; readonly preference: PreferenceV2; readonly requestDigest: string }
export function compileRequest(contextHint: string, preference: PreferenceV2): RequestedAssistanceV1 {
  const body = { stage: "requested" as const, schemaVersion: 1 as const, contextHint, preference: parsePreferenceV2(preference) };
  return Object.freeze({ ...body, requestDigest: digest(body) });
}
export interface AuthoritativeAssistanceV1 { readonly stage: "authoritative"; readonly schemaVersion: 1; readonly context: string; readonly preset: Preset; readonly requestedDigest: string; readonly effectiveDigest: string; readonly modules: readonly ModuleId[]; readonly spoken: "off" | "browser" | "provider" }
export function authoritativeRequest(request: RequestedAssistanceV1, context: string): AuthoritativeAssistanceV1 {
  const { requestDigest, ...body } = request;
  if (request.contextHint !== context) throw new TypeError("CONTEXT_MISMATCH");
  if (requestDigest !== digest(body)) throw new TypeError("REQUEST_DIGEST");
  const preset = request.preference.intent.kind === "explicit" || request.preference.intent.kind === "migrated_snapshot" ? request.preference.intent.preset : "quiet";
  const effective = { stage: "authoritative" as const, schemaVersion: 1 as const, context, preset, requestedDigest: requestDigest, modules: ["rules_floor"] as readonly ModuleId[], spoken: "off" as const };
  return Object.freeze({ ...effective, effectiveDigest: digest(effective) });
}
export interface FinalizedAssistanceV1 { readonly stage: "finalized"; readonly schemaVersion: 1; readonly authoritativeDigest: string; readonly sourceDigest: string; readonly finalDigest: string; readonly modules: readonly ModuleId[]; readonly spoken: "off" | "browser" | "provider" }
export function finalizeEffects(value: AuthoritativeAssistanceV1, sourceDigest: string): FinalizedAssistanceV1 {
  const body = { stage: "finalized" as const, schemaVersion: 1 as const, authoritativeDigest: value.effectiveDigest, sourceDigest, modules: value.modules, spoken: value.spoken };
  return Object.freeze({ ...body, finalDigest: digest(body) });
}
export interface BrowserChannelReceiptV1 { readonly schemaVersion: 1; readonly generation: number; readonly browserSpeech: boolean; readonly receiptDigest: string }
export const browserReceipt = (generation: number, browserSpeech: boolean): BrowserChannelReceiptV1 => { const body = { schemaVersion: 1 as const, generation, browserSpeech }; return Object.freeze({ ...body, receiptDigest: digest(body) }); };
export function narrowBrowserChannels(value: FinalizedAssistanceV1, receipt: BrowserChannelReceiptV1) {
  const { receiptDigest, ...receiptBody } = receipt;
  if (receiptDigest !== digest(receiptBody)) throw new TypeError("BROWSER_RECEIPT_DIGEST");
  const spoken = value.spoken === "provider" ? (receipt.browserSpeech ? "browser" : "off") : value.spoken === "browser" && !receipt.browserSpeech ? "off" : value.spoken;
  return Object.freeze({ stage: "browser_narrowed", serverDigest: value.finalDigest, browserGeneration: receipt.generation, modules: value.modules, spoken, browserDigest: digest({ serverDigest: value.finalDigest, receiptDigest, spoken }) });
}

const overridesOf = (preference: PreferenceV2): CustomModuleOverrides => preference.intent.kind === "explicit" || preference.intent.kind === "migrated_snapshot" ? preference.intent.moduleOverrides : { include: [], exclude: [] };
export function requestedModules(base: readonly ModuleId[], preference: PreferenceV2, ceiling: readonly ModuleId[]): readonly ModuleId[] {
  const overrides = overridesOf(preference); const requested = new Set<ModuleId>(["rules_floor", ...base, ...overrides.include]);
  for (const id of overrides.exclude) requested.delete(id);
  const admitted = new Set(ceiling); admitted.add("rules_floor");
  return Object.freeze(MODULE_IDS.filter((id) => requested.has(id) && admitted.has(id)));
}
export function selectNamedPreset(preference: PreferenceV2, preset: Preset, retainedLowerOverrides: Readonly<Partial<Record<Field,string>>>): PreferenceV2 {
  parsePreferenceV2(preference);
  return parsePreferenceV2({ version: 2, assistanceHead: 4, intent: { kind: "explicit", preset, overrides: retainedLowerOverrides, moduleOverrides: { include: [], exclude: [] } } });
}

export function requireExecutableModuleAuthority(execution: unknown, bindings: unknown): void {
  if (!plain(execution) || !plain(bindings) || execution.completionClaim !== "executable" || bindings.completionClaim !== "registered_bindings") throw new TypeError("MODULE_AUTHORITY_NOT_ACCEPTED");
}
export interface SourceAlternative { readonly all: readonly string[] }
export type SourceState = "available" | "no_witness" | "pending" | "unavailable" | "failed";
export function effectSourceState(alternatives: readonly SourceAlternative[], states: Readonly<Record<string, SourceState>>): "deliver" | "honest_empty" | "suppress" {
  if (alternatives.some((alternative) => alternative.all.every((id) => states[id] === "available"))) return "deliver";
  if (alternatives.some((alternative) => alternative.all.every((id) => states[id] === "available" || states[id] === "no_witness"))) return "honest_empty";
  return "suppress";
}

export type Suppression =
  | { readonly kind: "module"; readonly moduleId: ModuleId; readonly requested: true; readonly effective: false; readonly reason: string }
  | { readonly kind: "field"; readonly field: Field; readonly requested: string; readonly effective: string; readonly reason: string }
  | { readonly kind: "effect"; readonly effectId: string; readonly moduleId: ModuleId; readonly requested: "enabled"; readonly effective: "disabled"; readonly reason: string }
  | { readonly kind: "preference_recovery"; readonly reason: "malformed" | "storage_unavailable" };
export function renderSuppression(value: Suppression): string {
  if (value.kind === "module") return `${value.moduleId} was removed: ${value.reason}.`;
  if (value.kind === "field") return `${value.field} was reduced from ${value.requested} to ${value.effective}: ${value.reason}.`;
  if (value.kind === "effect") return `${value.effectId} was unavailable: ${value.reason}.`;
  return value.reason === "malformed" ? "Saved help preferences were invalid, so safe defaults are active." : "Saved help preferences could not be read, so safe defaults are active.";
}

export function loadWithLegacyPrecedence(v2: unknown, legacy: unknown): PreferenceV2 | "invalid_v2" | "migrate_legacy" {
  if (v2 !== undefined) { try { return parsePreferenceV2(v2); } catch { return "invalid_v2"; } }
  return legacy === undefined ? "migrate_legacy" : "migrate_legacy";
}
export const SHARED_RESOURCE_REQUIREMENTS = Object.freeze(["workflow-preference", "assistance-exchange", "assistance-permission"] as const);
export function campaignContext(): never { throw new TypeError("CONTEXT_DECLARED_AWAITING"); }
