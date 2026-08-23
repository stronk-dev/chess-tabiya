# RFC: Review Map — the learner-facing review surface

- **Status:** draft — 2026-08-23, drafted on owner ruling [[D1273]] (*"Full surface plus accuracy and longitudinal"*), which resolves the review lane's self-block on its central question. Remaining O7 sub-choices ride here as registered open questions, not blockers.
- **Author:** claude (drafted from `planning/review/rfc-derivation.md`, 646 lines, the HEAD derivation of every surface this document consumes)
- **Created:** 2026-08-23
- **Design refs:** `design/00-thesis.md:134-138` (the failure shape this surface must not become), `design/03-product-breadth.md:57-67`, `:290` (the intent tier's "Review" is branch-compare — see Deviations)
- **Exploration gate:** owner ruling [[D1273]]. The lane previously refused its own drafting (`planning/platform-alignment/review-map/o7-handoff.md:5` — *"**Does not authorize:** F6 drafting until the choices below are ruled"*); D1273 rules O7's central question (how much the surface does) and the four remaining sub-choices are recorded below as open questions with the handoff's own recommendations.
- **Depends on:** `rfc/move-quality-grades.md` (accepted — the `report` ladder and the single exported logistic), `rfc/learner-modules.md` (accepted — `review_map`'s 48-row eligibility set), `rfc/review-evidence-compiler.md` (draft — the typed packet this surface consumes)
- **Parent / amends:** sibling of `rfc/review-evidence-compiler.md`, taking its Discharge D1 (*"this RFC lands packet + Story compatibility only"*, `:468`). The split is deliberate and preserved: **the compiler owns typed candidates and honest absence; this RFC owns selection, doors and rendering.** Merging them would violate the closure rule at `rfc/semantic-collectors.md:68-70`.
- **Supersedes / superseded by:** subsumes `review.story` as the learner-facing post-game surface (§8); `story.ts`'s projection is retained as an input, not a screen.
- **Planning:** `planning/review/`

```tabiya-claims
none
```

## Summary

This RFC makes the **registered-but-unbuilt `review_map` module** the review surface, and it is
mostly a **caller for code that already exists**. `packages/runtime/src/grade.ts` is 214 lines with
7 tests and **zero production callers** (verified at HEAD); `evidence-catalog.ts:812` already
declares a `derived.grade.move_quality` producer that nothing implements;
`compileModuleRegistry` (113 lines, 5 tests) has **never been invoked**; and `review_map` is a
48-row eligibility set whose declared learner action — *"replay from this moment"* — is the one
thing our review does that competitors' do not.

The surface specified here is: a **navigable move list** with per-move grades on the accepted
`report` ladder; a **0..3 moment map**; **`Retry from here` on every row**; an **accuracy figure**
that is coverage-gated and abstains rather than estimating; and **cross-game trends** that read the
longitudinal store when it exists and abstain honestly until then.

Two things it deliberately does not do. It does not persist anything — grades are a projection by
ruling (`move-quality-grades.md:422-424`) and the store excludes review until F9 — so it claims no
schema, no migration and no lane. And it does not relax law 8: a review screen is overwhelmingly
*our own template prose*, which is the one class `voiceCheck` does not gate ([[D421]]), so §7
specifies **frozen instrument-attributed templates** rather than a denylist pass.

## Motivation

The audit that produced this lane found game review to be the **#1 gap by owner interest**
([[D1088]]), and measured what a learner gets today: **68 lines** of `GameStoryScreen.svelte` — at
most 8 threshold-selected cards, a board with `disabled={true}` (`:46`), **zero** accuracy figure
(`grep -riw accuracy` over `apps/` returns 0 hits, verified), no move list, and one before/after
centipawn line on whichever card is selected.

Meanwhile the machinery is built. The gap is not capability; it is that **nobody wrote the caller**.

The differentiator is also already shipped and buried. `docs/game-import-and-story.md:87-92`:
selecting a moment rewinds to its `entryNodeId` and **creates a `story-reentry` branch before
opening the run**, so the original continuation and every attempt survive for N-way compare.
Competitors end at "here was your mistake": chess.com replaced back/forward with a single Undo and
*"the original game is not preserved"* — each retry overwrites the line, with no side-by-side
comparison (`design/research/teardown-chesscom-desk.md:12,15,19`). Lichess's unit is one
engine-identified mistake (`design/research/review-map-and-reentry.md:96-106`).

**Our review ends where the rehearsal starts, and every attempt is kept and comparable.** Today a
learner can reach that door only through ≤8 cards chosen for them — they cannot pick their own
moment, because there is no move list. That is the gap this RFC closes.

**Out of scope, each with a named home and owner:**

| Deferred | Home | Owner |
|---|---|---|
| Longitudinal *aggregates* — skills credit, style archetypes | F9 ([[D549]]/[[D552]]); `rfc-graph.md:73` already excludes longitudinal focus from F6 | `rfc/skills.md`, the style lane |
| Theory/drill identity joins on a reviewed position | F7 ([[D544]] runtime opening identity) — **absence renders honestly, never filled by search** (`o7-handoff.md:61-63`) | `rfc/runtime-opening-identity.md` |
| The public share *form* (layout, card art) | O7.5's own ruling | OWNER |
| `postcommit_nudge` activation | Phase-4 rail seating; the same producer §4 specifies serves it | `rfc/learner-modules.md` D2 |
| `/progress/related`, `/progress/metrics` doors | **untested**, not merely unwired — wiring means testing first | `planning/codex-wave-2.md` W-rows |
| `reasoning-review` | a different feature (recorded-reasoning matching) | `rfc/feedback-delivery.md` |

## Specification

### §1 — The surface is a screen, not a composition state

`rfc/play-composition.md:391` is normative for this module: *"timeline marks on the strip; **the map
itself opens as a review surface, not a play-column panel**"*, and `:218-220` makes the
`explicit_surface` seat class render *"outside the play composition… the **separateness** is
normative"*. The 16 composition states are a **closed list** whose acceptance matrix multiplies
against seven viewports; **this RFC adds none of them and reopens no matrix.**

`review` is a **surface id** (`apps/server/src/capabilities.ts:42`), not a workflow context and not
a preset — `rfc/intent-presets.md:79` rules it: *"reviewing is **access**, not a context or preset…
the `analysis` preset is how a reviewer widens what renders there."* So this surface inherits the
shipped `analysis` preset, which already names `review_map` and `full_inspector`
(`packages/runtime/src/presets.ts:36`), and introduces **no new assistance vocabulary**.

**Route:** `/review/game/:runId` (already a dynamic child route, `apps/web/src/lib/router.ts:51-57`).
The two touchpoints with play are already specified elsewhere and are not amended here: the
timeline seat mark, and the terminal handoff at composition state 14 (*"verdict card + review
handoff"*, `play-composition.md:522`).

### §2 — What renders: the four regions

| Region | Contents | Source |
|---|---|---|
| **Move list** | every ply: number, SAN, side, and — where admitted — a grade chip and a moment marker. Rows are clickable; the board is **live**, not `disabled` | §3 |
| **Board + evidence panel** | the position at the selected ply, with the admitted facts for that node from `review_map`'s 48-row eligibility set | `rfc/learner-modules.md:1183` |
| **Moment map** | 0..3 selected moments (O7.1), each carrying an admitted fact and an action | §5 |
| **Game header** | result, both sides, source attribution, and the coverage statement (§6) — including accuracy where coverage permits | §6 |

Every region has a **declared abstention state**. Abstention is a first-class rendered outcome, not
an error: *"zero moments is valid"* (`o7-handoff.md` research constraint 3), and `review_map`'s own
availability honesty is mandatory because R7 measured **0 of 29** middlegame/endgame mainlines with
consecutive recorded evaluations (`rfc/learner-modules.md:721-723`).

### §3 — The move list and per-move grades

**The move list is the one genuinely new UI object in this RFC.** It is specified here because it
exists nowhere: not in `learner-modules` (`review_map`'s seat is `timeline + explicit_surface`), not
in `play-composition` (`Timeline.svelte` is imported only by `DrillScreen.svelte` and is in-run), and
not in `design/03`.

**Grades come from the shipped grader, unmodified.** `moveQualityGrade(before, after, context, side)`
at `packages/runtime/src/grade.ts:151`, with context routing already literal at `:43-47`:

| Context | Ladder | Consumer |
|---|---|---|
| `review` | **report** | this surface, native runs |
| `imported_analysis` | **report** | this surface, imported games |
| `drill` | practice | `postcommit_nudge`, not this RFC |

The `report` ladder is **≥5 / ≥10 / ≥15** Win%-points (`grade.ts:30-32`, verified: `reportInaccuracy:
cited(5,…)`, `reportMistake: cited(10,…)`, `reportBlunder: cited(15,…)`).

**Three rules carry over from the accepted grades RFC and are restated because a renderer can
violate all three:**

1. **The class is closed** — `inaccuracy | mistake | blunder`, with **no praise member and no
   default member** (`move-quality-grades.md:307`). Below threshold, **nothing is emitted**: *"good
   is the absence of a grade"* (`:240-241`). A move list must therefore render most rows with **no
   chip at all**, and must not invent an "ok" state to fill the column.
2. **A grade word never renders alone.** The two evaluations, the drop, the threshold crossed and
   the convention id/version must appear **in the same sentence** — *"printing the number is
   grounded; printing only the word launders a convention as a fact"*. Word-only rendering is the
   permanently-red fixture **F-COR-1** (`move-quality-grades.md:361-374`).
3. **Grades are never persisted**, in any table or event (`:422-424`). They are recomputed from
   evaluations plus the convention version on every read.

**The producer.** `evidence-catalog.ts:812-820` already declares `derived.grade.move_quality` with
`payloadType: "MoveQualityGrade"` — a **string literal, not a type import** — and nothing implements
it. This RFC lands that producer as the single caller of `grade.ts`, closing the ◇ declared-awaiting
rows in `module.review_map` and `module.postcommit_nudge`
(`rfc/learner-modules.md:1178,1183`; `move-quality-grades.md` D1).

### §4 — `Retry from here`, on every row

**This is the differentiator and it must reach every ply, not only selected moments.**

The path already exists for a moment (`apps/web/src/App.svelte:326-332`): rewind to `entryNodeId`,
create a `story-reentry` branch **before** opening the run, then hand off to the ordinary run
machinery. This RFC generalises the same call to **every move-list row and every moment card**.

Two consequences that must be specified rather than assumed:

- **The original continuation always survives.** Creating the branch before opening the run
  preserves the imported line even when the selected ply is the original leaf
  (`docs/game-import-and-story.md:87-92`). That is what makes N-way compare possible afterwards, and
  it is the property competitors lack.
- **Compare is a handoff, not a new surface.** After a second branch exists on the same fork, the
  action offers the shipped N-way compare; `design/03-product-breadth.md:325` records B3 as shipped
  in full. This RFC adds no comparison machinery.

**The cross-device defect is in scope.** `App.svelte:369-371` throws *"This device does not hold the
imported run writer session"* on any device other than the one that played the game — so the primary
CTA of the differentiating feature is dead cross-device. This RFC either fixes it or renders the
constraint honestly in the row's disabled state; a silently dead button is not acceptable on the
action this surface exists for.

### §5 — The moment map and the whole-game selector

`review_map` is registered with **48 admitted evidence rows** and a declared learner action of
*"replay from this moment"* (`rfc/learner-modules.md:491`, `:1183`). Its moment count is
**deliberately unbounded in that RFC** (`:726-730`), which is why the map size is O7.1's to rule.

**Default: 0..3 moments**, one per represented phase, **no minimum** — the handoff's recommendation
(`o7-handoff.md:24-30`), carried as open question 1. The current 8 is *"the mechanical ceiling, not
a researched learner default"*.

**The second-stage selector is new.** Families exist in `packages/runtime/src/story.ts` (pivotal
marker, a ≥150 cp recorded swing, last near-level position before an imported loss, first endgame
entry, shape span, terminal result), but selecting **0..3 from a whole game** after module
eligibility is unspecified: [[D690]] measured 13 and 16 candidate moments on 52- and 60-ply
trajectories. This RFC specifies one selector function with a declared budget and a declared
abstention, and **no universal numeric score** — the compiler RFC is explicit that it *"does not
claim which moments teach best"* (`review-evidence-compiler.md:366-380`).

**One projection feeds private, share and card.** Today there are **two independent eights**: the
client takes `story.rank.slice(0, 8)` — ranked — at `GameStoryScreen.svelte:14`, while the share
path takes `story.moments.slice(0,8)` — **chronological, ignoring rank** — at
`apps/server/src/service.ts:915` (both verified at HEAD). So a shared card can show a different
eight than the learner read. That is [[D688]]; this RFC deletes the second selection.

### §6 — Accuracy, and the coverage gate that makes it honest

The owner ruled accuracy in ([[D1273]]). It is specified here rather than deferred, and the
derivation's measured caution becomes **how** it is defined, not whether.

**Definition — derived from our own ladder, not imported.**

> **Accuracy** = `100 − mean(dropWinPercent)` over the side's **evaluated decisions**, where
> `dropWinPercent` is the same quantity the grade ladder thresholds, computed through the single
> exported logistic `winPercentFromCp` (`grade.ts:95`, coefficient `0.00368208`, centipawns clamped
> ±1000).

Three properties this buys, each of which a competitor's undisclosed formula does not:

1. **It reuses one symbol.** `move-quality-grades.md:443-445` requires it: the accuracy family
   *"must reuse this symbol, never re-derive the constant"*. No new constant is introduced by this
   RFC.
2. **Its denominator is stated on the surface**: evaluated decisions **by that side**, not total
   plies, not moves.
3. **It is not comparable to chess.com's number and the surface says so.** A figure that looks like
   theirs but is computed differently invites exactly the comparison it cannot survive; the caption
   names the convention id and version.

**The coverage gate — this is the load-bearing half.** Accuracy renders **only when every decision
in the denominator has a durable evaluation**. Otherwise it **abstains and states the coverage
fraction**. The asymmetry is measured, not hypothetical:

| Run kind | Evaluation coverage | Accuracy |
|---|---|---|
| **Imported** | one evaluation job **per mainline node including the root** (`service.ts:857`; an 80-ply game requests 81), and `service.story` refuses to render until every node has a durable evaluation or a recorded failure | **renders** |
| **Native drill run** | [[D691]] measured **20/20 opening** and **0/29 middlegame/endgame** mainlines with consecutive recorded evaluations | **abstains**, with the fraction shown |

This is exactly the *"availability-gated honest-empty"* shape [[D880]] is already written as
(`design/BACKLOG.md:485`). **This RFC claims D880's accuracy and eval-graph scope**; the row is
otherwise ownerless, and leaving it unclaimed while shipping the number would be the defect it
exists to prevent.

**The eval graph** follows the same gate: a per-ply series over data already collected for imported
games, abstaining per-region for native runs.

### §7 — Law 8: the highest-risk surface in the product

The thesis names this surface's failure mode directly (`design/00-thesis.md:134-138`): *"**Not a
post-game analyzer**… The product dies if it becomes a Stockfish review screen with a rewind
button."* This RFC's answer is that the rewind produces something durable (§4) — but the rendering
rules below are what keep the screen from becoming the dashboard.

**May be said:** a grade word from the closed class, co-rendered with its operands (§3); the two
evaluations, the drop, the threshold and the convention; facts from `review_map`'s 48 registered
rows; the recorded human-policy distribution as a **measurement of behaviour**, not a verdict;
honest absence.

**May not be said:** praise classes of any kind, including an "ok" for below-threshold; *"best move
was…"*, a principal variation, or a candidate shortlist in the ordinary map (PV sits behind an
explicit, secondary Analyze action with the verdict hidden during retry, per O7.3); any
LLM-**selected** moment or inferred significance; attributed **intent** for a stranger's move (§8).

**The mechanism has four measured holes, and a review screen is the worst case for the first.**
`voiceCheck` (`packages/runtime/src/voice.ts:110-119`) is a **subset-of-source test over LLM output
only**. Authored prose has **no gate at all** — and because authored sentences fold into
`packet.sentences`, authored prose *widens* the renderer's licence ([[D421]]: **66 of 196** claims
carry a banned word, **117 of 196** a prescriptive verb). It is a **token filter, not a proposition
checker**, so it cannot refuse a *join* of two admitted facts into a claim neither record makes
([[D146]]). And **fabricated absence passes**: an invented recorded-reading sentence in the exact
frozen format returns `valid: true` ([[D226]]/[[D234]]).

A review screen is overwhelmingly *our own template prose* — card titles, section headers, empty
states, the accuracy caption — which is precisely the ungated class.

**Therefore, normative:** every authored string on this surface is a **frozen template with
instrument attribution** ([[D168]]'s successor rule), registered in one table, and asserted by
fixture. Free-form authored prose is not admitted on this surface. Two specific consequences:

- **The false-provenance footer is deleted.** `GameStoryScreen.svelte:30` stamps *"rendered from
  recorded engine evidence · Tabiya"* onto a card whose moment may be a rules marker, a shape
  firing or a declared convention (verified at HEAD). That is [[D687]] — an authored string making a
  false provenance claim, on this surface, today. The footer is **computed from the admitted items**.
- **Numbers and prose are adjacent by construction here** ([[D146]]'s join trap): a centipawn figure
  beside a structural sentence invites *"+0.54, so the knight is strong"*. The template table
  therefore fixes the *sentence*, not the fragments.

### §8 — Imported games: what may honestly be said about someone else's moves

**`decision_class` does not exist in production code** (zero hits across runtime, server and web).
What exists is a colour rule at `apps/server/src/service.ts:828`: every move by whichever colour the
importer picked is committed with `actor: "user"` — the historic player's moves labelled as the
learner's. The accepted store already guards this: its `game` class is defined so that *"the store
does **not** assert that player is the learner"* (`rfc/longitudinal-store.md:128-140`).

| May say | May not say |
|---|---|
| what was played, byte-exact | anything about the importer's **intent** — no per-move intent field exists |
| the evaluation trajectory, attributed to engine and search bound | that the historic player **is** the learner |
| grades on the `report` ladder, context `imported_analysis` | a proactive pre-commit guard over historic moves — *"a proactive guard over a replay is noise wearing a safety label"* (`intent-presets.md:145`) |
| position facts from registered projections | third-party verdicts relayed as ours |

**Third-party annotation stripping is restated as an obligation.** The direct fetch already asks
Lichess for `evals=false&literate=false` (`import-source.ts:73`), but a **pasted** PGN does not go
through that path, and a real broadcast fixture carried **61 third-party SAN suffix glyphs outside
any comment** (`??`×13, `?!`×39, `?`×9). A review surface that renders a pasted game must strip them
at the record boundary, or it will present another product's verdicts as its own.

**And the standing boundary:** mandatory game import as the entry point is on the rejected list
(`CLAUDE.md:127`). Import **selects material**; a review of a native drill run must work, degraded
honestly per §6, or this RFC has rebuilt the v1 identity.

### §9 — What subsumes what

`review.story` is explicitly *"untouched"* by `learner-modules` (`:731-732`), and both cannot own the
surface. **`review_map` becomes the learner-facing review surface; `story.ts`'s projection is
retained as an input to the selector, not as a screen.** `GameStoryScreen.svelte` is replaced by the
surface specified here; the [[D687]]/[[D688]]/[[D689]] defects are closed by §5 and §7 rather than
migrated.

**`compileModuleRegistry` is invoked for the first time.** Landing `review_map` for real means
constructing a `ModuleDeclaration[]` and calling the compiler at
`packages/runtime/src/module-contract.ts:188` — which has 5 tests, 7 invocation sites in tests and
**zero in production**. No module has ever been compiled; this is the first, and it is a prerequisite
rather than a side effect.

## Deviations from design

**One, and it requires an owner amendment rather than an author's edit.** The intent tier's "Review"
area is **branch-compare, not game review**: `design/03-product-breadth.md:290` reads *"Review | runs,
branch comparisons, deep analysis, shared sessions"*, and §"Review and explore" (`:57-67`) lists
rewind, fork, N-way compare and difference strips without mentioning a post-game report. B3 is
recorded as *shipped in full* (`:325`).

**So game review has no home in the intent tier.** Law 5 forbids this RFC writing one. The amendment
is proposed as a ledger row below and named as open question 6.

## Acceptance criteria

Each names the wrong implementation that would otherwise pass.

1. **The move list renders every ply of the mainline**, with SAN, ply number and side. *Fails if* a
   cap, a slice or a moment filter reduces it — asserted by a fixture whose game exceeds any
   plausible cap. *Wrong implementation caught:* re-using the ≤8 rank slice.
2. **Most rows carry no grade chip.** Over a fixture game, the count of emitted grades equals the
   count of plies whose `dropWinPercent` crosses a `report` threshold, computed independently in the
   test. *Wrong implementation caught:* an "ok"/"good" default filling the column, which the closed
   class forbids.
3. **No grade word renders without its operands** in the same sentence — the F-COR-1 fixture is
   extended to this surface and must be **red** against a word-only renderer.
4. **`Retry from here` is present and enabled on every move-list row and every moment card**, and
   each invocation creates a `story-reentry` branch **before** opening the run. *Fails if* the
   original continuation is absent from the run's branches afterwards. *Wrong implementation
   caught:* rewinding without forking, which silently overwrites the source line — the exact
   competitor behaviour §Motivation cites.
5. **Cross-device**: on a device without the writer session, the retry control is either functional
   or **rendered as unavailable with its reason**. *Fails if* it throws.
6. **Accuracy renders only at full coverage.** Two fixtures: an imported game (renders, with the
   denominator stated) and a native middlegame run (abstains, with the coverage fraction stated).
   *Wrong implementation caught:* estimating over evaluated plies only, which produces a flattering
   number from a 0/29 sample.
7. **Accuracy reuses `winPercentFromCp`.** A grep-able assertion that this surface introduces no
   second logistic and no second coefficient. *Fails if* `0.00368208` appears anywhere outside
   `grade.ts`.
8. **One projection feeds private, share and card.** The moment id list and order are byte-identical
   across all three. *Wrong implementation caught:* the current two-slice divergence at
   `service.ts:915` versus `GameStoryScreen.svelte:14`.
9. **Every authored string on the surface resolves to the frozen-template table**, asserted by
   set-equality against a derivation over the rendered components — **not against a hand-counted
   total** ([[D1240]]). *Wrong implementation caught:* a free-form caption added later.
10. **The card footer is computed from admitted items.** *Fails if* any fixed provenance string is
    emitted — specifically, the literal *"rendered from recorded engine evidence"* must not appear
    in the source at all.
11. **Abstention is rendered, not empty.** For a run with zero admitted moments the surface states
    that zero were found; for a region with no evaluations it states so. *Wrong implementation
    caught:* an empty div, which reads as a loading failure.
12. **No praise, no best-move, no PV in the ordinary map.** A negative fixture asserts the rendered
    payload carries no move recommendation; PV appears only under the explicit Analyze action.
13. **No composition state is added.** `rfc/play-composition.md`'s closed 16-state list is asserted
    byte-unchanged.
14. **Nothing is persisted.** After a full review session, no new row exists in any table and no new
    event kind is written. *Wrong implementation caught:* caching grades, which the projection ruling
    forbids.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | O7.1–O7.5's remaining sub-choices — map size, admissible families, engine role and move labels, action doors, share contract — ruled and recorded as a per-lane row | OWNER | this RFC's acceptance commit | |
| D2 | The `design/03-product-breadth.md` amendment giving game review a home in the intent tier (law 5 — proposed here, written by the owner or by claude on the ruling) | OWNER | the amendment's landing commit | |
| D3 | Cross-game longitudinal trends: the store additions this surface requires (per-decision refs retained at review grain), specified as an obligation on the accepted store rather than a claim here | `longitudinal-store.md` | the store's implementing commit | |
| D4 | The literal Wave-C id amendment ([[D921]]) that `review-evidence-compiler` acceptance waits on, and which this surface's packet consumes | `learner-modules.md` | the amendment's landing commit | |
| D5 | `compileModuleRegistry`'s first production invocation and the `ModuleDeclaration[]` roster it compiles | codex | the implementing commit | |
| D6 | The [[D971]] preset-config projections, if this surface's disclosure is to depend on `compileAssistance` output rather than the module list alone | `intent-presets.md` | the D971 amendment's landing commit | |

## Open questions

1. **O7.1 — default map size.** Recommendation on file: up to three, no minimum, one per represented
   phase. Alternatives: one, or five. The current 8 is a mechanical ceiling, not a researched
   default. *(`o7-handoff.md:24-30`)*
2. **O7.2 — which families may become a moment.** Recommendation: a workflow-declared allow-list;
   shape firings and engine pivots may only *nominate*.
3. **O7.3 — engine role and move labels.** Recommendation: optional trigger and context, never the
   default verdict; grades visibly engine-relative. **This is the law-8 crux of the surface.**
4. **O7.4 — action doors.** Recommendation: `Retry from here` on every moment; Compare after a second
   branch; theory/drill only on exact identity join; Analyze explicit and secondary. §4 assumes this
   recommendation and must change if it is ruled otherwise.
5. **O7.5 — share contract.** Recommendation: same moment ids, order and provenance as private, with
   the footer computed from admitted items. §5 already implements the *divergence* fix regardless.
6. **Does game review become a `design/03` surface?** Discharge D2. Law 5 — proposed, not written.

## Ledger rows

Proposed; id assigned at landing (head was **D1284** at drafting).

1. 💡 **Game review has no home in the intent tier.** `design/03`'s "Review" is branch-compare
   (`:57-67`, `:290`) and B3 is recorded shipped in full. An amendment is proposed, not written.
2. 🐞 **The review surface is [[D421]]/H1's worst case**, and ships a false provenance footer today:
   `GameStoryScreen.svelte:30` stamps *"rendered from recorded engine evidence"* on moments that may
   be rules markers or shape firings.
3. 📊 **The eval-coverage asymmetry is a scoping fact, not a defect** — imported runs carry a durable
   per-node evaluation pass (81 jobs for an 80-ply game); native runs are 20/20 opening and 0/29
   middlegame/endgame ([[D691]]). It is why accuracy is coverage-gated rather than deferred.
4. 🐞 **Two independent eights select the shared card** — ranked on the client
   (`GameStoryScreen.svelte:14`), chronological on the server (`service.ts:915`) — so a shared card
   can show a different eight than the learner read ([[D688]]).
5. 💡 **This RFC claims [[D880]]** (accuracy % and eval graph), which was ledgered without an RFC or
   an owner.

## Changelog

- **2026-08-23** — drafted on owner ruling [[D1273]] (*full surface plus accuracy and longitudinal*),
  from `planning/review/rfc-derivation.md`. Every load-bearing claim re-verified at HEAD before use:
  `grade.ts` at 214 lines with **zero production callers**; `derived.grade.move_quality` declared at
  `evidence-catalog.ts:812` with nothing implementing it; `compileModuleRegistry` with **zero
  production invocations**; `accuracy` at **0 hits**; the two-slice share divergence; the false
  provenance footer; and the `report` ladder constants read from source (5/10/15). Two citations in
  the derivation had drifted and are corrected here: the O7 self-block is `o7-handoff.md:5`, and the
  share cap is a `moments.slice(0,8)` inside `service.ts:915`'s `publicStory`.
