import type { LiveWorkflow } from "./live-creation.js";

// ux-live-and-social.md §9: a surface a user is offered states what it is, who can see it, what
// they see, what is recorded, and what it refuses — before it is entered and again while it runs.
// The fifth answer renders at the same weight as the other four. The contract never speaks about the
// board: no answer may name a piece, a square, or a specific move.
//
// Academy has no entry on purpose: ux-live-and-social.md §9 finds no honest answer 1 for it, and
// whether Academy gains an identity or is withdrawn is an owner decision (LIV-b8).

export interface LivePreamble {
  readonly what: string;
  readonly whoCanSee: string;
  readonly whatTheySee: string;
  readonly recorded: string;
  readonly refuses: string;
}

export const LIVE_PREAMBLE_QUESTIONS: Readonly<Record<keyof LivePreamble, string>> = Object.freeze({
  what: "What this is",
  whoCanSee: "Who can see it",
  whatTheySee: "What they see",
  recorded: "What is recorded",
  refuses: "What it does not do",
});

export const LIVE_PREAMBLE_ORDER: readonly (keyof LivePreamble)[] = Object.freeze(["what", "whoCanSee", "whatTheySee", "recorded", "refuses"]);

export const LIVE_PREAMBLES: Readonly<Record<Exclude<LiveWorkflow, "academy">, LivePreamble>> = Object.freeze({
  stream: Object.freeze({
    what: "You host one rehearsal board; people you invite watch it live, and you get a chrome-free page to capture in OBS.",
    whoCanSee: "Only people you grant access or send a watch link, and each of them signs in with their own Tabiya account.",
    whatTheySee: "The board, its objective, how many attempts you have kept, marks with their author's name, and any vote you open — never your private evidence panels or controls.",
    recorded: "The run, permanently and replayably. Separately, the session history: who joined, who held the board, proposals, and votes.",
    refuses: "No Twitch or YouTube connection, no chat, no board delay — viewers see each move as you commit it — and no anonymous viewers.",
  }),
  native_match: Object.freeze({
    what: "Two signed-in players alternate on one fresh position here. Either may propose a pause to rehearse; the played game stays intact.",
    whoCanSee: "The two seated players, plus anyone you grant access or send a watch link. Everyone signs in with their own account.",
    whatTheySee: "The shared board and the played game. Evidence and rehearsal tools stay closed while the game is live and open only during an agreed pause.",
    recorded: "The played game as one run, permanently. Separately, the session history: seats, pause proposals, and resumptions.",
    refuses: "No clocks, no ratings, no resignation or agreed-draw record, no matchmaking, and no fair-play enforcement.",
  }),
  position_arena: Object.freeze({
    what: "The same starting position is played elsewhere, once with each colour; each game is then pasted here as a leg so the two can be compared.",
    whoCanSee: "You and the players you invite, plus anyone you grant access or send a watch link. Everyone signs in with their own account.",
    whatTheySee: "The shared starting position, each imported leg as its own branch, and the comparison between them.",
    recorded: "Both imported games inside one run, permanently. Separately, the session history: invitations and each leg's import.",
    refuses: "Games are not played or timed here, Tabiya cannot confirm a pasted game was played as claimed, and there are no ratings and no chat.",
  }),
});

export function livePreamble(workflow: LiveWorkflow): LivePreamble | undefined {
  return workflow === "academy" ? undefined : LIVE_PREAMBLES[workflow];
}
