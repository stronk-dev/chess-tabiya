import { consumeComparisonEngineTrajectory, consumeComparisonStripEvidence } from "./compare-strips.js";
import { evidenceConsumerOperation } from "./evidence-contract.js";
import { MODULE_CURRENT_IMAGE } from "./evidence-catalog.js";
import { compileModulePacket } from "./module-packets.js";
import { consumePivotalMarkers } from "./pivotal.js";
import { consumeMoveTransition, consumePositionStructure, consumeSelectedSquareSight } from "./reading-evidence.js";
import { consumeShapeFiring } from "./shape-firing.js";
import { renderReviewStoryReceipt } from "./story.js";
import { structuralEvidenceForAuthoring, structuralEvidenceForObjective } from "./structural-evidence.js";

export const RUNTIME_EVIDENCE_CONSUMER_OPERATIONS = Object.freeze([
  evidenceConsumerOperation("authoring.predicate", structuralEvidenceForAuthoring),
  evidenceConsumerOperation("runtime.objective_condition", structuralEvidenceForObjective),
  evidenceConsumerOperation("inspector.position_structure", consumePositionStructure),
  evidenceConsumerOperation("inspector.move_transition", consumeMoveTransition),
  evidenceConsumerOperation("board.selected_square_sight", consumeSelectedSquareSight),
  evidenceConsumerOperation("theory.shape_firing", consumeShapeFiring),
  evidenceConsumerOperation("compare.structure_strip", consumeComparisonStripEvidence),
  evidenceConsumerOperation("compare.engine_trajectory", consumeComparisonEngineTrajectory),
  evidenceConsumerOperation("board.pivotal_marker", consumePivotalMarkers),
  evidenceConsumerOperation("review.story", renderReviewStoryReceipt),
]);

const MODULE_COMPILERS = Object.freeze({ compileModulePacket });
/** Exact current tuples backed by the same callable the production query invokes. */
export const MODULE_EVIDENCE_CONSUMER_OPERATIONS = Object.freeze(MODULE_CURRENT_IMAGE.map(row =>
  evidenceConsumerOperation(row.consumer.id, MODULE_COMPILERS[row.implementation], row.consumer.version)));
