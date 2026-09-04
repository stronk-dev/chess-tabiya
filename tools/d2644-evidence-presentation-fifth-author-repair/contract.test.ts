// DISPOSABLE fifth author repair model for D2436-D2441/D2644; not production UI code.
import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import {
  MANIFEST_PRESENTATION_REPAIRS,
  NAMED_STRUCTURE_WITNESS_AUTHORITY,
  PRESENTATION_ABSTENTION_ROWS,
  SOURCE_ATTRIBUTION_REGISTRY_RESOURCE,
  SOURCE_ATTRIBUTION_REGISTRY_SEMANTIC_IMAGE,
  assertRegisteredPresentationQuestion,
  constructExplorerCountOperands,
  parseCitationOperand,
  registeredPresentationQuestion,
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
      content: { kind: "fact", text: "Measured.", binding: "ref-1" },
      source: { source: "Stockfish", title: "Reading", locator: "artifact", licence: "GPL-3.0-only", revision: "sha256:abc" },
    };
    expect(parseCitationOperand(valid)).toEqual(valid);
    expect(() => parseCitationOperand({ ...valid, source: { ...valid.source, revision: "" } })).toThrow();
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
    const question = registeredPresentationQuestion(adapter, id);
    expect(() => assertRegisteredPresentationQuestion(question, adapter, id)).not.toThrow();
    for (const copy of [
      { ...question, label: "Play the engine move." },
      structuredClone(question),
      JSON.parse(JSON.stringify(question)),
    ]) expect(() => assertRegisteredPresentationQuestion(copy, adapter, id)).toThrow();
  });

  test("D2440 structure matching and witnesses have one expression authority", () => {
    expect(NAMED_STRUCTURE_WITNESS_AUTHORITY.expression.symbol).toBe("STRUCTURE_PREDICATES");
    expect(NAMED_STRUCTURE_WITNESS_AUTHORITY.operation.symbol).toBe("evaluateNamedStructureWithWitness");
    expect(NAMED_STRUCTURE_WITNESS_AUTHORITY).not.toHaveProperty("rows");

    type Leaf = Readonly<{ id: string; square: string; piece: string }>;
    const evaluate = (expression: readonly Leaf[], board: Readonly<Record<string, string>>) => {
      const matched = expression.every((leaf) => board[leaf.square] === leaf.piece);
      return { matched, witnesses: matched ? expression.map((leaf) => ({ leafId: leaf.id, square: leaf.square })) : [] };
    };
    const expression = [{ id: "white-pawn-c4", square: "c4", piece: "P" }, { id: "white-pawn-e4", square: "e4", piece: "P" }] as const;
    expect(evaluate(expression, { c4: "P", e4: "P" })).toEqual({ matched: true, witnesses: [{ leafId: "white-pawn-c4", square: "c4" }, { leafId: "white-pawn-e4", square: "e4" }] });
    expect(evaluate(expression, { c4: "P", e4: "N" })).toEqual({ matched: false, witnesses: [] });
    expect(evaluate([{ ...expression[0], square: "c3" }, expression[1]], { c4: "P", e4: "P" })).toEqual({ matched: false, witnesses: [] });
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
