import {
  assertConsumerEvidenceView,
  evidenceForConsumer,
  type ConsumerEvidenceView,
  type DeclaredEvidence,
} from "./evidence-contract.js";
import { STRUCTURAL_FEATURE_KINDS } from "@chess-tabiya/schema/drill-pack";

import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import type { StructuralObservation, StructuralReading, StructureMatch } from "./structure.js";
import type { TransitionObservation, TransitionReading } from "./transition.js";

const ref = (id: string) => ({ id, version: 1 } as const);
const READING_KINDS = Object.freeze(STRUCTURAL_FEATURE_KINDS.filter((kind) => kind !== "pawn_count" && kind !== "named_structure"));
const TRANSITION_LEAVES = Object.freeze([
  "attacked_squares_changed.gained", "attacked_squares_changed.lost",
  "defended_squares_changed.gained", "defended_squares_changed.lost",
  "slider_lines_changed.opened", "slider_lines_changed.closed",
  "escape_squares_changed.gained", "escape_squares_changed.lost",
  "defended_duties_changed.acquired", "defended_duties_changed.released",
  "move_irreversibility.castled", "move_irreversibility.clock_zeroed",
  "move_irreversibility.last_of_role", "move_irreversibility.pawn_break",
] as const);

/**
 * Structural readings for one position, computed by the per-family factories from the FEN.
 * The reading argument supplies only its FEN; its feature list is never sealed.
 */
export function declareStructuralReadingEvidence(
  reading: Pick<StructuralReading, "fen">,
): readonly DeclaredEvidence<StructuralObservation | StructureMatch>[] {
  const fen = reading.fen;
  return Object.freeze([
    ...READING_KINDS.flatMap((kind) => invokeEvidenceValueRoute(`rules.structural.reading.${kind}@1`, { fen })),
    ...invokeEvidenceValueRoute("rules.structural.reading.named_structure@2", { fen }),
  ]) as readonly DeclaredEvidence<StructuralObservation | StructureMatch>[];
}

/** Transition readings for one recorded edge, computed by the per-leaf factories. */
export function declareTransitionReadingEvidence(
  reading: Pick<TransitionReading, "before" | "moveUci" | "after">,
): readonly DeclaredEvidence<TransitionObservation>[] {
  const edge = { beforeFen: reading.before, moveUci: reading.moveUci, afterFen: reading.after };
  return Object.freeze(TRANSITION_LEAVES.flatMap((leaf) => invokeEvidenceValueRoute(`rules.transition.reading.${leaf}@1`, edge))) as readonly DeclaredEvidence<TransitionObservation>[];
}

/** named_structure@2 carries the catalogue match; inspectors keep one observation display shape. */
function observation(item: DeclaredEvidence<unknown>): StructuralObservation {
  if (item.projection.id === "rules.structural.reading.named_structure" && item.projection.version === 2) {
    // Checkpoint P ([[D2047]]): the payload retains the exact matched-witness squares.
    const match = item.payload as StructureMatch & { readonly squares: readonly string[] };
    return Object.freeze({ kind: "named_structure", squares: Object.freeze([...match.squares]), provenanceNote: match.provenanceNote }) as StructuralObservation;
  }
  return item.payload as StructuralObservation;
}

function consume<T>(view: ConsumerEvidenceView<T>, id: string): readonly T[] {
  assertConsumerEvidenceView(view);
  if (view.consumer.id !== id || view.consumer.version !== 1) {
    throw new TypeError(`Expected ${id}@1 consumer view`);
  }
  return Object.freeze(view.items.map((item) => item.payload));
}

function consumeObservations(view: ConsumerEvidenceView<unknown>, id: string): readonly StructuralObservation[] {
  assertConsumerEvidenceView(view);
  if (view.consumer.id !== id || view.consumer.version !== 1) {
    throw new TypeError(`Expected ${id}@1 consumer view`);
  }
  return Object.freeze(view.items.map(observation));
}

export function consumePositionStructure(
  view: ConsumerEvidenceView<unknown>,
): readonly StructuralObservation[] {
  return consumeObservations(view, "inspector.position_structure");
}

export function consumeSelectedSquareSight(
  view: ConsumerEvidenceView<unknown>,
): readonly StructuralObservation[] {
  return consumeObservations(view, "board.selected_square_sight");
}

export function consumeMoveTransition(
  view: ConsumerEvidenceView<TransitionObservation>,
): readonly TransitionObservation[] {
  return consume(view, "inspector.move_transition");
}

export function positionStructureEvidence(reading: Pick<StructuralReading, "fen">): readonly StructuralObservation[] {
  return consumePositionStructure(evidenceForConsumer(
    PRIMARY_EVIDENCE_MANIFEST,
    ref("inspector.position_structure"),
    declareStructuralReadingEvidence(reading),
  ));
}

export function selectedSquareSightEvidence(reading: Pick<StructuralReading, "fen">): readonly StructuralObservation[] {
  return consumeSelectedSquareSight(evidenceForConsumer(
    PRIMARY_EVIDENCE_MANIFEST,
    ref("board.selected_square_sight"),
    declareStructuralReadingEvidence(reading),
  ));
}

export function moveTransitionEvidence(reading: Pick<TransitionReading, "before" | "moveUci" | "after">): readonly TransitionObservation[] {
  return consumeMoveTransition(evidenceForConsumer(
    PRIMARY_EVIDENCE_MANIFEST,
    ref("inspector.move_transition"),
    declareTransitionReadingEvidence(reading),
  ));
}
