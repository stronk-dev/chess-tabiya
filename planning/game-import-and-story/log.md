# Game import and story implementation log

Append-only.

## 2026-08-14 — Codex implementation review

Approved after four corrections before code. Branch Groups is now an archived,
implemented dependency and the baseline is 389 tests / 67 files, run schema 0.9,
pack schema 0.12, storage 11. A terminal outcome slide now separates its grounded
fact node from its playable parent entry node. Evidence remains single-writer: the
active writer applies staged results through the shipped route; story reads may
idempotently restore missing jobs but never impersonate a lease holder.

GitHub Actions run 31797561925 tested older SHA 057e7a4 and failed on five
`branch-groups.test.ts` TypeScript errors. Commit 9db9183 already fixes those exact
errors; the current local verify gate passes.

## 2026-08-14 — Codex §1

- Added imported as a non-pack run identity and included the canonical movetext digest in session identity; a bare persisted imported run intentionally cannot reconstruct that source.
- Bumped the run schema to 0.10 and storage to migration 12. Migration 12 uses frozen 0.9/0.10 literals, creates the import-record table, and preserves existing run history.
- Imported runs are deliberately excluded from attempt/progression projection. Runtime, schema, storage-summary, authored-feedback, and client-resume literal seams now treat imported as non-pack.
- Exercising schema, identity, and migration tests pass; workspace typecheck is green.
