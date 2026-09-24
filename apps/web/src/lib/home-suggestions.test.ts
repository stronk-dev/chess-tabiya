import { describe, expect, it } from "vitest";

import type { PackSummary, RunSummary } from "./api.js";
import { HOME_SUGGESTION_RULE, homeSuggestions } from "./home-suggestions.js";

const pack = (id: string, phase: PackSummary["phase"]): PackSummary => ({ id, version: "1", digest: `sha256:${id}`, title: `${id} title`, mode: "line", phase, difficulty: null, objectiveSummary: "", concepts: [], reviewStatus: "draft", channel: "official" });
const run = (id: string, packId: string | null, objectiveState: RunSummary["objectiveState"], updatedAt: string, extra: Partial<RunSummary> = {}): RunSummary => ({
  id, title: packId ?? id, sessionKind: packId === null ? "position" : "pack", packId, sessionDigest: "sha256:x", updatedAt, objectiveState,
  branchCount: 2, recordedMoveCount: 6, viewerRole: "host", leaseHeldBy: { learnerId: "me", handle: "me" }, ...extra,
});
const packs = [pack("italian", "opening"), pack("iqp", "middlegame"), pack("lucena", "endgame")];

describe("Home suggestion rail (ARR-a8)", () => {
  it("ranks unfinished and short-of-objective runs, then untouched phases, from the learner's own runs", () => {
    const runs = [
      run("latest", "italian", "active", "2026-09-24T10:00:00Z"),
      run("missed", "iqp", "failed", "2026-09-23T10:00:00Z"),
      run("open", "iqp", "active", "2026-09-22T10:00:00Z"),
      run("older-missed", "italian", "degraded", "2026-09-01T10:00:00Z"),
    ];
    const suggestions = homeSuggestions({ runs, packs, excludeRunId: "latest" });
    expect(suggestions.map((item) => item.kind)).toEqual(["short_of_objective", "in_progress", "untouched_phase"]);
    expect(suggestions[0]).toMatchObject({ runId: "missed", title: "Return to iqp title" });
    expect(suggestions[0]!.because).toContain("objective missed");
    expect(suggestions[1]).toMatchObject({ runId: "open", title: "Finish iqp title" });
    expect(suggestions[1]!.because).toContain("6 recorded moves across 2 branches");
    expect(suggestions[2]).toMatchObject({ packId: "lucena", title: "Start lucena title" });
    expect(suggestions[2]!.because).toBe("You have not started an endgame rehearsal here yet.");
  });

  it("never counts runs someone else hosts, and stays empty on a first visit so Home keeps its phase entries", () => {
    const shared = run("shared", "lucena", "failed", "2026-09-24T10:00:00Z", { viewerRole: "spectator" });
    expect(homeSuggestions({ runs: [shared], packs })).toEqual([]);
    expect(homeSuggestions({ runs: [], packs })).toEqual([]);
    const own = run("position", null, "achieved", "2026-09-20T10:00:00Z");
    const suggestions = homeSuggestions({ runs: [shared, own], packs });
    expect(suggestions.map((item) => item.kind)).toEqual(["untouched_phase", "untouched_phase", "untouched_phase"]);
    expect(suggestions.map((item) => "packId" in item ? item.packId : "")).toEqual(["italian", "iqp", "lucena"]);
    expect(suggestions[0]!.because).toBe("You have not started an opening rehearsal here yet.");
    expect(suggestions[1]!.because).toBe("You have not started a middlegame rehearsal here yet.");
  });

  it("states facts only: no reason names a move, grades play, or claims a weakness", () => {
    const runs = [run("missed", "iqp", "failed", "2026-09-23T10:00:00Z"), run("open", null, "active", "2026-09-22T10:00:00Z")];
    const text = [HOME_SUGGESTION_RULE, ...homeSuggestions({ runs, packs }).flatMap((item) => [item.title, item.because])].join(" ").toLowerCase();
    for (const claim of ["weak", "mistake", "blunder", "you struggle", "you tend", "accuracy", "best move", "should play"]) expect(text).not.toContain(claim);
    expect(HOME_SUGGESTION_RULE).toContain("does not judge your play");
  });

  it("scopes a phase fact to the loaded runs when the learner has more than Home loaded", () => {
    const runs = [run("a", "italian", "achieved", "2026-09-23T10:00:00Z")];
    const suggestions = homeSuggestions({ runs, packs, totalRuns: 40 });
    expect(suggestions.map((item) => item.because)).toEqual([
      "None of your 1 most recent runs is a middlegame rehearsal.",
      "None of your 1 most recent runs is an endgame rehearsal.",
    ]);
  });

  it("returns nothing to suggest when every phase is started and nothing is open or short", () => {
    const runs = [run("a", "italian", "achieved", "2026-09-23T10:00:00Z"), run("b", "iqp", "preserved", "2026-09-22T10:00:00Z"), run("c", "lucena", "transitioned", "2026-09-21T10:00:00Z")];
    expect(homeSuggestions({ runs, packs })).toEqual([]);
  });
});
