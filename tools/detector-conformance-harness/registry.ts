// DISPOSABLE research registry — D629. This describes the shipped contract at the
// audited commit; it is not a production allow-list or schema authority.
import type { StructuralFeatureKind, TransitionFeatureKind } from "@chess-tabiya/schema/drill-pack";

export type Disposition =
  | "raw_inspector_atom"
  | "authored_condition_primitive"
  | "rename_or_version"
  | "cannot_emit"
  | "split_family";

export type Fidelity = "round_trip" | "reader_subset" | "lossy" | "matcher_only";

export interface StructuralConformanceRow {
  readonly kind: StructuralFeatureKind;
  readonly literalComputation: string;
  readonly fidelity: Fidelity;
  readonly disposition: Disposition;
  readonly blocker: string;
}

export const STRUCTURAL_CONFORMANCE = Object.freeze([
  { kind: "pawn_safe_square", literalComputation: "enemy-pawn current-file reach projection; boolean ignores captureAttackers, occupancy and legal paths", fidelity: "lossy", disposition: "rename_or_version", blocker: "The name and safe boolean overclaim the computed projection (D566)." },
  { kind: "outpost", literalComputation: "relative rank 4–6, own-pawn support and pawn_safe_square projection", fidelity: "reader_subset", disposition: "authored_condition_primitive", blocker: "The matcher accepts an unoccupied square; the reader emits only occupied non-pawn/non-king squares, and the definition inherits D566." },
  { kind: "backward_pawn", literalComputation: "pawn on file, no adjacent-file pawn at or behind its rank, enemy pawn attacks its one-step stop square", fidelity: "round_trip", disposition: "authored_condition_primitive", blocker: "A deterministic Tabiya convention, not learner valence or a universal definition." },
  { kind: "isolated_pawn", literalComputation: "own pawn on file and no own pawn on either adjacent file", fidelity: "round_trip", disposition: "raw_inspector_atom", blocker: "Exact state does not establish importance or weakness." },
  { kind: "doubled_pawn", literalComputation: "at least two own pawns on one file", fidelity: "round_trip", disposition: "raw_inspector_atom", blocker: "Exact state does not establish importance or weakness." },
  { kind: "passed_pawn", literalComputation: "named own pawn with no enemy pawn ahead on its or adjacent files", fidelity: "round_trip", disposition: "raw_inspector_atom", blocker: "Exact convention does not establish value, route or promotion race." },
  { kind: "open_file", literalComputation: "no pawn of either colour on the file", fidelity: "round_trip", disposition: "raw_inspector_atom", blocker: "Exact state does not establish relevance." },
  { kind: "half_open_file", literalComputation: "no own pawn and at least one enemy pawn on the file", fidelity: "round_trip", disposition: "raw_inspector_atom", blocker: "Exact state does not establish relevance." },
  { kind: "line_blockers", literalComputation: "occupied squares strictly between two aligned endpoints", fidelity: "round_trip", disposition: "raw_inspector_atom", blocker: "Reader emits every slider-to-edge ray, not a significant line or affected target." },
  { kind: "direct_attack_count", literalComputation: "pseudo-legal chessops attack rays onto a target under current occupancy", fidelity: "round_trip", disposition: "raw_inspector_atom", blocker: "Pins and legal-move consequences are not evaluated." },
  { kind: "piece_reach_count", literalComputation: "pseudo-legal destinations excluding own occupancy", fidelity: "lossy", disposition: "rename_or_version", blocker: "Matcher aggregates any/every same-role piece while reader emits per piece; it is not a 2–3-ply threat." },
  { kind: "named_structure", literalComputation: "one of four hard-coded Tabiya pawn-skeleton expressions", fidelity: "lossy", disposition: "authored_condition_primitive", blocker: "Generic observation drops the matched structure id; the separate structures array retains it." },
  { kind: "bishop_on_shade", literalComputation: "bishop occupies a light or dark square", fidelity: "reader_subset", disposition: "raw_inspector_atom", blocker: "Reader is per bishop while matcher is existential; state alone is not a good/bad bishop claim." },
  { kind: "pawn_count", literalComputation: "pawn count or colour difference matcher", fidelity: "matcher_only", disposition: "cannot_emit", blocker: "structuralReading never emits this declared kind (D548); piece_count already covers pawn counts." },
  { kind: "king_opposition", literalComputation: "aligned kings with 1, 3 or 5 intervening squares and the opponent of the named colour to move", fidelity: "round_trip", disposition: "authored_condition_primitive", blocker: "A disclosed Tabiya convention; occupancy between kings is deliberately ignored by the implementation." },
  { kind: "piece_count", literalComputation: "role count or colour difference", fidelity: "round_trip", disposition: "raw_inspector_atom", blocker: "Exact count does not establish material valence." },
  { kind: "king_zone", literalComputation: "king on board edge or one of four corners", fidelity: "round_trip", disposition: "raw_inspector_atom", blocker: "A region label, not king safety." },
  { kind: "piece_distance", literalComputation: "minimum empty-board move distance for a role to a square or piece set", fidelity: "reader_subset", disposition: "rename_or_version", blocker: "Reader emits only king-to-king distance; matcher supports five roles, ignores occupancy, checks and turn sequence." },
] as const satisfies readonly StructuralConformanceRow[]);

export interface TransitionConformanceRow {
  readonly kind: TransitionFeatureKind;
  readonly literalComputation: string;
  readonly fidelity: Fidelity;
  readonly disposition: Disposition;
  readonly blocker: string;
}

export const TRANSITION_CONFORMANCE = Object.freeze([
  { kind: "attacked_squares_changed", literalComputation: "shared enemy-occupied targets changing between zero and non-zero pseudo-attackers", fidelity: "lossy", disposition: "raw_inspector_atom", blocker: "Computed target identities are discarded; captures, new occupants and attacker identity are excluded." },
  { kind: "defended_squares_changed", literalComputation: "shared friendly-occupied targets changing between zero and non-zero pseudo-defenders", fidelity: "lossy", disposition: "raw_inspector_atom", blocker: "Computed target identities are discarded; moved/captured/new pieces and defender identity are excluded." },
  { kind: "slider_lines_changed", literalComputation: "shared slider-to-edge rays whose blocker count increases or decreases", fidelity: "lossy", disposition: "raw_inspector_atom", blocker: "Ray/slider/target identities are discarded; added, removed or moved sliders have no shared key." },
  { kind: "escape_squares_changed", literalComputation: "safe geometric destinations gained/lost by pieces that remain on the same square", fidelity: "lossy", disposition: "rename_or_version", blocker: "Despite the kind name this covers every stationary piece, uses pseudo-attacks and omits mover identity and squares." },
  { kind: "defended_duties_changed", literalComputation: "stationary piece crosses the threshold of defending two attacked friendly pieces", fidelity: "lossy", disposition: "authored_condition_primitive", blocker: "Threshold and all piece/target identities are discarded; it does not establish overload or consequence." },
  { kind: "move_irreversibility", literalComputation: "priority result among castled, captured last-of-role and pawn contact, plus separately emitted halfmove-clock zeroing", fidelity: "lossy", disposition: "split_family", blocker: "Subkinds have different semantics; priority suppresses simultaneous labels and imported castling has the D547 UCI mismatch." },
] as const satisfies readonly TransitionConformanceRow[]);

export const GENERIC_READER_SINKS = Object.freeze([
  { path: "apps/server/src/guidance.ts", needle: "observations: reading.features", surface: "evidence packet" },
  { path: "apps/web/src/lib/DrillScreen.svelte", needle: "{#each structure.features as observation}", surface: "in-run structural dump" },
  { path: "apps/web/src/lib/CompareView.svelte", needle: ").features as observation}", surface: "comparison structural dump" },
  { path: "packages/runtime/src/compare-strips.ts", needle: "const observations = structuralReading(node.fen).features", surface: "branch difference strip" },
  { path: "apps/web/src/lib/DrillScreen.svelte", needle: "{#each transition?.observations ?? [] as observation}", surface: "in-run transition dump" },
] as const);
