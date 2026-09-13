import { describe, expect, it } from "vitest";

import { DrillApi } from "./api.js";
import { parsePackCatalog, parsePrincipleCatalog, parseShapeCatalog } from "./content-catalog-response.js";

const digest = `sha256:${"a".repeat(64)}`;
const pack = Object.freeze({
  id: "pack-a", version: "0.2.0", digest, title: "Pack A", mode: "plan", phase: "middlegame",
  difficulty: { minOnlineRapid: 1200, maxOnlineRapid: 1800, label: "Club player", branchLengthTarget: 8 },
  objectiveSummary: "Preserve the structure.", consequenceHorizon: { kind: "declared", plies: 8 }, concepts: ["minority-attack"],
  reviewStatus: "draft", channel: "community", publisherHandle: "author-a",
});
const shape = Object.freeze({ id: "shape-a", version: "0.3", digest, name: "Shape A", phases: ["middlegame"], licence: "CC-BY-SA-4.0", channel: "official", usedByPacks: 3 });
const principle = Object.freeze({ id: "principle-a", version: "0.1", digest, name: "Principle A", statement: "Improve the least active piece.", phases: ["opening", "middlegame"], licence: "CC-BY-SA-4.0", usedByPacks: 4 });

describe("content catalogue response authority", () => {
  it("accepts the three finite public projections", () => {
    expect(parsePackCatalog([pack])).toEqual([pack]);
    expect(parseShapeCatalog({ shapes: [shape] })).toEqual([shape]);
    expect(parsePrincipleCatalog({ principles: [principle] })).toEqual([principle]);
  });

  it.each([
    [[pack, pack]],
    [[{ ...pack, debug: true }]],
    [[{ ...pack, reviewStatus: "approved_by_ai" }]],
    [[{ ...pack, difficulty: { ...pack.difficulty, maxOnlineRapid: 1000 } }]],
    [[{ ...pack, digest: "not-a-digest" }]],
  ])("refuses malformed, duplicate, or crossed pack summaries", (value) => {
    expect(() => parsePackCatalog(value)).toThrow(TypeError);
  });

  it.each([
    [{ shapes: [{ ...shape, phases: ["cross_phase"] }] }],
    [{ shapes: [{ ...shape, usedByPacks: -1 }] }],
    [{ shapes: [{ ...shape, publisherHandle: "forged-official-author" }] }],
    [{ shapes: [shape, { ...shape, id: "shape-0" }] }],
    [{ shapes: [shape], internalRegistryState: true }],
  ])("refuses malformed or unordered shape catalogue bytes", (value) => {
    expect(() => parseShapeCatalog(value)).toThrow(TypeError);
  });

  it.each([
    [{ principles: [{ ...principle, phases: [] }] }],
    [{ principles: [{ ...principle, usedByPacks: 1.5 }] }],
    [{ principles: [{ ...principle, statement: "" }] }],
    [{ principles: [principle, principle] }],
    [{ principles: [{ ...principle, hiddenPrompt: "trust me" }] }],
  ])("refuses malformed or duplicate principle catalogue bytes", (value) => {
    expect(() => parsePrincipleCatalog(value)).toThrow(TypeError);
  });

  it("binds all three DrillApi methods to the response authority", async () => {
    const api = new DrillApi("http://tabiya.test", async (input) => {
      const url = String(input);
      if (url.endsWith("/packs")) return Response.json([{ ...pack, reviewStatus: "unknown" }]);
      if (url.endsWith("/shapes")) return Response.json({ shapes: [{ ...shape, usedByPacks: -1 }] });
      return Response.json({ principles: [{ ...principle, hiddenPrompt: "network prose" }] });
    });
    await expect(api.packs()).rejects.toThrow(TypeError);
    await expect(api.shapes()).rejects.toThrow(TypeError);
    await expect(api.principles()).rejects.toThrow(TypeError);
  });
});
