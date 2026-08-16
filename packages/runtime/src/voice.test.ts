import { describe, expect, it } from "vitest";

import { renderRecordedReading } from "./voice.js";

describe("recorded-reading sentences", () => {
  it("renders attributed engine and tablebase values without move tokens", () => {
    const engine = renderRecordedReading({
      kind: "engine_eval",
      fen: "8/8/8/8/8/8/8/K6k w - - 0 1",
      sourceId: "stockfish-authoring",
      retrievedAt: "2026-08-15T12:00:00.000Z",
      values: { centipawns: 63, depth: 22, multiPv: 1, perspective: "white", engineId: "stockfish-authoring", engineName: "Stockfish", engineVersion: "18" },
    });
    const tablebase = renderRecordedReading({
      kind: "tablebase_result",
      fen: "8/8/8/8/8/8/8/K6k w - - 0 1",
      sourceId: "syzygy",
      retrievedAt: "2026-08-15T12:00:00.000Z",
      values: { category: "loss", dtz: -8, preciseDtz: -8, dtm: -28, pieceCount: 5, checkmate: false, stalemate: false, insufficientMaterial: false },
    });
    expect(engine).toEqual(["Recorded reading at this position: Stockfish 18 at depth 22, single line, scored +0.63 from White's side when this pack was authored on 2026-08-15."]);
    expect(tablebase).toEqual(["Recorded reading at this position: Syzygy, 5 pieces — loss from White's side, DTZ 8, DTM 28 — queried when this pack was authored on 2026-08-15."]);
    for (const sentence of [...engine, ...tablebase]) {
      expect(sentence).not.toMatch(/[a-h][1-8]/i);
      expect(sentence).not.toMatch(/\b[a-h][1-8][a-h][1-8][qrbn]?\b/i);
    }
  });

  it("has no absence arm", () => {
    expect(renderRecordedReading.toString()).not.toMatch(/no reading|none recorded|not queried|unavailable/i);
  });

  it("does not manufacture a zero distance when Syzygy published no distance", () => {
    const sentence = renderRecordedReading({
      kind: "tablebase_result",
      fen: "8/8/8/8/8/8/8/K6k w - - 0 1",
      sourceId: "syzygy",
      retrievedAt: "2026-08-15T12:00:00.000Z",
      values: { category: "draw", dtz: null, preciseDtz: null, dtm: null, pieceCount: 2, checkmate: false, stalemate: false, insufficientMaterial: true },
    }).join(" ");
    expect(sentence).not.toContain("DTZ");
    expect(sentence).not.toContain("DTM");
  });
});
