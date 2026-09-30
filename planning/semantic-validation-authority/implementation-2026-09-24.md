# Implementation receipt: `rfc/semantic-validation-authority.md` (Slice A)

**Date:** 2026-09-24 · **By:** claude, at the owner's direction (implement directly, no review
rounds) · **Status token:** left `draft` so status-parity P2 stays green; the coordinator flips the
README Active row and this body token together.

## What shipped

- **Pure authority** — `packages/runtime/src/semantic-validation.ts`: closed subject/arm/cell/profile
  types; strict parsers for profiles, case/population/external refs, cases, operation-selected
  inputs, expectations, fact constraints, the three proposition authorities and the owner store;
  the projection-derived root inventory; four-way root/declaration/profile/verdict equality with a
  uniqueness pass first; the three registry subset joins; whole-collection fact constraints; the
  total mirror transform and closed operand walk; verdict compilation; the repository-derived
  owner-transition guard.
- **Operations** — `semantic-validation-operations.ts`: eight versioned operations mapped to the
  production exports (`localSemanticEventClosure`, `structuralSemanticEvents`,
  `transitionSemanticEvents`, `breadthSemanticEvents`, `semanticDutyEvents`,
  `recordedSemanticPath` ×2, `selectSemanticEvidence`), each with a declared reach (`direct` with
  its non-test callers, `exact_projection_multiset` through its application operation, or honest
  `required`). `complete_alternatives` is `required` (D1716).
- **Runner** — `semantic-validation-runner.ts`: fixture validity (canonical before/move/after,
  contiguous paths, exact legal sets), authority resolution, exactly-once invocation, exact target
  selection, the sole-factory value-receipt conjunct, reach multiset retention and the closed
  expectation arms (emits/omits/abstains/mirrors).
- **Oracles** — `semantic-validation-oracles.ts`: five import-isolated neutral oracles; the
  tablebase oracle abstains (no isolated receipt validator). No witness row is sealed.
- **Authority stores** — `semantic-validation-authorities.ts` (node-only): the D1713 existing-
  assertion resolver (matrix row, brace-matched test body digest, frozen expectation digest), the
  cited resolver (no manifest → refuses), the owner resolver (store absent → refuses, naming D0).
- **Registers** — `semantic-validation-profiles.json` (78 profiles, equal to the §3.2 law exhibit
  in `semantic-validation-law.ts`), `semantic-validation-cases.json` (38 cases),
  `semantic-validation-external.json` (8 D872 receipts, source-digest-bound).
- **Generated receipt** — `tools/semantic-validation-build.ts` writes
  `semantic-validation-receipt.generated.json` (full) and `.generated.ts` (compact verdicts; the
  only runtime import). `make semantic-validation-update` writes; `make semantic-validation-check`
  recomputes (~16 s) and joins `verify-software`. Population reader:
  `tools/semantic-validation-population.ts` (108 games, 579 sampled edges, digests reproduced).
- **Eligibility** — `EvidenceEligibilityDeclaration.semanticValidation`; the 78 research rows are
  `research_only`; `event_value_unverified` reason; `admitValidatedSemanticInstance` (barrel).
- **Owner transition** — `make semantic-validation-owner-transition-check` (HEAD→index, or
  `HEAD^1→HEAD` under CI).

## Measured result (generated receipt)

78 subjects; **0 passed**. 38/38 cases pass (29 positive, 9 negative). 53 population receipts
(local edge ×579 sampled edges, recorded path ×108 paths). 8 external receipts. Open arms by
subject: orientation 78; positive/negative wherever D1713 had no emitter-level row; the 14 blocked
subjects (13 avoidance + king opposition) are `required` on every case arm with owners D1716/D1717.
The 11 v1 window events carry `required` imported population (no production operation).

## Criteria → tests (`packages/runtime/src/semantic-validation.test.ts`, 32 tests)

| # | Status | Evidence |
|---|---|---|
| 1 | met | "[1] derives live roots…" (mutual omission, held promotion-race event) |
| 2 | met | "[2] carries a profile reference only…"; `semantic-evidence.test.ts` compile-mechanics test |
| 3 | met | "[3] requires all six arms…" (empty/unknown/crossed/stale refs) |
| 4 | met | "[4][14][27] joins every present ref…" (missing case) |
| 5 | met | "[5][27] refuses callbacks, prebuilt evidence…" |
| 6 | met | "[6][22] refuses every wrong operation/input pairing…" |
| 7 | met | "[7][8] fails a positive that reaches its operation empty…" |
| 8 | met | same (illegal move, non-successor after FEN) |
| 9 | met | same (valid negative: one invocation, zero targets, unrelated events) |
| 10 | met (mechanism) | "[10][19]…", "[10] binds a mirror partner…", "[7] fails a one-sided…"; no orientation case exists (authority) |
| 11 | met | "[11][26] rejects zero/zero…" |
| 12 | met | "[3]" retired R2 token dialect and stale versions |
| 13 | met | "[20][13] changes the projected input digest…"; the byte-compare check invalidates on predicate/result change |
| 14 | met | "[4][14][27]…" (dead, duplicate, cross-subject rows) |
| 15 | met | "[15] registers only production symbols…"; "[18] fails reach when…" |
| 16 | met | "[16][21] executes every migrated case…"; "[16][25] resolves only an unchanged moved assertion…" |
| 17 | met | `make semantic-validation-check` byte comparison (verified stale after a source edit) |
| 18 | met | "[18][24] admits an instance only with…" |
| 19 | met | "[14][19] compiles research_only only for…" |
| 20 | met | "[20] validates derived events on their own profile only" |
| 21 | met (re-derived) | 29 positive / 9 negative emitter cases vs the RFC's 39/10 checkpoint: the difference is 11 v1 window-event constructor rows (no production operation) and the v1 trade negative; named, not adjusted |
| 22 | met | generated `population` block: 108 games, 579 edges, derived path denominators |
| 23 | met | "[23] keeps fixture registries … out of the production import graph" |
| 24 | met | `semantic-validation-check` in `verify-software` |
| 25 | met | `docs/semantic-evidence.md` §Declared, validated…; "[25] reports passed/open subjects by arm" |
| 26 | deferred | lands with `bounded-policy-targets` (reading roots) |
| 27–33 | met | "[27] keeps a debt-only root honest", "[28][31]…", "[29]…", "[32] derives owner admissions…", "[33] rejects a duplicate…" |
| 34 | **not met (owner)** | "[34] the protected store is absent" — D0 is the owner's |

## What remains

1. **D0** — the owner (or Claude on an explicit owner ruling) creates the empty protected store.
2. **D1/D2** — D1716 avoidance and D1717 opposition successors; until then those subjects abstain.
3. **D3–D5** — every orientation case, the missing positives/negatives and every counterfactual
   need an independent authority (rules oracle + proposition, cited source or owner row); no
   witness is sealed yet. v2 recorded-path successors have no D1713 authority row.
4. **D6 / Slice E** — no learner consumer binds a semantic event, so none was recompiled.
