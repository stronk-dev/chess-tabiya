// DISPOSABLE positive-reach fixtures for the eight D2120 execution source families.
import { describe, expect, it } from "vitest";

import { createRun } from "../../packages/runtime/src/runtime.js";
import { materialRoleSignatureReading } from "../../packages/runtime/src/material-state.js";
import { shapeFirings } from "../../packages/runtime/src/shape-firing.js";
import { storyMoments } from "../../packages/runtime/src/story.js";
import { structuralReading } from "../../packages/runtime/src/structure.js";
import { FixtureCorpusSource } from "../../apps/server/src/corpus.js";
import { StockfishEvidenceExecutor } from "../../apps/server/src/evidence-queue.js";
import { OpponentSelector } from "../../apps/server/src/opponent-selector.js";
import { LichessTablebaseSource } from "../../apps/server/src/tablebase.js";

const INITIAL = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const A_OPEN = "rnbqkbnr/1ppppppp/8/8/8/8/1PPPPPPP/RNBQKBNR w KQkq - 0 1";
const digest = `sha256:${"4".repeat(64)}`;

describe("D2120 positive execution-family reach", () => {
  it("reaches local-rules, authored-theory, recorded-run and derived families", () => {
    expect(structuralReading(INITIAL).features.length).toBeGreaterThan(0);
    expect(shapeFirings(
      [{ id: "open-a", trigger: { kind: "feature", feature: { kind: "open_file", file: "a" } } }],
      [{ id: "node-a", fen: A_OPEN }],
    )).toHaveLength(1);

    const run = createRun({
      id: "module-family-witness", packId: "fixture", packDigest: digest, startFen: INITIAL,
      policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
      seed: 1, createdAt: "2026-08-30T00:00:00.000Z",
    });
    const story = storyMoments(run, run.branches[0]!.id, { recordedResult: "1-0" });
    expect(story.evidence.some((item) => item.projection.id === "run.record.imported_result")).toBe(true);
    expect(materialRoleSignatureReading(INITIAL).colors).toHaveLength(2);
  });

  it("reaches Stockfish, Syzygy, Maia and Explorer through deterministic provider seams", async () => {
    const stockfish = new StockfishEvidenceExecutor({
      async execute() { return ["info depth 12 score cp 21 pv e2e4", "bestmove e2e4"]; },
    }, "stockfish-fixture", 1);
    await expect(stockfish.execute({
      id: "e", runId: "r", nodeId: "n", fen: INITIAL, kind: "eval", depth: 12,
    }, new AbortController().signal)).resolves.toMatchObject({ kind: "eval" });

    const syzygyFen = "8/8/8/8/8/8/4K3/6k1 w - - 0 1";
    const syzygy = new LichessTablebaseSource({ fetcher: async () => new Response(JSON.stringify({
      category: "draw", dtz: 0, precise_dtz: 0,
      moves: [{ uci: "e2e3", san: "Ke3", category: "draw", dtz: 0, precise_dtz: 0 }],
    }), { status: 200, headers: { "content-type": "application/json" } }) });
    await expect(syzygy.probe(syzygyFen)).resolves.toMatchObject({ category: "draw" });

    const explorer = new FixtureCorpusSource();
    await expect(explorer.stats({
      source: "lichess-explorer", fen: INITIAL, ratings: [1600], speeds: ["rapid"],
      since: "2025-01", until: "2026-01",
    })).resolves.toMatchObject({ kind: "stats" });

    const identity = {
      id: "maia-5m", kind: "opponent" as const, name: "Maia", version: "fixture",
      modelId: "maia-fixture", containerDigest: digest, seedHonored: false, eloHonored: true,
    };
    const maia = new OpponentSelector({
      async execute() {
        return [
          "info depth 1 multipv 1 score cp 0 wdl 300 400 300 policy 0.7 pv e2e4",
          "info depth 1 multipv 2 score cp 0 wdl 300 400 300 policy 0.3 pv d2d4",
          "bestmove e2e4",
        ];
      },
      health() {
        return {
          id: "maia-5m", status: "ready" as const, restartCount: 0, identity,
          bandOption: "Elo", options: [
            { name: "Elo", type: "spin" as const, default: "1500", min: 0, max: 5000 },
            { name: "SelfElo", type: "spin" as const, default: "1500", min: 0, max: 5000 },
            { name: "OppoElo", type: "spin" as const, default: "1500", min: 0, max: 5000 },
            { name: "MultiPV", type: "spin" as const, default: "5", min: 1, max: 20 },
          ],
        };
      },
    });
    await expect(maia.select({
      startFen: INITIAL, historyUci: [],
      policy: { mode: "human_common", policyConfigDigest: digest, targetElo: 1500 }, seed: 7,
    })).resolves.toMatchObject({ policyModeApplied: "human_common", moveUci: "e2e4" });
  });
});
