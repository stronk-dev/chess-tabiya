# Bot route source — Codex buildability review

- **Reviewed:** 2026-08-23
- **Input:** `rfc/bot-route-source.md` at `a8f1a76`
- **Verdict:** **RETURN TO AUTHOR**
- **Scope:** internal coherence, production reachability, state identity, measurement binding,
  and able-to-fail criteria. This is not a second evaluation of D1084.

The research result survives review. A separately identified route proposer is the only tested
mechanism in this family that cleared its preregistered gates. The draft is not yet buildable,
because its type contract cannot represent the experiment's majority path, its lifecycle key
cannot represent its own horizon rule, and the production bridge is deferred while the RFC claims
the mechanism ships complete.

## Acceptance blockers

### B1 — The candidate invariant makes 26 of 41 measured selections unrepresentable

Sections 6.4 and 7.4 contradict each other. D1084 resolved **26 of 41** route selections as
`route_mass_preference`: the move was proposed by the route source **and** retained Maia/base mass.
Section 6.4 correctly requires both facts in the record. Section 7.4 then requires exactly one of
`rawMass` and `proposedBy` to be absent and makes both-present a must-fail fixture (criterion 2).
That rejects the experiment's majority arm.

**Required amendment.** Model base membership and proposal provenance as independent facets. A row
may be base-only, proposal-only, or both; neither is refused. Prefer a shape that does not erase
multiple proposal identities, for example `base?: { rawMass }` plus `proposedBy: readonly string[]`,
or the minimal optional fields with an at-least-one invariant. Criterion 2 must include all four
truth-table cells and require the three valid cells to compile. Criterion 10 must exercise the
both-present cell.

### B2 — A position key cannot store a history-dependent horizon

Section 8.3 defines `horizonPlies` as controlled plies **since entry**. Section 8.4 stores route
state by `transposeKey` and claims rewind restores it “for free.” The shipped `transposeKey()` is
the first four canonical FEN fields (`packages/runtime/src/chess.ts`); it deliberately contains no
route-entry age or path history. The same position can be reached with different controlled-ply
ages, so one map entry cannot truthfully represent both. Reaching an old position later can also
overwrite the state that rewind is meant to restore.

**Required amendment.** Persist lifecycle state on the run node / selection record, including at
least `controlledPliesSinceEntry`, and restore it by node identity or active ancestry. Use
`transposeKey` only to cache position-derived distance/legality. Replace criterion 16 with a
diamond fixture: reach one identical FEN at two route ages, prove the states remain distinct, rewind
each branch, and prove both restore their own state. Re-negotiate the run-schema 0.18 pin if that
state must cross the persistence boundary.

### B3 — “Ships complete” contradicts the admitted absence of a production producer

Section 7.4 verifies that `BotPolicyCandidateInput` has no production producer; production builds
`SelectionCandidate`. Discharge D2 defers that bridge to `planning/codex-wave-2.md`. Section 10 then
says the whole mechanism ships complete with nothing held back. A catalog compiler plus test-only
composer is not a reachable bot feature, and this is the producer-with-no-consumer defect F1 was
created to prevent.

**Required amendment.** Bring the production producer and call path into this RFC's implementation
surface and acceptance criteria. The end-to-end fixture must enter through the live opponent
selection service, enumerate an off-window proposal, price it, guard it, select it, and emit the
route provenance record. If the author intentionally wants a library-only RFC, say so and remove
every “complete” or product-serving claim; do not call D2 a discharge of work this RFC ships.

### B4 — The route measurement is not bound to the route it licenses

`RouteMeasurement` carries outcome numbers, but the declaration does not bind them to the exact
route revision, target, root population, policy-profile digest, guard/search parameters, or harness
revision. As written, a new target can cite D1084's fianchetto result and clear the compiler. This
violates the immutable parameter-authority discipline the RFC otherwise invokes.

**Required amendment.** Bind the measurement to at least `(routeId, routeRevision, targetDigest,
populationDigest, profileDigest, guardDigest, instrumentRevision)` and assert exact equality at
compile time. A changed square, horizon, guard bound, base model, sampler, or population must make
the old record inapplicable. Add one negative fixture for each identity class; criterion 3's numeric
checks are necessary but insufficient.

### B5 — Entry is normative prose with no declaration field

Section 8.1 says every route declares an entry condition, and `route_not_entered` depends on it.
`RouteSourceLayer` in §4.2 has no `entryCondition` member. `target` cannot substitute: D1084's root
predicate also required retained roles and incomplete targets. No acceptance criterion proves that
an entry condition is present, mechanically evaluable, or recorded.

**Required amendment.** Add an exact, closed `RouteEntryCondition` using the same rules-only
vocabulary, or narrow v1 to one precisely specified derived condition and make it executable rather
than configurable prose. Add entered/not-entered boundary fixtures and include the entry-rule
revision/digest in the measurement binding.

### B6 — A flat conjunction does not express multiple routes or ordered stages

Section 5.1 defines `RouteTarget` as a list of occupancy requirements whose distance is the count of
unsatisfied requirements. That is one conjunctive target. Section 4.4 then claims the same list
expresses several stages or several routes. It expresses neither stage order nor alternative route
identity; all requirements simply contribute to one distance. The singleton rule therefore cuts off
the composition the prose claims to preserve.

**Required amendment.** Narrow v1 to one route with one conjunctive occupancy target, which is all
D1084 measured. Future staged/alternative targets need their own grammar and gate. Alternatively,
specify a real ordered-stage / route-union type now, including authority, selection and provenance;
do not infer it from a flat list. Update §4.4 and the proposal-chain fixture accordingly.

### B7 — The guard boundary drifts from the passing instrument

D1084 admits loss **`<= 250` cp** (`generate.mts:106,260`) and its gate asserts maximum loss
`<= GUARD_CP`. The shipped composer admits only `guardLossCp < thresholdCp`
(`bot-policy-catalog.ts:502`). The draft repeatedly says “250-cp admission ceiling” and
`maxAdmittedLossCp <= threshold`, but names no boundary repair or exact-250 fixture. A 250-cp
candidate passes the evidence instrument and fails production.

**Required amendment.** Pin the inclusive rule or explicitly justify and remeasure an exclusive
one. Under the measured rule, amend the live guard comparison and add fixtures at 249, 250 and 251
cp. The severe-rate denominator may still classify `>= 250` as severe; admission and reporting are
different predicates and both need names.

## Serious non-blocking specification defects

### S1 — “Proposes every legal move” should fall through, not kill selection

Criterion 8 throws when a proposal set equals the full legal set. Equality can arise honestly in a
position with few legal moves or where every move preserves the target distance. That means the
source has no selective contribution **at that position**, not that the base selection must fail.
Record `nonselective_source` and fall through to the guarded base. Reserve compilation failure for a
declaration whose algorithm is unconditionally a base source.

### S2 — “Unpromotable to” is not defined by the declared operands

Whether a missing role can be recreated by promotion is not a static fact unless the RFC gives a
conservative material/role rule; otherwise it is a horizon-dependent reachability judgement. Define
an exact able-to-fail predicate (for example, permanently impossible only when no controlled pawn
exists that could ever produce the role under the deliberately conservative inventory rule), or
leave the route active until its horizon expires. Do not smuggle search into “rules arithmetic.”

### S3 — The record cannot reconstruct the lifecycle the monitor promises

The §7.3 object omits `controlledPliesSinceEntry`, the entry-condition identity, and a stable
abandon/deviation cause. Section 8.5 claims the route gates and lifecycle are reconstructible from
production records. Add the minimal fields required by B2/B5, then prove reconstruction from records
alone rather than from hidden in-memory state.

## Replacement acceptance slice

The amended RFC should not return until these tests exist in the specification:

1. Candidate provenance truth table: base-only, proposal-only and base+proposal succeed; neither
   fails; the D1084 26/15 source mix is representable without falsifying `chosenFinalMass`.
2. Live-path reachability: a service-level request selects one off-window proposal and persists
   its exact source, route state and resolution.
3. Route-state diamond: identical `transposeKey`, different route ages, correct branch rewind.
4. Measurement anti-reuse: one-square target edit, horizon edit, guard edit and profile edit each
   reject the old measurement.
5. Entry boundaries: entered, already complete, missing required role, and condition false.
6. Guard boundaries: 249/250/251 cp under the inclusive D1084 contract.
7. Nonselective position: full-legal proposal set falls through without throwing or gaining base
   authority.

## Proposed ledger rows

Ids are deliberately unassigned while `design/BACKLOG.md` is being edited concurrently. The author
or coordinator must land one row for each B1–B7 and S1–S3; embedding them only in this review would
repeat the concurrent-draft defect recorded by D1354.

