# Pack capability contract — tenth author repair

- **Date:** 2026-09-02
- **Rows:** [[D2542]]–[[D2547]]
- **Artifact:** `rfc/pack-capability-contract.md`
- **Executable author evidence:** `make pack-capability-tenth-author-repair` — 6/6
- **Production authorization:** none; another fresh independent review is required and [[D560]] remains whole

## What changed

The durable batch now owns one composite `(id, run_id, origin)` identity. Every child references
that identity and the parser requires exactly the ordered, contiguous child population named by the
canonical batch request. Job and batch requests have closed versioned shapes, explicit nulls and
separate canonical SHA-256 domains.

Every claim and reclaim increments a durable lease generation. Retry, cancellation and settlement
require the exact sealed owner/generation/request receipt, so an expired result cannot affect a
newer lease even when the worker name repeats. Rewind now has a total transition for all eight
durable states rather than referring to in-memory names.

Admission uses `BEGIN IMMEDIATE` with the existing five-second busy timeout. Both batch and job IDs
come from the declared UUID constructor only after absence is observed. The executable gate opens
two SQLite connections at one barrier and proves one winner, one stored child population and one
shared replay result.

Consumption retains an application receipt with the run revision pair, non-empty contiguous event
range and canonical digest. Reload and response-loss replay can therefore distinguish an exact
previous application from corrupt or orphaned consumption.

## Able-to-fail controls

1. a crossed child run beneath a valid batch fails its composite foreign key;
2. same-owner reclaim changes the lease generation;
3. reordered request keys preserve a digest while job and batch domains cannot collide;
4. two concurrent SQLite writers expose one persisted winner and batch id;
5. all eight durable rewind source states have an exact result; and
6. missing or non-contiguous application events cannot produce a receipt.

The retained eighth and ninth author gates must remain green. This repair changes only the RFC,
author instruments and tracking. A genuinely fresh independent review is still required before
acceptance or any production implementation.
