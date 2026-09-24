/**
 * Client contract for the Library's `/theory` family (rfc/theory-drill-current-joins.md §4.3 and
 * rfc/theory-knowledge-pipeline.md principle-entry 0.2). Responses are parsed strictly: a field
 * outside the closed shape is a protocol error, never silently rendered.
 *
 * Every learner-visible sentence this module produces is a fixed availability/provenance string.
 * Chess prose shown by the Library is the registries' own authored text, passed through unchanged.
 */

export const LIBRARY_KINDS = Object.freeze(["pack", "principle", "shape", "concept", "opening"] as const);
export type LibraryKind = (typeof LIBRARY_KINDS)[number];
export const LIBRARY_PHASES = Object.freeze(["opening", "middlegame", "endgame", "cross_phase"] as const);
export type LibraryPhase = (typeof LIBRARY_PHASES)[number];
const CHANNELS = Object.freeze(["official", "community", "catalogue"] as const);
const REVIEW_STATES = Object.freeze(["official", "draft", "published", "schema_example", "third_party"] as const);

export interface LibraryDisclosure {
  readonly channel: (typeof CHANNELS)[number];
  readonly reviewStatus: (typeof REVIEW_STATES)[number];
  readonly publisherHandle?: string;
}

export interface LibraryItem {
  readonly kind: LibraryKind;
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly phases: readonly LibraryPhase[];
  readonly disclosure: LibraryDisclosure;
  readonly mode?: string;
  readonly positions?: number;
  readonly packIds: readonly string[];
}

export interface LibrarySearchResult {
  readonly query: { readonly text: string; readonly tokens: readonly string[]; readonly phase: LibraryPhase | null; readonly kinds: readonly LibraryKind[]; readonly limit: number };
  readonly items: readonly LibraryItem[];
  readonly totals: Readonly<Record<LibraryKind, { readonly shown: number; readonly total: number }>>;
}

export interface LibrarySearchQuery {
  readonly text: string;
  readonly phase?: LibraryPhase;
  readonly kinds?: readonly LibraryKind[];
  readonly limit?: number;
}

export interface LibraryPackRef {
  readonly packId: string;
  readonly packVersion: string;
  readonly targetId: string;
  readonly title: string;
  readonly phase: LibraryPhase | null;
  readonly mode: string;
  readonly disclosure: LibraryDisclosure;
}

export interface JoinedCitation {
  readonly sourceId: string;
  readonly title: string;
  readonly sectionRef: string;
  readonly quotedText: string;
  readonly revision: string;
  readonly revisionUrl: string;
  readonly canonicalUrl: string;
  readonly publisher: string;
  readonly authors: readonly string[];
  readonly licence: { readonly id: string; readonly name: string; readonly url: string };
  readonly attributionText: string;
  readonly modified: false;
  readonly proof: "verified" | "source_unavailable";
}

export interface PrincipleEntryView {
  readonly id: string;
  readonly version: string;
  readonly digest: string;
  readonly name: string;
  readonly statement: string;
  readonly counterCase: string;
  readonly phases: readonly LibraryPhase[];
  readonly standsOn: "chess_tradition" | "authors_practice" | "instrument_pattern" | "cited_source";
  readonly licence: string;
  readonly citations: readonly JoinedCitation[];
  readonly sourceNotes: readonly string[];
  readonly disclosure: LibraryDisclosure;
  readonly anchoredPacks: readonly (LibraryPackRef & { readonly claimId: string })[];
}

export interface ShapeEntryLibraryView {
  readonly id: string;
  readonly version: string;
  readonly digest: string;
  readonly name: string;
  readonly phases: readonly LibraryPhase[];
  readonly licence: string;
  readonly plans: readonly { readonly id: string; readonly side: string; readonly label: string; readonly description: string }[];
  readonly watch: readonly string[];
  readonly typicalMistakes: readonly string[];
  readonly sourceNotes: readonly string[];
  readonly disclosure: LibraryDisclosure;
  readonly packs: readonly LibraryPackRef[];
}

export interface OpeningEntryView {
  readonly positionKey: string;
  readonly endpoint?: { readonly eco: string; readonly name: string; readonly sourcePly: number };
  readonly samePositions: readonly string[];
  readonly source: { readonly name: string; readonly licence: string; readonly commit: string; readonly url: string } | null;
  readonly disclosure: LibraryDisclosure;
  readonly packs: readonly LibraryPackRef[];
  readonly abstained: readonly string[];
}

export interface PackEntryView {
  readonly pack: { readonly id: string; readonly version: string; readonly title: string; readonly mode: string; readonly phase: LibraryPhase | null; readonly objectiveSummary: string; readonly difficultyLabel: string | null };
  readonly disclosure: LibraryDisclosure;
  readonly startFen: string;
  readonly shapes: readonly { readonly id: string; readonly name: string; readonly relation: "present" | "prospective" }[];
  readonly principles: readonly { readonly id: string; readonly name: string; readonly claimIds: readonly string[] }[];
  readonly concepts: readonly { readonly id: string; readonly label: string; readonly status: string }[];
  readonly opening?: { readonly positionKey: string; readonly eco: string; readonly name: string };
}

type Json = Readonly<Record<string, unknown>>;

function record(value: unknown, label: string): Json {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`);
  return value as Json;
}
function keys(value: Json, required: readonly string[], label: string, optional: readonly string[] = []): void {
  const allowed = new Set([...required, ...optional]);
  if (required.some((key) => !(key in value)) || Object.keys(value).some((key) => !allowed.has(key))) throw new TypeError(`${label} has an invalid shape`);
}
function str(value: unknown, label: string, allowEmpty = false): string {
  if (typeof value !== "string" || (!allowEmpty && value.trim() === "")) throw new TypeError(`${label} must be a${allowEmpty ? "" : " non-empty"} string`);
  return value;
}
function int(value: unknown, label: string, minimum = 0): number {
  if (!Number.isSafeInteger(value) || Number(value) < minimum) throw new TypeError(`${label} must be an integer >= ${minimum}`);
  return Number(value);
}
function oneOf<T extends string>(value: unknown, values: readonly T[], label: string): T {
  if (typeof value !== "string" || !values.includes(value as T)) throw new TypeError(`${label} is outside the closed vocabulary`);
  return value as T;
}
function list<T>(value: unknown, label: string, item: (raw: unknown, label: string) => T): readonly T[] {
  if (!Array.isArray(value)) throw new TypeError(`${label} must be an array`);
  return Object.freeze(value.map((raw, index) => item(raw, `${label}/${index}`)));
}
const strings = (value: unknown, label: string): readonly string[] => list(value, label, (raw, at) => str(raw, at));
const phases = (value: unknown, label: string): readonly LibraryPhase[] => list(value, label, (raw, at) => oneOf(raw, LIBRARY_PHASES, at));

function disclosure(value: unknown, label: string): LibraryDisclosure {
  const item = record(value, label); keys(item, ["channel", "reviewStatus"], label, ["publisherHandle"]);
  return Object.freeze({ channel: oneOf(item.channel, CHANNELS, `${label}/channel`), reviewStatus: oneOf(item.reviewStatus, REVIEW_STATES, `${label}/reviewStatus`), ...(item.publisherHandle === undefined ? {} : { publisherHandle: str(item.publisherHandle, `${label}/publisherHandle`) }) });
}

function packRef(value: unknown, label: string, extra: readonly string[] = []): LibraryPackRef & Json {
  const item = record(value, label); keys(item, ["packId", "packVersion", "targetId", "title", "phase", "mode", "disclosure", ...extra], label);
  return Object.freeze({ packId: str(item.packId, `${label}/packId`), packVersion: str(item.packVersion, `${label}/packVersion`), targetId: str(item.targetId, `${label}/targetId`), title: str(item.title, `${label}/title`), phase: item.phase === null ? null : oneOf(item.phase, LIBRARY_PHASES, `${label}/phase`), mode: str(item.mode, `${label}/mode`), disclosure: disclosure(item.disclosure, `${label}/disclosure`), ...Object.fromEntries(extra.map((key) => [key, str(item[key], `${label}/${key}`)])) });
}

export function parseLibrarySearch(value: unknown): LibrarySearchResult {
  const body = record(value, "library search"); keys(body, ["query", "items", "totals"], "library search");
  const query = record(body.query, "query"); keys(query, ["text", "tokens", "phase", "kinds", "limit"], "query");
  const totals = record(body.totals, "totals"); keys(totals, LIBRARY_KINDS, "totals");
  const seen = new Set<string>();
  const items = list(body.items, "items", (raw, label) => {
    const item = record(raw, label); keys(item, ["kind", "id", "title", "summary", "phases", "disclosure", "packIds"], label, ["mode", "positions"]);
    const kind = oneOf(item.kind, LIBRARY_KINDS, `${label}/kind`), id = str(item.id, `${label}/id`);
    if (seen.has(`${kind}:${id}`)) throw new TypeError(`${label} repeats ${kind}:${id}`);
    seen.add(`${kind}:${id}`);
    return Object.freeze({ kind, id, title: str(item.title, `${label}/title`), summary: str(item.summary, `${label}/summary`, true), phases: phases(item.phases, `${label}/phases`), disclosure: disclosure(item.disclosure, `${label}/disclosure`), ...(item.mode === undefined ? {} : { mode: str(item.mode, `${label}/mode`) }), ...(item.positions === undefined ? {} : { positions: int(item.positions, `${label}/positions`, 1) }), packIds: strings(item.packIds, `${label}/packIds`) });
  });
  return Object.freeze({
    query: Object.freeze({ text: str(query.text, "query/text", true), tokens: strings(query.tokens, "query/tokens"), phase: query.phase === null ? null : oneOf(query.phase, LIBRARY_PHASES, "query/phase"), kinds: list(query.kinds, "query/kinds", (raw, at) => oneOf(raw, LIBRARY_KINDS, at)), limit: int(query.limit, "query/limit", 1) }),
    items,
    totals: Object.freeze(Object.fromEntries(LIBRARY_KINDS.map((kind) => {
      const total = record(totals[kind], `totals/${kind}`); keys(total, ["shown", "total"], `totals/${kind}`);
      const shown = int(total.shown, `totals/${kind}/shown`), all = int(total.total, `totals/${kind}/total`);
      if (shown > all) throw new TypeError(`totals/${kind} shows more than it found`);
      return [kind, Object.freeze({ shown, total: all })];
    })) as Record<LibraryKind, { readonly shown: number; readonly total: number }>),
  });
}

function citation(value: unknown, label: string): JoinedCitation {
  const item = record(value, label); keys(item, ["sourceId", "title", "sectionRef", "quotedText", "revision", "revisionUrl", "canonicalUrl", "publisher", "authors", "licence", "attributionText", "modified", "proof", "citableText"], label);
  const licence = record(item.licence, `${label}/licence`); keys(licence, ["id", "name", "url"], `${label}/licence`);
  if (item.modified !== false) throw new TypeError(`${label}/modified must be false`);
  return Object.freeze({ sourceId: str(item.sourceId, `${label}/sourceId`), title: str(item.title, `${label}/title`), sectionRef: str(item.sectionRef, `${label}/sectionRef`), quotedText: str(item.quotedText, `${label}/quotedText`), revision: str(item.revision, `${label}/revision`), revisionUrl: str(item.revisionUrl, `${label}/revisionUrl`), canonicalUrl: str(item.canonicalUrl, `${label}/canonicalUrl`), publisher: str(item.publisher, `${label}/publisher`), authors: strings(item.authors, `${label}/authors`), licence: Object.freeze({ id: str(licence.id, `${label}/licence/id`), name: str(licence.name, `${label}/licence/name`), url: str(licence.url, `${label}/licence/url`) }), attributionText: str(item.attributionText, `${label}/attributionText`, true), modified: false, proof: oneOf(item.proof, ["verified", "source_unavailable"] as const, `${label}/proof`) });
}

export function parsePrincipleEntry(value: unknown): PrincipleEntryView {
  const item = record(value, "principle"); keys(item, ["id", "version", "digest", "name", "statement", "counterCase", "phases", "standsOn", "licence", "citations", "sourceNotes", "disclosure", "anchoredPacks", "applicability"], "principle");
  return Object.freeze({ id: str(item.id, "id"), version: str(item.version, "version"), digest: str(item.digest, "digest"), name: str(item.name, "name"), statement: str(item.statement, "statement"), counterCase: str(item.counterCase, "counterCase"), phases: phases(item.phases, "phases"), standsOn: oneOf(item.standsOn, ["chess_tradition", "authors_practice", "instrument_pattern", "cited_source"] as const, "standsOn"), licence: str(item.licence, "licence"), citations: list(item.citations, "citations", citation), sourceNotes: strings(item.sourceNotes, "sourceNotes"), disclosure: disclosure(item.disclosure, "disclosure"), anchoredPacks: list(item.anchoredPacks, "anchoredPacks", (raw, at) => packRef(raw, at, ["claimId"]) as unknown as LibraryPackRef & { readonly claimId: string }) });
}

export function parseShapeEntry(value: unknown): ShapeEntryLibraryView {
  const item = record(value, "shape"); keys(item, ["id", "version", "digest", "name", "phases", "licence", "plans", "watch", "typicalMistakes", "sourceNotes", "disclosure", "packs", "applicability"], "shape");
  return Object.freeze({ id: str(item.id, "id"), version: str(item.version, "version"), digest: str(item.digest, "digest"), name: str(item.name, "name"), phases: phases(item.phases, "phases"), licence: str(item.licence, "licence"), plans: list(item.plans, "plans", (raw, at) => { const plan = record(raw, at); keys(plan, ["id", "side", "label", "description"], at); return Object.freeze({ id: str(plan.id, `${at}/id`), side: str(plan.side, `${at}/side`), label: str(plan.label, `${at}/label`), description: str(plan.description, `${at}/description`) }); }), watch: strings(item.watch, "watch"), typicalMistakes: strings(item.typicalMistakes, "typicalMistakes"), sourceNotes: strings(item.sourceNotes, "sourceNotes"), disclosure: disclosure(item.disclosure, "disclosure"), packs: list(item.packs, "packs", (raw, at) => packRef(raw, at)) });
}

export function parseOpeningEntry(value: unknown): OpeningEntryView {
  const item = record(value, "opening"); keys(item, ["positionKey", "samePositions", "source", "disclosure", "packs", "applicability"], "opening", ["endpoint"]);
  const applicability = record(item.applicability, "applicability");
  let endpoint: OpeningEntryView["endpoint"];
  if (item.endpoint !== undefined) { const raw = record(item.endpoint, "endpoint"); endpoint = Object.freeze({ eco: str(raw.eco, "endpoint/eco"), name: str(raw.name, "endpoint/name"), sourcePly: int(raw.sourcePly, "endpoint/sourcePly", 1) }); }
  let source: OpeningEntryView["source"] = null;
  if (item.source !== null) { const raw = record(item.source, "source"); keys(raw, ["name", "licence", "commit", "url"], "source"); source = Object.freeze({ name: str(raw.name, "source/name"), licence: str(raw.licence, "source/licence"), commit: str(raw.commit, "source/commit"), url: str(raw.url, "source/url") }); }
  return Object.freeze({ positionKey: str(item.positionKey, "positionKey"), ...(endpoint === undefined ? {} : { endpoint }), samePositions: strings(item.samePositions, "samePositions"), source, disclosure: disclosure(item.disclosure, "disclosure"), packs: list(item.packs, "packs", (raw, at) => packRef(raw, at)), abstained: strings(applicability.abstained, "applicability/abstained") });
}

export function parsePackEntry(value: unknown): PackEntryView {
  const item = record(value, "pack entry"); keys(item, ["pack", "disclosure", "startFen", "shapes", "principles", "concepts"], "pack entry", ["opening"]);
  const pack = record(item.pack, "pack");
  const difficulty = pack.difficulty === null || pack.difficulty === undefined ? null : record(pack.difficulty, "pack/difficulty");
  let opening: PackEntryView["opening"];
  if (item.opening !== undefined) { const raw = record(item.opening, "opening"); keys(raw, ["positionKey", "eco", "name"], "opening"); opening = Object.freeze({ positionKey: str(raw.positionKey, "opening/positionKey"), eco: str(raw.eco, "opening/eco"), name: str(raw.name, "opening/name") }); }
  return Object.freeze({
    pack: Object.freeze({ id: str(pack.id, "pack/id"), version: str(pack.version, "pack/version"), title: str(pack.title, "pack/title"), mode: str(pack.mode, "pack/mode"), phase: pack.phase === null ? null : oneOf(pack.phase, LIBRARY_PHASES, "pack/phase"), objectiveSummary: str(pack.objectiveSummary, "pack/objectiveSummary"), difficultyLabel: difficulty === null || typeof difficulty.label !== "string" ? null : difficulty.label }),
    disclosure: disclosure(item.disclosure, "disclosure"),
    startFen: str(item.startFen, "startFen"),
    shapes: list(item.shapes, "shapes", (raw, at) => { const shape = record(raw, at); keys(shape, ["id", "name", "relation"], at); return Object.freeze({ id: str(shape.id, `${at}/id`), name: str(shape.name, `${at}/name`), relation: oneOf(shape.relation, ["present", "prospective"] as const, `${at}/relation`) }); }),
    principles: list(item.principles, "principles", (raw, at) => { const principle = record(raw, at); keys(principle, ["id", "name", "claimIds"], at); return Object.freeze({ id: str(principle.id, `${at}/id`), name: str(principle.name, `${at}/name`), claimIds: strings(principle.claimIds, `${at}/claimIds`) }); }),
    concepts: list(item.concepts, "concepts", (raw, at) => { const concept = record(raw, at); keys(concept, ["id", "label", "status"], at); return Object.freeze({ id: str(concept.id, `${at}/id`), label: str(concept.label, `${at}/label`), status: str(concept.status, `${at}/status`) }); }),
    ...(opening === undefined ? {} : { opening }),
  });
}

export function librarySearchPath(query: LibrarySearchQuery): string {
  const params = new URLSearchParams();
  params.set("q", query.text);
  if (query.phase !== undefined) params.set("phase", query.phase);
  if (query.kinds !== undefined && query.kinds.length > 0) params.set("kind", query.kinds.join(","));
  if (query.limit !== undefined) params.set("limit", String(query.limit));
  return `/theory/search?${params.toString()}`;
}

// ---------------------------------------------------------------------------------------------
// Learner copy — fixed product strings about origin and availability, never chess claims.
// ---------------------------------------------------------------------------------------------

export function disclosureCopy(value: LibraryDisclosure): string {
  const publisher = value.publisherHandle === undefined ? "" : ` · @${value.publisherHandle}`;
  if (value.channel === "official") return "Official";
  if (value.channel === "catalogue") return "Opening catalogue · Lichess chess-openings (CC0)";
  if (value.reviewStatus === "published") return `Community publication${publisher}`;
  if (value.reviewStatus === "schema_example") return "Example content";
  return `Community draft · not yet reviewed${publisher}`;
}

export const STANDS_ON_COPY: Readonly<Record<PrincipleEntryView["standsOn"], string>> = Object.freeze({
  chess_tradition: "Stands on chess tradition.",
  authors_practice: "Stands on the authors' practice. No external source is cited for it.",
  instrument_pattern: "Stands on a pattern Tabiya's instruments measure.",
  cited_source: "Stands on the cited source below.",
});

export function citationAttribution(value: JoinedCitation): string {
  const notice = value.attributionText.trim() === "" ? `${value.title} by ${value.authors.join(", ")}` : value.attributionText;
  return `${notice} Revision ${value.revision}. ${value.licence.name}. Quoted verbatim.`;
}

export const LIBRARY_PHASE_COPY: Readonly<Record<LibraryPhase | "all", string>> = Object.freeze({
  all: "Every phase",
  opening: "Openings",
  middlegame: "Middlegames",
  endgame: "Endgames",
  cross_phase: "Across phases",
});

export const LIBRARY_KIND_COPY: Readonly<Record<LibraryKind, string>> = Object.freeze({
  pack: "Rehearsal packs",
  principle: "Principles",
  shape: "Shapes",
  concept: "Concepts",
  opening: "Named openings",
});
