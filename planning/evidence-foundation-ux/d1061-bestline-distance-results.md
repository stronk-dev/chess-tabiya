# D1061 bestline collection and hint-distance results

- Population: **64** positions ({"opening":24,"middlegame":16,"cross_phase":24})
- Fully legal, non-empty PVs: **100.0%**
- Depth 8→12 first-move agreement: **65.6%**
- 100 ms repeat first-move agreement: **100.0%**
- 100 ms→depth-12 first-move agreement: **92.2%**
- Durable content-ledger bestline records: **0**

## Disclosure ambiguity

| Interpretation | Mean legal candidates remaining |
|---|---:|
| square = origin | 4.03 |
| square = semantic destination | 1.83 |
| piece = exact piece | 4.03 |
| piece = role | 8.44 |
| move | 1.00 |

**Ply-distance is not derivable from beforeFen + movesUci without naming what event/target the distance is to.** PV length is a search artifact, not that missing semantic operand. The ruled ordering therefore fails payload sufficiency before any UI implementation.
