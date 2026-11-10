# RFC: Review Map — the learner-facing review surface

- **Corrected amendment independently accepted on buildability 2026-11-03 — [[D4009]]:**
  the single-projection D4004 image failed the unchanged actual compiler and remains superseded.
  Separate review accepted §7a's three literal projections, exact source-page probes and actual
  target-scoped assistance bootstrap after the real10-case whole-graph compile witness and
  historical/campaign permission corrections. The same compiler2 review receipt records the
  return and corrected acceptance. Actual API/UI/native/parent completion is still separate.

- **Amendment accepted for implementation 2026-11-03 — [[D4004]]:** separate independent
  cross-review accepts corrected §7a and module-registration §4.11c on buildability. Typed empty
  remains parser-failed; genuine empty historical reports, recorded ply limits, usable bounds and
  truthful attribution remain distinct. Receipt: `planning/learner-modules/compiler2-independent-review-2026-11-02.md`.
  Implementation/API/UI/native and earlier parent discharges are not complete.

- **Draft amendment 2026-10-13 — [[D3758]]:** §2a specifies the consumer boundary for the
  compiler's proposed local incoming-edge sources. It is **not accepted** by this parent's
  awaiting status. The delivered screen and existing discharge states are unchanged.

- **Status:** implementing — D4004 accepted current-source Analyze repair; D1–D6 remain undischarged. Earlier delivered-surface checkpoint: implemented 2026-09-24 at the owner's direction in session (build now as a parallel agent, no further review cycle); acceptance criteria 1–14 have able-to-fail tests and [[D1409]] is enforced in `voiceCheck` (judgement arm). The owner rulings (D1, D2) and the cross-lane amendments (D3, D4, D6) remain open; D5 (the module-registry invocation) is discharged at `63902370`. Receipt: `planning/review/implementation-2026-09-24.md`. Drafted 2026-08-23 on owner ruling [[D1273]] (*"Full surface plus accuracy and longitudinal"*).
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

### §2a — Draft local-source selection boundary ([[D3758]])

The compiler §4.4's 32 local projections are **candidates**, not 32 new unconditional facts in
the evidence panel. Its research population offers 10,196 items on 513 moves (maximum 36 on one
move), including both colours' pawn-island and king-zone states on every move. Copying these
into `row.facts` would recreate the refused raw-evidence dump.

Before this amendment is accepted, the existing D1/D928 source-local selection obligation must
name the exact per-family change/witness rules, any bounded prominence order and native absence
wording for the learner's selected move. The selection is not engine grading, inferred intent or
a claim of causality. General lift statistics do not choose the explanation for an individual move.
Do not borrow the unaccepted Post-commit Nudge change-witness amendment as implementation authority.

The following boundaries are mandatory regardless of the eventual family choices:

- All acquired candidates remain in the typed packet; selection never erases complete source
  state, changes the collector or changes what a pack condition can inspect.
- The actual selected row consumes only its own exact admitted items through `compileModulePacket`
  and the registered `module.review_map@1` adapters. A separately recomputed UI closure, free-text
  fallback, generic derived sentence or Inspector expansion is not a delivery path.
- Keep each selected event's complete component composition together, including named pieces,
  squares and move paths. Never zip flattened components against event indices.
- A legal move with no admitted *meaningful* local change can remain quiet. Unchanged count
  states, provider absence and compiler-unrequested work are distinct; none may stand in for
  "nothing interesting happened". An available event does not automatically create a moment.
- The 0..3 whole-game moment selector, Story/share ranking and move-quality convention remain
  unchanged. This amendment covers selected-move explanations, not a new statistical moment rank.
- Native desktop/phone tests must use an actual HTTP-produced receipt, verify the chosen event's
  complete operands, preserve the board rectangle/hit targets, and exercise move selection,
  stale replies, Retry, Compare and Analyze without widening a live retry's assistance.

**Still unresolved, not silently chosen:** the complete family-by-family witness/selection matrix
and its native UI envelope. That is the acceptance work owned by this RFC's existing D1/D928,
not permission to ship all collected items or declare the module complete.

**2026-10-13 author/review input, not acceptance:** the disposable D3758 experiment now covers
all 32 refs with a literal set-equal change-witness matrix. Its unchanged eight-game population
still has no quiet rows (median ten, p95 21 items/move) after removing unchanged state. A sign-only
filter incorrectly drops checks, captures, castling and changed king-state payloads. The source
audit also repairs D3762's wrong retained-target identity under its existing contract. See
`design/research/module-registry-semantic-closure.md` §6 and `make review-one-edge-adoption-probe`.
This is feasibility evidence for the eventual matrix, not permission to adopt that experiment
as a useful selector, invent prominence or skip the native presentation decision.

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

> **Accuracy** = `100 − mean(max(0, dropWinPercent))` over the side's **evaluated decisions**, where
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

### §7a — D4004 source handoff; D4009 accepted representation/bootstrap repair

**Independently accepted on buildability, 2026-11-03.** This bounded amendment
and module-registration §4.11c form one separately reviewed contract; the decision and all four
author corrections are recorded in the compiler2 independent review. No owner product
choice, schema/version-lane claim, protected-design edit or archive change is inferred.

**D4009 buildability return and independently accepted repair, 2026-11-03.** Actual implementation
of the originally accepted single projection failed the unchanged manifest compiler before
tests loaded: every `anyOf` alternative must independently support the output's grounding,
answers and abstention. The typed arm has mixed recorded/bounded-search inputs, historical PV
has recorded inputs, and historical first-move has no PV answer. The source mechanics below
remain the accepted D4004 work; this separately reviewed repair replaces its unbuildable
single-projection image and makes the missing real Review→assistance→source bootstrap explicit.
The independent acceptance permits bounded implementation, not completion or release clearance.

**Measured gap, not a new feature.** `review-analysis.ts:68–108,153–162` currently flattens a
re-derived typed line into an invented in-memory bestline packet, or reads historical bestline/
eval-first fields, then calls the retired generic Full Inspector operation. The actual guard in
`module-packets.ts:70` correctly returns `source_page_required`. Ordinary focused runtime/web
remainder tests on 2026-11-03 execute35 cases:17 pass/18 fail, with Analyze failures rooted at
that call. The coordinator's real typed PV is stored under `providerLineDelivery` inside an
**eval** attachment (`review-evidence.ts:1391–1409,1434–1448`); it is not an original bestline
attachment. Existing `recorded.inspector.pv_packet@1` admits only original bestline events, and
its renderer carries only report sequence/legal SAN, not Analyze's engine/bound. The eval
renderer carries score/frame, not the search first move. Existing evidence is sufficient to
specify the repair; fabricating an event, weakening a factory or restoring Full1 is not.

**Smallest buildable composition.** Reuse Full Inspector's current consumer and sole source-page
callable. Three exact static projections under existing `derived.review` preserve the three
actual input contracts: `analysis_typed_pv@1`, `analysis_recorded_pv@1`, and
`analysis_recorded_first@1` (all prefixed `derived.review.`). They are three technical Inspector
topics, not three Analyze buttons or three competing admissions. One explicit Analyze action
performs at most three exact source requests in that order, advancing only on genuine
`unavailable/source_absent`. Module-registration §4.11c prices every projection/pair/renderer
and the bounded confirmation bootstrap. Six detail views and the original65 topics stay intact.

The disposable **pre-adoption** witness `tools/d4009-analyze-declaration/contract.test.ts` compiles the complete
original declaration graph plus these literal rows, preserving all original bindings. The old
single row and every two-group combination fail unchanged `EVIDENCE_DERIVATION_WIDENS`;
the three rows compile. This is metadata authoring evidence, not production adapter/source
proof or permission to run research as product software CI. No conditional-answer framework,
dummy convention input, PV-to-move downgrade or weakened compiler is justified by one seat.
After real registration, appending the same three refs would correctly fail duplicate checks:
retain this as historical authoring evidence, not a promised after-adoption passing product gate.
Any later research rerun must explicitly inspect actual registered rows instead of double-appending.

#### 7a.1 Actual recorded source, occurrence and selection

The new runtime helper `collectRecordedAnalyzeLine` receives the actual unchanged complete run,
granted branch and selected **reviewed move node**, not a caller packet, text, arbitrary FEN or
list of candidate lines. It uses the existing full-run legal graph/branch validation, exact
`run.record.edge@1` source and sealed selected-parent subject. The edge's parent is the analysis
position; its child is the requested reviewed move. Retain original run/head/branch/parent/child
identity, original event ordinals and complete selected event. Same FEN, engine, line bytes or
hash is not the occurrence identity. An inherited original parent can be used on a granted
branch; a different branch/node at the same FEN cannot be borrowed.

One original-source collection has a private invocation reader, like the existing recorded
comparison/packet owners: copies, reconstructed objects and genuine foreign endpoint/head
collections refuse. This is not a new evidence/access issuer. Existing sole factories issue
actual edge/record/provider evidence, and the new sole derived factory consumes only that
genuine collection. It retains all exact original input evidence objects, including successful
empty or failed source outcomes internally; no new generic trust callback, approval Boolean,
digest domain or provenance framework is introduced.

At the selected **parent node**, enumerate original `evidence.attached` events in event order.
Only the existing Analyze `engine_validated` source-label population is eligible; that stored
label alone establishes no modern provider authority. Apply this closed precedence:

The shared pure `selectRecordedAnalyzeMetadata` performs this precedence scan over the actual
validated original run/branch/reviewed node, selecting an original event ordinal and arm or no
occurrence. It runs only after actual current context authorization, and performs no evidence
factory, provider-capture parser, rendering, coordinator or provider work. The service compares
that selection to the one exact requested topic **before** `collectRecordedAnalyzeLine`.
The collector independently invokes the same selector on its actual original inputs; a caller
selection object/arm/Boolean is never authority and cannot select a lower occurrence.

1. If any eligible eval attachment **owns** `providerLineDelivery`, select the last such original
   event, re-derive its actual persisted `stockfish.principal_variation@1` capture through the
   existing parser and sole `live.stockfish.principal_variation@1` factory, and require exact
   parent FEN. Retain that original eval packet source, exact re-derived provider source and
   original edge. Assert the provider source belongs to those literal persisted bytes through
   the original collection/reader; an unrelated genuine same-FEN/same-value delivery cannot join.
   Corruption/refusal of this selected typed capture is **failed**, never permission to select
   an older typed event, historical bestline or eval-first move. **The existing provider grammar
   rejects an empty PV** (`provider-parsers.ts:282`, also used by persisted re-derivation).
   Present-empty typed bytes therefore fail, with the original event/capture retained privately
   but no successful typed source issued. No genuine captured-empty typed-source fixture exists
   under this grammar; do not widen the parser or synthesize such a source for this amendment.
2. Only when **no** eligible attachment owns the typed key, select the last eligible original
   bestline attachment, if any, through its genuine `recorded.inspector.pv_packet@1` source.
   Do not synthesize a bestline from another record. An original `movesUci: []` is a genuine
   completed-empty historical report: the existing recorded packet factory accepts it, and
   `inspector-recorded-presentation.test.ts:57–64` proves its reported-empty field state through
   that actual source. Retain its original packet and emit `no_witness`, without engine/bound
   invention or older-source fallback. Malformed present line fields are failed, not permission
   to skip that occurrence for an older bestline/eval.
3. Only when neither typed-key nor bestline occurrence exists, select the last eligible eval
   attachment owning `bestMoveUci`, through its genuine `recorded.inspector.eval_packet@1`
   source. Interpret exactly that one move as `search_first_move`, never a fabricated PV or a
   recommendation. A malformed present token is failed; absent records are source-absent.

The topic mapping is literal: typed_pv→analysis_typed_pv, recorded_bestline→analysis_recorded_pv,
recorded_search_first→analysis_recorded_first. A requested absent higher-priority arm yields
`unavailable/source_absent` without nonselected factories; this alone permits the next explicit
probe. A requested lower arm when a higher selected occurrence exists yields the new closed
`unavailable/analyze_variant_not_selected`, not false absence, and stops. A matching selected
arm then collects/parses only that original source. Present-corrupt higher metadata still selects
that arm, so its matching request fails instead of falling back; a direct lower request cannot
bypass it. True no occurrence is source_absent; genuine selected historical empty is no_witness;
invalid present input is failed; attribution-incomplete is a presented unattributed state.
These outcomes are never inferred from an empty rendered list or provider readiness.

This closes the current `reviewDurableEngineLine` absent/invalid collapse for this consumer:
source absence, invalid/empty stronger capture, genuine empty historical report, missing attribution and a legal
line are different private outcomes. Existing unrelated callers of that helper need not be
changed merely for compatibility. No current engine readiness, provider query, new search,
coordinator observation, cache insertion, storage write or synthetic evidence event is required
or allowed by Analyze.

#### 7a.2 Closed output and wording

For a chosen nonempty line, walk **every** move in its actual admitted recorded scope legally
from the exact parent FEN; normalize
castling with the existing chess rules and derive full numbered SAN, including Black-to-move,
promotion and en-passant. One illegal/malformed token fails the whole source. Do not truncate,
skip an illegal suffix, normalize to another FEN or keep only a displayable prefix. For typed
PV this means the whole existing delivery's `movesUci` within its literal requested `maxPlies`,
not a claim that every raw engine PV token was emitted. The existing provider parser validates
the selected raw PV legally and then applies its recorded `maxPlies` request bound. Preserve
the original `maxPlies` and `truncated` in source/operands and state the recorded ply limit;
when truncated, state that the engine reported a longer line. This is existing acquisition
scope, not permission for a second renderer/budget truncation. Historical bestline walks every
literal recorded token; its unknown raw-search completeness is not inferred.

Require a nonempty recorded engine id and a positive safe-integer requested bound. Typed captures
use their literal actual engine id/name/version and exact bound discriminant. Historical reports
use only their literal reported fields; retain the existing first **usable positive-safe-integer**
value in movetime → depth → nodes order. A malformed/nonpositive movetime does not conceal a
valid depth/nodes field; an existing but unusable field is not selected merely by presence. Missing
engine/bound produces a singleton **unattributed** derived state with no public line, rather than
inventing identity/bound or treating the source as absent.

The three projections share a closed payload recipe, each accepting **only its literal source
arm**, with the full original source retained privately rather than copied into renderer operands:

- `line`: source arm `typed_pv | recorded_bestline | recorded_search_first`; requested child
  and parent identities; reviewed move number/side/SAN; exact recorded engine attribution and
  bound; the complete numbered SAN array; the literal source-input refs/occurrence relationship.
- `unattributed`: the same exact occurrence/selected-move identity, source arm, and closed
  unusable-attribution reason `engine_unusable | bound_unusable | engine_and_bound_unusable`;
  no line, candidate, raw capture or inferred values may enter public operands.

Three exact registered fact renderers `review.analysis_typed_pv@1`,
`review.analysis_recorded_pv@1` and `review.analysis_recorded_first@1` parse the separate closed
operand union below and additionally enforce their exact source arm/projection pair. They may
share a pure parser/formatter implementation, never a generic renderer authorization or
projection alias. Their literal common grammar is:

```ts
type RecordedAnalyzeArm = "typed_pv" | "recorded_bestline" | "recorded_search_first";
type AnalyzeMoveOperand = {
  fullmove: number; // positive safe integer
  side: "white" | "black";
  san: string; // existing strict SAN grammar; source walks the actual complete legal line
};
type AnalyzeBoundOperand =
  | { kind: "movetime"; requestedMs: number }
  | { kind: "depth"; requestedDepth: number }
  | { kind: "nodes"; requestedNodes: number }; // each bound value positive safe integer
type AnalyzeLineScope =
  | { kind: "typed_request"; maxPlies: number; truncated: boolean }
  | { kind: "recorded_report" }; // no invented raw-search scope for historical reports
type AnalyzeLineOperands =
  | { kind: "line"; sourceArm: RecordedAnalyzeArm; reviewedMove: AnalyzeMoveOperand;
      engine: { id: string; name: string | null; version: string | null };
      bound: AnalyzeBoundOperand; lineScope: AnalyzeLineScope; line: readonly AnalyzeMoveOperand[] }
  | { kind: "unattributed"; sourceArm: RecordedAnalyzeArm; reviewedMove: AnalyzeMoveOperand;
      reason: "engine_unusable" | "bound_unusable" | "engine_and_bound_unusable" };
```

All object keys are closed own-data fields; no empty line or empty engine id is legal in `line`.
`typed_pv` requires `typed_request` with the exact original positive-safe-integer maxPlies,
literal truncated flag and line length no greater than maxPlies; historical arms require
`recorded_report`. Crossed scopes or a changed truncation/ply limit refuse.
`recorded_search_first` requires exactly one line member. Typed engine name/version are actual
captured values; historical name/version are null and the id is explicitly a reported label.
Fullmove/side/SAN derive from the exact original parent and every following legal position, not
client numbering. The adapter source-retention validator recomputes the complete operand union
from its exact original admitted source and refuses any changed arm/identity/bound/number/SAN,
omitted suffix or added field. The renderer formats first Black-to-move as `N… SAN`, every White
move as `N. SAN`, and subsequent Black moves as SAN, retaining the existing full-line meaning.
Use the existing presentation plain-text/SAN/raw-id/safety guards; do not add a generic free-prose
or guard exemption. An unrenderable literal attribution is not permission to invent a name.

The renderer reuses the frozen `analysis.line`,
`analysis.first`, bound and caveat templates for typed evidence. Historical templates explicitly
say **the saved report names** its engine and requested bound, rather than claiming independently
verified engine execution. Unattributed state uses three registered reason-specific templates:
engine attribution unusable, requested bound unusable, or both unusable. Each states that the
recorded line is not shown because that attribution cannot be established. Do not reuse the
old `analysis.unattributed` literal, which says only that its bound is absent and would be
false for engine_unusable with a valid bound. No unattributed state reveals private moves.
No caller sentence, arbitrary source path, raw eval, first-move
alias, score/grade, cause, recommended/best move or LLM output is accepted.

Empty/unavailable/failed/withheld/display-limited captions are fixed, separately registered
surface templates, not source findings: no record; selected historical report carries an empty line; record
cannot be interpreted; attribution incomplete; assistance withheld; complete line exceeds the
unchanged display budget. A malformed stronger source never renders as an available historical
line. Actual source outcomes remain distinguishable in the strict source-page wire.

#### 7a.3 Current explicit delivery and permissions

Each new source uses `incoming_edge` at the reviewed move and the unchanged current
`inspector/query` request/receipt/strict parser. The selected reviewed node/FEN is the query
subject; the line begins at its genuine entry parent. Never substitute the entry FEN for the
query's selected-node FEN or reinterpret the active cursor as the reviewed selection.

**Actual source-free bootstrap, not callback magic.** Current `ReviewMap` carries no decision
stamp and `App.analyzeFromReview` has only run/branch/row identities; it must not fetch a raw
run or a provider capture to obtain authorization. Extend the ordinary Review response with
only `decision:ModuleDecisionStamp` and `workflowContext:WorkflowContextId`, computed from the
same actual run and real service workflow/campaign authority as its map. The context recipe
uses actual `assistanceAuthority(runId,principal).origin`: for `campaign_encounter`, verify the
original issued receipt with the same `verifyCampaignEncounterReceipt` used by
`compileAuthoritativeAssistance`, then report campaign; otherwise use `deriveWorkflowContext`
on that actual ordinary origin. Do **not** copy `#moduleViewer.session` or
`#assistanceContext.workflowContext`, which derive from raw session fields and can label a real
campaign encounter as pack. Recheck the same actual map run/decision before publishing metadata.
Strict
`assertReviewMapResponse` parses the closed stamp shape and existing digest recipe and known
context; these are request metadata, never an access grant, chess evidence or a line. Existing
row nodeId/entryNodeId/fen remain the selected child, real parent and selected child FEN.

On Analyze, compile the existing explicit `analysis` preference for that actual workflow
context **in memory**, without writing saved preferences, changing a preset or overriding a
ceiling. Ordinary `POST /assistance` uses active-cursor `feedbackDeliveryOpen(run)`;
`resolveInspectorRecordedContext` instead authorizes the requested historical branch before
setting deliveryOpen:true. Therefore ordinary Play confirmation is not interchangeable with
historical Review confirmation. Add precisely one closed alternate body to that existing route:

```ts
{ assistance: RequestedAssistanceV1,
  review: { branchId: string; nodeId: string; entryNodeId: string; decisionDigest: string } }
```

The existing plain RequestedAssistanceV1 request/response stays unchanged. The new arm rejects
extra/inherited/accessor fields and unknown contexts; it is selected by the exact envelope, not
by a truthy review flag. After ordinary cookie authentication and complete current Full2
`compileEvidenceConsumerExecutionV2` preflight, capture current provider-health availability exactly as the actual source
route does. Resolve the existing Inspector context owner with context `{kind:"incoming_edge"}`,
the exact selected branch/node/decision and intent; verify its genuine two-node path's parent
equals entryNodeId, and apply the same selected-parent open-retry gate. Re-read that owned
context and check cancellation/currentness before replying. No supplier, collector,
`compileInspectorSourcePage`, evidence factory, provider query or storage write runs for confirmation. Do not introduce a
second access owner or accept a client-supplied disclosure-open bit. The response is closed:

```ts
{ assistance: FinalizedAssistanceV1,
  review: { runId: string; branchId: string; nodeId: string; entryNodeId: string;
    fen: string; decision: ModuleDecisionStamp } }
```

These are the actual owned target and selected-child FEN, not blind request echoes. The client
strictly checks this whole target/stamp against its snapshotted map row/decision, parses the
existing finalized assistance and requires its requested digest to match the exact in-memory
intent and its context to match the confirmed map context. A refusal/failure/stale stamp stops;
the caller does not mutate its preferences or borrow another target's equal-valued help receipt.
Use the same provider availability and finalize function as Inspector source requests, so a
legally disclosed historical branch can confirm while active Play remains closed, but undisclosed
unfinished, rated, spectator, participant or open-retry targets never become authorized by this
envelope. An unfinished position already disclosed by the existing explicit-reveal/checkpoint
policy remains eligible under that actual owner; this amendment neither tightens nor opens its ceiling.

Only after that confirmation does the one UI action issue typed-PV, historical-PV, then
historical-first source requests, at most three. Each uses start:0/collectionKey:null, its exact
projection, context incoming_edge, the same snapshot run/branch/child/entry/FEN/decision and
requested/final assistance identities. Continue solely on exact source_absent; stop on failed,
refused, no_witness, unattributed, available (including deferred), any other unavailable or
cancellation. Never combine evidence or source keys from probes; only one final selected source
can render. A source appearing before a lower probe is independently reselected by its actual
owner and blocks fallback. No work occurs for a nonselected arm.

The existing decision digest binds eventHeadSeq/cursor/disclosureBoundarySeq, **not full event
bytes**. Reusing it across these read requests relies on legitimate append-only run mutation
(an append changes eventHeadSeq), while each actual source owner independently binds/rechecks
the complete original run/head/current grant. Do not claim a cryptographic cross-request fullhead
join, add a new head protocol or combine captures across probes. A changed decision/help/target
retires the whole action and requires explicit confirmation; no automatic retry loop or source
fallback after a mismatched receipt. Initial ordinary Review load acquires no line.

Full current Full Inspector compilation must succeed before any source resolution. The actual
server-owned current context supplies role, workflow, selected full run/head/branch/edge and
disclosure; sources/handles do not grant access. Refuse spectators/participants and workflows
outside the current Full Inspector ceiling **before** capture parsing/factory work. Additionally,
the source owner checks `openRetryEntry(actualRun, reviewedBranch) === parent.id` before work
and at retained read/publication: only that entry is withheld, not unrelated reviewed positions.
The ordinary map and Retry preparation never carry the line.

The current source-page operation owns complete-item fitting under unchanged Full Inspector
budgets. A complete over-budget line is **deferred** with an honest fixed caption; it is never
cropped or converted to a successful empty/shorter line. This topic has no bounded-detail door.
Analyze renders actual admitted components or actual source-status captions, not a parallel
unsealed `ReviewAnalysis.sentence` payload. Preserve the same focused Analyze/Hide/Retry action,
single-flight behavior, no private-error leakage, and independent request lifetime bound to
run/branch/move/entry/decision/help identities. Selection, branch/run replacement, help change,
Retry opening, Hide, close and unmount retire old completions before parsing/painting or focus
restoration. Authenticated service access/revoke/storage/role changes refuse before publication.

At the atomic caller cutover, retire the old runtime raw-packet admission helper and
`GET review-analysis`/old flat `ReviewAnalysisPage` delivery after all actual callers and
meaningful tests migrate. Pre-launch requires no legacy route or compatibility parser. A
temporary disconnected frontend/route or raw Full1 fallback is not a staged completion.

#### 7a.4 Acceptance / falsifiers for this bounded amendment

1. Actual complete Full Inspector compilation admits all three exact new source/view pairs; missing
   any source alternative, factory, nominal reader, convention or renderer fails before work.
   Every old65 source and six detail pair remains present. Exact totals are the ones in §4.11c.
2. Genuine recorded typed capture, original historical bestline and original eval-first sources
   each reach their exact sole factory, current operation, authenticated transport, strict receiver and
   explicit mounted Analyze seat for **both colours**. Typed input retains its original parsed
   provider source; no synthetic event/packet is required, and source acquisition writes nothing.
3. A genuine typed-only eval event (no bestline event) succeeds. Its same-FEN foreign capture,
   wrong original event ordinal, copied collection, crossed parent/child, current head, branch
   and caller-provided packet/text refuse. Actual source spies show only the selected path.
4. Corrupt latest typed capture plus a perfectly valid older typed/historical line fails without
   fallback. Absent typed key permits genuine historical selection. Present-empty typed capture
   is failed under the unchanged parser, not a fabricated genuine empty source. An actual original
   historical bestline with movesUci[] is the populated-record completed-empty control; no source,
   malformed historical, unattributed and whole-over-budget lines stay distinct. Preserve the
   typed request's literal maxPlies/truncated and its honest bounded-line caption; no second crop.
   Direct lower requests with present stronger metadata refuse variant selection without any
   nonselected factory; absent higher requests alone allow the next explicit probe. Same-value
   crossed renderer/projection/sourceArm receipts refuse, especially first move labelled as PV.
5. Preserve all existing full legal SAN/bound/engine, original FEN/colour/promotion/en-passant,
   first-move-versus-PV, read-only/provider-count, no-map-leak, role/session, open-retry/other-entry,
   cookie-auth and crossed receiver/lifetime/focus assertions. Rewrite obsolete transport
   fixtures to genuine current sources; do not delete those cases or make every outcome empty.
   Genuine authenticated Review→target-scoped assistance→source→mounted Analyze tests must
   cover an imported/completed historical branch while active Play disclosure is closed, the
   corresponding undisclosed/rated/open-retry refusals, actual changed provider availability,
   wrong entry/FEN/context/stamp/requested/final help, cancellation between probes and a stronger
   source appearing before a lower request. Ordinary assistance callers retain strict old shapes;
   ordinary Review remains source-free. Test spies require max3 queries and no extra parsing or
   source factories merely to discover the preferred topic.
   A genuine issued campaign encounter reports campaign (not raw pack), confirms only its
   actual earned/equipped ceiling, and cannot turn an ordinary pack into campaign via contextHint
   or a copied/forged receipt. Existing campaign suppression remains authoritative for Analyze.
6. Actual source/service spies prove zero provider requests/coordinator jobs/storage events even
   with an engine offline. Actual unrelated current Inspector topics remain demand-local.
   Revoke, disclosure, retry, storage and cancellation during acquisition/retained read/publication
   refuse; late successful replies do not become a live retry feed.
7. Normal focused runtime/server/web gates and full software/source/census/type/build gates run
   without skips, increased timeouts, changed budgets or threshold relaxation. Native authenticated
   desktop/phone Analyze→Hide→Retry and keyboard focus remain required independent journey proof;
   scripted DOM/source checks do not discharge them or this parent RFC's other obligations.

No new chess detector, strategic truth, engine calibration, campaign/pack scope, owner-preference
ruling or new review-selection policy is created. This is the explicit Analyze door already
required by §7, with its missing current-source contract made concrete.


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

> **Owner rulings 2026-08-23.** [[D1422]] — one ladder everywhere at **2.5/10/15**; criterion 4 must invert into a byte-identity-across-contexts fixture. [[D1423]] — the density cap is **rejected**: review may carry many moments provided it distinguishes a **brief note** from a **full review-this-move** moment, and ranks by educational value. [[D1424]] — one named signal, *excellent moves*, has no mechanism: the ladder measures loss only and has no positive class.

> **Owner ruling 2026-08-23 — [[D1409]] blocks acceptance of this document.** A judgement word is permitted only inside the exact rendered sentence that grounds it, byte-matched, and banned everywhere else in the output including elsewhere in the same packet. The Review Map may not land before `voiceCheck` enforces that. [[D1408]] — one grade ladder everywhere; [[D1406]]/[[D1407]] record why.

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
   second logistic and no second coefficient. *Fails if* `0.00368208` appears anywhere in the code
   trees (`apps/`, `packages/`, `tools/`, `tests/`) outside `grade.ts`.
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
| D5 | `compileModuleRegistry`'s first production invocation and the `ModuleDeclaration[]` roster it compiles | codex | the implementing commit | ✅ `63902370` (2026-09-24): `MODULE_REGISTRY` compiles the eleven declarations at import; `reviewMapProjection` admits its grade, evaluation and recorded-path relations through `module.review_map@1` ([[D1445]] repaired by the capability image) |
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

- 2026-11-03 — D4004 bounded draft: actual Analyze source audit finds the retired Full1 call and
  three distinct original source paths; §7a specifies one new current source-topic derivation,
  no synthetic bestline/old admission bypass and unchanged explicit/retry/read-only meaning.
  Joint independent review with module-registration §4.11c is required before implementation.

- 2026-10-13 — D3758 draft §2a separates exact incoming-edge collection from useful selected-move
  explanation. The 32-source compiler proposal does not expand moments, Inspector or Story and
  does not waive the still-open per-family selection decision. No acceptance or discharge.

- 2026-10-10 — D3668 recorded numbering repair under §§2–4/§6/§7: rows, graph and
  moment labels, Retry/Compare accessible names and Analyze's line/absence captions
  use the exact FEN fullmove counter rather than local rehearsal ply. The client
  checks row numbers/labels against their recorded resulting FEN. Local ply,
  run/node/entry identities, selection, grading and saved play remain unchanged.
  Black-first/non-1 starts have permanent runtime/mounted/application controls and
  desktop/touch-phone retry/Compare journeys. D3669/D3670 separately own Story-title
  and Profile-contributor source contracts; they are not closed by this repair.
- 2026-10-10 — D3665 Analyze admission/action repair: the web response boundary now requires
  the exact requested run, branch, move and entry position. Crossed responses fail visibly;
  the mounted reveal independently validates its current selection. One persistent native
  Analyze/Hide control retains focus through loading, success, failure and hide; pending work
  is single-flight and navigation/retry/departure retire it. The three predecessor-red controls,
  all 185 focused checks, clean types and actual desktop/touch-phone Analyze → different
  rehearsal → Compare journeys pass. Complete normal gates pass 4,459 software, seven
  unchanged-budget performance, 246 content and 271 browser cases, one optional Maia skip,
  zero retries and 150 input/112 composition cells. Recorded line acquisition, module ceilings,
  search, grading, moment selection and every existing discharge remain unchanged.

- 2026-10-09 — D3638 read/recovery repair: pending reads are single-flight rather than superseded
  each second. Failed/crossed refreshes keep the last confirmed exact branch and selected move,
  stop polling and expose deliberate retry; departed responses cannot publish or clear a new
  view's pending state. Refresh never reveals, claims, rewinds or forks; current evidence
  coordination, selection, source, permission and discharge obligations are unchanged. Automatic
  polling is quiet; explicit Refresh joins any in-flight read and announces its busy state once.

- 2026-10-07 — D3541/D3542 recorded-move entry repair: an optional exact node selects its stored branch and row without board mutation; missing nodes/branches and mismatched branch responses fail rather than selecting another move. `RunService.#storyContext` now admits the accepted unfinished recorded prefix. Its current reveal window must be open and live/rated contest restrictions still apply; completed/imported review preserves existing disclosure. Actual application, mounted and native browser checks cover the path. This changes no chess judgement or accepted packet vocabulary and does not complete all Review sources/return workflows.

- **2026-09-24 (Analyze line restored)** — after the Review evidence compiler landed, Analyze always
  said no engine line was recorded, because the typed evaluation delivery carries no PV. The Review
  pass now records each position's bounded line (`stockfish.principal_variation@1`,
  `provider-exchange-and-execution.md` §5.2). Analyze reveals it as specified: explicit and
  secondary, through `module.full_inspector@1`, attributed to the engine and its search bound,
  withheld while a retry is open, and never in the ordinary payload. It is still read-only
  (criterion 14).

- **2026-09-24** — D5 discharged by `63902370` (module-registration implementation). The Review Map now requires its viewer (`{ role, session }`): outside `review_map`'s derived role/session ceilings (Match, onramp, an operator) grades, evaluations and relations render as a stated withholding sentence.

- **2026-09-24 (merge of module registration with the remainder)** — the eval graph draws only evaluations `module.review_map@1` admits (a refused viewer gets the stated `graph.module.withheld` caption and no points), and the Analyze reveal carries principal-variation content, so its line is admitted through `module.full_inspector@1`: spectators, participants and contexts whose ceiling excludes the inspector (academy, onramp, Match) receive `analysis.module.withheld` instead of the line.

- **2026-08-23** — drafted on owner ruling [[D1273]] (*full surface plus accuracy and longitudinal*),
  from `planning/review/rfc-derivation.md`. Every load-bearing claim re-verified at HEAD before use:
  `grade.ts` at 214 lines with **zero production callers**; `derived.grade.move_quality` declared at
  `evidence-catalog.ts:812` with nothing implementing it; `compileModuleRegistry` with **zero
  production invocations**; `accuracy` at **0 hits**; the two-slice share divergence; the false
  provenance footer; and the `report` ladder constants read from source (5/10/15). Two citations in
  the derivation had drifted and are corrected here: the O7 self-block is `o7-handoff.md:5`, and the
  share cap is a `moments.slice(0,8)` inside `service.ts:915`'s `publicStory`.
- **2026-09-24** — implemented at the owner's direction (build now, no further review cycle); receipt
  `planning/review/implementation-2026-09-24.md`. Corrections made inline because the text was wrong,
  not because the design changed:
  - **§6 definition clamps the drop at zero.** `100 − mean(dropWinPercent)` is unbounded above: a
    move whose recorded evaluation *rises* has a negative drop and would push accuracy past 100. A
    drop is a loss, so the definition is `100 − mean(max(0, dropWinPercent))`; the grade ladder is
    unaffected (a negative drop never crosses a threshold).
  - **Criterion 7 is scoped to the code trees.** As written it was permanently red: this RFC,
    `rfc/move-quality-grades.md`, two planning notes and two research dossiers quote the constant.
    The assertion now covers `apps/`, `packages/`, `tools/` and `tests/`.
  - **Stale HEAD claims.** By implementation time [[D687]] and [[D688]] had already been closed
    (2026-08-25): the footer literal was gone and both Story surfaces called one ranked-eight reducer.
    This implementation deletes that reducer (`storyMomentSelection`/`selectedStoryMoments`) and
    `GameStoryScreen.svelte` outright; `selectReviewMoments` is now the only selector and the card
    builder reads the same moments. §4's *"`App.svelte:369-371` throws"* was also stale — re-entry
    already claimed the writer lease cross-device — so criterion 5's live case is a viewer without
    write access or a board held by another learner, which now renders the reason instead of
    throwing.
  - **§2 "the board is live".** Implemented as a navigable board (every row, previous/next and arrow
    keys select the ply; the evidence panel follows) rather than a piece-moving one: moving a piece on
    a reviewed position is exactly what `Retry from here` does, through the fork protocol.
  - **Ladder version.** [[D1422]]'s 2.5/10/15 ladder lands as `grade-convention@2` through the
    move-quality-grades register amendment, which has not landed; this surface renders the shipped
    `grade-convention@1` (5/10/15) and names the version in every grade sentence, so it picks the
    amendment up without a change here.
  - **[[D1423]] tiers.** Implemented as [[D1475]] reads it: every admitted story sentence at a node
    renders as a brief note in that move's evidence panel (uncapped); the 0..3 moment cards are the
    full review-this-move doors. The evidence panel also carries the recorded-semantic-path detector
    events for the move (that RFC's first production consumer) and renders the draft
    review-evidence-compiler packet as an explicit abstention.
- **2026-09-24 (remainder)** — the three pieces the first implementation left unbuilt, at the owner's
  direction (build directly, no review round); receipt appended to
  `planning/review/implementation-2026-09-24.md`. No specification sentence changed; how each was read:
  - **§6 eval graph.** A per-ply series over the durable evaluations with the accuracy coverage gate
    (a point is drawn only where the recorded packet reads as a grade operand), plotted as the review
    side's win-points through `winPercentFromCp` so a Black review is not drawn from White's side. It
    abstains per region: each stretch without a reading is shaded, left unconnected and stated in
    words, with a coverage sentence. Every ply is a keyboard stop that selects the move in the list,
    and a text list mirrors every point.
  - **§4 Compare handoff.** "A second branch on the same fork" is read as another recorded line that
    leaves the reviewed line at that position and carries at least one move of its own; an unplayed
    retry has nothing to compare. The door hands exactly those branch ids (reviewed line first, at
    most the shipped compare's eight) to the shipped N-way compare.
  - **§7 / O7.3 Analyze.** Explicit and secondary, served by a separate read-only endpoint so the
    ordinary map's payload never carries a line (criterion 12 now also has a payload-level guard). It
    reveals the *recorded* line at the position before the selected move — a `bestline` packet, else
    the eval packet's recorded search first move — attributed to engine and requested search bound;
    an unbounded line is not shown. "Verdict hidden during retry" is read as: withheld, server-side,
    for the position the run's open retry left from (active line diverges there, no outcome yet), and
    closed while a retry is being opened. Analyze requests no new search; requesting one would make the
    review write, against criterion 14.
