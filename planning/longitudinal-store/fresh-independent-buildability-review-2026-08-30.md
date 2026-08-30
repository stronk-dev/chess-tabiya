# Longitudinal store — fresh independent buildability review

- **Reviewed:** 2026-08-30
- **Input:** `rfc/longitudinal-store.md` after the D1612–D1617 folded author repair
- **Verdict:** **RETURN TO AUTHOR / NOT ACCEPTED**
- **Reproduction:** `make longitudinal-store-fresh-review` — 7/7 blocker arms
- **Prior author contract:** 10/10 remains green
- **Production status:** untouched; migration, worker, API and consumers remain forbidden

The fold genuinely repairs the previous six returns: the constructor registry is literal, the
decision denominator is normalized, jobs have lease ownership, event cuts are contiguous, all
seven snapshot writers are named, and imported mainlines are refused as personal play. Those
choices survive.

The fresh pass found seven seams where the implementation would still have to invent semantic
identity, concurrency, privacy, storage shape or production reach. The first is data-destroying:
the proposed primary key pools opposite event signs into one learner habit.

## B1 — projection identity drops semantic sign ([[D2063]])

Runtime semantic identity is `(projection, sign)`: the selector's `familyKey` includes both, and
one projection can emit `gained`, `lost` and `preserved` observations. Other families use `state`
or `avoided`. The proposed observation key stores only projection id/version, phase and decision
class. A learner gaining and losing the same structure in one phase therefore increments the same
row; no downstream skill, style, campaign or Review consumer can recover which behavior occurred.

**Required repair:** include the exact closed `SemanticEventSign` in registry/admission identity,
the durable key, refs/equality, filters and revision fixture. Define whether every projection admits
all signs or a literal subset and reject impossible projection/sign pairs. Cross gained/lost and
state/avoided collision fixtures.

## B2 — the exact-cut publication CAS contradicts itself ([[D2064]])

The claim tuple pins `requested_seq=N`, and publication is allowed only if the whole tuple still
matches. The same paragraph says a later request may advance the row to M and the N claimant may
still publish before returning the job to pending. Both cannot be true when `requested_seq` is one
field. The author model hides the conflict: its ownership predicate checks generation/token/worker
but deliberately does not check the requested sequence. The SQL schema has no persisted
`claimed_seq` with which to state the intended distinction.

**Required repair:** separate mutable high-water `requested_seq` from immutable
`claim_requested_seq` (or publish an equivalent exact predicate). State the atomic SQL transition:
ownership CASes generation/token/worker/revision/claimed cut while requiring current requested cut
to be `>= N`; rows and completed N publish together; M remains pending. Cross equality, M>N,
revision change and stale-generation cases against SQLite, not only the in-memory model.

## B3 — rebuild can resurrect deleted behavioral data ([[D2065]])

Account deletion retains shared runs by reassigning their owner to `__legacy`. The RFC correctly
hard-cascades the deleted learner's four private longitudinal classes and explicitly refuses legacy
reassignment for them. But `longitudinal-rebuild --write` then derives over **every** retained run
and uses the current run owner. It can recreate the deleted learner's behavior under `__legacy`,
undoing the promised erasure and retaining the R12-identifying vector in a different row space.

**Required repair:** make deletion suppression durable and rebuild-visible. Either exclude
tombstoned/reassigned runs by an exact existing durable predicate, or add a non-profileable run
disposition in the account-deletion transaction. Prove delete → rebuild → zero observations/jobs
while the shared run remains readable, plus ordinary legacy-migration and active-shared positives.

## B4 — edge opportunity/share semantics are not normative ([[D2066]])

The fold defines mixed-population semantics only for the 13 avoidance rows. It never defines how a
46-row edge adapter converts per-edge events into an opportunity, occurrence or
`alternative_share_sum`, how forced moves behave, or whether distinct event operands on one edge
count once. The only formula lives in the explicitly non-normative historical section. The author
harness takes already-decided `opportunity:boolean` values, so it cannot falsify a wrong collector.

This is not a minor omission: “any legal edge exhibits F” and “both exhibit/non-exhibit choices
exist” produce different denominators, and the latter is what the cited skill research calls
declinable. Avoidance also needs its share direction tied to its `avoided` occurrence rather than
silently accumulating the opposite base event.

**Required repair:** publish one projection+sign-aware algebra over the complete legal population
for edge and population adapters: deduplication unit, declinability rule, occurrence, share
direction, forced-move behavior and ref construction. Run positives through the real
`localSemanticEvents`/`legalAlternativeEdges` boundary with all-exhibit, none, mixed, duplicate-
operand, forced and unavailable alternatives.

## B5 — the “typed read contract” is not a contract ([[D2067]])

The normative fold says only that a read returns `{state, rows}`. It supplies no exported type,
method, filters, row partition or learner/revision scope. The only method signatures are in the
non-normative history; they refer to removed `derived_at`, omit normalized denominator rows and
return structure stats separately without the job state. Implementers and the already-waiting
skills/style/campaign consumers can choose incompatible APIs while satisfying the sentence.

**Required repair:** publish the exact production storage interface and closed result union for
observations, denominators and structure stats, including learner scope, filters, requested
revision/cut, honest unavailable/failed/pending states, ordering and authorization ownership. The
worker/rebuild-only raw operations and future consumer operation must be distinguishable.

## B6 — migration/index and row-integrity authority is incomplete ([[D2068]])

Criterion 1 promises the four tables **and their indexes**, but the normative DDL names no index.
The only indexes are attached to the superseded two-table history. The fact constraints also admit
negative `occurred`, arbitrary share sums, negative structure counts, and pack rows with null
`pack_id` (or non-pack rows with a pack id). Those bytes power every future aggregate. Finally, the
implementation receipt still says `STORAGE_VERSION` is 24 while HEAD is 25.

**Required repair:** publish the complete four-table/index DDL at the current register head and
close the row invariants (`0 <= occurred <= opportunities`, finite share in the defined range,
nonnegative structure counts, session/pack consistency, positive revisions/sequences where
applicable). Reflection and direct-SQL negatives must exercise the literal schema.

## B7 — queued work has no production worker lifecycle ([[D2069]])

The request path is correctly forbidden from projection and every mutation writes a job. But no
server composition symbol, worker entry point, start/stop lifecycle, poll/wakeup rule, batch bound
or operator command processes those jobs. `longitudinal-rebuild` is a repair traversal, not the
continuous background projector. A migration plus jobs can satisfy the current storage tests and
leave every future read permanently pending.

**Required repair:** name one production-composed worker and one operator-visible traversal, its
clock/lease inputs, bounded batch and shutdown semantics. Test create/save/import through the real
application/storage composition, wait on the worker, and observe complete rows; cross provider-
free startup, crash/reclaim, backlog fairness and clean shutdown. Keep legal enumeration off the
request stack.

## Re-review order

1. Repair semantic identity and the edge/population algebra first; they determine the durable key.
2. Separate claim cut from requested high-water and seal deletion/rebuild behavior.
3. Publish exact DDL, read interface and production worker lifecycle.
4. Invert all seven reproductions, preserve the prior 10-arm author contract, rerun the measured
   cost arms and full repository verification, then request another independent review.

No longitudinal migration, consumer, style/card output, campaign credit or content mutation is
authorized by this return.
