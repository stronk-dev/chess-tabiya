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

## 4. What is not decided here

R6, R7 and R8 remain unanswered and are experiential: whether a rewind budget
destroys punishment-free experimentation, what it feels like to lack a rung you
need, and whether the loop rewards wrapping at all.

They gate **building**, not **writing** — every collision above is between an
idea that already exists and a measurement that already landed. Specifically: R6
gates the retry budget but not rewind-*location* limits or the play-out rule; R7
gates scarcity tuning and the synergy payoff but not the slot vocabulary or the
two-gate architecture; R8 gates the whole build.

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
than anything in the comparison set). Encounters are bounded by the **shipped**
`plyHorizon`: 36 of 37 packs already declare one, median 12 ply, 17 of them
voluntarily.

**The mechanism nobody had proposed, and the best one: a capability-suppressing
boss** (Balatro's boss blind). It is law-8-legal *by construction* — it speaks about
the learner's information, never about chess — and it is **what makes the monotone
assistance lattice non-monotone**. It solves §1's one-build problem from the
opposite side to the loadout: the loadout gives you choices, the suppressor gives
those choices consequences.

**The unresolved one, and it is a real hole: a run that cannot be lost is a
playlist.** No resource refusal exists anywhere in the runtime, and no loadout
mechanism creates one. The proposed resolution — **owner ruling wanted** — is to
**price *declaring done*, not retrying**: rewind stays free inside an encounter, and
the *submitted* attempt decides the run. That gives the campaign a failure state
while leaving punishment-free experimentation exactly as the thesis promises.

