import { createRun, fork, rewind } from "@chess-tabiya/runtime";
import { describe, expect, it } from "vitest";

import {
  assertStoryForkResponse,
  assertStoryRewindResponse,
  type StoryReentrySubject,
} from "./story-reentry-response.js";

const run = createRun({
  id: "story-run",
  session: {
    kind: "position",
    start: { fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", side: "white" },
    feedbackPolicy: "attempt_end",
    opponentPolicy: { mode: "human_common", targetElo: 1800 },
  },
  sessionDigest: `sha256:${"a".repeat(64)}`,
  policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
  seed: 31,
  createdAt: "2026-09-13T13:00:00.000Z",
});
const subject: StoryReentrySubject = { runId: run.id, nodeId: run.nodes[0]!.id };
const rewound = rewind(run, subject.nodeId, "2026-09-13T13:01:00.000Z");
const forked = fork(rewound.run, subject.nodeId, {
  label: "story-reentry",
  intent: "Play a different continuation from this story moment",
  at: "2026-09-13T13:02:00.000Z",
});

describe("Story re-entry response validation", () => {
  it("admits the exact rewind and branch mutations", () => {
    expect(() => assertStoryRewindResponse(rewound, subject)).not.toThrow();
    expect(() => assertStoryForkResponse(forked, subject)).not.toThrow();
  });

  it("refuses a crossed run or node at either stage", () => {
    expect(() => assertStoryRewindResponse(rewound, { ...subject, runId: "other-run" })).toThrow(/requested moment/u);
    expect(() => assertStoryRewindResponse(rewound, { ...subject, nodeId: "other-node" })).toThrow(/requested moment/u);
    expect(() => assertStoryForkResponse(forked, { ...subject, runId: "other-run" })).toThrow(/requested moment/u);
    expect(() => assertStoryForkResponse(forked, { ...subject, nodeId: "other-node" })).toThrow(/requested moment/u);
  });

  it("refuses a branch that is not the declared Story re-entry", () => {
    const other = fork(rewound.run, subject.nodeId, { label: "Other" });
    expect(() => assertStoryForkResponse(other, subject)).toThrow(/requested moment/u);
  });
});
