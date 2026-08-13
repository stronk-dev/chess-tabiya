# Pack Studio — log

Append-only.

## 2026-08-13 — Codex start

- Rebased migration 9 to 7 to preserve the user-approved lifecycle order and SQLite's
  monotone migration ladder. N-way and Live retain their relative order as 8 and 9.
- The publication channel is source-derived: files are official, database registrations
  are community. No author-writable document field decides trust.

## 2026-08-13 — Core implementation

- Shipped schema 0.8, migration 7, private durable drafts, optimistic saves,
  validation, digest-retained playtests, immutable community registration, restart
  hydration, export, and the real `/create` editor.
- D20 now fails loudly: a pack run whose exact bytes cannot be resolved gets
  `PACK_UNRESOLVABLE` before another move can commit. Playtest and superseded community
  bytes remain resolvable by digest without appearing in catalogue browsing.
- Provenance projection is an allow-list. A submitted `channel: official` or invented
  reviewer/endorsement string stays out of learner-facing responses.
- Not built: a visual spine editor, structured PGN/candidate/run seed forms, regression
  playback UI, or automatic content grounding. Those require authoring affordances over
  the shipped write path; none is simulated by a label.
- `ENGINES_REQUIRED=1 make verify`: 301 tests across 51 files, green. Browser gate:
  10 required checks passed with zero retries; optional Maia test skipped.
