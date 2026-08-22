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
6. Text move entry overlays the board component without changing its box. The keyed board remount
   is gone; a reset token re-asserts capture state through the existing `board.set()` path.
7. Permanent browser checks cover exact geometry at all seven viewports, text entry, objective and
   Inspector overlays, phone sheet gestures, stable board DOM identity, keyboard traversal, the
   150 input projections and the multi-user match flows. Current browser result: 30 passed, one
   optional Maia latency test skipped.
8. The first vocabulary-law slice is live: branch-group candidates use legality-checked SAN;
   checkpoint alternatives never fall back to raw UCI; pivotal producer prose and shape trigger
   AST/provenance moved behind explicit Inspector doors. Their ordinary cards retain only SAN,
   the recorded-moment affordance and authored named plans.
9. The aggregate “evidence waiting” plumbing counter is absent from run chrome; raw trajectory-leg
   state lives in Inspector; theory checkpoints no longer expose deviation-class or mistake enums
   as learner copy.

## Remaining before archive

1. Compile and seat the eleven learner modules once their collector dependencies land; implement
   the one-expanded queue and fact-count badges rather than treating the three structural tabs as
   final module composition.
2. Remove the remaining ordinary-surface vocabulary leaks named by §5. The related-pack relation
   currently suppresses its raw UCI until an authoritative SAN projection exists; phase, compare,
   tablebase and voice families still need their compiled module renderers.
3. Complete every acceptance state in the 7×16 matrix, including max-load, long objective,
   checkpoint, terminal, promotion and branch-group capture; capture and retain the 112 CI
   screenshots required by A8.
4. Bind the full Inspector's amended accepts list when `learner-modules` implements, including the
   D924 phase/pivotal/classifier/compare families.
5. Reconcile `docs/drill-client.md`, close the remaining ledger rows, append final lifecycle logs,
   and archive only after A1–A15 pass as a set.

## Explicit non-goals of this checkpoint

- No preset semantics or assistance-default decisions (Phase 5).
- No new chess evidence, selection, grading or authored content.
- No campaign, Review-map, Story-ranking, theme or animation-preference implementation.
