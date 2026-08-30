# Module registration — second fresh independent buildability review

**Date:** 2026-08-30

**Reviewer:** Codex, independent of the Claude author repair

**Verdict:** **RETURNED.** The eleven-module product model, bounded seats, staged-move protocol,
atomic budgets and Review paging survive. The generated execution/binding artifacts are not yet an
executable authority: seven gaps still leave core decisions to the implementer or pass vacuously.
No production implementation is authorised.

## Reproduction

`make module-registration-second-fresh-review` passes 7/7. It is a disposable buildability
falsifier outside production verification.

## Blocking findings

### D2164 — the “derived” binding fields are hand-authored tables

The RFC says the compiler derives timing, roles, sessions, forms and budgets from module,
workflow, manifest and adapter authorities with no caller choice. The artifact generator instead
defines local `timings`, `roles`, `sessions`, `moduleForms` and `maxFacts` objects and copies their
values into every row. It imports neither `WORKFLOW_CONTEXT_POLICIES` nor module declarations.
Those five tables can drift from the product while both artifact digest and author tests remain
green.

Generate every field from the actual registries and fail on disagreement. Human-authored
acceptance sets may remain author input; derived policy bytes may not be copied beside their owner.

### D2165 — callable existence is not an executable projection operation

Each execution row contains only `{source,symbol}`. It specifies no input type/builder, invocation
arguments, result parser, projection extractor, error/abstention mapping or seal. Several distinct
projections point to one aggregate function—for example `derived.compare.eval_delta@1` points to
`comparisonNarrative`, which returns `ComparisonNarrative`, not that projection. A function can be
importable and still be unusable by the promised generic assembler.

Publish a typed operation profile per executable shape: canonical subject input, exact invocation,
result-to-projection extraction, declared abstention/error mapping and positive sealed output.

### D2166 — all derived products are stamped as edge-local

The generator maps every `derived_after_inputs` row to `subjectKind:"edge"` and sets
`sameSubject:true` unconditionally. `derived.story.rank@1`, for example, invokes `storyMoments` over
a run/branch history yet is declared as one edge. The resulting cache/DAG can merge unlike
subjects or reject legitimate run-prefix inputs while its same-subject assertion passes by
construction.

Subject grain must come from a typed operation/profile authority per projection. Cross position,
edge, node, branch and run-prefix fixtures must prove both legal joins and mismatch refusal.

### D2167 — the DAG has nine ownerless inputs

Nine referenced derived inputs are absent from the 117 execution rows, and the artifact has no
`sourceInputs` declaration: story eval-shift/last-level, legal exchange, square-control event,
three structural predicates, defender-duty set and recorded move. The author test walks a
dependency only when the row happens to exist, silently ignoring every missing input. The RFC's
“itself in the plan or explicitly recorded source input” rule therefore is not enforced.

Make the execution graph closed: every input is an executable row or a typed external/source-input
node with its own subject, acquisition and seal. Set equality must reject every missing or extra
node.

### D2168 — Guided Hint passes by being absent

The RFC says `guided_hint` is a mandatory hard dependency whose family×rung disclosure product
must be non-empty before acceptance. It is absent from `AUTHOR_MODULE_ACCEPTS`, the generator does
not import `HINT_DISCLOSURE_PROJECTION_IDS`, and the binding artifact has zero
`module.guided_hint` rows. All maintained author gates are green with `R=0`.

Import the literal accepted hint registry, assert the measured family set and rung set are each
non-empty, and require their Cartesian product set-equal to Guided Hint bindings. Until that owner
lands, the author contract must be red for the named reason rather than green by omission.

### D2169 — adapter identity and the third form intersection are fabricated

The generator invents adapter ids by string interpolation and intersects only projection forms
with a local module-form table. It imports no presentation adapter registry, so it cannot perform
the RFC's required projection ∩ module ∩ registered-adapter form join. The just-returned
`evidence-presentation` contract confirms those pair-specific adapters do not yet exist.

Generate bindings from real registered adapter identities after presentation checkpoint B. An
absent adapter or unsupported form must be an explicit awaiting dependency, never a plausible id.

### D2170 — two family smoke tests stand in for 117 row outcomes

The positive suite runs two tests covering eight broad source families. It never loads the
execution artifact and never asserts that any row's declared projection is emitted. This cannot
falsify a wrong projection-to-callable mapping—the exact D2165 failure.

Exercise each distinct typed operation profile and require every one of 117 rows to resolve through
one profile whose positive fixture emits that row's declared sealed projection. Broad provider
health proves remain useful but cannot substitute for row reach.

## Required author return

Repair [[D2164]], [[D2165]], [[D2166]], [[D2167]], [[D2168]], [[D2169]] and [[D2170]]. Coordinate
the actual presentation-adapter and hint-disclosure dependencies rather than synthesizing their
identities. Another fresh independent review is required before implementation.
