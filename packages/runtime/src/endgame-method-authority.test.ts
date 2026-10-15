// F2 D5: exercise the actual method factory's path boundary, not just a generic edge helper.
// No corpus, provider, UI eligibility, new projection or convention is introduced here.
import { describe, expect, it } from "vitest";

import { branchPath } from "./branch-path.js";
import { evidenceDigest, evidenceValueReceipt, identitySealedEvidenceWithoutValueReceipt,
  type DeclaredEvidence } from "./evidence-contract.js";
import { endgameMethodConvention } from "./endgame-method.js";
import type { EndgameMethodStageAvailability } from "./evidence-factories.js";
import { invokeEvidenceValueRoute as invoke } from "./internal/evidence-value-routes.js";
import type { RecordedEdge } from "./recorded-edge.js";
import { commitMove, createRun } from "./runtime.js";
import { mirrorSemanticFen, mirrorSemanticUci } from "./semantic-validation.js";

const at = "2026-10-15T00:00:00.000Z";
const cases = [
  { id: "lucena", fen: "1K6/1P1k4/8/8/8/8/r7/2R5 w - - 0 1",
    moves: ["c1d1", "d7e7", "d1d4", "a2a1", "b8c7", "a1c1", "c7b6", "c1b1", "b6c6", "b1c1", "c6b5", "c1b1", "d4b4"],
    setup: "lucena-setup", method: "lucena-bridge-method", beneficiary: "white", stages: 3 },
  { id: "philidor", fen: "4k3/R7/7r/4K3/4P3/8/8/8 b - - 0 1",
    moves: ["h6b6", "e5d5", "b6g6", "e4e5", "g6b6", "e5e6", "b6b1", "d5d6", "b1d1"],
    setup: "philidor-third-rank-setup", method: "philidor-third-rank-method", beneficiary: "black", stages: 3 },
  { id: "vancura", fen: "R7/6k1/P4r2/8/2K5/8/8/8 w - - 0 1",
    moves: ["a6a7", "f6a6"], setup: "vancura-setup", method: "vancura-method", beneficiary: "black", stages: 2 },
] as const;

function edgesFor(id: string, fen: string, moves: readonly string[]): readonly DeclaredEvidence<RecordedEdge>[] {
  let run = createRun({ id, packId: "method-source-fixture", packDigest: `sha256:${"e".repeat(64)}`,
    startFen: fen, seed: 1, createdAt: at,
    policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } } });
  for (const move of moves) run = commitMove(run, move, { at }).run;
  const path = branchPath(run, run.activeCursor.branchId);
  return path.slice(1).map((child, index) => invoke("run.record.edge@1", { run, parent: path[index]!, child }));
}

function setupFor(fen: string, id: string): DeclaredEvidence<unknown> {
  const result = invoke("theory.endgame.setup_match@1", { fen, convention: { id, version: 1 } });
  if (result.kind !== "available") throw new TypeError("Expected genuine positive setup fixture");
  return result.value;
}

function available(result: EndgameMethodStageAvailability) {
  expect(result.kind).toBe("available");
  if (result.kind !== "available") throw new TypeError("Expected actual method stages");
  return result.value;
}

describe("endgame method factory exact recorded-path authority (F2 D5)", () => {
  for (const fixture of cases) for (const mirrored of [false, true]) {
    const label = `${fixture.id}:${mirrored ? "color-mirrored" : "original"}`;
    const fen = mirrored ? mirrorSemanticFen(fixture.fen, "color_and_vertical") : fixture.fen;
    const moves = mirrored ? fixture.moves.map(move => mirrorSemanticUci(move, "color_and_vertical")) : fixture.moves;
    const convention = { id: fixture.method, version: 1 };

    it(`${label}: retains each exact stage prefix and selected convention, not one arbitrary edge`, () => {
      const setup = setupFor(fen, fixture.setup), edges = edgesFor(label, fen, moves);
      const method = endgameMethodConvention(convention)!;
      const stages = available(invoke("theory.endgame.method_stage@1", { setup, edges, convention }));
      expect(stages).toHaveLength(fixture.stages);
      const beneficiary = mirrored ? (fixture.beneficiary === "white" ? "black" : "white") : fixture.beneficiary;
      for (const stage of stages) {
        const end = edges.findIndex(edge => edge.payload.afterNodeId === stage.payload.endNodeId);
        expect(end).toBeGreaterThanOrEqual(0);
        const prefix = edges.slice(0, end + 1), trigger = prefix.at(-1)!.payload;
        expect(stage.payload).toMatchObject({ pathId: label, beneficiary, convention,
          startNodeId: edges[0]!.payload.beforeNodeId, endNodeId: trigger.afterNodeId,
          edgeIds: prefix.map(edge => `${edge.payload.beforeNodeId}>${edge.payload.afterNodeId}`),
          beforeFen: trigger.beforeFen, afterFen: trigger.afterFen, triggeringUci: trigger.moveUci });
        const receipt = evidenceValueReceipt(stage);
        expect(receipt.sourceDigests).toEqual([
          evidenceValueReceipt(setup).payloadDigest,
          ...prefix.map(edge => evidenceValueReceipt(edge).payloadDigest), evidenceDigest(method),
        ]);
        expect(receipt.convention!.refs.map(ref => `${ref.id}@${ref.version}`).sort()).toEqual([
          `${fixture.setup}@1`, `${fixture.method}@1`,
        ].sort());
        expect(available(invoke("theory.endgame.method_stage@1", { setup, edges: prefix, convention })).at(-1))
          .toEqual(stage);
      }
      // Static setup is node-free: equal genuine FEN authority may be reused, not mislabeled foreign-run failure.
      expect(available(invoke("theory.endgame.method_stage@1", {
        setup: setupFor(fen, fixture.setup), edges, convention,
      }))).toEqual(stages);
    });

    it(`${label}: refuses genuine crossed runs, order, gaps, repeats and forged sources`, () => {
      const setup = setupFor(fen, fixture.setup), edges = edgesFor(label, fen, moves);
      const foreign = edgesFor(`${label}:other-run`, fen, moves);
      const call = (values: readonly DeclaredEvidence<unknown>[], source = setup) =>
        invoke("theory.endgame.method_stage@1", { setup: source, edges: values, convention });
      expect(() => call([edges[0]!, foreign[1]!, ...edges.slice(2)])).toThrow(/different runs/u);
      expect(() => call([edges[1]!, edges[0]!, ...edges.slice(2)])).toThrow(/contiguous/u);
      expect(() => call([edges[0]!, edges[0]!, ...edges.slice(1)])).toThrow(/contiguous/u);
      expect(() => call([...edges, edges.at(-1)!])).toThrow(/contiguous/u);
      if (edges.length > 2) expect(() => call([edges[0]!, ...edges.slice(2)])).toThrow(/contiguous/u);
      expect(() => call(edges.slice(1))).toThrow(/exact start/u);
      const fakeEdge = identitySealedEvidenceWithoutValueReceipt(edges[0]!.producer, edges[0]!.projection, edges[0]!.payload);
      expect(() => call([fakeEdge, ...edges.slice(1)])).toThrow(/value-authority receipt/u);
      const fakeSetup = identitySealedEvidenceWithoutValueReceipt(setup.producer, setup.projection, setup.payload);
      expect(() => call(edges, fakeSetup)).toThrow(/value-authority receipt/u);
      // Bad path must fail before the unregistered-convention shortcut, not become unavailable.
      expect(() => invoke("theory.endgame.method_stage@1", {
        setup, edges: [edges[0]!, foreign[1]!], convention: { ...convention, version: 2 },
      })).toThrow(/different runs/u);
      expect(invoke("theory.endgame.method_stage@1", { setup, edges, convention: { ...convention, version: 2 } }))
        .toMatchObject({ kind: "unavailable", dependency: "semantic-convention-provenance" });
    });
  }

  it("validates the whole supplied path before a material-domain exit can hide a corrupt later edge", () => {
    const fen = cases[2].fen, moves = ["a6a7", "f6a6", "c4b5", "a6a7", "b5c5"];
    const setup = setupFor(fen, "vancura-setup"), convention = { id: "vancura-method", version: 1 };
    const edges = edgesFor("method-domain-exit", fen, moves), foreign = edgesFor("method-domain-exit:other", fen, moves);
    const prefix = available(invoke("theory.endgame.method_stage@1", { setup, edges: edges.slice(0, 2), convention }));
    expect(available(invoke("theory.endgame.method_stage@1", { setup, edges, convention }))).toEqual(prefix);
    expect(() => invoke("theory.endgame.method_stage@1", {
      setup, edges: [...edges.slice(0, -1), foreign.at(-1)!], convention,
    })).toThrow(/different runs/u);
  });
});
