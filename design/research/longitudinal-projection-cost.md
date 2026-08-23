# Longitudinal projection cost — the synchronous whole-run path is refused

- **Question:** can `rfc/longitudinal-store.md` recompute the complete legal-alternative
  population over every prior decision after each run mutation?
- **Ledger:** D1405
- **Preregistered:** `planning/longitudinal-store/d1405-cost-preregistration.md`
- **Instrument:** `tools/d1405-longitudinal-cost-harness/`
- **Binding result:** `planning/longitudinal-store/d1405-longitudinal-cost-results.json`
- **Measured commit:** `0d4e27f`
- **Verdict:** **NO — synchronous whole-prefix replay is refused at every measured length** `[V]`

## Result

The clean-extraction run used the committed 108-game / 6,991-ply imported sample and evaluated
the played edge plus every legal alternative at every decision. The pre-existing product boundary
is 500 ms for post-move/uncached server work (`design/02-product-shape.md` §UX commitments). `[V]`

| terminal prefix | fixed paths | p50 | p95 | max | evaluated edges | exact all-mutation replay edges | stored ref bytes |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 20 plies | 8 | 10,395 ms | **11,440 ms** | 11,440 ms | 5,095 | 50,385 | 242,340 |
| 40 plies | 8 | 22,253 ms | **23,433 ms** | 23,433 ms | 10,971 | 213,410 | 503,933 |
| 80 plies | 8 | 33,182 ms | **42,557 ms** | 42,557 ms | 18,961 | 816,142 | 1,027,616 |

All three latency gates fail: p95 is **22.9×**, **46.9×** and **85.1×** the 500 ms boundary.
Terminal p95 grows 3.72× from 20→80 plies, just below the preregistered fourfold diagnostic. That
does not rescue the schedule: exact cumulative work for invoking the terminal projection after
every mutation grows **16.2×**, 50,385→816,142 evaluated edges. The terminal projection is roughly
linear in run length; repeating it over every prefix is quadratic. `[V]`

The byte arm does not confuse raw alternative events with stored refs. The compiler emitted
519,806 / 1,195,584 / 1,957,795 events over the three arms, while the RFC-shaped projection stores
one opportunity/occurrence decision ref per family row. Event populations retain canonical
digests; only deduplicated decision refs contribute to the byte column. `[V]`

## Bulk import

The fixed 25 complete games contain 1,750 plies. One projection per complete game evaluated
50,586 edges and emitted 5,215,076 events in **738.8 seconds**: **0.0338 games/second**, or about
29.5 seconds/game mean. Per-game p50/p95/max is **30.1 / 45.8 / 49.1 seconds**. Canonical stored
refs occupy 2,727,252 bytes before database/index overhead. `[V]`

This makes bulk projection a durable background job with bounded batches and progress, not work in
the import request. A 100-game import is roughly 49 minutes at this measured throughput before
database cost if processed serially; that last figure is arithmetic over the measured throughput,
not a separately timed arm. `[V]`

## What this result does and does not license

It **refuses synchronous whole-run replay on every mutation**. The RFC must:

1. derive at most the newly committed decision on the move path, using append/upsert semantics;
2. keep a complete rebuild authoritative at run close or in a background queue;
3. process imported games in bounded background batches with observable completion/failure;
4. measure the isolated single-decision append path before claiming it fits 500 ms.

The final point is load-bearing. Dividing measured terminal time by decisions puts the one-edge
compiler near the whole post-move budget already; this experiment did not preregister or report a
per-decision latency distribution, so it cannot clear incremental work. `[V]`

The result is a **lower bound**, not acceptance evidence for the current RFC. Review blocker B2
established that committed `localSemanticEvents` cannot construct 21 of 67 registered families:
13 complete-population avoidance relations, `trade_completed`, and seven recorded-path Wave-C
families. The measurement also excludes database transactions, indexes and request concurrency.
The repaired constructor registry must repeat these arms; adding the missing work cannot make this
baseline faster by itself. `[V]`

## Instrument correction before binding

A shared-tree smoke run was discarded. It initially priced one stored ref per emitted alternative
event, which is not the RFC schema. Before any binding result was read, the preregistration and
harness were corrected to retain a count/digest for the raw event population and separately price
the deduplicated family-row decision refs. Population sizes, timing arms, 500 ms boundary and
decision rule did not move. `[V]`

## Source receipt

- PGN SHA-256:
  `a10a233e8e51f6a0877f65cee417339080d2fd32cd22886f755f576c84fa58ec`
- compiler/source digest:
  `9d575c4e61d4e328a91d441bd6b191ae9f51c9fff426d6d86a4a278c7991e5cf`
- every timing fragment and the aggregate name commit `0d4e27f`; the aggregator refuses mixed
  commit/PGN/source receipts. `[V]`
