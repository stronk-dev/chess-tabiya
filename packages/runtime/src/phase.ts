import type { Color, Role, SquareName } from "chessops/types";
import { makeSquare, parseSquare } from "chessops/util";

import { positionFromFen } from "./chess.js";

export type DetectedPhase = "opening" | "middlegame" | "endgame" | "unclear";

export interface PhaseReading {
  readonly fen: string;
  readonly phase: DetectedPhase;
  readonly material: Readonly<Record<Color, number>>;
  readonly undevelopedMinors: Readonly<Record<Color, number>>;
  readonly provenanceNote: string;
}

export const ENDGAME_MATERIAL_MAX = 13;
export const DEVELOPED_MATERIAL_MIN = 18;
export const OPENING_UNDEVELOPED_MIN = 5;
export const MIDDLEGAME_UNDEVELOPED_MAX = 2;
export const PHASE_PROVENANCE = "Tabiya's phase bands";
export const DEVELOPMENT_CONVENTION = "development@1" as const;

const MATERIAL = Object.freeze({ queen: 9, rook: 5, bishop: 3, knight: 3 } as const);
const HOME: Readonly<Record<Color, readonly string[]>> = Object.freeze({
  white: Object.freeze(["b1", "g1", "c1", "f1"]),
  black: Object.freeze(["b8", "g8", "c8", "f8"]),
});

export const DEVELOPMENT_HOMES: Readonly<Record<Color, Readonly<Record<"knight" | "bishop", readonly SquareName[]>>>> = Object.freeze({
  white: Object.freeze({ knight: Object.freeze(["b1", "g1"] as const), bishop: Object.freeze(["c1", "f1"] as const) }),
  black: Object.freeze({ knight: Object.freeze(["b8", "g8"] as const), bishop: Object.freeze(["c8", "f8"] as const) }),
});

export interface DevelopmentReading {
  readonly fen: string;
  readonly conventionId: typeof DEVELOPMENT_CONVENTION;
  readonly undeveloped: Readonly<Record<Color, readonly { readonly square: SquareName; readonly role: "knight" | "bishop" }[]>>;
}

export function isDevelopmentHome(color: Color, role: Role, square: SquareName): boolean {
  return (role === "knight" || role === "bishop") && DEVELOPMENT_HOMES[color][role].includes(square);
}

export function developmentReading(fen: string): DevelopmentReading {
  const position = positionFromFen(fen);
  const undeveloped = { white: [] as { square: SquareName; role: "knight" | "bishop" }[], black: [] as { square: SquareName; role: "knight" | "bishop" }[] };
  for (const color of ["white", "black"] as const) {
    for (const role of ["knight", "bishop"] as const) {
      for (const squareName of DEVELOPMENT_HOMES[color][role]) {
        const square = parseSquare(squareName)!;
        const piece = position.board.get(square);
        if (piece?.color === color && piece.role === role) undeveloped[color].push(Object.freeze({ square: makeSquare(square), role }));
      }
    }
  }
  return Object.freeze({
    fen,
    conventionId: DEVELOPMENT_CONVENTION,
    undeveloped: Object.freeze({ white: Object.freeze(undeveloped.white), black: Object.freeze(undeveloped.black) }),
  });
}

export function classifyPhase(fen: string): PhaseReading {
  const position = positionFromFen(fen);
  const material = { white: 0, black: 0 };
  for (const [, piece] of position.board) {
    if (piece.role in MATERIAL) material[piece.color] += MATERIAL[piece.role as keyof typeof MATERIAL];
  }
  const undevelopedMinors = { white: 0, black: 0 };
  for (const color of ["white", "black"] as const) {
    for (const squareName of HOME[color]) {
      const square = parseSquare(squareName)!;
      const piece = position.board.get(square);
      if (piece?.color === color && (piece.role === "bishop" || piece.role === "knight")) undevelopedMinors[color] += 1;
    }
  }
  const maximum = Math.max(material.white, material.black);
  const undeveloped = undevelopedMinors.white + undevelopedMinors.black;
  const phase: DetectedPhase = maximum <= ENDGAME_MATERIAL_MAX
    ? "endgame"
    : maximum < DEVELOPED_MATERIAL_MIN
      ? "unclear"
      : undeveloped >= OPENING_UNDEVELOPED_MIN
        ? "opening"
        : undeveloped <= MIDDLEGAME_UNDEVELOPED_MAX
          ? "middlegame"
          : "unclear";
  return Object.freeze({ fen, phase, material: Object.freeze(material), undevelopedMinors: Object.freeze(undevelopedMinors), provenanceNote: PHASE_PROVENANCE });
}

export const PHASE_BAND_CONVENTION = "phase-bands@1" as const;

/** The five exact [[D2484]] decision arms. Margins and distances are integer operand distances. */
export type PhaseBandDecision =
  | { readonly kind: "endgame_material_band"; readonly phase: "endgame"; readonly axis: "maximum_non_pawn_material"; readonly observed: number; readonly boundary: number; readonly marginInsideBand: number }
  | { readonly kind: "material_transition_gap"; readonly phase: "unclear"; readonly axis: "maximum_non_pawn_material"; readonly observed: number; readonly endgameBoundary: number; readonly developedBoundary: number; readonly distanceToEndgameBand: number; readonly distanceToDevelopedBand: number }
  | { readonly kind: "opening_development_band"; readonly phase: "opening"; readonly axis: "undeveloped_home_minors"; readonly observed: number; readonly boundary: number; readonly marginInsideBand: number }
  | { readonly kind: "middlegame_development_band"; readonly phase: "middlegame"; readonly axis: "undeveloped_home_minors"; readonly observed: number; readonly boundary: number; readonly marginInsideBand: number }
  | { readonly kind: "development_transition_gap"; readonly phase: "unclear"; readonly axis: "undeveloped_home_minors"; readonly observed: number; readonly middlegameBoundary: number; readonly openingBoundary: number; readonly distanceToMiddlegameBand: number; readonly distanceToOpeningBand: number };

/** `rules.phase.reading@2`: the phase label and its exact decision arm under `phase-bands@1`. */
export interface PhaseBandReadingV2 {
  readonly fen: string;
  readonly phase: DetectedPhase;
  readonly material: Readonly<Record<Color, number>>;
  readonly undevelopedMinors: Readonly<Record<Color, number>>;
  readonly conventionId: typeof PHASE_BAND_CONVENTION;
  readonly decision: PhaseBandDecision;
}

/**
 * Computes the phase label and the decision arm together from one FEN. The arm is the only place a
 * boundary, margin or distance appears; none of them is a probability, move count or opening id.
 */
export function phaseBandReading(fen: string): PhaseBandReadingV2 {
  const reading = classifyPhase(fen);
  const maximum = Math.max(reading.material.white, reading.material.black);
  const undeveloped = reading.undevelopedMinors.white + reading.undevelopedMinors.black;
  const decision: PhaseBandDecision = maximum <= ENDGAME_MATERIAL_MAX
    ? { kind: "endgame_material_band", phase: "endgame", axis: "maximum_non_pawn_material", observed: maximum, boundary: ENDGAME_MATERIAL_MAX, marginInsideBand: ENDGAME_MATERIAL_MAX - maximum }
    : maximum < DEVELOPED_MATERIAL_MIN
      ? { kind: "material_transition_gap", phase: "unclear", axis: "maximum_non_pawn_material", observed: maximum, endgameBoundary: ENDGAME_MATERIAL_MAX, developedBoundary: DEVELOPED_MATERIAL_MIN, distanceToEndgameBand: maximum - ENDGAME_MATERIAL_MAX, distanceToDevelopedBand: DEVELOPED_MATERIAL_MIN - maximum }
      : undeveloped >= OPENING_UNDEVELOPED_MIN
        ? { kind: "opening_development_band", phase: "opening", axis: "undeveloped_home_minors", observed: undeveloped, boundary: OPENING_UNDEVELOPED_MIN, marginInsideBand: undeveloped - OPENING_UNDEVELOPED_MIN }
        : undeveloped <= MIDDLEGAME_UNDEVELOPED_MAX
          ? { kind: "middlegame_development_band", phase: "middlegame", axis: "undeveloped_home_minors", observed: undeveloped, boundary: MIDDLEGAME_UNDEVELOPED_MAX, marginInsideBand: MIDDLEGAME_UNDEVELOPED_MAX - undeveloped }
          : { kind: "development_transition_gap", phase: "unclear", axis: "undeveloped_home_minors", observed: undeveloped, middlegameBoundary: MIDDLEGAME_UNDEVELOPED_MAX, openingBoundary: OPENING_UNDEVELOPED_MIN, distanceToMiddlegameBand: undeveloped - MIDDLEGAME_UNDEVELOPED_MAX, distanceToOpeningBand: OPENING_UNDEVELOPED_MIN - undeveloped };
  if (decision.phase !== reading.phase) throw new TypeError(`Phase-band decision ${decision.kind} disagrees with the classifier label ${reading.phase}`);
  return Object.freeze({ fen: reading.fen, phase: reading.phase, material: reading.material, undevelopedMinors: reading.undevelopedMinors, conventionId: PHASE_BAND_CONVENTION, decision: Object.freeze(decision) });
}

export function renderPhaseReading(reading: PhaseReading): string {
  return reading.phase === "unclear"
    ? `${PHASE_PROVENANCE} do not classify this position.`
    : `Detected by ${PHASE_PROVENANCE}: ${reading.phase}.`;
}
