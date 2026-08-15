import { readFile } from "node:fs/promises";

import { INITIAL_FEN } from "chessops/fen";
import { describe, expect, it } from "vitest";

import type { EngineHealth, EngineRequest } from "./engine-supervisor.js";
import { OpponentSelector, type SelectorEngineClient } from "./opponent-selector.js";
import { PackRegistry } from "./pack-registry.js";
import { RepertoireService } from "./repertoire.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";

const digest = `sha256:${"e".repeat(64)}`;
const policyConfig = { seedMode: "fixed" as const, locus: { executedAt: "server" as const, engineIds: [], modelIds: [] } };

class BoundedMaia implements SelectorEngineClient {
  async execute(_engineId: string, _request: EngineRequest): Promise<readonly string[]> {
    throw new TypeError("out-of-range requests must not reach the engine");
  }

  health(engineId: string): EngineHealth {
    return {
      id: engineId,
      status: "ready",
      restartCount: 0,
      identity: { id: engineId, kind: "opponent", name: "Maia", version: "1", seedHonored: false, eloHonored: true },
      bandOption: "Elo",
      bandRange: { min: 1100, max: 1800 },
      options: [{ name: "Elo", type: "spin", default: "1500", min: 0, max: 5000 }],
    };
  }
}

describe("target Elo request boundaries", () => {
  it("routes direct, position, pack, import, and repertoire requests through one published range", async () => {
    const selector = new OpponentSelector(new BoundedMaia(), { maiaEngineId: "maia", strongEngineId: "stockfish" });
    const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} });
    try {
      const raw = JSON.parse(await readFile(new URL("../../../schemas/drill_pack.example.json", import.meta.url), "utf8")) as Record<string, unknown>;
      const pack = { ...raw, opponentPolicy: { ...(raw.opponentPolicy as Record<string, unknown>), targetElo: 1900 } };
      const registry = await PackRegistry.fromDocuments([{ source: "range-pack", value: pack }]);
      const runs = new RunService(storage, { opponentSelector: selector, packRegistry: registry });
      const repertoire = new RepertoireService(storage, runs);
      const refusal = { code: "TARGET_ELO_OUT_OF_RANGE", details: expect.objectContaining({ min: 1100, max: 1800, source: "advertised+configured" }) };

      expect(() => selector.select({
        startFen: INITIAL_FEN,
        historyUci: [],
        policy: { mode: "human_common", policyConfigDigest: digest, targetElo: 1900 },
        seed: 1,
      })).toThrow(expect.objectContaining(refusal));

      await expect(runs.create({
        id: "position-range",
        session: { kind: "position", start: { fen: INITIAL_FEN, side: "white" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common", targetElo: 1900 } },
        policyConfig,
        seed: 1,
      }, "writer-position")).rejects.toMatchObject(refusal);

      await expect(runs.create({
        id: "pack-range",
        session: { kind: "pack", packId: String(raw.id) },
        policyConfig,
        seed: 1,
      }, "writer-pack")).rejects.toMatchObject(refusal);

      await expect(runs.importGame({
        id: "import-range",
        side: "white",
        opponentPolicy: { mode: "human_common", targetElo: 1900 },
        policyConfig,
        seed: 1,
        source: { kind: "pgn", pgn: "[Result \"*\"]\n\n1. e4 e5 *" },
      }, "writer-import")).rejects.toMatchObject(refusal);

      await expect(repertoire.create({ learnerId: "learner", handle: "learner" }, {
        name: "Range",
        side: "white",
        targetElo: 1900,
        coverageDenominator: 100,
        source: { kind: "pgn", pgn: "[Result \"*\"]\n\n1. e4 e5 *" },
      })).rejects.toMatchObject(refusal);
    } finally {
      storage.close();
    }
  });
});
