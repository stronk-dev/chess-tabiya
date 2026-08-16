# Fun mechanics outside roguelikes — drip, experimentation, and fun without a power curve

**Question (owner, 2026-08-15/16):**

> *"even if the drills are poor for the campaign, there MUST be novel gamemodes, variations,
> minigames, puzzles, ANYTHING out there with which we can enhance the campaign mode… we might
> want to explore OTHER gameplay ideas… from idle games to stardew valley to other
> roguelikes… ANYTHING that's fitting for chess, but allowing people FUN in the campaign
> runs… and EXPERIMENTATION while LEARNING."*

`design/research/roguelike-run-design.md` studied six roguelikes and asked what *shape* a run
should have. This dossier is the deliberate widening: **fifteen genres outside the roguelike,
plus the chess-adjacent formats that already exist**, against three questions the campaign
cannot answer from inside the genre it borrowed its frame from —

1. **What mechanics drip-feed CONTENT enjoyably**, rather than gating it?
2. **What makes EXPERIMENTATION fun rather than dutiful**, when the thesis has already made it
   free?
3. **What creates fun WITHOUT a power curve?** — the hard one, and the one the roguelike set
   is structurally the *wrong* place to ask, because every game in it has a power curve.

It also tests the owner's own read of the content unit (*"drill packs are micro-DLC"*) against
the shipped code, and finds it is right about the *role* and one level off about the *grain*.

**Working method, per the standing adoption posture** (`design/02`, owner amendment
2026-08-14): a collision with an invariant is a **design prompt, not a veto**. Every mechanic
below that collides with a law gets its invariant-compatible transformation designed rather
than filed as refused. Refusal is last resort and carries an argument. Two mechanics are
refused here and both refusals are arguments, not shrugs.

**One sentence.** The genres that solve *fun without power* solve it with exactly three
devices — **score the solution not the outcome**, **make knowledge the key**, and **buy
variety with setup selection rather than progression** — and this product already owns
runnable versions of all three, two of them sitting in shipped code with **zero consumers**;
the drip question is answered not by a new economy but by the **daily-cadence + shareable-shape
pattern** and by a **collection axis that is authored, stored, indexed and switched off by one
injectable class**; and the campaign's unit is **the run, not the pack** — the runtime says so
in a three-value type, and the owner's micro-DLC framing is correct with the pack as a
*contribution to a node* rather than as the node.

---

## Method, and its limits stated first

1. **Repo claims are `[V]`**, derived in this pass at `c55b9cf` and **re-checked at `bae0a90`**
   after twelve commits landed mid-pass — 47 packs, the 20/11/14/2 phase split and the 330/189
   deviation/checkpoint counts are unchanged, and `RunSessionKind`, `AssistancePermission` and
   `permittedAssistance` are byte-identical. Pack counts are a Python walk
   over `content/drafts/*.json`, canonical packs = those declaring a `phase`, with
   `.evidence.json` / `.job.json` / `.sources.json` sidecars and `.browser.json` fixtures
   excluded — the **same selection** `campaign-effect-vocabulary.md` §Method,
   `roguelike-run-design.md` §2c and `campaign-intermediate-consequence.md` §Method used, so
   the counts are directly comparable to theirs. Several of theirs have moved; §1 says which
   and by how much.
2. **Every external game fact is `[P]`** — wikis, developer talks and community sources,
   checked in this pass against the cited URL, not against a play session. Where a number is
   community consensus rather than a rule, it is marked as such.
3. **No hands-on with any comparison game in this pass**, the same limit the two predecessor
   dossiers declared.
4. **Nothing here is measured about our learners.** Every claim about how a mechanic would
   *feel* is `[M]` and is exactly what R6/R7/R8 gate. A mechanic's "what would kill it" line is
   the falsifier, not a hedge.
5. **Deliberate exclusion:** monetary design. Gacha is mined for its *anticipation and
   rotation* mechanics only; ADR-0007 makes the monetary half unavailable and uninteresting.

---

## 1. Fact refresh — nine numbers the campaign cluster is reasoning with have moved

This section exists because the campaign cluster's three prior dossiers all rest on a
37-pack corpus, and two of their **load-bearing cost arguments are now discharged**. All `[V]`
at `c55b9cf`.

| Quantity | Prior dossiers | Now | Consequence |
|---|---:|---:|---|
| Canonical packs | 37 | **47** | Catalogue arithmetic below |
| **Middlegame packs** | **1** | **11** | **`06` §5's *"Act II is impossible today"* is discharged** |
| Packs by phase | 20/1/14/2 | **20 opening / 11 middlegame / 14 endgame / 2 cross_phase** | A phase-shaped map is now buildable |
| Packs by mode | line 20 · outcome 17 · plan 1 · traj 4 | **line 20 · outcome 13 · plan 11 · trajectory 3** | `BACKLOG:627` (*"Plan Drill is essentially UNAUTHORED"*) is **stale** |
| Deviations / checkpoints | 275 / 145 | **330 / 189** | Read-once content decay (§4c of the predecessor) scales with it |
| `authoredBoundary.plyHorizon` declared | 36 of 37 | **46 of 47**; median **10.5**, mean **12.8**, range **6–40** | Device D still shipped; the median *fell* because the 10 new middlegame packs declare 6–10 |
| Shape entries referenced by ≥1 pack | 16 of 25 (D44: 9 orphans) | **21 of 25** — orphans are `hanging-pawns`, `knight-vs-bishop`, `up-an-exchange`, `vancura` | **D44 shrinks from 9 to 4** |
| `timingWindows` authored | **0** | **4** | `BACKLOG:634`'s "four vocabularies with zero usage" is down to two |
| `variantOf` authored | **0** | **2** | Same |

The middlegame move landed in one commit — `aee7c64`, *"content: ten middlegame packs — Act II
is no longer one pack"* `[V]`. **All eleven middlegame packs declare `targetElo: 1800` and
`mode: "plan"`**, and their objectives now span five kinds (`reach_structure` 5,
`preserve_plan_window` 4, `execute_break` 1, `prevent_opponent_plan` 1) where the corpus
previously had one. Per-phase `plyHorizon` medians are **opening 11 · middlegame 8 · endgame 24
· cross_phase 10**.

**What this changes for the campaign, stated plainly.** `roguelike-run-design.md` §5b item 3
priced Act II at **2.2 agent-hours** (or 3.25 with route choice) and called it *"the price of
Act II existing at all"*. That bill is paid. The 9-node / 3-act shape's one content
prerequisite is met, and the binding constraint moves from *authoring* to the two things §5b
lists as **plumbing** — server-held inventory and per-lens grain. **The 9-node recommendation
should be re-derived rather than inherited**: 9 nodes is now **19.1%** of a 47-pack catalogue
(**5.2 runs** before repetition, up from 4.1), and even 15 nodes is 31.9% / 3.1 runs. The
catalogue argument for nine over fifteen has weakened; the *decay* argument (§4c) and the
minutes argument have not.

**And one number moved the wrong way for the drip question.** `content/packs/` contains
**only `.gitkeep`** — every one of the 47 packs is a *draft*, all 47 carry
`provenance.graduationBlockers` (**240 entries**), and production therefore serves **one** pack,
the schema example (`rfc/pack-graduation.md` §Exploration gate, ledger row D162) `[V]`. So the
product already has a **content release gate with a three-state lifecycle**
(`schema_example | draft | published`) and 47 items behind it. That matters for §2: the drip
question is asking for a *second* gate, learner-facing, and building it on the first would be a
category error. They have the same shape and different owners.

---

## 2. The constraints, extended — and three shipped assets nobody has counted

`campaign-intermediate-consequence.md` §1 enumerated **C1–C10** from the live docs and derived
a residue: only three kinds of consequence survive — denominated in the learner's
**information**, in **the position itself**, or in **self-inflicted opportunity cost**. That
set is inherited here unchanged and every mechanic below is checked against it. This wave adds
four constraints that the wider genre sweep makes load-bearing and that the roguelike frame
never surfaced.

| # | Constraint | Source | What it forbids |
|---|---|---|---|
| **C11** | **Our readable content is finite and read-once.** 330 deviation notes + 189 checkpoints over 47 packs; a Jaw Worm is the same fight the fortieth time, a deviation note is not | `roguelike-run-design.md` §4c, recounted `[V]` | Any drip whose *supply* is authored prose, unless the drip is priced against that supply |
| **C12** | **The run, not the pack, is the runtime's unit.** `RunSessionKind = "pack" \| "position" \| "imported"` (`packages/runtime/src/types.ts:36`) — two of three carry no pack | `[V]` this pass | Any campaign design that assumes a node ⇒ a pack; and any that assumes a pack-less node can be **graded** (see §7) |
| **C13** | **Nothing is published.** `content/packs/` = `.gitkeep`; 47 drafts, 240 `graduationBlockers` | `[V]`, `rfc/pack-graduation.md` | Any learner-facing unlock gate that reuses the *authoring* gate's states |
| **C14** | **Variants are a named, published refusal, not an omission.** `UCI_Chess960` is `disposition: "refused"`, reason *"The shipped drill format is standard chess only"* (`apps/server/src/capabilities.ts:105`) | `[V]` | Adopting a chess variant as a minigame without amending a published capability refusal — the refusal is category (B) of the audit's "100%" definition, so changing it is a *documented* act, not a free one |

### 2a. Three assets that already ship, and are not in any campaign document

Each of these makes a mechanic below cheap, and none is cited by `06`, by
`campaign-effect-vocabulary.md` or by `roguelike-run-design.md`.

**(i) The capability suppressor ships end to end — not "architecturally", literally.**
`roguelike-run-design.md` rank 3 called the Balatro boss blind *"architecturally the same shape
as something already shipped"*. It is stronger than that. `AssistancePermission` is
`"free" | "locked_off" | "sight" | "evidence"` (`packages/runtime/src/assistance.ts:20`) — a
**suppression value in the shipped type** — with all three layers behind it:

- the **producer**: `permittedAssistance` returns `locked_off` for `humanSplit`/`corpus`
  whenever `role` is not solo/host or `deliveryOpen` is false (`assistance.ts:29`);
- the **server refusal**, by name: `ASSISTANCE_WITHHELD` thrown at `rest.ts:1090` and `:1107`,
  plus a third enforcement at `service.ts:826`;
- the **honest UI sentence**: the control renders disabled with
  *"Available only after this run opens feedback, and never to participants or spectators."*
  (`apps/web/src/lib/DrillScreen.svelte:717-720`) `[V]`.

`AssistanceContext` has exactly **three** fields — `sessionKind`, `deliveryOpen`, `role`. A
boss suppression is one more input. **But it must not be a fourth field on that function**, and
this is the design constraint this pass contributes: `permittedAssistance` is the **honesty**
gate (`06` §3 law 1 — honesty outer, inventory inner), so putting a *game* rule inside it would
make a campaign decision indistinguishable from an honesty decision, and the learner would be
told a lie in the shape of a truth. The transformation: an **inner-gate mask** that composes
with `permittedAssistance`, reuses the `locked_off` value and the `ASSISTANCE_WITHHELD` error
code, and carries **a different sentence** — *"this encounter withholds X"* is a game statement
and *"X is not honestly available here"* is an honesty statement, and one screen must never
render them identically.

**(ii) A five-kind variety vocabulary is authored, validated, counted, and consumed by
nothing.** `RETRY_VARIANT_KINDS = ["same_root_new_defense", "alternate_plan_class",
"related_position_same_idea", "opposite_side", "different_material_details"]`
(`packages/schema/src/drill-pack/types.ts:27-33`). **9 variants across 7 of 47 packs** are
authored `[V]`. The only consumers repo-wide are the schema barrel and a `pack-check` *counter*
(`apps/server/src/pack-check.ts:24`, `:83`) — no runtime, no client, no route. This confirms
`campaign-effect-vocabulary.md` §2c's finding at the larger corpus and sharpens it: those five
strings are a **Dominion kingdom** (§5c) sitting in the schema, i.e. *the same board asked a
different question*, which is precisely the fun-without-power device.

**(iii) The cross-pack collection axis is authored, stored, indexed — and namespaced apart by
one injectable class.** Packs declare `concepts`: **186 tags, 156 distinct across 47 packs**,
of which only **24 appear in ≥2 packs** (`advance-chain-base` in 6, `break-timing` and
`arrangement-before-action` in 3) `[V]`. They reach a real table — `attempt_concepts(run_id,
branch_id, pack_id, concept_key, label)` with an index on `concept_key`
(`apps/server/src/storage.ts:2529-2538`) — and two live queries join it. **But the default
resolver is `PackScopedConceptResolver`, whose key is literally ``pack:${packId}#${raw}``**
(`apps/server/src/progress.ts:56-59`), so `advance-chain-base` in six packs is **six distinct
keys**, and the related-attempt query is additionally scoped `AND a.pack_id = ?`
(`storage.ts:1388-1393`). `ConceptResolver` is an **injectable interface**
(`progress.ts:52-54`), so a corpus-global resolver is a one-class change.

> **Read those three together and the shape of this dossier's answer is already visible.** The
> suppressor, the variety vocabulary and the collection axis are the three devices §5 will
> identify from outside chess entirely — and all three are shipped, unused, and cost plumbing
> rather than content.

---

## 3. Question 1 — what drip-feeds CONTENT enjoyably, and what is only a gate

The owner's framing: *"the campaign mode is meant to be a FUN way above all else to drip feed
content."* The genres that do this for a living are legacy board games, idle/incremental games,
farming sims and MMOs — and across all four the pattern is consistent enough to state as a rule
before the mechanics: **a good drip sequences content that was authored up front; a gate
withholds content the player has already earned the right to.** Every mechanic below is a
variation on that line.

### D1 · Withhold RULES, not power — *Pandemic Legacy*, *SETI*, *Universal Paperclips*

*Pandemic Legacy: Season 1* ships its rulebook with holes in it: *"Some rules, labeled A through
Y, are missing throughout these rules. As you play, you will gain these missing rules"* — **25
lettered rules delivered as unlocks** — alongside 8 sealed boxes and 5 dossiers opened only when
*"yellow boxes will instruct you to open specific packages"*
([UltraBoardGames](https://www.ultraboardgames.com/pandemic/legacy-season-1.php)) `[P]`. *SETI*
does the same **within a single session and with no permanence**: 5 alien species in the box, 2
chosen per game, face down until discovered, each carrying *"its own rule subset — almost like a
mini-game"*
([Tabletop Gaming](https://www.tabletopgaming.co.uk/reviews/seti-search-for-extraterrestrial-intelligence-board-game-review/)) `[P]`.
And *Universal Paperclips* — the most-cited example of a game that reveals whole new systems
rather than bigger numbers — **ships every system's label in the initial HTML**: `Trust`,
`Creativity`, `Swarm Computing`, `Quantum Computing`, `Strategic Modeling`, `Yomi`, `Combat`,
`Honor`, `Von Neumann Probe Design` and ~27 more are all present at load and hidden until
revealed ([the game itself](https://www.decisionproblem.com/paperclips/index2.html)) `[V]` —
authored up front, sequenced, never generated.

- **Prices:** nothing.
- **Rewards:** the arrival of a *new kind of decision*, which is the only reward in the genre that
  does not decay.
- **Why it's fun:** the game gets **bigger**, not the player stronger — so nothing is invalidated
  and nothing is a treadmill.
- **Collides with:** **law 8** if a "rule" is a strategic claim, and **C11** because our rule-like
  objects are finite.
- **Transformation:** our unlockable "rule" is a **lens** — a rule of *reading*, not of chess —
  and the Paperclips finding is the important one for law 8: **a drip-feed does not require
  generating content, only sequencing pre-authored content.** The whole vocabulary already
  exists: 18 structural feature kinds, 6 transition primitives, 25 shape entries, 9 objective
  types, 5 opponent modes, 5 retry-variant kinds. Revealing them in an order is a sequencing
  problem with zero authoring cost. *SETI*'s form matters too — **a reveal that resets** costs no
  permanence and no server-held state, and is therefore the cheapest possible v1.
- **What would kill it:** the reveal set has to be *worth* revealing. D78's noise floor is the
  standing test — a lens that fires on 99.8% of transitions at 1.01× lift is not a new rule, it
  is more fog, and revealing it ceremonially would make the ceremony the product.

### D2 · Unlock by PLAYING, never by WINNING — *My City*, *Balatro*, *Dicey Dungeons*, *Dungeon World*

This is the most consistent finding in the whole sweep, across four unrelated systems. *My City*:
*"Each chapter of 3 games comes with a secret envelope full of new buildings, cards and stickers"*
— **24 games, 8 chapters, drip on game count alone**
([Knizia](https://www.knizia.de/my-city-our-legacy-game/)) `[P]`. *Pandemic Legacy* advances after
two failed attempts **regardless of outcome** `[P]`. *Dicey Dungeons* unlocks its first three
episodes when *"you must play a game as each of the first five contestants, regardless if you win
or not"* ([Dicey wiki](https://wiki.diceydungeons.com/doku.php?id=episodes)) `[P]`. *Balatro* ships
**105 of 150 jokers available on the first run** and unlocks the rest on *behaviour* — Acrobat:
*"Play 200 hands"*; Swashbuckler: *"Sell a total of 20 Joker cards"*; and **Mr. Bones: "Lose 5
runs"** ([Balatro wiki](https://balatrowiki.org/w/Jokers)) `[P]`. *Dungeon World* makes it a die
roll: **6 or lower** is *"trouble, but you also get to mark XP"*
([DW SRD](https://www.dungeonworldsrd.com/playing-the-game/)) `[P]`.

> **Losing is a legitimate unlock currency in almost every system surveyed.**

- **Prices:** nothing; participation is the whole cost.
- **Rewards:** showing up, and *specifically* showing up to something that went badly.
- **Why it's fun:** it removes the one thing that makes a drip feel like a gate — the possibility
  of being stuck.
- **Collides with:** nothing. It **sharpens ADR-0007** rather than colliding with it.
- **Transformation, and it wants to be a standing clause:** ADR-0007 currently reads *progression
  is unlocked by playing, never purchased*. The evidence says the second half needs a twin —
  **unlocked by playing, never by winning.** That matters *now*, because `06` §5's accepted
  ruling gives the campaign a failure state (the submitted attempt decides the run), and the
  natural next step — gate the next lens on clearing the boss — is exactly the mistake every
  system above avoided. The honest form: **the run can be lost; the catalogue cannot be locked.**
- **What would kill it:** if unlock-by-participation makes the unlock meaningless — *Balatro* gets
  away with it because 45 locked jokers sit behind 105 free ones, so the drip is garnish on an
  already complete game. If our v1 ships with most lenses locked, the same rule produces a worse
  experience than shipping them all unlocked.

### D3 · Retirement — *Gloomhaven*, and the answer to our content decay

A Gloomhaven character is dealt two secret personal quests and keeps one; *"When a personal quest
is completed, the character will retire"* — **mandatory, irreversible, and it happens at full
power** ([rules](https://raw.githubusercontent.com/m-ender/gloomhaven-rules/master/README-no-images.md)) `[P]`.
Retirement *"unlocks content, usually a new class"*, available to anyone; the box holds **17
classes, 6 starting and 11 locked, plus 24 personal quests and 3 sealed envelopes** `[P]`. The
softening detail: each retirement grants that player **a cumulative extra perk** on all future
characters `[P]` snippet-level — so the reset is survivable.

- **Prices:** the character you built. Voluntarily and on a schedule you chose.
- **Rewards:** new content for *everyone*, and a permanent thin thread across the reset.
- **Why it's fun:** finishing something is a stronger feeling than optimising it, and the game
  gives you a reason to stop.
- **Collides with:** **C1** if retirement is framed as losing something you would rather keep.
- **Transformation, and it is the direct answer to C11.** Our packs *decay* — once you have read a
  pack's deviation notes the encounter is a thinner object, and 330 notes over 47 packs is a
  finite supply `[V]`. Gloomhaven's insight is to **make the decay the mechanic**: a root that has
  given you everything it has *retires* from your rotation, and retiring it unlocks the next one.
  The producer exists — the scheduler already carries `root_key`, a due date and an origin
  (`apps/server/src/storage.ts:1338`) `[V]` — so "this root is finished" is a state the return
  loop can already hold. And the thin permanent thread is exactly `Service.milestones()`, which
  today mints 7 lifetime events and could mint one per retirement instead.
- **What would kill it:** *"finished"* has to be honest. Defining it as "objective achieved N
  times" is a **win-gate** and collides with D2; defining it as "you have seen all this pack's
  authored deviations" is a **coverage** fact, computable from the run log against
  `deviations[].moveUci`, and is the version that survives. If neither is measurable the mechanic
  is a timer with a costume.

### D4 · Put the "what's missing" mark on the ARTIFACT, not on a progress screen

*Guild Wars 2* collections stay hidden until you touch a member item, and then *"Any item that is
part of a collection will have it noted in its description, so long as the collection is
unlocked"* — and the note **disappears once collected**
([GW2 wiki](https://wiki.guildwars2.com/wiki/Collections)) `[P]`. *Stardew Valley*'s Community
Center does the same physically: **6 rooms, 30 bundles**, each an empty slotted board shaped like
the missing items, with room rewards that change the world — the Vault opens the desert bus, the
Boiler Room opens the minecart network
([Stardew wiki](https://stardewvalleywiki.com/Bundles)) `[P]` snippet-level. Its museum runs on
plain thresholds: **95 donatable items, 60 → sewer key, 95 → Stardrop**
([Stardew wiki](https://stardewvalleywiki.com/Museum)) `[P]` snippet-level.

- **Prices:** nothing.
- **Rewards:** noticing. The affordance does the work, not a reminder.
- **Why it's fun:** you discover the collection **through** the object rather than being handed a
  checklist, so the world stays the subject.
- **Collides with:** **`06` §3 law 6** — anything surfaced unasked obeys the live-surface
  admission rule (L1–L6) — and with `05` §3a's silence default.
- **Transformation:** the producer ships and is currently pointed at the wrong surface.
  `shapeRecommendations` computes shapes the learner has **met but never drilled** over the last
  50 runs, rung-0 arithmetic with a provenance sentence, `.slice(0, 10)` — and its only
  consequence is *a sentence plus a button to `/play`* (`apps/server/src/service.ts:758-777`)
  `[V]`. GW2's design says: put the mark **on the pack card and the shape entry**, and remove it
  when satisfied. That is a rendering change over a shipped computation, and it satisfies the
  silence default because it annotates an object the learner is already looking at rather than
  interrupting play.
- **What would kill it:** the collection has to be a **set**, and ours mostly is not — 156 concepts
  with 132 singletons (§2a(iii)), and 21 of 25 shapes attested. A "collection" of 132 things that
  appear once each is a table of contents. **The shape library is the honest collection today;
  concepts become one only after a vocabulary convention and a corpus-global resolver.**

### D5 · Milestones beat currencies for reveals — *Cookie Clicker*, *Stardew*, *Fire Emblem Heroes*

*Cookie Clicker* gives each building **15 tiered upgrades unlocked by owning N of that building**,
each *"double the production of that building"*
([Cookie Clicker wiki](https://cookieclicker.wiki.gg/wiki/Building)) `[P]`. *Stardew*'s museum
thresholds are 60 and 95 `[P]`. *Fire Emblem Heroes* layers a deterministic floor on a random
drip — **Spark at 40 summons** lets you *"freely choose any focus hero"*, and at **120** summons
without a 5★ the next is guaranteed
([FEH wiki](https://feheroes.fandom.com/wiki/Summon)) `[P]` snippet-level.

- **Prices:** nothing — a count is not a currency.
- **Rewards:** recognition. *"You did the thing N times"* reads as being seen; *"you have N
  money"* reads as a tax you paid.
- **Why it's fun:** counts are honest, monotone and cannot deliver bad news.
- **Collides with:** **`06` §3 law 5** if the threshold is set by rarity, and **C4** if the
  thresholds escalate geometrically (that is Balatro's ante climb, refused).
- **Transformation:** our milestone surface is the thinnest thing in the campaign —
  `Service.milestones()` mints exactly **7 kinds, all first-time-only** (`first_attempt`,
  `first_stable`, `first_objective_achieved`, `first_win`, `first_scheduled_return`,
  `ten_attempts_one_root`, `first_flip_sides`) — **at most seven events per learner, ever**
  (`apps/server/src/service.ts:592-601`) `[V]`. The cheap upgrade is *counts over the shape and
  concept axes*, which already have a table and an index (`attempt_concepts`, §2a(iii)):
  "you have now played five positions with an isolated queen's pawn". Flat thresholds only —
  and note the one milestone that is already a *count* rather than a first,
  `ten_attempts_one_root`, celebrates **ten attempts on one root**, i.e. the product already
  celebrates exactly the behaviour the thesis sells.
- **What would kill it:** thresholds invite optimisation. `ten_attempts_one_root` is safe because
  ten attempts is the behaviour we want; a threshold on *wins* would be a win-gate (D2) and a
  threshold on *lens usage* would collide with law 5 and with the hint tax.

### D6 · Gates that forgive — WoW attunement, FFXIV's Echo, HSR's reserve

*World of Warcraft* built its content drip on **attunement** — *"the process of gaining permanent
access to an instance"* via quest chains — and then **deleted it**: *"This strategy has largely
been phased out"*, removed in 2.4.0, 3.0.2, 4.0.3a and 5.4.0
([Warcraft wiki](https://warcraft.wiki.gg/wiki/Attunement)) `[P]`. *FFXIV* took the other route
and kept the sequence while removing the punishment — the **Echo** is a flat buff applied to
*old* content so latecomers clear it, *"added when they are no longer new"*
([FFXIV wiki](https://ffxiv.consolegameswiki.com/wiki/The_Echo)) `[P]` snippet-level, on a
published **4.5-month / 19-week** major-patch cadence
([FFXIV wiki](https://ffxiv.consolegameswiki.com/wiki/Patches)) `[P]`. *Honkai: Star Rail* does
the same to its stamina gate: overflow accrues into **Reserved Trailblaze Power, 1 per 18 minutes
to a cap of 2400**, so lapsing does not destroy accrual
([HSR wiki](https://honkai-star-rail.fandom.com/wiki/Reserved_Trailblaze_Power)) `[P]` snippet-level.

> **The pattern, stated as a rule: keep the sequence, remove the punishment for arriving late.**

- **Prices:** nothing, by construction — that is what "forgiving" means.
- **Rewards:** returning after a lapse without a penalty screen.
- **Why it's fun:** it is the only mechanic in this section whose value is *negative* — it removes
  a bad feeling rather than adding a good one, and every one of these three companies paid to
  learn it.
- **Collides with:** nothing today, and that is precisely why it is worth writing down **before**
  the campaign has a schedule.
- **Transformation:** we already have the surface that will be tempted — the varied-repetition
  scheduler holds a **due date** (`schedules.due_at`, `apps/server/src/storage.ts:1338`) and one
  of the seven milestones is `first_scheduled_return` `[V]`. A due date that has passed must never
  read as a debt. HSR's reserve is the design to copy: **the lapse accrues, it does not accuse.**
- **What would kill it:** nothing kills it; it is a constraint on other mechanics rather than a
  mechanic. Its failure mode is being forgotten, which is why it is a ledger row.

### D7 · One shared puzzle a day, and a share artifact you did not design — *Wordle*

Six guesses, five letters, **one puzzle per day identical for everyone**, from a curated list of
**2,309 words** ([Wikipedia](https://en.wikipedia.org/wiki/Wordle)) `[P]`. Josh Wardle's stated
design posture is the most quotable thing in this dossier:
*"It's one puzzle, and everybody is solving it… people have an appetite for things that
transparently don't want anything from you"*, and on notifications, *"Would I send you a push
notification?… Why don't you just forget about Wordle for a little bit?"*
([TechCrunch](https://techcrunch.com/2022/01/12/josh-wardle-interview-wordle/)) `[P]`; he
describes deliberately avoiding *"endless play, or sending them push notifications, or asking
them for sign-up information"*
([Slate](https://slate.com/culture/2022/01/wordle-game-creator-wardle-twitter-scores-strategy-stats.html)) `[P]`.
**The emoji share grid was invented by a player, not by the designer** — *"she's called Elizabeth
S… came up with the emoji grid as a spoiler-free way of sharing her results"*, which Wardle then
productised (Slate; corroborated in TechCrunch) `[P]`. The share button landed **16 Dec 2021**;
the game went from ~90 players on 1 Nov 2021 to 300,000+ by 2 Jan and 2M+ weekly a week later `[P]`.

**Chess already has two of these.** *Chessle* — guess an opening, SAN entered ply by ply, normal 3
moves per side / expert 5, six guesses, new puzzle at midnight PST, creator's framing *"enter in
an opening of your choice, and look at the pretty colours!"*
([Chess.com blog](https://www.chess.com/blog/GMJackL/chessle-like-wordle-but-for-chess-openings)) `[P]`.
*Chessguessr* — a position from a **real game**, guess the **five moves actually played** (not the
best moves), daily at midnight UTC, positions from Lichess, with a four-band legend: *"🟩 indicates
that the move is correct"*, *"🟨 …correct, but in the wrong place"*, *"🟦 …the correct piece type
was moved"*, *"⬜ …the move is wrong"*
([repo](https://github.com/Assios/chessguessr), [site](https://www.chessguessr.com/)) `[P]`.

> **Chessguessr is our thesis in miniature and someone else shipped it**: it grades against *what
> a human actually played*, not against an engine's preference — the same choice R9 validated
> when it measured human outcomes separating 16.9% of engine-tied move pairs.

- **Prices:** nothing. The scarcity is **cadence**, not currency — and cadence prices attention,
  which is the one thing the thesis does not sell.
- **Rewards:** a shared conversation, and a result you can post without spoiling it.
- **Why it's fun:** everyone has the same problem today, so the social layer costs the designer
  nothing and the product asks for nothing.
- **Collides with:** **law 8** only if the daily thing is *scored*. Wordle's grid is a **shape**
  (which rows were green) and not a number, and that distinction is the whole safety argument.
- **Transformation, and this is the cheapest complete feature in the dossier.** One shared
  position per day, deterministically selected from a published list; the shareable artifact is
  the **shape of your branch set** — how many attempts, where they diverged, whether the objective
  survived — rendered as a spoiler-free glyph row and **never as a score**. Every input ships: 47
  packs plus **43 mined candidates in `content/candidates/`** `[V]` give a corpus; the run graph
  already records the branch structure; the `story_read` scoped anonymous token already exists for
  sharing (`design/02` §Deployment). And it answers a `BACKLOG` row that has had no mechanism
  behind it since it was filed — *"why open it on Tuesday?"* (the skill/progress + return-loop
  row).
- **What would kill it:** three things, and all are real. **(a)** Wordle's grid works because the
  puzzle has a *fixed shape* (6×5); a branch set does not, so the glyph design is genuinely hard
  and could easily become a score by accident. **(b)** A daily is a **cadence promise**, and a
  missed day is worse than never having one — D6 applies to our own operations. **(c)** Chessle
  and Chessguessr already exist and are free, so the daily is only a *return loop for our own
  learners*, not an acquisition channel; treating it as the latter would be the ChessMonitor
  error in a different costume.

### D8 · Horizontal progression, proven over a decade — *Guild Wars 2*

The level cap has been **80 since 2012** with only two endgame gear tiers, so new content adds
breadth rather than power `[P]` (well attested, but the citable page is a community thread —
[Steam discussion](https://steamcommunity.com/app/1284210/discussions/0/594033613915477711/); the
official wiki has no such page). The mechanism that replaced levels is **Mastery** — account-wide,
level-80-only, with **884 mastery points and 686 trainable ranks**, and a two-part cost: fill a
regional XP bar **and** spend points *"earned by overcoming challenges with level 80 characters in
PvE"* ([GW2 wiki](https://wiki.guildwars2.com/wiki/Mastery)) `[P]`. Living World episodes arrive on
a *"2-4 month cadence"* and unlock permanently and free if you log in during the window
([GW2 wiki](https://wiki.guildwars2.com/wiki/Living_World)) `[P]`.

- **Prices:** time, and a **named act** — grinding alone cannot unlock a mastery.
- **Rewards:** breadth that never invalidates the back catalogue.
- **Why it's fun:** content shipped in 2015 is still current content, so the library compounds
  instead of rotting.
- **Collides with:** nothing. **We are already horizontal by construction** (`06` §5: the power
  curve is flat), so GW2 is not a design to adopt but the **existence proof that horizontal
  sustains a decade** — the strongest available answer to "won't a flat curve get boring".
- **Transformation:** the adoptable detail is the **two-part cost**. A lens earned by playing *a
  lot* is a grind; a lens earned by playing *a named thing* — "you have now met this structure in
  three different openings" — is a mastery point, and the named-thing half is exactly what
  `attempt_concepts` and the shape library can express.
- **What would kill it:** GW2 pays for horizontality with an enormous content budget — 884 mastery
  points is a decade of shipping. Horizontal progression **shifts** the cost from balance to
  content, and C11 says our content is the expensive part. This is a warning as much as a model.

### D9 · Never return a null result — *Blades in the Dark*, *Dungeon World*

The published vocabulary for a consequence that is not a failure. *Blades* rolls a **4/5** as
*"You do it, but there's a consequence"*, with five named consequence types — **Reduced Effect**
(*"impaired performance"*), **Complication** (*"trouble, mounting danger, or a new threat"*),
**Lost Opportunity** (*"You had an opportunity to achieve your goal with this action, but it slips
away"*), **Worse Position** (*"losing control of the situation"*) and **Harm**
([Blades SRD](https://bladesinthedark.com/consequences-harm),
[action roll](https://bladesinthedark.com/action-roll)) `[P]`. *Dungeon World*: **7–9** is
*"still a success but it comes with compromises or cost"*
([DW SRD](https://www.dungeonworldsrd.com/playing-the-game/)) `[P]`. The design community's own
preferred name for the family is *"succeed at a cost"* rather than "fail forward"
([Run a Game](https://www.runagame.net/2015/12/fail-forward.html)) `[P]`.

- **Prices:** nothing new. It **renames** a consequence that already occurred.
- **Rewards:** continuing. The worst common outcome is a *state change*, never a stop.
- **Why it's fun:** it is the difference between "you failed, try again" and "you got in, but
  they know you were there" — the second is a story and the first is a loading screen.
- **Collides with:** nothing. This is **presentation**, and presentation is the exact gap
  `campaign-intermediate-consequence.md` found.
- **Transformation, and it is a naming job rather than a build.** Our `ObjectiveState` has six
  values, three absorbing, and **`degraded` is a non-fatal, one-way, authored, forward-sealed
  "succeeded at a cost"** (`trajectory.ts:6`, `pack-validation.ts:469`,
  `pack-orchestrator.ts:556-575`) `[V]`. It has a published commercial vocabulary and we are not
  using it. Two of Blades' five types map onto objects we already have — **Worse Position** is the
  carried board (M1 of the predecessor dossier) and **Reduced Effect** is the assistance
  suppression (§2a(i)) — which is a useful check that the residue in §2's constraint table is not
  missing a category.
- **What would kill it:** a rename that is not backed by a *difference the learner can see*.
  `degraded` currently changes the run's stored verdict and nothing on screen; calling it "you got
  in, but they know you were there" without the boss actually behaving differently is worse than
  the neutral word, because it promises a consequence that does not arrive.

### D10 · The minigame inside the game — *Universal Paperclips*' Strategic Modeling

Mid-game, Paperclips bolts on **a genuinely separate game**: Strategic Modeling runs iterated
prisoner's-dilemma tournaments, costs ops, and pays a third currency, Yomi, with its own upgrade
tree; it is unavailable until 12,000 ops and the "Donkey Space" project
([fandom, snippet-level](https://universalpaperclips.fandom.com/wiki/Strategic_Modeling)) `[P]`.
Later still, a **Combat** system appears that did not exist until drifter losses crossed a
threshold ([speedrun guide](https://www.zurd.ca/universal-paperclips-a-guide-and-my-history-for-a-speedrun/)) `[P]`.

- **Prices:** an existing resource, spent on a different kind of thinking.
- **Rewards:** relief from the main loop, without leaving the fiction.
- **Why it's fun:** it is the idle genre's actual answer to the owner's question — *more fun*
  arrives as **a different game**, revealed at a threshold, rather than as a bigger number.
- **Collides with:** **C11** (a minigame needs content) and **law 8** (a chess minigame that
  grades is the anti-pattern).
- **Transformation:** **we have one built and undelivered, and it is the best minigame in the
  repo.** `CheckpointInteraction.prediction` — flip the board at a pivotal moment, predict the
  opponent's reply — is in the v0.2 schema with `grading{source, topK, minMass}` and `flipBoard`,
  and its **sparsity is mechanically enforced at max 2 predictions per segment**
  (`packages/schema/src/drill-pack/lint.ts:115-138`) `[V]`. What is missing is delivery:
  `pack-registry.ts:66-71` projects checkpoints to `{id, label, actions}` and **drops
  `interaction`**, with a regression test asserting it does (`BACKLOG` prediction-checkpoints row)
  `[V]`. And the grading is honest by construction — against **Maia's policy distribution at the
  opponent's band**, which R5 measured bit-identical across 20 repeats and which
  `capabilities.ts` records as `disposition: "reached"`. *"42% of 1500s play Qb6; the engine's c4
  is found by 8%"* is three-way honesty, not a verdict.
- **What would kill it:** the honest band. R10 ruled `[1000, 2400]`, and below ~1000 the listed
  policy mass falls to 0.833 so the percentage would be computed over the wrong denominator. Also
  killed by the schema's own sparsity rule if the campaign wants a minigame *often* — two per
  segment is deliberately not a game mode, and turning it into one would fight
  `01-training-model.md` §3's uninterrupted-consequence stage.

### D11 · Showing the machinery does not spoil it — ARGs

The ARG literature's term for the designer/player boundary is **the curtain** — *"generally a
metaphor for the separation between the puppet-masters and the players"* — and the genre's own
white paper records a finding that ought to be reassuring here: Jane McGonigal's observation that
*"the clear visibility of the puppetmasters' work behind the curtain does not lessen the players'
enjoyment"*
([IGDA ARG SIG White Paper 2006](http://www.christydena.com/wp-content/uploads/2007/11/igda-alternaterealitygames-whitepaper-2006.pdf)) `[P]`.
The genre's opening move is the **trailhead** — *"the first media artifact, be it a website,
contact, or puzzle, that draws in players"* — and its central conceit is **TINAG**, *"This Is Not
A Game"*, i.e. *"one of the main goals of the ARG is to deny and disguise the fact that it is even
a game at all"* `[P]`.

- **Prices:** nothing.
- **Rewards:** the pleasure of collective sense-making.
- **Why it's fun:** the material is deliberately incomplete, so assembling it is the play.
- **Collides with:** **TINAG collides with everything this product is.** Our differentiator is
  that every claim is traceable to a named instrument; a design that disguises its own machinery
  is the exact inverse.
- **Transformation:** invert TINAG and keep McGonigal's finding. **"This Is Not A Game" is refused;
  "the visible curtain does not spoil it" is adopted** — and it is the outside support for a
  posture this repo already holds and has occasionally worried about: provenance sentences,
  disposition tables, `"No technique entry is available yet."` and the honest-absence rule are
  all the curtain being visible, and the ARG literature says players do not mind. The trailhead
  idea transfers straight to the daily (D7): the *first* artifact a learner meets should be a
  position with a question, not an onboarding screen.
- **What would kill it:** McGonigal's observation is about players who chose a puzzle; a learner
  who wanted to get better at chess may read visible machinery as friction rather than as
  candour. Unmeasured, and Q1b's interviews are where it would be answered.

---

## 4. Question 2 — what makes EXPERIMENTATION fun rather than dutiful

The thesis has already made experimentation **free**. Free is not the same as **rewarding**, and
that gap is the whole question. Most games price experimentation precisely to make it feel
meaningful; the interesting set is the games that made it free *and* made it the point.

Format for every mechanic below: **prices · rewards · why it's fun · collides with · the
transformation · what would kill it.** A mechanic with no stated failure mode has not been
analysed.

### F1 · Rewind that is deliberately not a resource — *Braid*

Jonathan Blow states the design question as an experiment: *"I wanted to find out what happens
when you design a game where rewind is not a resource, and there's not a death challenge gating
the game"*
([GDC 2010, via Game Developer](https://www.gamedeveloper.com/design/video-jonathan-blow-explains-i-braid-s-i-rewind-mechanic-at-gdc-2010)) `[P]`;
the mechanic is *"the player's unlimited ability to reverse time and 'rewind' actions, even
after dying"* ([Wikipedia](https://en.wikipedia.org/wiki/Braid_(video_game))) `[P]`.

- **Prices:** nothing. Explicitly.
- **Rewards:** the willingness to try the move you would not risk.
- **Why it's fun:** the puzzle becomes the *only* obstacle, so failure stops carrying social or
  economic weight and becomes information.
- **Collides with:** nothing. It is `00-thesis.md` §Why anyone, arrived at independently by a
  commercial designer who ran it as a stated experiment.
- **Transformation:** none needed. **The value here is evidentiary, not mechanical** — it is the
  strongest outside support this repo has for its own most-questioned invariant, and it is worth
  citing in `06` §2c the next time a budget is proposed.
- **What would kill it:** Blow's own contrast case is F2. If our loop turns out to need tension
  that only scarcity supplies, this citation does not save it — R6 decides.

### F2 · The metered version, kept as the contrast — *Prince of Persia: The Sands of Time*

*"the ability for the Prince to rewind time by up to ten seconds to reverse fatal game-ending
mistakes"*, each use costing a Sand Tank
([Wikipedia](https://en.wikipedia.org/wiki/Prince_of_Persia:_The_Sands_of_Time)) `[P]`.

- **Prices:** retrying, directly and by the unit.
- **Rewards:** husbandry — you learn to fail cheaply.
- **Why it's fun:** the tank is a visible dread meter, and spending the last one is memorable.
- **Collides with:** **C1**, head on. This is exactly the rewind budget `06` §2c refuses.
- **Transformation:** the honest one already exists and is not this — `06` §5's accepted ruling
  prices **declaring done**, not retrying. Sands of Time is recorded here so that the refused
  design has a named, concrete referent instead of being an abstraction.
- **What would kill it:** it is already refused; it stays in the dossier as the thing not to
  drift into.

### F3 · Re-entry is REWARDED, not merely permitted — *Hitman* (2016)

*"there is never a 'wrong' way of killing a target"*, and mastery challenges for unconventional
kills unlock starting positions and weapon stashes
([Wikipedia](https://en.wikipedia.org/wiki/Hitman_(2016_video_game))) `[P]`.

> **This is the best single answer to the owner's question in the whole sweep.** Every other
> candidate makes experimentation *cheap*; Hitman makes replaying the same level the mechanism
> by which the level opens up.

- **Prices:** nothing. The level is re-enterable indefinitely.
- **Rewards:** *variety of approach*, measured by the game and converted into new options on the
  same map.
- **Why it's fun:** the map stops being a problem with an answer and becomes a space with a
  vocabulary, and your own past runs are what taught it to you.
- **Collides with:** **law 8**, if "variety" is scored as chess quality. It must not be.
- **Transformation:** reward **branch breadth**, mechanically and without judging any branch.
  The run graph already records each branch's **first divergent move** (the branch card,
  `design/02` §UX commitments) and the attempts table already carries a **`countable`** flag
  (`apps/server/src/progress.ts` → `attempts.countable`, `storage.ts:1380-1393`) `[V]`. So *"this
  root produced N countable branches with distinct first divergent moves"* is a **census over the
  learner's own graph**, not a claim about chess — residue kind (i), and it prices nothing.
  Offer the lens draft on breadth rather than on completion.
- **What would kill it:** **farming.** Five junk branches abandoned at ply 2 satisfy a naive
  count. The mitigation is already shipped and must be used: require each counted branch to be
  `countable` *and* to reach the pack's declared `plyHorizon` (**46 of 47 packs declare one**,
  median 10.5) — i.e. a branch counts only when its consequence was actually played out, which
  is `00-thesis.md`'s second binding consequence restated as a scoring rule. It also dies if R7
  finds that being *asked* for breadth makes exploration feel assigned rather than curious.

### F4 · The loop knows you looped — *Save the Date*, and *Outer Wilds*

*Save the Date*: on restarting, *"additional dialogue options become available that reflect the
player character's awareness of being in a time loop"*, with the stated intent that players
*"examine their own motivations"*
([Wikipedia](https://en.wikipedia.org/wiki/Save_the_Date_(video_game))) `[P]`. *Outer Wilds*:
*"Nothing is brought back with the Hatchling when the time loop resets, with the exception of the
data on the spacecraft's computer"*, and *"learning new things is the only feedback the player
gets"* ([Wikipedia](https://en.wikipedia.org/wiki/Outer_Wilds)) `[P]`.

- **Prices:** nothing; the loop resets the world and keeps the knowledge.
- **Rewards:** the *acknowledgement* — the game has noticed you were here before.
- **Why it's fun:** a retry that the product ignores feels like a treadmill; a retry the product
  *addresses* feels like a conversation.
- **Collides with:** **C11** — our acknowledgement material is authored and finite (330
  deviation notes, 189 checkpoints).
- **Transformation:** **half of it already ships and is not credited as this.**
  `open-answer-grading` diffs the learner against **their own prior attempt**
  (`docs/open-answer-grading.md`, shipped 2026-08-14, `BACKLOG` step-indexed-transcript row)
  `[V]`, and the compare surface exists for exactly the two-attempt case. What is missing is the
  *voice*: a second visit to a root currently says the same things the first said. The cheap
  version needs no new authored prose — **re-order what already exists**: surface the deviation
  notes bound to moves *you played on a previous attempt* first. That is a query over
  `attempts` + the authored `deviations[].moveUci` pointer, both shipped.
- **What would kill it:** C11 again, from the other side. If the acknowledgement needs *new*
  authored prose per revisit, it is the most expensive mechanic in this dossier rather than the
  cheapest, and the 65.0 min/pack middlegame rate applies.

### F5 · Reward for solving it *wrong* — *The Talos Principle*

*"Special star sigils can be found by unique solutions to some puzzles"*
([Wikipedia](https://en.wikipedia.org/wiki/The_Talos_Principle)) `[P]` — content gated behind
solutions the designer did not intend.

- **Prices:** nothing.
- **Rewards:** deviating from the intended path *successfully*.
- **Why it's fun:** it converts the player's suspicion that they have outsmarted the designer
  from a private pleasure into a recognised one.
- **Collides with:** **nothing new** — but it is only *computable* where the objective is not
  "stay on the author's line".
- **Transformation:** *"the objective was achieved off the authored spine"* is computable today —
  `objectiveState` grades the objective and `authoredBoundary` marks where authored territory
  ends. It is **meaningless for `follow_theory`** (deviation *is* failure there), so it applies
  to the **24 of 47 packs** whose objective is outcome- or plan-shaped: `win` 10, `reach_structure`
  5, `preserve_plan_window` 4, `hold` 3, `execute_break` 1, `prevent_opponent_plan` 1 `[V]`.
  That is a *majority of the non-opening catalogue* and it costs zero authoring.
- **What would kill it:** if off-spine success is mostly the **grading being wrong** rather than
  the learner being clever. `campaign-intermediate-consequence.md` and `authoring-vocabulary-completeness.md`
  both record objectives that grade less than they appear to (D28: an outcome leg with no
  `successConditions` compiles to zero rules). Celebrating a false positive would be worse than
  silence. Pre-test: count how often the 24 packs' objectives are achieved off-spine in the
  existing run corpus — currently unmeasured.

### F6 · Partial credit that refuses to say *which* — *The Case of the Golden Idol*

The game tells you *how many* words are wrong and never which: feedback fires *"when the segment
has more or less than two incorrect words allocated"*
([Wikipedia](https://en.wikipedia.org/wiki/The_Case_of_the_Golden_Idol)) `[P]`. *Return of the
Obra Dinn* does the same by batching: *"To deter guesswork, correct fates are validated only in
sets of three"* ([Wikipedia](https://en.wikipedia.org/wiki/Return_of_the_Obra_Dinn)) `[P]`.

- **Prices:** nothing; it prices *guessing* by making brute force unrewarding.
- **Rewards:** reasoning that is complete rather than lucky.
- **Why it's fun:** it is graded feedback that still leaves the deduction to you — the exact
  register a coach uses.
- **Collides with:** **law 8**, unless the count is grounded in a measured instrument.
- **Transformation:** it is grounded, and the instrument ships. `open-answer-grading` captures
  candidates / plan / fears, and Maia policy mass is **recorded on every opponent selection**
  (`capabilities.ts`: Maia *policy mass* is `disposition: "reached"`, surface *"human split"*)
  `[V]`. So *"two of your three candidates are outside what humans at this band actually play"*
  is a **count over a recorded distribution**, not a verdict on a move — and R5 measured that
  distribution **bit-identical across 20 repeats** (105/105 keys). The Golden Idol rule is what
  makes it safe: **say the count, never the identity.**
- **What would kill it:** the count is only honest where the policy list is *readable* — R10
  measured listed policy mass falling to 0.833 at band 0, and the shipped selector renormalises
  over exactly that list. Below the ruled `[1000, 2400]` band the denominator is wrong and the
  count would be a fabrication. Also killed if learners read a bare count as a score, which is
  the ChessMonitor failure shape.

### F7 · Assist mode, and the framing rewrite that matters more than the mode — *Celeste*

Celeste shipped an Assist Mode whose preamble originally read *"We believe that its difficulty
is essential to the experience"*, then **rewrote it** to *"If the default game proves
inaccessible to you, we hope that you can still find that experience with Assist Mode"*, with
Maddy Thorson's stated intent *"to accept that every player is different, and that people come
into the game at many different skill levels"*
([Vice](https://www.vice.com/en/article/celeste-assist-mode-change-and-accessibility/)) `[P]`.

- **Prices:** nothing.
- **Rewards:** nothing — and that is the point.
- **Why it's fun:** the rewrite removed a **judgement** the first text smuggled in. The mode was
  identical before and after; only the sentence changed.
- **Collides with:** nothing — it is a *presentation* finding, and this product's assistance
  ladder has exactly the same exposure.
- **Transformation:** a standing rule for `05` §3's ladder and for §2a(i)'s suppression sentence:
  **never frame a rung as a concession.** Our shipped honest sentence
  (*"Available only after this run opens feedback…"*) already gets this right by describing a
  *rule*, not the learner. The campaign inner gate must hold the same line, and a scoring axis
  over "lenses used" (§5, F10) is the place it is most likely to be lost — a lens count that
  reads as a shame counter has re-imported the judgement Celeste deleted.
- **What would kill it:** it cannot be killed; it can only be ignored. Its failure mode is
  silent, which is why it is written down.

---

## 5. Question 3 — what creates fun WITHOUT a power curve

This is the question the roguelike set could not answer, because **every game in it has a power
curve**. Outside that set the answer is unusually consistent. Across puzzle games, speedrunning,
rhythm games, Souls-likes and setup-variety card games, fun without power is produced by exactly
**three devices**, and this product has a runnable version of each — two of them already in
shipped code with no consumers (§2a).

### Device 1 — Score the SOLUTION, not the outcome

### F8 · The histogram, not the leaderboard — *SpaceChem* / *Opus Magnum* / *TIS-100*

Zachtronics scores a solved puzzle on **three mutually-exclusive axes** and shows you your
position in the *distribution of all players*, not your rank. Opus Magnum: *"they are ranked
against other players based on three factors: speed in cycles, cost in G, and area in tiles"*
([Wikipedia](https://en.wikipedia.org/wiki/Opus_Magnum)) `[P]`; TIS-100 uses *"the number of
nodes used, the number of instructions within their code, and the number of instruction cycles
used"* ([Wikipedia](https://en.wikipedia.org/wiki/TIS-100)) `[P]`. Zach Barth's postmortem gives
the reason for the histogram over a leaderboard in two sentences worth quoting in full:
*"For most players, the only thing a global leaderboard manages to tell you is that you suck
(and not even by how much)"*, and *"Getting your name at the top of the leaderboards is a
fantastic incentive for cheating"*
([Game Developer](https://www.gamedeveloper.com/design/postmortem-zachtronics-industries-i-spacechem-i-)) `[P]`.

- **Prices:** nothing. Completion is free (F9).
- **Rewards:** *re-solving a problem you have already solved*, on an axis you chose.
- **Why it's fun:** the three axes are mutually exclusive, so there is no single best answer and
  therefore no end to the optimisation; and the histogram tells you *how far* rather than *where
  you rank*.
- **Collides with:** **law 8 / ADR-0005**, immediately and fatally, if any axis is a judgement
  about the chess. And **C1**, if any axis counts retries.
- **Transformation, and it is the sharpest thing in this dossier.** Three axes exist that are
  each about the **learner's process**, not the position's truth:
  1. **Plies to the objective on the submitted branch** — bounded and comparable because
     `authoredBoundary.plyHorizon` is declared by **46 of 47** packs (median 10.5) `[V]`;
  2. **Assistance rungs switched on at the moment of submission** — and this is the axis D78
     *licenses*: all-on is the measured **unreadable** state (median 58 observations/position,
     compare strip 8.31 entries/ply at **1.01×** lift), so "fewer" is honestly better and needs
     no invented scarcity;
  3. **The sealed objective state** of the submitted branch — `preserved` vs `degraded`, which is
     **authored, not graded** (76 of 275 → now 330 deviations carry `offObjective`).
  None of the three asserts anything about chess. **Two hard constraints on the axis set:** (a)
  **no count of rewinds, forks or attempts may ever be an axis** — that is C1 in scoring clothes,
  and it is the single most likely accidental violation in this whole document; (b) the
  comparison population should be **the learner's own prior submissions**, not other learners,
  which is strictly safer than a histogram *and* sidesteps the ChessMonitor finding (a
  manufactured cross-learner skill number has proven pull and no honest basis,
  `quickpass-wintrChess-encroissant-chessmonitor.md`).
- **What would kill it:** if the three axes turn out to be **the same axis** — a learner who uses
  fewer lenses probably also takes more plies, and if they correlate near-perfectly the
  "mutually exclusive optima" that make Zachtronics work do not exist and the histogram is a
  disguised single score. **That is measurable today**: the correlation between rungs-on and
  plies-to-objective over the existing attempt corpus. It should be measured *before* any of
  this is designed. Second killer: Barth's own second sentence — any axis that can be gamed
  without learning (idle plies, toggling a lens off at the last second) makes the number a
  target, and Goodhart applies.

### F9 · Decouple *passing* from *scoring* — *Opus Magnum*, *Portal*

*"The player can advance with any working solution to each problem, but is challenged through
leaderboards"* ([Wikipedia](https://en.wikipedia.org/wiki/Opus_Magnum)) `[P]`. Portal's challenge
chambers re-serve the same room scored by *"completing them with the fewest portals, the fewest
footsteps, or the shortest time"*
([Wikipedia](https://en.wikipedia.org/wiki/Portal_(video_game))) `[P]`.

- **Prices:** nothing; optimisation is entirely voluntary.
- **Rewards:** ambition, without taxing its absence.
- **Why it's fun:** it lets one artefact serve two audiences — the player who wants to finish and
  the player who wants to *master* — with no difficulty setting between them.
- **Collides with:** nothing.
- **Transformation:** the campaign's node advance should be gated on the **objective**, and the
  three axes of F8 should be **decorative for the run and load-bearing only for the learner's own
  history**. Concretely: the map advances when the node's objective resolves; the histogram is
  shown after, and never blocks.
- **What would kill it:** if the axes are made a *gate* — the moment "you need ≤3 lenses to pass"
  exists, the product has invented the scarcity C9 was specifically avoiding, and F7's Celeste
  failure follows within one screen.

### F10 · The artefact, not the score, is the shareable unit — *Opus Magnum*

*"Completed machines can be exported into an animated GIF to be shared on social media"*
([Wikipedia](https://en.wikipedia.org/wiki/Opus_Magnum)) `[P]`.

- **Prices:** nothing.
- **Rewards:** authorship. What you share is the *thing you built*, not a number.
- **Why it's fun:** a number invites comparison; an artefact invites description.
- **Collides with:** nothing. It runs *with* the honesty posture rather than against it.
- **Transformation:** **the exports already ship** — PGN with variations is N-way today, and the
  public story card exists with a `story_read` scoped token (`design/02` §Deployment). The gap is
  that our shareable object is currently a *reading surface*, not a *made thing*. The mechanic to
  adopt is the framing: share **the branch set** — "here are the four things I tried from this
  position and what happened" — which is precisely the one comparison claim `00-thesis.md` says
  no surveyed product makes. The story card's board is currently `<pre>` of the FEN
  (`broadcast-and-teacher-surfaces.md`), so this is a small, already-ledgered fix away.
- **What would kill it:** nobody shares chess positions. Unmeasured, and the honest pre-test is
  the shipped share link's usage, which no telemetry records.

### Device 2 — Make KNOWLEDGE the key

### F11 · Knowledge-gating and the Ship's Log — *Outer Wilds*

Nothing carries between loops *"with the exception of the data on the spacecraft's computer"*,
and the log is organised *"either by location or in a web of connections"* — two views of the
same knowledge, one spatial and one by open question
([Wikipedia](https://en.wikipedia.org/wiki/Outer_Wilds)) `[P]`. Alex Beachum frames the log as
question-driven: *"you're really meant to pursue it by question, right?"*
([interview](https://medium.com/@cordialkobold/interview-with-alex-beachum-creative-director-of-outer-wilds-a01bb9631e20)) `[P]`.

- **Prices:** nothing — every gate is opened by knowing, and the world never changes.
- **Rewards:** curiosity, immediately and legibly.
- **Why it's fun:** the log makes *what you don't know yet* visible without telling you the
  answer. It is a map of open questions.
- **Collides with:** **law 8**, if the log ever asserts what a position *means*; and **`06` §3
  law 6**, since a log entry is something surfaced unasked.
- **Transformation, and both halves of the log already have producers.** The **Map Mode** half is
  `concepts` — 186 authored tags, stored per attempt in `attempt_concepts` with an index on
  `concept_key` (§2a(iii)). The **Rumor Mode** half — *what you have met but not yet
  explored* — is **`shapeRecommendations`**, which computes shapes the learner has *encountered
  but never drilled* over the last 50 runs, is rung-0 arithmetic with a provenance sentence, and
  **gates nothing today** (`apps/server/src/service.ts:758-777`) `[V]`. The log is an assembly of
  two shipped producers, and it is the single most *Outer Wilds*-shaped object this product could
  have: an artifact whose entries are attestations ("you have played this structure five times")
  and never judgements ("you are weak at this").
- **What would kill it:** **the collection is a tag cloud, not a curriculum.** 156 distinct
  concepts over 47 packs, only **24 appearing in ≥2 packs** — so 132 concepts are singletons and
  a log built on them is a list of pack titles wearing a different hat. And the default
  `PackScopedConceptResolver` namespaces them so that the same string in six packs is six keys
  (§2a(iii)). **Both are fixable and neither is free**: a corpus-global resolver is one injectable
  class; a concept vocabulary that actually *collects* is an authoring convention, and this repo
  has measured what happens to a vocabulary with no convention behind it (the 21 of 117 null
  shape signatures).

### F12 · The gate is your eyes — *The Witness*, *Tunic*, *La-Mulana*

The Witness hides puzzles in the world so that *"a single path is disguised in the environment"*
and refuses text tutorials because they kill *"epiphany and related things like the joy of
discovery"* ([Wikipedia](https://en.wikipedia.org/wiki/The_Witness_(2016_video_game))) `[P]`.
Tunic's manual pages reveal abilities you always had — a page *"showing the fox offering items to
a shrine, which otherwise gives no indication that it can be used that way"*
([Wikipedia](https://en.wikipedia.org/wiki/Tunic_(video_game))) `[P]`. La-Mulana has items that
*"do not grant any abilities, but open up a new area"*
([Wikipedia](https://en.wikipedia.org/wiki/La-Mulana)) `[P]`. And *sequence breaking* is the
formal name for knowledge outrunning the gate — *"performing actions or obtaining items out of
the intended linear order"*, now something designers build **for**
([Wikipedia](https://en.wikipedia.org/wiki/Sequence_breaking)) `[P]`.

- **Prices:** nothing.
- **Rewards:** perception itself. The unlock is retroactive — the thing was always there.
- **Why it's fun:** it is the purest form of "you got better and the world did not get easier",
  and it is *exactly* what `06` §5 means by **legibility, not power**.
- **Collides with:** nothing — this is the campaign's existing thesis with a commercial pedigree.
- **Transformation:** none required; the lens loadout **is** the Tunic manual page. The
  contribution is a **naming and sequencing** one: the product should present an unlocked lens as
  *"the board was always saying this"*, and should permit **sequence breaking** — a learner who
  can already read a structure without the lens must not be blocked from the node that "requires"
  it. That is a real design commitment: any campaign gate keyed on *holding* a lens rather than
  on *playing* would forbid the best possible outcome.
- **What would kill it:** if our lenses are not actually perceptual. D78 is the standing warning:
  a lens that fires on 99.8% of transitions at 1.01× lift is not a hidden path in the
  environment, it is fog. **The pool must be the attested, discriminating subset, not the
  catalogue.**

### F13 · Fixed difficulty, changing player — *Dark Souls*

*"the player is encouraged to not fear death, as no progress is lost so long as they can learn
from their mistakes"* ([Wikipedia](https://en.wikipedia.org/wiki/Dark_Souls)) `[P]`, and Hidetaka
Miyazaki's stated goal is to make *"the cycle of repeatedly trying to overcome these challenges
enjoyable in itself"*, with players expected to *"use their cunning, study the game, memorize
what's happening, and learn from their mistakes"*
([Kotaku](https://kotaku.com/elden-rings-difficulty-dark-souls-hidetaka-miyazaki-1848442415)) `[P]`.

- **Prices:** a run back to the boss — the one thing Souls charges, and the one thing we do not.
- **Rewards:** comprehension of a fixed, honest, telegraphed opponent.
- **Why it's fun:** the boss is a *text* you learn to read. Nothing about it changes.
- **Collides with:** nothing — and the fit is almost exact. Our Act III boss is
  `perfect_tablebase`: **literally unbeatable if you err, shipped, and used by 2 packs** `[V]`.
  A tablebase is the most honest fixed-difficulty opponent any game has ever had.
- **Transformation:** the adoptable part is the **corpse run's absence**. Souls' tension comes
  from the walk back; ours must come from the *submit* verb (`06` §5), and the design should say
  so explicitly rather than half-importing Souls' stakes.
- **What would kill it:** the shipped catalogue's opponent bands are almost uniform — **35 of 47
  packs declare `targetElo: 1800`**, and the whole corpus spans 1150–1900 with modes
  `human_common` 25 / `theory_strict` 20 / `perfect_tablebase` 2 `[V]`. A Souls-like boss ladder
  needs bosses that differ; today they mostly do not.

### F14 · Asynchronous peer evidence — *Dark Souls* bloodstains and messages

Ghosts replay how another player died, and players *"leave messages on the ground that can help
other players with tips and warnings"*
([Wikipedia](https://en.wikipedia.org/wiki/Dark_Souls)) `[P]`.

- **Prices:** nothing.
- **Rewards:** the feeling of a populated world, and genuinely useful local information.
- **Why it's fun:** it is evidence from people who stood exactly where you are standing.
- **Collides with:** **law 8** for free-text messages (a user-authored strategic claim is
  ungrounded chess truth by construction) and with `design/02`'s *"no viewer-dependent
  projections"* if it is per-viewer.
- **Transformation:** the **bloodstain** half already ships and is not framed as this: the
  explorer corpus is literally *what humans at your band did here*, and R9 measured it separating
  **475 of 2,814 (16.9%)** engine-tied move pairs by ≥5 pp. The **message** half survives only in
  a **closed vocabulary** — a learner may leave a marker drawn from the shipped shape/concept
  vocabulary (25 shapes, the structural feature kinds) and never free text. That keeps every
  message a *pointer to a grounded object*, which is the same move `05` §5b makes for guidance.
- **What would kill it:** a closed-vocabulary message is much less fun than a free one, which is
  the whole reason Souls' messages are beloved; and a community layer needs a community, which
  the deployment does not have yet. **Defer, do not refuse.**

### Device 3 — Buy variety with SETUP SELECTION, not progression

### F15 · Randomise the army, not the rules — *Really Bad Chess*

Zach Gage's design: *"Each player given one king and 15 other pieces selected at random based on
the player's skill level"*
([Wikipedia](https://en.wikipedia.org/wiki/Really_Bad_Chess)) `[P]`. The game opens by telling
players to *"Throw out what you've heard about openings, elegance, and fairness"*
([Game Developer](https://www.gamedeveloper.com/design/how-zach-gage-breaks-all-of-the-rules-in-i-really-bad-chess-i-)) `[P]`.
Reception makes the pedagogical claim explicit: TouchArcade said it turns the *"mundane task of
learning chess into an extremely enjoyable experience"*, and Kill Screen that it *"should be
great for beginners to learn about the joy of landing a checkmate without having to study
openings"* (both via the Wikipedia reception section) `[P]`.

- **Prices:** nothing — and notably not the player's *knowledge*, which it simply routes around.
- **Rewards:** calculation over recall.
- **Why it's fun:** the difficulty dial is **material composition**, which a beginner can *see*.
  An Elo number is not visible; a missing queen is.
- **Collides with:** **C14** — this is a rules-preserving *setup* change, so it does not touch
  the Chess960 refusal, but it does need a legality story for arbitrary armies.
- **Transformation:** the vocabulary is already declared:
  **`different_material_details`** is one of the five `RETRY_VARIANT_KINDS`
  (`packages/schema/src/drill-pack/types.ts:27-33`) `[V]`. A campaign "modifier" that hands you
  the same endgame with a pawn added or removed is Really Bad Chess restricted to the phase where
  we have an oracle — and inside the tablebase it is **exactly assessable** (R4: κ = 1.000 inside
  range), so the honest target label the thesis requires is computable rather than authored.
- **What would kill it:** outside ≤7 pieces the modified position has **no oracle** (R4: 10.2% of
  out-of-range positions decided, median |eval| 43 cp), so a material tweak in the middlegame
  produces a position nobody can honestly label — and `00-thesis.md` is explicit that a product
  which declares a false target *"has done real damage"*. So this is an **endgame-only**
  mechanic, and saying so is the whole design.

### F16 · Same content, different chart — *Dance Dance Revolution*, *osu!*

DDR serves the identical track at five difficulty tiers (Beginner → Challenge) on a 1–20 rating
scale, judged per input as *"Marvelous, Perfect, Great, Good, Almost, Miss"*
([Wikipedia](https://en.wikipedia.org/wiki/Dance_Dance_Revolution)) `[P]`. osu!'s performance
points *"account for various aspects of a player's skill"* and rank scores on the same beatmap
against other players ([Wikipedia](https://en.wikipedia.org/wiki/Osu!)) `[P]`.

- **Prices:** nothing.
- **Rewards:** precision on content you have already beaten.
- **Why it's fun:** *"the song is the same, you are different"* — the purest statement of the
  legibility-not-power thesis in any commercial genre.
- **Collides with:** **law 8** for the judgement scale. "Marvelous/Perfect/Great" over a chess
  move is `05`'s named anti-pattern in a rhythm-game skin, and `engine-leverage`'s rule applies
  in its sharpest form: *the subject being a measurement is not sufficient — the threshold must
  sit off the instrument's optimality boundary* (`BACKLOG` D-row, 2026-08-15).
- **Transformation:** keep the **chart**, drop the **judgement**. A pack served at three
  resistance settings — `theory_strict`, `human_common` at band, `perfect_tablebase` where legal
  — is a difficulty chart made of *shipped opponent modes*, and the axis is the opponent, never a
  grade on the learner. `same_root_new_defense` is again the declared, unconsumed vocabulary for
  it.
- **What would kill it:** the band dial's honest range is `[1000, 2400]` (R10, ruled) and the
  catalogue sits at 1800 for 35 of 47 packs — so the chart currently has one difficulty on most
  content. Also: R10 measured the band trajectory **doubling back** above ≈2500, so more is not
  monotonically harder and a naive ladder would be dishonest.

### F17 · One game, N games — speedrunning categories

Any% is *"getting to the end as fast as possible with no qualifier"*, 100% *"requires full
completion"*, and Glitchless *"restricts the player from performing any glitches during the
speedrun"*; the creative act is **routing**, *"developing an optimal sequence of actions and
stages in a video game"*; speedrun.com *"hosts leaderboards for over 20,000 video games"* with
human moderator verification ([Wikipedia](https://en.wikipedia.org/wiki/Speedrun)) `[P]`.

- **Prices:** nothing. Categories are **self-imposed constraints**, which is residue kind (iii)
  exactly — a cost the *learner chose* is not a price the product charged.
- **Rewards:** community-legible mastery over content that never changes, and a *route* you can
  publish.
- **Why it's fun:** the constraint set is authored by the players, so the game grows without the
  developer shipping anything.
- **Collides with:** **`06` §3 law 5** if a category is defined by rarity, and with C1 if a
  category is "no rewinds" — which is the obvious one to reach for and is a retry price wearing a
  costume. It is available only as a **player's own** declaration, never as a product-offered
  challenge, and the difference is not cosmetic.
- **Transformation:** **run categories over the loadout and the ladder, not over the retry.**
  "≤3 lenses", "no corpus rung", "silent" (`SILENT_ASSISTANCE` is already a shipped named
  constant, `packages/runtime/src/assistance.ts:16`) `[V]` — three categories, zero authoring, and
  each is an *information* constraint, i.e. residue kind (i). The elective Act IV
  (`roguelike-run-design.md` §5a, device E) is the natural place for them.
- **What would kill it:** categories need a *population* to be interesting — speedrun.com's value
  is 20,000 leaderboards, and this deployment has one learner. Personal-best framing (F8's own-
  history histogram) is the honest single-player version and is strictly weaker as a hook.

### F18 · The upgrade path is a better OBSERVER — *Football Manager*, *Out of the Park Baseball*

The manager never gets stronger. What improves is **the quality of what you can see**. FM shows
unscouted attributes as **bands** rather than values (*"With minimal knowledge level, attributes
are not specified but displayed in attribute ranges (e.g passing 8-16), or not viewable at all"*
([passion4fm](https://www.passion4fm.com/scouting-in-football-manager/)) `[P]` snippet-level),
with four official knowledge tiers — *"The stages of scouting are indicated as None, Minimal,
Reasonable and Extensive"* ([SI](https://www.footballmanager.com/features/recruitment-revamp))
`[P]` — and **the observer has attributes too**: *"The star ratings given by a scout will be more
accurate the higher his Judging Player Ability and Judging Player Potential attributes are"*
([strikerless](https://strikerless.com/2015/03/09/scout-reports-how-to-use-them-properly/)) `[P]`.
The analytics layer is gated the same way: *"The better analysts you have, the more information
you'll have to play with"* ([SI, FM22 Data Hub](https://www.footballmanager.com/features/gameplay-upgrades)) `[P]`.
OOTP exposes the whole thing as a dial — scouting accuracy runs *"from very low to very high"*
plus 100% accurate, *"The stats produced by a player can vary from his true ability shown in a
100% accurate scouting report"*, and accuracy compounds with tenure: *"the longer you have the
same team in place, the better your scouting will become"*
([OOTP wiki](https://wiki.ootpdevelopments.com/index.php?title=OOTP_Baseball%3AImportant_Game_Concepts%2FThe_Scouting_Model),
[manual](https://manuals.ootpdevelopments.com/index.php?man=ootp21&page=scouting_players)) `[P]`.
And the hook is stated without a power curve anywhere in it: *"There's no real way you can master
it. It's different every single time"*
([Vice](https://www.vice.com/en/article/inside-the-cult-of-football-manager/)) `[P]`.

- **Prices:** nothing. Scouting costs *time*, which in FM is the only resource.
- **Rewards:** **reduced uncertainty**, which is the entire progression.
- **Why it's fun:** the world is fixed and fully simulated; you are buying resolution on it. That
  is a decades-proven commercial answer to "fun without a power curve", from a genre nobody in
  this repo had looked at.
- **Collides with:** **law 8**, hard, if the "resolution" is a chess judgement. FM can do this
  because it *owns* the ground truth — its simulation defines a player's true 1–20. We do not own
  chess's ground truth, and R4/R9 measured exactly where it stops existing.
- **Transformation, and it is the most direct fit in the whole dossier:** **our lens loadout is a
  scouting department.** A lens does not change the board; it changes the resolution at which you
  can read it — literally FM's model. Three specific adoptions follow. **(a) Show uncertainty as
  a band, not a value**, wherever the instrument is uncertain — this is already our house style
  (`branchDecidedness` is `decided`/`undecided`/`unknown` with a ground only on the first) and FM
  is the commercial precedent for it being *fun* rather than a disclaimer. **(b) Make the
  observer's quality visible** — the run should be able to say *which* instrument answered and how
  well, which the evidence stack already records. **(c) Reports go stale and ratings are relative
  to your squad** — the honest analogue is that an attestation carries its date and its
  population, which the provenance layer already demands.
- **What would kill it:** the asymmetry above. FM's uncertainty is *epistemic about a known
  truth*; ours is often *ontological* — the middlegame has no oracle at all (R4+R9), so there is
  no hidden 1–20 to converge on. A design that implies convergence toward a truth that does not
  exist is law 8 with a progress bar. **The honest version says "no instrument answers here" and
  stops**, which is `05` §5's abstention rule — and abstention is a much less satisfying reward
  than an Extensive scout report. That gap is real and unmeasured.

---

## 6. Chess-adjacent — what already exists, and the four bounding devices it uses

The genres above are analogies. This section is the **direct** evidence: what chess products and
chess-mechanic games already ship as fun, and how each one is bounded and scored. All external
facts `[P]`, checked against the cited page this pass.

### 6a. Variants — the ones that change what you must SEE

Lichess ships exactly **eight** official variants ([lichess.org/variant](https://lichess.org/variant));
Chess.com runs a separate, larger set. Sorted by the axis that matters to us — *does it change
the player's information, or the pieces' power*:

| Variant | Rule, verbatim | Axis |
|---|---|---|
| **Fog of War** (Chess.com) | *"Players can see only the squares where their pieces can legally move"*; *"the game only ends when one of the kings is captured"* ([chess.com](https://www.chess.com/terms/fog-of-war-chess)) | **Removes information.** Powers untouched |
| **Chess960** | *"The only way to castle is to move the King onto the Rook"*; back rank randomised with *"both bishops… on opposite colored squares"* ([lichess](https://lichess.org/variant/chess960)) | **Removes memorised information.** Powers untouched |
| **Duck Chess** (Chess.com) | *"Each turn has two steps: First, make a normal chess move, then move the duck to any empty square"*; *"Players capture the enemy king to win"* ([chess.com](https://support.chess.com/en/articles/8615411-what-is-duck-chess)) | Adds an obstacle + a second decision |
| **Crazyhouse** | *"A captured piece reverses color and goes to the capturing player's pocket"* ([lichess](https://lichess.org/variant/crazyhouse)) | Expands the move set |
| **King of the Hill** | *"Bring your King to the centre to win the game"* ([lichess](https://lichess.org/variant)) | Relocates the goal |
| **Three-check** | *"A player can win by placing their opponent in check three times… Apart from this, standard rules of chess apply"* ([Wikipedia](https://en.wikipedia.org/wiki/Three-check_chess)) | Relocates the goal |
| **Racing Kings** | *"Checks are entirely forbidden"*; first king to the eighth rank wins ([lichess](https://lichess.org/variant/racingKings)) | Relocates the goal |
| **Atomic** | *"all captures cause an explosion by which the captured piece, the piece used to capture, and all surrounding pieces except pawns… are removed"* ([lichess](https://lichess.org/variant/atomic)) | Inverts evaluation, non-local vision |
| **Antichess** | *"Capturing is forced. If you can take a piece, you must"* ([lichess](https://lichess.org/variant/antichess)) | Inverts evaluation |
| **Horde** | *"white has 36 pawns… The Pieces win by capturing all the Pawns"* ([lichess](https://lichess.org/variant/horde)) | Inverts evaluation |

> **The finding.** The three variants at the top of that table — **Fog of War, Chess960, Duck
> Chess** — are *legibility* mechanics, not power mechanics. They are the commercial proof that
> `06` §5's *"what escalates is legibility, not power"* is a real design axis in chess and not a
> consolation prize for lacking a power curve. **Fog of War in particular is the
> capability-suppressing boss, implemented as a rule of chess.**

- **Prices:** nothing. All of them are rule sets, not economies.
- **Rewards:** calculation over recall (960), local vision over global (Fog), a second decision
  per turn (Duck).
- **Why it's fun:** a familiar object made unfamiliar with a one-line rule change.
- **Collides with:** **C14** — `UCI_Chess960` is a *published, named capability refusal* with the
  reason *"The shipped drill format is standard chess only"* (`apps/server/src/capabilities.ts:105`)
  `[V]`. That is category (B) of the engine audit's "100%" definition: **deliberately unreached
  with the reason stated**. Adopting a variant is therefore a documented amendment, not a free
  addition — and beyond it sit Syzygy (standard-chess tables), the explorer corpus (standard
  openings), Maia (trained on standard games) and **every one of the 47 packs**. A variant node
  has *no* grounded instrument behind it.
- **Transformation, and it is the important one:** **take Fog of War's idea and not its rules.**
  Withholding information from the *learner* needs no engine change, no schema change and no new
  content — it is `locked_off` (§2a(i)) applied by a campaign inner gate. The variant that
  survives contact with our instruments is the one implemented in the **assistance layer**, not
  in the move generator. Chess960's transformation is likewise available without the variant:
  its actual effect is *"you cannot rely on memorised theory here"*, which is precisely what the
  20 opening packs' `authoredBoundary` marks the edge of.
- **What would kill it:** any *literal* variant adoption. It invalidates the tablebase, the
  corpus, Maia's band calibration and the whole catalogue at once — the one place in this
  dossier where transformation is not merely preferable but the only survivable form.

### 6b. Puzzle formats — four bounding devices, and one worth copying outright

| Format | Bound | Error handling |
|---|---|---|
| **Puzzle Rush** (Chess.com) | *"3 or 5 minutes"*, or Survival with no clock | **3 strikes and the game ends** ([chess.com](https://support.chess.com/en/articles/8608686-how-do-puzzles-work-on-chess-com)) |
| **Puzzle Storm** (Lichess) | *"Solve as many puzzles as possible in 3 minutes"* | *"When you play a wrong move, the combo bar is depleted, and you lose 10 seconds"* ([lichess](https://lichess.org/page/storm)) |
| **Puzzle Streak** (Lichess) | No clock; difficulty rises with the streak | One wrong move ends it; one skip per session `[P]` snippet-level |
| **Proof games** | **A move budget** — *"ends with a given position… after a specified number of moves"* ([Wikipedia](https://en.wikipedia.org/wiki/Proof_game)) | Binary: constructed or not |

**Puzzle Storm's combo ladder is the most sophisticated scoring design in the survey and it is
worth reading closely:** *"Each correct move fills the combo bar. When the bar is full, you get a
time bonus, and you increase the value of the next bonus"* — 5 moves: +3 s, 12: +5 s, 20: +7 s,
30: +10 s and every 10 thereafter ([lichess](https://lichess.org/page/storm)) `[P]`.

- **Prices:** an error costs **what you had accumulated**, not a life. The punishment scales with
  your own investment, so early errors are nearly free and late errors hurt exactly as much as
  the run was worth.
- **Rewards:** sustained correctness, with a visible and accelerating payoff.
- **Why it's fun:** it is a difficulty ramp that the *player* builds, so it never feels imposed.
- **Collides with:** **C1 and C4** in its literal form — a clock is a pursuit clock, and the
  escalating bonus is an escalating numeric economy. Both are on the refused list.
- **Transformation:** keep the **shape** — *the cost of an error is proportional to what you had
  built, and never a life* — and denominate it in something the thesis permits. There is exactly
  one shipped candidate: the **sealed objective state**. A `degraded` seal costs you the *terms*
  on which you meet the boss (`campaign-intermediate-consequence.md` §4) and costs nothing else,
  which is structurally Storm's rule: your accumulated position is diminished, your ability to
  continue is not.
- **What would kill it:** if the seal is the only accumulator, there is nothing to scale
  *against* and the analogy adds no design. It earns its place only if a run carries more than
  one sealed node, which is exactly the 3-act shape.

**The proof game's bound deserves a separate line**, because it is the one bounding device in the
whole survey that is **neither a clock nor a life count**: an *exactness* constraint. Retrograde
analysis is interesting for a reason we should steal the framing of — *"assumptions which might
be made from a glance at the initial position often turn out to be incorrect"*
([Wikipedia](https://en.wikipedia.org/wiki/Proof_game)) `[P]`. Our `authoredBoundary.plyHorizon`
(**46 of 47 packs**, median 10.5) is already a move budget; a node framed as *"reach the
structure inside the horizon"* is a proof-game bound with a shipped producer.

### 6c. Assistance-scaled reward — the one place a competitor has already built our idea

**Chess.com bot crowns:** three crowns for a win with **no help**, two with 1–3 hints/undos, one
with 4 or more; and *"Games against bot personalities or the engine are always unrated"*
([chess.com](https://support.chess.com/en/articles/8614091-how-can-i-play-against-the-chess-com-bots)) `[P]`.
Chess.com's puzzle system does the same in the other direction — hints taken before a correct
move forfeit progression points
([chess.com](https://support.chess.com/en/articles/8608686-how-do-puzzles-work-on-chess-com)) `[P]`.

> This is **F8's axis 2 already shipped by the largest chess product in the world**, which
> converts our "assistance rungs used at submission" axis from an invention into an adoption.

- **Prices:** using help.
- **Rewards:** independence, on a three-point scale that is legible at a glance.
- **Why it's fun:** it lets one encounter serve both the player who needs help and the player who
  wants to prove they did not, without two difficulty settings — F9's decoupling, in chess.
- **Collides with:** the **hint tax** problem `campaign-intermediate-consequence.md` M5 identified
  — pricing help is *experimentation without cost* read one level up — and with **F7 (Celeste)**,
  because one crown is a judgement wearing a number.
- **Transformation:** two changes make it ours. **(a) The unit is the SUBMITTED branch**, not the
  run — you may use everything while exploring, and the count is taken at the moment you declare
  done, so nothing prices the exploration. **(b) The number is descriptive, never comparative** —
  a histogram against your own history (F8), never crowns, and never a sentence about the
  learner. And it has an honest basis nobody else's does: D78 measured the all-on state as the
  **unreadable** one, so "fewer rungs" is a claim about **noise**, not about virtue.
- **What would kill it:** if learners read it as a score anyway. Chess.com's crowns *are* read as
  a score, and F7 says that is a framing outcome rather than a mechanical one. R7 gates it.

### 6d. Same pieces, different goal — *Chessarama*, and the objective vocabulary we already have

*Chessarama* is *"an anthology of 8 chess-piece minigames"* — Farm Life, Dragon Slayers, Street
Soccer, Lady Ronin, Last Stand, Knight Supreme, Pawn Mania, Soccer Chess — with 100+ puzzle
levels, 24 unlockable figures, daily and weekly challenges, and 90% positive of 120 Steam reviews
([Steam](https://store.steampowered.com/app/1831830/Chessarama/)) `[P]`. It keeps the pieces'
real move sets and swaps only the **goal**.

- **Prices:** nothing.
- **Rewards:** transfer — the same movement knowledge pays off in eight contexts.
- **Why it's fun:** it is the cheapest possible content axis, because the expensive object (piece
  movement) is reused whole.
- **Collides with:** nothing structurally; the risk is C11 (each goal still needs authored
  positions).
- **Transformation:** **`objective.type` is already a nine-value vocabulary** — `follow_theory`
  17, `win` 10, `reach_structure` 5, `preserve_plan_window` 4, `play_until_checkpoint` 3,
  `hold` 3, `run_trajectory` 3, `execute_break` 1, `prevent_opponent_plan` 1 across 47 packs
  `[V]`. Serving **one position under a second objective** is Chessarama's trick with our own
  vocabulary, and the schema already names the axis for it:
  **`alternate_plan_class`** and **`related_position_same_idea`**, two of the five dead
  `RETRY_VARIANT_KINDS` (§2a(ii)).
- **What would kill it:** the objective distribution is a long tail of ones — four of the nine
  kinds have ≤3 instances, and `prevent_opponent_plan` and `execute_break` have one each. A
  second objective over an existing position is only cheap if the *grading rules* for that
  objective are exercised, and D28 (an outcome leg with no `successConditions` grades nothing) is
  the standing warning that they may not be.

### 6e. The paired upgrade card — *Shotgun King*, and the best mechanic in the chess-indie set

*Shotgun King: The Final Checkmate* gives you a lone black King with a shotgun and, between
floors, a choice of **two card combinations, each granting one upgrade to YOU and one to the
ENEMY** ([Steam](https://store.steampowered.com/app/1972440/Shotgun_King_The_Final_Checkmate/))
`[P]`. PC Gamer, quoted on the store page: *"a supremely addictive turn-based roguelike, one of
the best to come around in a while"* `[P]`.

- **Prices:** nothing up front. Every gain is *paid for by strengthening the opposition*, and the
  player chooses the trade.
- **Rewards:** self-authored difficulty — the run's shape is a sequence of bets you made.
- **Why it's fun:** it is Neow's third blessing (*a real disadvantage bought with a real reward*)
  as the **core loop** rather than a one-off, and it makes the build non-monotone without any
  boss taking anything away.
- **Collides with:** **law 8**, if "stronger opponent" is a manufactured number.
- **Transformation, and it is exact:** our opponent axis is **measured, ruled, and published** —
  Maia's band, `[1000, 2400]`, R10, with adjacent 100-Elo steps changing the policy vector on
  50/50 non-forced positions `[V]`. So *"take this lens, and the rest of this act plays at
  +200 Elo"* is a paired card whose cost is a corpus-grounded human-behaviour band and not an
  invented stat. It is the **third** independent way to break the monotone lattice, alongside the
  loadout and the suppressor — and unlike the suppressor it is *elective*, so it produces no
  resentment. It is also the single best use of the one honest difficulty dial the campaign has.
- **What would kill it:** the shipped catalogue does not vary the band — **35 of 47 packs declare
  1800** and the corpus spans 1150–1900 `[V]` — so the dial is currently theoretical for content
  that hard-codes it. Whether an opponent band is *usable* as a per-run modifier depends on the
  pack's declared band being an override-able default, which today it is not. Second killer: R10
  found the band trajectory doubles back above ≈2500, so "+200" is only monotone inside the ruled
  range and the card must be clamped, visibly.

### 6f. Two currency philosophies, and the one beginners' products choose

**ChessKid** runs two currencies: **Stars** (learning points from lessons/puzzles/games, which
*"are never lost or deducted; they only increase"*) and **Gems** (*"pretend play money"* for
avatar items, earned by playing and never purchased)
([ChessKid help](https://support.chesskid.com/en/articles/12552532-how-do-stars-and-gems-work-on-chesskid)) `[P]` snippet-level.
**Lichess Practice** — five categories (Checkmates, Fundamental Tactics, Advanced Tactics, Pawn
Endgames, Rook Endgames) — has **no XP, no badges and no currency at all**, only per-unit mastery
marks ([lichess.org/practice](https://lichess.org/practice)) `[P]`.

- **Prices:** nothing, in both.
- **Rewards:** in ChessKid, a monotone record; in Lichess Practice, completion.
- **Why it's fun:** a monotone counter can never deliver bad news, which is the opposite of a
  rating.
- **Collides with:** **ADR-0007** for anything spendable — Gems survive it (earned by playing,
  never bought), a shop does not; and `06` §3 law 5 for anything priced by rarity.
- **Transformation:** we already have the monotone half and it is **tiny**: `Service.milestones()`
  mints exactly **7 kinds, all first-time-only** (`first_attempt`, `first_stable`,
  `first_objective_achieved`, `first_win`, `first_scheduled_return`, `ten_attempts_one_root`,
  `first_flip_sides`, `apps/server/src/service.ts:592-601`) `[V]` — at most seven events per
  learner, ever. The adoptable design is **Lichess Practice's**, not ChessKid's: per-unit mastery
  marks over a **named** vocabulary, which for us is the shape library (25 entries, 21 attested)
  and the concepts axis (§2a(iii)) — no currency, no number, and nothing that can go down.
- **What would kill it:** the vocabulary problem again (F11's killer). Lichess Practice works
  because its 5 categories and ~30 units are a curriculum somebody designed; our 156 concepts are
  a tag cloud with 132 singletons.

### 6g. One market datum the campaign should not miss

**5D Chess With Multiverse Time Travel** ships **branching timelines as the board itself** — a
turn axis and a timeline axis, where moving a piece into the past *branches a new timeline* — and
holds **96% positive of 6,575 Steam reviews**
([Steam](https://store.steampowered.com/app/1349230/5D_Chess_With_Multiverse_Time_Travel/),
[Wikipedia](https://en.wikipedia.org/wiki/5D_Chess_with_Multiverse_Time_Travel)) `[P]`.

That is not a campaign mechanic; it is **evidence for exploration Q9**, which is currently
`partial [V], owner n=1` and whose open half is *"can a player comprehend a branching board
surface"*. A commercially successful game answers *yes* for a surface **strictly harder** than
ours — ours branches one axis, theirs branches two and requires king safety in every timeline
simultaneously. It belongs in the Q9 row and in the adoption audit, and it did not appear in
either.

---

## 7. Is a drill pack the right campaign unit?

The owner's read, tested rather than accepted:

> *"micro-DLC (but free) — they add primitives for the engine to detect, tips/tricks, theory
> tie-ins, and then SOME mechanics for the campaign."*

**Verdict: right about the ROLE, one level off on the GRAIN, and the unit the campaign actually
needs is the RUN — which the runtime already says in a three-value type.** Four findings, all
`[V]` at `c55b9cf`.

### 7a. The shipped pack is not the design's pack — it is the design's *root*

`04-content-architecture.md` §1 declares a five-level taxonomy: **Root** (one position + one
decision family) · **Pack** (*"5–15 roots teaching one claim"*) · **Family** · **Trajectory** ·
**Track** (*"an ordered path through families for a rating band"*).

The shipped format has **no `roots` array at all**. The union of top-level keys across all 47
canonical packs is `authoredBoundary, checkpoints, concepts, deviations, difficulty,
feedbackClaims, feedbackPolicy, guard, id, legs, mode, objective, opponentPolicy, phase,
planClasses, provenance, retryVariants, shapes, spine, start, timingWindows, title, variantOf,
version` — **`start` is singular and present in 47 of 47; `roots` appears in 0 of 47** `[V]`.
Three packs carry `legs` (the trajectory shape) and that is the only multi-position structure.

> `DESIGN-GAP:` **`04` §1's Pack row describes an object that does not exist.** What ships as a
> "pack" is `04`'s **Root** — one position, one decision family, one objective — and the
> five-level taxonomy therefore has a shipped level 1, a shipped level 4 (trajectory legs), and
> **nothing at levels 2, 3 or 5**. `family`, `track` and `curriculum` return **zero hits**
> repo-wide, as do `campaign`, `run_set` and `playlist` `[V]`.

This is good news for the campaign and it inverts the question. Nobody has to *cut* packs down to
node size: **the shipped pack already is node-sized** (median `plyHorizon` 10.5, 6 own-move
decisions). The missing level is not below the pack but **above** it.

### 7b. The runtime's unit is the RUN, and two of its three kinds have no pack

`RunSessionKind = "pack" | "position" | "imported"` (`packages/runtime/src/types.ts:36`) `[V]`.
The `position` kind is not a fallback — it is the working unit of several shipped surfaces:

- **Just Play** and `/start/fen` (`apps/server/src/rest.ts:387`);
- **flip-sides derivation**, which manufactures a run from a node of another run
  (`service.ts:576`);
- **repertoire-gap runs** — `createRepertoireGapRun` builds a session from a **gap key**, a FEN
  and a resistance mode, with no pack anywhere (`service.ts:585-587`) `[V]`;
- **imported games** (`pgn-import.ts`), which `projectAttempts` explicitly declines to record
  (`progress.ts:84-86`).

So the campaign node does not need a pack to exist. It needs a **run specification**:
`{ start | packId, opponentPolicy, feedbackPolicy }` — which is exactly the object those four call
sites already build by hand, four times, in four shapes.

### 7c. What a pack actually contributes — and the one thing a pack-less node cannot do

Counted across the 47 canonical packs `[V]`: **330 deviations** (each bound to a named non-spine
`moveUci`), **189 checkpoints**, **131 plan classes**, **182 feedback claims**, **186 concept
tags**, **21 of 25 shape bindings**, an `objective` with grading rules, an `opponentPolicy` with a
band, and `authoredBoundary.plyHorizon` on 46 of 47.

And one hard constraint, which is the real answer to the unit question:

```
const graded = pack !== undefined && objectiveRules(pack, pack.objective, …).length > 0;
…
verdict: graded ? verdict(tip.objectiveState) : "open"
```
(`apps/server/src/progress.ts:90`, `:127`) `[V]`

> **A pack-less run is ungraded by construction.** Its verdict is forced to `"open"`.

That composes directly with `06` §5's accepted ruling — *a node remembers the branch you submit* —
because a node whose verdict is permanently `"open"` **cannot seal anything**. So:

- **Intermediate nodes may be pack-less.** They can be a mined candidate, a repertoire gap, a
  distilled session position, or a Just Play root. They are playable, readable at rung 0, and
  they carry no seal — which is exactly what an intermediate node needs to be if the seal is the
  boss's input.
- **Boss nodes must have a pack** (or an objective by some other producer), because the seal *is*
  the run's outcome.

That is a clean, shipped, non-arbitrary rule for where content is required, and it means the
campaign's content bill is **bounded by the number of act bosses, not by the number of nodes** —
3 per run under the 9-node shape, not 9.

### 7d. What the campaign's unit therefore is

**The unit is the run; the container the campaign is missing is `04` §1's `Track`.** Concretely, a
campaign is an ordered set of **run specifications** plus the run-scoped state
(`06` §1: loadout, suppression, sealed verdicts) — and a pack is a **content contribution to a
node**, which is precisely the owner's micro-DLC framing with the referencing relation the right
way round.

Three consequences, each with a measurement behind it:

1. **The catalogue-exhaustion argument weakens sharply.** `roguelike-run-design.md` §4c reasoned
   from 37 packs; the node supply is actually 47 packs **plus 43 mined candidates in
   `content/candidates/`** plus every position a learner has ever forked, and only the act bosses
   need to be packs `[V]`. Content decay (C11) remains real for *authored prose*, which is now the
   right thing to be worried about, rather than node count.
2. **The distribution channel the owner asked about is typed and half-exercised.**
   `ShapeChannel = "official" | "community"` (`apps/server/src/shape-registry.ts:10`) and packs
   carry the same pair (`pack-registry.ts:37`, `:47`, `:68`) `[V]` — and the brief's
   *"typed but unexercised"* is **too pessimistic**: `shape-studio.ts` ships a full
   draft → validate → `register` → `export` path with reserved-id, version-monotonicity and
   ownership refusals (`SHAPE_ID_RESERVED`, `SHAPE_VERSION_EXISTS`, `SHAPE_ID_NOT_YOURS`,
   `SHAPE_VERSION_NOT_INCREASING`, `shape-studio.ts:33-34`), and every community shape is added
   with `channel: "community"` at registration `[V]`. So third-party *primitives* have a real
   path. What has **no** path is a third-party **Track** — the thing a campaign would actually
   distribute — because the container does not exist.
3. **A "pack" is the wrong noun for the campaign to expose to a learner**, given 7a. If the
   shipped object is a root, the campaign's node label should say what it is — a *position with a
   question* — and reserve "pack" for whatever eventually fills `04` §1's level 2.

### 7e. What would kill this reading

- **If intermediate nodes turn out to need seals after all** — e.g. if R7 finds that an
  unsealed node reads as inconsequential no matter how it is framed — then every node needs a
  pack and the content bill returns to node count. That is the single measurement that would
  overturn 7c, and it is experiential.
- **If rung-0 reading on a pack-less node is not worth playing.** D78 is the standing worry: a
  pack-less node offers a census at 1.01× lift and nothing authored. `feedback-versus-the-dashboard.md`
  says the authored layer is where the specificity lives, so a run made mostly of pack-less nodes
  may be a run made mostly of the weak surface. **This is the strongest argument against 7d and it
  is measured, not speculative.**
- **If `content/packs/` stays empty**, the whole question is moot in production: today the
  deployment serves one pack (C13), so the campaign's real content supply is **1**, not 47.

---

## 8. Refused — the set the transformation ruling expects to be near-empty, and is

Per `design/02`'s amendment, *"genuinely no version survives"* is reserved for features whose
transformation would collapse the invariant itself. Three entries, each with the transformation
attempted and shown to fail, and in two of the three **half the mechanic survives** — which is
what the amendment predicts.

### ⛔ R1 · The prestige multiplier (the *idle* genre's engine)

*Cookie Clicker*'s Heavenly Chips are the **cube root of all-time cookies in trillions**, 1:1 with
prestige levels, +1% CpS each ([wiki](https://cookieclicker.wiki.gg/wiki/Ascension)) `[P]`;
*AdVenture Capitalist*'s angels are ≈ `150 × sqrt(lifetime earnings in quadrillions)`
([wiki, snippet](https://adventure-capitalist.fandom.com/wiki/Angel_Investors)) `[P]`; *Kittens
Game* grants paragon per kitten over 70 and unlocks *"an entire new tech tree"* post-reset `[P]`.

**Transformation attempted:** *reset the run, carry a multiplier.* It collapses on the
denominator. A prestige multiplier requires a quantity that (i) measures how far you got and
(ii) multiplies the next attempt's version of that same quantity. R4 and R9 jointly established
there is **no such measurable quantity across a run** — measured difficulty exists on two islands
that do not touch — so the multiplier would multiply a number we invented, which is C4 and law 8
in one object. **Half survives and is already ranked:** the *reset* is Gloomhaven's retirement
(D3), which needs no multiplier at all, only a thin permanent thread — and we have one
(milestones). **Refused: the carry-forward multiplier. Adopted: the reset.**

### ⛔ R2 · Rarity tiers (gacha's value model)

*Genshin*: 5★ base rate 0.6%, hard pity at **90** wishes, 50/50 on the featured character
([Game8](https://game8.co/games/Genshin-Impact/archives/305937)) `[P]`; *FEH*: 3% base, **+0.25%
every 5 summons**, guaranteed at 120, Spark at 40
([FEH wiki, snippet](https://feheroes.fandom.com/wiki/Summon)) `[P]`.

**Transformation attempted:** *lenses have rarities; rare lenses are better.* It dies on
**`06` §3 law 5** and it dies on a number: ρ(firing rate, usefulness) = **−0.143**
(`census-hint-false-positives.md`), so pricing a lens by scarcity is pricing noise, faintly
*negatively* correlated with what helps. Rarity is the purest form of the mistake this repo has
already measured twice. **Half survives, and it is the good half:** the **pity guarantee** —
"you will be offered the thing you are drafting toward within N offers" — is not a rarity model,
it is a *fairness* model over the offer stream, and it composes with the offered-choice draft
(`roguelike-run-design.md` rank 1) at zero cost. **Refused: rarity as value. Adopted: the
guarantee.**

### ⛔ R3 · The stamina gate

*Genshin*'s Original Resin caps at **200** and regenerates **1 per 8 minutes** (7/hr, ~26h40m from
empty), with Domains costing 20 and Trounce Domains 30–60
([Game8](https://game8.co/games/Genshin-Impact/archives/297554)) `[P]`; *Honkai: Star Rail* caps
Trailblaze Power at **300** at 1 per 6 minutes `[P]`.

**Transformation attempted:** *cap how much campaign a learner may play per day, so the drip
lasts.* There is no version. It prices **playing**, which is strictly worse than pricing
retrying — C1 forbids the lesser thing. It is also the pursuit clock (C4) with the sign flipped:
FTL charges you for dawdling, a resin gate charges you for engaging. And the drip it protects is
one we do not need — C11 says our supply problem is *authored prose per pack*, not runs per day,
so a stamina gate would ration the wrong resource. **Refused entire.** The one adoptable
fragment is not the gate but its *apology*: HSR's Reserved Trailblaze Power (D6), which exists
purely to soften a gate we are not going to have.

### Near-miss, resolved by transformation rather than refusal

**Literal chess variants** (§6a). The transformation — implement Fog of War's *idea* in the
assistance layer rather than in the move generator — is strictly better than the original,
because it keeps Syzygy, the explorer corpus, Maia's band calibration and all 47 packs valid. The
literal form is refused; the mechanic is adopted. And it is worth stating why the literal form is
the one case where transformation is *mandatory* rather than preferred: **every grounded
instrument this product owns is a standard-chess instrument**, so a variant node is a node with no
evidence stack — the failure shape `00-thesis.md` names as doing *"real damage"*.

---

## 9. Ranked shortlist

Criterion, stated so it can be argued with, and it is the predecessor's with one addition:
**(1)** survives law 8 without a chess-legal imitation; **(2)** our shipped primitives already
carry it; **(3)** authoring minutes; **(4)** which of the owner's three questions it answers; and
**(5) — new —** whether its failure mode is *measurable before building*, because five of the
mechanics below have a pre-test that costs less than the build.

| # | Mechanic | § | Answers | Shipped? | Authoring | Pre-test that would kill it |
|---:|---|---|---|---|---|---|
| **1** | **Daily shared position + spoiler-free branch-shape share** | D7 | Q1 (drip) | Corpus (47 packs + 43 candidates), run graph, `story_read` token — all ship | **0 min** | Design the glyph; if it cannot be drawn without becoming a score, stop |
| **2** | **Three-axis histogram over the learner's OWN submissions** (plies · rungs-at-submit · seal) | F8, F9, 6c | Q3 (fun without power) | `plyHorizon` 46/47, `AssistanceConfig`, `ObjectiveState` | **0 min** | **Correlate rungs-on with plies-to-objective on the existing corpus.** If they are one axis, the histogram is a disguised single score |
| **3** | **Wire `retryVariants`** — 5 declared kinds, 9 authored, **0 consumers** | 2a(ii), 6d, F15, F16 | Q1 + Q3 | Schema + `pack-check` counter only | **0 min** | Serve one pack under `alternate_plan_class` and see whether it reads as a new encounter |
| **4** | **Deliver the prediction checkpoint** (built, sparsity-linted, dropped at projection) | D10 | Q1 + Q2 | Schema `[V]`; `pack-registry.ts:66-71` drops `interaction` | **0 min** | Already gated by the ruled band `[1000,2400]`; check the listed-mass denominator first |
| **5** | **The Ship's Log** — `concepts` (map) + `shapeRecommendations` (rumor), annotated on the artifact | F11, D4 | Q1 + Q3 | Both producers ship; needs a corpus-global `ConceptResolver` | **0 min** + a vocabulary convention | Count concepts appearing in ≥2 packs: **24 of 156 today**. If that does not move, the log is a table of contents |
| **6** | **Reward branch BREADTH, not completion** (offer the draft on distinct played-out branches) | F3 | **Q2** (the direct answer) | `attempts.countable`, branch first-divergent-move, `plyHorizon` | **0 min** | Count distinct-divergence branches per root in the existing run corpus; if the median is 1, there is nothing to reward |
| **7** | **The paired card — a lens bought with +200 Elo of resistance** | 6e | Q3 | Band ruled `[1000,2400]`; but 35/47 packs hard-code 1800 | **0 min** | Whether a pack's declared band can be overridden per run |
| **8** | **Retirement — a root that has given you everything retires and unlocks the next** | D3 | Q1 (and answers C11) | `schedules` carries `root_key`/`due_at`; milestones as the thread | **0 min** | Compute "all of this pack's deviations have been seen" from the run log against `deviations[].moveUci` |
| **9** | **Rename `degraded` as *succeed at a cost*, and make it visible** | D9 | Q2 | `ObjectiveState`, `sealedState`, validator one-way rule | **0 min** | None — but it is void unless the boss actually behaves differently |
| **10** | **ADR-0007 clause: unlocked by playing, never by WINNING** | D2 | constraint | — | — | Not a feature; the cheapest thing in this document to get wrong |

**Two things to notice about that table.** Every entry costs **zero authoring minutes**, because
the wave's consistent finding is that this product's campaign problem is **delivery and
sequencing, not content** — the same verdict `feedback-versus-the-dashboard.md` reached for the
feedback layer (*"the remedy is delivery, not authoring"*), now reached independently for the
campaign layer. And **six of the ten already exist in shipped code with no consumer**:
`retryVariants`, `CheckpointInteraction.prediction`, `AssistancePermission.locked_off`,
`shapeRecommendations`, `attempt_concepts`, and `ObjectiveState.degraded`.

**What this dossier does NOT displace.** `roguelike-run-design.md`'s ranks 1–3 (offered-choice
lens draft, run-defining opening choice, capability-suppressing boss) remain the spine of the run;
nothing here competes with them. Items 1, 2 and 6 above are the three that the roguelike frame
could not have produced, because they come from genres with no power curve at all.

---

## 10. The owner question

**The reasoning first.**

The campaign has a settled *shape* — 9 nodes, 3 acts, stakes escalating in decidability
(`06` §5) — and a settled *stake*: a node remembers the branch you submit. What it does not have,
and what every mechanic in this dossier eventually runs into, is an answer to **what the
progression is denominated in.**

That question is unavoidable precisely because the power curve is flat. In Slay the Spire the
denomination is obvious — you are stronger, and the numbers say so. Here nothing compounds, so
"progress" has to be measured in something else, and the genre sweep found exactly three things
other people measure it in when there is no power. All three are legal under law 8. They cost
about the same to build. They produce **very different products**, and the difference is not
tuning — each one changes what the learner is looking at when they close the tab.

- **(a) Nothing — cadence and completion.** *Wordle* and *Lichess Practice*. One shared position a
  day; per-unit mastery marks over a named vocabulary; no number about the learner anywhere.
  Wardle's own framing is the argument: *"people have an appetite for things that transparently
  don't want anything from you."* **Consequence:** it is the cheapest, the most honest, and it
  introduces no new object the product has to defend. It is also the weakest hook for a *run* —
  it makes the campaign a curated sequence with a return ritual, which is close to
  `roguelike-run-design.md` §4d's option (b) that dossier called *"strictly weaker"*. It ships
  shortlist items 1, 5 and 9 and nothing else.

- **(b) The learner's own history — a three-axis histogram over their own submissions.**
  Zachtronics, with Chess.com's bot crowns as the chess precedent. Plies to objective · assistance
  rungs at submission · sealed state, compared against **your own** prior runs and never against
  other learners. **Consequence:** it is the only option that gives a flat-power product a real
  progression the learner can *feel*, and it has an honest basis nobody else's has — D78 measured
  the all-on state as the unreadable one, so "fewer rungs" is a claim about **noise**, not virtue.
  The price is that it introduces **the first number this product has ever shown a learner about
  themselves**, and two findings in this repo say numbers have pull that outruns their basis
  (ChessMonitor's manufactured FIDE estimate; Celeste's preamble, where identical mechanics read
  differently on a sentence). It also has a **pre-test that could kill it before any build** —
  if rungs-used and plies-used correlate, the three axes are one axis and the whole device is a
  score with extra steps.

- **(c) The catalogue — a collection.** Guild Wars 2 and Stardew Valley. Progression is *how much
  of the world you have seen*: shapes met, structures played, concepts encountered, with the
  "what's missing" mark living on the pack card and the shape entry rather than on a progress
  screen. **Consequence:** it is the most *chess*-shaped of the three — it maps onto how players
  actually describe improvement ("I've never played against the Maróczy") — and it turns the
  breadth of `04-content-architecture.md` into the reward rather than into a backlog. The price is
  that our collection vocabulary is not yet a collection: **156 concepts across 47 packs, only 24
  of them appearing in more than one pack**, and the default resolver namespaces them per pack so
  the same string in six packs is six keys. That is one injectable class plus an authoring
  convention — cheap in code, and an ongoing tax on every future pack.

**The question.** Which of these three is the campaign's progression denominated in — cadence and
completion (a), the learner's own history (b), or the catalogue (c)?

They are not mutually exclusive in principle, and (a) is a floor the other two build on. But
**(b) and (c) genuinely compete for the same screen**: a histogram of how you played and a map of
what you have seen are two different answers to "how am I doing", and shipping both means the
first thing a learner sees after a run is a choice about which kind of person they are. Picking
one first is the ruling; the other can arrive later without being erased.

**A second, smaller ruling is wanted alongside it**, because it is nearly free now and expensive
later. `06` §5's accepted stake gives the run a way to be lost. Every unlock system surveyed in
§3 — *My City*, *Pandemic Legacy*, *Dicey Dungeons*, *Balatro* (whose Mr. Bones unlocks on
*"Lose 5 runs"*), *Dungeon World* (where failure is the XP trigger) — deliberately **unlocks on
participation and never on victory.** ADR-0007 currently reads *unlocked by playing, never
purchased.* **Should it gain the twin clause — *never by winning* — so that the run can be lost
while the catalogue can never be locked?** Recommending yes: it costs nothing today, it is the
single most natural mistake to make once the campaign has a failure state, and every commercial
system that made it later removed it (WoW deleted attunements outright).

---

## 11. What this dossier does not establish

- **No hands-on with any comparison game or product in this pass.** Every external claim is `[P]`,
  and a meaningful minority came from search-index snapshots rather than fetched pages because the
  host refused (Fandom returned HTTP 402; `stardewvalleywiki.com`, `nookipedia.com`,
  `wiki.melvoridle.com`, `fireemblemwiki.org`, `chesstempo.com`, `chessgames.com` returned 403).
  Every such claim is marked *snippet-level* at its site. The affected figures are: Stardew's
  bundle/museum/season/friendship numbers, ChessKid's Stars/Gems, Lichess Puzzle Streak and Racer
  rules, FEH's pity table, FFXIV's Echo, HSR's reserve, Gloomhaven's retirement perk, Chess.com
  Lessons structure, and FM's attribute bands.
- **Several chess items could not be verified at all** and are recorded as gaps rather than
  claims: Chess.com "Puzzle Duel" (probably does not exist as distinct from Puzzle Battle);
  Chesstempo and chessgames.com Guess-the-Move scoring; the *Chess Life* Solitaire Chess point
  table (the closest historical ancestor to "score a whole game move-by-move" and worth a
  primary-source dig); Chess.com Vision's official time limit; and per-variant popularity on
  either platform.
- **Nothing here is measured about our learners.** Every "why it's fun" line is analysis. R6, R7
  and R8 stand exactly where `06` §4 left them, and five of the ten shortlist entries name a
  cheaper pre-test than waiting for them (§9).
- **The three-device claim (§5) is an argument, not a measurement** `[M]`. It follows from the
  sampled genres and could be broken by a fourth device someone finds; it is stated so it can be.
- **§7's unit verdict rests on code, not on play.** The rule *intermediate nodes may be pack-less,
  boss nodes may not* follows from `progress.ts:90` forcing a pack-less verdict to `"open"`; it
  has never been played, and §7e names the measurement that would overturn it.
- **The minutes question the predecessor raised is still open.** No per-attempt timing telemetry
  exists (`durationMs|elapsedMs|thinkTime` returns only a test stopwatch), so every run-length
  figure inherited here is `[M]`. **One owner run with a clock remains the cheapest single upgrade
  to the campaign cluster**, and this dossier adds a second cheap instrument to it: **count the
  reveals and the branches**, which turns shortlist items 2 and 6 from proposals into measured
  ones.
- **Two prior claims are corrected here rather than in their own dossiers** (§1): `06` §5's *"Act
  II is impossible today"* and `BACKLOG`'s *"Plan Drill is essentially UNAUTHORED"*. Both were
  true when written and are now stale; the correction is escalated via the ledger and the log, not
  by editing owner-tier text.

---

## Sources

**External, all `[P]`** (⚠ = snippet-level: the host refused direct retrieval and the claim comes
from a search-index snapshot of that page).

*Puzzle games and comprehension-only progression:*
[Outer Wilds](https://en.wikipedia.org/wiki/Outer_Wilds) ·
[Beachum interview](https://medium.com/@cordialkobold/interview-with-alex-beachum-creative-director-of-outer-wilds-a01bb9631e20) ·
[The Witness](https://en.wikipedia.org/wiki/The_Witness_(2016_video_game)) ·
[Return of the Obra Dinn](https://en.wikipedia.org/wiki/Return_of_the_Obra_Dinn) ·
[The Case of the Golden Idol](https://en.wikipedia.org/wiki/The_Case_of_the_Golden_Idol) ·
[Opus Magnum](https://en.wikipedia.org/wiki/Opus_Magnum) ·
[TIS-100](https://en.wikipedia.org/wiki/TIS-100) ·
[SpaceChem postmortem (Zach Barth)](https://www.gamedeveloper.com/design/postmortem-zachtronics-industries-i-spacechem-i-) ·
[Portal](https://en.wikipedia.org/wiki/Portal_(video_game)) ·
[The Talos Principle](https://en.wikipedia.org/wiki/The_Talos_Principle) ·
[Baba Is You](https://en.wikipedia.org/wiki/Baba_Is_You) ·
[Tunic](https://en.wikipedia.org/wiki/Tunic_(video_game)) ·
[Antichamber](https://en.wikipedia.org/wiki/Antichamber)

*Free experimentation:*
[Blow on Braid's rewind (GDC 2010)](https://www.gamedeveloper.com/design/video-jonathan-blow-explains-i-braid-s-i-rewind-mechanic-at-gdc-2010) ·
[Braid](https://en.wikipedia.org/wiki/Braid_(video_game)) ·
[Sands of Time](https://en.wikipedia.org/wiki/Prince_of_Persia:_The_Sands_of_Time) ·
[Celeste Assist Mode framing](https://www.vice.com/en/article/celeste-assist-mode-change-and-accessibility/) ·
[Hitman (2016)](https://en.wikipedia.org/wiki/Hitman_(2016_video_game)) ·
[Dishonored](https://en.wikipedia.org/wiki/Dishonored) ·
[Save the Date](https://en.wikipedia.org/wiki/Save_the_Date_(video_game))

*Skill without power:*
[Speedrun](https://en.wikipedia.org/wiki/Speedrun) ·
[Sequence breaking](https://en.wikipedia.org/wiki/Sequence_breaking) ·
[Hollow Knight](https://en.wikipedia.org/wiki/Hollow_Knight) ·
[La-Mulana](https://en.wikipedia.org/wiki/La-Mulana) ·
[Animal Well](https://en.wikipedia.org/wiki/Animal_Well) ·
[Dark Souls](https://en.wikipedia.org/wiki/Dark_Souls) ·
[Miyazaki on difficulty (Kotaku)](https://kotaku.com/elden-rings-difficulty-dark-souls-hidetaka-miyazaki-1848442415) ·
[Dance Dance Revolution](https://en.wikipedia.org/wiki/Dance_Dance_Revolution) ·
[osu!](https://en.wikipedia.org/wiki/Osu!)

*Drip and campaign pacing:*
[Universal Paperclips (the game)](https://www.decisionproblem.com/paperclips/index2.html) ·
[Universal Paperclips](https://en.wikipedia.org/wiki/Universal_Paperclips) ·
[Paperclips speedrun guide](https://www.zurd.ca/universal-paperclips-a-guide-and-my-history-for-a-speedrun/) ·
⚠[Strategic Modeling](https://universalpaperclips.fandom.com/wiki/Strategic_Modeling) ·
[Cookie Clicker — Building](https://cookieclicker.wiki.gg/wiki/Building) ·
[Cookie Clicker — Ascension](https://cookieclicker.wiki.gg/wiki/Ascension) ·
[Cookie Clicker — Grandmapocalypse](https://cookieclicker.wiki.gg/wiki/Grandmapocalypse) ·
⚠[AdVenture Capitalist — Angel Investors](https://adventure-capitalist.fandom.com/wiki/Angel_Investors) ·
⚠[Stardew — Bundles](https://stardewvalleywiki.com/Bundles) ·
⚠[Stardew — Museum](https://stardewvalleywiki.com/Museum) ·
⚠[Stardew — Seasons](https://stardewvalleywiki.com/Seasons) ·
⚠[Stardew — Friendship](https://stardewvalleywiki.com/Friendship) ·
⚠[ACNH — Museum](https://nookipedia.com/wiki/Museum) ·
[Genshin pity/banners (Game8)](https://game8.co/games/Genshin-Impact/archives/305937) ·
[Genshin Resin (Game8)](https://game8.co/games/Genshin-Impact/archives/297554) ·
⚠[HSR Reserved Trailblaze Power](https://honkai-star-rail.fandom.com/wiki/Reserved_Trailblaze_Power) ·
⚠[FEH Summoning](https://feheroes.fandom.com/wiki/Summon) ·
[WoW Attunement](https://warcraft.wiki.gg/wiki/Attunement) ·
[FFXIV patch cadence](https://ffxiv.consolegameswiki.com/wiki/Patches) ·
⚠[FFXIV — The Echo](https://ffxiv.consolegameswiki.com/wiki/The_Echo) ·
[GW2 Mastery](https://wiki.guildwars2.com/wiki/Mastery) ·
[GW2 Collections](https://wiki.guildwars2.com/wiki/Collections) ·
[GW2 Living World](https://wiki.guildwars2.com/wiki/Living_World)

*Tabletop, legacy and deckbuilders:*
[Gloomhaven rules](https://raw.githubusercontent.com/m-ender/gloomhaven-rules/master/README-no-images.md) ·
⚠[Gloomhaven retirement (Dized)](https://rules.dized.com/game/I7lEsCGOS2-zgol-ZRNf3g/hENxBDajTU6oySE7k41Bag/character-retirement-steps) ·
[Pandemic Legacy S1 rules](https://www.ultraboardgames.com/pandemic/legacy-season-1.php) ·
[Risk Legacy](https://spacebiff.com/2013/10/22/risk-legacy-2/) ·
[Charterstone](https://stonemaiergames.com/games/charterstone/) ·
[My City](https://www.knizia.de/my-city-our-legacy-game/) ·
[SETI review](https://www.tabletopgaming.co.uk/reviews/seti-search-for-extraterrestrial-intelligence-board-game-review/) ·
[Dominion 2E rules](https://www.64ouncegames.com/pages/dominion2nd-edition-rules) ·
[Balatro — Jokers](https://balatrowiki.org/w/Jokers) ·
[Balatro — Decks](https://balatrowiki.org/w/Decks) ·
[Balatro — Stakes](https://balatrowiki.org/w/Stakes) ·
[Dicey Dungeons episodes](https://wiki.diceydungeons.com/doku.php?id=episodes) ·
[Netrunner](https://nullsignal.games/players/learn-to-play/learn-to-play-corp/) ·
[Blades in the Dark — action roll](https://bladesinthedark.com/action-roll) ·
[Blades — consequences](https://bladesinthedark.com/consequences-harm) ·
[Dungeon World SRD](https://www.dungeonworldsrd.com/playing-the-game/) ·
["Fail forward" / succeed at a cost](https://www.runagame.net/2015/12/fail-forward.html)

*Management sims:*
[FM Recruitment (SI)](https://www.footballmanager.com/features/recruitment-revamp) ·
[FM22 Data Hub (SI)](https://www.footballmanager.com/features/gameplay-upgrades) ·
⚠[FM scouting bands](https://www.passion4fm.com/scouting-in-football-manager/) ·
[Scout reports](https://strikerless.com/2015/03/09/scout-reports-how-to-use-them-properly/) ·
[Inside the cult of Football Manager (Vice)](https://www.vice.com/en/article/inside-the-cult-of-football-manager/) ·
[OOTP scouting model](https://wiki.ootpdevelopments.com/index.php?title=OOTP_Baseball%3AImportant_Game_Concepts%2FThe_Scouting_Model) ·
[OOTP manual — scouting](https://manuals.ootpdevelopments.com/index.php?man=ootp21&page=scouting_players)

*Daily puzzles, party, ARGs:*
[Wordle](https://en.wikipedia.org/wiki/Wordle) ·
[Wardle interview (TechCrunch)](https://techcrunch.com/2022/01/12/josh-wardle-interview-wordle/) ·
[Wardle interview (Slate)](https://slate.com/culture/2022/01/wordle-game-creator-wardle-twitter-scores-strategy-stats.html) ·
[Semantle](https://en.wikipedia.org/wiki/Semantle) ·
[NYT Connections](https://en.wikipedia.org/wiki/The_New_York_Times_Connections) ·
[Chessle](https://www.chess.com/blog/GMJackL/chessle-like-wordle-but-for-chess-openings) ·
[Chessguessr repo](https://github.com/Assios/chessguessr) · [Chessguessr](https://www.chessguessr.com/) ·
[GeoGuessr](https://en.wikipedia.org/wiki/GeoGuessr) ·
[IGDA ARG whitepaper 2006](http://www.christydena.com/wp-content/uploads/2007/11/igda-alternaterealitygames-whitepaper-2006.pdf)

*Chess variants, puzzle formats and chess games:*
[Lichess variants index](https://lichess.org/variant) ·
[Chess960](https://lichess.org/variant/chess960) · [Crazyhouse](https://lichess.org/variant/crazyhouse) ·
[Atomic](https://lichess.org/variant/atomic) · [Antichess](https://lichess.org/variant/antichess) ·
[Horde](https://lichess.org/variant/horde) · [Racing Kings](https://lichess.org/variant/racingKings) ·
[Three-check](https://en.wikipedia.org/wiki/Three-check_chess) ·
[Duck Chess](https://support.chess.com/en/articles/8615411-what-is-duck-chess) ·
[Fog of War](https://www.chess.com/terms/fog-of-war-chess) ·
[Chess.com puzzles (Rush/Battle/points/streak)](https://support.chess.com/en/articles/8608686-how-do-puzzles-work-on-chess-com) ·
[Puzzle Storm](https://lichess.org/page/storm) · [Lichess Practice](https://lichess.org/practice) ·
[Chess.com Vision](https://support.chess.com/en/articles/8615408-what-is-vision) ·
[Chess.com bots](https://support.chess.com/en/articles/8614091-how-can-i-play-against-the-chess-com-bots) ·
[Chess.com achievements](https://support.chess.com/en/articles/8618496-what-are-achievements) ·
⚠[ChessKid Stars and Gems](https://support.chesskid.com/en/articles/12552532-how-do-stars-and-gems-work-on-chesskid) ·
[Proof game](https://en.wikipedia.org/wiki/Proof_game) · [Retrograde analysis](https://en.wikipedia.org/wiki/Retrograde_analysis) ·
[Shotgun King](https://store.steampowered.com/app/1972440/Shotgun_King_The_Final_Checkmate/) ·
[Pawnbarian](https://store.steampowered.com/app/1142080/Pawnbarian/) ·
[Chessarama](https://store.steampowered.com/app/1831830/Chessarama/) ·
[Really Bad Chess](https://en.wikipedia.org/wiki/Really_Bad_Chess) ·
[Zach Gage on Really Bad Chess](https://www.gamedeveloper.com/design/how-zach-gage-breaks-all-of-the-rules-in-i-really-bad-chess-i-) ·
[5D Chess (Steam)](https://store.steampowered.com/app/1349230/5D_Chess_With_Multiverse_Time_Travel/) ·
[5D Chess](https://en.wikipedia.org/wiki/5D_Chess_with_Multiverse_Time_Travel)

**Repo, at `c55b9cf`, `[V]`:** `content/drafts/*.json` (47 canonical packs — phase/mode/objective
distributions, `plyHorizon`, deviations, checkpoints, `concepts`, `retryVariants`, `targetElo`,
`timingWindows`, `variantOf`, `graduationBlockers`); `content/shapes/*.json` (25 entries);
`content/candidates/` (43); `content/packs/` (empty but for `.gitkeep`);
`packages/runtime/src/types.ts:36` (`RunSessionKind`);
`packages/runtime/src/assistance.ts:3-29` (`AssistanceConfig` v4, `AssistancePermission`,
`SILENT_ASSISTANCE`, `permittedAssistance`);
`packages/schema/src/drill-pack/types.ts:27-33` (`RETRY_VARIANT_KINDS`), `:221` (`concepts`),
`:223` (`retryVariants`); `packages/schema/src/drill-pack/lint.ts:115-138` (prediction sparsity);
`apps/server/src/progress.ts:52-59` (`ConceptResolver`, `PackScopedConceptResolver`), `:84-90`,
`:127`, `:139`; `apps/server/src/storage.ts:1338`, `:1380-1393`, `:2529-2538`;
`apps/server/src/service.ts:576`, `:585-587`, `:592-601` (milestones), `:758-777`
(`shapeRecommendations`); `apps/server/src/rest.ts:387`, `:1090`, `:1107`;
`apps/server/src/shape-registry.ts:10`; `apps/server/src/shape-studio.ts:26`, `:33-34`;
`apps/server/src/pack-registry.ts:37`, `:47`, `:66-71`; `apps/server/src/pack-check.ts:24`, `:83`;
`apps/server/src/capabilities.ts:95-115` (36 capability rows: 14 reached / 15 refused /
6 unmeasured / 1 impossible); `apps/web/src/lib/DrillScreen.svelte:717-720`; commit `aee7c64`.

**Dossiers:** `roguelike-run-design.md` (this dossier's direct predecessor),
`campaign-effect-vocabulary.md`, `campaign-intermediate-consequence.md` (its C1–C10 are inherited
whole), `feedback-versus-the-dashboard.md` (D78), `census-hint-false-positives.md` (ρ = −0.143),
`practical-difficulty-outside-tablebase.md` (R4), `human-outcome-coverage-depth.md` (R9),
`maia-band-calibrated-range.md` (R10), `maia-policy-scalar-stability.md` (R5),
`engine-layer-capability-audit.md`, `pack-authoring-cost.md`, `adoption-audit.md`,
`quickpass-wintrChess-encroissant-chessmonitor.md`, `broadcast-and-teacher-surfaces.md`.

**Design and process:** `00-thesis.md` (§Why anyone), `02-product-shape.md` (§Adoption posture and
its 2026-08-14 transformation amendment), `04-content-architecture.md` §1, `05-in-run-experience.md`
§1/§3/§3a/§5, `06-campaign.md` §1/§2a/§2c/§3/§5, `AGENTS.md` law 8, ADR-0005, ADR-0006, ADR-0007,
`rfc/pack-graduation.md`.
