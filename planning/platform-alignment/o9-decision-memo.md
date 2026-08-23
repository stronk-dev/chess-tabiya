# O9 decision memo — which player metrics, archetypes and tips ship

**Prepared:** 2026-08-23, at HEAD `36074c7`
**For:** the owner
**Queue row:** `planning/platform-alignment/decision-queue.md:46`
**Handoff under review:** `planning/platform-alignment/grounded-coaching/o9-handoff.md` (2026-08-21)
**Status of this memo:** every load-bearing claim below was re-verified at HEAD. Where the handoff
has drifted, the drift is stated rather than repeated.

---

## The question

*"When Tabiya tells me something about my own play, what is it allowed to say — a counted
observation, a style label, or a verdict on me — and which of those ship in 1.0?"*

---

## What the learner already sees today — the verified baseline

**This section exists because a previous memo told you a metric would be the first number this
product ever showed a learner about themselves, when `RatingScreen.svelte` already rendered one.**
The baseline is not empty. It is substantial, it is reachable in ordinary navigation, and two of
its surfaces are already literal habit cards in everything but name.

Every item below is reachable through normal navigation. Nothing self-referential was found behind
a dev flag, and nothing was found as dead code.

**A rating and a public record.**
`apps/web/src/lib/RatingScreen.svelte:85` renders the heading *"Your measured record"*; `:127-136`
render the current publication state, a band point estimate with interval, **Rated games** and
**Abandoned** counts; `:140` *"What this number means"*; `:147-149` *"Recorded wins"* as
bronze/silver/gold marks (*"Beat band 1400 on …"*); `:152-158` a full per-game history table.
Mounted at `apps/web/src/App.svelte:1078`.

**A cross-learner comparison.** `apps/web/src/lib/CohortStanding.svelte:93-118` renders a classroom
table with W–D–L, marks, games/abandoned, a per-opponent-band split and the rating band — the
learner's own row highlighted. Record is visible by default in a classroom; rating is separately
opt-in. Mounted at `apps/web/src/App.svelte:1052`.

**Two shipped observation cards with learner-addressed sentences, ranked and truncated.**
`GET /progress/recommendations` (`apps/server/src/rest.ts:1016-1018`) returns two families:

- `apps/server/src/repertoire.ts:94` — *"Your repertoire {name} has no answer to {reply} after
  {line}; this population reached it about once every {N} games."* Sorted by `mass` descending,
  `slice(0, 10)`. It carries a standing honesty guard, `apps/server/src/repertoire.ts:25`:
  *"These counts say what this population played, not what is good"*.
- `apps/server/src/service.ts:1136` — *"You met {shape} in {N} of your preserved runs and have no
  countable attempt recorded in any pack that names it."* Computed over the latest 50 visible runs
  (`service.ts:1128`), sorted by `runCount` descending, `slice(0, 10)`.

**An attempt history and a return queue.** `apps/web/src/App.svelte:942-970` lists per attempt
`{packId} · attempt {n}`, the verdict (`stable`/`unstable`/`open`) or *"not graded"*, learner ply
count and date, plus expandable related-attempt counts. `:917-924` lists Milestones as event
sentences. `:925-941` is the due queue.

**In-run self-statements.** `apps/web/src/lib/TerminalSheet.svelte:37` — *"You won." / "You lost." /
"Draw."*. `apps/web/src/lib/CheckpointSheet.svelte:135` — *"Mentioned — matched '{word}'"* or
*"Not detected in your words."*, feedback on the learner's own stated reasoning.
`apps/web/src/lib/BranchRail.svelte:35` — branch counts including *"hidden by you"*.
`apps/web/src/lib/GameStoryScreen.svelte:52` — *"Recorded trajectory: {cp} → {cp} cp"*.
`apps/web/src/lib/ShellFrame.svelte:86` — the learner's handle, site-wide.

**What is genuinely absent, confirmed by repo-wide grep, not by a missing screen.** No streak. No
accuracy percentage. No mastery score or level. No Elo presented as *your rating* — the ladder uses
band labels. **No per-move quality grade is shown to any learner**: `packages/runtime/src/grade.ts`
defines `MoveQualityClass` and `renderMoveQualityGrade()`, and no file under `apps/web` imports
either.

**And the product says so out loud, twice:** `apps/web/src/App.svelte:922` — *"No milestones yet.
They record revisitable events, never a mastery score."* — and `:971` — *"This is an attempt history
and return queue, not a mastery score."* The doctrine is documented at
`docs/return-and-progression.md:47-59`, which scopes the no-score rule to the return/progression
surfaces and states that the separate learner-rating system never feeds the scheduler, its
recommendations or its milestones.

**The honest summary of the baseline:** the product already shows you a rating, a public win record,
a cross-learner table, an attempt history, and two ranked, sourced, learner-addressed observation
sentences. What it has never shown you is a *style*, a *weakness*, an *accuracy figure*, or a
*grade on a move*. O9 is a decision about the second list, on a product that already ships the
first.

---

## What the research settled

**R12 — `design/research/player-style-metrics.md`** (225 lines). Status `:6-7`: *"short-session
mechanical arm answered `[V]`; longitudinal and cross-time-control generalisation remain
unmeasured."*

- Twelve continuous literal habits retained with **separate per-metric sample floors**
  (`:107-125`): opening surprisal (25), ECO-family entropy (100), fianchetto setup (25), fianchetto
  knight screen (200), castle kingside (50), castle queenside (50), clock spend opening (100) /
  middlegame (50) / endgame (25), pawn-choice residual (100), centre-pawn residual (200),
  early-queen residual (100). Four candidates refused outright. `[V]`
- Population: 36 non-bot accounts × 200 games = **7,200 games / 261,892 decisions**, drawn from a
  frozen CC0 Lichess prefix of 6,599,736 games, **rated standard blitz only, all inside a 59-hour
  window** (`:59-72`). The dossier itself says at `:74`: *"prototype floors for this population, not
  1.0 defaults."* `[V]`
- **Archetypes fail a preregistered gate.** `:164-167`: k=4–12 clustering, median account+game
  bootstrap ARI **0.251–0.417** against a **pre-declared 0.70** gate; seven of nine baseline
  solutions contain a one-account cluster. `[V]` This is a run experiment that failed, not an
  opinion.
- **The habit vector is personally identifying.** `:154` — it re-identifies **35 of 36 accounts**
  across disjoint halves (97.2%); rotated labels yield 0/36. `[V]` This is why the privacy clause is
  not boilerplate.

**R13 — `design/research/grounded-coaching-aggregation.md`** (203 lines). Status `:6`:
*"mechanical/code arm answered `[V]`; owner-use quality remains."* Verdict `:10`: *"Yes at the
contract level; no from the current production history topology."*

- A fully cited card is mechanically expressible today (`:12-22`, `[V]`, harness
  `tools/r13-grounded-coaching-harness/`): *"Carlsbad structure appeared in 2 of 3 recorded
  opportunities"*, preserving the full source count while showing one exact `run#node`, with two
  applicable packs and one theory identity. Five negative controls refuse label-only merges,
  denominator-free tendencies, source-less counts, ungrounded actions and advice vocabulary.
- The persistence joins that are **missing** (`:24-29`, `[V]`): imported runs excluded from the
  attempt projection; F2 semantic events never enter progress storage; pack concepts persisted as
  `pack:<packId>#<raw>` so 199 references over 168 raw identities (25 reused across packs) become
  199 unjoinable keys; current aggregates return no source rows and no opportunity denominators;
  shape recommendations keep run ids but lose firing node ids; Review Story is per-run and omits F2
  transitions.

I re-verified the two code claims that matter most. `projectAttempts` is at
`apps/server/src/progress.ts:75`, and `:84` is `if (run.sessionKind === "imported") return … []` —
**exact**. `PackScopedConceptResolver` is at `apps/server/src/progress.ts:56-60` — **exact**.

---

## What has changed since the handoff

The handoff is dated 2026-08-21. Four things happened on 2026-08-22 and 2026-08-23 that change what
you are actually being asked.

**1. The "personal-observation ledger" of clause 2 is already an accepted RFC.**
`rfc/longitudinal-store.md:3` — *accepted 2026-08-22*, cross-reviewed, with the `decision_class`
grain amendment. Its design refs cite R13 §2 by name. **The queue asks you to approve a thing that
has already been drafted and accepted at the RFC tier.** Your ruling on clause 2 is now a
ratification or a reversal, not an authorization.

**2. That ledger's migration is unlanded, and the queue does not mention the dependency — and as of
today the RFC has been returned to its author.**
Verified: `grep -rn "learner_observations\|learner_structure_stats" apps packages workers` → **zero
hits**. `STORAGE_VERSION = 25` (`apps/server/src/storage.ts:631`); migration 25 is *"learner
ratings, rated games, periods, standings, and marks"* (`storage.ts:3779-3782`). The store would be
migration 26, claimed *behind* `learner-rating`. It is blocked by its own three open questions,
which two ledger rows say must resolve first — `design/BACKLOG.md:50` ([[D973]]) and `:303`
([[D1011]]).

**Landed while this memo was being written (`66ee110`, 2026-08-23):** a buildability review returned
the RFC. `planning/longitudinal-store/codex-buildability-review.md:5` — **verdict RETURN TO AUTHOR /
REGISTER OWNER**; `:9-13` — *"The accepted label is not buildable yet"*, with the declared ingest set
at **67 families against a compiler that can construct at most 46**. Five new blocker rows landed:
[[D1401]] (the ingest/compiler gap — *"all avoidance families that motivate opportunity-normalized
skills are structurally zero"*), [[D1402]] (`derived_at` makes windows and rebuild byte-equality
undefined), [[D1403]] (the revision fixture does not bind zero-incidence registry changes),
[[D1404]] (prediction drill-down refs are ambiguous) and [[D1405]] (the incremental path replays a
complete legal-alternative census after every mutation with no latency gate — **research required
before implementation**). `rfc/README.md:21` and the RFC's own status line still read *accepted*.

The review is explicit that the **foundation survives** (`:116-124`): per-run rows, the
learner+run+version+phase+decision-class grain, owner-only attribution, the
`occurred <= opportunities` checks, hard-delete cascades, rebuild-as-authority, and *"no prose,
style label, skill tier, rating input or LLM output in storage."*

**So: clause 2 approved today ratifies an architecture that a same-day review calls right in shape
and not yet buildable. It buys nothing executable.**

**3. `rfc/learner-rating.md` shipped the largest self-metric surface in the product.**
Status `:3` — *implementing, 2026-08-22 learner-surface checkpoint; accepted 2026-08-22*. Migration
25, rating/history routes, permanent marks, the dedicated measured-record view and consented
classroom standing are **landed**. The handoff's own boundary table (`f9-readiness.md:127`) requires
rating and observations to stay byte-separated; that separation is now a live constraint, not a
future one.

**4. An RFC covering this exact subject was drafted today, ahead of your ruling.**
`rfc/player-style.md:3` — draft, 2026-08-23. It specifies the twelve-metric registry, the card
grammar, two law-8 enforcement points, privacy inheritance, sharing, drill-down and the LLM's
one-sentence licence. It is drafted on [[D1232]]/[[D1230]] (your rejection of the scope cut) rather
than on an O9 ruling. It independently reproduces the store finding — *"zero hits"* at `:216` — and
finds **zero of twelve metrics production-ready** (`:23`). It splits acceptance so the mechanism can
be accepted while every card stays dark until its own row clears its own floor (`:238`).

**Also changed:** `rfc/learner-modules.md` was accepted 2026-08-22 with 181 declared / 179 compiled
eligibility rows **against a measured wall of zero production module ids** (`rfc/README.md:29`).
O9's three module names — Observed habit, Recurring situation, Rehearsal result — appear in
planning, research and the ledger and in **no RFC and no code**. And `rfc/move-quality-grades.md:3`
is accepted/implementing with the report ladder corrected to **5/10/15** and the practice ladder to
**2.5/6/14** Win%-points; its D1 keeps it open until `postcommit_nudge` and `review_map` compile as
consumers — which is why no grade reaches a learner at HEAD.

**Drift in the handoff's own citations.** `f9-readiness.md:40-43` cites
`apps/server/src/storage.ts:1533-1737` for `RunStorage.metrics()` and `:3090-3150`; at HEAD those
lines are `standingMembers` (added by migration 25) and `redeemSessionJoinToken`. `metrics()` is now
at `storage.ts:521` (interface) and `:2718` (implementation). `service.ts:819-840` is now
`importGame`; `shapeRecommendations` is at `service.ts:1119-1137`. The substance survives; the line
numbers do not.

**One claim that was never quite true.** `f9-readiness.md:36` describes shape recommendations as
retaining *"run ids and applicable pack ids"* and lists the gaps — but omits that the surface
**already renders a learner-addressed sentence and already ranks by a magnitude**, and does not
mention the repertoire-gap card at all. Read literally, the handoff pictures a product that shows
the learner no observation cards. It shows two.

---

## The recommendation

Approve, as seven clauses, with two amendments to what the handoff drafted.

1. **Ship continuous literal habit cards; do not ship archetypes.** Each metric carries its own
   version, denominator, population/window, minimum sample, uncertainty and contributing sources.
   No single profile-confidence badge, no GM twin, no tactical/positional type. *(Unchanged; the
   archetype half is settled by measurement — see below.)*
2. **Ratify the versioned personal-observation ledger *as an architecture*, and name its
   dependency.** Ratify the shape of `rfc/longitudinal-store.md` — the part today's review says
   survives unchanged — as the F9 store. **Amendment: the ruling states that nothing renders from it
   until [[D973]]/[[D1011]] close, [[D1401]]–[[D1405]] are repaired, and migration 26 lands.** This
   is the dependency the queue row omits.
3. **Three separate modules** — Observed habit, Recurring situation, Rehearsal result — as distinct
   seats, never one profile page. They must be compiled into `learner-modules`' registry as real
   module ids; today they exist only in prose.
4. **Description separate from advice, with one amendment.** Cards state what was observed and offer
   exact replay/retry/theory/drill actions. **Amendment: "no priority ranking" is narrowed to "no
   ranking by inferred skill or importance."** Ordering by a declared, shown magnitude — the
   `mass` and `runCount` sorts already in production — remains legal, because the sort key is
   visible and is a fact about frequency, not about the learner's competence. Written as drafted,
   the clause refuses shipped behavior.
5. **Deterministic first, optional sealed LLM wording.** The LLM receives one already-admitted card
   and may alter tone. It may not retrieve, select, diagnose, grade or add chess claims.
6. **Privacy by construction.** Opt-in for imports, exportable, deletable, version-recomputable.
   Sharing defaults off and exports only explicitly selected measured cards. Grounded in R12's
   35/36 re-identification result, not in generic caution.
7. **Admission posture: expose a metric only where its measured floor supports it; otherwise
   abstain visibly.** R12's floors are prototype floors for a 59-hour blitz population.

---

## The genuine choice points

Three. The evidence settles the rest, and I have not manufactured a fork where it does.

### Choice 1 — diagnosis: refuse outright, or require a shown comparator?

This is the one that matters, and it is the one the drafted recommendation quietly closes.

Your ask is on file verbatim at `design/BACKLOG.md:148` ([[D552]]): *"early game is solid, but in the
midgame your play is too simple and positional, not enough tactics."* That sentence is a diagnosis
and an implied priority. The handoff refuses both.

**The refusal is asserted, not measured.** R12 `:182-191` and R13 `:182-190` list
weakness/strength/"top thing to fix"/causal explanation as refused — as consequences drawn from law
8 and from what occurrence/opportunity data can support. **No experiment was run and failed.**
Compare the archetype refusal, which has an ARI number against a preregistered gate.

**That distinction has a name in this repo.** [[D1037]] (`design/BACKLOG.md:510`) is exactly this
defect class: *"A refusal asserted where the owner never reads — a code disposition table, an RFC
out-of-scope section, a research verdict — forecloses a standing ask with no ⚖️ row."* [[D1320]]
(`:1612`) extends it explicitly to `design/research/` verdicts. **Putting this refusal to you is the
repair; rubber-stamping it would be the defect.**

- **Option A — refuse diagnosis for 1.0** (as drafted). Cost: D552's headline sentence never ships,
  and the answer to *"why not"* is a doctrinal reading rather than a measurement.
- **Option B — the comparator rule.** `rfc/player-style.md:147-162` decomposes your sentence and
  finds three of its five fragments are grounded aggregates, while *"too"* and *"not enough"* become
  legal **the moment a validated baseline stands next to them**. Cost: it requires a reference
  population and its own validation, and it opens a second law-8 enforcement point — `player-style`
  §6 exists because *"a law-8 violation in this lane need not contain a single banned word: it can
  live in the tier rule, where `voiceCheck` cannot see it"* (`:23`). That enforcement point does not
  exist in code.

I recommend **B, scoped**: allow comparative wording only where the comparator is shown on the card
and both sides carry their own denominators, and require the tier rule to be reviewable as data.

### Choice 2 — does O9's approval cover credits, milestones and tiers?

O9 covers habit cards, a ledger and three modules. It says nothing about skill credits or tiers,
which is your [[D549]] ask (`design/BACKLOG.md:145`, chess.com's skills taxonomy). The withdrawn
[[D1193]] (`:475`) recorded exactly this: *"even full O9 approval leaves D549's half unlicensed"* —
and you rejected its recommendation outright in [[D1260]] (`:451`). Meanwhile R20's desk arm
([[D1053]], `:386`) closed the credit population at **five candidates and zero production-ready
rules**. Cost of leaving it out: a second ruling later. Cost of sweeping it in: you would be
licensing a surface whose evidence base is five candidates, none with a longitudinal floor.

### Choice 3 — rule now, or after the store's open questions close?

Ruling now unblocks `player-style` and `review-map` from drafting against an unruled gate. Ruling
later costs nothing mechanically — [[D1170]] (`design/BACKLOG.md:427`) records that **the binding
constraint in this lane is roughly eight weeks of real play, not your signature**, and
`player-style.md:230-234` confirms the ≥8-week early/late and blitz↔rapid transfer check nobody had
listed as a need. Cost of ruling now: you ratify a store whose semantics D973/D1011 say are not
fixed and which was returned to its author hours ago — hence clause 2's narrowing to the
architecture rather than the document.

**A note on how the queue reads.** The row says the ruling must *"rule literal habit registry +
personal-observation ledger + three modules …"*, which reads as an authorization. At HEAD the
registry is specified in a draft RFC written today, the ledger is a returned RFC, and the three
modules exist in no RFC and no code. **You are ratifying a direction, not releasing a build.** If
that framing is wrong for you, that is itself the answer to Choice 3.

**Not a choice, and I am not offering it as one:** archetypes, GM-twin mapping and the
aggressive↔solid axis. ARI 0.251–0.417 against a preregistered 0.70 gate, with seven of nine
solutions degenerate. The honest substitute both dossiers name is *a labelled authored quiz that
says it is a quiz*, byte-separate from measured play (`rfc/player-style.md:204`).

---

## The identity boundary

CLAUDE.md rejects the v1 identity — *personal game-analysis AI coach (mine games → detect weaknesses
→ generate episodes)* — as a legitimate adjacent product that is not this one. *"Which player metrics
and tips ship"* is precisely the surface that could smuggle it back. Here is where the line falls
and what holds it.

**The line: an observation is about the learner's own recorded decisions; a diagnosis is about the
learner.** A habit row is a five-tuple — occurrence, opportunity denominator, declared
population/window, exact contributing source ids, and a version — and it says only what happened in
decisions the learner actually made. Strip any of the five and it stops being an observation:
without the denominator it becomes a tendency; without the sources it becomes an assertion; without
the window it becomes a trait; without the version it becomes unfalsifiable. That is why
`f9-readiness.md:19-21` insists atomic observations and metric snapshots must not be collapsed —
*"an occurrence row is evidence about one position; a metric snapshot is arithmetic over a declared
population."*

**What structurally holds it, at HEAD, today:**

- `packages/runtime/src/voice.ts:110-119` — `voiceCheck` scans model output for squares, UCI/SAN
  tokens and chess nouns absent from the deterministic source, and for `BANNED_JUDGEMENTS`
  (`:93-97`: weak, strong, good, bad, better, worse, should, must, mistake, blunder, accurate …) and
  `PRESCRIPTIVE_VERBS` (`:99`: play, push, trade, avoid, prevent, prepare, attack, defend …).
- `apps/server/src/guidance.ts:166` — provider text is used **only if** `voiceCheck` returns valid;
  otherwise the deterministic rendering stands. **This is what refuses a tip that is an LLM
  opinion**: not a prompt instruction, a fallback.
- `apps/server/src/repertoire.ts:25` — *"These counts say what this population played, not what is
  good"*, attached to every gap card.
- `docs/return-and-progression.md:47-59` and `:67-70` — the shipped no-mastery-score rule and the
  explicit *"does not … rank recommendations by inferred skill"* limit.
- `design/03-product-breadth.md:74-75` — personal history *"can recommend packs or positions but
  never becomes the required entry point or product identity."* This is the clause that keeps
  mine-games-first out; O9 must not weaken it.

**What does not hold it yet, and should be named in the ruling:** the tier-rule enforcement point.
`voiceCheck` inspects sentences. A judgement placed in a threshold — deciding that 41% is *"too
simple"* — passes every word check. `rfc/player-style.md:163-170` specifies this second enforcement
point; nothing implements it. If Choice 1 lands on Option B, this becomes a precondition, not a
nicety.

---

## What turns on it

- **`rfc/longitudinal-store.md`** — ratification of the architecture, and whether D973/D1011 and
  today's D1401–D1405 are named as the gate on migration 26. Every downstream migration position
  queues behind it; `bot-policy` claims one position behind it (`rfc/README.md:18`).
- **`rfc/player-style.md`** — drafted today without this ruling. Its §12 splits mechanism-acceptance
  from card-acceptance precisely so it can be accepted before the data exists. Choice 1 determines
  whether its §5 comparator path is licensed or struck.
- **`rfc/learner-modules.md`** — the three module ids must be compiled into a registry that
  currently holds zero production module ids.
- **[[D552]] and [[D549]]** — your two standing asks in this lane, which [[D1134]]
  (`design/BACKLOG.md:417`) records as *"sitting at a dead end."*
- **`rfc/review-map.md` §3** — owns the per-game observation card, which ships on a learner's
  **first** game and must not be labelled style (`rfc/player-style.md:37`).
- **`rfc/move-quality-grades.md`** — its D1 consumers are the first path by which a graded word
  could reach a learner. Whether a longitudinal card may aggregate grades is an O9 question the
  handoff does not raise.

---

## Traceability note

Verified on 2026-08-23 at `36074c7`, refreshed through `66ee110`, by direct read of every file
cited. The tree moved several times during preparation; the §2 drift note above was rewritten
after the longitudinal-store return landed mid-memo. Code line numbers were
re-derived, not copied from the handoff; four handoff citations had drifted and are corrected above.
No file outside this memo was modified. This memo is planning prose and does not amend protected
intent (law 5); the `design/03` and return/progression amendments this ruling implies are the
owner's or claude-on-the-owner's-ruling to write.
