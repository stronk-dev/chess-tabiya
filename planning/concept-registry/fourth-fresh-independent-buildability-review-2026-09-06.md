# Concept registry — fourth fresh independent buildability review

**Verdict:** return the RFC on [[D2904]]–[[D2908]]. The third repair closes its seven assigned
findings, but the repaired contract still cannot enter the real application startup path and its
consumer/artifact receipts remain forgeable or weaker than their names.

## Reproduced blockers

1. **[[D2904]] The required migration authority does not exist when storage migrations run.**
   `SQLiteRunStorage` migrates in its constructor. `createApplication` loads built-in packs only
   afterward, then constructs Pack Studio and hydrates playtest and registered pack artifacts from
   that same storage. The RFC requires the complete hydrated `PackRegistry` inside the migration
   without specifying a two-phase startup or another way to break the cycle.
2. **[[D2905]] Transaction ownership is contradictory.** The shipped storage coordinator starts
   `BEGIN IMMEDIATE`, invokes each migration, stamps `PRAGMA user_version` and commits. The proposed
   migration also starts `BEGIN IMMEDIATE`; SQLite rejects that exact nesting. Moving the data
   operation outside the coordinator instead loses the claimed atomic schema-version boundary.
3. **[[D2906]] Operation presence is still not live consumption.** All six expected calls can sit
   inside exported functions with zero importers and the repaired graph returns success. Its web
   target is also an invented `apps/web/src/lib/client.ts`; the application imports
   `apps/web/src/lib/api.ts`. The receipt proves a call expression at a nominated anchor, not a
   reachable route or a used projection.
4. **[[D2907]] The graph does not use the repository compiler authority it claims.** It constructs
   a partial TypeScript `Program` but never requests or rejects diagnostics. A committed consumer
   containing `const impossible: string = 42` still produces a complete receipt.
5. **[[D2908]] `PackRegistry.byDigest` is not immutable artifact authority.** Public
   `addPlaytest`/`addCommunity` methods accept caller-supplied document/digest pairs without
   recomputing the complete-document digest. The review inserts a valid document under a different
   SHA-256 and `byDigest` returns it under the forged identity the migration would trust.

## Evidence and required repair

`make concept-registry-fourth-fresh-review` retains the complete predecessor chain and passes 5/5
new executable falsifiers plus strict TypeScript. A green review target means the blockers
reproduce; it is not acceptance.

The next author repair must specify and execute one real application boot sequence that constructs
schema, hydrates exact pack artifacts, performs the data migration, stamps the storage version and
refuses service readiness atomically or through an explicit recoverable phase protocol. It must
prove consumers reachable from real server/web entries and reject compiler diagnostics under the
repository configuration. Historical pack lookup must consume a sealed validated artifact
snapshot, or every `PackRegistry` insertion must recompute and bind the exact document digest.

The independently-passed shared-resource bootstrap remains a separate prerequisite. No concept
schema, registry, migration or product consumer is authorized by this returned review.
