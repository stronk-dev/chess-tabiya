import { createHash } from "node:crypto";

import { afterEach, describe, expect, it } from "vitest";

import { selectedStoryMoments } from "@chess-tabiya/runtime";

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
    expect(story).toMatchObject({ source: { kind: "native" }, outcome: { kind: "board_terminal", result: "loss" }, branchId: run.activeCursor.branchId });
    expect(story.moments.some((moment) => moment.kinds.includes("human_divergence"))).toBe(true);
    const share = service.share("native", principal, story.branchId);
    const stored = storage.publicTokens("native", principal.learnerId)[0]!;
    expect(stored.tokenHash).toBe(createHash("sha256").update(share.token).digest("hex"));
    expect(JSON.stringify(stored)).not.toContain(share.token);
    const card = service.publicStory(share.token);
    expect(card).toMatchObject({ title: expect.any(String), outcome: { kind: "board_terminal" } });
    expect(card.productLink).toBe("/play");
    expect(Object.keys(card).sort()).toEqual(["moments", "outcome", "productLink", "title"]);
    expect(card.moments.map((moment) => moment.nodeId)).toEqual(selectedStoryMoments(story).map((moment) => moment.nodeId));
    const milestones = service.milestones(principal);
    expect(milestones.map((item) => item.kind)).toContain("first_attempt");
    expect(new Set(milestones.map((item) => item.kind)).size).toBe(milestones.length);
    expect(milestones.map((item) => item.sentence).join(" ")).not.toMatch(/%|score|streak|rating|ranking/i);
    service.revokeShare("native", principal, share.id);
    expect(() => service.publicStory(share.token)).toThrowError(expect.objectContaining({ code: "RUN_NOT_FOUND" }));
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
