import { describe, expect, it } from "vitest";

import { repertoireEntryDecision } from "./repertoire-entry.js";

describe("repertoire gap entry", () => {
  it("prefers the human model and makes the Stockfish fallback explicit", () => {
    expect(repertoireEntryDecision(["strong_engine", "human_common"], null)).toEqual({
      available: true,
      resistance: "human_common",
      label: "Enter with human-like resistance",
    });
    expect(repertoireEntryDecision(["strong_engine"], null)).toEqual({
      available: true,
      resistance: "strong_engine",
      label: "Enter with Stockfish resistance",
    });
  });

  it("reopens a linked run without requiring any currently deployed opponent", () => {
    expect(repertoireEntryDecision([], "gap-run")).toEqual({
      available: true,
      label: "Open existing gap run",
    });
    expect(repertoireEntryDecision([], null)).toEqual({
      available: false,
      label: "Gap rehearsal unavailable",
      reason: "This deployment has neither a human-model nor Stockfish opponent available.",
    });
  });
});
