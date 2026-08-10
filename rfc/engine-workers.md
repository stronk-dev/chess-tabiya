# RFC: Engine Workers & Opponent Service

- **Status:** draft
- **Author:** claude (for Marco)
- **Created:** 2026-08-12
- **Design refs:** `design/01-training-model.md` (episode, resistance), `archive/brief-v2/08_ENGINE_CORPUS_AND_CONTENT.md` (responsibility table, policy modes)
- **Exploration gate:** Q5 settled-go by validation-in-use (Maia smoke, exploration log 2026-08-12)
- **Depends on:** `docs/branch-runtime.md` (implemented runtime: JobObserver, evidenceRefs, policyConfig locus, ObjectiveEvidenceUpgrader), `docs/drill-pack-format.md` (opponentPolicy, evidenceTypes)
- **Parent / amends:** mines `archive/brief-v2/rfcs/RFC-0003-opponent-policy.md` sketch; hosts the analysis-cancellation invariant relocated from branch-runtime (BR-C6)
- **Supersedes / superseded by:** —
- **Planning:** `planning/engine-workers/` (once implementing)

## Summary

The layer that makes the runtime playable: UCI engine workers (Stockfish judge,
Maia-3 opponent sidecar), the opponent move service that binds a pack's
`opponentPolicy` to an engine, an async evidence job queue with
rewind-cancellation, and the capability descriptor the hybrid execution model
negotiates against. Stockfish judges; Maia plays; neither pretends to be the other.

## Motivation

Both foundation RFCs are implemented; runs currently need a mock opponent. The
Maia smoke validated the opponent approach (plan-coherent with history
conditioning; weakened-SF control confirmed as the anti-pattern). Out of scope:
browser-side engine execution (client RFC), Syzygy tablebase adapter and the
`perfect_tablebase` / `practical_resistance` / `plan_defense` / `human_external`
policy modes (follow-up RFCs), feedback composition, corpus.

## Specification

### Worker topology

`apps/server` hosts an **engine supervisor** managing UCI child processes:

- **Stockfish** — the system binary, one process per configured slot
  (default 1 play + 1 analysis).
- **Maia-3 sidecar** — the containerized image (promoted from
  `tools/maia-harness` lineage into `workers/maia/`): `maia3-uci --model 5m
  --use-uci-history`, checkpoint prebaked, `/usr/games/stockfish` not included
  (separate concern). **History conditioning is mandatory** — every opponent
  request sends the full move history (`position fen <start> moves ...`), never
  a bare FEN. This is the validated coherence ingredient (Q5).

Supervisor responsibilities: spawn, UCI handshake + `isready` warmup, option
configuration, health check (respond-to-`isready` timeout), restart with
backoff, graceful shutdown. Engine identity (name, version string, model id,
container digest) is captured at spawn and exposed in the capability
descriptor; runs record it in `policyConfig` (locus + versions — the
determinism scope from branch-runtime).

### Opponent move service

Binds `opponentPolicy.mode` (pack format v0.2) to an engine, for the modes in
scope:

| Mode | Engine | Behavior |
|---|---|---|
| `human_common` | Maia | sample with pack's `targetElo`/`Temperature`/`TopP` (UCI options `Elo`, `Temperature`, `TopP`) |
| `strong_engine` | Stockfish | movetime-limited best move |
| `theory_strict` | spine + Maia | follow the pack spine while the position is on it (choosing among spine children by Maia probability); Maia takeover past the authored boundary |

Contract with the runtime (the strict-adjacency constraint from branch-runtime
review): the service appends `opponent.move_selected` (with engine identity,
sampled candidates when available, and the chosen move) **immediately followed
by** the `commitMove` that produces the matching `move.committed`. Replay reads
these back; live recomputation never happens during replay.

**Seeding:** if the Maia UCI surface exposes no seed option (expected — verify
at first contact), sampled moves are non-reproducible at the source; that is
acceptable because the event log is authoritative (read-back replay). The
runtime's per-locus determinism invariant is then scoped to engines that honor
seeds; `policyConfig` records `seedHonored: false` for Maia. This is a
documented narrowing, not a violation — the log, not re-execution, is the
replay contract.

### Evidence job queue (hosts the relocated BR-C6 invariant)

Async Stockfish analysis jobs attach evidence to nodes: `{nodeId, kind:
eval|wdl|bestline, depth|movetime}` → on completion, append
`feedback.generated`-adjacent evidence (an `objective.state_changed` upgrade
goes through the runtime's `ObjectiveEvidenceUpgrader` binding, with
`evidenceRefs` naming the job output). Queue rules:

1. FIFO per run, bounded concurrency (default 1 analysis engine).
2. **Rewind cancels stale jobs**: the supervisor registers a `JobObserver`;
   `onRewound(prunedNodeIds)` cancels queued and preempts running jobs whose
   node is no longer on the active path. Property-tested with fake jobs
   (existing hook) plus one integration test with the real queue.
3. Job results for cancelled jobs are discarded, never appended.

**Evidence typing discipline** (ADR-0005 adjacent, schema-enforced): Stockfish
output → `engine_validated`; Maia candidate distributions / WDL →
`human_model_predicted` (maia3's own docs: its WDL is a human-outcome
prediction, not an engine eval). The two are never merged into one number.

### Capability descriptor

`GET /capabilities` returns `{ engines: [{id, kind: judge|opponent, name,
version, modelId?, containerDigest?, seedHonored}], policyModes: [...] }`.
The hybrid execution model (browser enhancements, client RFC later) negotiates
against this; for this RFC it is server-truth only.

### Latency targets

Cached opponent move: perceived-instant (cache keyed on `(packDigest, nodeId,
policyConfig)`). Uncached Maia move: <500 ms on the host (measure; the smoke
suggests comfortable margin). Analysis jobs: async only, never block a move.

## Deviations from design

The archive sketch (RFC-0003) proposed a policy-mixer (corpus + Maia + plan
compatibility). Deliberately not built: the Maia smoke showed history
conditioning suffices for v1 coherence. The mixer stays a BACKLOG fallback,
revived only if drill play contradicts the smoke.

## Acceptance criteria

- Supervisor: spawn/handshake/restart tests against the real Stockfish binary
  (CI installs stockfish; skip-with-failure-note if absent locally).
- Maia sidecar: tagged integration test (not in default CI): from a pack spine
  position, `human_common` plays a 20-ply continuation; every opponent move
  arrives as `opponent.move_selected` + adjacent `move.committed`; history
  conditioning verified by inspecting the UCI transcript (`position ... moves`).
- `theory_strict`: on-spine positions always play spine children; off-spine
  falls through to Maia.
- Cancellation: rewind mid-analysis cancels the queued job; its late result is
  provably discarded.
- Evidence typing: a Stockfish job and a Maia distribution attach with the
  correct `evidenceTypes`; a test asserts they are never coalesced.
- Latency: uncached Maia move measured and recorded in planning log.

## Open questions

- Maia seed exposure — resolve at first contact; sets `seedHonored`.
- Stockfish strength profile for `strong_engine` in drills (movetime vs depth
  vs skill caps) — proposal in planning, owner ratifies with the storage-style
  one-liner.
- Container runtime assumption (Docker present on self-host) — document as a
  requirement or provide a bare-venv fallback path; decide in planning.

## Changelog

- 2026-08-12: created; scoped to judge+opponent+jobs+capabilities, mixer
  explicitly deferred on Q5 evidence.
