# RFC: Evidence value authority — compute, derive or project before sealing

- **Status:** draft — author-amended 2026-08-30 through [[D2327]]; dependency-blocked on the
  returned semantic convention register/provenance and provider exchange contracts, then fresh
  independent buildability review
- **Author:** codex (agent), for Marco
- **Created:** 2026-08-30
- **Design refs:** `design/03-product-breadth.md` evidence architecture;
  `design/04-content-architecture.md` grounded predicates; `design/05-in-run-experience.md` §3
  evidence ceilings and §3-forms
- **Exploration gate:** [[D2144]] and [[D2145]], answered by
  `design/research/evidence-seal-value-authority.md` and
  `design/research/evidence-grounding-taxonomy.md`; executable population in
  `tools/d2144-evidence-seal-audit/`
- **Depends on:** implemented `rfc/archive/evidence-contract-manifest.md`; implemented
  `rfc/archive/semantic-evidence-selection.md`; draft `rfc/semantic-convention-register.md` and
  `rfc/semantic-convention-provenance.md` for convention closure; draft
  `rfc/provider-exchange-and-execution.md` for source receipts; draft
  `rfc/semantic-validation-authority.md` for event validation profiles
- **Parent / amends:** follow-up to `rfc/archive/evidence-contract-manifest.md` and
  `rfc/archive/semantic-evidence-selection.md`
- **Supersedes / superseded by:** —
- **Planning:** `planning/evidence-value-authority/` once implementing

```tabiya-claims
none
```

**Why `none`.** This RFC changes package-internal construction operations, catalogue projections
and consumers. It adds no persisted schema, database migration, pack/shape/principle member,
evidence-kind member or independent versioned register. New projection refs are owned by the one
compiled F1 catalogue and can merge with parallel additive catalogue work. The semantic convention
members it consumes remain claimed by `semantic-convention-provenance.md`, not duplicated here.

## Summary

The private `DeclaredEvidence` seal proves that package-owned construction ran. Seventy-five public
named object adapters currently let callers choose the payload that receives that seal; operand
names are checked, chess values are not. This RFC replaces those adapters with projection-specific
factories that **compute**, **derive**, **project a sealed source receipt**, or **project a registered
authored authority** before minting evidence. The four modes are implementation boundaries, not a
new learner setting or semantic-grounding axis.

The migration is population-closed. It first corrects the five false/mixed members of the current
twenty-row `rules/position_rules/exact` class, attaches existing convention closure to six more,
then removes all 75 caller-payload adapters and every duplicate router path. A projection cannot become a Support, Review, bot,
pack-validation or longitudinal input merely because a wrapper is sealed.

## Motivation

### 1. The current seal is necessary and insufficient

`declareEvidence` deep-freezes the payload and wrapper, records the wrapper in a private `WeakSet`,
and `evidenceForConsumer` admits only wrappers whose exact producer/projection binding exists. That
correctly prevents raw objects and post-seal mutation. It does not establish how the payload was
obtained. `[V]` basis: `packages/runtime/src/evidence-contract.ts:385-420` and D2144.

The only production minting module, `evidence-source-adapters.ts`, exports 75 generic object
adapters through the package root. Each checks the hand-written required-key list against manifest
operands and checks presence, then seals the caller's values. A false castling-loss event enters the
research selector; four false readings are protected only by zero current bindings. `[V]` basis:
D2144's executable controls.

### 2. Grounding and construction authority are different dimensions

`position_rules/exact` says what makes a fact true. It does not say whether a caller may author the
result object. The D2145 review finds four construction shapes inside that one scalar class: 9
literal totals, 6 exact computations under a direct convention, 2 product classifiers and 3
multi-authority projections. Demoting all convention-bearing facts would be as wrong as trusting
all twenty.

This RFC therefore adds no fifth `EvidenceGrounding` value. Convention identity remains the
semantic-convention RFC's responsibility; provider provenance remains the provider-exchange RFC's;
this RFC controls who is allowed to mint the value.

### 3. Scope

This RFC owns:

- correcting/splitting the five false or mixed current projections;
- one package-internal mint boundary and one projection-specific factory population;
- migration/removal of all 191 current mint routes, including the 75 generic adapters and four
  duplicate projection paths;
- migration of every current production call site and consumer binding;
- value-authority receipts in memory and executable negative authority fixtures; and
- a permanent set-equality gate between catalogue source projections, factories and tests.

It does not choose relevance, module budgets, presets, wording, move grades, chess definitions,
bot weights, campaign rewards or authored content. It adds no generic external plugin API for
minting evidence. It does not implement a second provider receipt, convention registry or authored
provenance store.

## Specification

### 1. One mint boundary, no root payload adapters

`packages/runtime/src/evidence-factories.ts` is the sole non-test production module that may import
and call `declareEvidence`. Its local `mint` helper is not exported. The module exports only
projection-specific factories whose parameters are the authority inputs in §2. Provider/opening
projection operations currently living in the server move their pure projection step into runtime
or call a runtime factory with a sealed source receipt; no server/web module mints directly.

`evidence-source-adapters.ts` is deleted. All 75 generic `declare*(payload)` root exports and every
specialized caller-payload router are
deleted. Tests that need arbitrary wrappers use an explicitly test-only compiler fixture under a
test file; production tests may not import `declareEvidence` to make a semantic positive.

The existing deep freeze and private seal remain. A successful factory returns the one sealed
payload instance; it never seals one object and publishes another equal object.

### 2. Four factory shapes

The factory registry is a literal package-internal table keyed by exact projection ref. Every
entry names one of the following implementation shapes. These names are documentation vocabulary,
not a new exported shared enum.

#### 2.1 Computed

A computed factory accepts only authority inputs required to run the named deterministic operation:

- a canonicalizable FEN;
- a validated `(beforeFen, moveUci, afterFen)` edge;
- a FEN plus bounded domain parameters; or
- those inputs plus exact already-sealed prerequisites named by the projection.

It invokes the existing producer operation exactly once, seals its returned payload, and exposes
the payload only through `DeclaredEvidence.payload`. It never accepts a result object, boolean,
count, event operands or caller-selected cause.

Factories returning a population return `readonly DeclaredEvidence<T>[]`; empty and unavailable
are explicit typed results, never fabricated evidence. A factory for a one-per-position reading
returns exactly one item. Optional readings return `available(value)` or an exact declared
`unavailable(reason)` result owned by the relevant source RFC.

#### 2.2 Derived

A derived factory accepts the exact sealed input values actually used plus non-evidence orientation
parameters declared in projection semantics. It proves the input multiset matches exactly one
`derivation.inputs`/`anyOf` member, computes the output through a registered pure operation, and
then seals it. Callers cannot supply an output payload or choose an ancestry after computation.

`compileSemanticEvidenceEvent` is inverted accordingly. It accepts authority inputs and declared
source/derivation items, calls the projection-specific operation, and returns the event. The current
shape—caller seals operands first, then asks the compiler to confirm object identity—is removed.

#### 2.3 Source receipt

Recorded, provider, model and corpus factories accept a sealed source/exchange receipt plus the
typed response bytes attached to that receipt. They verify subject/request digest, provider/model
identity, occurrence, result digest and success/absence arm according to
`provider-exchange-and-execution.md`, then project the payload. A caller-written `sourceId`, engine,
retrieval time, candidate list, tablebase category or evaluation cannot earn a seal independently.

Recorded evidence uses the durable recorded receipt; live evidence uses the live exchange receipt.
Projecting a recorded payload through a live receipt, or reusing one receipt for a different FEN,
request, model digest or response, fails before minting.

#### 2.4 Authored authority

Authored/theory factories accept the registered pack, shape, principle, citation or claim record
plus its exact document identity/digest/pointer. They project only fields present in that authority.
Caller prose, attribution, structure names, plan labels or theory applicability cannot be appended
inside the factory. Authored authority proves who asserted a claim; it never upgrades the claim to
position-rule truth.

### 3. Grounding correction before factory assignment

Unit: one of the twenty current generic `rules/position_rules/exact` projections. Total: 20,
set-equal to D2145's executable table.

#### 3.1 Retain nine literal rule projections

These retain their current primary grounding/exactness and gain computed factories:

1. `rules.castling.reading.rights@1`
2. `rules.castling.reading.legality@1`
3. `rules.castling.event.rights_lost@1`
4. `rules.structural.reading.pawn_connectivity@1`
5. `rules.structural.event.pawn_islands@1`
6. `rules.tactic.consequence.mate_in_one@1`
7. `rules.tactic.consequence.reply_breadth@1`
8. `rules.tactic.event.check@1`
9. `rules.tactic.reading.rook_on_seventh@1`

The first eight factories use their existing functions. Pawn-island consumes the two computed
connectivity readings from the validated edge. No second chess collector is introduced.

#### 3.2 Retain six exact-under-convention projections

These retain `position_rules/exact`, use computed factories and carry the direct/transitive
convention closure specified by `semantic-convention-provenance.md`:

- `rules.square.reading.control@1` and `rules.square.event.control@1` — `square-control@1`;
- `rules.tactic.reading.defender_duty_set@1`,
  `rules.tactic.event.defender_removed@1`, and
  `rules.tactic.event.defender_duty_relocated@1` — `defence-duty@1`; and
- `rules.tactic.consequence.forced_mate_after_move@1` — `mate-proof@1` plus the exact sealed
  `rules.tactic.consequence.reply_breadth@1` input.

The convention registry supplies definition/disclosure. This RFC supplies construction authority.
Neither duplicates the other.

#### 3.3 Replace two product classifiers

`rules.phase.reading@1` is retired from new bindings. Its successor
`rules.phase.reading@2` retains the current `PhaseReading` payload but declares
`declared_convention/convention`, direct phase-band convention identity, and a computed factory over
FEN. Every current consumer migrates atomically; v1 remains readable only for in-process backward
compatibility during the implementation commit and is absent from the final binding set.

`rules.structural.reading.named_structure@1` is retired from new bindings. Its successor
`rules.structural.reading.named_structure@2` carries exactly `id`, `name` and
`provenanceNote`, declares `declared_convention/convention`, and is computed from FEN through the
registered structure catalogue. The current one-operand declaration is deleted; arbitrary
`provenanceNote` cannot be sealed.

Both successor truth sets remain byte-compatible with current producer outputs. The version change
records corrected authority and operands rather than silently rewriting v1.

#### 3.4 Split three multi-authority projections

`rules.endgame.reading@1` is retired from new bindings and replaced by:

- `rules.endgame.classification@1`: product material/phase classification under a registered
  convention, with no technique records; and
- `theory.endgame.technique_candidate@1`: a cited theory candidate whose payload names the exact
  source/citation and applicability predicate. Until those citations and predicates exist, this
  projection is honest-empty and no Lucena/Philidor/Vancura sentence is rendered.

`rules.pivotal.marker@1` is retired from new bindings and replaced by four exact outputs:

- `derived.pivotal.irreversibility@1` from exact transition evidence plus run-node identity;
- `derived.pivotal.phase_change@1` from two phase classifications and run nodes;
- `derived.pivotal.human_divergence@1` from sealed Maia distribution plus run identity; and
- `derived.pivotal.option_collapse@1` from three exact legal-move readings plus run identity under
  the sustained-collapse convention.

The shared `PivotalMarker` rendering model may remain a discriminated union after admission; the
evidence items do not share one projection or grounding.

`rules.structural.predicate.result@1` is retired from new bindings and replaced by
`derived.structural.predicate_result@1`. Its factory accepts the sealed
`authored.structural_condition.input@1` value, evaluates that exact expression on the retained FEN,
and seals the computed result/trace. A raw condition, boolean or trace is not an input. Feature
results are computed in the same pass and retain their existing exact identities.

### 4. The complete current mint-route migration

The D2146 census separates three units at the current baseline: **191** production mint routes,
**187** distinct mintable projection ids and **6** manifest projections with no route. The 191
routes comprise 75 generic adapters plus 116 specialized/dynamic branches; four projections each
have two routes. The implementation records one reviewed migration row per current route with
`oldOperation`, exact projection ref, target projection ref, factory shape, production operation,
authority inputs, convention/source dependency and call-site count.

The checked-in author receipt at
`planning/evidence-foundation-ux/evidence-value-authority-route-map.json` is the literal starting
table, not a prose census. Its syntax-aware use pass records 184 used routes, seven export-only
routes and zero bound projections without a production use. The earlier direct-call-only probe that
reported 25 export-only / 19 bound rows is rejected by [[D2147]] because it missed callback use.
Before acceptance, author review replaces each manifest implementation path with the exact producer
operation symbol where the current catalogue names only a file; no `producerImplementation` path is
accepted as a factory's callable authority.

The set is partitioned at baseline as follows:

| Factory family after grounding repair | Current rows | Source of authority |
|---|---:|---|
| computed rules/product operations | 37 | FEN, validated edge or bounded rule inputs |
| derived operations | 25 | exact sealed derivation member, including the two runtime recorded-reading projections |
| recorded/provider/model/corpus/run projection | 9 | sealed source/exchange/run receipt |
| authored/theory projection | 4 | registered document/provenance authority |
| **Total generic adapters** | **75** | — |

Those 75 rows are one subset of the route table, not the full boundary. The complete 191-row receipt
must collapse the duplicate routes for `human.maia.event@1`, `live.stockfish.eval@1`,
`live.syzygy.result@1` and `rules.structural.reading.named_structure@1` to one final factory each.

The six no-route declarations are handled explicitly. Retired
`rules.structural.reading.pawn_count@1` remains without a factory. The other five—
`derived.grade.move_quality@1`, `theory.opening.current_endpoint@1`,
`theory.opening.catalogue_membership@1`, `run.record.position@1` and
`derived.opening.deepest_reached@1`—gain projection-specific factories and profiles in this
migration. Where an upstream authority is unavailable, the factory returns a typed, tested
unavailable result; absence of a factory is not the representation of honest emptiness. A binding
cannot land first, and a future binding cannot bypass value-authority review merely because the
projection was previously unbound.

[[D2327]] corrects the two runtime recorded-reading routes as a class. Both
`createRecordedEngineEvalV1Evidence` and `createRecordedTablebaseResultV1Evidence` accept the exact
same-record evidence minted respectively by `createSourcingLedgerEngineEvalV1Evidence` and
`createSourcingLedgerTablebaseResultV1Evidence`; neither accepts caller reading bytes or an
unrelated generic source receipt. Their upstream ledger factories remain source-receipt routes.
This changes the 75-row factory partition from 23 derived / 11 direct source to 25 / 9 without
changing the total or any projection identity.

The held promotion pair in `semantic-collectors.md` pins route symbols rather than inventing
aliases during its later implementation. The existing route-table rows are
`createRulesPawnReadingContactsV1Evidence`,
`createRulesMobilityReadingLegalMovesV1Evidence` and
`createRecordedTablebaseResultV1Evidence`. When the two held projections
are admitted, their additive routes are exactly
`createDerivedPawnPromotionRaceGeometryV1Evidence` and
`createDerivedPawnPromotionRaceTablebaseV1Evidence`, with the input/receipt algebras owned by that
RFC. The route/profile set-equality gate must absorb those rows in the same implementation commit;
neither document may introduce a compatibility alias.

At the 2026-08-30 baseline the catalogue has 193 declarations. Section 3 retires five old v1 rows
and adds nine successors, yielding 202 declarations: six retired and 196 non-retired factory
targets. The implementation re-derives those numbers at HEAD and fails on unexplained drift; it
does not copy them as timeless constants. “Uses generic factory” and wildcards are invalid rows.

No compatibility adapter may accept the old payload and forward it to a new factory. Tests and
fixtures migrate to authority inputs or explicit test-only compiler declarations.

### 5. Factory result receipt

Each `DeclaredEvidence` gains a package-private authority receipt held in a second private
`WeakMap`, not in learner/provider serialization:

```ts
interface EvidenceValueReceipt {
  readonly projection: VersionedEvidenceId;
  readonly factory: string;       // exact package symbol, diagnostic only
  readonly inputDigest: string;   // canonical authority inputs actually used
  readonly payloadDigest: string; // canonical sealed payload
  readonly sourceDigests: readonly string[];
}
```

The receipt is created atomically with the wrapper after the factory verifies its authority inputs.
`assertDeclaredEvidence` requires both private registrations and rechecks the frozen payload digest;
it does not pretend to reconstruct discarded input bytes later. Computed rows have no caller source
digests; derived rows contain exact declared-input payload digests; source/authored rows contain
their sealed receipt/document digests.

The receipt does not claim durable provenance. Durable convention/provider/history receipts remain
owned by their dependency RFCs. This in-memory receipt makes the package boundary able to reject a
wrapper minted through the wrong factory or from different inputs.

### 6. Consumer and module admission

`evidenceForConsumer`, semantic selection, module reducers, voice rendering and LLM requests accept
only wrappers with a valid value receipt. There is no “legacy sealed but unverified” arm.

The implementation updates all current bindings and call sites atomically for §3's successors. A
consumer binding to any retired v1 id fails catalogue compilation. No ordinary module activation
is added by this RFC; existing dispositions and ceilings remain unchanged.

### 7. Executable authority cases

The implementation adds one permanent factory profile per final projection. Each profile names:

- one valid authority input;
- one value falsifier (or, for source/authored rows, one mismatched receipt/document);
- expected availability/cardinality;
- expected projection ref and payload digest; and
- the production factory symbol.

Profiles are set-equal to the factory registry. For semantic events they reference the executable
cases owned by `semantic-validation-authority.md`; they do not duplicate chess positions. A
projection whose upstream authority is not yet available still has a profile: its valid case is
the exact typed unavailable arm and its falsifier proves that a fabricated available value cannot
be minted. It remains inspector/research unavailable and cannot receive a consumer binding by
assertion alone.

The permanent D2144 impossible castling event remains a negative: `e2e4`, byte-identical before and
after positions and `rook_captured` must be unrepresentable through the production API. The repaired
pawn-contact inversion remains a positive model for a complete reading factory.

### 8. Static closure and package boundary

A permanent `make evidence-value-authority` target runs:

1. a TypeScript AST census proving `declareEvidence` is called only by `evidence-factories.ts`
   outside tests;
2. package-export checks proving the local mint helper and all old adapters/routers are unavailable;
3. set equality among all non-retired final catalogue projections, factory rows and authority
   profiles, with bindings a checked subset;
4. exact current-route migration equality against the re-derived 191-route / 187-projection
   baseline, including the four duplicate paths and six no-route declarations;
5. the §3 9/6/2/3 reviewed grounding table;
6. convention closure for all six exact-under-convention rows;
7. no retired-v1 consumer binding; and
8. all authority positives/falsifiers.

This target joins `SOFTWARE_CONTRACT_TARGETS` and therefore runs in ordinary `make verify` and the
software-contracts CI job. It is not a pre-push hook and requires no custom environment variables.

### 9. Implementation order

1. Land the semantic-convention register/provenance dependencies and provider receipt contract.
2. Add the private mint/value-receipt boundary without changing call sites.
3. Implement §3's corrected/split projection identities and update the catalogue.
4. Migrate the 37 computed rows, starting with the twelve already-bound current rows.
5. Migrate the 25 derived rows and invert semantic-event compilation.
6. Migrate the 9 direct source-receipt and 4 authored rows.
7. Delete all generic adapters/root exports and enable the permanent closure gate.
8. Run complete software, browser, content, packaging and CI-parity gates before status changes.

No intermediate commit may widen ordinary learner bindings or leave both a caller-payload adapter
and a production factory exported for the same projection.

## Deviations from design

None in product intent. This RFC qualifies B4's implemented-state wording: exact construction
identity exists, but value authority is not complete. It preserves the design's separate evidence
planes, optional LLM renderer and assistance ceilings.

## Acceptance criteria

1. D2144/D2146's baseline is re-derived at author review: 75 generic adapters / 51 bound; 191
   production routes / 187 distinct mintable projections; 4 duplicate-route projections; 6
   no-route declarations, with no unexplained drift.
2. D2145's twenty-row table remains set-equal and the 9/6/2/3 classification is independently
   reviewed against producer symbols.
3. The semantic-convention and provider-exchange dependencies are accepted with the exact closure
   and receipt types consumed here; this RFC does not restate them.
4. The checked-in literal 191-row migration receipt names every old route, target factory symbol,
   shape, authority input, dependency and production use; author review resolves every remaining
   file-only producer implementation to an exact callable operation. The four duplicates must
   collapse and duplicate/missing/wildcard rows fail.
5. Only the package-private mint boundary calls `declareEvidence`; mint internals and old adapters
   are absent from runtime exports.
6. No production computed or derived factory accepts a result payload, boolean, count, event
   operands, caller cause or caller ancestry.
7. The nine literal and six exact-under-convention rows are computed from their authority inputs;
   the latter six carry the exact convention closure.
8. Phase and named-structure v1 have zero consumer bindings; their corrected successors have exact
   operands, grounding, factories and migrated consumers.
9. Endgame, pivotal and structural-result v1 have zero consumer bindings; every successor in §3.4
   has one truthful authority/factory profile, including an explicit unavailable arm where the
   required upstream authority does not yet exist.
10. A Lucena/Philidor/Vancura candidate cannot render without a cited theory authority and exact
    applicability predicate.
11. Each pivotal kind reaches its own projection; a rule marker cannot be relabelled human-model
    evidence and a Maia split cannot be relabelled a position-rule marker.
12. Structural predicate results cannot be minted without the exact sealed authored condition; a
    changed condition, FEN, boolean or trace fails.
13. Every final factory has one independent valid case and falsifier, set-equal to the registry.
14. The impossible castling-loss event and four same-key reading forgeries fail before sealing;
    pawn-contact inversion remains refused.
15. Derived factories reject missing, extra, duplicate, wrong-version and same-id/different-value
    ancestry; output payload supply is impossible.
16. Provider/model/corpus factories reject mismatched request subject, response digest,
    occurrence, provider/model identity and recorded/live arm.
17. Authored/theory factories reject caller-added prose, attribution, applicability and document
    mismatch; they never upgrade authored grounding.
18. Factory creation verifies input/source coherence and records their digests;
    `assertDeclaredEvidence` requires the private value receipt and rechecks payload-digest
    coherence without claiming to reconstruct discarded inputs.
19. `evidenceForConsumer`, semantic selection, module reducers, deterministic renderers and voice
    provider requests reject identity-sealed/value-unverified fixtures.
20. No ordinary module binding, preset, relevance rule, wording or content file changes in this
    implementation.
21. `make evidence-value-authority`, `make verify`, `make test-browser`, CI parity, package build and
    existing content contracts pass on committed bytes with the repository's normal Make targets.
22. Canonical `docs/evidence-contract.md` and `docs/semantic-evidence.md` describe construction
    authority, receipts, corrected projection identities and the absence of a generic mint API.
23. [[D2144]] and [[D2145]] flip only in the implementation/archive commit, alongside the required
    exploration-log entry and RFC closeout.
24. A fresh independent buildability review finds no caller-payload bypass, false authority join,
    missing production call site, undeclared shared-resource claim or green-by-construction test.
25. The 75-row partition is exactly 37 computed / 25 derived / 9 direct source / 4 authored.
    `recorded.engine.eval@1` and `recorded.tablebase.result@1` consume their exact same-record
    `sourcing.ledger.*` evidence outputs; caller bytes, another record and same-FEN value mutations
    fail before either runtime reading is minted ([[D2327]]).

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | Semantic convention register/provenance accepted and exact six-row closure consumable | semantic-convention-provenance | accepted dependency plus exact convention-closure contract fixture | |
| D2 | Provider/source receipt contract accepted and exact nine direct plus two chained recorded-reading source shapes consumable | provider-exchange-and-execution | accepted dependency plus exact source/derived receipt contract fixture | |
| D3 | Semantic event authority profiles accepted for reuse without duplicating cases | semantic-validation-authority | accepted dependency plus set-equal authority-profile receipt | |
| D4 | Fresh independent buildability review after D1–D3 and the literal 191-route author table | codex | fresh review record with every blocking finding closed or routed | |

## Open questions

None for the owner. Author review must settle exact successor symbol spelling and the literal
191-route migration table before acceptance; those are buildability obligations, not product choices.

## Changelog

- 2026-08-30: [[D2327]] corrects the recorded-reading route class: runtime engine and tablebase
  readings are derived from their exact validated sourcing-ledger evidence, changing the reviewed
  75-row partition from 23/11 to 25/9 derived/direct-source without changing its total. Pinned the
  held promotion pair's five exact future/existing route symbols to the same authority.
- 2026-08-30: created from D2144/D2145; separates primary grounding, convention closure and value
  construction; refuses caller-payload compatibility adapters and generic mint APIs.
- 2026-08-30: D2146 self-review correction — 75 generic adapters, 191 routes, 187 mintable ids,
  four duplicates and six no-route declarations; replaced the impossible cross-module capability
  claim with one runtime factory module and corrected receipt verification semantics.
