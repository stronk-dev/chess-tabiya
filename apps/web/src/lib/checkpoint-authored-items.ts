import { exactMoveIdentity, type DrillRun } from "@chess-tabiya/runtime";

import type { AuthoredFeedbackItem, AuthoredFeedbackPage } from "./api.js";

function sameMoveAtNode(
  run: DrillRun,
  nodeId: string,
  leftUci: string,
  rightUci: string,
): boolean {
  if (leftUci === rightUci) return true;
  const node = run.nodes.find((candidate) => candidate.id === nodeId);
  const parent = run.nodes.find((candidate) => candidate.id === node?.parentId);
  if (parent === undefined) return false;
  try {
    return exactMoveIdentity(parent.fen, leftUci) === exactMoveIdentity(parent.fen, rightUci);
  } catch {
    return false;
  }
}

/** Select the authored items belonging in one visible checkpoint occurrence. */
export function checkpointAuthoredItems(
  checkpointEventSeq: number,
  feedback: AuthoredFeedbackPage | undefined,
  run: DrillRun,
): readonly AuthoredFeedbackItem[] {
  const all = feedback?.items ?? [];
  const current = all.filter((item) => item.revealedBy.eventSeq === checkpointEventSeq);
  const verdicts = current.filter(
    (item): item is Extract<AuthoredFeedbackItem, { kind: "theory_verdict" }> =>
      item.kind === "theory_verdict" && item.verdict === "classified_deviation",
  );
  const supportingNotes = all.filter(
    (item) =>
      item.kind === "deviation" &&
      verdicts.some(
        (verdict) =>
          verdict.deviationClass === item.deviationClass &&
          sameMoveAtNode(run, verdict.anchor.nodeId, verdict.anchor.moveUci, item.anchor.moveUci),
      ) &&
      !current.some((candidate) => candidate.id === item.id),
  );
  return [...current, ...supportingNotes];
}
