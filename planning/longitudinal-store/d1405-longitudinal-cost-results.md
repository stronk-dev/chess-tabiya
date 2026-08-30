# D1405 longitudinal projection cost results

Commit: `721a10f81506b226b8a4afe49ca49d853ef56a80`; PGN: `sha256:a10a233e8e51f6a0877f65cee417339080d2fd32cd22886f755f576c84fa58ec`; sources: `sha256:a8e9082aa7d9fb86b8398e624dec6926659bf42d3ac8fb91c46af7e0529bb76f`.

| prefix | paths | p50 | p95 | max | evaluated edges | cumulative replay edges | refs bytes | 500 ms gate |
|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 20 | 8 | 11961.5 ms | 13075.4 ms | 13075.4 ms | 5095 | 50385 | 242340 | **FAIL** |
| 40 | 8 | 25332.3 ms | 26452.8 ms | 26452.8 ms | 10971 | 213410 | 503933 | **FAIL** |
| 80 | 8 | 37355.3 ms | 47290.8 ms | 47290.8 ms | 18961 | 816142 | 1027616 | **FAIL** |

20→80 p95 ratio: **3.62×** — shape gate **PASS**.

## Bulk import

25 complete games / 1750 plies / 50586 evaluated edges in 828044.5 ms (0.030 games/s). Per-game p50/p95/max: 32703.7 / 52357.7 / 55618.8 ms. Canonical refs: 2727252 bytes.

This is the complete final-registry collection cost over committed inputs. D1405b separately measures SQLite publication and the bounded single-decision path.
