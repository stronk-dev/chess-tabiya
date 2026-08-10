# Engine workers and opponent selection

The server-side engine layer makes drill runs playable without giving a worker
permission to mutate a run. It consists of a UCI process supervisor, a packaged
Maia-3 opponent, a pure opponent selector, an asynchronous Stockfish evidence
queue, and a capability descriptor. The run remains event-sourced and
single-writer throughout: engines return data; the current lease holder decides
which returned data becomes part of the run.

The implementation lives in `apps/server`; the Maia image lives in
`workers/maia`. The living drill-run wire format is
`schemas/drill_run.schema.json` v0.4.

## UCI supervisor

`EngineSupervisor` owns configured UCI child processes and serializes requests
per engine. For each child it:

- spawns the configured command and captures stdout, stderr, and lifecycle lines;
- completes `uci`/`uciok`, records advertised options and identity, applies
  configured UCI options, and completes an `isready` warmup;
- records engine id and kind, UCI name/version, optional model and container
  identities, and whether a configured seed option was actually advertised;
- provides health checks, bounded transcript inspection, graceful `quit`, and a
  one-second forced-exit bound;
- restarts unexpected exits with capped exponential backoff; and
- accepts an abort signal for searches, sends UCI `stop`, and leaves the child
  available for the next queued request when the engine responds normally.

The default transcript holds 256 lines. Restart delay starts at 250 ms, doubles
to a five-second ceiling, and stops after five attempts; an `EngineSpec` can
override these values.

There is no fallback engine. Missing processes, timeouts, crashes, and unknown
engine IDs raise `ENGINE_UNAVAILABLE` with `engineId` and `retryAfterMs`; REST
maps it to HTTP 503. Unsupported selector modes raise
`POLICY_MODE_UNSUPPORTED`, mapped to 422. Invalid requests are 400, unknown runs
or staged evidence are 404, and lease conflicts remain
`NOT_ACTIVE_WRITER`/409. Errors use structured JSON bodies and are never silently
converted into a different engine or policy.

Real Stockfish tests cover handshake, option application, search, health,
restart, transcript bounds, abort/preemption, identity, and shutdown. A local
machine without Stockfish prints a prominent warning and skips those cases; CI
sets `ENGINES_REQUIRED=1`, so absence fails verification. `SF_CMD` plus the JSON
array `SF_ARGS` can name a non-standard executable.

## Ratified strong-engine profile

`strong_engine` is an opponent policy for maximal resistance, not an analysis
budget. Its shipped v1 profile is:

| Setting | Default |
|---|---:|
| Search limit | 100 ms per move |
| Threads | 1 |
| Hash | 16 MB |
| MultiPV | 1 |

`DEFAULT_STRONG_ENGINE_PROFILE`, `resolveStrongEngineProfile`, and
`stockfishPlaySpec` are the shared configuration surface. The play spec applies
the UCI options; `OpponentSelector` applies the movetime. Deployments may replace
any positive integer value and should pass the same resolved profile to the play
spec, selector, and capability provider. `GET /capabilities` reports the
effective profile under `policyProfiles.strong_engine`.

This profile is deliberately separate from evidence jobs, which choose their
own depth or movetime asynchronously. Every persisted Stockfish evidence payload
records `engineId` and exactly one of `requestedDepth` or
`requestedMovetimeMs`, in addition to the returned score/WDL/line and achieved
depth. The effective judgment budget therefore survives in run provenance.

## Maia-3 sidecar

Maia is Docker-required for v1; there is no supported host-venv fallback. The
Docker image pins:

- Python 3.12.13;
- Maia-3 source commit `1e13597c42d4858b7cfd7cfdae01e297263364b2`;
- python-chess 1.999; and
- the `maia3-5m` checkpoint snapshot
  `b6559de2398d7140b985f28fd2c19fb5e47ddabe`.

The checkpoint is baked into the image, runtime Hugging Face access is disabled,
and the immutable entry point enables `--use-uci-history`. Every request sends
`position fen <start> moves <complete history>`; bare-FEN continuation is not a
supported shortcut. First contact found no UCI seed option, so Maia capabilities
and selections record `seedHonored: false`. Exact retry behavior comes from the
event log and selection cache rather than a false seed guarantee.

Pinned Maia ranks MultiPV candidates but does not normally expose the already
computed move-policy probability. The AGPL-published patch at
`workers/maia/patches/maia3-uci-policy-mass.patch` is checked and applied during
the image build. It adds `policy <mass>` to each UCI info line without changing
chess logic. WDL remains a human-outcome prediction and is never substituted for
move-policy mass. If a future pin loses the patched field, theory selection emits
`DEGRADED_POLICY_MASS` and uses inverse-rank weighting.

The tagged `INTEGRATION=maia` suite remains outside `make verify`. It plays a
20-ply `human_common` continuation after the living Najdorf fixture's first
spine move, checks every returned move for legality, and proves from the bounded
transcript that all 20 requests contain the complete growing history.

## Pure opponent selector and writer seam

`POST /select-move` accepts:

```text
{ startFen, historyUci[], policy, seed }
```

It returns a chosen UCI move, optional ranked candidates and policy masses, and
the exact engine/model identity. It does not read, lease, or append to a run.
The modes currently shipped are:

| Mode | Behavior |
|---|---|
| `human_common` | Maia using optional Elo, temperature, and top-p; temperature defaults to 0.8 and top-p to 0.92. |
| `strong_engine` | Stockfish best move under the ratified, deployment-configurable movetime profile. |
| `theory_strict` | Maia restricted to legal authored spine children while the current four-field `transposeKey` is on the spine. |

`theory_strict` derives every authored spine position, so a move-order deviation
that transposes back resumes spine following. It asks Maia for at least eight
candidates, filters to legal children, and samples proportionally to policy
mass. If eligible mass is zero or no eligible child appears, it samples uniformly
among authored children with the branch seed. A position not found on the spine
uses `human_common`; `authoredBoundary` affects later feedback voice, not
selection.

Selections are cached by `(policyConfigDigest, branchSeed, historyHash)`.
`historyHash` covers the start FEN and every UCI move. Identical drill retries
therefore reuse the same promise/result, while different branch seeds or histories
miss. Failed requests are evicted.

The active run writer commits the returned selection through
`appendOpponentPly` or `POST /runs/:id/moves`. The resulting
`opponent.move_selected` event must be immediately followed by its matching
`move.committed`; read-back replay treats the logged selection as authoritative
and never recomputes it. An opponent service using its own writer identity gets
`NOT_ACTIVE_WRITER`.

## Drill-run v0.3 and v0.4 amendments

The engine layer made two declared amendments to the implemented branch-runtime
wire format:

- v0.3 added `evidence.attached` with `{nodeId, evidenceRefs, payload}`. Payload
  kinds are `eval`, `wdl`, and `bestline`; sources are
  `engine_validated` or `human_model_predicted`. Projection adds unique evidence
  references to the named node without changing objective state.
- v0.4 made `opponent.move_selected.selection` mandatory and typed. It records
  the chosen move, optional ranked candidates with optional policy mass, and
  engine identity (`id`, name/version, optional model/container identifiers,
  and `seedHonored`).

The living schema is v0.4 and includes both amendments. Evidence sources remain
separate events and typed payloads; Stockfish values and Maia predictions are
never averaged into one number.

## Evidence jobs

`EvidenceJobQueue` accepts Stockfish analysis jobs for a node with kind
`eval|wdl|bestline` and exactly one positive depth or movetime limit. It starts
jobs FIFO with a configurable global concurrency bound (default two). Results
are immutable and staged outside the run with a per-run sequence cursor.

The read/apply flow is:

1. Server code submits through `RunService.enqueueEvidence`.
2. A reader polls `GET /runs/:id/evidence?sinceSeq=<n>`.
3. The lease holder applies a selected staged result with
   `POST /runs/:id/evidence` and `{resultSeq}`.
4. The service atomically appends `evidence.attached`, then applies any
   evidence-bearing `ObjectiveEvidenceProposal` as
   `objective.state_changed`, saves the run, and consumes the staged result.

Non-writers may read staged results but cannot apply them. Failed jobs remain
inspectable through the queue failure surface rather than becoming a fallback.
There is currently no public job-submission endpoint or event-stream push; job
submission is a server-service call and result delivery is polling.

The queue implements the runtime `JobObserver`. On rewind it removes queued and
already-staged work for pruned nodes, aborts running work, and checks cancellation
again before staging. A fake executor that deliberately ignores cancellation
proves late results are discarded; a real Stockfish test proves `stop` is sent.

## Capabilities

`GET /capabilities` warms the configured engines and returns:

```text
{
  engines: [{ id, kind, name, version, modelId?, containerDigest?, seedHonored }],
  policyModes: ["human_common", "strong_engine", "theory_strict"],
  policyProfiles: {
    strong_engine: { movetimeMs, threads, hashMb, multiPv }
  },
  runSchemaVersion
}
```

Each engine entry is a strict superset of the `{id, version}` identity stored in
`policyConfig.locus`. Container and model identity are present when deployment
provides them; the reported strong-engine profile is the effective resolved
deployment configuration.

## Measured envelope and limitations

Two complete, uncached 20-ply Maia samples on the local Docker image measured:

| Sample | Median | p95 | Maximum |
|---|---:|---:|---:|
| First | 53.2 ms | 70.8 ms | 89.5 ms |
| Confirmation | 52.6 ms | 119.0 ms | 123.0 ms |

Both are below the 500 ms server-side target. The measurement begins after
supervisor handshake/model warmup and measures an uncached selection request;
sidecar startup is not hidden inside the request latency.

Known limitations:

- rapid back-to-back tagged runs in the managed development shell produced
  three Docker child starts exiting with code 126 between successful runs. No
  selection began in those failures, so they are excluded from latency figures.
  This startup flake is documented, not treated as a latency success; recheck it
  outside the managed shell before release hardening;
- Docker is required for Maia v1. Root Compose packaging, healthchecks, pinned
  GHCR multi-arch images, profiles, and a devcontainer are BACKLOG work for the
  client/vertical-slice era, not part of this implemented foundation;
- Maia does not honor a seed; replay and cache provide retry determinism;
- staged evidence has no durable offline/session-expiry protocol or push channel;
  and
- browser Maia/ONNX, Syzygy and `perfect_tablebase`, policy mixing, corpus
  workers, and additional opponent modes remain follow-up work.
