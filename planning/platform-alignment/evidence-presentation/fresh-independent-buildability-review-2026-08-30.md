# Evidence presentation — fresh independent buildability review

- **Reviewed:** 2026-08-30
- **Input:** `rfc/evidence-presentation.md` after the D1862/D1668 author amendment
- **Verdict:** **RETURN TO AUTHOR / NOT ACCEPTED**
- **Reproduction:** `make evidence-presentation-fresh-review` — 6/6 blocker arms
- **Prior contract:** `make evidence-presentation-author-contract` remains green (5/5 plus lifecycle typecheck)
- **Production status:** no component vocabulary, adapter, receipt, parser, migrated surface,
  label registry, theme sweep or module seat is authorized by this return

The amendment fixes the previous review's two mechanical findings: all 117 live non-machine
binding pairs now occur in a plan, and pending versus settled abstention is a valid discriminated
union over the shared decision stamp. It still does not define 117 executable adapters. The fresh
pass followed the plan from live binding forms through component capabilities, current consumer
semantics and the sentences that must survive migration. Six seams remain, including an
under-counted producer repair.

## B1 — forms are copied but never assigned to components ([[D2135]])

`AdapterFamilyPlan` has `components[]` and one family-level `formPolicy`. It has no
component→form mapping. The author test proves only that each row copied the binding's forms.
That is not serviceability. Two current witnesses are already impossible under §3:

- `structured_document` serves only `panel`, while all four authoring-record pairs advertise
  `list,panel` and are assigned only `structured_document`;
- `magnitude_trail` serves `panel,timeline_mark`, while `compare.engine_trajectory` advertises
  `list,panel` and is assigned only `magnitude_trail`.

Families naming two components are more ambiguous: nothing says which component owns which form,
whether both render, or whether one component's equivalent sentence satisfies the sentence form.

**Required repair:** expand the authority to exact adapter rows with one component and literal
served-form subset per row. Derive set equality over `(consumer,projection,form)`, verify every
form is legal for that component, and reject overlapping or uncovered forms unless one explicit
composition row owns them.

## B2 — the census has no executable visual-consumer population ([[D2136]])

The RFC says `PRESENTATION_CONSUMER_CLASSES` assigns each real visual/audio consumer to ordinary,
Inspector or author/operator. That authority does not exist in the plan. The census simply takes
every binding with any non-machine form. It therefore includes internal operations such as
`opponent.selection` and `runtime.repertoire_scan`; the former's own source declaration says its
raw response is not learner-facing, and neither implementation is a presentation route.

Roles do not repair this: an operator-authorized computation is not automatically an operator UI.
Conversely, an indirect route can be learner-visible without its operation id looking visual.

**Required repair:** publish a literal, set-checked consumer classification tied to actual route /
application / component reachability. Separate `presented`, `inspector_presented` and
`non_presentational_operation`; then derive the adapter population from the first two classes,
not from generic F1 forms.

## B3 — the scope fence forbids the plan's own prerequisite edits ([[D2137]])

The plan contains six pair repairs requiring producer operands and one visual-binding removal.
Those facts live in `packages/runtime/src/evidence-catalog.ts`. Criterion 18 simultaneously says
the landing edits no evidence-catalog bytes; the header claims no evidence resource; checkpoint A
requires migrating the current population. `component-coverage` cannot be green under all three
statements.

**Required repair:** split an explicit manifest-repair predecessor/checkpoint that owns and
versions the six operand changes plus the binding removal, or widen this RFC's scope and register
the shared-resource mutation. Re-census after that landing. Do not count `repair` placeholders as
executable adapters.

## B4 — `fact_statement` has no renderer registry ([[D2138]])

The component shape references `FactStatementRendererId`; neither the RFC nor author plan defines
its union/registry. Families carry only the assertion string `registered_renderer_only`. No row
names an id, deterministic template, operand image, output forms or negative that changes a
template operand. The implementer must still choose the learner sentence—the exact judgement the
plan was introduced to remove.

**Required repair:** publish a closed renderer registry keyed by exact adapter identity. Each row
must name the retained input algebra and deterministic rendering operation; derive the renderer-id
union and set equality from it. Cross renderer swaps, dropped operands and one changed operand per
template while preserving the law-8 distinction from authored `claim`.

## B5 — abstention's type is closed but its learner semantics are absent ([[D2139]])

The repaired pending/settled union is valid. The RFC also requires `PRESENTATION_QUESTIONS` and
`PRESENTATION_ABSENCE_REASONS` to be set-equal to abstaining adapters, but neither registry exists
and the 117-row plan records no question id or reason mapping. “What was unavailable?” and “why?”
would still be authored during implementation, so honest-empty can regress to generic copy while
the lifecycle test stays green.

**Required repair:** add exact question/reason rows to every abstaining adapter, sourced from the
projection, provider result and module empty behavior. Derive both registries and their labels;
cross missing, extra, wrong-producer and pending-as-terminal mappings.

## B6 — the six-repair count omits a live dropped-operand family ([[D2140]])

`comparisonNarrative` currently renders one of two consequence sentences: terminal learner result,
or reached plies plus objective state. Its declared `run.record.consequence` operands and the new
plan both retain only `context,terminal`. The registered renderer cannot preserve current behavior
without reading undeclared `outcome`, `plies` or `objectiveState`. That is the D1664 side door the
retention contract is meant to close, and means the six-row repair census is incomplete.

**Required repair:** define a discriminated consequence payload/operand union for terminal and
nonterminal arms, retain every rendered operand, and add byte-changing negatives for outcome,
plies and objective state. Re-audit every fact-statement family against its current renderer before
publishing a new repair count.

## Existing owner decision still required ([[D1672]])

Even after B1–B6 are repaired, checkpoint A remains unaccepted until the owner approves the
component layer as the intended interpretation and authorizes its mirror into protected
`design/03` and `design/05`, or changes/refuses it. This review does not duplicate that existing
ledger row.

## Re-review order

1. Fix the population authority and split/claim the catalogue repair.
2. Publish per-form adapter rows plus fact and abstention renderer registries.
3. Repair consequence operands and re-audit every retained path against current output.
4. Obtain D1672's owner ruling and protected-design mirror.
5. Invert all six arms, preserve the prior author checks, run governance and full verification,
   then request another fresh review.

No production, manifest, schema, content, archive or protected-design byte is authorized by this
return.
