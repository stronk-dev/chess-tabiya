# Enforced clocks — fresh independent buildability review

- **Reviewed:** 2026-08-30
- **Input:** `rfc/enforced-clocks.md`, current run terminal consumers, native-match pause
  persistence, the returned clock/social/bot/campaign contracts, chessops 0.15.1 and FIDE Laws 6.9
- **Verdict:** **RETURN TO AUTHOR**
- **Reproduction:** `make enforced-clocks-fresh-review` — 12/12 checks green
- **Production status:** no timed-control domain, authoritative clock state, expiry operation,
  flag event, clock API or learner clock surface ships

The real-clock direction remains required by [[D1041]]. This document cannot implement it. Its
amendment leaves opposite rating policies in force, its expiry requires a request that an abandoned
game may never make, and its new terminal event is not joined to the consumers that decide whether
a run may mutate, rate, render Review/Story or award progress.

## B1 — the amended document still has opposite rating contracts ([[D2296]])

§4 and criterion 6 say timed games rate. The summary, §3.4, criterion 5 and refusal R4 still say
timed games are unrated and that no v1 path writes the new terminal reasons. An implementer cannot
satisfy both. Apply [[D1292]] to every normative clause, then make the storage, seal and label
criteria agree on the exact rated record.

## B2 — “next authoritative read” does not end an abandoned game ([[D2297]])

The RFC's strongest claim is that clocks remove abandon-when-losing bias, but criterion 2 emits a
flag only on the next authoritative read. A learner who never returns causes no read and therefore
no result. Specify a durable deadline and an autonomous expiry worker/sweeper with retry and restart
behavior, or narrow the claim honestly. Client ticking is not a substitute.

## B3 — expiry and move commit have no atomic boundary ([[D2298]])

`ClockFlaggedEvent` carries no deadline/control/command identity or expected run sequence. The RFC
does not define `now == deadline`, whether increment is applied before or after the comparison, or
which transaction wins when a move and expiry race. Define one idempotent terminal command using
server time and compare-and-swap/transaction semantics; fixture move-before, move-at and move-after
the boundary plus worker retry.

## B4 — adding an event does not make every consumer terminal-aware ([[D2299]])

Current runtime, assistance, feedback, Compare, Story, progress, rating, service and web paths ask
for `outcome.reached`. None recognizes `clock.flagged`. “The reducer seals” therefore leaves legal
paths that can keep mutating or omit the result. Introduce one shared run/game termination authority
and migrate a set-equal consumer census: mutation guards, opponent selection, assistance, feedback,
Review, Story, progress, rating, campaign, live-session and client navigation.

## B5 — a native match cannot store a learner-relative result ([[D2300]])

`ClockFlaggedEvent.result` is `RunOutcome`, whose `terminalOutcome` value is relative to the run's
single `learnerSide`. A native game has White and Black learners. Store the color-relative game fact
(`winner: white | black | draw`, plus reason/flagged side) and derive each learner's win/loss view by
seat. This depends on the returned social-play identity/result repair; it cannot be solved locally by
choosing one run side.

## B6 — FIDE 6.9 is wider than the two proposed fixtures ([[D2301]])

FIDE 6.9 says the game is drawn when the opponent cannot checkmate by **any possible series of legal
moves**, not merely when a material shortcut says “insufficient.” [V: FIDE Laws of Chess,
Article 6.9](https://handbook.fide.com/chapter/E012023). The RFC names a helper that chessops does not
export; the installed library exposes `hasInsufficientMaterial(color)`. Queen-versus-king and
king-versus-king cannot distinguish an exact implementation from a naive heuristic. Bind the actual
library semantic and add able-to-fail edge fixtures before this becomes a rated result rule.

## B7 — pause/resume discards the clock basis ([[D2302]])

The RFC reuses native match pause “unchanged.” Current storage records `paused_at`, then clears it on
resume; no accumulated pause, deadline, remaining time or run clock event survives. A node-only
reading cannot subtract a pause that occurs without a move. Choose one durable authority—run clock
events or an explicitly joined session-clock record—and include pause/resume in its transaction,
replay, export, deletion and restore contract. Specify solo pause separately.

## B8 — the clock state machine is not specified ([[D2303]])

`TimedControl` names two numbers and a node receives one `ClockReading`, but the RFC never defines
the root state, how both sides' latest values are derived, which side runs, increment ordering,
deadline arithmetic, restart recovery, or fork/re-entry semantics. Publish the reducer equations
and a closed state/result type before claiming pure projection.

## B9 — the ruled bot consequence is cut out of the “full arm” ([[D2304]])

[[D1041]] explicitly requires bot move-time models as a consequence of real clocks wherever a game
is played. §6 runs only the learner clock and defers every bot clock. That may be an honest interim
state, but it is not the ruled 1.0 arm and cannot close [[D1041]]. The bot lane needs researched,
grounded move-time behavior that preserves replay through recorded sampled outcomes; fake random
delay and machine-dependent `movetime` remain refused.

## B10 — the dependency image is stale ([[D2305]])

The RFC consumes `recorded-clocks`, campaign and bot contracts that current independent reviews have
returned. Its native result also depends on returned social-play, and its hint clamp depends on
returned intent presets. Refresh the dependency graph and block implementation on accepted exact
types rather than prose names. Retain provisional resource claims without advertising them as free
to build.

## B11 — unresolved product semantics still change the state machine ([[D2306]])

The RFC says “Ready for review” while asking whether timed drills fail, how solo pause works, and
whether a campaign flag loses the encounter or still grants rewards. These decide terminal events,
commands and reward projection, not copy. They require owner/intent rulings before acceptance; the
implementation must not invent them.

## B12 — the learner journey is reduced to paint containment ([[D2307]])

Criterion 10 only proves a tick repaints one fixed box. There is no named server operation, wire,
client controller, reconnect/resync path, tab/background behavior, screen-reader announcement
policy, flag result surface, or browser journey across Just Play, match and campaign. A fixed-size
companion seat is necessary but not sufficient. The repaired RFC must consume the accepted
composition/preset contract and test the full create → play → pause/reconnect → flag/finish → Review
journey without shrinking or reflowing the board.

## Repair order

1. Repair and accept the recorded-clock/time-control domain and social color/result authority.
2. Resolve timed-drill, solo-pause and campaign reward semantics at the intent tier.
3. Specify the durable two-sided clock reducer, deadline worker and atomic terminal command.
4. Replace per-consumer terminal checks with one shared authority and a set-equal census.
5. Rebuild bot timing as recorded grounded behavior, then specify the complete typed client journey.
6. Reconcile every rating/refusal clause and repeat independent review.

No implementation is authorized by this return.
