// Mechanical registry documents only. No lesson, strategic recommendation or qualification.
import type { ShapeEntryDefinition } from "@chess-tabiya/schema/shape-entry";
export function registeredShapeFixture(id = "mechanical-knight-location", black = false): ShapeEntryDefinition {
  const trigger = { kind: "pieceOnSquare" as const, square: black ? "f6" as const : "f3" as const,
    piece: { color: black ? "black" as const : "white" as const, role: "knight" as const } };
  return { id, version: "1.0.0", name: "Mechanical test occupancy", phases: ["opening"], trigger,
    plans: (["white", "black"] as const).map(side => ({ id: `${side}-occupancy`, side, label: "Mechanical fixture",
      description: "No strategic assertion.", success: { note: "Occupancy only", signature: trigger } })),
    watch: ["Mechanical occupancy only"], typicalMistakes: ["Fixture only; no strategic validation."],
    provenance: { licence: "CC0-1.0", sources: ["Mechanical software fixture"], attribution: [{ title: "Test fixture", author: "Tabiya tests", licence: "CC0-1.0" }] } };
}

/** Actual registry-owned singleton scans for runtime/module tests; no evidence or renderer stub. */
export async function registeredShapePointFixture(
  points: readonly Readonly<{ id: string; fen: string }>[], documents: readonly ShapeEntryDefinition[] = [registeredShapeFixture()],
) {
  const { ShapeRegistry } = await import("../../../../apps/server/src/shape-registry.js");
  const registry = new ShapeRegistry();
  for (const document of documents) await registry.add(document, "community", "mechanical-author");
  const scans = new Map<string, import("../internal/registered-shape-scan.js").RegisteredShapeScan>();
  for (const point of points) {
    const builder = await registry.beginCurrentShapeScan([{ id: point.id, fen: point.fen }], new AbortController().signal);
    for (;;) {
      const step = registry.advanceCurrentShapeScan(builder);
      if (step.kind === "complete") { scans.set(point.id, step.scan); break; }
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
  return { registry, scans, shapeAt(nodeId: string) {
    const scan = scans.get(nodeId); if (scan === undefined) throw new TypeError("No genuine fixture point for the requested timing subject");
    return Object.freeze({ kind: "available" as const, scan });
  } };
}
