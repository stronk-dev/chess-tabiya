# RFC: Recorded clocks — the depicted arm of the time-control lane

- **Status:** draft — **RETURNED by fresh independent review 2026-08-30 on [[D2286]]–[[D2295]].**
  The depicted-clock direction survives, but the type drops ply identity; storage has no route to
  nodes, API or UI; time-control parsing and retroactive transition are unspecified; arbitrary
  client timestamps are mislabeled as thinking time; legacy quarantine is type-unsound; and the
  broadcast evidence is aggregated at the wrong grain. No implementation before author repair and
  another review. **Prior status:** draft — 2026-08-23.
- **Author:** claude
- **Created:** 2026-08-23
- **Design refs:** `design/05-in-run-experience.md` §invariants (*"Absence is stated, never simulated"*, *"The run is the sole source of chess truth"*); `design/03-product-breadth.md` §Library (imported games)
- **Exploration gate:** [[D1093]] (the drafting mandate: the owner's *"make sure we have all the DEPTH and BREADTH"* plus per-lane ruling [[D1041]]); the general gate is open under `planning/exploration/gates.md:198`'s logged 2026-08-12 owner override
- **Depends on:** `rfc/live-sources.md` (accepted — its [[D1048]] amendment extracts `[%clk]` and **explicitly leaves the storage home to this lane**); `rfc/play-composition.md` (accepted — the closed stage and the companion-region seat precedent)
- **Parent / amends:** first RFC of the [[D1041]] time-control lane; derived from `planning/time-controls/rfc-derivation.md`
- **Supersedes / superseded by:** —
- **Planning:** `planning/time-controls/`

```tabiya-claims
run-schema | lane 0.19 | Node.clockState narrows from an untyped open object (schemas/drill_run.schema.json:218-222, additionalProperties true) to a closed ClockReading; a breaking narrowing of an already-persisted field
migration | position behind live-sources | imported_games.clocks (new typed column holding the per-ply readings sanitizeBroadcastPgn already extracts and does not store)
```

## Summary

This RFC ships **the clock the original player actually had, shown beside the move they actually
made, and silence when we do not know.** It is the *depicted* arm of the owner's time-control
ruling ([[D1041]]) and nothing else: no countdown, no enforcement, no flag-fall, no rating
interaction, no bot clock. The data is already in the database — every `[%clk]` of every pasted
import sits verbatim in `imported_games.pgn`, and `live-sources`' [[D1048]] amendment already
extracts broadcast clocks and deliberately leaves their storage home to this lane. Measured
before drafting (§2.4): **108 of 108 games in the paste-path corpus carry both clocks and a
declared time control**, so this is a feature rather than an abstention. It types `clockState`,
closing [[D361]]'s zero-reader passthrough, and pairs a recorded clock with a recorded evaluation
movement to produce the owner's *"a GREAT move… and then give actual time"* out of **two recorded
facts and no chess claim**.

## Motivation

The owner's sentence is one clause with two halves of opposite evidentiary status:

> *"what if we want to simulate the time pressure of a GREAT move during 10+0 chess **and then
> give actual time**?"* — [[D330]], 2026-08-16

*"Give actual time"* is a recorded fact we already hold. *"Simulate the pressure"*, in its
population form, is a claim about human deliberation that **no instrument in this tree produces**.
[[D1059]] separated them into three arms and found only two are grounded; §3 states the split as a
refusal rather than an omission, because the ungrounded half will otherwise ride in on the
grounded half's evidence ([[D1049]], trap T2 of the derivation).

Three further reasons this arm goes first, all from `planning/time-controls/rfc-derivation.md` §8:
its data needs no new capture, it touches no accepted contract's *semantics*, and it creates no
terminal state, no server-authority requirement, no rating interaction and no bot question — each
of which the real-clock arm does, against five accepted documents.

## Specification

### §1 — Vocabulary, pinned first, because three shipped objects already own clock words

The lane inherits a naming hazard: three live objects use clock language and none is a clock.

| Shipped object | What it actually is | Cite |
|---|---|---|
| `clock_zeroed` | The **halfmove** clock — a fifty-move-rule counter. Live: fires 265 of 771 committed spine transitions | `packages/runtime/src/transition.ts:360`, evaluated `:309` |
| `timingWindows` / `luxuryMoveBudget` | **Move-count** tempo, not seconds | `schemas/drill_pack.schema.json:784` |
| `TempoVerdict` | A move-count verdict vocabulary reading as clock language (`in_time`, `too_slow`, `over_budget`) | `packages/runtime/src/tempo.ts:15-23` |

**Nothing shipped is renamed.** This RFC pins three new nouns and uses no other:

- **`timeControl`** — a declared control, canonically serialised `"initial+increment"` in seconds
  (`"600+0"`). This is the same serialisation `bot-policy`'s `calibration.timeControl`
  (`apps/server/src/bot-policy-catalog.ts:112-116`) already declares, so the two agree by
  construction rather than by coincidence.
- **`ClockReading`** — one side's remaining time at one ply, the typed shape `clockState` narrows
  to (§4).
- **`flag`** — expiry. **Reserved and unused in this RFC**; named here only so the successor
  cannot pick a fourth word for it.

**Criterion 1** asserts the three shipped objects are byte-unchanged at this RFC's landing.

### §2 — What is measured, and what that settles

#### §2.1 The paste path carries clocks essentially always

Measured 2026-08-23 over `tools/r2-selection-harness/imported-sample.pgn`, the tree's
108-game Lichess-export corpus and the closest available proxy for the paste path:

| Quantity | Value |
|---|---|
| Games | **108** |
| Games carrying ≥1 `[%clk]` | **108 (100%)** |
| Games carrying `[TimeControl]` | **108 (100%)** |
| Total `[%clk]` occurrences | **6,991** (mean 64.7 per game) |
| Distinct controls (top four) | `60+0` ×33, `600+0` ×26, `300+0` ×16, `180+0` ×12 |

#### §2.2 The broadcast path carries clocks and no declared control

Measured over `tools/d947-broadcast-roundtrip-harness/fixtures/`:

| Fixture | Games | `[%clk]` | `[TimeControl]` |
|---|---|---|---|
| `finished-round-QxNfeqHA.pgn` | 10 | 902 | **0** |
| `ongoing-round-wDTQF08K.pgn` | 10 | 256 | **0** |

#### §2.3 What those two tables settle

[[D362]]'s standing instruction was *"scope the abstention path first — if a material share of
imports carry no clocks, this is an abstention, not a feature."* **Settled: it is a feature.**
The abstention path is nonetheless first-class and required, because the two populations abstain
in *different* places — the paste path can lack neither, the broadcast path lacks the declared
control in **100%** of measured fixtures. §5 therefore specifies per-field abstention, not
per-game.

#### §2.4 Nothing here is a prevalence guarantee

Both corpora are convenience samples committed for other purposes. **Criterion 9 re-measures
prevalence at landing over the real `imported_games` table** and fails if the abstention path is
unexercised — an abstention path no fixture reaches is the [[D444]] class.

### §3 — The three arms, and the one that is refused

| Arm | Sentence it licenses | Status |
|---|---|---|
| **Depicted** | *"White played this with 4:12 on the clock."* | **IN SCOPE.** A recorded `[%clk]` from bytes we already store |
| **Measured** | *"You spent 8 seconds here."* | **IN SCOPE, informational only** (§6) |
| **Predicted** | *"This move would have taken you 40 seconds."* | **REFUSED — law 8** |

**The refusal, stated affirmatively so it is not read as an omission.** A statement about how long
a move *would* take — this learner or any learner — is a counterfactual about deliberation that no
instrument in this tree produces. There is no human deliberation-time corpus; engine bounds are
**nodes**, not seconds (`apps/server/src/engine-supervisor.test.ts:238-242`); and both
`Move Overhead` and `nodestime` are refused capabilities
(`apps/server/src/capabilities.ts:128,132`). Obtaining such a corpus means bulk ingestion, which
`CLAUDE.md` §Rejected forbids as a prerequisite. [[D820]] already names the degenerate form
(*"do not fake it with random delays, which is the uniform-noise mistake in the time domain"*);
**the plausible form is worse, because it is more believable.** This is the time-domain sibling of
*"Ne5 centralizes the knight"*.

**The owner's sentence does not need it.** Decomposed: a budget from a declared control is
arithmetic; the learner's own spend is *measured*; the comparison point is *depicted*. **No arm of
what was asked requires prediction.**

**Criterion 2** is a negative fixture: a renderer emitting any duration not traceable to a
recorded `[%clk]`, a declared `timeControl`, or a `Node.createdAt` delta fails.

### §4 — `clockState` becomes a type, closing [[D361]]

#### §4.1 What it is today

`Node.clockState` is `Readonly<Record<string, unknown>>`
(`packages/runtime/src/types.ts:124`), written only from `CommitMoveOptions.clockState`
(`packages/runtime/src/runtime.ts:58`, applied `:342`), parsed at the REST boundary as
*"is it an object"* (`apps/server/src/rest.ts:564,566,570`, and `:1601,:1603` on the opponent-ply
route). Its schema declaration is `"Reserved until clock semantics are specified by a later RFC."`
with `additionalProperties: true` (`schemas/drill_run.schema.json:218-222`) — **inside a node
object that is `additionalProperties: false`**. The node is closed and the clock is open.

**Readers: zero.** Nine non-test references, all write or transport.

#### §4.2 What it becomes

```ts
export interface ClockReading {
  readonly remainingMs: number;        // >= 0
  readonly side: "white" | "black";
  readonly source: "recorded";         // closed in this RFC; the successor adds "played"
}
```

`Node.clockState?: ClockReading`. `source` is a **closed one-member union in v1** — the same
device `campaign-core` used for `encounter.kind` — so the real-clock successor adds a member
rather than widening an untyped field twice.

#### §4.3 Why this altitude, and the test that keeps it there

[[D355]] found that the shipped placeholder already picked the safe altitude: `clockState` sits on
`Node`, which is branch-scoped, so **a reading built on it rewinds with the board for free**. The
run-pooled clock [[D364]] demands be refused is *not expressible* without a **new run-level
field** — which is the whole of D364's warning that *"the difference between the permitted and the
refused object is one field's altitude and nothing today would catch it."*

**Criterion 3 catches it**: an assertion that neither `DrillRun` nor `CreateRunInput` gains a
time-typed field. A wrong implementation that pools time at the run level fails there and nowhere
else.

#### §4.4 The narrowing is breaking, and that is the lane claim

The field is persisted and open, so historical rows may hold anything. Narrowing is a breaking
change to `schemas/drill_run.schema.json`, whose `schemaVersion` is pinned `"0.17"` at `:24`.
This RFC claims **run-schema lane 0.19** (0.18 is `bot-policy`'s; `register-check` reports
`run-schema: head 0.17; next free 0.19`).

**Existing values are quarantined, not migrated or dropped.** No shipped writer ever populated the
field (zero readers implies zero product writers; the REST route accepts it from clients). A value
that does not parse as a `ClockReading` is retained in the event log byte-for-byte and **ignored by
every reader**, which preserves `design/05`'s *"the run is the sole source of chess truth"* without
inventing a migration for data no shipped code wrote. **Criterion 4** fixtures a run carrying a
legacy junk `clockState` and asserts it replays byte-identically and renders nothing.

### §5 — Ingestion: parse what we already store

#### §5.1 Two populations, one shape

| Population | Where the clocks are now | This RFC |
|---|---|---|
| **Paste** | Verbatim inside `imported_games.pgn` (`apps/server/src/storage.ts:163`, written `:1747-1752`) — comments are dropped by mainline extraction (`apps/server/src/pgn-import.ts:48-56`) but **the raw PGN is stored whole** | **Re-parse stored bytes.** Works **retroactively** on every game already imported |
| **Broadcast** | Extracted but not stored: `live-sources`' [[D1048]] amendment returns `{ pgn, clocks: { ply, remaining }[] }` and states its storage home *"is claimed by the time-control lane, not by this RFC"* | **Persist what it hands over** |

#### §5.2 The storage home live-sources left open

A typed column beside `ImportedGameRecord.pgn`:

```ts
readonly clocks: readonly ClockReading[] | null;   // null = not yet parsed; [] = parsed, none present
readonly timeControl: string | null;               // the declared control, canonical "600+0"
```

**`null` and `[]` are different states and the distinction is load-bearing** — `null` means we
have not looked, `[]` means we looked and there were none. Collapsing them turns an abstention
into a silent claim, which is `design/05`'s *"Absence is stated, never simulated"*. **Criterion 5**
asserts a renderer distinguishes them.

This claims **one migration position, behind `live-sources`** — the honest dependency: this RFC
persists what that RFC extracts, so it cannot land first.

#### §5.3 Abstention is per field, not per game

Because the broadcast path measured **0% declared controls** against **100%** clock coverage
(§2.2), a game may have readings and no control. The renderer states each absence separately and
never derives one from the other. **Criterion 6** fixtures the broadcast case: readings present,
`timeControl` null, no invented control.

### §6 — The measured arm: the learner's own spend

Every `Node` carries `createdAt` (`packages/runtime/src/types.ts:123`) and persisted events carry
`created_at` (`apps/server/src/storage.ts:605,677`), so **consecutive node-timestamp deltas give
the learner's own elapsed time with no new capture, retroactively over every run already played.**

**Two honesty bounds, both stated in the RFC because both are real:**

1. **The timestamp is client-supplied.** `runtime.ts:296` is `const at = timestamp(options.at)`
   with `at` arriving from the request body (`rest.ts:568`). A client may claim any time it likes.
   **This is why the measured arm is informational only and feeds no verdict, seal, grade or
   rating** — a bound that costs nothing here and is the successor's central problem.
2. **Imported runs collapse it.** `service.ts:829` commits every imported ply with a single
   `input.createdAt`, so imported elapsed time is **structurally zero, not merely absent**.
   **Criterion 7** asserts the measured arm abstains on imported runs rather than rendering `0s`
   — a zero that means "not recorded" printed as a duration is the trap this criterion exists for.

### §7 — What the learner sees

#### §7.1 The pairing that produces the owner's sentence from two recorded facts

The owner asked for *"the time pressure of a **GREAT** move"*. Nothing in this product grades a
move ([[D363]]), and this RFC does not start. The nearest **recorded** selector already ships:
`storyMoments`' `STORY_PIVOT_CP = 150` (`packages/runtime/src/story.ts:33`, applied `:86`),
which renders an evaluation **change**, never a verdict.

So the honest object is: **"the move at which the recorded evaluation moved 150 cp, played with
0:24 on the clock."** Two recorded facts, joined; no chess claim, no adjectives. **Criterion 8**
is a voice fixture asserting the rendered sentence contains no evaluative word — it reuses
`BANNED_JUDGEMENTS` rather than inventing a second denylist.

#### §7.2 Placement: a companion-region seat, adding no composition state

`play-composition` closes the stage column's children (`:300-303`) and its 16 composition states
(`:500-524`), and states *"Nothing above the board"* (`:202-205`). A clock readout must not
reopen any of it. **The precedent is `campaign-core.md:362-377`**, which seated the `⟲ N` charge
strip in an existing region and asserted the 16-state list byte-unchanged.

Three rules:

1. **Never in the stage column** — the geometry function stays content-free.
2. **Fixed-size at every reading** — monospaced digit slots, so `10:00` and `0:09` occupy one box.
   A state-dependent height would push the companion region, which §1's second invariant forbids.
3. **Emphasis is paint, not layout** — colour and weight inside a fixed box.

**Criterion 10** asserts `play-composition`'s 16-state list is byte-unchanged at this landing.

**This readout does not tick.** It depicts a recorded past reading beside a past move; it changes
only when the learner moves through the game. The ticking element — a genuinely new *kind* of
thing, since all 16 states are reachable by an input — belongs to the real-clock successor.

#### §7.3 Not an assistance axis

The depiction is chrome over recorded facts, not a disclosure of anything the learner could not
already see in the source PGN, so it takes **no `AssistanceConfig` axis and no ceiling term**.
This deliberately avoids a version-5 `AssistanceConfig` migration, which `play-composition`'s
criterion A11 (`:638-641`) bars from its diff. **Criterion 11** asserts `AssistanceConfig` stays
at `version: 4` (`packages/runtime/src/assistance.ts:4-15`).

### §8 — Refusals, stated affirmatively

| # | Refused | Why, and where it lives instead |
|---|---|---|
| R1 | **Predicted deliberation time**, in any form | Law 8; §3. The corpus does not exist and building it is bulk ingestion |
| R2 | **A run-pooled clock** | [[D364]]: it is the pursuit clock — *"the k-th retry costs more than the first"*. Criterion 3 makes it failable, per D364's demand that the refusal be a test rather than prose |
| R3 | **A rewind costing time** | `campaign-core` §2.5's *"not convertible"* forbids the conversion in terms; a per-rewind time price is R2 by another route |
| R4 | **A bot clock** | `bot-policy` §2.7: *"there is no timing layer, deliberately"*, enforced by a compile error (`:348`, `:381`) and a must-fail fixture (`:727`). This RFC asserts nothing past that and amends nothing |
| R5 | **Enforcement of any kind** — countdown, expiry, flag-fall | The successor's, behind the owner rulings in §10 |

### §9 — Ledger-row lifecycle

| Row | Disposition at this RFC's landing |
|---|---|
| [[D361]] | **Closes.** The passthrough gains a type and a reader |
| [[D330]] | **Corrected, not closed.** Its claim that `clockState` sits on `DrillRun` and the start options is false at HEAD (§4.1); the row was never edited after [[D355]] found it |
| [[D362]] | **Closes.** *"One retained field away"* — improved: a re-parse of stored bytes, so retroactive |
| [[D1049]] | **Closes.** The three-arm split is §3 |
| [[D364]] | **Partially discharged.** Arm (b)-as-decoration is shipped here; its two `design/06` §5 amendments and the run-pooled refusal-in-writing remain owed (Discharge D2) |

## Deviations from design

**One.** `design/05-in-run-experience.md`'s five regions contain no clock concept and `design/03`
does not name one. This RFC adds a readout to the companion region without amending either,
because it introduces no new *kind* of surface — it is a recorded fact rendered beside the move it
belongs to, in the seat family `postcommit_nudge` already occupies. **If a reviewer judges that a
persistent readout is a region-level change, this is the clause to return.** The successor's
*ticking* clock is unambiguously a design-tier question and is not claimed here.

## Fresh independent buildability return — 2026-08-30

The author repair must close every routed finding below before another review:

- [[D2286]] — refresh the returned predecessor and migration/run-lane dependency chain.
- [[D2287]] — retain exact per-game ply identity through extraction, persistence and projection.
- [[D2288]] — specify the complete stored-PGN → node → API → client-module operation path.
- [[D2289]] — define one parsed time-control domain with absent/invalid/unsupported results.
- [[D2290]] — remove or rebuild the false client-timestamp-as-thinking-time arm.
- [[D2291]] — specify an idempotent transactional retroactive parse transition and failure state.
- [[D2292]] — replace mutable production-table acceptance with committed hermetic fixtures.
- [[D2293]] — separate raw legacy bytes from validated `ClockReading` projections.
- [[D2294]] — re-measure at selected-game grain; the finished fixture is 9/10, not 10/10.
- [[D2295]] — declare the complete durable SQL image, including `timeControl` if persisted.

Exact review and executable checks:
`planning/time-controls/recorded-clocks-fresh-independent-buildability-review-2026-08-30.md` and
`make recorded-clocks-fresh-review` (11/11 green). The original criteria below remain historical
author input; they are not an implementation authorization while this return stands.

## Acceptance criteria

Each names what a wrong implementation would do to pass it.

1. **Vocabulary preserved.** `clock_zeroed`, `timingWindows`/`luxuryMoveBudget` and `TempoVerdict`
   are byte-unchanged. *Wrong impl that would pass without this: one that renames a shipped
   transition subkind to free up the word "clock".*
2. **No unsourced duration.** A negative fixture: a renderer emitting a duration not traceable to a
   recorded `[%clk]`, a declared `timeControl`, or a `createdAt` delta fails. *Without this, a
   plausible interpolated number ships and reads as measured.*
3. **No run-level time field.** `DrillRun` (`types.ts:318-333`) and `CreateRunInput`
   (`runtime.ts:35-42`) carry no time-typed field. Red if a pooled budget is added. *This is R2's
   test; prose alone would not catch a one-field altitude slide.*
4. **Legacy `clockState` quarantine.** A run whose node carries a non-conforming `clockState`
   replays byte-identically and renders nothing. *Without this, narrowing silently drops
   persisted bytes.*
5. **`null` ≠ `[]`.** A game not yet parsed and a game parsed with no clocks render **different**
   sentences. *A wrong impl collapses both to "no clock data", turning an unexamined state into a
   claim.*
6. **Per-field abstention.** The broadcast fixture (readings present, `timeControl` absent)
   renders the readings and states the control's absence, inventing no control. *Numbers: 902
   readings, 0 controls in `finished-round-QxNfeqHA.pgn`.*
7. **Imported runs abstain on the measured arm.** A run imported via `service.ts:829` renders no
   own-time figure. *A wrong impl prints `0s`, which is a duration that means "not recorded".*
8. **Voice.** The paired sentence contains no word in `BANNED_JUDGEMENTS`. *Without this, "great"
   re-enters through the feature named after it.*
9. **Prevalence re-measured at landing** over the real `imported_games` table, with the abstention
   path exercised by at least one row. Fails if every row has clocks — *an abstention path no
   fixture reaches is [[D444]]'s class.* Drafting figures to beat: 108/108 paste-path coverage,
   6,991 tags, 0/20 broadcast controls.
10. **Composition untouched.** `play-composition`'s 16-state list is byte-unchanged.
11. **`AssistanceConfig` stays at version 4.** *A wrong impl adds a clock-display preference and
    silently collides with `play-composition` criterion A11.*
12. **Retroactivity.** A game imported **before** this RFC lands yields readings after it lands,
    with no re-import. *This is the claim that the data was already in the database; without a
    test it is an assertion.*

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | Real clocks in native matches — server-authoritative decrement, flag-fall as a fifth terminal producer, the `terminal_reason` CHECK widening, unrated in v1, no bot clock | `claude` | the successor RFC's registration | |
| D2 | [[D364]]'s two owner-tier `design/06` §5 amendments (the pursuit-clock sentence and the legibility/power dichotomy) and the run-pooled refusal in writing | `OWNER` | the ruling's landing commit | |
| D3 | Does a drill's pressure ever *fail* the learner (enforced) or stay informational? Gap 3 of the derivation; if enforced, [[D357]]'s cheating gradient re-opens | `OWNER` | `planning/platform-alignment/decision-queue.md` | |
| D4 | Time as a longitudinal observation — `longitudinal-store.md:266-270` already licenses it as a rev bump, and **the time budget must enter the decision key or two decisions at one FEN pool silently** | `claude` | that store's next rev | |
| D5 | Implementation | `codex` | the implementing commit | |

## Open questions

1. **⚖️ Does the *depicted* readout belong nearer the board than the companion region?** The
   derivation's cost 1: a rail seat is further from the board than any competitor's. Unmeasurable
   from a document; an owner-use question.
2. **⚖️ [[D357]]'s residue survives [[D1061]].** The hint-ladder *ordering* precondition is
   satisfied — hint distance is ruled — but D317's criterion (*an item is cheating iff
   `distance === "move"` while a committing decision depends on it*) is about the **pre-commit
   availability of the top rung**, which D1061 does not settle. This RFC is unaffected, because a
   depicted past clock creates no time pressure on a live decision. **The successor is affected**
   and must not proceed as if the question were closed.
3. Does `timeControl` join the rung identity when timed play is eventually rated?
   `bot-policy.md:592` measures ~230 Elo of drift across controls for the same model against the
   same pool, so a rung calibrated at one control does not transfer. Deferred with D1.

## Ledger rows (proposed — renumber at landing; head D1120 at drafting)

- **new 📊** — the paste path carries clocks essentially always: 108/108 games with `[%clk]` and
  `[TimeControl]`, 6,991 tags, over `tools/r2-selection-harness/imported-sample.pgn`; broadcast
  carries 1,158 readings across 20 games and **0** declared controls. Settles [[D362]]'s
  abstention-first instruction in favour of "feature", and pins the abstention as per-field.
- **new 🐞** — `BotProfileDeclaration.calibration` (`apps/server/src/bot-policy-catalog.ts:112-116`)
  is a second declared-and-unpopulated field in the time domain, `clockState`'s sibling. This RFC
  types one of the two and pins the shared `"600+0"` serialisation; the other stays unpopulated.
- **new 🐞** — [[D330]]'s row states `clockState` is on `DrillRun` and the start options. It is on
  `Node` and `CommitMoveOptions` (§4.1). [[D355]] found this; the row was never edited.
- **new 💡** — `campaign-core` Discharge D4's parenthetical (*"time controls — nothing exists to
  build on, `clockState` is an untyped passthrough"*) is falsified by this RFC and should re-point
  from `planning/campaign/` to `planning/time-controls/`.

## Changelog

- 2026-08-23 — drafted from `planning/time-controls/rfc-derivation.md` under [[D1093]]'s mandate
  and [[D1041]]'s lane ruling. Scoped to the derivation's Stage 1 on its own recommendation: the
  real-clock arm touches five accepted documents and two unruled owner forks, and does not fit
  here. Stage 0's prevalence measurement (gap 17) was run before drafting and is §2.
