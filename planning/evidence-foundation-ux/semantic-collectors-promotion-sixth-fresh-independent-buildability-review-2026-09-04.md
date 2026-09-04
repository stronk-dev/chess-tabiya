# Held promotion collectors — sixth fresh independent buildability review

- **Date:** 2026-09-04
- **Reviewer:** Codex, independent of the [[D2548]]–[[D2551]] fifth author repair
- **Scope:** the two held §3.7 promotion projections and their executable author gate
- **Verdict:** **returned** on [[D2603]]–[[D2607]]
- **Reproducer:** `make semantic-collectors-promotion-sixth-fresh-review` — 5/5 findings

## What survives

The fifth repair chooses the right direction at the prose level: the provider scheduler owns the
normalized request digest; successful output should retain exact moves, pawn identities, geometry
and source; and a position-only tablebase result is a reading rather than a fabricated event. None
of this review reopens the twelve implemented Wave-C projections or the separately implemented
deflection check-authority repair.

The held pair is not yet buildable because the executable contract does not implement those prose
claims and the normative section still has conflicting or missing authorities.

## Returns

### [[D2603]] — the maintained target does not retain its claimed gates

The receipt says all four earlier author generations pass “in the same run.” The Make recipe runs
only four D2548 prose assertions and one local typecheck. It has no dependency on the earlier
canonical-FEN, source-precedence, provider, recorded-lookup or sealed-geometry targets. Those
properties can regress without making the advertised fifth gate red.

Make the maintained target transitively execute all retained generations or consolidate their
non-duplicated controls into one suite. The receipt and test count must describe what the target
actually runs.

### [[D2604]] — one projection has two sole constructor names

The RFC calls undeclared `declarePromotionRaceTablebaseEvidence(value)` the sole adapter, then
states that success is minted only by
`createDerivedPawnPromotionRaceTablebaseV1Evidence({geometry, legalMoves, source})`.
`evidence-value-authority.md` registers only the second name. That split can give the route census,
value receipt and derivation assertion different constructor identities.

Keep one exact registered factory signature and remove the other name from normative prose and
tests.

### [[D2605]] — the total operation result is structurally forgeable

Only `PromotionRaceTablebaseDerivationReceipt` has a WeakSet and assertion. The public
`PromotionRaceTablebaseResult` has neither, even though later prose relies on “the result
assertion.” A caller can rebuild a reading arm or pair genuine geometry, domain evidence, digest
and invocation objects from different results in an unavailable arm without violating its type.

Define a module-private total-result constructor/seal and public assertion. It must bind every
discriminant to the exact request, invocation, source and derivation objects and reject
plain/spread/JSON/crossed arms.

### [[D2606]] — the type proof omits category and DTZ

The normative value contains `category`, `dtz` and `preciseDtz`. The fifth TypeScript model's
`ReadingValue` and `mapReading` omit the first two entirely, while its source type contains only
`kind` and optional `preciseDtz`. The strict typecheck therefore cannot fail caller-chosen or
cross-source outcome values—the most important tablebase fields.

Model the real recorded/live source union and prove category, DTZ, precise DTZ, FEN and perspective
are projected from that exact source with no reinterpretation.

### [[D2607]] — exact move and pawn operands are prose-only

The type model accepts a bare `readonly Move[]`, not the exact legal-map evidence and factory
receipt. It performs no legal-map FEN join, canonical sort or specialized input assertion and
accepts any structural geometry. The runtime “test” only searches the RFC for the phrase “one
dropped underpromotion”; it never mutates an input or runs the mapping.

Use the actual exact legal-map and geometry evidence types. Executably reject dropped, added,
reordered, rebuilt and cross-FEN promotion moves plus dropped/rebuilt tied pawn identities while a
valid positive retains the same objects.

## Required bounded repair

Unify these as one operation contract: one retained gate, one registered value constructor, one
sealed total result, exact source outcome projection, and exact legal-map/participant joins. Keep
provider exchange and evidence-value-authority as explicit dependencies rather than copying their
brands locally. A seventh genuinely fresh review still gates both held projection landings.
