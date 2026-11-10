// D4052: the existing board consumer owns its registered text as well as timeline metadata.
// Keep this outside pivotal.ts: the presentation registry uses that module's core producers.
import { permittedAssistance, type AssistanceContext } from "./assistance.js";
import { compileEvidenceConsumerExecution } from "./evidence-binding-execution.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { assertConsumerEvidenceView, evidenceForConsumer, type ConsumerEvidenceView } from "./evidence-contract.js";
import { liveAdmitted, livePivotalMarkerEvidenceItems, type PivotalMarker } from "./pivotal.js";
import { PresentationError, presentEvidenceItems, type PresentedEvidenceItem } from "./presentation-contract.js";
import type { DrillRun } from "./types.js";

const CONSUMER = Object.freeze({ id: "board.pivotal_marker", version: 2 });
export type PresentedPivotalMarker = Readonly<{
  /** Selection/navigation metadata only. Visible evidence comes from presentation, never detail. */
  marker: PivotalMarker;
  presentation: Readonly<{ kind: "ready"; items: readonly PresentedEvidenceItem[] } | { kind: "failed" }>;
}>;

export function consumePivotalMarkers(view: ConsumerEvidenceView<PivotalMarker>): readonly PresentedPivotalMarker[] {
  assertConsumerEvidenceView(view);
  if (view.consumer.id !== CONSUMER.id || view.consumer.version !== CONSUMER.version) {
    throw new TypeError("Expected board.pivotal_marker@2 consumer view");
  }
  return Object.freeze(view.items.map(evidence => {
    try {
      // One actual admitted item per presentation, not a first matching payload digest.
      // Equal-valued/repeated items retain their own original order and ownership.
      const items = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, CONSUMER, [evidence]));
      return Object.freeze({ marker: evidence.payload, presentation: Object.freeze({ kind: "ready" as const, items }) });
    } catch (error) {
      if (!(error instanceof PresentationError && error.code === "PRESENTATION_INVALID")) throw error;
      return Object.freeze({ marker: evidence.payload, presentation: Object.freeze({ kind: "failed" as const }) });
    }
  }));
}

/** Same original live filtering, with complete current-consumer preflight before any factory. */
export function pivotalMarkerEvidence(run: DrillRun, branchId: string, context: AssistanceContext): readonly PresentedPivotalMarker[] {
  compileEvidenceConsumerExecution(PRIMARY_EVIDENCE_MANIFEST, CONSUMER);
  const permission = permittedAssistance(context);
  const declared = livePivotalMarkerEvidenceItems(run, branchId).filter(item => liveAdmitted(item.payload, permission));
  return consumePivotalMarkers(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, CONSUMER, declared));
}
