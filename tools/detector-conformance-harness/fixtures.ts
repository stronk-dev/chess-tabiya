import type { StructuralFeature } from "@chess-tabiya/schema/drill-pack";

export interface StructuralFixture {
  readonly kind: StructuralFeature["kind"];
  readonly feature: StructuralFeature;
  readonly positiveFen: string;
  readonly hardNegativeFen: string;
}

const carlsbad = "r1bqr1k1/pp1nbppp/2p2n2/3p2B1/3P4/2NBP3/PPQ1NPPP/R4RK1 b - - 7 10";

export const STRUCTURAL_FIXTURES = Object.freeze([
  { kind: "pawn_safe_square", feature: { kind: "pawn_safe_square", color: "black", square: "b5" }, positiveFen: "4k3/8/8/1n6/8/8/8/4K3 w - - 0 1", hardNegativeFen: "4k3/8/8/1n6/8/8/P7/4K3 w - - 0 1" },
  { kind: "outpost", feature: { kind: "outpost", color: "white", square: "e4" }, positiveFen: "4k3/8/8/8/8/3P4/8/4K3 w - - 0 1", hardNegativeFen: "4k3/8/8/8/8/4P3/3P4/4K3 w - - 0 1" },
  { kind: "backward_pawn", feature: { kind: "backward_pawn", color: "white", file: "d" }, positiveFen: "4k3/8/8/4p3/8/3P4/8/4K3 w - - 0 1", hardNegativeFen: "4k3/8/8/4p3/8/3P4/2P5/4K3 w - - 0 1" },
  { kind: "isolated_pawn", feature: { kind: "isolated_pawn", color: "white", file: "d" }, positiveFen: "4k3/8/8/8/3P4/8/8/4K3 w - - 0 1", hardNegativeFen: "4k3/8/8/8/3P4/2P5/8/4K3 w - - 0 1" },
  { kind: "doubled_pawn", feature: { kind: "doubled_pawn", color: "white", file: "d" }, positiveFen: "4k3/8/8/8/8/3P4/3P4/4K3 w - - 0 1", hardNegativeFen: "4k3/8/8/8/8/8/3P4/4K3 w - - 0 1" },
  { kind: "passed_pawn", feature: { kind: "passed_pawn", color: "white", square: "d5" }, positiveFen: "4k3/8/8/3P4/8/8/8/4K3 w - - 0 1", hardNegativeFen: "4k3/8/4p3/3P4/8/8/8/4K3 w - - 0 1" },
  { kind: "open_file", feature: { kind: "open_file", file: "a" }, positiveFen: "4k3/8/8/8/8/8/8/4K3 w - - 0 1", hardNegativeFen: "4k3/8/8/8/8/8/P7/4K3 w - - 0 1" },
  { kind: "half_open_file", feature: { kind: "half_open_file", color: "white", file: "d" }, positiveFen: "4k3/3p4/8/8/8/8/8/4K3 w - - 0 1", hardNegativeFen: "4k3/3p4/8/8/8/8/3P4/4K3 w - - 0 1" },
  { kind: "line_blockers", feature: { kind: "line_blockers", from: "a1", to: "a8", comparison: "equal", count: 1 }, positiveFen: "4k3/8/8/8/P7/8/8/R3K3 w - - 0 1", hardNegativeFen: "4k3/8/8/8/8/8/8/R3K3 w - - 0 1" },
  { kind: "direct_attack_count", feature: { kind: "direct_attack_count", color: "white", square: "a8", comparison: "equal", count: 1 }, positiveFen: "4k3/8/8/8/8/8/8/R3K3 w - - 0 1", hardNegativeFen: "4k3/8/8/8/P7/8/8/R3K3 w - - 0 1" },
  { kind: "piece_reach_count", feature: { kind: "piece_reach_count", color: "white", role: "rook", scope: "any", comparison: "atLeast", count: 7 }, positiveFen: "4k3/8/8/8/8/8/8/R3K3 w - - 0 1", hardNegativeFen: "4k3/8/8/8/8/8/P7/R3K3 w - - 0 1" },
  { kind: "named_structure", feature: { kind: "named_structure", id: "carlsbad" }, positiveFen: carlsbad, hardNegativeFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" },
  { kind: "bishop_on_shade", feature: { kind: "bishop_on_shade", color: "white", shade: "dark" }, positiveFen: "4k3/8/8/8/8/8/8/B3K3 w - - 0 1", hardNegativeFen: "4k3/8/8/8/8/8/8/1B2K3 w - - 0 1" },
  { kind: "pawn_count", feature: { kind: "pawn_count", color: "white", basis: "count", comparison: "equal", count: 2 }, positiveFen: "4k3/8/8/8/8/8/P6P/4K3 w - - 0 1", hardNegativeFen: "4k3/8/8/8/8/8/P7/4K3 w - - 0 1" },
  { kind: "king_opposition", feature: { kind: "king_opposition", color: "white", form: "direct" }, positiveFen: "8/8/8/4K3/8/4k3/8/8 b - - 0 1", hardNegativeFen: "8/8/8/4K3/8/4k3/8/8 w - - 0 1" },
  { kind: "piece_count", feature: { kind: "piece_count", color: "white", role: "rook", basis: "count", comparison: "equal", count: 1 }, positiveFen: "4k3/8/8/8/8/8/8/R3K3 w - - 0 1", hardNegativeFen: "4k3/8/8/8/8/8/8/4K3 w - - 0 1" },
  { kind: "king_zone", feature: { kind: "king_zone", color: "black", zone: "edge" }, positiveFen: "4k3/8/8/8/8/8/8/4K3 w - - 0 1", hardNegativeFen: "8/8/8/4k3/8/8/8/4K3 w - - 0 1" },
  { kind: "piece_distance", feature: { kind: "piece_distance", color: "white", role: "rook", target: { kind: "piece", color: "black", role: "king" }, comparison: "equal", count: 2 }, positiveFen: "4k3/8/8/8/8/8/8/R3K3 w - - 0 1", hardNegativeFen: "k7/8/8/8/8/8/8/R3K3 b - - 0 1" },
] as const satisfies readonly StructuralFixture[]);
