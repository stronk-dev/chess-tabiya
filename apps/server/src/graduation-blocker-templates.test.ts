import { describe, expect, it } from "vitest";

import {
  EMITTER_GRADUATION_BLOCKER_TEMPLATES,
  EMITTER_TEMPLATE_IDS,
  emitterGraduationBlocker,
} from "./graduation-blocker-templates.mjs";

describe("emitter graduation blocker templates", () => {
  it("registers the nine emitter identities declared by graduation clearance", () => {
    expect(EMITTER_TEMPLATE_IDS).toEqual([
      "mechanical-objective-placeholder",
      "outcome-ungraded",
      "start-assessment-absent",
      "target-elo-authored",
      "authored-teaching-absent",
      "opponent-policy-authored",
      "tablebase-opponent-not-selected",
      "recorded-play-needs-authoring",
      "mechanical-objective-needs-grounding",
    ]);
    expect(Object.keys(EMITTER_GRADUATION_BLOCKER_TEMPLATES)).toEqual(EMITTER_TEMPLATE_IDS);
  });

  it("renders fixed and parameterized blockers from the same checked-in templates", () => {
    expect(emitterGraduationBlocker("recorded-play-needs-authoring")).toEqual({
      id: "recorded-play-needs-authoring",
      state: "blocking",
      statement: "Session-distilled moves are recorded play, not reviewed theory; a human author must judge every line before publication.",
    });
    expect(emitterGraduationBlocker("opponent-policy-authored", { opponent: "strong_engine" })).toEqual({
      id: "opponent-policy-authored",
      state: "blocking",
      statement: "opponent mode strong_engine is an authoring choice that must be reviewed for this convert/hold/save drill",
    });
  });

  it("refuses unknown templates and incomplete or widened substitutions", () => {
    expect(() => emitterGraduationBlocker("unknown" as never)).toThrow("unknown emitter graduation blocker template");
    expect(() => emitterGraduationBlocker("opponent-policy-authored", {} as never)).toThrow("requires variables [opponent]");
    expect(() => emitterGraduationBlocker("opponent-policy-authored", { opponent: "" })).toThrow("must be a non-empty string");
    expect(() => emitterGraduationBlocker("opponent-policy-authored", { opponent: "strong_engine", extra: "value" } as never)).toThrow("received [extra, opponent]");
  });
});
