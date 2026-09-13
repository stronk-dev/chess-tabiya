import { describe, expect, it } from "vitest";

import { importFailureCopy } from "./import-presentation.js";

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

  it("does not expose an unknown typed failure", () => {
    const copy = importFailureCopy({ code: "STORAGE_FAILURE", message: "private storage detail" });
    expect(copy).toBe("The game could not be imported. Nothing was stored; try again.");
    expect(copy).not.toContain("private storage detail");
  });
});
