# Source-retaining phase composition

**Question:** How should exact opening identity, the rules phase convention, endgame classification
and tablebase evidence compose without one source impersonating another or a UI inventing a single
“true phase”?

**Run:** 2026-09-01 · `make phase-source-composition-census` · result
`planning/phase-source-composition/results.json` · SHA-256
`fe0aa83d598a605dcc7977360f512446a641a2201780c36029ddeec68cce4574` `[V]`

## Verdict

The composition must be a source vector at an exact recorded position plus an ordered history of
those vectors. It must not be a precedence rule or merged phase enum. Across 804 authored positions,
the pinned opening catalogue has 132 exact named endpoints and 204 path memberships; the local
rules convention returns 153 opening, 233 middlegame, 296 endgame and 122 unclear; endgame material
classification applies to the same 296 positions but names a type on only 109; and committed exact
tablebase evidence reaches 241 positions while 563 are outside the seven-piece domain. `[V]`
(`planning/phase-source-composition/results.json` `sourceReach`.)

The sources overlap without agreeing on one stage. Catalogue membership includes 104 rules-opening,
70 rules-unclear and 30 rules-middlegame positions. Exact named endpoints include 79 opening, 39
unclear and 14 middlegame positions. All 296 rules-endgames are outside the catalogue, but 55 are
also outside Syzygy domain and 241 carry recorded exact tablebase evidence. A consumer may select
which source is relevant to its job; it may not overwrite one with another. `[V]`
(`planning/phase-source-composition/results.json` `openingPhaseMatrix`, `endpointPhaseMatrix` and
`tablebasePhaseMatrix`.)

## What was measured

The disposable prototype loads the committed opening catalogue and its exact source/compiler
digest, walks every legal authored node once and all 100 root-to-leaf paths, joins exact-FEN
`tablebase_result` records from committed sidecars, and retains each source's native result shape.
It refuses a named endpoint without catalogue membership, endgame applicability inconsistent with
the rules phase, a tablebase record crossed from another FEN/piece count, or a recorded result
outside domain. All four impossible joins are zero across the corpus. `[V]`
(`tools/d2485-phase-source-composition/`; `planning/phase-source-composition/results.json`
`invariants`.)

The focused negative controls also run the composition with an unavailable opening artefact. Both
opening projections abstain with `artifact_missing`; the rules phase remains available; and the
history projection returns `input_abstained`. A valid ≤7-piece position with no committed record is
`in_domain_unrecorded`, not `provider_unavailable`; adding an exact record changes only that source
slot. `[V]` (`tools/d2485-phase-source-composition/compose.test.ts`.)

## Current source reach

| source answer | positions | meaning |
|---|---:|---|
| exact named opening endpoint | 132 | current position equals one named catalogue endpoint |
| opening catalogue member | 204 | current position lies on at least one named path; no name inferred |
| rules opening / unclear / middlegame / endgame | 153 / 122 / 233 / 296 | local phase-band convention, with D2484 arm/margin |
| typed endgame material class | 109 | 33 pawn, 31 rook, 31 rook+pawn vs rook, 14 minor |
| untyped rules endgame | 187 | endgame band applies; material census names no class |
| recorded exact tablebase | 241 | committed source record bound to this full FEN |
| outside tablebase domain | 563 | local piece-count preflight; not provider failure |

The authored corpus happens to have complete recorded-tablebase coverage for its ≤7-piece nodes:
241 recorded and zero in-domain-unrecorded. That is a content receipt, not a live-provider guarantee
or a reason to omit the unavailable arm from product types. `[V]`
(`planning/phase-source-composition/results.json` `recordedTablebase`.)

The existing endgame reader is not a safe technique source. All 31 rook-and-pawn-versus-rook
positions emit both `lucena` and `philidor`, yielding 31 occurrences of each and no Vancura in this
population. Those are opposing technique roles and material alone supplies no applicability
geometry. This is [[D2487]] and independently supports the already-drafted split between
`rules.endgame.classification@1` and a cited `theory.endgame.technique_candidate@1`. `[V]`
(`packages/runtime/src/endgame.ts`; `planning/phase-source-composition/results.json`
`currentTechniqueCandidates`.)

## History is not a stage scalar

The 100 authored paths contain 1,069 position occurrences. Only 57 paths reach any exact named
endpoint; 43 honestly do not. Current endpoint status changes 199 times (85 absent→matched, 114
matched→absent). Catalogue membership changes 63 times and re-enters on 14 absent→member edges
after 49 exits. Therefore neither exact endpoint nor path membership may become sticky “book state,”
and leaving membership is not an irreversible opening boundary. `[V]`
(`planning/phase-source-composition/results.json` `history`.)

The same paths contain 56 rules-phase changes, five endgame-type changes and 260 changes in the full
source vector. Tablebase state changes zero times because each authored path in this corpus stays
entirely outside domain or entirely inside the now-complete recorded population. A product contract
still needs synthetic outside→inside and provider-failure controls; this corpus cannot make those
criteria fail. `[V]` for the counts; `[M]` for the required falsifier.

## Required composition contract

The smallest truthful reusable unit is a `PhaseArcPoint` derived over one sealed
`run.record.position@1` and retaining these independently versioned inputs/results:

1. `theory.opening.current_endpoint@1` and
   `theory.opening.catalogue_membership@1`, including matched/member, absent and source-abstained
   arms plus catalogue identity;
2. `rules.phase.reading@2`, including its five-member D2484 decision and convention identity;
3. `rules.endgame.classification@1` as `not_applicable`, typed or untyped convention output; and
4. an optional exact tablebase source path: recorded or live success retains the full source
   receipt; outside-domain retains the local preflight; no satisfied path retains the provider
   contract's typed absence. Recorded absence is never relabelled provider failure.

The point carries no top-level `phase`, `stage`, `inBook`, `confidence`, selected source or advice.
It introduces no new chess truth; it packages sealed facts without widening their grounding,
exactness, availability or confidence. `[M]` grounded in the measured overlap and F1/provider
contracts (`rfc/evidence-value-authority.md`; `rfc/provider-exchange-and-execution.md`).

An ordered `PhaseArc` is derived from exact path-ordered points and retains node/ply/FEN identity.
It may expose source-local changes—endpoint reached/lost, membership entered/exited, phase-arm
changed, endgame class changed, tablebase became applicable/available—but never invents one
canonical transition. Review may use the history to say “deepest named opening reached”; Support
uses only the current point; longitudinal aggregation counts source-specific observations; bots
consume explicitly declared operands. Presentation, relevance and precedence remain separate
module policies. `[M]`

## What remains open

This is an in-repo corpus composition reading, not independent phase truth. It does not decide how
ordinary UI phrases a source vector, which source a preset reveals, or how phase changes rank in
Review. The tablebase-transition arm lacks a positive authored path. The exact endgame technique
applicability predicates remain unimplemented. Production requires an accepted composition RFC
after the value-authority, provider-exchange and recorded-position/path authorities settle; no
current classifier or provider should absorb the composition ad hoc. `[V]` for dependency status
(`rfc/README.md`); `[M]` for the implementation boundary.

No product producer, projection, module, pack, schema or authored chess statement changed in this
pass.
