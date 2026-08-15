# Fixture realism implementation log

## 2026-08-15 — implementation opened

The final owner ruling replaces the unsatisfiable requirement that valid instrument output cross a safety bound. The implementation uses one float32 ulp of tolerance, a captured Maia vector near the valid-side boundary, and a minimal mutation of that vector to exercise the refusal side.

## 2026-08-15 — implementation landed

Recaptured the dossier's maximum-excess observation from the pinned Maia image: the 17-candidate vector sums to `1.0000000924631376`. Its JSON fixture records image, engine/model identity, request parameters, retrieval time, and info digest. The tolerance is now one float32 ulp (`2**-23`), 1.29x the observed excess. A one-ulp mutation of the captured vector crosses the bound and receives `POLICY_MASS_INVALID`; the server path converts the real vector into a named practical-resistance result rather than an uncoded throw.

Removed three content-version pins and added a behavioural guard over package tests that read content. Whole-tree discovery currently finds 196 named refusal emitters and records 108 without direct test disposition; regex-only dispositions are recognised by word boundary. `SourcingError.code` is now a closed 59-member union. The instrument-fed register resolves `humanConcessionMass` to the captured boundary fixture and mechanically rejects a missing second fixture.

Verification: `ENGINES_REQUIRED=1 make verify` green; `make test-browser` green at zero retries (25 tests, with the optional Maia case governed by the existing profile).
