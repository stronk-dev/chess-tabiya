import { evidenceConsumerOperation } from "@chess-tabiya/runtime";

import { claimProvenanceDeclared } from "./claim-presentation.js";
import { renderDeclaredEvidenceRef } from "./evidence-sentences.js";
import { consumeCorpus, consumeHumanSplit } from "./inspector-evidence.js";

export const WEB_EVIDENCE_CONSUMER_OPERATIONS = Object.freeze([
  evidenceConsumerOperation("runtime.evidence_ref", renderDeclaredEvidenceRef),
  evidenceConsumerOperation("inspector.human_split", consumeHumanSplit),
  evidenceConsumerOperation("inspector.corpus", consumeCorpus),
  evidenceConsumerOperation("guidance.authored_claim", claimProvenanceDeclared),
]);
