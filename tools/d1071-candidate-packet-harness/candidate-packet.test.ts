// DISPOSABLE research harness — D1071/D1072. Not production code.
import { writeFileSync } from "node:fs";

import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { makeUci, parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import { candidateFeatureVector } from "../../apps/server/src/candidate-evidence.js";
import { localSemanticEvents } from "../../packages/runtime/src/semantic-evidence.js";

const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const ENGINE = Object.freeze({
  id: "research-only",
  name: "Unverified caller bytes",
  version: "0",
  seedHonored: true,
  searchBound: Object.freeze({ kind: "nodes" as const, value: 25_000 }),
});
const OUTPUT = new URL("../../planning/evidence-foundation-ux/d1071-shared-candidate-packet-results.json", import.meta.url);

function position(fen: string): Chess {
  return Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
}

function child(fen: string, uci: string): string {
  const board = position(fen);
  const move = parseUci(uci);
  if (move === undefined || !board.isLegal(move)) throw new TypeError(`illegal fixture ${uci}`);
  board.play(move);
  return makeFen(board.toSetup());
}

function legalMoves(fen: string): readonly string[] {
  const board = position(fen);
  const result: string[] = [];
  for (const [from, destinations] of board.allDests()) {
    for (const to of destinations) result.push(makeUci({ from, to }));
  }
  return Object.freeze(result.sort());
}

describe("D1071 shared candidate packet", () => {
  it("falsifies completeness and retained-event identity in the implemented vector", () => {
    const supplied = Object.freeze([
      { moveUci: "g1f3", scoreCp: 31 },
      { moveUci: "e2e4", scoreCp: 27 },
    ]);
    const vector = candidateFeatureVector({ beforeFen: START, engine: ENGINE, candidates: supplied });
    const legal = legalMoves(START);

    expect(legal).toHaveLength(20);
    expect(vector.candidates).toHaveLength(2);
    expect(vector.candidates.map((row) => row.moveUci)).toEqual(supplied.map((row) => row.moveUci));

    const afterFen = child(START, "g1f3");
    const event = localSemanticEvents(START, "g1f3", afterFen)
      .find((candidate) => candidate.projection.id === "rules.transition.event.developed");
    expect(event).toBeDefined();
    const retained = vector.candidates[0]!.results
      .find((result) => result.source.id === "rules.transition.event.developed");
    expect(retained).toBeDefined();
    expect(Object.keys(retained!).sort()).toEqual(["payload", "source"]);
    expect("sign" in retained!).toBe(false);
    expect("id" in retained!).toBe(false);
    expect("anchor" in retained!).toBe(false);
    expect("basis" in retained!).toBe(false);
    expect("derivationInputs" in retained!).toBe(false);

    const arbitrary = candidateFeatureVector({
      beforeFen: START,
      engine: ENGINE,
      candidates: supplied.map((row) => ({ ...row, scoreCp: row.scoreCp + 900_000 })),
    });
    expect(arbitrary.candidates.map((row) => row.scoreCp)).toEqual([900_031, 900_027]);

    const findings = Object.freeze({
      canonicalFen: vector.beforeFen,
      exactLegalCount: legal.length,
      acceptedCandidateCount: vector.candidates.length,
      completenessRatio: vector.candidates.length / legal.length,
      strictSubsetAccepted: vector.candidates.length < legal.length,
      arbitraryFiniteScoresAccepted: arbitrary.candidates.map((row) => row.scoreCp),
      exampleProjection: event!.projection,
      semanticEnvelopeKeys: Object.keys(event!).sort(),
      retainedResultKeys: Object.keys(retained!).sort(),
      retainedSign: "sign" in retained!,
      retainedEventId: "id" in retained!,
      retainedAnchor: "anchor" in retained!,
      retainedBasis: "basis" in retained!,
      retainedDerivationInputs: "derivationInputs" in retained!,
    });
    writeFileSync(OUTPUT, `${JSON.stringify(findings, null, 2)}\n`, "utf8");
  });
});
