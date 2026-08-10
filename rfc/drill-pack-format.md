# RFC: Drill Pack Format

- **Status:** implementing
- **Author:** claude (for Marco)
- **Created:** 2026-08-12
- **Design refs:** `design/01-training-model.md` (modes, episode, outcome types), `design/00-thesis.md §Target player` (on-ramp knobs)
- **Exploration gate:** owner override, logged `planning/exploration/log.md` 2026-08-12
- **Depends on:** —
- **Parent / amends:** mines `archive/brief-v2/rfcs/RFC-0001-drill-pack-format.md` sketch + `archive/brief-v2/schemas/drill_pack.schema.json`
- **Supersedes / superseded by:** —
- **Planning:** `planning/drill-pack-format/`

## Summary

The versioned, engine-independent JSON representation of a drill's learning intent:
spine, positions, objective contract, checkpoints, opponent policy, feedback claims,
provenance. Everything the runtime executes and everything an author writes. First
real content target: pack A (anti-Caro-Advance).

## Motivation

The product is a content system; the pack format is its foundation. The archive
schema is adopted as the frozen v0.1 baseline; this RFC specifies **v0.2**. Out of
scope: natural-language courses, storing engine lines, engine implementation details,
replacing PGN as interchange, trajectory `transitions` (follow-up RFC, see Open
questions).

## Specification

### Baseline (v0.1, frozen)

`archive/brief-v2/schemas/drill_pack.schema.json` — required `id, version, title,
mode, start, objective, checkpoints, opponentPolicy, provenance`; modes {line, plan,
outcome, trajectory}; objective types incl. win/hold/save/resist,
preserve_plan_window; opponent policy modes theory_strict…human_external; feedback
claims with `evidenceTypes`; provenance ladder schema_example→draft→reviewed→
published. The archive fixture validates against this frozen baseline **only**
(DPF-C1 ruling); the living tree carries a copied, amended fixture for v0.2.

### v0.2 amendments

1. **`spine` (new, optional)** — the authored move-tree (DPF-C2 ruling: owner chose
   the tree). Nested nodes: `{id (stable, pack-unique), moveUci, moveSan,
   children[], annotations?}`. Line/plan/trajectory packs use it; outcome packs may
   omit it. Spine node ids are the referents for checkpoints, boundaries, deviations,
   and URLs. Spine legality (every path legal from `start.fen`) is validated by pack
   lint.
2. **`feedbackPolicy` (new, required in v0.2)** — bare enum (DPF-C6 ruling: runtime
   owns thresholds): `delayed_checkpoint` (default semantics per ADR-0006) ·
   `segment_end` ("segment" = checkpoint-to-checkpoint span as defined in
   `rfc/branch-runtime.md`) · `immediate_blunder_guard` (on-ramp: consequence shown
   within ≤2 plies, then rewind; blunder detection thresholds are runtime/worker
   configuration, not pack fields).
3. **Checkpoint `interaction` (new, optional per checkpoint)** — object, one of:
   - `{type: "intent_capture", planClassIds: [...]}` — **replaces** the v0.1 action
     string `capture_intent`, which is removed in v0.2 (DPF-C4 ruling); the
     `actions` array remains for stop/compare verbs only.
   - `{type: "prediction", grading: {source: "opponent_policy"|"engine"|"both",
     topK?: int≥1, minMass?: 0..1}, flipBoard?: bool}` — grading.source is required
     (the "prediction without grading source" negative fixture tests exactly this).
   Authoring lint warns above **2** prediction checkpoints per segment (DPF-C8).
4. **`authoredBoundary` (new, optional)** — `{spineNodeIds?: string[], plyHorizon?:
   int, fenPredicates?: Predicate[]}`, at least one member. Beyond it the runtime
   MUST visibly downgrade from authored coach-voice to instruments-only evidence
   (ADR-0005 guard).
5. **Deviation map** — v0.1 `acceptedAlternatives` is **renamed `deviations`**
   (breaking; v0.2 is a major format change, DPF-C7 ruling). Entry:
   `{at: {spineNodeId} | {fen}, moveUci, class: required_theory |
   accepted_alternative | interesting_deviation | concept_violation |
   tactical_error, offObjective?: bool, note?}`.
6. **On-ramp knobs** — `difficulty.branchLengthTarget` (2–8 on-ramp, 8–20 core);
   band may start at 1000.
7. **Addressability** — `/drill/<packId>@<version>[/<spineNodeId>]`; bare-FEN form
   `/fen/<encodedFen>/<objectiveType>` where `encodedFen` is the full FEN
   **percent-encoded as a single path segment** (DPF-C8 ruling). URLs carry
   `version`; runs additionally record the digest (below).
8. **Timing windows (frozen minimal vocabulary, DPF-C3 ruling)** — checkpoint
   `trigger` is one of: `{atPly}`, `{atSpineNode}`, `{fenPredicate}` (piece-on-
   square / structure pattern over the transpose-key FEN), `{materialBalance}`.
   Window form: `{windowOpens: Trigger, windowCloses: Trigger, luxuryMoveBudget:
   int≥0}`. Authoring pack A may force a v0.3 revision of this vocabulary —
   accepted risk, logged.
9. **Digest (DPF-C5 ruling)** — `sha256:<hex>` over the **RFC 8785 (JCS) canonical
   JSON** of the complete pack document including `version`. Runs record it;
   determinism and caching key on it.
10. **Session distillability** — a pack must be producible by distilling a run
    record; reserved provenance source `session_distilled`. No pack field may
    require information a run record cannot carry.

## Deviations from design

None; extends the archive sketch per logged exploration and blocker rulings.

## Acceptance criteria

- Living `schemas/drill_pack.schema.json` (v0.2) validates: the **living amended
  Najdorf fixture** (archive fixture stays frozen against v0.1), and rejects one
  negative fixture per amendment: missing `feedbackPolicy` · `prediction` without
  `grading.source` · `authoredBoundary` with no members · `deviations` entry
  without `class` · illegal spine (invalid move path) · malformed window trigger.
- Round-trip: pack spine + a run's branches export as legal PGN with variations.
- A URL in form (7) resolves to a playable drill definition; FEN encoding
  round-trips.
- Digest: two serializations with different key order produce the identical digest.
- ~~Pack A authored end-to-end~~ **Moved out of this RFC's acceptance (owner ruling
  2026-08-12: foundations first, content last).** The format is accepted on schema +
  fixtures + lints + round-trip; pack A is authored in the content phase, after the
  runtime/engine/UI foundations exist, so authoring cost (Q7/K10) is measured with
  real tooling — a fairer test. Authoring rule (Q2 content-rights ruling): original
  prose only; ideas may be learned from any source and cited; annotation text is
  never copied. Moves/game scores are uncopyrightable facts; Lichess data is CC0.

## Open questions

- Trajectory `transitions` shape (causal-integrity encoding) — deferred to a listed
  follow-up RFC `trajectory-transitions` (not yet drafted).
- Pack content licensing (Q2 content-rights axis) — owner decision pending; does
  not block schema implementation.

## Acceptance review blockers (2026-08-12 — DPF-C1..DPF-C8) — RESOLVED

All eight blockers ruled 2026-08-12 (owner rulings + author resolutions, logged) and
folded into the Specification above: C1 → frozen-baseline validation split; C2 →
spine tree adopted (owner); C3 → minimal trigger vocabulary frozen (owner); C4 →
grading object + `capture_intent` replacement; C5 → SHA-256 over RFC 8785; C6 →
bare enum, runtime owns thresholds; C7 → `deviations` rename + entry shape + fixture
list matched to amendments + reviewer named; C8 → percent-encoded FEN segment,
lint N=2. Original blocker texts: git history of this file (commit 3eb4c52).

## Changelog

- 2026-08-12: created as first post-exploration draft.
- 2026-08-12: acceptance review landed (DPF-C1..DPF-C8); held at draft.
- 2026-08-12: all blockers resolved per owner rulings (spine tree, frozen trigger
  vocabulary) and author resolutions; **status → accepted**.
- 2026-08-12: implementation started through the shared schema/runtime scaffold;
  **status → implementing**.
- 2026-08-12: pack A moved from acceptance criteria to the content phase (owner
  ruling: foundations first); content-rights authoring rule added.
