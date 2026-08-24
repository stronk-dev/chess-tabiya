# After the run, and coming back — a user-perspective UX specification

**Landed:** 2026-08-24 · **Author:** claude · **Scope:** the end of a session, the review of what
happened, progression and campaign, scheduling a return, and what a learner sees about themselves
over time.

**Commissioned by** the owner's standing instruction for this lane, verbatim: *"we need to go from a
user perspective per feature… what do they expect, what do competitors do, PROPER UX."*

**Method — three passes per feature**, in this order and never merged: (1) what a user expects,
stated from the learner's side; (2) what competitors actually do, every claim labelled; (3) what we
should do and why it differs, with cost and dependencies. Where the third pass wants something the
intent tier does not carry, it is named as an **owner decision** and not written (law 5).

**Rulings that bind this dossier.** [[D1422]] — one grade ladder everywhere at **2.5 / 10 / 15**
Win%-points; a move never changes its label by screen. [[D1423]] — the density cap is **rejected**;
review presents in **two tiers** (a brief note versus a full review-this-move moment) and ranks by
educational value. [[D1424]] — *excellent moves*, one of the owner's five named signals, has no
mechanism, and law 8 forbids inventing one. [[D1421]] — we grade already-decided positions.
[[D945]] — rewinds and proactive branching are earned inside the campaign. [[D1230]] — no scope
cuts; *"the first visible pixel"* and *"the cheapest real path"* are struck as reasoning.

**This is research tier.** Nothing here is an RFC and nothing here amends `design/03`, `design/05` or
`design/06`. Every recommendation names the RFC that owns it.

---

## 0. Three findings, before the features

**0.1 — The post-run surfaces are honest and unreadable, and the two have opposite fixes.** The
honesty is load-bearing and must survive intact. The unreadability is almost entirely **raw internal
vocabulary reaching the learner** — `unstable`, `eval pivot`, `267 cp`, `{"white":…}` — at the four
moments they have invested the most. Every recommendation below substitutes the run's own *meaning*
for the run's own *symbols*, and not one requires relaxing an invariant.

**0.2 — Nobody in the competitive set re-enters play from the explanation, and the one product that
does, does not preserve the attempt.** *"Chess.com Game Review's only in-review interaction is a
one-move Retry puzzle… Dr. Wolf's undo erases the attempt… Chess2Story's moment slides are
read-only. **Nobody in the matrix re-enters play from the explanation**"*
(`design/research/feedback-versus-the-dashboard.md` §3b) `[V]`. The nearest miss is Chessigma, and
the repo's own verdict on it is the sharpest sentence in the corpus: *"**Chessigma re-enters the
game; it does not preserve the re-entry**… the line is whether the second attempt survives to be
compared with the first"* (`design/research/teardown-chessigma-desk.md` §2a) `[V]`. **That is why
§3.3 makes the *door* the thing that defines the higher review tier** — the hierarchy of our review
surface should be organised around our one original claim, not around an engine's opinion.

**0.3 — We cannot reach a learner who is not on the site, and no amount of copy fixes that.** A term
census over `apps/` and `packages/` returns **zero** hits for `notify`, `notification`, `email`,
`webpush`, `reminder` (`design/research/league-as-return-loop.md` §4) `[V]`. `/learn` is a **pull**
surface: `GET /progress/due` answers when you ask. Every return recommendation in §6 is therefore a
recommendation about **what the learner finds when they arrive**, not about what arrives at them —
and that limit should be stated in the lane rather than discovered by whoever builds it.

---

## 1. Verified baseline — what a learner already sees today

Established at HEAD before recommending anything, per the brief's instruction. Every string in this
section was read from source `[V]`.

### 1.1 The moment a run ends

**Correction to the standing audit, and it matters for what follows.** The prior audit's *"the
terminal sheet says `Run is terminal at node: run-456c8dec-…:node:4` … the single worst instance in
the app"* is **stale at HEAD** `[V]`. That string is produced at
`packages/runtime/src/errors.ts:49` and **intercepted before display** at
`apps/web/src/lib/session-controller.ts:74-82`, which substitutes *"This attempt is complete. Rewind
to an earlier move to try another branch."* The one residual leak is `resume()`
(`session-controller.ts:233-238`) — the single catch in that controller that does **not** route
through `sessionErrorMessage`, so a raw runtime message can still surface under `App.svelte:826`'s
*"Run unavailable."*

The real run-end surface is `apps/web/src/lib/TerminalSheet.svelte` (126 lines), a modal dialog
mounted from `DrillScreen.svelte:1104-1118`. In order `[V]`:

| Region | Content |
|---|---|
| eyebrow (`:35`) | `Attempt complete` |
| headline (`:37`) | `You won.` / `You lost.` / `Draw.` |
| context (`:41`) | `<OutcomeContext {assessment} {resistance} {grade} />`, conditional |
| objective grade | `Objective: ${objectiveType} — ${state}` (`outcome-presentation.ts:173-180`) |
| authored commentary (`:46`) | one item per authored claim, with provenance |
| recorded evidence (`:67`) | `**{sourceLabel}** · {text}` per sentence |
| actions (`:77-80`) | `Story of this run` · `Replay this as {other side}` · `Rewind and branch` · `Stop session` |

**Two of its shipped sentences are among the best copy in the product and should be protected by
name**, because a redesign will delete them by accident: *"Requested resistance: human_common, target
Elo 1150 — the pack's request… **Not perfect play.**"* and *"You reached X without conceding the
result. **That is the end of this drill, not a proof of the position.**"*
(`design/research/band-flattery-and-buried-value.md` §2b–2c, from `outcome-presentation.ts`) `[V]`.
No competitor says the second sentence, and it is the whole difference between a rehearsal and a
verdict.

**What is absent, verified by grep over `TerminalSheet.svelte` and `DrillScreen.svelte`:** any
return-scheduling offer, any next-position recommendation, any accuracy figure, any move-level
annotation, and any statement of what the run added to anything `[V]`. The scheduler has already
written a `due_at` for this root by the time this sheet renders
(`docs/return-and-progression.md` §Return queue) and the sheet does not say so.

### 1.2 The story surface

`apps/web/src/lib/GameStoryScreen.svelte`, 68 lines. The brief's quoted `Recorded trajectory: cp →
cp` is real at `:52`, with a ` cp` suffix the quotation dropped: **raw centipawn integers**, not pawn
units, not win-percent, rendered only when the selected moment carries both evaluations `[V]`.

- **There is no move list.** The surface is a rail of **at most eight** moments —
  `story.rank.slice(0, 8)`, re-sorted by ply (`:14`, `:59-63`) `[V]`.
- **There is no move-quality annotation of any kind.** The only classification is the structural
  moment kind, rendered by string substitution:
  `{selected.kinds.map((kind) => kind.replaceAll("_", " ")).join(" + ")}` (`:49`) `[V]`. The union is
  `irreversibility | phase_change | human_divergence | option_collapse | eval_pivot | last_level |
  endgame_entry | shape_span | outcome` (`pivotal.ts:14`, `story.ts:11`), so a learner reads
  `eval pivot`, `option collapse`, `last level` — internal enum members with the underscores taken
  out.
- The false provenance footer [[D687]] ships: `rendered from recorded engine evidence · Tabiya` at
  `:30`, stamped onto cards whose moment may be a rules marker or a shape firing `[V]`.
- The ranked-8 / chronological-8 divergence [[D688]] ships: client `story.rank.slice(0, 8)` versus
  server `story.moments.slice(0, 8)` inside `publicStory` (`apps/server/src/service.ts:915`) `[V]`.
- The re-entry door is real and is the differentiator: `Re-enter and play from here` (`:53`),
  disabled until `story.ready`, and selecting a moment *"rewinds to its `entryNodeId` and explicitly
  creates a `story-reentry` branch before opening the run screen"*
  (`docs/game-import-and-story.md` §Re-entry and export) `[V]`.
- **One action door only**, confirmed by the reentry dossier: *"A selected private moment offers one
  learning door: Re-enter and play from here. There is no cited-theory, drill or compare action"*
  (`design/research/review-map-and-reentry.md` §1.3) `[V]`.

**The shipped rank is already a categorical selector, and nobody has said so out loud.**
`story.ts:182-183` `[V]`:

```
priority = outcome 0 · eval_pivot 1 · last_level 2 · phase_change 3 · endgame_entry 4
         · irreversibility 5 · shape_span 6 · else 7
rank     = sort by priority, then |Δcentipawns|, then ply
```

The reentry dossier records the same rule and its status: *"The rule is declared as a presentation
convention, not chess significance, which is honest"* (`review-map-and-reentry.md` §1.2) `[V]`. §3.7
builds on this rather than replacing it, because it is already the shape a law-8-safe
"educational value" ranking has to have.

### 1.3 Attempt history and the return queue

One route, `App.svelte:855-972`, eyebrow `Learn / return loop`, six sections: Assigned · Recommended
next · Repertoire gaps · Milestones · Due now · What is recorded `[V]`.

- Attempt rows (`:943-971`): `{attempt.packId ?? "Position rehearsal"} · attempt {attempt.attemptNo
  || "—"}` then `{attempt.graded ? attempt.verdict : "not graded"} · {attempt.userPlyCount} learner
  plies · {date}`. **The verdict is the raw enum**, `stable | unstable | open`
  (`apps/server/src/progress.ts:6`), printed with no mapping to a sentence `[V]`.
- Due rows (`:932`): `Repeat the blocked attempt` / `Try a varied repetition` · date, with `Open
  source` and `Dismiss`. Empty: `Nothing is due yet. Played attempts create this queue.` `[V]`
- Milestones (`:923`): event sentences from seven kinds — `first_attempt`, `first_stable`,
  `first_objective_achieved`, `first_win`, `first_scheduled_return`, `ten_attempts_one_root`,
  `first_flip_sides` (`api.ts:540`). Empty: *"No milestones yet. They record revisitable events,
  never a mastery score."* `[V]`
- Section footer (`:971`): *"This is an attempt history and return queue, not a mastery score."* `[V]`
- **A raw-JSON leak ships at `App.svelte:914`**: `{JSON.stringify(page.scan.population)}` rendered
  directly to the learner in the repertoire-gap section `[V]`.

### 1.4 What the learner already sees about themselves

The brief's instruction — *establish exactly what, before recommending more* — has a larger answer
than expected.

`apps/web/src/lib/RatingScreen.svelte` (197 lines) ships **a number about the learner** `[V]`: h1
`Your measured record`; a point estimate rendered `band {n}` or the literal `Interval only`; an
interval `band {a} to band {b}`; a three-row `<dl>` of `State` / `Rated games` / `Abandoned`; a
server-supplied `What this number means` disclosure list; a `Recorded wins` section rendering `Beat
band {1400|1800|2200} on {date}`; and a game table `Date / Opponent / Side / Result` whose result
cell can read `voided: {reason}` `[V]`. Its framing sentence is exactly right and worth preserving
verbatim: *"This record never grades a move or changes what a coach says about it."*

`apps/web/src/lib/CohortStanding.svelte` (150 lines) ships a **cross-learner table** with five
columns — `Learner | Marks | Record | By opponent band | Rating` (`:110`) — with `Hidden` /
`Not shown` cells where consent is withheld, and the consent copy *"Your record is visible by
default. Your rating remains hidden unless you turn it on separately. You can withdraw later."* `[V]`

**Three findings from this pair that bear on everything below.**

1. **The band is formatted two different ways one screen apart.** `RatingScreen.svelte:47-51` renders
   `band 1620` and `below band 1000`; `CohortStanding.svelte:60-65` drops the word — bare `1620`,
   `below 1000` — and joins the interval with an en dash rather than the word `to` `[V]`. Same
   quantity, two presentations. It is the smallest instance of the general defect: presentation is
   decided per component instead of per concept, which is exactly what `rfc/review-map.md` §7's
   frozen-template table exists to stop — and that table does not cover the rating surfaces.
2. **[[D1151]]'s stated ground is already false at HEAD, and the ledger row does not say so.** D1151
   refused the learner's own history because it would introduce *"the first number this product has
   ever shown a learner about themselves"* — but `RatingScreen` ships a point estimate, an interval,
   a game count and an abandonment count today. The ruling's *conclusion* may well be right (§4); its
   *stated ground* is not, and a future reader will use that sentence to refuse things while a band
   number ships two clicks away. §7.1.
3. **One live personalization claim is unbacked twice over.** 24 of 31 on-ramp packs carry the
   identical `objective.summary` *"Play on from this position for 6 plies **against an opponent near
   your rating**"*, emitted by `emitPositionSeeds` where `row.rating` is **the Lichess puzzle's
   difficulty rating** — how hard the puzzle is for solvers, not a measure of the learner
   (`design/research/band-flattery-and-buried-value.md` §5.4) `[V]`. The product has no learner
   rating in that path, and the number standing in for one describes a puzzle. This is the
   *"we tuned this to you"* claim, shipped, with nothing behind it — and it is on the surface a
   learner meets *before* the run, which is why it belongs in a dossier about what they are owed
   *after* one.

### 1.5 Built and unwired: the whole grade family

`packages/runtime/src/grade.ts` is 214 lines and has **zero production consumers**: a repo-wide grep
for `moveQualityGrade`, `renderMoveQualityGrade`, `winPercentFromCp` or `GRADE_CONVENTION` outside
`grade.ts`, `index.ts` and `grade.test.ts` returns nothing `[V]`. `evidence-catalog.ts:822` carries
the disposition verbatim: *"Awaits learner-module consumer compilation for postcommit_nudge and
review_map."* The `review` route that ships is not a review map at all — it is titled `Run history`
and lists runs as `{title}` + `{date} · {n} branches · {objectiveState}` (`App.svelte:832-853`) `[V]`.

**And no campaign UI exists.** `campaign` appears in the client only as an assistance-profile label
(`AssistanceSettings.svelte:18`), a silent-assistance default (`assistance-preference.ts:14`) and one
sentence in `RatingScreen.svelte:160` `[V]`.

### 1.6 The shipped ladder is not the ruled ladder

`grade.ts:26-48` freezes **six** ladder constants — `report` 5 / 10 / 15 and `practice` 2.5 / 6 / 14
— and a three-context map selecting between them `[V]`. [[D1422]] rules **one** ladder at
2.5 / 10 / 15. The composition is new: 2.5 is the practice floor, 10 and 15 are the report rungs. So
the ruling is a `grade-convention@2` amendment against an accepted RFC, it deletes
`classFromThresholds`'s prefix branch (`grade.ts:114-123`), and it inverts acceptance criterion 4 of
`rfc/move-quality-grades.md` from *"different result per context"* into *"byte-identical across
contexts"*. That amendment is owed and is not this dossier's to write; everything below assumes
2.5 / 10 / 15.

### 1.7 One post-run surface where our own prominence order is inverted

`design/research/band-flattery-and-buried-value.md` §7.3 measured the compare screen `[V]`: **the
grounded comparison narrative is the seventh of eight sections, collapsed, below the fold, while a
`●` sparkline of engine evaluations is expanded by default at the top.** Reaching the narrative is
*"1 click to open compare + scroll past five sections + 1 click on Narrative"*. The dossier's own
judgement is the one to carry forward: *"the prominence order is inverted against our own thesis, and
the element that **is** prominent is the visual signature of the ADR-0005 anti-pattern"* — and
crucially, *"**this is not §3a cover.** §3a governs assistance during committed play. The compare
screen is post-commitment by construction."*

**Compare is where a retry lands.** Every `Retry from here` in §3 terminates on that screen, so its
inverted prominence is a defect in the review lane, not a separate one. And the strip's content is
measured weak: it fires on **633/634 = 99.8%** of transitions at **8.31 entries per ply**, with lift
over a random quiet move of **≈1.01×**, and sibling branches at the 44 authored fork pairs overlap at
Jaccard median 65.7% — leaving *"a median of 36 differing observations"* printed in full, side by side
(`feedback-versus-the-dashboard.md` §5d) `[V]`. **So the answer to "why did these two attempts turn
out differently" is currently 36 unranked sentences per pair.** A two-tier review that hands the
learner to that screen has moved the density problem rather than solved it; §3.8 records it as a
dependency.

---

## 2. Feature — the moment a run ends

### 2.1 What a user expects

They have just committed the last move. Every chess product they have used trains them to expect,
within about a second and in this order: **the result**, **a number summarising how they played**, **a
rating change**, and **a button that says Review**. The expectation is uniform enough that its absence
reads as a bug rather than as a choice.

Three parts of it are **actively wrong here**, each for a different reason:

1. **There is usually no result.** A drill run ends at an authored `plyHorizon` with an
   `ObjectiveState`, not a checkmate — 50 of 56 draft packs declare a horizon, median 11 ply
   (`design/06-campaign.md` §5, re-derived at HEAD) `[P]`. The honest object is the objective's
   verdict in the pack's own outcome vocabulary — convert / hold / save / resist
   (`design/01-training-model.md` §Outcome types) — and the board result only where one exists.
2. **The summarising number cannot render.** `rfc/review-map.md` §6 gates accuracy on **full**
   evaluation coverage, and [[D691]] measured native runs at **20/20 opening** and **0/13 middlegame,
   0/14 endgame, 0/2 cross-phase** mainlines with consecutive recorded evaluations `[V]`. Putting
   accuracy on the terminal sheet spends our one abstention in the worst possible place.
3. **The Review button is the wrong verb.** *"An engine review screen with a rewind button"* is the
   named death (`CLAUDE.md` §Rejected). Our primary door out of a finished run is *play it again from
   the moment it turned*.

### 2.2 What competitors do

- **Chess.com ritualises it.** The game-over modal offers *"the option to rematch your opponent, start
  a new game, or run the Game Review"* `[V]` (support 10328363); the sequence is *"game-over modal →
  analysis runs → a report-card page"* `[V]`
  (`design/research/competitor-play-ux.md`, citing support 8584089 and
  `chess.com/news/view/chesscom-launches-game-review-v2`). The report card carries a coach avatar, a
  Game Graph, per-side accuracy 0–100, an **estimated rating** and per-phase grades `[V]`.
- **Our own audit already ranks this the #1 adoption in the repo**, and says we do not have it:
  *"Auto-offered post-game review ritual — review offered the moment the game ends… 'the habit loop is
  proven at ~175M-visit scale'"* → **MISSING** for native runs; *"adopt — #1 cheap adoption. The single
  highest love-evidence × lowest cost item in the audit"* (`design/research/adoption-audit.md` row 24)
  `[V]`.
- **Lichess does the opposite.** *"During play: nothing (no eval). After: analysis page, gated"*;
  *"Learn from your mistakes"* appears **only after** requesting computer analysis, and *"nothing at
  the moment of play points to it"* `[V]` (`competitor-play-ux.md`, primary-source scss + blog fetch).
- **The modal itself is a known UX defect.** *"the modal's buttons shift as Game Review loads, causing
  misclicks"* `[P]` (forum threads, `competitor-play-ux.md`).
- **Quackmate shows one moment, not eight.** *"Quackmate presents one turning point per game, a short
  'why,' a better continuation playable on the same board"*; the repo's own transfer note is
  *"**one small default moment can be more legible than eight**, and the same grounded record can
  serve private review and a social card"* — with the refusal attached: its *"engine-selected turning
  point, better-line language and causal coach prose exceed what Tabiya may claim"*
  (`design/research/review-map-and-reentry.md`) `[V]`.

The pattern across all of them: **the end of a game is treated as the end of the thing**, and review is
a document about a closed event. Our loop says the end of a run is the *middle* of the thing.

### 2.3 What we should do, and why it differs

**The terminal sheet answers four questions in this order and no others.**

1. **What happened, in the run's own words.** Keep the shipped headline where a board result exists,
   and keep the two protected sentences of §1.1. Where the run resolved an objective, replace
   `Objective: ${objectiveType} — ${state}` with the declared outcome type as a sentence — *"You were
   asked to hold this. You held it."* / *"…the position degraded on this path."* Where there is no
   objective, say so: *"Nothing was written about this position; this run recorded what you played."*
   That is invariant 5 (`design/05` §1, *absence is stated, never simulated*) at the one moment the
   learner most wants a verdict.
2. **Where it turned — exactly one moment.** Not a map, not eight cards: the top-ranked tier-2 moment
   (§3), with its board, its one grounded reason, and its door. **One** is right on two independent
   grounds: Quackmate's measured legibility transfer `[V]`, and [[D690]]'s finding that short games
   yield **0–2** candidates including honest abstention `[V]` — a sheet that promises three and shows
   zero on a nine-ply drill is worse than one that promises one.
3. **Two doors, in this order.** `Play it again from here` (the moment), then `Review the whole game`
   (the map). The shipped four actions stay; the ordering is the claim. `Replay this as {other side}`
   is genuinely rare — nothing in the competitive set offers it at run-end — and belongs one rung
   down, not removed.
4. **One line about coming back.** The scheduler has already written this root's `due_at` by the time
   this sheet renders and the sheet is silent. One sentence — *"This position comes back on the 27th,
   with a new defence"* — turns the return queue from a place the learner must visit into a promise
   the product made when they cared. It costs one field on an existing response, and given §0.3 it is
   **the only outbound channel we have**.

**What the sheet must not carry**, with reasons: an accuracy figure (§2.1.2); a count of grades
(*"3 inaccuracies, 1 blunder"* is a summary statistic about the learner — the shape D1151 refused, and
the shape ChessMonitor's whole product is); any rating movement for an unrated run; any praise class
(`rfc/move-quality-grades.md` §7.2).

### 2.4 Cost and dependencies

| Item | Cost | Depends on |
|---|---|---|
| Objective verdict as a sentence | small — one template in `outcome-presentation.ts:173-180`; needs the pack's outcome type client-side | `rfc/review-map.md` §7's frozen-template table |
| One turning-point moment | medium — needs §3's selector and its first consumer | `rfc/review-map.md` §5; the tier-2 budget is O7.1, unruled |
| Door ordering | trivial | — |
| The return line | small — value already computed by `#refreshAutoSchedule` | **`rfc/return-scheduling.md` §1 must land first**, or the sheet promises a date computed by an expression that diverges from its own accepted RFC on **five of eight** histories `[V]` |
| `resume()` routed through `sessionErrorMessage` | trivial | — |

---

## 3. Feature — the review surface and the two tiers

**This is the centre of the dossier, per [[D1423]].**

### 3.1 What a user expects

They expect the move list to be **annotated end to end**, because Lichess and chess.com both annotate
every ply they can and colour the ones that matter. They expect to click any move. They expect the
marks to be *comparable* to the ones they have seen elsewhere. And — the expectation nobody states —
they expect the annotation to be **mostly silence**, because in their experience most moves get
nothing, and a screen where every row is coloured reads as noise.

Where it is wrong for us, in one place only: they expect the review to be **the end of the activity**.
It is our beginning.

### 3.2 What competitors do

**The vocabularies.**

| Product | Move-quality vocabulary |
|---|---|
| **Chess.com** | ten labels — **Brilliant, Great, Best, Excellent, Good, Book, Inaccuracy, Mistake, Miss, Blunder** — plus accuracy 0–100, an advantage graph, coach one-liners with optional audio, and Key Moments `[V]` (support 8584089, via `teardown-chesscom-platform-desk.md`). A **"Show Move Classification On Board"** setting paints badge icons onto the board itself `[V]` |
| **Chessigma** | nine, coined to dodge a trademark — **Sigma, Awesome, Best, Nice, Ok, Theoretical, Strange, Bad, Clown** `[V]` (`/blog/how-chessigma-analysis-works`, via `teardown-chessigma-desk.md`) |
| **WintrChess** | chess.com-style classification and accuracy, **no coaching prose** `[V]` |
| **Lichess** | inaccuracy / mistake / blunder, published in source `[V]` |
| **Tabiya, today** | `DEVIATION_MISTAKES = ["plan","timing","tactical"]` — a **kind**, not a severity. *"There is no band field, no severity scale, and no praise class — the vocabulary has no way to say 'good move' at all"* `[V]` (`band-flattery-and-buried-value.md` §2b) |

**The thresholds are mutually incompatible, and this is the paragraph the whole surface rests on.**
*"the conventions are **mutually incompatible** — Lichess uses percentage points of win probability,
chess.com uses **0.05/0.10/0.20 expected points**, freechess fits a **quadratic in the previous eval**
whose own comment calls it the 'WTF Algorithm'. **The same move is an Inaccuracy on one site and a
Mistake on another. Printing the number is grounded; printing only the word launders a convention as a
fact**"* (`design/research/classifier-coverage-and-noise.md`) `[V]`.

> **Erratum, carried here rather than left standing.** That dossier renders the Lichess ladder as
> **10/20/30** percentage points. [[D939]] refuted it at verbatim source: `Advice.scala`'s
> 0.10/0.20/0.30 are raw winning-chance drops on the **[−1,+1]** scale, so ×50 gives **5/10/15**
> Win%-points; `practiceCtrl.ts`'s `povDiff` **halves** its difference, so ×100 gives **2.5/6/14**.
> The gloss is right for one file and wrong by 2× for the other. Anyone citing
> `classifier-coverage-and-noise.md` §threshold for a number must take the corrected values from
> `rfc/move-quality-grades.md` §1.

**And our grade is now validated against Lichess's own output, not merely its source.** [[D1420]]:
**952/956 = 99.6% exact agreement, with all 59 of Lichess's labelled moves reproduced exactly**, on ten
finished broadcast games carrying Lichess's own per-ply `%eval` and its own judgement words `[V]`.
That is the strongest single fact in this dossier — **our vocabulary is already calibrated against the
one the learner brings with them**, which is what makes borrowing their expectation safe.

**How the field handles already-decided positions — the direct answer, and it is published.**
freechess (*"the only public complete implementation of a chess.com-style classifier"*) computes
`Brilliant` as a conjunction of *"best-move match, an eval floor, **a not-already-winning cutoff** and
a hand-tuned sacrifice-viability test with special cases for rooks-and-above versus minors"* `[V]`
(`classifier-coverage-and-noise.md`). **So a decided-position cutoff is field practice with a public
implementation, not an inference about Lichess.** The same paragraph carries the part we must not
copy: chess.com *"makes it easier to earn if you are lower-rated, so the same move on the same board
is Brilliant for one player and Best for another. **That is not a property of the position.**"* —
and `Great` and `Miss` depend on the *opponent's* previous classification and on your rating `[V]`.
CAPS2 is explicitly tuned *"to replicate the feeling of being graded on a test in school"* `[V]`.

**Retry: the ceiling everyone hits.** Chess.com's Retry *"allows you to replay a specific position and
attempt to find the best move yourself"* — and **"No source describes an opponent playing on after the
found move. It is a one-ply puzzle stapled to the review"** `[V]`
(`teardown-chesscom-platform-desk.md`). Users resent it: a forum thread titled *"Why the new 'Game
Review' 'Retry' button is a puzzle and why that is bad"*, whose OP writes *"The Puzzle section already
exists"*, and whose moderator answer is a **toggle to hide it**, not a play-out `[V]`. The manual road
to real play — Self-Analysis → step → Practice-vs-Computer — has back/forward replaced by a single
Undo, *"the original game is not preserved"*, each retry overwriting the line; on a finished bot game
there is no rewind at all: *"This abrupt undoable event is beyond maddening"* `[V]`
(`teardown-chesscom-desk.md`). Platform-wide: *"commit ✅ · play-the-consequence ✅ · rewind ❌ · preserved
branches ❌ · compare ❌… **Preserved attempts anywhere on the platform: none found**"* `[V]`.

**Lichess hides the verdict during retry, and says why.** *"Instead of telling you right away what you
should have played, this feature gives you a chance to rethink the position by yourself"* `[V]`; the
blind-mode tutorial confirms the interactive mode *"hides evaluation labels while asking the learner to
find a better move"*, with board or typed input `[V]`. Limitation recorded in the same place: *"the unit
remains an engine-identified mistake and improved move, not a multi-consequence branch preserved for
comparison."*

**And the failure mode of labels without grounding is documented on a live product.** WintrChess is
*"hated for 'lacks feedback'"*, with users reporting *"moves flagged blunder while recommended as best"*
and illegal recommendations; the structural quote from that thread is the one to keep: *"**None of them
explain 'why'. And without why? Being told what the best move is is pretty much useless.**"* — lesson
recorded as *"classification labels without grounding erode confidence fast"* `[V]`
(`quickpass-wintrChess-encroissant-chessmonitor.md`).

**Two field layout invariants worth adopting verbatim** (`competitor-play-ux.md` §2) `[P]`:
*"(a) on desktop, nothing that grows sits in the board's column; (b) when content exceeds its region,
the region scrolls, tabs, or collapses — the board is never resized by content."* And the board-paint
warning: on-board classification badges are the field's preferred at-commit channel at zero layout
cost, but *"**Nibbler shows its failure mode: more than about one semantic layer at a time turns the
board into a diagram**"* `[P]`.

### 3.3 The design — two tiers, and the tier boundary is a **door**, not a severity

D1423 says *"it's clear which ones are more brief info vs review the move."* The design question is what
decides which. There is an obvious answer that is wrong, and a better one that falls out of the
product's own architecture.

**The obvious answer — severity — is wrong for three reasons.** (a) It double-counts: severity is
already carried, visibly, by the grade chip and the co-rendered number. (b) It drops four of the
owner's five signals — a middlegame→endgame transition carries no grade at all and would land in no
tier. (c) It makes the whole annotated column negative, which is §3.5's problem in a worse form.

**The design: a tier-2 moment is one where the product can offer *play it again from here* and mean
something by it.**

| | **Tier 1 — brief note** | **Tier 2 — review this move** |
|---|---|---|
| Where | inline, in the move-list row | a card in the moment map; the row is emphasised |
| Content | exactly one grounded sentence, co-rendered with its operands | the board at that ply, the admitted facts from `review_map`'s 48-row eligibility set, and a named reason |
| The learner's cost | zero navigation — read while scrolling | a click, a context switch, a decision |
| The door | none | **`Retry from here`** — rewind to `entryNodeId`, fork `story-reentry`, open the run |
| Budget | **uncapped** | budgeted (§3.4) |

**Why this boundary is right, and derivable rather than a taste call:**

1. **It reads D1423 literally.** The owner rejected the cap *on notes* — *"we can do a lot of moves as
   long as it's clear which ones are more brief info"*. He did not reject a budget on doors, and there
   must be one: a learner cannot replay fifteen positions.
2. **It is computable from shipped state.** A door needs a re-enterable node, and
   `docs/game-import-and-story.md` already carries the rule — *"A terminal fact stays grounded at its
   terminal node but enters its playable parent"* — with separate `nodeId` and `entryNodeId` on every
   moment `[V]`. "Has a door" is a field, not a judgement.
3. **The measured density supports it exactly.** Under the single 2.5 floor, review's grade count goes
   **132 → 216** on the club population and **63 → 138** on the master population — ≈15.4 grades per
   club player per 40 own moves — and **the entire added volume is the mildest class**: mistake +
   blunder is unchanged at 62 and 22 `[V]`
   (`planning/platform-alignment/d1408-single-ladder-derivation.md` §9.1). Many notes, few doors:
   fifteen inline row-marks is a readable move list; fifteen cards is not a surface.
4. **It is the differentiator, made structural** (§0.2). The field's entire ceiling is that a retry is
   a one-ply puzzle over a destroyed original. Organising our hierarchy around the door puts the one
   thing nobody else has at the top of the screen.
5. **It fails safe.** A moment we cannot open is demoted to a note, never dropped — which is D1423's
   whole objection to the cap.

**Three normative consequences a renderer can violate and must not.**

- **Tier 1 is not a summary of tier 2.** A note is a complete grounded sentence with its operands
  (`rfc/move-quality-grades.md` §6; F-COR-1 permanently red). "Brief" governs the *presentation*, never
  the *grounding* — and WintrChess is the live demonstration of what ungrounded brevity costs.
- **Most rows are still empty.** The class is closed at `inaccuracy | mistake | blunder`, no praise
  member, no default member; below threshold nothing is emitted. A two-tier surface must not invent a
  tier-0 "ok" chip to fill the column.
- **Tier 1 lives in the row, not on the board.** Chess.com paints badges on squares and it works for
  them at one layer; Nibbler is the counter-example. With five signal families and a 15-mark density,
  the board would become a diagram. The move list is a region that can scroll (field invariant b); the
  board's column is not (invariant a).

### 3.4 The selector — the five signals, and what each is actually grounded in

| # | Owner's signal | Grounded? | Mechanism | Coverage / cost |
|---|---|---|---|---|
| 1 | *what changed entropy the most* | **partly** | Shannon entropy over the human-policy distribution at the learner's band, rendered as a fact about the distribution — rung 3 (`design/05` §3) | **No population at the learner's nodes.** See below |
| 2 | *blunders* | **yes** | the ladder at 2.5 / 10 / 15, co-rendered | imported: full; native: 20/20 opening, 0/27 mid+endgame ([[D691]]) `[V]` |
| 3 | *excellent moves* | **NO** | none exists | [[D1424]] — §3.5 |
| 4 | *tactical positions achieved* | **partly** | `rfc/tactical-collectors.md` families: legal local exchange, castling, capture identity, hanging/loose, ray (pins/skewers/X-rays), threats, fork | **research/inspector-only at landing**; that RFC §2.3: *"none of the new families are critical"*; and A3 found **zero** complete structural families unconditionally admitted as learner events under O2's bar (`design/03` B9) `[V]` |
| 5 | *midgame or endgame transition* | **yes** | shipped phase classification with declared abstention (B10); `story.ts` already emits `phase_change` and `endgame_entry` | shipped `[V]` |

**Signal 1 has a shipped cousin nobody has connected to it.** `pivotal.ts:29-38` already computes a
human-split marker, with a literal convention `[V]`:

```
fires when: policyModeApplied === "human_common"
            AND max(normalised mass) <= 0.5
            AND at least three moves carry mass >= 0.15
renders as: "{engine}'s recorded policy split: 41% / 24% / 18% of recorded mass."
```

That is a **boolean three-way-split test**, and entropy is its continuous generalisation — strictly
better as a *ranking* input, since a ranked selector needs an ordering and a boolean gives none. Three
facts make this a real cost rather than a rename:

- **The marker fires only on `opponent.move_selected` events** (`pivotal.ts:31`), so it is a statement
  about the *opponent's* decision `[V]`. `apps/server/src/capabilities.ts:135` records the disposition
  in as many words: Maia policy mass is *"Recorded on opponent selections"* `[V]`.
- **The learner-side distribution is never recorded.** It exists only through the on-request inspector
  route (`rest.ts:1348`) and at `prediction.recorded` — and **0 of 92 packs carry a `prediction`
  interaction** (`rfc/return-scheduling.md` §10 census) `[V]`. For imported games it is structurally
  absent: *"An imported mainline has no human-model divergence because no selection distribution was
  recorded there"* (`docs/game-import-and-story.md`) `[V]`.
- `grep -rn entropy` over `packages/` and `apps/` returns **0** `[V]`.

**So signal 1 costs a per-node human-policy pass at the learner's decisions** — architecturally the
same shape as the per-node evaluation pass imported games already run (`service.ts:857`). It is the
most product-native detector we have (`design/05` §5a) and the one with no data. Fundable, not
blocked — but it must be priced, not assumed.

**The selector's shape, and the one thing it must not become.** `design/05` §3 clause 3 is normative:
*"local distinctiveness/rarity may select among already-eligible events but cannot establish valence,
causality, importance or a move grade"*; clause 4 requires deterministic selection with explicit
critical overrides and honest empty output. So:

> **The selector is a declared priority over named families with a declared tiebreak, published in the
> surface's own help. It computes no score and fits no model.**

This is not a compromise — it is what already ships (§1.2), and the only form that survives
`rfc/review-evidence-compiler.md`'s explicit refusal to *"claim which moments teach best"*. A
recommended priority, offered to O7.2's ruling rather than asserted:

```
0  terminal outcome / the result
1  the last ply at which the objective or the result was still available   (last_level)
2  a grade at the blunder rung
3  phase transition — midgame→endgame entry                               (signal 5)
4  a tactical family firing, where admitted as a learner event            (signal 4)
5  a grade at the mistake rung
6  human-policy split / entropy change                                    (signal 1, when funded)
7  shape span
8  irreversibility
   tiebreak: |ΔWin%|, then ply
```

Two changes from the shipped order, both evidenced. `eval_pivot` was priority 1 and is now split by
rung, because a single "eval pivot" class cannot express the owner's distinction between blunders and
everything else. And **`irreversibility` drops to last**: it fires on **85/634 = 13.4%** of spine
transitions, of which only the `last_of_role` subkind clears the not-a-restatement test — **a 79.9%
false-positive rate on a shipped, unasked marker**, reproduced independently by two harnesses
(`feedback-versus-the-dashboard.md` §5b) `[V]`. In the same census `phase_change` fires on **1 of 634
= 0.2%** `[V]`, which is what makes it cheap to rank highly: it is the rarest and one of only two
signals with full coverage.

### 3.5 [[D1424]] — the fifth signal, and what an admissible one would need

The owner named *excellent moves*. It does not exist and law 8 forbids inventing it. What this dossier
can do is specify the shape an admissible mechanism would have and rule out the three that will be
reached for first.

**The structural problem, precisely.** `MoveQualityClass` is three negative members (`grade.ts:3`) and
the operand is a Win%-point **drop**. A move that loses nothing scores zero, and so does every other
move that loses nothing. **Praise needs a different measurement, not a different threshold on the same
one.** No re-valuing of 2.5 / 10 / 15 produces a positive class.

**What the field's positive class actually is, which settles what ours cannot be.** freechess's
published `Brilliant` is *"best-move match, an eval floor, a not-already-winning cutoff and a
hand-tuned sacrifice-viability test with special cases for rooks-and-above versus minors"*, and
chess.com's version *"makes it easier to earn if you are lower-rated"* `[V]`. Read plainly: **the
field's positive class is a hand-tuned heuristic conditioned on the player's rating.** R15's
byte-identity rule (`rfc/learner-rating.md` §8) forbids the second half outright, and the first half is
`[M]` by construction — nobody publishes a derivation. We could reproduce it; we could not cite it.

Three candidate mechanisms for us, and only one survives:

1. **Narrowness — "this position had one answer".** Operand: the count of legal alternatives whose
   Win% sits within ε of the played move's. It is a statement about **the position's narrowness** and
   a record of what happened, not a judgement of the player: *"Only one move held this. You played
   it."* Same register as `rfc/return-scheduling.md` §8's solitaire score, whose reference is *the move
   actually played*, never a grade.
   **What it needs and does not have:** multi-PV at the node. `recorded.engine.eval@1`'s own limitation
   reads *"best move and principal variation are absent"*, and `live.stockfish.eval@1`'s adapter
   *"excludes bestMoveUci from fact-only consumers"* (`rfc/move-quality-grades.md` §5.3) `[V]`. So it is
   a **new recorded projection with its own evidence-catalogue declaration**, not a UI change — and its
   `answerContent` must stay `["evaluation"]`, since a payload carrying a move raises
   `EVIDENCE_DERIVATION_WIDENS` at compile.
   **Two traps to name at design time.** It must never be rating-conditioned (that *is* `Brilliant`).
   And its copy must be buildable **from non-banned vocabulary** — see the note below.
2. **Human rarity — "few players at your band find this".** Operand: Maia policy mass. **Disqualified
   as praise by three standing laws.** `design/05` rung 4: corpus frequency *"says what happened, not
   what is good"*. `rfc/skills.md:166`: *"Popularity establishes common or unusual, never good or
   bad"*. `design/06` §3 law 5, measured: **rarity is not value**, ρ = −0.143 `[V]`. This is the
   mechanism that will be built by accident, because the data is already there and the sentence writes
   itself. It may **select**; it may never **valence**.
3. **Outcome correlation — "moves that preceded wins".** **Refused by name**: `rfc/skills.md` §8.5
   lists outcome correlation among the refused valence authorities, alongside lift, rarity, Maia mass
   and Explorer frequency `[V]`.

**Recommendation, and it is a re-cut rather than a refusal** — the move `design/02`'s transformation
amendment prescribes (*"a conflict with an invariant is a design prompt, not a veto"*): **the fifth
signal is mechanism 1, and it is not called "excellent."** It is called what it measures — *the
position was narrow and you stayed on the line* — and it lands as a **tier-1 note, not a badge**. A
badge is a praise class in different clothes.

> **Vocabulary note, and a correction to a standing dossier.**
> `design/research/band-flattery-and-buried-value.md` §5.1 reports that *"every one of the eighteen
> [`BANNED_JUDGEMENTS`] is a criticism or a comparative. Not one is a praise adjective"*, and that
> *"a brilliant practical choice here"* passes `voiceCheck` with `valid: true`. **That is stale at
> HEAD.** `packages/runtime/src/voice.ts:93-97` now carries **thirty** words including `brilliant`,
> `excellent`, `great`, `superb`, `perfect`, `impressive`, `beautiful`, `accurate`, `inaccurate`,
> `inaccuracy`, `precise`, `clever`, `sharp`, `strongest` `[V]`. The hole is closed — and the closure
> is a **design constraint on mechanism 1**: its rendered sentence may use none of those words unless
> the deterministic sentence itself grounds them. *"Only one move held this. You played it."* contains
> no banned word; *"an excellent move"* is unsayable by construction. That is the right outcome, and it
> means the re-cut is not merely preferable but the only wording that can ship.
> ([[D1418]] remains true in the same file: `plan`, `initiative`, `compensation` and `pressure` are in
> **no** list — `CHESS_LEXICON` at `voice.ts:100` `[V]`.)

**The register problem that must be handled meanwhile, because it is real.** Until mechanism 1 exists,
every grade on the surface is negative, and a review whose entire annotated vocabulary is `inaccuracy |
mistake | blunder` **reads as a product that only tells you what you did wrong**. The honest mitigation
costs nothing: **the tier-1 note vocabulary is not only grades.** Phase transition, theory exit, first
endgame entry, structure achieved, a tablebase turning on, the last ply the result was still available
— these are neutral in register while claiming nothing about the player, and they are already computed.
Specify the note column as **facts about the game, of which grades are one family**, and the surface
stops being a list of accusations without a single new claim.

### 3.6 [[D1421]] — already-decided positions, and why this is a user-perspective defect first

**Recomputed independently for this dossier** `[V]` (`winPercentFromCp`, coefficient 0.00368208, input
clamped ±1000):

| before → after (cp) | Win% before → after | drop | under 5/10/15 | under **2.5/10/15** | Lichess |
|---|---|---|---|---|---|
| +467 → +267 | 84.81 → 72.77 | **12.03** | mistake | **mistake** | unlabelled |
| +763 → +563 | 94.32 → 88.83 | 5.49 | inaccuracy | **inaccuracy** | unlabelled |
| −678 → −878 | 7.61 → 3.79 | 3.82 | *nothing* | **inaccuracy** | unlabelled |

Two things this settles. D1421 **survives D1422 unchanged** — the ruling's own text says so and the
arithmetic confirms it. And **the ruled floor makes it worse**: the third row crosses into emission
only because the floor moved to 2.5. That is the cost the owner accepted, and it lands on exactly the
class of positions where a label is least defensible.

**From the learner's side this is the most corrosive single defect on the surface**, more so than its
severity suggests. Telling someone three pawns up that they made a *mistake* does not merely mislabel
one move — it **burns the credibility of every other label on the screen**, including the correct ones,
because the learner now knows the labels do not mean what they say. WintrChess is the live proof that
this is not hypothetical: *"moves flagged blunder while recommended as best"* is the complaint that
made a free unlimited reviewer untrusted `[V]`.

**Recommendation, in two parts, because the grade and the moment are different objects.**

- **The grade suppresses**, via a cited `decidedness` cell in `grade-convention@2`. **This is not an
  invention**: a *"not-already-winning cutoff"* is in freechess's published implementation `[V]` (§3.2),
  so the concept is field practice with public source, even though its *value* is theirs and unpinnable.
  Declare it as **a Tabiya composition of cited values** — the precedent is one day old and exact:
  D1422 declared 2.5/10/15 that way. The threshold is **derived, not chosen**, per `design/05`'s
  engine-condition clause 2: *a threshold must sit off its instrument's optimality boundary*, with
  `tablebase_dtz_regression`'s floor of 3 as the pattern (*"the first value provably off the
  boundary"*).
- **The moment is never a tier-2 door in a decided position, whatever the grade.** A decided position
  has nothing to rehearse: the door promises *play it again and it could go differently*, and here it
  could not. This is a selector rule and it is free.

**And the suppression must be visible.** A learner who drops two pawns while three up and sees nothing
will conclude the product did not notice. State it once at the region level — *"From move 31 the
position was decided; moves are not graded here"* — which is invariant 5 again. **Silent suppression is
a second defect, not a fix for the first.**

### 3.7 Explaining the ranking to a learner without it becoming a score

This is the hardest copy problem on the surface, because the learner arrives pre-trained: on chess.com
and Lichess the first item in a review list *is* your worst move, so an ordered list of moments will be
read as a ranking of your play no matter what it is called.

**Three rules, and the first is the whole answer.**

1. **The order is never shown as a rank.** No position numbers, no "top 3", no percentage, no
   "importance". The cards simply appear in order, and **the order is expressed as a reason, not as a
   place** — each card states the named family it is here for, in that family's frozen template:
   *"The result was still available here."* · *"The middlegame ended here."* · *"Your evaluation fell
   18.2 win-points across this move, past the 15-point rung (grade-convention@2/review)."*
2. **One sentence does the disambiguation, and the surface owes it permanently.** Recommended, as a
   region-level line and not a tooltip:

   > **"These are the moments this game left evidence about, in the order we look. It is not a ranking
   > of your play."**

   Short, true, and it defuses the imported expectation directly rather than hoping the learner does
   not have it.
3. **"Educational value" never appears in the copy.** It is a claim about the learner's learning, which
   we cannot measure — D1424's problem generalised. The selector may be named that internally; the
   surface says what it did. And the published-threshold discipline applies: `rfc/skills.md:436-437`
   refuses hidden thresholds by name and `rfc/return-scheduling.md` §3 publishes its counts, so **the
   priority list of §3.4 is published in the surface's own help.** Chessable's *"3 or more mistakes and
   a review score below level 4"* is the named anti-pattern `[P]`.

**What this buys that a score would not.** A score invites the two questions we cannot answer — *why is
this a 7?* and *how do I raise it?* A reason invites the one we can: *what happened here?* — which opens
the door, which is the product.

**The failure mode to keep in view while writing this copy** is documented on a live competitor and it
is not fabrication in the obvious sense. Chessigma's coach brief reads: *"Your openings are clean. Your
endgames are not… Three of your eleven losses were already won. Save rate sits at 20%… **The blunders
aren't bad ideas. They're rushed ones.**"* The repo's verdict is the sentence to keep pinned above any
review copy we write: *"**The mixture is the danger: the true numbers launder the invented clause**"*
`[V]` (`teardown-chessigma-desk.md` §5). Our tier-1 note is exactly such a mixture by construction — a
number beside a sentence — which is why `rfc/review-map.md` §7 fixes *the sentence*, not the fragments.

### 3.8 Cost and dependencies

| Item | Cost | Depends on / blocked by |
|---|---|---|
| Move list, every ply, clickable, live board | one new screen object (`rfc/review-map.md` §3 — *"the one genuinely new UI object"*) | — |
| Tier-1 note rendering | small — one renderer per admitted family, into the row | `rfc/review-map.md` §7's frozen-template table |
| Tier-2 card + door | the path ships (`App.svelte:326-332`); generalising to every row is that RFC's §4 | **cross-device defect**: `App.svelte:369-371` throws *"This device does not hold the imported run writer session"*, so the primary CTA is dead on any device other than the one that played `[V]` |
| Whole-game selector | ~1 function; families exist in `story.ts` | O7.1 (budget) and O7.2 (admissible families) are **unruled** |
| Single ladder 2.5/10/15 | `grade-convention@2` amendment + criterion 4 inversion | accepted `rfc/move-quality-grades.md`; **register amendment, not a direct edit** |
| Decided-position suppression | one cited cell + one selector rule | value derived off the optimality boundary |
| Signal 1 (entropy) | **a new per-node learner-side human-policy pass** — the largest item here | nothing records that distribution today |
| Signal 3 (narrowness) | a new recorded multi-PV projection | `answerContent` must stay `["evaluation"]` |
| **Where a retry lands** | the compare screen's prominence is inverted (§1.7) and its strip has lift ≈1.01× with a median 36 differing observations per fork pair `[V]` | the review lane inherits this; a two-tier review that hands off to it has moved the density problem, not solved it |
| Any of it rendering at all | — | **[[D1445]] blocks the whole surface**: `ModuleAnswerCeiling` has **no `evaluation` member**, so `derived.grade.move_quality@1` is admissible to no module in the product, *including the two its own disposition names* `[V]` |
| Law 8 on this surface | — | **[[D1409]] blocks `rfc/review-map.md` acceptance** until `voiceCheck` binds a judgement word to the byte-exact sentence that grounds it; [[D1419]] extends it to all four arms |

---

## 4. Feature — progression, and what a campaign act feels like to finish

### 4.1 What a user expects

The shape every roguelike has trained them on: a boss falls, a screen appears, numbers go up, something
unlocks with a flourish, and a run summary says how they did.

**That expectation is wrong here in a way that cannot be patched, and the design already knows it.**
`design/06` §5: *"What escalates here is LEGIBILITY, not power… The power curve is flat **by
construction**"*. There is no number to make go up, and every device that would make one compound is on
the refused list. So the act-end screen **cannot be a score screen**, and the interesting question is
what it is instead.

### 4.2 What competitors do

- **Chessable stacks the full gamification kit** and its own author says it does not work.
  **XP** bound to SRS level (+40/+50/+60/+70/+80/+90/+100/>100 for levels 1–8); **ranks up to
  "Legend"** with secret badges above; **streak badges past one year with vacation protection and
  streak-repair support articles**; main, per-course and daily-streak **leaderboards**; and a learning
  status vocabulary of **Not learned / Paused / Learning (1–7) / Mature (8+) / Difficult** `[V]`
  (support articles 9043479, 9043564, 9044158, 9027843). GM Ikeda, a Chessable author: *"**XP and daily
  streaks don't improve chess strength**"* `[V]`.
- **ChessMonitor's marquee number is a manufactured skill estimate**, and the repo records the cost to
  us rather than explaining it away: a front-page, Giri-endorsed **FIDE Elo estimate** derived from your
  online games, and *"the dashboards' pull **is** the single number going up. That is direct
  demand-evidence for exactly what our no-skill-numbers rule refuses to synthesize… **Recorded as a
  real cost of the posture, not explained away**: our event-shaped milestones must be satisfying enough
  to compensate, and B7's bet is unproven against this shelf"* `[V]`/`[P]`
  (`quickpass-wintrChess-encroissant-chessmonitor.md` §3).
- **Chess.com's report card shows an estimated rating** per game `[V]`, and its bot crowns already ship
  the assistance axis this repo considered: 3 for a win with no help, 2 with 1–3 hints/undos, 1 with 4+
  ([[D302]]) `[P]`.
- **4545 League's honour roll is the one status mechanism that survives our leaderboard refusal.** No
  prizes, no entry fee (`SeasonPrize` has no monetary field), and the status economy is *"all
  **non-numeric records of events**"* — permanent standings shading, *"Gold indicates previous 1st place
  finishers. Silver… Bronze…"*, so *"**a result in season N marks your name in every future season's
  table**"*; plus a Most Active board and a 100 Games Club `[V]`
  (`league-as-return-loop.md` §1.5). The dossier's recommendation: *"That is an honour roll, not a
  leaderboard, and it is the same object class as our shipped milestones. **If the ruling goes against
  the table, the shading survives it intact.**"*
- **Yusupov's pass mark is the traditional progression shape, and it is legal for us.** Each chapter is
  a concept through 10–15 worked examples, then **12 exercises on a real board**, graded points with
  partial credit and **a pass mark per chapter** (e.g. 15 of 31); below it, **redo the chapter**; a
  final test per book; a score card tracks the course `[P]`
  (`design/research/titled-player-training.md` §1.3). Its transfer note is the important half: *"pass
  marks gate progression per chapter-sized pack, redo on fail — a pack-level authored threshold, not a
  learner rating, so it stays on the right side of the 'no learner number' line: **the pass mark judges
  this pack's attempt set**, exactly like the shipped 'grade of this attempt, not a verdict on the
  position'"* `[P]`/`[V]`.
- **Aimchess is the dashboard-first IA**, and its own store reviews name the failure: *"a list of lists
  with no particular order of difficulty, frequency, priority, expected duration"* `[V]`. The pattern
  finding is worth keeping though: *"the analytical home is a separate screen, which is precisely what
  keeps the drill/play screens sparse — **the value is the separation**"* `[P]`
  (`competitor-play-ux.md` §2).

### 4.3 What we should do

**The act-end screen is a catalogue diff.** [[D1151]] ruled progression denominated in **the catalogue**
— shapes met, structures played — and the natural *moment* for a collection is when a chunk of the run
closes. So the screen shows what this act **added to the collection**: the shapes that were on the
board, the structures played, the modules unlocked, each linking back to the preserved run where it
happened.

**Three properties it must keep**, and [[D1171]] is explicit that one careless sentence collapses the
whole thing:

1. **It names content, never the learner.** *"The Carlsbad structure was on the board in this run"* —
   never *"you have learned the Carlsbad"*. The catalogue is lawful **precisely because it claims
   nothing about the learner**; it is the [[D345]] exposure-restatement pattern that R20 disqualifies
   for skill credit, admissible only while it stays exposure.
2. **The denominator is the catalogue and it is shown.** A completable denominator is what makes a
   collection feel like one — and it is the property ChessMonitor's Elo estimate does not have.
3. **Every entry reopens its own evidence** — the property that makes a mark lawful (`rfc/skills.md`
   §6.1: *"it links to the preserved run, so the claim reopens its own evidence"*).

**The honest prerequisite, stated at the top rather than in a footnote.** [[D300]]: 132 of 156 authored
`concepts` are singletons keyed `pack:${packId}#${raw}`, so the same string in six packs is six keys;
the honest collection today is the **25-entry shape library**, and the supply-side census is **15 of 49
lenses and 9 of 25 shapes unnamed** `[P]`. A catalogue screen over the concept vocabulary as it stands
would show a learner 156 items nobody can complete — worse than no screen. **So it ships over the shape
library, with the concept axis rendered as honestly absent**, until D300's bounded naming job lands.

**A complement worth putting to the owner: the Yusupov pass mark, at pack scope.** The catalogue answers
*what did this run add*; it does not answer *did I finish this*. Yusupov's shape answers the second
without a learner number, because **the threshold judges the pack's attempt set, not the person** — and
we already ship the analogue sentence (*"That is a grade of this attempt, not a verdict on the
position"*). It composes with `campaign-core`'s seal vocabulary directly: a node's seal already carries
`achieved | failed | transitioned | open`. This is named as an owner decision (§8.7), not adopted here,
because a pass mark that gates the next node **would gate progression on outcome**, which [[D1040]]
places outside the core path — so it is admissible only as an authored *pack* property or a prestige
input, never as the map's advance condition.

**Two rules for the ceremony itself, and I do not think either is written anywhere.**

- **The screen looks the same whether you swept the act or failed every node.** `campaign-core` §4.1
  grants a node's `module_unlocked` reward **whatever the verdict** — [[D1040]]'s ruled core behaviour,
  not a default — and winning gates only the §3.5 prestige layer. **If the act-end screen celebrates
  harder for `achieved` seals, it has reintroduced winning-gates-progression through presentation**,
  underneath a mechanism carefully built not to. This is checkable: layout, copy and emphasis are a
  function of *what was added*, never of *how it went*.
- **ADR-0007's satirical ceremony may not become a real one.** No fanfare scaled to achievement, no
  rarity language on an unlock (`design/06` §3 law 5 — rarity is not value, ρ = −0.143 `[V]`), no
  confetti tier. The unlock is stated, its effect is stated, and the run continues. Chessigma's own
  benchmark page supplies the aphorism from the other side: *"a reviewer that stamps brilliant on
  ordinary moves is **handing out confetti, not information**"* `[V]`.

**What the act-end screen must not carry**, from `campaign-core` §8: any engine evaluation, centipawn
number, or grade — the node-card and strip vocabularies are **closed lists** and criterion 12 greps the
shipped surfaces for the refused vocabulary. A campaign is the one place where the eval bar is
structurally absent, and the act-end screen is where someone will want to add it.

### 4.4 Cost and dependencies

| Item | Cost | Depends on |
|---|---|---|
| The catalogue diff screen | medium — a new surface; **no campaign UI exists at all today** `[V]` | `rfc/campaign-core.md` **Discharge D6** owns exactly this, and records that §7's node-card vocabulary is a closed list *"that cannot express a what's-missing mark"* |
| The collection vocabulary | bounded naming job against a measured denominator | [[D300]] — prerequisite, not footnote |
| The what's-missing mark on the pack card | small | D1151 put it on the pack card deliberately, *not* on a progress screen |
| Pass-mark complement | pack-schema question | owner decision §8.7; must not gate map advance ([[D1040]]) |
| Composition / visual design | deferred by ruling | [[D717]] — campaign composition comes last |

---

## 5. Feature — what earns a rewind, and how to say it without punishing

### 5.1 What a user expects

A **currency**: lives, hearts, energy, tickets. Every free-to-play game has trained the same three-beat
pattern — you have some, they run out, you wait or you pay. A counter in the corner of a board activates
that schema instantly.

**It is wrong twice**, and the copy has to defeat both:

1. **There is no pay branch and never will be.** ADR-0007: unlocked by playing, never purchased;
   `campaign-core` §2.5: charges are *"not purchasable, not sellable, not convertible"*. So the UI must
   not have the *shape* of a store — no timer, no "get more", no secondary currency.
2. **The scarcity is not a punishment for failing.** `campaign-core` §2.1: one grant is appended when a
   node seals, **whatever its verdict** — *"income prices finishing, not winning, so a failed seal still
   funds the next attempt at the next node."* A learner who fails every node earns exactly as many
   rewinds as one who wins every node. **This is the most important thing the surface has to convey and
   the shipped copy does not convey it at all.**

### 5.2 What competitors do

Nothing in the chess set prices a retry, which is why the schema the learner brings is from outside
chess. Three adjacent findings:

- **Chessigma manufactures retention only in the paid tier** — a **DAY STREAK** row and a *"Today's
  to-do 0/15"* checklist `[V]`. The repo's transformation is already written and it is the right one:
  *"a day-streak is time-based [and collides with ADR-0007]… the transformation is a queue selected from
  the learner's own due packs and preserved attempts, and **a counter of attempts finished, not days
  visited**"* (`teardown-chessigma-desk.md` §7-H) `[V]`/`[M]`.
- **Chess.com's bot crowns price assistance, not retries** — 3 crowns unaided, 2 with 1–3 hints/undos,
  1 with 4+ `[P]`. Note the shape: it counts *help taken*, not *attempts made*. [[D302]]'s constraint (a)
  is the line that matters for us — *"no count of rewinds, forks or attempts may ever be an axis"*.
- **The evidence on imposed structure is that it works and is disliked.** Ariely & Wertenbroch (2002):
  externally imposed evenly spaced deadlines beat self-set ones (M = 88.76 vs 85.67, t(97) = 3.03,
  p = .003), **and** structure made people work more and **enjoy it less** (liking 22.1 / 28.12 / 37.9,
  p < .001) `[V]` (`league-as-return-loop.md` §5.4). A rewind economy is imposed structure; expect the
  same split, and design the copy for the enjoyment half.

### 5.3 What we should do

The shipped spec renders `⟲ N` with *"Earned rewinds: N remaining this campaign"* (`campaign-core` §2.4).
That is a balance, and a balance alone reads as a countdown.

**Recommendation 1 — the strip states the income rule, not just the balance.**

> `⟲ 3` — *"Three rewinds left. You earn another every time you finish a node — win or lose."*

Two sentences, both true against §2.1, both checkable. It converts a scarcity meter into a **rhythm**:
finish a node, get a rewind. That is the difference between *you are running out* and *keep going*, and
it costs one string.

**Recommendation 2 — the refusal names the next income event, not the shortage.** At zero,
`CAMPAIGN_REWIND_EXHAUSTED` should read *"No rewinds left. Finishing this node earns one."* A refusal
that names its own recovery is a rule; one that names only the shortage is a wall.

**Recommendation 3 — the first spend is disclosed at the moment it costs.** Criterion 4 already requires
the balance be visible *before* the first spend; the user-side half is that the first rewind of a
campaign should say what it cost, once. A silent decrement is how an economy becomes a trap.

**Recommendation 4, and this one is a finding rather than a polish note.** The economy is
**campaign-scoped** by ruling (`design/06` §2c: *"Outside the campaign — drill packs, Just Play, Review —
rewind stays exactly as free as `00-thesis.md` promises"*). But **the learner cannot tell a campaign
board from a drill board**, and nothing tells them. A learner who learns *rewind costs something* inside
a campaign will carry that belief into drill packs — where rewind is free and is the entire thesis
(*"experimentation without cost"*). **D945's campaign-scoped economy would then have silently priced the
thesis everywhere in the learner's head, which is exactly what §2c's scoping was written to prevent.**

The fix is symmetric and cheap: **the first rewind outside a campaign says, once, that it is free.**
*"Rewinding here costs nothing. Every attempt is kept."* One string, once per learner, protecting the
product's central promise from its own campaign mechanic.

**Recommendation 5 — keep the design's own word.** `design/06` says *earned rewinds*; the schema says
*charges*. "Charges" is a game-currency word that activates the store schema; *earned rewinds* says what
it is and where it came from. The learner-facing noun should be the design's.

### 5.4 Cost and dependencies

All five are strings on a surface that does not exist yet (no campaign UI at HEAD `[V]`), **except
recommendation 4**, which is a string on the **drill** surface, can land independently, and should —
because it protects an invariant rather than decorating a mechanic.

---

## 6. Feature — being invited back

### 6.1 What a user expects

A streak. A daily puzzle. A red badge. A weekly league that resets. A push notification saying they are
falling behind. Duolingo trained this across the whole category; Chess.com's daily puzzle and
Chessable's review counter both run on it.

**Two reasons it is wrong here, and only one of them is doctrine.**

The doctrinal one: `CLAUDE.md` rejects XP, streaks and leaderboards as retention levers, and
`rfc/return-scheduling.md` §12 refuses them by name. The structural reason underneath is that **a streak
measures attendance, not learning**, and its mechanism is loss-aversion over a number the product
invented — a claim about the learner with none of a mark's grounding.

The practical one, which is larger and is §0.3: **we have no outbound channel at all.** Zero hits for
`notify`, `notification`, `email`, `webpush`, `reminder` `[V]`. *"A league's entire mechanism is a
message arriving when you are not looking… **Chesster is twelve distinct notification behaviours and we
have zero.** This is the largest missing piece and it is not chess-shaped at all"*
(`league-as-return-loop.md` §4) `[V]`. So every recommendation below is about what the learner finds when
they arrive.

### 6.2 What competitors do

**Chessable MoveTrainer — the mechanics, exactly.**

| Level | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|
| Interval | 4 h | 1 d | 3 d | 1 wk | 2 wk | 1 mo | 3 mo | 6 mo |

`[V]` (support 9043598). The SRS unit is **the move**: *"Each move in a variation has its own timer, so
you can be at different levels within the same variation"* `[V]`. **A lapse is a full reset, not a step
down** — *"If you get things wrong, you are back to the beginning"* — a fixed Leitner ladder with no
ease factor `[V]`, and it is the named anti-pattern for our own step-down ([[D864]]). **Overstudy** is
graded asymmetrically: off-schedule review that is wrong resets the timer; right *"nothing changes"*
`[V]`. **Difficult Moves** is a threshold of counted events (*"3 or more mistakes and a review score
below level 4"*) shown as a **stat**, PRO-gated `[V]` — where ours would open the game.
**Review debt is real and Chessable's own docs admit it**: *"avoid endlessly repeating material that you
are not able to master as this will end up occupying all of your study time"*, and a support article
literally titled *"I constantly have too many moves to review. Can I adjust this?"* `[V]`.
Its top user criticism is that *"spaced repetition weights common and rare lines equally"* `[V]`/`[P]` —
which is what `rfc/return-scheduling.md` §4's corpus-frequency-at-band ordering answers.
And the honest reading of *why* it retains: *"the moat is a two-sided content marketplace wearing an SRS;
**the SRS alone would not have won**"* `[V]`.

**Chessigma returns by offer**, and this is the most adoptable framing in the set. Verbatim from
`/supercoach` `[V]`:

> *"**You blew a +3 in a real game. Pick it back up at that exact move. Same clock. Bot at your level.
> Finish it this time.**"*

The repo's structural read: *"That is **commit → play the consequence**, from a moment selected out of a
reviewed game, against an opponent, at the original time control. Structurally it is our `story-reentry`
branch with the clock preserved… **Chessigma actually hands the learner the board back and makes them
finish**"* `[V]`. And then the ceiling: *"Across every fetched surface there is **no** statement — none —
that a second attempt is stored beside the first"* `[V]`.

**Its sibling module is the strongest cheap adoption in that teardown.** **Conversion Trainer** —
*"**Won the position, lost the game? Drill the moments you let it slip.**"* Verdict: *"Collision: **none.**
Why it is the cheapest on the list: we ship the grading (`save`/`hold`/`resist`) **and** the detector that
finds the moments (the story's near-level-in-a-loss moment). The only missing piece is a named entry that
composes them"* `[V]`. And the critique that makes it *ours* rather than theirs: theirs *"drills throws,
**graded on centipawn loss not outcome**"* — *"their Conversion Trainer is our `save`/`hold` question
asked with only a centipawn instrument to answer it"* `[V]` (`competitor-matrix.csv`, Chessigma row).

**Leagues and social obligation — the evidence is against, and it is unusually strong.**
All `[V]`, all from `league-as-return-loop.md` §5.4:

| Study | n | Result |
|---|---|---|
| Kizilcec et al. 2020, *PNAS* 117(26) — social-accountability arm, preregistered | ~250,000 across 247 courses | **Null on completion**: β = 0.89 pp, CI −0.22 to 1.99, **P = 0.115** — despite raising week-one and sustained activity |
| Baker, Evans & Dee 2016, *AERA Open* 2(4) — scheduling prompt | 18,043 | **Negative**: treatment-on-treated **−4.8 pp** against a 9.3% control rate, a **52% relative reduction** |
| Russell et al. 2009, *JRTE* 41(4) — the only true cohort-vs-solo RCT | 231 | Dropout **53% cohort** · 41% peer · 45% instructor · 44% self-paced — the cohort arm **directionally worst** |
| parkrun cohort study, *Health Promotion Int.* 39(4) | 223,224 | A free weekly scheduled social event retains **4.3%** as high maintainers; **76.4% are Few-Timers** |
| Milkman et al. 2021, *Nature* 600 | 61,293, 53 arms | Only **8%** of interventions produced change measurable four weeks later; the two social-norms arms ranked **3rd of 53** and **53rd of 53** |

And the audit of the counter-claims: *"Every high figure traced back to a vendor, a founder, or an
uncited marketing page"* `[V]`. Meanwhile the mechanism that *does* survive randomization is **spacing**:
Ariely & Wertenbroch's effect vanished when the self-imposed group was restricted to those who happened
to space evenly (effect sizes cut 55–79%, significance killed), *"so the mechanism is **spacing**, not
self-imposition or commitment. **There is no social component anywhere in the study**"* `[V]`.

The conclusion the repo already drew, and this dossier endorses: *"**We already built the lever the
evidence supports and were about to be talked out of it by a lever the evidence does not.** … **Making
the spacing feel imposed — not adding a person — is what the evidence licenses**"* `[V]`. With the
warning aimed at us specifically: study-together groups help low-achieving and less-motivated students
and **mildly hurt** highly motivated ones — *"a chess drill product's users self-select as motivated,
which is exactly the group the sociality literature says gains least and can lose"* `[P]`.

**Two operational rules from the one league that works, and both are cheap and transferable.**

- **Intention is not a signal; a per-occasion declaration is.** 4545 removed *"are you committed?"* from
  its registration form, leaving the reason in source: `# We do not want to ask about this anymore, it
  was decided that it is a useless question.` What replaced it is *"Indicate any rounds you would not be
  able to play"* `[V]`. *"Every scheduling surface we ever build should ask the second question and never
  the first."*
- **Price lateness, not absence.** Declaring unavailable **before** the round yields a ruled draw;
  **after** it starts yields a forfeit `[V]`. *"The league prices lateness, not absence — exactly the
  distinction a scheduling system needs and almost never makes."*

And the control that settles the intuition: **Chess.com's Leagues have no obligation at all** — eight
one-way tiers, divisions of 50, weekly reset, points weighted by time control, *"You can never go back
down once you advance"*, and **no pairing, no scheduled opponent, no deadline** `[V]`. *"**A ranked table
is not the thing that makes a league a return loop.**"* What *does* produce 4545's 92–95% conversion is
an operations answer: **121 alternates for 352 seats — a 34% bench-to-roster ratio** `[V]`.

### 6.3 What we should do

**The return offer is a position with a promise, and the promise is about the position.**

**Adopt Chessigma's frame — with the transformation the repo has already derived, not the one that comes
to mind first.** The obvious edit is to keep the number and drop the accusation (*"You were +3 here"*).
**That is the trap**, and the teardown names it: the collision is not the word *blew*, it is that
*"**the offer names the evaluation before the learner plays a move**"* — ADR-0006, commit before you
learn anything. The derived transformation is *"the offer may state the **recorded historical outcome
and the moment index** (facts) without exposing an eval at the board"* `[V]` (`teardown-chessigma-desk.md`
§7-B). So:

> **"You lost this game. The last moment it was still level was move 24. Pick it up there."**

Same hook, same specificity, same implicit challenge — no evaluation before the first move, no verdict
about a person. And the detector is already shipped: *"the last recorded position within one pawn before
an imported loss"* is one of the six story-moment families `[V]`.

**Then give it a name, because that is the missing piece and it is cheap.** The **Conversion Trainer**
composition — near-level-in-a-loss moment + `save`/`hold` objective + an opponent — is *"the strongest
cheap adoption in this teardown"* with **no collision** `[V]`, and it makes the return offer a *mode*
rather than a one-off card. Our version differs on the instrument, which is the whole point: theirs is
*graded on centipawn loss*, ours resolves an **outcome objective** — you either held it or you did not.
That is a differentiator we can state plainly without claiming anything about the learner.

**Three parts to the honest return offer.**

1. **The offer names the variation, not the count.** `rfc/return-scheduling.md` §7 found that varied
   repetition promises four named variations — *same position, new defense · related position, same
   idea · same structure, opposite side · same outcome, different material details* — and that
   **`schedules.variant` is written as a literal `NULL` by the auto scheduler (`storage.ts:2923`),
   settable only as learner free text, and read by nothing** `[V]`, while seven packs author
   `retryVariants` anyway `[V]`. Making that name visible is the single highest-value change to the
   return surface, because *"same position, new defence"* promises something **different** — which a
   streak can never do.
2. **The reason is stated, and it is about the position.** `/learn` presents no mastery percentage —
   correct, keep it — but it also states no reason, which makes the queue look arbitrary. Counted,
   published facts are admissible: *"you have played this twice; both were stable"*, *"this has come back
   three times"*. `rfc/return-scheduling.md` open question 1 asks whether a **categorical word**
   (`learning` / `mature` / `difficult`) may render at all; **this dossier's UX position is option (a) —
   events only, no word** — because a categorical word is a claim about the learner's state. It is the
   owner's to rule.
3. **The strongest invitation is a gap in the catalogue, not a gap in the learner.** [[D1151]] put the
   what's-missing mark on the pack card. *"The Carlsbad minority attack is in the library and you have
   never played it"* is a claim about **coverage**, not competence — the only pull mechanism here that is
   honest by construction, and the same object as §4.3's act-end screen seen from the other side.

**Vacation safety, and the 4545 rule that makes it sharper than "be lenient".** A learner returning after
two weeks should not meet a wall of overdue roots; `return-scheduling` §6 specifies a bounded intake, and
it is admissible where custom intervals are not because it **defers** without letting the learner choose
— it *upgrades* the imposition rather than weakening it `[V]`. The transferable refinement: **ask which
specific occasions they cannot make, never whether they are committed**, and **price lateness rather than
absence** — a declared absence is a deferral, an undeclared one is what the bounded intake absorbs.

**One repair the whole offer depends on.** `rfc/return-scheduling.md` §1 measured the shipped ladder
diverging from its own accepted RFC on **five of eight** histories, with two defects that mask each other:
a root **failed four times then passed twice** is scheduled **35 days out** where the accepted RFC says
**1 day** `[V]`. Every return offer this product makes is currently dated by that expression. **A return
surface built on it would be politely inviting learners back to the wrong positions at the wrong times**,
and no copy fixes that.

**What the return offer must never be**, as rules: no streak or consecutive-day count; no calendar grid;
no framing as falling behind; no learner-set intervals; no hidden threshold deciding what is "difficult".

### 6.4 Cost and dependencies

| Item | Cost | Depends on |
|---|---|---|
| Ladder repair (defects A and B) | small, and it is a defect against an accepted RFC | `rfc/return-scheduling.md` §1–§2; **nothing on this surface is trustworthy until it lands** |
| Variation name rendered | small — field exists, packs exist; the runtime must read it | that RFC's §7 narrow lift of the `retryVariants` refusal; a declared pack capability (its D3) |
| Reason line on a due row | small | open question 1 is the owner's; option (a) ships today's behaviour |
| Conversion-Trainer entry | **small — a named entry composing two shipped things** | the near-level-in-a-loss family (`story.ts`) + `save`/`hold` objectives; adoption verdict on file `[V]` |
| The what's-missing mark | medium | [[D300]] vocabulary, as §4.4 |
| Return line on the terminal sheet | small | §2.3 item 4 — and it is our **only** outbound channel (§0.3) |
| Any push/reminder at all | **large, and not chess-shaped** | zero notification machinery exists `[V]`; named here so nobody assumes it |

---

## 7. Contradictions and open collisions

Recorded rather than reconciled, per law 3 and law 6.

1. **[[D1151]]'s stated ground versus the shipped `RatingScreen`.** The ruling refused the learner's own
   history because it would be *"the first number this product has ever shown a learner about
   themselves"*; a point estimate, an interval, a game count and an abandonment count ship today `[V]`.
   The conclusion may stand — the rating is opt-in, per-game, and about *results* rather than *process* —
   but the ground as written is false and is quoted as a general principle. **Owner decision:** restate
   the ground, or accept that the refusal is narrower than its wording.
2. **[[D1445]] blocks the surface [[D1273]] and [[D1422]] just commissioned.** `ModuleAnswerCeiling` has
   no `evaluation` member, so `derived.grade.move_quality@1` is admissible to **no module**, including
   the two its own disposition names `[V]`. Every grade recommendation in §3 is inert until
   `rfc/module-registration.md` resolves it.
3. **[[D1409]]/[[D1419]] block `rfc/review-map.md` acceptance.** A judgement word is licensed only inside
   the byte-exact sentence that grounds it. [[D1417]] notes the consequence that
   `rfc/move-quality-grades.md` §6's *"the LLM may re-voice 'mistake'"* mechanism claim is invalidated —
   the outcome survives, the reasoning does not, and an amendment is owed. [[D1418]] adds that `plan`,
   `initiative`, `compensation` and `pressure` are in **no list at all** `[V]` (re-verified in this pass
   against `CHESS_LEXICON`, `voice.ts:100`), so no scoping rule reaches them.
4. **Game review has no home in the intent tier.** `design/03`'s "Review" area is branch-compare
   (`:57-67`, `:290`) and B3 is recorded *shipped in full* (`:325`). `rfc/review-map.md` Deviation 1 and
   Discharge D2 name the amendment; **law 5 — proposed, not written**, and this dossier does not write it
   either. Everything in §3 sits on that missing amendment.
5. **The tier-2 budget is unruled.** O7.1 recommends 0..3 with no minimum. D1423 does not settle it — it
   settles that a cap on *notes* is rejected. This dossier's reading is that **O7.1's number applies to
   doors only**, and that reading is the owner's to confirm.
6. **The two `band()` formatters disagree one screen apart** (§1.4) `[V]` — presentation decided per
   component instead of per concept, on the surfaces the frozen-template table does not cover.
7. **A shipped surface claims personalization we cannot back** (§1.4.3): 24 of 31 on-ramp packs say
   *"against an opponent near your rating"* over a **puzzle difficulty** rating `[V]`.
8. **Two research dossiers are stale in ways that matter here, and are corrected in place:**
   `classifier-coverage-and-noise.md`'s Lichess ladder gloss (§3.2 erratum, superseded by [[D939]]), and
   `band-flattery-and-buried-value.md` §5.1's praise-register hole (§3.5 note, closed at `voice.ts:93-97`).
   Both are `[V]` corrections; neither dossier is edited by this one.

---

## 8. Owner decisions this dossier names

Named, not taken. Each is small; each blocks something concrete.

1. **The tier-2 budget** (§3.3, §7.5). Recommendation: O7.1's 0..3 applies to **doors**; tier-1 notes are
   uncapped, which is D1423 read literally.
2. **The decided-position suppression cell** (§3.6). Recommendation: adopt it as a *Tabiya composition*
   — the concept has a public implementation in freechess `[V]` — derived off the instrument's optimality
   boundary, and **render the suppression**.
3. **Whether the fifth signal is re-cut** (§3.5). Recommendation: yes — *narrowness*, never *excellent*,
   never rating-conditioned; it costs a new multi-PV projection, and it is the only wording the shipped
   banned-word list permits.
4. **Whether to fund signal 1** (§3.4). A per-node learner-side human-policy pass. It is the owner's
   most-named detector and the one with no data.
5. **`return-scheduling` open question 1** (§6.3.2) — may a categorical maturity word render? This
   dossier's UX position is **(a) events only, no word**.
6. **[[D1151]]'s stated ground** (§7.1).
7. **Whether a Yusupov-style pack-scoped pass mark joins the act-end screen** (§4.3). It is legal — the
   threshold judges the attempt set, not the person — but it must not gate map advance, because
   [[D1040]] puts winning outside the core path.

---

## 9. Method, limits, and what would falsify this

**Method.** Every shipped string in §1 was read from source at HEAD `[V]`. The arithmetic in §3.6 was
recomputed independently from `winPercentFromCp`'s pinned coefficient rather than transcribed. RFC claims
are cited to the RFC and, where the RFC cites code, spot-checked at the symbol. Competitor claims are
inherited from the dossiers named in each pass and carry those dossiers' own labels; where a dossier's
number is superseded by a later measurement, the erratum is carried in place (§7.8).

**Limits, stated plainly.**

- **No competitor claim here was verified by this dossier.** It ran **no new competitor pass** and
  reproduced **no competitor UI hands-on**. `[V]` on a competitor claim below means *the cited dossier
  verified it at a primary source*, not that this pass did. The desk-first limits in
  `design/research/README.md` §Coverage limits apply in full, including the warning that the sweep's frame
  was "chess training tools" while the product has outgrown it — the nearest competitors for an *act-end
  catalogue screen* are not chess products at all, and none were searched.
- **No user has used any of this.** Per [[D649]] there are no participant studies and that is a permanent
  posture; validation is the owner's own play. Every *"what a user expects"* claim is `[M]` unless it
  cites a dossier — reasoned from the category's conventions, not measured on anyone.
- **§3.3's tier boundary is a design proposal, not a finding.** The measured inputs are the density split
  (216/138 versus 62/22 `[V]`) and the field's re-entry ceiling `[V]`; the inference that the boundary
  should be **the door** is `[M]`.
- **The honest cost of the no-numbers posture is recorded, not argued away.** ChessMonitor demonstrates
  that *"the dashboards' pull **is** the single number going up"* `[V]`. Our event-shaped milestones and
  catalogue must be satisfying enough to compensate, and that bet is **unproven** against a live shelf of
  products that make the opposite one.

**What would falsify the core proposal.** One owner run through a finished review surface with both tiers
rendered. Specifically: **if the learner opens tier-2 cards for moments that are not the ones they want to
replay, the door is the wrong tier boundary and severity was right after all.** That is a single session
with a clock, and it is the same instrument `design/06` §5 already owes for its minute-parity claim.

---

## Proposed ledger rows

Not written to `design/BACKLOG.md` by this dossier — several agents hold this worktree. Whoever routes
them re-verifies the head first.

1. 🐞 **The learner reads raw enum members at four surfaces.** `App.svelte:951` prints the
   `AttemptVerdict` enum (`stable | unstable | open`) unmapped; `GameStoryScreen.svelte:49` prints
   `StoryMomentKind` members with underscores replaced; `:52` prints raw centipawn integers; and
   `App.svelte:914` renders `{JSON.stringify(page.scan.population)}` directly to the learner. All four sit
   at moments the learner has invested the most `[V]`.
2. 🐞 **`session-controller.resume()` is the one catch that bypasses `sessionErrorMessage`** (`:233-238`),
   so a raw runtime message can still surface under `App.svelte:826` `[V]`. The standing audit's
   *"Run is terminal at node…"* finding is otherwise **stale** — intercepted at
   `session-controller.ts:74-82`.
3. 🐞 **The terminal sheet makes no return offer**, although the scheduler has already written this root's
   `due_at` by the time it renders `[V]` — and per [[D1230]]'s sibling finding, it is our **only** outbound
   channel, since `notify`/`notification`/`email`/`reminder` are 0 hits repo-wide `[V]`.
4. 💡 **The campaign-scoped rewind economy has no counterpart statement outside the campaign.** A learner
   taught that rewind costs something inside a campaign carries that belief into drill packs, where rewind
   is free and is the thesis. One string on the drill surface protects `00-thesis.md`'s *"experimentation
   without cost"* from D945's mechanic.
5. 💡 **Tier boundary proposal for [[D1423]]:** a tier-2 moment is one that can carry a `Retry from here`
   door; everything else eligible is a tier-1 note, uncapped. Derived from the measured density split
   (216/138 grades versus 62/22 severe `[V]`) and from the field's measured ceiling — *"nobody in the
   matrix re-enters play from the explanation"* `[V]`.
6. 🐞 **The two band formatters disagree one screen apart** (`RatingScreen.svelte:47-51` versus
   `CohortStanding.svelte:60-65`) `[V]`; the frozen-template discipline does not cover the rating surfaces.
7. 📊 **[[D1421]] recomputed and confirmed under the ruled ladder:** +4.67 → +2.67 is a **12.03**
   Win%-point drop and grades **mistake** under both 5/10/15 and the ruled 2.5/10/15; −6.78 → −8.78 is 3.82
   and crosses into **inaccuracy** only because the floor moved to 2.5 — the ruled floor makes the defect
   worse, as [[D1422]] predicted `[V]`. **And the suppression is not an invention**: freechess's published
   `Brilliant` already contains a *"not-already-winning cutoff"* `[V]`.
8. 💡 **[[D1424]] re-cut proposal:** the fifth signal is *narrowness* (*"only one move held this"*),
   grounded in a multi-PV projection that does not exist, never rating-conditioned. Human rarity and
   outcome correlation are both refused by standing law and are what will be built by accident. **The
   field's own positive class is a hand-tuned heuristic conditioned on the player's rating** `[V]` — we
   could reproduce it and could not cite it.
9. 📊 **Signal 1 has no population at the learner's nodes.** `human_divergence` fires only on
   `opponent.move_selected` (`pivotal.ts:31`); `capabilities.ts:135` records Maia policy mass as
   *"Recorded on opponent selections"*; `grep -rn entropy` over `packages`/`apps` returns 0; and 0 of 92
   packs carry a `prediction` interaction `[V]`. Entropy ranking costs a per-node learner-side policy pass.
10. 📊 **Erratum: `classifier-coverage-and-noise.md`'s Lichess ladder gloss (10/20/30 pp) is superseded by
    [[D939]]** — the corrected values are 5/10/15 (report) and 2.5/6/14 (practice) `[V]`. The dossier is the
    canonical home of the three-convention comparison and is cited for it constantly, so the stale number
    will propagate until the erratum lands in the file.
11. 📊 **Erratum: `band-flattery-and-buried-value.md` §5.1's praise-register hole is closed.**
    `BANNED_JUDGEMENTS` now carries thirty words including `brilliant`, `excellent`, `great`, `perfect`,
    `accurate`, `precise`, `clever`, `sharp`, `strongest` (`voice.ts:93-97`) `[V]`. The consequence is a
    design constraint, not just a fix: any future positive class must be sayable in non-banned vocabulary.
12. 💡 **A named Conversion-Trainer entry is a two-file composition of shipped parts** — the story's
    near-level-in-a-loss moment plus a `save`/`hold` objective — with **no collision** on the teardown's own
    verdict `[V]`, and it differs from Chessigma's on the instrument: theirs is *"graded on centipawn loss
    not outcome"* `[V]`, ours resolves an outcome objective.
13. 🐞 **The compare screen's prominence order is inverted against the thesis, and it is where every retry
    lands.** The grounded narrative is 7th of 8, collapsed, below an expanded engine sparkline `[V]`; the
    strip fires on 99.8% of transitions at lift ≈1.01× and leaves a median 36 differing observations per
    fork pair `[V]`. A two-tier review that hands off to it has moved the density problem, not solved it.

---

## Coverage matrix row — proposed, not written

`design/research/README.md` is a shared file and this pass commits only this dossier, so the row is
proposed here rather than added. Whoever routes it should append:

| Area | Feeds | Status | Report |
|---|---|---|---|
| Post-run UX per feature — run end, two-tier review and its selector, progression/act close, earned rewinds, the return offer (owner ask: *"from a user perspective per feature… PROPER UX"*) | [[D1421]]–[[D1424]], [[D945]], [[D1151]], [[D1273]]; `rfc/review-map.md` §§3–7, `rfc/return-scheduling.md`, `rfc/campaign-core.md` D6, `rfc/move-quality-grades.md` `grade-convention@2` | **shipped-baseline arm answered `[V]`; competitor arm inherited `[P]`/`[V]`-by-citation; owner-use arm open.** Every post-run string re-read at HEAD (three stale audit claims corrected, four live defects found); the D1421 arithmetic recomputed independently; two standing dossiers erratum'd in place. **No new competitor pass was run and nothing was reproduced hands-on.** Seven owner decisions named; six blockers recorded, of which [[D1445]] and [[D1409]] gate the whole grade surface | `ux-after-the-run.md` |
