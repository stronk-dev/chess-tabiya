# D1931 recorded semantic path exact-source closure — results

Measured 2026-09-04T08:49:50.758Z on v24.20.0 darwin/arm64; population sha256:663e2f4d09b2b34089acdcc52016059b0ca8e064921973ba79b39f71a7695d7c.

| mode | plies | samples | preparation p95 | windows p95 | total p50 | total p95 | max | 500 ms |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| eager | 20 | 36 | 352.4 ms | 56.1 ms | 382.3 ms | 408.6 ms | 415.6 ms | pass |
| exact_source | 20 | 36 | 19.6 ms | 57.5 ms | 70.1 ms | 74.3 ms | 83.7 ms | pass |
| eager | 40 | 36 | 751.3 ms | 111.7 ms | 757.0 ms | 856.1 ms | 951.1 ms | REFUSE |
| exact_source | 40 | 36 | 37.1 ms | 108.7 ms | 134.1 ms | 144.4 ms | 147.7 ms | pass |
| eager | 80 | 36 | 1229.9 ms | 188.2 ms | 1275.0 ms | 1412.8 ms | 1417.3 ms | REFUSE |
| exact_source | 80 | 36 | 58.9 ms | 187.0 ms | 224.8 ms | 245.2 ms | 245.9 ms | pass |

**Preregistered verdict:** exact_source_sync_pass.

Every candidate path produced byte-equal sorted event ids, complete receipt bytes and result digest versus the eager control before timing was admitted.
