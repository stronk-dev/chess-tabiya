import { makeSquare } from "chessops/util";

import { branchPath } from "./branch-path.js";
import { positionFromFen } from "./chess.js";
import { observationIdentity, type StructuralObservation, type StructuralReading } from "./structure.js";
import type { BranchComparison } from "./compare.js";
import type { DrillRun } from "./types.js";
import { exactLegalMoves, exactMoveIdentity } from "./legal-moves.js";

export interface PieceRoute { readonly pieceId: string; readonly squares: readonly string[] }

const PIECE_NAMES = Object.freeze({ pawn: "pawn", knight: "knight", bishop: "bishop", rook: "rook", queen: "queen", king: "king" } as const);

export function recordedPieceRoutes(path: readonly DrillRun["nodes"][number][]): readonly PieceRoute[] {
  const root = path[0];
  if (root === undefined) return Object.freeze([]);
  const occupants = new Map<string, string>();
  const labels = new Map<string, string>();
  const routes = new Map<string, string[]>();
  for (const [square, piece] of positionFromFen(root.fen).board) {
    const origin = makeSquare(square);
    const identity = `${piece.color}:${piece.role}:${origin}`;
    occupants.set(origin, identity);
    labels.set(identity, `${piece.color === "white" ? "White" : "Black"} ${PIECE_NAMES[piece.role]} from ${origin}`);
  }
  const record = (identity: string, from: string, to: string) => {
    const route = routes.get(identity);
    if (route === undefined) routes.set(identity, [from, to]);
    else route.push(to);
  };
  for (const node of path.slice(1)) {
    if (node.moveUci === null) continue;
    const parent = path.find((candidate) => candidate.id === node.parentId);
    if (parent === undefined) throw new TypeError(`Comparison route node ${node.id} has no parent on its branch path`);
    const identity = exactMoveIdentity(parent.fen, node.moveUci);
    const move = exactLegalMoves(parent.fen).find((candidate) => candidate.uci === identity);
    if (move === undefined) throw new TypeError(`Comparison route move ${identity} is absent from its parent position`);
    const movingPiece = occupants.get(move.from);
    if (movingPiece === undefined) throw new TypeError(`Comparison route has no tracked piece on ${move.from}`);
    const destinationWasOccupied = occupants.has(move.to);
    occupants.delete(move.to);
    if (move.role === "pawn" && move.from[0] !== move.to[0] && !destinationWasOccupied) {
      occupants.delete(`${move.to[0]}${move.from[1]}`);
    }
    occupants.delete(move.from);
    occupants.set(move.to, movingPiece);
    record(movingPiece, move.from, move.to);

    if (move.role === "king" && Math.abs(move.from.charCodeAt(0) - move.to.charCodeAt(0)) === 2) {
      const kingSide = move.to[0] === "g";
      const rookFrom = `${kingSide ? "h" : "a"}${move.from[1]}`;
      const rookTo = `${kingSide ? "f" : "d"}${move.from[1]}`;
      const rook = occupants.get(rookFrom);
      if (rook !== undefined) {
        occupants.delete(rookFrom);
        occupants.set(rookTo, rook);
        record(rook, rookFrom, rookTo);
      }
    }
  }
  return Object.freeze([...routes].map(([identity, squares]) => Object.freeze({
    pieceId: labels.get(identity) ?? identity,
    squares: Object.freeze(squares),
  })));
}

/**
 * Structural observations newly present on one branch after the fork and absent from every
 * compared branch's shared set. This is the pure producer behind derived.compare.structure_delta@1.
 */
export function structureDeltaEntries(run: DrillRun, comparison: BranchComparison, branchId: string, read: (fen: string) => StructuralReading): readonly { readonly nodeId: string; readonly plyOffset: number; readonly observation: StructuralObservation }[] {
  const fork = run.nodes.find((node) => node.id === comparison.forkNodeId);
  if (fork === undefined) throw new TypeError(`Comparison fork ${comparison.forkNodeId} is missing`);
  const pathObservationSets = comparison.columns.map((column) => new Set(
    branchPath(run, column.branchId)
      .filter((node) => node.ply > fork.ply)
      .flatMap((node) => read(node.fen).features.map(observationIdentity)),
  ));
  const common = comparison.columns.length < 2
    ? undefined
    : new Set([...pathObservationSets[0]!].filter((key) => pathObservationSets.slice(1).every((set) => set.has(key))));
  const path = branchPath(run, branchId).filter((node) => node.ply >= fork.ply);
  const entries: { nodeId: string; plyOffset: number; observation: StructuralObservation }[] = [];
  let previous = new Set<string>();
  for (const node of path) {
    const observations = read(node.fen).features;
    const current = new Set(observations.map(observationIdentity));
    if (node.id !== fork.id) for (const observation of observations) {
      const key = observationIdentity(observation);
      if (!previous.has(key) && !common?.has(key)) entries.push({ nodeId: node.id, plyOffset: node.ply - fork.ply, observation });
    }
    previous = current;
  }
  return Object.freeze(entries.map((entry) => Object.freeze(entry)));
}
