# Evidence at runtime — final measurement

Measured on 2026-08-16 with `planning/evidence-at-runtime/measure.ts` against the committed
content corpus and the implemented load-time projection.

| Measure | Result |
|---|---:|
| Development-registry documents | 57 |
| Packs with admitted readings | 32 |
| Admitted readings | 732 |
| Per-pack index entries | 731 |
| Corpus-distinct indexed positions | 568 |
| Authored spine positions enumerated | 497 |
| Legal moves | 11,559 |
| Per-pack-distinct one-ply successors | 11,464 |
| Corpus-distinct one-ply successors | 7,589 |
| Authored successor positions | 699 |
| Uncovered successor positions | 10,765 (93.90%) |
| One-ply tablebase arrivals | 372 |
| Refused for halfmove-clock mismatch | 43 (11.56%) |

The per-pack successor sum is the delivery denominator because indexes are pack-local. The
corpus-wide count is reported separately and must not be substituted for it. Promotion moves
count once in the legal-move total and once per legal promotion role in distinct successor
positions.

A non-gating 2,000-packet median benchmark measured 1,846.31 ms without the index and
1,845.69 ms with it, a -0.31 microsecond-per-packet delta. That sign is measurement noise;
the result supports the structural expectation that one in-memory map lookup adds no visible
packet-construction cost. The retained script uses smaller samples so the measurement remains
cheap and is evidence, never a gate.

Pack Graduation re-stamped every committed ledger before this lifecycle landed. Therefore all
732 admissible readings are served under the digest conjunct; the RFC's earlier 628-served
snapshot is historical, not a target for the implementation.
