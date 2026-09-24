import { describe, expect, it } from "vitest";

import { NUDGE_MAX_FACTS, parsePostcommitNudge } from "./nudge-response.js";

const subject = { runId: "run-1", nodeId: "n3" } as const;
const grade = "Mistake — the live evaluation moved +2.60 (73.9%) → −1.60 (35.4%) across this move, a drop of 38.5 win-points against a threshold of 10 (grade-convention@1/drill).";
const packet = (facts: readonly unknown[], frame = true) => ({
  runId: "run-1", kind: "packet", nodeId: "n3", facts,
  headline: frame ? "The consequence exposed something concrete." : null,
  closing: frame ? "Your played line stays preserved." : null,
  receipt: { offered: 12, admitted: 9, afterReducers: 9, noveltyAbstained: true },
});

describe("post-commit nudge response", () => {
  it("admits at most the module's two facts, each an exact projection with its sentence", () => {
    const parsed = parsePostcommitNudge(packet([{ projection: "derived.grade.move_quality@1", sentence: grade, source: "Recorded engine analysis" }]), subject);
    expect(parsed.kind === "packet" && parsed.facts.map((fact) => fact.projection)).toEqual(["derived.grade.move_quality@1"]);
    expect(NUDGE_MAX_FACTS).toBe(2);
    const three = Array.from({ length: 3 }, (_, index) => ({ projection: `rules.transition.event.capture@1`, sentence: `fact ${index}`, source: "Board rules" }));
    expect(() => parsePostcommitNudge(packet(three), subject)).toThrow(/module budget/u);
  });

  it("refuses a word-only grade, a base-id projection, a mismatched subject and an all-clear frame", () => {
    expect(() => parsePostcommitNudge(packet([{ projection: "derived.grade.move_quality@1", sentence: "Mistake.", source: "x" }]), subject)).toThrow(/grounded sentence/u);
    expect(() => parsePostcommitNudge(packet([{ projection: "rules.tactic.event.check", sentence: "s", source: "x" }]), subject)).toThrow(/shape/u);
    expect(() => parsePostcommitNudge(packet([]), { runId: "run-1", nodeId: "other" })).toThrow(/subject/u);
    // Silent is the declared empty: no facts means no headline or closing.
    expect(() => parsePostcommitNudge(packet([], true), subject)).toThrow(/frame/u);
    expect(parsePostcommitNudge(packet([], false), subject)).toMatchObject({ kind: "packet", facts: [], headline: null, closing: null });
  });

  it("carries a typed refusal", () => {
    expect(parsePostcommitNudge({ runId: "run-1", kind: "refused", nodeId: "n3", reason: "not_a_learner_move" }, subject)).toEqual({ runId: "run-1", kind: "refused", nodeId: "n3", reason: "not_a_learner_move" });
  });
});
