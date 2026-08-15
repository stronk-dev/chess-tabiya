import { describe, expect, it } from "vitest";

import {
  RuntimeError,
  appendEvents,
  commitMove,
  createRun,
  feedbackDeliveryOpen,
  feedbackDisclosed,
  projectRun,
  rewind,
  type DrillRun,
  type RunFeedbackPolicy,
} from "./index.js";

const at = "2026-08-12T16:00:00.000Z";
const digest = `sha256:${"d".repeat(64)}`;
const mateInOne = "7k/8/5KQ1/8/8/8/8/8 w - - 0 1";

function run(
  feedbackPolicy: RunFeedbackPolicy = "delayed_checkpoint",
  startFen = mateInOne,
): DrillRun {
  return createRun({
    id: `outcome-${feedbackPolicy}`,
    session:
      feedbackPolicy === "attempt_end"
        ? {
            kind: "position",
            start: { fen: startFen, side: "white" },
            feedbackPolicy,
            opponentPolicy: { mode: "human_common" },
          }
        : {
            kind: "pack",
            packId: "terminal-pack",
            packDigest: digest,
            start: { fen: startFen, side: "white" },
            feedbackPolicy,
            opponentPolicy: { mode: "human_common" },
          },
    sessionDigest: digest,
    policyConfig: {
      seedMode: "fixed",
      locus: { executedAt: "server", engineIds: [], modelIds: [] },
    },
    seed: 1,
    createdAt: at,
  });
}

describe("terminal outcome events", () => {
  it("emits learner-perspective checkmate and stalemate outcomes", () => {
    const won = commitMove(run(), "g6g7", { at }).run;
    expect(won.events.at(-1)).toMatchObject({
      type: "outcome.reached",
      data: { nodeId: won.activeCursor.nodeId, outcome: "win" },
    });

    const lostStart = "8/8/8/8/8/5kq1/8/7K b - - 0 1";
    const lost = commitMove(run("delayed_checkpoint", lostStart), "g3g2", {
      actor: "user",
      at,
    }).run;
    expect(lost.events.at(-1)).toMatchObject({
      type: "outcome.reached",
      data: { outcome: "loss" },
    });

    const stalemateStart = "7k/5K2/8/6Q1/8/8/8/8 w - - 0 1";
    const drawn = commitMove(run("delayed_checkpoint", stalemateStart), "g5g6", {
      at,
    }).run;
    expect(drawn.events.at(-1)).toMatchObject({
      type: "outcome.reached",
      data: { outcome: "draw" },
    });
  });

  it("emits a fifty-move draw at 100 halfmoves but not 99", () => {
    const start = "8/8/8/8/8/5k2/8/R3K3 w - - 98 1";
    const second = commitMove(run("delayed_checkpoint", start), "a1a2", { at }).run;
    expect(second.events.some((event) => event.type === "outcome.reached")).toBe(false);
    const hundred = commitMove(second, "f3g3", { actor: "user", at }).run;
    expect(hundred.events.at(-1)).toMatchObject({ type: "outcome.reached", data: { outcome: "draw" } });
    expect(() => commitMove(hundred, "a2a3", { at })).toThrow(/Run is terminal/);
  });

  it("emits a draw only on the third path occurrence", () => {
    let repeated = run("delayed_checkpoint", "4k3/8/8/8/8/8/8/R3K3 w - - 0 1");
    for (const move of ["a1a2", "e8e7", "a2a1", "e7e8"] as const) repeated = commitMove(repeated, move, { actor: "user", at }).run;
    expect(repeated.events.some((event) => event.type === "outcome.reached")).toBe(false);
    for (const move of ["a1a2", "e8e7", "a2a1", "e7e8"] as const) repeated = commitMove(repeated, move, { actor: "user", at }).run;
    expect(repeated.events.at(-1)).toMatchObject({ type: "outcome.reached", data: { outcome: "draw" } });
  });

  it("keeps checkmate ahead of the halfmove fallback", () => {
    const won = commitMove(run("delayed_checkpoint", "7k/8/5KQ1/8/8/8/8/8 w - - 99 1"), "g6g7", { at }).run;
    expect(won.events.at(-1)).toMatchObject({ type: "outcome.reached", data: { outcome: "win" } });
  });

  it("refuses terminal roots with a named error", () => {
    try {
      run("delayed_checkpoint", "7k/6Q1/6K1/8/8/8/8/8 b - - 0 1");
      throw new Error("Expected terminal root refusal");
    } catch (error) {
      expect(error).toBeInstanceOf(RuntimeError);
      expect(error).toMatchObject({ code: "TERMINAL_START_POSITION" });
    }
  });

  it("emits once per terminal node after rewind creates a new branch", () => {
    const first = commitMove(run(), "g6g7", { at }).run;
    const rootId = first.nodes[0]!.id;
    const second = commitMove(rewind(first, rootId, at).run, "g6g7", { at }).run;
    const outcomes = second.events.filter((event) => event.type === "outcome.reached");
    expect(outcomes).toHaveLength(2);
    expect(new Set(outcomes.map((event) => event.data.nodeId)).size).toBe(2);
  });

  it.each<RunFeedbackPolicy>(["delayed_checkpoint", "segment_end", "attempt_end", "immediate_guard"])(
    "discloses %s feedback on terminal outcome",
    (policy) => {
      const ended = commitMove(run(policy), "g6g7", { at }).run;
      expect(feedbackDisclosed(ended)).toBe(true);
      expect(feedbackDeliveryOpen(ended)).toBe(true);
    },
  );

  it("keeps attempt-end delivery open through rewind and closes on the next move", () => {
    const ended = commitMove(run("attempt_end"), "g6g7", { at }).run;
    const rewound = rewind(ended, ended.nodes[0]!.id, at).run;
    expect(feedbackDeliveryOpen(rewound)).toBe(true);
    const continued = commitMove(rewound, "g6h5", { at }).run;
    expect(feedbackDeliveryOpen(continued)).toBe(false);
    expect(feedbackDisclosed(continued)).toBe(true);
  });

  it("rejects forged outcome events during projection", () => {
    const ordinary = createRun({
      id: "forgery",
      packId: "pack",
      packDigest: digest,
      policyConfig: {
        seedMode: "fixed",
        locus: { executedAt: "server", engineIds: [], modelIds: [] },
      },
      startFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      seed: 1,
      createdAt: at,
    });
    expect(() =>
      appendEvents(ordinary, [{
        type: "outcome.reached",
        at,
        data: { nodeId: "missing", outcome: "draw" },
      }]),
    ).toThrow(/Unknown node/);
    expect(() =>
      appendEvents(ordinary, [{
        type: "outcome.reached",
        at,
        data: { nodeId: ordinary.activeCursor.nodeId, outcome: "draw" },
      }]),
    ).toThrow(/immediately follow/);

    const ended = commitMove(run(), "g6g7", { at }).run;
    const withoutOutcome = projectRun(ended.events.slice(0, -1));
    expect(() =>
      appendEvents(withoutOutcome, [{
        type: "outcome.reached",
        at,
        data: { nodeId: withoutOutcome.activeCursor.nodeId, outcome: "loss" },
      }]),
    ).toThrow(/expected win/);
    expect(() =>
      appendEvents(ended, [{
        type: "outcome.reached",
        at,
        data: { nodeId: ended.activeCursor.nodeId, outcome: "win" },
      }]),
    ).toThrow(/more than one/);

    const badAdjacency = [
      ...ended.events.slice(0, -1),
      {
        seq: ended.events.length,
        type: "feedback.generated" as const,
        at,
        data: { nodeId: ended.activeCursor.nodeId, evidenceRefs: ["rules:checkmate"] },
      },
      { ...ended.events.at(-1)!, seq: ended.events.length + 1 },
    ];
    expect(() => projectRun(badAdjacency)).toThrow(/immediately follow/);
  });
});
