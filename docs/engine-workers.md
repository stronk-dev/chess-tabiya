# Engine workers

Engine workers are being implemented behind `apps/server`. The current slice is
the UCI supervisor and the drill-run v0.3 evidence attachment seam. Opponent
selection, Maia packaging, evidence scheduling, and capabilities are not yet
implemented.

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
a real Stockfish process. CI installs the Stockfish system package. Local runs
may set `SF_CMD` and JSON-array `SF_ARGS` when the executable is not in a standard
path.

## Not implemented yet

The supervisor does not yet package or drive Maia, expose an opponent selector,
append an opponent ply, schedule evidence jobs, or expose `/capabilities`. In
particular, it never writes run events; the pure-selector/writer-commit invariant
remains the contract for the later selector slice.
