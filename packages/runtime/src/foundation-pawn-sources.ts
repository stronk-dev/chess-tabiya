// Pure source algebra for rfc/foundation-source-identity.md §§3.3/3.5/3.6.
// Factories authenticate complete inputs and the legal edge before minting any value.
import { castlingSide } from "chessops/chess";
import type { Color, FileName, Role, Square, SquareName } from "chessops/types";
import { kingCastlesTo, makeSquare, parseUci, rookCastlesTo } from "chessops/util";
import { evidenceDigest } from "./evidence-contract.js";
import { foundationMembershipChange, type FoundationEdge, type FoundationMembershipSign } from "./foundation-position-sources.js";
import { canonicalFen, positionFromFen } from "./position-cache.js";
import type { PawnConnectivityReading } from "./structure.js";

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
const COLORS = ["white", "black"] as const;
function own<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) own(child);
    Object.freeze(value);
  }
  return value;
}

export interface PawnFileGroup {
  readonly color: Color;
  readonly file: FileName;
  /** Every pawn on this color/file, ordered front-to-rear for that color. */
  readonly pawns: readonly SquareName[];
  readonly adjacentOccupiedFiles: readonly FileName[];
  readonly islandFiles: readonly FileName[];
  readonly isolated: boolean;
  readonly doubled: boolean;
}
export interface PawnFileGroupSnapshot { readonly fen: string; readonly groups: readonly PawnFileGroup[] }
export type FileState = "open" | "half_open_white" | "half_open_black" | "closed";
export interface FileStateRow {
  readonly file: FileName;
  readonly whitePawns: readonly SquareName[];
  readonly blackPawns: readonly SquareName[];
  readonly state: FileState;
}
export interface FileStateSnapshot { readonly fen: string; readonly files: readonly FileStateRow[] }

function colorReading(source: PawnConnectivityReading, color: Color) {
  const value = source.colors.find(row => row.color === color);
  if (value === undefined) throw new TypeError("Complete pawn connectivity requires both colors");
  return value;
}

export function readPawnFileGroups(source: PawnConnectivityReading): PawnFileGroupSnapshot {
  const groups: PawnFileGroup[] = [];
  for (const color of COLORS) {
    const islands = colorReading(source, color).islands;
    const occupied = islands.flatMap(island => [...island.files]);
    for (const island of islands) for (const file of island.files) {
      const pawns = island.squares.filter(square => square[0] === file)
        .sort((a, b) => (Number(a[1]) - Number(b[1])) * (color === "white" ? -1 : 1));
      if (pawns.length === 0) throw new TypeError("Pawn island file has no members");
      const adjacentOccupiedFiles = occupied.filter(other => Math.abs(other.charCodeAt(0) - file.charCodeAt(0)) === 1);
      groups.push({ color, file, pawns, adjacentOccupiedFiles, islandFiles: [...island.files], isolated: adjacentOccupiedFiles.length === 0, doubled: pawns.length > 1 });
    }
  }
  return own({ fen: canonicalFen(positionFromFen(source.fen)), groups });
}

export function readFileStates(source: PawnConnectivityReading): FileStateSnapshot {
  const pawns = (color: Color, file: FileName) => colorReading(source, color).islands.flatMap(island => island.squares.filter(square => square[0] === file)).sort();
  return own({ fen: canonicalFen(positionFromFen(source.fen)), files: FILES.map(file => {
    const whitePawns = pawns("white", file), blackPawns = pawns("black", file);
    const state: FileState = whitePawns.length === 0 ? blackPawns.length === 0 ? "open" : "half_open_white" : blackPawns.length === 0 ? "half_open_black" : "closed";
    return { file, whitePawns, blackPawns, state };
  }) });
}

export interface PawnFileCause {
  readonly mover: { readonly color: Color; readonly role: Role; readonly from: SquareName; readonly to: SquareName; readonly promotion: Role | null };
  readonly captured: { readonly color: Color; readonly role: Role; readonly square: SquareName } | null;
}

function edgeGeometry(edge: FoundationEdge) {
  const before = positionFromFen(edge.beforeFen), move = parseUci(edge.moveUci);
  if (move === undefined || !("from" in move)) throw new TypeError("Pawn/file source requires a board move");
  const piece = before.board.get(move.from);
  if (piece === undefined) throw new TypeError("Pawn/file move has no original piece");
  const castle = castlingSide(before, move);
  const physical = castle === undefined ? [{ from: move.from, to: move.to }]
    : [{ from: move.from, to: kingCastlesTo(before.turn, castle) }, { from: move.to, to: rookCastlesTo(before.turn, castle) }];
  return { before, move, piece, physical };
}

function pawnFileCause(edge: FoundationEdge): PawnFileCause {
  const { before, move, piece, physical } = edgeGeometry(edge);
  let square = move.to, captured = before.board.get(square);
  if (piece.role === "pawn" && move.from % 8 !== move.to % 8 && captured === undefined) {
    square = (move.to + (piece.color === "white" ? -8 : 8)) as Square;
    captured = before.board.get(square);
  }
  return own({ mover: { color: piece.color, role: piece.role, from: makeSquare(move.from), to: makeSquare(physical[0]!.to), promotion: move.promotion ?? null },
    captured: captured === undefined || captured.color === piece.color ? null : { color: captured.color, role: captured.role, square: makeSquare(square) } });
}

export interface PawnFileGroupChange extends FoundationEdge {
  readonly subject: { readonly color: Color; readonly file: FileName };
  readonly sign: FoundationMembershipSign;
  readonly before: PawnFileGroup | null;
  readonly after: PawnFileGroup | null;
  readonly cause: PawnFileCause;
}

export function pawnFileGroupChanges(edge: FoundationEdge, before: PawnFileGroupSnapshot, after: PawnFileGroupSnapshot): readonly PawnFileGroupChange[] {
  const rows: PawnFileGroupChange[] = [], cause = pawnFileCause(edge);
  for (const color of COLORS) for (const file of FILES) {
    const left = before.groups.find(row => row.color === color && row.file === file) ?? null;
    const right = after.groups.find(row => row.color === color && row.file === file) ?? null;
    const sign = foundationMembershipChange(left, right);
    if (sign !== undefined) rows.push({ ...edge, subject: { color, file }, sign, before: left, after: right, cause });
  }
  return own(rows);
}

export interface FileStateChange extends FoundationEdge {
  readonly file: FileName;
  readonly sign: "membership_changed";
  readonly before: FileStateRow;
  readonly after: FileStateRow;
  readonly cause: PawnFileCause;
}

export function fileStateChanges(edge: FoundationEdge, before: FileStateSnapshot, after: FileStateSnapshot): readonly FileStateChange[] {
  const rows: FileStateChange[] = [], cause = pawnFileCause(edge);
  for (const file of FILES) {
    const left = before.files.find(row => row.file === file), right = after.files.find(row => row.file === file);
    if (left === undefined || right === undefined) throw new TypeError("File state source requires all eight files");
    if (left.state !== right.state) rows.push({ ...edge, file, sign: "membership_changed", before: left, after: right, cause });
  }
  return own(rows);
}

export interface FileAccessRevealed extends FoundationEdge {
  readonly file: FileName;
  readonly piece: { readonly color: Color; readonly role: "rook" | "queen"; readonly square: SquareName };
  readonly sign: "gained";
  readonly beforeState: FileState;
  readonly afterState: FileState;
  readonly fileChange: FileStateChange;
}

export function fileAccessRevealed(change: FileStateChange): readonly FileAccessRevealed[] {
  const { before, physical } = edgeGeometry(change), after = positionFromFen(change.afterFen);
  const moved = new Set(physical.filter(move => move.from !== move.to).map(move => move.from));
  const rows: FileAccessRevealed[] = [];
  for (const color of COLORS) for (const role of ["rook", "queen"] as const) for (const square of before.board.pieces(color, role)) {
    if (makeSquare(square)[0] !== change.file || moved.has(square)) continue;
    const occupant = after.board.get(square);
    if (occupant?.color !== color || occupant.role !== role) continue;
    const ownHalfOpen = `half_open_${color}`;
    const revealed = change.after.state === "open" && change.before.state !== "open"
      || change.after.state === ownHalfOpen && change.before.state !== "open" && change.before.state !== ownHalfOpen;
    if (revealed) rows.push({ beforeFen: change.beforeFen, moveUci: change.moveUci, afterFen: change.afterFen, file: change.file,
      piece: { color, role, square: makeSquare(square) }, sign: "gained", beforeState: change.before.state, afterState: change.after.state, fileChange: change });
  }
  return own(rows);
}

export interface PawnIslandPartition { readonly files: readonly FileName[]; readonly pawns: readonly SquareName[] }
export interface PawnIslandTopologyChange extends FoundationEdge {
  readonly color: Color;
  readonly sign: "count_gained" | "count_lost" | "topology_changed";
  readonly beforeCount: number;
  readonly afterCount: number;
  readonly before: readonly PawnIslandPartition[];
  readonly after: readonly PawnIslandPartition[];
}

export function readPawnIslandChanges(edge: FoundationEdge, before: PawnConnectivityReading, after: PawnConnectivityReading): readonly PawnIslandTopologyChange[] {
  const partitions = (source: PawnConnectivityReading, color: Color) => colorReading(source, color).islands.map(island => ({ files: [...island.files], pawns: [...island.squares] }));
  const rows: PawnIslandTopologyChange[] = [];
  for (const color of COLORS) {
    const left = partitions(before, color), right = partitions(after, color);
    if (evidenceDigest(left.map(row => row.files)) === evidenceDigest(right.map(row => row.files))) continue;
    rows.push({ ...edge, color, sign: left.length < right.length ? "count_gained" : left.length > right.length ? "count_lost" : "topology_changed",
      beforeCount: left.length, afterCount: right.length, before: left, after: right });
  }
  return own(rows);
}
