# Concept registry — fifth fresh independent buildability review

**Date:** 2026-09-06

**Verdict:** return the fourth repair on [[D2923]]–[[D2928]].

**Scope:** the repaired startup/readiness authority, validated pack snapshot, restart boundary and
consumer-use proof. Every earlier return/repair remains retained by the predecessor chain.

## Findings

1. **[[D2923]] — readiness is publicly mintable.** `ReadyStorage.issue(database)` is exported and
   public. Its private constructor therefore does not establish the RFC's claim that only the
   successful startup coordinator can mint service-ready storage. A prerequisite-version database
   with no concept migration or receipt is accepted by the public issuer.
2. **[[D2924]] — raw SQLite defeats transaction ownership.** The callback called
   “transaction-free” receives `DatabaseSync`. It can execute `COMMIT`, `ROLLBACK`, `BEGIN` and
   `PRAGMA user_version`. The executable counterexample commits a partial row; the coordinator then
   stamps version 26 outside a transaction, its own `COMMIT` fails, and neither effect rolls back.
3. **[[D2925]] — hash equality substitutes for document validity.** The artifact snapshot clones,
   freezes and hashes its typed input but never runs pack schema/runtime validation. An invalid
   `formatVersion` with a matching digest becomes historical concept authority.
4. **[[D2926]] — restart receipt validation is optional.** When the database already reports the
   concept version, the coordinator invokes the same caller-supplied `void` callback and issues
   readiness. A no-op callback over a database with no concept receipt passes, despite criteria 16
   and 20 requiring strict restart revalidation.
5. **[[D2927]] — the real web path is outside the graph.** The scanner loads only `.ts`/`.json` and
   its relative resolver only rewrites `.js` to `.ts`. Production reaches `api.ts` through
   `main.ts → App.svelte → api.ts`; the positive fixture replaces that with a direct TypeScript
   import. The declared real path cannot produce a receipt.
6. **[[D2928]] — call reachability is not result consumption.** A wrapper call counts when another
   reachable file calls the wrapper, even if both return values are discarded. The repair's own
   positive fixture does exactly that for all six operations, contradicting the claim that the
   operation result is used.

## Required repair

- keep ready issuance inside a non-exported closure/capability and cross direct/static/cast/shape
  forgeries;
- pass the data migration a capability-limited repository interface, not arbitrary SQL execution;
- validate complete pack documents before hashing and snapshot admission;
- make initial migration and restart validation distinct, mandatory closed results and refuse a
  version/receipt disagreement before readiness;
- consume the real Svelte/Vite dependency graph (or a truthful generated typed boundary tied to
  it), and establish operation-specific value flow rather than a call-expression census.

`make concept-registry-fifth-fresh-review` retains the full predecessor chain and executes six new
counterexamples. A green target means the defects reproduce; it is not acceptance. Another bounded
author repair and genuinely fresh review are required. The shared-resource bootstrap dependency
continues to precede acceptance and implementation.
