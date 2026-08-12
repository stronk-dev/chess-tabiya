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
| `phase` | ✓ | ✗ | ✗ | ✗ | **dead** — corrected 2026-08-12, see below |
| `difficulty` | ✓ | ✗ | ✗ | ✓ (badge) | cosmetic |
| `start.fen` / `movesSan` / `side` | ✓ | ✓ | ✓ | ✓ | live |
| `objective.type` | ✓ | **partial** | ✓ (state machine) | ✓ | only `reach_checkpoint` translates; `preserve_plan_window` (Pack A's own) is inert |
| `objective.summary` | ✓ | ✗ | ✗ | ✓ | rendered prose, ungrounded |
| `spine` | ✓ | ✓ (orchestrator walks it) | ✓ (via checkpoints) | partial | live |
| `spine[].annotations` | ✓ | ✗ | ✗ | ✗ | **dead** — authored prose with no surface |
| `concepts` | ✓ | ✗ | ✗ | ✗ | **dead** |
| `planClasses` | ✓ | ✗ | ✗ | ✗ | **dead** |
| `checkpoints[].trigger` | ✓ | ✓ | ✓ (`checkpoint.reached`) | ✓ | live |
| `checkpoints[].actions` | ✓ (closed set) | ✓ (load + `pack-check`) | ✗ | partial | closed 2026-08-12 by `ef4cfe6`; residual drift risk, see below |
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

1. **Explanation UI — no new *authored vocabulary*, but a delivery contract is
   still required** (corrected after codex review; my original "no new
   contracts" was wrong). `annotations`, `deviations[].note`, `planClasses`,
   `concepts` are already-encoded prose addressable today — no new chess
   vocabulary needed. **But `GET /packs/:id` ships the entire pack, including
   every annotation, deviation note and claim, before play begins.** Revealing
   them client-side would be precisely the "CSS hiding is theater" failure this
   repo already rejected server-side for engine evidence (drill-client DC-C6).
   So the slice needs a **server-side authored-feedback projection or
   run-scoped reveal response** — a delivery/timing contract, not a chess one.
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

## Two defects Pack A proved (not just gaps)

**1. Authored feedback leaks before play.** `GET /packs/:id` returns the full
pack document. A player can read every deviation note, annotation and claim for
the position they are about to face. The anti-contamination law is enforced
server-side for engine evidence and not at all for authored prose — because
until Pack A, no served pack had any.

**2. The checkpoint-action vocabulary is open and unaligned.** The schema
accepts *any* non-empty string except `capture_intent`; `CheckpointSheet`
recognizes exactly one value, `compare_branches`. Pack A authored `"stop"` and
`"compare"` — both passed validation, both do nothing, silently. An open
vocabulary against a closed consumer means every authoring typo is a no-op the
validator blesses.

## Two exact inputs for the next RFC (codex)

1. **Authored-prose delivery and reveal timing**, using existing fields — a
   server-side projection so authored feedback obeys `feedbackPolicy` the way
   engine evidence already does.
2. **A closed, validated checkpoint-action vocabulary** aligned with the
   client, so unknown actions fail `pack-check` instead of failing silently.

## Method caveat

This is a static audit: "evaluated" means production code reads the field, not
that it behaves correctly. Session 2's play-throughs test behaviour; this table
tests existence. A field can be ✓ evaluated and still be wrong.

## Corrections — 2026-08-12 (breadth alignment pass)

The matrix was built 2026-08-11 and two rows had gone stale by the time it was
being used as RFC input. Both re-verified in code today.

**1. `checkpoints[].actions` is no longer an open vocabulary.** Commit
`ef4cfe6` closed it while fixing the authored-prose leak:
`SUPPORTED_CHECKPOINT_ACTIONS = Object.freeze(["compare_branches"] as const)`
(`apps/server/src/pack-validation.ts:11`), and an unrecognized value now raises
`UNSUPPORTED_CHECKPOINT_ACTION` at load and in `pack-check`
(`pack-validation.ts:147-156`). Pack A's `"stop"`/`"compare"` were replaced in
the same commit. The §"Two defects Pack A proved" item 2 is therefore **fixed,
not open** — do not carry it into an RFC as an outstanding defect.

The residual risk is narrower and different: the server's allow-list and the
client's recognized-action switch are two hand-maintained lists that currently
happen to agree. A shared constant, or a test asserting they are identical, is
what actually prevents the next divergence.

**2. `phase` is not rendered.** The original row claimed a badge. `PackSummary`
does not carry the field at all (`apps/server/src/pack-registry.ts:16-24`,
which projects `id`/`version`/`digest`/`title`/`mode`/`difficulty`/
`reviewStatus`), and `grep -rn "phase" apps/web/src` finds only two unrelated
prose strings. `mode` and `difficulty` genuinely are rendered as badges
(`apps/web/src/lib/PackList.svelte:34,38`); `phase` is dead in every column.

This matters beyond a cell: phase is first-class navigation in
`design/03-product-breadth.md` (Learn = opening / middlegame / endgame /
trajectories). The one field the IA is organized around is not projected to the
client.

**Method reminder for future readers:** this instrument is a snapshot, not a
standing truth. Re-verify a row before quoting it — the code moves under it.
