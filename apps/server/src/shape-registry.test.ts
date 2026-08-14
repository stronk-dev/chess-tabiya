import { readdir } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { ServerError } from "./errors.js";
import { ShapeRegistry, projectShapeEntry } from "./shape-registry.js";

describe("ShapeRegistry", () => {
  it("loads official entries, derives channel, and projects an allow-list", async () => {
    const registry = await ShapeRegistry.loadDefault();
    const shapeFiles = (await readdir(new URL("../../../content/shapes/", import.meta.url)))
      .filter((name) => name.endsWith(".json")).map((name) => name.replace(/\.json$/, "")).sort();
    // Derived, not hand-pinned: the official catalogue IS the content/shapes directory.
    // A literal id list here re-breaks on every content wave (the D4 shape).
    expect(registry.list().map((entry) => entry.id)).toEqual(shapeFiles);
    expect(shapeFiles).toContain("carlsbad");
    expect(shapeFiles.length).toBeGreaterThanOrEqual(22);
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
