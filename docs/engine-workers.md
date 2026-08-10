# Engine workers

Engine workers are being implemented behind `apps/server`. The current slice is
the UCI supervisor, the drill-run v0.3 evidence attachment seam, and the packaged
Maia sidecar. Opponent selection, evidence scheduling, and capabilities are not
yet implemented.

## Run evidence amendment

The living `schemas/drill_run.schema.json` is v0.3. Its
`evidence.attached` event carries a node id, one or more evidence references, and
`payload: {kind, source, values}`. Kinds are `eval`, `wdl`, and `bestline`;
sources are kept explicitly distinct as `engine_validated` or
`human_model_predicted`. Projection appends unique references to the named node
without changing its objective state. The event is applied only by the run's
writer; workers do not append to runs.

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
503. `POLICY_MODE_UNSUPPORTED` maps to 422. The latter is defined now for the
accepted selector boundary but no selector route exists yet.

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

## Not implemented yet

The server does not yet expose an opponent selector, append an opponent ply,
schedule evidence jobs, or expose `/capabilities`. In particular, the supervisor
never writes run events; the pure-selector/writer-commit invariant remains the
contract for the later selector slice.
