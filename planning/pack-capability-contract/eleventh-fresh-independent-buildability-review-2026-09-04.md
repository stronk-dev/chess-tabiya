# Pack capability contract — eleventh fresh independent buildability review

- **Date:** 2026-09-04
- **Document:** `rfc/pack-capability-contract.md`
- **Reviewed repair:** [[D2563]]–[[D2569]]
- **Verdict:** **returned on [[D2587]]–[[D2592]]**
- **Reproducer:** `make pack-capability-eleventh-fresh-review` — 6/6

## Scope and method

The review retained every earlier author control, then crossed the eleventh repair with the live
run mutation, the complete runtime objective-request type, the claimed run-snapshot join, all three
enqueue origins and the exact durable SQL image. Each finding is an executable value the current
repair either accepts when it must refuse or refuses when it must accept.

No production, schema, migration, API, content or protected-design byte was implemented. The
review concerns the durable evidence-job contract that those later implementations would consume.

## Findings

### [[D2587]] — valid immediate-guard events are outside the receipt model

Production `RunService.applyEvidence` attaches the settled evidence, optionally applies its stored
objective proposal, and then invokes `applyRecordedEngineGuard` when the run policy is
`immediate_guard`. That guard can append `feedback.generated` to the same run mutation. The repaired
constructor permits exactly one attached event or exactly attached+objective and rejects any third
event as “beyond stored success.” It therefore cannot describe a valid live transition.

The repair must derive the complete policy-dependent appended suffix inside the run transaction.
The provider settlement grounds evidence; it is not the complete authority for every resulting run
effect.

### [[D2588]] — the nested objective request escapes exact parsing and immutability

The outer job request has a closed key set, but a non-null `objectiveRequest` is checked only for
object shape and matching run/node/FEN. The runtime type also requires `packId`, `packDigest`,
`objectiveState`, `evidenceRefs` and `policyConfig`; the model accepts all of those missing and
accepts arbitrary extra keys. `Object.freeze(structuredClone(...))` freezes only the outer object.

The reproducer mutates nested `policyConfig` after the job is branded and obtains a different digest
from the same accepted object. The exact parser/digest claim therefore does not survive its own
nested value. Recursive parsing and immutable copies are required before branding.

### [[D2589]] — an application receipt is not joined to a run transition

`applicationReceipt` receives caller-supplied revision numbers and an event array. It receives no
CAS-owned before/after run, retained event journal or current event tail. Correctly shaped bytes at
invented revision 40→41 and sequence 900 mint a valid receipt even when the run contains neither.

The receipt must be constructed only by `applyEvidenceAndConsumeJob` from its actual before/after
run and exact appended journal suffix. Reload validation must join the stored range back to that
retained journal; arithmetic adjacency alone is not a transition receipt.

### [[D2590]] — the immutable node/FEN lookup has no run identity

`validateStoredBatch` accepts `Map<nodeId,fen>`. Although batch and job columns are joined to their
requests, nothing establishes which run produced that map. The reproducer labels an otherwise equal
map as run B and validates it for run A. A same-node/FEN collision is enough to cross snapshots.

Use one parsed run snapshot or a run-branded node lookup whose run identity must equal the parsed
batch request.

### [[D2591]] — concurrent admission hard-codes the explicit-analysis consumer

The concurrent worker parses all three declared origins but writes `consumer_id='runtime.analysis'`
for every child. The exact DDL permits that pair only for `explicit_analysis`; real SQLite rejects
both `story_completion` and `run_enrichment` under their otherwise lawful requests. Criterion 24's
“every origin” promise is therefore false in the executable authority.

Derive consumer and provider-off behavior from the sealed origin inside the same transaction and
exercise first-flight/replay for all three origins, not just the public analysis arm.

### [[D2592]] — result ordering is unique but not durably monotone

The exact schema stores nullable `result_seq` and a uniqueness constraint, but no retained per-run
allocator. Rewind explicitly clears `result_seq` from an unconsumed success. The reproducer settles
sequence 1, rewinds it to cancelled, then settles another row at sequence 1; SQLite accepts the
reuse. A process counter would avoid it only until restart, and `MAX(result_seq)+1` cannot see the
cleared allocation.

Specify a transactional durable counter or append-only allocation authority. The negative fixture
must prove settle→rewind→restart→settle produces a strictly later sequence.

## What survives

The eleventh repair did close its bounded predecessor defects: lease and consumption receipts are
structural in the strict state union; outer request keys and digest domains are closed; batch/child
columns join their request values; rewind mutates whole rows; and UUID construction occurs only in
the lock-held winner. Those controls remain required and must not be weakened.

## Boundary and next action

`pack-capability-contract` remains draft and implementation remains unauthorized. A bounded twelfth
author repair must join complete guarded run effects, recursively exact objective requests, actual
run snapshots/transitions, all three origin mappings and a monotone durable result allocator. It
then needs another genuinely fresh independent review. [[D560]] and the held pack/schema migration
remain whole.
