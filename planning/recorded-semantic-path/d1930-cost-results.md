# D1930 recorded semantic path cost — results

Measured 2026-09-04T08:47:28.425Z on v24.20.0 darwin/arm64; population sha256:663e2f4d09b2b34089acdcc52016059b0ca8e064921973ba79b39f71a7695d7c.

| plies | samples | validation p95 | preparation p95 | windows p95 | total p50 | total p95 | max | 500 ms |
|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 20 | 36 | 0.2 ms | 353.6 ms | 62.0 ms | 396.8 ms | 414.7 ms | 415.0 ms | pass |
| 40 | 36 | 0.3 ms | 723.1 ms | 118.2 ms | 781.7 ms | 838.8 ms | 838.8 ms | REFUSE |
| 80 | 36 | 0.5 ms | 1218.3 ms | 199.6 ms | 1270.7 ms | 1418.1 ms | 1442.7 ms | REFUSE |

**Preregistered verdict:** synchronous_full_path_refused.

Each compile prepared one edge and called `localSemanticEvents` once per ply, then allocated 13 receipts per start. Wall-clock values are research evidence; only those exact work counts belong in generic software CI.
