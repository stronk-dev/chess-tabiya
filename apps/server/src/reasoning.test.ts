import { readFileSync } from "node:fs";

import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import { afterEach, describe, expect, it } from "vitest";

import { PackRegistry } from "./pack-registry.js";
import { validatePackDocument } from "./pack-validation.js";
import { REASONING_HONESTY } from "./reasoning.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";
import { EvidenceJobQueue } from "./evidence-queue.js";

const at = "2026-08-14T12:00:00.000Z";
const document = JSON.parse(readFileSync(new URL("../../../content/drafts/stated-reasoning.browser.json", import.meta.url), "utf8")) as DrillPackDefinition;
const principal = Object.freeze({ learnerId: "__legacy", handle: "__legacy" });

describe("stated reasoning service", () => {
  const stores: SQLiteRunStorage[] = [];
  afterEach(() => { for (const store of stores.splice(0)) store.close(); });

  async function setup(id = "reasoning-run") {
    const registry = await PackRegistry.fromDocuments([{ source: "reasoning-test", value: document }]);
    const storage = new SQLiteRunStorage(); stores.push(storage);
    const evidenceQueue = new EvidenceJobQueue({ execute: async () => ({ kind: "eval", source: "engine_validated", values: { centipawns: 0 } }) });
    const service = new RunService(storage, { packRegistry: registry, progressStorage: storage, evidenceQueue });
    await service.create({ id, session: { kind: "pack", packId: document.id }, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1, createdAt: at }, "writer-a");
    const moved = service.move(id, "writer-a", "h2h3", { at });
    const checkpoint = moved.run.events.find((event) => event.type === "checkpoint.reached")!;
    return { service, storage, run: moved.run, checkpoint };
  }

  it("records once per occurrence and reveals attributed points only with the durable record", async () => {
    const { service, run, checkpoint } = await setup();
    expect(service.reasoning(run.id, principal, "reasoning").occurrences).toEqual([]);
    const result = service.recordReasoning(run.id, principal, "writer-a", {
      nodeId: run.activeCursor.nodeId,
      checkpointEventSeq: checkpoint.seq,
      transcript: { candidates: ["Keep the queen"], plan: "protect the queen", fears: "a rook on the d-file" },
      at,
    });
    expect(result.emitted).toHaveLength(1);
    expect(result.emitted[0]?.type).toBe("reasoning.recorded");
    expect(result.reasoning.honestySentence).toBe(REASONING_HONESTY);
    expect(result.reasoning.occurrences[0]).toMatchObject({
      detections: [{ keyPointId: "protect-queen", status: "detected" }, { keyPointId: "watch-rook", status: "detected" }],
      keyPoints: [{ id: "protect-queen" }, { id: "watch-rook" }],
    });
    expect(() => service.recordReasoning(run.id, principal, "writer-a", { nodeId: run.activeCursor.nodeId, checkpointEventSeq: checkpoint.seq, skipped: true, at })).toThrow(/already recorded/);
  });

  it("records an explicit skip and rejects oversize input atomically", async () => {
    const skipped = await setup("reasoning-skip");
    const result = skipped.service.recordReasoning(skipped.run.id, principal, "writer-a", { nodeId: skipped.run.activeCursor.nodeId, checkpointEventSeq: skipped.checkpoint.seq, skipped: true, at });
    expect(result.reasoning.occurrences[0]).toMatchObject({ skipped: true, transcript: null, detections: [], keyPoints: expect.any(Array) });

    const oversize = await setup("reasoning-oversize");
    expect(() => oversize.service.recordReasoning(oversize.run.id, principal, "writer-a", { nodeId: oversize.run.activeCursor.nodeId, checkpointEventSeq: oversize.checkpoint.seq, transcript: { candidates: [], plan: "x".repeat(1001), fears: "" }, at })).toThrow(/closed field limits/);
    expect(oversize.storage.read(oversize.run.id)?.run.events.some((event) => event.type === "reasoning.recorded")).toBe(false);
  });

  it("refuses a segment-end reasoning checkpoint that cannot be proven to close a segment", () => {
    const candidate = structuredClone(document) as DrillPackDefinition;
    (candidate as unknown as { feedbackPolicy: string }).feedbackPolicy = "segment_end";
    expect(validatePackDocument(candidate).issues).toContainEqual(expect.objectContaining({ code: "REASONING_SEGMENT_END_UNPROVEN", path: "/checkpoints/0/interaction" }));
  });
});
