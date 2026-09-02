# Pack capability contract — ninth fresh independent buildability review

- **Date:** 2026-09-02
- **Reviewer:** Codex, independent of the ninth author repair
- **Verdict:** **RETURNED** on [[D2542]]–[[D2547]]
- **Executable receipt:** `make pack-capability-ninth-fresh-review` — 6/6 findings

## What survives

The ninth repair moved the contract in the right direction. A complete success settlement retains
the proposal value-or-null; unavailable results no longer manufacture provider failures; explicit
analysis has one batch boundary; all three origins have restart-stable keys; run mutation and
enrichment share a transaction; and rewind no longer performs a queue side effect before run save.
The 0–8 enrichment bound matches the runtime's 2–8 group limit. The retained eighth and ninth author
targets reproduce.

This return is narrower than those changes. It attacks whether the durable rows can actually prove
the identities, leases and replay results that the prose now promises.

## Blocking findings

### [[D2542]] — child jobs are not bound to their batch identity

`evidence_jobs` repeats `run_id` and `origin`, but its foreign key covers only `batch_id`. The exact
DDL accepts a `story_completion` job for run B beneath an `explicit_analysis` batch for run A. The
job's own origin/consumer check still passes. Either make `(batch_id,run_id,origin)` one composite
foreign identity or remove the duplicated columns and derive them. The parser must also prove that
ordered child jobs are exactly the canonical request population rather than merely individually
valid rows.

### [[D2543]] — stale workers have no lease fence

The settlement operation promises a lease/generation/request check and late-result rejection, but
the schema stores only owner and expiry. Once an expired job is leased again to the same worker id,
the old and new claims have identical durable identity. Store a monotone lease generation or random
lease token, change it on every claim/reclaim, and require exact equality in settle, retry,
cancellation and late-result discard.

### [[D2544]] — request digest bytes are undefined

Both job and batch digests are said to be canonical and rechecked, but there is no exact request
type, field order/domain, byte function or namespace prefix. Two ordinary JSON encodings of the
same object produce different SHA-256 values. Define literal `EvidenceJobRequestV1` and
`EvidenceBatchRequestV1` preimages and reuse one named canonical authority; include origin, ordered
ordinal, node, kind, bounds and every provider-relevant byte once.

### [[D2545]] — concurrent first flight is prose-only

The author model is one synchronous `Map`. The schema's unique constraint can pick a winner, but the
contract does not say whether admission uses immediate serialization, insert-on-conflict plus
re-read, or retries a busy/constraint loser after the winner commits. Those choices expose different
HTTP results. Specify the exact two-connection protocol and test it against SQLite. The same
authority must name the batch UUID constructor; its JSON currently declares only `jobId` even though
replay promises a stored `batchId`.

### [[D2546]] — rewind's state set is not the durable state set

The transaction cancels `pending/running/staged`; none is a complete match for the durable union
(`admitted`, `running`, `retry_wait`, `settled_*`, `cancelled`, `consumed`). The important old
in-memory `staged` case is now an unconsumed `settled_success`, but no normative transition says
whether it cancels. Name the exact cancellable source-state set and the no-op/refusal behavior for
every terminal state, including a lease-token fence for running work.

### [[D2547]] — consumption has no application receipt

The atomic apply operation promises exact replay and criterion 27 rejects unattached consumed rows,
yet a consumed row stores only a timestamp beside its settlement. It cannot prove which run revision
or event sequence range received the evidence/objective events. Persist a receipt containing the
before/after run revision, exact event range and canonical event digest (or an equivalent closed
join), and validate it on reload and response-loss replay.

## Required bounded repair

1. Close the batch→job relational identity and exact ordered child population.
2. Persist a lease fence used by every worker transition.
3. Define canonical job/batch request types and digest bytes.
4. Specify and execute real two-connection same-key admission, including batch UUID replay.
5. Replace conceptual rewind states with the exact durable transition table.
6. Persist and validate an evidence-application receipt.

Then rerun the retained author targets and this review, followed by another genuinely fresh review.
No production queue, migration, API, schema, content or pack implementation is authorized.
