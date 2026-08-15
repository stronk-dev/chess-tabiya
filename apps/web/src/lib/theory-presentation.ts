import type { DrillRun } from "@chess-tabiya/runtime";
import { DEVIATION_MISTAKES } from "@chess-tabiya/schema/drill-pack";

import type { AuthoredFeedbackItem } from "./api.js";

export const UNKNOWN_THEORY_NOTE =
  "Unknown is not a judgement. The author wrote nothing about this move, and nothing here says it was good or bad.";

function mistakeSuffix(values: readonly string[] | undefined): string {
  if (values === undefined || values.length === 0) return "";
  const ordered = DEVIATION_MISTAKES.filter((value) => values.includes(value));
  return ` (${ordered.join(", ")})`;
}

export function theoryVerdictSentence(
  item: Extract<AuthoredFeedbackItem, { kind: "theory_verdict" }>,
  run: DrillRun,
): string {
  const san = run.nodes.find((node) => node.id === item.anchor.nodeId)?.moveSan ?? item.anchor.moveUci;
  if (item.verdict === "on_line") {
    return `Ply ${item.anchor.ply}, ${san}: on the authored line.`;
  }
  if (item.verdict === "classified_deviation") {
    return `Ply ${item.anchor.ply}, ${san}: the pack classifies this as ${item.deviationClass}${mistakeSuffix(item.deviationMistakes)}.`;
  }
  return `Ply ${item.anchor.ply}, ${san}: this pack has no statement about this move.`;
}
