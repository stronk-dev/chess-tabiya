# D1931 recorded semantic path exact-source closure — results

Measured 2026-08-27T17:38:19.697Z on v26.7.0 darwin/arm64; population sha256:663e2f4d09b2b34089acdcc52016059b0ca8e064921973ba79b39f71a7695d7c.

| mode | plies | samples | preparation p95 | windows p95 | total p50 | total p95 | max | 500 ms |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| eager | 20 | 36 | 352.2 ms | 48.2 ms | 378.9 ms | 397.5 ms | 401.4 ms | pass |
| exact_source | 20 | 36 | 18.1 ms | 47.9 ms | 61.7 ms | 64.7 ms | 64.9 ms | pass |
| eager | 40 | 36 | 717.1 ms | 92.6 ms | 755.3 ms | 803.6 ms | 814.9 ms | REFUSE |
| exact_source | 40 | 36 | 36.9 ms | 93.3 ms | 120.4 ms | 129.7 ms | 131.2 ms | pass |
| eager | 80 | 36 | 1234.1 ms | 157.3 ms | 1249.9 ms | 1391.2 ms | 1403.9 ms | REFUSE |
| exact_source | 80 | 36 | 56.8 ms | 156.7 ms | 199.5 ms | 212.7 ms | 215.8 ms | pass |

**Preregistered verdict:** exact_source_sync_pass.

Every candidate path produced byte-equal sorted event ids, complete receipt bytes and result digest versus the eager control before timing was admitted.
