// @vitest-environment happy-dom

import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

import { REVIEW_MAP_TEMPLATES, judgementWordsOutsideGrounding, reviewMapProjection, reviewText, storyMoments, type ReviewMapProjection } from "@chess-tabiya/runtime";
import { mount, tick, unmount } from "svelte";
import { afterEach, describe, expect, it, vi } from "vitest";

import { reviewFixtureRun } from "../../../../packages/runtime/src/testing/review-map-fixture.js";
import type { ReviewMap } from "./api.js";
import ReviewMapScreen from "./ReviewMapScreen.svelte";
import { assertReviewMapResponse, isGroundedGradeSentence } from "./review-response.js";
import { storyCardDocument } from "./story-card.js";

const ROOT = `${process.cwd()}/`;
afterEach(() => document.body.replaceChildren());

function payload(options: { readonly mayWrite?: boolean; readonly evaluated?: (index: number) => boolean; readonly noMoments?: boolean; readonly plies?: number } = {}): ReviewMap {
  const run = reviewFixtureRun({ id: "web-review", ...(options.evaluated === undefined ? {} : { evaluated: options.evaluated }), ...(options.plies === undefined ? {} : { plies: options.plies }) });
  const branchId = run.activeCursor.branchId;
  const story = options.noMoments === true ? { moments: [], rank: [] } : storyMoments(run, branchId, { recordedResult: "1-0" });
  const projection: ReviewMapProjection = reviewMapProjection({ run, branchId, story, context: "imported_analysis" });
  // A JSON round trip: the component renders exactly what crosses the wire.
  return JSON.parse(JSON.stringify({
    runId: run.id, branchId, side: "white", ready: true, pendingEvidence: 0,
    source: { kind: "pgn_paste", headers: { White: "Alice", Black: "Bob" }, result: "1-0", importedAt: "2026-09-24T12:00:00.000Z" },
    outcome: { kind: "recorded_result", result: "1-0" }, storyTitle: "Won at move 12",
    viewer: { mayWrite: options.mayWrite ?? true }, semanticPath: { kind: "available", events: 0 },
    ...projection,
  })) as ReviewMap;
}

function render(review: ReviewMap, onRetry: (entryNodeId: string) => Promise<void> = vi.fn(async () => {})) {
  assertReviewMapResponse(review, { runId: review.runId });
  return mount(ReviewMapScreen, { target: document.body, props: { review, onRetry, onExport: vi.fn() } });
}

/** Every text-bearing leaf the learner can read, one per element, so sentence spans stay intact. */
function renderedTexts(): readonly string[] {
  return [...document.querySelectorAll<HTMLElement>("main p, main h1, main h2, main h3, main button, main span, main a")]
    .filter((element) => element.children.length === 0 || element.tagName === "P")
    .map((element) => element.textContent!.trim())
    .filter((text) => text !== "");
}

function files(directory: string): string[] {
  const out: string[] = [];
  const walk = (path: string): void => {
    for (const entry of readdirSync(path)) {
      if (entry === "node_modules" || entry === "dist" || entry.startsWith(".")) continue;
      const full = join(path, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.(?:ts|svelte)$/u.test(entry)) out.push(full);
    }
  };
  walk(directory);
  return out;
}

describe("Review Map screen (rfc/review-map.md)", () => {
  it("[criterion 1] renders a row for every ply, far beyond any moment cap", async () => {
    const review = payload();
    const component = render(review);
    const rows = [...document.querySelectorAll<HTMLElement>(".move-row")];
    expect(rows.length).toBe(review.rows.length);
    expect(rows.length).toBeGreaterThan(32);
    expect(rows.map((row) => row.dataset.nodeId)).toEqual(review.rows.map((row) => row.nodeId));
    expect(rows[0]!.querySelector(".move-label")!.textContent).toBe(review.rows[0]!.label);
    expect(rows.map((row) => row.dataset.side)).toEqual(review.rows.map((row) => row.side));
    await unmount(component);
  });

  it("[criteria 2, 3] renders a chip only for emitted grades, and only as the full grounding sentence", async () => {
    const review = payload();
    const component = render(review);
    const graded = review.rows.filter((row) => row.grade !== undefined);
    const chips = [...document.querySelectorAll<HTMLElement>(".grade-chip")];
    expect(graded.length).toBeGreaterThan(0);
    expect(chips.length).toBe(graded.length);
    expect(chips.length).toBeLessThan(review.rows.length / 2);
    chips.forEach((chip, index) => {
      expect(chip.textContent).toBe(graded[index]!.grade!.sentence);
      expect(isGroundedGradeSentence(graded[index]!.grade!.klass, chip.textContent!)).toBe(true);
    });
    const grounding = [...graded.map((row) => row.grade!.sentence), ...review.rows.flatMap((row) => row.facts), ...review.moments.flatMap((moment) => moment.sentences)];
    expect(judgementWordsOutsideGrounding(grounding, renderedTexts().join("\n"))).toEqual([]);
    // F-COR-1 red against a word-only renderer: strip the operands from one chip and the check fails.
    const word = graded[0]!.grade!.sentence.split(" ")[0]!;
    chips[0]!.textContent = word;
    expect(isGroundedGradeSentence(graded[0]!.grade!.klass, word)).toBe(false);
    expect(judgementWordsOutsideGrounding(grounding, renderedTexts().join("\n"))).toEqual([word.toLowerCase()]);
    expect(() => assertReviewMapResponse({ ...review, rows: review.rows.map((row, index) => index === review.rows.indexOf(graded[0]!) ? { ...row, grade: { klass: row.grade!.klass, sentence: word } } : row) }, { runId: review.runId })).toThrow(/grounded sentence/u);
    await unmount(component);
  });

  it("[criterion 4] offers an enabled Retry on every row and every moment card, each forking from its entry node", async () => {
    const review = payload();
    const onRetry = vi.fn(async (_entry: string) => {});
    const component = render(review, onRetry);
    const rowButtons = [...document.querySelectorAll<HTMLButtonElement>(".move-row button.retry")];
    const momentButtons = [...document.querySelectorAll<HTMLButtonElement>(".moment-card button.retry")];
    expect(rowButtons).toHaveLength(review.rows.length);
    expect(momentButtons).toHaveLength(review.moments.length);
    expect(review.moments.length).toBeGreaterThan(0);
    for (const button of [...rowButtons, ...momentButtons]) {
      expect(button.disabled).toBe(false);
      expect(button.textContent).toBe(reviewText("retry.action"));
    }
    rowButtons[7]!.click();
    await tick();
    await Promise.resolve();
    expect(onRetry).toHaveBeenLastCalledWith(review.rows[7]!.entryNodeId);
    expect(review.rows[7]!.entryNodeId).toBe(review.rows[6]!.nodeId);
    await vi.waitFor(() => expect(document.querySelector<HTMLButtonElement>(".moment-card button.retry")!.disabled).toBe(false));
    momentButtons[0]!.click();
    await tick();
    expect(onRetry).toHaveBeenLastCalledWith(review.moments[0]!.entryNodeId);
    await unmount(component);
  });

  it("[criterion 5] renders retry as unavailable with its reason on a device or account that cannot write, and never throws", async () => {
    const readOnly = render(payload({ mayWrite: false }));
    const reason = document.querySelector<HTMLElement>("#review-retry-unavailable")!;
    expect(reason.textContent).toBe(reviewText("retry.unavailable.read_only"));
    for (const button of document.querySelectorAll<HTMLButtonElement>("button.retry")) {
      expect(button.disabled).toBe(true);
      expect(button.getAttribute("aria-describedby")).toBe("review-retry-unavailable");
    }
    await unmount(readOnly);

    const unhandled = vi.fn();
    window.addEventListener("unhandledrejection", unhandled);
    const held = render(payload(), vi.fn(async () => { throw Object.assign(new Error("held"), { code: "BOARD_HELD" }); }));
    document.querySelector<HTMLButtonElement>(".move-row button.retry")!.click();
    await vi.waitFor(() => expect(document.querySelector(".retry-error")?.textContent).toBe(reviewText("retry.failed.board_held")));
    await unmount(held);
    const denied = render(payload(), vi.fn(async () => { throw Object.assign(new Error("no"), { code: "FORBIDDEN" }); }));
    document.querySelector<HTMLButtonElement>(".moment-card button.retry")!.click();
    await vi.waitFor(() => expect(document.querySelector("#review-retry-unavailable")?.textContent).toBe(reviewText("retry.failed.forbidden")));
    expect([...document.querySelectorAll<HTMLButtonElement>("button.retry")].every((button) => button.disabled)).toBe(true);
    window.removeEventListener("unhandledrejection", unhandled);
    expect(unhandled).not.toHaveBeenCalled();
    await unmount(denied);
  });

  it("[criterion 6] shows the accuracy abstention with its coverage fraction when evaluations are partial", async () => {
    const full = render(payload());
    expect(document.querySelector("[data-accuracy]")!.textContent).toMatch(/^White: \d+\.\d% under grade-convention@1 — 100 minus the mean win-point drop across all \d+ of White's evaluated decisions/u);
    await unmount(full);
    const partial = render(payload({ evaluated: (index) => index < 10 }));
    const texts = [...document.querySelectorAll("[data-accuracy]")].map((element) => element.textContent);
    expect(texts[0]).toMatch(/^White: no accuracy figure\. 5 of \d+ of White's decisions have paired recorded evaluations/u);
    expect(texts.join(" ")).not.toMatch(/\d% under/u);
    await unmount(partial);
  });

  it("[criterion 8] builds the share card from the same moment ids, in the same order, as the private map", async () => {
    const review = payload();
    const component = render(review);
    const privateIds = [...document.querySelectorAll<HTMLElement>(".moment-card")].map((card) => card.dataset.momentId);
    expect(privateIds).toEqual(review.moments.map((moment) => moment.nodeId));
    expect(storyCardDocument(review.storyTitle, review.moments).momentIds).toEqual(privateIds);
    await unmount(component);
  });

  it("[criterion 9] resolves every authored string to the frozen template table, by set-equality over the rendered components", () => {
    const sources = {
      screen: readFileSync(resolve(ROOT, "apps/web/src/lib/ReviewMapScreen.svelte"), "utf8"),
      projection: readFileSync(resolve(ROOT, "packages/runtime/src/review-map.ts"), "utf8"),
      card: readFileSync(resolve(ROOT, "apps/web/src/lib/story-card.ts"), "utf8"),
      publicPage: readFileSync(resolve(ROOT, "apps/server/src/rest.ts"), "utf8"),
    };
    const keys = new Set(Object.keys(REVIEW_MAP_TEMPLATES));
    const referenced = new Set<string>();
    for (const [name, source] of Object.entries(sources)) {
      for (const match of source.matchAll(/reviewText\(\s*"([^"]+)"/gu)) {
        expect(keys.has(match[1]!), `${name} references unregistered template ${match[1]}`).toBe(true);
        referenced.add(match[1]!);
      }
      // Ids passed by name (typed unions, lookup tables) are string literals equal to a key.
      for (const match of source.matchAll(/"([a-z_]+(?:\.[a-z_]+)+)"/gu)) if (keys.has(match[1]!)) referenced.add(match[1]!);
    }
    expect([...referenced].sort()).toEqual([...keys].sort());

    // The markup carries no literal prose: strip `{…}` expressions and tags, and nothing readable remains.
    const markup = sources.screen.slice(sources.screen.indexOf("</script>") + 9, sources.screen.indexOf("<style>"));
    let depth = 0;
    let stripped = "";
    for (const character of markup) {
      if (character === "{") { depth += 1; continue; }
      if (character === "}") { depth -= 1; continue; }
      if (depth === 0) stripped += character;
    }
    const textOnly = stripped.replace(/<[^>]*>/gu, " ");
    expect(textOnly.replace(/\s+/gu, "")).toBe("");
    expect(markup).not.toMatch(/\b(?:aria-label|title|placeholder|alt)="[^{]/u);
  });

  it("[criterion 10] computes the footer from admitted items and carries no fixed provenance literal anywhere in source", async () => {
    const review = payload();
    const component = render(review);
    expect(document.querySelector(".review-footer")!.textContent).toBe(review.footer.sentence);
    expect(review.footer.sentence).toBe(`Sources on this review: ${review.footer.labels.join(" · ")}.`);
    for (const moment of review.moments) {
      const card = document.querySelector<HTMLElement>(`.moment-card[data-moment-id="${moment.nodeId}"]`)!;
      expect(card.querySelector(".provenance")!.textContent).toBe(`Sources: ${moment.sourceLabels.join(" · ")}.`);
    }
    const literal = ["rendered from recorded", "engine evidence"].join(" ");
    const hits = [...files(resolve(ROOT, "apps/")), ...files(resolve(ROOT, "packages/"))]
      .filter((file) => !file.endsWith(".test.ts") && readFileSync(file, "utf8").includes(literal));
    expect(hits).toEqual([]);
    await unmount(component);
  });

  it("[criterion 11] renders abstention as stated sentences, never an empty region", async () => {
    const component = render(payload({ noMoments: true, evaluated: () => false, plies: 12 }));
    expect(document.querySelector(".moments p")!.textContent).toBe(reviewText("moments.none"));
    expect(document.querySelectorAll(".moment-card")).toHaveLength(0);
    expect(document.querySelector(".coverage")!.textContent).toBe("Evaluation coverage: 0 of 13 positions on this line carry a recorded engine evaluation.");
    expect([...document.querySelectorAll("[data-accuracy]")].map((element) => element.textContent)).toEqual([
      "White: no accuracy figure. 0 of 6 of White's decisions have paired recorded evaluations; the figure renders only when all of them do.",
      "Black: no accuracy figure. 0 of 6 of Black's decisions have paired recorded evaluations; the figure renders only when all of them do.",
    ]);
    const evidence = [...document.querySelectorAll(".evidence p")].map((element) => element.textContent);
    expect(evidence).toContain(reviewText("evidence.eval.missing"));
    expect(evidence).toContain(reviewText("evidence.packet.abstained"));
    for (const region of document.querySelectorAll("section")) expect(region.textContent!.trim()).not.toBe("");
    await unmount(component);
  });

  it("[criterion 12] renders no move recommendation, principal variation, praise or Analyze door in the ordinary map", async () => {
    const component = render(payload());
    const text = renderedTexts().join("\n");
    expect(text).not.toMatch(/\bbest\b|principal variation|\bPV\b|should|brilliant|excellent|great move|good move|Analy[sz]e/iu);
    expect(document.body.innerHTML).not.toMatch(/bestMove|bestline/iu);
    await unmount(component);
  });

  it("[criterion 13] adds no composition state: the closed sixteen-state list is byte-unchanged and the screen is not a play-column panel", () => {
    const rfc = readFileSync(resolve(ROOT, "rfc/play-composition.md"), "utf8");
    const start = rfc.indexOf("### §6 — The composition-state vocabulary");
    const section = rfc.slice(start, rfc.indexOf("\n### ", start + 10));
    const rows = section.split("\n").filter((line) => /^\| *\d+ \|/u.test(line));
    expect(rows.map((row) => Number(/^\| *(\d+) \|/u.exec(row)![1]))).toEqual(Array.from({ length: 16 }, (_, index) => index + 1));
    expect(createHash("sha256").update(rows.join("\n")).digest("hex")).toBe("c70b19666af161e3dcfb461fd4bafe3362f95c1c4db086336dfdaf6df0c9dca5");
    const importers = files(resolve(ROOT, "apps/web/src/")).filter((file) => !file.endsWith(".test.ts") && readFileSync(file, "utf8").includes("ReviewMapScreen.svelte"));
    expect(importers.map((file) => file.slice(ROOT.length))).toEqual(["apps/web/src/App.svelte"]);
  });

  it("navigates every ply from the list and the step controls without leaving the surface", async () => {
    const review = payload();
    const component = render(review);
    const buttons = [...document.querySelectorAll<HTMLButtonElement>(".move-select")];
    buttons[3]!.click();
    await tick();
    expect(document.querySelector(".move-row.selected")!.getAttribute("data-node-id")).toBe(review.rows[3]!.nodeId);
    [...document.querySelectorAll<HTMLButtonElement>(".nav button")][1]!.click();
    await tick();
    expect(document.querySelector(".move-row.selected")!.getAttribute("data-node-id")).toBe(review.rows[4]!.nodeId);
    expect(document.querySelector(".stage .eyebrow")!.textContent).toBe(reviewText("board.after", { move: review.rows[4]!.label }));
    expect([...document.querySelectorAll(".evidence p")].map((element) => element.textContent)).toEqual(review.rows[4]!.facts);
    await unmount(component);
  });
});
