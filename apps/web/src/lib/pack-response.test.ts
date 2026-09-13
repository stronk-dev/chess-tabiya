import { describe, expect, it } from "vitest";

import { DrillApi } from "./api.js";
import { parsePackDocument } from "./pack-response.js";

const digest = `sha256:${"a".repeat(64)}`;
const pack = Object.freeze({
  id: "pack-a",
  version: "0.29",
  title: "Pack A",
  mode: "line",
  phase: "opening",
  difficulty: { minOnlineRapid: 1200, maxOnlineRapid: 1800, label: "Club player", branchLengthTarget: 8 },
  provenance: { reviewStatus: "draft", sources: ["source-a"], licence: "CC-BY-SA-4.0" },
  channel: "community",
  publisherHandle: "author-a",
  start: { fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", side: "white", movesSan: [] },
  objective: { type: "follow_theory", summary: "Choose the plan.", grading: { assessedBy: { kind: "engine", score: { kind: "cp", centipawns: 20 }, perspective: "white", depth: 18, engineId: "stockfish", engineVersion: "18", sourceId: "authoring", retrievedAt: "2026-09-14T00:00:00.000Z" }, resolveAt: { kind: "checkpoint", checkpointId: "boundary" }, grounding: "ledger_verified" } },
  feedbackPolicy: "delayed_checkpoint",
  opponentPolicy: { mode: "theory_strict", targetElo: 1600, seedMode: "per_run" },
  shapes: [{ shape: "carlsbad", relation: "prospective" }],
  variantOf: { packId: "parent-pack", relation: { kind: "root_after_move", moveUci: "e2e4" } },
  spine: [],
  checkpoints: [{ id: "boundary", label: "Plan boundary", actions: ["compare_branches"], interaction: { type: "prediction", flipBoard: true } }],
});

describe("pack response authority", () => {
  it("accepts and freezes the complete browser-safe projection", () => {
    const parsed = parsePackDocument(pack, "pack-a");
    expect(parsed).toEqual(pack);
    expect(Object.isFrozen(parsed)).toBe(true);
    expect(Object.isFrozen(parsed.objective)).toBe(true);
  });

  it("permits repeated SAN notation in an ordered move history", () => {
    const parsed = parsePackDocument({ ...pack, start: { ...pack.start, movesSan: ["Nf3", "Nf6", "Ng1", "Ng8", "Nf3"] } }, "pack-a");
    expect(parsed.start.movesSan).toEqual(["Nf3", "Nf6", "Ng1", "Ng8", "Nf3"]);
  });

  it.each([
    [{ ...pack, id: "crossed-pack" }],
    [{ ...pack, serverOnly: true }],
    [{ ...pack, start: { ...pack.start, fen: "not a fen" } }],
    [{ ...pack, opponentPolicy: { mode: "invented" } }],
    [{ ...pack, spine: [{ id: "answer", moveUci: "e2e4", moveSan: "e4", children: [] }] }],
    [{ ...pack, objective: { ...pack.objective, grading: { ...pack.objective.grading, grounding: "trusted_by_model" } } }],
    [{ ...pack, checkpoints: [{ ...pack.checkpoints[0], actions: ["show_best_move"] }] }],
    [{ ...pack, checkpoints: [{ ...pack.checkpoints[0], id: "different" }] }],
    [{ ...pack, channel: "official", publisherHandle: "forged" }],
    [{ ...pack, shapes: [pack.shapes[0], pack.shapes[0]] }],
  ])("refuses crossed, answer-bearing, or malformed pack bytes", (value) => {
    expect(() => parsePackDocument(value, "pack-a")).toThrow(TypeError);
  });

  it("accepts trajectory legs only with real checkpoint references", () => {
    const trajectory = { ...pack, mode: "trajectory", objective: { type: "run_trajectory", summary: "Play every phase." }, legs: [{ id: "opening", objective: { type: "play_until_checkpoint", summary: "Reach the hand-off." } }, { id: "ending", entryCheckpointId: "boundary", branchLengthTarget: 6, objective: { type: "hold", summary: "Hold the ending." } }] };
    expect(parsePackDocument(trajectory, "pack-a").legs).toHaveLength(2);
    expect(() => parsePackDocument({ ...trajectory, legs: [{ ...trajectory.legs[1], entryCheckpointId: "missing" }] }, "pack-a")).toThrow(/unknown checkpoint/u);
  });

  it("binds DrillApi.pack to the requested subject and digest header", async () => {
    const api = new DrillApi("http://tabiya.test", async () => Response.json(pack, { headers: { "x-pack-digest": digest } }));
    await expect(api.pack("pack-a")).resolves.toMatchObject({ document: { id: "pack-a" }, digest });
    await expect(new DrillApi("http://tabiya.test", async () => Response.json({ ...pack, id: "other" }, { headers: { "x-pack-digest": digest } })).pack("pack-a")).rejects.toThrow(/requested id/u);
    await expect(new DrillApi("http://tabiya.test", async () => Response.json(pack, { headers: { "x-pack-digest": "forged" } })).pack("pack-a")).rejects.toThrow(/valid digest/u);
  });
});
