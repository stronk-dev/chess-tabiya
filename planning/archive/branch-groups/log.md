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

## 2026-08-14 — Server creation, reply journal, and client plumbing

The two server routes are thin, closed parsers over server-owned run context. All four
seed sources resolve without trusting client FEN/history/policy; hand-picked creation
adopts an existing direct child without a second evidence job; machine sources preserve
their original distribution and mark enumerated plies honestly. The fixed journal was
exercised with two knight-move orders transposing to the same position: the second reply
was returned byte-identically and the selector was not called again. Strong-engine
enumeration restores MultiPV only after `bestmove` while still inside the supervisor's
serialized request.

Typed browser plumbing now projects the mutation-returned events, routes opponent turns
on group members through `/group-reply`, and exposes on-demand analysis for cancelled
evidence. Focused server and client tests pass; Svelte reports 0 errors and 0 warnings.
Two concurrent research commits captured the already-prepared server and client source
changes while they shared the worktree; the exercising tests and these checked plan rows
land together rather than rewriting shared history.

## 2026-08-14 — Group surface and browser walkthrough

The drill now captures 2–8 legal candidates without mutating the run, marks grouped
branches in the rail, and renders the group as a horizontally pannable semantic-zoom
grid. Overview contains labels/state/outcomes only; Summary adds last move, exact ply and
material counts, checkpoints, and honest evidence absence; Boards uses the disabled
comparison board. Source attribution and the fixed/varied resistance sentence come only
from persisted group data. Sequential is the default; lockstep is a versioned local
navigation preference and a browser assertion proves that it rotates to another member.

The browser walkthrough captured three candidates, created three real branches, played a
second learner decision on each, exercised lockstep, observed evidence discarded by a
rewind, recovered it through `/analysis`, opened the existing three-column comparison,
and exported a PGN with all variations. That walkthrough found one real cross-layer bug:
the new client analysis call omitted the route's required `kind` and a search budget,
which made the queue throw. It now sends `kind: bestline`, `multiPv: 1`, and
`movetime: 100`; the recovery path passes end to end.

An eight-member hand-picked group took **1.265 ms** in the local in-memory service/mocked
engine measurement. This is far below the 100 ms worry / 200 ms intervene navigation
band, but it is explicitly a service-only synthetic measurement, not a storage/network
claim, and gates nothing.

## 2026-08-14 — Completion protocol

Canonical behavior is distilled into `docs/branch-groups.md` and linked from the runtime,
engine-worker, and drill-client descriptions. The B3 gate and branch-groups ledger row now
describe shipped behavior. Final pre-closeout verification passed with **389 tests across
67 files**, Svelte at **0 errors / 0 warnings**, and **15 Playwright tests at zero retries**
(the opt-in Maia latency test skipped). The RFC and this planning job move to their frozen
archive locations in the same commit as the registers.
