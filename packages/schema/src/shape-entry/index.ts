import { digestCanonicalJson } from "../drill-pack/digest.js";

export type { ShapeEntryDefinition, ShapePhase, ShapePlan } from "./types.js";

export function digestShapeEntry(entry: unknown): Promise<string> {
  return digestCanonicalJson(entry);
}
