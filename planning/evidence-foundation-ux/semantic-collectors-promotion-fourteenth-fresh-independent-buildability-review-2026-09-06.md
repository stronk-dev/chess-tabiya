# Semantic collectors promotion — fourteenth fresh independent buildability review

**Date:** 2026-09-06

## Verdict

Return the held promotion pair on [[D2892]]–[[D2896]]. The thirteenth repair preserves one
immutable inventory snapshot through its current wrappers, but the application/installation
boundary remains caller-selectable and the supposedly current registry/store authority is neither
complete nor unique. The evidence spine remains 12/14; no production projection is authorized.

## Findings

- [[D2892]]: exported `openPromotionApplication(inventoryPath)` lets any importer choose an
  arbitrary inventory and receive the exact authority accepted by the current registry. The rename
  does not establish a product composition boundary.
- [[D2893]]: the current product operation internally invokes
  `prior.createTestInstalledPromotionInventoryAuthority(snapshot.inventoryPath)`. The predecessor
  test-only raw-path issuer therefore remains in the product authority graph.
- [[D2894]]: `openRegistry()` publishes an installed registry after validating only the inventory
  declaration. Its sole listed generation may be missing or malformed and is discovered only by a
  later `openGeneration` call, so the registry claims a population it has not checked.
- [[D2895]]: each `application.openRegistry()` call mints a distinct, simultaneously valid current
  registry over the same immutable application snapshot.
- [[D2896]]: `openGeneration()` reads the store cache before multiple awaited operations and writes
  it only afterward. Concurrent first opens can mint distinct current stores and receipt lineages
  for the same application/generation.

## Executable evidence

`make semantic-collectors-promotion-fourteenth-fresh-review` retains every predecessor return and
repair, then passes 5/5 independent falsifiers plus strict TypeScript. The target is part of
`verify-governance`.

## Required repair

One current checkpoint must take an exact product composition/configuration authority rather than
a caller path, remove the predecessor test issuer from the product dependency graph, validate the
complete listed generation population before publishing an installed registry, and single-flight
one registry and one store per immutable application snapshot/generation. Failed construction must
not leave a current cache entry. Another genuinely fresh review and the existing provider/value
dependencies still gate the held pair.
