import { normalizeMove } from "chessops/chess";
import { parseSquare, parseUci } from "chessops/util";
import type { Piece } from "chessops/types";
import { canonicalFen, positionFromFen } from "./position-cache.js";
import { exactMoveIdentity } from "./legal-moves.js";
import { defenderExposurePassFen, type AvailableDefenderExposureOperands } from "./internal/defender-exposure.js";
import { EXCHANGE_DETAIL_KINDS, type ExchangeDetailMember, type FoundationDetailMember } from "./foundation-snapshot-detail.js";
import { pieceOn, s, side } from "./presentation-schema.js";

export const EXPOSURE_DETAIL_SCOPE = s.union("kind", {
  whole: s.obj({ kind: s.lit("whole") }),
  exposure_captures: s.obj({ kind: s.lit("exposure_captures") }),
  exposure_exchange: s.obj({ kind: s.lit("exposure_exchange"), captureIndex: s.nat }),
  exposure_branches: s.obj({ kind: s.lit("exposure_branches"), captureIndex: s.nat, parentPath: s.arr(s.nat) }),
});
export type ExposureDetailScope = ReturnType<typeof EXPOSURE_DETAIL_SCOPE>;
const edgeFields = { beforeFen: s.str, moveUci: s.uci, afterFen: s.str };
const placed = s.obj({ square: s.square, piece: s.obj({ color: s.color, role: s.role }, { promoted: s.bool }) });
const context = s.obj({
  ...edgeFields, defender: placed, target: placed, passConvention: s.lit("mover-turn-ep-cleared@1"),
  captureCount: s.nat,
  controllerEvent: s.obj({ ...edgeFields, color: s.color, mode: s.lit("pseudo"), sign: s.lit("lost"), target: s.square, controller: placed }),
});
type ExposureContext = ReturnType<typeof context>;
const fail = (): never => { throw new TypeError("Inspector exposure detail crosses its original edge, capture or scope"); };
const samePiece = (a: Piece | undefined, b: Piece): boolean =>
  a?.color === b.color && a.role === b.role && Boolean(a.promoted) === Boolean(b.promoted);
function checkedPassFen(v: ExposureContext): string {
  const fen = defenderExposurePassFen(v);
  return fen ?? fail();
}

export function parseExposureDetailContext(raw: unknown, label: string): ExposureContext {
  const v = context(raw, label), control = v.controllerEvent;
  if (v.captureCount === 0 || control.beforeFen !== v.beforeFen || control.moveUci !== v.moveUci || control.afterFen !== v.afterFen
    || control.target !== v.target.square || control.controller.square !== v.defender.square
    || control.color !== v.defender.piece.color || !samePiece(control.controller.piece, v.defender.piece)
    || control.color !== v.target.piece.color || v.target.piece.role === "king" || v.target.square === v.defender.square) return fail();
  const before = positionFromFen(v.beforeFen), targetSquare = parseSquare(v.target.square)!;
  if (canonicalFen(before) !== v.beforeFen || exactMoveIdentity(v.beforeFen, v.moveUci) !== v.moveUci || before.turn === control.color
    || !samePiece(before.board.get(parseSquare(v.defender.square)!), v.defender.piece)
    || !samePiece(before.board.get(targetSquare), v.target.piece)) return fail();
  before.play(normalizeMove(before, parseUci(v.moveUci)!));
  if (canonicalFen(before) !== v.afterFen || !samePiece(before.board.get(targetSquare), v.target.piece)) return fail();
  checkedPassFen(v);
  return v;
}

/** The grant and exact original factory occurrence precede this source-owned path resolution. */
export function hasExposureScope(source: AvailableDefenderExposureOperands, scope: ExposureDetailScope): boolean {
  if (scope.kind === "whole" || scope.kind === "exposure_captures") return true;
  const capture = source.captures[scope.captureIndex];
  if (capture === undefined) return false;
  if (scope.kind === "exposure_branches") {
    let children = capture.branches;
    for (const index of scope.parentPath) {
      const parent = children[index];
      if (parent === undefined) return false;
      children = parent.continuation;
    }
  }
  return true;
}

export function exposureMemberMatches(member: FoundationDetailMember, scope: Exclude<ExposureDetailScope, { kind: "whole" }>): boolean {
  if (scope.kind === "exposure_captures") return member.kind === "foundation_capture_header";
  if (scope.kind === "exposure_exchange") {
    return (member.kind === "foundation_capture_header" || member.kind === "foundation_exchange_chosen" || member.kind === "foundation_exchange_stop")
      && member.value.captureIndex === scope.captureIndex;
  }
  return member.kind === "foundation_exchange_branch" && member.value.captureIndex === scope.captureIndex
    && member.value.path.length === scope.parentPath.length + 1 && scope.parentPath.every((index, depth) => member.value.path[depth] === index);
}

export function assertExposureDetailPage(v: ExposureContext, scope: ExposureDetailScope, range: { readonly total: number },
  members: readonly (ExchangeDetailMember & { readonly ordinal: number })[]): void {
  const passFen = checkedPassFen(v);
  if (scope.kind === "whole" && range.total < v.captureCount) return fail();
  if (scope.kind === "exposure_captures" && range.total !== v.captureCount) return fail();
  if ((scope.kind === "exposure_exchange" || scope.kind === "exposure_branches") && scope.captureIndex >= v.captureCount) return fail();
  const lineLength = scope.kind === "exposure_exchange" ? (range.total - 1) / 2 : 0;
  if (scope.kind === "exposure_exchange" && (!Number.isSafeInteger(lineLength) || lineLength < 1)) return fail();
  for (const [index, member] of members.entries()) {
    const { kind, value, ordinal } = member;
    if (value.captureIndex >= v.captureCount
      || scope.kind !== "whole" && !exposureMemberMatches(member, scope)) return fail();
    if (kind === "foundation_capture_header" && (value.beforeFen !== passFen || value.resultUnits <= 0 || value.landingSquare !== v.target.square
      || value.captured.square !== v.target.square || value.captured.color !== v.target.piece.color || value.captured.role !== v.target.piece.role
      || value.capturer.color === v.target.piece.color || value.chosenLineCount < 1 || value.chosenLineCount !== value.stopDecisionCount)) return fail();
    if (scope.kind === "exposure_captures" && (kind !== "foundation_capture_header" || value.captureIndex !== ordinal)) return fail();
    if (scope.kind === "exposure_branches" && (kind !== "foundation_exchange_branch" || value.path.at(-1) !== ordinal)) return fail();
    if (kind === "foundation_exchange_stop" && value.ply !== value.index + 1) return fail();
    if (scope.kind === "whole") {
      const previous = members[index - 1];
      if (ordinal === 0 && (kind !== "foundation_capture_header" || value.captureIndex !== 0)) return fail();
      if (previous !== undefined && !followsOriginalExchange(previous, member)) return fail();
    }
    if (scope.kind === "exposure_exchange") {
      if (ordinal === 0) {
        if (kind !== "foundation_capture_header" || value.chosenLineCount !== lineLength) return fail();
      } else if (ordinal <= lineLength) {
        if (kind !== "foundation_exchange_chosen" || value.lineIndex !== ordinal - 1) return fail();
      } else if (kind !== "foundation_exchange_stop" || value.index !== ordinal - lineLength - 1) return fail();
    }
  }
}

function followsOriginalExchange(previous: ExchangeDetailMember, member: ExchangeDetailMember): boolean {
  const priorCapture = previous.value.captureIndex, capture = member.value.captureIndex;
  if (capture !== priorCapture) return capture === priorCapture + 1 && previous.kind === "foundation_exchange_stop"
    && previous.value.stopped && member.kind === "foundation_capture_header";
  const previousKind = EXCHANGE_DETAIL_KINDS.indexOf(previous.kind), kind = EXCHANGE_DETAIL_KINDS.indexOf(member.kind);
  if (kind < previousKind || member.kind === "foundation_capture_header") return false;
  if (member.kind === "foundation_exchange_chosen") return member.value.lineIndex ===
    (previous.kind === "foundation_exchange_chosen" ? previous.value.lineIndex + 1 : 0);
  if (member.kind === "foundation_exchange_stop") return member.value.index ===
    (previous.kind === "foundation_exchange_stop" ? previous.value.index + 1 : 0);
  if (previous.kind !== "foundation_exchange_branch") return member.value.path.length === 1 && member.value.path[0] === 0;
  const prior = previous.value.path, next = member.value.path;
  const difference = next.findIndex((entry, index) => entry !== prior[index]);
  return difference >= 0 && (previous.value.continuationCount > 0
    ? difference === prior.length && next[difference] === 0
    : difference < prior.length && next[difference] === prior[difference]! + 1)
    && next.length === difference + 1;
}

export function renderExposureDetailContext(v: ExposureContext): string {
  const defender = pieceOn(v.defender.piece, v.defender.square), target = pieceOn(v.target.piece, v.target.square);
  return `${defender} no longer gives geometric coverage to ${target}. These exchanges assume ${side(v.target.piece.color)} skips the reply and en passant is cleared. They are hypothetical.`;
}
