# RFC: Engine Workers & Opponent Service

- **Status:** implementing
- **Author:** claude (for Marco)
- **Created:** 2026-08-12
- **Design refs:** `design/01-training-model.md` (episode, resistance), `archive/brief-v2/08_ENGINE_CORPUS_AND_CONTENT.md` (responsibility table, policy modes)
- **Exploration gate:** Q5 settled-go by validation-in-use (Maia smoke, exploration log 2026-08-12)
- **Depends on:** `docs/branch-runtime.md`, `docs/drill-pack-format.md`
- **Parent / amends:** `rfc/archive/branch-runtime.md` — **amends the run schema to v0.3: adds the `evidence.attached` event** (EW-C2 resolution); also mines `archive/brief-v2/rfcs/RFC-0003` and hosts the relocated BR-C6 cancellation invariant
- **Supersedes / superseded by:** —
- **Planning:** `planning/engine-workers/`

## Summary

The layer that makes the runtime playable: UCI engine workers (Stockfish judge,
Maia-3 opponent sidecar), a **pure opponent selector** the run's writer consults,
an async evidence job queue with rewind-cancellation, and the capability
descriptor for the hybrid model. Stockfish judges; Maia plays; the writer —
and only the writer — appends.

## Motivation

Both foundation RFCs are implemented; runs need a real opponent. The Maia smoke
validated the approach. Out of scope: browser-side engines (client RFC), Syzygy
adapter and the `plan_defense`/`practical_resistance`/`perfect_tablebase`/
`human_external` modes (follow-ups), feedback composition, corpus.

## Specification

### Worker topology

`apps/server` hosts an **engine supervisor** (TypeScript — see Deviations)
managing UCI children:

- **Stockfish** — system binary; default 1 play + 1 analysis slot.
- **Maia-3 sidecar** — containerized image promoted to `workers/maia/`
  (`maia3-uci --model 5m --use-uci-history`, checkpoint prebaked). **History
  conditioning mandatory**: every request sends full move history
  (`position fen <start> moves …`), never bare FEN.

Supervisor: spawn, handshake + `isready` warmup, option config, health checks,
restart with backoff (parameters in planning), graceful shutdown, and a
**bounded UCI transcript ring buffer** per engine (debug + the acceptance
tests' inspection surface). Engine identity (name, version, model id, container
digest, `seedHonored`) is captured at spawn, exposed via capabilities, and
recorded in `policyConfig`.

**Failure contract (EW-C5):** engine down or crashed mid-request → typed
`ENGINE_UNAVAILABLE` (engine id, retryAfter hint). **Never a silent fallback
engine** — that would mutate the run's engine identity mid-stream. A request
naming an out-of-scope policy mode → `POLICY_MODE_UNSUPPORTED`. Both join the
HTTP error mapping (503 / 422).

### Opponent selector (EW-C1 resolution: selection ≠ commitment)

The service is a **pure selector**: `POST /select-move` with `{startFen,
historyUci[], policy, seed}` → `{moveUci, candidates?, engineIdentity}`. It
appends **nothing**. The run's **writer** (whoever holds the lease — under the
hybrid model, normally the client runtime) then appends
`opponent.move_selected` (embedding the selection + engine identity) followed
immediately by `commitMove` — preserving both the single-writer invariant and
the strict-adjacency replay contract, which are the writer's obligations.

Modes in scope (pack schema fields `targetElo`/`temperature`/`topP` map to UCI
options `Elo`/`Temperature`/`TopP`; product defaults when absent: 0.8 / 0.92 —
EW-C7):

| Mode | Engine | Behavior |
|---|---|---|
| `human_common` | Maia | sample per pack settings |
| `strong_engine` | Stockfish | movetime-limited best move |
| `theory_strict` | spine + Maia | see below |

**`theory_strict` mechanism (EW-C3):** "on the spine" is decided by
`transposeKey` — an off-spine excursion that transposes back onto a spine
position resumes spine-following. While on-spine: query Maia with
`MultiPV = max(8, spine children)`, read the info-line candidate probabilities,
restrict to legal spine children, sample among them proportionally; if **no**
spine child appears in the MultiPV output, sample uniformly among spine
children with the branch seed. Off-spine (whether past `authoredBoundary` or
simply deviated before it): plain `human_common` behavior. The boundary
affects *feedback voice* (pack format), not move selection.

**Seeding:** if Maia exposes no seed option (verify at first contact),
`seedHonored: false` is recorded; reproducibility comes from the event log
(read-back replay) and from the selection cache below — a documented narrowing
of the per-locus determinism invariant, not a violation.

**Selection cache (EW-C4):** keyed on `(policyConfigDigest, branchSeed,
historyHash)` where `historyHash` covers the full UCI history from the run
start. This makes retries of the same line hit the cache — so `seedMode:
fixed`/`per_run` retries meet the *same* opponent replies (the designed
semantics), while `per_branch` varies via the seed in the key. Cross-run hits
occur for identical histories of the same pack, which is exactly the drill
retry case. Position-only caching is wrong under history conditioning and is
not used.

### Evidence job queue (hosts BR-C6; amends run schema — EW-C2)

Jobs: `{nodeId, kind: eval|wdl|bestline, depth|movetime}` against the analysis
Stockfish. Output path, respecting single-writer:

1. Completed results are staged server-side and exposed at
   `GET /runs/:id/evidence?sinceSeq` (and pushed alongside `events`).
2. **The writer appends** the new **`evidence.attached`** event
   (`{nodeId, evidenceRefs, payload: {kind, source, values}}`) — added to the
   run schema as **v0.3** by this RFC; the projection appends to the node's
   `evidenceRefs`. Objective upgrades ride the existing
   `ObjectiveEvidenceUpgrader` proposal path, also applied by the writer via
   `objective.state_changed`.
3. Queue rules: FIFO per run, bounded concurrency; `JobObserver.onRewound`
   cancels queued and preempts running jobs off the active path; cancelled
   results are discarded and never staged. If the writer disconnects, pending
   staged evidence expires with the session (v1: no offline evidence apply).

**Evidence typing discipline:** Stockfish → `engine_validated`; Maia
distributions/WDL → `human_model_predicted` (per maia3's own docs, its WDL is
a human-outcome prediction). Never coalesced into one number; a test asserts it.

### Capability descriptor

`GET /capabilities` → `{engines: [{id, kind: judge|opponent, name, version,
modelId?, containerDigest?, seedHonored}], policyModes: [...], runSchemaVersion}`.
Shape is a superset of `policyConfig.locus`'s per-engine entries so recorded
locus == a capabilities subset.

### Latency targets

Cached selection: perceived-instant. Uncached Maia: <500 ms server-side
(measure). Analysis jobs async only.

## Deviations from design

1. **No policy-mixer** (archive RFC-0003): history conditioning sufficed in the
   Q5 smoke; mixer stays a BACKLOG fallback.
2. **Supervisor is TypeScript, no Go in this RFC** (doctrine check, EW-C6):
   engine orchestration is core-adjacent server work, not a self-contained
   data-format worker — the stack memo assigns it to TS explicitly. Go's
   assigned territory (corpus pipeline) is untouched by this RFC.
3. **Python inside the Maia container is upstream maia3 code, packaged, not
   authored** — covered by the owner's standing sidecar ruling ("containerized
   sidecar now, ONNX later"); the research-only phrasing on the harness
   container is superseded by that ruling for this production packaging.

## Acceptance criteria

- Supervisor: spawn/handshake/restart/transcript tests against real Stockfish.
  Absent binary: tests SKIP with a prominent warning locally; CI sets
  `ENGINES_REQUIRED=1`, making absence a failure there. (Amended in review:
  fail-loud-locally turned `make verify` red on binary-less dev machines,
  breaking the gate for agent sessions.)
- Maia integration (tag `INTEGRATION=maia`, requires Docker, run manually and
  in an optional non-default CI job — not in `make verify`): 20-ply
  `human_common` continuation from a pack spine; history conditioning proven
  by transcript inspection (`position … moves …` on every request).
- `theory_strict`: on-spine plays spine children (incl. a transposition-back
  case via transposeKey); off-spine falls to human_common; zero-mass fallback
  exercised with a stubbed MultiPV response.
- EW-C1 seam: a full opponent ply through the REST surface — select → writer
  appends selection+commit — replays cleanly; a direct server-side append
  attempt gets `NOT_ACTIVE_WRITER` (regression-pinning the invariant).
- Cancellation: rewind mid-analysis cancels; late results provably discarded.
- `evidence.attached`: schema v0.3 validates it; projection appends
  evidenceRefs; typing test (engine_validated vs human_model_predicted never
  merged).
- `ENGINE_UNAVAILABLE` / `POLICY_MODE_UNSUPPORTED` mapped and tested.
- Uncached Maia latency measured, recorded in planning log.

## Open questions

- Maia seed exposure — first contact sets `seedHonored`.
- `strong_engine` strength profile (movetime vs depth) — planning proposal,
  owner one-liner.
- Docker-required vs bare-venv fallback for self-hosters — planning proposal.

## Acceptance review blockers (2026-08-12 — EW-C1..EW-C8) — RESOLVED

All eight resolved in this revision: C1 → pure selector + writer-commits;
C2 → `evidence.attached` event via declared v0.3 amendment of the archived
parent + writer-applies path; C3 → transposeKey spine-membership + MultiPV
mechanism + zero-mass fallback + boundary clarified as feedback-only;
C4 → (policyConfigDigest, branchSeed, historyHash) cache key with retry
semantics; C5 → typed ENGINE_UNAVAILABLE/POLICY_MODE_UNSUPPORTED, no silent
fallback; C6 → Deviations 2–3 (TS supervisor per stack memo; upstream Python
under standing sidecar ruling); C7 → field/option mapping + defaults;
C8 → concrete tag/CI story + transcript buffer in spec. Original texts: git
history (commit 74debed review landing).

## Changelog

- 2026-08-12: created; mixer deferred on Q5 evidence.
- 2026-08-12: adversarial review EW-C1..C8; all resolved (no owner rulings
  required — resolutions follow prior rulings); **status → accepted**.
- 2026-08-12: §2 review amendment — engine tests skip-with-warning locally,
  ENGINES_REQUIRED=1 enforces in CI.
- 2026-08-12: §1 run-schema v0.3 amendment implementation started;
  **status → implementing**.
- 2026-08-12: §1 evidence attachment and §2 Stockfish-backed UCI supervisor
  implemented; selector, Maia packaging, and evidence queue remain open.
