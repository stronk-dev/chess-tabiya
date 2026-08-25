export type ShapeRelation = "present" | "prospective";
export type ShapeFieldScope = { readonly kind: "pack" } | { readonly kind: "leg"; readonly index: number };

export interface ShapeFieldDraft {
  readonly label: string;
  readonly scope: ShapeFieldScope;
  readonly selected: ReadonlyMap<string, ShapeRelation>;
}

export interface PrincipleFieldDraft {
  readonly index: number;
  readonly id: string;
  readonly text: string;
  readonly selected: ReadonlySet<string>;
}

export interface PackVocabularyDraft {
  readonly valid: boolean;
  readonly shapeFields: readonly ShapeFieldDraft[];
  readonly principleFields: readonly PrincipleFieldDraft[];
}

function record(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function parseDocument(documentJson: string): Record<string, unknown> {
  const document = record(JSON.parse(documentJson));
  if (document === undefined) throw new TypeError("Pack JSON must be an object");
  return document;
}

function readShapeReferences(value: unknown): ReadonlyMap<string, ShapeRelation> {
  const selected = new Map<string, ShapeRelation>();
  if (!Array.isArray(value)) return selected;
  for (const reference of value) {
    if (typeof reference === "string") selected.set(reference, "present");
    else {
      const row = record(reference);
      if (typeof row?.shape === "string" && (row.relation === "present" || row.relation === "prospective")) selected.set(row.shape, row.relation);
    }
  }
  return selected;
}

export function readPackVocabulary(documentJson: string): PackVocabularyDraft {
  try {
    const document = parseDocument(documentJson);
    const shapeFields: ShapeFieldDraft[] = [{ label: "Pack shapes", scope: { kind: "pack" }, selected: readShapeReferences(document.shapes) }];
    if (Array.isArray(document.legs)) {
      for (const [index, value] of document.legs.entries()) {
        const leg = record(value);
        if (leg === undefined) continue;
        shapeFields.push({ label: `Leg: ${typeof leg.id === "string" ? leg.id : index + 1}`, scope: { kind: "leg", index }, selected: readShapeReferences(leg.shapes) });
      }
    }
    const principleFields: PrincipleFieldDraft[] = [];
    if (Array.isArray(document.feedbackClaims)) {
      for (const [index, value] of document.feedbackClaims.entries()) {
        const claim = record(value);
        if (claim === undefined) continue;
        principleFields.push({
          index,
          id: typeof claim.id === "string" ? claim.id : `claim-${index + 1}`,
          text: typeof claim.text === "string" ? claim.text : "",
          selected: new Set(Array.isArray(claim.principles) ? claim.principles.filter((id): id is string => typeof id === "string") : []),
        });
      }
    }
    return { valid: true, shapeFields, principleFields };
  } catch {
    return { valid: false, shapeFields: [], principleFields: [] };
  }
}

function write(document: Record<string, unknown>): string { return JSON.stringify(document, null, 2); }

function updateShapeList(value: unknown, shapeId: string, checked: boolean, relation: ShapeRelation): unknown[] {
  const rows = Array.isArray(value) ? [...value] : [];
  const filtered = rows.filter((reference) => typeof reference === "string" ? reference !== shapeId : record(reference)?.shape !== shapeId);
  if (checked) filtered.push(relation === "present" ? shapeId : { shape: shapeId, relation });
  return filtered;
}

export function setPackShapeReference(documentJson: string, scope: ShapeFieldScope, shapeId: string, checked: boolean, relation: ShapeRelation = "present"): string {
  const document = parseDocument(documentJson);
  if (scope.kind === "pack") {
    const rows = updateShapeList(document.shapes, shapeId, checked, relation);
    if (rows.length === 0) delete document.shapes; else document.shapes = rows;
    return write(document);
  }
  if (!Array.isArray(document.legs)) return documentJson;
  const legs = [...document.legs];
  const leg = record(legs[scope.index]);
  if (leg === undefined) return documentJson;
  const next = { ...leg };
  const rows = updateShapeList(next.shapes, shapeId, checked, relation);
  if (rows.length === 0) delete next.shapes; else next.shapes = rows;
  legs[scope.index] = next;
  document.legs = legs;
  return write(document);
}

export function setClaimPrinciple(documentJson: string, claimIndex: number, principleId: string, checked: boolean): string {
  const document = parseDocument(documentJson);
  if (!Array.isArray(document.feedbackClaims)) return documentJson;
  const claims = [...document.feedbackClaims];
  const claim = record(claims[claimIndex]);
  if (claim === undefined) return documentJson;
  const next = { ...claim };
  const selected = new Set(Array.isArray(next.principles) ? next.principles.filter((id): id is string => typeof id === "string") : []);
  if (checked) selected.add(principleId); else selected.delete(principleId);
  if (selected.size === 0) delete next.principles; else next.principles = [...selected];
  claims[claimIndex] = next;
  document.feedbackClaims = claims;
  return write(document);
}
