# Evidence contract manifest — implementation plan

Status: implementing
RFC: `rfc/evidence-contract-manifest.md`
Started: 2026-08-21

This plan binds the RFC's fourteen implementation areas to the exact current symbols before code
changes. It preserves behavior, schemas, storage and content; F2 selection/lift and F5 workflow
presets remain out of scope.

| area | exact implementation surface |
|---:|---|
| 1 | `packages/runtime/src/evidence-contract.ts`: contract types, `DeclaredEvidence`, stable error codes, compiler, canonical JSON, SHA-256 digest |
| 2 | `packages/runtime/src/evidence-catalog.ts`: `rules.structural` predicate/reading projections closed over `STRUCTURAL_FEATURE_KINDS`; `outpost` dependency; `pawn_count` disposition |
| 3 | `packages/runtime/src/evidence-catalog.ts`: `rules.transition` family/leaf reading projections closed over `TRANSITION_FEATURE_KINDS`, with operand-loss limitations |
| 4 | `packages/runtime/src/evidence-catalog.ts`: `rules.phase`, `rules.pivotal`, `rules.endgame` declarations and their deterministic consumers |
| 5 | `packages/runtime/src/evidence-ref.ts`, `voice.ts`; `apps/server/src/guidance.ts`: typed wrapping and exact consumer views without widening provider input |
| 6 | `apps/server/src/position-evidence.ts`, `evidence-manifest.ts`: recorded engine/tablebase adapters and dispositions closed over `EVIDENCE_KINDS` |
| 7 | `apps/server/src/evidence-queue.ts`, `rest.ts`, `evidence-manifest.ts`: live Stockfish/Syzygy projections, including explicit PV narrowing |
| 8 | `apps/server/src/opponent-selector.ts`, `corpus.ts`, `evidence-manifest.ts`: Maia/Explorer availability and consumer bindings |
| 9 | `apps/server/src/authored-feedback.ts`, `shape-registry.ts`, `sourcing/openings.ts`, `evidence-manifest.ts`: authored/shape/opening declarations and source-only dispositions |
| 10 | `apps/server/src/evidence-manifest.ts`: the single server aggregate, provider availability join and compiled public summary |
| 11 | `apps/server/src/capabilities.ts`, `application.ts`, `main.ts`: startup fail-fast and `/capabilities` digest/availability/binding summary |
| 12 | `apps/web/src/lib/api.ts`, `DrillScreen.svelte`, `CompareView.svelte`: shared capability type, literal consumer IDs and approved “Evidence inspector” labels |
| 13 | `packages/runtime/src/evidence-contract.test.ts`, `evidence-catalog.test.ts`; `apps/server/src/evidence-manifest.test.ts`; `apps/server/src/evidence-manifest-check.ts`: twelve negative families, closure, anchors, provider-off and bypass checks |
| 14 | `docs/evidence-contract.md`, `docs/explanation-grounds.md`, `docs/engine-workers.md`: canonical contract and cross-links |

## Landing sequence

1. Declare: contract/compiler/catalogue plus exact closure and dependency tests.
2. Bind: typed wrappers and literal consumer bindings at all twenty-three operations.
3. Expose: live availability, capabilities, startup check, inspector labels and docs.
4. Verify: `make evidence-manifest-check`, A3/A4/A5 harnesses, `make verify`, browser suite.

The implementation stops and returns the RFC if a current learner-visible path cannot satisfy an
exact declaration. It does not introduce wildcard, legacy or temporary bindings.

## Current return

Checkpoint 2 is incomplete at [[D662]]. The compiled evidence list and the provider sentence list
have separate authorities in `VoiceEvidenceView`; compare/story mutate the latter without declared
source records. Resume only after the RFC author specifies one typed boundary for those derived
sentences. Checkpoints 1 and 3 remain useful implementation work but do not constitute a landable
F1 contract by themselves.
