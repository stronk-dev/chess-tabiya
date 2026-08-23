# Refused vs. asked — the accountability join

**Run:** 2026-08-23, at HEAD, by claude, on the owner's question, verbatim:

> *"what ELSE has been 'refused' even though i asked for it explicitly this is like the 10th time
> we find out after the fact major compoments are being deferred for no reason."*

**Ledger:** [[D1030]] (this audit and the instrument it owes), [[D1031]] (the variant lane the
question opened), [[D487]]/[[D641]]/[[D952]] (routing decay — the *adjacent* defect, not this one),
[[D951]] (a gate stated in a body and dropped from its summary).

**The owner is right, and the pattern is measurable.** This file is the full join of *what the
owner asked for* against *what the repo refuses, defers or scopes out*, so the list stops being
discovered one item at a time. It is unflattering by design.

**This file is hand-made and rots** — [[D492]]'s standing finding applies to it exactly as it
applies to `work-register.md` and `never-started-lanes.md`. §7 proposes the instrument that makes
it unnecessary. Do not quote these counts tomorrow.

---

## 0. The one-paragraph answer

The repo has an instrument that proves **every engine option the sidecar advertises has a
disposition row** (`assertAdvertisedCapabilityDispositions`, `apps/server/src/capabilities.ts:167-188`
— delete a row and the server throws at startup). It has **no instrument that proves a *product*
disposition was ever ruled by the owner.** 14 of the 19 shipped refusals in that table are product
decisions, not technical limits. The most consequential one — `UCI_Chess960` — has sat in shipped,
startup-enforced code since before 2026-08-16 with the reason *"The shipped drill format is standard
chess only"*, while the owner's Fischer-Random ask sat in the ledger as an idea row from 2026-08-16.
Neither ever met the other. That asymmetry is the whole bug, and §7 names it and proposes its fix.

---

## 1. THE ANSWER, PART 1 — REFUSED IN CODE OR DOCS

**Definition:** the owner asked for it; a refusal, parking or scope-out exists in shipped code, an
RFC scope section, a design doc or a research verdict; and **the owner was never asked to rule on
the refusal.** A refusal the owner never ruled on is the defect.

Six ledger rows, forming two clusters.

### 1.1 D327 — variants in Just Play, incl. Fischer Random

| | |
|---|---|
| **Asked** | 2026-08-16, verbatim: *"what if I want in just play all these variations as well? if we're going to add packs with ie fischer random or all these other variations."* |
| **Refusal lives at** | `apps/server/src/capabilities.ts:133` — `{ instrument: "Stockfish", capability: "UCI_Chess960", disposition: "refused", reason: "The shipped drill format is standard chess only" }`. Secondary: `apps/server/src/pgn-import.ts` refuses anything but `Standard`/`From Position`. Promoted into research doctrine at `design/research/fun-mechanics-outside-roguelikes.md:128` (**C14**: *"Variants are a named, published refusal, not an omission… adopting a chess variant as a minigame without amending a published capability refusal"*) and again at `:1127`. Re-asserted in planning at `planning/campaign/rfc-derivation.md:460` — *"Stay parked"*. |
| **Class of refusal** | **Product scope.** Stockfish supports Chess960; the product declines. Nothing technical prevents it — the row's own analysis says the whole detector stack, the tablebase and the explorer survive Chess960; only Maia (rung 3) goes dark. |
| **Ever put to the owner?** | **No.** Not in `decision-queue.md` (which holds D304/D868/D886/D887 and no variant row), no ⚖️ row, no O-row. Seven days as an unruled refusal. |
| **Aggravating detail** | The refusal is **mechanically load-bearing**: `advertisedOptions: ["UCI_Chess960"]` exists so the startup assertion can prove the option has *a* disposition. Removing the row crashes the server. So a product opinion typed once became a startup invariant that no one can casually revisit. |
| **Current status** | Lane opened **2026-08-23** — [[D1031]], `planning/rfc-drafting-queue.md` §"Variant family lane", derivation commissioned at `planning/variants/rfc-derivation.md` (not yet on disk). **The lane exists because the owner asked a second time**, not because anything caught it. |
| **Cheapest next step** | Make *"amend or delete `capabilities.ts:133`"* an explicit, named deliverable of the D1031 derivation, with the amended `reason` citing the owner ruling. One line of code; the whole point is that the line has an owner's name on it. |

### 1.2 D329 — famous-game packs

| | |
|---|---|
| **Asked** | 2026-08-16, verbatim: *"are they all opening vs midgame vs endgame? cause what if we want packs based off of famous previous games?"* |
| **Refusal lives at** | `apps/server/src/capabilities.ts:159` — Explorer `topGames / recentGames / masters database`, `disposition: "refused"`, reason *"Per-game scope and licence questions remain unresolved"*. **That is the exact instrument a famous-game pack would source from**, refused on a question that is *unresolved* rather than answered — a deferral wearing a refusal's clothes. Second half of the gap is a schema absence, not a refusal: `$defs/provenance` requires only `reviewStatus` and offers `sources` as a bare `string[]`; `sourceGame` occurs zero times, so *"from Kasparov–Topalov, Wijk aan Zee 1999"* is prose nothing can read. |
| **Ever put to the owner?** | **No — and this one was explicitly flagged for the owner and then dropped.** `planning/defect-triage.md:473` classifies D329 **NEEDS-OWNER** with the question written out: *"Are famous-game packs in scope as a first-class provenance axis?"* That question was written on 2026-08-16 and **never copied into `decision-queue.md`**. |
| **Current status** | **REFUSED-adjacent + unruled.** Routed only to `defect-triage.md`, `work-register.md` §4c (*"queued 2026-08-16, not launched"*) and `ux-work-lane.md:549`. No RFC, no lane. |
| **Cheapest next step** | Two lines in `decision-queue.md`: the NEEDS-OWNER question, and the licence question behind `capabilities.ts:159`. `work-register.md:180` already prices the build: *"D329 is the cheapest and most independent — a `sourceGame` object on `provenance`, one pack-schema lane, no runtime change,"* with `variantOf` as the existing precedent. |

### 1.3 D330 / D355 / D357 / D364 — time controls (four rows, one refusal)

| | |
|---|---|
| **Asked** | 2026-08-16, verbatim: *"what if we want to simulate the time pressure of a GREAT move during 10+0 chess and then give actual time?"* |
| **Refusal lives at** | `design/06-campaign.md` §5's refused list — *"a pursuit clock is a retry price by another name"*. The dossier that answered the owner (`design/research/time-as-a-difficulty-lever.md`) found this refusal **one word too broad**: it is true of a run-pooled clock and false of an attempt-scoped one, and the shipped field cannot even express the refused form ([[D355]]). Reinforced in code by `capabilities.ts:132` (Stockfish `Move Overhead` refused — *"Selections use explicit search bounds rather than an engine clock"*). |
| **The dead field** | `clockState` is a zero-reader passthrough. Declared `packages/runtime/src/types.ts:124`, `packages/runtime/src/runtime.ts:58`, `apps/web/src/lib/api.ts:644`, `schemas/drill_run.schema.json:218`/`:277`. Written and re-serialised at `runtime.ts:342`, `apps/server/src/rest.ts:564/566/570/1601-1603`, parsed only as *"is it an object"*. **No reader anywhere.** Schema text: *"Reserved until clock semantics are specified by a later RFC."* — reserved for an RFC nobody was ever asked to authorize. Ledgered separately as [[D361]]. |
| **Ever put to the owner?** | **The ruling was formally requested and never delivered.** [[D364]]'s status cell reads *"owner ruling requested 2026-08-16"* and names the exact three-way fork: **(a) nothing** — delete the reserved field; **(b) a decoration** — [[D362]]'s depicted clock, *recommended and cheapest*; **(c) a rule** — the enforced attempt-scoped clock, which amends `06` §5 twice and must refuse the run-pooled form in the same ruling. **That fork is not in `decision-queue.md`.** Seven days. |
| **Also refused at RFC level** | `rfc/bot-policy.md:638` ships a refusal row — *"artificial move delay \| refused \| [[D820]]: no fake timing; a timing layer requires clock-accepting model/corpus work"* — and `:127` puts *"time-usage modelling ([[D820]], deferred — new corpus/model work)"* out of scope. `rfc/tactical-collectors.md:1003-1005` also lists *"time-usage modelling — expensive, deferred"*, citing a **research-doc section**, not a D-id. `rfc/campaign-core.md:491` Discharge **D4** is the only place in the tree where time controls have a named home at all: *"time controls (nothing exists to build on — `clockState` is an untyped passthrough)"* → `planning/campaign/`. **A planning directory is not an owner, an RFC, or a date.** |
| **What did happen** | The entry-condition experiment `work-register.md:187` demanded *was run*, and it **refuted claude's own hypothesis** ([[D331]]: over 43,272 rendered items, distance class explains η²=0.201 of reading length and 0.038 without the refused `move` class, while *which renderer printed it* explains 0.984). So the blocker was cleared on 2026-08-16 and nothing moved. [[D357]] adds the finding that actually matters to the owner's design: under 10+0, a learner can read the `move` item (1 word / 0.3 s median) **50 times inside one move budget** — a clock is a gradient *toward* cheating, which changes the answer and is exactly the sort of thing the owner should get to decide. |
| **Cheapest next step** | Put D364's (a)/(b)/(c) into `decision-queue.md` as one row today. Option (b) is one retained field: `apps/server/src/pgn-import.ts:63` already keeps PGN headers whole (so `TimeControl` survives), and `:54` reduces each move to `{san, uci}`, **dropping the per-move `[%clk]` comments Lichess emits** — which is literally the number the owner's sentence is about. Whichever way it goes, [[D361]] closes in the same commit: give the field a shape or delete it. |

---

## 2. THE ANSWER, PART 2 — NO LANE AT ALL

**Definition:** the owner asked for it; there is no refusal *and* no execution path. Mentioned in
the ledger and, at most, in a hand-written routing document that routes nothing.

Thirteen rows. Ordered by how directly the owner asked.

| # | Row | The owner's words / the ask | Asked | Where the absence lives | Ever a decision? | Cheapest next step |
|---|---|---|---|---|---|---|
| 1 | **D873** | *"we don't need to forget we're learning chess here"* — fairy pieces, smaller boards, **pawns-only / reduced-army starts** as campaign material | 2026-08-22 | Only `planning/codex-queue.md`, `rfc-drafting-queue.md` (added today) and `campaign/rfc-derivation.md`. **No lane for 7 days.** Note the split the derivation proves: **reduced armies work unchanged today** (legal standard FEN, every collector/SEE/engine/explorer intact, tablebase turns *on* at ≤7 units); only smaller boards and fairy pieces break at `parseFen` | No | Folded into [[D1031]] today. Split the row: reduced armies is buildable now; fairy/small-board waits on D887's law |
| 2 | **D887** | **owner-tier** balance law: material and position bend freely; board geometry and piece set exit the evidence plane; evidence-dark nodes are *play, never training* | 2026-08-22 | In `decision-queue.md` only since the 2026-08-22 repair pass, still **UNRULED**. `rfc/campaign-core.md` Discharge D3's army/prestige fork cites it as a prerequisite | Queued 2026-08-22, never ruled | One owner ruling. It gates the whole fairy/reduced-army encounter class |
| 3 | **D870** | *"shouldn't our campaign mode have more variants like that??? what other novel chess variations there be???"* — a **FAMILY** of training-mode variants | 2026-08-22 | `decision-queue.md:88-92` states it plainly: *"the **standalone-mode arm has no lane**"* | Ruled 2026-08-22 (both arms approved); the *execution* had no home | Lane opened today under [[D1031]] |
| 4 | **D328** | *"what about a (westernized) xiangqi and shogi? those would be nice — even if we cannot offer most of the support mechanics"* — degraded support **explicitly accepted by the owner** | 2026-08-16 | `work-register.md:158`: *"**Nothing is running on these**"*. The entry condition it names — *"where does the chess coupling actually sit?"*, one cheap measurement deciding *"whether this is a weekend or a second product"* — **was never taken in 7 days** | No | Take the measurement. It is one grep-and-read of `Node.fen`/`transposeKey` against SFEN/xiangqi-FEN, and it decides the shape of both rows |
| 5 | **D113** | Hint **distance** as an assistance axis — point at a square, a piece, a ply-distance, or the move: four disclosures over one piece of evidence | 2026-08-15 | Only `defect-triage.md` + one mention in `rfc/pack-population-provenance.md`. **Eight days, no lane.** The mechanism ships unused: `bestline` records are plumbed end-to-end (`api.ts` → `rest.ts:1354` → `evidence-queue.ts:394` → `compare.ts:204`) and **0 of 764 committed records are `bestline`** | No | It is the substance of the campaign's loadout slots and of D357's clock interlock. Route it into the campaign or assistance lane, or rule it out loud |
| 6 | **D550** | *"they have rewinds from mistakes and then alternative moves with an explanation… kinda like autobranching?"* | 2026-08-20 | **One mention in the entire repo**: `planning/evidence-rework-brief.md`. Not researched, not queued, not in any RFC | No | The transformation is already named in-row (auto-*offered*, never auto-*played*, never before commit). A half-day desk pass, or a ruling that we do not want it |
| 7 | **D554** | *"seems like lots of vibecoded chess apps upcoming? we have to keep an eye… we're the only open and free one!"* — resweep the forum threads | 2026-08-20 | [[D556]] built the `capability-watch` instrument and closed the *tooling* half; the row's own status cell says *"D554 hands-on/forum resweep remains open"*. Nothing schedules it | No | Half a day of forum sweeping into the existing `capability-watch.json` |
| 8 | **D334** | *"not as a HARD rule… IE reaching a high checkpoint, maybe you want to start at the latest level vs 2000 ELO or w/e… or a weird variant run… we can ideate on long term rewards/unlocks"* | 2026-08-16 | **An implementing RFC is blocked on it and the owner was never told.** `rfc/campaign-core.md:490` Discharge **D3** (army/prestige) reads: *"blocked on the OWNER fork: D893(3)'s 'unlocks harder bosses' versus D334's 'winning may unlock convenience and variety, never content'; is a harder boss variety or content? Not specifiable until ruled."* **That fork is in no queue.** The surviving distinction is in no intent doc either | No | One owner ruling unblocks a discharge row in an RFC that is *currently implementing* |
| 9 | **D305** | **OWNER QUESTION**, ⚠ owner-facing: *what is the campaign's progression denominated in, now that the power curve is flat by construction?* Three answers (cadence / the learner's own history / the catalogue) that produce very different products | 2026-08-16 | `defect-triage.md` only. **Never in `decision-queue.md`** | No — though [[D893]] later answered it sideways (*"EVIDENCE CONSUMERS as the progression currency"*), and the row was never closed against that ruling | Close D305 against D893 explicitly, or surface the unanswered half |
| 10 | **D304** | ⚠ owner-facing: ADR-0007's twin clause — unlocked by **playing**, never by **winning** | 2026-08-16 | The inverse defect: `rfc/campaign-core.md` §4.1 **grants rewards on ANY verdict, i.e. the clause implemented ahead of its ruling** (`decision-queue.md:81-84` says exactly this) | Queued 2026-08-22, never ruled | One owner confirmation, so the intent tier carries a clause the code already obeys |
| 11 | **D162** | **owner-gated**: a production deployment serves **one** pack — the schema example. `PackRegistry.loadDefault` builds `productionPaths` from `content/packs/`, which holds only `.gitkeep`; all authored packs live in `content/drafts/` and load only in dev | 2026-08-15 | Open, marked owner-gated, no lane. Partially superseded by [[D502]]'s both-channels ruling, but the row never closed against it | Marked owner-gated; never queued | Close it against D502 or state what still blocks |
| 12 | **D488** | K9's competitor latency is on file from the owner's own field report; **our side has never been measured** | 2026-08-16 | No lane. The row itself says *"It is an **afternoon** with a shipped browser suite, and it is the **only kill criterion testable today**"* | No | An afternoon. Kill-criterion evidence is law 6 work — this should not be sitting unrouted |
| 13 | **D640/D650** | The unruled protected-intent residual: three measured stale claims left in `design/03` (B1/B8 call Settings display-only, B4 overstates the Syzygy gap, B3 understates the shipped difference strip) | 2026-08-21 | `decision-queue.md:29-33` — *"One owner nod may authorize Claude to correct all three"* | Stated in the queue's preamble, never as a row, never nodded | One owner nod |

**Adjacent, same shape, not owner-quoted** (so not counted above, but they belong on the watchlist):
[[D868]] author marketplace / content strategy — *"routed to `design/04`/owner"* with no `design/04`
amendment and no ruling; [[D880]] the SOUND form, *"owner's to write"*, in no queue; [[D837]] a
claude-derived design axis flagged *"the owner's to veto"* and never shown to him; [[D958]] casting,
*"owner B5 ruling pending"*, not in the decision queue; [[D874]] progressive armies (codex-queue
only); [[D884]] reduced-material mini-games (routing-queue only); [[D864]] lapse-aware rescheduling
(routing-queue only); [[D301]] the daily shared position — *"the cheapest complete feature in the
campaign cluster"* by its own accounting, **unrouted through two consecutive audits** before
`rfc-drafting-queue.md` picked it up on 2026-08-22.

---

## 3. The counts

**Population:** 80 `design/BACKLOG.md` rows carrying an explicit owner attribution — a verbatim
quote, or one of `OWNER` / `owner idea` / `owner ruling` / `owner extension` / `owner question` /
`owner commission` / `owner-tier` / `owner-facing` / `owner-gated`. Regex and id list in §6.

| Bucket | Count | Rows |
|---|---:|---|
| **REFUSED IN CODE OR DOCS** | **6** | D327, D329, D330, D355, D357, D364 |
| **NO LANE AT ALL** | **13** | D113, D162, D304, D305, D328, D334, D488, D550, D554, D640, D870, D873, D887 |
| SHIPPED | 20 | D16, D30, D44, D69, D97, D126, D164, D205, D502, D555, D563, D648, D649, D656, D745, D976, D977, D982, D996, D1006 |
| IN FLIGHT (named RFC or queue item) | 23 | D437, D439, D476, D532, D551, D552, D617, D618, D619, D717, D841, D869, D893, D906, D945, D947, D953, D995, D997, D1005, D1029, D1031, D365 |
| ACCEPTED-NOT-STARTED | 5 | D616, D655, D886, D946, D987 |
| RESEARCHED-NOT-SCHEDULED | 8 | D549, D553, D557, D559, D581, D810, D811, D812 |
| HELD BY THE OWNER'S OWN RULING | 5 | D462, D531, D560, D949, D950 |

**19 of 80 owner asks — just under a quarter — are refused or have no execution path.**

**The number that names the mechanism:** of the **32** open ledger rows that name an owner decision
as their blocker (`owner ruling pending/required/requested`, `owner-tier`, `owner-facing`,
`owner's to veto/write/rule`, `NEEDS-OWNER`, `awaiting owner`), **`decision-queue.md` contains 6.**
The other **26 are absent from the file whose only job is holding owner decisions.** Its four
capability rows (D304, D868, D886, D887) were all added by a single repair pass on 2026-08-22 and
**none has been ruled since.**

---

## 4. Side B — the refusal inventory

### 4.1 Refusals shipped in code

Three source-of-truth tables, **27 distinct refusal records**. Everything else in the repo's ~1,195
`refused` hits is an echo (type unions, tests, harness prose) or markdown.

**`apps/server/src/capabilities.ts` — `CAPABILITY_DISPOSITIONS`, 19 refusals.**
**14 are product-scope decisions; 5 are technical.**

| Line | Capability | Reason | Class |
|---|---|---|---|
| 124 | Stockfish `bestmove / MultiPV rank / bestline` | "Move verdicts are not condition measurements" | product (doctrine) |
| 125 | Stockfish `MultiPV > 1 outside enumerate` | "No attested authoring need outside the comparison enumerator" | product |
| 127 | Stockfish `SyzygyPath / SyzygyProbe* / Syzygy50MoveRule` | "Hosted tablebase is the shipped path" | product (architecture pick) |
| 128 | Stockfish `UCI_LimitStrength / UCI_Elo / Skill Level` | "Weakened Stockfish is **rejected doctrine**" | product — **legitimately owner-ratified** (`CLAUDE.md` §Rejected) |
| 129 | Stockfish `nodestime / Ponder / go mate` | "No product question asks for these controls" | product |
| 131 | Stockfish `Debug Log File / NumaPolicy` | "Deployment diagnostics and topology are not product measurements" | product |
| 132 | Stockfish `Move Overhead` | "Selections use explicit search bounds rather than an engine clock" | product — **touches D330** |
| **133** | **Stockfish `UCI_Chess960`** | **"The shipped drill format is standard chess only"** | **product — §1.1, never ruled** |
| 134 | Stockfish `EvalFile / EvalFileSmall` | "Custom evaluation networks have no **authorized** product surface" | product |
| 142 | Maia band-conditioned resistance | measured flat across 1100/1500/1900; transfer ratio 0.40 → ~0.07 below ten pieces, 16,660 games | **technical — the best-evidenced row in the table** |
| 144 | Maia `Temperature 0` | "A modal opponent is **a different product**" | product, self-declared |
| 148 | Glicko-2 rating from adjudicated outcomes | "A pack's declared success is not a game result" | product (validity doctrine) |
| 149 | Glicko-2 rating as an input to what is said about a move | "never an argument to a rendering" | product |
| 150 | Glicko-2 cross-learner comparison outside a joined cohort | "there is no global table" | product — **and this is the positive control, see §5** |
| 154 | Syzygy `dtm` | "Not published for every position" | technical |
| 158 | Explorer monthly history | "Measured drift is below any actionable threshold" | technical (measured null) |
| **159** | **Explorer `topGames / recentGames / masters database`** | **"Per-game scope and licence questions remain *unresolved*"** | **product + legal — §1.2, a deferral wearing a refusal's clothes** |
| 162 | Supervisor stockfish-play identity | "no **authorized** client surface" | product |
| 163 | Supervisor `EngineRequest.afterCommands` | "No production callers" | technical (dead code) |

**`packages/schema/src/drill-pack/dispositions.ts` — `FORMAT_DISPOSITIONS`, 3 refusals**, all
product-scope: `/opponentPolicy/mode` `plan_defense` (`:23-28`) and `human_external` (`:29-34`) —
both *"is not selectable in v1; … is not implemented"*, i.e. **unbuilt, frozen as refused** — and
`/retryVariants` (`:77-82`), *"a catalogue relation, not a run modifier"*, which is the same
`RETRY_VARIANT_KINDS` vocabulary [[D299]] calls *"Dominion's kingdom sitting in our schema"*.

**`apps/server/src/position-evidence.ts` — `RECORDED_READING_DISPOSITIONS`, 5 refusals.**
`:25` `opening_identity` — *"Opening identity is position naming, not a recorded measurement"* —
**directly blocked a verbatim owner ask** ([[D552]]: *"chess.com has so much feedback after a session
and can tell you all your openings and how accurate you are with them"*). It is being removed now by
`rfc/runtime-opening-identity.md` (accepted 2026-08-23) — routed through [[D544]]'s tactics finding,
**not** as an answer to D552. `:31` `puzzle_provenance` is likewise definitional. `:26`/`:27`/`:28`
are technical (redundant, or no producer).

**Two integrity notes:** `capabilities.ts:31-34` `DECLARED_UNIMPLEMENTED_POLICY_MODES` restates the
`plan_defense`/`human_external` reasons **verbatim in a second package** with no cross-check tying
the copies together. And `tools/evidence-topology-harness/audit.test.ts:121` records that the
`bestmove/bestline` refusal at `:124` **is not actually honored** — *"the analysis route accepts
bestline and eval payloads carry `bestMoveUci`."*

### 4.2 RFC-level deferrals that hid an owner ask

**The headline of the RFC sweep, stated first because it is the cleanest evidence in this file:**
across all 24 active RFCs (register at `rfc/README.md:13-36`) and all 73 archived ones, **not one
defers chess variants, famous-game packs, the author marketplace, or player-style-as-a-product.**
D327, D328, D329, D870, D873, D874, D868, D1031 have **zero inbound references from any active
RFC's scope boundary, Discharges table or Open questions.** They were not deferred by an RFC — no
RFC ever picked them up. D869 and D860 are referenced only by `longitudinal-store.md`, and only as
a *data-shape hook* (`decision_class ∈ {played, game, predicted}`, `:229-237`, `:760-765`) so the
store *"lands with no migration on the day solitaire ships"* — the one place solitaire is engineered
*for* rather than deferred, with nothing anywhere scheduling the day.

**The circular deferral — this is how [[D552]] disappeared for three days.** The owner asked for
per-opening accuracy and style mapping on 2026-08-20. Then:
`rfc/runtime-opening-identity.md:403` — *"No longitudinal claim. Accuracy-by-opening and player
style require the observation store"* → `rfc/longitudinal-store.md:113-114` — *"**No habit cards,
skill credits, milestones, tips, or style axes.** Those are F6/F9 consumers ([[D549]]/[[D552]]/
[[D844]]) with their own RFCs, floors, and validation obligations"* → **those RFCs do not exist**,
F9 is a lane in `planning/evidence-foundation-ux/plan.md` with, in `semantic-collectors.md:100-106`'s
own words, *"deliberately zero rows"*. Each hop is individually correct and cites the next; the
chain terminates in nothing. **Both of the owner's 2026-08-20 asks (D549 skills, D552 style) are at
the end of it**, and `longitudinal-store` is itself blocked by [[D973]] (accepted while all three
Open questions still read *"resolve before implementation"*).

- **`rfc/play-composition.md:108`** — *"**No theming lane and no animation lane.**"* §7 (`:547-556`)
  ships *token hooks only*: *"this RFC neither ships a dark theme nor blocks one."* Discharge row D3
  (`:674`) defers the whole [[D839]]/[[D840]] lane **to a lane that did not exist**. The theming RFC
  was drafted, accepted and implemented in the 24 hours after the owner asked where it was — which
  is the proof the deferral was never a capacity problem.
- **`rfc/campaign-core.md`** — Discharge **D2** defers verdict shapes 3–4 (the [[D869]] solitaire
  prediction-threshold and [[D886]] unbounded-run seal); Discharge **D3** forks army/prestige and
  cites the unruled [[D887]] law as its gate. Both are the owner's own 2026-08-22 asks, deferred
  inside the RFC that consumed them.
- **`rfc/learner-modules.md:438`** — durable cross-run novelty *"explicitly out of scope"*, owner
  named (Discharge D4). Correctly done: the deferral names its successor.
- **`rfc/assistance-controls.md:147`** and **`rfc/feedback-delivery.md:378`** — both carry
  *"Explicitly out of scope, each with its owner named"* tables. **This is the good pattern**: every
  row names a D-id or an implemented RFC. Nothing checks that the named owner was ever commissioned.
- **`rfc/longitudinal-store.md`** — accepted 2026-08-22 while **all three of its Open questions still
  say "resolve before implementation"** ([[D973]]). It is the store that [[D549]] skills and [[D552]]
  style both wait on, so two owner asks are blocked behind an acceptance/authority contradiction.
- **`rfc/live-sources.md`** Open question 1 → [[D958]], *"owner B5 ruling pending"* — not in the
  decision queue. **`rfc/theming.md`** D3 → [[D987]] (Settings intent amendment owed) and D5 →
  [[D840]] (owner felt-quality pass); its §Out of scope (`:82-87`) also declines 3D boards,
  background images, per-context themes, zen mode and hue sliders ([[D875]]) — **correctly, with
  reasons, and the owner has not seen that list either**. **`rfc/learner-rating.md`** OQ11/OQ12 →
  [[D945]]/[[D946]], both ruled 2026-08-22; **D945's owed `design/06` §5 amendment is still not
  executed**, and was already on the 2026-08-22 promised-and-dropped watchlist.

**Thirteen discharge rows across nine RFCs are blocked on an owner ruling right now**, and the
decision queue holds none of them: `bot-policy.md:794` (human-scale anchor), `:795` (roster
validation); `campaign-core.md:490` (army/prestige, the D893×D334 fork); `live-sources.md:330`
(casting), `:331` (the D412 events clause); `theming.md:602` (roster pick), `:604` (Settings
amendment), `:606` (felt quality / D840's flip); `intent-presets.md:442`; `pack-population-
provenance.md:669`; `feedback-delivery.md:2535`; `review-evidence-compiler.md:470`;
`accessible-board-input.md:364`.

**Three structural defects in how deferrals are recorded**, each of which makes an owner ask
invisible by construction:

1. **`Discharges: none` while the prose defers real work.** `assistance-controls.md:724`,
   `measurement-records.md:1444`, `graduation-clearance.md:2963`. `assistance-controls.md:147-157`
   has the *best-formed* out-of-scope table in the repo — every row names an owner — and then
   declares no discharges, so nothing tracks any of it. `pack-population-provenance.md:672-675`
   diagnoses this exact failure mode and cites [[D476]] as the precedent where an obligation *"went
   ownerless when it was filed as an open question instead."*
2. **Deferrals that name nobody at all.** `breadth-collectors.md:345-358` is a whole *"Refused and
   deferred"* section — global restriction/outpost/pawn-break/king-attack events, forced-win and
   mating-net classifiers, **player types and bot personalities** — with **zero D-ids**, closing
   with *"Open questions: none require an owner ruling."* Also void: `bot-policy.md:807-808`
   (pack-side profile references), the authorable pack vocabulary deferred *twice*
   (`tactical-collectors.md:988-991` and `semantic-collectors.md:660-662`, both conditional on *"if
   authors ever need it"*), `runtime-opening-identity.md:479-481` (out-of-book),
   `learner-rating.md:2090` (*"does the rating ever select content"*), `:2091-2095` (the human
   anchor — *"the single highest-value unrun experiment this RFC creates"*),
   `feedback-delivery.md:385-389` (the rung-0 ranking fork), `live-sources.md:56-57` (discovery UI),
   `measurement-records.md:1510-1515` ([[D161]]'s standing rule, *"has no home"*).
3. **RFCs declining to file the ledger row their own deferral requires** — a direct law-4 breach
   (*"an idea missing from the ledger is a process bug"*). `assistance-controls.md` OQ2: *"Proposed
   as a new ledger row — ids are free from D503; **no row is written by this draft**."*
   `pack-population-provenance.md:706-734`: four measured findings under the heading **"Ledger rows
   proposed, not written"**. If the row is never written, `make work-index` cannot see it, and the
   deferral is invisible to *every* instrument the repo has.

**One content-side echo worth keeping**: `graduation-clearance.md:3017-3018` quotes a pack's own
blocked graduation entry — *"the variants rule has no encoding … a root-identity field or
pack-group would make the convert…"* — so the variant gap has been surfacing from the content tier
too, in a document nobody reads for product decisions.

### 4.3 Planning-tier holds

- **[[D560]] Gate F content hold** (`planning/platform-alignment/plan.md:44-63`) — the owner's own
  ruling, ten clauses, one passing. Legitimate and owner-made. Clause 7 was **amended by claude** on
  [[D996]] because as written it could never pass; the amendment is flagged owner-vetoable in the
  file. This is the process working.
- **[[D949]]** — the stage-2 binding wave held whole at Gate F by owner ruling, **split 2026-08-23**
  by [[D1005]] on new measurement. Also working.
- **[[D953]]** — the campaign-RFC gate, owner-grounded, **owner-waived**. Working.
- **[[D649]]** — external participant studies descoped by the owner. Working.
- **O14 / R19 federation** — deferred *pending explicit post-1.0 promotion*
  (`decision-queue.md:51`, `execution-queue.md:73`, `research-sufficiency.md:44-45`). Owner-visible.
- **The gap:** `planning/platform-alignment/1.0-capability-map.md` enumerates **21 capability
  families** as the 1.0 surface. It contains **no row for variants, no row for time controls, no row
  for famous-game provenance, and no row for the daily position** — the words do not appear in the
  file. Four standing owner asks are not scoped *out* of 1.0; they are **not in the scoping document
  at all**, which is a strictly worse state because it produces no decision to disagree with.

### 4.4 Research-tier refusals

| Verdict | Where | Touches which owner ask |
|---|---|---|
| **C14** — *"Variants are a named, published refusal, not an omission"* | `design/research/fun-mechanics-outside-roguelikes.md:128`, `:975`, `:1127` | **D327/D328/D870/D873.** A code refusal nobody ruled on was **promoted into a research constraint** and then cited back as an argument against the thing. This is the clearest single instance of the mechanism in the repo |
| Semantic retrieval **refused for 1.0** (exact+FTS 97.7% vs 94.7% recall@5) | `theory-drill/o5-o6-handoff.md:38`, [[D564]] | D557/D581 — measured, honest, and O5 still awaits the owner |
| Archetypes / GM-twin / "tactical, positional, aggressive" labels **refused for 1.0** | `design/research/player-style-metrics.md:182-190` | **D552.** The owner asked for *"maps your opening style to (aggressive-solid, theoretical-creative) and maps it to the greats"*. Research refused precisely that on evidence. **The refusal is well-grounded and the owner has never been shown it.** |
| [[D815]] salience-shaped bot-error inference **measured and refused for 1.0** 2026-08-23 | `design/research/human-like-opponents.md:530` | D811 |
| Five-to-nine-rung band interpolation **refused for 1.0** | `design/research/maia-production-band-roster.md:28` | D551/D810 |
| No native public pool / human tournament / federation in 1.0 | `social-play/o12-handoff.md:19-21`, `:33` | O12, unruled |

---

## 5. The positive control — [[D437]]

On 2026-08-16 the owner said: *"add leaderboards and cross-learner comparison… maybe local chess
clubs want to use us at some point? **add it properly, re-evaluate the refusal and why it was there
and what it unlocks**."*

R10's refusal was reversed, the capability was designed into `rfc/learner-rating.md` §10a, and
`capabilities.ts:150` now carries the **narrowed** refusal — *"A standing spans one classroom the
learner published themselves into; there is no global table"* — which is a real product boundary
with an owner ruling behind it.

**That is the whole difference.** D437's refusal got re-evaluated because the owner happened to
name it. D327's identical-shaped refusal did not, because nobody told him it existed. The process
has no way to surface a refusal the owner has not already guessed at.

---

## 6. Method and reproducibility

Side A population: `design/BACKLOG.md` rows matching
`^\|\s*(D\d+)\s*(\S*)\s*\|` whose text matches
`OWNER|owner idea|owner ruling|owner extension|owner question|owner commission|owner breadth|owner content hold|Owner:|owner, 2026|owner-tier|owner-facing|owner-gated|owner ruling pending|owner ruling requested|OWNER-USE|OWNER IDEATION`
→ **80 rows**. The owner-decision-blocked population uses
`owner ruling pending|required|requested|owner's to veto|write|rule|owner-tier|owner-facing|owner-gated|NEEDS-OWNER|awaiting owner|put to the owner|owner question`
→ **32 rows**, joined against the D-ids present in `decision-queue.md`
(`D304 D546 D555 D560 D563 D634 D636 D648 D649 D650 D697 D703 D705 D706 D710 D868 D869 D870 D886
D887 D952`) → **6 present, 26 absent**.

Side B: `disposition: "refused"` across `apps/`, `packages/`, `workers/`, `schemas/`, deduped to
declaration sites; `Out of scope` / `Deferred` / `Discharges` / `Open questions` sections of every
active `rfc/*.md`; `not in 1.0|refused for 1.0|post-1.0|stays parked|explicitly out of scope` across
`design/` and `planning/` excluding logs and `archive/`.

Bucket assignment is **hand-made** and is the part of this file most likely to be wrong. Every
disputed row should be re-derived from its cited symbol, not from this table.

---

## 7. Why this keeps happening, and the instrument that would catch it

### 7.1 The mechanism, named

**It is not routing decay.** [[D487]] → [[D641]] → [[D948]] → [[D952]] are four consecutive audits
of one join: **ledger row → living lane**. `make work-index` now performs that join mechanically and
is wired into `make verify`. Its unit is *an idea that has no home*.

**The defect here is a different join, in the opposite direction, and it has never been audited:**

> **artifact-declared refusal → owner ruling.**

A refusal is not a ledger row. It is a *property of a different artifact* — a `reason` string in a
code table, a bullet in an RFC's Out-of-scope section, a constraint row in a research dossier. The
work index cannot see it, because a refused capability has no D-id to be unrouted. So the precise
name for the class is:

> **An unruled refusal** — a refusal or deferral asserted by an implementer in an artifact the owner
> does not read, which forecloses or contradicts a standing owner ask, carrying no ⚖️ row and no
> `decision-queue.md` entry.

It reaches the owner through **three channels, all of them implementer-facing**:

1. **Code-declared** (`capabilities.ts`, `dispositions.ts`, `position-evidence.ts` — 27 records).
   Worst of the three, because these are *machine-enforced*: the startup assertion proves every
   advertised option has *a* disposition, which makes the refusal permanent-by-default and gives it
   the authority of a test. **14 of 19 are product opinions holding a technical table's badge.**
2. **RFC scope section** (`play-composition.md:108`, `campaign-core` D2/D3/D4, `learner-modules.md:438`).
   The lifecycle already has the right shape — a discharge row naming a successor. What it lacks is
   any check that the successor was **commissioned**. `play-composition` deferred theming to a lane
   that did not exist, and the lane appeared only when the owner asked. This channel has **three
   degraded modes**, all present at HEAD: a deferral whose successor is a *planning directory*
   rather than an owner (`campaign-core.md:491`, time controls); a deferral recorded in prose while
   the RFC declares `Discharges: none` (`assistance-controls.md:724` and two others); and a deferral
   whose successor **is another deferral**, terminating in nothing — the D552 chain in §4.2. Worst
   of all is the RFC that measures a finding and then declines to file its ledger row
   (`pack-population-provenance.md:706-734`), which puts the item beyond the reach of *every*
   instrument the repo owns, `make work-index` included.
3. **Research verdict** (C14). The worst *compounding* channel: C14 read a code refusal, restated it
   as *"adopting a variant is a documented amendment, not a free addition"*, and thereafter every
   document citing C14 cited an owner decision that had never been made.

**And the fourth face of it is [[D951]], which proves the summary layer leaks in both directions.**
There, a *gate* lived in a derivation's body and was dropped from its 15-line summary, and the
drafting directive was issued from the summary. Refusals leak out of summaries the same way
obligations do. [[D1030]]'s own trigger set — theming unrouted, live-games unrouted, 143 rows with
no destination, `UCI_Chess960` — is one instance of each channel.

**So: both halves of the owner's implicit question are true, and they are one defect seen from two
ends.** Refusals are recorded where the owner never reads *and* the owner-visible surface is
inadequate — `decision-queue.md` is hand-written, and 26 of the 32 rows that name an owner decision
as their blocker are missing from it. There is no mechanism converting one into the other.

### 7.2 The instrument

**`make refusal-index` — a second derived join beside `make work-index`, wired into `make verify`.**
It is cheap precisely because the refusal population is small (27 code records + a bounded set of
RFC/dossier sections), unlike the 887-row ledger.

1. **Make every refusal machine-readable at its assertion site.** Code already is. RFCs and dossiers
   are not: require an `Out of scope` / `Refused` section to carry a fenced `tabiya-refusals` block
   — `{id, what, reason, class, ruledBy, successor}` — reusing the **already-accepted** fixed
   metadata-block convention from [[D648]](2) (`tabiya-claims` immediately before `## Summary`),
   rather than inventing a format.
2. **Add a required `class: "product" | "technical"` field to every refusal record**, starting with
   `CAPABILITY_DISPOSITIONS`. Today the class is recoverable only by reading prose, and the reading
   says 14 of 19 are product.
3. **The check that is the whole point:** *every `class: "product"` refusal must name a `ruledBy:
   D<n>` whose ledger row carries ⚖️ — or the build fails.* `UCI_Chess960` with `ruledBy: none` is
   exactly the defect, and this test prints it. Technical refusals require a citation instead
   (`capabilities.ts:142`'s two dossiers and 16,660 games are the model).
4. **Cross-join to the ask side.** For every ⚖️ row and every verbatim-owner-quote row, search the
   refusal index for a record whose subject matches, and emit `OWNER-CONTRADICTION: D<n> ×
   <file>:<line>`. This is the line that would have printed `D327 × capabilities.ts:133` on
   2026-08-16, and `D552 × position-evidence.ts:25` on 2026-08-20.
5. **Derive `decision-queue.md` instead of hand-writing it.** Every ledger row matching the
   owner-decision regex in §6 is emitted into it automatically, with its age in days. The file is
   currently 6-of-32 complete, which is exactly the hand-decay [[D492]] predicted for every
   hand-consolidated lane document — including this one.
6. **Summary-integrity guard ([[D951]]'s remedy, mechanised).** A derivation or dossier summary must
   reproduce every gate, hold and refusal asserted in its body. D951 landed this as a habit; the
   habit is one distracted fork away from failing again.
7. **Three cheap RFC-lifecycle checks that fall out of the same pass**, because they close the
   channel-2 degraded modes: (a) an RFC whose body contains an *Out of scope* / *Deferred* /
   *Refused* section may not declare `Discharges: none`; (b) every deferral must resolve to a
   **D-id, an RFC filename, or a named person** — a planning directory is not a discharge target;
   (c) an RFC that says *"proposed as a new ledger row"* must have written the row in the same
   commit, which is law 4 restated as a lint.

**Ordering:** (5) is an afternoon and closes 26 open rows' owner-visibility immediately. (2)+(3) is
the smallest change that would have caught `UCI_Chess960`, and it fits in the file that already has
the assertion harness. (1)+(4) is the complete fix. (6) rides whichever pass touches the derivation
tooling next.

### 7.3 The one-sentence version, for the log

The repo proves that every engine capability has a disposition and never proves that a product
disposition has an owner — so a product opinion typed once into a code table becomes a startup
invariant, gets promoted into a research constraint, gets cited as settled by every document
downstream, and is discovered only when the owner asks the same question a second time.
