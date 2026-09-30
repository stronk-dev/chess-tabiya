import { legalMovesForFen, moveSanFromUci } from "./board-input.js";

type RunRole = "host" | "participant" | "spectator";
type RunSessionKind = "pack" | "position" | "imported";
type ProposalState = "open" | "applied" | "declined" | "stale";
type VoteState = "open" | "closed" | "stale";
type InvitationState = "open" | "accepted" | "revoked";
type ClassroomRole = "teacher" | "learner";
type ClassroomState = "invited" | "active" | "left";

export interface LiveMoveChoice {
  readonly uci: string;
  readonly san: string;
}

export function liveLegalMoveChoices(fen: string): readonly LiveMoveChoice[] {
  const choices = [...legalMovesForFen(fen).values()]
    .flat()
    .map((uci) => Object.freeze({ uci, san: moveSanFromUci(fen, uci) ?? uci }))
    .sort((left, right) => left.san.localeCompare(right.san) || left.uci.localeCompare(right.uci));
  return Object.freeze(choices);
}

export function runSessionKindLabel(kind: RunSessionKind): string {
  if (kind === "pack") return "Pack rehearsal";
  if (kind === "imported") return "Imported game rehearsal";
  return "Position rehearsal";
}

export function liveRoleLabel(role: RunRole): string {
  if (role === "host") return "Host";
  if (role === "participant") return "Participant";
  return "Spectator";
}

export function proposalStateLabel(state: ProposalState): string {
  if (state === "open") return "Awaiting the host";
  if (state === "applied") return "Played on the board";
  if (state === "declined") return "Not taken";
  return "From an earlier position";
}

export function voteStateLabel(state: VoteState): string {
  if (state === "open") return "Voting open";
  if (state === "closed") return "Voting closed";
  return "Position changed";
}

// ux-live-and-social.md §12-5 (LIV-a23): a delay on the board and the time an audience has to answer
// a vote are different objects. Each is named where it is set, and each says it is not the other.
export const LIVE_BOARD_DELAY_SENTENCE = "viewers see each move as you commit it. If you are showing a game still being played, set the delay in your streaming software. Voting time only controls when a poll closes; it does not delay the board.";
export const LIVE_VOTE_TIMING_SENTENCE = "Voting time only decides when this poll closes. It is not a board delay: viewers see each move as you commit it.";

export function invitationStateLabel(state: InvitationState): string {
  if (state === "open") return "Waiting for a response";
  if (state === "accepted") return "Joined";
  return "No longer available";
}

export function classroomRoleLabel(role: ClassroomRole): string {
  return role === "teacher" ? "Teacher" : "Learner";
}

export function classroomStateLabel(state: ClassroomState): string {
  if (state === "invited") return "Invitation waiting";
  if (state === "active") return "Active";
  return "Left classroom";
}

const JOURNAL_LABELS: Readonly<Record<string, string>> = Object.freeze({
  "session.opened": "Session opened",
  "member.joined": "Member joined",
  "board.granted": "Board handed over",
  "proposal.made": "Move proposed",
  "proposal.applied": "Proposal played",
  "proposal.declined": "Proposal declined",
  "vote.opened": "Vote opened",
  "vote.closed": "Vote closed",
  "vote.applied": "Vote choice recorded",
  "leg.imported": "Match leg imported",
  "session.closed": "Session closed",
  "match.pause_proposed": "Rehearsal pause proposed",
  "match.paused": "Match paused for rehearsal",
  "match.resumed": "Main line resumed",
  "link.minted": "Invitation link created",
  "link.revoked": "Invitation link revoked",
});

export function sessionJournalLabel(kind: string): string {
  return JOURNAL_LABELS[kind] ?? "Session updated";
}

export function arenaLegState(branchId: string | null, result: string | null): string {
  if (branchId === null) return "Waiting for a game import";
  return result === null || result === "*" ? "Imported and ready to compare" : `Imported · result ${result}`;
}
