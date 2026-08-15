# RFC: Validator integrity — a pack that passes `pack-check` must run

- **Status:** draft
- **Author:** claude
- **Created:** 2026-08-15
- **Design refs:** `design/04-content-architecture.md` (the authoring loop `pack-check` guards);
  `design/BACKLOG.md` rows **D32**, **D33** and **Trajectory-format frictions** — *cited by title,
  not by line: the ledger's line numbers moved twice while this draft was written*
- **Exploration gate:** owner ruling 2026-08-12 opened the RFC tier (`rfc/README.md`
  §Exploration gate). This RFC is a defect RFC against shipped systems; it opens no new
  product surface.
- **Depends on:** `rfc/archive/trajectory-drill.md` (`legs`, `run_trajectory`, and the §10
  per-leg validation extraction this RFC finishes), `rfc/archive/outcome-drill-grading.md`
  (`objective.grading`, the `ledger_verified` chain), `rfc/archive/grounding-pair.md`
  (`verify-draft`, `assessmentGrounding`), `rfc/archive/structural-reading.md` and
  `rfc/archive/predicate-wave-2.md` (`structuralExpression`, `quantified`, `pieceOnSquare`)
- **Parent / amends:** amends `apps/server/src/pack-validation.ts` and
  `apps/server/src/pack-orchestrator.ts`; introduces no new subsystem
- **Supersedes / superseded by:** —
- **Planning:** `planning/validator-integrity/` (once implementing)

## Summary

`make pack-check` exists to make one promise: **a pack that passes it will run.** That promise
is false in three independent ways, all three found by the 2026-08-15 B+N authoring agent. A
structural success condition can pass validation and throw a bare `TypeError` when played (D32).
A tablebase-verified mate trajectory cannot be `ledger_verified` at all, so the best-grounded
pack the project can author must lie about its own grounding (D33). And a trajectory leg's
objective is validated by one twelfth of the rules a top-level objective is validated by — a gap
`rfc/archive/trajectory-drill.md` §10 specified the fix for and which never shipped.

This RFC states the law the validator was missing — **validation must exercise every code path
play will exercise before the first move** — and specifies the smallest change that makes it
true: total rule compilation for every objective in a document, every compilation failure
converted into a named refusal code, per-leg parity for the twelve `/objective`-rooted codes, and
one narrowly-scoped admission that lets a trajectory carry the root grounding it already has
evidence for.

**No version claim.** No pack-schema bump, no migration, no run-schema change. Every change is
validator behaviour plus one error type. The register lane's contingent 0.19 reservation for
per-leg fields is **not** taken, and §5 explains why taking it would have shipped a new instance
of the very defect this RFC exists to kill.

## Motivation

### The promise, and three ways it is false

`pack-check` is the only gate between an author and a broken drill.
`PackRegistry.fromDocuments` runs every pack through the same `validatePackDocument`
(`apps/server/src/pack-registry.ts:124-135`, `:224`) before it can be played, so the validator is
not advisory — it is the sole admission control for the whole content pipeline. Everything the
validator declines to check, nothing else checks either.

Three defects, all reproduced against the shipped tree on 2026-08-15:

1. **D32 — a green pack throws when played.** Reproduced below, three ways: a green pack that
   throws a bare `TypeError` at rule compilation; a pack that makes `make pack-check` *itself*
   crash with an uncaught stack trace; and a green pack that throws `ObjectiveTransitionError`
   mid-run.
2. **D33 — a trajectory can never be `ledger_verified`.** `make verify-draft
   FILE=content/drafts/trajectory-mate-bishop-knight.json OFFLINE=1` exits `1` with
   `ERROR [VERIFY_ASSESSMENT_NOT_SYZYGY]`, while the sibling `content/drafts/mate-bishop-knight.json`
   — **byte-identical `start`, `spine`, `deviations` and `opponentPolicy`** — verifies and ships 53
   evidence records. The trajectory must declare `assessedBy.kind: "authored"` and its own note
   says so: *"Declared authored because the format refuses the truth."*
3. **The per-leg authoring gap** (`design/BACKLOG.md`, **Trajectory-format frictions**, two
   attestations): `$defs/trajectoryLeg` is `{id, entryCheckpointId?, objective}` with
   `additionalProperties: false` (`schemas/drill_pack.schema.json:190-199`), so per-leg
   `opponentPolicy`, `shapes` and `branchLengthTarget` are inexpressible.

### Scope boundary

**In scope:** the validator's admission contract and the compiler it must exercise;
the `run_trajectory` grounding path; the per-leg gap's *decision*.

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
evaluateObjective THREW: ObjectiveTransitionError Objective transition is not allowed: degraded -> degraded
```

#### 2d. This was specified and did not ship

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
condition. The parameter is optional and defaulted, so `progress.ts:89` and
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

Three constraints on the extraction:

1. **Behaviour-preserving for leg-free packs.** For a document without `legs` the emitted issue
   list must be identical in content *and order* to today's.
2. **`theoryObjective` becomes `objective.type === "follow_theory"` of the objective under
   examination**, not of `pack.objective`. This is what makes `THEORY_ABSORBING_UNSUPPORTED` work
   on a theory leg.
3. **The syzygy pair stays inside the extracted function and stays dead on legs.**
   `SYZYGY_ASSESSMENT_OUT_OF_RANGE` and `SYZYGY_ASSESSMENT_MISMATCH` read `pack.start.fen` and
   `pack.start.side` — the pack's root, not the leg's entry — so on a leg they would check the
   wrong position. `TRAJECTORY_LEG_SYZYGY_UNSUPPORTED` (`pack-validation.ts:358`) already refuses a
   leg syzygy assessment before they can be reached, and this RFC **keeps that refusal**: the
   reasoning in `rfc/archive/trajectory-drill.md:929-937` is correct — a leg's entry position is
   not known until a run reaches it, so there is nothing static to bind a tablebase record to.

**Corpus impact: none.** All four leg-bearing documents in the tree
(`content/drafts/trajectory-mate-bishop-knight.json`, `trajectory-qgd-exchange-minority.json`,
`trajectory-caro-advance-chain-bishops.json`, `trajectory-legs.browser.json`) were checked leg by
leg against all twelve rules; every leg is clean.

#### 3d. The theory-family gate widens, and two committed drafts must be fixed

The seven theory-family codes — `THEORY_OBJECTIVE_NEEDS_LINE_MODE` (`:414-416`),
`THEORY_NEEDS_AUTHORED_BOUNDARY` (`:417-419`), `BOUNDARY_NEEDS_PLY_HORIZON` (`:420-422`),
`BOUNDARY_GRANTS_NOTHING` (`:423-425`), `THEORY_NEEDS_BOUNDARY_CHECKPOINT` (`:426-428`),
`THEORY_DEVIATION_NEEDS_SPINE_ANCHOR` (`:432-438`) and `BOUNDARY_HORIZON_EXCLUDES_EVERY_GRANT`
(`:550-567`) — name pack-level shape (`/mode`, `/authoredBoundary`, `/checkpoints`,
`/deviations`), so they run **once**, not once per leg, and stay outside `objectiveIssues`. Their
gate widens exactly as `rfc/archive/trajectory-drill.md` §10 row 2 specified:

> `theoryObjective` := `pack.objective.type === "follow_theory"` **or** some `leg.objective.type === "follow_theory"`

well-defined because `TRAJECTORY_MULTIPLE_THEORY_LEGS` (`:370`) admits at most one theory leg.
`THEORY_OBJECTIVE_NEEDS_LINE_MODE` keeps its own narrower gate — it must continue to fire on a
top-level `follow_theory` in a non-`line` pack and must **not** fire on a theory *leg* of a
`mode: "trajectory"` pack.

**This makes two committed drafts fail `pack-check`, and it should.**
`content/drafts/trajectory-qgd-exchange-minority.json` and
`content/drafts/trajectory-caro-advance-chain-bishops.json` declare a `follow_theory` leg with no
`authoredBoundary`. Per §2e, `insideAuthoredBoundary` returns `false` for every non-root node when
the boundary is absent (`line.ts:105-107`), so `lineMembership` classifies every in-book move as
`unknown` or `classified_deviation` and never as `on_line` (`:138-144`). Their theory legs deliver
nothing. The refusal is correct and the content is what must change: each needs an
`authoredBoundary` with a `plyHorizon` and a grant, plus one `atAuthoredBoundary` checkpoint.
This RFC does not edit `content/`; the implementing agent lands the two content fixes in the same
commit as the widening, and acceptance criterion 7 asserts it.

#### 3e. What the fix deliberately does not do

- **It does not evaluate rules.** Compilation is position-independent and total; evaluation is
  not, and pre-running a rule at the root would refuse packs that are correct. The root probe
  already covers the one position that *is* static, for checkpoints (`:603-651`).
- **It does not touch `orchestratePackMove:300`** (`"Committed trajectory node has no parent"`) —
  a genuine internal invariant on a committed node, unreachable from any document.
- **It does not guard `progress.ts:89`.** With registry validation total, `objectiveRules` cannot
  throw there for a registered pack; adding a swallow-and-degrade would convert a crash into a
  wrong progress row, which is worse.

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

**What this buys, concretely.** `content/drafts/trajectory-mate-bishop-knight.json` declares

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
change to `verify-draft`. The root is `8/8/4k3/8/4K3/2BN4/8/8 w - - 0 1` (four pieces, `win`),
the final leg is `win`, and the pack's `spine` and `deviations` are byte-identical to the sibling
`content/drafts/mate-bishop-knight.json`, which already verifies and ships 53 records — so the
enumeration at `verify-draft.ts:60-80` and the regression sweep at `:139-149` traverse identical
positions. The sibling pack no longer has to exist to carry the trajectory's evidence.

#### 4c. Why no pack-schema version is claimed

`$defs/objective` (`schemas/drill_pack.schema.json:176-188`) already permits `grading` on any
objective type — there is no `if`/`then` gating it — and `$defs/trajectoryLeg` (`:190-199`)
references the same `$defs/objective`. The refusal is **entirely** in `runtimeIssues`. Relaxing it
changes no schema document, no `$id`, and no pack digest. The register's 0.19 slot stays free.

### 5. The per-leg authoring gap — scoped out, and why

The gap is real and twice-attested. Per-leg `opponentPolicy` is the item with teeth: phase 1 of a
mate trajectory could be drilled against a weaker defender while phase 3 must be perfect, and
resistance-varied replay is inherently per-phase.

**This RFC ships none of the three fields and claims no pack-schema version.** Adding
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

Per-leg `shapes` and per-leg `difficulty.branchLengthTarget` (`schemas/drill_pack.schema.json:139`)
are cheaper but not free, and shipping them alone would not answer the attestation, which is about
resistance.

**Recommendation for the ledger:** a follow-up RFC, `trajectory-per-leg-resistance`, owning the
six sites above plus the run-schema decision, and claiming pack schema 0.19 at that point. This
RFC does not claim it.

### 6. New refusal codes, and the collision sweep

Six new codes. All are `severity: "error"`, `source: "runtime"`, and live in `runtimeIssues`,
per the file's shipped convention (`pack-validation.ts:85-91`).

| Code | Fires when | Pointer |
|---|---|---|
| `STRUCTURAL_CONDITION_HAS_NO_FEATURE` | a `structural_feature` success condition whose expression yields no feature leaf | `…/successConditions/{i}/feature` |
| `SUCCESS_CONDITION_KIND_UNRECOGNISED` | the compiler meets a `successCondition` kind it has no predicate for | `…/successConditions/{i}/kind` |
| `EVIDENCE_FACT_UNSUPPORTED` | a condition names a rules fact outside `RULES_EVIDENCE_FACTS` | `…/successConditions/{i}/fact` |
| `OBJECTIVE_RULES_UNCOMPILABLE` | rule compilation throws anything else (backstop) | `/objective` or `/legs/{i}/objective` |
| `TRAJECTORY_GRADING_RESOLUTION_UNSUPPORTED` | `run_trajectory` top-level grading with `resolveAt.kind: "checkpoint"` | `/objective/grading/resolveAt` |
| `TRAJECTORY_ASSESSMENT_NEEDS_OUTCOME_LEG` | `run_trajectory` top-level syzygy assessment whose final leg is not an outcome objective | `/objective/grading/assessedBy/category` |

**Collision sweep.** `grep -rhoE '[A-Z_]{5,}' apps/server/src packages/schema/src
packages/runtime/src --include="*.ts" | sort -u` yields **444** distinct literals; none of the six
appears. A second sweep across `rfc/`, `docs/`, `design/` and `planning/` — which catches codes
claimed by the parallel drafts, `rfc/authoring-frictions.md` included — also yields no match for
any of the six.

No existing code is renamed, retired, or given a different meaning. Twelve existing codes gain a
second pointer shape (`/legs/{i}/objective/…`), which `rfc/archive/trajectory-drill.md` §10 already
specified as their intended surface.

### 7. Cross-draft interactions

**`rfc/authoring-frictions.md` (pack schema 0.16, wave position 1) — one live conflict and one
composition.**

*Conflict.* Its §8 widens the `rules_fact` enum with `"draw"` and states: *"Zero runtime code
changes; `conditionEvidenceRefs` already emits `rulesEvidenceRef(condition.fact)`."* It does not.
`RULES_EVIDENCE_FACTS` (`packages/runtime/src/evidence-ref.ts:1-26`) contains
`draw-threefold`, `draw-50move` and `draw-insufficient` but **not** `draw`, and `rulesEvidenceRef`
throws `TypeError: Unsupported rules evidence fact: draw` for anything not in that list (`:50-55`).
A `{"kind":"rules_fact","fact":"draw"}` condition on an outcome objective would therefore pass
`pack-check` — because §2b's five-of-twelve gate never compiles outcome objectives — and throw when
played. **This is a new instance of D32 about to ship**, and the reason it would clear review is
the defect this RFC fixes. Two independent remedies, both wanted: `authoring-frictions` adds
`"draw"` to `RULES_EVIDENCE_FACTS`; this RFC's total compilation makes the omission a
`EVIDENCE_FACT_UNSUPPORTED` refusal at `pack-check` time rather than a crash mid-run. Neither
substitutes for the other, and this RFC does not edit that draft.

*Composition.* Its §8c rewrites the objective-type → expected-category map at
`pack-validation.ts:569-601` into a type → category-**set** map, and states *"no fifth objective
type can reach this table"* on the basis of `:448`. §4b of this RFC admits `run_trajectory` to that
table. The two compose cleanly in either landing order provided the implementer keys the map on
§4b's **effective outcome type** — the final leg's type for a trajectory, `pack.objective.type`
otherwise — so `run_trajectory` never appears as a key. Whichever lands second carries the
one-line reconciliation. `authoring-frictions` holds wave position 1; this RFC lands behind it and
should therefore be the one to carry it.

**`rfc/tempo-vocabulary.md` and `rfc/predicate-wave-3.md` (pack schema 0.17, 0.18):** no
interaction found. Note for their reviewers: any draft that widens `$defs/successCondition` or
`$defs/structuralExpression` inherits `SUCCESS_CONDITION_KIND_UNRECOGNISED` and
`STRUCTURAL_CONDITION_HAS_NO_FEATURE` as its safety net once this RFC lands, and any new
expression node that carries no feature leaf must be considered against
`structuralFeatureKinds` (`packages/runtime/src/structure.ts:449-465`).

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
     not merely described.
2. **`rfc/archive/trajectory-drill.md` criterion 9 holds.** Its two named cases, verbatim: a
   trajectory whose *second* leg is `type: "hold"` with no `grading` fails
   `OBJECTIVE_GRADING_REQUIRED` at `/legs/1/objective/grading`; one whose *third* leg is
   `type: "resist"` with `resolveAt.kind: "terminal"` fails `OBJECTIVE_RESIST_NEEDS_CHECKPOINT` at
   `/legs/2/objective/grading/resolveAt`. Both pass `pack-check` clean on the current tree; the
   test records that fact in a comment.
3. **All twelve codes have a leg fixture.** One fixture per row of §2c's `no` list except the two
   syzygy codes, each asserting the code at a `/legs/{i}/objective/…` pointer. The syzygy pair is
   asserted **negatively**: a leg with a syzygy assessment fails with
   `TRAJECTORY_LEG_SYZYGY_UNSUPPORTED` and **not** with `SYZYGY_ASSESSMENT_MISMATCH` or
   `SYZYGY_ASSESSMENT_OUT_OF_RANGE` — the wrong-position check must never be the one that fires on
   a leg.
4. **Extraction is byte-identical for leg-free packs.** For every pack document in the tree —
   `schemas/drill_pack.example.json`, every file in `content/drafts/`, every
   `content/candidates/*/pack.json`, and every fixture in `schemas/fixtures/drill-pack/` — the
   issue list from `validatePackDocument` is compared before and after the extraction and asserted
   equal in content **and order**.
5. **The backstop is reachable.** A unit test injects a compiler that throws a plain `Error` and
   asserts `OBJECTIVE_RULES_UNCOMPILABLE` is emitted at the right pointer rather than the exception
   escaping `validatePackDocument`.
6. **Total compilation is asserted structurally, not by enumeration.** A test iterates
   `OBJECTIVE_TYPES` (`packages/schema/src/drill-pack/types.ts:1-14`) and asserts that for every
   type, a minimal valid document of that type has its rules compiled during
   `validatePackDocument` — instrumented by spying on `objectiveRules`. A new objective type added
   later without a compilation path fails this test.
7. **The theory-family widening lands with its content fix.** In the same commit:
   `content/drafts/trajectory-qgd-exchange-minority.json` and
   `content/drafts/trajectory-caro-advance-chain-bishops.json` each gain an `authoredBoundary`
   (with `plyHorizon` and at least one grant) and one `atAuthoredBoundary` checkpoint; both pass
   `pack-check`; and a test asserts that with the boundary removed each fails with
   `THEORY_NEEDS_AUTHORED_BOUNDARY` **exactly once**, not once per leg. A second test asserts
   `THEORY_OBJECTIVE_NEEDS_LINE_MODE` still fires for a top-level `follow_theory` on a
   `mode: "trajectory"` pack and does **not** fire for a `follow_theory` leg.
8. **A theory leg reports on-line moves.** On a run through the fixed
   `trajectory-qgd-exchange-minority` pack, `lineMembership` returns at least one entry with
   `verdict: "on_line"` inside the theory leg's span — the observable that
   `line.ts:105-107` made impossible before the boundary existed.
9. **D33: the B+N trajectory earns `ledger_verified` without a sibling.** With top-level
   `grading` per §4b, `make verify-draft FILE=content/drafts/trajectory-mate-bishop-knight.json
   OFFLINE=1` exits `0`, prints `ledger_verified`, and emits `.evidence.json` / `.sources.json` /
   `.job.json`. The emitted ledger's root `tablebase_result` record is asserted equal — on `values`,
   `sourceId`, `retrievedAt` and `supports` — to the corresponding record in
   `content/drafts/mate-bishop-knight.evidence.json`, since the two packs share a root, a spine and
   a deviation set. `PackRegistry` is asserted to report `assessmentGrounding: "ledger_verified"`
   for the trajectory. Asserted to fail on the current tree with
   `ERROR [VERIFY_ASSESSMENT_NOT_SYZYGY]`.
10. **D33 refusals.** A trajectory with top-level grading and `resolveAt.kind: "checkpoint"` fails
    `TRAJECTORY_GRADING_RESOLUTION_UNSUPPORTED`; one whose final leg is `execute_break` with a
    top-level syzygy assessment fails `TRAJECTORY_ASSESSMENT_NEEDS_OUTCOME_LEG` and **not**
    `SYZYGY_ASSESSMENT_MISMATCH`; one whose final leg is `hold` with `category: "win"` fails
    `SYZYGY_ASSESSMENT_MISMATCH`; and top-level `successConditions` on a trajectory still fails
    `TRAJECTORY_TOP_LEVEL_CONDITIONS_UNSUPPORTED`.
11. **Every other objective type still refuses grading.** `OBJECTIVE_GRADING_UNSUPPORTED` is
    asserted to still fire for `play_until_checkpoint`, `follow_theory` and each of the five plan
    types carrying `grading`. Only `run_trajectory` moves.
12. **Nothing persisted moves.** `DRILL_PACK_SCHEMA_VERSION`, `schemas/drill_pack.schema.json`,
    `DRILL_RUN_SCHEMA_VERSION` and `STORAGE_VERSION` are unchanged, and every committed pack digest
    is asserted identical before and after.
13. **`make verify` is green**, and `make pack-check` passes on every document in
    `content/drafts/`, `content/candidates/*/pack.json` and `schemas/fixtures/drill-pack/` after
    criterion 7's content fixes.

## Open questions

None.

## Changelog

- 2026-08-15: created.
