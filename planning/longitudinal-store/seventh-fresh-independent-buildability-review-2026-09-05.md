# Longitudinal store — seventh fresh independent buildability review

- **Date:** 2026-09-05
- **Reviewer:** codex, independent of the seventh author repair
- **Input:** `rfc/longitudinal-store.md` after the [[D2598]]–[[D2602]] repair
- **Verdict:** **returned on [[D2718]]–[[D2722]]; no migration, worker, reader, consumer, API or
  client implementation is authorized**
- **Executable reproduction:** `make longitudinal-store-seventh-fresh-review` — 5/5 blocker
  controls, plus the complete retained author chain

## What survived re-review

The seventh repair closes the five local seams it names: denominator order reaches its parser;
callers cannot inject a projection registry through the public parser signatures; accepted source
objects are recursively copied and frozen before hashing; the modeled mutation names are compared
in both directions; and every represented durable state shares one reset shape.

The complete contract is still not buildable. The new controls apply those local mechanisms to the
actual runtime event type, omission and cross-owner boundaries, lexical source spoofing and the
RFC's complete claim tuple. Five false-green seams remain.

## Blocking findings

### [[D2718]] — the source parser cannot consume the real replay authority

`parseRunReplayPrefix` requires each event to have exactly `{seq,type,nodeId}`. A real
`DrillRunEvent` has `{seq,type,at,data}` and the move node lives at `data.node`; even a real one-event
run therefore fails `LONGITUDINAL_PREFIX_INVALID`. In the other direction the parser accepts
`not.a.runtime.event`, seals it and permits it to enter a source digest. The current positive
fixture is a parallel flattened event model, not an invocation of `readBackReplay`.

Repair this with one production-shaped constructor over the exact runtime event prefix and actual
`readBackReplay` result. The positive must originate from `createRun`/runtime mutations; unknown,
malformed, replay-invalid and non-contiguous streams must fail before sealing.

### [[D2719]] — sealed source operands are not complete or cross-consistent

The constructor accepts zero authorship rows for a prefix containing a committed move and accepts
`importedMainlinePlies: 999` for that one-move prefix. Both receive an authoritative digest. It
checks only that supplied authorship rows join; it never proves the required one row per relevant
commit, the imported boundary is within the replayed mainline, or `single_player` agrees with the
resolved authorship population.

Make the constructor derive or compare an exact authorship population and imported boundary from
the locked storage image. Test omission as well as surplus/duplicate/crossed rows, and cross every
structure-disposition consistency arm.

### [[D2720]] — the mutation compiler counts text, not transaction behavior

`compileSourceMutationOperations` is a regular expression over a caller string. Eleven commented
lines satisfy it. It does not inspect production files, resolve the named methods, prove the call is
reachable, or prove the descriptor invokes the watermark update inside the same SQLite
transaction—the exact property the RFC says distinguishes a descriptor from a label.

Derive the census from committed production syntax/semantics and bind every descriptor to the
shared transaction primitive. Comment, string, unreachable-call, outside-transaction, omitted and
surplus mutations must each make a passing production census red.

### [[D2721]] — the “full claim CAS” omits cut, revision, lease and durable owner truth

`ClaimReceipt` carries no `claimedRequestedSeq` or `derivedRev`, and `assertCurrentClaim` receives
neither current time nor the locked run owner/source row. A job whose requested cut and derivation
revision have changed, with a lease expired since 1970, is accepted as current when token,
generation, worker and digest match. The model consequently cannot represent the SQL predicate the
RFC requires for renew, fail and publish.

Use one exact claim receipt and one production CAS predicate containing run, learner, claimed cut,
source digest, revision, generation, token, worker, unexpired lease and current durable ownership.
Mutate each operand independently in both modeled SQL and actual SQLite.

### [[D2722]] — source invalidation does not join the image to the job

`invalidateForSourceImage` checks only that the prior digest equals the job's stored digest. It does
not require either source image's run/owner to equal the job run/learner. A job for
`different-job-run` and `different-job-owner` is successfully refreshed from a sealed image for
`source-run`/`learner`. Sealing proves provenance of an object; it does not prove the object is the
subject of the mutation.

Bind source construction and invalidation to the locked `(run_id, owner_learner_id)` transaction
subject. Cross-run and cross-owner images must fail before changing the watermark, with a real
SQLite rollback fixture.

## Required next author round

Repair these as one storage-owned source/claim authority:

1. construct the source from the actual replayed runtime prefix;
2. derive complete attribution/import/structure operands from locked storage truth;
3. derive mutation closure from real transaction bodies, not matching text;
4. publish the complete claim/CAS tuple; and
5. make the job subject and source subject identical by construction.

Retain every earlier author control and these five fresh negatives. Another genuinely fresh
independent review remains mandatory before acceptance or implementation.

## Author-derivation addendum — [[D2723]]

The first eighth-author trace found one further buildability blocker before modeling began:
`importedMainlinePlies` is said to come from the immutable `imported_games` record, but neither
`ImportedGameRecord` nor the live table contains that field. The existing immutable authority is
the imported replay's primary branch. The repair must derive the boundary from that branch or own
a real schema change; it may not keep a fictional storage operand.
