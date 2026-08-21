import {
  assertConsumerEvidenceView,
  evidenceForConsumer,
  type ConsumerEvidenceView,
  type DeclaredEvidence,
} from "./evidence-contract.js";
import { declareStructuralReadingSourceEvidence, declareTransitionReadingSourceEvidence } from "./evidence-source-adapters.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import type { StructuralObservation, StructuralReading } from "./structure.js";
import type { TransitionObservation, TransitionReading } from "./transition.js";

const ref = (id: string) => ({ id, version: 1 } as const);

export function declareStructuralReadingEvidence(
  reading: StructuralReading,
): readonly DeclaredEvidence<StructuralObservation>[] {
  return Object.freeze(reading.features
    .filter((item) => item.kind !== "pawn_count")
    .map(declareStructuralReadingSourceEvidence));
}

export function declareTransitionReadingEvidence(
  reading: TransitionReading,
): readonly DeclaredEvidence<TransitionObservation>[] {
  return Object.freeze(reading.observations.map(declareTransitionReadingSourceEvidence));
}

function consume<T>(view: ConsumerEvidenceView<T>, id: string): readonly T[] {
  assertConsumerEvidenceView(view);
  if (view.consumer.id !== id || view.consumer.version !== 1) {
    throw new TypeError(`Expected ${id}@1 consumer view`);
  }
  return Object.freeze(view.items.map((item) => item.payload));
}

export function consumePositionStructure(
  view: ConsumerEvidenceView<StructuralObservation>,
): readonly StructuralObservation[] {
  return consume(view, "inspector.position_structure");
}

export function consumeSelectedSquareSight(
  view: ConsumerEvidenceView<StructuralObservation>,
): readonly StructuralObservation[] {
  return consume(view, "board.selected_square_sight");
}

export function consumeMoveTransition(
  view: ConsumerEvidenceView<TransitionObservation>,
): readonly TransitionObservation[] {
  return consume(view, "inspector.move_transition");
}

export function positionStructureEvidence(reading: StructuralReading): readonly StructuralObservation[] {
  return consumePositionStructure(evidenceForConsumer(
    PRIMARY_EVIDENCE_MANIFEST,
    ref("inspector.position_structure"),
    declareStructuralReadingEvidence(reading),
  ));
}

export function selectedSquareSightEvidence(reading: StructuralReading): readonly StructuralObservation[] {
  return consumeSelectedSquareSight(evidenceForConsumer(
    PRIMARY_EVIDENCE_MANIFEST,
    ref("board.selected_square_sight"),
    declareStructuralReadingEvidence(reading),
  ));
}

export function moveTransitionEvidence(reading: TransitionReading): readonly TransitionObservation[] {
  return consumeMoveTransition(evidenceForConsumer(
    PRIMARY_EVIDENCE_MANIFEST,
    ref("inspector.move_transition"),
    declareTransitionReadingEvidence(reading),
  ));
}
