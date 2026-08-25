import { describe, expect, it } from "vitest";

import { markShapePlanUncheckable, readShapePlanSignatures, updateShapePlanRefusalNote } from "./shape-plan-signatures.js";

const shape = JSON.stringify({
  id: "shape",
  plans: [
    { id: "expressible", label: "Expressible", success: { note: "A structural endpoint.", signature: { kind: "pieceOnSquare", square: "e4", piece: { color: "white", role: "pawn" } } } },
    { id: "unfinished", label: "Unfinished", success: {} },
  ],
  provenance: { licence: "CC-BY-SA-4.0" },
});

describe("shape plan signature choices", () => {
  it("distinguishes structural, missing, and explicit uncheckable states", () => {
    expect(readShapePlanSignatures(shape).plans.map((plan) => plan.state)).toEqual(["structural", "missing"]);
    const refused = markShapePlanUncheckable(shape, 1, "  Duration cannot be certified by one position.  ");
    expect(readShapePlanSignatures(refused).plans[1]).toMatchObject({ state: "uncheckable", note: "Duration cannot be certified by one position." });
    expect(JSON.parse(refused).provenance).toEqual({ licence: "CC-BY-SA-4.0" });
  });

  it("requires a reason and only edits notes on null signatures", () => {
    expect(() => markShapePlanUncheckable(shape, 0, "  ")).toThrow("note is required");
    const unchanged = updateShapePlanRefusalNote(shape, 0, "should not replace structural note");
    expect(JSON.parse(unchanged).plans[0].success.note).toBe("A structural endpoint.");
    const refused = markShapePlanUncheckable(shape, 1, "Initial reason");
    expect(JSON.parse(updateShapePlanRefusalNote(refused, 1, "Better reason")).plans[1].success).toEqual({ signature: null, note: "Better reason" });
  });
});
