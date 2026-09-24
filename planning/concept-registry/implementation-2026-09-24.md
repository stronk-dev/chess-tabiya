# Concept registry — implementation landing

**Date:** 2026-09-24

**Scope:** `rfc/concept-registry.md` implemented at **migration 28** under the owner's
direct-implementation direction (no review round before landing; consolidation, review and the
`rfc/README.md` Active-row transition belong to the register owner). The acceptance population is the
RFC's thirty criteria plus the sixth return's [[D2960]]–[[D2965]]; each has an executable control
below. Genuine RFC defects are corrected inline in the RFC Changelog (nine corrections).

## What landed

| Part | Where |
|---|---|
| Compiler, private authority (`WeakSet`), `labelCollisionKeyV1` (Unicode 17.0), `ConceptRef`, six consumer operations, wire parsers | `packages/runtime/src/concept-registry.ts` |
| Registry content: head + one immutable revision, 168 seeded entries (every id referenced by the 50 concept-declaring packs of 56) | `content/concepts/current.json`, `content/concepts/revisions/5175e94a….json` |
| Schema lane `concept-registry-schema` 1 (`$id`, `CONCEPT_REGISTRY_SCHEMA_LANE`), catalogue row, register section | `schemas/concept_registry.schema.json`, `packages/schema/src/index.ts`, `rfc/shared-resource-registers.json`, `rfc/README.md` |
| The server's sole reader; pack census; `make concept-registry-census` / `concept-registry-revise` | `apps/server/src/concept-registry-loader.ts`, `concept-registry-tool.ts`, `Makefile` |
| Lint malformed → error; unknown / retired-new → error at validation, pack-check and publication; labelled pack summaries; `GET /packs/concepts` | `packages/schema/src/drill-pack/lint.ts`, `apps/server/src/pack-validation.ts`, `pack-registry.ts`, `pack-studio.ts`, `rest.ts` |
| `RegisteredConceptResolver` (pack-scoped resolver removed); unregistered stored-pack ids quarantined at projection | `apps/server/src/progress.ts`, `service.ts` |
| Migration 28: rebuilt `attempt_concepts`, `attempt_concept_legacy`, `concept_registry_migration`; coordinator-owned transaction; frozen repository; sealed sorted artifact snapshot; receipt; restart verification; close on every refusal | `apps/server/src/concept-migration.ts`, `storage.ts` |
| Startup order: registries compile before the coordinator opens SQLite; composition failure closes storage | `apps/server/src/application.ts` |
| `same_concept` (cross-pack, labelled, quarantine never joined); voluntary concept-return metric on the global key | `storage.ts`, web `progress-response.ts`, `App.svelte` |
| `pack.authored.concept_reference@1` (identity only, `inspector_only`) and its runtime operation | `evidence-factories.ts`, `evidence-catalog.ts`, `internal/evidence-value-routes.ts`, `evidence-operations.ts` |
| Account export (exact refs, quarantine rows, validation) and deletion (cascade; registry untouched) | `account-data.ts`, `storage.ts` |
| Pack Studio picker (searchable, active only, retired/unknown shown for removal, registry abstention) | `apps/web/src/lib/PackVocabularyEditor.svelte`, `pack-vocabulary-fields.ts`, `api.ts` |
| `/profile` skills: registered concepts as candidate leaves via the reference projection (≥ 2 packs) | `apps/server/src/learner-profile.ts`, `packages/runtime/src/skills-contract.ts` |
| Docs | `docs/concept-registry.md` (+ index, drill-pack format, return and progression, account lifecycle) |
| Intent amendment (design/03:329, design/06:392-397) | `planning/platform-alignment/concept-registry-intent-amendment-2026-09-24.md` |

## Acceptance → tests

| Criterion / defect | Test |
|---|---|
| 1 (schema, version, head + revision, register row, claim removed) | `rfc/README.md` registers (`make register-check`); `concept-registry.test.ts` › keeps the schema lane, the revision literal and the JSON schema `$id` in step |
| 2, 17 | `packages/runtime/src/concept-registry.test.ts` › criterion 2/17 (compile; malformed/duplicate/collision/order/extra/Unicode/non-canonical; head, misnamed, missing, orphan, cyclic-arm; deletion, reactivation, rename/retire with exact old-ref rendering) |
| 3 | `apps/server/src/concept-registry-content.test.ts` (content tier); `make concept-registry-census` |
| 4, 18, 23, 24, 29, 30, [[D2960]], [[D2961]] | `apps/server/src/concept-registry-closure.test.ts` › six live consumers; `.svelte` chain; counterfeit / uncalled / discarded / type-error falsifiers; per-project options |
| 4 (structural scan), 11 | `concept-registry-closure.test.ts` › the structural scan and the successor walls |
| 5 | `apps/server/src/concept-registry-consumers.test.ts` › criterion 5; `packages/runtime/src/evidence-value-authority.test.ts` profile |
| 6 | `concept-registry-consumers.test.ts` › criterion 6; `concept-migration.test.ts` › prior-release upgrade |
| 7, 13, 14 | `apps/server/src/concept-migration.test.ts` › criteria 7, 13, 14 (all seven classifications on a prior-release database; zero-row fresh receipt; missing inventory refused) |
| 8 | `concept-registry-consumers.test.ts` › criterion 8; `apps/web/src/lib/concept-registry-web.test.ts` › criterion 8 |
| 9 | `concept-registry-consumers.test.ts` › criterion 9; `concept-registry-web.test.ts` › criterion 9 (picker, search, keyboard-native checkboxes, labelled group, retired removal, abstention) |
| 10 | `concept-registry-consumers.test.ts` › criterion 10; `concept-registry.test.ts` › typed abstention for an unavailable revision |
| 12 | software tier carries no corpus assertion for the registry; the set-equality check is the content-tier file |
| 15, 20, 21 | `concept-migration.test.ts` › criteria 15, 20, 21 (five fault points roll back to 27 and restart; collision guard) |
| 16, 28 | `concept-migration.test.ts` › criteria 16, 28 (reopen, later revision admitted, six refusals each closing SQLite) |
| 19 | `concept-registry.test.ts` › criterion 19 (Straße/STRASSE, σ/ς, NFKC, NFC, no Turkish folding, Unicode-version refusal) |
| 22, 27, [[D2962]] | `concept-migration.test.ts` › criteria 22, 27 (loader-order-independent digest, forged built-in digest, stored digest mismatch, validator-invalid quarantine) |
| 25-analogue, [[D2963]] | `concept-registry.test.ts` › [[D2963]]; `concept-migration.test.ts` › refuses a digest-bearing registry lookalike |
| 26 | `concept-migration.test.ts` › criterion 26 |
| [[D2964]], [[D2965]] | `concept-migration.test.ts` › no half-composed authority (coordinator refusal closes SQLite; post-coordinator composition failure closes storage) |
| skills 4–7 | `concept-registry-consumers.test.ts` › skills criterion 4, composed application leaf census; criteria 5–7 as above |

## What remains

- **Discharge D2 (OWNER):** review the 168 seeded labels (`Advance chain base`, …). Renames are a new
  revision; ids never change.
- **Discharge D4, Campaign half:** `campaign-catalogue-progression.md` binds to the same `ConceptRef`
  through `pack.authored.concept_reference@1`; no Campaign code consumes it at this landing.
- **Skills leaf taxonomy:** the ≥ 2-pack concept leaf rule is mechanical until the owner's leaf →
  category table (skills §3.3) exists.
- The pre-landing `make concept-registry-*-review` / `*-author-repair` targets (in
  `verify-rfc-evidence`, not a release gate) are retained evidence of the returns. The two that read
  the live RFC/README text are now pinned to the pre-landing commit `d5f11d70` (the D2898/D2922 rule)
  and pass; from `concept-registry-third-author-repair` onward the disposable models import the live
  `PackRegistry` with invented fixture concepts (`fork`) and a pre-28 `attempt_concepts`, which the
  landed registry now correctly refuses. Re-pinning those models to the pre-landing tree, or retiring
  them in favour of the production tests above, is the register owner's consolidation call.
