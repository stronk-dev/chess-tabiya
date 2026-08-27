# Recorded semantic path plan

## State

Draft product RFC amended after independent buildability review and follow-up measurement.
[[D1927]]/[[D1928]]/[[D1930]]–[[D1932]] now have executable contract repairs; the
[[D1921]]/[[D1929]] value/convention predecessor and repeat review still block acceptance. No
implementation is authorised.

## Repair order

1. **Amended:** total, cycle-safe `branchPath` proves one complete branch tip-to-root chain and
   `branchPaths` delegates instead of trusting node-array order.
2. **Amended:** exact `run.record.edge@1` includes canonical UCI/SAN and run/actual-branch/node
   identity, with eleven v2 semantic successors rather than an in-place v1 rewrite. [[D1932]] is
   resolved explicitly:
   shared ancestral edges must not acquire a second identity merely because a descendant branch
   requested the path; requested-branch identity stays on the path/window receipt.
   [[D1933]] additionally requires one exact versioned semantic-event inventory; base-id family
   projections may not police or consume the v1/v2 coexistence.
3. Land or explicitly depend on the value-level derivation seal that binds exact evidence values
   to event operands; projection-name set membership is insufficient.
4. Depend on the semantic-convention closure and include its exact digest/receipt in result
   identity.
5. **Resolved by measurement:** eager full-path fan-out remains refused, while D1931's exact-source
   shape preserves every result byte and passes at 64.7/129.7/212.7 ms p95 for 20/40/80 plies.
   Specify exactly one transition compile and check probe per edge; keep deterministic CI work and
   parity bounds separate from environment-sensitive benchmark reporting.
6. Complete the [[D1921]]/[[D1929]] predecessor, then repeat independent buildability review over
   the amended graph, edge, v2 migration, digest and execution contract.

## Boundary

Review artifacts and disposable falsifiers only. No runtime, evidence catalogue, schema, content,
server, web, protected design or archive bytes may change before acceptance.
