# D1408 — deriving the single grade ladder, and what each candidate actually does

**For:** Marco · **Prepared:** 2026-08-23 · **Ruling:** [[D1408]] (`design/BACKLOG.md:1697`)
**Amends (through the register, not by direct edit):** `rfc/move-quality-grades.md` (accepted
2026-08-22) §4, and its acceptance criteria 2, 3 and 4
**Shipped surface under discussion:** `packages/runtime/src/grade.ts:26-48` (`GRADE_CONVENTION`)
**Repo HEAD at measurement:** `6c45401` · **Ledger head read:** D1418

---

## 0. What was ruled, and what is owed

[[D1408]] collapses the `practice` ladder (2.5 / 6 / 14 Win%-points) and the `report` ladder
(5 / 10 / 15) into **one set of thresholds used on every surface**, so a move never changes its
label according to which screen the learner is on. The owner accepted the stated cost — the
`report` rungs were set higher so a whole-game report would not cry wolf.

**Which** thresholds was deliberately not ruled. This document derives that and hands it back.

One precision about the ruling's own citation, stated because getting it wrong would propagate:
`rfc/move-quality-grades.md:403-406` (§7.3) names the **rating-conditioning** counter-example —
*"the chess.com pattern where the same move earns different words for different players."* The
cross-**surface** drift is the same shape one level up, and it is [[D1407]] and
`planning/platform-alignment/o7-decision-memo.md:135-147` that state it in those terms. The RFC
refuses per-*player* drift explicitly and permits per-*surface* drift by design (§4's three-context
table). The ruling closes that gap; it is an extension of the RFC's principle, not a quotation
of it `[V]`.

---

## 1. The procedure, not the total ([[D1240]])

This document does not pick three numbers. It runs this procedure, and the procedure is what
binds the amendment:

1. **Establish the evidential status of every existing threshold** — measured, or conventional?
   (§2)
2. **Fix one instrument and three real populations**, one per surface the merge touches. (§3)
3. **Validate the graded quantity against its own source** before comparing ladders — if our
   arithmetic does not reproduce Lichess's own verdicts on Lichess's own evaluations, no
   downstream count means anything. (§4)
4. **Enumerate admissible ladders**, where admissible means *every constant carries a
   `{value, source, pinnedAt}` record* under the §4 D368 discipline the RFC already ships. (§5)
5. **Measure each candidate's consequence on each population, in each direction** — new
   emissions, lost emissions, escalations, de-escalations. (§6)
6. **Choose by a stated criterion over those measurements**, not by preference. (§7)
7. **Check that law 8 does not move** under every candidate. (§8)
8. **Name what the merge loses that no single ladder can recover.** (§9)

Every integer below is a count over a named, digested corpus, reproducible by §12. Where a figure
is extrapolated it is stated as a **rate with its denominator**, never as a total.

---

## 2. What evidence exists for 2.5/6/14 and 5/10/15 today

**Both ladders are conventional. Neither was ever measured — by Lichess or by us.**

| ladder | what is `[V]` | what is not |
|---|---|---|
| `report` 5 / 10 / 15 | The constants exist in `modules/tree/src/main/Advice.scala` as raw winning-chances drops 0.10/0.20/0.30 on the [−1,+1] scale, ×50 to Win%-points. Verbatim-fetched 2026-08-22 and pinned in `grade.ts:30-32` `[V]` | **Why those values.** Lichess publishes no derivation, no population, no calibration study. The choice is authored `[M]` |
| `practice` 2.5 / 6 / 14 | The constants exist in `ui/analyse/src/practice/practiceCtrl.ts` as 0.025/0.06/0.14 over `povDiff`, which halves the [−1,+1] difference, so ×100 to Win%-points. Verbatim-fetched 2026-08-22 and pinned in `grade.ts:33-35` `[V]` | Same. Authored, undocumented, unmeasured `[M]` |

The RFC says this about itself. Its open question 1 reads: *"whether that strictness fits **our**
consequence loop is a validation-by-use question — the owner's play session, not a review, answers
it"* (`rfc/move-quality-grades.md:566-569`) `[V]`. The strictness **ratios** the RFC derived —
2× at inaccuracy, 1.67× at mistake, 1.07× at blunder (§1) — are arithmetic over the two cited
constant sets, not a measurement of anything about chess or about learners `[V]`.

**So the honest starting position is: we are choosing between two conventions, and neither carries
evidence about which is right.** What did not exist until this document is a measurement of what
each *does*. That is what §6 supplies. It measures **consequences**, not correctness — no
measurement in this repo can tell you whether a 7-Win%-point drop deserves the word "mistake".

One thing that *is* measurable and was worth measuring first: whether our implementation of the
report ladder reproduces the tradition it claims to cite. It does — §4.

---

## 3. The instrument and the three populations

**Graded quantity** (unchanged from the RFC §1, and unchanged by every candidate): the drop in
win percentage from the learner's point of view, over Lichess's published logistic, centipawns
clamped to ±1000 before conversion. Exactly `winPercentFromCp` at `packages/runtime/src/grade.ts:95-97`.

```
Win% = 100 / (1 + e^(−0.00368208 · clamp(cp, ±1000)))
drop = Win%(before) − Win%(after)          learner POV, unrounded
```

Three populations, chosen so that each surface the merge touches has one:

| id | surface it stands for | what it is | n |
|---|---|---|---|
| **R** | `review` / `imported_analysis` — club play | The committed R2 Lichess fixture (`tools/r2-selection-harness/imported-sample.pgn`, 108 rated games, 9 speed × rating-band strata), decisions at plies 8/16/24/32/40/48, **complete legal set** probed with Stockfish 18 at depth 12 (MultiPV = legal count), actual human move known | **571 decisions**, 108 games |
| **B** | `review` / `imported_analysis` — master play, **and the external check** | `tools/d947-broadcast-roundtrip-harness/fixtures/finished-round-QxNfeqHA.pgn`, 10 finished broadcast games carrying Lichess's own per-ply `%eval` **and Lichess's own judgement words** | **962 ply pairs**, 59 Lichess-labelled |
| **D** | `drill` | 279 authored-pack positions extracted from `content/drafts` (spine and branch), complete legal set at Stockfish 18 depth 12, joined per-move to **Maia policy at Elo 1400 / 1600 / 1800**. Each legal move is weighted by the probability a human of that band plays it, so rates are *expected* rates per drill decision | **279 positions × 3 bands** |

**Population D is why the drill column is not guesswork.** There is no committed drill-run corpus
with evaluations anywhere in this repo — verified `[V]`; `schemas/drill_run.schema.json:122`
defines `selectionCandidate.scoreCp` and no instance data exists. Weighting the complete legal
set by a human-choice model is the honest substitute: it says *"if a 1400 plays this drill
position, this is the chance the post-commit nudge fires."* It is a model of human choice, not a
record of one — `[P]` for the drill column, `[V]` for R and B.

**Two declared approximations**, both stated because they bound what the numbers mean:

- On R and D, the *before* eval is the MultiPV-1 root score and the *after* eval is that root
  search's score for the played move — the same engine, the same nominal bound, one search. This
  is not literally a second depth-12 search of the after-position as RFC §2 specifies. It is one
  ply shallower on the after side. **It is identical across every candidate**, so it cannot move
  any class-change count in §6; it can move the absolute grade rates slightly `[V]`.
- Population R samples 6 plies per game (8 through 48), not whole games. Every per-game figure
  below is therefore reported as a **rate with its denominator**, and the ×40 extrapolations are
  labelled as extrapolations.

**Instrument sensitivity, measured, so you can tell signal from noise.** On population D the same
measurement at Stockfish depth 8, 10 and 12 moves the practice-ladder grade rate by 2.5
percentage points (29.0 → 29.5 → 31.5 % at Maia-1400) while the report-vs-practice gap at fixed
depth is 14.9 points (16.6 vs 31.5 %) `[V]`. **The ladder choice is roughly six times larger than
the instrument's depth sensitivity** — the question is answerable above the noise floor.

---

## 4. A new `[V]` result: the report ladder reproduces Lichess's own verdicts, 99.6 %

Population B carries Lichess's own `%eval` per ply **and** Lichess's own words. Recomputing our
grade from *their* evaluations and comparing to *their* labels tests the whole chain — the
logistic, the clamp, the perspective normalisation, and the ×50-vs-×100 correction [[D939]] made
at cross-review — against the tradition's actual output rather than against a reading of its
source.

**Report ladder 5 / 10 / 15, 956 eval-delta pairs:**

| Lichess said ↓ / we say → | (nothing) | inaccuracy | mistake | blunder |
|---|---|---|---|---|
| (nothing) | 893 | 3 | 1 | 0 |
| inaccuracy | 0 | **38** | 0 | 0 |
| mistake | 0 | 0 | **8** | 0 |
| blunder | 0 | 0 | 0 | **13** |

**952 / 956 = 99.6 % exact agreement. All 59 of Lichess's own labelled moves are reproduced
exactly, with zero misses in either the class or the emission** `[V]`.

This is the strongest confirmation available that [[D939]]'s correction was right: under the
pre-correction 10/20/30 reading every one of those 59 labels would have come out a class low or
absent. It also means the shipped `grade.ts` report path is verified against the tradition's
output, not merely against its source text.

**The same test against the practice ladder 2.5 / 6 / 14 gives 849 / 956 = 88.8 %** — 78 moves
Lichess declines to judge become "inaccuracy", and 28 moves Lichess calls "inaccuracy" become
"mistake" `[V]`.

**The four false positives are one finding, and it is not about the ladder.** Their pre-move
evaluations were +4.67, +7.63 and −6.78 pawns, and the fourth sits 0.05 Win-points above the rung
(0.00 → −0.55). Lichess appears to suppress judgements in already-decided positions; our
convention has **no such rule**, and `grade.ts` will grade a 12-point drop from +4.67 to +2.67
that Lichess passes over in silence `[V]` for the behaviour, `[M]` for the attribution of a
suppression rule to Lichess (not verified at their source in this pass). This is independent of
D1408 — it is live at HEAD today — but it interacts with it, because a lower floor produces more
of these. §11 proposes the ledger row.

---

## 5. The admissible candidates

Admissible means **every constant carries a `{value, source, pinnedAt}` record**, the structural
D368 discipline the convention table already enforces (`grade.ts:14-24`, acceptance criterion 2).
That is a real filter, and it is the reason the obvious "split the difference" answer scores badly.

| candidate | thresholds | citation status of each constant |
|---|---|---|
| **report-everywhere** | 5 / 10 / 15 | all three `[V]` Advice.scala |
| **practice-everywhere** | 2.5 / 6 / 14 | all three `[V]` practiceCtrl.ts |
| **hybrid-floor** | 2.5 / 10 / 15 | 2.5 `[V]` practiceCtrl.ts; 10, 15 `[V]` Advice.scala. Each value pinned; **the composition is ours** |
| **hybrid-mid** | 2.5 / 6 / 15 | 2.5, 6 `[V]` practiceCtrl.ts; 15 `[V]` Advice.scala. Same status |
| **midpoint** | 3.75 / 8 / 14.5 | **no constant is cited.** Arithmetic mean of the two ladders. `[M]` |

**On the two hybrids.** The D368 discipline is per-constant, not per-set: a hybrid's citation
records are all real and all point at shipped Lichess source. What is ours is the *choice of
which cited constant to use at each rung*, and that must be declared as such in the convention
text — the values are the tradition's, the set is Tabiya's, derived by this document. That is an
honest and checkable posture, and it is materially different from inventing a number.

**On midpoint.** It is included so the option is visible with its cost, not because it is
recommended. Adopting it means three constants whose `source` field would have to read *"Tabiya,
derived 2026-08-23"* and whose `pinnedAt` obliges re-measurement — converting a cited chess
tradition into a Tabiya assertion, which is precisely the exchange the convention document was
built to avoid. It also buys nothing: §6 shows it is dominated on every axis.

---

## 6. Measured consequences

### 6a. The drop distribution — where the rungs actually sit

Population R, 562 eval-delta decisions (the other 9 resolve on the ladder-invariant mate arm):

| drop band (Win%-points) | decisions | share | who disagrees about this band |
|---|---|---|---|
| [0, 2.5) | 346 | 61.6 % | nobody — silence under every candidate |
| **[2.5, 5)** | **84** | **14.9 %** | **the whole floor question** — graded by practice, silent under report |
| [5, 6) | 18 | 3.2 % | nobody — inaccuracy under both |
| **[6, 10)** | **52** | **9.3 %** | **the mistake rung** — mistake under practice, inaccuracy under report |
| [10, 14) | 22 | 3.9 % | nobody — mistake under both |
| [14, 15) | 3 | 0.5 % | the blunder rung — blunder under practice, mistake under report |
| [15, ∞) | 37 | 6.6 % | nobody — blunder under both |

Percentiles: p50 = 1.29, p75 = 4.67, p90 = 11.02, p95 = 19.08, max = 80.04, mean = 4.22 `[V]`.

**The two ladders genuinely disagree about only three bands, and one of them holds 84 decisions
while another holds 3.** The floor is the whole argument; the blunder rung is a rounding
difference.

### 6b. Population R (club play, 571 decisions, 108 games) — what each candidate emits

| candidate | silent | inaccuracy | mistake | blunder | graded | graded rate |
|---|---|---|---|---|---|---|
| report 5/10/15 *(review today)* | 430 | 70 | 25 | 37 | **132** | 23.5 % |
| practice 2.5/6/14 *(drill today)* | 346 | 102 | 74 | 40 | **216** | 38.4 % |
| hybrid-floor 2.5/10/15 | 346 | 154 | 25 | 37 | **216** | 38.4 % |
| hybrid-mid 2.5/6/15 | 346 | 102 | 77 | 37 | **216** | 38.4 % |
| midpoint 3.75/8/14.5 | 389 | 83 | 52 | 38 | **173** | 30.8 % |

### 6c. Population R — class changes, in each direction, on each surface

**Review surface** (what changes for a move the learner sees on the Review Map / imported analysis,
relative to today's `report`):

| move to → | total changed | — → inaccuracy (new grade) | inaccuracy → mistake | mistake → blunder |
|---|---|---|---|---|
| practice 2.5/6/14 | 139 (24.7 %) | 84 | 52 | 3 |
| **hybrid-floor 2.5/10/15** | **84 (14.9 %)** | **84** | **0** | **0** |
| hybrid-mid 2.5/6/15 | 136 (24.2 %) | 84 | 52 | 0 |
| midpoint 3.75/8/14.5 | 70 (12.5 %) | 41 | 28 | 1 |

**Drill surface** (what changes for a post-commit nudge, relative to today's `practice`):

| move to → | total changed | inaccuracy → — (**nudge disappears**) | mistake → inaccuracy | blunder → mistake |
|---|---|---|---|---|
| report 5/10/15 | 139 (24.7 %) | **84** | 52 | 3 |
| hybrid-floor 2.5/10/15 | 55 (9.8 %) | **0** | 52 | 3 |
| **hybrid-mid 2.5/6/15** | **3 (0.5 %)** | **0** | 0 | 3 |
| midpoint 3.75/8/14.5 | 69 (12.3 %) | **43** | 24 | 2 |

### 6d. Population B (master broadcast, 956 pairs) — including agreement with Lichess

| candidate | silent | inacc | mist | blun | graded | rate | grades / player-game | agreement with Lichess's own labels |
|---|---|---|---|---|---|---|---|---|
| report 5/10/15 | 893 | 41 | 9 | 13 | **63** | 6.6 % | 3.1 | **99.6 %** |
| practice 2.5/6/14 | 818 | 88 | 37 | 13 | **138** | 14.4 % | 6.9 | 88.8 % (28 of Lichess's 59 labels change word) |
| hybrid-floor 2.5/10/15 | 818 | 116 | 9 | 13 | **138** | 14.4 % | 6.9 | 91.7 % — all 79 disagreements are *added* emissions; **0 of Lichess's 59 labels change word** |
| hybrid-mid 2.5/6/15 | 818 | 88 | 37 | 13 | **138** | 14.4 % | 6.9 | 88.8 % (28 of Lichess's 59 labels change word) |
| midpoint 3.75/8/14.5 | 862 | 61 | 20 | 13 | **94** | 9.8 % | 4.7 | 95.2 % (and **11 of Lichess's 59 labels change word**) |

Class changes on B, relative to `report`: → practice = 103 (75 new inaccuracies + 28
inaccuracy→mistake); → **hybrid-floor = 75, all of them new emissions and nothing else**;
→ hybrid-mid = 103; → midpoint = 42.
Relative to `practice`: → hybrid-floor = 28 (all mistake→inaccuracy); → **hybrid-mid = 0**.

### 6e. Population D (drill, Maia-weighted, Stockfish depth 12) — probability the nudge fires

| candidate | Maia 1400 | Maia 1600 | Maia 1800 |
|---|---|---|---|
| report 5/10/15 | 16.6 % | 14.5 % | 12.4 % |
| practice 2.5/6/14 | 31.5 % | 28.8 % | 26.0 % |
| hybrid-floor 2.5/10/15 | 31.5 % | 28.8 % | 26.0 % |
| hybrid-mid 2.5/6/15 | 31.5 % | 28.8 % | 26.0 % |
| midpoint 3.75/8/14.5 | 23.4 % | 21.1 % | 18.7 % |

**Adopting `report` everywhere removes 47 % of all drill nudges** (31.5 → 16.6 at Maia-1400;
49.6 % at 1600; 52.3 % at 1800) `[P]`. Word mix under hybrid-floor at Maia-1400: 24.9 %
inaccuracy, 3.4 % mistake, 3.2 % blunder.

### 6f. The cry-wolf figure the owner accepted, stated as a number

Population R, decisions per game over the 6 sampled plies (108 games):

| candidate | 0 graded | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|---|
| report | 30 | 41 | 24 | 9 | 4 | 0 | 0 |
| practice / hybrid-floor / hybrid-mid | 11 | 27 | 37 | 22 | 7 | 3 | 1 |
| midpoint | 19 | 33 | 35 | 15 | 5 | 1 | 0 |

Extrapolated as a **rate**, not a total ([[D1240]]): at 23.5 % (report) a club player's 40 own
moves draw **≈ 9.4 grades**; at 38.4 % (any 2.5-floor candidate) **≈ 15.4**; at 30.8 %
(midpoint) **≈ 12.3**. On master games the same figures are 3.1 and 6.9 grades per player-game,
directly counted `[V]`.

**A 2.5 floor roughly doubles the review page's grade count. That is the accepted cost, and this
is its size.** It is not the same as doubling the *severe* grades: under hybrid-floor the
mistake+blunder count on review is unchanged — 62 on R, 22 on B, byte-identical to today.

### 6g. Two secondary measurements worth having on the record

- **Boundary fragility**, decisions within ±1.0 Win-point of a rung (population R): a 2.5 floor
  puts 88 decisions within a point of the emission boundary versus 54 at a 5.0 floor `[V]`. A
  lower floor is a busier boundary; co-rendering the number is what keeps that honest.
- **Sharpness**, share of *legal* moves in a position that would grade under 2.5/6/14: real-game
  positions 92.6 % median, authored-pack positions 80.0 % median `[V]`. **Drill positions are
  slightly gentler than real-game positions, not sharper** — the intuition that pack positions
  need a stricter ladder because they are sharper is not supported.
- **Mate arm**: 9 / 571 decisions on R (1.6 %), 6 / 962 pairs on B (0.6 %). It is
  context-independent already (RFC §3) and **no candidate touches it** `[V]`.

---

## 7. The derivation, and the recommendation

Four facts from §6 do the work:

1. **The two ladders disagree about exactly three bands**, and 84 of the 139 disagreements on
   population R live in one of them: [2.5, 5). The floor is the decision; the upper rungs are
   nearly a rounding difference (52 and 3 decisions).
2. **Below the floor there is silence, and silence is irrecoverable.** A grade that is not
   emitted cannot be thinned, ranked, deferred or re-surfaced by any downstream mechanism,
   because it does not exist. A grade that is emitted too often *can* be thinned — and selection
   density is already owned elsewhere: [[D928]]'s family-local whole-game selector and the Review
   Map's own layout. **Excess density is a selection problem; missing emission is not.**
3. **Above the floor, the word is not the only thing the learner gets.** RFC §6 makes
   co-rendering mandatory and permanent: *"Mistake — … a drop of 18.2 win-points against a
   threshold of 10 (grade-convention@1/review)"*, with a word-only sentence red by design
   (F-COR-1). A learner reading a rung disagreement still sees the drop and the threshold. **A
   rung disagreement costs a word; a floor disagreement costs the whole sentence.**
4. **The upper rungs are where the outside world's vocabulary is calibrated**, and we now know
   ours matches it to 59/59 on real labelled data (§4). RFC §4 gives comparability with Lichess
   and chess.com reports as the explicit reason `imported_analysis` shares the report ladder.
   Every candidate that moves the mistake rung to 6 breaks that on 28 of 956 master plies and 52
   of 562 club decisions, in the **escalating** direction — calling "mistake" what the tradition
   calls "inaccuracy".

Those four compose into one rule:

> **Take the strictest floor, because silence cannot be recovered downstream. Take the
> tradition's upper rungs, because the word above the floor is a scan handle whose meaning is
> calibrated outside this product, and the number is co-rendered anyway.**

That rule selects **2.5 / 10 / 15**.

### Recommendation: `grade-convention@2` = **2.5 / 10 / 15 Win%-points**, one ladder, every surface

It is the unique candidate with all three of these properties, verified in both review
populations:

- **The drill emission set is byte-identical to today's practice ladder.** Not one post-commit
  nudge disappears — 0 of 562 on R, 0 of 956 on B (§6c, §6d).
- **Every word review prints today is unchanged.** The only change on the review surface is
  *added* emissions below the old floor: 84 of 562 on R and 75 of 956 on B, with zero
  escalations and zero de-escalations (§6c, §6d). Our 59/59 agreement with Lichess's own labels
  survives intact for every move Lichess judges.
- **Every constant stays pinned** to shipped Lichess source with a real `{value, source,
  pinnedAt}` record.

Its cost, stated plainly: **52 of 562 drill grades (9.3 %) soften from "mistake" to "inaccuracy"
and 3 (0.5 %) from "blunder" to "mistake"**, because the drill mistake rung moves 6 → 10. The
nudge still fires, the drop is still printed, and the threshold printed beside it moves with it.
And the inaccuracy class widens to a 7.5-point band, [2.5, 10) — on population R that is 154 of
562 decisions (27.4 %) wearing one word, versus 70 (12.5 %) in review today. **The word carries
less information than it did; the co-rendered number carries the difference.**

### Runner-up, if you weigh drill wording above review wording: **2.5 / 6 / 15**

`hybrid-mid` is the mirror image. It changes **3 of 562** drill grades (0.5 %) and **0 of 956** on
population B — drill is preserved essentially perfectly. It pays on the other side: 52 of 562
review decisions (R) and 28 of 956 (B) escalate inaccuracy → mistake against both today's review
behaviour and Lichess's own labels. Choose it if the drill nudge's word is the thing you do not
want to move, and accept that our imported-game reports will call things "mistake" that Lichess
calls "inaccuracy" on about 3 % of master plies.

### The two positions I do not recommend, with their measured reasons

- **`report` 5/10/15 everywhere** — costs 84 of 562 drill nudges on R and **47–52 % of all drill
  nudges** on the Maia-weighted pack population. This is the one irrecoverable loss on the table:
  the drill's whole loop is *commit, see the consequence, rewind*, and half the consequences stop
  being said at all. Nothing downstream can recover a grade that was never emitted.
- **`midpoint` 3.75/8/14.5** — dominated. It still loses 43 of 562 drill nudges, still changes 70
  review classes, and is the only candidate whose constants no source supports.

---

## 8. Law 8 does not move under any candidate — checked

A grade is *arithmetic over a measured engine reading, thresholded against a declared,
cited convention, co-rendered with its operands.* Threshold values are the convention half. Under
every candidate in §5:

| law-8 requirement | status under all candidates |
|---|---|
| The operand is measured, not asserted | Unchanged — `dropWinPercent` is still Win%(before) − Win%(after) over `recorded.engine.eval@1` / `live.stockfish.eval@1`. No candidate touches the logistic, the clamp, the perspective normalisation, the pairing, the one-instrument rule or the abstention set |
| The class boundary never claims measurement status | Unchanged — `exactness: convention` (RFC §5) is exactly the field that says a threshold is a convention. Moving a threshold is what that field exists to permit |
| The word never travels without the numbers | Unchanged — RFC §6 co-render, `assertMoveQualityGradeSentence` (`grade.ts:208-210`), F-COR-0/1/2 |
| The LLM computes, selects or adjusts nothing | Unchanged — RFC §7.5. And [[D1409]]'s byte-matched word guard is the live repair on that path, independent of this one |
| No praise class, no default class, no best move, no rating operand | Unchanged — none of these is a threshold |
| The change is visible, never silent | **Requires the version bump.** Any constant change is `grade-convention@2` (RFC §4 Versioning), and the rendered sentence carries the version, so every previously rendered sentence stays attributable to the rule that produced it |

**No candidate requires the product to assert anything it did not measure.** The one place a
candidate *would* weaken the posture is `midpoint`: three constants with no external source,
whose `source` field would name this document. That is still a declared convention and still not
manufactured chess truth — but it trades a cited tradition for a Tabiya assertion, which is worth
refusing for free when a cited option is available.

One thing the merge makes *more* true: with a single ladder, the same move produces the same
`MoveQualityGrade` payload on every surface. The R15 byte-identity fixture's sibling property —
byte-identity across *surfaces* — becomes assertable, and §10 turns it into a criterion.

---

## 9. What the merge genuinely loses — cases no single ladder can handle

Two, both measured, both real:

**9.1 — Review's density budget. This is the loss the owner accepted, and it is irreducible.**
The two-ladder split let review be quiet and drill be sensitive at the same time, on the same
move. Any single ladder with a 2.5 floor doubles review's grade count: 132 → 216 on R,
63 → 138 on B, ≈ 9.4 → ≈ 15.4 grades per club player per 40 own moves. **No choice of the other
two rungs recovers it** — §6b shows all three 2.5-floor candidates emit exactly 216 and 138. The
only lever left is *selection*: showing fewer of the grades that exist. That lever exists, is
owned by [[D928]]'s family-local whole-game selector and by `rfc/review-map.md`, and **is not
specified with a density cap today**. §10 turns that into a Discharge rather than a hope. Note
what is *not* lost: the severe classes. Under the recommendation, review's mistake + blunder
count is unchanged (62 on R, 22 on B) — the added volume is entirely the mildest class.

**9.2 — Emission-count comparability with Lichess for imported games.** RFC §4's rationale for
routing `imported_analysis` to the report ladder is verbatim: *"sharing the tradition's constants
keeps our verdicts comparable to the Lichess/chess.com reports the owner will hold them against."*
Under the recommendation, the **words** stay comparable — every move Lichess labels gets the same
word from us, 59/59 — but the **counts** do not: our report on a master game shows 138 grades
where Lichess's shows 63, a 2.2× ratio `[V]`. A learner who imports a game they already analysed
on Lichess will see roughly twice as many marks. That is unavoidable under one ladder and should
be handled by saying so in the surface, not by hiding it.

**Three things people might expect to be lost, and are not:**

- *The mate arm.* Already context-independent (RFC §3). Untouched. 1.6 % of R, 0.6 % of B.
- *Drill sensitivity.* Preserved exactly under the recommendation — the floor does not move.
- *Per-surface honesty about which surface rendered a grade.* The `convention.context` field can
  and should survive as provenance; it simply stops selecting a ladder (§10).

---

## 10. What the amendment must change in the accepted RFC

Not a proposal for wording — a list of the places the accepted document and the shipped code
become wrong the moment D1408 is implemented. All verified at HEAD `6c45401`.

1. **`grade.ts:26-48` `GRADE_CONVENTION`** — six ladder constants become three; `version: 1`
   becomes `2` in the frozen record, the payload type (`grade.ts:79`), the renderer suffix
   (`grade.ts:198`) and every fixture that asserts the sentence. Under the recommendation the
   surviving three are `inaccuracy: cited(2.5, PRACTICE_SOURCE)`, `mistake: cited(10,
   ADVICE_SOURCE)`, `blunder: cited(15, ADVICE_SOURCE)` — **two different sources in one ladder**,
   which the convention text must state as a Tabiya composition of cited values, deriving to this
   document.
2. **`grade.ts:114-123` `classFromThresholds`** — the `practice`/`report` prefix branch is dead
   code and must go, not be left selecting between two identical tables. Keeping the branch would
   make a future re-split invisible.
3. **`grade.ts:43-47` `contexts`** — the three-context map stops selecting a ladder. Keep
   `context` as rendered provenance (it says which surface produced the sentence, which is true
   and useful) and add a compile-time assertion that a re-split is impossible by construction.
4. **RFC acceptance criterion 2** — *"unit: constant record; total 12 — 6 ladder thresholds + 4
   mate-tier + clamp + coefficient"* becomes **9**. Per [[D1240]] the criterion should assert
   **set-equality against `Object.keys(GRADE_CONVENTION.constants)`**, with 9 as a drift tripwire
   only, rather than restating a hand-count.
5. **RFC acceptance criterion 3** — *"total 13 — 3 classes × 2 sides × 2 ladders, plus the clamp
   pair"* becomes **7** (3 × 2 + F-CLAMP-2). Under 2.5/10/15 the boundary pairs from cp 0
   (50.00 %) are: →−27 = 2.48 nothing / →−28 = 2.58 inaccuracy; →−110 = 9.99 inaccuracy / →−111 =
   10.08 mistake; →−168 = 14.99 mistake / →−169 = 15.07 blunder. (Two of the three pairs are the
   report ladder's existing fixtures unchanged; only the floor pair is new — it is the practice
   ladder's existing floor pair.)
6. **RFC acceptance criterion 4, F-CTX, must invert.** It currently reads: *"the identical 0→−28
   pair grades **inaccuracy** under `drill` and **nothing** under `review`; byte-identical inputs,
   different convention context, different result."* That fixture is the two-ladder split made
   executable, and D1408 abolishes exactly what it asserts. Its replacement is the ruling's own
   content: **the identical input pair produces a byte-identical `MoveQualityGrade` payload and a
   sentence differing in no field but `context`, across all three contexts** — a loop over
   `GradeContext`, red the moment anyone reintroduces a per-surface ladder. This is the same
   shape as F-R15 (byte-identity across rating contexts) one axis over, and it is the criterion
   that makes the ruling permanent rather than merely applied once.
7. **RFC §4's three-context table and §1's ratio paragraph** are superseded; §4's
   `imported_analysis` rationale needs the §9.2 qualifier (words comparable, counts not).
8. **RFC open question 1** — *"the drill ladder's values … re-valuing is `grade-convention@2`
   material and needs no structural change"* — is discharged by this document plus the ruling.
   It predicted the shape correctly: this is a `@2`, and no structural change is required.
9. **Discharge, new, on `rfc/review-map.md`**: with a single 2.5 floor, review's measured grade
   density is ≈ 15.4 per club player per 40 own moves and 6.9 per master player-game. The Review
   Map must state how many grades it renders and how it selects them, or §9.1's accepted cost
   lands unmitigated on the surface the owner was worried about. This is the mechanism that pays
   for the ruling.

---

## 11. Proposed ledger rows

Not written here — `design/BACKLOG.md` is a shared file and several agents hold this worktree.
Whoever routes them re-verifies the head first (read as **D1418** at `6c45401`).

- **[proposed] The report ladder is validated against Lichess's own output, not just its
  source.** 952/956 exact agreement on 10 finished broadcast games carrying Lichess's own
  `%eval` and its own judgement words; **59/59 labelled moves reproduced exactly** under
  5/10/15. This upgrades [[D939]]'s ×50-vs-×100 correction from a source reading to a verified
  output match — under the pre-correction 10/20/30 ladder all 59 would have come out a class low
  or absent. Instrument and digests in `planning/platform-alignment/d1408-single-ladder-derivation.md` §4/§12.
- **[proposed] 🐞 `grade.ts` grades already-decided positions where the tradition it cites stays
  silent.** The four false positives in the §4 matrix all sit above ±4.5 pawns before the move
  (+4.67 → +2.67 = 12.03 drop, graded "mistake" by us, unlabelled by Lichess) or 0.05 Win-points
  above the rung. Our convention carries no suppression rule for decided positions and the RFC
  never considered one. Live at HEAD, independent of D1408, amplified by a lower floor. Needs
  either a cited suppression cell in `grade-convention@2` or an explicit, stated refusal.
- **[proposed] Neither shipped ladder was ever measured, by Lichess or by us** — both are
  authored constants adopted by citation `[M]` for the values' rationale, `[V]` for the values
  themselves. This document measures their *consequences* on 571 club decisions, 962 master ply
  pairs and 279 Maia-weighted drill positions; it measures nothing about their *correctness*, and
  no instrument in this repo can. Validation-by-use (RFC open question 1) remains the only route
  to that, and it is the owner's play session.

---

## 12. Reproduction — the procedure, with digests

**Committed inputs** (both git-tracked at `6c45401`):

```
tools/r2-selection-harness/imported-sample.pgn
  sha256:a10a233e8e51f6a0877f65cee417339080d2fd32cd22886f755f576c84fa58ec
tools/d947-broadcast-roundtrip-harness/fixtures/finished-round-QxNfeqHA.pgn
  sha256:2bd057021911165cf074c63122ad188811fc0aa42d67e253f465b59da31d79d6
```

**Engine captures.** Disposable `/private/tmp` artifacts produced by two committed harnesses;
re-derivable by their own READMEs with Stockfish 18 (`/opt/homebrew/bin/stockfish`, Threads 1,
Hash 16, MultiPV = legal count):

```
population R  tools/d1162-independent-population-harness/{extract,probe}.ts   depth 12
  positions.json  sha256:8607ede5c3cb85bb8bcfb3d27d823596df0d69d2ff4e220044146129392a244c
  sf-d12.jsonl    sha256:032135f3bbbac58c39804c555337c27dbf5c86d9ea82d767a528417bbcc237f9
population D  tools/maia-wdl-agreement-harness/README.md "## Run" — positions from
              tools/r4-difficulty-harness/extract.ts over content/drafts, Stockfish leg
              tools/r4-difficulty-harness/probe-sf.ts at depths 8/10/12, Maia leg
              probe-maia-wdl.ts arm "history" at bands 1400,1600,1800
  sf-d12.jsonl       sha256:890c60150f28c7f930a07553b2df4d80cf4fd903ebca33837e7aefe42219844e
  armA-history.jsonl sha256:61b4e12a4fa6e728ad5cc7bc44276c9cc676ae4be1d29f7c8e4b66d9fc466400
population B  no engine run — Lichess's own %eval tags are read out of the PGN
```

**The classification rule**, complete and self-contained. Every table in §6 is this function
applied to the populations above; nothing else is involved.

```python
COEF, CLAMP = 0.00368208, 1000

def winpct(cp):                       # packages/runtime/src/grade.ts:95-97
    cp = max(-CLAMP, min(CLAMP, cp))  # clamp the INPUT (RFC §1, F-CLAMP-2)
    return 100.0 / (1.0 + math.exp(-COEF * cp))

def klass(drop, ladder):              # ladder = (inaccuracy, mistake, blunder)
    ia, mi, bl = ladder
    return ("blunder"    if drop >= bl else
            "mistake"    if drop >= mi else
            "inaccuracy" if drop >= ia else None)

# learner-POV: population R/D -> MultiPV-1 root score vs the played move's score, both
#   already mover-relative (UCI convention at the root).
# population B -> Lichess %eval is White-POV pawns; negate for Black movers, ×100 to cp.
# mate on either side -> RFC §3 typed arm, context-independent, no candidate touches it.
drop = winpct(before_cp) - winpct(after_cp)

LADDERS = {"report": (5.0, 10.0, 15.0), "practice": (2.5, 6.0, 14.0),
           "hybrid-floor": (2.5, 10.0, 15.0), "hybrid-mid": (2.5, 6.0, 15.0),
           "midpoint": (3.75, 8.0, 14.5)}
```

**The §4 external check**, which is the part worth re-running before anyone trusts the rest: parse
`finished-round-QxNfeqHA.pgn`, pair each ply's `%eval` with the previous ply's, classify under
5/10/15, and compare to the `{ Inaccuracy. … }` / `{ Mistake. … }` / `{ Blunder. … }` comments
Lichess wrote in the same file. Expect 952/956 and 59/59.

---

## 13. The decision, in one line

**Recommended: `grade-convention@2` = 2.5 / 10 / 15 Win%-points, one ladder, all three contexts.**
Zero drill nudges lost, zero review words changed, every constant still pinned to Lichess source —
paying for it with 84 new low-severity grades per 562 club decisions on the review page, which is
a selection problem the Review Map already has to solve, and with 52 drill "mistake" words
softening to "inaccuracy" beside a number that still says 7.3.
