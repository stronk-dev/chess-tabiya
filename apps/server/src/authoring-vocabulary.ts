import { normalizeShapeReferences } from "@chess-tabiya/schema/drill-pack";

export interface VocabularyPack {
  readonly id: string;
  readonly shapes?: Parameters<typeof normalizeShapeReferences>[0];
  readonly feedbackClaims?: readonly { readonly principles?: readonly string[] }[];
}

export interface VocabularyUsage {
  readonly shapes: ReadonlyMap<string, number>;
  readonly principles: ReadonlyMap<string, number>;
}

function increment(map: Map<string, number>, ids: ReadonlySet<string>): void {
  for (const id of ids) map.set(id, (map.get(id) ?? 0) + 1);
}

export function vocabularyUsage(packs: readonly VocabularyPack[]): VocabularyUsage {
  const shapes = new Map<string, number>();
  const principles = new Map<string, number>();
  for (const pack of packs) {
    increment(shapes, new Set(normalizeShapeReferences(pack.shapes).map((reference) => reference.shape)));
    increment(principles, new Set((pack.feedbackClaims ?? []).flatMap((claim) => claim.principles ?? [])));
  }
  return Object.freeze({ shapes: Object.freeze(shapes), principles: Object.freeze(principles) });
}
