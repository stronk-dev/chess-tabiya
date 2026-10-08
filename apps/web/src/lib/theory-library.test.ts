// @vitest-environment happy-dom

import { flushSync, mount, tick, unmount } from "svelte";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { DrillClientApi, DueSchedule } from "./api.js";
import LibraryScreen from "./LibraryScreen.svelte";
import TheoryEntryScreen from "./TheoryEntryScreen.svelte";
import {
  citationAttribution,
  disclosureCopy,
  librarySearchPath,
  parseLibrarySearch,
  parsePrincipleEntry,
  type LibrarySearchQuery,
  type LibrarySearchResult,
} from "./theory-library.js";

const totals = (overrides: Partial<Record<string, { shown: number; total: number }>> = {}) => ({
  pack: { shown: 0, total: 0 }, principle: { shown: 0, total: 0 }, shape: { shown: 0, total: 0 }, concept: { shown: 0, total: 0 }, opening: { shown: 0, total: 0 }, ...overrides,
});

const official = { channel: "official", reviewStatus: "official" } as const;
const draft = { channel: "community", reviewStatus: "draft" } as const;

function searchBody(items: readonly Record<string, unknown>[], text = ""): Record<string, unknown> {
  const counts: Record<string, { shown: number; total: number }> = {};
  for (const item of items) { const kind = String(item.kind); counts[kind] = { shown: (counts[kind]?.shown ?? 0) + 1, total: (counts[kind]?.total ?? 0) + 1 }; }
  return { query: { text, tokens: text === "" ? [] : [text], phase: null, kinds: ["pack", "principle", "shape", "concept", "opening"], limit: 40 }, items, totals: totals(counts) };
}

const packItem = { kind: "pack", id: "lucena-bridge-convert", title: "Lucena: build the bridge and promote", summary: "Promote.", phases: ["endgame"], disclosure: draft, mode: "outcome", packIds: ["lucena-bridge-convert"] };
const principleItem = { kind: "principle", id: "tempo-is-the-currency", title: "Tempo is the currency", summary: "A move spent only reacting…", phases: ["opening", "middlegame", "endgame"], disclosure: official, packIds: ["lucena-bridge-convert"] };

afterEach(() => document.body.replaceChildren());

describe("theory library client contract", () => {
  it("parses a search response strictly and refuses duplicates, open shapes and impossible totals", () => {
    const parsed = parseLibrarySearch(searchBody([packItem, principleItem]));
    expect(parsed.items.map((item) => item.kind)).toEqual(["pack", "principle"]);
    expect(() => parseLibrarySearch(searchBody([packItem, packItem]))).toThrow(/repeats/u);
    expect(() => parseLibrarySearch(searchBody([{ ...packItem, score: 0.9 }]))).toThrow(/invalid shape/u);
    expect(() => parseLibrarySearch({ ...searchBody([packItem]), totals: totals({ pack: { shown: 2, total: 1 } }) })).toThrow(/more than it found/u);
    expect(() => parseLibrarySearch(searchBody([{ ...packItem, disclosure: { channel: "sponsored", reviewStatus: "draft" } }]))).toThrow(/closed vocabulary/u);
  });

  it("builds a literal query path and never sends syntax", () => {
    const query: LibrarySearchQuery = { text: 'rook "AND" *', phase: "endgame", kinds: ["pack", "shape"], limit: 5 };
    expect(librarySearchPath(query)).toBe("/theory/search?q=rook+%22AND%22+*&phase=endgame&kind=pack%2Cshape&limit=5");
  });

  it("discloses origin: official, catalogue, community draft and publication are distinct", () => {
    expect(disclosureCopy(official)).toBe("Official source");
    expect(disclosureCopy(draft)).toBe("Community draft");
    expect(disclosureCopy({ channel: "community", reviewStatus: "published", publisherHandle: "ana" })).toBe("Community publication · @ana");
    expect(disclosureCopy({ channel: "catalogue", reviewStatus: "third_party" })).toContain("CC0");
    // The legacy reviewStatus field does not certify review or override resolving origin.
    expect(disclosureCopy({ channel: "official", reviewStatus: "draft" })).toBe("Official source");
    expect(disclosureCopy({ channel: "community", reviewStatus: "official" })).toBe("Community draft");
  });

  it("parses a cited principle and renders attribution with the quotation, never a bare quote", () => {
    const view = parsePrincipleEntry({
      id: "p", version: "0.1.0", digest: `sha256:${"a".repeat(64)}`, name: "P", statement: "S", counterCase: "C", phases: ["endgame"], standsOn: "cited_source", licence: "CC-BY-SA-4.0",
      citations: [{ sourceId: "wikibooks-rookpawn", title: "Wikibooks: Rook and Pawn Endings", sectionRef: "Lucena", quotedText: "build a bridge", revision: "2064888", revisionUrl: "https://en.wikibooks.org/w/index.php?title=X&oldid=2064888", canonicalUrl: "https://en.wikibooks.org/wiki/X", publisher: "Wikibooks", authors: ["Wikibooks contributors"], licence: { id: "CC-BY-SA-4.0", name: "Creative Commons Attribution-ShareAlike 4.0", url: "https://creativecommons.org/licenses/by-sa/4.0/" }, attributionText: "\"X\" by Wikibooks contributors.", modified: false, proof: "source_unavailable", citableText: {} }],
      sourceNotes: [], disclosure: official, anchoredPacks: [], applicability: {},
    });
    expect(citationAttribution(view.citations[0]!)).toBe("\"X\" by Wikibooks contributors. Revision 2064888. Creative Commons Attribution-ShareAlike 4.0. Quoted verbatim.");
  });
});

describe("LibraryScreen", () => {
  function fakeApi(search: (query: LibrarySearchQuery) => Promise<LibrarySearchResult>): DrillClientApi {
    return { librarySearch: search } as unknown as DrillClientApi;
  }

  it("is phase-first, groups by kind, discloses drafts, and routes rehearse / understand / return", async () => {
    const queries: LibrarySearchQuery[] = [];
    const rehearsed: string[] = [];
    const navigated: string[] = [];
    const started: string[] = [];
    const due = { id: "due-1", sessionKind: "pack", packId: "lucena-bridge-convert", kind: "blocked", variant: null, dueAt: "2026-09-24T00:00:00.000Z", sourceRunId: "run-1", frequency: null, standing: "new" } as DueSchedule;
    const target = document.body.appendChild(document.createElement("div"));
    mount(LibraryScreen, {
      target,
      props: {
        api: fakeApi(async (query) => { queries.push(query); return parseLibrarySearch(searchBody([packItem, principleItem], query.text)); }),
        dueSchedules: [due],
        onNavigate: (path: string) => navigated.push(path),
        onRehearse: (packId: string) => { rehearsed.push(packId); },
        onStartDue: (schedule: DueSchedule) => { started.push(schedule.id); },
      },
    });
    await vi.waitFor(() => expect(document.querySelectorAll(".item")).toHaveLength(2));
    const controls = document.querySelector(".controls")!;
    expect(controls.firstElementChild?.getAttribute("aria-label")).toBe("Chess phase");
    expect([...document.querySelectorAll(".group h2")].map((heading) => heading.textContent)).toEqual(["Rehearsal packs", "Principles"]);
    expect(document.body.textContent).toContain("None of the matching packs comes from the official source.");
    expect(document.querySelector('.item[data-kind="pack"] .origin')?.textContent).toBe("Community draft");
    expect(document.querySelector('.item[data-kind="principle"] .origin')?.textContent).toBe("Official source");
    expect(document.querySelector(".source-notice")?.textContent).toBe("Source labels identify who supplied the material, not whether its chess claims have been reviewed. A licence describes reuse rights, not chess accuracy.");

    document.querySelector<HTMLButtonElement>('button[aria-label="Rehearse: Lucena: build the bridge and promote"]')!.click();
    document.querySelector<HTMLAnchorElement>('a[aria-label="Understand: Lucena: build the bridge and promote"]')!.click();
    document.querySelector<HTMLButtonElement>('button[aria-label="Start the due return: Lucena: build the bridge and promote"]')!.click();
    document.querySelector<HTMLAnchorElement>('a[aria-label="Understand: Tempo is the currency"]')!.click();
    expect(rehearsed).toEqual(["lucena-bridge-convert"]);
    expect(started).toEqual(["due-1"]);
    expect(navigated).toEqual(["/play/pack/lucena-bridge-convert", "/library/principle/tempo-is-the-currency"]);

    const endgames = [...document.querySelectorAll<HTMLButtonElement>(".tabs button")].find((button) => button.textContent === "Endgames")!;
    endgames.click();
    flushSync();
    await tick();
    await vi.waitFor(() => expect(queries.at(-1)).toMatchObject({ phase: "endgame" }));
  });

  it("renders an honest empty state and never substitutes a near match", async () => {
    const target = document.body.appendChild(document.createElement("div"));
    mount(LibraryScreen, { target, props: { api: fakeApi(async () => parseLibrarySearch(searchBody([]))), onNavigate: () => {}, onRehearse: () => {} } });
    await vi.waitFor(() => expect(document.body.textContent).toContain("Nothing in the library matches that."));
    expect(document.body.textContent).toContain("The library never substitutes a near match.");
  });

  it("does not infer global graduation or draft status from a filtered community publication", async () => {
    const published = { ...packItem, disclosure: { channel: "community", reviewStatus: "published", publisherHandle: "ana" } };
    const installed = { ...packItem, id: "installed-pack", title: "Installed pack", disclosure: official };
    const component = mount(LibraryScreen, { target: document.body, props: { api: fakeApi(async query => parseLibrarySearch(searchBody(query.text === "" ? [installed, published] : [published], query.text))), onNavigate: () => {}, onRehearse: () => {} } });
    await vi.waitFor(() => expect(document.querySelectorAll(".item")).toHaveLength(2));
    expect(document.querySelectorAll(".item .origin")[0]?.textContent).toBe("Official source");
    const search = document.querySelector<HTMLInputElement>('input[type="search"]')!;
    search.value = "community";
    search.dispatchEvent(new Event("input", { bubbles: true }));
    await vi.waitFor(() => expect(document.querySelectorAll(".item")).toHaveLength(1));
    expect(document.querySelector(".item .origin")?.textContent).toBe("Community publication · @ana");
    expect(document.body.textContent).toContain("None of the matching packs comes from the official source.");
    expect(document.body.textContent).not.toMatch(/has graduated|Every pack below is a community draft|not yet reviewed/u);
    await unmount(component);
  });
});

describe("Library entry source disclosure", () => {
  const notice = "Source labels identify who supplied the material, not whether its chess claims have been reviewed. A licence describes reuse rights, not chess accuracy.";
  const note = "Fixture author's note: this text has no external chess-source review.";
  const common = { id: "entry", name: "Fixture entry", version: "1", digest: "digest", phases: ["endgame"], licence: "CC-BY-SA-4.0", disclosure: official, sourceNotes: [note] };
  it.each([
    { name: "shape-entry", shapeId: "entry", apiMethod: "shapeEntry", view: { ...common, plans: [{ id: "plan", side: "white", label: "Authored plan", description: "Fixture plan text." }], watch: [], typicalMistakes: [], packs: [] } },
    { name: "principle-entry", principleId: "entry", apiMethod: "principleEntry", view: { ...common, statement: "Fixture statement.", counterCase: "Fixture counter-case.", standsOn: "authors_practice", citations: [], anchoredPacks: [] } },
    { name: "pack", packId: "entry", apiMethod: "packEntry", view: { pack: { id: "entry", title: "Fixture pack", phase: "endgame", objectiveSummary: "Fixture objective." }, disclosure: official, shapes: [], principles: [], concepts: [] } },
    { name: "opening-entry", positionKey: "entry", apiMethod: "openingEntry", view: { disclosure: { channel: "catalogue", reviewStatus: "third_party" }, source: { name: "Lichess", licence: "CC0", commit: "fixture", url: "https://example.org/fixture" }, endpoint: { eco: "A00", name: "Fixture opening" }, samePositions: [], packs: [] } },
  ] as const)("keeps origin separate from chess review on $name", async ({ apiMethod, view, ...route }) => {
    const component = mount(TheoryEntryScreen, { target: document.body, props: { api: { [apiMethod]: async () => view } as unknown as DrillClientApi, route, onNavigate: vi.fn(), onRehearse: vi.fn() } });
    try {
      await vi.waitFor(() => expect(document.querySelector(".origin-line")).not.toBeNull());
      expect(document.querySelector(".source-notice")?.textContent).toBe(notice);
      expect(document.querySelector(".origin-line")?.textContent).toContain(route.name === "opening-entry" ? "Opening catalogue" : "Official source");
      if (route.name === "shape-entry" || route.name === "principle-entry") expect(document.body.textContent).toContain(note);
      expect(document.querySelector(".origin-line")?.textContent).not.toMatch(/reviewed|approved|graduated/iu);
    } finally { await unmount(component); }
  });
});
