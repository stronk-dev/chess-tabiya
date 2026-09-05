# Longitudinal store — eighth author repair

- **Date:** 2026-09-05
- **Repairs:** [[D2718]]–[[D2723]]
- **Status:** author repair complete; another genuinely fresh independent review is required
- **Gate:** `make longitudinal-store-eighth-author-repair` — complete retained author/review chain,
  6/6 new repair groups and strict TypeScript

## Repair

The source boundary now starts from the real runtime type. One storage-owned reader copies the
exact `DrillRunEvent[0..N)` prefix, calls `readBackReplay`, checks the run/cut identity and only then
seals source image v4. There is no flattened parallel event schema. It resolves exactly one
authorship row per prefix user commit, treats no-journal as an explicit single-player authority,
and rejects incomplete, surplus, crossed or single-player/non-owner populations.

The fictional imported-game length operand is removed. Imported-mainline length is derived from
the replayed imported run's immutable primary branch; non-imported runs carry null. Source images
and job rows must share the locked run and owner before invalidation.

Mutation closure now parses TypeScript syntax. Only an actual
`this.#upsertLongitudinalWatermark({symbol,effect})` call inside the matching
`SQLiteRunStorage#method`, after `BEGIN IMMEDIATE` and before `COMMIT`, enters the exact census;
comments, strings, wrong methods and outside-transaction calls do not. The claim receipt now carries
the immutable cut and derivation revision, and its checker additionally proves the current sealed
source subject/digest and unexpired lease alongside generation/token/worker.

## Boundary and next action

No migration, worker, reader, consumer, API, client, content, archive or protected-design byte
landed. Another genuinely fresh independent review must attack the repaired real-event, population,
transaction, claim and subject authorities before acceptance or implementation.
