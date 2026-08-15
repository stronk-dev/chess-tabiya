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
