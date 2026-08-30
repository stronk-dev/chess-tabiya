# Module registration — third author repair

**Date:** 2026-08-30

**Scope:** author repair for [[D2164]]–[[D2170]]; no production implementation.

## Outcome

The second review was correct about every generated artifact, but its requested 117 callable
profiles exposed a deeper boundary error: a learner module must not become another evidence
collector. Detectors, providers, path compilers and Review each own subject identity, acquisition,
absence and sealing. Reinvoking their internal functions from a generic module assembler would
create a second authority and make presentation behavior depend on which path collected a fact.

The direct-call plan is withdrawn. The two generated JSON artifacts now describe requirements:

- 117 accepted projections, each assigned to one upstream sealed evidence-pool contract;
- five complete source-operation requirements (input, invocation, extraction, parser, abstention,
  seal), each explicitly awaiting its owning RFC/implementation;
- nine exact external DAG inputs with acquisition authority and subject grain;
- 205 non-hint module/projection requirements whose policies derive from the author module table
  and whose sessions derive from `WORKFLOW_CONTEXT_POLICIES`;
- no fabricated presentation adapter ids—each row waits for an exact registered module pair; and
- an explicit empty Guided Hint entry blocked on [[D1639]], with non-empty family/rung and Cartesian
  set-equality requirements.

The requirement artifacts use `completionClaim: requirements_only`; every evidence row is
`awaiting_upstream_sealed_operation` and every binding row is `blocked_dependencies`. This is an
intentional refusal to turn an inventory into a false implementation claim.

## Verification

`make module-registration-author-contract-update` regenerated both digest-sealed artifacts.
`make module-registration-author-contract` passes 11/11. The tests prove authority derivation,
source-contract completeness, grain-specific joins, exact source-input closure, non-vacuous Guided
Hint blocking, absence of fabricated adapters and the refusal of an executable completion claim.

Fresh independent review is still required. No RFC acceptance, schema/content mutation or
production implementation is authorised by this repair.
