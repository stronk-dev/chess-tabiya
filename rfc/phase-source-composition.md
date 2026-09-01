# RFC: Source-retaining phase composition

- **Status:** draft — first author pass 2026-09-01 on [[D2485]]/[[D2487]]; dependency acceptance
  and fresh independent buildability review required before implementation
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
  `rfc/provider-exchange-and-execution.md` for recorded/live tablebase receipts; draft
  `rfc/semantic-convention-provenance.md` for convention closure
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

`apps/server/src/phase-source-composition.ts` is the sole production composer. It accepts
value-authorized `DeclaredEvidence` items or typed absence/availability results emitted by the
named source operations. It never accepts a caller-written source payload, phase label, opening
name, endgame type, tablebase category, confidence, relevance or advice.

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
  readonly opening: {
    readonly currentEndpoint: SourceResult<CurrentOpeningEndpoint>;
    readonly catalogueMembership: SourceResult<OpeningCatalogueMembership>;
  };
  readonly rulesPhase: SourceResult<PhaseBandReadingV2>;
  readonly rulesEndgame: SourceResult<EndgameClassification>;
  readonly tablebase: {
    readonly domain: { readonly kind: "inside" | "outside"; readonly pieceCount: number };
    readonly recorded: TablebaseRecordedSlot;
    readonly live: TablebaseLiveSlot;
  };
}
```

This is explanatory TypeScript, not a second exported protocol. The implementation uses the exact
dependency types and preserves their declared evidence wrappers/receipts.

`SourceResult<T>` preserves the dependency's complete success, exact absence and source-abstention
arms. The composer does not replace those arms with `T | null`, a Boolean, a generic string or an
aggregate availability flag. A local source remains available when another source abstains.

#### 2.1 Exact-position join

The recorded position is the join key. The compiler canonicalizes its full six-field FEN once and
requires every position-bound successful input and receipt to bind that same FEN. It also requires
the recorded `nodeId` and `ply`; transposition-key equality alone cannot cross two run occurrences.
A tablebase record for the same board with different side-to-move, castling, en-passant or clock
fields is not the same source input and fails.

The opening endpoint and membership results come from one lookup operation and one catalogue
identity. A matched endpoint without membership, two different catalogue digests, or two different
observed plies fail. If the catalogue is unavailable, both slots retain the same exact typed source
reason; the rules slots still compile.

`rules.phase.reading@2` must bind the exact FEN and retain its five-arm D2484 decision. The composer
does not translate margin into probability or uncertainty. `rules.endgame.classification@1` is
`not_applicable` exactly when the phase convention is not in its declared endgame applicability
arm; within that arm, typed and untyped are both honest outputs.

#### 2.2 Tablebase slots

Tablebase state is three fields, not one nullable result:

```ts
type TablebaseRecordedSlot =
  | { readonly kind: "recorded"; readonly item: DeclaredEvidence<TablebaseReading> }
  | { readonly kind: "not_recorded"; readonly snapshotDigest: string };

type TablebaseLiveSlot =
  | { readonly kind: "not_requested" }
  | { readonly kind: "available"; readonly item: DeclaredEvidence<TablebaseResult> }
  | { readonly kind: "unavailable"; readonly receipt: ProviderAbsenceReceipt };
```

`domain` is locally computed from the exact FEN under the provider contract's declared Syzygy
piece-count rule. Outside domain forces `recorded:not_recorded` and `live:not_requested` or an exact
`outside_tablebase_domain` receipt; it never becomes `provider_unavailable`. Inside-domain recorded
absence requires the queried recorded-evidence snapshot digest. It is not evidence that the
position is a draw, unknown or unimportant.

Recorded and live success remain side by side. The compiler never silently prefers live over
recorded, recorded over live, or success over a second source's failure. It performs no provider
request. Only the caller's declared workflow may request one, after which a second compilation can
carry the resulting receipt.

#### 2.3 Forbidden aggregate fields

The point type and runtime value have no top-level `phase`, `stage`, `inBook`, `opening`,
`endgameTechnique`, `confidence`, `priority`, `rank`, `significance`, `relevance`, `hint`, `advice`
or selected-source field. `opening` above is a namespace containing two attributed source slots,
not a phase label. A property-name guard fails the build if a forbidden aggregate appears at the
point or arc root.

### 3. Ordered arc

`compilePhaseArc(path, inputs)` accepts one explicit root-to-leaf run path. The path supplies the
ordered node identities; the compiler never sorts a branch union by ply and never infers a path
from FENs. It produces one branded point per path occurrence and retains repeated positions as
distinct nodes.

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
`theory.endgame.technique_candidate@1` enters only with cited exact geometry/applicability under
`evidence-value-authority.md`; the composer may then add it as another independent source slot,
never fold it into the rules material class.

### 5. Production handoffs

Unit: one consuming operation family. Total: **5**. The author and implementation receipts are
set-equal to these rows; mentioning a file or projection without calling the compiled view does not
count.

| consumer family | operation boundary | admitted view | explicit refusal |
|---|---|---|---|
| Support module assembly | current-position evidence assembly before module reducers | one `PhaseSourcePoint` | no history, raw dump, automatic hint or source precedence |
| Review evidence compiler | exact selected run/branch-path compilation | one ordered `PhaseArc` | no branch union sorted by ply and no canonical phase transition |
| bot policy | policy input construction | current point; policy profile names every slot it reads | no generic `phase` feature and no implicit move weight |
| longitudinal store | source-observation/opportunity publication | source-specific point/change observations | no single phase habit, style label or denominator-free rate |
| advanced inspector | explicitly opened diagnostic inventory | attributed current slots and typed absence | no ordinary Play card and no unlabelled evidence sentence |

The Support and Review operations are mandatory implementation call sites, not future prose
handoffs. This RFC cannot move to implemented with an unused compiler. Bot, longitudinal and
inspector integration may be held as named discharges if their owning RFC is not yet accepted, but
the source types and negative fixtures must already be consumable without adapters.

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
- `PHASE_SOURCE_TABLEBASE_DOMAIN` — recorded/live result contradicts exact local domain/FEN; and
- `PHASE_SOURCE_PATH_INVALID` — unordered, duplicate-node or non-ancestral arc input.

These failures are bugs or corrupt inputs. They are never rendered to a learner as “no evidence.”
Typed dependency abstentions and provider receipts remain ordinary source states.

### 7. Implementation order

1. Accept the value-authority, convention-provenance and provider-receipt dependencies with the
   exact types consumed here.
2. Land the private branded point compiler and its crossed-source negative fixtures.
3. Land the ordered path compiler, reversible source-local changes and corpus compatibility gate.
4. Replace Support and Review ad-hoc phase/opening/endgame joins with the compiled operations.
5. Add the typed bot/longitudinal/inspector handoffs without adding policy or presentation.
6. Run software, content, browser, packaging and CI-parity gates; update canonical docs and close
   the ledger/log in the archival commit.

No intermediate commit may expose an aggregate phase field, render source-change prose, retain
legacy technique candidates or leave both an ad-hoc and compiled join live at one call site.

## Deviations from design

None in intent. This RFC qualifies B10's “attributed phase classification” wording: individual
producers exist, but their reusable source-retaining composition does not. It preserves the
design's evidence planes and module/preset separation.

## Acceptance criteria

1. `make phase-source-composition-census` reproduces 50 packs, 804 positions, 100 paths, 1,069
   path-position occurrences and the committed result digest; all four impossible joins remain
   zero.
2. Source reach reproduces 132 exact endpoints, 204 memberships, 153/122/233/296 rules
   opening/unclear/middlegame/endgame, 109 typed endgames, 187 untyped endgames, 241 recorded
   tablebase positions and 563 outside-domain positions.
3. Opening membership × rules phase reproduces member 104 opening / 70 unclear / 30 middlegame;
   no precedence or merged-stage field enters the type or runtime result.
4. The 100-path receipt reproduces 49 membership exits and 14 re-entries. A synthetic
   member→absent→member path retains all three points and both changes; no sticky label survives.
5. A source-unavailable opening fixture retains two exact opening abstentions while rules phase and
   local endgame applicability remain available.
6. Same-transposition/different-full-FEN, same-FEN/different-node occurrence, crossed catalogue
   digest and crossed tablebase receipt fixtures fail before a view is branded.
7. Inside-domain recorded absence, provider not requested, provider unavailable, outside-domain
   and recorded/live successes remain distinct arms. A provider request is never triggered by the
   composer.
8. The D2484 five-arm rules result is retained byte-for-byte as a declared input; the composer
   cannot accept or derive a probability, accuracy estimate or move-distance claim.
9. Endgame applicability is set-equal to the declared rules-phase arm. Typed and untyped endgames
   compile; an applicability contradiction fails.
10. Across all 31 measured KRPvKR positions the point and arc contain zero Lucena/Philidor/Vancura
    fields or bytes. A material-only technique fixture fails the production boundary.
11. Point and arc roots contain none of §2.3's forbidden aggregate fields. A fixture adding each
    property fails independently.
12. Forged structural clones, JSON round trips and double assertions fail the runtime brand check.
13. The five-row production-handoff table is set-equal to a checked receipt. Support and Review
    invoke the compiled operation; a symbol/file-only census does not pass.
14. Support receives only the current point. Review receives only its requested exact path. Bot
    policy fails if a profile reads a slot it did not declare. Longitudinal publication fails
    without source-specific opportunity identity.
15. No ordinary learner renderer, module rank, preset, bot weight, style label, campaign reward,
    pack content or LLM prompt changes under this RFC.
16. The advanced inspector labels every shown slot by source and exact availability; the default
    Play composition contains no new inspector row or raw source list.
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
| D6 | Advanced inspector exposes attributed slots without widening ordinary Play | module-registration | composed browser fixture | |
| D7 | Fresh independent buildability review after D1/D2 | codex | review record with findings closed or routed | |

## Open questions

None for the owner. UI wording, module eligibility, Review ranking, bot weights, style axes and
Campaign meaning are deliberately owned by their consumer RFCs. Exact dependency type spelling and
operation paths must be refreshed during buildability review; those are author obligations, not
product choices.

## Changelog

- 2026-09-01: created from [[D2485]] and the complete 804-position/100-path source-composition
  reading; records [[D2487]] as an explicit technique-withholding boundary.
