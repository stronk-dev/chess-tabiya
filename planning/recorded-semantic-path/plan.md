# Recorded semantic path plan

## State

Draft product RFC returned by independent buildability review and follow-up measurement on
[[D1927]]–[[D1931]] and the already-open value-level provenance blocker [[D1921]]. No
implementation is authorised.

## Repair order

1. Specify a total, cycle-safe branch-path authority that proves one complete branch tip-to-root
   chain instead of trusting node-array order.
2. Define an exact recorded-edge authority, including canonical UCI/SAN and run/branch/node
   identity, and price the projection/event migration it requires.
3. Land or explicitly depend on the value-level derivation seal that binds exact evidence values
   to event operands; projection-name set membership is insufficient.
4. Depend on the semantic-convention closure and include its exact digest/receipt in result
   identity.
5. **Measured:** eager full-path p95 is 399.7/826.3/1,434.0 ms at 20/40/80 plies against the
   existing 500 ms envelope. Measure [[D1931]]'s exact-source/canonical-edge alternative; keep
   deterministic CI work bounds separate from environment-sensitive benchmark reporting.
6. Amend the RFC around the measured execution shape, rerun the five-arm falsifier, then repeat
   independent buildability review.

## Boundary

Review artifacts and disposable falsifiers only. No runtime, evidence catalogue, schema, content,
server, web, protected design or archive bytes may change before acceptance.
