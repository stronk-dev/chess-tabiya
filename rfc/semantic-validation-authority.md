# RFC: Executable semantic-validation authority

- **Status:** draft — 2026-08-29; requires independent buildability review before implementation
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
- **Parent / amends:** living successor to the immutable implemented evidence contract; changes
  `SemanticEventDeclaration.validation` from self-generated labels to a compiled profile reference
- **Planning:** `planning/semantic-validation-authority/` once accepted

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

The 2026-08-26 dossier's 54/13 literal-name split is superseded by the refreshed 66/1 split. The
substantive verdict does not move: no declaration resolves a validation id and no consumer reads an
executed validation result.

## 2. Independent root inventory

The closed population is not another copied list. `compileEvidenceManifest` derives the semantic
root inventory from every active projection satisfying all of:

```ts
projection.role === "event"
projection.disposition === undefined
projection.forms.includes("machine_condition")
```

The compiler then asserts set equality, independently and in both directions, among:

- those active event roots;
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

type SemanticValidationCell =
  | { readonly disposition: "present"; readonly cases: readonly SemanticValidationCaseRef[] }
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
  readonly positive: SemanticValidationCell;
  readonly semanticNegative: SemanticValidationCell;
  readonly orientation: SemanticValidationCell;
  readonly counterfactual: SemanticValidationCell;
  readonly importedPopulation: SemanticValidationCell;
  readonly externalLabel: SemanticValidationCell;
}
```

Every profile carries all six keys. An empty array is invalid. A `present` case must resolve and
pass. A `required` cell is honest debt and makes the event unvalidated. `not_applicable` needs one
closed reason and is never inferred from absence.

### 3.2 Requirement law

The literal 67-row profile is compiled from these author decisions and checked as a generated
exhibit; the rules do not replace the rows:

| arm | 1.0 requirement |
|---|---|
| positive | required for all 67; at least one legal input must make the production operation emit the exact event/version |
| semantic negative | required for all 67; at least one nearby legal input must reach the same operation and omit the exact event for a chess-semantic reason |
| orientation | required for all 67; chess coordinates, colors, directions, roles and identities are orientation-sensitive even when the final value is a count |
| counterfactual | required for all thirteen `derived.semantic_avoidance.*` events and `rules.tactic.consequence.reply_breadth`; not applicable to literal state changes and recorded-path-only observations because those projections make no all-alternative claim |
| imported population | required for all 67 as an execution/census arm; a zero positive count is valid when denominator and result identity are retained, but it cannot satisfy the positive arm |
| external label | present for the eight D872 disagreement families; `not_applicable(no_independent_external_taxonomy)` for the other 59. Even the eight cases are calibration evidence and never substitute for a positive or negative |

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
interface SemanticValidationCase {
  readonly id: string;
  readonly version: 1;
  readonly event: VersionedEvidenceId;
  readonly arm: Exclude<SemanticValidationArm, "imported_population" | "external_label">;
  readonly operation: SemanticValidationOperationRef;
  readonly input: SemanticValidationOperationInput;
  readonly expectation: SemanticValidationExpectation;
}

type SemanticValidationExpectation =
  | { readonly kind: "emits"; readonly minimum: 1; readonly operandMatch?: Readonly<Record<string, unknown>> }
  | { readonly kind: "abstains"; readonly reason: string }
  | { readonly kind: "omits" }
  | {
      readonly kind: "mirrors";
      readonly partnerCase: SemanticValidationCaseRef;
      readonly transform: "vertical" | "horizontal" | "color_and_vertical";
      readonly operandMap: Readonly<Record<string, string>>;
    };
```

Case ids are independent author-chosen ids such as `castled.standard-white.positive@1`, never
`semantic-event:${projection}:positive`. The compiler rejects an id equal to or containing the
event id as a generated suffix/prefix template. This is a cheap guard, not the independence proof;
the closed input type and operation lookup are the proof.

Every edge input retains canonical before FEN, canonical UCI and canonical after FEN. The runner
checks the move is legal, the after position is the exact successor and the UCI dialect is canonical
before invoking an operation. Recorded-path inputs retain a complete ordered edge receipt and are
invalid until the shared recorded-path compiler accepts them. A malformed operand is therefore an
invalid fixture, never a semantic negative.

### 4.2 Closed production operations

`packages/runtime/src/semantic-validation-operations.ts` owns the only function registry. It maps
versioned operation ids to production exports already used by the application, including:

- `runtime.semantic.local_edge@1` → `localSemanticEvents`;
- `runtime.semantic.structural_edge@1` → `structuralSemanticEvents`;
- `runtime.semantic.transition_edge@1` → `transitionSemanticEvents`;
- `runtime.semantic.breadth_edge@1` → `breadthSemanticEvents`;
- `runtime.semantic.duty_edge@1` → `semanticDutyEvents`;
- `runtime.semantic.recorded_path@1` → the accepted total recorded-path operation; and
- narrowly typed sequence operations only where the production application calls the same
  constructor over a sealed recorded-path receipt.

The case registry selects an operation id and supplies its serializable input; it cannot replace
the function. Each operation declaration retains the production symbol and a complete sorted list
of implementation files whose bytes determine `implementationDigest`. A source file named by an
operation but missing from the digest set fails. Adding a new imported local source to an operation
without updating its file closure fails a static import-graph check. External package bytes are
represented by the lockfile digest plus exact package version.

`compileSemanticEvidenceEvent` and `declareEvidence` are explicitly forbidden operation targets.
They validate sealed payload structure after a predicate has already decided what to emit and
therefore cannot establish chess semantics.

### 4.3 Reach and non-vacuity

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

The imported-population operation runs the current production emitter over one frozen decision
population. Its receipt is per event/version and retains:

```ts
interface SemanticPopulationReceipt {
  readonly event: VersionedEvidenceId;
  readonly operation: SemanticValidationOperationRef;
  readonly predicateImplementationDigest: string;
  readonly input: { readonly id: string; readonly sha256: string; readonly decisions: number };
  readonly result: { readonly sha256: string; readonly positiveCount: number; readonly abstainedCount: number };
}
```

The result digest is over canonical sorted observations, not only counts. A zero-count result passes
this arm when the operation ran over the full non-zero denominator; it does not pass the positive
arm. The old R2 input token remains historical provenance and cannot be referenced as a current
population case. A projection added after that run receives a new explicit zero/non-zero receipt
from the current operation.

Changing only the predicate implementation invalidates the receipt. Changing only result bytes
invalidates it. Reusing the input digest for another projection/version does not confer validation.

### 5.2 External disagreement receipt

The eight D872 families retain dataset identity, local predicate/version, theme query, denominator,
local positive count, labelled positive count, agreement cells and result digest. The receipt is
named `external_disagreement`, never `external_truth` or `ground_truth`. It cannot satisfy positive,
negative, orientation or counterfactual requirements.

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
2. Publish the literal 67-row total profile.
3. Migrate the 39 emitter positives and ten emitter negatives without weakening their source tests.
4. Re-run the current imported population for all 67 event versions and migrate the eight external
   disagreement receipts.
5. Mark every other required cell as debt, so no event is accidentally learner-valid merely because
   the authority exists.
6. Change current operator research eligibility to explicit `research_only`.

Slice A may land with zero fully validated events. That is a successful truth repair, not a reason
to retain generated labels.

### Slice B — local one-edge closure

Complete positive, semantic-negative and mirrored cases family by family for structural,
transition, tactics, breadth, king/material/activity and exact exchange events. Elevate the thirteen
lower-predicate negatives through the named production operations. Each family commit updates the
generated receipt and reports event-level verdict changes.

### Slice C — recorded and alternative populations

After the total recorded-path operation lands, complete sequence-event positives/negatives and
mirrors. Complete the fourteen required counterfactual profiles over complete legal populations;
do not treat one sampled reply as a counterfactual case.

### Slice D — repaired avoidance/opposition

Only accepted versioned successors from D1716/D1717 may receive valid cases. The known projection-
and-sign-only avoidance witnesses and blocker-blind opposition cases remain permanent negative
fixtures against their retired versions.

### Slice E — consumer release

Recompile learner modules, Review, bot, skill and longitudinal bindings only after their exact event
profiles pass. Raw evidence may already be inspected under the explicit research/Advanced policy;
no UI or content is added by this RFC.

## 9. Acceptance criteria

1. The active-event root inventory is derived from production projections and is set-equal to 67
   declarations, 67 profiles and 67 generated verdicts at landing; a mutually omitted declaration
   and profile still fails.
2. `SemanticEventDeclaration.validation` contains a profile reference only. Grep and a type fixture
   prove no `positives`, `hardNegatives`, `externalPopulation` or generated
   `semantic-event:<id>` label remains.
3. All 67 profiles carry all six arms; no empty array or unrecognized reason compiles.
4. A plausible generated label with no case fails `SEMANTIC_VALIDATION_CASE_MISSING`.
5. A case object cannot express a callback, `DeclaredEvidence`, `SemanticEvidenceEvent` or direct
   compiler call; runtime protection additionally rejects a forged extra key.
6. A positive reaching its operation with zero target events fails
   `SEMANTIC_VALIDATION_POSITIVE_EMPTY`.
7. A negative with an illegal move, non-successor after FEN or malformed operand fails
   `SEMANTIC_VALIDATION_FIXTURE_INVALID`, not passes as a semantic negative.
8. A valid semantic negative records one operation invocation and zero target events; unrelated
   events may remain in its output.
9. An orientation-required event with one case or a partner whose transformed operands do not
   agree fails `SEMANTIC_VALIDATION_ORIENTATION_INCOMPLETE`.
10. A later event pointing at the old R2 token fails `SEMANTIC_VALIDATION_POPULATION_STALE`.
11. Keeping the population input digest while changing predicate or result digest invalidates the
    receipt independently in both fixtures.
12. Every present case resolves to exactly one registry row and every registry row is referenced;
    dead, duplicate, stale-version and cross-event cases fail.
13. Each operation invokes a production symbol and carries a complete local import-file closure;
    `compileSemanticEvidenceEvent` and `declareEvidence` are refused targets.
14. The generated receipt is byte-stable across two runs. `make semantic-validation-check` fails
    after changing a fixture expectation, operation source byte, profile cell or population result
    without regeneration.
15. A full-profile event is admitted to a learner-role fixture consumer; an otherwise identical
    event with one required cell refuses with `event_unvalidated`.
16. The same incomplete event is visible to an operator `research_only` fixture, while changing that
    consumer role to learner fails compilation. This is the raw-inspector-versus-meaning boundary.
17. Derived-event validation does not inherit from inputs, and a new event version begins without a
    passing receipt.
18. The 39/10 migration baseline is re-derived through `make semantic-validation-matrix`; any
    divergence is named in the implementation log rather than silently adjusting a count.
19. The first generated population receipt contains 67 event rows, a non-zero denominator, exact
    input/result/implementation digests and honest zeroes.
20. Production web/server bundles contain no validation fixture registry, frozen fixture FENs or
    executable research harness.
21. `make verify` includes `semantic-validation-check`; focused authority tests, manifest tests,
    typecheck, software, content and governance tiers all pass without retry or rewritten artefacts.
22. Docs describe the difference among declared, validated, research-only and learner-eligible
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
16. generated receipt stale after one operation source byte changes.

Each negative records the diagnostic it would fail to catch if the implementation were weakened.
A green fixture whose selected population is zero is itself a failure.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | Repair exact subject/outcome identity for the avoidance family before any successor receives validation | codex, after the [[D1716]] successor is independently accepted | accepted RFC + production operation + permanent crossed-subject fixtures | |
| D2 | Replace blocker-blind king opposition with the versioned unobstructed successor | codex, after the [[D1717]] successor is independently accepted | accepted RFC + migrated authored refs + permanent blocker/mirror fixtures | |
| D3 | Land the total recorded-path production operation before source-predicate sequence negatives are elevated | recorded-semantic-path | implemented operation + receipt-bound sequence cases | |
| D4 | Complete all still-required positive, semantic-negative and orientation cells after Slice A | codex, through this RFC's family slices B–D | generated total profile with zero `required` cells for any learner-admitted event | |
| D5 | Recompile each learner/module/Review/bot/skill/longitudinal consumer against passing receipts | codex, through each accepted consumer RFC and the [[D1710]] handoff | production operation and consumer fixture, not manifest membership alone | |

The RFC remains implementing after Slice A. It may archive only when every D1–D5 row is either
discharged or explicitly transferred to an accepted successor with a reader that takes a different
action. A learner feature cannot satisfy D5 by selecting only the events that happened to be easy
to validate unless its accepted consumer contract names that narrower set.

## Open questions

None require an owner ruling before independent review. The strict choices are made here:

- all events need positives, semantic negatives, orientation and a current population execution;
- only avoidance/reply-breadth events require a counterfactual arm under current semantics;
- external labels remain disagreement evidence; and
- research visibility never confers learner eligibility.

The buildability reviewer may return operation boundaries, digest closure or profile classifications
that do not resolve to current symbols. That return is the intended gate, not permission to soften
the criteria.
