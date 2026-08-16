# Time as a difficulty lever — is a clock the refused pursuit clock, and does time pressure sort assistance by distance to the answer?

**Question,** in the owner's words, 2026-08-16:

> *"what if we want to simulate the time pressure of a GREAT move during 10+0 chess and then give
> actual time?"*

Ledgered as **D330** (no time control exists anywhere; `clockState` is `Record<string, unknown>`
with zero readers) and **D331**, which is the reason D330 is worth more than a missing field:

> **Is time a difficulty lever that constrains the learner without touching the power curve?**

`design/06-campaign.md` §5 rules that **what escalates is LEGIBILITY, not power**, and that the
power curve is flat by construction. Every lever found so far changes the opponent (band), the
decidability tier, the encounter horizon, or removes a capability. A clock is different in kind: it
constrains the learner's **own computation**. And it was proposed to interlock with the criterion
landed 2026-08-16 — coaching versus cheating is **distance from the answer**
(`kind` / `fact` / `ranking` / `move`,
`design/research/coaching-versus-cheating-and-the-band-curve.md`) — on the hypothesis that
**a hint you do not have time to read is not a hint**, so time pressure would degrade assistance
*continuously* and *preferentially near the answer*, without withholding anything.

This dossier lands three things: **whether a game clock is the refused pursuit clock**, with the
argument; **whether reading cost varies with distance-to-answer**, measured; and **what a
10+0-shaped budget implies for the assistance that ships today**. Plus what would falsify each.

**Instrument.** One disposable harness, `tools/d355-reading-cost-harness/`, plus a code read.
Everything marked `[V]` was computed or read in this pass at the working tree of 2026-08-16.
Population named before the instrument, because *the population you measure against decides the
answer before the instrument does* (four attestations in this repo): the **47 committed packs** in
`content/drafts/` — **721 spine transitions, 609 distinct positions**, the same corpus and walker
R1/R2/R3/R11 use — plus the **25 shape entries** in `content/shapes/`, the **43 cached real Lichess
explorer responses** in `content/sources/lichess-explorer/`, the **recorded Maia candidate-count
distribution** (105 keys) from `tools/r5-maia-stability-harness/`, and the **89 pack-shaped
documents** that declare an `id`, a `phase` and an `opponentPolicy`. Findings inherited from
D78/Q8/R10 and from the campaign dossiers are cited to those dossiers and labelled `[P]`.

---

## 1. Verdict

**Q1 — the obstacle.** A game clock is **not** the object `06` §5 refuses, and the discriminator is
mechanical rather than rhetorical: **a clock is the refused pursuit clock iff its budget survives a
rewind.** A run-pooled clock is a rewind budget with a real-valued counter — every second spent on
attempt 1 is unavailable to attempt 2, so the *k*-th retry costs more than the first, which is
exactly and only what `06` §2c refuses. A clock that **resets at the fork** prices nothing about
retrying; it prices thinking inside one attempt, and `00-thesis.md` §76's *"experimentation without
cost"* is a claim about branching, not about deliberation. **The shipped placeholder is already on
the right side of that line by construction**: `clockState` hangs off **`Node`**
(`packages/runtime/src/types.ts:111`), and nodes are path- and branch-scoped, so a clock built on
the reserved field rewinds with the board automatically — **the refused version is not expressible
in the field that exists**; it would need a new run-level one `[V]`.

**Q2 — the reason to want it does not survive measurement, and this is the dossier's main result.**
Reading cost does **not** track distance to the answer. Over **43,272 rendered items** from the
shipped renderers:

| | variance in log(words) explained |
|---|---|
| **distance class** (`kind`/`fact`/`ranking`/`move`) | **η² = 0.201** |
| distance class, excluding `move` (refused product-wide today) | **η² = 0.038** |
| **which renderer printed it** (33 families) | **η² = 0.984** |

`[V]`. Spearman ρ(distance rank, words) = **−0.046** over all items and **+0.125** excluding `move`
— the same order of magnitude as the ρ = −0.143 this project already treats as *no relationship*
(`06` §3 law 5, *rarity is not value*). **Reading cost is a property of the renderer's verbosity,
not of the item's distance from the answer.**

And it is worse than flat at the end that matters. **`move` is the cheapest class the product could
ever print** — median **1 word / 0.3 s** — against `ranking`'s **63 words / 16 s** `[V]`. So a clock
is a gradient **toward** the answer: under time pressure the rational learner reads the shortest
item that resolves the most of the decision, and that item is the one the criterion calls cheating.
The hypothesis is refuted in its own terms: *a hint you do not have time to read is not a hint* is
true, but the hints time pressure destroys are the honest ones.

**Q3 — the 10+0 arithmetic, and the one thing it does deliver.** 600 s over a 40-move reference game
(Lichess's own convention: it classifies a control by `initial + 40 × increment`) is **15.0 s per
learner move**, which at 238 wpm is **60 words**. The shipped all-on rung-0 reading at one node is a
median **978 words / 247 s** — **16.4× the entire per-move budget** — so reading it at two of a
median encounter's five nodes consumes **82% of the whole 600-second game** `[V]`. What survives the
budget: **6.6 `fact` items, or 0.94 `ranking` items.** That derived number is the useful residue:
D78 licensed the *existence* of a slot budget and licensed no number, and a 10+0 move budget derives
**≈6** — the same order as the campaign's chosen five-slot loadout, which costs 45 words / 11.3 s
and fits with room to spare. **The arithmetic is the deliverable; the clock is not required to
collect it.**

**So: time is admissible, and useless for the job it was proposed for.** What the owner's sentence
literally asks for — *"simulate the time pressure … **and then give actual time**"* — is a
**depicted** clock, not an enforced one, and that version is cheap, grounded and doctrinally free.
See §5.

---

## 2. Q1 — is a game clock the refused pursuit clock?

### 2a. What is actually refused, quoted rather than paraphrased

`06` §5's refused list: *"escalating numeric economies are law-8 violations; **a pursuit clock is a
retry price by another name**"*, citing `06` §2c. And §2c's own resolution decomposes the owner's
rewind-budget idea into **three separable ones — *where* you may rewind, *how often*, and *play it
out before you rewind*** — and rules that *"Only **how often** is a real conflict with the thesis"*.

So the refused object is precise: **any device that makes the *k*-th retry cost more than the
first.** Not "any budget", not "any pressure", not "any cost" — the campaign already carries a slot
budget on the ground that *"the all-on state is the unreadable one"*, i.e. a budget that is the
product refusing to print noise rather than withholding a reward.

### 2b. The candidate distinction, tested — and it holds, but only in one of its two forms

The brief's candidate: *a pursuit clock prices how long you take to **retry**; a game clock prices
how long you take to **think inside one attempt**.* Tested against §2c's actual criterion, it splits
into two objects with opposite verdicts:

| Clock | Does the *k*-th retry cost more than the first? | Verdict |
|---|---|---|
| **Run-pooled** — one budget for the encounter, spanning every rewind | **Yes**, arithmetically. Every second on attempt 1 is unavailable to attempt 2; after enough retries the budget is gone | **This is the refused object exactly.** It is a rewind budget with a real-valued counter instead of an integer one, and calling it a clock changes nothing |
| **Attempt-scoped** — the budget resets at the fork | **No.** Attempt 2 begins with what attempt 1 began with | Not the refused object. It prices *deliberation*, and §2c's ruling is about *frequency of retry* |

The distinction is not just conceptual. **It is one field's altitude, and the shipped placeholder
already picked the safe altitude** `[V]`:

- `clockState` is declared on **`Node`** — `packages/runtime/src/types.ts:111`, inside the `Node`
  interface (which also carries `branchId`, `:107`), and mirrored in the JSON Schema at
  `schemas/drill_run.schema.json:265` as a per-node property.
- It is written only from `CommitMoveOptions.clockState` (`packages/runtime/src/runtime.ts:57`,
  applied at `:341`) — i.e. supplied per committed move, by the caller.
- Its schema definition (`schemas/drill_run.schema.json:206-210`) is
  `{"description": "Reserved until clock semantics are specified by a later RFC.", "type": "object",
  "additionalProperties": true}`.

Nodes are path-scoped and branch-scoped; rewind forks rather than erases (`05` §1). So **a clock
built on the reserved field rewinds with the board, automatically and with no rule required.**
Building the refused version means adding a *run-level* field. That makes the ruling checkable in a
diff rather than in prose, which is the strongest form an answer to this question can take.

### 2c. The counter-arguments, given fairly — and the second one is the real objection

**(i) A resetting clock has no teeth.** If flagging costs nothing because rewind is free, the clock
is atmosphere with a countdown on it. So an enforced clock only bites if flag-fall attaches to
something — and `06` §5's SETTLED ruling already supplies the only scope available: **a node
remembers the branch you SUBMIT**, so *"rewind stays free inside an encounter; declaring done is
what counts"*. A flag-fall on the *submitted* branch prices **committing**, not retrying, which is
the same verb §5 used to close both its holes. The clock therefore needs **no new refusal class,
counter or currency** — which matters, because §5's closing sentence is *"No budget, counter,
currency, refusal class or clock is required by any of this."* Required is not forbidden; but it
does mean a clock must earn a place in a design that already closed both holes without one.

**(ii) `06` §5's dichotomy has no slot for it, and this is the honest framing of the request.** §5
rules that **what escalates is LEGIBILITY, not power**, and that the power curve is flat *by
construction*. A clock escalates **neither**. It does not change what the opponent can do, and it
does not change what the product will say or when. It shrinks **the learner's own capacity to use
what they were told** — a third axis that §5 does not contemplate. Admitting a clock therefore does
not *fit* the ruling; it **amends** it, by adding a third thing that escalates.

> `DESIGN-GAP:` **`06` §5's refused list is one word too broad, and its escalation dichotomy is one
> axis too narrow.** (1) *"a pursuit clock is a retry price by another name"* is true of the
> **run-pooled** clock and false of the **attempt-scoped** one; the shipped `clockState` field
> cannot express the refused form. (2) *"what escalates is LEGIBILITY, not power"* is a complete
> dichotomy only while nothing constrains the learner's own computation; a clock is a third kind and
> the doc has no verdict on it either way. Both are owner-tier amendments and are proposed here, not
> written (law 5). §8 carries them as the ruling.

### 2d. Three things in this tree have clock-shaped names and none of them is a clock

Re-verified in this pass, because the names invite exactly the conflation the brief warns about:

- **`clockState`** — **6 non-test references in `apps/` and `packages/`**, all of them declarations
  or opaque passthrough: `packages/runtime/src/types.ts:111`, `runtime.ts:57` and `:341`,
  `apps/web/src/lib/api.ts:468`, `apps/server/src/rest.ts:471-477` and `:1314-1316`. **No client
  ever sends it** (zero references in any `.svelte` file) and **nothing reads it**. With
  `additionalProperties: true`, anything at all may be stored there today `[V]`.
- **`clock_zeroed`** — the **halfmove** clock, i.e. the fifty-move-rule counter. It is a declared
  subkind of `move_irreversibility` with a shipped sentence — *"The move was a pawn move or capture,
  so the halfmove clock resets."* (`apps/web/src/lib/transition-sentences.ts:9`) — and
  **`irreversibility()` never returns it** (`packages/runtime/src/transition.ts:245-265`). Measured:
  over **721 transitions** the detector emits `pawn_break` 52, `castled` 20, `last_of_role` 21, and
  **`clock_zeroed` 0** `[V]`. The only clock-named renderable sentence in the product is dead.
- **`timingWindows`** — **move-count** tempo. Its budget field is `luxuryMoveBudget` and its rendered
  sentence counts *moves*: *"within the declared budget of N luxury moves"*
  (`apps/web/src/lib/evidence-sentences.ts:108`) `[V]`. Inherited: **0 of 135 checkpoints** and all
  seven tempo verdicts have zero users `[P]` (`design/research/authoring-vocabulary-completeness.md`).

---

## 3. Q2 — does reading cost vary with distance to the answer?

**No. It varies with which renderer printed the item, and it varies enormously.**

### 3a. Method

Every string counted is produced by a **shipped renderer** over **shipped content**;
`tools/d355-reading-cost-harness/` invents no copy. Words are whitespace tokens, so a SAN, a square
name and a percentage each count as one. Reading rate is **238 wpm** — Brysbaert (2019), *How many
words do we read per minute? A review and meta-analysis of reading rate*, 190 studies / 18,573
participants, adult **silent** reading of **non-fiction** English
(<https://doi.org/10.1016/j.jml.2019.104047>) `[P]`. Non-fiction is the right arm and it is the
slower one; the fiction figure is 260 wpm.

**Every number below is a floor.** Mapping *"d5"* onto a board and checking it is work that a
reading-rate model does not price. Whatever the true cost is, it is above these.

Distance labels are assigned **per rendered family, syntactically**, by the criterion's own rule
(*does the item name a specific legal move in this position*), and the assignment table is in the
harness README so it can be disputed first. `move` items are measured for what they *would* cost:
`bestmove`/`bestline` is `refused` product-wide (`apps/server/src/capabilities.ts:96`).

### 3b. The result

| distance | items | median words | mean | p95 | median seconds @238 wpm |
|---|---|---|---|---|---|
| `kind` | 1,116 | **6** | 14.8 | 15 | 1.5 s |
| `fact` | 41,239 | **9** | 12.3 | 31 | 2.3 s |
| `ranking` | 149 | **63** | 104.1 | 230 | **15.9 s** |
| `move` | 768 | **1** | 1.3 | 6 | **0.3 s** |

`[V]`. Three readings, in order of how much they matter:

**1. The class explains almost nothing; the renderer explains almost everything.** η²(distance
class) = **0.201** over four classes and **0.038** over the three the product may ship today;
η²(rendered family, 33 families) = **0.984** `[V]`. ρ(distance rank, words) = **−0.046** over all
43,272 items, **−0.026** over family medians, **+0.125** and **+0.217** excluding `move`.

**2. The within-class spread swamps the between-class difference** `[V]`:

| distance | cheapest family | dearest family | range |
|---|---|---|---|
| `kind` | 6 words — the phase reading | **298 words** — the full shape panel | **50×** |
| `fact` | 4 words — `piece_count` | 31 words — `pawn_safe_square` | 8× |
| `ranking` | 12 words — the `human_divergence` marker | **230 words** — the corpus page | 19× |
| `move` | 1 word — `bestmove` | 6 words — a 6-ply `bestline` | 6× |

The *same* claim at the *same* distance costs 19–50× more or less depending on which renderer prints
it. A clock therefore makes an encounter's difficulty a function of **copy length**, and its
standing incentive is to compress evidence into verdicts — which is a move **down** the distance
axis, i.e. toward the eval-bar trainer `00-thesis.md` exists to replace.

**3. The ordering is inverted where it matters most.** `move` is the cheapest class in the product,
by a factor of **63×** against the median `ranking` item. Inside one 10+0 move budget (15 s) a
learner can read the answer **50 times over**, or **0.94** of one human-model split. A clock is a
gradient toward the answer.

**The one thing that can be said for the other side, stated plainly.** Excluding `move` — which is
refused today, so this is the *shipped* inventory — the class medians do order correctly (kind 6 <
fact 9 < ranking 63) and ρ is weakly positive. But η² = **0.038** says that ordering explains 4% of
the spread, and it is carried almost entirely by **one family**: the corpus page at 230 words.
Remove the corpus page and the effect is gone. A lever resting on one renderer's verbosity is not a
lever — and the interlock this dossier was asked to test **depends on the ordering surviving the
admission of `move`**, which is the very question `coaching-versus-cheating-and-the-band-curve.md`
§7 leaves to the owner. Under its option (c) — `move` purchasable pre-commit — a clock becomes a
**cheating amplifier** rather than a coaching filter.

### 3c. Per-family costs, for anyone sizing a loadout

| item | words | seconds | × a 15 s move budget |
|---|---|---|---|
| `bestmove` (refused today) | 1 | 0.3 s | **0.02×** |
| phase reading | 6 | 1.5 s | 0.10× |
| endgame reading (where present, 256 positions) | 8 | 2.0 s | 0.13× |
| median structural observation | 9 | 2.3 s | 0.15× |
| `pawn_safe_square` (the dearest `fact`) | 31 | 7.8 s | 0.52× |
| guided shape block (`DrillScreen.svelte:1028`) | 48 | 12.1 s | 0.81× |
| transition reading, whole, per ply | 54 | 13.6 s | 0.91× |
| human split, 20 candidates (`DrillScreen.svelte:1032`) | 63 | 15.9 s | **1.06×** |
| full shape panel (`ShapePanel.svelte`) | 298 | 75 s | **5.0×** |
| corpus page, 12 moves (43 real cached responses) | 230 | 58 s | **3.9×** |
| **all-on rung-0 structural reading, one position** | **978** | **247 s** | **16.4×** |

`[V]`.

---

## 4. Q3 — what a 10+0-shaped budget implies for the assistance that ships today

### 4a. The budget, derived rather than chosen

600 seconds is the whole game. The reference game length is **40 moves**, and it is not this
dossier's choice: **Lichess classifies a time control by `initial + 40 × increment`**
(<https://lichess.org/faq>) `[P]` — the platform whose 10+0 is being simulated already assumes 40
moves. So **15.0 s per learner move**, and at 238 wpm, **60 readable words**.

This threshold sits nowhere near any instrument's optimality boundary (`05` §3 clause 2) because no
instrument is consulted: the numerator is a published reading-rate meta-analysis and the denominator
is a published platform convention. Nothing here can coincide with what an engine calls best.

| clock allocation | s / learner move | words readable | `fact` items | `ranking` items |
|---|---|---|---|---|
| **uniform 10+0, 40-move reference game** | **15.0 s** | 60 | **6.6** | **0.94** |
| whole 600 s given to one median-horizon encounter (10 ply = 5 moves) | 120.0 s | 476 | 52.9 | 7.56 |
| whole 600 s given to one max-horizon encounter (40 ply = 20 moves) | 30.0 s | 119 | 13.2 | 1.89 |
| 3+0 blitz, 40-move reference | 4.5 s | 18 | 2.0 | 0.28 |
| 15+0 rapid, 40-move reference | 22.5 s | 89 | 9.9 | 1.42 |

`[V]`. Horizon census, re-run in this pass over all 89 pack-shaped documents: **47 declare
`authoredBoundary.plyHorizon`, median 10, mean 12.5, range 2–40** — unchanged from the campaign
dossier `[V]`.

### 4b. What does not fit, and it is not close

- The **all-on rung-0 reading at one node** is a median **978 words / 247 s** — **16.4×** the whole
  15 s per-move budget, p95 **1,273 words / 321 s** `[V]`.
- Reading it at **two** of a median encounter's five nodes costs **494 s: 82% of the entire
  600-second game**. At three nodes it exceeds the game.
- Even handing the **whole 600 s to a single median-horizon encounter** (120 s/move) leaves the
  all-on reading over budget **at one node** (247 s > 120 s).
- A **corpus page** alone is **3.9×** a move budget; a **human split** is **1.06×**; the **full shape
  panel** is **5.0×**.

**Fairness note the numbers require.** The shipped default is `SILENT_ASSISTANCE` — nothing is shown
(`05` §3a) — so the aggregate figures describe the **opted-in** states, not the default. A clock
would not tax the default. It would tax exactly the configurations the campaign's loadout lives in.

### 4c. The derived slot budget — the one durable result

D78 licensed the *existence* of a slot budget (all-on is measurably unreadable) and licensed
**nothing about the number**; the campaign's five-slot loadout is chosen, not derived. A 10+0-shaped
move budget derives one:

> **At 15 s per move a learner can read ≈6.6 `fact` items, or 0.94 `ranking` items.** The
> campaign's five-slot loadout costs **45 words / 11.3 s** and fits with a quarter of the budget to spare.

Two independent arguments — D78's measured readability floor and a 10+0 move budget — land on the
same order of magnitude (5–7 items). That convergence is worth more than either alone, and **the
clock is not needed to collect it**: the arithmetic holds whether or not any clock ever ships, and a
slot budget already implements it with no new field and no invariant touched.

### 4d. Two corrections to figures this repo quotes

**D78's headline moved, and the median is the wrong statistic for it.** The all-on state is now
measured at a median **78 observations per position** (47 packs, 609 positions) against Q8's **58**
(37 packs, 515 positions) — while the *mean* barely moved, **57.90 → 62.46** `[V]`. The distribution
is **bimodal by phase**, and the median sits in its gap:

- observation-count deciles: 27 · 31 · 33 · 37 · **78** · 85 · 87 · 88 · 92
- words per position by declared phase: **endgame 256 (65 s)** · cross-phase 985 (248 s) ·
  **opening 1,188 (299 s)** · **middlegame 1,199 (302 s)** `[V]`

So the single median is unstable to corpus growth and should be quoted **per phase**. The
qualitative conclusion gets *stronger*, not weaker: the all-on state is **4.6× worse** in the
middlegame — exactly the phase R4/R9 prove has no oracle — than in the endgame, where an exact one
exists.

**The compare strip is cheap per entry and expensive in bulk.** One strip entry as `CompareView`
renders it is **9 words / 2.3 s**; at the measured **8.31 entries per ply** `[P]` that is **75 words
/ 19 s per ply of comparison**, i.e. **1.25×** a whole move budget for one ply of one branch.

---

## 5. What the owner's sentence actually asks for — and the cheaper reading

> *"simulate the time pressure of a GREAT move during 10+0 chess **and then give actual time**"*

Two readings, with opposite costs. Both should be on the table because the second is the literal
one:

**(A) The ENFORCED clock.** The learner's own clock runs and a flag-fall seals something. This is
what D331 asks about. §2 clears it doctrinally in its attempt-scoped form; §3 refuses it as an
assistance lever.

**(B) The DEPICTED clock.** The encounter *states* the recorded time the original decision was made
under — *"this was played with 24 seconds left"* — and the learner takes as long as they like. That
is *simulate the pressure, then give actual time*, word for word. It touches no invariant, prices
nothing, sells nothing back, and is a **recorded fact**, so law 8 is clean.

**But (B) has a hard grounding constraint, and it currently bites** `[V]`. `05` §1's *"Absence is
stated, never simulated"* means a depicted clock may only show a reading the product actually has.
Today:

- `parsePgnMainline` keeps **headers whole** — `Object.fromEntries(game.headers)`,
  `apps/server/src/pgn-import.ts:63` — so `TimeControl` survives into `ImportedGameRecord.headers`.
  The *game's declared control* is already importable.
- But each move is reduced to `{san, uci}` (`pgn-import.ts:54`), **dropping the per-move `[%clk]`
  comments Lichess emits on every move**. So the clock **at the moment of the move** — the thing the
  owner's sentence is about — is one retained field away and is not available today.

**And *"a GREAT move"* is not expressible either.** Nothing in this product grades a move
(`coaching-versus-cheating-and-the-band-curve.md` §3, and law 8). The nearest shipped object is
`storyMoments`, which selects on a **≥150 cp recorded swing** (`STORY_PIVOT_CP`,
`packages/runtime/src/story.ts:30`, applied `:86`) and renders *"The recorded evaluation moved +X cp
across this move"* — a **change**, not a verdict `[V]`. So the honest encounter is *"the move at
which the recorded evaluation moved 150 cp, played with 24 seconds left"*: two recorded facts, no
chess claim. That is a legal and, on this evidence, considerably more interesting object than a
countdown.

---

## 6. What would falsify each

Stated with the population named before the threshold, and with every threshold placed off its
instrument's optimality boundary (`05` §3 clause 2) — trivially satisfied here, because no arm
consults an engine.

| # | Claim | Falsifier | Threshold, and why it is off the boundary |
|---|---|---|---|
| **F1** | **Reading cost does not track distance to the answer** | Already measured `[V]`: η²(distance) = 0.201 / 0.038 against η²(renderer family) = 0.984 over 43,272 items. Revived only by a re-render pass that equalises verbosity *within* each class | The axis becomes a cost lever iff **η²(distance) > η²(family)**. Stated as a comparison of two decompositions of the same variance, so no cut point is chosen at all |
| **F2** | **A clock shifts consumption toward the answer rather than suppressing it evenly** | Same encounter, loadout carrying one item at each distance, arms {no clock, 15 s/move}. Measure which items the learner **opens**, not which are available. Owner n-of-1 first | A neutral clock predicts equal open *rates*; the cheating gradient predicts open rate rising for the cheap classes. Fails if the shift toward `kind`/`move` is **< 20 pp**. The 20 pp is derived from the measured cost ratio (6.6 `fact` vs 0.94 `ranking` readable per move), not chosen |
| **F3** | **An attempt-scoped clock is not a retry price** | Mechanically decidable, not empirical: run *k* retries and check the *k*-th attempt's budget equals the first's | Binary. It fails the instant any implementation stores the budget **above `Node`** — which is also the review rule §8 asks for |
| **F4** | **A clock is a difficulty lever at all** | Same encounter, same band, same loadout, clock ∈ {none, 15 s/move, 4.5 s/move}; measure objective survival on the submitted branch | Fails if survival is flat within **±10 pp**. Fails *usefully* if the clock changes outcomes only by producing **flag-falls** rather than worse moves — that makes it a timer, not a difficulty lever, and the distinction is the whole question |
| **F5** | **The readable loadout is ≈6 items** | Loadout size ∈ {3, 6, 12} under a 15 s/move budget; count items actually opened per move | Fails if opens do not saturate near 6. Saturation, not a cut point: the prediction is a *shape*, so no threshold is smuggled |
| **F6** | **A depicted clock can be grounded** | Count `[%clk]` presence over imported PGNs once `pgn-import.ts` retains comments | Fails if a material share of imports lack per-move clocks — in which case (B) inherits an **abstention path** (`05` §1) rather than a feature, and should be scoped as one before it is built |
| **F7** | **D78's "median 58" should be quoted per phase** | Already measured `[V]`: 78 on 47 packs against 58 on 37, mean 57.90 → 62.46, deciles 27·31·33·37·**78**·85·87·88·92 | The median moved 34% while the mean moved 8%. A statistic that unstable to ten more packs is the wrong summary for a bimodal distribution; the per-phase medians are the stable statement |

---

## 7. Traps checked

- **The population decides the answer.** Named first and in full: 47 packs / 721 transitions / 609
  positions (the current corpus, matching R11's count), 25 shape entries, 43 real cached explorer
  responses, 105 recorded Maia candidate counts, 89 pack-shaped documents. And the **configuration**
  is named too, which is the version of this trap that bites here: the aggregate figures are the
  **all-on** state; the shipped default is `SILENT_ASSISTANCE` and costs **0 words**.
- **A measurement can smuggle a verdict; a threshold must sit off the instrument's optimality
  boundary.** The reading rate is a published meta-analysis; the move budget is Lichess's own
  `initial + 40 × increment` convention; the readable-loadout figure is division. **No engine is
  consulted anywhere in this dossier**, so no threshold can coincide with what an instrument calls
  optimal. F1 and F5 are stated as a variance comparison and a saturation shape, with no cut point.
- **`timingWindows` is MOVE-COUNT tempo and `clock_zeroed` is the HALFMOVE counter.** Kept distinct
  and both re-verified against source, and the harness records that `clock_zeroed` fires **0 times
  in 721 transitions** — the only clock-named renderable sentence in the product is dead code (§2d).
- **Rarity is not value (ρ = −0.143).** Nothing here prices an item by how often it fires; cost is
  measured in words. The one place firing rate enters is the compare strip's 8.31 entries/ply, and
  it enters as a *volume* multiplier, not as a value claim.
- **The all-on state is the unreadable one (D78).** Mined rather than cited: re-measured, worsened
  (median 78 observations / 978 words / 247 s), decomposed by phase, and its headline statistic
  corrected (§4d, F7).

---

## 8. The owner question

**The reasoning, first.** The doctrinal obstacle clears, and more cleanly than expected: the object
`06` §5 refuses is the **run-pooled** clock, which is a rewind budget with a real-valued counter, and
the reserved `clockState` field is declared on `Node` — so the refused version is not expressible in
the field that exists, and telling the two apart is a one-line review rule rather than a judgement
call. But the *reason* to want the clock does not survive the measurement. Reading cost is **98.4%**
a property of which renderer printed an item and **3.8%** a property of its distance from the answer,
and the single cheapest thing this product could ever print is the answer itself — **1 word, 0.3 s**,
against a human-model split's **63 words, 16 s**. A clock would not degrade assistance in the order
the hypothesis needs. It would degrade it in the order of copy length, and its standing incentive
would be to compress evidence into verdicts. The one durable thing the arithmetic delivers is a
number the campaign was missing: at a 10+0-shaped budget of 15 s per move a learner can read **≈6
`fact` items or ≈1 `ranking` item** — the slot budget D78 licensed without a number — and a slot
budget already delivers it, with no clock, no new field and no invariant touched.

**The question: what is time in this product — nothing, a decoration, or a rule?**

- **(a) Nothing. Close the cluster and delete the reserved field.** *Consequence:* the schema stops
  carrying a promise nothing plans to keep — `clockState` is six non-test references, all
  passthrough, with `additionalProperties: true`, so today it will accept and persist literally
  anything a client sends; the derived ≈6-item figure is banked as a slot-budget number and D330/D331
  close. *Cost:* the owner's 10+0 question is answered "no", and the one candidate lever that
  constrains the **learner** rather than the product is given up on the record. **Recommended if the
  answer to (b) is not yes.**
- **(b) A decoration: the DEPICTED clock** — recommended, and the literal reading of the owner's own
  sentence. The encounter states the recorded time the original decision was made under, and the
  learner takes actual time. *Consequence:* one retained field in `parsePgnMainline` (the `[%clk]`
  comments dropped today at `pgn-import.ts:54`) plus a renderer; touches no invariant, no honesty
  gate, no inventory and no refused-list entry; it is a recorded fact, so law 8 is clean, and
  *"absence is stated, never simulated"* gives it an honest abstention when a PGN carries no clocks.
  Pairs naturally with `storyMoments`' ≥150 cp swing, since *"a GREAT move"* is not expressible and
  *"the move at which the recorded evaluation moved 150 cp, played with 24 seconds left"* is.
  *Cost:* it is atmosphere and must be **sold** as atmosphere — it will not make a run harder, and
  the failure mode is a decoration quietly becoming a requirement.
- **(c) A rule: the ENFORCED, attempt-scoped clock.** The budget resets at the fork, and a flag-fall
  seals the submitted branch under `06` §5's existing verb — so no new refusal class, counter or
  currency is needed. *Consequence:* it is admissible; the refused object is the run-pooled clock,
  not this one. But it **amends `06` §5 twice** — the refused list loses a word, and the
  power/legibility dichotomy gains a third axis (a clock escalates neither; it shrinks the learner's
  own capacity) — and the measurement says its effect on the assistance economy is a gradient
  **toward** the answer, sharply so under the coaching dossier's option (c), where `move` becomes
  purchasable pre-commit. *Cost:* **a run-pooled budget must be refused in the same ruling**, or the
  design drifts back into the retry price by accident; the difference between the permitted and the
  refused object is one field's altitude, and nothing today would catch it. Listed with its
  consequences rather than as a bare option because it is the version the question most naturally
  reads as, and the version the evidence least supports.

**A second ruling rides along and is cheap either way.** D78's headline — *"median 58 observations
per position"* — is **78** on the current 47-pack corpus, while the mean moved only 57.90 → 62.46;
the distribution is bimodal by phase and the median sits in its gap (endgame **256 words / 65 s**,
middlegame **1,199 words / 302 s**). Whether or not any clock ships, **the per-phase figures should
replace the single median wherever D78 is cited** — and the all-on state's real headline is the one
this pass measured: **978 words, 247 seconds, 16.4× a 10+0 move budget, at one node.**
