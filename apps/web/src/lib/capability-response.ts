import {
  BOT_CARD_SOURCE_IDS,
  BOT_CARD_STATEMENT_IDS,
  BOT_CLASSIFIER_IDS,
  BOT_PROFILE_CATALOG,
  BOT_ROSTER_BLOCKERS,
  resolveBotProfileReference,
} from "@chess-tabiya/runtime";

import type { Capabilities } from "./api.js";

type RecordValue = Readonly<Record<string, unknown>>;

const POLICY_MODES = ["human_common", "strong_engine", "theory_strict", "perfect_tablebase", "practical_resistance"] as const;
const ASSESSMENTS = ["win", "loss", "draw", "cursed-win", "blessed-loss"] as const;
const FORMS = ["sentence", "list", "timeline_marker", "lit_squares", "arrows", "piece_halo", "panel", "audio", "machine_condition"] as const;
const SURFACES = ["play", "review", "learn", "live", "create", "justPlay", "fromPosition"] as const;

function record(value: unknown, label: string): RecordValue {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`);
  return value as RecordValue;
}

function exact(value: RecordValue, required: readonly string[], label: string, optional: readonly string[] = []): void {
  const allowed = new Set([...required, ...optional]);
  if (required.some((key) => !(key in value)) || Object.keys(value).some((key) => !allowed.has(key))) throw new TypeError(`${label} has an invalid shape`);
}

function nonempty(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "") throw new TypeError(`${label} must be a non-empty string`);
  return value;
}

function oneOf<T extends string>(value: unknown, values: readonly T[], label: string): T {
  if (typeof value !== "string" || !values.includes(value as T)) throw new TypeError(`${label} is outside the closed vocabulary`);
  return value as T;
}

function integer(value: unknown, label: string, minimum = Number.MIN_SAFE_INTEGER): number {
  if (!Number.isSafeInteger(value) || Number(value) < minimum) throw new TypeError(`${label} must be a safe integer`);
  return Number(value);
}

function finite(value: unknown, label: string, minimum?: number, maximum?: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new TypeError(`${label} must be finite`);
  if ((minimum !== undefined && value < minimum) || (maximum !== undefined && value > maximum)) throw new TypeError(`${label} is outside its bounds`);
  return value;
}

function boolean(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") throw new TypeError(`${label} must be boolean`);
  return value;
}

function uniqueVocabulary<T extends string>(value: unknown, values: readonly T[], label: string, minimum = 0): readonly T[] {
  if (!Array.isArray(value) || value.length < minimum) throw new TypeError(`${label} must contain at least ${minimum} entries`);
  const parsed = value.map((entry, index) => oneOf(entry, values, `${label}/${index}`));
  if (new Set(parsed).size !== parsed.length) throw new TypeError(`${label} contains duplicates`);
  return parsed;
}

function nullableInteger(value: unknown, label: string): number | null {
  return value === null ? null : integer(value, label);
}

function validateEngines(value: unknown): void {
  if (!Array.isArray(value)) throw new TypeError("capabilities/engines must be an array");
  const ids = new Set<string>();
  value.forEach((raw, index) => {
    const label = `capabilities/engines/${index}`, item = record(raw, label); exact(item, ["id", "kind", "name", "version", "seedHonored"], label, ["modelId", "containerDigest", "eloHonored"]);
    const id = nonempty(item.id, `${label}/id`); if (ids.has(id)) throw new TypeError("capabilities/engines contains a duplicate id"); ids.add(id);
    oneOf(item.kind, ["opponent", "judge"] as const, `${label}/kind`); nonempty(item.name, `${label}/name`); nonempty(item.version, `${label}/version`); boolean(item.seedHonored, `${label}/seedHonored`);
    if (item.modelId !== undefined) nonempty(item.modelId, `${label}/modelId`); if (item.containerDigest !== undefined) nonempty(item.containerDigest, `${label}/containerDigest`); if (item.eloHonored !== undefined) boolean(item.eloHonored, `${label}/eloHonored`);
  });
}

function validateProfiles(value: unknown): void {
  const profiles = record(value, "capabilities/policyProfiles"); exact(profiles, ["strong_engine", "human_common"], "capabilities/policyProfiles");
  const strong = record(profiles.strong_engine, "capabilities/policyProfiles/strong_engine"); exact(strong, ["movetimeMs", "threads", "hashMb", "multiPv"], "capabilities/policyProfiles/strong_engine");
  integer(strong.movetimeMs, "capabilities/policyProfiles/strong_engine/movetimeMs", 1); integer(strong.threads, "capabilities/policyProfiles/strong_engine/threads", 1); integer(strong.hashMb, "capabilities/policyProfiles/strong_engine/hashMb", 1); integer(strong.multiPv, "capabilities/policyProfiles/strong_engine/multiPv", 1);
  const human = record(profiles.human_common, "capabilities/policyProfiles/human_common"); exact(human, ["elo", "resistance", "profiles"], "capabilities/policyProfiles/human_common");
  validateRoster(human.profiles);
  const elo = record(human.elo, "capabilities/policyProfiles/human_common/elo"); exact(elo, ["min", "max", "default", "source", "advertised"], "capabilities/policyProfiles/human_common/elo");
  const min = nullableInteger(elo.min, "capabilities/policyProfiles/human_common/elo/min"), max = nullableInteger(elo.max, "capabilities/policyProfiles/human_common/elo/max"), fallback = nullableInteger(elo.default, "capabilities/policyProfiles/human_common/elo/default");
  oneOf(elo.source, ["advertised", "configured", "advertised+configured", "unpublished"] as const, "capabilities/policyProfiles/human_common/elo/source");
  if (min !== null && max !== null && max < min) throw new TypeError("capabilities human Elo window is reversed"); if (fallback !== null && ((min !== null && fallback < min) || (max !== null && fallback > max))) throw new TypeError("capabilities human Elo default is outside its window");
  const advertised = record(elo.advertised, "capabilities/policyProfiles/human_common/elo/advertised"); exact(advertised, ["min", "max"], "capabilities/policyProfiles/human_common/elo/advertised"); const advertisedMin = nullableInteger(advertised.min, "capabilities/policyProfiles/human_common/elo/advertised/min"), advertisedMax = nullableInteger(advertised.max, "capabilities/policyProfiles/human_common/elo/advertised/max"); if (advertisedMin !== null && advertisedMax !== null && advertisedMax < advertisedMin) throw new TypeError("capabilities advertised Elo window is reversed");
  const resistance = record(human.resistance, "capabilities/policyProfiles/human_common/resistance"); exact(resistance, ["basis", "metric", "scope", "corpus", "bands", "bandConditioned", "dtzPercentile", "slowestLosingRate", "fastestLosingRate"], "capabilities/policyProfiles/human_common/resistance");
  oneOf(resistance.basis, ["measured"] as const, "capabilities/policyProfiles/human_common/resistance/basis"); oneOf(resistance.metric, ["dtz_percentile"] as const, "capabilities/policyProfiles/human_common/resistance/metric"); nonempty(resistance.scope, "capabilities/policyProfiles/human_common/resistance/scope"); boolean(resistance.bandConditioned, "capabilities/policyProfiles/human_common/resistance/bandConditioned");
  const corpus = record(resistance.corpus, "capabilities/policyProfiles/human_common/resistance/corpus"); exact(corpus, ["dossier", "positions", "probes", "measuredAt"], "capabilities/policyProfiles/human_common/resistance/corpus"); nonempty(corpus.dossier, "capabilities/policyProfiles/human_common/resistance/corpus/dossier"); integer(corpus.positions, "capabilities/policyProfiles/human_common/resistance/corpus/positions", 1); integer(corpus.probes, "capabilities/policyProfiles/human_common/resistance/corpus/probes", 1); if (typeof corpus.measuredAt !== "string" || !/^\d{4}-\d{2}-\d{2}$/u.test(corpus.measuredAt)) throw new TypeError("capabilities resistance date must be YYYY-MM-DD");
  if (!Array.isArray(resistance.bands) || resistance.bands.length === 0) throw new TypeError("capabilities resistance bands must be non-empty"); const bands = resistance.bands.map((band, index) => integer(band, `capabilities/policyProfiles/human_common/resistance/bands/${index}`, 1)); if (new Set(bands).size !== bands.length) throw new TypeError("capabilities resistance bands contain duplicates");
  const range = (raw: unknown, label: string): void => { const item = record(raw, label); exact(item, ["min", "max", "uniformBaseline"], label); const rangeMin = finite(item.min, `${label}/min`, 0, 1), rangeMax = finite(item.max, `${label}/max`, 0, 1); finite(item.uniformBaseline, `${label}/uniformBaseline`, 0, 1); if (rangeMax < rangeMin) throw new TypeError(`${label} is reversed`); };
  range(resistance.dtzPercentile, "capabilities/policyProfiles/human_common/resistance/dtzPercentile"); range(resistance.slowestLosingRate, "capabilities/policyProfiles/human_common/resistance/slowestLosingRate");
  const fastest = record(resistance.fastestLosingRate, "capabilities/policyProfiles/human_common/resistance/fastestLosingRate"); exact(fastest, ["value", "uniformBaseline"], "capabilities/policyProfiles/human_common/resistance/fastestLosingRate"); finite(fastest.value, "capabilities/policyProfiles/human_common/resistance/fastestLosingRate/value", 0, 1); finite(fastest.uniformBaseline, "capabilities/policyProfiles/human_common/resistance/fastestLosingRate/uniformBaseline", 0, 1);
}

/**
 * The roster wire is the runtime `bot-profile-catalog@1` projection: every row's reference must
 * equal its complete catalog member, the id set must be set-equal to the catalog, and card/source/
 * blocker ids come from the runtime's closed vocabularies — the client declares none of its own.
 */
export function validateRoster(value: unknown): void {
  const label = "capabilities/policyProfiles/human_common/profiles";
  if (!Array.isArray(value)) throw new TypeError(`${label} must be an array`);
  const ids = new Set<string>();
  value.forEach((raw, index) => {
    const rowLabel = `${label}/${index}`, row = record(raw, rowLabel); exact(row, ["reference", "behaviorDigest", "card", "startable"], rowLabel);
    let entry: (typeof BOT_PROFILE_CATALOG)[number];
    try { entry = resolveBotProfileReference(row.reference); } catch { throw new TypeError(`${rowLabel}/reference is not a registered catalog member`); }
    if (ids.has(entry.reference.id)) throw new TypeError(`${label} contains a duplicate profile`); ids.add(entry.reference.id);
    if (row.behaviorDigest !== entry.behaviorDigest) throw new TypeError(`${rowLabel}/behaviorDigest does not match the catalog`);
    const card = record(row.card, `${rowLabel}/card`); exact(card, ["profileId", "profileDigest", "behaviorDigest", "family", "band", "title", "controlledTraits", "statements", "strength", "decorative"], `${rowLabel}/card`);
    if (card.profileId !== entry.reference.id || card.profileDigest !== entry.reference.digest || card.behaviorDigest !== entry.behaviorDigest || card.family !== entry.reference.family || card.band !== entry.reference.band) throw new TypeError(`${rowLabel}/card does not describe its profile`);
    nonempty(card.title, `${rowLabel}/card/title`); uniqueVocabulary(card.controlledTraits, BOT_CLASSIFIER_IDS, `${rowLabel}/card/controlledTraits`); if (card.decorative !== null) throw new TypeError(`${rowLabel}/card/decorative must be empty until owner identities exist`);
    if (!Array.isArray(card.statements) || card.statements.length === 0) throw new TypeError(`${rowLabel}/card/statements must be non-empty`);
    const statementIds = card.statements.map((rawStatement, statementIndex) => { const statementLabel = `${rowLabel}/card/statements/${statementIndex}`, statement = record(rawStatement, statementLabel); exact(statement, ["id", "text", "sources"], statementLabel); nonempty(statement.text, `${statementLabel}/text`); uniqueVocabulary(statement.sources, BOT_CARD_SOURCE_IDS, `${statementLabel}/sources`, 1); return oneOf(statement.id, BOT_CARD_STATEMENT_IDS, `${statementLabel}/id`); });
    if (new Set(statementIds).size !== statementIds.length) throw new TypeError(`${rowLabel}/card/statements contain duplicates`);
    const strength = record(card.strength, `${rowLabel}/card/strength`); const kind = oneOf(strength.kind, ["uncalibrated", "calibrated"] as const, `${rowLabel}/card/strength/kind`);
    if (kind === "uncalibrated") exact(strength, ["kind"], `${rowLabel}/card/strength`); else boolean(strength.humanLikeLabelAllowed, `${rowLabel}/card/strength/humanLikeLabelAllowed`);
    const startable = record(row.startable, `${rowLabel}/startable`); exact(startable, ["kind", "blockedBy"], `${rowLabel}/startable`); oneOf(startable.kind, ["not_startable"] as const, `${rowLabel}/startable/kind`); uniqueVocabulary(startable.blockedBy, BOT_ROSTER_BLOCKERS, `${rowLabel}/startable/blockedBy`, 1);
  });
  if (ids.size !== BOT_PROFILE_CATALOG.length || BOT_PROFILE_CATALOG.some((entry) => !ids.has(entry.reference.id))) throw new TypeError(`${label} is not set-equal to bot-profile-catalog@1`);
}

function validateManifest(value: unknown): void {
  const manifest = record(value, "capabilities/evidenceManifest"); exact(manifest, ["digest", "counts", "availability", "bindings"], "capabilities/evidenceManifest"); if (typeof manifest.digest !== "string" || !/^[a-f0-9]{64}$/u.test(manifest.digest)) throw new TypeError("capabilities evidence manifest digest is invalid");
  const counts = record(manifest.counts, "capabilities/evidenceManifest/counts"), countKeys = ["producers", "projections", "consumers", "bindings", "semanticEvents", "eligibility", "reasons", "selectionPolicies"] as const; exact(counts, countKeys, "capabilities/evidenceManifest/counts"); countKeys.forEach((key) => integer(counts[key], `capabilities/evidenceManifest/counts/${key}`, 0));
  if (!Array.isArray(manifest.availability)) throw new TypeError("capabilities/evidenceManifest/availability must be an array"); const producers = new Set<string>(); manifest.availability.forEach((raw, index) => { const label = `capabilities/evidenceManifest/availability/${index}`, item = record(raw, label); exact(item, ["producerId", "version", "state", "reason"], label); const producer = nonempty(item.producerId, `${label}/producerId`); if (producers.has(producer)) throw new TypeError("capabilities evidence availability contains duplicate producers"); producers.add(producer); integer(item.version, `${label}/version`, 1); oneOf(item.state, ["available", "honest_empty", "unavailable"] as const, `${label}/state`); nonempty(item.reason, `${label}/reason`); }); if (manifest.availability.length !== counts.producers) throw new TypeError("capabilities evidence producer count does not match availability");
  if (!Array.isArray(manifest.bindings)) throw new TypeError("capabilities/evidenceManifest/bindings must be an array"); const bindings = new Set<string>(); manifest.bindings.forEach((raw, index) => { const label = `capabilities/evidenceManifest/bindings/${index}`, item = record(raw, label); exact(item, ["consumerId", "consumerVersion", "projectionId", "projectionVersion", "forms", "providerOff"], label); const consumer = nonempty(item.consumerId, `${label}/consumerId`), projection = nonempty(item.projectionId, `${label}/projectionId`); integer(item.consumerVersion, `${label}/consumerVersion`, 1); integer(item.projectionVersion, `${label}/projectionVersion`, 1); const key = `${consumer}@${item.consumerVersion}\0${projection}@${item.projectionVersion}`; if (bindings.has(key)) throw new TypeError("capabilities evidence bindings contain a duplicate edge"); bindings.add(key); uniqueVocabulary(item.forms, FORMS, `${label}/forms`, 1); oneOf(item.providerOff, ["available", "honest_empty", "unavailable"] as const, `${label}/providerOff`); }); if (manifest.bindings.length !== counts.bindings) throw new TypeError("capabilities evidence binding count does not match bindings");
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) { for (const child of Object.values(value)) deepFreeze(child); Object.freeze(value); }
  return value;
}

export function parseCapabilities(value: unknown): Capabilities {
  const item = record(value, "capabilities"); exact(item, ["engines", "policyModes", "unsupportedPolicyModes", "feedbackPolicies", "guardBasis", "recordedReadingKinds", "assessmentCategories", "objectiveAssessmentSets", "runSchemaVersion", "policyProfiles", "providers", "surfaces", "evidenceManifest"], "capabilities");
  validateEngines(item.engines); uniqueVocabulary(item.policyModes, POLICY_MODES, "capabilities/policyModes");
  if (!Array.isArray(item.unsupportedPolicyModes)) throw new TypeError("capabilities/unsupportedPolicyModes must be an array"); const unsupported = new Set<string>(); item.unsupportedPolicyModes.forEach((raw, index) => { const label = `capabilities/unsupportedPolicyModes/${index}`, row = record(raw, label); exact(row, ["mode", "reason"], label); const mode = nonempty(row.mode, `${label}/mode`); if (unsupported.has(mode)) throw new TypeError("capabilities unsupported policies contain duplicates"); unsupported.add(mode); nonempty(row.reason, `${label}/reason`); });
  uniqueVocabulary(item.feedbackPolicies, ["delayed_checkpoint", "segment_end", "immediate_guard"] as const, "capabilities/feedbackPolicies", 1); uniqueVocabulary(item.guardBasis, ["rules", "engine"] as const, "capabilities/guardBasis", 1);
  if (!Array.isArray(item.recordedReadingKinds)) throw new TypeError("capabilities/recordedReadingKinds must be an array"); const readings = new Set<string>(); item.recordedReadingKinds.forEach((raw, index) => { const label = `capabilities/recordedReadingKinds/${index}`, row = record(raw, label); exact(row, ["kind", "disposition", "reason"], label); const kind = nonempty(row.kind, `${label}/kind`); if (readings.has(kind)) throw new TypeError("capabilities recorded readings contain duplicates"); readings.add(kind); oneOf(row.disposition, ["admitted", "refused"] as const, `${label}/disposition`); nonempty(row.reason, `${label}/reason`); });
  uniqueVocabulary(item.assessmentCategories, ASSESSMENTS, "capabilities/assessmentCategories", 1); const sets = record(item.objectiveAssessmentSets, "capabilities/objectiveAssessmentSets"); exact(sets, ["win", "hold", "save", "resist"], "capabilities/objectiveAssessmentSets"); (["win", "hold", "save", "resist"] as const).forEach((key) => uniqueVocabulary(sets[key], ASSESSMENTS, `capabilities/objectiveAssessmentSets/${key}`, 1));
  const version = nonempty(item.runSchemaVersion, "capabilities/runSchemaVersion"); if (!/^\d+\.\d+(?:\.\d+)?$/u.test(version)) throw new TypeError("capabilities run schema version is invalid"); validateProfiles(item.policyProfiles);
  const providers = record(item.providers, "capabilities/providers"); exact(providers, ["opponent", "judge", "llm", "corpus", "tts", "tablebase"], "capabilities/providers"); oneOf(providers.opponent, ["maia", "mock", "none"] as const, "capabilities/providers/opponent"); oneOf(providers.judge, ["stockfish", "mock", "none"] as const, "capabilities/providers/judge"); oneOf(providers.llm, ["none", "external"] as const, "capabilities/providers/llm"); oneOf(providers.corpus, ["lichess-explorer", "mock", "none"] as const, "capabilities/providers/corpus"); oneOf(providers.tts, ["none", "external"] as const, "capabilities/providers/tts"); oneOf(providers.tablebase, ["lichess", "mock", "none"] as const, "capabilities/providers/tablebase");
  const surfaces = record(item.surfaces, "capabilities/surfaces"); exact(surfaces, SURFACES, "capabilities/surfaces"); SURFACES.forEach((surface) => oneOf(surfaces[surface], ["available", "unavailable-here"] as const, `capabilities/surfaces/${surface}`)); validateManifest(item.evidenceManifest);
  return deepFreeze(structuredClone(item)) as unknown as Capabilities;
}
