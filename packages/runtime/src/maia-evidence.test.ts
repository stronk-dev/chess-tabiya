import { describe, expect, it } from "vitest";

import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";

const engine = Object.freeze({
  id: "maia2",
  name: "Maia",
  version: "2",
  seedHonored: true,
});

describe("Maia candidate WDL evidence", () => {
  it("retains the reported per-candidate triple without widening it into policy evidence", () => {
    const result = invokeEvidenceValueRoute("human.maia.candidate_wdl@1", { page: {
      nodeId: "root",
      engine,
      targetElo: 1600,
      candidates: [
        { moveUci: "e2e4", rank: 1, wdl: { win: 431, draw: 337, loss: 232 } },
        { moveUci: "d2d4", rank: 2 },
      ],
    } });

    expect(result.kind).toBe("available");
    const declared = result.kind === "available" ? result.value : undefined;
    expect(declared?.projection).toEqual({ id: "human.maia.candidate_wdl", version: 1 });
    expect(declared?.payload).toEqual({
      nodeId: "root",
      engine,
      targetElo: 1600,
      candidates: [{ moveUci: "e2e4", rank: 1, wdl: { win: 431, draw: 337, loss: 232 } }],
    });
    expect((declared?.payload as { candidates: readonly object[] }).candidates[0]).not.toHaveProperty("mass");
  });

  it("declares typed absence when the provider reports no candidate WDL", () => {
    expect(invokeEvidenceValueRoute("human.maia.candidate_wdl@1", { page: {
      nodeId: "root",
      engine,
      targetElo: 1600,
      candidates: [{ moveUci: "e2e4", rank: 1 }],
    } })).toEqual({ kind: "unavailable", reason: "empty_population" });
  });

  it("refuses an open page shape before the factory runs", () => {
    expect(() => invokeEvidenceValueRoute("human.maia.candidate_wdl@1", { page: { nodeId: "root", engine, targetElo: 1600, candidates: [], extra: true } } as never)).toThrow(/refused its authority inputs/u);
  });
});
