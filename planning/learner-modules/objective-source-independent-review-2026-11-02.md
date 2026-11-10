# D3927 — independent objective-source review, 2026-11-02

Scope: `rfc/module-registration.md` §4.10a only. The owner authorized routine independent
reviews. A separate read-only reviewer inspected the contract and actual source boundaries;
the reviewer did not author or edit this amendment.

Decision: **accepted for bounded implementation**. No blocking specification defect found.
This is not an implementation, semantic qualification, full module completion or green CI claim.

Existing authorities support the source: `recorded-review-boundary.ts` validates complete
stored replay before narrowing and retains original events; objective@1 in
`evidence-factories.ts` genuinely requires a comparison; `recorded-grade-sources.ts` owns
Review preflight, currentness and cancellation. Review alone changes to objective@2.
Compare keeps its genuinely different comparison source. No schema or new permission is needed.

Required implementation falsifiers:

- Repeated identical transitions retain separate original event ordinals and order. The existing
  boundary-wide `assertRecordedReviewResultInvocation` alone is insufficient: objective@2 must
  retain and check each original event occurrence as well as the complete invocation population.
- Genuine empty succeeds; copied, reordered, foreign and caller-empty populations fail.
- Root events remain privately at ply0; move rows do not move them to the first move or discard
  them while claiming completeness.
- Shared-prefix and later-recorded on-path updates survive; siblings and beyond-endpoint nodes do not.
- Actual Review HTTP/component delivery must cover both colours and reject stale, revoked,
  rated and cancelled requests before acquisition and publication.
- Genuine Compare behaviour remains intact.

Reviewer verification: the normal Make focused command ran three existing suites. Boundary and
recorded-source-population passed **56 cases**. Compare could not collect because the parallel
candidate-source migration had not yet added exposure@2's semantic profile at worker startup.
That was an integration failure, not an objective contract failure. No full-suite pass was claimed.

Next: implement the accepted sole factory and exact occurrence lineage, Review-only adoption,
registered parser/renderer and permanent falsifiers. D3927 remains open until delivery is proven.

## Subsequent bounded implementation review

A separate read-only reviewer inspected the actual implementation and independently ran the
normal `make test-software-files` command over `recorded-objective-transition.test.ts`,
`recorded-review-boundary.test.ts`, `recorded-review-delivery.test.ts` and
`review-map-screen.test.ts`: **100/100 tests pass across four complete files**.

No remaining blocker within §4.10a. Exact original event occurrences/references/order, successful
empty invocation identity, root/shared-prefix/later on-path updates and sibling/future exclusion
are retained. The actual source owner and Review publication recheck SQLite/current access,
revocation, cancellation and rated state before/after work. The production REST handler uses real
IdentityService cookie authentication; mounted Review retains repeated facts for both colours.
Compare's different source remains@1. This is not a default-application or native browser pass.

The review found D3947: generic presentation validity alone admitted genuine foreign Compare
items, foreign abstention consumers and crossed objective renderers. Four permanent negatives
first reproduce those accepts, including the reverse renderer-through-phase pair, with valid
ordinary public digests and matching fact tails. The actual Review receiver now requires current
Review2 ownership for every item and objective2 ↔ its sole renderer in both directions.
The broader generic parser issue remains separately assigned as D3948, not silently closed.

Three source-failure controls also first expose untyped errors; scoped owner mapping now returns
EVIDENCE_UNAVAILABLE without treating copied/reordered/caller-empty populations as successful empty
data. The unchanged authority gate catches the first server direct dispatcher import; collection
now stays in the existing runtime Review source layer, with server permission checks around it.

Integration verification:182 tests/nine complete files pass; workspace/research types and standalone
production build pass. Normal full verify remains **1 failed/2043 passed in2044 authority cases**:
the343-case canonical population still fails eight predecessor targets, with93 subjects/zero
qualified on normal rebuild. The complete default-app Review suite still fails77/81 at D3928 pack
admission before Review. Coupled commit, default-app/native proof, full source migration and
semantic qualification remain open. D3927/D3947 are implemented locally, not a shipped 1.0 claim.
