export type EvidencePlane = "rules" | "transition" | "search" | "human" | "theory" | "authored" | "record" | "derived";
export type ProjectionRole = "predicate" | "reading" | "event" | "source_record";
export type EvidenceGrounding = "position_rules" | "declared_convention" | "bounded_search" | "tablebase_exact" | "human_model" | "human_corpus" | "cited_theory" | "authored_claim" | "recorded_run";
export type EvidenceDisposition = "inspector_only" | "author_only" | "operator_only" | "experimental" | "retired";
export type EvidenceTiming = "precommit" | "at_commit" | "postcommit" | "checkpoint" | "attempt_end" | "terminal" | "review" | "analysis";
export type EvidenceForm = "sentence" | "list" | "timeline_marker" | "lit_squares" | "arrows" | "piece_halo" | "panel" | "audio" | "machine_condition";
export type AnswerDistance = "fact" | "pattern" | "threat" | "theory" | "evaluation" | "principle" | "plan" | "candidate_moves" | "ranked_moves" | "move" | "principal_variation";
export type EvidenceRole = "learner" | "host" | "participant" | "spectator" | "author" | "operator";
export type AvailabilityMode = "local" | "recorded" | "provider" | "build_time";
export type LatencyMode = "sync" | "interactive" | "background" | "offline";
export type ProviderOffBehavior = "available" | "honest_empty" | "unavailable";
export type SemanticEventSign = ProjectionDeclaration["signs"][number];

export interface VersionedEvidenceId { readonly id: string; readonly version: number }
export interface EvidenceDispositionDeclaration { readonly kind: EvidenceDisposition; readonly reason: string }
export interface EvidenceLatency { readonly mode: LatencyMode; readonly maxMs: number | null }
export interface EvidenceBudget { readonly maxFacts: number | null; readonly maxForms: number | null }

export type EvidenceDerivation =
  | { readonly inputs: readonly VersionedEvidenceId[]; readonly anyOf?: never }
  | { readonly inputs?: never; readonly anyOf: readonly (readonly VersionedEvidenceId[])[] };

export interface ProjectionDeclaration {
  readonly id: string;
  readonly version: number;
  readonly producer: VersionedEvidenceId;
  readonly role: ProjectionRole;
  readonly plane: EvidencePlane;
  readonly payloadType: string;
  readonly semantics: string;
  readonly operands: readonly string[];
  readonly signs: readonly ("state" | "gained" | "lost" | "preserved" | "removed" | "avoided" | "enabled" | "threatened")[];
  readonly grounding: EvidenceGrounding;
  readonly exactness: "exact" | "convention" | "measured" | "authored";
  readonly confidence: "not_applicable" | "exact" | "reported";
  readonly abstention: { readonly possible: boolean; readonly reasons: readonly string[] };
  readonly answerContent: readonly AnswerDistance[];
  readonly forms: readonly EvidenceForm[];
  readonly dependsOn: readonly VersionedEvidenceId[];
  readonly derivation?: EvidenceDerivation;
  readonly limitations: readonly string[];
  readonly disposition?: EvidenceDispositionDeclaration;
}

export interface ProducerDeclaration {
  readonly id: string;
  readonly version: number;
  readonly plane: EvidencePlane;
  readonly implementation: string;
  readonly availability: AvailabilityMode;
  readonly latency: LatencyMode;
  readonly outputs: readonly ProjectionDeclaration[];
}

export interface ConsumerDeclaration {
  readonly id: string;
  readonly version: number;
  readonly implementation: string;
  readonly accepts: readonly VersionedEvidenceId[];
  readonly timing: readonly EvidenceTiming[];
  readonly roles: readonly EvidenceRole[];
  readonly sessions: readonly string[];
  readonly forms: readonly EvidenceForm[];
  readonly answerContent: readonly AnswerDistance[];
  readonly latency: EvidenceLatency;
  readonly budget: EvidenceBudget;
  readonly providerOff: ProviderOffBehavior;
  readonly disposition?: EvidenceDispositionDeclaration;
}

export interface EvidenceConsumerOperation {
  readonly consumer: VersionedEvidenceId;
  readonly operation: CallableFunction;
}

export function evidenceConsumerOperation(
  id: string,
  operation: CallableFunction,
): EvidenceConsumerOperation {
  if (id.trim() === "") throw new TypeError("Evidence consumer operation id must not be empty");
  if (typeof operation !== "function") throw new TypeError(`Evidence consumer operation ${id} must be callable`);
  return Object.freeze({ consumer: Object.freeze({ id, version: 1 }), operation });
}

export function assertEvidenceConsumerOperations(
  expectedIds: readonly string[],
  declarations: readonly ConsumerDeclaration[],
  operations: readonly EvidenceConsumerOperation[],
): void {
  const expected = [...expectedIds].sort();
  const ids = operations.map((entry) => entry.consumer.id);
  if (new Set(ids).size !== ids.length) throw new TypeError("Evidence consumer operations contain a duplicate id");
  if ([...ids].sort().join("\0") !== expected.join("\0")) {
    throw new TypeError("Evidence consumer operations are not set-equal to the current operation catalogue");
  }
  const byId = new Map(declarations.map((declaration) => [declaration.id, declaration]));
  for (const entry of operations) {
    if (entry.consumer.version !== 1) throw new TypeError(`Evidence consumer operation ${entry.consumer.id} has unsupported version ${entry.consumer.version}`);
    const declaration = byId.get(entry.consumer.id);
    if (declaration === undefined) throw new TypeError(`Evidence consumer operation ${entry.consumer.id} has no manifest declaration`);
    if (declaration.implementation !== entry.operation.name) {
      throw new TypeError(`Evidence consumer operation ${entry.consumer.id} declares ${declaration.implementation} but exports ${entry.operation.name}`);
    }
  }
}

export interface AdapterDeclaration {
  readonly id: string;
  readonly version: number;
  readonly implementation: string;
  readonly producer: VersionedEvidenceId;
  readonly projection: VersionedEvidenceId;
  readonly consumer: VersionedEvidenceId;
  readonly timing: readonly EvidenceTiming[];
  readonly roles: readonly EvidenceRole[];
  readonly sessions: readonly string[];
  readonly forms: readonly EvidenceForm[];
  readonly answerContent: readonly AnswerDistance[];
  readonly latency: EvidenceLatency;
  readonly budget: EvidenceBudget;
  readonly providerOff?: ProviderOffBehavior;
}

export interface EvidenceBinding {
  readonly producer: VersionedEvidenceId;
  readonly projection: VersionedEvidenceId;
  readonly consumer: VersionedEvidenceId;
  readonly adapter: VersionedEvidenceId;
  readonly timing: readonly EvidenceTiming[];
  readonly roles: readonly EvidenceRole[];
  readonly sessions: readonly string[];
  readonly forms: readonly EvidenceForm[];
  readonly answerContent: readonly AnswerDistance[];
  readonly latency: EvidenceLatency;
  readonly budget: EvidenceBudget;
}

export interface SemanticEventDeclaration {
  readonly projection: VersionedEvidenceId;
  readonly derivationInputs?: readonly VersionedEvidenceId[];
  readonly derivationAnyOf?: readonly (readonly VersionedEvidenceId[])[];
  readonly allowedSigns: readonly SemanticEventSign[];
  readonly requiredOperands: readonly string[];
  readonly valence: "none" | "source_required";
  readonly validation: {
    readonly positives: readonly string[];
    readonly hardNegatives: readonly string[];
    readonly externalPopulation?: string;
  };
}

export interface EvidenceEligibilityDeclaration {
  readonly event: VersionedEvidenceId;
  readonly consumer: VersionedEvidenceId;
  readonly disposition: "eligible" | "refused";
  readonly reason: VersionedEvidenceId;
  readonly allowedSigns: readonly SemanticEventSign[];
  readonly requiredOperands: readonly string[];
  readonly valenceAuthority: readonly VersionedEvidenceId[];
}

export interface EvidenceReasonDeclaration extends VersionedEvidenceId {
  readonly stage: "eligibility" | "selection";
  readonly meaning: string;
}

export interface EvidenceSelectionPolicy {
  readonly id: string;
  readonly version: number;
  readonly minimumAlternatives: number;
  readonly maximumSameFamilyShare: number;
  readonly minimumAlternativeOnlyShare: number | null;
  readonly maxFacts: number;
  readonly criticalEvents: readonly VersionedEvidenceId[];
}

export interface EvidenceSelectionPolicyDeclaration extends EvidenceSelectionPolicy {
  readonly consumer: VersionedEvidenceId;
  readonly disposition: "experimental" | "production";
}

export interface EvidenceContractDeclarations {
  readonly producers: readonly ProducerDeclaration[];
  readonly consumers: readonly ConsumerDeclaration[];
  readonly adapters: readonly AdapterDeclaration[];
  readonly genericBypasses?: readonly { readonly consumer: VersionedEvidenceId; readonly implementation: string }[];
  readonly semanticEvents?: readonly SemanticEventDeclaration[];
  readonly eligibility?: readonly EvidenceEligibilityDeclaration[];
  readonly reasons?: readonly EvidenceReasonDeclaration[];
  readonly selectionPolicies?: readonly EvidenceSelectionPolicyDeclaration[];
}

export interface CompiledEvidenceManifest {
  readonly producers: readonly ProducerDeclaration[];
  readonly projections: readonly ProjectionDeclaration[];
  readonly consumers: readonly ConsumerDeclaration[];
  readonly bindings: readonly EvidenceBinding[];
  readonly semanticEvents: readonly SemanticEventDeclaration[];
  readonly eligibility: readonly EvidenceEligibilityDeclaration[];
  readonly reasons: readonly EvidenceReasonDeclaration[];
  readonly selectionPolicies: readonly EvidenceSelectionPolicyDeclaration[];
  readonly digest: string;
}

export interface DeclaredEvidence<T> {
  readonly [DECLARED]: true;
  readonly producer: VersionedEvidenceId;
  readonly projection: VersionedEvidenceId;
  readonly payload: T;
}

const DECLARED: unique symbol = Symbol("tabiya.evidence.declared");
const DECLARED_VALUES = new WeakSet<object>();
const ADMITTED = Symbol("tabiya.evidence.admitted");
const CONSUMER_VIEWS = new WeakSet<object>();
const RENDERED_VIEWS = new WeakSet<object>();

export interface ConsumerEvidenceView<T = unknown> {
  readonly [ADMITTED]: true;
  readonly consumer: VersionedEvidenceId;
  readonly items: readonly DeclaredEvidence<T>[];
}

export interface RenderedEvidenceItem<T = unknown> {
  readonly evidence: DeclaredEvidence<T>;
  readonly sentences: readonly string[];
}

export interface RenderedEvidenceView<T = unknown> {
  readonly [ADMITTED]: true;
  readonly consumer: VersionedEvidenceId;
  readonly items: readonly RenderedEvidenceItem<T>[];
}

export type EvidenceRenderer<T = unknown> = (evidence: DeclaredEvidence<T>) => readonly string[];
export type EvidenceRendererRegistry<T = unknown> = Readonly<Record<string, EvidenceRenderer<T>>>;

export const EVIDENCE_MANIFEST_ERROR_CODES = Object.freeze([
  "EVIDENCE_PRODUCER_DUPLICATE",
  "EVIDENCE_PROJECTION_DUPLICATE",
  "EVIDENCE_PROJECTION_ORPHANED",
  "EVIDENCE_CONSUMER_ORPHANED",
  "EVIDENCE_BINDING_UNDECLARED",
  "EVIDENCE_BINDING_WILDCARD",
  "EVIDENCE_BINDING_WIDENS",
  "EVIDENCE_PROJECTION_INCOMPLETE",
  "EVIDENCE_DEPENDENCY_MISSING",
  "EVIDENCE_DEPENDENCY_CYCLE",
  "EVIDENCE_DERIVATION_WIDENS",
  "EVIDENCE_GENERIC_BYPASS",
  "EVIDENCE_PROVIDER_FALLBACK_MISSING",
  "EVIDENCE_EVENT_DUPLICATE",
  "EVIDENCE_EVENT_PROJECTION_MISSING",
  "EVIDENCE_EVENT_DERIVATION_MISMATCH",
  "EVIDENCE_EVENT_SIGN_WIDENS",
  "EVIDENCE_EVENT_OPERAND_MISSING",
  "EVIDENCE_EVENT_UNVALIDATED",
  "EVIDENCE_EVENT_PROJECTION_REFUSED",
  "EVIDENCE_EVENT_VALENCE_UNBACKED",
  "EVIDENCE_ELIGIBILITY_DUPLICATE",
  "EVIDENCE_ELIGIBILITY_ORPHANED",
  "EVIDENCE_REASON_DUPLICATE",
  "EVIDENCE_POLICY_DUPLICATE",
  "EVIDENCE_POLICY_INVALID",
  "EVIDENCE_POLICY_CONSUMER_MISSING",
  "EVIDENCE_POLICY_CRITICAL_REFUSED",
] as const);
export type EvidenceManifestErrorCode = (typeof EVIDENCE_MANIFEST_ERROR_CODES)[number];

export class EvidenceManifestError extends TypeError {
  readonly code: EvidenceManifestErrorCode;
  readonly sites: readonly string[];
  constructor(code: EvidenceManifestErrorCode, message: string, sites: readonly string[]) {
    super(`${code}: ${message} [${sites.join(" <-> ")}]`);
    this.name = "EvidenceManifestError";
    this.code = code;
    this.sites = Object.freeze([...sites]);
  }
}

const ID = /^[a-z][a-z0-9_]*(?:\.[a-z0-9_]+)*$/u;
const refKey = (value: VersionedEvidenceId): string => `${value.id}@${value.version}`;
const site = (kind: string, value: VersionedEvidenceId, implementation?: string): string => `${kind}:${refKey(value)}${implementation === undefined ? "" : `:${implementation}`}`;
const completeDisposition = (value: unknown): value is EvidenceDispositionDeclaration => typeof value === "object" && value !== null && !Array.isArray(value) && typeof (value as EvidenceDispositionDeclaration).reason === "string" && (value as EvidenceDispositionDeclaration).reason.trim().length > 0;
const nonEmptyStrings = (values: readonly string[]): boolean => values.every((value) => typeof value === "string" && value.trim().length > 0);

function fail(code: EvidenceManifestErrorCode, message: string, sites: readonly string[]): never {
  throw new EvidenceManifestError(code, message, sites);
}

function assertLiteral(value: VersionedEvidenceId, declarationSite: string): void {
  if (!ID.test(value.id) || !Number.isSafeInteger(value.version) || value.version < 1) {
    fail("EVIDENCE_BINDING_WILDCARD", "evidence ids are literal lowercase dotted ids with positive integer versions", [declarationSite]);
  }
}

function subset<T>(candidate: readonly T[], ceiling: readonly T[]): boolean {
  return candidate.every((value) => ceiling.includes(value));
}

function setEqual<T>(left: readonly T[], right: readonly T[]): boolean {
  return left.length === right.length && subset(left, right) && subset(right, left);
}

function derivationMembers(projection: ProjectionDeclaration): readonly (readonly VersionedEvidenceId[])[] {
  const derivation = projection.derivation;
  if (derivation === undefined) return Object.freeze([]);
  if (derivation.inputs !== undefined) return Object.freeze([derivation.inputs]);
  return derivation.anyOf;
}

function derivationMemberKey(member: readonly VersionedEvidenceId[]): string {
  return [...member].map(refKey).sort().join("|");
}

function budgetNarrows(candidate: number | null, ceiling: number | null): boolean {
  return ceiling === null || (candidate !== null && candidate >= 0 && candidate <= ceiling);
}

function latencyNarrows(candidate: EvidenceLatency, ceiling: EvidenceLatency): boolean {
  if (candidate.mode !== ceiling.mode) return false;
  return ceiling.maxMs === null || (candidate.maxMs !== null && candidate.maxMs >= 0 && candidate.maxMs <= ceiling.maxMs);
}

// Canonical bytes of each sealed payload, recorded when its digest is first taken. A sealed payload is
// deep-frozen before sealing (the same premise as SEALED_PAYLOAD_DIGESTS), so an event id or receipt
// that embeds it reuses these bytes instead of re-walking the tree ([[D3300]]).
const SEALED_CANONICAL = new WeakMap<object, string>();

// Byte-identical to the former `map`/`join` template form, including its accidents: a value
// `JSON.stringify` cannot render (`undefined`, a function, a symbol) is `undefined` as a record
// member or at the top level (where the former encoder stringified it) but empty as an array element
// or hole (where `join` dropped it); record keys sort by UTF-16 code units.
function canonical(value: unknown): string {
  return canonicalPart(value) ?? "undefined";
}

function canonicalPart(value: unknown): string | undefined {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  const sealed = SEALED_CANONICAL.get(value);
  if (sealed !== undefined) return sealed;
  if (Array.isArray(value)) {
    let text = "[";
    for (let index = 0; index < value.length; index += 1) {
      if (index > 0) text += ",";
      if (index in value) text += canonicalPart(value[index]) ?? "";
    }
    return `${text}]`;
  }
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  let text = "{";
  for (let index = 0; index < keys.length; index += 1) {
    const key = keys[index]!;
    if (index > 0) text += ",";
    text += `${quotedKey(key)}:${canonicalPart(record[key]) ?? "undefined"}`;
  }
  return `${text}}`;
}

// Record keys are a small closed vocabulary (payload field names), quoted once each.
const QUOTED_KEYS = new Map<string, string>();
function quotedKey(key: string): string {
  let quoted = QUOTED_KEYS.get(key);
  if (quoted === undefined) {
    quoted = JSON.stringify(key);
    if (QUOTED_KEYS.size < 4096) QUOTED_KEYS.set(key, quoted);
  }
  return quoted;
}

export function evidenceDigest(value: unknown): string {
  return sha256(canonical(value));
}

// Small dependency-free SHA-256 so the shared runtime contract remains browser-buildable. Every
// evidence seal goes through here, so it is the hot path of any complete-population census ([[D3300]]):
// constants are hoisted, UTF-8 comes from one shared TextEncoder, and the schedule/state live in
// reused typed arrays. The bytes hashed are unchanged: the only caller hashes `canonical` output,
// which `JSON.stringify` keeps well-formed, so TextEncoder yields exactly the UTF-8 the former
// `unescape(encodeURIComponent(...))` encoding produced.
const SHA256_K = new Int32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);
const SHA256_ENCODER = new TextEncoder();
const SHA256_W = new Int32Array(64);
const SHA256_H = new Int32Array(8);

function portableSha256(input: string): string {
  const bytes = SHA256_ENCODER.encode(input);
  const length = bytes.length;
  const padded = new Uint8Array(((length + 9 + 63) >> 6) << 6);
  padded.set(bytes);
  padded[length] = 0x80;
  // The former encoder wrote only the low 32 bits of the bit length; inputs here are far below 512 MiB.
  const bitLength = length * 8;
  padded[padded.length - 4] = (bitLength >>> 24) & 0xff;
  padded[padded.length - 3] = (bitLength >>> 16) & 0xff;
  padded[padded.length - 2] = (bitLength >>> 8) & 0xff;
  padded[padded.length - 1] = bitLength & 0xff;
  const w = SHA256_W;
  const h = SHA256_H;
  h[0] = 0x6a09e667; h[1] = 0xbb67ae85 | 0; h[2] = 0x3c6ef372; h[3] = 0xa54ff53a | 0;
  h[4] = 0x510e527f; h[5] = 0x9b05688c | 0; h[6] = 0x1f83d9ab; h[7] = 0x5be0cd19;
  for (let offset = 0; offset < padded.length; offset += 64) {
    for (let index = 0; index < 16; index += 1) {
      const at = offset + index * 4;
      w[index] = (padded[at]! << 24) | (padded[at + 1]! << 16) | (padded[at + 2]! << 8) | padded[at + 3]!;
    }
    for (let index = 16; index < 64; index += 1) {
      const w15 = w[index - 15]!;
      const w2 = w[index - 2]!;
      const s0 = ((w15 >>> 7) | (w15 << 25)) ^ ((w15 >>> 18) | (w15 << 14)) ^ (w15 >>> 3);
      const s1 = ((w2 >>> 17) | (w2 << 15)) ^ ((w2 >>> 19) | (w2 << 13)) ^ (w2 >>> 10);
      w[index] = (w[index - 16]! + s0 + w[index - 7]! + s1) | 0;
    }
    let a: number = h[0]!, b: number = h[1]!, c: number = h[2]!, d: number = h[3]!, e: number = h[4]!, f: number = h[5]!, g: number = h[6]!, hh: number = h[7]!;
    for (let index = 0; index < 64; index += 1) {
      const s1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
      const choose = (e & f) ^ (~e & g);
      const temp1 = (hh + s1 + choose + SHA256_K[index]! + w[index]!) | 0;
      const s0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
      const majority = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + majority) | 0;
      hh = g; g = f; f = e; e = (d + temp1) | 0; d = c; c = b; b = a; a = (temp1 + temp2) | 0;
    }
    h[0] = (h[0]! + a) | 0; h[1] = (h[1]! + b) | 0; h[2] = (h[2]! + c) | 0; h[3] = (h[3]! + d) | 0;
    h[4] = (h[4]! + e) | 0; h[5] = (h[5]! + f) | 0; h[6] = (h[6]! + g) | 0; h[7] = (h[7]! + hh) | 0;
  }
  let hex = "";
  for (let index = 0; index < 8; index += 1) hex += (h[index]! >>> 0).toString(16).padStart(8, "0");
  return hex;
}

/**
 * Where the host is Node, the same digest comes from its native SHA-256 ([[D3300]]): a complete
 * legal-move population seals ~200 values per edge, and the portable implementation above was the
 * census's single largest cost. The module stays import-free and browser-buildable —
 * `process.getBuiltinModule` is probed at run time, never imported — and the native path is admitted
 * only if it reproduces the portable digest on a multi-byte probe, so both hosts hash identical bytes.
 */
type NativeSha256 = (input: string) => string;
const NATIVE_SHA256: NativeSha256 | undefined = (() => {
  try {
    const host = (globalThis as { readonly process?: { readonly getBuiltinModule?: (id: string) => unknown } }).process;
    const crypto = host?.getBuiltinModule?.("node:crypto") as {
      readonly hash?: (algorithm: string, data: string, encoding: "hex") => string;
      readonly createHash?: (algorithm: string) => { update(data: string, encoding: "utf8"): { digest(encoding: "hex"): string } };
    } | undefined;
    const oneShot = crypto?.hash;
    const streaming = crypto?.createHash;
    const native: NativeSha256 | undefined = typeof oneShot === "function"
      ? (input) => oneShot("sha256", input, "hex")
      : typeof streaming === "function" ? (input) => streaming("sha256").update(input, "utf8").digest("hex") : undefined;
    if (native === undefined) return undefined;
    const probe = canonical({ probe: "tabiya é♞\u{1F600}", length: 64 });
    return native(probe) === portableSha256(probe) ? native : undefined;
  } catch {
    return undefined;
  }
})();

function sha256(input: string): string {
  return NATIVE_SHA256 === undefined ? portableSha256(input) : NATIVE_SHA256(input);
}

function immutable<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) immutable(child);
    Object.freeze(value);
  }
  return value;
}

/**
 * Package-private value-authority receipt (rfc/evidence-value-authority.md §5). It is held in a
 * private WeakMap beside the identity seal, never serialized, and never claims durable provenance.
 */
export interface EvidenceValueReceipt {
  readonly projection: VersionedEvidenceId;
  /** Exact factory symbol; diagnostic only. */
  readonly factory: string;
  /** Canonical digest of the authority inputs the factory actually used. */
  readonly inputDigest: string;
  /** Canonical digest of the sealed payload. */
  readonly payloadDigest: string;
  /** Declared-input payload digests (derived) or sealed receipt/document digests (source/authored). */
  readonly sourceDigests: readonly string[];
}

/** What the sole mint boundary supplies when it seals a factory-computed payload. */
export interface EvidenceMintAuthority {
  readonly factory: string;
  readonly inputDigest: string;
  readonly sourceDigests: readonly string[];
}

const VALUE_RECEIPTS = new WeakMap<object, EvidenceValueReceipt>();
const SEALED_PAYLOAD_DIGESTS = new WeakMap<object, string>();
const DIGEST = /^[0-9a-f]{64}$/u;

function sealedPayloadDigest(payload: unknown): string {
  if (payload === null || typeof payload !== "object") return evidenceDigest(payload);
  const cached = SEALED_PAYLOAD_DIGESTS.get(payload);
  if (cached !== undefined) return cached;
  // The payload is deep-frozen before this point; its canonical bytes cannot change afterwards.
  const text = canonical(payload);
  const digest = sha256(text);
  SEALED_CANONICAL.set(payload, text);
  SEALED_PAYLOAD_DIGESTS.set(payload, digest);
  return digest;
}

/**
 * Seals one factory-computed payload. Only `evidence-factories.ts` may call this outside tests
 * (enforced by `make evidence-value-authority`); it is absent from every package export.
 */
export function declareEvidence<T>(producer: VersionedEvidenceId, projection: VersionedEvidenceId, payload: T, authority: EvidenceMintAuthority): DeclaredEvidence<T> {
  assertLiteral(producer, "declared-evidence producer");
  assertLiteral(projection, "declared-evidence projection");
  if (typeof authority !== "object" || authority === null || typeof authority.factory !== "string" || authority.factory.trim() === ""
    || typeof authority.inputDigest !== "string" || !DIGEST.test(authority.inputDigest)
    || !Array.isArray(authority.sourceDigests) || authority.sourceDigests.some((digest) => typeof digest !== "string" || !DIGEST.test(digest))) {
    fail("EVIDENCE_GENERIC_BYPASS", "evidence mint lacks an exact value-authority receipt", ["declared-evidence:receiptless"]);
  }
  const value = immutable({ [DECLARED]: true as const, producer: { ...producer }, projection: { ...projection }, payload });
  const receipt = immutable({
    projection: { ...projection },
    factory: authority.factory,
    inputDigest: authority.inputDigest,
    payloadDigest: sealedPayloadDigest(value.payload),
    sourceDigests: [...authority.sourceDigests],
  });
  DECLARED_VALUES.add(value);
  VALUE_RECEIPTS.set(value, receipt);
  return value;
}

/**
 * Negative-control helper: an identity seal WITHOUT a value receipt, i.e. exactly what the retired
 * caller-payload adapters produced. Every admission path rejects it. Only tests may call it.
 */
export function identitySealedEvidenceWithoutValueReceipt<T>(producer: VersionedEvidenceId, projection: VersionedEvidenceId, payload: T): DeclaredEvidence<T> {
  const value = immutable({ [DECLARED]: true as const, producer: { ...producer }, projection: { ...projection }, payload });
  DECLARED_VALUES.add(value);
  return value;
}

/**
 * Non-throwing twin of `assertDeclaredEvidence`: true exactly when the assertion would pass. Hot
 * callers that probe arbitrary authority records use it instead of catching a constructed error
 * per record ([[D3300]]).
 */
export function isDeclaredEvidence(value: unknown): value is DeclaredEvidence<unknown> {
  if (typeof value !== "object" || value === null || (value as { readonly [DECLARED]?: unknown })[DECLARED] !== true || !DECLARED_VALUES.has(value)) return false;
  const receipt = VALUE_RECEIPTS.get(value);
  if (receipt === undefined) return false;
  const declared = value as DeclaredEvidence<unknown>;
  return refKey(receipt.projection) === refKey(declared.projection) && receipt.payloadDigest === sealedPayloadDigest(declared.payload);
}

export function assertDeclaredEvidence(value: unknown): asserts value is DeclaredEvidence<unknown> {
  if (typeof value !== "object" || value === null || (value as { readonly [DECLARED]?: unknown })[DECLARED] !== true || !DECLARED_VALUES.has(value)) {
    fail("EVIDENCE_GENERIC_BYPASS", "evidence was not constructed by an exact declared-evidence adapter", ["declared-evidence:unsealed"]);
  }
  const receipt = VALUE_RECEIPTS.get(value);
  if (receipt === undefined) {
    fail("EVIDENCE_GENERIC_BYPASS", "evidence is identity-sealed but has no value-authority receipt", ["declared-evidence:value-unverified"]);
  }
  const declared = value as DeclaredEvidence<unknown>;
  if (refKey(receipt.projection) !== refKey(declared.projection) || receipt.payloadDigest !== sealedPayloadDigest(declared.payload)) {
    fail("EVIDENCE_GENERIC_BYPASS", "evidence value receipt disagrees with its sealed projection or payload", ["declared-evidence:receipt-mismatch"]);
  }
}

/** Package-internal read of the value receipt; absent from the package barrel. */
export function evidenceValueReceipt(value: DeclaredEvidence<unknown>): EvidenceValueReceipt {
  assertDeclaredEvidence(value);
  return VALUE_RECEIPTS.get(value)!;
}

export function evidenceForConsumer<T>(manifest: CompiledEvidenceManifest, consumer: VersionedEvidenceId, values: readonly DeclaredEvidence<T>[]): ConsumerEvidenceView<T> {
  assertLiteral(consumer, "consumer view");
  const consumerKey = refKey(consumer);
  if (!manifest.consumers.some((candidate) => refKey(candidate) === consumerKey)) {
    fail("EVIDENCE_BINDING_UNDECLARED", "consumer view names an undeclared exact consumer", [site("consumer", consumer)]);
  }
  const projectionByKey = new Map(manifest.projections.map((projection) => [refKey(projection), projection]));
  const permitted = new Set(manifest.bindings
    .filter((binding) => refKey(binding.consumer) === consumerKey)
    .map((binding) => `${refKey(binding.producer)}:${refKey(binding.projection)}`));
  const admitted: DeclaredEvidence<T>[] = [];
  for (const value of values) {
    assertDeclaredEvidence(value);
    assertLiteral(value.producer, "declared-evidence producer");
    assertLiteral(value.projection, "declared-evidence projection");
    const projection = projectionByKey.get(refKey(value.projection));
    if (projection === undefined || refKey(projection.producer) !== refKey(value.producer)) {
      fail("EVIDENCE_BINDING_UNDECLARED", "declared evidence does not name an exact producer/projection pair in the manifest", [site("producer", value.producer), site("projection", value.projection)]);
    }
    if (permitted.has(`${refKey(value.producer)}:${refKey(value.projection)}`)) admitted.push(value);
  }
  const view = immutable({ [ADMITTED]: true as const, consumer: { ...consumer }, items: admitted });
  CONSUMER_VIEWS.add(view);
  return view;
}

export function assertConsumerEvidenceView(value: unknown): asserts value is ConsumerEvidenceView {
  if (typeof value !== "object" || value === null || (value as { readonly [ADMITTED]?: unknown })[ADMITTED] !== true || !CONSUMER_VIEWS.has(value) || !Array.isArray((value as { readonly items?: unknown }).items)) {
    fail("EVIDENCE_GENERIC_BYPASS", "consumer evidence view was not constructed by evidenceForConsumer", ["consumer-view:unsealed"]);
  }
}

export function assertRenderedEvidenceView(value: unknown): asserts value is RenderedEvidenceView {
  if (typeof value !== "object" || value === null || (value as { readonly [ADMITTED]?: unknown })[ADMITTED] !== true || !RENDERED_VIEWS.has(value) || !Array.isArray((value as { readonly items?: unknown }).items)) {
    fail("EVIDENCE_GENERIC_BYPASS", "rendered evidence view was not constructed by renderEvidenceItems", ["rendered-view:unsealed"]);
  }
}

export function renderEvidenceItems<T>(view: ConsumerEvidenceView<T>, renderers: EvidenceRendererRegistry<T>): RenderedEvidenceView<T> {
  assertConsumerEvidenceView(view);
  const items = view.items.map((evidence) => {
    const renderer = renderers[refKey(evidence.projection)];
    if (renderer === undefined) {
      fail("EVIDENCE_BINDING_UNDECLARED", "admitted projection has no registered renderer", [site("consumer", view.consumer), site("projection", evidence.projection)]);
    }
    return immutable({ evidence, sentences: Object.freeze([...renderer(evidence)]) });
  });
  const rendered = immutable({ [ADMITTED]: true as const, consumer: { ...view.consumer }, items });
  RENDERED_VIEWS.add(rendered);
  return rendered;
}

export function compileEvidenceManifest(declarations: EvidenceContractDeclarations): CompiledEvidenceManifest {
  const producers = [...declarations.producers].sort((left, right) => refKey(left).localeCompare(refKey(right)));
  const consumers = [...declarations.consumers].sort((left, right) => refKey(left).localeCompare(refKey(right)));
  const adapters = [...declarations.adapters].sort((left, right) => refKey(left).localeCompare(refKey(right)));
  const producerMap = new Map<string, ProducerDeclaration>();
  const projectionMap = new Map<string, ProjectionDeclaration>();
  const consumerMap = new Map<string, ConsumerDeclaration>();
  const adapterMap = new Map<string, AdapterDeclaration>();
  const semanticEvents = [...(declarations.semanticEvents ?? [])].sort((left, right) => refKey(left.projection).localeCompare(refKey(right.projection)));
  const eligibility = [...(declarations.eligibility ?? [])].sort((left, right) => `${refKey(left.event)}:${refKey(left.consumer)}`.localeCompare(`${refKey(right.event)}:${refKey(right.consumer)}`));
  const reasons = [...(declarations.reasons ?? [])].sort((left, right) => refKey(left).localeCompare(refKey(right)));
  const selectionPolicies = [...(declarations.selectionPolicies ?? [])].sort((left, right) => refKey(left).localeCompare(refKey(right)));

  for (const producer of producers) {
    assertLiteral(producer, site("producer", producer, producer.implementation));
    if (producerMap.has(refKey(producer))) fail("EVIDENCE_PRODUCER_DUPLICATE", "duplicate producer", [site("producer", producer, producer.implementation), site("producer", producerMap.get(refKey(producer))!, producerMap.get(refKey(producer))!.implementation)]);
    producerMap.set(refKey(producer), producer);
    for (const projection of producer.outputs) {
      assertLiteral(projection, site("projection", projection, producer.implementation));
      assertLiteral(projection.producer, site("projection-producer", projection, producer.implementation));
      if (refKey(projection.producer) !== refKey(producer)) fail("EVIDENCE_BINDING_UNDECLARED", "projection names a different producer", [site("projection", projection, producer.implementation), site("producer", producer, producer.implementation)]);
      const prior = projectionMap.get(refKey(projection));
      if (prior !== undefined) fail("EVIDENCE_PROJECTION_DUPLICATE", "duplicate projection", [site("projection", projection, producer.implementation), site("projection", prior)]);
      const abstentionValid = typeof projection.abstention?.possible === "boolean" && Array.isArray(projection.abstention.reasons) && (!projection.abstention.possible || projection.abstention.reasons.length > 0) && nonEmptyStrings(projection.abstention.reasons);
      const dispositionValid = projection.disposition === undefined || completeDisposition(projection.disposition);
      const members = derivationMembers(projection);
      const derivation = projection.derivation;
      const hasInputs = derivation !== undefined && "inputs" in derivation && derivation.inputs !== undefined;
      const hasAnyOf = derivation !== undefined && "anyOf" in derivation && derivation.anyOf !== undefined;
      const memberKeys = members.map(derivationMemberKey);
      const invalidDerivation = derivation !== undefined && (
        hasInputs === hasAnyOf || members.length === 0 ||
        members.some((member) => member.length === 0 || new Set(member.map(refKey)).size !== member.length) ||
        new Set(memberKeys).size !== memberKeys.length
      );
      if (projection.payloadType.trim() === "" || projection.semantics.trim() === "" || projection.forms.length === 0 || projection.answerContent.length === 0 || !nonEmptyStrings(projection.operands) || !nonEmptyStrings(projection.limitations) || !abstentionValid || !dispositionValid || invalidDerivation) fail("EVIDENCE_PROJECTION_INCOMPLETE", "projection semantics are incomplete", [site("projection", projection, producer.implementation)]);
      projectionMap.set(refKey(projection), projection);
    }
  }

  for (const consumer of consumers) {
    assertLiteral(consumer, site("consumer", consumer, consumer.implementation));
    if (consumerMap.has(refKey(consumer))) fail("EVIDENCE_CONSUMER_ORPHANED", "duplicate consumer declaration", [site("consumer", consumer, consumer.implementation)]);
    if (consumer.disposition !== undefined && !completeDisposition(consumer.disposition)) fail("EVIDENCE_CONSUMER_ORPHANED", "consumer disposition needs one non-empty reason", [site("consumer", consumer, consumer.implementation)]);
    for (const accepted of consumer.accepts) assertLiteral(accepted, site("consumer-accepts", consumer, consumer.implementation));
    consumerMap.set(refKey(consumer), consumer);
  }

  for (const projection of projectionMap.values()) for (const dependency of [...projection.dependsOn, ...derivationMembers(projection).flat()]) {
    assertLiteral(dependency, site("dependency", projection));
    if (!projectionMap.has(refKey(dependency))) fail("EVIDENCE_DEPENDENCY_MISSING", "projection dependency is absent", [site("projection", projection), site("dependency", dependency)]);
  }
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const walk = (key: string, path: string[]): void => {
    if (visiting.has(key)) fail("EVIDENCE_DEPENDENCY_CYCLE", "projection dependency cycle", [...path, key]);
    if (visited.has(key)) return;
    visiting.add(key);
    const projection = projectionMap.get(key)!;
    for (const dependency of [...projection.dependsOn, ...derivationMembers(projection).flat()]) walk(refKey(dependency), [...path, key]);
    visiting.delete(key);
    visited.add(key);
  };
  for (const key of projectionMap.keys()) walk(key, []);

  for (const projection of projectionMap.values()) {
    if (projection.plane !== "derived" && projection.derivation === undefined) continue;
    const members = derivationMembers(projection);
    if (projection.plane !== "derived" || members.length === 0) {
      fail("EVIDENCE_PROJECTION_INCOMPLETE", "derived projection needs a non-empty literal derivation input list", [site("projection", projection)]);
    }
    for (const inputs of members) {
      const inputProjections = inputs.map((input) => projectionMap.get(refKey(input))!);
      const inputAnswers = new Set(inputProjections.flatMap((input) => [...input.answerContent]));
      const inputGroundings = new Set(inputProjections.map((input) => input.grounding));
      const exactnessWidens = projection.exactness === "exact" && inputProjections.some((input) => input.exactness !== "exact");
      const confidenceWidens = inputProjections.some((input) => input.confidence === "reported") && projection.confidence !== "reported";
      const groundingWidens = inputGroundings.size === 1
        ? projection.grounding !== inputProjections[0]!.grounding
        : projection.grounding !== "declared_convention";
      const answersWiden = projection.answerContent.some((answer) => !inputAnswers.has(answer));
      const abstentionWidens = inputProjections.some((input) => input.abstention.possible) && (!projection.abstention.possible || !projection.abstention.reasons.includes("input_abstained"));
      if (exactnessWidens || confidenceWidens || groundingWidens || answersWiden || abstentionWidens) {
        fail("EVIDENCE_DERIVATION_WIDENS", "derived projection exceeds the exactness, confidence, grounding, answer content, or abstention of its inputs", [site("projection", projection), ...inputs.map((input) => site("derivation-input", input))]);
      }
    }
  }


  const bindings: EvidenceBinding[] = [];
  const reasonMap = new Map<string, EvidenceReasonDeclaration>();
  for (const reason of reasons) {
    assertLiteral(reason, site("reason", reason));
    if (reasonMap.has(refKey(reason))) fail("EVIDENCE_REASON_DUPLICATE", "duplicate evidence reason", [site("reason", reason)]);
    if (reason.meaning.trim() === "") fail("EVIDENCE_ELIGIBILITY_ORPHANED", "evidence reason needs a meaning", [site("reason", reason)]);
    reasonMap.set(refKey(reason), reason);
  }

  const eventMap = new Map<string, SemanticEventDeclaration>();
  for (const event of semanticEvents) {
    assertLiteral(event.projection, site("semantic-event", event.projection));
    const key = refKey(event.projection);
    if (eventMap.has(key)) fail("EVIDENCE_EVENT_DUPLICATE", "duplicate semantic event declaration", [site("semantic-event", event.projection)]);
    const projection = projectionMap.get(key);
    if (projection === undefined) fail("EVIDENCE_EVENT_PROJECTION_MISSING", "semantic event projection is absent", [site("semantic-event", event.projection)]);
    if (projection.role !== "event" || projection.disposition !== undefined) fail("EVIDENCE_EVENT_PROJECTION_REFUSED", "semantic event projection is not an active event projection", [site("semantic-event", event.projection)]);
    const declaredMembers = derivationMembers(projection);
    const eventMembers = event.derivationAnyOf ?? (event.derivationInputs === undefined ? [] : [event.derivationInputs]);
    const declaredMemberKeys = declaredMembers.map(derivationMemberKey);
    const eventMemberKeys = eventMembers.map(derivationMemberKey);
    const eventDeclaresBothForms = event.derivationInputs !== undefined && event.derivationAnyOf !== undefined;
    const invalidEventMembers = eventMembers.some((member) => member.length === 0 || new Set(member.map(refKey)).size !== member.length)
      || new Set(eventMemberKeys).size !== eventMemberKeys.length;
    if (eventDeclaresBothForms || invalidEventMembers || !setEqual(eventMemberKeys, declaredMemberKeys)) {
      fail("EVIDENCE_EVENT_DERIVATION_MISMATCH", "semantic event derivation inputs disagree with its projection", [site("semantic-event", event.projection)]);
    }
    if (event.allowedSigns.length === 0 || !subset(event.allowedSigns, projection.signs)) fail("EVIDENCE_EVENT_SIGN_WIDENS", "semantic event signs exceed its projection", [site("semantic-event", event.projection)]);
    if (!subset(event.requiredOperands, projection.operands) || !nonEmptyStrings(event.requiredOperands)) fail("EVIDENCE_EVENT_OPERAND_MISSING", "semantic event requires an operand absent from its projection", [site("semantic-event", event.projection)]);
    if (event.validation.positives.length === 0 || event.validation.hardNegatives.length === 0 || !nonEmptyStrings(event.validation.positives) || !nonEmptyStrings(event.validation.hardNegatives)) fail("EVIDENCE_EVENT_UNVALIDATED", "semantic event needs executable positive and hard-negative fixtures", [site("semantic-event", event.projection)]);
    eventMap.set(key, event);
  }

  const eligibilityMap = new Map<string, EvidenceEligibilityDeclaration>();
  for (const row of eligibility) {
    assertLiteral(row.event, site("eligibility-event", row.event));
    assertLiteral(row.consumer, site("eligibility-consumer", row.consumer));
    assertLiteral(row.reason, site("eligibility-reason", row.reason));
    const key = `${refKey(row.event)}:${refKey(row.consumer)}`;
    if (eligibilityMap.has(key)) fail("EVIDENCE_ELIGIBILITY_DUPLICATE", "duplicate event/consumer eligibility", [key]);
    const event = eventMap.get(refKey(row.event));
    const consumer = consumerMap.get(refKey(row.consumer));
    const reason = reasonMap.get(refKey(row.reason));
    if (event === undefined || consumer === undefined || reason?.stage !== "eligibility") fail("EVIDENCE_ELIGIBILITY_ORPHANED", "eligibility row names an absent event, consumer, or eligibility reason", [key]);
    if (!subset(row.allowedSigns, event.allowedSigns)) fail("EVIDENCE_EVENT_SIGN_WIDENS", "eligibility signs exceed the semantic event", [key]);
    if (!subset(row.requiredOperands, event.requiredOperands)) fail("EVIDENCE_EVENT_OPERAND_MISSING", "eligibility requires an undeclared event operand", [key]);
    if ((event.valence === "source_required") !== (row.valenceAuthority.length > 0)) fail("EVIDENCE_EVENT_VALENCE_UNBACKED", "event valence lacks exact declared authority or invents authority for a valence-free event", [key]);
    for (const authority of row.valenceAuthority) {
      assertLiteral(authority, site("valence-authority", authority));
      if (!projectionMap.has(refKey(authority))) fail("EVIDENCE_EVENT_VALENCE_UNBACKED", "valence authority is absent", [key, site("valence-authority", authority)]);
    }
    eligibilityMap.set(key, row);
  }

  const policyMap = new Map<string, EvidenceSelectionPolicyDeclaration>();
  for (const policy of selectionPolicies) {
    assertLiteral(policy, site("selection-policy", policy));
    assertLiteral(policy.consumer, site("selection-policy-consumer", policy.consumer));
    if (policyMap.has(refKey(policy))) fail("EVIDENCE_POLICY_DUPLICATE", "duplicate evidence selection policy", [site("selection-policy", policy)]);
    if (!consumerMap.has(refKey(policy.consumer))) fail("EVIDENCE_POLICY_CONSUMER_MISSING", "selection policy names an absent consumer", [site("selection-policy", policy), site("consumer", policy.consumer)]);
    const allowedPolicyKeys = new Set(["id", "version", "consumer", "disposition", "minimumAlternatives", "maximumSameFamilyShare", "minimumAlternativeOnlyShare", "maxFacts", "criticalEvents"]);
    const unknownKeys = Object.keys(policy).filter((key) => !allowedPolicyKeys.has(key));
    const sharesValid = Number.isFinite(policy.maximumSameFamilyShare) && policy.maximumSameFamilyShare >= 0 && policy.maximumSameFamilyShare <= 1 && (policy.minimumAlternativeOnlyShare === null || (Number.isFinite(policy.minimumAlternativeOnlyShare) && policy.minimumAlternativeOnlyShare >= 0 && policy.minimumAlternativeOnlyShare <= 1));
    if (unknownKeys.length > 0 || !Number.isSafeInteger(policy.minimumAlternatives) || policy.minimumAlternatives < 0 || !Number.isSafeInteger(policy.maxFacts) || policy.maxFacts < 0 || !sharesValid) fail("EVIDENCE_POLICY_INVALID", `selection policy fields, thresholds and budgets must be exact and in range${unknownKeys.length === 0 ? "" : `; unknown: ${unknownKeys.join(", ")}`}`, [site("selection-policy", policy)]);
    for (const critical of policy.criticalEvents) {
      assertLiteral(critical, site("critical-event", critical));
      const row = eligibilityMap.get(`${refKey(critical)}:${refKey(policy.consumer)}`);
      if (row?.disposition !== "eligible") fail("EVIDENCE_POLICY_CRITICAL_REFUSED", "critical event is not eligible for the policy consumer", [site("selection-policy", policy), site("critical-event", critical)]);
    }
    policyMap.set(refKey(policy), policy);
  }

  for (const adapter of adapters) {
    assertLiteral(adapter, site("adapter", adapter, adapter.implementation));
    assertLiteral(adapter.producer, site("adapter-producer", adapter, adapter.implementation));
    assertLiteral(adapter.projection, site("adapter-projection", adapter, adapter.implementation));
    assertLiteral(adapter.consumer, site("adapter-consumer", adapter, adapter.implementation));
    if (adapterMap.has(refKey(adapter))) fail("EVIDENCE_BINDING_UNDECLARED", "duplicate adapter", [site("adapter", adapter, adapter.implementation)]);
    adapterMap.set(refKey(adapter), adapter);
    const producer = producerMap.get(refKey(adapter.producer));
    const projection = projectionMap.get(refKey(adapter.projection));
    const consumer = consumerMap.get(refKey(adapter.consumer));
    if (producer === undefined || projection === undefined || consumer === undefined || refKey(projection.producer) !== refKey(adapter.producer)) fail("EVIDENCE_BINDING_UNDECLARED", "adapter endpoint is not declared at the exact version", [site("adapter", adapter, adapter.implementation), site("producer", adapter.producer), site("projection", adapter.projection), site("consumer", adapter.consumer)]);
    if (!consumer.accepts.some((accepted) => refKey(accepted) === refKey(projection))) fail("EVIDENCE_BINDING_UNDECLARED", "consumer does not accept the adapter projection", [site("adapter", adapter, adapter.implementation), site("consumer", consumer, consumer.implementation)]);
    const widens = !subset(adapter.forms, projection.forms) || !subset(adapter.forms, consumer.forms) || !subset(adapter.answerContent, projection.answerContent) || !subset(adapter.answerContent, consumer.answerContent) || !subset(adapter.timing, consumer.timing) || !subset(adapter.roles, consumer.roles) || !subset(adapter.sessions, consumer.sessions) || !latencyNarrows(adapter.latency, consumer.latency) || !budgetNarrows(adapter.budget.maxFacts, consumer.budget.maxFacts) || !budgetNarrows(adapter.budget.maxForms, consumer.budget.maxForms);
    if (widens) fail("EVIDENCE_BINDING_WIDENS", "adapter exceeds a producer projection or consumer ceiling", [site("adapter", adapter, adapter.implementation), site("projection", projection), site("consumer", consumer, consumer.implementation)]);
    if (producer.availability === "provider" && (adapter.providerOff === undefined || adapter.providerOff !== consumer.providerOff)) fail("EVIDENCE_PROVIDER_FALLBACK_MISSING", "provider-backed binding lacks the consumer's explicit provider-off behavior", [site("adapter", adapter, adapter.implementation), site("producer", producer, producer.implementation), site("consumer", consumer, consumer.implementation)]);
    bindings.push(immutable({ producer: { ...adapter.producer }, projection: { ...adapter.projection }, consumer: { ...adapter.consumer }, adapter: { id: adapter.id, version: adapter.version }, timing: [...adapter.timing].sort(), roles: [...adapter.roles].sort(), sessions: [...adapter.sessions].sort(), forms: [...adapter.forms].sort(), answerContent: [...adapter.answerContent].sort(), latency: { ...adapter.latency }, budget: { ...adapter.budget } }));
  }

  for (const row of eligibility) {
    const key = `${refKey(row.event)}:${refKey(row.consumer)}`;
    if (row.disposition === "eligible" && !bindings.some((binding) => refKey(binding.projection) === refKey(row.event) && refKey(binding.consumer) === refKey(row.consumer))) fail("EVIDENCE_ELIGIBILITY_ORPHANED", "eligible event is not bound to its exact consumer", [key]);
    for (const authority of row.valenceAuthority) if (!bindings.some((binding) => refKey(binding.projection) === refKey(authority) && refKey(binding.consumer) === refKey(row.consumer))) fail("EVIDENCE_EVENT_VALENCE_UNBACKED", "valence authority is unbound for the consumer", [key, site("valence-authority", authority)]);
  }

  for (const projection of projectionMap.values()) {
    const bound = bindings.some((binding) => refKey(binding.projection) === refKey(projection));
    if (bound === (projection.disposition !== undefined)) fail("EVIDENCE_PROJECTION_ORPHANED", bound ? "bound projection also carries a disposition" : "projection has neither binding nor disposition", [site("projection", projection)]);
  }
  for (const consumer of consumerMap.values()) {
    const bound = bindings.some((binding) => refKey(binding.consumer) === refKey(consumer));
    if ((bound && consumer.disposition !== undefined) || (!bound && consumer.disposition === undefined)) fail("EVIDENCE_CONSUMER_ORPHANED", bound ? "bound consumer also carries a disposition" : "consumer has no usable binding or disposition", [site("consumer", consumer, consumer.implementation)]);
  }
  if ((declarations.genericBypasses?.length ?? 0) > 0) {
    const bypass = declarations.genericBypasses![0]!;
    fail("EVIDENCE_GENERIC_BYPASS", "registered consumer accepts an unwrapped payload", [site("consumer", bypass.consumer, bypass.implementation)]);
  }

  const projections = [...projectionMap.values()].sort((left, right) => refKey(left).localeCompare(refKey(right)));
  bindings.sort((left, right) => `${refKey(left.consumer)}:${refKey(left.projection)}`.localeCompare(`${refKey(right.consumer)}:${refKey(right.projection)}`));
  const material = { producers, projections, consumers, bindings, semanticEvents, eligibility, reasons, selectionPolicies };
  return immutable({ ...material, digest: sha256(canonical(material)) });
}
