# D3322 unauthored-tempo consumer audit

Read-only production/contract audit at `92ebc5de`, not a new implementation,
permission or chess detector. D3322 remains open under core-loop. This distinguishes
the owner's ruled failure default from the missing evidence that could trigger
it. `[V]` current work-state and `design/BACKLOG.md` D3322.

## The existing ruling and its actual scope

`rfc/archive/tempo-vocabulary.md`'s owner ruling and §1.6 split contexts:
pack-authored windows default to ungraded `outpaced` unless that window opts in;
Just Play/unauthored contexts use failure. Its Motivation explicitly excludes
automatic tempo-window detection. Its Deviations §1 says the window is anchored
to an authored commitment and does not transfer into an unauthored game. The
2026-08-15 changelog explicitly says the RFC pins but does not consume that
default. The archive is immutable; publishing the default is not evidence of
implementing its missing consumer. `[V]` exact archived sections.

The evaluator needs a real `TimingWindowDefinition`: opening, ordered closing
conditions, readiness moves, learner perspective and a declared luxury budget.
`windowStates` consumes those operands and a path; it does not discover or ground
them. `unauthoredTempoTransition("outpaced")` maps a supplied verdict to `failed`,
but supplies neither a window nor a verdict. `[V]` `packages/runtime/src/tempo.ts`,
archived §3.1 and current schema timing-window type.

## Current production boundary

The non-test source census finds the helper only in its declaration and barrel
export. `UNAUTHORED_TEMPO_DEFAULTS` additionally feeds `/capabilities`; it has no
production transition consumer. The unit test proves the mapping, not that a
learner can reach it. `[V]` `rg` census across `apps`, `packages` and `tools`,
excluding tests/generated/dist; `tempo.ts`, `index.ts`, `capabilities.ts` and
`tempo.test.ts`.

`SessionSource` and `CreateRunSession`'s position/imported variants carry a start,
feedback/opponent policy and import identity where applicable; neither declares
timing-window definitions. The server constructs an unauthored position session
without pack windows. At learner and opponent commits, the unauthored branch
returns the ordinary committed run; only a registered pack enters
`orchestratePackMove`. The runtime's `timingWindow` predicate requires the literal
window and learner perspective supplied by its rule. There is no window issuer
in these unauthored transition paths. `[V]` `packages/runtime/src/session.ts`,
`apps/server/src/service.ts` create/commit/opponent branches, and
`packages/runtime/src/objective.ts`'s `timingWindow` arm.

The authored `preserve_plan_window` compiler correctly gates `outpaced` on
`window.gradeOutpaced === true` and degrades the authored objective. Calling the
unauthored failure helper there would apply the wrong context and violate the
ruling; adding that call merely to satisfy the source census is not a repair.
`[V]` `apps/server/src/pack-orchestrator.ts` `objectiveRules`, archived §1.6/§5b.

## Required next work, not a completion claim

D3322 needs a grounded unauthored window/verdict issuer and a successor contract
for its actual production adoption. Research must establish what supplies each
window operand and when an unauthored session may admit it. An existing authored
window cannot be silently made universal, and missing readiness/budget/perspective
cannot be fabricated from an arbitrary move or an LLM. This audit does not choose
automatic detection over another valid grounded supplier. `[V]` operand/source
absence above, archived scope and standing law 8.

Then implement the ruled unauthored default on real learner/opponent transitions,
with exact window/path/source evidence, persisted applied records, context
isolation, rewind/branch correctness and real unavailable/no-window abstention.
The authored opt-in behavior must remain unchanged. These are the production
proof boundaries required by the ruling and D3322, not evidence that the missing
issuer or consumer ships today. No owner question is manufactured: the default
is already ruled; its evidence supply and implementation still need work.
`[V]` ruling, archived §3.1/§4.3 and current runtime/consumer boundaries.
