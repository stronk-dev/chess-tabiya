/** The accepted closed kind/ref table. Schemas and every parser use these exact pairs. */
export const STRUCTURAL_CONVENTION_REFS = Object.freeze({
  king_opposition: Object.freeze({ id: "king-opposition-unobstructed", version: 1 } as const),
  backward_pawn: Object.freeze({ id: "backward-pawn", version: 1 } as const),
  outpost: Object.freeze({ id: "outpost-candidate", version: 1 } as const),
});
export type StructuralConventionKind = keyof typeof STRUCTURAL_CONVENTION_REFS;
export type StructuralConventionRef<K extends StructuralConventionKind = StructuralConventionKind> = (typeof STRUCTURAL_CONVENTION_REFS)[K];

export function structuralConventionRefForKind(kind: string): StructuralConventionRef | undefined {
  return Object.hasOwn(STRUCTURAL_CONVENTION_REFS, kind) ? STRUCTURAL_CONVENTION_REFS[kind as StructuralConventionKind] : undefined;
}

/** Missing means legacy. Present undefined/null/aliases/wrong-kind/extra fields never do. */
export function assertStructuralConventionSelection(feature: Readonly<Record<string, unknown>>): void {
  if (!Object.hasOwn(feature, "conventionRef")) return;
  const expected = typeof feature.kind === "string" ? structuralConventionRefForKind(feature.kind) : undefined;
  const ref = feature.conventionRef;
  if (expected === undefined || ref === null || typeof ref !== "object" || Array.isArray(ref)
    || Object.keys(ref).sort().join() !== "id,version" || (ref as { id?: unknown }).id !== expected.id
    || (ref as { version?: unknown }).version !== expected.version) throw new TypeError("Structural conventionRef is not the exact allowed kind/id/version pair");
}

/** Materialized in both JSON schema copies by the checked schema command. */
export function structuralConventionRefSchema(kind: string) {
  const ref = structuralConventionRefForKind(kind);
  return ref === undefined ? undefined : { type: "object", required: ["id", "version"],
    properties: { id: { enum: [ref.id] }, version: { const: ref.version } }, additionalProperties: false };
}

/** The historical factories cannot publish an explicit successor as their legacy meaning. */
export function assertLegacyStructuralExpression(value: unknown): void {
  const active = new WeakSet<object>();
  const visit = (node: unknown): void => {
    if (node === null || typeof node !== "object" || Array.isArray(node)) return;
    if (active.has(node)) throw new TypeError("Cyclic structural expression");
    active.add(node);
    const item = node as Record<string, unknown>;
    if ((item.kind === "feature" || item.kind === "quantified") && item.feature !== null && typeof item.feature === "object"
      && Object.hasOwn(item.feature, "conventionRef")) throw new TypeError("Explicit structural convention requires the current sealed predicate dispatcher, not a legacy helper");
    if ((item.kind === "all" || item.kind === "any") && Array.isArray(item.of)) for (const child of item.of) visit(child);
    else if (item.kind === "not" || item.kind === "mirrored") visit(item.of);
    active.delete(node);
  };
  visit(value);
}
