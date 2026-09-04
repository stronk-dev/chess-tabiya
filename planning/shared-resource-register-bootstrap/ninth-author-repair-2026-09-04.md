# Shared-resource register bootstrap — ninth author repair

- **Date:** 2026-09-04
- **Repairs:** [[D2667]], [[D2668]], [[D2669]], [[D2670]], [[D2671]], [[D2672]]
- **Gate:** `make shared-resource-bootstrap-ninth-author-repair` — retained 26 controls, new 7/7
- **Verdict:** author repair complete; another genuinely fresh independent review required

## Repair

The pinned compiler host now distinguishes repository source from dependencies before applying
repository containment. Positive and negative repository lookups read only the selected Git tree;
an untracked source cannot satisfy an import. An installed package is admitted only when its
manifest name/version resolves to one exact integrity-bearing entry in the committed pnpm lockfile.

External node IDs contain normalized TypeScript-library names or package/version/integrity/subpath
identity, never a checkout or installation prefix. Compiler-symbol traversal emits an edge to every
retained declaration of a merged symbol and handles a property receiver separately from its property
name. The graph assertion recursively validates the exact program, root, node, syntax-tree, edge and
dependency shapes, their scalar domains, canonical ordering and uniqueness before sealing.

## Evidence

The new executable groups prove commit-negative lookup remains refused after two working-tree
mutations; one fake installed package derives its identity from committed lock bytes; standard
TypeScript libraries expose portable IDs; merged `Promise` declarations are all reachable; both
`holder` and `run` survive a property call; and five independently malformed nested graph values are
rejected. The retained ninth fresh-review target remains green, so the repair has not erased its
falsifier.

This is contract-tier author evidence only. It changes no catalogue, checker, register, product,
schema or content byte and does not authorize implementation before another fresh review.
