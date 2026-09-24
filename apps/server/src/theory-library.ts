import { createHash } from "node:crypto";

import { canonicalizeJson, normalizeShapeReferences, type PackPhase } from "@chess-tabiya/schema/drill-pack";

import { ServerError } from "./errors.js";
import { OPENING_CATALOGUE_PROJECTION_IDS, type CurrentOpeningEndpoint, type OpeningCatalogueAvailability } from "./opening-catalogue.js";
import type { PackRegistry, PackSummary } from "./pack-registry.js";
import type { PrincipleRegistry } from "./principle-registry.js";
import type { ShapeRegistry } from "./shape-registry.js";
import type { JoinedCitation } from "./theory-sources.js";

/*
 * Theory↔drill read-time joins (rfc/theory-drill-current-joins.md §1, §4.3, §5) and the Library's
 * deterministic catalogue search. Everything here is a READ over the four shipped registries (packs,
 * shapes, principles, the runtime opening catalogue) and the compiled concept registry. Nothing is
 * persisted: the source-bound launch and its `run_derivations` row are the RFC's migration half and
 * hold their register position behind social-play.
 *
 * Law 8: no function here writes chess prose. Every sentence a learner sees is either an authored
 * registry field (principle statement, shape plan, pack objective) or a fixed product string about
 * availability. The result types carry no score, rank, confidence or generated explanation (§1.5).
 */

type MatchedOpeningEndpoint = Extract<CurrentOpeningEndpoint, { readonly kind: "matched" }>;

export type ApplicabilityBasis = "exact_shape_trigger" | "exact_opening_endpoint" | "anchored_claim" | "registered_principle";

export type ApplicabilityIdentity =
  | { readonly kind: "shape"; readonly entryId: string; readonly entryVersion: string }
  | { readonly kind: "opening"; readonly endpoint: MatchedOpeningEndpoint }
  | { readonly kind: "principle"; readonly entryId: string; readonly entryVersion: string }
  | { readonly kind: "anchored_claim"; readonly packId: string; readonly packVersion: string; readonly claimId: string; readonly principles: readonly { readonly entryId: string; readonly entryVersion: string }[] };

export type TheoryAction =
  | { readonly kind: "open_shape_entry"; readonly entryId: string; readonly entryVersion: string }
  | { readonly kind: "open_principle_entry"; readonly entryId: string; readonly entryVersion: string }
  | { readonly kind: "open_opening_entry"; readonly positionKey: string; readonly catalogueDigest: string };

export type PackTargetVia =
  | { readonly kind: "shape_present"; readonly entryId: string; readonly entryVersion: string }
  | { readonly kind: "authored_claim"; readonly sourcePackId: string; readonly sourcePackVersion: string; readonly claimId: string };

export type ApplicabilityTarget =
  | { readonly kind: "theory"; readonly identity: ApplicabilityIdentity; readonly action: TheoryAction }
  | { readonly kind: "pack"; readonly targetId: string; readonly packId: string; readonly packVersion: string; readonly via: PackTargetVia };

export type ApplicabilityAbstention = "no_identity" | "no_present_pack" | "candidate_only" | "source_unreadable";

export interface ApplicabilityView {
  readonly basis: ApplicabilityBasis;
  readonly identities: readonly ApplicabilityIdentity[];
  readonly targets: readonly ApplicabilityTarget[];
  readonly abstained: readonly ApplicabilityAbstention[];
}

/**
 * Only the Library context ships here. The `run_node` context (with a `source` member) is the
 * input to the source-bound launch, whose durable edge needs the RFC's migration; without a
 * `source` member a Library result cannot be passed to it (criterion 16).
 */
export type LibraryApplicabilityResult = ApplicabilityView & { readonly context: "library" };

function freeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value as Record<string, unknown>)) freeze(child);
    Object.freeze(value);
  }
  return value;
}

/** `targetId = sha256(canonicalizeJson({packId, packVersion, via}))` (§1.1). A selector, not authority. */
export function applicabilityTargetId(packId: string, packVersion: string, via: PackTargetVia): string {
  return `sha256:${createHash("sha256").update(canonicalizeJson({ packId, packVersion, via } as never)).digest("hex")}`;
}

function packTarget(packId: string, packVersion: string, via: PackTargetVia): Extract<ApplicabilityTarget, { readonly kind: "pack" }> {
  return { kind: "pack", targetId: applicabilityTargetId(packId, packVersion, via), packId, packVersion, via };
}

export interface TheoryLibrarySources {
  readonly packs: PackRegistry;
  readonly shapes: ShapeRegistry;
  readonly principles: PrincipleRegistry;
  readonly openingCatalogue: OpeningCatalogueAvailability;
}

export type LibraryChannel = "official" | "community" | "catalogue";

/** Learner-facing origin of an item. Community drafts are disclosed, never presented as official. */
export interface LibraryDisclosure {
  readonly channel: LibraryChannel;
  readonly reviewStatus: "official" | "draft" | "published" | "schema_example" | "third_party";
  readonly publisherHandle?: string;
}

function packDisclosure(pack: PackSummary): LibraryDisclosure {
  const reviewStatus = pack.channel === "official" ? "official" : pack.reviewStatus === "published" || pack.reviewStatus === "schema_example" ? pack.reviewStatus : "draft";
  return { channel: pack.channel, reviewStatus, ...(pack.publisherHandle === undefined ? {} : { publisherHandle: pack.publisherHandle }) };
}

// ---------------------------------------------------------------------------------------------
// Applicability (§1)
// ---------------------------------------------------------------------------------------------

/** Shape entry → pack: only a validated `present` reference is a target (§1.3). */
export function shapeApplicability(sources: TheoryLibrarySources, shapeId: string): LibraryApplicabilityResult {
  const record = sources.shapes.get(shapeId);
  if (record === undefined) return freeze({ context: "library", basis: "exact_shape_trigger", identities: [], targets: [], abstained: ["no_identity"] });
  const identity: ApplicabilityIdentity = { kind: "shape", entryId: record.document.id, entryVersion: record.document.version };
  const via: PackTargetVia = { kind: "shape_present", entryId: record.document.id, entryVersion: record.document.version };
  const packs = sources.packs.list()
    .filter((pack) => normalizeShapeReferences(sources.packs.get(pack.id)?.document.shapes).some((reference) => reference.shape === shapeId && reference.relation === "present"))
    .map((pack) => packTarget(pack.id, pack.version, via));
  return freeze({
    context: "library",
    basis: "exact_shape_trigger",
    identities: [identity],
    targets: [{ kind: "theory", identity, action: { kind: "open_shape_entry", entryId: identity.entryId, entryVersion: identity.entryVersion } }, ...packs],
    abstained: packs.length === 0 ? ["no_present_pack"] : [],
  });
}

/** Every exact authored `{packId, packVersion, claimId}` occurrence naming a principle (§1.6). */
export function anchoredClaims(sources: TheoryLibrarySources, principleId: string): readonly Extract<ApplicabilityIdentity, { readonly kind: "anchored_claim" }>[] {
  const out: Extract<ApplicabilityIdentity, { readonly kind: "anchored_claim" }>[] = [];
  for (const summary of sources.packs.list()) {
    const document = sources.packs.get(summary.id)?.document;
    for (const claim of document?.feedbackClaims ?? []) {
      if (!(claim.principles ?? []).includes(principleId)) continue;
      out.push({
        kind: "anchored_claim",
        packId: summary.id,
        packVersion: summary.version,
        claimId: claim.id,
        principles: (claim.principles ?? []).flatMap((id) => {
          const principle = sources.principles.get(id);
          return principle === undefined ? [] : [{ entryId: principle.document.id, entryVersion: principle.document.version }];
        }),
      });
    }
  }
  return freeze(out);
}

/**
 * A bare principle is a theory identity only — browsing it is not evidence it applies anywhere, so
 * it yields no pack target by itself. Each exact claim anchor yields its own source pack.
 */
export function principleApplicability(sources: TheoryLibrarySources, principleId: string): LibraryApplicabilityResult {
  const record = sources.principles.get(principleId);
  if (record === undefined) return freeze({ context: "library", basis: "registered_principle", identities: [], targets: [], abstained: ["no_identity"] });
  const identity: ApplicabilityIdentity = { kind: "principle", entryId: record.document.id, entryVersion: record.document.version };
  const anchors = anchoredClaims(sources, principleId);
  const packs = anchors.map((anchor) => packTarget(anchor.packId, anchor.packVersion, { kind: "authored_claim", sourcePackId: anchor.packId, sourcePackVersion: anchor.packVersion, claimId: anchor.claimId }));
  return freeze({
    context: "library",
    basis: anchors.length === 0 ? "registered_principle" : "anchored_claim",
    identities: [identity, ...anchors],
    targets: [{ kind: "theory", identity, action: { kind: "open_principle_entry", entryId: identity.entryId, entryVersion: identity.entryVersion } }, ...packs],
    abstained: packs.length === 0 ? ["no_present_pack"] : [],
  });
}

/**
 * Named endpoints grouped by identical name, keys in canonical (sorted) order. The catalogue gives
 * one name to several exact positions (move orders, and sometimes several ECO codes); a learner
 * sees one row per name, never five identical titles.
 */
export function openingNameGroups(catalogue: Extract<OpeningCatalogueAvailability, { readonly kind: "available" }>): readonly { readonly ecos: readonly string[]; readonly name: string; readonly keys: readonly string[] }[] {
  const groups = new Map<string, { ecos: Set<string>; name: string; keys: string[] }>();
  for (const endpoint of catalogue.catalogue.artifact.namedEndpoints) {
    const group = groups.get(endpoint.name) ?? { ecos: new Set<string>(), name: endpoint.name, keys: [] };
    group.ecos.add(endpoint.eco);
    group.keys.push(endpoint.key);
    groups.set(endpoint.name, group);
  }
  return [...groups.values()].map((group) => ({ name: group.name, ecos: [...group.ecos].sort(), keys: [...group.keys].sort() }));
}

function endpointByKey(catalogue: OpeningCatalogueAvailability, positionKey: string): { readonly endpoint?: MatchedOpeningEndpoint; readonly member: boolean } | undefined {
  if (catalogue.kind === "unavailable") return undefined;
  const found = catalogue.catalogue.artifact.namedEndpoints.find((item) => item.key === positionKey);
  const member = catalogue.catalogue.artifact.pathMembership.some((item) => item.key === positionKey);
  if (found === undefined) return { member };
  return {
    member,
    endpoint: freeze({ kind: "matched", projectionId: OPENING_CATALOGUE_PROJECTION_IDS.currentEndpoint, positionKey, observedPly: found.sourcePly, eco: found.eco, name: found.name, sourcePly: found.sourcePly, catalogue: catalogue.catalogue.ref }),
  };
}

/**
 * Exact named endpoint → opening entry. No pack carries opening applicability today (pack
 * capability plus content own that), so the pack set is honestly empty; unnamed path membership is
 * `candidate_only`, an exact absence `no_identity`, an unavailable catalogue `source_unreadable`.
 */
export function openingApplicability(sources: TheoryLibrarySources, positionKey: string): LibraryApplicabilityResult {
  const found = endpointByKey(sources.openingCatalogue, positionKey);
  if (found === undefined) return freeze({ context: "library", basis: "exact_opening_endpoint", identities: [], targets: [], abstained: ["source_unreadable"] });
  if (found.endpoint === undefined) return freeze({ context: "library", basis: "exact_opening_endpoint", identities: [], targets: [], abstained: [found.member ? "candidate_only" : "no_identity"] });
  const identity: ApplicabilityIdentity = { kind: "opening", endpoint: found.endpoint };
  return freeze({
    context: "library",
    basis: "exact_opening_endpoint",
    identities: [identity],
    targets: [{ kind: "theory", identity, action: { kind: "open_opening_entry", positionKey, catalogueDigest: found.endpoint.catalogue.artifactDigest } }],
    abstained: ["no_present_pack"],
  });
}

// ---------------------------------------------------------------------------------------------
// Entry views (§4.3)
// ---------------------------------------------------------------------------------------------

export interface LibraryPackRef {
  readonly packId: string;
  readonly packVersion: string;
  readonly targetId: string;
  readonly title: string;
  readonly phase: PackPhase | null;
  readonly mode: string;
  readonly disclosure: LibraryDisclosure;
}

function packRefs(sources: TheoryLibrarySources, result: LibraryApplicabilityResult): readonly LibraryPackRef[] {
  const seen = new Set<string>();
  return freeze(result.targets.flatMap((target) => {
    if (target.kind !== "pack" || seen.has(target.targetId)) return [];
    seen.add(target.targetId);
    const summary = sources.packs.get(target.packId)?.summary;
    if (summary === undefined) return [];
    return [{ packId: summary.id, packVersion: summary.version, targetId: target.targetId, title: summary.title, phase: summary.phase, mode: summary.mode, disclosure: packDisclosure(summary) }];
  }).sort((left, right) => officialFirst(left.disclosure, right.disclosure) || left.title.localeCompare(right.title) || left.packId.localeCompare(right.packId)));
}

function officialFirst(left: LibraryDisclosure, right: LibraryDisclosure): number {
  const order = (value: LibraryDisclosure): number => value.channel === "official" ? 0 : value.channel === "catalogue" ? 1 : 2;
  return order(left) - order(right);
}

export interface PrincipleEntryView {
  readonly id: string;
  readonly version: string;
  readonly digest: string;
  readonly name: string;
  readonly statement: string;
  readonly counterCase: string;
  readonly phases: readonly string[];
  readonly standsOn: string;
  readonly licence: string;
  readonly citations: readonly JoinedCitation[];
  /** Free-text provenance notes (principle-entry 0.1 arm); rendered as notes, never as citations. */
  readonly sourceNotes: readonly string[];
  readonly disclosure: LibraryDisclosure;
  readonly anchoredPacks: readonly (LibraryPackRef & { readonly claimId: string })[];
  readonly applicability: LibraryApplicabilityResult;
}

export function principleEntryView(sources: TheoryLibrarySources, principleId: string): PrincipleEntryView {
  const record = sources.principles.get(principleId);
  if (record === undefined) throw new ServerError("THEORY_ENTRY_NOT_FOUND", `Unknown principle: ${principleId}`);
  const applicability = principleApplicability(sources, principleId);
  const refs = new Map(packRefs(sources, applicability).map((ref) => [ref.targetId, ref]));
  const anchoredPacks = applicability.targets.flatMap((target) => {
    if (target.kind !== "pack" || target.via.kind !== "authored_claim") return [];
    const ref = refs.get(target.targetId);
    return ref === undefined ? [] : [{ ...ref, claimId: target.via.claimId }];
  }).sort((left, right) => officialFirst(left.disclosure, right.disclosure) || left.title.localeCompare(right.title) || left.claimId.localeCompare(right.claimId));
  const document = record.document;
  return freeze({
    id: document.id,
    version: document.version,
    digest: record.digest,
    name: document.name,
    statement: document.statement,
    counterCase: document.counterCase,
    phases: [...document.phases],
    standsOn: document.standsOn,
    licence: document.provenance.licence,
    // JoinedCitation carries no register `strength`: provenance only, never rendered (§2 rule 4).
    citations: [...record.citations],
    sourceNotes: document.provenance.sources.filter((source): source is string => typeof source === "string"),
    disclosure: { channel: "official", reviewStatus: "official" },
    anchoredPacks,
    applicability,
  });
}

export interface ShapeEntryLibraryView {
  readonly id: string;
  readonly version: string;
  readonly digest: string;
  readonly name: string;
  readonly phases: readonly string[];
  readonly licence: string;
  readonly plans: readonly { readonly id: string; readonly side: string; readonly label: string; readonly description: string }[];
  readonly watch: readonly string[];
  readonly typicalMistakes: readonly string[];
  readonly sourceNotes: readonly string[];
  readonly disclosure: LibraryDisclosure;
  readonly packs: readonly LibraryPackRef[];
  readonly applicability: LibraryApplicabilityResult;
}

export function shapeEntryView(sources: TheoryLibrarySources, shapeId: string): ShapeEntryLibraryView {
  const record = sources.shapes.get(shapeId);
  if (record === undefined) throw new ServerError("SHAPE_NOT_FOUND", `Unknown shape: ${shapeId}`);
  const applicability = shapeApplicability(sources, shapeId);
  const document = record.document;
  return freeze({
    id: document.id,
    version: document.version,
    digest: record.digest,
    name: document.name,
    phases: [...document.phases],
    licence: document.provenance.licence,
    plans: document.plans.map((plan) => ({ id: plan.id, side: plan.side, label: plan.label, description: plan.description })),
    watch: [...document.watch],
    typicalMistakes: [...document.typicalMistakes],
    sourceNotes: [...document.provenance.sources],
    disclosure: record.channel === "official" ? { channel: "official", reviewStatus: "official" } : { channel: "community", reviewStatus: "published", ...(record.publisherHandle === undefined ? {} : { publisherHandle: record.publisherHandle }) },
    packs: packRefs(sources, applicability),
    applicability,
  });
}

export interface OpeningEntryView {
  readonly positionKey: string;
  readonly endpoint?: MatchedOpeningEndpoint;
  /** Other exact catalogue positions carrying the identical name. */
  readonly samePositions: readonly string[];
  readonly source: { readonly name: string; readonly licence: "CC0-1.0"; readonly commit: string; readonly url: string } | null;
  readonly disclosure: LibraryDisclosure;
  readonly packs: readonly LibraryPackRef[];
  readonly applicability: LibraryApplicabilityResult;
}

export function openingEntryView(sources: TheoryLibrarySources, positionKey: string): OpeningEntryView {
  const applicability = openingApplicability(sources, positionKey);
  const identity = applicability.identities.find((item): item is Extract<ApplicabilityIdentity, { readonly kind: "opening" }> => item.kind === "opening");
  if (identity === undefined && !applicability.abstained.includes("source_unreadable")) throw new ServerError("THEORY_ENTRY_NOT_FOUND", `No named catalogue endpoint at ${positionKey}`);
  const commit = identity?.endpoint.catalogue.commit;
  const catalogue = sources.openingCatalogue;
  const samePositions = identity === undefined || catalogue.kind !== "available" ? [] : catalogue.catalogue.artifact.namedEndpoints
    .filter((item) => item.key !== positionKey && item.name === identity.endpoint.name)
    .map((item) => item.key).sort();
  return freeze({
    positionKey,
    ...(identity === undefined ? {} : { endpoint: identity.endpoint }),
    samePositions,
    source: commit === undefined ? null : { name: "Lichess chess-openings", licence: "CC0-1.0", commit, url: `https://github.com/lichess-org/chess-openings/tree/${commit}` },
    disclosure: { channel: "catalogue", reviewStatus: "third_party" },
    packs: packRefs(sources, applicability),
    applicability,
  });
}

export interface PackEntryView {
  readonly pack: PackSummary;
  readonly disclosure: LibraryDisclosure;
  readonly startFen: string;
  readonly shapes: readonly { readonly id: string; readonly name: string; readonly relation: "present" | "prospective" }[];
  readonly principles: readonly { readonly id: string; readonly name: string; readonly claimIds: readonly string[] }[];
  readonly concepts: PackSummary["concepts"];
  /** The exact named catalogue endpoint of the start position, if any (a fact about the position). */
  readonly opening?: { readonly positionKey: string; readonly eco: string; readonly name: string };
}

function startPly(fen: string): number {
  const fields = fen.trim().split(/\s+/);
  const fullmove = Number(fields[5] ?? "1");
  return Math.max(0, (Number.isSafeInteger(fullmove) && fullmove > 0 ? fullmove - 1 : 0) * 2 + (fields[1] === "b" ? 1 : 0));
}

export function packEntryView(sources: TheoryLibrarySources, packId: string): PackEntryView {
  const record = sources.packs.get(packId);
  if (record === undefined) throw new ServerError("PACK_NOT_FOUND", `Unknown pack: ${packId}`);
  const document = record.document;
  const shapes = normalizeShapeReferences(document.shapes).flatMap((reference) => {
    const shape = sources.shapes.get(reference.shape);
    return shape === undefined ? [] : [{ id: shape.document.id, name: shape.document.name, relation: reference.relation }];
  });
  const principleClaims = new Map<string, string[]>();
  for (const claim of document.feedbackClaims ?? []) for (const id of claim.principles ?? []) principleClaims.set(id, [...(principleClaims.get(id) ?? []), claim.id]);
  const principles = [...principleClaims].flatMap(([id, claimIds]) => {
    const principle = sources.principles.get(id);
    return principle === undefined ? [] : [{ id, name: principle.document.name, claimIds: [...claimIds].sort() }];
  }).sort((left, right) => left.name.localeCompare(right.name));
  let opening: PackEntryView["opening"];
  if (sources.openingCatalogue.kind === "available") {
    const endpoint = sources.openingCatalogue.catalogue.currentEndpoint(document.start.fen, startPly(document.start.fen));
    if (endpoint.kind === "matched") opening = { positionKey: endpoint.positionKey, eco: endpoint.eco, name: endpoint.name };
  }
  return freeze({
    pack: record.summary,
    disclosure: packDisclosure(record.summary),
    startFen: document.start.fen,
    shapes,
    principles,
    concepts: record.summary.concepts,
    ...(opening === undefined ? {} : { opening }),
  });
}

// ---------------------------------------------------------------------------------------------
// Catalogue search
// ---------------------------------------------------------------------------------------------

export const LIBRARY_KINDS = Object.freeze(["pack", "principle", "shape", "concept", "opening"] as const);
export type LibraryKind = (typeof LIBRARY_KINDS)[number];
export const LIBRARY_PHASES = Object.freeze(["opening", "middlegame", "endgame", "cross_phase"] as const);
export type LibraryPhase = (typeof LIBRARY_PHASES)[number];
export const LIBRARY_SEARCH_MAX_QUERY_LENGTH = 200;
export const LIBRARY_SEARCH_MAX_TOKENS = 8;
/** Per-kind shown bound; `total` is always reported beside it (full-vs-shown denominator). */
export const LIBRARY_SEARCH_DEFAULT_LIMIT = 40;
export const LIBRARY_SEARCH_MAX_LIMIT = 200;

export interface LibrarySearchQuery {
  readonly text: string;
  readonly phase?: LibraryPhase;
  readonly kinds?: readonly LibraryKind[];
  readonly limit?: number;
}

export interface LibraryItem {
  readonly kind: LibraryKind;
  readonly id: string;
  readonly title: string;
  /** Authored registry text shown as-is (objective, statement, ECO code); never generated. */
  readonly summary: string;
  readonly phases: readonly LibraryPhase[];
  readonly disclosure: LibraryDisclosure;
  readonly mode?: string;
  /** Openings only: how many exact catalogue positions share this name. */
  readonly positions?: number;
  /** Exact packs this item joins to (concept membership, shape `present`, claim anchors). */
  readonly packIds: readonly string[];
}

export interface LibrarySearchResult {
  readonly query: { readonly text: string; readonly tokens: readonly string[]; readonly phase: LibraryPhase | null; readonly kinds: readonly LibraryKind[]; readonly limit: number };
  readonly items: readonly LibraryItem[];
  readonly totals: Readonly<Record<LibraryKind, { readonly shown: number; readonly total: number }>>;
}

/**
 * The literal query grammar: Unicode-normalized, diacritics folded, lower-cased, split on anything
 * that is not a letter or digit. There are no operators, quotes, prefixes-by-syntax or column
 * filters, so learner text is never parsed as query syntax ([[D1897]]'s concern at this boundary).
 */
export function libraryTokens(text: string): readonly string[] {
  return Object.freeze(text.normalize("NFKD").replace(/\p{M}+/gu, "").toLocaleLowerCase("en").split(/[^\p{L}\p{N}]+/u).filter((token) => token !== ""));
}

interface Indexed {
  readonly item: LibraryItem;
  readonly titleTokens: readonly string[];
  readonly bodyTokens: readonly string[];
}

/** Every query token must be a prefix of some item token (AND over tokens). */
function matches(entry: Indexed, tokens: readonly string[]): "title" | "body" | undefined {
  if (tokens.length === 0) return "title";
  const hits = (pool: readonly string[]) => tokens.every((token) => pool.some((candidate) => candidate.startsWith(token)));
  if (hits(entry.titleTokens)) return "title";
  if (hits([...entry.titleTokens, ...entry.bodyTokens])) return "body";
  return undefined;
}

export class TheoryLibrary {
  readonly #sources: TheoryLibrarySources;
  #openings: readonly Indexed[] | undefined;

  constructor(sources: TheoryLibrarySources) {
    this.#sources = sources;
  }

  get sources(): TheoryLibrarySources { return this.#sources; }

  /** Rebuilt on demand so community registrations appear without a restart. */
  #entries(): readonly Indexed[] {
    const sources = this.#sources;
    const packs = sources.packs.list();
    const index: Indexed[] = [];
    const conceptPacks = new Map<string, { label: string; packIds: string[]; phases: Set<LibraryPhase> }>();
    for (const pack of packs) {
      const phases: LibraryPhase[] = pack.phase === null ? [] : [pack.phase];
      index.push({
        item: { kind: "pack", id: pack.id, title: pack.title, summary: pack.objectiveSummary, phases, disclosure: packDisclosure(pack), mode: pack.mode, packIds: [pack.id] },
        titleTokens: libraryTokens(pack.title),
        bodyTokens: libraryTokens([pack.objectiveSummary, pack.id, ...pack.concepts.map((concept) => concept.label)].join(" ")),
      });
      for (const concept of pack.concepts) {
        if (concept.status === "unregistered") continue;
        const entry = conceptPacks.get(concept.id) ?? { label: concept.label, packIds: [], phases: new Set<LibraryPhase>() };
        entry.packIds.push(pack.id);
        if (pack.phase !== null) entry.phases.add(pack.phase);
        conceptPacks.set(concept.id, entry);
      }
    }
    for (const summary of sources.principles.list()) {
      const anchors = anchoredClaims(sources, summary.id);
      index.push({
        item: { kind: "principle", id: summary.id, title: summary.name, summary: summary.statement, phases: [...summary.phases], disclosure: { channel: "official", reviewStatus: "official" }, packIds: [...new Set(anchors.map((anchor) => anchor.packId))].sort() },
        titleTokens: libraryTokens(summary.name),
        bodyTokens: libraryTokens(`${summary.statement} ${summary.id}`),
      });
    }
    for (const summary of sources.shapes.list()) {
      const applicability = shapeApplicability(sources, summary.id);
      index.push({
        item: { kind: "shape", id: summary.id, title: summary.name, summary: "", phases: [...summary.phases], disclosure: summary.channel === "official" ? { channel: "official", reviewStatus: "official" } : { channel: "community", reviewStatus: "published", ...(summary.publisherHandle === undefined ? {} : { publisherHandle: summary.publisherHandle }) }, packIds: applicability.targets.flatMap((target) => target.kind === "pack" ? [target.packId] : []) },
        titleTokens: libraryTokens(summary.name),
        bodyTokens: libraryTokens(summary.id),
      });
    }
    for (const [id, concept] of [...conceptPacks].sort(([left], [right]) => left.localeCompare(right))) {
      index.push({
        item: { kind: "concept", id, title: concept.label, summary: "", phases: [...concept.phases].sort(), disclosure: { channel: "official", reviewStatus: "official" }, packIds: [...new Set(concept.packIds)].sort() },
        titleTokens: libraryTokens(concept.label),
        bodyTokens: libraryTokens(id),
      });
    }
    return [...index, ...this.#openingEntries()];
  }

  /** The opening catalogue is immutable for the process lifetime, so its index is built once. */
  #openingEntries(): readonly Indexed[] {
    if (this.#openings !== undefined) return this.#openings;
    const catalogue = this.#sources.openingCatalogue;
    // One listing per named opening: the catalogue names several exact positions identically
    // (move-order variants), and listing each as its own row was a duplicate listing. The row opens
    // its canonically-first position; the entry view lists the rest (`samePositions`).
    this.#openings = catalogue.kind === "available" ? Object.freeze(openingNameGroups(catalogue).map((group) => Object.freeze({
      item: { kind: "opening" as const, id: group.keys[0]!, title: group.name, summary: group.ecos.join(", "), phases: ["opening" as const], disclosure: { channel: "catalogue" as const, reviewStatus: "third_party" as const }, packIds: [], positions: group.keys.length },
      titleTokens: libraryTokens(group.name),
      bodyTokens: libraryTokens(group.ecos.join(" ")),
    }))) : Object.freeze([]);
    return this.#openings;
  }

  search(query: LibrarySearchQuery): LibrarySearchResult {
    if (query.text.length > LIBRARY_SEARCH_MAX_QUERY_LENGTH) throw new ServerError("INVALID_REQUEST", `q must be at most ${LIBRARY_SEARCH_MAX_QUERY_LENGTH} characters`);
    const tokens = libraryTokens(query.text);
    if (tokens.length > LIBRARY_SEARCH_MAX_TOKENS) throw new ServerError("INVALID_REQUEST", `q must contain at most ${LIBRARY_SEARCH_MAX_TOKENS} words`);
    const limit = query.limit ?? LIBRARY_SEARCH_DEFAULT_LIMIT;
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > LIBRARY_SEARCH_MAX_LIMIT) throw new ServerError("INVALID_REQUEST", `limit must be between 1 and ${LIBRARY_SEARCH_MAX_LIMIT}`);
    const kinds = query.kinds === undefined || query.kinds.length === 0 ? LIBRARY_KINDS : LIBRARY_KINDS.filter((kind) => query.kinds!.includes(kind));
    // An empty query lists the curated registries; the 3,810-row opening catalogue is searched, not browsed.
    const browseable = (kind: LibraryKind): boolean => tokens.length > 0 || kind !== "opening";
    const seen = new Set<string>();
    const ranked: { readonly entry: Indexed; readonly field: "title" | "body" }[] = [];
    for (const entry of this.#entries()) {
      const key = `${entry.item.kind}\u0000${entry.item.id}`;
      if (seen.has(key)) continue;
      if (!kinds.includes(entry.item.kind) || !browseable(entry.item.kind)) continue;
      if (query.phase !== undefined && !entry.item.phases.includes(query.phase)) continue;
      const field = matches(entry, tokens);
      if (field === undefined) continue;
      seen.add(key);
      ranked.push({ entry, field });
    }
    // One total comparator: disclosure (official, catalogue, community), title-field before body-only
    // hit, kind order, title, id. No chess quantity, popularity, recency or source strength participates.
    ranked.sort((left, right) =>
      officialFirst(left.entry.item.disclosure, right.entry.item.disclosure)
      || (left.field === right.field ? 0 : left.field === "title" ? -1 : 1)
      || LIBRARY_KINDS.indexOf(left.entry.item.kind) - LIBRARY_KINDS.indexOf(right.entry.item.kind)
      || left.entry.item.title.localeCompare(right.entry.item.title)
      || (left.entry.item.id < right.entry.item.id ? -1 : left.entry.item.id > right.entry.item.id ? 1 : 0));
    const shownPerKind = new Map<LibraryKind, number>();
    const totals = Object.fromEntries(LIBRARY_KINDS.map((kind) => [kind, { shown: 0, total: 0 }])) as Record<LibraryKind, { shown: number; total: number }>;
    const items: LibraryItem[] = [];
    for (const { entry } of ranked) {
      const kind = entry.item.kind;
      totals[kind].total += 1;
      const shown = shownPerKind.get(kind) ?? 0;
      if (shown >= limit) continue;
      shownPerKind.set(kind, shown + 1);
      totals[kind].shown += 1;
      items.push(entry.item);
    }
    return freeze({ query: { text: query.text, tokens, phase: query.phase ?? null, kinds: [...kinds], limit }, items: structuredClone(items), totals });
  }
}
