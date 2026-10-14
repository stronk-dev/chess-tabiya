// DISPOSABLE D3819 observation only. Captures the actual private source context after it has
// passed RunService's normal read/disclosure rules; changes no result and mints no evidence.
import type { DrillRun, ReviewEvidencePacket, StoryProjection } from "../../packages/runtime/src/index.js";
import type { Principal } from "../../apps/server/src/authorization.js";
import type { RunRole } from "../../apps/server/src/storage.js";

export interface ObservedReview {
  readonly run: DrillRun;
  readonly branchId: string;
  readonly principal: Principal;
  readonly role: RunRole;
  readonly packet: ReviewEvidencePacket;
  readonly projection: StoryProjection;
}
let observed: ObservedReview[] = [];
export function observeReviewForResearch(value: ObservedReview): void { observed.push(value); }
export function takeObservedReviews(): readonly ObservedReview[] {
  const result = observed;
  observed = [];
  return result;
}
