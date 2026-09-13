import { createRun } from "@chess-tabiya/runtime";
import { describe, expect, it } from "vitest";

import { assertFlipResponse, type FlipResponse, type FlipSubject } from "./flip-response.js";

const subject: FlipSubject = {
  runId: "source-run",
  nodeId: "source-run:node:0",
  branchId: "source-run:branch:0",
};

const derivedRun = createRun({
  id: "derived-run",
  session: {
    kind: "position",
    start: { fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", side: "black" },
    feedbackPolicy: "attempt_end",
    opponentPolicy: { mode: "human_common", targetElo: 1800 },
  },
  sessionDigest: `sha256:${"f".repeat(64)}`,
  policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
  seed: 31,
  createdAt: "2026-09-13T10:00:00.000Z",
});

const response: FlipResponse = {
  run: derivedRun,
  writerId: "writer-derived",
  derivation: {
    derivedRunId: derivedRun.id,
    sourceRunId: subject.runId,
    sourceBranchId: subject.branchId,
    sourceNodeId: subject.nodeId,
    kind: "flip_sides",
    createdAt: "2026-09-13T10:00:00.000Z",
  },
};

describe("opposite-side replay response", () => {
  it("accepts the exact derived run and source tuple", () => {
    expect(() => assertFlipResponse(response, subject)).not.toThrow();
  });

  it.each([
    { name: "derived run", mutate: { run: { ...derivedRun, id: "crossed-run" } } },
    { name: "source run", mutate: { derivation: { ...response.derivation, sourceRunId: "crossed-source" } } },
    { name: "source node", mutate: { derivation: { ...response.derivation, sourceNodeId: "crossed-node" } } },
    { name: "source branch", mutate: { derivation: { ...response.derivation, sourceBranchId: "crossed-branch" } } },
  ])("refuses a crossed $name", ({ mutate }) => {
    expect(() => assertFlipResponse({ ...response, ...mutate } as FlipResponse, subject)).toThrow(/does not match/u);
  });
});
