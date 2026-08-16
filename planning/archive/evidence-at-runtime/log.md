# Evidence at runtime — implementation log

## 2026-08-16 — review

Approved for implementation. The specified mechanism still matches the shipped seams. Open question 7 is explicitly non-blocking; the implementation keeps §3.8's structural rule: recorded readings never enter provider input and are appended as frozen prose afterward.

Post-graduation re-check: the evidence corpus remains 32 ledgers / 764 records (391 engine evaluations, 341 tablebase results, 32 legality records). The development registry denominator moved from the RFC's 53-document snapshot to 56 documents, and the graduation lifecycle re-stamped all ledgers. Acceptance measurements therefore report current derived values rather than bending code toward stale counts.

## 2026-08-16 — implementation and measurement

The load-time projection retains 732 admissible readings across 731 per-pack entries and 568
corpus-distinct positions. All 32 current ledgers pass both grounding and digest linkage; the
earlier 628-served snapshot is obsolete after Pack Graduation re-stamped the corpus. The
development registry reports 57 documents including the schema example.

One-ply enumeration over 497 authored spine positions measured 11,559 legal moves, 11,464
per-pack-distinct successor positions, 699 authored successors and 10,765 uncovered successors
(93.90%). Of 372 arrivals at a tablebase-indexed key, 43 were refused for a different halfmove
clock. The complete output and denominator distinction are recorded in `report.md`.

The first full gate exposed a test-fixture error: it tried the manual reveal API against a
`delayed_checkpoint` pack. The implementation was unchanged; the fixture now plays the actual
authored prefix through `plan-commitment`, proving the reading appears only after the pack's
real disclosure boundary.
