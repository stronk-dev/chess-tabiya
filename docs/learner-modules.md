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
| `packages/runtime/src/postcommit-nudge.ts` | Post-commit Nudge, its one-edge source closure (also served by the legacy `GET /runs/:id/nudge`) |
| `packages/runtime/src/module-query.ts` | `queryModules` — the one module query operation (sources, admission, presentation, budget fit, disclosure receipt) |
| `packages/runtime/src/module-query-sources.ts` | the literal per-module source image `MODULE_PAIR_EXECUTION` is derived from |

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

Every compiled pair is either `executable` or `blocked_dependencies` with its blockers
(`MODULE_PAIR_EXECUTION`). A pair is executable exactly when a production operation acquires its
sealed source **and** an exact pair-keyed presentation adapter presents it.

- **The module query** (`queryModules`, `packages/runtime/src/module-query.ts`, served at
  `POST /runs/:id/modules/query`): the browser sends its requested-assistance receipt and one closed
  timing request (`pre_commit` with an optional selected square, `at_commit` with a staged UCI and
  generation, `post_commit`, `checkpoint` or `review`, plus the on-request doors it opened). The server
  recompiles and finalizes the assistance itself and delivers only modules whose compiled effect
  exists at that timing. Per module it acquires the sources (`module-query-sources.ts`), runs
  `compileModulePacket`, presents the survivors through the exact adapters, fits the post-adapter
  budget over whole fact bundles (`fitModulePresentation`) and returns a `presentation.receipt@1`
  plus a `ModuleDisclosureReceipt` bound to the decision stamp and to the finalized digest.
  Post-commit output waits for `feedbackDeliveryOpen`. Empty is the module's declared state.
- **Seats** (`apps/web/src/lib/ModuleSeats.svelte`, `module-seats.ts`): Sight on request (the square
  gesture), Threat radar, Theory pointer and Attempt comparison on request; Post-commit Nudge and
  the Named-structure nudge after a move; Staged-move risk check in the head slot while a staged move
  is held (Revise / play anyway). One seat is expanded at a time; board paint is the expanded seat's
  own facts. The client refuses any page compiled under a different final digest.
- **Review Map** (`reviewMapProjection`, `GET /runs/:id/review`) is unchanged.
- **Blocked:** Guided Hint is the hint-distance lane's. Pairs whose source is a provider page or a
  multi-edge window the query does not acquire are blocked by name; two declared-awaiting refs remain.
