# Module registration — implementation receipt (2026-09-24)

Authority: owner direction in session, 2026-09-24 — implement `rfc/module-registration.md` (the
registry half of `rfc/learner-modules.md`) and the [[D921]] Wave-C amendment directly, with no
review round. Genuine RFC defects are fixed inline with a changelog line; every other finding is a
test. Ledger/log/README closeout is left to the coordinator.

## What landed

| site | change |
|---|---|
| `packages/runtime/src/module-contract.ts` | §2.3(a): `MODULE_ANSWER_CAPABILITIES` + `MODULE_ANSWER_CAPABILITY_IMAGE` replace the exact-match singleton image; `ModuleAnswerContract` is `none` / `capabilities` / `guided_hint@1`. The compiler derives each module's accepted answer union from the manifest (`closure.answerContent`) and refuses a widening (`MODULE_ANSWER_WIDENS`) or an unwitnessed capability (`MODULE_CAPABILITY_UNWITNESSED`). New `blocked_dependencies` evidence arm (`MODULE_DEPENDENCY_BLOCKED`); `family_partitioned` empty state confined to Full Inspector's eight families |
| `packages/runtime/src/module-reducers.ts` | §2.3(b): admission enforces the module capability union; the avoidance denominator is read from the declared `legalAlternatives` operand |
| `packages/runtime/src/module-policy.ts` (new) | `MODULE_POLICIES` — the one policy authority ([[D3066]]); sessions derived from `WORKFLOW_CONTEXT_POLICIES`; `moduleEvidenceRole` (solo→learner) |
| `packages/runtime/src/evidence-catalog.ts` | `MODULE_CONSUMER_ACCEPTS` — the one exact `id@version` acceptance image; `MODULE_SUCCESSOR_REBASE` (§1.3.1); recorded-path v2 successors for review-timed modules; nine `module.*` consumers derived from the policy table; 31 dispositions transferred (derived, §2.4) |
| `packages/runtime/src/module-registry.ts` (new) | `MODULE_DECLARATIONS`; `MODULE_REGISTRY` compiled at import; `assertModuleRegistry` (sessions, roles, preset resolution, binding set-equality, [[D3065]] cover-or-refuse); `MODULE_PAIR_EXECUTION` (executable vs `blocked_dependencies`, per pair) |
| `packages/runtime/src/module-packets.ts` (new) | `compileModulePacket` — the one operation every `module.*` consumer names |
| `packages/runtime/src/postcommit-nudge.ts` (new) | Post-commit Nudge: one-edge closure + grade → `module.postcommit_nudge@1`, backstop 2, loud overflow |
| `packages/runtime/src/review-map.ts` | grade, recorded evaluation and recorded-path relations admitted through `module.review_map@1`; stated withholding outside the module's roles/sessions |
| `apps/server/src/service.ts`, `rest.ts` | `review()` passes the viewer; `postcommitNudge()` + `GET /runs/:id/nudge?nodeId=` gated on `feedbackDeliveryOpen` |
| `apps/web/src/lib/nudge-response.ts`, `api.ts`, `DrillScreen.svelte`, `App.svelte` | closed nudge parser; a seat in the Support region when the active preset composes `postcommit_nudge` |
| `apps/server/src/evidence-manifest-check.ts` | module consumers set-equal to `MODULE_CONSUMER_IDS`, all naming `compileModulePacket` |
| `docs/learner-modules.md` (new), `docs/evidence-contract.md`, `docs/semantic-evidence.md` | canonical description; manifest tuple 40/216/34/501 |
| `tools/d2120-…/module-plan-fixture.ts` | author policy derived from `MODULE_POLICIES` (no restated capability) |
| `tools/d1865-…/evidence-assembly.test.ts` | disposition-transfer pin moved to its landed truth (only the four retired pre-rebase refs remain) |

## Registered vs blocked

- **Compiled:** 11 declarations; 9 `module.*` consumers; 258 exact pairs over 147 projections; 2
  declared-awaiting (`derived.explorer.population_summary@1`, `pack.authored.classifier@1`).
- **Executable (46 pairs):** Review Map — `derived.grade.move_quality@1`, `live.stockfish.eval@1`,
  the eleven recorded-path v2 events; Post-commit Nudge — `derived.grade.move_quality@1` + the 32
  one-edge semantic events it accepts.
- **Blocked by name:** Guided Hint (hint-distance D1639, module-registration D7; no consumer);
  pre-/at-commit modules (intent-presets disclosure receipt, A16); every seat's pair-keyed
  presentation (evidence-presentation, A5); module query route/exact operations (D8); Nudge
  avoidance (complete candidate population, D745) and v1 sequence events (recorded window, D1870);
  the rest of Review Map (review-evidence-compiler packet).

## Criteria → tests

| criterion | test | state |
|---|---|---|
| A1 registry compiles in production + four invariant negatives | `module-registry.test.ts` "[A1]", "[A1 negatives]" | green |
| A2 acceptance/binding set by derivation | "[A2]" (258/260/147, eligibility byte-identical, `rules.phase.reading@2` eligibility → `EVIDENCE_ELIGIBILITY_ORPHANED`, adapter deletion → `MODULE_BINDING_DRIFT`) | green; JSON object equality to the historical plan is not asserted (generator stale — RFC changelog) |
| A3 sessions/roles derived | "[A3]" | green |
| A4 capability branches | "[A4]" (runtime), `module-contract.test.ts` "[A4]" crossed theory/evaluation/unwitnessed, `module-reducers.test.ts` "[§2.3(b)]" | green |
| A6 disposition transfer | "[A6]" | green |
| A8 honest empty (partial) | Nudge silent frame (`postcommit-nudge.test.ts`, `nudge-response.test.ts`); `family_partitioned` compile test | partial — seats for the other modules await presentation |
| A9 fact backstop loud | `postcommit-nudge.test.ts` (reduction_quality@1 on overflow) | fact dimension green; words/marks/arrows fit pass not built |
| A21 successor rebase | "[A21]" | green |
| A26 / D3065 cover-or-refuse | "[A26 / D3065]", invariant 5 at import | green |
| learner-modules A19 / D921 | `module-registry.test.ts` "[learner-modules A19 / D921]"; `make wave-c-module-amendment` | green |
| move-quality-grades D1 | `postcommit-nudge.test.ts` "[move-quality-grades D1]"; `evidence-catalog.test.ts` grade binding | green |
| Review Map D5 | `postcommit-nudge.test.ts` "Review Map — module.review_map@1 admits everything it shows"; server `review-map.test.ts` | green |
| A5, A7, A10, A11, A13, A16–A20, A23–A25 | — | open (dependencies named above) |

## What remains

- Discharges D1–D8 of `module-registration.md`; A16's ephemeral receipt; A5 presentation adapters;
  the seats of the other seven evidence modules; `blunder_prevention`'s staged-move protocol (§2.7);
  `assistance.arrows` retirement (§6); the words/marks/arrows fit pass (§5.1); the D1164 novelty
  identity table (the reducer keeps its honest abstention).
- The historical `rfc/contracts/module-*-plan-v1.json` requirement artifacts are not regenerated:
  their generator fails at HEAD on the retired `rules.pivotal.marker` presentation family.
- Coordinator closeout: `design/BACKLOG.md`, `rfc/README.md` rows (module-registration now
  implementing; learner-modules D921 accepted), `planning/exploration/log.md`.
