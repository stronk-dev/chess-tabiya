import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import type { ObjectiveState } from "@chess-tabiya/runtime";

export interface LiveOverlayObjectiveCopy {
  readonly headline: string;
  readonly status: string;
}

const STATUS: Readonly<Record<ObjectiveState, string>> = Object.freeze({
  active: "Objective in progress",
  preserved: "Objective preserved",
  degraded: "Objective under pressure",
  failed: "Objective not achieved",
  achieved: "Objective achieved",
  transitioned: "Objective changed",
});

export function liveOverlayObjectiveCopy(
  pack: DrillPackDefinition | undefined,
  state: ObjectiveState,
): LiveOverlayObjectiveCopy {
  const summary = pack?.objective.summary?.trim();
  return Object.freeze({
    headline: summary || "No rehearsal objective is attached to this run.",
    status: STATUS[state],
  });
}
