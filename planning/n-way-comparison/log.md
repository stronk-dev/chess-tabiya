# N-way comparison log

## 2026-08-13 — Codex implementation

The pairwise `{a,b}` payload was removed in favour of one branch-keyed result on a single deepest-common-fork axis. Rows carry an exact node-identity partition so shared prefixes render once rather than as false differences. Manual selection supports two through eight branches and drives both comparison and branch-selective PGN export.

The persisted run now records branch origin and prediction events (run schema 0.8, migration 8). Simulation walks authored variations in memory and writes nothing until explicit promotion. Prediction selection and recording share one request, so the client cannot see the opponent reply before its prediction is durable. Deep-analysis jobs accept per-job MultiPV and reset the shared Stockfish process to MultiPV 1 after each request.

Pack schema 0.9 removes prediction grading. The UI renders recorded frequencies and branch consequences without ranking branches or calling a prediction correct.

Verification: `ENGINES_REQUIRED=1 make verify` passed with 304 tests across 51 files; `make test-browser` passed 10 tests at zero retries (optional Maia latency skipped). The first browser run exposed that the N-way rewrite had removed the established fork/evaluation baseline affordance; it was restored in the branch-keyed view before the gate was accepted.
