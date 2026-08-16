# Two accusations from the wild, turned on our own surfaces

**Question:** two failure modes players named about the incumbents in an r/chess thread
(owner-supplied, 2026-08-15), audited **against our shipped tree** rather than against
theirs. This is not a teardown; no competitor claim is measured here, and none is needed
— the whole point is that the accusations are checkable on us.

1. **Band-tuned flattery.** *"The lower your elo, the more generous it gets with marking
   your moves as brilliant."* We cannot measure another product's internals and should
   not try. The useful question is **whether we do it, or could drift into it**.
2. **The valuable tool is not the prominent button.** The same thread found this on
   *both* major platforms with opposite incentives: one buries free analysis behind a paid
   Game Review so *"many people don't even know the standard analysis tool is there"*;
   the other defaults its app to a crosstable so you must *"scroll down, click the
   computer analysis tab, and then click request computer analysis."* One hides it to
   sell; one hides it by accident. **Same outcome.** Ours would be a third cause:
   `design/05-in-run-experience.md` §3a makes the best surfaces *deliberately quiet*.

**Feeds:** law 8 / ADR-0005, `design/00-thesis.md` §Target player (the on-ramp lane's
three knobs), `design/05-in-run-experience.md` §3/§3a/§3a-i/§3-forms (the assistance
ladder and the silence default), `design/03-product-breadth.md` §70 (phase-oriented
discovery as *"first-class navigation and filters"*), B4, B9, B10, the campaign's
learner-Elo denominator (D332/D365), Q8, Q9.

**Instrument:** direct read of the shipped tree at `d0bc12f`, plus three census scripts
over `content/` (92 pack documents; Node v26.7.0, Apple silicon). No harness is committed
— every number below is a count over committed files or a control-flow read of a named
symbol, reproducible by grep. **Symbols are located by name, not line, except where a
line is quoted verbatim; the tree moves constantly.**

**What is measured and what is argued.** §2–§4 and §6–§8 are counts and control-flow
reads over the shipped tree, `[V]`. §5 and §9 are argument on top of them and say `[M]`
where they are judgement. **No move is graded and no position is evaluated anywhere in
this pass** — law 8 is live here for the obvious reason: the subject *is* manufactured
judgement.

---

## 1. Verdict

**Failure mode 1: we do not do it, and the reason is structural rather than
disciplined — but the discipline is what has to hold, because the structure is about to
change.**

The system **has no learner rating**. The `learners` table (`storage.ts`, `CREATE TABLE
learners`) carries `id, handle, display_name, password_hash, failed_attempts,
locked_until, created_at` and nothing else; the client's `Learner` interface
(`api.ts`) carries `id, handle, displayName, createdAt`. There is no
`learnerElo`, no `declaredBand`, no `selfRating` anywhere in `packages/` or `apps/`
`[V]`. **Band-tuned flattery is currently unreachable because the conditioning variable
does not exist.** Everything that *looks* like a learner band — `targetElo`,
`difficulty.minOnlineRapid` — is a property of the **pack**, authored, not of the person
playing it.

Seven knobs do vary with band. **Six are difficulty; one is disclosure timing; none is
praise** — because there is no praise surface for them to reach. The guard has no
positive arm at all: every condition it can fire on is a *regression*
(§3). And the honesty rails that exist are one-sided in an interesting way: the shipped
`BANNED_JUDGEMENTS` denylist covers the whole **criticism** register and **none of the
praise register** (§5). That is the finding that would matter first if a learner rating
ever lands.

**Failure mode 2: split, and the split is exactly the line the design draws.**

The core loop is genuinely one click. **Compare — the product's whole differentiator — is
one click or one keystroke** from any run, and Fork / Replay / Export sit beside it in a
persistent action bar with keyboard hints (§7.2). That is the opposite of the
accusation.

But three surfaces fail, and they fail in three different ways:

- **The comparison *narrative* — the grounded explanation, the thing `docs/explanation-grounds.md`
  exists for — is the seventh of eight sections on the compare screen, collapsed, below
  the fold, while a `●` sparkline of engine evaluations is expanded by default at the
  top** (§7.3). The prominence order is inverted against our own thesis, and the
  element that *is* prominent is the visual signature of the ADR-0005 anti-pattern.
- **The recorded human-model split — the deepest honest rung we ship — takes five clicks
  and has an unsignposted prerequisite** (§7.4). Turning on "Human move split on
  request" does nothing until "Passive pivotal markers" is *also* on, because the only
  button that requests it lives inside a pivotal-marker modal that renders `[]` when
  markers are off. Nothing in the panel says so.
- **`/settings` offers six of the nine assistance axes**, silently omitting `humanSplit`,
  `corpus` and `voice` (§7.5) — so a learner configuring assistance outside a run cannot
  learn that two of them exist.

**§3a's silence default and an undiscoverable feature are not the same thing, and the
difference is this dossier's central line.** §3a says: *"Assistance is available — the
rail exists, the ladder is honest, the learner may open it — but the default during
committed play is silence."* **Default-off with a visible, labelled, reason-carrying
control is §3a working.** The corpus-counts path (three clicks, every step visible and
signposted, with a rendered sentence saying why it is locked when it is) is the model
case (§7.6). **A control whose stated effect is nil until an unrelated, unmentioned
control is also set is not silence — it is a bug wearing silence's clothes**, and §3a
gives it no cover.

---

## 2. Failure mode 1 — the complete inventory of band-conditioned knobs

Every place in the shipped tree where a threshold, label, grade or piece of feedback can
vary with band, with a **difficulty-or-praise** verdict on each. The test applied
throughout: *a threshold that adapts **difficulty** is legitimate; a threshold that
adapts **praise** is manufactured judgement and ADR-0005 forbids it.*

| # | Knob | Symbol / file | What band does to it | Verdict |
|---|---|---|---|---|
| 1 | **Branch length** (thesis knob 1) | `difficulty.branchLengthTarget`, consumed by `lint.ts` and `pack-validation.ts` (`TRAJECTORY_LENGTHS_EXCEED_PACK`, `RULE_DRAW_ROOT_NEEDS_SEGMENT_BUDGET`) | On-ramp packs cluster hard at **6 plies (24 of 31)**, max 8 but for two outliers at 19; core packs spread **5–20** with 15 undeclared | **DIFFICULTY** — how far the consequence runs before you are asked anything |
| 2 | **Feedback policy** (thesis knob 2) | `pack.feedbackPolicy`, `feedbackDisclosed`/`feedbackDeliveryOpen` in `runtime/src/feedback.ts` | **All 31** `immediate_guard` packs carry `targetElo` **1100–1394**; **all 61** other packs carry **1500–1939**. Perfect separation on the thesis's own 1000–1400 lane boundary | **DIFFICULTY / DISCLOSURE TIMING** — *when* the consequence is shown, not what is said about it. `design/05` §3a-i states the intent verbatim: *"the guard fires post-commit because the pack consented for the learner's band"* |
| 3 | **Guard eval threshold** | `guard.evalSwingCp`; default resolved in `baseGuardConditionSettings` (`guard-conditions.ts:20`, `=== undefined ? 200`) | **Does not track band.** 24 of 31 on-ramp packs declare no `guard` block at all and inherit the fixed 200 cp. Of the seven that declare one, the values are **150 / 200 / 250** and run *against* band: `opponent-intent-early-queen` (targetElo **1150**) declares **150**, `opening-principles-white`/`-black` (targetElo **1200**) declare **250**. The threshold tracks the **drill's subject**, not the learner | **DIFFICULTY, and inert as a flattery vector** — a *lower* threshold means the guard fires on *smaller* mistakes, i.e. more interruption. Even if it tracked band it would move toward more correction, not less |
| 4 | **Guard rules tier** | `guard.rulesTier` (default **`?? true`**, `guard-conditions.ts`), consumed by `applyRulesGuard` in `apps/server/src/guard.ts` | **Nothing.** No pack in `content/` declares `rulesTier` (0 of 92), so the tier is on for every guarded pack via the default. Its two tests are **hardcoded**: `balance(...) - balance(...) <= -3` and `hasUndefendedMajorOrMinor(...)`, over `MATERIAL_VALUES` = pawn 1 / knight 3 / bishop 3 / rook 5 / queen 9 / king 0 (`runtime/src/objective.ts`) | **DIFFICULTY, and unauthorable** — the strongest anti-flattery fact in the tree: an author can turn the tier on or off and can move *nothing else*. There is no knob to soften |
| 5 | **`targetElo` → opponent strength** | `pack.opponentPolicy.targetElo` → Maia `Elo`; recorded back as `eloApplied` | Sets how strong the opponent plays. Bounded by `MAIA3_BAND_RANGE` at validation (`LEG_TARGET_ELO_OUT_OF_RANGE`) | **DIFFICULTY** — the definition of one |
| 6 | **`targetElo` → corpus population** | `corpusPopulation(targetElo, …)` in `apps/server/src/corpus.ts` — `ratings = targetElo === undefined ? all : [largest RATING_GROUP ≤ targetElo]` | Selects **which rating bucket of the Lichess explorer is queried**. The numbers a learner sees genuinely change with band | **MEASUREMENT, disclosed — and the model case.** `renderCorpusPage` (`corpus-sentences.ts`) prints the buckets, speeds and window as its *first* line and `CORPUS_GUARD` as its second: **"These counts say what this population played, not what is good."** The band changes *whose behaviour is being reported*, and the sentence says so. This is a band-varying **measurement**, never a band-varying **verdict** |
| 7 | **Assistance profile key** | `assistanceProfile({ feedbackPolicy, … })` in `assistance-preference.ts` — `if (input.feedbackPolicy === "immediate_guard") return "onramp"` | Selects a **localStorage bucket** for the learner's own saved preferences. `loadAssistance` returns `SILENT_ASSISTANCE` for every profile with no stored value, so the on-ramp's *defaults* are byte-identical to every other context's | **NEITHER — no content changes.** The band picks which of the learner's own six saved contexts applies, and starts all six at silence |

### 2a. The one place where "the lower your band, the more you get" is literally true — and it is the honest kind

Knob 2 has a second-order effect that no design doc names, and it is worth stating
precisely because it is the closest thing in the tree to the accusation's *shape*.

`permittedAssistance` (`packages/runtime/src/assistance.ts`) gates the two on-request
evidence rungs on `deliveryOpen`:

```ts
const mayRequestSplit = (context.role === "solo" || context.role === "host") && context.deliveryOpen;
```

and `DrillScreen.svelte` supplies `deliveryOpen: feedbackDeliveryOpen(run)`.
`feedbackDeliveryOpen` returns `feedbackDisclosed(run)` for any policy other than
`attempt_end`, and `feedbackDisclosed` **returns `true` unconditionally** for
`immediate_guard` (`feedback.ts`, `case "immediate_guard": return true`) `[V]`.

**Consequence:** in all **31** on-ramp packs, `humanSplit` and `corpus` are `"free"` for
the entire run, including before any commitment. In the **61** core packs
(`delayed_checkpoint`), the same two rungs are `"locked_off"` until a checkpoint or
outcome event fires. **The 1100–1394 band gets more assistance, earlier, automatically,
as a side effect of the guard policy.**

**Verdict: DIFFICULTY (scaffolding), not praise** — what the lower band gets more of is
*access to measurements*, and the measurements are identical in content. But it is a
real, unstated widening of the anti-contamination barrier for one band, and `design/05`
§3a-i describes only the guard when it explains what `immediate_guard` does. **Ledger
row proposed (§10, row 3):** either state the widening in §3a-i or narrow
`feedbackDeliveryOpen` for `immediate_guard` to *post-commit* rather than *always*.

### 2b. Deviation classification and `feedbackClaims` — no band input, and no verdict either

- **Deviation classification** (`Deviation` in `packages/schema/src/drill-pack/types.ts`)
  is `{ at, moveUci, class, offObjective?, note?, mistake?, cost?, timingWindowId? }`.
  `DEVIATION_MISTAKES = ["plan","timing","tactical"]` is a **kind**, not a severity;
  `DeviationCost` is `cp | mate | unmeasurable | category`, each carrying an explicit
  `basis` of `engine | material | tablebase`. **There is no band field, no severity
  scale, and no praise class** — the vocabulary has no way to say "good move" at all
  `[V]`.
- **`feedbackClaims`** is `{ id, text, evidenceTypes, principles? }`. Nothing in it is
  band-conditioned; the claim-binding validator (`sourcing/claim-binding.ts`) requires
  every machine-shaped token to be backed by a ledger assertion and every authored
  segment to carry the `author_principle` label. **`targetElo` is not an argument to any
  claim assertion kind.**
- **`objectiveGradeSentence`** (`outcome-presentation.ts`) is
  `state === "active" ? "Objective: T — unresolved" : "Objective: T — " + state` — a pure
  function of `(objectiveType, ObjectiveState)`. No band. `checkpointResolutionSentence`,
  the warmest sentence the product ships, is *"You reached X without conceding the
  result. **That is the end of this drill, not a proof of the position.**"* — qualified
  in its own body, band-free `[V]`.

### 2c. The band is disclosed next to the result, which is the actual antidote

`resistanceSentences` (`outcome-presentation.ts`) renders into `OutcomeContext.svelte`
alongside the grade, and it prints the band twice: `"Requested resistance: human_common,
target Elo 1150 — the pack's request."` and either *"The engine advertised its
rating-band option and recorded target Elo 1150 as applied"* or *"Target Elo 1150 was
requested but is not recorded as applied."* It closes every run with **"Not perfect
play."** `[V]`

**This is the structural answer to the accusation.** Band-tuned flattery works by
detaching the achievement from the resistance. Our outcome panel cannot render the
achievement *without* the resistance — they are the same component, and the band appears
in it whether or not it was honoured.

### 2d. `/learn` refuses the skill number outright

The return-loop surface prints, in shipped copy: *"No milestones yet. They record
revisitable events, **never a mastery score**."* and closes the page with *"This is an
attempt history and return queue, **not a mastery score**."* (`App.svelte`, `route.name
=== "learn"`) `[V]`. The `attempts` list shows `verdict` or the literal string
`"not graded"`, never a percentage. The ChessMonitor finding's posture
(`quickpass-wintrChess-encroissant-chessmonitor.md`) is shipped, not just written down.

---

## 3. Why there is nothing for a band knob to flatter: the guard has no positive arm

`applyRecordedEngineGuard` and `applyRulesGuard` (`apps/server/src/guard.ts`) are the
whole immediate-feedback mechanism. Enumerating every condition either can fire on:

| Condition | Direction |
|---|---|
| `engine_eval_swing` — `centipawnSwing`, `delta <= -threshold` from the learner's side | against the learner |
| `engine_mate_appears` — `mateAgainstLearner(after) && !mateAgainstLearner(before)` | against the learner |
| `tablebase_category_regression` — `CATEGORY_RANK[after] < CATEGORY_RANK[before]` | against the learner |
| `tablebase_dtz_regression` — `|after| - |before| >= byAtLeast` | against the learner |
| rules tier, material — `balance(consequence) - balance(previous) <= -3` | against the learner |
| rules tier, structure — `hasUndefendedMajorOrMinor(consequence, learner)` | against the learner |

**Six conditions, six regressions, zero positive arms** `[V]`. And the guard's output is
not a label: `generate()` appends a `feedback.generated` event whose payload is
`{ nodeId, evidenceRefs }` — **a pointer to recorded evidence**, never a word. The client
renders a frozen string around those grounds (`DrillScreen.svelte`, `class="guard-prompt"`):

> **The consequence exposed something concrete.** … *Your played line stays preserved on
> the branch rail.*

with two buttons, `Play on` and `Rewind this decision`.

**There is no "brilliant" in this product to be generous with.** The accusation's
mechanism — a praise label whose threshold moves — has no host surface here, because the
feedback primitive is a *pointer at evidence*, not a *grade of a move*.

---

## 4. Thesis knob 3 does not exist — `DESIGN-GAP:`

`design/00-thesis.md` §Target player names three knobs. Knobs 1 and 2 are implemented and
measured above. The third is:

> *"principle/threat-shaped objectives ('nothing hanging,' 'answer the threat,' 'convert
> the extra piece') instead of structure/tempo-shaped ones. Opponent-intent checkpoints …
> are first-class here."*

Measured against the corpus and the schema:

- **`OBJECTIVE_TYPES`** (`packages/schema/src/drill-pack/types.ts`) has 12 members —
  `reach_structure, preserve_plan_window, execute_break, prevent_opponent_plan,
  transition_to_endgame, win, hold, save, resist, play_until_checkpoint, follow_theory,
  run_trajectory`. **None is principle- or threat-shaped.** There is no encoding for
  "nothing hanging" or "answer the threat" `[V]`.
- On-ramp packs collapse onto the **most generic** type available:
  `play_until_checkpoint` **28 of 31**, `win` 3. Core packs spread across **10** types
  `[V]`. Knob 3 as shipped is *narrower vocabulary*, which is the opposite of a
  differently-shaped one.
- **Opponent-intent checkpoints are less first-class in the on-ramp than in core:** 6 of
  31 on-ramp packs carry an `intent_capture` checkpoint (8 checkpoints total) against
  **43** in the 61 core packs `[V]`.

`DESIGN-GAP:` the thesis's third on-ramp knob has no schema encoding and no corpus
instance. It is not a flattery risk — nothing about it touches praise — but the lane is
specified on three knobs and ships on two, and the doc should say which.

---

## 5. The latent holes — where the format would *let* an author put praise on a band-conditioned knob

No shipped pack does any of this. All three are reachable today with `pack-check` passing.

### 5.1 `BANNED_JUDGEMENTS` is a one-sided denylist — the top finding

`packages/runtime/src/voice.ts`:

```ts
export const BANNED_JUDGEMENTS = Object.freeze(["weak", "strong", "good", "bad", "better",
  "worse", "advantage", "winning", "losing", "should", "must", "best", "worst",
  "mistake", "blunder", "punish", "wins", "loses"]);
```

The identical eighteen-word set is duplicated as `KEY_POINT_JUDGEMENTS` in
`apps/server/src/pack-validation.ts` `[V]`.

**Every one of the eighteen is a criticism or a comparative. Not one is a praise
adjective.** `brilliant`, `excellent`, `great`, `superb`, `perfect`, `impressive`,
`beautiful`, `accurate`, `precise`, `clever`, `sharp`, `strongest` — none is on the list.

`voiceCheck` (same file) is a **containment** check: `absentWords` flags a listed word
only when it appears in the LLM output and *not* in the source evidence packet. So an
external voice provider returning **"a brilliant practical choice here"** produces
`violations: []` and `valid: true` `[V]`. The exact word from the accusation passes our
LLM gate.

**This is a law-8 hole before it is a flattery hole** — the gate is meant to stop
manufactured judgement in both directions and stops it in one. It becomes a *flattery*
hole the moment anything conditions the voice packet or provider prompt on a band.

**Two further scope limits on the same rail:** `KEY_POINT_JUDGEMENTS` fires only when a
phrase's words are **all** in the set (`words.every(...)`), so "a brilliant knight
manoeuvre" would not trip it even if `brilliant` were listed; and it is a **warning**,
not an error, and it applies **only** to `ReasoningKeyPoint.phrases`.

### 5.2 Authored prose has no vocabulary gate at all

`feedbackClaims[].text` is validated in `sourcing/claim-binding.ts` on exactly three
things: undeclared machine-shaped tokens (`CLAIM_ASSERTION_UNDECLARED`), an authored
segment containing a numeric rate (`CLAIM_READING_UNATTRIBUTED`, `RATE_TOKEN =
/(?:[+-]?\d+\.\d+%?)/`), and the presence of the `author_principle` label
(`CLAIM_AUTHOR_LABEL_REQUIRED`). **There is no denylist on authored claim text** `[V]`.
`objective.summary`, `PlanClass.label` and `PlanClass.description` have none either.

### 5.3 The band-conditioned praise vector the format permits, end to end

There is **no band variable in any condition grammar** — `EngineCondition`,
`guard.overrides[]` (`{ at, moveUci, evalSwingCp, fireOnMate }`, anchored to a *position
or a move*), `SimpleTrigger`, `WindowTrigger` and `SuccessCondition` are all
band-blind `[V]`. **An author cannot write `if band < 1400 then praise`.**

The format permits the same outcome one level up:

```
variantOf: { packId: "X", relation: { kind: "same_root_other_objective" } }
+ opponentPolicy.targetElo: 1150          (vs. X's 1800)
+ a softer objective.successConditions
+ feedbackClaims[].text: "Excellent — a brilliant practical choice."
```

Two packs at the same root, one labelled for a low band, carrying softer prose and an
easier success condition — and **nothing compares them**. `variantOf` is validated for
referential integrity, not for content parity; `objectiveGradeSentence` renders
`achieved` identically for both; and the praise sentence passes every gate in §5.1–5.2.

`DrillScreen.svelte` even renders the link between them (`class="variant-link"`, *"Same
position, other objective"*), so a learner can see both exist — which mitigates it and
does not close it.

**Mitigation already in place, and it is the right shape:** the outcome panel prints the
band alongside the grade (§2c). A learner who reaches `achieved` on the 1150 variant is
told, in the same box, that the opponent was requested at Elo 1150. **The disclosure is
what makes the variant honest; the praise sentence is what would make it dishonest, and
only the disclosure is enforced.**

### 5.4 The one band-shaped sentence in the corpus is unbacked — and it is live today

24 of the 31 on-ramp packs carry the identical `objective.summary`:

> **"Play on from this position for 6 plies against an opponent near your rating."**

Emitted by `emitPositionSeeds` (`apps/server/src/sourcing/position-seeds.ts`), which also
sets `difficulty: { minOnlineRapid: row.rating - 150, maxOnlineRapid: row.rating + 150 }`
and `targetElo: clampElo(row.rating)` — where **`row.rating` is the Lichess *puzzle's*
difficulty rating**, a measure of how hard the puzzle is for solvers, not a measure of
the learner `[V]`.

So the sentence is unbacked twice over: **the product has no learner rating** (§1), and
the number standing in for one describes a puzzle. This is the *"we tuned this to you"*
claim, shipped, with nothing behind it — the exact rhetorical move failure mode 1 is
about, arriving through content rather than through code.

**The system already knows.** The same emitter writes a `graduationBlockers` entry
verbatim: *"objective.summary is the emitter's mechanical placeholder; an author must
replace it with this pack's actual teaching objective before reviewStatus leaves draft"*,
and a second one: *"targetElo clamp [1100, 2000] is an authoring convention, not a Maia
capability claim."* All 31 are `reviewStatus: draft`, and `PackList.svelte` renders the
status on the card `[V]`. **The block is real and the disclosure is real; the sentence is
still what a learner reads today**, because draft packs are listed and playable.

`[M]` This is the cheapest fix in the dossier: replace one emitter string with one that
describes the *position*, not the *reader*.

### 5.5 The standing risk, stated now because the structure is about to change

`design/BACKLOG.md` D332/D365 propose a learner Elo/Glicko-2 rating as the campaign's
progression denominator. **The day that lands, the conditioning variable this whole
failure mode needs comes into existence**, and every threshold in §2 becomes
conditionable by something that is currently impossible to reference.

`[M]` The invariant to pin **before** it lands, and the cheapest possible one, is a
restatement of what the tree already does by accident:

> **A learner rating may select *what* a learner is shown — which pack, which band, which
> population — and may never appear as an input to *what is said about a move they
> played*.** Selection, yes; rendering, never.

That is enforceable as a code rule (`learnerRating` must not reach `guard.ts`,
`voice.ts`, `outcome-presentation.ts`, or any claim-assertion argument) and it is
falsifiable in a diff, which the current answer — *"it cannot happen because the field
does not exist"* — will stop being.

---

## 6. Failure mode 2 — the shape, restated for us

The thread's two examples share an outcome and not a cause. Ours would be a third cause,
and it is one we chose:

| | Cause | What the learner concludes |
|---|---|---|
| Incumbent A | monetization — free analysis behind a paid button | *"the standard tool isn't there"* |
| Incumbent B | default view — crosstable first, analysis three interactions deep | *"analysis is a chore"* |
| **Us** | **doctrine** — `design/05` §3a: *"the default during committed play is silence"* | ??? — and that is the audit |

`design/05` §3a's own words set the standard to audit against:

> *"Assistance is **available** — the rail exists, the ladder is honest, the learner may
> open it — but the default during committed play is **silence**."*

**Available** is a discoverability claim, and it is testable. The question per surface is
therefore not *is it on* — §3a says it should not be — but **can a learner who does not
already know it exists find out that it does**.

---

## 7. Per-surface discoverability, with click counts

Counted from a cold app entry, mouse only. Keyboard equivalents are noted where they
exist and are discoverable only through the `?` dialog (`KeyboardHelp.svelte`, reachable
in 1 click from the run topbar).

### 7.1 Global IA — passes cleanly

`ShellFrame.svelte` renders all eight destinations as persistent top-bar links —
Home, Play, Learn, Review, Live, Create, Library, Settings — plus a skip-link, `aria-current`
on the active one, and a live run-context readout. **Every top-level surface is one
click from every other** `[V]`. There is no nesting, no drawer, and nothing behind a
paywall (there is no paywall).

### 7.2 The core loop inside a run — passes, and is the good case

`DrillScreen.svelte`'s `class="quick-actions"` bar is always rendered beside the
timeline:

| Action | Clicks | Keyboard | Notes |
|---|---|---|---|
| **Compare** | **1** | `Tab` | `selectedCompareIds()` falls back to `[activeBranch, firstOther]` when nothing is checked — **no branch selection is required**. Disabled below two branches |
| Fork | 2 | `B` | button → dialog → *Create branch* |
| Branch group | 1 | — | opens the creator inline |
| Replay | 1 | `Space` | `aria-pressed` |
| Export PGN | 1 | `E` | |
| Rewind | **2** | `R` / `Shift+R` | click a ply in `Timeline.svelte` → *Rewind to preview*. The confirm button renders only `{#if previewNodeId}`, so **the rewind affordance is invisible until a ply is clicked** — a mild version of the same shape, rescued by the `R` shortcut and by ply buttons that look clickable |

**Compare being one click is the single most important result in this section.** The
accusation is that the valuable tool is not the prominent button; here the valuable tool
*is* the prominent button.

### 7.3 The compare surface — **fails, and the prominence order is inverted**

`CompareView.svelte` renders eight sections in this DOM order:

1. header
2. zoom control (Overview / Summary / Boards)
3. boards grid
4. stepper
5. **"Recorded engine evaluation"** — `+0.54`-style scores, expanded
6. **"Recorded branch strips"** — a `●●●●` eval sparkline, expanded, with *Structure and
   timing* and *Piece routes* collapsed inside it
7. **"Comparison narrative"** — `<button aria-expanded>Narrative</button>`, **collapsed**
8. per-branch consequences

**The grounded comparison explanation — `comparisonNarrative`, the output of the whole
`docs/explanation-grounds.md` layer, the thing B4 is gated on — is the seventh of eight
sections and the only substantive one that starts closed** `[V]`. Reaching it: **1 click
to open compare + scroll past five sections + 1 click on *Narrative* = 2 clicks and a
scroll**, on a screen whose CSS is `overflow: auto` at `min(96rem, …)` — so on a laptop
the narrative is below the fold at every zoom level.

Meanwhile the two sections that *are* expanded by default are a row of centipawn scores
and a sparkline of centipawn scores. `[M]` **That is, visually, the ADR-0005
anti-pattern**: the dashboard is the default view of our comparison screen and the drill's
explanation is the disclosure widget. Nothing here is dishonest — every number is a
recorded reading with attribution — but the *ordering* teaches a learner that the eval
trail is the point.

**This is not §3a cover.** §3a governs assistance *during committed play*. The compare
screen is post-commitment by construction — you cannot compare branches you have not
played — and §3-forms is explicit that *"the same arrow drawn during review is fine."*
There is no honesty argument for collapsing the narrative; it is a layout default.

### 7.4 The recorded human-model split — **fails, with an unsignposted prerequisite**

The deepest honest rung the product ships. Its rendering names its own instrument and
band (`DrillScreen.svelte`): `"{engine.name}, rating target {targetElo ?? "unrated"}: e2e4 31% · d2d4 22% …"`.

The full path:

| # | Step | Signposted? |
|---|---|---|
| 1 | Open `<details class="assistance-control"><summary>Assistance</summary>` in the run topbar | ✅ visible label |
| 2 | Tick **"Passive pivotal markers"** | ❌ **nothing anywhere says this is required** |
| 3 | Tick **"Human move split on request"** | ✅ visible, with a rendered `class="honest"` reason when locked |
| 4 | Find and click a pivotal marker dot on the `Timeline` | ⚠️ requires one to exist on this path |
| 5 | Click **"Show recorded human-model split"** inside the pivotal-marker modal | ✅ once reached |

**Five clicks, and step 2 is a hidden dependency.** The mechanism:

```ts
let projectedPivotal = $derived(assistance.markers === "live" ? liveMarkers(run, run.activeCursor.branchId, assistanceContext) : []);
```

`pivotalRows` derives from `projectedPivotal`, `Timeline` renders markers from
`pivotalRows`, and **the only `Show recorded human-model split` button in the codebase
lives inside the `{#if openPivotalNodeId !== undefined}` modal** `[V]`. With `markers:
"off"` — the `SILENT_ASSISTANCE` default — `projectedPivotal` is `[]`, no marker can be
opened, and the modal is unreachable. **A learner who ticks only "Human move split on
request" gets no button, no error, and no explanation.**

`[M]` **This is the finding §3a does not cover.** Defaulting the split to off is §3a.
Making a ticked control inert until an unrelated, unmentioned control is also ticked is
the buried-tool failure with a doctrinal alibi. The fix is one line of copy in the panel
or one condition change so the split button also renders outside the modal.

**Prior art, credited:** `mechanics-by-mode.md` found the same `markers` dependency one
axis over — *"the `guided` switch gates a smaller duplicate needing `markers` on"*. What
is new here is that the dependency also swallows **`humanSplit`**, which is not a
duplicate of anything: with markers off, the human-model split has **no rendering path at
all**, not a smaller one. Two of the nine axes are silently downstream of a third.

### 7.5 `/settings` — **fails: six of nine axes**

`AssistanceSettings.svelte` renders one `<fieldset>` per assistance context (six
contexts: Curated drill, Just Play, Imported game, Match / Arena, Streamed session,
On-ramp) and inside each, six controls: `boardLighting`, `arrows`, `spoken`, `ambient`,
`markers`, `guided`.

`AssistanceConfig` (`packages/runtime/src/assistance.ts`) has **nine** non-version axes.
**`humanSplit`, `corpus` and `voice` appear in no fieldset** `[V]`.

So the two on-request evidence rungs — the corpus counts and the human split, the two
most valuable things on the ladder — **can only be enabled from inside a run**, and a
learner who goes to Settings to see what assistance exists is shown a complete-looking
grid of six that silently omits them. Two surfaces that both claim to configure
assistance disagree about how many kinds there are.

**Prior art, credited:** `mechanics-by-mode.md` established the shape — *"no single
surface configures all nine (6 in `/settings`, 6 in-run, 3 overlap)"*. What this pass
adds is **which** three are missing and why it matters for this audit: the omitted set is
exactly `{humanSplit, corpus, voice}`, i.e. **both** on-request evidence rungs, the two
paths a learner would take to see a measurement rather than a rendering.

### 7.6 Corpus counts — **passes, and is the reference implementation**

| # | Step | Signposted? |
|---|---|---|
| 1 | Open the **Assistance** details | ✅ |
| 2 | Tick **"Corpus counts on request"** | ✅ visible; hidden entirely only when the deployment has no corpus provider (`capabilities.providers.corpus !== "none"`), which is a *capability* fact, not a UX choice |
| 3 | Click **"Show corpus counts"** | ✅ appears immediately on ticking, in the same panel |

**Three clicks, every step visible, and the locked state explains itself**: when
`assistancePermission.corpus === "locked_off"` the panel renders a `class="honest"` span
reading *"Available only after this run opens feedback, and never to participants or
spectators."* `[V]`

**This is what §3a's "available" means, implemented.** Default off; control visible;
reason for unavailability stated; effect immediate. Every other assistance path should be
measured against this one.

### 7.7 `/play` — passes on entry, **fails on the promise in `design/03`**

Two sections, both above the fold: `JustPlayStarter` (side / opponent / optional FEN →
*Start game*, **1 click**) and `PackList` (card grid, *Open position*, **1 click**).

But the grid is flat. There is **no filter, no search and no sort** — pack cards display
`mode`, `phase`, `reviewStatus`, `channel` and `difficultyBand(pack.difficulty)` as inert
chips `[V]`. `design/03-product-breadth.md` §70 promises *"Phase-oriented discovery:
opening/early game, middlegame, endgame, and connected trajectories are **first-class
navigation and filters**."* The phase is rendered and is not a filter. Against a corpus
already at 92 documents and a catalogue-depth phase still ahead, that is the incumbent's
crosstable problem in its early form: the valuable pack is present and unfindable.

`JustPlayStarter` also exposes **no band control** — `mode` only, `human_common` or
`strong_engine` — so the difficulty dial the whole `targetElo` apparatus provides is
unreachable in Just Play. (Already ledgered as the Just Play difficulty row; recorded
here because it is the same discoverability shape.)

### 7.8 `/review` — passes

`route.name === "review"` renders a *Run history* list (each with a single *Open
run* / *Open story* button, **1 click**) above an *Import one game* form, with explicit
copy for the Chess.com case and the line *"Tabiya never links or mines your account."*
The import is a visible form, not a tab behind a tab `[V]`.

### 7.9 `/learn` — passes on structure, **fails on legibility**

Five sections, all expanded, no tabs: Recommended next, Repertoire gaps, Milestones, Due
now, What is recorded. *Go to your biggest gap* is a **1-click** button on the top-ranked
gap.

One defect: the repertoire gap scan renders its population disclosure as

```svelte
<p>{JSON.stringify(page.scan.population)}</p>
```

`[V]` — **raw JSON printed to the learner**, where the equivalent object elsewhere goes
through `renderCorpusPage`'s sentence renderer (§2, knob 6). The honesty is present and
unreadable, which for disclosure purposes is close to absent.

### 7.10 `HonestControl` — **fails, and the name is the irony**

The component whose entire job is to say *why* a control is unavailable renders its
reason **visually hidden**:

```css
.reason { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
          overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
```

`[V]` — so it reaches screen readers and **nobody else**. A sighted learner sees a greyed
*Compare* button and is never told *"Create at least two branches before comparing."*

Seven call sites: `DrillScreen.svelte` ×3 (fork read-only, group read-only, compare needs
two branches), `CompareView.svelte` ×2 (stepper ends), `Timeline.svelte` ×1 (read-only
rewind), `CheckpointSheet.svelte` ×1 `[V]`.

Meanwhile the codebase's *other* honesty idiom — a plain `class="honest"` span, styled
`color: var(--muted); font-size: .68rem` — is **visible**, and is used 28 times across
`App.svelte` and `DrillScreen.svelte` for exactly the same job (the locked-assistance
reasons in §7.6 are these). **The tree has two honesty mechanisms and the one named for
honesty is the invisible one.** `[M]` Making `HonestControl`'s reason visible is a
five-line CSS change and closes seven instances of "the disabled button explains nothing."

---

## 8. Summary tables

### 8.1 Every band-conditioned knob, with its verdict

| Knob | Band-conditioned? | Difficulty or praise | Status |
|---|---|---|---|
| `difficulty.branchLengthTarget` | yes, in practice (6 vs 5–20) | **difficulty** | fine |
| `feedbackPolicy: immediate_guard` | **yes, by design** (1100–1394 vs 1500–1939, no overlap) | **difficulty / disclosure timing** | fine, per `05` §3a-i |
| `guard.evalSwingCp` | **no** — tracks subject (150/200/250 against 1150/1150/1200) | **difficulty**, and inverted (lower = stricter) | fine |
| `guard.rulesTier` + `-3` + `MATERIAL_VALUES` | **no** — hardcoded, unauthorable, default on | **difficulty**, and immovable | fine |
| `opponentPolicy.targetElo` → Maia | yes | **difficulty** | fine |
| `targetElo` → `corpusPopulation()` | yes | **measurement**, disclosed by `CORPUS_GUARD` | **model case** |
| `assistanceProfile → "onramp"` | yes | **neither** — storage key only, all six default to `SILENT_ASSISTANCE` | fine |
| `feedbackDeliveryOpen` always-true under `immediate_guard` | **yes, as a side effect** | **difficulty (scaffolding)** | **undocumented — §2a** |
| `difficulty.min/maxOnlineRapid` | declared on 47 packs | **inert** — sole consumer is `difficultyBand()`, a display string | fine, and worth knowing |
| deviation `mistake` / `cost` | **no band field exists** | kind + measured cost, no severity, no praise class | fine |
| `feedbackClaims` | **no band field exists** | — | fine |
| `objectiveGradeSentence` / `checkpointResolutionSentence` | **no** | states the state, self-qualifying | fine |

### 8.2 Latent holes, ranked

| # | Hole | Reachable today? | Fix size |
|---|---|---|---|
| 1 | `BANNED_JUDGEMENTS` / `KEY_POINT_JUDGEMENTS` omit the entire praise register — `voiceCheck` returns `valid: true` for *"brilliant"* | **yes**, wherever `providers.llm === "external"` | one array |
| 2 | 24 packs tell the learner the opponent is *"near your rating"*; **no learner rating exists**, and the number is a **puzzle** rating | **yes**, live in draft packs today | one emitter string |
| 3 | `feedbackClaims[].text` / `objective.summary` / `PlanClass.description` have **no vocabulary gate at all** | yes | a validator rule |
| 4 | `variantOf: same_root_other_objective` + a lower `targetElo` + softer prose = a band-conditioned praise variant nothing compares | yes | a parity check, or accept it — §2c's band disclosure already mitigates |
| 5 | `KEY_POINT_PHRASE_IS_JUDGEMENT` fires only when a phrase is *entirely* judgement words, and only as a warning | yes | predicate change |
| 6 | A learner rating (D332/D365) will create the conditioning variable that makes all of the above sharp | **not yet** — this is the one to pin first | one invariant, §5.5 |

### 8.3 Discoverability, per surface

| Surface | Most valuable action | Clicks | Verdict |
|---|---|---|---|
| Global shell | reach any of 8 surfaces | 1 | ✅ |
| Run — core loop | **Compare** | **1** (or `Tab`) | ✅ the good case |
| Run — rewind | Rewind to a decision | 2 (or `R`) | ✅ mild: confirm button hidden until a ply is picked |
| **Compare — narrative** | **the grounded explanation** | **2 + scroll past 5 sections, collapsed** | ❌ prominence inverted; eval sparkline expanded above it |
| Assistance — corpus counts | recorded population counts | 3, all signposted | ✅ **reference implementation** |
| **Assistance — human split** | **the deepest honest rung** | **5, with an unsignposted prerequisite** | ❌ the real failure |
| **`/settings`** | configure assistance | 1 | ❌ 6 of 9 axes; `humanSplit`/`corpus`/`voice` omitted |
| `/play` | start a run / open a pack | 1 | ⚠️ no filter or search; `03` §70's "filters" unshipped |
| `/review` | open a run, import a game | 1 | ✅ |
| `/learn` | go to biggest gap | 1 | ⚠️ population disclosure printed as raw JSON |
| `HonestControl` (7 sites) | learn why a control is off | n/a | ❌ reason is visually hidden; the sibling `class="honest"` idiom (28 sites) is visible |

---

## 9. What the two failure modes have in common here `[M]`

Both accusations are about **a gap between what a product measures and what it tells
you**, and the shipped tree closes that gap in one direction and leaves it open in the
other.

Failure mode 1 is closed structurally: the feedback primitive is a pointer at recorded
evidence, the guard has only regressions to fire on, the outcome panel cannot print a
result without printing the resistance it was achieved against, and there is no learner
rating to condition on. The exposure is entirely **prose** — the one register the
denylists do not cover and the one place the corpus already says something it cannot
back.

Failure mode 2 is open in a way that is easy to mistake for doctrine. **§3a is a rule
about defaults, and it has been read as a rule about layout.** Collapsing the comparison
narrative below an expanded eval sparkline is not silence — it is a ranking, and it ranks
the dashboard first. Requiring an unmentioned second toggle before a ticked toggle does
anything is not silence either. §3a's own sentence is the test, and it uses the word
*available*: a learner must be able to find out that a thing exists without already
knowing it does. The corpus-counts path passes that test in three clicks. Nothing stops
the other paths from doing the same.

---

## 10. Ledger rows this dossier proposes

Reported, not written — `design/BACKLOG.md` is landed by claude (concurrent agents
collide on it).

1. **`BANNED_JUDGEMENTS` has no praise register.** Add `brilliant, excellent, great,
   superb, perfect, impressive, beautiful, accurate, precise, clever, sharp, strongest`
   (or invert the gate to an allowlist). Also applies to `KEY_POINT_JUDGEMENTS`, its
   duplicate. **The word from the accusation currently passes `voiceCheck`.** — §5.1
2. **The on-ramp emitter claims a personalization the product cannot perform.** 24 packs
   read *"against an opponent near your rating"*; there is no learner rating, and the
   band shown is the **puzzle's** difficulty rating. Already blocked by
   `mechanical-objective-placeholder`; replace the string. — §5.4
3. **`feedbackDeliveryOpen` is unconditionally true under `immediate_guard`**, so the
   1100–1394 band gets `humanSplit` and `corpus` unlocked pre-commit while every core
   pack locks them until a checkpoint. Either state this in `design/05` §3a-i or narrow
   it to post-commit. — §2a
4. **Pin the selection-vs-rendering invariant before a learner rating lands** (D332/D365):
   *a learner rating may select what a learner is shown and may never be an input to what
   is said about a move they played.* — §5.5
5. **The comparison narrative is collapsed below an expanded eval sparkline.** Expand
   `Narrative` by default, or move it above `Recorded engine evaluation`. This is the
   ADR-0005 anti-pattern as a layout default. — §7.3
6. **The human-model split has a hidden prerequisite.** Ticking "Human move split on
   request" is inert until "Passive pivotal markers" is also on, because the only request
   button lives in the pivotal-marker modal and `projectedPivotal` is `[]` when markers
   are off. Add the dependency to the label, or render the button in the assistance
   panel. — §7.4
7. **`/settings` omits three of nine assistance axes** (`humanSplit`, `corpus`, `voice`),
   so the two on-request evidence rungs are configurable only from inside a run. — §7.5
8. **`HonestControl` renders its reason visually hidden** at all seven call sites, while
   the sibling `class="honest"` idiom (28 sites) is visible. Make it visible. — §7.10
9. **`/learn` prints the repertoire-scan population as `JSON.stringify(...)`.** Route it
   through a sentence renderer as `renderCorpusPage` does. — §7.9
10. **`design/03` §70 promises phase filters that `/play` does not have.** 92 pack
    documents in a flat grid with no filter, search or sort. — §7.7
11. **`DESIGN-GAP:` the thesis's third on-ramp knob has no encoding.** No
    `OBJECTIVE_TYPES` member is principle- or threat-shaped; on-ramp packs use the most
    generic type (`play_until_checkpoint`, 28 of 31) and carry *fewer* opponent-intent
    checkpoints than core (6 of 31 vs 43). The lane is specified on three knobs and ships
    on two. — §4
12. **`difficulty.minOnlineRapid`/`maxOnlineRapid` is inert** — declared on 47 packs, its
    only consumer is `difficultyBand()`, a display string. Either bind it to selection or
    say it is decorative. — §2, knob table

---

## 11. Limits of this pass

- **Static read, not a play session.** Click counts are read off the shipped markup and
  its conditions, not timed against a real learner. Q9's comprehension question is
  untouched here.
- **One deployment shape assumed.** Paths gated on `capabilities.providers.*` (voice,
  TTS, corpus) are counted as if the provider is present; a deployment with
  `corpus: "none"` hides §7.6's control entirely, which is a capability fact and not a
  discoverability defect.
- **No competitor claim is verified.** The two quotes are owner-supplied thread reports
  and are used only as the shape of the question. Nothing here measures Chess.com or
  Lichess, and nothing here should be cited as if it did.
- **`content/drafts` is included** in the 92-document census; excluding drafts would
  change the on-ramp counts, not the verdicts.
