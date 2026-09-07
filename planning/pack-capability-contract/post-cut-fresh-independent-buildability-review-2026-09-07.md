# Pack-capability contract — post-cut fresh independent buildability review

- **Date:** 2026-09-07
- **Scope:** the 1,526-line post-cut `rfc/pack-capability-contract.md`, its twelve named dependents,
  claims/register rows and sealed schema-transition artifact. The moved asynchronous job design is
  read only to verify ownership; it is not reviewed here.
- **Instrument:** `make pack-capability-cut-fresh-review`
- **Verdict:** **returned** on [[D3120]]–[[D3123]]. The cut is directionally sound and the twelve-
  dependent boundary holds, but the smaller document is not yet implementable from one authority.

## What survived

The review found no reason to restore the asynchronous provider/job model. The structured
capability identity, semantics digest, applicability closure, pack-side `requires` stamp,
deprecation/refusal algebra and D566 regression remain the correct foundation. Criterion 15 also
breaks the claim-anchor dependency cycle in the right direction: F3 supplies only a generic
structured identity; the later consumer owns its binding grammar and migration.

## Returned seams

### [[D3120]] — the cut removed the operation type but retained a field and criteria that consume it

`CapabilityDeploymentBinding.operationIds` is still typed as
`readonly CapabilityOperationId[]`, while the only `type CapabilityOperationId` definition moved
to `planning/pack-capability-contract/evidence-job-durability.md`. The same split survives in prose:
§5.1 and criterion 16 require effects to come from a “compiled consumer registry”, but the closed
operation population and its capability-source mapping are explicitly successor-owned. An
implementer must either recreate an undeclared subset in F3 or import a returned draft.

Repair by keeping the two ruled causes and public reachability in F3, while moving operation IDs,
consumer effects and their fixtures wholly to the successor; or move the exact closed synchronous
operation registry back. Do not leave an unnamed middle registry.

### [[D3121]] — the schema migration is both same-commit and deferred

§4.1a says the implementing commit applies the ordered 0.28→0.29→0.30 stages and rewrites all 92
documents. Criterion 18 and discharge D5 say the same. §6 says the first software landing only
emits target rows, does not apply them, and waits for a later D560-authorized invocation. [[D3033]]
was introduced specifically to dissolve that wait, but only half the document was updated.

Choose one sequence and make §4.1a, §6, criterion 18 and D3/D5 identical. The current owner ruling
supports same-commit mechanical schema migration while continuing to hold authored-content and
claim-binding waves.

### [[D3122]] — the migration register names the wrong owner

The parent `tabiya-claims` block and `rfc/README.md` still assign the
`evidence_job_batches`/`evidence_jobs` storage position to `pack-capability-contract.md`; the parent
states those tables left, and their normative DDL now exists only in the unregistered successor in
`planning/`. This was acknowledged as a future transfer but never received a ledger identity.

Promote the successor and transfer the claim/register row atomically. Repoint
`concept-registry.md` behind the successor if that storage ordering is still required. F3 should
claim only lane 0.30 after the transfer.

### [[D3123]] — the sealed migration population hides its fixture convention

The transition artifact contains 92 rows: 86 production pack documents and six `.browser.json`
fixtures. The RFC calls all 92 “authored documents” and never names the fixture suffix, despite
[[D55]]/[[D284]] establishing that corpus instruments must state which convention they use. This
does not require dropping fixtures: schema fixtures should migrate with the schema. It requires the
population and criteria to say **86 production + 6 browser fixtures**, so release-content counts
cannot silently inherit the larger denominator.

## Buildability decision

This is a bounded return, not another request for a wider model. The repair is four local actions:
close or relocate the orphaned operation/consumer seam, choose the already-ruled migration
sequence, transfer the storage claim with successor registration, and name the fixture split. A
fresh check after those edits may assess acceptance without revisiting the moved durable-job
implementation.
