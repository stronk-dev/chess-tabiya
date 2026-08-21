# Objective lifecycle versus authored consequence

**Question.** Why can feedback-delivery's full-spine predicate not be reached for eight packs, and
is the repair an anchor workaround, a runtime semantic change, or an authoring/validation fix?

## Result

The failure is an authoring-contract defect, not a feedback-anchor defect. A disposable replay of
every authored leaf through the shipped runtime and real plan-signature resolver found **8 of 50
packs**, **10 authored leaf paths**, and **1–6 authored plies** hidden behind an absorbing objective
transition. Every transition is `achieved`; none is `failed` or `transitioned`. `[V]`
(`planning/feedback-delivery/objective-lifecycle-diagnosis.md`,
`tools/feedback-delivery-harness/objective-lifecycle.test.ts`)

The clearest witness is `closed-centre-chain-black-base-strike`: its own annotation says the
objective is satisfied after `cxd4`, and the pack then authors six more plies showing the blockade,
capture and recapture consequence. The runtime refuses the first of those moves because
`TERMINAL_OBJECTIVE_STATES` includes `achieved`. `[V]`
(`content/drafts/closed-centre-chain-black-base-strike.json`;
`packages/runtime/src/runtime.ts`, `commitMove`)

This violates an existing, already accepted invariant rather than exposing an unresolved product
choice: D12b says *a state that stops play may only be entered where play has actually ended*, while
the thesis requires the consequence to remain mandatory. `[V]` (`design/BACKLOG.md`, D12b;
`design/00-thesis.md`, “The consequence stays mandatory”; `rfc/archive/outcome-drill-grading.md`
§2)

## Exact affected surface

| Pack | first absorbing authored node | authored plies hidden |
|---|---|---:|
| `closed-centre-chain-black-base-strike` | `cxd4-recapture` | 6 |
| `french-advance-chain-white` | `qc7-step` | 6 |
| `iqp-black-tarrasch-defence` | `nxd4-remove` | 3 |
| `iqp-white-panov-attack` | `h4-space` | 1 |
| `kid-mar-del-plata-white` | `c5-break` | 1 |
| `london-wedge-black-counterplay` | `exd4-recapture` | 4 |
| `open-centre-french-exchange-black` | `re8-contest` | 1 |
| `open-centre-ruy-exchange` | `rxd1-recapture` | 4 |

All figures are executable `[V]`; the generated report retains the evidence references that caused
each transition (`planning/feedback-delivery/objective-lifecycle-diagnosis.md`).

## The tempo subclass is a second defect

All four `preserve_plan_window` packs author four `timing_window` success conditions that duplicate
the objective type's built-in rules. The implementation intentionally maps `in_time` to
`preserved` and the three timing errors to `degraded`, then appends authored conditions. Therefore a
duplicate terminal rule cannot fire at the verdict node: the built-in rule wins first, and the
terminal copy fires only on a later ply from the inherited non-terminal state. `[V]`
(`apps/server/src/pack-orchestrator.ts`, `objectiveRules`; `docs/outcome-drill-grading.md` §Tempo
objectives; the four pack documents)

Two packs expose that delayed terminal today; Dragon and Maroczy merely end their authored line
before the duplicate gets another chance. The latter are latent defects, not clean controls. This is
D646. `[V]`

## Alternatives tested against the invariant

1. **Add feedback anchors. Refused.** It would route around unreachable play while leaving authored
   consequence moves impossible.
2. **Let every absorbing objective state continue. Refused for this defect.** It would rewrite the
   runtime-wide meaning consumed by branch decidedness, comparison, group admission and progress,
   when the accepted D12b law already identifies the authoring error. `[V]`
   (`packages/runtime/src/branch-scale.ts`, `compare.ts`; `apps/server/src/service.ts`;
   `apps/web/src/lib/screen-model.ts`)
3. **Repair the documents and make recurrence impossible. Chosen.** Intermediate successful plan
   predicates use `preserved`; the four tempo packs rely on their type-owned verdict rules rather
   than re-declaring them; and validation replays authored edges and refuses an absorbing objective
   transition at a spine node that still has authored children.

The validator must use the real plan-signature resolver and the real orchestrator. A static search
for `to: achieved` is insufficient because terminal success at an actual authored leaf is legal, and
because predicates may be structural, temporal or checkpoint-derived. `[V]` (the D645 harness's
first pass failed until real plan-signature resolution was supplied; the corrected pass is recorded
in `planning/feedback-delivery/log.md` 2026-08-20)

**Implementation re-run.** Once the eight first `achieved` blockers were repaired, the new guard
exposed one masked second transition: IQP Black entered `transitioned` when the structure dissolved,
after its success was already `preserved`, with one authored move left. `[V]` The condition remains
terminal from `active` but may no longer overwrite a preserved success; this is transition
precedence, not a new chess judgement.

## Verdict

**FIX NOW.** The exploration gate is closed by executable corpus evidence, the intended semantics
are already ruled by D12b and the thesis, and the repair is bounded: two validator refusals plus a
ten-document lifecycle migration (the eight live failures and two latent tempo siblings). This is
foundation work; authored scale should not proceed while a
pack can validate a consequence tree the runtime makes unreachable.
