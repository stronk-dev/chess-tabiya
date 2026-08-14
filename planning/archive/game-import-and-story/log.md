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

## 2026-08-14 — Codex §2

- Extracted the Arena mainline parser into one shared module and kept its single-game, no-variation, legal-SAN, 300-ply semantics; own-game import additionally refuses zero-move and non-standard games.
- Added paste-PGN and public Lichess game resolution. Lichess requests are serial, unauthenticated, timeout-bounded, and explicitly exclude server evaluations; chess.com URLs explain the paste-PGN workflow.
- Added atomic imported-run plus provenance persistence and authorized `GET /runs/:id/import` reads. `POST /runs/import` is a closed, typed REST contract with the four import error codes mapped intentionally.
- Tests exercise actor stamping, absence of fabricated opponent selections, atomic refusal, source normalization, no credential header, REST creation/readback, and unknown-field rejection.

## 2026-08-14 — Codex §3

- The import response enqueues one eval job per original-mainline node, including the root. Queue state is now inspectable without mutation so story reads enqueue only nodes with no durable eval, current failure, or outstanding job.
- The active writer remains the only actor that can attach staged evidence. Once every node is durable or failed, repeated story reads enqueue nothing; process loss converges by re-enqueueing missing durable nodes.
- Added a runtime story projection over persisted evidence and shipped pivotal/phase/endgame/shape detectors. Eval pivots use the pinned ±1000 rail and 150 cp threshold; all sentences name their recorded or detector ground.
- Terminal slides carry separate fact and entry nodes, so a checkmated position is never offered as playable. Tests cover the terminal-parent boundary, learner-relative evals, N+1 cost, durable application, and idempotent completion.

## 2026-08-14 — Codex §4

- Imported PGN headers now amend export without overriding Tabiya's run/session identity headers. The default export includes every branch, so the source continuation and story re-entry remain one legal PGN.
- Added `/review/game/:runId`: a grounded, ranked story over persisted facts with honest pending state, learner-side board orientation, optional packet-bound voice, and explicit export. Re-entry rewinds and forks immediately, including from the imported leaf, so the original is preserved before the learner plays.
- The browser acceptance imports pasted PGN, waits for the durable evidence pass, opens the story, re-enters, plays a different continuation, and verifies both the new branch and amended export.
- The exact CI command exposed four current-tree fixture assumptions while this layer was in progress: a stale schema `$id`, two story tests using a branch label instead of its structural id, and an illegal Arena mismatch fixture. All were corrected against the shipped contracts before this checkbox flipped.

## 2026-08-14 — Codex §5 closeout

- Canonical behavior is distilled into `docs/game-import-and-story.md`; `docs/branch-runtime.md` now names run schema 0.10, imported session identity, attempt-end reveal scope, and imported export amendments.
- Final implementation gates before archival: `ENGINES_REQUIRED=1 make verify` — 399 tests / 69 files, schema and packaging green; `make test-browser` — 16 passed at zero retries, optional Maia latency skipped.
- GitHub Actions run 31797561925 remains an older-SHA result and cannot validate unpushed commits. Its reported readonly TypeScript errors are fixed by pre-existing commit 9db9183; the exact CI command is green on this completed tree.
