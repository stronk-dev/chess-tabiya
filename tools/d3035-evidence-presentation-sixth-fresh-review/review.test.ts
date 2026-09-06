// DISPOSABLE sixth fresh independent review harness — D3035-D3041.
import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

import {
  MANIFEST_PRESENTATION_REPAIRS,
  NAMED_STRUCTURE_WITNESS_AUTHORITY,
  PRESENTATION_ABSTENTION_ROWS,
  CORPUS_RESULT_REASON_AUTHORITY,
  SOURCE_ATTRIBUTION_REGISTRY_SEMANTIC_IMAGE,
  STRUCTURE_PREDICATES,
  assertManifestPresentationRepairAnchors,
  constructExplorerCountOperands,
  evaluateNamedStructureWithWitness,
  issueRegisteredPresentationQuestion,
  parseCitationOperand,
  parseCorpusResultAbstentionReason,
  sourceAttributionRegistryDigest,
} from "../d1862-presentation-adapter-plan/plan.js";

const explorerAdapter = "inspector.corpus@1\0human.explorer.population@1";
const explorerQuestion = "question.explorer_population";

describe("evidence-presentation sixth fresh independent review", () => {
  test("D3035 the resource digest refuses values rejected by the shared RFC-8785 authority", () => {
    const invalidUnicode = {
      ...SOURCE_ATTRIBUTION_REGISTRY_SEMANTIC_IMAGE,
      id: "source-attribution-\ud800",
    };
    const invalidNumber = {
      ...SOURCE_ATTRIBUTION_REGISTRY_SEMANTIC_IMAGE,
      version: Number.NaN,
    };

    expect(() => sourceAttributionRegistryDigest(invalidUnicode)).toThrow(/lone high surrogate/u);
    expect(() => sourceAttributionRegistryDigest(invalidNumber)).toThrow(/finite/u);
  });

  test("D3036 the complete citation parser rejects an unregistered content kind and binding", () => {
    const arbitrary = {
      content: {
        kind: "llm_generated_advice",
        text: "Push this pawn because it feels active.",
        binding: "caller-says-so",
      },
      source: {
        source: "not-a-versioned-evidence-id",
        title: "Invented",
        locator: "nowhere",
        licence: "unknown",
        revision: "moving-head",
      },
    };

    expect(() => parseCitationOperand(arbitrary)).toThrow(/registered content operand/u);
  });

  test("D3037 Explorer presentation consumes the operation-result reason authority", () => {
    const plan = readFileSync("tools/d1862-presentation-adapter-plan/plan.ts", "utf8");
    const repair = MANIFEST_PRESENTATION_REPAIRS.find((row) => row.id === "explorer-absence-reason");
    const explorer = PRESENTATION_ABSTENTION_ROWS.find((row) => row.adapterKey === explorerAdapter);

    expect(repair).toBeDefined();
    expect(CORPUS_RESULT_REASON_AUTHORITY.resultReasons).toEqual(["no_data_at_band", "source_unavailable"]);
    expect(parseCorpusResultAbstentionReason({ kind: "abstention", reason: "no_data_at_band" })).toBe("no_data_at_band");
    expect(() => parseCorpusResultAbstentionReason({ kind: "abstention", reason: "empty_population" })).toThrow();
    expect(plan).not.toContain('reason === "empty_population" ? "no_data_at_band"');
    expect(explorer?.sourceReasonMap.map((row) => row.sourceReason).sort()).toEqual([
      "no_data_at_band",
      "source_unavailable",
    ]);
  });

  test("D3038 a public importer cannot mint a question without sealed workflow authority", () => {
    const forged = {
      request: { requestId: "r1", adapterKey: explorerAdapter, questionId: explorerQuestion },
      decision: { eventHeadSeq: 1, cursor: { branchId: "b1", nodeId: "n1" }, disclosureBoundarySeq: null, digest: "d1" },
    };
    expect(() => issueRegisteredPresentationQuestion(forged)).toThrow(/workflow request authority/u);
  });

  test("D3039 the author model executes the registered named-structure expression and witnesses", () => {
    const production = readFileSync("packages/runtime/src/structure.ts", "utf8");
    const plan = readFileSync("tools/d1862-presentation-adapter-plan/plan.ts", "utf8");

    expect(NAMED_STRUCTURE_WITNESS_AUTHORITY.expression.symbol).toBe("STRUCTURE_PREDICATES");
    expect(NAMED_STRUCTURE_WITNESS_AUTHORITY.operation.symbol).toBe("evaluateNamedStructureWithWitness");
    expect(production).not.toMatch(/export const STRUCTURE_PREDICATES/u);
    expect(production).not.toMatch(/export function evaluateNamedStructureWithWitness/u);
    expect(plan).toMatch(/export function evaluateNamedStructureWithWitness/u);
    expect(production).toMatch(/kind: "named_structure", squares: \[\]/u);
    const fen = "4k3/8/3p4/8/2P1P3/8/8/4K3 w - - 0 1";
    expect(evaluateNamedStructureWithWitness(fen, "maroczy-bind")?.squares).toEqual(["c4", "e4"]);
    expect(STRUCTURE_PREDICATES["maroczy-bind"]).toBeDefined();
  });

  test("D3040 a malformed committed-edge UCI is refused before comparison", () => {
    expect(() => constructExplorerCountOperands({
      nodeId: "n1",
      committedMoveUci: "not-a-move",
      result: {
        kind: "stats",
        total: 100,
        moves: [{
          san: "e4",
          uci: "e2e4",
          playedCount: 60,
          white: 30,
          draws: 10,
          black: 20,
        }],
      },
    })).toThrow(/Committed Explorer move UCI is not canonical/u);
  });

  test("D3041 the eight-operation fence resolves operations plus pre/postimage anchors", () => {
    const readSource = (path: string): string => readFileSync(path, "utf8");
    expect(() => assertManifestPresentationRepairAnchors(readSource)).not.toThrow();
    const altered = MANIFEST_PRESENTATION_REPAIRS.map((row, index) => index === 0
      ? {
          ...row,
          postimage: [{ source: "packages/runtime/src/does-not-exist.ts", anchor: "missing" }],
        }
      : row);
    const expectedIds = [
      "consequence-payload",
      "explorer-absence-reason",
      "internal-opponent",
      "internal-repertoire",
      "internal-story-rank",
      "named-structure-geometry",
      "pack-phase-payload",
      "source-bound-citation",
    ];

    expect(altered).toHaveLength(8);
    expect(new Set(altered.map((row) => row.id))).toHaveLength(8);
    expect(altered.map((row) => row.id).sort()).toEqual(expectedIds);
    expect(() => assertManifestPresentationRepairAnchors(readSource, altered)).toThrow();
  });
});
