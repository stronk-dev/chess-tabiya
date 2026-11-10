// Exact physical root/direction joins; no pin, target or strategic judgement is inferred.
import { castlingSide } from "chessops/chess";
import type { Color, Role, Square, SquareName } from "chessops/types";
import { kingCastlesTo, makeSquare, parseUci, rookCastlesTo } from "chessops/util";
import { evidenceDigest, type DeclaredEvidence } from "./evidence-contract.js";
import type { ExactLegalMoveMap } from "./legal-moves.js";
import { positionFromSource } from "./foundation-position-sources.js";
import type { FoundationEdge, FoundationMembershipSign } from "./foundation-position-sources.js";
import { positionFromFen } from "./position-cache.js";

export interface SliderIdentity { readonly color: Color; readonly role: Role; readonly square: SquareName }
export interface PhysicalSliderRay {
  readonly slider: SliderIdentity;
  readonly endpoint: SquareName;
  readonly strictInterior: readonly SquareName[];
  readonly blockers: readonly SliderIdentity[];
}
export interface SliderMembershipChange extends FoundationEdge {
  readonly root: SliderIdentity;
  readonly direction: { readonly df: number; readonly dr: number };
  readonly sign: FoundationMembershipSign;
  readonly before: PhysicalSliderRay | null;
  readonly after: PhysicalSliderRay | null;
}
export interface PhysicalSliderRaySnapshot {
  readonly fen: string;
  readonly rows: readonly {
    readonly piece: SliderIdentity;
    readonly direction: { readonly df: -1 | 0 | 1; readonly dr: -1 | 0 | 1 };
    readonly ray: PhysicalSliderRay | null;
  }[];
}
const STEPS = [-1, 0, 1] as const;
const DIRECTIONS = STEPS.flatMap(df => STEPS.filter(dr => df !== 0 || dr !== 0).map(dr => ({ df, dr })));
/** Role/direction compatibility only, not a board move or tactical-target verdict. */
export function physicalRayDirectionAllowed(role: Role, df: number, dr: number): boolean {
  return (df !== 0 || dr !== 0) && (role === "queen" || role === "bishop" && df !== 0 && dr !== 0
    || role === "rook" && (df === 0 || dr === 0));
}
function freeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}
function ray(position: ReturnType<typeof positionFromFen>, square: Square | undefined, df: number, dr: number): PhysicalSliderRay | null {
  const piece = square === undefined ? undefined : position.board.get(square);
  if (piece === undefined || square === undefined || !physicalRayDirectionAllowed(piece.role, df, dr)) return null;
  const path: Square[] = [];
  for (let f = square % 8 + df, r = Math.floor(square / 8) + dr; f >= 0 && f < 8 && r >= 0 && r < 8; f += df, r += dr) path.push((f + 8 * r) as Square);
  const endpoint = path.pop();
  if (endpoint === undefined) return null;
  return { slider: { color: piece.color, role: piece.role, square: makeSquare(square) }, endpoint: makeSquare(endpoint),
    strictInterior: path.map(makeSquare), blockers: path.flatMap(at => {
      const blocker = position.board.get(at);
      return blocker === undefined ? [] : [{ color: blocker.color, role: blocker.role, square: makeSquare(at) }];
    }) };
}

/** Total private prerequisite: unlike sparse changes, unchanged/null/empty rays stay explicit. */
export function readPhysicalSliderRays(source: DeclaredEvidence<ExactLegalMoveMap>): PhysicalSliderRaySnapshot {
  const position = positionFromSource(source);
  // The legal map's pieces are mover-only. Its complete canonical FEN owns both-color domains.
  return freeze({ fen: source.payload.fen, rows: [...position.board.occupied].flatMap(square => {
    const piece = position.board.get(square)!;
    return DIRECTIONS.map(direction => ({
      piece: { color: piece.color, role: piece.role, square: makeSquare(square) },
      direction: { ...direction }, ray: ray(position, square, direction.df, direction.dr),
    }));
  }) });
}

/** Called only after sole-factory legal-edge authentication. Both castle pieces relocate. */
export function sliderMembershipChanges(edge: FoundationEdge): readonly SliderMembershipChange[] {
  const before = positionFromFen(edge.beforeFen), after = positionFromFen(edge.afterFen), move = parseUci(edge.moveUci);
  if (move === undefined || !("from" in move)) throw new TypeError("Slider membership requires a physical board move");
  const piece = before.board.get(move.from);
  if (piece === undefined) throw new TypeError("Slider edge has no mover");
  const castle = castlingSide(before, move);
  const relocations = new Map<Square, Square>(castle === undefined ? [[move.from, move.to]]
    : [[move.from, kingCastlesTo(before.turn, castle)], [move.to, rookCastlesTo(before.turn, castle)]]);
  // Captures remove the original target identity even if an identical role replaces it.
  let captured: Square | undefined = castle === undefined && before.board.get(move.to)?.color !== piece.color ? move.to : undefined;
  if (piece.role === "pawn" && move.from % 8 !== move.to % 8 && before.board.get(move.to) === undefined) captured = (move.to + (piece.color === "white" ? -8 : 8)) as Square;
  const result: SliderMembershipChange[] = [];
  for (const original of before.board.occupied) {
    const rootPiece = before.board.get(original)!;
    const current = original === captured ? undefined : relocations.get(original) ?? original;
    for (const direction of DIRECTIONS) {
      const left = ray(before, original, direction.df, direction.dr), right = ray(after, current, direction.df, direction.dr);
      if (left === null && right === null) continue;
      const sign = left === null ? "gained" : right === null ? "lost"
        : evidenceDigest(left.blockers) === evidenceDigest(right.blockers) ? undefined : "membership_changed";
      if (sign !== undefined) result.push({ ...edge, root: { color: rootPiece.color, role: rootPiece.role, square: makeSquare(original) }, direction: { ...direction }, sign, before: left, after: right });
    }
  }
  return freeze(result);
}
