// Criterion 36 (rfc/shared-candidate-evidence-packet.md): one sealed exact-map object owns the flat
// population, and the compiler reaches the legal authority only through the registered factory.
import { readFileSync } from "node:fs";

import { INITIAL_FEN } from "chessops/fen";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as legalMoves from "./legal-moves.js";

vi.mock("./legal-moves.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./legal-moves.js")>();
  return { ...actual, exactLegalMoveMap: vi.fn(actual.exactLegalMoveMap) };
});

const { CANDIDATE_EVENTS_SCOPE, CANDIDATE_READINGS_SCOPE, CANDIDATE_WIDE_SCOPE, compileCandidatePopulation, compileCandidatePopulationForContract, projectCandidatePopulationReceipt } = await import("./candidate-population.js");
const { createRulesMobilityReadingLegalMovesV1Evidence } = await import("./evidence-source-adapters.js");

const spy = vi.mocked(legalMoves.exactLegalMoveMap);
const rootCalls = (fen: string) => spy.mock.calls.filter(([argument]) => argument === fen).length;
const source = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

describe("criterion 36: one exact-map call owns the packet's legal population", () => {
  beforeEach(() => { spy.mockClear(); });

  it("calls the factory's authority exactly once for the root and retains that exact returned object", () => {
    const result = compileCandidatePopulation({ beforeFen: INITIAL_FEN, ruleset: "standard", scope: CANDIDATE_READINGS_SCOPE });
    if (result.kind !== "ready") throw new Error("expected packet");
    expect(rootCalls(INITIAL_FEN)).toBe(1);
    const index = spy.mock.calls.findIndex(([argument]) => argument === INITIAL_FEN);
    const returned = spy.mock.results[index]!.value as legalMoves.ExactLegalMoveMap;
    expect(result.receipt.legalMovesInput.payload).toBe(returned);
    const flat = returned.pieces.flatMap((piece) => piece.moves);
    result.receipt.packet.legalMoves.forEach((move, position) => expect(move).toBe(flat[position]));
  });

  it("the factory accepts a FEN string only and refuses objects before the authority runs", () => {
    const map = legalMoves.exactLegalMoveMap(INITIAL_FEN);
    spy.mockClear();
    expect(() => createRulesMobilityReadingLegalMovesV1Evidence(map as unknown as string)).toThrow(/FEN string/u);
    expect(() => createRulesMobilityReadingLegalMovesV1Evidence({ ...map } as unknown as string)).toThrow(/FEN string/u);
    expect(() => createRulesMobilityReadingLegalMovesV1Evidence(42 as unknown as string)).toThrow(/FEN string/u);
    expect(spy).not.toHaveBeenCalled();
    const declared = createRulesMobilityReadingLegalMovesV1Evidence(INITIAL_FEN);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(declared.payload).toBe(spy.mock.results[0]!.value);
    expect(declared.projection).toEqual({ id: "rules.mobility.reading.legal_moves", version: 1 });
  });

  it("an unsupported ruleset or malformed request never reaches the legal authority", () => {
    for (const request of [{ beforeFen: INITIAL_FEN, ruleset: "chess960", scope: CANDIDATE_EVENTS_SCOPE }, { beforeFen: INITIAL_FEN, scope: CANDIDATE_EVENTS_SCOPE }, { beforeFen: INITIAL_FEN, ruleset: "standard", scope: { events: false, readings: false } }]) {
      expect(compileCandidatePopulationForContract(request, {}).kind).toBe("failed");
    }
    expect(spy).not.toHaveBeenCalled();
  });

  it("copied moves and an independently instrumented equal enumeration fail by identity", () => {
    const request = { beforeFen: INITIAL_FEN, ruleset: "standard", scope: CANDIDATE_READINGS_SCOPE };
    expect(compileCandidatePopulationForContract(request, { legalMoves: (flat) => Object.freeze(flat.map((move) => Object.freeze({ ...move }))) })).toEqual({ kind: "failed", error: { code: "invariant_failed", invariant: "receipt" } });
    const independent = vi.fn(() => legalMoves.exactLegalMoves(INITIAL_FEN));
    expect(compileCandidatePopulationForContract(request, { legalMoves: independent })).toEqual({ kind: "failed", error: { code: "invariant_failed", invariant: "receipt" } });
    expect(independent).toHaveBeenCalledTimes(1);
  });

  it("wide→narrow projection performs no legal recomputation", () => {
    const wide = compileCandidatePopulation({ beforeFen: INITIAL_FEN, ruleset: "standard", scope: CANDIDATE_WIDE_SCOPE });
    if (wide.kind !== "ready") throw new Error("expected packet");
    spy.mockClear();
    expect(projectCandidatePopulationReceipt(wide.receipt, CANDIDATE_EVENTS_SCOPE).kind).toBe("ready");
    expect(projectCandidatePopulationReceipt(wide.receipt, CANDIDATE_READINGS_SCOPE).kind).toBe("ready");
    expect(spy).not.toHaveBeenCalled();
  });

  it("source graph: the compiler imports the registered factory once and neither legal enumerator", () => {
    const compiler = source("./candidate-population.ts");
    const imports = [...compiler.matchAll(/import\s+(?:type\s+)?\{([^}]*)\}\s+from\s+"([^"]+)"/gu)];
    const importedNames = imports.flatMap((match) => match[1]!.split(",").map((name) => name.trim().replace(/^type\s+/u, "")));
    expect(importedNames.filter((name) => name === "createRulesMobilityReadingLegalMovesV1Evidence")).toHaveLength(1);
    expect(importedNames).not.toContain("exactLegalMoveMap");
    expect(importedNames).not.toContain("exactLegalMoves");
    expect(compiler).not.toMatch(/function\s+createRulesMobilityReadingLegalMovesV1Evidence/u);
    expect(compiler).not.toMatch(/declareExactLegalMovesEvidence/u);
    expect(compiler.match(/createRulesMobilityReadingLegalMovesV1Evidence\(/gu)).toHaveLength(1);
    const definitions = ["./evidence-source-adapters.ts", "./candidate-population.ts", "./semantic-evidence.ts", "./index.ts"].map(source).join("\n").match(/function\s+createRulesMobilityReadingLegalMovesV1Evidence\b/gu);
    expect(definitions).toHaveLength(1);
  });
});
