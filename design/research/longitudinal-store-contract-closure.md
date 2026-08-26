# Longitudinal-store contract closure

**Question.** Are the six returns [[D1612]]–[[D1617]] implementable without inventing persistence
semantics, and what exact contract should the author fold into `longitudinal-store.md`?

**Method.** Re-derived the constructor population from the current evidence catalogue; audited the
seven production `drill_runs` write methods, run event sequence, imported-game record and current
amendment; then built a disposable pure state-machine/aggregation instrument at
`tools/d1612-longitudinal-contract-harness/`. Ten adversarial arms cover exact joins, claim races,
expiry, stale publication, snapshot cuts, interval denominators, operation closure and import
attribution. `[V]`

## Verdict

All six returns have one coherent buildable contract. The store is a durable projection job with
four independent authorities: a literal versioned constructor registry; an atomic
generation/token/lease claim; an exact event-sequence input cut plus publication CAS; and a
family-independent decision denominator. None needs a new chess detector.

The imported-game boundary does need durable subject provenance before personal-style consumers
may use it; revision 1 can honestly ship observed-only meanwhile. The production RFC remains
returned until the author folds the contract and repeat review accepts it.

## 1. The 67-row constructor registry is literal

`LONGITUDINAL_INGEST_REGISTRY` is set-equal to
`SEMANTIC_EVENT_PROJECTION_IDS` and each row carries projection id/version plus exact disposition:

| disposition | adapter | rows | extra authority |
|---|---|---:|---|
| edge | `local_semantic_event` | 46 | — |
| population | `complete_candidate_relation` | 13 | exact versioned base projection |
| path, deferred | `recorded_sequence` | 8 | non-empty reason |

The registry digest covers every byte. Population base joins are literal: the structural
avoidance suffixes join structural events, while `derived.semantic_avoidance.loose_piece@1` joins
`rules.tactic.event.loose_piece@1`. Swapping two valid base ids preserves 46/13/8 and fails
`LONGITUDINAL_POPULATION_BASE_MISMATCH`; this is the negative the count-only RFC cannot express.
`[V]`

## 2. Durable jobs use generation + token + owner + expiry

The smallest claimable row extends the draft with `claim_generation`, `claim_token`, `claimed_by`
and `lease_expires_at`, with state-dependent nullability. Claim is one atomic update from
`pending`, `failed`, or expired `running`, incrementing generation and assigning a new opaque
token, worker and expiry. Only the exact live tuple `(run, derived_rev,
requested_seq-at-claim, generation, token, worker)` may publish. A second live claimant receives
no claim; expiry permits reclaim; the old claimant's publish fails after generation advances.
`[V]`

The prototype's closed failure vocabulary is
`snapshot_invalid | derivation_failed | publication_conflict`. Exact names are author bytes, but
the schema and TypeScript union must be one closed set and unknown text must fail. A failed job may
be reclaimed under a new generation. `[V]`

Crash behavior follows directly:

- before publish: lease expires, a new generation reclaims, and the old token cannot publish;
- after atomic publish: the job is complete (or pending for a newer request), so recovery cannot
  steal it;
- retry after declared failure: a new generation starts from the last completed cut.

## 3. The worker projects an exact event prefix

Run events are durably sequenced from one (`events.ts` assigns
`run.events.length + index + 1`). A claim pins `(run_id, requested_seq=N, derived_rev,
claim_generation)`. If the latest snapshot has advanced to M, the worker reconstructs and
validates the contiguous prefix `events where seq <= N`; it does not project M and label it N.
Missing, duplicate or non-contiguous prefix bytes fail `snapshot_invalid`. `[V]`

Publication replaces rows for exactly N and advances `completed_seq=N` in one transaction only
when the claim tuple still matches. If `requested_seq` advanced to M during work, publishing N
returns the job to `pending`; M is never lost. The prototype proves a request arriving between
claim/read and derive/publish. `[V]`

## 4. Decision denominators are independent

`decisions` cannot live only on emitted family rows. The exact merge model keeps one denominator
per `(run, phase, decisionClass)` and family numerators per
`(run, phase, decisionClass, projection)`. Every decision advances its denominator even when no
family has an opportunity. Family rows update only on an opportunity and read their current
denominator through the shared key. `[V]`

The executable counterexample now passes: decision 1 has no F; decision 2 first creates F and
reads `decisions=2`; decision 3 has no F and advances the existing row to three; phase change is
separate; interval retry is idempotent; incremental output equals a complete rebuild. A normalized
denominator relation is the smallest representation, though an equivalent exact algebra is valid.

## 5. Scheduling owns all seven run-write operations

The production closure is exactly `create`, `createRatedRun`, `createImportedRun`,
`createDerivedRun`, `createRepertoireGapRun`, `save`, and `saveArenaImport`. All seven symbols
exist in `apps/server/src/storage.ts`; omission fails the harness. `[V]`

Implementation may introduce one private persistence primitive called inside each transaction, or
a compiled operation registry. Post-transaction `RunService.#project` cannot satisfy atomic
reachability. The shipping fixture must invoke all seven real methods and prove snapshot bytes plus
job watermark commit/rollback together. Migration-only rewrites remain an explicit rebuild path.

## 6. Imported games are observed until subject provenance says otherwise

`ImportedGameRecord` retains source, headers, result, PGN and import time but no declaration that
the selected player is the learner. `run.start.side` is analysis perspective, not identity.
Revision 1 must label current imports observed-only/unknown and bar them from personal style,
opening performance and skill aggregates. `[V]`

The future durable contract is a closed `learner_asserted | observed_other | unknown` union tied
to selected side. Only `learner_asserted` with a non-empty asserted identity enters personal-play
aggregates. The same PGN imported once as the learner's game and once as a famous game therefore
has different admission without changing its chess bytes. This is learner-asserted provenance,
not identity verification; legacy rows remain unknown. `[M]` contract proposal over the measured
missing field and [[D1617]]'s required boundary.

## Author handoff

Fold the amendment and old normative sections into one specification, then:

1. publish the literal 67-row table and digest bytes;
2. specify claim DDL/nullability, atomic claim/reclaim and closed failures;
3. pin event prefix and publication CAS, including append-during-work arms;
4. normalize decision denominators or prove an equivalent exact merge algebra;
5. own all seven write methods in the same transaction;
6. make revision-1 imports observed-only and add a named import-subject discharge;
7. rerun the ten prototype arms against SQLite/storage plus prior cost/rebuild gates.

No migration or production implementation is authorized until the folded RFC passes repeat
buildability review.

## Limits

- The state machine proves semantics, not SQLite lock performance or worker batch sizing.
- Import subject is asserted provenance, not identity verification.
- No player-style/card/rating/LLM output is licensed by this storage contract.
- No protected design, production schema, migration, RFC status or content changed.
