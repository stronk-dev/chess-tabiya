# Shared-resource register bootstrap — twelfth fresh independent buildability review

- **Date:** 2026-09-05
- **Reviewed checkpoint:** eleventh author repair
- **Gate:** `make shared-resource-bootstrap-twelfth-fresh-review`
- **Verdict:** return on [[D2828]]–[[D2834]]; no implementation authorized

## Executed review

The review retains the entire predecessor chain and adds seven able-to-fail attacks plus one
positive control. All eight pass against the eleventh author model:

1. a valid `safe.secret` edge masks a separate unresolved `unsafe.secret` occurrence because the
   check binds only declaration plus member spelling, not the exact syntax site ([[D2828]]);
2. a local alias of the global `eval` intrinsic bypasses the direct call-target check ([[D2829]]);
3. a two-arm construct-signature interface publishes with only its selected arm ([[D2830]]);
4. the public projector seals a TypeScript result for a descriptor whose lifecycle, claim mode and
   adapter are incompatible and unvalidated ([[D2831]]);
5. case-distinct valid calls are reordered with locale collation and rejected by the canonical ABI
   assertion ([[D2832]]);
6. a constructor nested inside an outer class method is recorded as an overload of the outer class
   construction ([[D2833]]); and
7. case-distinct dependency paths hash in locale order rather than canonical byte order
   ([[D2834]]).

The retained direct `unsafe()` control still fails with `graph:call-arm`. That matters: the return
does not erase the tenth repair. It proves the remaining bypasses occur where relation identity is
too coarse, not because all unresolved calls reopened.

## Consequence

The next repair must make compiler relation sites first-class, follow alias/value authority to the
global intrinsic, obtain constructor overloads from the exact compiler-selected construct target,
require validated descriptor authority, and use one canonical comparator at every graph/artifact
boundary. Name/count checks and descendant constructor scans cannot satisfy this return.

This review changes no catalogue, checker, register, product, content or protected-design byte.
