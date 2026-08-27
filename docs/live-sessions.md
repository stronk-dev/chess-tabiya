# Live sessions

Live-session detail may carry attributed board marks for the active position. A mark is relayed only when its author held the board lease at write time and the session is not a match; otherwise it remains visible only to its author. Relayed marks are shared rather than viewer-specific, capped at 128 per poll, and never widen the assistance ceiling. See `docs/board-annotation.md`.

Tabiya can place a shared session around one existing run. The run remains the sole
source of chess truth and deterministic replay; the session records people, possession,
proposals, votes, invitations, and imported match legs. Closing session state cannot
change how the run replays.

## Roles and board possession

The existing per-run roles remain `host`, `participant`, and `spectator`. Hosts and
participants may write a run when they hold its single learner-and-device lease;
spectators are read-only. Above that lease, a live session chooses one board policy:

- `free_claim`: any write-capable grantee may claim the board;
- `host_directed`: the host may claim at any time, while a participant needs an open
  handoff from the host; or
- `rotation`: only the learner at the current rotation cursor may claim; or
- `match`: while live, only the learner seated for the position's side to move may
  claim; while paused, any write-capable grantee may claim for rehearsal.

A session-less run derives the same policy: one write-capable learner means
`free_claim`; multiple means `host_directed`. Claims execute in one SQLite transaction
with a current-holder witness. A stale claim returns `LEASE_MOVED`; an unauthorized
takeover returns `BOARD_HELD`.

Every successful possession change appends `board.granted` to a per-session journal in
the transaction that moves the lease. For a committed run event at sequence `S`, the
author is the holder named by the last board grant whose run-sequence anchor is strictly
less than `S`. Plies predating the session belong to the run owner. Imported Arena plies
are attributed by their leg record instead, because the importer is not necessarily the
player.

## Native human matches

A native match is one untouched position run with a `match` session and two learner
seats. The host may occupy a seat, coach without playing, or leave one seat open for a
friend link. The server derives each move's runtime actor from the seated learner and
the run's reference side; clients cannot label an actor or submit an engine selection.
Every turn remains attributable through the possession journal.

Possession follows the FEN's side to move. After one learner commits, their browser
becomes a follower; the other browser observes the event and claims automatically when
its learner owns the new turn. A coach and the wrong-side player receive `BOARD_HELD`.
Native matches have no clocks, ratings, matchmaking pool, resignation event, or agreed-
draw event.

Live play is mainline-only. Rewind, fork, reveal, group/simulation mutations, duplicate,
and opposite-side replay return `MATCH_LIVE`. Either player may propose a pause and only
the other may accept; a non-playing host may pause for coaching. A pause is consent to
use the ordinary rehearsal loop: a write-capable member may claim, rewind, fork, compare,
and reveal. The mainline tip remains locked. Resume rewinds the cursor to the preserved
mainline tip without deleting rehearsal branches and restores side-to-move possession.
The next live commit closes the staged-evidence delivery window again.

The mainline stays in history but is not a countable solo attempt. Rehearsal branches
remain ordinary attempts belonging to the learner who created them.

## Proposals and voting

Hosts and participants can propose a legal move at a run node. A proposal is session
state, not a run event. Only a host applies it through the ordinary leased run mutation;
the proposal then records the resulting run sequence. Leaving the node makes unresolved
proposals stale. The session studio names the proposing handle. An open proposal gives
the host explicit **Play proposal** and **Decline** actions; playing first acquires the
ordinary run lease and therefore does not bypass board possession.

A host may open one 15–600 second vote window over two to eight legal moves. Votes are
advisory: a tally never moves a piece. The host may separately play or apply a move and
record what was applied. The browser exposes the complete two-to-eight range, separate
host-authored labels and prompt, and the full duration range. This keeps run replay independent
of social state.

Ordinary votes use a server-derived `learner:<id>` key. A configured chat-adapter
account may relay external keys, which the server stores in a disjoint
`chat:<adapter-id>:<key>` namespace. Other learners cannot supply a key. Keys are bounded
to 128 characters and each window accepts at most 50,000 distinct relayed voters;
recasts from an existing key remain possible at the cap. The tally is only as trustworthy
as the adapter that submitted it. Session and overlay tallies therefore state how many votes
were relayed, name the configured adapter when it still resolves, and say explicitly that
Tabiya cannot verify chat identities. Member-only tallies are labelled as such.

## Position Arena

A match session owns two legs around one position run. Each PGN must contain exactly one
mainline-only game, start at the run's canonical root FEN, remain legal, and stay below
300 plies. Validation happens before persistence. Leg one uses the initial root branch;
leg two forks at that same root, so the normal comparison surface can compare them.

Reference-side plies retain runtime actor `user`; the other human's imported plies use
`system`. No `opponent.move_selected` event or engine identity is fabricated. The leg
record carries the human handle and original PGN. The run snapshot, leg record, and
journal entry commit atomically.

## HTTP and browser surfaces

`/sessions` lists and creates sessions. Each summary includes the active FEN, recorded
objective state, side to move, mainline ply count, pause state, lease holder,
last-move time, and match players, allowing the `/live` simul wall to poll all granted
boards in one request. The wall resolves the side to the seated handle when one exists,
states pause and last-move times, and presents the objective state. These are factual
triage signals; the wall neither computes an evaluation nor sorts or labels a learner by
one. Nested routes
expose session detail, the journal, board handoff, match pause operations, friend links,
proposals, vote windows, invitations, and Arena leg imports. All use the
existing authenticated cookie and per-run grants; an ungranted caller receives the same
not-found response as an unknown run.

The browser provides `/live`, `/live/session/:sessionId`, and the chrome-free
`/live/overlay/:runId`. The ordinary drill adds a small session rail when its run belongs
to a live session. Session and overlay tallies poll every two seconds. The overlay uses
the same run projection and feedback barrier as the player; it is not a second evidence
surface. It always resumes through a projection-only controller: a writer lease saved in the
same browser is ignored, no opponent selection is requested, and the overlay cannot commit a
ply. Grant-scoped session detail also projects move authorship from the run and
possession journal; the session screen labels each committed move with the responsible
member handle, or `former member` when that identity no longer resolves through the
current grants.

When public event delivery stops at an undisclosed engine-evidence barrier, the event
page returns `withheld: true`. Followers render that fact instead of appearing frozen.

## Friend links

Public story cards and session invitations share one `public_tokens` table and one
`/shared/:token` namespace. Only a SHA-256 token hash is persisted. A story token is
read-only; a `session_join` token is an invitation to authenticate as oneself, not a run
write credential. It may grant participant or spectator access and may bind a participant
to one open White or Black match seat. A spectator token cannot carry a match seat.

The anonymous join page renders only the session title, host handle, and sign-in/register
form—never a FEN, move, or evidence—and is `no-store`. Redemption, grant, optional
seating, usage decrement, and `member.joined` journal entry commit atomically. Links
default to one use and 14 days, cap at 90 days and 50 active links per session, can be
handle-bound, and are individually revocable. Unknown, wrong-scope, expired, exhausted,
revoked, and wrong-handle tokens all return the same not-found response.

## Accepted limitation

A streamer cannot be forced to play blind while their audience sees more evidence: the
streamer can grant and use a second spectator account. Tabiya therefore gives player and
spectator the same viewer-blind run projection. Assistance is a separate rail: it caps a
seated participant or non-reviewing spectator during live play, never raises the run's
disclosure ceiling, and never exceeds what the run itself has disclosed. A
submission-granted teacher may receive the host ceiling only after an outcome and after
the live session closes. It protects every reader from premature evidence; it does not
pretend to prevent a host from cheating on themselves.

The live platform uses authenticated polling rather than WebSockets or SSE. External
challenge URLs remain opaque HTTPS links supplied by the host; native clocks,
matchmaking, and provider-specific challenge APIs do not ship.

SQLite migration 9 adds the original live-session tables. Migration 14 rebuilds the
closed session/journal/token vocabularies and adds `match_states`; it disables foreign
keys before its transaction and verifies `foreign_key_check` before commit. The run
schema remains v0.17 and pack schema remains v0.27. Migration 24 adds the nullable
`classroom_id` association used by scheduled classroom sessions; see `docs/classrooms.md`.
