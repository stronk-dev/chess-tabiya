# Pack field lifecycle matrix — encoded → evaluated → persisted → rendered

Built 2026-08-12 by code inspection (codex's proposed instrument). Method:
grep across `apps/server/src`, `packages/runtime/src`, `packages/schema/src`,
`apps/web/src`, excluding tests, then distinguishing **type declarations** from
**actual evaluation**. Fields marked ✗ evaluated appear only in `types.ts` /
`lint.ts` — i.e. the schema accepts them and the linter checks their shape, and
then nothing reads them.

| Field | Encoded | Evaluated | Persisted in run | Rendered | Verdict |
|---|:--:|:--:|:--:|:--:|---|
| `id` `version` `title` | ✓ | ✓ | ✓ (packId/digest) | ✓ | live |
| `mode` | ✓ | ✗ | ✗ | ✓ (badge) | cosmetic |
| `phase` | ✓ | ✗ | ✗ | ✓ (badge) | cosmetic |
| `difficulty` | ✓ | ✗ | ✗ | ✓ (badge) | cosmetic |
| `start.fen` / `movesSan` / `side` | ✓ | ✓ | ✓ | ✓ | live |
| `objective.type` | ✓ | **partial** | ✓ (state machine) | ✓ | only `reach_checkpoint` translates; `preserve_plan_window` (Pack A's own) is inert |
| `objective.summary` | ✓ | ✗ | ✗ | ✓ | rendered prose, ungrounded |
| `spine` | ✓ | ✓ (orchestrator walks it) | ✓ (via checkpoints) | partial | live |
| `spine[].annotations` | ✓ | ✗ | ✗ | ✗ | **dead** — authored prose with no surface |
| `concepts` | ✓ | ✗ | ✗ | ✗ | **dead** |
| `planClasses` | ✓ | ✗ | ✗ | ✗ | **dead** |
| `checkpoints[].trigger` | ✓ | ✓ | ✓ (`checkpoint.reached`) | ✓ | live |
| `checkpoints[].actions` | ✓ | ✗ | ✗ | partial | sheet offers fixed buttons, not pack's list |
| `checkpoints[].interaction` | ✓ | ✗ | ✗ | ✗ | **dead** — incl. `intent_capture`/`planClassIds` |
| `authoredBoundary` | ✓ | ✗ | ✗ | ✗ | **dead** — no `provenanceMode` consumer |
| `deviations` | ✓ | ✗ | ✗ | ✗ | **dead** — classes and notes both |
| `feedbackPolicy` | ✓ | ✓ (withholding) | — | ✓ (badge) | live |
| `feedbackClaims` | ✓ | ✗ | ✗ | ✗ | **dead** — no triggers, no consumer |
| `opponentPolicy` | ✓ | ✓ (selector) | ✓ (policyConfig) | ✓ | live |
| `provenance` | ✓ | ✓ (graduation rule) | ✗ | ✓ (badge) | live |

## What the matrix says

**Roughly half of what an author writes currently has no consumer.** Seven
field groups are fully dead: annotations, concepts, planClasses, checkpoint
interactions, authoredBoundary, deviations, feedbackClaims. Pack A spent real
authoring effort on five of those seven.

**The dead fields cluster into exactly three work items** — which is the useful
part, because it tells us what kind of work comes next rather than just that
work remains:

1. **Explanation UI (no new contracts needed).** `annotations`, `deviations[].note`,
   `planClasses`, `concepts` are already-encoded prose that simply has no
   surface. Rendering them requires **zero** new authored vocabulary — they are
   strings with ids, addressable today. This is the cheapest large win in the
   product right now and it needs no retry of a withdrawn RFC.
2. **Runtime semantics (needs contracts).** `objective.type` beyond
   `reach_checkpoint`, `checkpoints[].interaction`, `authoredBoundary` →
   `provenanceMode`, and `deviations[].class` as live classification all need
   evaluation logic *and* the encodings the withdrawn RFCs failed to pin.
3. **Claim grounding (needs both).** `feedbackClaims` need triggers (contract)
   and a rendering surface (UI), which is why they were the hardest thing to
   specify blind.

## Input for retrying the withdrawn RFCs

The matrix supplies what four drafting attempts lacked — a concrete, verified
list of what is inert and why:

- Don't design `provenanceMode` before `authoredBoundary` has *any* evaluator;
  the boundary combinator ("plyHorizon caps, does not grant") is already
  specified and validated against author intuition (Pack A session 1) but
  computes nothing.
- `interaction`/`intent_capture` is encoded, linted, and never read — so the
  intent-capture design question is not "what vocabulary" but "what does the
  checkpoint sheet do with a recorded choice", a UI question first.
- `deviations` are the strongest candidate for the *first* thing to render:
  they carry per-move authored judgment, they are addressable by `spineNodeId`
  + `moveUci` with no new contract, and Pack A already has five real ones.

## Method caveat

This is a static audit: "evaluated" means production code reads the field, not
that it behaves correctly. Session 2's play-throughs test behaviour; this table
tests existence. A field can be ✓ evaluated and still be wrong.
