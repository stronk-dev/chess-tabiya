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

## 2026-08-12 — codex, server reveal projection

- Added typed access for the three supported authored shapes without changing
  the v0.2 JSON Schema. `pack-check` now warns, rather than guesses, when
  spine-anchored prose lies beyond every statically resolvable checkpoint; any
  dynamic checkpoint suppresses that warning.
- Added an event-sequenced projection and `GET
  /runs/:id/authored-feedback`. Tests exercise Pack A's main and Tal sibling
  paths, repeated checkpoint ids on separate branches, segment-end reveal,
  extraction exclusions, deterministic ordering, and monotonic reveal after
  rewind.
- The response counts only structurally deliverable annotation, deviation-note,
  and plan-class items. Pack A's unanchored claims and concepts are neither
  returned nor allowed to pin the coarse withheld flag.
- Focused schema/server suites and the workspace typecheck passed before this
  checkpoint.
