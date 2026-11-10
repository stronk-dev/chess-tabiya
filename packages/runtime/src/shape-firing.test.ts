import { describe, expect, it, vi } from "vitest";
import { declareShapeFiringEvidence, shapeFirings, type ShapeTriggerSource } from "./shape-firing.js";
import { consumeShapeFiring, shapeFiringEvidence } from "./shape-presentation.js";
import { evidenceForConsumer } from "./evidence-contract.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { presentedItemOwner, presentedSentence } from "./presentation-contract.js";
import * as presentation from "./presentation-contract.js";
import { createRun, commitMove } from "./runtime.js";
import { branchPath } from "./branch-path.js";
import { mirrorSemanticFen, mirrorSemanticUci } from "./semantic-validation.js";

const openA: ShapeTriggerSource = { id: "a", trigger: { kind: "feature", feature: { kind: "open_file", file: "a" } } };
const openB: ShapeTriggerSource = { id: "b", trigger: { kind: "feature", feature: { kind: "open_file", file: "b" } } };
const initial = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const aOpen = "rnbqkbnr/1ppppppp/8/8/8/8/1PPPPPPP/RNBQKBNR w KQkq - 0 1";
const bothOpen = "rnbqkbnr/2pppppp/8/8/8/8/2PPPPPP/RNBQKBNR w KQkq - 0 1";

describe("shapeFirings", () => {
  it("returns maximal edge-triggered spans in canonical entry order", () => {
    const path = [
      { id: "n0", fen: initial }, { id: "n1", fen: aOpen }, { id: "n2", fen: bothOpen },
      { id: "n3", fen: initial }, { id: "n4", fen: aOpen },
    ];
    expect(shapeFirings([openB, openA], path)).toEqual([
      { entryId: "a", firstNodeId: "n1", lastNodeId: "n2", openEnded: false },
      { entryId: "a", firstNodeId: "n4", lastNodeId: "n4", openEnded: true },
      { entryId: "b", firstNodeId: "n2", lastNodeId: "n2", openEnded: false },
    ]);
    expect(shapeFirings([openA, openB], path)).toEqual(shapeFirings([openB, openA], path));
  });

  it("contains no ranking or valence fields", () => {
    expect(JSON.stringify(shapeFirings([openA], [{ id: "n", fen: aOpen }]))).not.toMatch(/score|rank|severity|favours/);
  });

  it("admits detected spans at the theory consumer boundary", () => {
    const firings = shapeFirings([openA], [{ id: "n", fen: aOpen }]);
    const sources = declareShapeFiringEvidence([openA], [{ id: "n", fen: aOpen }]);
    const view = evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "theory.shape_firing", version: 1 }, sources);
    const delivered = consumeShapeFiring(view);
    expect(delivered.map(entry => entry.firing)).toEqual(firings);
    expect(shapeFiringEvidence([openA], [{ id: "n", fen: aOpen }]).map(entry => entry.firing)).toEqual(firings);
    expect(delivered[0]!.presentation.kind).toBe("ready");
    if (delivered[0]!.presentation.kind !== "ready") throw new Error("Expected registered recognition");
    expect(delivered[0]!.presentation.items).toHaveLength(1);
    expect(presentedItemOwner(delivered[0]!.presentation.items[0]!)).toBe(sources[0]);
    expect(presentedSentence(delivered[0]!.presentation.items[0]!)).toContain("A");
    // Firings are recomputed from the registered trigger and recorded path; none fires on a closed file.
    expect(shapeFiringEvidence([openA], [{ id: "n", fen: initial }])).toEqual([]);
    if (false) {
      // @ts-expect-error Shape delivery refuses a bare firing list.
      consumeShapeFiring(firings);
    }
  });
  it.each([false, true])("retains both genuine recorded spans and every original owner, black=%s", black => {
    const at = "2026-11-03T00:00:00.000Z";
    const fen = "7k/8/8/8/1n6/n7/1P6/7K w - - 0 1";
    let run = createRun({ id: `shape-spans-${black}`, packId: "p", packDigest: `sha256:${"a".repeat(64)}`,
      startFen: black ? mirrorSemanticFen(fen, "color_and_vertical") : fen, seed: 1, createdAt: at,
      policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } } });
    for (const move of ["b2a3", "h8g8", "a3b4"]) run = commitMove(run, black ? mirrorSemanticUci(move, "color_and_vertical") : move, { at }).run;
    const path = branchPath(run, run.activeCursor.branchId), saved = JSON.stringify(run);
    const a = declareShapeFiringEvidence([openA], path), b = declareShapeFiringEvidence([openA], path);
    expect(a.map(item => item.payload)).toEqual([
      { entryId: "a", firstNodeId: path[0]!.id, lastNodeId: path[0]!.id, openEnded: false },
      { entryId: "a", firstNodeId: path[3]!.id, lastNodeId: path[3]!.id, openEnded: true },
    ]);
    expect(a[0]).not.toBe(b[0]); expect(a[0]!.payload).toEqual(b[0]!.payload);
    const input = [a[1]!, a[0]!, b[0]!, a[0]!];
    const delivered = consumeShapeFiring(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "theory.shape_firing", version: 1 }, input));
    expect(delivered).toHaveLength(4);
    delivered.forEach((entry, index) => {
      expect(entry.firing).toBe(input[index]!.payload);
      if (entry.presentation.kind !== "ready") throw new Error("Expected registered recognition");
      expect(entry.presentation.items).toHaveLength(1);
      expect(presentedItemOwner(entry.presentation.items[0]!)).toBe(input[index]);
      expect(presentation.parsePresentationReceipt(presentation.serializePresentedEvidence(entry.presentation.items))).toHaveLength(1);
    });
    expect(JSON.stringify(run)).toBe(saved);
  });

  it("keeps known formatting failure local, while propagating other failures", () => {
    const sources = declareShapeFiringEvidence([openA, openB], [{ id: "n", fen: bothOpen }]);
    const view = evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "theory.shape_firing", version: 1 }, sources);
    const spy = vi.spyOn(presentation, "presentEvidenceItems");
    try {
      spy.mockImplementationOnce(() => { throw new presentation.PresentationError("PRESENTATION_INVALID", "fixture recognition formatting"); });
      const delivered = consumeShapeFiring(view);
      expect(delivered[0]).toEqual({ firing: sources[0]!.payload, presentation: { kind: "failed" } });
      if (delivered[1]!.presentation.kind !== "ready") throw new Error("Valid sibling must remain available");
      expect(presentedItemOwner(delivered[1]!.presentation.items[0]!)).toBe(sources[1]);
      for (const error of [new Error("fixture programming error"), ...(["PRESENTATION_RAW_ID", "PRESENTATION_UNSEALED", "PRESENTATION_UNREGISTERED"] as const)
        .map(code => new presentation.PresentationError(code, "fixture contract failure"))]) {
        spy.mockImplementationOnce(() => { throw error; });
        expect(() => consumeShapeFiring(view)).toThrow(error);
      }
    } finally { spy.mockRestore(); }
  });

  it("refuses bare firing lists and sealed views for a different consumer", () => {
    const firings = shapeFirings([openA], [{ id: "n", fen: aOpen }]);
    // @ts-expect-error The runtime must also refuse a bare payload list.
    expect(() => consumeShapeFiring(firings)).toThrow();
    const wrong = evidenceForConsumer<import("./shape-firing.js").ShapeFiring>(PRIMARY_EVIDENCE_MANIFEST, { id: "guidance.deterministic", version: 1 }, []);
    expect(() => consumeShapeFiring(wrong)).toThrow(/theory.shape_firing@1/u);
  });
});
