import { readFileSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { join } from "node:path";

import { resolvePackPath } from "@chess-tabiya/schema/pack-path";
import { canonicalizeJson, normalizeShapeReferences } from "@chess-tabiya/schema/drill-pack";
import { createHash } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { ChessTabiyaApplication } from "./application.js";
import { createInMemoryTestApplication } from "./in-memory-test-application.js";
import { loadOpeningCatalogue, type OpeningCatalogueAvailability } from "./opening-catalogue.js";
import { PackRegistry } from "./pack-registry.js";
import { PrincipleRegistry } from "./principle-registry.js";
import { ShapeRegistry } from "./shape-registry.js";
import {
  LIBRARY_KINDS,
  LIBRARY_SEARCH_MAX_LIMIT,
  TheoryLibrary,
  applicabilityTargetId,
  libraryTokens,
  openingApplicability,
  openingEntryView,
  packEntryView,
  principleApplicability,
  principleEntryView,
  shapeApplicability,
  shapeEntryView,
  type TheoryLibrarySources,
} from "./theory-library.js";

const NAMED_KEY = "rnbqk2r/1p2bppp/p2ppn2/6B1/3NPP2/2N5/PPP3PP/R2QKB1R w KQkq -";
const UNNAMED_MEMBER_KEY = "1nbqkb1r/1ppp1ppp/4pn2/1P6/8/8/1BPPPPPP/rN1QKBNR w Kk -";

let sources: TheoryLibrarySources;
let library: TheoryLibrary;

beforeAll(async () => {
  const shapes = await ShapeRegistry.loadDefault();
  const principles = await PrincipleRegistry.loadDefault();
  const packs = await PackRegistry.loadDefault({ shapes, principles });
  const openingCatalogue = await loadOpeningCatalogue(join(process.cwd(), "apps", "server", "artifacts", "runtime-opening-catalogue.json"));
  sources = { packs, shapes, principles, openingCatalogue };
  library = new TheoryLibrary(sources);
});

function packTargets(result: ReturnType<typeof shapeApplicability>): readonly string[] {
  return result.targets.flatMap((target) => target.kind === "pack" ? [target.packId] : []);
}

/** Every key anywhere inside a value, for the §1.5 "no editorial authority" seal. */
function allKeys(value: unknown, out = new Set<string>()): Set<string> {
  if (Array.isArray(value)) value.forEach((item) => allKeys(item, out));
  else if (value !== null && typeof value === "object") for (const [key, child] of Object.entries(value)) { out.add(key); allKeys(child, out); }
  return out;
}

describe("read-time applicability joins (rfc/theory-drill-current-joins.md §1, §5)", () => {
  it("shape → packs uses only validated present references, set-equal to the registry's own index", () => {
    const carlsbad = shapeApplicability(sources, "carlsbad");
    expect(carlsbad.context).toBe("library");
    expect(carlsbad.identities).toEqual([{ kind: "shape", entryId: "carlsbad", entryVersion: sources.shapes.required("carlsbad").document.version }]);
    expect(packTargets(carlsbad)).toEqual(["carlsbad-minority-attack", "trajectory-qgd-exchange-minority"]);
    expect(carlsbad.abstained).toEqual([]);

    // Criterion 1 as set-equality: shapes with a present target equal a re-derivation over the corpus.
    const reDerived = new Set(sources.packs.list().flatMap((pack) => normalizeShapeReferences(sources.packs.get(pack.id)!.document.shapes).filter((reference) => reference.relation === "present").map((reference) => reference.shape)));
    const withTargets = new Set(sources.shapes.list().filter((shape) => packTargets(shapeApplicability(sources, shape.id)).length > 0).map((shape) => shape.id));
    expect(withTargets).toEqual(new Set([...reDerived].filter((id) => sources.shapes.get(id) !== undefined)));
  });

  it("a prospective reference is never a target (criterion 2, offer arm)", () => {
    const race = shapeApplicability(sources, "opposite-castling-race");
    const prospective = sources.packs.list().filter((pack) => normalizeShapeReferences(sources.packs.get(pack.id)!.document.shapes).some((reference) => reference.shape === "opposite-castling-race" && reference.relation === "prospective")).map((pack) => pack.id);
    expect(prospective.length).toBeGreaterThan(0);
    for (const packId of prospective) expect(packTargets(race)).not.toContain(packId);
    expect(packTargets(race).length).toBeGreaterThan(0);
  });

  it("abstains honestly: a shape with no present pack is theory-only (no_present_pack), never a nearest match", () => {
    const hanging = shapeApplicability(sources, "hanging-pawns");
    expect(hanging.identities).toHaveLength(1);
    expect(packTargets(hanging)).toEqual([]);
    expect(hanging.abstained).toEqual(["no_present_pack"]);
    expect(hanging.targets).toEqual([{ kind: "theory", identity: hanging.identities[0], action: { kind: "open_shape_entry", entryId: "hanging-pawns", entryVersion: sources.shapes.required("hanging-pawns").document.version } }]);
    expect(shapeApplicability(sources, "no-such-shape")).toMatchObject({ identities: [], targets: [], abstained: ["no_identity"] });
  });

  it("a bare principle yields its theory target; each exact claim anchor yields its own source pack", () => {
    const tempo = principleApplicability(sources, "tempo-is-the-currency");
    expect(tempo.basis).toBe("anchored_claim");
    expect(tempo.identities[0]).toEqual({ kind: "principle", entryId: "tempo-is-the-currency", entryVersion: "0.1.0" });
    const anchors = tempo.identities.filter((identity) => identity.kind === "anchored_claim");
    expect(anchors.length).toBeGreaterThan(0);
    for (const anchor of anchors) {
      if (anchor.kind !== "anchored_claim") continue;
      const claim = sources.packs.get(anchor.packId)!.document.feedbackClaims!.find((candidate) => candidate.id === anchor.claimId)!;
      expect(claim.principles).toContain("tempo-is-the-currency");
      const via = { kind: "authored_claim" as const, sourcePackId: anchor.packId, sourcePackVersion: anchor.packVersion, claimId: anchor.claimId };
      expect(tempo.targets).toContainEqual({ kind: "pack", targetId: applicabilityTargetId(anchor.packId, anchor.packVersion, via), packId: anchor.packId, packVersion: anchor.packVersion, via });
    }
    // targetId is the canonical digest of {packId, packVersion, via} (§1.1).
    const first = tempo.targets.find((target) => target.kind === "pack")!;
    if (first.kind === "pack") expect(first.targetId).toBe(`sha256:${createHash("sha256").update(canonicalizeJson({ packId: first.packId, packVersion: first.packVersion, via: first.via } as never)).digest("hex")}`);
  });

  it("opening: an exact named endpoint yields its literal payload and zero packs; membership and absence abstain distinctly", () => {
    const named = openingApplicability(sources, NAMED_KEY);
    expect(named.identities).toHaveLength(1);
    const identity = named.identities[0]!;
    expect(identity.kind === "opening" && identity.endpoint).toMatchObject({ kind: "matched", projectionId: "theory.opening.current_endpoint@1", eco: "B98", name: "Sicilian Defense: Najdorf Variation", positionKey: NAMED_KEY });
    expect(packTargets(named)).toEqual([]);
    expect(named.abstained).toEqual(["no_present_pack"]);
    expect(openingApplicability(sources, UNNAMED_MEMBER_KEY).abstained).toEqual(["candidate_only"]);
    expect(openingApplicability(sources, "8/8/8/8/8/8/8/8 w - -").abstained).toEqual(["no_identity"]);
    const unavailable: OpeningCatalogueAvailability = { kind: "unavailable", reason: "artifact_missing" };
    expect(openingApplicability({ ...sources, openingCatalogue: unavailable }, NAMED_KEY).abstained).toEqual(["source_unreadable"]);
  });

  it("carries no ranking or editorial authority: no score, rank, confidence, explanation, sentence or raw route (criterion 15)", () => {
    const forbidden = ["score", "rank", "confidence", "explanation", "sentence", "route", "url"];
    const results = [shapeApplicability(sources, "carlsbad"), principleApplicability(sources, "tempo-is-the-currency"), openingApplicability(sources, NAMED_KEY)];
    for (const result of results) for (const key of allKeys(result)) expect(forbidden, key).not.toContain(key);
    // Factual operands of the registered opening payload remain legal.
    expect(allKeys(results[2])).toContain("observedPly");
    // A Library result has no `source`, so it cannot address the source-bound launch (criterion 16).
    for (const result of results) expect("source" in result).toBe(false);
  });
});

describe("Library entry views", () => {
  it("principle view: statement, honest basis, joined citations, and anchored packs with disclosure", () => {
    const view = principleEntryView(sources, "tempo-is-the-currency");
    expect(view.standsOn).toBe("authors_practice");
    expect(view.citations).toEqual([]);
    expect(view.sourceNotes[0]).toContain("no machine or external source establishes the judgement");
    expect(view.anchoredPacks.length).toBeGreaterThan(0);
    expect(view.anchoredPacks.every((pack) => pack.disclosure.channel === "community" && pack.disclosure.reviewStatus === "draft")).toBe(true);
    // Authored claim prose is released only inside a run after its checkpoint; the Library never carries it.
    const claimTexts = view.anchoredPacks.map((pack) => sources.packs.get(pack.packId)!.document.feedbackClaims!.find((claim) => claim.id === pack.claimId)!.text);
    for (const text of claimTexts) expect(JSON.stringify(view)).not.toContain(text);
    expect(() => principleEntryView(sources, "missing")).toThrow(expect.objectContaining({ code: "THEORY_ENTRY_NOT_FOUND" }));
  });

  it("shape view renders authored plans and only present packs; opening view names its catalogue source and siblings", () => {
    const shape = shapeEntryView(sources, "carlsbad");
    expect(shape.plans.length).toBeGreaterThan(0);
    expect(shape.packs.map((pack) => pack.packId)).toEqual(expect.arrayContaining(["carlsbad-minority-attack"]));
    const opening = openingEntryView(sources, NAMED_KEY);
    expect(opening.source).toMatchObject({ licence: "CC0-1.0", name: "Lichess chess-openings" });
    expect(opening.samePositions).toHaveLength(4);
    expect(opening.packs).toEqual([]);
    expect(() => openingEntryView(sources, UNNAMED_MEMBER_KEY)).toThrow(expect.objectContaining({ code: "THEORY_ENTRY_NOT_FOUND" }));
  });

  it("pack view resolves understand links through the registries and the runtime opening catalogue", () => {
    const view = packEntryView(sources, "anti-sicilian-najdorf-english-attack");
    expect(view.shapes).toContainEqual({ id: "opposite-castling-race", name: expect.any(String), relation: "prospective" });
    expect(view.principles.map((principle) => principle.id)).toEqual(expect.arrayContaining(["construction-order-matters"]));
    expect(view.concepts.length).toBeGreaterThan(0);
    const opening = packEntryView(sources, "caro-kann-advance-black").opening;
    expect(opening).toMatchObject({ eco: expect.stringMatching(/^B1/u), name: expect.stringContaining("Caro-Kann") });
  });
});

describe("Library search", () => {
  it("parses learner text literally: operators, quotes and wildcards are words, never query syntax", () => {
    expect(libraryTokens('"Najdorf*" AND NOT (pawn) col:rook')).toEqual(["najdorf", "and", "not", "pawn", "col", "rook"]);
    expect(libraryTokens("Grünfeld")).toEqual(["grunfeld"]);
    expect(() => library.search({ text: 'NEAR("a" "b") ^ * :' })).not.toThrow();
  });

  it("lists every registry once per id, official material first, openings grouped by name", () => {
    const all = library.search({ text: "" });
    const keys = all.items.map((item) => `${item.kind}:${item.id}`);
    expect(new Set(keys).size).toBe(keys.length);
    expect(all.totals.opening.total).toBe(0);
    expect(all.totals.pack.total).toBe(sources.packs.list().length);
    const najdorf = library.search({ text: "najdorf" });
    const openingTitles = najdorf.items.filter((item) => item.kind === "opening").map((item) => item.title);
    expect(new Set(openingTitles).size).toBe(openingTitles.length);
    expect(najdorf.items.find((item) => item.title === "Sicilian Defense: Najdorf Variation")?.positions).toBe(5);
    expect(najdorf.items.filter((item) => item.kind === "pack").map((item) => item.id)).toEqual(expect.arrayContaining(["anti-sicilian-najdorf-english-attack", "najdorf-english-attack-black"]));
    // Official (and third-party catalogue) rows precede community drafts in the one total order.
    const order = najdorf.items.map((item) => item.disclosure.channel);
    expect(order.lastIndexOf("catalogue")).toBeLessThan(order.indexOf("community"));
  });

  it("puts an official pack ahead of a community draft of the same kind", async () => {
    const shapes = await ShapeRegistry.loadDefault();
    const principles = await PrincipleRegistry.loadDefault();
    const document = (id: string) => JSON.parse(readFileSync(resolvePackPath(id), "utf8"));
    const packs = await PackRegistry.fromDocuments([
      { source: "a", value: document("mate-k-q-technique"), channel: "community" },
      { source: "b", value: document("mate-k-r-technique"), channel: "official" },
    ], { shapes, principles });
    const scoped = new TheoryLibrary({ ...sources, packs });
    const result = scoped.search({ text: "mate", kinds: ["pack"] });
    expect(result.items.map((item) => [item.id, item.disclosure.channel])).toEqual([["mate-k-r-technique", "official"], ["mate-k-q-technique", "community"]]);
  });

  it("filters by phase first and reports shown-of-total denominators", () => {
    const endgames = library.search({ text: "", phase: "endgame" });
    expect(endgames.items.every((item) => item.phases.includes("endgame"))).toBe(true);
    const bounded = library.search({ text: "sicilian", kinds: ["opening"], limit: 3 });
    expect(bounded.items).toHaveLength(3);
    expect(bounded.totals.opening.shown).toBe(3);
    expect(bounded.totals.opening.total).toBeGreaterThan(3);
    for (const kind of LIBRARY_KINDS) expect(bounded.totals[kind].shown).toBeLessThanOrEqual(bounded.totals[kind].total);
    // Deterministic: the same query returns the same bytes.
    expect(JSON.stringify(library.search({ text: "rook" }))).toBe(JSON.stringify(library.search({ text: "rook" })));
  });

  it("an unmatched query is empty, never widened to a near match", () => {
    const result = library.search({ text: "saxophone kubernetes" });
    expect(result.items).toEqual([]);
  });

  it("refuses unbounded input", () => {
    expect(() => library.search({ text: "x".repeat(201) })).toThrow(expect.objectContaining({ code: "INVALID_REQUEST" }));
    expect(() => library.search({ text: "a b c d e f g h i" })).toThrow(expect.objectContaining({ code: "INVALID_REQUEST" }));
    expect(() => library.search({ text: "", limit: LIBRARY_SEARCH_MAX_LIMIT + 1 })).toThrow(expect.objectContaining({ code: "INVALID_REQUEST" }));
  });
});

describe("the /theory family through createApplication", { timeout: 30_000 }, () => {
  let application: ChessTabiyaApplication | undefined;
  let origin = "";

  beforeAll(async () => {
    application = await createInMemoryTestApplication({ engineMode: "mock", cookieSecure: false });
    await new Promise<void>((resolve, reject) => {
      application!.server.once("error", reject);
      application!.server.listen(0, "127.0.0.1", resolve);
    });
    origin = `http://127.0.0.1:${(application.server.address() as AddressInfo).port}`;
  });
  afterAll(async () => { await application?.close(); });

  it("serves search, principle, shape, opening and pack entries", async () => {
    const search = await fetch(`${origin}/theory/search?q=tempo&phase=middlegame&kind=principle,pack`);
    expect(search.status).toBe(200);
    const body = await search.json() as { items: { kind: string; id: string }[]; query: { phase: string; kinds: string[] } };
    expect(body.query).toMatchObject({ phase: "middlegame", kinds: ["pack", "principle"] });
    expect(body.items).toContainEqual(expect.objectContaining({ kind: "principle", id: "tempo-is-the-currency" }));

    const principle = await (await fetch(`${origin}/theory/principles/tempo-is-the-currency`)).json() as { standsOn: string; anchoredPacks: unknown[] };
    expect(principle.standsOn).toBe("authors_practice");
    expect(principle.anchoredPacks.length).toBeGreaterThan(0);
    expect((await fetch(`${origin}/theory/shapes/carlsbad`)).status).toBe(200);
    expect((await fetch(`${origin}/theory/openings/${encodeURIComponent(NAMED_KEY)}`)).status).toBe(200);
    expect((await fetch(`${origin}/theory/packs/lucena-bridge-convert`)).status).toBe(200);
  });

  it("maps refusals to their closed statuses", async () => {
    const missing = await fetch(`${origin}/theory/principles/no-such-principle`);
    expect(missing.status).toBe(404);
    expect(await missing.json()).toMatchObject({ error: { code: "THEORY_ENTRY_NOT_FOUND" } });
    expect((await fetch(`${origin}/theory/shapes/no-such-shape`)).status).toBe(404);
    expect((await fetch(`${origin}/theory/packs/no-such-pack`)).status).toBe(404);
    expect((await fetch(`${origin}/theory/search?phase=late`)).status).toBe(400);
    expect((await fetch(`${origin}/theory/search?kind=passage`)).status).toBe(400);
    expect((await fetch(`${origin}/theory/search?limit=-1`)).status).toBe(400);
    expect((await fetch(`${origin}/theory/search`, { method: "POST" })).status).toBe(405);
    expect((await fetch(`${origin}/theory/unknown`)).status).toBe(404);
  });
});
