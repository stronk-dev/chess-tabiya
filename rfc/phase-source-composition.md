# RFC: Source-retaining phase composition

- **Status:** draft — bounded author repair complete 2026-09-04 on [[D2636]]–[[D2642]];
  dependency acceptance and another fresh independent review required before implementation
- **Author:** codex (agent), for Marco
- **Created:** 2026-09-01
- **Design refs:** `design/03-product-breadth.md` B2/B4/B10 and evidence architecture;
  `design/05-in-run-experience.md` §3 evidence ceilings and §3-forms
- **Exploration gate:** Q4c, answered for source composition by
  `design/research/phase-source-composition.md` and the reproducible
  `make phase-source-composition-census` instrument
- **Depends on:** implemented `rfc/runtime-opening-identity.md`; draft
  `rfc/evidence-value-authority.md` for `rules.phase.reading@2`,
  `rules.endgame.classification@1` and value-authorized factories; draft
  `rfc/provider-exchange-and-execution.md` for live tablebase result arms; draft
  `rfc/semantic-convention-provenance.md` for convention closure; draft
  `rfc/recorded-semantic-path.md` for the sole run-path operation; draft
  `rfc/evidence-presentation.md` only as the downstream inspector boundary
- **Parent / amends:** composes existing source producers; follow-up to
  `rfc/archive/evidence-contract-manifest.md`
- **Supersedes / superseded by:** —
- **Planning:** `planning/phase-source-composition/` once implementing

```tabiya-claims
none
```

**Why `none`.** The composer and its runtime brand remain server-package internal. This RFC adds
no persisted schema, database migration, pack/run/shape/principle version, evidence-kind member or
independently versioned shared resource. It consumes projection identities owned by the compiled F1
catalogue; it does not mint another chess-evidence projection. If the view is later persisted,
serialized to the web client or exported across a package boundary, that change first owes a
registered versioned resource rather than extending this exemption.

## Summary

Build one reusable, source-retaining view over an exact recorded chess position and one ordered
view over a recorded path. Opening endpoint, opening catalogue membership, the rules-only phase
convention, rules endgame classification, tablebase domain, recorded tablebase evidence and live
tablebase execution remain independent slots. No slot wins a precedence contest and no composer
field claims the one “true phase.”

The compiler is production foundation, not learner copy. Support receives only the current point;
Review receives the ordered arc; bots name the exact slots they use; longitudinal analysis counts
source-specific observations and opportunities. Presets and modules decide relevance and wording
later. The advanced inspector may expose the attributed slots, but ordinary play never receives a
raw evidence dump from this RFC.

## Motivation

The current product has several individually useful producers and no binding object that keeps
their authority straight. Callers can therefore choose one source ad hoc, carry an opening label
forward after it stopped matching, treat rules-phase abstention as source failure, or call a
material class a named endgame technique. That is the producer-to-feature disconnect behind
[[D2485]].

The measured join rejects a precedence design. In 804 authored positions, catalogue membership
overlaps 104 rules-opening, 70 rules-unclear and 30 rules-middlegame readings. Across 100 authored
paths it exits 49 times and re-enters 14. All 296 rules-endgame positions are absent from the
opening catalogue, but only 241 have recorded tablebase evidence; 55 are outside the tablebase
domain. These are different questions, not noisy votes on one label.

This RFC owns the exact join, source-local state changes, anti-forgery boundary and five production
handoffs. It does not own phase truth labels, source ranking, assistance presets, module selection,
learner wording, bot weights, style classification, campaign rewards, pack prose or endgame-theory
applicability.

## Specification

### 1. Authority boundary

`apps/server/src/phase-source-composition.ts` is the sole production composer. A point accepts one
asserted `run.record.position@1` item plus source-operation results that bind to that position. An
arc accepts only `run`, `branchId` and source dependencies; it calls `recordedSemanticPath(run,
branchId)` and the same point compiler itself. It never accepts a caller-written path, source
payload, phase label, opening name, endgame type, tablebase category, confidence, relevance or
advice.

The module owns a runtime-private brand and `WeakSet`, following the existing compiled consumer
view pattern. `compilePhaseSourcePoint` and `compilePhaseArc` are the only constructors. Every
consumer calls `assertPhaseSourcePoint` or `assertPhaseArc`; a structural clone, JSON round-trip,
double assertion or object with the same bytes fails `PHASE_SOURCE_VIEW_UNSEALED`.

The branded views are not `DeclaredEvidence`. Composition creates no new chess proposition. A
consumer may render only declared items retained inside an admitted module/consumer view. It may
not turn a slot state or source-local change into learner prose merely because the composer
calculated it.

### 2. Exact point

The normative shape is conceptually:

```ts
interface PhaseSourcePoint {
  readonly position: DeclaredEvidence<RecordedPosition>; // run.record.position@1
  readonly openingSources: {
    readonly currentEndpoint: SourceResult<CurrentOpeningEndpoint>;
    readonly catalogueMembership: SourceResult<OpeningCatalogueMembership>;
  };
  readonly rulesPhase: SourceResult<PhaseBandReadingV2>;
  readonly rulesEndgame: SourceResult<EndgameClassification>;
  readonly tablebase: {
    readonly recorded: RecordedTablebaseResolution;
    readonly live: TablebaseLiveSlot;
  };
}
```

This is explanatory TypeScript, not a second exported protocol. The implementation uses the exact
dependency types and preserves their declared evidence wrappers/receipts.

`SourceResult<T>` preserves the dependency's complete success, exact absence and source-abstention
arms. The composer does not replace those arms with `T | null`, a Boolean, a generic string or an
aggregate availability flag. A local source remains available when another source abstains.

#### 2.1 Exact-position and opening-operation join

The recorded position is the join authority. The compiler asserts the declared item, canonicalizes
its full six-field FEN once and retains its `nodeId` and `ply`. Every source that owns a full-FEN or
occurrence operand must bind those bytes exactly. A tablebase result for the same board with
different side-to-move, castling, en-passant or clock fields is not the same source input and fails.
The compiler never imposes an operand a source does not own.

Opening is the deliberate source-specific join. Callers supply `OpeningCatalogueAvailability`, not
endpoint or membership payloads. `resolveOpeningSources(position, availability)` is the only
operation: it asserts the recorded position, calls the implemented paired
`openingIdentityAt(availability, position.payload.fen, position.payload.ply)` once, recomputes
`transposeKey(position.payload.fen)`, and seals a private receipt retaining the exact position item
and both returned payloads by reference. Each successful/absent result must carry that key and ply;
both must carry one catalogue identity. A matched endpoint without membership, changed return,
different catalogue digest or different observed ply fails. The four-field catalogue key is not
relabeled as a full-FEN claim: exact occurrence authority comes from the enclosing retained
position item. If the catalogue is unavailable, both slots retain the same typed source reason and
the rules slots still compile.

`rules.phase.reading@2` must bind the exact FEN and retain its five-arm D2484 decision. The composer
does not translate margin into probability or uncertainty. `rules.endgame.classification@1` is
`not_applicable` exactly when the phase convention is not in its declared endgame applicability
arm; within that arm, typed and untyped are both honest outputs.

#### 2.2 Recorded and live tablebase slots

Tablebase state is three fields, not one nullable result:

```ts
interface RecordedEvidenceSnapshotReceipt {
  readonly packId: string;
  readonly packDigest: string;
  readonly ledgerDigest: string;
  readonly tablebaseFens: readonly CanonicalFullFen[];
}

type RecordedTablebaseResolution =
  | { readonly kind: "recorded"; readonly fen: CanonicalFullFen;
      readonly item: RecordedTablebaseEvidence; readonly snapshot: RecordedEvidenceSnapshotReceipt }
  | { readonly kind: "absent"; readonly fen: CanonicalFullFen;
      readonly snapshot: RecordedEvidenceSnapshotReceipt }
  | { readonly kind: "source_unavailable";
      readonly reason: "no_pack_source" | "ledger_unverified" | "ledger_invalid" };

type TablebaseLiveSlot =
  | { readonly kind: "not_requested" }
  | { readonly kind: "success";
      readonly result: ProviderSuccess<"syzygy.position@1">;
      readonly item: DeclaredEvidence<ProviderEvidenceDelivery<LiveSyzygyPosition, "syzygy.position@1">> }
  | { readonly kind: "local_domain_result";
      readonly result: ProviderLocalDomainResult<"syzygy.position@1">;
      readonly item: DeclaredEvidence<ProviderLocalDomainResult<"syzygy.position@1">> }
  | { readonly kind: "source_failure";
      readonly result: ProviderSourceFailure<"syzygy.position@1"> };
```

`compileRecordedEvidenceSnapshot(packRecord)` is the sole private snapshot constructor. It accepts
the pack registry's digest-matched, validated evidence ledger and its exact compiled position index;
derives the sorted unique canonical full-FEN tablebase inventory; records pack, ledger and source
digests; and seals the receipt in a `WeakSet`. Non-pack, unverified and invalid-ledger states are
typed source-unavailable inputs, not empty snapshots. `resolveRecordedTablebase(position,
snapshot)` asserts both authorities and returns a sealed same-FEN `recorded` or `absent` result.
Store/read/validation failure never becomes absence. A caller digest, map, item or Boolean is not an
accepted input.

The composer does not compute tablebase domain. It retains the provider exchange's exact result
arms. Outside domain is the sealed `ProviderLocalDomainResult<"syzygy.position@1">` and its exact
`rules.endgame.tablebase_domain@1` declared item; it is neither provider failure nor a locally
recomputed field. Success and source failure likewise retain their operation/request digest and
must bind the point's canonical FEN. `not_requested` is the only state with no provider operation.
The recorded snapshot and live provider exchange remain independent.

Recorded and live success remain side by side. The compiler never silently prefers live over
recorded, recorded over live, or success over a second source's failure. It performs no provider
request. Only the caller's declared workflow may request one, after which a second compilation can
carry the resulting receipt.

#### 2.3 Forbidden aggregate fields

The point type and runtime value have no top-level `phase`, `stage`, `inBook`,
`endgameTechnique`, `confidence`, `priority`, `rank`, `significance`, `relevance`, `hint`, `advice`
or selected-source field. `openingSources` is an attributed namespace, not a phase label. A literal
root-key guard is generated from the normative point/arc declarations and fails the build if a
forbidden aggregate appears at either root; a negative fixture adds every forbidden key one at a
time.

### 3. Ordered arc

`compilePhaseArc(run, branchId, sourceDependencies)` calls
`recordedSemanticPath(run, branchId)` and returns its exact refusal unchanged before source
composition. On success it resolves the ordered nodes from that authority and compiles one point per
occurrence. No overload accepts nodes, FENs, a path array, semantic events or evidence. The compiler
never sorts a branch union by ply and retains repeated positions as distinct nodes. Same-id/
different-event-head, truncated, reordered, foreign-run and stale-source maps fail before an arc is
branded.

For each adjacent pair it emits source-local structural changes:

```ts
type PhaseSourceChange =
  | EndpointChange
  | CatalogueMembershipChange
  | RulesPhaseDecisionChange
  | EndgameClassificationChange
  | TablebaseDomainChange
  | RecordedTablebaseAvailabilityChange
  | LiveTablebaseAvailabilityChange;
```

Every change retains `fromNodeId`, `toNodeId`, `fromPly`, `toPly`, source kind and exact before/after
slot results. Endpoint and membership entered/exited states are reversible. An endpoint match may
be reached, lost and reached again; catalogue membership may leave and re-enter. The compiler does
not emit `opening_to_middlegame`, `phase_transition`, `left_book`, `entered_endgame` or any other
canonical cross-source event.

Changes are deterministic comparison metadata inside the branded view, not learner evidence. A
later derived-evidence projection may name one only by declaring the exact before/after evidence
and its own convention. This RFC provides no generic `renderPhaseSourceChange`.

### 4. Endgame technique boundary

`rules.endgame.classification@1` carries material/phase classification only. The composer drops
the legacy `techniqueCandidates` array entirely. It never retains, derives or renders Lucena,
Philidor or Vancura names.

This refusal is failable: the fixed 804-position corpus contains 31 KRPvKR positions and the
current reader emits both `lucena` and `philidor` on all 31. The point/arc output must contain zero
technique fields and zero technique-name bytes for that population. A future
`theory.endgame.setup_match@1` enters only with a cited/versioned setup convention and a
factory-computed exact operand intersection under `evidence-value-authority.md`; the composer may
then add it as another independent source slot, never fold it into the rules material class.
Method stage, bounded reachability and tablebase outcome remain different sources and cannot be
inferred from that slot.

### 5. Production handoffs

Unit: one consuming operation family. Total: **4**. The author and implementation receipts are
set-equal to these rows; mentioning a file or projection without calling the compiled view does not
count.

| consumer family | operation boundary | admitted view | explicit refusal |
|---|---|---|---|
| Support module assembly | current-position evidence assembly before module reducers | one `PhaseSourcePoint` | no history, raw dump, automatic hint or source precedence |
| Review evidence compiler | exact selected run/branch-path compilation | one ordered `PhaseArc` | no branch union sorted by ply and no canonical phase transition |
| bot policy | policy input construction | current point; policy profile names every slot it reads | no generic `phase` feature and no implicit move weight |
| longitudinal store | source-observation/opportunity publication | source-specific point/change observations | no single phase habit, style label or denominator-free rate |

The Support and Review operations are mandatory implementation call sites, not future prose
handoffs. This RFC cannot move to implemented with an unused compiler. Bot, longitudinal and
integration may be held as named discharges if their owning RFC is not yet accepted, but
the source types and negative fixtures must already be consumable without adapters.

The advanced inspector is deliberately **not** a fifth handoff. The raw branded point stays inside
the server package. `module-registration` plus `evidence-presentation` own any future
`module.full_inspector@1` binding: each shown success becomes its registered sealed presentation
component, and each shown source state requires an operation-derived typed absence component. No
phase-source object, source-result union or private brand is serialized. Adding a dedicated phase
inventory wire later first owes the registered resource this RFC's claims exemption requires.

The composer supplies no selection score. Support module eligibility and preset ceilings remain
`learner-modules.md`/`module-registration.md`/`intent-presets.md`; Review moment selection remains
`review-evidence-compiler.md`; bot weighting remains `bot-policy.md`; persistence, denominators and
revision semantics remain `longitudinal-store.md`.

### 6. Availability and failure behavior

The compiler returns a point whenever the recorded position and local rules operations are valid.
Opening or provider unavailability does not erase the point. A malformed or crossed successful
evidence item fails closed rather than becoming an unavailable source.

The closed operational failures are:

- `PHASE_SOURCE_VIEW_UNSEALED` — forged/serialized view;
- `PHASE_SOURCE_POSITION_MISMATCH` — input or receipt binds another full FEN/node occurrence;
- `PHASE_SOURCE_CATALOGUE_MISMATCH` — opening slots disagree on catalogue identity/ply;
- `PHASE_SOURCE_OPENING_INVARIANT` — named endpoint without membership;
- `PHASE_SOURCE_ENDGAME_INVARIANT` — endgame applicability contradicts the rules convention;
- `PHASE_SOURCE_RECORDED_SNAPSHOT` — unsealed/crossed snapshot or invalid recorded absence;
- `PHASE_SOURCE_TABLEBASE_RESULT` — live result/item/request contradicts provider authority or FEN; and
- `PHASE_SOURCE_PATH_INVALID` — unordered, duplicate-node or non-ancestral arc input.

These failures are bugs or corrupt inputs. They are never rendered to a learner as “no evidence.”
Typed dependency abstentions and provider receipts remain ordinary source states.

### 7. Implementation order

1. Accept the value-authority, convention-provenance, recorded-path and provider-result dependencies
   with the exact types consumed here.
2. Land the private recorded-snapshot/opening-resolution operations and branded point compiler with
   crossed-source negative fixtures.
3. Land the run+branch arc compiler, reversible source-local changes and independent compatibility
   controls.
4. Replace Support and Review ad-hoc phase/opening/endgame joins with the compiled operations.
5. Add typed bot/longitudinal handoffs without adding policy or presentation; leave inspector
   projection to its owning presentation/module RFCs.
6. Run software, content, browser, packaging and CI-parity gates; update canonical docs and close
   the ledger/log in the archival commit.

No intermediate commit may expose an aggregate phase field, render source-change prose, retain
legacy technique candidates or leave both an ad-hoc and compiled join live at one call site.

## Deviations from design

None in intent. This RFC qualifies B10's “attributed phase classification” wording: individual
producers exist, but their reusable source-retaining composition does not. It preserves the
design's evidence planes and module/preset separation.

## Fresh independent review return (2026-09-04)

The source-vector direction survived a seven-defect return. The bounded author repair resolves the
contract tier as follows:

- [[D2636]]: `openingSources` is admitted while the literal guard retains only actual aggregate keys;
- [[D2637]]: one private opening operation derives both results from the retained exact occurrence;
- [[D2638]]: arc compilation accepts run+branch and invokes the sole recorded-path operation itself;
- [[D2639]]: the provider's success/local-domain/failure union is retained without recomputation;
- [[D2640]]: one sealed digest-matched evidence snapshot and resolver own recorded absence;
- [[D2641]]: inspector is removed from the private-view handoff and remains presentation-owned; and
- [[D2642]]: applicability is crossed from independently supplied declared results, while the
  circular corpus counter is demoted to telemetry.

Exact receipt and executable falsifier:
`planning/phase-source-composition/fresh-independent-buildability-review-2026-09-04.md` and
`make phase-source-composition-fresh-review`. `make phase-source-composition-author-repair` retains
the eight original controls and proves the seven repaired obligations. Another genuinely fresh
review still gates acceptance.

## Acceptance criteria

1. `make phase-source-composition-census` reproduces 50 packs, 804 positions, 100 paths, 1,069
   path-position occurrences and the committed result digest. Its historic applicability counter
   is reach telemetry only and is never cited as an independent invariant.
2. Source reach reproduces 132 exact endpoints, 204 memberships, 153/122/233/296 rules
   opening/unclear/middlegame/endgame, 109 typed endgames, 187 untyped endgames, 241 recorded
   tablebase positions and 563 outside-domain positions.
3. Opening membership × rules phase reproduces member 104 opening / 70 unclear / 30 middlegame;
   no precedence or merged-stage field enters the type or runtime result.
4. The 100-path receipt reproduces 49 membership exits and 14 re-entries. A synthetic
   member→absent→member path retains all three points and both changes; no sticky label survives.
5. A source-unavailable opening fixture retains two exact opening abstentions while rules phase and
   local endgame applicability remain available. A caller cannot supply either opening result;
   changing the retained position, paired return, key, ply or catalogue identity fails.
6. Same-transposition/different-full-FEN for full-FEN sources, same-FEN/different-node occurrence,
   crossed catalogue digest and crossed provider-result fixtures fail before a view is branded;
   opening's four-field key remains explicitly source-local.
7. Recorded success, sealed snapshot absence, no recorded source, provider not requested, provider
   success, provider source failure and provider local-domain result remain distinct arms. A bare
   snapshot digest/map, typed result without its declared item, local recomputation and a provider
   request triggered by the composer all fail.
8. The D2484 five-arm rules result is retained byte-for-byte as a declared input; the composer
   cannot accept or derive a probability, accuracy estimate or move-distance claim.
9. Endgame applicability is set-equal to the declared rules-phase arm. Typed and untyped endgames
   compile; independently supplied declared phase/endgame results exercise both valid arms and at
   least two crossed contradictions. No control compares `classifyPhase` to a reader that calls
   `classifyPhase` internally.
10. Across all 31 measured KRPvKR positions the point and arc contain zero Lucena/Philidor/Vancura
    fields or bytes. A material-only technique fixture fails the production boundary.
11. Point and arc roots contain none of §2.3's forbidden aggregate fields. The generated guard
    accepts the exact normative `openingSources` shape and rejects each added forbidden property.
12. Forged structural clones, JSON round trips and double assertions fail the runtime brand check.
13. The four-row production-handoff table is set-equal to a checked receipt. Support and Review
    invoke the compiled operation; a symbol/file-only census does not pass.
14. Support receives only the current point. Review receives only its requested exact path. Bot
    policy fails if a profile reads a slot it did not declare. Longitudinal publication fails
    without source-specific opportunity identity.
15. No ordinary learner renderer, module rank, preset, bot weight, style label, campaign reward,
    pack content or LLM prompt changes under this RFC.
16. No phase-source view or union crosses the server package. Any advanced-inspector use is a
    downstream `evidence-presentation` component binding; a direct JSON/wire export and an ordinary
    Play raw source list both fail.
17. `make phase-source-composition-author-contract`, focused composer tests, `make verify`,
    `make test-browser`, package build and CI parity pass on committed bytes through normal Make
    targets before status changes.
18. `docs/evidence-contract.md`, `docs/explanation-grounds.md` and the exact Support/Review system
    docs describe the source vector, brand, failure behavior and absence of a canonical phase.
19. [[D2485]] closes only in the implementation/archive commit with the exploration-log entry.
    [[D2487]] remains open until cited technique applicability lands; this RFC's correct discharge
    is withholding the false fields, not declaring theory solved.
20. Fresh independent buildability review finds no source-authority widening, ad-hoc surviving
    join, green-by-construction corpus control, shared-resource omission or consumer named without
    a real operation.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | Value-authority factories and corrected phase/endgame projections accepted and consumable | evidence-value-authority | accepted dependency plus exact factory/type fixture | |
| D2 | Recorded/live tablebase receipts and typed absence accepted and consumable | provider-exchange-and-execution | accepted dependency plus crossed-receipt fixtures | |
| D3 | Support and Review replace their ad-hoc joins with the branded compiler | phase-source-composition | implementation receipt naming both actual call sites | |
| D4 | Bot policy consumes only explicitly declared source slots | bot-policy | operation-level integration fixture | |
| D5 | Longitudinal publication carries source-specific observations and opportunities | longitudinal-store | exact storage/publication receipt | |
| D6 | Any advanced-inspector presentation is owned downstream and never serializes the private view | module-registration + evidence-presentation | exact component binding or explicit honest-empty state | |
| D7 | Fresh independent buildability review after D1/D2 | codex | review record with findings closed or routed | |

## Open questions

None for the owner. UI wording, module eligibility, Review ranking, bot weights, style axes and
Campaign meaning are deliberately owned by their consumer RFCs. Exact dependency type spelling and
operation paths must be refreshed during buildability review; those are author obligations, not
product choices.

## Changelog

- 2026-09-04: fresh independent review returned implementation on [[D2636]]–[[D2642]]; records the
  exact subject/path/tablebase/presentation authorities and replaces one circular corpus invariant.
- 2026-09-04: bounded author repair closes [[D2636]]–[[D2642]] at contract tier; no production or
  registered-resource bytes changed and another independent review remains required.
- 2026-09-01: created from [[D2485]] and the complete 804-position/100-path source-composition
  reading; records [[D2487]] as an explicit technique-withholding boundary.
