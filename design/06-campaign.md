# 06 — Campaign

Written by claude 2026-08-15 on the owner's rulings of that day, per the RFC-0000
agent rule. Its gate is `planning/campaign-research-queue.md`: *"When R1–R5 land,
the cluster earns one design doc — not six ledger rows reassembled from memory."*
R1–R5 and R9 are answered; this is that doc. The assembled evidence and every
file:line citation live in `planning/campaign-synthesis.md`.

**Nothing here is an RFC.** This is intent. Implementation waits on the exploration
gate like everything else.

## 0. What the campaign is

A roguelike frame over the rehearsal loop: you walk a map, meet encounters, and
carry an inventory of **assistance you unlocked by playing**. The owner's own
statement of the win condition is the design's centre —

> *"what if you have built the right combination of theory/classification/hints
> which basically allows a noob to play against an IM/GM boss, and still win
> because it has the right help? You basically build your coach."*

The thing being tested is **the quality of the coach you assembled**, not raw
playing strength. That is what makes it a deck-builder rather than a difficulty
slider, and it is why the campaign can exist without the product ever grading a
learner's chess.

## 1. The architecture, and how much of it already exists

Six parts, one system: **map** · **encounters** · **inventory** · **constraints**
· **resources** · **bosses**.

The synthesis found that three of the six already have their load-bearing half in
shipped code, which changes this from a build into an assembly:

- **The two-axis split the whole design rests on is already implemented.**
  `permittedAssistance` computes what *may honestly be shown* from context;
  `AssistanceConfig` v4 carries nine named axes of what is *switched on*. Honesty
  policy and inventory are already separate artefacts.
  **But the deck is NOT those nine axes** — corrected 2026-08-15 by `design/research/campaign-effect-vocabulary.md`, against
  this doc's original claim. **All nine are monotone**, so the lattice has one
  maximal element and the number of distinct builds over them is **1**. Nine
  monotone toggles are a settings panel: a deck requires **opportunity cost**, and
  monotone axes have none. The deck is instead a **per-lens loadout with a slot
  budget** over the **34 attested lenses** (15 of 18 structural features, 3 of 6
  transition primitives, 16 of 25 shape entries) — which yields **278,256** distinct
  five-slot builds at **zero authoring cost**.
- **A difficulty-availability axis exists at the BRANCH level** as `branchDecidedness`
  (`decided` / `undecided` / `unknown`) — but it is not yet the axis §2a specifies, and
  the difference matters. Only `decided` carries a **ground**; the other two carry a
  `reason`. And `DecidednessGround` has exactly three kinds — terminal outcome,
  objective terminal, tablebase — with **no human-outcome ground**, which is the very
  thing R9 established as the openings' oracle. So the campaign axis is a **promotion**
  of the branch-level one to campaign scale, plus a fourth ground that does not exist
  yet. *(Corrected 2026-08-15 by the reconciliation gate: this doc originally claimed
  the axis "exists… each with a named ground", dropping both qualifiers that
  `planning/campaign-synthesis.md` had stated correctly. Design-tier overstatement,
  claude's.)*
- **The encounter unlock's DETECTOR exists** as `shapeRecommendations` — rung-0
  arithmetic over a shipped endpoint, provenance sentence included. Nothing *gates* on
  it; unlocking is the part still to build.

What does **not** exist: any server-held notion of an earned inventory
(`AssistanceConfig` lives in browser localStorage keyed by session kind, so it
cannot hold something earned), any rewind budget or refusal path, and any time
control at all (`clockState` is an untyped passthrough nothing reads, and
`clock_zeroed` is the *halfmove* clock — a fifty-move-rule counter, not a clock).

## 2. The three collisions

These are the doc's most useful content. Each is an owner idea meeting a
measurement, and in each case the measurement wins and makes the idea sharper.

### 2a. Difficulty is not a quantity outside the endgame

The roguelike wants a curve. R4 and R9 jointly refuse one: engines agree with the
tablebase perfectly *inside* it (κ = 1.000) and say almost nothing outside — only
**10.2%** of out-of-range positions are decided, median |eval| **43 cp**, and
**more search depth makes it worse** (5.8% at depth 16). Human outcome data
discriminates where engines cannot but **dies at ply ~20**, and 23× more games
buys two plies.

So measured difficulty exists on **two islands that do not touch**: decided
endgames, and roughly the first ten moves. The middlegame between them has **no
oracle of either kind**.

**Consequence, and it is a feature once stated out loud:** a map node carries a
*difficulty availability* label, not a difficulty number — measured-by-outcome
(openings), measured-by-tablebase (decided endgames), **authored** (the
middlegame), or none. The ramp has a documented hole, and the product says so
rather than inventing a number across it.

**The run architecture (owner ruling 2026-08-22, D893 — quoted, written by claude).**
The owner set the frame in his own words: *"in Slay the Spire you choose paths… this can be
one of the choices… or a variant campaign — we DEF want a pure chess campaign (where
basically abilities or evidence consumers are unlocked???). And the nodes you visit to unlock
shit can be puzzles, find best move, find blunder, play out the position and survive for x
turns, the solitaire — ANYTHING we can find that's fun or teaching something… building an
army sounds like a dope extension — not only would that unlock more difficult bosses but it
can be a nice 'prestige' reward. Just like how in Slay the Spire the hero you choose affects
the ENTIRE run and what you can even collect."* Three structural consequences, recorded as
intent:

1. **Node variety is the format catalogue.** Any format the variants catalogue grounds may be
   a node type; a node declares its encounter class from the table below.
2. **The PURE-CHESS campaign is definite**, and its progression currency is **evidence
   consumers**: modules/abilities unlock as the run advances — the "build your coach" idea
   made the campaign's core loop, constrained by [[D297]]'s knowledge-as-key device and
   `design/05`'s honesty policy (an unlocked ability is a grounded module, never a truth
   change).
3. **Army-building is a campaign VARIANT in the character-select sense** — a chosen start
   that shapes the entire run and its collectible pool (the Slay-the-Spire hero analogy),
   and additionally a **prestige axis**: completing it unlocks harder bosses. It is an
   extension beside the pure campaign, not the spine ([[D885]] adjusted accordingly).

Composition stays last per [[D717]]'s program order; R6/R7/R8 still gate the experiential
choices. This block records the owner's architecture so later RFCs argue from it rather than
rediscover it.

**Amended 2026-08-16 (D439, owner ruling; written 2026-08-22 by claude on that
ruling): all four labels describe a POSITION; a boss result describes an
ENCOUNTER, and it lives on a second axis, not a fifth label.**
Measured-by-outcome, measured-by-tablebase, authored, and none are all answers
to *"how measurable is this position's difficulty?"*. A rated boss (§2b as
amended, §5) plays to `terminalOutcome` and produces a **result** — a property
of the encounter, not of any position inside it — so it does not fit on that
scale at all. The ruling's encoding (`rfc/learner-rating.md` §5.3a, consequence
2) already says how it relates: the rated axis *"runs orthogonally to the
decidability axis rather than alongside it"* — which is a second axis. Every
node keeps its difficulty-availability label, and independently either carries
a result (only the Act II rated boss can — see §5's act-ladder amendment) or
does not. *The ruling named the fork "a fifth label or a second axis" without
choosing; the second-axis reading here is derived by claude from the ruling's
own orthogonality sentence and is the owner's to veto — a fifth label would put
"has a result" on the same scale as "how measurable is difficulty", which that
sentence refuses.*

### 2b. There is no IM/GM opponent, and the re-cut is better than the request

Maia's usable band is **`[1000, 2400]`** — measured by R10 and ruled by the owner
2026-08-15, superseding the ≈1100–1900 figure this doc first carried from model
knowledge. Above them only `strong_engine` exists, which is not
a strong human but a different species; weakened Stockfish is rejected doctrine
(`AGENTS.md`). So a literal "GM boss" is unavailable.

What is available is **a boss per phase, each honest about its own instrument**:
an opening boss playing `theory_strict` — deterministic, and the *only* boss
whose difficulty is human-outcome measured; an endgame boss playing
`perfect_tablebase` — literally unbeatable, shipped, already used by two packs;
and a middlegame boss as `human_common` at a band **plus an authored plan**,
because that is the phase where difficulty must be authored anyway.

This is stronger than the request. "Beat a GM" is a strength claim; "beat the
Advance Caro-Kann's actual plan, with the right counter-theory unlocked" is the
product's own claim. Caveat carried from R5: only three of the **five** shipped opponent modes are
reproducible at all, and `practical_resistance` is scoped to decided positions.

**Amended 2026-08-16 (D439, owner ruling; written 2026-08-22 by claude on that
ruling): a campaign boss is a full game, not a pack — and exactly ONE of the
three bosses can be that game with a rated result: the middlegame boss.** The
ruling's encoding is `rfc/learner-rating.md` §5.3a: a rated boss is a
`position` session played to a rules-terminal result against a calibrated rung
— the object `POST /rated-games` already creates, the same rated-game object
the cohort-standing rulings (D437/D438) read — with the campaign supplying the
start FEN, the side and the band. Per boss:

- **Middlegame boss (Act II) — CAN.** `human_common` has the calibrated band R1
  requires, and the material precondition is measured, not hoped: `plan` mode —
  the corpus analogue of this boss's *"band plus an authored plan"* shape — is
  **14 for 14 at ≥21 pieces**, so R5's material floor costs the ruling nothing
  where it applies. (The prose-to-`plan`-mode mapping is an inference, not a
  schema fact; the precondition is checked per encounter from the start FEN.)
- **Opening boss — CANNOT, refused twice.** R1: `theory_strict` has no
  calibrated band. Structurally: `THEORY_NEEDS_AUTHORED_BOUNDARY` +
  `BOUNDARY_NEEDS_PLY_HORIZON` (`apps/server/src/pack-validation.ts`) make a
  `follow_theory` objective **incapable** of running to a rules-terminal result
  — the validator requires it to declare a finite horizon.
- **Endgame boss — CANNOT, refused twice.** R1: no calibrated band. R5 on
  material, and the refusal is exact: `PERFECT_TABLEBASE_OUT_OF_RANGE` requires
  a root with **at most seven pieces**, against R5's rating floor of 21. It
  still plays to mate — a result exists on the board — but no rating can
  receive it. The consequence for the act ladder is owned in §5.

### 2c. The rewind budget prices the thesis's own selling point

`00-thesis.md` names *"experimentation without cost"* as one of two answers to
why anyone would use this at all. A rewind budget sells that back.

The resolution is to notice the owner's single idea is **three separable ones**:
*where* you may rewind, *how often*, and *play it out before you rewind*. The
first collides with nothing. The third is **already the rule** — the loop is
commit → play the consequence → *then* rewind. Only **how often** is a real
conflict with the thesis, and `05` §1 already provides the venue for amending an
invariant deliberately rather than by accident.

**And the tension mostly dissolves once the deck is a loadout rather than a retry
budget** (`design/research/campaign-effect-vocabulary.md`). Every proposal so far assumed opportunity cost had to be
*invented* as scarcity — which is what prices "experimentation without cost". It
does not, because the cost has **already been measured**: the all-on state is the
**unreadable** one, not the best one (median 58 observations per position, 13 of
them unconditional, the compare strip at 8.31 entries/ply and 1.01× lift). A slot
budget is therefore **the product refusing to print noise**, not withholding a
reward — no invariant is touched and nothing is sold back.

**Amended 2026-08-16 (D439, conditional clause; written 2026-08-22 by claude):
the rated boss reopens exactly one corner of this — see the OPEN QUESTION at
the end of §5.** §5's submitted-branch ruling keeps rewind free inside an
encounter; R11 (`rfc/learner-rating.md`) voids any rated game containing a
rewind. For the one encounter that is a rated game, both cannot hold. The
ruling made writing this into the doc conditional on `learner-rating` open
question 11, which still stands open as of 2026-08-22 — so it lands here as the
open question it is, not as an answer.

**RULED 2026-08-22 ([[D945]], written by claude on the ruling; the owner's
verbatim answer to question 11): "you have to earn rewinds or proactive
branching... not infinite, not forbidden. it's what allows a weaker player to
actually win a campaign (on lower floors/acts/whatever)."** This is a third
shape neither document had: **inside campaign encounters, rewind and proactive
branching are an earned economy** — charges earned through play, spendable in
any encounter *including the boss*, with counts scaling by floor/act
difficulty so that lower floors are more forgiving. Three consequences, scoped
precisely:

- **The economy is campaign-scoped.** Outside the campaign — drill packs, Just
  Play, Review — rewind stays exactly as free as `00-thesis.md` promises;
  nothing here amends `05` §1 for non-campaign surfaces. Inside the campaign,
  the earned economy *is* the "how often" answer §2c above said was the only
  real conflict, and it answers it by scarcity-with-income rather than a flat
  budget — which is also §2c's slot-budget logic wearing a different resource.
- **The boss is no longer the collision it was.** The rated boss admits
  rewinds — *earned* ones. The default R11 reading (claude's, the owner's to
  veto, recorded in [[D945]]): spending an earned rewind can still **win** the
  encounter — that is the ruling's entire point — while the attempt's
  *ratedness* follows R11 unchanged. Rated when clean; winnable regardless.
  The two verdict producers §5 already separates make this expressible without
  a new rule: the encounter verdict reads the earned-economy state, the rating
  predicate keeps R11.
- **Earned state is server-held progression state**, like every other campaign
  holding (§4's "a doc cannot hold something earned") — it is not an
  assistance preference and never lives in the client-side config.

## 3. Standing laws for the campaign

1. **Honesty policy and inventory are independent.** Deck-building operates on
   *availability*. It may never change what may honestly be shown, or when
   (`05` §3/§3a). Two gates: honesty outer, inventory inner.
2. **ADR-0007 holds by construction** — progression is unlocked by playing, never
   purchased. The satirical ceremony parodies the ritual; it may not become one.
3. **An unlocked hint is a grounded primitive the learner earned**, never an LLM
   opinion they bought (law 8, ADR-0005).
4. **Authored contexts declare; unauthored contexts default** — the owner's
   `outpaced` ruling, general to the campaign.
5. **Rarity is not value.** ρ = −0.143: how often a hint fires does not predict
   whether it helps. Any hint economy that prices by scarcity is pricing noise.
   This holds however the loop feels.
6. **Anything the campaign surfaces unasked obeys the live-surface admission
   rule** (`live-marker-quality` L1–L6), including *failing a measurement demotes,
   lacking one does not*.

**The material/board balance law (owner ruling 2026-08-22, D887 — with the owner's
looser rewards clause).** The campaign may bend **material and position** freely: a
reduced-material start on the standard board is a legal chess position, every instrument
works unchanged — the tablebase turns *on* at ≤7 units — and the Steps-Method tradition
validates the pedagogy. Bending the **board geometry or the piece set** exits the evidence
plane (no Maia, no explorer, no tablebase, wrong movement model in the collectors), so an
evidence-dark node is marked **play, never training**, and it may **seal no verdict, credit
no skill, and gate no content** — but it **may pay out cosmetic rewards** (piece skins,
board themes): the owner's chosen looser clause, so fun nodes stay worth visiting without
blurring what counts as learning. The owner's own sentence is the law's spirit: *"we don't
need to forget we're learning chess here."*

**RULED 2026-08-23 ([[D1042]], written by claude on the ruling; owner-vetoable) — the balance
law is SURFACE-SCOPED, not variant-scoped.** The owner's verbatim answer, when asked where the
line between an interesting variant and no-longer-learning-chess falls: *"again like for drill
packs these are kinda useless right... but for normal play it should be an option if people want
to do that... heck we can even do analysis on played/imported wierd games???? and again for
campaign mode, like unlocking a new hero in slay the spire changes the entire run structure, we
can have these kind of weird campaign variations and more... we can go full game/fun with the
campaign... as crazy as we want to... as long as the 'educational' run is the main one."*

**The question was asked wrongly and the ruling corrects it.** Every prior framing — including
the D887 clause immediately above — asked *which variants are permitted*. The owner answered
*per surface*: the same variant is refused in one place and welcome in another, so permission is
a property of **where it appears**, not of the variant. A per-variant law needs re-ruling for
every variant nobody has thought of yet; this one does not.

| Surface | Variants | Why |
|---|---|---|
| **Drill packs** | **Standard chess only** | *"for drill packs these are kinda useless"* — a drill exists to say something grounded about a position, and outside standard chess the evidence stack has nothing true to say |
| **Just Play** | **Any variant, as an option** | *"for normal play it should be an option if people want to do that"* — play is not training; nothing is claimed, so nothing can be claimed falsely |
| **Import / analysis** | **Accepted** | *"we can even do analysis on played/imported wierd games"* — a game that was actually played is a record, and refusing to look at it teaches nobody anything |
| **Campaign** | **As far as we like** | *"we can go full game/fun with the campaign... as crazy as we want to"* |

**A variant campaign is a NEW-HERO unlock, not a rule tweak.** The owner's analogy is precise and
load-bearing: *"like unlocking a new hero in slay the spire changes the entire run structure."* A
Slay-the-Spire character is not a modifier applied to the same run — it changes the deck, the
mechanics and what the run is *about*. So a variant campaign is a **different campaign**, not a
setting on the standard one; §5's act ladder, the economy and the unlock pool are all free to
differ. This is the shape army-building already had at §1's clause 3 (*"a campaign VARIANT in
the character-select sense"*), now generalized to every variant.

**The single constraint, and it is the whole safeguard: the educational standard-chess run
remains the MAIN one.** Variant campaigns are alternates reached from it, never the default and
never the thing a new learner meets first. The §3 laws above are unchanged and still bind
inside every campaign — an evidence-dark node still seals no verdict, credits no skill and gates
no content, whichever campaign it sits in. What the ruling widens is *how far a campaign may
travel*; what it does not widen is *what may be claimed while travelling*.

## 4. What is not decided here

R6, R7 and R8 remain unanswered and are experiential: whether a rewind budget
destroys punishment-free experimentation, what it feels like to lack a rung you
need, and whether the loop rewards wrapping at all.

They gate **building**, not **writing** — every collision above is between an
idea that already exists and a measurement that already landed. Specifically: R6
gates the retry budget but not rewind-*location* limits or the play-out rule; R7
gates scarcity tuning and the synergy payoff but not the slot vocabulary or the
two-gate architecture; R8 gates the whole build.

**Amended 2026-08-22 (D649 owner ruling 2026-08-21; R6/R7 as narrowed in
`planning/campaign-research-queue.md`; written by claude on those rulings).**
Three updates to *how* these questions get answered, none to what they are:

- **No participant studies (D649).** External participant studies are descoped
  as a permanent posture, not a gap — this is a personal project, validated by
  the owner's own use. Any campaign-validation language in or downstream of
  this doc means **owner play**, and the instrument already exists: the
  preregistered owner pilot at
  `planning/platform-alignment/campaign/participant-plan.md` (campaign R6–R8,
  platform R14/O10). A single owner run can settle an owner product ruling and
  expose failure; it cannot establish population learning or preference, and
  nothing here claims it can.
- **R6 is NARROWED to the count budget.** Rewind location and *play the
  consequence before you rewind* are settled (§2c); the residual question is
  whether a **count** budget on retries preserves or destroys punishment-free
  experimentation. The pilot tests only that residue.
- **R7 is NARROWED to preset-withheld modules.** D619/R3 settle the
  architecture (presets cannot raise a ceiling; Theory-only and empty states
  are first-class; rarity cannot price value — law 5 of §3). The residual
  question is experiential: when the encounter ceiling withholds a module the
  learner wants, is the absence **legible and interesting or merely
  frustrating**? The pilot tests scarcity tuning and payoff, not whether the
  split exists.

One ordering constraint this doc inherits from the evidence-foundation program
(D717, owner ruling 2026-08-22): **campaign composition comes last**, after
modules, presets and bots — this doc's build order sits behind that program,
and nothing in this amendment pass promotes campaign scope beyond the posture
above.

One dependency this doc inherits: `design/research/mobile-scope.md` names the
campaign as one of the few things that would reopen its own verdict. A phone-first
map is a different map, so the mobile ruling may want to come **before** the map
is designed rather than after.

## 5. Run shape, and what actually escalates

Added 2026-08-15 from `design/research/roguelike-run-design.md`, which studied real roguelikes rather than gamified
education, on the owner's instruction.

**What escalates here is LEGIBILITY, not power.** That is the honest reframe and it
governs everything below. A lens changes what you can *see*; a position does not
care what you know. The power curve is flat **by construction**, and every device
that would make it compound is on the refused list (escalating numeric economies are
law-8 violations; a pursuit clock is a retry price by another name). It is a smaller
promise than Slay the Spire's — and one this product can keep.

**RULED 2026-08-23 ([[D1151]] answering the long-open [[D305]]; written by claude
on the ruling, owner-vetoable): with the power curve flat, progression is
denominated in THE CATALOGUE — a collection.** The owner chose it over two live
alternatives: **shapes met, structures played, with the *what's-missing* mark
living on the pack card rather than on a progress screen.** It is the most
chess-shaped of the three and it turns `design/04`'s breadth into the reward
itself — the run advances by *what you have now seen*, not by a number that
grows.

- **What this refuses, and why the refusal is the point.** The rejected
  alternative was the learner's own history (D302's three-axis histogram). It
  was the only option that gives a flat-power product a progression the learner
  can *feel*, and it was refused because it would have introduced **the first
  number this product has ever shown a learner about themselves** — with two
  measured warnings that numbers outrun their basis standing against it. The
  floor beneath the catalogue remains cadence-and-completion: a daily position
  and per-unit mastery marks over a named vocabulary, no number about the
  learner anywhere.
- **This does not displace §2a.2's currency; the two answer different
  questions.** [[D893]] settled what you *gain* — evidence consumers, modules
  unlocking as the run advances. This settles what progress is *measured in*.
  You earn abilities by playing and you see your advance as a collection; a
  future reader should not read the two as rivals.
- **The known cost, accepted at the ruling: our collection vocabulary is not yet
  a collection** ([[D300]]). 132 of 156 authored `concepts` are singletons, and
  the default resolver keys them `pack:${packId}#${raw}`, so the same string in
  six packs is six keys — today the honest collection is the 25-entry shape
  library. **Whichever RFC implements this owes that vocabulary first.** That is
  a prerequisite, not a footnote: a collection screen over a namespaced-apart
  vocabulary would display 156 things nobody can complete.

**Consequence for the model we copy:** because marginal value goes *negative* past
the measured noise floor (D78: median 58 observations per position, compare strip
8.31 entries/ply at 1.01× lift), the optimisation is **the smallest sufficient set,
not the strongest set**. That is **Into the Breach's** shape, not Spire's. Take ITB
as the structural model, **Balatro as the boss model**, and Spire only for the map
and the draft.

**The run: 9 nodes, three acts of three, ~35–55 minutes.** Argued from three
converging numbers rather than taste — 9 nodes consume 24.3% of the catalogue
(**4.1 runs before repetition**, against 2.5 at fifteen); the middlegame bill is
**2.2 agent-hours** rather than 9.75; and a Spire node is a 60–90 s combat, so node
parity would overshoot minute parity roughly fourfold.

**Acts are the difficulty-availability tiers of §2a, so stakes escalate in
DECIDABILITY:** Act I outcome-measured (`theory_strict`), Act II authored
(`human_common` plus an authored plan), Act III tablebase-measured
(`perfect_tablebase` — literally unbeatable, already shipped, and a stronger climax
than anything in the comparison set). Authored encounters are bounded by the
**shipped** `plyHorizon`: **50 of 56 draft packs declare one, median 11 ply, 30
of them voluntarily** — where *voluntarily* means no `follow_theory` objective
compels it via `THEORY_NEEDS_AUTHORED_BOUNDARY` + `BOUNDARY_NEEDS_PLY_HORIZON`
(20 are so compelled). *(Corrected 2026-08-22 per D439: the original "36 of 37,
median 12, 17 voluntarily" was already stale at ruling time. Re-derived at HEAD
`7d15685` over the 56 pack files in `content/drafts/` — sidecar
`.evidence/.job/.sources` files excluded — landing on the same figures §5.3a
measured `[V]`. D440 caveat: 26 of the 56 also declare `resolveAt: "terminal"`
and 25 of those declare a `plyHorizon` too, 20 at 7–13 ply; nothing lints the
pair, so this corpus's terminality claims are unreliable until D440's lint
lands — a pack that "resolves at terminal" and stops at ply 11 resolves at
whatever ply 11 holds.)*

**Amended 2026-08-16 (D439, owner ruling; written 2026-08-22 by claude on that
ruling): one encounter class is NOT bounded by `plyHorizon`, and the map now
has TWO verdict producers.** A campaign boss is a full game, not a pack —
encoded in `rfc/learner-rating.md` §5.3a as a `position` session played to a
rules-terminal result against a calibrated rung (the object `POST /rated-games`
creates; the same rated-game object the D437 cohort standing reads), with the
campaign supplying the start FEN, the side and the band. The encounter
vocabulary is therefore two rows:

| Encounter class | Object | Bounded by | Sealed by |
|---|---|---|---|
| **Authored encounter** (every non-boss node, and the Act I and Act III bosses) | pack | `plyHorizon` | an `ObjectiveState` from `successConditions`, stored as `sealedState` |
| **Boss game** (the Act II rated boss only) | `position` session | the rules of chess | `terminalOutcome` |
| **Prediction encounter** (solitaire-chess nodes — owner ruling 2026-08-22, D869) | a fixed recorded game | the game's own length | a **prediction-score threshold** over `prediction.recorded` events against the human distribution |
| **Survival encounter** (the streak family: resistance plies, rush counts, open-ended avoid-the-blunder — proposed 2026-08-22 as [[D886]]; **RULED 2026-08-23, [[D1152]]**) | an unbounded run | nothing but failure | a **score threshold over an unbounded run** (plies survived / correct count / avoidance streak, each with its declared grounded counter) |

*(Amended 2026-08-22 on the owner's D869/D886 rulings, written by claude. The 30-format
catalogue in `design/research/training-mode-variants.md` seals every surveyed format under
these four shapes; no format required a fifth, and that closure is the argument the table is
complete for the formats we know.)*

**RULED 2026-08-23 ([[D1152]] answering [[D886]]; written by claude on the
ruling, owner-vetoable) — and this paragraph also corrects the row above, which
was written ahead of its own ruling.** The owner ruled **add the producer**:
verdict shape 4 is a **score threshold over an unbounded run**. Three things it
settles:

- **What it unblocks.** Until now every survival format had to ship
  authored-bounded — a declared `plyHorizon` and the existing authored-verdict
  machinery — which turned *"survive as long as you can"* into *"survive exactly
  N"*. Those are different games, and only the second was expressible.
- **What seals such an encounter, in the vocabulary this table already uses.**
  Nothing but **failure** bounds the run, so the seal is the run's own
  termination — the threshold is evaluated against the **declared grounded
  counter** for that format (plies survived, correct count, avoidance streak),
  and the verdict object is the encounter verdict the other three rows produce,
  not a parallel one. As with the boss game, a survival node may carry authored
  briefing copy and may **not** carry an authored *verdict*, because it has a
  real one; and as §5 already says, which producer seals a node is a property of
  the node — the four are not interchangeable and none is computed from another.
- **It CLOSES the vocabulary rather than opening it.** The 30-row format
  catalogue needed exactly this one producer and **no fifth**; the table above is
  complete for every format we have surveyed.

*(Attribution correction, same pass: the survival row was added to this table on
2026-08-22 citing D886 as an owner ruling. It was not one — [[D886]] read
*"owner's to rule; until ruled, all survival formats ship authored-bounded"* and
stood `💡 open` until today. The row is now true; it was written one day early,
and the row's citation is corrected above rather than quietly left standing.)*

**Which producer seals a node is a property of the node**; the producers are
not interchangeable and neither is computed from the other — §1 of
`learner-rating` drawn across the campaign, not only across the rating. A boss
game may still carry authored copy (a briefing before the first ply), because
briefing copy reaches no update; it may not carry an authored *verdict*,
because it has a real one. The reason the boss is a game rather than a
horizon-free pack is structural, not stylistic: `objective` and `checkpoints`
are in the pack schema's top-level `required` list, so a pack cannot exist
without an authored objective — the first row of R2's refused-inputs list —
and encoding the boss as a game makes the refused input **absent rather than
ignored**.

**Amended 2026-08-16 (D439, owner ruling; written 2026-08-22 by claude on that
ruling): the acts no longer differ only in decidability — they differ in
whether a RATED RESULT exists at all, and the rated boss exists in ACT II
ONLY.** Act I is refused twice: R1 (`theory_strict` has no calibrated band),
and structurally — the `THEORY_NEEDS_AUTHORED_BOUNDARY` +
`BOUNDARY_NEEDS_PLY_HORIZON` lint pair makes a `follow_theory` objective
incapable of a rules-terminal result. Act III is refused twice: R1, and R5's
material floor of 21 pieces against `PERFECT_TABLEBASE_OUT_OF_RANGE`'s
seven-piece ceiling. **So the campaign's climax act is the one act that cannot
carry a rated result — the climax cannot produce the outcome the campaign
rates.** This doc owns that tension rather than hiding it: the ladder the acts
climb is decidability, and the rated axis runs **orthogonally** to it (§2a as
amended) — Act III's climax is *unbeatable perfection*, a stronger close than
a result, but it is not a result, and no rating event happens there. Where the
rated boss does apply, material costs nothing: `plan` mode is 14 for 14 at ≥21
pieces (§2b as amended).

**The mechanism nobody had proposed, and the best one: a capability-suppressing
boss** (Balatro's boss blind). It is law-8-legal *by construction* — it speaks about
the learner's information, never about chess — and it is **what makes the monotone
assistance lattice non-monotone**. It solves §1's one-build problem from the
opposite side to the loadout: the loadout gives you choices, the suppressor gives
those choices consequences.

**SETTLED 2026-08-15 (owner ruling), and the premise was half wrong.** The text
below originally read *"a run that cannot be lost is a playlist… no resource
refusal exists anywhere in the runtime, and no loadout mechanism creates one."*
The first clause of that is true and the second conflates two different things —
`design/research/campaign-intermediate-consequence.md` found the conflation and it
is why every earlier proposal reached for invented scarcity and collided with the
thesis. **No *resource refusal* exists: true. No *failure state* exists: false.**

**The failure state already ships, one scope level down, and no campaign document
had cited it.** `ObjectiveState` has six values and only three are absorbing
(`trajectory.ts:6`), so the runtime already separates *this node went badly and play
continues* from *this node ended things*. `degraded` is **one-way by validator rule**
(`OBJECTIVE_DEGRADED_IS_ONE_WAY`, `pack-validation.ts:469`), produced by **authored
deviations** rather than by any grader — 76 of 275 carry `offObjective` — and it is
**sealed across node boundaries**: a trajectory leg transition resets the objective to
`active` only from `preserved`/`degraded`, storing the outgoing verdict as `sealedState`
(`pack-orchestrator.ts:556-575`, `trajectory.ts:83-92`). Sharper still, **the
intermediate/boss split is a lint rule**: `THEORY_ABSORBING_UNSUPPORTED` means **17 of 37
packs literally cannot end a run**, and all three canonical trajectory packs are exactly
three legs with only the last absorbing — §5's *"2 encounters + 1 act boss"* is the shape
three authors independently wrote without coordinating.

**So the campaign needs a scope, not a mechanism, and the ruling supplies it: a node
remembers the branch you SUBMIT.** Rewind stays free inside an encounter; **declaring
done** is what counts, and the submitted attempt decides both the node's sealed verdict
and the run. This prices *committing*, never *retrying*, so `00-thesis.md`'s
*"experimentation without cost"* is untouched — and **one ruling closes both holes**,
because §5's boss node needed exactly the same verb. `reveal` is close enough to extend
rather than invent.

Two consequences follow and are scheduled rather than open. **Every seal is
path-scoped** (`types.ts:102`), so rewinding to a clean line erases it — that is the
thesis working, not a bug, and it is precisely why the *submitted* branch rather than the
*standing* branch is the thing remembered. And **"did this run succeed" is computed
nowhere**: `attempts` is per *branch*, so a **run-level roll-up** is the precondition for
everything else here — the smallest new part, and the first one to build. **No budget,
counter, currency, refusal class or clock is required by any of this.**

**OPEN QUESTION — the rated boss collides with the submitted-branch ruling
above, and this doc records the collision without resolving it.** *(Added
2026-08-22 by claude under D439's conditional clause: the ruling ordered this
written iff `rfc/learner-rating.md` open question 11 resolved toward R11; as of
2026-08-22 question 11 still stands open, so the tension lands as an open
question, per the ruling's own iff-clause.)* The ruling above says *rewind
stays free inside an encounter; declaring done is what counts*. R11 says a
rated game containing a rewind is void. For the Act II rated boss — the one
encounter that **is** a rated game — both cannot hold: either the boss is the
one encounter class where rewind is closed, or a rated boss is unrateable in
practice, because the first rewind voids it. `learner-rating` §5.3a
(consequence 4) explicitly does not decide this — `06` is intent tier and the
ruling is the owner's. Until the owner rules: the submitted-branch text above
governs **authored encounters**, and is **undefined for the boss-game class**.

**RESOLVED 2026-08-22 ([[D945]]): the owner ruled a third shape — earned
rewinds.** The full ruling, its scope, and the default R11 reading live in
§2c's ruled paragraph above; the boss-game class is no longer undefined — it
admits *earned* rewinds, wins stand, ratedness follows R11 unchanged (rated
when clean, winnable regardless; the R11 half is claude's default reading and
the owner's to veto). The paragraph above is retained as the record of the
collision as it stood before the ruling.

