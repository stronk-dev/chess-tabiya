# The in-run experience from the learner's side — expectation, field practice, and what we should do

**Question (owner, 2026-08-24):** *"We need to go from a user perspective per feature… what do
they expect, what do competitors do, PROPER UX."* And the diagnosis behind it: *"we have a LOT of
evidence collectors, and piss poor UX for a user to actually experience them."*

**Date:** 2026-08-24. Our-side facts derived at HEAD `2b69ee8` and re-verified unchanged at
`a76769e7` before landing (the tree is shared with concurrent agents); ledger head **D1448** at
derivation (rows proposed from D1449, none written).

**Scope:** the in-run experience — the board and everything around it while a learner is playing.
Asking for help; what a hint looks like at each distance; marks, highlights and arrows; how
evidence is surfaced without becoming a census; honest empty; and the moment immediately after a
committed move.

**Feeds:** `rfc/module-registration.md`, `rfc/evidence-presentation.md`,
`rfc/intent-presets.md` §7.1 (which explicitly defers copy voice, control shape and seating),
`rfc/hint-distance.md`, `rfc/play-composition.md` Discharge D1, the Phase-4 composition work
(`planning/evidence-foundation-ux/plan.md`), [[D1430]]/[[D1431]]/[[D1434]]/[[D1447]].

**Method:** code derivation at HEAD `[V]`; the repo's landed competitor dossiers, re-labelled
per claim `[P]` unless the source dossier itself carries `[V]` against a fetched primary source;
no product was driven hands-on this pass (see §Residuals). Labels per
`design/research/README.md`.

**Boundary with the neighbouring dossiers, so nothing is repeated:**

| Dossier | Owns |
|---|---|
| `assistance-surface-taxonomy.md` | *which affordances can exist* — the seven-axis abstraction space and its holes |
| `evidence-presentation.md` | *the module/preset contract* — the missing object between producer and screen, and its measurement of the census overlay |
| `competitor-play-ux.md` | *where things go* — screen anatomy, the seven-pattern field language, the two field invariants |
| `census-hint-false-positives.md` / `feedback-versus-the-dashboard.md` | *how often a true statement is useless* |
| **this dossier** | *what it feels like* — what a learner expects, when help appears, how they ask, and what silence means |

**Status:** desk + code-derivation. It proposes learner-facing behaviour, wording shape and
timing. It chooses no pixel, no colour and no breakpoint (those are `rfc/play-composition.md` and
`rfc/theming.md`), and it rules no default — every candidate below is owner-confirmable under the
[[D649]] validation-by-use rule, exactly as the preset labels already ship
(`validation: "candidate"`, `packages/runtime/src/presets.ts:31-38` `[V]`).

---

## Verdict

**The product has no learner-facing verbs.** Every way of asking for help in the shipped run
screen names a *producer* rather than a *question*. `[V]` The complete set of assistance button
labels in `DrillScreen.svelte` is: *Open human-model evidence inspector*, *Open corpus evidence
inspector*, *Open evidence for this position*, *Load model candidates*, *Load corpus counts*,
*Revoice this evidence*, *Position structure*, *Move transition*, *Inspector*
(`apps/web/src/lib/DrillScreen.svelte:853,857,864,959,1139,1143,1148,1156,1167`). There is **no
control anywhere in the run screen whose label is a learner's question** — no *hint*, no *what
changed*, no *why*. The single learner-shaped word on the surface is the tab label *Support*
(`:949`), and it opens the same producer list.

That is the whole complaint, stated precisely: the owner's *"piss poor UX to experience the
collectors"* is not a styling problem and not a missing-feature problem. **The collectors are
addressed by their own names, so using them requires knowing what they are.** A learner who wants
help must first learn our architecture.

Four consequences follow, and they organise this dossier:

1. **Asking for help must become one verb with a ladder underneath it** (§1). The field's two
   most-copied patterns — Chessiverse's three-level intent dial and chess.com's single *Game
   Review* verb — both exist because a learner asks one question, not nine.
2. **A hint must be vague first and specific on a second request** (§2). `rfc/hint-distance.md`
   already specifies five rungs; what is missing is that the *rung is the request*, not a
   setting the learner configured earlier.
3. **A gesture must not be a query against the census** (§3–§4). Measured: one square selection
   produces up to **11 captions, 19 marks and 9 unique squares**
   (`evidence-presentation.md` §2 `[V]`), and the rung-0 reading answers **58 observations per
   position** at the median, max 97 (`feedback-versus-the-dashboard.md` §5c `[V]`).
4. **Silence has to be legible as a choice** (§5–§6). Today the product's quiet states read as
   breakage — *"No human-model page loaded"* (`DrillScreen.svelte:1152` `[V]`) is a plumbing
   status, not an answer.

**The one recommendation that outranks the rest:** the learner should never name a source. The
learner names a *question*; the module layer names the source; the inspector is where sources are
addressable by name, and it is a place you go on purpose. This is `evidence-presentation.md`'s
module contract restated as an interaction rule, and it is the sentence every screen in §1–§6 is
derived from.

---

## 0. The measured baseline — what a learner meets today

All `[V]`, derived at HEAD.

| What the learner meets | Evidence |
|---|---|
| **0 of 11 modules registered.** `compileModuleRegistry` is exported and called only from its own test file; no `ModuleDeclaration` exists outside tests | `packages/runtime/src/module-contract.ts:190`, `module-contract.test.ts:64-96`; [[D1430]] |
| **17 of 42 specified assistance affordances exist; 8 are designed components.** Presets 0/7, modules 0/11, hint rungs 0/6 | [[D1431]], `planning/codex-queue.md:1350` |
| **Nine axes × six profiles = 54 raw source controls** in settings, labelled with implementation nouns (*board lighting*, *arrows*, *passive markers*, *human move split*, *corpus counts*) | `AssistanceSettings.svelte`; `evidence-presentation.md` §1 |
| **The `arrows` control is typed, persisted, migrated, clamped and read by no renderer.** There is no `effectiveArrows` the way there is an `effectiveLighting` | `assistance-preference.ts:43-51`, `AssistanceSettings.svelte:64`, `DrillScreen.svelte:380`; [[D1447]] |
| **Square sight is pointer-only.** `onSelect` — the sole writer of `selectedSquare`, and therefore the sole path to sight — is wired only into Chessground's pointer `select` event. The accessible `role="grid"` layer dispatches `navigate`/`activate` and never calls it | `Chessboard.svelte:144,198,229-254` vs `DrillScreen.svelte:191,381,892`; [[D1447]] |
| **The opening-explorer distribution is a comma-joined string plus one paragraph per move** | `corpus-sentences.ts:9-24` |
| **A human-model distribution renders as `"Nf3 31%"` sentences** built from `moveSanFromUci` + `Math.round(mass*100)` | `DrillScreen.svelte:414-425` |
| **The only chart in the product is a row of identical `●` characters with the value in a `title` tooltip** — encoding nothing visually, and unreachable by keyboard | `CompareView.svelte:135`; [[D1434]] |
| **Honest-empty states are producer-shaped**: *"No human-model page loaded"*, *"No corpus page loaded"*, *"No rung-0 transition observations at this move"* | `DrillScreen.svelte:1140,1144,1152,1157` |
| **The delivered explanation is generic by construction**: *"Tabiya's strict outpost detector condition holds at this position"* — no square, no piece, no file | `evidence-sentences.ts:35`; `feedback-versus-the-dashboard.md` §1 |
| **131 authored feedback claims exist across 37 packs; 0 are deliverable** | `feedback-versus-the-dashboard.md` §6 |
| `DrillScreen.svelte` is **1680 lines** | `wc -l` |

**One thing already works and must be preserved, not rebuilt.** The post-commit guard is the only
place the product speaks a learner's language and offers the right two verbs: it says *"The
consequence exposed something concrete."*, prints its grounds, states *"Your played line stays
preserved."*, and offers **Play on** / **Rewind** (`DrillScreen.svelte:964-975` `[V]`). That is
the rehearsal loop rendered correctly, in one card, with the invariant stated in the copy. §6
argues it is the template for everything else, not an exception.

---

## 1. Asking for help, and the ladder of what you get

### What the user expects

A learner who is stuck has exactly one thought, and it is not *"I would like to query the
human-model producer."* It is **"help me"** — and the second thought, immediately after, is
**"but not too much."** Every chess player has felt the specific regret of clicking a hint that
gave away the move; that regret is why "hint" affordances everywhere are hedged, staged or
apologised for.

So the expectation has three parts, in this order:

1. **One door.** A learner expects a single, obvious, always-present way to ask, in the same
   place every time. They do not expect to choose a *source* before they have asked a *question*.
2. **The least first.** They expect the first thing they get to be smaller than the answer, and
   they expect asking again to be how you get more. A hint that lands at full strength on the
   first click is experienced as having been *spent*, not used.
3. **To know what it cost them.** A learner who accepts help wants to know whether the attempt
   still counts. This is the part every product handles worst and the part that matters most in a
   product whose unit is a preserved attempt.

And there is a fourth expectation that is entirely ours to meet: **when the product is quiet, the
learner expects to know whether that is a choice or a failure.** Silence with no explanation is
indistinguishable from a broken feature — which is exactly the state §0 measures.

### What competitors do

| Product | Behaviour | Label |
|---|---|---|
| **Chessiverse** | Guided Play is a three-level **intent dial** — *Full Help* (every legal move colour-graded on the squares, eval bar visible), *Peek* (grades hidden until you hold a piece), *Hint Only* (clean board until requested). Its published vocabulary is *"levels of help"*, not settings | `[V]` vendor page, [chessiverse.com/guided-play](https://chessiverse.com/guided-play), via `evidence-presentation.md` §4 and `competitor-play-ux.md` §1.4. Vendor description establishes what is *offered*, never effectiveness |
| **Chessiverse** | A hint ladder whose **rungs change meaning when authored theory covers the position**: without theory it is *threat → direction → piece → move*; with theory it becomes *book-move count → piece → common move → exact move* | `[V]` [chessiverse.com/guided-play](https://chessiverse.com/guided-play), via `competitor-love-hate-sweep.md` §1. Load-bearing for §2, and **only `[P]` as to how it feels** — nobody in this repo has driven it |
| **Chess.com** | One verb — **Game Review** — and on a bad move **Retry** lets the learner attempt the position *before* *Show Moves* reveals an engine continuation | `[V]` [chess.com/terms/game-review](https://www.chess.com/terms/game-review) via `evidence-presentation.md` §4 |
| **Lichess** | *"Learn from your mistakes"*: *"Instead of telling you right away what you should have played, this feature gives you a chance to rethink the position by yourself"* — shows the bad move in red and asks for another try before revealing anything | `[V]` fetched [lichess blog](https://lichess.org/@/lichess/blog/learn-from-your-mistakes/WFvLpiQA) via `competitor-play-ux.md` §1.1 |
| **Noctie** | Takeback and hint are offered as a **single paired affordance** — the two are one gesture | `[V]` [noctie.ai](https://noctie.ai/) via `competitor-play-ux.md` §1.4 |
| **Dr. Wolf** | *"Are you certain?"* blunder-guard retracts the move **before** the consequence — and it is the **most-loved thing in the product**: *"It was just like my grandfather 'you suuuuure want to make that move?'"* | mechanism `[V]` popsci via `teardown-drwolf-desk.md` §2; the review `[V]` App Store (5★). It inverts commit-before-learning, so it is a named refusal — but the affection is real evidence and §6 answers it |
| **Chess.com** | Retry is **repeatable with escalating guidance** — *"the engine can guide you forward, until all is revealed"* | `[V]` launch blog via `teardown-chesscom-platform-desk.md` §2 |
| **Chess.com** | Retry is also **disliked as a genre error** — users want it in Puzzles, and the moderator's remedy is a toggle to hide it, not a play-out | `[P]` chess.com forum via `teardown-chesscom-platform-desk.md` §2 |
| **Nibbler** | Always-on ranked candidate arrows, constantly displayed | `[V]` [README](https://raw.githubusercontent.com/rooklift/nibbler/master/README.md) via `competitor-play-ux.md` §1.5 — *"every number is an answer, so nothing is left to practice"* |

**The field consensus, stated plainly:** *help is a named intent with a level, and the level is
requested, not configured.* Two of the three most-copied surfaces (Chessiverse's dial,
chess.com's one verb) exist specifically to stop the learner from choosing machinery. **Where
this is only `[P]`:** **no product in this repo's corpus has ever been driven hands-on.**
`competitor-play-ux.md` §Method states the ceiling itself — *"the strongest label here is
`[V]`-fetched-primary-source, not `[V]`-hands-on"* — and every teardown repeats it (*"no account,
no hands-on"*, *"Product NOT run"*). So every `[V]` above means *we read the vendor's page or the
product's source*, never *we used it*. The pages establish that these ladders are **offered**;
they do not establish that they feel good, that learners find them, or that Chessiverse's four
steps are the right four. **No conclusion below rests on a competitor's step count.**

**Two further labelling hazards, carried forward so they are not laundered:** the `competitor-play-ux.md`
§1 anatomy table gives one label per *row*, not per cell, so a specific cell should be read at
`[P]` unless §1.1–§1.5 carries a finer label; and `competitor-matrix.csv` lines 2–29 carry a prose
confidence word (*High*, *Medium*) rather than a `[V]/[P]/[M]` label at all — which covers the
Noctie, Chessiverse, Chessable and Aimchess rows. Treat those as `[P]`.

### What we should do, and why it differs

**Recommendation 1.1 — one door, labelled with the learner's question, present at all times.**
The run screen gets a single persistent help affordance whose label is a question, not a
producer. It is the only assistance control in ordinary view; the nine raw switches stay in
Advanced, where `rfc/intent-presets.md` §7.1 already puts them. This is not a rename of the
existing buttons — **the existing buttons are deleted from ordinary view**, because nine doors
to nine producers is the defect, and nine doors with nicer labels is the same defect
(the [[D1431]] warning: *"restyling the raw dumps without the module layer reproduces the same
surface in nicer type"*).

**Recommendation 1.2 — the door opens onto the rail's request rows, never onto a source list.**
`rfc/module-registration.md` §2.6 already rules the queue protocol: one expanded seat, the rest
collapsed badged rows, and *"`on_request` seats carry no count before a request — the row is the
door, never a claim of pending facts."* The user-facing consequence that RFC does not state:
**the collapsed rows must be phrased as questions, because they are what the learner reads when
they ask for help.** The module registry already carries the right sentences — its `intent`
column is written in the first person (*"What is arithmetically true about the square I selected,
right now?"*, *"I am stuck — reveal the least that will unstick me."*). **The intent sentence, not
the module id, is the row label.** That is a one-line binding and it converts the entire rail
from a producer census into a list of questions.

**Recommendation 1.3 — asking is a run event, and the learner is told so before they ask, not
after.** Our differentiator is the preserved attempt; the corollary is that accepting help is
part of the attempt's history. `rfc/module-registration.md` Discharge D5 already notes that
*which hint stage a learner asked for is not recomputable* and needs a durable record. The
user-facing half: **the door states the cost in the same breath as the offer.** The shipped
disclosure copy already does this correctly and is the template — *"Recorded on the run as a
disclosure, and it closes again on your next committed move"* (`DrillScreen.svelte:962` `[V]`).
Every rung of the help ladder gets one such sentence, and the sentence is visible **before** the
click, not as a receipt after it.

**Recommendation 1.4 — silence gets a standing sentence, and it is the preset's promise.**
`rfc/intent-presets.md` reserves a disclosure footer that renders `presetDeclaration(preset).promise`
— *"Legal interaction stays visible; no chess guidance appears unless you ask."* The user-facing
argument for making that footer **mandatory and always-visible rather than a detail**: without it,
Quiet is indistinguishable from broken, and §0 shows we are currently shipping the broken-looking
half. The footer is the single cheapest fix in this dossier and it is already built out of
shipped values (`presets.ts:31-38` `[V]`).

**Where we differ from the field, deliberately:** Chessiverse's *Full Help* and *Peek* both grade
legal moves **before** commitment. We refuse both — not because the render is wrong but because
the timing is (`design/05` invariant 1; `evidence-presentation.md` §4 reaches the same
conclusion). What we take is the **naming**: three or five learner intents with promises, which
is exactly what `PRESET_DECLARATIONS` already is. What we add that the field has no equivalent
of is **the standing statement of what is being withheld** — `competitor-play-ux.md` §4 calls the
canvas's silence disclosure *"genuinely novel"*, and it is novel because no competitor has an
invariant that requires it.

### Cost and dependencies

| Item | Cost | Depends on |
|---|---|---|
| One door + intent-sentence row labels | Small — the sentences exist in `rfc/module-registration.md` §1.4; the binding is `label = declaration.intent` | Module registration landing (Discharge D1) |
| Preset pill + disclosure footer | Small — every value is shipped (`presets.ts`); `rfc/intent-presets.md` §7.1 enumerates the eight reads | Nothing. **This is unblocked today** and is the one recommendation with no upstream |
| Deleting the nine producer buttons from ordinary view | Small, but it is a **deletion**, so it needs the rail to exist first | Module seats |
| Disclosure-cost sentence per rung | Small | Durable module-delivery records (module-registration D5) for the *record*; the *sentence* needs nothing |

---

## 2. What a hint looks like at each distance

### What the user expects

A learner expects a hint to be **vague first**, and they expect vagueness to be *informative*
rather than coy. There is a real difference between "I won't tell you" and "there is a fork in
this line" — the first is a locked door, the second is a smaller answer. Products that get this
wrong offer a single **Hint** button that reveals the move, and learners then avoid it entirely,
which is the worst outcome: the affordance exists, costs engineering, and is unused because using
it feels like cheating.

The learner also expects the ladder to be **cumulative**. If step 2 names a piece, they expect
step 1's square to still be on screen. A ladder that swaps one clue for another does not feel
like getting closer; it feels like the product changing its mind.

And — the expectation nobody designs for — **they expect the hint to exist.** When you press a
help button and get nothing, the product has not been honest, it has been broken, unless it says
which of the two it is.

### What competitors do

- **Chessiverse's ladder is the closest field analogue to ours, and its most useful property is
  not the step count — it is that the steps mean different things when theory is present**
  (`competitor-love-hate-sweep.md` §1 `[V]` vendor page). Off-book it is threat → direction →
  piece → move; on-book it is book-move count → piece → common move → exact move. That is
  independent arrival at `rfc/hint-distance.md`'s *"one ladder serves both grounds"*, and it is
  the strongest external support any part of our hint design has. **It is also the single most
  load-bearing `[P]` in this dossier as to *feel*:** we know the steps are advertised; we do not
  know what a step looks like on screen, whether they are cumulative, or how often the ladder has
  nothing to say.
- **Lichess withholds the answer and asks for another try first** `[V]` (blog, above). The
  pedagogy is ours: the reveal is the *last* resort, not the product.
- **Chess.com's Retry-before-Show-Moves** `[V]` ([chess.com/terms/game-review](https://www.chess.com/terms/game-review))
  is the same shape at a coarser grain — two rungs, and the first rung is *play it again*.
- **Chess.com's Retry escalates until it gives up the answer** — *"the engine can guide you
  forward, until all is revealed"* `[V]` (launch blog via `teardown-chesscom-platform-desk.md`
  §2). A ladder with a guaranteed terminal reveal is a different promise from ours, and the
  difference is that theirs always has an answer to reach because it is a PV.
- **No dossier in this corpus records a competitor telling a learner *"we have nothing for this
  position."*** That is an absence in *our search*, not proof the field lacks it — and
  `competitor-love-hate-sweep.md` §Method rules exactly this distinction for its own 20
  `not_found` cells: *"`not_found` means the targeted query yielded no feature-specific
  independent evidence; it does not mean nobody loves or hates the product."* Same discipline
  applies here. Recorded as unsearched, not as a field gap.

### What we should do, and why it differs

`rfc/hint-distance.md` §"The ladder, whole" already specifies five cumulative rungs — `pattern`
→ `square` → `piece` → `distance` → `move` — and rules them *"cumulative, never substitutive."*
That is the mechanism, and it is right. **Three user-facing things it does not decide, which are
this dossier's:**

**Recommendation 2.1 — the rung is the request, not a setting.** `hintDistance` is specified as
an `AssistanceConfig` field (`rfc/hint-distance.md` §"tenth field"), which makes vagueness
something a learner *configured earlier*. From the learner's side that is wrong twice: it asks
them to predict how stuck they will be, and it makes the second press of the same button do the
same thing. **The rung should advance on each request within a decision, resetting at the next
commitment**, with the config field acting as a *ceiling* on how far the ladder may climb — not
as the position it starts at. This is the same shape as `guided_hint`'s already-declared staged
timing (`on_request, staged`, `2 facts/stage`), extended one level down into the rungs. It also
makes the config field do the job `rfc/enforced-clocks.md` criterion 13 actually needs — a
ceiling per context — rather than a starting point.

**Recommendation 2.2 — each rung states what the next one would add, before you ask for it.**
The single biggest source of hint regret is not knowing what the next click costs. Because the
ladder is cumulative and typed, the product knows exactly what rung *n+1* adds — a square, an
actor, a ply count, a move. So the request control is labelled with the *increment*, not with
"more": *"Name the piece"*, then *"Say how far away"*, then *"Show the move"*. The learner is
never surprised by a reveal, which is what makes the last rung usable instead of avoided.

**Recommendation 2.3 — honest empty is the headline case for hints, not the edge case, and the
design must be built around it.** This is the finding that most changes the specification:
`rfc/hint-distance.md` was **returned to research** on 2026-08-23 ([[D1377]]/[[D1376]],
`planning/rfc-drafting-queue.md:1247-1262` `[V]`) precisely because *"the selector's refusal
table decides whether this feature is useful or usually empty"*, and because the reach figures
came from a harness whose event set *"shares exactly two members with the seven families the RFC
proposes; four of the seven are not emitted… at all."* Add the independently measured **89.0%
false-positive rate** of a census-only hint (`census-hint-false-positives.md` §1 `[V]`), and the
honest reading is: **a learner will press the hint button and get nothing, often.**

The UX consequence is not a warning label. It is that `guided_hint`'s declared
`emptyBehavior: unavailable_source` — *"No engine, tablebase or authored ground covers this
position."* (`rfc/module-registration.md` §5.2) — is a sentence a learner may see on a large
share of presses, and a sentence seen that often must **do something**. It should carry the run's
next legitimate action rather than terminating: the same two verbs the post-commit guard already
uses. *Nothing covers this position — play it and see, or rewind to the last moment something
did.* That converts our worst-frequency state into the product's core loop, which is the one
move available to us that the field cannot copy, because they have no preserved attempt to
return to.

**Recommendation 2.4 — rung 0 (`pattern`) should be the default first press, and it should be
generous.** It is the only rung that reveals nothing about *this* position's evaluation — it
names a family — so it sits inside `design/05` §3b's permitted column (*naming a pattern*, not
*evaluating this position*). It is also the rung most likely to have something to say. Starting
there costs the learner nothing and is the rung with the best honest-empty odds.

### Cost and dependencies

| Item | Cost | Depends on |
|---|---|---|
| Rung-as-request (2.1) | Small mechanism change, **but it reopens `rfc/hint-distance.md` §"tenth field"** — the field's *semantics* change from position to ceiling | hint-distance's return-to-research redraft; `rfc/intent-presets.md` Discharge D4 |
| Increment-labelled request control (2.2) | Small — the rung table already types what each adds | hint-distance |
| Empty-with-actions (2.3) | Small, and **independently valuable**: the same two-verb pattern serves §5 and §6 | Nothing beyond the seat |
| Pattern-first default (2.4) | None — it is a default choice | hint-distance's family table, which is exactly what [[D1376]] sent back to measurement |

**Dependency note that must not be buried:** every recommendation in this section is downstream
of a feature whose *reach is unmeasured*. [[D1376]] is not a paperwork blocker; it is the
question of whether pressing Hint usually produces a hint. **No hint UI should be built before
that harness reports, and the harness should report reach per rung, not just per family** — a
ladder whose rungs 3 and 4 are usually empty is a different product from one whose rung 0 is.

---

## 3. Marks, highlights and arrows

### What the user expects

Every chess site on earth has trained the same four reflexes, and a learner arrives with all of
them already installed:

1. **Click or touch a piece → its legal moves light up.** This is so universal it is not
   experienced as a feature; its absence is experienced as a bug.
2. **Right-drag → I draw my own arrow, and it is mine.** Nobody expects the product to have an
   opinion about a mark they drew. They expect it to persist while they think and vanish when
   they move.
3. **The last move stays highlighted.** Learners use it constantly to re-orient after looking
   away, and they notice instantly when it is missing.
4. **A coloured square or arrow the product drew means the product is telling me something** —
   and the learner will read it as advice whether or not it is.

Reflex 4 is the dangerous one, and it is the reason form is not neutral in practice even though
`design/05` §3-forms rules it neutral in principle. A learner does not parse provenance. **An
arrow from a square to a square is read as "play this"**, regardless of the sentence next to it.
That is a claim about human reading, not about our architecture, and it is where the honest
answer diverges from the elegant one.

### What competitors do

| Behaviour | Product | Label |
|---|---|---|
| Feedback painted into the board's own pixels is **the field's at-commit channel** — zero layout cost | chess.com destination-square classification badges (a *"Show Move Classification On Board"* setting); Noctie's 7-colour commit grade; Chessiverse's graded squares | `[V]` per `competitor-play-ux.md` §2 pattern 3, each from its cited vendor page |
| **More than about one semantic layer at a time turns the board into a diagram** | Nibbler, as the demonstrated failure mode | `[V]` README via `competitor-play-ux.md` §1.5; the *interpretation* is that dossier's `[P]` synthesis |
| Visual explanation is **bound to a sentence, not an independent feed**: hovering or clicking highlighted words in a coach explanation draws the corresponding arrows and squares | chess.com Game Review v2 | `[V]` [chess.com news](https://www.chess.com/news/view/chesscom-launches-game-review-v2?page=2) via `evidence-presentation.md` §4 |
| Hover-preview a line on the board **without changing the analysed position** | Nibbler | `[V]` README via `competitor-play-ux.md` §1.5 — named there as its one stealable interaction |
| Hover/focus content must be **dismissible, hoverable and persistent**, and hover-triggered content should also be available on keyboard focus; path/multipoint gestures need a non-path single-pointer alternative; targets ≥24×24 CSS px | W3C | `[V]` [WCAG 2.2](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html) via `evidence-presentation.md` §6 |

**The single most transferable finding in the competitor corpus** is chess.com's binding:
*a visual form is an alternate rendering of one admitted sentence, not a second unbounded query*
(`evidence-presentation.md` §4, which labels the binding itself `[V]` and the inference `[M]`).
Our measured failure is exactly its negation — one gesture, eleven captions, nineteen marks.

### What we should do, and why it differs

**Recommendation 3.1 — one gesture, one fact, both directions.** `rfc/evidence-presentation.md`'s
`square_set` component already types this: squares of *exactly one* admitted fact, with
bidirectional caption↔square binding, both keyboard reachable, and it *"never merges facts into
one overlay."* The user-facing rule that makes it felt rather than merely correct: **selecting a
square must produce at most one lit set at a time, and the caption that owns it must be visibly
the thing that owns it.** If four facts match, that is four rows in the seat and the learner
steps between them — it is never four overlays at once. This is the direct repair of the
11/19/9 measurement, and it is a *selection* change, not a styling change.

**Recommendation 3.2 — keyboard square selection must produce the same packet as pointer, and
this should ship ahead of everything else in this dossier.** [[D1447]] records it: square sight
is unreachable by keyboard **inside the surface built for accessibility**. `rfc/module-registration.md`
criterion A11 already requires parity. The user-perspective argument for sequencing it first is
that it is the only item here that is a **defect rather than a design choice** — it needs no
ruling, no preset, no module, and no owner decision. It is one call to `onSelect` from the grid's
`activate` path.

**Recommendation 3.3 — the learner's own marks should be turned on, and they are not assistance.**
`design/05` §3-forms already rules this: *"a mark you draw yourself is your own thought; the
product asserts nothing, so no rung and no disclosure gate applies."* Shipped state is
`drawable: { enabled: false }`. From the learner's side this is the most conspicuous missing
reflex in the product — reflex 2 above — and it is free of every honesty question in this repo.
It also does real work for us: a learner who can mark the square they are worried about is
rehearsing *seeing*, which is what `design/05` §3 says rung 0 exists to teach, without the
product doing the seeing for them.

**Recommendation 3.4 — system-drawn arrows: retire the control, do not activate it, and say so
on the surface.** This is the open owner question (`rfc/module-registration.md` OQ2, [[D1429]],
[[D1447]]). The user-perspective evidence points one way:

- **No module declares the `arrow` form.** All eleven declare `sentence`/`square`/`card`/
  `timeline_mark`/`panel` only (`rfc/module-registration.md` §1.4 forms table), so the seven
  non-zero `maxArrows` budgets have nothing to spend.
- **The structural reader emits square *sets*, not vectors** (`design/05` §3-forms), so there is
  no producer.
- **Reflex 4 is the reason to be slow here.** The one form a learner reliably misreads as advice
  is the one form we have no producer for and no module asking for. The cheap, honest option is
  therefore not to build it.

What the surface should do meanwhile is what `rfc/module-registration.md` already specifies —
render the control disabled through `HonestControl.svelte` with the visible reason *"No
system-drawn arrow producer exists yet."* **That is the pattern this whole dossier is arguing
for, applied to itself:** a control that cannot do anything says why, in place, rather than
silently doing nothing. `HonestControl` is shipped and unused for this
(`apps/web/src/lib/HonestControl.svelte` `[V]`).

**Recommendation 3.5 — the one arrow that is not a verdict is the learner's own, and the second
is a host's.** `design/05` §3-forms splits marks three ways and only form (c) is ladder-governed.
Forms (a) and (b) are shipped-capable — `live-marks.ts` is the only code that can emit an arrow
`dest`, host-relayed ([[D1447]] `[V]`). **The user-facing consequence: relayed marks must carry
visible attribution at all times, not on hover.** A teaching arrow that looks like a product
arrow is the single worst outcome available in this design space, because it launders a person's
opinion as arithmetic.

### Cost and dependencies

| Item | Cost | Depends on |
|---|---|---|
| Keyboard sight parity (3.2) | **Smallest item in this dossier** — one dispatch path | Nothing. Ship first |
| One-gesture-one-fact (3.1) | Medium — it is the selection layer, not the render | `square_set` component + module seats + semantic eligibility (F5) |
| Learner-drawn marks (3.3) | Small — `drawable` is a Chessground flag; persistence is a view preference | Nothing honesty-wise; needs a decision on whether marks persist across a rewind |
| Retire `arrows` with a stated reason (3.4) | Small | **Owner decision** — [[D1429]] activate-or-retire is unasked |
| Attributed relayed marks (3.5) | Small | Live surface's admission rule |

---

## 4. Surfacing evidence without becoming a census

### What the user expects

A learner looking at evidence expects three things that our current surface gives them none of:

1. **To see the shape before the numbers.** *"Most people play e4 here, and it wins slightly more
   often"* is understood in one glance from a bar. The same content as
   `"e4 — 210 of 4210 games (5.0%). White wins 48.2%, draw…"` is a paragraph to be parsed. The
   expectation is set by literally every other chess site: the explorer is a **table with bars**.
2. **To know what population they are looking at**, without going and finding out. Learners are
   sensitive to this — the difference between "masters play this" and "1200s play this" is the
   whole meaning of the number.
3. **To not be told things they did not ask about.** This is the census complaint in learner
   words. A learner who selects d5 to ask *"is this square safe"* does not want eight
   line-blocker observations.

### What competitors do

- **The explorer-as-table-with-bars is the field default.** Our comma-joined string is a
  deviation, not a simplification `[V]` ([[D1434]], which states it as *"a table with W/D/L bars
  on every other chess site"*).
- **Raw internals appear in exactly two field locations**: dedicated inspectors (Nibbler) and
  behind analysis tabs (En Croissant). *"Play surfaces are SAN + human words everywhere — even
  chess.com's grades are named judgments with icons, and corpus percentages live in the
  *analysis* explorer, not the play screen"* `[V]` per-product, `[P]` as synthesis
  (`competitor-play-ux.md` §3).
- **En Croissant's own users independently demand eval-bar hiding** `[V]` (github issues, via
  `quickpass-wintrChess-encroissant-chessmonitor.md`) — which is field evidence *for* our
  anti-contamination default rather than against it.
- **Chessigma's restraint axis:** *"a reviewer that stamps brilliant on ordinary moves is handing
  out confetti, not information"* — measured as over-calls per 1,000 ordinary moves `[V]`
  (`teardown-chessigma-desk.md`, from its public detector benchmark). Named there as the best
  idea to steal, and it is the right frame for density generally.
- **Alert-fatigue transfer evidence `[P]`:** acceptance falls as repeated low-information
  reminders per encounter increase ([Ancker et al., 2017](https://pmc.ncbi.nlm.nih.gov/articles/PMC5387195/),
  via `evidence-presentation.md` §5). It is an analogy from clinical decision support, not a
  chess result, and it justifies treating **volume and repetition as test variables**, nothing
  stronger.

### What we should do, and why it differs

`rfc/evidence-presentation.md` supplies twelve components; the user-facing questions it leaves
open are which ones a learner meets, when, and in what order. Answers:

**Recommendation 4.1 — the shape carries the meaning; the number is the detail.** Three of the
twelve components (`distribution`, `outcome_split`, `magnitude_trail`) exist because a proportion
is understood pre-verbally and a paragraph is not. **`magnitude_trail` is the one the product
does not have at all** and it is the component that answers the learner's most natural
retrospective question — *where did it turn?* — which `design/05` §3a rules is exactly what
backward-looking eval swing is honest for. Building it is not decoration; it is the render of a
detector the design tier already licensed and the product currently expresses as a row of
identical bullets.

**Recommendation 4.2 — the population line is part of the component, never a caption.**
`rfc/evidence-presentation.md` §5 already rules that `Convention` renders *inside* the
component's bounding box and may not be a sibling, a heading, a `title`, or a caption a
breakpoint can drop. From the learner's side this is the difference between a number that means
something and a number that means nothing, and it is the single rule that keeps a distribution
from becoming the anti-pattern's `"Maia: 31%"`. **Our shipped `CORPUS_GUARD` — *"These counts say
what this population played, not what is good."* — is the right sentence and must survive**
(`corpus-sentences.ts:3` `[V]`; kept-verbatim in `rfc/module-registration.md` A12).

**Recommendation 4.3 — answer the question asked, and state what you did not show.** The
measured problem is not that the overlay is busy; it is that *"a gesture is currently a query
against the producer census"* (`evidence-presentation.md` §2 `[V]`). The learner-side repair is
a budget the learner can *see*: `count_with_denominator` renders *"top 5 of 23 recorded moves"*
rather than silently truncating. A stated cap is trustworthy; a silent one is not, and a learner
who suspects truncation will go looking for the raw view — which is how a play screen turns back
into an inspector.

**Recommendation 4.4 — unused budget stays empty, and this must be visible as calm rather than
as absence.** Both RFCs rule it (`rfc/module-registration.md` §"budgets", `rfc/evidence-presentation.md`
rule 4d). The user-facing addition: **the seat should not resize as facts come and go.** A rail
that grows and shrinks each ply reads as instability and pulls attention off the board every
time. Fixed seat, rotating content — which is `competitor-play-ux.md` §2 pattern 4 (the companion
voice card), the field's answer to message-stacking, observed in chess.com's coach and Noctie's
bubble `[V]`.

**Recommendation 4.5 — answer `rfc/evidence-presentation.md`'s open questions from the learner's
side.** Four of its five are UX questions with defensible answers:

| Open question | Answer, and why |
|---|---|
| Does `distribution` ever draw on the board? | **No.** A ranking rendered as a gradient over destination squares is read as advice (reflex 4, §3) and it is the exact shape of Chessiverse's *Full Help*, which we refuse on timing. Agrees with that RFC's own recommendation |
| `outcome_split` perspective | **`side_to_move` with colour names always visible.** A learner reads a bar as "how am I doing"; anchoring to White silently inverts it for half of all positions. The colour name is what keeps the default from being a hidden assumption |
| Is `claim`'s counter-case always shown? | **Always for `author_declared`, on request for `ledger_bound`.** The weaker the binding, the louder the caveat — and it is the only lever we have where an author can simply be wrong (`design/05` §3 rung 5, no review workflow) |
| Does `full_inspector` use components or a raw view? | **Components at widest budgets, plus a per-fact provenance drawer** — but the raw view must remain reachable inside it. Deleting expert analysis in the name of simplicity is a named refusal (`evidence-presentation.md` §8.4) and the inspector is where our own debugging lives |

**And the one it cannot answer, which this dossier escalates rather than resolves:** its
Discharge D9 — *no arm of that RFC establishes that a learner understands a bar.* That is real,
it is unowned, and it is not answerable from a desk. It belongs to the preregistered participant
arm at `planning/platform-alignment/evidence-presentation/participant-plan.md`, and until it
runs, every component choice above is a candidate.

### Cost and dependencies

| Item | Cost | Depends on |
|---|---|---|
| `distribution` / `outcome_split` replacing the string renders | Medium — two components, inline SVG/CSS only | `rfc/evidence-presentation.md` landing |
| `magnitude_trail` | Medium-high — the only genuinely new visual primitive | Same, plus a stated vertical extent convention |
| Convention-inside-the-box | Small | Same |
| Stated caps | Small | `count_with_denominator` |
| Fixed seat, rotating content | Small | Module seats + `play-composition` geometry |

---

## 5. Honest empty — what silence means

### What the user expects

A learner who asks a question and gets nothing back forms one of three beliefs, and the product
chooses which:

1. *"It's broken."* — the default belief when nothing is said, and the one we currently earn.
2. *"It refuses to tell me."* — the belief when the product is quiet but obviously working. This
   is worse than broken in one specific way: it teaches the learner that the interface is coy,
   which `design/05` §3 names as the thing rung 0 exists not to be.
3. *"There is genuinely nothing here, and that is information."* — the only belief worth having,
   and it requires the product to say two things: *what* it looked for, and *what it did instead*.

The expectation nobody states but everybody has: **an empty answer should not look like a hole.**
A dimmed panel, a blank card, a spinner that never resolves — all three read as failure. An empty
answer that occupies its normal space and says a normal-sized sentence reads as an answer.

### What competitors do

- **Lichess's zen and chess.com's Zen Mode are the field's only first-class quiet states**, and
  both are one action from the board — lichess bound to `z` with three pref states (*No* / *Yes*
  / *In-game only*) `[V]` primary source (`_zen.scss`, `Pref.scala`); chess.com's `[P]` blog.
  Note what they are: **hiding chrome the learner already knows exists**, not explaining an
  absence of evidence. The field has a quiet *mode*; it does not have an honest *empty*.
- **Chessable's `unknown` is the closest analogue and it is instructive**: a sound but off-book
  deviation is *"acknowledged, not punished — but you are bounced back… Alternatives are
  recognized, not taught"* `[V]` (support 9043806 via `teardown-chessable-desk.md` §Q2). The
  product distinguishes *wrong* from *unwritten* — and then does nothing with the distinction.
- **Chessable's Overstudy is a deliberate no-op state**: reviewing a non-due move correctly means
  *"nothing changes, the spaced period remains as it is"*, and it earns no XP `[V]` (support
  9043591). A designed *nothing happened*, labelled.
- **Chessbook's users complain about the absence of an absence**: *"It would be nice to see how
  many times I made a particular mistake"* `[V]` (64squares via `teardown-chessbook-desk.md` §6).
- **Chessable's own docs carry an article titled *"I constantly have too many moves to review.
  Can I adjust this?"*** `[V]` — the incumbent's density debt admitted in its own support
  channel.

**Where this is `[P]` and matters:** we have no observation of how any competitor renders a
genuinely empty evidence state, because none of these products has been driven. Our design here
is therefore not transferred from the field; it is derived from our own invariant.

### What we should do, and why it differs

**We are the only product in this corpus with an invariant that *requires* an honest empty** —
`design/05`'s *"Absence is stated, never simulated"*. That makes empty a feature we own rather
than a case we handle, and both new RFCs already encode it: `rfc/evidence-presentation.md` makes
`abstention` a first-class component that *"every other component delegates to"*, and
`rfc/module-registration.md` §5.2 declares a verbatim sentence per module. **The wording is
therefore settled and this dossier does not re-author it.** Four user-facing rules it does add:

**Recommendation 5.1 — three empties are three different sentences, and the learner must be able
to tell them apart without knowing our architecture.** The distinction the RFCs type as
`silent` / `stated_absence` / `unavailable_source` is, in learner terms:

| What happened | What the learner needs to understand | Shipped-vocabulary example |
|---|---|---|
| Nothing to say, and that is normal | *"most moves deserve silence"* — no row at all | `postcommit_nudge`'s `silent` |
| We looked and there is nothing | *nothing is written / nothing matches* — a normal card | *"Nothing is written about this position."* |
| We could not look | *a source is missing from this deployment* — and it names it | *"No engine, tablebase or authored ground covers this position."* |

The third is the one the product must never blur into the second, because *"we have no engine
configured"* and *"the engine found nothing"* are opposite facts and a learner who confuses them
mistrusts the product in both directions.

**Recommendation 5.2 — replace every producer-shaped empty in the shipped screen.** *"No
human-model page loaded"*, *"No corpus page loaded"*, *"No rung-0 transition observations at this
move"* (`DrillScreen.svelte:1140-1157` `[V]`) are all class-3 sentences pretending to be class-2
ones — and *"page loaded"* is a network status leaking into a chess surface. Each has a declared
replacement waiting in `rfc/module-registration.md` §5.2. This is mechanical.

**Recommendation 5.3 — an honest empty carries the next action, and in this product the next
action always exists.** This is the differentiator, and it is the recommendation most worth
arguing for. A competitor's empty hint is a dead end because their loop terminates in an answer.
Ours does not: **there is always something to do, because the run forks.** So the empty state's
job is not to apologise; it is to hand back the loop —

> *Nothing recognizes this structure.* → *Play it and see what happens.*
> *No engine, tablebase or authored ground covers this position.* → *Play it, or rewind to the
> last moment something did.*

Two verbs, the same two the post-commit guard already ships (*Play on* / *Rewind*). This is what
turns our highest-frequency failure state (§2.3: hint reach is unmeasured and the census
false-positive rate is 89.0%) into the product's thesis.

**Recommendation 5.4 — never a spinner, never a skeleton, and never a shrinking seat.**
`rfc/evidence-presentation.md` rule 4e already bans placeholders as content and renders pending
as `abstention` with reason `pending`. The user-facing addition is the one §4.4 makes: **the seat
does not resize.** An empty answer and a full answer occupy the same space, so the board never
moves and the learner never learns to watch the rail for motion.

### Cost and dependencies

| Item | Cost | Depends on |
|---|---|---|
| Replacing the producer-shaped empties (5.2) | Small, mechanical — sentences already declared | Module registration |
| Three-class distinction visible (5.1) | Small | `abstention` component |
| Empty-carries-the-loop (5.3) | Small, and it is the highest-value small item in this dossier | Nothing beyond the seat and the existing rewind action |
| Fixed-size seats (5.4) | Small | `play-composition` geometry |

---

## 6. The moment immediately after a committed move

### What the user expects

This is the moment the whole product turns on, and the learner's expectations are physical
before they are informational:

1. **The piece moves, visibly.** Not teleports. Animation is not decoration here — it is how a
   player confirms that the thing they intended is the thing that happened.
2. **The move I just made is marked**, and stays marked. Universal.
3. **Something acknowledges the commitment.** Every product in the field answers this on the
   board itself, because the board is where the learner is looking.
4. **If something is going to be said, it is said now or not at all** — and if it is said, it is
   about *the move I just made*, not about the position in general.
5. **Nothing seizes the board.** A learner mid-decision does not want a modal, and this
   expectation is asymmetric: interrupting to praise is tolerated; interrupting to warn is
   resented unless it was asked for.

### What competitors do

| Behaviour | Product | Label |
|---|---|---|
| **At-commit paint is the field's consensus channel**, because it costs zero layout | chess.com destination-square classification badges; Noctie's 7-colour commit grade; Chessiverse graded squares | per-product `[V]` vendor pages; the *pattern* reading is `[P]` synthesis (`competitor-play-ux.md` §2 declares this) |
| **Live per-move colour feedback is actively loved, and it fires at commit** — *"Real time feedback works much better for me than just end of game feedback"* | Noctie | `[V]` Product Hunt via `teardown-noctie-desk.md` §Q3 |
| Noctie lets the learner choose **which move-quality classes get board highlights**, and set it separately for games and review | Noctie | `[V]` App Store release notes |
| **The blunder guard fires *before* the move stands** — *"Are you certain?"* — and is the product's most-loved feature | Dr. Wolf | mechanism `[V]` popsci; affection `[V]` App Store 5★ |
| **The review is auto-offered the instant the game ends** — a modal with Rematch / New Game / Game Review | chess.com | `[V]` support 10328363 |
| …and **the modal's buttons shift as Game Review loads, causing misclicks** | chess.com | `[P]` forum threads |
| **Nothing during play, everything after** — no evaluation of any kind on the round screen | Lichess | `[V]` primary source + fetched `/analysis` |
| Chess.com shows no eval during live play | chess.com | **`[M]`** — model knowledge, flagged as such in the source dossier. Do not lean on it |
| Wrong move → correct move shown, sequence restarts, SRS level falls **to level 1 regardless of maturity** | Chessable | timing `[P]`; the full-reset ladder `[V]` support 9043598 |
| Animation is a **preference with four levels and a Normal default**, not a constant | Lichess | `[V]` `Pref.scala` primary source |

**The field's split verdict, stated honestly:** the two products with the most-loved moment-of-
commitment experiences do opposite things. **Noctie paints the grade at commit and users say the
live timing is why it works.** **Dr. Wolf intercepts before commit and users love it for the same
emotional reason** — someone is paying attention. Neither is evidence about learning; both are
`[V]` evidence about *affection*, and affection is what makes people return.

### What we should do, and why it differs

**Recommendation 6.1 — commit gets a bounded on-board acknowledgement, and it is the one thing
in this dossier the design tier's own reviewer has already called missing.**
`competitor-play-ux.md` §4 criticism 5 records it against the canvas draft: *"the board itself
never acknowledges the commit… commit in the draft is a purely peripheral event — the one moment
the whole product turns on."* Its §6.3 revision is the right shape and this dossier endorses it
unchanged: **a momentary destination-square acknowledgement, post-commit only, a state glyph and
never a grade of alternatives**, plus the move animation fix ([[D840]]).

Why this does not breach invariant 1: the acknowledgement is *about the move that was played*,
after it was played. Chessiverse's graded squares are refused not because they are squares but
because they grade **moves the learner has not made yet**. The distinction is timing, exactly as
`design/05` §3-forms says.

**Recommendation 6.2 — the post-commit guard is the template, and it should be generalised
rather than kept as a special case.** It is the only correct learner-facing surface we ship: one
card, a framing sentence, its grounds, the invariant stated in the copy (*"Your played line stays
preserved."*), and two verbs (*Play on* / *Rewind*). `rfc/module-registration.md` A12 already
protects those sentences verbatim. **What this dossier adds is that the shape — frame, grounds,
preservation promise, two verbs — is the shape of every post-commit delivery**, including
`postcommit_nudge` and every honest empty (§5.3). One seat, one voice, rotating content: the
field's companion-card pattern (`competitor-play-ux.md` §2 pattern 4 `[P]` synthesis), which we
have already built once and not noticed.

**Recommendation 6.3 — answer Noctie's evidence by moving the loved thing to the legal side of
the line, not by refusing it.** Learners demonstrably like *at-commit* feedback on the board
(`[V]` Product Hunt). Our invariant permits precisely that: disclosure follows commitment. So the
adoption is **the move-quality grade rendered at commit, post-commit** — which is already ruled
([[D1422]], the `2.5 / 10 / 15` win%-point ladder), already specified
(`rfc/move-quality-grades.md`), and already fenced against the anti-pattern by its own strongest
clause: *the word, the numbers, the threshold crossed and the convention version are co-rendered,
always — printing only the word launders a convention as a fact*, praise classes refused, no best
move, rating never an operand.

**That clause is what separates us from the named anti-pattern, and it is worth saying plainly
in user terms.** *"Blunder"* alone is a dashboard. *"Blunder — win chance fell 34 points, past
the 15-point rung of `grade-convention@2`, Stockfish depth 12"* is a rendered measurement with
its instrument attached, and a learner can disagree with it. **Law 8 is satisfied not by
withholding the grade but by never letting the word travel without its number.** Our current
surface satisfies law 8 by having no grade at all, which is also why it says nothing useful.

**Recommendation 6.4 — the guard may interrupt; nothing else may.** Dr. Wolf's beloved dialog is
refused on timing (it retracts before the consequence — `warn → retract → never play it` against
our `commit → play the consequence → rewind`). But the emotional content — *someone noticed* —
is available to us at commit, and our own `immediate_guard` is exactly that: the pack consented,
for this band, and it fires **after** the move. `blunder_prevention` is the one module allowed a
board-adjacent seat and it is Support-only, `position`-context-only, and forbidden from ever
emitting an all-clear. **The user-facing rule: exactly one thing may claim the learner's
attention unasked at a commitment, and it is never a grade of an alternative.**

**Recommendation 6.5 — do not build an auto-offered modal at the end of a run.** chess.com's
review funnel is the field's most complete ritual `[V]` and it is also where its worst reported
interaction lives — buttons that move while the analysis loads, causing misclicks `[P]`. The
adoption we want is *the ritual*, not *the modal*: the run's end should offer re-entry into play
from a chosen moment (which no competitor does — `teardown-chessigma-desk.md` records Bot
Challenge as the closest, *"and it re-enters and never preserves"* `[V]`), in a surface that does
not move under the cursor.

**Recommendation 6.6 — animation is a preference with a None option and a Normal default.**
Lichess ships four levels `[V]` primary source. [[D840]] records that the product currently
animates nothing. The learner-side reason this is not cosmetic: without animation, a committed
move and a rewound position are visually indistinguishable events, and the entire product is
built on the learner knowing which of the two just happened.

### Cost and dependencies

| Item | Cost | Depends on |
|---|---|---|
| On-board commit echo (6.1) | Small | [[D840]] animation fix; `play-composition` |
| Generalising the guard card shape (6.2) | Small — it exists; the work is making it the default seat rather than a branch of an `{#if}` | Module seats |
| Grade at commit with co-rendered convention (6.3) | Medium | `rfc/move-quality-grades.md` D1 **and** the [[D1445]] blocker below — the grade currently has no admissible module |
| One-interrupter rule (6.4) | Small | `blunder_prevention` registration |
| End-of-run re-entry without a moving modal (6.5) | Medium | Review Map |
| Animation preference (6.6) | Small | Theming lane |

---

## 7. The feel of making a move

Not in the original brief, and it belongs here because every section above assumes it works.

**What the user expects:** the piece goes where they aimed; a mis-drag cancels rather than
commits; touch, mouse and keyboard all reach the same result; promotion asks and is escapable.
These are invisible when right and are the entire experience when wrong.

**What competitors do:** Qchess's launch thread reports *"drag/cancel and same-square input bugs
and warns about mobile"* `[P]` (reddit, via `competitor-love-hate-sweep.md` §3) — a reminder that
this is a real failure mode in shipped products, not a solved problem. WCAG requires non-path
single-pointer alternatives for path gestures and recommends select-then-destination as the
alternative to dragging `[V]`.

**Where we stand, and it is good:** A2 measured **90/90** live click/drag/touch cells delivering
the authored UCI across all served endgames × five viewports, after repair — up from a baseline
of 4/90 exact, 15 wrong, 71 missing (`interaction-state-correctness.md` `[V]`). A permanent
browser gate repeats the proof. `rfc/module-registration.md` A12 protects the fifteen
`board-input.ts` announcement strings verbatim.

**The one gap is the one §3.2 names**: the accessible grid can navigate, activate and promote,
but cannot select a square for sight. Input equivalence is a criterion in both new RFCs; it is
currently false in the surface built for it.

---

## 8. Reconciliation — what this contradicts, and what it confirms

### 8.1 Three drafts disagree about the hint, and the disagreement is user-visible

This is the sharpest finding in the pass, and it is a `[V]` code-and-document conflict rather than
an opinion:

- `rfc/module-registration.md:359` admits **`live.stockfish.pv`** into `module.guided_hint`
  (stage-3 only), and `:262` gives that module the `principal_variation` ceiling.
- The shipped catalogue declares that projection's own limitation as ***"Explicit Analyze
  consumer only; never a guidance binding."*** (`packages/runtime/src/evidence-catalog.ts:772`
  `[V]`).
- `rfc/hint-distance.md` §4 edit 4 is precisely the repair — it removes `live.stockfish.pv@1`
  from the accepts list, drops stage 3's ceiling to a single `move`, and notes that *"the horizon
  projection cannot carry a PV, so no ceiling mistake can leak the line."*
- **But `rfc/hint-distance.md` was returned to research on 2026-08-23** ([[D1377]]/[[D1376]]),
  and `rfc/intent-presets.md` §9a consequently **refuses the tenth config field**, projecting
  nine and reserving no slot.

**In learner terms:** as the three documents currently stand, pressing *hint* a third time can
hand a learner an engine principal variation from a guidance module — the exact shape [[D317]]
calls cheating (*"cheating iff `distance === "move"` while a committing decision depends on
it"*), against the producer's own declared refusal. The repair exists and rides on a returned
document. **`DESIGN-GAP:` is not the right label — this is an RFC-tier conflict, not a design
one — but it should not land silently in either direction.** The narrow, safe move available
today is the one hint-distance already wrote: drop `guided_hint`'s stage-3 ceiling to `move` and
remove the PV from its accepts list, independently of whether the five rungs ever ship. That edit
only ever **narrows** what a guidance module may print, which is the direction a hold does not
need to block.

### 8.2 What the three RFCs already settle, and this dossier therefore does not re-author

Stated so no implementer treats this document as a competing source of copy:

| Already frozen | Where | This dossier's relation |
|---|---|---|
| The eleven module ids, seats, timings, budgets, `emptyBehavior` | `rfc/module-registration.md` §1.1 | consumes; proposes the **intent sentence as the row label** (§1.2) |
| The seven honest-empty sentences | same, §5.2 | consumes verbatim; adds that each **carries the loop** (§5.3) |
| The queue protocol — one expanded seat, collapsed badged rows, *"the row is the door, never a claim of pending facts"* | same, §2.6 | endorses; adds **fixed seat size** (§4.4, §5.4) |
| The twelve components and their empty sentences | `rfc/evidence-presentation.md` §3 | consumes; answers four of its five open questions from the learner's side (§4.5) |
| `Convention` renders inside the component's box | same, §5 | endorses as the rule that keeps a distribution from becoming the anti-pattern |
| Five preset ids, labels, promises; eight contexts; the projection and clamp tables | `rfc/intent-presets.md` §4, §4a, §3.2 | consumes; argues the **footer is mandatory, not optional** (§1.4) |
| Copy voice, control shape, seating, motion | explicitly deferred, `rfc/intent-presets.md` §7.1 | **this is the gap this dossier fills** |

### 8.3 Confirmations worth recording

- **`rfc/module-registration.md` §2.3a repairs [[D1445]] in draft.** `ModuleAnswerCeiling` at HEAD
  is `none | fact | pattern | threat | candidate_move | principal_variation` — no `evaluation`
  member, which is why the ruled move-quality grade had no admissible module
  (`module-contract.ts:12` `[V]`). The draft's eight-token monotone chain adds `evaluation` and
  gives `postcommit_nudge` that ceiling. The grade now has somewhere to live, which is the
  precondition for §6.3.
- **`design/05`'s form inventory is confirmed by the field, not contradicted.** Its
  three-way split of marks — learner-drawn, host-drawn, system-drawn — is exactly the split the
  competitor corpus needs to describe Nibbler (system), a coach's arrows (host) and every
  player's own scribbles (learner), and no surveyed product distinguishes them. Our vocabulary is
  ahead of the field here; only its wiring is behind.
- **No kill-criterion evidence was found in this pass.** The nearest thing is Noctie's loved
  live per-move colour feedback `[V]`, which reads at first glance as evidence against our
  silence default — and is not, because Noctie paints **at commit**, which our disclosure model
  permits. §6.3 routes it rather than rationalising it away.

### 8.4 Owner decisions this dossier names and does not take

Per law 5, `design/05` is intent tier and is not edited here. Five decisions:

1. **`assistance.arrows`: activate or retire.** [[D1429]], open in `rfc/module-registration.md`
   OQ2, unasked. §3.4 recommends **retire with a stated reason**, on the evidence that no module
   declares the form and no producer emits vectors. Owner's call.
2. **Is `structure_nudge` proactive or on-request?** `rfc/module-registration.md` OQ3, described
   there as *"a one-token owner decision about whether §3a's silence default bars even a passive
   marker."* §3b of `design/05` already answers the spirit — *"a passive marker the player may
   open, never a modal"* — so the learner-side recommendation is **proactive marker, on-request
   content**: the mark appears, nothing is said until opened. That is the only reading under
   which §3a's silence and §3b's *"beautifully annoying"* both hold.
3. **Which contexts may offer Support?** Candidate table says `position` only. §6.4's rule —
   exactly one unasked interrupter at a commitment — is compatible with widening it to
   `imported`, and incompatible with `pack` and `campaign`, where withholding is the point.
4. **Do the five preset labels and promises survive use?** They ship `validation: "candidate"`.
   §1.4 argues the *promise* sentence is load-bearing regardless of its wording, because it is
   what makes silence legible.
5. **Whether `guided_hint`'s stage-3 PV admission is narrowed now or waits for hint-distance's
   redraft** (§8.1). This is the only one with a correctness dimension rather than a taste one.

---

## 9. Sequencing, cost and dependency — consolidated

Ordered by dependency, not by size. Nothing is dropped; `## Recommended scope cut` is struck by
[[D1230]] and this section is a *sequence*, not a selection.

| # | Item | § | Blocked by |
|---|---|---|---|
| 1 | **Keyboard square-sight parity** | 3.2 | nothing — a defect, needs no ruling |
| 2 | **Preset pill + mandatory disclosure footer** | 1.4 | nothing — every value ships (`presets.ts`); `rfc/intent-presets.md` §7.1 lists the eight reads |
| 3 | **Learner-drawn marks on** | 3.3 | nothing honesty-wise |
| 4 | **Narrow `guided_hint`'s stage-3 admission** | 8.1 | an RFC edit that only narrows |
| 5 | **Move animation with a None option** | 6.6 | theming lane |
| 6 | Module registration lands the eleven seats | — | [[D1430]]; it is the trunk everything below sits on |
| 7 | **Intent sentences as row labels; producer buttons deleted from ordinary view** | 1.1, 1.2 | 6 |
| 8 | **Producer-shaped empties replaced; empty carries the loop** | 5.2, 5.3 | 6 |
| 9 | **Guard-card shape generalised to every post-commit delivery** | 6.2 | 6 |
| 10 | **On-board commit echo** | 6.1 | 5, `play-composition` geometry |
| 11 | **One gesture, one fact** | 3.1 | 6 + semantic eligibility (F5) |
| 12 | `distribution`, `outcome_split`, `count_with_denominator`, stated caps | 4.1–4.3 | `rfc/evidence-presentation.md` |
| 13 | `magnitude_trail` — the product's first real chart | 4.1 | 12 |
| 14 | **Grade at commit, convention co-rendered** | 6.3 | `rfc/move-quality-grades.md` D1 + the [[D1445]] ceiling repair |
| 15 | **Hint rungs as requests, increment-labelled** | 2.1, 2.2 | [[D1376]]'s reach harness, then hint-distance's redraft |
| 16 | End-of-run re-entry ritual without a moving modal | 6.5 | Review Map |

**Items 1–5 are unblocked today and none of them requires the module layer.** That is not an
argument for doing only those; it is the observation that the two things that most make the
product feel broken to a learner — a quiet screen with no explanation, and an accessibility
surface that cannot reach its own feature — are both fixable before the trunk lands.

---

## 10. Proposed ledger rows (head verified **D1448** at pass start; NOT written)

- **D1449** — this dossier: the in-run experience specified from the learner's side; the finding
  that **every assistance control in the run screen names a producer and none names a question**;
  per-feature expectation → field practice → recommendation across help, hints, marks, evidence,
  honest empty and the post-commit moment; the honest-empty-carries-the-loop pattern; the
  intent-sentence-as-row-label binding.
- **D1450** 🐞 — **`guided_hint` may currently print a Stockfish PV against that producer's own
  declared limitation.** `module-registration.md:359,262` admit `live.stockfish.pv` at stage 3;
  `evidence-catalog.ts:772` declares it *"Explicit Analyze consumer only; never a guidance
  binding."*; the repair lives in `rfc/hint-distance.md` §4, which is returned to research
  ([[D1377]]). The narrowing edit does not depend on the rungs and should not wait for them.
- **D1451** — **the honest empty is the hint's most likely state, and the design must lead with
  it.** [[D1376]] leaves hint reach unmeasured (four of seven proposed families are not emitted
  at all) and `census-hint-false-positives.md` measures an 89.0% observation-level false-positive
  rate for a census-only hint. The reach harness should report **per rung**, not only per family.
- **D1452** — **the preset pill and disclosure footer are unblocked and should not wait for the
  module layer.** `rfc/intent-presets.md` §7.1 enumerates eight reads, all shipped; `compiled.modules`
  is the only blocked half. Silence with no standing statement is indistinguishable from breakage.
- **D1453** — **owner decision requested on `structure_nudge` proactive-vs-on-request**, with a
  recommendation: proactive marker, on-request content (`design/05` §3b's passive marker).
- **D1454** — **`evidence-presentation.md` Discharge D9 has no owner**: no arm of any pass has
  established that a learner understands a bar. It belongs to the preregistered participant plan
  at `planning/platform-alignment/evidence-presentation/participant-plan.md`.

---

## Residuals and limits

- **Nothing here is hands-on, on either side.** No competitor was driven — `competitor-play-ux.md`
  §Method states the ceiling (*"the strongest label here is `[V]`-fetched-primary-source, not
  `[V]`-hands-on"*) and every teardown repeats it. And **our own screen was not driven in this
  pass either**: all our-side facts are code derivation at HEAD. A dossier about *feel* that has
  felt nothing is a real limit, and the exit for it is the same one R3 already carries — the
  owner's own use ([[D649]]).
- **The load-bearing `[P]`s, named:** Chessiverse's hint ladder and its theory-dependent rung
  semantics (§1, §2) — vendor-page evidence of what is *offered*; the field's density ceiling
  (*"more than about one semantic layer turns the board into a diagram"*) — `[P]` synthesis in
  `competitor-play-ux.md` §2; the companion-card pattern (§4.4, §6.2) — `[P]` synthesis;
  alert-fatigue transfer (§4) — clinical decision support, an analogy and nothing more. **None of
  §1–§7's recommendations rests on a competitor's step count, geometry, or effectiveness claim.**
- **Three claims in the corpus carry `[M]` and are not used to support anything here:** chess.com
  showing no eval during live play, its coordinates toggle, and the review eval-bar's side.
- **Absences are recorded as unsearched, not as field gaps.** The observation that no dossier
  records a competitor's honest-empty hint is a statement about our corpus.
  `competitor-love-hate-sweep.md` §Method's rule governs: *"`not_found` … does not mean nobody
  loves or hates the product."*
- **Not covered, deliberately:** layout geometry, breakpoints, colour, typography and motion
  curves (`rfc/play-composition.md`, `rfc/theming.md`); mobile-specific composition
  (`mobile-scope.md`); the spectator and teacher views (`broadcast-and-teacher-surfaces.md`); and
  anything about what a *pack author* sees.
- **Unanswerable from a desk, and it is the biggest one:** whether any of this is comprehensible
  to a nontechnical chess player. Every module name, preset label, promise sentence, honest-empty
  sentence and component in this document is a **candidate**. The participant arm is preregistered
  and unrun.
