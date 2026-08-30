# Social play — fresh independent buildability review

- **Reviewed:** 2026-08-30
- **Input:** `rfc/social-play.md`, rebuilt on native-first ruling [[D1414]]
- **Verdict:** **RETURN TO AUTHOR / NOT ACCEPTED**
- **Reproduction:** `make social-play-fresh-review` — 8/8 findings
- **Production status:** shipped private-match primitives remain; no social-play schema, migration,
  route or surface expansion is authorized

The rebuild correctly keeps native play independent of a provider, separates requested from
accepted terms, models resignation/draw outside board-terminal events and preserves imported-game
identity. It does not yet define one complete two-learner game. The deepest issue is not
matchmaking: it is that the run and all downstream learning projections have one learner side.

## B1 — progress and Review have one side for two learners ([[D2253]])

`RunSession.start.side` is singular. `#matchMoveOptions` records a committed node as `actor: "user"`
only when its mover equals that side; the other player's moves become `system`.
`projectAttempts` then counts only `actor === "user"`, uses one branch result and accepts an arbitrary
`learnerId` without a side operand. Calling it for Black does not turn Black's moves into learner
moves; it can credit White's plies to Black and carry White-relative results into `/learn`, Review,
Story, style and skills.

Keep one factual board/event record, but introduce a participant projection keyed by exact seated
side. Actor, result, move counts, Review orientation, longitudinal observations and the future two
rating rows must all derive through it. Cross both colors, a side swap, a third-party coach and a
deleted seat.

## B2 — naming a learner is treated as consent ([[D2254]])

Current creation resolves the two submitted handles and inserts them directly into `match_states`,
also granting run access. The RFC says accepted terms are written when the named learner redeems the
invitation and takes the seat. Those cannot both be true: a host can currently enroll another
account in a match without that person's act.

Creation may seat the creator and reserve/invite the other side. Only an authenticated redemption
whose learner matches the reservation may grant the seat and write accepted terms. Cross rejected,
revoked, already-seated and changed-terms cases.

## B3 — link acceptance has no informed preview ([[D2255]])

The public join preview returns only `{title, hostHandle}`. Requested terms are not shown, and the
terms object itself omits the exact start position. A learner can therefore accept a clocked/rated
or arbitrary-position game without seeing what is being accepted.

Publish a safe unauthenticated preview carrying normalized requested clock/rated/colour,
`rules + setupFamily`, exact starting-position digest and expiry. Redemption must record exactly the
previewed bytes or fail stale; it must not expose the live board before authentication/acceptance.

## B4 — agreed draw has no proposal producer ([[D2256]])

The RFC says a one-sided draw is a session-journal proposal, but its complete journal vocabulary
contains no draw kind and the API contract names no offer, withdraw, decline or accept operation.
Only the final `draw.agreed` event is typed. That proves a terminal record, not mutual agreement.

Define one closed proposal state machine, side/turn permissions, route/result/error union and the
transaction that consumes an accepted proposal exactly once into `draw.agreed`.

## B5 — terminal game and terminal session can disagree ([[D2257]])

Rules-terminal moves, `game.resigned`, `draw.agreed`, `clock.flagged` and the host's existing
`session.closed` are separate writes. The RFC does not name one operation that stops a clock,
settles the run, closes or finishes the live session, revokes remaining invitations/mutations,
projects both participant results/ratings and opens Review. A host can close a live match while the
run remains non-terminal; a terminal run can leave the session open.

Add an idempotent terminal coordinator with fault injection at every boundary. Manual close before
a result needs an explicit abort/cancel outcome and rating policy, not another ambiguous terminal
flag.

## B6 — rematch is required and undecided ([[D2258]])

The 1.0 exit says two humans finish, rematch and reach Review. Open question 3 still leaves rematch as
new Arena legs, a new run in the same session or a new session. These choices change accepted terms,
ratings, history, invites and Review identity. An unresolved required verb blocks acceptance.

Rule the exact shape. The document's recommendation—new session linked to the previous one—is the
cleanest starting point; changing terms must require a fresh explicit acceptance.

## B7 — coaching pause and authoritative clock do not compose ([[D2259]])

The native path requires clocked games and keeps pause-by-consent so players can rehearse. No text
states whether the clock stops, which authoritative reading is persisted, whether both clocks stop,
how resume restarts or whether a simultaneous flag beats pause acceptance. Delegating “clocks” to
`enforced-clocks` without handing it the pause operation leaves both RFCs apparently complete and
the seam unowned.

Specify the atomic pause/clock transaction and stale/race behavior in one owner document, then make
the browser show the persisted reading rather than a client timer guess.

## B8 — accepted terms erase the chess subject ([[D2260]])

`terms.variant` is a free string. The ruled variants boundary requires `rules + setupFamily`, and
the same FEN may be Standard-from-position or Chess960. Terms also omit exact start identity even
though native matches can begin from arbitrary positions. A provider and native game can therefore
display identical terms while requiring different legal moves, engine/provider capability and
Review semantics.

Consume the shared rules/setup/start authority after the variants contract survives review. Do not
copy an enum or infer rules from FEN.

## Owner decision retained, not guessed

[[D1567]] / Open question 1 remains: whether 1.0 includes a public opponent pool. The owner's
“there is no chat” observation narrows the cost but does not settle it. Research must separately
price queue cancellation, abort/stall policy, avoid/block, handle abuse, rate limits,
multi-account/cheating response and the minimal operator-evidence path. The result may be much
smaller than a social-network moderation suite; zero controls is not established.

## Repair order

1. Add the participant-perspective projection and use it in progress/Review/longitudinal/rating
   contracts.
2. Close consent/preview, draw and terminal lifecycle protocols.
3. Compose pause with clocks and terms with the shared rules identity.
4. Rule rematch; execute the two-device finish→Review→rematch journey.
5. Resolve [[D1567]] from measured public-pool costs, then amend protected intent if public wins.

No implementation is authorized by this return.
