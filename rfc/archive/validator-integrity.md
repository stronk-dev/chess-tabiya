# RFC: Validator integrity — a pack that passes `pack-check` must run

- **Status:** implemented
- **Author:** claude
- **Created:** 2026-08-15
- **Design refs:** `design/04-content-architecture.md` (the authoring loop `pack-check` guards);
  `design/BACKLOG.md` rows — cited by **row id and title**, never by line, because the ledger's
  line numbers moved twice while this draft was written:
  **D32** *"A structural condition can pass `pack-check` and throw at runtime"*;
  **D33** *"A trajectory pack can never be `ledger_verified`"*;
  **D37** *"An archived RFC is registered `implemented` but part of it never shipped"*;
  **D38** *"Two committed drafts ship a `follow_theory` leg that can never fire"*;
  **D39** *"Decimal `material_balance` equal-conditions are schema-valid but impossible"*;
  **D40** *"`winner` is accepted for `stalemate` and then ignored"*;
  and **Trajectory-format frictions**
- **Exploration gate:** owner ruling 2026-08-12 opened the RFC tier (`rfc/README.md`
  §Exploration gate). This RFC is a defect RFC against shipped systems; it opens no new
  product surface.
- **Depends on:** `rfc/archive/trajectory-drill.md` (`legs`, `run_trajectory`, and the §10
  per-leg validation extraction this RFC finishes), `rfc/archive/outcome-drill-grading.md`
  (`objective.grading`, the `ledger_verified` chain), `rfc/archive/grounding-pair.md`
  (`verify-draft`, `assessmentGrounding`), `rfc/archive/structural-reading.md` and
  `rfc/archive/predicate-wave-2.md` (`structuralExpression`, `quantified`, `pieceOnSquare`).
  **Ordering, not dependency:** this RFC lands **behind** `rfc/authoring-frictions.md` (wave
  position 1), which moves every file amended here — see §7 and the baseline note in the Summary.
  Nothing here needs that draft to land first; the order is fixed by its wave claim, not by this
  specification.
- **Parent / amends:** amends `apps/server/src/pack-validation.ts` and
  `apps/server/src/pack-orchestrator.ts`; introduces no new subsystem, no new schema and no new
  file under `schemas/`
- **Supersedes / superseded by:** —
- **Planning:** `planning/validator-integrity/` (once implementing)

## Summary

`make pack-check` exists to make one promise: **a pack that passes it will run.** That promise
is false in three independent ways, all three found by the 2026-08-15 B+N authoring agent. A
structural success condition can pass validation and throw a bare `TypeError` when played (D32).
A tablebase-verified mate trajectory cannot be `ledger_verified` at all, so the best-grounded
pack the project can author must lie about its own grounding (D33). And a trajectory leg's
objective is validated by one twelfth of the rules a top-level objective is validated by — a gap
`rfc/archive/trajectory-drill.md` §10 specified the fix for and which never shipped (D37).

Two further defects of the same family arrived from the opposite direction — the codex
pack-vocabulary audit (`planning/pack-vocabulary-audit/report.md`, commit `6c7a579`), which
enumerated the declared surface mechanically rather than hitting a crash by accident. A decimal
`material_balance` equality condition is schema-valid and can never be true (D39); a `winner`
declared on a `stalemate` fact is parsed and discarded (D40). Both are the same shape as the rest:
**the validator blesses something the runtime cannot honour.** §8 absorbs them, because refusing
them costs two checks inside the function §3c is already extracting.

This RFC states the law the validator was missing — **validation must exercise every code path
play will exercise before the first move** — and specifies the smallest change that makes it
true: total rule compilation for every objective in a document, every compilation failure
converted into a named refusal code, per-leg parity for the twelve `/objective`-rooted codes, two
never-satisfiable declarations refused, and one narrowly-scoped admission that lets a trajectory
carry the root grounding it already has evidence for.

**No version claim.** No pack-schema bump, no migration, no run-schema change, no `$id` move.
Every code change is validator behaviour plus one error type. The register lane's contingent 0.19
reservation for per-leg fields is **not** taken, and §5 explains why taking it would have shipped a
new instance of the very defect this RFC exists to kill. *Three committed content drafts do change
bytes* — and therefore digests — as the same-commit content fixes criteria 9 and 11 require; §4c and
criterion 16 state exactly which, and that no other pack, fixture or example moves.

**Line citations are pinned to commit `8e6dc2f`** (the tree this draft was verified against, whole
file). Every `file:line` below was re-resolved against that commit during cross-review.
`rfc/authoring-frictions.md` holds wave position 1 and is landing **now**: during this
cross-review its working tree shifted, and kept shifting, every file this RFC amends —
`apps/server/src/pack-validation.ts` (+64 lines at `OBJECTIVE_GRADES_NOTHING`, and still moving),
`apps/server/src/pack-orchestrator.ts` (+1 in the compiler region, +32 below it),
`packages/runtime/src/line.ts` (+1), `packages/runtime/src/evidence-ref.ts` (+1) and
`schemas/drill_pack.schema.json` (+30 before `$defs/objective`). Because this RFC lands **behind**
that one, **the implementer must re-locate every site by symbol name or code literal, not by line
number, and must not treat a line mismatch as evidence a claim is wrong.** No claim below depends
on a line number: each names the function, the refusal code, or the literal it is about.

## Motivation

### The promise, and five ways it is false

`pack-check` is the only gate between an author and a broken drill.
`PackRegistry.fromDocuments` runs every pack through the same `validatePackDocument`
(`apps/server/src/pack-registry.ts:124-135`, `:224`) before it can be played, so the validator is
not advisory — it is the sole admission control for the whole content pipeline. Everything the
validator declines to check, nothing else checks either.

Five defects. The first three were reproduced against the shipped tree on 2026-08-15 by the B+N
authoring agent and **all three were re-run independently at cross-review**; the last two were
derived mechanically by the codex pack-vocabulary audit and confirmed here against the same tree.
Item 5 is not a defect but the authoring friction the same evidence exposes; §5 scopes it out.

1. **D32 — a green pack throws when played.** Reproduced below, three ways: a green pack that
   throws a bare `TypeError` at rule compilation; a pack that makes `make pack-check` *itself*
   crash with an uncaught stack trace; and a green pack whose leg rule set throws
   `ObjectiveTransitionError` mid-run.
2. **D33 — a trajectory can never be `ledger_verified`.** `make verify-draft
   FILE=content/drafts/trajectory-mate-bishop-knight.json OFFLINE=1` exits `1` with
   `ERROR [VERIFY_ASSESSMENT_NOT_SYZYGY]`, while the sibling `content/drafts/mate-bishop-knight.json`
   — **`start`, `spine`, `deviations` and `opponentPolicy` all equal** — verifies and ships 53
   evidence records. The trajectory's *top-level* objective therefore declares **no grading at
   all**; the honest `authored` declaration is pushed down into its final leg, whose note says why:
   *"Declared authored because the format refuses the truth…"*
   (`content/drafts/trajectory-mate-bishop-knight.json`, `/legs/2/objective/grading/assessedBy/note`).
   That leg-level `authored` note is the pack's only assessment, and no reader outside the client
   consumes it — `assessmentGrounding` and `verify-draft` both read `objective.grading` at the root.
3. **D37 — the per-leg validation gap.** `rfc/archive/trajectory-drill.md` §10 specified the fix
   and it never shipped; §2d has the evidence.
4. **D39 and D40 — declarations the runtime cannot honour.** A decimal `material_balance` `equal`
   condition compiles to a rule that can never be true; a `winner` on a non-`checkmate` rules fact
   is parsed and discarded. §8.
5. **The per-leg authoring gap** — not a defect, the friction the same evidence exposes
   (`design/BACKLOG.md`, **Trajectory-format frictions**, two attestations):
   `$defs/trajectoryLeg` was `{id, entryCheckpointId?, objective}` with
   `additionalProperties: false` (`schemas/drill_pack.schema.json:190-199` at `8e6dc2f`), so per-leg
   `opponentPolicy`, `shapes` and `branchLengthTarget` are inexpressible. **One third of this is
   already closing:** `rfc/authoring-frictions.md` §5 adds per-leg `branchLengthTarget` to
   `$defs/trajectoryLeg` under pack schema 0.16, and it is present in the working tree. §5 of this
   RFC is therefore scoped to the two fields that remain, `opponentPolicy` and `shapes`.

### Scope boundary

**In scope:** the validator's admission contract and the compiler it must exercise;
the `run_trajectory` grounding path; two never-satisfiable declarations (§8); the per-leg
authoring gap's *decision*.

**Out of scope, explicitly:** any new predicate, feature or condition kind; any change to what a
rule *means* once compiled; any change to `verify-draft`'s tablebase queries, to
`assessmentGrounding`'s record-matching, or to how the client renders a grading; and the per-leg
format fields (§5, with the blocking sites enumerated).

## Specification

### 1. The law

> **Validation must exercise every code path play will exercise before the first move.**

The boundary is precise and it is not "run the drill". Play does two separable things with a pack:
it **compiles** the objective into a transition-rule set — a total function of the document, with
no dependency on the learner — and it **evaluates** those rules against positions the learner
reaches. Compilation is fully determined at authoring time; evaluation is not. The law therefore
binds the validator to perform every compilation the runtime will perform, on every objective in
the document, and to convert every failure of that compilation into a named `PackValidationIssue`.

Two corollaries, both normative:

- **A compilation failure is never an exception that escapes `validatePackDocument`.** The file
  already contains the precedent: the root-run probe wraps `createRun` and `checkpointMatches` in
  `try`/`catch` and emits `START_POSITION_UNRUNNABLE` (`apps/server/src/pack-validation.ts:603-651`).
  That pattern becomes the rule, not an exception.
- **A rule that compiles but can never fire is a defect, not a nicety.** `pack-check` already
  encodes this for one case — `OBJECTIVE_GRADES_NOTHING`
  (`apps/server/src/pack-validation.ts:476-481`) — and the silent-no-op sites §2e lists are the
  same shape, unguarded.

### 2. D32 — the blast radius

#### 2a. The reported symptom, reproduced

`conditionEvidenceRefs` derives a condition's evidence references from its structural expression
and throws when the expression yields none:

```ts
// apps/server/src/pack-orchestrator.ts:134-138
const references = structuralFeatureKinds(condition.feature).map((kind) =>
  rulesEvidenceRef(`structure-${kind.replaceAll("_", "-")}` as ...),
);
if (references.length === 0) throw new TypeError("Structural success condition has no feature leaf");
```

`structuralFeatureKinds` (`packages/runtime/src/structure.ts:449-465`) yields nothing for exactly
two node kinds: `pieceOnSquare` returns immediately (`:453`), and `quantified` skips its feature
when `feature.kind === "piece"` (`:456-459`). An expression built only from those — directly, or
under `not` / `all` / `any` / `mirrored` — compiles to an empty reference list and throws.

**Repro 1 — a green pack that throws.** `content/drafts/mate-two-bishops.json` (objective
`win`) with its single `structural_feature` condition replaced by
`{"kind":"not","of":{"kind":"pieceOnSquare","square":"a1","piece":null}}`:

```
$ make pack-check FILE=<repro>
Pack check passed: <repro>
$ # objectiveRules(document) on the same document:
objectiveRules THREW: TypeError Structural success condition has no feature leaf
```

**Repro 2 — the validator itself crashes.** `content/drafts/trajectory-mate-bishop-knight.json`
with a `quantified`-over-`piece` condition appended to leg 0 (`reach_structure`, one of the five
types validation *does* compile):

```
$ make pack-check FILE=<repro>
    at objectiveRules (.../pack-check.js:10825:16)
    at runtimeIssues (.../pack-check.js:11309:52)
    at validatePackDocument (.../pack-check.js:11474:8)
    at checkPackFile (.../pack-check.js:11697:18)
```

`pack-check.ts` has no `try`/`catch` around `validatePackDocument`
(`apps/server/src/pack-check.ts:72-74`), so the author gets a Node stack trace, not a refusal.
This is the shape the B+N agent hit.

#### 2b. Which objectives get their rules compiled during validation

`objectiveRules` is called from `runtimeIssues` in exactly two places, both gated on
`PLAN_OBJECTIVES` (`apps/server/src/pack-validation.ts:93-96`, `:476`, `:479-481`):

| Objective type | Rules compiled during validation? | Where |
|---|---|---|
| `reach_structure` | **yes** | `PLAN_OBJECTIVES` → `:476` (top level), `:479-481` (legs) |
| `preserve_plan_window` | **yes** | same |
| `execute_break` | **yes** | same |
| `prevent_opponent_plan` | **yes** | same |
| `transition_to_endgame` | **yes** | same |
| `win` | **no** | — |
| `hold` | **no** | — |
| `save` | **no** | — |
| `resist` | **no** | — |
| `play_until_checkpoint` | **no** | — |
| `follow_theory` | **no** | — |
| `run_trajectory` | vacuous at top level (`objectiveRules` returns `[]` at `pack-orchestrator.ts:171`); **legs** follow the same five-of-twelve rule above |

**Five of twelve.** The seven that are not compiled include every outcome type — which is why the
B+N `win` pack validated clean and exploded. This is the general defect, and the reported crash is
one of its instances.

**Independently derived, and the membership agrees, not just the count.** The codex
pack-vocabulary audit (`planning/pack-vocabulary-audit/report.md` §"Validation does not exercise
every play path (D32 generalized)", commit `6c7a579`) built the same matrix from the opposite
direction — enumerating the declared vocabulary rather than chasing a crash — and reached the same
five/seven split with the **same members**: `reach_structure`, `preserve_plan_window`,
`execute_break`, `prevent_opponent_plan`, `transition_to_endgame` compiled; `win`, `hold`, `save`,
`resist`, `play_until_checkpoint`, `follow_theory` and the `run_trajectory` wrapper not. Two
methods agreeing on a count but not a membership would be a false convergence; this is not one.
The audit closes: *"This independently confirms the scope already written into
`rfc/validator-integrity.md` without editing that RFC."*

#### 2c. The second half: a leg objective is validated by a twelfth of the rules

Every objective check in `runtimeIssues` between `:439` and `:601` reads `pack.objective` and
`pack.objective.grading` directly. Only `OBJECTIVE_GRADES_NOTHING` was ever given a leg arm
(`:479-481`). Thirteen codes are rooted at `/objective`; **twelve of them never run on a leg**:

| Code | Shipped line | Runs on a leg today |
|---|---|---|
| `OBJECTIVE_GRADING_REQUIRED` | `:439-447` | no |
| `OBJECTIVE_GRADING_UNSUPPORTED` | `:448-456` | no |
| `OBJECTIVE_RESOLUTION_UNKNOWN` | `:457-465` | no |
| `OBJECTIVE_RESIST_NEEDS_CHECKPOINT` | `:466-474` | no |
| `OBJECTIVE_GRADES_NOTHING` | `:476-478` | **yes** (`:479-481`) |
| `UNSUPPORTED_OBJECTIVE_CONDITION` | `:486-494` | no |
| `THEORY_ABSORBING_UNSUPPORTED` | `:496-498` | no |
| `OBJECTIVE_SELF_TRANSITION` | `:499-507` | no |
| `OBJECTIVE_ABSORBING_WITHOUT_OUTCOME` | `:508-520` | no |
| `OBJECTIVE_OUTCOME_TARGET_INVALID` | `:521-533` | no |
| `OBJECTIVE_DEGRADED_IS_ONE_WAY` | `:534-546` | no |
| `SYZYGY_ASSESSMENT_OUT_OF_RANGE` | `:569-579` | no (moot — §3c) |
| `SYZYGY_ASSESSMENT_MISMATCH` | `:592-600` | no (moot — §3c) |

**Repro 3 — a green pack that throws mid-run.** `OBJECTIVE_SELF_TRANSITION` exists because
`ALLOWED_TRANSITIONS` has no self-edge (`packages/runtime/src/objective-state.ts:3-10`) and
`evaluateObjective` calls `transitionObjective` → `assertObjectiveTransition` unconditionally once
a rule matches (`packages/runtime/src/objective.ts:321-329`, `:264-285`,
`objective-state.ts:39-50`). On a **leg**, nothing checks it. Appending
`{"kind":"material_balance","perspective":"white","comparison":"atLeast","value":-99,"to":"degraded","from":["degraded"]}`
to leg 0 of the B+N trajectory:

```
pack-check valid: true
objectiveRules(leg 0) = active->preserved | degraded->preserved | active->degraded
                      | preserved->degraded | degraded->degraded
evaluateObjective THREW: ObjectiveTransitionError Objective transition is not allowed: degraded -> degraded
```

**Read the precondition, because the test depends on it.** `evaluateObjective` only selects a rule
whose `from` equals the node's *current* `objectiveState` (`objective.ts:321-325`), so the
`degraded → degraded` rule is inert at the run root and the throw needs the objective to already be
`degraded`. That state is reachable in an ordinary run of this very document: leg 0's **existing**
success conditions already compile an `active → degraded` rule (third in the list above), and once
the node is `degraded` the `material_balance atLeast -99` predicate is trivially true, so the
self-edge is selected the moment the earlier `degraded → preserved` rule's predicate is false.
Cross-review confirmed both halves separately: at the root `evaluateObjective` returns
`matchedRuleId: null`; with the node's state set to `degraded` it throws as shown. A test that
evaluates only at the root will pass against the broken compiler — criterion 1c pins the
precondition for that reason.

#### 2d. This was specified and did not ship — D37, a false completion record

`rfc/archive/trajectory-drill.md` is registered `implemented`. Its §10 (`:970-978`) specifies the
fix in a table:

> | The **twelve** codes rooted at `/objective` | Extracted into `objectiveIssues(objective, pointerPrefix)`, closing over `pack` and `checkpoints`. Called once for `pack.objective` at `/objective` when `legs` is absent, or **once per leg** at `/legs/{i}/objective` when it is present. This is the whole point: without it a leg's objective is validated by nothing at all |

`objectiveIssues` does not exist anywhere in `apps/` or `packages/`. Its acceptance criterion 9
(`:1307-1319`) names a concrete case — *"A trajectory whose second leg declares `type: "hold"`
with no `grading` fails with `OBJECTIVE_GRADING_REQUIRED` at pointer `/legs/1/objective/grading`"*.
Run against the shipped tree today:

```
$ make pack-check FILE=<B+N trajectory, leg 1 replaced by {"type":"hold","summary":"..."}>
Pack check passed
```

The count in that table — twelve — matches the twelve `no` rows above exactly. This RFC finishes
that extraction; it does not redesign it.

**All four parts re-verified during cross-review**, against `rfc/archive/trajectory-drill.md` at
`8e6dc2f`: (i) the `objectiveIssues(objective, pointerPrefix)` row is at `:976`, inside §10 which
opens at `:962`; (ii) `grep -rn objectiveIssues apps/ packages/` excluding build output returns
**nothing**; (iii) only `OBJECTIVE_GRADES_NOTHING` has a leg arm (`pack-validation.ts:479-481`) —
the other twelve read `pack.objective` directly; (iv) acceptance criterion 9 opens at `:1307` and
its first named case still returns `Pack check passed`. **This is a process finding as much as a
code one:** an archived RFC is registered `implemented` while a named function from its
specification does not exist and its own acceptance criterion fails on demand. The ledger row D37
carries that half; this RFC carries the code half and nothing more — the reconciliation-gate
question belongs to whoever owns the gate.

Archive §10 also assigns `CHECKPOINT_BOUNDARY_WITHOUT_BOUNDARY` (`pack-validation.ts:429-431`) to a
third bucket — the one objective-independent code, which **stays exactly where it is**, outside the
extracted function. This RFC keeps that placement; criterion 9 asserts it fires exactly once.

#### 2e. Everything reachable from a green pack

| Site | Effect from a document that passes `pack-check` today | Class |
|---|---|---|
| `pack-orchestrator.ts:137` | bare `TypeError` on a feature-less structural condition | **crash** |
| `objective-state.ts:44-45` via `objective.ts:328` | `ObjectiveTransitionError` on a leg self-transition | **crash** |
| `evidence-ref.ts:50-55` via `pack-orchestrator.ts:133` | bare `TypeError` for any `rules_fact` value outside `RULES_EVIDENCE_FACTS` (`evidence-ref.ts:1-26`) | **crash, latent** — §7 |
| `pack-orchestrator.ts:121-122` | bare `TypeError` from the `successPredicate` exhaustiveness guard, if the `successCondition` union widens ahead of the compiler | **crash, latent** |
| leg `grading.resolveAt` naming an unknown checkpoint | the `checkpointReachedHere` rule compiles and never fires | **silent no-op** |
| leg `resist` with `resolveAt.kind: "terminal"` | the `resist` loss exemption (`pack-orchestrator.ts:244-255`) never compiles; a survived loss grades `failed` | **silent no-op** |
| `follow_theory` **leg** with no `authoredBoundary` | `insideAuthoredBoundary` returns `false` for every non-root node (`packages/runtime/src/line.ts:105-107`), so `lineMembership` can never return `on_line` (`:138-144`) — the theory leg reports no on-line move, ever | **silent no-op, live in two committed drafts** |

The bottom row is not hypothetical: `content/drafts/trajectory-qgd-exchange-minority.json` and
`content/drafts/trajectory-caro-advance-chain-bishops.json` each declare a `follow_theory` leg and
carry **no** `authoredBoundary`, and both pass `pack-check` today.

**Verified negative — structural *evaluation* is already statically covered, and this RFC adds
nothing there.** Every throw in `packages/runtime/src/structure.ts` reachable from a
schema-valid document is already refused by `structuralIssues`
(`pack-validation.ts:119-191`), which `structuralIssuesInPack` (`:193-204`) walks over the whole
document including legs: `named_structure` under `mirrored` (`structure.ts:232` ↔
`MIRRORED_NAMED_STRUCTURE`), the quantified domain guards (`:279`, `:284` ↔
`QUANTIFIED_DOMAIN_EMPTY`; the negative and out-of-range halves are unreachable because
`$defs/rankRange` bounds 1–8 and `$defs/file` is `^[a-h]$`), and `Invalid square` (`:143`, `:217`)
which `$defs/square`'s `^[a-h][1-8]$` makes unreachable. The remaining throws are `never`
exhaustiveness guards. This is stated so a reviewer can see the sweep was total, not stopped at
the first fix.

### 3. D32 — the fix

#### 3a. Total compilation

`runtimeIssues` gains a compilation pass that runs **after** the existing checks and covers every
objective in the document: `pack.objective` at pointer `/objective` when `legs` is absent, and
`pack.legs[i].objective` at `/legs/{i}/objective` for every `i` when it is present. For each, it
calls `objectiveRules(pack, objective)` inside a `try`/`catch`.

This replaces the `PLAN_OBJECTIVES` gate at `:476` and `:479-481`: `OBJECTIVE_GRADES_NOTHING` is
emitted from inside the same pass, keeping its existing condition (`PLAN_OBJECTIVES.has(type)` and
a zero-length rule set) and its existing pointers, so its behaviour is unchanged for every
document. The gate disappears; the code does not.

#### 3b. `PackCompileError`, and the named issues

A coded error class is added in `apps/server/src/pack-orchestrator.ts`, following the shipped
`SourcingError` / `ServerError` / `BranchQueryError` pattern:

```ts
export class PackCompileError extends Error {
  readonly code: string;
  readonly pointer: string;
  constructor(code: string, pointer: string, message: string) { ... }
}
```

`objectiveRules` gains a third optional parameter `pointerPrefix = "/objective"`, threaded into
`conditionRules` and `conditionEvidenceRefs` so a thrown error carries the pointer of the offending
condition. The parameter is optional and defaulted, so `apps/server/src/progress.ts:89` and
`pack-orchestrator.ts:297`, `:302` are unchanged.

Three bare `TypeError`s become `PackCompileError`s:

| Was | Becomes | Pointer |
|---|---|---|
| `pack-orchestrator.ts:137` | `STRUCTURAL_CONDITION_HAS_NO_FEATURE` | `{prefix}/successConditions/{i}/feature` |
| `pack-orchestrator.ts:121-122` | `SUCCESS_CONDITION_KIND_UNRECOGNISED` | `{prefix}/successConditions/{i}/kind` |
| `rulesEvidenceRef` throwing at `pack-orchestrator.ts:133` | `EVIDENCE_FACT_UNSUPPORTED` | `{prefix}/successConditions/{i}/fact` |

`rulesEvidenceRef` itself (`packages/runtime/src/evidence-ref.ts:50-55`) is **not** changed — it is
a runtime-package invariant with other callers. `conditionEvidenceRefs` wraps its call and
rethrows.

The compilation pass converts them:

- a caught `PackCompileError` → `runtimeIssue(error.code, error.pointer, error.message)`;
- **any other thrown value** → `runtimeIssue("OBJECTIVE_RULES_UNCOMPILABLE", pointer, message)`,
  the backstop that guarantees the law holds even for a compiler path this RFC did not foresee.

`STRUCTURAL_CONDITION_HAS_NO_FEATURE`'s message must name the cause an author can act on:
`"structural success condition has no feature leaf: an expression built only from pieceOnSquare
or quantified-over-piece nodes derives no rules evidence reference"`.

**Why refusal and not a fallback reference.** The alternative — inventing an evidence reference
for piece-placement leaves so `conditionEvidenceRefs` becomes total — was rejected. Evidence
references are the product's grounding contract; minting one to paper over an authoring error is
the manufactured-truth shape law 8 forbids. Refusal at load time is also airtight rather than
merely likely: `PackRegistry.fromDocuments` validates every pack before registering it
(`pack-registry.ts:124-135`, `:224`), so a refused document can never reach `orchestratePackMove`.

#### 3c. Per-leg parity: the twelve codes

The block at `pack-validation.ts:439-474`, `:483-548` and `:569-601` is extracted into
`objectiveIssues(objective, pointerPrefix)`, closing over `pack` and the `checkpoints` set, exactly
as `rfc/archive/trajectory-drill.md` §10 specified. It is called once at `/objective` when `legs`
is absent and once per leg at `/legs/{i}/objective` when it is present.

Four constraints on the extraction:

1. **Behaviour-preserving for leg-free packs.** For a document without `legs` the emitted issue
   list must be identical in content *and order* to today's.
2. **`theoryObjective` becomes `objective.type === "follow_theory"` of the objective under
   examination**, not of `pack.objective`. This is what makes `THEORY_ABSORBING_UNSUPPORTED` work
   on a theory leg.
3. **`outcomeObjective` is rebased the same way — this is load-bearing, not bookkeeping.**
   `outcomeObjective` is computed once from `pack.objective.type` (`pack-validation.ts:403-405`)
   and gates **five** of the twelve extracted codes: `OBJECTIVE_GRADING_REQUIRED`,
   `OBJECTIVE_GRADING_UNSUPPORTED`, `OBJECTIVE_ABSORBING_WITHOUT_OUTCOME`,
   `OBJECTIVE_OUTCOME_TARGET_INVALID` and `OBJECTIVE_DEGRADED_IS_ONE_WAY`. Inside
   `objectiveIssues` it must be `["win","hold","save","resist"].includes(objective.type)` for the
   objective under examination. Two things break without this, and both are silent:
   - **Criterion 2 cannot pass.** A trajectory's `pack.objective.type` is `run_trajectory`, so a
     pack-level `outcomeObjective` is `false` for every leg — and `OBJECTIVE_GRADING_REQUIRED`,
     the exact code `rfc/archive/trajectory-drill.md` criterion 9 names for a grading-less `hold`
     leg, can never fire.
   - **Three committed drafts would newly fail.** `trajectory-mate-bishop-knight.json`,
     `trajectory-qgd-exchange-minority.json` and `trajectory-caro-advance-chain-bishops.json` each
     carry `grading` on their final (outcome) leg. With a pack-level `outcomeObjective` of `false`,
     `OBJECTIVE_GRADING_UNSUPPORTED` would fire on all three at `/legs/2/objective/grading`.

   The same rebasing applies to **every** read of `pack.objective` inside the extracted region, and
   the region has four more: the local `const grading = pack.objective.grading`
   (`pack-validation.ts:406`) becomes `objective.grading`; the `resist` gate (`:466`) becomes
   `objective.type === "resist"`; and the two message interpolations (`:444`, `:453`) name the
   examined objective's type, so the refusal reads `hold objectives require grading`, not
   `run_trajectory objectives require grading`. After the extraction **no `pack.objective` read may
   remain inside `objectiveIssues`** — a grep for it in the extracted body returning empty is the
   cheapest possible regression test, and criterion 3 requires it. The one deliberate exception is
   `SYZYGY_ASSESSMENT_MISMATCH`, which §4b keys on the **effective outcome type** instead, and which
   reads `pack.start` — not `pack.objective` — for everything else.
4. **The syzygy pair stays inside the extracted function and stays dead on legs.**
   `SYZYGY_ASSESSMENT_OUT_OF_RANGE` and `SYZYGY_ASSESSMENT_MISMATCH` read `pack.start.fen` and
   `pack.start.side` — the pack's root, not the leg's entry — so on a leg they would check the
   wrong position. `TRAJECTORY_LEG_SYZYGY_UNSUPPORTED` (`pack-validation.ts:358`) already refuses a
   leg syzygy assessment before they can be reached, and this RFC **keeps that refusal**: the
   reasoning in `rfc/archive/trajectory-drill.md:929-937` is correct — a leg's entry position is
   not known until a run reaches it, so there is nothing static to bind a tablebase record to.

**Corpus impact: none — conditional on constraint 3.** All four leg-bearing documents in the tree
(`content/drafts/trajectory-mate-bishop-knight.json`, `trajectory-qgd-exchange-minority.json`,
`trajectory-caro-advance-chain-bishops.json`, `trajectory-legs.browser.json`) were checked leg by
leg against all twelve rules; all **twelve legs** are clean. Cross-review re-ran the check
mechanically — each code's shipped predicate evaluated against each leg's objective — and
reproduced the result, **but only with `outcomeObjective` rebased per constraint 3.** With the
pack-level `outcomeObjective` left in place the same sweep produces three
`OBJECTIVE_GRADING_UNSUPPORTED` refusals. "Corpus impact: none" is therefore a claim about the
specified extraction, not about any extraction.

#### 3d. The theory-family gate widens, and two committed drafts must be fixed

The seven theory-family codes — `THEORY_OBJECTIVE_NEEDS_LINE_MODE` (`:414-416`),
`THEORY_NEEDS_AUTHORED_BOUNDARY` (`:417-419`), `BOUNDARY_NEEDS_PLY_HORIZON` (`:420-422`),
`BOUNDARY_GRANTS_NOTHING` (`:423-425`), `THEORY_NEEDS_BOUNDARY_CHECKPOINT` (`:426-428`),
`THEORY_DEVIATION_NEEDS_SPINE_ANCHOR` (`:432-438`) and `BOUNDARY_HORIZON_EXCLUDES_EVERY_GRANT`
(`:550-567`) — name pack-level shape (`/mode`, `/authoredBoundary`, `/checkpoints`,
`/deviations`), so they run **once**, not once per leg, and stay outside `objectiveIssues`. Their
gate widens as `rfc/archive/trajectory-drill.md` §10 row 2 requires. That row states the intent in
prose — *"For a leg-bearing pack the `theoryObjective` predicate they are gated on becomes 'the
pack has a `follow_theory` leg'"* (`:977`) — and the encoding this RFC pins is:

```
theoryObjective := pack.objective.type === "follow_theory"
                   || (pack.legs ?? []).some((leg) => leg.objective.type === "follow_theory")
```

well-defined because `TRAJECTORY_MULTIPLE_THEORY_LEGS` (`:370`) admits at most one theory leg, and
equivalent to the archive's prose because a `legs`-bearing pack must be `run_trajectory` at the top
level (`LEGS_NEED_TRAJECTORY_OBJECTIVE`, `:331-333`) — the two disjuncts are mutually exclusive.
`THEORY_OBJECTIVE_NEEDS_LINE_MODE` keeps its own narrower gate — it must continue to fire on a
top-level `follow_theory` in a non-`line` pack and must **not** fire on a theory *leg* of a
`mode: "trajectory"` pack.

**This makes two committed drafts fail `pack-check`, and it should — D38.**
`content/drafts/trajectory-qgd-exchange-minority.json` and
`content/drafts/trajectory-caro-advance-chain-bishops.json` declare a `follow_theory` leg with no
`authoredBoundary`. Per §2e, `insideAuthoredBoundary` returns `false` for every non-root node when
the boundary is absent (`line.ts:105-107`), so `lineMembership` classifies every in-book move as
`unknown` or `classified_deviation` and never as `on_line` (`:138-144`). Their theory legs deliver
nothing. Verified during cross-review: both packs are `mode: "trajectory"`, neither declares
`authoredBoundary`, neither has an `atAuthoredBoundary` checkpoint, and both pass `pack-check`
today.

**Exactly which codes fire, and therefore exactly what the content fix must contain.** Evaluating
the seven predicates against both packs with the widened gate:

| Code | Fires | Why |
|---|---|---|
| `THEORY_OBJECTIVE_NEEDS_LINE_MODE` | no | keeps its narrower top-level gate |
| `THEORY_NEEDS_AUTHORED_BOUNDARY` | **yes** | `boundary === undefined` |
| `BOUNDARY_NEEDS_PLY_HORIZON` | **yes** | `boundary?.plyHorizon === undefined` is true when the boundary is absent |
| `BOUNDARY_GRANTS_NOTHING` | no | gated on `boundary !== undefined` |
| `THEORY_NEEDS_BOUNDARY_CHECKPOINT` | **yes** | neither pack has an `atAuthoredBoundary` checkpoint (0 ≠ 1) |
| `THEORY_DEVIATION_NEEDS_SPINE_ANCHOR` | no | all 4 and all 5 deviations are `spineNodeId`-anchored; **zero** use `fen` |
| `BOUNDARY_HORIZON_EXCLUDES_EVERY_GRANT` | no | gated on a declared `plyHorizon` |

So the fix is exactly three things per pack and no more: an `authoredBoundary`, a `plyHorizon`
inside it, and one `atAuthoredBoundary` checkpoint — plus at least one grant
(`spineNodeIds` or `fenPredicates`), or `BOUNDARY_GRANTS_NOTHING` fires once the boundary exists.
`authoredBoundary` on a non-`line` pack is already precedented: `content/drafts/mate-bishop-knight.json`
is `mode: "outcome"` and carries one with 39 `spineNodeIds` and `plyHorizon: 40`.

**This RFC does not edit `content/` and the drafting agent could not.** The instruction to the
implementing agent is therefore explicit and is a hard gate, not a note: **the two content fixes
land in the same commit as the widening**, and criterion 9 both asserts the fixed packs pass and
pins the refusal by removing the boundary again. If the widening lands without them, `make verify`
is red and `make pack-check` fails on two committed drafts — which is the correct failure mode, but
it is a failure mode, so the commit is not splittable.

#### 3e. What the fix deliberately does not do

- **It does not evaluate rules.** Compilation is position-independent and total; evaluation is
  not, and pre-running a rule at the root would refuse packs that are correct. The root probe
  already covers the one position that *is* static, for checkpoints (`:603-651`).
- **It does not touch `orchestratePackMove:300`** (`"Committed trajectory node has no parent"`) —
  a genuine internal invariant on a committed node, unreachable from any document.
- **It does not guard `apps/server/src/progress.ts:89`** (the only `objectiveRules` caller outside
  `pack-validation.ts` and `pack-orchestrator.ts`). With registry validation total, `objectiveRules`
  cannot throw there for a registered pack; adding a swallow-and-degrade would convert a crash into
  a wrong progress row, which is worse.

### 4. D33 — the decision

#### 4a. Two candidates; one is dishonest

**Candidate A — teach `verify-draft` to ground a trajectory through its legs. Rejected.** It
requires a per-leg tablebase record, and there is no position to anchor it to: a leg's entry
position is a function of how the learner played the previous leg. This is precisely the argument
`rfc/archive/trajectory-drill.md:929-937` used to refuse `TRAJECTORY_LEG_SYZYGY_UNSUPPORTED`, and
that argument has not weakened. Grounding a leg would mean either binding a record to
`pack.start.fen` (the wrong position, silently) or minting a record for a position no query was
made against.

**Candidate B — let the trajectory carry the grounding it actually has: the root. Accepted.**

The decisive observation is that `objective.grading.assessedBy` is already, in the shipped
product, a claim about the **root position**, not about the grading machinery. The client renders
it verbatim as *"Root assessment: …"* (`apps/web/src/lib/outcome-presentation.ts:41-52`),
`assessmentGrounding` matches it against a ledger record whose `supports` includes `/start/fen`
(`apps/server/src/sourcing/ledger-validation.ts:395-407`), and `verify-draft` verifies it by
querying `pack.start.fen` (`apps/server/src/sourcing/verify-draft.ts:133-136`). A trajectory has a
static root like any other pack. The only thing standing between it and `ledger_verified` is
`OBJECTIVE_GRADING_UNSUPPORTED` (`pack-validation.ts:448-456`), which refuses `grading` on
`run_trajectory` because `grading` was originally scoped to outcome objectives.

The separation this RFC draws, and which the format should have drawn from the start:

> **`successConditions` are grading. `assessedBy` is grounding.** A trajectory grades through its
> legs, so `TRAJECTORY_TOP_LEVEL_CONDITIONS_UNSUPPORTED` (`:334-336`) stays. A trajectory is a
> single continuous game from a single static root, so its root assessment belongs at the top
> level.

**This is not a silent no-op**, the thing §1 forbids. `objectiveRules` returns `[]` for
`run_trajectory` (`pack-orchestrator.ts:171`) and continues to, so the top-level grading compiles
to no rules — but it is consumed by three shipped readers: `assessmentGrounding`
(`ledger-validation.ts:380-408`), `verify-draft` (`:128-129`), and `assessmentSentence`
(`outcome-presentation.ts:41-52`). It has a reader, an evidence chain and a rendered sentence.

#### 4b. Specification

When `pack.objective.type === "run_trajectory"` and `pack.objective.grading` is present:

1. `OBJECTIVE_GRADING_UNSUPPORTED` does **not** fire. It continues to fire, unchanged, for every
   other objective type outside `["win", "hold", "save", "resist"]`.
2. `OBJECTIVE_GRADING_REQUIRED` is unchanged: grading remains **optional** for `run_trajectory`.
   A trajectory with no root evidence declares no grading, exactly as today.
3. `grading.resolveAt.kind` **must** be `"terminal"`. A checkpoint resolution would compile the
   `active → preserved` resolution rule that `objectiveRules` never emits for `run_trajectory`
   (`pack-orchestrator.ts:171`, `:262-274`) — a silent no-op. New code
   `TRAJECTORY_GRADING_RESOLUTION_UNSUPPORTED` at `/objective/grading/resolveAt`.
4. `grading.assessedBy.kind: "authored"` is admitted with no further check; it renders through the
   shipped unproved marker.
5. `grading.assessedBy.kind: "syzygy"` is admitted, and the shipped syzygy checks apply with one
   substitution:
   - `SYZYGY_ASSESSMENT_OUT_OF_RANGE` (`:569-579`) is **unchanged** — it reads `pack.start.fen`,
     which for a trajectory is exactly the position being claimed.
   - `SYZYGY_ASSESSMENT_MISMATCH` (`:592-600`) compares the learner-perspective category against
     the **effective outcome type**, defined as `pack.objective.type` for a non-trajectory pack and
     `pack.legs.at(-1).objective.type` for a trajectory. The existing map is reused verbatim:
     `win → "win"`, `hold → "draw"`, `save`/`resist` → `"loss"`. The side-to-move inversion at
     `:580-586` is unchanged.
   - If the final leg's objective type is not in `["win", "hold", "save", "resist"]`, there is
     nothing to check the category against. New code `TRAJECTORY_ASSESSMENT_NEEDS_OUTCOME_LEG` at
     `/objective/grading/assessedBy/category`, and `SYZYGY_ASSESSMENT_MISMATCH` does not also fire.
6. `TRAJECTORY_LEG_SYZYGY_UNSUPPORTED` (`:358`) is unchanged. A leg still may not carry a syzygy
   assessment.

**Zero changes outside `pack-validation.ts`.** `verify-draft.ts`, `ledger-validation.ts`,
`pack-registry.ts` and `outcome-presentation.ts` are untouched: all four already read
`document.objective.grading?.assessedBy` without consulting `objective.type`.

**What this buys, concretely.** `content/drafts/trajectory-mate-bishop-knight.json` gains — it does
not have today, because today it may not — a top-level

```json
"objective": {
  "type": "run_trajectory",
  "summary": "...",
  "grading": {
    "assessedBy": { "kind": "syzygy", "category": "win", "pieceCount": 4,
                    "sourceId": "syzygy", "retrievedAt": "..." },
    "resolveAt": { "kind": "terminal" }
  }
}
```

and `make verify-draft FILE=content/drafts/trajectory-mate-bishop-knight.json` succeeds with no
change to `verify-draft`. The root is `8/8/4k3/8/4K3/2BN4/8/8 w - - 0 1` (four pieces, `win`) and
the final leg is `win`.

**The proof this needs no `verify-draft` change is a byte comparison, and cross-review ran it.**
`verify-draft` reads exactly four things off the document to decide what to query:
`objective.grading.assessedBy` (`:128-129`), and then `start`, `spine` and `deviations`, which are
the only inputs to `enumerate` (`:60-80`). Compared field by field against the sibling
`content/drafts/mate-bishop-knight.json`, the trajectory's `start`, `spine`, `deviations` **and**
`opponentPolicy` are equal — identical canonical JSON, not merely similar. The sibling verifies and
ships 53 evidence records (1 `position_legality` + 52 `tablebase_result`), so `enumerate` and the
regression sweep at `:139-149` traverse **the same 52 positions in the same order**, and every
tablebase answer the trajectory needs is an answer the sibling already obtained. The sibling pack no
longer has to exist to carry the trajectory's evidence.

**Two things are *not* equal, and criterion 11 depends on both.** The packs differ in `id`, `title`,
`objective`, `legs`/`authoredBoundary` and checkpoint count (5 vs 4), so their **digests differ** —
`assessmentGrounding` matches on `ledger.packId === document.id` (`ledger-validation.ts:403-406`),
so the trajectory needs its own emitted ledger and cannot borrow the sibling's file. And
`retrievedAt` is stamped per query, not derived from the position, so it is **not** comparable
across two verification runs; criterion 11 excludes it from the equality assertion for that reason.

#### 4c. Why no pack-schema version is claimed

`$defs/objective` (`schemas/drill_pack.schema.json:176-188` at `8e6dc2f`) already permits `grading`
on any objective type — its `properties` block lists `type`, `summary`, `grading` and
`successConditions` with `additionalProperties: false` and **no `if`/`then`/`allOf` anywhere in the
def** — and `$defs/trajectoryLeg` (`:190-199`) `$ref`s that same `$defs/objective`. The refusal is
**entirely** in `runtimeIssues`. Relaxing it changes no schema document and no `$id`.
The register's 0.19 slot stays free.

**The claim was attacked directly during cross-review, and it survives with one correction.** The
whole corpus was re-validated against the shipped `pack-check`: **41** pack drafts in
`content/drafts/`, **36** `content/candidates/*/pack.json`, `schemas/drill_pack.example.json`, and
all **8** fixtures in `schemas/fixtures/drill-pack/`. Every positive document passes; all seven
`*.invalid.json` fixtures fail, as they must. None of them declares `grading` on a
`run_trajectory` objective, so **relaxing `OBJECTIVE_GRADING_UNSUPPORTED` changes the verdict on
zero committed documents** and moves zero bytes by itself.

**The correction: three committed drafts do change, and their digests move — but not because of
this section.** They change because criteria 9 and 11 mandate *content fixes*, in the same commit:
`trajectory-qgd-exchange-minority.json` and `trajectory-caro-advance-chain-bishops.json` gain an
`authoredBoundary` and a checkpoint; `trajectory-mate-bishop-knight.json` gains the top-level
`grading` above and is then **rewritten in place by `verify-draft` itself**, which stamps
`assessedBy.sourceId` and `assessedBy.retrievedAt` back into the file
(`verify-draft.ts:152-153`, `:177`) and emits three new sidecars. That is a content change, not a
format change: no `$id`, no `DRILL_PACK_SCHEMA_VERSION`, no migration, no run-schema field, and no
digest of any *unmodified* pack. Criterion 16 states it in exactly those terms. **"Claims nothing
versioned" is true; "changes nothing on disk" was never the claim and would be false.**

### 5. The per-leg authoring gap — scoped out, and why

The gap is real and twice-attested. Per-leg `opponentPolicy` is the item with teeth: phase 1 of a
mate trajectory could be drilled against a weaker defender while phase 3 must be perfect, and
resistance-varied replay is inherently per-phase.

**One of the three is already being shipped by the draft ahead of this one.**
`rfc/authoring-frictions.md` §5 adds per-leg `branchLengthTarget` to `$defs/trajectoryLeg` under
pack schema 0.16 — present in the working tree as
`"branchLengthTarget": { "type": "integer", "minimum": 2, "maximum": 40 }` inside
`$defs/trajectoryLeg`. That draft owns the field, its runtime wiring and its interaction with a
top-level `difficulty.branchLengthTarget`; this RFC touches none of it and makes no claim about it.
The gap this section scopes out is therefore the **two** remaining fields, `opponentPolicy` and
`shapes` — and the §2 statement that `$defs/trajectoryLeg` is `{id, entryCheckpointId?, objective}`
describes `8e6dc2f`, not the tree this RFC will land on.

**This RFC ships neither remaining field and claims no pack-schema version.** Adding
`opponentPolicy` to `$defs/trajectoryLeg` costs one schema line; making the runtime honour it does
not. `opponentPolicy` is immutable run-session state:

- it is a field of the `run.started` event payload (`packages/runtime/src/types.ts:128-140`),
  stamped once at creation from the session (`packages/runtime/src/runtime.ts:211`, `:229`);
- `resistanceOnPath` reports it as the run's `requested` policy — the value the client shows as
  what the learner asked for (`packages/runtime/src/replay.ts:127-128`);
- `#selectionRequest` reads `run.opponentPolicy` for `targetElo` / `temperature` / `topP` on every
  opponent move (`apps/server/src/service.ts:1744-1765`);
- selection reuse compares each stored move's `policyModeApplied` against the run's single
  requested mode (`apps/server/src/service.ts:914-931`);
- `distillRun` copies it into a derived pack (`apps/server/src/distill.ts:86`) and the human-split
  and corpus endpoints read it per request (`apps/server/src/rest.ts:1022`, `:1037`).

Landing the field without moving all six sites would ship a pack format whose declared per-leg
resistance the runtime ignores — **a new instance of exactly the defect class this RFC exists to
kill**, and one that `pack-check` would pass by construction. Moving them is a run-schema
conversation (the persisted `requested` policy becomes a lie for legs 2+), which the register lane
for this draft excludes.

Per-leg `shapes` is cheaper but not free, and shipping it alone would not answer the attestation,
which is about resistance.

**Recommendation for the ledger:** a follow-up RFC, `trajectory-per-leg-resistance`, owning the
six sites above plus the run-schema decision, and claiming pack schema 0.19 at that point. This
RFC does not claim it. The `design/BACKLOG.md` row to update is **Trajectory-format frictions**,
which after `authoring-frictions` lands is down to two fields, not three.

### 6. New refusal codes, and the collision sweep

Eight new codes. All are `severity: "error"`, `source: "runtime"`, and live in `runtimeIssues`,
per the file's shipped convention (`pack-validation.ts:85-91`). The last two are §8's.

| Code | Fires when | Pointer |
|---|---|---|
| `STRUCTURAL_CONDITION_HAS_NO_FEATURE` | a `structural_feature` success condition whose expression yields no feature leaf | `…/successConditions/{i}/feature` |
| `SUCCESS_CONDITION_KIND_UNRECOGNISED` | the compiler meets a `successCondition` kind it has no predicate for | `…/successConditions/{i}/kind` |
| `EVIDENCE_FACT_UNSUPPORTED` | a condition names a rules fact outside `RULES_EVIDENCE_FACTS` | `…/successConditions/{i}/fact` |
| `OBJECTIVE_RULES_UNCOMPILABLE` | rule compilation throws anything else (backstop) | `/objective` or `/legs/{i}/objective` |
| `TRAJECTORY_GRADING_RESOLUTION_UNSUPPORTED` | `run_trajectory` top-level grading with `resolveAt.kind: "checkpoint"` | `/objective/grading/resolveAt` |
| `TRAJECTORY_ASSESSMENT_NEEDS_OUTCOME_LEG` | `run_trajectory` top-level syzygy assessment whose final leg is not an outcome objective | `/objective/grading/assessedBy/category` |
| `MATERIAL_EQUALITY_UNSATISFIABLE` | a `material_balance` condition with `comparison: "equal"` and a non-integer `value` (§8a) | `…/successConditions/{i}/value` |
| `RULES_FACT_WINNER_UNSUPPORTED` | `winner` declared on a `rules_fact` condition whose `fact` is not `checkmate` (§8b) | `…/successConditions/{i}/winner` |

**Collision sweep, re-run independently during cross-review.**
`grep -rhoE '[A-Z_]{5,}' apps/server/src packages/schema/src packages/runtime/src --include="*.ts"
| sort -u` yields **exactly 444** distinct literals at `8e6dc2f` (446 in the working tree, where
`authoring-frictions` has added two). **None of the eight appears.** A second sweep across `rfc/`,
`docs/`, `design/` and `planning/` — which catches codes claimed by the parallel drafts,
`rfc/authoring-frictions.md`, `rfc/tempo-vocabulary.md` and `rfc/predicate-wave-3.md` included —
also yields no match for any of the eight.

**Near neighbours, named so a reviewer does not have to find them.** The sweep surfaces four
literals close enough to confuse a reader: `STRUCTURAL_KIND_UNRECOGNISED`
(`pack-validation.ts:149`, `:182` — the exhaustiveness backstop *inside* `structuralIssues`, about
a structural **expression** node), `STRUCTURAL_EXPRESSION_TOO_DEEP` (`:153`, `:158`, `:165`),
`STRUCTURAL_FEATURE_KINDS` and `RULES_EVIDENCE_FACTS` (both constants, not codes). The pair worth a
second look is `STRUCTURAL_KIND_UNRECOGNISED` versus this RFC's
`SUCCESS_CONDITION_KIND_UNRECOGNISED`: they are distinct literals, they fire in different functions,
and they mean different things — the shipped one is about an unhandled node inside a structural
expression, the new one about an unhandled member of the `successCondition` union. The naming is
kept deliberately parallel; if the implementer prefers to disambiguate, rename the **new** one, not
the shipped one.

No existing code is renamed, retired, or given a different meaning. Twelve existing codes gain a
second pointer shape (`/legs/{i}/objective/…`), which `rfc/archive/trajectory-drill.md` §10 already
specified as their intended surface.

### 7. Cross-draft interactions

**`rfc/authoring-frictions.md` (pack schema 0.16, wave position 1) — one conflict, now closed; one
composition, still open; and one overlap this RFC gives up.**

*Conflict — reported, absorbed, closed. Kept on the record because the mechanism is the point.*
As drafted, that RFC's §8 widened the `rules_fact` enum with `"draw"` and stated *"zero runtime code
changes"*. That was false: `RULES_EVIDENCE_FACTS` (`packages/runtime/src/evidence-ref.ts:1-26` at
`8e6dc2f`) contained `draw-threefold`, `draw-50move` and `draw-insufficient` but **no bare
`"draw"`**, and `rulesEvidenceRef` throws `TypeError: Unsupported rules evidence fact: draw` for
anything outside that list (`:50-55`). A `{"kind":"rules_fact","fact":"draw"}` condition on an
outcome objective would have passed `pack-check` — because §2b's five-of-twelve gate never compiles
outcome objectives — and thrown when played: **a new instance of D32 shipping inside the wave that
exists to prevent it.**

That draft has since taken the correction. Its §8 now carries a dated block-quote crediting this
one (*"CORRECTION, 2026-08-15 (claude, after the `validator-integrity` draft caught it)"*) and adds
`"draw"` to `RULES_EVIDENCE_FACTS` with a test; the line is present in the working tree at
`packages/runtime/src/evidence-ref.ts:4`. **Nothing is left for this RFC to do here**, and the
sentence this section originally quoted no longer exists in that file — a reviewer re-checking it
will find the correction, not the claim. The two remedies remain complementary and both are wanted:
that draft removes the specific hole, this one's total compilation turns any *future* such omission
into an `EVIDENCE_FACT_UNSUPPORTED` refusal at `pack-check` time instead of a crash mid-run.

*Overlap given up.* Its §5 adds per-leg `branchLengthTarget` to `$defs/trajectoryLeg` (pack schema
0.16). That is one of the three fields the **Trajectory-format frictions** ledger row names; it is
that draft's to ship, and §5 here has been narrowed to the two that remain. No contention — but
neither draft may describe `$defs/trajectoryLeg` as closed to per-leg fields after 0.16 lands.

*Composition — still open, and this RFC carries the reconciliation.* That draft's §8c rewrites the
objective-type → expected-category map at `pack-validation.ts:569-601` into a **four-key type →
category-set** map (`win`; `hold`; `save`, `resist`), adds `ASSESSMENT_CATEGORY_MISMATCH`,
`ASSESSMENT_CATEGORY_INDETERMINATE` and `CURSED_WIN_CANNOT_ROOT_WIN` beside the retained
`SYZYGY_ASSESSMENT_MISMATCH`, and justifies the four keys as exhaustive with *"grading is refused on
any objective outside `["win", "hold", "save", "resist"]` … so no fifth objective type can reach
this table"* — on the basis of `pack-validation.ts:403`, `:448`.

**§4b of this RFC is precisely the change that invalidates that justification's premise**: it lets a
fifth type, `run_trajectory`, carry `grading`. The two still compose cleanly, in either landing
order, on one condition: **the map must be keyed on §4b's effective outcome type** — the final
leg's type for a trajectory, `pack.objective.type` otherwise — so `run_trajectory` never appears as
a key and the four keys stay exhaustive. `TRAJECTORY_ASSESSMENT_NEEDS_OUTCOME_LEG` (§6) is what
guarantees the effective type is always one of the four. Whichever lands second carries the
reconciliation; `authoring-frictions` holds wave position 1, so it is this RFC — and §4b item 5
is written that way already. The implementer must apply the same substitution to
`ASSESSMENT_CATEGORY_MISMATCH` and `CURSED_WIN_CANNOT_ROOT_WIN`, not only to
`SYZYGY_ASSESSMENT_MISMATCH`, since all three read the objective type.

**`rfc/tempo-vocabulary.md` and `rfc/predicate-wave-3.md` (pack schema 0.17, 0.18) — no
*conflict*, but not "no interaction": both widen a union this RFC's backstops guard.**

**§7 — Note to vocabulary drafts** (cite this note by that name, **not by line number**; two
sibling drafts currently cite it as
`rfc/validator-integrity.md:570` and `:570-575`, and those line numbers no longer resolve after
cross-review):

- Any draft that widens `$defs/successCondition` inherits `SUCCESS_CONDITION_KIND_UNRECOGNISED`
  as its safety net once this RFC lands. `predicate-wave-3` §5 adds a sixth kind,
  `plan_consequence`; its own analysis is correct that the new kind cannot reach the empty-leaf
  throw because its first evidence reference is unconditional, and the two changes compose without
  ordering constraints — but the `conditionEvidenceRefs` arm for the new kind must be added
  **before** the unguarded structural fall-through, exactly as `tempo-vocabulary` §4 also warns for
  its `timing_window` arm. That fall-through is the shared hazard, and it is the reason this RFC
  converts it to a named refusal rather than leaving it a `TypeError`.
- Any draft that widens `$defs/structuralExpression` inherits
  `STRUCTURAL_CONDITION_HAS_NO_FEATURE`, and any new expression node that carries no feature leaf
  must be considered against `structuralFeatureKinds`
  (`packages/runtime/src/structure.ts:449-465`).
- **One correction for `predicate-wave-3`'s reviewer, which this RFC cannot make itself:** its
  §"Not absorbed" bullet says *"`validator-integrity` (0.19) owns the fix"*. This RFC declines
  0.19 and claims no version — as that same draft states correctly in its own header and changelog.
  The D32 *fix* is owned here; the *version lane* is not.

### 8. D39 and D40 — two declarations the runtime cannot honour

**Why they are in scope, and the test for it.** §1's second corollary is already normative in this
RFC: *a rule that compiles but can never fire is a defect, not a nicety.* D39 and D40 are the two
remaining shipped instances of exactly that corollary, they were found mechanically rather than by
accident, and refusing them costs two `if`s inside `objectiveIssues` — the function §3c is already
extracting. Both are validator-only: **no schema change, no `$id` move, no migration, no run-schema
field, no new predicate, no change to what any rule means once compiled.** Absorbing them here is
strictly cheaper than a follow-up RFC that would have to re-derive §3c's extraction to place them.
The scope test this RFC applies is *"does refusing it require anything outside `runtimeIssues`?"* —
for both, no. (Contrast §5, which is scoped **out** precisely because it fails that test.)

#### 8a. D39 — decimal `material_balance` equality is unsatisfiable

`$defs/successCondition`'s `material_balance` member declares `"value": { "type": "number" }`
(`schemas/drill_pack.schema.json:294`, inside the member at `:287-299`). The runtime it feeds is
integral end to end: `MATERIAL_VALUES` is `{pawn:1, knight:3, bishop:3, rook:5, queen:9, king:0}`
(`packages/runtime/src/objective.ts:17-24`), `materialScore` sums `count × value`
(`:122-129`), and `materialBalance` returns one integer minus another (`:131-136`). Evaluation for
`equal` is exact identity — `return balance === predicate.value;` (`:228`). A condition with
`comparison: "equal"` and a non-integer `value` is therefore **globally false**: it compiles to a
well-formed rule, the rule is evaluated on every commit, and it can never fire. That is
`OBJECTIVE_GRADES_NOTHING`'s failure mode expressed one condition at a time, and the validator
currently blesses it.

**Refusal.** `MATERIAL_EQUALITY_UNSATISFIABLE` at `{prefix}/successConditions/{i}/value` when
`condition.kind === "material_balance" && condition.comparison === "equal" &&
!Number.isInteger(condition.value)`. Message: `"material balance is an integer difference of piece
values, so an equal comparison against <value> can never be true"`.

**Deliberately narrow.** `atLeast` and `atMost` with a fractional bound are **not** refused: they
are satisfiable, and a bound like `2.5` is a legitimate way to write "strictly more than two". Only
`equal` is unsatisfiable, and only for a non-integer. The schema keeps `"type": "number"` — this is
a cross-field constraint JSON Schema cannot express, which is exactly what `runtimeIssues` is for,
and narrowing the schema to `integer` would be a versioned change this RFC does not make.

#### 8b. D40 — `winner` on a non-`checkmate` rules fact is parsed and discarded

`$defs/successCondition`'s `rules_fact` member permits `winner` alongside `fact`
(`schemas/drill_pack.schema.json:300-311`; `fact` at `:305`, `winner` at `:306`) with no
conditional tying one to the other. The runtime type says otherwise: `RulesFactPredicate` is a
two-arm union in which **only the `checkmate` arm carries `winner`**
(`packages/runtime/src/objective.ts:26-35`). The compiler spreads `winner` in regardless of the
fact (`apps/server/src/pack-orchestrator.ts:109-117`), and the evaluator consults it only on the
`checkmate` branch — `if (predicate.fact === "stalemate") return position.isStalemate();`
(`:221`) reads no `winner` at all. So an author may declare a winner for a stalemate, the format
accepts it, and it has no effect: **no refusal, no effect, no signal**, which is the quietest
member of this family.

**Refusal.** `RULES_FACT_WINNER_UNSUPPORTED` at `{prefix}/successConditions/{i}/winner` when
`condition.kind === "rules_fact" && condition.winner !== undefined && condition.fact !==
"checkmate"`. Message: `"winner is only meaningful for fact checkmate; <fact> has no winner"`.

**Keyed on `fact !== "checkmate"`, not on `fact === "stalemate"`, and that is the composition with
`authoring-frictions`.** That draft's §8 widens the `rules_fact` enum with `"draw"`, whose runtime
arm also carries no `winner` (`objective.ts:34`). Keying the refusal negatively means it covers
`draw` the moment the enum widens, in either landing order, with no reconciliation line. Keying it
positively on `stalemate` would have shipped D40 again under a new fact name — the precise mistake
§7 exists to catch.

#### 8c. Placement and corpus impact

Both checks live **inside `objectiveIssues`**, in the existing `successConditions` loop, so they
inherit per-leg parity from §3c for free and their pointers carry the `/legs/{i}/` prefix on a leg
without further work. Neither reads `pack.objective`, so neither complicates §3c constraint 3.

**Corpus impact: zero, measured.** All 242 JSON documents under `content/`,
`schemas/fixtures/` and `schemas/drill_pack.example.json` were walked for both shapes: **no**
`material_balance` condition with `comparison: "equal"` and a fractional value, and **no**
`rules_fact` condition carrying `winner` on any fact other than `checkmate`. Both refusals land
green on the whole corpus, which is why they can ride this commit rather than needing a content
wave. The ledger rows D39 and D40 flip in the same commit.

## Deviations from design

None. This RFC specifies no new product surface, no new vocabulary and no new authored content
type. It restores the contract `design/04-content-architecture.md` assumes when it makes
`pack-check` the authoring gate, and it finishes an extraction an already-accepted RFC specified.

## Acceptance criteria

1. **The three D32 repros fail today and pass after.** Each is committed as a negative fixture and
   asserted twice — that `make pack-check FILE=<fixture>` exits **non-zero** (on the process exit
   code, per `Makefile:23-26`), and that the issue list contains the exact code:
   - **1a.** An outcome (`win`) pack with a `structural_feature` condition built only from
     `pieceOnSquare` → `STRUCTURAL_CONDITION_HAS_NO_FEATURE`. The test additionally asserts, in the
     same case, that `objectiveRules(document)` on the **unfixed** compiler throws — i.e. it is
     written so that deleting the validator change makes it fail with a crash, not a missing code.
   - **1b.** A trajectory whose leg 0 (`reach_structure`) carries a `quantified`-over-`piece`
     condition → same code at `/legs/0/objective/successConditions/{i}/feature`, and `pack-check`
     exits non-zero **without** a Node stack trace on stderr.
   - **1c.** A trajectory leg with `{"to":"degraded","from":["degraded"]}` →
     `OBJECTIVE_SELF_TRANSITION` at `/legs/0/objective/successConditions/{i}/from`. A companion
     runtime test asserts that on the pre-fix compiler the same document reaches
     `evaluateObjective` and throws `ObjectiveTransitionError`, so the regression is provable and
     not merely described. **The companion test must first drive the objective into `degraded`** —
     `evaluateObjective` selects only rules whose `from` equals the node's current state
     (`objective.ts:321-325`), so evaluating at the run root returns `matchedRuleId: null` and
     the test would pass against the broken compiler. Use the leg's own `active → degraded` rule,
     or `transitionObjective(run, "degraded", …)` directly; assert **both** halves — inert at the
     root, throwing from `degraded`.
2. **`rfc/archive/trajectory-drill.md` criterion 9 holds.** Its two named cases, verbatim: a
   trajectory whose *second* leg is `type: "hold"` with no `grading` fails
   `OBJECTIVE_GRADING_REQUIRED` at `/legs/1/objective/grading`; one whose *third* leg is
   `type: "resist"` with `resolveAt.kind: "terminal"` fails `OBJECTIVE_RESIST_NEEDS_CHECKPOINT` at
   `/legs/2/objective/grading/resolveAt`. Both pass `pack-check` clean on the current tree; the
   test records that fact in a comment. **Neither case can pass without §3c constraint 3** — both
   codes are gated on `outcomeObjective`/`objective.type`, which on a trajectory is
   `run_trajectory` until the extraction rebases them onto the leg.
3. **No `pack.objective` read survives inside `objectiveIssues`.** A source-level assertion, run in
   CI or by review checklist: after the extraction the body of `objectiveIssues` contains no
   `pack.objective` reference. Every one of them is a §3c-constraint-3 bug that a passing test
   suite can hide, because the only documents that expose it are trajectories.
4. **All twelve codes have a leg fixture.** One fixture per row of §2c's `no` list except the two
   syzygy codes, each asserting the code at a `/legs/{i}/objective/…` pointer, and each asserting
   the message names the **leg's** objective type, not `run_trajectory`. The syzygy pair is
   asserted **negatively**: a leg with a syzygy assessment fails with
   `TRAJECTORY_LEG_SYZYGY_UNSUPPORTED` and **not** with `SYZYGY_ASSESSMENT_MISMATCH` or
   `SYZYGY_ASSESSMENT_OUT_OF_RANGE` — the wrong-position check must never be the one that fires on
   a leg.
5. **Extraction is issue-list-identical for leg-free packs, and the corpus is enumerated.** For
   every pack document in the tree — `schemas/drill_pack.example.json`, the **41** pack files in
   `content/drafts/` (excluding `*.evidence.json`, `*.sources.json` and `*.job.json` sidecars), the
   **36** `content/candidates/*/pack.json`, and all **8** files in `schemas/fixtures/drill-pack/` —
   the issue list from `validatePackDocument` is compared before and after the extraction and
   asserted equal in content **and order**. This is a comparison of issue lists, not an assertion
   that every document passes: seven of the eight fixtures are `*.invalid.json` negatives whose
   issue lists are non-empty by design, and their lists must be equal too.
6. **The four leg-bearing documents stay clean.** `trajectory-mate-bishop-knight.json`,
   `trajectory-qgd-exchange-minority.json`, `trajectory-caro-advance-chain-bishops.json` and
   `trajectory-legs.browser.json` — twelve legs in total — emit **zero** of the twelve extracted
   codes after the extraction. Three of them carry `grading` on their final leg and are the exact
   documents §3c constraint 3 protects; this criterion is what catches its omission.
7. **The backstop is reachable.** A unit test injects a compiler that throws a plain `Error` and
   asserts `OBJECTIVE_RULES_UNCOMPILABLE` is emitted at the right pointer rather than the exception
   escaping `validatePackDocument`.
8. **Total compilation is asserted structurally, not by enumeration.** A test iterates
   `OBJECTIVE_TYPES` (`packages/schema/src/drill-pack/types.ts:1-14`) and asserts that for every
   type, a minimal valid document of that type has its rules compiled during
   `validatePackDocument` — instrumented by spying on `objectiveRules`. A new objective type added
   later without a compilation path fails this test.
9. **The theory-family widening lands with its content fix, in the same commit.**
   `content/drafts/trajectory-qgd-exchange-minority.json` and
   `content/drafts/trajectory-caro-advance-chain-bishops.json` each gain an `authoredBoundary`
   (with `plyHorizon` and at least one grant) and one `atAuthoredBoundary` checkpoint; both pass
   `pack-check`. With the boundary removed again, each is asserted to fail with **all three** codes
   §3d's table predicts — `THEORY_NEEDS_AUTHORED_BOUNDARY`, `BOUNDARY_NEEDS_PLY_HORIZON` and
   `THEORY_NEEDS_BOUNDARY_CHECKPOINT` — and each **exactly once**, not once per leg. Two
   counter-assertions, both from `rfc/archive/trajectory-drill.md` criterion 9:
   `CHECKPOINT_BOUNDARY_WITHOUT_BOUNDARY` also fires exactly once on a three-leg pack with an
   `atAuthoredBoundary` checkpoint and no boundary; and `THEORY_OBJECTIVE_NEEDS_LINE_MODE` still
   fires for a top-level `follow_theory` on a `mode: "trajectory"` pack and does **not** fire for a
   `follow_theory` leg. **This criterion and the widening are one commit; the widening is not
   landable alone**, because it turns two committed drafts red.
10. **A theory leg reports on-line moves.** On a run through the fixed
    `trajectory-qgd-exchange-minority` pack, `lineMembership` returns at least one entry with
    `verdict: "on_line"` inside the theory leg's span — the observable that
    `line.ts:105-107` made impossible before the boundary existed.
11. **D33: the B+N trajectory earns `ledger_verified` without a sibling.** With top-level `grading`
    per §4b, `make verify-draft FILE=content/drafts/trajectory-mate-bishop-knight.json` exits `0`,
    prints `Verified trajectory-mate-bishop-knight: ledger_verified`, rewrites the draft in place
    with the stamped `sourceId`/`retrievedAt` (`verify-draft.ts:152-153`, `:177`), and emits
    `.evidence.json` / `.sources.json` / `.job.json`. `PackRegistry` is asserted to report
    `assessmentGrounding: "ledger_verified"` for the trajectory. Asserted to fail on the current
    tree with `ERROR [VERIFY_ASSESSMENT_NOT_SYZYGY]`.

    **Two constraints the obvious form of this test gets wrong, both verified at cross-review:**
    - **`OFFLINE=1` does not work today and is a prerequisite, not an assumption.**
      `apps/server/src/sourcing/fixtures/verify-draft.json` holds 135 positions and **none** of
      them is a B+N position: running `verify-draft` offline on the sibling
      `mate-bishop-knight.json` fails with
      `ERROR [TABLEBASE_SOURCE_UNAVAILABLE] offline fixture missing FEN 8/8/4k3/8/4K3/2BN4/8/8 w - - 0 1`,
      and all **52** of the pack's tablebase positions are absent. The sibling's committed ledger
      was produced from a **live** query. So either this criterion runs live, or the same commit
      extends the offline fixture with all 52 positions — state which, and do not write
      `OFFLINE=1` into the test without doing the second.
    - **`retrievedAt` is not comparable and must be excluded.** The emitted ledger's root
      `tablebase_result` record is asserted equal to the corresponding record in
      `content/drafts/mate-bishop-knight.evidence.json` on **`values`, `sourceId` and `supports`
      only**. `retrievedAt` is stamped per query — a hash-derived constant offline
      (`verify-draft.ts:107-108`), wall-clock live — and the sibling's committed value
      (`2026-08-15T08:29:29.429Z`) matches neither. `packDigest` and `packId` also differ by
      construction and are not compared.
12. **D33 refusals.** A trajectory with top-level grading and `resolveAt.kind: "checkpoint"` fails
    `TRAJECTORY_GRADING_RESOLUTION_UNSUPPORTED`; one whose final leg is `execute_break` with a
    top-level syzygy assessment fails `TRAJECTORY_ASSESSMENT_NEEDS_OUTCOME_LEG` and **not**
    `SYZYGY_ASSESSMENT_MISMATCH`; one whose final leg is `hold` with `category: "win"` fails
    `SYZYGY_ASSESSMENT_MISMATCH`; and top-level `successConditions` on a trajectory still fails
    `TRAJECTORY_TOP_LEVEL_CONDITIONS_UNSUPPORTED`.
13. **Every other objective type still refuses grading.** `OBJECTIVE_GRADING_UNSUPPORTED` is
    asserted to still fire for `play_until_checkpoint`, `follow_theory` and each of the five plan
    types carrying `grading`, **both at the top level and on a leg**. Only top-level
    `run_trajectory` moves.
14. **D39.** A pack with `{"kind":"material_balance","comparison":"equal","value":1.5}` fails with
    `MATERIAL_EQUALITY_UNSATISFIABLE` at `…/successConditions/{i}/value`; the same condition with
    `"comparison":"atLeast"` and with `"value":2` both validate clean; and the refusal is asserted
    at a `/legs/{i}/objective/…` pointer too, proving it inherited per-leg parity from §3c.
15. **D40.** A pack with `{"kind":"rules_fact","fact":"stalemate","winner":"white"}` fails with
    `RULES_FACT_WINNER_UNSUPPORTED` at `…/successConditions/{i}/winner`; the same condition with
    `"fact":"checkmate"` validates clean; and a comment records that the check is keyed on
    `fact !== "checkmate"` so it covers `fact: "draw"` the moment `authoring-frictions` widens the
    enum. Asserted at a leg pointer as well.
16. **Nothing versioned moves, and exactly three content files do.**
    `DRILL_PACK_SCHEMA_VERSION`, `schemas/drill_pack.schema.json` (its `$id` and its
    `$defs/objective` / `$defs/trajectoryLeg` bodies), `DRILL_RUN_SCHEMA_VERSION` and
    `STORAGE_VERSION` are unchanged by **this** RFC's commit. Pack digests are asserted identical
    before and after for every pack **except** the three the criteria above deliberately edit —
    `trajectory-qgd-exchange-minority.json` and `trajectory-caro-advance-chain-bishops.json`
    (criterion 9) and `trajectory-mate-bishop-knight.json` (criterion 11, rewritten by
    `verify-draft` itself). Those three are enumerated in the test so a fourth moving digest is a
    failure, not a surprise.
17. **`make verify` is green**, `make pack-check` passes on every document in `content/drafts/` and
    `content/candidates/*/pack.json` after criterion 9's content fixes, and every
    `schemas/fixtures/drill-pack/*.invalid.json` still **fails** `pack-check` with an unchanged
    issue list — seven of the eight files there are negative fixtures, and a change that makes them
    pass is a regression, not a success.

## Open questions

None.

## Changelog

- 2026-08-15: created.
- 2026-08-15: adversarial cross-review (codex queue). Absorbed D39 and D40 as §8 with two new
  refusal codes; added §3c constraint 3 (`outcomeObjective` and the four other `pack.objective`
  reads must be rebased onto the objective under examination — without it criterion 2 cannot pass
  and three committed drafts newly fail); pinned all `file:line` citations to `8e6dc2f` with a
  warning that `authoring-frictions` is moving every amended file; recorded the D32 five-of-twelve
  **membership** convergence with the codex audit, not just the count; corrected §7's `rules_fact:
  "draw"` conflict to closed (that draft took the correction; `"draw"` is in the working tree);
  narrowed §5 to two per-leg fields because `authoring-frictions` ships `branchLengthTarget`;
  tabulated exactly which theory-family codes fire on the two D38 drafts; fixed criterion 1c
  (repro 3 is inert at the run root), criterion 11 (`OFFLINE=1` has no B+N fixtures; `retrievedAt`
  is not comparable), criterion 16 (three content files and their digests do move) and criterion 17
  (seven of eight `drill-pack` fixtures must keep failing).
