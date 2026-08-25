import type { DrillRun, DrillRunEvent, Node } from "@chess-tabiya/runtime";

export type RehearsalGuideStage =
  | "decide"
  | "first_consequence"
  | "rewind"
  | "alternative"
  | "second_consequence"
  | "compare";

export interface RehearsalGuideStep {
  readonly stage: RehearsalGuideStage;
  readonly ordinal: 1 | 2 | 3 | 4;
  readonly title: string;
  readonly body: readonly string[];
  readonly rewindNodeId?: string;
  readonly compareBranchIds?: readonly string[];
}

const isConsequenceBoundary = (event: DrillRunEvent): boolean =>
  event.type === "checkpoint.reached" ||
  event.type === "segment.completed" ||
  event.type === "feedback.generated" ||
  event.type === "outcome.reached";

const userMove = (event: DrillRunEvent): Node | undefined =>
  event.type === "move.committed" && event.data.node.actor === "user"
    ? event.data.node
    : undefined;

export function rehearsalGuideStep(
  run: Pick<DrillRun, "branches" | "events" | "nodes">,
): RehearsalGuideStep {
  const firstUserIndex = run.events.findIndex((event) => userMove(event) !== undefined);
  if (firstUserIndex < 0) {
    return Object.freeze({
      stage: "decide",
      ordinal: 1,
      title: "Make one decision.",
      body: Object.freeze([
        "Tabiya does not comment while you are deciding. Play the move, then look.",
        "You will see what it does before you can go back. This attempt will stay recorded.",
      ]),
    });
  }

  const firstUserEvent = run.events[firstUserIndex]!;
  const firstNode = userMove(firstUserEvent)!;
  const firstBoundaryIndex = run.events.findIndex(
    (event, index) => index > firstUserIndex && isConsequenceBoundary(event),
  );
  if (firstBoundaryIndex < 0) {
    return Object.freeze({
      stage: "first_consequence",
      ordinal: 2,
      title: "Play the consequence.",
      body: Object.freeze([
        "Your move is recorded. You will play this out before you go back.",
        "Keep playing until this consequence reaches its checkpoint.",
      ]),
    });
  }

  const rewindIndex = run.events.findIndex(
    (event, index) => index > firstBoundaryIndex && event.type === "run.rewound",
  );
  if (rewindIndex < 0) {
    return Object.freeze({
      stage: "rewind",
      ordinal: 3,
      title: "That happened. It is kept.",
      body: Object.freeze([
        "Go back to the decision and try another move. Your first attempt will still be here.",
      ]),
      ...(firstNode.parentId === null ? {} : { rewindNodeId: firstNode.parentId }),
    });
  }

  const forkIndex = run.events.findIndex(
    (event, index) => index > rewindIndex && event.type === "branch.forked",
  );
  if (forkIndex < 0) {
    return Object.freeze({
      stage: "alternative",
      ordinal: 3,
      title: "Try it another way.",
      body: Object.freeze([
        "The first attempt is preserved. Make a different move from this position to create the second.",
      ]),
    });
  }

  const secondBoundaryIndex = run.events.findIndex(
    (event, index) => index > forkIndex && isConsequenceBoundary(event),
  );
  if (secondBoundaryIndex < 0) {
    return Object.freeze({
      stage: "second_consequence",
      ordinal: 4,
      title: "Play this consequence too.",
      body: Object.freeze([
        "The second attempt is now separate from the first. Finish this line before comparing them.",
      ]),
    });
  }

  return Object.freeze({
    stage: "compare",
    ordinal: 4,
    title: "Now put both attempts on one board.",
    body: Object.freeze([
      "Both consequences survived. Compare what changed, then keep rehearsing from either branch.",
    ]),
    compareBranchIds: Object.freeze(run.branches.slice(0, 2).map((branch) => branch.id)),
  });
}
