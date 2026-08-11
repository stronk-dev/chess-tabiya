# RFC: Evidence Composer (server)

- **Status:** draft
- **Author:** claude (for Marco)
- **Created:** 2026-08-11
- **Design refs:** `design/01-training-model.md` (feedback timing, mistake classes), `design/03-product-breadth.md` B4, `design/00-thesis.md` §The hard truth
- **Exploration gate:** breadth program #2 (reordered by evidence 2026-08-11); answers the walkthrough's finding
- **Depends on:** `docs/engine-workers.md` (evidence queue, typing discipline), `docs/branch-runtime.md` (compare payload, objective machine), `docs/drill-pack-format.md` (feedbackClaims, timing windows, authoredBoundary)
- **Parent / amends:** mines `archive/brief-v2/rfcs/RFC-0006-feedback-evidence.md` + `archive/brief-v2/schemas/feedback_packet.schema.json`
- **Supersedes / superseded by:** —
- **Planning:** `planning/evidence-composer/` (once implementing)

## Summary

The server-side layer that turns a run into **explained consequence**: a
validated feedback packet per checkpoint/segment/comparison, assembled from
authored claims plus engine, human-model, tablebase, and derived-feature
evidence — with timing events (the "one slow move" mechanism), strict claim
validation, and an honest degradation contract off the authored spine.

This is the layer the first walkthrough found missing: *branch comparison shows
difference without explaining consequence*. K4 and K6 are decided here.

## Motivation

Everything needed to explain now exists — objective states with evidence refs,
the Stockfish evidence queue, Maia candidate distributions, pack-authored claims
and timing windows, the compare payload — but nothing **assembles** them into a
statement about *why* a branch went the way it did. Out of scope: all UI
(program #2b, `explanation-surface`), the LLM renderer (same), corpus mining
(later), content authoring.

## Specification

### The feedback packet (living schema v0.1)

Promote `archive/brief-v2/schemas/feedback_packet.schema.json` to
`schemas/feedback_packet.schema.json`, required
`{runId, branches, objectiveComparison, claims}` plus optional
`stockfish, humanModel, corpus, features, timingEvents`. Amendments:

1. **`scope`** (new, required): `{kind: "checkpoint"|"segment"|"comparison",
   nodeId?|segmentRef?|branchPair?}` — a packet always states what it explains.
2. **`provenanceMode`** (new, required): `authored | mixed | instruments_only`
   — the degradation contract, below.
3. Every `claims[]` entry keeps `evidenceRefs` + `uncertainty` and gains
   `sourceKind` ∈ the pack's `evidenceTypes` enum.

### Composition rules (fail closed)

- **A claim without at least one resolving evidence ref is dropped, not
  rendered.** Composition logs the drop; it never emits an unsupported claim
  (ADR-0005's structural enforcement, not a prompt instruction).
- Evidence typing is never merged: Stockfish → `engine_validated`, Maia →
  `human_model_predicted`, Syzygy → `tablebase_exact`, corpus →
  `corpus_observed`, extractor → `derived_feature`, pack author →
  `author_principle`, anything else → `hypothesis` (and `hypothesis` claims are
  marked, never stated as fact).
- Authored claims are **selected**, not generated: a pack claim enters the
  packet when its trigger conditions hold on the node/segment in scope.

### Timing events (the sharpest mechanism)

From the pack's frozen window vocabulary (`windowOpens`/`windowCloses`/
`luxuryMoveBudget`), the composer emits per branch:
`{windowId, openedAtPly, closedAtPly?, playerReadyAtPly?, opponentArrivedAtPly?,
luxuryMovesSpent, verdict: "in_time"|"one_tempo_short"|"missed"|"n/a"}`.

This is what makes "your rook move was not a blunder — it consumed the only
spare tempo, and the attack arrived one ply earlier" mechanically derivable
rather than prose invention. Comparison packets align timing events across
branches by relative ply from the fork.

### Deterministic feature extractor (smallest useful set — Q4b)

v1 features only, each cheap and unambiguous: pawn-structure signature
(per-file counts + islands + passers), central tension present/released,
piece-development completion ply, king-safety proxy (pawn shield intactness +
open files toward the king), rook activity (open/semi-open file, rank-7),
material balance, queen-exchange occurred. Each feature emits a value plus the
ply it changed, so comparisons can say *when* the branches diverged
structurally. Deliberately excluded: anything requiring judgment (initiative,
"good bishop") — those are authored claims or nothing.

### Degradation contract (the honesty rule)

`provenanceMode` is computed against the pack's `authoredBoundary`:

- **`authored`** — in scope of the boundary; authored claims available.
- **`mixed`** — partially off-spine (e.g. transposed back, or beyond ply
  horizon but matching a structure signature).
- **`instruments_only`** — off the authored boundary: **no authored claims are
  emitted at all**, only engine/tablebase/feature/corpus evidence. The composer
  must not extrapolate authored intent into unauthored territory; the UI
  renders this mode distinctly (program #2b).

### API

`GET /runs/:id/feedback?scope=checkpoint:<nodeId>|segment:<seq>|compare:<a>,<b>`
→ packet, subject to the existing server-side `feedbackPolicy` withholding
(a packet for an unrevealed scope returns `FEEDBACK_WITHHELD`, not an empty
packet — the client must be able to say "waiting", not "nothing to say").

## Deviations from design

The archive's RFC-0006 sketch assumed the composer also renders prose. Rendering
moves to program #2b so the composer stays a pure, testable data function.

## Acceptance criteria

- Living `schemas/feedback_packet.schema.json` v0.1 with the three amendments
  + negative fixtures (claim without evidenceRefs; packet without scope;
  authored claim emitted while `instruments_only`).
- Composer unit tests per source kind; a merged-typing test proving Stockfish
  and Maia values never coalesce.
- **Fail-closed test:** a pack claim whose refs do not resolve is dropped and
  logged, and the packet still composes.
- Timing events: a fixture run where the player spends the luxury move and the
  opponent arrives first yields `one_tempo_short` on that branch and `in_time`
  on the alternative — the mechanism demonstrated end to end.
- Feature extractor: golden tests per feature, incl. the ply-of-change.
- Degradation: a run played past `authoredBoundary` composes
  `instruments_only` with zero authored claims (asserted).
- `FEEDBACK_WITHHELD` under `delayed_checkpoint` before the checkpoint;
  packet after.
- `ENGINES_REQUIRED=1 make verify` green.

## Open questions

- Corpus evidence is stubbed in v1 (`corpus: []`) — the Lichess explorer
  integration waits on the 401 investigation flagged in the sourcing dossier;
  the packet shape reserves it.
- Whether `hypothesis` claims should be renderable at all, or only visible in
  deep mode — resolve with program #2b's UI.

## Changelog

- 2026-08-11: created as breadth program #2a.
