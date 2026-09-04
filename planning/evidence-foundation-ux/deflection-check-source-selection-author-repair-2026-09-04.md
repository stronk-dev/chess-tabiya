# Deflection check source selection — author repair

- **Date:** 2026-09-04
- **Rows:** [[D2536]], [[D2552]]
- **RFC:** `rfc/semantic-collectors.md` §3.2.1 / C17
- **Gate:** `make semantic-collectors-deflection-source-author-repair` — 4/4 plus strict TypeScript
- **Production authorization:** none; another fresh independent review is required

## Implementation return

The first fresh review proved that one exact sealed first-edge check event exists and that the
manifest/module machinery can carry the two alternative derivations. Implementation rehearsal
then reached a boundary the review did not exercise: a generic recorded-path compiler must decide
whether to pass that event.

Passing it whenever edge one checked violates the RFC's `unnecessary-check` refusal when the same
line also satisfies the preferred bait-capture arm. Never passing it breaks the check-induced arm.
Recomputing bait capture in each call site creates a second detector; catching `missing-check` and
retrying turns a typed invariant failure into control flow. All four are refused.

## Bounded repair

The RFC now publishes one `deflectionObservedInduction(anchors)` operation returning
`bait_capture`, `check_induced` or `undefined`. It owns the existing bait-before-check rule and is
used by the operand detector, semantic emitter and all three production-facing call sites. The
callers select already-compiled evidence; the helper produces no explanation, importance or move
grade.

A real dual-arm fixture is required: the bait move captures and checks, the defender captures that
bait, and the retained target is later captured. The helper chooses `bait_capture`; the generic
caller passes no check event; the emitter mints one identity. Direct callers still cannot smuggle
an unnecessary check into the bait arm.

## Boundary

The repair adds one helper/export within the RFC's existing production census. Projection id,
operands, learner eligibility, schema, persistence, API and content remain unchanged. The author
model proves deterministic selection and total caller branching, but is not evidence that the real
dual-arm chess fixture or runtime seal works. That is the next review's job.
