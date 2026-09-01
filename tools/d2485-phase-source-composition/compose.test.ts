import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { compileLoadedOpeningCatalogue, measuredOpeningHistory, measuredPhaseSourcePoint } from "./compose.js";

const artifact = JSON.parse(readFileSync("apps/server/artifacts/runtime-opening-catalogue.json", "utf8"));
const catalogue = compileLoadedOpeningCatalogue(artifact);
const available = Object.freeze({ kind: "available" as const, catalogue });

describe("source-retaining phase composition prototype", () => {
  it("retains opening, phase, endgame and tablebase states without a merged phase", () => {
    const point = measuredPhaseSourcePoint(available, "root", "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", undefined);
    expect(point.opening.catalogueMembership.kind).toBe("absent");
    expect(point.rulesPhase.reading.phase).toBe("opening");
    expect(point.rulesEndgame).toEqual({ kind: "not_applicable" });
    expect(point.recordedTablebase).toEqual({ kind: "outside_domain", pieceCount: 32 });
    expect(point).not.toHaveProperty("phase");
  });

  it("keeps catalogue failure distinct while local rules remain available", () => {
    const unavailable = Object.freeze({ kind: "unavailable" as const, reason: "artifact_missing" as const });
    const point = measuredPhaseSourcePoint(unavailable, "root", "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", undefined);
    expect(point.opening.currentEndpoint).toMatchObject({ kind: "abstained", reason: "artifact_missing" });
    expect(point.opening.catalogueMembership).toMatchObject({ kind: "abstained", reason: "artifact_missing" });
    expect(point.rulesPhase.reading.phase).toBe("opening");
    expect(measuredOpeningHistory(unavailable, [point])).toMatchObject({ kind: "abstained", reason: "input_abstained" });
  });

  it("separates in-domain recorded absence from exact recorded tablebase evidence", () => {
    const fen = "4k3/8/8/8/8/8/4P3/4K3 w - - 0 1";
    expect(measuredPhaseSourcePoint(available, "root", fen, undefined).recordedTablebase).toEqual({ kind: "in_domain_unrecorded", pieceCount: 3 });
    expect(measuredPhaseSourcePoint(available, "root", fen, { fen, pieceCount: 3, category: "win", sourceId: "fixture" }).recordedTablebase).toEqual({ kind: "recorded", pieceCount: 3, category: "win", sourceId: "fixture" });
  });

  it("refuses a tablebase fact crossed from another FEN or domain", () => {
    const fen = "4k3/8/8/8/8/8/4P3/4K3 w - - 0 1";
    expect(() => measuredPhaseSourcePoint(available, "root", fen, { fen: "4k3/8/8/8/8/8/3P4/4K3 w - - 0 1", pieceCount: 3, category: "draw", sourceId: "fixture" })).toThrow(/does not bind/u);
  });
});
