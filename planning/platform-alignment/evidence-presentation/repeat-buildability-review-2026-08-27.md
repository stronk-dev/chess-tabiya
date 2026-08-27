# Evidence-presentation repeat independent buildability review

**Date:** 2026-08-27

**RFC:** `rfc/evidence-presentation.md`

**Verdict:** return to author before acceptance

**Scope:** repeat review of the D1664–D1673 amendment against the live compiled manifest, the
executable D1673 seal harness and the current intent tier. No production or protected-design edit.

The amendment materially repairs six of the original nine findings. The projection/consumer
identity is no longer confused, the process and wire seals have a feasible executable shape,
convention metadata is tied to source receipts, citation content is bound, enum values are coupled
to their vocabularies, chart scales are registered, and the structured viewer is honestly narrowed
to a read-only schema-coupled surface.

It is not yet buildable. The pass measured the live presentation population rather than accepting
the one positive vertical slice as representative. That exposed one new blocker and showed that
two original blockers remain unresolved.

## R1 — the instrument derives a population but the specification does not map it (D1862)

The live `PRIMARY_EVIDENCE_MANIFEST` contains **210 bindings**, of which **117 distinct
consumer@version × projection@version pairs** expose at least one non-`machine_condition` form,
across **20 consumers**. The amended RFC requires every pair to own an exact payload parser,
retained operand paths, one or more component ids, complete form coverage, convention/scale policy
where applicable, and executable retention assertions.

Only one of those 117 pairs is executable in D1673:
`pack.authored.claim_delivery@1 → guidance.authored_claim@1 → claim`. The RFC publishes no
set-equal current mapping and no family table from the other 116 pairs to their component(s),
payload parser, retained paths or assertions. The two prose notes for clocks and move-quality
grades do not close that population.

This is not mechanical wiring an implementer can safely infer. A single current structural
projection can plausibly render as `square_set`, `magnitude`, `count_with_denominator` or an
Inspector-only structured fact depending on its retained operands and consumer. The Explorer
population record can decompose into both `distribution` and `outcome_split`. The Review Story
bindings mix titles, ranks, evaluation shifts, outcomes and exact markers. Choosing those shapes
is learner-visible product semantics, and `make component-coverage` can only reject missing rows
after somebody has made those choices; it cannot author them.

**Required repair:** publish an executable, set-equal adapter plan for the current derived
population, grouped only where the group shares an exact payload parser, transform and retention
assertions. The plan must name every output component and served form. If 117 pairs are too large
for one implementation checkpoint, split checkpoint A by bounded consumer families and keep each
family set-equal; do not leave the remaining mappings as implementer judgement.

## R2 — the abstention type still permits impossible lifecycle states (D1668)

`AbstentionOperand.request` accepts both `pending` and `settled`, while the same operand requires
`absence: "withheld" | "unavailable" | "failed" | "empty"`. A pending request must therefore
claim a terminal absence before it has settled. Values such as `pending + failed` and
`pending + empty` satisfy the proposed type even though §3.11 says those states are distinct.

The lifecycle paragraph also invalidates a response on a “node revision”, but the run has no such
authority; D1858 already corrected the module/hint drafts to use the event-head, active cursor and
disclosure-boundary decision stamp. Reintroducing a fictional revision in the presentation layer
would give the same request two freshness models.

**Required repair:** use a discriminated lifecycle union. `pending` carries request identity and
the real shared decision stamp but no terminal absence; a settled-abstention arm carries its
terminal absence and required source/provider receipt; unopened modules construct no receipt.
Consume the same freshness identity as the owning provider/module operation and add invalid
pending/terminal combinations plus stale-decision-stamp negatives.

## R3 — checkpoint A still crosses an undischarged owner-only design deviation (D1672)

The two-checkpoint landing isolates module/hint/arrow dependencies from the foundation, which is a
real improvement. It does not isolate Deviation 1. Checkpoint A itself adds the component layer
beneath `design/05`'s form inventory and corrects `design/03`'s B1 residual, while Discharge D1 is
still blank and the protected design documents contain no component-layer amendment. The owner's
request for proper components opened the exploration/RFC work; it did not write the design-tier
change the RFC itself says is owed.

**Required repair:** Marco either approves the component layer as the intended interpretation and
authorizes Claude to mirror it into `design/03` and `design/05`, or changes/refuses it. Record and
land that ruling before acceptance. Checkpoint B may remain dependency-gated after that; checkpoint
A may not implement an acknowledged, still-unruled intent deviation.

## Re-review entry condition

Re-review after the current binding population has a set-equal executable adapter plan, the
abstention lifecycle is a valid discriminated union over the shared decision stamp, and D1 is
discharged by an owner ruling plus the protected-design amendment. The next review should sample
at least one multi-component source (Explorer), one exact relation/square family, one numeric
convention family and one author/operator-only family in addition to the authored-claim slice.
