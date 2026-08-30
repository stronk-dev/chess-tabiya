# Longitudinal store — second author repair receipt

Date: 2026-08-30

## Result

The [[D2063]]–[[D2069]] return is repaired as one durable projection operation:

- the exact semantic sign is part of registry, admission, durable key and read filters; population
  rows also retain their base-family source sign;
- a second literal artifact pins all 67 projection sign subsets to the runtime declarations;
- complete-population arithmetic invokes the real legal-edge/semantic-event boundary and defines
  deduplication, declinability, occurrence, alternative share, forced moves and unavailability;
- SQLite persists `claimed_requested_seq=N` separately from mutable `requested_seq=M`, with an
  actual CAS crossing equality, M>N, revision and generation failures;
- account deletion marks retained shared runs `account_deleted`; rebuild admits only durable
  `profileable` runs and cannot recreate private behavior under `__legacy`;
- literal migration SQL specifies four STRICT tables, one additive run disposition, five indexes,
  and direct constraints for counts, shares, provenance, revisions, sequences and claim state;
- `readLongitudinalSnapshot` is the sole authenticated future-consumer boundary over a
  transaction-fixed cut vector and closed complete/pending/failed/unavailable union; and
- one provider-free `LongitudinalProjectionWorker` has start/stop, wake+poll, finite oldest-first
  batches, lease reclaim and drain-on-stop semantics; `make longitudinal-worker-once` is its bounded
  operator door, distinct from rebuild.

## Executable evidence

- `make longitudinal-store-author-contract`: **19/19 pass**.
- `make longitudinal-store-fresh-review`: **0/7 pass**, the intended inversion of the unchanged
  historical blocker assertions.
- The SQLite arms execute the literal migration and publication CAS rather than inspecting prose.
- The complete-population arms cross gained/lost identity, duplicate operands, all/none/mixed,
  forced and unavailable populations, including avoidance direction.

## Boundary

This is authoring, not implementation. No production migration, storage method, application
worker, API, consumer, content, archive or protected-design byte changes here. Fresh independent
buildability review remains required.
