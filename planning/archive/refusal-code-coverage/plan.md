# Refusal-code coverage

Status: implementing

## Work

- [x] Recount fixed refusal codes against the current post-wave tree.
- [x] Exercise every previously unpinned reachable refusal family.
- [x] Classify schema-shadowed exhaustive backstops explicitly.
- [x] Add a drift guard so new refusals cannot silently lack a coverage disposition.
- [x] Run both gates, log the result, and commit without touching active RFC lanes.

## Scope

Test-only standing work A from `planning/codex-queue.md`; no production behavior,
schema, migration, RFC, or design change.
