import { describe, expect, it } from "vitest";

import { attachEvidence, commitMove, createRun, declareShapeFiringEvidence, evidenceForConsumer, PRIMARY_EVIDENCE_MANIFEST, rankStoryMoments, renderReviewStoryEvidence, renderSerializedReviewStoryEvidence, renderStoryEvaluationTrajectory, storyDeclaredEvidence, storyEvidenceSourceLabels, storyEvaluation, storyMoments, suggestTitle, type StoryMoment, type StoryMomentKind } from "./index.js";

if (false) {
  // @ts-expect-error review story rendering consumes only a compiled evidence view.
  renderReviewStoryEvidence([]);
}

const at = "2026-08-14T14:00:00.000Z";
const digest = `sha256:${"d".repeat(64)}`;
const config = { seedMode: "fixed" as const, locus: { executedAt: "server" as const, engineIds: [], modelIds: [] } };

function imported(fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1") {
  return createRun({ id: "story", session: { kind: "imported", start: { fen, side: "white" }, movetextDigest: digest, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } }, sessionDigest: digest, policyConfig: config, seed: 1, createdAt: at });
}

describe("grounded game story", () => {
  it("derives learner-relative evaluation pivots and recorded-result moments", () => {
    let run = commitMove(imported(), "e2e4", { actor: "user", at }).run;
    run = commitMove(run, "e7e5", { actor: "system", at }).run;
    const path = run.nodes;
    run = attachEvidence(run, path[0]!.id, ["engine:a"], { kind: "eval", source: "engine_validated", values: { centipawns: 0, engineId: "sf", requestedMovetimeMs: 100 } }, at).run;
    run = attachEvidence(run, path[1]!.id, ["engine:b"], { kind: "eval", source: "engine_validated", values: { centipawns: 25, engineId: "sf", requestedMovetimeMs: 100 } }, at).run;
    run = attachEvidence(run, path[2]!.id, ["engine:c"], { kind: "eval", source: "engine_validated", values: { centipawns: 240, engineId: "sf", requestedMovetimeMs: 100 } }, at).run;
    const story = storyMoments(run, run.activeCursor.branchId, { recordedResult: "0-1" });
    const pivot = story.moments.find((moment) => moment.kinds.includes("eval_pivot"));
    expect(pivot?.sentences).toContain("Recorded evaluation change from the learner's side: +2.65 pawns across this move (sf, 100 ms).");
    expect(pivot?.sentences.join(" ")).not.toMatch(/\bcp\b/u);
    expect(renderSerializedReviewStoryEvidence(JSON.parse(JSON.stringify(pivot!.evidence)) as unknown[])).toEqual(pivot!.sentences);
    expect(renderStoryEvaluationTrajectory(pivot!.evalBefore!.centipawns, pivot!.evalAfter!.centipawns)).toBe(
      "Recorded evaluation from the learner's side: −0.25 → +2.40 pawns.",
    );
    expect(story.moments.at(-1)).toMatchObject({ kinds: expect.arrayContaining(["outcome"]), entryNodeId: path[2]!.id });
    expect(storyEvidenceSourceLabels(story.moments.at(-1)!)).toEqual(["Recorded engine analysis", "Recorded game"]);
  });

  it("grounds a board-terminal outcome at the terminal node but enters its playable parent", () => {
    const start = imported("7k/8/5KQ1/8/8/8/8/8 w - - 0 1");
    const run = commitMove(start, "g6g7", { actor: "user", at }).run;
    const outcome = storyMoments(run, run.activeCursor.branchId, { recordedResult: "1-0" }).moments.find((moment) => moment.kinds.includes("outcome"));
    expect(outcome).toMatchObject({ nodeId: run.activeCursor.nodeId, entryNodeId: start.activeCursor.nodeId });
  });

  it("composes deterministic titles only from story facts", () => {
    const run = commitMove(imported("7k/8/5KQ1/8/8/8/8/8 w - - 0 1"), "g6g7", { actor: "user", at }).run;
    const projection = storyMoments(run, run.activeCursor.branchId, { recordedResult: "1-0" });
    const input = { side: run.start.side, outcome: { kind: "board_terminal" as const, result: "win" as const }, ...projection };
    expect(suggestTitle(input)).toBe(suggestTitle(structuredClone(input)));
    expect(suggestTitle(input)).toMatch(/Won/);
    expect(storyDeclaredEvidence(input)[0]!.projection.id).toBe("derived.story.title");
  });

  it("renders imported result tags from the learner's side", () => {
    const base = { moments: [], rank: [], outcome: { kind: "recorded_result" as const, result: "1-0" as const } };
    expect(suggestTitle({ ...base, side: "white" })).toBe("Won at the finish");
    expect(suggestTitle({ ...base, side: "black" })).toBe("The turning point at the finish");
    const declaration = PRIMARY_EVIDENCE_MANIFEST.projections.find((projection) => projection.id === "derived.story.title" && projection.version === 1);
    expect(declaration?.semantics).toContain("learner-relative");
    expect(declaration?.semantics).not.toContain("White-relative");
  });

  it("renders shape firings as learner labels without exposing catalogue keys", () => {
    const declared = declareShapeFiringEvidence(
      [{ id: "carlsbad-minority-attack", trigger: { kind: "feature", feature: { kind: "open_file", file: "a" } } }],
      [{ id: "n1", fen: "rnbqkbnr/1ppppppp/8/8/8/8/1PPPPPPP/RNBQKBNR w KQkq - 0 1" }],
    );
    const view = evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "review.story", version: 1 }, declared);
    const sentences = renderReviewStoryEvidence(view).items.flatMap((item) => item.sentences);
    expect(sentences).toEqual(["Recognized position pattern: Carlsbad minority attack."]);
    expect(sentences.join(" ")).not.toMatch(/carlsbad-minority-attack|catalogue trigger|\bShape\b/u);
  });

  it("orients a White-perspective Stockfish reading to the learner at a black-to-move node", () => {
    let run = commitMove(imported(), "e2e4", { actor: "user", at }).run;
    const blackToMove = run.nodes.find((node) => node.ply === 1)!;
    run = attachEvidence(run, blackToMove.id, ["engine:w"], { kind: "eval", source: "engine_validated", values: { centipawns: 80, perspective: "white", engineId: "sf", requestedMovetimeMs: 100 } }, at).run;
    // White is the learner and White's side is +0.80: the learner reading must be +80, not -80.
    expect(storyEvaluation(run, blackToMove)?.centipawns).toBe(80);
    let asBlack = commitMove(createRun({ id: "story-black", session: { kind: "imported", start: { fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", side: "black" }, movetextDigest: digest, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } }, sessionDigest: digest, policyConfig: config, seed: 1, createdAt: at }), "e2e4", { actor: "system", at }).run;
    const node = asBlack.nodes.find((candidate) => candidate.ply === 1)!;
    asBlack = attachEvidence(asBlack, node.id, ["engine:b"], { kind: "eval", source: "engine_validated", values: { centipawns: 80, perspective: "white", engineId: "sf", requestedMovetimeMs: 100 } }, at).run;
    expect(storyEvaluation(asBlack, node)?.centipawns).toBe(-80);
  });

  it("selects an irreversibility-only moment after every other story family", () => {
    const moment = (nodeId: string, ply: number, kinds: readonly StoryMomentKind[]): StoryMoment => ({
      nodeId, entryNodeId: nodeId, ply, san: null, fen: "8/8/8/8/8/8/8/8 w - - 0 1",
      kinds, sentences: [], evidence: [], phase: "endgame",
    });
    const moments = [
      moment("irreversible", 1, ["irreversibility"]),
      moment("generic", 2, []),
      moment("shape", 3, ["shape_span"]),
      moment("collapse", 4, ["option_collapse"]),
      moment("outcome-and-irreversible", 5, ["irreversibility", "outcome"]),
    ];
    expect(rankStoryMoments(moments)).toEqual([
      "outcome-and-irreversible",
      "shape",
      "generic",
      "collapse",
      "irreversible",
    ]);
  });
});
