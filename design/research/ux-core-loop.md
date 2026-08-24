# The core loop from the user's side — a UX specification

- Date: 2026-08-24
- Commissioned by the owner, verbatim: *"we need to go from a user perspective per feature…
  what do they expect, what do competitors do, PROPER UX."*
- Scope: **the core loop only** — commit → play the consequence → rewind → branch → compare →
  replay under different resistance (`design/00-thesis.md:21`). Not the shell, not the assistance
  rail's content, not campaign structure. Where this spec touches those, it names the document
  that owns them and stops.
- Method, three passes per feature as commissioned: (1) what a user expects; (2) what competitors
  actually do, **labelled**; (3) what we should do and why it differs. Each feature closes with
  cost and dependencies.
- **Evidence basis.** Shipped-state claims are `[V]` — read at `f2ddba55` this pass, with file and
  line. Competitor claims are overwhelmingly `[P]` or `[V]`-fetched-page, **not `[V]`-hands-on**.
  Two labelling hazards inherited from the corpus and restated because this spec leans on them:
  inside a teardown, `[V]` usually means *"the URL was fetched and read"*, not *"the mechanism was
  observed working"* (each teardown's Method block says so); and `competitor-matrix.csv` rows
  1–28 carry an **unlabelled confidence word** (`High` / `Medium-High` / `Medium`) that is **not**
  an evidence label, while rows 29+ carry explicit `[V]`/`[P]`. **`teardown-cet.md` is the only
  hands-on session in the entire corpus** (browser-driven, 2026-08-11).
  `adoption-audit.md` §Honest limits states the consequence: *"most dossiers are desk research,
  and a 'loved feature' grounded in store copy overclaims by construction."* §11 lists every
  load-bearing `[P]` in this spec and what would settle it.
- Feeds: B1's true residual (`design/03-product-breadth.md:323`), B3's moved residual (`:325`),
  `rfc/evidence-presentation.md` (the twelve-component vocabulary this spec renders into),
  `rfc/module-registration.md` (the `compare_coach` and `review_map` seats), [[D945]] (earned
  rewinds), [[D78]]/[[D359]]/[[D542]] (the measured all-on failure), [[D687]]–[[D689]] (the
  review surface's single door).
- Reconciles, does not duplicate: `competitor-play-ux.md` owns screen anatomy and the
  seven-pattern field language; `teardown-chessigma-desk.md` owns the closest live analogue;
  `review-map-and-reentry.md` owns post-game re-entry semantics; `roguelike-run-design.md` owns
  the campaign economy's option space; `docs/n-way-comparison.md` owns the comparison payload's
  contract, which this spec treats as binding and does not widen. This dossier owns the
  **learner's experience of the six moments** and nothing else.

---

## 0. The tension this spec exists to hold

A learner has just played a move and it went badly. What they want is the button they have
pressed ten thousand times everywhere else: **take it back**.

Every tool they have used trains that reflex, and the field's variants are worth naming precisely
because each one is a *different* promise:

- **Undo that erases.** Dr. Wolf offers *"unlimited hints, unlimited undos"* `[V]` App Store —
  and `teardown-drwolf-desk.md` §3's verdict is that *"undo here means the move **did not
  happen**; the game continues as the single surviving line."*
- **Undo that breaks the game.** Chess.com replaced bot-game review arrows with a single Undo
  that reverts the move pair and makes the bot recalculate; *"the original game is not
  preserved"* `[V]` forum. Practice-vs-Computer's takeback-then-branch is **reported broken** and
  moderator-acknowledged `[V]`: *"clicking the arrow moves my piece back but … the computer
  stubbornly just makes the original moves."* A user on the post-game case: *"This abrupt
  undoable event is beyond maddening."* `[V]`
- **Retry as a one-ply puzzle.** Chess.com's Game Review Retry *"allows you to replay a specific
  position and attempt to find the best move yourself"* `[V]` support 8584089;
  `teardown-chesscom-platform-desk.md` §2's verdict is *"a one-ply puzzle stapled to the
  review."*
- **Takeback fused with a hint.** Noctie: *"if you make a mistake, you can take it back and ask
  for a hint"* `[V]` noctie.ai — going back and being told are **one gesture**.
- **Branching that destroys the future.** The one hands-on observation in the corpus:
  `teardown-cet.md` `[V]`, *"**Branching is destructive.** Move-list click jumps to any node;
  playing a different move there **replaces** the recorded future… No attempt persistence, no
  comparison."*

Our answer is that it happened, and the consequence is mandatory. `design/00-thesis.md:99-102`:
*"The consequence stays mandatory; only the retry is free… play it out, then go back — never take
it back."* `design/05-in-run-experience.md:39`: *"An undo says the move did not happen. A fork
says it happened and here is another world. The difference is the entire pedagogy."*

**So expectation and correctness pull apart at exactly the moment the product is most emotionally
loaded**, and the honest statement of the design problem is:

> The learner wants the last thirty seconds erased. We are going to refuse, and then we have to
> make the refusal feel like a better offer than the thing they asked for.

That is a **presentation** problem, not a policy problem. The policy is ruled and this spec does
not reopen it. What this spec argues is that the refusal is currently delivered as an *absence* —
there is no undo, and nothing says why — and an unexplained absence reads as a missing feature,
not as a doctrine. `design/05:41`'s invariant, *"Absence is stated, never simulated"*, is written
about evidence; **the same invariant applied to affordances is most of §2 and §4 below**, and it
is unmet: [[D494]] already records that *"the app is silent about being silent."*

### 0.1 The discriminator, and the two claims underneath it that are not settled

The rejected shape — *"an engine review screen with a rewind button"* — is not rejected because
rewind is bad. It is rejected because there the rewind is a **navigation control**: you scrub to
a ply and the engine tells you what was there. `teardown-chessigma-desk.md:139-143` states the
discriminator better than the repo had managed before, from a live example:

> *"Chessigma re-enters the game; it does not preserve the re-entry… the line in AGENTS.md
> §Rejected is not 'does it have a rewind button' — Chessigma has re-entry and is still not us.
> **The line is whether the second attempt survives to be compared with the first.**"* `[V]` desk

**The whole product therefore rests on the compare surface being good**, because compare is the
only place a surviving attempt pays off. It is also, measured at HEAD, the weakest surface we
ship (§1). §7 is the long answer.

Two honesty items must be attached to that discriminator before any UX decision leans on it,
because both are open contradictions **inside our own corpus**:

1. **Chessiverse — a three-way contradiction, and the matrix is carrying two rows for it.**
   `competitor-love-hate-sweep.md` §1 cites the vendor page `[V]` as claiming *"preservation of
   abandoned continuations as clickable branches, PGN export with variations"* and draws a
   `DESIGN-GAP:` conclusion that *"any claim that rewind + branch preservation + theory handoff is
   itself unique is now **false**."* Against that, verified in the matrix this pass `[V]`:
   **row 58** (label `[V] vendor docs + [P] owner hands-on`) records persistent branch attempts as
   **`N`**, checkpoint rewind as **`P support/takeback`**, and names the main gap as *"No preserved
   branch comparison or transparent grounding"*; **row 16** — a **duplicate Chessiverse row** never
   merged — instead records branch attempts `P` and rewind `Y restart` at confidence
   `Medium-High`. So the corpus holds three incompatible readings, and **the one backed by owner
   hands-on is the one that says the branches are not preserved.** The sweep's own method rule
   downgrades its evidence: *"a vendor page establishes what a feature **claims** to do."* Nothing
   was reconciled.
2. **chessfeed.ai.** Verified this pass `[V]`: `competitor-matrix.csv` line 27 records *both*
   "Persistent branch attempts" and "Checkpoint rewind" as **"Y claimed"**, primary unit *"AI
   branch exploration"*, closest strength *"Saved branch exploration"*, main gap *"Depth and active
   replay need hands-on verification"*, confidence word `Medium` — **not an evidence label**.
   `competitor-value-props.md` §Open verification items #5 calls it *"the closest claimed overlap
   with our core branch mechanic; depth unknown"* — **open since 2026-08-10 and never closed.**
   This is the single largest hole under any "nobody else preserves attempts" sentence.

And the repo has already ruled that no single mechanic carries the claim.
`competitor-love-hate-sweep.md` §Verdict `[M]`: *"Tabiya **cannot** claim uniqueness from rewind,
retained branches, theory-linked play, human-ish bots, friendly explanations or player profiles
individually… The defensible target is the **joined contract**."* This spec is written on that
basis: the loop's six moments have to be good *as a sequence*, because no one of them is a moat.

---

## 1. Baseline — what the loop actually is today

Read at `f2ddba55`, `[V]` throughout.

| Moment | What ships | Where |
|---|---|---|
| Commit | A move lands. No on-board acknowledgment; feedback, if any, goes to the rail | `Chessboard.svelte`, `DrillScreen.svelte`; absence noted at `competitor-play-ux.md:270` |
| Consequence | Delayed disclosure works: `attempt_end` opens on `outcome.reached`, **rewind leaves it open**, the next committed move closes it | `docs/branch-runtime.md:225`; `feedback.ts:22-30` |
| Rewind | `Rewind to preview ⏎` in the Timeline, always present, gated only by `HonestControl` on write permission | `Timeline.svelte:84-98` |
| Fork | `Fork B` → modal with **Label** (placeholder `alt-{n}`) then **Intent** (*"What are you testing?"*) | `DrillScreen.svelte:1200-1206` |
| Branch rail | `{n} branches · {n} settled · {n} hidden by you · {n} not classified`; per branch label, first move, intent, raw `objectiveState` | `BranchRail.svelte:35,49-54` |
| Compare | Full-screen surface replacing the drill; three zoom bands (`Overview`/`Summary`/`Boards`); N columns; aligned-ply stepper; narrative behind a toggle | `CompareView.svelte`; `DrillScreen.svelte:820-830` |
| Resistance | `RunOpponentPolicy{mode,targetElo,…}`, five modes; **four shipped rated bands: 1000 / 1400 / 1800 / 2200** | `types.ts:41-47,69-74`; `App.svelte:391` |
| Review re-entry | Works and forks correctly — rewinds to `entryNodeId`, forks `story-reentry`, returns to the run | `review-map-and-reentry.md` §1.1 `[V]`; `App.svelte:326-332` |

### 1.1 What is genuinely good, and should not be lost in a redesign

Stating this first, because the recommendations below are numerous and would otherwise read as a
condemnation of a surface that has several things right.

- **The compare heading is the thesis in one sentence.** `CompareView.svelte:65`: *"Same
  decision, two consequences."* That is the product, and no competitor screen says anything
  like it.
- **The fork modal asks the right question.** *"What are you testing?"* (`:1205`) captures the
  learner's hypothesis. Nothing in the surveyed corpus asks for one.
- **The comparison payload refuses to grade.** `docs/n-way-comparison.md:11-12`: *"The payload
  never ranks branches, computes an eval delta, or recommends a winner."* This is law 8 built into
  a data structure, and §7 treats it as binding.
- **Honest refusals are a shipped pattern.** `HonestControl.svelte:14-17` renders a disabled
  control's reason inline, bound by `aria-describedby`. The compare stepper's two refusals and
  the read-only rewind refusal all use it.
- **Re-entry from review already forks.** `review-map-and-reentry.md` §1.1 `[V]`: *"It does not
  create a one-ply puzzle or erase the source line."* That is precisely the thing every
  competitor gets wrong.
- **Difference-finding exists.** `compare-strips.ts:64-66,76` computes the intersection of
  structural observations across the compared branches and **drops what is common to all of
  them**. The idea is right; §7.3 is about why the output is still unreadable.

### 1.2 Eleven measured defects the recommendations below repair

All `[V]` at HEAD unless marked.

1. **`ComparisonRow.groups` is computed and never rendered.** The runtime partitions columns at
   each aligned ply by node identity, *"so a shared prefix is not rendered as a difference"*
   (`compare.ts:39,248-256`; `docs/branch-runtime.md:234-236`;
   `docs/n-way-comparison.md:19-20`). No renderer reads it. The product computes exactly which
   branches are in the same position and which have diverged, then draws them as unrelated
   columns.
2. **`branch.intent` never reaches the compare surface.** Captured at fork
   (`DrillScreen.svelte:1205`), stored on the branch (`types.ts:127-134`), rendered once as a
   small suffix in the rail (`BranchRail.svelte:50`) — **absent from `CompareView.svelte`**. The
   one sentence the learner wrote about *why* these attempts differ is missing from the screen
   whose job is to answer that.
3. **`BranchConsequence.resistance` is computed per branch and rendered nowhere in compare.**
   `PathResistance` (`replay.ts:97-103`) carries the requested policy, per-leg policies, an engine
   roster with `eloHonored`/`eloApplied`, applied-mode ply counts and `unknownPlyCount`. **Two
   attempts played against different opposition are currently compared as if they were not.**
   Worse, the prose already exists: `resistanceSentences()`
   (`outcome-presentation.ts:108-166`) is written, tested, and wired **only** into the terminal
   sheet.
4. **`BranchConsequence.theory` is discarded** — per-ply `on_line` / `classified_deviation` /
   `unknown`, plus `deviationClass`, `deviationMistakes` and `insideBoundary`
   (`line.ts:15-24`). The product knows where each attempt left book and does not say.
5. **`rows[].nodes[].actor` is unused**, so **the compare grid cannot distinguish the learner's
   plies from the opponent's.** On a screen about what *you* did differently, that is
   load-bearing.
6. **The only chart is a row of identical `●` with the magnitude in a `title`.**
   `CompareView.svelte:135`; `.sparkline{display:flex;gap:.2rem}` — no baseline, no vertical
   position, no sign, no scale. Already named at `rfc/evidence-presentation.md:180-186` and
   repaired by §3.4's `magnitude_trail`. `title` is invisible on touch and unreliable on
   keyboard.
7. **The same eval data renders three times, unaligned and inconsistently.** The `Recorded engine
   evaluation` section filters to `plyOffset === 0` only (`:123`) — the fork score — while the
   full trajectory is a plain text list far below (`:158`) and a third rendering is `deepestScore`
   (`:149`). Nothing shares a ply axis with anything.
8. **Raw enums reach the learner on every compare column**: `{node.objectiveState}` (`:87`), the
   outcome enum (`:87`), `objective {consequence?.objectiveState ?? "unknown"}` (`:148`),
   `{entry.from} → {entry.to}` (`:155`), plus `{branch.objectiveState}` and *"not classified"* in
   the rail (`BranchRail.svelte:35,53`).
9. **The compare surface calls itself an inspector four times** —
   *"Evidence inspector: per-branch difference strips"*, *"…recorded branch strips"*,
   *"…structure and timing"*, *"…position structure"* (`CompareView.svelte:131,132,136,161`). The
   rejected shape by self-description.
10. **Piece routes are mis-chained and mis-labelled.** `compare-strips.ts:85-91` builds routes by
    slicing UCI into `from`/`to` and appending to whichever chain ends at `from`; `pieceId` is the
    **first origin square**, so a route renders as `e2: e2 → e4 → e5`, and captures, promotions
    and two pieces crossing one square mis-chain.
11. **The difference strip fires on almost everything, which is the same as firing on nothing.**
    [[D78]] `[V]`, over 44 real authored fork sets / 473 column plies: 7.32 entries/ply, fires on
    **97.3% of plies**, **1.017× lift**. [[D542]] `[V]`: five detector kinds sit **below 1.0
    lift** — they fire *more* on the move you did not play — and are **69.9% of the reading by
    volume**. [[D359]] `[V]`: the all-on state is **978 words and 247 seconds at one node**, and
    **4.6× worse in the middlegame** than in the endgame.

Defect 11 governs §7's answer and deserves stating as a principle rather than a bug: **the compare
surface's problem is not that it lacks a chart. It is that it has no opinion.** A picture of an
indiscriminate signal is an indiscriminate picture.

### 1.3 Two structural facts about *where* compare lives

- **Mid-run, compare is deliberately half-empty.** `service.ts:1368-1370` applies
  `comparisonWithoutEngineFeedback` when feedback is not disclosed: `evidence` blanks to `[]` per
  column and machine refs are stripped from the objective timelines `[V]`. This is correct — it is
  ADR-0006 holding at the compare boundary — but it means the sparkline and both trajectory
  sections render empty during a run, and **nothing on screen says why**. A learner who compares
  at a checkpoint sees a broken screen rather than a withheld one, which is `design/05:41` and
  `rfc/evidence-presentation.md` §4b unmet at the surface that most needs them.
- **After a run, compare has no door.** `review-map-and-reentry.md` §1.3 `[V]`: a selected private
  moment offers **one** learning action — *"Re-enter and play from here"* — and there is **no
  cited-theory, drill or compare action** ([[D687]]–[[D689]]). So the fifth moment of the loop has
  no entry point in the review surface at all. `docs/review-map.md` does not exist; `review_map`
  is a registered module id whose evidence disposition reads
  `{ kind: "experimental", reason: "Awaits learner-module consumer compilation…" }`
  (`evidence-catalog.ts:822`) `[V]`.

---

## 2. Feature — the moment of committing

### What a user expects

A move is the only thing a chess player does, and here it is also *a decision that will be graded
by its consequences over the next eight to twenty plies*. Three expectations, in order:

1. **Acknowledgment.** Something happened; the product noticed.
2. **No verdict.** They have played on chess.com and lichess, where nothing evaluates during live
   play, and they are not expecting it here.
3. **A sense of what they just signed up for.** "I have committed" should feel materially
   different from "I am shuffling pieces on an analysis board", because it is.

Point 3 has no established interaction anywhere, because no competitor has a reason to build one.
The expectation there is *absent*, not misdirected — which makes it the cheapest place in the
whole loop to be original.

### What competitors do

- **Nothing during play, verdict after** — the incumbent consensus. Lichess's round screen
  *"shows no evaluation of any kind"*, analysis is a separate page `[V]` scss + fetched
  (`competitor-play-ux.md:60-61`). Chess.com: no eval during live play, then a game-over modal
  into Game Review `[V]`/`[M]` (`:82-89`).
- **On-board paint at commit** — the field's preferred at-commit channel because it costs zero
  layout (`competitor-play-ux.md:176-181`). Chess.com paints classification badges on the
  destination square behind a *"Show Move Classification On Board"* setting `[V]` support
  8584089. Noctie paints a **7-colour scale** at commit — red blunder, orange mistake, brown
  dubious, light green OK, dark green good/forced, blue great, purple excellent `[V]` FAQ, and
  it is configurable per quality `[V]` App Store release notes. Chessiverse colour-grades **every
  legal move on the squares** in Full Help `[V]`.
- **Pre-commit interception, and it is the most-loved feature in its product.** Dr. Wolf asks
  **"Are you certain?"** before allowing a blunder `[V]` popsci. The teardown's §5.1 records the
  reaction `[V]` App Store, 5★: *"This little app is awesome. It was just like my grandfather
  **'you suuuuure want to make that move?'**"* — and notes that *"the mistake-dialog itself is the
  beloved feature."* `adoption-audit.md` row 32 keeps it **ledgered in transformed form**: a
  *post-commit* guard, consequence within ~2 plies, then rewind offered.
- **Structured pre-commit process capture** — ChessMotive, the sharpest example in the corpus.
  Its JSON-LD positioning `[V]`: *"chess training that builds the decision process behind each
  move: **naming candidate moves, eliminating them by calculation, and evaluating the position
  before committing**."* Six captured steps in order: `Initial candidates` → `Shortlist` →
  `Final Move` → `Critical line` → `Objective` → `Practical` `[V]`. Feedback is withheld to the
  commit; Stockfish appears only in a post-reveal panel `[V]`. `teardown-chessmotive-desk.md` §7.1
  reads this as **corroboration of ADR-0006 by an independent team**.
- **A pre-commit reasoning scaffold** — Qchess.net's *Thinking Process Drill*, singled out by
  users `[P]` reddit (`competitor-love-hate-sweep.md` §3): a structured scan through prophylaxis,
  forcing moves and candidate moves.
- **Live grading is genuinely loved by some learners**, and this should not be waved away. One
  named Noctie user `[V]` Product Hunt: *"**Real time feedback works much better for me than just
  end of game feedback**."* That is a real preference in direct tension with silence-by-default,
  and `design/05` §3a answers it as a *mode*, not as a default.

### What we should do, and why it differs

**C1 — give commit a bounded on-board echo, and make it mean "recorded", not "good".** The field
consensus is that commit is acknowledged in the board's own pixels; our draft routes everything to
the rail, so *"commit in the draft is a purely peripheral event — the one moment the whole product
turns on"* `[P]` synthesis (`competitor-play-ux.md:271`). Adopt the channel, **invert the
content**: chess.com and Noctie paint a *grade*, we paint a *fact of record*. No colour ramp, no
badge, no quality vocabulary — `rfc/evidence-presentation.md` §7c is explicit that *"a red move is
a graded move"*, and §3.9 forbids valence on any vocabulary describing a move.

**C2 — the first commit of a run is where the product states its own rule, once.** *"You will play
this out before you can go back."* Not a modal, not a per-move tooltip: one line, at the first
commit, dismissible and re-readable from the timeline. This is the affordance form of [[D494]] and
it costs one sentence with no producer behind it.

**C3 — an optional pre-commit intent capture, at checkpoints only, and never graded against an
engine.** ChessMotive and Qchess both found real appetite for declaring your thinking before you
move, and the fork modal already proves we can ask a good question (*"What are you testing?"*).
The transformation the sweep already worked out `[M]` is the binding one: *"it may not call engine
agreement 'correct thinking'."* So the capture is **recorded and later shown beside what
happened** — it becomes an operand for §7 Layer 1 — and it is never scored. This also respects
`docs/n-way-comparison.md:28-29`, which deliberately withholds learner intent text from the voice
provider.

**Why this differs:** every competitor's at-commit paint answers *"was that good?"*. Ours answers
*"that is now part of the record."* The distinction is exactly ADR-0006 — a grade at commit is a
verdict delivered before the consequence. The **form** is adopted wholesale from the field; the
**content** is inverted, which is `design/05` §3-forms' rule that form is orthogonal to source and
*"changing the form never changes what may be said or when."*

**Refused: a confirm-move step in rehearsal.** Dr. Wolf's *"Are you certain?"* is beloved and is
still the wrong shape for us: `teardown-drwolf-desk.md` §6 summarises the whole difference —
*"where our loop is commit → play the consequence → rewind, Dr. Wolf's is **warn → retract →
never play it**."* The transformation is already ledgered as a *post-commit* guard for the
on-ramp band, and that is where it belongs.

### Cost and dependencies

- C1: one component, post-commit only, no new producer. Needs `rfc/theming.md` tokens and, for
  any label, `rfc/evidence-presentation.md` §3.9's registry. Also needs the D840 animation fix or
  it reads as a flicker. **Acceptance:** its rendered content passes §6a — chess notation, or a
  registry label with no move-valence.
- C2: one authored sentence and a dismissal flag. No producer, no gate.
- C3: a new recorded field and a checkpoint-scoped prompt. **Must not be routed to the voice
  provider** (`docs/n-way-comparison.md:28-29`). Its payoff is entirely in §7.

---

## 3. Feature — playing out a consequence you already regret

This is the product's hardest minute and it has no competitor. The learner usually knows the move
was bad within two plies, and the product requires them to keep playing.

### What a user expects

**To be released.** Every other tool releases them: resign, take back, next puzzle, Retry. The
expectation is not for a feature; it is for an *exit*, and the exits they know are all forms of
quitting.

Two secondary expectations, both legitimate and both unserved:

- **To know how long this lasts.** "Play the consequence" is open-ended. A learner who does not
  know whether it is four plies or forty cannot decide whether to invest.
- **To be told the target is still winnable, if it is.** `design/00-thesis.md:80-89` is emphatic
  that this is the product's sharper mechanism: *"if the product declares the honest target up
  front — this is drawn with correct defence; hold it — then being worse is the premise, not the
  failure."*

### What competitors do

- **Chessigma's Bot Challenge is the closest thing that exists** `[V]` `/supercoach`: *"You blew a
  +3 in a real game. Pick it back up at that exact move. **Same clock. Bot at your level. Finish
  it this time.**"* `teardown-chessigma-desk.md:103-117` calls it *"materially further than
  anything the corpus has recorded before."* But it is an *entry* into a consequence, not a
  *sustaining* of one, and its rewind row reads *"analysis-board variations only, transient"*
  `[V]`. What happens if you blunder again during the challenge is **undocumented** `[P]` — the
  teardown's §9 residual 1.
- **Chess Endgame Training is the honest-consequence exemplar, and the only hands-on evidence in
  the corpus.** `teardown-cet.md` `[V]`: objective-state banners — *"You are receiving mate in N
  moves or less"*, *"**Unfeasible mate**"* — fire on objective flips **without blocking the
  move**. The teardown calls it *"the closest thing to outcome-preservation feedback seen in any
  product. **But it never says *why*** — no concept, no evidence, no remediation."*
- **Everything else releases you.** Chess.com's Retry is one ply `[V]`. Chessable restarts the
  sequence on a wrong move and demotes the SRS card `[P]`; its soft-fail path gives *"you will not
  be penalised with a mistake. Instead, you get to try again"* `[V]` blog, but *"the drill still
  converges on the single text move."* Dr. Wolf's undo erases `[P]`. Chess2Story's moment slides
  are read-only `[V]` desk. ChessMind AI's retry keys are exercise-scoped `[V]`.
- **Harvest-the-position, lose-the-attempt** is the corpus's dominant pattern and it is worth
  naming because it is *adjacent* to what we do. Dr. Wolf `[V]`/`[P]`: mistakes become an isolated
  position in a practice queue — *"**Nothing is comparable because only one thing is kept per
  mistake**."* Chessbook `[V]`: own-game scan turns deviations into SRS cards, *"severed from the
  game it happened in."* Chessigma `[V]`: *"their unit of truth is the aggregate metric, not the
  attempt."*
- **Conversion Trainer is the framing to steal** `[V]` `/supercoach`: *"Won the position, lost the
  game? Drill the moments you let it slip."* `teardown-chessigma-desk.md:371-375` rates it the
  strongest cheap adoption in that dossier, with **no invariant collision**, because we already
  ship both halves — `save`/`hold`/`resist` grading and the detector that finds the moments.

### What we should do, and why it differs

**P1 — the run states its horizon before the consequence starts, and holds it visible.** Not a
progress bar toward a verdict: a **scope statement** — this consequence runs to the next
checkpoint, or to the pack boundary, or to a result. Packs declare checkpoints and boundaries;
Just Play has the honest detectors of `design/05` §5a. Where the horizon is unknowable, say so —
that is `stated_absence`, not a blank.

**P2 — the honest target is the headline, and being worse is the premise.** This is
`design/00-thesis.md:80-89` given a surface. Where the position is assessable — tablebase in
range, or an authored claim with its provenance — region 1 reads *"This is held with accurate
defence. Hold it."* rather than an evaluation. Where it is **not** assessable, the product says
so, and `00-thesis.md:93-98` is unusually severe about why: *"A product that declares 'this is
held' and is wrong has done real damage, because the learner ground out a defence of a position
that was already lost."*

**P2a — and CET's gap is the instruction.** State banners without a *why* are *"state-flip
detection without teaching"* `[V]` hands-on. Our advantage is that the reason has a home: the
authored claim, the tablebase verdict, or an explicit abstention. A banner that fires and cannot
say why should say **that**, per `rfc/evidence-presentation.md` §3.11.

**P3 — rename the exit. The escape hatch is not "give up", it is "declare done".**
`design/06:580` already has this vocabulary — *"declaring done is what counts"*. A learner who has
seen enough should be able to end the consequence deliberately and reach the rewind, and the
button should say what that is: **"I've seen enough — take me back"**, not "Resign" and not
"Undo". This is not cosmetic. Resign says the attempt failed; declaring done says the attempt is
*complete*, which is true, and it is what makes the branch worth keeping.

**P4 — adopt the Conversion Trainer framing as our entry copy**, transformed per
`teardown-chessigma-desk.md:363-369`. Their offer — *"You blew a +3"* — names an evaluation before
the learner plays, which is an ADR-0006 collision; the transformation is already worked out
there: the offer may state the **recorded historical outcome and the moment index** without
exposing an eval at the board. So: *"You were winning this and lost it. Pick it up here."*

**Why this differs:** the field's entire answer to "the move was bad" is to shorten the
consequence to zero (undo, restart) or to one ply (Retry). Ours is to make the consequence
*bounded, targeted and honourably exitable*. The learner is never trapped; they get a horizon, a
target that being worse does not disqualify them from, and an exit that does not read as failure.

### Cost and dependencies

- P1: needs the pack boundary (ships) and, for Just Play, the `design/05` §5a detectors
  (irreversibility, phase change, human divergence, option collapse) — all present as
  `PivotalMarker` kinds (`pivotal.ts:19`) `[V]`. Honest-empty where unknown.
- P2: **gated on assessability, and this is the expensive dependency.** Tablebase within range is
  exact and ships. Above eight pieces it is an authored or engine judgement and must be labelled
  as one — so P2's strong form is B4-blocked with the rest of the authored vocabulary.
- P2a: needs `rfc/evidence-presentation.md` §3.11's `abstention` component.
- P3: rename plus one event; the runtime already distinguishes declaring done from a terminal
  outcome.
- P4: entry copy on a surface that exists; costed as the cheapest adoption in its teardown.

---

## 4. Feature — how a rewind is offered, and how "earned" is communicated

### What a user expects

**Free, instant, and destructive in the helpful direction** — ⌘Z, the back button, the takeback.
They expect the bad move to be *gone*.

And when a product limits a retry, the learner's prior is **paywall** — because that prior is
correct almost everywhere. Chess.com meters Game Review at 1/day below Diamond `[V]` launch blog,
and the reaction is on record `[V]`: a thread titled *"You just gutted my way of improving and put
it behind a paywall. Thanks for nothing"*. Dr. Wolf's *"unlimited undos"* are themselves a
**premium feature** `[V]` thechessadvisor — i.e. the field's one unlimited retry is a thing you
buy. A rewind counter presented badly will be read as monetisation, and the reading would poison a
mechanic whose ruled purpose is the opposite.

### What competitors do

- **Free and destructive** — Dr. Wolf `[P]`, Chess.com bot Undo `[V]`, CET move-list branching
  `[V]` **hands-on**.
- **Free and fused with a hint** — Noctie `[V]`. Worth noticing: it treats going back and being
  told as the same gesture, which is exactly the conflation our disclosure model separates.
- **Preserved as variations** — Chessiverse claims rewound lines persist as move-list branches
  with PGN variation export `[V]` vendor page, **contradicted by the matrix** (§0.1). Note where
  it lives if true: **in the move list**, not a separate rail.
- **Metered as a business model** — chess.com `[V]`; Dr. Wolf `[V]`.
- **Nobody earns a rewind through play.** No product in the corpus grants retries as a reward. The
  nearest analogues are outside chess — Hades' Death Defiance, StS potions — which is why
  `roguelike-run-design.md` had to go to roguelikes to cost the option space `[P]`.

**This is a genuine gap and should be stated as one:** we are designing an interaction with **no
observed precedent in the surveyed corpus**, so the competitor pass cannot validate it. It can
only tell us the learner's prior, and the prior is "paywall". (And per
`design/research/README.md` coverage limit 1, an absence claim over a snapshot is the weakest
kind — the matrix is not a watch.)

### What we should do, and why it differs

The ruling is [[D945]], verbatim: *"you have to earn rewinds or proactive branching… not
infinite, not forbidden. it's what allows a weaker player to actually win a campaign (on lower
floors/acts/whatever)."* Three constraints from `design/06:213-239` bind this section: the economy
is **campaign-scoped** (outside it, rewind stays as free as the thesis promises); spending an
earned rewind can still **win** the encounter; earned state is **server-held progression**, never
a client preference.

**R1 — rewind is offered as a consequence of finishing, never as a control that is always
there.** The affordance appears when the consequence closes — at the outcome, at the checkpoint,
or when the learner declares done (P3). This is the mechanism-level expression of the ruled rule
and it is the difference between a rewind and an undo: **an undo is available *during*; a rewind
is available *after*.** Today `Timeline.svelte:84-98` offers *"Rewind to preview"* as an
always-present control gated only on write permission — which has the *timing* of an undo, whatever
it is called.

**R2 — the rewind offer names what survives, at the moment of the offer.** The learner's fear is
that going back destroys what they did; the offer should say the opposite in the product's own
voice: *"Your attempt is kept. Going back makes a second one."* This is one sentence and it is the
highest-leverage copy change in this spec, because it converts §0's refusal into the better offer.

A mechanical subtlety the copy must respect and nothing currently does: `rewind(nodeId)` **changes
only the cursor**; the branch is created by the *next commit* at a node that already has children,
emitting `branch.forked` then `move.committed` (`docs/branch-runtime.md:85-88,98-101`) `[V]`. At
the instant of rewind nothing has forked. So the copy must promise preservation of the *first*
attempt — true immediately — and not imply a second branch exists before a move is played into it.

**R3 — "earned" is communicated as income, not as a meter.** The presentation difference between a
resource that regenerates through play and one that depletes is almost entirely **which event is
loud**. A meter is loud when it decrements (*"2 rewinds left"*). An income is loud when it
increments (*"That finish earned a rewind"*). Both render the same integer; only the second is a
reward. Three rules:

1. **The earn event is a first-class named moment; the spend event is quiet.** Spending shows the
   new balance without ceremony. This inverts every retry meter the learner has met, which is what
   stops the paywall reading.
2. **The counter is never displayed at the moment of the mistake.** A learner who has just
   blundered and sees *"1 rewind left"* has been charged emotionally as well as mechanically.
3. **Exhaustion is a fact with a path, never a bare refusal.** `HonestControl` is the right
   shipped pattern, and today it carries exactly one rewind reason — *"This read-only view can
   inspect earlier positions but cannot rewind the shared run."* (`Timeline.svelte:87`) `[V]`.
   `roguelike-run-design.md:265-268` flags that a **resource refusal is a new class**: the only
   shipped refusal path is `MATCH_LIVE`, a *permission* refusal. So the sentence must say **what
   earns the next one**, not merely that this one is unavailable.

**R4 — say once, at the campaign boundary, that this is where rewinds are counted.** [[D945]]'s
scope clause is campaign-only. A learner who meets a counter without knowing its scope will
generalise it and conclude that experimentation is metered — selling back exactly what
`design/00-thesis.md:76-79` names as the reason to use this at all. `design/06:186-193` calls the
collision out by name and the ruling accepts and prices it; the price is only payable if the scope
is legible.

**Why this differs:** the field's rewind is a *navigation control* or a *metered good*. Ours is a
**reward for finishing**, which is coherent only because the consequence is mandatory. The mechanic
and the doctrine are the same idea: you earn the right to go back by having gone forward.

### Cost and dependencies

- R1: a placement change plus P3's exit event. No new producer.
- R2: copy — but it must be written against the fork timing above, or it lies.
- R3: **the events exist and nothing is wired.** `campaign-state.ts` `[V]` ships
  `CampaignChargeEarnedEvent{nodeId,amount}` (`:29-33`),
  `CampaignChargeSpentEvent{runId}` (`:35-39`), `CampaignRunState.charges{earned,spent,balance}`
  (`:68-72`) and the error codes `CAMPAIGN_CHARGE_GRANT_INVALID` /
  `CAMPAIGN_CHARGE_ALREADY_EARNED` (`:83-84`, enforced `:194-207`) — and **`charges` is referenced
  nowhere outside that file**: no UI, no server route, no binding to `rewind`.
  `docs/campaign.md` states the position: *"Until that queue is lawful, no rewind charge, unlock,
  seal, or active campaign pointer is persisted."* Owned by `rfc/campaign-core.md`, not by this
  spec. A resource-refusal event class is still needed
  (`campaign-effect-vocabulary.md` §2b/§2d).
- R4: one sentence at a boundary that exists.
- **Open and owner-owned, not a research gap:** the *numbers*. `design/06` carries candidate values
  and a monotone lint (act1 ≥ act2 ≥ act3); [[D1313]] records that the reveal-budget alternative —
  pricing *looking* rather than *retrying* — was never put to the owner and is R6's to re-table.
  Nothing here reopens [[D945]]; §10 lists the decision.

---

## 5. Feature — creating and naming a branch

### What a user expects

**Nothing.** That is the honest finding and it shapes the recommendation. Naming a variation is
not an interaction the target learner has ever performed. In every analysis board they know, a
variation is created implicitly by playing a move and identified by its moves. Asking for a name
is asking for authoring work in the middle of a rehearsal.

What they *do* expect implicitly: that trying something does not lose their place, and that they
can tell their attempts apart afterwards. Those are outcomes, not gestures.

### What competitors do

- **Implicit, unnamed, move-identified** — the universal default. Chessigma's analysis-board
  variations are *"session-local"* with the shareable artifact **a FEN in the URL, not a saved
  line** `[P]` (`teardown-chessigma-desk.md:90`).
- **Named lines exist only in authoring tools** — Chessbook, Chessable courses `[P]` — where the
  author is a coach writing a repertoire. Different job, different user.
- **Variation trees exist widely, but only where nothing plays you.**
  `teardown-chesscom-platform-desk.md` §3 makes the split explicit `[V]`: the Self-Analysis board
  keeps variations but *"the engine only evaluates; it does not play against you"*, while the
  bot-play modes preserve nothing — *"the bot-play modes and the variation-keeping mode are
  disjoint surfaces"* `[M]`. Conclusion `[V]`: **"Preserved attempts anywhere on the platform:
  none found."** The same shape recurs across Lichess studies, ChessBase/Fritz, ChessTempo,
  En Croissant, Chessify, DecodeChess (matrix, mixed labels).
- **The founder's copy that looks like our feature and is not.** Chessigma's promotional post
  lists *"Branch & explore lines"* `[P]`, and `teardown-chessigma-desk.md:120-127` reads it in
  context: *"the analysis board's variation tree — an authoring gesture over a static position,
  **not a record of what the learner played**."* **That distinction is the whole feature**: our
  branch is an attempt; theirs is an annotation.

### What we should do, and why it differs

**B1 — keep the intent field; drop the label from the critical path.** The fork modal asks Label
(defaulted `alt-{n}`) then Intent (`DrillScreen.svelte:1204-1205`). The label is bookkeeping the
runtime already generates via the implicit `alt-N` path (`docs/branch-runtime.md:86`). The intent
is the only record of the learner's *hypothesis*, and therefore the most valuable field in the
data model for the compare surface. So: **intent first, single field, optional, one line**; label
auto-generated and editable later from the rail. A learner who types nothing gets `alt-2` and
loses nothing; a learner who types *"trade queens instead"* has written the headline of their own
comparison.

**B2 — name the branch from the move, not from an ordinal.** `alt-3` is an id. The first move is
already rendered in the rail (`BranchRail.svelte:50`) and is a better identity. Default to
move-plus-intent — *"14…Qxd4 — trade queens instead"* — with the ordinal for disambiguation. This
is `rfc/evidence-presentation.md` §6a read as a naming rule: chess notation is always legitimate
learner-facing text; `alt-3` is not.

**B3 — branches belong in the move list as well as the rail.** The field puts them in the move
list (Chessiverse `[V]` vendor), and `competitor-play-ux.md:261` already criticises our own canvas
draft because *"the strip as drawn also cannot seat branch chips beyond the one 'branch B'
pill."* The rail is the right home for *comparing* attempts; the timeline is the right home for
*finding* the fork. Both, not either — and the strip's clipping (`:260`) must be fixed in the same
pass or the chips are unreachable.

**B4 — retire the rail's bookkeeping header.** `{n} branches · {n} settled · {n} hidden by you ·
{n} not classified` (`BranchRail.svelte:35`) reports four internal states, of which *"not
classified"* is machine vocabulary and *"hidden by you"* narrates the learner's own action back at
them. `rfc/evidence-presentation.md` §3.7 is the right shape for whatever survives (a count
against a stated denominator) and §3.9 for the states. What the learner needs at the top of the
rail is **how many attempts they have here and which one they are in**.

**Why this differs:** every competitor treats a branch as an *annotation on a position*. We treat
it as a *record of an attempt* — `design/05:38`: *"the comparison of two preserved attempts by the
same player is the product's one original claim… and it is only true if the first attempt
survives."* Naming should capture what makes an attempt an attempt: a hypothesis and a move. Not a
folder label.

### Cost and dependencies

- B1/B2: modal and label-derivation; no runtime change —
  `fork(nodeId, label?, intent?)` already makes both optional (`docs/branch-runtime.md:89`).
- B3: timeline work, coupled to the clipping fix.
- B4: depends on §3.7/§3.9 landing, or ships as plain labels now and adopts the components later.

---

## 6. Feature — replaying the same position against harder resistance

### What a user expects

**A difficulty setting, and to be lied to by it.** Their model of bot strength is an engine level
they know is fake, and the field's users say so precisely. `[V]` chess.com forum: *"Computers are
not 800-rated … They are 3800-rated with random mistakes thrown in … Most humans are not going to
play tactically perfect games and then hang their queen out of nowhere. Bots do that all the
time."*

What they want underneath that is different and better: **a rematch against something that plays
like a person a bit better than them.** *"Bot at your level"* is the phrase the market converged
on because it is what people want.

And they expect the ladder to be **theirs to move**. Dr. Wolf's hidden adaptivity is a documented
hate-driver `[V]` App Store, from a long-term user with 800+ wins: *"If the game is actively using
AI to adapt to my level of play without me increasing difficulty, then it's pointless."* The
Advanced→Expert gap is called **"astronomical"** `[V]`.

### What competitors do

- **Chessigma: *"Bot at your level"*** `[V]`, plus **nine named sparring partners, each with a
  real repertoire** `[V]`. `teardown-chessigma-desk.md:296-298`: *"an undisclosed species with an
  undisclosed calibration"*, and §9 residual 2 notes that if it is weakened Stockfish it is
  rejected doctrine and the re-entry is much weaker than it reads `[P]`.
- **ChessMind AI ships the honest version and publishes it** `[V]` homepage FAQ: six levels
  conditioned on human rating, *"roughly 1100, 1300, 1500, 1700, 1900 and 2000+ Elo — so there is
  always an opponent slightly above your own strength"*, with Maia-2 ONNX `elo_self`/`elo_oppo`
  conditioning **code-verified in the shipped bundle** and moves *sampled from the policy, not
  argmaxed*. `teardown-chessmindai-desk.md` §8.2 draws the consequence for us: *"'Course position →
  play it out vs Maia' now ships commercially. Our novelty statement should lean on **preserved
  attempts compared to each other** and **phase trajectory**."*
- **Levelled Stockfish is the mass-market default and is on our Rejected list** — 365Chess offers
  *"Level 1 (ELO ~1300)"* through *"Level 10 (ELO ~2700)"* `[V]`; Chessable/Chess.com bots span
  250–3200 `[V]`.
- **Repetition with varied replies, not graded difficulty** — Noctie `[V]`: *"Revisit the same
  Theme multiple times to explore different variations and outcomes"* and *"Noctie won't just
  repeat the same moves"*, but the teardown records *"no attempt history, no diffing, no tree of
  past tries."*
- **Nobody re-runs the same position up a ladder.** Both ladders in the corpus are ladders of
  *opponents*, not of *attempts at one position*. Chessigma's Woodpecker is a repetition ladder on
  **speed** `[V]` and is the rejected tactics shape anyway.
- **Ascension ladders, from outside chess** `[P]` (`roguelike-run-design.md:322-330`) — StS
  Ascension, Hades Heat, Monster Train Covenant, *"the single biggest 'worth replaying' device in
  all three"*, produced **with modifiers, not content**.

### What we should do, and why it differs

**D1 — replay at a different band is a first-class exit from the compare surface.** The loop's last
step has **no gesture today**: resistance is a run-level policy (`types.ts:69-74`), and the compare
surface — the exact place where a learner concludes *"that worked, but would it hold against
someone better?"* — offers no way to act on the conclusion. The action belongs where the
conclusion is formed. It is a sibling of the `compare_coach` seat's declared action, *"enter the
other attempt at the divergence"* (`rfc/module-registration.md:387`), not a new seat.

**D2 — the ladder has five to nine honest rungs, and today it has four.** Shipped rated bands are
exactly **1000 / 1400 / 1800 / 2200** (`App.svelte:391`) `[V]` — steps of 400. Our own
measurement (`maia-band-outcome-transfer.md`, 16,660 games) puts the smallest *usable* step at
**≈150–208 band points** and the publishable range at `[1000, 2400]`
(`maia-band-calibrated-range.md`), which licenses **five to nine** rungs. So the shipped ladder is
honest but **coarse**: it is four rungs where the evidence supports up to nine, and a learner who
wants "slightly harder" is offered "400 points harder". A slider with 1,400 positions would be the
opposite error — a lie about resolution. Named rungs are the right form: a rung can be remembered,
a slider position cannot.

**D3 — resistance is part of every comparison's convention. This is correctness, not polish.** See
§1.2 defect 3. `PathResistance` carries `eloHonored` and `eloApplied` per engine plus
`unknownPlyCount` (`replay.ts:92-115`) — the runtime already knows whether the band we asked for
is the band that played. Under `rfc/evidence-presentation.md` §5b a magnitude cannot be constructed
without its convention, and **a branch consequence is a magnitude claim about a line whose
convention includes who was on the other side.** Two attempts at different bands are not
comparable, and the product currently presents them as if they were.

This is not hypothetical. [[D91]] `[V]` records that **every Maia request ran at band 1500 while
recording the band that was asked for**, measured across four command orders × 12 positions × 3
bands — closed 2026-08-15 by `0985fa4`, with a real-Maia test proving bands 1000 and 2400 produce
different policy vectors. The bug is fixed; the *lesson* is that requested and applied can diverge
silently, and `eloHonored` exists so the surface can tell. Rendering it converts a fixed bug into
a permanent guard.

**D3 is also the cheapest recommendation in this document**, because the prose already exists:
`resistanceSentences()` (`outcome-presentation.ts:108-166`) emits *"Requested resistance: … — the
pack's request."*, *"Applied policy: … — recorded per move by the selector."*, *"N of these plies
predate policy recording."* and band-honored lines — and is wired **only** into the terminal sheet
(`DrillScreen.svelte:345` → `OutcomeContext.svelte` → `TerminalSheet.svelte:28,40-41`) `[V]`.

**D4 — the honest difficulty axis is capability as well as Elo, and we have two dials.**
`roguelike-run-design.md:319-326` reaches from the roguelike side the same conclusion as
[[D945]]'s act scaling: *"the honest ladder is fewer capabilities, not harder numbers"*, and the
slot budget (5 → 3 → 1) is *"arguably the more honest one, since fewer lenses means more you must
see yourself."* For the core loop, the replay offer has two visible axes: **who is playing against
you**, and **what you may see**. GroupPanel already ships the vocabulary for the first —
*"Fixed resistance: within this group, the same position always receives the same reply."* /
*"Varied resistance: each branch faces its own opponent draw."* (`GroupPanel.svelte:56-60`) `[V]`.

**D5 — the learner moves the ladder, never the product.** Dr. Wolf's hidden adaptivity is the
named failure. Any automatic band suggestion must be a *suggestion the learner accepts*, and the
applied band must always be visible via D3.

**Why this differs:** the field's ladder is an undisclosed species at an undisclosed calibration
with a persona painted on it. Ours is a measured human model at a published band, with the number
of rungs set by what the measurement licenses and the applied band recorded per ply. That is the
difference between a rematch that means something and a number that moves.

### Cost and dependencies

- D1: an action on the compare surface wired to an existing run-creation path.
- D2: naming and gating over a shipped band contract; adds rungs between existing ones. **Personas,
  if adopted, are presentation over `targetElo` plus a declared repertoire** — never a weakened
  engine (`teardown-chessigma-desk.md:382-386`), and our measurement caps the roster.
- D3: **renders data and prose that already ship.** Needs §5's `Convention` and §3.9's registry for
  the mode vocabulary — `outcome-presentation.ts:112` emits
  `` `Requested resistance: ${requested.mode}…` `` verbatim `[V]`, so `human_common` and
  `practical_resistance` reach the learner as ids today, exactly as
  `rfc/evidence-presentation.md:144-146` records for the same union elsewhere.
- D4: the second axis is the campaign's loadout, owned by `rfc/campaign-core.md`.

---

## 7. The hard question — how does a learner *see* the difference between two branches?

The commission asks for a real answer, concretely, and for an honest statement of what cannot be
visualised. Both follow. Two constraints bind throughout and neither is negotiable here:

- **`docs/n-way-comparison.md:11-12`** — *"The payload never ranks branches, computes an eval
  delta, or recommends a winner."* A **within**-branch delta is already sanctioned
  (`compare-strips.ts:121` emits one). A **cross**-branch delta is the line not to cross, and
  nothing below proposes one.
- **Law 8 / `rfc/evidence-presentation.md` §7c** — no component colours a move by quality.

### 7.1 First, the answer that is wrong, and why it is tempting

The tempting answer is **draw the eval chart**: two lines on one axis, diverging after the fork.
`rfc/evidence-presentation.md` §3.4 specifies exactly that component (`magnitude_trail`), names
`CompareView.svelte:135` as what it replaces, and building it is straightforward.

It is also, on its own, **the failure shape.** Two evaluation curves side by side with a rewind
button underneath *is* the engine review screen. It answers "which was better" with a number the
learner did not ask for, at the exact moment — post-outcome, in review — when they are most
receptive to being told what to think. `design/05:73`: the engine *"is right about the position
and can still be wrong about the *lesson* — '+0.54' answers a question the learner did not ask."*

The market has already tested both directions and the results are instructive in both. Take Take
Take sells the *rejection* of the graph as its positioning `[V]` App Store: *"What you missed, why
it mattered, and what the better move was. **Not a graph. Not centipawn scores.** An actual
explanation you can learn from."* — and one user confirms the need `[V]`: *"the engine suggestions
are **a mystery to me at my ELO** so the writing is nice."* But its LLM replacement was publicly
demolished on launch day `[V]` intermediatemoves.substack.com: a rook described as cutting a
defence *from a bishop of a queen* (*"That's… not how a bishop moves"*), a comment about an
undeveloped bishop's diagonal in a position that never arose, a game-losing blunder softened to
*"incredibly risky"*, and the verdict **"Almost everything this LLM says about chess is irrelevant
or wrong… a slop machine."** Corroborated `[P]` in `competitor-love-hate-sweep.md` §2.

**Read those two findings together and they are the specification:** learners want the *meaning*
rather than the number, and the market's attempt to supply meaning without grounding produced the
single worst artifact in the corpus. Our position — meaning, grounded, or honest silence — is the
gap between them.

So `magnitude_trail` should be built. It is strictly better than a row of identical dots and the
trail is a real recorded fact. But **it must not be the compare surface's primary answer**. It is a
supporting instrument sitting below the thing that actually answers the question.

### 7.2 The answer: five layers, in this order

The difference between two attempts is not one object. It is five, and they are not equally
visual. Ordering them by *how directly the learner can see them* gives the surface its shape.

---

**Layer 1 — the divergence itself, on one board. This is the headline and it is missing.**

Two attempts differ in exactly one thing to begin with: **the move**. Everything else is
downstream. The compare surface's first, largest and most legible object should be the fork
position with **both candidate moves drawn on one board**, labelled by branch, with the learner's
stated intent under each.

Today the surface draws *N separate boards at the same aligned ply* (`CompareView.svelte:81-98`,
`defaultComparisonZoom` returning `"near"` for two branches) — the one arrangement guaranteed to
make a difference hard to see, because the eye cannot diff two 8×8 grids two hundred pixels apart.
One board with two arrows is a smaller, cheaper, more truthful picture of what the learner did.

The honesty constraint and how it is satisfied: `design/05` §3-forms form (c) governs
*system-drawn* marks, and an arrow for a *move* is a verdict following disclosure. These arrows are
neither — they are **the learner's own committed moves**, rendered back to them, in review, after
the outcome. `rfc/evidence-presentation.md` §3.6's `move_path` carries
`origin: "learner_played"` and takes `convention: not_applicable` for exactly this case. Nothing is
asserted; a record is drawn. (§9 decision 1 asks the owner to confirm rather than assume this,
because `design/05:199` says form (c) *"has no producer yet"* and [[D1429]] holds that the `arrows`
preference is read by no renderer at all.)

**And the intent lines under each arrow are the whole point.** *"trade queens instead"* versus
*"keep the tension"* is a comparison a 1400 can act on. `+0.31` versus `-0.12` is not.

---

**Layer 2 — where the lines stopped being the same position. The data ships and is discarded.**

`ComparisonRow.groups` partitions the columns at each aligned ply by node identity
(`compare.ts:39,248-256`), and **no renderer reads it** (§1.2 defect 1) `[V]`. This is the most
valuable unrendered fact in the product.

What it enables: the aligned-ply stepper stops being a scrubber and becomes a **structure**. Plies
where every branch is in the same position are *shared* — drawn once, collapsed, as a rest state.
The ply where the partition splits is the **divergence**, drawn once, large. Plies where two of
four branches re-converge are a **transposition** — a genuinely interesting fact about chess that
no competitor surface can state, because no competitor is holding two of your attempts at once.
`node.transposeKey` (`types.ts:110-125`) makes the cross-column case free and is also unused.

This turns the stepper's label — `Aligned ply {step} / {maxStep}` (`:105`) — from a coordinate into
a map. It is the compare surface's own `review_map`, and it costs a partition the runtime already
computes.

**Layer 2 also needs `actor`.** `rows[].nodes[].actor` is present and unused, so the grid cannot
distinguish your plies from the opponent's. On a screen about what *you* did differently, the
first question about any divergence is *whose move was that?*

---

**Layer 3 — the positional difference, as squares on one board. This is the hard one and it is
answerable.**

Here is the crux of the owner's question: the difference is *often positional and not reducible to
one number*. Correct. But "not reducible to a number" is not "not visible" — a positional
difference is, definitionally, **a difference in where the pieces and pawns are and in what they
control**. That is a set of squares, and squares are drawable, exactly, at rung 0, with no chess
judgement whatsoever.

Concretely: at the compared ply, take the two positions and render **one board, one branch as the
base, the other branch's differences marked on it** — pieces on different squares, pawns present in
one and not the other, files open in one and not the other, squares controlled in one and not the
other. Every one is rules arithmetic (`design/05:71`: *"it is arithmetic over the position and
makes no chess judgement"*), and `design/05:453-461` already enumerates four of five such
detections as *"free and exact within their stated scope."*

**This is a picture of a positional difference that asserts nothing about which is better.** It is
the diff view, and the analogy is exact: a code diff does not tell you which version is correct,
and nobody has ever wanted it to.

Material is the trivial case and is already solved elsewhere in the codebase: `materialBalance(fen)`
ships and `GroupPanel.svelte:62-73` renders a `Material` row; `CompareView` has every FEN and does
not `[V]`.

Three constraints, all of which the repo learned the hard way:

1. **Scoped, not merely stated.** `design/05:71`'s correction is binding: *"b5 is denied **while
   the a4 pawn stands**"*, never *"can never use b5 again"*.
2. **One fact per overlay, with its caption, deduplicated at construction.**
   `rfc/evidence-presentation.md` §3.5's one-fact rule exists because the measured worst case
   produced **11 captions, 19 marks and 9 unique squares** from a single gesture. A "here is
   everything that differs" cloud is that failure at compare scale.
3. **Selected, not dumped — and this is the actual blocker.** See §7.3.

---

**Layer 4 — the recorded trajectory, properly drawn and properly attributed.**

`magnitude_trail` per §3.4: a real `<svg>`, a **stated** vertical extent (an auto-scaled evaluation
chart *"makes a 0.2-pawn drift look like a catastrophe, which is a graded move by geometry"*), a
zero reference, keyboard-addressable points, and a table available without hover. One convention
for the whole trail, rendered inside the component. This also collapses §1.2 defect 7's three
inconsistent renderings into one.

Two constraints specific to the compare surface:

- **No cross-branch delta.** `docs/n-way-comparison.md:11-12` forbids it and this spec does not ask
  for it. Two trails may share an axis; the product does not subtract them and does not say which
  is higher.
- **The convention includes the resistance each branch faced** (D3). A trail comparing an attempt
  against band 1200 with one against band 1900 is not a comparison; it is two unrelated
  measurements sharing an axis. Where the branches differ in resistance, the honest rendering is
  not to hide the trail but to **state the incomparability on the chart itself**.

And **mid-run this layer is empty by design** (§1.3): `comparisonWithoutEngineFeedback` blanks the
evidence before disclosure. That must render as `abstention` with its reason
(`rfc/evidence-presentation.md` §3.11), not as an empty box — the difference between *"withheld
until you finish"* and *"broken"*.

---

**Layer 5 — the outcome, in the vocabulary the product actually teaches.**

`convert / hold / save / resist` (`01-training-model.md`, quoted at `design/05:277`) is the
product's own outcome language and the right terminal comparison: *you held this one and lost that
one* is a sentence a learner acts on. Today the same information renders as
`objective {consequence?.objectiveState ?? "unknown"}` (`:148`) and a raw outcome enum (`:87`) —
`rfc/evidence-presentation.md` §3.9's `enum_state` over a total label registry is the exact repair,
and criterion 4 names `CompareView.svelte:87` as its RED case. `BranchConsequence.outcome` is
already on the payload and CompareView **re-derives it by rescanning `run.events`** at `:51-59`
`[V]`, which is a second bug in the same line.

`theory` belongs here too (§1.2 defect 4): *"this attempt left book at move 11; this one stayed in
it to move 16"* is a comparison in the learner's own vocabulary, and `LineMembershipEntry` already
carries it per ply.

---

### 7.3 The blocker nobody can design around: selection

Layer 3 is where the design instinct says "draw the structural differences" and the measurement
says that is currently unbuildable **as a default**.

[[D78]] `[V]`, over 44 real authored fork sets and 473 column plies: 7.32 entries/ply, firing on
**97.3% of plies**, **1.017× lift**. [[D542]] `[V]`, over 754 transitions / 717 played moves /
19,636 legal alternatives: five detector kinds sit **below 1.0 lift** — firing *more* on the move
you did not play — and are **69.9% of the reading by volume**. [[D359]] `[V]`: the all-on state is
**978 words and 247 seconds at one node**, **4.6× worse in the middlegame** — the phase with no
oracle — than in the endgame.

Read as a UX finding rather than a metrics finding: **a "difference" present at 97% of plies is not
a difference, it is the weather.** Rendering it as squares instead of sentences changes the medium
and not the problem; a board covered in marks at every ply is [[D359]]'s 978 words in a form the
learner cannot even skim past.

Note that the *idea* is already implemented correctly and only the discrimination is missing:
`compare-strips.ts:64-66,76` computes the intersection across compared branches and drops what is
common to all — *"the only difference-finding in the system"*. It is an exact filter over an
indiscriminate pool, so it removes the universal and keeps the merely ubiquitous.

So Layer 3's honest specification has a gate in front of it:

> **The structural diff overlay ships when a selector exists that can put a bounded number of
> differences on the board — and it ships showing that number, never the pool.**

The gate is not this dossier's to close. It is F2/F5's — [[D78]]'s own row says *"F2/F5 must select
eligible signed events/modules rather than treating CR1 as sufficient"* — and
`rfc/module-registration.md` has already set the budget: `compare_coach` carries **2 facts / 60
words / 2 marks / 2 arrows** (`:263`). **Two marks.** That is the right order of magnitude and it
is two orders below what the pool offers.

**What ships before the selector exists, and it is not nothing:** Layers 1, 2, 4 and 5 have no
selection problem at all. The divergence move is one fact. The equivalence partition is exact
arithmetic. The trail is one recorded series per branch. The outcome and theory membership are one
value each per branch. **Four of the five layers are gated on presentation work alone.**

### 7.4 What cannot be visualised, and must be narrated

Some differences genuinely resist a picture. Naming them and saying why is more honest than
inventing a chart for them.

**1. Why the difference mattered.** A picture can show that the c-file is open in one branch and
not the other. It cannot show that this is why the attack arrived two moves earlier. Causation is
not a property of a position; it is a claim about a sequence. `design/05:461-465` is exact: *"the
facts are rung 0 and the judgement is rungs 2–5. A surface that renders the facts and attributes
the judgement is honest at any level of the ladder; one that blurs them is the dashboard AGENTS.md
names as the anti-pattern."* So *what differs* is drawn; *why it mattered* is narrated with its
source attached — an authored claim with provenance, or an explicit abstention. Chessigma's own
Coach Brief is the live example of the failure mode `[V]`: true rung-0 arithmetic (*"Three of your
eleven losses were already won. Save rate sits at 20%"*) laundering an invented causal clause
(*"The blunders aren't bad ideas. They're rushed ones"*).

**2. Plans, and therefore most middlegame differences.** A plan is an *intention across moves*. Two
branches can reach materially identical positions by different plans, and the difference — the
thing the learner actually did differently — has no board representation because it is not on the
board. `design/05:504` records the shipped consequence: **no plan-family objective type can express
"a plan happened."** §5c's answer is to grade a plan by its structural signature, which needs the
feature-level predicates exploration Q4b owns and that do not exist yet. Until they do, plan
differences are narrated **from the learner's own `intent` string** — which is precisely why that
field is the most valuable one in the fork modal and why it is a defect that compare ignores it.

**3. Prophylaxis and every other negative difference.** *"A denial move — a pawn played so the
opponent cannot do something — is invisible to every eval-first tool, because nothing happened"*
(`design/05:474-477`). The branch where you stopped the knight reaching d5 differs from the branch
where you did not by **an absence**. Rung 0 can *state* it — the enumeration is exact — but there is
no picture of a thing that did not occur. The scoped sentence is the rendering; Layer 3's overlay
can mark the square while the sentence carries the scope.

**4. Time and practical difficulty.** Two branches can be objectively equal and wildly different to
play. D331 refuted time *as a difficulty lever* (`time-as-a-difficulty-lever.md`, `790a4de`), and
R4/R9 proved the middlegame has **no oracle** for practical difficulty
(`practical-difficulty-outside-tablebase.md`, `human-outcome-coverage-depth.md`). What we *can*
render is the human-model fact — *"players at your band split three ways here"* — a statement about
a distribution, not about chess (`design/05:548-552`). What we cannot render is *"this one was
harder"*, and we should not. (`node.createdAt` gives per-ply wall time and is unused; it is a
*record*, not a difficulty claim, and must not become one.)

**5. Anything with fewer than two recorded points.** `rfc/evidence-presentation.md` §3.4 is right
that a trail of length 1 renders as a `magnitude`, not a one-point chart. Extended to compare: a
comparison where one branch has three plies past the fork and the other has thirty is not a
comparison of two lines, and drawing it as one is a lie of geometry. Today an absent column renders
as `opacity:.45` plus *"Line ended"* (`:96`) with **no indication of why or at which offset** —
`ownForkOffset` is on the payload and unrendered.

### 7.5 One presentation idea worth stealing outright

ChessMotive ships the corpus's only real comparison surface, and its *shape* transfers even though
its *axis* does not. `teardown-chessmotive-desk.md` §2d `[V]`: a **two-column `user` vs `model`
table, one row per step** — `Initial candidates`, `Shortlist`, `Final Move`, `Critical line`,
`Objective`, `Practical` — each row carrying an **`isMatch` flag**, under the copy *"Compare what
you entered with the model answer in the same order you solved."* §5 calls it *"the step-indexed
process transcript"* and its single best idea, because it turns *"did you find the move?"* into
*"where did your process break?"*

The transferable part is **row-indexed alignment with a per-row same/different marker**. Ours is
indexed by **aligned ply** rather than by process step, and the marker is `ComparisonRow.groups` —
which we already compute (Layer 2). Their axis is attempt-versus-authority, which
`design/00-thesis.md:114-119` already records as **not** our claim; ours is attempt-versus-attempt,
which is. So we take the layout and keep the axis.

And there is direct user demand on record for exactly this. `teardown-taketaketake-desk.md` §2c
`[V]` App Store, a 1200-rated player with 100 games: **"I wish game review showed me maybe the top
3 lines I could have made instead of just the top engine move."** That is a learner asking, in
their own words, for N-way comparison.

### 7.6 The summary answer

> A learner sees the difference between two branches by seeing **one board with both moves on it,
> with their own stated intent under each**; then **where the lines stopped being the same
> position** and whose move made them diverge; then **which squares differ and who controls them**,
> bounded to about two facts; then a **properly-scaled recorded trail with its resistance stated
> and no cross-branch delta**; and finally **the outcome in convert/hold/save/resist, with where
> each attempt left book**. Causation, plans, prophylaxis and practical difficulty are narrated
> with their grounds attached, because they are claims about sequences and intentions rather than
> facts about positions, and a picture of them would be a picture of a judgement.

The one-line version, which is also the acceptance test:

> **The compare surface should make the learner say *"oh — I played the same position two ways"*,
> not *"the second one scored higher."*** If a redesign makes the second sentence easier to say, it
> has built the rejected product with better typography.

---

## 8. The loop as one sequence

Each moment hands something to the next, and the handoffs are where the loop is currently broken.

| Moment | Hands forward | Shipped? |
|---|---|---|
| Commit | a recorded decision | ✅ |
| Consequence | an outcome and a disclosure boundary | ✅ |
| Rewind | a preserved first attempt | ✅ mechanically; ❌ never said (R2) |
| Branch | a hypothesis (`intent`) and a second attempt | ✅ captured; ❌ dropped at compare (B1, defect 2) |
| Compare | a conclusion about the difference | ⚠️ surface exists, reads as an inspector (§7) |
| Replay at resistance | a new attempt at a stated band | ❌ no gesture (D1); band not stated (D3) |

Two of the six handoffs carry nothing, and both failures are at the end — which is exactly where a
loop has to close to be a loop. **The product's core interaction currently runs five-sixths of a
circle.** Add to that §1.3's finding that the review surface offers **no compare door at all**
([[D687]]–[[D689]]), and the loop does not close from the review side either.

---

## 9. What this asks of documents this dossier may not edit

Law 5 binds: `design/00`–`06` are intent tier. Three recommendations need intent that does not
exist. Each is named as an owner decision, not proposed as a change.

1. **Whether a compare surface may render the learner's own committed moves as board arrows during
   review.** §7 Layer 1 depends on it. The reading offered here is that it needs no new permission
   — `design/05` §3-forms distinguishes learner-drawn (a) from system-drawn (c) marks, and a record
   of the learner's own move is neither an assertion nor a recommendation. But `design/05:199` says
   form (c) *"has no producer yet"* and [[D1429]] holds that the `arrows` preference is read by no
   renderer at all, so the reading should be confirmed rather than assumed.
2. **Whether "declare done" is a first-class run verb** (§3, P3). `design/06:580` uses the phrase
   for encounters; extending it to the general in-run consequence exit is an intent question about
   what a run *is*, and it is the difference between an exit that reads as failure and one that
   reads as completion.
3. **`design/05` §3-forms' component-layer amendment**, already owed as
   `rfc/evidence-presentation.md` Discharge D1 and not re-requested here. Every rendering
   recommendation in this dossier sits on that layer.

---

## 10. Owner decisions this spec surfaces

Genuine forks where the evidence is in and the call is the owner's.

| # | Decision | Why it is a decision, not a finding |
|---|---|---|
| 1 | **Does the earned-rewind counter appear anywhere during play, or only at earn-time and in the run summary?** (§4 R3.2) | Both are defensible. Always-visible is honest and makes the resource strategic; earn-time-only protects the learner from being charged emotionally at the moment of the mistake. [[D945]] rules the economy, not its surface |
| 2 | **The reveal window survives the rewind — is that stated to the learner?** `docs/branch-runtime.md:225` `[V]`: under `attempt_end`, *"an outcome opens delivery, rewind leaves it open, and the next committed move closes it."* A learner who reveals, then rewinds, carries the answer into the retry. Almost certainly correct design — you must be allowed to see the answer to try again — but the retry is knowingly contaminated and the learner does not know it | Disclosure semantics are intent. Stating it costs a sentence; not stating it means the second attempt's honesty is silently different from the first's |
| 3 | **Do we ship personas over bands, and do we add rungs?** (§6 D2) `teardown-chessigma-desk.md:382-390` clears the doctrine; our measurement licenses five to nine rungs and we ship four | A product-identity call. Personas are the field's most-loved presentation of difficulty and we have no characters at all |
| 4 | **[[D1313]]'s reveal-budget alternative** — pricing *looking* rather than *retrying* — is ledgered as never having been among the options behind [[D945]] | Not a reopening. The row exists so the option is visible when R6 re-tables the numbers; this spec's §4 assumes [[D945]] stands |
| 5 | **Does an optional pre-commit intent capture (§2 C3) belong in rehearsal at all?** ChessMotive and Qchess show real appetite; it also adds friction to the most frequent interaction in the product | A pedagogy call about whether declaring a plan before playing it is rehearsal or homework |

---

## 11. Load-bearing `[P]` claims, and what would settle each

Per the commission's instruction. Nothing in the competitor pass was hands-on this session;
`competitor-play-ux.md:8-13` says the same of its own, and `teardown-cet.md` remains the corpus's
only hands-on session.

| Claim | Load it bears | Settled by |
|---|---|---|
| **Chessigma's Bot Challenge does not preserve a second attempt** `[P]` — inferred from silence across every fetched surface plus the aggregate-metric orientation (`teardown-chessigma-desk.md:136,450`) | **The discriminator in §0.1**, and therefore §7's urgency | One €12 month, two attempts at one position, checking whether the first is retrievable. The teardown's own §9 residual 1 |
| **Chessiverse does / does not preserve rewound lines as branches** — vendor page `[V]`-fetched says yes and `competitor-love-hate-sweep.md` declares our uniqueness false on it; **matrix row 58 (`[V]` vendor docs + `[P]` owner hands-on) records `N`, and duplicate row 16 records `P`** | **Whether "preserved attempts" is a differentiator at all.** Three of our own readings disagree, and the duplicate row is itself a matrix defect | 20 minutes of guided play, plus merging rows 16 and 58. **This should be resolved before any positioning leans on preservation** |
| **chessfeed.ai claims saved-branch exploration and checkpoint rewind** — matrix line 27, both cells *"Y claimed"*, unlabelled confidence `Medium`; open verification item since 2026-08-10 | Same as above. `competitor-value-props.md` calls it *"the closest claimed overlap with our core branch mechanic"* | A desk pass at minimum; hands-on to settle. **Never closed** |
| **"Bot at your level" is not a human model** `[P]` (`teardown-chessigma-desk.md:296-298,455-458`) | §6's differentiation argument | ~20 moves at a stated level, logging FENs — the Noctie protocol, `teardown-protocols.md` §2.1 |
| **Dr. Wolf's undo erases the attempt** `[V]`-as-evidence-of-absence across fetched assets | §0's framing of the reflex we are refusing | Hands-on, 5 minutes |
| **Noctie preserves nothing across a takeback** — the teardown's own header says *"Unresolved — needs hands-on. Signal leans 'destroyed/not surfaced'"* | §4's claim that the field conflates going back with being told and keeps neither | Hands-on |
| **Chess.com's Retry is one ply** `[V]` from support docs, not hands-on | §3's claim that the field releases the learner from the consequence | One game review with a blunder in it |
| **Nobody earns a rewind through play** `[V]`-absence over the surveyed set | §4's statement that we design without precedent | Cannot be strengthened by desk research. `README.md` coverage limit 1 applies: the matrix is a snapshot, not a watch, and three real competitors were owner finds |

**Two claims that are already refuted and that this spec therefore does not make:** *"nobody
re-enters a reviewed game into live play"* (Chessigma does, `[V]`) and *"opening → play it out
against a human-like bot is ours"* (ChessMind AI ships it with Maia-2 conditioning verified in the
shipped bundle — the strongest `[V]` in the corpus, `teardown-chessmindai-desk.md` §8.2).

**Limits specific to this pass:** no participant evidence of any kind.
`rfc/evidence-presentation.md` Discharge D9 says the same of its own components — *"no arm of this
RFC establishes that a learner understands a bar"* — and it is equally true here. Nothing below §1
has been tested on a learner. This is a specification derived from measured internals, ruled
intent, and desk competitor research. It is not validated UX; the owner's own play is the
instrument that would validate it.

---

## 12. Recommendations, ordered by what they cost against what they fix

| # | Recommendation | Blocked on | Fixes |
|---|---|---|---|
| 1 | **Render `branch.intent` on the compare surface** (§5 B1, §7 Layer 1) | nothing | The learner's own hypothesis is captured and thrown away |
| 2 | **Render `ComparisonRow.groups` + `actor` — shared / diverged / re-converged, and whose move** (§7 Layer 2) | nothing | The stepper is a coordinate; the data for a map already ships |
| 3 | **Render `BranchConsequence.resistance` as the comparison's convention** (§6 D3) | `rfc/evidence-presentation.md` §5 | Branches played against different opposition are compared as if they were not; the prose already exists and is wired only to the terminal sheet |
| 4 | **One board, both moves, at the fork** (§7 Layer 1) | §9 decision 1 | N boards two hundred pixels apart is the one arrangement that hides a difference |
| 5 | **Rewind offer names what survives; move it after the consequence** (§4 R1/R2) | nothing | §0's refusal is delivered as an absence; the affordance has an undo's timing |
| 6 | **`enum_state` over the compare/rail vocabularies; stop re-deriving `outcome`** (§7 Layer 5) | `rfc/evidence-presentation.md` §3.9 | `objectiveState`, outcome, transitions and *"not classified"* reach learners raw |
| 7 | **Mid-run compare renders `abstention`, not an empty box** (§1.3, §7 Layer 4) | §3.11 | A withheld comparison currently looks like a broken one |
| 8 | **`magnitude_trail` replaces the `●` row, one rendering not three, no cross-branch delta** (§7 Layer 4) | §3.4 | The only chart in the product encodes nothing; the same data renders three inconsistent ways |
| 9 | **Stop calling the compare surface an inspector** (§1.2 defect 9) | nothing | Four self-labelled *"Evidence inspector"* headings on the loop's payoff screen |
| 10 | **A compare door in the review surface** (§1.3, §8) | [[D687]]–[[D689]], `rfc/review-map.md` | The loop does not close from the review side |
| 11 | **Replay-at-a-different-band as a compare-surface action; add rungs** (§6 D1/D2) | §10 decision 3 | The loop's last step has no gesture; four rungs where evidence licenses up to nine |
| 12 | **On-board commit echo, non-valenced** (§2 C1) | D840 animation | The one moment the product turns on is peripheral |
| 13 | **Fix piece-route chaining and labelling** (§1.2 defect 10) | nothing | Routes render as `e2: e2 → e4 → e5` and mis-chain on captures |
| 14 | **Earn-loud / spend-quiet economy presentation** (§4 R3) | `rfc/campaign-core.md`; `charges` is unwired | A metered retry reads as a paywall |
| 15 | **Structural diff overlay, bounded to the seat's two marks** (§7 Layer 3) | **F2/F5 selection** — [[D78]], [[D542]] | 97.3% firing at 1.017× lift is weather, not difference |

Recommendations 1, 2, 3, 5, 9 and 13 are blocked on nothing and are, between them, most of the
distance between the surface described in §1 and the one described in §7.6.

---

## 13. Proposed ledger rows

Ids assigned at landing; head was **D1448** at drafting. Not written by this pass.

- 📊 **The compare surface discards the five facts that would make it a comparison, and all five
  already ship.** `ComparisonRow.groups` (the per-ply equivalence partition — no renderer reads
  it), `rows[].nodes[].actor` (so the grid cannot tell your plies from the opponent's),
  `branch.intent` (the learner's stated hypothesis — a rail suffix only),
  `BranchConsequence.resistance` (with `eloHonored`/`eloApplied` per engine) and
  `BranchConsequence.theory` (per-ply book membership). The compare surface's defect is not thin
  data; it is a renderer that reads a handful of its fields.
- 🐞 **A comparison of two branches played against different resistance is presented as a
  comparison, and the prose to fix it already exists.** `rfc/evidence-presentation.md` §5b makes a
  magnitude unconstructible without its convention; a branch consequence is a magnitude claim about
  a line whose convention includes who was on the other side. `resistanceSentences()`
  (`outcome-presentation.ts:108-166`) is written and tested and wired **only** into the terminal
  sheet. [[D91]] is the proof this can diverge silently.
- 🐞 **Mid-run, the comparison is blanked by design and says nothing about it.**
  `service.ts:1368-1370` applies `comparisonWithoutEngineFeedback` before disclosure, so the
  sparkline and both trajectory sections render empty. Correct policy, absent rendering —
  `design/05:41` and `rfc/evidence-presentation.md` §4b at the surface that most needs them.
- 🐞 **`CompareView` re-derives `outcome` by rescanning `run.events` (`:51-59`) for a field already
  on the payload** (`BranchConsequence.outcome`), and then renders the raw enum.
- 🐞 **Piece routes are chained by UCI string-slicing and labelled by origin square.**
  `compare-strips.ts:85-91` renders `e2: e2 → e4 → e5` and mis-chains on captures, promotions and
  two pieces crossing one square.
- 💡 **The rewind is an always-present control and therefore has an undo's timing.**
  `Timeline.svelte:84-98` gates *"Rewind to preview"* only on write permission. `design/05:39`'s
  distinction — an undo says the move did not happen, a fork says it happened — is a **timing**
  property, and the shipped affordance does not have it.
- 💡 **The compare surface labels itself *"Evidence inspector"* four times**
  (`CompareView.svelte:131,132,136,161`) on the screen carrying the product's one originality
  claim. The rejected shape by self-description.
- 💡 **The fork modal asks for a machine name before the learner's hypothesis.** Label (defaulted
  `alt-{n}`) precedes Intent (*"What are you testing?"*); the runtime already generates `alt-N`
  implicitly, and the intent is the only record of *why* two attempts differ.
- 📊 **The reveal window survives a rewind and the learner is not told.**
  `docs/branch-runtime.md:225` — under `attempt_end` an outcome opens delivery, rewind leaves it
  open, the next committed move closes it. Correct design, undisclosed consequence: the retry is
  knowingly contaminated. §10 decision 2.
- 🐞 **Three of our own readings disagree about whether Chessiverse preserves rewound lines as
  branches, the matrix is carrying a duplicate row for it, and the disagreement sits directly under
  our positioning.** `competitor-love-hate-sweep.md` §1 cites the vendor page `[V]` and declares
  the rewind + branch + theory combination no longer unique; `competitor-matrix.csv` **row 58**
  (`[V]` vendor docs + `[P]` owner hands-on) records persistent branch attempts `N` and the gap
  *"No preserved branch comparison"*; **row 16**, an unmerged duplicate, records `P` and
  `Y restart` at `Medium-High`. The owner-hands-on reading is the one saying they are not
  preserved. Compounded by **chessfeed.ai** (row 27, *"Y claimed"* on both branch preservation and
  checkpoint rewind, confidence word `Medium`, primary unit *"AI branch exploration"*), open as a
  verification item since 2026-08-10 and never closed. Two actions: merge the duplicate rows, and
  close the chessfeed.ai item before any positioning leans on preservation.
- 💡 **The shipped resistance ladder is four rungs where our own measurement licenses five to
  nine.** `App.svelte:391` offers 1000 / 1400 / 1800 / 2200 — steps of 400 against a measured
  minimum usable step of ≈150–208 (`maia-band-outcome-transfer.md`, 16,660 games) over a
  publishable `[1000, 2400]`. Honest but coarse: "slightly harder" is not on offer.
- 💡 **Layer 3 of the compare answer is selection-blocked, not presentation-blocked.** [[D78]]
  (97.3% firing, 1.017× lift over 44 real fork sets) and [[D542]] (five kinds below 1.0 lift,
  69.9% of volume) together mean a structural difference overlay drawn today would be [[D359]]'s
  978 words as marks. `compare_coach`'s declared budget is **2 marks**
  (`rfc/module-registration.md:263`) and that is the right order of magnitude.
- 💡 **The loop does not close from the review side.** `review-map-and-reentry.md` §1.3 `[V]`: a
  selected moment offers one door — *"Re-enter and play from here"* — and no compare action
  ([[D687]]–[[D689]]). `docs/review-map.md` does not exist and the `review_map` module's evidence
  disposition is `experimental` pending consumer compilation (`evidence-catalog.ts:822`).

## Coverage-matrix row (proposed)

| Area | Feeds | Status | Report |
|---|---|---|---|
| Core-loop UX from the user's side — commit, consequence, rewind, branch, compare, replay-at-resistance; the expectation-versus-doctrine tension; the compare-visualisation answer and its selection gate | owner commission 2026-08-24, B1/B3 residuals, `rfc/evidence-presentation.md`, `rfc/module-registration.md`, [[D945]], [[D78]]/[[D542]], [[D687]]–[[D689]] | covered `[V]` shipped-state (read at `f2ddba55`) + `[P]` competitor (desk, inherited; no hands-on this pass); **no participant evidence**; surfaces two unreconciled corpus contradictions (Chessiverse, chessfeed.ai) | `ux-core-loop.md` |
