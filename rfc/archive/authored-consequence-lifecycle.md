# RFC: Authored consequence lifecycle — an objective may not hide its own continuation

- **Status:** implemented 2026-08-21 on the owner's instruction to fix D645 properly now. The
  implementation choice is not newly invented here: it applies the already accepted D12b law that
  a state which stops play may only be entered where play has ended.
- **Author:** codex, for Marco
- **Created:** 2026-08-21
- **Design refs:** `design/00-thesis.md` (the consequence stays mandatory),
  `design/04-content-architecture.md` (objectives are executable predicates), D12b.
- **Exploration gate:** `design/research/objective-lifecycle-diagnosis.md`; executable replay in
  `tools/feedback-delivery-harness/objective-lifecycle.test.ts`.
- **Owns:** D645 and D646.
- **Parent / amends:** follows `rfc/archive/outcome-drill-grading.md` and
  `rfc/archive/tempo-vocabulary.md`; neither archive file changes.
- **Claims:** no schema version, run version, migration, vocabulary or persisted field.

## 1. Problem

Eight packs enter `achieved` while the same authored path has one to six moves remaining. The
runtime then correctly refuses the next move because objective terminal states are absorbing. The
documents therefore promise consequence play that their own objective declaration prevents.

Separately, all four `preserve_plan_window` packs re-declare the four timing verdict rules their
objective type already owns. Since built-in rules run first, these terminal copies can only fire on
the ply after the verdict. Two are live D645 failures; two are latent.

Anchoring feedback does not repair either failure. Making absorbing states globally playable would
change branch decidedness, comparison, progress and group admission to compensate for eight invalid
documents. This RFC does neither.

## 2. Specification

### 2.1 Refuse duplicate tempo grading

`objectiveIssues` emits error `PLAN_WINDOW_CONDITION_REDUNDANT` for every
`timing_window` success condition under a `preserve_plan_window` objective. The path is the exact
`/objective/successConditions/{i}` pointer (or leg pointer). Its message states that the objective
type already grades the declared verdict.

Other authored condition kinds remain legal under `preserve_plan_window`; KID's structural plan
consequence is such a condition.

### 2.2 Refuse an absorbing authored non-leaf

Pack validation replays the authored spine as a tree, once per edge, through the real
`orchestratePackStart` / `orchestratePackMove` path and the real plan-signature resolver. When an
authored node has children and its post-orchestration objective state is `achieved`, `failed`, or
`transitioned`, validation emits error `OBJECTIVE_ABSORBS_BEFORE_AUTHORED_BOUNDARY`.

The issue points at the matching success condition when its `pack-success-{i}-…` rule can be
identified; otherwise it points at `/objective/successConditions`. The message names the authored
node and number of direct children. One issue per absorbing authored node, not one per descendant.

The check is scoped to top-level non-trajectory spines. Trajectory legs retain their stronger
existing leg-boundary checks. A terminal board position at a leaf remains legal. An absorbing
objective transition at a leaf remains legal. The validator does not infer whether an unauthored
move is strategically a consequence.

### 2.3 Repair the corpus mechanically

For these intermediate successful predicates, change `to: "achieved"` to
`to: "preserved"` without changing the predicate, prose or evidence:

- `closed-centre-chain-black-base-strike`
- `french-advance-chain-white`
- `iqp-black-tarrasch-defence`
- `kid-mar-del-plata-white` (`strike-the-base` only)
- `london-wedge-black-counterplay`
- `open-centre-french-exchange-black`
- `open-centre-ruy-exchange`

Narrow `iqp-black-tarrasch-defence`'s structure-dissolved `transitioned` rule to `from: ["active"]`.
Its preserved success must not be overwritten two plies later; the terminal rule remains available
when the structure dissolves before that success.

Remove all `timing_window` success conditions from the four `preserve_plan_window` packs; their
type-owned rules remain the sole producer of those verdict transitions:

- `dragon-yugoslav-race`
- `iqp-white-panov-attack`
- `kid-mar-del-plata-white`
- `maroczy-bind-white-squeeze`

Panov then has no authored success-condition list. KID retains only its plan consequence, targeting
`preserved`. No chess claim, move, annotation, evidence label or source changes.

## 3. Acceptance criteria

1. A two-ply fixture whose first move satisfies `to: achieved` fails with
   `OBJECTIVE_ABSORBS_BEFORE_AUTHORED_BOUNDARY` at the condition pointer; moving the same success to
   the leaf passes.
2. The guard works with a `plan_signature` condition using the registry resolver, not an inlined
   test-only expression.
3. A `preserve_plan_window` fixture with an authored `timing_window` condition fails with
   `PLAN_WINDOW_CONDITION_REDUNDANT`; a non-timing authored condition remains admitted.
4. All four migrated tempo packs contain zero `timing_window` success conditions.
5. The D645 disposable replay reports zero packs with absorbing non-leaf objective transitions.
6. Feedback Stage 1's walkthrough reaches its exhaustion predicate on 50/50 claim-bearing packs;
   no anchor or lifecycle exception is added.
7. Existing objective-terminal runtime tests stay unchanged and green.
8. `make verify`, `make test-browser`, `make pack-check`, and `git diff --check` pass.
9. `docs/outcome-drill-grading.md` and `docs/branch-runtime.md` describe the two validation guards.
10. D645/D646, the RFC register, exploration log, feedback log and content-era log close in the
    same landing. The content closeout names all twelve touched pack/condition operations.

## 4. Refusals

- No feedback anchor is inferred.
- No absorbing objective state becomes playable.
- No success predicate is moved to a later position merely to make it terminal.
- No authored chess statement is rewritten.
- No schema lane is consumed for validator behavior over an already valid grammar.

## 5. Changelog

- 2026-08-21: accepted initial specification from the owner directive, D12b and the executable D645
  diagnosis.
- 2026-08-21: implementation replay exposed one formerly masked `transitioned` rule in the IQP pack;
  §2.3 now preserves success precedence while retaining the rule from `active`.
