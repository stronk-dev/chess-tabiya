import {
  comparisonNarrative,
  evidenceConsumerOperation,
  storyDeclaredEvidence,
} from "@chess-tabiya/runtime";

import { consumeGuardCondition } from "./guard.js";
import { renderRecordedReadingEvidence, renderedEvidenceItems, voiceEvidenceView } from "./guidance.js";
import { consumeOpponentSelectionEvidence } from "./opponent-selector.js";
import { consumeRepertoireCorpus } from "./repertoire.js";
import { consumeClaimBindingRecords } from "./sourcing/claim-binding.js";

export const SERVER_EVIDENCE_CONSUMER_OPERATIONS = Object.freeze([
  evidenceConsumerOperation("runtime.guard_condition", consumeGuardCondition),
  evidenceConsumerOperation("guidance.deterministic", renderedEvidenceItems),
  evidenceConsumerOperation("guidance.voice", voiceEvidenceView),
  evidenceConsumerOperation("guidance.recorded_reading", renderRecordedReadingEvidence),
  evidenceConsumerOperation("opponent.selection", consumeOpponentSelectionEvidence),
  evidenceConsumerOperation("runtime.repertoire_scan", consumeRepertoireCorpus),
  evidenceConsumerOperation("authoring.claim_binding", consumeClaimBindingRecords),
  evidenceConsumerOperation("guidance.voice_compare", comparisonNarrative),
  evidenceConsumerOperation("guidance.voice_story", storyDeclaredEvidence),
]);
