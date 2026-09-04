# Concept registry — first author repair

- **Date:** 2026-09-04
- **Repairs:** [[D2661]], [[D2662]], [[D2663]], [[D2664]], [[D2665]], [[D2666]]
- **Gate:** `make concept-registry-author-repair` — retained baseline 7/7, new 6/6
- **Disposition:** requirements-only repair; another genuinely fresh review remains mandatory

## Repair

The registry is now an append-only digest chain rather than one mutable file. Every ref names an
exact revision; label rename and retirement publish a new revision while historical refs continue
to render historical bytes. Removed/re-used IDs, missing/cyclic history and retirement reversal are
refused.

The data migration no longer treats two matching legacy strings as occurrence evidence. A sealed
attempt/run occurrence plus a compiled exact-digest pack artifact must prove the reference. Rows
whose historical artifact is unavailable—or whose globally valid ID was absent from that pack—move
atomically to a separate unverified quarantine and cannot feed related attempts, Campaign or Skills.
The migration is lossless without laundering legacy attribution into grounded evidence.

Six present consumers form the landing closure. Campaign and Skills are two explicit successor
discharges and must not be implemented as stubs or local maps here. Account semantics are narrowed
to the export/deletion contract that actually ships; portable account import remains a separately
tracked 1.0 gap and this RFC invents no restore route.

Finally, the stale migration-order assertions are corrected and the repair target is enrolled in
`verify-governance`, which is the GitHub job that owns RFC/process contracts. The preserved fresh-
review target still reproduces all six pre-repair failures from a fixed reviewed-contract image.

## Boundary

No production schema, registry content, compiler, migration, application, API, client, Campaign,
Skills, archive or protected-design byte changed. The shared-resource bootstrap and another fresh
review still gate implementation.
