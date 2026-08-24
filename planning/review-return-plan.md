# Review-return and CI closure plan

These rows remain open work. This plan gives each one a living route until its
own RFC or implementation closes it; it changes no disposition.

| Route | Ledger rows | Next action |
|---|---|---|
| Bot route source author return | D1357, D1358, D1359, D1360, D1361, D1362 | Amend `rfc/bot-route-source.md` against review findings B3-B7 and S1-S3, then repeat buildability review before acceptance. |
| Hint-distance author return | D1365, D1366, D1368, D1369, D1370, D1371, D1398 | Amend `rfc/hint-distance.md` with exact evidence-instance identity, sealed rung views, the live request path, common rated boundary, compiled answer gate, and policy-vs-availability result; retain the sparse relation-safe measurement as its fallback constraint. |
| Longitudinal-store author return | D1401, D1402, D1403, D1404, D1405 | Amend `rfc/longitudinal-store.md` with constructor-complete ingest, immutable observation time, registry-bound derivation revision, checkpoint-bearing refs, and incremental per-decision derivation; repeat the latency gate. |
| Clean-SHA CI parity | D1448 | Run `make ci-local` from committed Node-24 bytes with the pinned Stockfish and Docker Compose dependencies; repair every failure and close only on its exact-commit PASS receipt. |
