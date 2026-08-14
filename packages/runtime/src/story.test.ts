import { describe, expect, it } from "vitest";

import { attachEvidence, commitMove, createRun, storyMoments, suggestTitle } from "./index.js";

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
    expect(story.moments.some((moment) => moment.kinds.includes("eval_pivot") && moment.sentences.some((sentence) => sentence.includes("+265 cp")))).toBe(true);
    expect(story.moments.at(-1)).toMatchObject({ kinds: expect.arrayContaining(["outcome"]), entryNodeId: path[2]!.id });
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
    const input = { outcome: { kind: "board_terminal" as const, result: "win" as const }, ...projection };
    expect(suggestTitle(input)).toBe(suggestTitle(structuredClone(input)));
    expect(suggestTitle(input)).toMatch(/Won/);
  });
});
