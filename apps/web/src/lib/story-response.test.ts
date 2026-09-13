import { describe, expect, it } from "vitest";

import {
  assertCreatedStoryShare,
  assertGameStoryResponse,
  assertRevokedStoryShare,
  assertStoryShares,
} from "./story-response.js";

const FEN = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";

function validStory(): unknown {
  return {
    runId: "run-one",
    ready: true,
    pendingEvidence: 0,
    branchId: "main",
    side: "white",
    source: { kind: "native" },
    outcome: { kind: "unfinished" },
    moments: [{
      nodeId: "node-one",
      entryNodeId: "entry-one",
      ply: 1,
      san: "e4",
      fen: FEN,
      kinds: ["phase_change"],
      sentences: [],
      evidence: [],
      phase: "opening",
    }],
    rank: ["node-one"],
    evidence: [],
  };
}

function expectInvalidStory(value: unknown, branchId?: string): void {
  expect(() => assertGameStoryResponse(value, { runId: "run-one", ...(branchId === undefined ? {} : { branchId }) }))
    .toThrow("Invalid game story response");
}

describe("Story network response contracts", () => {
  it("admits a closed Story document bound to the requested run and branch", () => {
    const story = validStory();
    expect(() => assertGameStoryResponse(story, { runId: "run-one", branchId: "main" })).not.toThrow();
  });

  it("refuses crossed subjects and contradictory readiness", () => {
    expectInvalidStory({ ...validStory() as object, runId: "run-two" });
    expectInvalidStory({ ...validStory() as object, branchId: "other" }, "main");
    expectInvalidStory({ ...validStory() as object, ready: true, pendingEvidence: 1 });
  });

  it("refuses malformed board state and rankings that are not an exact moment set", () => {
    const story = validStory() as { moments: Record<string, unknown>[]; rank: string[] };
    expectInvalidStory({ ...story, moments: [{ ...story.moments[0], fen: "not a fen" }] });
    expectInvalidStory({ ...story, rank: [] });
    expectInvalidStory({ ...story, rank: ["node-one", "node-one"] });
  });

  it("refuses undeclared evidence identities and unpaired evaluations", () => {
    const story = validStory() as { moments: Record<string, unknown>[] };
    expectInvalidStory({
      ...story,
      moments: [{
        ...story.moments[0],
        evidence: [{
          producer: { id: "forged.producer", version: 1 },
          projection: { id: "forged.projection", version: 1 },
          payload: {},
        }],
      }],
    });
    expectInvalidStory({
      ...story,
      moments: [{ ...story.moments[0], evalBefore: { centipawns: 0, engineId: "sf" } }],
    });
    expectInvalidStory({
      ...story,
      moments: [{ ...story.moments[0], sentences: ["A network-authored judgement."] }],
    });
  });

  it("binds share lists and creation receipts to the requested Story", () => {
    const share = {
      id: "share-one",
      scope: "story_read",
      runId: "run-one",
      branchId: "main",
      createdAt: "2026-09-13T12:00:00.000Z",
      revokedAt: null,
    };
    expect(() => assertStoryShares([share], "run-one")).not.toThrow();
    expect(() => assertStoryShares([{ ...share, runId: "run-two" }], "run-one")).toThrow("Invalid story share response");
    expect(() => assertStoryShares([share, share], "run-one")).toThrow("Invalid story share response");

    const created = {
      ...share,
      token: "public-token",
      url: "/shared/public-token",
    };
    expect(() => assertCreatedStoryShare(created, { runId: "run-one", branchId: "main" })).not.toThrow();
    expect(() => assertCreatedStoryShare({ ...created, branchId: "other" }, { runId: "run-one", branchId: "main" }))
      .toThrow("Invalid created story share response");
    expect(() => assertCreatedStoryShare({ ...created, url: "/shared/another-token" }, { runId: "run-one", branchId: "main" }))
      .toThrow("Invalid created story share response");
  });

  it("binds revocation receipts to the exact token and run", () => {
    const revoked = {
      revoked: true,
      runId: "run-one",
      tokenId: "share-one",
      revokedAt: "2026-09-13T12:05:00.000Z",
    };
    expect(() => assertRevokedStoryShare(revoked, { runId: "run-one", tokenId: "share-one" })).not.toThrow();
    expect(() => assertRevokedStoryShare({ ...revoked, tokenId: "share-two" }, { runId: "run-one", tokenId: "share-one" }))
      .toThrow("Invalid revoked story share response");
  });
});
