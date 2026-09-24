import { describe, expect, it } from "vitest";

import {
  assertCreatedStoryShare,
  assertRevokedStoryShare,
  assertStoryShares,
} from "./story-response.js";

import { parseReviewStoryReceipt, renderReviewStoryReceipt, reviewPacketForRun } from "@chess-tabiya/runtime";

import { attachDelivery, evaluationDelivery, importRecord, importedRun, mainPath, play } from "../../../../packages/runtime/src/testing/review-evidence-fixture.js";

function validStory(): Record<string, unknown> {
  let run = play(importedRun("run-one"), ["e2e4", "e7e5", "g1f3"]);
  const path = mainPath(run);
  run = attachDelivery(run, path[0]!.id, evaluationDelivery(path[0]!.fen, "cp 20"));
  run = attachDelivery(run, path[1]!.id, evaluationDelivery(path[1]!.fen, "cp -300"));
  return JSON.parse(JSON.stringify(renderReviewStoryReceipt(reviewPacketForRun(run, run.activeCursor.branchId, { importRecord: importRecord(run, "1-0") })))) as Record<string, unknown>;
}

describe("Story network response contracts (rfc/review-evidence-compiler.md §4)", () => {
  it("admits the closed review-story@1 receipt bound to the requested run and branch", () => {
    const story = validStory();
    const branchId = (story.subject as { readonly branchId: string }).branchId;
    const parsed = parseReviewStoryReceipt(story, { runId: "run-one", branchId });
    expect(parsed.receipt.protocol).toBe("review-story@1");
    expect(parsed.moments.length).toBeGreaterThan(0);
  });

  it("refuses crossed subjects, open shapes, legacy scalar fields and forged presentation receipts", () => {
    const story = validStory();
    expect(() => parseReviewStoryReceipt(story, { runId: "run-two" })).toThrow(/does not answer the request/u);
    expect(() => parseReviewStoryReceipt({ ...story, ready: true, pendingEvidence: 0 })).toThrow(/keys/u);
    const moments = story.moments as Record<string, unknown>[];
    expect(() => parseReviewStoryReceipt({ ...story, moments: [{ ...moments[0]!, evalBefore: { centipawns: 0, engineId: "sf" } }, ...moments.slice(1)] })).toThrow(/keys/u);
    expect(() => parseReviewStoryReceipt({ ...story, moments: [{ ...moments[0]!, sentences: ["prose"] }, ...moments.slice(1)] })).toThrow(/keys/u);
    const forged = structuredClone(moments[0]!) as { presentation: { items: { component: { operand: Record<string, unknown> } }[] } };
    forged.presentation.items[0]!.component.operand.value = 12345;
    expect(() => parseReviewStoryReceipt({ ...story, moments: [forged, ...moments.slice(1)] })).toThrow(/presentation/u);
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
