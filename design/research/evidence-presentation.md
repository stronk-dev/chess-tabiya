# Evidence presentation: from producer dumps to learner modules

**Platform-alignment question:** R3  
**Date:** 2026-08-20  
**Status:** mechanical and desk-research arms answered; interaction and participant exit remain
external  
**Instrument:** `tools/r3-presentation-harness/`

## Verdict

The current product has an evidence-source ladder and a form inventory, but it does not have a
learner-facing **module** contract between them. `[V]` The missing object is why the same raw census
appears as a structural-reading list, square lighting and an LLM packet, while settings expose 54
source/mechanism controls. The user is configuring plumbing rather than choosing what help they
want. (`design/05-in-run-experience.md` §§3, 3-forms;
`apps/web/src/lib/AssistanceSettings.svelte`; `apps/server/src/guidance.ts`)

The mechanical candidate is:

```text
producer records
  -> semantic eligibility
  -> local selection + per-module budget
  -> named learner module
  -> sentence / square / arrow / timeline / audio form
  -> optional bounded LLM rendering
```

`[M]` A **workflow preset** activates a small set of modules; it is not another evidence source.
A **session-kind ceiling** limits what a preset may offer; it does not choose the default. A
**full inspector** is a deliberate analysis mode, not the fallback when selection fails. These
distinctions preserve `design/05`'s source/timing/form rules while supplying the missing UX object.

This does not clear R3. `[V]` The shipped board fails A2's exact-interaction floor, the in-app
browser was unavailable for this pass, and no nontechnical learners were recruited. Therefore the
module and preset names below are research candidates, not a default ruling or RFC input ready for
implementation.

## Method and population

The pass used four evidence sources:

1. `[V]` Static source tracing of all nine assistance axes, six stored profiles, the in-run rail,
   board-overlay derivation, human-model rendering, ambient affordance, system-arrow use and all
   `evidencePacket()` assembly (`apps/web/src/lib/AssistanceSettings.svelte`;
   `apps/web/src/lib/DrillScreen.svelte`; `apps/server/src/guidance.ts`;
   `packages/runtime/src/assistance.ts`).
2. `[V]` A disposable corpus census over **611 unique authored-spine positions** and **12,236
   occupied-square selections**. This exactly reproduces the shipped square filter and mark
   expansion; it does not claim that every square is equally likely to be selected.
3. `[V]` Synthetic, explicitly non-chess fixtures exercising zero/one/many facts, abstention,
   consumer mismatch, disclosure order and move/PV leakage against eight module contracts. Five
   tests pass. No fixture asserts chess truth.
4. `[V]` Current official descriptions of Chess.com Game Review and Chessiverse Guided Play,
   W3C interaction requirements, plus `[P]` transfer evidence from tutoring and alert research.
   Vendor descriptions establish what a competitor says it offers, not effectiveness.

Negative cases were predeclared: zero eligible facts must render an honest absence; a later-rung
fact must not enter an earlier module; a fact for another consumer must not transfer merely because
its text fits; a non-recommending module must refuse recommended moves and PVs; hover may not be the
only path. `[V]` The disposable compiler passes all mechanical cases.

## 1. What ships is a matrix of knobs, not a help experience

`[V]` `AssistanceConfig` has nine axes and `ASSISTANCE_PROFILES` has six profiles. Settings repeats
every axis for every profile, yielding **54 primary controls** before provider-status and account
controls. Labels name implementation concepts: *board lighting*, *arrows*, *spoken guidance*,
*ambient presence*, *passive markers*, *named-pattern guidance*, *human move split*, *corpus
counts* and *external voice*. (`apps/web/src/lib/AssistanceSettings.svelte`;
`apps/web/src/lib/assistance-preference.ts`)

`[V]` The in-run rail repeats the source/mechanism language. The human-model result is rendered as
raw UCI and rounded policy mass (`candidate.moveUci 31%`), while corpus evidence is exposed as
counts. `ambient` creates a button labelled *Open assistance* with stateful title text but no
action. The `arrows` preference is not read by a renderer. (`apps/web/src/lib/DrillScreen.svelte`;
D158/D326/D397)

This sharpens D484 rather than replacing it. `[M]` Per-context storage and advanced source controls
may remain useful for experts and self-host operators. They are the wrong primary abstraction for a
learner asking one of these questions: *let me play*, *give me a nudge*, *what changed?*, *why did
these attempts differ?*, *how does this connect to theory?*, or *let me analyze everything*.

## 2. Board lighting is the structural census made visual

`[V]` When a square is selected, `DrillScreen` takes every
`structuralReading(displayedNode.fen).features` entry containing that square. It renders every
matching observation as a caption and expands every observation's square list into blue marks.
There is no semantic eligibility, local counterfactual denominator, significance/valence check or
card/mark budget. `sight` and disclosed `evidence` use the same selected observations.

Measured over occupied squares in the authored-spine population:

| Per selected occupied square | median | p90 | p95 | max |
|---|---:|---:|---:|---:|
| Captions | 2 | 7 | 9 | 11 |
| Drawn marks, including duplicates | 3 | 12 | 14 | 19 |
| Unique marked squares | 1 | — | 6 | 9 |

`[V]` The worst query is `d5` in
`rnb1kbnr/ppp1pppp/8/3q4/8/2N5/PPPP1PPP/R1BQKBNR b KQkq - 1 3`: **11 captions,
19 marks and 9 unique squares**. Its kinds are `pawn_safe_square`, eight `line_blockers`,
`direct_attack_count` and `piece_reach_count`. R1 has already made `pawn_safe_square` ineligible
for its advertised meaning (D566), and R2 established that distinctiveness alone does not make the
remaining facts significant (D569-D572).

So the finding is not merely that the overlay is busy. `[V]` It bypasses both compiler gates that
the immediately preceding research established. A gesture is currently a query against the
producer census.

## 3. The LLM sees the same unselected world

`[V]` `evidencePacket()` inserts the complete structural feature list, every matching shape plan,
all deliverable authored text, pivotal markers, endgame data and recorded readings. Its deterministic
sentence list likewise includes all matched structure and authored sentences. The packet has no
module/consumer identity, eligibility decision, counterfactual denominator, selection reason or
output budget. (`apps/server/src/guidance.ts`)

`[V]` `voiceCheck()` constrains generated vocabulary after the provider returns; it does not select
the relevant fact, establish valence or protect against an authored sentence widening the permitted
vocabulary (D421). The present LLM is therefore not an independent chess oracle, which is good, but
it is still downstream of the wrong packet.

The R4 result narrows the answer. `[V]` A semantic retrieval/reranking service did not beat the
exact+FTS baseline and failed safety/provenance gates. The 1.0 LLM does not need more retrieval
agency. It needs **less input authority**: a selected, typed module packet whose facts and citations
are already fixed. (`design/research/theory-knowledge-pipeline.md`)

## 4. What the competitors demonstrate — and what must be transformed

### Chessiverse: good intent ladder, incompatible strongest modes

`[V]` Chessiverse describes three Guided Play levels: Full Help grades every legal move and keeps
an evaluation bar visible; Peek reveals grades after holding a piece; Hint Only keeps the board
clean until requested. It also describes a four-step hint ladder (threat, direction, piece, move),
a pre-commit Blunder Guard, preserved what-if branches and an opening-guide→coached-game link.
([Chessiverse Guided Play](https://chessiverse.com/guided-play))

`[M]` Full Help, Peek and the pre-commit guard conflict with Tabiya's current commit-before-learning
invariant; copying them would turn evidence into move selection. The transferable ideas are the
**intent names**, progressive request ladder, clean-board option, preserved branches and direct
theory↔play link. Whether exact rung-0 sight may be pulled pre-commit is already an owner question;
this pass does not answer it by importing a competitor default.

### Chess.com: guided review and explanation-bound visuals

`[V]` Chess.com's official Game Review description separates a guided coach path through key
moments from self-analysis and opening exploration. On a bad move, Retry lets the learner attempt
the position before Show Moves reveals an engine continuation.
([Chess.com Game Review](https://www.chess.com/terms/game-review)) Its 2024 redesign places the
coach and retry/continuation actions together, while best-move arrows and live engine feedback sit
inside explicit Analysis; it also acknowledges that piling features into Analysis makes it harder
to navigate and supplies hide/show controls.
([Game Review design update](https://www.chess.com/news/view/game-review-design-update))

`[V]` Chess.com's visual explanations do not light the board as an independent evidence feed.
Hovering or clicking highlighted words in a specific coach explanation draws the corresponding
arrows and squares.
([Visual explanations](https://www.chess.com/news/view/chesscom-launches-game-review-v2?page=2))
`[M]` That binding is the useful primitive: a visual form should be an alternate rendering of one
admitted sentence, not a second unbounded query.

## 5. Attention and progressive help: transfer evidence, not a chess result

`[P]` A study of on-demand progressive hints in a middle-school mathematics tutor found that the
effect of early hint availability differed between school-year and summer populations; the authors
conclude that hint utility depends on context. This supports testing help timing instead of treating
progressive hints as universally beneficial.
([Inventado et al., 2018](https://pmc.ncbi.nlm.nih.gov/articles/PMC6310403/)) It does not establish
the right chess preset or justify a move-revealing hint.

`[P]` Alert-fatigue research is an analogy rather than product evidence. In one large clinical
decision-support study, acceptance fell as repeated reminders per encounter increased; the paper
links poor response to repeated, low-information alerts.
([Ancker et al., 2017](https://pmc.ncbi.nlm.nih.gov/articles/PMC5387195/)) Combined with the local
11-caption/19-mark tail and R2's measured low-information families, it makes **volume and repetition
explicit test variables**. It does not justify a clinical safety claim about chess software.

## 6. Disposable module contracts

The harness makes the missing layer concrete:

| Candidate module | Learner intent | Timing | Activation | Fact cap | Move/PV |
|---|---|---|---|---:|---|
| Rules floor | Make legal interaction visible | pre-commit | automatic | 0 evidence facts | refused |
| Sight on request | Answer one concrete board-sight question | pre-commit | request | 1 | refused; **owner boundary** |
| Post-commit nudge | Name consequences of the played move | post-commit | automatic | 2 | refused |
| Guided hint | Reveal progressively after consent | disclosed | request | 2/stage | final stage only |
| Compare coach | Name the smallest grounded branch difference | disclosed | request | 2 | refused |
| Theory breadcrumb | Link one applicable cited passage to rehearsal | post-commit | request | 1 | refused |
| Review Map | Turn selected moments into replay/theory actions | analysis | automatic | 3/moment | permitted |
| Full inspector | Expose attributed raw evidence and lines | analysis | explicit mode | 20 | permitted |

`[M]` The numbers are prototype bounds selected to exercise the mechanism, not validated defaults.
They are compatible with R2's measured cap-one/two/three sensitivity, but only participant work can
tell whether the modules answer the intended question. Critical rule events may override a cap only
under the explicit compiler rule already measured by R2; an LLM may never decide that override.

Every module declares:

- learner intent, timing and activation;
- accepted evidence kinds/versions and consumer ID;
- maximum facts and marks;
- whether recommendation/PV fields are legal;
- supported forms and an equivalent sentence;
- honest zero-fact state;
- provenance and LLM-off renderer;
- touch, pointer and keyboard paths.

`[V]` W3C requires hover/focus content to be dismissible, hoverable and persistent, and recommends
that hover-triggered content also be available on keyboard focus.
([WCAG 2.2 hover/focus guidance](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html))
It also requires non-path single-pointer alternatives for path/multipoint gestures and recommends a
select-then-destination alternative to dragging.
([WCAG pointer gestures](https://www.w3.org/WAI/WCAG22/Understanding/pointer-gestures.html)) Target
controls should normally meet a 24×24 CSS-pixel minimum or spacing/equivalent exception.
([WCAG target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)) Therefore
hover-to-light may be a convenience, never the sole discovery or activation path.

## 7. Workflow-preset candidates for the participant arm

These are task labels to test, not settings to ship:

| Candidate preset | Default modules | Advanced escape hatch |
|---|---|---|
| **Just Play** | rules floor; silence until a committed consequence | assistance drawer after allowed boundary |
| **Guided Rehearsal** | rules floor; post-commit nudge; disclosed progressive hint on request | customize module intensity |
| **Learn This Position** | objective/theory context; consequence play; theory breadcrumb after commitment | open cited theory or inspector |
| **Review & Retry** | Review Map; retry/branch; compare coach; theory link | full game analysis |
| **Analyze Freely** | explicit full inspector | hide/show producer families |
| **Coach / Stream** | attributed human marks and audience-safe run modules | role/permission controls, not learner evidence settings |

`[M]` The strongest candidate for a fresh nontechnical user is to choose a workflow once, then show
the advanced 54-axis matrix only under Customize. The participant tasks must begin from a fresh
profile and ask users to start each named job **without visiting settings**. Success is not stated
preference: the user must choose the intended workflow, know when help will appear, find a nudge,
recover from zero evidence, and reach analysis without accidentally enabling pre-commit answers.

## 8. Design gaps and decisions this permits

**DESIGN-GAP:** `[V]` `design/05` says presentation is orthogonal to source and that
`AssistanceConfig` owns the matrix. That remains sound at the evidence/form layer, but it omits the
consumer/module and workflow-preset layers. The omission is now visible in both board and LLM paths.

The evidence permits these narrow decisions:

1. `[V]` Do not treat current board lighting or `evidencePacket()` as the evidence-compiler
   implementation. Both bypass R2.
2. `[V]` Do not expose the nine axes × six profiles as the primary learner setup.
3. `[M]` Require every evidence UX to name a module/consumer, timing, budget, abstention and
   equivalent sentence before it can claim a form.
4. `[M]` Keep raw evidence and engine lines in an explicit inspector; do not delete expert analysis
   in the name of simplicity.
5. `[M]` Carry the six workflow candidates into R3/R9 participant work; do not rule defaults from
   competitor pages or this source audit.

The pass does **not** permit an assistance RFC, preset implementation, pre-commit blunder guard,
semantic detector, content wave or claim that the UX is understood by nontechnical chess players.

## 9. Residual work and exact exit

R3 completes only when:

- D537/D573 no longer invalidate the board interaction baseline;
- the eight modules are exercised on desktop, tablet and phone through tap/click, drag, hover,
  keyboard and screen-reader-accessible controls;
- visual output is proven to be the same admitted fact as its sentence, not an independent query;
- zero/one/two/noisy and unavailable-provider cases are shown honestly;
- nontechnical learners start Just Play, Guided Rehearsal, Review & Retry and Analyze Freely without
  source settings, and comprehension/noise failures select or refuse defaults;
- the owner rules the pre-commit rung-0 boundary and per-session ceilings;
- R5 proves or refuses the optional renderer over these bounded packets.

Until then, R3 is **MECHANICAL/DESK DONE; EXTERNAL to complete**.

