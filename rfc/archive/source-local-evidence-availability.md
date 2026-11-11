# RFC: source-local evidence availability

- **Status:** implemented — 2026-11-11. Source-local calculation, selector3 and durable revision 10 verified through actual migration, reads, rebuild, account lifecycle and measured worker cost.
- **Author:** codex, under the owner's full-foundation and pre-launch zero-legacy rulings.
- **Created:** 2026-11-10
- **Parent / amends:** subject-safe-semantic-selection.md §§5.1–5.3; longitudinal-store.md
  §A.2, especially A.2.5a; evidence-value-authority.md and semantic-validation-authority.md
  only at the existing source/validation boundaries named below.
- **Work:** [[D4200]], with [[D1716]], [[D4167]] and [[D4175]] retaining their wider duties.
- **Planning:** existing planning/foundation-source-identity/plan.md and exploration/log.md.
- **Exploration gate:** the owner's full-foundation/zero-legacy direction, executed D4200 strict
  availability probe and independent downstream code audit recorded in the cited dossier/log.
- **Depends on:** the implemented original candidate/source graph and current longitudinal
  revision9 publication/read/rebuild ownership; no unaccepted collector or provider API.
- **Design refs:** design/02-product-shape.md §Adoption posture; design/03-product-breadth.md
  §Structural reading; design/05-in-run-experience.md §§1,3-forms,3b-i,5; ADR-0005.

```tabiya-claims
none
```

## Accepted scope correction

`archive/one-edge-collector-closure.md` independently supersedes §§2/3's selection55 with actual
local41 + condition13 = selector54. Trade requires recorded captures and is excluded only from
one-edge admission; recorded factories, Profile54 and revision10 duties remain unchanged.

## Summary

Keep complete evidence usable when an unrelated collector cannot evaluate, while carrying
unknown coverage explicitly through selection and stored statistics. Reuse original source
ownership, add one compact per-decision evaluation family, and preserve full legal denominators.

## Problem and exploration gate

The actual original WIDE witness `k7/8/8/8/8/1p6/PP6/R6K w - - 0 1`, played `a2b3`, has
12 legal moves and 13 complete position-source cells. A legacy defender-exposure event abstains
on the discovered-check child. All seven probed outcome families nevertheless return unavailable,
including loose_piece2, despite **zero unavailable modern mover-risk positions**. This follows
the accepted global policy; it is not an implementation violating that policy.

Executed evidence and independently reviewed code audit:
design/research/avoidance-subject-identity.md §§2026-11-10; the strict disposable
`make counterfactual-availability-probe`; packages/runtime/src/semantic-subject-outcomes.ts;
semantic-evidence.ts; internal/longitudinal-native-incidence.ts; internal/profile-subject-facts.ts.
The audit identifies four coordinated boundaries, not a missing switch:

1. The source calculator rejects every family for any canonical collector abstention.
2. Selection rejects both before family work and when any one outcome family is unavailable.
3. Native incidence separately rejects all seven native families.
4. The Profile composer drops native, condition and prevalence lanes if any required lane fails.

The existing selection result has no per-source completeness. Persisted decision summaries are
whole-population complete/unavailable, and missing statistical rows do not encode source-level
unknowns. Simply continuing past an unavailable result would manufacture apparent zeros.

## Scope and changed contracts

Deliver availability through original sources, selection, worker reduction, durable coverage,
publication, typed reads, rebuilds and account lifecycle. Source-only implementation is a staged
checkpoint, not completion of D4200. No new collector, chess predicate, ranking weight, personal
metric, bot preference, learner default, content migration or automatic assistance activation.

This supersedes the parents' global abstention policy only at these boundaries. The parents
remain implementing. Their other discharge obligations and D3928's content/native/release hold
remain. The wider seven source qualifications and 26 ordinary avoidance bindings remain separate.

## 1. Original sources and exact unavailable causes

Reuse the existing candidate receipt owner, original sealed collector outcomes and complete
root/every-child source vectors. No new issuer, callback resolver, registry or graph cache.
`readCandidateFoundationSources` authenticates the original WIDE receipt first. Every original
legal move stays present; the selected member is excluded only when counting alternatives.

The current candidate abstention vocabulary is exactly:

| Exact failed event ref | Reason | Affected event incidence/prevalence |
|---|---|---|
| rules.tactic.event.loose_piece@1 | invalid_turn_clone | that exact event ref |
| derived.tactic.defender_exposure@2 | invalid_turn_clone | that exact event ref |

Only an original sealed outcome joined to its original row/ref/reason can establish this cause.
The legacy loose-piece event is not the total mover-risk reading. Never infer one failed from
the other. Unknown refs/reasons, contradictory labels, foreign child/source identities and
unaccounted outcomes refuse. An extension cannot inherit availability through a prefix/default.

For each of the 13 existing condition families, retain its existing `familyInputs` vector over
the root and every child. All exact required inputs must exist and validate their original
membership. Non-risk vectors are never replaced by empty arrays. loose_piece2 additionally
requires the genuine `rules.tactic.reading.mover_piece_risk@1` result for every position. A real
`invalid_turn_clone` there makes **that family** unavailable; no Boolean false is invented.
Other required-source integrity failures remain refusals. Known unrelated legacy event
abstentions do not invalidate a complete required-family vector, even for loose_piece2.

The 13 factory refs stay @2: their subjects, state/relation algebra, exact inputs and numerical
denominators are unchanged. Their availability policy is amended explicitly before archival;
semantic receipts must be regenerated, never inherited as proof of this expanded domain.
Raw candidate rows/abstentions remain truthful and unchanged; compiler7 construction semantics
do not change merely to remove a consumer's blanket refusal.

## 2. One finite completeness image

Use the existing exact source sets, not a second hand-maintained feature registry:

- selection: current 42 played refs plus 13 condition refs, exactly 55;
- persisted subject/prevalence consumption: native7 + condition13 + prevalence34, exactly 54,
  excluding trade1 and deferred multi-edge paths as the accepted parent already requires.

The existing immutable ingest-registry-v3 contract and current exact selector declarations bind
these sets. Assert set equality, not a length-based filter. A future set change requires a new
coherent ingest image/derivation revision; revision10 records can never silently cover new refs.

Represent unavailable entries with this closed literal grammar:

```ts
type Member = { readonly kind: "root" }
  | { readonly kind: "child"; readonly moveUci: string };
type UnavailableSource = {
  readonly projection: { readonly id: string; readonly version: number };
  readonly cause:
    | { readonly kind: "candidate_collector";
        readonly projection: { readonly id: string; readonly version: number } }
    | { readonly kind: "required_total";
        readonly projection: { readonly id: "rules.tactic.reading.mover_piece_risk";
          readonly version: 1 } };
  readonly reason: "invalid_turn_clone";
  readonly members: readonly Member[];
};
```

Those `string` annotations are a display abbreviation: production types/parsers must use the
closed exact source unions above. Candidate causes have no root member and cover only their
identical failed event ref. Required-total causes cover only loose_piece2 and name the actual
root/children whose risk result is unavailable. Members are nonempty, unique and in original
root/packet order; child UCIs belong to this exact legal population, including the played move.
Unavailable entries are unique per covered projection and sorted by exact id/version. No source
may be both available and unavailable. Source availability covers the whole original decision,
not a denominator over only healthy alternatives.

The sparse list is complete: every ref in the explicitly supplied closed source universe that
is absent from it is evaluated/available, including genuine empty/false/zero results. This
conclusion requires the authentic full acquisition; an absent event in a caller array proves
nothing. Inapplicable/removed/promoted subject states keep the parents' separate meanings and
do not become source failures.

## 3. Selection with explicit partial reach

Use `research.r2_candidate@3` and `research.semantic_selection@3`. Keep the exact 55 input refs,
research-only eligibility, operator/analysis/machine_condition scope and all policy numbers:
minimumAlternatives8, maximumSameFamilyShare0.20, minimumAlternativeOnlyShare0.30, maxFacts2,
and the same critical refs, precedence and deterministic tie order. Retire callable @2 selection;
no compatibility alias or dual path. Preserve immutable historical records.

The existing branded `EvidenceSelectionResult` gains mandatory:

```ts
readonly coverage: {
  readonly sources: readonly VersionedEvidenceId[]; // the exact ordered 55-source image
  readonly unavailable: readonly UnavailableSource[];
};
readonly population: { readonly legalAlternatives: number };
```

Remove the misleading global evaluatedAlternatives count from this successor. Update every
actual producer/consumer, operation adapter, source check and research harness; stale @2 must
refuse rather than gaining v3 output through a fallback. Keep the existing result owner; no
public restored DTO can register itself as a selected result.

For each complete played source, compute native occurrence or projection/sign prevalence over
all original alternatives exactly as today. A failed collector makes its **entire exact ref**
unavailable for rarity, even if the played event exists. Do not compute a reduced-denominator
share or fill it with zero. This also applies to critical candidates whose serialized share
would otherwise be unknown. Other complete refs remain eligible.

Invoke all 13 genuine condition factories once as required by the current path. Available
families use their complete populations and original denominator; unavailable families add
their authenticated coverage cause. They cannot discard already valid candidates from another
family. This changes failure propagation, not source math, thresholds or ranking weights.

Selected facts are the bounded selection **among complete sources**. The coverage image is
mandatory even for nonempty results. If no fact is selected and coverage is partial, use the
existing counterfactual_population_incomplete reason; never claim globally nothing distinctive
or no eligible events. A zero fact budget retains budget_zero plus complete coverage. Existing
no-fact reasons remain valid only when all relevant sources are complete. Consumers may not
strip partial coverage and re-label this a complete comparison.

Ordinary Nudge/Review activation remains D4175. Its eventual adapters must consume this coverage
contract when offering dependent modules; this RFC does not flip those bindings or add raw
source-status lists to the learner's default board.

### 3.1 Validation adapter keeps its existing closed result algebra

`runtime.semantic.complete_alternatives` currently adapts the selector by returning only its
selected condition events. Switch its actual policy call to @3, then return typed
`unavailable("complete_alternative_population_unavailable")` whenever the selection coverage
has any unavailable source. Never return completed[] or strip a partial result into apparently
complete observations. This deliberately conservative validation adapter does not alter the
richer original selector result used directly by its callers.

The operation's input/output union and ref remain unchanged; no new coverage field is added to
`SemanticValidationOperationResult`. The runner already refuses `omits` when an operation is
unavailable. Pin that actual path with an original partial-selection fixture: direct selector3
retains valid selected facts plus coverage, the adapter returns unavailable, an `omits` case
fails, and an exact `abstains` case passes. Complete-source adapter results retain exact event
identity. The dedicated `runtime.semantic.subject_outcomes` operation continues to qualify
one source family's genuine full population independently of selection, including its available
facts when unrelated families abstain. It must not acquire the selector adapter's global fence.
Update semantic-validation-operations.ts, runner/operation tests and canonical current receipts;
preserve historical custody and do not reclassify unavailable as omission to keep a count green.

## 4. Complete per-source longitudinal reduction

The single existing WIDE acquisition per normative decision serves all 54 machine inputs.
Native7 uses original native subject events and complete owned empty-source proofs. Known
nonnative legacy abstentions do not invalidate native7. Required native integrity failures
still refuse; no event-array absence becomes a native negative on its own.

Replace the Profile composer's whole54 unavailable return with a complete decision evaluation:
original actor/edge, complete native/condition/prevalence incidences for their available refs,
and the exact unavailable list for this 54-source universe. No rows arise for unavailable refs.
Each available incidence retains the existing subject grammar, sign/relation, original all-other
legal denominator and comparable-alternative arithmetic. Uniform/forced/empty available sources
are evaluated zero opportunities, not unavailable. No different after-state is equated to an
event sign, and native incidence remains distinct from condition relation incidence.

The existing sole reducer keeps its original frozen subject-array return. Extend its existing
private, bounded `ProfileSubjectDecisionReduction` summary for **every** normative DecisionRef
in original order with actor, legalAlternatives and the immutable unavailable list, alongside
finite available prevalence incidences. Remove whole-decision complete/unavailable as the only
status. Keep no receipts, evidence handles, FENs, child tables or graph references in this proof.
The existing private writer/AST import fence remains the only registration boundary.

The cheap literal fold now returns normative denominators, prevalence aggregates and complete
decision-evaluation rows. Normative denominators still count every decision. A prevalence
opportunity/numerator/share comes only from decisions where its exact source is available;
availability is not inferred from whether an aggregate or subject row exists. Before writes,
publication authenticates the original array/scope/revision and compares all three fold results
exactly. Original subject rows cannot authorize forged or omitted evaluations/prevalence.

## 5. Durable coverage and migration

Add one derived table, `learner_subject_evaluations`, with one row per normative decision.
Reuse existing DecisionRef, time/cohort and source association grammars:

```sql
CREATE TABLE learner_subject_evaluations (
  learner_id TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  run_id TEXT NOT NULL,
  decision_ref_json TEXT NOT NULL CHECK(json_valid(decision_ref_json) AND json_type(decision_ref_json)='object'),
  actor TEXT NOT NULL CHECK(actor IN ('white','black')),
  phase TEXT NOT NULL CHECK(phase IN ('opening','middlegame','endgame','unclear')),
  decision_class TEXT NOT NULL CHECK(decision_class IN ('played','game','predicted')),
  session_kind TEXT NOT NULL CHECK(session_kind IN ('pack','position','imported')),
  pack_id TEXT,
  legal_alternatives INTEGER NOT NULL CHECK(legal_alternatives>=0),
  unavailable_json TEXT NOT NULL CHECK(json_valid(unavailable_json) AND json_type(unavailable_json)='array'),
  observed_at TEXT NOT NULL CHECK(strftime('%Y-%m-%dT%H:%M:%fZ',observed_at) IS observed_at),
  derived_rev INTEGER NOT NULL CHECK(derived_rev>0),
  CHECK((session_kind='pack' AND pack_id IS NOT NULL AND length(pack_id)>0)
    OR (session_kind<>'pack' AND pack_id IS NULL)),
  PRIMARY KEY(learner_id,run_id,decision_ref_json),
  FOREIGN KEY(run_id,learner_id) REFERENCES drill_runs(id,owner_learner_id) ON DELETE CASCADE,
  FOREIGN KEY(learner_id,run_id,phase,decision_class)
    REFERENCES learner_observation_denominators(learner_id,run_id,phase,decision_class) ON DELETE CASCADE
) STRICT;
CREATE INDEX learner_subject_evaluations_cohort
  ON learner_subject_evaluations(learner_id,run_id,phase,decision_class);
```

Strict application parsing additionally checks canonical JSON, exact keys/ref/reason/member
domains, original DecisionRef/actor/cohort/time/revision, and a cheap legal-move membership/count
check against that saved decision. It must not run counterfactual collectors in HTTP reads.
Missing/extra/duplicate records or structurally inconsistent legal/member data fail a supposedly
complete cut. A present empty unavailable list means the published evaluation covered all54;
**no row never means all sources were available**. A malformed unknown source is not silently
skipped. Actual failure semantics are authenticated at publication from the owned summary and
recomputed by compare/rebuild; an ordinary SQL read does not re-prove them from a literal row.

Claim the next migration position; assign its contiguous number only at landing (head35 today,
therefore36 if nothing lands first). Normal version-gated re-entry is idempotent. The migration
creates the exact table/index once and preserves strict conflicting/future-object refusal; do
not add IF NOT EXISTS to disguise a conflicting shape. It
does not fabricate coverage for old data or rewrite saved runs, events, imported PGNs or account
records. Advance the existing derivation revision9→10. Revision10 binds exactly the existing
54-source universe above; no additional coverage schema/version/hash namespace is introduced.

Existing startup reconciliation/rebuild invalidates and recomputes all affected derived data
from original saved sources. Never relabel revision9 summaries as revision10. The new row family
joins existing atomic publication, compare, rebuild, suppression, run/account deletion, export,
restore exclusion and worker-drain/claim fences: **seven** complete-cut derived families.
An old/stale claim cannot publish six families and leave evaluations missing. Preserve existing
read/rebuild transaction lifetime, source joins and original GAME/choice proof boundaries.

## 6. Typed read and consumer coverage

### 6.1 Exact projected DTO and actual callers

Extend the complete branch of `LongitudinalReadResult` with required `coverage` below. Its
incomplete cut branch remains unchanged. The projected DTO is intentionally not a full durable
row: it omits learner/time/revision fields and cannot pass the full54 storage-row parser.
Owner/time/revision/source-cut checks occur before projection against the original image and
query; each runId joins exactly one returned complete cut in the same read transaction.

```ts
interface LongitudinalReadCoverage {
  readonly sources: readonly ProfileCoverageProjection[];
  readonly decisions: readonly {
    readonly runId: string;
    readonly decisionRef: DecisionRef;
    readonly actor: "white" | "black";
    readonly phase: LongitudinalPhase;
    readonly decisionClass: LongitudinalDecisionClass;
    readonly sessionKind: LongitudinalSessionKind;
    readonly packId: string | null;
    readonly legalAlternatives: number;
    readonly unavailable: readonly UnavailableSource[];
  }[];
}
```

`ProfileCoverageProjection` is the exact id/version union from the current54 source image,
with strict membership validation, not any VersionedEvidenceId. Parse this DTO with the original
parsed query and returned cuts as context. Exact keys, source subset/order, unique expected
DecisionRefs, actor/cohort, run/cut membership and unavailable-source membership are required.
A projected empty unavailable list says complete **only for enclosing `coverage.sources`**;
it can never be restored as the full54 publication record. Decisions sort by bytewise runId
then existing compareDecisionRefs; unavailable entries keep §2's canonical order.

The actual chain to update is LongitudinalReadResult → LongitudinalStore.readSnapshot/#rows →
SQLiteRunStorage.readLongitudinalSnapshot → application.longitudinal.read and
LearnerProfileReadStore/LearnerProfileService.#snapshot (both all-complete and ready-cut reads).
There is currently no public raw semantic-row REST transport to extend. Keep Profile's
observations[] and subject_metrics_not_adopted status, and the existing409 detail refusal.
Do not create an endpoint or leak raw coverage into the learner DTO to satisfy a generic
transport obligation. Any existing internal serializer of the changed result keeps coverage
mandatory; source/parser tests must exercise the real application read boundary.

### 6.2 Source membership and cohort filters

Derive coverage sources once from the existing parsed query:

- Prevalence34 contributes refs matching filter.projections by exact id/version. Absent filter
  means all34. semanticSign/sourceSign narrow observation rows only, not source membership.
- Native7/condition13 contributes only when includeSubjectObservations is true. Absent or false
  enables no subject lane. With included lane, absent subjectFilters means all20; present filters
  contribute the union of their exact sourceKind/projection pairs. Subject/parameters/actor/
  sign/relation fields narrow observations only; they do not redefine source completeness.
- Deduplicate the union and order by existing PROFILE_SUBJECT_SOURCE_REFS, not request order.
  Keep current parser rules: present filter arrays are nonempty; subjectFilters requires the
  included lane. Do not introduce an empty-filter escape or a new cross-intersection between
  the currently separate prevalence and subject filter grammars.

Coverage decision cohort uses run/cut/session/pack/phase/class filters. Subject actor filters
**do not** narrow that cohort; actor remains explicit on each decision so later actor-specific
arithmetic can select its cohort honestly. Coverage is measured before subject/sign/relation
observation refinements and is not itself a new personal metric denominator. An empty resulting
source union returns `{sources:[],decisions:[]}` without reading/enabling an omitted subject lane.

For a nonempty source union, return every selected normative decision, including quiet and
forced decisions with no observation rows, and project its unavailable entries to that source
union. Missing/extra/duplicate evaluation rows fail, using the normative DecisionRefs from the
original source image rather than inferring a smaller cohort from SQL rows. Preserve existing
run owner/access, source image, derivation revision, completed cut and account-suppression fences.
Cross-check every returned observation/opportunity ref with available coverage for its exact
source and decision; an explicitly unavailable source cannot have rows for that decision.

Aggregate `.decisions` remains the normative count, including unknowns. It is not an evaluated
count. Source evaluated/unavailable counts derive from required coverage for the same cohort;
opportunity/numerator/share arithmetic uses only source-complete opportunities. No caller may
divide by normative decisions and label it an evaluated-source rate. Existing personal cards,
GAME/choice facts and unadopted-subject withholding remain unchanged. New habit/style/skill,
grading/hint/voice consumers require their own qualification/floor and adoption contracts.

### 6.3 Honest publication/read/rebuild trust boundaries

Publication authenticates actual availability through the original owned summary and exact
literal fold. A read validates persisted SQL shape, domains, actor/cut/cohort/cardinality,
original legal membership/counts and cross-row consistency. It does not recompute collector
failure semantics. Invariant-preserving semantic tampering can survive those cheap checks:
removing a true unavailable entry from a canonical row may leave no observation contradiction.
Do not add a checksum/issuer or hide counterfactual collection in HTTP to claim otherwise.

Add a real SQL control that removes a true unknown entry while preserving all cheap invariants:
the ordinary read may accept this structurally consistent stored row, while independent actual
compare/rebuild must detect and repair the semantic mismatch. Shape/domain/cut/association and
missing-row corruptions still fail the read itself. Distinguish these proof cuts in reports.
Persisted or projected coverage literals can never mint source evidence, register a selected
result, or bypass the existing original-array source/selection authority.

## 7. Verification and completion

Acceptance is executable and includes the complete handoff:

1. Repeat the actual12-move discovered-check witness, with genuine sealed unavailable event
   outcomes and zero unavailable modern risk positions. No manufactured labels or fabricated
   child/source arrays. Require available correct count/file/loose-piece2 outcomes and unchanged
   full legal populations. Include both colors/orientations and a distinct real required-risk
   failure; the latter remains unavailable only for the dependent family.
2. Unknown/ref/reason/member/copy/foreign/shortened population controls refuse. A source-set or
   abstention-vocabulary addition cannot inherit completeness at the old revision. Assert exact
   sets, including no-ref/no-default fallbacks and real available-zero inputs.
3. Selector mixtures contain complete positives, complete empty families and unavailable refs.
   Missing exact refs never supply rarity/nonoccurrence/support. Selected positives survive
   unrelated failures; known-empty global claims cannot survive partial coverage. Thresholds,
   order, critical behavior, original denominators and fact caps retain their accepted meanings.
4. Real native7/condition13/prevalence34 reductions use one original acquisition. Prove complete,
   forced, uniform and mixed-unknown decisions independently; both failed legacy refs produce
   their exact unavailable coverage without suppressing complete unrelated rows. The whole54
   old suppression expectation must not be silently retained in the new path.
5. Original empty/nonempty subject arrays cannot authorize missing, changed, foreign or
   inconsistent evaluations, prevalence or denominator rows. Byte-identical detached folded
   literals remain allowed; only the original subject array/owned summary carries identity. Retain private-writer, HTTP import-graph and
   complete source/scope/lease/counter/actor refusal controls.
6. Genuine schema35/revision9 output upgrades via actual startup/current worker to revision10;
   saved original/account records remain identical. Verify seven-family publication, rollback,
   reopen, structural/domain/cut omission detection on reads, semantic-tamper detection by
   actual compare/rebuild, rebuild equality, stale-claim refusal,
   deletion/export/restore and source suppression. No current rows relabelled as old fixtures.
7. Filtered/unfiltered typed reads distinguish quiet, unavailable and missing records. Pin
   absent/nonempty filter grammar, source-ref dedup/order, observation-only sign/subject/actor
   refinements, projected-versus-full parser refusal, exact original cuts and both Profile
   snapshot reads. Exercise a same-domain SQL unknown-entry removal: cheap read boundary is
   reported honestly and real compare/rebuild detects/repairs it. Existing Profile withholding,
   GAME/choice/history/contributor/share data and floors stay. Unknown cannot dilute an
   evaluated-source denominator or invent a zero metric.
8. Regenerate current semantic cases/receipt/censuses; preserve immutable historical ownership
   and frozen cuts. Expanded reach needs new actual source cases, not a carried qualification
   count. Do not weaken absolute/mirror/fault controls or the source blob-size guard.
9. Measure actual current worker/cold-warm Profile cost and lease/drain progress for the new
   complete implementation. Report observed workload honestly; no inherited current9 cost or
   isolated speed advantage. Keep compact aggregates in Git, raw traces outside progress/CI.
10. Normal `make verify-software`, `make verify-governance` and build pass; related actual HTTP
    read/refusal/source-lifetime tests run. Existing performance/restart/drain limits, content
    hold and role/assistance ceilings remain. No new push hook or arbitrary test invocation.

Update the existing source plan, canonical docs, ledger/work-state and append-only exploration
log at each verified checkpoint. This RFC completes only when source, selection and durable
coverage are implemented/verified together; it cannot archive on a source-only result. D1716,
D4167/D4175, official content and whole1.0 remain their own completion obligations.

## Deviations from design

No product-scope or chess-value decision is requested. This is execution of the existing
grounded-evidence/full-foundation mandate. Preserve the owners' presets, per-kind ceilings,
operator/learner separation and content decisions. Independent review must verify exact design
citations, type/version seams, migration order and the finite coverage/read/storage contract;
that review is not permission to invent a new metric or silently narrow the implementation.

## Open questions

No owner product decision is pending. Independent technical review must verify the explicit
coverage/version/storage/read boundaries above before acceptance; a return is repaired in this
draft rather than implemented by inference.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | Complete D4200 source/selection/durable-coverage handoff and all ten verification criteria | `source-local-evidence-availability.md` | Foundation plan §2026-11-11 and exploration log | 2026-11-11 |

Wider D1716/D4167/D4175 work is not discharged by this RFC alone.

## Changelog

- 2026-11-10: draft from executed original-source availability witness and independent downstream
  code audit; no production implementation or acceptance claimed.
- 2026-11-10: first independent return R1–R3 repaired: honest cheap-read versus semantic-rebuild
  proof; explicit conservative complete-alternatives validation adapter; exact projected DTO,
  source/cohort filters and actual internal/operator/Profile-withholding boundaries. Identical
  detached fold literals remain valid; strict version-gated migration conflicts stay refused.

- 2026-11-10: fresh independent buildability read accepts the repaired complete contract. Actual
  source/migration/read/rebuild/lifecycle/cost and normal-gate obligations remain unexecuted.

- 2026-11-10: bounded predecessor preparation independently reviewed: actual five-job schema35/
  revision9 capture, six populated families and standalone877366-byte fixture; normal restore
  controls2/2 and types pass. This is not revision10 startup/rebuild or expanded source reach.

- 2026-11-11: implemented and verified all three parts together. Actual one-edge acquisition
  bounds selector3 at 54 sources. Migration 36 upgrades five genuine predecessor jobs and
  publishes all seven revision 10 families. Source coverage survives original-cut reads,
  rebuild, export, deletion and restore rederivation. Full local software on `c59e565b` passed
  18,977 tests in 572 files and seven performance tests. Governance and build passed separately.
  The 200-run production batch path on `284d978a` published 6,400 decision evaluations with
  251 lease renewals. The [measurement](../../planning/foundation-source-identity/profile-current10-cost-2026-11-11.json)
  and [criteria evidence](../../planning/foundation-source-identity/plan.md#2026-11-11--measured-revision-10-profile-rebuild-and-reads)
  document the workload and its limits.
