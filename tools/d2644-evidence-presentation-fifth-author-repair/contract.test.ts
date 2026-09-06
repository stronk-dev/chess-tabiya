// DISPOSABLE fifth author repair model for D2436-D2441/D2644; not production UI code.
import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import {
  MANIFEST_PRESENTATION_REPAIRS,
  NAMED_STRUCTURE_WITNESS_AUTHORITY,
  PRESENTATION_ABSTENTION_ROWS,
  SOURCE_ATTRIBUTION_REGISTRY_RESOURCE,
  SOURCE_ATTRIBUTION_REGISTRY_SEMANTIC_IMAGE,
  STRUCTURE_PREDICATES,
  assertRegisteredPresentationQuestion,
  constructExplorerCountOperands,
  evaluateNamedStructureWithWitness,
  issueRegisteredPresentationQuestion,
  parseCitationOperand,
  presentationWorkflowQuestionAuthorityFixture,
  sourceAttributionRegistryDigest,
} from "../d1862-presentation-adapter-plan/plan.js";

describe("evidence-presentation fifth author repair", () => {
  test("D2436 the resource digest changes with every semantic resource field", () => {
    expect(SOURCE_ATTRIBUTION_REGISTRY_RESOURCE.digest)
      .toBe(sourceAttributionRegistryDigest(SOURCE_ATTRIBUTION_REGISTRY_SEMANTIC_IMAGE));
    for (const changed of [
      { ...SOURCE_ATTRIBUTION_REGISTRY_SEMANTIC_IMAGE, id: "other-registry" },
      { ...SOURCE_ATTRIBUTION_REGISTRY_SEMANTIC_IMAGE, version: 2 },
      { ...SOURCE_ATTRIBUTION_REGISTRY_SEMANTIC_IMAGE, resolver: { ...SOURCE_ATTRIBUTION_REGISTRY_SEMANTIC_IMAGE.resolver, symbol: "otherResolver" } },
      { ...SOURCE_ATTRIBUTION_REGISTRY_SEMANTIC_IMAGE, missingReceiptField: "other_absence" },
      { ...SOURCE_ATTRIBUTION_REGISTRY_SEMANTIC_IMAGE, rows: SOURCE_ATTRIBUTION_REGISTRY_SEMANTIC_IMAGE.rows.slice(1) },
    ]) expect(sourceAttributionRegistryDigest(changed)).not.toBe(SOURCE_ATTRIBUTION_REGISTRY_RESOURCE.digest);
  });

  test("D2437 a complete citation requires a non-empty revision", () => {
    const valid = {
      content: {
        kind: "authored_summary",
        text: "Measured.",
        binding: {
          projection: { id: "run.record.evidence_ref_resolution", version: 1 },
          field: "text",
          evidenceDigest: `sha256:${"0".repeat(64)}`,
        },
      },
      source: {
        source: { id: "live.stockfish.eval", version: 1 },
        title: "Stockfish engine reading",
        locator: "deployment-artifact:stockfish",
        licence: { authority: "source-attribution-registry@1", value: "GPL-3.0-only" },
        url: "https://stockfishchess.org/",
        revision: { authority: "deployment-receipt@1", value: `sha256:${"1".repeat(64)}` },
      },
    };
    expect(parseCitationOperand(valid)).toEqual(valid);
    expect(() => parseCitationOperand({ ...valid, source: { ...valid.source, revision: { ...valid.source.revision, value: "" } } })).toThrow();
    const { revision: _revision, ...withoutRevision } = valid.source;
    expect(() => parseCitationOperand({ ...valid, source: withoutRevision })).toThrow();
  });

  test("D2438/D2644 Explorer reasons are operation-derived and contain no UI guesses", () => {
    const source = readFileSync("apps/server/src/corpus.ts", "utf8");
    const resultArm = source.match(/kind: "abstention"; readonly reason: ([^;]+);/u)?.[1] ?? "";
    const operationReasons = [...resultArm.matchAll(/"([^"]+)"/gu)].map((match) => match[1]).sort();
    const row = PRESENTATION_ABSTENTION_ROWS.find((entry) =>
      entry.adapterKey === "inspector.corpus@1\0human.explorer.population@1");
    expect(row).toBeDefined();
    expect(row!.sourceReasonMap.map((entry) => entry.sourceReason).sort()).toEqual(operationReasons);
    expect(operationReasons).toEqual(["no_data_at_band", "source_unavailable"]);
    const plan = readFileSync("tools/d1862-presentation-adapter-plan/plan.ts", "utf8");
    expect(plan).not.toMatch(/const operational =/u);
    expect(MANIFEST_PRESENTATION_REPAIRS.map((entry) => entry.id)).toContain("explorer-absence-reason");
  });

  test("D2439 copied or deserialized questions lose lifecycle authority", () => {
    const adapter = "inspector.corpus@1\0human.explorer.population@1";
    const id = "question.explorer_population";
    const decision = { eventHeadSeq: 4, cursor: { branchId: "b1", nodeId: "n1" }, disclosureBoundarySeq: null, digest: "decision-1" } as const;
    const authority = presentationWorkflowQuestionAuthorityFixture({ requestId: "r1", adapterKey: adapter, questionId: id }, decision);
    const question = issueRegisteredPresentationQuestion(authority);
    expect(() => assertRegisteredPresentationQuestion(question, adapter, id, "r1", decision)).not.toThrow();
    for (const copy of [
      { ...question, label: "Play the engine move." },
      structuredClone(question),
      JSON.parse(JSON.stringify(question)),
    ]) expect(() => assertRegisteredPresentationQuestion(copy, adapter, id, "r1", decision)).toThrow();
  });

  test("D2440 structure matching and witnesses have one expression authority", () => {
    expect(NAMED_STRUCTURE_WITNESS_AUTHORITY.expression.symbol).toBe("STRUCTURE_PREDICATES");
    expect(NAMED_STRUCTURE_WITNESS_AUTHORITY.operation.symbol).toBe("evaluateNamedStructureWithWitness");
    expect(NAMED_STRUCTURE_WITNESS_AUTHORITY).not.toHaveProperty("rows");
    const fen = "4k3/8/3p4/8/2P1P3/8/8/4K3 w - - 0 1";
    expect(evaluateNamedStructureWithWitness(fen, "maroczy-bind")?.squares).toEqual(["c4", "e4"]);
    const changed = {
      ...STRUCTURE_PREDICATES,
      "maroczy-bind": { kind: "all" as const, of: [
        { kind: "pieceOnSquare" as const, square: "d4" as const, piece: { color: "white" as const, role: "pawn" as const } },
        ...STRUCTURE_PREDICATES["maroczy-bind"].of.slice(1),
      ] as const },
    };
    expect(evaluateNamedStructureWithWitness(fen, "maroczy-bind", changed)).toBeNull();
  });

  test("D2441 Explorer uses unique canonical UCI while retaining SAN only for display", () => {
    const base = {
      nodeId: "n1",
      committedMoveUci: "e2e4",
      result: { kind: "stats" as const, total: 100, moves: [{ san: "e4!", uci: "e2e4", playedCount: 60, white: 30, draws: 10, black: 20 }] },
    };
    expect(constructExplorerCountOperands(base)[0]).toMatchObject({ candidate: { san: "e4!", uci: "e2e4" }, committedMove: true });
    expect(() => constructExplorerCountOperands({ ...base, result: { ...base.result, moves: [...base.result.moves, { ...base.result.moves[0], san: "e4" }] } })).toThrow();
    expect(() => constructExplorerCountOperands({ ...base, result: { ...base.result, moves: [{ ...base.result.moves[0], uci: "not-a-move" }] } })).toThrow();
    expect(constructExplorerCountOperands({ ...base, committedMoveUci: "d2d4" })[0]?.committedMove).toBe(false);
  });
});
