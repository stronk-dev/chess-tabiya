# Exact legal mobility implementation

**RFC:** `rfc/exact-legal-mobility.md`
**Started:** 2026-08-23
**State:** implementation complete; awaiting RFC Discharge D1

## Execution map

| slice | result | verification |
|---|---|---|
| shared authority | `packages/runtime/src/legal-moves.ts`; actual-turn map retains all piece rows, Chess960-safe king-to-rook identity separate from king destination, en-passant legality and four promotions | `legal-moves.test.ts` |
| consumers | web input, server sourcing, server legal-list/count paths, pivotal/tempo counts and semantic alternatives consume the authority | cross-layer fixture + package typechecks |
| projection | `rules.mobility.reading.legal_moves@1`, exact adapter, inspector-only and zero learner bindings | catalogue + adapter-closure tests |
| local enumerators | original 14 sites classified: eight migrated, six clone/bounded-search sites retained with named reasons | `enumerator-census.test.ts` |
| closeout | docs, D904/D1022/D1027/D1028/D1029, RFC/register and append-only log | status/register parity + verification |

The D1 learner binding remains intentionally undischarged. This implementation supplies the exact
operand and shared input authority; it does not choose a preset, reveal destinations at a higher
assistance ceiling or emit a proactive hint.
