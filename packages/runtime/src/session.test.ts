import { describe, expect, it } from "vitest";

import {
  commitMove,
  createRun,
  digestSessionSource,
  feedbackDeliveryOpen,
  feedbackDisclosed,
  projectRun,
  revealFeedback,
  sessionSource,
} from "./index.js";

const FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const at = "2026-08-12T12:00:00.000Z";
const policyConfig = {
  seedMode: "fixed" as const,
  locus: { executedAt: "server" as const, engineIds: [], modelIds: [] },
};

function positionRun() {
  return createRun({
    id: "position-run",
    session: {
      kind: "position",
      start: { fen: FEN, side: "white" },
      feedbackPolicy: "attempt_end",
      opponentPolicy: { mode: "human_common", targetElo: 1600 },
    },
    sessionDigest: `sha256:${"1".repeat(64)}`,
    policyConfig,
    seed: 7,
    createdAt: at,
  });
}

describe("run session identity and feedback", () => {
  it("canonicalizes RFC-8785 session identity independently of key order", async () => {
    const source = sessionSource(positionRun());
    const reordered = {
      opponentPolicy: { targetElo: 1600, mode: "human_common" as const },
      feedbackPolicy: "attempt_end" as const,
      start: { side: "white" as const, fen: FEN },
      kind: "position" as const,
    };
    await expect(digestSessionSource(source)).resolves.toBe(
      await digestSessionSource(reordered),
    );
    await expect(
      digestSessionSource({
        ...reordered,
        opponentPolicy: { mode: "human_common", targetElo: 1700 },
      }),
    ).resolves.not.toBe(await digestSessionSource(source));
    await expect(
      digestSessionSource({
        ...reordered,
        opponentPolicy: { mode: "human_common", targetElo: null },
      } as unknown as typeof source),
    ).resolves.not.toBe(
      await digestSessionSource({
        ...reordered,
        opponentPolicy: { mode: "human_common" },
      }),
    );

    await expect(
      digestSessionSource({
        kind: "pack",
        packId: "pack-a",
        packDigest: `sha256:${"a".repeat(64)}`,
      }),
    ).resolves.not.toBe(
      await digestSessionSource({
        kind: "pack",
        packId: "pack-a",
        packDigest: `sha256:${"b".repeat(64)}`,
      }),
    );
  });

  it("opens position delivery explicitly, keeps disclosure durable, and closes delivery on move", () => {
    const run = positionRun();
    expect(feedbackDisclosed(run)).toBe(false);
    expect(feedbackDeliveryOpen(run)).toBe(false);

    const revealed = revealFeedback(run, at);
    expect(revealed.emitted.map((event) => event.type)).toEqual(["feedback.revealed"]);
    expect(feedbackDisclosed(revealed.run)).toBe(true);
    expect(feedbackDeliveryOpen(revealed.run)).toBe(true);
    expect(revealFeedback(revealed.run, at).emitted).toEqual([]);

    const moved = commitMove(revealed.run, "e2e4", { at }).run;
    expect(feedbackDisclosed(moved)).toBe(true);
    expect(feedbackDeliveryOpen(moved)).toBe(false);
  });

  it.each([
    ["pack pair", (data: Record<string, unknown>) => ({ ...data, packDigest: null })],
    ["pack feedback", (data: Record<string, unknown>) => ({ ...data, feedbackPolicy: "attempt_end" })],
    ["position feedback", (data: Record<string, unknown>) => ({ ...data, feedbackPolicy: "delayed_checkpoint" })],
    ["position theory", (data: Record<string, unknown>) => ({ ...data, opponentPolicy: { mode: "theory_strict" } })],
    ["start FEN", (data: Record<string, unknown>) => ({ ...data, start: { fen: "8/8/8/8/8/8/4K3/7k w - - 0 1", side: "white" } })],
    ["digest", (data: Record<string, unknown>) => ({ ...data, sessionDigest: "not-a-digest" })],
  ])("rejects a replay with an invalid %s invariant", (_name, mutate) => {
    const run = positionRun();
    const event = run.events[0]!;
    const positionMutation = _name === "pack pair" || _name === "pack feedback"
      ? {
          ...event.data,
          sessionKind: "pack" as const,
          packId: "pack-a",
          packDigest: `sha256:${"2".repeat(64)}`,
          feedbackPolicy: "delayed_checkpoint" as const,
        }
      : event.data;
    const invalid = [{ ...event, data: mutate(positionMutation) }] as unknown as typeof run.events;
    expect(() => projectRun(invalid)).toThrow(TypeError);
  });

  it("rejects feedback reveal attributed to an unknown node", () => {
    const run = positionRun();
    expect(() =>
      projectRun([
        ...run.events,
        {
          seq: 2,
          type: "feedback.revealed",
          at,
          data: { nodeId: "missing-node" },
        },
      ]),
    ).toThrow("Unknown node");
  });
});
