# Pack capability contract — eleventh author repair

- **Date:** 2026-09-04
- **Repairs:** [[D2563]]–[[D2569]]
- **Status:** author repair complete; another fresh independent review is required
- **Gate:** `make pack-capability-eleventh-author-repair` — 6 groups plus strict TypeScript

## Repair

The ninth-author protocol is superseded by one exact durable-state union. A running row requires
the complete generation-bound lease receipt; a consumed row requires the complete application
receipt; and application receipts cannot appear on another state.

Job and batch request parsers now enforce the closed v1 key sets, schema literals, evidence kind,
search bounds, objective identity, 1–16 cardinality and shared run identity. They return branded
values consumed by the only digest writers/verifiers. One storage validator joins batch columns to
that request, then every contiguous child column/request/digest to its indexed member and immutable
run node/FEN.

Rewind now transforms complete durable rows, including generation fencing and exact cleanup, while
preserving terminal audit rows by identity. Application receipt construction consumes the stored
success and exact one-revision event array, using the shipped engine/tablebase evidence-reference
syntax. Concurrent admission calls `crypto.randomUUID()` after lock-held absence: the winner
constructs one batch plus its jobs and the loser constructs none.

## Able-to-fail controls

The gate rejects owner-only running leases, receipt-less consumed states, application receipts on
admitted rows, arbitrary/unparsed digest values, crossed run/origin/FEN rows, label-only rewind
behavior, reversed or unrelated application events, and fixed/caller ids in the concurrent path.

## Boundary and next action

No production, schema, migration, API, storage, pack, content, digest or protected-design byte
landed. All previous author controls remain required. Another genuinely fresh independent review
must reconstruct the joined model before acceptance or implementation; [[D560]] remains whole.
