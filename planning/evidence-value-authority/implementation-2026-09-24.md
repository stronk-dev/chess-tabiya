# Implementation receipt: `rfc/evidence-value-authority.md`

**Date:** 2026-09-24 · **By:** claude (worktree `agent-ab369751c08788e1a`, branch
`worktree-agent-ab369751c08788e1a`, rebased onto `main` 0b9a0223) · **For:** coordinator closeout
**Status set in the RFC:** `awaiting D1 — implemented 2026-09-24`. `implemented` is refused by
status-parity P5 while discharges D1–D5 are open. `make status-parity` P2 fails until the
coordinator's `rfc/README.md` row changes from `draft` to `awaiting`. The archive move, `design/BACKLOG.md`
rows ([[D2144]], [[D2145]]), the exploration-log entry and the `rfc/README.md` row are left to the
coordinator, as instructed.

## What shipped

- **Value receipt.** `evidence-contract.ts#declareEvidence` now requires a mint authority
  `{factory, inputDigest, sourceDigests}` and records a private `EvidenceValueReceipt` in a
  `WeakMap`. `assertDeclaredEvidence` refuses a value with no receipt, or one whose payload digest
  disagrees with its receipt. There is a single choke point for every consumer boundary.
- **One mint.** `packages/runtime/src/evidence-factories.ts` holds all 210 factories: 35 computed and
  27 derived out of the 75 generic rows, plus every specialised route. They cover four shapes and
  each carries `{route, symbol, shape, arms, dependency, pending?}` metadata. Only this file calls
  `declareEvidence`.
- **One invoker.** `packages/runtime/src/internal/evidence-value-routes.ts#invokeEvidenceValueRoute` is
  a literal route table with generated input/result maps and runtime admission. Production
  operations for server and web are named authority-input functions in `evidence-operations.ts`.
- **Deleted.** `evidence-source-adapters.ts`, `evidence-adapter-closure.test.ts`, and every
  `declare*Evidence(payload)` adapter, including `declareExactLegalMovesEvidence`. The candidate
  packet's `createRulesMobilityReadingLegalMovesV1Evidence` stand-in now lives in the factory module.
- **Successors.** `rules.phase.reading@2`, `rules.structural.reading.named_structure@2`,
  `rules.endgame.classification@1`, `theory.endgame.setup_match@1`, `theory.endgame.method_stage@1`,
  `derived.pivotal.{irreversibility,phase_change,human_divergence,option_collapse}@1` and
  `derived.structural.predicate_result@1`. The v1 projections are retired with zero bindings.
- **Inverted semantic compile.** `compileSemanticEvidenceEvent` takes no `operands`. The operands
  are the sealed payload, and `derivationInputs` must equal the receipt's `sourceDigests`.
- **Migrated.** Server (guidance, candidate-evidence, guard, opponent-selector, repertoire,
  sourcing claim binding, position evidence, manifest map) and web (evidence sentences,
  inspector, claim presentation, DrillScreen, CompareView, story response). Evidence-reference
  resolution moved into the runtime (`evidence-ref-resolution.ts`).
- **Gates.** `make evidence-value-authority` is a new permanent target and part of
  `verify-software`. `make evidence-value-authority-route-map` now verifies the frozen receipt
  against the registry. The author contract and the D2144 seal audit are rewritten for the
  implemented state.

## Criteria → tests

Unless another file is named, tests are in `packages/runtime/src/evidence-value-authority.test.ts`
(the gate). Per-route profiles are pinned in `packages/runtime/src/fixtures/evidence-value-profiles.json`.

| # | Status | Evidence |
|---|---|---|
| 1 | met (re-derived) | "migrates exactly the literal route receipt" pins 204 routes / 200 projections / 6 no-route and the collapse of duplicates. The frozen receipt has moved on from the RFC's 192/188 (RFC changelog (a)) |
| 2 | met | "keeps the §3 twenty-row grounding review" (9/6/2/3) |
| 3 | **not met (dependency)** | D1/D2 are still drafts. The dependent parts fail closed (see below) |
| 4 | met | receipt test: every old route has one final factory with an equal symbol and shape; `make evidence-value-authority-route-map` |
| 5 | met | "only evidence-factories.ts calls declareEvidence"; "keeps the mint helper … out of the package" |
| 6 | met | invoker admission ("refuses unknown routes, missing/extra keys") plus per-route falsifiers. Computed arms take FEN, edge, run or sealed inputs only |
| 7 | met for computation; **convention closure pending D1** | the literal and convention rows are recomputed in the profiles. The six convention rows carry `pending: semantic-convention-provenance` |
| 8 | met | "derives phase and one of five decision arms…" (13/14, 17/18, 2/3, 4/5 boundaries); `apps/server/src/guidance.test.ts` |
| 9 | met | registry equality with the retired list; successors in `evidence-catalog.test.ts` |
| 10 | **fail-closed** | "keeps Lucena/Philidor/Vancura setup and method stage honest-unavailable". No cited setup convention exists (D1), so the 3/3/0 population and setup positives are **not** claimed |
| 11 | met | `packages/runtime/src/pivotal-evidence.test.ts` (own projection per kind; no relabel) |
| 12 | met | "mints the structural predicate result only from the exact sealed authored condition"; `structural-evidence.test.ts` |
| 13 | met | "one permanent profile per final factory": a valid case and a falsifier for all 210 routes, digest-pinned |
| 14 | met | "makes the D2144 impossible castling-loss event unrepresentable"; "refuses the four same-key reading forgeries and the pawn-contact inversion"; `tools/d2144-evidence-seal-audit` |
| 15 | met | "derived factories reject missing, extra, duplicate, wrong-version and same-id/different-value ancestry" |
| 16 | partly met; **receipt types pending D2** | "source factories refuse mismatched kind/source …". Provider identity/occurrence is checked against the typed packet or ledger record. No D2 exchange receipt exists yet |
| 17 | met | "authored factories project only the authority's fields and never upgrade grounding" |
| 18 | met | "receipts record input/source digests and assertDeclaredEvidence rechecks the payload digest"; `evidence-contract.test.ts` |
| 19 | met | "every admission surface rejects identity-sealed, value-unverified wrappers" |
| 19a | met | "only the central registry value-imports projection factories"; invoker admission test |
| 20 | met with a qualification | no content, preset or relevance-rule file changed. Consumer bindings moved from v1 to their successors, and endgame guidance lost its technique name, both as required by criteria 8–10 (intent amendment filed) |
| 21 | see Verification | browser, CI parity and package build were not run in this lane |
| 22 | met | `docs/evidence-contract.md` §Value authority; `docs/semantic-evidence.md` §Sealed construction |
| 23 | coordinator | flips at archive |
| 24 | **open** | D4 fresh independent buildability review has not been done |
| 25 | met (corrected) | "re-derives the 75 generic caller-payload adapter partition" = 35/27/9/4 (RFC changelog (b)); recorded readings in the criterion 16/25 test |
| 26 | met | "computes named-structure@2 … exactly id/name/provenanceNote" |

## What remains (explicit dependency gaps)

1. **D1 semantic-convention-provenance.** The six exact-under-convention rows, the phase band, the
   named-structure catalogue, the endgame classification and the eleven `@2` recorded sequences
   carry `pending: semantic-convention-provenance`, with no convention closure digest. The endgame setup
   and method-stage factories return `unavailable`. When D1 lands, register the setup/method
   conventions and replace the unavailable arms with computed ones. The 3/3/0 population and the
   criterion 10 falsifiers must then be added.
2. **D2 provider-exchange-and-execution.** Source-receipt factories project the typed packet or
   ledger record and check its identity. They do not verify a provider exchange receipt, because
   none exists yet.
3. **Registered authored provenance.** Authored factories compute attribution from the pack
   document but cannot yet check a registered document digest pointer.
4. **Runtime opening identity.** `theory.opening.current_endpoint@1`,
   `theory.opening.catalogue_membership@1` and `derived.opening.deepest_reached@1` are
   unavailable-only factories. `derived.grade.move_quality@1` stays experimental and unavailable.
5. **Known narrowness, not blocking.** The semantic `sign` is still computed by the caller in
   `compileSemanticEvidenceEvent`, although it is checked against the sealed evidence. Derived
   FEN-level readings (for example role signature and promotion pressure) record no separate
   source digests because they are recomputed from the FEN.
6. **D4.** A fresh independent buildability review is still needed, per the RFC.
7. **Recorded-semantic-path stand-ins.** The v1 sequence, pivotal and imported-result factories
   still note `recorded-semantic-path` as their pending receipt. That RFC is implemented but
   `awaiting`, and the v1 routes have no production caller. Their `@2` successors consume
   `run.record.edge@1`.
8. **Pre-migration disposable harnesses no longer run.** They import removed adapters or read the
   deleted adapter file. None is part of `verify-software`, `verify-governance`, `verify-content`
   or `verify-rfc-evidence`: d1071, d1631, d1652, d1699, d1703, d1714, d1862, d1921, d1927, d1930,
   d1931, d2105, d2141, d2157, d2179, d2202, d2389, d2428 (×2), d2552, d2553, d2584 (×2), d2625 (×2),
   d2650, d2678 (×2), d2885, d2929, d2934, d355-reading-cost-harness, q8-feedback-surface-harness
   (these two import the retired `endgameReading`). They are frozen evidence instruments of
   pre-implementation states.
9. **Pre-existing failure, not from this change.** `apps/server/src/expression-census.test.ts`
   "keeps zeros factual…" fails on `main` 0b9a0223 too. Return scheduling added `retryVariants`
   consumers.

## Reconciliation with main (rebase onto 0b9a0223)

- **Route map.** Recorded-semantic-path re-keyed the D2146 route map by exact `id@version` (204/200).
  Its receipt is kept byte-for-byte as the frozen baseline. The author contract's stale
  192/188/185/46 pins become 204/200/198/60.
- **`run.record.edge@1` and the eleven `@2` multi-edge successors** moved into factories:
  `recordedSequenceFactory` checks exact contiguous same-path edges. `SEMANTIC_EVENT_PROJECTION_REFS`
  is kept. `recorded-semantic-path.ts` calls the invoker, and its behaviour and tests are unchanged.
- **Candidate packet.** `createRulesMobilityReadingLegalMovesV1Evidence` is owned by
  `evidence-factories.ts` and reached through the invoker. `candidate-population.ts` keeps its
  retention, `WeakMap` receipt and scope behaviour. `declareExactLegalMovesEvidence` is retired, and
  its only callers (tests) were migrated.

## Intent

`planning/platform-alignment/evidence-value-authority-intent-amendment-2026-09-24.md` reports that
`design/03` B10's "endgame technique naming" is now false. It also flags B4's "exact source
adapters" as stale.

## 2026-10-11 follow-up — recursively immutable payloads (D3721)

The accepted deep-freeze/admission contract did not hold for shallow-frozen factory
payloads. Four new permanent regressions fail against the predecessor: an already-frozen
object/array with a mutable child; a real structural fact whose `feature.count` changes
from 2 to 99 while its original receipt still admits; a frozen getter whose external count
changes; and 277 mutable descendant paths across the existing complete factory profiles.
Those are fixture paths, not a population-wide detector failure rate.

The sole mint now traverses already-frozen shells. Only recursively frozen ordinary
own-data trees enter the private digest/canonical cache. Accessors, custom prototypes
and array holes remain uncached and their current bytes are rechecked at admission.
Shared sealed inputs retain identity; no chess semantics, registry routes, receipt fields,
provider contracts, assistance policy or pack bytes change. The focused Make gate now
includes the contract tests as well as the complete factory authority tests: all 51 pass.
Collector checks (83), longitudinal checks (65) and workspace types also pass.

Eight isolated fresh-process before/after comparisons retain complete projected rows,
events and factory receipts in both colours. Summed cold time increases from 23,610.272
to 29,054.584 ms, 23.06% locally; all eight pairs are slower (20.53–26.77%). This is a
correctness repair, not a performance improvement or a portable latency claim. D3300's
cold-cost residual remains open. Only ignored bundles and a compact timing aggregate are
retained; raw recordings are not a CI/progress dependency.

The normal validation writer refreshes only nine implementation digests and 53 population
predicate digests, plus the derived TypeScript receipt digest. All 307 case outcomes,
81 subjects, 53 population receipts and eight external receipts remain; zero subjects
fully qualify. Existing qualification, consumer adoption and RFC discharges remain open.

Final normal serial `make roadmap-receipt verify-awake build test-browser-ci-awake`
exits zero: 4,980 software/377 files, seven performance/four files, 255 content/26
files, clean types/governance/packaging/build and 302 browser passes (237 smoke,
five real-content, 59 matrix, one packaged-production), one existing optional Maia
skip, zero retries and all 150 input/112 composition cells. D3721 closes locally
with its permanent test path. No exact-revision GitHub run, built-image recovery,
official graduation or whole capability/milestone is claimed. The existing large
JavaScript-entry warning is recorded separately as D3722, measurement before a fix.

## 2026-10-12 follow-up — stable factory authority inputs (D3750)

The existing input-digest memo checked `Object.values` on a frozen plain authority record.
A frozen getter could therefore yield a different reference on the next invocation while its
factory receipt retained the previous input digest. A symbol-driven authority shape could do
the same with an unchanged payload. Two permanent real reference-resolution factory controls
fail on the predecessor. The first descriptor-only repair passes those controls but fails two
additional inherited iterator/run-classifier controls; all four boundaries are now covered.
These are in-process authority counterexamples, not a measured rate of incorrect learner facts.

The memo now admits only frozen ordinary records of primitive own data properties, with no
symbol iteration hook or inherited run-shape fields. All other inputs retain the existing
per-invocation authority-shape/digest path; their validators and payload semantics are not
changed. An ordinary frozen record, its repeat and its mutable-record counterpart retain the
same complete receipt. No new cache, source, projection, receipt field, chess convention,
assistance rule, saved pack/run or caller-usable mint is introduced. This is an input-receipt
correctness repair, not D3300's cold-cost completion or general input snapshotting.

The first complete repair's focused Make commands pass 58 contract/factory, 120 collector and 65 actual
projector/store/worker checks, plus workspace types with zero errors/warnings. The first
sandboxed worker run cannot listen on localhost (EPERM); the same command with local-server
permission passes without code, budget, retry or assertion changes. The canonical writer
retains all 343 case outcomes, 81 subjects, 53 population receipts and eight external receipts;
only nine operation and 53 population implementation digests refresh, independently compared
against HEAD. Zero subjects become qualified and the existing RFC discharges remain open.

The first repair's eight alternating-order fresh-process comparisons preserve complete events,
factory/input receipts, projected rows and forty checkpoints per side. Summed cold time is
37,779.852 ms before / 39,815.867 ms after, 5.39% higher locally (three faster, five slower).
That timing does not prove portability or an isolated causal attribution. The private cache now
checks own descriptors only on first admission; a sixth permanent control fails with three
descriptor reads instead of one on the first repair. Every reuse still rechecks the inherited
shape guards, and the inherited controls first populate the clean-record cache before adding
the hook. No accessor or inherited-shape authority can use that fast path. Final comparison
and ordinary verification must establish the final implementation, not inherit the first run.

Final focused commands pass 59 contract/factory, 120 collector and 65 actual projector/store/worker
checks plus clean workspace types. Eight final alternating-order fresh-process comparisons retain
all 2,199 legal edges, 196,589 events, complete factory/input receipts, projected rows and forty
checkpoints per side. Summed cold time is 32,719.662 ms before / 34,623.054 ms after, **5.82% higher
locally** (three faster, five slower; ratios 0.836–1.453). The descriptor work-count reduction is
proved; a cold-game speed improvement is not. The changed load/order observations do not isolate
the checks' latency or establish a portable regression rate. Keep this cost explicit and D3300
open; no threshold, population, seal or evidence quality is weakened. Only ignored small aggregate
reports/bundles are retained, and progress/CI never needs either report or raw profiles. The final
canonical report again changes only 62 implementation-digest leaves; all outcomes remain unchanged.

Final normal serial `make roadmap-receipt verify-awake build test-browser-ci-awake` exits zero:
5,226 software cases/384 files, seven unchanged-budget performance cases/four files, 255 content
cases/26 files, clean workspace types/governance/packaging/build and 340 browser passes
(275 smoke, five real-content, 59 matrix, one packaged-production), one existing optional Maia
skip, zero retries, all 150 input cells and 112 successful unretried composition cells. Existing
bundle warnings remain. D3750 closes locally with permanent path evidence; D3300 cost, source
contracts, semantic qualification and RFC discharges stay open. No official graduation,
whole capability/milestone, exact-revision GitHub or expanded release-image proof is claimed.
