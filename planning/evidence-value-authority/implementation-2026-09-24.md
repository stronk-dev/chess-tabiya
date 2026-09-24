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
