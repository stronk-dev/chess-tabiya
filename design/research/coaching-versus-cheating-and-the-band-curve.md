# Coaching vs cheating, and the 1000→2000 curve

**Question,** in the owner's words, 2026-08-16:

> *"the core loop IS to play a proper game against a bot… but we need to balance 'cheating'
> to win VS 'coaching' to win while still keeping gamified elements."*
>
> *"we also need to balance the trajectory of career… maybe in the start you're facing easier
> opponents, or have more weapons/defenses/modifiers to win against a much stronger enemy???
> but in order to complete a run to max you'd need proper 2000 ELO skills yourself? cause the
> journey is 1000-2000 Elo?"*

Two questions that are the same question from two ends. This dossier lands **an encodable
coaching/cheating criterion**, **a difficulty-trajectory model for 1000→2000 naming which
levers are measured and which are authored**, and **what would falsify each**.

**Instrument.** No new harness. Everything marked `[V]` was read or computed in this pass at
`b65bd4e` against the repo's own source and `content/`: a census of `permittedAssistance` /
`AssistanceConfig` / the disclosure model / the capability register, a whole-`content/` census
of `targetElo`, `difficulty.{min,max}OnlineRapid` and `authoredBoundary.plyHorizon` over the
**89 pack-shaped documents** that declare an `id`, a `phase` and an `opponentPolicy`, and the
git history of the schema-0.9 prediction-grading removal. Findings inherited from R3/R4/R5/R9/R10
and from the campaign dossiers are cited to those dossiers and labelled `[P]`, because this pass
did not re-run their harnesses.

---

## 1. Verdict

**Q1 — the criterion.** Neither of the two shipped axes can express the coaching/cheating line,
and **timing alone is not the answer** — the shipped code refutes that itself. What separates
coaching from cheating is **how much of the learner's live decision an item resolves**, and it is
a third axis, orthogonal to both source-honesty (`permittedAssistance`) and preference
(`AssistanceConfig`). The criterion, stated to be encoded:

> **An assistance item is CHEATING when it names the move while the learner still has a
> committing decision that depends on it. Everything short of naming the move is coaching —
> and coaching still fails, separately, by volume.**

Four values, one field, and the shipped register already refuses the top one **at the wrong
granularity**: `capabilities.ts:96` publishes `Stockfish · bestmove / MultiPV rank / bestline`
as `disposition: "refused"` for the whole product forever `[V]`, which means the campaign as
currently specified **cannot ever hand a learner the move as a reward, even after the game**.
That refusal is the coaching/cheating line, drawn once, at instrument scope. The campaign needs
it at item scope.

**Q2 — the trajectory.** The product **cannot tell whether the learner played well**, deliberately
and in shipped copy — *"That is a grade of this attempt, not a verdict on the position"*
(`outcome-presentation.ts:170`) `[V]`. It cannot tell whether the **run** succeeded either: there
is no run-level roll-up at all (`attempts` PK is `(run_id, branch_id)`, `storage.ts:2525`) `[V]`.
What it can tell is a third thing — **whether an authored or tablebase-decided objective survived
the path you submitted** — and *"you'd need proper 2000 Elo skills"* is therefore a claim about
the **encounter's configuration**, never about the learner. **That is not a weakness; it is the
only version of the claim that can be true**, because a fully-suppressed encounter against a
band-2000 opponent *is* a complete specification of "2000-Elo skills required", and the learner
grades themselves by whether they beat it.

Four levers scale across the band. **One is measured and was inert until yesterday**
(opponent band; `[1000, 2400]` from R10, and the `SelfElo`/`OppoElo` regression was repaired at
`0985fa4`, 2026-08-15 20:56 `[V]`). **One is measured and shipped** (encounter horizon —
`plyHorizon`, 47 packs, median 10, range 2–40 `[V]`). **Two are licensed-but-uncalibrated**
(loadout size, capability suppression). Everything else the genre offers is on the refused list.

**And the content does not currently express a curve.** The corpus declares a *learner* band on
74 of 89 documents and it is broad and continuous — 42–58 packs cover every 100-point bin from
1400 to 2000 `[V]`. The *opponent* band is a two-point step function: of 73 `targetElo`
declarations, **30 sit at ≤1394, 39 at ≥1800, and exactly 4 — three of them real packs — lie in
the entire 400-point stretch 1400–1799** `[V]`. The 1000→2000 journey has a measured hole exactly
where it is supposed to climb.

---

## 2. Q1 — the four candidate distinctions, tested

The brief named four candidates and asked for better ones if they exist. Each is tested against
one requirement, taken from the owner's own win condition (`06` §0): **assistance must be strong
enough to swing a game against a boss.** A distinction that forbids that is not a criterion, it
is a refusal of the campaign.

### 2a. Rung — REFUTED as the criterion; it is the honesty axis and it is orthogonal

The ladder ranks sources by **what each can get wrong** (`05` §3). That is honesty, not agency,
and the two come apart in both directions:

- **The win condition requires rung 5.** *"the right combination of theory/classification/hints"*
  is authored counter-theory — the highest, least-verifiable rung on the ladder. If high rung
  meant cheating, the campaign's centre would be cheating by definition.
- **The lowest rung is measured harmful in bulk.** All-on rung 0 is the *unreadable* state:
  median **58 observations per position, 13 of them unconditional**, the compare strip at
  **8.31 entries/ply and 1.01× lift**, census hints at **89.0% false positives** at the
  observation level `[P]` (`design/research/feedback-versus-the-dashboard.md`,
  `design/research/census-hint-false-positives.md`).

So rung neither implies nor forbids cheating. It is already fully encoded as the honesty ceiling
and it should stay exactly where it is.

**Two `[V]` notes on how thinly it is actually encoded.** The 0–6 ladder appears in code **once**,
as `EVIDENCE_RUNG` (`apps/server/src/expression-census.ts:31-39`), which maps seven evidence-type
tokens onto 0–5 — **rung 6 has no code representation** — and it is an *authoring census*, not a
gate. The runtime honesty gate never consults it. And `permittedAssistance`
(`packages/runtime/src/assistance.ts:27-30`) turns on exactly one boolean:

```ts
const mayRequestSplit = (context.role === "solo" || context.role === "host") && context.deliveryOpen;
```

Six of its nine outputs are constants; only `humanSplit`/`corpus` (`free`↔`locked_off`) and
`boardLighting`/`arrows` (`evidence`↔`sight`) move. Its declared `sessionKind` input is **never
read in the function body** — `{sessionKind:"pack"}` and `{sessionKind:"position"}` are provably
identical `[V]`. So the honesty ceiling is parameterised on **role and disclosure state only**,
not on what kind of run this is.

### 2b. Timing — NECESSARY, and refuted as sufficient by the shipped code itself

The brief flagged that timing *may be the whole answer*. It is not, and the proof is nine lines
of production code that exist precisely because it is not:

```ts
// packages/runtime/src/feedback.ts:22-30
export function feedbackDeliveryOpen(run: DrillRun): boolean {
  if (run.feedbackPolicy !== "attempt_end") return feedbackDisclosed(run);
  let open = false;
  for (const event of run.events) {
    if (event.type === "feedback.revealed" || event.type === "outcome.reached") open = true;
    else if (event.type === "move.committed") open = false;
  }
  return open;
}
```
`[V]`

The window **re-closes on the next committed move**. If "post-commit" were the criterion, that
line would be unnecessary. It exists because **post-commit at move *n* is pre-commit for move
*n+1***, and the same content that is honest review of a finished attempt is contamination of an
unfinished one.

**So timing's sufficiency is a function of the encounter's horizon, and the runtime already
splits on exactly that axis** `[V]`:

```ts
// packages/runtime/src/events.ts:154-159
if (isPack && data.feedbackPolicy === "attempt_end") throw new TypeError("Pack sessions cannot use attempt_end feedback");
if (!isPack && data.feedbackPolicy !== "attempt_end") throw new TypeError("Non-pack sessions must use attempt_end feedback");
```

A **bounded** encounter (a pack, with an authored `plyHorizon`) discloses at authored boundaries —
`delayed_checkpoint`, `segment_end`, `immediate_guard`. An **unbounded** one (Just Play, an
imported game — the owner's *"proper game against a bot"*) is *forced* onto the closable
`attempt_end` window. The product has already ruled that unbounded play cannot hold a disclosure
open. Timing is a real and necessary gate; it just does not, on its own, say what may come
through it.

### 2c. Specificity — the right region, stated wrongly

`05` §3b's guided-mode table is the shipped precedent, and its permitted/forbidden pairs are
better than the axis usually offered for them. It is **not** "class-level vs position-level":
*"That knight has no retreat square"* is permitted and is entirely about this position. It is not
"descriptive vs prescriptive" either: *"the standard plans are the minority attack, the central
break, and kingside play"* is prescriptive and permitted.

What separates the columns is that every permitted cell leaves the learner a move to find and
every forbidden cell does not. *"This is a Lucena position; the technique is to build a bridge"* /
*"Play Rf4."* — same claim, same rung, same timing, and the second one ends the thinking.

### 2d. Effort — the criterion, once it is made mechanical

**Effort is the surviving distinction, and it is measurable as a property of the item rather than
a property of the learner.** Every assistance item can be labelled by how much of the learner's
live decision it resolves. Four values, ordered by distance from the answer:

| Distance | The item names… | Examples in this tree |
|---|---|---|
| **`kind`** | the *kind* of position and what that kind is generally about | shape entry `name` + `plan.label` list (`DrillScreen.svelte:1018-1020`), detected phase, structure family |
| **`fact`** | a fact about *this* position, without ordering the options | rung-0 sight; attack/defence counts; scoped denial (*"while the a4 pawn stands"*); transition census; `boardLighting: "sight"` |
| **`ranking`** | an ordering over *this* position's options | Maia policy mass (`humanSplit`), per-candidate `score cp`, explorer per-move white/draws/black, *"players at your level split three ways here"* |
| **`move`** | the move | engine `bestmove` / `bestline` PV, MultiPV rank 1, the pack's spine reply |

The label is **syntactic** — it is read off what the item *says*, never off whether the item is
right. That matters: `05` §3's engine-condition clause 2 says *a threshold must sit off its
instrument's optimality boundary*, and a residue axis defined as "does it agree with the engine's
top move" would be an engine verdict wearing a new name. "Does it name a specific legal move in
this position" is boundary-free.

**This axis is orthogonal to rung, by construction and by example:** authored claim (rung 5) is
`kind`; census hint (rung 0) is `fact`; Maia policy (rung 3) is `ranking`; engine PV (rung 2) and
the authored spine (rung 5) are both `move`.

**And the shipped forward detectors are all already residue-preserving.** `05` §5a's four honest
Just Play detectors — irreversibility, phase change, human divergence, option collapse — every
one announces *that a decision is arriving* without saying which way it goes, i.e. all four sit at
`kind`/`fact` `[M]`. `pivotal.ts:69-88` enforces the sharpest of them: `human_divergence` markers
are admitted only when `permission.humanSplit === "free"` `[V]` — the marker says a split exists;
the split itself is a `ranking` item behind a separate gate. Nobody designed this as a residue
rule and it is one anyway, which is the best evidence available that the axis is real rather than
invented.

### 2e. The criterion, stated

> **Coaching changes what the learner has to think about. Cheating removes the thinking.**
>
> **Mechanically: an item is cheating iff its distance is `move` and the learner still has a
> committing decision that depends on it — i.e. `distance === "move" && !atHorizonBoundary`.
> `kind` and `fact` are coaching at any time. `ranking` is the contested band and is where the
> campaign's interesting design lives.**

Three properties worth stating, because they are what make it a criterion rather than a slogan:

1. **It permits the win condition.** A noob armed with `kind`-distance counter-theory against the
   Advance Caro-Kann's actual plan still has to find thirty moves. That is exactly *"you build
   your coach"*, and it is legal at full strength, pre-commit, at rung 5.
2. **It explains the arrow ruling without restating it.** `05` §3-forms says a best-move arrow is
   dangerous *"because it is a rung-2 verdict delivered pre-commit"*. Under this criterion it is
   dangerous because it is `move`-distance pre-boundary — which also correctly clears the *sight*
   arrow (`fact`) that the same section permits, and correctly clears the learner's **own** drawn
   mark, which asserts nothing and therefore has no distance at all.
3. **It is falsifiable.** §5 gives the test.

### 2f. Where it falls on the shipped axes: nowhere — and the third thing already half-exists

`permittedAssistance` is the honesty **ceiling**: which *sources* may speak, given role and
disclosure state. `AssistanceConfig` v4 is **preference**: which are switched on, over nine axes,
persisted per-profile in `localStorage` under `tabiya.assistance.v1.${kind}` for six profiles —
`pack, position, imported, match, stream, onramp` (`assistance-preference.ts:4,15`) `[V]`. Both
are **source-and-time** selectors. Neither has any field that could carry distance, and both are
the wrong shape for it anyway: distance is a property of a rendered *item*, not of a source.

So yes, a third thing is needed — and **the owner already proposed it**. `BACKLOG:201` (**D113**,
2026-08-15) asks for *"a hint whose vagueness is derived rather than chosen — point at a square, a
piece, a ply-distance or a move, four increasing disclosures over one piece of evidence"*. That is
this axis, discovered from the reward side rather than the honesty side. **The coaching/cheating
criterion and the campaign's loadout currency are the same object.**

**What blocks it today, and it is a shipped decision rather than a gap.**
`apps/server/src/capabilities.ts` publishes 36 machine-readable dispositions — 14 `reached`, 15
`refused`, 6 `unmeasured`, 1 `impossible` `[V]` — and its recurring predicate is *recording vs
grading*:

```ts
{ instrument: "Stockfish", capability: "bestmove / MultiPV rank / bestline", disposition: "refused", reason: "Move verdicts are not condition measurements" },   // :96
{ instrument: "Maia",      capability: "per-move score cp",                  disposition: "reached", reason: "Recorded without grading", surface: "human split" }, // :109
{ instrument: "Explorer",  capability: "per-move white / draws / black",     disposition: "reached", reason: "Population result attached to each move without grading" },
```

Read as a residue register, that is: **`ranking` reached, `move` refused, product-wide, forever.**
Two consequences follow, and both are `DESIGN-GAP:`-adjacent rather than defects:

- **The campaign cannot currently offer the strongest reward it has.** D113's hint ladder tops out
  at `move`, and `move` is refused. Corroborating count, inherited: **0 of 764 committed evidence
  records are `bestline`**, although the plumbing is end-to-end `[P]` (`BACKLOG:201`). The
  capability is wired, refused, and unused.
- **The refusal's stated reason is narrower than its scope.** *"Move verdicts are not condition
  measurements"* answers whether a `bestmove` may **fire a condition** — the `05` §3 clause-1
  question. It is being used to refuse **display** as well, which is a different question and one
  the disclosure model already has an answer to. Either the reason should be widened deliberately,
  or the disposition should be split.

### 2g. The other failure mode: coaching can fail without ever cheating

The all-on state is the unreadable one (D78), so the criterion is a line with a wall behind it,
not a line with safety on one side. Three measured numbers bound the coaching side `[P]`:
median **58 observations per position** with **13 unconditional**; compare strip **8.31 entries
per ply at 1.01× lift**, with two branches' readings overlapping at **Jaccard 65.7%** and a
**median 36 unranked differences**; and **ρ(firing rate, usefulness) = −0.143** — how often a
hint fires does not predict whether it helps, faintly negatively
(`design/research/feedback-versus-the-dashboard.md`, `design/research/census-hint-false-positives.md`).

So the design target is `06` §5's **smallest sufficient set**, and the honest full statement of
the criterion has two clauses: **an item cheats by distance; a loadout fails by volume.** Only the
first is a permission question. The second is what the slot budget is for, and it is why a slot
budget does not price *"experimentation without cost"* — it is the product refusing to print
noise.

---

## 3. Q2a — can the product tell whether the learner played well?

**No, and it also cannot tell whether the run succeeded. It can tell one thing, precisely.**

**Nothing grades a learner's move.** Eight sites compare a learner move to anything; exactly one
emits a per-move verdict, and it is a table lookup of authored prose — `lineMembership`
(`packages/runtime/src/line.ts:121-165`) returns `on_line | classified_deviation | unknown`, and
`classified_deviation` copies `deviationClass` verbatim from the pack (`line.ts:156-159`) `[V]`.
`unknown` means *the author did not write about this*, not *bad*. The one genuinely **computed**
judgement about learner behaviour is `TempoVerdict` (`packages/runtime/src/tempo.ts:14-23,252-263`),
which grades **timing against an authored budget** — and inherited counts put **0 of 135
checkpoints** and all seven tempo verdicts at zero users `[P]`
(`design/research/authoring-vocabulary-completeness.md`). The one learner-judging mechanism that
exists is unexercised.

**The refusal is deliberate and versioned.** Schema 0.8→0.9 (`7d461e1`, 2026-08-13) deleted
`CheckpointInteraction.prediction.grading{source, topK, minMass}` from the types, the JSON Schema
and the example `[V]`. What it graded was hit/miss on the learner's **prediction of the opponent's
reply** against the opponent model's top-K or a minimum policy mass. What replaced it is a pure
recording event, `prediction.recorded`, storing `predictedMass`/`predictedRank` with **no
threshold**; nothing reads them (`service.ts:1131-1145`, `events.ts:270-278`), and **0 packs
author a `prediction` interaction** `[V]`. The same posture is stated in three places of shipped
copy: *"They record revisitable events, never a mastery score"* (`App.svelte:707`), *"This is an
attempt history and return queue, not a mastery score"* (`App.svelte:741`), and
*"That is a grade of this attempt, not a verdict on the position"* (`outcome-presentation.ts:170`)
`[V]`. And `stated_reasoning` ships its own disclaimer: *"not detected means these exact words
were not found in what you wrote — not that the idea was absent, and never that it was wrong"*
(`apps/server/src/reasoning.ts:7`) `[V]`.

**No learner number exists anywhere.** No `accuracy`, `mastery`, `skillLevel`, `learnerElo`,
`percentile`, `streak`, `xp` or `points` in `apps/` or `packages/`; every `targetElo`/`eloApplied`
is an **opponent** band `[V]`. The seven milestone kinds (`api.ts:351`, `service.ts:592-594`) are
navigable pointers to past events with no score and no unlock effect.

**And "did this run succeed" is computed nowhere.** `attempts` is keyed `(run_id, branch_id)`
(`storage.ts:2525`); its `verdict` collapses the **tip node's** `ObjectiveState` into
`stable | unstable | open` and is forced to `"open"` unless the pack compiled at least one
objective rule (`progress.ts:62-65,90,127`) `[V]`. A run with four retry branches yields four
independent verdicts and no roll-up — already ledgered, and the smallest new part any campaign
proposal needs.

**What the product CAN say, exactly.** *Whether an authored or tablebase-decided objective
survived the path you submitted.* `ObjectiveState` has six values, three absorbing
(`types.ts:4-10`, `trajectory.ts:6`); transitions require evidence (`objective-state.ts:47-49`);
`degraded` is one-way for outcome and theory objectives (`pack-validation.ts:474-476`); and the
rules are compiled **from the pack**, not from a grader (`pack-orchestrator.ts:431-590`) `[V]`.

**So: *"you'd need proper 2000 Elo skills"* is a claim about the difficulty curve, not about the
learner.** Does the difference matter? In exactly one way, and it is structural:

> **An unmeasured learner cannot be matched. The curve can only be *declared*, never *adapted*.**

Every roguelike calibrates to the player; this one can calibrate only to the content. A 1000 and a
1900 walking the same map meet the same nodes. That is the honest position and it has a **named,
evidenced price**: ChessMonitor's marquee, most-loved number is a manufactured FIDE-Elo estimate
with proven pull `[P]` (`design/research/quickpass-wintrChess-encroissant-chessmonitor.md`). The
no-skill-numbers posture costs something real, and the campaign is where the bill arrives.

**But the claim can still be made true** — see §4d. A fully-suppressed encounter against a
band-2000 opponent with a bounded horizon is a *complete specification* of "2000-Elo skills
required". The product never measures you; the encounter does, and the result is a fact the
learner reads for themselves. That is the same move the endgame boss already makes:
`perfect_tablebase` is literally unbeatable, so surviving it is a machine-exact fact about your
play that nobody graded.

---

## 4. Q2b — what actually scales across 1000→2000

### 4a. The measured levers

**Lever 1 — opponent band. The only lever whose difficulty is measured, and it was inert until
yesterday.** R10 established the usable range as `[1000, 2400]`: all 50 adjacent 100-Elo steps
change the distribution on 50/50 non-forced positions, ordering breaks down above ≈2400 (the
trajectory doubles back; band 5000 is closer to band 0 than either is to 2500), and the candidate
list stops carrying the distribution below ≈800 `[P]`. The bound ships with a named refusal —
`MAIA3_BAND_RANGE = {min: 1000, max: 2400}` (`maia.ts:11`), enforced by `appliedTargetElo` with
`TARGET_ELO_OUT_OF_RANGE` (`engine-band.ts:82-88`) `[V]`.

Two `[V]` qualifications, both load-bearing:

- **The regression is fixed.** `design/research/engine-layer-capability-audit.md` found `Elo` sent
  *before* `SelfElo`/`OppoElo` at their 1500 defaults, so every request ran at band 1500 and the
  band lever changed nothing on 0/12 positions `[P]`. `0985fa4` ("apply requested Maia bands
  last", 2026-08-15 20:56) reordered it, and `opponent-selector.ts:506-512` now emits `bandDefaults`
  first and `Elo` after; a real-engine integration arm was added in the same commit `[V]`.
- **Band distinguishability is not band *strength*.** R10 states explicitly that no claim is made
  about play quality at any band `[P]`. That the policy vector moves with the dial is not evidence
  that the *result* does. **This is the single highest-value unrun experiment in the dossier**
  (§5).

Also `[V]`: a pack-less game — the owner's *"proper game against a bot"* — can use only
`PositionOpponentPolicy.mode: "human_common" | "strong_engine"` (`types.ts:61-62`), and
`events.ts:159-161` refuses `theory_strict` and `perfect_tablebase` outside packs. **Band-conditioned
Maia is the only honest opponent an unbounded game has, and both of `06` §5's Act I and Act III
bosses require a pack by type.**

**Lever 2 — decidability tier.** `06` §5's acts escalate in what can be *known*, not in power:
Act I outcome-measured (`theory_strict`, human-outcome grounded to ply ~20), Act II authored
(`human_common` + plan — the phase R4 and R9 jointly prove has no oracle), Act III
tablebase-measured (`perfect_tablebase`, exact) `[P]`. This is measured at both ends and honest in
the middle, and it needs no new number.

**Lever 3 — encounter horizon, and it is the one nobody has been counting as a difficulty lever.**
`authoredBoundary.plyHorizon` is declared by **47 of 89 pack-shaped documents**, median **10**,
mean **12.5**, range **2–40** `[V]`. Per phase:

| Phase | n | median `plyHorizon` | range |
|---|---|---|---|
| opening | 21 | **11** | 2–14 |
| middlegame | 11 | **8** | 6–10 |
| endgame | 13 | **24** | 8–40 |
| cross-phase | 2 | 10 | 8–12 |

Horizon is simultaneously a difficulty parameter and an honesty parameter, and **they pull the
same way** — a longer encounter is harder *and* has more game left that a disclosure would
contaminate, which is precisely why `events.ts:154-159` forces unbounded sessions onto the
re-closing window. That coupling is the cleanest connection between Q1 and Q2 in this dossier: the
same number sets an encounter's difficulty and the safety of its disclosure.

**`DESIGN-GAP:` the shipped horizons do not ramp.** Read as `06` §5's three acts, the corpus
gives **11 → 8 → 24**: Act II, the act that is supposed to escalate, is the *shortest*. Either the
act structure or the middlegame horizons are wrong, and an authoring correction is owed whichever
way the ruling goes.

### 4b. The licensed-but-uncalibrated levers

**Lever 4 — loadout size.** D78 licenses the *existence* of a slot budget (all-on is measurably
unreadable) and licenses **nothing about the number**. Any specific slot count is invented, and
must ship as `unmeasured` with a binding experiment per `05` §3 clause 3.

**Lever 5 — capability suppression** (Balatro's boss blind, `06` §5). Law-8-legal by construction:
it speaks about the learner's *information*, never about chess. Zero authoring cost. It is also
the only thing that makes the assistance lattice non-monotone — worth restating precisely, because
the shipped monotonicity is patchier than `06` §1 says. Of the nine `AssistanceConfig` axes, `[V]`
finds **five** strictly monotone and live (`markers`, `guided`, `humanSplit`, `corpus`, `ambient`),
**one** monotone with a collapsed top and a broken floor (`boardLighting`: `sight` and `evidence`
render identically at `DrillScreen.svelte:300`, and `SILENT_ASSISTANCE.boardLighting = "legal"` is
not the axis minimum — D101), **one** that is not a chain at all (`spoken`: `browser` and
`provider` are siblings), **one** substitutive rather than additive (`voice`), and **one** with no
effect on any pixel (`arrows`, read by no renderer — D84).

### 4c. What is refused, and why

Escalating numeric requirements (Balatro's 300→50,000) are law-8 violations here because R4/R9
give no middlegame quantity to escalate `[P]`. A pursuit clock is a retry price by another name
(`06` §2c). Weakened Stockfish is rejected doctrine, and the register says so in machine-readable
form: `UCI_LimitStrength / UCI_Elo / Skill Level → refused, "Weakened Stockfish is rejected
doctrine"` `[V]`. Adaptive difficulty from a learner model requires a learner model, which §3 says
does not and should not exist.

### 4d. The owner's proposal, tested — and it is expressible, inverted

> *"maybe in the start you're facing easier opponents, or have more weapons/defenses/modifiers to
> win against a much stronger enemy??? but in order to complete a run to max you'd need proper
> 2000 ELO skills yourself?"*

Both halves are expressible, and the second half **requires** the first to run backwards from the
usual roguelike direction.

**The curve is suppression, not accumulation.** You begin with your coach and you end alone. That
is the only shape in which *"a maxed run demands real 2000-Elo play"* is a true statement rather
than an aspiration, because at full suppression the encounter is a band-2000 opponent, a bounded
horizon, and no assistance — a fully specified thing the learner either beats or does not, with no
grading anywhere. It is also the only shape compatible with `05` §3a's *"an assistant that names
the outpost every time does the seeing for you"* and its explicit intent that guided mode **fades**.

**But the ramp must run down the DISTANCE axis, not the COUNT axis.** Handing a beginner
everything at once contradicts D78 directly — all-on is the unreadable state, so a large early
loadout is a worse experience, not an easier one. The honest version keeps the count small
throughout and moves the *distance*:

| Stage | Loadout | Opponent |
|---|---|---|
| Early | ~3 lenses at **`ranking`** distance | band 1000–1200 |
| Mid | ~3 lenses at **`fact`** distance | band 1400–1800 |
| Late | ~3 lenses at **`kind`** distance | band 1800–2200 |
| Boss | suppressed to **0** | band ≤2400, or `perfect_tablebase` |

Each row is a smaller-sufficient-set than the last at the same slot count. And the on-ramp's
relaxation is not a distance relaxation at all — **it is a horizon relaxation**, which is what
ships: `immediate_guard` is the pack-declared exception where the consequence arrives within a
couple of plies (`05` §3a-i), on branches of **2–8 plies** (`00` §Target player), so post-commit
*is* the boundary and nobody has to bend a rule. `[V]`: **24 of the 26 on-ramp candidate packs
declare `immediate_guard`**, and the two that do not are exactly the two whose declared band is
above 1400 (1559 and 1939). The lane is internally consistent.

**Does the suppressing boss carry the top of the curve? Yes — exactly, and no further** `[M]`.
Suppression's ceiling is total: remove everything and you are playing unaided chess against the
strongest honest opponent the instruments support. That ceiling is **per phase**, and stating it
plainly is a useful correction to *"2000 Elo"* as a single number:

- **Opening:** `theory_strict` is deterministic. Its difficulty is *how much theory you know*, and
  it is the only boss whose difficulty is human-outcome measured — to ply ~20, where R9's oracle
  dies `[P]`.
- **Middlegame:** band ≤2400 Maia plus an authored plan. There is no oracle, so the difficulty is
  authored and must be labelled as such.
- **Endgame:** `perfect_tablebase` is unbeatable. Its ceiling is **infinite**, which means the
  objective must be `hold`/`save`/`convert` and never `win` — the act's climax is stronger than
  "2000" and the grading is exact.

### 4e. The content does not express a curve yet

Two censuses over all 89 pack-shaped documents, and they disagree with each other `[V]`.

**Declared learner band** (`difficulty.minOnlineRapid`/`maxOnlineRapid`, present on 74 of 89) is
broad and continuous — packs covering each 100-point bin: 1000: 21 · 1100: 28 · 1200: 31 ·
1300: 23 · 1400: 58 · 1500: 46 · 1600: 43 · 1700: 44 · 1800: 43 · 1900: 42 · 2000: 42 · 2100: 7.

**Declared opponent band** (`opponentPolicy.targetElo`, present on 73 of 89) is a two-point step
function:

| Band | Count |
|---|---|
| ≤1394 | **30** (26 of them machine-generated on-ramp candidates, 21 distinct values) |
| 1400–1799 | **4** — 1500, 1559, 1600 (a browser fixture), 1700 |
| ≥1800 | **39** — 1800 ×36, 1900 ×2, 1939 ×1 |

So the corpus says *"this pack is for a 1400–2000 player"* on 42–58 packs per bin while putting an
**1800** opponent in front of them in 36 of 45 real authored packs. The emitter is the reason the
low half is continuous and the high half is not: `clampElo` pins generated seeds to `[1100, 2000]`
(`sourcing/position-seeds.ts:171`) with its own honest disclosure — *"targetElo clamp [1100, 2000]
is an authoring convention, not a Maia capability claim"* (`:231`) — while hand-authored packs pick
round numbers. Against the engine's real `[1000, 2400]`, the authored corpus uses **1100–1939**.

**This is the cheapest finding in the dossier to act on.** The band lever is measured, it now
works, its refusal is enforced, and the content does not use it. Three real packs stand between
1394 and 1800.

---

## 5. What would falsify each

Stated before measuring, with the population named first — *the population you measure against
decides the answer before the instrument does*, four attestations in this repo — and with every
threshold placed off its instrument's optimality boundary (`05` §3 clause 2).

| # | Claim | Falsifier | Threshold, and why it is off the boundary |
|---|---|---|---|
| **F1** | The distance axis is a property of the item, not a judgement | Two independent labellers assign `kind`/`fact`/`ranking`/`move` to the same **300 rendered items** drawn from the 330 authored deviation notes, the shape-entry plan labels and the structural reading, sampled per phase | Cohen's **κ ≥ 0.70**. Chosen because the axis is syntactic — perfect agreement would suggest the labels are being read off a rule rather than the text, and κ < 0.70 means it is a slogan |
| **F2** | Distance predicts choice-collapse, and rung does not | Over the 47 documents declaring a `plyHorizon`, measure P(learner-proxy move = spine move) with (a) nothing shown, (b) a `kind` item, (c) a `fact` item, (d) a `move` item. Learner proxy = Maia at the pack's declared `minOnlineRapid`, not at 1500 | The axis survives if (d) − (a) exceeds (b) − (a) by **≥ 20 pp** while (b) − (a) stays under 5 pp. Deliberately not "does it match the engine" — the comparator is the *authored* spine, so no engine optimality boundary is involved |
| **F3** | Timing is not sufficient | Already falsified `[V]` by `feedback.ts:22-30`: if post-commit were the criterion, the window would not need to re-close on `move.committed` | — |
| **F4** | Rung is not the criterion | Already falsified: the win condition requires rung 5, and rung 0 all-on is measured unreadable at 1.01× lift `[P]` | — |
| **F5** | **Band is a difficulty lever, not just a policy lever** | Maia-vs-Maia, N ≥ 200 games per arm, bands {1000, 1400, 1800, 2200} against a fixed band-1400 reference, on R5's stratified position set — **engine vs engine, so no human is graded** | Score must be **monotone across all four arms with non-overlapping 95% CIs**. Fails if any adjacent pair inverts or overlaps. This is the load-bearing unrun experiment: R10 measured that the *distribution* moves, never that the *result* does |
| **F6** | Suppression carries the top of the curve | Same encounter, same band, loadout {full, half, empty}; owner n-of-1 first, then a wider arm if it survives | Fails if clear rate is flat within ±10 pp across the three. Also fails *usefully* if the empty arm is **not** the hardest — that would mean the loadout was never carrying anything, which is D78's warning arriving from the other side |
| **F7** | Horizon is a difficulty lever, not just a content parameter | Pair packs matched on phase and band but split at the horizon median (10), compare clear rate | Fails if clear rate does not fall with horizon. If it fails, the act ramp must be built on band and decidability alone, and `06` §5's escalation loses its cheapest dial |
| **F8** | A run-level verdict is meaningful at all | Build the roll-up; check that runs of the same map separate | Fails if ≥ **80%** of runs land on the same verdict — a verdict that never varies is a receipt, not a stake |

---

## 6. Traps checked

- **Population decides the answer.** F2 and F5 name their populations before their thresholds, and
  F2's learner proxy is bound to each pack's *declared* `minOnlineRapid` rather than to Maia's 1500
  default — the exact substitution that produced the `SelfElo` regression.
- **A measurement can smuggle a verdict.** The distance label is defined syntactically ("does the
  item name a specific legal move in this position"), never as agreement with an engine. F2's
  comparator is the authored spine for the same reason.
- **Rarity is not value (ρ = −0.143).** Nothing here prices assistance by how often it fires. The
  slot budget prices *readability*, which is what D78 actually measured.
- **The all-on state is the unreadable one.** Directly load-bearing: it is why §2g adds a second
  failure mode to the criterion, and why §4d's ramp runs down the distance axis rather than up the
  count axis.

---

## 7. The owner question

**The reasoning, first.** The two questions in the brief turn out to have one answer between them.
The thing that separates coaching from cheating — *how much of the live decision an item resolves*
— is also the only thing that can carry a difficulty curve across 1000→2000 without inventing a
number, because the other three levers are each bounded: the opponent band is real but tops out at
2400 and says nothing about the middlegame, decidability is a three-step ladder with no
intermediate values, and horizon is already authored and currently ramps the wrong way. Distance is
continuous, costs no authoring minutes, is orthogonal to every honesty rule, and the owner already
proposed it from the reward side as D113.

The obstacle is not technical. It is that `capabilities.ts:96` publishes `bestmove / bestline /
MultiPV rank` as **refused, product-wide, permanently**, on a reason (*"Move verdicts are not
condition measurements"*) that answers a narrower question than the scope it is enforcing. Building
the distance axis means deciding what the top of it is allowed to be.

**The question: what is the top of the hint ladder, and when may it be reached?**

- **(a) `move` stays refused, permanently.** The ladder tops out at `ranking` — Maia's policy split
  and per-candidate evaluation, both already `reached` in the register. *Consequence:* the criterion
  becomes trivially satisfiable, since nothing the product can produce is ever cheating; the
  campaign's strongest reward is `ranking` at a slot cost; D113 is closed as ⛔ and `bestline`'s
  end-to-end plumbing is deleted rather than left as a loaded gun. *Cost:* the on-ramp loses the
  one disclosure that a 1000-rated player most obviously wants, and the product ships a permanent
  asymmetry with every competitor. *This is the status quo, and choosing it deliberately is worth
  more than inheriting it.*
- **(b) `move` becomes reachable at a horizon boundary only** — recommended. The capability
  disposition splits into `bestmove as a condition → refused` (unchanged reason, correct scope) and
  `bestline as a disclosed item → reached at attempt_end / outcome.reached / a pack checkpoint`.
  *Consequence:* the criterion becomes mechanical and enforceable in one clause —
  `distance === "move"` requires `feedbackDeliveryOpen`, which is the predicate the runtime already
  computes — and the campaign gains a real top-of-ladder reward whose scarcity is *timing*, not
  invented currency. *Cost:* one field on every assistance item, one clause in the honesty gate, and
  a labelling pass over the authored corpus; F1's κ test is the gate on whether the field is real.
  It also makes horizon load-bearing in two ways at once, which raises the price of §4a's
  11 → 8 → 24 correction.
- **(c) `move` becomes a purchasable slot, reachable pre-commit at a cost.** The full D113 ladder,
  spendable. *Consequence:* the campaign gets the most legible reward economy available, and the
  criterion this dossier lands is abandoned — under (c) the product does sell the answer, and the
  only remaining defence is that you paid for it. *Cost:* it prices *looking* at the answer, which
  is the one shape `06` §2c permits, but it puts the product one authored slot away from being the
  eval-bar trainer `00-thesis.md` exists to replace. Listed because it is the natural roguelike
  answer and someone will propose it; recommended for refusal on the record rather than by silence.

**A second ruling rides along and is cheap either way:** the corpus's opponent bands are a
two-point step function (30 packs ≤1394, **3 real packs** in 1400–1799, 39 at ≥1800) while its
declared learner bands are continuous across 1000–2000. The band lever is measured, enforced, and
now repaired. Whether the fix is *authoring the missing middle* or *narrowing the declared learner
bands to match the opponents that exist*, the two censuses should not stay this far apart.
