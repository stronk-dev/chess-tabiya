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

export function renderPhaseReading(reading: PhaseReading): string {
  return reading.phase === "unclear"
    ? `${PHASE_PROVENANCE} do not classify this position.`
    : `Detected by ${PHASE_PROVENANCE}: ${reading.phase}.`;
}
