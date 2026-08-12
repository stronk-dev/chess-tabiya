# Terminal outcome events — log

Append-only.

## 2026-08-12 — Codex implementation start

- Owner accepted revision 3 and directed implementation without another RFC review.
- Scope is D11 only: terminal outcome production and integrity, run schema v0.6,
  storage migration 4, disclosure/delivery behavior, authored feedback, and client paths.
- Existing terminal histories receive no synthetic events. Migration 4 upgrades ordinary
  v0.5 snapshots and quarantines v0.5 snapshots containing pre-producer outcome events.

## 2026-08-12 — Codex implementation

- Run schema v0.6 closes the learner-perspective outcome vocabulary. Runtime commits
  terminal outcomes and refuses terminal roots; projection validates node existence,
  terminality, result, uniqueness, and adjacency before disclosure can open.
- Migration 4 preserves ordinary v0.5 history and quarantines rows containing the
  formerly producer-less event. No stored event history is synthesized.
- Both feedback predicates now treat outcome as reveal; attempt-end remains open through
  rewind and closes on the next committed move.
- Authored delivery uses discriminated checkpoint/outcome attribution and widens only
  along terminal paths actually present in the run.
- The writer stops before opponent selection, followers refresh after polling the
  reveal, and the terminal sheet renders authored commentary plus recorded evidence.
- During implementation, acceptance criterion 12 was found to retain revision 2's
  contradicted “migration is a no-op” phrase. The implementation clarification separates
  event-log compatibility from migration 4; no behavior or scope changed.
