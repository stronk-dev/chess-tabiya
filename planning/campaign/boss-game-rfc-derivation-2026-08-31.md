# Act-II full-game boss — RFC derivation (2026-08-31)

This note derives the `campaign-boss-games` successor from already-landed research and owner
rulings. It is not a new chess-content claim and it does not authorize implementation.

## Gate and authority

- `rfc/learner-rating.md` §5.3a records the 2026-08-16 owner ruling: a campaign boss is a full
  game, not a pack. It is a `position` session, ends only on `terminalOutcome`, and only Act II is
  eligible for rating.
- `design/research/training-mode-variants.md` and `planning/campaign/rfc-derivation.md` close the
  encounter vocabulary at four verdict producers. The Act-II boss is the rules-terminal arm.
- [[D945]] rules earned rewinds/proactive branches into Campaign. R11 remains unchanged: using one
  voids rating, but does not prevent the campaign game from being completed or won.
- `rfc/campaign-core.md` Discharge D1 and its 1.0 closure map name this successor explicitly.
- `rfc/bot-policy.md` supplies exact immutable profile identity and exact-digest calibration.
  `rfc/learner-rating.md` currently admits the older measured `targetElo` rung. [[D962]] records
  their disjointness.

The exploration gate therefore exists. The remaining persona choice is not a research gap:
full 1.0 requires the boss to consume the richer bot foundation, so this draft proposes an exact
calibrated profile and refuses an uncalibrated personality label. The owner may veto that proposal
before acceptance without reopening the game/rating/campaign mechanics.

## Re-derived production seams

| Concern | Current authority | Boss consequence |
|---|---|---|
| Rules result | `packages/runtime/src/outcome.ts` and checked `outcome.reached` replay in `events.ts` | copy the terminal event; never adjudicate from eval, tablebase or authored objective |
| Rated admission | `RunService.createRatedGame` + `RatingStorage.createRatedRun` | factor a reusable server-owned admission; do not call the public route from Campaign |
| Rating void/seal | `RunService.#projectRatedGame` | rewind/fork voids rating; later terminal result remains a true campaign result |
| Campaign start | campaign-core's atomic encounter-start contract | boss start must create campaign event/pointer, play run and rated declaration together |
| Campaign finish | campaign-core `node_committed` transaction | add a typed terminal-game seal; never squeeze a rules result into `ObjectiveState` |
| Opponent | `RunOpponentPolicy` plus bot-policy's proposed exact `profile` reference | boss document names an exact catalog profile; admission joins its exact calibration receipt |
| Assistance | campaign inventory/ceiling and learner-rating R6/R11 | rated start keeps tools visible-but-dormant; explicit persisted Support choice voids rating before any module activates; play remains valid |
| Review | run origin + terminal event + evidence compiler | Review links to the same play run; it does not reconstruct a second game |
| Persistence | campaign core tables + rated tables | one transaction boundary on start and finish; no new duplicate game table |

## Why the public rated-game route cannot be composed naively

`RunService.createRatedGame` creates the run, run grant, rated declaration and initial rating in
one storage transaction. Campaign core separately requires play-run creation, `node_entered`,
campaign revision and `active_encounter_run_id` in one transaction. A route-to-route composition
would necessarily commit one aggregate first. Failure or response loss between them creates an
orphan. [[D2366]] records the class. The successor therefore owns one internal command and one
storage transaction for the combined start.

The same rule applies at completion. The immutable played-game fact is the `outcome.reached`
event. Rating eligibility is a projection over that fact; campaign progression is another
projection over it. A rewind may change the rating projection to `voided`, but it cannot erase or
rename the result. The boss commit stores both projections explicitly and atomically.

## Proposed profile ruling

Use an exact bot-profile reference whose digest has an admitted rating calibration receipt for
the declared time-control scope. The campaign document does not store a free-form Elo, persona
strength, or `targetElo`; the compiler resolves the receipt and stores its immutable rating
operands in the rated declaration. If the profile has no exact calibration, official publication
and boss start refuse. A community campaign may retain the encounter as an unrated full game only
when its document explicitly says `rating: "unrated"`; it may not display a strength number.

This is the high-integrity way to keep the personality work the owner asked for without laundering
the old band value through a named bot. Dropping the persona remains the smaller alternative, but
is not the proposed 1.0 contract.

## Shared-resource order

The campaign-schema register exists at head 1. The serialized order is:

1. campaign-core lane 2;
2. campaign-boss-games lane 3 (`boss_game` encounter arm and its authored operands);
3. training-mode-variants lane 4 (`prediction` and `survival`).

The older cross-draft pin and training-mode open question claiming no register are stale; [[D2365]]
owns their repair.

## Buildability falsifiers

The author contract must fail a draft that lacks any of these:

1. exact Act-II-only placement and Act-I/III pack controls;
2. full rules-terminal play, with no horizon/objective/checkpoint/adjudication field;
3. exact calibrated-profile identity and no `targetElo`/profile dual authority;
4. one atomic, idempotent combined start;
5. one atomic, idempotent terminal commit;
6. a rating disposition separate from the immutable game result;
7. earned rewind/fork keeps the campaign result but voids rating;
8. campaign progression on every played terminal result and prestige only on a learner win;
9. Review identity and save/reload/restart behavior;
10. browser states for briefing, in-game, rated-to-void transition, terminal result and return map;
11. account export/delete/restore and active-run deletion behavior;
12. exact schema/register order and predecessor gates.

The author pass added a thirteenth falsifier after re-reading the shipped route behavior: a clean
rated boss must refuse direct assistance, while one explicit idempotent Support choice must void
rating before browser/server modules activate. [[D2367]] owns that bridge.
