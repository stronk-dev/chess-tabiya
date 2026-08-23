# D1397 relation-safe hint results

Input: `sha256:f039dc2407bfee238fe97f9e3ad3ecc4eb8ca22d854d39dcfacd460a3c9fab00`; D1061: `sha256:53051e9671e801ecb71c209a052b54da53d97873b07d0c85298b8d70043d4162`; runtime: `sha256:9b9831400163b62a159377b8a9e1921509bfd665e9aa5b27687dc7f74839159c`.

| arm | strict-direct reach | strict-horizon reach |
|---|---:|---:|
| depth12 | 10/64 | 16/64 |
| movetime100_a | 10/64 | 10/64 |

Candidates: 150; admitted occurrences: 35.

Post-result diagnostic (no gate): strict-direct is non-empty on the same 10 positions in both arms, with 10/10 family/status/relation agreement and 9/10 exact-occurrence agreement; strict-horizon reaches 16 positions in either arm but only 10 in both.

## Refusals

| reason | occurrences |
|---|---:|
| opponent_line_event | 78 |
| promotion_not_reply_persistent | 1 |
| self_exposure_created | 16 |
| self_risk_preserved | 20 |

No reach minimum was preregistered. These are exact occurrence relations, not usefulness, causality or move-quality labels.
