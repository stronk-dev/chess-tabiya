# RFC: Semantic evidence and local selection — preserve the fact before deciding to speak

- **Status:** accepted
- **Author:** codex (agent), for Marco
- **Created:** 2026-08-21
- **Design refs:** `design/03-product-breadth.md` §§Intelligence and explanation, B3, B4 and B9;
  `design/04-content-architecture.md` §What is actually primitive; `design/05-in-run-experience.md`
  §§3 amendment, 3-forms, 3a, 3b-i and 5
- **Exploration gate:** F2 is opened by R1/R2/A3, owner rulings O2/O3, and implemented F1. The
  post-F1 readiness re-derivation is D680 and
  `planning/platform-alignment/research-sufficiency.md` (2026-08-21 delta).
- **Depends on:** `rfc/archive/evidence-contract-manifest.md`; implemented
  `rfc/archive/live-marker-quality.md`; `design/research/detection-landscape.md`;
  `design/research/selection-sign-and-significance.md`;
  `design/research/detector-semantic-conformance.md`
- **Parent / amends:** follow-up to `rfc/archive/evidence-contract-manifest.md`; narrows the
  semantic-event and selector seam left by `rfc/archive/structural-reading.md` and
  `rfc/archive/transition-primitives.md`
- **Supersedes / superseded by:** —
- **Planning:** `planning/semantic-evidence-selection/` (once implementing)

```tabiya-claims
none
```

## Summary

F1 proves which versioned evidence may cross each production boundary. It does not prove that a
payload contains the operands needed to support a learner-facing statement, and it does not choose
which of several eligible facts should be delivered. This RFC adds those two missing stages to the
same compiled evidence contract:

1. an identity-preserving semantic event, admitted for one exact consumer only after executable
   positive and hard-negative validation; and
2. a deterministic local selector that compares the played move with every legal alternative,
   applies an explicit consumer policy, and treats an empty result as ordinary output.

The implementation restores identities currently discarded by the transition census, splits the
four irreversibility properties into independent events, seals F1's remaining generic payload
forge, and publishes a parameterised selector. It does **not** name a tactic, grade a move, choose a
workflow preset, change learner-visible defaults, persist a new run event, migrate a pack, or lift
D560/Gate F.

## Motivation

### 1. F1 made the pipe truthful; its contents can still be too weak

A3 measured 3,371 transition observations over 754 committed transitions. None retains an affected
square. `changedOccupiedTargets()` calculates square identities and `counts()` erases them before
`transitionReading()`; slider, escape and defended-duty identities are discarded in the same
stage. The resulting sentences are honest geometric census rows, but they cannot ground a square
highlight, discovered-line explanation, theory key or precise nudge. An LLM cannot reconstruct
what the product intentionally threw away. `[V]`

The structural surface has the related projection failure. Eleven of eighteen current families
round-trip between matcher and reader; seven are subset, lossy or matcher-only. F1 correctly gives
these projections different identities. F2 must not reunify them under a generic event envelope
that calls every serialized reading semantic.

### 2. Local selection fixes volume, not meaning

R2's predeclared local selector reduced raw evidence from 8.70 to 0.79 entries per authored
decision and 11.42 to 1.03 per imported-game decision while reaching 93%+ counterfactual
specificity on both populations. It retained all 108 predeclared rules events. It also selected
`piece_count`, `bishop_on_shade` and generic changed-count families, proving that distinctiveness is
not significance. `[V]`

The older D542/D543 experiment reported 294.11× lift for the two highest-lift kinds in one authored
population. R2 later tested transfer and refused that number as a product prior: rank correlation
was 0.667 rather than identity and `king_opposition` reversed direction. D660 is corrected before
this draft. Global lift remains a versioned diagnostic; it never grants eligibility, valence,
critical status or delivery order.

### 3. The remaining forge is at the payload boundary

F1 seals admitted views and renderer sentences, but the public package still exports generic
`declareEvidence(producer, projection, payload)`. A caller can pair an exact registered projection
ID with arbitrary bytes, then pass the wrapper through a valid binding. D668 records this residual.
F2 removes the generic public constructor and makes exact producer adapters the only package
surface that can create declared evidence.

The HEAD buildability census finds **38 direct production call lines across fourteen source
files**: six runtime files, five server files and three web files. The unit is a source file
containing at least one non-test `declareEvidence(` call; the fourteen exact paths are the closure
set checked by acceptance criterion 8. This is a real migration, not a one-export deletion.

### 4. Scope boundary

This RFC does not:

- declare fork, pin, skewer, hanging piece, prophylaxis, plan, space advantage or move-quality
  events; R1's broad probes are disagreement evidence, not accepted definitions;
- infer valence from `gained`, `lost`, `preserved`, `avoided`, rarity, lift, engine prose, Maia
  probability or Explorer popularity;
- choose F5 module names, workflow defaults, a 20% threshold, a two-card default, or any proactive
  assistance behavior;
- change the current live-marker set, Compare story ordering or Review Map moment selection;
- alter `EvidencePacket` transport, run schema, storage, pack/shape/principle schemas, authored
  content or sourcing records;
- implement F3 migration, F4 theory retrieval, F5 presentation, F6 Review Map, F8 bots or F9
  player metrics.

## Specification

### 5. One compiled contract, extended rather than shadowed

`EvidenceContractDeclarations` gains four extensible declaration collections: semantic events,
event→consumer eligibility, reasons and selector policies. They extend the F1 manifest rather than
creating a parallel registry:

```ts
type SemanticEventSign = ProjectionDeclaration["signs"][number];

interface SemanticEventDeclaration {
  readonly projection: VersionedEvidenceId;
  readonly derivationInputs?: readonly VersionedEvidenceId[];
  readonly allowedSigns: readonly SemanticEventSign[];
  readonly requiredOperands: readonly string[];
  readonly valence: "none" | "source_required";
  readonly validation: {
    readonly positives: readonly string[];
    readonly hardNegatives: readonly string[];
    readonly externalPopulation?: string;
  };
}

interface EvidenceEligibilityDeclaration {
  readonly event: VersionedEvidenceId;
  readonly consumer: VersionedEvidenceId;
  readonly disposition: "eligible" | "refused";
  readonly reason: VersionedEvidenceId;
  readonly allowedSigns: readonly SemanticEventSign[];
  readonly requiredOperands: readonly string[];
  readonly valenceAuthority: readonly VersionedEvidenceId[];
}

interface EvidenceReasonDeclaration {
  readonly id: string;
  readonly version: number;
  readonly stage: "eligibility" | "selection";
  readonly meaning: string;
}

interface EvidenceSelectionPolicyDeclaration extends EvidenceSelectionPolicy {
  readonly consumer: VersionedEvidenceId;
  readonly disposition: "experimental" | "production";
}

interface EvidenceContractDeclarations {
  // existing producers, consumers, adapters and genericBypasses stay unchanged
  readonly semanticEvents: readonly SemanticEventDeclaration[];
  readonly eligibility: readonly EvidenceEligibilityDeclaration[];
  readonly reasons: readonly EvidenceReasonDeclaration[];
  readonly selectionPolicies: readonly EvidenceSelectionPolicyDeclaration[];
}
```

These declarations compile with F1's producers, projections, consumers and adapters and contribute
to the same canonical manifest digest. They are not a second registry and do not introduce a
global semantic-event version. An event ID is an independently versioned projection ID. Different
RFCs may add distinct IDs; an `(id, version)` collision fails.

Every event/consumer pair that is declared for evaluation has one eligibility row. `eligible`
means only that this event can truthfully reach that consumer if later selected and allowed by
timing/access. It does not mean the event is important or enabled by default. `refused` is
first-class and needs a reason. Unlisted pairs are refused, not inherited from a role or prefix.

Reason IDs are independently versioned, extensible declarations in this same manifest, not a
closed TypeScript union. Adding a distinct reason ID does not move a shared head; duplicate
`(id, version)` declarations fail compilation.

For a derived projection, `SemanticEventDeclaration.derivationInputs` is set-equal to the existing
`ProjectionDeclaration.derivation.inputs`; disagreement fails compilation. Event grouping uses the
exact projection `(id, version)` plus sign. There is no free-text family join.

Inspector, authoring, operator and machine-condition consumers may continue to accept raw readings
without semantic eligibility. A learner-facing selector accepts only projections with an exact
`eligible` row for its target consumer. There is no wildcard, role-wide or family-prefix grant.

The initial matrix is exhaustive: all 33 §7 events are eligible only for
`research.semantic_selection@1`; none of F1's current production operations gains an event binding.
Every other event/consumer pair is absent and therefore refused. F5 must add literal production
eligibility rows and adapters rather than promoting the research consumer or inheriting its set.

The implementation adds this exact closed error-code set to F1's existing manifest errors:

```text
EVIDENCE_EVENT_DUPLICATE
EVIDENCE_EVENT_PROJECTION_MISSING
EVIDENCE_EVENT_DERIVATION_MISMATCH
EVIDENCE_EVENT_SIGN_WIDENS
EVIDENCE_EVENT_OPERAND_MISSING
EVIDENCE_EVENT_UNVALIDATED
EVIDENCE_EVENT_PROJECTION_REFUSED
EVIDENCE_EVENT_VALENCE_UNBACKED
EVIDENCE_ELIGIBILITY_DUPLICATE
EVIDENCE_ELIGIBILITY_ORPHANED
EVIDENCE_REASON_DUPLICATE
EVIDENCE_POLICY_DUPLICATE
EVIDENCE_POLICY_INVALID
EVIDENCE_POLICY_CONSUMER_MISSING
EVIDENCE_POLICY_CRITICAL_REFUSED
```

No implementation-only synonym or generic `EVIDENCE_EVENT_INVALID` may replace these diagnostics.

### 6. Semantic event instance

The compiler emits an immutable, runtime-sealed value:

```ts
const SEMANTIC_EVENT = Symbol("tabiya.evidence.semantic_event");

interface SemanticEvidenceEvent<T = unknown> {
  readonly [SEMANTIC_EVENT]: true;
  readonly id: string;
  readonly projection: VersionedEvidenceId;
  readonly evidence: DeclaredEvidence<T>;
  readonly derivationInputs: readonly DeclaredEvidence<unknown>[];
  readonly anchor: {
    readonly beforeFen: string;
    readonly moveUci: string;
    readonly afterFen: string;
    readonly side: "white" | "black";
    readonly runId?: string;
    readonly branchId?: string;
    readonly nodeId?: string;
  };
  readonly sign: SemanticEventSign;
  readonly operands: T;
  readonly basis: {
    readonly grounding: EvidenceGrounding;
    readonly exactness: ProjectionDeclaration["exactness"];
    readonly confidence: ProjectionDeclaration["confidence"];
  };
  readonly valence?: {
    readonly value: "favorable" | "unfavorable" | "mixed";
    readonly authority: DeclaredEvidence<unknown>;
  };
}
```

For a direct rules event, `evidence` is the exact event projection emitted by the producer and
`derivationInputs` is empty. A genuinely composed event names non-empty projection dependencies in
both its F1 projection and `SemanticEventDeclaration`; the instance carries those exact admitted
inputs. A direct event never names itself as a dependency. The source adapter supplies bytes; the
compiler supplies static basis fields from the manifest and refuses any contradiction. The event
ID is the canonical digest of projection, both FENs,
canonical UCI, sign and operands; it excludes optional run coordinates. Castling UCI is
canonicalized by resulting king square before hashing, matching the R2 instrument and repairing the
imported-game mismatch without changing stored moves.

Only the compiler can attach `SEMANTIC_EVENT`; its runtime assertion rechecks the declared
projection, producer, sign, operands, derivation inputs and canonical ID. A plain object or a valid
declared-evidence wrapper paired with invented event metadata fails as `EVIDENCE_GENERIC_BYPASS`.

`sign` describes a relation, never a verdict. The initial direct event set uses `state`, `gained`,
`lost` and `preserved` where their literal contracts apply. It does not
emit `avoided`: absence from the committed edge is established only after the selector has examined
the complete alternative population (§9.1). No event in this RFC carries valence. Future events
may carry valence only with an admitted authored, cited-theory, engine/tablebase convention or
validated event authority named in both declarations. The compiler refuses absent, unbound or
answer-widening authority.

### 7. Initial identity-preserving event set

The initial set is deliberately literal. It publishes facts needed by future modules and no tactic
or plan names.

The direct declaration set is exactly these **22 version-1 projections**; the literal IDs are an
exhaustiveness boundary, not illustrative names:

- `rules.structural.event.backward_pawn`, `.doubled_pawn`, `.half_open_file`,
  `.isolated_pawn`, `.king_opposition`, `.king_zone`, `.line_blockers`, `.open_file`,
  `.passed_pawn`, `.piece_count` and `.direct_attack_count`;
- `rules.transition.event.occupied_attack`, `.occupied_defence`, `.slider_ray`, `.piece_escape`
  and `.defended_duty`; and
- `rules.transition.event.castled`, `.clock_reset`, `.last_of_role`, `.pawn_contact`,
  `.checkmate` and `.promotion`.

The selector may additionally construct exactly **eleven derived version-1 avoidance projections**
under producer `derived.semantic_avoidance`: `.backward_pawn`, `.doubled_pawn`,
`.half_open_file`, `.isolated_pawn`, `.king_opposition`, `.king_zone`, `.line_blockers`,
`.open_file`, `.passed_pawn`, `.piece_count` and `.direct_attack_count`. Each full ID is
`derived.semantic_avoidance.<suffix>`. Its one declared projection dependency is the corresponding
`rules.structural.event.<suffix>@1`; its instance retains all supporting alternative event values
and the complete denominator. R2 validated alternative-only relations for these structural
families. No transition-avoidance projection is admitted by this RFC merely because it is
conceivable.

The complete initial semantic set is therefore 33 projections: 22 direct and eleven derived. An
implementation may choose exported constant names, but it may not add an event projection,
collapse two IDs, or substitute a reading ID without returning this draft to author. Relation forms
such as an opened ray or released duty use the manifest's `gained`/`lost` relation signs on these
projections, not extra projection IDs.

| group | event projections | required operands | grounding |
|---|---|---|---|
| structural relation | signed before/after events for the eleven A3 round-trip families | family-specific piece/color/role/square/file/ray/count operands plus both FENs | exact rules for nine; named convention/version for `backward_pawn` and `king_opposition` |
| occupied-target attack | target became attacked/unattacked | attacker set, target occupant, target square, color | exact pseudo-attack relation; no claim of legal capture or threat |
| occupied-target defence | target became defended/undefended | defender set, target piece, target square, color | exact pseudo-defence relation; no claim of tactical safety |
| slider ray | ray opened/closed | slider, blocker before/after, gained/lost squares, affected occupied targets | exact geometric relation; no discovered-tactic label |
| piece escape geometry | destinations gained/lost | piece, from square, destination squares, color | pseudo-legal geometry; pins/check legality explicitly absent |
| defended duty threshold | acquired/released | defender, defended allies before/after, squares | declared two-duty convention; no overload label |
| independent rules events | castled, halfmove clock reset, last-of-role capture, pawn contact | mover/captured role/king destination/pawn squares as applicable | exact rules or named pawn-contact convention |
| terminal rules | checkmate, promotion | mover, promotion role or mated side, squares | exact legal-game result |

The existing count-only transition projections remain available to the inspector and current raw
surfaces. They do not become event sources. The existing `rules.transition` producer gains new,
exact `role: "event"` projections and reads the validated board edge before reduction, retaining
identities alongside the old counts; it does not reverse-engineer them from
`TransitionObservation`.

`move_irreversibility` is not an event family. Its four current subkinds become independent
projections. A pawn capture of the opponent's last queen that also creates pawn contact emits
`clock_reset`, `last_of_role` and `pawn_contact`; no priority return suppresses a true property.

The seven non-round-trip structural families remain refused as learner events at v1:
`outpost`, `bishop_on_shade`, `piece_distance`, `piece_reach_count`, `named_structure`,
`pawn_safe_square` and `pawn_count`. Exact source-specific successors may be added later under new
projection IDs; no existing ID is silently reinterpreted.

### 8. Eligibility and abstention

An event is eligible for one consumer only when all of these hold:

1. its exact event and source projections exist in the compiled manifest;
2. the package-private source adapter validates the payload shape and every required operand is
   present;
3. the event declaration has at least one executable positive and one executable hard-negative
   fixture, and the fixture registry is set-equal to its named IDs;
4. one exact `eligible` row exists for the target consumer and sign;
5. the exact event projection is bound to the target consumer; every declared derivation input is
   bound to the event derivation, and none abstained;
6. any valence has a separately admitted authority; and
7. timing, role, session, form, answer distance, availability and budgets still narrow through F1.

Failure produces a machine-readable abstention, not a downgraded generic sentence:

The initial eligibility reason declarations are `eligible_validated_literal`, `source_abstained`,
`source_projection_unbound`, `payload_invalid`, `required_operand_missing`,
`event_unvalidated`, `consumer_refused`, `sign_refused` and `valence_unbacked`, each at version 1.
The result carries an exact `VersionedEvidenceId`; consumers do not switch over an exported closed
union.

Raw evidence may still appear in an inspector when F1 permits it. The compiler never changes a
refusal into an inspector error or an event into a raw fallback.

Every initial event declaration names the frozen R2 authored/imported population digest in
`validation.externalPopulation`. Zero observed occurrences are reported rather than converted into
a pass; executable positives establish reachability, hard negatives establish refusal, and the
external run establishes measured population behavior. Replacing that population requires a new
versioned validation record, not an in-place count edit.

### 9. Local legal-alternative selector

Selection is a pure function over already eligible events:

```ts
const SELECTED_EVIDENCE = Symbol("tabiya.evidence.selected");

interface EvidenceSelectionPolicy {
  readonly id: string;
  readonly version: number;
  readonly minimumAlternatives: number;
  readonly maximumSameFamilyShare: number;
  readonly minimumAlternativeOnlyShare: number | null;
  readonly maxFacts: number;
  readonly criticalEvents: readonly VersionedEvidenceId[];
}

interface EvidenceSelectionResult {
  readonly [SELECTED_EVIDENCE]: true;
  readonly policy: VersionedEvidenceId;
  readonly consumer: VersionedEvidenceId;
  readonly population: {
    readonly legalAlternatives: number;
    readonly evaluatedAlternatives: number;
  };
  readonly selected: readonly SelectedEvidenceFact[];
  readonly rejected: readonly {
    readonly candidate: { readonly kind: "played_event" | "counterfactual_absence"; readonly id: string };
    readonly reason: VersionedEvidenceId;
  }[];
  readonly emptyReason?: VersionedEvidenceId;
}

type SelectedEvidenceFact =
  | {
      readonly kind: "played_event";
      readonly event: SemanticEvidenceEvent;
      readonly sameFamilyShare: number;
    }
  | {
      readonly kind: "counterfactual_absence";
      readonly event: SemanticEvidenceEvent<{
        readonly relation: "avoided";
        readonly family: {
          readonly projection: VersionedEvidenceId;
          readonly sign: SemanticEventSign;
        };
        readonly legalAlternatives: number;
        readonly alternativesWithFamily: number;
      }>;
    };
```

Only the selector can construct the frozen `SELECTED_EVIDENCE` brand. Its runtime assertion checks
the policy/consumer pair against the compiled manifest and checks every selected event's runtime
seal and exact eligibility. A structural cast or a result assembled from otherwise valid event
objects is refused. F5 renderers accept this selected view and render each contained declared event
through F1's registered renderer path; they never accept an unsealed candidate array.

For a committed legal edge, the selector enumerates every legal move from the exact parent FEN
**except the committed move**, including all promotion roles, obtains eligible events for each
child under the same target consumer, and groups events by `(event projection id, version, sign)`.
Operand identity is not part of the admission family: a changed square cannot look rare merely
because its coordinate differs.

The denominator is the complete legal-alternative set, including alternatives that emit no event.
It is never “alternatives with evidence” or “alternatives the provider answered.” For the initial
local rules events, `evaluatedAlternatives` must equal `legalAlternatives`; otherwise the whole
selection abstains with a versioned `counterfactual_population_incomplete` reason. A future
provider/model event needs its own complete or explicitly sampled population contract before it can
use this selector. Missing provider output may not masquerade as “this alternative did not signal.”

For each played family:

```text
same-family share = legal alternatives emitting >=1 eligible event in the family
                    / all legal alternatives other than the committed move
specificity       = 1 - same-family share
```

An ordinary played event passes when the alternative population reaches `minimumAlternatives` and the
share is at most `maximumSameFamilyShare`. An explicitly declared critical event bypasses the
minimum/share distinctiveness gate only; it does not gain valence, visibility or permission, and
it still competes inside `maxFacts` under the same deterministic order.

Order is deterministic: critical played events before ordinary candidates; then greater local
support (`1 - sameFamilyShare` for a played event, alternative-family share for a counterfactual
absence); `played_event` before `counterfactual_absence` on an exact tie; projection `(id,
version)`; canonical operand digest; event ID. This orders the strength of the
declared local relation, not chess importance. The selector takes no global lift table and no
learned score. Diagnostic population lift may appear only in an audit report with source digest,
date and population identity; its type cannot enter the policy or comparator.

#### 9.1 Counterfactual absence (`avoided`)

`avoided` is a selected counterfactual fact, not a direct event sign and not a claim that the
committed move was good. After the complete-population check, the selector may emit one
`counterfactual_absence` item for an eligible family when:

1. the committed edge emits no eligible event in that exact `(projection, version, sign)` family;
2. at least `minimumAlternatives` alternatives exist;
3. at least `minimumAlternativeOnlyShare` of all legal alternatives emit that same eligible signed
   family;
4. the threshold is non-null; and
5. every supporting alternative event is retained in `alternativeEvents` with the exact numerator
   and denominator.

The selector constructs the matching `derived.semantic_avoidance.*@1` declared evidence and a
normal sealed `SemanticEvidenceEvent` whose sign is `avoided`. Its `derivationInputs` are the exact
declared base-event values from every supporting alternative, while its operands carry the signed
family, numerator and denominator. It therefore crosses F1 rendering and voice boundaries as one
registered derived item without losing or side-loading its multiple authorities.

The derived event inherits the weakest grounding, exactness and confidence of its supporting
events and requires its own exact eligibility row for the target consumer. It has no valence, no
inferred intent and no causal wording. An empty or incomplete support set cannot produce it.
Operand identity is excluded from the family denominator for the same reason as played-event
selection, but the retained inputs preserve exact squares and pieces for inspection and registered
rendering.

The policy is required input. F2 adds an explicitly experimental machine consumer
`research.semantic_selection@1` and publishes the measured research profile
`research.r2_candidate@1` (`minimumAlternatives: 8`, `maximumSameFamilyShare: 0.20`,
`minimumAlternativeOnlyShare: 0.30`, `maxFacts: 2`, exact critical event projections
`rules.transition.event.checkmate@1`, `rules.transition.event.promotion@1`,
`rules.transition.event.castled@1` and `rules.transition.event.last_of_role@1`) for
reproduction and regression only. The 0.30 value
reproduces R2's 1,032 authored and 522 imported alternative-only relations; it is not a production
default. The research consumer is not a product operation and carries an `experimental`
disposition; its profile cannot bind to a production learner consumer. F5 declares each module's
production policy and defaults after owner validation; there is no unnamed F2 default.

Policy compilation requires a safe integer `minimumAlternatives >= 0`, both non-null share values
in `[0, 1]`, a safe integer `maxFacts >= 0`, one exact declared consumer, and literal critical IDs
that are eligible for that consumer. Invalid values fail manifest compilation; no runtime clamping
or implicit default is allowed.

Empty output is normal. The initial versioned selection-reason declarations are
`no_eligible_events`, `insufficient_alternatives`, `nothing_distinctive`, `budget_zero`,
`counterfactual_population_incomplete` and `critical_budget_exhausted`; the result carries the
exact reason ID rather than an exported closed union.

### 10. Critical events are threshold overrides, not importance labels

The research profile's four critical event IDs exist to measure whether the ordinary
distinctiveness gate erases rare exact rules events. “Critical” is a selector control name, not
learner prose and not a chess grade. A losing promotion, bad castling move or forced last-role
capture remains critical under this narrow threshold-override definition.

A production policy must list critical IDs literally. The compiler rejects a critical ID that is
not eligible for the target consumer or lacks validation. When more threshold overrides co-occur
than the finite consumer budget permits, the normal deterministic order selects the prefix and the
remainder is recorded as `critical_budget_exhausted`; nothing silently widens the budget. No global
critical-event registry exists.

### 11. Seal the source adapters

`declareEvidence` is removed from `packages/runtime/src/index.ts`. Generic construction remains
module-private to `evidence-contract.ts`. Production packages import exact source adapters. Each
exact adapter fixes one producer/projection pair, accepts and runtime-validates one payload type,
returns a branded `DeclaredEvidence<T>`, and is named in the F1 adapter declaration and closure
census.

No exported function accepts caller-supplied producer or projection IDs. Tests needing arbitrary
declarations use a test-only builder outside the runtime package export map. A production import of
the generic constructor or a structural cast is a verification failure. This discharges D668
without claiming JavaScript can prevent a malicious source-tree fork.

### 12. Current consumer behavior and downstream hand-offs

F2 adds compiler and selected-view types but does not silently route current raw surfaces through
`research.r2_candidate@1`.

Starting from F1's implemented 19 producers / 93 projections / 24 declared consumers (23 current
operations plus disposed `assistance.arrows`) / 142 bindings, this RFC's exact compiled closure is
20 / 126 / 25 / 175. The additions are one derived-avoidance producer, 33 event projections, one
experimental research consumer and 33 exact event→research bindings. The four new declaration
collections contain 33 semantic events, 33 eligibility rows, 15 reasons and one policy. These
numbers are derived from the literal sets above and must move together if the RFC returns to author;
they are not minimums.

- Inspectors continue to render admitted raw readings.
- Existing deterministic guidance and voice keep F1-proven byte behavior until F5 supplies a named
  module/policy and migrates them together.
- Compare keeps its registered raw strip until F6 or a follow-up gives that consumer a production
  policy; D78 remains open.
- Live markers keep `live-marker-quality` admission; event declarations do not make a marker live.
- F8 bot policy and F9 metrics later consume the same events under separate eligibility.
- F3 consumes event/source dependencies for migration planning but remains blocked by O6.

### 13. Implementation surface

The table enumerates **implementation areas**, total twelve; it does not claim twelve files. The
implementing plan replaces each area with exact symbols before coding.

| # | area | required change |
|---:|---|---|
| 1 | F1 contract/compiler | semantic-event and eligibility declarations, digest, error codes |
| 2 | source adapter seal | remove generic public constructor; exact adapter closure and runtime brand |
| 3 | structural event producer | signed relations for exactly the eleven round-trip families |
| 4 | transition identity core | preserve targets, pieces, rays, blockers, duties and destinations before count reduction |
| 5 | independent rules events | castling canonicalization, clock reset, last-of-role, pawn contact, checkmate and promotion |
| 6 | eligibility compiler | exact event→consumer disposition, fixture closure, valence refusal |
| 7 | alternative enumerator | legal children including four promotion roles and canonical castling |
| 8 | selector | family grouping, threshold, critical bypass, finite budget, order and empty reasons |
| 9 | research profile | executable R2 candidate only; impossible to bind to production learner consumers |
| 10 | verification | negative/non-vacuity fixtures, two-population reproduction, no-global-lift guard |
| 11 | capabilities/docs | manifest digest/count additions and `docs/semantic-evidence.md` |
| 12 | dependency report | read-only event→source output for F3; no corpus mutation |

## Resource claims and migration

No shared-resource claim. Semantic events, eligibility/selection reasons and selection policies
are extensible, independently versioned declarations in F1's manifest rather than a closed
vocabulary or global version. No
pack, run, shape-entry or principle-entry schema changes. No database migration. No
`EVIDENCE_KINDS` member. No content change.

If implementation discovers that replay correctness requires persisting selected packets, this RFC
returns to author and claims a run-schema lane before code continues. It may not add an unregistered
event or storage field en passant.

`measurement-records.md` remains independent: it specifies authored corpus-number provenance in
shape entries, not runtime semantic events. Its dirty working-tree state is neither absorbed nor
edited by this RFC.

## Deviations from design

None. Exact workflow defaults and budgets remain downstream, as O3/O4 require. F3 is deliberately
not paired with this draft because O6 remains unresolved (D680).

## Acceptance criteria

1. Semantic-event and eligibility declarations compile into the F1 manifest/digest; shuffled
   declaration order is stable and a separate generated registry is refused. The new manifest
   error codes are set-equal to §5's fifteen literals and every code has a failing fixture. The
   complete manifest/count tuple is exactly 20 producers / 126 projections / 25 consumers / 175
   bindings, plus 33 events / 33 eligibility rows / 15 reasons / one policy; capabilities and docs
   report the same tuple.
2. The §7 set is exactly 33 literal version-1 projection IDs (22 direct plus eleven derived
   avoidance projections) and is set-equal to executable declarations. Every event names and
   passes at least one positive and hard-negative fixture;
   deleting either raises `EVIDENCE_EVENT_UNVALIDATED`.
3. All seven refused structural families remain impossible to admit as learner events at current
   IDs; each negative fixture raises `EVIDENCE_EVENT_PROJECTION_REFUSED`.
4. Over R2's frozen 754-transition authored population, every new transition event retains the
   §7 operands while old count readings stay byte-identical. A slider fixture loses one required
   operand and raises `EVIDENCE_EVENT_OPERAND_MISSING`.
5. The legal `d4e5` multi-property control emits clock reset, last-of-role and pawn contact
   together. Castling, promotion and checkmate each have a positive and near-miss negative;
   imported/authored castling encodings yield the same event ID.
6. The same event can be eligible for one exact test consumer and refused for another; no wildcard
   compiles. The initial matrix contains exactly 33 eligibility rows, all targeting
   `research.semantic_selection@1`; no current production consumer gains an event binding. A raw
   count remains inspector-visible and learner-event refused simultaneously.
7. Gained/lost/preserved direct events and selector-derived `avoided` events carry no valence.
   `avoided` cannot be constructed by a direct producer; its declared derivation inputs are the
   exact numerator events and its operands retain the complete legal-alternative denominator.
   Attempts to derive valence from sign, rarity,
   global lift, Maia mass or Explorer frequency raise `EVIDENCE_EVENT_VALENCE_UNBACKED`.
8. `declareEvidence` is absent from runtime package exports. Package-level construction from
   caller IDs fails typecheck, a double-cast literal fails the runtime brand, and the closure census
   re-derives all fourteen current production files and permits generic construction only in the
   contract and named exact-adapter modules. The set is asserted equal, not as a minimum; a
   fifteenth direct call site fails.
9. On ordinary, castling, en-passant and four-promotion fixtures, selector alternatives are
   set-equal to chessops legal moves and every child FEN replays from its UCI.
10. The unchanged legacy R2 harness still reproduces its frozen authored/imported counts and
    108/108 rare-event retention. A separate F2 report runs the new eligible event set over those
    inputs and establishes its own named baseline; it may not claim the old 0.79/1.03 volumes as
    new-event output. The retained CC0 imported fixture has digest
    `a10a233e8e51f6a0877f65cee417339080d2fd32cd22886f755f576c84fa58ec`, fills all nine 12-game
    strata and yields 579 decisions; origin/range/digest metadata is executable. Any legacy or F2
    baseline change is explicit and population-digested.
11. Type/AST fixtures prove global lift, population rank and learned scores cannot enter the policy
    or comparator. Diagnostics require population ID, digest and date.
12. Permuting candidates and alternatives yields byte-identical selected IDs/reasons. Ties follow
    §9, and operand-coordinate changes do not change the family denominator. A double-cast result
    literal and a result with a valid event but mismatched consumer both fail the selected-view
    runtime assertion.
13. Played-family sensitivity covers 10/20/30%, alternative-only sensitivity covers
    null/20/30/40%, and caps cover 1/2/3. Cap changes volume, not eligibility;
    `maxFacts: 0` yields `budget_zero` with no implicit default. The R2 profile reproduces its
    1,032 authored and 522 imported alternative-only candidates before the shared budget. NaN,
    out-of-range shares, negative/fractional budgets, an absent consumer and an ineligible critical
    ID each fail policy compilation.
14. Each research critical ID bypasses only the minimum/share gate. A losing promotion gains no
    praise, a refused consumer gets none, and a three-event concurrency fixture with `maxFacts: 2`
    returns two in deterministic order plus one `critical_budget_exhausted` rejection.
15. All six §9 selection reasons are independently reachable; `critical_budget_exhausted` is
    demonstrated on a non-empty result while each applicable empty reason is demonstrated on an
    empty one. No renderer/LLM runs for empty output;
    absence prose can only be deterministic selector rendering.
16. Existing deterministic guidance, voice, inspector, Compare, Story and live-marker fixtures are
    byte-identical; no production consumer imports the research profile.
17. Pack/run/shape/principle schema versions, `STORAGE_VERSION`, `EVIDENCE_KINDS` and `content/`
    bytes are unchanged.
18. The read-only dependency report includes D632's `outpost` → `pawn_safe_square` and three
    affected documents but performs no rewrite and makes no O6/Gate-F claim.
19. `make semantic-evidence-check` runs in `make verify`; startup compiles the same declarations.
    `docs/semantic-evidence.md` documents raw reading vs event, eligibility vs selection, sign vs
    valence, empty output, adapter sealing and how F5 adds policy without a raw source setting.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | [[D572]] eligibility and local-selection half | `semantic-evidence-selection` | implementation commit | — |
| D2 | [[D630]] transition operand preservation | `semantic-evidence-selection` | implementation commit | — |
| D3 | [[D631]] semantic-event half; content migration remains F3 | `semantic-evidence-selection` | implementation commit | — |
| D4 | [[D633]] independent irreversibility events | `semantic-evidence-selection` | implementation commit | — |
| D5 | [[D660]] correction enforced: lift diagnostic, never selector authority | `semantic-evidence-selection` | implementation commit | — |
| D6 | [[D668]] generic payload constructor removed from package consumers | `semantic-evidence-selection` | implementation commit | — |
| D7 | [[D681]] no-global-lift negative fixture | `semantic-evidence-selection` | implementation commit | — |

## Open questions

No owner/product question blocks the draft. O2/O3 decide the semantic and selection boundaries.
Exact production thresholds, budgets, critical sets, module names and workflow defaults are F5's
consumer policy and owner-use validation, not hidden F2 questions.

Buildability review must re-derive the §7 event set, exact adapter/consumer census and R2
reproduction cost from HEAD. If any required event needs chess judgement, persistence or a schema
claim, it returns this RFC instead of filling the gap.

## Changelog

- 2026-08-21: created after F1 closeout and the D660/D680 readiness correction.
- 2026-08-21: first buildability review corrected direct-vs-derived event authority, the
  legal-alternative denominator, critical-budget semantics, legacy-R2 reproduction and the exact
  fourteen-file payload-seal migration.
- 2026-08-21: second buildability review made the initial 22 direct projection IDs exhaustive and
  moved `avoided` out of direct event signs into eleven denominator-bearing derived projections.
  This preserves F1's one-rendered-item/declared-evidence authority instead of inventing a parallel
  multi-source rendering object.
- 2026-08-21: accepted on the owner's direction to continue after the second review and D684's
  bounded external-fixture repair. No open product question remains inside F2; F5 still owns
  production thresholds, modules, presets and defaults.
