import { describe, expect, it } from "vitest";

import { DrillApi } from "./api.js";
import { parseShapeDocument } from "./shape-response.js";

const digest = `sha256:${"b".repeat(64)}`;
const shape = Object.freeze({
  id: "carlsbad",
  version: "0.3.0",
  name: "Carlsbad structure",
  phases: ["middlegame"],
  trigger: {
    kind: "all",
    of: [
      { kind: "feature", feature: { kind: "named_structure", id: "carlsbad" } },
      { kind: "not", of: { kind: "pieceOnSquare", square: "c4", piece: { color: "white", role: "pawn" } } },
    ],
  },
  plans: [
    {
      id: "minority-attack",
      side: "white",
      label: "Create a queenside weakness",
      description: "Advance the minority.",
      success: {
        note: "A black pawn is backward.",
        signature: { kind: "quantified", quantifier: "some", over: { files: { from: "b", to: "c" } }, feature: { kind: "backward_pawn", color: "black" } },
      },
    },
    {
      id: "kingside-play",
      side: "black",
      label: "Build kingside play",
      description: "Use the space on the other wing.",
      success: {
        note: "A black knight reaches the kingside.",
        signature: { kind: "feature", feature: { kind: "piece_distance", color: "black", role: "knight", target: { kind: "square", square: "f4" }, comparison: "atMost", count: 1 } },
      },
    },
  ],
  watch: ["Watch the c-file."],
  typicalMistakes: ["Do not create a target before support arrives."],
  provenance: {
    licence: "CC-BY-SA-4.0",
    sources: ["Grounded source"],
    attribution: [{ title: "Source", author: "Author", url: "https://example.test/carlsbad", licence: "CC-BY-SA-4.0" }],
  },
  channel: "official",
});

describe("shape response authority", () => {
  it("accepts and freezes the complete public shape projection", () => {
    const parsed = parseShapeDocument(shape, "carlsbad");
    expect(parsed).toEqual(shape);
    expect(Object.isFrozen(parsed)).toBe(true);
    expect(Object.isFrozen(parsed.trigger)).toBe(true);
  });

  it.each([
    [{ ...shape, id: "crossed" }],
    [{ ...shape, serverOnly: true }],
    [{ ...shape, phases: ["middlegame", "middlegame"] }],
    [{ ...shape, trigger: { kind: "feature", feature: { kind: "invented", color: "white" } } }],
    [{ ...shape, trigger: { ...shape.trigger, editorial: "trust me" } }],
    [{ ...shape, plans: [shape.plans[0], shape.plans[0]] }],
    [{ ...shape, plans: [shape.plans[0]] }],
    [{ ...shape, provenance: { ...shape.provenance, attribution: [{ ...shape.provenance.attribution[0], url: "not a uri" }] } }],
    [{ ...shape, publisherHandle: "forged" }],
  ])("refuses crossed, malformed, or trust-bearing shape bytes", (value) => {
    expect(() => parseShapeDocument(value, "carlsbad")).toThrow(TypeError);
  });

  it("binds DrillApi.shape to the requested subject and canonical digest", async () => {
    const api = new DrillApi("http://tabiya.test", async () => Response.json(shape, { headers: { "x-shape-digest": digest } }));
    await expect(api.shape("carlsbad")).resolves.toMatchObject({ document: { id: "carlsbad" }, digest });
    await expect(new DrillApi("http://tabiya.test", async () => Response.json({ ...shape, id: "other" }, { headers: { "x-shape-digest": digest } })).shape("carlsbad")).rejects.toThrow(/requested id/u);
    await expect(new DrillApi("http://tabiya.test", async () => Response.json(shape, { headers: { "x-shape-digest": "shape-digest" } })).shape("carlsbad")).rejects.toThrow(/omitted its digest/u);
  });
});
