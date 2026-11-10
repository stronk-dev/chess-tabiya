// rfc/foundation-source-identity.md: complete operands for new source identities.
// Package-internal helpers; new value routes/consumer bindings are separate implementation work.
import { pawnAttacks } from "chessops/attacks";
import type { Color, Piece, Square, SquareName } from "chessops/types";
import { makeSquare, opposite } from "chessops/util";
import { assertDeclaredEvidence, evidenceDigest, type DeclaredEvidence } from "./evidence-contract.js";
import type { ExactLegalMoveMap } from "./legal-moves.js";
import { canonicalFen, positionFromFen } from "./position-cache.js";
import type { SquareControlReading } from "./square-control.js";

export interface FoundationPawn {
  readonly color: Color;
  readonly square: SquareName;
}

export interface UnobstructedOpposition {
  readonly color: Color;
  readonly sideToMove: Color;
  readonly form: "direct" | "distant_three" | "distant_five";
  readonly betweenSquares: readonly SquareName[];
  readonly betweenSquaresEmpty: true;
}

export interface UnobstructedOppositionSnapshot {
  readonly fen: string;
  readonly kings: Readonly<Record<Color, SquareName>>;
  readonly opposition: UnobstructedOpposition | null;
}

export interface BackwardPawnSubject {
  readonly color: Color;
  readonly pawn: SquareName;
  readonly stop: SquareName;
  readonly controllers: readonly FoundationPawn[];
  readonly supportPawns: readonly FoundationPawn[];
  readonly aheadAdjacentPawns: readonly FoundationPawn[];
  readonly stopOccupancy:
    | { readonly kind: "empty" }
    | { readonly kind: "own" | "enemy"; readonly piece: Pick<Piece, "color" | "role"> };
  /** Pseudo-capturable enemy pawns only; this is not a legal-capture verdict. */
  readonly immediatePseudoCapture: readonly FoundationPawn[];
  /** The half-open perspective is explicit; the subject's own file contains its pawn. */
  readonly halfOpenForColor: { readonly color: Color; readonly value: boolean };
}

export interface BackwardPawnSnapshot {
  readonly fen: string;
  readonly pawnDomain: readonly FoundationPawn[];
  readonly pawns: readonly BackwardPawnSubject[];
}

export type FoundationMembershipSign = "gained" | "lost" | "membership_changed";

/** Total five-case relation, also exercised for the unreachable legal opposition equality case. */
export function foundationMembershipChange(before: object | null, after: object | null): FoundationMembershipSign | undefined {
  if (before === null) return after === null ? undefined : "gained";
  if (after === null) return "lost";
  return evidenceDigest(before) === evidenceDigest(after) ? undefined : "membership_changed";
}

export interface FoundationEdge {
  readonly beforeFen: string;
  readonly moveUci: string;
  readonly afterFen: string;
}

export interface OppositionChange extends FoundationEdge {
  readonly subject: { readonly white: "king"; readonly black: "king" };
  readonly sign: FoundationMembershipSign;
  readonly before: UnobstructedOppositionSnapshot;
  readonly after: UnobstructedOppositionSnapshot;
}

/** The factory authenticates the snapshots and the legal edge before calling this algebra. */
export function oppositionChanges(edge: FoundationEdge, before: UnobstructedOppositionSnapshot, after: UnobstructedOppositionSnapshot): readonly OppositionChange[] {
  const state = (snapshot: UnobstructedOppositionSnapshot) => snapshot.opposition === null ? null : { kings: snapshot.kings, opposition: snapshot.opposition };
  const sign = foundationMembershipChange(state(before), state(after));
  return sign === undefined ? Object.freeze([]) : freeze([{ ...edge, subject: { white: "king", black: "king" }, sign, before, after }]);
}

export interface BackwardPawnChange extends FoundationEdge {
  readonly subject: { readonly color: Color; readonly beforePawn: SquareName | null; readonly afterPawn: SquareName | null };
  readonly sign: FoundationMembershipSign;
  readonly before: BackwardPawnSubject | null;
  readonly after: BackwardPawnSubject | null;
}

/** Match exact stationary subjects first, then the edge's physical pawn mover, never by file. */
export function backwardPawnChanges(edge: FoundationEdge, before: BackwardPawnSnapshot, after: BackwardPawnSnapshot): readonly BackwardPawnChange[] {
  const remaining = new Map(after.pawns.map(row => [`${row.color}:${row.pawn}`, row]));
  const unmatched: BackwardPawnSubject[] = [];
  const pairs: (readonly [BackwardPawnSubject | null, BackwardPawnSubject | null])[] = [];
  for (const row of before.pawns) {
    const key = `${row.color}:${row.pawn}`, matched = remaining.get(key);
    if (matched === undefined) unmatched.push(row);
    else { pairs.push([row, matched]); remaining.delete(key); }
  }
  const position = positionFromFen(edge.beforeFen);
  const from = edge.moveUci.slice(0, 2) as SquareName, to = edge.moveUci.slice(2, 4) as SquareName;
  const mover = [...position.board.pieces(position.turn, "pawn")].some(square => makeSquare(square) === from);
  for (const row of unmatched) {
    const key = `${row.color}:${to}`;
    const matched = mover && row.color === position.turn && row.pawn === from ? remaining.get(key) : undefined;
    pairs.push([row, matched ?? null]);
    if (matched !== undefined) remaining.delete(key);
  }
  for (const row of remaining.values()) pairs.push([null, row]);
  return freeze(pairs.flatMap(([left, right]): BackwardPawnChange[] => {
    const sign = foundationMembershipChange(left, right);
    if (sign === undefined) return [];
    return [{ ...edge, subject: { color: (left ?? right)!.color, beforePawn: left?.pawn ?? null, afterPawn: right?.pawn ?? null }, sign, before: left, after: right }];
  }));
}

// Only freshly allocated output is frozen. Never freeze or rewrite a borrowed source value.
function freeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}

/** Package-internal complete board read from the genuine position input; not an evidence issuer. */
export function positionFromSource(source: DeclaredEvidence<ExactLegalMoveMap>) {
  assertDeclaredEvidence(source);
  if (source.projection.id !== "rules.mobility.reading.legal_moves" || source.projection.version !== 1) {
    throw new TypeError("Foundation position source requires the exact sealed legal-position reading");
  }
  const position = positionFromFen(source.payload.fen);
  if (canonicalFen(position) !== source.payload.fen || position.turn !== source.payload.turn) {
    throw new TypeError("Foundation position source has inconsistent canonical position identity");
  }
  return position;
}

export function readUnobstructedOpposition(source: DeclaredEvidence<ExactLegalMoveMap>): UnobstructedOppositionSnapshot {
  const position = positionFromSource(source);
  const white = position.board.kingOf("white"), black = position.board.kingOf("black");
  if (white === undefined || black === undefined) throw new TypeError("Standard opposition requires both kings");
  const kings = { white: makeSquare(white), black: makeSquare(black) };
  const df = black % 8 - white % 8, dr = Math.floor(black / 8) - Math.floor(white / 8);
  const gap = Math.max(Math.abs(df), Math.abs(dr));
  const form = gap === 2 ? "direct" : gap === 4 ? "distant_three" : gap === 6 ? "distant_five" : undefined;
  if (df !== 0 && dr !== 0 || form === undefined) return freeze({ fen: source.payload.fen, kings, opposition: null });
  const between: Square[] = [];
  const step = Math.sign(df) + 8 * Math.sign(dr);
  for (let index = 1; index < gap; index++) between.push((white + step * index) as Square);
  if (between.some(square => position.board.occupied.has(square))) return freeze({ fen: source.payload.fen, kings, opposition: null });
  return freeze({
    fen: source.payload.fen, kings,
    opposition: { color: opposite(position.turn), sideToMove: position.turn, form, betweenSquares: between.map(makeSquare), betweenSquaresEmpty: true },
  });
}

export function readBackwardPawns(source: DeclaredEvidence<ExactLegalMoveMap>): BackwardPawnSnapshot {
  const position = positionFromSource(source);
  const pawns: BackwardPawnSubject[] = [];
  const pawnDomain: FoundationPawn[] = [];
  for (const color of ["white", "black"] as const) {
    const enemy = opposite(color), forward = color === "white" ? 1 : -1;
    const own = [...position.board.pieces(color, "pawn")], opposing = [...position.board.pieces(enemy, "pawn")];
    const identity = (square: Square, owner: Color = color): FoundationPawn => ({ color: owner, square: makeSquare(square) });
    for (const pawn of own) {
      pawnDomain.push(identity(pawn));
      const stop = pawn + 8 * forward;
      if (stop < 0 || stop >= 64) continue;
      const adjacent = own.filter(other => Math.abs(other % 8 - pawn % 8) === 1);
      const rankDelta = (other: Square) => (Math.floor(other / 8) - Math.floor(pawn / 8)) * forward;
      const support = adjacent.filter(other => rankDelta(other) <= 0);
      const controllers = opposing.filter(other => pawnAttacks(enemy, other).has(stop as Square));
      if (support.length !== 0 || controllers.length === 0) continue;
      const occupant = position.board.get(stop as Square);
      pawns.push({
        color, pawn: makeSquare(pawn), stop: makeSquare(stop as Square),
        controllers: controllers.map(square => identity(square, enemy)),
        supportPawns: support.map(square => identity(square)),
        aheadAdjacentPawns: adjacent.filter(other => rankDelta(other) > 0).map(square => identity(square)),
        stopOccupancy: occupant === undefined ? { kind: "empty" } : { kind: occupant.color === color ? "own" : "enemy", piece: { color: occupant.color, role: occupant.role } },
        immediatePseudoCapture: opposing.filter(other => pawnAttacks(color, pawn).has(other)).map(square => identity(square, enemy)),
        halfOpenForColor: { color: enemy, value: !opposing.some(other => other % 8 === pawn % 8) },
      });
    }
  }
  return freeze({ fen: source.payload.fen, pawnDomain, pawns });
}

export interface FutureFileChallenge {
  readonly pawn: FoundationPawn;
  readonly target: SquareName;
  readonly pushes: number;
}
export interface FutureFileSnapshot {
  readonly fen: string;
  readonly pawnDomain: readonly FoundationPawn[];
  readonly challenges: readonly FutureFileChallenge[];
}
export interface CaptureMigrationReach extends FutureFileChallenge { readonly captures: number }
export interface CaptureMigrationSnapshot {
  readonly fen: string;
  readonly pawnDomain: readonly FoundationPawn[];
  readonly reaches: readonly CaptureMigrationReach[];
}

function pawnDomain(source: DeclaredEvidence<ExactLegalMoveMap>): readonly FoundationPawn[] {
  const position = positionFromSource(source);
  return ["white", "black"].flatMap(color => [...position.board.pieces(color as Color, "pawn")]
    .map(square => ({ color: color as Color, square: makeSquare(square) })));
}

/** Complete hypothetical same-file challenges, including control with zero pushes. */
export function readFutureFileChallenges(source: DeclaredEvidence<ExactLegalMoveMap>): FutureFileSnapshot {
  const domain = pawnDomain(source), challenges: FutureFileChallenge[] = [];
  for (const pawn of domain) for (let target = 0; target < 64; target++) {
    const forward = pawn.color === "white" ? 1 : -1;
    const file = pawn.square.charCodeAt(0) - 97, rank = Number(pawn.square[1]) - 1;
    const standingRank = Math.floor(target / 8) - forward;
    const pushes = Math.max(0, (standingRank - rank) * forward);
    // A pawn must still exist on its standing rank; promotion ends its pawn identity.
    if (standingRank < 1 || standingRank > 6 || Math.abs(target % 8 - file) !== 1 || (standingRank - rank) * forward < 0) continue;
    challenges.push({ pawn: { ...pawn }, target: makeSquare(target as Square), pushes });
  }
  return freeze({ fen: source.payload.fen, pawnDomain: domain, challenges });
}

/** All distinct capture/push counts, with board-valid intermediate pawn files. No victims assumed. */
export function readCaptureMigrationReach(source: DeclaredEvidence<ExactLegalMoveMap>): CaptureMigrationSnapshot {
  const domain = pawnDomain(source), reaches: CaptureMigrationReach[] = [];
  for (const pawn of domain) for (let target = 0; target < 64; target++) {
    const forward = pawn.color === "white" ? 1 : -1;
    const rootFile = pawn.square.charCodeAt(0) - 97, rootRank = Number(pawn.square[1]) - 1;
    const standingRank = Math.floor(target / 8) - forward, advances = (standingRank - rootRank) * forward;
    if (standingRank < 1 || standingRank > 6 || advances < 1) continue;
    let files = new Set([rootFile]);
    for (let captures = 1; captures <= advances; captures++) {
      files = new Set([...files].flatMap(file => [file - 1, file + 1].filter(next => next >= 0 && next < 8)));
      if (![...files].some(file => Math.abs(target % 8 - file) === 1)) continue;
      reaches.push({ pawn: { ...pawn }, target: makeSquare(target as Square), captures, pushes: advances - captures });
    }
  }
  return freeze({ fen: source.payload.fen, pawnDomain: domain, reaches });
}

export interface OutpostCandidate {
  readonly color: Color;
  readonly square: SquareName;
  readonly relativeRank: number;
  readonly supportPawns: readonly FoundationPawn[];
  readonly challengers: readonly FutureFileChallenge[];
}
export interface OutpostCandidateSnapshot {
  readonly fen: string;
  readonly basis: "future_file";
  readonly candidates: readonly OutpostCandidate[];
}
export interface OccupiedOutpostSnapshot {
  readonly fen: string;
  readonly basis: "future_file";
  readonly occupied: readonly {
    readonly candidate: OutpostCandidate;
    readonly occupant: { readonly color: Color; readonly role: "bishop" | "knight" | "rook" | "queen"; readonly square: SquareName };
  }[];
}

export function readOutpostCandidates(control: SquareControlReading, future: FutureFileSnapshot): OutpostCandidateSnapshot {
  if (control.fen !== future.fen) throw new TypeError("Outpost sources require the same canonical position");
  const candidates: OutpostCandidate[] = [];
  for (const color of ["white", "black"] as const) {
    const controls = control.colors.find(row => row.color === color);
    if (controls === undefined) throw new TypeError("Outpost requires complete control for both colors");
    for (let target = 0; target < 64; target++) {
      const relativeRank = color === "white" ? Math.floor(target / 8) + 1 : 8 - Math.floor(target / 8);
      if (relativeRank < 4 || relativeRank > 6) continue;
      const square = makeSquare(target as Square);
      const supportPawns = (controls.pseudo.find(row => row.target === square)?.controllers ?? [])
        .filter(row => row.piece.role === "pawn" && row.piece.color === color)
        .map(row => ({ color, square: row.square }));
      if (supportPawns.length === 0) continue;
      const challengers = future.challenges.filter(row => row.pawn.color !== color && row.target === square);
      if (challengers.length !== 0) continue;
      candidates.push({ color, square, relativeRank, supportPawns, challengers: [] });
    }
  }
  return freeze({ fen: future.fen, basis: "future_file", candidates });
}

export function readOccupiedOutposts(source: OutpostCandidateSnapshot): OccupiedOutpostSnapshot {
  const position = positionFromFen(source.fen);
  return freeze({ fen: source.fen, basis: "future_file", occupied: source.candidates.flatMap(candidate => {
    const occupant = position.board.get((candidate.square.charCodeAt(0) - 97 + 8 * (Number(candidate.square[1]) - 1)) as Square);
    if (occupant === undefined || occupant.color !== candidate.color || occupant.role === "pawn" || occupant.role === "king") return [];
    return [{ candidate: { ...candidate, supportPawns: candidate.supportPawns.map(pawn => ({ ...pawn })), challengers: [] },
      occupant: { color: occupant.color, role: occupant.role, square: candidate.square } }];
  }) });
}
