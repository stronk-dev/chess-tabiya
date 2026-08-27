# D1930 recorded semantic path cost — results

Measured 2026-08-27T17:27:00.510Z on v26.7.0 darwin/arm64; population sha256:663e2f4d09b2b34089acdcc52016059b0ca8e064921973ba79b39f71a7695d7c.

| plies | samples | validation p95 | preparation p95 | windows p95 | total p50 | total p95 | max | 500 ms |
|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 20 | 36 | 0.2 ms | 351.0 ms | 52.3 ms | 387.2 ms | 399.7 ms | 403.0 ms | pass |
| 40 | 36 | 0.3 ms | 728.0 ms | 101.8 ms | 773.3 ms | 826.3 ms | 829.2 ms | REFUSE |
| 80 | 36 | 0.9 ms | 1262.3 ms | 184.9 ms | 1274.5 ms | 1434.0 ms | 1442.8 ms | REFUSE |

**Preregistered verdict:** synchronous_full_path_refused.

Each compile prepared one edge and called `localSemanticEvents` once per ply, then allocated 13 receipts per start. Wall-clock values are research evidence; only those exact work counts belong in generic software CI.
