import {
  deriveSegments,
  eventsSince,
  feedbackDeliveryOpen,
  feedbackDisclosed,
  isMachineEvidenceRef,
  type DrillRun,
  type DrillRunEvent,
  type Node,
} from "@chess-tabiya/runtime";

function reasoningDeliveryOpen(run: DrillRun, event: Extract<DrillRunEvent, { readonly type: "reasoning.recorded" }>): boolean {
  if (run.feedbackPolicy === "delayed_checkpoint" || run.feedbackPolicy === "immediate_guard") return true;
  if (run.feedbackPolicy === "attempt_end") return feedbackDeliveryOpen(run);
  return deriveSegments(run).some((segment) => segment.startSeq <= event.data.checkpointEventSeq && segment.endSeq >= event.data.checkpointEventSeq);
}

function publicReasoningEvent(run: DrillRun, event: DrillRunEvent): DrillRunEvent {
  if (event.type !== "reasoning.recorded" || reasoningDeliveryOpen(run, event)) return event;
  return Object.freeze({ ...event, data: Object.freeze({ ...event.data, detections: Object.freeze([]) }) }) as DrillRunEvent;
}

export function publicRunSnapshot(run: DrillRun): DrillRun {
  return Object.freeze({ ...run, events: Object.freeze(run.events.map((event) => publicReasoningEvent(run, event))) });
}

export function publicMutationPayload<T>(value: T): T {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return value;
  const record = value as Record<string, unknown>;
  const candidate = record.run;
  if (candidate === null || typeof candidate !== "object" || Array.isArray(candidate)) return value;
  const run = candidate as DrillRun;
  if (!Array.isArray(run.events) || !Array.isArray(run.nodes)) return value;
  return Object.freeze({
    ...record,
    run: publicRunSnapshot(run),
    ...(Array.isArray(record.emitted) ? { emitted: Object.freeze((record.emitted as DrillRunEvent[]).map((event) => publicReasoningEvent(run, event))) } : {}),
  }) as T;
}

export function publicNodes(
  run: DrillRun,
): readonly Node[] {
  if (feedbackDisclosed(run)) return run.nodes;
  return Object.freeze(
    run.nodes.map((node) =>
      Object.freeze({
        ...node,
        evidenceRefs: Object.freeze(
          node.evidenceRefs.filter((reference) => !isMachineEvidenceRef(reference)),
        ),
      }),
    ),
  );
}

function engineFeedbackEvent(event: DrillRunEvent): boolean {
  if (event.type === "evidence.attached") return true;
  return (
    event.type === "objective.state_changed" &&
    event.data.evidenceRefs.some(isMachineEvidenceRef)
  );
}

export function publicEvents(
  run: DrillRun,
  sinceSeq: number,
): { readonly events: readonly DrillRunEvent[]; readonly nextSeq: number; readonly withheld?: true } {
  const candidates = eventsSince(run, sinceSeq);
  if (feedbackDisclosed(run)) {
    return Object.freeze({
      events: Object.freeze(candidates.map((event) => publicReasoningEvent(run, event))),
      nextSeq: run.events.at(-1)?.seq ?? 0,
    });
  }
  const barrier = candidates.findIndex(engineFeedbackEvent);
  const events = barrier === -1 ? candidates : candidates.slice(0, barrier);
  return Object.freeze({
    events: Object.freeze(events.map((event) => publicReasoningEvent(run, event))),
    nextSeq: events.at(-1)?.seq ?? sinceSeq,
    ...(barrier === -1 ? {} : { withheld: true as const }),
  });
}
