# D3262 — provider-line occurrence arm on the selected frame

**2026-09-23 · first search-profile arm, full selected-candidate frame.** The frozen Stockfish 19
capture contains a ranked PV for every selected candidate at depth 8, depth 12, and 100 ms.
This diagnostic joins each of the 185 named target/candidate comparisons to all three budgets,
replays at most four legal PV plies, and records only whether the registered event *occurred on
that line*. It also retains all 14 selected candidates across the four special-control roots;
the 11 without a declared candidate-specific relation remain explicit no-target cases. The
196 distinct selected root/candidates are all covered. It never infers causality, all-defences
safety, or a move grade. `[V]`

The byte-checked artifact `d3262-provider-line-arm.json` is
`sha256:ddd6ee3e3094c4695df268b00a8a659d46728a3d8c1ebfac640e97abf5d524c7`.
All 555 named pair/budget cells and 42 control candidate/budget cells have a returned PV;
no selected candidate silently disappeared.
The source capture itself measured p95 212.74 ms (depth 8), 2,802.21 ms (depth 12), and
103.99 ms (100 ms), on its recorded local engine, but those are engine-probe latencies, **not**
hint-envelope or rendered-item latencies. `[V]` `d3262-stockfish-capture.md`.

| Budget | Positive registered material capture on PV | Available registered material capture *not* shown on PV | Named minor arrival on PV | Declared pawn capture after arrival on PV |
|---|---:|---:|---:|---:|
| Depth 8 | 29 / 53 | 24 / 53 | 1 / 87 | 0 / 32 source pawn controls |
| Depth 12 | 26 / 53 | 27 / 53 | 0 / 87 | 0 / 32 source pawn controls |
| 100 ms | 28 / 53 | 25 / 53 | 1 / 87 | 0 / 32 source pawn controls |

The lone minor arrival is a *natural alternative* (`b8d7 ...f1c4`), not one of the 32 source
pawn-denial controls, and its PV does not show the declared pawn capture. In particular, a
PV's failure to take an available positive capture is not evidence that the capture is bad or
unavailable. The depth-12 PV showing fewer registered captures than depth 8 is an occurrence
difference, not a quality ranking. `[V]`

The hard controls show the same single-line limitation. On the parried-fork candidate
`e6c7`, the depth-8 PV chooses `...Re1` and retains fork geometry on *that line*, while
depth 12 and 100 ms choose the exact `...Bxc7` refutation. The surviving-fork control
retains its geometric target on all three PVs, consistent with but weaker than its separate
all-reply proof. The `h3` bishop-pressure PV chooses `...Bxf3` at every budget, not the
declared `...Bh5` retreat; it cannot settle that branch's latent pin. Carlsbad's three
candidate PVs are `no_autonomous_target` by declaration: knight movement in a PV cannot
manufacture an authored plan. The other eight control candidates have no declared
candidate-specific target and are likewise abstentions. `[V]`

`make semantic-search-provider-line-arm` checks the exact artifact, replays every retained PV
prefix, and fails crossed FENs, illegal PV moves and silent candidate deletion. The named
target readings it joins are separately checked. This arm exposes why a root engine line alone
cannot ground the user's “why this move?” request: even the sealed pawn-control line is absent
from every PV in the captured budgets. The remaining exact/beam/mass/semantic arms must be
measured before choosing a production profile. [[D3262]]
