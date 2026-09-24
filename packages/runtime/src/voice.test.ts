import { describe, expect, it } from "vitest";

import { EVIDENCE_CONTRACT_DECLARATIONS } from "./evidence-catalog.js";
import { compileEvidenceManifest, evidenceForConsumer, renderEvidenceItems } from "./evidence-contract.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import { judgementWordsOutsideGrounding, renderRecordedReading, ungroundedResidue, voiceCheck } from "./voice.js";

describe("licence-by-span for judgement words ([[D1409]])", () => {
  const grade = "Mistake — the recorded evaluation moved +1.00 (59.1%) → −1.00 (40.9%) across this move, a drop of 18.2 win-points against a threshold of 10 (grade-convention@1/review).";
  const view = (() => {
    const manifest = compileEvidenceManifest(EVIDENCE_CONTRACT_DECLARATIONS);
    const evidence = invokeEvidenceValueRoute("pack.authored.claim@1", { item: { kind: "annotation", id: "d1409-fixture", text: "Grade fixture.", revealedBy: { kind: "fixture", eventSeq: 1 } } })[0]!;
    const admitted = evidenceForConsumer(manifest, { id: "guidance.voice", version: 1 }, [evidence]);
    return renderEvidenceItems(admitted, { "pack.authored.claim@1": () => [grade, "The evaluation is losing for the side to move."] });
  })();

  it("reproduces [[D1406]] as red: one grade sentence no longer licenses its word across the output", () => {
    expect(voiceCheck(view, "That was a blunder and a mistake; the plan was bad.").violations).toEqual(expect.arrayContaining(["judgement:bad", "judgement:blunder", "judgement:mistake"]));
  });

  it("admits a judgement word only by quoting the exact grounding sentence, byte for byte", () => {
    expect(voiceCheck(view, `Here is the record. ${grade}`).valid).toBe(true);
    expect(voiceCheck(view, `${grade} So it was a mistake.`).violations).toContain("judgement:mistake");
    expect(voiceCheck(view, grade.replace("—", "-")).violations).toContain("judgement:mistake");
    expect(voiceCheck(view, grade.toLowerCase()).violations).toContain("judgement:mistake");
  });

  it("bans a word licensed by another sentence of the same packet outside that sentence", () => {
    expect(voiceCheck(view, "The evaluation is losing for the side to move.").violations).not.toContain("judgement:losing");
    expect(voiceCheck(view, "Black is losing.").violations).toContain("judgement:losing");
  });

  it("takes the longest byte-exact span at each position and leaves the rest as residue", () => {
    expect(ungroundedResidue(["good", "good line"], "a good line").trim()).toBe("a");
    expect(judgementWordsOutsideGrounding(["It was bad."], "It was bad. It was bad")).toEqual(["bad"]);
  });
});

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
