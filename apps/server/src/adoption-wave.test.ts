import { createHash } from "node:crypto";

import { afterEach, describe, expect, it } from "vitest";

import { selectReviewMoments } from "@chess-tabiya/runtime";

import { EvidenceJobQueue, type EvidenceExecutor } from "./evidence-queue.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";
import { createRestHandler } from "./rest.js";

const FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const principal = { learnerId: "__legacy", handle: "__legacy" } as const;
const selection = (moveUci: string, candidates?: readonly { readonly moveUci: string; readonly rank: number; readonly mass: number }[]) => ({ moveUci, policyModeApplied: "human_common" as const, ...(candidates === undefined ? {} : { candidates }), engine: { id: "mock", name: "Mock", version: "1", seedHonored: true } });
const executor: EvidenceExecutor = { async execute() { return { kind: "eval", source: "engine_validated", values: { centipawns: 0 } }; } };

describe("adoption wave server contracts", () => {
  const stores: SQLiteRunStorage[] = [];
  afterEach(() => { for (const store of stores.splice(0)) store.close(); });

  async function terminalRun() {
    const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} }); stores.push(storage);
    const queue = new EvidenceJobQueue(executor, { maxConcurrency: 1 });
    const service = new RunService(storage, { evidenceQueue: queue, progressStorage: storage });
    await service.create({ id: "native", session: { kind: "position", start: { fen: FEN, side: "white" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } }, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 9 }, "writer");
    service.move("native", "writer", "f2f3");
    service.opponentPly("native", "writer", selection("e7e5", [{ moveUci: "e7e6", rank: 1, mass: .31 }, { moveUci: "e7e5", rank: 2, mass: .24 }, { moveUci: "g8f6", rank: 3, mass: .19 }]));
    service.move("native", "writer", "g2g4");
    service.opponentPly("native", "writer", selection("d8h4"));
    return { storage, service, queue };
  }

  it("offers native terminal stories and stores only hashed revocable share tokens", async () => {
    const { storage, service } = await terminalRun();
    const run = storage.read("native")!.run;
    const story = service.story("native", principal);
    expect(story).toMatchObject({ runId: "native", source: { kind: "native" }, outcome: { kind: "board_terminal", result: "loss" }, branchId: run.activeCursor.branchId });
    expect(story.moments.some((moment) => moment.kinds.includes("human_divergence"))).toBe(true);
    const share = service.share("native", principal, story.branchId);
    expect(share).toMatchObject({
      scope: "story_read",
      runId: "native",
      branchId: story.branchId,
      revokedAt: null,
    });
    const stored = storage.publicTokens("native", principal.learnerId)[0]!;
    expect(stored.tokenHash).toBe(createHash("sha256").update(share.token).digest("hex"));
    expect(JSON.stringify(stored)).not.toContain(share.token);
    expect(service.shares("native", principal)).toEqual([{
      id: share.id,
      scope: "story_read",
      runId: "native",
      branchId: story.branchId,
      createdAt: share.createdAt,
      revokedAt: null,
    }]);
    const card = service.publicStory(share.token);
    expect(card).toMatchObject({ title: expect.any(String), outcome: { kind: "board_terminal" } });
    expect(card.productLink).toBe("/play");
    expect(Object.keys(card).sort()).toEqual(["considered", "footer", "moments", "momentsSentence", "outcome", "productLink", "title"]);
    const storySelection = selectReviewMoments(story);
    expect(card.considered).toBe(storySelection.considered);
    expect(card.moments.map((moment) => moment.nodeId)).toEqual(storySelection.moments.map((moment) => moment.nodeId));
    const milestones = service.milestones(principal);
    expect(milestones.map((item) => item.kind)).toContain("first_attempt");
    expect(new Set(milestones.map((item) => item.kind)).size).toBe(milestones.length);
    expect(milestones.map((item) => item.sentence).join(" ")).not.toMatch(/%|score|streak|rating|ranking/i);
    expect(service.revokeShare("native", principal, share.id, "2026-09-13T12:00:00.000Z")).toEqual({
      revoked: true,
      runId: "native",
      tokenId: share.id,
      revokedAt: "2026-09-13T12:00:00.000Z",
    });
    expect(() => service.revokeShare("native", principal, share.id)).toThrowError(expect.objectContaining({ code: "RUN_NOT_FOUND" }));
    expect(() => service.revokeShare("native", principal, "share-missing")).toThrowError(expect.objectContaining({ code: "RUN_NOT_FOUND" }));
    expect(() => service.publicStory(share.token)).toThrowError(expect.objectContaining({ code: "RUN_NOT_FOUND" }));
  });

  it("carries the review's moment denominator and computed footer through public JSON and HTML", async () => {
    const moments = Array.from({ length: 3 }, (_, index) => Object.freeze({
      nodeId: `moment-${index + 1}`,
      ply: index + 1,
      san: "e4",
      fen: FEN,
      heading: "Evaluation shift",
      moveLabel: `Move ${index + 1}`,
      sentences: Object.freeze([`Moment ${index + 1}.`]),
      sourceLabels: Object.freeze(["Board rules"]),
    }));
    const service = {
      publicTokenScope: () => "story_read",
      publicStory: () => Object.freeze({
        title: "A bounded story",
        outcome: Object.freeze({ kind: "recorded_result", result: "1-0" }),
        considered: 12,
        momentsSentence: "Up to three recorded moments, at most one per game phase, from 12 admitted story moments. This is not a ranking of the play.",
        footer: Object.freeze({ labels: Object.freeze(["Recorded game", "Board rules"]), sentence: "Sources on this review: Recorded game · Board rules." }),
        moments: Object.freeze(moments),
        productLink: "/play",
      }),
    } as unknown as RunService;
    const handler = createRestHandler(service);

    const jsonResponse = await handler(new Request("http://tabiya.test/api/shared/token/story"));
    expect(await jsonResponse.json()).toMatchObject({ considered: 12, moments: [{ nodeId: "moment-1" }, { nodeId: "moment-2" }, { nodeId: "moment-3" }] });
    const htmlResponse = await handler(new Request("http://tabiya.test/shared/token"));
    const html = await htmlResponse.text();
    expect(html).toContain("3 moments selected from 12 admitted story moments.");
    expect(html).toContain("Sources on this review: Recorded game · Board rules.");
    expect(html).toContain("Sources: Board rules.");
    expect(html).not.toMatch(/engine/iu);
  });

  it("creates an opposite-side position run atomically without changing the source", async () => {
    const { storage, service } = await terminalRun();
    const before = structuredClone(storage.read("native")!.run);
    const flipped = await service.flip("native", principal, before.nodes[0]!.id);
    expect(flipped.run).toMatchObject({ sessionKind: "position", packId: null, start: { fen: before.nodes[0]!.fen, side: "black" } });
    expect(storage.derivationFor(flipped.run.id)).toEqual(flipped.derivation);
    expect(storage.read("native")!.run).toEqual(before);
  });

  it("refuses a non-terminal native story without enqueueing a story pass", async () => {
    const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} }); stores.push(storage);
    const queue = new EvidenceJobQueue(executor, { maxConcurrency: 1 });
    const service = new RunService(storage, { evidenceQueue: queue });
    await service.create({ id: "unfinished", session: { kind: "position", start: { fen: FEN, side: "white" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } }, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 3 }, "writer");
    const before = queue.outstanding("unfinished");
    const response = await createRestHandler(service)(new Request("http://tabiya.test/runs/unfinished/story"));
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ error: { code: "STORY_UNAVAILABLE" } });
    expect(queue.outstanding("unfinished")).toEqual(before);
  });
});
