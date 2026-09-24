# Evidence presentation Checkpoints P (remainder) and B, module seats, intent-presets Checkpoint B — implementation receipt (2026-09-24)

Implemented directly at the owner's direction (no review round). RFCs touched: `rfc/evidence-presentation.md`
(P + B), `rfc/module-registration.md` (A5, the query route, §2.6/§2.7 seats), `rfc/play-composition.md`
(§4 seats, matrix states 3/5/9/13), `rfc/intent-presets.md` (Checkpoint B, D5). All stay `implementing`.
No `archive/` or `design/` byte changed. A pass over `design/00`–`06` found no sentence this change set
falsifies (design/05's form inventory stays the channel layer beneath which the components sit —
Discharge D1 is unchanged), so no intent amendment is proposed.

## What renders where

Seats exist only for modules the **finalized** style composed with a play-timing effect; each delivery
is bound to that final digest.

| preset | seats rendered in play |
|---|---|
| Quiet | none (legal moves only) |
| Guide me | Square facts on request (sight), After-move nudge, Named-structure nudge, Theory pointer, Attempt comparison (Guided Hint: hint-distance lane) |
| Theory only | Theory pointer |
| Support (Just Play contexts) | Staged-move risk check (head slot), Square facts on request, Threat radar, After-move nudge, Theory pointer (Guided Hint: hint-distance lane) |
| Analyze | Attempt comparison in play; Review Map and Full Inspector on their explicit surfaces |

Workflow-context ceilings still narrow these (e.g. Match renders none; blunder prevention only where
the context admits it).

## Landed

- **Checkpoint P (remainder):** opponent selection and repertoire scan machine-only; Story rank
  selection-only (`SELECTION_ONLY_BINDINGS`); `pack.authored.phase@1` = `{phase}`; `named_structure@2`
  retains witness `squares`; `derived.citation.attribution@1` (+ `runtime.evidence_ref` binding). Fence:
  `presentation-checkpoint-p.test.ts` (all eight rows landed, postimage behaviour).
- **Components:** the eight declared-only components gain operand types, strict parsers, equivalent
  sentences and Svelte components (`apps/web/src/lib/evidence/components/`); `PresentedEvidence.svelte`
  dispatches all fourteen.
- **Adapters:** play group (sight, threat radar, blunder prevention, structure nudge, theory breadcrumb,
  compare coach), inspector group (Full Inspector 75, Post-commit Nudge 52, Review Map), consumer group
  (ordinary 91, Inspector 40 non-module, author/operator 5). `make component-coverage`: 0 misses in all
  four populations (module seats 188/188).
- **Module query:** `queryModules` (runtime) → `RunService.queryModules` → `POST /runs/:id/modules/query`;
  decision stamp; `fitModulePresentation` (§5.1); `ModuleDisclosureReceipt`; `witnessedEvidence` keeps
  empty readings out of every packet; answer-ceiling refusal for ordered components (criterion 13).
- **Execution census:** `MODULE_PAIR_EXECUTION` flips a pair exactly when an operation acquires it
  (`module-query-sources.ts`) and its adapter exists; every evidence-bearing module except Guided Hint has
  executable pairs.
- **Client:** `module-query-response.ts` strict parser (refuses a page compiled under another final
  digest, digest/subject drift, unbound components), `module-seats.ts`, `ModuleSeats.svelte`, and the
  DrillScreen seat controller with the §2.7 staged-move protocol (Revise / play anyway / unavailable).
- **Labels and sweeps:** `apps/web/src/lib/labels/` (51 vocabularies), `make label-sweep` (0 findings,
  empty allowlist), `make component-theme-sweep`, `make component-coverage` — all in `verify-software`.

## Criteria → tests

| RFC criterion | test |
|---|---|
| EP 1 | `presentation-contract.test.ts` "declares exactly the fourteen…" (all `implemented`) |
| EP 2 | `make component-coverage` (`tools/component-coverage/coverage.test.ts` RED arms) |
| EP 3 | `apps/web/src/lib/labels/labels.test.ts` (`@ts-expect-error` totality arms) |
| EP 4, 9, 10 | `make label-sweep` (`tools/label-sweep/label-sweep.test.mjs`) |
| EP 5 | `presentation-contract.test.ts` "guards every component text boundary…" |
| EP 6, 7, 8, 11, 12, 13a, 14, 15, 17 | `apps/web/src/lib/evidence/components.test.ts` (one `describe` per criterion) |
| EP 8 (production reach) | `presentation-consumer-adapters.test.ts` Explorer "2 of 25 games in this population" |
| EP 13 | `module-query.ts` `assertAnswerCeiling` (refuses at the render boundary) |
| EP 14 | `components.test.ts` criterion 14 + `presentation-consumer-adapters.test.ts` reachability |
| EP 16, 21, 21a, 21b | `presentation-contract.test.ts` (Checkpoint A) + round-trips in every adapter group test |
| EP 18 | `presentation-checkpoint-p.test.ts` |
| EP 20 | `tools/verify-scaffold.mjs` requires `component-coverage` in `verify-software` |
| MR A5 | `make component-coverage` module population; `presentation-inspector-adapters.test.ts` |
| MR executable census | `module-registry.test.ts` "marks what is executable versus blocked…" (flip rule) |
| MR §2.5.2 route | `apps/server/src/module-query.test.ts`, `packages/runtime/src/module-query.test.ts` |
| PC A2/A5/A6, states 3/5/9/13 | `tests/browser/drill.spec.ts` "@matrix module seats render sealed evidence…" |
| PC state 2 | `@matrix play composition keeps one exact board rectangle…` (sight seat) |
| IP criterion 9 / D5 | `screens.test.ts` "delivers the Post-commit Nudge only through the compiled effect…"; `module-query.test.ts` "delivers nothing the preset did not compile" |

## Open (not claimed)

- Play-composition state 6 (guided hint final stage): the Guided Hint seat is the hint-distance lane's.
- Current-consumer UI migration (Checkpoint A's second half): adapters exist for every ordinary and
  Inspector pair, but CompareView, the guidance voice path and the Inspector modal sections still render
  through their legacy sentence helpers; migrating each call site to receipts is follow-up work.
- Full Inspector renders on its explicit review timing through the query; the modal still hosts its
  legacy sections alongside.
- `human.maia.*` and `live.stockfish.pv@1` rows name squares (the payload keeps no FEN for SAN).
- Structural readings whose squares are empty (file-scoped kinds) render as file facts without board
  paint; widening their declared operands is a follow-up.
- The citation sentence renders the registry revision literal `standard-endpoint-contract@1`; the raw-id
  guard does not catch hyphenated ids (`[[D2401]]`'s registry claim is also still open).
- The Checkpoint-A Review Map grade sentence carries `grade-convention@1/…` (move-quality-grades' own
  renderer); unchanged here.
- `compileModuleExactOperationResolution`'s artifact receipt (MR D8) is not produced; the operation's
  source image is the literal `module-query-sources.ts` table.
- D1 (owner's design/05 amendment), D9 owner use, archival of all four RFCs.

## Verification (after `git merge main` at 88fb79e2)

- `make typecheck` — clean (runtime, schema, server, web: svelte-check 0 errors).
- `make verify-software` — green: test-software 285 files / 2358 tests; label-sweep 0 findings; component-theme-sweep; component-coverage OK (ordinary 91/91, Inspector 115/115, author/operator 5/5, module seats 188/188); remaining checks green.
- `make verify-content` — 21 files / 212 tests.
- `CI=1 make test-browser-smoke` — 53 passed, 1 skipped (pre-existing skip).
- `CI=1 make test-browser-matrix` — 48 passed, including the new module-seat matrix (states 3/5/9/13 at seven projections).

Fixed on the way: main's Just Play "starting support" copy failed WCAG contrast (now `--ink`); main's new provider-health/import surfaces rendered raw reason/state/id text (now labels or `learnerProse`).
