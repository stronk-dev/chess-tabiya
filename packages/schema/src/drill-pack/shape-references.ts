import type { ShapeReference } from "./types.js";

export interface NormalizedShapeReference {
  readonly shape: string;
  readonly relation: "present" | "prospective";
}

export function normalizeShapeReference(reference: ShapeReference): NormalizedShapeReference {
  if (typeof reference === "string") return Object.freeze({ shape: reference, relation: "present" });
  if (reference.relation === "present" || reference.relation === "prospective") return Object.freeze({ shape: reference.shape, relation: reference.relation });
  const exhaustive: never = reference.relation;
  throw new TypeError(`Unhandled shape relation: ${String(exhaustive)}`);
}

export function normalizeShapeReferences(references: readonly ShapeReference[] | undefined): readonly NormalizedShapeReference[] {
  return Object.freeze((references ?? []).map(normalizeShapeReference));
}
