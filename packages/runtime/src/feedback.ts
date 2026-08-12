import type { DrillRun } from "./types.js";

export function feedbackDisclosed(run: DrillRun): boolean {
  switch (run.feedbackPolicy) {
    case "delayed_checkpoint":
      return run.events.some((event) => event.type === "checkpoint.reached");
    case "segment_end":
      return run.events.some((event) => event.type === "segment.completed");
    case "attempt_end":
      return run.events.some((event) => event.type === "feedback.revealed");
  }
}

export function feedbackDeliveryOpen(run: DrillRun): boolean {
  if (run.feedbackPolicy !== "attempt_end") return feedbackDisclosed(run);
  let open = false;
  for (const event of run.events) {
    if (event.type === "feedback.revealed") open = true;
    else if (event.type === "move.committed") open = false;
  }
  return open;
}
