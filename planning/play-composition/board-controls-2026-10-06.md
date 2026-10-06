# Board controls and native input boundaries — 2026-10-06

Accepted authority: `rfc/play-composition.md` A3 and the existing
`rfc/accessible-board-input.md` controller/cancellation/read-only contract. This is an
implementation checkpoint, not a normative amendment or a full RFC discharge.

## Measured predecessor

At `92994e48`, the collapsed notation control paints 3,531.125 px² onto the board at all six
measured projections. At phone widths 430/390/360/320, controls intercept all eight back-rank
centers. Actual e7→e8 clicks open the notation door rather than the promotion picker; the same
raw drag still reaches promotion. Click and drag are not interchangeable proof. The final
native evidence is `board-controls-native-predecessor-2026-10-06.json`, result **failed**.

The first diagnostic (`board-controls-predecessor-2026-10-06.json`) measures actual partial
Appearance/entry overlap but initially misclassifies below-viewport centers at 320×256.
The permanent instrument corrects that by natively scrolling each of all 64 semantic squares
into view, measuring the physical center, then restoring every original scroll offset.
Off-screen-center counts are not product defects. A strict locator initially includes the
Chessground ghost pawn; the final predecessor excludes that ghost before measuring paint.

Promotion Cancel leaves the real pawn on e8 instead of its unchanged e7 source. A second raw
drag cannot retry. The fixed code restores authoritative FEN; its initial exact-box assertion
reads the first interpolation frame and fails. The permanent assertion waits for the existing
user-selected animation to settle, then requires the exact source rectangle and another actual
gesture. It does not widen a geometric tolerance or force a move.

The mounted predecessor seed test also fails: submitting e4 calls the parent draft handler
once with the advanced FEN. The notation form is nested inside the position form and its
submit event bubbles. This is measured behavior, not only an invalid-HTML source observation.

## Repairs and permanent controls

- D3458: `BoardNotation` renders the input projection, never parses chess or calls an API.
  Play seats its compact door in the existing fixed timeline strip, outside the physical square.
  Appearance lives inside the door. The mounted Chessboard exposes only controller dispatch
  and availability/disabled getters. Other playable boards seat the same projection below
  the square in normal flow. Read-only/disabled previews omit it; waiting boards retain the
  grounded disabled reason. The board keeps its existing viewport-owned geometry.
- The open Play notation panel uses the existing modal boundary. Invalid text is retained,
  its exact controller refusal is visible/announced inside the active panel, Tab is bounded,
  and Escape releases background inertness and restores the summary focus. Legal text
  still goes through the one controller and authoritative `onMove` path.
- D3459: position fields and notation are separate native forms. Create's explicit submit
  button names its position-form owner. Move entry stops submit propagation. Mounted and
  real authenticated browser controls prove e4 advances FEN without a draft request; the
  actual Create button then posts exactly once and receives the production response.
- D3460: Cancel resets both controller state and Chessground's authoritative paint, with
  no `onMove` or committed FEN change. The original source rectangle and real drag retry
  are required after normal interpolation. Escape uses the same cancel function.
- D3461: the first native Create journey catches an in-flight layout regression: the seed
  wrapper still reserves a fixed aspect box while notation grows in normal flow. The next
  drafts section covers Create. Removing that redundant aspect constraint lets the wrapper
  size to all content; the physical board retains its own square authority. The replacement
  native Create journey passes without forced clicks or hiding the form.
- D3462: authority re-read catches the initial repair's topbar seat. The existing accepted
  contract names the strip or companion, so the door moves into the fixed strip. Earlier
  passing topbar images are superseded, not reused as verification of the corrected seat.
- D3463: the corrected strip seat exposes a checker false positive, measured independently
  by a fixed action that genuinely receives a native center hit outside an ordinary clipped
  ancestor. Containing-block traversal now follows fixed paint geometry. Transforms,
  perspective, filters, containment, will-change and content-visibility controls retain
  genuine clipping; fixed own-label and viewport-edge negatives also remain.

`make play-composition-board-controls-check` permanently runs five native journeys: complete
shell bounds, strip seating and 64 centers at six projections including 320×256, back-rank clicks at five
projections, native authoring submission separation, Cancel/drag retry at 390×844, and native
modal focus/background restoration with complete bidirectional region traversal.
`make play-composition-client-check` passes 110 mounted tests in six files; typecheck has zero
errors/warnings. The normal full browser matrix carries these controls as well as the original
150 click/drag/touch/keyboard/text cells and all 112 paired composition cells.

## Final gates

The complete exact-index software gate passes at tree
`9ae457acbcd382bd710f8ad8131b51d57eed6899`: 3,248 tests/343 files, seven isolated performance
tests/four files, clean types and all downstream scaffold, packaging, release-policy, evidence,
semantic, capability, history, migration and artifact gates. Exact proof:
`board-controls-software-2026-10-06.json`. Later documentation/tracking bytes receive separate
staged governance and normal hook checks; they do not impersonate this software image.

The complete rebuilt `make test-browser-ci` exits zero: 68 smoke, five content, 57 matrix and
one packaged-default journey (131 passes), one existing optional real-Maia skip and zero retries.
All 112 same-result PNG/JSON pairs and the original report remain hash-equal after the packaged
tier: `board-controls-matrix-2026-10-06.json`, report
`sha256:beed6afd85cf6cf64c8820d7b2c9d1e2baed2fb6c8c51305737677a76baf4fe8`.
The current matrix inspects 1,593 active controls and 9,183 text bounds, with no issues.
Scoped D3458–D3463 close on this path evidence. Real-content gates have passed:
225 tests/23 files, 92 clearance documents with zero errors, and 104 derived-equal pack capability
documents. Final staged-governance and normal hooks run before the checkpoint commit;
no failing invocation is relabelled as passed. Focused native
measurements are retained in `board-controls-native-2026-10-06.json`.

The initial complete browser pipeline passes 68 smoke and five content journeys, then fails one
matrix journey (56 pass): its mobile target-size check still looks for Appearance before opening
the notation door. The corrected native navigation opens that door before measuring Appearance;
the 24px bounds, input/Submit sizes and subsequent board/reflow assertions remain. The complete
replacement pipeline runs again; the failed pipeline does not count as release evidence.

The initial strip-seated conformance run passes seven journeys and fails two: its fixed-overlay
calibration and actual open-entry cell. The ordinary clipped DOM ancestor is not a clipping
containing block for that viewport-fixed paint. After the paired predicate repair, all nine
journeys/112 cells pass, including the containing-block/own-label/viewport-edge negatives.
The initial unprivileged build invocation cannot start because the package-manager wrapper's
lockfile write is sandbox-denied; the ordinary approved Make invocation runs the actual gate.
Neither that infrastructure failure nor the earlier two passing topbar software images counts
as the corrected strip image's final evidence.

The first complete strip browser pipeline passes smoke/content and 56 matrix journeys, then
fails the Tab test's obsolete whole-workspace inert selector. The strip dialog is inside that
workspace; the existing modal boundary correctly owns its background siblings. The replacement
checks topbar, physical board slot, timeline and companion individually, requires the dialog
itself not to be inert, and retains all native circular Tab/Escape/restoration and bidirectional
region traversal checks. No production modal code, force-focus or keyboard assertion is removed.
The replacement focused command passes all five journeys; the complete software and all four
browser tiers then pass on the final snapshot, rather than only rerunning that one test.

## Remaining scope

`make staged-process-contracts verify-governance` exits zero after the full closeout: register,
status/history, work-state/work-item, anchored roadmap/receipt, intent, test-tier/docs and
append-only flow-back checks pass. All 1,686 live ledger items are routed, zero untriaged/doing;
all 569 UX items remain assigned. All fifteen staged source/test/Make paths remain byte-equal
to the passing software image. Final receipt/log additions are explicitly restaged and the
ordinary pre-commit hooks check the final boundary.

Full D1834/A3 and A4 Inspector/destination/vocabulary acceptance remain open. D3436 retains
phone companion authority reconciliation; this notation boundary does not change its policy.
D1639 ceilings and the accessible-board-input D3 owner-use discharge are unchanged.
There is no whole RFC, capability or milestone promotion, no content graduation, no protected
intent/archive edit and no remote CI success claim. Routine metadata/hash updates are automatic.
