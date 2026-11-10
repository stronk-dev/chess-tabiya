// DISPOSABLE D4200 research: the original policy measurement is retained in the dossier/log;
// this replay checks the accepted source-local repair, not source qualification or a CI gate.
import { describe, expect, it, vi } from "vitest";
import { CANDIDATE_WIDE_SCOPE, compileCandidatePopulation, readCandidateFoundationSources } from "../../packages/runtime/src/candidate-population.js";
import { assertDeclaredEvidence } from "../../packages/runtime/src/evidence-contract.js";
import { invokeEvidenceValueRoute } from "../../packages/runtime/src/internal/evidence-value-routes.js";
import * as routes from "../../packages/runtime/src/internal/evidence-value-routes.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "../../packages/runtime/src/evidence-catalog.js";
import { selectSemanticEvidence } from "../../packages/runtime/src/semantic-evidence.js";
import { mirrorSemanticFen, mirrorSemanticUci } from "../../packages/runtime/src/semantic-validation.js";
import { prepareRecordedSemanticWindowPopulation, collectRecordedSequenceWindow, readRecordedSequenceWindow } from "../../packages/runtime/src/recorded-sequence-window.js";
import { recordedSequenceWindowFixture } from "../../packages/runtime/src/testing/recorded-sequence-window-fixture.js";

describe("D4200 source-local availability versus global canonical abstentions", () => {
  it.each([false, true])("D4210 measures unacquired trade coverage separately from a genuine recorded trade (mirrored=%s)", mirrored => {
    const fen = "4k3/8/4p3/3p4/4P3/8/8/4K3 w - - 0 1", moves = ["e4d5", "e6d5"] as const;
    const beforeFen = mirrored ? mirrorSemanticFen(fen, "color_and_vertical") : fen;
    const moveUci = mirrored ? mirrorSemanticUci(moves[0], "color_and_vertical") : moves[0];
    const calls = vi.spyOn(routes, "invokeEvidenceValueRoute");
    let legalMembers = 0;
    try {
      const compiled = compileCandidatePopulation({ beforeFen, ruleset: "standard", scope: CANDIDATE_WIDE_SCOPE });
      if (compiled.kind !== "ready") throw Error("Actual original candidate fixture required");
      legalMembers = compiled.receipt.packet.candidates.length;
      const selected = selectSemanticEvidence(PRIMARY_EVIDENCE_MANIFEST, { id: "research.r2_candidate", version: 3 }, { receipt: compiled.receipt, moveUci });
      expect(selected.coverage.sources).toContainEqual({ id: "derived.exchange.trade_completed", version: 1 });
      expect(selected.coverage.unavailable).toEqual([]);
      expect(calls.mock.calls.filter(([route]) => route.startsWith("derived.exchange.trade_completed@"))).toHaveLength(0);
      expect(calls.mock.calls.some(([route]) => route === "derived.exchange.capture_class@1")).toBe(true);
    } finally { calls.mockRestore(); }
    const run = recordedSequenceWindowFixture({ fen, moves }, mirrored, `trade-coverage-${mirrored}`);
    const prepared = prepareRecordedSemanticWindowPopulation({ run, branchId: run.activeCursor.branchId,
      throughNodeId: run.activeCursor.nodeId, routes: ["derived.exchange.trade_completed@2"] }).get("derived.exchange.trade_completed@2")!;
    expect(prepared.windows.length).toBeGreaterThan(0);
    const values = prepared.windows.flatMap(window => {
      expect(readRecordedSequenceWindow(window).edges).toHaveLength(2);
      return collectRecordedSequenceWindow(window);
    });
    expect(values.length).toBeGreaterThan(0);
    for (const value of values) assertDeclaredEvidence(value);
    console.log(JSON.stringify({ question: "D4210", mirrored, legalMembers, declaredTradeCoverage: "available",
      actualOneEdgeTradeAcquisitions: 0, genuineRecordedTradeEdges: 2, genuineRecordedTrades: values.length,
      scope: "Executed completeness-image counterexample; not a production correction or current qualification." }));
  });

  it("retains a genuine missing required risk source separately from complete arithmetic and empty own pieces", () => {
    const beforeFen = "7k/8/8/8/8/8/8/r6K w - - 0 1";
    const compiled = compileCandidatePopulation({ beforeFen, ruleset: "standard", scope: CANDIDATE_WIDE_SCOPE });
    if (compiled.kind !== "ready") throw Error(JSON.stringify(compiled.error));
    const receipt = compiled.receipt, frame = readCandidateFoundationSources(receipt);
    expect(receipt.packet.candidates.map(row => row.moveUci).sort()).toEqual(["h1g2", "h1h2"]);
    expect(frame.root.risk).toEqual({ kind: "unavailable", reason: "invalid_turn_clone" });
    for (const position of [frame.root, ...frame.candidates.map(row => row.position)]) {
      for (const source of [...position.common, ...position.totals.counts]) assertDeclaredEvidence(source);
      expect(position.totals.counts).toHaveLength(12);
    }
    for (const child of frame.candidates) {
      expect(child.position.risk.kind).toBe("available");
      if (child.position.risk.kind !== "available") throw Error("Actual available child risk required");
      expect(child.position.risk.value.payload.pieces).toEqual([]);
    }
    const result = invokeEvidenceValueRoute("derived.semantic_avoidance.loose_piece@2", {
      receipt, moveUci: "h1h2",
    });
    expect(result).toEqual({ kind: "unavailable", reason: "counterfactual_population_incomplete" });
    console.log(JSON.stringify({ question: "D4200", beforeFen, legalMembers: 2, completeArithmeticPositions: 3,
      rootRisk: frame.root.risk.kind, childRisks: frame.candidates.map(row => row.position.risk.kind),
      scope: "Real required root-risk failure stays unknown despite an empty own-piece domain; available child empties do not repair the missing root." }));
  });

  it("measures complete original arithmetic vectors on a legal discovered-check pawn capture", () => {
    const beforeFen = "k7/8/8/8/8/1p6/PP6/R6K w - - 0 1", moveUci = "a2b3";
    const compiled = compileCandidatePopulation({ beforeFen, ruleset: "standard", scope: CANDIDATE_WIDE_SCOPE });
    if (compiled.kind !== "ready") throw Error(JSON.stringify(compiled.error));
    const receipt = compiled.receipt, frame = readCandidateFoundationSources(receipt);
    const positions = [frame.root, ...frame.candidates.map(row => row.position)];
    expect(receipt.packet.candidates).toHaveLength(12);
    const played = receipt.packet.candidates.find(row => row.moveUci === moveUci)!;
    expect(played.afterFen).toBe("k7/8/8/8/8/1P6/1P6/R6K b - - 0 1");
    expect(played.abstentions.length).toBeGreaterThan(0);
    for (const position of positions) {
      for (const source of [position.common[0], position.common[1], position.common[4], position.common[5], ...position.totals.counts]) assertDeclaredEvidence(source);
      expect(position.common[1].payload.colors).toHaveLength(2);
      expect(position.common[5].payload.files).toHaveLength(8);
      expect(position.totals.counts).toHaveLength(12);
    }
    const familyResults = ["doubled_pawn", "isolated_pawn", "open_file", "half_open_file", "pawn_islands", "piece_count", "loose_piece"] as const;
    const results = familyResults.map(family => ({ family,
      result: invokeEvidenceValueRoute(`derived.semantic_avoidance.${family}@2`, { receipt, moveUci }) }));
    // Source-local availability is now independently accepted in its own RFC. These complete
    // vectors must survive the unrelated legacy event failure; the root-risk control stays red.
    for (const { result } of results) expect(result.kind).toBe("available");
    console.log(JSON.stringify({ question: "D4200", beforeFen, moveUci, legalMembers: receipt.packet.candidates.length,
      completePositions: positions.length, completeSourcesPerPosition: { legal: 1, connectivity: 1, group: 1, fileState: 1, counts: 12 },
      canonicalAbstentions: receipt.packet.candidates.flatMap(row => row.abstentions.map(value => ({ move: row.moveUci, ...value }))),
      riskUnavailablePositions: positions.filter(position => position.risk.kind === "unavailable").length,
      outcomes: results.map(({ family, result }) => ({ family, kind: result.kind })),
      scope: "Accepted source-local repair preserves the original complete vectors despite the unrelated legacy event failure. No selector activation or invented risk value." }));
  });
});
