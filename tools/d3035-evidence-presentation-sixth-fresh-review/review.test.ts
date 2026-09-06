// DISPOSABLE sixth fresh independent review harness — D3035-D3041.
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

import {
  MANIFEST_PRESENTATION_REPAIRS,
  NAMED_STRUCTURE_WITNESS_AUTHORITY,
  PRESENTATION_ABSTENTION_ROWS,
  SOURCE_ATTRIBUTION_REGISTRY_SEMANTIC_IMAGE,
  assertRegisteredPresentationQuestion,
  constructExplorerCountOperands,
  parseCitationOperand,
  registeredPresentationQuestion,
  sourceAttributionRegistryDigest,
} from "../d1862-presentation-adapter-plan/plan.js";

const explorerAdapter = "inspector.corpus@1\0human.explorer.population@1";
const explorerQuestion = "question.explorer_population";

describe("evidence-presentation sixth fresh independent review", () => {
  test("D3035 the resource digest accepts values refused by the shared RFC-8785 authority", () => {
    const invalidUnicode = {
      ...SOURCE_ATTRIBUTION_REGISTRY_SEMANTIC_IMAGE,
      id: "source-attribution-\ud800",
    };
    const invalidNumber = {
      ...SOURCE_ATTRIBUTION_REGISTRY_SEMANTIC_IMAGE,
      version: Number.NaN,
    };

    expect(sourceAttributionRegistryDigest(invalidUnicode)).toMatch(/^sha256:[0-9a-f]{64}$/u);
    expect(sourceAttributionRegistryDigest(invalidNumber)).toMatch(/^sha256:[0-9a-f]{64}$/u);
  });

  test("D3036 the complete citation parser accepts an unregistered content kind and binding", () => {
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

    expect(parseCitationOperand(arbitrary)).toEqual(arbitrary);
  });

  test("D3037 abstention reasons still come from projection copies and an Explorer synonym branch", () => {
    const plan = readFileSync("tools/d1862-presentation-adapter-plan/plan.ts", "utf8");
    const repair = MANIFEST_PRESENTATION_REPAIRS.find((row) => row.id === "explorer-absence-reason");
    const explorer = PRESENTATION_ABSTENTION_ROWS.find((row) => row.adapterKey === explorerAdapter);

    expect(repair).toBeDefined();
    expect(repair).not.toHaveProperty("resultReasons");
    expect(plan).toContain("projection?.abstention.reasons");
    expect(plan).toContain('row.projection === "human.explorer.population@1"');
    expect(explorer?.sourceReasonMap.map((row) => row.sourceReason).sort()).toEqual([
      "no_data_at_band",
      "source_unavailable",
    ]);
  });

  test("D3038 any importer can mint a genuine question without an owning workflow request", () => {
    const attackerIssued = registeredPresentationQuestion(explorerAdapter, explorerQuestion);

    expect(() => assertRegisteredPresentationQuestion(
      attackerIssued,
      explorerAdapter,
      explorerQuestion,
    )).not.toThrow();
    expect(attackerIssued).not.toHaveProperty("requestId");
    expect(attackerIssued).not.toHaveProperty("decision");
  });

  test("D3039 the atomic named-structure operation remains symbol text with no implementation", () => {
    const production = readFileSync("packages/runtime/src/structure.ts", "utf8");
    const plan = readFileSync("tools/d1862-presentation-adapter-plan/plan.ts", "utf8");

    expect(NAMED_STRUCTURE_WITNESS_AUTHORITY.expression.symbol).toBe("STRUCTURE_PREDICATES");
    expect(NAMED_STRUCTURE_WITNESS_AUTHORITY.operation.symbol).toBe("evaluateNamedStructureWithWitness");
    expect(production).not.toMatch(/export const STRUCTURE_PREDICATES/u);
    expect(production).not.toMatch(/export function evaluateNamedStructureWithWitness/u);
    expect(plan).not.toMatch(/export function evaluateNamedStructureWithWitness/u);
    expect(production).toMatch(/kind: "named_structure", squares: \[\]/u);
  });

  test("D3040 a malformed committed-edge UCI is accepted as an honest non-match", () => {
    const result = constructExplorerCountOperands({
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
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.committedMove).toBe(false);
  });

  test("D3041 the eight-operation fence ignores source anchors and pre/postimages", () => {
    const altered = MANIFEST_PRESENTATION_REPAIRS.map((row, index) => index === 0
      ? {
          ...row,
          sources: ["packages/runtime/src/does-not-exist.ts"],
          before: "",
          after: "",
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
    expect(existsSync(altered[0]!.sources[0]!)).toBe(false);
    expect(altered[0]).toMatchObject({ before: "", after: "" });
  });
});
