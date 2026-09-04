# Longitudinal store — seventh author repair

- **Date:** 2026-09-04
- **Repairs:** [[D2598]]–[[D2602]]
- **Status:** author repair complete; another genuinely fresh independent review is required
- **Gate:** `make longitudinal-store-seventh-author-repair` — 43 retained author controls, 5/5
  new controls and strict TypeScript

## Repair

The denominator invariant is now one three-layer rule: SQL, row parser and projector require
`0 < opportunities <= decisions`, exact opportunity/occurrence reference cardinality, and
occurrence membership in the opportunity set. Row and query parsers no longer accept a registry
argument; both close over the immutable compiled 67-row ingest/sign artifacts.

Source identity moves to a sealed v3 constructor. It consumes a parsed exact replay prefix and
joins owner, ordered move authorship, imported length and monotone structure disposition before
recursively copying/freezing the image. Only that value can be digested. Source-mutating storage
transactions carry co-located classified descriptors; a compiler checks the exact 11-symbol set in
both directions and no fictional startup operation remains.

The invalidator now uses the complete pending/running/complete/retry-wait/quarantined job union.
Changed source truth resets all non-pending states field-for-field, increments generation, clears
claim/failure/retry data, and makes every old renew/fail/publish receipt stale.

## Boundary and next action

No migration, worker, reader, consumer, API, client, content or protected-design byte landed.
Another genuinely fresh independent review must reconstruct all five repaired authorities before
acceptance or implementation.
