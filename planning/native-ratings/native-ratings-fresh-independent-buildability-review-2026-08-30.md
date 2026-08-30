# Native ratings — fresh independent buildability review

- **Reviewed:** 2026-08-30
- **Input:** `rfc/native-ratings.md`, current rating/match/attempt storage and operations, returned
  social/clock/bot contracts, account lifecycle, and the official Glicko-2 description
- **Verdict:** **RETURN TO AUTHOR**
- **Reproduction:** `make native-ratings-fresh-review` — 16/16 checks green
- **Production status:** learner-versus-bot ratings ship; the proposed shared game, side, contest and
  two-learner rating substrate does not

The document finds the right foundational shape: a game result is color-oriented and each
participant score is a projection. It is not buildable yet. Its only result writer reverses the
winner for resignations and flags; its SQL permits contradictory lifecycle/rating/participant
records; and it creates overlapping seat authorities without proving they agree. The proposed
migration also breaks existing attempt consumers and does not specify the API/client journey that
would make the new substrate a product.

## B1 — resignation and flag record the losing side as the winner ([[D2308]])

§2 defines `games.result` as the winning color. §3.3 then requires the declared color to equal
`resignedBy` or the flagged side. Those are the losing colors. Agreement has no winning color at
all. Repair `declareResult` around one accepted terminal authority that returns color-relative
winner/draw plus cause and actor; fixture checkmate, resignation, agreement and both flag arms from
both learner perspectives.

## B2 — rating refusal erases the game fact ([[D2309]])

The general `games` table intentionally records unrated native matches, but a rewind, fork,
assistance use, engine change or one unrateable side changes the whole game to `voided`. A played
game and its result remain true when rating admission is refused. Separate immutable game lifecycle
and declared result from rating disposition/reason, with rating refusal projected per game/side as
the accepted rating policy requires.

## B3 — the lifecycle CHECK admits contradictory records ([[D2310]])

The proposed SQL accepts an `open` or `sealed` game with `void_reason`, and a `voided` game with a
winner, terminal cause, ply count and seal timestamp. Replace independent nullable columns with an
exhaustive state invariant or state-specific records. The executable review inserts all three
contradictions successfully today.

## B4 — rating has two authorities and bots may be rated ([[D2311]])

`games.rated` and `game_sides.rated` can disagree, and the side CHECK admits a rated bot even though
the writer says only learners receive rating results. Choose one authority and derive the other
view. Encode exact eligible participant kinds in SQL/types and fixture every cross-table mismatch.

## B5 — eager learner seats violate accepted invitation semantics ([[D2312]])

Current native-match creation permits one named learner, and returned `social-play.md` correctly
says supplying a handle reserves/invites but does not grant a seat before acceptance. §4.3 instead
creates two learner `encounter_seats` immediately. Model open/reserved/accepted seats explicitly and
freeze both participants plus rating snapshots atomically when the game starts.

## B6 — self-play is admitted ([[D2313]])

Neither `game_sides` SQL nor current join-token redemption prevents the same learner occupying both
colors. Enforce distinct learner identities in the transactional seating/start operation and in a
database-level invariant or semantic validator that cannot be bypassed by another writer.

## B7 — participant and encounter identities can disagree ([[D2314]])

`encounter_seats` and `game_sides` independently state who played, with no binding between seat and
color. `encounter_games` also lacks `UNIQUE(game_id)`, so one game can occupy two encounters. Define
one participant authority, the color/seat mapping including rematches, and cardinality constraints;
derive all projections from it.

## B8 — account deletion destroys another learner's shared history ([[D2315]])

`game_sides.learner_id ON DELETE CASCADE` removes a participant from the opponent's game;
`contests.opened_by_learner_id ON DELETE CASCADE` removes the contest. That contradicts the claimed
tombstone lifecycle. Specify participant tombstones, shared-record retention and account export
views. Opponent rating/RD/volatility snapshots must not leak through a naive learner export.

## B9 — the attempt-key widening does not migrate its consumers ([[D2316]])

Current attempt numbering updates by `(run_id, branch_id)` and current concept/export joins omit
`learner_id`. After the proposed PK widening, one learner's update can overwrite both rows. Repointing
`attempt_concepts` only to `drill_runs(id)` also stops the FK validating a branch. Provide a
set-equal query/consumer census and preserve exact `(run, branch, learner)` integrity in every read,
write, export and deletion path.

## B10 — a rating pool has no complete subject identity ([[D2317]])

The game omits `rules`, `setupFamily` and time-control identity, while the side omits calibration
identity. Returned social/time-control contracts require those axes, and two humans calibrated on
different model versions are otherwise silently compared. Define the exact rating-pool subject and
compatibility/refusal rules before migrating history.

## B11 — the native-match backfill produces empty aggregates ([[D2318]])

The migration creates contests for existing native matches and links a game only “if one exists.”
Existing native matches are unrated and have no `rated_games` row, while no step creates a general
game or defines its id. Specify deterministic ids, create the actual native game/side facts, and
fixture interruption/retry and mixed-version databases.

## B12 — no typed product journey consumes the new records ([[D2319]])

The document retains `POST /rated-games` but specifies no game/contest query, wire types, parser,
client store, match result/history view, rating-delta presentation or browser journey. A schema is
not a native-rating feature. Prove invite/accept → start → play → terminal result → both rating
updates → rematch/history, including unrated/refused and reconnect arms.

## B13 — the tournament fixture proves permissive inserts, not readiness ([[D2320]])

No contest entrant/registration authority exists. The acceptance fixture inserts arbitrary rows and
reads a crosstable, so it cannot prove entrant uniqueness, pairing validity, colors, byes, round
completion, standings or result consistency. Architecture readiness needs a semantic round trip and
able-to-fail negative fixtures, even while the tournament feature remains deferred.

## B14 — the core-loop question is routed to the wrong owner ([[D2321]])

Open question 1 routes rated-game review/rewind semantics to D7, whose actual obligation is future
crosstable rank/seed/tiebreak. Rematch semantics also remain unresolved and directly change contest
ordinal/color mapping. Route the core-loop question to Review/rating intent and resolve the rematch
contract before acceptance.

## B15 — every terminal/social dependency is returned ([[D2322]])

`social-play`, `enforced-clocks` and `bot-policy` are all returned by current independent reviews.
This draft consumes their seat, result, terminal and bot identities as though accepted. Refresh the
dependency image, retain resource claims only provisionally, and do not implement against prose
whose exact types are under repair.

## B16 — the closed-human-pool publication rule is unmeasured ([[D2323]])

The RFC asserts that a human-only pool can drift together indefinitely and then chooses to suppress
the point estimate at zero calibrated-bot fraction. The official Glicko-2 description defines
pre-period ratings/RDs and update arithmetic, but it does not establish this product threshold or
publication policy. [V: Mark Glickman, *Example of the Glicko-2 system*](https://www.glicko.net/glicko/glicko2.pdf).
Run a committed closed/mixed-pool simulation across arrival/order/connectivity arms, then either pin
a measured disclosure/suppression rule or state the limitation without inventing a threshold.

## Repair order

1. Accept the social seat/result and enforced-terminal authorities, including rematch semantics.
2. Separate game truth, terminal state and rating disposition; define the complete subject identity.
3. Specify one transactional participant/start/result authority and lifecycle-safe SQL.
4. Rework migration, account lifecycle and every attempt/game consumer with set-equal censuses.
5. Measure the closed/mixed human rating pool and settle publication semantics.
6. Specify and fixture the complete typed native-match/rating journey, then repeat independent review.

No implementation is authorized by this return.
