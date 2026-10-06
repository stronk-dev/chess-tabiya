# Play composition implementation plan

**RFC:** `rfc/play-composition.md`
**State:** implementing 2026-08-22
**Scope:** the accepted board-protected play shell, companion queue, explicit Inspector and
permanent interaction-state acceptance matrix. Collector, module, preset and workflow semantics
remain in their owning RFCs.

## Landed checkpoint

1. One focused run chrome replaces the duplicate global-plus-run header on `/play/run/:runId`.
2. One closed-form `playBoardEdge(width, height)` authority supplies the rendered CSS variable and
   the browser oracle. All seven specified projections match exactly and snap to eight pixels.
3. The stage has only the board, fixed timeline strip and tablet/phone objective line. Objective,
   branch, action, support and diagnostic content cannot consume board geometry.
4. Desktop has a 336 px internally scrolling companion rail; tablet has a 176 px bounded band;
   phone has a 48 px rim whose expanded sheet overlays instead of reflowing.
5. Raw structure, transition, human-model and corpus readings moved to a separate full-screen
   Inspector. Ordinary play retains only the bounded Support/Branches/Actions seats.
6. Text move entry overlays the composition without changing its box. Its collapsed door sits in
   the fixed timeline strip, outside the physical squares. The keyed board remount
   is gone; a reset token re-asserts capture state through the existing `board.set()` path.
7. Permanent browser checks cover exact geometry at all seven viewports, text entry, objective and
   Inspector overlays, phone sheet gestures, stable board DOM identity, keyboard traversal, the
   150 input projections, visible move interpolation and the multi-user match flows. Initial browser result: 60 passed, one
   optional Maia latency test skipped. Successful CI now retains an HTML report on every outcome;
   the first explicit state matrix contributes 42 named attachments (six reachable states × seven
   viewports) instead of producing evidence only when a test fails.
8. The first vocabulary-law slice is live: branch-group candidates use legality-checked SAN;
   checkpoint alternatives never fall back to raw UCI; pivotal producer prose and shape trigger
   AST/provenance moved behind explicit Inspector doors. Their ordinary cards retain only SAN,
   the recorded-moment affordance and authored named plans.
9. The aggregate “evidence waiting” plumbing counter is absent from run chrome; raw trajectory-leg
   state lives in Inspector; theory checkpoints no longer expose deviation-class or mistake enums
   as learner copy.
10. Compare now opens with decisions, SAN, actor, intent, material, convergence and concise
    consequences only. Raw objective tokens, engine values, detector attribution, structure
    census, piece routes and source records moved to a separate focus-restoring evidence
    inspector; desktop content and mobile matrix journeys assert both sides of the boundary.
11. The second vocabulary-law slice translates objective-change evidence into deterministic
    family-level Support summaries while retaining exact sentences in Inspector; collapses duplicate
    phase enums; removes UCI/ply/simulated transport vocabulary from ordinary controls; and names the
    bounded reveal after learner support rather than the evidence pipeline.
12. Historical 2026-08-27 checkpoint: the composition matrix retained 77 named screenshots across
    eleven reachable states at seven viewports. Module emission subsequently added states 3, 5, 9
    and 13 on 2026-09-24; the old five-column hold is superseded by checkpoint 21 below.
13. Selected-square captions follow Chessboard's authoritative settled selection across pointer,
    keyboard, commit and history changes. The tablet branch band separates identity, horizontally
    scrollable cards and actions, so its real branch buttons are not covered by footer controls.
14. Support, Branches and Actions now use one expanded structural seat at every viewport instead of
    stacking all three in the desktop rail. Support is the ordinary default; consequence guards
    select Support; branch and branch-group creation select Branches without forcing the phone sheet
    over the next move. The seven-viewport browser matrix proves every switch preserves the exact
    board rectangle, and keyboard traversal proves each queued region remains reachable in both
    directions. Learner-visible move labels also fail closed when SAN is absent rather than exposing
    raw UCI from the run or authored anchor.
15. Timeline navigation is inspect-first instead of an always-present undo path. The client derives
    rewindable timeline nodes from recorded checkpoint, guard-return and terminal-return events;
    arbitrary historical plies remain previewable but carry no rewind control. Consequence sheets
    retain the primary preserved-attempt offer, and positive/negative component fixtures keep the
    distinction able to fail.
16. Story return is framed from recorded history instead of implementation vocabulary. The selected
    moment states the learner-relative recorded result and exact move number, reveals no evaluation,
    and offers “Pick it up from here”; `story-reentry` remains an internal branch kind.
17. Compact reflow no longer deletes the run below 360×680. The supported floor is 320×256;
    short portraits and phone landscapes use the single-column composition, keep the board at
    24px squares or larger, and scroll the drill region vertically without horizontal overflow.
    Browser fixtures cover 375×667, 844×390 and 320×256 and preserve one truthful selected region.
18. Related-rehearsal chrome resolves the sibling document at run load, names the rehearsal by
   title and renders `root_after_move` as legality-checked SAN against the sibling's start FEN.
   Missing or stale responses fail to neutral copy; a served-corpus browser journey refuses the
   pack id and UCI at the real App/API boundary.
19. Ordinary chronology no longer exposes the runtime's raw ply counter. Timeline,
   checkpoint/terminal theory, Compare and pivotal details use one run-relative rehearsal-step
   label; Story uses whole-game move numbers. Counts name exact turns, learner moves or opponent
   moves according to their actual population across horizons, branch groups, simulations,
   attempts, live walls and resistance summaries. The copy authority is isolated from learner
   rating, and exact ply remains available only in internal fields, Advanced Inspector and
   authoring diagnostics.
20. Ordinary Support no longer asks learners to reason about the evidence pipeline. Calculation
    names its optional continuation and non-prescriptive limit; the consequence guard offers to
    inspect what changed; unavailable lighting names extra highlights; and terminal/classroom copy
    names analysis details and opened help. Advanced Inspector retains exact source and projection
    vocabulary.
21. Guided Hint shares the real module expansion/paint authority while retaining its separate
    protocol and exact decision/rung. The final permitted rung has a seven-viewport real-request
    journey, including Theory → Hint without new requests or board movement. Compact preset radios
    stay within the viewport. Normal matrix/full browser commands require 112 distinct successful
    unretried current-run PNG attachments and retain the exact report/PNG bytes through later tiers.
    Receipt: `hint-and-matrix-2026-10-06.md`. This is artifact completeness, not a waiver of the
    max-load and full conformance obligations below.
22. The tablet Support queue now renders one internally scrolling head above a single fixed
    selector row. Native swaps, the held cue/Revise and More preserve board/band geometry and
    source-bound badges. Shared mounted frames retain Hint and control state through resize.
    Independent header bounds/hits pass at four tablet widths and fail a deliberate overlap;
    no production header collision is claimed. More is a named controls group, not another
    Support landmark (D3447). Receipt: `tablet-queue-2026-10-06.md`.
    Late proactive delivery preserves explicit selection (D3448); new consequence events select
    the tools head while identical recorded-event snapshots do not (D3449).
    Explicit More selection also survives delayed delivery while reveal opens (D3450).
23. Every real post-gesture cell now carries a paired center/clipping/scroll record. Deliberately
    clipped, covered, invisible-active and nested-scroller controls fail the same predicate.
    D3452–D3457 repair measured coordinate glyph clipping, promise-footer overflow, chooser
    interaction ownership, timeline chips, promotion Cancel and inner branch scroll authorities.
    Final focused coverage passes nine journeys/all 112 cells. Receipt:
    `conformance-2026-10-06.md`; full gate results are recorded there before commit.
    This supersedes checkpoint 13's inner tablet branch scrolling, not full A3 acceptance:
    That checkpoint retained D3458 partial phone board-chrome overlap missed by a center-only predicate.
24. The board-controls repair measures complete shell bounds and all 64 physical centers, seats
    the notation door in the contract's fixed strip, and keeps its open form modal with local
    grounded refusals. Separate native authoring forms prevent notation from creating a draft.
    Promotion Cancel restores unchanged graphical paint and a subsequent real drag succeeds.
    Fixed-panel positive and transformed/contained/own-label negatives calibrate the clipping
    instrument without a product selector exemption. Receipt: `board-controls-2026-10-06.md`;
    nine conformance journeys/all 112 cells, five native control/focus journeys and 110 mounted tests
    pass. Full replacement gates and scoped closeout are recorded in that receipt before commit.

## Remaining before archive

Inspector request admission D3470 binds genuine packets to their finalized help identity
and exact recorded decision, retiring close/recompile/destroy settlements. Identical
snapshots preserve completed evidence; older-decision replay abstains. Nine permanent
mounted and two native source/settings/delivery controls pass. Complete replacement
verification and bounded closeout: `inspector-lifecycle-2026-10-06.md`. This is not all
fifteen A4 destinations, source migrations or full-RFC/owner-use completion.

Corpus subject repair D3468 derives the request from displayed ancestry and retires
old answers/errors through preview, branch/disclosure changes and destruction. Real
longer-line/root/sibling/ABA and matched-context controls pass, alongside full sequential
software/content/browser replacement gates. Receipt: `corpus-subjects-2026-10-06.md`.
D3469 retains the authenticated inspected-decision context contract; suppressing a wrong
active-branch label does not implement it. Full A4/D1834 and source migrations stay open.

Inspector subject repair D3466/D3467 binds historical material readings to the exact
selected recorded FEN and position attachments to the displayed preview node, without
substituting active evidence into missing historical subjects. Terminal ownership stays
unchanged. Seven focused mounted checks, 115 complete client checks and four native
import/timeline/Inspector journeys pass; full replacement gates and closeout are recorded
in `inspector-subjects-2026-10-06.md`. These are bounded subject repairs, not the held
D3309/D3363 migration contracts or all fifteen A4 destination positives.

Current maximum-load checkpoint: `max-load-2026-10-06.md`. The genuine eight-seat fixture and
receipt-bound badges replace the three-default-row check; compilation/snapshot/held-cue seams are
repaired. The compact queue and independent header coverage checkpoint is
`tablet-queue-2026-10-06.md`; full replacement gates run before commit. D3436 retains the
overlay/modality contract reconciliation; complete A3/A4/Inspector/ceiling/owner-use obligations remain.

1. The eleven-module compiler and real Play seats now ship. Finish remaining cross-surface,
   source/absence and seat conformance; neither the structural
   Support/Branches/Actions tabs nor eight delivered Play badges are complete module composition.
2. Remove the remaining ordinary-surface vocabulary leaks named by §5. Related-pack title/SAN and
   the ordinary Support/terminal evidence-pipeline copy are complete; phase, compare, tablebase and
   voice families still need their compiled module renderers.
3. Finish semantic acceptance of the 7×16 matrix ([[D1834]]). The current-run checker requires
   all 112 distinct attachments. State 13 now exercises all eight seats with real domain/source
   requests, independently counted badges, native swaps, warning priority and fixed board/band/rim
   geometry at seven viewports (`max-load-2026-10-06.md`). This closes the former three-row
   population gap. The tablet head-plus-single-selector-row is now implemented (D3444);
   [[D3436]] retains the phone contract reconciliation;
   actionable A3 and destination A4 obligations remain. Counts alone are not semantic acceptance.
   The paired A3 center/clipping/scroll floor now runs on all 112 cells with negative controls
   (`conformance-2026-10-06.md`). The board-controls checkpoint independently measures complete
   affordances and actual affected square gestures (`board-controls-2026-10-06.md`). Continue A4's
   Inspector positive/destination/vocabulary arms; do not infer its semantic acceptance from
   geometry. Keep modal-inert board controls
   distinct from hidden actionable controls; D3436 must reconcile phone authority before changing
   its policy. This is the existing D1834/A3 obligation, not a parallel tracker or count-only closure.
4. Bind the full Inspector's amended accepts list when `learner-modules` implements, including the
   D924 phase/pivotal/classifier/compare families.
5. Reconcile `docs/drill-client.md`, close the remaining ledger rows, append final lifecycle logs,
   and archive only after A1–A15 pass as a set.

## Explicit non-goals of this checkpoint

Completed A4 vocabulary wave: D3465 adds a rendered-text sweep to every real cell and an independent
same-result, non-vacuous vocabulary record retained with its PNG/geometry evidence. Calibration
tests inline markup, accessible equivalents, native details and consumer-tag non-exemption;
the actual server→Inspector→close journey verifies admitted component sentences and all eight
family states. Complete software/content/browser gates pass and all 112 retained triples survive
the packaged tier. Do not re-queue this finished boundary. Full positive coverage of the fifteen
leak destinations and held source migration
contracts remain separate obligations. Receipt: `vocabulary-boundary-2026-10-06.md`.

- No preset semantics or assistance-default decisions (Phase 5).
- No new chess evidence, selection, grading or authored content.
- No campaign, Review-map, Story-ranking, theme or animation-preference implementation.
