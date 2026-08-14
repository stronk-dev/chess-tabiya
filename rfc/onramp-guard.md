# RFC: On-ramp guard — `immediate_guard` as a real feedback policy, and honest outcome-leg grading (D28)

- **Status:** implementing
- **Author:** claude, on the owner's 2026-08-14 schedule (`design/BACKLOG.md:154`)
- **Created:** 2026-08-14
- **Design refs:** `design/00-thesis.md:148-156` (§Target player, the three on-ramp knobs);
  `design/05-in-run-experience.md:69-77` (assistance ladder), §3a (silence default, recovery is
  the skill); `design/research/teardown-drwolf-desk.md:61-66,103-111,169-178` (the pre-commit
  retract inversion this policy must not reproduce)
- **Exploration gate:** owner ruling 2026-08-12 (gate opened, logged in
  `planning/exploration/log.md`); owner scheduling ruling 2026-08-14: "v1 form is the
  post-commit guard — the move commits, the guard offers play-on-or-rewind"
  (`design/BACKLOG.md:154`)
- **Depends on:** `repertoire-gap-finding.md` for landing order only (its migration 15
  precedes this draft's migration 16; 2026-08-14 three-draft register order:
  `repertoire-gap-finding`, then this draft, then `open-answer-grading`); no behavioral
  dependency
- **Parent / amends:** `rfc/archive/defect-sweep.md` §2a (re-adds the value it removed, under
  the rule it wrote); `rfc/archive/trajectory-drill.md` and `rfc/archive/outcome-drill-grading.md`
  (D28 sits on their seam)
- **Supersedes / superseded by:** —
- **Planning:** `planning/onramp-guard/` (once implementing)

## Summary

This RFC restores the on-ramp band's missing feedback knob as a policy the runtime actually
executes, and closes defect D28 so outcome legs grade what they declare. (1) `immediate_guard`
becomes the third pack-selectable `feedbackPolicy` (fourth `RunFeedbackPolicy` member): the
move commits and its consequence-start plays; when rules-arithmetic or recorded engine evidence
crosses the pinned thresholds, the run records a durable guard offer and the client presents a
passive but prominent play-on-or-rewind prompt. The attempt is preserved either way. The policy
carries the three properties whose absence justified its removal (`rfc/archive/defect-sweep.md:313-320`):
capability publication, a `policyModeApplied`-style applied record, and honest degradation to a
rung-0-only guard when no judge engine is present. (2) `objectiveRules` attaches the automatic
win/draw/loss rules to outcome objectives even when `successConditions` is absent, closing the
silent zero-grading path (`design/BACKLOG.md:196`), and the two trajectory drafts drop the
`material_balance` conditions they carry purely to dodge it.

## Motivation

**The on-ramp knob has no encoding.** `design/00-thesis.md:148-156` defines the 1000–1400 lane
on exactly three knobs; one is "pack-declared immediate blunder-guard feedback (show the
consequence within a couple of plies, then rewind — a per-pack override of the delayed-feedback
default, ADR-0006)". `defect-sweep` §2a removed `immediate_blunder_guard` from the schema
because it was a claim with no capability behind it — correctly, under its own rule
(`rfc/archive/defect-sweep.md:296-299`): *an executable vocabulary may contain only values the
shipped runtime executes.* The consequence is that the lane is unencodable: `FEEDBACK_POLICIES`
is two members (`packages/schema/src/drill-pack/types.ts:21`), the schema enum matches
(`schemas/drill_pack.schema.json:56-58`), and the sourced on-ramp candidates ship with the
blocker "immediate_blunder_guard is not selectable (defect D8); delayed_checkpoint is a
temporary substitution" (`content/candidates/onramp-00008/pack.json`,
`content/candidates/onramp-0000d/pack.json`). The emitter has since reworded that line:
today it writes "Immediate blunder feedback has no pack-format encoding;
delayed_checkpoint is the authored policy for this candidate"
(`apps/server/src/sourcing/position-seeds.ts:225`) and pins the substitute policy at
`:237` — the committed candidates carry the older text, which is why §1i speaks of
re-emission, not rewriting. The fix is the one the BACKLOG row
demands: re-add it *as a real policy*, not as an enum value.

**The form is ruled, and the teardown says why it matters.** Dr. Wolf's blunder dialog fires
*before* the move stands — "asks if you want to give it another shot … before allowing players
to either continue or retract their move" (`design/research/teardown-drwolf-desk.md:61-66`) —
which inverts commit-before-learning: the learner is coached past the mistake that would have
taught them (`:103-111`). It is simultaneously the single most-loved feature in its band
(`:138-141`). The owner's ruling takes the demand and keeps the invariant: post-commit, the
consequence begins, then the offer. Pre-commit form is invariant-review material and is not in
this RFC.

**D28 is the same defect class at the leg level.** An outcome leg (`win`/`hold`/`save`/`resist`)
with no `successConditions` compiles to zero grading rules: `objectiveRules` returns `[]` at
`apps/server/src/pack-orchestrator.ts:213` before the automatic outcome rules are built at
`:223-255`. `OBJECTIVE_GRADES_NOTHING` never fires because it checks `PLAN_OBJECTIVES` only
(`apps/server/src/pack-validation.ts:90-93,393-398`). `docs/structural-reading.md:70-72` already
promises "outcome objectives retain their automatic grading" — the code breaks that promise
exactly when a leg authors no conditions. Both real trajectory drafts carry a
`material_balance` condition purely to unlock the automatic rules
(`content/drafts/trajectory-qgd-exchange-minority.json:637-645`,
`content/drafts/trajectory-caro-advance-chain-bishops.json:610-618`; `design/BACKLOG.md:196`).
A guard whose material tier rides on outcome arithmetic should not land beside a grading path
that silently grades nothing; the two fixes are one enablement pair.

**Out of scope:** pre-commit guard form; opponent-intent checkpoint content
(`design/BACKLOG.md:240`); any authored on-ramp pack; position-session (`attempt_end`) and
match sessions, which keep their existing policies; the leg-level `resist` resolveAt gap
(top-level-only check at `pack-validation.ts:384-392`), which gets a BACKLOG row, not a rider.

## Specification

### 1. `immediate_guard` — the policy

#### 1a. Name and vocabulary position

The pack value is **`immediate_guard`** — not the removed `immediate_blunder_guard`. "Blunder"
is a judgment word; the policy's firing facts are arithmetic and recorded evaluations, and its
prompt never says "blunder". The rename also keeps the removed, never-executable value dead:
a v0.5–0.13 document naming `immediate_blunder_guard` still fails exactly as `defect-sweep`
§2a pinned (Ajv enum + `UNSUPPORTED_FEEDBACK_POLICY`,
`apps/server/src/pack-validation.ts:213-222`).

- `FEEDBACK_POLICIES` becomes `["delayed_checkpoint", "segment_end", "immediate_guard"]`
  (`packages/schema/src/drill-pack/types.ts:21`).
- `RunFeedbackPolicy` becomes
  `"delayed_checkpoint" | "segment_end" | "attempt_end" | "immediate_guard"`
  (`packages/runtime/src/types.ts:37`). Pack sessions already type their policy as
  `Exclude<RunFeedbackPolicy, "attempt_end">` (`packages/runtime/src/session.ts:34`) and the
  server copies `pack.feedbackPolicy` into the run at creation
  (`apps/server/src/service.ts:363`). The explicit `PackRun.feedbackPolicy` union in
  `packages/runtime/src/session.ts` widens in the same change; position and imported
  sessions remain pinned to `attempt_end`.
- The schema/validator/capability binding test extends its assertion
  (`apps/server/src/pack-authoring.test.ts:42-63`): schema enum === `FEEDBACK_POLICIES`.

#### 1b. Pack schema 0.14

`schemas/drill_pack.schema.json` `$id` moves to `urn:chess-tabiya:schema:drill-pack:0.14`;
`DRILL_PACK_SCHEMA_VERSION` to `"0.14"` (`packages/schema/src/index.ts:2`). Two changes, both
additive:

1. `properties.feedbackPolicy.enum` gains `"immediate_guard"` (`schemas/drill_pack.schema.json:56-58`).
2. A new optional top-level property:

```json
"guard": {
  "type": "object",
  "properties": {
    "evalSwingCp": {
      "oneOf": [
        { "type": "integer", "minimum": 50, "maximum": 1000 },
        { "type": "null" }
      ]
    }
  },
  "additionalProperties": false
}
```

Semantics: `evalSwingCp` absent → engine tier active with the default threshold 200; an integer
→ that threshold; `null` → engine tier off for this pack (rung-0 tiers only). Runtime
validation adds one refusal: **`GUARD_WITHOUT_IMMEDIATE_GUARD`** when `guard` is present and
`feedbackPolicy !== "immediate_guard"` (same `runtimeIssue` shape as
`pack-validation.ts:214-221`). No migration: pack digests are content digests, unaffected by
the `$id` (`packages/schema/src/drill-pack/digest.ts:58-66`); all committed packs and fixtures
validate unchanged.

#### 1c. Run schema 0.11 and migration 16

Widening `RunFeedbackPolicy` widens the `run.started` vocabulary
(`packages/runtime/src/types.ts:132`), the same class as migration 11's `policyModeApplied`
widening (`rfc/README.md:98`). Therefore: `DRILL_RUN_SCHEMA_VERSION` `"0.10"` → `"0.11"`
(`packages/schema/src/index.ts:1`) and **migration 16** (`STORAGE_VERSION` 15→16), stamp-only —
frozen literals `"0.10"` → `"0.11"`, no data rewrite exists to do; mandatory because reads
filter on the current run-schema version (the migration-11 precedent). Migration 15 is
`repertoire-gap-finding`'s wave claim #1; this draft lands behind it. No new tables, no new
event type (§1f). Register rows per §5.

#### 1d. Disclosure semantics

`immediate_guard` is the authored per-pack override of the delayed-feedback default that the
thesis names (ADR-0006 override, `design/00-thesis.md:150-152`). Its disclosure contract is
uniform and total:

- `feedbackDisclosed` (`packages/runtime/src/feedback.ts:3-18`) adds
  `case "immediate_guard": return true;`. `feedbackDeliveryOpen` (`:20-28`) follows unchanged
  (non-`attempt_end` path).
- Consequences, all intended: `publicNodes`/`publicEvents` never withhold
  (`apps/server/src/feedback-policy.ts:10-52`); `applyEvidence` never throws
  `FEEDBACK_WITHHELD` (`apps/server/src/service.ts:1176-1181`), so eval evidence lands as jobs
  finish — which is what the engine tier consumes; compare, human-split, and corpus surfaces
  see an always-open delivery window. There is no partial-disclosure state to reason about:
  the pack has declared immediate feedback as its pedagogy, and the barrier machinery reports
  exactly that.

No substitution, ever: a deployment either runs the declared policy or refuses the pack by
name. Substituting a delayed policy "changes what the learner is shown and when"
(`rfc/archive/defect-sweep.md:318-320`) — the sourcing emitter's current substitution is
removed in §1i.

#### 1e. Firing contract — what fires, at which rung

Let **P** be the position node where the learner was to move, **L** the node created by the
committed move, **C** the consequence-start node (the opponent reply appended after L). The
guard evaluates the decision P→L only once its consequence has begun — everything is
post-commit; nothing blocks the move.

Three signals, each honest at its own rung (`design/05-in-run-experience.md:69-77`: the facts
are rung 0, the judgment is rung 2 — each tier is presented at its rung, never dressed as the
other):

1. **Material tier (rung 0, always on).** `MATERIAL_VALUES` arithmetic — the shipped
   table, pawn 1 / knight 3 / bishop 3 / rook 5 / queen 9 / king 0
   (`packages/runtime/src/objective.ts:17-24`) — where "material" is the learner-perspective
   **balance**: own minus opponent, `materialScore`/`materialBalance`
   (`objective.ts:122-137`), so exchanges net correctly. Fires when
   balance(C) − balance(P) ≤ **−3** pawn units. The floor is 3 because below it lives
   exchange and gambit noise (a clean capture-recapture nets 0 and never fires); at 3 a piece
   is actually gone. This is the "hanging piece is rules-arithmetic" case: the consequence
   already took it.
2. **En-prise tier (rung 0, always on).** In C's position (learner to move), a learner piece
   of value ≥ 3 (N/B/R/Q, never the king) is directly attacked at least once and defended zero
   times, by the shipped geometric count: `directAttackCount`
   (`packages/runtime/src/structure.ts:169-176`) with the opponent's colour for attacks and
   the learner's colour on the same square for defence — chessops `attacks()` over the
   occupied board, nothing else. Rendered under the no-valence scope contract
   (`docs/explanation-grounds.md:15-20`): counts only, pins and legal recaptures not
   evaluated, a current fact about the displayed position. It fires whether or not the
   learner's move caused the hang — the guard names current facts, it does not attribute
   cause.

   **False-positive analysis (required, because a guard that misfires at 1000 Elo teaches
   distrust).** The geometric count has exactly the misfire classes the rung-0 scope
   correction names (`design/05-in-run-experience.md:71`: "attacker/defender *counts* are
   exact but 'pressure balance' as a conclusion depends on pins and legal recaptures"):
   it **fires** on a piece whose only attacker is absolutely pinned (the capture is
   illegal, the piece may be safe) and on a piece whose real defence is an x-ray battery
   (a defender behind a defender is not a direct count); it **does not fire** on a piece
   whose sole counted defender is itself pinned or overloaded (the piece is actually
   lost); and it cannot distinguish a sacrifice from a hang (it does not attribute
   intent). These are acceptable at v1 for three reasons, all load-bearing: the prompt is
   non-blocking and verdict-free, so a misfire costs one glance, not a retraction; the
   rendered sentence is the count fact carrying its own scope, so a fire on a
   pinned-attacker position is a *true sentence with visible limits*, never a wrong
   verdict; and the misfire classes are pinned by fixture in the acceptance tests rather
   than hidden. Tightening the tier with pin or recapture logic is a future rung-0
   widening, not a silent change to this contract.
3. **Engine tier (rung 2, when a judge engine is present and `guard.evalSwingCp` is not
   null).** Both P and C already receive eval jobs on every ply
   (`apps/server/src/service.ts:1556-1578`, enqueued at `:575,:601`). When *recorded*
   `evidence.attached` evals exist for both (White-perspective convention,
   `docs/explanation-grounds.md:62-66`), the tier fires when the swing across the decision is
   ≥ `evalSwingCp` (default **200**) centipawns against the learner, or when C records mate
   against the learner and P did not. Recorded evidence only — the guard never triggers its
   own out-of-band evaluation, so its record is grounded in evidence the run already holds.

**Where evaluated:** tiers 1–2 run synchronously inside `opponentPly` after
`orchestratePackMove` (`apps/server/src/service.ts:579-603`) — pure arithmetic, well inside
the measured rung-0 envelope (`docs/adaptive-guidance.md:130-134`). Opponent nodes created
outside `opponentPly` — the branch-group comparison path (`service.ts:820`) — never
evaluate the guard: a group is a comparison instrument, not the committed decision loop.
Tier 3 runs inside `applyEvidence` (`service.ts:1164-1217`) after `attachEvidence`, when
the newly applied eval completes a (P, C) pair on a guard run.

An opponent move from a pack root is not a consequence-start node: there is no learner
decision P→L before it. Guard evaluation therefore abstains unless the node active before
`opponentPly` is itself a learner-committed move with a parent P.

**Tier-3 timing, pinned honestly.** Eval jobs are enqueued per committed node
(`service.ts:575,601` via `#enqueueMoveEvidence`, `:1556-1578`); results are staged
asynchronously and land only when the client applies them. So the engine tier fires
**late by construction** — typically seconds after the move, possibly after further plies
— and never blocks anything: play continues, rung-0 tiers have already had their chance,
and a late engine fire only adds a record where no tier fired yet (dedupe below). Three
consequences are contract, not accident: (a) the **run root receives no eval job at
creation** — `:575`/`:601` are per-move — so at the first decision of a run (P = root)
the engine tier abstains unless a root eval was recovered through the analysis surface;
(b) if the learner **rewinds off the consequence before the eval lands**, the pending job
is cancelled (`apps/server/src/evidence-queue.ts:162` `onRewound`) and the tier abstains
for that C permanently — correct here, the learner has left the line, and noted as the
third consumer of the BACKLOG "rewind cancels pending evidence" pattern row, resolved by
abstention rather than a batch-class exemption; (c) an eval that never arrives (engine
down, job lost) is the same silent abstention. The guard never waits, never polls, and
never triggers an out-of-band evaluation to close the gap.

**Dedupe:** at most one guard record per consequence-start node C. First tier to cross fires;
later evaluations (including a later-arriving engine pair) abstain if a record for C exists.
Re-entering C by navigation never re-fires. A missing engine pair is silent abstention, not an
error.

**Threshold honesty, argued:** the numeric knobs are authoring conventions of the same class
as the emitter's targetElo clamp — the 3-unit floor is fixed in code (changing it is a future
RFC), the 200cp default is pack-overridable via `guard.evalSwingCp`. A rung-0-only guard was
considered and rejected as the *only* v1 form: hanging material is the on-ramp band's dominant
blunder class and rung 0 catches it, but allowed tactics (a fork, a mate-in-two) are invisible
to arithmetic, and an on-ramp guard that stays silent through a mate-in-two teaches that
silence means safety — a false signal the band cannot detect. The engine tier fires on a
recorded evaluation presented as engine evidence with a rewind offer attached to the loop — an
offer to replay the consequence, not a dashboard verdict (law 8's named anti-pattern is an
eval label with no drill consequence; this is the opposite).

#### 1f. Applied record — reusing `feedback.generated`

The guard's durable record is the **`feedback.generated`** event
(`packages/runtime/src/types.ts:190-193`) — in the run vocabulary since branch-runtime
(`docs/branch-runtime.md:163-170`), shaped `{nodeId, evidenceRefs}`, and emitted by nothing
today (repo-wide, its only uses are test spacers; replay validation is a no-op case at
`packages/runtime/src/events.ts:307-309`). Giving it its first emitter completes the shipped
vocabulary rather than widening it — no new event type, and §1c's version bump stays
stamp-only.

- `nodeId` = C. `evidenceRefs` = the grounds that fired, from the existing closed vocabulary
  (`packages/runtime/src/evidence-ref.ts:1-38`): `rules:material` (tier 1),
  `rules:structure-direct-attack-count` (tier 2), `engine:<jobId>` of the applied eval
  (tier 3). No new ref vocabulary.
- This is the `policyModeApplied`-style record D8 demanded: `run.started` records the declared
  policy (`types.ts:132`), and each firing records what *actually* fired and on what basis —
  a deployment without engines produces only `rules:` grounds, so the degradation is visible
  in the record itself, not inferred.
- Replay validation tightens minimally: `feedback.generated` requires an existing `nodeId` and
  a non-empty `evidenceRefs` (existing test spacers already satisfy this,
  `packages/runtime/src/runtime.test.ts:343`). No persisted production run contains the event,
  so the tightening invalidates nothing.

Play-on and rewind need no new events: playing on is the next `move.committed`; rewind is the
existing `run.rewound` + fork machinery, which preserves the attempt by construction ("an
attempt is never destroyed", `design/05-in-run-experience.md` §1).

#### 1g. Capability publication

`Capabilities` (`apps/server/src/capabilities.ts:58-67`, assembled at `:165-185`) gains:

- `feedbackPolicies: readonly FeedbackPolicy[]` — the pack-selectable set, i.e.
  `FEEDBACK_POLICIES` (mirroring `policyModes` at `:177`);
- `guardBasis: readonly ("rules" | "engine")[]` — `["rules"]` when `providers.judge` is
  `"none"`, `["rules", "engine"]` when it is `"stockfish"` **or** `"mock"`
  (`capabilities.ts:106,115-117`): mock deployments run the `MockEvidenceExecutor`,
  which produces real recorded evals, so their engine tier is genuinely live, not
  theatre.

The client builds its episode expectations against this payload exactly as the session
controller does for policy modes. The named-refusal leg stays satisfied by the general branch:
any value outside `FEEDBACK_POLICIES` is refused as `UNSUPPORTED_FEEDBACK_POLICY` with the
value named (`pack-validation.ts:213-222`), and `GUARD_WITHOUT_IMMEDIATE_GUARD` (§1b) names
the misuse of the tuning block.

#### 1h. Client surface

In the drill episode (server-authoritative client, `docs/drill-client.md:3-6`), a
`feedback.generated` event on a guard run renders a **passive, prominent, non-blocking**
prompt anchored to the assistance rail: the rendered ground sentences (existing
`renderEvidenceRef` vocabulary — no new prose generation), plus two actions:

- **Play on** — dismisses locally; no event; the board never stopped being live. Committing
  any move dismisses the prompt implicitly.
- **Rewind this decision** — existing rewind targeting P (parent of L); the next different
  move forks a branch under existing semantics. The prompt names what is preserved: "your
  played line stays on the board's branch rail."

The prompt never blocks input, never asks "are you certain?" before a move, and never appears
pre-commit — the Dr. Wolf inversion (`teardown-drwolf-desk.md:103-111`) is the contract, not a
styling choice. A **late tier-3 fire** (§1e timing) renders the prompt only while C is still
on the active path; if the learner has already advanced past C, the record stands in the log
and the rail shows it anchored at the node without stealing focus — a late fact arrives as a
fact, not as an interruption. On a `guardBasis: ["rules"]` deployment the episode shows the
guard as active with its engine tier honestly absent (no pretend evaluations).

#### 1i. Honest degradation and the sourcing emitter

- **Engines absent:** the pack loads, runs, and guards on tiers 1–2. No refusal, no
  substitution, no theatre: the rung-0 tiers are local arithmetic every deployment executes.
  Published via `guardBasis`; visible per-firing via `rules:`-only grounds (§1f).
- **Emitter:** `position-seeds.ts:237` emits `feedbackPolicy: "immediate_guard"` and drops the
  blocker line "Immediate blunder feedback has no pack-format encoding; delayed_checkpoint is
  the authored policy for this candidate" (`:221-229`). Existing candidate directories are not
  rewritten; re-running the pipeline reproduces them with the restored knob, and their
  standing `immediate_blunder_guard` blocker lines become dischargeable on re-emission. The
  thesis knob (`design/BACKLOG.md:243`) is thereby restored end to end: schema, validator,
  runtime, capabilities, client, sourcing.

### 2. D28 — outcome legs grade automatically

#### 2a. Decision: attach the automatic rules; do not add a load refusal

`objectiveRules` (`apps/server/src/pack-orchestrator.ts:166-277`) is restructured so the
outcome branch no longer sits behind the array check at `:213`:

```ts
const outcomeObjective = ["win", "hold", "save", "resist"].includes(objective.type);
if (!outcomeObjective) {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((condition, index) => conditionRules(condition, index, false));
}
const conditions = Array.isArray(raw) ? raw : [];
// automatic win/draw/loss rules (:223-255) attach unconditionally,
// degraded/resolution/remaining (:256-276) map over `conditions`.
```

The automatic rules and the `grading.resolveAt` resolution rule attach for every outcome
objective, top-level or leg; authored conditions remain additive. Argument for this arm over a
load refusal: the automatic win/draw/loss rules exist precisely because outcome objectives
carry rules-derived grading with no authored input
(`rfc/archive/outcome-drill-grading.md`; `docs/structural-reading.md:70-72` documents exactly
this contract) — a `win` leg with no conditions is a complete, meaningful declaration, not an
authoring error. A refusal (`OBJECTIVE_GRADES_NOTHING` for outcome legs) would force every
such leg to author a token condition — which is precisely the dodge the first two real packs
already committed, i.e. the refusal design's failure mode is already observed in the field.
D12a's refusal was right because a root-true trigger is *always* an error; a condition-less
outcome leg is *never* one. Non-outcome behavior is byte-identical; `play_until_checkpoint`,
`follow_theory`, and `run_trajectory` paths are untouched.

#### 2b. The two trajectory drafts drop their dodge conditions

`trajectory-qgd-exchange-minority.json:637-645` and
`trajectory-caro-advance-chain-bishops.json:610-618` delete the `material_balance`
`successConditions` entries (BACKLOG's authorial record: carried "purely to dodge it"). The
legs keep their authored `grading` blocks; grading falls to the automatic rules plus the
resolveAt resolution rule. An author who wants a material-degraded transition re-adds it as a
deliberate authored claim, not an unlock token. Both files are drafts
(`reviewStatus: draft`); their digests may move freely.

#### 2c. Regression, per the D12a precedent

D12a's precedent is two-part: the check runs the orchestrator's own code, and `pack-check`
proves it end to end (`rfc/archive/outcome-drill-grading.md:789,1226`). Correspondingly:

1. A runtime-validation invariant test asserts, via `objectiveRules` itself, that every
   outcome objective — top-level and per-leg, with and without `successConditions` — compiles
   to a non-empty rule set (the automatic rules are ≥ 6).
2. An orchestration test drives a condition-less `win` leg to a terminal position and asserts
   the objective transitions on `outcome.reached` with `rules:result-*` grounds.
3. `make pack-check FILE=…` passes for both updated trajectory drafts and its report shows
   non-zero grading rules for the outcome legs.

### 3. Documentation updates (at implementation)

`docs/drill-pack-format.md:35-37` and `docs/drill-client.md:13-19` replace the "no format
encoding until a real judge threshold and anti-contamination contract exist" statements — this
RFC is that contract; `docs/adaptive-guidance.md` and `docs/explanation-grounds.md` gain the
guard's disclosure and record semantics; `docs/branch-runtime.md` notes `feedback.generated`'s
emitter and tightened validation; `docs/trajectory-drill.md`/`docs/outcome-drill-grading.md`
record the D28 fix. `design/BACKLOG.md` rows 154 and 196 update on landing.

### 4. What this RFC deliberately does not do

No pre-commit guard. No guard prose beyond the closed evidence-sentence vocabulary. No live
out-of-band evaluation. No new evidence-ref kinds, event types, tables, or endpoints. No
change to `delayed_checkpoint`, `segment_end`, or `attempt_end` behavior. No authored on-ramp
pack (content-era work; the knob merely exists again).

No match interaction exists to specify, and that is structural, not scoping: a native match
requires an **untouched position run** (`apps/server/src/live-session.ts:76`), position runs
are pinned to `feedbackPolicy: "attempt_end"` (`packages/runtime/src/session.ts:40`;
`service.ts:539` for the flip precedent), and `attempt_end` is not pack-selectable — so a
guard run can never sit under `MATCH_LIVE`, and the guard prompt's rewind offer can never
collide with the match-live rewind refusal (`service.ts:1433-1437`). Non-match live sessions
on a guard run change nothing: the prompt is client rendering over the existing event
stream; possession and journal machinery are untouched.

### 5. Register claims (single-writer resources, `rfc/README.md`)

Wave claim #2, behind `repertoire-gap-finding` per the 2026-08-14 register order.
`repertoire-gap-finding` registered wave claim #1 while this draft was being written:
migration 15, no pack/run schema claim. This draft therefore rebased its migration claim from
15 to 16 (the F2/F3 precedent — rebase is cheap: content digests ignore the `$id`; the
migration is stamp-only) and keeps its schema claims uncontested. Rows are recorded in
`rfc/README.md`.

| Resource | Claim |
|---|---|
| Pack schema | **0.14** — enum member + optional `guard` block (§1b) |
| Run schema | **0.10 → 0.11** — `RunFeedbackPolicy` widened (§1c) |
| Migration | **16** (`STORAGE_VERSION` 15→16) — stamp-only frozen literals; lands behind migration 15 (§1c) |

## Deviations from design

- **Name:** the thesis names the knob "immediate blunder-guard feedback"
  (`design/00-thesis.md:150`); the encoded value is `immediate_guard` (§1a). The thesis names
  a knob, not an enum member; the rename drops a judgment word from a rules-facts surface and
  keeps the removed value dead.
- **Rung 2 during committed play:** `design/05-in-run-experience.md` §3a sets silence as the
  default and leaves the rung-0/rung-2 line during play open. This policy shows rung-2
  evidence mid-run — as an authored, pack-declared, capability-published exception, which is
  exactly the per-pack ADR-0006 override the thesis's on-ramp lane specifies. The default for
  every other policy remains silence.

Otherwise none.

## Acceptance criteria

1. Baseline holds: the current suite (verified this draft: **432 tests / 73 files**, `pnpm test`,
   2026-08-14) stays green throughout; new tests below are added, none deleted.
2. A pack with `feedbackPolicy: "immediate_guard"` validates against schema 0.14, loads, and
   creates a run whose `run.started` records the policy. `immediate_blunder_guard` still fails
   schema and runtime validation by name.
3. `guard` present with a non-guard policy is refused `GUARD_WITHOUT_IMMEDIATE_GUARD`;
   `evalSwingCp: null` provably disables tier 3 while tiers 1–2 fire.
4. Tier tests: a −3 material swing at C fires with `rules:material`; an attacked-undefended
   minor at C fires with `rules:structure-direct-attack-count`; a recorded ≥200cp swing
   against the learner fires on `applyEvidence` with the eval's `engine:` ref; a
   sub-threshold exchange fires nothing; at most one record per C under tier races. The
   §1e misfire classes are pinned by fixture: an absolutely-pinned sole attacker still
   fires and its rendered sentence carries the counts-only scope; a piece whose sole
   counted defender is pinned does not fire. The first decision of a run (P = root, no
   recorded root eval) abstains on tier 3 while rung-0 tiers fire normally.
5. Engines-absent deployment (`providers.judge: "none"`): same pack loads and guards
   rules-only; `/capabilities` reports `guardBasis: ["rules"]` and `feedbackPolicies`
   including `immediate_guard`. A mock deployment (`providers.judge: "mock"`) reports
   `guardBasis: ["rules", "engine"]` and its engine tier fires on mock evals. The
   binding test (§1a) pins schema enum === `FEEDBACK_POLICIES`.
6. Disclosure: on a guard run, `publicEvents` withholds nothing, `applyEvidence` never throws
   `FEEDBACK_WITHHELD`, and the compare surface returns engine evidence without a checkpoint.
7. Client walkthrough: guard prompt appears after the opponent reply, board stays live,
   "play on" leaves the line intact, "rewind" returns to P and a new move forks a branch with
   the original attempt still present.
8. Replay: a run containing a guard `feedback.generated` round-trips; the event now requires
   an existing node and non-empty refs; migration 16 upgrades a database at `STORAGE_VERSION`
   15 and reopening performs no work.
9. D28: the §2c tests pass; both trajectory drafts pass `pack-check` with their dodge
   conditions removed; a condition-less `win` leg transitions on `outcome.reached`.
10. Emitter: `position-seeds` output declares `immediate_guard`, omits the substitution
    blocker, and remains deterministic under the sourcing-check gate.
11. Register rows for pack 0.14, run 0.11, and migration 16 are recorded in `rfc/README.md`
    in the same change that lands them.

## Open questions

The one candidate — rung-0-only versus rung-0-plus-engine firing — is argued closed in §1e:
the owner has already ruled the form and the schedule; the ladder rules the presentation; the
remaining numbers are pack-overridable authoring conventions, not owner-level design.

None.

## Changelog

- 2026-08-14: created. Drafted against verified baselines (432/73 green); every file/line
  citation checked against the working tree this date.
- 2026-08-14: migration claim rebased 15 → 16 after `repertoire-gap-finding` registered wave
  claim #1 (migration 15) concurrently; schema claims (pack 0.14, run 0.11) uncontested.
- 2026-08-14: adversarial review (re-verified against the working tree at 432/73 green,
  `STORAGE_VERSION` 14, pack 0.13, run 0.10). Fixed in place: tier 1 pinned to the
  `materialBalance` learner-perspective balance with the value table inlined; tier 2
  pinned to `directAttackCount` (`structure.ts:169-176`) with a required false-positive
  analysis (pinned attacker and x-ray battery fire; pinned defender does not; classes
  pinned by fixture in AC 4); tier-3 timing pinned honestly (late by construction, root
  node has no eval job at creation, rewind-cancellation abstention via
  `evidence-queue.ts:162`); branch-group opponent nodes excluded from evaluation;
  `guardBasis` mapping corrected for `providers.judge: "mock"` (mock evals are real —
  AC 5 reworded, it had conflated mock with engines-absent); late-fire client rendering
  specified; guard/match interaction proven structurally unreachable
  (`live-session.ts:76` + `session.ts:40`) rather than merely out-of-scoped; Motivation
  emitter citation corrected (committed candidates carry the older D8 blocker text; the
  current emitter writes the reworded line at `position-seeds.ts:225`); AC 11 register
  typo fixed (migration 15 → 16).
- 2026-08-14: implementation review against the post-migration-15 tree found no design
  blocker. Corrected the §1c heading typo, pinned the explicit `PackRun` union widening,
  and made root-opponent-ply abstention normative so a reply cannot be attributed to a
  learner decision that never happened.
