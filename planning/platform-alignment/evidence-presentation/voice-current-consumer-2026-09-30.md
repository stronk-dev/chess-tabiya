# Voice current-consumer migration — 2026-09-30

**Scope:** `rfc/evidence-presentation.md` implementing checkpoint; not RFC completion or a 1.0 support claim.

## Production path

`voiceEvidenceView` and `renderedEvidenceItems` now take the compiled consumer admission through
`presentEvidenceItems`, read each registered component's equivalent sentence, join it to its exact
process-local evidence owner, and construct the sealed `RenderedEvidenceView` consumed by the
external provider and `voiceCheck`. Reading, Story and Compare voice no longer maintain a parallel
server-side template registry. Repeated evidence with the same projection remains distinct by
owner identity; a component outside the admitted view is refused.

The same registered copy also serves deterministic fallback and speech's checked displayed text.
Position phase, pack focus, named structure, recorded branch facts and centipawn magnitudes were
worded for a player (including explicit pawn units) at their registered renderers. The named-
structure fixture now carries the required witness square and catalogue-correct label; the old
fixture's missing square had been accepted only by the legacy name-only renderer.

## Deliberate residuals

`guidance.recorded_reading@1` stays a separately admitted, deterministic suffix **after** provider
rendering. Its current registered engine magnitude drops `retrievedAt`, while the existing spoken
sentence says when the pack-authoring reading was taken. Migrating it as-is would erase provenance;
[[D3307]] owns a date-bearing component contract and hard negative before that path moves. It
remains outside provider input by design. Inspector-modal legacy sections, raw-id leak fixes,
evidence-presentation D1/D9 and the owner's D1639 context ceiling remain open. No official pack
graduated, no milestone was promoted, and no new strategic judgement was introduced.

## Verification

- `make verify-content`: 22 files / 218 tests green and the 92-document graduation corpus check
  has no errors, including production REST voice and speech behavior, provider rejection/fallback,
  no-result Compare endpoint, and two-claims/same-projection and zero-step voice fixtures.
- `make verify-software`: typecheck; 296 files / 2,464 software tests; 4 files / 7 performance
  tests; packaging, release policy, label sweep, 91 ordinary / 115 Inspector / 5 author / 223 module
  pair coverage, manifest and build checks green. The seven pre-existing Svelte warnings remain.
- `make test-browser-ci`: smoke 55 passed / one optional latency probe skipped; real-content 5,
  responsive matrix 48 and packaged production 1 passed. These prove existing journeys continue
  through the changed component copy; they are not a new owner-use comprehension result.
- `make roadmap-check`, `make work-state`, `make work-index` and `make verify-governance`: green on
  the closeout bytes. The first governance run correctly refused [[D3307]] as unrouted; its active
  RFC follow-up now owns it, and the second run is the reported green result.
