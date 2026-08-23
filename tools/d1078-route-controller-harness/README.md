# D1078 route-controller harness

Disposable multi-ply generator. It calls only the local Tabiya Maia service and local Stockfish,
selects roots by the preregistered repository rule, and writes aggregate traces without changing
production code.

```sh
make up-engines
node tools/d1078-route-controller-harness/generate.mts
```

The hash-isolated monotone follow-up reuses the same generator and frozen roots:

```sh
TABIYA_D1080=1 node tools/d1078-route-controller-harness/generate.mts
```

The generated-candidate source/guard/fallback follow-up is:

```sh
TABIYA_D1084=1 node tools/d1078-route-controller-harness/generate.mts
```

D1084 uses a common pack/color/ply random quantile across sibling arms, converts chessops castling
identity to orthodox UCI only at the Stockfish boundary, and scores route candidates omitted from
the bounded MultiPV response in isolated searches. Its result earns only a route-source interface.

Every independent Stockfish search begins with `ucinewgame`, Clear Hash and a ready barrier; the
D1078 repeat and D1078/D1080 baseline traces are required to match.

The generated labels are literal finite-state route controllers. They do not establish a
personality, fun, coherence, strength label, or human likeness.
