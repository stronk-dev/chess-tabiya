# Shared-resource register bootstrap — tenth author repair

- **Date:** 2026-09-05
- **Repairs:** [[D2701]], [[D2702]], [[D2703]], [[D2704]], [[D2705]], [[D2706]],
  [[D2707]], [[D2708]]
- **Gate:** `make shared-resource-bootstrap-tenth-author-repair` — retained 41 controls, new 8/8
- **Verdict:** author repair complete; another genuinely fresh independent review required

## Repair

The selected commit's `tsconfig.base.json` now crosses the same syntax-tree duplicate-key refusal
before compiler option conversion. A last-wins JSON object can no longer become program identity
([[D2701]]).

Every retained external declaration now carries a `sourceDigest` over its exact canonical syntax
tree in addition to package/version/integrity. If installed package declaration bytes change the
meaning traversed by the compiler, the dependency identity and graph digest change together; the
old state—changed semantics carrying the same complete dependency identity—is unrepresentable
([[D2702]]). Origin validation binds TypeScript libraries to the actual compiler identity, Node
builtins to `@types/node`, external packages to their lock identity, and repository nodes to null;
the id prefix must agree with that discriminator ([[D2703]]).

Descriptor roots are unique before compiler construction and graph roots are unique again at the
assertion boundary ([[D2704]]). Call/construct/tag edges require a resolved signature and non-empty
overload set; every other edge requires null/empty arms ([[D2705]]).

Resolution closes before publication. A call with no exact resolved signature fails, so an
`any`-based invocation cannot become a graph ([[D2706]]). `ImportKeyword` is rejected rather than
silently dropping a dynamic module ([[D2707]]). Element access is admitted only for one literal
string or numeric key; a broad runtime index fails while `byName["fixed"]()` remains representable
([[D2708]]).

## Evidence and hold

`make shared-resource-bootstrap-tenth-author-repair` retains all 33 predecessor controls and passes
8/8 new repair groups. This is bounded contract evidence only. It changes no production catalogue,
checker, register, schema, product or content byte and authorizes none before another genuinely
fresh independent review.
