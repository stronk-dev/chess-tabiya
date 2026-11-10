// Cheap persisted-row/source association, NOT a counterfactual collector or publication issuer.
import { normalizeMove } from "chessops/chess";
import type { Role, SquareName } from "chessops/types";
import { makeSquare, parseSquare, parseUci } from "chessops/util";
import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";
import { readBackReplay } from "../../../packages/runtime/src/replay.js";
import { positionFromFen } from "../../../packages/runtime/src/position-cache.js";
import { originalPiecePositions } from "../../../packages/runtime/src/foundation-piece-lineage.js";
import { physicalRayDirectionAllowed } from "../../../packages/runtime/src/foundation-slider-sources.js";
import { normativeDecisions } from "./longitudinal-decisions.js";
import type { LongitudinalSourceImageV4 } from "./longitudinal-source.js";
import type { LongitudinalSubjectObservationRow } from "./profile-subject-facts-contract.js";
const fail = (): never => { throw new TypeError("LONGITUDINAL_SUBJECT_SOURCE_JOIN_INVALID"); };
export function profileSubjectReferenceIndex(image: LongitudinalSourceImageV4, derivedRev: number) {
  const run = readBackReplay(image.runPrefix.events).run, observedAt = new Date(Date.parse(run.events[0]!.at)).toISOString();
  const decisions = new Map(normativeDecisions(image, run).map(d => [canonicalizeJson(d.ref), d]));
  const domain = new Map<string, ReturnType<typeof playedDomain>>();
  function playedDomain(beforeFen: string, moveUci: string) {
    const root = positionFromFen(beforeFen), raw = parseUci(moveUci);
    if (raw === undefined) return fail();
    const move = normalizeMove(root, raw);
    if (!("from" in move) || !root.isLegal(move)) return fail();
    const after = root.clone(); after.play(move);
    return { root, after, pieces: originalPiecePositions(root, after, move) };
  }
  return (row: LongitudinalSubjectObservationRow): void => {
    const key = canonicalizeJson(row.decisionRef), decision = decisions.get(key);
    if (decision === undefined || row.learnerId !== image.ownerLearnerId || row.runId !== run.id || row.derivedRev !== derivedRev
      || row.observedAt !== observedAt || row.phase !== decision.phase || row.decisionClass !== decision.decisionClass
      || row.sessionKind !== run.sessionKind || row.packId !== (run.sessionKind === "pack" ? run.packId : null)) return fail();
    let board = domain.get(key);
    if (board === undefined) { board = playedDomain(decision.beforeFen, decision.moveUci); domain.set(key, board); }
    if (row.actor !== board.root.turn) return fail();
    const original = (piece: { square: SquareName; color: string; role: Role }) => {
      const found = board!.pieces.find(p => p.root.square === piece.square && p.root.color === piece.color && p.root.role === piece.role);
      return found ?? fail();
    };
    const pawn = (s: { rootSquare: SquareName; color: string }) => original({ square: s.rootSquare, color: s.color, role: "pawn" });
    const king = (at: SquareName, color: "white" | "black") => {
      const square = board!.root.board.kingOf(color); if (square === undefined || makeSquare(square) !== at) return fail();
    };
    const rayPresent = (piece: { square: SquareName; role: Role }, d: { df: number; dr: number }) => {
      const at = parseSquare(piece.square)!;
      const f = at % 8 + d.df, r = Math.floor(at / 8) + d.dr;
      return physicalRayDirectionAllowed(piece.role, d.df, d.dr) && f >= 0 && f < 8 && r >= 0 && r < 8;
    };
    const s = row.subject;
    switch (s.kind) {
      case "backward_pawn": case "passed_pawn": {
        const p = pawn(s);
        if (row.sourceKind === "condition_relation" && p.current?.role !== "pawn") return fail();
        if (s.kind === "backward_pawn" && row.sourceKind === "native_incidence" && row.occurred && row.sign !== "lost" && p.current?.role !== "pawn") return fail();
        break;
      }
      case "king_opposition": king(s.whiteRootSquare, "white"); king(s.blackRootSquare, "black"); break;
      case "king_zone": king(s.rootSquare, s.color); break;
      case "loose_piece": original(s.root); if (s.root.color !== row.actor || s.root.role === "king") return fail(); break;
      case "line_blockers": {
        const p = original(s.root);
        if (!rayPresent(p.root, s.direction) || p.current === null || !rayPresent(p.current, s.direction)) return fail();
        break;
      }
      case "physical_slider": {
        const p = original(s.root);
        if (p.root.role === "pawn") {
          const rank = p.root.square[1];
          if (p.root.color !== row.actor || rank !== (p.root.color === "white" ? "7" : "2") || row.sourceKind !== "native_incidence" || row.sign !== "gained") return fail();
          if (row.occurred && (p.current === null || !["rook", "bishop", "queen"].includes(p.current.role) || !rayPresent(p.current, s.direction))) return fail();
        } else {
          if (!physicalRayDirectionAllowed(p.root.role, s.direction.df, s.direction.dr)) return fail();
          const before = rayPresent(p.root, s.direction);
          if (row.sourceKind === "native_incidence" && (row.sign === "gained" ? before : !before)) return fail();
          if (row.sourceKind === "native_incidence" && row.occurred) {
            const after = p.current !== null && rayPresent(p.current, s.direction);
            if (row.sign === "gained" ? before || !after : row.sign === "lost" ? !before || after : row.sign === "membership_changed" ? !before || !after : true) return fail();
          }
        }
        break;
      }
      case "file_access": {
        const p = original(s.piece);
        if (s.piece.square[0] !== s.file || row.occurred && p.current?.square !== p.root.square) return fail();
        break;
      }
      // These finite domains include absent/empty/zero subjects. Strict row parser proves their
      // color/file/role/target grammar; root-domain admission must not require positive state.
      case "doubled_pawn": case "isolated_pawn": case "half_open_file": case "open_file":
      case "pawn_file_group": case "file_state": case "pawn_islands": case "piece_count": case "direct_attack_count": break;
      default: return fail();
    }
  };
}
