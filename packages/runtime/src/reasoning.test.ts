import type { ReasoningKeyPoint } from "@chess-tabiya/schema/drill-pack";
import { describe, expect, it } from "vitest";

import { appendEvents } from "./events.js";
import { matchKeyPoints, normalizeReasoningText } from "./reasoning.js";
import { createRun, reachCheckpoint } from "./runtime.js";

const FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const at = "2026-08-14T12:00:00.000Z";

function point(id: string, phrases: readonly string[]): ReasoningKeyPoint {
  return Object.freeze({ id, label: id, phrases, ground: Object.freeze({ kind: "spine_move", spineNodeId: "root" }) });
}

describe("stated-reasoning matcher", () => {
  it("matches SAN/UCI equivalence, NFKC casefolding, boundaries, and fields in order", () => {
    const detections = matchKeyPoints([
      point("knight", ["Nf3"]),
      point("minority", ["minority attack"]),
      point("boundary", ["pawn"]),
      point("first", ["develop"]),
    ], {
      candidates: ["g1f3", "Develop quickly"],
      plan: "ＤＥＶＥＬＯＰ and start the MINORITY   ATTACK",
      fears: "connected pawns",
    }, FEN);

    expect(detections.map(({ keyPointId, status }) => ({ keyPointId, status }))).toEqual([
      { keyPointId: "knight", status: "detected" },
      { keyPointId: "minority", status: "detected" },
      { keyPointId: "boundary", status: "not_detected" },
      { keyPointId: "first", status: "detected" },
    ]);
    expect(detections[0]?.match).toMatchObject({ field: "candidates", index: 0, start: 0, end: 4 });
    expect(detections[3]?.match).toMatchObject({ field: "candidates", index: 1 });
    expect(normalizeReasoningText("ＤＥＶＥＬＯＰ   NOW")).toBe("develop now");
  });

  it("rejects forged occurrence links, inconsistent detections, and out-of-bounds spans", () => {
    let run = createRun({
      id: "reasoning-runtime",
      session: { kind: "position", start: { fen: FEN, side: "white" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } },
      sessionDigest: `sha256:${"1".repeat(64)}`,
      policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
      seed: 1,
      createdAt: at,
    });
    run = reachCheckpoint(run, "reason", at).run;
    const nodeId = run.activeCursor.nodeId;
    const transcript = { candidates: ["Nf3"], plan: "Develop", fears: "" } as const;
    const draft = { type: "reasoning.recorded" as const, at, data: { nodeId, checkpointId: "reason", checkpointEventSeq: 2, skipped: false, transcript, matcherVersion: 1 as const, detections: [{ keyPointId: "knight", status: "detected" as const, match: { field: "candidates" as const, index: 0, start: 0, end: 3 } }] } };
    expect(appendEvents(run, [draft]).events.at(-1)?.type).toBe("reasoning.recorded");
    expect(() => appendEvents(run, [{ ...draft, data: { ...draft.data, checkpointEventSeq: 1 } }])).toThrow(/checkpoint occurrence/);
    expect(() => appendEvents(run, [{ ...draft, data: { ...draft.data, detections: [] } }])).toThrow(/skip data/);
    expect(() => appendEvents(run, [{ ...draft, data: { ...draft.data, detections: [{ ...draft.data.detections[0]!, match: { field: "candidates", index: 0, start: 0, end: 99 } }] } }])).toThrow(/out-of-bounds/);
  });
});
