# Longitudinal store — second fresh independent buildability review

- **Reviewed:** 2026-08-30
- **Input:** `rfc/longitudinal-store.md` after the D2063–D2069 second author repair
- **Verdict:** **RETURN TO AUTHOR / NOT ACCEPTED**
- **Reproduction:** `make longitudinal-store-second-fresh-review` — 6/6 blocker arms
- **Prior author contract:** 19/19 remains green and is now classified as incomplete evidence
- **Production status:** untouched; migration, worker, readers and consumers remain forbidden

The repair closes the seven previously returned seams: sign identity, complete-population
arithmetic, immutable claim cuts, deletion suppression, literal DDL, one typed reader and a named
background worker are all materially stronger. This pass applied those pieces to the current phase
classifier, upgrade population, measured worker duration and SQL ownership boundary. Six further
implementation choices remain, four of which can silently omit or misattribute learner history.

## B1 — the stored phase union rejects a legitimate classifier result ([[D2227]])

`classifyPhase` returns the closed runtime union `opening | middlegame | endgame | unclear`; its own
tests exercise `unclear`. Both longitudinal tables and `LongitudinalReadQuery` close the phase union
at only three members, while the only derivation rule says to use `classifyPhase(parent.fen).phase`.
An ordinary unclassified position therefore cannot be inserted. Dropping it would also corrupt the
family-independent decision denominator, and coercing it into a named phase would manufacture a
classification the phase authority explicitly refused.

**Required repair:** carry `unclear` as an honest phase band end-to-end, or specify a typed exclusion
that also defines denominator and consumer behavior. The former preserves the classifier authority.
Cross an actual FEN for each of all four runtime outcomes through SQLite, aggregation and the read
filter.

## B2 — the live contract deleted its decision and structure derivation ([[D2228]])

The folded section is declared the only normative implementation contract and the historical
section “must not be implemented.” Yet decision identity, the exact `played | game | predicted`
classifier, phase source, root-key construction, branch ownership and the formulas for
`branch_count`, `rewound_count`, `forked_count`, `group_count` and `outcome_count` exist only in that
historical section. The fold gives DDL and says denominators are computed, but not which durable
events enter them or how structure rows are produced. Two incompatible projectors can satisfy all
17 live criteria.

**Required repair:** move the complete event-to-decision and event-to-root algebra into the folded
contract, including imported-mainline and prediction precedence, owner/grant/match attribution,
`classifyPhase` handling, canonical refs/order and every structure counter. Compile fixtures from
real run events; a prose pointer into the non-normative history is not authority.

## B3 — the default lease is shorter than measured valid work ([[D2229]])

The RFC fixes `workerLeaseMs=30000` and supplies no heartbeat or renewal operation. Its own final
measurement reports **47.29 seconds** p95 for an 80-ply run. A valid worker can therefore lose its
lease before deriving one run; another generation reclaims it, and the first publication rolls
back. With a four-claim batch, later claims can expire while waiting even sooner. The author worker
model only increments an in-memory counter and never advances a clock across real derivation, so
19/19 cannot observe this liveness failure.

**Required repair:** specify an ownership-safe lease renewal/heartbeat CAS, claim only immediately
executable work, or derive a lease bound from measured worst-case work with an explicit margin.
Cross a real slow positive beyond 30 seconds, renewal/reclaim races, a four-item batch and shutdown.

## B4 — `all_complete` is complete only over jobs that happen to exist ([[D2230]])

The reader says `all_complete` selects the learner's profileable **jobs**. A profileable run with no
job is outside that universe, so the result can be `complete` while omitting the run entirely. The
same paragraph's `not_requested` arm applies only after a requested run is already named; it cannot
detect absence from the all-history census. This is the exact green-by-omission shape the store is
meant to prevent.

**Required repair:** define `all_complete` from the authoritative eligible run set and left-join
jobs, returning `not_requested` for any missing job. Seal the run-set cut in the same transaction.
Cross one eligible jobless run, one suppressed run, one deleted run and concurrent creation.

## B5 — upgrade reach for existing runs is not owned ([[D2231]])

All seven future write operations enqueue jobs, but the migration explicitly performs no backfill.
The text says operators may run `longitudinal-rebuild --write` after upgrade, without making that a
startup/upgrade obligation or defining how it creates the job/cut state consumed by the production
reader. Existing runs that are never saved again therefore remain jobless; B4 then hides them.
“Migration-only snapshot rewrites enqueue” does not cover this migration because it rewrites no
snapshots.

**Required repair:** own one idempotent upgrade/startup reconciliation that enumerates every
eligible existing run and creates the exact requested cut/job without doing semantic work on the
request path. State its relation to rebuild and the appliance upgrade receipt. Cross an old database
with untouched imported/native/shared runs and a restart midway through reconciliation.

## B6 — SQL does not bind a learner row to the run owner ([[D2232]])

Every longitudinal table independently references a valid learner and a valid run, but no foreign
key or publication predicate proves they belong together. Direct SQL can create a job for learner B
over learner A's run; the authenticated reader then truthfully authorizes B and returns A-derived
facts under B's row space. The author SQLite fixture creates only the matching happy path and its
“fact/provenance constraints” negatives never cross two valid learners.

**Required repair:** make run/learner ownership a database-checked or transaction-CASed invariant
for job creation and publication, including owner change/account deletion. Cross two valid learners,
a shared writer who is not the owner, owner reassignment, and a stale publisher after reassignment.

## Re-review order

1. Close the four-way phase and normative decision/root algebra; those determine every row.
2. Fix lease liveness before choosing production batch behavior.
3. Define the eligible-run census and upgrade reconciliation together.
4. Bind learner/run provenance in SQLite and publication.
5. Extend the author model with able-to-fail real positives for all six seams, rerun the cost arms
   and full repository verification, then request another independent review.

No longitudinal migration, consumer, style/profile output, campaign credit or content mutation is
authorized by this return.
