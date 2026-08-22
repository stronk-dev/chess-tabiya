import { describe, expect, it } from "vitest";

import { declareMaiaCandidateWdlEvidence } from "./evidence-source-adapters.js";

const engine = Object.freeze({
  id: "maia2",
  name: "Maia",
  version: "2",
  seedHonored: true,
});

describe("Maia candidate WDL evidence", () => {
  it("retains the reported per-candidate triple without widening it into policy evidence", () => {
    const declared = declareMaiaCandidateWdlEvidence({
      nodeId: "root",
      engine,
      targetElo: 1600,
      candidates: [
        { moveUci: "e2e4", rank: 1, wdl: { win: 431, draw: 337, loss: 232 } },
        { moveUci: "d2d4", rank: 2 },
      ],
    });

    expect(declared).toBeDefined();
    expect(declared?.projection).toEqual({ id: "human.maia.candidate_wdl", version: 1 });
    expect(declared?.payload).toEqual({
      nodeId: "root",
      engine,
      targetElo: 1600,
      candidates: [{ moveUci: "e2e4", rank: 1, wdl: { win: 431, draw: 337, loss: 232 } }],
    });
    expect(declared?.payload.candidates[0]).not.toHaveProperty("mass");
  });

  it("declares absence when the provider reports no candidate WDL", () => {
    expect(declareMaiaCandidateWdlEvidence({
      nodeId: "root",
      engine,
      targetElo: 1600,
      candidates: [{ moveUci: "e2e4", rank: 1 }],
    })).toBeUndefined();
  });
});
