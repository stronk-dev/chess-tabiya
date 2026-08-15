# Fixture realism implementation log

## 2026-08-15 — implementation opened

The final owner ruling replaces the unsatisfiable requirement that valid instrument output cross a safety bound. The implementation uses one float32 ulp of tolerance, a captured Maia vector near the valid-side boundary, and a minimal mutation of that vector to exercise the refusal side.

## 2026-08-15 — implementation landed

Recaptured the dossier's maximum-excess observation from the pinned Maia image: the 17-candidate vector sums to `1.0000000924631376`. Its JSON fixture records image, engine/model identity, request parameters, retrieval time, and info digest. The tolerance is now one float32 ulp (`2**-23`), 1.29x the observed excess. A one-ulp mutation of the captured vector crosses the bound and receives `POLICY_MASS_INVALID`; the server path converts the real vector into a named practical-resistance result rather than an uncoded throw.

Removed three content-version pins and added a behavioural guard over package tests that read content. Whole-tree discovery currently finds 196 named refusal emitters and records 108 without direct test disposition; regex-only dispositions are recognised by word boundary. `SourcingError.code` is now a closed 59-member union. The instrument-fed register resolves `humanConcessionMass` to the captured boundary fixture and mechanically rejects a missing second fixture.

Verification: `ENGINES_REQUIRED=1 make verify` green; `make test-browser` green at zero retries (25 tests, with the optional Maia case governed by the existing profile).

## 2026-08-15 — D64 completion

Replaced `offlineQuery`'s fabricated HTTP transaction with an honest local-file source. Syzygy admission now requires a successful manifest-linked `tablebase.lichess.org` request for the assessed root; the validator rejects the former URL-derived timestamp and reads `job.args.offline`, refusing any offline verify-draft job that claims HTTP provenance. Offline verification remains useful for transformation tests but reports `unverified` and cannot promote a pack.

Re-queried all 135 affected positions across the six packs against the live tablebase. The six packs still earn `ledger_verified`, now from observed responses; the manufactured-shape count is zero and all six jobs record `offline: false`. Their stale prose and graduation blockers were corrected to match the admitted sidecars. Refusal debt now sits beneath a separate frozen ceiling, so the measured register may shrink but cannot absorb a newly untested code.

Verification: focused provenance and refusal-debt regressions green (15 tests); all six strict sourcing checks pass; `ENGINES_REQUIRED=1 make verify` green (608 tests / 98 files, schema and packaging clean); `make test-browser` green at zero retries (24 passed, optional Maia case skipped).

## 2026-08-15 — acceptance demonstrations completed on the real tree

The four criteria that require a demonstrated and reverted mutation were run against production discovery and the actual verification commands rather than simulated only inside their own tests:

- **Criterion 3 — captured Maia identity.** Temporarily changed `DEFAULT_MAIA_IMAGE` to `chess-tabiya-maia:fixture-drift-demonstration`, then ran `ENGINES_REQUIRED=1 make verify`. The server test `pins captured Maia fixture identity to deployed instrument` failed with the captured `chess-tabiya-maia:1e13597` versus the changed production constant: **1 failed, 607 passed**. The constant was restored.
- **Criterion 6 — content patch versions are not runtime pins.** Temporarily incremented the patch component of all **25** committed `content/shapes/*.json` versions, then ran `pnpm exec vitest run packages/runtime/src --reporter=verbose`. The runtime package remained green: **25 files, 146 tests**. Every version edit was then restored. This is the required green mutation: changing content-owned versions does not break runtime-owned tests.
- **Criterion 8 — refusal discovery binds production.** Temporarily added `FIXTURE_REALISM_UNPINNED_DEMONSTRATION` as a real `SourcingError` emission and union member without adding a test disposition, then ran `ENGINES_REQUIRED=1 make verify`. `refusal-coverage.test.ts` failed because the discovered missing set gained that code while the frozen debt set did not: **1 failed, 607 passed**. Both temporary production edits were restored.
- **Criterion 11 — instrument-fed discovery binds production.** The prior test only called `unresolvedInstrumentFixtures` with a synthetic register entry; that proved the helper, not discovery. Production instrument-fed functions now carry an `@instrument-fed` marker, and the gate discovers those declarations. Temporarily added a second marked exported function without a register entry, then ran `ENGINES_REQUIRED=1 make verify`. `practical-difficulty.test.ts` failed with the register containing only `humanConcessionMass` while discovery also found `fixtureRealismSecondInstrument`: **1 failed, 607 passed**. The function was restored away.

The recursive refusal and content-test walkers also now exclude `node_modules` by directory name. Their result no longer depends on pnpm representing dependency trees as symlinks rather than real directories. After every mutation was reverted, the four focused suites passed **24/24**.

## 2026-08-15 — final completion verification

After the acceptance mutations were reverted, `ENGINES_REQUIRED=1 make verify` passed **608 tests across 98 files** with schema and packaging checks clean and Svelte at 0 errors / 0 warnings. `make test-browser` passed **24 tests at zero retries**; the existing optional Maia-profile test was the sole skip. The lifecycle is complete and its canonical rule is folded into `docs/development.md`; the D64 provenance behavior remains canonical in `docs/tablebase-grounding.md` and `docs/content-sourcing.md`.
