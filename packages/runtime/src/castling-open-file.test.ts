import { normalizeMove } from "chessops/chess";
import { parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";
import { canonicalFen, positionFromFen } from "./chess.js";
import { CANDIDATE_EVENTS_SCOPE, candidatePlayedRow, compileCandidatePopulation } from "./candidate-population.js";
import { assertDeclaredEvidence } from "./evidence-contract.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import { breadthSemanticEvents, openFileOccupancyOperands } from "./semantic-evidence.js";
import { CASTLING_OPEN_FILE_CASES, CASTLING_OPEN_FILE_NEGATIVES } from "./testing/castling-open-file-fixtures.js";

function edge(fen: string, uci: string) {
  const position = positionFromFen(fen);
  const move = normalizeMove(position, parseUci(uci)!);
  expect(position.isLegal(move)).toBe(true);
  position.play(move);
  return { beforeFen: fen, moveUci: uci, afterFen: canonicalFen(position) };
}

describe("D3757 physical castling rook open-file occupancy", () => {
  it.each(CASTLING_OPEN_FILE_CASES)("retains the exact moved rook and admitted file reading: $name", value => {
    const input = edge(value.fen, value.uci);
    const expected = { piece: { before: { square: value.from, piece: { color: value.side, role: "rook" } },
      after: { square: value.to, piece: { color: value.side, role: "rook" } } }, fileClass: value.fileClass,
      sourceReading: { kind: value.fileClass, file: value.to[0]!, ...(value.fileClass === "half_open_file" ? { color: value.side } : {}) } };
    expect(openFileOccupancyOperands(input.beforeFen, input.moveUci, input.afterFen)).toMatchObject(expected);
    const result = invokeEvidenceValueRoute("derived.activity.event.open_file_occupancy@1", input);
    expect(result).toHaveLength(1);
    expect(result[0]!.evidence.payload).toMatchObject(expected);
    expect(result[0]!.inputs).toHaveLength(1);
    assertDeclaredEvidence(result[0]!.evidence);
    assertDeclaredEvidence(result[0]!.inputs[0]!);
    expect(result[0]!.inputs[0]!.projection.id).toBe(`rules.structural.reading.${value.fileClass}`);
    expect(result[0]!.inputs[0]!.payload).toEqual(result[0]!.evidence.payload.sourceReading);
    const events = breadthSemanticEvents(input.beforeFen, input.moveUci, input.afterFen)
      .filter(item => item.projection.id === "derived.activity.event.open_file_occupancy");
    expect(events).toHaveLength(1);
    expect(events[0]!.operands).toMatchObject(expected);
  });

  it.each(CASTLING_OPEN_FILE_NEGATIVES)("retains the moved-piece/source-file requirement: $name", value => {
    const input = edge(value.fen, value.uci);
    expect(openFileOccupancyOperands(input.beforeFen, input.moveUci, input.afterFen)).toBeUndefined();
    expect(invokeEvidenceValueRoute("derived.activity.event.open_file_occupancy@1", input)).toEqual([]);
  });

  it.each([CASTLING_OPEN_FILE_CASES[0], CASTLING_OPEN_FILE_CASES[1], CASTLING_OPEN_FILE_CASES[6], CASTLING_OPEN_FILE_CASES[7]])(
    "carries the same rook operands in the complete legal candidate population: $name", value => {
      const compiled = compileCandidatePopulation({ beforeFen: value.fen, ruleset: "standard", scope: CANDIDATE_EVENTS_SCOPE });
      if (compiled.kind !== "ready") throw new Error(`Candidate population unavailable: ${compiled.error.code}`);
      const row = candidatePlayedRow(compiled.receipt, value.uci);
      const events = row.events.filter(item => item.projection.id === "derived.activity.event.open_file_occupancy");
      expect(events).toHaveLength(1);
      expect(events[0]!.operands).toMatchObject({ piece: { before: { square: value.from }, after: { square: value.to } } });
    });

  it("rejects an illegal castle or mismatched successor rather than attaching a rook fact", () => {
    const value = CASTLING_OPEN_FILE_CASES[0]!;
    const input = edge(value.fen, value.uci);
    expect(() => openFileOccupancyOperands(value.fen.replace(" w K ", " w - "), value.uci, input.afterFen)).toThrow();
    expect(() => openFileOccupancyOperands(input.beforeFen, input.moveUci, input.beforeFen)).toThrow();
  });
});
