# Semantic collectors promotion — thirteenth author repair

**Date:** 2026-09-06

## Outcome

The held promotion pair's installation-authority boundary closes [[D2864]]–[[D2868]] at contract
tier. The production evidence spine remains 12/14: no production collector, schema, content,
provider, archive or protected-design byte changed.

- current code exposes one application composition root rather than the predecessor's raw authority
  issuer and registry API;
- application construction retains the exact canonical inventory bytes, digest, path, root and
  non-empty immutable entry population;
- registry construction proves its delegated read matches that retained digest before issuing a
  store, and one generation maps to one cached current store;
- store, recorded receipt, request and result authority retain the exact current application,
  installation and registry chain; and
- empty response/legal generation populations fail before an installed store exists.

## Executable evidence

`make semantic-collectors-promotion-thirteenth-author-repair` retains the entire promotion
predecessor and thirteenth-return chain, passes 5/5 current repair groups, and runs strict
TypeScript. The target is part of ordinary `verify-governance`; it is not a one-off invocation.

The mutation control constructs an application from valid canonical bytes, replaces the inventory
with a second valid canonical document, and proves registry construction fails with
`PROMOTION_INVENTORY_SNAPSHOT_CHANGED`. The positive collection control resolves recorded evidence
through the current store and proves its receipt returns the same application, snapshot, registry
and store by identity.

## Boundary

This is author contract evidence only. Another genuinely fresh review plus accepted/implemented
provider-exchange and evidence-value-authority dependencies still gate the two held projections and
the 12/14→14/14 production transition.
