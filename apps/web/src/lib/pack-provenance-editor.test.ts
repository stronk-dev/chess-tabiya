import { describe, expect, it } from "vitest";

import {
  addPackAttribution,
  readPackProvenance,
  removePackAttribution,
  setPackProvenancePosture,
  setPackProvenanceSources,
  updatePackAttribution,
} from "./pack-provenance-editor.js";

const draft = JSON.stringify({ id: "draft", provenance: { reviewStatus: "draft", graduationBlockers: ["write prose"] } });

describe("pack provenance editor", () => {
  it("preserves unrelated bytes while editing whole-pack provenance", () => {
    let json = setPackProvenanceSources(draft, [" reference-a ", "reference-a", "reference-b"]);
    json = setPackProvenancePosture(json, "cc_by_sa");
    json = addPackAttribution(json);
    json = updatePackAttribution(json, 0, {
      sourceId: "wikibooks-french",
      noticeText: "Chess Opening Theory by Wikibooks contributors, CC BY-SA 4.0.",
      url: "https://en.wikibooks.org/wiki/Chess_Opening_Theory",
      retrievedAt: "2026-08-25",
    });

    const parsed = JSON.parse(json);
    expect(parsed.provenance).toMatchObject({
      reviewStatus: "draft",
      graduationBlockers: ["write prose"],
      sources: ["reference-a", "reference-b"],
      licence: "CC-BY-SA-4.0",
      attribution: [{ sourceId: "wikibooks-french", licence: "CC-BY-SA-4.0", retrievedAt: "2026-08-25" }],
    });
    expect(readPackProvenance(json)).toMatchObject({ valid: true, posture: "cc_by_sa" });
  });

  it("makes clearing third-party credits an explicit posture change", () => {
    const credited = updatePackAttribution(addPackAttribution(draft), 0, { sourceId: "source", noticeText: "notice" });
    const original = JSON.parse(setPackProvenancePosture(credited, "original"));
    expect(original.provenance).not.toHaveProperty("licence");
    expect(original.provenance).not.toHaveProperty("attribution");
    expect(original.provenance.reviewStatus).toBe("draft");
  });

  it("preserves an unsupported licence as an honest third state", () => {
    const unsupported = JSON.stringify({ provenance: { reviewStatus: "draft", licence: "CC0-1.0", attribution: [{ licence: "CC0-1.0" }] } });
    expect(readPackProvenance(unsupported)).toMatchObject({ valid: true, posture: "unsupported", licence: "CC0-1.0" });
    expect(readPackProvenance("not json").valid).toBe(false);
    expect(readPackProvenance(removePackAttribution(addPackAttribution(draft), 0)).attribution).toEqual([]);
  });
});
