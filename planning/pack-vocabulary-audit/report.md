# Pack vocabulary integrity audit

## Verdict

The current 35-pack corpus contains **no remaining authored condition proved
constant**. The previously dead two-bishop condition is gone at the audited
revision. All 27 position-evaluated conditions produced both true and false
witnesses across pack-local positions plus the synthetic edge suite, and all
seven `reach_checkpoint` conditions fired on at least one replayed authored
spine path.

That good result does **not** vindicate the admission boundary. The audit found
three format/runtime integrity defects and generalized D32 across the whole
objective vocabulary:

1. A pack can pass validation and crash during play for **seven of twelve**
   objective types when a structural condition contains only `quantified` or
   `pieceOnSquare` nodes. Validation compiles rules for five plan labels only;
   play compiles every active objective except the `run_trajectory` wrapper.
2. `rules_fact: draw` executes in the runtime but is absent from the schema
   enum (D29). Conversely, the schema permits `winner` on `stalemate`, but the
   evaluator ignores it.
3. `material_balance.value` accepts any JSON number while runtime material is
   an integer. `comparison: equal` with a non-integer is therefore a
   schema-valid condition that is false in every chess position.

No production code or authored chess content was changed. The dead-content
exception did not apply because there was no remaining constant authored
condition to repair.

The full per-element result is in [matrix.md](./matrix.md); the reproducible
instrument is [audit.ts](./audit.ts).

## Census and method

The handoff's 35-pack number is correct. The directory also contains six
`*.browser.json` acceptance fixtures; the first census mistakenly counted them
as authored packs and the correction is preserved in the append-only log. The
live schema has moved beyond the handoff's vocabulary counts: **42** unique
schema const strings, not 38, and **12** objective types, not eight.

The harness:

- read the current schema, 35 packs, six browser fixtures, and 23 shapes;
- replayed every authored spine prefix through `createRun`, `commitMove`, and
  `orchestratePackMove`;
- evaluated every authored positional condition across its own root/spine
  positions plus 13 legal edge FENs (kings only, opposition, material extremes,
  pawn structures, bishops on both shades, open sliders, mate, and stalemate);
- applied algebraic proofs for non-negative count and vacuous-quantifier cases;
- compiled all 44 authored objective instances (35 top-level plus nine legs);
- evaluated all 89 pack/shape structural expressions over 628 catalogue
  root/spine positions plus the 13 edge FENs; and
- extracted every fixed authoring refusal code and counted direct literal test
  assertions.

Direct CLI admission also passed for all 35 authored packs and all 23 shapes.

The probe suite is a falsification instrument, not a chess-coverage proof. A
condition seen both true and false is definitively non-constant. A condition
never seen true is only **unwitnessed** unless the algebra also proves it false.

## Soundness results

### Authored success conditions

There are 34 authored conditions:

- 21 `structural_feature`: every one varied;
- six `material_balance`: every current threshold is an integer and every one
  varied; and
- seven `reach_checkpoint`: every checkpoint id was observed on replay.

There are no authored `outcome` or `rules_fact` conditions in the 35 packs.

The successful spine replay matters because `reach_checkpoint` is event-based;
testing its position shape alone would not prove it can fire. The seven uses are
distributed across six files and all had at least one matching replay path.

### Checkpoints without an authored-spine witness

Of 134 checkpoints, 22 do not fire while replaying authored spine prefixes:

- 15 are `atAuthoredBoundary: crossed`, intentionally reached only after
  leaving the line;
- four are `atPly` checkpoints beyond the authored spine, intended for
  consequence play; and
- three are positional promotion/material checkpoints intended for off-spine
  consequences.

These are not dead findings. They are explicitly separated so “zero spine
witness” cannot be mistaken for “cannot fire.”

### Structural expressions without a positive catalogue witness

Sixteen of 89 expressions were never true over the 641-position probe set, but
none is algebraically constant:

| Shape | Expression |
|---|---|
| `doubled-c-pawns` | trigger; plan 2 success signature |
| `fianchetto-g7` | plan 0 success signature |
| `hanging-pawns` | trigger; plan 0 success signature |
| `iqp-black` | trigger; plan 2 success signature |
| `knight-vs-bishop` | trigger |
| `maroczy-bind` | trigger; plan 0 success signature |
| `open-centre` | plan 0 and plan 2 success signatures |
| `opposite-castling-race` | trigger |
| `opposite-coloured-bishops` | plan 0 success signature |
| `up-an-exchange` | trigger |
| `vancura` | trigger |

This is a fixture/coverage queue, not a dead-content list. Re-authoring any of
them without a chess-grounded positive position would violate law 8.

### Feature-use concentration

The known feature finding is confirmed exactly:

- seven of 15 feature kinds have zero pack use;
- two (`direct_attack_count`, `pawn_safe_square`) have zero use in both packs
  and shapes; and
- all 43 pack `piece_reach_count` leaves are
  `scope:any / comparison:atLeast / count:0`. All 100 shape uses are the same.

The 143 identical leaves are an existence encoding, not reach-count authoring.
This is stronger evidence for replacement than a simple popularity count: the
declared parameter surface has only one observed idiom.

## Validation does not exercise every play path (D32 generalized)

`conditionEvidenceRefs` throws when a structural expression yields no feature
leaf (`apps/server/src/pack-orchestrator.ts:125-138`). `pieceOnSquare` yields no
kind, and `quantified` with template kind `piece` is deliberately excluded by
`structuralFeatureKinds` (`packages/runtime/src/structure.ts:449-464`).

The validation/play matrix is:

| Objective | Validation calls `objectiveRules` | Play compiles condition | D32 synthetic result |
|---|---:|---:|---|
| `reach_structure` | yes | yes | bare `TypeError` |
| `preserve_plan_window` | yes | yes | bare `TypeError` |
| `execute_break` | yes | yes | bare `TypeError` |
| `prevent_opponent_plan` | yes | yes | bare `TypeError` |
| `transition_to_endgame` | yes | yes | bare `TypeError` |
| `win` | no | yes | bare `TypeError` |
| `hold` | no | yes | bare `TypeError` |
| `save` | no | yes | bare `TypeError` |
| `resist` | no | yes | bare `TypeError` |
| `play_until_checkpoint` | no | yes | bare `TypeError` |
| `follow_theory` | no | yes | bare `TypeError` |
| `run_trajectory` wrapper | no | no | wrapper returns zero rules |

Trajectory legs repeat the same incomplete type-gated validation. The current
44 objective instances compile because none uses the crashing shape; the
admission defect remains live. This independently confirms the scope already
written into `rfc/validator-integrity.md` without editing that RFC.

## Declared-versus-executable mismatches

### Runtime executes more than the schema declares

1. **D29: `rules_fact: draw`.** The runtime union includes `draw` and evaluates
   it (`packages/runtime/src/objective.ts:26-35,213-223`), while the pack schema
   allows only `checkmate` and `stalemate`
   (`schemas/drill_pack.schema.json:300-310`). No other runtime-only
   success-condition or structural kind was found: both dispatchers are
   exhaustive.
2. **Run-only `attempt_end`.** Pack feedback accepts three policies, while the
   run model also executes `attempt_end`. This is intentional: pack sessions
   exclude it and pack-free/imported/match sessions require it. It is recorded
   as a controlled asymmetry, not a defect.

### Schema declares more than runtime semantics deliver

1. **`rules_fact.winner` on stalemate.** The schema allows `winner` on both
   rules facts; the runtime tests only `node.outcome === "stalemate"` and ignores
   the field. A contradictory winner is accepted but semantically inert.
2. **Decimal material equality.** The schema declares `value` as `number`
   (`schemas/drill_pack.schema.json:287-298`); runtime sums integer chess-piece
   values and performs exact equality
   (`packages/runtime/src/objective.ts:17-24,122-135,224-229`). Any non-integer
   equality is globally false. Current content does not use one.
3. **Timing window is one-third executable.** The schema requires
   `windowOpens`, `windowCloses`, and `luxuryMoveBudget`
   (`schemas/drill_pack.schema.json:532-540`), but checkpoint matching consults
   only `windowCloses` (`apps/server/src/pack-orchestrator.ts:64-73`). The other
   two fields have no play semantics. There are zero current authored timing
   windows.
4. **`preserve_plan_window`.** It has zero users and no type-specific evaluator.
   It receives only the generic success-condition compiler and the five-label
   `OBJECTIVE_GRADES_NOTHING` admission check. The same is true of the unused
   `prevent_opponent_plan` and `transition_to_endgame` labels; only their names
   distinguish them mechanically.
5. **Three opponent modes are declared with checked refusal.** The schema lists
   seven modes (`schemas/drill_pack.schema.json:632-653`); the selector executes
   four (`apps/server/src/opponent-selector.ts:436-448`). `plan_defense`,
   `practical_resistance`, and `human_external` have named capability refusals
   (`apps/server/src/capabilities.ts:15-24`). This is the D8-compliant form of a
   declared-but-unimplemented value, not a silent no-op.
6. **Checkpoint action schema is open; the consumer is closed.** The schema
   accepts any nonempty string except `capture_intent`, while validation closes
   the set to `compare_branches`
   (`apps/server/src/pack-validation.ts:383-399`). Again, this is a controlled
   refusal, not silence.
7. **`intent_capture` does not capture intent.** It has 36 occurrences across
   34 packs. The current consumer uses its plan-class ids to decide which prose
   can reveal (`apps/server/src/authored-feedback.ts:233-242,294-323`), while the
   checkpoint sheet implements only `prediction` and `stated_reasoning`
   (`apps/web/src/lib/CheckpointSheet.svelte:79-123`). The value is partially
   executable, but its name overstates the shipped behavior.

### Schema declares values that are executable but unused

This is not itself a defect, but it identifies unexercised surface:

- zero objective users: `preserve_plan_window`, `prevent_opponent_plan`,
  `transition_to_endgame`, `save`, and `resist` (the latter appears only in a
  browser fixture);
- zero condition users: `outcome`, `rules_fact`;
- zero authored-pack interaction users: `prediction`, `stated_reasoning` (both
  are exercised by acceptance fixtures);
- zero deviation users: `required_theory`; and
- zero pack or shape users: `direct_attack_count`, `pawn_safe_square`.

## Refusal-code integrity

The audit found 78 fixed authoring refusal codes plus the dynamic
`SCHEMA_<Ajv keyword>` family. Thirty-three fixed codes have a direct literal
test assertion; 45 do not. The complete inventory is in the matrix.

The unpinned count is a coverage result, not a claim that 45 paths are broken or
unreachable. Two deserve explicit classification:

- `STRUCTURAL_KIND_UNRECOGNISED` is an exhaustive drift backstop; a current
  schema-valid document cannot reach it.
- `UNSUPPORTED_FEEDBACK_POLICY` is also shadowed by the schema enum for normal
  `validatePackDocument` input.

No refusal code was mechanically certain enough to delete. Removing defensive
backstops because they are unreachable from today's schema would weaken the
declared/executable drift defense this audit is measuring.

## Ranked inputs to the in-flight RFCs

1. **`validator-integrity` — highest priority.** It should absorb the complete
   five-of-twelve validation matrix, trajectory-leg parity, the decimal
   material-equality impossibility, the semantically ignored stalemate winner,
   and the 45-code direct-test inventory. D32 is a green-admission-to-crash
   defect; it outranks vocabulary convenience.
2. **`tempo-vocabulary`.** The evidence is exact: zero current window users;
   `windowOpens` and `luxuryMoveBudget` have no evaluator; only `windowCloses`
   executes; `preserve_plan_window` has zero users and no dedicated branch.
3. **`predicate-wave-3`.** Give it the exact concentration data (43 pack plus
   100 shape existence encodings), seven pack-unused features, two
   everywhere-unused features, and the 16 expressions lacking a positive
   catalogue fixture. The last list is a test-fixture queue, not permission to
   rewrite chess claims.
4. **`resistance-spectrum`.** The declared/executable mode split is controlled
   today: four execute, three refuse by name. `practical_resistance` has zero
   pack users, and both `save` and `resist` have zero authored users. That is the
   honest demand baseline for making one refusal executable.

There is one load-bearing dependency outside those four: the ready
`authoring-frictions` wave owns D29/D30 and already plans to add the bare `draw`
evidence reference as well as the schema value. `validator-integrity` correctly
identifies that adding only the schema enum would mint a new D32 instance.

## Mechanical fixes made

None. The audit found no remaining dead authored condition and no unreachable
enum/refusal whose removal was mechanically safer than leaving its drift guard
in place. All findings are therefore reported to the RFC owners rather than
silently designed here.
