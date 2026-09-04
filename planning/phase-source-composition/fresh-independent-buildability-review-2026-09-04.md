# Phase source composition — fresh independent buildability review

- **Date:** 2026-09-04
- **Artifact:** `rfc/phase-source-composition.md`, first author pass
- **Verdict:** returned on [[D2636]]–[[D2642]]; implementation remains unauthorized
- **Executable review:** `make phase-source-composition-fresh-review` — retained author checks 8/8 plus fresh checks 7/7

## What survives

The source-vector direction is right. Opening endpoint, opening membership, rules phase, endgame
classification, recorded tablebase and live tablebase are different authorities; none should win a
precedence contest. The point/arc split, explicit refusal of canonical phase transitions, and
removal of material-only Lucena/Philidor labels remain necessary foundations for Support, Review,
bots and longitudinal analysis.

The return is about whether those slots can actually be joined and transported without a caller
inventing their subject, path, absence or learner-facing bytes.

## Returns

### [[D2636]] — the required point fails its own forbidden-property guard

`PhaseSourcePoint` requires a top-level `opening` namespace. Section 2.3 then forbids `opening` at
the point or arc root and specifies a property-name guard. A name-only guard cannot infer that one
occurrence is a namespace rather than an aggregate. Rename the namespace or define a typed
aggregate-field predicate that can make the promised distinction; criterion 11 must execute it.

### [[D2637]] — opening results cannot satisfy the full-FEN join

The RFC requires every successful position-bound input to bind the same canonical six-field FEN.
The implemented `CurrentOpeningEndpoint` and `OpeningCatalogueMembership` carry `positionKey`,
which is the four-field `transposeKey(fen)`, plus `observedPly`; neither carries full FEN or node
identity. The composer cannot prove the required equality from those operands. Define the honest
source-specific join—catalogue key plus an authorized recorded occurrence—or change the opening
operation to return a receipt that binds the exact occurrence. Do not invent missing provenance in
the composer.

### [[D2638]] — callers can bypass the recorded path authority

`compilePhaseArc(path, inputs)` accepts a caller-supplied explicit path. The recorded semantic path
contract already makes `branchPath(run, branchId)` the sole path authority and forbids callers from
supplying nodes, FENs, UCI or evidence. This RFC neither depends on nor consumes its sealed result.
Compile from `run + branchId` or an exact asserted recorded-path receipt, and reject reordered,
truncated, foreign-run and stale-head crossings at that boundary.

### [[D2639]] — the tablebase live union cannot represent local domain truth

The live slot permits only `not_requested`, provider `available`, and provider `unavailable`, yet
outside-domain is a `ProviderLocalDomainResult<"syzygy.position@1">`, explicitly not provider
failure. The composer also recomputes a local `domain` field although provider exchange owns the
sealed `rules.endgame.tablebase_domain@1` preflight fact. Consume that exact arm and authority once;
do not create a second piece-count verdict.

### [[D2640]] — recorded absence is forgeable

`not_recorded` contains only a caller-written `snapshotDigest: string`. It names no snapshot
inventory, source revision, query operation, FEN/node occurrence, constructor or assertion, so it
cannot prove that the exact position was absent from a complete bounded snapshot. Define one typed
recorded-tablebase snapshot receipt and exact negative lookup authority before “not recorded” can
enter the composed view.

### [[D2641]] — the mandatory inspector handoff crosses an undeclared boundary

The claims exemption says the view is server-package internal and that later web serialization or
package export owes a registered resource. The same RFC makes the advanced inspector one of five
production operation families and an implementation discharge, but specifies no presentation
component, server projection, parser or wire. The current inspector is a Svelte/web surface. Either
remove this integration from the RFC and keep a named downstream discharge, or define the narrow
registered/sealed presentation projection that crosses the boundary without exposing the raw view.

### [[D2642]] — the applicability invariant is green by construction

The author prototype checks that `classifyPhase(fen).phase === "endgame"` iff
`endgameReading(fen) !== null`. But `endgameReading` itself calls `classifyPhase` and returns null on
the opposite arm, so the check cannot detect divergence between independent authorities. Keep the
corpus count as reach measurement, but replace the claimed invariant with able-to-fail controls
over independently supplied declared results, including crossed applicability and future-version
fixtures.

## Required bounded repair

1. Resolve the root-field contradiction and publish executable point/arc shapes.
2. Join opening evidence using the source's real key plus one authorized run occurrence.
3. Consume the recorded path authority rather than accepting caller paths.
4. Adopt the provider's local-domain result and add a real recorded-snapshot absence receipt.
5. Define or defer the inspector's package/presentation boundary honestly.
6. Replace the circular applicability invariant with independent positive and negative controls.
7. Retain all eight author checks and these seven review arms before another fresh review.

No production runtime, server, provider, API, schema, content, UX, archive or protected-design byte
changed in this review.
