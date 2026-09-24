import { describe, expect, it } from "vitest";

import { importFailureCopy, pgnSideHint, REPERTOIRE_IMPORT_POINTER } from "./import-presentation.js";

describe("import failure presentation", () => {
  it.each([
    ["PGN must contain exactly one game", "one game at a time"],
    ["PGN variations are not accepted", "one played main line"],
    ["Unsupported PGN variant: Chess960", "Only Standard and From Position"],
    ["PGN exceeds the 64 KiB import limit", "64 KiB single-game limit"],
    ["PGN exceeds 300 plies", "300-turn import limit"],
    ["PGN must contain at least one move", "headers but no played moves"],
    ["PGN has an invalid starting position", "starting position is invalid"],
    ["Illegal PGN move: Qh9", "(Qh9)"],
    ["PGN could not be parsed", "not a readable PGN"],
  ])("turns %s into one actionable refusal", (message, expected) => {
    expect(importFailureCopy({ code: "IMPORT_INVALID_PGN", message })).toContain(expected);
  });

  it("distinguishes source lookup, availability, and unsupported-source failures", () => {
    expect(importFailureCopy({ code: "IMPORT_SOURCE_NOT_FOUND", message: "raw" })).toContain("could not be found");
    expect(importFailureCopy({ code: "IMPORT_SOURCE_UNAVAILABLE", message: "raw" })).toContain("did not answer in time");
    expect(importFailureCopy({ code: "IMPORT_SOURCE_UNSUPPORTED", message: "raw" })).toContain("not supported");
  });

  it("points multi-game and variation refusals at the repertoire importer that accepts both (IMP-a9)", () => {
    for (const message of ["PGN must contain exactly one game", "PGN variations are not accepted"]) {
      expect(importFailureCopy({ code: "IMPORT_INVALID_PGN", message })).toContain(REPERTOIRE_IMPORT_POINTER);
    }
    expect(REPERTOIRE_IMPORT_POINTER).toMatch(/Import repertoire under Learn › Repertoire gaps/u);
    expect(importFailureCopy({ code: "IMPORT_INVALID_PGN", message: "PGN exceeds 300 plies" })).not.toContain(REPERTOIRE_IMPORT_POINTER);
  });

  it("reads the side from the PGN's player headers when exactly one names the learner (IMP-a5)", () => {
    const pgn = '[Event "Rated blitz"]\n[White "Magnus"]\n[Black "Alice"]\n\n1. e4 e5 *';
    expect(pgnSideHint(pgn, "alice")).toEqual({ white: "Magnus", black: "Alice", side: "black" });
    expect(pgnSideHint(pgn, "@MAGNUS")).toEqual({ white: "Magnus", black: "Alice", side: "white" });
    expect(pgnSideHint(pgn, "carol")).toEqual({ white: "Magnus", black: "Alice" });
    expect(pgnSideHint(pgn, undefined)).toEqual({ white: "Magnus", black: "Alice" });
    expect(pgnSideHint('[White "alice"]\n[Black "Alice"]\n\n1. e4 *', "alice")).toEqual({ white: "alice", black: "Alice" });
    expect(pgnSideHint('[White "?"]\n[Black "Bob \\"B\\""]\n\n1. e4 *', "bob")).toEqual({ black: 'Bob "B"' });
    expect(pgnSideHint("1. e4 e5 2. Nf3 *", "alice")).toBeUndefined();
  });

  it("does not expose an unknown typed failure", () => {
    const copy = importFailureCopy({ code: "STORAGE_FAILURE", message: "private storage detail" });
    expect(copy).toBe("The game could not be imported. Nothing was stored; try again.");
    expect(copy).not.toContain("private storage detail");
  });
});
