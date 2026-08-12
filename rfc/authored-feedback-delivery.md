# RFC: Authored-Feedback Delivery & Closed Action Vocabulary

- **Status:** draft
- **Author:** claude (for Marco)
- **Created:** 2026-08-12
- **Design refs:** `design/01-training-model.md` §feedback timing, `design/02-product-shape.md` §anti-contamination, ADR-0006
- **Exploration gate:** two defects found by Pack A, evidenced in `planning/content-era/field-consumer-matrix.md`
- **Depends on:** `rfc/archive/drill-client.md`, `rfc/archive/app-shell.md`, `rfc/archive/explanation-grounds.md`
- **Parent / amends:** **`rfc/archive/drill-client.md`** (server-side withholding now covers authored prose, not only engine evidence) and **`rfc/archive/drill-pack-format.md`** (`checkpoints[].actions` becomes a closed enum)
- **Supersedes / superseded by:** —
- **Planning:** `planning/authored-feedback-delivery/` (once implementing)

## Summary

Two narrow platform fixes, both with exact failing cases from Pack A, both
using **existing fields and no new chess vocabulary**:

1. `GET /packs/:id` currently ships every annotation, deviation note and claim
   **before play** — authored feedback bypasses the withholding boundary that
   engine evidence obeys.
2. `checkpoints[].actions` accepts any non-empty string while the only consumer
   executes exactly one value, so authored actions silently no-op.

## Motivation

The anti-contamination law is enforced server-side for engine evidence
(`explanation-grounds`, DC-C6: client-side hiding is theater) and not at all
for authored prose — because until Pack A no served pack contained any. Pack A
authored five deviation notes, nine spine annotations and two claims, all of
which a player can read in devtools before making a move. Pack A also authored
`actions: ["stop", "compare"]`; `CheckpointSheet` tests only for
`compare_branches`, so both values validate and do nothing.

**Out of scope:** rendering deviations (the next slice, unblocked by this one),
claim triggers, `provenanceMode`, intent-capture behaviour, objective types
beyond `reach_checkpoint`. No new authored fields.

## Specification

### 1. Pack projections (server)

`GET /packs` and `GET /packs/:id` return a **play projection**. Authored
feedback moves behind the existing `feedbackPolicy` gate, delivered by the
already-specified reveal path rather than at load.

| Field | Play projection | Rationale |
|---|---|---|
| `id`, `version`, `title`, `mode`, `phase`, `difficulty`, `provenance` | included | catalogue + badges |
| `start` (fen, movesSan, side) | included | required to play |
| `objective.summary` | included | it *is* the task statement |
| `objective.type`, `feedbackPolicy`, `opponentPolicy` | included | run configuration |
| `planClasses` (id, label, description) | included | these are the *question* (choices offered), not the answer |
| `concepts` | included | topical labels; no consequence disclosed |
| `checkpoints` (id, label, actions) | included | the client must know what a checkpoint offers |
| `checkpoints[].trigger` | **excluded** | trigger conditions disclose what the pack is watching for |
| `spine[].moveUci/moveSan/id/children` | included | structure; the server, not the client, follows it |
| `spine[].annotations` | **withheld** | authored explanation of *why* a move is right |
| `deviations` (whole array) | **withheld** | per-move authored judgment = the answer |
| `feedbackClaims` | **withheld** | the explanation payload |

Withheld content is served by `GET /packs/:id/authored?runId=&scope=` under the
**same reveal predicate the run already uses** (`feedbackIsRevealed`): withheld
before the pack's policy allows, delivered after. No new reveal semantics — it
reuses the gate `explanation-grounds` wired for compare.

**Known limitation, stated not hidden:** spine *moves* remain in the play
projection. For a Line Drill the main line is arguably the answer; Line Drill is
not implemented, and designing its disclosure rules blind is the failure mode
four withdrawn drafts demonstrated. Recorded as an open question with a trigger
(first Line Drill pack), not silently decided.

### 2. Closed action vocabulary (pack schema, breaking)

`checkpoints[].actions` becomes an enum of **exactly what the client executes**:

```
"compare_branches"   // the only value CheckpointSheet acts on today
```

Continue / Rewind here / Stop session are **unconditional controls** on the
sheet — they are not pack-selectable and therefore must not be action values;
Pack A's `"stop"` was authoring a control that is always present.

The enum grows only when a consumer grows: **vocabulary follows consumer, never
leads it.** `pack-check` fails unknown values with the offending string and the
allowed set. Living fixture and Pack A migrate (`["stop","compare"]` →
`["compare_branches"]`).

## Deviations from design

None. This closes gaps between shipped behaviour and two standing laws
(anti-contamination; validators must not bless no-ops).

## Acceptance criteria

- `GET /packs/:id` omits `annotations`, `deviations`, `feedbackClaims` and
  `checkpoints[].trigger`; a test asserts each is absent from the response body
  (**fails against today's code**).
- `GET /packs/:id/authored` returns withheld content only after the run's
  reveal predicate passes; before it, `FEEDBACK_WITHHELD` (425), matching the
  existing surface.
- A Playwright assertion that the pack payload delivered to the browser during
  the walkthrough contains no deviation note text — contamination proven absent
  end to end, not just unit-asserted.
- `pack-check` rejects an unknown action with a message naming the value and the
  allowed set; accepts `compare_branches`; both fixtures migrated and passing.
- `docs/drill-client.md` withholding section and `docs/drill-pack-format.md`
  action vocabulary updated in the same change.
- `ENGINES_REQUIRED=1 make verify` + `make test-browser` green.

## Open questions

- **Spine disclosure for Line Drills** — deferred with a trigger (first Line
  Drill pack), per the standing rule against specifying blind.
- Whether `checkpoints[].label` leaks intent ("Choose your plan before the break
  lands" hints that a break is coming). Arguably yes; deferred until a pack
  demonstrates real leakage, since labels are also the user's only orientation.

## Changelog

- 2026-08-12: created from two defects Pack A proved; scope deliberately narrow
  — no new authored vocabulary, no chess semantics.
