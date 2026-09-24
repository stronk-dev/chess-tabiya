import type { EndgameTechnique } from "./endgame-setup.js";

export interface EndgameSetupFixture {
  readonly id: string;
  readonly fen: string;
  /** Techniques whose registered setup convention must fire on this FEN (empty = none may fire). */
  readonly fires: readonly EndgameTechnique[];
  readonly role: "published_diagram" | "colour_mirror" | "file_mirror" | "hard_negative" | "near_miss";
  /** For near-misses: the single convention operand the position is built to fail. */
  readonly fails?: string;
}

/**
 * Setup-match fixtures. Published diagrams are the sources' own diagram placements (both sides to
 * move); mirrors test colour/file symmetry; near-misses change one placement so exactly the named
 * operand fails; hard negatives are KRPKR (or near-KRPKR) positions that are none of the three.
 * The recorded Syzygy category for every FEN is in `fixtures/endgame-setup-tablebase.json`.
 */
export const ENDGAME_SETUP_FIXTURES: readonly EndgameSetupFixture[] = Object.freeze([
  // Lucena — Wikipedia "Lucena position" diagram (oldid=1356336262).
  { id: "lucena-diagram-w", fen: "1K1k4/1P6/8/8/8/8/r7/2R5 w - - 0 1", fires: ["lucena"], role: "published_diagram" },
  { id: "lucena-diagram-b", fen: "1K1k4/1P6/8/8/8/8/r7/2R5 b - - 0 1", fires: ["lucena"], role: "published_diagram" },
  { id: "lucena-black-attacker-b", fen: "2r5/R7/8/8/8/8/1p6/1k1K4 b - - 0 1", fires: ["lucena"], role: "colour_mirror" },
  { id: "lucena-black-attacker-w", fen: "2r5/R7/8/8/8/8/1p6/1k1K4 w - - 0 1", fires: ["lucena"], role: "colour_mirror" },
  { id: "lucena-near-pawn-sixth", fen: "1K1k4/8/1P6/8/8/8/r7/2R5 w - - 0 1", fires: [], role: "near_miss", fails: "pawn_on_seventh" },
  { id: "lucena-near-king-off-square", fen: "3k4/1P6/1K6/8/8/8/r7/2R5 w - - 0 1", fires: [], role: "near_miss", fails: "attacking_king_on_queening_square" },
  { id: "lucena-near-rook-ray-blocked", fen: "1K1k4/1P6/2r5/8/8/8/8/2R5 w - - 0 1", fires: [], role: "near_miss", fails: "attacking_rook_cuts_off_defending_king" },
  { id: "lucena-near-rook-not-between", fen: "1K1k4/1P6/8/8/8/8/r7/4R3 w - - 0 1", fires: [], role: "near_miss", fails: "attacking_rook_cuts_off_defending_king" },
  { id: "lucena-near-rook-pawn", fen: "K1k5/P7/8/8/8/8/7r/1R6 w - - 0 1", fires: [], role: "near_miss", fails: "pawn_not_rook_pawn" },
  // Philidor — Wikipedia "Philidor position" diagram (oldid=1356336197).
  { id: "philidor-diagram-w", fen: "8/8/8/8/4pk2/R7/7r/4K3 w - - 0 1", fires: ["philidor"], role: "published_diagram" },
  { id: "philidor-diagram-b", fen: "8/8/8/8/4pk2/R7/7r/4K3 b - - 0 1", fires: ["philidor"], role: "published_diagram" },
  { id: "philidor-white-attacker-w", fen: "4k3/7R/r7/4PK2/8/8/8/8 w - - 0 1", fires: ["philidor"], role: "colour_mirror" },
  { id: "philidor-white-attacker-b", fen: "4k3/7R/r7/4PK2/8/8/8/8 b - - 0 1", fires: ["philidor"], role: "colour_mirror" },
  { id: "philidor-near-pawn-on-third", fen: "8/8/8/8/5k2/R3p3/7r/4K3 w - - 0 1", fires: [], role: "near_miss", fails: "pawn_short_of_defender_third_rank" },
  { id: "philidor-near-rook-second-rank", fen: "8/8/8/8/4pk2/8/R6r/4K3 w - - 0 1", fires: [], role: "near_miss", fails: "defending_rook_on_defender_third_rank" },
  { id: "philidor-near-king-far", fen: "8/8/8/8/4pk2/R7/7r/K7 w - - 0 1", fires: [], role: "near_miss", fails: "defending_king_on_or_adjacent_to_queening_square" },
  { id: "philidor-near-attacker-king-on-third", fen: "8/8/8/8/4p3/R4k2/7r/4K3 b - - 0 1", fires: [], role: "near_miss", fails: "attacking_king_beyond_defender_third_rank" },
  // Vančura — Wikipedia "Rook and pawn versus rook endgame" §Vančura position diagram (oldid=1364966292).
  { id: "vancura-diagram-w", fen: "R7/6k1/P4r2/8/2K5/8/8/8 w - - 0 1", fires: ["vancura"], role: "published_diagram" },
  { id: "vancura-diagram-b", fen: "R7/6k1/P4r2/8/2K5/8/8/8 b - - 0 1", fires: ["vancura"], role: "published_diagram" },
  { id: "vancura-black-attacker-b", fen: "8/8/8/2k5/8/p4R2/6K1/r7 b - - 0 1", fires: ["vancura"], role: "colour_mirror" },
  { id: "vancura-h-pawn-w", fen: "7R/1k6/2r4P/8/5K2/8/8/8 w - - 0 1", fires: ["vancura"], role: "file_mirror" },
  { id: "vancura-near-rook-not-in-front", fen: "1R6/6k1/P4r2/8/2K5/8/8/8 w - - 0 1", fires: [], role: "near_miss", fails: "attacking_rook_in_front_of_pawn" },
  { id: "vancura-near-king-out-of-zone", fen: "R7/8/P4rk1/8/2K5/8/8/8 w - - 0 1", fires: [], role: "near_miss", fails: "defending_king_in_drawing_zone" },
  { id: "vancura-near-side-attack-blocked", fen: "R7/6k1/P2K1r2/8/8/8/8/8 w - - 0 1", fires: [], role: "near_miss", fails: "defending_rook_attacks_pawn_from_side" },
  { id: "vancura-near-knight-pawn", fen: "1R6/6k1/1P3r2/8/2K5/8/8/8 w - - 0 1", fires: [], role: "near_miss", fails: "rook_pawn" },
  // Hard negatives.
  { id: "browser-inspector-fen", fen: "4k2r/8/8/8/8/8/RP6/4K3 w - - 0 1", fires: [], role: "hard_negative" },
  { id: "krpkr-pawn-home-kings-central", fen: "8/3k4/8/2r5/8/3K4/4P3/5R2 w - - 0 1", fires: [], role: "hard_negative" },
  { id: "krpkr-pawn-seventh-king-beside", fen: "3k4/1P6/2K5/8/8/8/r7/2R5 w - - 0 1", fires: [], role: "hard_negative" },
  { id: "krkr-no-pawn", fen: "4k2r/8/8/8/8/8/R7/4K3 w - - 0 1", fires: [], role: "hard_negative" },
  { id: "krppkr-extra-pawn", fen: "1K1k4/1P6/8/8/8/8/r6P/2R5 w - - 0 1", fires: [], role: "hard_negative" },
].map((fixture) => Object.freeze({ ...fixture, fires: Object.freeze([...fixture.fires]) as readonly EndgameTechnique[] })) as readonly EndgameSetupFixture[]);
