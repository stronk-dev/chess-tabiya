import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { checkEventForInduction, deflectionObservedInduction } from "./model.js";

const rfc = readFileSync("rfc/semantic-collectors.md", "utf8");

describe("D2552 deflection check-source author repair", () => {
  it("uses one deterministic bait-before-check selector", () => {
    expect(deflectionObservedInduction({ baitCaptureMatched: true, firstEdgeIsCheck: false })).toBe("bait_capture");
    expect(deflectionObservedInduction({ baitCaptureMatched: true, firstEdgeIsCheck: true })).toBe("bait_capture");
    expect(deflectionObservedInduction({ baitCaptureMatched: false, firstEdgeIsCheck: true })).toBe("check_induced");
    expect(deflectionObservedInduction({ baitCaptureMatched: false, firstEdgeIsCheck: false })).toBeUndefined();
  });

  it("lets every path compiler select the check input without duplicating chess logic", () => {
    const sealedCheck = Object.freeze({ id: "sealed-edge-one-check" });
    expect(checkEventForInduction("bait_capture", sealedCheck)).toBeUndefined();
    expect(checkEventForInduction("check_induced", sealedCheck)).toBe(sealedCheck);
    expect(checkEventForInduction("check_induced", undefined)).toBeUndefined();
  });

  it("pins one exported runtime helper across detector, emitter and all call sites", () => {
    expect(rfc).toMatch(/export function deflectionObservedInduction\(/u);
    expect(rfc).toMatch(/deflectionObservedOperands[\s\S]*calls this helper/u);
    expect(rfc).toMatch(/deflectionObservedSemanticEvent[\s\S]*calls the same helper/u);
    expect(rfc).toMatch(/semantic-tactic-sequences\.test\.ts[\s\S]*d1930-recorded-path-cost-harness[\s\S]*d1931-recorded-path-source-harness/u);
  });

  it("keeps direct-call refusals while making the generic call path total", () => {
    for (const refusal of ["missing-check", "crossed-edge-check", "unnecessary-check"]) {
      expect(rfc).toContain(refusal);
    }
    expect(rfc).toMatch(/permanent dual-arm fixture[\s\S]*bait_capture[\s\S]*no check event/u);
  });
});
