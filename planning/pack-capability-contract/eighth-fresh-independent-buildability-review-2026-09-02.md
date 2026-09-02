# Pack capability contract — eighth fresh independent buildability review

- **Date:** 2026-09-02
- **Artifact:** `rfc/pack-capability-contract.md` after the eighth author repair
- **Verdict:** return to author on [[D2524]]–[[D2529]]
- **Executable review:** `make pack-capability-eighth-fresh-review` — 6/6
- **Author controls:** `make pack-capability-eighth-author-repair` remains green independently
- **Production authorization:** none; [[D560]] remains whole

## What survived

The eighth repair closes the exact outer populations it was asked to close. The HTML shared-token
route now has both stored scope branches; the evidence worker has two explicit provider operation
ids; the four concrete enqueue calls collapse truthfully to three origins; and HTTP admission is no
longer described as provider success. A durable lease/retry/settlement row is the right mechanism.

The fresh attack followed the proposed row through the production result, mutation, batch and
provider-result boundaries. Six required values or transactions still fall outside it.

## Blocking findings

### D2524 — a settled result is wider than its provider payload

`EvidenceJobQueue.#execute` can run `ObjectiveEvidenceUpgrader.evaluate` and place the resulting
`objectiveProposal` beside the payload in `StagedEvidence`. `RunService.applyEvidence` reads it and
may append additional objective events. The proposed table persists `payload_json` and the provider
receipt only. Closing and reopening between settlement and apply therefore either loses the
proposal or requires an undeclared recomputation whose inputs and result may have moved.

The durable result must retain the validated proposal (including explicit absence) and apply the
same settled bytes, or the production proposal path must be deliberately removed before migration.

### D2525 — F3 cannot store one legal provider-health result

The exact upstream union F3 says it consumes permits `ProviderOperationResult.kind = unavailable`
with no new `ProviderFailureReceipt`. That is necessary for states such as cached-exact-only with no
matching cache. F3 requires failure data in both `retry_wait` and `settled_unavailable`. It cannot
lawfully invent a failed provider request where none occurred.

The job result must retain the exact availability/cause and make a no-fresh-failure unavailable arm
representable. A crossed fixture must reject synthesizing a failure receipt merely to satisfy SQL.

### D2526 — automatic enrichment is still outside the run commit

Both learner and opponent move paths call `storage.save(result.run, lease)` and only afterwards call
`#enqueueMoveEvidence`. A crash after the first call commits the node but never admits its required
enrichment. Making the later insert durable does not close the gap.

The repair needs a transactionally coupled outbox/admission written with the run event, or one
deterministic restart reconciliation that proves every committed eligible node has the exact job.

### D2527 — analysis admission is a batch, not one row

The REST operation accepts 1–16 distinct `nodeIds` and returns one 202 containing one `jobs` array.
`RunService.analysis` currently loops individual enqueue calls. The RFC's criterion admits and
crash-tests one job only. A prefix can therefore commit without the response, and a retry can
duplicate that prefix.

Specify one atomic batch/idempotency boundary, or change the API to an explicit partial-admission
result. Per-row correctness is insufficient for the shipped request contract.

### D2528 — no durable idempotency identity exists

The proposed table has a primary job id and a request digest, but the digest participates in no
unique key and there is no origin/batch/idempotency key. The live `evidence-job-${++counter}` id
also restarts with the process. Story/enrichment discovery and response-loss retry can therefore
admit duplicate provider calls and duplicate evidence rows.

Define server-generated persistent ids plus the exact dedupe grain for explicit analysis, Story
completion and automatic enrichment. The three origins need not share one grain; they must each
have one.

### D2529 — rewind cancellation commits before rewind

Runtime `rewind` calls `jobObserver.onRewound` while constructing the mutation. `RunService` saves
the resulting run afterwards. A lease race or storage fault therefore cancels pending/running/staged
work for a rewind that never committed. F3 names graph supersession as a terminal cancellation but
does not join it to the run transaction.

The rewind event and matching job cancellations must commit atomically. The able-to-fail fixture is
a storage fault after cancellation but before save: the old run and its jobs must both remain.

## Required next pass

Extend the durable result shape to every staged output; align it with provider-health's complete
unavailable union; define origin-specific persistent identity and batch admission; couple automatic
enrichment and rewind cancellation to their run transactions; and crash-test every boundary. Then
rerun the previous 60-route/two-worker controls plus these six independent falsifiers.

No schema, capability registry, migration, queue, storage, API, content or pack implementation is
authorized from this returned draft.
