import { accessPermission, type AssistanceAccess, type AssistanceConfig } from "./assistance.js";
import { MODULE_IDS, type ModuleId, type ModuleTiming } from "./module-contract.js";
import {
  ASSISTANCE_FIELD_DOMAINS,
  ASSISTANCE_PREFERENCE_FIELDS,
  WORKFLOW_CONTEXTS,
  clampFieldValue,
  contextClamp,
  deriveWorkflowContext,
  fieldRank,
  hintCeiling,
  parseWorkflowPreferenceV2,
  permissionCeiling,
  pointwiseMin,
  preferenceDisplayMode,
  presetDeclaration,
  requestedAssistanceFields,
  requestedModules,
  requestedPreset,
  workflowContextPolicy,
  HINT_RUNGS,
  PRESET_IDS,
  type AssistancePreferenceField,
  type AssistancePreferenceFields,
  type ConfigClamp,
  type HintRung,
  type OrdinaryWorkflowContextId,
  type OrdinaryWorkflowContextOrigin,
  type PresetId,
  type WorkflowContextId,
  type WorkflowPreferenceReceipt,
} from "./presets.js";

// rfc/intent-presets.md §5 / third author repair — ONE pipeline, four non-interchangeable stages:
// requested (browser) → authoritative (server) → finalized (server) → browser-narrowed (browser).
// Every stage carries a literal discriminator and the prior stage's digest; `compileAssistance`
// (the deleted monolith) does not exist.

// ---------------------------------------------------------------------------------------------
// Canonical JSON + synchronous SHA-256 (browser and server compute identical digests).

function canonicalJson(value: unknown): string {
  if (value === null || typeof value === "boolean" || typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError("canonical JSON numbers must be finite");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).filter(([, item]) => item !== undefined).sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0);
    return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`).join(",")}}`;
  }
  throw new TypeError(`canonical JSON cannot encode ${typeof value}`);
}

const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

/** FIPS 180-4 SHA-256 over UTF-8, synchronous so both stages can seal inside pure functions. */
export function sha256Hex(text: string): string {
  const bytes = new TextEncoder().encode(text);
  const length = bytes.length;
  const padded = new Uint8Array(((length + 9 + 63) >> 6) << 6);
  padded.set(bytes);
  padded[length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(padded.length - 8, Math.floor(length / 0x20000000));
  view.setUint32(padded.length - 4, (length << 3) >>> 0);
  const h = new Uint32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]);
  const w = new Uint32Array(64);
  const rotr = (x: number, n: number) => (x >>> n) | (x << (32 - n));
  for (let offset = 0; offset < padded.length; offset += 64) {
    for (let i = 0; i < 16; i += 1) w[i] = view.getUint32(offset + i * 4);
    for (let i = 16; i < 64; i += 1) {
      const a = w[i - 15]!, b = w[i - 2]!;
      const s0 = rotr(a, 7) ^ rotr(a, 18) ^ (a >>> 3);
      const s1 = rotr(b, 17) ^ rotr(b, 19) ^ (b >>> 10);
      w[i] = (w[i - 16]! + s0 + w[i - 7]! + s1) >>> 0;
    }
    let [a, b, c, d, e, f, g, hh] = [h[0]!, h[1]!, h[2]!, h[3]!, h[4]!, h[5]!, h[6]!, h[7]!];
    for (let i = 0; i < 64; i += 1) {
      const t1 = (hh + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) + ((e & f) ^ (~e & g)) + K[i]! + w[i]!) >>> 0;
      const t2 = ((rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) >>> 0;
      hh = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    h[0] = (h[0]! + a) >>> 0; h[1] = (h[1]! + b) >>> 0; h[2] = (h[2]! + c) >>> 0; h[3] = (h[3]! + d) >>> 0;
    h[4] = (h[4]! + e) >>> 0; h[5] = (h[5]! + f) >>> 0; h[6] = (h[6]! + g) >>> 0; h[7] = (h[7]! + hh) >>> 0;
  }
  return [...h].map((word) => word.toString(16).padStart(8, "0")).join("");
}

export type AssistanceDigest = `sha256:${string}`;
export function assistanceDigest(value: unknown): AssistanceDigest {
  return `sha256:${sha256Hex(canonicalJson(value))}`;
}

// ---------------------------------------------------------------------------------------------
// Errors.

export const ASSISTANCE_EXCHANGE_ERROR_CODES = Object.freeze([
  "EXCHANGE_SHAPE_INVALID", "EXCHANGE_STAGE_MISMATCH", "EXCHANGE_DIGEST_MISMATCH",
  "CONTEXT_MISMATCH", "CONTEXT_DECLARED_AWAITING", "PRESET_NOT_ALLOWED",
  "MODULE_AUTHORITY_NOT_ACCEPTED", "BROWSER_WIDENING", "SUPPRESSION_INVALID",
] as const);
export type AssistanceExchangeErrorCode = (typeof ASSISTANCE_EXCHANGE_ERROR_CODES)[number];

export class AssistanceExchangeError extends TypeError {
  readonly code: AssistanceExchangeErrorCode;
  constructor(code: AssistanceExchangeErrorCode, message: string) {
    super(`${code}: ${message}`);
    this.name = "AssistanceExchangeError";
    this.code = code;
  }
}

const fail = (code: AssistanceExchangeErrorCode, message: string): never => { throw new AssistanceExchangeError(code, message); };
const plain = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value);
const exactKeys = (value: Record<string, unknown>, keys: readonly string[]): boolean =>
  Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));

// ---------------------------------------------------------------------------------------------
// Availability receipts (§5.3). The browser reports only output-channel readiness; the server
// owns chess-evidence source state.

export type AvailabilityState =
  | { readonly state: "pending" }
  | { readonly state: "available" }
  | { readonly state: "unavailable"; readonly reason: string }
  | { readonly state: "failed"; readonly reason: string };
export const SERVER_EVIDENCE_SOURCES = Object.freeze(["llm", "tts", "stockfish", "syzygy", "maia", "explorer"] as const);
export type ServerEvidenceSource = (typeof SERVER_EVIDENCE_SOURCES)[number];
export type ServerEvidenceAvailabilityReceipt = Readonly<Record<ServerEvidenceSource, AvailabilityState>>;

export interface ServerAssistanceAuthority {
  readonly origin: OrdinaryWorkflowContextOrigin;
  readonly access: AssistanceAccess;
  readonly availability: ServerEvidenceAvailabilityReceipt;
}

// ---------------------------------------------------------------------------------------------
// Suppression records and their closed renderers (§5).

export type SuppressionReason =
  | "context_forbids_module" | "role_forbids_module" | "delivery_closed"
  | "explicitly_disabled" | "context_clamped_field" | "access_clamped_field"
  | "source_pending" | "source_unavailable" | "source_failed"
  | "browser_channel_unavailable" | "invalid_preference_recovered";
export const SUPPRESSION_REASONS: readonly SuppressionReason[] = Object.freeze([
  "context_forbids_module", "role_forbids_module", "delivery_closed",
  "explicitly_disabled", "context_clamped_field", "access_clamped_field",
  "source_pending", "source_unavailable", "source_failed",
  "browser_channel_unavailable", "invalid_preference_recovered",
]);

export type EffectSubSurface = "human_split" | "raw_corpus";
export type EffectArm = "ambient" | "proactive" | "automatic" | "on_request" | "explicit_mode";
export interface CompiledAssistanceEffect {
  readonly effectId: string;
  readonly moduleId: ModuleId;
  readonly timing: ModuleTiming;
  readonly arm: EffectArm;
  readonly subSurface?: EffectSubSurface;
}
export type EffectSourceAlternative = readonly ServerEvidenceSource[];

export type SuppressionRecord =
  | { readonly kind: "module"; readonly moduleId: ModuleId;
      readonly requested: true; readonly effective: false;
      readonly by: "context_ceiling" | "access" | "stored_choice";
      readonly reason: SuppressionReason }
  | { readonly kind: "field"; readonly field: AssistancePreferenceField;
      readonly requested: AssistancePreferenceFields[AssistancePreferenceField];
      readonly effective: AssistancePreferenceFields[AssistancePreferenceField];
      // "source_availability" added 2026-09-24: §5.3's voice/spoken fallbacks had no `by` to carry.
      readonly by: "context_ceiling" | "access" | "stored_choice" | "source_availability" | "browser_channel";
      readonly reason: SuppressionReason }
  | { readonly kind: "effect"; readonly effectId: string;
      readonly moduleId: ModuleId; readonly requested: "enabled"; readonly effective: "disabled";
      readonly by: "source_availability"; readonly reason: SuppressionReason;
      readonly failedAlternatives: readonly EffectSourceAlternative[] }
  | { readonly kind: "preference_recovery";
      readonly reason: "malformed" | "storage_unavailable" };

// ---------------------------------------------------------------------------------------------
// The effect catalogue and the closed nine-field adapter (§5, criteria 18–19).

const effect = (moduleId: ModuleId, timing: ModuleTiming, arm: EffectArm, subSurface?: EffectSubSurface): CompiledAssistanceEffect =>
  Object.freeze({ effectId: `${moduleId}:${timing}:${arm}${subSurface === undefined ? "" : `:${subSurface}`}`, moduleId, timing, arm, ...(subSurface === undefined ? {} : { subSurface }) });

/** Transcribed from rfc/learner-modules.md §4's timing (initiative) column — see MODULE_PRESENTATION_SOURCE. */
export const MODULE_EFFECT_CATALOG: readonly CompiledAssistanceEffect[] = Object.freeze([
  effect("rules_floor", "pre_commit", "ambient"),
  effect("sight_on_request", "pre_commit", "on_request"),
  effect("blunder_prevention", "at_commit", "proactive"),
  effect("threat_radar", "pre_commit", "on_request"),
  effect("threat_radar", "post_commit", "on_request"),
  effect("postcommit_nudge", "post_commit", "automatic"),
  effect("structure_nudge", "post_commit", "automatic"),
  effect("structure_nudge", "post_commit", "on_request"),
  effect("theory_breadcrumb", "post_commit", "on_request"),
  effect("guided_hint", "checkpoint", "on_request"),
  effect("compare_coach", "checkpoint", "on_request"),
  effect("compare_coach", "review", "on_request"),
  effect("review_map", "review", "automatic"),
  effect("full_inspector", "review", "explicit_mode"),
  effect("full_inspector", "review", "explicit_mode", "human_split"),
  effect("full_inspector", "review", "explicit_mode", "raw_corpus"),
]);

export type FieldAdapterEntry =
  | { readonly kind: "governs_effects"; readonly effectIds: readonly string[] }
  | { readonly kind: "channel"; readonly channel: "renderer" | "output" }
  | { readonly kind: "form"; readonly form: "square" | "arrow" }
  | { readonly kind: "affordance"; readonly affordance: "request_opener" };

/**
 * The closed adapter. 2026-09-24 correction: `guided` governs `structure_nudge`'s named-pattern
 * effects only — §4a projects Support (which carries `guided_hint`) at `guided: "off"`, so the
 * drafted "and staged `guided_hint`" would have deleted Support's own hint. The staged hint is
 * governed by module membership and the (D1639-proposed) hint ceiling.
 */
export const ASSISTANCE_FIELD_EFFECT_ADAPTER: Readonly<Record<AssistancePreferenceField, FieldAdapterEntry>> = Object.freeze({
  markers: { kind: "governs_effects", effectIds: ["postcommit_nudge:post_commit:automatic", "structure_nudge:post_commit:automatic", "review_map:review:automatic"] },
  guided: { kind: "governs_effects", effectIds: ["structure_nudge:post_commit:automatic", "structure_nudge:post_commit:on_request"] },
  humanSplit: { kind: "governs_effects", effectIds: ["full_inspector:review:explicit_mode:human_split"] },
  corpus: { kind: "governs_effects", effectIds: ["full_inspector:review:explicit_mode:raw_corpus"] },
  voice: { kind: "channel", channel: "renderer" },
  spoken: { kind: "channel", channel: "output" },
  boardLighting: { kind: "form", form: "square" },
  arrows: { kind: "form", form: "arrow" },
  ambient: { kind: "affordance", affordance: "request_opener" },
});

function compileEffects(modules: readonly ModuleId[], config: AssistancePreferenceFields): readonly CompiledAssistanceEffect[] {
  const governedOff = new Set<string>();
  for (const field of ASSISTANCE_PREFERENCE_FIELDS) {
    const entry = ASSISTANCE_FIELD_EFFECT_ADAPTER[field];
    if (entry.kind === "governs_effects" && fieldRank(field, config[field]) === 0) entry.effectIds.forEach((id) => governedOff.add(id));
  }
  return Object.freeze(MODULE_EFFECT_CATALOG.filter((item) => modules.includes(item.moduleId) && !governedOff.has(item.effectId)));
}

// ---------------------------------------------------------------------------------------------
// Stage 1 — requested (browser).

export interface LocalPreferenceInput {
  readonly contextHint: OrdinaryWorkflowContextId;
  readonly preference: WorkflowPreferenceReceipt;
}

export interface RequestedAssistanceV1 {
  readonly stage: "requested";
  readonly schemaVersion: 1;
  readonly contextHint: WorkflowContextId;
  readonly preference: WorkflowPreferenceReceipt;
  readonly requestDigest: AssistanceDigest;
}

function parseReceipt(value: unknown): WorkflowPreferenceReceipt {
  if (plain(value) && value.kind === "invalid_fallback" && exactKeys(value, ["kind", "reason"]) && value.reason === "storage_unavailable") {
    return Object.freeze({ kind: "invalid_fallback", reason: "storage_unavailable" });
  }
  try {
    return parseWorkflowPreferenceV2({ version: 2, assistanceHead: 4, intent: value }).intent;
  } catch (error) {
    return fail("EXCHANGE_SHAPE_INVALID", `preference receipt: ${(error as Error).message}`);
  }
}

export function compileAssistanceRequest(input: LocalPreferenceInput): RequestedAssistanceV1 {
  if (!(WORKFLOW_CONTEXTS as readonly string[]).includes(input.contextHint)) fail("EXCHANGE_SHAPE_INVALID", "unknown context");
  if (input.contextHint === ("campaign" as string)) fail("CONTEXT_DECLARED_AWAITING", "Campaign awaits campaign-core's encounter receipt");
  const body = { stage: "requested" as const, schemaVersion: 1 as const, contextHint: input.contextHint, preference: parseReceipt(JSON.parse(JSON.stringify(input.preference))) };
  return Object.freeze({ ...body, requestDigest: assistanceDigest(body) });
}

/** Strict wire parser for stage 1; any other stage's bytes are refused. */
export function parseRequestedAssistanceV1(value: unknown): RequestedAssistanceV1 {
  if (!plain(value)) return fail("EXCHANGE_SHAPE_INVALID", "requested assistance must be an object");
  if (value.stage !== "requested") return fail("EXCHANGE_STAGE_MISMATCH", "expected the requested stage");
  if (!exactKeys(value, ["stage", "schemaVersion", "contextHint", "preference", "requestDigest"]) || value.schemaVersion !== 1) return fail("EXCHANGE_SHAPE_INVALID", "requested assistance has an unexpected shape");
  if (typeof value.contextHint !== "string" || !(WORKFLOW_CONTEXTS as readonly string[]).includes(value.contextHint)) return fail("EXCHANGE_SHAPE_INVALID", "unknown context hint");
  const body = { stage: "requested" as const, schemaVersion: 1 as const, contextHint: value.contextHint as WorkflowContextId, preference: parseReceipt(value.preference) };
  if (value.requestDigest !== assistanceDigest(body)) return fail("EXCHANGE_DIGEST_MISMATCH", "request bytes do not match their digest");
  return Object.freeze({ ...body, requestDigest: value.requestDigest as AssistanceDigest });
}

// ---------------------------------------------------------------------------------------------
// Stage 2 — authoritative (server).

export interface HintCeilingReceipt {
  readonly rung: HintRung;
  readonly validation: "proposed";
  readonly ruling: "D1639";
}

interface AuthoritativeBody {
  readonly stage: "authoritative";
  readonly schemaVersion: 1;
  readonly context: OrdinaryWorkflowContextId;
  readonly preset: PresetId;
  readonly displayMode: "named" | "custom";
  readonly modules: readonly ModuleId[];
  readonly config: AssistanceConfig;
  readonly permission: ConfigClamp;
  readonly effects: readonly CompiledAssistanceEffect[];
  readonly suppressed: readonly SuppressionRecord[];
  readonly hintCeiling: HintCeilingReceipt;
  readonly requestedDigest: AssistanceDigest;
}
export interface AuthoritativeAssistanceV1 extends AuthoritativeBody {
  readonly effectiveDigest: AssistanceDigest;
}

function availabilityReason(state: AvailabilityState): SuppressionReason {
  return state.state === "pending" ? "source_pending" : state.state === "failed" ? "source_failed" : "source_unavailable";
}

function assertSuppressions(records: readonly SuppressionRecord[]): void {
  const identities = records.map((record) => record.kind === "module" ? `module:${record.moduleId}` : record.kind === "field" ? `field:${record.field}` : record.kind === "effect" ? `effect:${record.effectId}` : "recovery");
  if (new Set(identities).size !== identities.length) fail("SUPPRESSION_INVALID", "duplicate suppression identity");
  for (const record of records) {
    if (record.kind === "preference_recovery") continue;
    if (!SUPPRESSION_REASONS.includes(record.reason)) fail("SUPPRESSION_INVALID", "unknown suppression reason");
    if (record.kind === "field" && fieldRank(record.field, record.effective) >= fieldRank(record.field, record.requested)) fail("SUPPRESSION_INVALID", `${record.field} suppression does not narrow`);
  }
}

export function compileAuthoritativeAssistance(requestInput: RequestedAssistanceV1, authority: ServerAssistanceAuthority): AuthoritativeAssistanceV1 {
  const request = parseRequestedAssistanceV1(requestInput);
  if (request.contextHint === "campaign") fail("CONTEXT_DECLARED_AWAITING", "Campaign awaits campaign-core's encounter receipt");
  const context = deriveWorkflowContext(authority.origin);
  // Rule 0: the client's hint must equal the server-derived context.
  if (context !== request.contextHint) fail("CONTEXT_MISMATCH", `request names ${request.contextHint}; the run is ${context}`);
  const receipt = request.preference;
  const preset = requestedPreset(receipt, context) ?? fail("PRESET_NOT_ALLOWED", `the stored preset is not offered in ${context}`);
  const policy = workflowContextPolicy(context);
  const suppressed: SuppressionRecord[] = [];

  // Rule 1 — preset ∪ include − exclude, ∩ module ceiling; the floor is reinserted.
  const wanted = requestedModules(receipt, preset);
  const modules = Object.freeze(MODULE_IDS.filter((id) => wanted.includes(id) && (policy.moduleCeiling.includes(id) || id === "rules_floor")));
  const presetModules = presetDeclaration(preset).modules;
  for (const id of MODULE_IDS) {
    if (wanted.includes(id) && !modules.includes(id)) suppressed.push({ kind: "module", moduleId: id, requested: true, effective: false, by: "context_ceiling", reason: "context_forbids_module" });
    else if (presetModules.includes(id) && !wanted.includes(id) && policy.moduleCeiling.includes(id)) suppressed.push({ kind: "module", moduleId: id, requested: true, effective: false, by: "stored_choice", reason: "explicitly_disabled" });
  }

  // Rules 2 and 4 — requested fields ∩ context ∩ access, each record labelled by the lower term.
  const requestedFields = requestedAssistanceFields(receipt, preset);
  const projectionFields = presetDeclaration(preset).config;
  const contextTerm = contextClamp(context);
  const accessTerm = accessPermission(authority.access);
  const config = { version: 4 } as Record<string, string | number>;
  for (const field of ASSISTANCE_PREFERENCE_FIELDS) {
    const raw = requestedFields[field];
    const requested = field === "boardLighting" && raw === "off" ? "legal" : raw;
    const contextCeiling = permissionCeiling(field, contextTerm[field]);
    const accessCeiling = permissionCeiling(field, accessTerm[field]);
    const lowerToken = fieldRank(field, contextCeiling) <= fieldRank(field, accessCeiling) ? contextTerm[field] : accessTerm[field];
    const effective = clampFieldValue(field, requested, lowerToken);
    config[field] = effective;
    if (fieldRank(field, effective) < fieldRank(field, requested)) {
      const byContext = fieldRank(field, contextCeiling) <= fieldRank(field, accessCeiling);
      suppressed.push({ kind: "field", field, requested, effective, by: byContext ? "context_ceiling" : "access", reason: byContext ? "context_clamped_field" : "access_clamped_field" });
    } else if (receipt.kind === "explicit" && receipt.overrides[field] !== undefined && fieldRank(field, requested) < fieldRank(field, projectionFields[field])) {
      suppressed.push({ kind: "field", field, requested: projectionFields[field], effective, by: "stored_choice", reason: "explicitly_disabled" });
    }
  }

  // Rule 3 — availability narrows provider channels only; modules stay admitted (honest empty).
  const replaceField = (field: AssistancePreferenceField, effective: string, reason: SuppressionReason) => {
    const requested = config[field] as AssistancePreferenceFields[AssistancePreferenceField];
    const index = suppressed.findIndex((record) => record.kind === "field" && record.field === field);
    if (index >= 0) suppressed.splice(index, 1);
    config[field] = effective;
    suppressed.push({ kind: "field", field, requested, effective: effective as AssistancePreferenceFields[AssistancePreferenceField], by: "source_availability", reason });
  };
  if (config.voice === "persona" && authority.availability.llm.state !== "available") replaceField("voice", "authored", availabilityReason(authority.availability.llm));
  if (config.spoken === "provider" && authority.availability.tts.state !== "available") replaceField("spoken", "browser", availabilityReason(authority.availability.tts));

  const fields = Object.freeze(Object.fromEntries(ASSISTANCE_PREFERENCE_FIELDS.map((field) => [field, config[field]]))) as AssistancePreferenceFields;
  const order = (record: SuppressionRecord): number => record.kind === "module" ? MODULE_IDS.indexOf(record.moduleId) : record.kind === "field" ? 100 + ASSISTANCE_PREFERENCE_FIELDS.indexOf(record.field) : record.kind === "effect" ? 200 : -1;
  const records = Object.freeze([
    ...(receipt.kind === "invalid_fallback" ? [{ kind: "preference_recovery" as const, reason: receipt.reason }] : []),
    ...suppressed.sort((left, right) => order(left) - order(right)).map((record) => Object.freeze(record)),
  ]);
  assertSuppressions(records);
  const body: AuthoritativeBody = {
    stage: "authoritative",
    schemaVersion: 1,
    context,
    preset,
    displayMode: preferenceDisplayMode(receipt, preset),
    modules,
    config: Object.freeze({ version: 4, ...fields }) as AssistanceConfig,
    permission: pointwiseMin(accessTerm, contextTerm),
    effects: compileEffects(modules, fields),
    suppressed: records,
    hintCeiling: Object.freeze({ rung: hintCeiling({ preset, context, role: authority.access.role, seatedInContest: authority.access.seatedInContest, modules }), validation: "proposed", ruling: "D1639" }),
    requestedDigest: request.requestDigest,
  };
  return Object.freeze({ ...body, effectiveDigest: assistanceDigest(body) });
}

// ---------------------------------------------------------------------------------------------
// Stage 3 — finalized (server). MISSING REGISTRY, EXPLICIT: the module execution/binding artifacts
// (rfc/contracts/module-*-plan-v1.json) declare `completionClaim: "requirements_only"`, so no
// effect→source dependency graph exists to execute. `effectSourceDependencies` refuses them with
// MODULE_AUTHORITY_NOT_ACCEPTED and finalization records that refusal instead of inventing a
// hand-written module→provider table. No effect is disabled by availability until it lands.

export interface ModuleSourceAuthority {
  readonly completionClaim: "requirements_only";
  readonly source: string;
}
export const MODULE_SOURCE_AUTHORITY: ModuleSourceAuthority = Object.freeze({
  completionClaim: "requirements_only",
  source: "rfc/contracts/module-execution-plan-v1.json",
});

export function effectSourceDependencies(authority: ModuleSourceAuthority): never {
  return fail("MODULE_AUTHORITY_NOT_ACCEPTED", `${authority.source} is ${authority.completionClaim}; no sealed effect/source graph exists`);
}

export interface SealedModuleSourceReceipts {
  readonly authority: ModuleSourceAuthority;
  readonly availability: ServerEvidenceAvailabilityReceipt;
}

interface FinalizedBody extends Omit<AuthoritativeBody, "stage" | "requestedDigest"> {
  readonly stage: "finalized";
  readonly sourceAuthority: { readonly state: "not_accepted"; readonly code: "MODULE_AUTHORITY_NOT_ACCEPTED"; readonly source: string };
  readonly requestedDigest: AssistanceDigest;
  readonly authoritativeDigest: AssistanceDigest;
  readonly sourceDigest: AssistanceDigest;
}
export interface FinalizedAssistanceV1 extends FinalizedBody {
  readonly finalDigest: AssistanceDigest;
}

export function finalizeAssistanceEffects(result: AuthoritativeAssistanceV1, sources: SealedModuleSourceReceipts): FinalizedAssistanceV1 {
  if (result.stage !== "authoritative") fail("EXCHANGE_STAGE_MISMATCH", "finalization takes the authoritative stage");
  const { effectiveDigest, stage: _stage, ...rest } = result;
  if (assistanceDigest({ stage: "authoritative", ...rest }) !== effectiveDigest) fail("EXCHANGE_DIGEST_MISMATCH", "authoritative bytes changed before finalization");
  let code: "MODULE_AUTHORITY_NOT_ACCEPTED";
  try {
    effectSourceDependencies(sources.authority);
  } catch (error) {
    if (!(error instanceof AssistanceExchangeError) || error.code !== "MODULE_AUTHORITY_NOT_ACCEPTED") throw error;
    code = error.code;
  }
  const body: FinalizedBody = {
    ...rest,
    stage: "finalized",
    sourceAuthority: Object.freeze({ state: "not_accepted", code: code!, source: sources.authority.source }),
    authoritativeDigest: effectiveDigest,
    sourceDigest: assistanceDigest(sources),
  };
  return Object.freeze({ ...body, finalDigest: assistanceDigest(body) });
}

function parseFieldsExact(value: unknown): AssistanceConfig {
  if (!plain(value) || value.version !== 4 || !exactKeys(value, ["version", ...ASSISTANCE_PREFERENCE_FIELDS])) return fail("EXCHANGE_SHAPE_INVALID", "config must be a complete v4 config");
  for (const field of ASSISTANCE_PREFERENCE_FIELDS) if (!(ASSISTANCE_FIELD_DOMAINS[field] as readonly unknown[]).includes(value[field])) fail("EXCHANGE_SHAPE_INVALID", `config.${field} is invalid`);
  if (value.boardLighting === "off") fail("EXCHANGE_SHAPE_INVALID", "no compiled output carries boardLighting off");
  return value as unknown as AssistanceConfig;
}

/** Strict client-side parser: literal stage, closed ids/domains, recomputed final digest. */
export function parseFinalizedAssistanceV1(value: unknown): FinalizedAssistanceV1 {
  if (!plain(value)) return fail("EXCHANGE_SHAPE_INVALID", "finalized assistance must be an object");
  if (value.stage !== "finalized") return fail("EXCHANGE_STAGE_MISMATCH", "expected the finalized stage");
  const { finalDigest, ...body } = value;
  if (typeof finalDigest !== "string" || assistanceDigest(body) !== finalDigest) return fail("EXCHANGE_DIGEST_MISMATCH", "finalized bytes do not match their digest");
  if (!(WORKFLOW_CONTEXTS as readonly unknown[]).includes(value.context) || value.context === "campaign") fail("EXCHANGE_SHAPE_INVALID", "unknown context");
  if (!(PRESET_IDS as readonly unknown[]).includes(value.preset)) fail("EXCHANGE_SHAPE_INVALID", "unknown preset");
  if (value.displayMode !== "named" && value.displayMode !== "custom") fail("EXCHANGE_SHAPE_INVALID", "unknown display mode");
  if (!Array.isArray(value.modules) || value.modules.some((id) => !(MODULE_IDS as readonly unknown[]).includes(id)) || !value.modules.includes("rules_floor")) fail("EXCHANGE_SHAPE_INVALID", "modules must be registered ids including the rules floor");
  parseFieldsExact(value.config);
  if (!Array.isArray(value.suppressed) || !Array.isArray(value.effects)) fail("EXCHANGE_SHAPE_INVALID", "suppressions and effects are arrays");
  const hint = value.hintCeiling;
  if (!plain(hint) || !(HINT_RUNGS as readonly unknown[]).includes(hint.rung)) fail("EXCHANGE_SHAPE_INVALID", "hint ceiling is invalid");
  assertSuppressions(value.suppressed as SuppressionRecord[]);
  return value as unknown as FinalizedAssistanceV1;
}

// ---------------------------------------------------------------------------------------------
// Stage 4 — browser-narrowed (browser). One current receipt; may only remove browser speech.

export interface BrowserChannelReceiptV1 {
  readonly generation: number;
  readonly browserSpeech: AvailabilityState;
  readonly receiptDigest: AssistanceDigest;
}

export function browserChannelReceipt(generation: number, browserSpeech: AvailabilityState): BrowserChannelReceiptV1 {
  const body = { generation, browserSpeech };
  return Object.freeze({ ...body, receiptDigest: assistanceDigest(body) });
}

export interface BrowserNarrowedAssistanceV1 extends Omit<FinalizedAssistanceV1, "stage"> {
  readonly stage: "browser_narrowed";
  readonly browserReceiptDigest: AssistanceDigest;
}

export function narrowBrowserChannels(result: FinalizedAssistanceV1, browser: BrowserChannelReceiptV1): BrowserNarrowedAssistanceV1 {
  const finalized = parseFinalizedAssistanceV1(result);
  if (assistanceDigest({ generation: browser.generation, browserSpeech: browser.browserSpeech }) !== browser.receiptDigest) fail("EXCHANGE_DIGEST_MISMATCH", "browser channel receipt changed");
  let config = finalized.config;
  let suppressed = finalized.suppressed;
  if (config.spoken === "browser" && browser.browserSpeech.state !== "available") {
    config = Object.freeze({ ...config, spoken: "off" });
    suppressed = Object.freeze([...suppressed.filter((record) => !(record.kind === "field" && record.field === "spoken")),
      Object.freeze({ kind: "field" as const, field: "spoken" as const, requested: "browser" as const, effective: "off" as const, by: "browser_channel" as const, reason: "browser_channel_unavailable" as const })]);
  }
  for (const field of ASSISTANCE_PREFERENCE_FIELDS) {
    if (fieldRank(field, config[field]) > fieldRank(field, finalized.config[field])) fail("BROWSER_WIDENING", `${field} widened in the browser`);
    if (field !== "spoken" && config[field] !== finalized.config[field]) fail("BROWSER_WIDENING", `${field} is not a browser channel`);
  }
  return Object.freeze({ ...finalized, stage: "browser_narrowed", config, suppressed, browserReceiptDigest: browser.receiptDigest });
}

// ---------------------------------------------------------------------------------------------
// Closed renderers — fixed copy from typed operands only; stored bytes are never reflected.

export const ASSISTANCE_FIELD_LABELS: Readonly<Record<AssistancePreferenceField, string>> = Object.freeze({
  markers: "Passive markers", guided: "Named-pattern guidance", humanSplit: "Human move split", corpus: "Corpus counts",
  voice: "External voice", spoken: "Spoken guidance", boardLighting: "Board lighting", arrows: "Arrows", ambient: "Ambient presence",
});
const VALUE_LABELS: Readonly<Record<string, string>> = Object.freeze({
  off: "off", live: "on", on_request: "on request", authored: "authored text", persona: "external voice", browser: "the browser voice",
  provider: "the configured provider", legal: "legal moves", sight: "structural sight", evidence: "disclosed evidence", on: "on",
});
export const MODULE_LABELS: Readonly<Record<ModuleId, string>> = Object.freeze({
  rules_floor: "Legal moves", sight_on_request: "Square facts on request", blunder_prevention: "Staged-move risk check",
  threat_radar: "Threat radar", postcommit_nudge: "After-move nudge", structure_nudge: "Named-structure nudge",
  theory_breadcrumb: "Theory pointer", guided_hint: "Step-by-step hint", compare_coach: "Attempt comparison",
  review_map: "Review map", full_inspector: "Full inspector",
});
export const CONTEXT_PHRASES: Readonly<Record<WorkflowContextId, string>> = Object.freeze({
  pack: "curated drills", position: "Just Play", imported: "imported games", match: "a match", stream: "a streamed session",
  academy: "an academy session", onramp: "the on-ramp", campaign: "Campaign",
});

type Renderer = (record: SuppressionRecord, context: WorkflowContextId) => string;
const fieldText = (record: SuppressionRecord) => record.kind === "field" ? { name: ASSISTANCE_FIELD_LABELS[record.field], effective: VALUE_LABELS[record.effective] ?? fail("SUPPRESSION_INVALID", "unlabelled value") } : fail("SUPPRESSION_INVALID", "not a field record");
const moduleText = (record: SuppressionRecord) => record.kind === "module" || record.kind === "effect" ? MODULE_LABELS[record.moduleId] : fail("SUPPRESSION_INVALID", "not a module record");

type RendererTable = Readonly<Partial<Record<SuppressionReason | "malformed" | "storage_unavailable", Renderer>>>;
const table = (value: RendererTable): RendererTable => Object.freeze(value);
export const SUPPRESSION_RENDERERS: Readonly<Record<SuppressionRecord["kind"], RendererTable>> = Object.freeze({
  module: table({
    context_forbids_module: (record, context) => `${moduleText(record)} isn't available in ${CONTEXT_PHRASES[context]}.`,
    role_forbids_module: (record) => `${moduleText(record)} isn't available to your seat.`,
    delivery_closed: (record) => `${moduleText(record)} waits until this run opens help.`,
    explicitly_disabled: (record) => `You turned off ${moduleText(record)}.`,
  }),
  field: table({
    context_clamped_field: (record, context) => { const text = fieldText(record); return `${text.name} is limited to ${text.effective} in ${CONTEXT_PHRASES[context]}.`; },
    access_clamped_field: (record) => { const text = fieldText(record); return `${text.name} stays at ${text.effective} for you at this point in the run.`; },
    explicitly_disabled: (record) => { const text = fieldText(record); return `You set ${text.name} to ${text.effective}.`; },
    source_pending: (record) => { const text = fieldText(record); return `${text.name} uses ${text.effective} while its service starts.`; },
    source_unavailable: (record) => { const text = fieldText(record); return `${text.name} uses ${text.effective} because its service is unavailable.`; },
    source_failed: (record) => { const text = fieldText(record); return `${text.name} uses ${text.effective} because its service failed.`; },
    browser_channel_unavailable: (record) => `${fieldText(record).name} is off because this browser has no speech voice.`,
  }),
  effect: table({
    source_pending: (record) => `${moduleText(record)}: part of this help waits for its source to start.`,
    source_unavailable: (record) => `${moduleText(record)}: part of this help is unavailable because its source is unavailable.`,
    source_failed: (record) => `${moduleText(record)}: part of this help is unavailable because its source failed.`,
  }),
  preference_recovery: table({
    malformed: () => "Your saved help settings could not be read, so this workflow's default is shown.",
    invalid_preference_recovered: () => "Your saved help settings could not be read, so this workflow's default is shown.",
    storage_unavailable: () => "Help settings can't be saved in this browser, so this workflow's default is shown.",
  }),
});

export function renderSuppression(record: SuppressionRecord, context: WorkflowContextId): string {
  const renderer = SUPPRESSION_RENDERERS[record.kind][record.reason];
  if (renderer === undefined) return fail("SUPPRESSION_INVALID", `no renderer for ${record.kind}/${record.reason}`);
  return renderer(record, context);
}

/** Pill/footer projection of a compiled result — never of PRESET_DECLARATIONS directly (criterion 16). */
export function compiledPresetDisclosure(compiled: Pick<FinalizedAssistanceV1, "context" | "preset" | "displayMode" | "suppressed">): {
  readonly pillLabel: string;
  readonly headline: string;
  readonly sentences: readonly string[];
} {
  const declaration = presetDeclaration(compiled.preset);
  const sentences = compiled.suppressed.map((record) => renderSuppression(record, compiled.context));
  if (compiled.displayMode === "custom") {
    return Object.freeze({ pillLabel: "Custom", headline: `Custom help, starting from ${declaration.label}. Adjust it in Advanced support controls.`, sentences: Object.freeze(sentences) });
  }
  return Object.freeze({ pillLabel: declaration.label, headline: sentences.length === 0 ? declaration.promise : `${declaration.label}, with limits here.`, sentences: Object.freeze(sentences) });
}

/** The server's availability receipt from the deployment capability providers. */
export function serverAvailabilityFromProviders(providers: Readonly<Record<"opponent" | "judge" | "llm" | "corpus" | "tts" | "tablebase", string>>): ServerEvidenceAvailabilityReceipt {
  const state = (value: string): AvailabilityState => value === "none" ? Object.freeze({ state: "unavailable", reason: "not_configured" }) : Object.freeze({ state: "available" });
  return Object.freeze({ llm: state(providers.llm), tts: state(providers.tts), stockfish: state(providers.judge), syzygy: state(providers.tablebase), maia: state(providers.opponent), explorer: state(providers.corpus) });
}
