# Shared-resource register bootstrap — fourteenth author repair

- **Date:** 2026-09-05
- **Repairs:** [[D2854]]–[[D2856]]
- **Gate:** `make shared-resource-bootstrap-fourteenth-author-repair`
- **Verdict:** author repair complete; another genuinely fresh independent review required

## Repair

The graph now distinguishes an open runtime index from a statically spelled read governed by a
declared index signature. The latter retains its exact receiver/index declaration and site; an
`any`/`unknown` receiver still fails. A non-literal element key is admitted only when the compiler
reduces it to a finite non-empty string/number-literal union and every member resolves against the
closed receiver. Open `string`/`number`, mixed and missing-key forms remain refused.

Optional calls retain their syntax-site identity but enumerate signatures from the compiler's
selected non-null callable authority, so `storage?.setItem(...)` keeps the exact interface method
and overload arm instead of becoming unrepresentable.

Most importantly, the repair runs the literal `assistance-config` and `workflow-preference`
descriptors from `planning/assistance-config-register/catalogue-additions.v1.json` against committed
HEAD as permanent positive controls. Both complete graphs now project; reduced synthetic root lists
cannot substitute for that cross-RFC check.

## Evidence and hold

`make shared-resource-bootstrap-fourteenth-author-repair` retains every predecessor review and
repair, reproduces all three fourteenth-review attacks, and passes four repair groups. No production
catalogue, checker, register, schema, provider, product or content byte changed. Another genuinely
fresh independent review still precedes acceptance and implementation.
