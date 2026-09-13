import type { MutationResult } from "@chess-tabiya/runtime";

export interface StoryReentrySubject {
  readonly runId: string;
  readonly nodeId: string;
}

export function assertStoryRewindResponse(
  response: MutationResult,
  subject: StoryReentrySubject,
): void {
  const rewound = response.emitted.find((event) => event.type === "run.rewound");
  if (
    response.run.id !== subject.runId
    || response.run.activeCursor.nodeId !== subject.nodeId
    || rewound?.data.toNodeId !== subject.nodeId
  ) {
    throw new Error("Story rewind response did not match its requested moment");
  }
}

export function assertStoryForkResponse(
  response: MutationResult,
  subject: StoryReentrySubject,
): void {
  const forked = response.emitted.find((event) => event.type === "branch.forked");
  if (
    response.run.id !== subject.runId
    || response.run.activeCursor.nodeId !== subject.nodeId
    || forked?.data.branch.forkNodeId !== subject.nodeId
    || forked.data.branch.label !== "story-reentry"
    || response.run.activeCursor.branchId !== forked.data.branch.id
    || !response.run.branches.some((branch) => branch.id === forked.data.branch.id)
  ) {
    throw new Error("Story branch response did not match its requested moment");
  }
}
