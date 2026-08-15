# Pack vocabulary integrity matrix

Audited tree: 2026-08-15. Corpus: 35 authored draft packs, six `*.browser.json`
acceptance fixtures reported separately, and 23 shape entries.

## Reading the axes

- **Declared** means the value is accepted or explicitly forbidden by
  `schemas/drill_pack.schema.json` at the audited revision.
- **Executable** names the shipped consumer. `guard` means the literal exists to
  reject input rather than to drive play.
- **Used** is `occurrences/files` in the 35 authored packs, followed by the same
  count for shapes. These are raw string counts in the const-literal table; the
  semantic tables disambiguate overloaded strings such as `outcome`.
- **Sound** is intentionally narrower than “looks plausible”: `yes` means the
  declaration reaches a compatible consumer; `mismatch` names a proved seam;
  `unwitnessed` means the probe corpus supplied no positive witness and is not a
  proof of deadness.

The structural evaluator is exhaustive over its 15 leaves and six expression
nodes (`packages/runtime/src/structure.ts:297-364`). FEN predicates are
exhaustive (`packages/runtime/src/objective.ts:148-170`). Success conditions
compile in `apps/server/src/pack-orchestrator.ts:91-162`.

## All 42 schema `const` literals

| Literal | Declared | Executable | Used packs; shapes | Sound |
|---|---|---|---:|---|
| `authored` | yes | root-assessment presentation | 5/5; 0/0 | yes, explicitly unproved |
| `backward_pawn` | yes | structural feature | 2/2; 2/1 | yes |
| `bishop_on_shade` | yes | structural feature | 2/1; 16/2 | yes |
| `capture_intent` | forbidden sentinel | checkpoint-action guard | 0/0; 0/0 | guard only |
| `checkpoint` | yes | grading resolution | 10/10; 0/0 | yes |
| `claim` | yes | reasoning-key-point renderer | 0/0; 0/0 | executable, unused |
| `crossed` | yes | authored-boundary checkpoint | 15/15; 0/0 | yes; off-spine by design |
| `direct_attack_count` | yes | structural feature | 0/0; 0/0 | executable, unused everywhere |
| `doubled_pawn` | yes | structural feature/template | 0/0; 4/3 | yes, pack-unused |
| `feature` | yes | structural-expression leaf | 61/15; 267/23 | yes |
| `half_open_file` | yes | structural feature/template | 3/3; 14/7 | yes |
| `intent_capture` | yes | plan-prose reveal eligibility | 36/34; 0/0 | partial: no intent recording UI |
| `isolated_pawn` | yes | structural feature/template | 0/0; 5/4 | yes, pack-unused |
| `king_opposition` | yes | structural feature | 4/1; 2/1 | yes |
| `line_blockers` | yes | structural feature | 0/0; 2/1 | yes, pack-unused |
| `material_balance` | yes | success-condition compiler | 6/6; 0/0 | mismatch: decimal equality can never fire |
| `mirrored` | yes | structural-expression combinator | 0/0; 3/1 | yes, pack-unused |
| `named_structure` | yes | structural feature | 1/1; 6/5 | yes |
| `not` | yes | structural-expression combinator | 23/13; 32/16 | yes |
| `open_file` | yes | structural feature/template | 1/1; 14/6 | yes |
| `outcome` | yes | success condition and pack mode token | 13/13; 0/0 | condition itself unused; runtime executable |
| `outpost` | yes | structural feature/template | 0/0; 5/2 | yes, pack-unused |
| `passed_pawn` | yes | structural feature/template | 0/0; 101/6 | yes, pack-unused |
| `pawnStructure` | yes | FEN-predicate dispatcher | 0/0; 0/0 | executable, unused |
| `pawn_count` | yes | structural feature | 5/5; 1/1 | yes |
| `pawn_safe_square` | yes | structural feature/template | 0/0; 0/0 | executable, unused everywhere |
| `piece` | yes | quantified template leaf | 6/2; 0/0 | yes |
| `pieceOnSquare` | yes | FEN predicate and structural leaf | 17/6; 62/12 | yes |
| `piece_reach_count` | yes | structural feature | 43/13; 100/13 | executable; all uses are one existence idiom |
| `prediction` | yes | prediction mutation and sheet | 0/0; 0/0 | executable; authored packs unused |
| `quantified` | yes | structural-expression combinator | 6/2; 5/2 | yes |
| `reach_checkpoint` | yes | success-condition compiler | 7/6; 0/0 | yes; all seven have spine witnesses |
| `rules_fact` | yes | success-condition compiler | 0/0; 0/0 | mismatch: runtime also accepts undeclared `draw` |
| `shape_plan` | yes | reasoning-key-point renderer | 0/0; 0/0 | executable, unused |
| `spine_move` | yes | reasoning-key-point renderer | 0/0; 0/0 | executable; browser fixture only |
| `stated_reasoning` | yes | reasoning mutation and sheet | 0/0; 0/0 | executable; browser fixture only |
| `structural` | yes | reasoning-key-point renderer | 0/0; 0/0 | executable, unused |
| `structuralFeature` | yes | FEN-predicate dispatcher | 17/12; 0/0 | yes |
| `structural_feature` | yes | success-condition compiler | 21/15; 0/0 | yes in current content; D32 evidence-ref seam |
| `syzygy` | yes | ledger admission and exactness presentation | 22/11; 0/0 | yes when ledger-verified |
| `terminal` | yes | grading resolution | 6/6; 0/0 | yes |
| `transposeKey` | yes | FEN-predicate dispatcher | 0/0; 0/0 | executable, unused |

`all` and `any` are schema enums rather than consts. Both execute as structural
combinators and are heavily used: `all` 18/13 packs and 46/22 shapes; `any`
53/13 packs and 144/17 shapes.

## Objective types

All 12 are declared. “Generic compiler” means the type has no dedicated
semantic branch; its authored conditions supply its entire behavior.

| Objective type | Executable | Used occurrences/files | Sound |
|---|---|---:|---|
| `reach_structure` | generic condition compiler | 2/1 | yes in current trajectory legs |
| `preserve_plan_window` | generic compiler only | 0/0 | zero users; no window semantics |
| `execute_break` | generic condition compiler | 3/3 | yes in current content |
| `prevent_opponent_plan` | generic compiler only | 0/0 | unused; no type-specific evaluator |
| `transition_to_endgame` | generic compiler only | 0/0 | unused; no type-specific evaluator |
| `win` | outcome grading plus conditions | 12/12 | yes |
| `hold` | outcome grading plus conditions | 4/4 | yes |
| `save` | outcome grading plus conditions | 0/0 | executable, unused |
| `resist` | checkpoint-resolved outcome grading | 0/0 | executable; browser fixture only |
| `play_until_checkpoint` | generic condition compiler | 3/3 | yes |
| `follow_theory` | dedicated line-membership rules | 17/17 | yes |
| `run_trajectory` | leg orchestrator; top-level compiles no rules | 3/3 | yes; leg validation is incomplete |

Validation calls `objectiveRules` for only the first five plan labels
(`apps/server/src/pack-validation.ts:93-96,476-480`). Play calls it for every
active non-trajectory objective and active trajectory leg
(`apps/server/src/pack-orchestrator.ts:166-278,297-302`).

## Success-condition kinds

| Kind | Declared | Executable | Used occurrences/files | Sound |
|---|---|---|---:|---|
| `reach_checkpoint` | yes | `checkpointReached` | 7/6 | all seven fire on authored spine replay |
| `outcome` | yes | `outcomeReached` | 0/0 | executable, unused |
| `material_balance` | yes | integer material comparison | 6/6 | current uses vary; decimal `equal` is globally impossible |
| `rules_fact` | yes | rules-fact predicate | 0/0 | declared/executable mismatch on `draw`; `winner` ignored for stalemate |
| `structural_feature` | yes | structural expression | 21/15 | all current conditions vary; evidence-ref crash class remains |

## Structural expression and feature kinds

| Kind | Declared | Executable | Used packs; shapes | Sound |
|---|---|---|---:|---|
| `all` | yes (enum) | conjunction | 18/13; 46/22 | yes |
| `any` | yes (enum) | disjunction | 53/13; 144/17 | yes |
| `not` | yes | negation | 23/13; 32/16 | yes |
| `feature` | yes | feature leaf | 61/15; 267/23 | yes |
| `pieceOnSquare` | yes | literal placement | 17/6; 62/12 | yes; produces no feature evidence ref |
| `mirrored` | yes | transformed expression | 0/0; 3/1 | yes |
| `quantified` | yes | square/file quantification | 6/2; 5/2 | yes; may produce no feature evidence ref |

| Feature kind | Declared | Executable | Used packs; shapes | Sound |
|---|---|---|---:|---|
| `backward_pawn` | yes | yes | 2/2; 2/1 | witnessed |
| `bishop_on_shade` | yes | yes | 2/1; 16/2 | witnessed |
| `direct_attack_count` | yes | yes | 0/0; 0/0 | unused everywhere |
| `doubled_pawn` | yes | yes | 0/0; 4/3 | witnessed in shapes |
| `half_open_file` | yes | yes | 3/3; 14/7 | witnessed |
| `isolated_pawn` | yes | yes | 0/0; 5/4 | witnessed in shapes |
| `king_opposition` | yes | yes | 4/1; 2/1 | witnessed |
| `line_blockers` | yes | yes | 0/0; 2/1 | witnessed in shapes |
| `named_structure` | yes | yes | 1/1; 6/5 | witnessed |
| `open_file` | yes | yes | 1/1; 14/6 | witnessed |
| `outpost` | yes | yes | 0/0; 5/2 | witnessed in shapes |
| `passed_pawn` | yes | yes | 0/0; 101/6 | witnessed in shapes |
| `pawn_count` | yes | yes | 5/5; 1/1 | witnessed |
| `pawn_safe_square` | yes | yes | 0/0; 0/0 | unused everywhere |
| `piece_reach_count` | yes | yes | 43/13; 100/13 | all 143 uses are `any` + `atLeast 0` existence tests |

Seven of 15 feature kinds are absent from packs:
`direct_attack_count`, `doubled_pawn`, `isolated_pawn`, `line_blockers`,
`outpost`, `passed_pawn`, and `pawn_safe_square`. Only
`direct_attack_count` and `pawn_safe_square` are absent from both packs and
shapes.

## Deviation categories

All five are schema-declared. Runtime membership recognizes a deviation by
position plus move and carries the authored class through to the verdict
(`packages/runtime/src/line.ts:120-155`); grading uses `offObjective`, not a
machine ranking of the category. Therefore “sound” here means transport is
sound, not that the chess judgment is mechanically verified.

| Category | Executable | Used occurrences/files | Sound |
|---|---|---:|---|
| `required_theory` | transported | 0/0 | unused |
| `accepted_alternative` | transported | 78/29 | authored judgment only |
| `interesting_deviation` | transported | 56/27 | authored judgment only |
| `concept_violation` | transported | 31/13 | authored judgment only |
| `tactical_error` | transported | 90/17 | authored judgment only |

## Authoring refusal codes

These are not pack-schema values, so the first axis is **declared emitter**:
every row names a literal emitted by shipped lint/runtime validation. “Used” is
the number of direct test literal assertions, not the number of possible input
documents. A zero is a coverage finding, not proof that the emitter is
unreachable. `SCHEMA_<AJV keyword>` is a dynamic family and is reported after
the fixed 78-code table.

| Code | Declared / executable | Emitter exists | Direct assertions | Sound |
|---|---|---:|---:|---|
| `AUTHORED_PROSE_AFTER_LAST_CHECKPOINT` | lint emitter | yes | 2 | directly pinned |
| `BOUNDARY_GRANTS_NOTHING` | runtime emitter | yes | 0 | emitter exists; path not directly pinned |
| `BOUNDARY_HORIZON_EXCLUDES_EVERY_GRANT` | runtime emitter | yes | 0 | emitter exists; path not directly pinned |
| `BOUNDARY_NEEDS_PLY_HORIZON` | runtime emitter | yes | 1 | directly pinned |
| `BOUNDARY_NODE_BEYOND_HORIZON` | lint emitter | yes | 1 | directly pinned |
| `CHECKPOINT_BOUNDARY_WITHOUT_BOUNDARY` | runtime emitter | yes | 0 | emitter exists; path not directly pinned |
| `CHECKPOINT_TRUE_AT_ROOT` | runtime emitter | yes | 1 | directly pinned |
| `CHECKPOINT_UNREACHABLE_AT_ROOT` | runtime emitter | yes | 0 | emitter exists; path not directly pinned |
| `CONCEPT_KEY_NOT_SLUG` | lint emitter | yes | 0 | emitter exists; path not directly pinned |
| `DEVIATION_SHADOWS_SPINE_MOVE` | lint emitter | yes | 1 | directly pinned |
| `DEVIATION_WRONG_SIDE` | lint emitter | yes | 1 | directly pinned |
| `DUPLICATE_DEVIATION` | lint emitter | yes | 1 | directly pinned |
| `DUPLICATE_SPINE_NODE` | lint emitter | yes | 0 | emitter exists; path not directly pinned |
| `GRADUATION_REQUIRES_SOURCES` | runtime emitter | yes | 0 | emitter exists; path not directly pinned |
| `GUARD_WITHOUT_IMMEDIATE_GUARD` | runtime emitter | yes | 1 | directly pinned |
| `ILLEGAL_DEVIATION_MOVE` | lint emitter | yes | 1 | directly pinned |
| `ILLEGAL_SPINE_MOVE` | lint emitter | yes | 2 | directly pinned |
| `INVALID_START_FEN` | lint emitter | yes | 0 | emitter exists; path not directly pinned |
| `KEY_POINT_GROUND_FALSE_AT_CHECKPOINT` | runtime emitter | yes | 0 | emitter exists; path not directly pinned |
| `KEY_POINT_GROUND_UNRESOLVED` | runtime emitter | yes | 0 | emitter exists; path not directly pinned |
| `KEY_POINT_PHRASE_IS_JUDGEMENT` | runtime emitter | yes | 0 | emitter exists; path not directly pinned |
| `KEY_POINT_PHRASES_COLLIDE` | runtime emitter | yes | 0 | emitter exists; path not directly pinned |
| `LEGS_NEED_TRAJECTORY_MODE` | runtime emitter | yes | 0 | emitter exists; path not directly pinned |
| `LEGS_NEED_TRAJECTORY_OBJECTIVE` | runtime emitter | yes | 0 | emitter exists; path not directly pinned |
| `LINE_SPAN_EMPTY` | runtime emitter | yes | 0 | emitter exists; path not directly pinned |
| `MIRRORED_NAMED_STRUCTURE` | runtime emitter | yes | 1 | directly pinned |
| `NEGATIVE_FEATURE_COUNT` | runtime emitter | yes | 0 | emitter exists; path not directly pinned |
| `OBJECTIVE_ABSORBING_WITHOUT_OUTCOME` | runtime emitter | yes | 0 | emitter exists; path not directly pinned |
| `OBJECTIVE_DEGRADED_IS_ONE_WAY` | runtime emitter | yes | 0 | emitter exists; path not directly pinned |
| `OBJECTIVE_GRADES_NOTHING` | runtime emitter | yes | 2 | directly pinned |
| `OBJECTIVE_GRADING_REQUIRED` | runtime emitter | yes | 0 | emitter exists; path not directly pinned |
| `OBJECTIVE_GRADING_UNSUPPORTED` | runtime emitter | yes | 0 | emitter exists; path not directly pinned |
| `OBJECTIVE_OUTCOME_TARGET_INVALID` | runtime emitter | yes | 0 | emitter exists; path not directly pinned |
| `OBJECTIVE_RESIST_NEEDS_CHECKPOINT` | runtime emitter | yes | 0 | emitter exists; path not directly pinned |
| `OBJECTIVE_RESOLUTION_UNKNOWN` | runtime emitter | yes | 0 | emitter exists; path not directly pinned |
| `OBJECTIVE_SELF_TRANSITION` | runtime emitter | yes | 0 | emitter exists; path not directly pinned |
| `OUTPOST_RANK_OUT_OF_RANGE` | runtime emitter | yes | 2 | directly pinned |
| `PAWN_COUNT_OUT_OF_RANGE` | runtime emitter | yes | 2 | directly pinned |
| `PERFECT_TABLEBASE_OUT_OF_RANGE` | runtime emitter | yes | 1 | directly pinned |
| `QUANTIFIED_DOMAIN_EMPTY` | runtime emitter | yes | 1 | directly pinned |
| `REASONING_SEGMENT_END_UNPROVEN` | runtime emitter | yes | 1 | directly pinned |
| `SHAPE_PLAN_REF_UNLISTED` | runtime emitter | yes | 1 | directly pinned |
| `SHAPE_PLAN_UNKNOWN` | runtime emitter | yes | 1 | directly pinned |
| `SHAPE_REFERENCE_UNKNOWN` | runtime emitter | yes | 1 | directly pinned |
| `SPINE_SAN_MISMATCH` | lint emitter | yes | 1 | directly pinned |
| `SPINE_TRANSPOSITION_COLLISION` | lint emitter | yes | 0 | emitter exists; path not directly pinned |
| `START_POSITION_UNRUNNABLE` | runtime emitter | yes | 0 | emitter exists; path not directly pinned |
| `STRUCTURAL_EXPRESSION_TOO_DEEP` | runtime emitter | yes | 1 | directly pinned |
| `STRUCTURAL_KIND_UNRECOGNISED` | runtime emitter | yes | 0 | exhaustive drift backstop |
| `SYZYGY_ASSESSMENT_MISMATCH` | runtime emitter | yes | 0 | emitter exists; path not directly pinned |
| `SYZYGY_ASSESSMENT_OUT_OF_RANGE` | runtime emitter | yes | 0 | emitter exists; path not directly pinned |
| `THEORY_ABSORBING_UNSUPPORTED` | runtime emitter | yes | 1 | directly pinned |
| `THEORY_DEVIATION_NEEDS_SPINE_ANCHOR` | runtime emitter | yes | 0 | emitter exists; path not directly pinned |
| `THEORY_NEEDS_AUTHORED_BOUNDARY` | runtime emitter | yes | 1 | directly pinned |
| `THEORY_NEEDS_BOUNDARY_CHECKPOINT` | runtime emitter | yes | 1 | directly pinned |
| `THEORY_OBJECTIVE_NEEDS_LINE_MODE` | runtime emitter | yes | 1 | directly pinned |
| `TOO_MANY_PREDICTIONS` | lint emitter | yes | 3 | directly pinned |
| `TRAJECTORY_DUPLICATE_LEG_ID` | runtime emitter | yes | 0 | emitter exists; path not directly pinned |
| `TRAJECTORY_FIRST_LEG_HAS_ENTRY` | runtime emitter | yes | 1 | directly pinned |
| `TRAJECTORY_LEG_CONDITION_PRECEDES_ENTRY` | runtime emitter | yes | 1 | directly pinned |
| `TRAJECTORY_LEG_ENTRIES_COINCIDE` | runtime emitter | yes | 0 | emitter exists; path not directly pinned |
| `TRAJECTORY_LEG_ENTRY_NOT_SIMPLE` | runtime emitter | yes | 0 | emitter exists; path not directly pinned |
| `TRAJECTORY_LEG_ENTRY_REUSED` | runtime emitter | yes | 0 | emitter exists; path not directly pinned |
| `TRAJECTORY_LEG_ENTRY_UNKNOWN` | runtime emitter | yes | 1 | directly pinned |
| `TRAJECTORY_LEG_NEEDS_ENTRY` | runtime emitter | yes | 0 | emitter exists; path not directly pinned |
| `TRAJECTORY_LEG_SYZYGY_UNSUPPORTED` | runtime emitter | yes | 0 | emitter exists; path not directly pinned |
| `TRAJECTORY_MULTIPLE_THEORY_LEGS` | runtime emitter | yes | 0 | emitter exists; path not directly pinned |
| `TRAJECTORY_NESTED_UNSUPPORTED` | runtime emitter | yes | 0 | emitter exists; path not directly pinned |
| `TRAJECTORY_NONFINAL_LEG_ABSORBING` | runtime emitter | yes | 1 | directly pinned |
| `TRAJECTORY_NONFINAL_TERMINAL_RESOLUTION` | runtime emitter | yes | 0 | emitter exists; path not directly pinned |
| `TRAJECTORY_OBJECTIVE_NEEDS_LEGS` | runtime emitter | yes | 0 | emitter exists; path not directly pinned |
| `TRAJECTORY_TOP_LEVEL_CONDITIONS_UNSUPPORTED` | runtime emitter | yes | 0 | emitter exists; path not directly pinned |
| `TRAJECTORY_TRANSITIONED_UNSUPPORTED` | runtime emitter | yes | 0 | emitter exists; path not directly pinned |
| `UNKNOWN_SPINE_NODE` | lint emitter | yes | 0 | emitter exists; path not directly pinned |
| `UNSUPPORTED_CHECKPOINT_ACTION` | runtime emitter | yes | 1 | directly pinned |
| `UNSUPPORTED_FEEDBACK_POLICY` | runtime emitter | yes | 0 | schema-valid path unreachable; drift backstop |
| `UNSUPPORTED_OBJECTIVE_CONDITION` | runtime emitter | yes | 0 | emitter exists; path not directly pinned |
| `UNSUPPORTED_OPPONENT_POLICY` | runtime emitter | yes | 1 | directly pinned |

Totals: 78 fixed refusal codes, 33 with at least one direct literal assertion,
45 without one. The dynamic `SCHEMA_<keyword>` family is declared by the Ajv
adapter and exercised through schema-negative fixtures; it cannot be enumerated
as a fixed vocabulary because the suffix is the Ajv keyword.

## Opponent policy modes and checkpoint actions

These are schema enums rather than consts but are part of the authoring
vocabulary and expose the principal declared/executable seam.

| Element | Declared | Executable | Used | Sound |
|---|---|---|---:|---|
| `human_common` | yes | selector | 15 packs | yes |
| `strong_engine` | yes | selector | 0 packs | executable, unused |
| `theory_strict` | yes | selector | 18 packs | yes |
| `perfect_tablebase` | yes | selector | 2 packs | yes, range-gated |
| `plan_defense` | yes | named refusal | 0 packs | declared-but-refused |
| `practical_resistance` | yes | named refusal | 0 packs | declared-but-refused |
| `human_external` | yes | named refusal | 0 packs | declared-but-refused |
| checkpoint action `compare_branches` | schema accepts any nonempty action except `capture_intent` | only selectable action | current actions validated | validator closes the open schema |

The four selector branches are at `apps/server/src/opponent-selector.ts:436-448`;
the three named refusals are at `apps/server/src/capabilities.ts:15-24`.
