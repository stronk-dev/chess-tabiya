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


## Acceptance review blockers (2026-08-12 — DPF-C1..DPF-C8)

**DPF-C1 — Required `feedbackPolicy` makes the archive fixture acceptance criterion self-contradictory.** [blocking]
Amendment 1 makes `feedbackPolicy` required per pack, but the first acceptance criterion demands the living schema "validates the archive Najdorf fixture" — the frozen fixture has no `feedbackPolicy`, and the baseline's `additionalProperties: false` means it cannot validate against a schema that both requires and permits the new fields without the fixture changing, which archive immutability forbids. Rule: validate the archive fixture only against the frozen v0.1 baseline (a copied, amended fixture in the living tree validates v0.2), or give `feedbackPolicy` a schema default and stop requiring it.

**DPF-C2 — The pack format has no node/tree model, yet three amendments reference "nodes".** [blocking]
`authoredBoundary` is "node set / structure signatures / ply horizon" — three representations with zero types; amendment 6 URLs contain `<nodeId>`; timing windows reference "node" conditions. But the baseline schema has only `start.fen` + free-form checkpoints — no spine, tree, or node list. Either the format gains an explicit authored-tree field with node IDs, or the amendments restate in terms the schema has (FEN, ply, move sequence). Without this, `authoredBoundary` cannot be given a JSON Schema at all.

**DPF-C3 — Trigger vocabulary is an open question inside the RFC's own acceptance loop.** [blocking]
§Timing windows declares "the exact trigger vocabulary is the E3 experiment's output," and E3 = authoring pack A = the headline acceptance criterion — the criterion depends on a question settled only by performing the criterion. RFC-0000 requires open questions resolved before `accepted` or deferred to a listed future RFC. Rule: (a) freeze a minimal v0.2 trigger vocabulary now (pack A may force v0.3), or (b) carve timing windows into a follow-up RFC.

**DPF-C4 — `prediction` interaction has no grading configuration and collides with the existing `actions` vocabulary.** [blocking]
"Graded against the opponent-policy distribution and engine validation" names no fields: no threshold (top-k? probability mass? cp window?), no output type; the negative fixture "prediction without grading source" implies a field that appears nowhere. Separately the baseline fixture expresses intent capture as action string `capture_intent` while amendment 2 introduces `interaction: intent_capture` — replacement or coexistence is unstated.

**DPF-C5 — "Runs record the exact pack digest" with no digest definition.** [blocking]
Both this RFC and branch-runtime invariant 7 key determinism on `packDigest`, but neither algorithm nor canonicalization is specified — JSON has no canonical byte form. Specify algorithm (e.g. SHA-256), canonicalization (published file bytes vs RFC 8785), and whether the digest covers `version`.

**DPF-C6 — `feedbackPolicy` values have undefined semantics and no parameters.** [advisory]
`segment_end` references a "segment" the pack format never defines; `immediate_blunder_guard` names no blunder threshold or config owner. Decide bare enum (runtime owns thresholds — say so) vs parameterized object, and define or cross-reference "segment".

**DPF-C7 — Amendment 4's entry shape is unspecified and the negative-fixture criterion doesn't match the amendments.** [advisory]
`acceptedAlternatives` entries never state their identifying fields (which move/position); classes like `tactical_error` suggest the field is being repurposed as a general deviation map without saying so. "One negative fixture per amendment" lists an example testing the baseline, not an amendment; "pack A reviewed" names no reviewer or checklist (the archive authoring guide's regression list is the candidate — cite it).

**DPF-C8 — Addressability encoding and lint threshold left to invention.** [advisory]
`/fen/<FEN>/<objectiveType>` cannot work literally (FEN contains `/` and spaces) — the encoding must be normative; `@<version>` vs digest identity needs a statement (see DPF-C5). The prediction-checkpoint lint's N is unbound — pick a number or delete the sentence.

**Reviewer verdict:** needs-revision — faithful to design (no ADR contradictions found) but below the template's "implement without inventing mechanics" bar until C1–C5 are ruled. Each is resolvable by a short ruling. Owner rulings pending.

## Changelog

- 2026-08-12: created as first post-exploration draft.
- 2026-08-12: acceptance review landed (DPF-C1..DPF-C8); held at draft pending owner rulings.
