# app-shell — log (append-only)

## 2026-08-11 (claude, setup)

- RFC accepted after adversarial review (AS-C1..C8 resolved in-draft; no owner
  rulings needed). Key corrections from review: this is a shell-layer rewrite
  (no router exists), storage cannot list and the repo has no migration
  mechanism while compose mounts a persistent volume, lease visibility was
  unimplementable without a non-minting peek, and the keymap would have
  double-fired against DrillScreen's window handler.
- Router decision: hand-rolled, no new dependency (deferred-decisions register).
- Next: codex session 1 → §1 storage listing + migration.

## 2026-08-11 (codex, §1 storage listing + migration)

- Added the ordered `PRAGMA user_version` runner. Migration 1 is transactional,
  logged after commit, adds `summary_json`, and replays each legacy event log
  exactly once to backfill it. A fixture database test proves the upgrade and
  that reopening at version 1 applies nothing.
- Run summaries are maintained with snapshot writes and list without replay or
  pack-registry access. New registered runs capture the pack title; legacy rows
  fall back to `packId` because the pre-migration snapshot did not store titles.
- Added `RunStorage.list(limit, offset)` and `GET /runs` (default 50, maximum
  100), ordered newest-first and returning `activeWriterId`.

## 2026-08-11 (codex, §2 lease visibility)

- Added `activeWriterId` to graph reads and the typed web response, alongside
  the run-list lease field shipped in §1.
- Replaced implicit `WriterSession` construction with explicit `claimFor()`.
  `peek()` only returns an existing local claim; `observe()` creates an
  in-memory read-only follower and never writes localStorage.
- Resume reads the graph before constructing run state. A matching stored id
  resumes writer mode; a missing or foreign id starts read-only immediately.
  Tests cover both refresh paths and prove a foreign peek leaves storage empty;
  the existing 409-demotion test remains green as the defensive fallback.
