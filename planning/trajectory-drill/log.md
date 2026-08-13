# Trajectory Drill — log

Append-only.

## 2026-08-13 — Codex implementation

- Implemented one-run trajectory legs. Boundaries are checkpoint occurrences on the
  legal node path; there is no authored jump or pack chain.
- Objective rules compile against the outgoing leg. Non-absorbing preserved/degraded
  state seals and resets to active at entry; active requires no invalid self-edge and
  absorbing state stops rather than pretending the next leg was entered.
- Added a deliberately mechanical fixture. It exists to exercise causal continuity and
  makes no claim that arbitrary opening plies are real phase changes.
- Core and schema verification pass with 297 tests across 50 files; the fixture passes
  `make pack-check`. The canonical doc explicitly refuses an aggregate or invented phase
  detection.
- Browser gate passed 10 required tests with zero retries; optional Maia test skipped.
  Branch switching measured 51.9 ms, below the owner-ratified 100 ms worry threshold.
