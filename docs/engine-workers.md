# Engine workers

Engine workers are being implemented behind `apps/server`. The current slice is
the UCI supervisor, drill-run v0.4 worker amendments, the packaged Maia sidecar,
and the pure opponent selector. Evidence scheduling and capabilities are not yet
implemented.

## Run evidence amendment

The living `schemas/drill_run.schema.json` is v0.4. Its v0.3
`evidence.attached` event carries a node id, one or more evidence references, and
`payload: {kind, source, values}`. Kinds are `eval`, `wdl`, and `bestline`;
sources are kept explicitly distinct as `engine_validated` or
`human_model_predicted`. Projection appends unique references to the named node
without changing its objective state. The event is applied only by the run's
writer; workers do not append to runs.

The v0.4 amendment makes `opponent.move_selected.selection` typed. It carries
the selected UCI move, optional ranked candidates with optional Maia policy
mass, and engine identity (`id`, name/version, optional model/container ids, and
`seedHonored`). `appendOpponentPly` is the writer-side runtime helper: it appends
the selection and matching opponent move as a strict adjacent pair.

## UCI supervisor

`EngineSupervisor` owns configured UCI child processes. For each engine it:

- spawns the configured executable and arguments;
- completes `uci`/`uciok`, captures advertised options and identity, applies
  configured `setoption` values, then completes an `isready` warmup;
- serializes requests per engine and exposes `checkHealth` using `isready`;
- retains a bounded transcript of sent, received, stderr, and lifecycle lines;
- restarts unexpected exits with capped exponential backoff;
- sends `quit` for graceful shutdown, with a one-second forced-exit bound.

The default transcript capacity is 256 lines. Default restart delays begin at
250 ms, double to a maximum of 5 seconds, and stop after five attempts. Specs can
override these values. Identity records engine id/kind, UCI name/version, optional
model/container identifiers, and whether a declared seed option was actually
advertised by the engine.

There is no fallback engine. Spawn failure, timeout, crash, or unknown engine id
raises `ENGINE_UNAVAILABLE` with `engineId` and `retryAfterMs`; HTTP maps it to
503. `POLICY_MODE_UNSUPPORTED` maps to 422 for a selector mode outside this RFC.

The default verification suite exercises handshake, options, search, health,
restart, transcript bounds, identity, shutdown, and both error mappings against
a real Stockfish process. CI installs the Stockfish system package and sets
`ENGINES_REQUIRED=1`, so absence fails the gate. A local machine without the
binary prints a prominent warning and skips only the real-engine cases; it may set
`SF_CMD` and JSON-array `SF_ARGS` when the executable is not in a standard path.

## Maia sidecar

`workers/maia` promotes the validated harness lineage into a production UCI
image. It pins Python 3.12.13, Maia-3 source commit
`1e13597c42d4858b7cfd7cfdae01e297263364b2`, python-chess 1.999, and the
`maia3-5m` checkpoint snapshot
`b6559de2398d7140b985f28fd2c19fb5e47ddabe`. The checkpoint is pre-baked and
runtime Hugging Face access is disabled. Its entry point always enables
`--use-uci-history`.

`maiaDockerSpec` supplies the supervisor command and pinned model/source identity;
deployment supplies the inspected container digest. First contact found no UCI
seed option, so the resulting identity records `seedHonored: false`. The UCI
surface does advertise `Elo`, `SelfElo`, `OppoElo`, `Temperature`, `TopP`, and
`MultiPV`.

The image applies the repository-carried
`workers/maia/patches/maia3-uci-policy-mass.patch` against that exact commit
before installation. Each MultiPV line therefore exposes the already-computed
Maia move-policy scalar as `policy <mass>` alongside, but never conflated with,
WDL. The tagged `INTEGRATION=maia` test verifies this field over the real UCI
sidecar and remains outside `make verify`.

## Opponent selector

`POST /select-move` accepts a start FEN, complete UCI history, policy, and branch
seed, and returns a selection without touching a run. `human_common` sends pack
Elo/temperature/top-p knobs to Maia (defaults 0.8/0.92); `strong_engine` asks
Stockfish for a movetime-limited best move. `theory_strict` derives all authored
spine positions, recognizes current membership by four-field `transposeKey`,
requests at least eight Maia candidates, restricts to legal spine children, and
samples proportionally to patched policy mass. No/zero eligible mass falls back
to seeded uniform spine sampling; an off-spine position uses `human_common`.
If a future pinned Maia build returns ranked candidates but omits the patched
field, the selector warns with `DEGRADED_POLICY_MASS` and uses inverse-rank
sampling instead of pretending WDL is policy probability.

Selections are cached by `(policyConfigDigest, branchSeed, historyHash)`, where
the history hash includes the start FEN and complete move sequence. Identical
drill retries therefore reuse the exact result while per-branch seeds separate
branches. Failed engine requests are evicted rather than cached.

The selector cannot acquire or bypass a run lease. The active writer posts its
returned selection to `/runs/:id/moves`; any server-side attempt under another
writer id receives `NOT_ACTIVE_WRITER`.

## Not implemented yet

The server does not yet schedule evidence jobs or expose `/capabilities`. The
supervisor and selector never write run events; only the leased writer applies
the existing evidence and opponent-selection event contracts.
