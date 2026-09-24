// @vitest-environment happy-dom
// rfc/concept-registry.md — the web consumers: the strict catalogue parser (consumer 6), the
// cross-pack `same_concept` relation with the retired token rejected (criterion 8), and the Pack
// Studio concept picker (criterion 9): registry-only, searchable, keyboard-operable, retired shown.
import { mount, tick } from "svelte";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DrillApi, type ConceptCatalogueView } from "./api.js";
import PackVocabularyEditor from "./PackVocabularyEditor.svelte";
import { parseRelatedProgress } from "./progress-response.js";

afterEach(() => { document.body.replaceChildren(); vi.unstubAllGlobals(); });

const DIGEST = `sha256:${"a".repeat(64)}`;
const CATALOGUE: ConceptCatalogueView = Object.freeze({
  schemaVersion: 1,
  registryDigest: DIGEST as `sha256:${string}`,
  entries: Object.freeze([
    { id: "break-timing", label: "Break timing", status: "active" as const },
    { id: "direct-opposition", label: "Direct opposition", status: "active" as const },
    { id: "outside-passer", label: "Outside passer", status: "retired" as const },
  ]),
});
const concept = { id: "break-timing", label: "Break timing", status: "active", registryDigest: DIGEST, revision: "resolved" };

describe("criterion 8 — same_concept replaces same_concept_in_pack on the client", () => {
  it("parses a cross-pack same_concept row with its registry label", () => {
    expect(parseRelatedProgress({ related: [{ relation: "same_concept", runId: "other", branchId: "main", attemptCount: 2, concept }] }, "run")).toEqual([
      { relation: "same_concept", runId: "other", branchId: "main", attemptCount: 2, concept },
    ]);
    const unavailable = { ...concept, status: "unverified", revision: "registry_revision_unavailable" };
    expect(parseRelatedProgress({ related: [{ relation: "same_concept", runId: "other", branchId: "main", attemptCount: 1, concept: unavailable }] }, "run")[0]!.concept).toEqual(unavailable);
  });

  it("rejects the retired pack-scoped token, a missing concept and a concept on another relation", () => {
    expect(() => parseRelatedProgress({ related: [{ relation: "same_concept_in_pack", runId: "other", branchId: "main", attemptCount: 1 }] }, "run")).toThrow();
    expect(() => parseRelatedProgress({ related: [{ relation: "same_concept", runId: "other", branchId: "main", attemptCount: 1 }] }, "run")).toThrow();
    expect(() => parseRelatedProgress({ related: [{ relation: "same_pack", runId: "other", branchId: "main", attemptCount: 1, concept }] }, "run")).toThrow();
    expect(() => parseRelatedProgress({ related: [{ relation: "same_concept", runId: "other", branchId: "main", attemptCount: 1, concept: { ...concept, status: "unverified" } }] }, "run")).toThrow();
  });
});

describe("consumer 6 — the catalogue arrives only through the strict parser", () => {
  it("parses GET /packs/concepts and refuses a malformed projection", async () => {
    const respond = (body: unknown) => vi.fn(async () => new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", respond({ concepts: CATALOGUE }));
    expect(await new DrillApi("").conceptCatalogue()).toEqual(CATALOGUE);
    vi.stubGlobal("fetch", respond({ concepts: { ...CATALOGUE, entries: [{ id: "Not A Slug", label: "x", status: "active" }] } }));
    await expect(new DrillApi("").conceptCatalogue()).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
    vi.stubGlobal("fetch", respond({ concepts: CATALOGUE, extra: true }));
    await expect(new DrillApi("").conceptCatalogue()).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
  });
});

describe("criterion 9 — the Pack Studio concept picker", () => {
  async function render(document: Record<string, unknown>, catalogue: "present" | "absent" = "present") {
    const concepts = catalogue === "present" ? CATALOGUE : undefined;
    const target = globalThis.document.createElement("div");
    globalThis.document.body.append(target);
    const changes: string[] = [];
    mount(PackVocabularyEditor, { target, props: { documentJson: JSON.stringify(document), shapes: [], principles: [], concepts, onDocumentJson: (json: string) => changes.push(json) } });
    await tick();
    return { target, changes };
  }

  it("offers only active registry entries with label and id, searchable, as native checkboxes in a labelled group", async () => {
    const { target, changes } = await render({ id: "draft", concepts: ["break-timing"] });
    const group = target.querySelector("[role='group'][aria-label='Registered concepts']")!;
    const choices = [...group.querySelectorAll("label")].map((label) => label.textContent?.replace(/\s+/gu, " ").trim());
    expect(choices).toEqual(["Break timing break-timing", "Direct opposition direct-opposition"]);
    const boxes = [...group.querySelectorAll<HTMLInputElement>("input[type='checkbox']")];
    expect(boxes.map((box) => box.checked)).toEqual([true, false]);
    // No free-text concept entry exists: the only text input is the search field.
    const texts = [...target.querySelectorAll<HTMLInputElement>("input:not([type='checkbox'])")];
    expect(texts.map((input) => input.type)).toEqual(["search"]);
    expect(target.querySelector("label.concept-search")?.textContent).toMatch(/Find a concept/u);
    boxes[1]!.click();
    expect(JSON.parse(changes.at(-1)!).concepts).toEqual(["break-timing", "direct-opposition"]);
    const search = texts[0]!;
    search.value = "oppo";
    search.dispatchEvent(new Event("input", { bubbles: true }));
    await tick();
    expect([...group.querySelectorAll("label")].map((label) => label.textContent?.trim().split(/\s+/u)[0])).toEqual(["Direct"]);
    search.value = "no such idea";
    search.dispatchEvent(new Event("input", { bubbles: true }));
    await tick();
    expect(group.textContent).toMatch(/No registered concept matches/u);
  });

  it("shows a selected retired or unregistered id only for removal, and abstains when the registry is unavailable", async () => {
    const { target, changes } = await render({ id: "draft", concepts: ["outside-passer", "typed-by-hand"] });
    const held = [...target.querySelectorAll(".held-concepts li")].map((item) => item.textContent?.replace(/\s+/gu, " ").trim());
    expect(held).toEqual(["Outside passer outside-passer · retiredRemove", "typed-by-hand typed-by-hand · not in the registryRemove"]);
    expect([...target.querySelectorAll("[role='group'] input")].some((input) => (input.parentElement?.textContent ?? "").includes("outside-passer"))).toBe(false);
    target.querySelector<HTMLButtonElement>(".held-concepts button")!.click();
    expect(JSON.parse(changes.at(-1)!).concepts).toEqual(["typed-by-hand"]);
    const unavailable = await render({ id: "draft" }, "absent");
    expect(unavailable.target.textContent).toMatch(/concept registry is unavailable/u);
  });
});
