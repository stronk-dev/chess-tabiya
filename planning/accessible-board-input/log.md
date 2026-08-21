# Accessible board input — implementation log

Append-only.

## 2026-08-21 — implementation and mechanical verification

- Added one controller for pointer, drag, touch, keyboard and SAN/UCI text entry, including shared
  promotion and disabled-state behavior.
- Added the eight-by-eight semantic grid, assistance-ceiling inheritance, live announcements and
  focus return after a committed move.
- Released Tab/Shift+Tab and moved comparison to physical `Alt+C`; dialog close now restores the
  actual invoking control.
- Promoted the interaction gate to 150 exact cells and added the post-gesture tree assertion.
- The first adjacent text-form layout intercepted bottom-right board squares. Browser replay caught
  the regression; the control moved out of the interaction layer. The first repair then reduced the
  board below 192px on short desktops; the final layout uses an adjacent sidecar there. Both the
  interaction matrix and viewport floor pass.
- Added a live bidirectional focus traversal test after the acceptance audit found that the earlier
  focused suite did not exercise the RFC's complete Tab/Shift+Tab promise.
- `make verify`: 788 tests / 121 files green. Full browser suite before the final traversal addition:
  27 passed, one optional Maia probe skipped; the added traversal test passes in isolation.
- D1/D2 are mechanically complete. D3 remains the owner's normal validation-by-use session.
- Lifecycle repair [[D664]] records that this planning directory was created at closeout rather than
  when implementation began; no clean-history claim is made.

## 2026-08-21 — final browser gate

- After the complete traversal assertion and empty-timeline focus stop landed, the full browser
  suite passed: 28 scenarios green, one optional live-Maia latency probe skipped, zero retries.
- Web typecheck reports zero errors and zero warnings. The earlier 27-pass figure above is retained
  as the pre-traversal reading rather than rewritten.
