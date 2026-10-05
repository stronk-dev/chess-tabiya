import {
  comparisonNarrative,
  evidenceConsumerOperation,
  storyDeclaredEvidence,
} from "@chess-tabiya/runtime";

import { consumeGuardCondition } from "./guard.js";
import { consumeBranchDecidednessEvidence } from "./branch-tablebase.js";
import { consumeQueuedTablebaseEvidence } from "./queued-tablebase.js";
import { renderRecordedReadingEvidence, renderedEvidenceItems, voiceEvidenceView } from "./guidance.js";
import { consumeOpponentSelectionEvidence } from "./opponent-selector.js";
import { consumeRepertoireCorpus } from "./repertoire.js";
import { consumeReturnFrequency } from "./return-frequency.js";
import { consumeClaimBindingRecords } from "./sourcing/claim-binding.js";

export const SERVER_EVIDENCE_CONSUMER_OPERATIONS = Object.freeze([
  evidenceConsumerOperation("runtime.branch_decidedness", consumeBranchDecidednessEvidence),
  evidenceConsumerOperation("runtime.queued_tablebase", consumeQueuedTablebaseEvidence),
  evidenceConsumerOperation("runtime.guard_condition", consumeGuardCondition),
  evidenceConsumerOperation("guidance.deterministic", renderedEvidenceItems),
  evidenceConsumerOperation("guidance.voice", voiceEvidenceView),
  evidenceConsumerOperation("guidance.recorded_reading", renderRecordedReadingEvidence),
  evidenceConsumerOperation("opponent.selection", consumeOpponentSelectionEvidence),
  evidenceConsumerOperation("runtime.repertoire_scan", consumeRepertoireCorpus),
  evidenceConsumerOperation("runtime.return_frequency", consumeReturnFrequency),
  evidenceConsumerOperation("authoring.claim_binding", consumeClaimBindingRecords),
  evidenceConsumerOperation("guidance.voice_compare", comparisonNarrative),
  evidenceConsumerOperation("guidance.voice_story", storyDeclaredEvidence),
]);
