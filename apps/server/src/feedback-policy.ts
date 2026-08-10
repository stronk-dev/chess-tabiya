import {
  eventsSince,
  isEngineEvidenceRef,
  type DrillRun,
  type DrillRunEvent,
  type Node,
} from "@chess-tabiya/runtime";

import type { PackRecord } from "./pack-registry.js";

export function feedbackIsRevealed(pack: PackRecord, run: DrillRun): boolean {
  return pack.feedbackPolicy === "delayed_checkpoint"
    ? run.events.some((event) => event.type === "checkpoint.reached")
    : run.events.some((event) => event.type === "segment.completed");
}

export function publicNodes(
  pack: PackRecord | undefined,
  run: DrillRun,
): readonly Node[] {
  if (pack === undefined || feedbackIsRevealed(pack, run)) return run.nodes;
  return Object.freeze(
    run.nodes.map((node) =>
      Object.freeze({
        ...node,
        evidenceRefs: Object.freeze(
          node.evidenceRefs.filter((reference) => !isEngineEvidenceRef(reference)),
        ),
      }),
    ),
  );
}

function engineFeedbackEvent(event: DrillRunEvent): boolean {
  if (event.type === "evidence.attached") return true;
  return (
    event.type === "objective.state_changed" &&
    event.data.evidenceRefs.some(isEngineEvidenceRef)
  );
}

export function publicEvents(
  pack: PackRecord | undefined,
  run: DrillRun,
  sinceSeq: number,
): { readonly events: readonly DrillRunEvent[]; readonly nextSeq: number } {
  const candidates = eventsSince(run, sinceSeq);
  if (pack === undefined || feedbackIsRevealed(pack, run)) {
    return Object.freeze({
      events: candidates,
      nextSeq: run.events.at(-1)?.seq ?? 0,
    });
  }
  const barrier = candidates.findIndex(engineFeedbackEvent);
  const events = barrier === -1 ? candidates : candidates.slice(0, barrier);
  return Object.freeze({
    events: Object.freeze(events),
    nextSeq: events.at(-1)?.seq ?? sinceSeq,
  });
}
