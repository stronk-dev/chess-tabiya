# Roguelike run design — how real games bound a run, sell the next one, and where our analogy breaks

**Question (owner, 2026-08-15):** *"do more research on similar games maybe? focus on the
game-games (roguelikes) vs educational/chess games specifically? like we want something
that's actually nice and not too long maybe and enticing people to try new builds."*

Three sub-questions, in the owner's order: **how long is a run and what ends it**, **what
makes a player want a different build next time**, and **where does the metaphor stop
working**. This is the companion to `design/research/campaign-effect-vocabulary.md`, which
counted what our unlocks can *be*; this one asks what *shape* the thing they sit inside
should have.

**Method and its limits, stated first.** This is a **desk dossier**, and the repo's doctrine
is that hands-on beats desk. Two consequences the reader should hold throughout:

1. **Every external game fact is `[P]`** — wikis and community sources, checked in this pass
   against the cited URL, not against a play session. Where a number is community consensus
   rather than a game rule (run *minutes*, above all) it is marked as such.
2. **Every claim about our own run length in minutes is `[M]`.** The repo has **no
   per-move or per-attempt timing telemetry at all** — a grep for
   `durationMs|elapsedMs|thinkTime` across `packages/runtime/src` and `apps/server/src`
   returns only one occurrence, inside a test's own stopwatch
   (`apps/server/src/branch-groups.test.ts:276`) `[V]`. So learner-seconds-per-ply is
   unmeasured, the arithmetic below exposes its assumption explicitly, and **the single
   cheapest thing that would upgrade this dossier is one owner run with a clock.**

Repo counts new to this dossier are `[V]` and derived at `8744adb` over the same 37
canonical packs `campaign-effect-vocabulary.md` used. Everything cited to another dossier is
cited, not re-derived.

**One sentence.** Real roguelikes bound a run with one of five devices, **three of which law
8 or the thesis forbids us** — and the two that survive we already have: an **authored
per-encounter horizon** (shipped, `authoredBoundary.plyHorizon`, declared by **36 of 37**
packs at a **median 12 ply**) and a **fixed node count**; build enticement transfers well
for the *choice* mechanisms and badly for the *power* mechanisms; and the analogy breaks
hardest at the point everyone assumes it works — **our build does not compound, its marginal
value turns negative (measured), and a run that cannot be lost is a playlist, not a run**, so
the genre we are actually in is **Into the Breach's** (a capability-set puzzle roguelike),
not Slay the Spire's.

---

## 1. The comparison set, and why these six

The owner's instruction was to study **game-games**, not chess trainers and not gamified
education. Six, chosen so that each one contributes a *device the others do not*:

| Game | Why it is in the set |
|---|---|
| **Slay the Spire** | The canonical act/floor/node map and the offered-choice draft. Already the campaign doc's reference point, so the comparison is continuous with prior work |
| **Balatro** | The purest example of *bounding a run by an escalating requirement*, and the only one in the set whose bosses **remove a capability** instead of adding power — the mechanism that turns out to be our best fit |
| **Hades** | Mutually-exclusive doors with the reward **visible before you commit**, named two-item synergies (Duo Boons), and the shortest run in the set |
| **Into the Breach** | The only one whose build is a **capability set** rather than a power level, and the only one that bounds the **encounter** (3–5 turns) as well as the run. Structurally the closest thing to us in commercial release |
| **FTL: Faster Than Light** | The only one bounded by an **external pursuit clock**. Included precisely to document a bound we *cannot* use |
| **Monster Train** | A second data point for the persistent difficulty ladder (Covenant 0–10) and for a **dual starting choice**, so "Ascension" is not a sample of one |

**Deliberate exclusions, with the criterion.** Action roguelikes whose run length is bounded
by *execution* stamina — Dead Cells, Isaac, Risk of Rain — are excluded because our encounter
is **deliberation-bound, not execution-bound**: a chess ply is a decision, not an input, so
their minutes-per-node figures do not transfer even directionally. Chess trainers and
gamified-education products are excluded by the owner's framing and are already covered by
fourteen teardowns in this directory.

---

## 2. Concern 1 — run length, and the five devices that end a run

### 2a. What a run actually is, in these games

| Game | Run = | Nodes/encounters | Reported run length |
|---|---|---:|---|
| Slay the Spire | 3 acts (+ optional Act 4) | Act 1 "spans **15 rooms**"; ~15–17 per act ⇒ **≈45–51** | **45–70 min** for Acts 1–3; **55–90 min** for a Heart run `[P]`, community-reported |
| Balatro | **8 antes** × 3 blinds | **24 blinds** (fewer if skipped) | ~30 min `[P]`, community consensus, unsourced here — treat as indicative |
| Hades | 4 biomes | **≈60–70 chambers**, most short | **20–40 min** typical; <20 min is a fast/Hermes run `[P]` |
| Into the Breach | **2–4 islands** (player's choice) + final Volcanic Hive | 4 missions + HQ per island ⇒ **≈10–20 missions**, each **3–5 turns** | ~1 h `[M]` |
| FTL | **8 sectors** | **19–24 beacons** per sector | 1–2 h `[M]` |
| Monster Train | 8 rings + final boss | **≈8–9** | ~45–60 min `[M]` |

Sources: [StS Act 1](https://slaythespire.wiki.gg/wiki/Act_1) ("The act spans 15 rooms"),
[StS Map Locations](https://slaythespire.wiki.gg/wiki/Map_Locations),
[Balatro Blinds and Antes](https://balatrowiki.org/w/Blinds_and_Antes),
[Hades Chambers and Encounters](https://hades.fandom.com/wiki/Chambers_and_Encounters),
[ITB Missions](https://intothebreach.fandom.com/wiki/Missions),
[FTL Sectors](https://ftl.fandom.com/wiki/Sectors), plus community run-length threads
([StS](https://steamcommunity.com/app/2868840/discussions/0/798966745989859959/),
[Hades](https://steamcommunity.com/app/1145360/discussions/0/2632850464737266078/)). All `[P]`.

**Note a discrepancy this dossier is correcting.** `campaign-effect-vocabulary.md` §5a states
"3 acts × 17 floors = 51 nodes". The Act-1 page says **15 rooms**, and community sources say
"15 to 17 floors" `[P]`. The right figure to reason with is **≈45–51**, and nothing in that
dossier's arithmetic turns on the difference.

### 2b. The five bounding devices — and only two survive our constraints

This is the useful part. Runs do not end because players get bored; they end because a
designer chose a device. There are five in the set, and they are **not interchangeable**.

| # | Device | Where | How it ends the run | Transfers to us? |
|---|---|---|---|---|
| **A** | **Fixed node count** | StS (3×~15), Balatro (8 antes), Monster Train (8 rings) | The map runs out | **YES.** Free, legible, needs no chess truth |
| **B** | **Escalating requirement that outruns any build** | Balatro: **300 chips at Ante 1 → 50,000 at Ante 8**, a ~166× geometric climb | The numbers end it; a build that stalls is eliminated | **NO — refused by measurement.** Requires a quantity that escalates *and is measurable*. R4+R9: the middlegame has **no oracle of either kind**; a difficulty ramp cannot be measured across a run (`practical-difficulty-outside-tablebase.md`, `human-outcome-coverage-depth.md`). Manufacturing one is law 8 |
| **C** | **External pursuit clock** | FTL: the rebel fleet advances every jump; nebulae halve the advance, letting scouts escape doubles it | Dawdling kills you, so exploring is priced | **NO — refused by the thesis.** A pursuit clock is a *retry* price by another name, and `00-thesis.md` sells "experimentation without cost". `06` §2c already located this exact collision |
| **D** | **Turn/horizon limit inside the encounter** | ITB: "most levels are between three and five turns long" | The *encounter* cannot trail off, so the run cannot either | **YES — and it already ships.** See §2c |
| **E** | **Player-elected length** | ITB: liberate **2–4 islands** before the final hive; StS: three keys unlock Act 4 | The player buys more run for more risk | **YES,** and it is the cheapest way to serve both "not too long" and "I want more" |

> **The finding.** Three of the five devices are unavailable to us, and *both* unavailable
> ones fail for reasons already measured and ruled in this repo — not for reasons of taste.
> The two that remain (A and E) are structural, cost no authoring, and manufacture no chess
> truth. Device D we have already, and did not know we had.

### 2c. Our encounter is already bounded, and the bound is measured

New count, `[V]`, over the 37 canonical packs at `8744adb`:

| Phase | Packs | `authoredBoundary.plyHorizon` declared | Median ply | Range |
|---|---:|---:|---:|---|
| opening | 20 | 20 | **11** | 7–14 |
| middlegame | 1 | 1 | 8 | 8 |
| endgame | 14 | 13 | **24** | 8–40 |
| cross_phase | 2 | 2 | 10 | 8–12 |
| **all** | **37** | **36 (97.3%)** | **12** | **7–40** |

(Derivation: a Python walk over `content/drafts/*.json`, canonical packs = those declaring a
`phase`, sidecars and `.browser.json` fixtures excluded — the same selection
`campaign-effect-vocabulary.md` §Method used. `plyHorizon` is the schema's declared encounter
horizon, `schemas/drill_pack.schema.json:910`; `authored-transitions-and-features.md`
established it equals the deepest spine path in 19 of 32 packs at that time.)

**The owner's framing said "~5–20 plies". The content says median 12, mean 14.2 — inside the
guess, with the endgames as the long tail at median 24 and a 40-ply maximum.** So Into the
Breach's device D is not something to add; it is something **32 of 37 authors voluntarily
already did** (`authored-transitions-and-features.md`: 17 of 32 boundary declarations were
voluntary, with no validator compelling them).

### 2d. From plies to minutes — the arithmetic, with its assumption exposed

This is `[M]`. Nothing in the repo measures it. The chain:

- Median encounter = **12 ply** ⇒ **6 own-move decisions**.
- At 8–20 s of deliberation per own move ⇒ **50 s – 2 min** of first-pass play.
- The loop is commit → play the consequence → rewind → branch → compare. Multiple attempts
  per root are the *expected* shape, not the exception — the shipped milestone set contains
  `ten_attempts_one_root` (`apps/server/src/service.ts:592-597`), so ≥10 is a celebrated
  quantity `[V]`. Assume a modest **2–3 attempts** plus reading the compare output.
- ⇒ **3–6 min per opening/middlegame encounter; 6–10 min per endgame encounter** (median 24
  ply is 2× the openings).

| Run size | Estimated minutes `[M]` | % of the 37-pack catalogue | Runs before the catalogue repeats |
|---:|---|---:|---:|
| 5 nodes | 20–30 | 13.5% | 7.4 |
| **9 nodes** | **35–55** | **24.3%** | **4.1** |
| 12 nodes | 45–70 | 32.4% | 3.1 |
| 15 nodes | 60–90 | 40.5% | 2.5 |

The 15-node row reproduces `campaign-effect-vocabulary.md` §5b exactly; the rest is the same
arithmetic at other sizes.

---

## 3. Concern 2 — build variety, ranked by how well it transfers

Ranking criterion, stated so it can be argued with: **(1) does it survive law 8 without a
chess-legal imitation, (2) do our shipped primitives already carry it, (3) what does it cost
in authoring minutes, (4) how much run-to-run difference does it actually produce.** Cost
figures come from `pack-authoring-cost.md` §4 (opening 28.8 / endgame 40.6 / middlegame 65.0
min per pack, `[P]` self-reported clocks).

### Rank 1 — Offered-choice draft with a real skip

- **(a) From:** Slay the Spire — a combat reward offers **1 of 3 cards, or skip**; Balatro —
  you may **skip a Small or Big Blind** and take a Tag instead, but "Boss Blinds must always
  be played" ([Balatro wiki](https://balatrowiki.org/w/Blinds_and_Antes)) `[P]`.
- **(b) There:** the build is assembled from a *small random menu*, so no two runs offer the
  same choices, and **declining is a move** — the skip is what makes the offer a decision
  rather than a gift.
- **(c) Here:** after each encounter, offer **3 lenses drawn from the 34 attested pool**;
  take one into a k-slot loadout, or skip it for a run-scoped consumable (§Rank 5).
- **(d) Primitives:** mostly shipped. The pool is counted and attested (34 = 15 structural +
  3 transition + 16 shapes), conjunctions cost **29.06 µs/ply** so any loadout is free to
  evaluate, and **C(34,3) = 5,984 distinct three-lens offers / C(34,5) = 278,256 five-slot
  builds** (`campaign-effect-vocabulary.md` §2a, §3c, §3d). **Missing:** server-held inventory
  (`AssistanceConfig` is browser localStorage) and the per-lens grain below the nine axes —
  the `DESIGN-GAP:` that dossier already escalated against `06` §1.
- **(e) Cost:** **zero authoring minutes.**

### Rank 2 — A run-defining opening choice

- **(a) From:** StS's **Neow**, who offers **four blessings** including the "boss swap"
  (replace your starter relic with a random Boss Relic) and a third option that is
  deliberately **a disadvantage paired with a stronger reward**
  ([Neow](https://slaythespire.wiki.gg/wiki/Neow)) `[P]`; Into the Breach's **squad
  selection**; Monster Train's **dual-clan** pick.
- **(b) There:** the run has an identity **before the first encounter**. It is the cheapest
  variety in the genre — one choice, once, and every subsequent decision is coloured by it.
  ITB's version is the important one: its squads are **capability sets, not power levels**.
- **(c) Here:** at run start, choose 1 of 3 offered *starting configurations*, each pairing a
  starting lens with a constraint — e.g. `corpus: on_request` but only **3** slots, versus
  **5** slots with no corpus rung; or "start holding `carlsbad`" versus "start holding
  `king_opposition`". Neow's third blessing is the template worth copying: **a real
  disadvantage bought with a real reward** is what stops the choice being a difficulty
  slider.
- **(d) Primitives:** partially. The nine `AssistanceConfig` axes are exactly the right
  *constraint* vocabulary (they are the wrong *deck* vocabulary — 1 build, monotone lattice —
  but a constraint is precisely what a monotone axis is good for). The **offer** and the
  run-scoped persistence do not exist.
- **(e) Cost:** **zero authoring minutes.**

### Rank 3 — A boss that suppresses a capability instead of gaining power

- **(a) From:** **Balatro's Boss Blinds** — they do not raise the enemy's stats, they **debuff
  the player**: restrict hand types, draw cards face down, debuff your most-played hand
  ([Balatro wiki](https://balatrowiki.org/w/Blinds_and_Antes),
  [Gameranx boss blind list](https://gameranx.com/features/id/495212/article/balatro-every-boss-blind-explained/)) `[P]`.
- **(b) There:** it creates the single most build-relevant tension in the game — you route
  *around* the boss that kills your build — and it does it without touching the enemy's
  numbers at all.
- **(c) Here:** an encounter that **masks one lens you are carrying** for its duration, or
  closes the `attempt_end` reveal window, or withholds the corpus rung. "This position must
  be read without `passed_pawn`."
- **(d) Primitives:** architecturally the same shape as something already shipped.
  `permittedAssistance` already computes what may honestly be shown, **separately** from what
  is switched on, and `06` §3 law 1 already mandates the two-gate architecture (honesty
  outer, inventory inner). An encounter-scoped inventory mask is a third input to the inner
  gate, not a new concept. It is also the mechanism that makes a monotone assistance ladder
  **non-monotone** — which is exactly what `campaign-effect-vocabulary.md` §3b proved was
  missing.
- **(e) Cost:** **zero authoring minutes** for the generic form; an authored boss that names
  *which* lens it suppresses is one line in a pack.

**This is the highest-value mechanism nobody in the repo has proposed yet.** It is the only
one in the set that produces roguelike-shaped tension while being, by construction, a
statement about the *learner's* information and never about chess.

### Rank 4 — Mutually-exclusive routes with the reward visible before you commit

- **(a) From:** Hades — each door displays the god's symbol, so you choose *which boon
  family* you are walking into and forgo the other
  ([Hades symbol guide](https://www.inverse.com/gaming/hades-symbol-meaning-guide-hera-dionysus-apollo-ares-aphrodite)) `[P]`;
  FTL's sector-map choice; StS's map fork.
- **(b) There:** opportunity cost built from **advance information**, which is what separates
  a choice from a coin flip.
- **(c) Here:** a map node showing its **phase** and its **difficulty-availability label**
  before you enter — measured-by-outcome / authored / measured-by-tablebase / none
  (`06` §2a). Two candidate encounters per node.
- **(d) Primitives:** the label exists at *branch* level as `branchDecidedness`, but `06` §1
  states plainly that promoting it to campaign scale also requires **a fourth ground
  (human-outcome) that does not exist yet** — R9's oracle has no `DecidednessGround`. So this
  one has real work behind it.
- **(e) Cost:** two candidates per node needs **2 packs per node slot**. Phase-balanced, this
  is where the middlegame bill lands (§4c). **2.2–9.75 agent-hours** depending on run size.

### Rank 5 — A consumable with an honest expiry

- **(a) From:** StS potions; Hades' Death Defiance.
- **(b) There:** a small run-scoped reserve that makes one moment survivable, and spending it
  is a decision you remember.
- **(c) Here:** **it already ships and nobody has called it a consumable.** The `attempt_end`
  feedback window opens on reveal and **closes on the next committed move**
  (`packages/runtime/src/feedback.ts:22-30`). A reveal buys visibility until you move again.
  Give a run **N of them** and you have an economy that prices **looking, not retrying** —
  so it does not touch "experimentation without cost".
- **(d) Primitives:** the window is shipped; the counter is not. The repo has **no rewind
  budget of any kind** (`rewindsUsed|rewindCount|rewindBudget|REWIND_` = **zero hits**
  repo-wide) and only one refusal path, `MATCH_LIVE`, which is a *permission* refusal — a
  resource refusal would be a new class needing its own run-log event
  (`campaign-effect-vocabulary.md` §2b, §2d).
- **(e) Cost:** zero authoring; gated on R6 for tuning.

### Rank 6 — Synergy discovery

- **(a) From:** Hades' **Duo Boons** — "a type of Boon which combines the powers of two
  different gods for a unique effect", requiring specific boons from *both*
  ([Duo Boons](https://hades.fandom.com/wiki/Duo_Boons)) `[P]`; StS card+relic combos.
- **(b) There:** the strongest *replay* driver in Hades, because the discovery is a named,
  memorable event rather than a stat increase.
- **(c) Here:** two forms, and the split is already established.
  **Authored joins ship today** — 96 of 117 shape plans carry a real `success.signature`,
  which is literally a plan→predicate join a human wrote, and `projectAuthoredFeedback`
  already gates them. **Emergent joins are architecturally supported and unmeasured**: any
  conjunction of the 49 lenses is free to compute, and the position does the joining, so
  nobody has to enumerate pairs the way a card game must.
- **(d) Primitives:** authored — yes, shipped. Emergent — the load-bearing claim (that a
  conjunction's specificity multiplies while each component stays rung-honest) is **`[M]`**
  and is proposed as **R11** in `campaign-effect-vocabulary.md` §4/§7.
- **(e) Cost:** authored joins are inside the 65.0 min/pack middlegame figure; emergent is
  free **if R11 succeeds**.

> **Rank 6's rank is conditional, and this is the biggest single unknown in the campaign.**
> If R11 lands, this mechanism moves to **rank 1** — synergy is what makes a deck a deck. If
> it fails, our loadouts are *additive*, not synergistic, and the product is a configurable
> lens set rather than a build. R11 is cheap (the R3 harness already emits the data) and it
> should run **before** any slot budget is priced.

### Rank 7 — Unlock drip

- **(a) From:** StS unlocks cards by playing a character; Hades' Mirror of Night; ITB squads
  bought with achievement **Coins** ([ITB](https://intothebreach.fandom.com/wiki/Missions))
  `[P]`; Balatro's joker and deck unlocks.
- **(b) There:** guarantees the *next* run's menu differs from this one's independently of
  RNG — the one variety source that does not depend on luck.
- **(c) Here:** the drip has raw material sitting unused: **15 of 49 lenses are named by no
  authored content, and 9 of 25 shapes are named by no pack** — so they are invisible to
  `shapeRecommendations` today. Making them *earned* rather than *invisible* is a reframe,
  not a build.
- **(d) Primitives:** the **detector** exists (`shapeRecommendations`, rung-0 arithmetic over
  a shipped endpoint) and **nothing gates on it** (`06` §1). The **earn side is nearly
  empty**: `Service.milestones()` mints **exactly 7 kinds, all first-time-only** — at most 7
  events per learner, ever. That is a scrapbook, not a drip.
- **(e) Cost:** zero authoring for the lens drip. The 9 unnamed shapes need packs to name
  them. **Constraint:** ADR-0007 — unlocked by playing, never purchased. A drip is
  compatible; a shop is not.

### Rank 8 — A persistent difficulty ladder

- **(a) From:** StS **Ascension 1–20**; Hades **Heat / Pact of Punishment**; Monster Train
  **Covenant 0–10**, each rank unlocked by beating the previous
  ([Ascension](https://www.highgroundgaming.com/slay-the-spire-ascension-guide/),
  [Covenant](https://monstertrain2.miraheze.org/wiki/Covenant_Ranks)) `[P]`.
- **(b) There:** the single biggest "worth replaying" device in all three, and it produces
  hundreds of hours with **modifiers, not content**.
- **(c) Here:** we have exactly **two honest dials**, and neither is a number about chess.
  **(i) The Maia band** — ruled `[1000, 2400]` by R10, with adjacent 100-Elo steps changing
  the policy on 50/50 non-forced positions — is a legitimate, corpus-grounded *human*
  difficulty ladder. **(ii) The slot budget** — 5 slots → 3 → 1 — is an Ascension analogue
  that costs nothing and is arguably the *more* honest one, since fewer lenses means more you
  must see yourself.
- **(d) Primitives:** **and here is the finding that has to be said out loud.**
  `engine-layer-capability-audit.md` measured a live regression: `#maia` sends `Elo`, then
  `SelfElo`/`OppoElo` at their advertised default 1500 (`opponent-selector.ts:493-506`), and
  `Elo` is an alias for that pair — so **every Maia request currently runs at band 1500 while
  recording the requested band as `eloApplied`**, byte-identical to an `Elo 1500` request on
  12/12 positions at both extremes. **The campaign's one honest difficulty dial is, today,
  inert.** Any ladder built on the band is building on a measured-broken axis, and the fix is
  already identified.
- **(e) Cost:** zero authoring. Blocked on that fix.

### Refused — an escalating numeric economy

Balatro's 300 → 50,000 climb is the cleanest run-bounding device in the set and **we cannot
have it.** It needs a quantity that (i) measures how well you are doing and (ii) escalates.
R4 and R9 jointly say measured difficulty exists only on two islands that do not touch —
decided endgames and roughly the first ten moves — and the middlegame between them has no
oracle of either kind. Manufacturing the number across the hole is law 8 and is the named
anti-pattern. **Say it plainly and do not build a chess-legal imitation of it**; a "score"
that is really a proxy for nothing is worse than no score, and the ChessMonitor finding
already priced what refusing it costs (`quickpass-wintrChess-encroissant-chessmonitor.md`).

### The ranked list, in one table

| # | Mechanism | From | Primitives shipped? | Authoring cost |
|---:|---|---|---|---|
| 1 | Offered-choice lens draft, with a skip | StS card reward / Balatro skip+tag | Mostly — needs server inventory + per-lens grain | **0 min** |
| 2 | Run-defining opening choice, incl. a real disadvantage | Neow / ITB squad / MT dual clan | Partly — axes exist, offer does not | **0 min** |
| 3 | Capability-suppressing boss | Balatro boss blind | Architecturally yes (two-gate design) | **0 min** |
| 4 | Mutually-exclusive route, label visible in advance | Hades door / FTL sector | Branch-level label exists; needs campaign promotion + a 4th ground | **2.2–9.75 h** |
| 5 | Consumable with honest expiry | StS potion / Death Defiance | The window ships; the counter does not | **0 min**, gated on R6 |
| 6 | Synergy discovery | Hades Duo Boons | Authored yes; emergent `[M]`, **R11** | 0 min if R11 lands |
| 7 | Unlock drip | StS unlocks / ITB coins | Detector yes, earn side = **7 lifetime events** | **0 min** |
| 8 | Persistent difficulty ladder | Ascension / Heat / Covenant | Slot-budget yes; **band dial measured inert** | **0 min**, blocked on a fix |
| — | Escalating numeric economy | Balatro antes | **Refused** — no oracle, law 8 | — |

**The shape of that table is the answer to the owner's question.** Five of the eight cost
zero authoring minutes and are blocked only on plumbing we have already named. The one that
costs content (rank 4) is the one that also delivers the least per hour spent.

---

## 4. Concern 3 — where the analogy breaks

Four breaks. The first two are the ones that matter.

### 4a. The build does not compound, so there is no power curve

In Slay the Spire, Balatro and Hades the run's pleasure is a **curve**: your build compounds
against an escalating opponent, and by the last act you delete things that would have killed
you in the first. Balatro states the curve numerically — 300 chips to 50,000 — and your
build must grow ~166× to keep up.

**A lens changes what you can see. A chess position does not care what you know.** Nothing in
our inventory alters the board, the opponent, or the legal moves; law 8 guarantees it and
`campaign-effect-vocabulary.md` §1a enumerates each refused imitation with its ground. So the
curve is **flat by construction**. An extra lens does not make you win faster; it makes one
class of position more readable, once, if that class occurs.

Anyone designing this loop against a Spire intuition will keep reaching for something that
compounds, and every candidate they reach for is on the refused list.

### 4b. Past a threshold our build's marginal value is *negative*, and that is measured

This is the sharper break, and it is the one that changes what the game *is*.

In Spire, more relics is monotone good (only *cards* have a dilution cost). Here, more lenses
is monotone **bad** past a threshold, and we have the number: D78 measured the pulled rung-0
reading at a **median 58 observations per position (max 97), 13 of them unconditional**, and
the shipped compare strip at **8.31 entries/ply firing on 99.8% of transitions with lift
≈1.01×** (`feedback-versus-the-dashboard.md`). The all-on state is the **unreadable** state.

So the optimisation is not *"assemble the strongest set"* — it is **"assemble the smallest
sufficient set"**. That is a different game, and it is not a worse one; it is what gives the
slot budget an honest cost function without inventing scarcity
(`campaign-effect-vocabulary.md` §1, `06` §2c).

**And it names the genre.** A game whose build is a *capability set*, whose difficulty is a
*bounded solvable puzzle* rather than a stat race, and whose replay driver is *"the same
board, spoken in a different language"* — that is **Into the Breach**, not Slay the Spire.
ITB gives you a fixed squad, near-perfect information, telegraphed enemy intent, and 3–5
turns; its replay driver is squad identity. Every structural property in that sentence is one
we have or want.

> **Recommendation, and it is the dossier's main conceptual claim:** treat **Into the Breach
> as the primary structural model and Balatro as the model for bosses**, with Slay the Spire
> demoted to the source of the *map and draft* only. Forcing the Spire metaphor is what
> produces the proposals law 8 keeps refusing.

### 4c. Our content decays and a Jaw Worm does not

A Slay the Spire monster is the same fight the fortieth time; all the variance is in your
deck, and the encounter's information is *regenerated* each run by the RNG.

Our packs carry **finite authored readable content**: **275 deviation notes and 145
checkpoints across 37 packs** (7.4 deviations per pack) `[V]`, plus 284 authored readable
items behind the 25 shapes. Once you have read a pack's deviation notes, the encounter is a
different, thinner object — the surprise is spent even though the position is not.

**This makes the catalogue-exhaustion arithmetic worse than §5b of the prior dossier implies,
and it argues for a shorter run, not a longer one:** a 15-node run consumes 40.5% of the
catalogue and repeats within 2.5 runs; a 9-node run consumes 24.3% and lasts 4.1. It also
means the *loadout* has to carry more of the variance burden here than in any of the six
comparison games — which is the same conclusion `campaign-effect-vocabulary.md` reached from
the other side (37 packs × 1 build = 37 run-shapes; the catalogue is not the limiting factor
once the grain moves down).

### 4d. A run that cannot be lost is not a run

Every game in the set can **end badly**: death (StS, Hades, FTL), a missed score requirement
(Balatro), grid destruction (ITB). That is where run *tension* comes from, and it is why the
build choices earlier in the run feel weighty.

Our loop is deliberately punishment-free — `00-thesis.md` sells *"experimentation without
cost"*, rewind is unbudgeted with **no resource refusal path anywhere in the runtime**, and
`06` §2c is a whole section about not selling that back. **So the campaign, as currently
conceived, has no failure state, and a sequence of encounters with no failure state is a
playlist, not a run.** No loadout mechanism fixes this; it is orthogonal to all eight of §3.

Two honest resolutions, presented as an **owner decision, not a ruling**:

- **(a) Move the priced act from *retrying* to *declaring done*.** Objective assessment is
  already shipped (`OBJECTIVE_ASSESSMENT_SETS`, `first_objective_achieved`), so an encounter
  can already succeed or fail. Rewind and fork stay **free and unbudgeted within an
  encounter**; the run's outcome is decided by the attempt the learner *submits*. Failing an
  act boss ends the run. This preserves the thesis exactly — experimentation is free, and the
  only thing that costs is saying "this is my answer" — and it gives the run the stake it
  needs. It also needs the resource-refusal-free property to stay intact, which it does.
- **(b) No failure state.** The run is a bounded curated sequence and the replay driver is
  entirely the loadout. Honest, cheap, and strictly weaker — it makes the campaign a
  presentation layer over the existing catalogue.

**This dossier's view is (a)**, because it is the only proposal in the whole campaign cluster
that adds run tension without pricing anything the thesis sells. But it introduces a verb the
product does not have — *submit* — and that is squarely an owner call.

### What to call the feeling, since it is not a power fantasy

If the loop does not escalate power, the honest name for what it escalates is **legibility**.
Over a run, the same class of board becomes progressively more readable, and the climax is a
position you would have found opaque at node 1 and can now read with the three lenses you
chose and the one the boss took away. The build's promise is not *"you are stronger"* — it is
*"you can see this"*, which is also exactly the product's thesis. That is a smaller promise
than Slay the Spire's, and it is one we can keep.

---

## 5. Recommended run shape

**Nine nodes. Three acts of three. 35–55 minutes `[M]`. Encounters bounded by the shipped
`plyHorizon`. The run ends by fixed node count, with one elective extension.**

### 5a. The argument, from the numbers rather than taste

**Why nine and not fifteen** — three independent arguments converge:

1. **Catalogue.** 9 nodes = **24.3%** of the 37 packs, **4.1 runs** before repetition; 15
   nodes = 40.5% and **2.5 runs**. §4c shows our packs decay faster than a roguelike's
   monsters because their authored content is finite and read-once, so this margin matters
   more for us than the comparison arithmetic suggests.
2. **The middlegame bill.** A phase-shaped map needs **≥1 middlegame node per act**. We have
   **1 middlegame pack**. At 3 acts × 1 middlegame node, we are **2 packs short = 2 × 65.0 =
   2.2 agent-hours**. A 15-node phase-balanced run is **9 packs short = 9.75 agent-hours**
   (`campaign-effect-vocabulary.md` §5c). **A 9-node run is 2.2 agent-hours from being
   phase-shaped and non-repeating.** That is the difference between a weekend and a fortnight.
3. **Minutes.** At the §2d rates, 9 nodes lands at **35–55 min** — inside StS's 45–70 and
   above Hades' 20–40. Node parity with Spire (≈45–51) would be **wrong**, because a Spire
   node is a 60–90 s combat with card-play tempo and ours is a multi-attempt deliberation.
   **Node parity would overshoot minute parity by roughly 4×.**

**Why three acts, and what the acts are.** *Not* difficulty tiers — we cannot measure a ramp
(§3 Refused). The acts are the **difficulty-availability tiers `06` §2a already names**,
which happen to coincide with phase:

| Act | Phase | Difficulty availability | Act boss (from `06` §2b) |
|---|---|---|---|
| I | opening | **measured by human outcome** (R9's oracle, live to ply ~20) | `theory_strict` — deterministic, the only boss whose difficulty is outcome-measured |
| II | middlegame | **authored** — no oracle of either kind (R4+R9) | `human_common` at a band **plus an authored plan** |
| III | endgame | **measured by tablebase** (κ = 1.000 inside range) | `perfect_tablebase` — literally unbeatable, shipped, already used by two packs |

> **The elegance is not decorative.** This is the honest version of "escalating stakes":
> **the stakes escalate in decidability, not in numbers.** Act I you are judged by what
> humans at your band actually did; Act II by a human author who says so; Act III by a
> tablebase that cannot be wrong. And the final boss of a chess roguelike being *literally
> unbeatable if you err* is a stronger climax than anything the comparison set has — and it
> already ships.
>
> **The cost of this structure is that Act II is impossible today.** One middlegame pack
> means every run's middle act is `carlsbad-minority-attack`, every time
> (`campaign-effect-vocabulary.md` §5b). The 2.2 agent-hours in argument 2 is the price of
> Act II existing at all.

**Per-act composition:** 2 encounters + 1 act boss. Node bound is device D, already shipped
(median 12 ply, median 24 in Act III — so Act III is naturally the longest act in minutes,
which is also where a climax belongs).

**Route choice:** two candidates per non-boss node. That needs **6 non-boss slots × 2 = 12
candidate packs** phase-balanced as 4/4/4 — met for openings (20) and endgames (14), short by
**3** for the middlegame (**3.25 agent-hours**). **v1 fallback:** no route choice in Act II
only, which drops the bill to the 2.2 h above.

**Elective extension (device E):** an optional Act IV, gated on something *earned in the run*
— StS's three-keys shape. It serves "not too long" for the default player and "I want more"
for the engaged one, at zero content cost if it reuses the endgame pool at a tighter slot
budget.

**Loadout:** **5 slots** over the 34 attested lenses ⇒ **278,256 builds**, with 3-lens offers
after each of the 6 non-boss encounters (**C(34,3) = 5,984** possible offers). The 13
unconditional observations are excluded from the pool — they fire everywhere and are blanks
(`campaign-effect-vocabulary.md` §3c).

### 5b. What has to land for this shape, and what it costs

| # | Requirement | Source of the requirement | Cost |
|---|---|---|---|
| 1 | Server-held inventory (today `AssistanceConfig` is localStorage) | ADR-0007 — earned progression must not be client-editable | Plumbing |
| 2 | Per-lens grain below the nine axes | `campaign-effect-vocabulary.md` `DESIGN-GAP:` vs `06` §1 | Plumbing |
| 3 | **2 middlegame packs** (3 with Act II route choice) | Act II exists at all | **2.2 h** (3.25 h) |
| 4 | Campaign-scale difficulty-availability label + a human-outcome `DecidednessGround` | `06` §1, §2a | Design + plumbing |
| 5 | **Fix the `#maia` `SelfElo`/`OppoElo` regression** | `engine-layer-capability-audit.md` — Act II's boss band is inert today | Bug fix, already located |
| 6 | Fix or delete `arrows` | A slot with no perception behind it would be an unlockable that unlocks nothing | Small |
| 7 | **Run R11** before pricing any slot budget | §3 rank 6 — the synergy claim is `[M]` and the whole build argument leans on it | Cheap; R3 harness already emits the data |
| 8 | An owner ruling on §4d — failure state or not | The run has no stake without one | Ruling |

---

## 6. What this dossier does *not* establish

- **No minutes are measured.** §2d is `[M]` end to end. One owner run with a stopwatch over
  three packs would convert the single most load-bearing estimate here into `[V]`, and it is
  a 30-minute exercise.
- **No hands-on with the six games in this pass.** Every external fact is `[P]` from wikis
  and community threads; the run-length figures for Balatro, ITB, FTL and Monster Train are
  indicative rather than sourced to a rule.
- **The genre reclassification (§4b) is an argument, not a measurement.** It follows from
  measured facts (flat power curve by construction; negative marginal value past D78's noise
  floor) but the conclusion "we are Into the Breach" is analysis and is `[M]`.
- **§4d resolution (a) is a proposal.** It touches an invariant's venue (`05` §1) and is the
  owner's.
- **R6, R7, R8 stand unchanged** — whether a budget destroys punishment-free experimentation,
  what it feels like to lack a rung you need, and whether the loop rewards wrapping at all
  are experiential and gate *building*, not writing.

**Ideas raised here that want ledger rows** (not filed — this task's boundary is the dossier
and the coverage matrix): the capability-suppressing boss (§3 rank 3); the run-scoped reveal
budget over the `attempt_end` window (§3 rank 5); the elective Act IV (§5a); the *submit*
verb and run failure state (§4d); the slot-budget-as-Ascension ladder (§3 rank 8); and
promoting the ITB-over-Spire structural model into `06` (§4b).

---

## Sources

**External, all `[P]`:**
[Slay the Spire — Act 1](https://slaythespire.wiki.gg/wiki/Act_1) ·
[Map Locations](https://slaythespire.wiki.gg/wiki/Map_Locations) ·
[Neow](https://slaythespire.wiki.gg/wiki/Neow) ·
[Ascension guide](https://www.highgroundgaming.com/slay-the-spire-ascension-guide/) ·
[StS run-length thread](https://steamcommunity.com/app/2868840/discussions/0/798966745989859959/) ·
[Balatro — Blinds and Antes](https://balatrowiki.org/w/Blinds_and_Antes) ·
[Balatro boss blinds](https://gameranx.com/features/id/495212/article/balatro-every-boss-blind-explained/) ·
[Hades — Chambers and Encounters](https://hades.fandom.com/wiki/Chambers_and_Encounters) ·
[Hades — Duo Boons](https://hades.fandom.com/wiki/Duo_Boons) ·
[Hades door symbols](https://www.inverse.com/gaming/hades-symbol-meaning-guide-hera-dionysus-apollo-ares-aphrodite) ·
[Hades run-time thread](https://steamcommunity.com/app/1145360/discussions/0/2632850464737266078/) ·
[Into the Breach — Missions](https://intothebreach.fandom.com/wiki/Missions) ·
[FTL — Sectors](https://ftl.fandom.com/wiki/Sectors) ·
[FTL — Rebel Fleet](https://ftl.fandom.com/wiki/Rebel_Fleet) ·
[Monster Train — Covenant Ranks](https://monstertrain2.miraheze.org/wiki/Covenant_Ranks)

**Repo, at `8744adb`, `[V]`:** `content/drafts/*.json` (37 canonical packs — `plyHorizon`,
checkpoint and deviation counts); `schemas/drill_pack.schema.json:910`;
`packages/schema/src/drill-pack/types.ts:221-226`; `packages/runtime/src/feedback.ts:22-30`;
`apps/server/src/service.ts:592-597`; `apps/server/src/branch-groups.test.ts:276`;
grep censuses for `durationMs|elapsedMs|thinkTime` and `rewindsUsed|rewindCount|rewindBudget|REWIND_`.

**Dossiers:** `campaign-effect-vocabulary.md` (the numbers this one is built on),
`practical-difficulty-outside-tablebase.md`, `human-outcome-coverage-depth.md`,
`maia-band-calibrated-range.md`, `engine-layer-capability-audit.md`,
`feedback-versus-the-dashboard.md`, `census-hint-false-positives.md`,
`move-primitive-computability.md`, `pack-authoring-cost.md`,
`authored-transitions-and-features.md`,
`quickpass-wintrChess-encroissant-chessmonitor.md`.

**Design:** `00-thesis.md`, `05-in-run-experience.md`, `06-campaign.md`, `AGENTS.md` (law 8,
§Rejected), `planning/campaign-research-queue.md`.
