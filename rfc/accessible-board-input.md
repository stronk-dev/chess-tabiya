# RFC: Accessible board input — one move state machine, four input projections

- **Status:** draft
- **Author:** codex (agent), for Marco
- **Created:** 2026-08-21
- **Design refs:** `design/02-product-shape.md` Choice-C appliance and web/PWA floor;
  `design/03-product-breadth.md` B8; `design/05-in-run-experience.md` input-equivalence clause
- **Exploration gate:** R18 mechanical accessibility audit, O13/D616 Choice-C ruling, D649 owner-use
  validation posture; F12-F in `planning/platform-alignment/release-platform/f12-work-order.md`
- **Depends on:** D537/D538/D573 exact pointer/touch repair (`d208425`)
- **Parent / amends:** `rfc/archive/client-surface-floor.md`; `docs/drill-client.md` keyboard and
  interaction contracts
- **Supersedes / superseded by:** —
- **Planning:** `planning/accessible-board-input/` (once implementing)

```tabiya-claims
none
```

## Summary

The surrounding drill is keyboard-navigable, but the chess decision is pointer-only. This RFC adds
one web-client board-input state machine and projects click/drag/touch, keyboard square navigation,
assistive grid semantics and typed SAN/UCI entry through it. Every projection submits the same
validated UCI to the existing `onMove`; no projection gains evidence, recommendations or a wider
assistance ceiling.

It also releases unmodified Tab/Shift+Tab back to normal focus traversal and moves comparison to a
non-conflicting shortcut. The existing 90/90 exact pointer/touch matrix remains a regression floor.

## Motivation

R18 found one generic accessibility-tree node named “Chessboard,” no square/piece names, no
interactive state, no keyboard move entry and no alternate text move form. Independently, the drill
captures unmodified Tab for comparison and traps focus on `<summary>`. Those are core-action
failures, not missing polish. `[V]`

The exact-pointer repair changed the other half of the baseline after R18: click/drag/touch now
deliver the authored UCI in 90/90 cells across six packs and five viewports, including phone. This
RFC must preserve that path rather than replace Chessground with an accessibility-only second game.

## Specification

### 1. One controller, no independent move implementations

`apps/web/src/lib/board-input.ts` owns a pure `BoardInputController`. `Chessboard.svelte` creates
one controller per rendered position and feeds every input projection into it.

```ts
type BoardInputPhase = "idle" | "origin_selected";

interface BoardInputState {
  readonly phase: BoardInputPhase;
  readonly activeSquare: Square;
  readonly origin: Square | null;
  readonly legalDestinations: readonly Square[];
  readonly lastAnnouncement: string;
}

interface BoardInputPosition {
  readonly fen: string;
  readonly orientation: "white" | "black";
  readonly sideToMove: "white" | "black";
  readonly legalMoves: ReadonlyMap<Square, readonly Uci[]>;
  readonly disabled: boolean;
}
```

The controller accepts these actions:

```ts
type BoardInputAction =
  | { readonly type: "navigate"; readonly fileDelta: -1 | 0 | 1; readonly rankDelta: -1 | 0 | 1 }
  | { readonly type: "activate" }
  | { readonly type: "cancel" }
  | { readonly type: "pointer_origin"; readonly square: Square }
  | { readonly type: "pointer_destination"; readonly square: Square }
  | { readonly type: "text_move"; readonly value: string };
```

All successful paths return exactly `{ moveUci }`. `Chessboard.svelte` alone calls the existing
`onMove(moveUci)`. Pointer/drag does not bypass the controller and text/keyboard does not call a
separate API.

Position replacement resets origin/destinations and retains an active square only when it remains
on the board; otherwise active square becomes the side-to-move king square, then the first movable
piece in visual traversal order. Rewind, preview, orientation changes and run replacement are
position replacements.

### 2. Coordinate and orientation semantics

Arrow navigation follows the board as displayed:

- ArrowRight moves one visual column right;
- ArrowLeft moves one visual column left;
- ArrowUp moves one visual row up;
- ArrowDown moves one visual row down;
- Home/End move to the first/last file on the visual row;
- PageUp/PageDown move to the first/last visual rank;
- coordinates wrap nowhere.

The same action sequence therefore reaches different algebraic squares after orientation flips,
but the active-square announcement always names the actual algebraic square. A test covers all four
corners under both orientations.

### 3. Keyboard move sequence

The focusable board control uses:

- arrows/Home/End/PageUp/PageDown: navigate;
- Enter or Space while idle: select the active square if it owns a legal move;
- Enter or Space with an origin selected: commit if active square is a legal destination;
- Escape: cancel selection; a second Escape returns focus to the board-region entry control;
- `?`: existing help, unchanged;
- no unmodified Tab interception.

Selecting an immovable/other-side piece announces why and keeps the prior origin. Choosing an
illegal destination announces the origin, attempted destination and “not a legal destination,” and
does not guess another square. Promotion with more than one legal role opens a native labelled
choice; no queen auto-promotion occurs in keyboard/text mode unless the entered move explicitly
selects queen.

### 4. Assistive semantic projection

The visible Chessground remains the graphical board. Beside it, `Chessboard.svelte` exposes one
focusable semantic board control with `role="grid"`, `aria-rowcount="8"`, `aria-colcount="8"`,
`aria-activedescendant` and 64 stable `role="gridcell"` semantic nodes. Exactly one cell is active;
cells do not each enter the Tab order.

Each cell label contains, in this order:

1. algebraic square;
2. occupant color/role or “empty”;
3. selected origin, legal destination or last-move status when applicable;
4. check status only when the king on that square is in check.

It does not announce engine evaluation, detector output, attacks, hints or hidden evidence. Legal
destinations are interaction facts and may be announced after the learner selects an origin, just
as the visible board shows legal destinations today.

The board control's label states orientation, side to move, move number and disabled/read-only/
preview/terminal status. A separate `aria-live="polite"` status announces selection, cancellation,
illegal input and committed move once. It never re-announces all 64 cells after a move.

The semantic grid is not `display:none`, `hidden`, `aria-hidden`, zero-sized with clipped focus, or
otherwise absent from the accessibility tree. Its visual treatment may be compact, but a keyboard
user must see which square is active and the current selection.

### 5. Text move fallback

Every playable board includes a collapsed-by-default “Enter a move” form adjacent to the board.
It contains one labelled input accepting SAN or UCI and a Submit button. It is available to all
users, not screen-reader sniffed.

Parsing rules:

- trim Unicode whitespace; accept case-insensitive UCI and standard SAN for the current position;
- require exactly one legal move after parsing;
- on ambiguity, list the disambiguation needed without listing candidate best moves;
- on illegality, preserve the input and announce the error;
- on success, normalize to UCI and dispatch through the controller;
- promotion requires `=Q/R/B/N` in SAN or the UCI promotion suffix;
- never send raw text to the server or an LLM.

This is a move-input fallback, not a command console or analysis field.

### 6. Pointer, drag and touch projection

Chessground callbacks identify source/destination squares and dispatch the two pointer actions.
The controller validates the same legal-move map used by keyboard/text. Existing selection-bound
bounds invalidation remains unchanged and still runs before coordinate hit testing.

Touch, click and drag retain their current visual behavior. Pointer selection updates the semantic
active square/origin so switching from touch/mouse to keyboard mid-move continues one state rather
than starting a second selection.

### 7. Disabled/read-only/preview/terminal behavior

When `disabled` is true, every projection refuses move submission with the same reason. Navigation
and position reading remain available in read-only/preview/terminal states; activation and text
submission are disabled. Busy state may temporarily disable submission but must not remove the
active square or focus.

Spectators and read-only followers can inspect the semantic board without acquiring a writer lease.
No accessible action bypasses the existing run access check.

### 8. Focus traversal and shortcut repair

Unmodified Tab and Shift+Tab are reserved for browser focus traversal everywhere. The drill's
comparison action moves to `Alt+C`; `C` remains available only when the target is the drill region
itself and not an editable/input/grid control. The help sheet lists the new binding.

The keyboard handler's interactive-target predicate includes `summary`, `[contenteditable]`, the
semantic grid, and the text move input. It uses `event.composedPath()` so nested spans/icons do not
cause a parent button/grid to be misclassified.

Forward and reverse focus tests traverse from the app header through Assistance, board grid, text
move form, board marks, timeline/branches/evidence and run actions, then leave the drill. No probe
may repeat one element unless the tester deliberately presses no traversal key.

Dialogs/sheets restore focus to the exact invoking control; a committed board move returns focus to
the board grid, not the document body.

### 9. Announcements and language

Announcements describe input state, rules legality and the committed move. They do not evaluate:

- allowed: “Knight on f3 selected. Legal destinations: d4, e5, g5, h4.”
- allowed: “Move committed: Nf3 to e5.”
- forbidden: “Ne5 is strong,” “best move,” “you found the fork.”

SAN in the committed announcement is computed locally from the before position and normalized UCI.
If SAN generation fails, announce UCI rather than withholding success or inventing notation.

### 10. Browser and unit verification

The existing exact-UCI browser harness becomes input-mode-parametric. Its permanent release subset
covers the six served endgames at desktop/tablet/phone for click, drag, touch, keyboard and text.
Keyboard and text must produce the same UCI as the authored source; this expands the live matrix
from 90 to 150 cells without deleting the historical 90-cell pointer baseline.

Unit/property tests cover:

- all 64 squares, both orientations and boundary navigation;
- selection/cancel/illegal destination and input-method switching;
- SAN/UCI ambiguity, castling, en passant and all four promotions;
- disabled/read-only/preview/terminal refusal equivalence;
- stable semantic IDs and exactly one active cell;
- no Tab/Shift+Tab prevention and complete forward/reverse focus traversal;
- announcements containing no assistance/evaluation language;
- exact controller output equality across action projections.

The accessibility-tree probe asserts one named interactive grid, 64 named cells, one active
descendant, current side/turn/status, and a visible text-entry fallback. A generic named `<div>` is
the pre-change negative control.

### 11. Owner validation

After mechanical checks pass, the owner completes on their available devices:

1. make a move by keyboard navigation;
2. make a move by text entry;
3. make a move with the available screen reader;
4. rewind, switch orientation, make another move and exit the run;
5. traverse forward and backward through the complete drill without a focus trap.

The result is logged with device/browser/assistive technology and concrete failures. Per D649 no
external panel is required; a failed owner run blocks release and returns to this RFC.

## Deviations from design

None. This implements the O13 input floor and O4 input-equivalence clause without changing
assistance content.

## Acceptance criteria

1. One controller is the only caller of `onMove`; click, drag, touch, keyboard and text fixtures
   return byte-identical UCI for the same legal move. Fails if any projection has private legality.
2. The browser matrix passes 150/150 exact cells with zero wrong and zero missing requests. Fails
   if the new modes replace rather than extend the 90-cell pointer/touch floor.
3. Both orientations pass all navigation/corner fixtures. Fails if arrows follow algebraic rather
   than visual direction after flip.
4. The semantic board exposes one grid, 64 named cells and one active descendant; the current generic
   single-node tree is the negative fixture.
5. Keyboard selection, cancellation, illegal destination and promotion work without pointer events.
6. Text SAN/UCI tests cover ordinary move, capture, check, castling, en passant, ambiguity and four
   promotions; every success dispatches normalized UCI through the controller.
7. Read-only, preview, terminal and busy states refuse submission identically across all inputs while
   permitting navigation/reading.
8. Unmodified Tab/Shift+Tab are never prevented. Forward/reverse live traversal reaches every
   region and exits; the old Assistance-summary trap is the negative control.
9. Comparison uses the documented non-conflicting shortcut and never fires from an input, summary,
   semantic grid or contenteditable descendant.
10. Announcements contain position/input facts only. A fixture attempting to add “best,” “good,”
    “blunder,” or a detector label is refused by a closed message constructor.
11. Pointer selection updates semantic state and keyboard can finish the same move; keyboard
    selection can be finished by pointer. Fails if two selection states diverge.
12. Focus returns to the grid after commit and to exact invokers after dialogs/sheets.
13. `make verify` and `make test-browser` pass; the accessibility-tree probe runs in CI.
14. `docs/drill-client.md`, `docs/app-shell.md`, shortcut help and release-platform docs describe
    the same input/focus contract.
15. No schema, storage, content, evidence, assistance or provider contract changes. The RFC's diff
    changes web input/accessibility code, tests and canonical docs only.
16. The owner validation protocol is completed and logged before F12-H/1.0; implementation may
    archive this RFC after code lands, but the release proof retains the owner-use result.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | [[D612]] keyboard and assistive board move entry | `accessible-board-input` | implementation commit | |
| D2 | [[D613]] normal Tab traversal and focus-trap removal | `accessible-board-input` | implementation commit | |

## Open questions

No owner/product question remains. Cross-review must validate the semantic-grid technique in the
actual Chromium accessibility tree and may replace it with a better standards-conforming one only
if all named behavior/criteria remain. It may not settle for a text form alone: O13 requires
keyboard/assistive board entry, and the text form is the independent fallback.

## Changelog

- 2026-08-21: initial F12-F draft from R18/O13, refreshed after the exact pointer/touch repair.
