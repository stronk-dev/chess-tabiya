# Learner modules

The eleven learner modules (`rfc/learner-modules.md`, registered by `rfc/module-registration.md`)
are compiled at runtime import. A module is a declaration, not a detector: it names which sealed
projections it may admit, at which timing, for which roles and workflow contexts, under which
answer capabilities and budgets. It selects no chess fact by itself and authors no chess prose.

## Where it lives

| file | role |
|---|---|
| `packages/runtime/src/module-contract.ts` | the fourteen-field contract, the branched answer-capability image, `compileModuleRegistry` |
| `packages/runtime/src/module-policy.ts` | `MODULE_POLICIES` — the one policy authority (intent, action, timings, capabilities, roles, budgets, forms, empty behaviour, seat, novelty) |
| `packages/runtime/src/evidence-catalog.ts` | `MODULE_CONSUMER_ACCEPTS` — the one exact `id@version` acceptance image, and the nine `module.*` F1 consumers derived from it |
| `packages/runtime/src/module-registry.ts` | `MODULE_DECLARATIONS`, `MODULE_REGISTRY` (compiled at import), `assertModuleRegistry`, the per-pair execution table |
| `packages/runtime/src/module-packets.ts` | `compileModulePacket` — the single operation every `module.*` consumer names |
| `packages/runtime/src/module-reducers.ts` | admission, ordering, identity, subsumption, bounded novelty and the fact backstop |
| `packages/runtime/src/postcommit-nudge.ts` | Post-commit Nudge, the post-commit production caller |

Sessions are never written: a module's `ceilings.sessions` is the set of workflow contexts whose
`WORKFLOW_CONTEXT_POLICIES.moduleCeiling` contains it, and the registry fails at import if the two
disagree. Roles map through the one total projection `moduleEvidenceRole` (solo → learner).

## Answer capabilities

Answer distance is a branched set, not a ladder: `observation`, `pattern`, `threat`, `theory`,
`evaluation`, `candidates`, `ranked_candidates`, `move`, `principal_variation`. A module's image is
the union of its declared capabilities. The compiler derives each module's accepted answer union
from the compiled projections and refuses a union outside the image or a declared capability with
no accepted witness. Admission enforces the same image per fact. `derived.grade.move_quality@1`
(evaluation) is therefore admissible exactly to Post-commit Nudge and Review Map.

## What executes today

Every compiled pair is either `executable` through a named production operation or
`blocked_dependencies` with its blockers (`MODULE_PAIR_EXECUTION`).

- **Review Map** (`reviewMapProjection`, served at `GET /runs/:id/review`): the move grade, the
  recorded evaluation and the eleven exact recorded-path v2 events are admitted through
  `module.review_map@1` before they render. A viewer outside the module's roles, or a workflow
  context whose ceiling excludes it (Match, onramp), sees the stated withholding sentence instead.
- **Post-commit Nudge** (`postcommitNudgePacket`, served at `GET /runs/:id/nudge?nodeId=`): one
  committed learner move's one-edge semantic closure plus, when both recorded evaluations exist,
  its grade — admitted, ordered and backstopped at two facts, with one `reduction_quality@1`
  observation on overflow. It is withheld until `feedbackDeliveryOpen`. Empty is silent.
- **Guided Hint** (`compileGuidedHintPacket`, served at `POST|GET|DELETE /runs/:id/hints`): one
  learner-requested family×rung disclosure per request, admitted through `module.guided_hint@1` at
  the checkpoint (open disclosure boundary) timing. See [Guided Hint](guided-hint.md).
- **Blocked:** Pre-/at-commit modules wait on the ephemeral disclosure receipt
  (`intent-presets`); every seat waits on pair-keyed presentation adapters
  (`evidence-presentation`); the general module query route waits on
  `compileModuleExactOperationResolution` (module-registration D8). Two declared-awaiting refs —
  `derived.explorer.population_summary@1` and `pack.authored.classifier@1` — are named, not
  fabricated.
