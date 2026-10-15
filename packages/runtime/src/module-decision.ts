import { feedbackDeliveryOpen } from "./feedback.js";
import { presentationDigest } from "./presentation-digest.js";
import type { DrillRun } from "./types.js";

export interface ModuleDecisionStamp {
  readonly eventHeadSeq: number;
  readonly cursor: { readonly branchId: string; readonly nodeId: string };
  readonly disclosureBoundarySeq: number | null;
  readonly digest: string;
}
function disclosureBoundary(run: DrillRun): number | null {
  if (!feedbackDeliveryOpen(run)) return null;
  const boundary = [...run.events].reverse().find((event) => event.type === "feedback.revealed" || event.type === "outcome.reached" || event.type === "checkpoint.reached" || event.type === "segment.completed");
  return boundary?.seq ?? run.events.at(-1)?.seq ?? 0;
}
/** The existing decision stamp, without importing query execution into recorded source owners. */
export function moduleDecisionStamp(run: DrillRun): ModuleDecisionStamp {
  const body = { eventHeadSeq: run.events.at(-1)?.seq ?? 0, cursor: { branchId: run.activeCursor.branchId, nodeId: run.activeCursor.nodeId }, disclosureBoundarySeq: disclosureBoundary(run) };
  return Object.freeze({ ...body, cursor: Object.freeze(body.cursor), digest: presentationDigest("module.decision_stamp@1", body) });
}
