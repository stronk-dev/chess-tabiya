import type { DrillRun } from "@chess-tabiya/runtime";

import type { RunDerivation } from "./api.js";

export interface FlipSubject {
  readonly runId: string;
  readonly nodeId: string;
  readonly branchId: string;
}

export interface FlipResponse {
  readonly run: DrillRun;
  readonly writerId: string;
  readonly derivation: RunDerivation;
}

export function assertFlipResponse(
  response: FlipResponse,
  subject: FlipSubject,
): void {
  const { derivation } = response;
  if (
    response.run.id !== derivation.derivedRunId
    || derivation.kind !== "flip_sides"
    || derivation.sourceRunId !== subject.runId
    || derivation.sourceNodeId !== subject.nodeId
    || derivation.sourceBranchId !== subject.branchId
  ) {
    throw new TypeError("Opposite-side replay response does not match its source");
  }
}
