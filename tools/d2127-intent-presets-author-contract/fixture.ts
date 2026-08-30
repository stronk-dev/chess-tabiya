// DISPOSABLE executable author fixture — D2127-D2134. Not production code.
import { createHash } from "node:crypto";
import { MODULE_IDS, type ModuleId } from "../../packages/runtime/src/module-contract.js";

export const FIELDS = Object.freeze([
  "markers", "guided", "humanSplit", "corpus", "voice", "spoken",
  "boardLighting", "arrows", "ambient",
] as const);
export type Field = (typeof FIELDS)[number];
export const PRESETS = Object.freeze(["quiet", "guided", "theory_only", "support", "analysis"] as const);
export type Preset = (typeof PRESETS)[number];
export const DOMAINS = Object.freeze({
  markers: ["off", "live"], guided: ["off", "live"], humanSplit: ["off", "on_request"],
  corpus: ["off", "on_request"], voice: ["authored", "persona"],
  spoken: ["off", "browser", "provider"], boardLighting: ["legal", "sight", "evidence"],
  arrows: ["off", "sight", "evidence"], ambient: ["off", "on"],
} as const satisfies Readonly<Record<Field, readonly string[]>>);

export interface PreferenceV2 {
  readonly version: 2; readonly assistanceHead: 4; readonly preset: Preset;
  readonly overrides: Readonly<Partial<Record<Field, string>>>;
  readonly moduleOverrides: { readonly include: readonly ModuleId[]; readonly exclude: readonly ModuleId[] };
}
const plain = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value);
const exactKeys = (value: Record<string, unknown>, keys: readonly string[]) =>
  Object.keys(value).sort().join("\0") === [...keys].sort().join("\0");
const moduleIds = new Set<string>(MODULE_IDS);

export function parsePreferenceV2(value: unknown): PreferenceV2 {
  if (!plain(value) || !exactKeys(value, ["version", "assistanceHead", "preset", "overrides", "moduleOverrides"])) throw new TypeError("PREFERENCE_SHAPE");
  if (value.version !== 2 || value.assistanceHead !== 4 || !PRESETS.includes(value.preset as Preset)) throw new TypeError("PREFERENCE_IDENTITY");
  if (!plain(value.overrides) || Object.keys(value.overrides).some((field) => !FIELDS.includes(field as Field))) throw new TypeError("PREFERENCE_FIELDS");
  for (const [field, selected] of Object.entries(value.overrides)) if (!(DOMAINS[field as Field] as readonly unknown[]).includes(selected)) throw new TypeError("PREFERENCE_VALUE");
  if (!plain(value.moduleOverrides) || !exactKeys(value.moduleOverrides, ["include", "exclude"])) throw new TypeError("PREFERENCE_MODULE_SHAPE");
  const include = value.moduleOverrides.include, exclude = value.moduleOverrides.exclude;
  if (!Array.isArray(include) || !Array.isArray(exclude)) throw new TypeError("PREFERENCE_MODULE_LIST");
  const both = [...include, ...exclude];
  if (both.some((id) => typeof id !== "string" || !moduleIds.has(id)) || new Set(both).size !== both.length) throw new TypeError("PREFERENCE_MODULE_AUTHORITY");
  return Object.freeze({
    version: 2, assistanceHead: 4, preset: value.preset as Preset,
    overrides: Object.freeze(Object.fromEntries(FIELDS.flatMap((field) => field in value.overrides! ? [[field, (value.overrides as Record<string, unknown>)[field]]] : []))),
    moduleOverrides: Object.freeze({ include: Object.freeze(include as ModuleId[]), exclude: Object.freeze(exclude as ModuleId[]) }),
  });
}

export function serializePreferenceV2(value: PreferenceV2): string {
  const parsed = parsePreferenceV2(value);
  const order = new Map(MODULE_IDS.map((id, index) => [id, index]));
  const sorted = (ids: readonly ModuleId[]) => [...ids].sort((left, right) => order.get(left)! - order.get(right)!);
  return JSON.stringify({
    version: 2, assistanceHead: 4, preset: parsed.preset,
    overrides: Object.fromEntries(FIELDS.flatMap((field) => field in parsed.overrides ? [[field, parsed.overrides[field]]] : [])),
    moduleOverrides: { include: sorted(parsed.moduleOverrides.include), exclude: sorted(parsed.moduleOverrides.exclude) },
  });
}

const canonical = (value: unknown) => JSON.stringify(value);
export const digest = (value: unknown) => `sha256:${createHash("sha256").update(canonical(value)).digest("hex")}`;
export function compileRequest(contextHint: string, preference: PreferenceV2) {
  return Object.freeze({ schemaVersion: 1, contextHint, preference, requestDigest: digest({ schemaVersion: 1, contextHint, preference }) });
}
export function authoritativeRequest(request: ReturnType<typeof compileRequest>, context: string) {
  if (request.contextHint !== context) throw new TypeError("CONTEXT_MISMATCH");
  if (request.requestDigest !== digest({ schemaVersion: 1, contextHint: request.contextHint, preference: request.preference })) throw new TypeError("REQUEST_DIGEST");
  return Object.freeze({ context, preset: request.preference.preset, requestedDigest: request.requestDigest });
}

export function narrowBrowserChannels<T extends { readonly modules: readonly ModuleId[]; readonly spoken: "off" | "browser" | "provider" }>(result: T, browserSpeech: boolean) {
  const spoken = result.spoken === "provider" ? (browserSpeech ? "browser" : "off")
    : result.spoken === "browser" && !browserSpeech ? "off" : result.spoken;
  return Object.freeze({ ...result, modules: result.modules, spoken, browserDigest: digest({ server: result, spoken }) });
}

export function requestedModules(base: readonly ModuleId[], preference: PreferenceV2, ceiling: readonly ModuleId[]): readonly ModuleId[] {
  const requested = new Set<ModuleId>([...base, ...preference.moduleOverrides.include]);
  for (const id of preference.moduleOverrides.exclude) requested.delete(id);
  const admitted = new Set(ceiling);
  return Object.freeze(MODULE_IDS.filter((id) => requested.has(id) && admitted.has(id)));
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
  | { readonly kind: "effect"; readonly effectId: string; readonly moduleId: ModuleId; readonly requested: "enabled"; readonly effective: "disabled"; readonly reason: string };
export function renderSuppression(value: Suppression): string {
  if (value.kind === "module") return `${value.moduleId} was removed: ${value.reason}.`;
  if (value.kind === "field") return `${value.field} was reduced from ${value.requested} to ${value.effective}: ${value.reason}.`;
  return `${value.effectId} was unavailable: ${value.reason}.`;
}

export function loadWithLegacyPrecedence(v2: unknown, legacy: unknown): PreferenceV2 | "invalid_v2" | "migrate_legacy" {
  if (v2 !== undefined) { try { return parsePreferenceV2(v2); } catch { return "invalid_v2"; } }
  return legacy === undefined ? "migrate_legacy" : "migrate_legacy";
}
export function campaignContext(): never { throw new TypeError("CONTEXT_DECLARED_AWAITING"); }
