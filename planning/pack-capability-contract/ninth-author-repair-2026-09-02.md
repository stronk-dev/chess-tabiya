# Pack capability contract — ninth author repair

- **Date:** 2026-09-02
- **Rows:** [[D2524]]–[[D2529]]
- **Artifact:** `rfc/pack-capability-contract.md`
- **Executable author evidence:** `make pack-capability-ninth-author-repair` — 6/6 plus strict TypeScript
- **Production authorization:** none; another fresh independent review is required and [[D560]] remains whole

## What changed

The durable result is now one closed settlement union. Its success arm stores the evidence payload,
the exact acquisition receipt and `objectiveProposal` as a value-or-null member. Apply derives its
events from that stored value after restart; it does not rerun the objective upgrader. Unavailable
and provider-unavailable-empty arms retain the exact availability snapshot and an optional real
failure, so the consumer cannot invent a provider attempt merely to fill a column.

Admission now has a parent batch. Explicit analysis requires one retained `Idempotency-Key` and
commits its full ordered 1–16-job request atomically. Story completion and automatic enrichment use
versioned keys derived from immutable branch/node identities. Equal replay returns stored persistent
UUIDs; an unequal digest under the same `(run, origin, key)` scope refuses without writes.

One storage adapter owns all coupled mutations. `commitRunMutationWithEvidence` joins the run CAS,
event bytes and automatic jobs. `commitRewindWithEvidenceCancellation` joins the rewind and exact
pruned-job cancellation. Settlement and evidence application/consumption retain their own atomic
operations. Runtime rewind no longer owns a queue side effect, and service code cannot save then
enqueue.

## Able-to-fail controls

1. a success without explicit proposal value-or-null fails the strict type image;
2. no-fresh-failure provider unavailability compiles, while unavailability without availability fails;
3. a fault during run-plus-enrichment preserves the old run and admits zero jobs;
4. a fault at the middle of a three-job analysis batch leaves zero batch/job rows;
5. equal replay returns the stored id while a crossed digest conflicts; and
6. a rewind storage fault preserves both the old run and its admitted job.

The earlier eighth author controls remain green. The historical independent return instrument now
rejects the four repaired contract absences and continues to observe the two expected unimplemented
production orderings; it is not a post-repair acceptance gate. This repair changes only RFC, author
artifacts and tracking; it does not change production, storage, schema, API, content or pack bytes.

## Next

A genuinely fresh review must attack exact JSON parsing, optional-failure handling, concurrent
same-key admission, response loss after commit, internal plan-version stability, multi-node batch
ordering and every run/job fault boundary. Acceptance and implementation remain forbidden until
that review passes.
