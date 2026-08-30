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

## Final-registry cost discharge

`make longitudinal-store-cost` reran both preregistered instruments against committed production
inputs and the final 67-member registry:

- D1405 complete-prefix p95 was **13.08 / 26.45 / 47.29 seconds** at 20 / 40 / 80 plies; every arm
  fails the 500 ms request budget. The 20→80 p95 ratio is **3.62×**, so growth remains below the
  preregistered 4× shape ceiling while absolute latency still refuses request-path projection.
- The 25-game bulk arm evaluated **50,586 edges** across **1,750 plies**, emitted **5,215,076
  events**, and took **828.04 seconds** (**0.030 games/s**).
- D1405b measured 144 individual decisions over 46 edge, 13 population and 8 path-deferred
  registry members. Combined latency was **531.5 ms p50 / 872.2 ms p95 / 921.2 ms max**. The
  middlegame p95 was **902.7 ms**; endgame p95 was **453.4 ms**.
- SQLite publication was **0.128 ms p95**. The collector and legal-alternative expansion, not the
  durable store, own the budget failure.

Verdict: `REFUSE_NATIVE_INCREMENTAL`. Reads use stored transaction-fixed snapshots; writes enqueue
the bounded background worker. A later synchronous path would require its own RFC and a new
preregistered gate. The measurement target now removes its four intermediate fragments after a
successful aggregate, so ordinary use leaves only the two canonical result artifacts.

## Boundary

This is authoring, not implementation. No production migration, storage method, application
worker, API, consumer, content, archive or protected-design byte changes here. Fresh independent
buildability review remains required.
