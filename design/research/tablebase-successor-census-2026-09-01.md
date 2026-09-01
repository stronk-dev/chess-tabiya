# Tablebase legal-successor census — complete on the accepted authored population

- **Date:** 2026-09-01
- **Question:** Q-17 / [[D110]] — does every choice-bearing authored tablebase position have a
  complete exact-legal-successor census?
- **Method:** run the accepted Stage-2 writer over every draft whose
  `objective.grading.assessedBy.kind` is `syzygy`, then independently join committed successor
  FENs to committed `tablebase_result` records with `make tablebase-census-check
  OUT=/tmp/tablebase-census-report.json`. `[V]`
- **Implementation boundary:** `apps/server/src/sourcing/tablebase-census.ts`; report schema
  `tabiya.sourcing.tablebase-census-report.v1`. `[V]`

## Scope correction

The **277** denominator in the Q-17 queue does not reproduce and is not used. The earlier
content-wave verification tried three explicit populations and found 199 authored start/spine
choice positions, 240 already-recorded choice anchors, or 2,473 positions after expanding a
one-ply frontier; none yielded 277. `[V]` `planning/content-wave-work-order.md` §Job B and its
2026-08-16 correction table.

This pass uses the population the accepted Stage-2 work order actually commissions: every
non-terminal authored start/spine position at seven pieces or fewer. It reports all such parents
and the choice-bearing subset separately. A parent is complete only when every exact legal
successor FEN—including distinct queen, rook, bishop, and knight promotions—has a committed
`tablebase_result`. `[V]` `rfc/feedback-delivery.md` §3.2;
`apps/server/src/sourcing/legal-moves.ts`; `apps/server/src/sourcing/claim-binding.ts`.

## Result

| Measurement | Before the wave | After the wave |
|---|---:|---:|
| Syzygy-assessed draft packs | 12 | **12** |
| Authored non-terminal parents | 235 | **235/235 fully censused** |
| Choice-bearing authored parents | 199 | **199/199 fully censused** |
| Single-legal-move parents | 36 | **36/36 fully censused** |
| Distinct successor slots, summed per pack | 2,888 | **2,888/2,888 recorded** |

The pre-wave mechanical reading was **0/199** for the choice-bearing authored population; the 36
trivially complete single-move parents were explicitly excluded from that numerator. `[V]`
`design/BACKLOG.md` [[D110]]'s corrected 2026-08-16 reading and
`planning/content-wave-work-order.md` §Job B. The post-wave figures above come from the new
read-only report and reproduce on a second invocation. `[V]`

All twelve pack rows are complete. The largest are the bishop-and-knight mate pair at 447 unique
successors each, queen-versus-pawn at 320, and king-and-queen mate at 325; the smallest is the
opposite-bishop fortress at 73. `[V]` `/tmp/tablebase-census-report.json`, produced by the command
above from committed-format working-tree sidecars.

## Instrument findings

The first two real runs exposed three authoring-tool defects before the wave continued. The writer
had no progress output ([[D2478]]), bypassed the provenance-complete cache it needed ([[D2477]]),
and initially counted cache hits as live queries ([[D2479]]). The repaired tool reports disjoint
`queried`, `cached`, and `ledger-reused` counts, charges only a source miss against the 400-query
ceiling, and refuses a cached envelope whose FEN or HTTP URL does not match the request. `[V]`
`apps/server/src/sourcing/tablebase-census.test.ts`.

The cache correction matters to evidence integrity, not only speed. A payload-only cache can
answer a research walk, but it cannot honestly create an evidence record because the original
source entry is missing. The new envelope stores the exact FEN, payload, and source provenance;
validated ledgers can hydrate it without synthesizing a retrieval event. `[V]`

## What this does and does not close

- **Q-17 is answered** for the accepted authored start/spine population: 199/199 choice-bearing
  parents and 2,888/2,888 successor slots are complete. `[V]`
- **[[D110]]'s mechanical census gap closes.** The seven full-set prose claims still require a
  human to decide and author exact claim spans/bindings; the writer deliberately creates no prose
  and no `claimBindings`. That residue stays with [[D476]]. `[V]`
- **[[D224]] does not close.** Exact-FEN records can legitimately remain multi-valued under a
  clock-stripping transposition key. This wave preserves full FEN identity rather than collapsing
  it. `[V]`
- **[[D225]] is not claimed fixed.** This checker measures the accepted authored parent set, not
  the wider 497-position cross-pack frontier in that row; a separate rerun must decide its current
  11.6% clock-mismatch observation. `[V]`
- The result adds machine evidence but does not by itself move `backedClaims`: law 8 still requires
  explicit, reviewed bindings before a learner-facing sentence may claim the census result. `[V]`

## Gate impact

- **B4 / Syzygy evidence reach:** the missing successor facts now exist for all accepted authored
  tablebase parents. Rendering and LLM delivery still depend on the evidence-to-module joins. `[V]`
- **Official content:** no pack graduates merely because records exist; blockers and unbound prose
  remain visible. `[V]`
- **K6:** this supplies the curated evidence population needed for a later discrimination test; it
  is not itself a learner-usefulness result. `[V]`
