import { readdir } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { digestShapeEntry, type ShapeEntryDefinition } from "@chess-tabiya/schema/shape-entry";
import { matchesStructuralExpression } from "@chess-tabiya/runtime";
import { ServerError } from "./errors.js";
import { ShapeRegistry, projectShapeEntry } from "./shape-registry.js";
import { validateShapeEntry } from "./shape-validation.js";

function mechanicalEntry(): ShapeEntryDefinition {
  return {
    id: "immutable-shape-fixture", version: "1.0.0", name: "Mechanical registry fixture",
    phases: ["middlegame"],
    trigger: { kind: "all", of: [{ kind: "pieceOnSquare", square: "e5", piece: { color: "black", role: "pawn" } }] },
    plans: (["white", "black"] as const).map(side => ({ id: `${side}-fixture`, side,
      label: "Mechanical fixture", description: "No strategic judgement.",
      success: { note: "Mechanical occupancy only.", signature: { kind: "pieceOnSquare", square: "e5", piece: { color: "black", role: "pawn" } } },
    })),
    watch: ["Mechanical fixture"], typicalMistakes: ["No chess judgement"],
    provenance: { licence: "CC0-1.0", sources: ["Mechanical software fixture; no chess review"],
      attribution: [{ title: "Mechanical fixture", author: "Tabiya tests", licence: "CC0-1.0" }] },
  };
}
const fixtureFen = "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2";

describe("ShapeRegistry", () => {
  it.each(["trigger", "success signature"] as const)("does not permit %s mutation under a registered digest", async operand => {
    const registry = new ShapeRegistry(), entry = mechanicalEntry();
    expect(validateShapeEntry(entry).valid).toBe(true);
    const record = await registry.add(entry, "community", "fixture-author");
    const before = structuredClone(record.document), digest = record.digest;
    const expression = operand === "trigger" ? record.document.trigger : record.document.plans[0]!.success.signature!;
    const leaf = expression.kind === "all" ? expression.of[0]! : expression;
    expect(matchesStructuralExpression(fixtureFen, expression)).toBe(true);
    const mutationAccepted = Reflect.set(leaf, "square", "d5");
    expect(matchesStructuralExpression(fixtureFen, expression)).toBe(true);
    expect(mutationAccepted).toBe(false);
    expect(registry.required(entry.id).document).toEqual(before);
    expect(registry.byDigest(digest)?.document).toEqual(before);
    expect(await digestShapeEntry(record.document)).toBe(digest);
  });

  it("freezes every nested registered value while isolating its input and projected views", async () => {
    const registry = new ShapeRegistry(), entry = mechanicalEntry(), before = structuredClone(entry);
    const record = await registry.add(entry, "community", "fixture-author");
    const inspect = (value: unknown): void => {
      if (value === null || typeof value !== "object") return;
      expect(Object.isFrozen(value)).toBe(true);
      for (const child of Object.values(value)) inspect(child);
    };
    inspect(record);
    // The caller still owns its input. Retaining an immutable snapshot must not freeze it.
    expect(Object.isFrozen(entry.trigger)).toBe(false);
    if (entry.trigger.kind !== "all") throw new Error("Mechanical fixture changed");
    expect(Reflect.set(entry.trigger.of[0]!, "square", "d5")).toBe(true);
    expect(registry.required(entry.id).document).toEqual(before);
    const first = projectShapeEntry(record), second = projectShapeEntry(record);
    expect(first).toEqual(second);
    expect(first.trigger).not.toBe(record.document.trigger);
    expect(second.trigger).not.toBe(first.trigger);
    expect(registry.byDigest(record.digest)).toBe(record);
  });

  it("captures the document before awaiting its digest and indexes only that snapshot", async () => {
    const registry = new ShapeRegistry(), entry = mechanicalEntry(), before = structuredClone(entry);
    const pending = registry.add(entry, "community", "fixture-author");
    // digestShapeEntry canonicalizes synchronously, then awaits Web Crypto. This is one
    // caller mutation, not a mocked scheduler or replacement digest implementation.
    expect(Reflect.set(entry, "id", "changed-during-digest")).toBe(true);
    if (entry.trigger.kind !== "all") throw new Error("Mechanical fixture changed");
    expect(Reflect.set(entry.trigger.of[0]!, "square", "d5")).toBe(true);
    const record = await pending;
    expect(record.document).toEqual(before);
    expect(record.digest).toBe(await digestShapeEntry(before));
    expect(await digestShapeEntry(record.document)).toBe(record.digest);
    expect(registry.required(before.id)).toBe(record);
    expect(registry.get(entry.id)).toBeUndefined();
    expect(registry.byDigest(record.digest)).toBe(record);
    expect(registry.list().map(summary => summary.id)).toEqual([before.id]);
  });

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
