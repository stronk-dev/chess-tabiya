# RFC: Evidence value authority — compute, derive or project before sealing

- **Status:** awaiting D2 — implemented 2026-09-24 (dependency-qualified; D2–D5 stay open, so not `implemented`; D1 discharged the same day by semantic-convention-provenance) — the value
  receipt, single mint, central invoker, all 210 factories and the permanent
  `make evidence-value-authority` gate ship; the parts that need the still-draft
  semantic-convention-provenance (D1), provider-exchange-and-execution (D2) and registered
  authored provenance fail closed or carry an explicit `pending` dependency, listed in
  `planning/evidence-value-authority/implementation-2026-09-24.md`. Previously: draft —
  author-amended 2026-09-01 through [[D2497]], [[D2496]], [[D2495]], [[D2484]], [[D2327]] and the
  D2146 callable-operation closure
- **Author:** codex (agent), for Marco
- **Created:** 2026-08-30
- **Draft amendment 2026-10-15 — D3768/D3841/D3846/D3847/D3850, §§2.3a–2.3f:** explicit recorded Inspector source and
  dependent projection successors. This is unaccepted authoring, not implementation authority
  from the parent's awaiting state. D3845 independently holds rank's variable/empty input contract.
- **Design refs:** `design/03-product-breadth.md` evidence architecture;
  `design/04-content-architecture.md` grounded predicates; `design/05-in-run-experience.md` §3
  evidence ceilings and §3-forms
- **Exploration gate:** [[D2144]] and [[D2145]], answered by
  `design/research/evidence-seal-value-authority.md` and
  `design/research/evidence-grounding-taxonomy.md`; [[D2484]], answered by
  `design/research/phase-band-and-abstention-contract.md`; [[D2495]], answered for the static
  setup arm by `design/research/endgame-technique-applicability.md`; [[D2496]], answered for
  observed method stages and reachability semantics by
  `design/research/endgame-method-and-reachability.md`; [[D2497]], answered for scoped proof and
  incomplete-frontier semantics by `design/research/endgame-setup-reachability.md`; executable population in
  `tools/d2144-evidence-seal-audit/`
- **Depends on:** implemented `rfc/archive/evidence-contract-manifest.md`; implemented
  `rfc/archive/semantic-evidence-selection.md`; draft `rfc/semantic-convention-register.md` and
  `rfc/semantic-convention-provenance.md` for convention closure; draft
  `rfc/provider-exchange-and-execution.md` for source receipts; draft
  `rfc/semantic-validation-authority.md` for event validation profiles; draft
  `rfc/recorded-semantic-path.md` for exact `run.record.edge@1` path authority
- **Parent / amends:** follow-up to `rfc/archive/evidence-contract-manifest.md` and
  `rfc/archive/semantic-evidence-selection.md`
- **Supersedes / superseded by:** —
- **Planning:** `planning/evidence-value-authority/implementation-2026-09-24.md`

```tabiya-claims
semantic-conventions | members promotion_pressure_geometry_v1 | exact FEN promotion geometry and bounded legal pass/reply checks; no outcome verdict
semantic-conventions | members fork_survival_v2 | nonempty complete legal reply population required for local fork survival; terminal false retains zero real refutations
```

**Claim scope.** The unaccepted D3847 promotion and D3768 fork successors add two literal algorithm
definitions to the existing convention resource; they create no second register. Historical convention members
remain landed under semantic-convention-provenance. Other changes are package-internal operations
and additive F1 refs, with no persisted schema, migration, pack/shape/principle or evidence-kind
member. The one compiled F1 catalogue still owns projection refs; no parent lifecycle state accepts
these proposed successors.

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
- migration/removal of all 192 current mint routes, including the 75 generic adapters and four
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

The same registry module generates package-internal `EvidenceValueRouteInputs` and
`EvidenceValueRouteResults` maps and exports one `invokeEvidenceValueRoute<Route>()` operation from
`packages/runtime/src/internal/evidence-value-routes.ts`. The literal route parameter indexes both
maps, and runtime admission rejects unknown routes, missing/extra input keys and inputs that fail
the selected factory's authority validator before invocation. This is not a generic mint API: it
accepts no projection payload, output, receipt, factory name or caller-selected ancestry, and it is
absent from every barrel and package export. Production operations import this invoker; only the
central registry module imports projection factories. Route/profile/input/result sets are equal,
so a metadata-only registry, uncallable factory, second dispatcher, direct consumer-to-factory
edge or crossed route/input/result fails the permanent gate.

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

#### 2.3a Draft D3841 recorded Inspector source successors — unaccepted

This subsection is proposed source authoring for module-registration §4.11a, not authority from
this parent's awaiting status. Current provider projections/factories and recorded ledger
readings remain unchanged. These new sources report actual historical records; they do not
retroactively prove a provider exchange, engine bound, model options, chess correctness or
tablebase exactness. No ordinary hint, grade, bot evaluation, skill credit or pack predicate
receives these new recorded-report projections through this amendment.

Register a separate `recorded.inspector@1` producer with `availability:recorded`, `latency:sync`.
Its four packet sources below have `plane:record`, `role:source_record`, `grounding:recorded_run`,
`exactness:measured`, `confidence:reported`, operands `subject,itemDigest,event,authority`, and the
existing source-specific answer image. Packet kind and source label are preserved literally;
the event's label alone cannot promote authority to bounded search or exact tablebase truth.
The canonical event/head/node proves an occurrence, not stronger scientific provenance.

| Exact source projection | Sole proposed factory | Required packet kind | Answer content |
|---|---|---|---|
| `recorded.inspector.eval_packet@1` | `createRecordedInspectorEvalPacketV1Evidence` | `eval` | evaluation |
| `recorded.inspector.wdl_packet@1` | `createRecordedInspectorWdlPacketV1Evidence` | `wdl` | evaluation |
| `recorded.inspector.pv_packet@1` | `createRecordedInspectorPvPacketV1Evidence` | `bestline` | move, principal_variation |
| `recorded.inspector.tablebase_packet@1` | `createRecordedInspectorTablebasePacketV1Evidence` | `tablebase` | fact, evaluation |

Each factory takes exactly `{resolved:ResolvedRunSubject,itemDigest:RunEvidenceItemDigest}`.
Require the existing runtime seal and `run_node` subject. Use `resolveRunEvidenceItem` to resolve
the complete attachment at that exact head, then require `event.data.nodeId === subject.nodeId`,
the fixed factory kind, and a source other than `human_model_predicted`, matching the predecessor's
packet admission without claiming its label is independently verified. The payload is exactly
`{subject,itemDigest,event,authority:"recorded_report_only"}`; event is the complete frozen stored
attachment, including seq/time/node/refs/payload. The receipt binds this actual event and subject
through the existing run subject/item digest domains. Bare packets, copied subjects, another head,
same-FEN different nodes, omitted/altered envelopes and crossed kinds refuse before minting.
An inherited identical node may legitimately expose its same attachment on another granted path.
Enumerate all matching occurrences in event order; duplicate payload bytes at different seqs are
different observations and must not collapse. The query service owns current access/disclosure
and rechecks around work; the pure resolved-subject seal is not an access token.

No matching event is `unavailable/source_absent`, not a newly scheduled analysis or a successful
zero eval. An existing malformed/crossed event is `failed/source_contract_invalid`. A successful
packet may contain missing/uninterpretable optional fields: retain the packet and use the fixed
registered field renderer's explicit missing/uninterpretable state; never fabricate zero, frame,
engine/model identity, bound, category or distance. Current-source origin is not inferred from
the selected board's material or a present-day engine. Historical raw values/receipts remain
server-internal; only exact typed renderer operands cross the presentation wire.

Add two fixed derived views, not a caller-selected JSON path:

| Projection | Sole factory | Literal inputs | Retained reported fields |
|---|---|---|---|
| `derived.inspector.tablebase_category@1` | `createDerivedInspectorTablebaseCategoryV1Evidence` | [`recorded.inspector.tablebase_packet@1`] | complete record plus category |
| `derived.inspector.tablebase_distance@1` | `createDerivedInspectorTablebaseDistanceV1Evidence` | [`recorded.inspector.tablebase_packet@1`] | complete record plus category, dtz, preciseDtz and dtm where recorded |

Their sole input arm is `{record:<exact sealed packet source>}`. Each output field is the closed
`{kind:"reported",value:T} | {kind:"not_recorded"} | {kind:"uninterpretable"}`: category's T is
the existing closed Syzygy category vocabulary, distance T is a signed safe integer or null.
An unknown category is uninterpretable, not a substituted draw. Null and absent remain distinct;
do not take absolute values or infer optimality. Retain the full sealed record as a literal input;
grounding remains recorded_run/measured/reported. These states describe fields of a successfully
recorded packet, not failed acquisition or chess absence. Add fixed registered renderers and exact
consumer pairs before delivery; no raw JSON or provider-brand/accuracy claim enters learner text.

The historical selection source is separately `recorded.inspector.maia_selection@1`, sole factory
`createRecordedInspectorMaiaSelectionV1Evidence`, same recorded producer/latency/grounding/status,
answer image candidate_moves. Its exact arm is `{resolved:ResolvedRunSubject,eventSeq:number}`.
Require a positive safe-integer seq within the sealed head, the actual `opponent.move_selected`
event, exact selected parent node **and branch**, `policyModeApplied:human_common`, and an actual
recorded candidate array. Return exactly
`{subject,event,requestedTargetElo,authority:"recorded_report_only"}`, where requestedTargetElo
is the selected sealed head's stored `run.opponentPolicy.targetElo` or null, preserving the old
marker's requested-context operand. It is not the applied band, a player rating or proof of what
an older task honored. Retain that exact stored context in the input receipt. Also
retain the full frozen selection event, not marker masses or the latest sibling selection.
Bind its event seq/image in the existing factory input receipt plus exact subject; do not invent
a new persisted digest domain. Missing candidate array is source absence; an existing empty array
is successfully recorded empty data. Optional mass/cp/WDL/offWindow fields stay optional and
unaltered. The terminal selected move is not evidence that every candidate was played, and this
record proves neither honored requested band nor calibrated playing strength.

The source is internal to the historical pivotal derivation, not an extra live distribution
topic. `derived.pivotal.human_divergence@2`, sole proposed
`createDerivedPivotalHumanDivergenceV2Evidence`, has literal inputs
[`recorded.inspector.maia_selection@1`,`run.record.position@1`] per emitted marker. Its sole exact
arm is `{recordedPivotal:RecordedPivotalSource}` under module-registration's scoped source owner,
requiring the genuine current `human_divergence` kind. Caller positions, selection arrays, raw
runs, event objects or extra source operands are refused; `RecordedPosition` payload alone has
no run/head identity and cannot establish this join. The source owner retains the original full
run/current head and separate requested branch/endpoint grant. Enumerate **every** qualifying
selection anchored on the granted prefix, including observations whose event origin is a sibling
branch. For each event, resolve a sealed run_node subject on its actual origin branch and parent
at that same current head, then invoke the new recorded-selection factory with its actual seq.
Validate origin membership separately; never pretend the origin branch is the requested grant.
Create the position through its existing sole factory using only that source-owned original run
and actual parent node, not a caller-supplied sealed position. Retain both actual sealed inputs,
event/origin identity and the requested branch/endpoint in the canonical factory input receipt.
An endpoint/head/run/issuer substitution refuses before preparation; same node/FEN labels from
a foreign run cannot supply this operation. No source is acquired outside the granted anchor
prefix, but it is a position bound rather than an invented chronological event cut.
Use the existing split convention unchanged: omit offWindow rows; all
remaining masses must exist with positive total; normalize over that reported window, then
require maximum at most0.5 and at least three entries at least0.15. No match returns zero items,
missing source remains unavailable, and an invalid/crossed record refuses. Output retains the
old marker's fields plus its full `selection` and `position` inputs. Both inputs are recorded_run,
so grounding must remain recorded_run (the unchanged split convention is retained separately in
the existing convention receipt), exactness measured/confidence reported. A declared_convention
output over these same-grounding operands would fail the existing widening guard; do not weaken it.
State recorded model-choice spread, not quality, intent,
player rating or strategic significance. The old @1 marker and source remain untouched.

`derived.compare.eval_delta@2`, sole proposed `createDerivedCompareEvalDeltaV2Evidence`, consumes
the ordered repeated inputs [`recorded.inspector.eval_packet@1`,`recorded.inspector.eval_packet@1`].
Its exact arm is `{before,after,comparison:RecordedComparisonSource,branchId:string}`. Assert the
same issuer/current source boundary and both complete original paths, then both exact event/head/
node memberships on that granted path. Reconstruct the predecessor's engine_validated-labelled
trail, stable by ply then original event order, before selecting consecutive report pairs; no
same-FEN merge, later observation, guessed peer or caller trail. Require literal safe-integer cp
values at both ends and the unchanged `STORY_PIVOT_CP` threshold. Mate/uninterpretable entries
cannot become cp. Emit `{before,after,delta,plyOffset,frame:"recorded_cp_numbers",
comparability:"provider_not_established"}`; retain both occurrences in that order. No qualifying
pair is successful no_witness, while missing/crossed source is not. It reports the difference of
stored numbers under the existing comparison convention, not a validated same-engine/bound
evaluation change or move grade. Grounding recorded_run, exactness measured/confidence reported,
answer evaluation. The new renderer must say recorded numerical difference and disclose unverified
provider comparability. The old @1 computation/meaning and existing Compare doors remain.

Source job provenance and historical observations are separate named paths. A required modern
delivery that is corrupt/missing must refuse under its owner contract, not fall back to these
weaker recorded views. Conversely an explicitly requested recorded view reports its history
without acquiring a new provider or reconstructing a transcript. The durable Stockfish draft owns
modern job retention and joins; it does not authorize promoting old packets through this section.

Acceptance requires actual typed factory/receipt cases, malformed and substituted inputs,
repeated-identical payload occurrences, empty/missing/uninterpretable fields, exact registered
components and authenticated/native delivery. `recorded-origin.ts`'s pure historical membership
controls are feasibility evidence only: they establish none of those new F2 mints or access joins.
Story rank's dependent successor is separately held on D3845's variable/empty input contract;
do not hide that hole behind a computed local leaf or fabricate absent source witnesses.

#### 2.3b Draft D3846 pivotal fixed-tuple successors — unaccepted

The scoped Inspector source audit measures a separate pre-existing fixed-tuple mismatch:
phase_change@1's factory retains four operands and option_collapse@1 retains six, whereas each
declares two. These sources need explicit successors; a collection grammar for rank cannot
silently make their existing fixed declarations optional or erase witness multiplicity.

| Projection | Sole proposed factory | Literal ordered inputs |
|---|---|---|
| `derived.pivotal.phase_change@2` | `createDerivedPivotalPhaseChangeV2Evidence` | [`rules.phase.reading@2`, `run.record.position@1`, `rules.phase.reading@2`, `run.record.position@1`] |
| `derived.pivotal.option_collapse@2` | `createDerivedPivotalOptionCollapseV2Evidence` | [`rules.mobility.reading.legal_moves@1`, `run.record.position@1`, `rules.mobility.reading.legal_moves@1`, `run.record.position@1`, `rules.mobility.reading.legal_moves@1`, `run.record.position@1`] |

Each has only `{recordedPivotal:RecordedPivotalSource}` under module-registration's proposed
owner and requires its exact current kind. The source owns the original full run, current head
and granted prefix, after full original graph/FEN validation. Invoke the existing pure family
operation only on that granted prefix, then internally invoke the exact reading/position
factories on the original witnessed nodes. No caller run, array, marker, reading, position or
changed header is an additional arm. Runtime source identity/current-boundary checks precede
preparation. The pure source is not a substitute for current server permission or disclosure.

Phase input order is previous definite phase reading/its position, then new definite reading/its
position. The prior definite witness can precede intervening unclear nodes. Both positions and
their actual readings must agree with the unchanged marker's from/to/anchor; no anchor-only join.
Collapse order is prior same-side legal reading/position, first-low reading/position, confirming
next same-side reading/position. All three complete readings must agree with old counts and the
actual ordered same-side nodes; the marker stays at first-low. A prefix without the next witness
has no marker even if a later confirming node exists elsewhere in the unchanged stored graph.

Preserve old ordered marker payloads, thresholds, convention receipts/meaning, role reading,
plane derived, grounding declared_convention, exactness convention, confidence not_applicable,
fact-only answer image and existing timeline_marker/sentence/panel forms. Successful no_witness
means no complete qualifying witness in this permitted prefix; invalid/crossed source fails and
withheld source remains withheld. Never claim full-branch absence or chess significance.

The new receipt binds actual source kind/issuer, original run/current head, requested branch/
endpoint, ordered witness nodes/readings and every literal input occurrence. Equal position
payloads do not erase source/head identity. Preserve old @1 declarations, whole-tip factories,
outputs and receipts byte-for-byte; new @2 scoped references are an explicit caller migration,
not an additional @1 arm or retrospective receipt correction. Module-registration's successor
Inspector and Review moment source must use @2; all old callers remain on their exact versions
until separately migrated. No pack truth or ordinary module gets this new binding implicitly.

Acceptance requires actual nominal source/factory/invoker and registered consumer/presentation
pairs, ordered4/6-input receipts, before/anchor/confirming substitutions and missing/repeated/
reordered witness refusals, intervening-unclear phase and missing-later-collapse controls, full-tip
payload equivalence, source mutation isolation, current access/cancellation/receiver/native proof.
The disposable probe measures old factory operands and prospective declaration feasibility only.
This subsection changes neither current production nor the parent's awaiting status; it requires
independent upstream and joint Inspector acceptance. D3845's collection contract remains separate.

#### 2.3c Draft D3847 material/promotion source reconciliation — unaccepted

The existing factories are not all variable collections. The material recipe reconstructs 48
signature payloads and 22 complete events from genuine count/cause inputs; seven bad count/FEN
and 21 wrong-edge cause controls refuse. Both en passant captures and four quiet/castling empty
cases pass. Promotion pressure actually computes from FEN. These bounded results establish
authoring feasibility, not new production factories, qualified detectors or Inspector acceptance.
Keep the old refs, factories, receipts, public helpers and every old caller unchanged.

| Proposed exact ref | Sole proposed factory | Authority arm | Literal sealed inputs |
|---|---|---|---|
| `derived.material.reading.role_signature@2` | `createDerivedMaterialReadingRoleSignatureV2Evidence` | `{fen:string}` | ten `rules.structural.reading.piece_count@1` occurrences, in the slot order below |
| `derived.material.event.role_asymmetry@2` | `createDerivedMaterialEventRoleAsymmetryV2Evidence` | `{beforeFen:string,moveUci:string,afterFen:string}` | `[signature@2,signature@2,capture@1]`, `[signature@2,signature@2,promotion@1]` or `[signature@2,signature@2,capture@1,promotion@1]`; full namespaces below |
| `rules.tactic.reading.promotion_pressure@1` | `createRulesTacticReadingPromotionPressureV1Evidence` | `{fen:string}` | none: direct computed FEN reading under existing `rules.tactic` |

**Material signature.** This is an explicitly self-sourcing derived factory, not a caller-payload
adapter. Capture/validate the one FEN input and canonicalize it before acquisition. Obtain the
complete existing piece-count population once. Select exactly White P/N/B/R/Q then Black P/N/B/R/Q,
including zero counts and excluding both kings. The fixed derivation member contains ten repeated
exact refs, not one ref standing for an arbitrary population. Every slot is the genuine named
piece-count factory's value for that exact canonical FEN, with its matching color/role. Do not join
by equal counts or payload digests: current count payloads have no FEN and can be equal across
distinct positions. Reuse the private F2 factory/input-authority receipt to establish this join;
add no public digest, schema, caller receipt or second source authority.

The package-internal pure reconstruction consumes those ten admitted payloads and no board-derived
replacement counts. Preserve all existing `MaterialRoleSignatureReading` fields: canonical FEN,
`material-role-signature@1`, per-color counts in P/N/B/R/Q key order, complete original observation
values in their existing canonical source-array order, absolute role differences and their
unweighted sum. Do not invoke the old FEN signature calculator and merely attach unused sealed
counts afterward. Retain all ten actual occurrences in receipt order. Missing, extra, duplicated,
king, wrong-role/order, foreign-FEN or wrong-factory counts are internal contract failures, not
empty signatures. A legal kings-only position still has ten zero non-king count inputs.

The new projection remains derived/reading, position_rules/exact/not_applicable, fact-only and
local/sync with the old forms/limitations. Bind the existing direct material-role-signature
convention and every actual count input closure. F1 fixed-input guards remain unchanged. The
existing old reading's zero-input receipt is not reinterpreted or reissued as this new lineage.

**Material event.** Validate/canonicalize the exact legal edge before source work. The factory
owns the complete existing `rules.transition.event.capture@1` and `rules.transition.event.promotion@1`
populations for that edge, including successful empties; use their shared source/cache rather than
full local-semantic fan-out. A caller cannot supply an event list or choose a derivation member.
Neither family may emit more than one value for one legal edge. If both are empty, return the
successful empty event population, never a fabricated no-change fact. Otherwise construct the
before and after signature@2 values for their own exact FENs, then use only their admitted payloads
and those actual cause values to compute the event. The three exact members above use full ids
`derived.material.reading.role_signature@2`, `rules.transition.event.capture@1` and
`rules.transition.event.promotion@1`; signatures are before then after, causes capture then promotion.
An incomplete cause list on capture-promotion is not another admitted arm.

Retain every existing event operand, including the complete before/after vectors, changedRoles and
the boolean `increased = after.magnitude > before.magnitude`. Emit all role-vector changes, not
only rising magnitude: D3850's four rises/ten falls/eight unchanged-magnitude changes are preservation
controls. `sourceEvents` projects only the existing capture or promotion fact fields from those
sealed sources, excluding their three edge-envelope fields; use closed per-family projection,
not an arbitrary object/path renderer. Edge envelopes and private source authority must match
the exact validated edge. Never recompute the old FEN event and attach unrelated unused witnesses.
The result stays the existing event item population with its actual literal input list; new
semantic-event, invoker, execution, consumer and rendering registrations must agree before use.
Keep position_rules/exact/not_applicable, fact-only/state semantics, direct/inherited material
convention and old forms/limitations. No increase flag is a scalar material advantage or advice.

**Promotion reading.** This source belongs to the existing rules.tactic local/sync producer and
is a computed rules-plane reading, not an empty derived tuple. It invokes the existing
`promotionPressureReading` once on its captured canonical FEN and retains its complete existing
`{fen,pawns}` payload. Preserve passed-pawn identities, geometric distance/path, blockers,
pseudo-controls and both typed availability fields, with their current ordering and nested
reasons. Invalid turn clone remains unavailable for that pawn; zero legal replies makes
replyPersistence false rather than a vacuous universal; an empty pawn list is successful empty
data, not provider absence or a global safety claim. No source predicate results or caller
`inputsAvailable` override are accepted. This does not change the old pure helper's separate arm.

The claimed `promotion_pressure_geometry_v1` adds `promotion-pressure-geometry@1` to the one
existing convention registry. Its literal definition is: select passed pawns belonging to the
side opposite the current side to move; report the forward path through the promotion square,
its occupied blockers and both colors' pseudo-attackers of that square. For pass availability,
set that pawn's color to move and clear en passant; return invalid_turn_clone when chessops refuses
the clone, otherwise whether that pawn has a legal promotion now. For reply persistence, require
at least one current legal reply and, after every such reply, the same source-square pawn/color
still exists and has a legal promotion on its next turn. No replies gives false. Define promotion
as a legal pawn move to the final rank, not a chosen promotion piece or a tablebase outcome.
Its limitations forbid outcome, arbitrary-future inevitability, safety, importance, intent,
recommendation or move-quality claims. Bind this direct convention to the new projection with
source-reviewed reviewed_text disclosure, not the initial-migration-only definition_and_limitations
arm (D3854). Its exact fields are:

```json
{
  "kind": "reviewed_text",
  "summary": "Passed-pawn geometry and legal promotion availability, including the declared pass-clone and immediate-reply tests.",
  "detail": "Select passed pawns belonging to the side opposite the current side to move; report the forward path through the promotion square, its occupied blockers and both colors' pseudo-attackers of that square. For pass availability, set that pawn's color to move and clear en passant; return invalid_turn_clone when chessops refuses the clone, otherwise whether that pawn has a legal promotion now. For reply persistence, require at least one current legal reply and, after every such reply, the same source-square pawn/color still exists and has a legal promotion on its next turn. No replies gives false. Promotion means a legal pawn move to the final rank, not a chosen promotion piece or a tablebase outcome. No outcome, arbitrary-future inevitability, safety, importance, intent, recommendation or move-quality claim follows."
}
```

No new teaching interpretation is authorized. The existing operation at5542cc2d is the landed-code
authority witness; do not label the proposed projection itself landed. Preserve primary
position_rules/exact/not_applicable and fact-only old forms; convention identity is an additional
axis, not a fabricated ancestry from the old three predicate declarations.

**Adoption and proof.** The proposed Inspector image explicitly replaces these three old topics;
other modules, hints, bots, semantic cases and pack requirements remain on their existing exact
versions until separately specified migrations. No implicit prefix alias or source retirement.
Before adoption require actual sole-factory/invoker/manifest/type-profile/semantic/convention
registrations; complete payload/empty equivalence; genuine ten-input receipts, all three event
members, same-payload/foreign-FEN and wrong-edge cause refusals, both-color en passant victim
identity and quiet/castling successful empties; source/caller mutation isolation;
zero work before authority validation; unchanged old callers/receipts; exact registered renderer
and consumer pairs, plus current authorization/disclosure/cancellation and HTTP/native delivery.
The disposable recipe and metadata compilation establish none of these new runtime boundaries.
Independent upstream and joint review remain mandatory; D3847's other classes and D3845 grammar
are not discharged by these three proposals.

#### 2.3d Draft D3847 selection populations — domain schemas authored, reduction held

The measured structural/Story selections need complete population authority, not merely positive
witnesses. The existing comparison instrument reconstructs 17 actual family populations at 44
FENs and 126 column reads, including closed named-structure@2 conversion and 392 empty family
results. A controlled later peer extension removes ten facts from an unchanged earlier requested
node; genuine reappearance also occurs. The source must preserve both granted path populations,
each requested predecessor and original occurrence/order, including successful empty families.
A displayed observation, one reading at each endpoint, a list of only changed nodes or an opaque
source handle does not establish those negative tests. Record raw named-structure inputs as well
as the exact legacy observation projection; do not silently interchange their payload shapes.

**Structural population schema — unaccepted.** The source owner first constructs the genuine
RecordedComparisonSource under module-registration §4.11a, with its already specified complete
original-path/FEN validation, independent snapshot and exact primary/peer grants. Proposed
collectComparisonStructuralPopulation takes exactly `{comparison:RecordedComparisonSource}`;
it is runtime-internal, not a client/source-data API or a new evidence projection. Its result is
nominal and runtime-owned, with an independent immutable data reader accessible only to the
comparison/reduction owners. A symbol property alone does not authenticate it. Copies, arbitrary
caller row arrays and a genuine population from another comparison cannot substitute. The
subsequent source factory must bind the **complete data image** below, not merely this brand.

The closed data image has only comparison and columns. Comparison is the actual admitted
source, not a copied BranchComparison summary. Columns is an ordered two-tuple, primary then
peer, each exactly `{branchId,throughNodeId,nodes}` matching the captured grant. Nodes contains
every original path occurrence from the common fork **inclusive** through that column's exact
endpoint, in path order. Earlier nodes remain in the original validation/scope image but need
no unused structural witness. Each node row is exactly `{pathIndex,position,families}`:

- pathIndex is its original zero-based index in that granted root-to-endpoint path, not a
  filtered observation index. The row's position is the original sealed run.record.position@1
  made by its sole factory from that source-owned run/node. Original creating branch and the
  requested column remain distinct in the source. Equal FENs at distinct nodes/occurrences
  are not interchangeable; a shared fork may legitimately occur in both column rows.
- families has exactly the following17 rows, in this order, never a current/latest wildcard.
  Each is exactly `{projection,items}` with its literal ref and the complete ordered result
  from that family's sole `{fen}` factory at the position's full canonical FEN. The source
  collector itself invokes it and retains the genuine return; it does not accept caller lists.

| rules.structural.reading suffix | Exact version |
|---|---|
| pawn_safe_square | 1 |
| outpost | 1 |
| backward_pawn | 1 |
| isolated_pawn | 1 |
| doubled_pawn | 1 |
| passed_pawn | 1 |
| open_file | 1 |
| half_open_file | 1 |
| line_blockers | 1 |
| direct_attack_count | 1 |
| piece_reach_count | 1 |
| named_structure | 2 |
| bishop_on_shade | 1 |
| king_opposition | 1 |
| piece_count | 1 |
| king_zone | 1 |
| piece_distance | 1 |

items is the original sealed population, including a successful empty array. An absent family,
thrown/failed operation or unexecuted family is not an empty row and fails collection. These
explicit empty result rows are **not sealed absence facts**. Every item must have the exact
ref/factory and private canonical `{fen}` authority of its row. Validate complete row order,
scope/FEN joins and array identity against the source-owned invocations before admitting the
population; validating each positive item alone cannot prove completeness. Do not insert an
extra pawn_count row, drop an empty family, deduplicate equal source payloads or infer completeness
from an emitted count. Local reuse at equal FEN may share immutable factory values, but every
column/node/family occurrence and within-family ordinal remains in the population identity.
No provider is called and no whole-tip structural read is hidden behind the bounded source.

Compute the legacy observation view only through this closed conversion: every family except
named_structure uses the actual StructuralObservation payload unchanged; named_structure@2
maps to exactly `{kind:"named_structure",squares,provenanceNote}` while retaining its full raw
id/name source alongside that view. Sort by the existing STRUCTURAL_FEATURE_KINDS order excluding
pawn_count, then the existing JSON observation key. Comparison identity is the existing
observationIdentity, including pawn_safe_square's intentional kind/color/squares-only identity;
it is not a new full-payload equality rule or teaching interpretation.

The selection first unions all post-fork observations in **each complete granted column**,
then intersects those unions. For the requested branch, walk fork-to-endpoint, comparing each
node's complete view with its immediate predecessor and excluding the common identities.
The fork supplies predecessor context but emits no entry. Retain every newly appearing
observation in existing node/observation order, including reappearance after a genuine gap.
An observation on the peer after the displayed node but inside its grant can suppress an entry;
there is no earliest-positive-only or matched-node crop. Output payload remains the old complete
StructuralObservationChange for each selected occurrence. No new before-value, importance,
significance, named plan or grade is invented. Successful zero differences yields zero items,
not a fabricated negative observation or an unavailable source.

The future reduction receipt must retain the comparison scope, every ordered column/node/family
result row (including successful empties), original sealed items and the closed conversion/selection
identity. Replacing that with only selected positives or a set of source refs is refused. How F1
represents these repeated/empty groups is still the D3845 grammar obligation below; this schema
does not authorize empty fixed members, a generic aggregate leaf or a source-receipt fallback.

Last-level differs from rank and structural difference. Its successor must consume the complete
source-owned **recorded available** point population and actual coverage states, learner side,
path ordering and the eligible recorded-result authority. Both-color actual packets show equal
selected positive lineage with unequal full input authority, and equal last-level selection with
different source-state packets. Current input authority already binds all supplied points; do not
misreport that as no input binding. Later qualifying points change selection. Missing/pending
measurements are not proof of no later qualifying point or complete analysis. Preserve the
recorded_result-only loss gate; board-terminal loss does not invoke this Story family. Retain
successful empty/mate-only results and specify equal-index/duplicate handling against the actual
source owner's point population rather than inventing a new ordering.

**Last-level population schema — unaccepted.** Review §4.5's genuine RecordedReviewBoundary
and independently captured server-owned ReviewSourceContext supply proposed runtime-internal
collectRecordedLastLevelPopulation's sole arm `{boundary,context}`. The boundary's owning
authority validates its current issuer/storage/head/path/import context first; the collection
cannot take an HTTP packet, caller run/result, arbitrary point list or cropped full-tip Story.
Share the existing internal point/adapter preparation without casting a boundary into the old
prefix receipt. It runs no new engine request, promotion search or provider refresh: it projects
only this boundary's actual admitted source context and registered adapter execution.

The immutable nominal population's closed data image is exactly
`{boundary,learnerSide,outcome,rows}`. Retain the complete boundary operand image, not only a
brand, so scope/state changes cannot alias the same selected point. learnerSide and outcome
are derived from that boundary without caller overrides. Outcome retains the existing distinct
unfinished/board_terminal/recorded_result union and its complete recorded fields. In particular,
an imported result is eligible only at its original full endpoint, never by cropping a completed
whole-game source. Current access/disclosure and post-work revalidation stay separate obligations.

Rows has exactly one ordered row for **every** granted root-to-endpoint path node, including
nodes with no point. Each is exactly `{pathIndex,position,slot,provider,state,points}`.
pathIndex is consecutive from zero and position is the actual original run.record.position@1
from this boundary's internal source preparation. Slot is the complete existing ReviewSourcePlanSlot
image `{invocationId,adapterId,family,grain,nodeId,fromNodeId,window}` from the actual boundary
invocation plan: adapterId review.source.eval_point@1, family engine_eval, grain node, the same
original nodeId, fromNodeId:null and the original invocationId/window. It is not a fabricated
reference or selected output ordinal. Provider is the exact captured closed ReviewProviderNodeState
for that node, or null for an actually absent engine-context map entry. Null and an explicit
not_requested entry remain different captured inputs although both fold to not_requested output.
In particular a delivered arm retains its genuine original delivery even if point conversion
fails and state becomes unavailable/input_abstained with points:[]. Do not reconstruct provider
from the folded state or omit rejected deliveries: distinct captured inputs must not alias merely
because both conversions fail. The immutable complete image binds these inputs as well as results.
Every row must occur once in original node order; unknown, duplicated, omitted or reordered
nodes/slots refuse. Context entries outside the granted path do not enter this population.

State uses the existing **closed ReviewAdapterState** without lossy regrouping. Available means
itemCount:1 and points contains exactly that adapter's one genuine derived.review.eval_point@1.
Every other state has points:[] and preserves its actual reason/counters: honest_empty,
not_requested, not_yet_scheduled, pending or unavailable remain distinct. An available state
with zero/two points, a nonavailable state with a point, a changed pending count or a substituted
unavailability reason refuses. These are source result/state rows, not sealed chess absence
facts. Missing context-map entries use only the existing source owner's not_requested rule;
an available value removed by a caller is not missing context or honest_empty.

The source-owned adapter prepares each point from its actual same-snapshot position and genuine
node-free delivery, retaining both sealed inputs. Verify exact ref/factory, private source joins,
canonical FEN, node id/ply, original run/head and boundary occurrence. Equal labels/FENs or a
genuine point from another run/head do not establish this membership. Preserve typed mate and
centipawn scores, engine/bound/frame/availability and original source order without conversion,
clamping or an engine-comparability claim. The source collector owns the complete adapter result;
item seals alone do not prove that a supplied subset is complete. Source/caller mutation after
construction cannot alter state, ordering, points or the underlying scope. Current coordinator
state changes after capture require a new/revalidated source, not mutation of the admitted one.

This owned slot contract has at most one point per unique path index. Do not choose first/last
among duplicated new-source rows: duplicates are a source-contract error. Distinct nodes with
equal FENs remain distinct valid occurrences. The old factory's arbitrary-array arm and its
first-qualifying-point behavior for equal-index inputs remain unchanged for old callers; that
permissiveness is not imported into the new owned population.

Validate the genuine complete population before any eligibility shortcut. For a recorded_result
learner loss only, scan all available points in path order, skip mate points, convert White cp
to the learner's perspective and select the greatest pathIndex with learnerCp >= -100. This is
the existing one-pawn lower threshold, not absolute distance from zero. Preserve the full selected
point's old recordedResult/evaluation payload and recorded node/ply occurrence. Unfinished,
board-terminal, nonloss, all-mate and no-qualifying-point inputs yield zero result items, not a
fake last-level fact or source-unavailable result. A qualifying root point may still be the
primitive's selected point; the existing Story assembler separately excludes root moments because
there is no recorded decision edge. Do not silently merge those two stages.

Every available point and every missing/pending/unavailable/empty slot belongs in the reduction's
ordered population authority, even when its selected output is unchanged. This means complete
collection of the recorded available data, **not** complete analysis of the game. A later pending
or unrequested point must remain visible in the containing Review's progress/degradation; a
last-level result never establishes no later qualifying position. The future reduction receipt
must bind these states and original scope alongside the exact literal item occurrences, not only
the selected point. It adds no longitudinal rebuild, profile judgement or new engine acquisition.

**Reduction and successor hold.** The two domain schemas above are proposed source-owner data
contracts, not a generic CollectionEvidence primitive, new mint, permission or completed derivation.
Before acceptance, author each exact successor's sole factory and callable, empty-result identity,
execution templates versus actual occurrences, source joins,
convention/grounding/answer limits and compatibility with frozen predecessors. D3845's proposed
rank reduction is not automatic authority for these different computations. No new factory name
or generic computed/derived leaf is inferred by this hold; no empty tuple, invented absence value,
unused evidence or runtime held-binding exception is permitted. Structural@1 remains conditional
in D3841's requirements map until this contract is resolved; last-level is a transitive Story
dependency, not an extra Inspector topic. Piece routes separately require complete initial
occupancy plus ordered replay under D3847, but are not added to Inspector's 75 topics.

Evidence: `design/research/module-evidence-assembly.md` §Compare and Story negative-selection
authority; existing comparison/prefix targets and independent read-only review. These are bounded
reconstruction/selection controls, not new source completeness receipts, independent chess
correctness, runtime qualification or upstream/joint acceptance.

Joint acceptance requires actual source-owned construction/receipt and mutation tests, not these
shapes alone: structural omission of any empty/positive row, reordered families/nodes, foreign
equal-FEN inputs, both-column original-FEN failures before cache/work, named conversion loss and
the later-peer/reappearance fixtures; Last-level every source-state arm, missing/duplicate point
slots, foreign equal-node/FEN sources, changed reason/counters, both sides, exact -100 boundary,
typed mate/root behavior and recorded-result-only applicability. The later convention-bound
reduction must preserve those populations and zero-item outcomes without weakening existing
fixed inputs/anyOf guards or borrowing absent families' answer authority. Source/API/native
suppliers and the complete consumer image remain independently gated.

#### 2.3e Draft D3847/D3852 computed strict-overload source — unaccepted

**Replaces the rejected two-sealed-input proposal.** Existing old receipts retain duties/capture,
not the third exchange their declaration names. A proposed derived @2 with those two literal
inputs fails unchanged F1: both are position-grounded while the conventional classifier is not.
The counterfactual position_rules label compiles but is not a truthful-authority ruling. Retain
that failed experiment; do not mint @2, change its primary label for green checks, weaken F1 or
attach an unused exchange/convention witness. This section instead uses F2 §2.1's existing direct
computed-edge category: all authority is reconstructible from one legal board edge. Construction
mode and primary grounding remain separate. This does not authorize computed Story/Compare leaves
over recorded populations, availability or history that cannot be reconstructed from one edge.

| Proposed exact ref | Sole proposed factory | Sole authority arm | Literal sealed inputs |
|---|---|---|---|
| `rules.tactic.predicate.overload_conflict@1` | `createRulesTacticPredicateOverloadConflictV1Evidence` | `{beforeFen,moveUci,afterFen}` | none — computed |

This belongs to existing `rules.tactic@1`, rules plane, local/sync. It is a computed conventional
predicate, not position_rules truth merely because the producer is named rules. Retain
declared_convention/convention/not_applicable, fact-only answer content, old payload fields and
list/panel/machine_condition forms. Its derivation is absent and dependsOn is empty: it accepts
no independent sealed prerequisite. All three `overload-conflict@1`, `defence-duty@1` and
`legal-exchange@1` contributions are **direct**, not inherited from nonexistent input receipts.
Name each literal registered ref in the projection semantics so the existing direct-closure
derivation registers/checks exactly those contributions with definition-and-limitations disclosure.
No convention definition/version, registry or F1 guard changes.

Capture/canonicalize the complete legal edge with the shared validated-edge authority **before
any computation**, including quiet/no-capture paths. Validate actual legal UCI and byte-identical
canonical resulting FEN; malformed/crossed edges are errors, not clear/no_witness/unavailable.
The old pure helper returns clear immediately for absent capture, so calling it before validation
would be incorrect. Obtain capture identity internally from the existing pure transition/capture
operation, including en-passant victim square distinct from landing. Do not accept caller capture,
initial duty reading, exchange, output, status, optional override or arbitrary field. Use pure
internal calculations, not sealed factories whose admitted evidence is consumed then discarded.

Invoke the existing `overloadedDefenderResponseConflict` once from that validated edge and actual
capture fact, with its own initial duty computation. Do not implement a second motif algorithm.
Retain its four clauses: exact sole-defender duties for removed/retained targets; a legal recapture
by that defender; no recapture preserving every retained duty; and, after every recapture, a
positive legal-exchange@1 capture of at least one retained target. Replay each legal recapture
from the actual after-position and use its actual landing occupant, including promoted roles.
Preserve complete legal recaptures, retained targets, positive captures and nested exchange
operands/order. Each exchange starts at the named recapture's actual resulting FEN and captures
that retained target, not the candidate's before-position or an unrelated positive target.
These hypothetical calculations are not recorded opponent play, force, significance or a grade.

Return availability of the existing ordered `OverloadedDefenderConflict` population: available
conflicts if any exist; otherwise unavailable/no_legal_recapture if the current missing-recapture
condition occurred; otherwise available empty. Preserve that precedence across different duty
candidates. No capture is successful empty, not a fake capture/absence receipt. The projection's
abstention reason is no_legal_recapture; it has no sealed-input-abstained arm. The source receipt
binds its exact canonical legal edge and direct conventions, with zero sealed source digests.
Its compiler/execution image has no derivation choices or non-local source requirements.

The proposed successor Inspector replaces only the original strict-overload topic slot with this
exact new ref in local_rules. `prepareInspectorDependentEdgeSource` receives its admitted actual
run.record.edge@1 from the validated original/granted graph and passes only that edge's three
canonical operands to the new factory. Arithmetic authority proves neither recorded occurrence
nor permission; requested/creating branch, selected endpoint, access/disclosure/cancellation
remain the source owner's separate obligations. Register the exact sole route/invoker, type
profile, predicate validation subject, complete consumer/adapter/execution and renderer pairs.
Renderer output preserves the old learner wording/operands under the new ref, not raw packet
prose. Preserve old derived@1/factory/helper/receipts and all old callers; no implicit Hint, Nudge,
bot, pack or validation-subject migration and no retrospective reissue as the new source.

Acceptance requires actual direct factory/receipt/closure and pre-work invalid-edge refusals,
including quiet early-return cases; orthodox/both-color en passant, clear, no-capture,
pinned/no-legal-recapture and promoted-recapturer preservation; each positive exchange's replayed
FEN/target join; complete old/new payload/order/availability equivalence and mixed-candidate
precedence; old caller/receipt preservation and mutation isolation. Require full consumer preflight,
current authorization/disclosure/cancellation, receiver and native delivery proof. The disposable
recipe and metadata compilation prove none of those new production boundaries. Independent
upstream and joint review remain required; fork/D3768, D3851 and D3845 are not discharged here.

#### 2.3f Draft D3768/D3847 nonterminal fork source and coordinated adoption — unaccepted

**Meaning changes under a new identity, never by repairing historical bytes.** The old
derived.tactic.fork_survives_reply@1 and its pure helper/factory remain callable with their old
all-reply meaning, including vacuous terminal true. Their convention declaration/history and
receipts stay unchanged. The declaration's fictitious third exchange is not copied into the
successor. The new source is:

| Exact proposed ref | Sole factory | Exact sole input arm, in receipt order |
|---|---|---|
| `derived.tactic.nonterminal_fork_survival@1` | `createDerivedTacticNonterminalForkSurvivalV1Evidence` | `{doubleAttack,breadth}`: `rules.tactic.event.double_attack@1`, then `rules.tactic.consequence.reply_breadth@1` |

Existing derived.tactic@1 owns this local synchronous predicate. Preserve the complete four-field
ForkSurvivalResult payload, declared_convention/convention/not_applicable, state sign, threat
answer ceiling and machine_condition/list/panel forms. Both dependsOn and derivation.inputs are
exactly the ordered two refs above. There is no separate sealed exchange argument or unused
witness. Reply-specific exchange calculations remain inside the existing algorithm.

The sole factory snapshots its two actual admitted values. Require genuine source seals and
their registered sole factories/exact refs, not caller-branded structures. Reconstruct and
canonicalize the complete legal edge from doubleAttack.beforeFen/moveUci and require the exact
resulting afterFen. Both private input authorities must equal that same complete canonical edge;
equal afterFen or triggeringMove alone is insufficient. No caller FEN/result/receipt override.
Breadth is the registered source's complete ordered legal reply population, not an input slice:
count equals replies.length, replies are distinct exact legal move identities, terminal agrees
with the empty population, and check agrees with the actual after-position. Its sole factory
establishes complete enumeration; do not substitute a caller list or calculate sealed witnesses
only to discard them. Validate source identity and these invariants before any terminal return.

The new pure helper nonterminalForkSurvival uses the unchanged forkSurvivesReply computation for
its actual refutation population/order. Return that full result with
matched = breadth.count > 0 && refutingReplies.length === 0. Checkmate and stalemate are successful
total negatives with the genuine empty refutingReplies, not unavailable, no_witness or a made-up
refuting move. Nonterminal positive/refutable payloads remain byte-equal to their old counterparts.
This means no legal replies, not every other possible draw adjudication. Mate-proof distinctions,
promotion persistence and the double-attack event are unchanged; no global zero-reply policy.

**Convention identity and closure.** The claim above reserves fork-survival@2 (fork_survival_v2).
The definition refers only to the exact algorithm above, including original non-king target/square
identity and its positive legal exchange test; it does not generalize "positive capture" to a
new material or search convention. Literal declaration/disclosure fields are:

```json
{
  "definition": "Local fork survival requires a nonempty complete legal reply population and a surviving positive capture after every reply. Empty replies return false with zero refutations.",
  "limitations": ["One-reply local conventional claim only; no force, inevitability, quality, best move, significance or whole-position assessment."],
  "disclosure": {
    "kind": "reviewed_text",
    "summary": "Local fork survival requires at least one legal reply and a surviving positive capture after each.",
    "detail": "Local fork survival requires a nonempty complete legal reply population and a surviving positive capture after every reply. Empty replies return false with zero refutations. One-reply local conventional claim only; no force, inevitability, quality, best move, significance or whole-position assessment."
  }
}
```

Authority is the implementation of this bounded rule at packages/runtime/src/tactics.ts#nonterminalForkSurvival,
using the existing position_rules/implementation authority arm; this identifies executable
authority, not primary position_rules grounding or a newly discovered chess theorem. Register it
only with that actual implementation and append its declaration/history in the implementing commit.
Do not claim the old landing snapshot established this different meaning or invent an owner ruling.

The new projection's catalogue semantics names fork-survival@2 literally. Its direct closure is
exactly that ref; its input receipts contribute double-attack@1 and legal-exchange@1, so the full
closure is exactly those three refs. The new convention uses the accepted later-source
reviewed_text disclosure above, not the initial-migration-only definition_and_limitations arm.
The two retained input conventions keep their existing disclosures. The fresh base
avoids automatic witnessed predecessor inheritance. No old fork convention token belongs in the
new catalogue semantics/limitations, and no F1/closure relaxation is authorized. Earlier source
APIs and declarations remain present for compatibility; old evidence cannot be relabelled new.

**Complete current-delivery image.** These coordinated companion amendments are required for
acceptance and implementation, not optional follow-up polish:

| Existing current path | Proposed current disposition | Historical disposition |
|---|---|---|
| Candidate population reading.fork_survival | Shared packet §3.1a: compiler2 constructs only the new source for that slot and its genuine same-edge inputs | compiler1 receipts remain original, never admitted as compiler2 or rewritten |
| Guided Hint fork family | Hint-distance §3a: fork-only horizon@2/five disclosures@2, compiler@2 and exact module.guided_hint@2; other six families retain current refs | old horizon/disclosures/compiler receipts/renderer remain readable, no fallback new request to old fork |
| Nudge and Review Map direct fork bindings | module.postcommit_nudge@2 and module.review_map@2 replace only their old fork acceptance with the new ref, under unchanged logical module policy/seat/budgets | all @1 receipts/adapters remain; no duplicate logical modules or controls |
| Full Inspector | existing proposed module.full_inspector@2 replaces this topic with the new ref and same-edge supplier | all75 topic obligations and all old source receipts remain; no retirement |
| Exported candidate_feature_vector@1/opponent.selection@1 path | Explicit legacy-only callable, not a current repaired bot/vector path; no new production caller may select it for this predicate | old API/output remains exact; no unmeasured stored-record rewrite or predicate-history rebuild |

The last row is not a replacement vector contract or permission to retire its accepted obligations.
D3847 still owns its variable literal-input reconciliation before a new vector source or production
adoption. Inventory exact callers and stored occurrences before any later migration. The repository
search found no production caller of the exported server vector wrapper; this does not prove no
external caller, computed alias or stored occurrence exists. A release cannot claim complete repaired
bot evidence from this compatibility row. New paths fail closed on an unexpected old source rather
than silently repackaging it. D3768 is not closed merely by the Inspector replacement.

D3853 is an actual compatibility prerequisite: candidateCollectorIds currently intersects old
vector IDs with the current packet's generated closure, and candidateCollectorResults also calls
the shared candidateChildReadings. Before changing that closure, give the legacy vector its
frozen **exact-ref** compiler1 local collector vocabulary and old child-reading entry point;
retain genuine old result/source order, old pure/factory outputs and full receipts. Do not strip
versions then admit whichever current source shares a base id. Current packet/generator and
Hint use the current vocabulary only; the legacy source never calls that mutable lookup. Preserve
shared pure calculations where their behavior is identical, not a fork of chess algorithms.
Test an old vector fixture that actually has double attack/fork and a child reading, its old
closure with the new current vocabulary present, and refusal of either substituted current ref.
No duplicate source seal, copied old receipt or broadened old manifest declaration is permitted.

**Truthful direct presentation.** Register inspector.nonterminal_fork_survival@1 as a new exact
fact-statement renderer and pair it with the new source for the three direct module successors.
Its closed operands are attacker, targets, matched, terminal, check, replies and answering;
attacker/targets preserve existing placed-piece shapes, the three flags are booleans and the
two counts are nonnegative safe integers. Adapter fields are mechanical copies/counts from the
same admitted payload: answering=refutingReplies.length. No caller text or reply move list.
Require answering<=replies, terminal iff replies===0, matched iff replies>0 && answering===0.
Reject inconsistent envelopes instead of rendering them. Nonterminal output retains both counts
and says either all replies preserve the local attack or how many refute it, qualified by the
declared convention. Terminal output identifies checkmate/stalemate from complete zero replies
and check, and states that reply-survival does not apply; it never says the fork survives all
replies. Old inspector.fork_survives@1 and its exact source pairs remain unchanged. No changes
to automatic significance selection, family precedence, assistance ceilings or generic board marks.

**Falsifiers and closeout.** Require new actual factory/route/receipt/closure controls, both-color
terminal checkmate/stalemate and nonterminal positive/refutable promotion forks; exact old/new
complete nonterminal payload/order preservation; own versus genuine equal-after-FEN crossed
before-position input authorities; bad edge/source/ref/factory/count/terminal/check refusals
before the short circuit; immutable inputs and original old receipts. Test the exact proposed
renderer with consistent terminal/positive/refutable and corrupt envelopes. Test all three packet
scopes, projection narrowing, old/new compiler separation and cache identities. Actual Hint
selection must stop choosing the fork family for terminal children without changing checkmate's
mate selection, the other families, ranks or budgets; every rung must retain its answer ceiling
and exact source/line order. Require complete successor binding/consumer preflight, old read
compatibility, actual authenticated module/Hint HTTP and desktop/phone disclosure/late-response
controls. The exported-vector compatibility restriction must be checked at actual production call
sites; full new vector/longitudinal capability remains separate. Disposable25-test research is
not those new production boundaries. Independent source and joint consumer acceptance still gate
implementation; the parent's awaiting state, a registry claim or a green research probe does not.

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
`rules.phase.reading@2` carries `PhaseBandReadingV2`, declares
`declared_convention/convention`, retains the direct registered phase-band convention identity, and
has a computed factory over FEN. `PhaseBandReadingV2` contains the canonical FEN, the existing
`phase`, per-color non-pawn `material`, per-color `undevelopedMinors`, literal
`conventionId: "phase-bands@1"`, and one `decision` from this closed union:

| `decision.kind` | fixed fields after `kind`, `phase`, `axis`, `observed` |
|---|---|
| `endgame_material_band` | `phase: "endgame"`; `axis: "maximum_non_pawn_material"`; `boundary`; `marginInsideBand` |
| `material_transition_gap` | `phase: "unclear"`; `axis: "maximum_non_pawn_material"`; `endgameBoundary`; `developedBoundary`; `distanceToEndgameBand`; `distanceToDevelopedBand` |
| `opening_development_band` | `phase: "opening"`; `axis: "undeveloped_home_minors"`; `boundary`; `marginInsideBand` |
| `middlegame_development_band` | `phase: "middlegame"`; `axis: "undeveloped_home_minors"`; `boundary`; `marginInsideBand` |
| `development_transition_gap` | `phase: "unclear"`; `axis: "undeveloped_home_minors"`; `middlegameBoundary`; `openingBoundary`; `distanceToMiddlegameBand`; `distanceToOpeningBand` |

The factory computes phase, operands and decision in one operation from FEN. It does not accept a
caller phase, reason, margin, boundary or output payload. Selected-band margins are non-negative
integer operand distances inside the chosen band. Gap distances are positive integer operand
distances to the two adjacent bands. They are never a probability, accuracy estimate, number of
moves to transition, opening identity or provider-availability signal. The direct convention owns
the boundary values; the payload makes the exact values used for this reading inspectable.

Every current consumer migrates atomically. A deterministic renderer may name the selected band or
the exact abstention arm, but it may not translate a zero/one margin into “uncertain” without a
separately calibrated authority. v1 remains readable only for in-process backward compatibility
during the implementation commit and is absent from the final binding set. This is the [[D2484]]
amendment; the 804-position author instrument supplies all five positive arms and the inconsistent
phase falsifier.

[[D1727]] is closed at the position-evidence boundary: `rules.structural.reading.named_structure@1`
is retired from new bindings. Its successor
`rules.structural.reading.named_structure@2` carries exactly `id`, `name` and
`provenanceNote`, declares `declared_convention/convention`, and is computed from FEN through the
registered structure catalogue. The current one-operand declaration is deleted; arbitrary
`provenanceNote` cannot be sealed.

The payload deliberately carries no run node. [[D2372]] therefore belongs to the Campaign consumer:
`campaign-catalogue-progression.md` derives a same-position sighting from this value plus sealed
`run.record.position@1`. This RFC must not widen a reusable position fact with a Campaign subject.

The phase label truth set remains compatible with the current classifier, but its successor payload
is deliberately not byte-compatible: it replaces free prose provenance with registered convention
identity and adds the exact decision arm. The named-structure successor retains its current rich
producer fields. Both version changes record corrected authority and operands rather than silently
rewriting v1.

#### 3.4 Split three multi-authority projections

`rules.endgame.reading@1` is retired from new bindings and replaced by:

- `rules.endgame.classification@1`: product material/phase classification under a registered
  convention, with no technique records; and
- `theory.endgame.setup_match@1`: a positive static setup match computed from a canonical FEN under
  one registered, cited and versioned setup convention. The projection carries `fen`,
  `technique: "lucena" | "philidor" | "vancura"`, the exact convention ref/source citation and
  the convention's closed, technique-specific operand values. The operation returns
  `matched(value) | not_matched({ convention, failedOperandIds }) | unavailable(reason)` and mints
  evidence only for `matched`.

The setup factory accepts `fen` plus the registered setup convention, computes every operand and
the intersection itself, and then seals the positive. It accepts no technique name, boolean,
operand result, tablebase category or caller applicability. The D2495 author population supplies
the three canonical prototypes, colour symmetry, hard negatives and the blocked-rook-ray
falsifier. Its current-corpus result is exactly 4 Lucena / 6 Philidor / 0 Vancura setup matches out
of 31 KRPKR positions; the zero Vancura count is absence of population, not a negative truth set.

`theory.endgame.method_stage@1` is an additive retrospective event derived from:

- one positive `theory.endgame.setup_match@1` input under the same technique convention;
- an exact ordered, contiguous, same-path window of sealed `run.record.edge@1` inputs; and
- one registered, cited and versioned method convention whose stage grammar is closed.

Its payload is `MethodStageV1`: exact `technique`, `stage`, `beneficiary`, convention ref,
`pathId`, start/end node ids, the ordered edge ids, exact before/after FEN and the triggering UCI.
`stage` is one of the eight D2496 source-bounded identities: Lucena bridge prepared / king
excursion started / bridge interposed; Philidor pawn entered defender third / rear-rank switch /
rear check delivered; or Vančura pawn entered seventh / rook moved behind. `beneficiary` is
computed: the pawn side for Lucena and the defender for Philidor/Vančura. It is never supplied by
the caller.

The factory symbol is exactly `createTheoryEndgameMethodStageV1Evidence`. It accepts the sealed
inputs above, replays the convention's deterministic state machine, and returns
`matched(readonly DeclaredEvidence<MethodStageV1>[]) | no_stage | unavailable(reason)`. Callers
cannot submit a technique, stage, beneficiary, boolean, event list or output payload. The factory
mints zero or more events discovered by replay; a later stage cannot exist without its exact setup
and prerequisite-stage lineage on the same path. Same moves outside that lineage, reordered or
non-contiguous edges, mixed paths, changed endpoint FENs and wrong convention versions fail before
sealing.

The D2496 author population supplies the full three-stage Lucena and Philidor paths, the two-stage
Vančura `a7 ...Ra6` control, the `...Rf7` hard negative, same-move/no-lineage refusal and colour/
beneficiary orientation. Its 100-path corpus result is exactly six events (three Lucena, three
Philidor) and zero authored Vančura events. Those are able-to-fail population controls, not an
ordinary consumer binding.

Method-stage evidence carries no tablebase category, result-preserved flag, correctness, advice,
reachability or significance. A consumer may compose it with separate before/after tablebase
evidence only through a declared derived/module operation. Existing recorded/live tablebase
evidence remains the separate outcome authority and retains its own perspective.

No `derived.endgame.setup_reachable@1` is introduced. Witnessed arrival, cooperative possibility,
forceability against all replies and inevitability under all moves are distinct D2496/D2497
readings. D2497 closes the proof-state vocabulary as `proved_true | proved_false |
unknown_horizon | unknown_provider` and makes two horizons non-interchangeable: a finite claim
horizon is part of the asserted proposition, while an operational search budget only bounds the
provider. A complete search through a declared finite claim horizon may prove false; exhausting an
operational budget on an unbounded or larger claim may not.

Any future setup-reachability projection therefore requires a declared target convention/version,
beneficiary, canonical root, exact edge-admission filter, finite claim horizon or explicit
unbounded arm, operational node/ply budget, provider/version, frontier/completeness receipt and
exact quantifier. The factory must compute the proof status from the complete admitted graph and
must not accept a caller boolean/status. The D2497 author population supplies three complete
one-ply tablebase roots: Lucena possible/not-forceable/not-inevitable; Philidor
possible/forceable/not-inevitable; and Vančura possible/forceable/inevitable under exact
beneficiary-WDL preservation. The same snapshots abstain beyond their child frontier. They settle
the value algebra, not a production multi-ply provider, latency, transposition/cache semantics or
consumer eligibility. Until those are researched and specified, `setup_match` and `method_stage`
cannot represent reachability or render “aim for/force/reach this technique.”

Until the setup and method conventions plus `run.record.edge@1` exist, these projections are
honest-unavailable and no Lucena/Philidor/Vančura sentence is rendered.

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

The D2146 census separates three units at the current baseline: **192** production mint routes,
**188** distinct mintable projection ids and **6** manifest projections with no route. The 192
routes comprise 75 generic adapters plus 117 specialized/dynamic branches; four projections each
have two routes. The implementation records one reviewed migration row per current route with
`oldOperation`, exact projection ref, target projection ref, factory shape, production operation,
authority inputs, convention/source dependency and call-site count.

The checked-in author receipt at
`planning/evidence-foundation-ux/evidence-value-authority-route-map.json` is the literal starting
table, not a prose census. Its syntax-aware use pass records 185 used routes, seven export-only
routes and zero bound projections without a production use. The earlier direct-call-only probe that
reported 25 export-only / 19 bound rows is rejected by [[D2147]] because it missed callback use.
The current route receipt resolves those 185 used routes to 46 exact enclosing callable operations;
no used route lacks an operation and no route resolves only to module scope. The seven export-only
routes deliberately carry no current operation. `producerImplementation` remains copied manifest
provenance and is never accepted as a factory's callable authority.

The set is partitioned at baseline as follows:

| Factory family after grounding repair | Current rows | Source of authority |
|---|---:|---|
| computed rules/product operations | 38 | FEN, validated edge or bounded rule inputs |
| derived operations | 25 | exact sealed derivation member, including the two runtime recorded-reading projections |
| recorded/provider/model/corpus/run projection | 9 | sealed source/exchange/run receipt |
| authored/theory projection | 3 | registered document/provenance authority |
| **Total generic adapters** | **75** | — |

Those 75 rows are one subset of the route table, not the full boundary. The complete 192-row receipt
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
and adds ten successors, yielding 203 declarations: six retired and 197 non-retired factory
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
   profiles, with bindings a checked subset; the same gate additionally requires the factory rows,
   generated route input/result maps and invoker arms to be set-equal;
4. exact current-route migration equality against the re-derived 192-route / 188-projection
   baseline, including the four duplicate paths and six no-route declarations (corrected
   2026-09-24: the frozen literal receipt is 204 routes / 200 projections after
   recorded-semantic-path; the gate proves collapse and symbol/shape equality against it);
5. the §3 9/6/2/3 reviewed grounding table;
6. convention closure for all six exact-under-convention rows;
7. no retired-v1 consumer binding; and
8. all authority positives/falsifiers.

This target joins `verify-software` (corrected 2026-09-24: the Makefile has no
`SOFTWARE_CONTRACT_TARGETS`) and therefore runs in ordinary `make verify` and the
`make verify-software` CI job. It is not a pre-push hook and requires no custom environment variables.

### 9. Implementation order

1. Land the semantic-convention register/provenance dependencies and provider receipt contract.
2. Add the private mint/value-receipt boundary without changing call sites.
3. Implement §3's corrected/split projection identities and update the catalogue.
4. Migrate the 38 computed rows, starting with the twelve already-bound current rows.
5. Migrate the 25 derived rows and invert semantic-event compilation.
6. Migrate the 9 direct source-receipt and 3 authored rows.
7. Delete all generic adapters/root exports and enable the permanent closure gate.
8. Run complete software, browser, content, packaging and CI-parity gates before status changes.

No intermediate commit may widen ordinary learner bindings or leave both a caller-payload adapter
and a production factory exported for the same projection.

## Deviations from design

None in product intent. This RFC qualifies B4's implemented-state wording: exact construction
identity exists, but value authority is not complete. It preserves the design's separate evidence
planes, optional LLM renderer and assistance ceilings.

## Acceptance criteria

1. D2144/D2146's baseline is re-derived at author review: 75 generic adapters / 51 bound; 192
   production routes / 188 distinct mintable projections; 4 duplicate-route projections; 6
   no-route declarations, with no unexplained drift.
2. D2145's twenty-row table remains set-equal and the 9/6/2/3 classification is independently
   reviewed against producer symbols.
3. The semantic-convention and provider-exchange dependencies are accepted with the exact closure
   and receipt types consumed here; this RFC does not restate them.
4. The checked-in literal 192-row migration receipt names every old route, target factory symbol,
   shape, authority input, dependency and production use; its syntax-aware author pass resolves all
   185 used rows to 46 exact callable operations and leaves only seven export-only rows operationless.
   The four duplicates must
   collapse and duplicate/missing/wildcard rows fail.
5. Only the package-private mint boundary calls `declareEvidence`; mint internals and old adapters
   are absent from runtime exports.
6. No production computed or derived factory accepts a result payload, boolean, count, event
   operands, caller cause or caller ancestry.
7. The nine literal and six exact-under-convention rows are computed from their authority inputs;
   the latter six carry the exact convention closure.
8. Phase and named-structure v1 have zero consumer bindings; their corrected successors have exact
   operands, grounding, factories and migrated consumers. `PhaseBandReadingV2` is set-equal to the
   five §3.3 arms; its factory derives phase and arm together from one FEN, rejects caller-supplied
   decision fields, and the 13/14, 17/18, 2/3 and 4/5 boundary controls can fail independently.
   No `confidence: number`, generic reason string or nullable margin is admitted.
9. Endgame, pivotal and structural-result v1 have zero consumer bindings; every successor in §3.4
   has one truthful authority/factory profile, including an explicit unavailable arm where the
   required upstream authority does not yet exist.
10. A Lucena/Philidor/Vancura setup cannot render without a cited/versioned setup convention and
    the exact factory-computed operand intersection. Canonical positives, colour symmetry, hard
    negatives and a blocked rook ray are independent falsifiers. A method stage requires the
    matching setup, registered method convention and exact contiguous same-path `run.record.edge@1`
    lineage; reordered/mixed/changed/no-lineage controls fail, and the 100-path population remains
    exactly 3 Lucena / 3 Philidor / 0 Vančura events. Neither setup nor method stage can render
    reachability, advice, significance, correctness or outcome preservation; zero Vančura corpus
    events cannot be reported as population validation. A future reachability value must retain
    D2497's target convention, beneficiary, edge filter, claim horizon, operational budget,
    provider/version, completeness and exact proof status; one-ply snapshots cannot authorize an
    eventual or ordinary-language steering claim.
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
19a. Every used factory is reachable only through the package-internal central
    `invokeEvidenceValueRoute`; the registry is its factories' sole non-test importer and its
    generated route/input/result maps are set-equal. Unknown routes, missing/extra input keys,
    crossed inputs/results, a metadata-only row, second dispatcher or direct production factory
    import fail. The operation remains absent from public/package exports and accepts no result
    payload or caller ancestry.
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
25. The 75-row partition is exactly the frozen literal receipt's (corrected 2026-09-24 from the
    stale 38 computed / 25 derived / 9 direct source / 3 authored): 35 computed / 27 derived /
    9 direct source / 4 authored.
    `recorded.engine.eval@1` and `recorded.tablebase.result@1` consume their exact same-record
    `sourcing.ledger.*` evidence outputs; caller bytes, another record and same-FEN value mutations
    fail before either runtime reading is minted ([[D2327]]).
26. `named_structure@2` has exactly `id`, `name`, and `provenanceNote`; arbitrary payloads and the v1
    prose-only route fail. The module successor handoff is explicit, while Campaign node identity is
    supplied only by its separately declared same-position derivation ([[D1727]], [[D2372]],
    [[D2373]]).

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | Semantic convention register/provenance accepted and exact six-row closure consumable | semantic-convention-provenance | accepted dependency plus exact convention-closure contract fixture | **2026-09-24** — the registry, `semantic-conventions` register and value-level `ConventionReceipt` landed (semantic-convention-provenance §1/§1.1/§4, owner-directed without acceptance review); the six exact-under-convention rows, `rules.phase.reading@2`, `named_structure@2`, `rules.endgame.classification@1`, the eleven recorded `@2` sequences and the setup/method stages mint with their exact closure. Fixtures: "seals the exact registered convention closure with every D1 row" and "seals the instance setup/method convention" in `evidence-value-authority.test.ts`; the table in `evidence-conventions.test.ts` |
| D2 | Provider/source receipt contract accepted and exact nine direct plus two chained recorded-reading source shapes consumable | provider-exchange-and-execution | accepted dependency plus exact source/derived receipt contract fixture | |
| D3 | Semantic event authority profiles accepted for reuse without duplicating cases | semantic-validation-authority | accepted dependency plus set-equal authority-profile receipt | |
| D4 | Fresh independent buildability review after D1–D3 and the literal 192-route author table | codex | fresh review record with every blocking finding closed or routed | |
| D5 | Exact ordered path authority for retrospective method-stage derivation | recorded-semantic-path | accepted `run.record.edge@1` plus mixed/reordered/non-contiguous path refusals | |

## Open questions

None for the owner. Author review must settle exact successor symbol spelling and the literal
192-route migration table before acceptance; those are buildability obligations, not product choices.

## Changelog

- 2026-10-15: unaccepted D3847 §2.3d supplies exact domain population schemas for structural
  comparison and recorded last-level selection, preserving empty/state/occurrence authority
  and old algorithms. D3845's closed reduction grammar, successor factories and joint acceptance
  remain held; no generic aggregate/absence leaf or current runtime adoption is authorized.
- 2026-10-15: D3854 corrects the unaccepted promotion convention's later-source disclosure to
  exact reviewed_text under the existing upstream restriction, preserving its code witness,
  primary grounding, algorithm and claimed identity. No production or acceptance change.
- 2026-10-15: unaccepted D3768/D3847 §2.3f specifies a fresh nonterminal fork source, exact two
  input authorities and claimed convention successor, coordinated packet/Hint/direct-consumer
  migration and terminal-aware rendering. Old meaning/history and the explicitly legacy vector
  remain; no acceptance or production qualification follows.
- 2026-10-15: D3847/D3852 §2.3e proposes a direct computed conventional strict-overload predicate
  from one validated legal edge. It supersedes the rejected two-input derived@2 proposal;
  that F1 failure stays in the research instrument. No primary relabel, dummy witness or F1
  amendment; all three conventions bind directly. Historical callers and all other source/
  collection holds remain. This is unaccepted authoring, not a new factory or Inspector acceptance.

- 2026-10-15: D3847 §2.3d records measured negative-selection source obligations for Compare
  structure and Story last-level before choosing their exact schemas. Complete populations,
  successful empty family/state results and recorded-result-only gating cannot be replaced by
  positive witnesses. The source map remains17/58 and conditional; piece routes are not added
  to Inspector. This is an explicit authoring hold, not accepted grammar or an implementation.
- 2026-10-15: draft D3847/D3850 §2.3c specifies two material successors retaining actual ten-count
  and before/after/capture/promotion inputs, plus a genuinely computed promotion reading under
  the existing rules producer. The latter claims one direct algorithm convention in the existing
  register, not a fake predicate ancestry.48 signature/22 full event comparisons, seven bad-count/
  same-payload foreign-FEN negatives, two en passant cases, 21 wrong-edge substitutions, four
  quiet/castling empties and six promotion cases support feasibility; unchanged F1
  compiles the prospective declarations. The proposed Inspector map expands17/58, not complete
  factory/consumer closure. No production registration, old-meaning rewrite or acceptance follows.
- 2026-10-15: D3848 corrects all seven hint-horizon source arrays to the existing declared order,
  family source then principal variation. Seven permanent predecessor failures become passes;
  payloads, callable arguments, policy and convention multiset remain. D3847's separate opt-in
  audit exposes broader literal-input reconciliation debt; neither this repair nor a successful
  factory fixture settles that debt, D3845 grammar or joint Inspector acceptance.
  Full local proof passes5895 software/seven performance/257 content/build and397 browser cases,
  one configured optional Maia skip and112 unretried composition cells. The first matrix failure
  is retained with D3849's test-race diagnosis/condition-wait repair and full four-tier rerun.
- 2026-10-15: D3846 authors explicit phase-change@2 and option-collapse@2 scoped successors
  retaining their actual ordered four/six witness operands. Old versions remain untouched;
  existing fixed-tuple compiler guards suffice, but source/factory/caller migration and
  independent acceptance remain required. This is separate from D3845's collection reduction.
- 2026-10-15: draft D3841 source authoring separates historical packet/selection observations
  from live exchanges, with exact occurrence-bound sole factories, fixed tablebase views and
  explicit historical marker/Compare successors. No current declarations or source meanings
  change. D3845 holds rank's variable/empty lineage contract; joint/upstream independent review
  still precedes new factories, callable/API/UI or source retirement.
- 2026-10-15 — D3829 applies §3.4's separate families to source preparation, not only output
  filtering. Each exact factory calls a module-internal requested-family producer; original
  graph/FEN validation, combined whole-tip rendering, retained witnesses, public arms and all
  meanings remain. Four permanent predecessor failures become105 focused passes/types; a
  committed-baseline experiment preserves complete payload/input/value/convention images over
  28 fixture-route calls while cutting each detector family's preparation to one pass instead
  of four, with84 non-vacuous graph/FEN refusals. Full frozen normal verification/build/all
  browser tiers pass:5850 software, seven performance,257 content,59 matrix and112 unretried
  composition cells. No scoped authority, latency or qualification claim, new register/version
  or whole-RFC discharge follows.

- 2026-10-15 — D3826/D3827 repair the accepted §3.4 implementation: retain each human marker's
  own recorded engine/candidate image through the already-declared page arm, two definite phase
  readings/occurrences and three same-side mobility readings/occurrences. Marker meanings,
  whole-tip populations, public factory input arms, versions and eligibility remain unchanged.
  Permanent predecessor failures and actual Review packet/source controls retain the failures;
  full local software/performance/content/governance/build/all browser tiers pass after the
  recorded duplicate-checkpoint correction. Both grounding defects close; scoped Inspector
  operations remain a separate draft. No qualification or whole-RFC completion is implied.

- 2026-09-24 (D1): discharged by `semantic-convention-provenance.md`'s landing. The `pending`
  convention notes are gone from the six exact-under-convention rows, `rules.phase.reading@2`,
  `named_structure@2`, `rules.endgame.classification@1`, forced mate, the eleven recorded `@2`
  sequences and the setup/method factories: each value now carries a sealed `ConventionReceipt`
  whose refs are registered (`square-control@1`, `defence-duty@1`, `mate-proof@1`, `phase-bands@1`,
  `named-structure-catalogue@1`, `endgame-material-census@1`, the sequence conventions, and the one
  setup or method convention a value was computed under). The setup and method conventions moved from
  their in-code registration into the shared register; `endgameSetupConvention`/`endgameMethodConvention`
  resolve a code record only while its exact `id@version` is registered. Criterion 3 is met for the
  convention half; D2 (provider receipts) is now the awaited discharge.

- 2026-09-24 (later): correction (g) is superseded. `setup_match@1` and `method_stage@1` are live over the cited `lucena-setup@1`, `philidor-third-rank-setup@1` and `vancura-setup@1` conventions and their method conventions (`packages/runtime/src/endgame-setup.ts`, `endgame-method.ts`; dossier `design/research/endgame-setup-conventions.md`). Setup reachability stays unavailable ([[D2497]]).
- 2026-09-24: implemented (claude, worktree `agent-ab369751c08788e1a`). Corrections made while
  implementing, none widening authority: (a) the migration receipt was re-derived by main's
  recorded-semantic-path to 204 routes / 200 projections / 198 used / 6 export-only / 60 callable
  operations and is now a **frozen** baseline, since its source (`evidence-source-adapters.ts`) is
  deleted; `make evidence-value-authority-route-map` verifies its seal and that every target
  resolves to the registered factory with equal symbol and shape. (b) Criterion 25's partition was
  stale against the RFC's own literal receipt; the receipt yields 35/27/9/4 (the recorded readings
  are derived, `theory.opening_identity.record` and `pack.authored.phase` are authored authority,
  and promotion-pressure/role-signature derivations are derived). (c) `SOFTWARE_CONTRACT_TARGETS`
  does not exist; the gate joins `verify-software`. (d) `derived.compare.structure_delta@1`
  regrounds to `declared_convention/convention` because it now consumes
  `named_structure@2` (declared convention); keeping `position_rules/exact` would upgrade grounding.
  (e) `theory.endgame.method_stage@1` sits on the `derived` plane (it derives from setup evidence and
  `run.record.edge@1` lineage). (f) `derived.structural.predicate_result@1` is grounded
  `authored_claim/authored`, the only grounding the derivation algebra admits over an authored
  condition. (g) `theory.endgame.setup_match@1` and `theory.endgame.method_stage@1` ship as
  honest-unavailable factories (reason + dependency) because no cited/versioned setup convention is
  registered (D1); the 3/3/0 population and setup positives are therefore not claimed. (h) The shared
  candidate packet's `createRulesMobilityReadingLegalMovesV1Evidence` stand-in moved into
  `evidence-factories.ts`; `declareExactLegalMovesEvidence` is retired.

- 2026-09-14: [[D3265]] adds the omitted `sourcing.ledger.citable_text@1` branch of
  `declareSourcingRecordEvidence` to the executable census. The current baseline is 75 generic plus
  117 specialized routes: 192 routes / 188 projections, 185 used rows / 7 export-only rows and 46
  exact callable operations; the manifest still has six no-route declarations.
- 2026-09-04: [[D2629]] makes the registry executable without widening mint authority. One
  package-internal generated `invokeEvidenceValueRoute` correlates every literal route to its exact
  authority inputs/result; production operations import it, while the central registry remains the
  sole factory importer. Runtime exact-key validation prevents TypeScript erasure from becoming a
  payload bypass.

- 2026-09-01: [[D2497]] closes the scoped proof algebra without adding a reachability projection.
  `proved_true`, `proved_false`, `unknown_horizon` and `unknown_provider` are distinct; finite claim
  horizon and operational search budget cannot share one field. Three complete one-ply tablebase
  controls separate possible/forceable/inevitable, but no production multi-ply provider, latency or
  learner sentence is authorized.
- 2026-09-01: [[D2496]] adds only retrospective `theory.endgame.method_stage@1`, derived from a
  matching setup, registered method convention and exact ordered `run.record.edge@1` lineage. The
  eight stage identities and 100-path population are executable. Reachability remains absent until
  a target/horizon/provider/completeness/quantifier contract exists; witnessed arrival is not
  forceability.
- 2026-09-01: [[D2495]] replaces the broad `theory.endgame.technique_candidate@1` with the
  source-bounded, factory-computed `theory.endgame.setup_match@1`. Material classification,
  witnessed method stage, bounded reachability and perspective-oriented tablebase outcome remain
  separate; the two research-GAP projections are not introduced.
- 2026-09-01: [[D2484]] replaces the proposed byte-compatible phase payload with the measured
  five-arm `PhaseBandReadingV2`: registered convention identity, exact operand boundaries and
  deterministic margin/distances. It explicitly refuses probability, move-distance and provider
  absence semantics; D2483/D2484 supply the author population and all-arm controls.
- 2026-08-31: D2146 callable-operation closure derives the exact enclosing production symbol for
  every syntax-aware use: 184 used rows resolve to 45 operations; seven export-only rows remain
  empty by definition; no used row is missing or module-owned.
- 2026-08-30: [[D2327]] corrects the recorded-reading route class: runtime engine and tablebase
  readings are derived from their exact validated sourcing-ledger evidence, changing the reviewed
  75-row partition from 23/11 to 25/9 derived/direct-source without changing its total. Pinned the
  held promotion pair's five exact future/existing route symbols to the same authority.
- 2026-08-30: created from D2144/D2145; separates primary grounding, convention closure and value
  construction; refuses caller-payload compatibility adapters and generic mint APIs.
- 2026-08-30: D2146 self-review correction — 75 generic adapters, 191 routes, 187 mintable ids,
  four duplicates and six no-route declarations; replaced the impossible cross-module capability
  claim with one runtime factory module and corrected receipt verification semantics.
