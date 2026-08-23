# RFC: Return scheduling — repairing the ladder, and the return queue the training tradition asks for

- **Status:** draft — 2026-08-23
- **Author:** claude
- **Created:** 2026-08-23
- **Design refs:** `design/01-training-model.md` §blocked/varied repetition (`:55-79`); `docs/return-and-progression.md` (the shipped surface contract)
- **Exploration gate:** [[D1310]] — the drafting mandate is the owner's instruction (*"make sure we have all the DEPTH and BREADTH"*), not [[D1093]]'s example list of three lanes. This lane traces directly to two owner asks quoted in §0. `planning/routing-queue.md:67` names *"research and specify … before implementation"* as the next lawful action and this document is that specification
- **Depends on:** the shipped `attempts` and `schedules` tables (`apps/server/src/storage.ts:4102-4170`); `rfc/enforced-clocks.md` (draft) for anything clock-shaped — consumed, never re-derived
- **Parent / amends:** **supersedes `rfc/archive/return-and-progression.md` §7** (the auto-schedule trigger and ladder). Answers [[D864]], [[D865]], [[D866]], [[D860]]. Routes in [[D861]] and [[D865]] from `rfc/skills.md`'s own ledger row 7
- **Supersedes / superseded by:** supersedes `rfc/archive/return-and-progression.md` §7 only; §§1-6 and 8-14 of that RFC stand
- **Planning:** `planning/training-methods/`

```tabiya-claims
none
```

## Summary

The shipped return ladder does not compute what its own accepted RFC specifies, and **two
independent defects in one expression mask each other**, so the divergence is invisible on
exactly the histories a reader would spot-check. A root the learner **failed four times and
then passed twice** is scheduled **35 days out** where the accepted RFC says **1 day**. No
test asserts an interval, so nothing caught it.

This RFC repairs that expression, then specifies the return queue the training tradition
actually asks for — lapse-aware step-down, difficult roots, corpus-frequency ordering,
overstudy accounting, vacation safety, and the variation name that varied repetition has
always promised and never delivered. Every item here runs **over shipped tables**: no pack
field, no schema lane, no migration, no new table.

The tradition's own verdict, from `design/research/titled-player-training.md:11-19`, is the
reason this document is mostly repair and wiring rather than invention:

> *"three of the most famous training methods in chess history are **already shipped in this
> product as end-to-end mechanisms with zero consumers** … The tradition does not ask this
> product for new machinery; it asks for wiring and authored content."*

## §0. The two owner asks this lane answers

> *"How about 'traditional programs'? How do IMs/GMs train/prepare? Some of that might
> enhance our drill pack features."* — `design/research/titled-player-training.md:3-4`

> *"what else makes Chessable so appealing? Some of that might enhance our drill pack
> features."* — `design/research/chessable-movetrainer.md:6-7`

Both end in the same clause, which is why this document's output is capabilities traced to
measured findings and not a competitor feature table. Neither ask has a ledger row of its
own — a law-4 gap recorded in §11.

**Scope split.** The pack-format half of the answer — pass marks, the guided first pass,
tempo sets — is `rfc/pack-training-forms.md`, drafted alongside this one. The split is
**failure isolation, not a scope cut**: §1 is a defect against an accepted RFC and must not
wait behind an unruled pack field. Nothing is dropped; §12 gives every deferral a home and
an owner.

## §1. The defect: two bugs in one expression, masking each other

### 1.1 What the accepted RFC specifies

`rfc/archive/return-and-progression.md:631-640`, verbatim:

```
VARIED_LADDER_DAYS = [1, 3, 7, 16, 35]

if H is empty                       -> no schedule
if the latest attempt is ungraded   -> varied, k = |H| - 1
else if the last two verdicts are both `stable`
                                    -> varied, k = (trailing stable count) - 2
else                                -> blocked
```

Three arms, and **each arm has its own `k`**. The ungraded arm counts attempts because an
ungraded root has no verdict signal to count. The graded arm counts the *stable streak*,
with its rationale stated at `:645-647` — *"One success is not stabilization."*

### 1.2 What ships

`apps/server/src/storage.ts:2916-2917`:

```js
const ladder = [1, 3, 7, 16, 35];
const days = varied ? ladder[Math.min(Math.max(trailingStable - 1, history.length - 1, 0), 4)]! : 0;
```

**Defect A — the arms are merged by `max`.** `history.length - 1` is the *ungraded arm's*
formula, and the `max` applies it to the graded arm too. Because `|H| - 1` grows with every
countable attempt regardless of verdict, it dominates the streak term on every realistic
history. The interval becomes a function of **how many times you have visited a root**,
which is the one input carrying no information about whether you have learned it.

**Defect B — `trailingStable` is `-1` whenever every attempt is stable.**
`storage.ts:2913-2915` computes it as
`[...history].reverse().findIndex((row) => row.verdict !== "stable")`, and `findIndex`
returns **`-1`** when no element matches. So the best possible history — an unbroken run of
`stable` verdicts — produces `trailingStable = -1`, and the streak term evaluates to `-2`.

**They mask each other.** On an all-stable history the streak term is nonsense (`-2`) and
the merged `|H| - 1` term rescues it to the right answer. On a history with any failure the
streak term is correct and the merged term overrides it with the wrong answer. **A repair
that removes the merge without fixing `findIndex` sends every fully-mastered root from 35
days to 1 day.** That is why this section specifies both, and why criterion 2 fixtures the
all-stable case explicitly.

### 1.3 The measured divergence

**Procedure** (this is the obligation; the table below is a baseline, per [[D1240]]):
transcribe `storage.ts:2910-2918` and `rfc/archive/return-and-progression.md:631-640` into
two pure functions and evaluate both over the verdict histories named in criterion 1.
Executed 2026-08-23:

| History (oldest → newest) | shipped | accepted RFC | raw `trailingStable` | |
|---|---|---|---|---|
| stable, stable | **3 d** | 1 d | **−1** | diverges |
| stable ×3 | **7 d** | 3 d | **−1** | diverges |
| stable ×6 | 35 d | 35 d | **−1** | agrees **by accident** (§1.2) |
| unstable ×4, stable, stable | **35 d** | **1 d** | 2 | diverges by the whole ladder |
| unstable, stable, stable | **7 d** | 1 d | 2 | diverges |
| stable ×5, unstable | 0 d | 0 d | 0 | agrees |
| ungraded ×3 | 7 d | 7 d | 0 | agrees |
| ungraded ×8 | 35 d | 35 d | 0 | agrees |

**Five of eight diverge; one of the three agreements is the masking case.** Read the fourth
row: a root failed four times, then passed twice, and is not shown again for over a month.

### 1.4 Why it survived

`apps/server/src/progress.test.ts` contains exactly one `dueAt`-adjacent line (`:87`, a
fixture input) and **no assertion on an interval at all**. The ladder has never been tested.
This is the [[D444]] shape — a suite that passes while measuring nothing — and it is why
criterion 1 asserts `due_at` **deltas** rather than the existence of a schedule.

## §2. The repaired ladder, and lapse-aware step-down

Both land in `#refreshAutoSchedule`. The constants do not move: `[1, 3, 7, 16, 35]` is
*"a fixed, legible parameter … revisable on stated evidence"* with its revision trigger
named (`rfc/archive/return-and-progression.md:664-668`), and that trigger has not been run.
Changing the constants here would violate that RFC's own provenance clause.

**§2.1 The arms separate.** The ungraded arm keeps `k = |H| - 1`. The graded arm keeps
`k = trailingStable - 2`. Neither borrows the other's term.

**§2.2 `trailingStable` counts.** Replace the `findIndex` with a count that returns `|H|`
when every verdict is stable. The obligation is the semantics, not the implementation.

**§2.3 Step-down, not reset ([[D864]]).** [[D864]] asks for *"step down, don't reset"* and
names Chessable's full-reset-to-level-1 as the anti-pattern. Our lapse behaviour is already
better than that target — a lapse schedules `blocked` and due **now**, a re-drill rather
than a four-hour timer — but the *recovery* is a full reset: after a lapse the streak
restarts, so a root that had climbed to 16 days returns at 1 day.

The step-down is a **retained floor**, derived from the same `attempts` history with no new
column:

- Replay the countable history in order and record `peakK`, the highest ladder index this
  root has ever been served.
- If the root has lapsed since reaching `peakK`, the floor is `peakK - 1`; otherwise `0`.
- `k = clamp(max(trailingStable - 2, floor), 0, 4)` on the graded arm.

A root that never climbed has `floor = 0`, so **§1.3's fourth row still resolves to 1 day** —
the repair is not weakened by the feature. A root that reached 16 days and lapsed resumes at
**7 days**, one rung down, which is the ruled shape rather than a reset.

**§2.4 The blocked arm is unchanged.** `days = 0`, due now.

## §3. Difficult roots ([[D865]])

A `/learn` surface listing the roots a learner repeatedly fails, each linking the preserved
runs where it happened. Chessable's equivalent shows a stat; ours opens the game
(`design/research/chessable-movetrainer.md:247-256` names this as the differentiator).

**Correction to [[D865]]:** the row names `learner_position_stats` as the source. That table
holds `seen_count` **only** (`storage.ts:4165-4170`) and cannot count verdicts. The source is
`attempts` (`:4102-4131`), indexed for exactly this read at `:4131`
(`attempts_root(learner_id, root_key, ended_at)`).

**The threshold is published, not hidden.** Chessable's rule — *"3 or more mistakes and a
review score below level 4"* — is a hidden threshold, which `rfc/skills.md:436-437` refuses
by name. Ours states its counts on the surface. The rule itself is a **selection**, not a
rendered verdict about the learner (§9).

## §4. Corpus-frequency ordering at band ([[D866]])

`dueSchedules` orders by `CASE kind WHEN 'blocked' THEN 0 ELSE 1 END, due_at, id`
(`storage.ts:2640-2646`). [[D866]] asks that equally-due roots be ordered by how often the
position actually occurs at the learner's band.

The data source **ships**: `corpusPopulation(targetElo)` maps an Elo to a Lichess rating band
(`apps/server/src/corpus.ts:139-145`) and `LichessCorpusSource.stats` returns per-move played
counts behind a day-TTL cache (`:85-131`). This is one ordering term over an existing read.

**Law 8 constraint, load-bearing:** frequency orders, it never grades. *"Popularity
establishes common or unusual, never good or bad"* (`rfc/skills.md:166`). The surface may say
*"more common at your level"*; it may not say *"more important"*.

**Ordering is a tie-break, never a re-ordering across due dates.** A root that is due stays
ahead of a root that is not.

## §5. Overstudy accounting

Chessable's off-schedule review is graded **asymmetrically**: wrong resets the timer, right
changes nothing (`chessable-movetrainer.md:61-64`). The rationale is that a learner who
chooses the moment has not demonstrated recall under scheduling pressure.

`attempts.origin` already distinguishes `fresh` / `duplicate` / `scheduled` / `in_run_retry`
(`storage.ts:4124`). The rule: **an attempt whose `origin` is not `scheduled` may demote the
ladder position but may never advance it.** No new field; one condition in the replay of §2.3.

## §6. Vacation safety

A learner who returns after an absence should not meet a wall of overdue roots. The explicit
schedule endpoint ships (`POST /runs/:id/schedule`, `rest.ts:1526-1533`), so the obligation is
a bounded intake rule on `/progress/due` rather than new storage.

**This is the one item that touches [[T3]]'s live constraint** (`league-as-return-loop.md`,
`design/BACKLOG.md:1344`): the ladder is *"the evidence-backed lever"* and *"the single
licensed upgrade is to make the spacing imposed rather than freely dismissible."* Vacation
protection **defers** items without letting the learner choose intervals, so it upgrades the
imposition rather than weakening it. **Chessable's custom-interval setting is refused here for
that reason** — §12 records it with the evidence it would have overridden.

## §7. The variation nobody sees

Varied repetition promises *"same position, new defense · related position, same idea · same
structure, opposite side · same outcome, different material details"*
(`design/01-training-model.md:72-79`, mirrored in `packages/schema/src/drill-pack/types.ts:26-33`).
The runtime names none of them. Measured, three ways:

| Fact | Site |
|---|---|
| the auto scheduler writes `variant` as a literal `NULL` | `storage.ts:2923` |
| only the learner-supplied explicit path can set it, as free text | `rest.ts:1528-1535`, `service.ts:1951` |
| nothing **reads** it for any decision | grep over `apps/`, `packages/` |
| the accepted RFC specified it as a rotation over the pack's `retryVariants` | `rfc/archive/return-and-progression.md:658-666` |
| `retryVariants` is disposed **`refused`** — *"a catalogue relation, not a run modifier; it names no executable referent and `variantOf` is not yet a superset"* | `packages/schema/src/drill-pack/dispositions.ts:77-82` |
| its lint is **warning** severity, so packs carrying it still validate | `apps/server/src/pack-validation.ts:1120-1126` |
| **7 packs author it anyway** | measured over `content/**/*.json`, 2026-08-23 |

**Correction to [[D1035]]:** that row calls `schedules.variant` *"the spaced-repetition
blocked/varied column"*. It is not — `kind` is that column (`storage.ts:4152`,
`CHECK (kind IN ('blocked','varied'))`). `variant` is the *name of the variation to try*, and
it is dead.

**Ruled fate: LIFT, narrowly.** The refusal is correct about `retryVariants` as a *catalogue
relation* and wrong that it *"names no executable referent"* — the referent is the varied
schedule's `variant`, which the accepted RFC specified and the auto path hardcodes to NULL.
This RFC lifts the refusal **for the scheduler read only**: the auto path rotates `variant`
through the pack's declared `retryVariants` by `k`, and the surface names the variation.
`variantOf` remains the successor for the catalogue-relation use the disposition was written
about, and nothing here makes `retryVariants` a run modifier.

**This is a capability, not a schema change.** The field already validates and seven packs
carry it; what changes is that the runtime now *reads* it. Under
`rfc/pack-capability-contract.md` that is a declared capability, recorded as Discharge D3
rather than claimed as a lane here.

## §8. Guess-the-move on imported games ([[D860]])

Purdy's solitaire chess is the tradition's most-transferable exercise and its machinery is
**shipped and locked out**: `prediction.recorded` stores `predictedMass` and `predictedRank`
against the Maia distribution, so a solitaire score is law-8-clean by construction — the
reference is *the move actually played and how human the guess was*, never a grade.

**0 of 92 packs carry a `prediction` interaction** (census, §10), and the pack gate refuses
an imported game. The gate is `#requiredRegisteredPack` in `apps/server/src/service.ts`,
with the effective refusal the compound condition emitting *"Unknown prediction checkpoint"*.

**Cite the symbol and the error string, never the line.** `#requiredRegisteredPack` appears
at ten sites in that file, and `service.ts:1204` — the number this gate carried — is stale in
**three living documents including the accepted `rfc/longitudinal-store.md:229`** (§11).

`rfc/longitudinal-store.md:136-149` already types `decision_class ∈ {played, game, predicted}`
for this exact event: **the accepted store is waiting on a producer that this gate blocks.**

**Scope line.** [[D869]] is already ruled for both the standalone and campaign-encounter arms.
The encounter arm belongs to `rfc/campaign-core.md`'s Discharge D2 — **this RFC supplies the
gate lift and the first consumer, and adds no encounter class.**

## §9. Law 8 — why a training method is admissible, and where the line is

Law 8 forbids LLM-manufactured **chess truth**: an ungrounded strategic claim, or a move
grade. A training method is a claim about **how to get better** — pedagogy about a person,
not truth about a position. *"Solve before you check"*, *"return at spaced intervals"*,
*"drill the same set faster"* name no move and evaluate no position. **A training method is
therefore not automatically forbidden.**

The line is crossed at exactly one place: **when the method needs a move-level judgement to
advance its own state.**

| Mechanic | Needs a move-level claim? | Verdict |
|---|---|---|
| Ladder advances on the **objective verdict** (`stable`/`unstable`/`open`) | no — rules-arithmetic resolution of an authored objective | **clean, and this is what ships** |
| Difficult roots from counted unstable verdicts | no — counting recorded outcomes | clean |
| Corpus-frequency ordering at band | no — *"common or unusual, never good or bad"* | clean as ordering; **forbidden as a valence** |
| Guess-the-move score against the Maia distribution | no — the reference is the played move | clean by construction |
| Chessable's engine-vetted **soft fail** (0.3 cp / mate-preserving / tablebase-equivalent) | **yes** — an engine margin decides whether an alternative counts | admissible **only** as a disclosed convention (`rfc/skills.md:163`); **an LLM may never author the margin.** Not adopted here |

**§9.1 Selection versus rendering.** `rfc/longitudinal-store.md:462-465` — *"selection, yes;
rendering, never."* A due date **selects**: it says *serve this root next*, and asserts nothing
about the learner in the product's voice. `docs/return-and-progression.md:47-50` already holds
the line — `/learn` *"deliberately presents no mastery percentage."* Everything in §§2-8
selects.

**§9.2 What this RFC does NOT render.** No per-root maturity **level** — a number about the
learner, refused twice (`rfc/skills.md:434-435`, and by [[D1151]]'s reasoning). No ratio, no
`n/m` mature-roots counter. No hidden threshold. A per-root **return event** — *"returned
2026-08-14 · next due 2026-09-18 · open the run"* — is admissible in exactly the form
`rfc/skills.md:378-381` admits a mark, and is what `/learn` shows.

**The categorical word is unruled and this RFC does not decide it** — open question 1.

## §10. The pack census, as a procedure

**Procedure** ([[D1240]] — the criterion asserts set-equality against this command, and the
integers below are a drift tripwire only): walk `content/**/*.json`, select objects carrying
all of `mode`, `opponentPolicy` and `objective`, then count the fields named. **A grep for a
mode name does not do this**, and is what produced [[D863]]'s wrong number (§11).

Measured 2026-08-23 — **92 pack files of 404 JSON files**:

| Dimension | Distribution |
|---|---|
| `mode` | outcome 42 · line 32 · plan 14 · trajectory 4 |
| root `opponentPolicy.mode` | human_common 55 · theory_strict 34 · **perfect_tablebase 2** · strong_engine 1 |
| checkpoint interactions | intent_capture 51 · stated_reasoning 1 · **prediction 0** |
| `timingWindows` | 4 packs — **all `spendAtLeast`, zero `verdict`** |
| `retryVariants` | 7 packs |
| `concepts` | 50 packs |

## §11. Stale citations this RFC repairs

| Claim | At HEAD |
|---|---|
| [[D863]] and `titled-player-training.md:275`: `perfect_tablebase` has *"6 content files"* | **2 packs.** The other four hits are `/provenance/graduationBlockers/4/statement` prose in three mate-technique packs plus `content/accepted-conditions.md`. The Dvoretsky wiring is three times thinner than the ledger says |
| `titled-player-training.md:337-347`: timing windows have *"zero authored users"* | **4 packs** consume `atWindow: {windowId, spendAtLeast}`. **Zero** use the `{windowId, verdict}` arm and zero objectives carry a `timing_window` condition — a sharper and cheaper content gap than the row states |
| `service.ts:1204` as the prediction gate — in [[D860]], `titled-player-training.md:315`, **and accepted `rfc/longitudinal-store.md:229`** | stale; cite `#requiredRegisteredPack` and the *"Unknown prediction checkpoint"* string (§8) |
| [[D865]]'s source `learner_position_stats` | holds `seen_count` only; the source is `attempts` (§3) |
| [[D1035]]: `variant` is *"the spaced-repetition blocked/varied column"* | `kind` is that column; `variant` is the retry-variant name and is dead (§7) |
| **Neither owner ask has a ledger row** — law 4 | the asks live in dossier headers only; the ledger holds the rows the dossiers *produced* ([[D860]]–[[D868]]) but not the questions that commissioned them |

## §12. What this RFC refuses, and why

| Refused | Ground |
|---|---|
| **Re-graining the scheduler to the move** | Chessable's SRS unit is the move; ours is the attempt at a root (`design/01-training-model.md:55-58`). [[D864]] states the transformation: *"the unit stays the position-with-consequences, never the card."* An RFC that quietly re-grains has changed the product |
| **Custom learner-set intervals** | `league-as-return-loop.md` found the ladder is the evidence-backed lever and *"the single licensed upgrade is to make the spacing imposed rather than freely dismissible"* (`design/BACKLOG.md:1344`). Vacation safety (§6) is adopted; custom intervals are not |
| **Moving the ladder constants** | The accepted RFC pins them with a named revision trigger that has not been run |
| **Hidden thresholds** | `rfc/skills.md:436-437` refuses them by name. §3's counts are published |
| **XP, streaks, leaderboards** | The shipped milestones contract (`docs/return-and-progression.md:49-50`), ADR-0007, and `league-as-return-loop.md`. The dossier itself ranks them last (`chessable-movetrainer.md:294-302`) |
| **A repetition mechanic inside a campaign node** | `rfc/campaign-core.md:125-127` forbids node re-entry after seal, so it is unimplementable by that contract. Cycles are `/learn` and Just Play objects |
| **Routing the scheduler through `learner_observations`** | That store has **zero code at HEAD**, is contested ([[D973]]/[[D1011]]), and registers no scheduling consumer. `attempts` is the scheduler's history and predates it |
| **Peer critique of learner analysis** | Law 8 — it needs generated judgement (`titled-player-training.md:371-374`). Sharing ships; the critique cannot |
| **de la Maza's Seven Circles as popularly shipped** | Trainer consensus against (`titled-player-training.md:178-191`). Only the recognition-sized, Woodpecker-corrected form may inform a feature, and that restriction is **pack-declared, not learner-chosen** — `rfc/pack-training-forms.md` |

## §13. Deviations from design

**One.** `design/01-training-model.md:72-79` names four varied-repetition kinds as though the
runtime serves them; §7 measures that it serves none. This RFC makes the design true rather
than amending it, so no intent-tier change is requested.

## Acceptance criteria

1. **The ladder fixture, over the eight histories of §1.3.** A test drives the real
   `#refreshAutoSchedule` and asserts the `due_at` **delta in days** for each. *Wrong
   implementation that passes today:* the shipped one — `progress.test.ts` asserts no
   interval at all, so the suite is green against a ladder that diverges on five of eight.
2. **The masking case is pinned separately.** An all-stable history of length ≥ 6 asserts
   35 days **and** a unit assertion that the trailing-stable count is `6`, not `-1`.
   *Wrong implementation that passes:* one that repairs the merge (Defect A) and leaves
   `findIndex` (Defect B) — it returns 1 day for a mastered root, and criterion 1 alone
   would catch it only on that row.
3. **Step-down retains, and does not weaken the repair.** Two arms: a root that reached
   `k = 3` then lapsed then recovered schedules at **7 days**; a root that never climbed and
   matches §1.3's fourth row schedules at **1 day**. *Wrong implementation that passes one
   arm:* a full reset passes the second and fails the first; an unconditional floor passes
   the first and fails the second.
4. **Overstudy cannot advance.** A `scheduled` attempt and an otherwise-identical `fresh`
   attempt over the same history produce ladder positions where the `fresh` one is `≤` the
   `scheduled` one, with one fixture where they differ.
5. **Difficult roots read `attempts`.** The query is asserted to reference `attempts` and
   **not** `learner_position_stats`; a fixture with three unstable verdicts on one root and
   `seen_count = 0` returns that root.
6. **Frequency orders only within a due date.** A fixture where a rarer root is due earlier
   asserts it still sorts first. *Wrong implementation that passes a naive test:* one that
   sorts by frequency globally and re-orders across due dates.
7. **Frequency never renders a valence.** A grep-shaped assertion that the surface strings
   for §4 contain no comparative-quality term, with a listed vocabulary.
8. **`variant` is named.** A pack declaring `retryVariants` produces a varied schedule whose
   `variant` is non-NULL and rotates with `k`; a pack declaring none produces NULL and the
   surface says the variation is a fresh opponent seed.
9. **The prediction gate lifts for imported games.** An imported game reaches a `prediction`
   checkpoint and emits `prediction.recorded` carrying `predictedMass` and `predictedRank`.
   The negative arm asserts the refusal string is unreachable for that path.
10. **The census is a set-equality.** A test asserts the §10 distribution set-equal to the
    output of the census procedure, with the integers as a drift tripwire only.
11. **No versioned resource moves.** `register-check` is green with this RFC active and its
    `tabiya-claims` block reads `none`; a test asserts no `schedules` or `attempts` column is
    added.
12. **No mastery number renders.** The `/learn` payload for a scheduled root is asserted to
    carry no percentage, no ratio and no ladder index. *Wrong implementation that passes a
    prose check:* one that ships the index as a numeric field the client happens not to
    render — the assertion is over the payload, not the template.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | The ladder repair and step-down, over the real `#refreshAutoSchedule` | codex | this RFC's implementing commit | |
| D2 | The categorical maturity vocabulary — open question 1 | OWNER | `planning/platform-alignment/decision-queue.md` | |
| D3 | `retryVariants` becomes a declared capability under `rfc/pack-capability-contract.md`, since the runtime now reads it | claude | that RFC's capability census | |
| D4 | Repair `rfc/longitudinal-store.md:229`'s stale `service.ts:1204` citation | claude | the amending commit | |
| D5 | The pack-format half — pass marks, guided first pass, tempo sets | claude | `rfc/pack-training-forms.md` | |
| D6 | [[D863]]'s content wave, with §11's corrected targets (2 packs not 6; the timing **verdict** arm) | claude | `planning/content-wave-work-order.md` | |
| D7 | The campaign encounter class for prediction | claude | `rfc/campaign-core.md` Discharge D2 | |

## Open questions

1. **⚠ OWNER — may a per-root maturity vocabulary render at all?** The skills lane ruled the
   two ends of this axis this week: a **level** is refused (`rfc/skills.md:434-435`), a
   **mark/event** is admitted (`:378-381`). A categorical word — `learning` / `mature` /
   `difficult` — is neither. Every input is a counted event, and [[D864]] argues the words
   respect the refusal *because* they are not percentages. It is nonetheless a claim about the
   learner's state at a root. Three options, none pre-pruned: **(a)** events only, no word;
   **(b)** categorical words derived from counted verdicts, each reopening its runs;
   **(c)** words plus the ladder position shown — which is (b) plus the refused number.
   **Not acceptance-blocking:** §§2-8 ship under (a), which is the shipped surface's current
   behaviour.
2. **Does the due queue re-order by frequency, or gain a second surface?**
   `storage.ts:2644` is one `ORDER BY`; changing it changes every learner's queue, and adding
   a surface duplicates it. §4 specifies the tie-break reading; a reviewer may prefer the
   second surface.
3. **Should the step-down floor decay?** §2.3 retains `peakK - 1` indefinitely. A root
   lapsed repeatedly over a year arguably should not keep a floor earned once. Left
   un-decayed because any decay rate is unevidenced, and the revision trigger at
   `rfc/archive/return-and-progression.md:664-668` is the mechanism for setting one.

## Ledger rows

Proposed — id assigned at landing; head was **D1310** at drafting.

- 🐞 **The return ladder has two defects in one expression and they mask each other.**
  `storage.ts:2917` merges the ungraded arm's `|H|-1` into the graded arm via `max`, and
  `:2913-2915` computes `trailingStable` with `findIndex`, which returns **−1** when every
  verdict is stable. Five of eight measured histories diverge from
  `rfc/archive/return-and-progression.md:631-640`; a root failed four times then passed twice
  schedules at **35 days** where the accepted RFC says **1 day**; and one of the three
  agreements is the masking case, so **repairing either defect alone makes mastered roots
  worse**. `progress.test.ts` asserts no interval at all.
- 🐞 **[[D863]]'s `perfect_tablebase` count is a grep artifact: 2 packs, not 6.** The other
  four hits are graduation-blocker prose in three mate-technique packs plus
  `content/accepted-conditions.md`.
- 🐞 **Timing windows have four authored users; the timing *verdict* has none.** Four packs
  consume the `spendAtLeast` arm; zero use the `verdict` arm and zero objectives carry a
  `timing_window` condition.
- 🐞 **`service.ts:1204` is stale in three living documents including an accepted RFC.**
  `#requiredRegisteredPack` appears at ten sites, so a line-only citation cannot survive.
- 🐞 **[[D865]]'s named source cannot do the job.** `learner_position_stats` holds
  `seen_count` only; a difficult-roots surface must read `attempts`.
- 💡 **Varied repetition names a variation nobody sees.** `schedules.variant` is written NULL
  by the auto path, settable only as learner free text, read by nothing; the accepted RFC
  specified it as a rotation over `retryVariants`, which is disposed `refused` at warning
  severity — and **7 packs authored it anyway**. Narrows [[D1035]]: `kind` is the
  blocked/varied column; `variant` is the retry-variant name, and it is dead.
- 🐞 **Neither owner ask in this lane has a ledger row** — law 4. The asks live in dossier
  headers; the ledger holds only the rows the dossiers produced.

## Changelog

- **2026-08-23** — drafted from `planning/training-methods/rfc-derivation.md` on [[D1310]].
  Third defect found during drafting and not present in the derivation: `trailingStable` is
  `-1` for an all-stable history, and the merged `|H|-1` term masks it, so the two bugs
  conceal each other and a partial repair regresses mastered roots.
