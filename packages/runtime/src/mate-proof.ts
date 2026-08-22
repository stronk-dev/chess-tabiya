import type { Chess } from "chessops/chess";
import { normalizeMove } from "chessops/chess";
import type { Move, NormalMove, Role } from "chessops/types";
import { makeUci, opposite, parseUci } from "chessops/util";

import { canonicalFen, positionFromFen } from "./chess.js";
import { evidenceDigest } from "./evidence-contract.js";
import type { ReplyBreadth } from "./tactics.js";

export const MATE_PROOF_CONVENTION = "mate-proof@1" as const;
export const MATE_PROOF_NODE_CAP = 250_000 as const;
const PROMOTIONS: readonly Role[] = Object.freeze(["queen", "rook", "bishop", "knight"]);

export type MateProofStatus = "proved" | "refuted" | "budget_exhausted";

export interface ForcedMateAfterMoveProof {
  readonly conventionId: typeof MATE_PROOF_CONVENTION;
  readonly beforeFen: string;
  readonly candidate: string;
  readonly afterFen: string;
  readonly attacker: "white" | "black";
  readonly maxAttackerMoves: 1 | 2 | 3 | 4;
  readonly proofStatus: MateProofStatus;
  readonly proofDigest: string;
  readonly rootReplies: readonly string[];
  readonly escapingRootReply?: string;
  readonly terminalNonMate: boolean;
  readonly nodes: number;
  readonly nodeCap: number;
}

export type ForcedMateAfterMoveResult =
  | { readonly kind: "proof"; readonly proof: ForcedMateAfterMoveProof }
  | { readonly kind: "unavailable"; readonly reason: "horizon_above_four"; readonly requestedHorizon: number };

function legalMoves(position: Chess): readonly NormalMove[] {
  const result: NormalMove[] = [];
  for (const [from, destinations] of position.allDests()) for (const to of destinations) {
    const roles: readonly (Role | undefined)[] = position.board.getRole(from) === "pawn" && (to < 8 || to >= 56) ? PROMOTIONS : [undefined];
    for (const promotion of roles) {
      const move: NormalMove = promotion === undefined ? { from, to } : { from, to, promotion };
      if (position.isLegal(move)) result.push(move);
    }
  }
  return Object.freeze(result);
}

function parsedLegal(position: Chess, uci: string): NormalMove {
  const parsed = parseUci(uci.toLowerCase());
  if (parsed === undefined || !("from" in parsed)) throw new TypeError(`Invalid mate-proof move ${uci}`);
  const move = normalizeMove(position, parsed);
  if (!("from" in move) || !position.isLegal(move)) throw new TypeError(`Illegal mate-proof move ${uci}`);
  return move;
}

function fourFieldFen(position: Chess): string {
  return canonicalFen(position).split(" ", 4).join(" ");
}

/**
 * Complete legal-tree proof through four attacker moves. The supplied root breadth is the sole
 * root-reply authority; only interior nodes are enumerated here.
 */
export function forcedMateAfterMove(
  beforeFen: string,
  candidate: string,
  maxAttackerMoves: number,
  breadth: ReplyBreadth,
  nodeCap: number = MATE_PROOF_NODE_CAP,
): ForcedMateAfterMoveResult {
  if (!Number.isInteger(maxAttackerMoves) || maxAttackerMoves < 1 || maxAttackerMoves > 4) return Object.freeze({ kind: "unavailable", reason: "horizon_above_four", requestedHorizon: maxAttackerMoves });
  if (!Number.isSafeInteger(nodeCap) || nodeCap < 1) throw new TypeError("Mate-proof node cap must be a positive safe integer");
  const position = positionFromFen(beforeFen);
  const before = canonicalFen(position);
  const move = parsedLegal(position, candidate);
  const candidateUci = makeUci(move);
  const attacker = position.turn;
  position.play(move);
  const after = canonicalFen(position);
  if (breadth.triggeringMove !== candidateUci || canonicalFen(positionFromFen(breadth.afterFen)) !== after || breadth.count !== breadth.replies.length) throw new TypeError("Mate proof and reply-breadth anchors differ");

  let nodes = 0;
  let capped = false;
  let escapingRootReply: string | undefined;
  let rolling = 0xcbf29ce484222325n;
  const hashToken = (token: string): void => {
    for (let index = 0; index < token.length; index += 1) {
      rolling ^= BigInt(token.charCodeAt(index));
      rolling = BigInt.asUintN(64, rolling * 0x100000001b3n);
    }
  };
  const memo = new Map<string, boolean>();
  const visit = (current: Chess, edges: number, rootMoves?: readonly string[]): boolean => {
    nodes += 1;
    const key = `${fourFieldFen(current)}|${edges}|${attacker}`;
    hashToken(`N:${key};`);
    if (nodes > nodeCap) { capped = true; hashToken("CAP;"); return false; }
    if (current.isCheckmate()) { const won = opposite(current.turn) === attacker; hashToken(`M:${Number(won)};`); return won; }
    if (current.isEnd() || edges === 0) { hashToken("R:0;"); return false; }
    const cached = memo.get(key);
    if (cached !== undefined) { hashToken(`C:${Number(cached)};`); return cached; }
    let candidates: readonly NormalMove[];
    if (rootMoves === undefined) candidates = legalMoves(current);
    else candidates = Object.freeze(rootMoves.map((uci) => parsedLegal(current, uci)));
    const ordered = [...candidates].sort((left, right) => {
      if (current.turn !== attacker) return makeUci(left).localeCompare(makeUci(right));
      const a = current.clone(); a.play(left);
      const b = current.clone(); b.play(right);
      return Number(b.isCheck()) - Number(a.isCheck()) || makeUci(left).localeCompare(makeUci(right));
    });
    if (current.turn === attacker) {
      for (const nextMove of ordered) {
        const uci = makeUci(nextMove); hashToken(`A:${uci};`);
        const next = current.clone(); next.play(nextMove);
        if (visit(next, edges - 1)) { memo.set(key, true); return true; }
        if (capped) return false;
      }
      memo.set(key, false);
      return false;
    }
    if (ordered.length === 0) { memo.set(key, false); return false; }
    for (const nextMove of ordered) {
      const uci = makeUci(nextMove); hashToken(`D:${uci};`);
      const next = current.clone(); next.play(nextMove);
      if (!visit(next, edges - 1)) {
        if (rootMoves !== undefined) escapingRootReply = uci;
        memo.set(key, false);
        return false;
      }
      if (capped) return false;
    }
    memo.set(key, true);
    return true;
  };

  const horizon = maxAttackerMoves as 1 | 2 | 3 | 4;
  const proved = visit(position, 2 * horizon - 2, breadth.replies);
  const proofStatus: MateProofStatus = capped ? "budget_exhausted" : proved ? "proved" : "refuted";
  const terminalNonMate = breadth.count === 0 && !position.isCheckmate();
  const rootReplies = Object.freeze([...breadth.replies]);
  const proofDigest = evidenceDigest({ convention: "mate-proof-traversal-fnv64@1", before, candidate: candidateUci, after, attacker, horizon, proofStatus, rootReplies, escapingRootReply: escapingRootReply ?? null, terminalNonMate, nodes, nodeCap, traversal: rolling.toString(16).padStart(16, "0") });
  const proof: ForcedMateAfterMoveProof = Object.freeze({
    conventionId: MATE_PROOF_CONVENTION,
    beforeFen: before,
    candidate: candidateUci,
    afterFen: after,
    attacker,
    maxAttackerMoves: horizon,
    proofStatus,
    proofDigest,
    rootReplies,
    ...(escapingRootReply === undefined ? {} : { escapingRootReply }),
    terminalNonMate,
    nodes,
    nodeCap,
  });
  return Object.freeze({ kind: "proof", proof });
}
