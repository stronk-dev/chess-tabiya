import { describe, expect, it } from "vitest";

import {
  RULES_EVIDENCE_FACTS,
  engineEvidenceRef,
  isEngineEvidenceRef,
  packEvidenceRef,
  rulesEvidenceRef,
} from "./evidence-ref.js";

describe("evidence reference grammar", () => {
  it("constructs every v1 rules ref and scoped pack/engine refs", () => {
    expect(RULES_EVIDENCE_FACTS.map(rulesEvidenceRef)).toEqual([
      "rules:checkmate",
      "rules:stalemate",
      "rules:draw-threefold",
      "rules:draw-50move",
      "rules:draw-insufficient",
      "rules:material",
      "rules:result-win",
      "rules:result-loss",
      "rules:result-draw",
    ]);
    expect(packEvidenceRef("timing-window")).toBe("pack:timing-window");
    expect(engineEvidenceRef("evidence-job-7")).toBe("engine:evidence-job-7");
  });

  it("rejects ambiguous ids and recognizes only populated engine refs", () => {
    expect(() => packEvidenceRef(" ")).toThrow(TypeError);
    expect(() => engineEvidenceRef("nested:id")).toThrow(TypeError);
    expect(() => engineEvidenceRef("two jobs")).toThrow(TypeError);
    expect(isEngineEvidenceRef("engine:evidence-job-1")).toBe(true);
    expect(isEngineEvidenceRef("engine:")).toBe(false);
    expect(isEngineEvidenceRef("rules:material")).toBe(false);
  });
});
