# Pack capability contract — twelfth author repair

- **Date:** 2026-09-04
- **Repairs:** [[D2587]]–[[D2592]]
- **Status:** author repair complete; another genuinely fresh independent review is required
- **Gate:** `make pack-capability-twelfth-author-repair` — complete retained eleventh target plus
  6 new executable controls

## Repair

The application receipt is no longer caller-mintable. One transaction operation accepts a parsed
CAS-owned before-run plus the stored success, constructs the evidence/objective events, composes the
registered immediate-guard result, constructs the after-run, and receipts the exact retained
journal suffix. A copied result or invented event/revision array has no authority.

The objective request parser now covers its complete live recursive shape and copies/freezes every
nested collection. Stored batches validate against one parsed run-identified snapshot. Admission
derives the consumer from each of the three sealed origins and the race/replay instrument executes
all three. A new per-run allocator row increments transactionally with settlement and survives both
result cancellation and process restart.

The author model caught two construction defects before the gate passed: recursively copying a
batch erased the WeakSet authority of its already-parsed children, and the concurrency fixture
attempted directory cleanup before worker exit. The final controls retain parsed child identities
and await worker termination, so both boundaries are observable.

## Able-to-fail controls

The gate refuses omitted/crossed guard outcomes, mutable or incomplete nested objective requests,
copied or foreign run snapshots, a caller-created application result, wrong origin/consumer rows,
and sequence reuse after settle → rewind → close/reopen → settle.

## Boundary and next action

No production, schema, migration, API, storage, pack, content or protected-design byte landed. The
pack schema 0.30 and 92-pack apply remain held. Another genuinely fresh independent review must
reconstruct the transaction, recursive parser, run join, all-origin admission and durable allocator
before acceptance or implementation.
