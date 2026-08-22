# RFC: Play composition

- **Status:** draft
- **Author:** claude (drafted on the D717 program routing, Phase 4)
- **Created:** 2026-08-22
- **Design refs:** `design/05-in-run-experience.md` §1 (invariants), §2 (the five regions),
  §3-forms (form inventory and the alternate-rendering acceptance test), §3a (silence default);
  `design/03-product-breadth.md` §IA (the inspector as a deliberate separate surface)
- **Exploration gate:** the D717 program (`planning/evidence-foundation-ux/plan.md`), Phase 4 —
  opened by the owner's use-rejection ruling of 2026-08-22 ([[D717]]) and briefed as
  *"board-stage + companion rail/drawer/sheet; nothing above the board"*. Phase 7's acceptance
  matrix rides in this RFC per the same routing (plan.md rows 4 and 7).
- **Depends on:** `rfc/learner-modules.md` (**accepted 2026-08-22** — supplies the eleven module
  contracts, the closed seat-class vocabulary of its §1.11, the one-board-adjacent-cue registry
  invariant, and the honest-empty states this composition must seat). Implementation of the
  module *seats going live* additionally waits on that RFC's own sequencing (after 2c/2d land);
  the composition shell, board-stability mechanism and acceptance matrix do not.
- **Parent / amends:** replaces the shipped play-screen composition of
  `apps/web/src/lib/DrillScreen.svelte` (the D717-rejected layout, traced at the symbol in
  [[D718]]). The drill *controller*, run semantics, board input
  (`archive/accessible-board-input.md`'s controller) and every module contract are untouched;
  this RFC moves where things sit and what vocabulary the play surface may speak, not what
  anything means.
- **Supersedes / superseded by:** —
- **Planning:** `planning/play-composition/` (once implementing)

```tabiya-claims
none
```

**Why `none`, verified at HEAD `ddcc977` rather than assumed.** Every deliverable is web
composition code, browser tests and docs: Svelte layout components, CSS tokens, Playwright
matrix coverage, screenshots and one docs page. None of the six shared-resource registers is
touched: `DRILL_PACK_SCHEMA_VERSION` (0.27), the run schema (0.17), shape-entry (0.3),
principle-entry (0.1), the migration register (head 24) and `EVIDENCE_KINDS` (7 members) are
all unmoved. No `AssistanceConfig` version move (version stays 4 — preset storage is
Phase 5's), no route-schema or error-code lane, no evidence-catalog byte moves (the module
registry and its eligibility rows are `learner-modules.md`'s to land). `node
tools/register-check.mjs` passes with this block declaring `none`. `node
tools/status-parity.mjs` reports exactly one expected P3 error until the index row for this
file is written — the index edit is withheld from this drafting change by instruction and is
the register owner's recording act (criterion A15).

## Summary

This RFC specifies the Phase-4 rebuild of the play screen: a **board stage whose rendered
geometry is a function of viewport alone**, a **companion region** (desktop rail / tablet
bounded queue / phone bottom sheet) that seats the eleven accepted module contracts through
their declared seat classes, a **separate opt-in full-inspector surface**, and — riding in this
RFC per the program routing — the **Phase-7 interaction-state acceptance matrix**: seven
viewports × fourteen composition states, asserted **post-gesture**, screenshotted, running on
the existing browser CI path.

The normative core is already ruled and is quoted, not re-decided: the two field invariants
every surveyed product holds — **(a) nothing that grows sits in the board's column; (b) when
content exceeds its region, the region scrolls, tabs, or collapses — the board is never resized
by content** (`design/research/competitor-play-ux.md` §2, [[D875]]); [[D717]]'s six rejection
clauses; [[D841]]'s cap — *"at most ONE board-adjacent cue (Keep-Me-Safe); everything else
queues into the rail with count badges rather than expanding"* — with `learner-modules.md`
§1.11 assigning the one `board_adjacent` seat to `blunder_prevention` at `at_commit`;
[[D876]]'s fix (the cue is a companion-region card, the board pixel-identical calm↔max-load);
and [[D877]]'s residue (the max-load state answered at **every** viewport, not drawn at
1440 px). The 15 class-7 leak sites of `phase1-gap-matrix.md` §4 each receive a **named
destination** (§5); a leak with no destination is a criterion failure. Raw UCI, raw eval
numerals and producer vocabulary are legal **only** in the inspector; every other surface
speaks SAN and chess meaning.

## Motivation

The owner rejected the shipped play experience in six named defects ([[D717]]): working
content stacked above the board; every added block shrinking the board; clipped or nested
overflow; raw classifier sentences, UCI, percentages and producer terminology in ordinary
play; plumbing exposed instead of intent; and a 192 px board accepted as viewport proof. The
D718 trace located the mechanism at the symbol: `DrillScreen.svelte:873` places objective,
variant link, phase reading, trajectory status, outcome context, banner and both evidence
inspectors **inside `.position-column` above `.board-slot`** (`DrillScreen.svelte:925`), the
board frame receives only the flex remainder (`width: min(100cqw, 100cqh)`,
`DrillScreen.svelte:1340`, with the content-coupled `calc(100cqh + 8.9rem)` correction at
`:1501`), and the enclosing regions clip (`overflow: hidden` at `DrillScreen.svelte:1164`,
`:1186`, `:1260`, `:1274`, `:1334`, `:1508` among others). The shipped viewport gate
(`assertRunViewport`, `tests/browser/drill.spec.ts:38`) asserts containment and
`width ≥ 192` (`:50`) — it cannot fail on any of the six defects. The field study located the
shipped screen precisely: **an inspector wearing a play screen's URL**
(`competitor-play-ux.md` §3).

`learner-modules.md` made the play-column placement of inspector content non-conformant by
contract (its 4.11 declares `explicit_surface`) and named this RFC as the discharger of its D2
row (*"Board-protected composition seating the declared seat classes across viewports"*).
This RFC is that discharge.

**Scope boundary — composition, vocabulary law and the acceptance matrix, nothing else:**

- **No preset semantics.** Which preset activates which modules, preset names, defaults,
  the intent dial and the effective-config algebra are **Phase 5's** (with the
  `assistance-controls` reconciliation the plan names). This RFC reserves the preset pill's
  *slot* in the shell topbar and the "quiet by choice" disclosure's *seat*; their semantics
  are not chosen here. The shipped 54-control assistance matrix is likewise Phase 5's to
  transform; this RFC only removes it from the play column (§5, L5/L6 placement).
- **No module internals.** Contracts, accepts-lists, budgets, reducers, renderers, packet
  sealing and honest-empty *sentences* are accepted in `rfc/learner-modules.md` and are
  consumed here as given. This RFC decides where a packet renders, never what it contains.
- **No campaign surfaces** (`design/06` encounters, map, progression) and **no Story or
  Review-map layout beyond their declared seats**: `review_map` gets its `timeline` marks
  and its `explicit_surface` entry point here; its moment selection and the Story re-basing
  stay in their named lanes ([[D901]]).
- **No theming lane and no animation lane.** [[D839]] (dark theme, board/piece sets) and
  [[D840]] (the animation repair and its None/Normal pref) are their own later work. This
  RFC's obligations to them are hooks only (§7): token-driven styling with no new hard-coded
  light-theme values, and a composition that does not *defeat* chessground's animation.
- **No collector, evidence-catalog, schema or migration work** of any kind.

## Specification

Normative vocabulary: the **stage** is the board's exclusive layout column. The **companion
region** is the single bounded region beside (desktop) or below (tablet/phone) the stage that
seats everything else. A **seat** is a fixed position in the companion region a module renders
into. The **queue** is the companion region's collapsed form: one expanded seat, every other
occupied seat collapsed to a badged row. An **overlay** is a layer that paints above the
composition and contributes nothing to layout.

### §1 — The two field invariants, made law

Quoted from the field dossier and binding on every viewport class:

1. **Nothing that grows sits in the board's column.** The stage contains only fixed-height,
   token-defined elements (§3.2). No module output, caption, banner, objective text, guard
   prompt, menu or inspector content may ever be a layout child of the stage.
2. **Content never resizes the board.** When content exceeds its region, the region scrolls,
   tabs, or collapses. The board's rendered geometry is a function of viewport alone (§3.1).

These are the invariants **every** surveyed product holds, from minimal Noctie to maximal
Nibbler (`competitor-play-ux.md` §2) — the composition claims no originality here; it claims
conformance.

### §2 — The layout system per viewport class

Three composition classes, bounded by two breakpoints, both tokens:
`--bp-phone-max: 719px` (the shipped shell breakpoint, `App.svelte:994` /
`DrillScreen.svelte:1507`) and `--bp-tablet-max: 1023px` (new).

Table caption — unit: **viewport class**; total: **3**. Criterion A1 verifies the same three.

| class | width | composition | companion region | working draft |
|---|---|---|---|---|
| desktop | ≥ 1024 px | stage column + fixed-width companion **rail** (`--rail-w`, 336 px at 1.0) | vertical rail; scrolls internally; queue behavior §2.4 | `play-canvas/Main.dc.html`, `FullDark.dc.html` |
| tablet | 720–1023 px | board-first stack: stage, then **one bounded companion band** of fixed height | the queue head card + badge row; content swaps in place | `play-canvas/Tablet.dc.html` (with the §2.3 objective correction) |
| phone | ≤ 719 px | board-first stack: stage, then **bottom sheet** | collapsed rim carries badges; expansion overlays | `play-canvas/Phone.dc.html` (with the §2.3 chips correction) |

The canvas artboards at the play-composition artifact are the working draft this RFC cites —
**as corrected**: the max-load artboard now seats the Keep-Me-Safe cue as the rail's top card
with the board pixel-identical at 80 px squares in calm and max-load (the [[D876]] fix,
verified in `FullDark.dc.html` against `Main.dc.html` at drafting), and §2.3 names the two
remaining corrections this RFC makes normative rather than redrawing.

#### 2.1 Desktop — stage + companion rail

- **Shell topbar** (fixed height `--topbar-h`): pack title, run context, the preset pill slot
  (semantics Phase 5), the Inspector entry. Shell chrome, present on every route — not run
  content.
- **Stage column**: the board frame and, below it, the **timeline strip** — one fixed-height
  (`--strip-h`) horizontally scrolling cell carrying SAN move chips and inline branch chips
  (region 2's in-stage projection; the lichess `moves` grid-cell precedent, and the fix for
  the canvas draft's `overflow: hidden` strip). The strip scrolls on its own x-axis, never
  wraps, never grows.
- **Companion rail** (`--rail-w`): from top — the objective block (region 1's claim half;
  clamped, expands *within* the scrolling rail), the state chips, then the **module seats**
  (§4), then the branch section (region 3), then the standing disclosure footer (the
  silence/preset sentence — presentation of a Phase-5 fact, seat only). The rail scrolls
  internally; the board never pays.

#### 2.2 The max-load answer at every viewport ([[D877]] — the collapsed queue)

The max-load state is every seatable module active at once. The answer is the same **queue
pattern** at all three classes — one seat expanded, rotating content, count badges — not a
desktop drawing:

- **Desktop**: every occupied seat renders as a rail row; **exactly one seat is expanded at a
  time**; the rest collapse to fixed-height badged rows (`Threat radar · 1`). Opening a seat
  collapses the previously expanded one. Overflow beyond the rail's height scrolls inside the
  rail.
- **Tablet**: the companion band has constant height (`--band-h`). It holds the **queue
  head** — the one expanded seat — plus a single badge row naming the other occupied seats
  (`+3`). Selecting a badge **swaps the head's content in place**; the band never adds rows
  and never changes height. Content taller than the head scrolls inside the card.
- **Phone**: the sheet's **collapsed rim** (constant height `--rim-h`, in layout below the
  strip) carries the badges. Expanding the sheet is an **overlay**: it paints over the
  board's lower edge with a scrim, contributes no layout, and never moves the board. One
  seat expanded inside the sheet at a time, same swap rule. A visible drag-handle/dismiss
  affordance is mandatory.

At every class the board's rendered geometry in the max-load state is byte-identical to the
calm state (§3, criterion A2/A6). The one `board_adjacent` seat is the queue's **reserved head
slot** (§4.2) — priority, not geography.

#### 2.3 Tablet and phone — the stack, and two canvas corrections made normative

Stack order, top to bottom, tablet: topbar · board · strip · **objective/state line** ·
companion band. Phone: topbar · board · strip · objective/state line · sheet rim.

- **Nothing above the board.** Between the shell topbar and the board there is nothing, at
  any viewport. This corrects the phone artboard, which drew a status-chip row above the
  board — the chips move to the objective/state line below the strip. (The field *ceiling*
  is a thin identity bar; the brief's rule is stricter and is the one we ship.)
- **The objective outranks feedback** (the dossier's §4.4 criticism, corrected): the
  objective/state line is a **fixed-height** (`--objective-h`), single-line, ellipsized
  element adjacent to the board — region 1 binds board and objective together. Tapping it
  expands the full objective as an **overlay**, never a reflow. The tablet artboard's
  demotion of the objective to a footer below the feedback card is corrected.
- Regions 2 and 3 (timeline detail, branch rail) are reachable at tablet/phone through the
  companion region's structural seats (§4.4) — the shipped compact-tab affordance
  (`DrillScreen.svelte:868`) may survive as the sheet/band's section switcher; that is an
  implementer choice inside the bounded region, not a composition variable.

#### 2.4 The full inspector — a separate opt-in surface

The `explicit_surface` seat class renders **outside the play composition**: a distinct
surface (route or full-screen mode under `/play/run/:runId`; the route split is the
implementer's, the *separateness* is normative) reached only by the topbar's Inspector entry
and the "Why"/provenance doors on module cards. It hosts `module.full_inspector` and subsumes
the four shipped inspector consumers exactly as `learner-modules.md` 4.11 declares
(`inspector.position_structure`, `inspector.move_transition`, `inspector.human_split`,
`inspector.corpus` become its sub-surfaces). It is never the fallback when selection fails,
never seated in the play column, and it is the **only** surface where raw UCI, raw eval
numerals, producer vocabulary, percentages-as-mass and trigger ASTs are legal (§5.1). This is
field pattern 6 held to its legitimate home (`competitor-play-ux.md` §2.6) and the design-tier
IA ruling made layout.

### §3 — Board-size stability as a testable invariant

#### 3.1 The geometry function

The board's rendered edge length is a **closed-form function of viewport dimensions and
design tokens, with no content-dependent term**:

```
desktop: edge = snap8(min(vw − railW, vh − topbarH − stripH) − 2·stagePad)
tablet:  edge = snap8(min(vw − 2·stagePad, vh − topbarH − stripH − objectiveH − bandH − gaps))
phone:   edge = snap8(min(vw − 2·stagePad, vh − topbarH − stripH − objectiveH − rimH − gaps))
```

where `snap8` rounds down to a multiple of 8 CSS px (integral squares, and it makes
byte-equality assertable), and every named term is a constant token per viewport class. The
formula is normative in shape, not in constant values: an implementer may tune token values,
but **no term of the formula may be measured from content**, and the tokens are compile-time
constants, not runtime-computed. The shipped mechanism this replaces — a container-query
remainder (`container-type: size` at `DrillScreen.svelte:1335`, board
`min(100cqw, 100cqh)` of whatever the stacked content left over — is exactly the defect: it
makes board size `f(viewport − content)`.

The 192 px clause is retired as *proof*: a board that shrinks to fit content proves the
composition wrong, not the viewport handled ([[D717]] clause 6). A minimum-legibility floor
may remain as a sanity assert, but no criterion in this RFC is satisfied by "the board fits."

#### 3.2 What may never insert into the board's layout ancestors

The stage column's layout children are **closed**: the board frame, the timeline strip, and
(tablet/phone) the objective/state line — each of constant token height. Everything else in
the DOM path from the composition root to the board element is layout-inert with respect to
state. Explicitly barred from the board's layout-ancestor chain, in any state:

module packets and cards; captions (the shipped `overlay-caption`,
`DrillScreen.svelte:959`, is retired from layout); banners (`WhyBanner`); objective, variant,
phase, trajectory and outcome sections (`DrillScreen.svelte:874-903` — the D718 stack);
inspector sections (`:906`, `:915`); guard prompts; menus and popovers; the checkpoint sheet;
mark controls; honest-empty sentences; loading/provider states. Each of these lives in the
companion region, in an overlay layer, or on the board's own paint layer (chessground's
squares/SVG — zero layout cost, field pattern 3).

This kills the [[D537]] class **structurally**: the caption-reflow that moved the board
17–96 px under selection cannot recur, because in this composition no state change can insert
or resize a layout box in the board's ancestor chain — the selection caption is a companion
seat (`sight_on_request`) and board marks are paint. D537's *repair* (selection-bound bounds
invalidation in the Chessground wrapper) remains in place and is not weakened; this RFC
removes the class of trigger.

#### 3.3 The testable statement

At a fixed viewport, `getBoundingClientRect()` of the board element is **identical — x, y,
width, height, to the CSS pixel — across all fourteen composition states of §6**, including
every state D717 lists (selection, hint, guard, menu, long objective, evidence-unavailable,
inspector open/closed, timeline change) and the max-load state. Measured **post-gesture**
(§6.1). Criterion A2.

#### 3.4 The animation non-defeat constraint ([[D840]] hook, not its fix)

The shipped screen recreates the board component every move:
`{#key `${displayedNode.id}:…`}` around `<Chessboard …>` (`DrillScreen.svelte:928`) destroys
and remounts the component per node change, so chessground's `board.set()` FEN-diff animation
(`Chessboard.svelte:257`, `redrawAfterLayout` `:173`) never sees a diff — the named
keyed-re-render hazard. **The rebuilt composition must keep one stable board component
instance across moves within a run** and update it through `set()`; a keyed re-render on node
identity is non-conformant (criterion A9, which starts red at HEAD). The animation *pref*
(None/Fast/Normal per the [[D875]] floor) and the felt-quality verification are the
[[D840]]/[[D839]] lane's — this RFC only refuses to make that lane impossible.

### §4 — Seat classes bound to `learner-modules.md`

The seat-class vocabulary is `learner-modules.md` §1.11's, closed:
`board_input | board_adjacent | rail | timeline | explicit_surface`. This RFC binds each class
to a composition region. Table caption — unit: **module id**; total: **11**, matching the
accepted §4 module table; criterion A5 verifies the same eleven.

| module | declared seat | renders in |
|---|---|---|
| `rules_floor` | board_input | the board's own affordance layer (legal-destination dots, from the board input controller) — paint, zero layout |
| `blunder_prevention` | board_adjacent | the companion region's **reserved head slot** (§4.2) |
| `sight_on_request` | rail | companion module seat |
| `threat_radar` | rail | companion module seat |
| `postcommit_nudge` | rail | companion module seat (the verdict/consequence card of the canvas draft) |
| `structure_nudge` | rail | companion module seat |
| `theory_breadcrumb` | rail | companion module seat |
| `guided_hint` | rail | companion module seat |
| `compare_coach` | rail | companion module seat (checkpoint/review timing) |
| `review_map` | timeline + explicit_surface | timeline marks on the strip; the map itself opens as a review surface, not a play-column panel |
| `full_inspector` | explicit_surface | the §2.4 separate surface |

#### 4.1 Seat mechanics

A **seat** exists when its module is composable in the effective configuration (a Phase-5
fact; until Phase 5 lands, fixture-driven — the learner-modules D1 honesty note carries
through). An occupied seat renders in one of three visual states: **collapsed** (fixed-height
badged row — the count badge is the module's fact count, which retires the L2 topbar
counter), **expanded** (the packet's card), or **empty-quiet** (§4.3). `on_request` modules'
collapsed rows are their request affordance.

**The open/close protocol**: at most one seat expanded per companion region at a time;
expanding one collapses the previously expanded seat to its badged row; every expansion and
collapse changes only companion-region internals (rail scroll extent, head-card content,
sheet overlay) — never stage layout. Critical events (the R2 set, unchanged) may auto-expand
the `postcommit_nudge` seat; nothing else self-expands except the §4.2 cue.

#### 4.2 The one board-adjacent cue, reconciled with the field invariant

[[D841]] caps board-adjacent cues at one and `learner-modules.md` assigns it:
`blunder_prevention`, `at_commit`, Support preset only. [[D876]] ruled its geometry: **the
cue is a companion-region card and the board stays pixel-identical.** Reconciliation, stated
once: `board_adjacent` is a **priority contract, not a geographic one** — the cue owns the
companion region's reserved head slot (rail top / queue head / sheet rim's alert state), may
appear proactively (its O4-ruled initiative), and is the only module that may displace the
currently expanded seat. It never renders in the stage column. Its at-commit appearance and
disappearance obey the same rule as every seat: companion internals only. An optional
same-fact on-board echo may accompany it on the paint layer under §4.5.

#### 4.3 Honest-empty renders as a quiet seat, never a lying fullness

Each module's `emptyBehavior` is contract (`learner-modules.md` §1.10). Composition rules:
`silent` → **no seat row at all** for proactive modules (`blunder_prevention`,
`postcommit_nudge`: absence of the card *is* the rendering; no placeholder, no "all clear");
`stated_absence` / `unavailable_source` → the declared fixed sentence renders **inside the
seat's normal card** at its normal size when the module is opened or requested — never a
banner, never board-column text, never a spinner-as-content, and unused budget is never
back-filled. The evidence-unavailable state is a first-class composition state (§6 state 9),
not an error style.

#### 4.4 Structural seats (regions, not modules)

The five design/05 regions remain reachable at every viewport: region 1 = stage + objective
line/block; region 2 = the strip plus its marks (timeline detail expands as a companion
section); region 3 = the branch section in the companion region (the shipped
`BranchRail`/`GroupPanel` content, re-seated, SAN chips per §5.1); region 4 = the module
seats; region 5 = shell topbar/session chrome. Regions 2/3 are structural seats: they follow
the same growth rules (scroll/tab/collapse inside the companion region) but are not module
contracts and carry no packet machinery. Criterion A13.

#### 4.5 Forms on the board: paint, marks and arrows

Board-rendered module output (lit squares, halos, arrows, the optional commit echo) is paint,
never layout, and is bound by the accepted form rules: a visual form is an alternate
rendering of **one admitted fact** (design/05 §3-forms acceptance test — if the sentence
would be refused, so is the overlay); arrows only from an admitted fact's retained ordered
operands ([[D900]] — a fact retaining only square sets draws marks, never arrows; the
system-arrow producer remains unbuilt and undeclared here); every rendering inherits the
visible board's assistance conditions ([[D659]] — no widening through paint). Mark *budgets*
are the modules' (`maxMarks`/`maxArrows`); the composition adds one global rule: overlapping
module paint is never stacked beyond the expanded seat's own facts — collapsing a seat
removes its paint.

### §5 — The leak-destination table

`phase1-gap-matrix.md` §4 enumerates 15 class-7 leak sites. Each has a named destination —
**a leak with no destination is a criterion failure** (A4). Two destination kinds exist, per
the ruled vocabulary law, plus the chrome rule below: (m) a module rendering through the
accepted contracts; (i) the full inspector.

#### 5.1 The vocabulary law

Raw UCI, raw eval numerals (`+0.54`, `M+3`), percentages-as-recorded-mass, producer and
mechanism vocabulary ("Tabiya's … detector/bands/convention", provider ids, DTZ/category
tokens, trigger ASTs) are legal **only** on the `explicit_surface` (§2.4). Every play,
compare, checkpoint and timeline surface renders **SAN and chess meaning**. Chrome that today
carries UCI (branch chips, related-rehearsal links, checkpoint headings) is re-rendered in
SAN at its own site under this law — the raw form survives in the inspector and in exports.

#### 5.2 The table

Table caption — unit: **leak site** (gap-matrix §4 numbering); total: **15**; criterion A4
asserts all 15.

| # | shipped site | destination |
|---:|---|---|
| L1 | phase-bands sentence, always-on above the board (`DrillScreen.svelte:886`) | (m) `structure_nudge` renders `rules.phase.reading@1` in chess vocabulary in its seat; the producer phrasing → (i) |
| L2 | `{n} evidence waiting` topbar counter (`:813`) | (m) per-seat count badges (§4.1); the aggregate counter string is deleted |
| L3 | `After e2e4:` related-rehearsal link (`:880`) | chrome → SAN (§5.1); sits in the companion objective block |
| L4 | trajectory-legs prose (`:897`) | (m) timeline marks + leg chip on the strip (region 2); the raw legs/ply sentence → (i) |
| L5 | Maia human-split panel inside the play-screen assistance dropdown (`:826`) | (i) — `human.maia.policy@1`'s one home (its D744 `inspector_only` disposition, honored by `learner-modules.md` 4.11) |
| L6 | explorer corpus panel, same dropdown (`:830`) | (i) for counts/percentages; (m) `theory_breadcrumb` renders book-presence as a theory pointer |
| L7 | median-80 unranked structural print (`:911`) | (m) `sight_on_request` (cap 1 fact / 6 marks, selection per the accepted policy); the full census → (i) |
| L8 | transition census prose + board-overlay caption (`:920`, `:959`) | (m) `postcommit_nudge` (selected, budgeted); full census → (i); the layout-borne caption element is retired (§3.2) |
| L9 | branch-creator candidate chips as raw UCI (`:1056`) | chrome → SAN chips (§5.1), region-3 seat |
| L10 | pivotal-modal producer strings (`:1146`, `pivotal.ts:121-140`) | (m) timeline marks open their moment through the `review_map`/timeline seat in SAN + chess meaning; producer phrasing and policy-mass percentages → (i) |
| L11 | `Alternative e7e5` checkpoint heading (`CheckpointSheet.svelte:137`) | chrome → SAN (§5.1); the sheet is an overlay under §3.2 |
| L12 | raw classifier token in checkpoint theory verdicts (`theory-presentation.ts:24`) | (m) authored/cited rendering via `theory_breadcrumb`/authored-claim delivery; the classifier token → (i) |
| L13 | CompareView raw evals, objective-state tokens, detector attribution, piece routes (`CompareView.svelte:47-155`) | (m) `compare_coach`'s packet (operands, SAN — the D721/A14 renderer) in its seat; the full grids/strips/routes → (i) |
| L14 | `wdl evidence recorded.` family + raw tablebase detail (`evidence-sentences.ts:163,186-195,211`) | (i) with operands and attribution (the class-3 closure `learner-modules.md` 4.11 owns); guard-prompt grounds on play surfaces render registered SAN sentences |
| L15 | shape trigger-AST prose (`ShapePanel.svelte:25-26`); false Story footer (`GameStoryScreen.svelte:30`); voice cp-delta sentences (`guidance.ts:62,70`) | AST → (i); the footer's false attribution is corrected in place under §5.1's attribution honesty (Story *selection* stays [[D901]]'s lane); cp sentences → (m) `compare_coach`/`review_map` renderers, raw provider strings → (i) |

### §6 — The composition-state vocabulary (Phase 7's axis)

Table caption — unit: **composition state**; total: **14**. This is the closed list the
acceptance matrix multiplies against the seven viewports; adding or dropping one is a spec
change with a changelog line. It covers every state D717's rejection names.

| # | state | how the fixture reaches it |
|---:|---|---|
| 1 | calm rest | run open, no interaction |
| 2 | square selected (requested sight) | select an occupied square; `sight_on_request` seat carries content |
| 3 | move staged, cue present (at-commit) | stage a move under a Support-composable fixture; `blunder_prevention` head slot occupied |
| 4 | post-commit nudge present | commit a move with eligible events |
| 5 | rail module expanded | expand the wordiest occupied seat |
| 6 | guided hint at final stage | disclosure-open fixture, request through stage 3 |
| 7 | menu/popover open | preset pill or seat menu open |
| 8 | long objective | fixture pack with an objective exceeding one line at phone width |
| 9 | evidence-unavailable / honest-empty | provider-off fixture; `stated_absence`/`unavailable_source` seats visible |
| 10 | inspector open | the §2.4 surface entered, then returned from |
| 11 | timeline changed | rewind, branch, re-enter (the fork protocol exercised) |
| 12 | compare open | two settled attempts, `compare_coach` seat expanded |
| 13 | max load | every seat occupied, badges visible, one expanded (§2.2) |
| 14 | terminal / outcome reached | run reaches `outcome.reached`; verdict card + review handoff |

#### 6.1 Post-gesture assertion — the D538/D539 lesson, binding

Every matrix assertion is made on the **post-gesture** state: perform the state's gesture,
wait for rendered layout to settle (the settle discipline the D537 repair introduced), then
measure. Resting-geometry checks pass while the board is unplayable — [[D538]]'s lesson —
so state 3, 4, 11 assertions include a subsequent **real move submission** with its exact
outgoing UCI asserted, at minimum at one desktop and one phone viewport. **Any probe that
computes coordinates before the gesture shares the defect's assumption** ([[D539]]): the
matrix helper must remeasure the board and destination geometry after every gesture, never
cache pre-gesture rects; the stale-coordinate arm exists only as an explicit negative
control, never a success arm.

### §7 — Theming hooks only ([[D839]] is its own lane)

The composition consumes the existing token layer (`App.svelte:923-930` — `--paper`,
`--panel`, `--line`, `--accent`, …) and adds only composition tokens (§3.1's dimensional
tokens plus any new surface colors **as tokens**). Normative: **no new hard-coded color
literal outside the token layer** in composition styles (criterion A10); board colors,
square paint and piece rendering are consumed through whatever the D839 lane later re-roots —
this RFC neither ships a dark theme nor blocks one. The canvas dark artboard
(`FullDark.dc.html`) is evidence the token set suffices, not a shipped theme. Constraint
carried from [[D659]]/[[D839]]: theme choices are presentation and never alter which
evidence is visible.

## Deviations from design

1. **The five regions are projected, not five simultaneous panels.** `design/03`/`design/05`
   §2 name five stable regions; at tablet/phone this composition renders them as reachable
   projections inside one bounded companion region (tabs/queue/sheet) rather than five
   concurrent areas. All five remain reachable at every viewport (criterion A13); the
   projection is the field's own pattern (lichess col1) and the D717 brief's instruction.
2. **The `board_adjacent` seat class is bound as priority, not geography** (§4.2) — a
   reading forced by reconciling [[D841]]'s cap with field invariant (a) after [[D876]]
   ruled the cue out of the board column. The module contract's cap (exactly one) is
   unchanged.
3. Otherwise none: the six §1 invariants, the silence default, the disclosure model and the
   §3-forms rules are load-bearing constraints this RFC implements.

## Acceptance criteria

Every criterion can fail (D444/D451/D522); fixtures name their negative arms; counts state
unit and total and match the tables they verify. The matrix criteria (A2–A8) run in the
browser suite on the existing CI path: `.github/workflows/browser.yml` → `make test-browser`
(`Makefile:12`) → `pnpm test:browser` → Playwright over `tests/browser/`; the workflow's
existing `playwright-report` artifact upload carries the screenshots.

1. **A1 — Geometry function and tokens.** The board edge is computed by the §3.1 closed form
   from the 3 viewport classes' tokens (unit: viewport class; total 3); a unit test evaluates
   the function for all seven matrix viewports and matches the browser-measured board rect.
   Negative: introducing any content-measured term (a fixture that varies content and
   asserts the edge changed) must fail the invariant test.
2. **A2 — Board byte-stability.** For each of the **7 viewports** (1440×900, 1366×768,
   1280×720, 768×1024, 430×932, 390×844, 360×680 — all already exercised by the shipped
   suite, `tests/browser/drill.spec.ts:1053,1115,1141,1253,1279`) × the **14 states** (§6),
   the board's post-gesture `getBoundingClientRect()` equals the calm-state rect exactly.
   Negative: a test-only fixture that inserts a caption into the stage column must fail;
   the shipped composition at HEAD fails this criterion (verified by the D718 trace — it
   starts red).
3. **A3 — No overlap, no clip, no hidden actionable, no nested scroll trap.** Per
   viewport × state: every actionable element is hit-testable at its center
   (`elementFromPoint` resolves to it or a descendant); no element's content box overflows
   a clipping ancestor except declared scroll containers; the page body never scrolls
   horizontally; scrollable regions are an enumerated whitelist (rail, strip-x, seat-card,
   sheet-body) and no scrollable region nests a same-axis scrollable region. Negative: a
   fixture with a clipped button and one with a nested same-axis scroller both fail.
4. **A4 — Leak destinations.** (unit: leak site; total 15, §5.2.) Per state, the play/
   compare/checkpoint/timeline DOM contains none of the 15 leak shapes: no
   bare-UCI token (`/\b[a-h][1-8][a-h][1-8][qrbn]?\b/` over rendered text), no raw eval
   numeral outside the inspector, none of the producer-vocabulary strings ("Tabiya's",
   "phase bands", "detector", "recorded mass", "evidence recorded."). The inspector surface
   *does* contain representatives of each moved family — the positive arm that proves the
   assertion can discriminate. Negative: running the leak sweep against the HEAD composition
   fails on L1–L4 and L7–L8 at minimum (starts red).
5. **A5 — Seat conformance.** (unit: module id; total 11, §4.) Every module packet renders
   only inside its declared seat class's region; exactly one reserved head slot exists;
   a fixture seating a second board-adjacent cue fails; a fixture rendering a rail packet
   into the stage column fails; each evidence-bearing module's declared `emptyBehavior`
   renders per §4.3 (negative pin: `blunder_prevention` empty renders zero bytes anywhere;
   no "safe"/all-clear string exists in the composition).
6. **A6 — Max load per viewport.** The state-13 fixture occupies every seat with badges at
   all seven viewports; exactly one seat expanded; opening a second collapses the first
   (post-gesture assertion); the tablet band and phone rim heights equal their tokens; board
   rect unchanged from calm. Negative: a fixture that expands two seats concurrently fails.
7. **A7 — Overlay discipline.** Sheet expansion, objective expansion, menus and the
   checkpoint sheet contribute no layout: board rect identical while each overlay is open;
   every overlay has a visible dismiss affordance; focus returns to the invoking element on
   dismiss. Negative: an overlay implemented as a layout sibling fails A2's rect check and
   this criterion's open-state check.
8. **A8 — Screenshots and CI.** One screenshot per (viewport × state) — 98 images — is
   written to the Playwright report and uploaded by the existing `browser.yml` artifact
   step; the matrix test is part of `make test-browser` with no skip annotation. Negative:
   the criterion fails if any cell is `test.skip`ped or its screenshot is absent from the
   report.
9. **A9 — Animation non-defeat (starts red).** One board component instance survives a
   committed move: the underlying board DOM node is identity-stable across state 4's
   commit (asserted via a handle captured pre-commit and compared post-commit — a
   post-gesture identity check, not a rect check). At HEAD this fails by construction
   (`DrillScreen.svelte:928`'s `{#key}`); it must be verified failing before the fix and
   green at landing. The animation pref and felt verification remain the D840 lane's.
10. **A10 — Token discipline.** No new hard-coded color literal outside the token layer in
    composition styles (grep over the new components' style blocks; the existing token
    definitions and board paint constants are exempt as the D839 lane's input). Negative: a
    fixture component with an inline hex fails the sweep.
11. **A11 — Scope silence.** The diff contains no preset semantics (no preset name bound to
    module activation), no module-contract changes, no evidence-catalog byte moves, no
    campaign surface, no `AssistanceConfig` version move, no schema/migration bytes.
    Grep-based, able to fail.
12. **A12 — Interaction floor preserved.** The shipped interaction gates keep passing
    unweakened: the 18-cell click floor and promoted drag/touch cells
    (`accessible-board-input`'s permanent gate), the post-gesture exact-UCI submissions of
    `drill.spec.ts`, and keyboard/text input paths — re-run against the rebuilt composition.
    Negative: any relaxation of an existing assertion to make the new layout pass is a
    failure of this criterion by definition (the diff must not touch those assertions except
    to update selectors, named in review).
13. **A13 — Regions reachable.** All five design/05 regions are reachable at every matrix
    viewport post-gesture (objective read, timeline detail opened, a branch entered, a
    module seat opened, session controls reached). Negative: a viewport where region 3 is
    unreachable (the phone sheet lacking its section) fails.
14. **A14 — Inspector separateness.** The inspector surface is reached only by explicit
    entry; no play-surface state renders inspector content inline; leaving the inspector
    restores the prior composition state (state 10's return arm). Negative: a fixture
    mounting an inspector section in the companion region fails A5 and this criterion.
15. **A15 — Register and index hygiene.** `node tools/register-check.mjs` passes with this
    RFC's `none` block; `node tools/status-parity.mjs` passes once the index row exists
    (drafting state: exactly one P3 error naming this file, no other regression); no
    schema/migration/content bytes move. The docs page for the composition lands in the
    implementing change, not before.
16. **A16 — Closeout.** The landing commit flips this RFC's recorded ledger rows, appends
    the `planning/exploration/log.md` entry in the same commit (the CLAUDE.md
    ledger-and-log clause), and writes the discharge SHA into `rfc/learner-modules.md`'s
    **D2** row (that table names the Phase-4 composition RFC's landing commit as the
    recording site).

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | Preset activation of the seated modules — this composition builds real seats whose activation semantics are Phase 5's; until that RFC lands the seats are exercised by fixtures and the explicit surfaces, and the chain's last link stays open | `planning/evidence-foundation-ux/plan.md` | the Phase-5 preset RFC's landing commit | |
| D2 | The system-arrow vector producer ([[D546]] form (c), routed here by [[D900]]) — seated modules draw arrows only from retained ordered operands; a producer for system-drawn vectors remains unbuilt and is not declared by this RFC | `planning/evidence-foundation-ux/plan.md` | the RFC or defect fix that lands the producer | |
| D3 | The [[D839]]/[[D840]] lane — dark/board/piece theming over this composition's tokens and the animation pref with a None option; this RFC's A9 removes the animation *defeat* but ships no pref and no theme | `claude` | that lane's landing commit | |

Honesty note, stated plainly: like its parent contracts, this composition is
**preset-inert at landing** — the day it lands, the rebuilt screen carries the shipped
surfaces (objective, timeline, branches, checkpoint, compare, the four inspector bindings
via the §2.4 surface) relocated and vocabulary-lawful, while the new module seats render
only what fixtures and the explicit surfaces can reach until `learner-modules.md`'s
implementation (after 2c/2d) and Phase 5's activation land. The board-stability invariant,
the leak removals and the acceptance matrix are fully real at landing; the seats become
learner-visible on D1's schedule, held open here and in the parent RFC's D2.

## Open questions

1. **The tablet breakpoint (1023/1024) is claude-chosen, not measured.** The phone boundary
   (719/720) is the shipped shell's; the tablet/desktop boundary is proposed at 1024 so
   768×1024 portrait takes the band composition and 1024×768 landscape the rail. If owner
   use finds landscape tablets cramped in rail form, the boundary moves by token — no
   structural change.
2. **The compact-tab successor** inside the companion region (whether the shipped
   Timeline/Branches/Evidence switcher survives as the sheet/band section control, or the
   queue subsumes it) is left to the implementer within §2.3's bound; named here so its
   resolution lands in the planning log, not silently.
3. **The post-commit on-board echo** (the field's at-commit paint channel,
   `competitor-play-ux.md` §6.3) is permitted by §4.5 as an alternate rendering of an
   admitted fact, but not required at 1.0 — whether to ship it rides the D840 lane's
   felt-quality pass, since a static echo without animation reads as noise.
4. **The inspector's route form** (path segment vs. modal-mode) is the implementer's; §2.4
   fixes only separateness, opt-in entry and the vocabulary boundary.

## Ledger rows (proposed from head+1; NOT written — the ledger head verified **D907** at
drafting, with a register defect found and reported below)

**Register collision found while verifying the head:** `design/BACKLOG.md` carries **two
D906 rows and two D907 rows** (the learner-modules owner rulings + semantic reducers at
lines 269–270, and the bounded-mating-nets + promotion-race results at lines 279–280) — the
same double-assignment class as the D718/D745 collision that row itself records as
"corrected before downstream use." Both pairs are already cited downstream (this program's
documents cite the rulings pair; the Wave-C documents cite the results pair), so the
register owner should renumber the later-landed pair and annotate, before ambiguity
propagates. Proposed rows therefore start at D908:

- **D908** — Phase-4 composition RFC drafted: three viewport classes over one queue pattern,
  the board-geometry closed form with a closed stage-children list (the D537 class killed
  structurally), the 15-leak destination table (all 15 named), the eleven seats bound
  through the accepted seat classes with `board_adjacent` read as priority-not-geography,
  and the Phase-7 matrix (7 viewports × 14 states, post-gesture, screenshots, existing CI
  path) as this RFC's criteria. (this file)
- **D909** — Ledger register defect: D906 and D907 are each assigned to two unrelated rows;
  renumber the later pair and annotate both, per the D718/D745 precedent.
- **D910** — Canvas corrections owed before implementation cites the artboards: the phone
  status-chip row above the board moves below the strip (§2.3 makes "nothing above the
  board" strict), and the tablet objective returns adjacent to the board above the
  companion band; the max-load [[D876]] fix is already applied in the artboards.

## Changelog

- 2026-08-22: created. Drafted at HEAD `ddcc977`. Symbols verified live at that HEAD:
  `DrillScreen.svelte:873/:925/:928/:959/:1335/:1340/:1501` and the overflow sites;
  `Chessboard.svelte:173/:257`; `App.svelte:923-930/:994`;
  `tests/browser/drill.spec.ts:38/:50` and the four viewport lists; `Makefile:12`;
  `.github/workflows/browser.yml`. Seat classes, module table, budgets, emptyBehavior and
  the D2 discharge row quoted from the accepted `rfc/learner-modules.md`; the two field
  invariants, pattern language and three traced canvas revisions from
  `design/research/competitor-play-ux.md`; the 15 leak sites from
  `phase1-gap-matrix.md` §4; the canvas working draft read from the play-canvas artboards
  (Main/Tablet/Phone/FullDark + canvas.json) with the [[D876]] fix verified applied
  (80 px squares in both desktop artboards, cue seated as the rail head card). Ledger head
  verified D907 with the D906/D907 double-assignment reported (proposed D909).
