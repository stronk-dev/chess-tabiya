import { Chess } from "chessops/chess";
import type { Piece, SquareName } from "chessops/types";
import { opposite, parseSquare } from "chessops/util";

import { canonicalFen, positionFromFen } from "../position-cache.js";
import { assertDeclaredEvidence, type DeclaredEvidence } from "../evidence-contract.js";
import type { EvidenceEdge } from "../evidence-factories.js";
import type { LandingCaptureReading, LegalExchangeResult } from "../exchange.js";
import type { SquareControlEvent } from "../square-control.js";

export interface AvailableDefenderExposureOperands extends EvidenceEdge {
  readonly kind: "available";
  readonly defender: { readonly square: SquareName; readonly piece: Piece };
  readonly target: { readonly square: SquareName; readonly piece: Piece };
  readonly captures: readonly LegalExchangeResult[];
  readonly controllerEvent: SquareControlEvent;
  readonly passConvention: "mover-turn-ep-cleared@1";
}

/** The caller validates the legal edge before any source acquisition. */
export function defenderExposurePassFen(edge: EvidenceEdge): string | undefined {
  const after = positionFromFen(edge.afterFen);
  const clone = Chess.fromSetup({ ...after.toSetup(), turn: positionFromFen(edge.beforeFen).turn, epSquare: undefined });
  return clone.isOk ? canonicalFen(clone.value) : undefined;
}

function admittedControl(edge: EvidenceEdge, source: DeclaredEvidence<SquareControlEvent>): SquareControlEvent {
  assertDeclaredEvidence(source);
  if (source.projection.id !== "rules.square.event.control" || source.projection.version !== 1) {
    throw new TypeError("Defender exposure requires the exact square-control source");
  }
  const event = source.payload;
  if (event.beforeFen !== edge.beforeFen || event.moveUci !== edge.moveUci || event.afterFen !== edge.afterFen) {
    throw new TypeError("Defender exposure control belongs to another edge");
  }
  return event;
}

export function defenderExposureTarget(edge: EvidenceEdge, source: DeclaredEvidence<SquareControlEvent>): AvailableDefenderExposureOperands["target"] | undefined {
  const event = admittedControl(edge, source), before = positionFromFen(edge.beforeFen), after = positionFromFen(edge.afterFen);
  const enemy = opposite(before.turn), square = parseSquare(event.target)!;
  if (event.color !== enemy || event.mode !== "pseudo" || event.sign !== "lost") return undefined;
  const oldPiece = before.board.get(square), piece = after.board.get(square);
  if (oldPiece === undefined || piece === undefined || piece.color !== enemy || oldPiece.color !== piece.color ||
    oldPiece.role !== piece.role || Boolean(oldPiece.promoted) !== Boolean(piece.promoted)) return undefined;
  return { square: event.target, piece };
}

/** Pure join over genuine sources; this module cannot mint or admit caller payloads. */
export function defenderExposureValue(edge: EvidenceEdge, control: DeclaredEvidence<SquareControlEvent>, reading: DeclaredEvidence<LandingCaptureReading>): AvailableDefenderExposureOperands | undefined {
  const event = admittedControl(edge, control);
  assertDeclaredEvidence(reading);
  if (reading.projection.id !== "rules.exchange.reading.landing_captures" || reading.projection.version !== 1) {
    throw new TypeError("Defender exposure requires the complete landing-capture source");
  }
  const passFen = defenderExposurePassFen(edge);
  if (passFen === undefined || reading.payload.fen !== passFen || reading.payload.landingSquare !== event.target) {
    throw new TypeError("Defender exposure capture population belongs to another position or target");
  }
  // All joins precede the no-witness decisions, including genuine empty capture readings.
  const target = defenderExposureTarget(edge, control);
  if (target === undefined) return undefined;
  const captures = reading.payload.captures.filter(capture => capture.resultUnits > 0);
  if (captures.length === 0) return undefined;
  return { ...edge, kind: "available", defender: event.controller, target, captures: Object.freeze(captures),
    controllerEvent: event, passConvention: "mover-turn-ep-cleared@1" };
}
