# RFC: Profile game facts from the existing semantic worker

- **Status:** implementing — complete bounded implementation verified locally 2026-11-05;
  independent contract/implementation reviews, actual200-game migrated-operand/ref workload,
  full14660software/531+7performance/types/build/source-author gates pass. Held content retains
  its exact prior baseline; no capability/native/release clearance. No staging/commit/archival
  in this owner-held wave. Receipt: planning/foundation-source-identity/profile-game-facts-review.md.
- **Author:** codex
- **Created:** 2026-11-05
- **Design refs:** `design/03-product-breadth.md` Learn and return;
  `design/research/player-style-metrics.md` R12 and the 2026-11-05 source/context and cost audits;
  ADR-0005 (evidence may be aggregated, never invented).
- **Exploration gate:** the owner’s player-style/evidence commission D549/D552/D553,
  the 2026-08-12 product-drafting ruling recorded in `rfc/README.md`, and the executed
  D4147/D4149 instrument `make profile-source-cost`. This is source adoption for existing
  measured cards, not a new style, personality, floor or human-validation claim.
- **Depends on:** `foundation-source-identity.md` §§3.8b–e; `longitudinal-store.md` V4,
  complete-cut read and worker lifecycle; `player-style.md` existing game rates.
- **Parent / amends:** the three active RFCs above. This document alone owns the bounded
  claimed GAME context, fourth derived row family and three-source profile migration below.
- **Supersedes / superseded by:** —
- **Planning:** `planning/foundation-source-identity/plan.md` D4147/D4149.

```tabiya-claims
none
```

## Summary

Compute the existing fianchetto setup, knight-screen and initial castling-right operands once
in the existing longitudinal worker. Persist a small typed per-game result beside its current
decision rows, publish everything under the same claimed-cut transaction, and read those results
for all existing profile/card/contributor/share paths. HTTP requests do not open source contexts
or invoke these three collectors. Missing evidence is unavailable, never a negative observation.

## Motivation and measured boundary

The current `LearnerProfileService.deriveRunFact` uses direct chess helpers for these operands.
Its warm cache bypasses the new recorded source owners. Simply calling the live owner per HTTP
position would also confuse the current head with the exact completed cut and nest storage reads.

The executed optional instrument uses200 genuine native64-ply sessions on ten repeated CC0 lines,
the real SQLite worker and full production projector. Production semantic projection costs545.85s;
the three original source-operand probes cost3.389s over26,200values. Cold/warm current profile
reads cost854/352ms, with200/zero additional V4 reads. Four existing cards, first contributors,
denominators, details and sharing match. These are workload measurements, not200 independent human
games or a benchmark of the new issuer/storage/API path. No timing assertion enters ordinary CI.

D4149’s actual201st game has a scripted own-side king move before the owner’s first move. Source1
reports first-side rights at node0; the metric reports first-owner rights at node4. The existing
profile counts201games and200castling-eligible games. Neither operand may be silently substituted.
Source: `design/research/player-style-metrics.md`, dated receipt and executable instrument.

## Specification

### 1. One exact-cut worker source scope

Add a private server-side `ClaimedGameSourceContext`, constructed only by `LongitudinalStore`
from its original sealed `LongitudinalClaim` and its identical `claimSourceImage` V4 object.
The constructor validates same-store authority, original owner/run/cut/source digest/revision,
successful replay and primary path. Before narrowing to that path, validate the **entire** replayed
graph once per cut, as the live source owner does: each FEN must equal its canonical parse/serialize,
every node must join one unique original run.started/move.committed creation event by exact id,
ordinal, sequence, type and original event bytes. Compare the current node with that creation's
closed immutable identity fields used by `recorded-review-boundary.ts` (`id,parentId,fen,
transposeKey,moveUci,moveSan,ply,actor,branchId,createdAt`), allowing only actual replayed later
annotation evolution such as `checkpointRefs`; whole-current-node byte equality is incorrect.
Every adjacent edge of every stored branch must pass
`recordedEdgePayload` with its actual parent. `readBackReplay` alone is insufficient because
`projectRun` appends stored nodes without that legal-edge validation. An unrelated illegal branch
must refuse the whole source scope, never disappear through primary-path selection.
A copied, cross-store, separately acquired or caller-written image/claim cannot acquire the scope.
Acquisition follows the existing digest comparison in
`processClaim`, before projection; it opens no nested transaction and reads no current full-run
snapshot. Existing claim/source identity and publication CAS remain the authorities.

The store retains an immutable identity tuple (owner/run/cut/source/revision/generation/token/
worker) and checks it against the actual current job plus current lease validity on scope reads.
It does **not** compare the original lease-expiry snapshot: normal heartbeat renewal returns a
new claim with a later expiry and must preserve this scope. A different token/generation/cut,
deleted/suppressed owner/run, expiry or observed claim loss permanently retires it. The worker
closes it in `finally`, including drain, publication, failure and conflict. A closed or once-
failed scope never revives after exact bytes are restored. No principal is invented.

The worker passes this private scope to `projectObservations` alongside the existing exact V4
image and checkpoint. The scope must assert object identity with that image before any source
call. Ordinary direct/test projector calls without a genuine claim may still construct the
existing three families, but cannot return an admitted available GAME fact; use explicit
`worker_context_unavailable` fields. Production publication requires exactly one parsed GAME
row for every projected run, including ineligible runs.

Rebuild acquires a separate store-owned read scope, never a fake running claim. In one short read
transaction it captures a current complete job's owner/run/requestedSeq/completedSeq/source digest/
revision/claimGeneration plus its identical same-store V4 image and validates their digest and
completedSeq=requestedSeq. It performs the same complete legal-graph pass before narrowing.
Projection happens **after** that read transaction closes; no long-lived lock is claimed. Scope
reads require the captured complete-job tuple and actual owner/profileable run still match. This
scope has no worker lease or renewal and cannot publish a job. Rebuild checks it immediately before
comparison. Repair checks that same tuple and a fresh existing V4 source digest inside its existing
write transaction before replacing all four families, refusing if the source moved. Both compare-
only and repair close the scope in `finally`; observed failure retires permanently, even if bytes
are restored. This is a bounded extension of the existing rebuild, not a new snapshot framework.

### 2. Narrow foundation prefix backing and GAME context

Extend the private `FoundationRecordedPrefix` backing with a closed `claimed_game` arm while
retaining its existing `live` boundary arm. Its path comes from actual replay, with original
node, FEN, event ordinal/sequence/type identities, stored learner color and claimed event head.
It never labels that cut as the latest live head. The sole new server issuer accepts the
authentic scope, not an arbitrary path or check callback from an application caller. Existing
source-owner import audits must enumerate this one issuer and the existing live issuer.

The castling factory may read either genuine prefix arm without changing its first-stored-side
meaning. Live `decision`, actor occurrence and clock issuance/read paths explicitly refuse
`claimed_game` prefixes; they retain their existing live boundary/role/head checks. A GAME
context is not a learner-action envelope. Snapshot sources still take their original exact
FEN inputs and retain complete original value sets, including both colors and empty populations.
Screen construction uses its identical admitted setup input. No source1 payload or convention
changes, guessed source ply or retrospective action intent are introduced.

This is the explicit bounded exception to foundation §3.8’s `actor_decision` consumer requirement:
the three refs below may also enter this declared GAME reduction under its own genuine claimed
context. Other sources, roles and consumers are unchanged. A context proves membership in an
observed game; it does not prove that the last mover caused, preferred or intended a configuration.

### 3. Cohort and attribution stay distinct

Use the **existing** profile cohort: standard starting position under the existing transpose key,
primary branch only, and at least one normative owner `played` decision on that line. Other
runs get an explicit ineligible row (`not_standard_start` or `no_primary_played_decision`).
All original eligible runs remain counted even when their source fields are unavailable.

This first materialized slice supports owner attribution only when the V4 image declares
`single_player` and **every stored-learner-side primary move** is a proved historical owner
`played` move with its exact move-authorship row/event. Opposite-side actions need not be owner
actions. Imported, shared, legacy, scripted-own-side, coach/native-Match and incomplete role proof
remain counted in the old cohort where applicable, but the three fields are
`role_unavailable`. This is a conservative initial supported attribution domain, stronger than
knowing an isolated positive snapshot. R12 did not prescribe this rule; wider mixed-control support
remains D4140, not a new detector requirement or a permanent rule for all position consumers.

### 4. Finite source consumer and reduction

Register **one callable worker operation** in the existing server evidence-operation census:
consumer id `profile.game_facts`, version1, bound by `evidenceConsumerOperation` to the sole named
`consumeProfileGameFacts` implementation at that same version. The evidence catalog's consumer
declaration and this actual callable share exactly the following three versioned accepts, with
machine-only consumption and no renderer, provider/voice route, move grade or raw eval acceptance:

| source ref (unit: original source identity; total3) | use |
|---|---|
| `rules.structural.reading.fianchetto_setup@1` | first own-color non-root primary snapshot containing a setup |
| `rules.structural.reading.fianchetto_knight_screen@1` | first own-color non-root primary snapshot containing a screen |
| `run.record.castling_eligibility@1` | first baseline only, subject to exact metric-node join |

The actual worker callable, not just an anchor declaration, preflights the full exact consumer
before invoking any of the three factories. Failed static consumer admission throws through the
existing worker `derivation_failed` path with **zero** source calls and no partial publication.
HTTP composition must not acquire a dependency on
the semantic projector/worker merely because the store holds source scopes. No registry fork,
new chess detector, derived prose, selection score, personality or generic metric vector.

On the supported domain, scan complete non-root primary positions in existing ply order, with
checkpoints. Each setup/screen result is reduced for the stored learner color. Retain the earliest
original node/event identity; if all complete snapshots lack it, retain proved-none. Opposing moves
may produce a snapshot; never reclassify them as learner moves. A genuine declared source absence
makes the affected field unavailable even if another snapshot is positive: completeness is owed.

**Failure taxonomy is closed at the actual factory.** Setup returns a declared complete snapshot,
not an availability union; screen currently always returns an available declared snapshot. Neither
currently declares an expected missing-dependency reason. Castling's typed
`first_decision_not_represented` alone maps to its field's `source_unavailable`. An unknown
unavailable reason is an execution failure, not a new abstention policy. Empty setup/screen arrays
are complete negative observations. Configuration's union therefore has no `source_unavailable`
arm at this version. Missing/invalid durable rows use §5's separate read-lane failure instead.

Malformed/copied/crossed input or value, wrong consumer/source tuple, legal-graph failure,
cancellation, expiry/retired scope and unexpected errors **must not** be caught and published as
an unavailable field. Preserve original refusal and existing checkpoint/claim-loss/drain/job
failure behavior. No catch(TypeError)-to-false/unavailable adapter is permitted. `role_unavailable`
is the explicit supported-domain decision in §3; `worker_context_unavailable` is only the genuine
context-absent direct-projector arm from §1, never a substitute for a context that failed validation.

For castling, independently locate the existing metric’s first proved owner played decision’s
BEFORE node. Accept source1 only when its first-stored-side baseline node is that identical original
node, not merely the same FEN. Otherwise retain `source_subject_mismatch`. Store both actual wing
booleans on a match; eligibility remains their disjunction. D4149 must never change201counted to200
or200eligible to201. The conservative role rule may abstain before that join; its direct join
negative must nevertheless exercise the mismatch guard. Actual castled move detection remains
the current exact recorded-move logic, not a new source or rate definition.

### 5. Minimal durable GAME row

Add `learner_game_facts` as a fourth derived family. Common columns:
`learner_id`, `run_id` (owner/run cascading foreign keys), `completed_seq`, `derived_rev`,
`observed_at`, `primary_branch_id`, `learner_side`, `game_json`.
Primary key `(learner_id,run_id)`; run also unique, one row per completed cut. SQL checks enforce
canonical instant, positive cut/revision, color, JSON validity and the closed top-level kind.
The store’s strict data-only parser enforces exact nested fields, enums, integers and unions:

```ts
type OriginalNodeRef = { nodeId: string; eventSeq: number; sourcePly: number };
type Configuration =
  | { kind: "observed"; first: OriginalNodeRef | null } // null = complete proved-none
  | { kind: "unavailable"; reason: "role_unavailable" |
      "worker_context_unavailable" };
type InitialRights =
  | { kind: "observed"; before: OriginalNodeRef; kingside: boolean; queenside: boolean }
  | { kind: "unavailable"; reason: "role_unavailable" | "source_unavailable" |
      "source_subject_mismatch" | "worker_context_unavailable" };
type Game =
  | { kind: "ineligible"; reason: "not_standard_start" | "no_primary_played_decision" }
  | { kind: "eligible"; firstOwnerDecision: OriginalNodeRef;
      fianchetto: Configuration; knightScreen: Configuration; castling: InitialRights };
```

`OriginalNodeRef.eventSeq` is that node's **original creation** event sequence, including
`run.started` for the root; it is not an outgoing decision event. `sourcePly` is its original
rooted-primary path index, not blindly `Node.ply`. `firstOwnerDecision` and castling's `before`
both identify the actual BEFORE node for the metric's first proved owner move; configuration
`first` identifies the earliest positive non-root snapshot node. Verify exact node + creation
event + rooted index at publication and again in the received-row/profile join. Root rights
paired with an outgoing move event sequence must fail, even if its integer looks plausible.

The fixed source/convention identities are the three original refs and
`fianchetto-configuration@1`/`castling-first-decision@1`, pinned in this reducer’s declaration and
derivation revision, not duplicated as arbitrary row metadata. The worker verifies every retained
reference against its actual image/path before publication. Consumers reconstruct existing public
`StyleContributorRef` from the same completed run fact; no full source payload, FEN dump, statistical
floor, editorial string or authentication token is persisted in this row.

Extend `LongitudinalProjection`, strict storage parsers, insert/delete/subject guards,
storedProjection and rebuild comparison with `gameFacts`. Publication deletes/replaces all four
families atomically under the existing full-tuple CAS. Wrong run/owner/cut/revision, missing/duplicate
row, partial JSON or reference outside the claimed path refuses publication. No counters or
decision-opportunity rows are repurposed. Increment the ordinary derivation revision once on landing;
startup invalidates old derived rows and the existing worker rebuilds them from saved play.

The typed read query gets optional `includeGameFacts: true` **outside** its decision filter. Omitted
means an empty GAME result, preserving current consumers. When requested, GAME rows obey run/
session/pack selection, but decision phase/class/projection filters neither truncate nor silently
change their GAME denominator; those filters still govern the original families. Return the same
exact complete-cut result, with `gameFacts` separately typed. For each selected complete cut this
lane returns exactly one `{kind:"available",row}` or `{kind:"unavailable",runId,completedSeq,
reason:"game_facts_missing"|"game_facts_invalid"}`. A missing/malformed required GAME row never
becomes an empty complete GAME result or turns the original three families/cut into unavailable.
Profile retains that run's independently established cohort and abstains affected cards only.
Normal publication still rejects missing/malformed rows; these lane outcomes defend old/corrupt
storage reads. Profile requests the lane for its existing all-complete/played query. No new endpoint.

Migration claims a position behind recorded-clocks; the landing number is then-current
`STORAGE_VERSION+1`, never a reserved integer. Rebase live-following’s claim behind this companion.
Add this table to behavioral-profile/project/hard-delete inventory, the tagged export and raw-
column whitelist, `buildAccountDataBundle`, and derived-import rejection/rederive-only rules.
Account/run deletion cascades; restore never trusts imported GAME rows. Mutation, owner deletion,
source/cut supersession, rebuild, startup and revision reconciliation cover this fourth family.

### 6. All five existing profile paths use the same read

Keep current RunFact work for other measured metrics/openings/results; remove only direct
`hasFianchettoConfiguration`/`holdsCastlingRight` derivation for these three fields. Their warm cache
cannot supply fallback values. Join the parsed GAME row by exact owner/run/completedSeq/revision,
with eligible cohort/primary/color/first-owner refs checked against the existing RunFact. A mismatch
is an affected-source/card abstention, not a whole `store_mismatch` that hides unrelated history.

Overview, detail, `#measuredGames`, `#allContributors` and consented share-card reread all consume
that identical parsed snapshot. A source/role-unavailable field abstains the whole affected card
using existing `incomplete_card{missing:...}`; do not silently drop games, shrink eligibility,
count false, or share an old cached available card. Setup/screen absence remains a true zero only
for observed-null. Rights-false is a legitimate observed noneligible game. Other cards/history/
observations remain available. Keep existing metric ids/versions, floors, intervals, wording,
units, rate numerator logic and original public contributor refs for fully proved games.

`incomplete_card` takes precedence over `below_floor` and all rate arithmetic when any relevant
game has unknown source/role/rights. Its numeric games/decisions metadata may describe the known
cohort, **not** a proved castling-eligible denominator. The existing Profile screen must withhold
its “Measured so far” denominator claim for incomplete cards; known overall history/cohort remains
separate. Detail may list independently proved eligible denominator refs, never unknown games as
eligible or numerator refs for an abstained card. With all rights observed, current eligible-only
below-floor counts and contributor pages stay equivalent. This is D4151's bounded disclosure
correction under this contract, identified by independent integration preflight.

Baseline joins use raw normative `lineDecisions[0]` BEFORE, independently of DecisionFact
construction. Existing `decisionTraitPopulation` filtering can omit a fact, so neither
`game.decisions[0]` nor the public denominator's CHILD-node `gameRef` defines the first-owner
baseline. Preserve those original public contributor choices while checking the independent raw
first-owner BEFORE reference. Positive snapshot contributors retain that snapshot's original node.

**Same-head and recreated-job cache lifetime clarification (D4158, independently reviewed
2026-11-05; both reviewers accepted after recreation and cold-load join repairs).** A write-capable sharing grant can change the existing V4 authorship/source image
and rederive a job without advancing run sequence. Carry the existing completed job's
`requestedSourceDigest` as `sourceDigest` on the internal `LongitudinalCompleteCut`; include it
and the actual learner identity in the existing RunFact cache key alongside run/cut/derivation
revision. Reuse the already stored job identity: no new hash algorithm/domain, source registry, serialized
GAME field, generation counter or cache service. Job generation alone is insufficient because a
deleted/recreated/restored job starts again at zero. The existing V4 identity covers exact source
bytes, owner and authorship; equal-count changes cannot reuse stale decision/reference metadata.
On a cold cache miss, capture the actual same-store V4 image and verify its owner and existing
storage-owned digest against this completed cut before deriving/caching. A same-sequence source
change between snapshot read and cold loading follows the existing unavailable/retry path and
never caches mixed-source facts. Warm hits require no new V4 read or digest calculation.
Unchanged completed sources retain warm reuse and zero new V4 reads. Missing/invalid GAME rows
still abstain affected cards and cannot cause helper fallback. Preserve independently checked
stored denominator-versus-fresh fact mismatch rejection. Prove actual warm→participant grant→
worker rederive→warm/cold equality at the same sequence, plus deletion/restoration/recreation with
reused id/cut and a newly completed job generation. No source digest or claim-generation assignment,
mutation/CAS behavior or profile publication fields change.

### 7. Build and proof boundaries

Implementation order: authentic worker/rebuild scope and foundation backing; exact consumer;
typed fourth family/migration/lifecycle; profile migration; real end-to-end cost and parity.
Prove the source/consumer path before changing profile fields. Ordinary contracts use small
genuine SQLite histories, source failures, real worker/read/profile/API/account boundaries;
do not require the200-game cost run in CI. Run optional cost measurement after implementation
with the new actual issuer/publication/read paths, comparing the existing200-game receipt without
adding timing gates. Log outcomes and bounded limits, not hundreds of MB of raw evidence.

## Deviations from design

None. This explicitly amends foundation’s actor_decision-only admission for one finite GAME
consumer and longitudinal/player-style’s previous three-row/helper implementation. The initial
conservative role domain is disclosed; wider roles and semantic/human qualification remain open.

## Acceptance criteria

1. Genuine same-store claim/image scope; spread/cross-store/wrong-cut/source/owner/revision rejects.
   Complete legal graph and exact unique creation joins precede narrowing; a legal primary with
   an unrelated illegal branch refuses acquisition. A genuinely checkpoint-annotated node still
   acquires; altered immutable FEN/SAN/parent/id does not.
   Real heartbeat renewals stay usable; expiry, token change, drain, close and delete retire, with
   restore-after-observed-failure unable to revive. Existing worker conflict/failure behavior holds.
2. Rebuild uses a genuine read-only exact-cut scope and cannot fabricate a claim or publish a job.
   Complete-job tuple and final comparison/write checks fence source movement between short
   acquisition transaction and projection; no held read lock or worker lease is fabricated.
   HTTP dependency test proves no semantic worker/projector import is introduced via store scopes.
3. Claimed prefix preserves actual path/creation/head. Live decision, actor and clock paths reject
   it. Original live sources and castling payload/first-side meaning remain unchanged.
4. Exact3ref consumer failure prevents every source call and follows ordinary derivation failure.
   Actual worker callable consumes the compiled declaration; source/candidate forgery or a
   registered anchor alone cannot pass. Expected typed castling absence differs from malformed
   authority, unknown reason, cancellation, claim loss and unexpected execution errors.
5. Both colors: exact earliest setup/screen, opposing-move snapshot, complete false, repeated
   positions, primary versus fork, standard/nonstandard, root exclusion and first owner decision.
   First BEFORE versus positive AFTER nodes retain their actual creation sequence/rooted index;
   outgoing-event substitution fails in both publication and profile read.
   Same-side scripted/missing author/shared/legacy role abstains without dropping the eligible game.
6. D4149 actual first-side/first-owner mismatch and direct join negative preserve the metric and
   original source. Both false rights and matched first-node positives remain representable.
7. Strict parser/SQL/read reject malformed/cross-subject/missing/duplicate GAME rows. The read lane
   reports those failures without dropping original decision rows or the counted game. All four
   families publish/rollback/rebuild together. Old revision startup/reopen rederives genuine rows.
   Run/session/pack and phase/class/projection filter combinations prove the separate GAME lane.
8. Actual overview/detail/denominator/numerator/share paths preserve all four existing cards and
   refs on ordinary fully proved histories, including warm reads and cut change. Injected source
   absence abstains affected cards only; unavailable cannot become zero, smaller cohort, stale
   share, unrelated failure or hidden game. No helper/cache fallback for migrated operands.
   Mounted UI withholds incomplete measured-denominator text, and unknown eligibility cannot
   become below_floor. Filtered first DecisionFact cannot retarget the raw first-owner baseline.
9. Real account export/deletion/import/reopen exercises the new inventory and rejects imported
   derived rows; restored sources rederive. No orphan owner/run rows or leaked profile data.
10. Repeat the optional200-game instrument on the actual new worker/storage/profile path and
    report projection overhead, cold/warm profile/detail/share costs and exact parity. No human-
    validity/source-qualification/performance claim follows merely from passing this workload.
11. Appropriate focused tests, ordinary full software/performance/types/build and governance
    pass; execute the held content suite and report its actual baseline separately. Update source
    plan, canonical docs, ledger/work state, research/log and roadmap without promoting whole1.0.

## Discharges

none

This bounded companion owns code/test/documentation work; broader D4140 and held D3928 remain
separately tracked and do not become hidden completion requirements for these three fields.

## Open questions

None. Separate source/ABI and meaning/consumer reviews accepted the repaired concrete scope,
row/filter ABI, conservative domain and five-path handling. Implementation naming that does not
change this contract is engineering-owned; routine reviews and prelaunch migration ordering
need no owner prompt. The review receipt distinguishes contract acceptance from implementation.

## Changelog

- 2026-11-05: drafted from actual200-game cost/parity and D4149 baseline controls plus separate
  source/meaning preflights. Both independent returns refine all-branch legal validation, separate
  complete-job rebuild lifetime, exact callable/three-ref binding, closed failure taxonomy and
  original creation-event/BEFORE-node reference ABI. No production implementation/self-acceptance.

- 2026-11-05: both independent reviewers accept repaired bounded contract. Implementation starts;
  no production completion or self-acceptance.

- 2026-11-05: first worker/rebuild source-scope slice implemented and independently reviewed.
  Final combined14625software/530,7performance/four/types/build/source11 pass; content retains
  its tracked60failures after bounded selected-census cost correction. Three-source consumer,
  fourth family, profile/UI migration and new-path200-game measurement remain unimplemented.
  D4153 earlier unexplained full-run failure remains open; no whole companion completion.

## Amendment log

- 2026-11-05 D4158: independently accepted existing completed-source/actual-owner cache identity
  and same-store cold admission after real same-head and recreated-job counterexamples. No new
  identity domain, counter, source policy or storage schema. Receipt:
  planning/foundation-source-identity/profile-game-facts-review.md.
