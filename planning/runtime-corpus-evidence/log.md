# Runtime corpus evidence log

## 2026-08-14 — Codex review and start

The post-Predicate-Wave-2 review found no implementation blocker. It corrected the
stale migration narrative and baseline, and pinned `committedMoveSan` to the learner
child on the active-cursor path so forks cannot select an arbitrary continuation.
Implementation started with pack schema 0.13, run schema 0.10, storage 12, and a green
416-test/70-file verification baseline.

## 2026-08-14 — implementation complete

The runtime source, cache, capability/error/permission/REST seams, v1→v2 preference
migration, typed client, and closed assistance renderer landed. The browser path
exposed one orchestration race in the test itself: revealing before the asynchronous
mock opponent reply allowed that reply to correctly re-close the attempt-end window.
The acceptance now waits for the reply before reveal and proves the real contract.

Verification on the feature tree: `ENGINES_REQUIRED=1 make verify` — 424 tests across
72 files, schema and packaging green; `make test-browser` — 17 passed, optional Maia
check skipped, Playwright retries unset.
