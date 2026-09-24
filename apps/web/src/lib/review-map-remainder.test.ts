// @vitest-environment happy-dom
// rfc/review-map.md — the remainder on the web surface: the eval graph (§6, [[D880]]), the Compare
// handoff (§4) and the explicit Analyze action (§7, O7.3).

import { attachEvidence, branchPath, commitMove, fork, reviewAnalysis, reviewMapProjection, reviewText, rewind, storyMomentsForRun, type DrillRun } from "@chess-tabiya/runtime";
import { mount, tick, unmount } from "svelte";
import { afterEach, describe, expect, it, vi } from "vitest";

import { REVIEW_FIXTURE_AT, reviewFixtureRun } from "../../../../packages/runtime/src/testing/review-map-fixture.js";
import type { ReviewAnalysisPage, ReviewMap } from "./api.js";
import ReviewMapScreen from "./ReviewMapScreen.svelte";
import { assertReviewAnalysisResponse, assertReviewMapResponse } from "./review-response.js";

afterEach(() => document.body.replaceChildren());

function payloadOf(run: DrillRun, side: "white" | "black" = run.start.side): ReviewMap {
  const branchId = run.branches[0]!.id;
  const projection = reviewMapProjection({ run, branchId, story: storyMomentsForRun(run, branchId, { recordedResult: "1-0" }), context: "imported_analysis", side, viewer: { role: "learner", session: "imported" } });
  return JSON.parse(JSON.stringify({
    runId: run.id, branchId, side, ready: true, pendingEvidence: 0,
    source: { kind: "pgn_paste", headers: { White: "Alice", Black: "Bob" }, result: "1-0", importedAt: "2026-09-24T12:00:00.000Z" },
    outcome: { kind: "recorded_result", result: "1-0" }, storyTitle: "Won at move 12",
    viewer: { mayWrite: true }, semanticPath: { kind: "available", events: 0 },
    ...projection,
  })) as ReviewMap;
}

function retried(run: DrillRun, entryNodeId: string, moves: readonly string[]): DrillRun {
  let next = fork(rewind(run, entryNodeId, REVIEW_FIXTURE_AT).run, entryNodeId, { label: "story-reentry", at: REVIEW_FIXTURE_AT }).run;
  for (const uci of moves) next = commitMove(next, uci, { actor: "user", at: REVIEW_FIXTURE_AT }).run;
  return next;
}

type Props = {
  onRetry?: (entryNodeId: string) => Promise<void>;
  onCompare?: (branchIds: readonly string[]) => Promise<void>;
  onAnalyze?: (nodeId: string) => Promise<ReviewAnalysisPage>;
};
function render(review: ReviewMap, props: Props = {}) {
  assertReviewMapResponse(review, { runId: review.runId });
  return mount(ReviewMapScreen, { target: document.body, props: { review, onRetry: props.onRetry ?? vi.fn(async () => {}), onExport: vi.fn(), onCompare: props.onCompare, onAnalyze: props.onAnalyze } });
}

const points = (): HTMLElement[] => [...document.querySelectorAll<HTMLElement>(".eval-graph .point")];
const selectedRow = (): string | null => document.querySelector(".move-row.selected")!.getAttribute("data-node-id");
const key = (element: Element, value: string): void => { element.dispatchEvent(new KeyboardEvent("keydown", { key: value, bubbles: true })); };

describe("eval graph on the Review Map (§6)", () => {
  it("draws one keyboard stop per ply, one tab stop at a time, and arrow keys select the ply in the move list", async () => {
    const review = payloadOf(reviewFixtureRun({ id: "web-graph", plies: 20 }));
    const component = render(review);
    expect(points()).toHaveLength(review.rows.length);
    expect(points().map((point) => point.dataset.nodeId)).toEqual(review.rows.map((row) => row.nodeId));
    expect(points().filter((point) => point.getAttribute("tabindex") === "0")).toHaveLength(1);
    expect(points().map((point) => point.getAttribute("aria-label"))).toEqual(review.evalGraph.points.map((point) => point.sentence));
    // Start from the first ply so the arrow keys have a following ply whatever moment opens the map.
    document.querySelector<HTMLButtonElement>(".move-select")!.click();
    await vi.waitFor(() => expect(selectedRow()).toBe(review.rows[0]!.nodeId));
    const start = review.rows.findIndex((row) => row.nodeId === selectedRow());
    const focused = points()[start]!;
    expect(focused.getAttribute("tabindex")).toBe("0");
    key(focused, "ArrowRight");
    await vi.waitFor(() => expect(selectedRow()).toBe(review.rows[start + 1]!.nodeId));
    expect(document.activeElement).toBe(points()[start + 1]);
    expect(points()[start + 1]!.getAttribute("aria-pressed")).toBe("true");
    key(points()[start + 1]!, "End");
    await vi.waitFor(() => expect(selectedRow()).toBe(review.rows.at(-1)!.nodeId));
    key(points().at(-1)!, "Home");
    await vi.waitFor(() => expect(selectedRow()).toBe(review.rows[0]!.nodeId));
    points()[7]!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await vi.waitFor(() => expect(selectedRow()).toBe(review.rows[7]!.nodeId));
    // The move list drives the graph too.
    document.querySelectorAll<HTMLButtonElement>(".move-select")[3]!.click();
    await tick();
    expect(points()[3]!.classList.contains("selected")).toBe(true);
    // Text alternative: every point's sentence, in order.
    expect([...document.querySelectorAll(".graph-text li")].map((item) => item.textContent)).toEqual(review.evalGraph.points.map((point) => point.sentence));
    await unmount(component);
  });

  it("abstains per region where evaluations are missing — the native-run case — and states coverage", async () => {
    const review = payloadOf(reviewFixtureRun({ id: "web-graph-native", kind: "position", plies: 20, evaluated: (index) => index <= 6 }));
    const component = render(review);
    expect(document.querySelector(".eval-graph")!.getAttribute("data-graph")).toBe("partial");
    expect(document.querySelector(".graph-coverage")!.textContent).toBe("6 of 20 moves have a recorded evaluation after them.");
    expect(points().filter((point) => point.classList.contains("missing"))).toHaveLength(14);
    expect(document.querySelectorAll(".eval-graph rect.gap")).toHaveLength(1);
    expect([...document.querySelectorAll(".graph-gaps li")].map((item) => item.textContent)).toEqual([reviewText("graph.gap", { from: review.rows[6]!.label, to: review.rows.at(-1)!.label })]);
    // The drawn line never bridges the stretch without evaluations: one segment over plies 1–6.
    const segments = [...document.querySelectorAll(".eval-graph path.series")].map((path) => path.getAttribute("d")!);
    expect(segments).toHaveLength(1);
    expect(segments[0]!.match(/[ML]/gu)).toHaveLength(6);
    await unmount(component);
    const bare = render(payloadOf(reviewFixtureRun({ id: "web-graph-bare", kind: "position", plies: 6, evaluated: () => false })));
    expect(document.querySelector(".eval-graph")!.getAttribute("data-graph")).toBe("abstained");
    expect(document.querySelector("#review-graph-caption")!.textContent).toBe(reviewText("graph.none"));
    expect(document.querySelectorAll(".eval-graph path.series")).toHaveLength(0);
    await unmount(bare);
  });

  it("draws for the learner side: a Black review plots Black's win-points, not White's", async () => {
    const white = payloadOf(reviewFixtureRun({ id: "web-graph-w", plies: 12 }));
    const black = payloadOf(reviewFixtureRun({ id: "web-graph-b", plies: 12, side: "black" }));
    const component = render(black);
    expect(document.querySelector(".eval-graph")!.getAttribute("data-graph-side")).toBe("black");
    expect(document.querySelector("#review-graph-caption")!.textContent).toContain("win-points for Black");
    const cy = (index: number): number => Number(points()[index]!.querySelector("circle")!.getAttribute("cy"));
    black.evalGraph.points.forEach((point, index) => {
      const mirror = white.evalGraph.points[index]!;
      if (point.kind !== "evaluated" || mirror.kind !== "evaluated") throw new Error("fixture is fully evaluated");
      expect(point.percent).toBeCloseTo(100 - mirror.percent, 0);
      expect(cy(index)).toBeCloseTo(5 + (100 - point.percent), 5);
    });
    await unmount(component);
    // The payload check refuses a graph drawn for a side other than the review's.
    expect(() => assertReviewMapResponse({ ...black, evalGraph: { ...black.evalGraph, side: "white" } }, { runId: black.runId })).toThrow(/evalGraph shape/u);
    // …and a point drawn where no evaluation exists.
    const partial = payloadOf(reviewFixtureRun({ id: "web-graph-forged", kind: "position", plies: 8, evaluated: (index) => index <= 3 }));
    const forged = { ...partial, evalGraph: { ...partial.evalGraph, points: partial.evalGraph.points.map((point) => point.kind === "missing" ? { ...point, percent: 50 } : point) } };
    expect(() => assertReviewMapResponse(forged, { runId: partial.runId })).toThrow(/draws without a recorded evaluation/u);
  });
});

describe("Compare handoff on the Review Map (§4)", () => {
  const base = reviewFixtureRun({ id: "web-compare", plies: 16 });
  const entry = branchPath(base, base.branches[0]!.id)[6]!.id;

  it("offers the shipped compare only after a second line carries a move from that position, and hands it the branch ids", async () => {
    const noDoor = render(payloadOf(retried(base, entry, [])), { onCompare: vi.fn(async () => {}) });
    expect(document.querySelectorAll("button.compare")).toHaveLength(0);
    await unmount(noDoor);

    const run = retried(base, entry, ["a2a3"]);
    const review = payloadOf(run);
    const onCompare = vi.fn(async (_ids: readonly string[]) => {});
    const component = render(review, { onCompare });
    const buttons = [...document.querySelectorAll<HTMLButtonElement>(".move-row button.compare")];
    const row = review.rows.find((candidate) => candidate.entryNodeId === entry)!;
    expect(buttons).toHaveLength(1);
    expect(buttons[0]!.closest(".move-row")!.getAttribute("data-node-id")).toBe(row.nodeId);
    expect(buttons[0]!.getAttribute("aria-label")).toBe(reviewText("compare.action.label", { count: 1, number: row.moveNumber, san: row.san }));
    buttons[0]!.click();
    await tick();
    expect(onCompare).toHaveBeenCalledWith([run.branches[0]!.id, run.branches.at(-1)!.id]);
    await unmount(component);

    const failing = render(review, { onCompare: vi.fn(async () => { throw new Error("no"); }) });
    document.querySelector<HTMLButtonElement>("button.compare")!.click();
    await vi.waitFor(() => expect(document.querySelector(".move-row .retry-error")?.textContent).toBe(reviewText("compare.failed")));
    await unmount(failing);
  });

  it("refuses a door that is not the compare's input (reviewed line first, two to eight distinct lines)", () => {
    const review = payloadOf(retried(base, entry, ["a2a3"]));
    const door = review.compareDoors[0]!;
    for (const branchIds of [[door.branchIds[1]!, door.branchIds[0]!], [door.branchIds[0]!], [door.branchIds[0]!, door.branchIds[0]!]]) {
      expect(() => assertReviewMapResponse({ ...review, compareDoors: [{ ...door, branchIds }] }, { runId: review.runId })).toThrow(/compare door/u);
    }
  });
});

describe("Analyze on the Review Map (§7, O7.3)", () => {
  const lined = (): DrillRun => {
    let run = reviewFixtureRun({ id: "web-analyze", plies: 12 });
    const path = branchPath(run, run.branches[0]!.id);
    run = attachEvidence(run, path[2]!.id, ["engine:line"], { kind: "bestline", source: "engine_validated", values: { engineId: "stockfish-test", requestedDepth: 18, movesUci: ["g1f3", "b8c6"] } }, REVIEW_FIXTURE_AT).run;
    return run;
  };
  const answer = (run: DrillRun) => vi.fn(async (nodeId: string): Promise<ReviewAnalysisPage> => {
    const page = { runId: run.id, branchId: run.branches[0]!.id, ...reviewAnalysis(run, run.branches[0]!.id, nodeId, { role: "learner", session: "imported" }) };
    assertReviewAnalysisResponse(page, { runId: run.id, nodeId });
    return page;
  });

  it("is an explicit, secondary action: the line appears only after Analyze and goes when the selection moves", async () => {
    const run = lined();
    const review = payloadOf(run);
    const onAnalyze = answer(run);
    const component = render(review, { onAnalyze });
    const target = review.rows[2]!;
    document.querySelectorAll<HTMLButtonElement>(".move-select")[2]!.click();
    await tick();
    // Ordinary map: the door, but no line, no engine move, no recommendation.
    expect(document.querySelector("main")!.textContent).not.toMatch(/principal variation|2\. Nf3|should|\bbest\b/iu);
    const button = document.querySelector<HTMLButtonElement>(".analysis button.analyze")!;
    expect(button.textContent).toBe(reviewText("analysis.action"));
    expect(button.getAttribute("aria-label")).toBe(reviewText("analysis.action.label", { number: target.moveNumber, san: target.san }));
    button.click();
    await vi.waitFor(() => expect(document.querySelector(".analysis-sentence")?.textContent).toBe(`stockfish-test (depth 18 search) reported this principal variation from the position before ${target.label}: 2. Nf3 Nc6.`));
    expect(onAnalyze).toHaveBeenCalledWith(target.nodeId);
    expect(document.querySelector(".analysis")!.textContent).toContain(reviewText("analysis.caveat"));
    // Selecting another move closes the reveal; it never follows the learner around the map.
    document.querySelectorAll<HTMLButtonElement>(".move-select")[5]!.click();
    await tick();
    expect(document.querySelector(".analysis-sentence")).toBeNull();
    expect(document.querySelector("main")!.textContent).not.toContain("principal variation");
    await unmount(component);
  });

  it("is withheld for the position a retry is open from, and hidden while a retry is being opened", async () => {
    const run = lined();
    const path = branchPath(run, run.branches[0]!.id);
    const open = payloadOf(retried(run, path[2]!.id, []));
    expect(open.openRetryEntryNodeId).toBe(path[2]!.id);
    const onAnalyze = answer(run);
    const withheld = render(open, { onAnalyze });
    document.querySelectorAll<HTMLButtonElement>(".move-select")[2]!.click();
    await tick();
    expect(document.querySelector(".analysis")!.getAttribute("data-analysis")).toBe("withheld");
    expect(document.querySelector(".analysis button.analyze")).toBeNull();
    expect(document.querySelector(".analysis")!.textContent).toContain(reviewText("analysis.withheld", { move: open.rows[2]!.label }));
    // Another position stays analysable.
    document.querySelectorAll<HTMLButtonElement>(".move-select")[4]!.click();
    await tick();
    expect(document.querySelector(".analysis button.analyze")).not.toBeNull();
    await unmount(withheld);

    let release: () => void = () => {};
    const pending = new Promise<void>((resolve) => { release = resolve; });
    const component = render(payloadOf(run), { onAnalyze, onRetry: vi.fn(() => pending) });
    document.querySelectorAll<HTMLButtonElement>(".move-select")[2]!.click();
    await tick();
    document.querySelector<HTMLButtonElement>(".analysis button.analyze")!.click();
    await vi.waitFor(() => expect(document.querySelector(".analysis-sentence")).not.toBeNull());
    document.querySelectorAll<HTMLButtonElement>(".move-row button.retry")[2]!.click();
    await tick();
    expect(document.querySelector(".analysis")).toBeNull();
    expect(document.querySelector("main")!.textContent).not.toContain("principal variation");
    release();
    await unmount(component);
  });

  it("refuses an engine line that is unattributed or phrased as advice, and an ordinary map that carries one", () => {
    const run = lined();
    const nodeId = payloadOf(run).rows[2]!.nodeId;
    const page = { runId: run.id, branchId: run.branches[0]!.id, ...reviewAnalysis(run, run.branches[0]!.id, nodeId, { role: "learner", session: "imported" }) };
    expect(() => assertReviewAnalysisResponse(page, { runId: run.id, nodeId })).not.toThrow();
    expect(() => assertReviewAnalysisResponse({ ...page, bound: {} }, { runId: run.id, nodeId })).toThrow(/attributed/u);
    // The sentence must open with the named engine attribution (a typed line names engine and version).
    expect(() => assertReviewAnalysisResponse({ ...page, engine: "Mock Stockfish mock-1" }, { runId: run.id, nodeId })).toThrow(/attributed/u);
    expect(() => assertReviewAnalysisResponse({ ...page, engine: "Mock Stockfish mock-1", sentence: page.sentence.replace(/^stockfish-test/u, "Mock Stockfish mock-1") }, { runId: run.id, nodeId })).not.toThrow();
    expect(() => assertReviewAnalysisResponse({ ...page, sentence: `stockfish-test (depth 18 search): the best line is ${"3. Nf3"}.` }, { runId: run.id, nodeId })).toThrow(/advice/u);
    const review = payloadOf(run);
    expect(() => assertReviewMapResponse({ ...review, rows: review.rows.map((row, index) => index === 0 ? { ...row, bestMoveUci: "e2e4" } : row) }, { runId: review.runId })).toThrow(/engine line/u);
  });
});
