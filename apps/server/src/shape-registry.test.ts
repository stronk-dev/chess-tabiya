import { describe, expect, it } from "vitest";
import { ServerError } from "./errors.js";
import { ShapeRegistry, projectShapeEntry } from "./shape-registry.js";

describe("ShapeRegistry", () => {
  it("loads official entries, derives channel, and projects an allow-list", async () => {
    const registry = await ShapeRegistry.loadDefault();
    expect(registry.list().map((entry) => entry.id)).toEqual(["carlsbad", "iqp-black", "iqp-white", "rook-4v3-same-side"]);
    const projected = projectShapeEntry(registry.required("carlsbad"));
    expect(projected.channel).toBe("official");
    expect(projected).not.toHaveProperty("publisherHandle");
    expect(Object.keys(projected).sort()).toEqual(["channel", "id", "name", "phases", "plans", "provenance", "trigger", "typicalMistakes", "version", "watch"]);
  });

  it("uses typed not-found errors", async () => {
    const registry = await ShapeRegistry.loadDefault();
    expect(() => registry.required("missing")).toThrowError(expect.objectContaining<Partial<ServerError>>({ code: "SHAPE_NOT_FOUND" }));
  });
});
