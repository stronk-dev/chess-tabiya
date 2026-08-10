# RFC: Drill Pack Format

- **Status:** draft
- **Author:** claude (for Marco)
- **Created:** 2026-08-12
- **Design refs:** `design/01-training-model.md` (modes, episode, outcome types), `design/00-thesis.md §Target player` (on-ramp knobs)
- **Exploration gate:** owner override, logged `planning/exploration/log.md` 2026-08-12 (E1 met by ruling; E2 advisory; E3/E4/E5 accepted as in-flight risk)
- **Depends on:** —
- **Parent / amends:** mines `archive/brief-v2/rfcs/RFC-0001-drill-pack-format.md` sketch + `archive/brief-v2/schemas/drill_pack.schema.json`
- **Supersedes / superseded by:** —
- **Planning:** `planning/drill-pack-format/` (once implementing)

## Summary

The versioned, engine-independent JSON representation of a drill's learning intent:
positions, objective contract, checkpoints, opponent policy, feedback claims,
transitions, provenance. Everything the runtime executes and everything an author
writes. First real content target: pack A (anti-Caro-Advance).

## Motivation

The product is a content system; the pack format is its foundation. The archive schema
(`drill_pack.schema.json`, validated Draft 2020-12) is adopted as the baseline; this
RFC promotes it to a specified contract and adds the requirements exploration
accumulated. Out of scope: natural-language courses, storing engine lines, engine
implementation details, replacing PGN as interchange.

## Specification

### Baseline

The archive schema is the v0.1 starting shape: required `id, version, title, mode,
start, objective, checkpoints, opponentPolicy, provenance`; `mode` ∈ {line, plan,
outcome, trajectory}; objective types incl. win/hold/save/resist and
preserve_plan_window; opponent policy modes theory_strict…human_external with
targetElo/temperature/topP/stockfishGuardCp/seedMode; feedback claims carrying
`evidenceTypes` (author_principle, engine_validated, tablebase_exact, corpus_observed,
human_model_predicted, derived_feature, hypothesis); provenance review ladder
schema_example → draft → reviewed → published. A living copy of the schema lives at
`schemas/drill_pack.schema.json` in this repo once implementing (archive original
stays frozen).

### Amendments over the archive baseline

1. **`feedbackPolicy` (new, per-pack, required)** — when feedback is revealed:
   `delayed_checkpoint` (default; ADR-0006), `segment_end`, or
   `immediate_blunder_guard` (on-ramp packs: show the consequence within ≤2 plies,
   then rewind). Runtime must honor the pack's declaration; no global constant.
2. **Checkpoint `interaction` (new, optional per checkpoint)** — beyond stop/compare
   actions: `intent_capture` (plan classes), `prediction` (predict the opponent's
   reply; graded against the opponent-policy distribution and engine validation,
   revealed per feedbackPolicy; optional `flipBoard: true`). Sparse by design: an
   authoring lint warns above N prediction checkpoints per segment.
3. **`authoredBoundary` / degradation contract (new)** — the pack declares where its
   authored knowledge ends (node set / structure signatures / ply horizon). Off-spine,
   the runtime MUST visibly downgrade from authored coach-voice to instruments-only
   evidence; the LLM renderer never papers over the boundary (ADR-0005).
4. **Deviation classification (promoted from free-form)** — `acceptedAlternatives`
   entries carry `class` ∈ {required_theory, accepted_alternative,
   interesting_deviation, concept_violation, tactical_error} and optional
   `offObjective: true` (playable but not what this pack rehearses — saved, not
   marked wrong).
5. **On-ramp knobs (difficulty object)** — `branchLengthTarget` (2–8 for on-ramp,
   8–20 core), objective style follows from objective.type; difficulty band may start
   at 1000.
6. **Addressability** — every pack and every start node has a stable URL form
   (`/drill/<packId>@<version>[/<nodeId>]`), and a bare-FEN form
   (`/fen/<FEN>/<objectiveType>`) for pack-less ad-hoc drills (CET-verified pattern).
7. **Session distillability (constraint on future fields)** — a pack must be
   producible by distilling a run record (sequence of positions, branches,
   annotations). Reserved provenance source `session_distilled`. No pack field may
   require information a run record cannot carry.
8. **Versioning** — semver per pack; runs record the exact pack digest; breaking
   checkpoint/objective changes require a major bump.

### Timing windows (tempo contract)

Checkpoint triggers support the window form: `windowOpens` (node/condition),
`windowCloses` (opponent reaches node / feature event), `luxuryMoveBudget` (int).
The exact trigger vocabulary is the E3 experiment's output — see Open questions.

## Deviations from design

None; extends the archive sketch per logged exploration decisions.

## Acceptance criteria

- Living schema validates: the archive Najdorf fixture, one negative fixture per
  amendment (bad feedbackPolicy, prediction without grading source, missing
  provenance), and **pack A (anti-Caro-Advance) authored end-to-end and reviewed**.
- Round-trip: pack start + a run's branches export as legal PGN with variations.
- A URL in form (6) resolves to a playable drill definition.
- Authoring time for pack A recorded in `planning/` (feeds Q7/K10 verdict).

## Open questions

- Trigger vocabulary for timing windows — settle by hand-authoring pack A (E3
  experiment runs inside this RFC's implementation).
- `transitions` shape for trajectory packs (causal-integrity rule encoding) — may
  split into a follow-up RFC.
- Pack content licensing (Q2 content-rights axis) — owner decision pending.

## Changelog

- 2026-08-12: created as first post-exploration draft.
