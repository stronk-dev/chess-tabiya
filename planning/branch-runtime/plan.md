# Immutable Branch & Rewind Runtime — implementation plan

RFC: `rfc/branch-runtime.md` (accepted 2026-08-12). Assignee: codex.
A `[x]` may flip only in a commit carrying the test that exercises the claimed
behavior (cloud-clicker rule). Append every session to `log.md`.

## 0. Scaffold (shared with drill-pack-format)

- [x] pnpm monorepo: `packages/runtime` (the shared TS package), `packages/schema`,
      `apps/server` (Node), `apps/web` (Svelte 5 + Vite), `workers/` (empty, Go
      later), `content/packs/`, `schemas/`
- [x] Root Makefile with `verify` = typecheck + test + schema-check (cloud-clicker
      pattern); repo-local caches so agents avoid permission prompts
- [x] AGPL-3.0 LICENSE; deps: chessops, fast-check, vitest
- [x] CI: single workflow running `make verify`

## 1. Core tree + events (`packages/runtime`)

- [x] Node/Branch/Run types per RFC §Node model (path-keyed, transposeKey)
- [x] Living `schemas/drill_run.schema.json` v0.2 incl. event `seq` (BR-C8)
- [x] Event log append + projection; segment derivation (checkpoint spans)
- [x] commitMove: leaf append + implicit fork at non-leaf cursor (`alt-N`,
      `branch.forked` then `move.committed`) (BR-C1)
- [x] Explicit fork (empty named branch), rewind (cursor only)
- [x] Typed errors: ILLEGAL_MOVE(reason)/UNKNOWN_NODE/UNKNOWN_CHECKPOINT/
      NOT_ACTIVE_WRITER/RUN_TERMINATED (BR-C4)

## 2. Objective state machine

- [x] Engine-free predicate evaluation (rules facts, material, fenPredicate,
      checkpoint reach) per RFC transition graph (BR-C3)
- [x] `objective.state_changed` always carries evidenceRefs
- [x] Async evidence-upgrade path stubbed (interface only; workers RFC later)

## 3. Replay, compare, export

- [x] Read-back replay (opponent moves authoritative from log) (BR-C2)
- [x] compare(): common-fork requirement, aligned pairs + absent marking,
      objective timelines, checkpoint hits (BR-C7)
- [x] PGN export with variations (chessops), legality-checked
- [x] JobObserver.onRewound hook, tested with fakes (BR-C6)

## 4. Property + scenario tests

- [x] fast-check properties: invariants 1–3, 5–8
- [x] Replay determinism ×2; error-surface test (never-silent)
- [x] Scripted mock-opponent vertical scenario from RFC acceptance criteria
- [ ] Latency measurements recorded in log.md (honest, even if over budget)

## 5. Server binding (`apps/server`)

- [ ] REST + events(sinceSeq) bindings wrapping the runtime package
- [ ] Single-writer lease (NOT_ACTIVE_WRITER on conflict)
- [ ] Storage: decide SQLite vs Postgres HERE, log the decision + update
      `rfc/README.md` deferred register

## Out of scope (do not build)

UI beyond a smoke page; engines/Maia (workers RFC); feedback composition;
multi-device merge; corpus anything.
