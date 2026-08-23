# Player style analysis — RFC derivation

**Lane:** F9 (`planning/platform-alignment/rfc-graph.md:76` — *"Player metrics, profile, skills and
grounded coaching"*)
**Written:** 2026-08-23, by claude, on the [[D1110]] finding that this lane is one of the **four
dossier sets cited by nothing** and items #4/#6 on the owner-interest ranking.
**Measured at:** `325166d` (HEAD moved four times during this pass — codex commits continuously;
the working tree also carries 24 modified and 8 untracked files from concurrent agents, including
`packages/runtime/src/evidence-catalog.ts`, which the projection count below reads).
**Method:** every "what exists" claim was read at HEAD or executed. **No RFC's claim about itself
and no dossier's claim about the code was accepted as evidence** — and that discipline moved one
number (§2.4) and corrected one line reference (§0).

**Not touched by this pass:** `design/06-campaign.md`, `planning/bot-roster/`, `planning/review/`,
`design/BACKLOG.md`, or any file in the dirty set. This document is the only artifact.

---

## 0. Licensing status for drafting — read this first

**A player-style *RFC* is NOT licensed today. This derivation is.** Two independent blocks, and
only one of them is an owner's signature.

| Question | Answer | Source |
|---|---|---|
| Does [[D1093]]'s drafting mandate reach this lane? | **No, and not even arguably.** Its operative sentence is *"Product-surface RFCs in **these ruled lanes** may be drafted"*, and it enumerates exactly three: [[D1031]] variants, [[D1041]] time controls, [[D1060]] famous games. Style is not among them, and unlike review it is not merely unenumerated — it carries a **contrary routing note** (next row) | `design/BACKLOG.md:438` |
| Is the interest in doubt? | **No.** The owner sentence D1093 derives from names this lane in its own words: *"…campaign mode? **analysing the players playstyle**? nice bots that play human / with personalities?"* And [[D551]]/[[D552]] are verbatim owner asks from 2026-08-20 | `planning/platform-alignment/breadth-reality-check.md:5-7`; `design/BACKLOG.md:147-148` |
| Is there a lane-specific gate? | **Yes, and it is the harder of the two.** [[D1055]]'s status reads verbatim: *"foundation amendments + measurement precede D552 surface RFC."* This lane refused its own drafting on **evidence**, not on ceremony — and it did so on the same day the mandate was recorded | `design/BACKLOG.md:392` |
| Was that refusal made by an agent avoiding work? | **No — it is the dossiers' own verdict.** R21's title is *"twelve measured habits, **zero production-ready cards**"*; R20's is *"category breadth is not credit authority"*, closing at **zero** production-ready credits. Both are landed research, not a deferral | `longitudinal-style-feedback-contract.md:1,11-17`; `grounded-skills-taxonomy.md:1,10-15` |
| Is the general exploration gate open? | Yes — owner override 2026-08-12, logged | `planning/exploration/gates.md:198` |
| **So what unblocks drafting?** | **Not one ruling — a ruling *and* a measurement.** (a) a per-lane owner ruling alongside D1031/D1041/D1060, which costs an afternoon; (b) the R21 §6 measurement order, which cannot be shortened by any ruling because it is what makes the numbers true. **An owner ruling can license a *foundation* RFC today; it cannot license a learner-facing style card** | `longitudinal-style-feedback-contract.md:163-179` |

**The consequence that matters for scoping, stated once.** This lane is the only one of the four
where the owner's signature is *not* the binding constraint. Variants, clocks and famous games each
needed a ruling and got one. Style needs a ruling **and** eight weeks of somebody's real play. §7's
cut is built around that asymmetry: the parts a ruling unblocks are separated from the parts only
time unblocks, so the first RFC can ship without waiting on the second.

**Line-reference drift, noted for the next reader.** `planning/review/rfc-derivation.md:20` cites
D1093 at `design/BACKLOG.md:428`; at this pass it is `:438`. The ledger moves under concurrent
commits. Cite ids, verify lines.

**One law-5 consequence, flagged not acted on.** `design/03-product-breadth.md` has **no style
surface**. Its only `style` hits are unrelated. A style card has no home in the intent tier, exactly
as game review does not. An RFC author proposes a `design/03` amendment through a BACKLOG row —
never by writing the design doc.

---

## 1. The owner's asks, verbatim

Three sentences, quoted from the ledger, in the order they constrain the design.

| Ask | Verbatim | Where |
|---|---|---|
| **[[D552]]** the shape | *"chess.com has so much feedback after a session and can tell you all your openings and how accurate you are with them"* | `design/BACKLOG.md:148` |
| **[[D552]]** the mapping | *"maps your opening style to (aggressive-solid, theoretical-creative) and maps it to the greats"* | `design/BACKLOG.md:148` |
| **[[D552]]** the tip sentence | *"early game is solid, but in the midgame your play is too simple and positional, not enough tactics"* | `design/BACKLOG.md:148` |
| **[[D551]]** the bot half | *"it does seem like steering the AI in early game to give personality cause it just uses Maia otherwise… they apply tricks to add behaviours or make higher/lower Elo and unique opening books"* | `design/BACKLOG.md:147` |
| The breadth question | *"…campaign mode? **analysing the players playstyle**? nice bots that play human / with personalities? etc etc etc…"* | `planning/platform-alignment/breadth-reality-check.md:5-7` |

**Read as a specification, the tip sentence is this lane.** It is one sentence containing four
claims, three of which are judgements about a person, and it is the reason §4 exists. The ledger
row itself already flags the condition: *"legal under law 8 **iff** every input is a grounded fact
and the LLM only renders the aggregate"* (`design/BACKLOG.md:148`).

**D551 is a different lane wearing the same words.** Its subject is *bot* personality — the
`bot-policy` / `planning/bot-roster/` lane, held by another agent. It enters this derivation at
exactly one point: the **shared feature vocabulary** ([[D843]], §5.3 below). Everything else in
D551 belongs to the bot lane and is not derived here.

---

## 2. What the dossiers concluded

### 2.1 The two dossiers, and what each one is

| Dossier | Question | Kind | Verdict in one line |
|---|---|---|---|
| `player-style-metrics.md` | R12 — which descriptive metrics are reproducible and separate from strength | **A measurement.** 36 accounts × 200 blitz games, 7,200 games, 261,892 decisions | *"A transparent continuous habit profile is a viable research candidate. A natural archetype or grandmaster-personality match is not"* (`:11-13`) |
| `longitudinal-style-feedback-contract.md` | R21 — the aggregation contract over R12's survivors | **A desk contract + executable join.** Reads R12's `results.json`, set-equality-tested | *"twelve measured habits, zero production-ready cards"* (`:1`) |
| `shared-style-atoms-as-bot-traits.md` | D1062 — do the atoms become bot personalities | **A refusal, measured.** 279 positions × 3 Maia bands = 804 evaluated cells | *"Shared style atoms do not become bot personalities by reweighting once"* (`:1`) |

### 2.2 The 12 metrics and their true readiness — verified

**The "0 of 12 production-ready" claim is correct**, and it is stronger than a status note: R21's
instrument is **set-equal** to every R12 metric with a non-null persistent floor and *fails* on an
omitted, added or re-floored metric (`longitudinal-style-feedback-contract.md:26-29`;
`tools/r21-style-feedback-contract/style-contract.test.ts`). The 12 rows below are re-derived from
`tools/r21-style-feedback-contract/registry.ts` and cross-checked against R12's own table
(`player-style-metrics.md:107-126`).

| # | Metric | feature id | unit | measured floor (games) | ρ@200 | blocker class | **what this one specifically needs** |
|---:|---|---|---|---:|---:|---|---|
| 1 | opening surprisal | `opening.move_population_share@1` | decision | 25 | 0.974 | reference + runtime identity | a **pinned versioned opening reference population** (exact-position move counts through ply 8, admitted at N≥50) + runtime exact position/move identity |
| 2 | opening-family entropy | `opening.family@1` | game | 100 | 0.935 | reference + runtime identity | one resolved **three-character ECO family per game** at runtime |
| 3 | fianchetto setup rate | `structure.fianchetto_setup@1` | game | 25 | 0.865 | collector + store | a **registered semantic-event projection** for the bishop+advanced-pawn configuration; today it is an exact predicate in a research harness only |
| 4 | fianchetto knight-screen rate | `structure.fianchetto_knight_screen@1` | game | **200** (ceiling) | 0.757 | collector + store | same, plus the same-side-knight screen; **retained only at the 200-game ceiling** — the weakest survivor |
| 5 | castle kingside rate | `move.castle_side@1` | **game** | 50 | 0.896 | denominator mismatch | a **game-level eligibility projection** (*"retained a castling right at their first move"*) that the store's per-decision opportunity model cannot express |
| 6 | castle queenside rate | `move.castle_side@1` | **game** | 50 | 0.907 | denominator mismatch | same; R12 notes its 12-game first pass **regressed**, so its floor is a hard 50 |
| 7 | clock spend: opening | `time.spend_share@1` | decision | 100 | 0.950 | collector + store | **typed adjacent clock readings** + base/increment + phase; store ingest explicitly excludes clock spend |
| 8 | clock spend: middlegame | `time.spend_share@1` | decision | 50 | 0.971 | collector + store | same |
| 9 | clock spend: endgame | `time.spend_share@1` | decision | 25 | 0.932 | collector + store | same |
| 10 | pawn-choice residual | `move.role.pawn@1` | decision | 100 | 0.932 | collector + store | a registered **move-role** atom; the legal-alternative arithmetic under it already ships |
| 11 | extended-centre-pawn residual | `move.pawn_to_extended_center@1` | decision | **200** (ceiling) | 0.871 | collector + store | a registered **destination-set** atom; ceiling floor |
| 12 | early-queen residual | `move.early_queen@1` | decision | 100 | 0.931 | collector + store | a registered **role×ply** atom (queen move before ply 16) |

`[V]` `tools/r21-style-feedback-contract/registry.ts:44-166`;
`design/research/player-style-metrics.md:107-126`;
`design/research/longitudinal-style-feedback-contract.md:31-38`.

**The thirteenth thing every row needs, and it is not on the list above.** All twelve additionally
require **early↔late (≥8 weeks) and blitz↔rapid transfer**, because R12's population is a
deliberately biased **59-hour, high-activity blitz** cohort. R12 says so in its own limits: *"the
measured floors below are prototype floors for this population, not 1.0 defaults"*
(`player-style-metrics.md:73-74`, `:193-209`). **No owner ruling can substitute for this.**

**The claim R21 corrects at source, and it matters for planning.** `player-analysis-and-skills.md`
called several of these computable *"today"* once a store existed. R21: *"The accepted store does
not persist arbitrary move-role, clock or configuration observations… The R21 result is therefore
**0 of 12**, not 'twelve after the store'"* (`longitudinal-style-feedback-contract.md:43-48`). Any
plan that budgets "store, then style" is budgeting the wrong thing.

### 2.3 What R12 refused, verified and carried forward

These are not soft preferences. Each is a **measured failure against a pre-declared gate**, and
carrying them is the difference between this lane and astrology.

| Refusal | The measurement that produced it | Where |
|---|---|---|
| **Natural archetypes / player types** | k=4–12 clustering, median account+game-bootstrap **ARI 0.251–0.417** against a **pre-declared 0.70 gate**; seven of nine baseline solutions contain a **one-account cluster** | `player-style-metrics.md:18-19`, `:164-167` |
| **Maps-to-the-greats / "GM twin"** | Two independent grounds: the clustering above failed, *and* a GM reference corpus is a **differently sampled population** whose distances mean nothing without the validation that just failed | `player-style-metrics.md:166-167`; `player-analysis-and-skills.md:251-260` |
| **Rating separation is a pass, not a licence** | Five-fold ridge from the vector to within-band rating gives **R² = −0.296** (worse than the fold mean); the injected rating control gives **R² = 1.0**. The gate passes — and *"must rerun whenever the registry or reference population changes"* | `player-style-metrics.md:159-162` |
| **The four failed metrics stay out** | fianchetto-unblock (ρ 0.188, same-side 50.0%), forcing-choice (one band), non-pawn-capture (same-side 72.2%), opponent-reply-breadth (one band) — *"using the four refused metrics merely because their rank correlation looks high"* is named as refused | `player-style-metrics.md:113,120,123,124`, `:189` |
| **One global confidence label** | Floors range 25→200 across the survivors; *"a display floor must pass every larger measured sample, not merely one isolated size"* | `player-style-metrics.md:100-105`, `:128-132` |
| **Composite trait words** | *"tactical," "positional," "aggressive," "creative," "patient" or similar compositions without a separately validated formula* | `player-style-metrics.md:186-187` |
| **Absence readings** | *"interpreting failure to reach an endgame as a preference to avoid it"* | `player-style-metrics.md:188` |
| **LLM-written weaknesses or advice** | explicitly refused from these atoms | `player-style-metrics.md:190-191` |

**And one refusal that should be read as a design gift.** The **35/36 re-identification** across
disjoint halves (`player-style-metrics.md:151-157`) means a style vector is **behavioral
identifying data**. The store already answers this structurally: *"No table stores a per-learner
metric vector, archetype, axis label, or composite"*, no cross-learner read path exists, and export
is owner-only (`rfc/longitudinal-store.md:440-459`). **The privacy pin is already written; the RFC
inherits it rather than inventing it.**

### 2.4 What the D1062 refusal refuted, and whether it constrains this lane

**It refutes a bot claim, not a style claim — and it explicitly says so.**

| | |
|---|---|
| **What was tested** | five rules-exact R21 atoms as a **global one-ply Maia candidate weight** at ×4, against the existing controlled-trait gate |
| **Result** | best mover is extended-centre pawn: **12.01% → 17.64% (+5.63 pp)** against a required **10 points**. Others: early queen +1.94, castle +1.62, fianchetto-with-knight +0.14, fianchetto setup **+0.05** |
| **Sensitivity** | ×8 moves extended-centre pawn only **+8.54 pp**; the rest stay ≤3.14. Not "slightly too weak" |
| **Able-to-fail** | the pawn ×4 positive control reproduces D969 exactly (19.945575 cp, Explorer match 0.309485, pass) and forcing ×3 reproduces its pre-registered fail. The instrument can produce both outcomes |
| **What it does NOT do** | *"It does **not** reject the atoms themselves. They remain exact shared primitives for collectors, Review, drill conditions and later habit measurement"* (`:19-22`) |

`[V]` `design/research/shared-style-atoms-as-bot-traits.md:9-15`, `:50-56`, `:68-70`, `:37-40`.

**Its constraint on this lane is one sentence and it is a positive one:** *"collector priority and
bot-profile eligibility are now demonstrably separate… Their failure as global bot weights is not a
reason to omit them from the shared registry"* (`:87-91`). Concretely, D1062 **removes** an
argument an RFC author might otherwise have made — that the fianchetto/move-role atoms should wait
for the bot lane to want them. They must be built for the style/Review side on their own merits.

**One number this pass moved.** D1062 also fixed the castling atom's exact semantics before
measuring it: standard and nonstandard Chess960 castling both classify through
`chessops.castlingSide`, and a fixture with king `b1` / rook `a1` proves the old two-file heuristic
disagrees (`:42-46`). **A future `move.castle_side@1` projection must use that classifier**, not a
file comparison — and this now intersects the [[D1031]] variants lane, which admits Chess960.

---

## 3. The data dependency — what exists, honestly

### 3.1 The store: accepted on paper, absent in code

| Claim | Verified state | Evidence |
|---|---|---|
| `rfc/longitudinal-store.md` is accepted | **Yes**, 2026-08-22, by claude as register owner | `rfc/longitudinal-store.md:3` |
| `learner_observations` exists in production code | **No. Prose only.** `grep -rn "learner_observations\|learner_structure_stats\|decision_class" apps packages tools` → **zero hits**. The identifiers appear in exactly five files, all documents | executed this pass; `rfc/README.md`, `rfc/longitudinal-store.md`, `rfc/archive/portable-account-data.md`, `planning/platform-alignment/breadth-reality-check.md:191-194`, `planning/platform-alignment/deferral-inventory.md` |
| Its acceptance is itself contested | **Yes, twice.** [[D973]] and [[D1011]] both record that it is marked `accepted` while all three of its Open questions still say *"resolve before implementation"* | `design/BACKLOG.md:50`, `:303`; `rfc/longitudinal-store.md:724-748` |
| It has consumers at landing | **None, by design.** *"No production code reads these tables at landing except the rebuild instrument"* | `rfc/longitudinal-store.md:497-498` |

**So the honest sequence is three deep, not two:** resolve D973/D1011 → implement migration 26 and
the derivation → *then* a style consumer. A style RFC that assumes "the store is accepted, so the
data is there" is assuming past **two** unbuilt things.

### 3.2 The store's grain, and the two places style collides with it

| Store concept | Definition | Consequence for style |
|---|---|---|
| **Decision** | user-actor node, **attributed to the run's owner or booked not at all** — a grant holder's or seated opponent's move is another learner's hand | a style card can never accidentally measure someone else's play |
| **`decision_class`** ∈ `played` / `game` / `predicted`, **in the primary key** | `played` = owner committed live; `game` = the historic player's move on an imported mainline (*"the store does **not** assert that player is the learner"*); `predicted` = a `prediction.recorded` edge | **the single most important column for this lane.** "Tells you all your openings" over an imported corpus reads `game` rows about a player the store refuses to identify as the learner. **A style card must declare which class it counts.** Pooling them is *"the exact habit-denominator corruption this store exists to prevent"* |
| **Opportunity** | a decision where the family's event is exhibited by ≥1 edge of `{played} ∪ legalAlternativeEdges(...)` — [[D842]] rule 1's *declinable* population | this is [[D603]]'s all-ones alarm **made structural**: a metric computable only from moves that already exhibit the event is unrepresentable |
| **Phase band** | `classifyPhase(parent.fen).phase` | *"the measured window that makes 'midgame' in the tip sentence a fact rather than vibes"* — the store RFC says this in its own words |
| **`CHECK (opportunities > 0)`** | a denominator-free row is unrepresentable | honest empty, never a zero-denominator row |
| **Per-run grain** | *"No cross-game total is ever stored"*; windows are computed at read | a style card's window is consumer arithmetic; no stored tier, ever |

`[V]` `rfc/longitudinal-store.md:124-155`, `:178-250`.

**Collision 1 — the ingest set.** Landing ingest is exactly `SEMANTIC_EVENT_PROJECTION_IDS`, read
**by symbol reference, not a copied list** (`:251-262`). Executed at HEAD: **67 members**
(`npx tsx -e "import {SEMANTIC_EVENT_PROJECTION_IDS} …"`). *(The RFC's own open question 2 says
"40 families at HEAD" — that was true on 2026-08-22 and is now stale; the symbol-reference design
is why the staleness is harmless.)* Explicitly **not ingested**: *"shape firings, tablebase facts,
**clock spend**, explorer joins"* (`:266-270`). That single clause is what makes metrics 7–9
blocked and metrics 1–2 blocked.

**Collision 2 — the castling denominator.** The store defines opportunity **per decision**; R12
defines castling rate **per game**, eligibility fixed by whether the learner retained a castling
right at their first move. *"These are different populations and can produce different numbers.
Reusing the store's generic opportunity count would silently change the measured metric"*
(`longitudinal-style-feedback-contract.md:70-74`). The lawful choices — *"add the exact game-level
eligibility projection, or define a new decision-level castling-opportunity metric and run R12's
stability test again. It may not relabel one denominator as the other"* (`:78-80`).

### 3.3 What can be computed **today**, at HEAD

| Capability | State at HEAD | Line |
|---|---|---|
| Complete legal-alternative population per decision | **Ships.** `legalAlternativeEdges(beforeFen, committedMoveUci)` | `packages/runtime/src/semantic-evidence.ts:968` |
| The **avoidance / negative-reading** operand set — the D745 sentence's arithmetic | **Ships.** `derived.semantic_avoidance.*` declares operands `["relation","family","legalAlternatives","alternativesWithFamily","alternativeEvents"]`, signs `["avoided"]` | `packages/runtime/src/evidence-catalog.ts:124-125`, `:298`; `semantic-evidence.ts:1039` |
| 67 versioned semantic-event projections | **Ships**, executed | `packages/runtime/src/evidence-catalog.ts:149` |
| Phase classification | **Ships** | `packages/runtime/src/phase.ts:63` |
| PGN / Lichess-URL **game import** with stored raw bytes | **Ships.** `imported_games` persists source, digest, headers; a Morphy PGN produces a run plus a story | `planning/platform-alignment/breadth-reality-check.md:143-144` |
| Opening identity at runtime | **Refused in shipped behaviour**: `{ kind: "opening_identity", disposition: "refused", reason: "Opening identity is position naming, not a recorded measurement" }` | `apps/server/src/position-evidence.ts:25` |
| Clock readings | **Untyped passthrough.** `readonly clockState?: Readonly<Record<string, unknown>>` | `packages/runtime/src/types.ts:124` |
| Nearest durable learner-scoped data | `learner_position_stats(learner_id, transpose_key, seen_count)` — a "seen N times" counter **with no reading surface**; `attempt_concepts`, whose only consumer is the `/learn` recommendation sentence | `apps/server/src/account-data.ts:119-121`; `apps/server/src/storage.ts:1054-1056` |
| Anything a learner can see about their own style | **Zero pixels.** `grep -rn "habit\|longitudinal\|tendency" apps/web/src` → zero hits; every `style` hit in the client is a CSS tag | `planning/platform-alignment/breadth-reality-check.md:195-205` |

**The three-bucket answer the brief asked for:**

| Bucket | Contents |
|---|---|
| **Computable today, per game, no store** | Every per-decision semantic event with its declinable denominator — including the [[D745]] negative reading — over any run the learner has, **imported games included**. This is a *per-game* fact surface, not a habit card. It is also §7's v1. |
| **Needs the store implemented** | Any statement of the form "across N games". The arithmetic is trivial; the persistence does not exist. Blocked behind D973/D1011 → migration 26 → derivation. |
| **Needs data that only accumulates once someone plays** | **All twelve floors** (25→200 games) *and* the ≥8-week early/late split *and* blitz↔rapid transfer. Import shortens this for `game`-class rows — a learner can import 200 games in a minute — but **import cannot produce `played` rows**, and `played` is the class every "your play" sentence means. There is no way to buy this. |

**The one genuine accelerant, and its exact limit.** Because the store is *a projection of the run
event log* (`rfc/longitudinal-store.md:272`), **every game already imported or played can be
back-derived** when the store lands — deferral *"costs a rev bump and a rebuild, not a migration"*
(`:270`). So delay loses nothing already recorded. It does **not** manufacture `played` decisions
that were never made.

---

## 4. The law-8 boundary — this lane's whole risk

> *"Your midgame is too simple"* is not a claim about a position. It is a **judgement about a
> person**, delivered by software, over a sample the person did not choose.

### 4.1 The standing prohibitions

| Instrument | What it says | Where |
|---|---|---|
| **Law 8** (ADR-0005) | *"LLMs may render validated evidence but may not create ungrounded strategic claims or grade moves. 'Stockfish: +0.54 / Maia: 31% / LLM: "Ne5 centralizes the knight"' is a dashboard, not a drill"* | `CLAUDE.md` §Non-negotiable laws |
| **The thesis's frame** | the product is *"closer to a rehearsal loop than to an analysis dashboard"* | `design/00-thesis.md:14` |
| **The assessability rule** | *"The target must be honest, so it can only be set where the result is assessable"*; above eight pieces it is *"an authored or engine judgement and **must be labelled as one**"* | `design/00-thesis.md:93-95` |
| **`BANNED_JUDGEMENTS`** — shipped, enforced | 28 words: `weak, strong, good, bad, better, worse, advantage, winning, losing, should, must, best, worst, mistake, blunder, punish, wins, loses, brilliant, excellent, great, superb, perfect, impressive, beautiful, accurate, inaccurate, inaccuracy, precise, clever, sharp, strongest` | `packages/runtime/src/voice.ts:93-98` |
| **`PRESCRIPTIVE_VERBS`** — shipped | 24 verbs incl. `play, avoid, prevent, prepare, attack, defend, target` | `packages/runtime/src/voice.ts:99` |
| **The enforcement shape** | `voiceCheck` rejects any square, move, chess noun, judgement word or prescriptive verb **absent from the admitted source items** — an allow-list derived from the packet, not a blocklist | `packages/runtime/src/voice.ts:110-119` |
| **[[D745]] — the owner's negative-reading ruling** | *"the negative reading **FACES LEARNERS** in post-commit and review modules — 'you avoided leaving a piece loose; N% of your legal moves would not have' — **denominator always shown, never on the pre-commit path**"*; and *"a detector with lift below 1.0 is a detector pointing the other way, and now it may say so to the person who earned it"* | `design/BACKLOG.md:584` |
| **[[R15]] byte identity**, inherited by the store in both directions | *"a rating may select WHAT a learner is shown… and may never appear as an input to WHAT IS SAID about a move they played. Selection, yes; rendering, never"* | `rfc/longitudinal-store.md:462-465` |
| **No sentence column exists** | *"There is no sentence column, no label column, no verdict column"* — LLM text has no cell it could occupy | `rfc/longitudinal-store.md:481-489` |

### 4.2 The line, pinned: measured frequency vs characterisation

**Permitted** (R21's own example, `longitudinal-style-feedback-contract.md:137-141`):

> Across 63 measured rapid games, you reached the declared fianchetto setup in 18 of 63 games
> (95% interval …). This card's floor is 25 games.

**Refused from the identical bytes** (`:143-146`):

> You are a solid positional fianchetto player and should seek sharper kingside attacks.

*"The second sentence adds a **type**, **valence** and **prescription**. None is an operand."*

**Every card carries**, non-negotiably: metric id/version, literal value, 95% game-bootstrap
interval, game and decision counts, **metric-specific** floor, window, phase/time-control scope,
reference id/version where used, exact contributing game/ply references, and an abstention reason;
a truncated drill-down says how many examples are hidden
(`longitudinal-style-feedback-contract.md:122-127`).

**The LLM's whole degree of freedom**: it *"may paraphrase **one sealed admitted card**. It may not
choose the card, compare against an undeclared population, diagnose, advise, grade, create an
archetype or recommend a move"* (`:130-135`).

### 4.3 The tip sentence, decomposed — the boundary in its hardest case

This table is `design/research/player-analysis-and-skills.md:286-296`, verified verbatim, because
it is the single most useful artifact in the lane.

| Fragment | Grounded core | Grounded by | What may **not** be added |
|---|---|---|---|
| *"early game is solid"* | opening-band aggregate: structure-preservation residual + engine-loss distribution vs the named band baseline | shipped structural events + engine deltas under a **disclosed** threshold convention (*print the number or the convention, never only the word*) | **"solid"** as a trait; any causal reading |
| *"in the midgame"* | ply/phase band, disclosed exactly as the collectors measure it (D774 band discipline) | `classifyPhase` / declared ply bands | a phase boundary the packet does not carry |
| *"your play is too simple"* | trade/simplification residual: capture-choice and trade-completed rates over opportunities, mid-band | `derived.exchange.trade_completed@1` + capture events with legal-alternative denominators | **"too"** — a norm. Admissible **only** as an explicit population comparison with the baseline shown (*"above the band median of b"*); refused as a free adjective |
| *"and positional"* | redundant with the above | — | **"positional"** as a diagnosis — **refused**; R12 refuses tactical/positional composites without a separately validated formula |
| *"not enough tactics"* | phase-split tactic-opportunity conversion: of N mid-band decisions where a tactical event was available, played k; band baseline b | tactical events + reply-breadth / legal-alternative denominators | **"not enough"** — same rule as "too". **And no prescription** — *"play more tactics"* is advice reserved for the separate grounded-coaching contract |

**R21 restates the refusal at the aggregate level, and it is the sentence to quote in the RFC:**

> *"Nor may a summary say 'your middlegame is too simple' merely because it has a pawn or
> reply-breadth residual. Four candidate metrics, **including reply breadth**, failed R12's
> persistence gate; the words 'simple,' 'positional,' 'not enough tactics,' 'strength,' 'weakness'
> and 'needs work' require a separately validated aggregation rule and baseline. **The LLM is not
> that rule.**"
> — `longitudinal-style-feedback-contract.md:157-161`

**So the owner's exact sentence is not shippable as written, and the honest reply is not "no".** It
is: *the shape is legal, three of its five fragments are grounded aggregates, and "too"/"not
enough" become legal the moment a validated baseline is shown next to them.* [[D844]] already
records that ruling shape (`design/BACKLOG.md:511`; `player-analysis-and-skills.md:379-382`).

### 4.4 The trap that is not about words at all

**A judgement can live in the aggregation rule instead of the prose.** R20 states it exactly:
converting neutral occurrence into a skill badge *"would be an **LLM-free violation of law 8**: the
manufactured judgement would live in the aggregation rule instead of the prose"*
(`grounded-skills-taxonomy.md:19-21`). `voiceCheck` cannot catch this — it inspects sentences, and
a tier threshold is a number. **The RFC needs a second enforcement point for rules, not only for
text.** R20 supplies the only admissible tier rule: `reference_quantile_lower_bound@1` — four
states (`insufficient_evidence` / rate rendered as `established` / `above_reference` /
`distinctive`), each rendering the rate, interval, population, phase, time-control scope and
version, and *"a later owner ruling may put a ceremony over these states, but may not hide the
arithmetic or rename insufficient evidence"* (`:115-127`).

---

## 5. The seam with skills ([[D549]] / `grounded-skills-taxonomy.md`)

### 5.1 The two objects, side by side

| | **Skill credit** (D549 / R20) | **Style habit** (D552 / R12+R21) |
|---|---|---|
| Question answered | *did you convert an opportunity you should get credit for?* | *how often do you choose this, when you could decline it?* |
| Population | 67 semantic-event projections → **5 candidate credits**, 47 habit-only, 11 Review-only, 4 refused | 16 literal metrics → **12 retained** |
| Valence | **credit** — asymmetric; earning it is a positive event | **descriptive** — *"Higher is neither better nor worse"* |
| Denominator | declinable legal-alternative population per decision | same for 7 of 12; **per game** for 5 (2 castling, 2 fianchetto, 1 entropy) |
| Gate | R12's stability gate, **unchanged**, plus reference distribution | R12's stability gate |
| Production-ready today | **0 of 5** | **0 of 12** |
| Consumes | store `played` rows + a pinned reference population | store rows + (for 2) an opening reference |
| Downstream | campaign knowledge-as-key ([[D297]]), `attempt_concepts` after the [[D300]] migration | review cards, share card, drill selection |

`[V]` `grounded-skills-taxonomy.md:10-15`, `:50-66`, `:89-93`, `:133-150`;
`longitudinal-style-feedback-contract.md:31-38`.

### 5.2 Verdict: **two RFCs, with one shared foundation RFC beneath them — so three documents, not one and not two.**

**Reasons to split:**

1. **Different proof obligations, already formalised.** [[D843]]: *"same feature ids, two gates"*;
   R21's consumer table gives learner-style, bot-persona, Review and drill-selection **four**
   different *must-prove* columns (`longitudinal-style-feedback-contract.md:105-111`). One RFC
   with four acceptance regimes is four RFCs in a trench coat.
2. **Different downstream owners.** Skills feed **campaign progression** ([[D297]] knowledge-as-key,
   [[D861]] pass-mark packs) and are constrained by ADR-0007. Style feeds **review and a share
   card** and is constrained by privacy (35/36 re-identification). Coupling them means a campaign
   ruling can move a privacy pin.
3. **Different blocking prerequisites.** Skills additionally need the **[[D300]] `attempt_concepts`
   cross-pack identity migration** (`design/BACKLOG.md:145`, `:507`); style additionally needs the
   **opening reference artifact** and **typed clocks**. Neither blocker is on the other's path.
4. **R20 says so directly**: *"The skill/progression RFC should not be drafted as a catalogue of
   badges. Its first phase is the observation-store reader plus this five-rule measurement"*
   (`grounded-skills-taxonomy.md:156-157`) — an RFC about **measurement**, whereas the style RFC
   *"owns calm module composition, privacy, explicit sharing, exact drill-down and optional sealed
   LLM paraphrase"* (`longitudinal-style-feedback-contract.md:172-173`).
5. **Failure must be survivable in one direction only.** *"A detector does not live or die with one
   consumer"* (`grounded-skills-taxonomy.md:148-149`). If skills and style were one RFC, a failing
   skill measurement would block the two opening habit cards that already pass at ρ 0.974/0.935.

**The reason to share, which is why the third document exists:** metrics 3–4 and 10–12 are five
missing **feature atoms** that both consumers need, that the Review compiler needs, and that
D1062 proved the **bot lane does not need** (§2.4). Registering them five times in three RFCs is
the [[D523]] failure shape (grammar stated once, assumed elsewhere).

**Recommended shape:**

| Document | Owns | Licensed by |
|---|---|---|
| **A — foundation atoms** (an amendment to the owning collector RFC, or a small standalone) | the 5 missing literal projections + the castling game-eligibility projection + the clock-spend join; **no style prose, no thresholds** — R21's order says so explicitly (`:166-167`) | needs only the ordinary collector-RFC path; **the cheapest thing an owner ruling could unblock today** |
| **B — style surface** (the D552 RFC) | habit cards, card grammar, abstention, privacy/sharing, drill-down, sealed paraphrase | needs a per-lane ruling **and** the §7 measurement |
| **C — skills/progression** (the D549 RFC) | the 5-rule measurement, tiers, credit, D300 migration, campaign join | needs D973/D1011 + D300 |

---

## 6. The seam with review and campaign

### 6.1 Review — the surface style would live on, and the boundary is already drawn

| Fact | Where |
|---|---|
| Review's lane (F6) **explicitly excludes longitudinal focus until F9** | `planning/platform-alignment/rfc-graph.md:73`; `player-analysis-and-skills.md:330-334` |
| The dependency is **one-directional**: *"F9's ledger ingests what F6's moments already declared; F6 never waits on F9"* | `player-analysis-and-skills.md:333-334` |
| The review derivation reached the same conclusion independently: *"a v1 review RFC must **not** claim to feed the longitudinal store. It should emit the class-correct facts and stop"* | `planning/review/rfc-derivation.md:309-311` |
| **v1 review persists nothing** | `planning/review/rfc-derivation.md:559` |
| D1055's gate *"gates aggregates across games, **not** the per-game review surface"* | `planning/review/rfc-derivation.md:25` |

**Consequence, and it is a clean one:** the two lanes do not block each other in either direction.
Review ships per-game facts now; style ships aggregates later on the same atoms. The one thing the
style RFC owes review is **the `decision_class` declaration** — review's facts about an imported
mainline are `game`-class, and if review ever renders a "you" sentence over them it has asserted the
identity the store refuses to assert (`rfc/longitudinal-store.md:128-140`;
`planning/review/rfc-derivation.md:521`).

### 6.2 The sharpest question: is the catalogue the same object as the style histogram?

**Answer: no — they are three different objects, and the ruling's own text separates them.**

[[D1151]] ruled campaign progression is denominated in **the catalogue**: *"Shapes met, structures
played, with the *what's-missing* mark living on the **pack card** rather than a progress screen"*,
and *"Refused thereby: (b) the learner's own history, which would have introduced **the first
number this product has ever shown a learner about themselves**"* (`design/BACKLOG.md:421`).

**Critically, "(b) the learner's own history" is [[D302]]'s three-axis histogram, which is not the
style histogram.** [[D305]] defines the fork's three options, and D302 defines (b) exactly:

> *"**plies to the objective on the submitted branch** (bounded by `plyHorizon`), **assistance rungs
> switched on at the moment of submission**, and **the sealed objective state**"*
> — `design/BACKLOG.md:1087`

| | **Catalogue** (D1151, ruled) | **D302 histogram** (refused as progression) | **Style habit card** (this lane) |
|---|---|---|---|
| Denominator | the **content catalogue** — what exists to be met | the learner's **own prior submissions** | **declinable legal alternatives** at decisions where the event could have been declined |
| Axes | shapes, structures | plies · assistance rungs at submit · sealed objective | one literal metric per card, with an interval |
| Subject of the claim | **the content** ("this structure has appeared") | **the run's process** ("this submission used 2 rungs") | **the person's choices** ("you chose X in N of M chances") |
| Direction over time | monotone — it only fills up | non-monotone per submission | non-monotone; **can go down** |
| Home | the **pack card** | a progress screen (refused) | a review/profile card |
| Law-8 exposure | ~zero — it restates exposure and claims nothing | moderate — D302's own hard constraint: *no count of rewinds, forks or attempts may ever be an axis* | **highest in the product** — §4 |
| Ruled? | **yes, ruled in** | **yes, ruled out as progression** | **not ruled either way** |

**The finding that makes this precise, and it cuts both ways.** The catalogue *is* the [[D345]]
exposure-restatement pattern — which R20 names as a **disqualifier for skill credit**: counting
observed instances *"would restate which positions occurred — the D345 exposure failure — rather
than measure what the learner converted"* (`grounded-skills-taxonomy.md:84-86`). The catalogue is
lawful **precisely because it never claims skill**. The instant a catalogue cell is read as *"you
are good at Carlsbad structures"*, it becomes the thing R20 refused. **So the catalogue and the
style card are not the same object; they are near-opposites that a single careless sentence can
collapse into each other.**

**Does D1151 refuse the style histogram as *review content*? No — and it did not consider it.**

- The fork it answered (D305) is *"what is the campaign's **progression** denominated in"*. Its
  three options are three **progression denominators**. A review card is not a progression
  denominator.
- The refused object is D302's process histogram, whose axes (plies, assistance rungs, seal) share
  **no metric, no denominator and no data source** with R12's twelve habits.
- **But the stated *rationale* transfers, and an RFC author must not pretend otherwise.** *"The
  first number this product has ever shown a learner about themselves"* — a habit card is exactly
  that: a rate about the learner, with a confidence interval. And the ruling adds *"the research's
  own warning that numbers outrun their basis stands vindicated"* — a warning R12 makes about
  **itself** (`player-style-metrics.md:193-209`).
- Countervailing, and also the owner's: [[D332]] records the owner declining this very fork —
  *"we need history of learner too… and maybe catalogue progress… but the idea is again: go from
  elo 1000-2000 so maybe we need to just measure player ELO properly"* (`design/BACKLOG.md:1102`) —
  i.e. **learner history is wanted**, and a learner Elo is already implementing.

**Therefore: gap G1 below is a real owner fork, and it is the one this derivation most wants
asked.** *"Given D1151, may a measured habit card — a rate with a denominator and an interval — be
shown to the learner **in review**, given it is not progression and not a rating?"* The
recommendation is **yes, with D1151's own discipline applied**: the *what's-missing* mark lives on
the card, the number never becomes a tier, and no card is a gate.

---

## 7. Gaps — what an RFC author must decide

| # | Gap | Kind | Recommendation |
|---:|---|---|---|
| **G1** | **Does D1151's refusal of "the learner's own history" reach a measured habit card in review?** §6.2 | ⚖️ **owner fork — the sharpest in the lane** | Ask it as one sentence with §6.2's table attached. Recommend **yes for review, no for progression** |
| **G2** | **Per-lane drafting ruling** — style has none; D1093 enumerates three lanes and this is not one | ⚖️ owner | Ask alongside G1; it costs an afternoon. **Scope it to foundation-RFC A**, since B cannot ship on a ruling anyway |
| **G3** | **Which `decision_class` does a style card count?** `played` only, or `played` + `game` behind an explicit filter? | ⚖️ owner-facing, law-8-adjacent | Recommend **`played` only** for any "your play" sentence; `game` rows may power a separately-labelled *"in the games you imported"* card that never says "you" |
| **G4** | **The castling denominator fork** — add a game-level eligibility projection, or define a decision-level metric and **re-run R12's stability gate** | 🔧 technical, with a cost | Recommend the **game-level projection**: it preserves a measured floor of 50 rather than spending a new measurement campaign |
| **G5** | **Which RFC owns each of the 5 missing atoms?** They are collector-shaped but nobody has claimed them | 🔧 register | Foundation RFC A (§5.2). R21: *"No style prose lands in those RFCs"* |
| **G6** | **The clock join.** Metrics 7–9 need typed clocks; `recorded-clocks` Discharge D4 already hands *"time as a longitudinal observation"* to the store's next rev | ✅ **already answered — wire it** | Cite `rfc/recorded-clocks.md:359`. Do not re-derive |
| **G7** | **The opening reference artifact** — pinned, versioned, exact-position counts through ply 8 at N≥50; `runtime-opening-identity` is accepted but [[D1052]] blocks compilation on a mis-transcribed SHA | 🐞 blocked on a one-line fix | Land D1052's amendment; it unblocks metrics 1–2, the two best-measured habits in the lane |
| **G8** | **Reference population identity.** R12 selected by the decision player's **rating band**. R15 permits a rating to *select* a population but never to change what is said. A production card must expose the versioned reference id and stay descriptive | ⚠️ **trap** | The RFC must state that a fixed all-learner reference is **a different metric version** requiring re-measurement, not a substitution (`longitudinal-style-feedback-contract.md:60-66`) |
| **G9** | **Per-metric floors, never a global one.** Floors are 25/50/100/200 and *"a failing row abstains; it does not inherit another row's floor"* | ⚠️ trap | Encode as a per-card field; make a global confidence label unrepresentable |
| **G10** | **The tier rule is where a law-8 violation hides without any prose.** §4.4 | ⚠️ **trap, and the subtlest one** | Adopt `reference_quantile_lower_bound@1` verbatim; require the arithmetic to render alongside every label |
| **G11** | **"Too" and "not enough" need a shown baseline** — the owner's literal sentence is legal only in that form | ⚠️ trap / [[D844]] | Adopt §4.3's table as a normative appendix, and add the refused words to the renderer's vocabulary so `voiceCheck` catches them |
| **G12** | **Maps-to-the-greats.** The owner asked for it; it is refused on two measurements | ⚖️ owner-facing **refusal to carry**, not a fork | The honest form both dossiers name: **a labelled authored quiz that says it is a quiz**, byte-separate from measured play (`player-style-metrics.md:184`; `player-analysis-and-skills.md:257-260`) |
| **G13** | **The aggressive↔solid axis is not shippable; theoretical↔creative is.** The former's components include an **R12-refused** metric (forcing-choice); the latter is built on ρ 0.974/0.935 | 🔧 scope | Ship the theoretical↔creative half **as two separate cards, not as an axis**; a two-pole label is itself a composite needing its own validation |
| **G14** | **Privacy is load-bearing.** 35/36 re-identification makes the vector behavioral identifying data; it must clear the export/delete/share-by-consent audit **before** production | ⚠️ trap | Inherit the store's three pins (`rfc/longitudinal-store.md:440-459`) rather than restating them; add sharing consent as an acceptance criterion |
| **G15** | **The store is accepted but unimplemented and its acceptance is contested** (D973/D1011) | 🐞 blocking | The style RFC must **not** claim the store as a satisfied dependency. Name migration 26 as an explicit precondition |
| **G16** | **Anti-gaming.** [[D842]] rule 3, [[D345]] no exposure restatement, [[D603]]'s all-ones alarm, no same-root farming | ⚠️ trap | The store provides the join keys (`run_id`→`attempts.attempt_no/origin/root_transpose_key`, `root_key`); the RFC must actually use them (`rfc/longitudinal-store.md:229-234`) |
| **G17** | **The Chess960 castling classifier.** `chessops.castlingSide`, not a two-file heuristic — proven by a `b1`/`a1` fixture | 🔧 technical, cheap | Pin it in atom A's spec; it intersects [[D1031]] |
| **G18** | **No home in `design/03`.** §0 | ⚖️ law-5 | Propose the amendment via a BACKLOG row; never write `design/03` |
| **G19** | **What does the card do when it abstains?** Every card needs an abstention reason and a hidden-example count; an empty category is **not** filled from a weaker detector | 🔧 design | R20: *"no five-card dashboard is required merely because the taxonomy has five names"* (`:111-113`) |
| **G20** | **Does a style card ever *select* content?** R15 permits selection, never rendering. A "drill this habit" door is legal; a habit changing live assistance is not | ⚠️ trap | Enforce as **module-graph reachability** (the AC-11 shape), not as a principle |

---

## 8. Recommended scope cut for an honest v1

### 8.1 The cut

| Tier | Ships | Gated on | Honest? |
|---|---|---|---|
| **V1a — per-game observation cards in Review.** Deterministic cards over shipped evidence with their declinable denominators, including the [[D745]] negative reading. *"Carlsbad structure appeared in 2 of 3 recorded opportunities"* | **nothing that must accumulate.** Works on the learner's first game and on any imported game | the review lane's O7 ruling and its own RFC | **Yes.** Every operand ships today. **This is not a style card and must not be labelled one** |
| **V1b — foundation atoms (RFC A).** 5 projections + castling game-eligibility + the clock join | ordinary collector-RFC path; G5/G6/G7 | store implementation for persistence; not for the projections themselves | **Yes** — no learner-facing claim is made |
| **V1c — the store, implemented.** Migration 26 + derivation + rebuild instrument | D973/D1011 resolution | — | **Yes**, and it is retroactive over everything already recorded |
| **V2 — the two opening habit cards.** Surprisal + family entropy, the lane's strongest measured habits | G7 (D1052 fix), the opening reference artifact, V1c, **and 25/100 games of the learner's own play** | measurement arm | **Yes at 25/100 games; dishonest before.** Abstain, visibly |
| **V2+ — the remaining ten cards** | V1b + V1c + per-metric floors 50→200 | measurement | Yes, per row, as each clears |
| **V3 — the tip sentence** | all of the above + a **validated aggregation rule with a baseline**, then a sealed one-card paraphrase | R13 grounded-coaching contract | The shape is legal; the rule does not exist |
| **Never (on present evidence)** | archetypes, GM twins, aggressive/solid as a label, one global confidence, absence-as-preference, the four failed metrics, LLM-written weaknesses or advice | — | Refused on measurement, not on taste. **G12's quiz is the honest substitute** |

**The single most important sentence in this section:** *V1a ships today and is not a style
feature.* Everything a learner can see about their own play before they have played 25 games is a
**per-game fact**, and calling it a habit is the whole failure mode this lane exists to avoid.

### 8.2 Wiring vs building

The review derivation found roughly two-thirds of its lane was wiring. **This lane inverts that:
by count it is about half wiring, but by *calendar* it is dominated by something that is neither —
waiting for data.**

| Item | Wiring | Building | Waiting | Note |
|---|---|---|---|---|
| Legal-alternative denominators | ✅ ships | | | `semantic-evidence.ts:968` |
| Avoidance / D745 negative reading operands | ✅ ships | | | `evidence-catalog.ts:298` — the ruled sentence's arithmetic exists |
| 67 semantic-event projections | ✅ ships | | | executed at HEAD |
| Phase bands | ✅ ships | | | `phase.ts:63` |
| Game import (PGN + Lichess) | ✅ ships | | | `breadth-reality-check.md:143-144` |
| `voiceCheck` law-8 enforcement | ✅ ships | | | `voice.ts:110-119` |
| Card grammar, invariants, presentation contract | ✅ **written and executable** | | | `tools/r21-style-feedback-contract/` |
| The 5 missing atoms | ⬤ **reference implementations exist in `tools/d1062-style-bot-harness/style-atoms.test.ts`** | ▲ production registration | | **the strongest wiring finding in the lane** — a disposable harness already implements all five exactly, incl. the Chess960-correct castling classifier |
| Castling game-eligibility projection | | ▲ build | | genuinely new (G4) |
| Typed clocks → spend share | ⬤ `recorded-clocks` drafted; Discharge D4 written | ▲ the store rev | | the RFC exists and is licensed |
| Opening reference artifact + runtime identity | ⬤ `runtime-opening-identity` accepted | ▲ blocked by a one-line SHA fix | | G7 |
| `learner_observations` / `learner_structure_stats` | | ▲▲ **build — zero lines exist** | | schema fully specified; D973/D1011 first |
| Store→card read path | | ▲ build | | small once the store exists |
| **The twelve floors (25→200 games)** | | | ⏳⏳ **wait** | no shortcut |
| **≥8-week early/late split** | | | ⏳⏳ **wait** | R12 §8's residual arm |
| **blitz↔rapid transfer** | | | ⏳ wait | needs rapid play |
| Any learner-facing pixel | | ▲ build | | **zero today** |

**Rough shape: ~45% wiring, ~35% building, ~20% of the *items* — but effectively 100% of the
*schedule* for V2+ — waiting.** The productive consequence: **V1a and V1b can be built now and lose
nothing**, because the store is a projection of the event log and back-derives every game already
recorded (`rfc/longitudinal-store.md:266-270`). The waiting clock starts when the learner starts
playing, not when the code lands — which is an argument for landing the atoms **early**, not late.

---

## 9. What this derivation does not do

- It does **not** authorize an RFC. §0 stands: this lane has no per-lane ruling and an explicit
  research gate ([[D1055]]).
- It writes no `design/` document, edits no ledger row, and appends no log entry — all four are
  held by other agents or reserved to the owner (law 5).
- It re-measures nothing. Every number is quoted from its source dossier at the line cited, except
  the projection count (67, executed) and the `learner_observations` absence (grepped), both of
  which were **verified against the code and disagreed with a document** in one case each.
- It takes no position on [[D551]]'s bot half beyond the shared-vocabulary seam; that lane is held.
- **Limit worth stating:** the working tree was dirty throughout (24 modified, 8 untracked). The
  projection count reads a modified `evidence-catalog.ts`. Nothing else in this document depends on
  an uncommitted file.
