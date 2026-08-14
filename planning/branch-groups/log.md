# Branch Groups implementation log

Append-only.

## 2026-08-14 — Codex implementation review

Approved after four blockers were corrected before code. Replay now binds every member to
the direct seed child rather than requiring an incompatible branch fork; machine-source
distributions persist so the UI can ground source and engine attribution; the stateful
group-reply route derives position, policy, pack, and seed from leased server state; and
the browser criterion now covers lockstep cancellation followed by `/analysis` recovery.
`theory_strict` journal compatibility explicitly permits its recorded `human_common`
off-spine fallback only while the same Maia identity remains live. Baseline after
defect-batch-2: 374 tests / 64 files, run schema 0.8, pack schema 0.12, storage 10.

## 2026-08-14 — Persisted group substrate

Run schema 0.9 adds the closed `group.created` event and the honest `enumerated`
applied-policy value. Replay binds each member to its direct seed child, accepts an
adopted main branch whose own fork predates the source, refuses repeated membership, and
requires a mode-matched recorded distribution for machine sources. A fast-check property
covers every supported group size. Migration 11 uses frozen `"0.8"` → `"0.9"` literals
and leaves quarantined rows untouched. The focused 21 tests and workspace typecheck pass.

## 2026-08-14 — Creation contract clarification

Implementation exposed one wording contradiction in the accepted request shape: `authored`
uses `size` to take the first N spine children, while the field comment said it was for
machine sources only. The normative source table already required the authored use. The
comment now says `size` is for every non-hand source; `hand_picked` derives its size from
the explicit candidate list. No behaviour or authored vocabulary changed.
