// DISPOSABLE fifth fresh independent review harness — D2436-D2441.
// These tests reproduce buildability defects in the author-only presentation plan.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import {
  NAMED_STRUCTURE_WITNESS_AUTHORITY,
  PRESENTATION_ABSTENTION_ROWS,
  SOURCE_ATTRIBUTION_REGISTRY,
  SOURCE_ATTRIBUTION_REGISTRY_RESOURCE,
  constructExplorerCountOperands,
  parseCitationOperand,
  registeredPresentationQuestion,
} from "../d1862-presentation-adapter-plan/plan.js";

describe("evidence-presentation fifth fresh review", () => {
  test("D2436 the advertised resource digest covers rows but not resolver semantics", () => {
    const rowsDigest = `sha256:${createHash("sha256").update(JSON.stringify(SOURCE_ATTRIBUTION_REGISTRY)).digest("hex")}`;
    expect(SOURCE_ATTRIBUTION_REGISTRY_RESOURCE.digest).toBe(rowsDigest);

    const changedResolver = {
      ...SOURCE_ATTRIBUTION_REGISTRY_RESOURCE,
      resolver: { ...SOURCE_ATTRIBUTION_REGISTRY_RESOURCE.resolver, symbol: "resolveAttributionDifferently" },
    };
    expect(changedResolver.digest).toBe(SOURCE_ATTRIBUTION_REGISTRY_RESOURCE.digest);
    expect(changedResolver.resolver).not.toEqual(SOURCE_ATTRIBUTION_REGISTRY_RESOURCE.resolver);
  });

  test("D2437 citation parsing accepts absent and empty revision metadata", () => {
    const base = {
      content: { kind: "fact", text: "Measured.", binding: "ref-1" },
      source: { source: "Stockfish", title: "Reading", locator: "artifact", licence: "GPL-3.0-only" },
    };
    expect(parseCitationOperand(base).source.revision).toBeUndefined();
    expect(parseCitationOperand({ ...base, source: { ...base.source, revision: "" } }).source.revision).toBe("");
  });

  test("D2438 adapter reason maps are padded with reasons not declared by their source projection", () => {
    const explorer = PRESENTATION_ABSTENTION_ROWS.find((row) =>
      row.adapterKey === "inspector.corpus@1\0human.explorer.population@1");
    expect(explorer).toBeDefined();
    const sourceReasons = explorer!.sourceReasonMap.map((entry) => entry.sourceReason);
    expect(sourceReasons).toEqual(expect.arrayContaining(["source_unavailable", "empty_population"]));
    expect(sourceReasons).toEqual(expect.arrayContaining(["no_witness", "below_floor", "provider_unavailable"]));
  });

  test("D2439 spreading a registered question preserves its hidden brand", () => {
    const question = registeredPresentationQuestion(
      "inspector.corpus@1\0human.explorer.population@1",
      "question.explorer_population",
    );
    const forged = { ...question, label: "Play the engine move." };
    expect(Object.getOwnPropertySymbols(question)).toHaveLength(1);
    expect(Object.getOwnPropertySymbols(forged)).toEqual(Object.getOwnPropertySymbols(question));
    expect(forged.label).toBe("Play the engine move.");
  });

  test("D2440 witness rows are a second table while production emits empty named-structure squares", () => {
    const structureSource = readFileSync("packages/runtime/src/structure.ts", "utf8");
    expect(structureSource).toMatch(/function namedStructureMatches/u);
    expect(structureSource).not.toMatch(/export const STRUCTURE_PREDICATES/u);
    expect(structureSource).toMatch(/kind: "named_structure", squares: \[\]/u);
    expect(NAMED_STRUCTURE_WITNESS_AUTHORITY.rows.every((row) => row.squares.length > 0)).toBe(true);
  });

  test("D2441 duplicate UCI identities survive under different SAN strings", () => {
    const rows = constructExplorerCountOperands({
      nodeId: "n1",
      committedMoveSan: "e4!",
      result: {
        kind: "stats",
        total: 100,
        moves: [
          { san: "e4", uci: "e2e4", playedCount: 60, white: 30, draws: 10, black: 20 },
          { san: "e4!", uci: "e2e4", playedCount: 40, white: 20, draws: 10, black: 10 },
        ],
      },
    });
    expect(rows.map((row) => row.candidate.uci)).toEqual(["e2e4", "e2e4"]);
    expect(rows.map((row) => row.committedMove)).toEqual([false, true]);
  });
});
