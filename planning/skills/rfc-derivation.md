# Skills and concept progression — RFC derivation

**Lane:** F9 (`planning/platform-alignment/rfc-graph.md:76` — *"Player metrics, profile, skills and
grounded coaching"*)
**Written:** 2026-08-23, by claude, on the audit's **#5 by owner interest**
(`planning/platform-alignment/never-started-lanes.md:258`).
**Measured at:** HEAD `3e40491`. Codex is committing continuously; every "what exists" claim below
was read at HEAD rather than taken from an RFC's or an audit's account of itself. That discipline
changed three findings (§2, §5.3, §6.3).
**Sibling lanes running in parallel:** `planning/review/rfc-derivation.md` (F6) and the campaign
amendment owed by [[D1151]]. This document **cites** them and does not restate them.

---

## 0. Licensing status for drafting — read this first

**Neither a skills RFC nor a progression-surface RFC is licensed today. This derivation is.** The
lane is blocked twice over, and its own research closure — landed today — is the second block.

| Question | Answer | Source |
|---|---|---|
| Does [[D1093]]'s drafting mandate reach this lane? | **No.** Its operative sentence is *"Product-surface RFCs in **these ruled lanes** may be drafted"* and the enumerated lanes are [[D1031]] variants, [[D1041]] time controls, [[D1060]] famous games. Skills has no per-lane ruling | `design/BACKLOG.md:439` |
| Is it a technicality, as it partly is for review? | **Less so here.** The owner sentence D1093 derives from is *"so we have all the breadth and depth? game review? casting of live tournaments? historical games? campaign mode? **analysing the players playstyle?** nice bots…"* — that names [[D552]] **style**, not [[D549]] **skills**. Review is at least named in the mandate's source sentence; this lane is not | `planning/platform-alignment/breadth-reality-check.md:5-7` |
| Is there an owner ruling anywhere in the lane? | **One, and it points the other way.** [[D1151]] (2026-08-23) ruled campaign progression is denominated in the catalogue and **refused the learner's own history** on the ground that it would introduce *"the first number this product has ever shown a learner about themselves."* See §6.3 — that ground is factually stale, but the ruling stands | `design/BACKLOG.md:421`; `design/06-campaign.md:368-386` |
| Is there a lane-specific gate, as review has O7? | **Yes, O9 — and it is READY FOR OWNER with a written recommendation.** *"Which player metrics/archetypes/tips ship?"* The readiness handoff self-declares the block: *"**State:** pre-RFC buildability handoff; **no implementation or migration is authorized**"* and *"**Decision gate:** O9 remains `READY FOR OWNER`"* | `planning/platform-alignment/decision-queue.md:46`; `planning/platform-alignment/grounded-coaching/f9-readiness.md:4-5` |
| Would ruling O9 as recommended open the lane? | **Only half of it.** O9's seven recommendations cover habit cards, a versioned observation ledger, three modules, description-vs-advice, deterministic-first wording, privacy and abstention. **They say nothing about credits, milestones or tiers** — the D549 half. Its consequence clause licenses *"the ledger, module contracts, source/action closure, privacy lifecycle and conservative admission/abstention behavior"*, and no more | `grounded-coaching/o9-handoff.md:9-31`, `:35-38` |
| Does the lane's own research authorize a surface? | **Explicitly not.** *"The desk arm therefore permits an RFC to define the *measurement protocol and data shapes*. It does not permit a progression surface, thresholds or 'mastered' labels until the measurement arm runs over durable observations."* | `design/research/grounded-skills-taxonomy.md:24-26` |
| Is the general exploration gate open? | Yes — owner override 2026-08-12, logged | `planning/exploration/gates.md:198` |
| Anything else gating? | **Yes, three.** (a) the longitudinal store is registered `accepted` while self-declaring three unresolved blocking questions ([[D973]]/[[D1011]], §5.1); (b) [[D300]]'s cross-pack concept identity is unlanded, and [[D1151]] independently made it a prerequisite for the catalogue; (c) the D549 routing cell requires the 2c/2d/2e producer landings | `design/BACKLOG.md:50`, `:303`, `:145`, `:421` |

**Recommendation:** put O9 to the owner as the five-line ruling it already is, **plus one question O9
does not ask** — *are opportunity-normalized skill credits and milestone tiers in scope at all, or
does the catalogue ([[D1151]]) already denominate progression?* That second question is §7.4 and is
the sharpest fork in this document. Recording the answer as a per-lane row alongside
D1031/D1041/D1060 converts this lane from "no licence" to "D1093-equivalent."

**One law-5 note, flagged not acted on — and it is the inverse of review's.** Review has *no* home
in the intent tier. Skills has one, and it is marked **closed**: `design/03-product-breadth.md:329`
records **B7 — return** as *"shipped 2026-08-13 (`return-and-progression`)"*, and §"Learn and
return" (`:68-77`) already names *"Concept progress, due attempts, blocked versus varied
repetition, scheduling over attempts (**concepts select, never schedule** — `01` ruling)"*. So a
skills taxonomy is not a new area; it is an **amendment to an area the intent tier calls shipped**,
whose one deliberate omission is named in the same row: *"Cross-pack concept identity deliberately
absent (a studio/B11 contract)"*. An RFC author must propose that amendment through a BACKLOG row,
never by writing `design/03`.

---

## 1. The owner's ask, verbatim

[[D549]], `design/BACKLOG.md:145`, quoted whole:

> **Skills/concepts earned from game review — chess.com's "skills" taxonomy as a progression
> surface (owner, 2026-08-20).** Chess.com fills five categories — *fundamentals, openings,
> tactics, strategy, endgames* — with named concepts and patterns a review detects and credits to
> the player. Owner: *"we need something like THAT too — it can support our campaign mode or
> general progress tracking and gamification."* Fits what already exists better than it first
> looks: the shipped-but-consumerless `attempt_concepts` ([[D300]]) is exactly a concept-credit
> stream, and [[D297]]'s knowledge-as-key device is the fun mechanism this feeds. **Constraint: a
> skill is credited from detected evidence, never LLM opinion (law 8), so this is downstream of the
> producer registry**

Three things in that row are load-bearing and one is wrong at HEAD:

| Clause | Status |
|---|---|
| *"it can support our campaign mode"* | **Now contested by an owner ruling.** [[D1151]] denominated campaign progression in the catalogue instead. §7.4 |
| *"shipped-but-consumerless `attempt_concepts`"* | **Wrong at HEAD, in a way that matters.** It has three live consumers — none of them a credit stream. §5.3 |
| *"credited from detected evidence, never LLM opinion"* | Holds, and the desk arm found the harder version of it: the manufactured judgement can live in the **aggregation rule** with no LLM anywhere. §3.2 |

---

## 2. What the desk arm settled, and what it did not

The closure landed **today**: `2021e1f` *"research: close grounded skills taxonomy desk arm"*
(2026-08-23 15:36), 580 insertions across the dossier, the instrument, the research README, the
research queue, the log and two ledger rows.

### 2.1 Settled

| # | Settled | Evidence |
|---|---|---|
| 1 | **The population is closed and set-equal to production, not hand-picked.** All **67** members of the exported `SEMANTIC_EVENT_PROJECTION_IDS` are classified; the instrument imports the symbol and fails if any current member is undisposed | `grounded-skills-taxonomy.md:30-33`; `tools/r20-skills-taxonomy/registry.ts`, `taxonomy.test.ts`; symbol at `packages/runtime/src/evidence-catalog.ts:149` |
| 2 | **The disposition: 47 habit-only · 11 Review-only · 4 refused-as-skill · 5 candidate credits · 0 production-ready** | `tools/r20-skills-taxonomy/output.md:3`; `grounded-skills-taxonomy.md:10-15` |
| 3 | **Openings and Strategy are honestly empty as credit categories** — not "coming soon". Opening identity establishes applicability, not accuracy; every structure/pawn/king/activity event is neutral until an outcome or cited-theory join supplies valence | `grounded-skills-taxonomy.md:97-104` |
| 4 | **An empty category is not filled from a weaker detector, and no five-card dashboard is owed merely because the taxonomy has five names** | `:111-113` |
| 5 | **A category-wide score is refused**: *"five unrelated denominators do not become one number through averaging"* — as are raw counts, streaks, one global floor and LLM-authored tiers | `:129-131` |
| 6 | **The tier convention is named**: `reference_quantile_lower_bound@1`, four states (`insufficient_evidence` → `established` → `above_reference` → `distinctive`), each rendered with rate, interval, population, phase, time-control scope and version | `:117-127` |
| 7 | **The module join is corrected**: 181 declared / 179 intended compiled / 2 awaiting, superseding the queue's stale 175 | `:35-40`; `rfc/learner-modules.md:494-499`; [[D1054]] `design/BACKLOG.md` |
| 8 | **The measurement arm is preregistered** — six conditions incl. R12's unchanged stability gate, early↔late and blitz↔rapid transfer, the D603 all-ones alarm, and versioned reference quantiles | `:135-150` |

Ledger rows landed by the closure: **[[D1053]] 📊** (*"R20 closes the current skill-credit
population at five candidates and zero production-ready rules… a neutral event's occurrence is not
evidence of mastery merely because it is countable"*) and **[[D1054]] 🐞 ✅** (the 175→181
correction).

### 2.2 Still open

| # | Open | Why it could not close on a desk arm |
|---|---|---|
| 1 | **Every floor.** All five candidates carry `floorGames: null`, `floorStatus: "unmeasured"`, `state: "measurement_blocked"` | needs durable cross-run observations — `tools/r20-skills-taxonomy/registry.ts:92-155` |
| 2 | **Every reference population.** No versioned reference distribution exists for any candidate, so `above_reference` and `distinctive` are undefined in practice | `grounded-skills-taxonomy.md:13-15` |
| 3 | **Opportunity incidence.** Nobody knows how often these five opportunities *arise* — mate conversion is flagged *"exact but naturally rare"* | `:56`, `:143` |
| 4 | **Transfer.** Early↔late and blitz↔rapid non-inversion is preregistered and unrun | `:141-142` |
| 5 | **Anti-farming in production.** The rate must be shown not to collapse to games played, repeated-root exposure or pack selection | `:144` |
| 6 | **Whether any of the five survives.** Failure removes that credit and leaves the projection available to Review, Support, bots and drills — *"a detector does not live or die with one consumer"* | `:148-150` |
| 7 | **The R12 floors are not promotable.** They came from 200 blitz games per high-activity account over 59 hours; only the two opening habits quote measured floors — and those two have no production projection | `:174-176`; `design/research/player-style-metrics.md:107-128` |

**The single most useful sentence in the dossier, for an RFC author:** *"That zero is the important
result"* (`:16`). The desk arm's product is a **refusal with a closed population behind it**, not a
backlog of badges.

---

## 3. The grounding problem — this is the whole lane

A skill is an abstraction over evidence. Ours must be **derived from registered projections, never
asserted**. Everything below is the mechanics of that sentence.

### 3.1 What the shipped collectors actually are, and why 67 ≠ 30 + 18 + 14

The three wave counts and the event-role set measure **different units** and are not in conflict.
This was checked against the catalogue rather than the RFCs.

| Set | Count | What it contains | Symbol / line |
|---|---:|---|---|
| `TACTICAL_COLLECTOR_PROJECTION_IDS` | **30** | Wave A: readings, predicates, consequences **and** events | `packages/runtime/src/evidence-catalog.ts:152-168`; `rfc/tactical-collectors.md:1033-1071` |
| `BREADTH_COLLECTOR_PROJECTION_IDS` | **18** | Wave B, same mix | `evidence-catalog.ts:171-180`; `rfc/breadth-collectors.md:425-447` |
| Wave C (semantic collectors) | **14 registered / 12 compile** | 9 events + 3 readings/predicates/consequences; the 2 promotion-race ids are **unimplemented and negative-asserted** | `rfc/semantic-collectors.md:697-716`; absence asserted `evidence-catalog.test.ts:106` |
| `SEMANTIC_EVENT_PROJECTION_IDS` | **67** | **only the event-role projections**, across all waves plus the pre-collector structural/transition/avoidance events | `evidence-catalog.ts:149` (concat of 11 sub-lists, `:115-148`) |
| whole manifest | **189 projections** / 35 producers / 25 consumers / 210 bindings | | `docs/evidence-contract.md:25` |

Overlap is real and must not be double-counted: `rules.tactic.event.double_attack@1` is tactical
collector #13 **and** a member of the 67; `rules.tactic.reading.loose_piece` is tactical #8 and is
**not** in the 67, because it is a reading. **Only the 67 are candidates for roll-up** — the store's
ingest set is exactly that symbol (§5.1), and a reading is a statement about a position, not about
a decision the learner made.

### 3.2 The mechanism that makes the roll-up hard, in one line of shipped code

`packages/runtime/src/evidence-catalog.ts:951` declares `valence: "none" as const` — a **hard
literal with no branch**, applied to all 67 semantic-event declarations. `:980` sets
`valenceAuthority: Object.freeze([])` on every eligibility row, and `:962` registers
`valence_unbacked` as a first-class refusal reason.

**That is the grounding problem stated by the code itself.** The producer layer declares, for every
event it emits, that it carries no good/bad sign and cites no authority for one. A roll-up that
converts occurrence into credit therefore does not *read* valence off the evidence — it **adds**
valence the producer explicitly refused to declare. The dossier's formulation:

> *"Converting neutral occurrence into a skill badge would be an LLM-free violation of law 8: the
> manufactured judgement would live in the aggregation rule instead of the prose."*
> — `grounded-skills-taxonomy.md:18-21`

This is why the lane cannot be discharged by picking good-sounding detectors. It is also why the
lane is *not* dead: a small number of events are ones where the **rules themselves** supply the
sign, because the alternative was legally available and declinable.

### 3.3 The roll-up rule

**rate = credited events ÷ declinable opportunities**, where the denominator is rules arithmetic
over the *complete legal-candidate set* at each decision — the F2 legal-alternative population,
which R12 already ran over **261,892 decisions** (7,200 games, 36 accounts). Baseline is a named
population/window; floor is per-metric; tiers sit on the **rate**, never on a count.
`design/BACKLOG.md:508` ([[D842]]); `design/research/player-analysis-and-skills.md:168-187`,
`:97-99`.

### 3.4 What makes a skill claim falsifiable

Synthesized from D842's rules, R20 §6 and the two measured anti-gaming defects. Five conditions;
a claim failing **any** of them is not falsifiable and may not ship.

| # | Condition | The defect it exists to prevent |
|---|---|---|
| 1 | The denominator is computed from the **legal alternatives**, including at least one that *declines* the event — never from the played move | [[D603]]: the fianchetto instrument returned **586/586** because its denominator admitted only knight moves. *"An all-ones credit is an instrument alarm, not a mastered skill"* (`player-analysis-and-skills.md:201-207`) |
| 2 | The claim **reopens exact contributors** — run/node or game/ply rows | a rate nobody can audit is a vendor score; every surveyed product fails this (§3.6) |
| 3 | The rate does not **restate exposure** | [[D345]]: `plyHorizon` equals the deepest authored spine ply in **29 of 31** non-endgame packs — *"the field restates its input and therefore measures nothing"* (`:199-201`); the authored `passed_pawn_advanced` 18.81× headline is pack composition, not skill |
| 4 | It is **not farmable by repetition** — one opportunity row per distinct decision context; retries update a rehearsal result, never the credit | same-root farming (`:213-215`; `grounded-skills-taxonomy.md:144`) |
| 5 | It **passes a preregistered stability gate** at its floor and every larger measured floor, and a failure **removes the credit, not the evidence** | high rho alone is not enough: fianchetto-unblock rho 0.188; forcing-choice rho 0.904 but same-side 69.4% — the binding criterion is same-side-of-reference, not correlation (`player-style-metrics.md:101-121`) |

A sixth, from D842 property 4: **a validator ships before the number does** — a positive fixture, a
D603-style all-ones alarm and a synthetic control (`player-analysis-and-skills.md:216-218`). The
precedent for skipping it is [[D440]]: 25 packs assert a terminality nothing validates.

### 3.5 So: is any roll-up defensible today?

**One roll-up *shape* is defensible. Zero roll-up *instances* are.** That is a finding, not a
failure, and it is the honest answer the brief asked for.

The five candidates, with their exact ids and the module rows that could consume them
(`tools/r20-skills-taxonomy/registry.ts:92-155`; `output.md:7-15`):

| Category | Candidate skill id (desk vocabulary) | Source projection(s) | Opportunity rule | Consumers | State |
|---|---|---|---|---|---|
| Fundamentals | `skills.fundamentals.loose_piece_avoidance@1` | `derived.semantic_avoidance.loose_piece@1` | ≥1 legal candidate creates the registered loose-piece relation **and** ≥1 avoids it | `postcommit_nudge`, `review_map` | `measurement_blocked` |
| Tactics | `skills.tactics.double_attack_conversion@1` | `rules.tactic.event.double_attack@1` + `rules.tactic.consequence.reply_breadth@1` | ≥1 legal candidate creates the registered meaningful double attack; **reply breadth disclosed, never renamed "forced"** | `postcommit_nudge`, `review_map` | `measurement_blocked` |
| Tactics | `skills.tactics.mate_conversion@1` | `rules.transition.event.checkmate@1` | ≥1 legal move checkmates | `postcommit_nudge`, `review_map` | `measurement_blocked` (naturally rare) |
| Tactics | `skills.tactics.discovered_execution@1` | `derived.tactic.discovered_executed@1` | ≥1 legal candidate produces the identity-retaining registered event | `full_inspector` **only** | `measurement_blocked` |
| Endgames | `skills.endgames.promotion_completion@1` | `rules.transition.event.promotion@1` | ≥1 legal candidate promotes **and** ≥1 does not | `postcommit_nudge`, `review_map` | `measurement_blocked` |

Two clauses an RFC author must carry verbatim, because both are narrower than they look:
- **Promotion completion says completion, not conversion.** *"'Converted the endgame' needs Syzygy
  or a declared engine/authored outcome join"* — and the store's landing ingest set **deliberately
  excludes tablebase facts** (`grounded-skills-taxonomy.md:58`, `:105-109`).
- **All five `skills.*@1` ids are desk-research vocabulary.** They are registered in
  `evidence-catalog.ts` nowhere and appear nowhere in `packages/runtime/src`. An RFC that cites them
  as production ids is citing a research instrument.

And the four **refused as skill** — all counts or breadths, all operands: `rules.structural.event.
piece_count@1`, `rules.structural.event.direct_attack_count@1`,
`derived.semantic_avoidance.piece_count@1`, `derived.semantic_avoidance.direct_attack_count@1`
(`output.md:34-35`, `:59-60`). *"Higher is neither better nor worse."*

### 3.6 What the competitors do, and the one thing we may take

| Product | Mechanism, per the repo's teardowns | Verdict |
|---|---|---|
| **chess.com Skills** | Five categories; **one point per qualifying move**; mastery at "collect enough points"; sequential unlock; **detection mechanism undisclosed; no opportunity denominator anywhere** | *"grindable by volume and by seeking easy positions"* — mechanism refused (`player-analysis-and-skills.md:28-32`, `:71`) |
| chess.com Game Review grades | 12 words from engine multi-PV delta; `Brilliant`/`Great`/`Miss` are **rating-dependent** — same move, different word per player | the named counter-example for rating-conditioned wording (`:72`; `assistance-surface-taxonomy.md:406-408`) |
| Aimchess | six aspects, engine-delta composites, **undisclosed formulas**; names embed valence ("Resourcefulness") never grounded | refused (`:74`) |
| Lichess Insights | *"almost entirely grounded facts or disclosed engine aggregates"*; Opportunism/Luck are convention composites; **zero** structure/space/plan facts | closest to honest; still no floor (`:75`) |
| Chessable Difficult Moves | the one *counted* competitor rule — *"3 or more mistakes and a review score below level 4"* — *"law-8-compatible by construction"* | **adoptable**; feeds [[D865]] (`chessable-movetrainer.md:66-73`, `:247-256`) |
| OpeningTree | *"the only surveyed product entirely on the legal side of law 8"* | (`:76`) |

The decisive sentence, `player-analysis-and-skills.md:84-87`:

> *"we may adopt their category names and their comparison-to-peers framing; we may not adopt a
> single one of their credit or score mechanisms as-is, because **none publishes a denominator, a
> floor, or a re-derivable rule**."*

**The differentiator is therefore the denominator**, and it is the only defensible reason to build
this at all.

---

## 4. The D842 mapping onto `learner-modules` — feasible only in a narrowed form

The research-queue row R20 phrases the desk arm as *"map `player-analysis-and-skills.md` §3's rules
… onto the **175 admitted learner-module rows** and shipped/accepted collector ids"*
(`planning/platform-alignment/residue-reconciliation.md:199`; the queue at
`planning/platform-alignment/research-queue.md:81` now carries the corrected 181).

**As literally worded, that mapping is not possible, and R20 correctly did not perform it.** Three
reasons, in increasing order of importance:

| # | Obstacle | Evidence |
|---|---|---|
| 1 | **The 175 is stale.** The accepted contract is **181 declared / 179 intended compiled / 2 awaiting** after the D924 six-row inspector amendment | `rfc/learner-modules.md:494-499`; [[D1054]] |
| 2 | **Unit mismatch — the real obstacle.** A learner-module row is one literal `(projection id, module consumer)` **pair** governing *what may be shown in one seat*. D842's rules govern *a projection aggregated over decisions across runs*. Rate, floor and tier have no meaning applied to a seat | `rfc/learner-modules.md:494-495`; `design/BACKLOG.md:508` |
| 3 | **Only retrospective rows are eligible at all.** *"Only retrospective module declarations are eligible for a learner skill aggregate… No pre-commit, threat-radar or blunder-prevention consumer receives a learner profile. This is the assistance-separation rule in executable form: prior performance may select later content, never widen live help or change what is said about the current move"* | `grounded-skills-taxonomy.md:42-48`; `rfc/learner-rating.md` §8/AC-11 |

**What is possible, and what R20 built instead**, is the correct two-stage join: *projection →
category → disposition*, then *candidate → the module rows that may consume its aggregate*. The
arithmetic of stage two:

| Quantity | Value |
|---|---|
| Declared eligibility rows in the accepted contract | **181** |
| Rows reachable by any skill aggregate | **9** — four candidates × (`postcommit_nudge` + `review_map`) = 8, plus discovered execution in `full_inspector` |
| Share of the accepted module contract a skills surface can touch | **≈5%** |
| Modules that may **never** receive a learner profile | `rules_floor`, `sight_on_request`, `blunder_prevention`, `threat_radar`, `structure_nudge`, `theory_breadcrumb`, `guided_hint`, `compare_coach` (`rfc/learner-modules.md:481-491`) |

**Verdict on the queue row:** feasible after two corrections — replace 175 with 181, and replace
"map the rules onto the module rows" with "map the rules onto the *projections*, then bind passing
credits to the ≤9 retrospective rows." An RFC author who takes the row literally will produce a
category error.

**On floors specifically:** D842 cites *"sample floors of 25–200 games per metric"*. That range is
real but is **R12's measured range for habit metrics, not for these five candidates** — the only
metrics with a measured floor anywhere in the repo are the two opening habits (surprisal, floor 25,
rho .974; family entropy, floor 100, rho .935), and *neither has a production projection*
(`player-style-metrics.md:107-128`; `grounded-skills-taxonomy.md:97-101`). *"A single marketing
floor is wrong"* — and so is inheriting someone else's.

---

## 5. The data dependency — skills accumulate, and nothing accumulates

### 5.1 The accepted grain

| Fact | Value | file:line |
|---|---|---|
| Status | `accepted — 2026-08-22` **while the same status line says three open questions *"resolve before implementation"*** | `rfc/longitudinal-store.md:3`, `:9-10` |
| Grain | **per-run (per-game), not per move.** *"No cross-game total is ever stored"* — windows computed at read | `:54-57`, `:210-216` |
| PK | `(learner_id, run_id, projection_id, projection_version, phase, decision_class)` | `:181` |
| `decision_class` | closed 3-value `played` / `game` / `predicted`; the [[D934]] amendment that unblocked acceptance | `:170`, `:124-140` |
| Denominator-free rows unrepresentable | `CHECK (opportunities > 0)` and `CHECK (occurred <= opportunities)`; a family with no opportunity in a run+phase has **no row** | `:182-183`, `:217-220` |
| Ingest set | exactly `SEMANTIC_EVENT_PROJECTION_IDS`, **referenced by symbol, not copied** | `:251-260` |
| Excluded at landing | *"shape firings, **tablebase facts**, clock spend, explorer joins"* | `:266-270` |
| Consumers at landing | **none** — no route, no client change, no capability entry | `:108-118` |
| Explicitly not in it | habit cards, **skill credits**, milestones, tips, style axes, opening rollups, **concept-keyed aggregation ([[D300]])**, rating input/output, LLM | `:113`, `:570-603` |
| Privacy | *"No table stores a per-learner metric vector, archetype, axis label, or composite"*; *"No cross-learner read path exists"*; no sentence/label/verdict column; hard deletion cascade with `__legacy` retention **refused** | `:438-452`, `:480-487`, `:607-617` |
| Open questions, all three unresolved | (1) does `theory.shapes` join the ingest set? (2) bulk-import scale — the refs arrays are O(games × families × decisions) and **no measurement exists**; (3) who bumps `derived_rev` | `:724-747` |

Blocked by **[[D973]]** (`design/BACKLOG.md:50`) and **[[D1011]]** (`:303`) — which are duplicates
of each other, same defect, filed a day apart with different owners named. Both say the same thing:
implementing migration 26 before the clauses are reconciled *"would turn an ambiguous acceptance
into product policy."*

### 5.2 What exists in code: nothing

The audit's "prose only" finding is **confirmed and slightly understated** — five prose files, not
three.

| Probe | Result |
|---|---|
| `learner_observations`, `learner_structure_stats`, `longitudinal`, `derived_rev` in `apps/`, `packages/`, `workers/` | **zero hits each** |
| `STORAGE_VERSION` at HEAD | **25** (`apps/server/src/storage.ts:631`) — no migration 26 |
| `make longitudinal-rebuild` (the RFC's own trust instrument) | **no Makefile target** |
| `planning/longitudinal-store/` (declared at `rfc/longitudinal-store.md:46`) | **directory does not exist** |
| Every `learner_observations` occurrence | prose: `rfc/longitudinal-store.md`, `rfc/README.md:282`, `rfc/archive/portable-account-data.md:112`, `planning/platform-alignment/deferral-inventory.md:149`, `planning/platform-alignment/breadth-reality-check.md:193` |

The audit that found it: `planning/platform-alignment/breadth-reality-check.md:191-203` —
*"**What a learner could see today about their own style: zero pixels.**"*

### 5.3 The shipped ancestor, and the correction to D549

`attempt_concepts` **is real and is not consumerless.** It has three live consumers — and none of
them is a credit stream, which is the more useful finding.

| Consumer | What it does | file:line |
|---|---|---|
| Account export / hard delete | inventory membership | `apps/server/src/account-data.ts:47`, `:119`, `:266` |
| `same_concept_in_pack` related-attempt selector | offers ≤3 least-rehearsed related attempts, **additionally scoped `AND a.pack_id = ?`** | `apps/server/src/storage.ts:2721-2724` |
| `RunStorage.metrics()` | voluntary concept-return counts — operator/reporting, explicitly *"not a claim made by the learner UI"* | `storage.ts:2718+`; `docs/return-and-progression.md:71-73` |

Table DDL at `storage.ts:4135-4144`; write path `:2580`, `:2583`. **[[D300]]'s citation
`storage.ts:2529-2538` is stale** — the DDL moved.

The blocker is identity, not storage: the default resolver is `PackScopedConceptResolver`, whose
key is literally `` `pack:${packId}#${raw}` `` (`apps/server/src/progress.ts:56-59`), so the same
string in six packs is six keys. [[D300]] (`design/BACKLOG.md:1085`): **186 tags, 156 distinct
across 47 packs, only 24 appearing in ≥2 packs; 132 of 156 are singletons**, so *"today the honest
collection is the 25-entry shape library."* `ConceptResolver` is an **injectable interface**
(`progress.ts:52-54`) — a corpus-global resolver is a one-class change. This is the single
highest-leverage act in the lane (§9).

**One more finding that changes the corpus story:** imported games project **no attempts and no
concept tags at all** — `projectAttempts` returns frozen empties for `sessionKind === "imported"`
(`apps/server/src/progress.ts:83-85`). The natural corpus for a skills surface — the learner's own
real games — contributes exactly zero rows to every progression table that ships today.

### 5.4 Pre-data vs post-data

| Computable **today**, with no store | Requires the store |
|---|---|
| The **per-decision denominator** — F2's complete local counterfactual population is implemented (`rfc-graph.md:69`), which is how R12 ran 261,892 decisions | Any rate over more than one run |
| A **per-run** occurrence/opportunity pair, in memory, for one finished run | Every floor (25–200 games by construction) |
| A per-game Review observation card over already-shipped high-lift evidence — **zero new collectors, zero store** (`player-analysis-and-skills.md:354-359`) | Every reference population and quantile |
| The D745 negative reading with its denominator, post-commit and in review, **within one run** | Every tier state above `insufficient_evidence` |
| The complete disposition table (done — R20) | Every anti-farming check, all of which are cross-run by definition |

**The consequence for scoping is exact:** everything in the left column is a *run-local* fact, and
everything the word "skill" implies is in the right column. A skills RFC written before the store
lands can specify shapes and refusals; it cannot specify a single number.

---

## 6. The law-8 boundary — and whether a "skill level" is a number about the learner

### 6.1 The line, pinned

Law 8 (`CLAUDE.md`) and the thesis prohibitions are quoted in full in the sibling derivation —
`planning/review/rfc-derivation.md:385-403`. Not restated here. What this lane adds is the
**person-subject** axis, which review does not carry:

`design/research/assistance-surface-taxonomy.md:75` — *"Plan-subject is the law-8 line (§4c);
**player-subject requires the longitudinal store + D842's denominator rules**."* Player-subject is
the axis this lane is entirely about, and it is the only axis in the taxonomy gated on two things
at once.

| May be said | Authority |
|---|---|
| A **measured frequency with its denominator over registered ids**: *"you avoided leaving a piece loose; N% of your legal moves would not have"* — denominator **always** shown, **never** on the pre-commit path | [[D745]](2), owner ruling 2026-08-22, `design/BACKLOG.md:585` |
| The same reading extended across runs, with rate, 95% interval, opportunity count, population, phase, time-control scope and version co-rendered | `grounded-skills-taxonomy.md:117-127` |
| *"observed in 8 of 23 eligible middlegame decisions; low confidence"* | `design/research/integrated-platform-alignment.md:186-193` |
| A **record of an event that happened** — *"Beat band 2200 on 2026-08-19"* | shipped: `apps/web/src/lib/RatingScreen.svelte:148` |
| Category **names** (fundamentals/openings/tactics/strategy/endgames) as navigation, and peer-baseline **framing** with our denominator published | `player-analysis-and-skills.md:84-87`; `assistance-surface-taxonomy.md:342` |

| May **not** be said | Why |
|---|---|
| A **skill level, score or percentage** per category | *"five unrelated denominators do not become one number through averaging"* (`grounded-skills-taxonomy.md:129-131`); and shipped copy already refuses it — milestones *"never add a skill percentage, score, streak, rating, ranking, or cross-learner comparison"* (`docs/return-and-progression.md:48-49`) |
| A **raw count** or a **streak** | D842: counts are grindable (chess.com's shape); a streak *"punishes the learner for facing more opportunities"* (`player-analysis-and-skills.md:189-195`) |
| *"You are weak at back-rank tactics"*, "tactical vision", "positional understanding", "plays too simple" | the refused column of the five-category map, `player-analysis-and-skills.md:154-158` |
| Archetypes, player types, "plays like a grandmaster" | R12 clustering fails decisively: **ARI 0.251–0.417** against a 0.70 gate, k=4–12 (`player-style-metrics.md:164-168`) |
| Any credit **derived from LLM output**, or an LLM-authored tier | law 8; D842 property 5 |
| A skill value reaching anything that **renders** a judgement on a move | R15 / AC-11, below |

### 6.2 The rule three independent documents converge on

This is the strongest structural result in the lane, and it was reached three separate times by
three separate authorities:

| Source | Formulation |
|---|---|
| `rfc/learner-rating.md:990` (**R15**, enforced as reachability test AC-11) | *"a rating may select **WHAT** a learner is shown — which pack, which band, which population — and may never appear as an input to **WHAT IS SAID** about a move they played. **Selection, yes; rendering, never.**"* |
| `design/01-training-model.md:50` (owner ruling 2026-08-12) | *"What is scheduled: attempts. **What selects among them: concepts.** What is never a scheduling key: phase."* |
| [[D842]], `design/BACKLOG.md:508` | *"mastered skills **OPEN content, never grade the player**"* |

**An RFC author should take this as the lane's first invariant**, because it is already enforced in
code for the rating and already ruled for concepts. A skill credit may open a campaign door, select
a pack, or unlock an evidence consumer ([[D297]] knowledge-as-key). It may never enter
`guard.ts`, `voice.ts`, `outcome-presentation.ts`, `feedback.ts` or `objective.ts`.

### 6.3 Does [[D1151]]'s refusal reach this lane? — be precise

The ruling, `design/06-campaign.md:377-386` / `design/BACKLOG.md:421`: campaign progression is the
catalogue; the rejected alternative was *"the learner's own history (D302's three-axis histogram)…
refused because it would have introduced **the first number this product has ever shown a learner
about themselves** — with two measured warnings that numbers outrun their basis standing against
it."*

Three findings, in order:

**(a) The ruling's stated ground is factually stale at HEAD — and this is a ledger row, not a
reopening.** `learner-rating` is **implementing** with migration 25 landed, and the number is on
screen: `apps/web/src/lib/RatingScreen.svelte:85` renders *"Your measured record"*, `:128` the
rating itself, `:141` a *"What this number means"* disclosure list, `:148` marks reading *"Beat band
1400 / 1800 / 2200 on <date>"*, and `CohortStanding.svelte` ships cross-learner comparison. So the
first number about the learner already shipped. **[[D438]] anticipated exactly this trap**
(`design/BACKLOG.md:792`): *"before refusing a surface because a number is manufactured, check
whether the document doing the refusing has already argued that it is not"* — and its replacement
criterion is **provenance**, not manufacturedness. The owner's *choice* of the catalogue stands
untouched; only the premise offered for it needs correcting.

**(b) Scope: the ruling denominates campaign progression, not every learner-facing number.** It
does not, on its text, rule on a skills surface outside the campaign. R20 reaches the same
conclusion from the other side: *"Campaign knowledge-as-key may consume a passing tier, but campaign
progression itself remains unlocked by playing under [[D1040]]. **A failed or insufficient skill
measure cannot block the core path**"* (`grounded-skills-taxonomy.md:160-162`).

**(c) But the ruling's *reasoning* does reach one specific shape here, and kills it.** Answering the
brief's question directly:

| Object | Is it a number about the learner? | Verdict |
|---|---|---|
| A **skill level** — a scalar per category, or five cards each showing a score | **Yes, unambiguously.** It is a composite about a person, derived from a small sample | **Refused twice over** — by D1151's reasoning, and independently by `grounded-skills-taxonomy.md:129-131`, which refuses the category-wide score on arithmetic grounds before anyone reaches the ethics |
| A **skill credit as an event record** — *"in 41 of 52 decisions where a legal alternative would have left a piece loose, you avoided it; reference median 68%; 95% CI 71–86%; 63 blitz games; v1"* | **It is a measured frequency about the learner's decisions, with the denominator visible.** Not a trait, not a composite, not a level | **Admissible in principle** — it is [[D745]]'s already-ruled reading extended across runs. Still blocked on measurement, not on law |
| A **milestone** — *"first mate conversion recorded"*, *"Beat band 1800"* | It is a record of an event that happened | **Already shipped** and already fenced (`docs/return-and-progression.md:48-49`) |

**The line, stated once:** *a skill **level** is a number about the learner; a skill **credit** need
not be.* This lane survives only in the second form. Any RFC that opens with five category cards
carrying scores has failed at the title.

**One tension an RFC author must not paper over.** The intent tier *wants* a person-level
statement: `design/01-training-model.md:44-46` — *"Concepts are how the product can ever say **'you
keep mistiming the break'** instead of 'you lost that position'."* That sentence is the owner's
ambition and it is not refused. It is licensed **exactly when** "keep" is a frequency with a
denominator over a registered id, and refused the moment it becomes a trait. The whole lane is that
one substitution.

---

## 7. The seams

### 7.1 `learner-modules` — 9 rows of 181

Covered in §4. The two facts an author needs: the module contract is **accepted and inert** —
*"the day this RFC lands, nothing new renders to a learner"* (`rfc/learner-modules.md:1020-1023`) —
and `compileModuleRegistry` has **never been invoked in production**
(`planning/review/rfc-derivation.md:181-197`). A skills RFC cannot be the first caller of the module
registry; the review lane reaches it first and should.

### 7.2 Review — cited, not duplicated

`planning/review/rfc-derivation.md` is authoritative for F6 and was written in parallel. Its
findings that bind this lane:

| Finding | Where |
|---|---|
| The store's grain is per-run, `decision_class` **does not exist in code**, and *"a v1 review RFC must not claim to feed the longitudinal store"* | `planning/review/rfc-derivation.md:296-312` |
| Skills credit is explicitly **deferred out of review's v1**, to F9; `rfc-graph.md:73` excludes longitudinal focus from F6 | `:585-597` |
| `review_map` is a *specified, registered, 48-row, unbuilt* module whose declared learner action is *"replay from this moment"* | `:275-295` |

**And one consequence this lane owns:** R20's own cheapest first shippable — a per-game observation
module in Review, *"the D549 surface's visible seed: the move-list marks chess.com's Skills feature
shows, grounded our way"* (`player-analysis-and-skills.md:354-359`) — has **zero store dependency
and zero new collectors**, and it belongs to the *review* RFC. So **the first visible pixel of the
owner's D549 ask ships in someone else's lane**, and this derivation's job is to say so rather than
claim it.

### 7.3 Longitudinal store — §5. It is codex's implementation lane, held by D973/D1011.

### 7.4 Is the catalogue the skills surface under a different name?

**No. They are different objects, and confusing them would be the most expensive error available in
this lane.** But the question is right to ask, because they compete for one screen and one word.

| Axis | The catalogue ([[D1151]], ⚖️ ruled) | Skills ([[D549]]/[[D842]], 💡 unmeasured) |
|---|---|---|
| Denominated in | **content**: shapes met, structures played | **decisions**: credited events ÷ declinable opportunities |
| Subject of the claim | the corpus — *what you have now seen* | the learner — *how you chose, relative to what you could have chosen* |
| Truth condition | you encountered it or you did not; a lookup | a statistical claim requiring a floor, an interval and a reference population |
| Falsified by | a query | a preregistered stability gate that can remove the credit |
| Monotone? | yes, by construction — nothing can take it back | no; a rate can fall |
| Where it lives | *"the what's-missing mark on the **pack card**, rather than a progress screen"* | undecided; ≤9 retrospective module rows are the only admissible seats |
| Data required | the run log + a cross-pack vocabulary | the longitudinal store (0 lines) + a measurement arm (unrun) |
| Shipped ancestor | the **25-entry shape library**, `shapeRecommendations` | `attempt_concepts` — real, with three consumers, none a credit stream |
| Status | **ruled**, RFC owed | idea; desk arm closed at **zero** production-ready rules |

**They are not rivals in the same way [[D893]] and [[D1151]] are not** (`design/06-campaign.md:387-390`
makes that distinction for the campaign's currency). The catalogue answers *what have I seen*;
skills answers *how do I decide*. A product can honestly have both.

**Two things follow that an RFC author must carry:**

1. **They share exactly one prerequisite, and it is one class.** Both are blocked on [[D300]]:
   the catalogue because *"a collection screen over a namespaced-apart vocabulary would display 156
   things nobody can complete"* (`design/06-campaign.md:384-386`), and skills because concept
   credit cannot recur across packs. `ConceptResolver` is injectable
   (`apps/server/src/progress.ts:52-54`). **One change unblocks two ruled-or-wanted surfaces.**
2. **There are already three progression denominations in this tree, not two** — and nobody has
   written that down:

| # | Denomination | Object | Status |
|---|---|---|---|
| 1 | **The catalogue** | content seen | ⚖️ ruled 2026-08-23, unimplemented, owes D300 |
| 2 | **Milestones and marks** | events that happened — *"first"* events, one attempt-count event, *"Beat band 1800"* | **shipped**: `docs/return-and-progression.md:48-49`; `RatingScreen.svelte:145-148` |
| 3 | **The skill rate** | a frequency over opportunities | 💡 unmeasured, unbuilt |

Denomination 2 is the honest template for 3: **a mark is a record of an event, with a denominator
that is a whole game against a named opponent**, and it is law-8 clean by construction. If the
owner rules that skills must be marks rather than rates, the lane collapses to a much smaller and
much sooner-shippable thing. That is a genuine fork and it belongs in §8.

### 7.5 Downstream consumers already written against this lane

| Row | What it needs from here |
|---|---|
| [[D861]] pass-mark packs (`design/BACKLOG.md:506`) | *"[[D549]]'s progression surface with a century-old pedigree"* — Yusupov scorecards over shipped verdicts, kept **pack-scoped to stay on [[D320]]'s no-learner-number line**. Needs `attempt_concepts` as a credit stream; needs **no** longitudinal store |
| [[D865]] difficult roots (`:500`) | Chessable's counted rule (≥3 mistakes + level) over `learner_position_stats`, linking preserved attempts. Needs no store |
| [[D885]]/[[D297]] knowledge-as-key (`:481`) | a *passing* tier as an unlock key — but campaign progression may not block on it (`grounded-skills-taxonomy.md:160-162`) |
| [[D882]] assistance fade (`:498`) | opportunity-normalized rates with D842 floors as the instrument behind `design/05` §3b's *"guided mode fades"* |

**Note the pattern: D861 and D865 are the two that need nothing this lane is blocked on.**

---

## 8. Gaps — every question an RFC author must answer

Owner-tier forks marked ⚖. Traps marked ⚠.

| # | Gap | Notes |
|---|---|---|
| 1 | ⚖ **Is the skills lane in scope at all, given [[D1151]]?** The catalogue is the ruled progression denomination. Skills is either a second, non-competing object (§7.4's recommendation) or it is redundant | O9 does not ask this. It must be asked |
| 2 | ⚖ **Rates or marks?** §7.4's denomination 2 — an event record — is shippable far sooner than a rate and is already law-8 clean. Rates need the store plus a measurement arm | The cheapest honest version of D549 may be a marks surface |
| 3 | ⚖ **Does O9's recommended ruling extend to credits and tiers?** As drafted it covers habit cards, a ledger and three modules only | `o9-handoff.md:35-38` |
| 4 | ⚖ **May a five-category navigation exist over empty categories?** R20 says an empty category is not filled from a weaker detector and *"no five-card dashboard is required merely because the taxonomy has five names"* — but the owner asked for chess.com's five | `grounded-skills-taxonomy.md:111-113` |
| 5 | **Which of D973/D1011's three store questions get answered, and by whom?** The two rows are duplicates; one should be closed as such | `design/BACKLOG.md:50`, `:303` |
| 6 | **Does the store's ingest set need extending for skills?** It is `SEMANTIC_EVENT_PROJECTION_IDS` by symbol and excludes tablebase facts — which caps `promotion_completion` at *completion*, never *conversion* | `rfc/longitudinal-store.md:266-270` |
| 7 | **Who lands [[D300]]?** It is one class (`progress.ts:52-59`) and it blocks both the catalogue and this lane. Today it is owned by nobody | `design/BACKLOG.md:1085` |
| 8 | ⚠ **Imported games project no attempts.** `projectAttempts` returns empties for `sessionKind === "imported"`. The learner's real games — the corpus D549's "earned from game review" implies — feed nothing today | `apps/server/src/progress.ts:83-85` |
| 9 | **Where does a skill credit render?** Only ≤9 retrospective eligibility rows are admissible, and both `postcommit_nudge` and `review_map` are unbuilt and Phase-4/5 gated | §4 |
| 10 | ⚠ **The `skills.*@1` ids are research vocabulary.** They exist only in `tools/r20-skills-taxonomy/registry.ts`. An RFC citing them as production ids repeats the [[D921]] placeholder-id defect | `evidence-catalog.ts` has zero hits |
| 11 | ⚠ **Do not inherit R12's floors.** 25–200 games came from concentrated blitz over 59 hours; only the two opening habits quote measured floors and neither has a production projection | `grounded-skills-taxonomy.md:174-176` |
| 12 | ⚠ **The tier convention `reference_quantile_lower_bound@1` is `[M]`** — synthesized, not measured. It is the one piece of the dossier not carrying `[V]` | `:127` |
| 13 | **Reference population: whose games?** No versioned reference distribution exists, and building one from learners' games collides with the privacy clauses (no cross-learner read path) | `rfc/longitudinal-store.md:448-452` |
| 14 | ⚠ **R12's style vector re-identifies 35 of 36 accounts (97.2%).** Any skill vector is behavioral identifying data; privacy is a design input, not a policy footnote | `player-style-metrics.md:154` |
| 15 | **Rating isolation must be asserted, not assumed.** R15/AC-11 is a reachability test for the rating; a skills aggregate needs the symmetric one | `rfc/learner-rating.md:990`, `:1004` |
| 16 | **Every credit ships with a validator** — positive fixture, D603 all-ones alarm, synthetic control — *before* the number | `player-analysis-and-skills.md:216-218` |
| 17 | ⚠ **`docs/evidence-contract.md:156-159` is stale** — it says deflection, attraction and the bounded-mate projection remain absent; all three are registered (`evidence-catalog.ts:144`; `evidence-catalog.test.ts:98-107`). Only the tablebase race claim survives. Do not cite it for what compiles | measured |
| 18 | ⚖ **Law 5: `design/03` B7 is marked shipped in full.** An amendment adding a progression surface to a closed row is owner-tier and must go through a BACKLOG row | `design/03-product-breadth.md:329` |

---

## 9. Recommended scope cut

**Shape: do not draft a skills RFC. The lane's v1 is not a skills feature.** It is one owner ruling,
one class change, one already-accepted store, and one card that ships in the review lane. Writing an
`rfc/skills.md` today would produce a document whose every number is `null` — which is precisely
what the desk arm concluded (`grounded-skills-taxonomy.md:152-157`: *"The skill/progression RFC
should not be drafted as a catalogue of badges"*).

### 9.1 In v1, in order

| # | Action | Wiring or building? | Owner | Basis |
|---|---|---|---|---|
| 1 | **Put O9 to the owner**, plus gaps 1–4 (scope, rates-vs-marks, credits-in-O9, five-category navigation) | neither — one ruling, already written | owner | §0, §8 |
| 2 | **Land [[D300]]**: swap the default `ConceptResolver` for a corpus-global one, with the migration for existing pack-scoped keys | **wiring** — one injectable class at `progress.ts:52-59`, plus a key migration | codex | unblocks the ruled catalogue *and* this lane |
| 3 | **Reconcile D973/D1011 and implement `longitudinal-store`** as accepted — store and rebuild instrument only, no readers | **building**, but the RFC is written and accepted | codex | §5.1 |
| 4 | **Ship R20's per-game observation card inside the review RFC** — deterministic cards over already-shipped high-lift evidence (`named_structure` 9.96×, Syzygy), zero new collectors, zero store | **wiring**, in F6's lane | review RFC | `player-analysis-and-skills.md:354-359` |
| 5 | **Run the R20 measurement arm** over durable observations once #3 lands: five candidate rules, floors at 25/50/100/200, R12's gate unchanged, transfer arms, D603 alarms | **research**, not product | claude | `grounded-skills-taxonomy.md:135-150` |
| 6 | **Then draft F9** — over passing rows only | | | |

### 9.2 Deferred, with destination

| Deferred | To |
|---|---|
| Any tier, milestone, badge or "mastered" label | after #5; a credit that fails leaves its projection available to Review, Support, bots and drills |
| A five-category dashboard | gap 4's ruling; and only over categories with honest content |
| Openings and Strategy credits | permanently, until an outcome or cited-theory join supplies valence (`:97-104`) |
| Promotion *conversion* (vs completion) | needs tablebase facts, which the store excludes at landing |
| Style axes, archetypes, "maps to the greats" | [[D552]]/R21 — a separate contract; archetypes REFUSED at ARI 0.251–0.417 |
| Cross-learner comparison of skills | the store has no cross-learner read path by construction |
| [[D861]] pass-mark packs, [[D865]] difficult roots | **neither needs this lane's blockers** — both are pack- or position-scoped and could ship independently. Recommend routing them out of F9 |

### 9.3 The wiring-vs-building split

| Class | Items | Estimate | Confidence |
|---|---|---|---|
| **Pure wiring — a caller or a swap for code that exists** | the D300 resolver swap (#2); the per-game observation card (#4), which composes shipped detectors and the shipped Review path | one injectable class + one key migration; one card over existing producers | **high** — `ConceptResolver` is already an interface with a second implementation shape implied |
| **Building, but fully specified** | `longitudinal-store` migration 26, two tables, the deriver, the `make longitudinal-rebuild` byte-equality instrument and its tamper fixture (#3) | an accepted RFC with DDL, PK, checks and acceptance criteria already written — **and three open questions to answer first** | medium — the scale question (refs arrays, O(games × families × decisions)) has **no measurement** |
| **Research, not product** | the measurement arm (#5) | R12's instrument exists and has run 261,892 decisions; it needs a production observation source | medium |
| **Genuinely new product** | *nothing in v1* | — | — |

**Headline, and it inverts the review lane's:** review's v1 is roughly two-thirds wiring over ~738
lines of complete, tested, unreachable code. **Skills has no such reservoir.** The one shipped
thing this lane could light up — `attempt_concepts` — is namespaced apart by a single class, and
the one thing it most needs — a store — is 100% paper behind an accepted RFC that contradicts its
own status. So the correct v1 is *unblocking*, and the correct posture is that **the owner's D549
ask gets its first visible pixel from the review lane, not from this one.**

### 9.4 One recommendation to carry to the owner

**Offer the marks form as the cheap arm, beside the rate form as the expensive one** (gap 2). The
product already ships a learner-facing credit surface that is law-8 clean by construction — the
`learner-rating` marks (*"Beat band 1800 on <date>"*, `RatingScreen.svelte:148`) and the
return-loop milestones that *"record firsts and one explicit attempt-count event"*
(`docs/return-and-progression.md:48-49`). Extending that shape to the five R20 candidates —
*"first mate conversion recorded"*, *"first discovered attack executed"* — needs **no floor, no
reference population, no interval and no store**, because a first is an event, not a rate. It gives
the owner a visible, chess-shaped, gamified progression surface in the D549 spirit **within the
already-ruled no-learner-number line**, and it leaves the rate form to arrive later on measurement
rather than on ambition. The rate form is still worth building — it is our only real differentiator
against a field where *nobody publishes a denominator* — but it should not be the thing that has to
ship first.

---

## 10. Ledger rows this derivation proposes

Written unnumbered per [[D1130]] — *id assigned at landing; head was D1153 at drafting.*

1. ⚖ **The skills lane needs its per-lane ruling, and O9 as drafted does not supply all of it.**
   [[D1093]]'s mandate enumerates three lanes and skills is not among them; the owner sentence it
   derives from names style, not skills. O9 is READY FOR OWNER but its seven recommendations cover
   habit cards, a ledger and three modules — **not credits, milestones or tiers**. One ruling on
   O9 *plus* gaps 1–4 opens the lane.
2. 🐞 **[[D1151]]'s stated ground is stale at HEAD: the first number about the learner already
   shipped.** `learner-rating` is implementing with migration 25 landed and
   `RatingScreen.svelte:85-148` renders a rating, a disclosure list and band marks;
   `CohortStanding.svelte` ships cross-learner comparison. The owner's *choice* of the catalogue is
   untouched; the premise offered for it needs correcting, exactly per [[D438]]'s standing guard.
3. 💡 **There are three progression denominations in this tree, and only one is written down.**
   The catalogue (ruled), milestones/marks (shipped), the skill rate (unmeasured). The second is the
   honest law-8 template for the third, and no document currently names all three together.
4. 🐞 **[[D549]]'s "shipped-but-consumerless `attempt_concepts`" is wrong at HEAD.** It has three
   live consumers — account export/delete, the `same_concept_in_pack` related-attempt selector
   (`storage.ts:2721-2724`) and `RunStorage.metrics()` — none of which is a credit stream. The
   defect is identity (`PackScopedConceptResolver`), not absence of a consumer. [[D300]]'s DDL
   citation `storage.ts:2529-2538` is also stale; the table is at `:4135-4144`.
5. 🐞 **Imported games project no attempts or concept tags at all** —
   `apps/server/src/progress.ts:83-85`. The corpus D549's *"earned from game review"* presupposes
   contributes zero rows to every shipped progression table. Route to the import lane or to F9.
6. 🐞 **[[D973]] and [[D1011]] are duplicates** — same defect, same three questions, filed a day
   apart with different owners named. One should close as a duplicate so the store has one blocker,
   not two.
7. 🐞 **`docs/evidence-contract.md:156-159` is stale against the shipped catalogue.** It says
   deflection, attraction and the bounded-mate projection remain absent; all three are registered.
   Only the tablebase promotion-race claim survives. It also undercounts Wave C as nine.
8. 💡 **[[D861]] pass-mark packs and [[D865]] difficult roots need none of this lane's blockers.**
   Both are pack- or position-scoped, both consume shipped data, and both are currently parked
   behind F9. Recommend routing them out.
9. 💡 **Law 5: `design/03-product-breadth.md:329` marks B7 shipped in full**, and its one named
   omission is exactly this lane's prerequisite (*"cross-pack concept identity deliberately
   absent"*). A progression surface is an amendment to a closed row; proposed here, not written.
