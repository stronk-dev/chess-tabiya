import { normalizeMove } from "chessops/chess";
import { makeSan } from "chessops/san";
import { isNormal } from "chessops/types";
import { parseUci } from "chessops/util";

import { canonicalFen, positionFromFen } from "./chess.js";
import { evidenceValueReceipt, type DeclaredEvidence } from "./evidence-contract.js";
import { exactMoveIdentity } from "./legal-moves.js";
import type { DrillRun, Node } from "./types.js";

/** One exact recorded parent/child edge (`run.record.edge@1`). Path-independent by construction. */
export interface RecordedEdge {
  readonly runId: string;
  readonly edgeBranchId: string;
  readonly beforeNodeId: string;
  readonly afterNodeId: string;
  readonly beforeFen: string;
  readonly afterFen: string;
  readonly moveUci: string;
  readonly moveSan: string;
  readonly ply: number;
}

export type RecordedEdgeRefusalReason =
  | "missing_parent"
  | "broken_fen_boundary"
  | "illegal_recorded_move"
  | "noncanonical_recorded_move"
  | "noncanonical_recorded_san"
  | "broken_ply";

export class RecordedEdgeError extends TypeError {
  readonly reason: RecordedEdgeRefusalReason;
  readonly atNodeId: string;
  constructor(reason: RecordedEdgeRefusalReason, atNodeId: string, message: string) {
    super(message);
    this.name = "RecordedEdgeError";
    this.reason = reason;
    this.atNodeId = atNodeId;
  }
}

/**
 * The pure `run.record.edge@1` producer: accepts the run and two of its actual nodes (by
 * reference) and replays the move. It never accepts caller-authored payload bytes, PGN arrays or
 * engine principal variations, and never repairs FEN, UCI, SAN, parent or ply bytes.
 */
export function recordedEdgePayload(run: DrillRun, parent: Node, child: Node): RecordedEdge {
  const actual = (node: Node): boolean => run.nodes.some((candidate) => candidate === node);
  if (!actual(parent) || !actual(child) || child.parentId !== parent.id) {
    throw new RecordedEdgeError("missing_parent", child.id, `Recorded edge ${parent.id} -> ${child.id} is not an actual parent/child pair of run ${run.id}`);
  }
  if (child.ply !== parent.ply + 1) throw new RecordedEdgeError("broken_ply", child.id, `Recorded node ${child.id} ply ${child.ply} does not follow ${parent.ply}`);
  if (child.moveUci === null || child.moveSan === null) throw new RecordedEdgeError("illegal_recorded_move", child.id, `Recorded node ${child.id} carries no move`);
  let position;
  try {
    position = positionFromFen(parent.fen);
  } catch {
    throw new RecordedEdgeError("broken_fen_boundary", parent.id, `Recorded node ${parent.id} carries an invalid FEN`);
  }
  if (canonicalFen(position) !== parent.fen) throw new RecordedEdgeError("broken_fen_boundary", parent.id, `Recorded node ${parent.id} FEN is not canonical`);
  const move = parseUci(child.moveUci);
  if (move === undefined || !isNormal(move) || !position.isLegal(normalizeMove(position, move))) {
    throw new RecordedEdgeError("illegal_recorded_move", child.id, `Recorded move ${child.moveUci} is illegal from ${parent.id}`);
  }
  const canonicalUci = exactMoveIdentity(parent.fen, child.moveUci);
  if (canonicalUci !== child.moveUci) throw new RecordedEdgeError("noncanonical_recorded_move", child.id, `Recorded move ${child.moveUci} is not canonical ${canonicalUci}`);
  const played = normalizeMove(position, parseUci(canonicalUci)!);
  const san = makeSan(position, played);
  if (san !== child.moveSan) throw new RecordedEdgeError("noncanonical_recorded_san", child.id, `Recorded SAN ${child.moveSan} is not canonical ${san}`);
  position.play(played);
  if (canonicalFen(position) !== child.fen) throw new RecordedEdgeError("broken_fen_boundary", child.id, `Recorded node ${child.id} FEN disagrees with legal replay`);
  return Object.freeze({
    runId: run.id,
    edgeBranchId: child.branchId,
    beforeNodeId: parent.id,
    afterNodeId: child.id,
    beforeFen: parent.fen,
    afterFen: child.fen,
    moveUci: canonicalUci,
    moveSan: san,
    ply: child.ply,
  });
}

export const RECORDED_EDGE_FACTORY = "createRunRecordEdgeV1Evidence" as const;

/** Refuses any `run.record.edge@1` item that its run-edge factory did not mint. */
export function assertRecordedEdgeEvidence(value: DeclaredEvidence<unknown>): asserts value is DeclaredEvidence<RecordedEdge> {
  let factory: string | undefined;
  try {
    factory = evidenceValueReceipt(value).factory;
  } catch {
    factory = undefined;
  }
  if (factory !== RECORDED_EDGE_FACTORY || value.projection.id !== "run.record.edge" || value.projection.version !== 1) {
    throw new TypeError("Recorded-path evidence requires an exact run.record.edge@1 item minted from an actual run edge");
  }
}
