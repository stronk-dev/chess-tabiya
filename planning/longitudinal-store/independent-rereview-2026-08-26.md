# Longitudinal store — independent buildability re-review

- **Reviewed:** 2026-08-26
- **Input:** `rfc/longitudinal-store.md` after the 2026-08-24 amendment
- **Verdict:** **RETURN TO AUTHOR / NOT ACCEPTED**
- **Scope:** constructor closure, durable worker recovery, snapshot publication, incremental
  aggregation, run-write reachability, and imported-game attribution

The amendment fixes the original return's largest failures: request-path projection is refused on
measured latency, observation time is immutable, decision references are typed, the revision binds
two digests, and shared-run predictions abstain when the actor is unknowable. The per-run grain and
background schedule remain the right foundation.

It is still not implementable without inventing production semantics. Five blockers are contract
gaps; a sixth is an overclaim that would make downstream player-style results dishonest. None is a
request for more broad research.

## B1 — the promised exact constructor registry exists only in a disposable harness

The normative amendment gives a three-member union and the totals 46 edge / 13 population / 8
deferred path. It does not enumerate the 67 rows, the eight deferred ids, or the thirteen
avoidance-to-base joins. The only literal implementation is in the disposable
`tools/d1405b-single-decision-harness/cost.test.ts`: `PATH_IDS`, the two avoidance arrays, and
`baseProjection()`. That instrument explicitly says it is not production code.

This matters beyond bookkeeping. `baseProjection()` contains a semantic exception:
`loose_piece` joins `rules.tactic.event.loose_piece`, while the other suffixes join structural
events. A generic suffix rule is therefore already false for one member. An implementer can pass
the RFC's count and set-equality criteria while assigning a population row to the wrong base.

**Required amendment:** publish the literal 67-row registry in the RFC or a normative checked-in
table it names. Every row carries projection id + version, disposition, adapter, and for population
rows the exact base projection id + version. The registry digest covers all of those bytes. A
negative fixture swaps two valid base ids while preserving the 46/13/8 counts and must fail.

## B2 — the durable job cannot be claimed or recovered safely

The proposed `learner_observation_jobs` row has `pending | running | complete | failed`, but no
claim token, worker identity, lease/expiry, attempt number, or comparable-and-swappable generation.
In the supported hosted multi-user topology (`design/02-product-shape.md`), two workers can claim
the same pending row; after a process dies, a row can remain `running` forever. Criterion 8 promises
crash-before-publish recovery without specifying a state transition the schema can distinguish
from stealing live work.

`failure_code` has the same mismatch: prose and criterion 8 call it closed, but the DDL admits any
`TEXT` value.

**Required amendment:** specify one literal claim protocol and schema. At minimum it needs an
atomic claim generation/token plus expiry or an equivalently safe single-owner rule, a stale-claim
recovery transition, compare-and-swap publication, and a closed failure-code vocabulary. Fixtures
must cover two simultaneous claimers, expiry/reclaim, the old claimant publishing after reclaim,
process death before publish, process death after publish, retry after a declared failure, and an
unknown failure code. In-memory `EvidenceJobQueue` is not precedent; it has no durable recovery.

## B3 — the worker has no pinned snapshot cut or publication CAS

The job records `requested_seq`, but the database stores only the latest run snapshot. A worker can
claim sequence N, then read a snapshot already at M>N. The amendment does not say whether it must
replay the prefix through N, project M, or abort. Nor does it say what happens when a request moves
`requested_seq` again while rows for N are being published. Marking N complete after projecting M,
or replacing M's rows with an older N projection, are both representable under the proposed DDL.

**Required amendment:** pin the worker input to an exact `(run_id, requested_seq, derived_rev,
claim_generation)` cut; specify how the N-event prefix is reconstructed and validated; publish rows
and `completed_seq=N` only through a CAS on that cut; and leave/reopen the row as pending when a
newer request exists. Able-to-fail fixtures append an event between claim/read and between
derive/publish, then let the stale claimant finish.

## B4 — interval aggregation undercounts the family-independent decision denominator

The amendment changes whole-run replacement to interval processing but never defines the merge
algebra. `decisions` is family-independent while rows exist only after a family has at least one
opportunity. If decision 1 has no opportunity for F and decision 2 first creates one, inserting F's
interval row with `decisions=1` is wrong: the declared row value is 2. If decision 3 has no F
opportunity, F's existing row still must advance to 3. Processing only families emitted in the new
interval cannot satisfy either case.

The same issue applies after a revision rebuild and across retrying an interval. Criterion 8's
generic idempotency fixture does not force this shape.

**Required amendment:** define the exact additive/replacement algebra, including how phase/class
decision totals update every extant family row and seed a newly appearing family with prior totals.
Alternatively normalize decision totals into a separate keyed relation. Negative fixtures must
cover late first opportunity, later no-opportunity decisions, retry of the same interval, phase
change, and equality with a complete rebuild.

## B5 — seven production run-write shapes are not an owned scheduling boundary

The amendment says every persisted run mutation upserts the watermark in the run-persist
transaction, but HEAD has seven distinct production SQL shapes that create or replace run bytes:

1. ordinary `create`;
2. `createRatedRun`;
3. `createImportedRun`;
4. `createDerivedRun`;
5. `createRepertoireGapRun`;
6. ordinary `save`;
7. `saveArenaImport` (a separate snapshot update transaction).

Calling `RunService.#project` after some of them is not sufficient: the amendment requires the
watermark to commit with the run bytes, and `#project` is outside storage transactions. One missed
creator produces a valid run with no job forever.

**Required amendment:** name the single storage primitive that all seven operations must call, or
publish a set-equal operation registry and test every member. The acceptance test creates and then
mutates one run through every production operation, asserts run bytes and watermark advance in one
transaction, and makes omission of any operation fail. Migration-only snapshot rewrites stay
separately declared; upgrade/rebuild owns their scheduling.

## B6 — imported `game` rows do not establish personal play

The RFC correctly says a source-mainline `game` row is a historic player's move and **does not
assert that player is the learner**. It then calls imported runs the point of a longitudinal profile
and cites “tells you all your openings” as a blocker this store removes. The import request records
a viewing/analysis side in `run.start.side`; `ImportedGameRecord` stores source, headers, result,
PGN and import time, but no declaration that the selected player is the learner. A famous game and
the learner's own game are indistinguishable.

The rows remain honest as “games this learner imported/observed.” They are not admissible evidence
for personal style, opening performance, or skill. Keying them by learner does not change that.

**Required amendment:** state `game` revision 1 as observed-only and prohibit personal-profile
consumers from treating it as authored play. Add a named discharge for a durable import-subject
contract (`learner_asserted` / `observed_other` / `unknown`, tied to the selected side) and the
legacy-unknown migration posture, or include that contract now. A downstream style fixture imports
the same PGN once as the learner's game and once as an observed famous game; only the first may
enter personal-play aggregates.

## Re-review hygiene

The amendment says it supersedes conflicting §§2–4, 6–7 and AC-1–AC-11, but leaves the old
two-table/`derived_at` DDL, synchronous `replaceObservations` path and eleven old criteria in the
same normative document. The precedence sentence is enough to diagnose the intended answer, not
enough for acceptance. Fold the amendment into one specification and one criterion list before the
next review; the landing implementation must not choose between two live code shapes.

## What remains accepted in substance

- per-run rows rather than mutable cross-game totals;
- phase + decision-class split and owner-or-nothing attribution;
- exact legal-population denominators and honest-empty rows;
- background-only semantic projection at revision 1;
- immutable observation time and typed decision refs;
- paired output/registry revision digests;
- no renderer, rating, cohort, provider, LLM or style verdict in the storage RFC;
- authoritative rebuild and hard deletion/export obligations.

The next author round should repair these six seams, fold the document, refresh the migration
register against HEAD, and then receive another independent buildability review. No migration or
production projection code is authorized meanwhile.
