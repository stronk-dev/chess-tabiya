# Authored explanation surface — implementation log

Append-only.

## 2026-08-12 — codex, implementation start

- Read revision 3 after two adversarial review rounds. The accepted mechanism is
  event-sequenced, path-relative reveal with structural item identities and exact
  checkpoint-event attribution.
- Confirmed the required commit boundary: initial-opponent orchestration and its
  browser-harness prerequisites land before the authored-feedback acceptance.
- Scope guard: no claim triggers, LLM rendering, corpus/Syzygy, live deviation
  classification, FEN-deviation matching, D2 changes, or new authored fields.

## 2026-08-12 — codex, initial-opponent prerequisite

- Resolved the accepted defect generically in `DrillSessionController`: after
  start or writer resume, an opponent ply is selected only when it is the
  opponent's turn and no checkpoint blocks. Read-only followers never select or
  append.
- Added explicit tests for new-run play, writer resume, follower exclusion, and
  checkpoint blocking. Added a server-level mock test for Pack A's deterministic
  `...Bf5`, `...e6`, `...c5` path.
- The browser harness now starts in development mode and locates the schema
  example by review status instead of assuming the registry contains one pack.
  Existing browser suite: 2 passed, optional Maia test skipped.
