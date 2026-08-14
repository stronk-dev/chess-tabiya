# Social match implementation log

## 2026-08-14 — Codex implementation review

The RFC survived review after four corrections: migration 14 now applies SQLite
foreign-key pragmas outside the transaction and preserves unrelated child-table
references; stale migration/baseline prose is corrected; the nonexistent mutating
run-import escape is replaced by the actual Arena `importLeg` guard; and a
slot-bearing join token must grant `participant`, never `spectator`. Cross-layer
authorization will be enforced in service/storage seams so internal proposal paths
cannot bypass REST checks.

## 2026-08-14 — Native match implementation and exercising acceptance

Migration 14 rebuilds the three closed-vocabulary tables with foreign keys disabled
before the transaction, restores the pragmas afterward, and verifies the resulting
foreign-key graph. The migration-13 fixture and a fresh database now have byte-equivalent
table definitions; story tokens and unrelated live-session child references survive.
Migration 9's live vocabulary is frozen to literals.

The server now derives match actors and possession from the persisted FEN and learner
seats. Live mainline mutations reject rehearsal and derived-run escapes; pause opens the
existing rewind/fork/compare/reveal loop while locking the mainline tip; resume restores
the preserved mainline. The server tests exercise alternating authorship, both typed 409
codes, live duplicate/flip refusal, pause-time duplication/flip, comparison, the delivery
window re-closing on the next mainline move, uncountable mainline progression, countable
rehearsal, and the native-Arena verb split.

The browser composition exposed two seams not visible in service tests. First, the drill
controller still interpreted every position run as human-versus-engine and would request
a mock reply after a match ply. Second, `Chessboard` used `run.start.side` as both grading
perspective and movable color, making the Black seat unable to move. Match context now
suppresses engine selection, yields locally to follower polling after a live ply,
auto-claims only for the learner seated on the new side to move, and passes a seat-only
board orientation without changing objective/comparison perspective.

The public join page is server-rendered rather than an `AppRoute`. The already-shipped
story card owns `/shared/:token` outside the authenticated shell; dispatching the join
scope there keeps anonymous loading from booting the application or a run projection.
The page uses the shipped login/register endpoints, then atomically redeems and redirects
into `/live/session/:id`. This is a composition deviation from the RFC's router sentence,
not a behavior reduction. Token mint/revoke journaling was also made transactional so the
token row and its audit entry cannot separate.

Targeted verification: migration/live server tests pass (12 tests); Svelte type checking
reports 0 errors and 0 warnings; `tests/browser/match.spec.ts` passes 2/2 at zero retries,
covering two seated browser contexts, a coach wall, pause/rehearse/resume, and a fresh
single-use friend-link registration with no FEN exposure. Repository-wide gates remain
for lifecycle closeout.

## 2026-08-14 — Implementation tree verification

The completed implementation tree passes `ENGINES_REQUIRED=1 make verify`: 432 tests
across 73 files, Svelte 0/0, schema scaffold and packaging clean. The full zero-retry
browser suite passes 20 tests with the optional Maia latency case skipped. The native
match acceptance accounts for two of those tests and takes 9–11 seconds because it
waits on the real two-second follower contract rather than bypassing it.

## 2026-08-14 — Lifecycle closeout

Canonical behavior is reconciled in `docs/live-sessions.md`,
`docs/identity-and-authorization.md`, and `docs/app-shell.md`. The RFC status is
implemented, migration 14 is registered as implemented, and the RFC and planning job
are archived.

Both required gates were rerun against the post-move tree. `ENGINES_REQUIRED=1 make
verify` passed 432 tests across 73 files with Svelte 0/0 and clean schema scaffold and
packaging checks. `make test-browser` passed 20 tests at zero retries; the optional Maia
latency case was skipped.
