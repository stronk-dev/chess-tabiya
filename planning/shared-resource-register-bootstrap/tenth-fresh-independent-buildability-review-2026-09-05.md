# Shared-resource register bootstrap — tenth fresh independent buildability review

- **Date:** 2026-09-05
- **Reviewed:** ninth author repair for [[D2667]]–[[D2672]]
- **Gate:** `make shared-resource-bootstrap-tenth-fresh-review` — retained 33 controls, new 8/8
- **Verdict:** **RETURNED on [[D2701]], [[D2702]], [[D2703]], [[D2704]], [[D2705]],
  [[D2706]], [[D2707]], [[D2708]]**

## What survives

The selected-commit repository host, package-before-repository classification, portable external
IDs, merged declarations, property receivers and recursive scalar/tree shape checks all survive
their retained controls. The return is at the remaining reproducibility and semantic-closure
boundary, not a regression to the ninth review.

## Return

The program configuration still uses `JSON.parse`, so a committed `tsconfig.base.json` with two
`compilerOptions` keys is silently accepted despite the RFC's duplicate-key refusal. Installed
package declarations are read from mutable `node_modules`; changing `index.d.ts` changes the graph
and digest for the same commit while the exact same lockfile identity remains attached. The lock
label therefore does not prove which package bytes the compiler traversed.

The graph assertion validates nested shapes but not all declared graph invariants. An
`external_package` node can be relabelled `typescript_lib` while retaining the fake package
identity; duplicate selector roots pass; and a `type_reference` edge can carry a resolved signature
and overload list reserved for call/construct/tag edges.

Finally, three explicit fail-closed clauses are absent from the traversal. An `any`-based call is
accepted, a dynamic import succeeds while its referenced module disappears from the retained
graph, and a broad index-signature call is accepted. These are not optional breadth: §2 names all
three as inputs that must fail because their exact target authority cannot be represented.

## Required repair

Use the repository's duplicate-key JSON authority for compiler config. Bind every external source
file to verified package artifact bytes (or another exact immutable content authority), not merely
the lockfile label. Validate origin/dependency combinations, unique roots and relation-specific
signature/overload arms. Detect and reject `any`/`unknown` resolution, dynamic imports and broad or
non-literal computed lookup before graph publication. Then run another genuinely fresh review.

No catalogue, checker, register, schema, product or content implementation is authorized.
