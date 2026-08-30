# RFC: Enforced clocks — the real-clock arm of the time-control lane

- **Status:** draft — **RETURNED by fresh independent buildability review 2026-08-30 on [[D2296]]–[[D2307]].** The real-clock direction and per-context hint ceiling survive. The document still contains opposite timed-rating rules; next-read expiry cannot close a game that is never read again; flag/move races have no atomic boundary; `clock.flagged` is absent from the terminal consumer set; its learner-relative result cannot represent both native-match seats; pause/resume discards the clock basis; the two-sided reducer, bot timing and complete learner journey are unspecified; and state-changing owner questions remain open. `make enforced-clocks-fresh-review` passes 12/12. No implementation before predecessor/intent repair, author repair and another review
- **Author:** claude
- **Created:** 2026-08-23
- **Design refs:** `design/05-in-run-experience.md` §invariants (*"Rewind is an experiment, not an undo"*, *"The run is the sole source of chess truth"*); `design/03-product-breadth.md` §Play
- **Exploration gate:** [[D1093]] (the drafting mandate) plus [[D1041]]'s lane ruling, which chose **both** arms — *"the full feature, chosen over the narrower simulated-only recommendation"*
- **Depends on:** `rfc/recorded-clocks.md` (draft — this RFC consumes its `ClockReading` type, its `timeControl` serialisation and its vocabulary pins, and re-specifies none of them); `rfc/learner-rating.md` (implementing — the `terminal_reason` CHECK and §11.3's abandonment bias); `rfc/campaign-core.md` (implementing — §2.5's non-convertibility)
- **Parent / amends:** the successor `rfc/recorded-clocks.md` Discharge D1 names. Its absence was logged as a [[D1230]] scope-cut instance; this document closes that
- **Supersedes / superseded by:** —
- **Planning:** `planning/time-controls/`

```tabiya-claims
run-schema | lane 0.21 | ClockReading.source gains "played"; DrillRunEvent gains ClockFlaggedEvent; RunSession gains an optional TimedControl
migration | position behind live-following | rated_games.terminal_reason CHECK gains 'flagged' and 'flagged_insufficient_material' (literal CHECK on a STRICT table, rebuild)
```

## Summary

This RFC ships **a real, server-authoritative clock that can end a game**, for the surfaces where a
game is played. It is the arm [[D1041]] ruled in and `recorded-clocks` deferred whole.

Its central finding is structural and was not in the derivation: **flag-fall cannot be expressed as
a fifth `terminal_reason` on the existing terminal event, because the reducer bars it twice over.**
`outcome.reached` must *immediately follow its `move.committed`* (`packages/runtime/src/events.ts:330-333`)
— and a flag falls when **no move is made** — and the reducer then re-derives `terminalOutcome` and
throws *"references a non-terminal node"* when it returns `undefined` (`:344-345`). A flagged board
is not terminal by the rules of chess. So flag-fall is a **new event**, not a new reason on an old
one, and §3 specifies it as one.

Everything else follows from three refusals held in writing: **a rewind never costs time** (§5),
**the bot has no clock** (§6), and **timed games are unrated in v1** (§4) — the last on a measured
blocker, not a preference.

## Motivation

The owner ruled both arms and chose the full feature explicitly:

> **[[D1041]]** — *"time controls ship BOTH ways — simulated pressure in drills AND real clocks in
> play … (b) **real clocks wherever a game is played** — Just Play, matches, campaign encounters."*

`recorded-clocks` ships the depicted and measured arms and defers **all** of arm (b) to *"the
successor RFC"* — a document that did not exist, which the scope audit counted as one of the
[[D1230]] instances. This is that document, and per [[D1230]] it prices the whole arm: server
authority, flag-fall, the control vocabulary, and every seam into the five accepted contracts arm
(b) touches. Where something defers, the blocker is named and cited and the remainder has an owner.

There is also a reason to want this beyond the ruling, and it is the strongest single argument in
the lane. `learner-rating` §11.3 (`:1691-1696`) names a bias it cannot remove:

> **There is no resignation.** `terminalOutcome` has no resign path, so a learner who abandons a
> losing rated game produces no result and no rating movement. Selection is therefore real:
> abandon-when-losing inflates the rating, and **nothing in Glicko-2 detects it.**

Three responses were available and each was refused — adjudicating abandonment needs intent
inference, a resignation event is a run-schema change the RFC declined, and making the bias visible
only labels it. **A clock is a fourth: walking away from a losing position flags, which is a real
result requiring no inference about anything.** It is the one response that removes the bias rather
than disclosing it. Its precondition is exact and is why §2 insists on server authority: the clock
must run **while the learner is absent**, or it converts nothing.

## Specification

### §1 — What this RFC adds to `recorded-clocks`' vocabulary

`recorded-clocks` §1 pins `timeControl`, `ClockReading` and reserves **`flag`** for expiry, *"named
here only so the successor cannot pick a fourth word for it."* This RFC uses that word and adds two
nouns:

- **`TimedControl`** — a declared control attached to a run at creation:
  `{ initialMs: number; incrementMs: number }`, serialised canonically as `"initial+increment"` in
  seconds (`"600+0"`), the same string `bot-policy`'s `calibration.timeControl`
  (`apps/server/src/bot-policy-catalog.ts:112-116`) already declares. One serialisation, two
  consumers, agreeing by construction.
- **`ClockFlaggedEvent`** — the terminal event §3 introduces.

`ClockReading.source` gains **`"played"`** beside `recorded-clocks`' `"recorded"`. That RFC closed
the union at one member *"so the real-clock successor adds a member rather than widening an untyped
field twice"* — this is that addition, and it is why the run-schema lane below is claimed rather
than borrowed.

**Criterion 1** asserts `recorded-clocks`' three vocabulary pins (`clock_zeroed`,
`timingWindows`/`luxuryMoveBudget`, `TempoVerdict`) remain byte-unchanged, and that `ClockReading`
gains exactly one union member. *Wrong impl that would pass without it: one that re-opens
`clockState` to an untyped object rather than extending the closed union.*

### §2 — Server authority, because a clock the client owns is not a clock

#### §2.1 The problem, measured

The move-commit path accepts a client-supplied timestamp and stores it as truth:
`runtime.ts:296` is `const at = timestamp(options.at)`, with `at` arriving from the request body
(`apps/server/src/rest.ts:568`). `recorded-clocks` §6 already bounds its *measured* arm on exactly
this ground and makes it informational-only. **A clock that ends games cannot take that bound**; it
must be authoritative or it is decoration that occasionally deletes someone's game.

#### §2.2 Three rules

1. **Decrement from a server-read wall clock at commit**, never from the client `at`.
2. **A timed run refuses a client `at` outright** — a typed `TIMED_RUN_CLIENT_TIMESTAMP` refusal at
   the REST boundary, rather than accepting it advisorily. One validation, no ambiguity.
3. **The projection stays pure.** `campaign-core:276` already pins the discipline for a sibling
   fold — *"the fold is pure; no wall-clock reads inside it"* — and a clock projection satisfies it
   only if each ply's remaining time is **recorded**, never recomputed on read. That is precisely
   what a typed `clockState` is for, and it is why this RFC needs no new storage for readings.

#### §2.3 Absence, pausing, and the tab

The clock runs **server-side and continues while the learner's tab is closed.** This is not a
convenience: §11.3's abandonment gift converts nothing unless it does, and a clock that ticks only
in an open browser is a different product that happens to share a noun.

For **native matches**, the pause protocol already exists and is reused unchanged:
`MatchState.pausedAt` (`apps/server/src/live-types.ts:131,139`) and `#refuseWhileMatchLive`
(`apps/server/src/service.ts:919,1022`). Pausing stops the clock; resuming restarts it. For **solo
timed runs** there is no such protocol and this RFC adds one, with the same shape.

**Criterion 2**: a timed run whose writer disconnects for longer than its remaining time is flagged
on the next authoritative read. *A wrong impl ticks only in an open tab and silently preserves the
abandoned game — which is the bias this arm exists to remove.*

### §3 — Flag-fall is a new event, not a fifth reason

#### §3.1 Why the obvious design is impossible

The derivation and the brief both framed this as *"a fifth `terminal_reason`"*. **It cannot be**,
and the bar is in shipped code, twice:

| Bar | Cite | Consequence |
|---|---|---|
| `outcome.reached` must **immediately follow its `move.committed`** | `packages/runtime/src/events.ts:330-333` | A flag falls when **no move is made**. There is no preceding `move.committed` to follow |
| The reducer re-derives `terminalOutcome` and throws *"references a non-terminal node"* if it is `undefined` | `packages/runtime/src/events.ts:344-345` | A flagged board is **not terminal by the rules of chess**, so the throw fires on **every read**, forever |

`terminalOutcome` (`packages/runtime/src/outcome.ts:5-16`) is a pure function of the board with
exactly four productions — `isEnd()` with checkmate, `isEnd()` without, `halfmoves >= 100`,
`repetitionCount >= 3`. `learner-rating:147-152` states the doctrine and notes the reducer *"does
not merely compute the outcome from the rules, it **checks** it against them on every read."*

**So a flag-fall appended as `outcome.reached` would not fail at review. It would corrupt every
subsequent read of that run**, permanently, with a `TypeError`. This is the unwritable-record class
that has bitten twice this week, found before it was built rather than in review.

#### §3.2 What is added instead

A sixteenth run event:

```ts
export type ClockFlaggedEvent = Event<"clock.flagged", {
  readonly side: "white" | "black";        // the side whose clock expired
  readonly result: RunOutcome;             // computed, never asserted — see §3.3
  readonly atNodeId: string;               // the node the run stood at when the flag fell
  readonly remainingMs: 0;
}>;
```

added to `DrillRunEvent` (`packages/runtime/src/types.ts:294-310`, sixteen members at HEAD). It is
a **run-terminal** event that does not claim to be a board outcome: the reducer treats a run
carrying it as sealed without invoking `terminalOutcome`, and `outcome.reached` is untouched. The
distinction is the point — `outcome.reached` says *the position is terminal*; `clock.flagged` says
*the game ended without the position being terminal*, which is true and which the rules of chess
provide for.

**Criterion 3**: a run carrying `clock.flagged` replays without a `TypeError` and seals; a run
carrying an `outcome.reached` on a non-terminal node still throws. *A wrong impl widens
`terminalOutcome` to return a value for a flagged board, which would make the flag a **board** fact
and corrupt every consumer that treats `terminalOutcome` as pure rules arithmetic.*

#### §3.3 The result is computed, because FIDE 6.9 says it is not always a loss

FIDE Laws 6.9: if a player's time expires, that player loses — **unless the opponent has
insufficient mating material, in which case the game is drawn.** That is a rules fact, and
`chessops` answers it, so the RFC asks rather than asserts:

```
result = opponentHasSufficientMatingMaterial(position, opponentSide) ? loss-for-flagger : "draw"
```

**Criterion 4** fixtures both arms: a flag with a queen on the board seals as a loss; a flag with a
lone king seals as a **draw**. *A wrong impl hardcodes `loss`, which is wrong under the rules
roughly whenever the position is already drawn — i.e. exactly when it matters least to the winner
and most to the truthfulness of the record.*

#### §3.4 The `terminal_reason` widening, landed once

`rated_games.terminal_reason` is a **literal CHECK on a STRICT table** — verified at HEAD,
`apps/server/src/storage.ts:4577`, table closing `STRICT` at `:4585`:

```sql
terminal_reason TEXT CHECK (terminal_reason IN
  ('checkmate','stalemate','insufficient_material','fifty_move','threefold')),
```

*(The brief and the derivation both cite `storage.ts:1230-1231` for this; that is `rfc/learner-rating.md`'s
line, not the shipped table's. The shipped CHECK is at `:4577`.)*

SQLite cannot alter a CHECK in place, so widening it is a **rebuild migration**. This RFC lands the
widening — adding `'flagged'` and `'flagged_insufficient_material'` — **even though v1 writes
neither value** (§4 makes timed games unrated). The reasoning is explicit rather than speculative:
the rebuild is the same cost whenever it happens, doing it twice is strictly worse, and leaving it
out means the rating successor's implementer meets an **unwritable record** — the failure this
project has now caught twice by review and once, here, by derivation.

**Criterion 5** asserts the widened CHECK accepts both new values, **and** that no v1 code path
writes either. *A wrong impl either skips the migration — and the successor discovers it the
expensive way — or starts writing `'flagged'` into rated games this RFC does not rate.*

### §4 — Timed games ARE rated, and the measured blocker becomes a label ([[D1292]])

`learner-rating`'s rated predicate has eight conditions (`:335-354`). A clock breaks exactly one,
and it is not the one the derivation expected.

| # | Condition | Timed play breaks it? |
|---|---|---|
| 1 | Declared rated at creation, before the first ply | No — the control is declared at creation too |
| 2 | `sessionKind === "position"` | No |
| 3 | `human_common` plus a ladder rung `targetElo` | **Yes, measurably** |
| 4–7 | Digest, ≥21 pieces, assistance refused, no rewind | No — R11 is orthogonal to the clock |
| 8 | Reaches `outcome.reached`, no adjudication | **Resolved by §3**, not broken |

**Condition 3 is the real blocker and it is a measurement, not a preference.** `bot-policy:592`
measures maia1's own rating spanning **~230 Elo across time controls against the same human pool**.
A rung calibrated at no control does not transfer to a game played at `180+0`; rating a timed game
on it would produce a number that is wrong by up to a rung and a half, which [[D819]]'s label rule
forbids — *a stated Elo is a measured claim with its measurement cited, or it is not stated.*

**Condition 8 is worth stating as resolved rather than deferred**, because it reads like the
exception `learner-rating` §5.4 exists to refuse. It is not, and §5.4's own reasoning is why: that
section refuses a tablebase seal because *"a tablebase result is a fact about the position **under
optimal play by both sides from here** — a counterfactual."* A flag-fall is the opposite — a fact
about the game **as actually played**, decided by the same rulebook `chessops` implements. It is a
result, not an adjudication.

**OVERRIDDEN 2026-08-23 by [[D1292]], and the override is recorded rather than absorbed.** This
section was drafted to conclude *"v1 rates nothing timed"*. The owner ruled the opposite — **rate all
timed games, with the time control on the label** — choosing widest coverage over the recommended
rate-where-calibrated. **The measurement above is not withdrawn**: the ~230 Elo of cross-control
drift is still true, and a rung calibrated at no control is still an **uncalibrated anchor** for a
`180+0` game.

**What changes is where the honesty lives.** It moves from a *refusal* to a *disclosure*: rating
proceeds, and the label carries both the time control **and** the anchor's calibration state at that
control, so a rating earned against an uncalibrated anchor says so on its face. Calibration then
*improves the label* rather than gating the rating. The mechanism is `learner-rating` §7.4
**obligation 7**, amended under the same ruling and fixtured there by **AC-18**, whose omission arm
fails a build that prints the control and stops.

**Condition 3 therefore no longer breaks.** The table above records the drift as the *reason for the
disclosure*, not as a precondition failure; `learner-rating`'s predicate gains **condition 3a**,
which states explicitly that the control does not gate rating. Condition 8 was already resolved by
§3 and is unaffected.

**Criterion 6** is rewritten accordingly (below): a timed run **may** be created with `rated: true`,
and what is refused is a *label that omits the calibration state*. *A wrong impl reads this ruling as
"rate timed games" and stops there* — publishing an Elo whose measurement does not cover the game it
describes, with nothing on the surface saying so, which is the readable half of D1292 without the
half that makes it honest.

### §4a — The hint ceiling is a context term, not a global clamp ([[D1290]])

**The collision, stated once.** A live clock creates *pre-commit* pressure. Under pressure the
rational learner reads the shortest item that resolves the most of the decision — and `move`, the
top rung of [[D1061]]'s hint distance, is the cheapest thing this product can print. So a clock does
not merely coexist with the assistance ladder; it **tilts toward the top rung**. That is [[D317]]'s
criterion — *an item is cheating iff `distance === "move"` while a committing decision depends on
it* — and [[D1132]] correctly predicted it would land here rather than on `recorded-clocks`, where a
depicted past clock creates no pressure on a live decision.

**The ruling: the surface decides, not one global rule.** Per [[D1290]], **a timed context declares
its own hint ceiling**. A rated timed game may clamp the top rung; a casual timed drill need not.

**Where it is declared, in shipped shape.** `intent-presets` §3's `ContextContract.configClamp` is
`Readonly<Partial<Record<keyof AssistanceConfig, AssistancePermission>>>` — a per-context clamp over
assistance axes, and §2's algebra makes every ceiling term **narrowing-only**: *"A workflow or
session ceiling can only remove assistance, never add it."* The hint ceiling is a `configClamp`
entry, so it inherits that property by construction and cannot widen a rung anywhere.

**The axis it clamps is [[D1061]]'s, and this RFC does not invent it.** Hint distance is a ruled but
unlanded axis: `AssistanceConfig` at HEAD carries `guided: "off" | "live"` and no distance field
(`packages/runtime/src/assistance.ts:4-15`, verified), and [[D1069]] found the ruled four-rung ladder
contradicts the accepted three-stage guided-hint contract — a conflict that RFC owns, not this one.
**This RFC's obligation is therefore narrow and precise**: when that axis lands, it lands as a
`configClamp`-clampable key, and **every timed context declares an explicit entry for it**. Silence
is not permitted, because an absent clamp reads as "free" and that is the tilt.

**Two wrong implementations this forecloses**, both of which would satisfy a loosely-written rule:
one global clamp applied whenever any clock runs (which is the rule the owner refused — it removes a
legitimate option from casual timed play), and no clamp at all (which is the tilt shipped as a
default). Criterion 13 fails both.

### §5 — A rewind never costs time

Held as a refusal in writing, because the alternative arrives by drift rather than by decision.

`campaign-core` §2.5 (`:184`) states charges are *"not purchasable, not sellable, **not
convertible**"*. A rewind that costs seconds is a **time-for-charge conversion** and is refused in
those terms. [[D364]]'s warning applies exactly here: a per-rewind time price *is* the pursuit
clock, because the *k*-th retry then costs more than the first — and `design/05`'s invariant
*"Rewind is an experiment, not an undo"* weakens the moment rewinding acquires a price.

| Surface | Rule |
|---|---|
| **Native match** | Solved already. Rewind returns `MATCH_LIVE` unless paused (`service.ts:1022`); pausing stops the clock. **The pause protocol is the clock protocol** |
| **Solo timed run** | **Stop-and-fork.** The rewind stops the clock; the fork inherits the forked node's recorded reading and resumes from it |
| **Campaign encounter** | Unchanged — a rewind spends an earned charge ([[D945]]), and spends **no** time |

**Stop-and-fork is chosen over refuse-while-running for a mechanical reason, not a taste one**:
`clockState` lives on `Node` and is branch-scoped, so a fork inherits the forked node's reading
**for free** ([[D355]]'s altitude finding, now load-bearing). The attempt-scoped clock is what the
shipped field already implements; the run-pooled clock [[D364]] demands be refused would need a new
run-level field.

**Criterion 7** is that refusal made failable: neither `DrillRun` nor `CreateRunInput` gains a
time-typed field, and a fork's first `clockState` equals the forked node's. *A wrong impl pools
remaining time at the run level, which differs from the permitted object by one field's altitude
and would otherwise be caught by nothing — D364's own stated fear.*

### §6 — No bot clock, and no amendment to `bot-policy`

`bot-policy` §2.7 (`:347-348`): *"there is no timing layer, deliberately … the compiler refuses any
layer declaring a delay effect"*, enforced at `:381`, refused in the disposition table at `:638`,
and pinned by a must-fail conformance fixture. **This RFC asserts nothing past that and amends
nothing.** The learner's clock runs; the bot's does not.

This is honest rather than merely cheap: the bot is not pretending to think, which is exactly how a
training clock works. [[D1047]] corrected an earlier claim that the refusal was *"scoped to
guard-disclosure honesty, not to clocks"* — it is not; the rationale is fake timing itself.

The two-sided bot clock defers to Discharge D2 with its blocker named: a `movetime` search bound is
**not reproducible across machines or loads** while `nodes` is, so a clock-consuming bot breaks
`bot-policy` criterion A3's byte-identical replay — *"the property the whole instrument chain rests
on"* (`:446`).

**Criterion 8**: no `BotPolicyLayer` gains a timing effect and `bot-policy`'s must-fail fixture
still fails to compile. *A wrong impl gives the bot a clock to make matches feel fair and silently
breaks deterministic replay for every profile.*

### §7 — Time controls: increment only, and why the rest is refused

| Control | v1 | Reason |
|---|---|---|
| **Fischer increment** (`initial+increment`) | **Supported** | Covers the measured corpus: `recorded-clocks` §2.1 found `60+0`, `600+0`, `300+0`, `180+0` as the top four of 108 games, all of this shape |
| **Simple delay / Bronstein** | Refused | A different decrement rule per move; no measured demand in the corpus, and each adds a branch to the authoritative path §2 keeps deliberately small |
| **Multi-stage** (`40/90+30`) | Refused | Requires move-count triggers, which interact with the campaign's charge economy and the rating period in ways nothing has derived |

Both refusals carry Discharge D3 with an owner. They are refusals of **v1 support**, not of the
idea.

**Criterion 9** asserts an unsupported control string is refused at creation with a typed error
naming what is supported. *A wrong impl accepts `40/90+30`, stores it, and decrements it as though
it were `90+30` — a silent misreading rather than a refusal.*

### §8 — The campaign seam

**Timing is orthogonal to `encounter.kind`.** `campaign-core:106-117` keeps that enum *"closed with
one member"* in v1 and states that adding members is a schema change belonging to its discharge
rows. A timed encounter is a **`timeControl` on a node**, not a fifth kind — which keeps the closed
enum closed and is much the cheaper shape.

**Whether flagging loses an encounter is owner-tier and is not decided here.** `campaign-core` §4.1
seals on the submitted branch tip's `ObjectiveState`, and ADR-0007 / [[D1040]] make *finishing*
grant the reward *"whatever the verdict"*. The natural reading is that a flagged encounter seals as
failed **and still pays its reward and charge grant** — consistent with the ruling, but a call the
owner has not made. Discharge D4, owner `OWNER`.

`campaign-core` Discharge D4's parenthetical — *"time controls (nothing exists to build on —
`clockState` is an untyped passthrough)"* — is **falsified** by `recorded-clocks` typing the field.
Its re-point from `planning/campaign/` to `planning/time-controls/` is Discharge D5.

### §9 — What the learner sees, and the one genuinely new thing

`recorded-clocks` §7.2 seats a **non-ticking** readout in the companion region on
`campaign-core:362-377`'s precedent, and says plainly that *"the ticking element — a genuinely new
**kind** of thing, since all 16 states are reachable by an input — belongs to the real-clock
successor."*

**It does, and this RFC does not pretend otherwise.** A ticking clock changes without any input,
which no element in `play-composition`'s closed 16-state composition does. The three placement
rules from `recorded-clocks` §7.2 carry unchanged — never in the stage column, fixed-size digit
slots so `10:00` and `0:09` occupy one box, emphasis by paint and not layout — and this RFC adds a
fourth: **a tick may repaint its own box and may change nothing else.**

**Criterion 10** asserts `play-composition`'s 16-state list is byte-unchanged and that a tick
produces no layout write outside the readout's fixed box. *A wrong impl lets the clock's width
change with the digits, which reflows the companion region on every second — the [[D537]] class,
arriving through the one element that changes without a gesture.*

Whether a persistent **ticking** element is a region-level change is a design-tier question. See
Deviations.

### §10 — Refusals, stated affirmatively

| # | Refused | Why, and where it lives instead |
|---|---|---|
| R1 | **A rewind costing time** | `campaign-core` §2.5's *"not convertible"*; [[D364]]'s pursuit clock. Criterion 7 makes it failable rather than prose |
| R2 | **A run-pooled clock** | [[D364]]: it is the retry price by one field's altitude. Criterion 7 |
| R3 | **A bot clock** | `bot-policy` §2.7 (§6). Deferred to D2 with the determinism blocker named |
| R4 | **Rated timed games in v1** | The measured ~230 Elo cross-control drift (§4) plus an owner fork. D1 |
| R5 | **Delay, Bronstein and multi-stage controls** | §7. D3 |
| R6 | **Predicted deliberation time** | Inherited unchanged from `recorded-clocks` §3 — law 8, and no corpus exists |
| R7 | **Flag-fall as a board outcome** | §3.1 — it would corrupt every read. `clock.flagged` is a run-terminal event and says so |

### §11 — Ledger-row lifecycle

| Row | Disposition at this RFC's landing |
|---|---|
| [[D1041]] | **Closes.** Both arms now have documents; this is arm (b) |
| [[D364]] | **Closes the run-pooled half** — refused in writing (R2) and made failable (criterion 7). Its two `design/06` §5 amendments remain owed, D6 |
| [[D357]] | **Does not close.** Its residue is the acceptance-blocking open question below |
| [[D1132]] | **Escalated, not closed** — the residue it names lands on this RFC, as it predicted |
| `campaign-core` D4 | Its premise is falsified; the re-point is D5 |

## Deviations from design

**One, and it is larger than `recorded-clocks`'.** `design/05`'s five regions contain no clock, and
`design/03` names none. `recorded-clocks` added a *static* readout on the argument that it
introduces no new **kind** of surface. **This RFC cannot make that argument.** A ticking element
changes without input, which nothing in the shipped composition does, and it can end a run — which
no chrome does.

This is stated rather than smoothed over: **if a reviewer judges that a self-changing, run-ending
element is a design-tier addition to `design/05`'s regions, this is the clause to return the RFC
on**, and the amendment is the owner's under law 5. The specification is written so that ruling
changes the seat and nothing else.

## Fresh independent buildability return (2026-08-30)

The direction survives; the contract does not. The exact review is
`planning/time-controls/enforced-clocks-fresh-independent-buildability-review-2026-08-30.md`, and
`make enforced-clocks-fresh-review` reproduces all twelve findings:

1. [[D2296]] — the [[D1292]] amendment left timed games simultaneously rated and unrated.
2. [[D2297]] — “next authoritative read” cannot expire an abandoned game that is never read again.
3. [[D2298]] — expiry has no durable deadline/command identity or atomic ordering against a move.
4. [[D2299]] — current terminal consumers recognize `outcome.reached`, not `clock.flagged`.
5. [[D2300]] — learner-relative `RunOutcome` cannot encode one shared two-learner game result.
6. [[D2301]] — FIDE 6.9's possible-legal-series rule is reduced to a nonexistent helper and two
   non-discriminating fixtures.
7. [[D2302]] — native resume clears `paused_at` without preserving a clock basis; solo pause is not
   specified.
8. [[D2303]] — root state, two-side projection, increment order, deadline arithmetic and recovery
   are absent.
9. [[D2304]] — the RFC calls itself the full ruled arm while deferring [[D1041]]'s bot move-time
   consequence.
10. [[D2305]] — returned clock, social, bot, campaign and intent dependencies are not reflected.
11. [[D2306]] — timed-drill, solo-pause and campaign flag/reward semantics still change the state
    machine and remain unruled.
12. [[D2307]] — paint containment is not a typed create/play/pause/reconnect/finish/Review journey.

The provisional schema/migration claims remain reserved, not buildable. Repair must start from the
returned recorded-clock/time-control and social color/result authorities, resolve the owner
semantics, define one durable two-sided clock plus autonomous expiry transaction, migrate a
set-equal terminal consumer census, and only then specify bot timing and the complete client journey.

## Acceptance criteria

Each names what a wrong implementation would do to pass it.

1. **Vocabulary preserved and extended once.** `recorded-clocks`' three pins byte-unchanged;
   `ClockReading.source` gains exactly one member. *Wrong impl re-opens `clockState` to an untyped
   object.*
2. **The clock runs while the tab is closed.** A timed run whose writer disconnects past its
   remaining time flags on the next authoritative read. *Wrong impl ticks only in an open tab and
   preserves the abandoned game — the bias this arm removes.*
3. **`clock.flagged` replays; a mis-modelled flag still throws.** A run carrying `clock.flagged`
   reduces without error and seals; an `outcome.reached` on a non-terminal node still throws
   `references a non-terminal node`. *Wrong impl widens `terminalOutcome`, making a clock fact into
   a board fact.*
4. **FIDE 6.9 both ways.** Flag with mating material ⇒ loss; flag against a lone king ⇒ **draw**.
   *Wrong impl hardcodes a loss.*
5. **The CHECK is widened once and unused in v1.** `terminal_reason` accepts `'flagged'` and
   `'flagged_insufficient_material'`; no v1 path writes either. *Wrong impl skips the rebuild, or
   writes values into games this RFC does not rate.*
6. **Timed runs rate, and their label carries the anchor's calibration state ([[D1292]]).**
   Creating a timed run with `rated: true` **succeeds**; what fails is a published label for that
   game omitting either the time control or the anchor's calibration state at it. Asserted against
   `learner-rating` **AC-18**, whose omission arm must be red for this criterion to mean anything.
   *Wrong impl refuses the run (the pre-D1292 draft), or rates it and prints the control alone —
   publishing an Elo whose measurement does not cover the game, with nothing saying so.*
7. **No run-level time, and a fork inherits its node's reading.** `DrillRun` and `CreateRunInput`
   carry no time-typed field; a fork's first `clockState` equals the forked node's. *Wrong impl
   pools time at the run level — D364's altitude slide, which nothing else would catch.*
8. **No bot clock.** No layer gains a timing effect; `bot-policy`'s must-fail fixture still fails to
   compile. *Wrong impl gives the bot a clock and silently breaks deterministic replay.*
9. **Unsupported controls are refused, not misread.** `40/90+30` is refused at creation with a typed
   error naming what is supported. *Wrong impl stores it and decrements it as `90+30`.*
10. **Composition untouched; a tick repaints one box.** `play-composition`'s 16-state list is
    byte-unchanged and a tick writes no layout outside the readout. *Wrong impl lets digit width
    reflow the companion region every second.*
11. **A paused match's clock does not move.** Remaining time is identical across a pause/resume
    cycle of any wall-clock duration. *Wrong impl decrements through the pause, which makes
    `#refuseWhileMatchLive`'s rehearsal window cost the game.*
12. **The abandonment consequence is real.** A timed rated-eligible game abandoned at a losing
    position produces a **result** rather than a void. Asserted against `learner-rating`'s
    `void_reason: 'abandoned'` path (`storage.ts:4575`). *Wrong impl leaves the void path in place,
    so the arm's strongest argument ships as prose.* **Runs behind D1** — fixtured now, enforced
    when timed games rate.
13. **Every timed context declares an explicit hint ceiling, and it is per-context ([[D1290]]).**
    Two arms. (a) **Completeness**: for every `WorkflowContextId` whose contract admits a clock, the
    `ContextContract.configClamp` carries an explicit entry for [[D1061]]'s hint-distance axis —
    **absence fails**, because an absent clamp reads as "free" and that is the tilt §4a describes.
    (b) **Discrimination**: at least two timed contexts declare **different** values, asserted over
    the contract table rather than a single instance. *Wrong impl A applies one global clamp
    whenever any clock runs — the rule the owner refused, since it removes a legitimate option from
    casual timed play; wrong impl B declares nothing and ships the tilt as a default. Arm (a) fails
    B, arm (b) fails A.* **Runs behind the hint-distance axis landing** ([[D1069]] owns its conflict
    with the three-stage guided-hint contract); this criterion is red until it exists, which is the
    honest state rather than a silent pass.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | **Narrowed by [[D1292]]**: *whether* timed play rates is ruled (it does, with the calibration state on the label). What remains is the calibration design — does `timeControl` join the rung identity, or does a timed ladder get its own calibration? — which now improves the label rather than gating the rating. Still carries criterion 12's enforcement and the `terminal_reason` values this RFC lands unused | `OWNER` | `planning/platform-alignment/decision-queue.md` | |
| D2 | Two-sided bot clocks — needs a `bot-policy` §2.7 amendment and a resolution to `movetime`'s non-reproducibility against criterion A3 | `claude` | that amendment's registration | |
| D3 | Delay, Bronstein and multi-stage controls | `claude` | the successor RFC's registration | |
| D4 | Does flagging lose a campaign encounter, and does a flagged encounter still pay its reward and charge grant under [[D1040]]? | `OWNER` | `planning/platform-alignment/decision-queue.md` | |
| D5 | `campaign-core` Discharge D4's re-point from `planning/campaign/` to `planning/time-controls/`; its *"nothing exists to build on"* premise is falsified | `claude` | the re-pointing commit | |
| D6 | [[D364]]'s two owner-tier `design/06` §5 amendments (the pursuit-clock sentence and the legibility/power dichotomy) | `OWNER` | the ruling's landing commit | |
| D7 | Time as a longitudinal observation — `longitudinal-store:266-270` licenses it as a rev bump, and **the time budget must enter the decision key or two decisions at one FEN pool silently** | `claude` | that store's next rev | |
| D8 | Implementation | `codex` | the implementing commit | |

## Open questions

1. **✅ RULED 2026-08-23 by [[D1290]] — no longer acceptance-blocking.** [[D357]]'s cheating
   gradient, which [[D1132]] predicted would land here, is resolved as **a ceiling term per
   context**: a timed context declares its own hint ceiling through `intent-presets` §2's
   narrowing-only algebra, so a rated timed game may clamp the top rung while a casual timed drill
   need not. Specified in §4a; made failable by criterion 13. The surface decides, not one global
   rule.
2. **⚖️ Does a timed drill ever *fail* the learner, or is enforcement confined to play?** [[D1041]]
   ruled *"real clocks in play"* and *"simulated pressure in drills"* — `recorded-clocks` reads the
   drill half as informational. If a drill's clock may expire, gap 3 of the derivation re-opens and
   question 1 binds there too.
3. Does the solo pause protocol §2.3 adds need a learner-facing control, or is it implicit in
   navigating away? A UX question this document cannot settle.

## Ledger rows (proposed — id assigned at landing; head D1275 at drafting)

- **new 🐞** — **flag-fall cannot be a fifth `terminal_reason`**: `outcome.reached` must immediately
  follow its `move.committed` (`events.ts:330-333`) and the reducer throws on a non-terminal node
  (`:344-345`), so a flag appended there corrupts **every subsequent read** rather than failing at
  review. The derivation and the drafting brief both framed it as a fifth reason. New event
  required.
- **new 🐞** — the `terminal_reason` CHECK is at **`apps/server/src/storage.ts:4577`** on a `STRICT`
  table; `rfc/learner-rating.md:1230-1231` is the RFC's own text and has been cited as the shipped
  location in the derivation and in the drafting brief.
- **new 💡** — a clock is the **fourth response** to `learner-rating` §11.3's abandonment bias and
  the only one needing no inference about intent; its precondition is server-side ticking while the
  learner is absent (§2.3).
- **new 💡** — FIDE 6.9's insufficient-material draw makes a flagged result a **computed rules
  fact**, not a constant; criterion 4 fixtures both arms.

## Changelog

- 2026-08-23 (amendment, [[D1290]] + [[D1292]]) — **D1290**: open question 1 closes; §4a specifies the
  hint ceiling as a `ContextContract.configClamp` entry under `intent-presets` §2's narrowing-only
  algebra, and criterion 13 makes both wrong implementations (one global clamp / no clamp) fail.
  The axis itself is [[D1061]]'s and unlanded, so criterion 13 is honestly red until it exists.
  **D1292**: §4's *"v1 rates nothing timed"* is **overridden** — the ~230 Elo drift measurement
  stands, but the honesty moves from refusal to disclosure; criterion 6 is rewritten from a typed
  refusal into a label obligation bound to `learner-rating` AC-18, and Discharge D1 is narrowed to
  the calibration design. **The owner may veto the disclosure reading of D1292** (rating without the
  calibration state on the label); the ruling row records that this reading is claude's, taken as
  the ruling's content unless the owner says otherwise.
- 2026-08-23 — drafted from `planning/time-controls/rfc-derivation.md` §4–§5 under [[D1093]] and
  [[D1041]], as the successor `recorded-clocks` Discharge D1 names and whose absence the [[D1230]]
  scope audit counted. Priced at the full arm per D1230: server authority, flag-fall, the control
  vocabulary and all five accepted-contract seams are specified; four items defer with named owners
  and cited blockers. The central design finding — that flag-fall cannot ride `outcome.reached` —
  was derived here rather than inherited, and inverts the derivation's §4.3.
