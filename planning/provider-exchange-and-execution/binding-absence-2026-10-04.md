# Binding execution and source absence

This implements D3369's compiler/algebra scope under the implementing provider RFC §2.
It does not complete consumer migration or the authenticated availability service.

## Implemented contract

The closed optional/required policy is retained by the semantic compiler and contributes
to its digest only when explicitly declared. Existing consumer declarations stay unchanged.
Policy is never generated from the consumer's old `providerOff` scalar.

`compileEvidenceConsumerExecution` compiles every binding through the strict projection
compiler. It admits only paths within the binding's latency mode and refuses a binding
with no executable path. Transitive provider leaves require explicit absence policy,
including provider alternatives that the binding's latency excludes. Raw legacy leaves,
missing policy, malformed policy, unknown consumers and duplicate adapters refuse; no
partial consumer image is returned. Immutable snapshots prevent subsequent mutation.

`aggregateEvidenceConsumerSourceAvailability` accepts only authority-compiled metadata
and a set-equal collection of binding results. Any satisfied admitted path is enough for
its binding; failed siblings do not poison it. Missing required-unavailable takes
precedence over required-empty, then available with sorted optional omissions. A truly
local path satisfies itself; local content cannot override another required failure.
`providerOff` is an output of this aggregation, never its input.

## Remaining production adoption

The algebra consumes already-resolved exact-subject path results; it does not establish
source satisfaction, read provider/cache state or issue an evidence receipt. No current
consumer policy is silently changed. The complete consumer image still refuses legacy
source leaves. Whole-manifest execution/digest, explicit actual binding policies, the
closed occurrence-resolver census, public availability and consumer adoption remain open.
Recorded-only failure without an explicit absence policy also refuses instead of
inventing a disposition. That case must be declared when its actual consumer migrates.

D3370 records a concrete Maia migration gap: `human_common` plays the model task's
sampled `bestmove`, retries off-window samples and retains an `offWindow` move when
needed. `MaiaPolicyPage` retains bounded candidate mass but not that sampled move.
D593 establishes that this mass is not the production sampler. Preserving behaviour
requires an explicit sampled-result source contract or an approved sampler migration;
choosing the top candidate would not preserve it. Inspector's D3363 is separate.

## Verification

The normal focused Make target passes 50 tests across three files, including 21 new
binding tests. The complete optional/required truth table is tested in both declaration
orders, alongside actual Explorer transitive and recorded-or-provider paths, latency
exclusion, policy forgery/mutation, raw-leaf refusal and crossed path results. Typecheck
passes with zero Svelte errors/warnings. The complete gate results and receipts follow below.

No source identities, provider operation/parser versions, chess collectors, authored
content, thresholds, presets or bot sampling change. Routine generated metadata/hash
updates are maintenance, not another approval decision. No whole RFC, capability or
milestone is promoted; the full 1.0 goal remains active.

## Canonical metadata maintenance

The first exact-index software run correctly failed the convention-isolation test because
eight generated source-digest declarations were stale. The test was not changed or weakened.
Canonical generation retains all 866 predecessors and adds seven v8 compatibility
successors plus `selection.semantic_policy@3`, for 874 declarations. The reused preservation
instrument's explicit binding mode compares against committed `efe67940` before writing.

Only the requirements in 104 packs/examples/fixtures and 68 matching ledger hashes change.
All authored fields in those documents, 192 other source documents and 275 factory outcomes
are equal. Semantic validation outcomes, cases and external receipts are unchanged; only
implementation/population digest bindings are refreshed. Receipt:
`binding-absence-metadata-2026-10-04.json`. Its check/update targets are checkpoint instruments,
not perpetual CI gates against an obsolete baseline. Normal current generators/history,
lifecycle, corpus and migration checks remain the release gates.

## Complete software gate

The corrected `make staged-software-contracts` passes against exact index tree
`765769a8d89bdd6835edbb8f5e25dff931c5ee7f`: 2,855 tests/325 files, seven isolated
performance tests/four files, zero type errors/Svelte warnings and downstream build,
packaging, authority, history, lifecycle and migration checks. The canonical migration
plan has 352 documents and zero remaining rows. Proof:
`binding-absence-software-2026-10-04.json`. Product, test, content and schema bytes are
frozen after this snapshot; only final tracking/results/proof/log text follows.

## Completed release checks and closeout

`make verify-content` passes 223 tests/23 files, zero clearance errors and all 104 exact
requirement documents. `make provider-exchange-check` passes 365 test executions, including
the new 50-test binding target. Browser CI passes 111 journeys with one optional real-Maia
latency measurement skipped and zero retries. Complete governance passes.

Ledger/work-state, queue, RFC/register, documentation, anchored roadmap and the append-only
exploration log close out together. Only D3369's compiler/algebra scope closes. D3370 stays
durably blocked on the provider contract; actual policy adoption, closed source resolution,
authenticated availability and whole-manifest execution/digest remain open. Full RFCs and
learner milestones are not promoted. Final staged-process checks and normal commit hooks
run before commit; unrelated shared changes are excluded and nothing is pushed.
