import type { DrillRun } from "./types.js";

export function feedbackDisclosed(run: DrillRun): boolean {
  switch (run.feedbackPolicy) {
    case "delayed_checkpoint":
      return run.events.some(
        (event) => event.type === "checkpoint.reached" || event.type === "outcome.reached",
      );
    case "segment_end":
      return run.events.some(
        (event) => event.type === "segment.completed" || event.type === "outcome.reached",
      );
    case "attempt_end":
      return run.events.some(
        (event) => event.type === "feedback.revealed" || event.type === "outcome.reached",
      );
  }
}

export function feedbackDeliveryOpen(run: DrillRun): boolean {
  if (run.feedbackPolicy !== "attempt_end") return feedbackDisclosed(run);
  let open = false;
  for (const event of run.events) {
    if (event.type === "feedback.revealed" || event.type === "outcome.reached") open = true;
    else if (event.type === "move.committed") open = false;
  }
  return open;
}
