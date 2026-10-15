# Inspector source amendment — independent review, 2026-10-15

Scope: D3792, `rfc/module-registration.md` §4.11a and the six source-member views in
`rfc/evidence-presentation.md`. Marco explicitly authorized a separate reviewer. The reviewer
inspected the draft and actual factories, catalogue, execution and server boundaries read-only,
and performed two in-memory direct-import controls (under one second combined). No production
edits, heavy/browser/provider checks or acceptance occurred. Main checked the cited specification
and implementation boundaries before recording this return. Line references identify this review's
source image; the named symbols/sections are the durable anchors.

Result: **return for corrections; amendment remains unaccepted**. Missing production constructors,
route, parsers and native journeys are intentionally unimplemented, not newly discovered live bugs.

## D3841 — complete consumer execution image (P1)

`module-registration.md:1872` requires complete-consumer compilation before acquisition.
`evidence-presentation.md:1989` registers detail views only to `module.full_inspector@2`.
The draft does not specify that successor's complete declaration/adapters/execution image,
coexistence with @1 or the execution representation of explicitly retained legacy holds.

The independent direct-import control finds 75 accepted refs and 36 current Inspector acquisitions.
Current @1 execution refuses `EXECUTION_SOURCE_UNREGISTERED` at `live.stockfish.eval@1`;
@2 refuses `BINDING_EXECUTION_UNDECLARED`. The actual
`compileEvidenceConsumerExecution` (`packages/runtime/src/evidence-binding-execution.ts:32`)
compiles every binding; `moduleConsumerSpec` (`evidence-catalog.ts:1348`) still constructs the
current module image without an Inspector provider-source-absence policy.

Required author repair: specify the full successor image and old-image compatibility. Resolve
upstream migration-before-acceptance or explicitly author an admitted held-binding representation.
Filtering legacy bindings or converting execution-compilation failures into ordinary absence is
not a valid implementation of the current complete-image requirement.

## D3842 — original comparison FEN refusal (P2)

The constructor order (`module-registration.md:2219`) and acceptance controls (`:2280`) name
complete original graph validation, not every original requested path's FEN validation before
endpoint extraction. `tools/d3792-inspector-demand/build-comparison.mjs:21` likewise obtains
graph paths then slices them. The existing `structureDeltaEntries`
(`packages/runtime/src/compare-strip-values.ts:74`) reads complete branch FENs.

The review's direct-import negative replays a later invalid FEN without kings: stored replay and
both graph paths admit it, while the unchanged structural factory refuses. An earlier scoped
endpoint must not hide that refusal. Specify full original-path FEN validation before narrowing,
with independently retained immutable source operands and a late-invalid-FEN negative proving
detector counters stay zero. Pivotal/Review already state stronger original-source validation.

## D3843 — held dependency cannot cross the closed wire (P2)

`module-registration.md:2264` requires `unavailable/source_version_held` with its actual dependency;
`:2594` and `tools/d3792-inspector-demand/draft-wire.ts:51` admit only the reason. For example,
the existing opening factories retain `runtime-opening-identity`
(`packages/runtime/src/evidence-factories.ts:1765–1777`).

Specify either a closed held-source outcome with its exact dependency/blocker and disclosure
binding, or an explicit authoritative projection-to-blocker lookup used by receivers. Neither
exists in the current draft; implementations must not guess the dependency or erase it.

## Known authoring debt, not additional surprise findings

`module-registration.md:2292` and `:2713` explicitly retain supplier acquisition/absence/receiver/
cancellation authoring. Factory fixtures and names alone do not settle provider-page acquisition,
sourcing-ledger joins, all ten v1 sequences or opening acquisition. Exact source-outcome mappings
also remain necessary, including `empty_population` and `ledger_record_not_admitted`.

All 75 source obligations, current access/role/disclosure ceilings, weakest-input authority,
bounded member detail and real HTTP/client/native journeys remain. This review does not retire
sources, promote qualification, change ordinary help defaults or authorize production changes.
Repair the three rows and remaining explicit supplier contract, then obtain independent re-review;
the parent's implementing state does not accept this amendment.
