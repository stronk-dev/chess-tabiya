import type { BoardControl, RunSummary, SessionKind } from "./api.js";

export type LiveWorkflow = "academy" | "stream" | "native_match" | "position_arena";

export interface LiveWorkflowOption {
  readonly id: LiveWorkflow;
  readonly label: string;
  readonly summary: string;
  readonly kind: SessionKind;
  readonly boardControl: BoardControl;
}

export const LIVE_WORKFLOWS: readonly LiveWorkflowOption[] = Object.freeze([
  Object.freeze({ id: "academy", label: "Teach or coach", summary: "Share one rehearsal, hand over the board, and compare attempts together.", kind: "academy", boardControl: "host_directed" }),
  Object.freeze({ id: "stream", label: "Stream a rehearsal", summary: "Broadcast the commit, consequence, rewind, fork, and compare loop.", kind: "stream", boardControl: "host_directed" }),
  Object.freeze({ id: "native_match", label: "Play a friend here", summary: "Two signed-in players alternate on one untouched position, with rehearsal available only after a pause.", kind: "match", boardControl: "match" }),
  Object.freeze({ id: "position_arena", label: "Run a Position Arena", summary: "Play the same starting position elsewhere as both colours, then import and compare the two games.", kind: "match", boardControl: "host_directed" }),
]);

export function liveWorkflow(kind: SessionKind, boardControl: BoardControl): LiveWorkflow {
  if (kind === "academy") return "academy";
  if (kind === "stream") return "stream";
  return boardControl === "match" ? "native_match" : "position_arena";
}

export function liveWorkflowOption(workflow: LiveWorkflow): LiveWorkflowOption {
  const option = LIVE_WORKFLOWS.find((candidate) => candidate.id === workflow);
  if (option === undefined) throw new TypeError(`Unknown live workflow: ${workflow}`);
  return option;
}

export function liveBoardControlOptions(kind: SessionKind): readonly Readonly<{ id: BoardControl; label: string }>[] {
  if (kind === "match") return Object.freeze([
    Object.freeze({ id: "host_directed", label: "Host directs the Arena board" }),
    Object.freeze({ id: "free_claim", label: "Participants may claim the Arena board" }),
    Object.freeze({ id: "rotation", label: "Arena board follows a rotation" }),
    Object.freeze({ id: "match", label: "Two players alternate by colour" }),
  ]);
  return Object.freeze([
    Object.freeze({ id: "host_directed", label: "Host directs the board" }),
    Object.freeze({ id: "free_claim", label: "Participants may claim the board" }),
    Object.freeze({ id: "rotation", label: "Board follows a rotation" }),
  ]);
}

export function liveRunIneligibility(run: Pick<RunSummary, "sessionKind" | "recordedMoveCount">, workflow: LiveWorkflow): string | undefined {
  if (workflow !== "native_match") return undefined;
  if (run.sessionKind !== "position") return "Start a fresh position first; native matches cannot use a pack rehearsal or imported game.";
  if (run.recordedMoveCount !== 0) return "This position already has recorded moves. Start a fresh position for a native match.";
  return undefined;
}
