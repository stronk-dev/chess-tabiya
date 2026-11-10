// Pure matching over complete source snapshots. Sole factories authenticate original inputs.
import type { StructuralConventionKind, StructuralConventionRef, StructuralFeature } from "@chess-tabiya/schema/drill-pack";
import type { BackwardPawnSnapshot, OutpostCandidateSnapshot, UnobstructedOppositionSnapshot } from "./foundation-position-sources.js";

export type SelectedStructuralFeature<K extends StructuralConventionKind> = Extract<StructuralFeature, { readonly kind: K }>
  & { readonly conventionRef: StructuralConventionRef<K> };

export function matchingUnobstructedOpposition(source: UnobstructedOppositionSnapshot, feature: SelectedStructuralFeature<"king_opposition">) {
  const subject = source.opposition;
  const matched = subject !== null && subject.color === feature.color
    && (feature.form === "direct" ? subject.form === "direct" : subject.form === "distant_three" || subject.form === "distant_five");
  return Object.freeze(matched ? [Object.freeze({ kings: source.kings, opposition: subject })] : []);
}
export function matchingBackwardPawns(source: BackwardPawnSnapshot, feature: SelectedStructuralFeature<"backward_pawn">) {
  return Object.freeze(source.pawns.filter(row => row.color === feature.color && row.pawn[0] === feature.file));
}
export function matchingOutpostCandidates(source: OutpostCandidateSnapshot, feature: SelectedStructuralFeature<"outpost">) {
  return Object.freeze(source.candidates.filter(row => row.color === feature.color && row.square === feature.square));
}
