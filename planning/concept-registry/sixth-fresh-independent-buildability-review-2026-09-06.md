# Concept registry — sixth fresh independent buildability review

**Date:** 2026-09-06

**Verdict:** return the fifth repair on [[D2960]]–[[D2965]].

**Scope:** the composed consumer boundary, committed compiler authority, canonical artifact
population and complete startup/readiness lifecycle. Every earlier return and repair remains
retained by the Make dependency chain.

## Findings

1. **[[D2960]] — the consumer receipt authenticates names, not live boundaries.**
   `resultReachesBoundary` reparses reachable source without the type checker and matches the
   expected boundary identifier plus a nested wrapper call. A local function with that name passes,
   as does the same expression inside a function no entry ever calls. All six consumers can therefore
   be “closed” without publishing, persisting, serving or serializing one result.
2. **[[D2961]] — project compiler authority is crossed.** The checker shallow-spreads base, server
   and web options and compiles one synthetic program. The executable fixture gives the server
   `noImplicitAny: true` and the web `false`; a server implicit-any diagnostic is erased by the later
   web option and the receipt remains green.
3. **[[D2962]] — artifact population identity is not canonical.** Snapshot compilation hashes Map
   insertion order. Reversing two fully validated artifacts changes `populationDigest`, so loader
   scheduling can make a valid restart fail without any content change.
4. **[[D2963]] — the concept registry is structural input.** A caller callback returning only an
   invented lowercase SHA-256 string is accepted as the compiled registry and can authorize the
   migration receipt and ready storage. The one compiler is not yet an authority boundary.
5. **[[D2964]] — failed composition can leak readiness.** Readiness is privately issued, but it is
   issued before `afterCommit`. A callback can retain the token and throw; startup reports failure
   while the leaked token remains valid in the private `WeakMap`.
6. **[[D2965]] — startup refusal does not close storage.** The catch path rolls back and rethrows but
   never closes SQLite. The caller can continue querying the supposedly rejected bootstrap handle,
   contradicting the explicit lifecycle contract.

## Required repair

- resolve both wrapper and exact product-boundary symbols with the relevant project's own committed
  TypeScript configuration, and prove the consuming call is reachable from its real entry;
- canonical-sort the validated artifact inventory by intrinsic identity before receipt hashing;
- accept only the private output of `compileConceptRegistry`, not a digest-bearing interface;
- construct the complete service graph before publishing a ready capability, with no caller callback
  able to observe half-composed authority; and
- make the coordinator close the database on every unsuccessful exit, including post-commit service
  construction failure, with executable unusable-handle controls.

`make concept-registry-sixth-fresh-review` retains the complete chain and passes six new
counterexamples plus strict TypeScript. Green means the defects reproduce. No schema, migration,
registry content, product consumer, storage, archive or protected-design byte changed.
