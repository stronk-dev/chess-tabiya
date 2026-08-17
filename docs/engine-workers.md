# Engine workers and opponent selection

The server-side engine layer makes drill runs playable without giving a worker
permission to mutate a run. It consists of a UCI process supervisor, a packaged
Maia-3 opponent, a pure opponent selector, an asynchronous Stockfish evidence
queue, and a capability descriptor. The run remains event-sourced and
single-writer throughout: engines return data; the current lease holder decides
which returned data becomes part of the run.

The implementation lives in `apps/server`; the Maia image lives in
`workers/maia`. The living drill-run wire format is
`schemas/drill_run.schema.json` v0.15.

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

Real-engine application startup also checks every ready engine's retained UCI
option table against the published capability-disposition register. Coverage is
per instrument: a Stockfish row cannot satisfy a Maia option, and an absent or
empty option table is a startup error rather than vacuous coverage.

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
sets `ENGINES_REQUIRED=1`, so absence fails verification. Stockfish 18 is the
supported contract and the handshake test rejects any other version. CI, the
devcontainer, and the multi-architecture server image use the same official
commit through a checksum-pinned installer; host development can point at a
native Stockfish 18 with `SF_CMD` plus the JSON array `SF_ARGS`.

### Engine request contract

Every engine request closes over the instrument state its answer depends on:

- **state** — every answer-changing option is sent by that request, never inherited;
- **clear** — unwanted accumulated search state is reset by that request;
- **bind** — option-setting, reset, and search occupy one serialized queue entry;
- **bound** — sent values lie inside the deployment-published range or refuse by name;
- **record** — every instrument, stateful or not, persists what it actually applied and what it
  actually returned; for an engine this includes the applied band and the move actually played.

The UCI handshake retains the complete advertised option table, including spin
defaults and ranges. `resetSearchState` sends `ucinewgame`, conditionally sends
the advertised `Clear Hash` button, waits through `readyok`, and only then sends
the search commands inside the same queued task. Stockfish opponent, enumeration,
evidence, and authoring searches state MultiPV explicitly; evidence also states
`UCI_ShowWDL` on every request. Maia states SelfElo and OppoElo at their advertised
defaults before stating the resolved Elo band, because `Elo` is the engine's alias
for that pair and must be the final band-setting command. It then states Temperature,
TopP, and a range-clamped MultiPV on every request. An absent requested Elo uses
and records the engine-advertised default. Published deployment bounds are the
intersection of the advertised range and any explicit `EngineSpec.bandRange`.
The shipped Maia deployment configures `[1000, 2400]`, measured by R10 as the
widest interval whose policy trajectory remains ordered and whose returned
candidate mass remains readable. This is a deployment bound, not a claim that
Maia plays at an exact human rating. Requests outside it receive the named
`TARGET_ELO_OUT_OF_RANGE` refusal before reaching the engine.

Human-common requests widen their candidate window to the smaller of the legal
move count (with a floor of eight) and the advertised MultiPV maximum. If a
sampled `bestmove` remains outside the window after one retry, the played move is
persisted with `offWindow: true` and no invented mass. Ranked/mass consumers and
rendered distributions exclude that marker.

## Ratified strong-engine profile

`strong_engine` is an opponent policy for maximal resistance, not an analysis
budget. Its shipped v1 profile is:

| Setting | Default |
|---|---:|
| Search limit | 50,000 nodes per move |
| Movetime fallback | 100 ms per move |
| Threads | 1 |
| Hash | 16 MB |
| MultiPV | 1 |

`DEFAULT_STRONG_ENGINE_PROFILE`, `resolveStrongEngineProfile`, and
`stockfishPlaySpec` are the shared configuration surface. The play spec applies
the UCI options; `OpponentSelector` applies `go nodes 50000` by default and uses
the movetime only when `nodes` is explicitly `null`. Deployments may replace any
positive integer value and should pass the same resolved profile to the play
spec, selector, and capability provider. Each new selection records the applied
`searchBound`; historical selections omit it and it is never inferred.
`GET /capabilities` reports the effective profile under
`policyProfiles.strong_engine`.

This profile is deliberately separate from evidence jobs, which choose their
own depth or movetime asynchronously. Every persisted Stockfish evidence payload
records `engineId` and exactly one of `requestedDepth` or
`requestedMovetimeMs`, in addition to the returned score/WDL/line and achieved
depth. The effective judgment budget therefore survives in run provenance.

Automatic tablebase evidence is a best-effort producer: it attempts a node once
and only while the evidence queue is idle. A busy queue or failed producer probe
is dropped without becoming an opponent-mode failure; explicit interactive
tablebase requests retain their normal refusals.

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
It also repeats one identical request twenty times and reports whether the
returned policy vectors are byte-identical. The 2026-08-15 probe observed 20 of
20 byte-identical vectors at target Elo 1800. Practical resistance remains
deterministic by its persisted selection record regardless of that observation.

## Pure opponent selector and writer seam

`POST /select-move` accepts:

```text
{ startFen, historyUci[], policy, seed }
```

It returns a chosen UCI move, optional ranked candidates and policy masses, and
the exact engine/model identity. Candidate rows may also carry the score and WDL
already emitted by the engine; they are measurements, never move grades. It does
not read, lease, or append to a run.
The modes currently shipped are:

| Mode | Behavior |
|---|---|
| `human_common` | Maia using optional Elo, temperature, and top-p; temperature defaults to 0.8 and top-p to 0.92. |
| `strong_engine` | Stockfish best move under the ratified, deployment-configurable movetime profile. |
| `theory_strict` | Maia restricted to legal authored spine children while the current four-field `transposeKey` is on the spine. |
| `perfect_tablebase` | A category-preserving Syzygy reply. Won/lost roots retain DTZ ordering; residual ties and drawn roots use a position-pure neutral digest order. |
| `practical_resistance` | Among at most four category-preserving tablebase replies, choose the reply that leaves the greatest measured Maia policy mass on learner moves that concede the result. Refuse when the measurement is vacuous. |

`theory_strict` derives every authored spine position, so a move-order deviation
that transposes back resumes spine following. It asks Maia for at least eight
candidates, filters to legal children, and samples proportionally to policy
mass. If eligible mass is zero or no eligible child appears, it samples uniformly
among authored children with the branch seed. A position not found on the spine
uses `human_common`; `authoredBoundary` affects later feedback voice, not
selection.

Selections are cached by `(policyConfigDigest, packId, branchSeed, historyHash)`.
Every request builder supplies the run's `sessionDigest` as `policyConfigDigest`; pack bytes are
an input to pack-session identity, not a second policy identity.
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
  kinds now include `eval`, `wdl`, `bestline`, and exact tablebase measurements;
  sources include `engine_validated`, `human_model_predicted`, and
  `tablebase_exact`. Projection adds unique evidence
  references to the named node without changing objective state.
- v0.4 made `opponent.move_selected.selection` mandatory and typed. It records
  the chosen move, optional ranked candidates with optional policy mass, and
  engine identity (`id`, name/version, optional model/container identifiers,
  and `seedHonored`).

The living schema is now v0.17; it retains both engine amendments, the v0.5
session identity/reveal contract, the v0.6 terminal outcome contract, and the
recorded applied-policy field documented in `docs/branch-runtime.md`. New strong
engine selections also retain their applied search bound. Perfect-tablebase selections
alone record `orderingBasis` as `dtz_ascending`, `dtz_descending`, or `none`; migration 23
stamps historical v0.16 runs without inferring that optional fact.
Candidate records may retain exact centipawn and WDL measurements. UCI
`upperbound` and `lowerbound` lines are not recorded as exact measurements, and
public run/event projections remove both fields until feedback disclosure opens;
the selected move and non-evaluation candidate data remain available so play is
not stalled by the evidence barrier.
Evidence sources remain
separate events and typed payloads; Stockfish values and Maia predictions are
never averaged into one number.

## Evidence jobs

`EvidenceJobQueue` accepts Stockfish analysis jobs for a node with kind
`eval|wdl|bestline` and exactly one positive depth or movetime limit. It starts
jobs FIFO with a configurable global concurrency bound (default two). Results
are immutable and staged outside the run with a per-run sequence cursor.
Failures retain their evidence kind as well as run and node identity. Story
completion treats only failed `eval` jobs as failed evals; a tablebase failure
cannot suppress or falsely complete the Stockfish pass for the same node.

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

`GET /capabilities` warms the configured engines and returns only modes whose required provider
is currently executable: Maia for `human_common`/`theory_strict`, the judge for
`strong_engine`, tablebase for `perfect_tablebase`, and both Maia and tablebase for
`practical_resistance`. An empty `FixtureTablebaseSource` is treated as provider
absence rather than as an executable mock. It has the following shape when every provider is ready:

```text
{
  engines: [{ id, kind, name, version, modelId?, containerDigest?, seedHonored, eloHonored? }],
  policyModes: ["human_common", "strong_engine", "theory_strict", "perfect_tablebase", "practical_resistance"],
  policyProfiles: {
    strong_engine: { nodes, movetimeMs, threads, hashMb, multiPv },
    human_common: {
      elo,
      resistance: { basis: "measured", metric: "dtz_percentile", scope, corpus, bands,
                    bandConditioned, dtzPercentile, slowestLosingRate, fastestLosingRate }
    }
  },
  costBasis,
  capabilityDispositions,
  runSchemaVersion
}
```

Each engine entry is a strict superset of the `{id, version}` identity stored in
`policyConfig.locus`. Container and model identity are present when deployment
provides them; the reported strong-engine profile is the effective resolved
deployment configuration.

Maia's configured `Elo` option is checked against the live UCI handshake. The
selector sends a requested rating band only when the option was advertised.
Selections then persist `eloHonored` and, only when the command was sent,
`eloApplied`; requested and applied bands remain separate facts in the client.

Engine version prefers an explicitly pinned `spec.version`. Otherwise, when
the advertised UCI name agrees with the configured name, the remainder of the
advertised `id name` line becomes the version. An advertised-name mismatch is
recorded in the supervisor transcript and yields `unknown`; it is never silently
attributed to the configured engine.

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
- browser Maia/ONNX, local Syzygy files, policy mixing, corpus
  workers, and additional opponent modes remain follow-up work.

`perfect_tablebase` itself is implemented through the hosted Lichess standard-tablebase
provider. It is deterministic, capability-published, and records its applied policy and
synthetic provider identity. It never falls back to Stockfish or Maia on outage or above
the seven-piece boundary; see `tablebase-grounding.md`.

The capability payload publishes Maia's measured resistance only at mode scope. It names
the 15-position/270-probe corpus and its measured DTZ-percentile and slowest/fastest-losing
rates; no selection or candidate is assigned a resistance score. The capability-disposition
register marks band-conditioned resistance refused and resistance above seven pieces
unmeasured with its named follow-up experiment.

`practical_resistance` composes that tablebase gate with Maia policy mass. It
never weakens Stockfish and never falls back under the same name. The selector
refuses out-of-range roots, unavailable instruments, missing preserving replies,
the all-zero difficulty case, and materially invalid policy distributions by
typed code. Maia's policy values are float32. The measured maximum excess is
9.25e-8, so the runtime admits one float32 ulp at 1.0 (about 1.19e-7, 1.29x
headroom) and refuses larger excess as
`PRACTICAL_RESISTANCE_POLICY_MASS_INVALID`. A provenance-bearing captured vector
exercises the valid side near the boundary; a minimal clone mutation exercises
the refusal side. Missing
Maia policy mass is an abstention: the recorded reply uses the stable UCI
tiebreak and emits the existing degradation warning. A cold four-candidate
selection can take roughly 580 ms; that is its declared per-selection budget,
distinct from the per-instrument call budget.

## Recorded policy and server-owned theory spine

Every selection now records `policyModeApplied`. The concrete human-common,
strong-engine, and on-spine theory paths stamp their own mode; a
`theory_strict` request that has no authored reply falls through the
human-common implementation and therefore records `human_common`, never the
requested mode.

Clients no longer submit a free-form spine. `/select-move` accepts `packId`, and
the server resolves the registered pack's validated spine before selection.
The cache key is `(policyConfigDigest, packId, branchSeed, historyHash)`, so two
packs cannot reuse a selection computed against different authored replies.
For Line Drills, `plyHorizon` governs authored support while the position-keyed
spine governs available theory replies; those boundaries can differ.

## Branch-group enumeration

The selector exposes strong-engine enumeration for branch-group seeding. A
request temporarily sets MultiPV to the requested two through eight lines,
waits through `bestmove`, and relies on no later restore: every subsequent
strong-engine request states its own configured width. The recorded distribution identifies the strong engine and
each machine-seeded move records `policyModeApplied: enumerated`; enumeration
is not misreported as an opponent-policy sample.

Group replies are selected through a server-owned endpoint. Fixed resistance
first searches the group's durable opponent-selection journal for a compatible
selection at the same transpose key and live engine identity. This supplies a
real same-position reuse guarantee despite Maia's `seedHonored: false` rather
than claiming deterministic sampling the sidecar cannot provide. See
`branch-groups.md` for the full contract.
