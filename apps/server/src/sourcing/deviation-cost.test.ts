import { readFile } from "node:fs/promises";

import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import { deviationCostEvidenceIssues } from "./check.js";
import { deriveDeviationCost, stampDeviationCosts } from "./deviation-cost.js";
import type { EvidenceRecord, SourcingIssue } from "./types.js";

async function fixture(): Promise<DrillPackDefinition> {
  return JSON.parse(
    await readFile("content/drafts/maroczy-bind-white-squeeze.json", "utf8"),
  ) as DrillPackDefinition;
}

function after(fen: string, moveUci: string): string {
  const board = Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
  board.play(parseUci(moveUci)!);
  return makeFen(board.toSetup());
}

function pair(pack: DrillPackDefinition, afterCp: number): readonly EvidenceRecord[] {
  const deviation = pack.deviations![0]!;
  const common = {
    kind: "engine_eval" as const,
    sourceId: "stockfish-fixture",
    retrievedAt: "2026-08-16T00:00:00.000Z",
    grounds: "machine_validation" as const,
  };
  return [
    {
      ...common,
      anchor: { fen: pack.start.fen },
      values: {
        engineId: "stockfish-authoring",
        engineVersion: "18",
        depth: 22,
        multiPv: 1,
        centipawns: 77,
      },
      supports: ["/start/fen"],
    },
    {
      ...common,
      anchor: { fen: after(pack.start.fen, deviation.moveUci) },
      values: {
        engineId: "stockfish-authoring",
        engineVersion: "18",
        depth: 22,
        multiPv: 1,
        centipawns: afterCp,
      },
      supports: ["/deviations/0/moveUci"],
    },
  ];
}

describe("machine-derived deviation costs", () => {
  it("reports an authored machine cost with no matching evidence pair", async () => {
    const issues: SourcingIssue[] = [];
    deviationCostEvidenceIssues(await fixture(), [], issues);
    expect(issues).toContainEqual(
      expect.objectContaining({ code: "DEVIATION_COST_UNBACKED", path: "/deviations/0/cost" }),
    );
  });

  it("reports an authored cost that contradicts the measured pair", async () => {
    const pack = await fixture();
    const issues: SourcingIssue[] = [];
    deviationCostEvidenceIssues(pack, pair(pack, -23), issues);
    expect(issues).toContainEqual(
      expect.objectContaining({ code: "DEVIATION_COST_CONTRADICTED", path: "/deviations/0/cost" }),
    );
  });

  it("refuses a derived centipawn loss outside the schema range", async () => {
    const pack = await fixture();
    await expect(
      Promise.resolve().then(() => deriveDeviationCost(pack, pair(pack, -30_000), 0, "engine")),
    ).rejects.toMatchObject({ code: "DEVIATION_COST_OUT_OF_RANGE" });
  });

  it("covers every mate/centipawn cross-case without manufacturing a magnitude", async () => {
    const pack = await fixture();
    const records = (before: Readonly<Record<string, unknown>>, afterValues: Readonly<Record<string, unknown>>) => {
      const result = structuredClone(pair(pack, 0)) as any[];
      result[0].values = { ...result[0].values, centipawns: undefined, ...before };
      result[1].values = { ...result[1].values, centipawns: undefined, ...afterValues };
      return result as unknown as readonly EvidenceRecord[];
    };
    expect(deriveDeviationCost(pack, records({ centipawns: 20 }, { mateIn: -3 }), 0, "engine"))
      .toEqual({ kind: "mate", against: "learner", basis: "engine" });
    expect(deriveDeviationCost(pack, records({ centipawns: 20 }, { mateIn: 3 }), 0, "engine"))
      .toBeUndefined();
    expect(deriveDeviationCost(pack, records({ mateIn: 3 }, { centipawns: 20 }), 0, "engine"))
      .toEqual({ kind: "unmeasurable", reason: "a forced mate at the anchor is not comparable to a centipawn score after the deviation" });
    expect(deriveDeviationCost(pack, records({ mateIn: -3 }, { centipawns: 20 }), 0, "engine"))
      .toBeUndefined();
  });

  it("resolves a bare-FEN deviation against that FEN rather than the pack root", () => {
    const anchorFen = "4k3/8/8/8/8/8/7P/4K3 w - - 0 1";
    const document = {
      id: "bare-fen-anchor",
      start: { fen: "4k3/8/8/8/8/8/7P/3K4 w - - 0 1", side: "white" },
      spine: [],
      deviations: [{ at: { fen: anchorFen }, moveUci: "h2h3", class: "tactical_error" }],
    } as unknown as DrillPackDefinition;
    const common = {
      kind: "engine_eval" as const,
      sourceId: "engine",
      retrievedAt: "2026-08-16T00:00:00.000Z",
      grounds: "machine_validation" as const,
    };
    const records: readonly EvidenceRecord[] = [
      { ...common, anchor: { fen: document.start.fen }, values: { engineId: "sf", engineVersion: "18", depth: 22, multiPv: 1, centipawns: 500 }, supports: ["/start/fen"] },
      { ...common, anchor: { fen: anchorFen }, values: { engineId: "sf", engineVersion: "18", depth: 22, multiPv: 1, centipawns: 100 }, supports: ["/start/fen"] },
      { ...common, anchor: { fen: after(anchorFen, "h2h3") }, values: { engineId: "sf", engineVersion: "18", depth: 22, multiPv: 1, centipawns: 20 }, supports: ["/deviations/0/moveUci"] },
    ];
    expect(deriveDeviationCost(document, records, 0, "engine")).toEqual({
      kind: "cp",
      loss: 80,
      basis: "engine",
    });
  });

  it("does not overwrite a cost from the other machine pipeline", async () => {
    const pack = structuredClone(await fixture()) as DrillPackDefinition;
    (pack.deviations![0] as { cost?: unknown }).cost = {
      kind: "category",
      from: "win",
      to: "draw",
      basis: "tablebase",
    };
    expect(stampDeviationCosts(pack, pair(pack, 55), "engine")).toBe(0);
    expect(pack.deviations![0]!.cost).toEqual({
      kind: "category",
      from: "win",
      to: "draw",
      basis: "tablebase",
    });
  });

  it("refuses a hand-declared machine cost outside the nearest-ten tolerance", async () => {
    const pack = structuredClone(await fixture()) as DrillPackDefinition;
    (pack.deviations![0] as { cost?: unknown }).cost = { kind: "cp", loss: 22, basis: "engine" };
    expect(() => stampDeviationCosts(pack, pair(pack, 40), "engine"))
      .toThrow(/contradicts the measured/);
  });
});
