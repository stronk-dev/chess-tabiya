// Accepted longitudinal-store §A.2: finite decision-local native subjects, not condition aliases
// or a general subject ID. Called only over genuine current source events.
import { normalizeMove } from "chessops/chess";
import type { Color, FileName, SquareName } from "chessops/types";
import { parseSquare, parseUci } from "chessops/util";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { assertSemanticEvidenceEvent, type SemanticEvidenceEvent } from "./semantic-evidence.js";
import { readFoundationEventInvocation } from "./internal/evidence-value-routes.js";
import { originalPiecePositions } from "./foundation-piece-lineage.js";
import { positionFromFen } from "./position-cache.js";
import type { BackwardPawnChange, OppositionChange } from "./foundation-position-sources.js";
import type { FileAccessRevealed, FileStateChange, PawnFileGroupChange, PawnIslandTopologyChange } from "./foundation-pawn-sources.js";
import type { SliderIdentity, SliderMembershipChange } from "./foundation-slider-sources.js";
import type { SubjectDirection } from "./semantic-subject-types.js";

import type { NativeEventSubject } from "./semantic-native-subject-types.js";
export { NATIVE_SUBJECT_SOURCE_REFS } from "./semantic-native-subject-types.js";
export type { NativeEventSubject, NativeSubjectBySource, NativeSubjectSourceRef } from "./semantic-native-subject-types.js";

const EMPTY_PARAMETERS = Object.freeze({});
const DIRECTIONS = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]] as const;
const square = (value: SquareName) => { const parsed = parseSquare(value); if (parsed === undefined) throw new TypeError("Native subject lacks its original square"); return parsed; };
const color = (value: Color) => value === "white" ? 0 : 1;
const file = (value: FileName) => "abcdefgh".indexOf(value);
function step(value: number): -1 | 0 | 1 { if (value !== -1 && value !== 0 && value !== 1) throw new TypeError("Native direction is undeclared"); return value; }

/** Pure physical join; callers first authenticate the exact original backward2 source. */
export function originalBackwardPawnSquare(p: BackwardPawnChange): SquareName {
  if (p.subject.beforePawn !== null) return p.subject.beforePawn;
  const root = positionFromFen(p.beforeFen), parsed = parseUci(p.moveUci);
  if (parsed === undefined || !("from" in parsed)) throw new TypeError("Gained backward subject lost its original move");
  const move = normalizeMove(root, parsed);
  if (!("from" in move)) throw new TypeError("Gained backward subject lost its physical move");
  const original = originalPiecePositions(root, positionFromFen(p.afterFen), move).find(row => row.root.role === "pawn"
    && row.root.color === p.subject.color && row.current?.role === "pawn" && row.current.square === p.subject.afterPawn);
  if (original === undefined) throw new TypeError("Gained backward subject lost its original root pawn");
  return original.root.square;
}

export function nativeEventSubject(event: SemanticEvidenceEvent): NativeEventSubject {
  assertSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, event);
  readFoundationEventInvocation(event.evidence);
  const source = `${event.projection.id}@${event.projection.version}`;
  switch (source) {
    case "rules.structural.event.king_opposition@2": {
      const p = event.operands as OppositionChange;
      return Object.freeze({ source, subject: Object.freeze({ kind: "king_opposition", whiteRootSquare: p.before.kings.white, blackRootSquare: p.before.kings.black }), parameters: EMPTY_PARAMETERS, ordinal: 0 });
    }
    case "rules.structural.event.backward_pawn@2": {
      const p = event.operands as BackwardPawnChange, rootSquare = originalBackwardPawnSquare(p);
      return Object.freeze({ source, subject: Object.freeze({ kind: "backward_pawn", color: p.subject.color, rootSquare }), parameters: EMPTY_PARAMETERS, ordinal: square(rootSquare) });
    }
    case "derived.structural.event.pawn_file_group@1": {
      const p = event.operands as PawnFileGroupChange;
      return Object.freeze({ source, subject: Object.freeze({ kind: "pawn_file_group", color: p.subject.color, file: p.subject.file }), parameters: EMPTY_PARAMETERS, ordinal: color(p.subject.color) * 8 + file(p.subject.file) });
    }
    case "rules.transition.event.slider_ray@2": {
      const p = event.operands as SliderMembershipChange, direction = Object.freeze({ df: step(p.direction.df), dr: step(p.direction.dr) });
      const at = DIRECTIONS.findIndex(([df, dr]) => df === direction.df && dr === direction.dr);
      if (at < 0) throw new TypeError("Native direction pair is undeclared");
      return Object.freeze({ source, subject: Object.freeze({ kind: "physical_slider", root: Object.freeze({ color: p.root.color, role: p.root.role, square: p.root.square }), direction }), parameters: EMPTY_PARAMETERS, ordinal: square(p.root.square) * 8 + at });
    }
    case "derived.activity.event.file_state@1": {
      const p = event.operands as FileStateChange;
      return Object.freeze({ source, subject: Object.freeze({ kind: "file_state", file: p.file }), parameters: EMPTY_PARAMETERS, ordinal: file(p.file) });
    }
    case "derived.activity.event.file_access_revealed@1": {
      const p = event.operands as FileAccessRevealed;
      return Object.freeze({ source, subject: Object.freeze({ kind: "file_access", piece: Object.freeze({ color: p.piece.color, role: p.piece.role, square: p.piece.square }), file: p.file }), parameters: EMPTY_PARAMETERS, ordinal: square(p.piece.square) * 8 + file(p.file) });
    }
    case "rules.structural.event.pawn_islands@2": {
      const p = event.operands as PawnIslandTopologyChange;
      return Object.freeze({ source, subject: Object.freeze({ kind: "pawn_islands", color: p.color }), parameters: EMPTY_PARAMETERS, ordinal: color(p.color) });
    }
    default: throw new TypeError("Native subject has no exact declared source grammar");
  }
}
