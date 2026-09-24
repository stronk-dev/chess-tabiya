# Evidence job durability — implementation landing

**Date:** 2026-09-24

**Scope:** `rfc/evidence-job-durability.md` implemented at **migration 27** under the owner's
direct-implementation direction (no review round before landing; consolidation, review and the
`rfc/README.md` Active-row transition belong to the register owner). The acceptance population is
the inherited defect set named in the RFC's Status line; each has an executable control below.

## What landed

| Part | Where |
|---|---|
| Migration 27: `evidence_job_batches`, `evidence_result_sequences`, `evidence_jobs`, `evidence_run_transitions` (exact §2 DDL), two append-only triggers, two indexes | `apps/server/src/evidence-job-store.ts` (`EVIDENCE_JOB_MIGRATION_SQL`), `storage.ts` `#addEvidenceJobTables` |
| Closed vocabularies, `evidence_job_request@1`/`evidence_batch_request@1` parsers and the two digest authorities, receipts, settlement/retry unions, the exhaustive 23-column row parser | `evidence-jobs.ts` |
| Admission (`admitEvidenceBatchInTransaction`, internal if-absent), claim/lease CAS, provider interval, settlement, retry, shutdown, expiry recovery, cancellation, never-reused sequence allocator, application/consumption, consumed/batch replay | `EvidenceJobStore` |
| Run-coupled commits (`commitRunMutationWithEvidence`, `commitRewindWithEvidenceCancellation`, `applyEvidenceAndConsumeJob`) inside the one watermarked `save` transaction | `storage.ts` |
| Durable worker bound to the store (restart resume, bounded concurrency, two gateways, shutdown → `retry_wait`) | `evidence-queue.ts` |
| Three enqueue owners (explicit analysis, Story, run enrichment), registered guard authority on apply | `service.ts` |
| `Idempotency-Key` on `POST /runs/:id/analysis` (202 `{batchId, jobs}`); single public-token scope dispatch | `rest.ts`; web client `api.ts` sends a per-call key |
| §1 HTTP/queued capability-operation census | `capability-operations.ts` |
| Account inventory (four run-owned operational tables, not exported, cascade with the run) | `account-data.ts` |
| Docs | `docs/evidence-jobs.md` (+ index, engine-workers, game-import-and-story, account-data lifecycle) |

## Acceptance → tests

| Criterion / defects | Test |
|---|---|
| 20 ([[D2518]]) public-card scopes | `capability-operations.test.ts` › criterion 20 |
| 21 ([[D2519]]) closed queued population | `capability-operations.test.ts` › criterion 21 (kinds/origins, gateway source census, owner census, no post-save loop) |
| §1 census [[D2429]], [[D2509]]–[[D2513]] | `capability-operations.test.ts` › the HTTP capability-operation census (5 tests) |
| 22 ([[D2520]], [[D2527]]) | `evidence-job-durability.test.ts` › criterion 22 (whole-batch commit + replay + conflict; fault at every ordinal; refusal before admission, `settled_unavailable` after 202 across reopen); `evidence-queue.test.ts` › REST idempotency key |
| 23 ([[D2524]], [[D2525]], [[D3002]], [[D2805]], [[D3003]]) | `evidence-job-durability.test.ts` › criterion 23 (3 tests) |
| 24 ([[D2528]], [[D2545]], [[D2565]], [[D2569]], [[D2588]], [[D2591]]) | `evidence-job-durability.test.ts` › criterion 24 (two-connection worker-thread barrier race × three origins; digest domains/UUIDs/conflict; exact request parsers and deep freeze) |
| 25 ([[D2526]]) | `evidence-job-durability.test.ts` › criterion 25; `capability-operations.test.ts` › owner census |
| 26 ([[D2529]], [[D2546]], [[D2567]], [[D2592]]) | `evidence-job-durability.test.ts` › criterion 26 (eight-state total fixture, lease conflict / fault / late result, settle→rewind→reopen→settle `1 → 2`); `evidence-queue.test.ts` › rewind cancellation aborts running work |
| 27 ([[D2543]], [[D2563]], [[D2564]], [[D2587]], [[D2589]], [[D2590]], [[D2673]]–[[D2676]]) | `evidence-job-durability.test.ts` › criterion 27 (expiry recovery, stale receipts, shutdown; guarded suffix + replay; crossed node refusal) |
| 28–30 ([[D2677]], [[D2742]]–[[D2747]], [[D2771]]–[[D2778]], [[D2802]]–[[D2808]], [[D3003]]–[[D3007]]) | `evidence-job-durability.test.ts` › criteria 28–30 (8 tests: cross-database leases/deliveries/forged failures; payload operand joins; expiry/interval/changed expiry; objective joins; exhaustive row parser incl. literal clocks, crossed routing, origin/effect arms, canonical bytes, retry-basis round trip; consumed replay tamper + append-only triggers + cascade; batch replay validation) |
| [[D3008]] parent-batch rejoin | `evidence-job-durability.test.ts` › criteria 28–30 › rejoins a leased job to its complete parent batch before provider work and at settlement |

## RFC corrections

Nine inline corrections, listed in the RFC Changelog entry for 2026-09-24: Story key chunking,
first-admission-only internal plans, the queue-gateway receipt vocabulary, the transition-chain
revision, gateway-owned engine provenance, the retired idle-only tablebase producer budget,
invalid payloads on the retry path, the store clock, and the live §1 census.

## What remains

- Runtime enforcement of `pack.requires` for the census's provider-bound operations belongs to
  `rfc/pack-capability-contract.md` (capability identity); the census fixes population and consumers.
- Adopting `provider-health-degradation`'s availability/failure receipts (unimplemented) is a
  mechanical join onto the `evidence_acquisition@1` vocabulary.
- No UI change: the client still polls `GET /evidence`; terminal unavailability is visible in storage
  and to Story readiness, not yet as a learner-facing message for explicit analysis.
