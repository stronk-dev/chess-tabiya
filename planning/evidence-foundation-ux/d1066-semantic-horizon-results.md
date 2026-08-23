# D1066 semantic-horizon results

Depth-12 stageable within four plies: **56/64 (87.5%)**.

| phase | lines | stageable | reach |
|---|---:|---:|---:|
| opening | 24 | 22 | 91.7% |
| middlegame | 16 | 13 | 81.3% |
| cross_phase | 24 | 21 | 87.5% |

Both engine arms stageable: 44; same first projection: 37/44; same occurrence ply: 39/44.

Candidate horizon compile+selection: mean 329.3 ms, p95 799.4 ms per searched PV edge on this machine.

The compatibility arm applies shipped R2 after the Appendix-B projection filter. The reported reach arm additionally requires a literal actor/target before ranking and disables alternative-only avoidance, while preserving R2's 20%/cap-two rule. This is a research candidate, not a production policy. No LLM selects or labels an event. Sequence-only Wave-C motifs are outside `localSemanticEvents` and therefore outside these reach figures.
