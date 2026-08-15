# Campaign intermediate-node consequence — what a stake can be when nothing may be priced

**Question (owner, 2026-08-15):** *"i lean to bosses only… but i kinda don't like it if all
the intermediate is without consequence.. we need to ideate some more… we can also look
into other categories of games (ie balatro or something random)"*

`design/06-campaign.md` §5 leaves six of nine nodes with nothing attached to how they go.
This dossier asks what an intermediate-node consequence can **be**, given a refusal list
that is longer than the proposal list. It is the companion to
`design/research/roguelike-run-design.md` (which asked what *shape* a run has) and
`design/research/campaign-effect-vocabulary.md` (which counted what an unlock can be); it
extends both and re-derives neither.

**One sentence.** The consequence the owner is asking for **already exists in shipped,
validated code, one scope level down** — the objective ladder's `degraded` state is a
one-way, non-fatal, forward-carried verdict, trajectory legs seal it at each node
boundary, and the pack validator already *forbids* opening-type nodes from ending a run
while *permitting* outcome-type nodes to end one — so `06` §5's "two encounters plus an
act boss" is a rule the format enforces rather than a structure to invent; what is missing
is not a mechanism but a **scope**, because every one of those seals is path-scoped and a
rewind produces a clean path, which reduces the whole design space to one owner decision:
**which path does a node remember?**

---

## Method, and its limits stated first

1. **Repo claims are `[V]`**, checked in this pass at `0fbf0ef` (working tree clean of the
   files cited). Pack counts are a Python walk over `content/drafts/*.json`, canonical packs
   = those declaring a `phase`, `.browser.json` fixtures and sidecars excluded — the same
   selection `campaign-effect-vocabulary.md` §Method and `roguelike-run-design.md` §2c used,
   so the counts are comparable to theirs.
2. **External game claims are `[P]`.** Fandom hosts (`intothebreach.fandom.com`,
   `dishonored.fandom.com`) returned **HTTP 402** to direct retrieval in this pass, so those
   quotations come from the search index's snapshot of the cited page rather than from the
   page itself. That is a real weakening and it is marked at each site. `balatrowiki.org`
   was retrieved directly.
3. **No hands-on with any comparison game in this pass**, same limit
   `roguelike-run-design.md` §6 declared. Nothing here rests on a play session.
4. **Nothing here is measured about *our* learners.** Every claim about how a proposed
   consequence would *feel* is `[M]` and is exactly what R6/R7/R8 gate.

---

## 1. The constraint set, enumerated before anything is proposed

The constraints are the interesting part of this problem, so they are listed first and
every mechanism below is checked against them by number.

| # | Constraint | Source | What it forbids |
|---|---|---|---|
| **C1** | *"Experimentation without cost"* is one of the two answers to why anyone uses this at all | `design/00-thesis.md:76-79` | Any price on **retrying**, in any denomination, including a clock |
| **C2** | *"The consequence stays mandatory; only the retry is free… play it out, then go back — never take it back"* | `design/00-thesis.md` §Why anyone, 2nd consequence | Any consequence that arrives **before** the position is played out |
| **C3** | No LLM-manufactured chess truth; no ungrounded grading of moves | `AGENTS.md` law 8, ADR-0005 | Any consequence keyed to a **judgement about the learner's chess** that no instrument grounds |
| **C4** | Escalating numeric economies and a pursuit clock are on the refused list | `design/06-campaign.md:176-178`, `roguelike-run-design.md` §2b rows B and C | Balatro's 300→50,000 climb and FTL's fleet, and every chess-legal imitation of them |
| **C5** | Progression is unlocked by playing, never purchased | ADR-0007, `06` §3 law 2 | Any shop, any currency the learner can spend on capability |
| **C6** | **What escalates is legibility, not power**; the power curve is flat by construction | `06:174-178` | Any consequence that reads as *"you got weaker"* unless it is literally a change in what you can **see** |
| **C7** | **Rarity is not value** — ρ(firing rate, usefulness) = **−0.143** | `06` §3 law 5, `census-hint-false-positives.md` | Any economy that prices a lens by **how often it fires**, including "your most-used lens" |
| **C8** | Honesty policy and inventory are independent; two gates, honesty outer | `06` §3 law 1, `05` §3/§3a | Any consequence that changes **what may honestly be shown**, as opposed to what is switched on |
| **C9** | The **all-on state is the unreadable one** — median 58 observations/position, compare strip 8.31 entries/ply at **1.01×** lift | D78, `feedback-versus-the-dashboard.md`, `06:180-183` | Nothing — this is the one constraint that **licenses** a budget, because refusing to print noise is not withholding a reward |
| **C10** | Anything surfaced unasked obeys the live-surface admission rule | `06` §3 law 6 | Any consequence announced by a marker that has not passed L1–L6 |

### 1a. The residue — what the ten constraints leave standing

Read together they are narrower than they look, and the residue has a shape. Exactly three
kinds of consequence survive:

- **(i) Denominated in the learner's information.** C3 and C6 both point here: a statement
  about what the learner can *see* is never a statement about chess, so it cannot
  manufacture chess truth and cannot inflate power. This is the ground the
  capability-suppressing boss already stands on (`06:201-206`).
- **(ii) The position itself.** A carried board needs no grading, no scale and no number —
  it is self-evident. C3 is satisfied vacuously, because nothing is being *asserted*; the
  board simply is what the learner made it. This is the only survivor that is not
  information-denominated.
- **(iii) Self-inflicted opportunity cost.** A cost the learner **chose** is not a price the
  product charged. C1 forbids the product pricing a retry; it does not forbid the learner
  spending something they elected to spend. This is Balatro's discard and Hanabi's clue
  token, and it is why C9 licenses a slot budget at all.

**Anything not reducible to (i), (ii) or (iii) is dead on arrival, and §3 uses that as the
test.** Note what the residue excludes by construction: every consequence denominated in
*how well you played*, because grading is C3's exact prohibition and the two islands of
measured difficulty (`06` §2a) do not cover a run.

---

## 2. What the shipped runtime can actually hold

The design has been reasoning about a client-side settings object. The runtime has four
other homes, and one of them already does the job.

### 2a. `06` §1's claim about `AssistanceConfig`, verified and sharpened

`06:62-64` says the inventory *"lives in browser localStorage keyed by session kind, so it
cannot hold something earned"*. **Confirmed, and it is worse than stated** `[V]`:

- The key is `` `tabiya.assistance.v1.${kind}` `` (`apps/web/src/lib/assistance-preference.ts:4`)
  over `RunSessionKind = "pack" | "position" | "imported"`
  (`packages/runtime/src/types.ts:36`) — so **three keys exist, ever**, for a learner's
  entire history.
- The type is nine axes plus a version discriminant
  (`packages/runtime/src/assistance.ts:3-14`), read at
  `assistance-preference.ts:19-22` and written at `:23`.
- **The server never receives it.** `apps/web/src/lib/api.ts` contains zero occurrences of
  `assistance` — no request body carries it — and every server-side mention
  (`apps/server/src/rest.ts:93,1048,1065`; `service.ts:820`) calls `permittedAssistance`,
  which derives the *honesty gate* from run state and role and reads nothing the learner
  chose (`packages/runtime/src/assistance.ts:27-30`). No SQL table has an assistance column.

So the gap is not "keyed too coarsely". It is that **the loadout is client-authored and
unauthenticated**, which makes anything earned in it unverifiable — an ADR-0007 problem, not
a plumbing one.

### 2b. The four scopes that do persist, and what survives a rewind

`[V]`, all file:line checked this pass.

| Scope | What lives there | Where | Survives a rewind? |
|---|---|---|---|
| **node / branch** | `objectiveState` — a **6-value** ladder (`packages/runtime/src/types.ts:4-10`), held per node (`types.ts:102`) | inside the run log | **No.** `historyFrom(run, leaf)` walks the *current path*; a clean path has no degraded ancestor |
| **run** | the 16-kind append-only `DrillRunEvent` log (`types.ts:275-291`), `seq` derived from length (`packages/runtime/src/events.ts:377-385`) | `drill_runs.snapshot_json` (`apps/server/src/storage.ts:553-558`) — **one blob, no `run_events` table**, so nothing is queryable across runs | Yes — rewind **appends** `run.rewound` and deletes nothing (`packages/runtime/src/runtime.ts:402-412`) |
| **attempt** | one row **per branch**: `objective_state`, `verdict ∈ (stable, unstable, open)`, `countable`, `graded`, `origin ∈ (fresh, duplicate, scheduled, in_run_retry)` | `attempts`, PK `(run_id, branch_id)` (`storage.ts:2490-2518`) | Yes, and this is the only **server-held** record of how a branch went |
| **principal** | `learner_position_stats(learner_id, transpose_key, seen_count)` (`storage.ts:2552-2557`); `schedules` (`:2532-2548`); 7 first-time-only milestones (`service.ts:592-596`) | server | Yes |
| **client** | `AssistanceConfig`, 3 keys | localStorage | n/a — and unauthenticated (§2a) |

**Above the run there is nothing.** `campaign`, `run_set`, `curriculum` and `playlist` are
**0 hits** across `apps/`, `packages/`, `schemas/` and `content/` `[V]`. The only shipped
run→run edges are `run_derivations` with a single kind `flip_sides`
(`storage.ts:2235-2242`) and `schedules.source_run_id`/`started_run_id`
(`storage.ts:2532-2548`, minted at `service.ts:430-439`) — **and the schedule edge carries a
due date and a back-reference, no gameplay state whatsoever.** The closest shipped
multi-node container is `arena_legs`, PK `(session_id, leg)` with `leg IN (1,2)`
(`storage.ts:2446-2456`), and it explicitly refuses carried state: *"Leg 1 requires an
untouched arena run"* (`apps/server/src/live-session.ts:232`).

### 2c. The find: the consequence already exists, and it is called `degraded`

This is the dossier's main result, and nothing in the campaign cluster has cited it.

**`ObjectiveState` has six values, and exactly three of them are absorbing** `[V]`:

```ts
// packages/runtime/src/trajectory.ts:6
const ABSORBING = new Set<ObjectiveState>(["achieved", "failed", "transitioned"]);
```

`preserved` and `degraded` are **not** absorbing. So the runtime already distinguishes *a
node went badly and play continues* from *a node ended things* — the exact distinction
`06` §5 is missing, shipped and under test.

Four properties make `degraded` the right object rather than a coincidence:

1. **It is one-way, and the validator enforces it.** `pack-validation.ts:469` raises
   `OBJECTIVE_DEGRADED_IS_ONE_WAY` — *"degraded outcome objectives may not return to
   preserved"* `[V]`. An intermediate consequence that could be undone in place would not
   be one.
2. **It is produced by authored content today, not by a grader.** `pack-orchestrator.ts:367-385`
   compiles one `→ degraded` rule per deviation carrying `offObjective`, keyed on
   `deviationPlayed`. Corpus count `[V]`: **275 deviations across 37 canonical packs, 76 of
   them `offObjective`** — i.e. 76 authored, named, non-spine moves that degrade an
   objective without ending anything. That trigger is a **human author naming a move**, so
   C3 is satisfied at the source: no instrument is grading anybody.
3. **It survives the boundary between nodes, sealed.** At a trajectory leg transition
   (`apps/server/src/pack-orchestrator.ts:556-575`) the move is graded against the
   *outgoing* leg, and crossing the incoming leg's entry checkpoint resets the objective to
   `active` — **but only from `preserved` or `degraded`** (`:566`); an absorbing state stops
   the run instead. The outgoing verdict is not lost: it is recovered from the
   `objective.state_changed` event's `from` field and stored as `sealedState` on the span
   (`packages/runtime/src/trajectory.ts:83-92`, type at `:15`), and surfaces per leg in
   `TrajectoryVerdict` (`:39-44`, `:108-150`).
4. **Nodes can be skipped, and the skip is recorded.** `skippedLegIds`
   (`trajectory.ts:27`, computed `:130`) names the legs a transposition jumped over — so
   *"which encounters you never entered"* is already part of what a run carries forward.

### 2d. And the intermediate/boss split is already a validator rule

The sharpest corollary, and it reframes the owner's problem `[V]`:

```
pack-validation.ts:457  THEORY_ABSORBING_UNSUPPORTED
                        "follow_theory cannot enter an absorbing objective state"
pack-validation.ts:463  OBJECTIVE_ABSORBING_WITHOUT_OUTCOME
                        "outcome objectives may enter an absorbing state only from an
                         outcome condition"
```

Objective types across the 37 canonical packs `[V]`: `follow_theory` **17**, `win` **10**,
`play_until_checkpoint` **3**, `hold` **3**, `run_trajectory` **3**, `execute_break` **1**.

So **17 of 37 packs are structurally incapable of ending a run, by validator rule**, and
13 (`win` + `hold`) can end one only on a real outcome condition. The catalogue is
*already* partitioned into "cannot be lost" and "can be lost", and the partition is almost
exactly `06` §5's intermediate/boss split — Act I's `theory_strict` openings on the
un-losable side, Act III's tablebase outcomes on the decisive side.

And the shape of an act is already in the content `[V]`: **all three canonical trajectory
packs have exactly three legs, and in all three the last leg is the only one with an
absorbing objective**:

| Pack | Leg 1 | Leg 2 | Leg 3 |
|---|---|---|---|
| `trajectory-caro-advance-chain-bishops` | `follow_theory` | `execute_break` | **`hold`** |
| `trajectory-qgd-exchange-minority` | `follow_theory` | `execute_break` | **`win`** |
| `trajectory-mate-bishop-knight` | `reach_structure` | `reach_structure` | **`win`** |

`06` §5's *"per-act composition: 2 encounters + 1 act boss"* is not a structure to build.
It is the shape three authors independently wrote, gated by `entryCheckpointId`, with the
non-fatal seals in front and the decisive node last.

> **`DESIGN-GAP:`** `06` §5 states *"No resource refusal exists anywhere in the runtime,
> and no loadout mechanism creates one"* and concludes *"the campaign as designed has no
> failure state."* The first clause is **correct** (§2e). The conclusion **does not
> follow**: the runtime has a failure state — the absorbing objective states — and a
> validated non-fatal one beneath it. What it lacks is a *resource* refusal, which is a
> different absence. Conflating the two is what made every proposal so far reach for
> invented scarcity, and therefore collide with C1 every time. Escalation owed to
> `planning/exploration/log.md`.

### 2e. What is genuinely absent, so the accounting is honest

Re-verified this pass `[V]`, and `06` §1 and `roguelike-run-design.md` are right about all
of it:

- **No resource refusal anywhere.** `SIMULATE_BUDGET_EXCEEDED` is declared
  (`apps/server/src/errors.ts:42`) and mapped (`rest.ts:532`) and **never thrown** — its
  siblings `SIMULATE_TOO_LARGE` (`service.ts:1255`) and `SIMULATION_EXPIRED` (`:1320`) are.
  The only refusal that blocks a solo learner from rewinding or forking is `MATCH_LIVE`
  (`service.ts:1652`, `:1663`), a concurrency guard that fires because another human is
  waiting. No table anywhere has a balance, quota or currency column.
- **No run-level verdict.** `attempts` is keyed `(run_id, branch_id)` and
  `projectAttempts` emits one row per branch (`apps/server/src/progress.ts:91`); a run with
  four retry branches yields four independent verdicts and **no roll-up**. `verdict` is
  additionally forced to `"open"` unless the pack has objective rules (`progress.ts:127`,
  `:90`). *"Did this run succeed"* is not computed anywhere.
- **No `submit` verb.** The POST action surface (`rest.ts:995-1424`) has no `submit`,
  `declare`, `done`, `finish` or `resign`. The nearest thing is `reveal`
  (`rest.ts:1171-1179` → `runtime.ts:240-259`): learner-initiated, idempotent,
  lease-gated, semantically already *"I am done attempting; show me"* — but it records only
  `{ nodeId }`, asserts no answer, and its effect is erased by the next committed move.
- **No per-lens grain.** `grep -rni "lens\|loadout"` over `packages/`, `apps/`, `docs/`,
  `rfc/` returns **nothing**. The three lens vocabularies exist as *ordering* lists only —
  `STRUCTURAL_FEATURE_KINDS` 18 (`packages/schema/src/drill-pack/types.ts:325-330`),
  `TRANSITION_FEATURE_KINDS` 6 (`:381-388`), 25 shape entries in `content/shapes/` — and
  the generators loop them unconditionally (`transition.ts:348`; `structure.ts:452-500`).
- **A rewind budget would need no schema change, if one were ever wanted.**
  `run.rewound` is an appended event (`runtime.ts:402-412`), so the spend counter is already
  a fold over the existing log, exactly as `feedbackDeliveryOpen` folds disclosure
  (`feedback.ts:22-30`). Recorded because it is cheap, **not** because it is recommended —
  C1 refuses it.

---

## 3. The mechanisms, and what each one prices

Ten mechanisms from six categories the prior dossier did not reach into. For each: what it
prices **there**, what it would price **here**, which residue class it falls in (§1a), and
what kills it.

### M1 · Carried board state — Into the Breach's Power Grid

- **There.** The player begins with **5 Grid Power** and may hold up to **7**; a destroyed
  civilian building costs **1 Grid Power per building**, and *"increases and decreases to
  Grid Power persist between Islands"*. Zero grid ends the timeline
  ([ITB Wiki — Grid Power](https://intothebreach.fandom.com/wiki/Grid_Power),
  [Civilian Building](https://intothebreach.fandom.com/wiki/Civilian_Building)) `[P]`,
  *retrieved via search index; the host returned HTTP 402 to direct fetch*.
- **Prices there:** carelessness in a mission you nonetheless *won*. ITB missions are won
  by surviving N turns, so a "victory" that flattened three buildings is a materially worse
  campaign position. That is precisely the owner's *"intermediate without consequence"*
  complaint, solved without a loss condition.
- **Here:** the board handed to the next node. **Residue class (ii)** — the position needs
  no grading and asserts nothing, so C3 is satisfied vacuously, and it is the *only*
  survivor that is not information-denominated.
- **Shipped?** More than shipped: it is what a trajectory pack **is** (§2c). One `start`,
  one `spine`, legs are spans of one continuous run gated by `entryCheckpointId`
  (`trajectory.ts:61-102`), with a per-leg objective (`types.ts:234-239`).
- **What kills it:** **content, and it kills the map.** A carried position must be
  reconcilable with the next node's authored material, which means a chain of nodes must be
  authored *as a chain*. We have **3** such packs (§2d), the middlegame catalogue is **1**
  pack (`campaign-effect-vocabulary.md` §2c), and the middlegame bill is **65.0 min/pack**
  (`pack-authoring-cost.md` §4). Worse, a positionally-chained run is **linear by
  construction** — no route choice, no draft variety — so it spends the 278,256 loadout
  builds to buy narrative continuity. It also re-collides with §4c of
  `roguelike-run-design.md`: authored content is read-once, so a fixed chain decays faster
  than a drafted map.

### M2 · Sealed segment verdict — the same thing, one abstraction up

- **There:** ITB again, plus every campaign game with a mission log.
- **Here:** the intermediate node seals `preserved` or `degraded` and the run carries the
  seal to the boss, which reads it. **Residue class (i)** — the seal is a *record*, and
  what it buys is legibility (§4).
- **Shipped?** The seal is shipped and validated: `sealedState` (`trajectory.ts:15`,
  produced `:83-92`), the reset-from-non-absorbing-only rule
  (`pack-orchestrator.ts:566-569`), the one-way rule (`pack-validation.ts:469`), the
  per-leg record with `status`, `producedBy` and `skippedLegIds` (`trajectory.ts:108-150`).
  **What is missing is one scope**: the seal is path-scoped, so a rewind to a clean line
  erases it (§2b). That single fact is the whole owner question (§6).
- **What kills it:** if the owner rules that no path is privileged, the seal is always
  escapable and the mechanism degenerates to *"did you bother to fix it"* — a real but very
  thin stake. It also inherits R7 entirely: nobody has measured what it feels like to reach
  a boss under a seal you cannot lift.

### M3 · Unspent resource converts — Balatro's cash-out

- **There.** Each round is played with a fixed pool of **Hands** and **3 Discards** (2 on
  Blue Stake or above), reset per round; *"if the player finishes a round with some hands
  leftover, by default, they will gain $1 for each remaining hand"*, and the Green Deck pays
  *"$2 per remaining hand and $1 per remaining discard"*
  ([Discards](https://balatrowiki.org/w/Discards), [Hands](https://balatrowiki.org/w/Hands))
  `[P]`, retrieved directly.
- **Prices there:** the *efficiency* of information-gathering. A discard is how you go
  looking for a card; every discard you did not need becomes economy. Crucially **Balatro
  prices looking, not retrying** — you never get the hand back.
- **Here:** the `attempt_end` reveal window already **is** a consumable that prices looking
  — it opens on reveal and closes on the next committed move (`feedback.ts:22-30`), a
  non-monotone latch that is the only place in the assistance stack where disclosure
  *retracts*. `roguelike-run-design.md` §3 rank 5 proposed budgeting it. **M3 is the new
  half: unspent reveals convert forward.** A node you read cleanly funds the boss.
  **Residue class (iii)** — the spend is elective.
- **Shipped?** The window ships; the counter does not, and it would be another fold over
  the run log (`feedback.revealed` events are already there).
- **What kills it, and it is a real strike:** **C9 does not cover it.** The slot budget is
  honest because the all-on state was *measured* unreadable; a *reveal* budget has no
  measured cost function — the number of reveals per node is invented, which is exactly the
  scarcity C1 refuses when it lands on the learner who needed the help. And a learner who
  arrives at the boss with no reveals left has been punished for having found an
  intermediate node hard, which is the thesis's own failure mode wearing a new hat. **R6
  and R7 gate this one specifically and neither has run.**

### M4 · Information tokens with a give-something-up regeneration — Hanabi

- **There.** The team starts with **8 clue tokens**; spending one gives a clue, and *"the
  only way to return a clock token to the supply is by discarding a card"* — and you may not
  discard while all 8 are available
  ([hanabi-live rules](https://github.com/Hanabi-Live/hanabi-live/blob/main/docs/rules.md))
  `[P]`.
- **Prices there:** asking, in the currency of giving something up. It is the cleanest pure
  information economy in the comparison set — no power, no damage, no clock.
- **Here:** the tempting mapping is *"regain a reveal by committing a move without one"*.
  **Residue class (iii)**, and it is genuinely law-8-clean.
- **What kills it:** the regeneration rule has no honest chess denomination. In Hanabi
  discarding is *risky* — you might burn the card the team needs — and the risk is what
  makes the token worth something. Here the equivalent risk would have to be a chess
  judgement about the move you committed unaided, which is C3. Strip the risk and the
  token regenerates for free, which makes the economy decorative. **Dies to C3 in the
  regeneration half.** Recorded because it is the sharpest *negative* result here: an
  information economy with an honest spend can still fail on its refill.

### M5 · Roster attrition — XCOM wounds, Darkest Dungeon stress

- **There.** XCOM 2 soldiers are *"Lightly Wounded", "Wounded"* or *"Gravely Wounded"*
  depending on days-until-recovery and are unavailable meanwhile
  ([XCOM Wiki — Hit Points](https://xcom.fandom.com/wiki/Hit_Points_(XCOM_2))) `[P]`.
  Darkest Dungeon is harsher: *"unlike combat damage, stress is not fully healed when
  finishing a mission"*, and treating a stressed hero *"temporarily removes them from the
  pool of available characters"*
  ([Darkest Dungeon Wiki — Stress](https://darkestdungeon.wiki.gg/wiki/Stress_(Darkest_Dungeon)))
  `[P]`.
- **Prices there:** using your best asset. Both games force roster rotation, so a won
  mission still costs you the squad you won it with.
- **Here:** a lens you leaned on at node N is suppressed at node N+1 — Balatro's Ox
  (*"playing the most played hand this run sets money to $0"*,
  [Blinds and Antes](https://balatrowiki.org/w/Blinds_and_Antes) `[P]`) applied to lenses.
  It reuses the accepted suppressor machinery (`06:201-206`) with a self-inflicted trigger.
- **What kills it — and this is the cleanest kill in the dossier: C7, with a number.**
  "Most-used" is a frequency, and **ρ(firing rate, usefulness) = −0.143**
  (`census-hint-false-positives.md`). Targeting the lens you leaned on hardest is
  therefore targeting **noise** — the correlation is not merely weak, it is faintly
  *negative*, so the mechanism is as likely to remove a lens that was carrying you as one
  that was not. Beneath that it is also a hint tax: it prices asking for help, which is C1
  read one level up from moves. **Dead twice over, and the first death is measured.**

### M6 · World-state drift — Dishonored's Chaos

- **There.** Chaos is *"chiefly calculated by the number of people killed"* and changes
  later levels: *"the number of guards present in each area and their strength, the quantity
  of rats, weepers, and bloodflies encountered during missions, and the appreciation of
  various characters for the protagonist"*
  ([Dishonored Wiki — Chaos](https://dishonored.fandom.com/wiki/Chaos)) `[P]`, *retrieved
  via search index; the host returned HTTP 402 to direct fetch*.
- **Prices there:** nothing, and that is the elegance — high chaos is not *harder*, it is a
  **different, less legible world**. It is the closest commercial analogue to C6's
  "legibility, not power".
- **Here:** how the intermediate nodes went changes how *readable* the boss node is.
- **What kills it:** the accumulator. Dishonored counts bodies — an unambiguous, in-fiction
  fact. Our equivalent would have to accumulate something about the learner's play, and the
  only mechanical accumulators available are censuses, which R3 measured at an **89.0%
  false-positive rate at the observation level** and **1.01× lift** on the compare strip.
  A drift keyed to a census drifts on noise. **Dies to C3 via R3** — not because the idea
  is unsound but because the meter does not exist.

### M7 · The opponent remembers — the Nemesis system

- **There.** Orcs *"will remember the last time you fought or the last time they killed
  you"*; an orc that lands the killing blow *"gets promoted up a tier"* and one that
  survives fire *"comes back later with a fear of fire"*
  ([GamesRadar — how the Nemesis system works](https://www.gamesradar.com/shadow-mordor-nemesis-system-amazing-how-works/),
  [TheGamer — Nemesis guide](https://www.thegamer.com/middle-earth-shadow-of-war-orc-nemesis-system-complete-guide/))
  `[P]`.
- **Prices there:** nothing. It is pure **selection and framing** — the game picks which
  enemy to put in front of you and narrates why. No stat is manufactured.
- **Here, and only in this narrow form:** the boss node is **selected** from its candidate
  pool by a census of the structures the intermediate nodes actually produced —
  *"you steered into a closed centre twice; the boss is the closed-centre pack"*.
  Selection is not grading, so C3 holds. **Residue class (i)/(ii) jointly.**
  The detector for exactly this already exists and gates nothing: `shapeRecommendations`
  (`apps/server/src/service.ts:758-777`) computes shapes met but never drilled, over the
  learner's last 50 runs, sorted by `runCount` and `.slice(0, 10)` — an unlock condition
  whose only consequence today is a sentence and a button that navigates to `/play`
  (`apps/web/src/App.svelte:654-656`).
- **What kills it:** content, at the rank-4 rate. Two candidates per node needs 2 packs per
  slot, and the middlegame is 1 pack (`roguelike-run-design.md` §5a). It also risks
  self-confirming curation — always facing the structure you already produce is the opposite
  of what a drill should do — and there is no measurement saying which direction is better.

### M8 · A bounded reconfiguration window — the rally service park

- **There.** In DiRT Rally *"damage carries over between stages, repairs happen every two
  stages with limited time"*, with **10–45 minutes** of allocated mechanic time depending on
  the staging, mirroring real WRC service windows
  ([Team VVV](https://www.teamvvv.com/news/in-dirt-rally-2-0-youll-need-to-manage-your-damage-between-events/),
  [Škoda Motorsport — What Happens at Service Park](https://www.skoda-motorsport.com/en/what-happens-at-service-park-beginners-guide-to-rally/))
  `[P]`.
- **Prices there:** triage between stages. You cannot fix everything, so you choose what to
  arrive at the next stage with.
- **Here:** loadout changes are permitted only between nodes and only **N times per run**,
  so a node that forced you to re-slot costs you a swap you cannot make before the boss.
  **Residue class (iii)**, and it prices neither retrying nor looking.
- **What kills it:** the budget is invented — C9 licenses the *size* of a loadout, not the
  *number of times* it may change. And if the window is denominated in time rather than
  count it becomes a pursuit clock, C4. Survives, weakly, only in the counted form, and
  only as a modifier on top of something else.

### M9 · The skip is the consequence — Balatro's Tag

- **There.** *"Small and Big Blinds… can be skipped to receive a Tag"*, and *"Boss Blinds
  cannot be skipped"* ([Blinds and Antes](https://balatrowiki.org/w/Blinds_and_Antes)) `[P]`.
- **Prices there:** the money and the cards you would have won. Declining is a move, and
  the boss is the one thing you cannot decline.
- **Here:** the intermediate node's consequence can be **what you forwent by skipping it**
  — and `06` §5's structure already has the boss as unskippable. This is the cheapest
  mechanism in the dossier and it is already half-designed as rank 1's "real skip"; what is
  new is reading it as an *intermediate consequence* rather than a draft mechanic.
  **Residue class (iii).**
- **What kills it:** it makes intermediate nodes consequential only for players who skip
  them. The owner's complaint is about nodes that are *played* and change nothing, and M9
  does not touch those.

### M10 · Recoverable loss — Invisible Inc's captured agent

- **There.** A captured agent *"is guaranteed to appear in the next detention center that is
  visited"*, and when rescued keeps augments but not items
  ([Invisible Inc Wiki — Missions](https://invisibleinc.fandom.com/wiki/Missions)) `[P]`.
- **Prices there:** nothing permanently — the loss is a **detour**, which is a much softer
  consequence than a death and still shapes the run.
- **Here:** a lens suppressed at one node is recoverable at a later one. This is the right
  *softening* for M5 and dies with it — the trigger is still a frequency, still C7.

### 3a. The scoreboard

| # | Mechanism | Prices | Residue | Verdict |
|---|---|---|---|---|
| M1 | Carried board state (ITB grid / trajectory legs) | nothing — the board is self-evident | (ii) | **Survives.** Costs content and collapses the map |
| M2 | Sealed segment verdict carried to the boss | nothing — it records | (i) | **Survives, and is shipped but for one scope** |
| M3 | Unspent reveals convert forward (Balatro cash-out) | looking, electively | (iii) | **Survives conditionally** — cost function is invented; R6/R7 |
| M4 | Clue-token information economy (Hanabi) | asking, refilled by risk | (iii) | **Dies** — refill needs a chess judgement (C3) |
| M5 | Lens fatigue (XCOM / Darkest Dungeon / Balatro's Ox) | using your best lens | (i) | **Dies** — targets frequency, ρ = −0.143 (C7); and a hint tax (C1) |
| M6 | World-state drift (Dishonored chaos) | style, cumulatively | (i) | **Dies** — needs an accumulator; the census is 89% FP (C3 via R3) |
| M7 | Boss selected by census (Nemesis) | nothing — selection | (i)+(ii) | **Survives narrowly.** Content cost; curation risk |
| M8 | Bounded reconfiguration window (service park) | adaptation, counted | (iii) | **Weak survivor.** Invented budget; becomes C4 if timed |
| M9 | The skip is the consequence (Balatro Tag) | the encounter declined | (iii) | **Survives, free** — but does not touch nodes that *are* played |
| — | Escalating requirement (Balatro antes), pursuit clock (FTL) | — | — | Already refused, `06` §5 / `roguelike-run-design.md` §2b |

---

## 4. The proposal that survives contact with the runtime

**M2, with M9 attached and M7 as the act-boundary variant.** Stated as one mechanism:

> An intermediate node **seals** a verdict — `preserved` or `degraded`, both non-fatal,
> both one-way — and the act boss **reads the seal**. The boss decides the run; the
> intermediate node decides **the terms on which you meet the boss**.

What the seal buys is deliberately *legibility*, per C6, and the natural payload is the
mechanism `06` §5 already accepted: **who chooses the boss's capability suppression.** A
`preserved` act lets the learner pick which suppression the boss applies, or remove one; a
`degraded` act lets the boss pick. Nothing is taken away at the intermediate node itself,
nothing numeric escalates, no lens is lost for having been used, and rewind and fork inside
a node stay exactly as free as the thesis promises.

**Why this and not M1.** M1 is the stronger idea and the more chess-native one — the board
is the only consequence that needs no vocabulary at all. It costs a linear, authored,
positionally-continuous run: 3 shipped trajectory packs, a 1-pack middlegame catalogue, and
65.0 authoring minutes per middlegame pack. M2 gets the same *shape* (a node's outcome
travels forward and shapes the next) at the cost of a ruling instead of a fortnight, and
**M1 remains reachable later** because a trajectory pack already is an act. The honest
recommendation is M2 for v1 and M1 as the thing the design grows into, not M2 instead of M1.

### 4a. Assembly versus new code

Following `06` §1's accounting, which found three of six parts already half-shipped.

**Already shipped and load-bearing — this is assembly** `[V]`:

| Part | Where |
|---|---|
| A non-fatal, one-way, forward-carried verdict | `ObjectiveState` 6 values; `ABSORBING` at `trajectory.ts:6`; `OBJECTIVE_DEGRADED_IS_ONE_WAY` at `pack-validation.ts:469` |
| Sealing that verdict at a node boundary | `pack-orchestrator.ts:556-575`; `sealedState` at `trajectory.ts:15`, `:83-92` |
| Per-node entry gate and per-node objective | `TrajectoryLeg` at `packages/schema/src/drill-pack/types.ts:234-239`; validation `pack-validation.ts:890-923` |
| Node-skip accounting | `skippedLegIds`, `trajectory.ts:27`, `:130` |
| Intermediate-vs-boss partition, enforced | `THEORY_ABSORBING_UNSUPPORTED` `pack-validation.ts:457`; `OBJECTIVE_ABSORBING_WITHOUT_OUTCOME` `:463` |
| The trigger, authored not graded | 76 `offObjective` deviations compiled at `pack-orchestrator.ts:367-385` |
| Two-gate architecture the suppressor needs | `permittedAssistance` `assistance.ts:27-30`; `06` §3 law 1 |
| Server-held per-branch outcome record | `attempts`, `storage.ts:2490-2518` |
| The one shipped run→run edge to imitate | `schedules`, `storage.ts:2532-2548`, minted `service.ts:430-439` |
| A candidate-selection detector for M7 | `shapeRecommendations`, `service.ts:758-777` |

**New code, smallest first:**

1. **A run-level roll-up.** `attempts` is per-branch and nothing computes "did this run
   succeed" (`progress.ts:91`, `:127`). One derived verdict per run, from the sealed
   states. *Small, and it is the precondition for everything else.*
2. **The commitment point** — §6's question. If the answer is "the path you submit", the
   cheapest form extends `reveal` (`runtime.ts:240-259`) rather than adding a verb, since
   `reveal` is already learner-initiated, idempotent and lease-gated. *Small in code,
   large in design.*
3. **A container above the run.** `campaign`/`run_set`/`curriculum`/`playlist` are 0 hits;
   there is no table, key, event or route at that scope. The schedule row is the shape to
   copy. *Medium — and note `drill_runs.snapshot_json` is one opaque blob, so nothing is
   queryable across runs at event level.*
4. **Server-held loadout** (§2a) — unchanged from `06` §1's list, and required by ADR-0007
   before anything can be *earned*.
5. **Per-lens grain** — unchanged from `06` §1's list. Highest-leverage insertion point
   found this pass: `canonicalObservations` at `packages/runtime/src/structure.ts:448-450`,
   which every consumer funnels through (`DrillScreen.svelte:284`, `compare-strips.ts:29`).

**Not required by this proposal:** any budget, counter, currency, refusal class, clock or
new economy of any kind. That is the point of it.

### 4b. A defect found while measuring, escalated not buried

**The compare surface bypasses the honesty gate.** `comparisonStrips` calls `pivotalMarkers`
directly (`packages/runtime/src/compare-strips.ts:38`), **not** `liveMarkers`, so the
permission filter at `pivotal.ts:96` never runs; `CompareView.svelte` imports no assistance
symbol, and `CompareView.svelte:119-121` renders the entire unfiltered `structuralReading`
of the leaf node. `06` §3 law 1 says the honesty gate is the *outer* gate — on the surface
with the most disclosure, it is currently not a gate at all. Any campaign layer that adds an
inner gate on top of this inherits the hole. `[V]`

---

## 5. What would kill each survivor

Stated as the falsifier, per the rule that a mechanism whose failure mode cannot be named
has not been analysed.

- **M2 (sealed verdict).** *Killed if the owner rules that no path is privileged* — then
  the seal is always escapable by rewinding to a clean line, and the consequence reduces to
  "did you bother to fix it". Also killed by R7 if reaching a boss under an unliftable seal
  reads as punishment rather than as stakes; that is unmeasured `[M]`. Third and cheapest
  falsifier: if the boss suppression turns out to be legible only to players who already
  understand the lens vocabulary, the seal buys nothing a beginner can perceive.
- **M1 (carried board).** *Killed by the map.* If route choice or draft variety is
  load-bearing for replay — and `campaign-effect-vocabulary.md` §5d argues the loadout must
  carry the variance burden because the catalogue cannot — then a linear authored chain is
  the wrong trade. Also killed by cost: 2 middlegame packs is 2.2 agent-hours for one act;
  three chained acts is a different number.
- **M3 (converting reveals).** *Killed by R6.* If a learner who spends reveals early
  reports the boss as unfair rather than as earned, the cost function was invented and C1
  was violated after all. Cheapest pre-test: the number of reveals a single owner run
  actually consumes — currently unknown, since no per-attempt telemetry exists at all
  (`roguelike-run-design.md` §Method).
- **M7 (boss by census).** *Killed by the middlegame catalogue.* With one middlegame pack
  the "selection" selects nothing. Also killed if self-confirming curation is the wrong
  direction pedagogically, which no measurement in this repo addresses.
- **M9 (skip).** *Killed by scope* — it never touches a node that was played, which is the
  owner's actual complaint.

---

## 6. The owner question

**The reasoning first.**

The consequence you are asking for is not missing. It ships. `ObjectiveState` has six
values and only three of them stop anything; `degraded` is non-fatal, one-way by validator
rule, produced by 76 authored deviations rather than by any grader, and sealed forward
across node boundaries by machinery three authors have already used. The pack format even
enforces the split you want: `follow_theory` **cannot** end a run — 17 of 37 packs — while
`win`/`hold` can. "Two consequential encounters, then a decisive boss" is not a structure to
design; it is the shape of all three trajectory packs and it is a lint rule.

What is missing is one thing, and it is not a mechanism. Every seal is **path-scoped**. A
rewind produces a clean path and the seal evaporates — which is exactly right, because that
is the thesis working as designed. So the question is not *what can the consequence be*. It
is: **which path does a node remember?**

**The question.** When the map advances past an intermediate node, which of the learner's
branches is the one that seals?

- **(a) Whichever branch you are standing on when you leave.** No new verb, no ruling
  beyond this one, and it is honest — the state you leave is the state you carry.
  *Consequence:* rewinding to a clean line before leaving is always correct, so what the
  node actually prices is **whether you bothered to go back and fix it**. That is a real
  stake and a thin one, and it makes the intermediate node a diligence check rather than a
  decision. It costs nothing and it can ship first.
- **(b) The branch you submit.** The same verb `06` §5 already needs for the boss, applied
  one tier down — **one ruling buys both holes**: at a boss the submitted attempt decides
  the run, at an intermediate node it decides what the boss is told. *Consequence:* the
  product gains a verb it does not have (`submit`), though `reveal` is close enough to
  extend rather than invent. Rewind and fork stay free everywhere, so C1 is untouched. The
  price is that R6 and R7 are unanswered and this is the mechanism they gate — and that
  saying "this is my answer" is a genuinely new thing to ask a learner to do.
- **(c) All of them — the node seals the worst branch you produced.** *Consequence:*
  **this prices retrying directly** and contradicts `00-thesis.md:76-79`. It is listed only
  so it can be refused explicitly rather than arrived at by accident, because it is the
  option every scarcity proposal so far has drifted toward.

**A note on what follows from the answer, so the ruling is made with its consequences
visible:** if (a), the campaign needs a run-level roll-up and nothing else, and it can be
built before any of R6/R7/R8 report. If (b), the campaign needs the same roll-up plus a
commitment point, and the `06` §5 boss ruling and this one become **the same ruling** rather
than two. If (c), the thesis's first selling point is amended, which `05` §1 provides a
venue for but which nobody has proposed doing on purpose.

---

## 7. What this dossier does not establish

- **No hands-on with any comparison game**, and two of the six external sources (ITB,
  Dishonored) were read through a search index rather than fetched, because the host refused.
- **Nothing about how any of this feels.** R6, R7 and R8 stand exactly where
  `06` §4 left them, and M2's falsifier is R7 verbatim.
- **The residue argument (§1a) is analysis, not measurement** `[M]`. It follows from the
  ten constraints but the claim that *only* three kinds survive is an argument someone could
  break by finding a fourth.
- **No claim that M2 is better than M1 on the merits** — only that it is reachable now and
  M1 is not, and that M1 stays reachable.
- **The `DESIGN-GAP:` in §2c is escalated here and owed to `planning/exploration/log.md`.**

---

## Sources

**External, all `[P]`:**
[Balatro — Blinds and Antes](https://balatrowiki.org/w/Blinds_and_Antes) ·
[Balatro — Discards](https://balatrowiki.org/w/Discards) ·
[Balatro — Hands](https://balatrowiki.org/w/Hands) ·
[Into the Breach — Grid Power](https://intothebreach.fandom.com/wiki/Grid_Power) *(402 to direct fetch; via search index)* ·
[Into the Breach — Civilian Building](https://intothebreach.fandom.com/wiki/Civilian_Building) *(same)* ·
[Dishonored — Chaos](https://dishonored.fandom.com/wiki/Chaos) *(same)* ·
[XCOM 2 — Hit Points](https://xcom.fandom.com/wiki/Hit_Points_(XCOM_2)) ·
[Darkest Dungeon — Stress](https://darkestdungeon.wiki.gg/wiki/Stress_(Darkest_Dungeon)) ·
[Hanabi Live — rules](https://github.com/Hanabi-Live/hanabi-live/blob/main/docs/rules.md) ·
[GamesRadar — Nemesis system](https://www.gamesradar.com/shadow-mordor-nemesis-system-amazing-how-works/) ·
[TheGamer — Nemesis system guide](https://www.thegamer.com/middle-earth-shadow-of-war-orc-nemesis-system-complete-guide/) ·
[Team VVV — DiRT Rally 2.0 damage between events](https://www.teamvvv.com/news/in-dirt-rally-2-0-youll-need-to-manage-your-damage-between-events/) ·
[Škoda Motorsport — What happens at Service Park](https://www.skoda-motorsport.com/en/what-happens-at-service-park-beginners-guide-to-rally/) ·
[Invisible Inc — Missions](https://invisibleinc.fandom.com/wiki/Missions)

**Repo, at `0fbf0ef`, `[V]`:**
`packages/runtime/src/types.ts:4-10,36,102,275-291` ·
`packages/runtime/src/trajectory.ts:6,15,27,39-44,61-102,83-92,108-150` ·
`packages/runtime/src/objective-state.ts:3-10` ·
`packages/runtime/src/assistance.ts:3-14,27-30` ·
`packages/runtime/src/feedback.ts:22-30` ·
`packages/runtime/src/runtime.ts:240-259,402-412` ·
`packages/runtime/src/events.ts:377-385` ·
`packages/runtime/src/structure.ts:448-450,452-500` ·
`packages/runtime/src/transition.ts:348` ·
`packages/runtime/src/compare-strips.ts:29,38` ·
`packages/runtime/src/pivotal.ts:96` ·
`packages/schema/src/drill-pack/types.ts:218,234-239,325-330,381-388` ·
`apps/server/src/pack-orchestrator.ts:367-385,556-575` ·
`apps/server/src/pack-validation.ts:457,463,469,890-923` ·
`apps/server/src/progress.ts:62-65,90,91,127` ·
`apps/server/src/storage.ts:553-558,2235-2242,2446-2456,2490-2518,2532-2548,2552-2557` ·
`apps/server/src/service.ts:430-439,592-596,758-777,1255,1320,1652,1663` ·
`apps/server/src/errors.ts:42` · `apps/server/src/rest.ts:93,532,995-1424,1048,1065,1171-1179` ·
`apps/server/src/live-session.ts:232` ·
`apps/web/src/lib/assistance-preference.ts:4,19-23` ·
`apps/web/src/lib/CompareView.svelte:119-121` · `apps/web/src/App.svelte:654-656` ·
`content/drafts/*.json` (37 canonical packs: 275 deviations / 76 `offObjective`; objective
types; 3 trajectory packs × 3 legs) · greps for
`campaign|run_set|curriculum|playlist`, `lens|loadout`, `SIMULATE_BUDGET_EXCEEDED`.

**Dossiers:** `roguelike-run-design.md` (the shape this one attaches consequences to),
`campaign-effect-vocabulary.md`, `census-hint-false-positives.md` (ρ = −0.143, the 89.0% FP
rate), `feedback-versus-the-dashboard.md` (D78), `pack-authoring-cost.md`,
`practical-difficulty-outside-tablebase.md`, `human-outcome-coverage-depth.md`.

**Design:** `00-thesis.md` §Why anyone would use it, `05-in-run-experience.md` §1/§3,
`06-campaign.md` §1/§2c/§3/§5, `AGENTS.md` (law 8, §Rejected).
