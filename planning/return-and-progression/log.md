# Return and progression — log

Append-only.

## 2026-08-13 — Codex start

- Independent adversarial review approved the RFC. Implementation starts after
  archived Defect Sweep and pack schema v0.5.
- Attempt identity is a run branch, not a checkpoint segment. Scheduling and
  metrics use the durable sibling projection and do not alter run events.
- Voluntary return is server-derived from schedule state; client-supplied
  origin is never trusted to decide the metric.

## 2026-08-13 — Implementation and verification

- Rebased the database claim from migration 8 to migration 6. The accepted six-RFC
  implementation order is load-bearing; retaining 8 would make later migrations 6 and 7
  unreachable under SQLite's monotone `user_version` ladder. The remaining drafts were
  centrally reassigned 7–9 in the RFC register.
- Pack schema 0.6, durable branch-attempt projection, migration/backfill, schedules,
  run duplication, intent provenance, REST routes, capability publication, and `/learn`
  landed with exercising tests.
- Tooling surfaced pre-created current-schema tables in migration fixtures. Migration 6
  uses idempotent DDL and `INSERT OR IGNORE` backfill so an explicit version rewind used
  for migration tests cannot collide with already-present tables.
- `ENGINES_REQUIRED=1 make verify`: 295 tests in 49 files, green. Browser gate: 10
  required tests passed with zero retries; optional Maia latency test skipped.
- Deferred honestly: personal-PGN recommendations, related-position expansion, and
  longitudinal metrics are not presented as learner-facing functionality.
