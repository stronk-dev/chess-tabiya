/**
 * `bot-profile-catalog@1` — the one compiled bot-profile catalogue (rfc/bot-policy.md §1, §2, §6;
 * rfc/bot-roster.md §1–§4). Server selection, capabilities, cards and the web client read these
 * literals; no consumer declares its own family, band, layer, classifier or degradation enum.
 *
 * The twelve profiles are DERIVED as `BOT_PROFILE_FAMILIES × BOT_MODEL_BANDS`; nothing here lists
 * them by hand. Digests are pinned literals because this module also runs in the browser, where a
 * synchronous SHA-256 is unavailable; `apps/server/src/bot-profile-catalog.test.ts` recomputes every
 * digest as RFC-8785 SHA-256 and fails on any drift, so a changed declaration cannot keep its digest.
 */
import { exactLegalMoves, type ExactLegalMove } from "./legal-moves.js";

export const BOT_PROFILE_CATALOG_RESOURCE = Object.freeze({ id: "bot-profile-catalog", version: 1 } as const);

export const BOT_PROFILE_FAMILIES = Object.freeze(["human-baseline", "guarded-human", "pawn-forward"] as const);
/** The four pre-registered D324 arms; 2400 and interpolated bands are refused (bot-roster §1). */
export const BOT_MODEL_BANDS = Object.freeze([1000, 1400, 1800, 2200] as const);
export const BOT_LAYER_IDS = Object.freeze([
  "sampler.maia_reconstruction@1",
  "guard.severe_error@1",
  "trait.pawn_preference@1",
] as const);
export const BOT_CLASSIFIER_IDS = Object.freeze(["pawn_move@1"] as const);
export const BOT_DEGRADATION_REASONS = Object.freeze([
  "returned_mass_below_profile_floor",
  "guard_unavailable",
  "guard_deadline",
  "guard_source_failure",
  "guard_mate_domain",
  "guard_mixed_domain",
  "guard_candidate_mismatch",
  "empty_after_mask",
  "candidate_features_unavailable",
  "guard_dependency_abstained",
] as const);
export const BOT_GUARD_ABSTENTION_REASONS = Object.freeze([
  "guard_unavailable",
  "guard_deadline",
  "guard_source_failure",
  "guard_mate_domain",
  "guard_mixed_domain",
  "guard_candidate_mismatch",
  "empty_after_mask",
] as const);

export type BotProfileFamily = (typeof BOT_PROFILE_FAMILIES)[number];
export type BotModelBand = (typeof BOT_MODEL_BANDS)[number];
export type BotProfileId = `${BotProfileFamily}.${BotModelBand}@1`;
export type BotLayerId = (typeof BOT_LAYER_IDS)[number];
export type BotClassifierId = (typeof BOT_CLASSIFIER_IDS)[number];
export type BotDegradationReason = (typeof BOT_DEGRADATION_REASONS)[number];
export type BotGuardAbstentionReason = (typeof BOT_GUARD_ABSTENTION_REASONS)[number];
export type Sha256Digest = `sha256:${string}`;

export const BOT_MAIA_MODEL = Object.freeze({
  id: "maia3-5m@b6559de2398d7140b985f28fd2c19fb5e47ddabe",
  version: "1e13597c42d4858b7cfd7cfdae01e297263364b2",
} as const);
export const BOT_SAMPLER = Object.freeze({
  temperature: 0.8,
  topP: 0.92,
  requestedWidth: 20,
  returnedMassFloor: 0.97,
} as const);

/** Registered measurement identities; values live in `apps/server/src/bot-policy-measurements.ts`. */
export const BOT_MEASUREMENT_IDS = Object.freeze([
  "measurement.sampler_reconstruction@1",
  "measurement.guard_depth8@1",
  "measurement.pawn_x4_depth8@1",
  "measurement.maia_band_ladder@1",
] as const);
export type BotMeasurementId = (typeof BOT_MEASUREMENT_IDS)[number];

export type BotLayerInput =
  | "provider.maia.policy_page@1"
  | "provider.stockfish.legal_root_table@1"
  | `classifier.${BotClassifierId}`;

interface BotLayerBase {
  readonly id: BotLayerId;
  readonly inputs: readonly BotLayerInput[];
  readonly abstentions: readonly BotDegradationReason[];
  readonly changesStrength: true;
  readonly measurement: BotMeasurementId;
}

export interface BotSamplerLayer extends BotLayerBase {
  readonly id: "sampler.maia_reconstruction@1";
  readonly kind: "sampler";
  readonly effect: "sample";
  readonly parameters: typeof BOT_SAMPLER;
}

export interface BotGuardLayer extends BotLayerBase {
  readonly id: "guard.severe_error@1";
  readonly kind: "error_guard";
  readonly effect: "mask";
  readonly parameters: Readonly<{
    engine: "stockfish-guard@1";
    searchBound: Readonly<{ kind: "depth"; value: 8 }>;
    thresholdCp: 250;
    deadlineMs: 500;
    reference: "best_all_legal_centipawn_row";
  }>;
}

export interface BotTraitLayer extends BotLayerBase {
  readonly id: "trait.pawn_preference@1";
  readonly kind: "controlled_trait";
  readonly effect: "weight";
  readonly dependsOn: "guard.severe_error@1";
  readonly parameters: Readonly<{ classifier: "pawn_move@1"; multiplier: 4 }>;
}

export type BotLayerDeclaration = BotSamplerLayer | BotGuardLayer | BotTraitLayer;

export const BOT_LAYER_DECLARATIONS: Readonly<{
  readonly "sampler.maia_reconstruction@1": BotSamplerLayer;
  readonly "guard.severe_error@1": BotGuardLayer;
  readonly "trait.pawn_preference@1": BotTraitLayer;
}> = Object.freeze({
  "sampler.maia_reconstruction@1": Object.freeze({
    id: "sampler.maia_reconstruction@1",
    kind: "sampler",
    effect: "sample",
    inputs: Object.freeze(["provider.maia.policy_page@1"] as const),
    abstentions: Object.freeze(["returned_mass_below_profile_floor"] as const),
    changesStrength: true,
    measurement: "measurement.sampler_reconstruction@1",
    parameters: BOT_SAMPLER,
  }),
  "guard.severe_error@1": Object.freeze({
    id: "guard.severe_error@1",
    kind: "error_guard",
    effect: "mask",
    inputs: Object.freeze(["provider.stockfish.legal_root_table@1"] as const),
    abstentions: BOT_GUARD_ABSTENTION_REASONS,
    changesStrength: true,
    measurement: "measurement.guard_depth8@1",
    parameters: Object.freeze({
      engine: "stockfish-guard@1",
      searchBound: Object.freeze({ kind: "depth", value: 8 } as const),
      thresholdCp: 250,
      deadlineMs: 500,
      reference: "best_all_legal_centipawn_row",
    } as const),
  }),
  "trait.pawn_preference@1": Object.freeze({
    id: "trait.pawn_preference@1",
    kind: "controlled_trait",
    effect: "weight",
    dependsOn: "guard.severe_error@1",
    inputs: Object.freeze(["classifier.pawn_move@1"] as const),
    abstentions: Object.freeze(["guard_dependency_abstained"] as const),
    changesStrength: true,
    measurement: "measurement.pawn_x4_depth8@1",
    parameters: Object.freeze({ classifier: "pawn_move@1", multiplier: 4 } as const),
  }),
});

export const BOT_FAMILY_LAYERS: Readonly<Record<BotProfileFamily, readonly BotLayerId[]>> = Object.freeze({
  "human-baseline": Object.freeze(["sampler.maia_reconstruction@1"] as const),
  "guarded-human": Object.freeze(["sampler.maia_reconstruction@1", "guard.severe_error@1"] as const),
  "pawn-forward": Object.freeze(["sampler.maia_reconstruction@1", "guard.severe_error@1", "trait.pawn_preference@1"] as const),
});

/** The exact reference a run stores (rfc/bot-policy.md §4.1); every field is compared, none inferred. */
export interface BotProfileReference {
  readonly id: BotProfileId;
  readonly family: BotProfileFamily;
  readonly band: BotModelBand;
  readonly version: 1;
  readonly digest: Sha256Digest;
  readonly model: typeof BOT_MAIA_MODEL;
  readonly sampler: typeof BOT_SAMPLER;
  readonly orderedLayers: readonly BotLayerId[];
}

/** Move-affecting declaration only: what a calibration receipt keys (bot-roster §2). */
export interface BotBehaviorDeclaration {
  readonly band: BotModelBand;
  readonly model: typeof BOT_MAIA_MODEL;
  readonly sampler: typeof BOT_SAMPLER;
  readonly layers: readonly BotLayerDeclaration[];
  readonly repertoire: null;
  readonly memory: null;
  readonly timing: null;
}

/**
 * Decorative identity is owner-authored (D1610) and not yet supplied, so every profile carries
 * `null`. A later owner registry changes `digest` while preserving `behaviorDigest`.
 */
export type BotPresentationReference = null;

export interface BotProfileDeclaration {
  readonly id: BotProfileId;
  readonly family: BotProfileFamily;
  readonly band: BotModelBand;
  readonly version: 1;
  readonly model: typeof BOT_MAIA_MODEL;
  readonly sampler: typeof BOT_SAMPLER;
  readonly orderedLayers: readonly BotLayerId[];
  readonly behaviorDigest: Sha256Digest;
  readonly presentation: BotPresentationReference;
}

export interface BotProfileCatalogEntry {
  readonly reference: BotProfileReference;
  readonly behavior: BotBehaviorDeclaration;
  readonly behaviorDigest: Sha256Digest;
  readonly presentation: BotPresentationReference;
}

export function botProfileId(family: BotProfileFamily, band: BotModelBand): BotProfileId {
  return `${family}.${band}@1`;
}

export function botBehaviorDeclaration(family: BotProfileFamily, band: BotModelBand): BotBehaviorDeclaration {
  return Object.freeze({
    band,
    model: BOT_MAIA_MODEL,
    sampler: BOT_SAMPLER,
    layers: Object.freeze(BOT_FAMILY_LAYERS[family].map((id) => BOT_LAYER_DECLARATIONS[id])),
    repertoire: null,
    memory: null,
    timing: null,
  });
}

/** The canonical declaration whose RFC-8785 SHA-256 is the profile digest. */
export function botProfileDeclaration(family: BotProfileFamily, band: BotModelBand, behaviorDigest: Sha256Digest): BotProfileDeclaration {
  return Object.freeze({
    id: botProfileId(family, band),
    family,
    band,
    version: 1,
    model: BOT_MAIA_MODEL,
    sampler: BOT_SAMPLER,
    orderedLayers: BOT_FAMILY_LAYERS[family],
    behaviorDigest,
    presentation: null,
  });
}

/** Generated by `apps/server/src/bot-profile-catalog.test.ts` (it prints and asserts these). */
export const BOT_PROFILE_DIGESTS: Readonly<Record<BotProfileId, Readonly<{ digest: Sha256Digest; behaviorDigest: Sha256Digest }>>> = Object.freeze({
"human-baseline.1000@1": Object.freeze({ digest: "sha256:d2909149628d983c783dca6bf22f889f32904b1d5a1ab27f018e373e898ce8e4", behaviorDigest: "sha256:95ced0d20f7e5f39b81b8d91101da7b7d94d7e213b832fab2c8f61d6eb3d43db" }),
  "human-baseline.1400@1": Object.freeze({ digest: "sha256:8441145ea4a9276a91560a736442b4bbce21bfb3b7ebd2a737b2dcb9b6cff467", behaviorDigest: "sha256:7977dda6a615f59fc2dc8b7552dc4ce8f0dbf6d169946447f8a4ed4e59d5b429" }),
  "human-baseline.1800@1": Object.freeze({ digest: "sha256:cad23a02b806720c950ebe255ee33d4b8008a8e72f901515abdbd9ec2ed090a5", behaviorDigest: "sha256:f120d3a9dcfdcb54306f9f40bac077ccf1a96efa83dcd5e83420a3b7dea968ba" }),
  "human-baseline.2200@1": Object.freeze({ digest: "sha256:2b9b65d3e6384a9c6b7c94553a258e1e947c71f449c32b7d9ee7bc7704de41c3", behaviorDigest: "sha256:6c587c5ec83bae95121feffe554918798410c108cf017ed3097562c892a808c6" }),
  "guarded-human.1000@1": Object.freeze({ digest: "sha256:7a3797ac016072bf756659ed823ad2d1a1be780d723c7466cafe1b3fb48227f2", behaviorDigest: "sha256:435648d9808e35ae3392e225dec13cc9c31c2dd7cd0ac9e43bb922a78d300bb9" }),
  "guarded-human.1400@1": Object.freeze({ digest: "sha256:21a3eb4d5da558078aa3bbf67e830981873b7a3ed7979661045faa880e2b6d2e", behaviorDigest: "sha256:c37b9cdd04aa4e66d68b199e79c337e62a6895f66ad964ad4738e657568f6524" }),
  "guarded-human.1800@1": Object.freeze({ digest: "sha256:8ff87d4cbb313a76e30272a5bbdaafa6f9307ed5e128c1af70e79052966acf3a", behaviorDigest: "sha256:466cad1b8b7df07bccd0c289bf4d98a6db77314f1fa3f6aceadaff7d4dca3765" }),
  "guarded-human.2200@1": Object.freeze({ digest: "sha256:4db8dd36000bf25e118538847185fa381c15a3219a7686e0613001833553cd52", behaviorDigest: "sha256:9326493a824bb313380420938de0ba633710196fe6f29d88e8dc715e879a19a6" }),
  "pawn-forward.1000@1": Object.freeze({ digest: "sha256:bd54e0dccaa55abcb0589f13f019653203cafaff44fd83fe7b4b81ded0611467", behaviorDigest: "sha256:8c41b84ee7b47997c911255dbf9078abc62c553acdc82d89c523cf2c274b1df7" }),
  "pawn-forward.1400@1": Object.freeze({ digest: "sha256:d7de046ac50fb0f9eedb135e7ee62469d25b42b112494387b0773b93eb74752b", behaviorDigest: "sha256:6bfa11efccf40908016e10caace6b5a148df9c1566c099990bc141bb7fadf924" }),
  "pawn-forward.1800@1": Object.freeze({ digest: "sha256:83e2c73aff0f2081a4939cbe9de116676f328e97ca4645f678f4af52e1077611", behaviorDigest: "sha256:4cfb02e368205cb3bcd279dee3c9329b8916b943ee6cbbc0ab072b2b0dab10fd" }),
  "pawn-forward.2200@1": Object.freeze({ digest: "sha256:47aeaa1be0225f3e0dca7233f710c3a1d30a42146fdc0e33a07b7f965685c77b", behaviorDigest: "sha256:664d35e25e8c730d65a9471f7287f3134f6f557558aad5cb83c299ddd5565897" }),
});

function catalogEntry(family: BotProfileFamily, band: BotModelBand): BotProfileCatalogEntry {
  const id = botProfileId(family, band);
  const pinned = BOT_PROFILE_DIGESTS[id];
  return Object.freeze({
    reference: Object.freeze({
      id,
      family,
      band,
      version: 1,
      digest: pinned.digest,
      model: BOT_MAIA_MODEL,
      sampler: BOT_SAMPLER,
      orderedLayers: BOT_FAMILY_LAYERS[family],
    }),
    behavior: botBehaviorDeclaration(family, band),
    behaviorDigest: pinned.behaviorDigest,
    presentation: null,
  });
}

/** Exactly `FAMILIES × BANDS`, family-major. */
export const BOT_PROFILE_CATALOG: readonly BotProfileCatalogEntry[] = Object.freeze(
  BOT_PROFILE_FAMILIES.flatMap((family) => BOT_MODEL_BANDS.map((band) => catalogEntry(family, band))),
);

export class BotProfileError extends TypeError {
  readonly code: "BOT_PROFILE_INVALID";
  constructor(message: string) {
    super(message);
    this.name = "BotProfileError";
    this.code = "BOT_PROFILE_INVALID";
  }
}

const DIGEST = /^sha256:[0-9a-f]{64}$/u;

function plain(value: unknown): value is Readonly<Record<string, unknown>> {
  return value !== null && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}

function exactKeys(value: Readonly<Record<string, unknown>>, keys: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

export function catalogEntryFor(id: string): BotProfileCatalogEntry | undefined {
  return BOT_PROFILE_CATALOG.find((entry) => entry.reference.id === id);
}

/**
 * The only way unknown bytes become a profile. The closed shape is checked and then the WHOLE
 * reference must equal one catalog member — a genuine id/digest carrying a substituted family,
 * band, sampler or layer list is invalid, not a weaker profile ([[D3025]]).
 */
export function resolveBotProfileReference(value: unknown): BotProfileCatalogEntry {
  if (!plain(value) || !exactKeys(value, ["id", "family", "band", "version", "digest", "model", "sampler", "orderedLayers"])) {
    throw new BotProfileError("Bot profile reference has an invalid shape");
  }
  if (typeof value.digest !== "string" || !DIGEST.test(value.digest)) throw new BotProfileError("Bot profile digest must be a canonical sha256 digest");
  const entry = typeof value.id === "string" ? catalogEntryFor(value.id) : undefined;
  if (entry === undefined) throw new BotProfileError("Bot profile is not registered in bot-profile-catalog@1");
  const expected = entry.reference;
  const model = value.model;
  const sampler = value.sampler;
  const layers = value.orderedLayers;
  const same = value.family === expected.family
    && value.band === expected.band
    && value.version === expected.version
    && value.digest === expected.digest
    && plain(model) && exactKeys(model, ["id", "version"]) && model.id === expected.model.id && model.version === expected.model.version
    && plain(sampler) && exactKeys(sampler, ["temperature", "topP", "requestedWidth", "returnedMassFloor"])
    && sampler.temperature === expected.sampler.temperature && sampler.topP === expected.sampler.topP
    && sampler.requestedWidth === expected.sampler.requestedWidth && sampler.returnedMassFloor === expected.sampler.returnedMassFloor
    && Array.isArray(layers) && layers.length === expected.orderedLayers.length
    && layers.every((layer, index) => layer === expected.orderedLayers[index]);
  if (!same) throw new BotProfileError("Bot profile reference does not equal its complete catalog member");
  return entry;
}

/** Controlled traits a profile intentionally changes (the card's "controlled" slot; O8.2). */
export function botControlledTraits(entry: BotProfileCatalogEntry): readonly BotClassifierId[] {
  return Object.freeze(entry.behavior.layers.flatMap((layer) => layer.kind === "controlled_trait" ? [layer.parameters.classifier] : []));
}

// ---------------------------------------------------------------------------------------------
// Card and roster wire grammar shared by the server card compiler and the web parser.

export const BOT_FAMILY_LABELS: Readonly<Record<BotProfileFamily, string>> = Object.freeze({
  "human-baseline": "Human baseline",
  "guarded-human": "Guarded human",
  "pawn-forward": "Pawn-forward",
});

export const BOT_CARD_STATEMENT_IDS = Object.freeze([
  "card.model_band",
  "card.sampler",
  "card.band_ladder",
  "card.guard",
  "card.guard_measurement",
  "card.guard_abstention",
  "card.pawn_trait",
  "card.pawn_dependency",
  "card.no_book",
  "card.no_memory",
  "card.no_timing",
  "card.endgame_scope",
  "card.calibration",
] as const);
export type BotCardStatementId = (typeof BOT_CARD_STATEMENT_IDS)[number];

export const BOT_CARD_SOURCE_IDS = Object.freeze([
  "catalog.profile",
  "layer.sampler.maia_reconstruction@1",
  "layer.guard.severe_error@1",
  "layer.trait.pawn_preference@1",
  ...BOT_MEASUREMENT_IDS,
  "absence.repertoire",
  "absence.memory",
  "absence.timing",
  "scope.endgame",
  "calibration.receipt",
  "calibration.absent",
] as const);
export type BotCardSourceId = (typeof BOT_CARD_SOURCE_IDS)[number];

/**
 * Profile availability (rfc/bot-policy.md §4.3, §8). A roster row is derived from the shared
 * provider exchange's own observed outcomes for the operations the profile needs — never from a
 * configuration flag. Baseline needs only `maia.policy_page@1`; guarded and pawn-forward profiles
 * additionally need `stockfish.legal_root_table@1` and a provider-health release receipt, which does
 * not exist yet, so they are at best conditional.
 *
 * - `available`: every required operation's last observed exchange outcome was a delivery.
 * - `conditional`: startable, but a named condition is not yet proven (never observed, or the
 *   release receipt is absent).
 * - `unavailable`: a required operation's last observed outcome was `provider_unavailable` or an
 *   identity mismatch. Not startable.
 */
export const BOT_AVAILABILITY_CONDITIONS = Object.freeze(["maia_unverified", "stockfish_unverified", "guard_release_receipt_absent"] as const);
export type BotAvailabilityCondition = (typeof BOT_AVAILABILITY_CONDITIONS)[number];
export const BOT_AVAILABILITY_BLOCKERS = Object.freeze(["maia_unavailable", "stockfish_unavailable"] as const);
export type BotAvailabilityBlocker = (typeof BOT_AVAILABILITY_BLOCKERS)[number];

export type BotProfileStartability =
  | Readonly<{ kind: "available" }>
  | Readonly<{ kind: "conditional"; conditions: readonly BotAvailabilityCondition[] }>
  | Readonly<{ kind: "unavailable"; blockedBy: readonly BotAvailabilityBlocker[] }>;

/** The per-operation provider observation a profile joins (one closed state per operation). */
export type BotProviderOperationState = "unverified" | "available" | "unavailable";

export interface BotProviderAvailabilitySnapshot {
  readonly revision: number;
  readonly maia: BotProviderOperationState;
  readonly stockfish: BotProviderOperationState;
}

/**
 * The §4.3 profile join. Baseline ignores Stockfish entirely; a guarded family is unavailable when
 * either operation is unavailable and otherwise conditional until a release receipt exists.
 */
export function botProfileStartability(entry: BotProfileCatalogEntry, snapshot: BotProviderAvailabilitySnapshot): BotProfileStartability {
  const guarded = entry.reference.orderedLayers.includes("guard.severe_error@1");
  const blockedBy: BotAvailabilityBlocker[] = [];
  if (snapshot.maia === "unavailable") blockedBy.push("maia_unavailable");
  if (guarded && snapshot.stockfish === "unavailable") blockedBy.push("stockfish_unavailable");
  if (blockedBy.length > 0) return Object.freeze({ kind: "unavailable", blockedBy: Object.freeze(blockedBy) });
  const conditions: BotAvailabilityCondition[] = [];
  if (snapshot.maia === "unverified") conditions.push("maia_unverified");
  if (guarded && snapshot.stockfish === "unverified") conditions.push("stockfish_unverified");
  if (guarded) conditions.push("guard_release_receipt_absent");
  return conditions.length === 0 ? Object.freeze({ kind: "available" }) : Object.freeze({ kind: "conditional", conditions: Object.freeze(conditions) });
}

export function botProfileIsStartable(startability: BotProfileStartability): boolean {
  return startability.kind !== "unavailable";
}

// ---------------------------------------------------------------------------------------------
// Layer-composition compiler (rfc/bot-policy.md §3 compile-time failures; A5).

/** An unregistered, author-supplied candidate layer. Only `assertBotLayerComposition` judges it. */
export interface CandidateBotLayer {
  readonly id: string;
  readonly kind: "human_policy_model" | "sampler" | "repertoire" | "error_guard" | "controlled_trait" | "memory" | "presentation" | "timing";
  readonly effect: "base_distribution" | "sample" | "prior" | "mask" | "weight" | "memory" | "presentation" | "delay";
  readonly inputs: readonly string[];
  readonly parameters?: Readonly<Record<string, unknown>>;
  readonly parameterCitation?: string;
  readonly dependsOn?: string;
  readonly requiresLegalSetEquality?: boolean;
  readonly measurement?: Readonly<{
    readonly artifact: string;
    readonly traitDeltaFraction: number;
    readonly expectedLossShiftCp: number;
    readonly severeMassRise: number;
    readonly explorerMatchRetention: number;
  }>;
}

export class BotCompositionError extends TypeError {
  constructor(message: string) {
    super(`Bot policy composition refused: ${message}`);
    this.name = "BotCompositionError";
  }
}

const LEARNER_DERIVED = /(?:learner|habit|style|rating|run[_.-]?record|history\.learner)/iu;
const REGISTERED_INPUTS = new Set<string>([
  "provider.maia.policy_page@1",
  "provider.stockfish.legal_root_table@1",
  ...BOT_CLASSIFIER_IDS.map((id) => `classifier.${id}`),
]);
const SINGLETON_KINDS = new Set(["human_policy_model", "sampler", "repertoire", "error_guard", "memory", "presentation"]);

/**
 * Refuses every composition §3 names: duplicate authority, delay/timing, memory, repertoire
 * instances, learner-derived inputs or uncited parameters, an unregistered classifier, an
 * unmeasured or gate-failing trait, a trait without its guard, and a legal-set-equality transform
 * over the bounded Maia page. Registered catalog layers pass; forcing ×3 / quiet ×3 fail.
 */
export function assertBotLayerComposition(layers: readonly CandidateBotLayer[]): void {
  const seen = new Set<string>();
  const authorities = new Map<string, string>();
  const maskBases = new Map<string, string>();
  for (const layer of layers) {
    if (seen.has(layer.id)) throw new BotCompositionError(`duplicate layer ${layer.id}`);
    seen.add(layer.id);
    if (layer.effect === "delay" || layer.kind === "timing") throw new BotCompositionError(`${layer.id} declares a refused delay effect`);
    if (layer.kind === "memory") throw new BotCompositionError(`${layer.id} is a memory instance; the interface is reserved and off`);
    if (layer.kind === "repertoire") throw new BotCompositionError(`${layer.id} is a repertoire instance; no immutable book reached declared coverage`);
    for (const input of layer.inputs) {
      if (LEARNER_DERIVED.test(input)) throw new BotCompositionError(`${layer.id} reads learner-derived input ${input}`);
      if (!REGISTERED_INPUTS.has(input)) throw new BotCompositionError(`${layer.id} reads unregistered input ${input}`);
    }
    if (layer.parameters !== undefined && Object.keys(layer.parameters).length > 0) {
      const citation = layer.parameterCitation ?? layer.measurement?.artifact ?? "";
      if (citation.trim() === "" || LEARNER_DERIVED.test(citation)) {
        throw new BotCompositionError(`${layer.id} carries parameters without a population measurement citation`);
      }
    }
    if (SINGLETON_KINDS.has(layer.kind)) {
      const prior = authorities.get(layer.kind);
      if (prior !== undefined) throw new BotCompositionError(`${prior} and ${layer.id} claim the same ${layer.kind} authority`);
      authorities.set(layer.kind, layer.id);
    }
    if (layer.effect === "mask") {
      const basis = layer.inputs.join("+");
      const prior = maskBases.get(basis);
      if (prior !== undefined) throw new BotCompositionError(`${prior} and ${layer.id} both mask on ${basis}`);
      maskBases.set(basis, layer.id);
    }
    if (layer.kind === "sampler") {
      const temperature = layer.parameters?.temperature;
      const topP = layer.parameters?.topP;
      if (typeof temperature !== "number" || !(temperature > 0)) throw new BotCompositionError(`${layer.id} temperature must be greater than zero`);
      if (typeof topP !== "number" || !(topP > 0 && topP <= 1)) throw new BotCompositionError(`${layer.id} topP must be in (0, 1]`);
    }
    if (layer.kind === "error_guard" && !layer.inputs.includes("provider.stockfish.legal_root_table@1")) {
      throw new BotCompositionError(`${layer.id} has no registered stockfish.legal_root_table@1 source`);
    }
    if (layer.requiresLegalSetEquality === true && !layer.inputs.includes("provider.stockfish.legal_root_table@1")) {
      throw new BotCompositionError(`${layer.id} requires legal-set equality but reads only the bounded Maia page`);
    }
    if (layer.kind === "controlled_trait") {
      const classifier = layer.parameters?.classifier;
      if (typeof classifier !== "string" || !(BOT_CLASSIFIER_IDS as readonly string[]).includes(classifier)) {
        throw new BotCompositionError(`${layer.id} has no registered classifier`);
      }
      const measured = layer.measurement;
      if (measured === undefined || measured.artifact.trim() === "") throw new BotCompositionError(`${layer.id} has no cited measurement`);
      if (!Number.isFinite(measured.traitDeltaFraction) || measured.traitDeltaFraction < 0.1 || measured.traitDeltaFraction > 1
        || Math.abs(measured.expectedLossShiftCp) > 35 || measured.severeMassRise > 0.01 || measured.explorerMatchRetention < 0.9) {
        throw new BotCompositionError(`${layer.id} does not clear the controlled-trait gate`);
      }
      if (layer.dependsOn === undefined || !layers.some((other) => other.id === layer.dependsOn && other.kind === "error_guard")) {
        throw new BotCompositionError(`${layer.id} is measured only after the guard and must depend on it`);
      }
    }
  }
}

// ---------------------------------------------------------------------------------------------
// `pawn_move@1`: the registered legal-board classifier (rfc/bot-policy.md §2.5; A4).

export interface PawnMoveClassification {
  readonly moveUci: string;
  readonly role: ExactLegalMove["role"];
  readonly promotion: ExactLegalMove["promotion"] | null;
  readonly classifiers: readonly BotClassifierId[];
}

/**
 * Classifies every exact legal move from `fen` by its board role, never a UCI prefix: both colours,
 * all files, pushes, captures, en passant and every promotion are positives; castling and non-pawn
 * moves are negatives. The result is set-equal to the exact legal move map.
 */
export function classifyPawnMoves(fen: string): readonly PawnMoveClassification[] {
  return Object.freeze(exactLegalMoves(fen).map((move) => Object.freeze({
    moveUci: move.uci,
    role: move.role,
    promotion: move.promotion ?? null,
    classifiers: Object.freeze(move.role === "pawn" ? (["pawn_move@1"] as const) : ([] as const)),
  })));
}
