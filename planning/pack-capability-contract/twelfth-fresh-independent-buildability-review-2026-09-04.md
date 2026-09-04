# Pack capability contract — twelfth fresh independent buildability review

- **Date:** 2026-09-04
- **Reviewed:** twelfth author repair for [[D2587]]–[[D2592]]
- **Gate:** `make pack-capability-twelfth-fresh-review` — complete retained chain, new 6/6
- **Verdict:** **RETURNED on [[D2673]], [[D2674]], [[D2675]], [[D2676]], [[D2677]]**

## What survives

The objective-request parser now closes and freezes its represented nested shape, the stored-batch
validator joins a parsed run identity, all three admission origins derive their consumer, and the
per-run sequence row stays monotone across the demonstrated rewind/restart case. Those controls
remain green. The return is about composing those authorities into the actual transaction and
replay surfaces rather than exposing parallel unguarded helpers.

## Return

`deriveRecordedGuardOutcome` brands a caller-supplied `emitted` array. A caller can select honest
empty or arbitrary feedback text/extra fields without invoking the registered guard. Likewise,
`applyEvidenceAndConsumeJob` accepts a plain job and minimally tagged settlement; it attaches and
marks consumed a job for a node absent from the run, and accepts a payload missing the live
`EvidencePayload.source` plus an empty acquisition object.

`settleSuccessWithSequence` composes the durable counter with neither the settlement parser nor the
required lease owner/generation/request receipt. Its update predicate is only id/run/running, and a
successful transition leaves the old lease fields attached. Finally, the concurrent admission
worker's replay arm checks only the batch digest. After the first flight, corrupting the stored
child request/digest still produces a successful equal-key replay with the same job id.

## Required repair

Remove caller event/job/settlement authority from apply. Inside one storage transaction, load and
parse the settled-success row, join its node/FEN and CAS-owned run, invoke the exact registered guard,
derive the complete event suffix, consume that same row and store/reload the receipt. Compose
sequence allocation with the exact lease/generation/request CAS and clear lease fields on success.
Before replaying an admitted batch, run the complete batch/child/run validator and fail corruption.
Then run another genuinely fresh review. No pack/schema/storage implementation is authorized.
