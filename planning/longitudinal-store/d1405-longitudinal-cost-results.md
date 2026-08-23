# D1405 longitudinal projection cost results

Commit: `0d4e27f`; PGN: `sha256:a10a233e8e51f6a0877f65cee417339080d2fd32cd22886f755f576c84fa58ec`; sources: `sha256:9d575c4e61d4e328a91d441bd6b191ae9f51c9fff426d6d86a4a278c7991e5cf`.

| prefix | paths | p50 | p95 | max | evaluated edges | cumulative replay edges | refs bytes | 500 ms gate |
|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 20 | 8 | 10395.2 ms | 11440.0 ms | 11440.0 ms | 5095 | 50385 | 242340 | **FAIL** |
| 40 | 8 | 22253.0 ms | 23433.2 ms | 23433.2 ms | 10971 | 213410 | 503933 | **FAIL** |
| 80 | 8 | 33181.7 ms | 42557.4 ms | 42557.4 ms | 18961 | 816142 | 1027616 | **FAIL** |

20→80 p95 ratio: **3.72×** — shape gate **PASS**.

## Bulk import

25 complete games / 1750 plies / 50586 evaluated edges in 738791.8 ms (0.034 games/s). Per-game p50/p95/max: 30128.8 / 45812.4 / 49105.2 ms. Canonical refs: 2727252 bytes.

This is a lower bound over the committed one-edge compiler. It excludes database work and the population/path constructors required by B2.
