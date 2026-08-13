import {
  eventsSince,
  feedbackDisclosed,
  isEngineEvidenceRef,
  type DrillRun,
  type DrillRunEvent,
  type Node,
} from "@chess-tabiya/runtime";

export function publicNodes(
  run: DrillRun,
): readonly Node[] {
  if (feedbackDisclosed(run)) return run.nodes;
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
  run: DrillRun,
  sinceSeq: number,
): { readonly events: readonly DrillRunEvent[]; readonly nextSeq: number; readonly withheld?: true } {
  const candidates = eventsSince(run, sinceSeq);
  if (feedbackDisclosed(run)) {
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
    ...(barrier === -1 ? {} : { withheld: true as const }),
  });
}
