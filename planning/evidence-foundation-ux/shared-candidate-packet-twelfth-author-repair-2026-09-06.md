# Shared candidate packet — twelfth author repair

**Date:** 2026-09-06

## Outcome

The bounded contract repair closes [[D2885]]–[[D2891]] without changing production runtime,
server, client, schema, content or protected design bytes. It replaces the flattened-result seam
with one total-result collector boundary and carries that authority through the complete
asynchronous service.

- returned receipts must equal the active canonical request before publication;
- queue and compile deadlines transfer ownership and every job settles once;
- collector failures retain exact move/projection/reason identity;
- checkmate, stalemate, non-terminal empty and corrupt non-empty terminal states differ;
- cache gauges measure the exact receipt retained by the cache;
- direct and projection hits both refresh LRU recency; and
- loose-piece availability is retained from its one registry invocation, never recomputed.

## Executable evidence

`make candidate-packet-twelfth-author-repair` retains all predecessor reviews and repairs, then
passes 15/15 current behavioral groups and strict TypeScript. The repair includes crossed genuine
receipts, stale queue timers, double completion, typed versus unknown failures, four terminal
states, an independent retained-graph walk, two-entry LRU eviction and single-invocation outcome
controls.

The target is enrolled in `verify-governance`, so ordinary `make verify` and GitHub's governance
job execute this contract.

## Boundary

This is positive author evidence, not RFC acceptance or production implementation. Another
genuinely fresh independent review and `evidence-value-authority` still precede both.
