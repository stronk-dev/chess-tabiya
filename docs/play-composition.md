# Play composition

The live run is a focused, viewport-owned surface. It deliberately omits the application's global
navigation bar while `/play/run/:runId` is active; the run topbar provides identity, access state,
Inspector, assistance and a Tabiya exit back to Play.

## Stable stage

The board edge is computed by `playBoardEdge(width, height)` from viewport dimensions and fixed
composition tokens only. The result rounds down to a multiple of eight. Pack text, evidence,
branches, menus and opened overlays are not inputs to that function.

The stage's layout children are closed:

- the board frame;
- the fixed 40 px timeline strip; and
- on tablet and phone, the fixed 32 px objective line.

Text move entry, promotion, errors, read-only notices, objectives, checkpoints and dialogs overlay
the composition. They never add a stage row. The Chessground DOM node also survives committed
moves; position changes use the component's `board.set()` path.

## Companion and Inspector

Desktop uses a fixed 336 px companion rail. Tablet uses a fixed 176 px band. Phone keeps a 48 px
rim in layout and expands its companion as an overlay sheet. The current structural seats are
Support, Branches and Actions; they are the shell into which the accepted learner modules will be
compiled, not a substitute for those modules.

Raw position structure, transition census, human-model candidates and corpus counts are available
only in the explicit full-screen Evidence Inspector. Ordinary play does not render those diagnostic
readings as a hint stream. The attempt-complete dialog follows the same boundary: it keeps the
outcome, authored commentary and return actions in view, while an explicit “Inspect recorded
evidence” door opens the exact terminal engine/tablebase records in the Inspector.

The same boundary applies before the attempt ends. Branches, branch groups, Support and checkpoint
sheets share learner-facing labels for objective progress and game outcomes. They describe where
candidates came from and which resistance was requested or played, but do not expose runtime enum
bytes, engine/model versions or selector bookkeeping. The Inspector's Attempt conditions section
retains the exact root-assessment, provider and per-ply resistance record for deliberate inspection.

## Verification

The browser suite asserts the exact board rectangle at the seven accepted projections:
1440×900, 1366×768, 1280×720, 768×1024, 430×932, 390×844 and 360×680. It remeasures after opening
text entry, Inspector, objective overlays and the phone companion sheet. It separately verifies
stable board identity after a committed move, permanent pointer/touch/keyboard/text input and
multi-user match behavior.

The RFC remains implementing. The module queue, remaining SAN/vocabulary cleanup and complete
7×16 screenshot matrix are still required before archival.
