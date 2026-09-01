import {
  DEVELOPED_MATERIAL_MIN,
  ENDGAME_MATERIAL_MAX,
  MIDDLEGAME_UNDEVELOPED_MAX,
  OPENING_UNDEVELOPED_MIN,
  type PhaseReading,
} from "../../packages/runtime/src/phase.js";

export type PhaseDecision =
  | Readonly<{ kind: "endgame_material_band"; phase: "endgame"; axis: "maximum_non_pawn_material"; observed: number; boundary: typeof ENDGAME_MATERIAL_MAX; marginInsideBand: number }>
  | Readonly<{ kind: "material_transition_gap"; phase: "unclear"; axis: "maximum_non_pawn_material"; observed: number; endgameBoundary: typeof ENDGAME_MATERIAL_MAX; developedBoundary: typeof DEVELOPED_MATERIAL_MIN; distanceToEndgameBand: number; distanceToDevelopedBand: number }>
  | Readonly<{ kind: "opening_development_band"; phase: "opening"; axis: "undeveloped_home_minors"; observed: number; boundary: typeof OPENING_UNDEVELOPED_MIN; marginInsideBand: number }>
  | Readonly<{ kind: "middlegame_development_band"; phase: "middlegame"; axis: "undeveloped_home_minors"; observed: number; boundary: typeof MIDDLEGAME_UNDEVELOPED_MAX; marginInsideBand: number }>
  | Readonly<{ kind: "development_transition_gap"; phase: "unclear"; axis: "undeveloped_home_minors"; observed: number; middlegameBoundary: typeof MIDDLEGAME_UNDEVELOPED_MAX; openingBoundary: typeof OPENING_UNDEVELOPED_MIN; distanceToMiddlegameBand: number; distanceToOpeningBand: number }>;

type ReadingOperands = Pick<PhaseReading, "phase" | "material" | "undevelopedMinors">;

/** Reconstructs the classifier's exact ordered decision arm; it does not estimate confidence. */
export function phaseDecision(reading: ReadingOperands): PhaseDecision {
  const maximumMaterial = Math.max(reading.material.white, reading.material.black);
  const undeveloped = reading.undevelopedMinors.white + reading.undevelopedMinors.black;
  let decision: PhaseDecision;
  if (maximumMaterial <= ENDGAME_MATERIAL_MAX) {
    decision = Object.freeze({ kind: "endgame_material_band", phase: "endgame", axis: "maximum_non_pawn_material", observed: maximumMaterial, boundary: ENDGAME_MATERIAL_MAX, marginInsideBand: ENDGAME_MATERIAL_MAX - maximumMaterial });
  } else if (maximumMaterial < DEVELOPED_MATERIAL_MIN) {
    decision = Object.freeze({ kind: "material_transition_gap", phase: "unclear", axis: "maximum_non_pawn_material", observed: maximumMaterial, endgameBoundary: ENDGAME_MATERIAL_MAX, developedBoundary: DEVELOPED_MATERIAL_MIN, distanceToEndgameBand: maximumMaterial - ENDGAME_MATERIAL_MAX, distanceToDevelopedBand: DEVELOPED_MATERIAL_MIN - maximumMaterial });
  } else if (undeveloped >= OPENING_UNDEVELOPED_MIN) {
    decision = Object.freeze({ kind: "opening_development_band", phase: "opening", axis: "undeveloped_home_minors", observed: undeveloped, boundary: OPENING_UNDEVELOPED_MIN, marginInsideBand: undeveloped - OPENING_UNDEVELOPED_MIN });
  } else if (undeveloped <= MIDDLEGAME_UNDEVELOPED_MAX) {
    decision = Object.freeze({ kind: "middlegame_development_band", phase: "middlegame", axis: "undeveloped_home_minors", observed: undeveloped, boundary: MIDDLEGAME_UNDEVELOPED_MAX, marginInsideBand: MIDDLEGAME_UNDEVELOPED_MAX - undeveloped });
  } else {
    decision = Object.freeze({ kind: "development_transition_gap", phase: "unclear", axis: "undeveloped_home_minors", observed: undeveloped, middlegameBoundary: MIDDLEGAME_UNDEVELOPED_MAX, openingBoundary: OPENING_UNDEVELOPED_MIN, distanceToMiddlegameBand: undeveloped - MIDDLEGAME_UNDEVELOPED_MAX, distanceToOpeningBand: OPENING_UNDEVELOPED_MIN - undeveloped });
  }
  if (decision.phase !== reading.phase) throw new TypeError(`phase decision ${decision.kind} produces ${decision.phase}, not supplied ${reading.phase}`);
  return decision;
}
