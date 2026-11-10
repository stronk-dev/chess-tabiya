import { consumeComparisonEngineTrajectory, consumeComparisonStripEvidence } from "./compare-strips.js";
import { evidenceConsumerOperation } from "./evidence-contract.js";
import { MODULE_CURRENT_IMAGE } from "./evidence-catalog.js";
import { compileModulePacket } from "./module-packets.js";
import { consumePivotalMarkers } from "./pivotal-presentation.js";
import { consumeMoveTransition, consumePositionStructure, consumeSelectedSquareSight } from "./reading-evidence.js";
import { consumeCurrentShapeFiring, consumeShapeFiring } from "./shape-presentation.js";
import { renderReviewStoryReceipt } from "./story.js";
import { consumeRecordedClockEvidence } from "./recorded-clock-review.js";
import { structuralEvidenceForAuthoring, structuralEvidenceForObjective, declareCurrentStructuralPredicateEvidence } from "./structural-evidence.js";

export const RUNTIME_EVIDENCE_CONSUMER_OPERATIONS = Object.freeze([
  evidenceConsumerOperation("authoring.predicate", structuralEvidenceForAuthoring),
  evidenceConsumerOperation("authoring.predicate", declareCurrentStructuralPredicateEvidence, 2),
  evidenceConsumerOperation("runtime.objective_condition", structuralEvidenceForObjective),
  evidenceConsumerOperation("runtime.objective_condition", declareCurrentStructuralPredicateEvidence, 2),
  evidenceConsumerOperation("inspector.position_structure", consumePositionStructure, 2),
  evidenceConsumerOperation("inspector.move_transition", consumeMoveTransition),
  evidenceConsumerOperation("board.selected_square_sight", consumeSelectedSquareSight),
  evidenceConsumerOperation("theory.shape_firing", consumeShapeFiring),
  evidenceConsumerOperation("theory.shape_firing", consumeCurrentShapeFiring, 2),
  evidenceConsumerOperation("compare.structure_strip", consumeComparisonStripEvidence),
  evidenceConsumerOperation("compare.engine_trajectory", consumeComparisonEngineTrajectory),
  evidenceConsumerOperation("board.pivotal_marker", consumePivotalMarkers, 2),
  evidenceConsumerOperation("review.story", renderReviewStoryReceipt),
  evidenceConsumerOperation("review.recorded_clock", consumeRecordedClockEvidence),
]);

/** Runtime-owned tuples only; Inspector's real source-page callable is registered by server. */
export const MODULE_EVIDENCE_CONSUMER_OPERATIONS = Object.freeze(MODULE_CURRENT_IMAGE.flatMap(row => {
  if (row.moduleId === "full_inspector") {
    if (row.implementation !== "compileInspectorSourcePage") throw new TypeError("Inspector must name its actual server-owned operation");
    return [];
  }
  if (row.implementation !== compileModulePacket.name) throw new TypeError("Runtime module lacks its exact compiler callable");
  return [evidenceConsumerOperation(row.consumer.id, compileModulePacket, row.consumer.version)];
}));
