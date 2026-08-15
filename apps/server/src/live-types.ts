import type { LeaseIdentity, RunRole } from "./storage.js";

export const SESSION_KINDS = Object.freeze(["stream", "academy", "match"] as const);
export type SessionKind = (typeof SESSION_KINDS)[number];

export const BOARD_CONTROLS = Object.freeze(["free_claim", "host_directed", "rotation", "match"] as const);
export type BoardControl = (typeof BOARD_CONTROLS)[number];

export const SESSION_JOURNAL_KINDS = Object.freeze([
  "session.opened", "member.joined", "board.granted",
  "proposal.made", "proposal.applied", "proposal.declined",
  "vote.opened", "vote.closed", "vote.applied",
  "leg.imported", "session.closed",
  "match.pause_proposed", "match.paused", "match.resumed",
  "link.minted", "link.revoked",
] as const);
export type SessionJournalKind = (typeof SESSION_JOURNAL_KINDS)[number];

export interface LiveSession {
  readonly id: string;
  readonly runId: string;
  readonly kind: SessionKind;
  readonly title: string;
  readonly boardControl: BoardControl;
  readonly scheduledFor?: string;
  readonly voteAdapterLearnerId?: string;
  readonly rotation?: readonly string[];
  readonly handoffLearnerId?: string;
  readonly rotationCursor: number;
  readonly createdBy: string;
  readonly createdAt: string;
  readonly closedAt?: string;
}

export interface SessionJournalEntry {
  readonly sessionId: string;
  readonly seq: number;
  readonly at: string;
  readonly kind: SessionJournalKind;
  readonly actorLearnerId: string | null;
  readonly runSeq: number | null;
  readonly payload: Readonly<Record<string, unknown>>;
}

export interface SessionProposal {
  readonly id: string;
  readonly sessionId: string;
  readonly nodeId: string;
  readonly moveUci: string;
  readonly proposedBy: string;
  readonly at: string;
  readonly status: "open" | "applied" | "declined" | "stale";
  readonly resolvedRunSeq: number | null;
}

export interface VoteOption { readonly moveUci: string; readonly label: string }
export interface VoteWindow {
  readonly id: string;
  readonly sessionId: string;
  readonly nodeId: string;
  readonly prompt: string;
  readonly options: readonly VoteOption[];
  readonly opensAt: string;
  readonly closesAt: string;
  readonly state: "open" | "closed" | "stale";
  readonly appliedOptionUci: string | null;
}

export interface VoteTally {
  readonly window: VoteWindow;
  readonly tally: readonly (VoteOption & { readonly count: number })[];
  readonly total: number;
  readonly relayed: number;
}

export interface SessionInvitation {
  readonly id: string;
  readonly sessionId: string;
  readonly leg: 1 | 2 | null;
  readonly invitedHandle: string | null;
  readonly invitedRole: RunRole;
  readonly externalChallengeUrl: string | null;
  readonly state: "open" | "accepted" | "revoked";
  readonly createdAt: string;
}

export interface ArenaLeg {
  readonly sessionId: string;
  readonly leg: 1 | 2;
  readonly referencePlayerHandle: string | null;
  readonly externalChallengeUrl: string | null;
  readonly pgn: string | null;
  readonly result: "1-0" | "0-1" | "1/2-1/2" | "*" | null;
  readonly branchId: string | null;
  readonly importedAt: string | null;
}

export interface LiveSessionDetail {
  readonly session: LiveSession;
  readonly role: RunRole;
  readonly activeNodeId: string;
  readonly leaseHeldBy: { readonly learnerId: string; readonly handle: string };
  readonly voteAdapter?: LeaseIdentity;
  readonly grants: readonly import("./storage.js").RunGrant[];
  readonly proposals: readonly SessionProposal[];
  readonly vote?: VoteTally;
  readonly invitations: readonly SessionInvitation[];
  readonly legs: readonly ArenaLeg[];
  readonly match?: MatchState;
}

export interface MatchState {
  readonly sessionId: string;
  readonly whiteLearnerId: string | null;
  readonly blackLearnerId: string | null;
  readonly pausedAt: string | null;
  readonly pauseProposedBy: string | null;
}

export interface LiveBoardSummary {
  readonly activeFen: string;
  readonly sideToMove: "white" | "black";
  readonly plyCount: number;
  readonly pausedAt: string | null;
  readonly leaseHeldBy: { readonly learnerId: string; readonly handle: string };
  readonly lastMoveAt: string | null;
  readonly players?: {
    readonly white: { readonly learnerId: string; readonly handle: string } | null;
    readonly black: { readonly learnerId: string; readonly handle: string } | null;
  };
}

export interface LiveSessionSummary extends LiveSession {
  readonly board: LiveBoardSummary;
  readonly match?: MatchState;
}
