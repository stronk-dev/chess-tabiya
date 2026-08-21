# Interaction-state correctness after selection (A2 / K9)

- **Measured:** 2026-08-20 against clean commit `68b9a98`
- **Feeds:** platform-alignment A2 and R3; Q3; C7; K9; D537-D541; D573
- **Instrument:** `tools/a2-interaction-state-harness/`
- **Result:** A2 is complete; the product defect is not fixed

## Verdict

The resting board is not an honest proxy for the board a learner can use. Across all six served
endgame packs, five viewport sizes and click, drag and emulated-touch input, the authored legal
move was delivered in **4 of 90 live-coordinate gesture cells**. Fifteen cells submitted a
different legal move and 71 submitted nothing. `[V]` (`tools/a2-interaction-state-harness/output.json`)

There are two independent failures. From 768×1024 upward, selecting a piece adds 29–186 px of
structural caption, moves the board upward by 17–96 px, and leaves chessground interpreting input
against its former bounds. At 390×844, five of six authored source squares are already covered by
the timeline or another control before selection, so those packs never reach the stale-bounds
state. The remaining pack selects, shifts 96 px, and still submits no move. `[V]`

This re-confirms K9 evidence toward firing rather than clearing or firing it. The speed arm remains
unchanged; the usability floor is unmet for a named, fixable interaction defect, and calling a kill
criterion remains the owner's decision. `[V]` (`planning/exploration/gates.md`, K9)

## Population and predeclared method

The census used the six endgame documents returned by `/packs`: Lucena bridge, bishop-and-knight
mate, king-and-rook mate, pawn opposition, Philidor hold and queen versus seventh-rank pawn. It ran
one fresh authenticated run per pack × viewport × gesture at 1440×1000, 1366×768, 1280×720,
768×1024 and 390×844: **180 rows** in total. The clean extracted server used the real tablebase
path so the `perfect_tablebase` pack could open; unrelated uncommitted feedback-delivery work was
excluded. `[V]`

Before touching the UI, the harness parses each pack's start FEN with chessops and independently
proves its authored first UCI legal. It computes square centres from the live inner `cg-board`
rectangle with orientation handling, captures the exact `uci` field sent to
`POST /runs/:id/moves`, and compares it with the authored UCI. It never promotes “a request
happened” or “a ply appeared” to success. `[V]`

The arms are:

- `stale_click`: both centres computed before selection, reproducing the old probe as a negative
  control;
- `live_click`: destination recomputed after selecting;
- `live_drag`: destination recomputed after pointer-down;
- `touch_live`: origin and recomputed destination tapped in a touch-enabled browser context;
- `resize_recovery`: select, dispatch resize, then use the live destination; and
- `hover`: move over the source without committing a selection or move.

Source-square hit testing was added after the first complete matrix showed that compact-phone rows
could not enter selected state. It is a labelled post-hoc diagnosis of that observed failure, not
part of the predeclared outcome test. The rerun reproduced every outcome count. `[V]`

The committed result is SHA-256
`963d08954f6b3d73c2292e48944f058016b67bb622ec894a9b6a6650e4368b36`. `[V]`

## Results

### Exact UCI, not visual plausibility

`live_click` produced: `[V]`

| Viewport | Authored UCI | Different legal UCI | No request |
|---|---:|---:|---:|
| 1440×1000 | **1 / 6** | 2 / 6 | 3 / 6 |
| 1366×768 | **0 / 6** | 1 / 6 | 5 / 6 |
| 1280×720 | **0 / 6** | 1 / 6 | 5 / 6 |
| 768×1024 | **0 / 6** | 1 / 6 | 5 / 6 |
| 390×844 | **0 / 6** | 0 / 6 | 6 / 6 |

Click and drag each delivered 1/30 exact, 5/30 wrong and 24/30 none. Touch delivered 2/30 exact,
5/30 wrong and 23/30 none. Two tablet cells differed between touch and pointer, but no input path
made the surface usable and every compact-phone arm was 0/6. `[V]`

The wrong submissions are not an inferred offset: the request body records them. King-and-rook
mate authored `h2h6` but submitted `h2h7` at 1440/1366 and `h2h8` at 1280/768; queen versus pawn
authored `e4c4` but submitted `e4c6` at 1440. A run can therefore preserve and later explain a
branch the learner did not choose. `[V]`

### The negative and recovery controls identify stale geometry

The stale-coordinate arm delivered the authored move in **19/30** cells while the live-click arm
did so in **1/30**. This is the expected negative-control result: the old coordinate agrees with
the bounds chessground still applies after the drawn board moves. A probe using the same stale
coordinate can therefore cancel the defect and report a false success. `[V]`

Dispatching `resize` after selection delivered the exact UCI in **24/24** desktop/tablet cells.
That controlled flip isolates cached bounds rather than legality, orientation, server policy or
the target square's visual location. At phone size it recovered only queen-versus-pawn; the other
five source squares were covered before selection, so there was no chessground selection for
resize to repair. `[V]`

The source already contains a double-animation-frame `board.redrawAll()` after board prop effects,
but the selected structural caption is created in `DrillScreen.svelte` and the current effect path
does not prevent the measured stale interpretation. `[V]`
(`apps/web/src/lib/Chessboard.svelte:111-133`,
`apps/web/src/lib/DrillScreen.svelte:342-347,899,1203-1207`)

### Compact phone is a second defect, not a stronger instance of the first

At 390×844, five authored source centres return `insideBoard: false`: Lucena is covered by a
control button; bishop-and-knight and Philidor by `section.timeline`; king-and-rook and pawn
opposition by `div.timeline-row`. Their selected-marker count remains zero. Only queen-versus-pawn
starts on an uncovered square; it selects, shifts from y=590 to y=494, but none of click, drag or
touch submits a move. `[V]`

This is D573. A redraw-only fix for D537 cannot repair it. The mobile acceptance check must prove
that the authored source and destination are topmost board hit targets through the gesture, then
assert the exact outgoing UCI. Resting containment, minimum board size and a screenshot are
insufficient. `[V]`

### Hover is a useful zero-state control

All **30/30** hover rows submitted no move, created no selected marker and moved the board by zero
pixels. Hover itself does not trigger the caption/geometry transition in this implementation.
That says nothing yet about a future hover-guidance module; it gives R3 a clean zero-state control
and prevents the A2 result being mis-described as generic pointer instability. `[V]`

## What this permits and refuses

**Permits:** `[M]` synthesis from the measured result.

- Mark A2 done: the new instrument independently verifies legality, orientation, source hit state,
  live destination and exact request UCI across selection, touch, hover and resize.
- Start R3's disposable presentation prototypes using this exact interaction contract and the
  R1/R2 evidence fixtures.
- Use an isolated prototype or an explicitly repaired test shell for R3. Current production UI is
  not a valid “working guidance baseline.”
- Keep D537/D538/D573 and K9 visible on the critical path to a playable pilot and Gate F.

**Refuses:** `[M]`

- claiming phone/tablet accessibility from resting projections;
- using “some legal move happened” as interaction success;
- treating stale-coordinate success as product success;
- beginning participant comparison on a board that can record a move the participant did not make;
- changing product CSS/chessground code under this research task without RFC authority.

## 2026-08-21 product repair recheck

D537, D538 and D573 are closed. The selection callback now invalidates Chessground's cached bounds
on the first rendered frame and again after layout settles; compact objective prose is bounded so
the 192 px board stays inside the position region rather than underneath Timeline. `[V]`
(`apps/web/src/lib/Chessboard.svelte`, `apps/web/src/lib/DrillScreen.svelte`)

The same predeclared A2 population and gesture matrix now delivers the authored UCI in **90/90**
live click, drag and emulated-touch cells: six packs × five viewports × three input paths, with zero
different legal moves and zero missing requests. At 390×844 all six authored sources are topmost
board targets and click/drag/touch are each 6/6 exact. `[V]` (final-source recheck output SHA-256
`0aa7b90c2830b4d2caf678054cb91201436ebebbae6a79e6cfb97a46387be084`)

The permanent browser regression independently exercises all six packs at 1440×1000, 768×1024
and 390×844. It hit-tests the source, remeasures after selection and asserts the request UCI. Its
first run exposed a remaining two-frame race by receiving `e4c6` for authored `e4c4`; moving the
first invalidation to the next rendered frame made that same test pass. This demonstrated-failing
step is why resting geometry and the slower research harness are not the sole product guard. `[V]`
(`tests/browser/drill.spec.ts`, `apps/web/src/lib/Chessboard.test.ts`)

The historical baseline above remains evidence about the failure and the instrument controls. It
no longer describes current product behavior. K9 returns to an open comparative-usability question:
speed still does not differentiate the products, while whether the repaired rehearsal loop is more
usable requires the owner's real-content session. `[M]`

## Limits and next evidence

This is deterministic Chromium measurement, not a physical-device or assistive-technology study.
Touch is browser emulation; R18 still owns real-device, keyboard and screen-reader floors. The
population is a census of the six served endgame packs, not all 50 drafts or future official
content. Each matrix cell ran once; the exact recovery controls and repeated first/diagnostic runs
make the causal reading strong, but this is correctness evidence rather than a latency or flaky-rate
estimate. `[V]`

R3 can now build and mechanically validate module prototypes. Its stated exit still needs
non-technical participants, so R3 becomes **ready for prototype/instrument work and external for
completion** rather than simply “done after mockups.” `[M]`
