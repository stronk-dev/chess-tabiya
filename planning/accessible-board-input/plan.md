# Accessible board input — implementation plan

Status: awaiting D3
RFC: `rfc/accessible-board-input.md`
Started: 2026-08-21

The implementation projects click, drag, touch, keyboard-grid and SAN/UCI text entry through one
pure board controller, preserves the visible assistance ceiling in the semantic grid, restores
ordinary browser focus traversal, and makes the exact move matrix permanent.

## Completed implementation

1. Add and unit-test the pure `BoardInputController`, legal SAN/UCI normalization, promotion state,
   visual-direction navigation and semantic grid model.
2. Route every `Chessboard.svelte` move projection through the controller and expose the adjacent
   text form, labelled grid, announcements and focus restoration.
3. Release Tab/Shift+Tab, move comparison to physical `Alt+C`, and restore dialog focus to the
   invoking control.
4. Expand the permanent browser gate to six packs × five viewports × five modes, add the
   post-gesture semantic-grid check, bidirectional region traversal and short-desktop layout guard.
5. Update the help sheet and canonical app-shell/drill-client docs.

2026-10-06 maintenance: the Play notation door moves off the physical squares into the fixed
timeline strip, through the same controller's component port. Other playable boards use its normal-flow
projection; authoring position and notation forms have separate native owners. Promotion Cancel
restores authoritative graphical paint as well as input state. Permanent predecessor, mounted
and native browser controls are recorded in `planning/play-composition/board-controls-2026-10-06.md`.
This preserves the five-mode floor and the read-only/assistance ceiling, not a D3 discharge.

## Remaining discharge

D3 is the owner's ordinary device/browser/assistive-technology use session. No code work waits on
it; the RFC remains active in `awaiting D3` until that use is logged.
