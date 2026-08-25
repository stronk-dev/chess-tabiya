import { describe, expect, it } from "vitest";

import { readPackVocabulary, setClaimPrinciple, setPackShapeReference } from "./pack-vocabulary-fields.js";

const pack = JSON.stringify({
  id: "pack",
  shapes: ["carlsbad", { shape: "future-shape", relation: "prospective" }],
  legs: [{ id: "conversion", objective: {}, shapes: ["endgame-shape"] }],
  feedbackClaims: [{ id: "claim-one", text: "A claim", evidenceTypes: ["author_principle"], principles: ["activity"] }],
  provenance: { reviewStatus: "draft" },
});

describe("pack vocabulary fields", () => {
  it("reads every registry-backed pack field with relation intact", () => {
    const draft = readPackVocabulary(pack);
    expect(draft.valid).toBe(true);
    expect(Object.fromEntries(draft.shapeFields[0]!.selected)).toEqual({ carlsbad: "present", "future-shape": "prospective" });
    expect(Object.fromEntries(draft.shapeFields[1]!.selected)).toEqual({ "endgame-shape": "present" });
    expect([...draft.principleFields[0]!.selected]).toEqual(["activity"]);
  });

  it("edits top-level and leg shape references without dropping unrelated bytes", () => {
    let json = setPackShapeReference(pack, { kind: "pack" }, "carlsbad", true, "prospective");
    json = setPackShapeReference(json, { kind: "leg", index: 0 }, "new-shape", true, "present");
    json = setPackShapeReference(json, { kind: "pack" }, "future-shape", false);
    const document = JSON.parse(json);
    expect(document.shapes).toEqual([{ shape: "carlsbad", relation: "prospective" }]);
    expect(document.legs[0].shapes).toEqual(["endgame-shape", "new-shape"]);
    expect(document.feedbackClaims[0].text).toBe("A claim");
  });

  it("adds and removes principles per claim, deleting an invalid empty array", () => {
    const added = setClaimPrinciple(pack, 0, "tempo", true);
    expect(JSON.parse(added).feedbackClaims[0].principles).toEqual(["activity", "tempo"]);
    const removed = setClaimPrinciple(setClaimPrinciple(added, 0, "activity", false), 0, "tempo", false);
    expect(JSON.parse(removed).feedbackClaims[0]).not.toHaveProperty("principles");
    expect(readPackVocabulary("bad json").valid).toBe(false);
  });
});
