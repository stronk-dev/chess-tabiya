# Theory↔drill current joins — independent buildability return

**Reviewed:** 2026-08-27

**Reviewer:** codex

**Document:** `rfc/theory-drill-current-joins.md`

**Verdict:** **RETURNED.** Exact theory identities should lead to exact reusable theory and drill
actions, and the existing `run_derivations` table is the right durable home for a source-bound
launch. Implementation is not authorised from the current contract.

## Method

The pass read the complete RFC and re-derived its implementation-critical claims against the live
runtime, server, storage, REST and web boundaries:

- the implemented opening catalogue types and registered F1 projections;
- shape recommendations from stored branch paths through the Learn response and client action;
- pack feedback-claim and principle identities;
- route parsing/rendering and the four proposed learner surfaces;
- `RunDerivation`, its SQLite table, readers, writers, export and deletion integrations;
- every acceptance criterion that claims a type-level refusal, durable origin or production
  launch witness.

The review did not edit the concurrent D872 tactical harness or the untracked `planning/review/`
work.

## What survives

The direction is correct. Applicability must be an exact, abstaining structural join rather than
semantic resemblance. `present` and `prospective` shape references must differ in both offer and
suppression. Every pack target must remain reachable. Launch provenance belongs server-side in the
same transaction as run creation. Theory/drill actions are typed actions, not a fake evidence
rendering form. Library, Learn, Shape and Review should consume one compiled result rather than
reimplementing joins.

Nine seams prevent those decisions from being implemented as written.

## Blockers

### 1. The opening identity type does not exist at the proposed package boundary ([[D1879]])

`packages/runtime/src/applicability.ts` is specified to contain
`records: readonly OpeningIdentityRef[]`, but neither the RFC nor the tree defines
`OpeningIdentityRef`. The opening implementation has already landed in the server package and its
actual public types are `CurrentOpeningEndpoint`, `OpeningCatalogueMembership` and
`OpeningCatalogueRef` (`apps/server/src/opening-catalogue.ts:55-75`). They contain distinct
matched/absent/abstained arms and numeric ply/source/count fields. Runtime cannot depend upward on
the server package, and silently inventing a fourth summary type would create another authority.

Publish the exact shared identity projection in an allowed dependency tier, or make applicability
generic over the already sealed F1 payload identity. Prove the server opening producer and every
applicability consumer use the same literal type.

### 2. The law-8 type seal contradicts the proposed type and the live opening payload ([[D1880]])

Criterion 14 requires `ApplicabilityResult` and every transitively contained type to have no
`number` and no free-text field. The proposed type itself contains `route: string`; the live
opening identities necessarily contain `observedPly`, `sourcePly`, source row/count values and an
opening name. A conforming implementation therefore fails the criterion, while weakening the
opening record enough to pass would discard cited identity.

State the real refusal: no score, similarity rank, generated explanation or unregistered route.
Replace the raw route string with a closed action/identity discriminant and derive `AppRoute` in the
web tier. Test forbidden editorial/ranking fields without banning factual numeric operands.

### 3. The principle algebra cannot represent two required acceptance fixtures ([[D1881]])

The principle identity requires `anchoredBy: {packId, claimId}`. Criterion 5 also requires a bare
browsed principle to return a theory target with no pack target; that bare identity cannot be
constructed. Conversely, the only pack target arm is `via: {shape, relation:"present"}`, while the
same criterion requires an exact `{packId, claimId}` to yield its source pack. A principle/claim
pack target cannot be constructed either.

Make bare principle identity and claim-anchored principle occurrence distinct union arms, and give
pack targets a closed `via` union for shape-present and authored-claim anchors. Fixture both
directions at the literal type boundary.

### 4. The client can mint false launch provenance ([[D1882]])

`launchFromApplicability` accepts `{target, source, identity}` from the client and only says the
target is validated against the pack registry. A caller can choose an arbitrary existing run/node,
an unrelated registered identity and any valid pack, then receive a durable `theory_launch` row.
Atomicity prevents a half-write; it does not establish truth.

The server must accept a minimal untrusted request, re-read the authorised source run/branch/node,
recompute the applicability result from registered producers, and admit only a target/identity pair
present in that exact result. Alternatively it may accept a server-sealed expiring result whose
subject and registry digests are verified. Add crossed-source, crossed-identity and crossed-target
negative fixtures; criterion 9 currently tests none of them.

### 5. Library applicability has no source but the durable launch requires one ([[D1883]])

`ApplicabilityResult.source` is explicitly null for Library browsing. `run_derivations` requires a
non-null source run, branch and node, and §3.5 requires `source` to create a launch. Section 4.3
nonetheless makes Library rows launch actions over their applicability results, while criterion 9
says origin-less applicability launches are impossible.

Separate ordinary Library pack starts from source-bound applicability launches, including their
progression/provenance semantics, or define a truthful different origin model. The current single
operation cannot serve both contracts.

### 6. The production launch operation has no wire contract ([[D1884]])

The RFC names a service method and a generic “launch endpoint” discharge but never specifies an
HTTP method/path, closed request, success response, authentication/authorisation, stale-source
behavior or error union. No acceptance criterion crosses REST and the real client. A private service
method plus client-side `startPack` could satisfy most current prose while leaving the production
workflow absent.

Publish the exact REST and client protocol and exercise one authenticated Learn/Shape launch
through persisted derivation to `/play/run/{runId}`, plus malformed, forbidden, stale and
non-applicable negatives.

### 7. Durable derivation validity is neither structural nor checked on read ([[D1885]])

The proposed table makes all three identity columns independently nullable and deliberately puts
the all-or-none/kind relation only in one writer. The proposed `RunDerivation` widening is not a
discriminated union, and the existing `#derivation` reader coerces stored bytes rather than
validating them. A `theory_launch` with null identity or a `flip_sides` row carrying invented
identity can therefore be restored and exported as valid history.

Use a discriminated `RunDerivation` union and enforce the kind/column relation with a table `CHECK`
or fail-closed read parser in addition to the writer. Fixture malformed persisted rows and account
export, not only the happy writer.

### 8. Learn recommendations discard the source anchor required by the new operation ([[D1886]])

`shapeRecommendations()` finds firings over every branch path, then reduces them to a set of run
ids. Its response carries `runIds`, `shapeId` and `packIds`, but no source branch or node
(`apps/server/src/service.ts:1142-1158`). The Learn UI therefore cannot populate the
`{runId,branchId,nodeId}` source required by §3.5, even though Learn is criterion 3's primary
production launch.

Retain one or more exact firing anchors in the recommendation projection with a declared
deterministic selection rule, or launch from an exact anchor chosen by a server-side operation.
Test two branches and two firings in one run so “first id” cannot masquerade as provenance.

### 9. Whether a theory launch changes progression is left as an open product behavior ([[D1887]])

Open question 1 says the launched run will produce a countable attempt, then takes no position on
whether progression reads its origin. Today a countable attempt suppresses the same shape
recommendation this RFC is repairing. The choice therefore changes recommendation state and the
learner's durable progression, not merely presentation.

Resolve the behavior before acceptance and make it able to fail: either theory launches count
exactly like direct pack starts, or derivation kind changes the denominator/suppression rule. Do not
let an incidental existing query choose the product policy.

## Required amendment order

1. Define shared opening and principle/claim identities plus closed action targets (D1879-D1881).
2. Resolve Library versus source-bound launch semantics and progression effects (D1883/D1887).
3. Define the server authority/recomputation rule and literal REST/client protocol (D1882/D1884).
4. Retain an exact Learn firing anchor and prove multi-branch identity (D1886).
5. Make durable derivations a validated discriminated union across database, reader and export
   (D1885).
6. Refresh the RFC's stale dependency statements: runtime opening identity is implemented now, so
   criterion 12 and discharge D3 must run rather than remain “honestly red.”
7. Re-run route, applicability, launch, migration/export and all four surface fixtures, then send
   the amended RFC through another independent buildability review.

The identity/action corrections are technical contradictions and need no owner ruling. D1887 is a
real owner/product decision unless a living intent rule already settles it; the author must cite
that ruling rather than infer it.
