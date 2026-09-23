# D3262 / D3285 / D3288 / D3289 — coherent Stockfish first layers

**Measured 2026-09-23. Research source correction, not a five-arm result or
production search profile.** The frozen 66-root / 196-candidate population and
the old capture remain unchanged. Four new Stockfish 19 captures use the same
executable digest, one thread, 16 MB hash, hash clear between probes, identical
FENs and three declared budgets. The parser now retains the deepest *complete
single-depth* MultiPV table, recording a trailing incomplete depth separately.
The independent checker re-enumerates all legal moves, replays every retained PV,
binds the frozen manifest/child graph and source executable, and refuses mixed
depths, missing ranks or silently lost legal moves.

| Capture | Jobs | Ranked entries over depth 8 / depth 12 / 100 ms | SHA-256 |
|---|---:|---:|---|
| root, top eight | 66 | 1,584 | `d66614efdd9ea1cfa38e34c95459290b0a7d0a1c22fc371c18adbb8ee022340f` |
| child, top eight | 196 | 4,620 | `bc5b81cdadc8b8eb1080c9dfdf0aca9a6fbbfb16a359ef47d50a59ea772c3b28` |
| root, all legal | 66 | 6,039 | `790049cff06992eae6c48f7057d0b794c4388e503f2d76a59dfe64ce8dbe7c49` |
| child, all legal | 196 | 18,930 | `f25d3d6fa0ccf8a815cea53fd06085df56cad9a10308b597bd6d4579bbb55318` |

`make semantic-search-stockfish-coherent-impact-check` joins these sources to
the old all-legal captures and the frozen candidate frame. Its checked impact
artifact is `d3262-stockfish-coherent-impact.json`, SHA-256
`b4741f2ba4a2fc0b280693d42489632c31ab83ff21051ba3893d63b22216b674`.
The comparison is a source-sensitivity measurement, not a controlled causal
estimate of why the timed run changed.

| Comparison | Fixed depth 8 | Fixed depth 12 | 100 ms |
|---|---:|---:|---:|
| old all-legal → coherent all-legal, root best changed | 0/66 | 0/66 | 18/66 |
| old all-legal → coherent all-legal, child best changed | 0/196 | 0/196 | 63/196 |
| old all-legal → coherent all-legal, child top-eight order changed | 0/196 | 0/196 | 158/196 |
| coherent all-legal → coherent top-eight, root best changed | 25/66 | 14/66 | 22/66 |
| coherent all-legal → coherent top-eight, child best changed | 80/196 | 65/196 | 76/196 |

The old 100-ms top-eight rank depths were mixed on 29/66 roots and 73/196
children. But 11 of 18 changed root bests and 40 of 63 changed child bests had
an *unmixed* old top eight. Thus “mixed depth caused all rank changes” is
unsupported; elapsed-time scheduling and search progression also vary across
timed runs. Fixed-depth all-legal queries reproduce the old top-eight order
exactly, whereas top-eight versus all-legal MultiPV differs markedly even at a
fixed depth. Width is a provider configuration, not merely a display slice.

The corrected coherent all-legal 100-ms root best is absent from the frozen
196-candidate union at exactly three roots:

| Root | New root best |
|---|---|
| `d1023:32dbd41ca364bdb7` | `f7f5` |
| `d1023:e539b1202c9dcb20` | `f2f3` |
| `d1023:ef628fec1346fe49` | `e1e2` |

This is [[D3289]]: the existing five-arm frame remains a valid *frozen
sensitivity population*, but cannot claim to include every best move of the
corrected timed source. The three moves may not be added post-hoc to the frozen
frame. A full corrected candidate-union profile needs its own declaration and
downstream captures. Similarly, a top-eight beam must use its own top-eight
source, not call a truncated all-legal table the same provider authority
([[D3288]]). Neither source correction says which move is good, proves a
semantic reason, estimates human frequency, or meets interactive latency.

Remaining for [[D3262]]: choose and preregister an honest candidate/source
profile, run all five traversal and proof/abstention arms, compare bounded
counterfactuals without promoting partial lines into all-defence claims, and
measure cold/warm/offline end-to-end cost. Criterion 23 remains open.
