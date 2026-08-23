# The UX work lane — what to fix so a person can use this

**Date:** 2026-08-16
**Input:** `planning/app-reality-check.md` (hands-on audit, same day), `design/05-in-run-experience.md`,
`design/03-product-breadth.md`, a full read of `design/BACKLOG.md`, and a source pass over
`apps/web/src`, `apps/server/src/pack-registry.ts`, `packages/runtime/src`, `compose.yaml`, `Makefile`.

**Scope note.** This is a measurement-and-sequencing pass. **No code, ledger, or design doc was
touched, and nothing was fixed.** Row ids are proposed from **D488** (D487 is the high-water mark
in `design/BACKLOG.md`); none written.

**Evidence labels**
`[SRC]` — I read it in source at current HEAD and quote it.
`[APP]` — observed in the running app by the 2026-08-16 audit; I did **not** re-run the app.
`[GIT]` — established from commit history.

---

## 0. The one-paragraph answer

The audit found the loop works and the product is empty and hostile around it. Reading the source
underneath it changes the shape of the problem in one important way: **most of what makes this feel
unfinished is not deep, and a surprising amount of it is recent regression rather than absent work.**
The board is 352 px because of one CSS `calc()` with a magic constant, while the *mobile* branch of
the same stylesheet already does it correctly. `<select>` is unstyled because it is the one element
missing from a global `font: inherit` list. And the single loudest complaint — a chessboard with no
legal-move highlighting — is **eight hours old**: `f304384` (today, 11:44) flipped
`SILENT_ASSISTANCE.boardLighting` from `"legal"` to `"off"` inside a seven-file batch called *"close
permission and selection residuals"*, on a uniformity argument about a constant, and the docs tier
still describes the old behaviour `[GIT]` `[SRC]`. That is the accident this lane is mostly about.

There are exactly **two** things here that are genuinely large: authored content reaching a learner
(§5, owner-blocked) and campaign mode (unbuilt, out of scope for this lane). Everything else in
passes A–D is one implementer, one pass at a time.

---

## 1. The hardest judgement: silence-by-default and the hostile first run

The brief asked me to separate two claims the design tier fuses, and to check whether the assistance
ladder actually forbids legal-move highlighting or whether it was swept in. **It was swept in, and I
can date the sweep.**

### 1.1 The two claims

> **Claim A (ruled, correct, keep).** During committed play the product does not volunteer what it
> knows *about this position*. `05` §3a; ADR-0006. The reason is stated and good: *"A product that
> tells you your knight has no outpost before you move is not letting you rehearse a consequence; it
> is coaching you past the mistake that would have taught you."*

> **Claim B (never ruled, arrived by accident).** The board should render nothing beyond the
> position — no legal-destination dots, no last-move square.

B does not follow from A, and nothing in `05` argues it. What `05` contains is a **parenthetical**,
in a section about *forms*, written 2026-08-14:

> §3-forms, "The config owns the matrix": *"…it grows to pick **forms** per context too
> (`boardLighting`, arrows, spoken — each off by default per §3a)."*

That is the entire design-tier basis for a dark board. It is a list item inside a clause about
rendering channels, and its subject — the sentence it sits in — is *assistance forms*. It treats a
four-value axis whose bottom two rungs are "nothing" and "the rules of chess" as though the whole
axis were assistance.

### 1.2 Five reasons legality is not on the ladder

**(a) §3a's own argument does not reach it.** §3a is about proactive claims *about this position*.
Legal-move dots make no claim about this position; they render the rules, which are identical in
every position and which the board already enforces. `Chessboard.svelte:78-79` computes
`model.dests` regardless; `showDests` decides only whether the learner is *shown* the set the board
will accept anyway `[SRC]`. Hiding it withholds an **input affordance**, not information. A learner
who tries an illegal move gets a silent refusal — that is not "living with the consequence", it is
an unresponsive UI.

**(b) §3-forms' own acceptance test passes it.** The test is stated: *"render the same content as a
sentence; if the sentence would be refused, so is the overlay."* Render it: *"From e2, the pawn may
move to e3 or e4."* Nothing refuses that. `05` §3 names rung 0 as *"legality, attack and defence
maps, discovered consequence, structure descriptions"* — **legality is listed first**, its
"what it can get wrong" cell reads *"Nothing — within scope"*, and none of the 2026-08-14 rung-0
scope corrections (denial is current-not-permanent; option-collapse needs evaluation; pressure
balance depends on pins) touch legality. They constrain the *inferential* end of rung 0. Legality
has no inferential end.

**(c) The repo has already derived the right axis, and legality is below its floor.**
`design/research/coaching-versus-cheating-and-the-band-curve.md` proposes distance-from-the-answer —
`kind` · `fact` · `ranking` · `move` — and places `boardLighting: "sight"` at `fact`. Legal
destinations are not even `fact`: they do not state anything about the position, they state what the
interface will accept. They are off the coaching axis entirely, in the same category as
`05` §3-forms already put learner-drawn marks: *"a mark you draw yourself is your own thought; the
product asserts nothing, so no rung and no disclosure gate applies."* The same sentence, word for
word, is true of the legal-move set.

**(d) The code's own opinion, in three places, is `"legal"`.** Every migration branch in
`assistance-preference.ts:25,26,27` writes `boardLighting: "legal"` when upgrading a v1/v2/v3
preference — i.e. what the authors thought an existing user who never chose lighting should get is
`legal`, not `off` `[SRC]`. And `docs/adaptive-guidance.md:61` still reads, at HEAD:

> *"New contexts start from `SILENT_ASSISTANCE`; its rules-tier `boardLighting: "legal"` is the
> single named exception to literal off."*

**"Rules-tier."** **"The single named exception."** The exception was *named*, in the docs tier,
describing shipped behaviour. It is now false, and nobody updated it.

**(e) It was removed today, by a batch, on a tidiness argument** `[GIT]`. Commit `f304384`
*"fix: close permission and selection residuals"*, 2026-08-16 11:44, seven files, one character
class:

```diff
-  version: 4, …, spoken: "off", boardLighting: "legal", arrows: "off", ambient: "off",
+  version: 4, …, spoken: "off", boardLighting: "off",   arrows: "off", ambient: "off",
```

`design/BACKLOG.md` **D101 ✅** records the rationale in full: *"`SILENT_ASSISTANCE` is now silent in
all nine fields."* That is an argument about the **shape of a constant**, not about a learner. No
`05` ruling is cited. §3a was not amended. `docs/adaptive-guidance.md` was not updated. The BACKLOG
sweep reached this independently: *"the closure of D101 is the direct cause of D484's symptom."*
D326 had already flagged the same field as having *"a broken floor"* — from the other direction,
arguing `"legal"` was not the axis minimum. It isn't. It is the **rules floor**, and an axis about
assistance should not have had it as a member in the first place.

### 1.3 The second casualty nobody has named

`DrillScreen.svelte:882-883` `[SRC]`:

```svelte
showDests={effectiveLighting !== "off"}
highlightMoves={effectiveLighting !== "off"}
```

`highlightMoves` is the **last-move highlight** (`Chessboard.svelte:64`,
`highlight: { lastMove: highlightMoves, check: true }`). It renders a fact the run's own event log
already carries, in a position the run is already showing. Withholding it withholds **history**, not
evidence. `05` §1 says *"The run is the sole source of chess truth. Every move… is in the run's
event log, replayable"*, and §2 region 2 exists to show *"what has happened."* Hiding the square the
opponent just moved from is the invariant working against itself. It was bundled into the same
conditional as a structural-overlay level by a single `!== "off"`.

Note also that `"legal"` is not distinguished from `"sight"`/`"evidence"` for dests — only `"off"`
suppresses them — so the axis has never actually had four behaviours. That is D311(d) and D326's
"collapsed top" seen from below.

### 1.4 What a good first run looks like, without weakening anything

The invariant governs **evidence**. Everything below is in a different category, so none of it
touches §1 or §3a:

1. **Rules rendering is always on.** Legal destinations, last-move square, check. Not a preference,
   not a rung. (Pass B1.)
2. **The last-move highlight leaves the assistance axis entirely.** (Pass B1.)
3. **The silence is disclosed once, in one sentence.** This is the part I want to argue hardest for,
   because it *strengthens* the invariant rather than trading against it. `05` §1 already binds the
   product: **"Absence is stated, never simulated."** Right now the app is silent *about being
   silent* — which is precisely a simulated absence, indistinguishable from an unfinished feature.
   One line — *"Tabiya doesn't comment while you're deciding. Play the move, then look."* — converts
   "this is broken" into "this has an opinion", and costs zero disclosure. (Pass B2.)
4. **Stop leading with the deprivation.** `DrillScreen.svelte:759` currently renders
   *"Authored commentary withheld until checkpoints"* as the second thing in the status bar `[SRC]`.
   Same fact, stated as intent rather than as a lack. Pure copy. (Pass B2.)
5. **Presets that name the posture, not the axes.** A three-button row — *Quiet (recommended) /
   Coached / Everything* — writing all six profiles at once. Crucially, **"Quiet" is today's default
   unchanged** plus the rules floor. The default does not move; it becomes *chosen and named*
   instead of *encountered as emptiness*. This is the single change that makes the invariant
   legible instead of hostile. (Pass E1.)
6. **The on-ramp is the one profile the design already says should be louder, and it isn't.**
   `05` §3b: guided mode is *"the natural default for the 1000–1400 on-ramp… and off by default
   above, with an explicit intent that it fades."* The shipped `onramp` profile gets
   `SILENT_ASSISTANCE` like the other five `[SRC]`. Turning `guided: "live"` on for `onramp` is not
   a concession — it is implementing a written ruling. (Blocked behind **D308**: the `onramp`
   profile is structurally unreachable from Just Play.)

**What must not change.** `markers`, `humanSplit`, `corpus`, `arrows`, `voice`, and
`boardLighting: sight|evidence` stay off by default in every profile. Those are what §3a is
actually about. Nothing in this lane proposes moving them.

**Summary in one line:** silence was correctly ruled over *evidence*, and then over-applied to the
board's basic legibility — once by a constant flipped on a tidiness argument, once by a `!== "off"`
that bundled a history highlight with an assistance level.

*Proposed row **D496*** — *"`docs/adaptive-guidance.md:61` and shipped `SILENT_ASSISTANCE` have
contradicted each other since `f304384`; the only design-tier basis for a dark board is an unargued
parenthetical in `05` §3-forms."*

---

## 2. The passes

Ordered by user impact per unit of risk. Passes A–D are shippable one at a time by an implementer.
Pass E and F need one ruling each. Pass G is the large one and is owner-blocked; **request its
ruling on day one so it unblocks in parallel** rather than sequencing behind the cheap work.

| Pass | Outcome a user notices | Class | Blocked on |
|---|---|---|---|
| **A** | The app stops looking like a prototype | safe | — |
| **B** | The board obeys the rules of chess and says why it's quiet | 1 owner ruling + safe | Q1 |
| **C** | The run has an ending, and failures speak English | safe | — |
| **D** | Modals mean it; three rewind buttons stop meaning three things | safe | — |
| **E** | Settings is a page a person can use | safe (presets ruling optional) | — |
| **F** | Shipped capabilities become reachable | invariant-adjacent | — |
| **G** | There is a library, and its numbers aren't zero | **owner-tier** | Q2, Q3, Q7 |

---

### Pass A — Stop the app looking like a prototype

**User-visible outcome:** the board is the biggest thing on screen instead of the smallest; form
controls match the rest of the typography; no screen has text running together or an enum with an
underscore in it. Nothing behaves differently. **Every item in this pass is pure presentation.**

**A1. The board is 24% of the viewport because of a magic number.** `[SRC]` `[APP]`
Now: 352 px at 1440×900, 256 px at 1280×800, dwarfed by a ~40 px objective headline with ~500 px of
empty space beside it. Should be: the largest element in the column.
Symbol: `DrillScreen.svelte:1276`, `.board-frame { width: min(100%, max(10rem, calc(100dvh - 34rem)), 40rem) }`,
and the outcome variant at `:1286` (`- 42rem`, which at 800 px height resolves *below* the 10 rem floor —
an outcome board is 160 px).
The subtrahend is a fixed guess at how much chrome sits above and below; it is not measured, so the
board shrinks on short viewports regardless of what the column actually contains.
**The fix already exists in the same file:** the `@media (max-width: 719px)` branch at `:1479-1480`
sizes the board with container queries — `width: min(100cqw, 100cqh)` over `.board-slot { container-type: size }`
at `:1470-1473`. Apply the container-query approach to the desktop rule and delete both magic
constants. **Safe.**
*Proposed **D488**.*

**A2. `<select>` is the one element missing from the global font rule.** `[SRC]`
Now: every dropdown in the app renders in OS default chrome under a serif display face — the
"jarring" impression the audit recorded.
Symbol: `App.svelte:876` — `:global(button), :global(input), :global(textarea) { font: inherit; }`.
`select` is absent. Separately, the button skin at `App.svelte:898` is **component-scoped**, so
buttons inside `AssistanceSettings.svelte`, `PackList.svelte` etc. get native chrome too.
Should be: one global control skin — `select` added to `font: inherit`, plus a shared
`select`/`input[type=checkbox]`/`button` appearance using the existing `--panel` / `--line` /
`--ink` tokens. **Safe.**
*Proposed **D489**.*

**A3. Checkboxes render above their own labels.** `[SRC]` `[APP]`
Symbol: `AssistanceSettings.svelte:77`, `label{display:grid;gap:.25rem}`. It was written for the
three `<select>` labels (`:42-44`) and also catches the six checkbox labels (`:45-50`), stacking each
box over its caption — 36 orphaned boxes across six columns. The in-run panel already does it
right: `DrillScreen.svelte:1248`, `.assistance-grid label { display:flex; gap:.4rem; align-items:center; }`.
Fix: scope the grid, or add `label:has(input[type=checkbox]){display:flex;align-items:center;gap:.5rem}`.
**One line. Safe.** Ledgered as part of **D484**.

**A4. `This pack declares: cross_phase.`** `[SRC]` `[APP]`
Symbol: `DrillScreen.svelte:833` — `{#if pack}<span>This pack declares: {pack.phase}.</span>{/if}`.
The same enum is humanised eight lines of code away in `PackList.svelte:35`
(`{pack.phase?.replaceAll("_", " ") ?? "unclassified"}`), which also humanises `mode` and
`reviewStatus`. This is the outlier, not the norm. **Safe.**
Part of **D483**.

**A5. `Branches1 branches · 0 settled · 0 hidden by you · 1 not classified`.** `[SRC]` `[APP]`
Symbol: `BranchRail.svelte:32-36`. `<h2>Branches</h2>` and the counter `<span>` are adjacent flex
children with no separator in the text stream; `"branches"` on `:35` is a hardcoded plural.
Third defect, unreported: **the four numbers use different denominators** — `{branches.length}`
(`:35`) counts every branch while the list below renders only `visible` (`:26`), and `settled`
(`:27`) / `hidden` (`:28`) / `unclassified` (`:29`) each filter differently. Three of the four are
zero on a fresh run, in monospace, before the learner has done anything. Should be: a count when
there is something to count, nothing when there isn't. **Safe.**
*Proposed **D498*** for the denominator mismatch; the rest is **D483**.

**A6. "1 White piece directly attack e3".** `[SRC]` `[APP]`
Symbol: `structural-sentences.ts:23`, `direct_attack_count`. The helper `count()` (`:5`) correctly
singularises the noun phrase, but the verb `directly attack` is a hardcoded plural literal. The
sibling case at `:24` (`piece_reach_count`) avoids it by using `has`. Second, latent: `side()` at
`:4` renders `undefined` as `"Black"` — a colourless observation would silently be attributed to
Black. **Safe** (grammar only; it does not change what is claimed, so law 8 is untouched).
*Proposed **D495**.*

**A7. Keyboard hints are inside the accessible name.** `[SRC]` `[APP]`
Now: screen readers and the a11y tree read *"Fork B"*, *"Compare Tab"*, *"Replay Space"*,
*"Export E"*, *"Close Tab"*, *"Rewind to preview Enter"*.
Symbols: `DrillScreen.svelte:954, 970, 974, 976`; `CompareView.svelte:65`; `Timeline.svelte:95` —
each a `<kbd>` element *inside* the `<button>`, with no `aria-label` override. The visual separation
is CSS only (`DrillScreen.svelte:1341-1345`). Fix: `aria-label` on the button, or move the hint to a
`title`/adjacent element. The non-concatenated presentation already exists in
`KeyboardHelp.svelte:36` and `ShellKeyboardHelp.svelte:40`, so the strings are also duplicated.
**Safe.**
*Proposed **D494**.*

---

### Pass B — The board obeys the rules, and the quiet is explained

**User-visible outcome:** picking up a piece shows where it can go; the opponent's last move is
visible; and the first run tells you *once* that the app is deliberately quiet, instead of leaving
you to conclude it is broken.

**B1. Restore the rules floor.** `[SRC]` `[GIT]`
Now: a new user's board shows no legal-move dots and no last-move highlight.
Symbols: `packages/runtime/src/assistance.ts:17` (`SILENT_ASSISTANCE.boardLighting`), and
`DrillScreen.svelte:882-883` (the `!== "off"` that gates both `showDests` and `highlightMoves`).
Two shapes, and the owner picks (Q1):
- *(a) Minimal.* Revert `boardLighting` to `"legal"` in `SILENT_ASSISTANCE`. One token; restores
  `f304384`; matches `docs/adaptive-guidance.md:61` and all three migration branches; no schema
  change. Reopens **D101 ✅**.
- *(b) Structural.* Remove legality from the axis — `boardLighting: "off" | "sight" | "evidence"` —
  and render legal destinations and the last-move square unconditionally in `Chessboard.svelte`.
  Then no assistance preset can turn the rules off, and D326's "broken floor" is closed by
  construction. Costs a schema version bump (`AssistanceConfig.version` 4→5) and a migration.
Either way, **`highlightMoves` should stop reading the assistance axis at all** — it is history, not
assistance (§1.3).
**Owner-tier — Q1.** Design edit owed: one clause in `05` §3a or §3-forms placing rules rendering
outside the ladder, exactly as §3-forms already does for learner-drawn marks. **Law 5: named here,
not written.**
Ledgered as **D484**; the mechanism is **D101 ✅** / **D326 🐞**.

**B2. Say the quiet part.** `[SRC]`
Now: `DrillScreen.svelte:754-760` renders `YOUR MOVE · AUTHORED COMMENTARY WITHHELD UNTIL CHECKPOINTS`.
The first thing a learner is told is what they will not be shown.
Should be: the same fact as intent. And, once per account, one first-run sentence naming the posture
(§1.4 item 3). No copy proposed here grades a move or names a square — **law 8 clean by
construction**, because none of it is about a position.
**Safe** as copy; **the first-run sentence is a new surface** and needs Q6.
*Proposed **D500**.*

**B3. `boardLighting` cannot be changed from inside a run, and the config is read once.** `[SRC]`
Already ledgered precisely as **D311** (b) and (c): `/settings` and the in-run panel expose six axes
each with only three overlapping, so lighting can only be changed by *leaving* the run; and
`DrillScreen` reads the config once in `onMount` (`:644`), so a `/settings` change does not apply
until remount. **Invariant-touching** — read `05` §3a before widening the in-run panel; adding
`boardLighting` to it is safe under either Q1 answer, adding `markers` is not.

---

### Pass C — The run has an ending, and failures speak English

**User-visible outcome:** when a run finishes, the app says so and stops claiming it is your move;
when an action can't happen, you get a sentence instead of an internal identifier.

**C1. One raw-error choke point produces both of the audit's worst strings.** `[SRC]` `[APP]`
This reconciles two findings the audit reported separately. The chain is:
`runTerminated()` at `packages/runtime/src/errors.ts:48-50` builds
`` `Run is terminal at node: ${nodeId}` ``, where `nodeId` is `` `${run.id}:node:${n}` ``
(`runtime.ts:328`) → `errorResponse` copies `error.message` verbatim (`rest.ts:551`, status 409) →
`RestRunApi.#response` copies it again (`api.ts:1153-1156`) → **`SessionController.#fail`**
(`session-controller.ts`, ~`:653`) stores `error.message` → `DrillScreen.svelte:789` renders it as
`<p class="error" role="alert">`.
So *"Fork 409s with no message"* and *"the terminal message is a UUID"* are **the same event**: the
learner pressed Fork on a terminal run and got the runtime's internal prose. There is no
409-specific copy anywhere in the client.
Fix: a `code → sentence` map applied at `SessionController.#fail` — the single choke point, with ten
call sites already routing through it (`:255, 280, 305, 333, 354, 366, 375, 390, 402, 414`). Start
with `RUN_TERMINATED`, `NOT_ACTIVE_WRITER`, `ASSISTANCE_WITHHELD`. **Safe.** This is the
highest-value item in the lane that is not a one-liner.
*Proposed **D490**.* Symptom ledgered as **D483**.

**C2. "YOUR MOVE" after the run is over.** `[SRC]` `[APP]`
Symbol: `DrillScreen.svelte:754-757` — an inline ternary with three arms (`read_only` / `busy` /
`"Your move"`) and **no terminal arm**. The signal exists and is used two lines away:
`terminalEvent` (`:242-247`) already gates the board (`:881`) and the `TerminalSheet` (`:1029`).
Should be: a terminal state with its own language, and affordances that are disabled *with a stated
reason* (the `HonestControl` pattern at `HonestControl.svelte` is already the house style for this
and is used correctly elsewhere). **Safe** to add the arm; **owner-tier (Q5)** for whether
termination is a first-class run state with its own screen.
Part of **D483**.

**C3. A failed fork eats the learner's typed input.** `[SRC]`
Symbol: `DrillScreen.svelte:602-605` — `closeFork` sets `forkOpen = false` and clears `forkLabel` /
`forkIntent` **before** awaiting `onFork`. On a 409 the dialog is already gone, the typed label and
intent are lost, and the error appears as a banner detached from the action that caused it.
Should be: keep the dialog open until the call resolves; show the failure inside it. **Safe.**
*Proposed **D491**.*

**C4. One fork call site has no `catch` at all.** `[SRC]`
Symbol: `App.svelte:330` — the story-reentry fork (`label: "story-reentry"`). A 409 here rejects into
an unhandled promise and **nothing is shown**. This is the only place the audit's "silent" wording
is literally true. **Safe.**
*Proposed **D492**.*

---

### Pass D — Modals mean it

**User-visible outcome:** when the checkpoint sheet is open, the board behind it is visibly not
available, so a swallowed click reads as "not now" rather than "broken".

**D1. The checkpoint sheet covers the board without disabling it.** `[SRC]` `[APP]`
Now: `CheckpointSheet.svelte:74-75` is `<div class="backdrop"><div class="sheet" role="dialog"
aria-modal="true">`, and `.backdrop` (`:183-192`) is `rgb(20 18 14 / 52%)` + `blur(5px)` with
`place-items: end center` — a bottom-anchored sheet leaving the board plainly visible above it. It
sets **no `pointer-events`, no `inert`, no `aria-hidden`**. The sheet is a *sibling* of
`<main class="drill">` (`DrillScreen.svelte:1007`; main closes at `:1004`), and the board's disable
predicate at `:881` does not mention `checkpoint` at all. **`inert` appears nowhere in
`apps/web/src`.** So the board and the entire branch rail stay focusable and clickable behind an
`aria-modal="true"` dialog, and clicks land on the backdrop.
Should be: `inert` on `main.drill` while any sheet is open, plus a visible dimmed/disabled treatment
so the state is legible before the click. This does not change *what* is blocked — blocking at a
disclosure boundary is correct — only whether the learner can see that it is. **Safe.**
Ledgered as **D485**.

**D2. Two live-looking boards at a prediction checkpoint.** `[SRC]` `[APP]`
`CheckpointSheet.svelte:83-88` mounts a second `<Chessboard>` inside the sheet, live, while the
larger board behind it is dead. No visual cue separates them. D1 fixes most of this; the rest is
labelling the in-sheet board. **Safe.**

**D3. Three "rewind" buttons target three different nodes, and the visible one is the no-op.** `[SRC]` `[APP]`
- `CheckpointSheet.svelte:159` *"Rewind here"* → `DrillScreen.svelte:1023` → `checkpoint.nodeId` — the
  node you are already on. Nothing appears to happen `[APP]`.
- `TerminalSheet.svelte:77` *"Rewind and branch"* → `DrillScreen.svelte:1040` → `currentNode.parentId`.
- The guard prompt *"Rewind this decision"* (`DrillScreen.svelte:810`) → `guardRewindNodeId`
  (`:233-238`), which walks up **two** parents.
Three affordances, three semantics, one shared verb. Should be: either the label distinguishes them
or the targets converge. **Invariant-touching** — `05` §1 *"Rewind is an experiment, not an undo"*
is exactly what these three buttons are supposed to express, so the wording is load-bearing, not
cosmetic.
*Proposed **D493**.*

---

### Pass E — Settings a person can use

**User-visible outcome:** the assistance page has a recommended default you can pick in one click,
each context says when it applies, and the vocabulary appears somewhere other than that page.

**E1. A preset row.** No preset, no "recommended", no way to set six profiles at once — 54 identical
switches instead `[APP]`. Proposal: *Quiet (recommended) / Coached / Everything*, writing all six
profiles through the existing `saveAssistance`. **"Quiet" must be byte-identical to today's default
plus the Q1 rules floor** — the point is to *name* the posture, not to move it. **Safe** given a Q1
answer; the preset itself needs no ruling because it selects among already-permitted states.
Ledgered as **D484**; **D307** is the same finding from the content side (*"six empty localStorage
slots the learner must fill by hand, six times"*).

**E2. Six unexplained identical columns.** `AssistanceSettings.svelte:16` names the contexts
("Curated drill / Just Play / Imported game / Match / Arena / Streamed session / On-ramp") with no
statement of when each applies, and the nine axis names ("Structural sight", "Disclosed evidence",
"Passive markers", "Named-pattern guidance") appear nowhere else in the UI `[SRC]` `[APP]`.
Should be: one sentence of context per fieldset. **Safe.**

**E3. The page is titled "This deployment".** `App.svelte:833` — for a page whose primary content is
personal preference; the deployment facts are the *second* section (`AssistanceSettings.svelte:57`).
**Safe.**

**E4. `ambient` renders a control that does nothing.** `DrillScreen.svelte:764` —
`<button aria-label="Open assistance">♟</button>` with no `onclick`. A live status glyph mislabelled
as a control. **D311(a)**, already ledgered `[SRC]`.

**E5. The intent docs record the opposite defect.** `design/03-product-breadth.md:297` and
`planning/exploration/gates.md:152` both still carry *"Residual: `/settings` remains display-only"*,
which **D311 🐞** retracted and **D397 ✅** closed `[SRC]`. **Owner-tier (Q8)** — law 5. Named here,
not written.

---

### Pass F — Reach the unreachable

**User-visible outcome:** two shipped server capabilities become things a person can press.

**F1. `simulate` / `simulate-enter`.** Routed at `rest.ts:653`, handled at `:1489`/`:1497`;
`apps/web/src/lib/api.ts` has **no `simulate` method** `[SRC]`. The client can only *display*
`origin: "simulated"` (`BranchRail.svelte:54`, `CompareView.svelte:83`) — it can never create one.
B3's *"simulate-all authored variations"* is unreachable from a browser. Ledgered as **D313**
(*"the largest implemented-with-no-entry-point in the repository"*). **Invariant-adjacent** — a
simulated line is not a played attempt, and `05` §1 (*"An attempt is never destroyed"*, *"Rewind is
an experiment"*) means the rail must distinguish them; the rail already has the `origin` field to do
it with.

**F2. `duplicateRun`.** Declared `api.ts:631`, implemented `:821`, **called by no component** `[SRC]`.
B7's "duplicate" is unreachable. **D314**. **Safe.**

**F3. Just Play cannot open disclosure mid-run.** **D308**, already measured to the line:
`attempt_end` is forced by three fences (`session-controller.ts:271`, `rest.ts:368`, `events.ts:157`),
`permittedAssistance` keys four axes off `deliveryOpen`, and `api.reveal` has two call sites, neither
in `DrillScreen.svelte`. The ledger costs it at *"one control at `DrillScreen.svelte:712-726` plus an
`onReveal` prop at `App.svelte:574"`* and calls it the **highest cost:value ratio in the audit**.
**Invariant-touching** — this is exactly the §6 open question 1 (availability on request), so read
`05` §3a-i before touching the fences. The fences are right; the missing thing is the control.

---

### Pass G — There is a library, and its numbers aren't zero

**User-visible outcome:** more than one pack, none of them a schema fixture, and evidence that is
not a column of `+0.00`. **This is the dominant finding and the only large one. It is owner-blocked
— request Q2/Q3/Q7 on day one.**

**G1. Production serves one pack, and it is the schema example.** `[SRC]` `[APP]`
`PackRegistry.loadDefault` (`pack-registry.ts:310-344`) builds
`productionPaths = [fixture, ...jsonFiles(content/packs/)]` — the fixture at `:319-321` is
**hardcoded and unconditional** — while `draftPaths` is non-empty only when `options.development === true`
(`:332-338`). `compose.yaml` never sets `NODE_ENV`; `content/packs/` holds only `.gitkeep` (verified
at HEAD). Ledgered three times over: **D481**, **D162**, **D138**.
Note for whoever implements the disclosed-draft option: `channel` is **hardcoded `"official"`** at
`pack-registry.ts:290` and `:303` for every file-loaded pack, and typed
`"official" | "community"` at `:42` and `:52`. A disclosed draft channel is therefore a *type
change*, not a config change — which is part of why it is a ruling (Q2). Separately, whether a
schema fixture belongs in the production library at all is its own question (Q3), and it is coupled:
removing it without Q2 leaves the library at zero.

**G2. Every evidence number is zero by default.** `compose.yaml` sets
`ENGINE_MODE: ${ENGINE_MODE:-mock}`; `make up-engines` sets `ENGINE_MODE=maia` and is not the
documented default (`Makefile:84,87-88`) `[SRC]`. So the comparison view — the best screen in the
app — reports `+0.00` in every cell `[APP]`. Either `make up` gets engines, or the mock state is
**disclosed on the surface** rather than rendered as a number. The second is cheap and is what §1's
*"Absence is stated, never simulated"* requires: a `+0.00` from a mock is a **simulated absence**.
**Owner-tier (Q7)** for which; the disclosure half is **safe** and can ship immediately.
Part of **D483**.

**G3. `PackList` has no search, filter, sort or grouping.** `PackList.svelte:30-48` is a flat grid
`[SRC]`. Invisible at one pack, hostile at 56. **D316** already carries this
(*"`PackList` renders a `phase` chip with no filter/sort/grouping"*, and `shapeRecommendations`
*"drops its `packIds` and dumps you on an unfiltered grid"*). **Safe** — but pointless before G1.

**G4. Every empty state states absence and offers no way out.** Six of eight surfaces are pure empty
states on a fresh account `[APP]`. `App.svelte:558, 667, 708, 716, 747, 807, 829` `[SRC]`. Home is
the only one with an action (`:560`, "Go to Play"). The copy is honest — *"No milestones yet. They
record revisitable events, never a mastery score."* is good writing — but a dead end. Should be:
every empty state carries one action. **Safe**, and largely moot once G1 lands.
*Proposed **D499**.*

**G5. Compare's Overview and Summary disagree about the same two branches.** `[APP]`, source not
traced by me. One branch is called *"2 plies · objective achieved"* and *"0 plies · No moves on this
branch yet"* on the same screen. **Flagged, not diagnosed** — needs its own pass over
`compare-geometry.ts` and `CompareView.svelte`. The adjacent ledgered row is the non-D line 892:
*"The compare surface bypasses the honesty gate"* — `CompareView` renders the unfiltered
`structuralReading` of the leaf node, so the permission filter never runs on the surface with the
most disclosure. That one **is** invariant-touching and should be fixed with it.

---

## 3. Unrouted UX rows already sitting in the ledger

The triage bucketed by code area, so these are scattered. Reading column 1 for status (column 3 is
provenance, per **D419 ✅** / **D459 ✅**), these open rows are UX defects that no pass above owns and
that are not routed anywhere:

**Should be folded into the passes above (they are the same defect, already ledgered):**
D484 → A3/B1/E1 · D483 → A4/A5/C1/C2/G2 · D485 → D1 · D481/D162/D138 → G1 · D311 → B3/E4/E5 ·
D307 → E1 · D313 → F1 · D314 → F2 · D308 → F3 · D316 → G3.

**Open, UX-shaped, and unrouted — these need a home:**

| Row | Why it is a UX defect |
|---|---|
| **D309 🐞** | *"Guided mode is inverted: the mechanism ships ungated and ON, while the switch labelled 'Named-pattern guidance' gates a strictly smaller duplicate."* A labelled switch does not do what it says — and it means §3a's silence is **already violated in code**, in the opposite direction from Pass B. This should be read alongside Q1: the repo is simultaneously too silent about the rules and not silent enough about patterns. |
| **D310 🐞** | *"The pivotal-marker modal is an undeclared chokepoint: three unrelated capabilities render only inside it."* Endgame technique naming, spoken voice and the guided shape list are reachable only if an unrelated detector fired and the learner clicked the marker. |
| **D312 🐞 (c)** | Rung-2 "Analyze missing evidence" is reachable only from an active branch-group panel. |
| **D315 🐞 (a)** | Nobody can vote from a browser; the `rotation` option in the picker **always 400s**; spectator links unreachable. A control that always errors is worse than an absent one. |
| **D84 🐞** | `arrows` is a fully-plumbed no-op — typed, persisted, migrated, permissioned, **read by no renderer**. A settings control that renders nothing. Belongs in Pass E: either remove it from the UI or ship D158 leg (3). |
| **D80 🔨** | Assistance keyed on governance role, not playing status: one seated player at a match gets evidence the other cannot. |
| **D77 🐞** | *"0 of 131 authored feedback claims can reach a learner"* — *"the single largest gap between what the product has and what a learner sees."* Upstream of everything in Pass G. |
| **D78 🐞 / D359 🐞 / D358 💡** | The all-on assistance state is measured **unreadable**: 978 words / 247 seconds at one node, lift ≈1.01×, 4.6× worse in the middlegame. This is the hard evidence that "turn everything on" is not the answer to a hostile first run — it argues *for* presets (E1) and *against* raising defaults. **The strongest quantitative support in the ledger for keeping §3a.** |
| **D167 🔨** | Three-valued claim backing is projected but does not render: *"a mixed claim still looks identical to a wholly machine-backed claim on learner-facing surfaces."* |
| **D115 🐞 / D318 🐞** | Copy defects with honesty consequences: a PV-derived hint reads as a prediction unless its scope is carried; a refusal written for *"may it fire a condition"* is being used to refuse **display**. |
| **line 698 (research ✅ with an unmet residual)** | *"the 720–992 px band (iPad portrait) is worse than the phone"* — *"the drill scrolls like a document"*. **The tablet floor is explicitly unmet** and sits under a ✅ row, so it is invisible to a status sweep. Pass A1 should check it. |
| **line 810 📐** | *"Compare defaults and multi-branch overview"* — *"eligible branches should be checked by default; repeated manual pair selection is cumbersome."* Scheduled, unbuilt, and it lands on the loop's payoff screen. |
| **line 790 💡 / line 809 💡 / line 771 💡** | The owner's own walkthrough complaints about compare: manual selection cumbersome, not enough instruction to judge learning value, no evidence-layer sidebar, no pruning. |
| **line 682 🐞 / line 818 💡** | Nothing in the product can reach a learner who is not on the site; no answer to *"why open it on Tuesday?"*. Not a screen defect — the reason there is no second session. |
| **line 891 🐞** | *"No run-level verdict exists — `attempts` is per branch."* *"Did this run succeed"* is computed nowhere. This is why Pass C2's terminal screen has nothing to say. |
| **D79 🐞** | `stated_reasoning` ships and is used by **0 of 201** checkpoints. A whole checkpoint interaction the learner never meets. |
| **D322 🐞 / D399 💡** | 36 of 45 real authored packs put an **1800** opponent in front of a declared 1400–2000 learner; the on-ramp knob has no encoding. A beginner's first game is against the wrong opponent. |
| **D300 🐞 / D329 💡 / D330 💡** | No cross-pack collection (132 of 156 concepts are singletons), no `sourceGame` so no "more from this game", and **no time control anywhere**. |
| **line 866 / 872 / 873 🐞** | Plan Drill is essentially unauthored; two of four outcome types have zero real content (`save` = 0, the only `resist` pack is a browser fixture); four declared vocabularies have zero usage. Mechanisms the learner cannot distinguish from absent ones. |

---

## 4. Owner-tier questions

Named, not written. All of these change intent, so law 5 puts them with the owner.

**Q1 — Does `boardLighting` govern legality at all?** *(blocks B1, shapes E1)*
Options: (a) restore `SILENT_ASSISTANCE.boardLighting = "legal"` — one token, reverts `f304384`,
matches `docs/adaptive-guidance.md:61` and all three migration branches, reopens D101 ✅; or (b) take
legality out of the axis and render rules unconditionally — closes D326's "broken floor" by
construction, costs a schema bump. Either way a clause is owed to `05` §3a/§3-forms placing rules
rendering outside the ladder. **My recommendation: (b), with (a) shipped immediately as the stopgap.**
Note (b) also fixes D326's collapsed top for free, since the axis becomes three genuinely distinct
values.

**Q2 — Does Tabiya serve unreviewed content to a learner, and under what disclosure?** *(blocks G1,
and G1 blocks most of the product being non-empty)*
`make graduation-report`: 56 drafts, **220 blocking blockers, zero graduable** `[APP]`. Three
honest paths: graduate 3–5 packs properly; ship a disclosed third channel value; or state the
emptiness on the surface. Today's state — correct gate, empty product, **no message explaining it**
— is the one option that serves nobody. Law 8 sits directly on this. Design home:
`04-content-architecture.md`. **D481** proposes the channel remedy; it needs a ruling because
`PackSummary.channel` is a shipped two-value type hardcoded at `pack-registry.ts:290,303`.

**Q3 — Should `schemas/drill_pack.example.json` ever be in the production library?**
`loadDefault` hardcodes it into `productionPaths` with no gate (`pack-registry.ts:319,331`). Today it
*is* the library, and its authored prose reads *"Schema-only annotation; requires human review."*
Coupled to Q2: removing it alone gives zero packs.

**Q4 — Does the `onramp` profile ship with `guided: "live"`, per `05` §3b?**
§3b names guided mode *"the natural default for the 1000–1400 on-ramp"* with an explicit intent that
it *fades*. The shipped `onramp` profile is `SILENT_ASSISTANCE` like the other five. Either §3b is
aspirational or the default is wrong. Blocked behind **D308** (the profile is unreachable from Just
Play) and complicated by **D309** (guided already fires ungated through a different path).

**Q5 — Is "the run is over" a first-class state with its own screen language?** *(shapes C2)*
Today it is an error string. The choice is between adding a terminal arm to a status ternary and
designing a terminal region — `05` §2 owns the regions, `02-product-shape.md` the surface. Note
**line 891 🐞**: there is no run-level verdict to *put* on such a screen, so the two are coupled.

**Q6 — Is there a first-run experience, and may it be modal?** *(blocks B2's one-time sentence)*
Nothing in `03` or `05` describes one. `03` §"After breadth" lists *"better defaults by
mode/rating/history"* and *"visual polish based on real use"* — this whole lane is that list — but
no onboarding. A one-time explanation of the silence posture is a **new surface**, and `05` §3b's
ruling that *"recognition annotates; it does not seize"* argues it must not be a modal.

**Q7 — Should `make up` bring engines, or disclose the mock?** *(shapes G2)*
`make up-engines` exists and is not the documented default. A `+0.00` from a mock is, under `05` §1,
a **simulated absence** — the one thing the invariant forbids. Disclosure is the cheap correct half
and needs no ruling; the default does.

**Q8 — Retract the `/settings` residual.** `design/03-product-breadth.md:297` and
`planning/exploration/gates.md:152` both still say *"`/settings` remains display-only"*, which
**D311 🐞** corrected and **D397 ✅** closed. Two intent documents contradict their own ledger. Also
in scope: `gates.md:139` declares *"B1–B11 all green"* while `design/03` never declares completion,
and the section title says `(B1–B8)` over a table carrying B1–B11.

**Q9 — The campaign build-state banner.** **D486 💡** proposes one line on
`design/06-campaign.md` stating plainly that nothing in it is built. `06` is owner-tier; the banner
must be owner-written. The doc already says *"Nothing here is an RFC. This is intent."* at line 9 —
the gap is that it does not say *"and none of it exists."*

---

## 5. The three highest impact-to-effort changes

Chosen on ratio, not absolute value. All three are presentation or a constant; none touches a
behaviour, a schema, or an invariant.

**1. `.board-frame`'s magic constant → the container-query sizing already in the same file.**
`DrillScreen.svelte:1276` (and `:1286`). One CSS rule, copied from `:1479-1480` where the mobile
branch already does it right. The board goes from **352 px to roughly double that** at 1440×900, and
stops collapsing to 160 px in the outcome state. The primary object of a chess product stops being
the smallest thing on screen. **~2 lines. Safe.**

**2. `SILENT_ASSISTANCE.boardLighting: "off"` → `"legal"`.**
`packages/runtime/src/assistance.ts:17`. **One token**, and it restores legal-move dots *and* the
last-move highlight to every new user's board — because `DrillScreen.svelte:882-883` gates both on
the same `!== "off"`. It reverts an eight-hour-old change made on a tidiness argument, and it puts
the code back in agreement with `docs/adaptive-guidance.md:61` and all three migration branches.
Needs Q1 as a formality (it reopens D101 ✅), but the ruling being asked for is *"revert something
nobody ruled."* **1 token. Owner-tier by procedure, trivial by substance.**

**3. Three CSS edits that kill the "just dumped" impression.**
Add `select` to `App.svelte:876`'s `font: inherit`; promote the button skin at `App.svelte:898` to
`:global`; and stop `AssistanceSettings.svelte:77`'s `label{display:grid}` from stacking checkboxes
over their captions. Together these fix the single strongest visual impression in the app, on its
weakest screen. **~4 lines. Safe.**

**Runner-up, and the highest-value item that is not a one-liner:** the `code → sentence` map at
`SessionController.#fail` (C1). It is the only thing standing between the learner and the runtime's
internal prose, it has ten call sites already routing through it, and it removes
`Run is terminal at node: run-<uuid>:node:4` — the audit's *"single worst instance in the app"* — in
one place.

---

## 6. What I did not check

- **I did not run the app.** Every `[APP]` claim is relayed from `planning/app-reality-check.md`;
  everything I assert independently is `[SRC]` or `[GIT]` at current HEAD.
- **G5** (Overview vs Summary disagreeing) is flagged from the audit and not traced to a symbol.
- I did not measure the **tablet band** (720–992 px) that line 698's residual names; Pass A1 should.
- I did not verify **D309**'s claim that guided mode fires ungated, which would mean §3a is already
  violated in the opposite direction. If true it changes Q1's framing and should be checked first.
- I did not exercise **Create**, **Live** with two participants, or `make up-engines`.

## Ledger identity granted 2026-08-23 — [[D1427]]

This file's seven passes had **no ledger rows**. The ids it proposed from D488 were never written and
were subsequently taken by unrelated work (D488 is K9 latency, D489 a campaign queue row, D495 a
closed fix), so Passes A–G existed only as prose that `make work-index` cannot see. Seven days, zero
rows, zero shipped, against repairs priced at single-digit lines.

The lane is now anchored by [[D1427]], and the surrounding findings by [[D1425]] (the theme catalog
shipped 3 of the owner's 10 schemes, 3 of 4 palettes bespoke), [[D1426]] (the scope audit is blind to
an omission that never words itself as a cut), [[D1428]] (five of six owner UX complaints were
already recorded and none were fixed) and [[D1429]] (the `arrows` decision was drafted and never
asked).

**The lane is live work, not a proposal.** Every pass owes a row before it can be scheduled, and the
routing failure — not the recording — is what let the owner find all six by opening the app.
