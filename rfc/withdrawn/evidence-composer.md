# RFC: Evidence Composer (server)

- **Status:** withdrawn (2026-08-11) — blocked on a withdrawn prerequisite

> **Withdrawal note.** Depended on `authoring-contracts-v03`, withdrawn above.
> Reviews also found its own core sections unencoded (packet payload shapes
> promised but never written, per-scope reveal undefined against four scopeless
> call sites). The packet abstraction is not needed to close the walkthrough
> finding; `rfc/explanation-grounds.md` does that with shipped data. Kept for
> the record.

- **Author:** claude (for Marco)
- **Created:** 2026-08-11
- **Design refs:** `design/01-training-model.md` (feedback timing, mistake classes), `design/03-product-breadth.md` B4, `design/00-thesis.md` §The hard truth
- **Exploration gate:** breadth program #2 (reordered by evidence 2026-08-11); answers the walkthrough's finding
- **Depends on:** **`rfc/authoring-contracts-v03.md` (blocking prerequisite — claim triggers, window semantics, boundary combinator, ref grammar, segment ids)**, `docs/engine-workers.md` (evidence queue, typing discipline), `docs/branch-runtime.md` (compare payload, objective machine), `docs/drill-pack-format.md` (feedbackClaims, timing windows, authoredBoundary)
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
difference without explaining consequence*. It makes K4/K6 **testable** —
their status still changes only on evidence or a logged owner ruling
(gates.md), and learner understanding is measured by program #2b, not here.

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
`schemas/feedback_packet.schema.json`. Baseline members: `runId, branches,
objectiveComparison, claims, stockfish, humanModel, corpus, features,
timingEvents`; **which are required becomes scope-dependent** per amendment 4
(the baseline's always-required list is replaced). Amendments:

1. **`scope`** (new, required): `{kind: "checkpoint", nodeId}` |
   `{kind: "segment", branchId, startSeq, endSeq}` (authoring-contracts §4 —
   no new identity minted) | `{kind: "comparison", branchA, branchB}`.
2. **`provenanceMode`** (new, required): `authored | instruments_only`
   (two-valued per authoring-contracts §3).
3. Every `claims[]` entry keeps `evidenceRefs` and gains `sourceKind`;
   `uncertainty` becomes an enum (`stated | likely | uncertain`) rather than
   free text. v1 emits only the `sourceKind`s the live ref prefixes produce.
4. **Payload shapes are specified, not `type: object`** (EC-C5): the archive
   baseline leaves `branches`/`objectiveComparison`/`stockfish`/`humanModel`/
   `corpus`/`features`/`timingEvents` shapeless. v0.1 gives each a real shape,
   and **required fields become scope-dependent**: a `checkpoint` packet does
   not carry `branches`/`objectiveComparison` (only `comparison` does), so the
   schema uses `if/then` per `scope.kind` instead of the baseline's
   always-required list.

### Comparison uses recorded claims (not off-cursor re-evaluation)

Claims are composed and recorded when their trigger fires on the active path.
A comparison packet assembles the *recorded* claims of both branches rather
than re-evaluating triggers off-cursor — which is what lets v1 ship without
path-relative trigger evaluation (authoring-contracts §Deferred).

### Composition rules (fail closed)

- **A claim without at least one resolving evidence ref is dropped, not
  rendered.** Composition logs the drop; it never emits an unsupported claim
  (ADR-0005's structural enforcement, not a prompt instruction).
- Evidence typing is never merged. v1 live sources: Stockfish →
  `engine_validated`, extractor/rules → `derived_feature`, pack author →
  `author_principle`, author-marked speculation → `hypothesis` (marked, never
  stated as fact). Maia/tablebase/corpus typings are reserved by the enum but
  emit nothing until those sources are wired.
- Authored claims are **selected**, not generated: a pack claim enters the
  packet when its `when` trigger (authoring-contracts §1) is satisfied on the
  node/segment in scope. A claim with no satisfied trigger never appears.

### Timing events — deferred with the contract (v2)

`timingEvents[]` stays in the packet **shape** but is always empty in v1:
authoring-contracts defers the window vocabulary until pack A exists to design
it against. The "you spent the only spare tempo" explanation is therefore a
stated v2 increment, not a v1 promise. What v1 explains instead: anchored
authored claims, engine evidence, structural features with their ply-of-change,
and objective-state transitions with their grounds — which is what the
walkthrough's "difference without consequence" finding actually asked for.

### Deterministic feature extractor (v1 set, formulas stated — EC-C8)

Only features with a written formula ship in v1. Each emits a value plus the
ply it changed, so comparisons can say *when* branches diverged structurally.

| Feature | Formula |
|---|---|
| `pawn_structure` | per-file pawn counts per colour + island count + passed-pawn squares (no enemy pawn on its file or adjacent files ahead of it) |
| `material_balance` | standard 1/3/3/5/9 difference |
| `queen_exchange` | ply at which queen count per side first reaches 0/0 |
| `open_files` | files with zero pawns of either colour; `semi_open[colour]` = zero own pawns |
| `rook_activity` | per rook: on an `open_files` file, and/or on the 7th rank relative to its colour |
| `king_shield` | count of own pawns on the three files nearest the king, on the two ranks in front of it |

**Cut from v1 as judgment in disguise** (the reviewer was right): development
completion, central tension, and any composite "king safety" score. They return
only if a formula survives review — otherwise they are authored claims or
nothing.

### Degradation contract (the honesty rule)

`provenanceMode` is computed against `authoredBoundary` using the **union
combinator** from authoring-contracts §3:

- **`authored`** — the scope's node(s) are authored territory; authored claims
  are eligible.
- **`instruments_only`** — outside it: **no authored claims are emitted at
  all**, only engine/tablebase/feature/corpus evidence. The composer never
  extrapolates authored intent into unauthored territory; the UI renders the
  mode distinctly (program #2b).

### API and per-scope reveal (EC-C6)

`GET /runs/:id/feedback?scope=checkpoint:<nodeId>|segment:<branchId>,<startSeq>,<endSeq>|compare:<a>,<b>`
→ packet. **Leaseless** (a read that mutates nothing; read routes carry no
writer id).

Reveal state today is run-global and latching (`feedbackIsRevealed` returns
true once *any* checkpoint is reached), which cannot express "checkpoint 3 is
still pending while checkpoint 1 is revealed". This RFC replaces it with a
**per-scope predicate**: a checkpoint scope is revealed once that checkpoint is
reached on the path; a segment scope once that segment completes; a comparison
scope once both branches' latest in-scope checkpoints are revealed. Unrevealed
→ `FEEDBACK_WITHHELD`, remapped from 409 to **425 Too Early** on this GET, so
"waiting" does not read as "conflict".

## Deviations from design

The archive's RFC-0006 sketch assumed the composer also renders prose. Rendering
moves to program #2b so the composer stays a pure, testable data function.

## Acceptance criteria

- Living `schemas/feedback_packet.schema.json` v0.1 with all four amendments
  + negative fixtures (claim without evidenceRefs; packet without scope;
  authored claim emitted while `instruments_only`).
- Composer unit tests per **live** source kind (the four prefixes in
  authoring-contracts §3); a typing test proving `engine_validated` and
  `derived_feature` values never coalesce into one number.
- **Fail-closed test:** a pack claim whose refs do not resolve is dropped and
  logged, and the packet still composes.
- `timingEvents` is present and empty in every v1 packet (asserted, so its
  absence is a deliberate contract rather than an oversight).
- Feature extractor: golden tests per shipped feature (formulas above), incl.
  the ply-of-change.
- Degradation: a run played past `authoredBoundary` composes
  `instruments_only` with zero authored claims (asserted).
- Per-scope reveal: checkpoint 1 revealed while checkpoint 3 still returns
  `FEEDBACK_WITHHELD` (the case run-global latching gets wrong).
- `ENGINES_REQUIRED=1 make verify` green.

## Acceptance review blockers (2026-08-11 — EC-C1..EC-C8) — RESOLVED

C1/C2/C4/C7 → extracted into `rfc/authoring-contracts-v03.md` (claim triggers,
executable window semantics, boundary combinator, stable segment ids), now a
blocking dependency: this RFC assumes no authored contract it does not import.
C3 → seven-prefix ref grammar + widened `EvidencePayload.source` live in that
RFC; the composer reads resolved refs, and the double-source question is
settled here: it reads `evidence.attached` event payloads (durable), never the
in-memory queue. C5 → packet payload shapes specified with scope-dependent
`if/then` requirements and an `uncertainty` enum. C6 → per-scope reveal
predicate replacing run-global latching, `425 Too Early`, leaseless stated.
C8 → judgment features cut, formulas written for the survivors. Governance:
program split recorded in `design/03-product-breadth.md` + BACKLOG, RFC index
row restored, K4/K6 overclaim corrected to "makes testable".

## Open questions

- Corpus evidence is stubbed in v1 (`corpus: []`) — the Lichess explorer
  integration waits on the 401 investigation flagged in the sourcing dossier;
  the packet shape reserves it.
- Whether `hypothesis` claims should be renderable at all, or only visible in
  deep mode — resolve with program #2b's UI.

## Changelog

- 2026-08-11: created as breadth program #2a.
- 2026-08-11: adversarial review EC-C1..C8 — **verdict accepted**: four
  assumed-but-absent authored contracts extracted into a prerequisite RFC;
  packet shapes, per-scope reveal, and feature formulas specified; judgment
  features cut. Stays **draft** until authoring-contracts-v03 is accepted.
