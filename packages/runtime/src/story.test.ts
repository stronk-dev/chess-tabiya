import { describe, expect, it } from "vitest";

import { commitMove, createRun, declareShapeFiringEvidence, evidenceForConsumer, presentedSentence, PRIMARY_EVIDENCE_MANIFEST, rankStoryMoments, renderReviewStoryComponents, storyDeclaredEvidence, storyEvidenceSourceLabels, storyMomentsForRun, suggestTitle, type StoryMoment, type StoryMomentKind } from "./index.js";
import { attachDelivery, evaluationDelivery } from "./testing/review-evidence-fixture.js";

if (false) {
  // @ts-expect-error review story presentation consumes only a compiled evidence view.
  renderReviewStoryComponents([]);
}

const at = "2026-08-14T14:00:00.000Z";
const digest = `sha256:${"d".repeat(64)}`;
const config = { seedMode: "fixed" as const, locus: { executedAt: "server" as const, engineIds: [], modelIds: [] } };

function imported(fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", side: "white" | "black" = "white") {
  return createRun({ id: `story-${side}`, session: { kind: "imported", start: { fen, side }, movetextDigest: digest, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } }, sessionDigest: digest, policyConfig: config, seed: 1, createdAt: at });
}

describe("grounded game story (typed Review packet)", () => {
  it("derives a cp pivot from typed deliveries and presents it with its convention (D917)", () => {
    let run = commitMove(imported(), "e2e4", { actor: "user", at }).run;
    run = commitMove(run, "e7e5", { actor: "system", at }).run;
    const path = [...run.nodes].sort((left, right) => left.ply - right.ply);
    run = attachDelivery(run, path[0]!.id, evaluationDelivery(path[0]!.fen, "cp 0"));
    run = attachDelivery(run, path[1]!.id, evaluationDelivery(path[1]!.fen, "cp -25"));
    run = attachDelivery(run, path[2]!.id, evaluationDelivery(path[2]!.fen, "cp 240"));
    const story = storyMomentsForRun(run, run.activeCursor.branchId, { recordedResult: "0-1" });
    const pivot = story.moments.find((moment) => moment.kinds.includes("eval_pivot"));
    expect(pivot?.sentences).toContain("Recorded engine evaluation changed by +2.15 pawns from White's side across this move (Stockfish 19, depth 12 search).");
    expect(pivot?.sentences.join(" ")).not.toMatch(/\bcp\b/u);
    expect(pivot?.evaluation).toEqual({ before: { kind: "centipawns", value: 25 }, after: { kind: "centipawns", value: 240 } });
    expect(pivot?.components.map(presentedSentence)).toEqual(pivot?.sentences);
    expect(storyEvidenceSourceLabels(story.moments.at(-1)!)).toContain("Recorded game");
  });

  it("renders shape firings as learner labels without exposing catalogue keys", () => {
    const declared = declareShapeFiringEvidence(
      [{ id: "carlsbad-minority-attack", trigger: { kind: "feature", feature: { kind: "open_file", file: "a" } } }],
      [{ id: "n1", fen: "rnbqkbnr/1ppppppp/8/8/8/8/1PPPPPPP/RNBQKBNR w KQkq - 0 1" }],
    );
    const view = evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "review.story", version: 1 }, declared);
    const sentences = renderReviewStoryComponents(view).map(presentedSentence);
    expect(sentences).toEqual(["Recognized position pattern: Carlsbad minority attack."]);
    expect(sentences.join(" ")).not.toMatch(/carlsbad-minority-attack|catalogue trigger|\bShape\b/u);
  });

  it("grounds a board-terminal outcome at the terminal node and re-enters at its decision parent (D3189)", () => {
    const start = imported("7k/8/5KQ1/8/8/8/8/8 w - - 0 1");
    const run = commitMove(start, "g6g7", { actor: "user", at }).run;
    const outcome = storyMomentsForRun(run, run.activeCursor.branchId, { recordedResult: "1-0" }).moments.find((moment) => moment.kinds.includes("outcome"));
    expect(outcome).toMatchObject({ evidenceNodeId: run.activeCursor.nodeId, decisionNodeId: start.activeCursor.nodeId, stopNodeId: run.activeCursor.nodeId, entryNodeId: start.activeCursor.nodeId });
  });

  it("composes deterministic titles only from story facts", () => {
    const run = commitMove(imported("7k/8/5KQ1/8/8/8/8/8 w - - 0 1"), "g6g7", { actor: "user", at }).run;
    const projection = storyMomentsForRun(run, run.activeCursor.branchId, { recordedResult: "1-0" });
    const input = { side: run.start.side, outcome: { kind: "board_terminal" as const, result: "win" as const }, ...projection };
    expect(suggestTitle(input)).toBe(suggestTitle(structuredClone({ ...input, title: undefined })));
    expect(suggestTitle(input)).toMatch(/Won/);
    expect(projection.title.text).toMatch(/Won/);
    expect(storyDeclaredEvidence(projection)[0]!.projection.id).toBe("derived.story.title");
  });

  it("renders imported result tags from the learner's side", () => {
    const base = { moments: [], rank: [], outcome: { kind: "recorded_result" as const, result: "1-0" as const } };
    expect(suggestTitle({ ...base, side: "white" })).toBe("Won at the finish");
    expect(suggestTitle({ ...base, side: "black" })).toBe("The turning point at the finish");
    const declaration = PRIMARY_EVIDENCE_MANIFEST.projections.find((projection) => projection.id === "derived.story.title" && projection.version === 1);
    expect(declaration?.semantics).toContain("learner-relative");
    expect(declaration?.semantics).not.toContain("White-relative");
  });

  it("orients White-perspective deliveries to a Black learner only at the last-level consumer (D1648)", () => {
    let run = commitMove(imported(undefined, "black"), "e2e4", { actor: "system", at }).run;
    run = commitMove(run, "e7e5", { actor: "user", at }).run;
    const path = [...run.nodes].sort((left, right) => left.ply - right.ply);
    // White to move: +0.80 for White. Black to move: "cp 50" is +0.50 for Black (White −0.50).
    run = attachDelivery(run, path[0]!.id, evaluationDelivery(path[0]!.fen, "cp 80"));
    run = attachDelivery(run, path[1]!.id, evaluationDelivery(path[1]!.fen, "cp 50"));
    run = attachDelivery(run, path[2]!.id, evaluationDelivery(path[2]!.fen, "cp 500"));
    const level = storyMomentsForRun(run, run.activeCursor.branchId, { recordedResult: "1-0" }).moments.find((moment) => moment.kinds.includes("last_level"));
    // Learner Black: White +0.80 is learner −0.80 (within a pawn); White −0.50 is learner +0.50; White +5.00 is learner −5.00.
    expect(level?.evidenceNodeId).toBe(path[1]!.id);
  });

  it("selects an irreversibility-only moment after every other story family", () => {
    const moment = (nodeId: string, ply: number, kinds: readonly StoryMomentKind[]): Pick<StoryMoment, "nodeId" | "ply" | "kinds" | "evaluation"> => ({ nodeId, ply, kinds, evaluation: null });
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
