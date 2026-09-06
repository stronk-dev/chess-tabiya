# Storage backup/recovery — fifth fresh independent buildability review

**Date:** 2026-09-06

**Verdict:** return the fourth repair on [[D2972]]–[[D2977]].

**Scope:** the storage-subject/check issuer, replacement journal reconciliation and publication,
startup discovery, and live readiness boundary. Every previous review and repair remains retained by
the Make dependency chain.

## Findings

1. **[[D2972]] — storage subjects are public caller products.** `inspectBackupSubject` accepts any
   operation id, byte array and source version. Arbitrary non-SQLite bytes therefore become the
   exact subject the check compiler trusts, contradicting the RFC's explicit ban on a generic public
   subject constructor.
2. **[[D2973]] — semantic check truth is caller-authored.** `checkIntegrity`, `checkForeignKeys`,
   `checkInventory` and `checkCompatibility` accept the purported query results, both sides of the
   inventory comparison and the compatibility matrix from the same caller. Consistent invented
   values receive sealed `passed:true` authority and compile as a successful backup.
3. **[[D2974]] — terminal journal images are not total.** `reconcileReplacement` returns verify and
   terminal phases unchanged after checking only placement of old members. A `verified` journal is
   accepted while the old main remains live and the staged new main is still uninstalled.
4. **[[D2975]] — durable publication is a string assertion.** Supplying the four exported step-name
   constants passes without any filesystem capability, syscall, persisted byte or crash boundary.
   The contract cannot distinguish performed-and-durable publication from a narrated sequence.
5. **[[D2976]] — leftover temp intent has no identity.** Discovery allows `journal.json` plus
   `journal.tmp` but receives no bytes or ownership for the temp file. A crossed, torn or newer temp
   intent is silently ignored while the final journal becomes recovery authority.
6. **[[D2977]] — readiness is not route authority.** Caller-authored status 200 and canonical JSON
   produce a valid `ReadyResponse` without starting the server, invoking `/readyz`, observing the
   current storage version or reading representative data.

## Required repair

- create the exact storage subject privately inside each operation from its owned storage handle,
  and execute semantic checks there against compiled inventories and compatibility authority;
- run journal publication/discovery/reconciliation through one owned filesystem capability, with
  deterministic crash fixtures around every mutation, journal write and fsync;
- validate the complete live/quarantine/staged digest image in every journal arm and parse or refuse
  every leftover temp intent; and
- make the rehearsal/release client consume an invocation receipt issued by the actual application
  `/readyz` route and bound to its storage and representative-data observations.

`make storage-backup-fifth-fresh-review` retains the complete chain and passes six current
counterexamples plus strict TypeScript. Green means the defects reproduce. No production storage,
server, API, schema, client, content, deployment, archive or protected-design byte changed.
