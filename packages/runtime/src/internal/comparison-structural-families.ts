// Accepted F2 §§2.3d/i: a closed source vocabulary, not latest-version detector discovery.
export const COMPARISON_STRUCTURAL_ROUTES = Object.freeze([
  "rules.structural.reading.pawn_safe_square@1",
  "rules.structural.reading.outpost@1",
  "rules.structural.reading.backward_pawn@1",
  "rules.structural.reading.isolated_pawn@1",
  "rules.structural.reading.doubled_pawn@1",
  "rules.structural.reading.passed_pawn@1",
  "rules.structural.reading.open_file@1",
  "rules.structural.reading.half_open_file@1",
  "rules.structural.reading.line_blockers@1",
  "rules.structural.reading.direct_attack_count@1",
  "rules.structural.reading.piece_reach_count@1",
  "rules.structural.reading.named_structure@2",
  "rules.structural.reading.bishop_on_shade@1",
  "rules.structural.reading.king_opposition@1",
  "rules.structural.reading.piece_count@1",
  "rules.structural.reading.king_zone@1",
  "rules.structural.reading.piece_distance@1",
] as const);
export type ComparisonStructuralRoute = (typeof COMPARISON_STRUCTURAL_ROUTES)[number];
