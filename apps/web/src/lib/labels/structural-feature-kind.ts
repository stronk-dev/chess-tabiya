// rfc/evidence-presentation.md §6b — one vocabulary, total over its own union type.
// A union member added without a label here is a compile error; never widen this to Partial.
import type { LabelVocabulary } from "@chess-tabiya/runtime";
import type { StructuralFeatureKind } from "@chess-tabiya/schema/drill-pack";

/** Structural position fact an author can test (`drill-pack` STRUCTURAL_FEATURE_KINDS). */
export const STRUCTURAL_FEATURE_KIND_LABELS: LabelVocabulary<StructuralFeatureKind> = Object.freeze({
  pawn_safe_square: { label: "pawn-safe square" },
  outpost: { label: "outpost" },
  backward_pawn: { label: "backward pawn" },
  isolated_pawn: { label: "isolated pawn" },
  doubled_pawn: { label: "doubled pawn" },
  passed_pawn: { label: "passed pawn" },
  open_file: { label: "open file" },
  half_open_file: { label: "half-open file" },
  line_blockers: { label: "pieces blocking a line" },
  direct_attack_count: { label: "attackers of a square" },
  piece_reach_count: { label: "squares a piece reaches" },
  named_structure: { label: "named pawn structure" },
  bishop_on_shade: { label: "bishop on one square colour" },
  pawn_count: { label: "pawn count" },
  king_opposition: { label: "king opposition" },
  piece_count: { label: "piece count" },
  king_zone: { label: "king on the edge or in a corner" },
  piece_distance: { label: "distance between pieces" },
});
