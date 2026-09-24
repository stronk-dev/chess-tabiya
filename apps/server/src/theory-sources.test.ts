import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { pinnedRevision } from "./sourcing/revision-pin.js";
import {
  CITATION_ISSUE_CODES,
  REFUSED_THEORY_ORIGINS,
  THEORY_LICENCE_POLICY,
  THEORY_SOURCE_ISSUE_CODES,
  extractTheoryText,
  joinPrincipleCitation,
  loadDefaultTheorySourceRegister,
  validateTheorySourceRegister,
  type TheorySourceEntry,
  type TheorySourceRegister,
} from "./theory-sources.js";

const committed = JSON.parse(readFileSync(new URL("../../../content/theory-sources.json", import.meta.url), "utf8")) as { schema: string; entries: TheorySourceEntry[] };
const r4Csv = readFileSync(new URL("../../../planning/platform-alignment/knowledge-retrieval/source-register.csv", import.meta.url), "utf8").trim().split("\n").slice(1).map((line) => line.split(","));

function sha256(value: string | Uint8Array): string {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function row(overrides: Partial<TheorySourceEntry> & Record<string, unknown> = {}): TheorySourceEntry {
  return { ...structuredClone(committed.entries.find((entry) => entry.sourceId === "wikibooks-rookpawn")!), ...overrides } as TheorySourceEntry;
}

function codes(entries: readonly unknown[]): readonly string[] {
  return validateTheorySourceRegister({ schema: "tabiya.theory.sources.v1", entries }).issues.map((issue) => issue.code);
}

describe("theory-source register (rfc/theory-knowledge-pipeline.md §2, repaired for D1894/D1895)", () => {
  it("validates the committed register: every row accepted, pinned by its own adapter, and licensed by policy", () => {
    const result = validateTheorySourceRegister(committed);
    expect(result.issues).toEqual([]);
    expect(result.register?.entries.map((entry) => entry.sourceId)).toEqual(committed.entries.map((entry) => entry.sourceId));
    for (const entry of committed.entries) {
      expect(entry.review.state).toBe("accepted");
      expect(pinnedRevision(entry.revisionUrl)).toEqual({ adapter: entry.revisionAdapter, revision: entry.revision });
      expect(Object.keys(THEORY_LICENCE_POLICY)).toContain(entry.licence);
    }
    expect(loadDefaultTheorySourceRegister().entries).toHaveLength(committed.entries.length);
  });

  it("admits exactly the pinned R4 rows: eight Wikibooks oldid revisions and five commit-pinned opening tables", () => {
    const pinnedRows = r4Csv.filter(([id]) => id!.startsWith("wikibooks-") || id!.startsWith("lichess-openings-"));
    expect(pinnedRows).toHaveLength(13);
    for (const [id, url, revision, , , , , , , digest] of pinnedRows) {
      expect(pinnedRevision(url!)?.revision, id).toBe(revision);
      const entry = committed.entries.find((candidate) => candidate.sourceId === id)!;
      expect(entry.revisionUrl).toBe(url);
      expect(entry.sha256).toBe(digest);
    }
    // The byte-range puzzle prefix and the local research dossiers are not immutable public revisions.
    for (const [id, url] of r4Csv.filter(([id]) => !pinnedRows.some((row) => row[0] === id))) {
      expect(pinnedRevision(url!), id).toBeUndefined();
      expect(committed.entries.some((entry) => entry.sourceId === id)).toBe(false);
    }
  });

  it("refuses the five standing Do-not-use origins as data, not prose (THEORY_SOURCE_REFUSED)", () => {
    const fixtures = [
      "https://theweekinchess.com/twic",
      "https://www.pgnmentor.com/files.html",
      "https://ecochessopeningcodes.com/endgames",
      "https://lichess.org/study/abcdef12",
      "https://github.com/calebjcourtney/chess-openings/blob/0123456789abcdef0123456789abcdef01234567/openings.sqlite",
    ];
    expect(REFUSED_THEORY_ORIGINS).toHaveLength(5);
    for (const url of fixtures) expect(codes([row({ canonicalUrl: url })]), url).toContain("THEORY_SOURCE_REFUSED");
    // Matching is host/segment based, never substring: a Lichess page that is not a study is not refused.
    expect(codes([row({ canonicalUrl: "https://lichess.org/analysis/studyguide" })])).not.toContain("THEORY_SOURCE_REFUSED");
  });

  it("refuses a mutable or adapter-mismatched revision URL (THEORY_SOURCE_REVISION_UNPINNED)", () => {
    expect(codes([row({ revisionUrl: "https://en.wikibooks.org/wiki/Chess/The_Endgame/Rook_and_Pawn_Endings" })])).toContain("THEORY_SOURCE_REVISION_UNPINNED");
    expect(codes([row({ revision: "2064889" })])).toContain("THEORY_SOURCE_REVISION_UNPINNED");
    expect(codes([row({ revisionAdapter: "github_commit" })])).toContain("THEORY_SOURCE_REVISION_UNPINNED");
    expect(pinnedRevision("https://github.com/lichess-org/chess-openings/blob/master/a.tsv")).toBeUndefined();
    expect(pinnedRevision("http://en.wikibooks.org/w/index.php?title=X&oldid=1")).toBeUndefined();
    expect(pinnedRevision("https://en.wikibooks.org/w/index.php?title=X&oldid=1&oldid=2")).toBeUndefined();
    expect(pinnedRevision("https://raw.githubusercontent.com/o/r/0123456789abcdef0123456789abcdef01234567/a.tsv")).toEqual({ adapter: "github_commit", revision: "0123456789abcdef0123456789abcdef01234567" });
  });

  it("derives rights from a reviewed SPDX policy: CC-BY-4.0 is admitted, pseudo-identifiers are not", () => {
    expect(codes([row({ licence: "CC-BY-4.0" as never })])).toEqual([]);
    expect(codes([row({ licence: "public-domain" as never })])).toContain("THEORY_SOURCE_LICENCE_UNREVIEWED");
    expect(codes([row({ licence: "CC-BY-NC-4.0" as never })])).toContain("THEORY_SOURCE_LICENCE_UNREVIEWED");
    // A row cannot grant itself rights: an authored permissions block is not part of the shape.
    expect(codes([row({ permits: { quotation: true, redistribution: true, adaptation: true } })])).toContain("THEORY_SOURCE_INVALID");
  });

  it("requires the attribution notice exactly when the licence requires attribution (THEORY_ATTRIBUTION_MISSING)", () => {
    expect(codes([row({ attributionText: "" })])).toContain("THEORY_ATTRIBUTION_MISSING");
    const cc0 = { ...structuredClone(committed.entries[0]!), attributionText: "" };
    expect(codes([cc0])).toEqual([]);
  });

  it("refuses malformed registers, duplicates and dangling supersession", () => {
    expect(validateTheorySourceRegister({ schema: "tabiya.theory.sources.v0", entries: [] }).issues.map((issue) => issue.code)).toEqual(["THEORY_REGISTER_INVALID"]);
    expect(codes([row({ strength: "grandmaster" as never })])).toContain("THEORY_SOURCE_INVALID");
    expect(codes([row(), row()])).toContain("THEORY_SOURCE_DUPLICATE");
    expect(codes([row({ review: { state: "superseded", by: "owner", at: "2026-09-24" } })])).toContain("THEORY_SOURCE_SUPERSESSION_INVALID");
    expect(codes([row({ review: { state: "superseded", by: "owner", at: "2026-09-24", supersededBy: "missing" } })])).toContain("THEORY_SOURCE_SUPERSESSION_INVALID");
    expect(codes([row({ review: { state: "superseded", by: "owner", at: "2026-09-24", supersededBy: "wikibooks-pawn" } }), structuredClone(committed.entries.find((entry) => entry.sourceId === "wikibooks-pawn")!)])).toEqual([]);
  });

  it("exercises every register refusal code it declares", () => {
    const exercised = new Set(["THEORY_REGISTER_INVALID", "THEORY_SOURCE_INVALID", "THEORY_SOURCE_DUPLICATE", "THEORY_SOURCE_REFUSED", "THEORY_SOURCE_REVISION_UNPINNED", "THEORY_SOURCE_LICENCE_UNREVIEWED", "THEORY_ATTRIBUTION_MISSING", "THEORY_SOURCE_SUPERSESSION_INVALID"]);
    expect(new Set(THEORY_SOURCE_ISSUE_CODES)).toEqual(exercised);
    const citations = new Set(["CITATION_SOURCE_UNREGISTERED", "CITATION_SOURCE_NOT_ACCEPTED", "CITATION_REVISION_MISMATCH", "CITATION_DIGEST_MISMATCH", "CITATION_SOURCE_DIGEST_DRIFT", "CITATION_QUOTE_ABSENT", "CITATION_SPAN_AMBIGUOUS"]);
    expect(new Set(CITATION_ISSUE_CODES)).toEqual(citations);
  });
});

describe("principle citation join (D1892/D1898)", () => {
  const register = loadDefaultTheorySourceRegister();
  const source = register.entries.find((entry) => entry.sourceId === "wikibooks-rookpawn")!;
  const citation = { sourceId: source.sourceId, revisionUrl: source.revisionUrl, sha256: source.sha256, sectionRef: "Lucena position", quotedText: "build a bridge" };

  it("joins the complete attribution from the register row and reports the proof tier truthfully", () => {
    const joined = joinPrincipleCitation(citation, register, { bytesDirectory: null });
    expect(joined.issues).toEqual([]);
    expect(joined.citation).toMatchObject({
      sourceId: "wikibooks-rookpawn",
      publisher: "Wikibooks",
      authors: ["Wikibooks contributors"],
      licence: { id: "CC-BY-SA-4.0", url: "https://creativecommons.org/licenses/by-sa/4.0/" },
      revision: "2064888",
      modified: false,
      proof: "source_unavailable",
      citableText: { kind: "citable_text", grounds: "citable_source", sourceId: "wikibooks-rookpawn", values: { title: source.title, sectionRef: "Lucena position", quotedText: "build a bridge" } },
    });
    // Register `strength` is provenance only; it never reaches a learner-facing projection (§2 rule 4).
    expect(JSON.stringify(joined.citation)).not.toContain("strength");
    expect(JSON.stringify(joined.citation)).not.toContain(source.strength);
  });

  it("refuses unregistered, non-accepted, revision-crossed and digest-crossed citations", () => {
    expect(joinPrincipleCitation({ ...citation, sourceId: "nowhere" }, register, { bytesDirectory: null }).issues.map((issue) => issue.code)).toEqual(["CITATION_SOURCE_UNREGISTERED"]);
    expect(joinPrincipleCitation({ ...citation, revisionUrl: register.entries.find((entry) => entry.sourceId === "wikibooks-pawn")!.revisionUrl }, register, { bytesDirectory: null }).issues.map((issue) => issue.code)).toEqual(["CITATION_REVISION_MISMATCH"]);
    expect(joinPrincipleCitation({ ...citation, sha256: `sha256:${"0".repeat(64)}` }, register, { bytesDirectory: null }).issues.map((issue) => issue.code)).toEqual(["CITATION_DIGEST_MISMATCH"]);
    const rejected: TheorySourceRegister = { ...register, entries: register.entries.map((entry) => entry.sourceId === source.sourceId ? { ...entry, review: { state: "rejected", by: "owner", at: "2026-09-24" } } : entry) };
    expect(joinPrincipleCitation(citation, rejected, { bytesDirectory: null }).issues.map((issue) => issue.code)).toEqual(["CITATION_SOURCE_NOT_ACCEPTED"]);
  });

  it("verifies against local pinned bytes: once is verified, twice is ambiguous, absent and drifted bytes fail", () => {
    const text = "Opening 😀 note. The defending king is cut off; build a bridge with the rook. Endnote.";
    const bytes = Buffer.from(text, "utf8");
    const pinned: TheorySourceRegister = { ...register, entries: [{ ...source, sha256: sha256(bytes), digestSubject: "raw_file_bytes" }] };
    const directory = mkdtempSync(join(tmpdir(), "theory-bytes-"));
    mkdirSync(join(directory, source.sourceId));
    writeFileSync(join(directory, source.sourceId, source.revision), bytes);
    const local = { ...citation, sha256: sha256(bytes) };
    // An astral-plane character precedes the quote; string search is code-point safe.
    expect(joinPrincipleCitation(local, pinned, { bytesDirectory: directory }).citation?.proof).toBe("verified");
    expect(joinPrincipleCitation({ ...local, quotedText: "not in the page" }, pinned, { bytesDirectory: directory }).issues.map((issue) => issue.code)).toEqual(["CITATION_QUOTE_ABSENT"]);
    expect(joinPrincipleCitation({ ...local, quotedText: "note" }, pinned, { bytesDirectory: directory }).issues.map((issue) => issue.code)).toEqual(["CITATION_SPAN_AMBIGUOUS"]);
    writeFileSync(join(directory, source.sourceId, source.revision), Buffer.from(`${text} edited`, "utf8"));
    expect(joinPrincipleCitation(local, pinned, { bytesDirectory: directory }).issues.map((issue) => issue.code)).toEqual(["CITATION_SOURCE_DIGEST_DRIFT"]);
  });

  it("extracts MediaWiki API text deterministically: tags removed, entities decoded, whitespace collapsed", () => {
    const response = JSON.stringify({ parse: { title: "Rook endings", text: { "*": "<p>Build&#32;a <b>bridge</b>&nbsp;&amp; win.</p>" } } });
    expect(extractTheoryText("mediawiki_api_response", Buffer.from(response))).toBe("Rook endings Build a bridge  & win. ".replace(/\s+/g, " "));
  });
});
