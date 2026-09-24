import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import type { PrincipleCitation } from "@chess-tabiya/schema/principle-entry";

import { pinnedRevision, type RevisionAdapterId } from "./sourcing/revision-pin.js";

/**
 * The theory-source register (rfc/theory-knowledge-pipeline.md §2), as amended at implementation
 * for the independent buildability return:
 *
 * - [[D1894]] rights are not self-declared. A row names one member of a reviewed licence policy
 *   whose permissions and obligations are DERIVED, never authored beside it. Every member is a real
 *   SPDX identifier; there is no `public-domain` pseudo-identifier.
 * - [[D1895]] the lifecycle is `accepted | rejected | superseded`, and only `accepted` rows are
 *   citable or buildable. Immutability is proven by an origin-specific adapter
 *   (`sourcing/revision-pin.ts`) that must extract exactly the row's `revision`.
 * - [[D1898]] a principle citation references a register row by id; revision and digest must
 *   equal the row, and the complete attribution is joined from the row.
 * - [[D1892]] a clean checkout has no source bytes (`content/sources/` is gitignored). Proof of a
 *   quotation against pinned bytes is a separate tier: when the bytes are present locally the
 *   quote must occur exactly once; when they are absent the citation reports `source_unavailable`
 *   truthfully instead of claiming verification.
 *
 * No LLM participates in any step: the register is authored and reviewed content, validation is
 * deterministic code, and nothing here fetches the network.
 */
export const THEORY_SOURCE_REGISTER_SCHEMA = "tabiya.theory.sources.v1" as const;

export const THEORY_LICENCE_POLICY = Object.freeze({
  "CC0-1.0": Object.freeze({ name: "CC0 1.0 Universal", url: "https://creativecommons.org/publicdomain/zero/1.0/", quotation: true, redistribution: true, adaptation: true, requiresAttribution: false, requiresLicenceLink: false, requiresChangeIndication: false, shareAlike: null }),
  "CC-BY-4.0": Object.freeze({ name: "Creative Commons Attribution 4.0", url: "https://creativecommons.org/licenses/by/4.0/", quotation: true, redistribution: true, adaptation: true, requiresAttribution: true, requiresLicenceLink: true, requiresChangeIndication: true, shareAlike: null }),
  "CC-BY-SA-3.0": Object.freeze({ name: "Creative Commons Attribution-ShareAlike 3.0", url: "https://creativecommons.org/licenses/by-sa/3.0/", quotation: true, redistribution: true, adaptation: true, requiresAttribution: true, requiresLicenceLink: true, requiresChangeIndication: true, shareAlike: "CC-BY-SA-3.0" }),
  "CC-BY-SA-4.0": Object.freeze({ name: "Creative Commons Attribution-ShareAlike 4.0", url: "https://creativecommons.org/licenses/by-sa/4.0/", quotation: true, redistribution: true, adaptation: true, requiresAttribution: true, requiresLicenceLink: true, requiresChangeIndication: true, shareAlike: "CC-BY-SA-4.0" }),
} as const);
export type TheoryLicenceId = keyof typeof THEORY_LICENCE_POLICY;

export const THEORY_SOURCE_STRENGTHS = Object.freeze(["structured_dataset", "reference_work", "community_wiki"] as const);
export type TheorySourceStrength = (typeof THEORY_SOURCE_STRENGTHS)[number];

/** What the recorded `sha256` digests, so a proof re-derives the same bytes. */
export const THEORY_DIGEST_SUBJECTS = Object.freeze(["raw_file_bytes", "mediawiki_api_response"] as const);
export type TheoryDigestSubject = (typeof THEORY_DIGEST_SUBJECTS)[number];

export interface TheorySourceEntry {
  readonly sourceId: string;
  readonly title: string;
  readonly canonicalUrl: string;
  readonly revisionUrl: string;
  readonly revision: string;
  readonly revisionAdapter: RevisionAdapterId;
  readonly publisher: string;
  readonly authors: readonly [string, ...string[]];
  readonly licence: TheoryLicenceId;
  readonly attributionText: string;
  readonly language: string;
  /** Provenance only — never an ordering, weighting or rendered input (§2 rule 4). */
  readonly strength: TheorySourceStrength;
  readonly review: { readonly state: "accepted" | "rejected" | "superseded"; readonly by: string; readonly at: string; readonly supersededBy?: string };
  readonly sha256: string;
  readonly digestSubject: TheoryDigestSubject;
  readonly admissionNote: string;
}

export interface TheorySourceRegister {
  readonly schema: typeof THEORY_SOURCE_REGISTER_SCHEMA;
  readonly entries: readonly TheorySourceEntry[];
}

export const THEORY_SOURCE_ISSUE_CODES = Object.freeze([
  "THEORY_REGISTER_INVALID",
  "THEORY_SOURCE_INVALID",
  "THEORY_SOURCE_DUPLICATE",
  "THEORY_SOURCE_REFUSED",
  "THEORY_SOURCE_REVISION_UNPINNED",
  "THEORY_SOURCE_LICENCE_UNREVIEWED",
  "THEORY_ATTRIBUTION_MISSING",
  "THEORY_SOURCE_SUPERSESSION_INVALID",
] as const);
export type TheorySourceIssueCode = (typeof THEORY_SOURCE_ISSUE_CODES)[number];

export const CITATION_ISSUE_CODES = Object.freeze([
  "CITATION_SOURCE_UNREGISTERED",
  "CITATION_SOURCE_NOT_ACCEPTED",
  "CITATION_REVISION_MISMATCH",
  "CITATION_DIGEST_MISMATCH",
  "CITATION_SOURCE_DIGEST_DRIFT",
  "CITATION_QUOTE_ABSENT",
  "CITATION_SPAN_AMBIGUOUS",
] as const);
export type CitationIssueCode = (typeof CITATION_ISSUE_CODES)[number];

export interface TheoryIssue<Code extends string> {
  readonly code: Code;
  readonly path: string;
  readonly message: string;
}

/**
 * The standing refusals of `design/research/theory-sourcing.md`'s "Do not use" list, as data rather
 * than prose (§2 rule 5). Matching is on the parsed host (exact or subdomain) and, where the refusal
 * is narrower than a host, on a leading path segment — never on a substring of the URL.
 */
export const REFUSED_THEORY_ORIGINS = Object.freeze([
  Object.freeze({ id: "twic", host: "theweekinchess.com", pathPrefix: null, reason: "TWIC is free for personal use only" }),
  Object.freeze({ id: "pgn-mentor", host: "pgnmentor.com", pathPrefix: null, reason: "PGN Mentor states no terms" }),
  Object.freeze({ id: "ecochessopeningcodes", host: "ecochessopeningcodes.com", pathPrefix: null, reason: "unlicensed compilation with unclear provenance" }),
  Object.freeze({ id: "lichess-studies", host: "lichess.org", pathPrefix: "study", reason: "Lichess studies are author-owned and may not be ingested in bulk" }),
  Object.freeze({ id: "calebjcourtney-dump", host: "github.com", pathPrefix: "calebjcourtney", reason: "the calebjcourtney SQLite dump may not be used verbatim" }),
] as const);

export function refusedTheoryOrigin(url: string): (typeof REFUSED_THEORY_ORIGINS)[number] | undefined {
  let parsedUrl: URL;
  try { parsedUrl = new URL(url); } catch { return undefined; }
  const host = parsedUrl.hostname.toLowerCase();
  const first = parsedUrl.pathname.split("/")[1]?.toLowerCase() ?? "";
  const rawHost = host === "raw.githubusercontent.com" ? "github.com" : host;
  return REFUSED_THEORY_ORIGINS.find((origin) => (rawHost === origin.host || rawHost.endsWith(`.${origin.host}`)) && (origin.pathPrefix === null || first === origin.pathPrefix));
}

const ENTRY_KEYS = Object.freeze(["sourceId", "title", "canonicalUrl", "revisionUrl", "revision", "revisionAdapter", "publisher", "authors", "licence", "attributionText", "language", "strength", "review", "sha256", "digestSubject", "admissionNote"]);

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function text(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}
function exactKeys(value: Record<string, unknown>, required: readonly string[], optional: readonly string[] = []): boolean {
  const keys = Object.keys(value);
  return required.every((key) => keys.includes(key)) && keys.every((key) => required.includes(key) || optional.includes(key));
}
function httpsUrl(value: unknown): boolean {
  if (!text(value)) return false;
  try { return new URL(value).protocol === "https:"; } catch { return false; }
}

/** Validates the register document. Returns the frozen register only when there are zero issues. */
export function validateTheorySourceRegister(value: unknown): { readonly register?: TheorySourceRegister; readonly issues: readonly TheoryIssue<TheorySourceIssueCode>[] } {
  const issues: TheoryIssue<TheorySourceIssueCode>[] = [];
  const push = (code: TheorySourceIssueCode, path: string, message: string): void => { issues.push(Object.freeze({ code, path, message })); };
  if (!record(value) || !exactKeys(value, ["schema", "entries"]) || value.schema !== THEORY_SOURCE_REGISTER_SCHEMA || !Array.isArray(value.entries)) {
    push("THEORY_REGISTER_INVALID", "/", `register must be {schema: "${THEORY_SOURCE_REGISTER_SCHEMA}", entries: [...]}`);
    return Object.freeze({ issues: Object.freeze(issues) });
  }
  const seen = new Set<string>();
  value.entries.forEach((raw, index) => {
    const path = `/entries/${index}`;
    if (!record(raw) || !exactKeys(raw, ENTRY_KEYS)) { push("THEORY_SOURCE_INVALID", path, `entry must carry exactly ${ENTRY_KEYS.join(", ")}`); return; }
    const review = raw.review;
    const shapeValid = /^[a-z0-9][a-z0-9-]*$/.test(String(raw.sourceId))
      && text(raw.title) && httpsUrl(raw.canonicalUrl) && text(raw.revisionUrl) && text(raw.revision) && text(raw.publisher)
      && Array.isArray(raw.authors) && raw.authors.length > 0 && raw.authors.every(text)
      && typeof raw.attributionText === "string" && /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(String(raw.language))
      && (THEORY_SOURCE_STRENGTHS as readonly unknown[]).includes(raw.strength)
      && (THEORY_DIGEST_SUBJECTS as readonly unknown[]).includes(raw.digestSubject)
      && /^sha256:[a-f0-9]{64}$/.test(String(raw.sha256)) && text(raw.admissionNote)
      && record(review) && exactKeys(review, ["state", "by", "at"], ["supersededBy"]) && ["accepted", "rejected", "superseded"].includes(String(review.state)) && text(review.by) && /^\d{4}-\d{2}-\d{2}$/.test(String(review.at))
      && (raw.revisionAdapter === "mediawiki_oldid" || raw.revisionAdapter === "github_commit");
    if (!shapeValid) { push("THEORY_SOURCE_INVALID", path, "entry fields are malformed"); return; }
    const sourceId = String(raw.sourceId);
    if (seen.has(sourceId)) push("THEORY_SOURCE_DUPLICATE", `${path}/sourceId`, `duplicate sourceId ${sourceId}`);
    seen.add(sourceId);
    for (const key of ["canonicalUrl", "revisionUrl"] as const) {
      const refused = refusedTheoryOrigin(String(raw[key]));
      if (refused !== undefined) push("THEORY_SOURCE_REFUSED", `${path}/${key}`, `${refused.id}: ${refused.reason}`);
    }
    const pinned = pinnedRevision(String(raw.revisionUrl));
    if (pinned === undefined || pinned.adapter !== raw.revisionAdapter || pinned.revision !== raw.revision) {
      push("THEORY_SOURCE_REVISION_UNPINNED", `${path}/revisionUrl`, `revisionUrl must be an immutable ${String(raw.revisionAdapter)} URL naming revision ${String(raw.revision)}`);
    }
    if (!Object.hasOwn(THEORY_LICENCE_POLICY, String(raw.licence))) {
      push("THEORY_SOURCE_LICENCE_UNREVIEWED", `${path}/licence`, `licence must be one of ${Object.keys(THEORY_LICENCE_POLICY).join(", ")}`);
    } else if (THEORY_LICENCE_POLICY[raw.licence as TheoryLicenceId].requiresAttribution && !text(raw.attributionText)) {
      push("THEORY_ATTRIBUTION_MISSING", `${path}/attributionText`, `${String(raw.licence)} requires an attribution notice`);
    }
    const supersededBy = (review as Record<string, unknown>).supersededBy;
    if ((review as Record<string, unknown>).state === "superseded" ? !text(supersededBy) : supersededBy !== undefined) {
      push("THEORY_SOURCE_SUPERSESSION_INVALID", `${path}/review`, "a superseded row names its successor and no other row may");
    }
  });
  for (const [index, raw] of (value.entries as unknown[]).entries()) {
    if (!record(raw) || !record(raw.review) || raw.review.state !== "superseded") continue;
    const successor = (value.entries as unknown[]).find((candidate) => record(candidate) && candidate.sourceId === (raw.review as Record<string, unknown>).supersededBy);
    if (!record(successor) || !record(successor.review) || successor.review.state !== "accepted") push("THEORY_SOURCE_SUPERSESSION_INVALID", `/entries/${index}/review/supersededBy`, "a superseded row must name an accepted successor");
  }
  if (issues.length > 0) return Object.freeze({ issues: Object.freeze(issues) });
  return Object.freeze({ register: deepFreeze(structuredClone(value) as unknown as TheorySourceRegister), issues: Object.freeze([]) });
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

export const DEFAULT_THEORY_SOURCE_REGISTER_PATH = (): string => fileURLToPath(new URL("../../../content/theory-sources.json", import.meta.url));
/** Local, gitignored pinned bytes: `content/sources/theory/<sourceId>/<revision>`. */
export const DEFAULT_THEORY_SOURCE_BYTES_DIRECTORY = (): string => fileURLToPath(new URL("../../../content/sources/theory/", import.meta.url));

let defaultRegister: TheorySourceRegister | undefined;
export function loadDefaultTheorySourceRegister(): TheorySourceRegister {
  if (defaultRegister !== undefined) return defaultRegister;
  const result = validateTheorySourceRegister(JSON.parse(readFileSync(DEFAULT_THEORY_SOURCE_REGISTER_PATH(), "utf8")));
  if (result.register === undefined) throw new TypeError(`content/theory-sources.json is invalid: ${result.issues.map((item) => `${item.code} ${item.path}`).join("; ")}`);
  defaultRegister = result.register;
  return defaultRegister;
}

/** The attribution a renderer must carry with a quotation, joined from the register row. */
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
  readonly licence: { readonly id: TheoryLicenceId; readonly name: string; readonly url: string };
  readonly attributionText: string;
  /** Principle citations are verbatim quotations; an adaptation is a licence question, not a render. */
  readonly modified: false;
  /** `verified`: local pinned bytes matched the digest and contain the quote exactly once. */
  readonly proof: "verified" | "source_unavailable";
  /** The same bytes expressed as pack-population-provenance's `citable_text` record values. */
  readonly citableText: { readonly kind: "citable_text"; readonly grounds: "citable_source"; readonly sourceId: string; readonly values: { readonly title: string; readonly sectionRef: string; readonly quotedText: string } };
}

function sha256(bytes: Uint8Array | string): string {
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}

function decodeEntities(value: string): string {
  return value.replace(/&(#x[0-9a-f]+|#[0-9]+|amp|lt|gt|quot|apos|nbsp);/gi, (match, entity: string) => {
    const lower = entity.toLowerCase();
    if (lower.startsWith("#x")) return String.fromCodePoint(Number.parseInt(lower.slice(2), 16));
    if (lower.startsWith("#")) return String.fromCodePoint(Number.parseInt(lower.slice(1), 10));
    return ({ amp: "&", lt: "<", gt: ">", quot: "\"", apos: "'", nbsp: " " } as Record<string, string>)[lower] ?? match;
  });
}

/**
 * Deterministic text extraction for a digest subject (extractor `theory-text@1`). A MediaWiki API
 * response is JSON whose string leaves carry rendered HTML; its searchable text is those leaves with
 * tags removed and entities decoded, whitespace collapsed. Raw file bytes are their UTF-8 text.
 */
export function extractTheoryText(subject: TheoryDigestSubject, bytes: Uint8Array): string {
  const decoded = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  if (subject === "raw_file_bytes") return decoded;
  const leaves: string[] = [];
  const walk = (value: unknown): void => {
    if (typeof value === "string") leaves.push(value);
    else if (Array.isArray(value)) value.forEach(walk);
    else if (record(value)) Object.values(value).forEach(walk);
  };
  walk(JSON.parse(decoded));
  return decodeEntities(leaves.join("\n").replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ");
}

function occurrences(haystack: string, needle: string): number {
  let count = 0;
  for (let at = haystack.indexOf(needle); at !== -1; at = haystack.indexOf(needle, at + 1)) count += 1;
  return count;
}

/**
 * Joins one principle citation to its register row. Issues are errors; a clean result carries the
 * complete attribution and the proof tier actually reached.
 */
export function joinPrincipleCitation(
  citation: PrincipleCitation,
  register: TheorySourceRegister,
  options: { readonly bytesDirectory?: string | null; readonly path?: string } = {},
): { readonly citation?: JoinedCitation; readonly issues: readonly TheoryIssue<CitationIssueCode>[] } {
  const path = options.path ?? "/";
  const issues: TheoryIssue<CitationIssueCode>[] = [];
  const push = (code: CitationIssueCode, message: string): void => { issues.push(Object.freeze({ code, path, message })); };
  const row = register.entries.find((entry) => entry.sourceId === citation.sourceId);
  if (row === undefined) { push("CITATION_SOURCE_UNREGISTERED", `sourceId ${citation.sourceId} is not in content/theory-sources.json`); return Object.freeze({ issues: Object.freeze(issues) }); }
  if (row.review.state !== "accepted") push("CITATION_SOURCE_NOT_ACCEPTED", `source ${row.sourceId} is ${row.review.state}; only accepted rows are citable`);
  if (citation.revisionUrl !== row.revisionUrl) push("CITATION_REVISION_MISMATCH", `revisionUrl must equal the register row (${row.revisionUrl})`);
  if (citation.sha256 !== row.sha256) push("CITATION_DIGEST_MISMATCH", `sha256 must equal the register row (${row.sha256})`);
  let proof: JoinedCitation["proof"] = "source_unavailable";
  const directory = options.bytesDirectory === undefined ? DEFAULT_THEORY_SOURCE_BYTES_DIRECTORY() : options.bytesDirectory;
  const file = directory === null ? undefined : join(directory, row.sourceId, row.revision);
  if (issues.length === 0 && file !== undefined && existsSync(file)) {
    const bytes = readFileSync(file);
    if (sha256(bytes) !== row.sha256) push("CITATION_SOURCE_DIGEST_DRIFT", `local bytes for ${row.sourceId}@${row.revision} do not match the pinned digest`);
    else {
      const count = occurrences(extractTheoryText(row.digestSubject, bytes), citation.quotedText);
      if (count === 0) push("CITATION_QUOTE_ABSENT", "quotedText does not occur in the pinned source text");
      else if (count > 1) push("CITATION_SPAN_AMBIGUOUS", `quotedText occurs ${count} times in the pinned source text; it must occur exactly once`);
      else proof = "verified";
    }
  }
  if (issues.length > 0) return Object.freeze({ issues: Object.freeze(issues) });
  const policy = THEORY_LICENCE_POLICY[row.licence];
  return Object.freeze({
    citation: deepFreeze({
      sourceId: row.sourceId,
      title: row.title,
      sectionRef: citation.sectionRef,
      quotedText: citation.quotedText,
      revision: row.revision,
      revisionUrl: row.revisionUrl,
      canonicalUrl: row.canonicalUrl,
      publisher: row.publisher,
      authors: [...row.authors],
      licence: { id: row.licence, name: policy.name, url: policy.url },
      attributionText: row.attributionText,
      modified: false as const,
      proof,
      citableText: { kind: "citable_text" as const, grounds: "citable_source" as const, sourceId: row.sourceId, values: { title: row.title, sectionRef: citation.sectionRef, quotedText: citation.quotedText } },
    }),
    issues: Object.freeze([]),
  });
}
