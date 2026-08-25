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

function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonical(record[key])}`).join(",")}}`;
}

export function evidenceDigest(value: unknown): string {
  return sha256(canonical(value));
}

// Small dependency-free SHA-256 so the shared runtime contract remains browser-buildable.
function sha256(input: string): string {
  const rightRotate = (value: number, amount: number): number => (value >>> amount) | (value << (32 - amount));
  const maxWord = 2 ** 32;
  const words: number[] = [];
  const ascii = unescape(encodeURIComponent(input));
  const bitLength = ascii.length * 8;
  const hash: number[] = [];
  const constants: number[] = [];
  const composite: Record<number, boolean> = {};
  let prime = 2;
  while (constants.length < 64) {
    if (!composite[prime]) {
      for (let multiple = prime * prime; multiple < 313; multiple += prime) composite[multiple] = true;
      if (hash.length < 8) hash.push((Math.sqrt(prime) * maxWord) | 0);
      constants.push((Math.cbrt(prime) * maxWord) | 0);
    }
    prime += 1;
  }
  const bytes = [...ascii].map((char) => char.charCodeAt(0));
  bytes.push(0x80);
  while (bytes.length % 64 !== 56) bytes.push(0);
  for (let index = 7; index >= 0; index -= 1) bytes.push(index < 4 ? (bitLength >>> (index * 8)) & 0xff : 0);
  for (let offset = 0; offset < bytes.length; offset += 64) {
    for (let index = 0; index < 16; index += 1) words[index] = (bytes[offset + index * 4]! << 24) | (bytes[offset + index * 4 + 1]! << 16) | (bytes[offset + index * 4 + 2]! << 8) | bytes[offset + index * 4 + 3]!;
    for (let index = 16; index < 64; index += 1) {
      const w15 = words[index - 15]!;
      const w2 = words[index - 2]!;
      const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
      const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
      words[index] = (words[index - 16]! + s0 + words[index - 7]! + s1) | 0;
    }
    const state = [...hash];
    for (let index = 0; index < 64; index += 1) {
      const s1 = rightRotate(state[4]!, 6) ^ rightRotate(state[4]!, 11) ^ rightRotate(state[4]!, 25);
      const choose = (state[4]! & state[5]!) ^ (~state[4]! & state[6]!);
      const temp1 = (state[7]! + s1 + choose + constants[index]! + words[index]!) | 0;
      const s0 = rightRotate(state[0]!, 2) ^ rightRotate(state[0]!, 13) ^ rightRotate(state[0]!, 22);
      const majority = (state[0]! & state[1]!) ^ (state[0]! & state[2]!) ^ (state[1]! & state[2]!);
      const temp2 = (s0 + majority) | 0;
      state.unshift((temp1 + temp2) | 0);
      state[4] = (state[4]! + temp1) | 0;
      state.pop();
    }
    for (let index = 0; index < 8; index += 1) hash[index] = (hash[index]! + state[index]!) | 0;
  }
  return hash.map((value) => (value >>> 0).toString(16).padStart(8, "0")).join("");
}

function immutable<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) immutable(child);
    Object.freeze(value);
  }
  return value;
}

export function declareEvidence<T>(producer: VersionedEvidenceId, projection: VersionedEvidenceId, payload: T): DeclaredEvidence<T> {
  assertLiteral(producer, "declared-evidence producer");
  assertLiteral(projection, "declared-evidence projection");
  const value = immutable({ [DECLARED]: true as const, producer: { ...producer }, projection: { ...projection }, payload });
  DECLARED_VALUES.add(value);
  return value;
}

export function assertDeclaredEvidence(value: unknown): asserts value is DeclaredEvidence<unknown> {
  if (typeof value !== "object" || value === null || (value as { readonly [DECLARED]?: unknown })[DECLARED] !== true || !DECLARED_VALUES.has(value)) {
    fail("EVIDENCE_GENERIC_BYPASS", "evidence was not constructed by an exact declared-evidence adapter", ["declared-evidence:unsealed"]);
  }
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
  return immutable({ [ADMITTED]: true as const, consumer: { ...consumer }, items: admitted });
}

export function assertConsumerEvidenceView(value: unknown): asserts value is ConsumerEvidenceView {
  if (typeof value !== "object" || value === null || (value as { readonly [ADMITTED]?: unknown })[ADMITTED] !== true || !Array.isArray((value as { readonly items?: unknown }).items)) {
    fail("EVIDENCE_GENERIC_BYPASS", "consumer evidence view was not constructed by evidenceForConsumer", ["consumer-view:unsealed"]);
  }
}

export function assertRenderedEvidenceView(value: unknown): asserts value is RenderedEvidenceView {
  if (typeof value !== "object" || value === null || (value as { readonly [ADMITTED]?: unknown })[ADMITTED] !== true || !Array.isArray((value as { readonly items?: unknown }).items)) {
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
  return immutable({ [ADMITTED]: true as const, consumer: { ...view.consumer }, items });
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
      const groundingWidens = inputGroundings.size === 1
        ? projection.grounding !== inputProjections[0]!.grounding
        : projection.grounding !== "declared_convention";
      const answersWiden = projection.answerContent.some((answer) => !inputAnswers.has(answer));
      const abstentionWidens = inputProjections.some((input) => input.abstention.possible) && (!projection.abstention.possible || !projection.abstention.reasons.includes("input_abstained"));
      if (exactnessWidens || groundingWidens || answersWiden || abstentionWidens) {
        fail("EVIDENCE_DERIVATION_WIDENS", "derived projection exceeds the exactness, grounding, answer content, or abstention of its inputs", [site("projection", projection), ...inputs.map((input) => site("derivation-input", input))]);
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
