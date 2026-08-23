# Learner Modules implementation return

**Date:** 2026-08-23

**Scope:** D1016/D1017; buildability return before the 181-row registry and selector implementation

**Authority:** read-only/code audit of accepted `rfc/learner-modules.md`; no product semantics chosen

## What already landed

Commit `2a54d05` is a real foundation checkpoint. It adds and exports:

- the closed eleven `ModuleId` values;
- the thirteen-field `ModuleDeclaration` shape;
- the distinct `at_commit` timing image;
- registry completeness, ceiling, awaiting/compiled closure, avoidance-timing, staged-hint and
  one-board-adjacent-seat checks;
- five focused tests over those compiler boundaries.

It does **not** add `MODULE_DECLARATIONS`, the ten manifest consumers, 179 compiled eligibility
rows, `production.module_local@1`, lift-table governance, semantic reducers, packets/renderers,
capabilities output or the three-RFC discharge closeout. The honest lifecycle state is therefore
“implementation checkpoint,” not accepted/unstarted and not complete.

## Why the next slice must return

The owner ruled that budgets are backstops and semantic reducers are the mechanism. The accepted
RFC names three reducers but does not define inputs or executable relations for any of them.

| Required reducer | Missing contract at HEAD | Why an implementer cannot infer it |
|---|---|---|
| Same-fact dedup across projections | a cross-projection fact identity or registered equivalence relation | `observationIdentity` accepts only `StructuralObservation`; projection id + operands treats two renderings of one fact as different by construction |
| Subsumption | a declared directed relation plus payload predicate | neither the evidence manifest nor module declaration has `subsumes`; inferring entailment from prose would manufacture chess semantics |
| Per-position novelty | packet-history key, window, ordering, storage/source and honest-absence behavior | no module packet persists; “recent” could mean current run, game, session, account or wall-clock and changes product behavior |
| Overflow instrument | typed event, fields, sink, transaction/failure behavior and reader | no reduction-quality symbol exists; logging to console, run events or durable learner data have materially different effects |

There is also a direct normative contradiction:

- §3 step 3 says **“keep the top `maxFacts`”**;
- A9 says facts beyond `maxFacts` **“are never admitted”**;
- OQ1 says exceeding the backstop logs a reduction-quality event **“rather than silently
  truncating.”**

A selector can satisfy the first two while violating the owner ruling. A green fixture would not
tell which contract shipped.

## Minimum author amendment

Before production implementation resumes, the RFC needs:

1. A literal versioned reducer declaration schema. Each reducer names its typed input, output,
   relation authority, order in the pipeline and abstention behavior.
2. A closed cross-projection equivalence/subsumption table. Every pair names the compared payload
   fields; absent declaration means unrelated. No renderer prose participates.
3. A novelty contract: exact key, bounded window, source of history, ordering and provider-off /
   unavailable-history behavior. If persistence is deferred, novelty must honestly abstain rather
   than become process-local memory.
4. A typed overflow observation with fields at least `{moduleId, admitted, afterReducers,
   backstop, dropped, reducerVersion}`; name its sink and reader. Emission failure must not widen
   assistance or fail a chess move.
5. One pipeline order replacing the contradictory clauses, e.g. admission → exact dedup →
   declared subsumption → bounded novelty → deterministic ordering → backstop + overflow
   observation. The author may choose a different order, but it must be singular.
6. Able-to-fail fixtures: cross-projection duplicate, asymmetric subsumption, unavailable history,
   novelty-window boundary, overflow emission, and a control proving a merely similar fact is not
   collapsed.

These are contract questions, not implementation detail. Once amended and reviewed, the existing
compiler checkpoint can be retained and the implementation can proceed without guessing.

## Collision boundary

Claude is concurrently amending semantic collectors. Resume F5 only after that amendment lands or
with an explicit file split: its projection ids feed the module tables, while the F5 production
sites include `packages/runtime/src/evidence-catalog.ts` and `apps/server/src/capabilities.ts`.
The current dirty semantic test files are not part of this return and were not edited.
