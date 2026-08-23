# Training methods → drill-pack features — HEAD derivation

- **Date:** 2026-08-23, claude. All repo claims re-verified at HEAD this pass; where a
  living row's number was wrong, the correction is stated in place rather than inherited.
- **Lane:** the two dossiers `design/research/chessable-movetrainer.md` and
  `design/research/titled-player-training.md`, plus the standing teardown
  `design/research/teardown-chessable-desk.md`, and the ledger rows they produced —
  [[D860]]–[[D868]] (`design/BACKLOG.md:553-561`).
- **Why this document exists:** `planning/platform-alignment/research-to-execution.md:95`
  classifies `chessable-movetrainer.md` as **LEDGER ROW ONLY** (*"no — one BACKLOG
  mention, no lane"*), `:183` classifies `titled-player-training.md` the same way, and
  `:167` classifies `teardown-chessable-desk.md` as **NOTHING** — *"nothing anywhere points
  at the file"*. Three dossiers answering owner questions directly, and no lane.

---

## 0. Licensing status for drafting — stated first, per the [[D951]] remedy

[[D951]] (`design/BACKLOG.md:333`) closed on a derivation whose gate lived in its body and
was dropped from its summary; a drafting fork was then commissioned from the summary. The
remedy is that a derivation states its licence at the top **and** in its summary. Checked,
not assumed:

| # | Check | Evidence | Result |
|---|---|---|---|
| 1 | Does a **standing lane gate** forbid an RFC here? | The only lane-specific standing gate in `planning/` is `planning/campaign-research-queue.md:4-5`, which names the **campaign** RFC. A grep across `planning/` for a training-methods, scheduling, or return-loop gate finds none | **NO GATE** |
| 2 | Does [[D1093]]'s drafting mandate reach this lane? | `design/BACKLOG.md:493` — the mandate enumerates **exactly three** ruled lanes: [[D1031]] variants, [[D1041]] time controls, [[D1060]] famous games. *"Product-surface RFCs **in these ruled lanes** may be drafted."* This is **not one of them** | **NOT LICENSED BY D1093** |
| 3 | Is there a **routed destination** for this work? | `planning/routing-queue.md:67` — *"D862, D864, D866, D867 \| return-and-progression RFC lane \| **Research and specify** tempo cycles, lapse-aware root scheduling, explorer-frequency ordering, and the read→play→quiz ramp **before implementation**."* | **YES — and it names research-and-specify as the next lawful action** |
| 4 | Does the **content** half need a licence? | [[D863]] is routed to a **content wave**, not an RFC: `planning/content-wave-work-order.md:694-696`. A content wave rides the closeout protocol in `CLAUDE.md`, not law 1 | **NO LICENCE NEEDED** |
| 5 | Is the owner's ask on record verbatim? | Yes — `titled-player-training.md:3-4` and `chessable-movetrainer.md:6-7` (§1). But **neither ask has its own `design/BACKLOG.md` row**; only the rows the dossiers *produced* exist | **law-4 gap, recorded in §8** |

**Verdict, in three parts, because they differ:**

1. **This derivation is licensed outright** — `routing-queue.md:67` asks for exactly it.
2. **The [[D863]] content wave is licensed outright** — it is authoring, not code, and its
   destination document already carries the work order.
3. **An RFC in this lane is NOT yet licensed.** [[D1093]] does not reach it and no owner
   ruling opens it. The nearest precedent is `rfc/player-style.md:3`, which drafted on
   [[D1232]]/[[D1230]] (the owner's *rejection of a scope cut* in that lane) — **this lane
   has no such sentence**. A drafting fork must stop here and take §9's fork to the owner.

---

## 1. The owner's asks, quoted in full

**Ask A — traditional programs / titled players** (`design/research/titled-player-training.md:3-4`,
owner 2026-08-20 via task commission):

> *"How about 'traditional programs'? How do IMs/GMs train/prepare? Some of that might
> enhance our drill pack features."*

**Ask B — Chessable MoveTrainer** (`design/research/chessable-movetrainer.md:6-7`):

> *"what else makes Chessable so appealing? Some of that might enhance our drill pack
> features."*

Both asks end in the same clause — **"might enhance our drill pack features"** — which is
why this derivation's output is a list of pack-format and runtime capabilities, each traced
to a measured finding, and not a competitor admiration table.

**The adjacent ledgered asks**, which this lane must not swallow: [[D549]] skills taxonomy
(`design/BACKLOG.md:145`), [[D552]] longitudinal feedback (`:148`), [[D554]] the stale
competitor matrix (`:150`). All three now have their own drafted RFCs or lanes; this lane
is the **fourth**, and its rows ([[D860]]–[[D868]]) are the residue nobody claimed.

---

## 2. What each dossier concluded — and what it says our packs are missing

### 2.1 `titled-player-training.md` (485 lines, `[P]` tradition + `[V]` code census)

Its headline is not a feature list. It is `:11-19`:

> *"three of the most famous training methods in chess history are **already shipped in
> this product as end-to-end mechanisms with zero consumers** … The tradition does not ask
> this product for new machinery; it asks for wiring and authored content."*

| Conclusion | Where | What it says packs are missing |
|---|---|---|
| Theme-position sparring **is** the thesis | `:274` | nothing — *"WIRED — this is the thesis"* |
| Guess-the-move **is** `prediction`, quadruply dead | `:296-322` | a **consumer** for `prediction.recorded`, and lifting the pack gate so imported games can reach it |
| Write-before-checking **is** `stated_reasoning` | `:324-335` | **authored key points** — 1 browser fixture, 0 real packs |
| Endgame blitz / Woodpecker **is** `TempoVerdict` | `:337-347` | authored tempo budgets, **and a scheduler that can shrink** |
| Yusupov pass-marks **are** `attempt_concepts` + verdicts | `:349-359` | a **pack-level authored threshold with redo-on-fail** — the one genuinely new field |
| Aagaard candidates/comparison **is** `intent_capture` | `:280` | nothing — 49 content files (re-measured: **51 checkpoints across 92 packs**, §5.4) |
| Blocked "one concept, many positions" | `:281` | nothing but authoring |
| Expanding-interval return | `:282` | *"**cannot express the Woodpecker (shrinking) direction**"* |
| Peer critique of published analysis | `:284` | **NOT BUILT** and refused — law 8 (§6) |
| Novelty hunting / seconds / cloud prep | `:286` | **DOES NOT TRANSFER** |
| de la Maza's Seven Circles | `:287` | **DO NOT BUILD** — trainer consensus against (`:178-191`) |
| Blindfold / stepping-stones | `:288` | **OWN QUESTION** — collides with [[D717]] board protection |

Its three highest-value pack enhancements (`:387-412`): guess-the-move on imported games,
**pass-mark packs**, tempo cycles. Runner-up deliberately excluded: authored
`stated_reasoning` content, *"an authoring wave, not a pack-format feature"* (`:414-417`).

### 2.2 `chessable-movetrainer.md` (345 lines, `[V]` primary docs, product NOT run)

| Conclusion | Where |
|---|---|
| The SRS unit is the **move**, not the position — 8 fixed levels 4 h → 6 mo, XP bound to level | `:20-32` |
| **Lapse = full reset to level 1**, no ease factor, no per-item difficulty — a Leitner ladder, *"far simpler than SM-2/FSRS"* | `:34-38` |
| The learn→quiz→review ramp interleaves authored prose with playing the taught move | `:40-50` |
| Whole-variation review (default since 2018); the non-due prefix is **Overstudy**, earns no XP | `:52-59` |
| Overstudy grading is **asymmetric**: wrong resets the timer, right changes nothing | `:61-64` |
| **Difficult Moves** is defined by counted events — *"3 or more mistakes and a review score below level 4"* — with a graduation rule | `:66-72` |
| Learning status is categorical: Not learned / Paused / Learning / **Mature** / Difficult | `:74-79` |
| Three scheduling modes: default, **custom**, **cyclical** (built for the Woodpecker) | `:81-84` |
| **Key moves** (a study window) and **Priority Lines** (author- or **corpus-selected at a rating band**) | `:86-95` |
| Soft fail is engine-vetted (0.3 cp openings / mate-preserving or 1.0 tactics / tablebase-equivalent endgames) and still converges on the one text move | `:97-102`, `teardown-chessable-desk.md:27-30` |
| **The moat is not the SRS.** It is the revenue-share author marketplace + the Short-&-Sweet funnel; *"the SRS alone would not have won"* | `:121-186` |
| The memorization critique is Chessable's own authors', verbatim | `:188-197` |
| Review debt, equal weighting of rare lines, lapse harshness — all real and acknowledged | `:198-214` |

**What it says our packs are missing** (`:232-302`, ranked value-to-effort): lapse-driven
rescheduling + maturity states over roots; a difficult-roots surface; corpus-frequency
ordering at band; the guided first-pass ramp (a **design prompt**, not a free adoption —
collides with ADR-0006); overstudy accounting; vacation-safe scheduling; key-move-style
study windows (*"largely already ours"*); streaks/XP **ranked last deliberately**.

### 2.3 `teardown-chessable-desk.md` (49 lines) — the one nothing points at

Its contribution is the **negative** result the other two rest on (`:49`):

> *"Chessable now owns the 'play it out' step (June 2026 bot launch) but the bridge is a
> one-way link to a generic Chess.com engine-bot with **no course-aware feedback before,
> during, or after the game**, and MoveTrainer still converges every deviation back onto
> one memorized text move — the recall → understanding gap claim survives, narrowed but
> intact."*

It also supplies the soft-fail margins (`:27`) and the finding that author "alternative
lines" are **parallel flashcards** Chessable itself warns cause recall interference
(`:32`). That last is the direct argument for our `deviations` array over their model:
a deviation is a *graded edge on the same tree*, not a competing card.

---

## 3. MoveTrainer, mechanically — and what our format can express **today**

The task asked whether we already have more of this than anyone realised. **We have the
tables and the ladder; we do not have the arithmetic the accepted RFC specified.** Both
halves are measured below.

### 3.1 The shipped scheduler, at the symbol

| Object | Site | What it is |
|---|---|---|
| `schedules` table | `apps/server/src/storage.ts:4145-4164` | `root_key`, `session_kind`, `pack_id`, `root_transpose_key`, `kind`, `variant`, `origin`, `state`, `due_at`, `created_at`, provenance run/node ids |
| `kind` | `:4152` | `CHECK (kind IN ('blocked','varied'))` — **this is the spaced-repetition state** |
| `variant` | `:4153` | `TEXT` nullable — **not** the blocked/varied state; §3.3 corrects [[D1035]] here |
| one-pending-per-root | `:4162-4163` | `UNIQUE … WHERE state='pending' AND origin='auto'` |
| due index | `:4164` | `(learner_id, state, due_at)` |
| the auto scheduler | `:2904-2931` (`#refreshAutoSchedule`) | recomputes one schedule per root after every projection |
| the ladder | `:2916` | `const ladder = [1, 3, 7, 16, 35];` |
| the index | `:2917` | `ladder[Math.min(Math.max(trailingStable - 1, history.length - 1, 0), 4)]` |
| explicit schedules | `:2656-2666`, `rest.ts:1526-1533`, `service.ts:1944-1997` | learner-created, `origin: 'learner'`, emits `transfer.scheduled` |
| the due queue | `:2640-2647` | `ORDER BY CASE kind WHEN 'blocked' THEN 0 ELSE 1 END, due_at, id` |
| attempt history | `:4102-4131` | `verdict CHECK IN ('stable','unstable','open')`, `graded`, `countable`, `attempt_no`, `origin`, `schedule_id`, `root_due_at_start` |
| seen counts | `:4165-4170` | `learner_position_stats(learner_id, transpose_key, seen_count)` — **`seen_count` only** |

### 3.2 The measured defect: the ladder is keyed to attempt COUNT, not to success

`rfc/archive/return-and-progression.md:631-640` specifies the trigger:

```
if the latest attempt is ungraded   -> varied, k = |H| - 1
else if the last two verdicts are both `stable`
                                    -> varied, k = (trailing stable count) - 2
else                                -> blocked
varied:  due_at = ended_at + VARIED_LADDER_DAYS[min(k, 4)] days
```

`storage.ts:2917` computes `k = max(trailingStable - 1, |H| - 1, 0)`. Because `|H| - 1`
grows with **every countable attempt regardless of verdict**, it dominates the streak term
on every realistic history.

**Procedure to reproduce (hand it to the RFC author; do not hand over the table):**
transcribe `storage.ts:2910-2918` and `rfc/archive/return-and-progression.md:631-640` into
two pure functions and evaluate both over synthetic verdict histories. Executed
2026-08-23:

| History (oldest → newest) | shipped | accepted RFC | |
|---|---|---|---|
| stable, stable | varied **3 d** | varied 1 d | diverges |
| stable ×3 | varied **7 d** | varied 3 d | diverges |
| stable ×6 | varied 35 d | varied 35 d | agrees |
| unstable ×4, stable, stable | varied **35 d** | varied **1 d** | **diverges by the whole ladder** |
| unstable, stable, stable | varied **7 d** | varied 1 d | diverges |
| stable ×5, unstable | blocked 0 d | blocked 0 d | agrees |
| ungraded ×3 | varied 7 d | varied 7 d | agrees |
| ungraded ×8 | varied 35 d | varied 35 d | agrees |

**Read the fourth row.** A root the learner failed four times and then passed twice is
scheduled **35 days out**. The accepted RFC says **one day**. The `else if` arm's own
rationale (`:645-647`, *"One success is not stabilization"*) is defeated by the `max`.

**Why it survived:** `apps/server/src/progress.test.ts` contains **two** `dueAt`-adjacent
lines (`:46`, `:87`) and **no assertion on the interval at all**. The ladder is untested.

**Consequence for this lane, and it is the lane's central finding:** [[D864]] asks for
lapse-awareness on top of a working maturity ladder. There is no working maturity ladder —
the interval is a function of *how many times you have visited a root*, which is the one
input that carries no information about whether you have learned it. **[[D864]] is
therefore a defect repair before it is a feature.**

### 3.3 The `variant` column — [[D1035]] narrowed, and a second dead mechanism found

[[D1035]] (`design/BACKLOG.md:512`) refuted [[D327]]'s reading of `storage.ts:4153` and
called it *"the spaced-repetition blocked/varied column"*. Narrow that: **`kind` is the
blocked/varied column** (`:4152`); `variant` is the *name of the variation to try*, and it
is dead three ways.

| Fact | Site |
|---|---|
| The auto scheduler writes `variant` as a **literal NULL** | `storage.ts:2923` (`VALUES (?, …, ?, NULL, 'auto', …)`) |
| Only the **learner-supplied** explicit-schedule path can set it, as free text | `rest.ts:1528-1535`, `service.ts:1951`, `:1974` |
| Nothing **reads** it for any decision — it is echoed through `#scheduleRow` (`:2896`) and into the client type (`apps/web/src/lib/api.ts:597`) and nothing else | grep over `apps`/`packages` |
| The accepted RFC specified it as *"drawn from the pack's `retryVariants` … rotating by `k`"* | `rfc/archive/return-and-progression.md:658-666` |
| `retryVariants` is disposed **`refused`** — *"a catalogue relation, not a run modifier; it names no executable referent"* | `packages/schema/src/drill-pack/dispositions.ts:77-82` |
| Its lint is **warning severity**, so packs carrying it still validate | `apps/server/src/pack-validation.ts:1120-1126` (`RETRY_VARIANTS_NOT_EXECUTABLE`) |
| The census records **zero consumers, one refusal site** | `apps/server/src/expression-census.test.ts:217-221` |
| **7 packs author it anyway** (§5.4) | measured over `content/**/*.json` |
| The vocabulary is `design/01`'s, verbatim: *"same position, new defense · related position, same idea · same structure, opposite side · same outcome, different material details"* | `design/01-training-model.md:72-79`; `packages/schema/src/drill-pack/types.ts:26-33` |

**So varied repetition names a variation the learner is never shown, drawn from a field
seven authors filled in and the runtime refuses to read.** That is the cheapest genuinely
*new* capability in the lane, and it is mostly deletion of a refusal.

### 3.4 MoveTrainer part by part — expressible today, or a new field

| MoveTrainer mechanic | Our nearest object | Expressible today? |
|---|---|---|
| SRS unit = **the move** | our unit is the **attempt at a root** (`design/01-training-model.md:55-58`) | **Deliberately not, and must stay not.** [[D864]] already states the transformation: *"the unit stays the position-with-consequences, never the card"* |
| 8-level fixed ladder | 5-rung ladder `[1,3,7,16,35]` (`storage.ts:2916`) | **yes** — same shape, different constants |
| Lapse → **full reset to level 1** | lapse → `blocked`, `due_at = now` (`:2917`, days = 0) | **yes, and ours is already better than the copy target** — blocked-now is a re-drill, not a 4-hour timer, and §3.2's defect is the reason it does not currently compose |
| **Step-down** rather than reset ([[D864]]'s named improvement) | none — the index has no decrement path | **NEW ARITHMETIC**, no new field: change `:2917` |
| Categorical maturity (Learning / **Mature** / Difficult) | none rendered; `/learn` refuses mastery percentages (`docs/return-and-progression.md:47-50`) | **derivable read-time**, no storage — but it is a **claim about the learner** and needs §6's ruling |
| **Difficult Moves** (≥3 mistakes + level < 4) | `attempts.verdict` counts per `root_key`, indexed at `storage.ts:4131` | **yes, read-time SQL.** **Correction to [[D865]]:** it names `learner_position_stats` as the source; that table holds `seen_count` **only** (`:4165-4170`) and cannot count mistakes. The source is `attempts` |
| Difficult-move drill-down showing the actual wrong/right moves | our preserved **runs and branches** — strictly more than a flashcard stat | **yes, and this is the differentiator the dossier names** (`chessable-movetrainer.md:247-256`) |
| **Priority Lines** — corpus-selected at a rating band | `corpusPopulation(targetElo)` maps an Elo to a Lichess rating band (`apps/server/src/corpus.ts:139-145`); `LichessCorpusSource.stats` returns per-move played counts with a day-TTL cache (`:85-131`) | **yes — the data source ships.** What is missing is only the **ordering** of `/progress/due`, which today is `blocked first, then due_at, then id` (`storage.ts:2644`) |
| **Key moves** (a study window) | `authoredBoundary` (spine ids / `plyHorizon` / FEN predicates) + `atStart` anchors | **yes** (`docs/drill-pack-format.md:35-38`, `:137-138`) |
| Whole-variation review | an attempt **is** the whole line by construction | **yes, natively** |
| **Overstudy** — voluntary early review, asymmetric grading | explicit schedules exist (`POST /runs/:id/schedule`); `countable`/`graded` exist on `attempts` | **partially.** The *accounting* rule — an off-schedule retry may demote but may not advance — is **new logic**, no new field |
| **Cyclical** scheduling (the Woodpecker mode) | none — the ladder is expanding-only | **NEW.** [[D862]]/`titled-player-training.md:337-347`. Needs a *set-scoped, cycle-keyed* schedule, which the per-root `schedules` PK cannot express |
| Custom intervals / vacation | explicit-schedule endpoint exists | **yes for vacation**; custom intervals collide with the ladder's only randomised evidence (§9, `design/BACKLOG.md:1344`) |
| Engine-vetted **soft fail** | `deviations[]` with `classification`, `mistake ∈ {plan,timing,tactical}`, and machine-bound `cost` stamped by `verify-draft` (`docs/drill-pack-format.md:60-82`) | **yes, and ours is stronger** — theirs is a tolerance margin, ours is an authored, evidence-backed, learner-visible verdict |
| Learn → play-the-move → quiz ramp | **collides with ADR-0006** (commit before learning, `design/05` §1) | **the one real pack-format design question** — [[D867]]. Needs an authored *phase* on a pack: an ungraded guided pass whose plays write no countable attempt |
| XP / streaks / leaderboards | forbidden by the shipped milestones contract (`docs/return-and-progression.md:49-50`), ADR-0007, and `league-as-return-loop.md` | **refused**, and the dossier ranks it last itself (`chessable-movetrainer.md:294-302`) |
| The author marketplace | — | **not a feature**; routed to `design/04` as [[D868]] |

**Summary of §3:** of thirteen mechanical parts, **seven are expressible today with no new
field**, **three need arithmetic changes to shipped code**, **two need one new pack-format
field each** (the guided-pass phase; the pass-mark scorecard, §4), and **one needs a new
schedule grain** (cyclical/tempo sets). Nothing needs a new storage table.

---

## 4. Titled-player preparation — what transfers, and what we deliberately refuse

| Practice | What it needs | Our format |
|---|---|---|
| **Repertoire files** — a private annotated tree, engine lines plus humanly-unpleasant sidelines, transposition notes (`titled-player-training.md:242-253`) | a tree with authored annotation and deviation handling | **fully expressible.** `mode: "line"` + `objective.type: "follow_theory"` + `authoredBoundary` with a finite `plyHorizon` + exactly one boundary checkpoint (`docs/drill-pack-format.md:274-292`). **32 of 92 packs are `mode: line`** and 18 carry `follow_theory` (§5.4). Position-keyed spine resolution already permits **transposition re-entry** (`:284-286`) — the exact thing `teardown-chessbook-desk.md` says Chessable's line-keyed model cannot do |
| **Model games** — study a master game as a corpus | import + story routes ship (`rest.ts:659` lists `import`/`story`) | **expressible for reading; NOT for grading** — the prediction gate (§5.2) blocks the one interaction that makes a model game a drill |
| **Critical positions** — Müller's *"build a database of your own most important positions and go through it regularly"* (`:80-87`) | position-keyed roots + a personal return queue | **fully expressible today.** Repertoire-gap entries are already ordinary `position` runs sharing the position-root schedule (`docs/return-and-progression.md:76-78`) |
| **Marked basic course inside a reference** — Dvoretsky's two-tier structure (`:80-85`) | a subset flag + a pass gate | **half.** Pack `phase` and `difficulty.branchLengthTarget` exist; a *"know this cold"* tier is the pass-mark field (below) |
| **Playing out positions against real resistance** (`:88-93`) | from-position runs at a chosen opponent policy | **fully expressible — this is the thesis** (`:274`) |
| **Sparring at cohort-banded prescription** — ChessDojo's *"which positions at which rating, at which time control"* (`:222-236`) | band on the pack + a time control | **band yes** (`difficulty` rating bands, `docs/drill-pack-format.md:143-144`); **time control is `rfc/enforced-clocks.md`'s lane**, drafted 2026-08-23 — consume it, do not re-derive it |
| **Pass mark + redo** — Yusupov (`:103-124`, `:349-359`) | per-attempt points, an authored threshold, redo-on-fail | **NOT EXPRESSIBLE.** Objective verdicts ship per attempt; nothing aggregates them against a threshold. This is the lane's **one genuinely new pack field**, and it is `[needs authored content]` under law 8 — the point schedule is a coach's judgement |
| **Write before checking** — Botvinnik/Dvoretsky (`:44-56`, `:324-335`) | reasoning recorded before feedback | **fully shipped.** §5.1 |
| **Guess the move** — Purdy/Solitaire (`:206-219`, `:296-322`) | commit before reveal, scored | **machinery shipped, corpus locked out.** §5.2 |
| **Endgame blitz / shrinking clock** (`:88-93`, `:147-163`) | tempo budgets + a shrinking schedule | **half.** §5.3 |
| **Opponent prep** — a named opponent's repertoire | a per-pack declared opponent policy plus authored counter-theory | **expressible as a boss today** (`opponentPolicy` + theory spine). But: `human_common` is Maia at bands ≈1100–1900, so *"prepare against an IM"* has **no honest opponent** (`design/BACKLOG.md:1362`). Weakened Stockfish is rejected doctrine |
| **Novelty hunting, seconds, cloud prep** (`:286`, `:366-370`) | — | **DOES NOT TRANSFER** — and the dossier says so plainly |
| **Publishing analysis for peer criticism** (`:284`, `:371-374`) | other strong humans | **REFUSED BY LAW 8.** *"A product can host sharing … but cannot generate the criticism without violating law 8."* Sharing ships; the critique does not |
| **Adjournment-scale analysis, camps, physical prep** (`:365-367`, `:375`) | days per game | **out of scope by design** |
| **de la Maza's Seven Circles as shipped** (`:178-191`) | — | **DO NOT BUILD.** Only the recognition-sized, Woodpecker-corrected form may inform a feature — and that restriction must be **authored into eligibility, pack-declared, not learner-chosen** |
| **Blindfold / visualisation** (`:192-204`) | a board display mode | **parked** — collides with [[D717]] board protection; its own question, not a pack feature |

**Where a practice depends on something we deliberately refuse, stated plainly:** peer
critique needs generated judgement (law 8); IM/GM-level opponent prep needs an opponent
above Maia's band that is not a weakened engine (rejected doctrine, `CLAUDE.md` §Rejected);
novelty hunting needs cloud compute and a professional's stake; Yusupov's and Aagaard's
*point schedules and exercise selection* are coach judgement and transfer **only as
authored content**, never generated (`titled-player-training.md:380-383`).

---

## 5. [[D863]]'s three wirings, re-verified at HEAD 2026-08-23

**Census procedure** (hand this to the RFC author; the RFC criterion must assert
set-equality against it, per [[D1240]], with any integer a drift tripwire only): walk
`content/**/*.json`, select objects carrying all of `mode`, `opponentPolicy` and
`objective` — **92 pack files of 404 JSON files** — then count `opponentPolicy.mode`,
`checkpoints[].interaction.type`, `timingWindows`, `retryVariants` and `concepts`.
A grep for a mode **name** does not do this and is what produced the wrong number below.

### 5.1 `stated_reasoning` — machinery live, **1** content consumer — **CONFIRMED**

| Claim | HEAD |
|---|---|
| feedback withheld until reasoning records | **confirmed**, and the citation moves: the logic is `apps/server/src/authored-feedback.ts:113-133`, not `:127-131`. `reasoningRecorded` at `:113-115`; the delayed-checkpoint arm's test at `:127`; the default arm's at `:131`; the call site skips the item entirely at `:321` |
| authored users | **1** — `content/drafts/stated-reasoning.browser.json`, one `stated_reasoning` checkpoint across all 92 packs |
| by contrast, `intent_capture` | **51** checkpoints |

**Need:** authoring only. The grammar is closed and validated (`docs/drill-pack-format.md:30-33`,
`:204-208`) and the key points are `[needs authored content]` under law 8.

### 5.2 `perfect_tablebase` — **2 packs, not 6** — **D863's NUMBER IS WRONG**

| Claim | HEAD |
|---|---|
| [[D863]] and `titled-player-training.md:275`: *"6 content files"* | **refuted.** Exactly **2** packs declare `opponentPolicy.mode: "perfect_tablebase"`: `content/drafts/mate-bishop-knight.json` and `content/drafts/trajectory-mate-bishop-knight.json` |
| the other four grep hits | prose, not declarations: `/provenance/graduationBlockers/4/statement` in `mate-k-r-technique.json`, `mate-k-q-technique.json` and `mate-two-bishops.json`, plus two lines of `content/accepted-conditions.md` |
| for scale | `human_common` **55**, `theory_strict` **34**, `strong_engine` **1** |

**So the Dvoretsky-technical-position wiring is three times thinner than the ledger says**,
and the row's *"WIRED, thin"* should read **"wired, nearly empty"**. The three
mate-technique packs that *mention* it are exactly the Dvoretsky basic-course material and
are running against a different opponent.

### 5.3 Theme-position sparring — **CONFIRMED, needs nothing** — plus a refinement to §5.3

Sparring is the thesis and requires no wiring (`titled-player-training.md:221-236`, `:274`).
But the dossier's *neighbouring* claim needs correcting:

| Claim | HEAD |
|---|---|
| `titled-player-training.md:337-347`: `WindowTrigger`/`TempoVerdict` has *"zero authored users"* | **half wrong.** **4 packs** declare `timingWindows` and consume them: `dragon-yugoslav-race`, `iqp-white-panov-attack`, `kid-mar-del-plata-white`, `maroczy-bind-white-squeeze` |
| but | every one uses the **spend** arm — `atWindow: {windowId, spendAtLeast: 2}`. **Zero** use the `{windowId, verdict}` arm, and **zero** objectives carry a `timing_window` success condition |

**The precise statement is therefore: the timing-window *ledger* has four authored users;
the timing *verdict* — [[D320]]'s "one computed judgement of learner behaviour in the
product" — still has none.** That is a smaller, sharper content gap than the row claims,
and it changes the tempo-cycle work order: the window machinery is proven in content
already; only the graded arm is dark.

### 5.4 The full pack census, measured 2026-08-23 (baselines, not criteria)

| Dimension | Distribution |
|---|---|
| pack files | 92 |
| `mode` | outcome 42 · line 32 · plan 14 · trajectory 4 |
| `phase` | opening 33 · middlegame 33 · endgame 23 · cross_phase 3 |
| root `opponentPolicy.mode` | human_common 55 · theory_strict 34 · perfect_tablebase 2 · strong_engine 1 |
| `objective.type` | play_until_checkpoint 41 · follow_theory 18 · win 10 · reach_structure 7 · preserve_plan_window 4 · hold 4 · run_trajectory 4 · prevent_opponent_plan 2 · execute_break 1 · resist 1 |
| `feedbackPolicy` | delayed_checkpoint 61 · immediate_guard 31 |
| checkpoint interactions | intent_capture 51 · stated_reasoning 1 · **prediction 0** |
| `timingWindows` | 4 packs |
| `retryVariants` | 7 packs (all free-text notes against a **refused** field) |
| `concepts` | 50 packs |

### 5.5 The fourth wiring [[D863]] does not name — `prediction`

[[D860]] belongs beside the three. Re-verified: **0** packs carry a `prediction`
interaction, and the pack gate is **not** at `service.ts:1204`.

| Claim | HEAD |
|---|---|
| the pack gate | `apps/server/src/service.ts:1514` — `const pack = this.#requiredRegisteredPack(stored.run);`, with the effective refusal the compound condition at `:1515-1517` (*"Unknown prediction checkpoint"*) |
| stale citations to repair | [[D860]] (`design/BACKLOG.md:558`), `titled-player-training.md:315`, **and `rfc/longitudinal-store.md:229-230`**, which carries `service.ts:1204` inside an accepted RFC |
| the buried treasure, re-confirmed | the event stores `predictedMass`/`predictedRank` against the Maia distribution, so a solitaire score is law-8-clean by construction |
| downstream dependency | `rfc/longitudinal-store.md:136-149` already types `decision_class ∈ {played, game, predicted}` **for this exact event** — the store is waiting on a producer that the gate blocks |

**Note for the RFC author:** `#requiredRegisteredPack(stored.run)` appears at ten sites in
`service.ts`. A criterion citing a line number here will rot. Cite the symbol and the error
string.

---

## 6. The law-8 boundary for a training method

**The distinction, stated as a test.** Law 8 forbids LLM-manufactured *chess truth* — an
ungrounded strategic claim or a move grade. A training method is a claim about **how to get
better**, which is pedagogy about a person, not truth about a position. *"Solve before you
check"*, *"return at spaced intervals"*, *"drill the same set faster"* name no move and
evaluate no position. **A training method is therefore not automatically forbidden.**

The line is crossed at exactly one place: **when the method needs a move-level judgement to
advance its own state.**

| Method mechanic | Does it need a move-level claim? | Verdict |
|---|---|---|
| Advance the ladder on an **objective verdict** (`stable`/`unstable`/`open`) | no — the verdict is the authored objective's rules-arithmetic resolution over the run | **clean, and this is what ships** |
| Chessable's **soft fail** (0.3 cp / mate-preserving / tablebase-equivalent) | **yes** — an engine margin decides whether your alternative counts | admissible **only** as a *disclosed convention*: `rfc/skills.md:163` admits `bounded_search` *"only with the convention disclosed"*, and `:162` admits `tablebase_exact` outright. **An LLM may never author the margin** |
| **Difficult roots** from counted unstable verdicts | no — counting recorded outcomes | **clean** (`chessable-movetrainer.md:247-256`) |
| **Corpus-frequency ordering at band** | no — *"popularity establishes common or unusual, never good or bad"* (`rfc/skills.md:166`) | **clean as an ordering; forbidden as a valence** |
| **Pass marks** — points per exercise, authored threshold | the *point schedule* is a judgement — but an **authored** one | clean **iff authored**; `titled-player-training.md:380-383` and `rfc/skills.md:160` (*"law 8 constrains LLMs, not authors"*). Generating a point schedule is the violation |
| **Guess-the-move score** vs the Maia distribution | no — the reference is *"the move actually played, and how human your guess was"* | **clean by construction** (`titled-player-training.md:319-322`) |
| **Peer critique** of learner analysis | yes, unavoidably | **refused** (`:371-374`) |
| **Tempo verdicts** against an authored budget | no — the budget is authored, the spend is measured | **clean**; it is already [[D320]]'s single computed judgement of *behaviour*, not of a move |

### 6.1 Does spaced-repetition scheduling imply a mastery claim our own refusals forbid?

**Scheduling that selects is clean; scheduling that renders a verdict about the learner is
not.** The precedent is already pinned and quoted twice: `rfc/longitudinal-store.md:462-465`,
via `rfc/player-style.md:173` — *"Selection, yes; rendering, never."*

A due date is a **selection**. It says *serve this root next*. It asserts nothing about the
learner in the product's voice, and `docs/return-and-progression.md:47-50` already holds the
line: `/learn` *"deliberately presents no mastery percentage: the stored data is an attempt
history and a return queue, not proof of mastery."*

A **maturity vocabulary** is different, and this is [[D864]]'s actual exposure. The skills
lane ruled the two ends of this axis **this week**, and the ruling is directly transferable:

| Object | Skills-lane ruling | Site | Transfer to this lane |
|---|---|---|---|
| A **level** — a number about the learner | **REFUSED.** *"A skill level. A number about the learner, refused twice … **Selection, yes; rendering, never**"* | `rfc/skills.md:434-435` | **A per-root maturity level ("Level 6 of 8") is refused by the same reasoning.** Chessable's ladder position is exactly the refused object at root grain |
| A **hidden threshold** | **REFUSED** — *"unfalsifiable by construction"* | `rfc/skills.md:436-437` | **Chessable's "review score below level 4" must be shown, not hidden**, if adopted |
| A **credit / mark** — an event, no denominator, monotone, unfarmable, linked to the preserved run | **ADMITTED**, and *"law-8 clean by construction"* | `rfc/skills.md:378-381`, `:385-396` | **A per-root return event is admissible in exactly this form**: *"returned 2026-08-14 · next due 2026-09-18 · open the run"* |
| A **ratio** | refused — *"never computes a nineteen-of-thirty-six percentage"* | `rfc/skills.md:407-411` | no `n/m` mature-roots counter |
| Valence generally | **[[D1270]]**: *grounded only, and the owner authors nothing*; ungrounded concepts are *"counted, never credited"* | `planning/rfc-drafting-queue.md` (owner rulings, third batch) | a maturity word must be **derived from counted verdicts**, never asserted |

**The fork this leaves for the owner** (§8, gap 6): a *categorical maturity word* —
`learning` / `mature` / `difficult` — is neither a number nor a ratio, and every input is a
counted event. It is nonetheless a claim about the learner's state at a root. [[D864]] argues
the words *respect* the refusal precisely because they are not percentages
(`chessable-movetrainer.md:243-246`); `rfc/skills.md:404-411` supports that reading (marks
grouped under names, no percentage). **The one thing that is clearly forbidden either way is
the number behind the word.**

**Also load-bearing and easy to miss:** `docs/return-and-progression.md:17` — *"Concepts are
pack-scoped tags and never scheduling keys"* — and `design/01-training-model.md:65-70` —
*"Phase is a discovery filter, never a scheduling key."* Any Woodpecker-style **set** must be
declared by an author on a pack, not derived from a concept or a phase.

---

## 7. The seams

| Seam | State at HEAD | What this lane must do |
|---|---|---|
| **Drill-pack format** — `phase ∈ {opening, middlegame, endgame, cross_phase}`, `mode ∈ {line, plan, outcome, trajectory}` (`schemas/drill_pack.schema.json`; `packages/schema/src/drill-pack/types.ts:24`) | v0.27; `mode` is **required**, `phase` optional | A "line" pack is `mode: line` + `objective.type: follow_theory` + finite `plyHorizon` + one boundary checkpoint (`docs/drill-pack-format.md:274-292`) — **this is the repertoire-file drill and it needs nothing new.** Neither axis is a scheduling key |
| **`rfc/pack-capability-contract.md`** (draft) | holds pack-schema lane **0.30**; makes a pack declare a required `requires[]` of versioned capabilities | Any new pack field this lane adds (pass-mark scorecard, guided pass) must declare a capability and contend for a lane **after 0.30** |
| **`rfc/learner-modules.md`** (accepted, amended 2026-08-23) | a *module* is a learner-facing **evidence-presentation consumer** at one decision point (`:111-116`); five-member timing vocabulary (`:207-220`); eleven modules with budgets (`:475-495`) | **No overlap.** Grepped: zero occurrences of `chapter`/`course`; no scheduling, mastery, pass-mark, or return-queue content. A pass mark is **not** a module. Its only tie-in is [[D893]] (`:74-76`) — modules unlock as campaign abilities |
| **`rfc/longitudinal-store.md`** (accepted, **zero code at HEAD**) | two tables, per-run grain, `PRIMARY KEY (learner_id, run_id, projection_id, projection_version, phase, decision_class)` (`:180`); *"No cross-game total is ever stored"* (`:208-213`); consumers at landing: **none** (`:498-500`); no scheduling consumer registered (`:521-528`) | **Scheduling needs history — and it already has its own.** The `attempts` table (`storage.ts:4102-4131`) is the scheduler's history and predates this store. **Do not route the scheduler through `learner_observations`**: it is unimplemented, contested ([[D973]]/[[D1011]]), and its own §6.1 says nothing reads it. The one real join is `decision_class = 'predicted'` (`:136-149`), which is blocked on §5.5's gate — and this RFC should **repair `:229`'s stale line number** |
| **`rfc/campaign-core.md`** (implementing) | `encounter.kind` union **closed at one member** — `{kind: "pack"; packId}` (`:108`, `:115-116`); verdicts `achieved \| failed \| transitioned \| open` (`:284`), distinct from `AttemptVerdict` (`:286-288`); rewards are module unlocks (`:190-195`); **no node re-entry after seal** (`:125-127`); [[D1040]] — a `failed` seal grants the reward (`:288-295`) | **A campaign encounter is sealed once and never returns.** So a training-method *cycle* is a Just-Play/`/learn` object, **not** a campaign node. Discharge D2 already owns prediction (shape 3) and survival (shape 4) encounter classes — **do not add a fifth shape from this lane**; supply the pack, let D2 own the encounter |
| **`rfc/skills.md`** (draft) | its ledger row 7 (`:596-597`) reads: *"**Route [[D861]] and [[D865]] out of F9** — both are pack- or position-scoped over shipped data and need none of this lane's blockers, yet both are parked behind it"* | **This document is where they route.** Pass marks ([[D861]]) and difficult roots ([[D865]]) are this lane's, on the skills author's own recommendation. Do not re-argue valence — §6 consumes `rfc/skills.md:157-171` |
| **`rfc/player-style.md`** (draft) | twelve habit cards, per-metric floors, `STYLE_REFUSED_TERMS`, `assertTierRuleGrounded` (`:163-169`); refuses composites and archetypes (`:193-202`) | **No overlap and one inheritance.** A maturity word is a **tier rule** in disguise, and `:165` is the reason a sentence filter cannot catch it: *"the manufactured judgement would live in the aggregation rule instead of the prose."* If a maturity vocabulary ships, it must be guarded the way §6 guards tiers |
| **`rfc/enforced-clocks.md`** (draft 2026-08-23) | server-authoritative clocks, flag-fall as a sixteenth run event | **Consume it.** The Woodpecker's *tightening clock* and ChessDojo's *prescribed time controls* are its vocabulary, not this lane's |
| **The corpus/explorer client** | `corpusPopulation(targetElo)` → rating band (`apps/server/src/corpus.ts:139-145`); `LichessCorpusSource.stats` with a day TTL (`:85-131`) | [[D866]] is an **ordering change to one SQL clause plus a corpus read** — no new source |

---

## 8. Gaps — every question an RFC author must decide

1. **Is [[D864]] a feature or a defect repair?** §3.2 measures the shipped ladder index as
   `max(trailingStable-1, |H|-1, 0)` against the accepted RFC's `trailingStable-2`. Decide
   whether the RFC (a) repairs the arithmetic to the accepted spec and *then* adds
   lapse-stepping, or (b) re-specifies the ladder wholesale. **Either way the criterion must
   be a fixture over the real `#refreshAutoSchedule` asserting `due_at` deltas**, because
   `progress.test.ts` asserts none today.
2. **What are the ladder constants?** `[1,3,7,16,35]` is *"a fixed, legible parameter … no
   ease factors … revisable on stated evidence"* with the revision trigger named
   (`rfc/archive/return-and-progression.md:664-668`). Changing them without running that
   trigger would violate its own provenance clause.
3. **Step-down by how much?** [[D864]] says *"step down, don't reset"* and names Chessable's
   full reset as the anti-pattern. One rung, or to blocked-now (which is what ships)? These
   are different products: blocked-now is a re-drill, one rung is a shortened interval.
4. **Does an off-schedule retry (overstudy) advance the ladder?** Chessable's answer is
   asymmetric — wrong demotes, right changes nothing. Ours must decide, and `attempts.origin`
   already distinguishes `fresh`/`duplicate`/`scheduled`/`in_run_retry`.
5. **Does the due queue re-order by corpus frequency at band, or add a second ordering
   surface?** `storage.ts:2644` is one `ORDER BY`. Changing it changes every learner's queue;
   adding a surface duplicates it.
6. **⚠ OWNER — may a per-root maturity vocabulary render at all?** §6.1. The level is out;
   the event is in; the categorical word is unruled. Three options, none pre-pruned:
   (a) events only — *"returned on X, next due Y"*, no word;
   (b) categorical words derived from counted verdicts, each reopening its runs;
   (c) words plus the underlying ladder position shown — which is (b) plus the refused number.
7. **⚠ OWNER — [[D867]]'s ADR-0006 fork.** An **ungraded guided walk-through** whose plays
   write no countable attempt (the runtime already distinguishes *"an empty fork is recorded
   but not counted"*), **or** commit-blind-then-reveal-at-checkpoints. The dossier calls this
   the highest-*value* adoption and explicitly refuses to decide it (`chessable-movetrainer.md:263-276`).
   This is a **pack-format phase**, so it contends for a schema lane after 0.30.
8. **Pass marks: is the threshold pack-scoped or learner-scoped?** `titled-player-training.md:355-359`
   argues pack-scoped keeps it on the right side of [[D320]]'s no-learner-number line. The
   point schedule is `[needs authored content]` under law 8 — who authors it, given [[D1270]]
   ruled *the owner authors nothing*?
9. **Does the Woodpecker cycle need a new schedule grain?** `schedules` is keyed per
   `(learner_id, root_key)` with one auto-pending row. A fixed *set* re-served at shrinking
   intervals has no representation. Decide: a new `set` scope, or a pack-declared root list
   the scheduler expands.
10. **Who owns the de la Maza restriction?** [[D862]] says *"pack-declared, not
    learner-chosen"* — so a pack must be able to declare *recognition-sized*. Which field?
11. **Does `retryVariants` get lifted, or does `variantOf` absorb it?** The disposition names
    `variantOf` as successor (`dispositions.ts:81`) but says it *"is not yet a superset"*.
    Seven packs authored `retryVariants` notes; the accepted RFC's `variant` rotation depends
    on it; nothing reads either. This is the cheapest new capability in the lane.
12. **Which stale citations does this RFC repair?** [[D863]]'s *"6 content files"* (→ 2 packs),
    [[D860]]/`titled-player-training.md:315`/`rfc/longitudinal-store.md:229`'s `service.ts:1204`
    (→ `:1514`), [[D865]]'s `learner_position_stats` source (→ `attempts`), [[D1035]]'s
    *"the spaced-repetition blocked/varied column"* (→ `kind` is that column; `variant` is the
    retry-variant name and is dead), and `titled-player-training.md:337-347`'s *"zero authored
    users"* for timing windows (→ 4 spend-arm users, 0 verdict-arm users).

### Traps, named

- **T1 — the unit.** Every mechanic here is tempting to adopt at the *move*. Chessable's SRS
  unit is the move; ours is the attempt at a root, and `design/01-training-model.md:55-58`
  gives the reason. An RFC that quietly re-grains the scheduler has changed the product.
- **T2 — the hidden threshold.** *"3 or more mistakes and a review score below level 4"* is a
  hidden threshold. `rfc/skills.md:436-437` refuses hidden thresholds by name. Adopt the rule,
  publish the numbers.
- **T3 — the free-schedule collision.** `design/BACKLOG.md:1344` (`league-as-return-loop.md`)
  found the ladder is *"the evidence-backed lever"* on randomised evidence, and *"the single
  licensed upgrade is to make the spacing **imposed rather than freely dismissible**"*.
  Chessable's custom-interval setting cuts directly against that. Adopt vacation protection;
  do not adopt custom intervals without saying which evidence you are overriding.
- **T4 — the campaign seal.** `campaign-core.md:125-127` forbids node re-entry after seal.
  A repetition mechanic placed inside a campaign node is unimplementable by that contract.
- **T5 — line-number rot.** `service.ts:1204` has been wrong in three living documents,
  including an accepted RFC. Cite symbols and error strings.
- **T6 — the marketplace.** [[D868]] is the dossier's *dominant-weight* finding and is **not a
  feature**. It is `design/04`/owner work. An RFC that quietly imports "authored pack identity"
  as a schema field has taken a content-strategy decision the owner has not made.

---

## 9. The full ask, its cost, and what — if anything — blocks it

Per [[D1230]]: the whole ask is priced. Where something does not ship, the blocker is named
and cited. Document size is not a reason and does not appear below. Per [[D1240]], costs are
**procedures and measured baselines**, never totals.

### 9.1 The full ask, decomposed

| # | Capability | Traced to | New field? | Blocker |
|---|---|---|---|---|
| 1 | **Ladder arithmetic repaired** to the accepted spec | §3.2, measured divergence on 5 of 8 histories | no — `storage.ts:2917` | **none.** A defect against an accepted RFC |
| 2 | **Lapse-aware step-down** | [[D864]], `chessable-movetrainer.md:234-246` | no | **none** — arithmetic over `attempts.verdict` |
| 3 | **Ladder-interval test coverage** | §3.2 — no test asserts an interval | no | **none** |
| 4 | **Difficult roots** on `/learn`, linking preserved runs | [[D865]], `chessable-movetrainer.md:247-256` | no — read-time SQL over `attempts` | **none.** [[D865]]'s named source is wrong (§3.4); the right one ships |
| 5 | **Corpus-frequency ordering at band** of `/progress/due` | [[D866]], `chessable-movetrainer.md:256-262` | no — `corpus.ts:139-145` ships | **none** |
| 6 | **Overstudy accounting** (off-schedule retry may demote, never advance) | `chessable-movetrainer.md:277-283` | no — `attempts.origin` ships | **none** |
| 7 | **Vacation-safe scheduling** | `chessable-movetrainer.md:284-289` | no | **none** |
| 8 | **`retryVariants` lifted so varied repetition names its variation** | §3.3; `design/01:72-79`; `rfc/archive/return-and-progression.md:658-666` | no — the field and vocabulary ship, disposed `refused` | **a disposition decision**, gap 11 — not a build |
| 9 | **`stated_reasoning` authored content** (Botvinnik write-first) | [[D863]], §5.1 | no | **none** — content wave, already work-ordered |
| 10 | **`perfect_tablebase` technical-position packs** (Dvoretsky basic course) | [[D863]], §5.2 — **2 packs, not 6** | no | **none** — content wave |
| 11 | **Timing-window *verdict* arm authored** | §5.3 — 4 spend-arm users, 0 verdict-arm | no | **none** — content wave; the window machinery is already proven in content |
| 12 | **Guess-the-move on imported games** | [[D860]], §5.5 | no — lift `service.ts:1514`'s gate; add the first `prediction.recorded` consumer | **none technical.** [[D869]] is **already ruled** (`decision-queue.md:88-92`) for both standalone and encounter arms; the encounter arm is `campaign-core` Discharge D2's |
| 13 | **Maturity vocabulary** rendered on `/learn` | [[D864]], `chessable-movetrainer.md:243-246` | no | **⚠ OWNER RULING** — gap 6. Level out ([[D1151]], `rfc/skills.md:434`), event in (`:378-381`), word unruled |
| 14 | **Pass-mark packs** (Yusupov scorecard, redo-on-fail) | [[D861]], `titled-player-training.md:400-406` | **YES** — a pack-level scorecard: per-verdict points + threshold + redo | **two:** a pack-schema lane after `pack-capability-contract`'s 0.30, and **law 8** — the point schedule is authored, and [[D1270]] just ruled *the owner authors nothing*. Gap 8 |
| 15 | **Guided first-pass ramp** | [[D867]], `chessable-movetrainer.md:263-276` | **YES** — a pack phase | **⚠ OWNER RULING** on the ADR-0006 transformation — gap 7. Also a schema lane |
| 16 | **Tempo cycles** (Woodpecker/endgame blitz) | [[D862]], `titled-player-training.md:407-412` | **YES** — a set-scoped, cycle-keyed schedule; `schedules` is per-root | **one:** the schedule grain, gap 9. The *clock* half is `rfc/enforced-clocks.md`'s, not this lane's |
| 17 | **Author marketplace / free-preview funnel** | [[D868]], `chessable-movetrainer.md:304-309` | — | **NOT A FEATURE.** `design/04`/owner. `decision-queue.md:85-87`: routed, no ruling recorded, *"it gates any monetization design"* |
| 18 | **Peer critique of published analysis** | `titled-player-training.md:284`, `:371-374` | — | **REFUSED — law 8.** Sharing ships; generated critique cannot |
| 19 | **IM/GM-level opponent prep** | `titled-player-training.md:242-258`; `design/BACKLOG.md:1362` | — | **REFUSED — doctrine.** Maia's bands are ≈1100–1900; the only opponent above is `strong_engine`, which is a different species, and weakened Stockfish is on the rejected list |
| 20 | **Blindfold / visualisation** | `titled-player-training.md:192-204` | — | **PARKED — [[D717]]** board protection. Its own question |
| 21 | **Seven Circles on hard material** | `titled-player-training.md:178-191` | — | **DO NOT BUILD** — trainer consensus, and our own thesis |

### 9.2 What that adds up to, stated as sequence rather than as a total

- **Items 9, 10, 11 need no RFC at all.** They are the [[D863]] content wave, already
  work-ordered at `planning/content-wave-work-order.md:694-696`, and they ride the
  content-wave closeout protocol (ledger flip + `planning/content-era/log.md` entry in the
  shipping commit). **Item 11 is new to that work order** and should be added to it, with
  §5.3's refinement: author the *verdict* arm, not more windows. **Item 10's target is 2
  packs, not 6** — the work order's premise needs correcting before the wave runs.
- **Items 1–8 and 12 need no new pack field, no schema lane, and no owner ruling.** They are
  a successor to `rfc/archive/return-and-progression.md` over shipped tables. Item 1 is a
  defect against that accepted RFC and could ship without this lane at all.
- **Item 13 blocks on one owner ruling** (gap 6) and nothing else.
- **Items 14, 15, 16 are the only ones needing new format or storage surface**, and each has
  a named, cited blocker: a schema lane behind 0.30 (14, 15), an owner ruling (15), a new
  schedule grain (16), and law-8 authorship (14).
- **Items 17–21 are out of this lane by name**, each with its destination stated.

### 9.3 The one thing that blocks the lane as a whole

**Not a technical blocker — a licence.** §0: the derivation and the content wave are
licensed; the RFC is not. Every item above except 14–16 could be specified today if the
owner opens the lane; 14–16 additionally need the rulings named.

### 9.4 Recommended RFC shape, stated as options rather than as a chosen slice

| Option | Shape | What it costs |
|---|---|---|
| **A** | **One successor RFC to `return-and-progression`**, covering items 1–8, 12, 13 — the scheduler and its queue, over shipped tables | Claims **no pack-schema lane**, no migration, no new table. Needs one owner ruling (13) which the RFC can carry as an acceptance-blocking open question |
| **B** | **Two RFCs**: A above, plus a **pack-format RFC** for items 14–16 (pass marks, guided pass, tempo sets) | B contends for a schema lane after 0.30 and carries two owner forks. Splitting isolates failure the way `rfc/player-style.md:185-188` argues: a blocked pass-mark ruling must not hold the ladder repair hostage |
| **C** | One document covering 1–16 | Single lane contention, single review; but a ruling on 15 blocks 1 |

**Recommendation: B**, on the failure-isolation argument, **and** because item 1 is a defect
against an accepted RFC that should not wait behind an unruled pack field. This is a
sequencing recommendation with a named home and owner for the remainder — not a scope cut;
no item above is dropped.

---

## 10. Proposed ledger rows

Written **unnumbered** per [[D1130]]; head was **D1298** at drafting.

1. 🐞 **The shipped return ladder diverges from the accepted RFC on 5 of 8 histories, and
   the direction is backwards.** `storage.ts:2917` computes `k = max(trailingStable-1,
   |H|-1, 0)`; `rfc/archive/return-and-progression.md:634-637` specifies
   `k = trailingStable-2`. A root failed four times then passed twice is scheduled **35
   days out** where the accepted RFC says **1 day**, because the `max` keys the interval to
   total attempt count. `progress.test.ts` asserts **no interval at all**. [[D864]] is a
   defect repair before it is a feature.
2. 🐞 **[[D863]]'s `perfect_tablebase` count is a grep artifact: 2 packs declare it, not 6.**
   The other four hits are `/provenance/graduationBlockers/4/statement` prose in three
   mate-technique packs plus `content/accepted-conditions.md`. The Dvoretsky wiring is three
   times thinner than the ledger and the content work order say.
3. 🐞 **Timing windows have four authored users; the timing *verdict* has none.**
   `dragon-yugoslav-race`, `iqp-white-panov-attack`, `kid-mar-del-plata-white` and
   `maroczy-bind-white-squeeze` all consume `atWindow: {windowId, spendAtLeast}`. Zero use
   the `verdict` arm and zero objectives carry a `timing_window` condition. Corrects
   `titled-player-training.md:337-347` and narrows the tempo-cycle content gap.
4. 🐞 **`service.ts:1204` is stale in three living documents including an accepted RFC.**
   The prediction pack gate is `service.ts:1514`/`:1515` at HEAD; `rfc/longitudinal-store.md:229`,
   [[D860]] and `titled-player-training.md:315` all carry the old number, and
   `#requiredRegisteredPack` appears at ten sites so a line-only citation cannot survive.
5. 🐞 **[[D865]]'s named data source cannot do the job.** `learner_position_stats` holds
   `seen_count` only (`storage.ts:4165-4170`); a difficult-roots surface counts verdicts and
   must read `attempts` (`:4102-4131`, indexed at `:4131`).
6. 💡 **Varied repetition names a variation nobody sees.** `schedules.variant` is written
   NULL by the auto path (`storage.ts:2923`), settable only as learner free text
   (`rest.ts:1528-1535`), read by nothing. The accepted RFC specified it as a rotation over
   `retryVariants` (`:658-666`), which is disposed **`refused`** at warning severity — and
   **7 packs authored it anyway**. Narrows [[D1035]]: `kind` is the blocked/varied column;
   `variant` is the retry-variant name, and it is dead.
7. 💡 **The training-methods lane exists and this is its derivation.** Three dossiers
   answering owner asks verbatim, classified LEDGER-ROW-ONLY ×2 and NOTHING ×1 by
   `research-to-execution.md:95,167,183`. `routing-queue.md:67` names the destination;
   [[D1093]] does not reach it; an RFC needs one ruling.
8. 🐞 **Neither owner ask has a ledger row** — law 4. `chessable-movetrainer.md:6-7` and
   `titled-player-training.md:3-4` carry the verbatim asks in dossier headers only; the
   ledger holds the rows the dossiers *produced* ([[D860]]–[[D868]]) but not the questions
   that commissioned them.
9. ⚠ **OWNER — may a per-root maturity vocabulary render?** The skills lane ruled the level
   out (`rfc/skills.md:434-435`) and the event in (`:378-381`). A categorical word is
   neither, and is the whole learner-facing surface of [[D864]].
