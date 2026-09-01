# RFC: Executable semantic-validation authority

- **Status:** draft — fifth author repair complete for [[D2445]]–[[D2448]]; **dependency-blocked on
  the owner-authorised empty-store bootstrap in [[D2449]]**, then another fresh independent
  review. The repair defines every proposition reference and resolved record, replaces wildcard
  cherry-picking with whole-value collection equality, derives owner chronology from repository
  transitions, and rejects duplicate root/declaration/profile/verdict subjects before equality.
  `make semantic-validation-fifth-author-repair` is the positive author contract. No runtime
  validation or learner eligibility implementation is authorized.
- **Author:** codex, executing [[D1711]] / [[D1713]] / [[D1714]] after refreshing both research
  instruments at HEAD
- **Created:** 2026-08-29
- **Design refs:** `design/03-product-breadth.md` (Support, Review, bots, Learn and Create);
  `design/04-content-architecture.md` (grounded predicates); `design/05-in-run-experience.md`
  (validated evidence and assistance ceilings)
- **Exploration gate:** complete in `design/research/semantic-validation-closure.md`,
  `design/research/semantic-validation-migration-matrix.md`,
  `design/research/semantic-authority-empty-execution.md` and their D1711/D1713/D1714 harnesses
- **Depends on:** implemented F1/F2 evidence contract and catalogue. The authority mechanism and
  already-valid cases may land independently; full validation of the avoidance and opposition
  families depends on the accepted successors owned by [[D1716]] and [[D1717]]. Multi-edge cases
  depend on the accepted recorded-path operation before they may count as emitter-level negatives.
  An unavailable-aware application reach for loose-piece evidence depends on the accepted
  `shared-candidate-evidence-packet` result algebra ([[D1981]]). The held
  `derived.pawn.promotion_race_tablebase@1` event from `semantic-collectors` must add its profile,
  cases and explicit required verdict atomically with that projection; no literal cardinality may
  prevent or silently bypass that transition. **Slice E additionally depends on accepted and
  implemented `evidence-value-authority`: Slice A may record validation debt first, but no learner
  event instance is admitted until its package-private `EvidenceValueReceipt` proves the sole
  projection factory and exact payload/input digests.**
- **Parent / amends:** living successor to the immutable implemented evidence contract; changes
  `SemanticEventDeclaration.validation` from self-generated labels to a compiled profile reference
- **Planning:** `planning/semantic-validation-authority/`

```tabiya-claims
none
```

**Why `none`.** This RFC changes runtime declarations, test authority, a generated build receipt
and eligibility compilation. It adds no durable run, pack, shape, principle, database or evidence-
kind field. Validation receipts are build artefacts, not learner records.

## Summary

The evidence catalogue currently calls every one of its 67 semantic events validated without
executing one chess predicate. Each declaration manufactures two plausible strings from its own
projection id. The compiler checks that the strings are non-empty. The generic test manufactures
operands from the same declaration, calls `declareEvidence` directly, and regenerates the same
strings. Zero of 134 labels resolves to an executable case.

This RFC replaces that circular claim with four independent authorities:

1. a **total validation profile** says what each event must prove;
2. an **executable case registry** supplies legal inputs and expected observations without being
   able to inject a callback or pre-built evidence;
3. a closed **production-operation registry** invokes the real emitter/deriver; and
4. a generated **validation receipt** records exactly what ran, what implementation and input bytes
   ran, and which required arms passed.

Only a passing required profile can enter a learner-facing module, Review selection, bot feature,
skill metric or longitudinal aggregation. Explicit operator research and Advanced inspection can
retain unvalidated source facts; the compiler must make that difference impossible to omit.

This is not a new chess classifier. It is the gate that makes the classifiers already claimed by
the platform able to fail before their output is multiplied through every product surface.

## 1. Current measured boundary

The author checkpoint runs through repository-owned commands:

```sh
make semantic-validation-closure semantic-validation-matrix
```

At 2026-08-29 HEAD they report:

- 67 semantic declarations and 134 generated labels;
- zero independent referents for those labels;
- 66 projection ids named somewhere outside the generic census, but only 27 in permanent runtime
  tests; literal naming is trace evidence, not validation;
- 39 valid production-emitter positives;
- 10 valid production-emitter semantic negatives plus 13 lower-predicate negatives that still need
  elevation through the emitter;
- zero emitter-level mirror/orientation cases;
- one emitter-level counterfactual case;
- 23 current event roots observed in the retained imported result and 44 absent;
- eight external-labelled disagreement studies; and
- seven avoidance events with no valid authority in any arm because their current subject relation
  is known unsound.

These integers are a dated author checkpoint, not a landing cardinality. The live projection-derived
root set is always the authority. In particular, the held promotion-race tablebase event makes the
future cardinality 68 if it lands first; its producing commit must atomically add a profile and an
explicit not-yet-passing verdict, and the semantic-validation implementation must accept that larger
set without an author changing a magic number.

The 2026-08-26 dossier's 54/13 literal-name split is superseded by the refreshed 66/1 split. The
substantive verdict does not move: no declaration resolves a validation id and no consumer reads an
executed validation result.

## 2. Independent root inventory

The closed population is not another copied list. `compileEvidenceManifest` derives the semantic
root inventory as the union of every active event projection satisfying all of:

```ts
projection.role === "event"
projection.disposition === undefined
projection.forms.includes("machine_condition")
```

and the explicit `SEMANTIC_READING_VALIDATION_ROOTS`. A reading root is admitted only when the
projection is active, has role `reading`, includes `machine_condition`, resolves an exact sole
factory through `evidence-value-authority`, and its owning accepted RFC requires executable chess-
semantic validation. The literal register contains only versioned projection refs; its compiler
derives operation/case/population authority through the same profile algebra as events. Removing a
registered reading profile, adding an unregistered reading profile, registering a projection with
no sole factory or changing its role/form fails root set equality. This is an explicit opt-in, not
permission to call every reading validated.

`bounded-policy-targets` owns the first two reading roots:
`derived.bounded_target.named_material_target@1` and
`derived.bounded_target.bounded_return@1`. Its event projection
`derived.bounded_target.immediate@1` enters through the ordinary event derivation. All three use
the same profile/case/receipt/oracle rules; construction provenance alone never passes a semantic
cell.

The compiler then asserts set equality, independently and in both directions, among:

- those active event roots plus the explicit admissible reading roots;
- `SemanticEventDeclaration.projection`;
- `SemanticValidationProfile.event`;
- the generated receipt's event rows; and
- every validation case's event reference.

Cases may be a subset only where a profile cell is explicitly `required` and therefore still open;
they may never name an event outside the root set. A declaration and profile that omit the same
event still fail against the projection-derived root inventory. `SEMANTIC_EVENT_PROJECTION_IDS`
remains a public convenience export but stops being the authority from which both sides are
generated.

The existing `SEMANTIC_EVENT_DECLARATIONS = SEMANTIC_EVENT_PROJECTION_IDS.map(...)` construction is
deleted. Declarations become a literal checked register or one generated from a different literal
source whose output is checked against the projection-derived roots; under neither form may a
validation id be interpolated from the event id.

## 3. Total validation profiles

### 3.1 Closed arms and cells

```ts
type SemanticValidationArm =
  | "positive"
  | "semantic_negative"
  | "orientation"
  | "counterfactual"
  | "imported_population"
  | "external_label";

type SemanticValidationCaseArm = Exclude<
  SemanticValidationArm,
  "imported_population" | "external_label"
>;

type SemanticValidationPresentRef<A extends SemanticValidationArm> =
  A extends "imported_population" ? SemanticPopulationReceiptRef
  : A extends "external_label" ? SemanticExternalDisagreementReceiptRef
  : A extends SemanticValidationCaseArm ? SemanticValidationCaseRef<A>
  : never;

type SemanticValidationCell<A extends SemanticValidationArm> =
  | { readonly disposition: "present"; readonly refs: readonly SemanticValidationPresentRef<A>[] }
  | {
      readonly disposition: "required";
      readonly owner: string;
      readonly discharge: string;
    }
  | {
      readonly disposition: "not_applicable";
      readonly reason:
        | "literal_or_observed_event_makes_no_alternative_claim"
        | "no_independent_external_taxonomy"
        | "external_labels_are_not_truth_authority";
    };

interface SemanticValidationProfile {
  readonly event: VersionedEvidenceId;
  readonly positive: SemanticValidationCell<"positive">;
  readonly semanticNegative: SemanticValidationCell<"semantic_negative">;
  readonly orientation: SemanticValidationCell<"orientation">;
  readonly counterfactual: SemanticValidationCell<"counterfactual">;
  readonly importedPopulation: SemanticValidationCell<"imported_population">;
  readonly externalLabel: SemanticValidationCell<"external_label">;
}
```

Every profile carries all six keys. An empty `refs` array is invalid. A case arm can reference only
a same-event, same-arm executable case; imported population can reference only a versioned
population receipt; external label can reference only a versioned disagreement receipt. Each
parser rejects extra keys, stale versions and a ref whose event differs from the profile. A
`required` cell is honest debt and makes the event unvalidated. `not_applicable` needs one closed
reason and is never inferred from absence.

### 3.2 Requirement law

The literal profile is set-equal to the live event-root inventory, compiled from these author
decisions and checked as a generated exhibit; the rules do not replace the rows:

| arm | 1.0 requirement |
|---|---|
| positive | required for every live event root; at least one legal input must make the production operation emit the exact event/version |
| semantic negative | required for every live event root; at least one nearby legal input must reach the same operation and omit the exact event for a chess-semantic reason |
| orientation | required for every live event root; chess coordinates, colors, directions, roles and identities are orientation-sensitive even when the final value is a count |
| counterfactual | required for all thirteen `derived.semantic_avoidance.*` events and `rules.tactic.consequence.reply_breadth`; not applicable to literal state changes and recorded-path-only observations because those projections make no all-alternative claim |
| imported population | required for every live event root as an execution/census arm; a zero positive count is valid when denominator and result identity are retained, but it cannot satisfy the positive arm |
| external label | present for the eight D872 disagreement families; `not_applicable(no_independent_external_taxonomy)` for every other live root. Even the eight cases are calibration evidence and never substitute for a positive or negative |

An implementation may discover that another event makes a real counterfactual claim. That is an
author return, not permission to mark the cell not applicable. Conversely a fixture author cannot
invent an external taxonomy merely to eliminate a `not_applicable` cell.

### 3.3 Migration status is not validation

The D1713 matrix becomes the migration source, not a permanent second register:

- its 39 `event_emitter` positives may become `present` after their assertions are moved into the
  executable registry without weakening them;
- its ten emitter negatives may become `present` the same way;
- thirteen source-predicate negatives stay `required` until the real event operation executes;
- four source-only orientation cases stay `required` until elevated;
- population observations become historical comparison inputs, not current receipts; and
- the seven D1716-blocked avoidance witnesses stay `required`, never `present`.

The implementation log reports the exact profile disposition counts after each family slice. No
percentage is called “validated”; the unit is a named event whose complete required profile passes.

## 4. Executable case registry

### 4.1 Cases are data, operations own execution

`packages/runtime/src/semantic-validation-cases.ts` exports a literal registry. A case cannot carry
an `execute`, `emit`, `expectedEvidence`, `DeclaredEvidence`, `SemanticEvidenceEvent` or arbitrary
function member.

```ts
type SemanticValidationOperationId =
  | "runtime.semantic.local_edge"
  | "runtime.semantic.structural_edge"
  | "runtime.semantic.transition_edge"
  | "runtime.semantic.breadth_edge"
  | "runtime.semantic.duty_edge"
  | "runtime.semantic.recorded_path"
  | "runtime.semantic.recorded_sequence"
  | "runtime.semantic.complete_alternatives";

interface SemanticEdgeInput {
  readonly kind: "edge";
  readonly beforeFen: string;
  readonly moveUci: string;
  readonly afterFen: string;
}

interface SemanticRecordedPathInput {
  readonly kind: "recorded_path";
  readonly pathReceipt: VersionedEvidenceId; // exactly run.record.edge@1
  readonly edges: readonly SemanticEdgeInput[]; // non-empty, contiguous, canonical
  readonly pathDigest: string;
}

type SemanticSequenceFamily =
  | "trade_completed"
  | "pawn_contact_timing"
  | "harassment_pressure"
  | "defender_consequence"
  | "deflection"
  | "attraction"
  | "line_clearance"
  | "square_clearance"
  | "interference"
  | "checking_zwischenzug"
  | "overload_exploitation";

interface SemanticRecordedSequenceInput {
  readonly kind: "recorded_sequence";
  readonly path: SemanticRecordedPathInput;
  readonly family: SemanticSequenceFamily;
  readonly fromPly: number;
  readonly horizon: 2 | 3 | 4 | 5;
}

interface SemanticCompleteAlternativesInput {
  readonly kind: "complete_alternatives";
  readonly rootFen: string;
  readonly played: SemanticEdgeInput;
  readonly alternatives: readonly SemanticEdgeInput[]; // exact legal UCI set, includes played
  readonly legalSetDigest: string;
}

type SemanticValidationOperationInputMap = {
  readonly "runtime.semantic.local_edge": SemanticEdgeInput;
  readonly "runtime.semantic.structural_edge": SemanticEdgeInput;
  readonly "runtime.semantic.transition_edge": SemanticEdgeInput;
  readonly "runtime.semantic.breadth_edge": SemanticEdgeInput;
  readonly "runtime.semantic.duty_edge": SemanticEdgeInput;
  readonly "runtime.semantic.recorded_path": SemanticRecordedPathInput;
  readonly "runtime.semantic.recorded_sequence": SemanticRecordedSequenceInput;
  readonly "runtime.semantic.complete_alternatives": SemanticCompleteAlternativesInput;
};

type SemanticValidationOperationResultMap = {
  readonly [K in SemanticValidationOperationId]: SemanticValidationOperationResult;
};

type SemanticValidationOperationRef<K extends SemanticValidationOperationId = SemanticValidationOperationId> =
  { readonly id: K; readonly version: 1 };
type SemanticValidationOperationInput<K extends SemanticValidationOperationId> =
  SemanticValidationOperationInputMap[K];

interface SemanticValidationCaseRef<A extends SemanticValidationCaseArm = SemanticValidationCaseArm> {
  readonly kind: "case";
  readonly id: string;
  readonly version: 1;
  readonly event: VersionedEvidenceId;
  readonly arm: A;
}

type SemanticValidationCaseFor<K extends SemanticValidationOperationId> = {
  readonly id: string;
  readonly version: 1;
  readonly event: VersionedEvidenceId;
  readonly arm: SemanticValidationCaseArm;
  readonly operation: SemanticValidationOperationRef<K>;
  readonly input: SemanticValidationOperationInput<K>;
  readonly authority: SemanticValidationCaseAuthority;
  readonly expectation: SemanticValidationExpectation;
};

type SemanticValidationCase = {
  readonly [K in SemanticValidationOperationId]: SemanticValidationCaseFor<K>
}[SemanticValidationOperationId];

type SemanticValidationExpectation =
  | { readonly kind: "emits"; readonly minimum: 1; readonly operandMatch?: Readonly<Record<string, unknown>> }
  | { readonly kind: "abstains"; readonly reason: SemanticValidationUnavailableReason }
  | { readonly kind: "omits" }
  | {
      readonly kind: "mirrors";
      readonly partnerCase: SemanticValidationCaseRef;
      readonly geometry: "vertical" | "horizontal" | "color_and_vertical";
      readonly targetEvents: { readonly nonEmpty: true; readonly pairing: "canonical_subject_sign_operands" };
      readonly operandRules: readonly SemanticMirrorOperandRule[];
    };

type SemanticValidationUnavailableReason =
  | "source_predicate_unavailable"
  | "recorded_path_incomplete"
  | "complete_alternative_population_unavailable";

type SemanticOperandPathSegment = string | "*";
interface SemanticMirrorOperandRule {
  readonly sourcePath: readonly SemanticOperandPathSegment[];
  readonly partnerPath: readonly SemanticOperandPathSegment[];
  readonly value:
    | "identity"
    | "square"
    | "color"
    | "signed_file_delta"
    | "signed_rank_delta";
  readonly collection: "scalar" | "ordered" | "canonical_set";
}

type SemanticValidationOracleId =
  | "rules.legal_successor"
  | "rules.attack_map"
  | "rules.material_ledger"
  | "rules.line_occupancy"
  | "rules.complete_legal_set"
  | "rules.tablebase_result";

type SemanticValidationOracleRequestMap = {
  readonly "rules.legal_successor": SemanticEdgeInput;
  readonly "rules.attack_map": {
    readonly kind: "attack_map"; readonly fen: string; readonly square: string;
    readonly by: "white" | "black";
  };
  readonly "rules.material_ledger": {
    readonly kind: "material_ledger"; readonly fen: string;
  };
  readonly "rules.line_occupancy": {
    readonly kind: "line_occupancy"; readonly fen: string;
    readonly from: string; readonly to: string;
  };
  readonly "rules.complete_legal_set": SemanticCompleteAlternativesInput;
  readonly "rules.tablebase_result": {
    readonly kind: "tablebase_result"; readonly fen: string;
    readonly tablebaseReceipt: VersionedEvidenceId;
  };
};

type SemanticValidationOracleFactMap = {
  readonly "rules.legal_successor": {
    readonly kind: "legal_successor"; readonly legal: boolean; readonly canonicalAfterFen: string;
  };
  readonly "rules.attack_map": {
    readonly kind: "attack_map"; readonly attacked: boolean; readonly attackers: readonly string[];
  };
  readonly "rules.material_ledger": {
    readonly kind: "material_ledger"; readonly pieces: readonly {
      readonly color: "white" | "black"; readonly role: string; readonly square: string;
    }[];
  };
  readonly "rules.line_occupancy": {
    readonly kind: "line_occupancy"; readonly aligned: boolean; readonly blockers: readonly string[];
  };
  readonly "rules.complete_legal_set": {
    readonly kind: "complete_legal_set"; readonly legalUci: readonly string[];
    readonly legalSetDigest: string;
  };
  readonly "rules.tablebase_result": {
    readonly kind: "tablebase_result"; readonly category: "win" | "draw" | "loss";
    readonly dtz: number | null;
  };
};

type SemanticValidationOracleResultMap = {
  readonly [K in SemanticValidationOracleId]: SemanticValidationOracleFactMap[K];
};

type SemanticValidationOracleRef<K extends SemanticValidationOracleId = SemanticValidationOracleId> = {
  readonly id: K;
  readonly version: 1;
};

interface SemanticValidationOracleWitnessRef {
  readonly id: string;
  readonly version: 1;
  readonly oracle: SemanticValidationOracleRef;
  readonly case: { readonly id: string; readonly version: 1 };
  readonly event: VersionedEvidenceId;
}

type SemanticValidationOracleWitnessFor<K extends SemanticValidationOracleId> = {
  readonly id: string;
  readonly version: 1;
  readonly oracle: SemanticValidationOracleRef<K>;
  readonly case: { readonly id: string; readonly version: 1 };
  readonly event: VersionedEvidenceId;
  readonly request: SemanticValidationOracleRequestMap[K];
};

type SemanticValidationOracleWitness = {
  readonly [K in SemanticValidationOracleId]: SemanticValidationOracleWitnessFor<K>
}[SemanticValidationOracleId];

type SemanticCanonicalScalar = string | number | boolean | null;
type SemanticCanonicalValue =
  | SemanticCanonicalScalar
  | readonly SemanticCanonicalValue[]
  | { readonly [key: string]: SemanticCanonicalValue };

interface SemanticValidationFactConstraint {
  readonly path: readonly string[];
  readonly comparison: "scalar" | "ordered" | "canonical_multiset";
  readonly equals: SemanticCanonicalValue;
}

interface SemanticValidationPropositionRecord {
  readonly subject: SemanticValidationSubject;
  readonly case: { readonly id: string; readonly version: 1 };
  readonly factConstraint: readonly SemanticValidationFactConstraint[];
  readonly factConstraintSha256: string;
  readonly expectation: SemanticValidationExpectation;
}

interface SemanticValidationExistingAssertionAuthority {
  readonly kind: "existing_assertion";
  readonly matrixRow: string;
  readonly testSite: `${string}.test.ts#${string}`;
  readonly sourceSha256: string;
  readonly frozenExpectationSha256: string;
}
interface SemanticValidationResolvedExistingAssertionAuthority {
  readonly kind: "existing_assertion";
  readonly ref: SemanticValidationExistingAssertionAuthority;
  readonly proposition: SemanticValidationPropositionRecord;
}

interface SemanticValidationCitedPropositionAuthority {
  readonly kind: "cited_proposition";
  readonly sourceId: string;
  readonly sourceRevision: string;
  readonly licence: string;
  readonly span: { readonly start: number; readonly end: number; readonly textSha256: string };
  readonly propositionSha256: string;
}
interface SemanticValidationResolvedCitedPropositionAuthority {
  readonly kind: "cited_proposition";
  readonly ref: SemanticValidationCitedPropositionAuthority;
  readonly proposition: SemanticValidationPropositionRecord;
}

interface SemanticValidationOwnerAuthorityRef {
  readonly kind: "owner_authored";
  readonly id: string;
  readonly version: 1;
}
interface SemanticValidationResolvedOwnerAuthority {
  readonly kind: "owner_authored";
  readonly ref: SemanticValidationOwnerAuthorityRef;
  readonly rowSha256: string;
  readonly proposition: SemanticValidationPropositionRecord;
}

type SemanticValidationPropositionAuthority =
  | SemanticValidationExistingAssertionAuthority
  | SemanticValidationCitedPropositionAuthority
  | SemanticValidationOwnerAuthorityRef;
type SemanticValidationResolvedPropositionAuthority =
  | SemanticValidationResolvedExistingAssertionAuthority
  | SemanticValidationResolvedCitedPropositionAuthority
  | SemanticValidationResolvedOwnerAuthority;

declare function parseSemanticValidationExistingAssertionAuthority(
  value: unknown,
): SemanticValidationExistingAssertionAuthority;
declare function parseSemanticValidationCitedPropositionAuthority(
  value: unknown,
): SemanticValidationCitedPropositionAuthority;
declare function parseSemanticValidationOwnerAuthorityRef(
  value: unknown,
): SemanticValidationOwnerAuthorityRef;
declare function resolveSemanticValidationExistingAssertionAuthority(
  ref: SemanticValidationExistingAssertionAuthority,
): SemanticValidationResolvedExistingAssertionAuthority;
declare function resolveSemanticValidationCitedPropositionAuthority(
  ref: SemanticValidationCitedPropositionAuthority,
): SemanticValidationResolvedCitedPropositionAuthority;
declare function resolveSemanticValidationOwnerAuthority(
  ref: SemanticValidationOwnerAuthorityRef,
): SemanticValidationResolvedOwnerAuthority;

type SemanticValidationCaseAuthority =
  | SemanticValidationExistingAssertionAuthority
  | {
      readonly kind: "rules_and_proposition";
      readonly oracle: SemanticValidationOracleRef;
      readonly witness: SemanticValidationOracleWitnessRef;
      readonly proposition: SemanticValidationPropositionAuthority;
      readonly factConstraint: readonly SemanticValidationFactConstraint[];
    }
  | SemanticValidationCitedPropositionAuthority
  | SemanticValidationOwnerAuthorityRef;
```

`parseSemanticValidationExistingAssertionAuthority`,
`parseSemanticValidationCitedPropositionAuthority` and
`parseSemanticValidationOwnerAuthorityRef` are strict reference parsers. Their three resolvers
return only the corresponding `SemanticValidationResolved*` arm; callers cannot submit a resolved
record. The resolvers import their fixed package-owned stores; none accepts a caller-supplied
lookup, payload or proposition. `resolveSemanticValidationProposition` normalizes all three arms to the one closed
`SemanticValidationPropositionRecord` and re-derives `factConstraintSha256` from its canonical
constraint bytes. The runner then requires exact subject, case, constraint and expectation equality
against the containing case. A parser or resolver that omits any of those four bindings is a
compile-time and permanent-fixture failure.

Authority is not decorative provenance. An `existing_assertion` is legal only for a row already
classified valid in the D1713 migration matrix; its expectation bytes must remain identical while
being moved, and the test site plus source digest must resolve. A `rules_and_proposition` authority
resolves exactly one sealed row in `SEMANTIC_VALIDATION_ORACLE_WITNESSES` and one independently
grounded proposition. The witness is distributive on
`oracle.id`: its request must inhabit `SemanticValidationOracleRequestMap[K]`, its oracle/case/event
refs must equal the authority row and containing case, and all ids use the base-id-plus-version
grammar. Witness bytes, not only their digest, remain available to the runner; the generated receipt
retains their canonical digest.

The closed oracle operation registry accepts only its corresponding request and returns
`SemanticValidationOracleResultMap[K]`. That result is a neutral fact and has no expectation arm.
The runner derives its digest, evaluates the case's declared constraints, resolves the separate
proposition, and requires the resolved proposition record to match the containing case. Neither the
authority row nor witness may supply a result digest or alternate expectation. A fact computed for
a different case/event or wrong oracle grain fails before proposition resolution.

Oracle implementations may import the pinned chess-rules library and tablebase receipt validators,
but their complete static import graph must exclude the semantic event operation, its predicate
helper, case registry, case expectation bytes and every semantic-event constructor. The oracle
registry itself contains no callback supplied by a case. Its permanent tests cross each request and
result discriminant, while cited/owner authority remains necessary for any new chess-semantic
mapping not mechanically entailed by the independent rules result. The runner derives
`witnessSha256` and `resultSha256`; an author cannot submit either digest as a substitute for
execution.

A `cited_proposition` resolves through the immutable source manifest and exact revision/span rules;
the proposition digest is bound to the case expectation. `owner_authored` resolves to a committed
owner-authored authority row whose two digests match; Codex cannot create or amend that receipt.
Unknown authority kinds, an unresolved source/test/receipt, a shared oracle/production dependency,
or any expectation edit under `existing_assertion` fails `SEMANTIC_VALIDATION_AUTHORITY_INVALID`.
The missing 28 positives, 44 semantic negatives and orientation cases therefore remain `required`
until one of these authorities exists. Building a runner is not authority to fill them.

`semanticValidationOperationRef(id)`, `semanticValidationCaseRef(case)` and
`parseSemanticValidationCase(value)` are the only constructors/parsers. The parser is strict and
uses `operation.id` to select the corresponding input arm before checking exact keys. An edge
operation with a path, a path operation with an edge, a sequence with the wrong horizon/family, a
complete-alternative request whose canonical legal set differs by one move, and a case ref whose
event/arm/version differs from its target all fail `SEMANTIC_VALIDATION_OPERATION_INPUT_INVALID` or
`SEMANTIC_VALIDATION_CASE_REF_STALE` before execution. No `as SemanticValidationOperationInput`
cast exists at a registry boundary.

Case ids are independent author-chosen base ids such as `castled.standard-white.positive`, with
`version: 1` carried separately, never
`semantic-event:${projection}:positive`. The compiler rejects an id equal to or containing the
event id as a generated suffix/prefix template. Every operation, case, population, external and
oracle parser also rejects an id ending in `@<integer>`; stale identity is represented only by the
numeric `version`. This is a cheap guard, not the independence proof; the closed input type and
operation lookup are the proof.

Every edge input retains canonical before FEN, canonical UCI and canonical after FEN. The runner
checks the move is legal, the after position is the exact successor and the UCI dialect is canonical
before invoking an operation. Recorded-path inputs retain a complete ordered edge receipt and are
invalid until the shared recorded-path compiler accepts them. A malformed operand is therefore an
invalid fixture, never a semantic negative.

Mirror partners are also input-bound. The partner's before FEN, UCI and after FEN must equal the
canonical transformation of the source input under `geometry` before either operation runs.
`horizontal` maps files `a↔h`; `vertical` maps ranks `1↔8`; `color_and_vertical` maps ranks and
swaps piece/turn/castling colors. En-passant and castling fields are transformed with the same board
mapping; an illegal transformed edge is an invalid fixture, never a passing mirror.

`operandRules` is not a string dictionary. Paths address object keys, and `*` addresses every member
of one array level. `square` applies the case geometry; `color` swaps only for
`color_and_vertical`; signed file/rank deltas negate exactly when their corresponding axis is
mirrored; `identity` compares canonical JSON bytes. `ordered` preserves index, while
`canonical_set` transforms each member then sorts by canonical JSON. Source and partner paths must
resolve with equal arity. Every scalar operand leaf on both target events is covered exactly once;
overlap, an unmatched leaf, an unresolved wildcard or an arbitrary transform name fails
`SEMANTIC_VALIDATION_ORIENTATION_SCHEMA`. This closed walk is the one comparator used by cases and
receipts; event-specific comparison callbacks are forbidden.

The leaf walk begins only after event-level pairing succeeds. The runner selects the exact target
projection/version from each completed result and requires both target populations to be non-empty.
For each target event it constructs the pairing key as canonical JSON of exactly
`{ projection, sign, operands }` after applying `geometry` through the total `operandRules` walk.
Subject identity is therefore the complete subject-bearing operand data, never an implementer-picked
subset. Event id, anchor and evidence-receipt metadata are retained in the receipt but are not
semantic pairing keys. The runner compares the two canonical target-event multisets, pairs equal
keys independent of emission order, and requires exactly one source and one partner per key.

Zero/zero fails `SEMANTIC_VALIDATION_MIRROR_EMPTY`; zero/non-zero or unequal cardinality fails
`SEMANTIC_VALIDATION_MIRROR_MISMATCH`; duplicate keys fail
`SEMANTIC_VALIDATION_MIRROR_AMBIGUOUS`; and an unmatched transformed key fails
`SEMANTIC_VALIDATION_MIRROR_UNMATCHED`. Only then does the runner apply the exhaustive leaf rules
inside each unique pair. Reordering equal events passes; deleting, duplicating, changing the subject,
changing a sign field or changing one operand cannot pass by preserving the aggregate count.

### 4.2 Closed operation results

Every registry invocation returns one result algebra:

```ts
type SemanticValidationOperationResult =
  | {
      readonly kind: "completed";
      readonly events: readonly SemanticEvidenceEvent<unknown>[];
    }
  | {
      readonly kind: "unavailable";
      readonly reason: SemanticValidationUnavailableReason;
    };
```

`SemanticEvidenceEvent.evidence` is not sufficient authority by itself. Once
`evidence-value-authority` lands, the runner calls the package-private
`evidenceValueReceipt(event.evidence)` and consumes its exact closed result:

```ts
interface EvidenceValueReceipt {
  readonly projection: VersionedEvidenceId;
  readonly factory: string;
  readonly inputDigest: string;
  readonly payloadDigest: string;
  readonly sourceDigests: readonly string[];
}
```

This interface is owned by `evidence-value-authority`; it is repeated here only as the exact
dependency seam and is not a second declaration. For every target event in a completed result, the
receipt projection must equal the event projection/version, `payloadDigest` must equal the sealed
payload's canonical digest, and `factory` must equal the catalogue's sole registered factory for
that projection. The runner records factory, input, payload and source digests in the case receipt.
A missing receipt, a caller-minted wrapper, a different factory, a swapped payload, or a second live
factory route fails `SEMANTIC_VALIDATION_VALUE_AUTHORITY_MISSING`; it can never be interpreted as an
empty or negative result.

Before that dependency is implemented, profiles and grounded cases may be registered as Slice-A
debt, but no event verdict can become `passed`. Semantic validation does not validate every historic
mint route: the value-authority migration first collapses each projection to its one factory, and
this runner then validates that production factory path. The landing order is: accept this
profile/case protocol; implement the value-authority factory boundary; execute semantic profiles;
then release consumers. The last two may share an implementation checkpoint, but consumer release
is the last step in either order.

An array-returning production export can produce only `completed`, including an honestly empty
array. A registry adapter may produce `unavailable` only by mapping the production export's native
typed unavailable/`undefined` arm, never by inspecting an empty event array or catching an error.
The adapter and mapping are part of the operation implementation digest. `abstains` passes only when
the operation returns `unavailable` with the exact closed reason; `omits` passes only on `completed`
with zero target events. Exceptions and malformed inputs are failed executions.

This deliberately exposes the current loose-piece seam: `loosePieceSemanticEvents` can map its
native `undefined` to `source_predicate_unavailable`, while `localSemanticEvents` erases it through
`?? []`. Until [[D1981]] supplies an unavailable-aware application operation and the reach check
below passes, loose-piece cases may be retained as migration evidence but cannot confer a passing
learner-eligibility verdict.

### 4.3 Closed production operations

`packages/runtime/src/semantic-validation-operations.ts` owns the only function registry. It maps
versioned operation ids to production exports already used by the application, including:

- `runtime.semantic.local_edge` version 1 → `localSemanticEvents`;
- `runtime.semantic.structural_edge` version 1 → `structuralSemanticEvents`;
- `runtime.semantic.transition_edge` version 1 → `transitionSemanticEvents`;
- `runtime.semantic.breadth_edge` version 1 → `breadthSemanticEvents`;
- `runtime.semantic.duty_edge` version 1 → `semanticDutyEvents`;
- `runtime.semantic.recorded_path` version 1 → the accepted total recorded-path operation; and
- `runtime.semantic.recorded_sequence` version 1 → the production sequence dispatcher over a sealed
  recorded-path receipt and one closed `SemanticSequenceFamily`; and
- `runtime.semantic.complete_alternatives` version 1 → the production all-legal-successors dispatcher over
  the exact canonical legal set.

The case registry selects an operation id and supplies its serializable input; it cannot replace
the function. Each operation declaration retains the production symbol, result adapter and a
complete sorted list of implementation files whose bytes determine `implementationDigest`. It also
declares one application reach:

```ts
type SemanticValidationApplicationReach =
  | { readonly kind: "direct" }
  | {
      readonly kind: "exact_projection_multiset";
      readonly through: SemanticValidationOperationRef;
      readonly projections: readonly VersionedEvidenceId[];
    }
  | {
      readonly kind: "required";
      readonly owner: string;
      readonly discharge: string;
    };
```

`direct` is legal only for an operation called by a non-test application module. A narrower
structural/transition/breadth/duty operation uses `exact_projection_multiset` through
`runtime.semantic.local_edge` version 1: on every case, the runner invokes both and proves the canonical
multiset of the declared projections is byte-equal after composition. Sequence operations do the
same through the accepted recorded-path application operation. A `required` reach is honest debt
and can execute for migration purposes but cannot pass an event profile. This is how the current
loose-piece erasure remains visible rather than being certified through its child export.

The compiler derives non-test application callers and operation-to-operation composition from the
TypeScript import/call graph and checks the reach declaration in both directions. A direct child
call that is spread into a parent still needs the multiset execution; a symbol merely exported from
`packages/runtime` is not an application caller. Replacing, filtering or erasing one child event is
an able-to-fail reach fixture.

A source file named by an operation but missing from the digest set fails. Adding a new imported
local source to an operation without updating its file closure fails a static import-graph check.
External package bytes are represented by the lockfile digest plus exact package version.

`compileSemanticEvidenceEvent` and `declareEvidence` are explicitly forbidden operation targets.
They validate sealed payload structure after a predicate has already decided what to emit and
therefore cannot establish chess semantics.

### 4.4 Reach and non-vacuity

Every execution records:

- operation id/version and invocation count;
- input identity and legality verdict;
- every emitted projection/version and canonical operand digest;
- target positive count;
- target negative count;
- abstention or invalid-fixture reason; and
- duration as diagnostic evidence only.

A positive passes only with one invocation and target count ≥ 1. A semantic negative passes only
with one invocation, a valid legal input and target count = 0. `omits` does not require the entire
operation to return an empty list; unrelated events may honestly fire. A case that never reaches
the operation fails independently of its expected count.

## 5. Population and external receipts

### 5.1 Population receipt

The sole 1.0 population input is the committed
`tools/r2-selection-harness/imported-sample.pgn`, authenticated by
`tools/r2-selection-harness/fixture.json`: CC0-1.0 Lichess July-2026 standard rated games, exact
source URL/range, fixture SHA-256, 108 games, nine 12-game speed/rating strata and 579 sampled
decisions. The build-only reader `tools/semantic-validation-population.ts` parses that exact PGN,
fails unless every manifest count and digest reproduces, and emits three sealed projections from
the same games:

1. `sampled_edges`: canonical mainline edges at plies 8/16/24/32/40/48 when present (579);
2. `recorded_paths`: every complete legal mainline, preserving stable site+ply identities; and
3. `complete_alternatives`: every legal UCI successor, including all four promotion roles, for each
   sampled edge's before FEN, sorted by canonical UCI.

Each operation declaration names exactly one compatible population projection. Edge operations run
over all `sampled_edges`; recorded-path operations run every applicable ordered window from
`recorded_paths`; counterfactual operations run the played edge plus its entire
`complete_alternatives` set. No case, profile or implementer supplies a population path or subset.
Changing the target plies, stratum filter, window enumeration or legal-alternative enumeration is
an input-version change and produces a new population id, not an in-place receipt refresh.

The imported-population runner invokes the current production operation and its application-reach
check over that frozen population. Its receipt is per event/version and retains:

```ts
interface SemanticPopulationReceiptRef {
  readonly kind: "population_receipt";
  readonly id: string;
  readonly version: 1;
  readonly event: VersionedEvidenceId;
  readonly inputVersion: 1;
  readonly resultVersion: 1;
}

interface SemanticPopulationReceipt {
  readonly id: string;
  readonly version: 1;
  readonly event: VersionedEvidenceId;
  readonly operation: SemanticValidationOperationRef;
  readonly predicateImplementationDigest: string;
  readonly input: {
    readonly id: string;
    readonly version: 1;
    readonly projection: "sampled_edges" | "recorded_paths" | "complete_alternatives";
    readonly sha256: string;
    readonly invocations: number;
  };
  readonly result: { readonly version: 1; readonly sha256: string; readonly positiveCount: number; readonly abstainedCount: number };
}
```

The input digest covers the PGN, fixture manifest, reader version and exact projected identity list;
the denominator is the number of compatible invocations, not always 579. The result digest is over
canonical sorted observations and typed unavailable rows, not only counts. A zero-count result passes
this arm when the operation ran over the full non-zero denominator; it does not pass the positive
arm. The old R2 input token remains historical provenance and cannot be referenced as a current
population case. A projection added after that run receives a new explicit zero/non-zero receipt
from the current operation.

Deleting one sampled edge, one recorded window or one legal alternative while retaining the PGN
digest must change the projected input digest and denominator and fail
`SEMANTIC_VALIDATION_POPULATION_INCOMPLETE`. The historical `f2-baseline.json` is comparison evidence
only and cannot serve as input authority because it contains already-reduced result counts.

Changing only the predicate implementation invalidates the receipt. Changing only result bytes
invalidates it. Reusing the input digest for another projection/version does not confer validation.

### 5.2 External disagreement receipt

The eight D872 families retain dataset identity, local predicate/version, theme query, denominator,
local positive count, labelled positive count, agreement cells and result digest. The receipt is
named `external_disagreement`, never `external_truth` or `ground_truth`. It cannot satisfy positive,
negative, orientation or counterfactual requirements.

```ts
interface SemanticExternalDisagreementReceiptRef {
  readonly kind: "external_disagreement_receipt";
  readonly id: string;
  readonly version: 1;
  readonly event: VersionedEvidenceId;
  readonly datasetVersion: 1;
  readonly resultVersion: 1;
}

interface SemanticExternalDisagreementReceipt {
  readonly id: string;
  readonly version: 1;
  readonly event: VersionedEvidenceId;
  readonly dataset: { readonly id: string; readonly version: 1; readonly sha256: string };
  readonly localPredicate: VersionedEvidenceId;
  readonly denominator: number;
  readonly localPositiveCount: number;
  readonly labelledPositiveCount: number;
  readonly cells: Readonly<Record<string, number>>;
  readonly result: { readonly version: 1; readonly sha256: string };
}
```

`parseSemanticPopulationReceiptRef` and `parseSemanticExternalDisagreementReceiptRef` are strict,
reject `@<integer>`-suffixed ids and stale input/dataset/result versions, and require exact event
identity at profile compilation. An ordinary case cannot inhabit either cell, and neither receipt
can inhabit a case arm or the other receipt arm.

## 6. Generated receipt and drift check

`tools/semantic-validation-build.mjs` runs every registered case and population/external operation,
canonicalizes the result and writes
`packages/runtime/src/semantic-validation-receipt.generated.ts`. The generated file carries:

- schema version;
- event-root digest;
- profile digest;
- case-registry digest;
- operation-registry and implementation digests;
- population input/result digests;
- one case receipt per registered case; and
- one compiled event verdict per root, including the exact still-required cells.

`make semantic-validation-update` is the only writer. `make semantic-validation-check` recomputes
in a temporary location and compares bytes. Ordinary `make verify` runs the check and never rewrites
the source tree. The generated header says which command owns it and refuses hand editing.

The runtime imports only the generated data and the pure receipt validator; fixture inputs and
test operations do not enter browser/server bundles. A bundling assertion fails if
`semantic-validation-cases` or test positions appear in a production artefact.

## 7. Consumer eligibility

### 7.1 Validation requirement is explicit

`EvidenceEligibilityDeclaration` gains:

```ts
readonly semanticValidation: "required" | "research_only";
```

`required` compiles eligible only when the event's generated verdict is `passed`. Otherwise the
compiler produces/refuses with `event_unvalidated` and retains the exact missing/failed arm ids.

That projection verdict is necessary but not sufficient. Each supplied event instance must also
pass `assertDeclaredEvidence`, resolve the package-private `EvidenceValueReceipt`, match the sole
registered factory for the exact projection/version and reproduce its payload digest. The compiled
consumer view therefore admits the conjunction:

```ts
eventProfile(event.projection).verdict === "passed"
  && evidenceValueReceipt(event.evidence).factory === soleFactory(event.projection)
  && evidenceValueReceipt(event.evidence).payloadDigest === canonicalDigest(event.evidence.payload)
```

There is no projection-wide waiver and no legacy caller-payload arm. A profile may pass only after
its own target observations ran through that same sole factory route; a consumer cannot combine a
passing profile receipt from one route with an instance from another. A failed first conjunct is
`event_unvalidated`; a failed value-authority conjunct is `event_value_unverified`.

`research_only` is allowed only when the consumer's roles are a subset of `author | operator`, its
timing is `analysis`, and its forms exclude learner sentences, board paint, hints, grades and move
recommendations. The current `research.semantic_selection@1` takes this disposition. A consumer
containing `learner`, `host`, `participant` or `spectator` cannot compile `research_only`.

Advanced inspection of raw declared evidence remains governed by its source projection and explicit
Inspector binding. This RFC does not delete facts because their semantic event is unvalidated. It
prevents the semantic name from being promoted into ordinary learner meaning.

### 7.2 No validation laundering through derivation

A derived semantic event passes only its own profile. Passing inputs do not validate a derived
relationship, and a passing derived event does not retroactively validate its inputs. Validation
is keyed to exact projection/version. Any semantic version change starts with no receipt even when
the old fixture still compiles.

Modules, Review, bots, skills and longitudinal aggregators bind the event verdict directly or use a
compiled consumer view that already enforced it. They may not read the generated receipt and invent
a softer threshold.

## 8. Landing slices

### Slice A — authority and honest migration

1. Add the root/profile/case/operation/receipt types and compiler checks.
2. Publish the literal total profile set-equal to the live event-root inventory.
3. Migrate the 39 emitter positives and ten emitter negatives without weakening their source tests;
   retain them as registered/unexecuted debt until the sole-factory value receipt exists.
4. Re-run the current imported population for every live event version and migrate the eight external
   disagreement receipts.
5. Mark every other required cell as debt, so no event is accidentally learner-valid merely because
   the authority exists.
6. Change current operator research eligibility to explicit `research_only`.

Slice A may land with zero fully validated events. That is a successful truth repair, not a reason
to retain generated labels. It cannot mint a passing event verdict before value-authority route
closure.

### Slice B — grounded local one-edge closure

Migrate already-grounded positive, semantic-negative and mirrored cases family by family for
structural, transition, tactics, breadth, king/material/activity and exact exchange events. Elevate
the thirteen lower-predicate negatives through the named production operations only when their
authority rows remain valid. Missing chess expectations stay `required` until a rules oracle,
source-bound proposition or owner receipt exists. Each family commit updates the generated receipt
and reports event-level verdict changes; Codex does not fill a cell merely to complete a family.

### Slice C — recorded and alternative populations

After the total recorded-path operation lands, migrate authority-bearing sequence-event
positives/negatives and mirrors. Execute authority-bearing required counterfactual profiles over
complete legal populations; do not treat one sampled reply as a counterfactual case. Missing
authority remains explicit debt.

### Slice D — repaired avoidance/opposition

Only accepted versioned successors from D1716/D1717 may receive valid cases. The known projection-
and-sign-only avoidance witnesses and blocker-blind opposition cases remain permanent negative
fixtures against their retired versions.

### Slice E — consumer release

Recompile learner modules, Review, bot, skill and longitudinal bindings only after their exact event
profiles pass. Raw evidence may already be inspected under the explicit research/Advanced policy;
no UI or content is added by this RFC.

## 9. Acceptance criteria

1. The active-event root inventory is derived from production projections and is set-equal to the
   declarations, profiles and generated verdicts at landing; a mutually omitted declaration and
   profile still fails. The dated author checkpoint prints 67, but no landing criterion hard-codes
   that cardinality. Adding the held promotion-race event without its profile/verdict fails.
2. `SemanticEventDeclaration.validation` contains a profile reference only. Grep and a type fixture
   prove no `positives`, `hardNegatives`, `externalPopulation` or generated
   `semantic-event:<id>` label remains.
3. Every live-root profile carries all six arms; no empty array or unrecognized reason compiles.
   Present cells are arm-distributive: case, population and external refs cannot cross arms, and
   stale/cross-event refs fail their strict parser.
4. A plausible generated label with no case fails `SEMANTIC_VALIDATION_CASE_MISSING`.
5. A case object cannot express a callback, `DeclaredEvidence`, `SemanticEvidenceEvent` or direct
   compiler call; runtime protection additionally rejects a forged extra key.
6. The operation map is distributive over all eight exact base operation ids at numeric version 1.
   An `@1`-suffixed id, stale numeric version or registry/receipt using the alternate dialect fails.
   Edge/path/sequence/
   complete-alternative cross-pairs, invalid sequence families/horizons, incomplete legal sets and
   stale case refs fail before an operation runs.
7. A positive reaching its operation with zero target events fails
   `SEMANTIC_VALIDATION_POSITIVE_EMPTY`.
8. A negative with an illegal move, non-successor after FEN or malformed operand fails
   `SEMANTIC_VALIDATION_FIXTURE_INVALID`, not passes as a semantic negative.
9. A valid semantic negative records one operation invocation and zero target events; unrelated
   events may remain in its output.
10. An orientation-required event with one case, incomplete/overlapping operand paths, an illegal
   transformed edge or a partner whose canonically transformed operands do not agree fails
   `SEMANTIC_VALIDATION_ORIENTATION_INCOMPLETE` or
   `SEMANTIC_VALIDATION_ORIENTATION_SCHEMA` before a receipt is emitted.
11. Mirror comparison rejects zero/zero, zero/non-zero, duplicate, unmatched and ambiguous target
    populations before leaf comparison; reordered uniquely paired events pass.
12. A later event pointing at the old R2 token fails `SEMANTIC_VALIDATION_POPULATION_STALE`.
13. Keeping the population input digest while changing predicate or result digest invalidates the
    receipt independently in both fixtures.
14. Every present case/population/external ref resolves to exactly one matching registry row and
    every registry row is referenced; dead, duplicate, stale-version, wrong-arm and cross-event
    refs fail. Population input/result and external dataset/result versions are checked separately.
15. Each operation invokes a production symbol, carries a complete local import-file closure and
    proves either a real non-test application caller or exact target-projection multiset retention
    through its declared application operation; `compileSemanticEvidenceEvent` and
    `declareEvidence` are refused targets.
16. Every registered case resolves one admissible authority. Existing assertions reproduce frozen
    expectation bytes; rules oracles resolve a sealed same-case/same-event typed witness, execute
    the exact request/result arm under an import-isolated registry and return an expectation
    canonically equal to the case; cited
    propositions resolve an exact immutable span, and owner cases resolve a matching owner-authored
    receipt. An invented expectation or Codex-authored owner receipt fails.
17. The generated receipt is byte-stable across two runs. `make semantic-validation-check` fails
    after changing a fixture expectation, operation source byte, profile cell or population result
    without regeneration.
18. A full-profile event is admitted to a learner-role fixture consumer only when the exact instance
    also carries the sole-factory `EvidenceValueReceipt`; missing/swapped receipts, changed payloads
    and alternate routes fail even when the projection verdict passes. An otherwise identical
    event with one required cell refuses with `event_unvalidated`.
19. The same incomplete event is visible to an operator `research_only` fixture, while changing that
    consumer role to learner fails compilation. This is the raw-inspector-versus-meaning boundary.
20. Derived-event validation does not inherit from inputs, and a new event version begins without a
    passing receipt.
21. The 39/10 migration baseline is re-derived through `make semantic-validation-matrix`; any
    divergence is named in the implementation log rather than silently adjusting a count.
22. The first generated population receipt contains one row per live event root, compatible
    non-zero denominators, exact input/result/implementation digests and honest zeroes. The fixture
    reproduces 108 games and 579 sampled edges, while path/alternative denominators are derived and
    retained separately.
23. Production web/server bundles contain no validation fixture registry, frozen fixture FENs or
    executable research harness.
24. `make verify` includes `semantic-validation-check`; focused authority tests, manifest tests,
    typecheck, software, content and governance tiers all pass without retry or rewritten artefacts.
25. Docs describe the difference among declared, validated, research-only and learner-eligible
    evidence. The implementation log lists passed/required events by family, not one blended
    percentage.

## 10. Able-to-fail fixtures required before acceptance

The independent review must run, not merely read, these fixtures:

1. declaration + profile mutually omit an active event;
2. generated-looking labels without registry cases;
3. direct evidence construction disguised as a positive;
4. positive zero;
5. negative that never invokes the operation;
6. illegal-move negative;
7. one-sided orientation;
8. crossed orientation partner;
9. stale R2 population token on a later event;
10. unchanged input with changed predicate digest;
11. unchanged input/predicate with changed result digest;
12. stale event version;
13. extra dead case;
14. learner consumer using `research_only`;
15. incomplete event visible to operator but refused to learner; and
16. generated receipt stale after one operation source byte changes;
17. unavailable child erased to an empty completed parent;
18. internal child event filtered out by its declared application operation;
19. mirror with one unmatched nested scalar and one overlapping wildcard;
20. one sampled edge and one legal alternative omitted while the PGN digest is retained; and
21. the held promotion-race event added without an atomic profile and verdict;
22. every wrong operation/input pairing plus an incomplete complete-alternative set;
23. stale case event, arm and version refs;
24. passing event projection with missing, swapped and alternate-factory value receipts;
25. missing/unresolved authority, changed frozen assertion, cyclic oracle import and a forged
    Codex owner receipt; and
26. mirror zero/zero, zero/non-zero, duplicate, reordered, unmatched and ambiguous populations.
27. operation/case/oracle ids with `@1`, numeric version 2 and one mixed-dialect registry/receipt;
28. population ref in a case or external cell, ordinary case in population/external, stale
    input/dataset/result versions and a same-id receipt for another event; and
29. missing, swapped and stale oracle witnesses; request for the wrong oracle grain; computed
    result paired with another expectation; and an oracle import closure reaching the production
    semantic predicate or constructor.

Each negative records the diagnostic it would fail to catch if the implementation were weakened.
A green fixture whose selected population is zero is itself a failure.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D0 | Create the exact empty protected owner-authority root in a prior commit, without adding chess authority or admitting a case | OWNER, or Claude on an explicit owner ruling | protected file exists, parses as schema v1 with zero authorities, and its commit precedes Slice A | |
| D1 | Repair exact subject/outcome identity for the avoidance family before any successor receives validation | codex, after the [[D1716]] successor is independently accepted | accepted RFC + production operation + permanent crossed-subject fixtures | |
| D2 | Replace blocker-blind king opposition with the versioned unobstructed successor | codex, after the [[D1717]] successor is independently accepted | accepted RFC + migrated authored refs + permanent blocker/mirror fixtures | |
| D3 | Land the total recorded-path production operation before source-predicate sequence negatives are elevated | recorded-semantic-path | implemented operation + receipt-bound sequence cases | |
| D4 | Migrate already-grounded cases, build the runner and execute authority-bearing cells after Slice A | codex, through this RFC's family slices B–D | generated profile plus preserved authority rows and execution receipts | |
| D5 | Accept an independent authority for every new chess expectation still required by a learner consumer; the authority itself must be a rules oracle, cited immutable source or owner-authored receipt, never Codex's unsupported judgement | OWNER | case authority resolves and its expectation digest is independently reproducible | |
| D6 | Recompile each learner/module/Review/bot/skill/longitudinal consumer against passing receipts | codex, through each accepted consumer RFC and the [[D1710]] handoff | production operation and consumer fixture, not manifest membership alone | |

The RFC remains implementing after Slice A. It may archive only when every D0–D6 row is either
discharged or explicitly transferred to an accepted successor with a reader that takes a different
action. A learner feature cannot satisfy D6 by selecting only the events that happened to be easy
to validate unless its accepted consumer contract names that narrower set.

## Open questions

One process-only ruling remains before implementation: authorize D0's exact empty protected-store
bootstrap. It creates no chess claim and does not authorize later authority rows. All semantic
choices are otherwise made here:

- all events need positives, semantic negatives, orientation and a current population execution;
- only avoidance/reply-breadth events require a counterfactual arm under current semantics;
- external labels remain disagreement evidence; and
- research visibility never confers learner eligibility.

The buildability reviewer may return operation boundaries, digest closure or profile classifications
that do not resolve to current symbols. That return is the intended gate, not permission to soften
the criteria.

## Initial author-audit obligations (2026-08-30)

- [[D2039]] — retain one authenticated population and exact traversal denominator per execution
  grain rather than a hand-written coverage claim;
- [[D2040]] — preserve the closed completed/unavailable result algebra so abstention can never be
  inferred from an empty event population;
- [[D2041]] — preserve the typed total mirror transform and reject incomplete, overlapping or
  arbitrary operand maps;
- [[D2042]] — prove exact projection-multiset retention from each internal collector through its
  real application operation; and
- [[D2043]] — derive live validation-root cardinality rather than pinning the pre-promotion count.

These repairs remain normative in §§4.1–4.4 and §5. None is superseded by the later proposition,
population or owner-authority amendments.

## Fresh-return obligations (2026-08-30)

- [[D2194]] — define closed case refs and a distributive operation input/result map for every
  execution grain;
- [[D2195]] — bind learner eligibility to value-authority factories/routes before a projection
  verdict can admit an instance;
- [[D2196]] — give every new expected chess semantic an exact oracle/witness, cited proposition or
  human-authored authority rather than assigning truth authoring to codex; and
- [[D2197]] — require non-empty canonical target-event pairing before mirror leaf comparison.

The author repair must invert `make semantic-validation-fresh-review`, preserve D1711/D1713 and
the D2039–D2043 author contract, then request another independent review. No implementation is
authorized by an author-side green check.

## Second fresh-return obligations (2026-08-30)

- [[D2331]] — choose one version authority for operation and case identities. Follow the shipped
  `VersionedEvidenceId` convention (`id` without `@N`, separate numeric `version`) or use a single
  versioned key, but never store both representations or compare across dialects;
- [[D2332]] — make profile cells arm-distributive. Ordinary executable cases, population receipts
  and external-disagreement receipts need distinct exact reference types so every `present` arm is
  constructible and stale refs fail at compile/runtime boundaries; and
- [[D2333]] — make a rules-oracle authority executable: retain or resolve the exact witness bytes,
  publish the oracle request/result algebra, and define the equality that binds a derived result to
  `SemanticValidationExpectation`. A pair of unactionable digests is provenance, not an oracle.

The author repair must invert `make semantic-validation-second-fresh-review`, preserve the D2039
and D2194 contracts, and request a third independent review. No implementation is authorized by
this return.

The 2026-08-31 author repair discharges these author obligations in §§3.1, 4.1 and 5. Operation,
case, receipt and oracle ids are base ids with numeric version fields exactly once. Present cells
select their reference algebra by arm. A rules oracle resolves sealed witness bytes, executes one
typed request/result arm under import isolation and must compute an expectation byte-equal to its
case. The executable author contract is `make semantic-validation-third-author-repair`; fresh
review still owns acceptance.

## Fourth author repair — observation-wide validation and grounded authority

This section is normative and supersedes the event-only names and contradictory joins in §§2–7
where they conflict. It changes no production byte and does not satisfy the independent review.

### R1. One subject and one result algebra ([[D2385]])

Validation is keyed by a closed subject, never by an untyped projection ref:

```ts
type SemanticValidationSubject =
  | { readonly kind: "event"; readonly projection: VersionedEvidenceId }
  | { readonly kind: "reading"; readonly projection: VersionedEvidenceId };

type SemanticValidationObservation =
  | { readonly kind: "event"; readonly item: SemanticEvidenceEvent<unknown> }
  | { readonly kind: "reading"; readonly item: DeclaredEvidence<unknown> };

type SemanticValidationOperationResult =
  | { readonly kind: "completed"; readonly observations: readonly SemanticValidationObservation[] }
  | { readonly kind: "unavailable"; readonly reason: SemanticValidationUnavailableReason };
```

Every former `event` identity field in profiles, refs, cases, population/external receipts and
generated verdicts becomes `subject: SemanticValidationSubject`. Event adapters wrap each existing
`SemanticEvidenceEvent`; reading adapters wrap exact declared evidence. Target selection reads the
projection from `item.evidence.projection` for an event and `item.projection` for a reading, then
requires both kind and projection/version to equal the case subject. Both arms require the same
sole-factory `EvidenceValueReceipt`; a reading is not validated by construction provenance.

`SemanticEventDeclaration.validation` remains the event-side reference. Reading roots have a
separate literal `SemanticReadingValidationDeclaration` containing only `subject.kind: "reading"`
and the profile ref. Both declaration types compile into one `SemanticValidationDeclaration`
union before population checks. No event type is widened to pretend a reading is an event.

The bounded-target dependency adds the ninth operation id
`runtime.semantic.bounded_target_batch` only in the same commit that its three projections and
`BoundedTargetBackgroundService.submit` land. Its operation adapter consumes the dependency-owned
sealed batch request/result, converts the named-target and bounded-return evidence to reading
observations and the immediate evidence to an event observation, and retains typed abstentions.
The reading-root register may name the two future refs now, but the live root/declaration/profile/
operation joins include them only once the projections are active; activating any one without its
subject declaration, profile, operation adapter and non-passing initial verdict fails atomically.

All generic diagnostics say `subject`, `target observation` and `observation count`. Event-specific
diagnostics remain only inside an event operation adapter. Acceptance criteria and fixture text
using “event” mean the event arm unless explicitly generalized here.

### R2. Exact equalities and partial joins ([[D2386]])

The population algebra is:

1. live validation roots, compiled validation declarations, profiles and generated verdicts each
   contain exactly one row per
   `subjectKey = kind + ":" + projection.id + "@" + version`, then are set-equal by that key;
2. case subjects, population-receipt subjects and external-receipt subjects are each subsets of
   the root set;
3. every registry row is referenced exactly once by a same-kind, same-subject, same-arm `present`
   cell, and every `present` ref resolves exactly one row; and
4. `required` and `not_applicable` cells reference no registry row. A root with every executable
   case arm still `required` therefore has no fabricated case and remains a valid debt profile.

The compiler performs the uniqueness pass on the arrays before constructing any set or map. It
retains the exact source-row index and canonical row digest in the generated receipt, so duplicate
or contradictory rows cannot disappear during normalization. The earlier §2 sentence placing
“every validation case's event reference” in bidirectional root set equality is withdrawn.
Criterion 1's four-way equality is authoritative; criterion 14 owns the three subset/bijection
joins. Permanent fixtures include a duplicate in each of the four equal populations, a debt-only
event root, a debt-only reading root, an unreferenced case, a present ref with no row, a cross-kind
ref and a case subject outside the roots.

### R3. An oracle proves a fact; a proposition supplies meaning ([[D2387]])

`SemanticValidationOracleResultMap[K]` returns only the neutral typed fact for K. The
`expectation` member is deleted. `executeOracle` receives only the witness request, returns that
fact and records its digest; it never receives the case expectation or target subject.

A rules-backed case uses a conjunction:

```ts
interface SemanticValidationRulesAuthority {
  readonly kind: "rules_and_proposition";
  readonly oracle: SemanticValidationOracleRef;
  readonly witness: SemanticValidationOracleWitnessRef;
  readonly proposition: SemanticValidationPropositionAuthority;
  readonly factConstraint: readonly SemanticValidationFactConstraint[];
}
```

The runner first executes the isolated oracle, then applies every closed equality constraint to its
neutral fact. Paths contain object keys only; `*` is not part of the grammar. `scalar` rejects an
array/object and compares canonical scalar bytes. `ordered` requires arrays and compares every
member in order. `canonical_multiset` requires arrays, canonicalizes every complete member, sorts
those bytes and retains multiplicity; it never means “any” or “every”. The `equals` value must have
the matching scalar/array shape. An unresolved path, object leaf, wrong comparison mode, duplicate
lost during canonicalization, empty actual versus non-empty expected, or any unequal complete
collection fails `SEMANTIC_VALIDATION_FACT_CONSTRAINT_INVALID` or
`SEMANTIC_VALIDATION_FACT_CONSTRAINT_UNSATISFIED`. Thus attackers, material pieces and legal UCI
moves are constrained as whole collections and no case may cherry-pick a convenient member.

The separately resolved proposition owns the exact target subject, case id/version, canonical
constraint digest and `SemanticValidationExpectation`. Only that proposition supplies the
expectation; its bytes must equal the case. A rules fact with no proposition, an empty constraint
list, a proposition for another subject/case, a proposition whose own constraint bytes differ, a
constraint not satisfied by the fact, or a result object containing an `expectation` key fails. The
same rules fact may support multiple semantic subjects only through distinct independently grounded
propositions.

The old top-level `rules_oracle` authority and the claim that canonical equality between
`result.expectation` and the case establishes truth are withdrawn. Import isolation still applies
and prevents the neutral oracle from importing production semantic predicates.

### R4. One protected owner-authority store ([[D2388]])

Owner-authored propositions live only at
`design/research/semantic-validation-owner-authorities.json`:

```ts
interface SemanticValidationOwnerAuthorityStore {
  readonly schemaVersion: 1;
  readonly authorities: readonly {
    readonly id: string;              // base id, no @N suffix
    readonly version: 1;
    readonly subject: SemanticValidationSubject;
    readonly case: { readonly id: string; readonly version: 1 };
    readonly expectation: SemanticValidationExpectation;
    readonly factConstraint: readonly SemanticValidationFactConstraint[];
    readonly ruling: `ledger:D${number}`;
    readonly authoredBy: "OWNER";
    readonly authoredAt: `${number}-${number}-${number}`;
  }[];
}
```

`SemanticValidationOwnerAuthorityRef` contains exact id/version only. The strict parser derives the
canonical row digest and requires exact subject, case, expectation and constraint equality. Rows are
sorted by id/version and unique. The staged process check makes the file append-only: an existing
row cannot change or disappear; a correction appends the next store-schema-approved authority id
and updates the case in a later reviewed change. Each appended row must cite a live/terminal ledger
ruling whose work-state `rulingKind` is `owner-ledger`, and its row bytes must predate the case's
`present` transition. Same-commit owner row plus case admission fails.

The temporal guard has three canonical source files and no caller-supplied ref list:

- `design/research/semantic-validation-owner-authorities.json`;
- `packages/runtime/src/semantic-validation-cases.json`; and
- `packages/runtime/src/semantic-validation-profiles.json`.

The TypeScript registries import and strictly parse the latter two JSON roots; they are not second
copies. `semantic-validation-owner-transition-check` reads base and candidate bytes itself. In a
pre-commit it compares repository `HEAD` with the staged index; in CI it compares the commit's first
parent with the checked-out commit. It parses all six JSON documents plus the base/candidate work
state, resolves each profile's `present` case references, resolves those cases' authority refs, and
derives the admitted owner-authority keys. The function accepts repository tree readers, never
`admittedRefs`, case rows, profile rows or owner rulings from its caller. It rejects:

1. any mutation/removal of a base owner row;
2. any candidate owner row whose ruling is not an exact owner-ledger row in the candidate work
   state;
3. any owner key introduced in the candidate tree that is reachable from a candidate `present`
   profile cell; and
4. any newly `present` case whose owner row did not already exist in the base tree.

The generated transition receipt retains both tree identities and the canonical digest of all six
parsed roots. An unstaged worktree, caller-supplied empty list, same-commit row/case pair, case hidden
behind an unchanged profile, or profile hidden behind an unchanged case therefore cannot alter the
decision.

Law 5 supplies the single-writer boundary: only the owner, or Claude acting on the exact cited owner
ruling, may write this protected design/research file. Codex and implementation agents may build the
parser and consume existing rows but may not add, edit or synthesize authority. Missing, duplicate,
unsorted, suffixed, stale-version, digest-mismatched, non-owner, non-ruling, mutated and same-commit
rows are permanent negatives. If no owner row exists, the cell remains `required`.

The store itself has a named bootstrap discharge: before implementation, the owner—or Claude acting
on an explicit owner ruling—creates exactly `{"schemaVersion":1,"authorities":[]}` at the protected
path and runs the strict parser. That commit contains no case/profile admission and creates no chess
truth. Codex may not perform or silently combine this discharge with implementation. Until it
lands, Slice A is dependency-blocked even though the other author repairs may be reviewed.

### R5. Repair acceptance arms

26. An active reading root cannot compile through an event declaration/result, and an active event
    cannot compile through a reading arm. Both bounded-target readings plus its event must traverse
    the one observation result, value receipt, profile, population receipt and consumer gate.
27. Four-way root/declaration/profile/verdict equality and the three registry subsets are tested
    independently; a debt-only root carries zero cases and stays honest debt.
28. Oracle results reject an `expectation` key. A neutral fact affects a case only through a
    same-case/same-subject grounded proposition with non-empty satisfied constraints.
29. The exact owner store/parser/staged transition crosses all negative arms in R4, and no Codex-
    written fixture can create an owner authority row.
30. All three proposition refs parse independently and resolve to the same closed proposition
    record; omitting or swapping subject, case, constraint digest or expectation fails.
31. Fact constraints contain no wildcard. Empty, multiple, reordered and duplicate collection
    fixtures distinguish `ordered` from multiplicity-preserving `canonical_multiset` equality.
32. The temporal guard derives owner admissions from base/candidate store, case and profile bytes;
    its public operation has no caller-supplied admission or ruling population.
33. Duplicate roots, declarations, profiles and verdicts each fail before four-way equality and
    receipt generation retains exactly one source row per subject.
34. The protected empty root exists in a prior owner-authorised commit before Slice A starts; its
    absence is a dependency failure, never an invitation for an implementer to create it.

## Fifth fresh independent return — 2026-08-31

The fourth repair's direction survives, but its newly added seams expose five buildability
blockers:

- [[D2445]] — the rules-proposition union names three undeclared authority/reference types;
- [[D2446]] — wildcard fact paths are declared but rejected by the author model and have no
  collection quantifier;
- [[D2447]] — the owner prior-commit guard trusts caller-supplied admitted refs instead of deriving
  before/after case/profile transitions;
- [[D2448]] — set conversion hides duplicate declaration/profile/verdict rows; and
- [[D2449]] — the required protected store is absent while the only agents allowed to create it
  have no named bootstrap discharge.

`make semantic-validation-fifth-fresh-review` reproduces 5/5. Exact evidence and repairs are in
`planning/semantic-validation-authority/fifth-fresh-independent-buildability-review-2026-08-31.md`.
A fifth author repair, owner-store bootstrap and another fresh review are required before acceptance.

## Fifth author repair — 2026-09-01

The return is answered without weakening the prior four repairs:

- [[D2445]]: the three reference types, three resolved types, strict parsers and one normalized
  proposition record are now explicit. All resolved arms bind the same subject, case, constraint
  digest and expectation.
- [[D2446]]: wildcard paths are removed. Whole arrays use exact ordered or canonical-multiset
  equality, with multiplicity retained; no existential member selection exists.
- [[D2447]]: the transition guard owns three exact source paths and derives admissions from base and
  candidate repository trees. Its API accepts neither admission refs nor authority rows.
- [[D2448]]: every equal population proves uniqueness before set construction and receipt rows retain
  source identity.
- [[D2449]]: the protected empty-store bootstrap is now an explicit owner/Claude-on-ruling discharge
  and an implementation dependency. It remains deliberately unperformed by Codex.

`make semantic-validation-fifth-author-repair` crosses the four executable repairs and verifies the
bootstrap remains a named, absent dependency. Another fresh independent review is required after
the owner-authorised bootstrap; no production or learner-eligibility implementation is authorized.

## Fresh adversarial return — 2026-08-31

The pre-review audit in
`planning/semantic-validation-authority/third-author-fresh-adversarial-audit-2026-08-31.md`
returns the document to its author on four buildability blockers:

- [[D2385]] — either generalize the full declaration/operation/case/receipt/eligibility protocol
  over reading and event observations, or remove the late reading roots into a separate authority;
- [[D2386]] — state exact equal sets and the permitted case subset, including a debt-only root;
- [[D2387]] — stop an event-agnostic rules request from directly returning an event-specific
  expectation without an independently grounded proposition; and
- [[D2388]] — define an exact owner-authored authority store and write boundary, or remove that
  authority arm.

This remains the durable return record. R1–R4 above are the author's response and
`make semantic-validation-fourth-author-repair` crosses them 4/4. The independent acceptance
review remains outstanding; implementation is still unauthorized.

## Changelog

- 2026-08-31: fifth fresh independent review returned the fourth repair on [[D2445]]–[[D2449]].
  Proposition types, wildcard constraint semantics, derived owner chronology, one-row-per-subject
  authority and the owner-only store bootstrap remain unbuildable. `make
  semantic-validation-fifth-fresh-review` passes 5/5; no implementation or learner eligibility is
  authorized.
- 2026-08-31: fourth author repair answers D2385–D2388 with one event/reading observation algebra,
  exact equality/subset joins, neutral rules facts plus grounded propositions and one protected
  append-only owner-authority store. Independent review still required; no implementation.
- 2026-08-31: fresh adversarial author-side audit returned the RFC on D2385–D2388 before the third
  independent review. No production or eligibility implementation is authorized.
- 2026-08-31: author-repaired [[D2331]]–[[D2333]]. Removed `@1` suffixes from operation, case and
  oracle ids while retaining numeric version fields; made present cells distributive over exact
  case/population/external refs; and replaced digest-only rules-oracle authority with sealed witness
  resolution, a six-arm request/result map, import isolation and exact computed-expectation binding.
  `make semantic-validation-third-author-repair` passes 3/3. Third fresh review remains required;
  no implementation or learner eligibility is authorised.
- 2026-08-30: second fresh independent review returned the D2194–D2197 author repair on
  [[D2331]]–[[D2333]]. The new operation map double-versions operation and case identity; the one
  `present` cell shape cannot represent its population/external arms; and rules-oracle rows have no
  retrievable witness or typed result-to-expectation binding. Earlier repairs survive; no
  implementation is authorized.
- 2026-08-30: author-repaired [[D2194]]–[[D2197]]. Published the eight-member distributive
  operation/input/result map and exact case refs; made the value-authority sole-factory receipt a
  conjunct of both execution and consumer admission; assigned new chess expectations only to an
  independent rules oracle, immutable cited proposition or owner receipt; and made mirror pairing
  non-empty, canonical, unique and order-independent before leaf comparison. The new author
  contract is positive evidence only; fresh independent review still gates acceptance.
- 2026-08-30: fresh independent review returned the D2039–D2043 repair on
  [[D2194]]–[[D2197]]. Four executable arms cover undefined operation/case types, projection-wide
  laundering of unverified mint routes, ungrounded LLM-authored chess expectations and vacuous
  zero-event mirrors. Earlier repairs survive; no implementation is authorized.
