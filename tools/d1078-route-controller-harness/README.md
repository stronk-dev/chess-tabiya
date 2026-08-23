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

Every independent Stockfish search begins with `ucinewgame`, Clear Hash and a ready barrier; the
D1078 repeat and D1078/D1080 baseline traces are required to match.

The generated label is a literal finite-state route controller. It does not establish a
personality, fun, coherence, strength label, or human likeness.
