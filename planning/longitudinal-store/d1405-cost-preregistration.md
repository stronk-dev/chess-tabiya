# D1405 — longitudinal projection cost preregistration

- **Frozen:** 2026-08-23, before timing the longitudinal projection shape
- **Purpose:** discharge B6 in `codex-buildability-review.md`
- **Instrument:** `tools/d1405-longitudinal-cost-harness/` (disposable research)
- **Production code:** none

## Question

Can the RFC's proposed synchronous write path recompute every prior decision and every legal
alternative after a run mutation while staying inside the existing **500 ms** post-move
server-side envelope? What work and stored-reference volume does the same shape impose on a fixed
bulk import?

This is a lower-bound measurement of the committed one-edge compiler. It is **not** acceptance
evidence for the repaired RFC: B2 establishes that the named compiler cannot construct 21 of the
67 registered event families. The final admitted constructor registry must re-run this instrument.

## Frozen source and population

Run from a clean extraction of the preregistration commit and record:

- its commit id;
- SHA-256 of `tools/r2-selection-harness/imported-sample.pgn`;
- one SHA-256 over `semantic-evidence.ts`, `legal-moves.ts` when present, and
  `tools/research-chess/populations.ts`;
- the exact selected game ids and ply counts.

The source is `importedPopulation().paths`, whose committed PGN contains 108 accepted games and
6,991 plies. Sort paths by their first row id, breaking ties by path length and the complete row-id
sequence.

### Native-run arms

For each target length **20, 40 and 80**, take the first **eight** sorted paths with at least that
many plies and project exactly that prefix once. A path may appear in more than one arm; this is a
length comparison, not three independent populations. Report p50/p95/max mutation latency,
decisions, legal alternatives, evaluated edges, emitted events and canonical reference bytes.

### Bulk-import arm

Take the first **25** sorted complete paths with at least 20 plies and project each complete path
once. Report per-game p50/p95/max, total wall time, games/second, plies, evaluated edges, emitted
events and canonical reference bytes. Do not shorten a complete selected game after reading cost.

## Frozen projection

For every played decision `(parentFen, uci, fen)`:

1. run `localSemanticEvents(parentFen, uci, fen)` for the played edge;
2. enumerate `legalAlternativeEdges(parentFen, uci)`;
3. run `localSemanticEvents` once for every alternative edge;
4. for reproducibility, sort canonical event-occurrence refs
   `{decisionId, projectionId, version, sign, eventId}` within each decision and retain the total
   count plus a digest over the ordered per-decision partitions; the raw alternative-event list is
   **not** the store shape;
5. project the RFC's actual row grain `(projectionId, version, phase, decisionClass=game)`: one
   opportunity ref per decision where any population edge exhibits the family, and one occurrence
   ref where the played edge does. Canonically sort those decision refs, serialize the two arrays
   with `JSON.stringify`, and count their UTF-8 bytes.

No engine, provider, network, database, LLM, avoidance relation or recorded-path constructor is
included. Exceptions fail the run rather than becoming empty events.

**Pre-binding instrument correction.** A discarded shared-tree smoke run initially counted one
stored ref per emitted alternative event. That is not the RFC schema: the schema stores a decision
ref once per family row. No smoke timing or byte result is evidence. The binding arms report both
the complete event-population count/digest and the deduplicated store-shaped row/ref bytes above.

For each native arm, also compute the exact cumulative replay counts implied by invoking this
whole-prefix projection after every mutation: prefix decisions are `N(N+1)/2`; evaluated-edge
work is the sum of each decision's played edge plus its legal alternatives multiplied by the
number of later prefixes that replay it. These are exact counts from the frozen paths, not latency
extrapolations.

## Able-to-fail clauses

1. If any 20-, 40- or 80-ply arm has p95 above **500 ms**, synchronous whole-prefix projection is
   refused for that length. The boundary comes from `design/02-product-shape.md`'s existing
   post-move/uncached server-side envelope; it is not relaxed after reading the result.
2. If 80-ply p95 is at least four times 20-ply p95, the observed shape is consistent with the
   RFC's linear-per-mutation full replay and the cumulative schedule is quadratic; the RFC must
   choose append/upsert or close/background rebuild even if absolute timing happens to pass on the
   measuring machine.
3. A zero-event family does not disappear from the reference grammar. Runtime family incidence is
   reported separately from the literal compiler/source digest.
4. The binding result must be produced from a clean extraction. Dirty-worktree diagnostics may be
   used only to debug the instrument and are never quoted as the result.
5. The repaired constructor registry must re-run the same arms. This lower-bound pass cannot clear
   B2, the missing avoidance/recorded-path adapters, or production database transaction cost.

## Decision rule

- **All native arms below 500 ms and sub-fourfold 20→80 growth:** whole-prefix projection remains
  a candidate, subject to the final-registry rerun and database measurement.
- **Any native arm above 500 ms or fourfold-or-greater growth:** synchronous whole-prefix replay is
  refused. Persist an incrementally derived decision append/upsert on the move path; keep a
  complete rebuild as the authoritative background/close operation.
- **Bulk cost only:** determines import scheduling and batch size; it never licenses blocking an
  interactive mutation.
