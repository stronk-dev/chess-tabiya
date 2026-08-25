# AssistanceConfig register implementation plan

## State

Draft RFC; independent review required before implementation.

## Order

1. Re-derive `AssistanceConfig` head, domains, historical commits and both RFC seams.
2. Review `rfc/assistance-config-register.md`; correct or return it, then record acceptance.
3. Implement the normalized AST reader and twelve mutation classes.
4. Add the README register and atomically transfer Guided Hint from `none` to the sole v5 claim.
5. Refresh docs, ledger, RFC register, roadmap/work receipts and append-only logs.
6. Run Node-24 governance and staged process checks on exact committed bytes.

## Boundaries

No runtime assistance value, browser migration, preset, schema, content or archive byte changes in
this RFC. Product v5 remains owned by `hint-distance` after its own review and dependencies.

## Acceptance

All eleven RFC criteria pass; D1 and D2 are discharged. D3 remains an explicit downstream product
obligation and does not block implementing this register.
