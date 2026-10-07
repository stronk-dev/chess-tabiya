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
  Both king-event vocabularies exclude unchanged king observations before packet reduction,
  including the legacy Nudge operation. For example, 1.e4 does not fill the Nudge with
  unchanged king-edge facts; its real line-opening consequences remain eligible. Actual king-location/zone changes remain eligible;
  the raw collector evidence is not deleted or rewritten.
  Sight, Threat Radar, Blunder Prevention and Structure Nudge now preflight their complete
  execution bindings after finalized demand/timing/square/disclosure checks, before any selected
  module collects. All effective local consumers pass before the first source read. Server pack
  and shape inputs are prepared lazily, once per query; suppressed modules prepare nothing.
  A broken execution contract returns generic `EVIDENCE_UNAVAILABLE` (503), not partial output
  or source diagnostics. Every repeated request preflights again. This is local production
  adoption, not complete manifest execution or request-specific provider satisfaction.
  Threat Radar and Blunder Prevention request loose-piece readings with the opponent to
  move: that collector reports victims opposite its side to move, so the card describes
  the learner's exposed pieces, not the opponent's. Invalid turn clones remain unavailable.
  Threat Radar's filled threat caption states the hypothetical turn and the immediate-threat
  limit in ordinary language, while its receipt retains `threat-convention@1` and all
  piece/square operands. Blunder Prevention has a separate compact registered caption over
  those same operands, so a single concrete capture fits its unchanged one-fact/20-word cue.
  Neither renderer chooses a threat, predicts the opponent's choice, claims a forced line
  or enlarges the evidence budget. Over-budget bundles remain dropped, not truncated.
- **Seats** (`apps/web/src/lib/ModuleSeats.svelte`, `module-seats.ts`): Sight on request (the square
  gesture), Threat radar, Theory pointer and Attempt comparison on request; Post-commit Nudge and
  the Named-structure nudge after a move; Staged-move risk check in the head slot while a staged move
  is held (Revise / play anyway). One seat is expanded at a time; board paint is the expanded seat's
  own facts. The client refuses any page compiled under a different final digest.
  Filled Nudge cards offer **Try another move**, returning to the exact parent of their
  recorded learner move, even after an opponent reply. A different committed move creates
  another attempt without deleting the old one. Filled Compare cards offer **Enter other
  attempt**, returning to the shared fork on the same other branch whose facts were delivered.
  Source delivery and navigation share `moduleComparisonForSubject`: subjects on the active
  recorded path belong to that attempt, not necessarily to their creating branch; off-path
  subjects retain their creating branch. The other attempt is the newest remaining branch.
  Both actions use the existing branch-aware rewind operation, without executing an opponent
  reply, and return focus to the board. On phones the companion's modal boundary closes first.
  Exact disclosure/run/decision/configuration checks refuse stale actions; read-only and busy
  actions have visible explanations, requests are single-flight, and failures retain an exact
  retry. Leaving the screen or switching runs retires pending navigation.
  The ordinary bot's phone rematch action lives in Support tools instead of wrapping over
  the board. Desktop rematch remains in the header; its noninteractive context is bounded
  within its own wrapping column while the full status announcement remains available to assistive technology.
- **Review Map** (`reviewMapProjection`, `GET /runs/:id/review`) is unchanged.
- **Guided Hint** (`compileGuidedHintPacket`, served at `POST|GET|DELETE /runs/:id/hints`): its own
  learner-requested seat beside the module seats — one family×rung disclosure per press, admitted
  through `module.guided_hint@1` at the checkpoint (open disclosure boundary) timing. It is not a
  `modules/query` module: the progressive ladder needs the per-decision request protocol. Its 35
  pairs still carry exact `play.guided_hint@1` seat adapters (sentence, lit squares/halo, one
  move arrow on the move rung), so presentation coverage stays complete. See
  [Guided Hint](guided-hint.md).
- **Blocked:** Pairs whose source is a provider page or a
  multi-edge window the query does not acquire are blocked by name; two declared-awaiting refs remain.
