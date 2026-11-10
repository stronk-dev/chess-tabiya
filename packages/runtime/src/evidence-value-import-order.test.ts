import { describe, expect, it, vi } from "vitest";

describe("D4073 real factory/dispatcher import cycle", () => {
  it.each(["factories-first", "dispatcher-first"] as const)("keeps the complete registry and all reduction identities under %s", async order => {
    vi.resetModules();
    if (order === "factories-first") await import("./evidence-factories.js");
    const routes = await import("./internal/evidence-value-routes.js");
    const factories = await import("./evidence-factories.js");
    const reductions = await import("./evidence-reduction-contract.js");
    // Inspect first: the records themselves must not capture uninitialized factory constants.
    for (const contract of [reductions.COMPARISON_REDUCTION_CONTRACT, reductions.LAST_LEVEL_REDUCTION_CONTRACT,
      reductions.STORY_RANK_REDUCTION_CONTRACT, reductions.OPENING_HISTORY_REDUCTION_CONTRACT]) {
      const first = routes.inspectEvidenceReductionBinding(contract.operation);
      expect(first.identity).toBe(contract);
      expect(first.factory.name).toBe(contract.factory);
      expect(typeof first.reader).toBe("function");
      expect(typeof first.computation).toBe("function");
      expect(routes.inspectEvidenceReductionBinding(contract.operation)).toBe(first);
    }
    const { PRIMARY_EVIDENCE_MANIFEST } = await import("./evidence-catalog.js");
    const expected = PRIMARY_EVIDENCE_MANIFEST.projections.filter(value => value.disposition?.kind !== "retired").map(value => `${value.id}@${value.version}`).sort();
    const metadata = routes.evidenceValueRouteRegistry();
    expect(metadata.map(value => value.route).sort()).toEqual(expected);
    expect(metadata.every(value => typeof value.symbol === "string" && value.symbol.length > 0)).toBe(true);
    const root = routes.invokeEvidenceValueRoute("rules.mobility.reading.legal_moves@1", { fen: "4k3/8/8/8/8/8/8/4K3 w - - 0 1" });
    const receipt = (await import("./evidence-contract.js")).evidenceValueReceipt(root);
    expect(receipt.factory).toBe(factories.evidenceFactorySymbol("rules.mobility.reading.legal_moves@1"));
    expect(root.payload.turn).toBe("white");
    expect(root.payload.pieces.some(piece => piece.moves.length > 0)).toBe(true);
    expect(() => routes.invokeEvidenceValueRoute("rules.mobility.reading.legal_moves@1", { fen: 7 } as never)).toThrow();
  });
});
